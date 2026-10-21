import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { naira } from '../../lib/format.js';

const at = (iso) => (iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' }) : '—');
const STAT = [['orders', 'Paid orders'], ['gmv', 'Sales', true], ['platform_revenue', 'Sunledger revenue', true], ['awaiting_vendor', 'Awaiting vendor'], ['in_prep', 'In preparation'], ['out_for_delivery', 'Out for delivery'], ['awaiting_receipt', 'Awaiting receipt'], ['completed', 'Completed'], ['late_now', 'Running late'], ['refunds_needed', 'Refunds to do']];
const ACTIONS = { placed: ['accept'], accepted: ['prepare', 'ready', 'pickup'], preparing: ['ready', 'pickup'], ready_for_pickup: ['pickup'], out_for_delivery: ['deliver'], delivered: ['receive'] };

export default function AdminOrders() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [filters, setFilters] = useState({ status: '', state: '', late: '', q: '' });
  const [error, setError] = useState(null);
  const [events, setEvents] = useState(null);

  const load = useCallback(() => {
    api.adminOrderStats().then((r) => setStats(r.stats)).catch((e) => setError(e.message));
    api.adminOrders(filters).then((r) => setOrders(r.orders)).catch((e) => setError(e.message));
  }, [filters]);
  useEffect(() => { const t = setTimeout(load, filters.q ? 300 : 0); return () => clearTimeout(t); }, [load, filters.q]);

  const act = async (id, action) => { try { await api.adminOrderAction(id, action); load(); } catch (e) { setError(e.message); } };
  const refunded = async (id) => { try { await api.adminOrderAction(id, 'refunded'); load(); } catch (e) { setError(e.message); } };
  const show = async (ref) => { try { setEvents({ ref, list: (await api.adminOrderEvents(ref)).events }); } catch (e) { setError(e.message); } };
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      {stats && (
        <dl className="stat-grid">
          {STAT.map(([k, label, money]) => <div key={k} className={(k === 'late_now' || k === 'refunds_needed') && stats[k] > 0 ? 'stat warn' : 'stat'}><dt>{label}</dt><dd>{money ? naira(stats[k]) : stats[k]}</dd></div>)}
          <div className="stat"><dt>On time</dt><dd>{stats.on_time + stats.late_delivered ? `${Math.round((stats.on_time / (stats.on_time + stats.late_delivered)) * 100)}%` : '—'}</dd></div>
        </dl>
      )}
      <div className="filter-row">
        <input type="search" placeholder="Order number or customer" value={filters.q} onChange={set('q')} aria-label="Search orders" />
        <select value={filters.state} onChange={set('state')} aria-label="State"><option value="">Lagos and Abuja</option><option value="lagos">Lagos</option><option value="abuja">Abuja</option></select>
        <select value={filters.status} onChange={set('status')} aria-label="Status">
          <option value="">Any status</option>
          {['placed', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'rejected'].map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
        </select>
        <label className="check-chip"><input type="checkbox" checked={filters.late === '1'} onChange={(e) => setFilters((f) => ({ ...f, late: e.target.checked ? '1' : '' }))} /> Late only</label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!orders && !error && <p className="muted" role="status">Loading…</p>}
      {orders?.length === 0 && <div className="empty-card"><h3>No orders match</h3></div>}
      <ul className="vendor-orders">
        {orders?.map((o) => (
          <li key={o.id} className={`vorder${o.late ? ' late' : ''}`}>
            <header>
              <strong>{o.ref}</strong><span className="badge badge-active">{o.statusLabel}</span>
              {o.late && <span className="badge badge-warn">Late</span>}
              {o.refundNeeded && <span className="badge badge-warn">Refund needed</span>}
              {o.autoCompleted && <span className="badge">Auto-received</span>}
            </header>
            <p><strong>{o.vendor.name}</strong> ({o.vendor.phone}) → {o.customer.name} ({o.customer.phone}), {o.deliverTo.areaName}, {o.deliverTo.stateName}</p>
            <p className="muted">{o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')} · items {naira(o.subtotal)} · service charge {naira(o.serviceCharge)} · delivery {naira(o.deliveryFee)} ({o.distanceKm} km)</p>
            <p className="muted">Vendor earns {naira(o.vendorEarnings)} (platform fee {naira(o.commission)}) · Sunledger revenue on this order {naira(o.platformRevenue)}</p>
            <p className="muted">Paid {at(o.paidAt)} · promised {at(o.promisedBy)} · accepted {at(o.acceptedAt)} · picked up {at(o.pickedUpAt)} · delivered {at(o.deliveredAt)} · received {at(o.completedAt)}</p>
            <div className="row-actions">
              {(ACTIONS[o.status] ?? []).map((a) => <button key={a} type="button" className="btn btn-small btn-quiet" onClick={() => act(o.id, a)}>{a}</button>)}
              {o.refundNeeded && <button type="button" className="btn btn-small btn-primary" onClick={() => refunded(o.id)}>Mark refunded</button>}
              <button type="button" className="btn btn-small btn-quiet" onClick={() => show(o.ref)}>History</button>
            </div>
          </li>
        ))}
      </ul>
      {events && (
        <section className="notice"><h3>History of {events.ref}</h3>
          <ul>{events.list.map((e) => <li key={e.id}>{at(e.at)} · {e.actorType} · {e.type}{e.note ? ` · ${e.note}` : ''}</li>)}</ul>
          <button type="button" className="btn btn-small btn-quiet" onClick={() => setEvents(null)}>Close</button>
        </section>
      )}
    </div>
  );
}
