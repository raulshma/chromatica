import { createClient } from 'redis';

import { config } from './config.js';

let client: ReturnType<typeof createClient> | null = null;

export const getRedisClient = () => {
  if (!config.redisUrl && (!config.redisHost || !config.redisPort)) return null;

  if (!client) {
    client = config.redisUrl
      ? createClient({ url: config.redisUrl })
      : createClient({
          socket: {
            host: config.redisHost,
            port: config.redisPort,
          },
        });

    client.on('error', (err: Error) => {
      console.error('[api] Redis client error', err);
    });

    client.connect().catch((err: Error) => {
      console.error('[api] Failed to connect to Redis', err);
    });
  }

  return client;
};
