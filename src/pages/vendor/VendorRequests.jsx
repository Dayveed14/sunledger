import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PLAN_LABEL, formatDate, kwh, naira, sizeText } from '../../lib/format.js';

const STATUS_LABEL = { new: 'New', contacted: 'Contacted', won: 'Won', lost: 'Lost', cancelled: 'Cancelled by customer' };

function Ask({ r }) {
  const s = r.summary;
  if (r.kind === 'deal') {
    const o = s.offer;
    return (
      <>
        <p><strong>{s.deal.title}</strong> · {PLAN_LABEL[r.plan]}</p>
        <p className="muted">
          {o.plan === 'buy' && `Buy for ${naira(o.upfront)}`}
          {o.plan === 'lease' && `${naira(o.monthly)}/month for ${o.termMonths} months${o.upfront ? `, ${naira(o.upfront)} deposit` : ''}`}
          {o.plan === 'rent' && `${naira(o.monthly)}/month`}
          {o.plan === 'eaas' && `${naira(o.monthly)}/month for ${o.termMonths} months${o.upfront ? `, ${naira(o.upfront)} due at installation` : ''}${o.eaas ? `, ${naira(o.eaas.deposit)} refundable deposit` : ''}`}
          {' · '}{s.deal.specs.panelKwp} kWp · {s.deal.specs.inverterKva} kVA · {s.deal.specs.batteryKwh} kWh
        </p>
      </>
    );
  }
  return (
    <>
      <p><strong>Wants to buy these parts from you</strong> · {naira(s.subtotal)}</p>
      <ul className="deal-items">
        {s.lines.map((l) => <li key={l.productId}>{l.qty} × {l.name} <small>({sizeText(l)})</small> · {naira(l.lineTotal)}</li>)}
      </ul>
      {s.wholeSystem.otherVendors.length > 0 && (
        <p className="muted">The rest of their system is being requested from {s.wholeSystem.otherVendors.join(', ')}.</p>
      )}
    </>
  );
}

export default function VendorRequests() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = () => api.vendorRequests().then((r) => setItems(r.requests)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    setError(null);
    try {
      await api.vendorRequestStatus(id, status);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!items && !error) return <p className="muted" role="status">Loading…</p>;

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Requests</h2>
          <p className="muted">Customers who asked you for a deal or for parts. Contact them directly, then mark where it stands.</p>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}

      {items?.length === 0 && (
        <div className="empty-card">
          <h3>No requests yet</h3>
          <p>When a customer&apos;s assessment fits one of your live deals or products and they ask for a quote, it shows up here with their contact details.</p>
        </div>
      )}

      <ul className="request-list">
        {(items ?? []).map((r) => {
          const n = r.summary.needs;
          return (
            <li key={r.id} className={`request-card${r.status === 'new' ? ' is-new' : ''}`}>
              <div className="deal-top">
                <h3>{r.customer.company || r.customer.name}</h3>
                <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p className="muted">
                {r.customer.company ? `${r.customer.name} · ` : ''}
                <a href={`mailto:${r.customer.email}`}>{r.customer.email}</a>
                {r.customer.phone && <> · <a href={`tel:${r.customer.phone}`}>{r.customer.phone}</a></>}
                {' · '}{formatDate(r.createdAt)}
              </p>
              <Ask r={r} />
              <p className="muted">
                Their need: {n.segment === 'business' ? 'business' : 'home'} in {n.discoName} · {kwh(n.kwhPerDay)} kWh/day · at least {n.requirement.panelKwp} kWp,
                {' '}{n.requirement.inverterKva} kVA, {n.requirement.batteryKwh} kWh battery
              </p>
              {r.message && <blockquote className="request-message">{r.message}</blockquote>}
              {r.status !== 'cancelled' && (
                <div className="row-actions">
                  {r.status === 'new' && <button type="button" className="btn btn-primary btn-small" onClick={() => setStatus(r.id, 'contacted')}>Mark contacted</button>}
                  {r.status !== 'won' && <button type="button" className="btn btn-ghost btn-small" onClick={() => setStatus(r.id, 'won')}>Mark won</button>}
                  {r.status !== 'lost' && <button type="button" className="btn btn-quiet btn-small" onClick={() => setStatus(r.id, 'lost')}>Mark lost</button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
