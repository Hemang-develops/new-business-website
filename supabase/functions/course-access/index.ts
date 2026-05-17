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

const getRequestUser = async (supabase: ReturnType<typeof createClient>, request: Request) => {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return null;
  }

  return data.user ?? null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return json(200, { ok: true });
  }
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const { token } = await request.json();
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) {
      throw new Error("Missing course access token.");
    }

    const supabase = getAdminClient();
    const requestUser = await getRequestUser(supabase, request);
    const { data: access, error: accessError } = await supabase
      .from("storefront_course_access")
      .select("id,user_id,course_id,offering_id,customer_email,customer_name,starts_at,expires_at,revoked_at")
      .eq("access_token", normalizedToken)
      .maybeSingle();

    if (accessError) {
      throw accessError;
    }
    if (!access) {
      return json(404, { error: "This course access link was not found." });
    }
    if (access.revoked_at) {
      return json(403, { error: "This course access link has been revoked." });
    }
    if (access.expires_at && new Date(access.expires_at).getTime() < Date.now()) {
      return json(403, { error: "This course access period has ended." });
    }

    const normalizedAccessEmail = String(access.customer_email || "").trim().toLowerCase();
    const normalizedRequestEmail = String(requestUser?.email || "").trim().toLowerCase();
    const resolvedUserId =
      access.user_id ||
      (normalizedAccessEmail && normalizedRequestEmail && normalizedAccessEmail === normalizedRequestEmail
        ? requestUser?.id || null
        : null);

    if (!access.user_id && resolvedUserId) {
      await supabase
        .from("storefront_course_access")
        .update({ user_id: resolvedUserId })
        .eq("id", access.id);
    }

    const [courseRes, modulesRes, itemsRes, progressRes] = await Promise.all([
      supabase
        .from("storefront_courses")
        .select("id,offering_id,title,description,access_period_days,is_active")
        .eq("id", access.course_id)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("storefront_course_modules")
        .select("id,title,description,sort_order")
        .eq("course_id", access.course_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("storefront_course_items")
        .select("id,module_id,sort_order,title,description,content_type,body,youtube_url,file_url,storage_path,external_url,allow_download,is_active,unlock_after_days,unlock_on_completion_id")
        .eq("course_id", access.course_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      resolvedUserId ? supabase
        .from("storefront_user_course_progress")
        .select("item_id,completed_at,last_position_seconds")
        .eq("user_id", resolvedUserId)
        .eq("course_id", access.course_id) : Promise.resolve({ data: [] }),
    ]);

    if (courseRes.error) throw courseRes.error;
    if (modulesRes.error) throw modulesRes.error;
    if (itemsRes.error) throw itemsRes.error;
    if (progressRes.error) throw progressRes.error;
    if (!courseRes.data) {
      return json(404, { error: "This course is no longer available." });
    }

    const progressMap = new Map((progressRes.data || []).map(p => [p.item_id, p]));
    const completedIds = new Set((progressRes.data || []).filter(p => p.completed_at).map(p => p.item_id));

    const bucket = Deno.env.get("COURSE_STORAGE_BUCKET") || Deno.env.get("VITE_SUPABASE_STORAGE_BUCKET") || "site-media";
    const now = new Date();
    const purchaseDate = new Date(access.starts_at);
    const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    const items = await Promise.all(
      (itemsRes.data || []).map(async (item) => {
        let signedUrl = "";
        if (item.storage_path) {
          const { data } = await supabase.storage.from(bucket).createSignedUrl(item.storage_path, 60 * 60);
          signedUrl = data?.signedUrl || "";
        }

        // Drip logic
        const isUnlockedByTime = !item.unlock_after_days || daysSincePurchase >= item.unlock_after_days;
        const isUnlockedByPrereq = !item.unlock_on_completion_id || completedIds.has(item.unlock_on_completion_id);
        const isUnlocked = isUnlockedByTime && isUnlockedByPrereq;

        const progress = progressMap.get(item.id);

        return {
          id: item.id,
          moduleId: item.module_id,
          title: item.title,
          description: item.description,
          contentType: item.content_type,
          body: isUnlocked ? item.body : null,
          youtubeUrl: isUnlocked ? item.youtube_url : null,
          fileUrl: isUnlocked ? item.file_url : null,
          externalUrl: isUnlocked ? item.external_url : null,
          allowDownload: Boolean(item.allow_download),
          signedUrl: isUnlocked ? signedUrl : null,
          isUnlocked,
          unlockAfterDays: item.unlock_after_days,
          unlockOnCompletionId: item.unlock_on_completion_id,
          isCompleted: !!progress?.completed_at,
          lastPosition: progress?.last_position_seconds || 0,
        };
      }),
    );

    await supabase
      .from("storefront_course_access")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", access.id);

    return json(200, {
      course: {
        id: courseRes.data.id,
        offeringId: courseRes.data.offering_id,
        title: courseRes.data.title,
        description: courseRes.data.description,
      },
      access: {
        customerEmail: access.customer_email,
        customerName: access.customer_name,
        startsAt: access.starts_at,
        expiresAt: access.expires_at,
      },
      modules: modulesRes.data,
      items,
    });
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : "Unable to load course." });
  }
});
