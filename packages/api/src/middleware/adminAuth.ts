import type { Request, Response, NextFunction } from 'express';

const ADMIN_API_TOKEN_HEADER = 'x-admin-token';

export function requireAdminApiToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) {
    console.error('[api] ADMIN_API_TOKEN not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const provided = req.header(ADMIN_API_TOKEN_HEADER) || req.header('X-Admin-Token');
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}
