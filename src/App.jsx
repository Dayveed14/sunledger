import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AssessmentModal from './components/AssessmentModal.jsx';
import RequireAuth from './components/RequireAuth.jsx';
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
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppHome />
              </RequireAuth>
            }
          />
          <Route
            path="/app/assessments/:id"
            element={
              <RequireAuth roles={['individual', 'business']}>
                <SavedAssessment />
              </RequireAuth>
            }
          />
          <Route
            path="/app/assessments/:id/offers"
            element={
              <RequireAuth roles={['individual', 'business']}>
                <Offers />
              </RequireAuth>
            }
          />
          <Route path="/shop" element={<Shop />} />
          <Route
            path="/app/products"
            element={<RequireAuth roles={['vendor']}><VendorShell><VendorProducts /></VendorShell></RequireAuth>}
          />
          <Route
            path="/app/deals"
            element={<RequireAuth roles={['vendor']}><VendorShell><VendorDeals /></VendorShell></RequireAuth>}
          />
          <Route
            path="/app/requests"
            element={<RequireAuth roles={['vendor']}><VendorShell><VendorRequests /></VendorShell></RequireAuth>}
          />
          <Route path="/app/pricing" element={<RequireAuth roles={['admin']}><AdminShell><AdminPricing /></AdminShell></RequireAuth>} />
          <Route path="/app/users" element={<RequireAuth roles={['admin']}><AdminShell><AdminUsers /></AdminShell></RequireAuth>} />
          <Route path="/app/activity" element={<RequireAuth roles={['admin']}><AdminShell><AdminActivity /></AdminShell></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SiteFooter />
      <AssessmentModal />
    </>
  );
}
