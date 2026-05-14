import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import LandingPage from './components/LandingPage';
import memoryStore from './services/memoryStore';
import {
  checkAccess,
  clearAccessCache,
  getMessageCount,
  incrementMessageCount,
  FREE_MESSAGE_LIMIT,
} from './services/accessService';
import './App.css';

/* ── Session helpers ─────────────────────────────────────── */

function generateId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function getDateLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function createSession(title) {
  return {
    id: generateId(),
    title: title || 'New Session',
    messages: [],
    messageCount: 0,
    dateLabel: getDateLabel(),
    createdAt: Date.now(),
    pinned: false,
  };
}

function getStorageKey(address) {
  if (!address) return null;
  return `aj_sessions_${address.toLowerCase()}`;
}

function loadSessions(address) {
  const key = getStorageKey(address);
  if (key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return [createSession('New Session')];
}

function saveSessions(sessions, address) {
  const key = getStorageKey(address);
  if (key) {
    try { localStorage.setItem(key, JSON.stringify(sessions)); } catch {}
  }
}

/* ── Minimal wallet connection (no external library needed) ── */
async function connectWallet() {
  if (!window.ethereum) {
    alert('No wallet detected. Please install MetaMask or another Web3 wallet.');
    return null;
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts?.[0] || null;
}

const ZG_CHAIN_ID = '0x4115'; // 16661 in hex

async function switchToZGChain() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ZG_CHAIN_ID }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: ZG_CHAIN_ID,
          chainName: '0G-Mainnet (Aristotle)',
          nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
          rpcUrls: ['https://evmrpc.0g.ai'],
          blockExplorerUrls: ['https://chainscan.0g.ai'],
        }],
      });
    }
  }
}

/* ══════════════════════════════════════════════════════════ */

export default function App() {
  const [page, setPage] = useState('landing');
  const [walletAddress, setWalletAddress] = useState(null);
  const [sessions, setSessions] = useState(() => [createSession('New Session')]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [memoryCount, setMemoryCount] = useState(memoryStore.count);
  const [accessInfo, setAccessInfo] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const prevWalletRef = useRef(null);

  const authenticated = !!walletAddress;
  const userId = walletAddress;

  // Auto-navigate to app if wallet was previously connected
  useEffect(() => {
    const saved = localStorage.getItem('aj_wallet');
    if (saved && page === 'landing') {
      setPage('app');
    }
  }, []);

  // Restore wallet from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('aj_wallet');
    if (saved) setWalletAddress(saved);
  }, []);

  // Load sessions for the current wallet whenever walletAddress changes
  useEffect(() => {
    // Save sessions for the previous wallet before switching
    if (prevWalletRef.current && prevWalletRef.current !== walletAddress) {
      saveSessions(sessions, prevWalletRef.current);
    }
    // Load sessions for the new wallet
    const loaded = loadSessions(walletAddress);
    setSessions(loaded);
    setActiveSessionId(loaded[0]?.id || null);
    prevWalletRef.current = walletAddress;
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for wallet account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        localStorage.removeItem('aj_wallet');
        setPage('landing');
      } else {
        setWalletAddress(accounts[0]);
        localStorage.setItem('aj_wallet', accounts[0]);
      }
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, []);

  // Load message count when wallet connects
  useEffect(() => {
    if (userId) setMessageCount(getMessageCount(userId));
  }, [userId]);

  // Check onchain access
  const refreshAccess = useCallback(async () => {
    if (!walletAddress) { setAccessInfo(null); return; }
    try {
      const info = await checkAccess(walletAddress, true);
      setAccessInfo(info);
    } catch (err) {
      console.error('[Access] Check failed:', err);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) refreshAccess();
  }, [walletAddress, refreshAccess]);

  const handleConnect = useCallback(async () => {
    const addr = await connectWallet();
    if (addr) {
      await switchToZGChain();
      setWalletAddress(addr);
      localStorage.setItem('aj_wallet', addr);
      setPage('app');
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    localStorage.removeItem('aj_wallet');
    setPage('landing');
  }, []);

  const handleLaunch = useCallback(() => {
    setPage('app');
  }, []);

  const handleMessageSent = useCallback(() => {
    if (userId) {
      const newCount = incrementMessageCount(userId);
      setMessageCount(newCount);
    }
  }, [userId]);

  const handleAccessGranted = useCallback(() => {
    clearAccessCache();
    refreshAccess();
  }, [refreshAccess]);

  const hasAccess = accessInfo?.isActive || false;
  const isWithinFreeTier = messageCount < FREE_MESSAGE_LIMIT;
  const canSendMessage = isWithinFreeTier || hasAccess;
  const freeMessagesRemaining = Math.max(0, FREE_MESSAGE_LIMIT - messageCount);

  /* ── Session management ──────────────────────────────────── */
  useEffect(() => { saveSessions(sessions, walletAddress); }, [sessions, walletAddress]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleSessionMessagesChange = useCallback((newMessages) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? { ...s, messages: newMessages, messageCount: newMessages.filter(m => m.role === 'user').length }
          : s
      )
    );
  }, [activeSessionId]);

  const handleNewSession = useCallback(() => {
    const newSession = createSession('New Session');
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  const handleDeleteSession = useCallback((sessionId) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      if (updated.length === 0) return [createSession('New Session')];
      if (sessionId === activeSessionId) {
        setActiveSessionId(updated[0]?.id);
      }
      return updated;
    });
  }, [activeSessionId]);

  const handleSessionRename = useCallback((sessionId, newTitle) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  }, []);

  const handlePinSession = useCallback((sessionId) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, pinned: !s.pinned } : s));
  }, []);

  // Sort: pinned first, then by creation date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  /* ── Render ────────────────────────────────────────────────── */
  if (page === 'landing') {
    return (
      <LandingPage
        onLaunch={handleLaunch}
        authenticated={authenticated}
        onLogin={handleConnect}
      />
    );
  }

  return (
    <div className="app-root">
      <div className="scanline-overlay" />
      <div
          className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}
          onClick={(e) => {
            // Close sidebar when tapping the backdrop (not the sidebar itself)
            if (e.target === e.currentTarget && window.innerWidth <= 768) {
              setSidebarOpen(false);
            }
          }}
        >
        <Sidebar
          sessions={sortedSessions}
          activeSessionId={activeSessionId}
          onSessionChange={(id) => {
            setActiveSessionId(id);
            if (window.innerWidth <= 768) setSidebarOpen(false);
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleSessionRename}
          onPinSession={handlePinSession}
          memoryCount={memoryCount}
          onGoHome={() => setPage('landing')}
          walletAddress={walletAddress}
          onLogout={handleDisconnect}
          accessInfo={accessInfo}
          hasAccess={hasAccess}
          freeMessagesRemaining={freeMessagesRemaining}
          isWithinFreeTier={isWithinFreeTier}
          onConnectWallet={handleConnect}
        />
      </div>

      <ChatPanel
        key={activeSessionId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sessionTitle={activeSession?.title || 'Alpha Journal'}
        sessionId={activeSessionId}
        initialMessages={activeSession?.messages || []}
        onMessagesChange={handleSessionMessagesChange}
        onSessionRename={handleSessionRename}
        onMemoryStored={(count) => setMemoryCount(count)}
        canSendMessage={authenticated ? canSendMessage : false}
        hasAccess={hasAccess}
        messageCount={messageCount}
        freeMessagesRemaining={freeMessagesRemaining}
        isWithinFreeTier={isWithinFreeTier}
        onMessageSent={handleMessageSent}
        accessInfo={accessInfo}
        walletAddress={walletAddress}
        walletProvider={window.ethereum}
        onAccessGranted={handleAccessGranted}
        authenticated={authenticated}
        onConnectWallet={handleConnect}
      />
    </div>
  );
}
