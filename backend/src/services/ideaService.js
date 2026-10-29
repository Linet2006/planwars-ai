/**
 * Idea Service: Personalized ideas generation, filtering, interactive chat refinement.
 */

import crypto from 'crypto';
import { LLMService } from '../llm/llmService.js';
import { buildPersonalizedIdeasPrompt } from '../llm/prompts.js';
import { PersonalizedIdeasSchema } from '../llm/schemas.js';
import { getEventById } from './eventService.js';

/**
 * Retrieves ideas for an event with optional category/tag filters.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function getIdeas(db, eventId, filters = {}) {
  let query = 'SELECT * FROM ideas WHERE event_id = ?';
  const params = [eventId];

  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.savedOnly) {
    query += ' AND is_saved = 1';
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);

  return rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags_json || '[]'),
    is_saved: Boolean(r.is_saved)
  }));
}

/**
 * Toggles whether an idea is saved to the plan.
 * @param {import('better-sqlite3').Database} db
 * @param {string} ideaId
 * @param {boolean} isSaved
 * @returns {object|null}
 */
export function toggleSaveIdea(db, ideaId, isSaved) {
  db.prepare('UPDATE ideas SET is_saved = ? WHERE id = ?').run(isSaved ? 1 : 0, ideaId);
  return db.prepare('SELECT * FROM ideas WHERE id = ?').get(ideaId);
}

/**
 * Generates personalized event ideas via LLM.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} [options]
 * @param {string} [options.focusArea='all']
 * @param {LLMService} [options.llmService]
 * @returns {Promise<Array<object>>}
 */
export async function generatePersonalizedIdeas(db, eventId, { focusArea = 'all', llmService } = {}) {
  const event = getEventById(db, eventId);
  if (!event) throw new Error('Event not found');

  const service = llmService || new LLMService({ db });
  const prompt = buildPersonalizedIdeasPrompt(event, focusArea);

  const fallback = {
    ideas: [
      {
        category: 'Decor',
        title: 'Marigold & Earthen Diya Ambience',
        description: 'Vibrant local marigolds paired with terracotta lamps. Affordable, eco-friendly, and culturally authentic.',
        estimatedCostTier: '₹',
        tags: ['budget-friendly', 'eco-friendly', 'cultural']
      },
      {
        category: 'Activity',
        title: 'Multigenerational Family Trivia',
        description: 'Custom trivia cards placed on dinner tables celebrating personal stories and uniting kids with elders.',
        estimatedCostTier: '₹',
        tags: ['kid-friendly', 'elderly-friendly', 'free']
      }
    ]
  };

  const aiResult = await service.generateStructured({
    promptType: 'personalized_ideas',
    promptText: prompt,
    cachePayload: { eventId, focusArea, culture: event.cultural_context },
    schema: PersonalizedIdeasSchema,
    fallback
  });

  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO ideas (id, event_id, category, title, description, estimated_cost_tier, tags_json, is_saved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);

  db.transaction(() => {
    aiResult.ideas.forEach((item) => {
      insertStmt.run(
        crypto.randomUUID(),
        eventId,
        item.category,
        item.title,
        item.description,
        item.estimatedCostTier,
        JSON.stringify(item.tags),
        now
      );
    });
  })();

  return getIdeas(db, eventId);
}

/**
 * Refines an idea (e.g. "make it cheaper" or "suitable for kids and elders").
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} params
 * @param {string} params.ideaId
 * @param {string} params.instruction
 * @param {LLMService} [params.llmService]
 * @returns {Promise<object>}
 */
export async function refineIdea(db, eventId, { ideaId, instruction, llmService }) {
  const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(ideaId);
  const event = getEventById(db, eventId);
  if (!idea || !event) throw new Error('Idea or event not found');

  const service = llmService || new LLMService({ db });
  const prompt = `
You are PlanWars AI. Refine this event idea based strictly on the user's feedback: "${instruction}".
Original Idea:
Title: ${idea.title}
Category: ${idea.category}
Description: ${idea.description}
Budget Context: ₹${event.budget_total}

Output JSON schema format:
{
  "ideas": [
    {
      "category": "${idea.category}",
      "title": "Refined title",
      "description": "Refined description addressing feedback",
      "estimatedCostTier": "₹" | "₹₹" | "₹₹₹",
      "tags": ["refined", "cheaper"]
    }
  ]
}
`;

  const fallback = {
    ideas: [
      {
        category: idea.category,
        title: `${idea.title} (Value Alternative)`,
        description: `Modified version of ${idea.title} optimized for budget and comfort: ${instruction}`,
        estimatedCostTier: '₹',
        tags: ['budget-alternative', 'customized']
      }
    ]
  };

  const aiResult = await service.generateStructured({
    promptType: 'idea_refinement',
    promptText: prompt,
    cachePayload: { ideaId, instruction },
    schema: PersonalizedIdeasSchema,
    fallback
  });

  const refined = aiResult.ideas[0];
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO ideas (id, event_id, category, title, description, estimated_cost_tier, tags_json, is_saved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    newId,
    eventId,
    refined.category,
    refined.title,
    refined.description,
    refined.estimatedCostTier,
    JSON.stringify(refined.tags),
    now
  );

  return db.prepare('SELECT * FROM ideas WHERE id = ?').get(newId);
}

