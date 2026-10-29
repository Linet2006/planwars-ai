import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from '../config/index.js';

/**
 * Configures security headers, CORS origin restriction, and JSON body parsing limits.
 * @param {import('express').Express} app
 */
export function setupSecurityMiddleware(app) {
  // Helmet with customized CSP for secure API serving
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // Strict CORS policy
  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps or curl) in development
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    })
  );

  // Enforce body parser size limit to prevent memory exhaustion / payload flooding
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));
}
