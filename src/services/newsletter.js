import { supabase } from "../supabase-client";

const subscriptionsTable = import.meta.env.VITE_SUPABASE_NEWSLETTER_SUBSCRIPTIONS_TABLE || "storefront_newsletter_subscriptions";
const broadcastsTable = import.meta.env.VITE_SUPABASE_NEWSLETTER_BROADCASTS_TABLE || "storefront_newsletter_broadcasts";
const recipientsTable = import.meta.env.VITE_SUPABASE_NEWSLETTER_RECIPIENTS_TABLE || "storefront_newsletter_recipients";
const suppressionsTable = import.meta.env.VITE_SUPABASE_NEWSLETTER_SUPPRESSIONS_TABLE || "storefront_newsletter_suppressions";
const dispatchFunctionName = import.meta.env.VITE_SUPABASE_NEWSLETTER_FUNCTION || "newsletter-dispatch";
const unsubscribeFunctionName = import.meta.env.VITE_SUPABASE_NEWSLETTER_UNSUBSCRIBE_FUNCTION || "newsletter-unsubscribe";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const isDuplicateNewsletterSubscriptionError = (error) =>
  error?.code === "23505" &&
  String(error?.message || "").includes("duplicate key") &&
  String(error?.details || "").includes("normalized_email");

const safeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata;
};

export const addNewsletterSubscription = async ({ email, source = "newsletter_section", userId = null, metadata = {} }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Please enter a valid email address.");
  }

  const payload = {
    email: normalizedEmail,
    normalized_email: normalizedEmail,
    source,
    user_id: userId,
    metadata: safeMetadata(metadata),
    status: "subscribed",
    is_confirmed: true,
    created_at: new Date().toISOString(),
    unsubscribed_at: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from(subscriptionsTable).upsert(payload).select().single();
  if (error) {
    throw error;
  }
  await supabase.from(suppressionsTable).delete().eq("normalized_email", normalizedEmail);
  return data;
};

export const unsubscribeNewsletterEmail = async (email, token = null) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Please enter a valid email address.");
  }

  const { data, error } = await supabase.functions.invoke(unsubscribeFunctionName, {
    body: JSON.stringify({ email: normalizedEmail, token, action: "confirm" }),
  });
  if (error) {
    throw new Error(data?.error || error.message || "Unable to process unsubscribe request.");
  }
  return data;
};

export const getNewsletterUnsubscribeToken = async (token) => {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    throw new Error("Missing unsubscribe token.");
  }

  const { data, error } = await supabase.functions.invoke(unsubscribeFunctionName, {
    body: JSON.stringify({ token: normalizedToken, action: "lookup" }),
  });
  if (error) {
    throw new Error(data?.error || error.message || "Unable to load unsubscribe request.");
  }
  return data;
};

export const fetchAudienceCounts = async () => {
  const [buyersRes, meetingsRes, subscribersRes] = await Promise.all([
    supabase.from("storefront_course_access").select("customer_email"),
    supabase.from("storefront_booking_access").select("customer_email"),
    supabase.from(subscriptionsTable).select("normalized_email").eq("status", "subscribed"),
  ]);

  const uniqueBuyers = new Set((buyersRes.data || []).map((item) => normalizeEmail(item.customer_email)).filter(Boolean));
  const uniqueMeetings = new Set((meetingsRes.data || []).map((item) => normalizeEmail(item.customer_email)).filter(Boolean));
  const uniqueSubscribers = new Set((subscribersRes.data || []).map((item) => normalizeEmail(item.normalized_email)).filter(Boolean));
  const allUnique = new Set([...uniqueBuyers, ...uniqueMeetings, ...uniqueSubscribers]);

  return {
    buyers: uniqueBuyers.size,
    meetings: uniqueMeetings.size,
    newsletter: uniqueSubscribers.size,
    all: allUnique.size,
  };
};

export const fetchAvailableCourses = async () => {
  // Fetch only courses that have at least one buyer
  const { data: courseAccess, error: accessError } = await supabase
    .from("storefront_course_access")
    .select("course_id");
  if (accessError) throw accessError;

  const courseIds = [...new Set((courseAccess || []).map((a) => a.course_id).filter(Boolean))];
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from("storefront_courses")
    .select("id, title, offering_id")
    .eq("is_active", true)
    .in("id", courseIds)
    .order("title");
  if (error) throw error;
  return data || [];
};

export const fetchCourseBuyerCounts = async () => {
  const { data, error } = await supabase
    .from("storefront_course_access")
    .select("course_id");
  if (error) throw error;

  const counts = {};
  (data || []).forEach((row) => {
    counts[row.course_id] = (counts[row.course_id] || 0) + 1;
  });
  return counts;
};

export const fetchAvailableOfferings = async () => {
  // Fetch only booking offerings that have at least one lead/booking
  const { data: bookingAccess, error: accessError } = await supabase
    .from("storefront_booking_access")
    .select("offering_id");
  if (accessError) throw accessError;

  const offeringIds = [...new Set((bookingAccess || []).map((a) => a.offering_id).filter(Boolean))];
  if (offeringIds.length === 0) return [];

  const { data, error } = await supabase
    .from("storefront_offerings")
    .select("id, title")
    .eq("is_active", true)
    .eq("cta_type", "booking")
    .in("id", offeringIds)
    .order("title");
  if (error) throw error;
  return data || [];
};

export const fetchOfferingLeadCounts = async () => {
  const { data, error } = await supabase
    .from("storefront_booking_access")
    .select("offering_id");
  if (error) throw error;

  const counts = {};
  (data || []).forEach((row) => {
    counts[row.offering_id] = (counts[row.offering_id] || 0) + 1;
  });
  return counts;
};

export const fetchCourseSpecificBuyers = async ({ courseId }) => {
  if (!courseId) throw new Error("Missing course ID.");
  const { data, error } = await supabase
    .from("storefront_course_access")
    .select("customer_email")
    .eq("course_id", courseId);
  if (error) throw error;
  const emails = (data || []).map((item) => normalizeEmail(item.customer_email)).filter(Boolean);
  return [...new Set(emails)];
};

export const fetchOfferingSpecificLeads = async ({ offeringId }) => {
  if (!offeringId) throw new Error("Missing offering ID.");
  const { data, error } = await supabase
    .from("storefront_booking_access")
    .select("customer_email")
    .eq("offering_id", offeringId);
  if (error) throw error;
  const emails = (data || []).map((item) => normalizeEmail(item.customer_email)).filter(Boolean);
  return [...new Set(emails)];
};

export const fetchBroadcastHistory = async () => {
  const { data, error } = await supabase
    .from(broadcastsTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data || [];
};

export const createNewsletterBroadcast = async ({
  subject,
  body,
  audience = "all",
  audienceSegment = null,
  bodyBlocks = [],
  templateKey = "weekly_letter",
  templateLabel = null,
  previewText = "",
  attachments = [],
  scheduledAt = null,
  createdBy = null,
  retryOf = null,
}) => {
  const now = new Date().toISOString();
  const payload = {
    subject: String(subject || "").trim(),
    body: String(body || "").trim(),
    body_blocks: Array.isArray(bodyBlocks) ? bodyBlocks : [],
    template_key: templateKey || "weekly_letter",
    template_label: templateLabel || null,
    preview_text: previewText || null,
    audience,
    audience_segment: audienceSegment,
    attachments: Array.isArray(attachments) ? attachments : [],
    status: scheduledAt && new Date(scheduledAt).getTime() > Date.now() ? "scheduled" : "queued",
    scheduled_at: scheduledAt || now,
    created_at: now,
    created_by: createdBy,
    retry_of: retryOf,
    stats: { sent: 0, failed: 0, recipients: 0 },
  };

  const { data, error } = await supabase.from(broadcastsTable).insert([payload]).select().single();
  if (error) {
    throw error;
  }
  return data;
};

export const dispatchNewsletterBroadcast = async ({ broadcastId, testEmail = null } = {}) => {
  if (!broadcastId) {
    throw new Error("Missing broadcast ID for dispatch.");
  }
  const { data, error } = await supabase.functions.invoke(dispatchFunctionName, {
    body: JSON.stringify({ broadcast_id: broadcastId, test_email: testEmail }),
  });

  if (error) {
    let message = data?.error || error.message || "Newsletter dispatch failed.";
    if (error.context && typeof error.context.json === "function") {
      try {
        const contextBody = await error.context.json();
        message = contextBody?.error || message;
      } catch {
        // Keep the original Supabase error if the function response is not JSON.
      }
    }
    throw new Error(message);
  }

  return data;
};

export const fetchNewsletterRecipients = async ({ broadcastId }) => {
  if (!broadcastId) {
    throw new Error("Missing broadcast ID.");
  }

  const { data, error } = await supabase
    .from(recipientsTable)
    .select("*")
    .eq("broadcast_id", broadcastId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data || [];
};

export const retryNewsletterBroadcast = async ({ broadcast, createdBy = null }) => {
  if (!broadcast?.id) {
    throw new Error("Missing broadcast to retry.");
  }

  return createNewsletterBroadcast({
    subject: broadcast.subject,
    body: broadcast.body,
    audience: broadcast.audience,
    audienceSegment: broadcast.audience_segment,
    bodyBlocks: broadcast.body_blocks || [],
    templateKey: broadcast.template_key || "weekly_letter",
    templateLabel: broadcast.template_label || null,
    previewText: broadcast.preview_text || "",
    attachments: broadcast.attachments || [],
    scheduledAt: new Date().toISOString(),
    createdBy,
    retryOf: broadcast.id,
  });
};

export const fetchNewsletterSubscribers = async ({ status = "subscribed", limit = 100, offset = 0 } = {}) => {
  const { data, error } = await supabase
    .from(subscriptionsTable)
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }
  return data || [];
};

export default {
  addNewsletterSubscription,
  unsubscribeNewsletterEmail,
  getNewsletterUnsubscribeToken,
  fetchAudienceCounts,
  fetchAvailableCourses,
  fetchCourseBuyerCounts,
  fetchAvailableOfferings,
  fetchOfferingLeadCounts,
  fetchCourseSpecificBuyers,
  fetchOfferingSpecificLeads,
  fetchBroadcastHistory,
  createNewsletterBroadcast,
  dispatchNewsletterBroadcast,
  fetchNewsletterRecipients,
  retryNewsletterBroadcast,
  fetchNewsletterSubscribers,
};
