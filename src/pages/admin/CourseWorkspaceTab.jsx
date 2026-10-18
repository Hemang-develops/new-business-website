import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronsDownUp,
  FilePlus2,
  Layers3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import TablePagination from "./TablePagination";
import { supabase } from "../../supabase-client";
import { courseStorageBucket } from "./catalogAdminHelpers";

const contentTypes = [
  { value: "text", label: "Text" },
  { value: "youtube", label: "YouTube video" },
  { value: "video", label: "Video file" },
  { value: "audio", label: "Audio file" },
  { value: "document", label: "Document" },
  { value: "link", label: "External link" },
];

const getCourseSnapshot = (course, items, modules) => ({
  course: { ...course },
  items: items.map((item) => ({ ...item })),
  modules: modules.map((module) => ({ ...module })),
});

const CourseLessonRow = ({
  item,
  index,
  isExpanded,
  modules,
  items,
  uploadingTarget,
  onDelete,
  onMove,
  onToggle,
  onUpdate,
  onUpload,
}) => {
  const typeLabel = contentTypes.find((type) => type.value === item.content_type)?.label || "Text";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <div className="flex items-center gap-2 px-3">
        <button type="button" aria-expanded={isExpanded} onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
          <ChevronDown className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          <span className="truncate text-sm font-medium text-white">{item.title || `Lesson ${index + 1}`}</span>
          <span className="shrink-0 rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-white/50">{typeLabel}</span>
          <span className={`hidden shrink-0 text-xs sm:inline ${item.is_active ? "text-teal-200/70" : "text-white/35"}`}>
            {item.is_active ? "Visible" : "Hidden"}
          </span>
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${item.title || `lesson ${index + 1}`}`} title="Delete lesson" className="rounded-md p-2 text-white/40 transition hover:bg-rose-400/10 hover:text-rose-200">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {isExpanded ? (
        <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm text-white/60">
            <span>Lesson title</span>
            <input value={item.title || ""} onChange={(event) => onUpdate("title", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" />
          </label>
          <label className="space-y-1.5 text-sm text-white/60">
            <span>Module</span>
            <select value={item.module_id || ""} onChange={(event) => onMove(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none">
              <option value="" className="bg-gray-900">Unassigned</option>
              {modules.map((module) => <option key={module.id} value={module.id} className="bg-gray-900">{module.title || "Untitled module"}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm text-white/60">
            <span>Content type</span>
            <select value={item.content_type || "text"} onChange={(event) => onUpdate("content_type", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none">
              {contentTypes.map((type) => <option key={type.value} value={type.value} className="bg-gray-900">{type.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm text-white/60">
            <span>Unlock delay (days after purchase)</span>
            <input type="number" min="0" value={item.unlock_after_days || 0} onChange={(event) => onUpdate("unlock_after_days", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" />
          </label>
          <label className="space-y-1.5 text-sm text-white/60 sm:col-span-2">
            <span>Prerequisite lesson</span>
            <select value={item.unlock_on_completion_id || ""} onChange={(event) => onUpdate("unlock_on_completion_id", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none">
              <option value="" className="bg-gray-900">None</option>
              {items.filter((candidate) => candidate.id !== item.id).map((candidate) => <option key={candidate.id} value={candidate.id} className="bg-gray-900">{candidate.title || "Untitled lesson"}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm text-white/60 sm:col-span-2">
            <span>Description</span>
            <input value={item.description || ""} onChange={(event) => onUpdate("description", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" />
          </label>
          {item.content_type === "youtube" ? (
            <label className="space-y-1.5 text-sm text-white/60 sm:col-span-2">
              <span>YouTube URL</span>
              <input value={item.youtube_url || ""} onChange={(event) => onUpdate("youtube_url", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" placeholder="https://youtube.com/watch?v=..." />
            </label>
          ) : null}
          {["video", "audio", "document"].includes(item.content_type) ? (
            <div className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">Lesson file</p>
                  <p className="mt-1 text-xs text-white/45">Upload to private course storage or use an external URL.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-teal-300/25 bg-teal-300/10 px-3 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-300/15">
                  <FilePlus2 className="h-4 w-4" />
                  {uploadingTarget === `course-media-${item.id}` ? "Uploading..." : "Upload file"}
                  <input type="file" accept={item.content_type === "video" ? "video/*" : item.content_type === "audio" ? "audio/*" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"} className="sr-only" onChange={onUpload} disabled={uploadingTarget === `course-media-${item.id}`} />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm text-white/60">
                <span>Private storage path</span>
                <input value={item.storage_path || ""} onChange={(event) => onUpdate("storage_path", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" placeholder="courses/file.mp4" />
              </label>
              <label className="block space-y-1.5 text-sm text-white/60">
                <span>External file URL (optional)</span>
                <input value={item.file_url || ""} onChange={(event) => onUpdate("file_url", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" placeholder="https://..." />
              </label>
            </div>
          ) : null}
          {item.content_type === "link" ? (
            <label className="space-y-1.5 text-sm text-white/60 sm:col-span-2">
              <span>External URL</span>
              <input value={item.external_url || ""} onChange={(event) => onUpdate("external_url", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" placeholder="https://..." />
            </label>
          ) : null}
          {item.storage_path ? (
            <div className="sm:col-span-2">
              <button type="button" onClick={async () => {
                const { data, error } = await supabase.storage.from(courseStorageBucket).createSignedUrl(item.storage_path, 60);
                if (error) { window.alert(error.message); return; }
                window.open(data.signedUrl, "_blank", "noopener,noreferrer");
              }} className="text-sm font-medium text-teal-200 underline-offset-4 hover:underline">Download current file</button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            {["video", "audio", "document"].includes(item.content_type) ? (
              <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70">
                <input type="checkbox" checked={Boolean(item.allow_download)} onChange={(event) => onUpdate("allow_download", event.target.checked)} className="accent-teal-300" /> Allow download
              </label>
            ) : null}
            <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70">
              <input type="checkbox" checked={Boolean(item.is_active)} onChange={(event) => onUpdate("is_active", event.target.checked)} className="accent-teal-300" /> Visible to learners
            </label>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm text-white/60">Text content</p>
            <SimpleEditor value={item.body || ""} onChange={(value) => onUpdate("body", value)} minHeightClass="min-h-[10rem]" />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CoursesTab = ({ state, actions }) => {
  const [editorView, setEditorView] = useState("details");
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [coursePageIndex, setCoursePageIndex] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [pendingLeave, setPendingLeave] = useState(null);
  const savedDraftRef = useRef(null);
  const {
    courseItems,
    courseModules,
    courses,
    isSavingCourse,
    newCourseOfferingId,
    offerings,
    selectedCourse,
    selectedCourseId,
    uploadingTarget,
  } = state;
  const {
    addCourseItem,
    addCourseModule,
    createCourseForOffering,
    deleteCourseItem,
    deleteCourseModule,
    handleCourseMediaUpload,
    handleSaveCourse,
    registerCourseNavigationGuard,
    restoreCourseDraft,
    setNewCourseOfferingId,
    setSelectedCourseId,
    updateCourse,
    updateCourseItem,
    updateCourseModule,
  } = actions;

  const selectedItems = useMemo(() => selectedCourseId
    ? courseItems.filter((item) => item.course_id === selectedCourseId).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    : [], [courseItems, selectedCourseId]);
  const selectedModules = useMemo(() => selectedCourseId
    ? courseModules.filter((module) => module.course_id === selectedCourseId).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    : [], [courseModules, selectedCourseId]);
  const availableOfferings = offerings.filter((offering) => !courses.some((course) => course.offering_id === offering.id));
  const selectedOffering = offerings.find((offering) => offering.id === newCourseOfferingId);
  const courseDraft = useMemo(() => selectedCourse
    ? getCourseSnapshot(selectedCourse, selectedItems, selectedModules)
    : null, [selectedCourse, selectedItems, selectedModules]);
  const serializedDraft = JSON.stringify(courseDraft);
  const hasUnsavedChanges = Boolean(
    selectedCourseId &&
    savedDraftRef.current?.courseId === selectedCourseId &&
    savedDraftRef.current.serialized !== serializedDraft,
  );
  const filteredCourses = courses.filter((course) => {
    const productName = offerings.find((offering) => offering.id === course.offering_id)?.title || course.offering_id;
    return `${productName} ${course.title}`.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });
  const coursePageSize = 10;
  const currentCoursePageIndex = Math.min(coursePageIndex, Math.max(0, Math.ceil(filteredCourses.length / coursePageSize) - 1));
  const paginatedCourses = filteredCourses.slice(currentCoursePageIndex * coursePageSize, (currentCoursePageIndex + 1) * coursePageSize);

  useEffect(() => {
    setCoursePageIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedCourseId || !courseDraft) return;
    savedDraftRef.current = { courseId: selectedCourseId, serialized: serializedDraft, data: courseDraft };
    setEditorView("details");
    setExpandedModuleId(null);
    setExpandedItemId(null);
  }, [selectedCourseId]);

  const saveCourse = async () => {
    const saved = await handleSaveCourse();
    if (saved && selectedCourseId && courseDraft) {
      savedDraftRef.current = { courseId: selectedCourseId, serialized: serializedDraft, data: courseDraft };
    }
    return saved;
  };

  const requestLeave = (onLeave) => {
    if (hasUnsavedChanges) {
      setPendingLeave(() => onLeave);
    } else {
      onLeave();
    }
  };

  useEffect(() => {
    registerCourseNavigationGuard((onLeave) => requestLeave(onLeave));
    return () => registerCourseNavigationGuard(null);
  }, [registerCourseNavigationGuard, hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const cancelCourseChanges = () => {
    const savedDraft = savedDraftRef.current;
    if (!savedDraft || savedDraft.courseId !== selectedCourseId) return;
    restoreCourseDraft(savedDraft.data);
    setExpandedModuleId(null);
    setExpandedItemId(null);
  };

  const saveAndLeave = async () => {
    const saved = await saveCourse();
    if (saved && pendingLeave) {
      const leave = pendingLeave;
      setPendingLeave(null);
      leave();
    }
  };

  const discardAndLeave = () => {
    cancelCourseChanges();
    const leave = pendingLeave;
    setPendingLeave(null);
    leave?.();
  };

  const requestDeleteItem = (item) => setConfirmation({
    title: "Delete this lesson?",
    message: `“${item.title || "Untitled lesson"}” will be removed when you save the course. You can cancel the change before saving.`,
    confirmLabel: "Delete lesson",
    action: () => {
      deleteCourseItem(item.id);
      setExpandedItemId(null);
    },
  });

  const requestDeleteModule = (module) => {
    const lessonCount = selectedItems.filter((item) => item.module_id === module.id).length;
    setConfirmation({
      title: "Delete this module?",
      message: `${lessonCount} ${lessonCount === 1 ? "lesson will" : "lessons will"} become unassigned; they will not be deleted. The module is removed when you save, and you can cancel the change before saving.`,
      confirmLabel: "Delete module",
      action: () => {
        deleteCourseModule(module.id);
        setExpandedModuleId(null);
        setExpandedItemId(null);
      },
    });
  };

  const handleConfirmation = async () => {
    const action = confirmation?.action;
    setConfirmation(null);
    await action?.();
  };

  const renderLesson = (item, index) => (
    <CourseLessonRow
      key={item.id}
      item={item}
      index={index}
      isExpanded={expandedItemId === item.id}
      modules={selectedModules}
      items={selectedItems}
      uploadingTarget={uploadingTarget}
      onDelete={() => requestDeleteItem(item)}
      onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
      onUpdate={(field, value) => updateCourseItem(item.id, field, value)}
      onMove={(moduleId) => {
        updateCourseItem(item.id, "module_id", moduleId || null);
        setExpandedModuleId(moduleId || null);
      }}
      onUpload={(event) => handleCourseMediaUpload?.(event, selectedCourse.id, item.id, updateCourseItem)}
    />
  );

  const requestCreateCourse = () => {
    if (!selectedOffering) return;
    setConfirmation({
      title: "Attach a course to this product?",
      message: `This creates a protected course linked to “${selectedOffering.title}”. Customers with access to the product can then access the course.`,
      confirmLabel: "Create course",
      action: createCourseForOffering,
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1118]">
      {selectedCourse ? (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => requestLeave(() => setSelectedCourseId(""))} aria-label="Back to courses" title="Back to courses" className="rounded-lg border border-white/10 p-2 text-white/65 transition hover:bg-white/5 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <button type="button" onClick={() => requestLeave(() => setSelectedCourseId(""))} className="text-xs text-white/45 transition hover:text-teal-100">Courses</button>
                <h2 className="truncate text-lg font-semibold text-white">{selectedCourse.title || "Untitled course"}</h2>
                <p className="truncate text-xs text-white/45">Product: {offerings.find((offering) => offering.id === selectedCourse.offering_id)?.title || selectedCourse.offering_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? <span className="mr-1 text-xs text-amber-200/80">Unsaved changes</span> : <span className="mr-1 inline-flex items-center gap-1 text-xs text-teal-200/65"><Check className="h-3.5 w-3.5" /> Saved</span>}
              <button type="button" onClick={cancelCourseChanges} disabled={!hasUnsavedChanges || isSavingCourse} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">Cancel changes</button>
              <button type="button" onClick={saveCourse} disabled={!hasUnsavedChanges || isSavingCourse} className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50">{isSavingCourse ? "Saving..." : "Save changes"}</button>
            </div>
          </header>

          <nav className="flex gap-1 border-b border-white/10 px-5 sm:px-6" aria-label="Course workspace">
            {[{ id: "details", label: "Overview", icon: BookOpen }, { id: "curriculum", label: "Curriculum", icon: Layers3 }].map((view) => {
              const Icon = view.icon;
              const active = editorView === view.id;
              return (
                <button key={view.id} type="button" role="tab" aria-selected={active} onClick={() => setEditorView(view.id)} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${active ? "border-teal-300 text-teal-100" : "border-transparent text-white/50 hover:text-white"}`}>
                  <Icon className="h-4 w-4" />{view.label}
                  {view.id === "curriculum" ? <span className="text-xs text-white/40">{selectedModules.length} modules · {selectedItems.length} lessons</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="min-h-[420px] p-5 sm:p-6">
            {editorView === "details" ? (
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Course overview</h3>
                  <p className="mt-1 text-sm text-white/50">Course content is protected and linked to the product shown above.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm text-white/65">
                    <span>Course title</span>
                    <input value={selectedCourse.title || ""} onChange={(event) => updateCourse("title", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-teal-300 focus:outline-none" />
                  </label>
                  <label className="space-y-1.5 text-sm text-white/65">
                    <span>Access duration</span>
                    <input type="number" min="1" value={selectedCourse.access_period_days || ""} onChange={(event) => updateCourse("access_period_days", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-teal-300 focus:outline-none" placeholder="Lifetime access" />
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/80 sm:col-span-2">
                    <input type="checkbox" checked={Boolean(selectedCourse.is_active)} onChange={(event) => updateCourse("is_active", event.target.checked)} className="h-4 w-4 accent-teal-300" />
                    <span><span className="block font-medium text-white">Course active</span><span className="mt-0.5 block text-xs text-white/45">Active courses can be accessed by eligible customers.</span></span>
                  </label>
                  <label className="space-y-1.5 text-sm text-white/65 sm:col-span-2">
                    <span>Description</span>
                    <textarea value={selectedCourse.description || ""} onChange={(event) => updateCourse("description", event.target.value)} rows={5} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-teal-300 focus:outline-none" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">Course curriculum</h3>
                    <p className="mt-1 text-sm text-white/50">Organize lessons into modules, or leave a lesson unassigned.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => { setExpandedModuleId(null); setExpandedItemId(null); }} disabled={!expandedModuleId && !expandedItemId} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
                      <ChevronsDownUp className="h-4 w-4" /> Collapse all
                    </button>
                    <button type="button" onClick={() => { const moduleId = addCourseModule(); if (moduleId) setExpandedModuleId(moduleId); }} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/5 hover:text-white">
                      <Plus className="h-4 w-4" /> Add module
                    </button>
                    <button type="button" onClick={() => { const itemId = addCourseItem(); if (itemId) { setExpandedItemId(itemId); setExpandedModuleId(null); } }} className="inline-flex items-center gap-2 rounded-lg bg-teal-300 px-3 py-2 text-sm font-semibold text-gray-950 transition hover:bg-teal-200">
                      <FilePlus2 className="h-4 w-4" /> Add lesson
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedModules.map((module, moduleIndex) => {
                    const moduleItems = selectedItems.filter((item) => item.module_id === module.id);
                    const expanded = expandedModuleId === module.id;
                    return (
                      <section key={module.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
                        <div className="flex items-center gap-2 px-3">
                          <button type="button" aria-expanded={expanded} onClick={() => { setExpandedModuleId(expanded ? null : module.id); setExpandedItemId(null); }} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                            <ChevronDown className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${expanded ? "rotate-180" : ""}`} />
                            <span className="truncate text-sm font-semibold text-white">{module.title || `Module ${moduleIndex + 1}`}</span>
                            <span className="text-xs text-white/40">{moduleItems.length} {moduleItems.length === 1 ? "lesson" : "lessons"}</span>
                          </button>
                          <button type="button" onClick={() => requestDeleteModule(module)} aria-label={`Delete ${module.title || `module ${moduleIndex + 1}`}`} title="Delete module" className="rounded-md p-2 text-white/40 transition hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {expanded ? (
                          <div className="space-y-3 border-t border-white/10 p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="space-y-1.5 text-sm text-white/60"><span>Module title</span><input value={module.title || ""} onChange={(event) => updateCourseModule(module.id, "title", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" /></label>
                              <label className="space-y-1.5 text-sm text-white/60"><span>Description</span><input value={module.description || ""} onChange={(event) => updateCourseModule(module.id, "description", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-300 focus:outline-none" /></label>
                            </div>
                            <div className="space-y-2 border-l border-white/10 pl-3">
                              {moduleItems.map((item) => renderLesson(item, selectedItems.indexOf(item)))}
                              {!moduleItems.length ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-white/10 px-3 py-4">
                                  <p className="text-sm text-white/45">No lessons in this module yet.</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const itemId = addCourseItem(module.id);
                                      if (itemId) {
                                        setExpandedModuleId(module.id);
                                        setExpandedItemId(itemId);
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-teal-300/25 bg-teal-300/10 px-3 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-300/15"
                                  >
                                    <FilePlus2 className="h-4 w-4" /> Add lesson to this module
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                  {!selectedModules.length ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-white/45">No modules yet. Add one to organize the curriculum, or keep lessons unassigned.</p> : null}
                </div>

                <section className="border-t border-white/10 pt-5">
                  <h4 className="text-sm font-semibold text-white">Unassigned lessons</h4>
                  <p className="mt-1 text-xs text-white/45">These lessons appear outside modules. Assign one from its module selector.</p>
                  <div className="mt-3 space-y-2">
                    {selectedItems.filter((item) => !item.module_id || !selectedModules.some((module) => module.id === item.module_id)).map((item) => renderLesson(item, selectedItems.indexOf(item)))}
                    {!selectedItems.some((item) => !item.module_id || !selectedModules.some((module) => module.id === item.module_id)) ? <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-sm text-white/45">No unassigned lessons.</p> : null}
                  </div>
                </section>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/75">Learning library</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Courses</h2>
              <p className="mt-1 text-sm text-white/50">Each course is unlocked through its linked product.</p>
            </div>
            <p className="text-sm text-white/50">{courses.length} {courses.length === 1 ? "course" : "courses"}</p>
          </header>

          <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <label className="relative mb-3 block max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search product or course" className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-teal-300 focus:outline-none" />
              </label>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[560px] table-fixed text-left">
                  <thead className="bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-white/45">
                    <tr><th className="w-[38%] px-4 py-3">Product</th><th className="w-[40%] px-4 py-3">Course content</th><th className="w-[22%] px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedCourses.map((course) => {
                      const product = offerings.find((offering) => offering.id === course.offering_id);
                      const moduleCount = courseModules.filter((module) => module.course_id === course.id).length;
                      const lessonCount = courseItems.filter((item) => item.course_id === course.id).length;
                      return (
                        <tr key={course.id} tabIndex={0} onClick={() => setSelectedCourseId(course.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedCourseId(course.id); } }} className="cursor-pointer bg-transparent transition hover:bg-white/[0.035] focus:bg-white/[0.05] focus:outline-none">
                          <td className="px-4 py-3.5"><p className="truncate text-sm font-medium text-white">{product?.title || course.offering_id}</p><p className="mt-1 truncate text-xs text-white/40">{course.offering_id}</p></td>
                          <td className="min-w-0 overflow-hidden px-4 py-3.5"><button type="button" onClick={() => setSelectedCourseId(course.id)} className="block max-w-full truncate text-left text-sm text-white/80 hover:text-teal-200" title={course.title}>{course.title || "Untitled course"}</button><p className="mt-1 truncate text-xs text-white/40">{moduleCount} modules · {lessonCount} lessons</p></td>
                          <td className="overflow-hidden px-4 py-3.5"><span className={`inline-flex max-w-full items-center gap-1.5 truncate text-xs ${course.is_active ? "text-teal-200" : "text-white/40"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${course.is_active ? "bg-teal-300" : "bg-white/30"}`} />{course.is_active ? "Active" : "Inactive"}</span></td>
                        </tr>
                      );
                    })}
                    {!filteredCourses.length ? <tr><td colSpan={3} className="px-4 py-12 text-center"><p className="text-sm font-medium text-white/70">{courses.length ? "No matching courses" : "No courses yet"}</p><p className="mt-1 text-xs text-white/40">{courses.length ? "Try another product or course name." : "Attach a product to create its protected course."}</p></td></tr> : null}
                  </tbody>
                </table>
              </div>
              <TablePagination
                pageIndex={currentCoursePageIndex}
                pageSize={coursePageSize}
                totalItems={filteredCourses.length}
                onPageChange={setCoursePageIndex}
              />
            </div>

            <aside className="h-fit rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Attach a product</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">Create a protected course connected to a product already in your catalog.</p>
              <div className="mt-4 space-y-2">
                <select value={newCourseOfferingId} onChange={(event) => setNewCourseOfferingId(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white">
                  <option value="" className="bg-gray-900">Choose an unlinked product</option>
                  {availableOfferings.map((offering) => <option key={offering.id} value={offering.id} className="bg-gray-900">{offering.title}</option>)}
                  {!availableOfferings.length ? <option value="" disabled className="bg-gray-900">{offerings.length ? "All products have courses" : "No products available"}</option> : null}
                </select>
                <button type="button" onClick={requestCreateCourse} disabled={!selectedOffering || isSavingCourse} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-300 px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Create course
                </button>
              </div>
            </aside>
          </div>
        </>
      )}

      {pendingLeave ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="course-unsaved-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#111820] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 id="course-unsaved-title" className="text-lg font-semibold text-white">Unsaved course changes</h3><p className="mt-2 text-sm leading-relaxed text-white/60">Save your edits before leaving, discard them, or stay in the course workspace.</p></div>
              <button type="button" onClick={() => setPendingLeave(null)} aria-label="Close" className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setPendingLeave(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5">Stay</button>
              <button type="button" onClick={discardAndLeave} className="rounded-lg border border-rose-300/25 px-3 py-2 text-sm text-rose-100 hover:bg-rose-300/10">Discard changes</button>
              <button type="button" onClick={saveAndLeave} disabled={isSavingCourse} className="rounded-lg bg-teal-300 px-3 py-2 text-sm font-semibold text-gray-950 hover:bg-teal-200 disabled:opacity-50">{isSavingCourse ? "Saving..." : "Save and leave"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {confirmation ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="course-confirm-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#111820] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 id="course-confirm-title" className="text-lg font-semibold text-white">{confirmation.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/60">{confirmation.message}</p></div>
              <button type="button" onClick={() => setConfirmation(null)} aria-label="Cancel" className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmation(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
              <button type="button" onClick={handleConfirmation} className={`rounded-lg px-3 py-2 text-sm font-semibold ${confirmation.confirmLabel?.startsWith("Delete") ? "bg-rose-400 text-gray-950 hover:bg-rose-300" : "bg-teal-300 text-gray-950 hover:bg-teal-200"}`}>{confirmation.confirmLabel}</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default CoursesTab;
