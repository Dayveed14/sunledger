import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../auth/ShopContext.jsx';
import { useAssessment } from '../components/AssessmentContext.jsx';
import LocationBar from '../components/LocationBar.jsx';
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
  if (d.plans.includes('lease')) prices.push('pay small small');
  const rest = d.plans.filter((p) => p !== 'buy' && p !== 'lease');
  if (rest.length) prices.push(`also ${rest.map((p) => PLAN_LABEL[p].toLowerCase()).join(', ')}`);
  return prices.join(' · ');
};

const Picture = ({ url, alt }) => (
  <div className="card-pic">{url ? <img src={`${import.meta.env.VITE_API_URL ?? ''}${url}`} alt={alt} loading="lazy" /> : <span aria-hidden="true">☀</span>}</div>
);

export default function Shop() {
  const { open } = useAssessment();
  const shop = useShop();
  const state = shop.dest?.state;
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(null);
  const [deals, setDeals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!state) { setProducts(null); setDeals(null); return undefined; }
    let cancelled = false;
    setError(null);
    const t = setTimeout(() => {
      const req = tab === 'deals'
        ? api.shopDeals({ state }).then((r) => !cancelled && setDeals(r.deals))
        : api.shopProducts({ state, category: tab === 'all' ? '' : tab, q: search.trim() }).then((r) => !cancelled && setProducts(r.products));
      req.catch((e) => !cancelled && setError(e.message));
    }, search ? 250 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [tab, search, state]);

  const list = tab === 'deals' ? deals : products;
  const here = shop.dest ? `state=${shop.dest.state}&areaId=${shop.dest.areaId}` : '';

  return (
    <div className="wrap shop">
      <header className="results-head">
        <div>
          <p className="eyebrow">Shop</p>
          <h1>Solar parts and packages from vendors</h1>
          <p className="muted shop-lede">Buy straight from vendors in your state. Delivery is priced by distance from the vendor to you.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => open()}>Run free assessment</button>
      </header>

      <LocationBar />

      {state && (
        <div className="shop-bar">
          <div className="tabs" role="tablist" aria-label="Shop sections">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
          {tab !== 'deals' && (
            <label className="shop-search">
              <span className="sr-only">Search the shop</span>
              <input type="search" placeholder="Search name, brand or vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          )}
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {state && !list && !error && <p className="muted" role="status">Loading…</p>}
      {list?.length === 0 && (
        <div className="empty-card">
          <h3>Nothing here yet</h3>
          <p>{search ? 'No products match that search.' : 'No vendors in this state have listed this yet. Check back soon.'}</p>
        </div>
      )}

      {tab !== 'deals' && products?.length > 0 && (
        <ul className="shop-grid">
          {products.map((p) => (
            <li key={p.id} className="shop-card">
              <Link to={`/shop/product/${p.id}?${here}`} className="card-link">
                <Picture url={p.imageUrl} alt={p.name} />
                <p className="shop-cat">{CATEGORY_LABEL[p.category]}</p>
                <h3>{p.name}</h3>
                <p className="shop-meta">{[p.brand, sizeText(p)].filter(Boolean).join(' · ')}</p>
                <p className="shop-vendor">{p.vendor.name}{p.vendor.verified && <span className="badge badge-verified">Verified</span>}{p.vendor.areaName && <small> · {p.vendor.areaName}</small>}</p>
                <p className="shop-price">{naira(p.price)} <small>each</small></p>
              </Link>
              <p className="shop-foot">
                {p.inStock ? <span className="badge badge-active">In stock</span> : <span className="badge badge-warn">Out of stock</span>}
                {p.warrantyYears ? <span>{p.warrantyYears}-yr warranty</span> : null}
              </p>
              <button type="button" className="btn btn-primary btn-small" disabled={!p.inStock}
                onClick={() => shop.add({ kind: 'product', id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, vendorName: p.vendor.name, state })}>
                Add to cart
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === 'deals' && deals?.length > 0 && (
        <ul className="shop-grid">
          {deals.map((d) => (
            <li key={d.id} className="shop-card">
              <Link to={`/shop/deal/${d.id}?${here}`} className="card-link">
                <Picture url={d.imageUrl} alt={d.title} />
                <p className="shop-cat">Combo</p>
                <h3>{d.title}</h3>
                <p className="shop-meta">{d.specs.panelKwp} kWp · {d.specs.inverterKva} kVA · {d.specs.batteryKwh} kWh</p>
                <p className="shop-vendor">{d.vendor.name}{d.vendor.verified && <span className="badge badge-verified">Verified</span>}{d.vendor.areaName && <small> · {d.vendor.areaName}</small>}</p>
                <p className="shop-price">{dealFrom(d)}</p>
              </Link>
              <p className="shop-foot">{d.installationIncluded && <span>Installation included</span>}</p>
              {d.buyPrice != null && (
                <button type="button" className="btn btn-primary btn-small"
                  onClick={() => shop.add({ kind: 'deal', id: d.id, name: d.title, price: d.buyPrice, imageUrl: d.imageUrl, vendorName: d.vendor.name, state })}>
                  Add to cart
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
