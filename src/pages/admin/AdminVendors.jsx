import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { formatDate } from '../../lib/format.js';

const FILTERS = [['pending', 'Waiting'], ['verified', 'Verified'], ['rejected', 'Rejected'], ['', 'All']];
const LABEL = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };

export default function AdminVendors() {
  const [filter, setFilter] = useState('pending');
  const [vendors, setVendors] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    api.adminVendors(filter).then((r) => setVendors(r.vendors)).catch((e) => setError(e.message));
  }, [filter]);
  useEffect(() => {
    setVendors(null);
    load();
  }, [load]);

  const set = async (id, status) => {
    setBusy(id);
    setError(null);
    try {
      await api.adminVendorVerification(id, status);
      load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(null);
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Vendors</h2>
          <p className="muted">Check a vendor is real before verifying. Rejected vendors disappear from the shop and from customers&apos; offers straight away.</p>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Filter vendors">
        {FILTERS.map(([value, label]) => (
          <button key={label} type="button" role="tab" aria-selected={filter === value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}  style={{
          backgroundColor: '#ffc857',
          color: '#374151',
        }} >{label}</button>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!vendors && !error && <p className="muted" role="status">Loading…</p>}
      {vendors?.length === 0 && <div className="empty-card"><h3>Nobody here</h3><p>No vendors in this list.</p></div>}
      <ul className="request-list">
        {(vendors ?? []).map((v) => (
          <li key={v.userId} className="request-card">
            <div className="deal-top">
              <h3>{v.companyName}</h3>
              <span className={`badge badge-${v.verification}`}>{LABEL[v.verification]}</span>
            </div>
            <p className="muted">
              {v.contactName} · <a href={`mailto:${v.email}`}>{v.email}</a>
              {v.phone && <> · <a href={`tel:${v.phone}`}>{v.phone}</a></>} · joined {formatDate(v.createdAt)}
            </p>
            <p className="muted">{v.products} products · {v.activeDeals} live deals{v.accountStatus !== 'active' ? ' · account suspended' : ''}</p>
            <div className="row-actions">
              {v.verification !== 'verified' && <button type="button" className="btn btn-primary" disabled={busy === v.userId} onClick={() => set(v.userId, 'verified')}>Verify</button>}
              {v.verification !== 'rejected' && <button type="button" className="btn btn-quiet" disabled={busy === v.userId} onClick={() => set(v.userId, 'rejected')}>Reject</button>}
              {v.verification !== 'pending' && <button type="button" className="btn btn-quiet" disabled={busy === v.userId} onClick={() => set(v.userId, 'pending')}>Back to pending</button>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
