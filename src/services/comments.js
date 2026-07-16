import { supabase } from "@/supabase-client";

export async function fetchComments({ pageType, pageId, moduleId = null, limit = 5 }) {
  let query = supabase
    .from("comments")
    .select("*")
    .eq("page_type", pageType)
    .eq("page_id", String(pageId))
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (moduleId) query = query.eq("module_id", moduleId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createComment(payload) {
  const { data, error } = await supabase.from("comments").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateComment(id, patch) {
  const { data, error } = await supabase.from("comments").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { data, error } = await supabase.from("comments").delete().eq("id", id).select();
  if (error) return { data, error };

  const deletedComment = data?.[0];
  if (deletedComment?.image_url) {
    const imageUrl = deletedComment.image_url;
    const bucketName = "comment-images";
    const bucketSegment = `/${bucketName}/`;
    const index = imageUrl.indexOf(bucketSegment);
    if (index !== -1) {
      const path = decodeURIComponent(imageUrl.substring(index + bucketSegment.length));
      supabase.storage.from(bucketName).remove([path]).catch(err => {
        console.error("Failed to delete comment image from storage:", err);
      });
    }
  }

  return { data, error };
}

export async function reportComment(id, reason = null) {
  const { data, error } = await supabase.from("comments_reports").insert([{ comment_id: id, reason }]).select();
  if (error) throw error;
  return data;
}

export default { fetchComments, createComment, updateComment, deleteComment, reportComment };
