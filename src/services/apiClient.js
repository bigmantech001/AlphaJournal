// ============================================================
// Alpha Journal - API Client (Frontend → Backend)
// ============================================================

const API_BASE = '/api';

export async function sendChat(messages) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function storeMemory(content, embedding = [], metadata = {}) {
  const res = await fetch(`${API_BASE}/memory/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, embedding, metadata }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Memory store failed');
  }
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}
