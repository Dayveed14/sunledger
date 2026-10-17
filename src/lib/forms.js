// Form fields hold strings; the API wants numbers. "1,200,000" and " 550 " both parse.
export function parseNumber(value) {
  if (value === '' || value == null) return undefined;
  const n = Number(String(value).replace(/[,\s₦]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

// Shows a number with thousands separators while typing, e.g. 1200000 -> "1,200,000".
export function groupDigits(value) {
  const digits = String(value).replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('en-NG') : '';
}

export const fieldErrorsOf = (err) => err?.details?.fields ?? {};
