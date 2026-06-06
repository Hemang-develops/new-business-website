import Cal, { getCalApi } from "@calcom/embed-react";
import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

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

const formatScheduledDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
};

const BookingEmbed = ({ item }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const booking = item.booking;
  const isSynced = booking?.status === "synced" && booking?.url;
  const calLink = isSynced ? toCalLink(booking.url) : "";
  const calNamespace = useMemo(
    () => `booking-${String(item.id || "offering").replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    [item.id],
  );
  const bookingLabel = booking?.ctaLabel || item.ctaLabel || "Book now";
  const sessionFormatLabel = "Google Meet session";
  const attendeeName = isAuthenticated
    ? [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.name || ""
    : "";
  const attendeeEmail = isAuthenticated ? user?.email || "" : "";
  const calConfig = useMemo(
    () => ({
      layout: "month_view",
      name: attendeeName,
      email: attendeeEmail,
    }),
    [attendeeEmail, attendeeName],
  );
  const calEmbedKey = `${calLink}:${attendeeName}:${attendeeEmail}`;

  useEffect(() => {
    if (!isSynced) {
      return undefined;
    }

    let isActive = true;
    let calApi;
    const handleBookingSuccessful = (event) => {
      if (!isActive) {
        return;
      }

      const data = event?.detail?.data || {};
      setConfirmedBooking({
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        videoCallUrl: data.videoCallUrl || "",
      });
      toast.success(
        "Your session has been scheduled. You can revisit it from My Meetings in your account.",
        "Booking confirmed",
      );
    };

    getCalApi({ namespace: calNamespace }).then((api) => {
      if (!isActive) {
        return;
      }
      calApi = api;
      calApi("on", {
        action: "bookingSuccessfulV2",
        callback: handleBookingSuccessful,
      });
    });

    return () => {
      isActive = false;
      if (calApi) {
        calApi("off", {
          action: "bookingSuccessfulV2",
          callback: handleBookingSuccessful,
        });
      }
    };
  }, [calNamespace, isSynced, toast]);

  if (!booking?.enabled) {
    return null;
  }

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
          {confirmedBooking ? (
            <div className="space-y-4 rounded-2xl border border-teal-300/40 bg-teal-300/10 p-5 text-teal-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-200" />
                <p className="font-semibold">Your session is booked.</p>
              </div>
              {confirmedBooking.startTime ? (
                <p className="flex items-center gap-2 text-sm text-teal-50/90">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  {formatScheduledDate(confirmedBooking.startTime)}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {confirmedBooking.videoCallUrl ? (
                  <a
                    href={confirmedBooking.videoCallUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-teal-200 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-teal-100"
                  >
                    <Video className="h-4 w-4" />
                    Join meeting
                  </a>
                ) : null}
                <Link
                  to="/sign-in?tab=meetings"
                  className="inline-flex items-center rounded-full border border-teal-200/45 px-4 py-2 text-sm font-semibold text-teal-50 transition hover:bg-teal-200/10"
                >
                  {isAuthenticated ? "View My Meetings" : "Sign in to view meetings"}
                </Link>
              </div>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80">
            <Cal
              key={calEmbedKey}
              namespace={calNamespace}
              calLink={calLink}
              className="min-h-[720px] w-full"
              style={{ width: "100%", minHeight: "720px", overflow: "hidden" }}
              config={calConfig}
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
