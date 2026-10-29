/**
 * Bounded SQLite-backed LLM response cache.
 * Keys: SHA-256 hash of (promptType + promptPayload)
 * Bounded: Enforces MAX_ENTRIES and TTL_SECONDS, auto-pruning expired or least-recently used.
 */

import { CACHE_CONFIG } from '../config/constants.js';
import { generateHash } from '../utils/hash.js';

export class LLMCache {
  /**
   * @param {import('better-sqlite3').Database} db
   * @param {number} [maxEntries]
   * @param {number} [ttlSeconds]
   */
  constructor(db, maxEntries = CACHE_CONFIG.MAX_ENTRIES, ttlSeconds = CACHE_CONFIG.TTL_SECONDS) {
    this.db = db;
    this.maxEntries = maxEntries;
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Retrieves a cached JSON response if valid and unexpired.
   * @param {string} promptType
   * @param {string|object} payload
   * @returns {object|null}
   */
  get(promptType, payload) {
    try {
      const hashKey = generateHash({ promptType, payload });
      const now = Math.floor(Date.now() / 1000);

      const stmt = this.db.prepare(`
        SELECT response_json FROM llm_cache
        WHERE hash_key = ? AND expires_at > ?
      `);

      const row = stmt.get(hashKey, now);
      if (!row) return null;

      return JSON.parse(row.response_json);
    } catch {
      return null;
    }
  }

  /**
   * Stores an LLM JSON response into SQLite cache and prunes if capacity is exceeded.
   * @param {string} promptType
   * @param {string|object} payload
   * @param {object} responseJson
   */
  set(promptType, payload, responseJson) {
    try {
      const hashKey = generateHash({ promptType, payload });
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + this.ttlSeconds;
      const jsonStr = JSON.stringify(responseJson);

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO llm_cache (hash_key, prompt_type, response_json, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertStmt.run(hashKey, promptType, jsonStr, new Date().toISOString(), expiresAt);

      // Bound cache: Trim expired entries
      this.db.prepare('DELETE FROM llm_cache WHERE expires_at <= ?').run(now);

      // Bound cache: Trim excess entries if count exceeds maxEntries
      const countRow = this.db.prepare('SELECT COUNT(*) as cnt FROM llm_cache').get();
      if (countRow && countRow.cnt > this.maxEntries) {
        const excess = countRow.cnt - this.maxEntries;
        this.db.prepare(`
          DELETE FROM llm_cache
          WHERE hash_key IN (
            SELECT hash_key FROM llm_cache
            ORDER BY created_at ASC
            LIMIT ?
          )
        `).run(excess);
      }
    } catch {
      // Non-fatal cache write failure
    }
  }

  /**
   * Clears all cache entries.
   */
  clear() {
    try {
      this.db.prepare('DELETE FROM llm_cache').run();
    } catch {
      // Non-fatal
    }
  }
}
