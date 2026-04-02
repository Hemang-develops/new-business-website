const CAL_API_BASE = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-06-14";
const ALLOWED_CTA_TYPES = new Set(["booking", "checkout", "contact"]);
const ALLOWED_SESSION_FORMATS = new Set(["google-meet"]);

type OfferingPayload = {
  id: string;
  title: string;
  summary?: string | null;
  is_active?: boolean | null;
  cta_type?: string | null;
  booking_enabled?: boolean | null;
  booking_provider?: string | null;
  booking_external_id?: string | null;
  duration_minutes?: number | null;
  session_format?: string | null;
  host_id?: string | null;
};

type EventTypeResponse = {
  id: number | string;
  title?: string;
  slug?: string;
  lengthInMinutes?: number;
  description?: string | null;
  hidden?: boolean;
  locations?: Array<Record<string, unknown>>;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });

const slugify = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const getLocationPayload = (sessionFormat: string) => {
  return [{ type: "integration", integration: "google-meet" }];
};

const buildEventTypePayload = (offering: OfferingPayload, username: string) => {
  const normalizedTitle = String(offering.title || "").trim();
  const duration = Math.max(15, Number(offering.duration_minutes || 60));
  const sessionFormat = ALLOWED_SESSION_FORMATS.has(String(offering.session_format || ""))
    ? String(offering.session_format)
    : "google-meet";

  return {
    title: normalizedTitle,
    slug: slugify(offering.id || normalizedTitle),
    description: offering.summary?.trim() || "",
    lengthInMinutes: duration,
    hidden: !(offering.booking_enabled && offering.is_active),
    disableGuests: true,
    bookingWindow: {
      type: "businessDays",
      value: 30,
      rolling: true,
    },
    locations: getLocationPayload(sessionFormat),
    bookingFields: [
      { type: "name", required: true },
      { type: "email", required: true },
    ],
    metadata: {
      offeringId: offering.id,
      hostId: offering.host_id || "",
      managedBy: "hf11-storefront",
      username,
    },
  };
};

const getAuthHeaders = () => {
  const apiKey = Deno.env.get("CALCOM_API_KEY");

  if (!apiKey) {
    throw new Error("Missing CALCOM_API_KEY");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "cal-api-version": CAL_API_VERSION,
    "Content-Type": "application/json",
  };
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Cal.com request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return data;
};

const getPublicBookingUrl = (username: string, slug: string) => `https://cal.com/${username}/${slug}`;

const createEventType = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${CAL_API_BASE}/event-types`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  return data?.data as EventTypeResponse;
};

const updateEventType = async (eventTypeId: string, payload: Record<string, unknown>) => {
  const response = await fetch(`${CAL_API_BASE}/event-types/${eventTypeId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  return (data?.data || payload) as EventTypeResponse;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const offering = (await request.json()) as OfferingPayload;
    const username = Deno.env.get("CALCOM_USERNAME");
    if (!username) {
      throw new Error("Missing CALCOM_USERNAME.");
    }
    if (!offering?.id || !offering?.title?.trim()) {
      throw new Error("Offering id and title are required.");
    }

    const ctaType = String(offering.cta_type || "contact");
    if (!ALLOWED_CTA_TYPES.has(ctaType)) {
      throw new Error("Invalid offering cta_type.");
    }

    if (ctaType !== "booking" || !offering.booking_enabled) {
      if (!offering.booking_external_id) {
        return json(200, {
          booking_status: "pending",
          booking_external_id: null,
          booking_url: null,
          booking_provider: "calcom",
          booking_last_error: null,
        });
      }

      const updated = await updateEventType(offering.booking_external_id, {
        hidden: true,
      });

      return json(200, {
        booking_status: "pending",
        booking_external_id: String(updated.id || offering.booking_external_id),
        booking_url: updated.slug ? getPublicBookingUrl(username, updated.slug) : null,
        booking_provider: "calcom",
        booking_last_error: null,
      });
    }

    const payload = buildEventTypePayload(offering, username);
    const synced = offering.booking_external_id
      ? await updateEventType(offering.booking_external_id, payload)
      : await createEventType(payload);

    return json(200, {
      booking_status: "synced",
      booking_external_id: String(synced.id),
      booking_url: getPublicBookingUrl(username, synced.slug || String(payload.slug)),
      booking_provider: "calcom",
      booking_last_error: null,
    });
  } catch (error) {
    return json(400, {
      booking_status: "failed",
      booking_last_error: error instanceof Error ? error.message : "Unknown booking sync error.",
    });
  }
});
