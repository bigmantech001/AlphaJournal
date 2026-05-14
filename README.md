# Alpha Journal

**AI trading diary with permanent, verifiable memory on 0G Chain — your alpha, cryptographically secured forever.**

> **0G APAC Hackathon 2026 — Track 3: Agentic Economy & Autonomous Applications**

---

## Problem

Crypto traders make hundreds of decisions but can't recall *why*. Trading journals are centralized, siloed, and lost when platforms shut down. There's no way to prove what you believed at a given moment — your trading reasoning disappears.

## Solution

Alpha Journal is an AI-powered trading diary where every conversation is automatically stored on **0G Decentralized Storage** and anchored on **0G Chain** via the MemoriaDA protocol. The AI recalls your past trades, challenges your theses, and creates a tamper-proof, verifiable record of every trading decision you've ever logged.

> *"Why did I short BTC last month?"* — Alpha remembers.

### 0G Components Used

| Component | Usage |
|-----------|-------|
| **0G Storage** | Every journal entry is uploaded as a Merkle-verified memory blob to 0G's decentralized storage network |
| **0G Chain** | Agent Identity NFT (ERC-721) minted via MemoriaDA Registry + memory roots anchored onchain per conversation |
| **0G Chain** | AlphaJournalAccess smart contract handles subscription payments and holder verification natively onchain |

---

## Live Demo

| Resource | Link |
|----------|------|
| **Live App** | [alphajournal.online](https://alphajournal.online) |
| **GitHub** | [github.com/bigmantech001/AlphaJournal](https://github.com/bigmantech001/AlphaJournal) |
| **Demo Video** | [Watch on YouTube](TODO_ADD_DEMO_VIDEO_LINK) |
| **Public X Post** | [View on X](TODO_ADD_X_POST_LINK) |
| **MemoriaDA Protocol** | [memoriada.xyz](https://memoriada.xyz) |

---

## Traction (Real Usage on 0G Mainnet)

All numbers below are verifiable onchain. No fabricated claims.

| Metric | Value | Proof |
|--------|-------|-------|
| **Mainnet Contracts Deployed** | 2 (Registry + Access) | See contract addresses below |
| **Onchain Transactions** | Verifiable on ChainScan | [MemoriaDA Registry](https://chainscan.0g.ai/address/0xD896D59583C137D6ca2c5e3add025e143eD1030d) |
| **Memory Anchors Committed** | Multiple `updateMemoryRoot` calls | Each costs 0.001 0G micropayment |
| **Agent Identity NFT** | `alpha_journal_agent_v1` minted | ERC-721 on 0G Chain |
| **Subscription Revenue** | Real 0G collected onchain | [Access Contract](https://chainscan.0g.ai/address/0x60A0018b66650Af2c2ADE567993d57AA952561C5) |
| **Active Wallets** | Multiple unique wallets interacting | Tracked via server + onchain |
| **Live Deployment** | Production on Railway | [alphajournal.online](https://alphajournal.online) |

---

## 0G Integration Proof

### Deployed Mainnet Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| **MemoriaDA Registry V2** (Shared) | `0xD896D59583C137D6ca2c5e3add025e143eD1030d` | [View on ChainScan](https://chainscan.0g.ai/address/0xD896D59583C137D6ca2c5e3add025e143eD1030d) |
| **AlphaJournalAccess** | `0x60A0018b66650Af2c2ADE567993d57AA952561C5` | [View on ChainScan](https://chainscan.0g.ai/address/0x60A0018b66650Af2c2ADE567993d57AA952561C5) |

### How Each 0G Component Is Used

**0G Storage** — [`server/storageUpload.js`](./server/storageUpload.js)
- Every user message + AI response is serialized as a JSON memory blob
- Blob is uploaded to 0G's decentralized storage via `@0gfoundation/0g-ts-sdk`
- Merkle tree verification ensures data integrity
- Storage indexer: `https://indexer-storage-turbo.0g.ai`
- Flow contract: `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526`

**0G Chain (Memory Anchoring)** — [`server/registryAnchor.js`](./server/registryAnchor.js)
- Agent identity `alpha_journal_agent_v1` registered as an ERC-721 NFT on MemoriaDA Registry
- After each conversation, the Merkle root hash + vector count is committed onchain
- Each anchor costs 0.001 0G (micropayment fee), creating real protocol revenue
- Users see a verifiable explorer link after every anchored memory

**0G Chain (Access Control)** — [`contracts/AlphaJournalAccess.sol`](./contracts/AlphaJournalAccess.sol)
- Smart contract manages subscription payments (0.1 0G/month) and holder verification (0.2+ 0G = lifetime)
- `subscribe()` — user pays onchain, gets 30 days of unlimited access
- `getAccessInfo(address)` — backend verifies access status onchain before granting entry
- Real revenue collected in 0G tokens

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Frontend (Vite + React)               │
│  Landing Page → Wallet Connect → Chat Interface      │
│  Sidebar / Sessions / PaywallModal / StatusBar       │
└──────────────────┬──────────────────────────────────┘
                   │  /api/*
┌──────────────────▼──────────────────────────────────┐
│              Backend (Express.js)                     │
│                                                       │
│  /api/chat          → AI Inference (GPT-4o-mini)     │
│  /api/memory/store  → 0G Storage + Chain Anchor      │
│  /api/access/check  → Onchain subscription check     │
│  /api/status        → Live onchain stats             │
└──────┬───────────────────┬──────────────────────────┘
       │                   │
┌──────▼──────┐    ┌───────▼──────────────────────────┐
│  0G Storage  │    │  0G Chain (Aristotle Mainnet)     │
│  Blob Upload │    │  MemoriaDA Registry V2            │
│  Merkle Tree │    │  AlphaJournalAccess Contract      │
└─────────────┘    └──────────────────────────────────┘
```

### Memory Flow (Per Conversation)

```
User sends message
       │
       ▼
┌──────────────────┐
│ 1. AI Response   │  GPT-4o-mini generates context-aware reply
│    (instant)     │  using vector-searched past memories
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 2. 0G Storage    │  Conversation blob uploaded to decentralized
│    Upload        │  storage, Merkle tree generated
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 3. Chain Anchor  │  Merkle root + vector count committed to
│    (0.001 0G)    │  MemoriaDA Registry on 0G Chain
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 4. Explorer Link │  User gets verifiable tx link:
│                  │  chainscan.0g.ai/tx/0x...
└──────────────────┘
```

---

## Features

- **AI Memory Recall** — Ask "Why did I enter that trade?" and Alpha recalls your exact reasoning from months ago using vector similarity search
- **Onchain Memory Anchoring** — Every journal entry uploaded to 0G Storage with Merkle roots committed to 0G Chain
- **Wallet-Native Auth** — No emails, no passwords. Your wallet is your identity with auto-switching to 0G Mainnet
- **Multi-Session Management** — Create, rename, pin, and delete journal sessions with full search
- **Subscription Economy** — Free tier (3 messages), Subscriber (0.1 0G/month), Holder (0.2+ 0G lifetime)
- **Mobile Responsive** — Full mobile layout with slide-out sidebar drawer and optimized chat interface
- **Session Isolation** — Each wallet address has completely isolated session data
- **Real-Time Status** — Live onchain stats (memory count, active traders) displayed in the UI

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Lucide Icons |
| Backend | Express.js, Node 20+ |
| AI | OpenAI GPT-4o-mini (via compatible API) |
| Blockchain | ethers.js v6, 0G Chain (EVM) |
| Storage | 0G Decentralized Storage (`@0gfoundation/0g-ts-sdk`) |
| Registry | MemoriaDA Registry V2 (shared onchain contract) |
| Access | AlphaJournalAccess.sol (Solidity 0.8.20) |
| Auth | Native wallet connection (MetaMask) |
| Deployment | Railway (Node.js) |

---

## Local Setup (For Judges)

### Prerequisites

- **Node.js 20+** (required by 0G SDK)
- **MetaMask** or any EVM-compatible wallet
- **0G Tokens** on Aristotle Mainnet ([get free tokens](https://faucet.memoriada.xyz))

### Step 1: Clone & Install

```bash
git clone https://github.com/bigmantech001/AlphaJournal.git
cd AlphaJournal
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the project root:

```env
# AlphaJournal - 0G Mainnet Configuration
VITE_PRIVATE_KEY=<your_server_wallet_private_key>

# MemoriaDA Shared Registry (DO NOT CHANGE)
VITE_REGISTRY_ADDRESS=0xD896D59583C137D6ca2c5e3add025e143eD1030d

# 0G Mainnet RPC
VITE_RPC_URL=https://evmrpc.0g.ai
VITE_CHAIN_ID=16661

# 0G Storage (Mainnet)
VITE_INDEXER_RPC=https://indexer-storage-turbo.0g.ai
VITE_FLOW_CONTRACT=0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526

# AI Inference
OPENAI_API_KEY=<your_openai_api_key>
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

PORT=3002

# Access Contract (deployed on 0G Mainnet)
ACCESS_CONTRACT_ADDRESS=0x60A0018b66650Af2c2ADE567993d57AA952561C5
VITE_ACCESS_CONTRACT=0x60A0018b66650Af2c2ADE567993d57AA952561C5
```

> ⚠️ The server wallet (`VITE_PRIVATE_KEY`) must be funded with at least **0.1 0G** on mainnet to cover agent registration and memory anchoring fees.

### Step 3: Run

```bash
# Start both frontend and backend concurrently
npm run dev:all
```

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3002

### Step 4: Test the Flow

1. Open the app in your browser
2. Click **"Launch App"** on the landing page
3. Click **"Connect Wallet"** — MetaMask will prompt to add 0G network
4. Type a trading thesis in the chat
5. Watch as Alpha responds, then the memory is:
   - Uploaded to **0G Storage** (Merkle blob)
   - Anchored on **0G Chain** (registry transaction)
   - Verified with an **explorer link** in the chat

> **Judge tip**: You can also try the live deployment at [alphajournal.online](https://alphajournal.online) without any local setup.

---

## Network Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | 0G-Mainnet (Aristotle) |
| Chain ID | `16661` (`0x4115`) |
| RPC URL | `https://evmrpc.0g.ai` |
| Block Explorer | `https://chainscan.0g.ai` |
| Native Token | 0G (18 decimals) |
| Storage Indexer | `https://indexer-storage-turbo.0g.ai` |
| Flow Contract | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` |

---

## Project Structure

```
AlphaJournal/
├── .env                          # Environment configuration (gitignored)
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite config with proxy & polyfills
├── hardhat.config.cjs            # Hardhat config for contract deployment
│
├── contracts/
│   └── AlphaJournalAccess.sol    # Subscription access control contract
│
├── scripts/
│   ├── deploy.cjs                # Hardhat deploy script
│   └── deploy-direct.cjs         # Direct deploy with ethers.js
│
├── server/
│   ├── index.js                  # Express API server (chat, memory, access)
│   ├── registryAnchor.js         # MemoriaDA registry interaction (0G Chain)
│   └── storageUpload.js          # 0G Storage blob upload
│
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # App root (routing, wallet, sessions)
    ├── App.css                   # Global styles (cyberpunk theme)
    ├── components/
    │   ├── ChatPanel.jsx         # Chat interface with MemoriaDA pipeline
    │   ├── LandingPage.jsx       # Marketing landing page
    │   ├── PaywallModal.jsx      # Subscription/access modal
    │   ├── Sidebar.jsx           # Session management sidebar
    │   └── StatusBar.jsx         # Network status indicator
    └── services/
        ├── apiClient.js          # Frontend → Backend API calls
        ├── accessService.js      # Access check with caching
        └── memoryStore.js        # In-browser vector search index
```

---

## Production Deployment (Railway)

### Build & Deploy

```bash
npm run build    # Build frontend
npm start        # Start production server (node server/index.js)
```

### Required Environment Variables

Set all `.env` variables in Railway's dashboard. Key settings:
- `"engines": { "node": ">=20.0.0" }` — Required for 0G SDK compatibility
- `"start": "node server/index.js"` — Railway start command

---

## Related Projects

- **[MemoriaDA](https://memoriada.xyz)** — Decentralized memory anchoring protocol (parent infrastructure)
- **[SolTutor](https://soltutor.memoriada.xyz)** — AI Solidity tutor built on MemoriaDA
- **[0G Token Faucet](https://faucet.memoriada.xyz)** — Free mainnet tokens for testing
- **[0G Labs](https://0g.ai)** — Modular AI blockchain infrastructure

---

## License

MIT

---

<p align="center">
  <strong>Built for the 0G APAC Hackathon 2026 — Track 3: Agentic Economy</strong><br/>
  <em>Powered by MemoriaDA Protocol on 0G Aristotle Mainnet</em>
</p>
