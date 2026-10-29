/**
 * LLM Provider Abstraction.
 * Supports Gemini, OpenRouter, and a deterministic MockProvider for offline testing.
 */

import { config } from '../config/index.js';
import { MOCK_RESPONSES } from './mockData.js';

export class BaseLLMProvider {
  /**
   * Generates a raw text response given a prompt.
   * @param {string} _prompt
   * @param {object} [_options]
   * @returns {Promise<string>}
   */
  async generateText(_prompt, _options = {}) {
    throw new Error('Method generateText() must be implemented');
  }
}

/**
 * Deterministic Mock LLM Provider for offline evaluation, unit testing, and instant development.
 * Generates valid JSON matching prompt intentions without needing an API key.
 */
export class MockLLMProvider extends BaseLLMProvider {
  async generateText(prompt) {
    if (prompt.includes('Conduct a guided intake conversation')) {
      if (prompt.includes('budget') && !prompt.includes('guest') && !prompt.includes('date')) {
        return JSON.stringify({
          reply: 'Wonderful! Could you share the estimated guest count and your preferred event date?',
          missingFields: ['guestCount', 'eventDate'],
          readyToGenerate: false
        });
      }
      return JSON.stringify({
        reply: 'I have all key details! Creating your customized Indian event plan now.',
        missingFields: [],
        readyToGenerate: true,
        planPreview: {
          title: 'Curated Celebration',
          eventType: prompt.includes('wedding')
            ? 'wedding'
            : prompt.includes('birthday')
              ? 'birthday'
              : 'community',
          budgetTotal: 2500000,
          guestCount: 350,
          eventDate: '2026-12-15',
          priorities: 'Balanced hospitality and memorable decor'
        }
      });
    }

    if (prompt.includes('Propose realistic budget allocation percentages')) {
      if (prompt.includes('wedding')) return JSON.stringify(MOCK_RESPONSES.weddingBudget);
      if (prompt.includes('birthday')) return JSON.stringify(MOCK_RESPONSES.birthdayBudget);
      return JSON.stringify(MOCK_RESPONSES.communityBudget);
    }

    if (prompt.includes('Generate a backward task schedule')) {
      return JSON.stringify({ tasks: MOCK_RESPONSES.timelineTasks });
    }

    if (prompt.includes('Generate required vendor categories')) {
      return JSON.stringify({ vendors: MOCK_RESPONSES.vendorCategories });
    }

    if (prompt.includes('Extract structured quotation details')) {
      return JSON.stringify(MOCK_RESPONSES.quoteComparison);
    }

    if (prompt.includes('Propose creative, culturally tailored')) {
      return JSON.stringify({ ideas: MOCK_RESPONSES.personalizedIdeas });
    }

    if (prompt.includes('Propose 2-3 realistic trade-off options')) {
      return JSON.stringify(MOCK_RESPONSES.replanTradeoffs);
    }

    return JSON.stringify({ message: 'Response generated successfully.' });
  }
}

/**
 * Gemini Provider using standard Google Gemini REST API.
 */
export class GeminiProvider extends BaseLLMProvider {
  constructor(apiKey = config.llm.geminiApiKey, model = config.llm.geminiModel) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }
}

/**
 * OpenRouter Provider using OpenRouter Chat Completions endpoint.
 */
export class OpenRouterProvider extends BaseLLMProvider {
  constructor(apiKey = config.llm.openRouterApiKey, model = config.llm.openRouterModel) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt) {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '{}';
  }
}

/**
 * Provider factory.
 * @param {string} [providerName]
 * @returns {BaseLLMProvider}
 */
export function createLLMProvider(providerName = config.llm.provider) {
  switch (providerName?.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    case 'mock':
    default:
      return new MockLLMProvider();
  }
}
