import { useCallback, useEffect, useRef, useState } from 'react';
import { hasApi, listMessages, setRead, deleteMessage } from '../api.js';
import { Mail } from '../icons.jsx';

const KEY = 'admin-token';

function loadToken() {
  try {
    return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}
function saveToken(token, remember) {
  try {
    sessionStorage.setItem(KEY, token);
    if (remember) localStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable */
  }
}
function clearToken() {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Shows a "waking up" note when the free server takes more than 3 s to answer
function useSlowFlag() {
  const [slow, setSlow] = useState(false);
  const timer = useRef();
  const run = useCallback(async (fn) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSlow(true), 3000);
    try {
      return await fn();
    } finally {
      clearTimeout(timer.current);
      setSlow(false);
    }
  }, []);
  return [slow, run];
}

const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminApp() {
  const [token, setToken] = useState(loadToken);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, track] = useSlowFlag();
  const home = import.meta.env.BASE_URL;

  const load = useCallback(
    async (t = token) => {
      if (!t) return;
      setLoading(true);
      setError('');
      try {
        const res = await track(() => listMessages(t));
        setData(res);
      } catch (e) {
        if (e.status === 401) {
          clearToken();
          setToken('');
          setData(null);
          setError('That token didn’t work. Copy ADMIN_TOKEN again from Render › your service › Environment.');
        } else if (e instanceof TypeError) {
          setError('Couldn’t reach the server. Check your connection and try again.');
        } else {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [token, track]
  );

  useEffect(() => {
    if (token) load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasApi) {
    return (
      <Shell home={home}>
        <div className="panel admin-card">
          <h1 className="admin-title">Messages</h1>
          <p>This build has no API address. Add the <code>VITE_API_URL</code> variable in GitHub and run the deploy workflow again.</p>
        </div>
      </Shell>
    );
  }

  if (!token) {
    return (
      <Shell home={home}>
        <Login
          error={error}
          slow={slow}
          loading={loading}
          onSubmit={(t, remember) => {
            saveToken(t, remember);
            setToken(t);
            load(t);
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell
      home={home}
      onSignOut={() => {
        clearToken();
        setToken('');
        setData(null);
      }}
    >
      <Inbox data={data} setData={setData} token={token} loading={loading} slow={slow} error={error} reload={() => load()} track={track} />
    </Shell>
  );
}

function Shell({ home, onSignOut, children }) {
  return (
    <>
      <header className="nav">
        <div className="wrap nav-row">
          <a href={home} className="brand">
            <span className="brand-mark">KA</span>
            <span className="brand-name">Back to website</span>
          </a>
          {onSignOut && (
            <button className="btn" onClick={onSignOut}>
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="wrap admin-main">{children}</main>
    </>
  );
}

function Login({ onSubmit, error, slow, loading }) {
  const [value, setValue] = useState('');
  const [remember, setRemember] = useState(false);
  return (
    <form
      className="panel admin-card login"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim(), remember);
      }}
    >
      <h1 className="admin-title">Messages</h1>
      <p className="muted">Sign in with the ADMIN_TOKEN from Render › arifur-portfolio-api › Environment.</p>
      <div className="field">
        <label htmlFor="token">Admin token</label>
        <input id="token" type="password" autoComplete="current-password" value={value} onChange={(e) => setValue(e.target.value)} required aria-invalid={!!error} aria-describedby={error ? 'token-err' : undefined} />
      </div>
      <label className="check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Keep me signed in on this device
      </label>
      <button className="btn primary" type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      {slow && <p className="note">Waking up the server. On the free plan this can take up to a minute.</p>}
      {error && <p className="field-err" id="token-err" role="alert">{error}</p>}
    </form>
  );
}

function Inbox({ data, setData, token, loading, slow, error, reload, track }) {
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [actionError, setActionError] = useState('');

  if (!data) {
    return (
      <div className="panel admin-card">
        <p>{loading ? 'Loading messages…' : error || 'No data.'}</p>
        {slow && <p className="note">Waking up the server. On the free plan this can take up to a minute.</p>}
        {!loading && <button className="btn" onClick={reload}>Try again</button>}
      </div>
    );
  }

  const shown = filter === 'unread' ? data.messages.filter((m) => !m.read) : data.messages;

  async function toggle(m) {
    setBusy(m.id);
    setActionError('');
    try {
      await track(() => setRead(token, m.id, !m.read));
      const messages = data.messages.map((x) => (x.id === m.id ? { ...x, read: !m.read } : x));
      setData({ ...data, messages, unread: data.unread + (m.read ? 1 : -1) });
    } catch (e) {
      setActionError(`Couldn’t update the message: ${e.message}`);
    } finally {
      setBusy('');
    }
  }

  async function remove(m) {
    setBusy(m.id);
    setActionError('');
    try {
      await track(() => deleteMessage(token, m.id));
      setData({
        ...data,
        messages: data.messages.filter((x) => x.id !== m.id),
        total: data.total - 1,
        unread: data.unread - (m.read ? 0 : 1),
      });
    } catch (e) {
      setActionError(`Couldn’t delete the message: ${e.message}`);
    } finally {
      setBusy('');
      setConfirmId('');
    }
  }

  return (
    <>
      <div className="inbox-head">
        <h1 className="admin-title">Messages</h1>
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Filter messages">
            <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All ({data.total})</button>
            <button aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Unread ({data.unread})</button>
          </div>
          <button className="btn" onClick={reload} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>
      {slow && <p className="note">Waking up the server. On the free plan this can take up to a minute.</p>}
      {(error || actionError) && <p className="field-err" role="alert">{error || actionError}</p>}

      {shown.length === 0 ? (
        <div className="panel admin-card empty">
          {filter === 'unread' && data.total > 0
            ? 'All caught up. Every message is marked as read.'
            : 'No messages yet. Messages sent from the contact form on your website appear here.'}
        </div>
      ) : (
        <ul className="msg-list">
          {shown.map((m) => (
            <li key={m.id} className={`msg panel${m.read ? '' : ' unread'}`}>
              <div className="msg-head">
                <div>
                  <p className="msg-from">
                    {!m.read && <span className="dot" aria-label="Unread" />}
                    {m.name}
                  </p>
                  <a className="msg-email" href={`mailto:${m.email}`}>{m.email}</a>
                </div>
                <time dateTime={m.createdAt}>{fmt.format(new Date(m.createdAt))}</time>
              </div>
              {m.subject && <p className="msg-subject">{m.subject}</p>}
              <p className="msg-body">{m.message}</p>
              <div className="msg-actions">
                <a
                  className="btn primary"
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'your message'}`)}&body=${encodeURIComponent(`\n\n> ${m.message.split('\n').join('\n> ')}`)}`}
                >
                  <Mail />Reply
                </a>
                <button className="btn" onClick={() => toggle(m)} disabled={busy === m.id}>
                  {m.read ? 'Mark as unread' : 'Mark as read'}
                </button>
                {confirmId === m.id ? (
                  <span className="confirm">
                    Delete permanently?
                    <button className="btn danger" onClick={() => remove(m)} disabled={busy === m.id}>Delete</button>
                    <button className="btn" onClick={() => setConfirmId('')}>Cancel</button>
                  </span>
                ) : (
                  <button className="btn ghost" onClick={() => setConfirmId(m.id)}>Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
