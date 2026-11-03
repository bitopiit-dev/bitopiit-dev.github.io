import Section from './Section.jsx';
import { Badge } from '../icons.jsx';

export default function Credentials({ p }) {
  return (
    <Section id="credentials" title="Certifications, training & education">
      <div className="cert-grid">
        {p.certifications.map((c) => (
          <article className="cert" key={c.credentialId}>
            <span className="cert-icon"><Badge /></span>
            <h3>{c.name}</h3>
            <p className="issuer">{c.issuer}</p>
            <p className="meta">Issued {c.issued}{c.expires ? `, valid to ${c.expires}` : ''}</p>
            <p className="cred">Credential ID <span>{c.credentialId}</span></p>
          </article>
        ))}
      </div>

      <div className="cols-3">
        <div className="panel">
          <h3>Professional training</h3>
          <dl className="list">
            {p.training.map((t) => (
              <div key={t.name}><dt>{t.name}</dt><dd>{t.detail}</dd><dd>{t.provider}</dd><dd className="meta">{t.when}</dd></div>
            ))}
          </dl>
        </div>
        <div className="panel">
          <h3>Education</h3>
          <dl className="list">
            {p.education.map((e) => (
              <div key={e.degree}><dt>{e.degree}</dt><dd>{e.school}{e.detail ? `, ${e.detail.toLowerCase()}` : ''}</dd><dd className="meta">{e.result}, {e.year}</dd></div>
            ))}
          </dl>
        </div>
        <div className="panel">
          <h3>Memberships</h3>
          <dl className="list">
            {p.memberships.map((m) => (<div key={m.name}><dt>{m.name}</dt><dd>{m.detail}</dd></div>))}
          </dl>
          <h3 className="mt">Languages</h3>
          <dl className="lang">
            {p.languages.map((l) => (<div key={l.name}><dt>{l.name}</dt><dd>{l.level}</dd></div>))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
