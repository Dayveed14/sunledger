import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export default function VendorOverview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.vendorSummary().then((r) => !cancelled && setS(r)).catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!s) return <p className="muted" role="status">Loading…</p>;

  const steps = [
    { done: s.products > 0, title: 'Add your products', text: 'List the solar panels, inverters and batteries you sell, with your prices.', to: '/app/products', cta: 'Add products' },
    { done: s.activeDeals > 0, title: 'Build a combo or deal', text: 'Bundle a panel, inverter and battery into a package and set a price for buying, leasing, renting or energy as a service.', to: '/app/deals', cta: 'Build a deal' },
    { done: s.newRequests > 0, title: 'Receive customer requests', text: 'Customers whose assessment fits your deal or parts can ask you for a quote. You will see them here.', to: '/app/requests', cta: 'View requests' },
  ];

  return (
    <>
      {s.verification === 'pending' && (
        <aside className="r-banner">
          <div>
            <strong>Your account is waiting for verification.</strong>
            <span>You can set everything up now. Sunledger will confirm your business details before customers are sent to you.</span>
          </div>
        </aside>
      )}
      {s.verification === 'rejected' && (
        <p className="form-error" role="alert">Your vendor account was not approved, so your listings are hidden from customers. Contact Sunledger support.</p>
      )}

      <div className="stat-row">
        <div className="stat-card"><span>Products listed</span><strong>{s.products}</strong></div>
        <div className="stat-card"><span>Live deals</span><strong>{s.activeDeals}</strong></div>
        <div className="stat-card"><span>New requests</span><strong>{s.newRequests}</strong></div>
      </div>

      <h2 className="dash-h2">How customers find you</h2>
      <ol className="steps-list">
        {steps.map((st, i) => (
          <li key={st.title} className={st.done ? 'done' : ''}>
            <span className="step-badge" aria-hidden="true">{st.done ? '✓' : i + 1}</span>
            <div>
              <strong>{st.title}</strong>
              <p>{st.text}</p>
            </div>
            <Link to={st.to} className="btn btn-ghost btn-small">{st.cta}</Link>
          </li>
        ))}
      </ol>
      <p className="muted how-note">
        When a customer finishes an energy assessment, we work out the smallest system that covers them. Your <strong>deals</strong> are
        recommended to customers whose needs they cover. Your <strong>products</strong> appear in the build-your-own option, but only when
        their size falls in that customer&apos;s range.
      </p>
    </>
  );
}
