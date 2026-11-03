import crypto from 'node:crypto';

export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN || '';
  const header = req.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (!expected || expected.startsWith('change-me') || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Admin token missing or wrong.' });
  }
  next();
}
