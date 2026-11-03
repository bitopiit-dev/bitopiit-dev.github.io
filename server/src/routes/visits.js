import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export function visitsRouter(store) {
  const r = Router();
  const limit = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

  r.get('/', async (_req, res, next) => {
    try {
      res.json({ visits: await store.getVisits() });
    } catch (e) {
      next(e);
    }
  });

  r.post('/', limit, async (_req, res, next) => {
    try {
      res.json({ visits: await store.incrementVisits() });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
