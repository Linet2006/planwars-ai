/**
 * Intake Service: Conversational onboarding, smart question deduction, and baseline plan initialization.
 */

import crypto from 'crypto';
import { LLMService } from '../llm/llmService.js';
import { buildIntakePrompt } from '../llm/prompts.js';
import { IntakeChatSchema } from '../llm/schemas.js';
import { generateAIBudgetAllocation } from './budgetService.js';
import { createEvent } from './eventService.js';
import { generatePersonalizedIdeas } from './ideaService.js';
import { generateAITimeline } from './timelineService.js';
import { generateAIVendorCategories } from './vendorService.js';

/**
 * Handles conversational intake messages and decides follow-up questions.
 * @param {import('better-sqlite3').Database} db
 * @param {object} payload
 * @param {string} [payload.eventId]
 * @param {string} payload.message
 * @param {object} [payload.partialData]
 * @param {LLMService} [options.llmService]
 * @returns {Promise<object>}
 */
export async function processIntakeMessage(db, payload, { llmService } = {}) {
  const { eventId, message, partialData = {} } = payload;

  let history = [];
  if (eventId) {
    history = db.prepare('SELECT sender, content FROM messages WHERE event_id = ? ORDER BY created_at ASC').all(eventId);
  }

  const service = llmService || new LLMService({ db });
  const prompt = buildIntakePrompt({
    conversationHistory: history,
    partialData,
    currentMessage: message
  });

  const fallback = {
    reply: 'Thank you! To tailor your plan, what is your sanctioned budget and approximate guest count?',
    missingFields: ['budgetTotal', 'guestCount'],
    readyToGenerate: false,
    planPreview: {
      title: 'Community & Family Celebration',
      eventType: 'wedding',
      budgetTotal: 1500000,
      guestCount: 250,
      eventDate: '2026-11-20',
      priorities: 'Warm hospitality and delicious food'
    }
  };

  const aiResult = await service.generateStructured({
    promptType: 'intake_chat',
    promptText: prompt,
    cachePayload: { message, partialData },
    schema: IntakeChatSchema,
    fallback
  });

  if (eventId) {
    const now = new Date().toISOString();
    const msgInsert = db.prepare('INSERT INTO messages (id, event_id, sender, content, context_type, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    msgInsert.run(crypto.randomUUID(), eventId, 'user', message, 'intake', now);
    msgInsert.run(crypto.randomUUID(), eventId, 'assistant', aiResult.reply, 'intake', now);
  }

  return aiResult;
}

/**
 * Creates the complete baseline event plan across all domains once intake is satisfied.
 * @param {import('better-sqlite3').Database} db
 * @param {object} eventData
 * @param {object} [options]
 * @param {LLMService} [options.llmService]
 * @returns {Promise<object>}
 */
export async function initializeCompletePlan(db, eventData, { llmService } = {}) {
  const event = createEvent(db, eventData);

  // Initialize Budget, Timeline, Vendors, and Ideas concurrently or sequentially
  const budget = await generateAIBudgetAllocation(db, event.id, { llmService, overwrite: true });
  const timeline = await generateAITimeline(db, event.id, { llmService, overwrite: true });
  const vendors = await generateAIVendorCategories(db, event.id, { llmService });
  const ideas = await generatePersonalizedIdeas(db, event.id, { llmService });

  return {
    event,
    budget,
    timeline,
    vendors,
    ideas
  };
}

