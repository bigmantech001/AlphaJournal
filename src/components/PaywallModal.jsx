import { useState, useEffect } from 'react';
import { Lock, Coins, Wallet, ArrowRight, RefreshCw, Crown, Zap, Clock } from 'lucide-react';
import { ethers } from 'ethers';
import { clearAccessCache, FREE_MESSAGE_LIMIT } from '../services/accessService';

const ACCESS_ABI = [
  'function subscribe() external payable',
  'function subscriptionFee() external view returns (uint256)',
];

/* ── Format countdown from expiry timestamp ── */
function formatCountdown(expiryTimestamp) {
  if (!expiryTimestamp || expiryTimestamp <= 0) return null;

  const now = Math.floor(Date.now() / 1000);
  const remaining = expiryTimestamp - now;
  if (remaining <= 0) return { text: 'Expired', expired: true };

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const mins = Math.floor((remaining % 3600) / 60);

  if (days > 0) return { text: `${days}d ${hours}h remaining`, expired: false, days, hours, mins };
  if (hours > 0) return { text: `${hours}h ${mins}m remaining`, expired: false, days, hours, mins };
  return { text: `${mins}m remaining`, expired: false, days, hours, mins };
}

export { formatCountdown };

export default function PaywallModal({ accessInfo, walletAddress, onAccessGranted, walletProvider }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [countdown, setCountdown] = useState(null);

  const contractAddress = import.meta.env.VITE_ACCESS_CONTRACT;

  // Live countdown timer
  useEffect(() => {
    if (!accessInfo?.expiry || accessInfo.expiry <= 0) {
      setCountdown(null);
      return;
    }

    const update = () => setCountdown(formatCountdown(accessInfo.expiry));
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [accessInfo?.expiry]);

  const handleSubscribe = async () => {
    if (!walletProvider || !contractAddress) {
      setError('Wallet provider or contract not found');
      return;
    }

    setIsSubscribing(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ACCESS_ABI, signer);

      const fee = await contract.subscriptionFee();
      const tx = await contract.subscribe({ value: fee });
      setTxHash(tx.hash);

      await tx.wait();
      clearAccessCache();
      if (onAccessGranted) onAccessGranted();
    } catch (err) {
      console.error('[Subscribe] Error:', err);
      const msg = err?.reason || err?.message || 'Transaction failed';
      if (msg.includes('user rejected')) {
        setError('Transaction was rejected');
      } else if (msg.includes('insufficient funds')) {
        setError('Insufficient 0G balance for subscription');
      } else {
        setError(msg.slice(0, 100));
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRefreshAccess = () => {
    clearAccessCache();
    if (onAccessGranted) onAccessGranted();
  };

  const balanceFormatted = accessInfo?.balance
    ? parseFloat(ethers.formatEther(accessInfo.balance)).toFixed(3)
    : '0.000';

  return (
    <div className="paywall-overlay">
      <div className="paywall-modal">
        <div className="paywall-header">
          <div className="paywall-icon">
            <Lock size={24} />
          </div>
          <h2 className="paywall-title">Free Messages Used</h2>
          <p className="paywall-subtitle">
            You've used all {FREE_MESSAGE_LIMIT} free messages. Unlock unlimited access to Alpha Journal.
          </p>
        </div>

        {/* Active subscription countdown */}
        {countdown && !countdown.expired && accessInfo?.tier === 'subscriber' && (
          <div className="subscription-countdown">
            <Clock size={14} />
            <span className="countdown-text">
              Subscription active — <strong>{countdown.text}</strong>
            </span>
          </div>
        )}

        <div className="paywall-options">
          <div className="paywall-option primary">
            <div className="option-header">
              <div className="option-icon subscribe-icon">
                <Coins size={20} />
              </div>
              <div>
                <h3 className="option-title">Subscribe</h3>
                <p className="option-price">0.1 0G token / month</p>
              </div>
            </div>
            <p className="option-desc">
              Pay 0.1 0G token for 30 days of unlimited access to Alpha Journal with full MemoriaDA integration.
            </p>
            <button
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={isSubscribing || !contractAddress}
            >
              {isSubscribing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Confirming...
                </>
              ) : (
                <>
                  Subscribe Now
                  <ArrowRight size={14} />
                </>
              )}
            </button>
            {txHash && (
              <a
                href={`https://chainscan.0g.ai/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View transaction ↗
              </a>
            )}
          </div>

          <div className="paywall-divider">
            <span>OR</span>
          </div>

          <div className="paywall-option secondary">
            <div className="option-header">
              <div className="option-icon hold-icon">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="option-title">Hold 0.2+ 0G Tokens</h3>
                <p className="option-price">Lifetime access</p>
              </div>
            </div>
            <p className="option-desc">
              Maintain a balance of 0.2 or more 0G tokens in your wallet for permanent, unlimited access.
            </p>
          </div>
        </div>

        <div className="paywall-wallet-info">
          <div className="wallet-row">
            <Wallet size={12} />
            <span className="wallet-address">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'No wallet'}
            </span>
          </div>
          <div className="wallet-row">
            <Zap size={12} />
            <span className="wallet-balance">{balanceFormatted} 0G</span>
          </div>
        </div>

        <p className="paywall-coming-soon">
          🔜 0G Pay integration coming soon — pay with any token, any chain
        </p>

        {error && <p className="paywall-error">⚠️ {error}</p>}

        <button className="refresh-access-btn" onClick={handleRefreshAccess}>
          <RefreshCw size={12} />
          Already paid? Refresh access
        </button>
      </div>
    </div>
  );
}
