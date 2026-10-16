import { api } from '../api.js';
import { clearPending, loadPending } from './pending.js';

// Only allow in-app paths, so a crafted ?next= link can't send people to another site.
export const safeNext = (next) => (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null);

// After sign-up or login: if they came from the free assessment, save it to their account
// and open it. Otherwise go where they were headed, or the dashboard.
export async function finishAuth(user, navigate, next) {
  const pending = loadPending();
  const isCustomer = user.role === 'individual' || user.role === 'business';

  if (pending?.input && isCustomer) {
    try {
      const saved = await api.saveAssessment(pending.input);
      clearPending();
      navigate(`/app/assessments/${saved.id}`, { replace: true });
      return;
    } catch {
      /* keep the pending result and fall through to the dashboard */
    }
  }
  navigate(safeNext(next) ?? '/app', { replace: true });
}
