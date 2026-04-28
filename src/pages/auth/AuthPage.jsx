import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AuthForm from "./AuthForm";
import UserProfile from "./UserProfile";

/**
 * AuthPage
 *
 * Handles three states:
 *  1. Loading  — session check in progress
 *  2. Authenticated — show UserProfile (also catches the OAuth callback redirect)
 *  3. Guest — show AuthForm (sign-in or sign-up)
 *
 * OAuth flow note:
 *  Google redirects back to /account with #access_token=... in the hash.
 *  Supabase JS picks this up automatically via onAuthStateChange, sets the
 *  session, and our useAuth hook updates isAuthenticated → true.
 *  We then navigate to /#programs programmatically (safe — no querySelector).
 */
const AuthPage = ({ mode = "signin" }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Once authenticated (including after OAuth redirect), send to home
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check if this is a fresh OAuth callback (hash contains access_token)
    const isOAuthCallback = window.location.hash.includes("access_token");
    if (isOAuthCallback) {
      toast.success("You are signed in and ready to continue.", "Signed in");
      // Navigate to home; replace so back-button doesn't return to /account#token
      navigate("/", { replace: true });
    }
  }, [isAuthenticated]);

  return (
    <div 
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        background: `linear-gradient(135deg, var(--site-brand-dark, #030406) 0%, #080a0f 100%)`,
      }}
    >
      <Navigation />

      <main className="relative z-10 px-6 pb-24 pt-32">
        <div className={`mx-auto ${isAdmin ? "max-w-6xl" : "w-full"}`}>
          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Checking your session…
            </div>
          ) : isAuthenticated ? (
            <UserProfile />
          ) : (
            <AuthForm mode={mode} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
