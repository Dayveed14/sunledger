import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth/AuthContext.jsx';

const ROLES = [['', 'All'], ['individual', 'Individuals'], ['business', 'Businesses'], ['vendor', 'Vendors'], ['admin', 'Admins']];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  const load = () => api.adminUsers({ role, q: term }).then((r) => setUsers(r.users)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, term]);

  const toggle = async (u) => {
    setError(null);
    try {
      await api.adminUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Users</h2>
          <p className="muted">Suspending an account logs the person out at once and blocks them from logging in.</p>
        </div>
      </div>
      <form className="admin-search" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }}>
        <input type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        <button type="submit" className="btn btn-quiet">Search</button>
      </form>
      <div className="tabs" role="tablist" aria-label="Filter by account type">
        {ROLES.map(([value, label]) => (
          <button key={label} type="button" role="tab" aria-selected={role === value} className={role === value ? 'is-active' : ''} onClick={() => setRole(value)}>{label}</button>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!users && !error && <p className="muted" role="status">Loading…</p>}
      {users?.length === 0 && <div className="empty-card"><h3>No matches</h3><p>No users found.</p></div>}
      <ul className="request-list">
        {(users ?? []).map((u) => (
          <li key={u.id} className="request-card">
            <div className="deal-top">
              <h3>{u.companyName || u.fullName}</h3>
              <span className={`badge badge-${u.status === 'active' ? 'active' : 'rejected'}`}>{u.status === 'active' ? 'Active' : 'Suspended'}</span>
            </div>
            <p className="muted">{u.companyName ? `${u.fullName} · ` : ''}{u.email} · {u.role}{u.emailVerified ? '' : ' · email not verified'}</p>
            {u.role !== 'admin' && u.id !== me.id && (
              <div className="row-actions">
                <button type="button" className="btn btn-quiet" onClick={() => toggle(u)}>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
