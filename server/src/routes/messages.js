import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin } from '../auth.js';
import { notifyOwner } from '../notify.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function validateMessage(body = {}) {
  const data = {
    name: clean(body.name, 100),
    email: clean(body.email, 200),
    subject: clean(body.subject, 150),
    message: clean(body.message, 4000),
  };
  const errors = {};
  if (data.name.length < 2) errors.name = 'Enter your name.';
  if (!EMAIL_RE.test(data.email)) errors.email = 'Enter a valid email address.';
  if (data.message.length < 10) errors.message = 'Write a message of at least 10 characters.';
  return { data, errors, ok: Object.keys(errors).length === 0 };
}

export function messagesRouter(store, { notify = notifyOwner } = {}) {
  const r = Router();

  const sendLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many messages from this address. Try again in 15 minutes.' },
  });

  // Slows down anyone guessing the admin token
  const adminLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many admin requests. Wait 15 minutes.' },
  });

  // Public: send a message from the contact form
  r.post('/', sendLimit, async (req, res, next) => {
    try {
      // Honeypot field: real visitors never fill it in
      if (req.body?.website) return res.status(201).json({ ok: true });
      const { data, errors, ok } = validateMessage(req.body);
      if (!ok) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });
      const saved = await store.addMessage(data);
      res.status(201).json({ ok: true, id: saved.id });
      // Email the owner after replying, so a slow mail API never delays the visitor
      notify(data).catch(() => {});
    } catch (e) {
      next(e);
    }
  });

  // Admin: list, mark read/unread, delete
  r.get('/', adminLimit, requireAdmin, async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
      const [messages, counts] = await Promise.all([store.listMessages({ limit }), store.countMessages()]);
      res.json({ messages, ...counts });
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id/read', adminLimit, requireAdmin, async (req, res, next) => {
    try {
      const read = req.body?.read === undefined ? true : Boolean(req.body.read);
      const ok = await store.setRead(req.params.id, read);
      if (!ok) return res.status(404).json({ error: 'Message not found.' });
      res.json({ ok: true, read });
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', adminLimit, requireAdmin, async (req, res, next) => {
    try {
      const ok = await store.deleteMessage(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Message not found.' });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
