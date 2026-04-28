import { supabase } from "../supabase-client";

/**
 * @typedef {Object} UserMeeting
 * @property {string} id
 * @property {string} offeringId
 * @property {string} title
 * @property {string} description
 * @property {string} meetingUrl
 * @property {string|null} scheduledAt
 * @property {number|null} durationMinutes
 * @property {string|null} sessionFormat
 * @property {string} notes
 * @property {string} status
 * @property {string} createdAt
 */

/**
 * Fetch all booking purchases for the current user.
 *
 * Joins storefront_booking_access → storefront_offerings to get
 * the offering title, description, booking_url, and duration.
 *
 * @param {string} userEmail
 * @param {string} userId
 * @returns {Promise<UserMeeting[]>}
 */
export const getUserMeetings = async (userEmail, userId) => {
  if (!userEmail && !userId) {
    console.log("[userMeetings] No user identity provided");
    return [];
  }

  try {
    const normalizedEmail = String(userEmail || "").trim().toLowerCase();

    // Build the filter: match by user_id OR customer_email
    let query = supabase
      .from("storefront_booking_access")
      .select(
        `
        id,
        offering_id,
        customer_email,
        customer_name,
        scheduled_at,
        duration_minutes,
        meeting_url,
        notes,
        status,
        created_at,
        offering:storefront_offerings (
          id,
          title,
          summary,
          long_description,
          booking_url,
          duration_minutes,
          session_format
        )
      `
      )
      .neq("status", "cancelled")
      .is("revoked_at", null);

    if (normalizedEmail && userId) {
      query = query.or(
        `customer_email.eq.${normalizedEmail},user_id.eq.${userId}`
      );
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("customer_email", normalizedEmail);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.warn("[userMeetings] Query error:", error.message);
      return [];
    }

    return (data || []).map((row) => {
      const offering = row.offering || {};
      return {
        id: row.id,
        offeringId: row.offering_id,
        // Meeting details — prefer row-level values (set by admin after booking),
        // fall back to offering defaults
        title: offering.title || "Meeting",
        description: offering.summary || offering.long_description || "",
        meetingUrl: row.meeting_url || offering.booking_url || "",
        scheduledAt: row.scheduled_at || null,
        durationMinutes: row.duration_minutes || offering.duration_minutes || null,
        sessionFormat: offering.session_format || null,
        notes: row.notes || "",
        status: row.status || "pending",
        createdAt: row.created_at,
      };
    });
  } catch (err) {
    console.error("[userMeetings] Exception:", err);
    return [];
  }
};
