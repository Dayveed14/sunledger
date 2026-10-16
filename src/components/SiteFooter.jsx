import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <img src="/favicon.svg" width="26" height="26" alt="" className="brand-mark" />
            <span className="brand-word">Sunledger</span>
          </Link>
          <p>Energy intelligence for Nigerian homes and businesses.</p>
        </div>
        <div className="footer-links">
          <Link to="/#how">How it works</Link>
          <Link to="/#platform">Platform</Link>
          <Link to="/#providers">For providers</Link>
          <Link to="/login">Log in</Link>
        </div>
        <p className="footer-meta">© 2026 Sunledger. Made in Abuja.</p>
      </div>
    </footer>
  );
}
