import { useState } from 'react';
import { api } from '../../api.js';
import { naira } from '../../lib/format.js';

// Shown instead of the vendor dashboard while the one-time registration fee is unpaid.
// Only appears once registration is switched to paid (src/config/launch.js).
export default function VendorFeeGate({ fee }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.vendorFeeStart();
      window.location.assign(r.authorizationUrl);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <section className="fee-gate">
      <p className="eyebrow">One last step</p>
      <h2>Pay your one-time registration fee</h2>
      <p>To start selling on Sunledger, pay a one-time registration fee of <strong>{naira(fee.amount)}</strong>. You pay it once, it covers your onboarding and verification, and it&apos;s never charged again.</p>
      <ul className="delivery-note">
        <li>Your products and combos go live to customers once we verify your account</li>
        <li>Secure payment through Paystack</li>
      </ul>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={pay}>{busy ? 'Taking you to payment…' : `Pay ${naira(fee.amount)}`}</button>
    </section>
  );
}
