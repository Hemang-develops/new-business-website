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

const getAuthHeader = () => {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  }

  const token = btoa(`${keyId}:${keySecret}`);
  return {
    keyId,
    header: `Basic ${token}`,
  };
};

const getRazorpayErrorStatus = (status: number) => {
  if (status === 401 || status === 403) {
    return 401;
  }
  return 500;
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const {
      productId,
      amount,
      currency,
      email,
      fullName,
      firstName,
      lastName,
      country,
      successPath,
      cancelPath,
      packageId,
      packageLabel,
    } = await request.json();

    const normalizedAmount = Number(amount);
    const normalizedCurrency = String(currency || "").toUpperCase();

    if (!productId) {
      return json(400, { error: "Missing productId." });
    }
    if (!email) {
      return json(400, { error: "Email is required." });
    }
    await assertPurchasable(String(productId), String(email));
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 100) {
      return json(400, { error: "Invalid Razorpay order amount. Minimum amount is 100 paise." });
    }
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      return json(400, { error: "Invalid Razorpay order currency." });
    }

    const expectedAmount = await getCanonicalProductAmount(String(productId), normalizedCurrency);
    // ponytail: live FX rates can drift slightly between checkout preview and order creation,
    // so accept a small tolerance instead of rejecting valid local-currency purchases.
    const tolerance = Math.max(1, Math.round(expectedAmount * 0.01));
    if (Math.abs(normalizedAmount - expectedAmount) > tolerance) {
      return json(400, { error: "The order amount does not match the configured price for this product." });
    }

    const receipt = `${String(productId).slice(0, 20)}-${Date.now()}`.slice(0, 40);
    const { keyId, header } = getAuthHeader();

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: header,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: normalizedAmount,
        currency: normalizedCurrency,
        receipt,
        notes: {
          productId: String(productId),
          packageId: packageId ? String(packageId) : "",
          packageLabel: packageLabel ? String(packageLabel) : "",
          email: email ? String(email) : "",
          fullName: fullName ? String(fullName) : "",
          firstName: firstName ? String(firstName) : "",
          lastName: lastName ? String(lastName) : "",
          country: country ? String(country) : "",
          successPath: successPath ? String(successPath) : "",
          cancelPath: cancelPath ? String(cancelPath) : "",
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return json(getRazorpayErrorStatus(response.status), {
        error: payload?.error?.description || payload?.error?.reason || "Unable to create Razorpay order.",
      });
    }

    return json(200, {
      keyId,
      orderId: payload.id,
      order_id: payload.id,
      amount: payload.amount,
      currency: payload.currency,
      receipt: payload.receipt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Razorpay order creation error.";
    const isConfigError = message.includes("RAZORPAY_KEY_ID") || message.includes("RAZORPAY_KEY_SECRET");

    return json(isConfigError ? 401 : 500, {
      error: message,
    });
  }
});
