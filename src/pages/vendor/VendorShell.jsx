import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../auth/AuthContext.jsx';

const VERIFY_LABEL = { pending: 'Pending verification', verified: 'Verified vendor', rejected: 'Not approved' };

// The frame every vendor page sits in: who you are, your verification status, and the tabs.
export default function VendorShell({ children }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.vendorSummary().then((s) => !cancelled && setSummary(s)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="wrap dash">
      <header className="dash-head">
        <div>
          <p className="eyebrow">Vendor account{user.companyName ? ` · ${user.companyName}` : ''}</p>
          <h1>Vendor dashboard</h1>
        </div>
        {summary && <span className={`badge badge-${summary.verification}`}>{VERIFY_LABEL[summary.verification]}</span>}
      </header>

      <nav className="subnav" aria-label="Vendor sections">
        <NavLink to="/app" end>Overview</NavLink>
        <NavLink to="/app/products">Products</NavLink>
        <NavLink to="/app/deals">Combos &amp; deals</NavLink>
        <NavLink to="/app/requests">
          Requests{summary?.newRequests > 0 && <span className="tab-dot">{summary.newRequests}</span>}
        </NavLink>
      </nav>

      {children}
    </div>
  );
}
