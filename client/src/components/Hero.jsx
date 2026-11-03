import { Mail, LinkedIn, GitHub, Download } from '../icons.jsx';

export default function Hero({ p }) {
  const base = import.meta.env.BASE_URL;
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="portrait-glow">
          <div className="portrait">
            <img src={`${base}photo.jpg`} alt={`Portrait of ${p.name}`} width="360" height="500" />
          </div>
        </div>
        <div>
          <p className="status"><i aria-hidden="true" />{p.status}</p>
          <h1 className="name">{p.name}</h1>
          <p className="role">{p.title}</p>
          <p className="org">{p.organisation}</p>
          <p className="tagline">{p.tagline}</p>
          <div className="actions">
            <a className="btn primary" href="#contact"><Mail />Get in touch</a>
            <a className="btn" href={`${base}cv/Khondaker_Arifur_Rahman_CV_Dark.pdf`} download><Download />Download CV</a>
            <a className="btn icon" href={p.contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile"><LinkedIn /></a>
            <a className="btn icon" href={p.contact.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile"><GitHub /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
