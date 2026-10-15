import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

// ponytail: single APP_ENV toggle switches test↔prod keys; set APP_ENV=prod to go live
const getStripeSecret = () => {
  const isProd = Deno.env.get("APP_ENV") === "prod";
  const key = isProd
    ? Deno.env.get("STRIPE_SECRET_KEY_PROD")
    : Deno.env.get("STRIPE_SECRET_KEY_TEST") ?? Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error(`Missing Stripe secret key for env: ${isProd ? "prod" : "test"}.`);
  return key;
};

// ponytail: mirrors APP_ENV key logic — prod → SITE_URL_PROD, else → SITE_URL_DEV → Origin → localhost
const getSiteUrl = (req?: Request) => {
  const isProd = Deno.env.get("APP_ENV") === "prod";
  const env = isProd
    ? Deno.env.get("SITE_URL_PROD")
    : Deno.env.get("SITE_URL_DEV") ?? Deno.env.get("SITE_URL");
  if (env) return env.replace(/\/$/, "");
  const origin = req?.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  return "http://localhost:5173";
};

const getSupabaseAdminClient = () => createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { persistSession: false } },
);

const getFxRate = async (currencyCode: string) => {
  const normalized = String(currencyCode || "").trim().toUpperCase();
  if (!normalized || normalized === "USD") {
    return 1;
  }

  const response = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!response.ok) {
    throw new Error("Unable to fetch live FX rates.");
  }

  const payload = await response.json() as Record<string, unknown>;
  const rate = Number((payload.rates as Record<string, number> | undefined)?.[normalized]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Unsupported checkout currency: ${currencyCode}.`);
  }

  return rate;
};

const getCanonicalProductAmount = async (productId: string, currency: string) => {
  const normalizedProductId = String(productId || "").trim();
  const normalizedCurrency = String(currency || "").trim().toLowerCase();

  if (!normalizedProductId || !normalizedCurrency) {
    throw new Error("Product and currency are required.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: configRow, error: configError } = await supabase
    .from("storefront_checkout_configs")
    .select("config")
    .eq("product_id", normalizedProductId)
    .maybeSingle();

  if (configError) {
    throw configError;
  }

  const config = configRow?.config && typeof configRow.config === "object" ? configRow.config as Record<string, any> : null;
  if (!config) {
    throw new Error("Checkout pricing for this product is not configured.");
  }

  const currencies = config.currencies && typeof config.currencies === "object" ? config.currencies as Record<string, any> : {};
  const usdAmount = Number(currencies.usd?.unitAmount ?? 0);
  if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
    throw new Error("This product does not have a valid USD base price.");
  }

  if (normalizedCurrency === "usd") {
    return usdAmount;
  }

  const fxRate = await getFxRate(normalizedCurrency);
  return Math.max(1, Math.round(usdAmount * fxRate));
};

const assertPurchasable = async (productId: string, email: string) => {
  const supabase = getSupabaseAdminClient();
  const { data: offering, error: offeringError } = await supabase
    .from("storefront_offerings")
    .select("id,is_active,fulfillment_mode,fulfillment_version")
    .eq("id", productId)
    .maybeSingle();
  if (offeringError) throw offeringError;
  if (!offering || !offering.is_active) throw new Error("This product is not currently available.");
  if (offering.fulfillment_mode !== "digital") return;

  const { data: purchase, error: purchaseError } = await supabase
    .from("storefront_purchases")
    .select("id,expires_at")
    .eq("offering_id", productId)
    .eq("fulfillment_version", offering.fulfillment_version || 1)
    .eq("status", "paid")
    .ilike("customer_email", email.trim().toLowerCase())
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1)
    .maybeSingle();
  if (purchaseError) throw purchaseError;
  if (purchase) throw new Error("You already have access to this product.");
};

const assertPriceMatchesProductConfig = async (productId: string, currency: string, amount: number) => {
  const normalizedProductId = String(productId || "").trim();
  const normalizedCurrency = String(currency || "").trim();
  const numericAmount = Number(amount);

  if (!normalizedProductId || !normalizedCurrency || !Number.isFinite(numericAmount)) {
    throw new Error("A valid product, currency, and amount are required.");
  }

  const expectedAmount = await getCanonicalProductAmount(normalizedProductId, normalizedCurrency);
  // ponytail: live FX rates change between the display and server validation paths,
  // so a tiny tolerance prevents valid local-currency checkouts from being rejected
  // by rounding drift while still rejecting materially incorrect amounts.
  const tolerance = Math.max(1, Math.round(expectedAmount * 0.01));
  if (Math.abs(numericAmount - expectedAmount) > tolerance) {
    throw new Error("The checkout amount does not match this product’s configured price.");
  }
};

const verifyCheckoutSession = async (sessionId: string, productId: string) => {
  if (!sessionId || !productId) return false;

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { "Authorization": `Bearer ${getStripeSecret()}` },
    });
    if (!response.ok) return false;

    const session = await response.json() as Record<string, any>;
    const metadata = session.metadata as Record<string, unknown> | undefined;
    const sessionCurrency = String(session.currency || "usd").trim().toLowerCase();
    const sessionAmount = Number(session.amount_total || 0);

    if (session.payment_status !== "paid" || String(metadata?.productId || "") !== productId) {
      return false;
    }

    const expectedAmount = await getCanonicalProductAmount(productId, sessionCurrency);
    const tolerance = Math.max(1, Math.round(expectedAmount * 0.01));
    return Math.abs(sessionAmount - expectedAmount) <= tolerance;
  } catch {
    return false;
  }
};

const createStripeCheckoutSession = async (body: Record<string, unknown>, req: Request) => {
  const stripeSecret = getStripeSecret();
  const siteUrl = getSiteUrl(req);

  const {
    productId = "",
    packageId,
    packageLabel = "Standard Plan",
    presentmentCurrency = "usd",
    presentmentUnitAmount = 0,
    email = "",
    firstName = "",
    lastName = "",
    country = "",
    mode = "payment",
  } = body;

  if (!email) {
    throw new Error("Email is required.");
  }

  await assertPurchasable(String(productId), String(email));

  if (!presentmentUnitAmount || !presentmentCurrency) {
    throw new Error("Amount and currency are required.");
  }

  await assertPriceMatchesProductConfig(String(productId), String(presentmentCurrency), Number(presentmentUnitAmount));

  const successUrl = `${siteUrl}/buy/${encodeURIComponent(String(productId))}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteUrl}/buy/${encodeURIComponent(String(productId))}/cancel`;

  const lineItems = [
    {
      price_data: {
        currency: String(presentmentCurrency).toLowerCase(),
        product_data: {
          name: String(packageLabel),
          description: packageId ? `Package: ${packageId}` : "Purchase",
          metadata: {
            offering_id: String(productId),
            package_id: packageId ? String(packageId) : "",
          },
        },
        unit_amount: Number(presentmentUnitAmount),
      },
      quantity: 1,
    },
  ];

  const params = new URLSearchParams({
    // Restrict to card only — dashboard-enabled methods (UPI, GPay) won't be injected
    "payment_method_types[0]": "card",
    "mode": mode === "subscription" ? "subscription" : "payment",
    "success_url": successUrl,
    "cancel_url": cancelUrl,
    "customer_email": email,
    "metadata[productId]": String(productId),
    "metadata[firstName]": String(firstName),
    "metadata[lastName]": String(lastName),
    "metadata[country]": String(country),
  });

  if (packageId) {
    params.set("metadata[packageId]", String(packageId));
  }

  // Add line items
  lineItems.forEach((item, idx) => {
    const prefix = `line_items[${idx}]`;
    params.set(`${prefix}[price_data][currency]`, item.price_data.currency);
    params.set(`${prefix}[price_data][unit_amount]`, String(item.price_data.unit_amount));
    params.set(`${prefix}[price_data][product_data][name]`, item.price_data.product_data.name);
    params.set(`${prefix}[price_data][product_data][description]`, String(item.price_data.product_data.description || ""));
    if (item.price_data.product_data.metadata?.offering_id) {
      params.set(`${prefix}[price_data][product_data][metadata][offering_id]`, String(item.price_data.product_data.metadata.offering_id));
    }
    params.set(`${prefix}[quantity]`, String(item.quantity));
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Stripe API error:", error);
    throw new Error(`Stripe API error: ${error}`);
  }

  const session = await response.json() as Record<string, unknown>;
  return session;
};

Deno.serve(async (request) => {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = String(payload.action || "").trim();
    const sessionId = String(payload.sessionId || payload.session_id || "").trim();
    const productId = String(payload.productId || payload.offeringId || "").trim();

    // If this is a verification request (action === "verify-session" OR sessionId present without email/amount)
    if (action === "verify-session" || action === "verify" || (sessionId && !payload.email && !payload.presentmentUnitAmount)) {
      const verified = await verifyCheckoutSession(sessionId, productId);
      return json(200, { verified });
    }

    const session = await createStripeCheckoutSession(payload, request);

    return json(200, {
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Stripe endpoint error:", error);
    const status = error instanceof Error && error.message.includes("required") ? 400 : 500;
    return json(status, {
      error: error instanceof Error ? error.message : "Failed to process request",
    });
  }
});
