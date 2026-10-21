import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useShop } from '../auth/ShopContext.jsx';
import { useAssessment } from './AssessmentContext.jsx';

export default function SiteHeader() {
  const { user, ready, logout } = useAuth();
  const { open } = useAssessment();
  const { count } = useShop();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="nav scrolled">
      <div className="wrap nav-inner">
        <Link to="/" className="brand" aria-label="Sunledger home">
          <img src="/logo-full.png" height="30" alt="Sunledger" className="brand-logo" />
        </Link>

        <nav className="nav-links" aria-label="Main">
          <Link to="/#how">How it works</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/#platform">Platform</Link>
          <Link to="/#providers">For providers</Link>
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>Cart{count > 0 && <span className="cart-count">{count}</span>}</Link>
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
