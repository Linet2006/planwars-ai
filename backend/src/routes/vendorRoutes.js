import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as vendorService from '../services/vendorService.js';

export function createVendorRouter(db, llmService) {
  const router = Router({ mergeParams: true });

  const CreateVendorSchema = z.object({
    category: z.string().min(1, 'Category is required'),
    name: z.string().min(1, 'Vendor name is required'),
    contactInfo: z.string().optional(),
    status: z.enum(['researching', 'contacted', 'quoted', 'booked', 'declined']).optional(),
    notes: z.string().optional()
  });

  const AddChecklistItemSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    itemType: z.enum(['requirement', 'question', 'document']).optional(),
    isCompleted: z.boolean().optional()
  });

  const CompareQuoteSchema = z.object({
    rawQuoteText: z.string().min(10, 'Quotation text must be at least 10 characters'),
    vendorName: z.string().optional()
  });

  // Get all vendors for an event
  router.get('/', (req, res, next) => {
    try {
      const vendors = vendorService.getVendorsWithDetails(db, req.params.id);
      res.json(vendors);
    } catch (err) {
      next(err);
    }
  });

  // Create vendor category
  router.post('/', validateRequest({ body: CreateVendorSchema }), (req, res, next) => {
    try {
      const vendor = vendorService.createVendor(db, req.params.id, req.body);
      res.status(201).json(vendor);
    } catch (err) {
      next(err);
    }
  });

  // Generate vendor categories via AI
  router.post('/generate', llmLimiter, async (req, res, next) => {
    try {
      const vendors = await vendorService.generateAIVendorCategories(db, req.params.id, { llmService });
      res.json(vendors);
    } catch (err) {
      next(err);
    }
  });

  // Add checklist item to vendor
  router.post('/:vendorId/checklist', validateRequest({ body: AddChecklistItemSchema }), (req, res, next) => {
    try {
      const item = vendorService.addChecklistItem(db, req.params.vendorId, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  // Toggle checklist item
  router.patch('/checklist/:itemId', (req, res, next) => {
    try {
      const isCompleted = Boolean(req.body.isCompleted);
      const updated = vendorService.toggleChecklistItem(db, req.params.itemId, isCompleted);
      if (!updated) return res.status(404).json({ error: 'Checklist item not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Compare quote via LLM
  router.post('/:vendorId/quotes/compare', llmLimiter, validateRequest({ body: CompareQuoteSchema }), async (req, res, next) => {
    try {
      const comparison = await vendorService.compareVendorQuote(db, req.params.id, req.params.vendorId, {
        rawQuoteText: req.body.rawQuoteText,
        vendorName: req.body.vendorName,
        llmService
      });
      res.json(comparison);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

