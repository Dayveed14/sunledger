import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useShop } from '../auth/ShopContext.jsx';
import LocationBar from '../components/LocationBar.jsx';
import Qty from '../components/Qty.jsx';
import { naira } from '../lib/format.js';

const when = (iso) => new Date(iso).toLocaleString('en-NG', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });
const newKey = () => (crypto.randomUUID ? crypto.randomUUID().replaceAll('-', '') : `${Date.now()}${Math.random().toString(16).slice(2)}`).slice(0, 40);

export default function Cart() {
  const { user } = useAuth();
  const shop = useShop();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const key = useRef(null); // one key per attempt: pressing Pay twice must not make two orders

  const canBuy = user && (user.role === 'individual' || user.role === 'business');
  const cartKey = JSON.stringify([shop.cart.map((i) => [i.kind, i.id, i.qty]), shop.dest]);
  const destBody = shop.mode === 'other' && shop.dest ? { line: shop.dest.line, state: shop.dest.state, areaId: shop.dest.areaId } : undefined;

  useEffect(() => {
    key.current = null; // the cart changed, so this is a new attempt
    setQuote(null);
    setIssues([]);
    setError(null);
    if (!canBuy || shop.cart.length === 0 || !shop.dest) return undefined;
    let cancelled = false;
    const items = shop.cart.map(({ kind, id, qty }) => ({ kind, id, qty }));
    api.quote(items, destBody)
      .then((r) => !cancelled && setQuote(r.quote))
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.code === 'CART_ISSUES') setIssues(e.details?.issues ?? []);
        setError(e.message);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, canBuy]);

  const pay = async () => {
    setPaying(true);
    setError(null);
    key.current ??= newKey();
    try {
      const items = shop.cart.map(({ kind, id, qty }) => ({ kind, id, qty }));
      const res = await api.checkout(items, destBody, key.current);
      if (res.alreadyPaid) { shop.clear(); navigate(`/app/orders/${res.order.ref}`); return; }
      try { sessionStorage.setItem('sunledger.pending', res.order.ref); } catch { /* ignore */ }
      window.location.assign(res.payment.authorizationUrl);
    } catch (e) {
      setError(e.message);
      if (e instanceof ApiError && e.code === 'CART_ISSUES') setIssues(e.details?.issues ?? []);
      setPaying(false);
    }
  };

  if (shop.cart.length === 0) {
    return (
      <div className="wrap cart-page">
        <h1>Your cart</h1>
        <div className="empty-card"><h3>Your cart is empty</h3><p>Add solar parts or a combo from the shop.</p><Link to="/shop" className="btn btn-primary">Go to the shop</Link></div>
      </div>
    );
  }

  return (
    <div className="wrap cart-page">
      <h1>Your cart</h1>
      <LocationBar />
      <div className="cart-grid">
        <ul className="cart-lines">
          {shop.cart.map((i) => (
            <li key={`${i.kind}-${i.id}`} className="cart-line">
              <div className="cart-pic">{i.imageUrl ? <img src={`${import.meta.env.VITE_API_URL ?? ''}${i.imageUrl}`} alt="" /> : <span aria-hidden="true">☀</span>}</div>
              <div className="cart-info">
                <strong>{i.name}</strong>
                <small>{i.vendorName}</small>
                {issues.find((x) => x.kind === i.kind && x.id === i.id) && <small className="err">{issues.find((x) => x.kind === i.kind && x.id === i.id).reason}</small>}
              </div>
              {i.kind === 'product' ? <Qty value={i.qty} onChange={(q) => shop.setQty(i.kind, i.id, q)} label={`Quantity of ${i.name}`} /> : <span className="muted">1 package</span>}
              <span className="cart-price">{naira(i.price * i.qty)}</span>
              <button type="button" className="link-btn" onClick={() => shop.setQty(i.kind, i.id, 0)}>Remove</button>
            </li>
          ))}
        </ul>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Summary</h2>
          {!user && <p>Log in or create an account to check out.</p>}
          {user && !canBuy && <p className="form-error">Switch to an individual or business account to buy.</p>}
          {canBuy && !shop.dest && <p className="muted">Choose where to deliver first.</p>}
          {quote && (
            <dl className="summary-list">
              <div><dt>Items</dt><dd>{naira(quote.subtotal)}</dd></div>
              {quote.serviceCharge > 0 && <div><dt>Service charge</dt><dd>{naira(quote.serviceCharge)}</dd></div>}
              <div><dt>Delivery{quote.vendorCount > 1 ? ` (${quote.vendorCount} vendors)` : ''}</dt><dd>{naira(quote.deliveryFee)}</dd></div>
              <div className="total"><dt>Total</dt><dd>{naira(quote.total)}</dd></div>
            </dl>
          )}
          {quote && <p className="muted">Expected by {when(quote.delivery.promisedBy)}{quote.delivery.afterHours ? ', the next working day' : ''}.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {!user ? (
            <Link to="/login" state={{ next: '/cart' }} className="btn btn-primary">Log in to check out</Link>
          ) : (
            <button type="button" className="btn btn-primary" disabled={!quote || paying} onClick={pay}>{paying ? 'Taking you to payment…' : 'Pay with Paystack'}</button>
          )}
          <p className="muted small">Payments are handled by Paystack. We never see your card details.</p>
        </aside>
      </div>
    </div>
  );
}
