import crypto from 'crypto';

/**
 * Generates a SHA-256 hash of arbitrary content.
 * Used for deterministic LLM response cache keys.
 * @param {string|object} content
 * @returns {string} Hex encoded SHA-256 digest
 */
export function generateHash(content) {
  const normalized = typeof content === 'string' ? content : JSON.stringify(content);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

