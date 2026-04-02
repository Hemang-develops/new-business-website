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
      paymentId,
      signature,
      productId,
      successPath,
      cancelPath,
    } = await request.json();

    const normalizedOrderId = String(orderId || razorpayOrderId || "").trim();
    const normalizedPaymentId = String(paymentId || "").trim();
    const normalizedSignature = String(signature || "").trim();

    if (!normalizedOrderId || !normalizedPaymentId || !normalizedSignature) {
      throw new Error("Missing Razorpay payment verification fields.");
    }

    const { keySecret, header } = getAuthHeader();
    const generatedSignature = await sign(`${normalizedOrderId}|${normalizedPaymentId}`, keySecret);
    if (generatedSignature !== normalizedSignature) {
      throw new Error("Razorpay payment signature verification failed.");
    }

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${normalizedPaymentId}`, {
      headers: {
        Authorization: header,
        "Content-Type": "application/json",
      },
    });

    const paymentPayload = await paymentResponse.json();
    if (!paymentResponse.ok) {
      throw new Error(paymentPayload?.error?.description || "Unable to fetch Razorpay payment details.");
    }

    if (paymentPayload.status !== "captured" && paymentPayload.status !== "authorized") {
      throw new Error(`Unexpected Razorpay payment status: ${paymentPayload.status || "unknown"}.`);
    }

    return json(200, {
      status: "success",
      productId: productId ? String(productId) : "",
      successPath: successPath ? String(successPath) : "",
      cancelPath: cancelPath ? String(cancelPath) : "",
      paymentId: normalizedPaymentId,
      orderId: normalizedOrderId,
      method: paymentPayload.method || null,
    });
  } catch (error) {
    return json(400, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown Razorpay payment verification error.",
    });
  }
});
