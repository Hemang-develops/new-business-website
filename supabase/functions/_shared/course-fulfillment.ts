import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailButton, emailText, renderBrandedEmail } from "./email-template.ts";

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

    const safeCustomerName = emailText(customerName || "there");
    const safeOfferingTitle = emailText(offeringTitle);
    const confirmationContent = `
      <p style="margin:0 0 16px;">Hi ${safeCustomerName},</p>
      <p style="margin:0 0 16px;">Your order for <strong style="color:#ffffff;">${safeOfferingTitle}</strong> is confirmed and payment has been received.</p>
      ${bookingUrl
        ? `<p style="margin:0 0 8px;">Choose a time for your session:</p>${emailButton(bookingUrl, "Schedule your session")}`
        : offering.fulfillment_mode === "booking"
          ? `<p style="margin:0 0 16px;">Your payment is confirmed. If a scheduling link is not available, reply to this email and we will arrange your session.</p>`
          : `<p style="margin:0 0 16px;">We will begin fulfilling your purchase using the details for this offering.</p>`}
      ${offering.fulfillment_mode === "digital" && offering.digital_delivery_type === "download" && offering.delivery_url
        ? `${emailButton(String(offering.delivery_url), "Open your digital product")}`
        : ""}
    `;
    const confirmationEmail = await sendEmail({
      to: normalizedEmail,
      subject: `Order Confirmation: ${offeringTitle}`,
      html: renderBrandedEmail({
        title: "Thank you for your purchase",
        previewText: `Your order for ${offeringTitle} is confirmed.`,
        label: "Order confirmed",
        contentHtml: confirmationContent,
      }),
    });

    let readingEmail = { skipped: true };
    if (offering.fulfillment_mode === "reading" && offering.reading_email_body) {
      readingEmail = await sendEmail({
        to: normalizedEmail,
        subject: `${offeringTitle} - your reading`,
        html: renderBrandedEmail({
          title: "Your reading is ready",
          previewText: `${offeringTitle}: your reading is ready.`,
          label: "Your reading",
          contentHtml: `<p style="margin:0 0 18px;">Hi ${emailText(customerName || "there")},</p><div style="white-space:pre-wrap;">${escapeHtml(String(offering.reading_email_body))}</div>`,
        }),
      });
    }

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New purchase: ${offeringTitle}`,
        html: renderBrandedEmail({
          title: "New purchase received",
          previewText: `${offeringTitle} was purchased by ${customerName || normalizedEmail}.`,
          label: "Admin notification",
          footerText: "Storefront purchase notification",
          contentHtml: `<p><strong>Item:</strong> ${emailText(offeringTitle)}</p><p><strong>Customer email:</strong> ${emailText(normalizedEmail)}</p><p><strong>Customer name:</strong> ${emailText(customerName || "N/A")}</p><p><strong>Payment provider:</strong> ${emailText(provider)}</p><p><strong>Payment ID:</strong> ${emailText(paymentId || "N/A")}</p><p><strong>Amount:</strong> ${amount ? `${emailText(amount)} ${emailText(currency || "")}` : "N/A"}</p>`,
        }),
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
    html: renderBrandedEmail({
      title: "Your course access is ready",
      previewText: `Open ${course.title} and continue your course.`,
      label: "Course access",
      contentHtml: `<p style="margin:0 0 16px;">Hi ${emailText(customerName || "there")},</p><p style="margin:0 0 8px;">Your access to <strong style="color:#ffffff;">${emailText(course.title)}</strong> is ready.</p>${emailButton(accessUrl, `Open ${course.title}`)}${access.expires_at ? `<p style="margin:18px 0 0;font-size:13px;color:#a7b8b3;">Access is available until ${emailText(access.expires_at)}.</p>` : `<p style="margin:18px 0 0;font-size:13px;color:#a7b8b3;">You have lifetime access to this course.</p>`}`,
    }),
  });

  if (adminEmail && createdAccess) {
    await sendEmail({
      to: adminEmail,
      subject: `New course purchase: ${course.title}`,
      html: renderBrandedEmail({
        title: "New course purchase",
        previewText: `${course.title} was purchased by ${customerName || normalizedEmail}.`,
        label: "Admin notification",
        footerText: "Storefront course purchase notification",
        contentHtml: `<p>${emailText(customerName || normalizedEmail)} bought ${emailText(course.title)}.</p><p><strong>Email:</strong> ${emailText(normalizedEmail)}</p><p><strong>Provider:</strong> ${emailText(provider)}</p><p><strong>Payment ID:</strong> ${emailText(paymentId || "N/A")}</p><p><strong>Access link:</strong> ${emailButton(accessUrl, "Open course access")}</p>`,
      }),
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
