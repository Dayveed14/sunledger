import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAssessment } from './AssessmentContext.jsx';

export default function SiteHeader() {
  const { user, ready, logout } = useAuth();
  const { open } = useAssessment();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="nav scrolled">
      <div className="wrap nav-inner">
        <Link to="/" className="brand" aria-label="Sunledger home">
          <img src="/favicon.svg" width="30" height="30" alt="" className="brand-mark" />
          <span className="brand-word">Sunledger</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          <Link to="/#how">How it works</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/#platform">Platform</Link>
          <Link to="/#providers">For providers</Link>
        </nav>

        <div className="nav-actions">
          {ready && user ? (
            <>
              <Link to="/app" className="btn btn-small btn-ghost">Dashboard</Link>
              <button type="button" className="btn btn-small btn-quiet" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">Log in</Link>
              <button type="button" className="btn btn-small btn-primary" onClick={() => open()}>
                Free assessment
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
