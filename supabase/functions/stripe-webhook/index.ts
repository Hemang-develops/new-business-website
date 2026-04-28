import Stripe from "npm:stripe@^14.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const getAdminClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {  
    auth: { persistSession: false },
  });
};

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Webhook secret or signature missing", { status: 400 });
  }

  let event;
  try {
    const bodyText = await req.text();
    event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    
    const productId = metadata.productId || metadata.offering_id;
    if (!productId) {
      console.log("No productId in metadata, skipping fulfillment.");
      return new Response("Skipped: no productId", { status: 200 });
    }

    const email = session.customer_email || session.customer_details?.email;
    if (!email) {
      console.log("No email found in session, skipping fulfillment.");
      return new Response("Skipped: no email", { status: 200 });
    }

    // Call our existing fulfillment logic! 
    // We can do this securely by constructing the payload and invoking `course-access-fulfill` locally via the Supabase client
    // OR we can just hit the Supabase function URL.
    try {
      const supabase = getAdminClient();
      console.log(`Triggering fulfillment for ${email} / product: ${productId}`);
      
      const { error } = await supabase.functions.invoke("course-access-fulfill", {
        body: {
          productId,
          email,
          userId: null, // Note: if we need userId, we might need it in metadata
          stripeSessionId: session.id,
          provider: "stripe",
          amount: session.amount_total,
          currency: session.currency,
          customerName: session.customer_details?.name || `${metadata.firstName || ""} ${metadata.lastName || ""}`.trim() || null,
        },
      });
      
      if (error) {
        console.error("Fulfillment function error:", error);
        return new Response("Fulfillment invocation failed", { status: 500 });
      }

      console.log("Fulfillment triggered successfully.");
    } catch (err) {
      console.error("Failed to call fulfillment function", err);
      return new Response("Internal Fulfillment Error", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
});
