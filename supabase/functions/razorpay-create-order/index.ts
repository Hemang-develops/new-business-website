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
      throw new Error("Missing productId.");
    }
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 10) {
      throw new Error("Invalid Razorpay order amount.");
    }
    if (normalizedCurrency !== "INR") {
      throw new Error("Razorpay is currently configured for INR payments only.");
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
      throw new Error(payload?.error?.description || payload?.error?.reason || "Unable to create Razorpay order.");
    }

    return json(200, {
      keyId,
      orderId: payload.id,
      amount: payload.amount,
      currency: payload.currency,
      receipt: payload.receipt,
    });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : "Unknown Razorpay order creation error.",
    });
  }
});
