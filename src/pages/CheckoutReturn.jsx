import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../auth/ShopContext.jsx';

// Paystack sends the customer back here. We ask the server (which asks Paystack) whether it was paid.
// kind 'order' = paying for an order; 'fee' = a vendor paying the one-time registration fee.
export default function CheckoutReturn({ mock = false, kind = 'order' }) {
  const fee = kind === 'fee';
  const verify = fee ? api.vendorFeeVerify : api.verifyPayment;
  const mockPay = fee ? api.vendorFeeMockPay : api.mockPay;
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const shop = useShop();
  const [state, setState] = useState({ phase: reference ? 'checking' : 'error', message: reference ? null : 'No payment reference found.' });
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!reference || (mock && state.phase !== 'ready')) return undefined;
    let cancelled = false;
    verify(reference)
      .then((r) => {
        if (cancelled) return;
        if (r.status === 'paid') { if (!fee) shop.clear(); setState({ phase: 'paid', ref: r.orderRef }); }
        else if (r.status === 'failed') setState({ phase: 'failed', ref: r.orderRef });
        else if (tries < 5) setTimeout(() => !cancelled && setTries((n) => n + 1), 2500);
        else setState({ phase: 'pending', ref: r.orderRef });
      })
      .catch((e) => !cancelled && setState({ phase: 'error', message: e.message }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, tries, mock && state.phase]);

  if (mock && state.phase !== 'paid') {
    return (
      <div className="wrap narrow">
        <h1>Simulated payment page</h1>
        <p className="muted">Paystack is not connected on this server, so this stands in for the payment page. No money moves.</p>
        <button type="button" className="btn btn-primary" onClick={async () => {
          try { await mockPay(reference); if (!fee) shop.clear(); setState({ phase: 'paid', ref: sessionStorage.getItem('sunledger.pending') }); } catch (e) { setState({ phase: 'error', message: e.message }); }
        }}>Pay now (simulation)</button>
        {state.phase === 'error' && <p className="form-error" role="alert">{state.message}</p>}
      </div>
    );
  }

  return (
    <div className="wrap narrow">
      {state.phase === 'checking' && <><h1>Confirming your payment…</h1><p className="muted" role="status">This takes a few seconds. Please don&apos;t close this page.</p></>}
      {state.phase === 'paid' && fee && (
        <>
          <h1>Welcome to Sunledger</h1>
          <p>Your registration fee is paid. You can now add products and deals.</p>
          <Link to="/app" className="btn btn-primary">Go to my dashboard</Link>
        </>
      )}
      {state.phase === 'paid' && !fee && (
        <>
          <h1>Payment confirmed</h1>
          <p>Thank you. Your vendor has been asked to confirm your order, and we&apos;ve emailed you.</p>
          <Link to={state.ref ? `/app/orders/${state.ref}` : '/app/orders'} className="btn btn-primary">Track your order</Link>
        </>
      )}
      {state.phase === 'failed' && <><h1>Payment did not go through</h1><p>No money was taken. You can try again.</p>{fee ? <Link to="/app" className="btn btn-primary">Try again</Link> : <Link to="/cart" className="btn btn-primary">Back to cart</Link>}</>}
      {state.phase === 'pending' && <><h1>Still waiting for the bank</h1><p>If you were charged, it will show up shortly{fee ? ' and your account will activate' : <> in <Link to="/app/orders">My orders</Link></>}. You don&apos;t need to pay again.</p></>}
      {state.phase === 'error' && <><h1>We couldn&apos;t check that payment</h1><p className="form-error" role="alert">{state.message}</p><Link to="/app/orders">See my orders</Link></>}
    </div>
  );
}
