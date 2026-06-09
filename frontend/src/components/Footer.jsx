import { Link } from 'react-router-dom';

const navLinks = [
  { title: 'HOME', to: '/dashboard' },
  { title: 'CLUBS', to: '/clubs' },
  { title: 'EVENTS', to: '/calendar' },
  { title: 'CHAT', to: '/chat' },
  { title: 'PROFILE', to: '/profile' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17" cy="7" r="1" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <path d="M9 16.5V10.5" />
        <path d="M9 8.5V8.5" />
        <path d="M15.8 16.5V13.2C15.8 11.9 14.8 11.2 13.8 11.2C12.8 11.2 12.4 11.7 12.4 12.4V16.5" />
        <path d="M12.4 13.8H15.8" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <path d="M14.5 8.5H13.25C12.45 8.5 12 8.95 12 9.7V11.1H14.5L14 13.1H12V17.5H9.5V13.1H8V11.1H9.5V9.3C9.5 7.45 10.55 6.5 12.35 6.5H14.5V8.5Z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="12" rx="4" />
        <path d="M10 9.5L15.5 12L10 14.5V9.5Z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const Footer = () => (
  <footer className="footer-section bg-theme-elevated border-t border-theme-nav px-6 py-28 text-theme transition-colors duration-300">
    <div className="mx-auto max-w-7xl flex flex-col items-center gap-12">
      <nav className="footer-nav flex flex-wrap justify-center gap-10 text-base uppercase tracking-[0.85em] text-theme-faint font-display">
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} className="footer-nav-link">
            {link.title}
          </Link>
        ))}
      </nav>

      <div className="flex justify-center gap-4">
        {socialLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className="footer-icon"
          >
            {item.icon}
          </a>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <Link to="/dashboard" className="inline-flex items-center gap-3 text-center">
          <span className="text-5xl sm:text-6xl font-display font-bold tracking-[0.18em]">
            <span className="text-gradient">Stud</span>
            <span className="text-theme">Help</span>
          </span>
        </Link>
        <p className="text-[0.74rem] uppercase tracking-[0.35em] text-theme-faint">
          © 2026 SVNIT Surat • All Rights Reserved
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
