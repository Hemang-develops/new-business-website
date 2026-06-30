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

const getResendConfig = () => {
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "";
  const fromName = Deno.env.get("RESEND_FROM_NAME") || "";
  const namedFrom = fromName && fromEmail ? `${fromName} <${fromEmail}>` : fromEmail;

  return {
    apiKey: Deno.env.get("RESEND_API_KEY") || "",
    from: Deno.env.get("EMAIL_FROM") || namedFrom,
  };
};

const normalizeEmail = (email: unknown) => (typeof email === "string" ? email.trim().toLowerCase() : "");

type AudienceRecipient = {
  email: string;
  source: "newsletter" | "buyer" | "meeting" | "test";
};

const dedupeRecipients = (recipients: AudienceRecipient[]) => {
  const byEmail = new Map<string, AudienceRecipient>();
  for (const recipient of recipients) {
    const email = normalizeEmail(recipient.email);
    if (!email || byEmail.has(email)) continue;
    byEmail.set(email, { email, source: recipient.source });
  }
  return [...byEmail.values()];
};

const buildToken = () => crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");

const buildUnsubscribeUrl = (token: string) => {
  const siteUrl = getSiteUrl() || "http://localhost:5173";
  return `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
};

const getTemplateStyles = () => ({
  primary: Deno.env.get("NEWSLETTER_PRIMARY_COLOR") || "#2dd4bf",
  dark: Deno.env.get("NEWSLETTER_DARK_COLOR") || "#030406",
  accent: Deno.env.get("NEWSLETTER_ACCENT_COLOR") || "#f0fdfa",
});

const getBrandName = () => Deno.env.get("BRAND_NAME") || "High Frequencies 11";

const escapeHtml = (value: unknown) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const renderButton = (label: string, href: string) => {
  const { primary } = getTemplateStyles();
  return `<p style="margin:28px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;border-radius:999px;background:${primary};color:#03110f;padding:14px 22px;font-weight:800;text-decoration:none;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">${escapeHtml(label || "Open link")}</a></p>`;
};

const renderBlocks = (blocks: unknown, fallbackHtml: string) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return fallbackHtml;

  return blocks
    .map((block) => {
      const item = block as Record<string, string>;
      switch (item.type) {
        case "heading":
          return `<h2 style="font-size:28px;line-height:1.15;margin:0 0 18px;color:#ffffff;">${escapeHtml(item.value)}</h2>`;
        case "paragraph":
        case "rich_text":
          return `<div style="font-size:16px;line-height:1.75;color:#d8dee9;margin:0 0 20px;">${item.value || ""}</div>`;
        case "image": {
          if (!item.url) return "";
          const widthStyle = item.width ? `width:${escapeHtml(item.width)}px;` : "width:100%;";
          const heightStyle = item.height ? `height:${escapeHtml(item.height)}px;` : "height:auto;";
          const maxStyle = "max-width:100%;object-fit:cover;";
          return `<div style="text-align:center;margin:28px 0;"><img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt || "")}" style="display:inline-block;border-radius:18px;border:1px solid rgba(255,255,255,.10);${widthStyle}${heightStyle}${maxStyle}" /></div>`;
        }
        case "button":
          return item.href ? renderButton(item.label, item.href) : "";
        case "resource":
          return item.href ? `<div style="margin:22px 0;padding:18px;border:1px solid rgba(45,212,191,.22);border-radius:18px;background:rgba(45,212,191,.08);"><p style="margin:0 0 6px;color:#ffffff;font-weight:700;">${escapeHtml(item.title || "Resource")}</p><p style="margin:0 0 12px;color:#a7b0c0;">${escapeHtml(item.description)}</p><a href="${escapeHtml(item.href)}" style="color:${getTemplateStyles().primary};font-weight:700;">${escapeHtml(item.label || "Open resource")}</a></div>` : "";
        case "quote":
          return `<blockquote style="margin:24px 0;padding:18px 22px;border-left:4px solid ${getTemplateStyles().primary};background:rgba(255,255,255,.05);color:#eef2f7;font-size:18px;line-height:1.55;">${escapeHtml(item.value)}</blockquote>`;
        case "divider":
          return `<hr style="border:0;border-top:1px solid rgba(255,255,255,.12);margin:30px 0;" />`;
        default:
          return "";
      }
    })
    .join("\n");
};

const renderNewsletterHtml = ({
  subject,
  body,
  blocks,
  previewText,
  templateKey,
  templateLabel,
}: {
  subject: string;
  body: string;
  blocks: unknown;
  previewText?: string | null;
  templateKey?: string | null;
  templateLabel?: string | null;
}) => {
  const { primary } = getTemplateStyles();
  const brandName = getBrandName();
  const renderedBody = renderBlocks(blocks, body);
  const defaultLabel = templateKey === "offer" ? "Offer" : templateKey === "resource_drop" ? "Resource Drop" : templateKey === "announcement" ? "Announcement" : "Weekly Letter";
  const label = templateLabel || defaultLabel;

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#020617;font-family:Arial,Helvetica,sans-serif;color:#cbd5e1;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(previewText || subject)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:
      radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 38%),
      radial-gradient(circle at bottom, rgba(192,132,252,0.16), transparent 34%),
      linear-gradient(180deg, #0f172a 0%, #020617 100%);
      background-color:#020617;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;">
            <tr>
              <td style="padding-bottom:18px;text-align:center;">
                <div style="display:inline-block;padding:10px 18px;border:1px solid rgba(255,255,255,0.16);border-radius:999px;background:rgba(255,255,255,0.05);font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${primary};">
                  ${escapeHtml(brandName)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="border:1px solid rgba(255,255,255,0.1);border-radius:28px;background:rgba(15,23,42,0.84);padding:40px 32px;box-shadow:0 24px 80px rgba(0,0,0,0.32);">
                <div style="margin-bottom:18px;">
                  <span style="display:inline-block;padding:7px 12px;border-radius:999px;background:rgba(45,212,191,0.12);border:1px solid rgba(45,212,191,0.24);font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${primary};">
                    ${escapeHtml(label)}
                  </span>
                </div>

                <h1 style="margin:0 0 16px;font-size:34px;line-height:1.15;font-weight:700;color:#ffffff;">
                  ${escapeHtml(subject)}
                </h1>

                ${renderedBody}
              </td>
            </tr>

            <tr>
              <td style="padding:18px 12px 0;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:#64748b;">
                  You received this email because you subscribed to updates from ${escapeHtml(brandName)}.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                  If you no longer want updates, <a href="__UNSUBSCRIBE_URL__" style="color:${primary};text-decoration:underline;">unsubscribe here</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const markBroadcastFailed = async (
  supabase: ReturnType<typeof getAdminClient>,
  broadcastId: string,
  message: string,
  recipients = 0,
) => {
  await supabase
    .from("storefront_newsletter_broadcasts")
    .update({
      status: "failed",
      stats: {
        sent: 0,
        failed: recipients,
        recipients,
        error: message,
      },
    })
    .eq("id", broadcastId);
};

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sendViaResend = async ({
  apiKey,
  from,
  subject,
  html,
  recipient,
  unsubscribeUrl,
  attachments,
}: {
  apiKey: string;
  from: string;
  subject: string;
  html: string;
  recipient: string;
  unsubscribeUrl: string;
  attachments?: { filename: string; path: string }[];
}) => {
  const url = "https://api.resend.com/emails";
  const htmlWithFooter = html.replaceAll("__UNSUBSCRIBE_URL__", unsubscribeUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipient,
      subject,
      html: htmlWithFooter,
      text: `${stripHtml(html).replaceAll("__UNSUBSCRIBE_URL__", unsubscribeUrl)}\n\nUnsubscribe: ${unsubscribeUrl}`,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
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
    const broadcastId = String(body?.broadcast_id || body?.broadcastId || "").trim();
    if (!broadcastId) {
      throw new Error("Missing broadcast ID.");
    }

    const supabase = getAdminClient();
    const { data: broadcast, error: broadcastError } = await supabase
      .from("storefront_newsletter_broadcasts")
      .select("*")
      .eq("id", broadcastId)
      .maybeSingle();

    if (broadcastError) {
      throw broadcastError;
    }
    if (!broadcast) {
      return json(404, { error: "Broadcast not found." });
    }

    const testEmail = normalizeEmail(body?.test_email || body?.testEmail);

    const allAudience = async () => {
      const sources = await Promise.all([
        supabase.from("storefront_newsletter_subscriptions").select("normalized_email").eq("status", "subscribed"),
        supabase.from("storefront_course_access").select("customer_email"),
        supabase.from("storefront_booking_access").select("customer_email"),
      ]);
      const [newsletterRes, buyersRes, meetingsRes] = sources;
      if (newsletterRes.error) throw newsletterRes.error;
      if (buyersRes.error) throw buyersRes.error;
      if (meetingsRes.error) throw meetingsRes.error;
      return dedupeRecipients([
        ...(newsletterRes.data || []).map((row) => ({ email: normalizeEmail(row.normalized_email), source: "newsletter" as const })),
        ...(buyersRes.data || []).map((row) => ({ email: normalizeEmail(row.customer_email), source: "buyer" as const })),
        ...(meetingsRes.data || []).map((row) => ({ email: normalizeEmail(row.customer_email), source: "meeting" as const })),
      ]);
    };

    const newsletterAudience = async () => {
      const { data, error } = await supabase
        .from("storefront_newsletter_subscriptions")
        .select("normalized_email")
        .eq("status", "subscribed");
      if (error) throw error;
      return dedupeRecipients((data || []).map((row) => ({ email: normalizeEmail(row.normalized_email), source: "newsletter" as const })));
    };

    const buyersAudience = async () => {
      const { data, error } = await supabase.from("storefront_course_access").select("customer_email");
      if (error) throw error;
      return dedupeRecipients((data || []).map((row) => ({ email: normalizeEmail(row.customer_email), source: "buyer" as const })));
    };

    const meetingsAudience = async () => {
      const { data, error } = await supabase.from("storefront_booking_access").select("customer_email");
      if (error) throw error;
      return dedupeRecipients((data || []).map((row) => ({ email: normalizeEmail(row.customer_email), source: "meeting" as const })));
    };

    const courseSpecificAudience = async (courseId: string) => {
      const { data, error } = await supabase
        .from("storefront_course_access")
        .select("customer_email")
        .eq("course_id", courseId);
      if (error) throw error;
      return dedupeRecipients((data || []).map((row) => ({ email: normalizeEmail(row.customer_email), source: "buyer" as const })));
    };

    const offeringSpecificAudience = async (offeringId: string) => {
      const { data, error } = await supabase
        .from("storefront_booking_access")
        .select("customer_email")
        .eq("offering_id", offeringId);
      if (error) throw error;
      return dedupeRecipients((data || []).map((row) => ({ email: normalizeEmail(row.customer_email), source: "meeting" as const })));
    };

    let recipients: AudienceRecipient[] = [];
    const segmentMatch = broadcast.audience_segment ? String(broadcast.audience_segment).match(/^(course|offering):(.+)$/) : null;

    if (testEmail) {
      recipients = [{ email: testEmail, source: "test" }];
    } else if (segmentMatch && segmentMatch[1] === "course") {
      recipients = await courseSpecificAudience(segmentMatch[2]);
    } else if (segmentMatch && segmentMatch[1] === "offering") {
      recipients = await offeringSpecificAudience(segmentMatch[2]);
    } else {
      switch (broadcast.audience) {
        case "newsletter":
          recipients = await newsletterAudience();
          break;
        case "buyers":
          recipients = await buyersAudience();
          break;
        case "meetings":
          recipients = await meetingsAudience();
          break;
        default:
          recipients = await allAudience();
      }
    }

    if (!recipients.length) {
      await markBroadcastFailed(supabase, broadcast.id, "No recipients found for this audience.");
      return json(400, { error: "No recipients found for this audience." });
    }

    const { apiKey, from } = getResendConfig();
    if (!apiKey || !from) {
      const configError = "Resend is not configured. Set RESEND_API_KEY and EMAIL_FROM in your Supabase function environment to enable actual delivery.";
      await markBroadcastFailed(supabase, broadcast.id, configError, recipients.length);
      return json(501, {
        error: configError,
      });
    }

    const recipientEmails = recipients.map((recipient) => recipient.email);
    const { data: suppressedRows, error: suppressionError } = testEmail
      ? { data: [], error: null }
      : await supabase.from("storefront_newsletter_suppressions").select("normalized_email").in("normalized_email", recipientEmails);
    if (suppressionError) throw suppressionError;
    const suppressedEmails = new Set((suppressedRows || []).map((row) => normalizeEmail(row.normalized_email)));

    const html = renderNewsletterHtml({
      subject: broadcast.subject,
      body: broadcast.body,
      blocks: broadcast.body_blocks,
      previewText: broadcast.preview_text,
      templateKey: broadcast.template_key,
      templateLabel: broadcast.template_label || null,
    });

    const attachments = Array.isArray(broadcast.attachments) ? broadcast.attachments : [];

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const recipient of recipients) {
      const token = buildToken();
      const basePayload = {
        broadcast_id: broadcast.id,
        email: recipient.email,
        normalized_email: recipient.email,
        source: recipient.source,
        unsubscribe_token: token,
        updated_at: new Date().toISOString(),
      };

      await supabase.from("storefront_newsletter_unsubscribe_tokens").insert({
        email: recipient.email,
        normalized_email: recipient.email,
        token,
        source: recipient.source,
        broadcast_id: broadcast.id,
        expires_at: null,
      });

      if (suppressedEmails.has(recipient.email)) {
        skipped += 1;
        await supabase.from("storefront_newsletter_recipients").upsert({
          ...basePayload,
          status: "skipped_unsubscribed",
          error: "Recipient has unsubscribed from marketing emails.",
        }, { onConflict: "broadcast_id,normalized_email" });
        continue;
      }

      try {
        const response = await sendViaResend({
          apiKey,
          from,
          subject: broadcast.subject,
          html,
          recipient: recipient.email,
          unsubscribeUrl: buildUnsubscribeUrl(token),
          attachments,
        });
        sent += 1;
        await supabase.from("storefront_newsletter_recipients").upsert({
          ...basePayload,
          status: "sent",
          resend_email_id: response?.id || null,
          error: null,
          sent_at: new Date().toISOString(),
        }, { onConflict: "broadcast_id,normalized_email" });
      } catch (error) {
        failed += 1;
        await supabase.from("storefront_newsletter_recipients").upsert({
          ...basePayload,
          status: "failed",
          error: error instanceof Error ? error.message : "Unable to send newsletter.",
        }, { onConflict: "broadcast_id,normalized_email" });
      }
    }

    const status = failed > 0 || sent === 0 ? "failed" : "sent";
    await supabase
      .from("storefront_newsletter_broadcasts")
      .update({
        status,
        dispatched_at: new Date().toISOString(),
        sent_at: sent > 0 ? new Date().toISOString() : null,
        stats: { sent, failed, skipped, recipients: recipients.length },
      })
      .eq("id", broadcast.id);

    return json(200, { ok: true, recipients: recipients.length, sent, failed, skipped });
  } catch (error) {
    console.error(error);
    return json(500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});
