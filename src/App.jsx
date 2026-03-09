import { useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './pages/storefront/Home';
import { ThankYou } from './pages/storefront/ThankYou';
import Buy from './pages/storefront/Buy';
import AuthPage from './pages/auth/AuthPage';
import CatalogAdmin from './pages/admin/CatalogAdmin';
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css';

function RouteScrollController() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!location.pathname.startsWith('/buy')) {
      return;
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetToTop();
    const rafId = requestAnimationFrame(resetToTop);
    const timeoutId = setTimeout(resetToTop, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteScrollController />
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/buy" element={<Buy />} />
              <Route path="/buy/:productId" element={<Buy />} />
              <Route path="/buy/:productId/:status" element={<Buy />} />
              <Route path="/sign-in" element={<AuthPage mode="signin" />} />
              <Route path="/sign-up" element={<AuthPage mode="signup" />} />
              <Route path="/admin" element={<CatalogAdmin />} />
              <Route path="/thank-you" element={<ThankYou />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
