import { useState, useEffect } from "react";
import { Mail, Send, Calendar, Users, CheckCircle2, Clock, Eye, Image, Link as LinkIcon, Plus, Quote, RefreshCcw, Trash2, Type, X, Paperclip } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchAudienceCounts, fetchAvailableCourses, fetchCourseBuyerCounts, fetchAvailableOfferings, fetchOfferingLeadCounts, fetchBroadcastHistory, createNewsletterBroadcast, dispatchNewsletterBroadcast, fetchNewsletterRecipients, retryNewsletterBroadcast } from "../../services/newsletter";
import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import { supabase } from "../../supabase-client";
import ImageUploader from "../../components/ui/ImageUploader";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";

const blockTypes = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "rich_text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: Image },
  { type: "button", label: "Button", icon: LinkIcon },
  { type: "resource", label: "Resource", icon: LinkIcon },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "divider", label: "Divider", icon: Plus },
];

const templateOptions = [
  {
    id: "weekly_letter",
    label: "Weekly Letter",
    blocks: [
      { id: "heading-1", type: "heading", value: "A note for this week" },
      { id: "text-1", type: "rich_text", value: "<p>Write the main letter here.</p>" },
      { id: "quote-1", type: "quote", value: "A short reflection, mantra, or high-frequency reminder." },
    ],
  },
  {
    id: "empty",
    label: "Empty Template",
    blocks: [],
  },
  {
    id: "announcement",
    label: "Announcement",
    blocks: [
      { id: "heading-1", type: "heading", value: "Something new is here" },
      { id: "text-1", type: "rich_text", value: "<p>Share what changed and why it matters.</p>" },
      { id: "button-1", type: "button", label: "Read more", href: "" },
    ],
  },
  {
    id: "offer",
    label: "Offer / Product Promo",
    blocks: [
      { id: "heading-1", type: "heading", value: "For the next version of you" },
      { id: "text-1", type: "rich_text", value: "<p>Introduce the offer, transformation, and who it is for.</p>" },
      { id: "image-1", type: "image", url: "", alt: "" },
      { id: "button-1", type: "button", label: "Explore the offer", href: "" },
    ],
  },
  {
    id: "resource_drop",
    label: "Resource Drop",
    blocks: [
      { id: "heading-1", type: "heading", value: "A resource for your next step" },
      { id: "text-1", type: "rich_text", value: "<p>Set context for the resource.</p>" },
      { id: "resource-1", type: "resource", title: "Resource title", description: "Short description", label: "Open resource", href: "" },
    ],
  },
];

const createBlock = (type) => ({
  id: `${type}-${Date.now()}`,
  type,
  value: type === "heading" ? "New heading" : type === "rich_text" ? "<p>Write your copy here.</p>" : "",
  label: type === "button" ? "Open link" : type === "resource" ? "Open resource" : "",
  href: "",
  url: "",
  alt: "",
  width: "",
  height: "",
  title: type === "resource" ? "Resource title" : "",
  description: "",
});

const renderPreviewBlock = (block) => {
  switch (block.type) {
    case "heading":
      return <h2 key={block.id} className="text-2xl font-bold text-white">{block.value}</h2>;
    case "rich_text":
      return <div key={block.id} className="prose prose-invert max-w-none text-white/75" dangerouslySetInnerHTML={{ __html: block.value || "" }} />;
    case "image":
      return block.url ? (
        <div key={block.id} className="flex justify-center my-4">
          <img
            src={block.url}
            alt={block.alt || ""}
            style={{
              width: block.width ? `${block.width}px` : "100%",
              height: block.height ? `${block.height}px` : "auto",
              maxWidth: "100%",
              objectFit: "cover",
            }}
            className="rounded-2xl border border-white/10"
          />
        </div>
      ) : null;
    case "button":
      return (
        <a
          key={block.id}
          href={block.href || "#"}
          onClick={(e) => e.preventDefault()}
          className="inline-flex rounded-full bg-teal-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black"
        >
          {block.label || "Open link"}
        </a>
      );
    case "resource":
      return (
        <div key={block.id} className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-5">
          <p className="font-semibold text-white">{block.title || "Resource"}</p>
          <p className="mt-1 text-sm text-white/60">{block.description}</p>
          {block.href ? <a href={block.href} onClick={(e) => e.preventDefault()} className="mt-3 inline-block text-sm font-semibold text-teal-200">{block.label || "Open resource"}</a> : null}
        </div>
      );
    case "quote":
      return <blockquote key={block.id} className="border-l-4 border-teal-300 bg-white/5 p-5 text-lg text-white/85">{block.value}</blockquote>;
    case "divider":
      return <hr key={block.id} className="border-white/10" />;
    default:
      return null;
  }
};

const NewsletterTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("compose");
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const brandName = settings?.brand?.fullTitle || "High Frequencies 11";
  const [isLoading, setIsLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [courseBuyerCounts, setCourseBuyerCounts] = useState({});
  const [availableOfferings, setAvailableOfferings] = useState([]);
  const [offeringLeadCounts, setOfferingLeadCounts] = useState({});
  const [audienceCount, setAudienceCount] = useState({
    newsletter: 0,
    buyers: 0,
    meetings: 0,
    all: 0
  });
  
  const [emailData, setEmailData] = useState({
    subject: "",
    body: "",
    bodyBlocks: templateOptions[0].blocks,
    templateKey: "weekly_letter",
    templateLabel: templateOptions[0].label,
    previewText: "",
    audience: "all",
    audienceSegment: null,
    selectedCourseId: null,
    selectedOfferingId: null,
    scheduledAt: "",
    attachments: [],
  });
  
  const [history, setHistory] = useState([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const toast = useToast();

  const [uploadingBlockId, setUploadingBlockId] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const handleImageBlockUpload = async (file, blockId) => {
    if (!file) return;
    setUploadingBlockId(blockId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `newsletter/images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Public URL could not be generated.");
      
      updateBlock(blockId, "url", data.publicUrl);
      if (!emailData.bodyBlocks.find(b => b.id === blockId)?.alt) {
        updateBlock(blockId, "alt", file.name);
      }
      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to upload image.");
    } finally {
      setUploadingBlockId(null);
    }
  };

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `newsletter/attachments/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Public URL could not be generated.");
      
      const newAttachment = {
        filename: file.name,
        path: data.publicUrl,
        size: file.size,
      };
      
      setEmailData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      }));
      toast.success("Attachment added.");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to upload attachment.");
    } finally {
      setUploadingAttachment(false);
      event.target.value = "";
    }
  };

  const removeAttachment = (index) => {
    setEmailData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    fetchAudienceCountsFromService();
    fetchHistory();
    fetchCourses();
    fetchOfferings();
  }, []);

  const fetchAudienceCountsFromService = async () => {
    try {
      const counts = await fetchAudienceCounts();
      setAudienceCount(counts);
    } catch (error) {
      console.error("Error fetching audience counts:", error);
      setAudienceCount((previous) => ({ ...previous }));
    }
  };

  const fetchCourses = async () => {
    try {
      const [courses, counts] = await Promise.all([
        fetchAvailableCourses(),
        fetchCourseBuyerCounts()
      ]);
      setAvailableCourses(courses);
      setCourseBuyerCounts(counts);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchOfferings = async () => {
    try {
      const [offerings, counts] = await Promise.all([
        fetchAvailableOfferings(),
        fetchOfferingLeadCounts()
      ]);
      setAvailableOfferings(offerings);
      setOfferingLeadCounts(counts);
    } catch (error) {
      console.error("Error fetching offerings:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const historyRows = await fetchBroadcastHistory();
      setHistory(historyRows || []);
    } catch (error) {
      console.error("Error fetching newsletter history:", error);
      setHistory([]);
    }
  };

  const applyTemplate = (templateId) => {
    const template = templateOptions.find((item) => item.id === templateId) || templateOptions[0];
    setEmailData((previous) => ({
      ...previous,
      templateKey: template.id,
      templateLabel: template.label,
      bodyBlocks: template.blocks.map((block, index) => ({ ...block, id: `${block.type}-${Date.now()}-${index}` })),
    }));
  };

  const updateBlock = (blockId, key, value) => {
    setEmailData((previous) => ({
      ...previous,
      bodyBlocks: previous.bodyBlocks.map((block) => (block.id === blockId ? { ...block, [key]: value } : block)),
    }));
  };

  const addBlock = (type) => {
    setEmailData((previous) => ({
      ...previous,
      bodyBlocks: [...previous.bodyBlocks, createBlock(type)],
    }));
  };

  const removeBlock = (blockId) => {
    setEmailData((previous) => ({
      ...previous,
      bodyBlocks: previous.bodyBlocks.filter((block) => block.id !== blockId),
    }));
  };

  const renderBodyFromBlocks = () => {
    if (!emailData.bodyBlocks.length) {
      return emailData.body;
    }
    return emailData.bodyBlocks
      .map((block) => {
        if (block.type === "heading") return `<h2>${block.value || ""}</h2>`;
        if (block.type === "rich_text") return block.value || "";
        if (block.type === "image") {
          if (!block.url) return "";
          const widthStyle = block.width ? ` width="${block.width}"` : "";
          const heightStyle = block.height ? ` height="${block.height}"` : "";
          const inlineStyle = ` style="${block.width ? `width:${block.width}px;` : 'width:100%;'}${block.height ? `height:${block.height}px;` : 'height:auto;'}"`;
          return `<img src="${block.url}" alt="${block.alt || ""}"${widthStyle}${heightStyle}${inlineStyle} />`;
        }
        if (block.type === "button") return `<p><a href="${block.href || "#"}">${block.label || "Open link"}</a></p>`;
        if (block.type === "resource") return block.href ? `<p><strong>${block.title || "Resource"}</strong><br />${block.description || ""}<br /><a href="${block.href}">${block.label || "Open resource"}</a></p>` : "";
        if (block.type === "quote") return `<blockquote>${block.value || ""}</blockquote>`;
        if (block.type === "divider") return "<hr />";
        return "";
      })
      .join("\n");
  };

  const openRecipients = async (broadcast) => {
    setSelectedBroadcast(broadcast);
    setIsLoadingRecipients(true);
    try {
      const rows = await fetchNewsletterRecipients({ broadcastId: broadcast.id });
      setSelectedRecipients(rows);
    } catch (error) {
      toast.error(error.message || "Unable to load recipients.");
      setSelectedRecipients([]);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error("Add a test email first.");
      return;
    }
    if (!emailData.subject && !emailData.bodyBlocks.length) {
      toast.error("Please fill in the subject or add content.");
      return;
    }

    setIsLoading(true);
    try {
      const broadcast = await createNewsletterBroadcast({
        subject: `[TEST] ${emailData.subject || "No Subject"}`,
        body: renderBodyFromBlocks(),
        bodyBlocks: emailData.bodyBlocks,
        templateKey: emailData.templateKey,
        templateLabel: emailData.templateLabel,
        previewText: emailData.previewText,
        attachments: emailData.attachments,
        audience: "newsletter",
        scheduledAt: new Date().toISOString(),
        createdBy: user?.id || null,
      });
      const dispatchResponse = await dispatchNewsletterBroadcast({ broadcastId: broadcast.id, testEmail });
      toast.success(`Test sent to ${testEmail}.`);
      fetchHistory();
      return dispatchResponse;
    } catch (error) {
      toast.error(error.message || "Unable to send test email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (broadcast) => {
    setIsLoading(true);
    try {
      const retryBroadcast = await retryNewsletterBroadcast({ broadcast, createdBy: user?.id || null });
      const dispatchResponse = await dispatchNewsletterBroadcast({ broadcastId: retryBroadcast.id });
      toast.success(`Retry sent to ${dispatchResponse?.sent ?? dispatchResponse?.recipients ?? "your audience"} recipients.`);
      fetchHistory();
    } catch (error) {
      toast.error(error.message || "Unable to retry broadcast.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (isScheduled = false) => {
    if (!emailData.subject && !emailData.bodyBlocks.length) {
      toast.error("Please fill in the subject or add content.");
      return;
    }

    if (isScheduled && !emailData.scheduledAt) {
      toast.error("Please select a schedule date.");
      return;
    }

    setIsLoading(true);
    let createdBroadcast = null;
    try {
      const broadcast = await createNewsletterBroadcast({
        subject: emailData.subject || "No Subject",
        body: renderBodyFromBlocks(),
        bodyBlocks: emailData.bodyBlocks,
        templateKey: emailData.templateKey,
        templateLabel: emailData.templateLabel,
        previewText: emailData.previewText,
        attachments: emailData.attachments,
        audience: emailData.audience,
        audienceSegment: emailData.audienceSegment,
        scheduledAt: emailData.scheduledAt || new Date().toISOString(),
        createdBy: user?.id || null,
      });
      createdBroadcast = broadcast;

      if (!isScheduled) {
        const dispatchResponse = await dispatchNewsletterBroadcast({ broadcastId: broadcast.id });
        toast.success(`Sent to ${dispatchResponse?.recipients ?? "your audience"} recipients.`);
      } else {
        toast.success("Newsletter scheduled successfully.");
      }

      setEmailData({
        subject: "",
        body: "",
        bodyBlocks: templateOptions[0].blocks,
        templateKey: "weekly_letter",
        templateLabel: templateOptions[0].label,
        previewText: "",
        audience: "all",
        audienceSegment: null,
        selectedCourseId: null,
        selectedOfferingId: null,
        scheduledAt: "",
        attachments: [],
      });
      fetchHistory();
      setActiveSubTab("history");
    } catch (error) {
      toast.error(error.message || "Failed to process request.");
      if (createdBroadcast) {
        fetchHistory();
        setActiveSubTab("history");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Newsletter Engine</h2>
          <p className="mt-2 text-white/50">Schedule broadcasts and manage your subscriber audience.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
          <button 
            onClick={() => setActiveSubTab("compose")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === "compose" ? "bg-teal-300 text-black shadow-lg" : "text-white/40 hover:text-white/80"}`}
          >
            Compose
          </button>
          <button 
            onClick={() => setActiveSubTab("history")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === "history" ? "bg-teal-300 text-black shadow-lg" : "text-white/40 hover:text-white/80"}`}
          >
            Broadcast History
          </button>
        </div>
      </div>

      {activeSubTab === "compose" ? (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80 px-1">Email Subject</label>
                <input 
                  type="text"
                  placeholder="The Quantum Leap: Weekly Insights..."
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-teal-300/50 transition-all"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80 px-1">Template</span>
                  <select
                    value={emailData.templateKey}
                    onChange={(event) => applyTemplate(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white focus:border-teal-300/50 focus:outline-none"
                  >
                    {templateOptions.map((template) => (
                      <option key={template.id} value={template.id} className="bg-gray-900">{template.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80 px-1">Kicker Label</span>
                  <input
                    type="text"
                    value={emailData.templateLabel || ""}
                    onChange={(event) => setEmailData({ ...emailData, templateLabel: event.target.value })}
                    placeholder="e.g. Account Access, Offer, Resource Drop"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-teal-300/50 focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80 px-1">Inbox Preview</span>
                  <input
                    type="text"
                    value={emailData.previewText}
                    onChange={(event) => setEmailData({ ...emailData, previewText: event.target.value })}
                    placeholder="Short preview text shown by email clients"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-teal-300/50 focus:outline-none"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80">Message Blocks</label>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest italic">Images, buttons, resources, text</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {blockTypes.map((blockType) => (
                    <button
                      key={blockType.type}
                      type="button"
                      onClick={() => addBlock(blockType.type)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:border-teal-300/30 hover:text-white"
                    >
                      <blockType.icon className="h-3.5 w-3.5 text-teal-200" />
                      {blockType.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {emailData.bodyBlocks.map((block, index) => (
                    <div key={block.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{index + 1}. {block.type.replace("_", " ")}</p>
                        <button type="button" onClick={() => removeBlock(block.id)} className="rounded-full border border-rose-300/30 bg-rose-300/10 p-2 text-rose-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {block.type === "heading" ? (
                        <input value={block.value || ""} onChange={(event) => updateBlock(block.id, "value", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" />
                      ) : null}

                      {block.type === "rich_text" ? (
                        <SimpleEditor value={block.value || ""} onChange={(value) => updateBlock(block.id, "value", value)} minHeightClass="min-h-[10rem]" />
                      ) : null}

                      {block.type === "image" ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <ImageUploader
                              label={uploadingBlockId === block.id ? "Uploading..." : "Upload image"}
                              disabled={uploadingBlockId !== null}
                              onPick={(file) => handleImageBlockUpload(file, block.id)}
                            />
                            {block.url && (
                              <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                <img src={block.url} alt="mini demo" className="h-10 w-10 rounded-lg object-cover border border-white/10" />
                                <a href={block.url} target="_blank" rel="noreferrer" className="text-xs text-teal-300 hover:text-teal-200 underline">View image</a>
                              </div>
                            )}
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block space-y-1 text-[10px] uppercase font-bold tracking-wider text-white/50">
                              <span>Image URL</span>
                              <input value={block.url || ""} onChange={(event) => updateBlock(block.id, "url", event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                            </label>
                            <label className="block space-y-1 text-[10px] uppercase font-bold tracking-wider text-white/50">
                              <span>Alt text</span>
                              <input value={block.alt || ""} onChange={(event) => updateBlock(block.id, "alt", event.target.value)} placeholder="Description" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                            </label>
                          </div>
                          <div className="grid gap-3 grid-cols-2">
                            <label className="block space-y-1 text-[10px] uppercase font-bold tracking-wider text-white/50">
                              <span>Width (px) - optional</span>
                              <input type="number" value={block.width || ""} onChange={(event) => updateBlock(block.id, "width", event.target.value)} placeholder="e.g. 300 (full width if blank)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                            </label>
                            <label className="block space-y-1 text-[10px] uppercase font-bold tracking-wider text-white/50">
                              <span>Height (px) - optional</span>
                              <input type="number" value={block.height || ""} onChange={(event) => updateBlock(block.id, "height", event.target.value)} placeholder="e.g. 200 (auto-scaled if blank)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                            </label>
                          </div>
                        </div>
                      ) : null}

                      {block.type === "button" ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <input value={block.label || ""} onChange={(event) => updateBlock(block.id, "label", event.target.value)} placeholder="Button label" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                          <input value={block.href || ""} onChange={(event) => updateBlock(block.id, "href", event.target.value)} placeholder="https://..." className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                        </div>
                      ) : null}

                      {block.type === "resource" ? (
                        <div className="grid gap-3">
                          <input value={block.title || ""} onChange={(event) => updateBlock(block.id, "title", event.target.value)} placeholder="Resource title" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                          <textarea value={block.description || ""} onChange={(event) => updateBlock(block.id, "description", event.target.value)} placeholder="Short resource description" rows={2} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                          <div className="grid gap-3 md:grid-cols-2">
                            <input value={block.label || ""} onChange={(event) => updateBlock(block.id, "label", event.target.value)} placeholder="Link label" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                            <input value={block.href || ""} onChange={(event) => updateBlock(block.id, "href", event.target.value)} placeholder="https://..." className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25" />
                          </div>
                        </div>
                      ) : null}

                      {block.type === "quote" ? (
                        <textarea value={block.value || ""} onChange={(event) => updateBlock(block.id, "value", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" />
                      ) : null}

                      {block.type === "divider" ? (
                        <div className="py-4"><hr className="border-white/10" /></div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80">Attachments</label>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest italic">PDF, DOC, ZIP, TXT, etc.</span>
                </div>

                <div className="flex items-center gap-4">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 ${uploadingAttachment ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Paperclip className="h-3.5 w-3.5 text-teal-200" />
                    <input type="file" className="hidden" onChange={handleAttachmentUpload} disabled={uploadingAttachment} />
                    {uploadingAttachment ? "Uploading..." : "Add Attachment"}
                  </label>
                </div>

                {emailData.attachments && emailData.attachments.length > 0 && (
                  <div className="space-y-2">
                    {emailData.attachments.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-teal-300 animate-pulse" />
                          <div>
                            <p className="text-xs font-medium text-white">{item.filename}</p>
                            <p className="text-[10px] text-white/45">{(item.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="block space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80 px-1">Test Email</span>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-teal-300/50 focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="min-h-[3.5rem] flex-1 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10"
                >
                  <Eye className="mr-2 inline h-4 w-4 text-teal-200" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isLoading}
                  className="min-h-[3.5rem] flex-1 rounded-2xl border border-teal-300/40 bg-teal-300/10 text-xs font-bold uppercase tracking-[0.2em] text-teal-50 transition-all hover:bg-teal-300/15 disabled:opacity-50"
                >
                  Send Test
                </button>
                <button 
                  onClick={() => handleSend(false)}
                  disabled={isLoading}
                  className="flex-1 min-h-[3.5rem] bg-teal-300 text-black rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-teal-200 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> 
                  {isLoading ? "Sending..." : "Send Now"}
                </button>
                <button 
                  onClick={() => handleSend(true)}
                  disabled={isLoading}
                  className="flex-1 min-h-[3.5rem] bg-white/5 border border-white/10 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4 text-teal-300" />
                  Schedule Broadcast
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Audience Selection */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-8">Audience Selector</h3>
              <div className="space-y-4">
                {[
                  { id: "all", label: "Master Broadcast", icon: Users, count: audienceCount.all, desc: "Everyone in your database" },
                  { id: "newsletter", label: "Subscribers", icon: Mail, count: audienceCount.newsletter, desc: "Home page signups" },
                  { id: "buyers", label: "Course Buyers", icon: Clock, count: audienceCount.buyers, desc: "Verified purchasers" },
                  { id: "meetings", label: "Meeting Leads", icon: Calendar, count: audienceCount.meetings, desc: "Discovery call bookings" }
                ].map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        setEmailData({...emailData, audience: item.id, audienceSegment: null, selectedCourseId: null, selectedOfferingId: null});
                      }}
                      className={`w-full group text-left p-5 rounded-2xl border transition-all duration-300 ${emailData.audience === item.id ? "bg-teal-300/10 border-teal-300/30" : "bg-white/[0.02] border-white/5 hover:border-white/20"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${emailData.audience === item.id ? "bg-teal-300 text-black" : "bg-white/5 text-white/30 group-hover:text-white"}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold uppercase tracking-widest ${emailData.audience === item.id ? "text-teal-100" : "text-white/60 group-hover:text-white"}`}>{item.label}</span>
                            <span className="text-[10px] font-bold text-teal-300/60 bg-teal-300/10 px-2 py-0.5 rounded-full">{item.count}</span>
                          </div>
                          <p className="text-[10px] text-white/30 mt-1 font-medium">{item.desc}</p>
                        </div>
                      </div>
                    </button>

                    {/* Course-specific selector for buyers */}
                    {emailData.audience === "buyers" && item.id === "buyers" && availableCourses.length > 0 && (
                      <div className="mt-4 ml-14 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300/60 px-1">Target Specific Course (Optional)</label>
                        <div className="relative group">
                          <button
                            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.03] text-white text-xs font-medium transition-all hover:border-teal-300/30 hover:bg-white/[0.05] focus:outline-none focus:border-teal-300/50 focus:ring-1 focus:ring-teal-300/20"
                          >
                            <div className="flex items-center justify-between">
                              <span>{emailData.selectedCourseId ? availableCourses.find(c => c.id === emailData.selectedCourseId)?.title : "All Course Buyers"}</span>
                              <span className="text-teal-300/60">v</span>
                            </div>
                          </button>
                          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-gray-900 shadow-lg z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <button
                              onClick={() => {
                                setEmailData({
                                  ...emailData,
                                  selectedCourseId: null,
                                  audienceSegment: null
                                });
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-teal-300/10 transition-colors text-xs font-medium text-white/80 hover:text-teal-100 border-b border-white/5"
                            >
                              <div className="flex items-center justify-between">
                                <span>All Course Buyers</span>
                                <span className="text-[10px] text-teal-300/60">{audienceCount.buyers}</span>
                              </div>
                            </button>
                            {availableCourses.map((course, idx) => (
                              <button
                                key={course.id}
                                onClick={() => {
                                  setEmailData({
                                    ...emailData,
                                    selectedCourseId: course.id,
                                    audienceSegment: `course:${course.id}`
                                  });
                                }}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors ${idx < availableCourses.length - 1 ? 'border-b border-white/5' : ''} ${emailData.selectedCourseId === course.id ? 'bg-teal-300/10 text-teal-100' : 'text-white/70 hover:text-white hover:bg-white/[0.05]'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{course.title}</span>
                                  <span className="text-[10px] text-teal-300/60 ml-2">{courseBuyerCounts[course.id] || 0}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Offering-specific selector for meetings */}
                    {emailData.audience === "meetings" && item.id === "meetings" && availableOfferings.length > 0 && (
                      <div className="mt-4 ml-14 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300/60 px-1">Target Specific Meeting (Optional)</label>
                        <div className="relative group">
                          <button
                            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.03] text-white text-xs font-medium transition-all hover:border-teal-300/30 hover:bg-white/[0.05] focus:outline-none focus:border-teal-300/50 focus:ring-1 focus:ring-teal-300/20"
                          >
                            <div className="flex items-center justify-between">
                              <span>{emailData.selectedOfferingId ? availableOfferings.find(o => o.id === emailData.selectedOfferingId)?.title : "All Meeting Leads"}</span>
                              <span className="text-teal-300/60">v</span>
                            </div>
                          </button>
                          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-gray-900 shadow-lg z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <button
                              onClick={() => {
                                setEmailData({
                                  ...emailData,
                                  selectedOfferingId: null,
                                  audienceSegment: null
                                });
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-teal-300/10 transition-colors text-xs font-medium text-white/80 hover:text-teal-100 border-b border-white/5"
                            >
                              <div className="flex items-center justify-between">
                                <span>All Meeting Leads</span>
                                <span className="text-[10px] text-teal-300/60">{audienceCount.meetings}</span>
                              </div>
                            </button>
                            {availableOfferings.map((offering, idx) => (
                              <button
                                key={offering.id}
                                onClick={() => {
                                  setEmailData({
                                    ...emailData,
                                    selectedOfferingId: offering.id,
                                    audienceSegment: `offering:${offering.id}`
                                  });
                                }}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors ${idx < availableOfferings.length - 1 ? 'border-b border-white/5' : ''} ${emailData.selectedOfferingId === offering.id ? 'bg-teal-300/10 text-teal-100' : 'text-white/70 hover:text-white hover:bg-white/[0.05]'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{offering.title}</span>
                                  <span className="text-[10px] text-teal-300/60 ml-2">{offeringLeadCounts[offering.id] || 0}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Info */}
            {emailData.scheduledAt && (
              <div className="rounded-[2rem] border border-teal-300/20 bg-teal-300/5 p-6 animate-in zoom-in-95 duration-300">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-300/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-100 uppercase tracking-widest">Selected Window</p>
                    <p className="text-[10px] text-white/40 mt-1">{new Date(emailData.scheduledAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300/80 px-1">Scheduling Date</label>
                <input 
                  type="datetime-local"
                  value={emailData.scheduledAt}
                  onChange={(e) => setEmailData({...emailData, scheduledAt: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-teal-300/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Broadcast Target</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Subject</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Status</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Release Date</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.length > 0 ? history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-teal-300">
                          {item.audience === 'buyers' ? <Clock className="w-4 h-4" /> : item.audience === 'meetings' ? <Calendar className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{item.audience}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-semibold text-white line-clamp-1">{item.subject}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === 'sent' ? 'bg-teal-300/10 text-teal-300' : 'bg-purple-300/10 text-purple-300'}`}>
                        {item.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-white/40 font-medium tracking-tight">
                      {new Date(item.scheduled_at || item.created_at).toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openRecipients(item)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 hover:text-white"
                        >
                          Recipients
                        </button>
                        {item.status === "failed" ? (
                          <button
                            type="button"
                            onClick={() => handleRetry(item)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-100 disabled:opacity-50"
                          >
                            <RefreshCcw className="h-3 w-3" />
                            Retry
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                          <Mail className="w-8 h-8" />
                        </div>
                        <p className="text-sm text-white/30 font-medium tracking-tight">No broadcasts found in history.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPreview ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-6 backdrop-blur-md">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-200/80">Preview</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{emailData.subject || "Untitled newsletter"}</h3>
              </div>
              <button type="button" onClick={() => setShowPreview(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div
                className="rounded-[1.5rem] border border-white/10 p-8 flex justify-center overflow-y-auto max-h-[70vh]"
                style={{
                  background: `
                    radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 38%),
                    radial-gradient(circle at bottom, rgba(192,132,252,0.16), transparent 34%),
                    linear-gradient(180deg, #0f172a 0%, #020617 100%)
                  `,
                  backgroundColor: "#020617"
                }}
              >
                <div className="w-full max-w-[560px] text-left">
                  <div className="text-center pb-4">
                    <div className="inline-block px-4 py-2 border border-white/16 rounded-full bg-white/5 text-[11px] tracking-[0.28em] uppercase text-teal-200">
                      {brandName}
                    </div>
                  </div>
                  
                  <div className="border border-white/10 rounded-[28px] bg-slate-900/80 p-8 shadow-2xl">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1.5 rounded-full bg-teal-400/12 border border-teal-400/24 text-[11px] font-bold tracking-[0.22em] uppercase text-teal-200">
                        {emailData.templateLabel || templateOptions.find(t => t.id === emailData.templateKey)?.label || "Weekly Letter"}
                      </span>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{emailData.subject || "Subject line"}</h1>
                    {emailData.previewText ? <p className="mb-6 text-sm text-white/45">{emailData.previewText}</p> : null}
                    
                    <div className="space-y-6">
                      {emailData.bodyBlocks.map(renderPreviewBlock)}
                    </div>
                  </div>
                  
                  <div className="text-center pt-5">
                    <p className="text-xs text-white/40 leading-relaxed">
                      You received this email because you subscribed to updates from {brandName}.
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed mt-1">
                      If you no longer want updates, <a href="#" onClick={e => e.preventDefault()} className="text-teal-300 underline">unsubscribe here</a>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[360px] rounded-[2rem] border border-white/10 bg-black p-4">
                <div
                  className="rounded-[1.5rem] p-5 overflow-y-auto max-h-[70vh] text-left"
                  style={{
                    background: `
                      radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 38%),
                      radial-gradient(circle at bottom, rgba(192,132,252,0.16), transparent 34%),
                      linear-gradient(180deg, #0f172a 0%, #020617 100%)
                    `,
                    backgroundColor: "#020617"
                  }}
                >
                  <div className="text-center pb-3">
                    <div className="inline-block px-3 py-1.5 border border-white/16 rounded-full bg-white/5 text-[9px] tracking-widest uppercase text-teal-200">
                      {brandName}
                    </div>
                  </div>
                  
                  <div className="border border-white/10 rounded-[22px] bg-slate-900/80 p-5 shadow-xl">
                    <div className="mb-3">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-teal-400/12 border border-teal-400/24 text-[9px] font-bold tracking-wider uppercase text-teal-200">
                        {emailData.templateLabel || templateOptions.find(t => t.id === emailData.templateKey)?.label || "Weekly Letter"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3 leading-tight">{emailData.subject || "Subject line"}</h2>
                    <div className="space-y-4 text-sm">
                      {emailData.bodyBlocks.map(renderPreviewBlock)}
                    </div>
                  </div>
                  
                  <div className="text-center pt-4">
                    <p className="text-[10px] text-white/30 leading-relaxed">
                      You received this email because you subscribed to updates from {brandName}.
                    </p>
                    <p className="text-[10px] text-white/30 leading-relaxed mt-1">
                      If you no longer want updates, <a href="#" onClick={e => e.preventDefault()} className="text-teal-300 underline">unsubscribe here</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedBroadcast ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-6 backdrop-blur-md">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-200/80">Recipients</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedBroadcast.subject}</h3>
              </div>
              <button type="button" onClick={() => setSelectedBroadcast(null)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingRecipients ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">Loading recipients...</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Email</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Source</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Status</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedRecipients.length ? selectedRecipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td className="px-5 py-4 text-sm text-white/80">{recipient.email}</td>
                        <td className="px-5 py-4 text-xs uppercase tracking-[0.16em] text-white/45">{recipient.source}</td>
                        <td className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">{recipient.status}</td>
                        <td className="max-w-md px-5 py-4 text-xs text-rose-100/80">{recipient.error || "-"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-5 py-12 text-center text-white/45">No recipient records found yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NewsletterTab;
