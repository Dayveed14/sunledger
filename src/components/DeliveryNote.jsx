import { naira } from '../lib/format.js';

const when = (iso) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });

// "Vendor is 21 km away · delivery ₦3,500 · arrives by Tue 14:30"
export default function DeliveryNote({ delivery, vendorName }) {
  if (!delivery) return <p className="muted">Choose a delivery location in the shop to see the distance, delivery fee and arrival time.</p>;
  if (!delivery.available) return <p className="form-error" role="status">{delivery.reason}</p>;
  return (
    <ul className="delivery-note">
      <li><strong>{vendorName} is {delivery.distanceKm} km away</strong> from {delivery.toArea}</li>
      <li>Delivery fee <strong>{naira(delivery.fee)}</strong>, worked out from that distance</li>
      <li>Expected by <strong>{when(delivery.promisedBy)}</strong>{delivery.afterHours ? ' (the next working day)' : ''}</li>
    </ul>
  );
}
