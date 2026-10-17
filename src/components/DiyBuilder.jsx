import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { naira, sizeText } from '../lib/format.js';
import RequestBox from './RequestBox.jsx';

function Stepper({ value, min, max, step = 1, onChange, label }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={dec} disabled={value <= min} aria-label={`Fewer ${label}`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={inc} disabled={value >= max} aria-label={`More ${label}`}>+</button>
    </div>
  );
}

function Part({ name, product, selected, disabled, note, onSelect }) {
  return (
    <label className={`part${selected ? ' on' : ''}${disabled ? ' disabled' : ''}`}>
      <input type="radio" name={name} checked={selected} disabled={disabled} onChange={onSelect} />
      <span className="part-name">{product.name}</span>
      <span className="part-meta">{[product.brand, sizeText(product)].filter(Boolean).join(' · ')}</span>
      <span className="part-vendor">{product.vendor.name}{product.vendor.verified ? ' · Verified' : ''}</span>
      <span className="part-price">{naira(product.price)} <small>each</small></span>
      {note && <span className="part-note">{note}</span>}
    </label>
  );
}

const rangeText = (r) => (r.min === r.max ? `${r.min}` : `${r.min} to ${r.max}`);

export default function DiyBuilder({ assessmentId, diy, limits, user }) {
  const needsBattery = limits.battery.maxKwh > 0;
  const [sel, setSel] = useState({ panelId: null, panelQty: 1, inverterId: null, batteryId: null, batteryQty: 1 });
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  const panel = diy.panels.find((p) => p.id === sel.panelId) ?? null;
  const inverter = diy.inverters.find((p) => p.id === sel.inverterId) ?? null;
  const battery = diy.batteries.find((p) => p.id === sel.batteryId) ?? null;
  const batteryRange = battery && inverter ? battery.qtyByVoltage[inverter.systemVoltage] : null;

  const choosePanel = (p) => setSel((s) => ({ ...s, panelId: p.id, panelQty: p.qty.min }));
  const chooseInverter = (inv) =>
    setSel((s) => {
      const b = diy.batteries.find((x) => x.id === s.batteryId);
      const range = b ? b.qtyByVoltage[inv.systemVoltage] : null;
      // A battery that no longer suits the new inverter is cleared rather than silently kept.
      return range ? { ...s, inverterId: inv.id, batteryQty: range.min } : { ...s, inverterId: inv.id, batteryId: null, batteryQty: 1 };
    });
  const chooseBattery = (b) => {
    const range = b.qtyByVoltage[inverter.systemVoltage];
    setSel((s) => ({ ...s, batteryId: b.id, batteryQty: range.min }));
  };

  const ready = Boolean(panel && inverter && (battery || !needsBattery));
  const items = useMemo(
    () => (ready ? [
      { productId: panel.id, qty: sel.panelQty },
      { productId: inverter.id, qty: 1 },
      ...(battery ? [{ productId: battery.id, qty: sel.batteryQty }] : []),
    ] : []),
    [ready, panel, inverter, battery, sel.panelQty, sel.batteryQty]
  );

  // Ask the server to price and check the selection. It is the one that decides if it is valid.
  useEffect(() => {
    if (!ready) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .diyQuote(assessmentId, items)
        .then((q) => !cancelled && (setQuote(q), setQuoteError(null)))
        .catch((e) => !cancelled && setQuoteError(e.message));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ready, items, assessmentId]);

  const none = (label) => <p className="muted part-empty">No vendor has a {label} in the right size yet.</p>;

  return (
    <div className="diy">
      <div className="diy-steps">
        <fieldset className="diy-step">
          <legend>1. Solar panels</legend>
          {diy.panels.length === 0 ? none('solar panel') : (
            <div className="part-grid">
              {diy.panels.map((p) => (
                <Part key={p.id} name="panel" product={p} selected={sel.panelId === p.id} onSelect={() => choosePanel(p)}
                  note={`Choose ${rangeText(p.qty)} ${p.qty.max === 1 ? 'panel' : 'panels'}`} />
              ))}
            </div>
          )}
          {panel && panel.qty.max > panel.qty.min && (
            <div className="diy-qty"><span>How many</span><Stepper label="panels" value={sel.panelQty} min={panel.qty.min} max={panel.qty.max} onChange={(v) => setSel((s) => ({ ...s, panelQty: v }))} /></div>
          )}
        </fieldset>

        <fieldset className="diy-step">
          <legend>2. Inverter</legend>
          {diy.inverters.length === 0 ? none('inverter') : (
            <div className="part-grid">
              {diy.inverters.map((p) => <Part key={p.id} name="inverter" product={p} selected={sel.inverterId === p.id} onSelect={() => chooseInverter(p)} />)}
            </div>
          )}
        </fieldset>

        {needsBattery && (
          <fieldset className="diy-step">
            <legend>3. Battery</legend>
            {!inverter ? (
              <p className="muted part-empty">Pick an inverter first so we only show batteries that work with it.</p>
            ) : diy.batteries.length === 0 ? none('battery') : (
              <div className="part-grid">
                {diy.batteries.map((b) => {
                  const range = b.qtyByVoltage[inverter.systemVoltage];
                  return (
                    <Part key={b.id} name="battery" product={b} selected={sel.batteryId === b.id} disabled={!range} onSelect={() => chooseBattery(b)}
                      note={range ? `Choose ${rangeText(range)}${range.step > 1 ? `, in groups of ${range.step}` : ''}` : `Doesn't suit a ${inverter.systemVoltage}V inverter`} />
                  );
                })}
              </div>
            )}
            {battery && batteryRange && batteryRange.max > batteryRange.min && (
              <div className="diy-qty"><span>How many</span>
                <Stepper label="batteries" value={sel.batteryQty} min={batteryRange.min} max={batteryRange.max} step={batteryRange.step} onChange={(v) => setSel((s) => ({ ...s, batteryQty: v }))} />
              </div>
            )}
          </fieldset>
        )}
      </div>

      <aside className="diy-summary" aria-live="polite">
        <h3>Your system</h3>
        {!ready && <p className="muted">Choose each part to see the price.</p>}
        {quoteError && <p className="form-error" role="alert">{quoteError}</p>}
        {ready && quote && (
          <>
            <ul className="diy-lines">
              {quote.lines.map((l) => (
                <li key={l.productId}>
                  <span>{l.qty} × {l.name}<small>{l.vendorName}</small></span>
                  <strong>{naira(l.lineTotal)}</strong>
                </li>
              ))}
            </ul>
            <p className="diy-total"><span>Parts total</span><strong>{naira(quote.subtotal)}</strong></p>
            <p className="deal-sub">{quote.totals.kwp} kWp · {quote.totals.kva} kVA · {quote.totals.kwh} kWh. Installation and delivery are agreed with the vendor and aren&apos;t included.</p>
            {quote.errors.map((e) => <p key={e.code} className="form-error" role="alert">{e.message}</p>)}
            {quote.valid && (
              <>
                {quote.vendors.length > 1 && (
                  <p className="deal-sub">These parts come from {quote.vendors.length} vendors, so each one will get a request for their own parts.</p>
                )}
                <RequestBox
                  key={items.map((i) => `${i.productId}x${i.qty}`).join(',')}
                  user={user}
                  vendorName={quote.vendors.map((v) => v.vendorName).join(' and ')}
                  label="Request these parts"
                  onSend={(message) => api.sendRequest(assessmentId, { kind: 'diy', items, message })}
                />
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
