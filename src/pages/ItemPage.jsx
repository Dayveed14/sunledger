import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../auth/ShopContext.jsx';
import DeliveryNote from '../components/DeliveryNote.jsx';
import Qty from '../components/Qty.jsx';
import { CATEGORY_LABEL, naira, sizeText } from '../lib/format.js';

// One page for a product or a deal: picture, details, the vendor, how far away they are and what delivery costs.
export default function ItemPage({ kind }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const shop = useShop();
  const dest = shop.dest ?? (params.get('state') && params.get('areaId') ? { state: params.get('state'), areaId: params.get('areaId') } : null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    const d = dest ? { state: dest.state, areaId: dest.areaId } : null;
    (kind === 'product' ? api.shopProduct(id, d) : api.shopDeal(id, d))
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, kind, dest?.state, dest?.areaId]);

  if (error) return <div className="wrap"><p className="form-error" role="alert">{error}</p><Link to="/shop">Back to the shop</Link></div>;
  if (!data) return <div className="wrap"><p className="muted" role="status">Loading…</p></div>;

  const item = kind === 'product' ? data.product : data.deal;
  const price = kind === 'product' ? item.price : item.buyPrice;
  const name = kind === 'product' ? item.name : item.title;
  const sellable = kind === 'product' ? item.inStock : item.buyPrice != null;
  const sameState = data.delivery?.available;

  return (
    <div className="wrap item-page">
      <p><Link to="/shop">← Back to the shop</Link></p>
      <div className="item-grid">
        <div className="item-pic">
          {item.imageUrl ? <img src={`${import.meta.env.VITE_API_URL ?? ''}${item.imageUrl}`} alt={name} /> : <span aria-hidden="true">☀</span>}
        </div>

        <div className="item-info">
          <p className="eyebrow">{kind === 'product' ? CATEGORY_LABEL[item.category] : 'Combo'}</p>
          <h1>{name}</h1>
          {kind === 'product' && <p className="shop-meta">{[item.brand, sizeText(item)].filter(Boolean).join(' · ')}</p>}
          {kind === 'deal' && (
            <>
              <p className="shop-meta">{item.specs.panelKwp} kWp · {item.specs.inverterKva} kVA · {item.specs.batteryKwh} kWh{item.installationIncluded ? ' · installation included' : ''}</p>
              <ul className="deal-items">{item.items.map((i) => <li key={i.productId}>{i.qty} × {i.name}</li>)}</ul>
            </>
          )}
          {item.description && <p>{item.description}</p>}
          {item.warrantyYears ? <p className="muted">{item.warrantyYears}-year warranty</p> : null}

          <section className="vendor-card" aria-label="About the vendor">
            <h2>{item.vendor.name} {item.vendor.verified && <span className="badge badge-verified">Verified</span>}</h2>
            <p className="muted">Based in {item.vendor.areaName ? `${item.vendor.areaName}, ` : ''}{item.vendor.stateName}</p>
            <DeliveryNote delivery={data.delivery} vendorName={item.vendor.name} />
          </section>

          {price != null && <p className="item-price">{naira(price)} {kind === 'product' && <small>each</small>}</p>}

          {kind === 'deal' && item.lease && (
            <section className="lease-card" aria-label="Pay small small">
              <h2>Pay small small</h2>
              <p className="muted">Pay a deposit, spread the rest, own it at the end.</p>
              <table className="lease-preview">
                <thead><tr><th>Plan</th><th>Deposit</th><th>Monthly</th></tr></thead>
                <tbody>{item.lease.map((o) => <tr key={o.months}><td>{o.months} months</td><td>{naira(o.deposit)}</td><td>{naira(o.monthly)}</td></tr>)}</tbody>
              </table>
              <p className="muted">Lease plans start from your free assessment so the vendor can confirm the fit. <Link to="/shop">Run one</Link> to ask for this plan.</p>
            </section>
          )}

          {sellable ? (
            <div className="buy-row">
              {kind === 'product' && <Qty value={qty} onChange={setQty} />}
              <button type="button" className="btn btn-primary" disabled={data.delivery && !sameState}
                onClick={() => { shop.add({ kind, id: item.id, name, price, imageUrl: item.imageUrl, vendorName: item.vendor.name, state: item.vendor.state }, kind === 'product' ? qty : 1); setAdded(true); }}>
                Add to cart
              </button>
              {added && <Link to="/cart" className="btn btn-ghost">View cart</Link>}
            </div>
          ) : <p className="badge badge-warn">{kind === 'product' ? 'Out of stock' : 'Not sold outright'}</p>}
          {data.delivery && !sameState && <p className="muted">Switch your shopping location to {item.vendor.stateName} to buy from this vendor.</p>}
        </div>
      </div>
    </div>
  );
}
