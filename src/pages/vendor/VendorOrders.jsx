import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { naira } from '../../lib/format.js';

const at = (iso) => (iso ? new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' }) : '—');
const NEXT = {
  placed: [['accept', 'Accept order', 'btn-primary'], ['reject', 'Decline', 'btn-quiet']],
  accepted: [['prepare', 'Start preparing', 'btn-primary'], ['ready', 'Ready for pickup', 'btn-ghost']],
  preparing: [['ready', 'Ready for pickup', 'btn-primary']],
};
const FILTERS = [['', 'All'], ['placed', 'New'], ['accepted', 'Accepted'], ['preparing', 'Preparing'], ['ready_for_pickup', 'Ready'], ['out_for_delivery', 'Out'], ['delivered', 'Delivered'], ['completed', 'Completed']];

export default function VendorOrders() {
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => api.vendorOrders(filter).then((r) => setOrders(r.orders)).catch((e) => setError(e.message)), [filter]);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (id, action) => {
    let note;
    if (action === 'reject') {
      note = window.prompt('Why can’t you fulfil this order? The customer will see this.') ?? null;
      if (note === null) return;
    }
    setBusy(id);
    setError(null);
    try { await api.vendorOrderAction(id, action, note); await load(); } catch (e) { setError(e.message); }
    setBusy(null);
  };

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Order status">
        {FILTERS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={filter === k} className={`tab${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>{label}</button>)}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!orders && !error && <p className="muted" role="status">Loading…</p>}
      {orders?.length === 0 && <div className="empty-card"><h3>No orders here</h3><p>Paid orders from customers will appear here for you to accept.</p></div>}
      <ul className="vendor-orders">
        {orders?.map((o) => (
          <li key={o.id} className={`vorder${o.late ? ' late' : ''}`}>
            <header>
              <strong>{o.ref}</strong>
              <span className="badge badge-active">{o.statusLabel}</span>
              {o.late && <span className="badge badge-warn">Running late</span>}
            </header>
            <ul className="order-items">{o.items.map((i, n) => <li key={n}>{i.qty} × {i.name}<span>{naira(i.lineTotal)}</span></li>)}</ul>
            <p className="muted">For {o.customer.name}, delivering to {o.deliverTo.areaName}, {o.deliverTo.stateName}. Paid {at(o.paidAt)}. Promised by {at(o.promisedBy)}.</p>
            <p>Items sold {naira(o.subtotal)} · Sunledger platform fee −{naira(o.commission)}</p>
            <p><strong>You earn: {naira(o.earnings)}</strong></p>
            <div className="row-actions">
              {(NEXT[o.status] ?? []).map(([action, label, cls]) => (
                <button key={action} type="button" className={`btn btn-small ${cls}`} disabled={busy === o.id} onClick={() => act(o.id, action)}>{label}</button>
              ))}
            </div>
            {o.status === 'ready_for_pickup' && <p className="muted">Waiting for the rider to collect it.</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
