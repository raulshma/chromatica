import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../redis-client.js';
import { config } from '../config.js';

const FEED_CACHE_KEY = 'wallpapers:feed:v1';

export const wallpapersCacheMiddleware = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const client = getRedisClient();
    if (!client) return next();

    const cached = await client.get(FEED_CACHE_KEY);
    if (!cached) return next();

    res.setHeader('X-Cache', 'HIT');
    res.type('application/json').send(cached);
  } catch (error) {
    console.error('[api] Cache lookup failed', error);
    next();
  }
};

export const setWallpapersCache = async (payload: unknown) => {
  try {
    const client = getRedisClient();
    if (!client) return;

    await client.set(FEED_CACHE_KEY, JSON.stringify(payload), {
      EX: config.cacheTtlSeconds,
    });
  } catch (error) {
    console.error('[api] Cache set failed', error);
  }
};
