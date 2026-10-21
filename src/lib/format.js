export const naira = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return '₦0';
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
};

// ₦1.4m / ₦65m / ₦2.1bn for big numbers, so cards stay readable.
export function nairaCompact(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}bn`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}m`;
  return `${sign}${naira(abs)}`;
}

export function monthsToText(months) {
  if (months == null || !Number.isInteger(months) || months < 0) {
    return null;
  }
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} yr${years === 1 ? '' : 's'}`;
  return rest ? `${y} ${rest} mo` : y;
}

export const kwh = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString('en-NG');

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export const PLAN_LABEL = { buy: 'Buy', lease: 'Lease to own', rent: 'Rent', eaas: 'Energy as a service' };
export const CATEGORY_LABEL = { panel: 'Solar panel', inverter: 'Inverter', battery: 'Battery', controller: 'Charge Controller', portablePower: 'Portable Power station' };
export const CATEGORY_PLURAL = { panel: 'Solar panels', inverter: 'Inverters', battery: 'Batteries', controller: 'Charge Controllers', portablePower: 'Portable Power stations' };

// "550W", "1.5 kVA · 12V", "2.4 kWh · 12V · lithium" — one place so every screen words sizes the same way.
export function sizeText(p) {
  if (p.category === 'panel') return `${p.rating}W`;
  if (p.category === 'inverter') return `${p.rating} kVA${p.systemVoltage ? ` · ${p.systemVoltage}V` : ''}`;
  if (p.category === 'controller') return `${p.rating} A${p.systemVoltage ? ` · ${p.systemVoltage}V` : ''}`;
  if (p.category === 'portablePower') return `${p.rating} kWh${p.systemVoltage ? ` · ${p.systemVoltage}V` : ''}`;
  const type = p.batteryType ? ` · ${p.batteryType}` : '';
  return `${p.rating} kWh${p.systemVoltage ? ` · ${p.systemVoltage}V` : ''}${type}`;
}
