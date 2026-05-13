import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Brain,
  Shield,
  ExternalLink,
  Sparkles,
  Clock,
  Hash,
  Menu,
  X,
  MoreHorizontal,
  Lock,
  Wallet,
} from 'lucide-react';
import { sendChat, storeMemory } from '../services/apiClient';
import memoryStore from '../services/memoryStore';
import PaywallModal from './PaywallModal';
import { FREE_MESSAGE_LIMIT } from '../services/accessService';

/* ── System prompt for the AI ── */
const SYSTEM_PROMPT = `You are Alpha — an AI trading journal assistant. The user logs their crypto trading thoughts, market analysis, and investment theses with you.

Your job:
- Help them organize and recall their trading ideas
- Challenge their assumptions constructively
- Reference their past entries when relevant (you'll receive them as context)
- Be concise, sharp, and slightly opinionated (like a trading desk analyst)

When you recall a past memory, mention it naturally: "You mentioned on [date] that..."
Keep responses under 150 words unless the topic demands more.`;

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ── Typing Indicator ── */
function TypingIndicator({ status }) {
  return (
    <div className="message-row agent animate-fade-in">
      <div className="avatar avatar-agent">
        <Bot size={16} />
      </div>
      <div className="bubble bubble-agent">
        <div className="typing-wrapper">
          <span className="typing-status">{status}</span>
          <span className="typing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── User Message ── */
function UserMessage({ content, timestamp }) {
  return (
    <div className="message-row user animate-fade-in">
      <div className="message-content-wrapper user">
        <div className="bubble bubble-user">
          <p>{content}</p>
        </div>
        <span className="msg-time right">{timestamp}</span>
      </div>
      <div className="avatar avatar-user">
        <User size={16} />
      </div>
    </div>
  );
}

/* ── Markdown bold formatter ── */
function formatMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/* ── Agent Message ── */
function AgentMessage({ content, memoriesRecalled, anchorInfo, timestamp }) {
  return (
    <div className="message-row agent animate-fade-in">
      <div className="avatar avatar-agent glow-purple">
        <Bot size={16} />
      </div>
      <div className="message-content-wrapper agent">
        {memoriesRecalled > 0 && (
          <div className="memory-badge">
            <Brain size={10} />
            <span>🧠 {memoriesRecalled} Memories Recalled</span>
          </div>
        )}
        <div className="bubble bubble-agent">
          {content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            return <p key={i}>{formatMarkdown(line)}</p>;
          })}
        </div>
        {anchorInfo && (
          <div className="anchor-log">
            <Shield size={10} />
            <span className="anchor-text">
              ✓ Anchored on 0G Chain — {anchorInfo.blockLabel}
            </span>
            <a
              href={anchorInfo.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor-link"
            >
              View in Explorer <ExternalLink size={8} />
            </a>
          </div>
        )}
        <span className="msg-time">{timestamp}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT PANEL
   ══════════════════════════════════════════════════════════ */
const WELCOME_MSG = {
  id: 'welcome',
  role: 'agent',
  content: `Welcome to Alpha Journal 📓

I'm Alpha — your AI trading companion. Dump your trading thoughts, theses, and market reads here. I'll remember everything across sessions.

Ask me things like:
• "Why did I short BTC last month?"
• "What was my ETH thesis?"
• "Show me my best trades this week"

Every memory is cryptographically anchored on 0G Chain via MemoriaDA. Your alpha, permanently secured. 🔐`,
  memoriesRecalled: 0,
  anchorInfo: null,
  timestamp: formatTime(new Date()),
};

export default function ChatPanel({
  sidebarOpen,
  onToggleSidebar,
  sessionTitle,
  sessionId,
  initialMessages,
  onMessagesChange,
  onSessionRename,
  onMemoryStored,
  canSendMessage,
  hasAccess,
  messageCount,
  freeMessagesRemaining,
  isWithinFreeTier,
  onMessageSent,
  accessInfo,
  walletAddress,
  walletProvider,
  onAccessGranted,
  onLinkWallet,
  authenticated,
  onConnectWallet,
}) {
  // Load initial messages, always show welcome if empty
  const [messages, setMessages] = useState(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [WELCOME_MSG];
  });
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasAutoRenamed = useRef(false);
  const isInitialMount = useRef(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus, scrollToBottom]);

  // Persist messages back to parent whenever they change
  // Skip: initial mount (prevents writing stale/welcome data on session switch)
  // Skip: welcome-only state (don't store the synthetic welcome message)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const realMessages = messages.filter(m => m.id !== 'welcome');
    if (onMessagesChange && realMessages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages]); // onMessagesChange intentionally excluded to avoid loops

  // Show paywall if free tier exhausted and no access (only when authenticated)
  useEffect(() => {
    if (authenticated && !canSendMessage && !showPaywall) {
      setShowPaywall(true);
    }
  }, [authenticated, canSendMessage, showPaywall]);

  /* ── handleSend: full MemoriaDA pipeline ── */
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    // Check access before sending
    if (!canSendMessage) {
      setShowPaywall(true);
      return;
    }

    // 1. Add user message immediately
    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: formatTime(new Date()),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Auto-rename session from first user message
    if (!hasAutoRenamed.current && onSessionRename && sessionTitle === 'New Session') {
      hasAutoRenamed.current = true;
      const autoTitle = trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed;
      onSessionRename(sessionId, autoTitle);
    }

    // Increment message counter
    if (onMessageSent) onMessageSent();

    let aiContent = '';
    let memoriesRecalled = 0;

    try {
      // 2. Generate embedding & search local memories
      setTypingStatus('Searching memory vaults');
      const embedding = memoryStore.generateEmbedding(trimmed);
      const relevantMemories = memoryStore.search(embedding, 5);
      memoriesRecalled = relevantMemories.length;

      // 3. Build context-aware prompt
      const contextPrompt = memoryStore.buildContextPrompt(relevantMemories);
      const chatMessages = [
        { role: 'system', content: SYSTEM_PROMPT + (contextPrompt ? '\n\n' + contextPrompt : '') },
        ...messages
          .filter(m => m.id !== 'welcome')
          .slice(-10)
          .map(m => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.content,
          })),
        { role: 'user', content: trimmed },
      ];

      // 4. Call backend AI
      setTypingStatus('Alpha AI synthesizing');
      const chatResult = await sendChat(chatMessages);
      aiContent = chatResult.content;

      // 5. Show agent response immediately
      const agentMsg = {
        id: `agent_${Date.now()}`,
        role: 'agent',
        content: aiContent,
        memoriesRecalled,
        anchorInfo: null,
        timestamp: formatTime(new Date()),
      };
      setMessages(prev => [...prev, agentMsg]);

      // 6. Background: store memory on 0G Storage + anchor on-chain
      setTypingStatus('Anchoring to 0G Chain');
      const conversationText = `User: ${trimmed}\nAlpha: ${aiContent}`;
      try {
        const storeResult = await storeMemory(conversationText, embedding, {
          session: sessionTitle,
          userQuery: trimmed.slice(0, 100),
          memoriesRecalled,
        });

        const anchorInfo = {
          blockLabel: storeResult.blockLabel,
          explorerUrl: storeResult.explorerUrl,
          txHash: storeResult.txHash,
        };

        setMessages(prev =>
          prev.map(m =>
            m.id === agentMsg.id ? { ...m, anchorInfo } : m
          )
        );

        memoryStore.addMemory({
          rootHash: storeResult.rootHash,
          content: conversationText,
          embedding,
          metadata: { session: sessionTitle, timestamp: Date.now() },
        });

        if (onMemoryStored) onMemoryStored(memoryStore.count);
      } catch (anchorErr) {
        console.error('[Anchor] Background storage failed:', anchorErr.message);
      }
    } catch (err) {
      console.error('[AlphaJournal] Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'agent',
          content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
          memoriesRecalled: 0,
          anchorInfo: null,
          timestamp: formatTime(new Date()),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setTypingStatus('');
      inputRef.current?.focus();
    }
  }, [input, isProcessing, messages, sessionTitle, sessionId, onMemoryStored, canSendMessage, onMessageSent, onSessionRename]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const entryCount = messages.filter(m => m.role === 'user').length;

  return (
    <main className="chat-panel">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <button
            className="header-btn"
            id="sidebar-toggle"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="header-title-group">
            <div className="live-dot"></div>
            <h2 className="header-title">{sessionTitle}</h2>
          </div>
        </div>
        <div className="header-right">
          <span className="entry-count">
            <Hash size={10} />
            {entryCount} entries
          </span>
          <button className="header-btn">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="messages-area">
        <div className="date-separator">
          <div className="date-pill">
            <Clock size={10} />
            <span>Today</span>
          </div>
        </div>

        {messages.map(msg =>
          msg.role === 'user' ? (
            <UserMessage key={msg.id} content={msg.content} timestamp={msg.timestamp} />
          ) : (
            <AgentMessage
              key={msg.id}
              content={msg.content}
              memoriesRecalled={msg.memoriesRecalled}
              anchorInfo={msg.anchorInfo}
              timestamp={msg.timestamp}
            />
          )
        )}

        {isProcessing && <TypingIndicator status={typingStatus} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Paywall Modal */}
      {authenticated && showPaywall && !canSendMessage && (
        <PaywallModal
          accessInfo={accessInfo}
          walletAddress={walletAddress}
          walletProvider={walletProvider}
          onLinkWallet={onLinkWallet}
          onAccessGranted={() => {
            setShowPaywall(false);
            if (onAccessGranted) onAccessGranted();
          }}
        />
      )}

      {/* Input Area */}
      {!authenticated ? (
        <div className="input-area">
          <div className="connect-wallet-overlay">
            <div className="connect-wallet-content">
              <Wallet size={20} />
              <div className="connect-wallet-text">
                <span className="connect-wallet-title">Connect your wallet to start journaling</span>
                <span className="connect-wallet-desc">Your wallet is your identity — no emails, no passwords</span>
              </div>
              <button className="connect-wallet-btn" onClick={onConnectWallet}>
                <Wallet size={14} />
                Connect Wallet
              </button>
            </div>
          </div>
          <div className="input-footer">
            <span className="input-footer-left">
              <Sparkles size={9} />
              Powered by MemoriaDA · 0G Chain
            </span>
          </div>
        </div>
      ) : (
        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canSendMessage ? 'Dump your alpha here... 🧠' : '🔒 Subscribe to continue...'}
              rows={1}
              disabled={isProcessing || !canSendMessage}
              className={`chat-textarea ${!canSendMessage ? 'locked' : ''}`}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              id="send-btn"
              onClick={!canSendMessage ? () => setShowPaywall(true) : handleSend}
              disabled={canSendMessage ? (!input.trim() || isProcessing) : false}
              className={`send-btn ${!canSendMessage ? 'locked' : ''}`}
            >
              {canSendMessage ? <Send size={16} /> : <Lock size={16} />}
            </button>
          </div>
          <div className="input-footer">
            <span className="input-footer-left">
              <Sparkles size={9} />
              Powered by MemoriaDA · 0G Chain
            </span>
            {isWithinFreeTier && !hasAccess ? (
              <span className="input-footer-right free-counter">
                {freeMessagesRemaining}/{FREE_MESSAGE_LIMIT} free messages remaining
              </span>
            ) : (
              <span className="input-footer-right">
                Enter to send · Shift+Enter for new line
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
