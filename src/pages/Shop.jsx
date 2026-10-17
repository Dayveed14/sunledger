import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAssessment } from '../components/AssessmentContext.jsx';
import { CATEGORY_LABEL, PLAN_LABEL, naira, sizeText } from '../lib/format.js';

const TABS = [
  { key: 'all', label: 'All parts' },
  { key: 'panel', label: 'Solar panels' },
  { key: 'inverter', label: 'Inverters' },
  { key: 'battery', label: 'Batteries' },
  { key: 'deals', label: 'Combos & deals' },
];

const dealFrom = (d) => {
  const prices = [];
  if (d.buyPrice != null) prices.push(`${naira(d.buyPrice)} to buy`);
  if (d.plans.some((p) => p !== 'buy')) prices.push(`also ${d.plans.filter((p) => p !== 'buy').map((p) => PLAN_LABEL[p].toLowerCase()).join(', ')}`);
  return prices.join(' · ');
};

export default function Shop() {
  const { open } = useAssessment();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(null);
  const [deals, setDeals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const t = setTimeout(() => {
      const req = tab === 'deals'
        ? api.shopDeals().then((r) => !cancelled && setDeals(r.deals))
        : api.shopProducts({ category: tab === 'all' ? '' : tab, q: search.trim() }).then((r) => !cancelled && setProducts(r.products));
      req.catch((e) => !cancelled && setError(e.message));
    }, search ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tab, search]);

  const list = tab === 'deals' ? deals : products;

  return (
    <div className="wrap shop">
      <header className="results-head">
        <div>
          <p className="eyebrow">Shop</p>
          <h1>Solar parts and packages from vendors</h1>
          <p className="muted shop-lede">Browse what vendors sell. To buy, run your free assessment and we&apos;ll show only what fits your needs, with a way to ask the vendor.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => open()}>Run free assessment</button>
      </header>

      <div className="shop-bar">
        <div className="tabs" role="tablist" aria-label="Shop sections">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'deals' && (
          <label className="shop-search">
            <span className="sr-only">Search the shop</span>
            <input type="search" placeholder="Search name, brand or vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        )}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!list && !error && <p className="muted" role="status">Loading…</p>}
      {list?.length === 0 && (
        <div className="empty-card">
          <h3>Nothing here yet</h3>
          <p>{search ? 'No products match that search.' : 'Vendors are still adding their products. Check back soon.'}</p>
        </div>
      )}

      {tab !== 'deals' && products?.length > 0 && (
        <ul className="shop-grid">
          {products.map((p) => (
            <li key={p.id} className="shop-card">
              <p className="shop-cat">{CATEGORY_LABEL[p.category]}</p>
              <h3>{p.name}</h3>
              <p className="shop-meta">{[p.brand, sizeText(p)].filter(Boolean).join(' · ')}</p>
              <p className="shop-vendor">{p.vendor.name}{p.vendor.verified && <span className="badge badge-verified">Verified</span>}</p>
              <p className="shop-price">{naira(p.price)} <small>each</small></p>
              <p className="shop-foot">
                {p.inStock ? <span className="badge badge-active">In stock</span> : <span className="badge badge-warn">Out of stock</span>}
                {p.warrantyYears ? <span>{p.warrantyYears}-yr warranty</span> : null}
              </p>
            </li>
          ))}
        </ul>
      )}

      {tab === 'deals' && deals?.length > 0 && (
        <ul className="shop-grid">
          {deals.map((d) => (
            <li key={d.id} className="shop-card">
              <p className="shop-cat">Combo</p>
              <h3>{d.title}</h3>
              <p className="shop-meta">{d.specs.panelKwp} kWp · {d.specs.inverterKva} kVA · {d.specs.batteryKwh} kWh</p>
              <p className="shop-vendor">{d.vendor.name}{d.vendor.verified && <span className="badge badge-verified">Verified</span>}</p>
              <ul className="deal-items">{d.items.map((i) => <li key={i.productId}>{i.qty} × {i.name}</li>)}</ul>
              <p className="shop-price">{dealFrom(d)}</p>
              <p className="shop-foot">{d.installationIncluded && <span>Installation included</span>}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
