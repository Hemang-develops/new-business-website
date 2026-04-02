import Cal from "@calcom/embed-react";
import { ArrowRight, ExternalLink } from "lucide-react";

const toCalLink = (bookingUrl) => {
  if (!bookingUrl) {
    return "";
  }

  try {
    const url = new URL(bookingUrl);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return String(bookingUrl).replace(/^https?:\/\/[^/]+\//i, "").replace(/^\/+/, "");
  }
};

const BookingEmbed = ({ item }) => {
  const booking = item.booking;
  if (!booking?.enabled) {
    return null;
  }

  const isSynced = booking.status === "synced" && booking.url;
  const calLink = isSynced ? toCalLink(booking.url) : "";
  const bookingLabel = booking.ctaLabel || item.ctaLabel || "Book now";
  const sessionFormatLabel = "Google Meet session";

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/90 shadow-2xl backdrop-blur">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/80">Booking</p>
        <h3 className="text-2xl font-semibold text-white">{bookingLabel}</h3>
        <p className="text-sm leading-relaxed text-white/70">
          {booking.durationMinutes ? `${booking.durationMinutes}-minute ${sessionFormatLabel.toLowerCase()}.` : sessionFormatLabel}
          {" "}Choose a time that feels aligned and confirm your session instantly.
        </p>
      </div>

      {isSynced ? (
        <>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80">
            <Cal
              calLink={calLink}
              className="min-h-[720px] w-full"
              style={{ width: "100%", minHeight: "720px", overflow: "hidden" }}
              config={{ layout: "month_view" }}
            />
          </div>
          <a
            href={booking.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20"
          >
            Open booking page
            <ExternalLink className="h-4 w-4" />
          </a>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/70">
            {booking.lastError
              ? `Booking sync failed: ${booking.lastError}`
              : item.checkoutFallbackMessage || "Booking is being prepared right now. Use the fallback contact path below while we finish syncing your calendar event."}
          </p>
          {item.actionLink ? (
            <a
              href={item.actionLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20"
            >
              Use fallback
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default BookingEmbed;
