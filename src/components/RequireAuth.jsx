import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-loading" role="status">Loading…</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ next: location.pathname + location.search }} />;
  }
  return children;
}
