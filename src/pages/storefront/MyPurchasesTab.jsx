import { useEffect, useState } from "react";
import { ArrowUpRight, Clock3, PackageCheck, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserPurchases } from "../../services/userPurchases";

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAmount = (amount, currency) => {
  if (amount == null) return "Amount unavailable";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: String(currency || "USD").toUpperCase(),
  }).format(Number(amount) / 100);
};

const statusMeta = {
  delivered: { label: "Delivered", className: "border-teal-300/40 bg-teal-300/10 text-teal-100" },
  manual: { label: "Admin follow-up", className: "border-amber-300/40 bg-amber-300/10 text-amber-100" },
  pending: { label: "Processing", className: "border-sky-300/40 bg-sky-300/10 text-sky-100" },
  failed: { label: "Needs attention", className: "border-rose-300/40 bg-rose-300/10 text-rose-100" },
};

const MyPurchasesTab = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getUserPurchases(user?.email, user?.id)
      .then((data) => {
        if (mounted) setPurchases(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.email, user?.id]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Payment history</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">My Purchases</h2>
        </div>
        {purchases.length > 0 ? (
          <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
            {purchases.length} total
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-teal-200/70" />
            <p className="mt-4 text-lg font-semibold text-white">No purchases yet</p>
            <p className="mt-2 max-w-md text-sm text-white/55">Completed purchases made with this account email will appear here.</p>
            <Link to="/buy" className="mt-6 inline-flex rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 hover:bg-teal-300/20">
              Browse offerings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => {
              const meta = statusMeta[purchase.deliveryStatus] || statusMeta.pending;
              return (
                <article key={purchase.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-teal-300/30">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <PackageCheck className="h-5 w-5 shrink-0 text-teal-200" />
                        <h3 className="truncate text-base font-semibold text-white">{purchase.title}</h3>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50">
                        <span>{formatDate(purchase.createdAt)}</span>
                        <span>{formatAmount(purchase.amount, purchase.currency)}</span>
                        <span className="capitalize">{purchase.fulfillmentMode}</span>
                        <span className="capitalize">{purchase.paymentProvider}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                  </div>
                  {purchase.expiresAt ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/50"><Clock3 className="h-3.5 w-3.5" />Access expires {formatDate(purchase.expiresAt)}</p>
                  ) : null}
                  {purchase.deliveryUrl ? (
                    <a href={purchase.deliveryUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-teal-200">
                      Open access <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyPurchasesTab;
