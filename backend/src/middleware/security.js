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
        // In development, allow any localhost or 127.0.0.1 port, or any listed origin
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          (config.env === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        ) {
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

