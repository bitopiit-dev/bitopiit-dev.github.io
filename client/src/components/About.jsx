import Section from './Section.jsx';

export default function About({ p }) {
  return (
    <Section id="about" title="About">
      <div className="about-grid">
        <div className="about-text">
          {p.about.map((t) => <p key={t.slice(0, 20)}>{t}</p>)}
        </div>
        <dl className="facts">
          {p.facts.map((f) => (
            <div key={f.label}><dt>{f.value}</dt><dd>{f.label}</dd></div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
