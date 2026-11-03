import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { messagesRouter } from './routes/messages.js';
import { visitsRouter } from './routes/visits.js';

const profilePath = fileURLToPath(new URL('../../shared/profile.json', import.meta.url));

export function createApp(store, { origins = [], notify } = {}) {
  const app = express();
  const profile = JSON.parse(readFileSync(profilePath, 'utf8'));

  app.set('trust proxy', 1); // behind Render / other proxies, so rate limits see the real IP
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || origins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: '20kb' }));

  app.get('/', (_req, res) => res.json({ name: 'arifur-portfolio-api', docs: '/api/health' }));
  app.get('/api/health', (_req, res) =>
    res.json({
      ok: true,
      store: store.kind,
      emailNotifications: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL),
      time: new Date().toISOString(),
    })
  );
  app.get('/api/profile', (_req, res) => res.json(profile));
  app.use('/api/messages', messagesRouter(store, notify ? { notify } : {}));
  app.use('/api/visits', visitsRouter(store));

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Server error. Try again later.' });
  });

  return app;
}
