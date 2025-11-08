import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.globalWindowMs,
  max: config.rateLimit.globalMax,
  standardHeaders: true,
  legacyHeaders: false,
});

export const wallpapersLimiter = rateLimit({
  windowMs: config.rateLimit.wallpapersWindowMs,
  max: config.rateLimit.wallpapersMax,
  standardHeaders: true,
  legacyHeaders: false,
});
