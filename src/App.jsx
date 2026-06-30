import { Suspense, lazy, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ToastProvider } from './context/ToastContext';
import { loadSavedTheme } from './utils/themeGenerator';
import './styles/globals.css';
import SiteLoadingScreen from './components/storefront/SiteLoadingScreen';

const Home = lazy(() => import('./pages/storefront/Home').then((module) => ({ default: module.Home })));
const Buy = lazy(() => import('./pages/storefront/Buy'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const loadCatalogAdmin = () => import('./pages/admin/CatalogAdmin');
const CatalogAdmin = lazy(loadCatalogAdmin);
const CourseAccess = lazy(() => import('./pages/storefront/CourseAccess'));
const NewsletterUnsubscribe = lazy(() => import('./pages/storefront/NewsletterUnsubscribe'));

const ThankYou = lazy(() => import('./pages/storefront/ThankYou').then((module) => ({ default: module.ThankYou })));
const ErrorPage = lazy(() => import('./pages/storefront/ErrorPage').then((module) => ({ default: module.ErrorPage })));

// Apply any saved theme at startup
loadSavedTheme();

function RouteScrollController() {
  const location = useLocation();

  useLayoutEffect(() => {
    const shouldResetScroll =
      location.pathname.startsWith('/buy') ||
      location.pathname.startsWith('/offerings') ||

      location.pathname === '/sign-in' ||
      location.pathname === '/sign-up';

    if (!shouldResetScroll) {
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
      <SiteSettingsProvider>
        <ToastProvider>
          <TooltipProvider>
            <Router>
              <RouteScrollController />
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <Home />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/offerings/:sectionId"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <Buy />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/buy/:productId/:status"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <Buy />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/buy/:productId"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <Buy />
                        </Suspense>
                      }
                    />

                    <Route
                      path="/courses/access/:token"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <CourseAccess />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/sign-in"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <AuthPage mode="signin" />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/sign-up"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <AuthPage mode="signup" />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <CatalogAdmin />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/unsubscribe"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <NewsletterUnsubscribe />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/thank-you"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <ThankYou />
                        </Suspense>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <Suspense fallback={<SiteLoadingScreen />}>
                          <ErrorPage />
                        </Suspense>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </Router>
          </TooltipProvider>
        </ToastProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}

export default App;
