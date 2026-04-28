import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";

const contentTypes = [
  { value: "text", label: "Text" },
  { value: "youtube", label: "YouTube video" },
  { value: "video", label: "Video file" },
  { value: "audio", label: "Audio file" },
  { value: "link", label: "External link" },
];

const CoursesTab = ({ state, actions }) => {
  const {
    courseAccess,
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
    setNewCourseOfferingId,
    setSelectedCourseId,
    updateCourse,
    updateCourseItem,
    updateCourseModule,
  } = actions;

  const selectedItems = selectedCourseId
    ? courseItems
      .filter((item) => item.course_id === selectedCourseId)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    : [];
  const selectedModules = selectedCourseId
    ? courseModules
      .filter((m) => m.course_id === selectedCourseId)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    : [];
  const selectedAccess = selectedCourse
    ? courseAccess.filter((entry) => entry.course_id === selectedCourse.id)
    : [];
  const selectedOfferingAlreadyHasCourse = courses.some((course) => course.offering_id === newCourseOfferingId);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(7,12,22,0.94),rgba(9,16,28,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-200/80">Courses</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Attach protected course content to existing products.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
          Products stay as the sellable items. Each course belongs to one product, and buying that product unlocks the related course through a private access link.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-5 xl:flex-row">
        <div className="space-y-4 xl:w-[320px] xl:shrink-0">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Create from product</p>
            <div className="mt-4 space-y-3">
              <select
                value={newCourseOfferingId}
                onChange={(event) => setNewCourseOfferingId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="" className="bg-gray-900">Choose existing product</option>
                {offerings.map((offering) => {
                  const linkedCourse = courses.find((course) => course.offering_id === offering.id);
                  return (
                    <option
                      key={offering.id}
                      value={offering.id}
                      disabled={Boolean(linkedCourse)}
                      className="bg-gray-900"
                    >
                      {linkedCourse ? `${offering.title} - already attached` : offering.title}
                    </option>
                  );
                })}
                {!offerings.length ? (
                  <option value="" disabled className="bg-gray-900">
                    No products loaded
                  </option>
                ) : null}
              </select>
              <button
                type="button"
                onClick={createCourseForOffering}
                disabled={!newCourseOfferingId || selectedOfferingAlreadyHasCourse}
                className="w-full rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
              >
                Attach course
              </button>
              {selectedOfferingAlreadyHasCourse ? (
                <p className="text-xs leading-relaxed text-white/55">
                  This product already has a course attached. Select it from the course list to edit its content.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Course list</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">{courses.length}</span>
            </div>
            <div className="mt-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
              {courses.map((course) => {
                const offering = offerings.find((entry) => entry.id === course.offering_id);
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${course.id === selectedCourseId ? "border-teal-300/35 bg-teal-300/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
                  >
                    <p className="text-sm font-semibold text-white">{course.title}</p>
                    <p className="mt-1 text-xs text-white/50">{offering?.title || course.offering_id}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedCourse ? (
          <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5 flex-1 min-w-0 max-h-[700px] overflow-y-auto">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Course editor</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedCourse.title}</h3>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <label className="space-y-1 text-xs text-white/60 w-full sm:w-[calc(50%-0.5rem)]">
                <span>Course title</span>
                <input value={selectedCourse.title || ""} onChange={(event) => updateCourse("title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
              </label>
              <label className="space-y-1 text-xs text-white/60 w-full sm:w-[calc(50%-0.5rem)]">
                <span>Access period days</span>
                <input value={selectedCourse.access_period_days || ""} onChange={(event) => updateCourse("access_period_days", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" placeholder="Blank for lifetime" />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 w-full sm:w-[calc(50%-0.5rem)]">
                <input type="checkbox" checked={Boolean(selectedCourse.is_active)} onChange={(event) => updateCourse("is_active", event.target.checked)} />
                Active
              </label>
              <label className="space-y-1 text-xs text-white/60 w-full">
                <span>Description</span>
                <textarea value={selectedCourse.description || ""} onChange={(event) => updateCourse("description", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
              </label>
            </div>

            {/* Modules Section */}
            <div className="border-t border-white/10 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Modules</p>
                <button type="button" onClick={addCourseModule} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
                  Add module
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {selectedModules.map((module, index) => (
                  <div key={module.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Module {index + 1}</p>
                      <button type="button" onClick={() => deleteCourseModule(module.id)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">
                        Delete
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Module title</span>
                        <input value={module.title || ""} onChange={(event) => updateCourseModule(module.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Description</span>
                        <input value={module.description || ""} onChange={(event) => updateCourseModule(module.id, "description", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Content</p>
                <button type="button" onClick={addCourseItem} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
                  Add content
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {selectedItems.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Content {index + 1}</p>
                      <button type="button" onClick={() => deleteCourseItem(item.id)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">
                        Delete
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <label className="space-y-1 text-xs text-white/60 w-full sm:w-[calc(50%-0.375rem)]">
                        <span>Title</span>
                        <input value={item.title || ""} onChange={(event) => updateCourseItem(item.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="space-y-1 text-xs text-white/60 w-full sm:w-[calc(50%-0.375rem)]">
                        <span>Parent module</span>
                        <select value={item.module_id || ""} onChange={(event) => updateCourseItem(item.id, "module_id", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                          <option value="" className="bg-gray-900">None (flat list)</option>
                          {selectedModules.map((m) => <option key={m.id} value={m.id} className="bg-gray-900">{m.title}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs text-white/60 w-full sm:w-[calc(50%-0.375rem)]">
                        <span>Type</span>
                        <select value={item.content_type || "text"} onChange={(event) => updateCourseItem(item.id, "content_type", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                          {contentTypes.map((type) => <option key={type.value} value={type.value} className="bg-gray-900">{type.label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs text-white/60 w-full sm:w-[calc(50%-0.375rem)]">
                        <span>Drip delay (days after purchase)</span>
                        <input type="number" value={item.unlock_after_days || 0} onChange={(event) => updateCourseItem(item.id, "unlock_after_days", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="space-y-1 text-xs text-white/60 w-full">
                        <span>Unlock prerequisite (Must complete this first)</span>
                        <select value={item.unlock_on_completion_id || ""} onChange={(event) => updateCourseItem(item.id, "unlock_on_completion_id", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                          <option value="" className="bg-gray-900">None</option>
                          {selectedItems.filter(i => i.id !== item.id).map((i) => <option key={i.id} value={i.id} className="bg-gray-900">{i.title}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs text-white/60 w-full">
                        <span>Description</span>
                        <input value={item.description || ""} onChange={(event) => updateCourseItem(item.id, "description", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                      </label>
                      {item.content_type === "youtube" ? (
                        <label className="space-y-1 text-xs text-white/60 w-full">
                          <span>YouTube URL</span>
                          <input value={item.youtube_url || ""} onChange={(event) => updateCourseItem(item.id, "youtube_url", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" placeholder="https://youtube.com/watch?v=..." />
                        </label>
                      ) : null}

                      {["video", "audio"].includes(item.content_type) ? (
                        <div className="space-y-1 text-xs text-white/60 w-full rounded-xl border border-white/10 bg-black/40 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white/80">Upload File</span>
                            {uploadingTarget === `course-media-${item.id}` && <span className="font-semibold text-teal-300">Uploading...</span>}
                          </div>
                          <p className="mb-4 text-white/60">Upload a file directly to your private secure storage.</p>
                          <label className="cursor-pointer inline-flex items-center justify-center rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:bg-teal-300/20">
                            Choose file
                            <input
                              type="file"
                              accept={item.content_type === "video" ? "video/*" : item.content_type === "audio" ? "audio/*" : "*"}
                              className="hidden"
                              onChange={(e) => handleCourseMediaUpload?.(e, selectedCourse.id, item.id, updateCourseItem)}
                              disabled={uploadingTarget === `course-media-${item.id}`}
                            />
                          </label>
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <label className="space-y-1 w-full sm:w-[calc(50%-0.375rem)]">
                              <span>Private storage path</span>
                              <input value={item.storage_path || ""} onChange={(event) => updateCourseItem(item.id, "storage_path", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" placeholder="courses/file.mp4" />
                            </label>
                            <label className="space-y-1 w-full sm:w-[calc(50%-0.375rem)]">
                              <span>Or external generic URL (Optional)</span>
                              <input value={item.file_url || ""} onChange={(event) => updateCourseItem(item.id, "file_url", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" placeholder="https://..." />
                            </label>
                          </div>
                        </div>
                      ) : null}

                      {item.content_type === "link" ? (
                        <label className="space-y-1 text-xs text-white/60 w-full">
                          <span>External URL</span>
                          <input value={item.external_url || ""} onChange={(event) => updateCourseItem(item.id, "external_url", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" placeholder="https://..." />
                        </label>
                      ) : null}

                      <div className="flex flex-wrap gap-4 w-full">
                        {["video", "audio"].includes(item.content_type) ? (
                          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                            <input type="checkbox" checked={Boolean(item.allow_download)} onChange={(event) => updateCourseItem(item.id, "allow_download", event.target.checked)} />
                            Allow customer to download
                          </label>
                        ) : null}
                        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                          <input type="checkbox" checked={Boolean(item.is_active)} onChange={(event) => updateCourseItem(item.id, "is_active", event.target.checked)} />
                          Visible
                        </label>
                      </div>
                      <div className="w-full">
                        <p className="mb-1 text-xs text-white/60">Text content</p>
                        <SimpleEditor value={item.body || ""} onChange={(value) => updateCourseItem(item.id, "body", value)} minHeightClass="min-h-[10rem]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* <div className="border-t border-white/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Purchases</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                {selectedAccess.length ? selectedAccess.map((entry) => (
                  <div key={entry.id} className="border-b border-white/10 p-4 text-sm text-white/70 last:border-b-0">
                    <p className="font-semibold text-white">{entry.customer_name || entry.customer_email}</p>
                    <p className="mt-1 text-xs text-white/50">{entry.customer_email}</p>
                    <p className="mt-1 text-xs text-white/50">{entry.expires_at ? `Expires ${entry.expires_at}` : "Lifetime access"}</p>
                    {entry.access_url ? <a href={entry.access_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-teal-200 underline">Open access link</a> : null}
                  </div>
                )) : (
                  <div className="p-4 text-sm text-white/55">No purchases yet.</div>
                )}
              </div>
            </div> */}

            <div className="sticky bottom-0 z-50 mt-8 -mx-5 -mb-5 flex flex-wrap items-center justify-between gap-4 rounded-b-2xl border-t border-white/10 bg-black/80 px-5 py-4 shadow-2xl backdrop-blur-md sm:flex-nowrap">
              <button
                type="button"
                onClick={handleSaveCourse}
                disabled={isSavingCourse}
                className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {isSavingCourse ? "Saving..." : "Save course"}
              </button>
              <p className="hidden text-sm text-white/45 md:block">
                Edits are saved for the selected course.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-white/60 flex-1 min-w-0">Create or select a course to edit content.</div>
        )}
      </div>
    </section>
  );
};

export default CoursesTab;
