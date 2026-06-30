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

const getFunctionUrl = (name: string) => {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("Missing SUPABASE_URL.");
  return `${url.replace(/\/$/, "")}/functions/v1/${name}`;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const { data: dueBroadcasts, error } = await supabase
      .from("storefront_newsletter_broadcasts")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(25);

    if (error) throw error;

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dispatchUrl = getFunctionUrl(Deno.env.get("NEWSLETTER_DISPATCH_FUNCTION") || "newsletter-dispatch");
    const results = [];

    for (const broadcast of dueBroadcasts || []) {
      await supabase
        .from("storefront_newsletter_broadcasts")
        .update({ status: "queued", updated_at: new Date().toISOString() })
        .eq("id", broadcast.id);

      const response = await fetch(dispatchUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ broadcast_id: broadcast.id }),
      });

      results.push({
        id: broadcast.id,
        ok: response.ok,
        response: await response.json().catch(() => null),
      });
    }

    return json(200, { ok: true, checkedAt: now, dispatched: results.length, results });
  } catch (error) {
    console.error(error);
    return json(500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});
