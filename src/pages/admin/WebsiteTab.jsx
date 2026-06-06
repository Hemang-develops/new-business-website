import { Wand2 } from "lucide-react";
import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import { generateRandomTheme } from "../../utils/themeGenerator";
import ImageUploader from "@/components/ui/ImageUploader";
import { siteLinkGroupMeta, themeFieldMeta, themePresets } from "./catalogAdminConfig";

const WebsiteTab = ({ state, actions }) => {
  const {
    isFooterEditorSelected,
    isSavingSite,
    offerings,
    selectedSiteSection,
    selectedSiteSectionId,
    selectedSiteSectionIndex,
    selectedSiteSectionItems,
    selectedSiteSectionMeta,
    siteSettingsEditor,
    uploadingTarget,
  } = state;
  const {
    addSiteLink,
    addSiteSectionItem,
    applyThemePreset,
    handleProfileImageUpload,
    handleSaveSiteSettings,
    moveSiteLink,
    moveSiteSection,
    moveSiteSectionItem,
    removeSiteLink,
    removeSiteSectionItem,
    setSelectedSiteSectionId,
    updateSiteFaqs,
    updateSiteFooter,
    updateSiteLink,
    updateSiteSection,
    updateSiteSectionItem,
    updateSiteSettings,
  } = actions;
  return (

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(7,12,22,0.94),rgba(9,16,28,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-200/80">Website editor</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      Edit the public website with section-first.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      Brand, profile, and theme live above. Homepage sections are edited one at a time below so the admin can
                      focus on what visitors actually see.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Brand and navigation</p>
                    <div className="mt-4 flex flex-col gap-3">
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Navigation title</span>
                        <input
                          value={siteSettingsEditor.brand.navTitle}
                          onChange={(event) => updateSiteSettings("brand", "navTitle", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Full brand title</span>
                        <input
                          value={siteSettingsEditor.brand.fullTitle}
                          onChange={(event) => updateSiteSettings("brand", "fullTitle", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Footer tagline</span>
                        <textarea
                          value={siteSettingsEditor.brand.footerTagline}
                          onChange={(event) => updateSiteSettings("brand", "footerTagline", event.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="flex-1 space-y-1 text-xs text-white/60">
                          <span>Shop button label</span>
                          <input
                            value={siteSettingsEditor.brand.shopLabel}
                            onChange={(event) => updateSiteSettings("brand", "shopLabel", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                        <label className="flex-1 space-y-1 text-xs text-white/60">
                          <span>Shop button link</span>
                          <input
                            value={siteSettingsEditor.brand.shopHref}
                            onChange={(event) => updateSiteSettings("brand", "shopHref", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                      </div>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Support email</span>
                        <input
                          value={siteSettingsEditor.brand.supportEmail}
                          onChange={(event) => updateSiteSettings("brand", "supportEmail", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Profile media</p>
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <ImageUploader
                          label={uploadingTarget === "site-profile-image" ? "Uploading..." : "Upload profile image"}
                          disabled={uploadingTarget === "site-profile-image"}
                          onPick={handleProfileImageUpload}
                        />
                        {siteSettingsEditor.profile.imageUrl ? (
                          <a
                            href={siteSettingsEditor.profile.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-white/55 underline-offset-4 hover:text-white hover:underline"
                          >
                            Preview image
                          </a>
                        ) : null}
                      </div>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Profile image URL</span>
                        <input
                          value={siteSettingsEditor.profile.imageUrl}
                          onChange={(event) => updateSiteSettings("profile", "imageUrl", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Profile image alt</span>
                        <input
                          value={siteSettingsEditor.profile.imageAlt}
                          onChange={(event) => updateSiteSettings("profile", "imageAlt", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Profile role label</span>
                        <input
                          value={siteSettingsEditor.profile.roleLabel}
                          onChange={(event) => updateSiteSettings("profile", "roleLabel", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Theme direction</p>
                        <p className="mt-1 text-xs text-white/55">A compact palette editor with presets and live swatches, not just five raw hex inputs.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {themePresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => applyThemePreset(preset.theme)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-teal-100"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {themeFieldMeta.map(({ key, label, hint }) => (
                        <label
                          key={key}
                          className="min-w-[180px] flex-1 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          <div
                            className="h-16 rounded-xl border border-white/10"
                            style={{ backgroundColor: siteSettingsEditor.theme[key] }}
                          />
                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="color"
                              value={siteSettingsEditor.theme[key]}
                              onChange={(event) => updateSiteSettings("theme", key, event.target.value)}
                              className="h-11 w-12 rounded-xl border border-white/10 bg-black/40 p-1"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">{label}</p>
                              <p className="mt-1 text-xs text-white/45">{hint}</p>
                            </div>
                          </div>
                          <input
                            value={siteSettingsEditor.theme[key]}
                            onChange={(event) => updateSiteSettings("theme", key, event.target.value)}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Frequently asked questions</p>
                        <p className="mt-1 text-xs text-white/55">
                          These entries power the public website FAQ content and now save through the bounded settings tables.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSiteFaqs([
                            ...(siteSettingsEditor.faqs || []),
                            { question: "New Question", answer: "The answer..." },
                          ])
                        }
                        className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100 transition hover:bg-teal-300/20"
                      >
                        Add FAQ
                      </button>
                    </div>

                    <div className="mt-4 space-y-6">
                      {siteSettingsEditor.faqs?.length ? (
                        siteSettingsEditor.faqs.map((faq, index) => (
                          <div key={index} className="relative space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <button
                              type="button"
                              onClick={() => {
                                const nextFaqs = [...(siteSettingsEditor.faqs || [])];
                                nextFaqs.splice(index, 1);
                                updateSiteFaqs(nextFaqs);
                              }}
                              className="absolute right-3 top-3 text-white/40 transition hover:text-rose-300"
                              title="Delete FAQ"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <label className="block space-y-1">
                              <span className="text-xs font-medium text-white/70">Question</span>
                              <input
                                type="text"
                                value={faq.question || ""}
                                onChange={(event) => {
                                  const nextFaqs = [...(siteSettingsEditor.faqs || [])];
                                  nextFaqs[index] = { ...faq, question: event.target.value };
                                  updateSiteFaqs(nextFaqs);
                                }}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="What should visitors know first?"
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-xs font-medium text-white/70">Answer</span>
                              <SimpleEditor
                                value={faq.answer || ""}
                                onChange={(value) => {
                                  const nextFaqs = [...(siteSettingsEditor.faqs || [])];
                                  nextFaqs[index] = { ...faq, answer: value };
                                  updateSiteFaqs(nextFaqs);
                                }}
                                minHeightClass="min-h-[8rem]"
                                placeholder="Write the answer here..."
                              />
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/50">
                          No FAQs added yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Website sections</p>
                        <p className="mt-1 text-xs text-white/55">Choose a section on the left, then edit the exact content block visitors see on the right.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 xl:flex-row">
                      <div className="min-w-0 xl:w-[340px] xl:h-[calc(100vh-280px)] overflow-y-auto pr-2">
                        <div className="flex flex-col gap-2.5">
                          {siteSettingsEditor.sections.map((section, index) => (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => setSelectedSiteSectionId(section.id)}
                              className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${selectedSiteSection?.id === section.id
                                  ? "border-teal-300/35 bg-teal-300/10 shadow-[0_10px_30px_rgba(45,212,191,0.08)]"
                                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-white">{section.label}</p>
                                    {!section.enabled ? (
                                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                                        Hidden
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs text-white/50">{section.heading || "No heading yet."}</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {section.navVisible ? <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Nav</span> : null}
                                    {section.footerVisible ? <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Footer</span> : null}
                                  </div>
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/50">{index + 1}</span>
                              </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedSiteSectionId("__footer")}
                            className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${isFooterEditorSelected
                                ? "border-teal-300/35 bg-teal-300/10 shadow-[0_10px_30px_rgba(45,212,191,0.08)]"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-white">Footer</p>
                                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">
                                    Global
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-white/50">
                                  Edit footer intro copy, legal links, and all footer link groups in one place.
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/50">
                                F
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {isFooterEditorSelected ? (
                        <div className="min-w-0 flex-1 rounded-[1.7rem] border border-white/10 bg-black/10 p-5 xl:h-[calc(100vh-280px)] overflow-y-auto">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Editing section</p>
                              <h3 className="mt-2 text-2xl font-semibold text-white">Footer</h3>
                              <p className="mt-2 max-w-2xl text-sm text-white/55">Treat the footer like a real content section: intro copy, legal copy, and each link column are edited here.</p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-4">
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Footer eyebrow</span>
                              <input value={siteSettingsEditor.footer.introEyebrow} onChange={(event) => updateSiteFooter("introEyebrow", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Footer heading</span>
                              <textarea value={siteSettingsEditor.footer.introHeading} onChange={(event) => updateSiteFooter("introHeading", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Footer tagline</span>
                              <textarea value={siteSettingsEditor.brand.footerTagline} onChange={(event) => updateSiteSettings("brand", "footerTagline", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Status pill label</span>
                              <input value={siteSettingsEditor.footer.statusLabel} onChange={(event) => updateSiteFooter("statusLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Terms label</span>
                                <input value={siteSettingsEditor.footer.termsLabel} onChange={(event) => updateSiteFooter("termsLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Terms link</span>
                                <input value={siteSettingsEditor.footer.termsHref} onChange={(event) => updateSiteFooter("termsHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Privacy label</span>
                                <input value={siteSettingsEditor.footer.privacyLabel} onChange={(event) => updateSiteFooter("privacyLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Privacy link</span>
                                <input value={siteSettingsEditor.footer.privacyHref} onChange={(event) => updateSiteFooter("privacyHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>

                            <div className="border-t border-white/10 pt-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Footer link groups</p>
                              <div className="mt-4 flex flex-col gap-5">
                                {siteLinkGroupMeta.map((group) => {
                                  const groupLinks = siteSettingsEditor.links
                                    .filter((link) => link.groupKey === group.key)
                                    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
                                  return (
                                    <div key={group.key} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-white">{group.title}</p>
                                          <p className="mt-1 text-xs text-white/55">{group.description}</p>
                                        </div>
                                        <button type="button" onClick={() => addSiteLink(group.key)} className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                                          Add link
                                        </button>
                                      </div>
                                      <div className="mt-4 flex flex-col divide-y divide-white/10">
                                        {groupLinks.map((link, index) => (
                                          <div key={link.key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                                <input type="checkbox" checked={Boolean(link.enabled)} onChange={(event) => updateSiteLink(link.key, "enabled", event.target.checked)} />
                                                Visible
                                              </label>
                                              <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => moveSiteLink(link.key, -1)} disabled={index === 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Up</button>
                                                <button type="button" onClick={() => moveSiteLink(link.key, 1)} disabled={index === groupLinks.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Down</button>
                                                <button type="button" onClick={() => removeSiteLink(link.key)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">Delete</button>
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                                <span>Label</span>
                                                <input value={link.label || ""} onChange={(event) => updateSiteLink(link.key, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                                <span>URL</span>
                                                <input value={link.href || ""} onChange={(event) => updateSiteLink(link.key, "href", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                                <span>Display value</span>
                                                <input value={link.value || ""} onChange={(event) => updateSiteLink(link.key, "value", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                              <label className="w-full space-y-1 text-xs text-white/60 sm:w-48">
                                                <span>Icon key</span>
                                                <input value={link.icon || ""} onChange={(event) => updateSiteLink(link.key, "icon", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : selectedSiteSection ? (
                        <div className="min-w-0 flex-1 rounded-[1.7rem] border border-white/10 bg-black/10 p-5 xl:h-[calc(100vh-280px)] overflow-y-auto">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Editing section</p>
                              <h3 className="mt-2 text-2xl font-semibold text-white">{selectedSiteSection.label}</h3>
                              <p className="mt-2 max-w-2xl text-sm text-white/55">Update this section's copy, buttons, and visibility without scanning unrelated fields.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveSiteSection(selectedSiteSection.id, -1)}
                                disabled={selectedSiteSectionIndex <= 0}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40"
                              >
                                Move up
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSiteSection(selectedSiteSection.id, 1)}
                                disabled={selectedSiteSectionIndex === siteSettingsEditor.sections.length - 1}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40"
                              >
                                Move down
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                              <input type="checkbox" checked={Boolean(selectedSiteSection.enabled)} onChange={(event) => updateSiteSection(selectedSiteSection.id, "enabled", event.target.checked)} />
                              Show on website
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                              <input type="checkbox" checked={Boolean(selectedSiteSection.navVisible)} onChange={(event) => updateSiteSection(selectedSiteSection.id, "navVisible", event.target.checked)} />
                              Show in navigation
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                              <input type="checkbox" checked={Boolean(selectedSiteSection.footerVisible)} onChange={(event) => updateSiteSection(selectedSiteSection.id, "footerVisible", event.target.checked)} />
                              Show in footer
                            </label>
                          </div>

                          <div className="mt-5 flex flex-col gap-4">
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Display label</span>
                              <input value={selectedSiteSection.label} onChange={(event) => updateSiteSection(selectedSiteSection.id, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Eyebrow</span>
                              <input value={selectedSiteSection.eyebrow || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "eyebrow", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Heading</span>
                              <input value={selectedSiteSection.heading || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "heading", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Description</span>
                              <SimpleEditor value={selectedSiteSection.description || ""} onChange={(value) => updateSiteSection(selectedSiteSection.id, "description", value)} minHeightClass="min-h-[12rem]" />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Primary button text</span>
                                <input value={selectedSiteSection.primaryCtaLabel || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "primaryCtaLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Primary button link</span>
                                <input value={selectedSiteSection.primaryCtaHref || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "primaryCtaHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Secondary button text</span>
                                <input value={selectedSiteSection.secondaryCtaLabel || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "secondaryCtaLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Secondary button link</span>
                                <input value={selectedSiteSection.secondaryCtaHref || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "secondaryCtaHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>

                            {selectedSiteSectionMeta.advancedFields?.length ? (
                              <div className="border-t border-white/10 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Supporting content</p>
                                <div className="mt-4 flex flex-col gap-3">
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingEyebrow") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting eyebrow</span>
                                      <input value={selectedSiteSection.supportingEyebrow || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "supportingEyebrow", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingHeading") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting heading</span>
                                      <input value={selectedSiteSection.supportingHeading || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "supportingHeading", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingDescription") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting description</span>
                                      <SimpleEditor value={selectedSiteSection.supportingDescription || ""} onChange={(value) => updateSiteSection(selectedSiteSection.id, "supportingDescription", value)} minHeightClass="min-h-[10rem]" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formHeading") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form heading</span>
                                      <input value={selectedSiteSection.formHeading || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formHeading", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formDescription") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form description</span>
                                      <SimpleEditor value={selectedSiteSection.formDescription || ""} onChange={(value) => updateSiteSection(selectedSiteSection.id, "formDescription", value)} minHeightClass="min-h-[10rem]" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formSubmitLabel") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form submit button</span>
                                      <input value={selectedSiteSection.formSubmitLabel || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formSubmitLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formDisclaimer") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form disclaimer</span>
                                      <SimpleEditor value={selectedSiteSection.formDisclaimer || ""} onChange={(value) => updateSiteSection(selectedSiteSection.id, "formDisclaimer", value)} minHeightClass="min-h-[8rem]" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formAction") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Newsletter form action URL</span>
                                      <input value={selectedSiteSection.formAction || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formAction", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("featuredOfferingId") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Featured product</span>
                                      <select value={selectedSiteSection.featuredOfferingId || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "featuredOfferingId", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                                        <option value="" className="bg-gray-900">None</option>
                                        {offerings.map((offering) => (
                                          <option key={offering.id} value={offering.id} className="bg-gray-900">
                                            {offering.title}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {selectedSiteSectionMeta.itemType ? (
                              <div className="border-t border-white/10 pt-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">{selectedSiteSectionMeta.itemTitle}</p>
                                    <p className="mt-1 text-xs text-white/55">{selectedSiteSectionMeta.itemDescription}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addSiteSectionItem(selectedSiteSection.id, selectedSiteSectionMeta.itemType)}
                                    className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100"
                                  >
                                    Add item
                                  </button>
                                </div>
                                <div className="mt-4 flex flex-col divide-y divide-white/10">
                                  {selectedSiteSectionItems.map((item, index) => (
                                    <div key={item.key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-2">
                                          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                            <input type="checkbox" checked={Boolean(item.enabled)} onChange={(event) => updateSiteSectionItem(item.key, "enabled", event.target.checked)} />
                                            Visible
                                          </label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <button type="button" onClick={() => moveSiteSectionItem(item.key, -1)} disabled={index === 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Up</button>
                                          <button type="button" onClick={() => moveSiteSectionItem(item.key, 1)} disabled={index === selectedSiteSectionItems.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Down</button>
                                          <button type="button" onClick={() => removeSiteSectionItem(item.key)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">Delete</button>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-3">
                                        {selectedSiteSectionMeta.fields.includes("title") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Title</span>
                                            <input value={item.title || ""} onChange={(event) => updateSiteSectionItem(item.key, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("description") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Description</span>
                                            <SimpleEditor value={item.description || ""} onChange={(value) => updateSiteSectionItem(item.key, "description", value)} minHeightClass="min-h-[8rem]" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("label") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Button label</span>
                                            <input value={item.label || ""} onChange={(event) => updateSiteSectionItem(item.key, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("href") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Link URL</span>
                                            <input value={item.href || ""} onChange={(event) => updateSiteSectionItem(item.key, "href", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("icon") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Icon key</span>
                                            <input value={item.icon || ""} onChange={(event) => updateSiteSectionItem(item.key, "icon", event.target.value)} placeholder="sparkles, layers, library, users" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {selectedSiteSectionMeta.linkGroup ? (
                              <div className="border-t border-white/10 pt-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Contact methods</p>
                                    <p className="mt-1 text-xs text-white/55">These links sit above the contact form.</p>
                                  </div>
                                  <button type="button" onClick={() => addSiteLink(selectedSiteSectionMeta.linkGroup)} className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">Add link</button>
                                </div>
                                <div className="mt-4 flex flex-col divide-y divide-white/10">
                                  {siteSettingsEditor.links
                                    .filter((link) => link.groupKey === selectedSiteSectionMeta.linkGroup)
                                    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
                                    .map((link, index, list) => (
                                      <div key={link.key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                            <input type="checkbox" checked={Boolean(link.enabled)} onChange={(event) => updateSiteLink(link.key, "enabled", event.target.checked)} />
                                            Visible
                                          </label>
                                          <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => moveSiteLink(link.key, -1)} disabled={index === 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Up</button>
                                            <button type="button" onClick={() => moveSiteLink(link.key, 1)} disabled={index === list.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Down</button>
                                            <button type="button" onClick={() => removeSiteLink(link.key)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">Delete</button>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                          <label className="flex-1 space-y-1 text-xs text-white/60">
                                            <span>Label</span>
                                            <input value={link.label || ""} onChange={(event) => updateSiteLink(link.key, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                          <label className="flex-1 space-y-1 text-xs text-white/60">
                                            <span>Display value</span>
                                            <input value={link.value || ""} onChange={(event) => updateSiteLink(link.key, "value", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                          <label className="flex-1 space-y-1 text-xs text-white/60">
                                            <span>Link URL</span>
                                            <input value={link.href || ""} onChange={(event) => updateSiteLink(link.key, "href", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                          <label className="w-full space-y-1 text-xs text-white/60 sm:w-48">
                                            <span>Icon key</span>
                                            <input value={link.icon || ""} onChange={(event) => updateSiteLink(link.key, "icon", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="border-t border-white/10 pt-5">
                              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Advanced</p>
                              <label className="mt-3 block space-y-1 text-xs text-white/60">
                                <span>Anchor</span>
                                <input value={selectedSiteSection.anchor} onChange={(event) => updateSiteSection(selectedSiteSection.id, "anchor", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="sticky bottom-4 z-50 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-300/20 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md sm:flex-nowrap">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveSiteSettings}
                        disabled={isSavingSite}
                        className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                      >
                        {isSavingSite ? "Saving..." : "Save site settings"}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThemePreset(generateRandomTheme())}
                        className="flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-medium text-teal-100 transition-colors hover:bg-teal-300/20"
                      >
                        <Wand2 className="h-4 w-4" />
                        Randomize Theme
                      </button>
                    </div>
                    <p className="hidden text-sm text-white/45 md:block">These changes affect the live storefront shell immediately.</p>
                  </div>
                </div>
              </section>
  );
};

export default WebsiteTab;
