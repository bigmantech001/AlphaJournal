// ============================================================
// Alpha Journal - Local Memory Index (in-browser vector search)
// ============================================================

class MemoryStore {
  constructor() {
    this.memories = [];
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem('alpha_journal_memories');
      if (saved) this.memories = JSON.parse(saved);
    } catch {}
  }

  get count() { return this.memories.length; }

  addMemory({ rootHash, content, embedding, metadata }) {
    this.memories.push({
      rootHash,
      content,
      embedding,
      metadata,
      timestamp: Date.now(),
    });
    // Keep last 500 memories
    if (this.memories.length > 500) this.memories = this.memories.slice(-500);
    this._save();
  }

  search(queryEmbedding, topK = 5) {
    if (!queryEmbedding || this.memories.length === 0) return [];
    return this.memories
      .filter(m => m.embedding?.length > 0)
      .map(m => ({
        ...m,
        similarity: this._cosine(queryEmbedding, m.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  buildContextPrompt(memories) {
    if (!memories || memories.length === 0) return '';
    const items = memories.map((m, i) =>
      `[Memory ${i + 1} | ${(m.similarity * 100).toFixed(0)}% match]: ${m.content.slice(0, 300)}`
    ).join('\n');
    return `You have access to these relevant past journal entries from the user:\n${items}\n\nUse these memories to provide context-aware responses.`;
  }

  generateEmbedding(text, dim = 256) {
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    }
    const emb = [];
    for (let i = 0; i < dim; i++) {
      seed = (seed * 16807) % 2147483647;
      emb.push((seed / 2147483647) * 2 - 1);
    }
    const mag = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
    return emb.map(v => v / mag);
  }

  _cosine(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0, ma = 0, mb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; ma += a[i] ** 2; mb += b[i] ** 2;
    }
    return dot / (Math.sqrt(ma) * Math.sqrt(mb));
  }

  _save() {
    try { localStorage.setItem('alpha_journal_memories', JSON.stringify(this.memories)); } catch {}
  }
}

export default new MemoryStore();
