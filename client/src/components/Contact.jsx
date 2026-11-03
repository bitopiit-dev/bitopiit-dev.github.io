import { useState } from 'react';
import Section from './Section.jsx';
import { hasApi, sendMessage } from '../api.js';
import { Mail, Phone, LinkedIn } from '../icons.jsx';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact({ contact }) {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ status: 'idle', error: '', fields: {} });

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!hasApi) {
      const body = `${form.message}\n\n${form.name}\n${form.email}`;
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(form.subject || 'Hello from your website')}&body=${encodeURIComponent(body)}`;
      return;
    }
    setState({ status: 'sending', error: '', fields: {} });
    try {
      await sendMessage(form);
      setForm(EMPTY);
      setState({ status: 'sent', error: '', fields: {} });
    } catch (err) {
      const offline = err instanceof TypeError;
      setState({
        status: 'error',
        error: offline ? `Couldn’t reach the server. Email ${contact.email} directly instead.` : err.message,
        fields: err.fields || {},
      });
    }
  }

  const f = state.fields;
  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={`c-${name}`}>{label}</label>
      {props.as === 'textarea'
        ? <textarea id={`c-${name}`} name={name} rows="6" value={form[name]} onChange={update} required aria-invalid={!!f[name]} aria-describedby={f[name] ? `c-${name}-err` : undefined} />
        : <input id={`c-${name}`} name={name} value={form[name]} onChange={update} {...props} aria-invalid={!!f[name]} aria-describedby={f[name] ? `c-${name}-err` : undefined} />}
      {f[name] && <span className="field-err" id={`c-${name}-err`}>{f[name]}</span>}
    </div>
  );

  return (
    <Section id="contact" title="Contact">
      <div className="contact-grid">
        <div>
          <p className="lead">Hiring for a Head of IT or Group IT Manager role, or need help with ERP, network or security work? Send a message and I’ll reply by email.</p>
          <ul className="contact-list">
            <li><a href={`mailto:${contact.email}`}><Mail />{contact.email}</a></li>
            <li><a href={`tel:${contact.phoneHref}`}><Phone />{contact.phone}</a></li>
            <li><a href={contact.linkedin} target="_blank" rel="noopener noreferrer"><LinkedIn />linkedin.com/in/arifurrahman-it</a></li>
          </ul>
        </div>

        <form className="panel form" onSubmit={submit} noValidate={hasApi}>
          <div className="row-2">
            {field('name', 'Your name', { autoComplete: 'name', required: true, maxLength: 100 })}
            {field('email', 'Email', { type: 'email', autoComplete: 'email', required: true, maxLength: 200 })}
          </div>
          {field('subject', 'Subject (optional)', { maxLength: 150 })}
          {field('message', 'Message', { as: 'textarea' })}
          <div className="hp" aria-hidden="true">
            <label htmlFor="c-website">Leave this empty</label>
            <input id="c-website" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={update} />
          </div>
          <button className="btn primary" type="submit" disabled={state.status === 'sending'}>
            <Mail />{state.status === 'sending' ? 'Sending…' : hasApi ? 'Send message' : 'Open in email app'}
          </button>
          <p className="form-note" role="status" aria-live="polite">
            {state.status === 'sent' && <span className="ok">Message sent. I’ll reply to your email soon.</span>}
            {state.status === 'error' && <span className="err">{state.error}</span>}
          </p>
        </form>
      </div>
    </Section>
  );
}
