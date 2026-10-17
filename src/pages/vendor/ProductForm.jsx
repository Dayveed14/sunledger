import { useState } from 'react';
import { ApiError, api } from '../../api.js';
import Dialog from '../../components/Dialog.jsx';
import { CATEGORY_LABEL } from '../../lib/format.js';
import { fieldErrorsOf, groupDigits, parseNumber } from '../../lib/forms.js';

const RATING = {
  panel: { label: 'Power per panel (watts)', hint: 'For example 550', placeholder: '550', inputMode: 'numeric' },
  inverter: { label: 'Inverter size (kVA)', hint: 'For example 1.5 or 5', placeholder: '1.5', inputMode: 'decimal' },
  battery: { label: 'Usable storage per unit (kWh)', hint: 'For example 2.4 for a 12V 200Ah battery', placeholder: '2.4', inputMode: 'decimal' },
};

const blank = { category: 'panel', name: '', brand: '', rating: '', systemVoltage: '12', batteryType: 'lithium', price: '', warrantyYears: '', description: '', inStock: true, listed: true };

const fromProduct = (p) => ({
  category: p.category,
  name: p.name,
  brand: p.brand ?? '',
  rating: String(p.rating),
  systemVoltage: String(p.systemVoltage ?? 12),
  batteryType: p.batteryType ?? 'lithium',
  price: groupDigits(p.price),
  warrantyYears: p.warrantyYears == null ? '' : String(p.warrantyYears),
  description: p.description ?? '',
  inStock: p.inStock,
  listed: p.status === 'active',
});

export default function ProductForm({ product, onClose, onSaved }) {
  const editing = Boolean(product);
  const [f, setF] = useState(product ? fromProduct(product) : blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const r = RATING[f.category];
  const needsVoltage = f.category !== 'panel';

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      category: f.category,
      name: f.name.trim(),
      brand: f.brand.trim() || null,
      rating: parseNumber(f.rating),
      systemVoltage: needsVoltage ? Number(f.systemVoltage) : null,
      batteryType: f.category === 'battery' ? f.batteryType : null,
      price: parseNumber(f.price),
      warrantyYears: parseNumber(f.warrantyYears) ?? null,
      description: f.description.trim() || null,
      inStock: f.inStock,
      status: f.listed ? 'active' : 'hidden',
    };
    if (Number.isNaN(body.rating) || Number.isNaN(body.price)) {
      setErrors({ ...(Number.isNaN(body.rating) ? { rating: 'Enter a number.' } : {}), ...(Number.isNaN(body.price) ? { price: 'Enter an amount in naira.' } : {}) });
      return;
    }
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const res = editing ? await api.vendorUpdateProduct(product.id, body) : await api.vendorCreateProduct(body);
      onSaved(res.product);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(fieldErrorsOf(err));
      else setFormError(err.message);
      setSaving(false);
    }
  };

  const err = (k) => errors[k] && <small className="err">{errors[k]}</small>;

  return (
    <Dialog
      title={editing ? 'Edit product' : 'Add a product'}
      eyebrow="Your catalogue"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Type</span>
          <select value={f.category} onChange={set('category')} disabled={editing}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {editing && <small>A product&apos;s type can&apos;t be changed. Add a new product instead.</small>}
          {err('category')}
        </label>

        <div className="field-row">
          <label className="field">
            <span>Product name</span>
            <input type="text" value={f.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} placeholder={f.category === 'panel' ? 'Mono PERC 550W' : f.category === 'inverter' ? 'Hybrid inverter 1.5kVA' : 'Lithium battery 12V 200Ah'} />
            {err('name')}
          </label>
          <label className="field">
            <span>Brand <em>(optional)</em></span>
            <input type="text" value={f.brand} onChange={set('brand')} />
            {err('brand')}
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>{r.label}</span>
            <input type="text" inputMode={r.inputMode} value={f.rating} onChange={set('rating')} placeholder={r.placeholder} aria-invalid={Boolean(errors.rating)} />
            {errors.rating ? err('rating') : <small>{r.hint}</small>}
          </label>
          {needsVoltage && (
            <label className="field">
              <span>System voltage</span>
              <select value={f.systemVoltage} onChange={set('systemVoltage')}>
                <option value="12">12V</option>
                <option value="24">24V</option>
                <option value="48">48V</option>
              </select>
              {errors.systemVoltage ? err('systemVoltage') : <small>{f.category === 'battery' ? 'The voltage of one battery. Use 48V for 51.2V lithium.' : 'The battery voltage this inverter runs on.'}</small>}
            </label>
          )}
          {f.category === 'battery' && (
            <label className="field">
              <span>Battery type</span>
              <select value={f.batteryType} onChange={set('batteryType')}>
                <option value="lithium">Lithium</option>
                <option value="gel">Gel</option>
                <option value="tubular">Tubular</option>
                <option value="agm">AGM</option>
              </select>
            </label>
          )}
        </div>

        <div className="field-row">
          <label className="field">
            <span>Your price per unit (₦)</span>
            <input type="text" inputMode="numeric" value={f.price} onChange={(e) => setF((x) => ({ ...x, price: groupDigits(e.target.value) }))} aria-invalid={Boolean(errors.price)} placeholder="95,000" />
            {err('price')}
          </label>
          <label className="field">
            <span>Warranty (years) <em>(optional)</em></span>
            <input type="text" inputMode="numeric" value={f.warrantyYears} onChange={set('warrantyYears')} placeholder="5" />
            {err('warrantyYears')}
          </label>
        </div>

        <label className="field">
          <span>Notes <em>(optional)</em></span>
          <textarea rows={3} value={f.description} onChange={set('description')} maxLength={500} />
          {err('description')}
        </label>

        <div className="check-row">
          <label><input type="checkbox" checked={f.inStock} onChange={set('inStock')} /> In stock</label>
          <label><input type="checkbox" checked={f.listed} onChange={set('listed')} /> Show to customers</label>
        </div>

        {formError && <p className="form-error" role="alert">{formError}</p>}
      </form>
    </Dialog>
  );
}
