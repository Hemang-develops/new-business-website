import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState, useRef } from "react";
import ImageUploader from "@/components/ui/ImageUploader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadWebPImage } from "@/lib/imageUtils";
import * as commentsService from "@/services/comments";

const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const Comments = ({ pageType = "offering", pageId, moduleId = null }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImageFile, setCommentImageFile] = useState(null);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [limit, setLimit] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [commentUploaderKey, setCommentUploaderKey] = useState(0);
  const [replyUploaderKey, setReplyUploaderKey] = useState(0);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadComments(limit);
    return () => {
      mounted.current = false;
    };
  }, [pageType, pageId]);

  const loadComments = async (take = 5) => {
    setLoading(true);
    try {
      const res = await commentsService.fetchComments({ pageType, pageId, moduleId, limit: take });
      if (!mounted.current) return;
      setComments(res || []);
      setHasMore((res?.length || 0) >= take);
      setLimit(take);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load comments");
    } finally {
      setLoading(false);
    }
  };

  // Image conversion and upload moved to src/lib/imageUtils.js

  const handleImagePick = (file, target) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large (max 5 MB)");
      return;
    }
    if (target === "reply") {
      setReplyImageFile(file);
    } else {
      setCommentImageFile(file);
    }
  };

  const handleClearImage = (target) => {
    if (target === "reply") {
      setReplyImageFile(null);
    } else {
      setCommentImageFile(null);
    }
  };

  const submitComment = async (parentId = null, isReply = false) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to post comments.");
      return;
    }

    const text = isReply ? replyText.trim() : commentText.trim();
    const file = isReply ? replyImageFile : commentImageFile;

    if (!text && !file) {
      toast.error("Add a message or an image before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (file) {
        imageUrl = await uploadWebPImage({ file, pageType, pageId, pathPrefix: 'comments' });
      }

      const payload = {
        id: uuidv4(),
        page_type: pageType,
        page_id: String(pageId),
        module_id: moduleId,
        parent_id: parentId,
        author_id: user.id,
        author_name: user.name || user.email || "Anonymous",
        content: text || null,
        image_url: imageUrl,
        is_visible: true,
      };

      const created = await commentsService.createComment(payload);
      setComments((previous) => [created, ...previous]);

      if (isReply) {
        setReplyFor(null);
        setReplyText("");
        setReplyImageFile(null);
        setReplyUploaderKey((k) => k + 1);
      } else {
        setCommentText("");
        setCommentImageFile(null);
        setCommentUploaderKey((k) => k + 1);
      }
      toast.success("Comment posted");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const { error } = await commentsService.deleteComment(commentId);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment removed");
    } catch (err) {
      toast.error("Unable to delete comment");
    }
  };

  const handleEdit = async (commentId, newContent) => {
    try {
      await commentsService.updateComment(commentId, { content: newContent });
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: newContent } : c)));
      toast.success("Comment updated");
    } catch (err) {
      toast.error("Unable to update comment");
    }
  };

  const CommentAvatar = ({ src, alt, sizeClass = "h-12 w-12" }) => (
    <Avatar className={`${sizeClass} overflow-hidden`}>
      {src ? <AvatarImage src={src} alt={alt} /> : <AvatarFallback />}
    </Avatar>
  );

  const replyBox = (parentId) => (
    <div className="mt-3 rounded-2xl p-4">
      <div className="flex gap-3">
        <CommentAvatar src={user?.profileImage} alt={user?.name || "Your avatar"} sizeClass="h-10 w-10" />
        <div className="flex-1">
          <textarea
            className="w-full min-h-[88px] rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ImageUploader key={replyUploaderKey} onPick={(file) => handleImagePick(file, "reply")} disabled={submitting} />
            <button
              className="ml-auto rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-gray-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
              onClick={() => submitComment(parentId, true)}
            >
              {submitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const commentRows = comments.filter((c) => !c.parent_id);

  return (
    <section className="text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Comments</h3>
          {/* <p className="text-sm text-white/70">Questions, feedback, or quick notes about this {pageType}.</p> */}
        </div>
        {!isAuthenticated && (
          <div className="px-4 py-2 text-sm text-teal-100">
            Sign in to join the conversation.
          </div>
        )}
      </div>

      <div className="pt-4">
        <div className="flex gap-3">
          <CommentAvatar src={user?.profileImage} alt={user?.name || "Your avatar"} sizeClass="h-12 w-12" />
          <div className="flex-1">
            <textarea
              className="w-full min-h-[96px] resize-none rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
              placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to post a comment"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!isAuthenticated}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ImageUploader key={commentUploaderKey} onPick={(file) => handleImagePick(file)} disabled={!isAuthenticated} />
              <button
                className="ml-auto rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-gray-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting || !isAuthenticated}
                onClick={() => submitComment(null)}
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 space-y-4">
        {loading ? (
          <p className="text-white/60">Loading comments...</p>
        ) : commentRows.length ? (
          commentRows.map((entry) => (
            <CommentThread
              key={entry.id}
              entry={entry}
              comments={comments}
              currentUser={user}
              replyFor={replyFor}
              onReply={(id) => {
                setReplyFor(replyFor === id ? null : id);
                setReplyText("");
                setReplyImageFile(null);
              }}
              onDelete={handleDelete}
              onEdit={handleEdit}
              replyBox={replyBox}
            />
          ))
        ) : (
          <p className="text-white/60">No comments yet. Be the first to start the conversation.</p>
        )}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button onClick={() => loadComments(limit + 5)} className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white transition hover:bg-white/10">
            Load more
          </button>
        </div>
      )}
    </section>
  );
};

const CommentThread = ({ entry, comments, currentUser, replyFor, onReply, onDelete, onEdit, replyBox, depth = 0 }) => {
  const replies = comments
    .filter((c) => c.parent_id === entry.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className={depth === 0 ? "rounded-3xl p-4" : ""}>
      <CommentItem entry={entry} currentUser={currentUser} onReply={() => onReply(entry.id)} onDelete={onDelete} onEdit={onEdit} />
      {replyFor === entry.id && replyBox(entry.id)}
      {replies.length > 0 && (
        // ponytail: cap indent at depth 4 so mobile doesn't run out of space
        <div className={`mt-3 space-y-3 ${depth < 4 ? "ml-6 border-l border-white/10 pl-5" : ""}`}>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              entry={reply}
              comments={comments}
              currentUser={currentUser}
              replyFor={replyFor}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              replyBox={replyBox}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentItem = ({ entry, currentUser, onReply, onDelete, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(entry.content || "");

  const CommentAvatar = ({ src, alt, sizeClass = "h-12 w-12" }) => (
    <Avatar className={`${sizeClass} overflow-hidden`}>
      {src ? <AvatarImage src={src} alt={alt} /> : <AvatarFallback />}
    </Avatar>
  );
  // ponytail: resolve avatar from current user if it's their comment; others get fallback initials
  const avatarSrc = currentUser?.id === entry.author_id ? currentUser.profileImage : null;

  return (
    <div className="flex gap-3">
      <CommentAvatar src={avatarSrc} alt={entry.author_name || "Author avatar"} sizeClass="h-11 w-11" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white">
            <span className="font-semibold">{entry.author_name}</span>
            <span className="text-white/50">•</span>
            <span className="text-xs text-white/60">{new Date(entry.created_at).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
            <button className="transition hover:text-white" onClick={onReply}>Reply</button>
            {currentUser?.id === entry.author_id && (
              <>
                <button className="transition hover:text-white" onClick={() => setEditing((value) => !value)}>
                  {editing ? "Cancel" : "Edit"}
                </button>
                <button className="transition hover:text-white" onClick={() => onDelete(entry.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 text-sm text-white/90">
          {editing ? (
            <div className="space-y-3">
              <textarea
                className="w-full min-h-[92px] rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-gray-950"
                  onClick={() => {
                    onEdit(entry.id, draftText);
                    setEditing(false);
                  }}
                >
                  Save
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{entry.content}</p>
          )}
        </div>
        {entry.image_url && (
          <div className="mt-3 overflow-hidden rounded-2xl max-w-xs sm:max-w-sm max-h-[250px] border border-white/5 bg-black/20">
            <img
              src={entry.image_url}
              alt={entry.image_alt || "comment image"}
              className="w-full h-full max-h-[250px] object-cover hover:scale-[1.02] transition-transform duration-200 cursor-zoom-in"
              onClick={() => window.open(entry.image_url, "_blank")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
