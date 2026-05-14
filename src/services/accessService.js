// ============================================================
// Alpha Journal - Access Service (Onchain access check)
// ============================================================

const API_BASE = '/api';

let cachedResult = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a user has active access via the AlphaJournalAccess contract
 * @param {string} address - User's wallet address
 * @param {boolean} forceRefresh - Skip cache
 * @returns {Promise<object>} - { isActive, expiry, balance, isLifetime, tier }
 */
export async function checkAccess(address, forceRefresh = false) {
  if (!address) return { isActive: false, expiry: 0, balance: '0', isLifetime: false, tier: 'none' };

  // Return cached result if still valid
  if (!forceRefresh && cachedResult && Date.now() < cacheExpiry && cachedResult._address === address) {
    return cachedResult;
  }

  try {
    const res = await fetch(`${API_BASE}/access/check?address=${address}`);
    if (!res.ok) throw new Error(`Access check failed: ${res.status}`);
    const data = await res.json();

    const result = {
      isActive: data.isActive,
      expiry: data.expiry,
      balance: data.balance,
      isLifetime: data.isLifetime,
      tier: data.tier || (data.isLifetime ? 'holder' : data.isActive ? 'subscriber' : 'free'),
      _address: address,
    };

    // Cache the result
    cachedResult = result;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return result;
  } catch (err) {
    console.error('[AccessService] Error:', err.message);
    // On error, allow access (fail open for better UX, backend will enforce)
    return { isActive: false, expiry: 0, balance: '0', isLifetime: false, tier: 'error' };
  }
}

/**
 * Clear the access cache (call after subscription tx)
 */
export function clearAccessCache() {
  cachedResult = null;
  cacheExpiry = 0;
}

/**
 * Get message count for a user from localStorage
 */
export function getMessageCount(userId) {
  try {
    return parseInt(localStorage.getItem(`aj_msg_count_${userId}`) || '0', 10);
  } catch {
    return 0;
  }
}

/**
 * Increment message count for a user
 */
export function incrementMessageCount(userId) {
  const count = getMessageCount(userId) + 1;
  try {
    localStorage.setItem(`aj_msg_count_${userId}`, String(count));
  } catch {}
  return count;
}

export const FREE_MESSAGE_LIMIT = 3;
