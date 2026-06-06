import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;

const TRACKED_EVENTS = new Map([
  ["BOOKING_CREATED", "confirmed"],
  ["BOOKING_CONFIRMED", "confirmed"],
  ["BOOKING_REQUESTED", "pending"],
  ["BOOKING_RESCHEDULED", "rescheduled"],
  ["BOOKING_CANCELLED", "cancelled"],
  ["BOOKING_REJECTED", "cancelled"],
  ["MEETING_ENDED", "completed"],
]);

const json = (status: number, body: JsonRecord) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getAdminClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? value as JsonRecord : {};

const asString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const getNestedString = (value: unknown, key: string) =>
  asString(asRecord(value)[key]);

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const signBody = async (body: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
};

const signaturesMatch = (expected: string, received: string) => {
  if (expected.length !== received.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < expected.length; index += 1) {
    result |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return result === 0;
};

const calculateDurationMinutes = (startTime: string, endTime: string) => {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return Math.round((end - start) / (60 * 1000));
};

const getMeetingUrl = (payload: JsonRecord) => {
  const candidates = [
    getNestedString(payload.metadata, "videoCallUrl"),
    asString(payload.videoCallUrl),
    asString(payload.location),
  ];

  return candidates.find((value) => /^https?:\/\//i.test(value)) || null;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const secret = Deno.env.get("CALCOM_WEBHOOK_SECRET");
    const signature = (request.headers.get("x-cal-signature-256") || "").replace(/^sha256=/i, "");
    const rawBody = await request.text();

    if (!secret || !signature) {
      return json(401, { error: "Missing Cal.com webhook authentication." });
    }

    const expectedSignature = await signBody(rawBody, secret);
    if (!signaturesMatch(expectedSignature, signature)) {
      return json(401, { error: "Invalid Cal.com webhook signature." });
    }

    const event = JSON.parse(rawBody) as JsonRecord;
    const triggerEvent = asString(event.triggerEvent);
    const status = TRACKED_EVENTS.get(triggerEvent);
    if (!status) {
      return json(200, { ignored: true, triggerEvent });
    }

    const payload = asRecord(event.payload || event);
    const eventType = asRecord(payload.eventType);
    const eventTypeId = String(payload.eventTypeId || eventType.id || "").trim();
    const bookingUid = asString(payload.uid || payload.bookingUid);
    const rescheduleUid = asString(payload.rescheduleUid);
    const bookingIds = [...new Set([bookingUid, rescheduleUid].filter(Boolean))];

    if (!bookingIds.length) {
      throw new Error("Cal.com event did not include a booking UID.");
    }

    const supabase = getAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("storefront_booking_access")
      .select("id,payment_id,offering_id")
      .eq("payment_provider", "calcom")
      .in("payment_id", bookingIds)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const attendee = Array.isArray(payload.attendees) ? asRecord(payload.attendees[0]) : {};
    const customerEmail = asString(attendee.email).toLowerCase();
    const customerName = asString(attendee.name);
    const startTime = asString(payload.startTime);
    const endTime = asString(payload.endTime);
    const durationMinutes = calculateDurationMinutes(startTime, endTime);
    const meetingUrl = getMeetingUrl(payload);

    if (existing) {
      const { error } = await supabase
        .from("storefront_booking_access")
        .update({
          payment_id: bookingUid || existing.payment_id,
          customer_email: customerEmail || undefined,
          customer_name: customerName || undefined,
          scheduled_at: startTime || undefined,
          duration_minutes: durationMinutes || undefined,
          meeting_url: meetingUrl || undefined,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        throw error;
      }
      return json(200, { updated: true, status });
    }

    if (status === "cancelled" || status === "completed") {
      return json(200, { ignored: true, reason: "No stored booking to update." });
    }

    if (!eventTypeId || !customerEmail) {
      throw new Error("Cal.com booking is missing its event type or attendee email.");
    }

    const { data: offering, error: offeringError } = await supabase
      .from("storefront_offerings")
      .select("id,duration_minutes")
      .eq("booking_external_id", eventTypeId)
      .eq("booking_enabled", true)
      .maybeSingle();

    if (offeringError) {
      throw offeringError;
    }
    if (!offering) {
      return json(200, { ignored: true, reason: "Booking event type is not a storefront offering." });
    }

    const { error: insertError } = await supabase
      .from("storefront_booking_access")
      .insert({
        offering_id: offering.id,
        customer_email: customerEmail,
        customer_name: customerName || null,
        payment_provider: "calcom",
        payment_id: bookingUid || rescheduleUid,
        scheduled_at: startTime || null,
        duration_minutes: durationMinutes || offering.duration_minutes || null,
        meeting_url: meetingUrl,
        status,
      });

    if (insertError) {
      throw insertError;
    }

    return json(200, { created: true, status });
  } catch (error) {
    console.error("[cal-booking-webhook]", error);
    return json(400, {
      error: error instanceof Error ? error.message : "Unable to process Cal.com booking event.",
    });
  }
});
