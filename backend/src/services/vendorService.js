/**
 * Vendor Service: Manages vendor categories, checklist items, and quotation comparison.
 */

import crypto from 'crypto';
import { LLMService } from '../llm/llmService.js';
import { buildQuoteComparisonPrompt, buildVendorCategoriesPrompt } from '../llm/prompts.js';
import { QuoteComparisonSchema, VendorCategoriesSchema } from '../llm/schemas.js';
import { getEventById } from './eventService.js';

/**
 * Retrieves all vendors with checklists and quotes for an event.
 * Efficient: Queries in batch to prevent N+1 queries.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @returns {Array<object>}
 */
export function getVendorsWithDetails(db, eventId) {
  const vendors = db.prepare('SELECT * FROM vendors WHERE event_id = ? ORDER BY category ASC').all(eventId);
  if (!vendors.length) return [];

  const vendorIds = vendors.map((v) => v.id);
  const placeholders = vendorIds.map(() => '?').join(',');

  const checklistItems = db.prepare(`
    SELECT * FROM vendor_checklist_items
    WHERE vendor_id IN (${placeholders})
    ORDER BY created_at ASC
  `).all(...vendorIds);

  const quotes = db.prepare(`
    SELECT * FROM quotes
    WHERE vendor_id IN (${placeholders})
    ORDER BY created_at DESC
  `).all(...vendorIds);

  const itemMap = new Map();
  checklistItems.forEach((item) => {
    if (!itemMap.has(item.vendor_id)) itemMap.set(item.vendor_id, []);
    itemMap.get(item.vendor_id).push(item);
  });

  const quoteMap = new Map();
  quotes.forEach((q) => {
    if (!quoteMap.has(q.vendor_id)) quoteMap.set(q.vendor_id, []);
    quoteMap.get(q.vendor_id).push({
      ...q,
      inclusions: JSON.parse(q.inclusions_json || '[]'),
      extraCharges: JSON.parse(q.extra_charges_json || '[]'),
      openQuestions: JSON.parse(q.open_questions_json || '[]')
    });
  });

  return vendors.map((v) => ({
    ...v,
    checklist: itemMap.get(v.id) || [],
    quotes: quoteMap.get(v.id) || []
  }));
}

/**
 * Creates a vendor category entry.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} data
 * @returns {object}
 */
export function createVendor(db, eventId, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO vendors (id, event_id, category, name, contact_info, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, eventId, data.category, data.name, data.contactInfo || '', data.status || 'researching', data.notes || '', now, now);

  return db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
}

/**
 * Adds a checklist item to a vendor.
 * @param {import('better-sqlite3').Database} db
 * @param {string} vendorId
 * @param {object} data
 * @returns {object}
 */
export function addChecklistItem(db, vendorId, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO vendor_checklist_items (id, vendor_id, title, item_type, is_completed, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, vendorId, data.title, data.itemType || 'requirement', data.isCompleted ? 1 : 0, now);

  return db.prepare('SELECT * FROM vendor_checklist_items WHERE id = ?').get(id);
}

/**
 * Toggles a checklist item's completion status.
 * @param {import('better-sqlite3').Database} db
 * @param {string} itemId
 * @param {boolean} isCompleted
 * @returns {object|null}
 */
export function toggleChecklistItem(db, itemId, isCompleted) {
  db.prepare('UPDATE vendor_checklist_items SET is_completed = ? WHERE id = ?').run(isCompleted ? 1 : 0, itemId);
  return db.prepare('SELECT * FROM vendor_checklist_items WHERE id = ?').get(itemId);
}

/**
 * Compares an unstructured vendor quote via LLM and stores structured quote record.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {string} vendorId
 * @param {object} options
 * @param {string} options.rawQuoteText
 * @param {string} [options.vendorName]
 * @param {LLMService} [options.llmService]
 * @returns {Promise<object>}
 */
export async function compareVendorQuote(db, eventId, vendorId, { rawQuoteText, vendorName, llmService }) {
  const event = getEventById(db, eventId);
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId);
  if (!event || !vendor) throw new Error('Event or vendor not found');

  const categoryBudget = db.prepare('SELECT * FROM budget_items WHERE event_id = ? AND category LIKE ?').get(eventId, `%${vendor.category}%`);

  const service = llmService || new LLMService({ db });
  const prompt = buildQuoteComparisonPrompt({ rawQuoteText, event, vendor, categoryBudget });

  const fallback = {
    vendorName: vendorName || vendor.name || 'Vendor Quote',
    totalAmount: 0,
    guestsCovered: event.guest_count,
    inclusions: ['Basic service as per proposal'],
    extraCharges: ['Taxes and logistics not specified'],
    openQuestions: ['Are transport and setup labor fees included?'],
    budgetFitAssessment: 'Manual price confirmation required'
  };

  const aiResult = await service.generateStructured({
    promptType: 'quote_comparison',
    promptText: prompt,
    cachePayload: { eventId, vendorId, textHash: rawQuoteText.length },
    schema: QuoteComparisonSchema,
    fallback
  });

  const quoteId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO quotes (
      id, vendor_id, vendor_name, total_amount, guests_covered,
      inclusions_json, extra_charges_json, open_questions_json, is_selected, raw_text, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quoteId,
    vendorId,
    aiResult.vendorName,
    aiResult.totalAmount,
    aiResult.guestsCovered,
    JSON.stringify(aiResult.inclusions),
    JSON.stringify(aiResult.extraCharges),
    JSON.stringify(aiResult.openQuestions),
    0,
    rawQuoteText,
    now
  );

  return {
    quoteId,
    ...aiResult
  };
}

/**
 * Generates recommended vendor categories and checklist items for an event.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} [options]
 * @param {LLMService} [options.llmService]
 * @returns {Promise<Array<object>>}
 */
export async function generateAIVendorCategories(db, eventId, { llmService } = {}) {
  const event = getEventById(db, eventId);
  if (!event) throw new Error('Event not found');

  const service = llmService || new LLMService({ db });
  const prompt = buildVendorCategoriesPrompt(event);

  const fallback = {
    vendors: [
      {
        category: 'Catering',
        suggestedName: 'Catering Partner',
        requirements: ['Verify meal spread & service staff'],
        questions: ['Is service cutlery included?'],
        documents: ['FSSAI Food Safety Certificate']
      },
      {
        category: 'Decor & Ambience',
        suggestedName: 'Floral & Decor Partner',
        requirements: ['Confirm fireproof fabric & lighting power'],
        questions: ['Is dismantling included?'],
        documents: ['Itemized Quotation']
      }
    ]
  };

  const aiResult = await service.generateStructured({
    promptType: 'vendor_categories',
    promptText: prompt,
    cachePayload: { eventId, type: event.event_type },
    schema: VendorCategoriesSchema,
    fallback
  });

  db.transaction(() => {
    const now = new Date().toISOString();
    const vendorInsert = db.prepare(`
      INSERT INTO vendors (id, event_id, category, name, contact_info, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const checkInsert = db.prepare(`
      INSERT INTO vendor_checklist_items (id, vendor_id, title, item_type, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    aiResult.vendors.forEach((v) => {
      const vendorId = crypto.randomUUID();
      vendorInsert.run(vendorId, eventId, v.category, v.suggestedName, '', 'researching', '', now, now);

      v.requirements.forEach((req) => checkInsert.run(crypto.randomUUID(), vendorId, req, 'requirement', 0, now));
      v.questions.forEach((q) => checkInsert.run(crypto.randomUUID(), vendorId, q, 'question', 0, now));
      v.documents.forEach((doc) => checkInsert.run(crypto.randomUUID(), vendorId, doc, 'document', 0, now));
    });
  })();

  return getVendorsWithDetails(db, eventId);
}
