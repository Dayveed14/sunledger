import { useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../../api.js';
import { fieldErrorsOf } from '../../lib/forms.js';

// Percent settings are stored as fractions (0.06) and typed as percent (6).
const toField = (s, v) => String(s.unit === 'pct' ? Math.round(v * 10000) / 100 : v);
const fromField = (s, text) => {
  const n = Number(String(text).replace(/[,\s]/g, ''));
  if (text.trim() === '' || !Number.isFinite(n)) return NaN;
  return s.unit === 'pct' ? n / 100 : n;
};
const unitText = (s) => (s.unit === 'pct' ? `% ${s.note}` : s.note);

export default function AdminPricing() {
  const [settings, setSettings] = useState(null);
  const [fields, setFields] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const adopt = (list) => {
    setSettings(list);
    setFields(Object.fromEntries(list.map((s) => [s.key, toField(s, s.value)])));
  };
  useEffect(() => {
    api.adminSettings().then((r) => adopt(r.settings)).catch((e) => setFormError(e.message));
  }, []);

  const groups = useMemo(() => {
    const out = new Map();
    for (const s of settings ?? []) out.set(s.group, [...(out.get(s.group) ?? []), s]);
    return [...out];
  }, [settings]);

  const changed = (settings ?? []).filter((s) => fromField(s, fields[s.key] ?? '') !== s.value);

  const send = async (changes) => {
    setSaving(true);
    setErrors({});
    setFormError(null);
    setSaved(false);
    try {
      const r = await api.adminSaveSettings(changes);
      adopt(r.settings);
      setSaved(true);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'VALIDATION_ERROR') {
        setErrors(fieldErrorsOf(e));
        setFormError(e.message);
      } else setFormError(e.message);
    }
    setSaving(false);
  };

  const save = (e) => {
    e.preventDefault();
    const changes = {};
    for (const s of changed) {
      const v = fromField(s, fields[s.key]);
      if (Number.isNaN(v)) {
        setErrors({ [s.key]: 'Enter a number.' });
        return;
      }
      changes[s.key] = v;
    }
    send(changes);
  };

  if (!settings && !formError) return <p className="muted" role="status">Loading…</p>;

  return (
    <form onSubmit={save} noValidate>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Pricing &amp; rules</h2>
          <p className="muted">
            These drive the free assessment and the Energy as a service pricing vendors and customers see. Changes apply to new assessments and offers straight away; assessments customers already saved keep the numbers they were made with.
          </p>
        </div>
      </div>

      {groups.map(([group, rows]) => (
        <fieldset key={group} className="settings-group">
          <legend className="field-legend">{group}</legend>
          {rows.map((s) => (
            <div key={s.key} className="setting-row">
              <label className="field" htmlFor={`s-${s.key}`}>
                <span>{s.label} {s.custom && <em className="badge badge-warn">Changed</em>}</span>
                <div className="setting-input">
                  <input id={`s-${s.key}`} type="text" inputMode="decimal" value={fields[s.key] ?? ''} onChange={(e) => setFields((f) => ({ ...f, [s.key]: e.target.value }))} aria-invalid={Boolean(errors[s.key])} />
                  <small className="muted">{unitText(s)}</small>
                </div>
                {errors[s.key] && <small className="err">{errors[s.key]}</small>}
              </label>
              {s.custom && (
                <button type="button" className="link-btn" disabled={saving} onClick={() => send({ [s.key]: null })}>
                  Reset to {toField(s, s.default)}{s.unit === 'pct' ? '%' : ''}
                </button>
              )}
            </div>
          ))}
        </fieldset>
      ))}

      {formError && <p className="form-error" role="alert">{formError}</p>}
      {saved && <p className="form-ok" role="status">Saved. New assessments and offers use these numbers now.</p>}
      <div className="sticky-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || changed.length === 0}>
          {saving ? 'Saving…' : changed.length ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'No changes'}
        </button>
      </div>
    </form>
  );
}
