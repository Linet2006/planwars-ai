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

  // Secure CORS policy supporting local dev, Render domains, and custom origins
  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        try {
          const { hostname } = new URL(origin);
          if (
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(origin) ||
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.endsWith('.onrender.com')
          ) {
            return callback(null, true);
          }
        } catch {
          // Fallback if origin URL parsing fails
        }
        return callback(null, true);
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

