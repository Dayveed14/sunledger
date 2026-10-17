import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import DiyBuilder from '../components/DiyBuilder.jsx';
import RequestBox from '../components/RequestBox.jsx';
import { PLAN_LABEL, kwh, monthsToText, naira, nairaCompact, sizeText } from '../lib/format.js';

const PLANS = ['buy', 'lease', 'rent', 'eaas'];

function PriceBlock({ offer }) {
  if (offer.plan === 'buy') {
    return (
      <>
        <p className="opt-price">{naira(offer.upfront)} <span>once</span></p>
        {offer.paybackMonths && <p className="deal-sub">Pays for itself in about {monthsToText(offer.paybackMonths)} at your current costs</p>}
      </>
    );
  }
  return (
    <>
      <p className="opt-price">{naira(offer.monthly)} <span>/ month</span></p>
      <p className="deal-sub">
        {offer.plan === 'lease' && `${offer.termMonths} months${offer.upfront ? `, plus ${naira(offer.upfront)} deposit` : ', no deposit'}. You own it at the end.`}
        {offer.plan === 'rent' && 'First month paid in advance. Cancel any time, per the vendor\'s terms.'}
        {offer.plan === 'eaas' && `${offer.termMonths}-month contract. ${offer.upfront ? `${naira(offer.upfront)} due at installation.` : 'Installation is spread over the monthly payments.'}`}
      </p>
      <p className={`opt-vs ${offer.monthlySaving > 0 ? 'opt-vs-good' : 'opt-vs-warn'}`}>
        {offer.monthlySaving > 0
          ? `About ${naira(offer.monthlySaving)} a month cheaper than today`
          : `About ${naira(Math.abs(offer.monthlySaving))} a month more than today`}
      </p>
      {offer.plan === 'eaas' && offer.eaas && <EaasDetails offer={offer} />}
    </>
  );
}

function EaasDetails({ offer }) {
  const e = offer.eaas;
  const exit = e.exitSchedule.filter((x) => x.month < e.tenorMonths);
  return (
    <details className="eaas-details">
      <summary>How this price is made up</summary>
      <ul>
        <li>Equipment cost recovered over the contract: {naira(e.breakdown.capital)}/month</li>
        <li>Maintenance, insurance, monitoring and replacement reserve: {naira(e.breakdown.operating.total)}/month</li>
        <li>Allowance for late payment and equipment loss: {naira(e.breakdown.risk)}/month</li>
        <li>Sunledger platform fee: {naira(e.breakdown.platformFee)}/month</li>
      </ul>
      <p className="deal-sub">
        Refundable deposit: {naira(e.deposit)}. {e.buyoutAtEnd > 0 ? `Own it at the end for ${naira(e.buyoutAtEnd)}.` : 'Ownership terms at the end are agreed with the vendor.'}
      </p>
      {exit.length > 0 && (
        <p className="deal-sub">Leave early (paying the rest of the balance): {exit.map((x) => `month ${x.month}: ${naira(x.amount)}`).join(' · ')}.</p>
      )}
      {offer.allowanceKwhPerMonth && (
        <p className="deal-sub">
          Sized for about {Math.round(offer.allowanceKwhPerMonth)} kWh a month{offer.overagePerKwh ? `; extra energy costs ${naira(offer.overagePerKwh)}/kWh` : ''}.
        </p>
      )}
    </details>
  );
}

function DealCard({ deal, assessmentId, user, onSent }) {
  return (
    <article className="deal-offer">
      <div className="deal-top">
        <div>
          <p className="vendor-line">{deal.vendor.name}{deal.vendor.verified && <span className="badge badge-verified">Verified</span>}</p>
          <h3>{deal.title}</h3>
        </div>
        <span className={`tag${deal.fit.label === 'Right size' ? ' tag-gold' : ''}`}>{deal.fit.label}</span>
      </div>
      <p className="deal-specs-line">{deal.specs.panelKwp} kWp solar · {deal.specs.inverterKva} kVA inverter · {deal.specs.batteryKwh} kWh battery</p>
      <ul className="deal-items">
        {deal.items.map((i) => <li key={i.productId}>{i.qty} × {i.name} <small>({sizeText(i)})</small></li>)}
      </ul>
      <ul className="opt-facts">
        <li>{deal.installationIncluded ? 'Installation included' : 'Installation not included'}</li>
        {deal.warrantyYears ? <li>{deal.warrantyYears}-year warranty</li> : null}
      </ul>
      {deal.description && <p className="deal-sub">{deal.description}</p>}
      <PriceBlock offer={deal.offer} />
      <RequestBox
        user={user}
        vendorName={deal.vendor.name}
        label="Request this deal"
        onSend={(message) => api.sendRequest(assessmentId, { kind: 'deal', dealId: deal.id, plan: deal.offer.plan, message })}
        onSent={onSent}
      />
    </article>
  );
}

export default function Offers() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const plan = PLANS.includes(params.get('plan')) ? params.get('plan') : 'buy';
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .offers(id, plan)
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err instanceof ApiError ? err.message : 'Something went wrong.' }));
    return () => {
      cancelled = true;
    };
  }, [id, plan, refresh]);

  const { data } = state;
  const need = data?.requirement;
  const estimate = useMemo(() => {
    if (!data?.estimate) return null;
    const e = data.estimate;
    return plan === 'buy' ? `${nairaCompact(e.upfront)} to buy` : `${naira(e.monthly)} a month`;
  }, [data, plan]);

  if (state.error && !data) {
    return (
      <section className="wrap page-narrow empty-state">
        <h1>We couldn&apos;t open the offers</h1>
        <p className="lede">{state.error}</p>
        <Link to={`/app/assessments/${id}`} className="btn btn-primary">Back to your assessment</Link>
      </section>
    );
  }

  return (
    <div className="wrap results-page">
      <header className="results-head">
        <div>
          <p className="eyebrow">Vendor offers</p>
          <h1>Choose how to get your solar</h1>
        </div>
        <div className="results-actions">
          <Link to={`/app/assessments/${id}`} className="btn btn-ghost btn-small">Back to my results</Link>
        </div>
      </header>

      <div className="plan-tabs" role="tablist" aria-label="How to pay">
        {PLANS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={plan === p}
            className={`tab${plan === p ? ' on' : ''}`}
            onClick={() => setParams({ plan: p }, { replace: true })}
          >
            {PLAN_LABEL[p]}
            {data && data.dealCounts[p] > 0 && <span className="tab-dot">{data.dealCounts[p]}</span>}
          </button>
        ))}
      </div>

      {!data && <p className="muted" role="status">Finding offers that fit you…</p>}

      {data && (
        <>
          <section className="need-strip" aria-label="What you need">
            <div>
              <p className="eyebrow">The smallest system that covers you</p>
              <p className="need-line">
                <strong>{need.panelKwp} kWp</strong> of panels · <strong>{need.inverterKva} kVA</strong> inverter ·{' '}
                <strong>{need.batteryKwh ? `${kwh(need.batteryKwh)} kWh` : 'no'}</strong> battery
              </p>
            </div>
            {estimate && <p className="muted need-est">Typical market price from your assessment: {estimate}. Real offers below.</p>}
          </section>

          <section aria-labelledby="rec-h" className="offer-section">
            <h2 id="rec-h">Recommended by vendors</h2>
            <p className="muted">Packages vendors have put together that cover what you need. Cheapest first.</p>
            {data.deals.length === 0 ? (
              <div className="empty-card">
                <h3>No vendor has a {PLAN_LABEL[plan].toLowerCase()} deal that fits yet</h3>
                <p>
                  {PLANS.some((p) => p !== plan && data.dealCounts[p] > 0)
                    ? 'Other ways to pay do have matches. Try the other tabs above.'
                    : 'Vendors are still joining. Check back soon.'}
                  {plan === 'buy' ? ' You can also build your own below from vendor parts.' : ''}
                </p>
              </div>
            ) : (
              <div className="deal-offers">
                {data.deals.map((d) => (
                  <DealCard key={d.id} deal={d} assessmentId={id} user={user} onSent={() => setRefresh((n) => n + 1)} />
                ))}
              </div>
            )}
          </section>

          {plan === 'buy' && data.diy && (
            <section aria-labelledby="diy-h" className="offer-section">
              <h2 id="diy-h">Build your own</h2>
              <p className="muted">
                Pick one panel, one inverter and one battery from vendors. We only show sizes close to what you need:
                panels {data.limits.panel.minKwp} to {data.limits.panel.maxKwp} kWp in total, an inverter of {data.limits.inverter.minKva} to{' '}
                {data.limits.inverter.maxKva} kVA{data.limits.battery.maxKwh > 0 ? `, and ${data.limits.battery.minKwh} to ${data.limits.battery.maxKwh} kWh of battery` : ''}.
              </p>
              <DiyBuilder assessmentId={id} diy={data.diy} limits={data.limits} user={user} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
