import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { getDatabase } from '../../db/index.js';
import { LLMService } from '../../llm/llmService.js';
import { MockLLMProvider } from '../../llm/provider.js';

describe('API Integration Tests (Core: Health, Intake, Events, Budget)', () => {
  let app;
  let db;
  let testEventId;
  let testBudgetItemId;

  beforeAll(() => {
    db = getDatabase(':memory:');
    const mockProvider = new MockLLMProvider();
    const llmService = new LLMService({ provider: mockProvider, db });
    app = createApp({ db, llmService });
  });

  afterAll(() => {
    db.close();
  });

  // 1. Healthcheck
  it('GET /api/health returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  // 2. Intake Flow
  it('POST /api/intake/chat conducts conversational question-asking', async () => {
    const res = await request(app)
      .post('/api/intake/chat')
      .send({
        message: 'I want to organize my wedding with 25 Lakhs budget',
        partialData: { eventType: 'wedding', budgetTotal: 2500000 }
      });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
  });

  it('POST /api/intake/initialize creates a complete multi-domain plan', async () => {
    const res = await request(app)
      .post('/api/intake/initialize')
      .send({
        title: 'Sharma Wedding',
        eventType: 'wedding',
        budgetTotal: 2500000,
        guestCount: 350,
        eventDate: '2026-12-15',
        location: 'Jaipur',
        priorities: 'Grand hospitality'
      });
    expect(res.status).toBe(201);
    expect(res.body.event).toBeDefined();
    expect(res.body.budget).toBeDefined();
    expect(res.body.timeline).toBeDefined();
    expect(res.body.vendors).toBeDefined();
    expect(res.body.ideas).toBeDefined();
  });

  // 3. Events CRUD
  it('POST /api/events creates an event with validation', async () => {
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
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    testEventId = res.body.id;
  });

  it('POST /api/events fails with 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('GET /api/events returns paginated event list', async () => {
    const res = await request(app).get('/api/events?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/events/:id returns full plan with calculated stats', async () => {
    const res = await request(app).get(`/api/events/${testEventId}`);
    expect(res.status).toBe(200);
    expect(res.body.event.id).toBe(testEventId);
    expect(res.body.budget).toBeDefined();
    expect(res.body.tasks).toBeDefined();
  });

  it('PATCH /api/events/:id updates metadata', async () => {
    const res = await request(app)
      .patch(`/api/events/${testEventId}`)
      .send({ title: 'Anita Grand 10th Birthday' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Anita Grand 10th Birthday');
  });

  // 4. Budget Endpoints
  it('POST /api/events/:id/budget adds a budget item', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/budget`)
      .send({
        category: 'Birthday Cake & Snacks',
        estimatedAmount: 25000,
        notes: 'Custom chocolate truffle cake'
      });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Birthday Cake & Snacks');
    testBudgetItemId = res.body.id;
  });

  it('PATCH /api/events/:id/budget/:itemId confirms actual cost', async () => {
    const res = await request(app)
      .patch(`/api/events/${testEventId}/budget/${testBudgetItemId}`)
      .send({
        actualAmount: 24000,
        isConfirmed: true
      });
    expect(res.status).toBe(200);
    expect(res.body.actual_amount).toBe(24000);
    expect(res.body.is_confirmed).toBe(1);
  });

  it('GET /api/events/:id/budget returns items and deterministic stats', async () => {
    const res = await request(app).get(`/api/events/${testEventId}/budget`);
    expect(res.status).toBe(200);
    expect(res.body.budgetTotal).toBe(75000);
    expect(res.body.totalAllocated).toBe(24000);
    expect(res.body.remainingBudget).toBe(51000);
  });

  it('POST /api/events/:id/budget/generate produces AI allocations', async () => {
    const res = await request(app)
      .post(`/api/events/${testEventId}/budget/generate`)
      .send({ overwrite: true });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
  });
});

