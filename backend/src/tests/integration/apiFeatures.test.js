import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { getDatabase } from '../../db/index.js';
import { LLMService } from '../../llm/llmService.js';
import { MockLLMProvider } from '../../llm/provider.js';

describe('API Integration Tests (Features: Timeline, Vendors, Ideas, Replan)', () => {
  let app;
  let db;
  let testEventId;
  let testTaskId;
  let testVendorId;
  let testChecklistItemId;
  let testIdeaId;

  beforeAll(async () => {
    db = getDatabase(':memory:');
    const mockProvider = new MockLLMProvider();
    const llmService = new LLMService({ provider: mockProvider, db });
    app = createApp({ db, llmService });

    // Seed test event
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Anita 10th Birthday',
        eventType: 'birthday',
        budgetTotal: 75000,
        guestCount: 45,
        eventDate: '2026-11-20',
        location: 'Pune',
        priorities: 'Fun games and cake'
      });
    testEventId = res.body.id;
  });

  afterAll(() => {
    db.close();
  });

  // 1. Timeline Endpoints
  it('POST /api/events/:id/timeline adds a task', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/timeline`)
      .send({
        title: 'Book Kids Party Magician',
        dueDate: '2026-11-10',
        priority: 'high'
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Book Kids Party Magician');
    testTaskId = res.body.id;
  });

  it('PATCH /api/events/:id/timeline/:taskId updates task status & delays', async () => {
    const res = await request(app)
      .patch(`/api/events/${testEventId}/timeline/${testTaskId}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('completed');
  });

  it('POST /api/events/:id/timeline/generate generates backward schedule', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/timeline/generate`)
      .send({ overwrite: true });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  // 2. Vendors Endpoints
  it('POST /api/events/:id/vendors adds a vendor', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/vendors`)
      .send({
        category: 'Entertainment',
        name: 'Magic Master Raj'
      });
    expect(res.status).toBe(201);
    testVendorId = res.body.id;
  });

  it('POST /api/events/:id/vendors/:vendorId/checklist adds a checklist item', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/vendors/${testVendorId}/checklist`)
      .send({
        title: 'Confirm sound system requirements',
        itemType: 'requirement'
      });
    expect(res.status).toBe(201);
    testChecklistItemId = res.body.id;
  });

  it('PATCH /api/events/:id/vendors/checklist/:itemId toggles completion', async () => {
    const res = await request(app)
      .patch(`/api/events/${testEventId}/vendors/checklist/${testChecklistItemId}`)
      .send({ isCompleted: true });
    expect(res.status).toBe(200);
    expect(res.body.is_completed).toBe(1);
  });

  it('POST /api/events/:id/vendors/:vendorId/quotes/compare extracts quote structured comparison', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/vendors/${testVendorId}/quotes/compare`)
      .send({
        rawQuoteText: 'Proposal for Magic & Balloon Show: ₹12,000 all inclusive. 45 kids covered. Extra hour ₹2,000.',
        vendorName: 'Magic Master Raj'
      });
    expect(res.status).toBe(200);
    expect(res.body.totalAmount).toBeDefined();
    expect(res.body.inclusions).toBeDefined();
    expect(res.body.extraCharges).toBeDefined();
  });

  // 3. Ideas Endpoints
  it('POST /api/events/:id/ideas/generate produces tailored ideas', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/ideas/generate`)
      .send({ focusArea: 'games' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) testIdeaId = res.body[0].id;
  });

  it('POST /api/events/:id/ideas/refine refines ideas with user feedback', async () => {
    if (testIdeaId) {
      const res = await request(app)
        .post(`/api/events/${testEventId}/ideas/refine`)
        .send({
          ideaId: testIdeaId,
          instruction: 'Make it suitable for both 10-year-olds and grandparents'
        });
      expect(res.status).toBe(200);
      expect(res.body.title).toBeDefined();
    }
  });

  it('PATCH /api/events/:id/ideas/:ideaId toggles save status', async () => {
    if (testIdeaId) {
      const res = await request(app)
        .patch(`/api/events/${testEventId}/ideas/${testIdeaId}`)
        .send({ isSaved: true });
      expect(res.status).toBe(200);
      expect(res.body.is_saved).toBe(1);
    }
  });

  // 4. Replan Flow (Crucial Challenge Scenario: "+50 guests, lower budget, 2 weeks earlier")
  it('POST /api/events/:id/replan/evaluate returns trade-off options with before/after diff', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/replan/evaluate`)
      .send({
        guestCount: 95, // +50 guests
        budgetTotal: 65000, // lower budget
        eventDate: '2026-11-06' // 14 days earlier
      });
    expect(res.status).toBe(200);
    expect(res.body.constraintDiff).toBeDefined();
    expect(res.body.constraintDiff.guests.delta).toBe(50);
    expect(res.body.constraintDiff.timeline.daysShifted).toBe(-14);
    expect(Array.isArray(res.body.options)).toBe(true);
    expect(res.body.options.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/events/:id/replan/apply updates the plan in place without restarting', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/replan/apply`)
      .send({
        optionId: 'opt-menu-favors',
        guestCount: 95,
        budgetTotal: 65000,
        eventDate: '2026-11-06',
        budgetAdjustments: [
          { category: 'Decor & Floral', newPercentage: 8, reason: 'Simplify balloon arch' }
        ],
        timelineAdjustmentDays: -14
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event.guest_count).toBe(95);
    expect(res.body.event.budget_total).toBe(65000);
    expect(res.body.event.event_date).toBe('2026-11-06');
  });

  // 5. Error and 404 handling
  it('returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  // 6. Delete Event
  it('DELETE /api/events/:id removes event and cascades related data', async () => {
    const res = await request(app).delete(`/api/events/${testEventId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`/api/events/${testEventId}`);
    expect(getRes.status).toBe(404);
  });
});

