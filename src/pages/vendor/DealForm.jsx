import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../../api.js';
import Dialog from '../../components/Dialog.jsx';
import { CATEGORY_LABEL, naira, sizeText } from '../../lib/format.js';
import { fieldErrorsOf, groupDigits, parseNumber } from '../../lib/forms.js';

const money = (v) => (v == null ? '' : groupDigits(v));
const itemOf = (deal, category) => deal?.items.find((i) => i.category === category);

function initial(deal) {
  return {
    title: deal?.title ?? '',
    description: deal?.description ?? '',
    panelId: String(itemOf(deal, 'panel')?.productId ?? ''),
    panelQty: String(itemOf(deal, 'panel')?.qty ?? '2'),
    inverterId: String(itemOf(deal, 'inverter')?.productId ?? ''),
    inverterQty: String(itemOf(deal, 'inverter')?.qty ?? '1'),
    batteryId: String(itemOf(deal, 'battery')?.productId ?? ''),
    batteryQty: String(itemOf(deal, 'battery')?.qty ?? '1'),
    installationIncluded: deal?.installationIncluded ?? true,
    warrantyYears: deal?.warrantyYears == null ? '' : String(deal.warrantyYears),
    buyOn: deal ? deal.buyPrice != null : true,
    buyPrice: money(deal?.buyPrice),
    leaseOn: deal ? deal.leaseMonthly != null : false,
    leaseDeposit: money(deal?.leaseDeposit ?? 0),
    leaseMonthly: money(deal?.leaseMonthly),
    leaseMonths: String(deal?.leaseMonths ?? '36'),
    rentOn: deal ? deal.rentMonthly != null : false,
    rentMonthly: money(deal?.rentMonthly),
    eaasOn: Boolean(deal?.eaasTerms),
    eaasTenor: String(deal?.eaasTerms?.tenorMonths ?? '36'),
    eaasReturn: String(deal?.eaasTerms ? Math.round(deal.eaasTerms.annualReturn * 10000) / 100 : '24'),
    eaasCost: money(deal?.eaasTerms?.equipmentCost),
    eaasInstall: money(deal?.eaasTerms?.installationCost ?? 0),
    eaasInstallMode: deal?.eaasTerms?.installationMode ?? 'upfront',
    eaasOverage: money(deal?.eaasTerms?.overagePerKwh),
    publish: deal ? deal.status === 'active' : false,
  };
}

export default function DealForm({ deal, onClose, onSaved }) {
  const editing = Boolean(deal);
  const [products, setProducts] = useState(null);
  const [f, setF] = useState(() => initial(deal));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.vendorProducts().then((r) => setProducts(r.products)).catch((e) => setFormError(e.message));
  }, []);

  const by = useMemo(() => {
    const out = { panel: [], inverter: [], battery: [] };
    for (const p of products ?? []) out[p.category].push(p);
    return out;
  }, [products]);

  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setMoney = (key) => (e) => setF((x) => ({ ...x, [key]: groupDigits(e.target.value) }));
  const err = (k) => errors[k] && <small className="err">{errors[k]}</small>;

  const picked = (category) => by[category].find((p) => String(p.id) === f[`${category}Id`]);
  const panel = picked('panel');
  const inverter = picked('inverter');
  const battery = picked('battery');
  const qty = (k) => Math.max(0, Number.parseInt(f[`${k}Qty`], 10) || 0);

  // A live read-out of the system they are building. The server works the same numbers out again.
  const specs = {
    kwp: panel ? (panel.rating * qty('panel')) / 1000 : 0,
    kva: inverter ? inverter.rating * qty('inverter') : 0,
    kwh: battery ? battery.rating * qty('battery') : 0,
  };
  const step = inverter && battery && battery.systemVoltage && inverter.systemVoltage % battery.systemVoltage === 0 ? inverter.systemVoltage / battery.systemVoltage : null;
  const voltageProblem = inverter && battery && !step;

  const eaasBody = () => ({
    tenorMonths: Number.parseInt(f.eaasTenor, 10) || 0,
    annualReturnPct: Number.parseFloat(f.eaasReturn) || 0,
    equipmentCost: parseNumber(f.eaasCost) ?? null,
    installationCost: parseNumber(f.eaasInstall) ?? 0,
    installationMode: f.eaasInstallMode,
    overagePerKwh: parseNumber(f.eaasOverage) ?? null,
  });

  const [rules, setRules] = useState(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    api.vendorEaasRules().then(setRules).catch(() => {});
  }, []);

  // Live price check: the server works the monthly fee out from the terms, so the vendor sees what customers will see.
  const previewKey = JSON.stringify([f.eaasOn, f.eaasTenor, f.eaasReturn, f.eaasCost, f.eaasInstall, f.eaasInstallMode, f.panelId, f.panelQty, f.inverterId, f.inverterQty, f.batteryId, f.batteryQty]);
  useEffect(() => {
    if (!f.eaasOn || !panel || !inverter || !battery) { setPreview(null); return undefined; }
    const t = setTimeout(() => {
      api
        .vendorEaasPreview({
          items: [panel, inverter, battery].map((p) => ({ productId: p.id, qty: qty(p.category) })),
          eaas: eaasBody(),
        })
        .then((r) => setPreview({ ok: true, ...r }))
        .catch((e) => setPreview({ ok: false, message: e.message }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const submit = async (e) => {
    e.preventDefault();
    const num = (k) => parseNumber(f[k]);
    const body = {
      title: f.title.trim(),
      description: f.description.trim() || null,
      items: [
        panel && { productId: panel.id, qty: qty('panel') },
        inverter && { productId: inverter.id, qty: qty('inverter') },
        battery && { productId: battery.id, qty: qty('battery') },
      ].filter(Boolean),
      installationIncluded: f.installationIncluded,
      warrantyYears: num('warrantyYears') ?? null,
      buyPrice: f.buyOn ? num('buyPrice') ?? null : null,
      lease: f.leaseOn ? { deposit: num('leaseDeposit') ?? 0, monthly: num('leaseMonthly'), months: num('leaseMonths') } : null,
      rentMonthly: f.rentOn ? num('rentMonthly') ?? null : null,
      eaas: f.eaasOn ? eaasBody() : null,
      status: f.publish ? 'active' : editing && deal.status === 'paused' ? 'paused' : 'draft',
    };
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const res = editing ? await api.vendorUpdateDeal(deal.id, body) : await api.vendorCreateDeal(body);
      onSaved(res.deal);
    } catch (e2) {
      if (e2 instanceof ApiError && (e2.code === 'VALIDATION_ERROR' || e2.code === 'INVALID_DEAL')) {
        const fields = fieldErrorsOf(e2);
        setErrors(fields);
        if (!Object.keys(fields).length) setFormError(e2.message);
      } else setFormError(e2.message);
      setSaving(false);
    }
  };

  const missing = products && ['panel', 'inverter', 'battery'].filter((c) => by[c].length === 0);

  const picker = (category, qtyHint) => (
    <div className="deal-part">
      <label className="field">
        <span>{CATEGORY_LABEL[category]}</span>
        <select value={f[`${category}Id`]} onChange={set(`${category}Id`)}>
          <option value="">Choose…</option>
          {by[category].map((p) => <option key={p.id} value={p.id}>{p.name} · {sizeText(p)}</option>)}
        </select>
      </label>
      <label className="field field-qty">
        <span>How many</span>
        <input type="text" inputMode="numeric" value={f[`${category}Qty`]} onChange={set(`${category}Qty`)} aria-label={`Number of ${CATEGORY_LABEL[category].toLowerCase()}s`} />
      </label>
      {qtyHint && <small className="deal-hint">{qtyHint}</small>}
    </div>
  );

  return (
    <Dialog
      title={editing ? 'Edit deal' : 'Build a combo or deal'}
      eyebrow="Combos & deals"
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button type="submit" form="deal-form" className="btn btn-primary" disabled={saving || !products || missing?.length > 0}>
            {saving ? 'Saving…' : f.publish ? 'Save and publish' : 'Save draft'}
          </button>
        </>
      }
    >
      {!products && !formError && <p className="muted" role="status">Loading your products…</p>}

      {missing?.length > 0 && (
        <p className="form-error" role="alert">
          A deal needs at least one {missing.map((m) => CATEGORY_LABEL[m].toLowerCase()).join(', one ')} in your catalogue first.{' '}
          <Link to="/app/products" onClick={onClose}>Add products</Link>
        </p>
      )}

      {products && missing?.length === 0 && (
        <form id="deal-form" onSubmit={submit} noValidate>
          <label className="field">
            <span>Deal name</span>
            <input type="text" value={f.title} onChange={set('title')} aria-invalid={Boolean(errors.title)} placeholder="Home Starter 1.5kVA" />
            {err('title')}
          </label>

          <fieldset className="deal-parts">
            <legend className="field-legend">What&apos;s in it</legend>
            {picker('panel')}
            {picker('inverter')}
            {picker('battery', step > 1 ? `Your inverter is ${inverter.systemVoltage}V and this battery is ${battery.systemVoltage}V, so batteries must be in groups of ${step}.` : null)}
            {err('items')}
            {voltageProblem && <small className="err">The battery ({battery.systemVoltage}V) can&apos;t run this inverter ({inverter.systemVoltage}V).</small>}
            <p className="deal-specs" aria-live="polite">
              <strong>This system:</strong> {specs.kwp.toFixed(2)} kWp solar · {specs.kva.toFixed(1)} kVA inverter · {specs.kwh.toFixed(1)} kWh battery
            </p>
          </fieldset>

          <fieldset className="deal-plans">
            <legend className="field-legend">How customers can get it, and your price</legend>
            <p className="muted">Turn on each way you&apos;re willing to offer this system. Customers only see the plans you set a price for.</p>

            <div className="plan-box">
              <label className="plan-toggle"><input type="checkbox" checked={f.buyOn} onChange={set('buyOn')} /> Buy outright</label>
              {f.buyOn && (
                <label className="field"><span>Total price (₦)</span>
                  <input type="text" inputMode="numeric" value={f.buyPrice} onChange={setMoney('buyPrice')} placeholder="1,250,000" aria-invalid={Boolean(errors.buyPrice)} />{err('buyPrice')}</label>
              )}
            </div>

            <div className="plan-box">
              <label className="plan-toggle"><input type="checkbox" checked={f.leaseOn} onChange={set('leaseOn')} /> Lease to own</label>
              {f.leaseOn && (
                <div className="field-row">
                  <label className="field"><span>Deposit (₦)</span><input type="text" inputMode="numeric" value={f.leaseDeposit} onChange={setMoney('leaseDeposit')} /></label>
                  <label className="field"><span>Monthly (₦)</span><input type="text" inputMode="numeric" value={f.leaseMonthly} onChange={setMoney('leaseMonthly')} aria-invalid={Boolean(errors['lease.monthly'])} />{err('lease.monthly')}</label>
                  <label className="field"><span>Months</span><input type="text" inputMode="numeric" value={f.leaseMonths} onChange={set('leaseMonths')} />{err('lease.months')}</label>
                </div>
              )}
            </div>

            <div className="plan-box">
              <label className="plan-toggle"><input type="checkbox" checked={f.rentOn} onChange={set('rentOn')} /> Rent</label>
              {f.rentOn && (
                <label className="field"><span>Monthly rent (₦)</span>
                  <input type="text" inputMode="numeric" value={f.rentMonthly} onChange={setMoney('rentMonthly')} aria-invalid={Boolean(errors.rentMonthly)} />{err('rentMonthly')}</label>
              )}
            </div>

            <div className="plan-box">
              <label className="plan-toggle"><input type="checkbox" checked={f.eaasOn} onChange={set('eaasOn')} /> Energy as a service</label>
              {f.eaasOn && (
                <div className="eaas-form">
                  <p className="muted">
                    You don&apos;t type a monthly fee. It is worked out from your cost and the return you want, plus running costs, a risk allowance and Sunledger&apos;s {rules ? Math.round(rules.platformFeePct * 100) : 6}% fee.
                  </p>
                  <div className="field-row">
                    <label className="field"><span>Contract length</span>
                      <select value={f.eaasTenor} onChange={set('eaasTenor')}>
                        {(rules?.tenorMonths.suggested ?? [24, 36, 48, 60]).map((m) => <option key={m} value={m}>{m} months</option>)}
                      </select>{err('eaas.tenorMonths')}</label>
                    <label className="field"><span>Your yearly return (%)</span>
                      <input type="text" inputMode="decimal" value={f.eaasReturn} onChange={set('eaasReturn')} aria-invalid={Boolean(errors['eaas.annualReturnPct'])} />
                      {rules && <small className="muted">Allowed: {Math.round(rules.annualReturn.min * 100)}% to {Math.round(rules.annualReturn.max * 100)}%</small>}
                      {err('eaas.annualReturnPct')}</label>
                  </div>
                  <div className="field-row">
                    <label className="field"><span>Your cost of this equipment (₦) <em>(optional)</em></span>
                      <input type="text" inputMode="numeric" value={f.eaasCost} onChange={setMoney('eaasCost')} placeholder="Uses your product prices if empty" />{err('eaas.equipmentCost')}</label>
                    <label className="field"><span>Installation cost (₦)</span>
                      <input type="text" inputMode="numeric" value={f.eaasInstall} onChange={setMoney('eaasInstall')} />{err('eaas.installationCost')}</label>
                  </div>
                  <div className="field-row">
                    <label className="field"><span>Who pays installation</span>
                      <select value={f.eaasInstallMode} onChange={set('eaasInstallMode')}>
                        <option value="upfront">Customer pays at installation (lowest monthly)</option>
                        <option value="rolled">Spread over the monthly payments</option>
                      </select></label>
                    <label className="field"><span>Price above fair use (₦/kWh) <em>(optional)</em></span>
                      <input type="text" inputMode="numeric" value={f.eaasOverage} onChange={setMoney('eaasOverage')} />{err('eaas.overagePerKwh')}</label>
                  </div>
                  {preview?.ok === false && <p className="form-error" role="alert">{preview.message}</p>}
                  {preview?.ok && (
                    <div className="eaas-preview" aria-live="polite">
                      {[['Home', preview.home], ['Business', preview.business]].map(([label, q]) => (
                        <div key={label}>
                          <strong>{label}: {naira(q.monthly)}/month</strong>
                          <small>
                            Capital {naira(q.breakdown.capital)} · running costs {naira(q.breakdown.operating.total)} · risk {naira(q.breakdown.risk)} · Sunledger fee {naira(q.breakdown.platformFee)}
                          </small>
                        </div>
                      ))}
                      <small className="muted">
                        Customer pays {naira(preview.home.installation.payAtInstall)} at installation and a refundable deposit of {naira(preview.home.deposit)}.
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
            {err('plans')}
          </fieldset>

          <div className="field-row">
            <label className="field">
              <span>Warranty (years) <em>(optional)</em></span>
              <input type="text" inputMode="numeric" value={f.warrantyYears} onChange={set('warrantyYears')} />
            </label>
            <div className="field check-field">
              <label><input type="checkbox" checked={f.installationIncluded} onChange={set('installationIncluded')} /> Installation included</label>
            </div>
          </div>

          <label className="field">
            <span>Description <em>(optional)</em></span>
            <textarea rows={3} value={f.description} onChange={set('description')} maxLength={600} placeholder="What it can power, what's covered, delivery areas…" />
            {err('description')}
          </label>

          <div className="check-row">
            <label><input type="checkbox" checked={f.publish} onChange={set('publish')} /> Publish now (customers can see this deal)</label>
          </div>

          {formError && <p className="form-error" role="alert">{formError}</p>}
          {(deal?.items ?? []).some((i) => i.productStatus === 'archived') && (
            <p className="form-error" role="alert">This deal uses a product you removed. Choose a replacement above.</p>
          )}
          <p className="muted">Prices: panel {panel ? naira(panel.price * qty('panel')) : '–'} · inverter {inverter ? naira(inverter.price * qty('inverter')) : '–'} · battery {battery ? naira(battery.price * qty('battery')) : '–'} at your product prices, for reference.</p>
        </form>
      )}
      {formError && !products && <p className="form-error" role="alert">{formError}</p>}
    </Dialog>
  );
}
