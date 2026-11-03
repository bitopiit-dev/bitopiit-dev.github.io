import { useEffect, useState } from 'react';
import profile from '../../shared/profile.json';
import { hasApi, countVisit } from './api.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Experience from './components/Experience.jsx';
import Skills from './components/Skills.jsx';
import Credentials from './components/Credentials.jsx';
import Projects from './components/Projects.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    if (!hasApi) return;
    countVisit().then(setVisits).catch(() => setVisits(null));
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav name={profile.name} />
      <Hero p={profile} />
      <main id="main">
        <About p={profile} />
        <Experience jobs={profile.experience} />
        <Skills strengths={profile.strengths} groups={profile.skills} />
        <Credentials p={profile} />
        <Projects projects={profile.projects} />
        <Contact contact={profile.contact} />
      </main>
      <footer className="footer">
        <div className="wrap footer-row">
          <span>© {new Date().getFullYear()} {profile.name}, {profile.location}</span>
          {visits !== null && <span>{visits.toLocaleString()} visits</span>}
        </div>
      </footer>
    </>
  );
}
