import {
  Brain,
  Database,
  Shield,
  ArrowRight,
  Zap,
  Eye,
  ChevronRight,
  ExternalLink,
  Sparkles,
  GitBranch,
  Users,
  Activity,
  Globe,
  Wallet,
  Lock,
  TrendingUp,
} from 'lucide-react';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ── Animated Counter Hook ──────────────────────── */
function useAnimatedCounter(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prevTarget.current = target;
  }, [target, duration]);

  return value;
}

/* ── Intersection Observer Hook for scroll reveals ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/* ── Terminal Typewriter Lines ── */
const TERMINAL_LINES = [
  { type: 'user', text: 'Why did I short BTC last month?' },
  { type: 'ai', text: 'Searching memory vaults', typing: true },
  { type: 'system', text: '🧠 3 memories recalled from 0G Storage' },
  { type: 'ai', text: 'You shorted BTC on May 3rd at $67,800 based on your resistance thesis.' },
  { type: 'system', text: '✓ Anchored on 0G Chain - Block #8,412,093' },
];

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const currentLine = TERMINAL_LINES[visibleLines];
  const isTyping = visibleLines < TERMINAL_LINES.length;

  useEffect(() => {
    if (!isTyping) {
      // Restart after a pause
      const timer = setTimeout(() => { setVisibleLines(0); setCharIndex(0); }, 4000);
      return () => clearTimeout(timer);
    }

    const lineText = currentLine.text;
    if (charIndex < lineText.length) {
      const speed = currentLine.type === 'system' ? 15 : 30;
      const timer = setTimeout(() => setCharIndex(charIndex + 1), speed);
      return () => clearTimeout(timer);
    }

    // Line done - pause then show next
    const delay = currentLine.type === 'user' ? 800 : currentLine.type === 'system' ? 600 : 1000;
    const timer = setTimeout(() => {
      setVisibleLines(v => v + 1);
      setCharIndex(0);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleLines, charIndex, isTyping, currentLine]);

  const prefix = { user: 'you →', ai: 'alpha ←', system: 'sys' };
  const prefixClass = { user: 't-prompt', ai: 't-ai', system: 't-system' };

  return (
    <div className="terminal-body">
      {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
        <p key={i} className={`terminal-line ${line.type === 'system' ? 't-dim' : ''}`}>
          <span className={prefixClass[line.type]}>{prefix[line.type]}</span> {line.text}
        </p>
      ))}
      {isTyping && currentLine && (
        <p className={`terminal-line ${currentLine.type === 'system' ? 't-dim' : ''}`}>
          <span className={prefixClass[currentLine.type]}>{prefix[currentLine.type]}</span>{' '}
          {currentLine.text.slice(0, charIndex)}
          <span className="terminal-blink">_</span>
        </p>
      )}
    </div>
  );
}

/* ── Floating Particles ── */
function FloatingParticles() {
  return (
    <div className="hero-particles" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            '--particle-size': `${2 + Math.random() * 3}px`,
            '--particle-opacity': `${0.15 + Math.random() * 0.35}`,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage({ onLaunch, authenticated, onLogin }) {
  const [stats, setStats] = useState({ memoryCount: 0, userCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setStats({
          memoryCount: data.memoryCount || 0,
          userCount: data.userCount || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const animatedUsers = useAnimatedCounter(stats.userCount);
  const animatedMemories = useAnimatedCounter(stats.memoryCount);

  const [heroRef, heroVisible] = useScrollReveal(0.1);
  const [featuresRef, featuresVisible] = useScrollReveal(0.1);
  const [statsRef, statsVisible] = useScrollReveal(0.2);
  const [stepsRef, stepsVisible] = useScrollReveal(0.15);
  const [ctaRef, ctaVisible] = useScrollReveal(0.2);

  return (
    <div className="landing">
      <div className="scanline-overlay" />
      <div className="landing-grid" />

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <div className="landing-logo-icon">
              <span>📓</span>
            </div>
            <span className="landing-logo-text">Alpha Journal</span>
          </div>
          <div className="landing-nav-links">
            <a href="https://github.com/bigmantech001/AlphaJournal" target="_blank" rel="noopener noreferrer" className="nav-link">
              <GitBranch size={14} />
              GitHub
            </a>
            <button className="nav-launch-btn" onClick={onLaunch}>
              Launch App <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      <section className={`hero ${heroVisible ? 'reveal' : ''}`} ref={heroRef}>
        <FloatingParticles />

        <div className="hero-badge animate-float">
          <Sparkles size={12} />
          <span>Powered by MemoriaDA on 0G Chain</span>
          <span className="badge-live-dot" />
        </div>

        <h1 className="hero-title">
          Your Trading Alpha,
          <br />
          <span className="hero-title-accent">Permanently Secured</span>
        </h1>

        <p className="hero-subtitle">
          An AI-powered decentralized trading diary. Dump your market theses, trade setups,
          and alpha - every memory is cryptographically anchored on
          <span className="text-neon"> 0G Chain</span> via the
          <span className="text-purple"> MemoriaDA</span> protocol.
        </p>

        <div className="hero-actions">
          <button className="hero-cta" id="launch-app-btn" onClick={onLaunch}>
            <span className="cta-shimmer" />
            Launch App
            <ArrowRight size={18} />
          </button>
          <a
            href="https://github.com/bigmantech001/AlphaJournal"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-secondary"
          >
            View on GitHub
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="hero-terminal">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot-red"></span>
              <span className="dot-yellow"></span>
              <span className="dot-green"></span>
            </div>
            <span className="terminal-title">alpha-journal - live session</span>
            <span className="terminal-live-badge">
              <span className="live-pulse" />
              LIVE
            </span>
          </div>
          <TerminalDemo />
        </div>
      </section>

      <section className={`features ${featuresVisible ? 'reveal' : ''}`} ref={featuresRef}>
        <div className="features-grid">
          {[
            { icon: Brain, title: 'AI Memory Recall', desc: 'Ask "Why did I enter that trade?" - Alpha recalls your exact reasoning from months ago using vector similarity search.', color: 'icon-neon' },
            { icon: Database, title: '0G Decentralized Storage', desc: 'Every journal entry is uploaded to 0G\'s decentralized storage network. Your data lives onchain, self-sovereign and secure.', color: 'icon-purple' },
            { icon: Shield, title: 'Cryptographic Anchoring', desc: 'Merkle roots of your memories are committed to 0G Chain. Tamper-proof, verifiable, and permanently immutable.', color: 'icon-cyan' },
            { icon: Wallet, title: 'Wallet-Native Auth', desc: 'No emails or passwords. Your wallet is your identity. Secure, private, and built for crypto traders.', color: 'icon-neon' },
            { icon: Zap, title: 'Instant Responses', desc: 'Blockchain storage and anchoring happen asynchronously. Enjoy a high-speed AI experience with zero onchain latency.', color: 'icon-purple' },
            { icon: Eye, title: 'Onchain Verifiable', desc: 'Every anchored memory includes an explorer link. Verify your data integrity directly on the 0G Chain block explorer.', color: 'icon-cyan' },
          ].map((feat, i) => (
            <div
              key={feat.title}
              className="feature-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`feature-icon ${feat.color}`}>
                <feat.icon size={24} />
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
              <div className="feature-card-glow" />
            </div>
          ))}
        </div>
      </section>

      <section className={`network-stats-section ${statsVisible ? 'reveal' : ''}`} ref={statsRef}>
        <div className="network-stats">
          <div className="stat-item">
            <div className="stat-icon icon-neon">
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{animatedUsers.toLocaleString()}</span>
              <span className="stat-label">Active Traders</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon icon-purple">
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{animatedMemories.toLocaleString()}</span>
              <span className="stat-label">Memories Anchored</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon icon-cyan">
              <Globe size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">0G Mainnet</span>
              <span className="stat-label">Settlement Layer</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`how-it-works ${stepsVisible ? 'reveal' : ''}`} ref={stepsRef}>
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step" style={{ animationDelay: '0s' }}>
            <div className="step-number">01</div>
            <div className="step-content">
              <h4>Connect Wallet</h4>
              <p>Securely connect your wallet to start journaling without any centralized account.</p>
            </div>
          </div>
          <div className="step-connector"><ChevronRight size={16} /></div>
          <div className="step" style={{ animationDelay: '0.15s' }}>
            <div className="step-number">02</div>
            <div className="step-content">
              <h4>Dump Your Alpha</h4>
              <p>Type your trading thesis. Alpha AI handles the 0G storage and onchain anchoring.</p>
            </div>
          </div>
          <div className="step-connector"><ChevronRight size={16} /></div>
          <div className="step" style={{ animationDelay: '0.3s' }}>
            <div className="step-number">03</div>
            <div className="step-content">
              <h4>Recall Anytime</h4>
              <p>Ask "Why did I short ETH?" - Alpha searches your decentralized memory vaults.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`landing-cta ${ctaVisible ? 'reveal' : ''}`} ref={ctaRef}>
        <div className="cta-glow"></div>
        <h2 className="cta-title">Ready to secure your alpha?</h2>
        <p className="cta-subtitle">
          Start journaling your trades with permanent, verifiable memory on 0G Chain.
        </p>
        <button className="hero-cta" onClick={onLaunch}>
          <span className="cta-shimmer" />
          Launch App
          <ArrowRight size={18} />
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="landing-nav-logo">
              <div className="landing-logo-icon small">
                <span>📓</span>
              </div>
              <span className="landing-logo-text small">Alpha Journal</span>
            </div>
            <p className="footer-desc">
              AI-powered trading diary with decentralized memory infrastructure.
            </p>
          </div>
          <div className="footer-right">
            <div className="footer-col">
              <p className="footer-col-title">Protocol</p>
              <a href="https://memoriada.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">MemoriaDA</a>
              <a href="https://0g.ai" target="_blank" rel="noopener noreferrer" className="footer-link">0G Labs</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Powered by MemoriaDA Protocol on 0G Chain</span>
          <span>Built for the 0G APAC Hackathon 2026</span>
        </div>
      </footer>
    </div>
  );
}
