import { useEffect, useState } from 'react';
import { Menu, Close } from '../icons.jsx';

const LINKS = [
  ['about', 'About'],
  ['experience', 'Experience'],
  ['skills', 'Skills'],
  ['credentials', 'Credentials'],
  ['projects', 'Projects'],
  ['contact', 'Contact'],
];

export default function Nav({ name }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const els = LINKS.map(([id]) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('');

  return (
    <header className="nav">
      <div className="wrap nav-row">
        <a href="#top" className="brand" aria-label={`${name}, back to top`}>
          <span className="brand-mark">{initials}</span>
          <span className="brand-name">{name}</span>
        </a>
        <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          {open ? <Close /> : <Menu />}
        </button>
        <nav id="nav-links" className={`nav-links${open ? ' open' : ''}`} aria-label="Sections">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} aria-current={active === id ? 'true' : undefined} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
