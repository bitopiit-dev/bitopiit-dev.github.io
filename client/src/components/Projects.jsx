import Section from './Section.jsx';
import { External } from '../icons.jsx';

export default function Projects({ projects }) {
  return (
    <Section id="projects" title="Projects">
      <div className="proj-grid">
        {projects.map((pr) => (
          <a className="project" key={pr.name} href={pr.url} target="_blank" rel="noopener noreferrer">
            <span className="proj-top"><strong>{pr.name}</strong><External /></span>
            <span className="proj-desc">{pr.description}</span>
            <span className="tags">{pr.tags.map((t) => <span key={t}>{t}</span>)}</span>
          </a>
        ))}
      </div>
    </Section>
  );
}
