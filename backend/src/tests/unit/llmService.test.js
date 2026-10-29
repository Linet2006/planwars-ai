import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getDatabase } from '../../db/index.js';
import { LLMService } from '../../llm/llmService.js';
import { BaseLLMProvider } from '../../llm/provider.js';

class FailingMockProvider extends BaseLLMProvider {
  constructor(sequence) {
    super();
    this.sequence = [...sequence];
  }
  async generateText() {
    return this.sequence.shift() || 'invalid json';
  }
}

describe('LLM Service (Resilience & Caching)', () => {
  let db;

  beforeEach(() => {
    db = getDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  const TestSchema = z.object({
    status: z.string(),
    count: z.number()
  });

  it('retries when first response is malformed and recovers on second try', async () => {
    const provider = new FailingMockProvider([
      'This is not json',
      JSON.stringify({ status: 'recovered', count: 42 })
    ]);

    const service = new LLMService({ provider, db });
    const result = await service.generateStructured({
      promptType: 'test',
      promptText: 'Hello',
      cachePayload: { test: 1 },
      schema: TestSchema,
      fallback: { status: 'fallback', count: 0 }
    });

    expect(result.status).toBe('recovered');
    expect(result.count).toBe(42);
  });

  it('gracefully returns fallback if both attempts return invalid data', async () => {
    const provider = new FailingMockProvider(['bad json 1', 'bad json 2']);

    const service = new LLMService({ provider, db });
    const result = await service.generateStructured({
      promptType: 'test',
      promptText: 'Hello',
      cachePayload: { test: 2 },
      schema: TestSchema,
      fallback: { status: 'fallback_active', count: 99 }
    });

    expect(result.status).toBe('fallback_active');
    expect(result.count).toBe(99);
  });

  it('serves cached response on second identical call without invoking provider', async () => {
    let callCount = 0;
    const provider = {
      generateText: async () => {
        callCount += 1;
        return JSON.stringify({ status: 'live', count: callCount });
      }
    };

    const service = new LLMService({ provider, db });
    const payload = { promptKey: 'abc' };

    const first = await service.generateStructured({
      promptType: 'test_cache',
      promptText: 'prompt',
      cachePayload: payload,
      schema: TestSchema,
      fallback: { status: 'err', count: -1 }
    });

    const second = await service.generateStructured({
      promptType: 'test_cache',
      promptText: 'prompt',
      cachePayload: payload,
      schema: TestSchema,
      fallback: { status: 'err', count: -1 }
    });

    expect(first.count).toBe(1);
    expect(second.count).toBe(1); // Cached value, provider not called again
    expect(callCount).toBe(1);
  });
});
