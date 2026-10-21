import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatDate, naira } from '../lib/format.js';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api.myOrders().then((r) => setOrders(r.orders)).catch((e) => setError(e.message)); }, []);

  return (
    <div className="app-page">
      <header className="page-head"><h1>My orders</h1></header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!orders && !error && <p className="muted" role="status">Loading…</p>}
      {orders?.length === 0 && <div className="empty-card"><h3>No orders yet</h3><p>When you buy from the shop, you can follow each step here.</p><Link to="/shop" className="btn btn-primary">Go to the shop</Link></div>}
      <ul className="order-list">
        {orders?.map((o) => (
          <li key={o.ref}>
            <Link to={`/app/orders/${o.ref}`} className="order-row">
              <span><strong>{o.ref}</strong><small>{formatDate(o.createdAt)}</small></span>
              <span>{o.vendorOrders.map((v) => v.statusLabel).filter((x, i, a) => a.indexOf(x) === i).join(' · ') || (o.status === 'pending_payment' ? 'Awaiting payment' : o.status)}</span>
              <span className="order-total">{naira(o.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
