import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import { Skeleton } from "../../components/ui/skeleton";
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
const AuthPageSkeleton = () => (
  <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr,1fr]" aria-busy="true" aria-live="polite">
    <span className="sr-only">Checking your session and preparing your account page.</span>

    <section className="space-y-8">
      <Skeleton className="h-4 w-36 rounded-full bg-teal-200/20" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-4/5 bg-white/10 sm:h-14" />
        <Skeleton className="h-12 w-2/3 bg-white/10 sm:h-14" />
      </div>
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-5/6 bg-white/5" />
        <Skeleton className="h-4 w-3/5 bg-white/5" />
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <Skeleton className="h-4 w-44 rounded-full bg-white/10" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-11/12 bg-white/5" />
          <Skeleton className="h-4 w-4/5 bg-white/5" />
        </div>
      </div>
    </section>

    <section className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
      <Skeleton className="mb-8 h-4 w-28 rounded-full bg-white/10" />
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-teal-300/20" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/2 bg-white/10" />
          <Skeleton className="h-4 w-3/4 bg-white/5" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-12 w-full rounded-full bg-teal-300/20" />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-px flex-1 bg-white/10" />
        <Skeleton className="h-3 w-8 bg-white/10" />
        <Skeleton className="h-px flex-1 bg-white/10" />
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-full bg-white/5" />
    </section>
  </div>
);

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
            <AuthPageSkeleton />
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
