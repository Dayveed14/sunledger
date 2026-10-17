import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../../api.js';

// The frame every admin page sits in.
export default function AdminShell({ children }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    api.adminSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div className="wrap dash">
      <header className="dash-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Admin console</h1>
        </div>
      </header>
      <nav className="subnav" aria-label="Admin sections">
        <NavLink to="/app" end>
          Vendors{summary?.pendingVendors > 0 && <span className="tab-dot">{summary.pendingVendors}</span>}
        </NavLink>
        <NavLink to="/app/pricing">Pricing &amp; rules</NavLink>
        <NavLink to="/app/users">Users</NavLink>
        <NavLink to="/app/activity">Activity</NavLink>
      </nav>
      {children}
    </div>
  );
}
