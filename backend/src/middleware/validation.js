import { sanitizeObject } from '../utils/sanitizer.js';

/**
 * Factory creating Express middleware that validates request data against a Zod schema.
 * Automatically sanitizes string inputs to prevent XSS.
 * @param {object} schemas
 * @param {import('zod').ZodType} [schemas.body]
 * @param {import('zod').ZodType} [schemas.query]
 * @param {import('zod').ZodType} [schemas.params]
 * @returns {import('express').RequestHandler}
 */
export function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) {
        const sanitizedBody = sanitizeObject(req.body);
        const parsed = body.parse(sanitizedBody);
        req.body = parsed;
      }
      if (query) {
        const parsed = query.parse(req.query);
        req.query = parsed;
      }
      if (params) {
        const parsed = params.parse(req.params);
        req.params = parsed;
      }
      return next();
    } catch (err) {
      if (err.errors) {
        return res.status(400).json({
          status: 400,
          error: 'Validation Error',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({
        status: 400,
        error: 'Validation Error',
        message: err.message
      });
    }
  };
}

