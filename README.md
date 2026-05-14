# 📓 Alpha Journal

**AI-Powered Decentralized Trading Diary - Built on 0G Chain**

Alpha Journal is an intelligent trading journal that lets crypto traders capture their market theses, trade rationales, and alpha insights in natural language. Every conversation is cryptographically anchored on the **0G Aristotle Mainnet** via the **MemoriaDA** protocol, creating a tamper-proof, verifiable record of your trading decisions.

> *"Why did I short BTC last month?"* - Alpha remembers.

---

## ✨ Features

### 🧠 AI-Powered Memory Recall
- Chat with **Alpha**, your AI trading companion that remembers every thesis, setup, and market read
- Vector similarity search across your entire journal history
- Context-aware responses that reference your past entries naturally

### �- Onchain Memory Anchoring
- Every journal entry is uploaded to **0G Decentralized Storage**
- Merkle roots are committed to the **0G Chain** via the MemoriaDA Registry
- Each anchored memory includes a verifiable explorer link

### 🔐 Wallet-Native Authentication
- No emails, no passwords - your wallet is your identity
- MetaMask auto-switching to 0G Mainnet
- Session isolation per wallet address

### 💬 Multi-Session Management
- Create, rename, pin, and delete journal sessions
- Full session search and organization
- Persistent session history per wallet

### 💎 Subscription & Access Tiers
- **Free Tier**: 3 messages to try the experience
- **Subscriber**: 0.1 0G token / month for unlimited access
- **Holder**: Hold 0.2+ 0G tokens for lifetime access
- Onchain access verification via the AlphaJournalAccess smart contract

---

## �-️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Vite + React)         │
│  Landing Page → Wallet Connect → Chat Interface  │
│  Sidebar / Sessions / PaywallModal / StatusBar   │
└──────────────────┬──────────────────────────────┘
                   │  /api/*
┌──────────────────▼──────────────────────────────┐
│              Backend (Express.js)                 │
│                                                   │
│  /api/chat          → OpenAI (GPT-4o-mini)       │
│  /api/memory/store  → 0G Storage + Chain Anchor  │
│  /api/access/check  → Onchain subscription      │
│  /api/status        → Live onchain stats         │
└──────┬───────────────────┬──────────────────────┘
       │                   │
┌──────▼──────┐    ┌───────▼──────────────────────┐
│  0G Storage  │    │  0G Chain (Aristotle Mainnet) │
│  Blob Upload │    │  MemoriaDA Registry v2        │
│  Merkle Tree │    │  AlphaJournalAccess Contract  │
└─────────────┘    └──────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Lucide Icons |
| Backend | Express.js, Node 20+ |
| AI | OpenAI GPT-4o-mini (via compatible API) |
| Blockchain | ethers.js v6, 0G Chain (EVM) |
| Storage | 0G Decentralized Storage (`@0gfoundation/0g-ts-sdk`) |
| Registry | MemoriaDA Registry V2 (shared contract) |
| Auth | Native wallet connection (MetaMask) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (required by 0G SDK)
- **MetaMask** or any EVM-compatible wallet
- **0G Tokens** on Aristotle Mainnet (for subscriptions/anchoring)

### 1. Clone & Install

```bash
git clone https://github.com/bigmantech001/AlphaJournal.git
cd AlphaJournal
npm install
```

### 2. Configure Environment

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

# Access Contract (if deployed)
ACCESS_CONTRACT_ADDRESS=<your_access_contract_address>
VITE_ACCESS_CONTRACT=<your_access_contract_address>
```

> ⚠️ The server wallet (`VITE_PRIVATE_KEY`) must be funded with at least **0.1 0G** on mainnet to cover agent registration and memory anchoring fees.

### 3. Run Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Backend (Express API server)
npm run server

# Terminal 2 - Frontend (Vite dev server)
npm run dev
```

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3002

---

## 📡 Network Configuration

Alpha Journal runs on the **0G Aristotle Mainnet**:

| Parameter | Value |
|-----------|-------|
| Network Name | 0G-Mainnet (Aristotle) |
| Chain ID | `16661` (`0x4115`) |
| RPC URL | `https://evmrpc.0g.ai` |
| Block Explorer | `https://chainscan.0g.ai` |
| Native Token | 0G (18 decimals) |

### Storage Infrastructure

| Parameter | Value |
|-----------|-------|
| Indexer RPC | `https://indexer-storage-turbo.0g.ai` |
| Flow Contract | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` |

---

## 📜 Smart Contracts

### MemoriaDA Registry V2 (Shared)

The shared registry contract that anchors memory roots onchain. Alpha Journal's agent identity:

| Field | Value |
|-------|-------|
| Contract | [`0xD896D59583C137D6ca2c5e3add025e143eD1030d`](https://chainscan.0g.ai/address/0xD896D59583C137D6ca2c5e3add025e143eD1030d) |
| Agent ID | `alpha_journal_agent_v1` |
| Framework | `AlphaJournal` |

Key functions used:
- `registerAgent(agentId, framework)` - One-time agent registration (mints ERC-721 NFT)
- `updateMemoryRoot(agentId, rootHash, vectorCount)` - Anchor a memory (0.001 0G fee)
- `getAgent(agentId)` - Query agent state
- `verifyMemoryRoot(agentId, rootHash)` - Verify a specific memory root

### AlphaJournalAccess

Subscription/access control contract managing user tiers:
- `subscribe()` - Pay subscription fee for 30 days of access
- `getAccessInfo(address)` - Check user's access status, expiry, and balance

---

## 🔄 Memory Flow

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

## 🚢 Deployment (Railway)

### Environment Variables

Set all `.env` variables in Railway's dashboard.

### Configuration

The `package.json` includes:
- `"engines": { "node": ">=20.0.0" }` - Required for 0G SDK compatibility
- `"start": "node server/index.js"` - Railway start command

### Build & Deploy

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

The Express server serves the API endpoints. In production, configure a reverse proxy or static file serving for the built frontend.

---

## 📁 Project Structure

```
AlphaJournal/
├── .env                          # Environment configuration (gitignored)
├── .gitignore
├── index.html                    # Vite entry HTML
├── package.json
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
│   ├── registryAnchor.js         # MemoriaDA registry interaction
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

## �- Related Projects

- **[MemoriaDA](https://memoriada.xyz)** - Decentralized memory anchoring protocol
- **[0G Labs](https://0g.ai)** - Modular AI blockchain infrastructure

---

## 📄 License

MIT

---

<p align="center">
  <strong>Built for the 0G APAC Hackathon 2026</strong><br/>
  <em>Powered by MemoriaDA Protocol on 0G Chain</em>
</p>
