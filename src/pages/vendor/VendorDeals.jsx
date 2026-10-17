import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PLAN_LABEL, naira, sizeText } from '../../lib/format.js';
import DealForm from './DealForm.jsx';

const STATUS_LABEL = { draft: 'Draft', active: 'Live', paused: 'Paused' };

function planLine(d, plan) {
  if (plan === 'buy') return naira(d.buyPrice);
  if (plan === 'lease') return `${naira(d.leaseMonthly)}/mo × ${d.leaseMonths}${d.leaseDeposit ? ` + ${naira(d.leaseDeposit)} deposit` : ''}`;
  if (plan === 'rent') return `${naira(d.rentMonthly)}/mo`;
  if (d.eaasTerms) return `${d.eaasTerms.tenorMonths} months at ${Math.round(d.eaasTerms.annualReturn * 10000) / 100}% return`;
  return `${naira(d.eaasMonthly)}/mo × ${d.eaasMonths}`;
}

export default function VendorDeals() {
  const [deals, setDeals] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => api.vendorDeals().then((r) => setDeals(r.deals)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const act = async (fn) => {
    setError(null);
    try {
      await fn();
      setConfirmId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!deals && !error) return <p className="muted" role="status">Loading…</p>;

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Combos &amp; deals</h2>
          <p className="muted">Packages of your own products at your own prices. Live deals are recommended to customers whose assessment they cover.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>Build a deal</button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {deals?.length === 0 && (
        <div className="empty-card">
          <h3>No deals yet</h3>
          <p>Bundle a panel, an inverter and a battery, then set a price for buying, leasing, renting or energy as a service.</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>Build your first deal</button>
        </div>
      )}

      <ul className="deal-list">
        {(deals ?? []).map((d) => {
          const broken = d.items.some((i) => i.productStatus === 'archived');
          return (
            <li key={d.id} className="deal-card">
              <div className="deal-top">
                <h3>{d.title}</h3>
                <span className={`badge badge-${broken ? 'warn' : d.status}`}>{broken ? 'Needs attention' : STATUS_LABEL[d.status]}</span>
              </div>
              <p className="deal-specs-line">{d.specs.panelKwp} kWp solar · {d.specs.inverterKva} kVA inverter · {d.specs.batteryKwh} kWh battery</p>
              <ul className="deal-items">
                {d.items.map((i) => (
                  <li key={i.productId}>{i.qty} × {i.name} <small>({sizeText(i)})</small>{i.productStatus === 'archived' && <span className="badge badge-warn">Removed</span>}</li>
                ))}
              </ul>
              <ul className="plan-chips">
                {d.plans.map((p) => <li key={p}><span>{PLAN_LABEL[p]}</span>{planLine(d, p)}</li>)}
              </ul>
              <div className="row-actions">
                {d.status === 'active' ? (
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => act(() => api.vendorDealStatus(d.id, 'paused'))}>Pause</button>
                ) : (
                  <button type="button" className="btn btn-primary btn-small" onClick={() => act(() => api.vendorDealStatus(d.id, 'active'))} disabled={broken}>Publish</button>
                )}
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(d)}>Edit</button>
                {confirmId === d.id ? (
                  <>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => act(() => api.vendorDeleteDeal(d.id))}>Confirm remove</button>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => setConfirmId(null)}>Keep</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-quiet btn-small" onClick={() => setConfirmId(d.id)}>Remove</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <DealForm
          deal={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
