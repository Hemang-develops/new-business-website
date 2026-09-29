import { supabase } from "../supabase-client";

export const getUserPurchases = async (userEmail, userId) => {
  if (!userEmail && !userId) {
    return [];
  }

  let query = supabase
    .from("storefront_purchases")
    .select(`
      id,
      offering_id,
      customer_email,
      payment_provider,
      amount,
      currency,
      fulfillment_mode,
      status,
      delivery_status,
      delivery_url,
      expires_at,
      created_at,
      offering:storefront_offerings(id,title,summary)
    `)
    .order("created_at", { ascending: false });

  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (normalizedEmail && userId) {
    query = query.or(`customer_email.eq.${normalizedEmail},user_id.eq.${userId}`);
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("customer_email", normalizedEmail);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[userPurchases] Query error:", error);
    return [];
  }

  return (data || []).map((purchase) => ({
    id: purchase.id,
    offeringId: purchase.offering_id,
    title: purchase.offering?.title || purchase.offering_id,
    summary: purchase.offering?.summary || "",
    paymentProvider: purchase.payment_provider,
    amount: purchase.amount,
    currency: purchase.currency,
    fulfillmentMode: purchase.fulfillment_mode,
    status: purchase.status,
    deliveryStatus: purchase.delivery_status,
    deliveryUrl: purchase.delivery_url || "",
    expiresAt: purchase.expires_at,
    createdAt: purchase.created_at,
  }));
};
