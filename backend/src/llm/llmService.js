/**
 * LLM Service layer.
 * Coordinates bounded caching, prompt delivery, JSON parsing, Zod validation,
 * retry on malformed output, and safe structured fallbacks.
 */

import { LLMCache } from './cache.js';
import { createLLMProvider } from './provider.js';

export class LLMService {
  /**
   * @param {object} [options]
   * @param {import('./provider.js').BaseLLMProvider} [options.provider]
   * @param {import('better-sqlite3').Database} [options.db]
   */
  constructor({ provider, db } = {}) {
    this.provider = provider || createLLMProvider();
    this.cache = db ? new LLMCache(db) : null;
  }

  /**
   * Generates structured data validated by a Zod schema.
   * @template T
   * @param {object} options
   * @param {string} options.promptType - Identifying key for caching & metrics
   * @param {string} options.promptText - Full prompt
   * @param {object} options.cachePayload - Payload for cache key hashing
   * @param {import('zod').ZodType<T>} options.schema - Zod schema to validate
   * @param {T} options.fallback - Structured fallback if all retries fail
   * @param {boolean} [options.bypassCache=false]
   * @returns {Promise<T>}
   */
  async generateStructured({
    promptType,
    promptText,
    cachePayload,
    schema,
    fallback,
    bypassCache = false
  }) {
    // 1. Check cache
    if (!bypassCache && this.cache && cachePayload) {
      const cached = this.cache.get(promptType, cachePayload);
      if (cached) {
        const parsed = schema.safeParse(cached);
        if (parsed.success) return parsed.data;
      }
    }

    // 2. Call LLM (First attempt)
    try {
      const rawResponse = await this.provider.generateText(promptText);
      const cleanedJson = this._extractJsonString(rawResponse);
      const parsedObj = JSON.parse(cleanedJson);
      const validation = schema.safeParse(parsedObj);

      if (validation.success) {
        if (this.cache && cachePayload) {
          this.cache.set(promptType, cachePayload, validation.data);
        }
        return validation.data;
      }
    } catch {
      // First attempt failed, will proceed to retry
    }

    // 3. Retry once with explicit error feedback
    try {
      const retryPrompt = `${promptText}\n\nCRITICAL FIX: Your previous response was not valid JSON conforming to the schema. Output ONLY raw JSON matching the schema, with NO markdown backticks and NO commentary.`;
      const retryResponse = await this.provider.generateText(retryPrompt);
      const retryCleaned = this._extractJsonString(retryResponse);
      const retryObj = JSON.parse(retryCleaned);
      const retryValidation = schema.safeParse(retryObj);

      if (retryValidation.success) {
        if (this.cache && cachePayload) {
          this.cache.set(promptType, cachePayload, retryValidation.data);
        }
        return retryValidation.data;
      }
    } catch {
      // Second attempt failed, proceed to fallback
    }

    // 4. Safe structured fallback (never crash)
    return fallback;
  }

  /**
   * Cleans code fences or extraneous text around JSON.
   * @private
   * @param {string} text
   * @returns {string}
   */
  _extractJsonString(text) {
    if (!text || typeof text !== 'string') return '{}';
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }
}
