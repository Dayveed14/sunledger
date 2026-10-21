import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// `roles` (optional) limits a page to certain account types; others are sent back to their dashboard.
export default function RequireAuth({ children, roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-loading" role="status">Loading…</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ next: location.pathname + location.search }} />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

// Inside the signed-in layout: shows the page only to the listed account types, otherwise sends people to their overview.
export function Only({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to="/app" replace />;
}
