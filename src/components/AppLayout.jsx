import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const NAV = {
  individual: [['/app', 'Overview', true], ['/app/orders', 'My orders'], ['/shop', 'Shop'], ['/app/profile', 'Profile & address']],
  business: [['/app', 'Overview', true], ['/app/orders', 'My orders'], ['/shop', 'Shop'], ['/app/profile', 'Profile & address']],
  vendor: [['/app', 'Overview', true], ['/app/products', 'Products'], ['/app/deals', 'Combos & deals'], ['/app/orders', 'Orders'], ['/app/requests', 'Requests'], ['/app/profile', 'Profile & location']],
  admin: [['/app', 'Vendors', true], ['/app/orders', 'Orders'], ['/app/admin-products', 'Products'], ['/app/pricing', 'Pricing & rules'], ['/app/users', 'Users'], ['/app/activity', 'Activity']],
};
const ROLE_LABEL = { individual: 'Individual', business: 'Business', vendor: 'Vendor', admin: 'Admin' };
const OPEN_LABEL = { individual: 'Open an individual account', business: 'Open a business account', vendor: 'Sell on Sunledger (vendor)' };

// The frame around every signed-in page: a sidebar with the pages for this type of account, a switcher between
// the accounts that share the person's email, and a way to open another type.
export default function AppLayout() {
  const { user, accounts, switchTo, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const others = accounts.filter((a) => !a.current);
  const owned = new Set(accounts.map((a) => a.role));
  const canOpen = user.role === 'admin' ? [] : ['individual', 'business', 'vendor'].filter((r) => !owned.has(r));

  const switchRole = async (role) => {
    setBusy(true);
    setError(null);
    try {
      await switchTo(role);
      setOpen(false);
      navigate('/app');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Account menu">
        <button type="button" className="sidebar-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span>{user.companyName || user.fullName}</span>
          <small>{ROLE_LABEL[user.role]} account · Menu</small>
        </button>

        <div className="sidebar-body">
          <div className="sidebar-who">
            <strong>{user.companyName || user.fullName}</strong>
            <span className="badge badge-active">{ROLE_LABEL[user.role]}</span>
            {user.address && <small>{user.address.areaName}, {user.address.stateName}</small>}
          </div>

          <nav className="sidebar-nav" onClick={() => setOpen(false)}>
            {NAV[user.role].map(([to, label, end]) => (
              <NavLink key={to} to={to} end={end}>{label}</NavLink>
            ))}
          </nav>

          {(others.length > 0 || canOpen.length > 0) && (
            <div className="sidebar-accounts">
              <p className="sidebar-label">Your accounts</p>
              {others.map((a) => (
                <button key={a.role} type="button" className="side-btn" disabled={busy} onClick={() => switchRole(a.role)}>
                  Switch to {ROLE_LABEL[a.role].toLowerCase()}{a.companyName ? ` · ${a.companyName}` : ''}
                </button>
              ))}
              {canOpen.map((r) => (
                <NavLink key={r} to={`/app/add-account?role=${r}`} className="side-btn side-btn-add" onClick={() => setOpen(false)}>
                  + {OPEN_LABEL[r]}
                </NavLink>
              ))}
              {error && <small className="err">{error}</small>}
            </div>
          )}

          <button type="button" className="side-btn side-logout" onClick={async () => { await logout(); navigate('/', { replace: true }); }}>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-main"><Outlet /></div>
    </div>
  );
}
