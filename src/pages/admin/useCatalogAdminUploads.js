import { supabase } from "../../supabase-client";
import { slugify, storageBucket } from "./catalogAdminHelpers";
import { processImageToWebP } from "../../lib/imageUtils";

export default function useCatalogAdminUploads({
  editor,
  reviewsEditor,
  selectedSection,
  siteSettingsEditor,
  setStatus,
  setUploadingTarget,
  updateEditor,
  updateReviewEditor,
  updateSectionEditor,
  updateSiteSettings,
}) {
  const extractFile = (input) => {
    if (!input) return null;
    if (input.target?.files?.length) return input.target.files[0];
    return input;
  };

  const uploadImageToStorage = async (file, folder) => {
    const safeBaseName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "image";
    const filePath = `${folder}/${Date.now()}-${safeBaseName}.webp`;
    const webpBlob = await processImageToWebP(file);

    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, webpBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/webp",
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error("Image uploaded, but a public URL could not be generated.");
    }

    return data.publicUrl;
  };

  const uploadFileToStorage = async (file, folder) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeBaseName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "file";
    const filePath = `${folder}/${Date.now()}-${safeBaseName}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  const handleOfferingImageUpload = async (input) => {
    const file = extractFile(input);
    if (!file || !editor) return;

    setUploadingTarget("offering-image");
    setStatus({ type: "idle", message: "" });
    try {
      const publicUrl = await uploadImageToStorage(file, `offerings/${editor.id}`);
      updateEditor("image_url", publicUrl);
      if (!editor.image_alt) {
        updateEditor("image_alt", editor.title || file.name);
      }
      setStatus({ type: "success", message: "Product image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload product image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleHeroImageUpload = async (input) => {
    const file = extractFile(input);
    if (!file || !selectedSection) return;

    setUploadingTarget("hero-image");
    setStatus({ type: "idle", message: "" });
    try {
      const publicUrl = await uploadImageToStorage(file, `sections/${selectedSection.id}/hero`);
      updateSectionEditor("hero_image_url", publicUrl);
      setStatus({ type: "success", message: "Hero image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload hero image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleProfileImageUpload = async (input) => {
    const file = extractFile(input);
    if (!file) return;

    setUploadingTarget("site-profile-image");
    setStatus({ type: "idle", message: "" });
    try {
      const publicUrl = await uploadImageToStorage(file, "site/profile");
      updateSiteSettings("profile", "imageUrl", publicUrl);
      if (!siteSettingsEditor.profile.imageAlt) {
        updateSiteSettings("profile", "imageAlt", file.name);
      }
      setStatus({ type: "success", message: "Profile image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload profile image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleReviewImageUpload = async (input, index) => {
    const file = extractFile(input);
    if (!file) return;

    setUploadingTarget(`review-image-${index}`);
    setStatus({ type: "idle", message: "" });
    try {
      const review = reviewsEditor[index];
      const folder = review?.offering_id ? `reviews/${review.offering_id}` : "reviews/general";
      const publicUrl = await uploadImageToStorage(file, folder);
      updateReviewEditor(index, "image_url", publicUrl);
      if (!review?.image_alt) {
        updateReviewEditor(index, "image_alt", review?.author || review?.heading || file.name);
      }
      setStatus({ type: "success", message: "Review image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload review image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleCourseMediaUpload = async (event, courseId, itemId, updateCourseItem) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !courseId || !itemId) {
      return;
    }

    setUploadingTarget(`course-media-${itemId}`);
    setStatus({ type: "idle", message: "" });
    try {
      const filePath = await uploadFileToStorage(file, `courses/${courseId}`);
      updateCourseItem(itemId, "storage_path", filePath);
      setStatus({ type: "success", message: "File uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload file." });
    } finally {
      setUploadingTarget("");
    }
  };

  return {
    handleCourseMediaUpload,
    handleHeroImageUpload,
    handleOfferingImageUpload,
    handleProfileImageUpload,
    handleReviewImageUpload,
  };
}
