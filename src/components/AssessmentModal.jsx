import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { loadPending, savePending } from '../lib/pending.js';
import ApplianceRow from './ApplianceRow.jsx';
import { useAssessment } from './AssessmentContext.jsx';

const STEP_TITLES = ['Who is this for?', 'What do you use?', 'Your power supply'];
const catalogCache = new Map();

function useCatalog(segment) {
  const [state, setState] = useState({ data: catalogCache.get(segment) ?? null, error: null });

  useEffect(() => {
    if (!segment) return undefined;
    if (catalogCache.has(segment)) {
      setState({ data: catalogCache.get(segment), error: null });
      return undefined;
    }
    let cancelled = false;
    setState({ data: null, error: null });
    api
      .catalog(segment)
      .then((data) => {
        catalogCache.set(segment, data);
        if (!cancelled) setState({ data, error: null });
      })
      .catch((err) => !cancelled && setState({ data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [segment]);

  return state;
}

// { applianceId: { hoursKey, qty: { variantId: n } } }
function selectionFromItems(items, catalog) {
  const byId = new Map(catalog.appliances.map((a) => [a.id, a]));
  const selection = {};
  for (const item of items) {
    const ap = byId.get(item.applianceId);
    if (!ap) continue;
    const entry = (selection[ap.id] ??= { hoursKey: item.hoursKey ?? ap.defaultHours, qty: {} });
    entry.qty[item.variantId] = (entry.qty[item.variantId] ?? 0) + item.qty;
  }
  return selection;
}

function itemsFromSelection(selection, catalog) {
  const fixed = new Set(catalog.appliances.filter((a) => a.hoursMode === 'fixed').map((a) => a.id));
  const items = [];
  for (const [applianceId, entry] of Object.entries(selection)) {
    for (const [variantId, qty] of Object.entries(entry.qty)) {
      if (qty > 0) {
        items.push({ applianceId, variantId, qty, ...(fixed.has(applianceId) ? {} : { hoursKey: entry.hoursKey }) });
      }
    }
  }
  return items;
}

export default function AssessmentModal() {
  const { isOpen, edit, segment, close } = useAssessment();
  if (!isOpen) return null;
  // Remounting on every open gives the wizard fresh state each time.
  return <Wizard edit={edit} initialSegment={segment} onClose={close} />;
}

function Wizard({ edit, initialSegment, onClose }) {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const restored = useRef(false);
  const pending = useMemo(() => (edit ? loadPending() : null), [edit]);

  const startSegment = pending?.input?.segment ?? initialSegment ?? null;
  const [step, setStep] = useState(startSegment ? 1 : 0);
  const [segment, setSegment] = useState(startSegment);
  const [selection, setSelection] = useState({});
  const [category, setCategory] = useState(null);
  const [disco, setDisco] = useState(pending?.input?.disco ?? 'aedc');
  const [supply, setSupply] = useState(pending?.input ? (pending.input.supplyBand ?? 'none') : 'none');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { data: catalog, error: catalogError } = useCatalog(segment);

  // Editing from the results page: put their earlier answers back once the catalogue has loaded.
  useEffect(() => {
    if (catalog && pending?.input && !restored.current) {
      restored.current = true;
      setSelection(selectionFromItems(pending.input.items, catalog));
    }
  }, [catalog, pending]);

  useEffect(() => {
    if (catalog) setCategory((c) => (c && catalog.categories.includes(c) ? c : catalog.categories[0]));
  }, [catalog]);

  // Modal behaviour: lock page scroll, close on Esc, keep Tab inside, return focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocused(previouslyFocused);
    };
  }, [onClose]);

  const chooseSegment = (next) => {
    if (next !== segment) {
      setSegment(next);
      setSelection({});
      setCategory(null);
    }
  };

  const toggleAppliance = useCallback((ap) => {
    setSelection((prev) => {
      if (prev[ap.id]) {
        const { [ap.id]: _removed, ...rest } = prev;
        return rest;
      }
      const defaultVariant = ap.variants.find((x) => x.default) ?? ap.variants[0];
      return { ...prev, [ap.id]: { hoursKey: ap.defaultHours, qty: { [defaultVariant.id]: 1 } } };
    });
  }, []);

  const setQty = useCallback((ap, variantId, n) => {
    setSelection((prev) => {
      const current = prev[ap.id];
      if (!current) return prev;
      const qty = { ...current.qty, [variantId]: n };
      if (Object.values(qty).every((q) => !q)) {
        const { [ap.id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ap.id]: { ...current, qty } };
    });
  }, []);

  const setHours = useCallback((ap, hoursKey) => {
    setSelection((prev) => (prev[ap.id] ? { ...prev, [ap.id]: { ...prev[ap.id], hoursKey } } : prev));
  }, []);

  const applyPreset = (preset) => setSelection(selectionFromItems(preset.items, catalog));

  const chosenAppliances = Object.keys(selection).length;
  const chosenUnits = Object.values(selection).reduce(
    (sum, entry) => sum + Object.values(entry.qty).reduce((s, n) => s + n, 0),
    0
  );
  const chosenByCategory = useMemo(() => {
    const counts = {};
    if (!catalog) return counts;
    for (const ap of catalog.appliances) if (selection[ap.id]) counts[ap.category] = (counts[ap.category] ?? 0) + 1;
    return counts;
  }, [catalog, selection]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const input = {
      segment,
      disco,
      supplyBand: supply === 'none' ? null : supply,
      items: itemsFromSelection(selection, catalog),
    };
    try {
      const { result } = await api.estimate(input);
      savePending({ input, result });
      onClose();
      navigate('/results');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const canNext = step === 0 ? Boolean(segment) : step === 1 ? chosenAppliances > 0 : true;
  const visibleAppliances = catalog && category ? catalog.appliances.filter((a) => a.category === category) : [];

  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assess-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="modal-head">
          <div>
            <p className="eyebrow">Free energy assessment · Step {step + 1} of 3</p>
            <h2 id="assess-title">{STEP_TITLES[step]}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close assessment">
            ×
          </button>
        </header>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>

        <div className="modal-body">
          {step === 0 && (
            <fieldset className="choice-grid">
              <legend className="sr-only">Home or business</legend>
              {[
                { key: 'home', title: 'My home', text: 'Fans, TV, fridge, AC and the usual household things.' },
                { key: 'business', title: 'My business', text: 'Office, shop, bank branch, school, clinic or factory.' },
              ].map((opt) => (
                <label key={opt.key} className={`choice${segment === opt.key ? ' on' : ''}`}>
                  <input type="radio" name="segment" checked={segment === opt.key} onChange={() => chooseSegment(opt.key)} />
                  <strong>{opt.title}</strong>
                  <span>{opt.text}</span>
                </label>
              ))}
              <p className="modal-note">
                About 3 minutes. No sign-up needed: you&apos;ll see your results straight away. You don&apos;t need to know
                any watts or volts. Just tick what you use.
              </p>
            </fieldset>
          )}

          {step === 1 && (
            <>
              {catalogError && <p className="form-error" role="alert">{catalogError}</p>}
              {!catalog && !catalogError && <p className="muted" role="status">Loading the list…</p>}
              {catalog && (
                <>
                  <div className="presets">
                    <span className="muted">Quick start:</span>
                    {catalog.presets.map((p) => (
                      <button key={p.id} type="button" className="chip-btn" onClick={() => applyPreset(p)}>
                        {p.label}
                      </button>
                    ))}
                    {chosenAppliances > 0 && (
                      <button type="button" className="chip-btn chip-btn-quiet" onClick={() => setSelection({})}>
                        Clear all
                      </button>
                    )}
                  </div>
                  <p className="modal-note">
                    Tick what you use. We&apos;ve pre-selected the most common option for each, so if you&apos;re not sure,
                    just leave it. You can change any answer later.
                  </p>

                  <div className="tabs" role="tablist" aria-label="Categories">
                    {catalog.categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={category === c}
                        className={`tab${category === c ? ' on' : ''}`}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                        {chosenByCategory[c] ? <span className="tab-dot">{chosenByCategory[c]}</span> : null}
                      </button>
                    ))}
                  </div>

                  <ul className="ap-list">
                    {visibleAppliances.map((ap) => (
                      <ApplianceRow
                        key={ap.id}
                        appliance={ap}
                        selection={selection[ap.id]}
                        hourOptions={catalog.hourOptions}
                        onToggle={() => toggleAppliance(ap)}
                        onQty={(variantId, n) => setQty(ap, variantId, n)}
                        onHours={(key) => setHours(ap, key)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {step === 2 && catalog && (
            <div className="supply">
              <label className="field">
                <span>Your electricity company (DisCo)</span>
                <select value={disco} onChange={(e) => setDisco(e.target.value)}>
                  {catalog.discos.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <small>It&apos;s the name on your prepaid meter or bill.</small>
              </label>

              <fieldset className="choice-grid choice-grid-tight">
                <legend className="field-legend">On a normal day, how much light (NEPA) do you get?</legend>
                {catalog.supplyOptions.map((opt) => {
                  const value = opt.band ?? 'none';
                  return (
                    <label key={value} className={`choice choice-small${supply === value ? ' on' : ''}`}>
                      <input type="radio" name="supply" checked={supply === value} onChange={() => setSupply(value)} />
                      <strong>{opt.title}</strong>
                      <span>{opt.detail}{opt.band ? ` · Band ${opt.band}` : ''}</span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <footer className="modal-foot">
          <div className="foot-left">
            {step > 0 && (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setStep(step - 1)} disabled={submitting}>
                Back
              </button>
            )}
            {step === 1 && chosenAppliances > 0 && (
              <span className="muted">
                {chosenUnits} item{chosenUnits === 1 ? '' : 's'} · {chosenAppliances} type{chosenAppliances === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {step < 2 ? (
            <button type="button" className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={submitting || !catalog} onClick={submit}>
              {submitting ? 'Working it out…' : 'Show my results'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function previousFocused(el) {
  if (el && typeof el.focus === 'function') el.focus();
}
