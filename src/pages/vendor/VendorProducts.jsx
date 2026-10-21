import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { CATEGORY_PLURAL, naira, sizeText } from '../../lib/format.js';
import ProductForm from './ProductForm.jsx';

export default function VendorProducts() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [confirmId, setConfirmId] = useState(null);

  const load = () => api.vendorProducts().then((r) => setProducts(r.products)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    try {
      await api.vendorDeleteProduct(id);
      setConfirmId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!products && !error) return <p className="muted" role="status">Loading…</p>;

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Products</h2>
          <p className="muted">Panels, inverters and batteries you sell. Combos and the customer build-your-own option are made from these.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>Add product</button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {products?.length === 0 && (
        <div className="empty-card">
          <h3>No products yet</h3>
          <p>Add the first panel, inverter or battery you sell. You&apos;ll need at least one of each to build a deal.</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>Add your first product</button>
        </div>
      )}

      {['panel', 'inverter', 'battery'].map((cat) => {
        const rows = (products ?? []).filter((p) => p.category === cat);
        if (rows.length === 0) return null;
        return (
          <section key={cat} className="list-section" aria-label={CATEGORY_PLURAL[cat]}>
            <h3>{CATEGORY_PLURAL[cat]}</h3>
            <ul className="row-list">
              {rows.map((p) => (
                <li key={p.id} className="row-item">
                  <div className="row-main">
                    <button type="button" className="link-btn row-title" onClick={() => setEditing(p)}><strong>{p.name}</strong></button>
                    <small>{[p.brand, sizeText(p), p.warrantyYears ? `${p.warrantyYears}-yr warranty` : null].filter(Boolean).join(' · ')}</small>
                  </div>
                  <div className="row-price">{naira(p.price)}<small>per unit</small></div>
                  <div className="row-tags">
                    {!p.inStock && <span className="badge badge-warn">Out of stock</span>}
                    {p.status === 'hidden' && <span className="badge">Hidden</span>}
                  </div>
                  <div className="row-actions">
                    <button type="button" className="btn btn-primary btn-small" onClick={() => setEditing(p)}>Edit price &amp; details</button>
                    {confirmId === p.id ? (
                      <>
                        <button type="button" className="btn btn-danger btn-small" onClick={() => remove(p.id)}>Confirm remove</button>
                        <button type="button" className="btn btn-quiet btn-small" onClick={() => setConfirmId(null)}>Keep</button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-quiet btn-small" onClick={() => setConfirmId(p.id)}>Remove</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
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
