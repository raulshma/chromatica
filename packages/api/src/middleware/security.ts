import type { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config.js';

export const applySecurityMiddleware = (app: Express) => {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow: boolean) => void,
      ) => {
        if (!origin || config.cors.origins.includes('*')) {
          return callback(null, true);
        }
        if (config.cors.origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      },
      methods: ['GET'],
      allowedHeaders: ['Content-Type'],
    }),
  );
};
