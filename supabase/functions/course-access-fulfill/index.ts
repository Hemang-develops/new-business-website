import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fulfillCourseAccess as fulfillUnifiedPurchase } from "../_shared/course-fulfillment.ts";

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const authorization = request.headers.get("authorization") || "";
  console.log("[Fulfill] Request received. Auth header present:", !!authorization);

  try {
    const supabase = getAdminClient();
    const secret = Deno.env.get("FULFILLMENT_SECRET");
    const isSecretValid = secret && authorization === `Bearer ${secret}`;

    let isAdmin = false;
    if (!isSecretValid) {
      const token = authorization.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        console.error("[Fulfill] Auth error:", authError.message);
      } else if (user?.email) {
        const { data: isAdminData, error: isAdminError } = await supabase
          .rpc("is_storefront_admin_email", { target_email: user.email });

        if (isAdminError) {
          console.error("[Fulfill] Admin lookup error:", isAdminError.message);
        } else {
          isAdmin = Boolean(isAdminData);
        }
      }
    }

    if (!isSecretValid && !isAdmin) {
      return json(401, { error: "Unauthorized fulfillment request. Please sign in as an admin." });
    }

    const body = await request.json();
    const result = await fulfillUnifiedPurchase({
      amount: body.amount ?? null,
      currency: body.currency || null,
      customerEmail: body.email || body.customerEmail || null,
      customerName: body.fullName || body.customerName || null,
      country: body.country || null,
      orderId: body.orderId || null,
      packageId: body.packageId || null,
      paymentId: body.paymentId || body.stripeSessionId || null,
      provider: body.provider || "stripe",
      productId: body.productId,
      userId: body.userId || null,
    });

    return json(200, { status: "success", ...result });
  } catch (error) {
    console.error("[Fulfill] Fatal error:", error instanceof Error ? error.message : error);
    return json(400, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown fulfillment error.",
    });
  }
});
