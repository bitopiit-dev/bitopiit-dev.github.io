// Talks to the Express API. When VITE_API_URL is empty the site still works:
// the contact form falls back to the visitor's email app and the counter is hidden.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const hasApi = Boolean(API_URL);

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.fields = body.fields || {};
    err.status = res.status;
    throw err;
  }
  return body;
}

export function sendMessage(data) {
  return request('/api/messages', { method: 'POST', body: JSON.stringify(data) });
}

export async function countVisit() {
  // Count one visit per browser session
  let counted = false;
  try {
    counted = sessionStorage.getItem('visit-counted') === '1';
  } catch {
    /* storage unavailable */
  }
  const body = await request('/api/visits', counted ? {} : { method: 'POST' });
  try {
    sessionStorage.setItem('visit-counted', '1');
  } catch {
    /* ignore */
  }
  return body.visits;
}
