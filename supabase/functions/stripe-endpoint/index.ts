const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

const getStripeSecret = () => {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }
  return secret;
};

const getSiteUrl = () => {
  const url = Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";
  return url.replace(/\/$/, "");
};

const createStripeCheckoutSession = async (body: Record<string, unknown>) => {
  const stripeSecret = getStripeSecret();
  const siteUrl = getSiteUrl();

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

  if (!presentmentUnitAmount || !presentmentCurrency) {
    throw new Error("Amount and currency are required.");
  }

  const successUrl = `${siteUrl}/buy/${productId}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteUrl}/buy/${productId}/cancel`;

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
    const body = await request.json() as Record<string, unknown>;
    const session = await createStripeCheckoutSession(body);

    return json(200, {
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Stripe endpoint error:", error);
    const status = error instanceof Error && error.message.includes("required") ? 400 : 500;
    return json(status, {
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    });
  }
});
