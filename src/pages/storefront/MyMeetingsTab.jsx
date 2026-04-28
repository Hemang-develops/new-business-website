import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGsapPulse } from "../../hooks/useGsapMotion";
import { getUserMeetings } from "../../services/userMeetings";

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS = {
  pending: {
    label: "Awaiting schedule",
    className: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  },
  confirmed: {
    label: "Confirmed",
    className: "border-teal-300/40 bg-teal-300/10 text-teal-100",
  },
  rescheduled: {
    label: "Rescheduled",
    className: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  },
  completed: {
    label: "Completed",
    className: "border-white/20 bg-white/[0.06] text-white/50",
  },
};

/**
 * Groups meetings into three buckets:
 *  - "upcoming"  — confirmed/rescheduled with a future scheduledAt
 *  - "pending"   — not yet scheduled (status === 'pending')
 *  - "past"      — completed OR scheduledAt is in the past
 */
const groupMeetings = (meetings) => {
  const now = new Date();
  const upcoming = [];
  const pending = [];
  const past = [];

  for (const m of meetings) {
    if (m.status === "completed") {
      past.push(m);
    } else if (!m.scheduledAt || m.status === "pending") {
      pending.push(m);
    } else if (new Date(m.scheduledAt) >= now) {
      upcoming.push(m);
    } else {
      past.push(m);
    }
  }

  return { upcoming, pending, past };
};

// ─── Component ───────────────────────────────────────────────────────────────

const MyMeetingsTab = () => {
  const { user } = useAuth();
  const pageRef = useRef(null);
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useGsapPulse(pageRef, "[data-gsap-pulse]", [isLoading]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getUserMeetings(user?.email, user?.id);
        setMeetings(data);
      } catch {
        setMeetings([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.email, user?.id]);

  const { upcoming, pending, past } = groupMeetings(meetings);

  return (
    <div
      ref={pageRef}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20"
    >
      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">
            Scheduled sessions
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">My Meetings</h2>
            {meetings.length !== 0 && (
              <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                {meetings.length} total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                data-gsap-pulse
                className="h-44 rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            <MeetingGroup label="Upcoming" items={upcoming} />
            <MeetingGroup label="Awaiting Schedule" items={pending} />
            <MeetingGroup label="Past" items={past} dimmed />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Group ────────────────────────────────────────────────────────────────────

const MeetingGroup = ({ label, items, dimmed = false }) => {
  if (!items.length) return null;
  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap">
        {items.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} dimmed={dimmed} />
        ))}
      </div>
    </section>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

const MeetingCard = ({ meeting, dimmed }) => {
  const config = STATUS[meeting.status] ?? STATUS.pending;
  const dateStr = formatDate(meeting.scheduledAt);
  const timeStr = formatTime(meeting.scheduledAt);

  return (
    <article
      className={`flex min-h-44 flex-col rounded-2xl border border-white/10 bg-black/20 p-5 transition xl:basis-[calc(50%-0.5rem)] ${
        dimmed
          ? "opacity-60 hover:opacity-80"
          : "hover:border-teal-300/35 hover:bg-teal-300/[0.06]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-teal-300/25 bg-teal-300/10 text-teal-100">
            <Video className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold leading-snug text-white">
            {meeting.title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      {/* Description */}
      {meeting.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/55">
          {meeting.description}
        </p>
      ) : null}

      {/* Notes from admin */}
      {meeting.notes ? (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs italic text-white/50">
          {meeting.notes}
        </p>
      ) : null}

      {/* Meta */}
      <div className="mt-auto flex flex-wrap gap-3 pt-4 text-xs text-white/50">
        {dateStr ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-white/35" />
            {dateStr}{timeStr ? ` · ${timeStr}` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-200/60">
            <CalendarDays className="h-3.5 w-3.5" />
            Date to be confirmed
          </span>
        )}
        {meeting.durationMinutes && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-white/35" />
            {meeting.durationMinutes} min
          </span>
        )}
        {meeting.sessionFormat && (
          <span className="inline-flex items-center gap-1.5 capitalize">
            {meeting.sessionFormat}
          </span>
        )}
      </div>

      {/* Join button — only if there's a URL and it's not past */}
      {meeting.meetingUrl && !dimmed && (
        <a
          href={meeting.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-teal-200"
        >
          Join meeting
          <ArrowUpRight className="h-4 w-4" />
        </a>
      )}
    </article>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
    <Video className="h-10 w-10 text-teal-200/70" />
    <p className="mt-4 text-lg font-semibold text-white">
      No meetings booked yet
    </p>
    <p className="mt-2 max-w-md text-sm text-white/55">
      Your one-on-one sessions will appear here once you book a meeting.
    </p>
    <Link
      to="/#programs"
      className="mt-6 inline-flex rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 hover:border-teal-200 hover:bg-teal-300/20"
    >
      Book a session
    </Link>
  </div>
);

export default MyMeetingsTab;
