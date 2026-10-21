import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AssessmentModal from './components/AssessmentModal.jsx';
import AppLayout from './components/AppLayout.jsx';
import AddAccount from './pages/AddAccount.jsx';
import Profile from './pages/Profile.jsx';
import RequireAuth, { Only } from './components/RequireAuth.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import AdminActivity from './pages/admin/AdminActivity.jsx';
import AdminPricing from './pages/admin/AdminPricing.jsx';
import AdminShell from './pages/admin/AdminShell.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AppHome from './pages/AppHome.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Offers from './pages/Offers.jsx';
import Results from './pages/Results.jsx';
import SavedAssessment from './pages/SavedAssessment.jsx';
import Shop from './pages/Shop.jsx';
import Cart from './pages/Cart.jsx';
import CheckoutReturn from './pages/CheckoutReturn.jsx';
import Dispatch from './pages/Dispatch.jsx';
import ItemPage from './pages/ItemPage.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import OrdersHome from './pages/OrdersHome.jsx';
import Signup from './pages/Signup.jsx';
import Verify from './pages/Verify.jsx';
import VendorDeals from './pages/vendor/VendorDeals.jsx';
import VendorProducts from './pages/vendor/VendorProducts.jsx';
import VendorRequests from './pages/vendor/VendorRequests.jsx';
import VendorShell from './pages/vendor/VendorShell.jsx';

// Jump to #sections on the home page; otherwise start every page at the top.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <div className="noise" aria-hidden="true" />
      <ScrollManager />
      <SiteHeader />
      <main id="top">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ItemPage kind="product" />} />
          <Route path="/shop/deal/:id" element={<ItemPage kind="deal" />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/return" element={<RequireAuth><CheckoutReturn /></RequireAuth>} />
          <Route path="/checkout/mock" element={<RequireAuth><CheckoutReturn mock /></RequireAuth>} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/vendor/fee/return" element={<RequireAuth><CheckoutReturn kind="fee" /></RequireAuth>} />
          <Route path="/vendor/fee/mock" element={<RequireAuth><CheckoutReturn kind="fee" mock /></RequireAuth>} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/app" element={<AppHome />} />
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/orders" element={<OrdersHome />} />
            <Route path="/app/orders/:ref" element={<Only roles={['individual', 'business']}><OrderDetail /></Only>} />
            <Route path="/app/add-account" element={<AddAccount />} />
            <Route path="/app/assessments/:id" element={<Only roles={['individual', 'business']}><SavedAssessment /></Only>} />
            <Route path="/app/assessments/:id/offers" element={<Only roles={['individual', 'business']}><Offers /></Only>} />
            <Route path="/app/products" element={<Only roles={['vendor']}><VendorShell><VendorProducts /></VendorShell></Only>} />
            <Route path="/app/deals" element={<Only roles={['vendor']}><VendorShell><VendorDeals /></VendorShell></Only>} />
            <Route path="/app/requests" element={<Only roles={['vendor']}><VendorShell><VendorRequests /></VendorShell></Only>} />
            <Route path="/app/pricing" element={<Only roles={['admin']}><AdminShell><AdminPricing /></AdminShell></Only>} />
            <Route path="/app/users" element={<Only roles={['admin']}><AdminShell><AdminUsers /></AdminShell></Only>} />
            <Route path="/app/activity" element={<Only roles={['admin']}><AdminShell><AdminActivity /></AdminShell></Only>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SiteFooter />
      <AssessmentModal />
    </>
  );
}
