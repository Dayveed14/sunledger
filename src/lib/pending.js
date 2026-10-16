// The free assessment needs no account. We keep the answers and result in this browser tab
// so they survive a refresh, and so signing up can attach them to the new account.
const KEY = 'sunledger:pending-assessment';

export function savePending(value) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable: results still show for this visit */
  }
}

export function loadPending() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPending() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
