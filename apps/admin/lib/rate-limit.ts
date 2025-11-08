import { rateLimit } from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Rate limiter for image generation requests
 * Limit: 10 requests per minute per IP
 * Note: Uses in-memory store. For production on Vercel, use Upstash Ratelimit.
 */
export const imageGenerationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  limit: 10, // 10 requests per minute
  message: { error: 'Too many brief generation requests. Please try again later.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP address as key (or user ID for authenticated requests)
    return req.ip || 'unknown';
  },
  skip: (req: Request) => {
    // Skip rate limiting for localhost in development
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});
