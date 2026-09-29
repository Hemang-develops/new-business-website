import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

export const getAdminClient = () => {
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
  const replyTo = Deno.env.get("EMAIL_REPLY_TO");
  if (!apiKey || !from || !to) {
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Unable to send email: ${text}`);
  }

  return { skipped: false };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const recordPurchase = async ({
  offering,
  customerEmail,
  customerName,
  country,
  paymentProvider,
  paymentId,
  orderId,
  amount,
  currency,
  userId,
}: {
  offering: Record<string, any>;
  customerEmail: string;
  customerName?: string | null;
  country?: string | null;
  paymentProvider: string;
  paymentId: string;
  orderId?: string | null;
  amount?: number | null;
  currency?: string | null;
  userId?: string | null;
}) => {
  const supabase = getAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("storefront_purchases")
    .select("id,delivery_status,delivery_url")
    .eq("payment_provider", paymentProvider)
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }
  if (existing) {
    return { purchase: existing, created: false };
  }

  const expiresAt = offering.access_expiry_days
    ? new Date(Date.now() + Number(offering.access_expiry_days) * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const { data: purchase, error } = await supabase
    .from("storefront_purchases")
    .insert({
      offering_id: offering.id,
      customer_email: customerEmail,
      customer_name: customerName || null,
      country: country || null,
      user_id: userId || null,
      payment_provider: paymentProvider,
      payment_id: paymentId,
      order_id: orderId || null,
      amount: amount ?? null,
      currency: currency || null,
      fulfillment_mode: offering.fulfillment_mode,
      fulfillment_version: Number(offering.fulfillment_version || 1),
      expires_at: expiresAt,
    })
    .select("id,delivery_status,delivery_url")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate } = await supabase
        .from("storefront_purchases")
        .select("id,delivery_status,delivery_url")
        .eq("payment_provider", paymentProvider)
        .eq("payment_id", paymentId)
        .maybeSingle();
      return { purchase: duplicate, created: false };
    }
    throw error;
  }
  return { purchase, created: true };
};

const updatePurchase = async (purchaseId: string, values: Record<string, unknown>) => {
  const { error } = await getAdminClient()
    .from("storefront_purchases")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", purchaseId);
  if (error) throw error;
};

export const fulfillCourseAccess = async ({
  amount,
  currency,
  customerEmail,
  customerName,
  country,
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
  country?: string | null;
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

  if (!normalizedProductId) {
    throw new Error("Missing productId for course access.");
  }
  if (!normalizedEmail) {
    throw new Error("Missing customer email for course access.");
  }

  const { data: offering, error: offeringError } = await supabase
    .from("storefront_offerings")
    .select("id,title,summary,booking_url,fulfillment_mode,digital_delivery_type,delivery_url,reading_email_body,access_expiry_days,fulfillment_version")
    .eq("id", normalizedProductId)
    .maybeSingle();

  if (offeringError) {
    throw offeringError;
  }
  if (!offering) {
    throw new Error("Offering was not found for this payment.");
  }

  const purchaseResult = await recordPurchase({
    offering,
    customerEmail: normalizedEmail,
    customerName,
    country,
    paymentProvider: provider,
    paymentId: String(paymentId || orderId || "").trim(),
    orderId,
    amount,
    currency,
    userId,
  });
  if (!purchaseResult.purchase) {
    throw new Error("Unable to record purchase.");
  }
  if (!purchaseResult.created) {
    return { hasCourse: false, accessUrl: purchaseResult.purchase.delivery_url || "", course: null };
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
    const offeringTitle = offering?.title || normalizedProductId;
    const bookingUrl = offering?.booking_url || "";
    const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL_1") ||Deno.env.get("ADMIN_NOTIFY_EMAIL_2") || Deno.env.get("EMAIL_REPLY_TO");

    try {
      await supabase.from("storefront_admin_notifications").insert({
        type: "offering_purchase",
        title: `Order placed: ${offeringTitle}`,
        message: `${customerName || normalizedEmail} purchased ${offeringTitle}.`,
        offering_id: normalizedProductId,
        customer_email: normalizedEmail,
        customer_name: customerName || null,
        metadata: { provider, paymentId, orderId, packageId, amount, currency },
      });
    } catch (e) {
      console.warn("[Fulfill] Failed to insert admin notification:", e);
    }

    const confirmationEmail = await sendEmail({
      to: normalizedEmail,
      subject: `Order Confirmation: ${offeringTitle}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #030406; color: #ffffff; padding: 40px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #5eead4; margin-top: 0;">Thank you for your purchase!</h2>
          <p style="color: rgba(255,255,255,0.8);">Hi ${escapeHtml(customerName || "there")},</p>
          <p style="color: rgba(255,255,255,0.8);">Your order for <strong style="color: #fff;">${escapeHtml(offeringTitle)}</strong> has been confirmed.</p>
          
          ${bookingUrl 
            ? `<p style="margin: 32px 0;"><a href="${bookingUrl}" style="background-color: #5eead4; color: #030406; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">Schedule Your Session</a></p>` 
            : offering.fulfillment_mode === "booking" 
              ? `<p style="color: rgba(255,255,255,0.8);">Your payment is confirmed. If the scheduling link is not available, reply to this email and the admin will arrange your session manually.</p>` 
              : `<p style="color: rgba(255,255,255,0.8);">Your purchase is confirmed. We will begin fulfillment using the details on this product.</p>`}
          
          ${offering.fulfillment_mode === "digital" && offering.digital_delivery_type === "download" && offering.delivery_url 
            ? `<p style="margin: 32px 0;"><a href="${offering.delivery_url}" style="background-color: #5eead4; color: #030406; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">Open your digital product</a></p>` 
            : ""}
          
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0; color: rgba(255,255,255,0.8);">Warmly,<br/><strong style="color: #fff;">Nehal Patel</strong><br/><span style="color: #5eead4; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">High Frequencies 11</span></p>
          </div>
        </div>
      `,
    });

    let readingEmail = { skipped: true };
    if (offering.fulfillment_mode === "reading" && offering.reading_email_body) {
      readingEmail = await sendEmail({
        to: normalizedEmail,
        subject: `${offeringTitle} - your reading`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #030406; color: #ffffff; padding: 40px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="color: #5eead4; margin-top: 0;">Your reading is ready</h2>
            <p style="color: rgba(255,255,255,0.8);">Hi ${escapeHtml(customerName || "there")},</p>
            <div style="white-space: pre-wrap; color: rgba(255,255,255,0.9); line-height: 1.8;">${escapeHtml(String(offering.reading_email_body))}</div>
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; color: rgba(255,255,255,0.8);">Warmly,<br/><strong style="color: #fff;">Nehal Patel</strong><br/><span style="color: #5eead4; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">High Frequencies 11</span></p>
            </div>
          </div>
        `,
      });
    }

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New purchase: ${offeringTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h3>New Purchase Received</h3>
            <p><strong>Item:</strong> ${offeringTitle}</p>
            <p><strong>Customer Email:</strong> ${normalizedEmail}</p>
            <p><strong>Customer Name:</strong> ${customerName || "N/A"}</p>
            <p><strong>Payment Provider:</strong> ${provider}</p>
            <p><strong>Payment ID:</strong> ${paymentId || "N/A"}</p>
            <p><strong>Amount:</strong> ${amount ? `${amount} ${currency || ""}` : "N/A"}</p>
          </div>
        `,
      });
    }

    const deliveryUrl = offering.fulfillment_mode === "digital" && offering.digital_delivery_type === "download"
      ? offering.delivery_url || null
      : null;
    await updatePurchase(purchaseResult.purchase.id, {
      delivery_status: confirmationEmail.skipped || (offering.fulfillment_mode === "reading" && offering.reading_email_body && readingEmail.skipped)
        ? "manual"
        : "delivered",
      delivery_url: deliveryUrl,
      fulfilled_at: new Date().toISOString(),
    });

    return { hasCourse: false, accessUrl: deliveryUrl || "", course: null };
  }

  const now = new Date();
  const expiresAt =
    Number.isFinite(Number(offering.access_expiry_days || course.access_period_days)) && Number(offering.access_expiry_days || course.access_period_days) > 0
      ? new Date(now.getTime() + Number(offering.access_expiry_days || course.access_period_days) * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const existingQuery = supabase
    .from("storefront_course_access")
    .select("id,access_token,access_url,expires_at")
    .eq("course_id", course.id)
    .eq("customer_email", normalizedEmail)
    .is("revoked_at", null)
    .maybeSingle();

  const { data: existing } = await existingQuery;
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
  const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL_1") || Deno.env.get("ADMIN_NOTIFY_EMAIL_2") || Deno.env.get("EMAIL_REPLY_TO");

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
  }

  // Always send confirmation email to customer
  const courseEmail = await sendEmail({
    to: normalizedEmail,
    subject: `Your access link for ${course.title}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #030406; color: #ffffff; padding: 40px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #5eead4; margin-top: 0;">Your course access is ready</h2>
        <p style="color: rgba(255,255,255,0.8);">Hi ${escapeHtml(customerName || "there")},</p>
        <p style="color: rgba(255,255,255,0.8);">Your access to <strong style="color: #fff;">${escapeHtml(course.title)}</strong> has been granted.</p>
        
        <p style="margin: 32px 0;"><a href="${accessUrl}" style="background-color: #5eead4; color: #030406; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">Open ${escapeHtml(course.title)}</a></p>
        
        ${access.expires_at 
          ? `<p style="color: rgba(255,255,255,0.7); font-size: 14px;">This access link is valid until ${new Date(access.expires_at).toLocaleDateString()}.</p>` 
          : `<p style="color: rgba(255,255,255,0.7); font-size: 14px;">You have lifetime access to this course.</p>`}
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="margin: 0; color: rgba(255,255,255,0.8);">Warmly,<br/><strong style="color: #fff;">Nehal Patel</strong><br/><span style="color: #5eead4; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">High Frequencies 11</span></p>
        </div>
      </div>
    `,
  });

  if (adminEmail && createdAccess) {
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

  await updatePurchase(purchaseResult.purchase.id, {
    delivery_status: courseEmail.skipped ? "manual" : "delivered",
    delivery_url: accessUrl,
    fulfilled_at: courseEmail.skipped ? null : new Date().toISOString(),
  });

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
