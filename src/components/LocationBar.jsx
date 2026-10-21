import { useState } from 'react';
import { useShop } from '../auth/ShopContext.jsx';
import AddressFields, { emptyAddress, useGeo } from './AddressFields.jsx';
import Dialog from './Dialog.jsx';

// The two shopping tabs: "Current location" (the address on the account) and "Order for a different location",
// which opens a form for an address and then shows only vendors in that address's state.
export default function LocationBar() {
  const shop = useShop();
  const geo = useGeo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(shop.mode === 'other' && shop.dest ? { line: shop.dest.line ?? '', state: shop.dest.state, areaId: shop.dest.areaId } : emptyAddress);
  const [error, setError] = useState(null);

  const where = shop.dest
    ? `${geo?.states.find((s) => s.id === shop.dest.state)?.areas.find((a) => a.id === shop.dest.areaId)?.name ?? ''}, ${geo?.states.find((s) => s.id === shop.dest.state)?.name ?? ''}`
    : null;

  const apply = (e) => {
    e.preventDefault();
    if (draft.line.trim().length < 6) return setError({ 'address.line': 'Enter the street address' });
    if (!draft.state) return setError({ 'address.state': 'Choose Lagos or Abuja' });
    if (!draft.areaId) return setError({ 'address.areaId': 'Choose an area' });
    shop.setOther({ line: draft.line.trim(), state: draft.state, areaId: draft.areaId });
    setError(null);
    setOpen(false);
  };

  return (
    <div className="location-bar">
      <div className="tabs" role="tablist" aria-label="Where should we deliver?">
        <button type="button" role="tab" className={`tab${shop.mode === 'current' ? ' on' : ''}`} aria-selected={shop.mode === 'current'} disabled={!shop.hasSaved}
          onClick={shop.useCurrent} title={shop.hasSaved ? '' : 'Log in to use your saved address'}>
          Current location
        </button>
        <button type="button" role="tab" className={`tab${shop.mode === 'other' ? ' on' : ''}`} aria-selected={shop.mode === 'other'} onClick={() => setOpen(true)}>
          Order for a different location
        </button>
      </div>
      <p className="location-now">
        {where ? <>Showing vendors in <strong>{geo?.states.find((s) => s.id === shop.dest.state)?.name}</strong> · delivering to <strong>{where}</strong></> : 'Choose where we should deliver to see vendors near you.'}
        {where && shop.mode === 'other' && <button type="button" className="link-btn" onClick={() => setOpen(true)}>Change</button>}
      </p>

      {open && (
        <Dialog title="Where should we deliver?" eyebrow="Different location" onClose={() => setOpen(false)}
          footer={<><button type="button" className="btn btn-quiet" onClick={() => setOpen(false)}>Cancel</button><button type="submit" form="loc-form" className="btn btn-primary">Show vendors here</button></>}>
          <form id="loc-form" onSubmit={apply} noValidate>
            <p className="muted">We only deliver inside Lagos and Abuja, and only from vendors in the same state as the address.</p>
            <AddressFields value={draft} onChange={setDraft} errors={error ?? {}} legend="Delivery address" />
          </form>
        </Dialog>
      )}
    </div>
  );
}
