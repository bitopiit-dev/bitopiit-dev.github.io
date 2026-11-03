import { useState } from 'react';
import Section from './Section.jsx';

export default function Experience({ jobs }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? jobs : jobs.slice(0, 3);
  return (
    <Section id="experience" title="Experience">
      <ol className="trace">
        {visible.map((j) => (
          <li key={j.role + j.start} className={`job${j.current ? ' now' : ''}`}>
            <div className="job-head">
              <h3>{j.role}</h3>
              <span className="when">{j.start} – {j.end}</span>
            </div>
            <p className="where">{j.company}, {j.place}</p>
            {j.intro && <p className="intro">{j.intro}</p>}
            <ul className="ticks">
              {j.points.map((pt) => <li key={pt.slice(0, 30)}>{pt}</li>)}
            </ul>
            {j.wins && (
              <div className="wins">
                <h4>Major projects &amp; achievements</h4>
                <ul className="ticks">
                  {j.wins.map((w) => <li key={w.slice(0, 30)}>{w}</li>)}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ol>
      {jobs.length > 3 && (
        <button className="btn more" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show recent roles only' : `Show earlier roles (${jobs.length - 3} more)`}
        </button>
      )}
    </Section>
  );
}
