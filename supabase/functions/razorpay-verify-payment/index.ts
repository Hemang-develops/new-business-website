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
    const requestBody = await request.json();
    const action = String(requestBody?.action || "").trim();

    if (action === "verify-return") {
      const paymentId = String(requestBody?.paymentId || requestBody?.razorpay_payment_id || "").trim();
      const productId = String(requestBody?.productId || "").trim();

      if (!paymentId || !productId) {
        return json(400, { verified: false, error: "Payment and product are required." });
      }

      const { data: purchase, error: purchaseError } = await getAdminClient()
        .from("storefront_purchases")
        .select("id")
        .eq("payment_provider", "razorpay")
        .eq("payment_id", paymentId)
        .eq("offering_id", productId)
        .eq("status", "paid")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();

      if (purchaseError) throw purchaseError;
      return json(200, { verified: Boolean(purchase) });
    }

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
    } = requestBody;

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

    if (paymentPayload.status !== "captured") {
      throw new Error(`Razorpay payment is not captured yet (status: ${paymentPayload.status || "unknown"}).`);
    }

    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(normalizedOrderId)}`, {
      headers: {
        Authorization: header,
        "Content-Type": "application/json",
      },
    });
    const orderPayload = await orderResponse.json();
    if (!orderResponse.ok) {
      return json(getRazorpayErrorStatus(orderResponse.status), {
        status: "failed",
        error: orderPayload?.error?.description || "Unable to fetch Razorpay order details.",
      });
    }

    const orderProductId = String(orderPayload?.notes?.productId || "").trim();
    if (
      !orderProductId ||
      orderProductId !== String(productId || "").trim() ||
      String(paymentPayload.order_id || "") !== normalizedOrderId
    ) {
      return json(400, {
        status: "failed",
        error: "Razorpay payment does not match the requested product.",
      });
    }

    if (
      Number(paymentPayload.amount || 0) !== Number(orderPayload.amount || 0) ||
      String(paymentPayload.currency || "").toUpperCase() !== String(orderPayload.currency || "").toUpperCase()
    ) {
      return json(400, {
        status: "failed",
        error: "Razorpay payment amount does not match its verified order.",
      });
    }

    const customerEmail =
      String(email || paymentPayload.email || paymentPayload.notes?.email || "").trim();
    const customerName =
      String(fullName || paymentPayload.notes?.fullName || [firstName, lastName].filter(Boolean).join(" ") || "").trim();
    const courseAccess = productId && customerEmail
      ? await fulfillUnifiedPurchase({
          amount: paymentPayload.amount ?? null,
          currency: paymentPayload.currency || null,
          customerEmail,
          customerName,
          country: paymentPayload.notes?.country || null,
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
