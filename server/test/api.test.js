import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store/index.js';
import { notifyOwner, buildEmail } from '../src/notify.js';

process.env.ADMIN_TOKEN = 'test-admin-token-1234567890';
const AUTH = { authorization: 'Bearer test-admin-token-1234567890' };

async function start(opts = {}) {
  const store = await createStore('');
  const app = createApp(store, { origins: ['http://localhost:5173'], ...opts });
  const server = app.listen(0);
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

const json = (body) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('health, profile, visits and messages', async () => {
  const notified = [];
  const { server, base } = await start({ notify: async (m) => notified.push(m) });
  try {
    assert.equal((await (await fetch(`${base}/api/health`)).json()).ok, true);
    assert.equal((await (await fetch(`${base}/api/profile`)).json()).name, 'Khondaker Arifur Rahman');

    const v1 = await (await fetch(`${base}/api/visits`, { method: 'POST' })).json();
    const v2 = await (await fetch(`${base}/api/visits`, { method: 'POST' })).json();
    assert.equal(v2.visits, v1.visits + 1);

    const bad = await fetch(`${base}/api/messages`, json({ name: 'A', email: 'x' }));
    assert.equal(bad.status, 400);
    const badBody = await bad.json();
    assert.ok(badBody.fields.email && badBody.fields.message && badBody.fields.name);

    const good = await fetch(`${base}/api/messages`, json({ name: 'Recruiter', email: 'hr@example.com', subject: 'Role', message: 'We would like to talk about a Head of IT role.' }));
    assert.equal(good.status, 201);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(notified.length, 1, 'owner is notified');
    assert.equal(notified[0].email, 'hr@example.com');

    // Honeypot: accepted silently, not stored, no email
    const spam = await fetch(`${base}/api/messages`, json({ name: 'Bot', email: 'b@b.co', message: 'buy cheap things now', website: 'x' }));
    assert.equal(spam.status, 201);

    assert.equal((await fetch(`${base}/api/messages`)).status, 401);
    assert.equal((await fetch(`${base}/api/messages`, { headers: { authorization: 'Bearer wrong' } })).status, 401);

    let list = await (await fetch(`${base}/api/messages`, { headers: AUTH })).json();
    assert.equal(list.messages.length, 1);
    assert.equal(list.unread, 1);
    const id = list.messages[0].id;

    const mark = await fetch(`${base}/api/messages/${id}/read`, { method: 'PATCH', headers: { ...AUTH, 'content-type': 'application/json' }, body: JSON.stringify({ read: true }) });
    assert.equal(mark.status, 200);
    list = await (await fetch(`${base}/api/messages`, { headers: AUTH })).json();
    assert.equal(list.unread, 0);

    const unmark = await fetch(`${base}/api/messages/${id}/read`, { method: 'PATCH', headers: { ...AUTH, 'content-type': 'application/json' }, body: JSON.stringify({ read: false }) });
    assert.equal((await unmark.json()).read, false);

    assert.equal((await fetch(`${base}/api/messages/${id}`, { method: 'DELETE' })).status, 401);
    assert.equal((await fetch(`${base}/api/messages/${id}`, { method: 'DELETE', headers: AUTH })).status, 200);
    assert.equal((await fetch(`${base}/api/messages/${id}`, { method: 'DELETE', headers: AUTH })).status, 404);
    list = await (await fetch(`${base}/api/messages`, { headers: AUTH })).json();
    assert.equal(list.total, 0);

    const pre = await fetch(`${base}/api/messages`, { method: 'OPTIONS', headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'DELETE', 'access-control-request-headers': 'authorization' } });
    assert.match(pre.headers.get('access-control-allow-methods'), /DELETE/);
  } finally {
    server.close();
  }
});

test('notifyOwner skips when not configured and calls Resend when configured', async () => {
  const msg = { name: 'Ann <script>', email: 'ann@example.com', subject: 'Hi', message: 'Line 1\nLine 2' };
  assert.equal((await notifyOwner(msg, {})).reason, 'not-configured');

  let call;
  const fakeFetch = async (url, opts) => {
    call = { url, opts };
    return { ok: true, text: async () => '' };
  };
  const r = await notifyOwner(msg, { RESEND_API_KEY: 're_test', NOTIFY_EMAIL: 'me@example.com', CLIENT_ORIGIN: 'https://bitopiit-dev.github.io' }, fakeFetch);
  assert.equal(r.sent, true);
  assert.equal(call.url, 'https://api.resend.com/emails');
  assert.equal(call.opts.headers.authorization, 'Bearer re_test');
  const body = JSON.parse(call.opts.body);
  assert.deepEqual(body.to, ['me@example.com']);
  assert.equal(body.reply_to, 'ann@example.com');
  assert.match(body.subject, /Ann/);
  assert.ok(!body.html.includes('<script>'), 'html is escaped');
  assert.match(body.text, /https:\/\/bitopiit-dev\.github\.io\/admin\//);

  const failing = async () => ({ ok: false, status: 403, text: async () => 'forbidden' });
  const orig = console.error; console.error = () => {};
  assert.equal((await notifyOwner(msg, { RESEND_API_KEY: 'k', NOTIFY_EMAIL: 'me@x.co' }, failing)).sent, false);
  console.error = orig;
});

test('buildEmail falls back cleanly without a subject', () => {
  const e = buildEmail({ name: 'Bob', email: 'b@x.co', subject: '', message: 'Hello there friend' }, { to: 'me@x.co', from: 'P <onboarding@resend.dev>', siteUrl: '' });
  assert.equal(e.subject, 'New website message from Bob');
  assert.ok(!e.text.includes('admin'));
});
