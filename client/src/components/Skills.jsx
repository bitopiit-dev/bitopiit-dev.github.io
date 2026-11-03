import Section from './Section.jsx';

export default function Skills({ strengths, groups }) {
  return (
    <Section id="skills" title="Skills">
      <ul className="chips hot" aria-label="Core strengths">
        {strengths.map((s) => <li key={s}>{s}</li>)}
      </ul>
      <div className="skill-grid">
        {groups.map((g) => (
          <div className="panel" key={g.group}>
            <h3>{g.group}</h3>
            <ul className="chips">
              {g.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
