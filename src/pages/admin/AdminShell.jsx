import { useEffect, useState } from 'react';
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
      {children}
    </div>
  );
}
