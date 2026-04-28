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

const getSiteUrl = () => (Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");

const buildAccessUrl = (token: string) => `${getSiteUrl() || ""}/courses/access/${token}`;

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");

  if (!apiKey || !from || !to) {
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Unable to send email: ${text}`);
  }

  return { skipped: false };
};

const verifyStripeSession = async (sessionId: string) => {
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecret || !sessionId) {
    return null;
  }

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        "Authorization": `Bearer ${stripeSecret}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const session = await response.json() as Record<string, unknown>;
    
    // Check if payment was successful
    if (session.payment_status === "paid") {
      return {
        email: session.customer_email as string,
        status: "paid",
        metadata: session.metadata as Record<string, unknown>,
      };
    }
  } catch (error) {
    console.error("Error verifying Stripe session:", error);
  }

  return null;
};

const fulfillCourseAccess = async ({
  amount,
  currency,
  customerEmail,
  customerName,
  orderId,
  packageId,
  paymentId,
  provider,
  productId,
  userId,
}: {
  amount?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  orderId?: string | null;
  packageId?: string | null;
  paymentId?: string | null;
  provider: string;
  productId: string;
  userId?: string | null;
}) => {
  const supabase = getAdminClient();
  const normalizedProductId = String(productId || "").trim();
  let normalizedEmail = String(customerEmail || "").trim().toLowerCase();

  console.log("[Fulfill] Logic start. Provider:", provider, "Product ID:", normalizedProductId, "Email:", normalizedEmail);

  // If this is a Stripe payment, verify the session first
  if (provider === "stripe" && paymentId) {
    console.log("[Fulfill] Verifying Stripe session:", paymentId);
    const stripeSession = await verifyStripeSession(paymentId);
    if (!stripeSession) {
      console.error("[Fulfill] Stripe session verification failed (null).");
      throw new Error("Stripe session could not be verified or payment not completed.");
    }
    console.log("[Fulfill] Stripe session verified. Status:", stripeSession.status);
    if (stripeSession.status !== "paid") {
      throw new Error(`Stripe payment status is not paid (got ${stripeSession.status}).`);
    }
    // Use email from Stripe session if not provided
    if (!normalizedEmail && stripeSession.email) {
      normalizedEmail = stripeSession.email.toLowerCase();
      console.log("[Fulfill] Using email from Stripe session:", normalizedEmail);
    }
  }

  if (!normalizedProductId) {
    console.error("[Fulfill] Logic error: normalizedProductId is empty.");
    throw new Error("Missing productId for course access.");
  }
  if (!normalizedEmail) {
    console.error("[Fulfill] Logic error: normalizedEmail is empty.");
    throw new Error("Missing customer email for course access.");
  }

  console.log("[Fulfill] Querying storefront_courses for offering_id:", normalizedProductId);
  const { data: course, error: courseError } = await supabase
    .from("storefront_courses")
    .select("id,offering_id,title,description,access_period_days,is_active")
    .eq("offering_id", normalizedProductId)
    .eq("is_active", true)
    .maybeSingle();

  if (courseError) {
    console.error("[Fulfill] Database error during course lookup:", courseError.message);
    throw courseError;
  }
  if (!course) {
    console.warn("[Fulfill] No active course found for offering_id:", normalizedProductId);
    return { hasCourse: false, accessUrl: "", course: null };
  }

  console.log("[Fulfill] Course matched:", course.title, "ID:", course.id);

  const now = new Date();
  const expiresAt =
    Number.isFinite(Number(course.access_period_days)) && Number(course.access_period_days) > 0
      ? new Date(now.getTime() + Number(course.access_period_days) * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data: existing } = await supabase
    .from("storefront_course_access")
    .select("id,access_token,access_url,expires_at")
    .eq("course_id", course.id)
    .eq("customer_email", normalizedEmail)
    .is("revoked_at", null)
    .maybeSingle();

  let access = existing;
  let createdAccess = false;

  if (!access) {
    const { data: inserted, error: insertError } = await supabase
      .from("storefront_course_access")
      .insert({
        course_id: course.id,
        offering_id: normalizedProductId,
        customer_email: normalizedEmail,
        customer_name: customerName || null,
        user_id: userId || null,
        payment_provider: provider,
        payment_id: paymentId || null,
        order_id: orderId || null,
        package_id: packageId || null,
        amount: amount ?? null,
        currency: currency || null,
        starts_at: now.toISOString(),
        expires_at: expiresAt,
      })
      .select("id,access_token,expires_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    const accessUrl = buildAccessUrl(inserted.access_token);
    const { data: updated, error: updateError } = await supabase
      .from("storefront_course_access")
      .update({ access_url: accessUrl })
      .eq("id", inserted.id)
      .select("id,access_token,access_url,expires_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    access = updated;
    createdAccess = true;
  } else if (access && (userId || !access.access_url)) {
    const accessUrl = access.access_url || buildAccessUrl(access.access_token);
    const { data: updatedExisting, error: updateExistingError } = await supabase
      .from("storefront_course_access")
      .update({
        ...(userId ? { user_id: userId } : {}),
        ...(!access.access_url ? { access_url: accessUrl } : {}),
      })
      .eq("id", access.id)
      .select("id,access_token,access_url,expires_at")
      .single();

    if (updateExistingError) {
      throw updateExistingError;
    }
    access = updatedExisting;
  }

  const accessUrl = access.access_url || buildAccessUrl(access.access_token);
  const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL");

  if (createdAccess) {
    await supabase.from("storefront_admin_notifications").insert({
      type: "course_purchase",
      title: `Course purchased: ${course.title}`,
      message: `${customerName || normalizedEmail} bought ${course.title}.`,
      course_id: course.id,
      offering_id: normalizedProductId,
      purchase_id: access.id,
      customer_email: normalizedEmail,
      customer_name: customerName || null,
      metadata: {
        provider,
        paymentId,
        orderId,
        packageId,
        amount,
        currency,
        accessUrl,
      },
    });

    await sendEmail({
      to: normalizedEmail,
      subject: `Your access link for ${course.title}`,
      html: `
      <p>Hi ${customerName || "there"},</p>
      <p>Your course access is ready.</p>
      <p><a href="${accessUrl}">Open ${course.title}</a></p>
      ${access.expires_at ? `<p>This access link is valid until ${access.expires_at}.</p>` : "<p>You have lifetime access to this course.</p>"}
    `,
    });

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New course purchase: ${course.title}`,
        html: `
          <p>${customerName || normalizedEmail} bought ${course.title}.</p>
          <p>Email: ${normalizedEmail}</p>
          <p>Provider: ${provider}</p>
          <p>Payment ID: ${paymentId || "N/A"}</p>
          <p>Access link: <a href="${accessUrl}">${accessUrl}</a></p>
        `,
      });
    }
  }

  return {
    hasCourse: true,
    accessUrl,
    course: {
      id: course.id,
      title: course.title,
      expiresAt: access.expires_at,
    },
  };
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
    
    // Check for internal secret (from webhook) OR valid Admin session
    const secret = Deno.env.get("FULFILLMENT_SECRET");
    const isSecretValid = secret && authorization === `Bearer ${secret}`;
    console.log("[Fulfill] Internal secret check:", isSecretValid ? "Valid" : "Invalid/Missing");
    
    let isAdmin = false;
    if (!isSecretValid) {
      console.log("[Fulfill] Checking for Admin session...");
      const token = authorization.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error("[Fulfill] Auth error:", authError.message);
      } else if (user?.email) {
        console.log("[Fulfill] User authenticated:", user.email);
        const { data: admin } = await supabase
          .from("storefront_admin_users")
          .select("email")
          .eq("email", user.email)
          .maybeSingle();
        
        if (admin) {
          isAdmin = true;
          console.log("[Fulfill] User verified as Admin.");
        } else {
          console.log("[Fulfill] User is NOT an Admin.");
        }
      }
    }

    if (!isSecretValid && !isAdmin) {
      console.error("[Fulfill] Unauthorized attempt.");
      return json(401, { error: "Unauthorized fulfillment request. Please sign in as an admin." });
    }

    const body = await request.json();
    console.log("[Fulfill] Body received:", JSON.stringify(body));

    const result = await fulfillCourseAccess({
      amount: body.amount ?? null,
      currency: body.currency || null,
      customerEmail: body.email || body.customerEmail || null,
      customerName: body.fullName || body.customerName || null,
      orderId: body.orderId || null,
      packageId: body.packageId || null,
      paymentId: body.paymentId || body.stripeSessionId || null,
      provider: body.provider || "stripe",
      productId: body.productId,
      userId: body.userId || null,
    });

    console.log("[Fulfill] Result:", JSON.stringify(result));
    return json(200, { status: "success", ...result });
  } catch (error) {
    console.error("[Fulfill] Fatal error:", error instanceof Error ? error.message : error);
    return json(400, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown fulfillment error.",
    });
  }
});
