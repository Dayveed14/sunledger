import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AssessmentModal from './components/AssessmentModal.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Results from './pages/Results.jsx';
import SavedAssessment from './pages/SavedAssessment.jsx';
import Signup from './pages/Signup.jsx';
import Verify from './pages/Verify.jsx';

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
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/app/assessments/:id"
            element={
              <RequireAuth>
                <SavedAssessment />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SiteFooter />
      <AssessmentModal />
    </>
  );
}
