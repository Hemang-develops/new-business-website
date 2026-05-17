import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { SimpleEditor } from "./tiptap-templates/simple/simple-editor";


const Comments = ({ itemId }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [formValues, setFormValues] = useState({
    name: user?.name || "",
    heading: "",
    quote: "",
    imageUrl: "",
    imageAlt: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.name) {
      return;
    }
    setFormValues((previous) => ({
      ...previous,
      name: previous.name || user.name,
    }));
  }, [isAuthenticated, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.name.trim() || !formValues.quote.trim()) {
      toast.error("Add your name and review before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        placement: "buy",
        offering_id: itemId,
        heading: formValues.heading.trim() || "Client review",
        quote: formValues.quote.trim(),
        author: formValues.name.trim(),
        image_url: formValues.imageUrl.trim() || null,
        image_alt: formValues.imageAlt.trim() || null,
        sort_order: 999,
        is_active: false,
      };

      const { error } = await supabase.from(reviewsTable).insert(payload);
      if (error) {
        throw error;
      }

      toast.success("Your review was submitted and is now waiting for approval.", "Review received");
      setFormValues({
        name: isAuthenticated && user?.name ? user.name : "",
        heading: "",
        quote: "",
        imageUrl: "",
        imageAlt: "",
      });
    } catch (error) {
      toast.error(error?.message || "We could not submit your review right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-xl backdrop-blur sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-200/80">Leave a review</p>
        <h3 className="text-2xl font-semibold text-white">Share your experience</h3>
        <p className="text-sm leading-relaxed text-white/65">
          Your review helps future clients choose the right offering. New submissions are reviewed before they go live.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {/* <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            <span className="font-semibold text-white">Your name</span>
            <Input
              name="name"
              value={formValues.name}
              onChange={handleChange}
              className="border-white/10 bg-black/30 focus-visible:border-teal-300"
              placeholder="Your name"
            />
          </label>
        </div> */}
        {/* i am confused, should i keep name field for comment/review, because the author is already captured from the user context and if not then it is posible that user comment without buying and any one can comment/review to troll. so this also means not only name field but review/comment field also should not be there for public submission if not authenticated */}
        {/* Short heading not required */}

        <label className="space-y-2 text-sm text-white/70">
        {/* image upload and comment/review is merged now and only image upload is needed in options */}
          <span className="font-semibold text-white">Your review</span>
          <SimpleEditor value={formValues.quote || ""} onChange={handleChange} minHeightClass="min-h-[12rem]" />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </section>
  );
};

export default Comments;