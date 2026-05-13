import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  LogOut,
  User,
  Crown,
  Sparkles,
  MessageSquare,
  Trash2,
  Wallet,
  Pin,
  PenLine,
  MoreVertical,
  Clock,
} from 'lucide-react';
import StatusBar from './StatusBar';
import { formatCountdown } from './PaywallModal';

export default function Sidebar({
  sessions,
  activeSessionId,
  onSessionChange,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onPinSession,
  memoryCount,
  onGoHome,
  walletAddress,
  onLogout,
  accessInfo,
  hasAccess,
  freeMessagesRemaining,
  isWithinFreeTier,
  onConnectWallet,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { sessionId, x, y }
  const editInputRef = useRef(null);
  const contextRef = useRef(null);

  const filtered = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userDisplay = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not Connected';

  const tierLabel = accessInfo?.tier === 'holder' || accessInfo?.isLifetime
    ? 'Holder'
    : accessInfo?.tier === 'subscriber'
      ? 'Subscriber'
      : isWithinFreeTier
        ? `Free (${freeMessagesRemaining} left)`
        : 'Upgrade';

  const tierClass = accessInfo?.tier === 'holder' || accessInfo?.isLifetime
    ? 'tier-holder'
    : accessInfo?.tier === 'subscriber'
      ? 'tier-subscriber'
      : isWithinFreeTier
        ? 'tier-free'
        : 'tier-expired';

  // Subscription countdown
  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    if (!accessInfo?.expiry || accessInfo.expiry <= 0) {
      setCountdown(null);
      return;
    }
    const update = () => setCountdown(formatCountdown(accessInfo.expiry));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [accessInfo?.expiry]);

  // Focus the rename input when entering edit mode
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const startRename = useCallback((session) => {
    setEditingId(session.id);
    setEditValue(session.title);
    setContextMenu(null);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      onRenameSession(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, onRenameSession]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  }, [commitRename]);

  const handleContextMenu = useCallback((e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.closest('.sidebar').getBoundingClientRect();
    setContextMenu({
      sessionId,
      x: Math.min(e.clientX - rect.left, rect.width - 150),
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMoreClick = useCallback((e, sessionId) => {
    e.stopPropagation();
    const rect = e.currentTarget.closest('.sidebar').getBoundingClientRect();
    const btnRect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      sessionId,
      x: btnRect.left - rect.left,
      y: btnRect.bottom - rect.top + 4,
    });
  }, []);

  const contextSession = contextMenu
    ? sessions.find(s => s.id === contextMenu.sessionId)
    : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={onGoHome} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <span className="logo-emoji">📓</span>
        </div>
        <div className="logo-text">
          <h1 className="logo-title">Alpha Journal</h1>
          <p className="logo-subtitle">MemoriaDA Protocol</p>
        </div>
      </div>

      {walletAddress ? (
        <div className="user-info-card">
          <div className="user-info-row">
            <div className="user-avatar-small">
              <User size={12} />
            </div>
            <span className="user-display-name">{userDisplay}</span>
          </div>
          <div className="user-tier-row">
            <span className={`tier-badge ${tierClass}`}>
              {accessInfo?.isLifetime || accessInfo?.tier === 'holder'
                ? <Crown size={10} />
                : <Sparkles size={10} />}
              {tierLabel}
            </span>
            <button className="logout-btn" onClick={onLogout} title="Disconnect wallet">
              <LogOut size={12} />
            </button>
          </div>
          {countdown && !countdown.expired && accessInfo?.tier === 'subscriber' && (
            <div className="sidebar-countdown">
              <Clock size={10} />
              <span>{countdown.text}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="user-info-card sidebar-connect-card">
          <button className="sidebar-connect-btn" onClick={onConnectWallet}>
            <Wallet size={14} />
            <span>Connect Wallet</span>
          </button>
          <p className="sidebar-connect-hint">Connect to start journaling</p>
        </div>
      )}

      <div className="sidebar-section">
        <button className="new-session-btn" id="new-session-btn" onClick={onNewSession}>
          <Plus size={14} />
          <span>New Session</span>
        </button>
      </div>

      {sessions.length > 1 && (
        <div className="sidebar-section">
          <div className="search-wrapper">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      )}

      <div className="sessions-list">
        <p className="sessions-label">Sessions</p>
        {filtered.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px', fontFamily: 'var(--font-mono)' }}>
            No sessions yet
          </p>
        )}
        {filtered.map(session => {
          const isActive = activeSessionId === session.id;
          const isEditing = editingId === session.id;

          return (
            <div
              key={session.id}
              className={`session-item-wrapper ${session.pinned ? 'pinned' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, session.id)}
            >
              <button
                className={`session-item ${isActive ? 'active' : ''}`}
                onClick={() => onSessionChange(session.id)}
                onDoubleClick={() => startRename(session)}
              >
                <div className="session-icon" style={{ color: session.pinned ? 'var(--purple)' : 'var(--neon)' }}>
                  {session.pinned ? <Pin size={14} /> : <MessageSquare size={14} />}
                </div>
                <div className="session-info">
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      className="session-rename-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={commitRename}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="session-title">{session.title}</p>
                      <p className="session-subtitle">
                        {session.messageCount || 0} entries · {session.dateLabel || 'Today'}
                      </p>
                    </>
                  )}
                </div>
                {!isEditing && <ChevronRight size={12} className="session-chevron" />}
              </button>

              {/* More button (3-dot) */}
              <button
                className="session-more-btn"
                onClick={(e) => handleMoreClick(e, session.id)}
                title="Session options"
              >
                <MoreVertical size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && contextSession && (
        <div
          ref={contextRef}
          className="session-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="context-menu-item"
            onClick={() => startRename(contextSession)}
          >
            <PenLine size={12} />
            Rename
          </button>
          <button
            className="context-menu-item"
            onClick={() => { onPinSession(contextMenu.sessionId); setContextMenu(null); }}
          >
            <Pin size={12} />
            {contextSession.pinned ? 'Unpin' : 'Pin to top'}
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => { onDeleteSession(contextMenu.sessionId); setContextMenu(null); }}
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      )}

      <StatusBar memoryCount={memoryCount} />
    </aside>
  );
}
