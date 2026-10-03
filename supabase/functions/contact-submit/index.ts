import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailText, renderBrandedEmail } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json(200, { ok: true });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const support = typeof body?.support === "string" ? body.support.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return json(400, { error: "Name, email, and message are required." });
    }
    if (name.length > 120 || email.length > 254 || support.length > 200 || message.length > 8000) {
      return json(400, { error: "One or more fields exceed the allowed length." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: "Enter a valid email address." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("EMAIL_FROM");
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !from) {
      console.error("Contact form requires Supabase service credentials, RESEND_API_KEY, and EMAIL_FROM.");
      return json(500, { error: "The contact form is temporarily unavailable." });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data: siteSettings, error: settingsError } = await supabase
      .from("storefront_site_settings_composed_v")
      .select("brand_support_email")
      .eq("id", 1)
      .maybeSingle();
    if (settingsError) throw settingsError;

    const recipient = typeof siteSettings?.brand_support_email === "string"
      ? siteSettings.brand_support_email.trim()
      : "";
    if (!recipient) {
      console.error("No support email is configured in storefront site settings.");
      return json(500, { error: "The contact form is temporarily unavailable." });
    }

    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      support ? `Desired support: ${support}` : "",
      "",
      message,
    ].filter(Boolean).join("\n");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipient,
        reply_to: email,
        subject: `New website inquiry from ${name}`,
        text,
        html: renderBrandedEmail({
          title: "New website inquiry",
          previewText: `A new inquiry was submitted by ${name}.`,
          label: "Contact form",
          footerText: "Reply directly to this email to respond to the inquiry.",
          contentHtml: `<p><strong>Name:</strong> ${emailText(name)}</p><p><strong>Email:</strong> ${emailText(email)}</p>${support ? `<p><strong>Desired support:</strong> ${emailText(support)}</p>` : ""}<p><strong>Message:</strong><br>${emailText(message).replaceAll("\n", "<br>")}</p>`,
        }),
      }),
    });

    if (!emailResponse.ok) {
      console.error("Resend contact delivery failed:", await emailResponse.text());
      return json(502, { error: "We were unable to send your message. Please try again." });
    }

    return json(200, { message: "Thank you for sharing. I will be in touch shortly." });
  } catch (error) {
    console.error("Contact submission failed:", error);
    return json(500, { error: "We were unable to send your message. Please try again." });
  }
});