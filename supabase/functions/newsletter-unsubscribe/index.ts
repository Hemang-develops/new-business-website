import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const normalizeEmail = (email: unknown) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const hasTransactionalRelationship = async (supabase: ReturnType<typeof getAdminClient>, email: string) => {
  const [courseAccess, bookingAccess] = await Promise.all([
    supabase.from("storefront_course_access").select("id").eq("customer_email", email).limit(1),
    supabase.from("storefront_booking_access").select("id").eq("customer_email", email).limit(1),
  ]);

  if (courseAccess.error) throw courseAccess.error;
  if (bookingAccess.error) throw bookingAccess.error;

  return Boolean(courseAccess.data?.length || bookingAccess.data?.length);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const body = await request.json();
    const action = String(body?.action || "lookup");
    const token = String(body?.token || "").trim();
    const supabase = getAdminClient();

    let email = normalizeEmail(body?.email);
    let tokenRow: Record<string, unknown> | null = null;

    if (token) {
      const { data, error } = await supabase
        .from("storefront_newsletter_unsubscribe_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return json(404, { error: "This unsubscribe link is invalid or expired." });
      }
      if (data.expires_at && new Date(String(data.expires_at)).getTime() < Date.now()) {
        return json(410, { error: "This unsubscribe link has expired." });
      }

      tokenRow = data;
      email = normalizeEmail(data.normalized_email);
    }

    if (!email) {
      return json(400, { error: "Missing email for unsubscribe." });
    }

    const hasTransactions = await hasTransactionalRelationship(supabase, email);

    if (action === "lookup") {
      return json(200, {
        ok: true,
        email,
        hasTransactions,
        alreadyUsed: Boolean(tokenRow?.used_at),
      });
    }

    const now = new Date().toISOString();
    await supabase.from("storefront_newsletter_suppressions").upsert({
      email,
      normalized_email: email,
      reason: "unsubscribe",
      source: token ? "unsubscribe_link" : "manual",
      metadata: {
        token_id: tokenRow?.id || null,
        broadcast_id: tokenRow?.broadcast_id || null,
        hasTransactions,
      },
      updated_at: now,
    }, { onConflict: "normalized_email" });

    await supabase.from("storefront_newsletter_subscriptions").upsert({
      email,
      normalized_email: email,
      status: "unsubscribed",
      unsubscribed_at: now,
      updated_at: now,
    }, { onConflict: "normalized_email" });

    if (token) {
      await supabase
        .from("storefront_newsletter_unsubscribe_tokens")
        .update({ used_at: now })
        .eq("token", token);
    }

    return json(200, { ok: true, email, hasTransactions });
  } catch (error) {
    console.error(error);
    return json(500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});
