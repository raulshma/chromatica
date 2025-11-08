import { Env } from '@chromatica/shared';

export interface ApiConfig {
  nodeEnv: Env | 'test';
  port: number;
  uploadthingToken?: string;
  uploadthingAppId?: string;
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
  rateLimit: {
    globalWindowMs: number;
    globalMax: number;
    wallpapersWindowMs: number;
    wallpapersMax: number;
  };
  cors: {
    origins: string[];
  };
  cacheTtlSeconds: number;
}

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) return ['*'];
  return value
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
};

export const getConfig = (): ApiConfig => {
  const nodeEnv = (process.env.NODE_ENV as Env | 'test') || Env.dev;

  return {
    nodeEnv,
    port: toInt(process.env.PORT, 3000),
    uploadthingToken: process.env.UPLOADTHING_TOKEN,
    uploadthingAppId: process.env.UPLOADTHING_APP_ID ?? process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID,
    redisUrl: process.env.REDIS_URL,
    redisHost: process.env.REDIS_HOST,
    redisPort: toInt(process.env.REDIS_PORT, 18882),
    rateLimit: {
      globalWindowMs: toInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 15 * 60 * 1000),
      globalMax: toInt(process.env.RATE_LIMIT_GLOBAL_MAX, 300),
      wallpapersWindowMs: toInt(process.env.RATE_LIMIT_WALLPAPERS_WINDOW_MS, 10 * 60 * 1000),
      wallpapersMax: toInt(process.env.RATE_LIMIT_WALLPAPERS_MAX, 120),
    },
    cors: {
      origins: parseOrigins(process.env.CORS_ORIGINS),
    },
    cacheTtlSeconds: toInt(process.env.CACHE_TTL_SECONDS, 120),
  };
};

export const config = getConfig();
