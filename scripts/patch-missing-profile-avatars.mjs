import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const getInitials = (name = "", email = "") => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return String(email || "U").trim().slice(0, 1).toUpperCase() || "U";
  }
  return parts.map((part) => part[0].toUpperCase()).join("").slice(0, 2);
};

const createSvg = (initials, size = 512) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0f172a" />
  <text x="50%" y="50%" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="220" font-weight="700" dominant-baseline="middle" text-anchor="middle">${initials}</text>
</svg>`;
};

const buildProfileImageKey = (userId, label) => {
  const safeName = String(label || "profile").replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 20) || "profile";
  return `profiles/${userId}/${Date.now()}-${safeName}.webp`;
};

const listAllUsers = async () => {
  const users = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, per_page: pageSize });
    if (error) {
      throw error;
    }

    const batch = data?.users || data;
    if (!batch || batch.length === 0) {
      break;
    }

    users.push(...batch);
    if (batch.length < pageSize) {
      break;
    }

    page += 1;
  }

  return users;
};

const uploadAvatar = async (userId, initials) => {
  const svg = createSvg(initials);
  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
  const key = buildProfileImageKey(userId, initials);

  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(key, buffer, {
    cacheControl: "3600",
    contentType: "image/webp",
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(key);
  return data?.publicUrl;
};

const patchUser = async (user) => {
  const metadata = user.user_metadata || {};
  if (metadata.profile_image || metadata.avatar_url) {
    return false;
  }

  const fullName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim() || metadata.name || "";
  const initials = getInitials(fullName, user.email || "");
  const publicUrl = await uploadAvatar(user.id, initials);
  if (!publicUrl) {
    throw new Error("Unable to resolve public URL for avatar upload.");
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    data: {
      profile_image: publicUrl,
      avatar_url: publicUrl,
      full_name: fullName,
    },
  });

  if (error) {
    throw error;
  }

  return Boolean(data?.user);
};

const main = async () => {
  console.log("Loading users to patch missing profile avatars...");
  const users = await listAllUsers();
  console.log(`Found ${users.length} users.`);

  let patchedCount = 0;
  for (const user of users) {
    try {
      const metadata = user.user_metadata || {};
      if (metadata.profile_image || metadata.avatar_url) {
        continue;
      }

      process.stdout.write(`Patching user ${user.id} (${user.email})... `);
      const patched = await patchUser(user);
      if (patched) {
        patchedCount += 1;
        console.log("done");
      } else {
        console.log("skipped");
      }
    } catch (error) {
      console.error(`failed for ${user.id}:`, error.message || error);
    }
  }

  console.log(`Completed patch run. ${patchedCount} users updated.`);
};

main().catch((error) => {
  console.error("Patch script failed:", error);
  process.exit(1);
});
