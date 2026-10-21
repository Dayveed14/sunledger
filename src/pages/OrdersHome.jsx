import { useAuth } from '../auth/AuthContext.jsx';
import AdminShell from './admin/AdminShell.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import MyOrders from './MyOrders.jsx';
import VendorOrders from './vendor/VendorOrders.jsx';
import VendorShell from './vendor/VendorShell.jsx';

// "Orders" in the sidebar shows the right view for the type of account.
export default function OrdersHome() {
  const { user } = useAuth();
  if (user.role === 'vendor') return <VendorShell><VendorOrders /></VendorShell>;
  if (user.role === 'admin') return <AdminShell><AdminOrders /></AdminShell>;
  return <MyOrders />;
}
