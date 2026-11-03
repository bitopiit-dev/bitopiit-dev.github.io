import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store/index.js';

process.env.ADMIN_TOKEN = 'test-admin-token-1234567890';

async function start() {
  const store = await createStore('');
  const app = createApp(store, { origins: ['http://localhost:5173'] });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base };
}

test('health, profile, visits and messages', async () => {
  const { server, base } = await start();
  try {
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.ok, true);

    const profile = await (await fetch(`${base}/api/profile`)).json();
    assert.equal(profile.name, 'Khondaker Arifur Rahman');

    const v1 = await (await fetch(`${base}/api/visits`, { method: 'POST' })).json();
    const v2 = await (await fetch(`${base}/api/visits`, { method: 'POST' })).json();
    assert.equal(v2.visits, v1.visits + 1);

    const bad = await fetch(`${base}/api/messages`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'A', email: 'x' }),
    });
    assert.equal(bad.status, 400);
    const badBody = await bad.json();
    assert.ok(badBody.fields.email && badBody.fields.message && badBody.fields.name);

    const good = await fetch(`${base}/api/messages`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Recruiter', email: 'hr@example.com', subject: 'Role', message: 'We would like to talk about a Head of IT role.' }),
    });
    assert.equal(good.status, 201);

    const noAuth = await fetch(`${base}/api/messages`);
    assert.equal(noAuth.status, 401);

    const list = await (await fetch(`${base}/api/messages`, { headers: { authorization: 'Bearer test-admin-token-1234567890' } })).json();
    assert.equal(list.messages.length, 1);
    assert.equal(list.messages[0].email, 'hr@example.com');

    const mark = await fetch(`${base}/api/messages/${list.messages[0].id}/read`, {
      method: 'PATCH', headers: { authorization: 'Bearer test-admin-token-1234567890' },
    });
    assert.equal(mark.status, 200);
  } finally {
    server.close();
  }
});
