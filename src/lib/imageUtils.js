import { supabase } from "@/supabase-client";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function processImageToWebP(file) {
  if (!file) return null;
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 5 MB)");
  }

  const img = new Image();
  const url = URL.createObjectURL(file);

  const blob = await new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (compressed) => {
          URL.revokeObjectURL(url);
          if (!compressed) return reject(new Error("Image conversion failed"));
          resolve(compressed);
        },
        "image/webp",
        0.9
      );
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });

  return blob;
}

export function generateInitials(name = "", email = "") {
  const nameParts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (nameParts.length === 0) {
    return String(email || "U").trim().slice(0, 1).toUpperCase() || "U";
  }

  const initials = nameParts.map((part) => part[0].toUpperCase()).join("");
  return initials.slice(0, 2);
}

export async function createInitialsAvatarBlob({ initials = "U", size = 512, backgroundColor = "#0f172a", textColor = "#ffffff", font = "bold 220px Inter, sans-serif" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials.slice(0, 2), size / 2, size / 2);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (data) => {
        if (!data) return reject(new Error("Unable to create avatar image"));
        resolve(data);
      },
      "image/webp",
      0.9,
    );
  });

  return blob;
}

export async function uploadWebPImage({ file, pageType = "generic", pageId = "global", pathPrefix = "images", bucket = "comment-images", key }) {
  if (!file) return null;
  const blob = await processImageToWebP(file);
  const uploadKey = key || `${pathPrefix}/${pageType}/${pageId}/${cryptoRandomId()}.webp`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadKey, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/webp",
  });
  if (uploadError) throw uploadError;
  const { publicURL } = supabase.storage.from(bucket).getPublicUrl(uploadKey);
  return publicURL;
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default { processImageToWebP, uploadWebPImage, generateInitials, createInitialsAvatarBlob };
