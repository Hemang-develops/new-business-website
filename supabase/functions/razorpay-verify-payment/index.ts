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
  const normalizedEmail = String(customerEmail || "").trim().toLowerCase();

  if (!normalizedProductId || !normalizedEmail) {
    return { hasCourse: false, accessUrl: "", course: null };
  }

  const { data: course, error: courseError } = await supabase
    .from("storefront_courses")
    .select("id,offering_id,title,description,access_period_days,is_active")
    .eq("offering_id", normalizedProductId)
    .eq("is_active", true)
    .maybeSingle();

  if (courseError) {
    throw courseError;
  }
  if (!course) {
    return { hasCourse: false, accessUrl: "", course: null };
  }

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

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const sign = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return hex(signature);
};

const getAuthHeader = () => {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  }

  const token = btoa(`${keyId}:${keySecret}`);
  return {
    keySecret,
    header: `Basic ${token}`,
  };
};

const getRazorpayErrorStatus = (status: number) => {
  if (status === 401 || status === 403) {
    return 401;
  }
  return 500;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const {
      orderId,
      razorpayOrderId,
      razorpay_order_id,
      paymentId,
      razorpay_payment_id,
      signature,
      razorpay_signature,
      productId,
      successPath,
      cancelPath,
      email,
      fullName,
      firstName,
      lastName,
      packageId,
      userId,
    } = await request.json();

    const normalizedOrderId = String(orderId || razorpayOrderId || razorpay_order_id || "").trim();
    const normalizedPaymentId = String(paymentId || razorpay_payment_id || "").trim();
    const normalizedSignature = String(signature || razorpay_signature || "").trim();

    if (!normalizedOrderId || !normalizedPaymentId || !normalizedSignature) {
      throw new Error("Missing Razorpay payment verification fields.");
    }

    const { keySecret, header } = getAuthHeader();
    const generatedSignature = await sign(`${normalizedOrderId}|${normalizedPaymentId}`, keySecret);
    if (generatedSignature !== normalizedSignature) {
      return json(400, {
        status: "failed",
        error: "Razorpay payment signature verification failed.",
      });
    }

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${normalizedPaymentId}`, {
      headers: {
        Authorization: header,
        "Content-Type": "application/json",
      },
    });

    const paymentPayload = await paymentResponse.json();
    if (!paymentResponse.ok) {
      return json(getRazorpayErrorStatus(paymentResponse.status), {
        status: "failed",
        error: paymentPayload?.error?.description || "Unable to fetch Razorpay payment details.",
      });
    }

    if (paymentPayload.status !== "captured" && paymentPayload.status !== "authorized") {
      throw new Error(`Unexpected Razorpay payment status: ${paymentPayload.status || "unknown"}.`);
    }

    const customerEmail =
      String(email || paymentPayload.email || paymentPayload.notes?.email || "").trim();
    const customerName =
      String(fullName || paymentPayload.notes?.fullName || [firstName, lastName].filter(Boolean).join(" ") || "").trim();
    const courseAccess = productId && customerEmail
      ? await fulfillCourseAccess({
          amount: paymentPayload.amount ?? null,
          currency: paymentPayload.currency || null,
          customerEmail,
          customerName,
          orderId: normalizedOrderId,
          packageId: packageId || paymentPayload.notes?.packageId || null,
          paymentId: normalizedPaymentId,
          provider: "razorpay",
          productId: String(productId),
          userId: userId || null,
        })
      : { hasCourse: false, accessUrl: "", course: null };

    return json(200, {
      status: "success",
      productId: productId ? String(productId) : "",
      successPath: successPath ? String(successPath) : "",
      cancelPath: cancelPath ? String(cancelPath) : "",
      paymentId: normalizedPaymentId,
      orderId: normalizedOrderId,
      method: paymentPayload.method || null,
      courseAccess,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Razorpay payment verification error.";
    const isConfigError = message.includes("RAZORPAY_KEY_ID") || message.includes("RAZORPAY_KEY_SECRET");

    return json(isConfigError ? 401 : 400, {
      status: "failed",
      error: message,
    });
  }
});
