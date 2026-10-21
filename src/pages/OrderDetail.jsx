import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Timeline from '../components/Timeline.jsx';
import { naira } from '../lib/format.js';

const at = (iso) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });

export default function OrderDetail() {
  const { ref } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => api.myOrder(ref).then((r) => setOrder(r.order)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // follow the steps without needing a refresh
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const received = async (voId) => {
    setBusy(voId);
    try { await api.confirmReceived(ref, voId); await load(); } catch (e) { setError(e.message); }
    setBusy(null);
  };

  if (error && !order) return <div className="app-page"><p className="form-error" role="alert">{error}</p><Link to="/app/orders">Back to my orders</Link></div>;
  if (!order) return <div className="app-page"><p className="muted" role="status">Loading…</p></div>;

  return (
    <div className="app-page">
      <p><Link to="/app/orders">← My orders</Link></p>
      <header className="page-head"><h1>Order {order.ref}</h1></header>
      {error && <p className="form-error" role="alert">{error}</p>}

      {order.status === 'pending_payment' && (
        <div className="notice">
          <p>This order is waiting for payment.</p>
          {order.payment?.authorizationUrl && <a className="btn btn-primary" href={order.payment.authorizationUrl}>Continue to payment</a>}
        </div>
      )}

      {order.vendorOrders.map((v) => (
        <section key={v.id} className="order-part">
          <header>
            <h2>{v.vendorName}</h2>
            <span className="badge badge-active">{v.statusLabel}</span>
          </header>
          {v.promisedBy && !['completed', 'rejected', 'cancelled'].includes(v.status) && <p className="muted">Expected by {at(v.promisedBy)}</p>}
          <ul className="order-items">
            {v.items.map((i, n) => <li key={n}>{i.qty} × {i.name}<span>{naira(i.lineTotal)}</span></li>)}
          </ul>
          <Timeline steps={v.timeline} />
          {v.canConfirmReceived && (
            <div className="notice">
              <p>Has it reached you? Please confirm. If we don&apos;t hear from you by {at(v.autoReceiveAt)}, we&apos;ll mark it received.</p>
              <button type="button" className="btn btn-primary" disabled={busy === v.id} onClick={() => received(v.id)}>{busy === v.id ? 'Saving…' : 'I received it'}</button>
            </div>
          )}
          {v.autoCompleted && <p className="muted">Marked received automatically.</p>}
          {v.status === 'rejected' && <p className="form-error">This vendor couldn&apos;t fulfil their part. You&apos;ll be refunded for it.</p>}
        </section>
      ))}

      <section className="order-totals">
        <dl className="summary-list">
          <div><dt>Items</dt><dd>{naira(order.subtotal)}</dd></div>
          {order.serviceCharge > 0 && <div><dt>Service charge</dt><dd>{naira(order.serviceCharge)}</dd></div>}
          <div><dt>Delivery</dt><dd>{naira(order.deliveryFee)}</dd></div>
          <div className="total"><dt>Total paid</dt><dd>{naira(order.total)}</dd></div>
        </dl>
        <p className="muted">Delivering to {order.ship.name}, {order.ship.address}, {order.ship.areaName}, {order.ship.stateName}</p>
      </section>
    </div>
  );
}
