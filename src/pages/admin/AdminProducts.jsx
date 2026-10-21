import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { CATEGORY_LABEL, naira, sizeText } from '../../lib/format.js';
import ProductForm from '../vendor/ProductForm.jsx';

// The admin can fix or hide any vendor's product: price, picture, details, stock, visibility.
export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => api.adminProducts({ category, status, q }).then((r) => setProducts(r.products)).catch((e) => setError(e.message));
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [category, status, q]);

  const remove = async (id) => {
    try {
      await api.adminDeleteProduct(id);
      setConfirmId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Products</h2>
          <p className="muted">Every product vendors have listed. Edit anything a vendor can, or hide or remove a product. Each change is recorded in Activity.</p>
        </div>
      </div>

      <div className="filter-row">
        <input type="search" placeholder="Search name, brand or vendor" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Type">
          <option value="">All types</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Visibility">
          <option value="">Shown and hidden</option>
          <option value="active">Shown to customers</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!products && !error && <p className="muted" role="status">Loading…</p>}
      {products && products.length === 0 && <p className="muted">No products match.</p>}

      {products && products.length > 0 && (
        <ul className="row-list">
          {products.map((p) => (
            <li key={p.id} className="row-item">
              <div className="row-main">
                <strong>{p.name}</strong>
                <small>{[CATEGORY_LABEL[p.category], p.brand, sizeText(p)].filter(Boolean).join(' · ')}</small>
                <small>Vendor: {p.vendorName}</small>
              </div>
              <div className="row-price">{naira(p.price)}<small>per unit</small></div>
              <div className="row-tags">
                {!p.inStock && <span className="badge badge-warn">Out of stock</span>}
                {p.status === 'hidden' && <span className="badge">Hidden</span>}
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-primary btn-small" onClick={() => setEditing(p)}>Edit</button>
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
      )}

      {editing && (
        <ProductForm
          admin
          product={editing}
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
