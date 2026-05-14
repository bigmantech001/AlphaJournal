// ============================================================
// Alpha Journal - Backend Server
// Powered by MemoriaDA Protocol
// ============================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import { uploadMemoryBlob } from './storageUpload.js';
import { ensureAgentRegistered, anchorMemoryRoot } from './registryAnchor.js';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3002;

// AI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const AGENT_ID = 'alpha_journal_agent_v1';
const FRAMEWORK = 'AlphaJournal';
let memoryCount = 0;

// ── Persistent unique users tracking ───────────────────
const __fn = fileURLToPath(import.meta.url);
const __dn = path.dirname(__fn);
const USERS_FILE = path.join(__dn, '..', '.users.json');

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return new Set(JSON.parse(raw));
  } catch { return new Set(); }
}

function saveUsers(set) {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify([...set])); } catch {}
}

const uniqueUsers = loadUsers();

// ── Real onchain stats cache ──────────────────────────
let onChainStats = { memoryCount: 0, agentCount: 0, lastFetched: 0 };

async function fetchOnChainStats() {
  try {
    const registryAddress = process.env.VITE_REGISTRY_ADDRESS;
    if (!registryAddress) return;

    const REGISTRY_ABI = [
      'function getAgent(string agentId) external view returns (address, string, bytes32, uint256, uint256)',
      'function getAgentCount() external view returns (uint256)',
    ];

    const provider = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');
    const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);

    // Fetch agent data for AlphaJournal
    try {
      const [, , , vectorCount] = await registry.getAgent(AGENT_ID);
      onChainStats.memoryCount = Number(vectorCount);
    } catch {
      // Agent might not be registered yet
    }

    // Fetch total agent count across the registry
    try {
      const count = await registry.getAgentCount();
      onChainStats.agentCount = Number(count);
    } catch {}

    onChainStats.lastFetched = Date.now();
    console.log(`[Stats] Onchain: ${onChainStats.memoryCount} memories, ${onChainStats.agentCount} agents`);
  } catch (err) {
    console.error('[Stats] Failed to fetch onchain stats:', err.message);
  }
}

// Fetch on startup and every 60 seconds
fetchOnChainStats();
setInterval(fetchOnChainStats, 60_000);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '5mb' }));

// ── Health / Stats ─────────────────────────────────────
app.get('/api/status', (req, res) => {
  // memoryCount: use onchain vectorCount (real anchored memories)
  // Fall back to in-memory count if onchain hasn't been fetched yet
  const totalMemories = Math.max(onChainStats.memoryCount, memoryCount);

  res.json({ 
    status: 'ok', 
    agent: AGENT_ID, 
    memoryCount: totalMemories,
    userCount: uniqueUsers.size,
    agentCount: onChainStats.agentCount,
    lastUpdated: onChainStats.lastFetched,
  });
});

// ── AI Chat ─────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: 'messages required' });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });

    res.json({
      content: completion.choices[0].message.content,
      model: completion.model,
    });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Store Memory on 0G Storage + Anchor on Chain ────────
app.post('/api/memory/store', async (req, res) => {
  try {
    const { content, embedding, metadata } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });

    // 1. Build the memory payload
    const memoryPayload = {
      protocol: 'memoria-da',
      version: '1.0.0',
      app: 'alpha-journal',
      timestamp: new Date().toISOString(),
      agentId: AGENT_ID,
      content,
      embedding: embedding || [],
      metadata: metadata || {},
    };

    // 2. Upload to 0G Storage
    console.log('[Memory] Uploading to 0G Storage...');
    const uploadResult = await uploadMemoryBlob(JSON.stringify(memoryPayload));
    console.log(`[Memory] Stored ✓ root: ${uploadResult.rootHash.slice(0, 16)}...`);

    // 3. Ensure agent is registered onchain
    await ensureAgentRegistered(AGENT_ID, FRAMEWORK);

    // 4. Anchor memory root onchain
    memoryCount++;
    console.log('[Memory] Anchoring on 0G Chain...');
    const anchorResult = await anchorMemoryRoot(AGENT_ID, uploadResult.rootHash, memoryCount);
    console.log(`[Memory] Anchored ✓ ${anchorResult.blockLabel} | ${anchorResult.explorerUrl}`);

    res.json({
      rootHash: uploadResult.rootHash,
      blobSize: uploadResult.blobSize,
      blockLabel: anchorResult.blockLabel,
      explorerUrl: anchorResult.explorerUrl,
      txHash: anchorResult.txHash,
      memoryCount,
    });
  } catch (err) {
    console.error('[Memory] Error:', err.message);
    // Still return partial success if storage worked but chain failed
    res.status(500).json({ error: err.message });
  }
});

// ── Access Check (Onchain subscription/balance) ────────

const ACCESS_ABI = [
  'function isActive(address user) external view returns (bool)',
  'function getAccessInfo(address user) external view returns (bool isActiveNow, uint256 expiry, uint256 balance, bool isLifetime)',
  'function getExpiry(address user) external view returns (uint256)',
];

const RPC_URL = 'https://evmrpc.0g.ai';
const ACCESS_CONTRACT = process.env.ACCESS_CONTRACT_ADDRESS || '';

// Thresholds (in wei)
const HOLDER_THRESHOLD = ethers.parseEther('0.2');   // 0.2 0G = lifetime / holder
const SUB_FEE          = ethers.parseEther('0.1');   // 0.1 0G = subscription cost

app.get('/api/access/check', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Valid address required' });
    }

    uniqueUsers.add(address.toLowerCase());
    saveUsers(uniqueUsers);

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // ── If the access contract is deployed, use onchain logic ──
    if (ACCESS_CONTRACT) {
      const contract = new ethers.Contract(ACCESS_CONTRACT, ACCESS_ABI, provider);
      const [isActiveNow, expiry, balance, isLifetimeOnChain] = await contract.getAccessInfo(address);

      // The deployed contract may have outdated thresholds.
      // Apply the server-side holder threshold as the source of truth.
      const isHolder = balance >= HOLDER_THRESHOLD;
      const isActive = isHolder || isActiveNow;
      const hasSubscription = Number(expiry) > Math.floor(Date.now() / 1000);

      const tier = isHolder ? 'holder' : hasSubscription ? 'subscriber' : 'free';

      res.json({
        isActive,
        expiry: Number(expiry),
        balance: balance.toString(),
        isLifetime: isHolder,
        tier,
      });
      return;
    }

    // ── No contract deployed - fall back to native balance check ──
    console.warn('[Access] Contract not deployed - using balance-only check');
    const balance = await provider.getBalance(address);

    const isHolder = balance >= HOLDER_THRESHOLD;  // ≥ 2 0G → holder / lifetime
    const isActive = isHolder;                     // Only holders get access without contract

    res.json({
      isActive,
      expiry: 0,
      balance: balance.toString(),
      isLifetime: isHolder,
      tier: isHolder ? 'holder' : 'free',
      warning: 'Access contract not deployed - using balance check only',
    });
  } catch (err) {
    console.error('[Access] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Serve Frontend (Production) ─────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  ALPHA JOURNAL - Backend Server');
  console.log('  Powered by MemoriaDA Protocol');
  console.log('═══════════════════════════════════════════');
  console.log(`  Listening: http://localhost:${PORT}`);
  console.log(`  Agent ID:  ${AGENT_ID}`);
  console.log(`  Network:   0G Mainnet (Aristotle)`);
  console.log('');
});
