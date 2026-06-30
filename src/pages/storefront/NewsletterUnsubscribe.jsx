import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, MailMinus } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { getNewsletterUnsubscribeToken, unsubscribeNewsletterEmail } from "../../services/newsletter";

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const emailFromQuery = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [details, setDetails] = useState(null);
  const [email, setEmail] = useState(emailFromQuery);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setEmail(emailFromQuery);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    getNewsletterUnsubscribeToken(token)
      .then((data) => {
        if (!isMounted) return;
        setDetails(data);
        setEmail(data.email || "");
      })
      .catch((error) => {
        if (!isMounted) return;
        toast.error(error.message || "Unable to load unsubscribe request.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [emailFromQuery, toast, token]);

  const handleUnsubscribe = async (event) => {
    event.preventDefault();
    if (!email) {
      toast.error("Missing email for unsubscribe.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await unsubscribeNewsletterEmail(email, token || null);
      setDetails((previous) => ({ ...(previous || {}), ...response }));
      toast.success("You have been unsubscribed from marketing emails.");
      setIsComplete(true);
    } catch (error) {
      toast.error(error.message || "Unable to process unsubscribe request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_34%),linear-gradient(180deg,#030406,#080b0f)] px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 bg-black/20 p-8 md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
            <MailMinus className="h-7 w-7" />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.34em] text-teal-200/80">Email Preferences</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Confirm unsubscribe</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">
            You can stop marketing newsletters here. Purchase access links, booking confirmations, receipts, and other essential account emails may still be sent when needed.
          </p>
        </div>

        <div className="p-8 md:p-10">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-teal-200" />
              Loading unsubscribe request...
            </div>
          ) : isComplete ? (
            <div className="rounded-3xl border border-teal-300/20 bg-teal-300/10 p-8">
              <CheckCircle2 className="h-8 w-8 text-teal-200" />
              <p className="mt-4 text-lg font-semibold text-teal-50">Unsubscribed successfully.</p>
              <p className="mt-2 text-white/70">{email} will no longer receive marketing newsletters.</p>
              <Link to="/" className="mt-6 inline-flex rounded-full bg-teal-300 px-5 py-2 text-sm font-bold text-black">
                Return home
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUnsubscribe}>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Email address</p>
                <p className="mt-2 break-all text-lg font-semibold text-white">{email || "No email found"}</p>
              </div>

              {details?.hasTransactions ? (
                <div className="flex gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-50">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm leading-relaxed">
                    This email is connected to a purchase or booking. Unsubscribing stops marketing newsletters, but important transactional emails for your purchases or meetings may still be sent.
                  </p>
                </div>
              ) : null}

              {!token && emailFromQuery ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/55">
                  This is an older unsubscribe link. You can still confirm below.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-teal-300 px-8 text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:bg-teal-200 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm unsubscribe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterUnsubscribe;
