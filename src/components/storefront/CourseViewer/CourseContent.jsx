import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, ArrowRight, Flag, ThumbsUp, ThumbsDown, X, Check } from 'lucide-react';
import RichTextContent from '../../ui/RichTextContent';
import { Textarea } from "../../ui/textarea";
import Comments from '@/components/Comments';

const CourseContent = ({ item, onComplete, onNextItem, nextItem, onLikeItem, onDislikeItem }) => {
    const [isIssueReportDialogOpen, setIsIssueReportDialogOpen] = useState(false);
    const [issueReportForm, setIssueReportForm] = React.useState({
      issue: '',
      issueDescription: '',
    });

  const handleChange = (event) => {
    setIssueReportForm((prevForm) => ({
      ...prevForm,
      [event.target.name]: event.target.value
    }));
  };
    const handleIssueReportSubmit = (event) => {
      event.preventDefault();
      // Handle issue report submission logic here
      setIsIssueReportDialogOpen(false);
    };

    const closeIssueReportDialog = () => {
      setIsIssueReportDialogOpen(false);
    };
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 p-10">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg">Select a lesson to start learning</p>
      </div>
    );
  }

  if (!item.isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">This lesson is locked</h2>
        <p className="text-white/50 max-w-md">
          {item.unlockAfterDays > 0 
            ? `This content will be available ${item.unlockAfterDays} days after your purchase.`
            : "Complete the previous lessons to unlock this content."}
        </p>
      </div>
    );
  }

  const getYouTubeEmbedUrl = (url) => {
    const value = String(url || "").trim();
    const match = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : value;
  };

  const isTextLesson = item.contentType === 'text';
  const showMarkCompleteButton = isTextLesson && !item.isCompleted;
  const showNextItemButton = !isTextLesson && Boolean(nextItem);
  const showCompletedTextNextButton = isTextLesson && item.isCompleted && Boolean(nextItem);
  const actionButtonClassName = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-300/55 bg-teal-300/[0.04] px-5 text-[15px] font-semibold text-teal-200 shadow-[0_0_0_1px_rgba(45,212,191,0.08)] transition-all duration-200 hover:border-teal-200 hover:bg-teal-300/12 hover:text-white";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
            {item.contentType}
          </span>
          {item.isCompleted && (
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded">
              <CheckCircle className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          {item.title}
        </h1>
        {item.description && (
          <p className="mt-4 text-lg text-white/50 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div className="space-y-10">
        {item.contentType === 'youtube' && item.youtubeUrl && (
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
            <iframe
              src={getYouTubeEmbedUrl(item.youtubeUrl)}
              title={item.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {(item.contentType === 'video' || item.contentType === 'audio') && (item.signedUrl || item.fileUrl) && (
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
            {item.contentType === 'video' ? (
              <video 
                controls 
                className="w-full" 
                poster={item.thumbnailUrl}
                onEnded={onComplete}
              >
                <source src={item.signedUrl || item.fileUrl} />
              </video>
            ) : (
              <div className="p-8 bg-white/5">
                <audio 
                  controls 
                  className="w-full"
                  onEnded={onComplete}
                >
                  <source src={item.signedUrl || item.fileUrl} />
                </audio>
              </div>
            )}
          </div>
        )}

        {item.body && (
          <div className="prose prose-invert max-w-none">
            <RichTextContent value={item.body} />
          </div>
        )}

        {item.contentType === 'link' && item.externalUrl && (
          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 text-center">
            <p className="text-white/60 mb-6">This lesson includes an external resource.</p>
            <a 
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-teal-300 text-gray-950 font-bold rounded-full hover:bg-teal-200 transition-colors"
            >
              Open External Resource
            </a>
          </div>
        )}

        <div className='pt-8 mt-10 border-t border-white/30 flex justify-between'>
          <div className='flex justify-between items-start gap-4'>
            <button
                  onClick={onLikeItem}
                  className='flex items-center gap-1 text-sm text-white/50 hover:text-teal-200 transition'
                >
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </button>
                <button
                  onClick={onDislikeItem}
                  className='flex items-center gap-1 text-sm text-white/50 hover:text-teal-200 transition'
                >
                  <ThumbsDown className="w-4 h-4" />
                  Dislike
                </button>
                <button
                  onClick={() => setIsIssueReportDialogOpen(true)}
                  className='flex items-center gap-1 text-sm text-white/50 hover:text-teal-200 transition'
                >
                  <Flag className="w-4 h-4" />
                  Report an issue
                </button>
          </div>

          {(showMarkCompleteButton || showNextItemButton || showCompletedTextNextButton) && (
            <div className="">
              {showMarkCompleteButton && (
                <button
                  onClick={onComplete}
                  className={actionButtonClassName}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as completed
                </button>
              )}

              {(showNextItemButton || showCompletedTextNextButton) && (
                <button
                  onClick={onNextItem}
                  className={actionButtonClassName}
                >
                  Next item
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {isIssueReportDialogOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-contrast-50"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeIssueReportDialog();
          }}
        >
          <form
            onSubmit={handleIssueReportSubmit}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-gray-950 p-5 text-white shadow-2xl shadow-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="profile-edit-title" className="mt-2 text-2xl font-semibold text-white">
                  Report an issue
                </h3>
              </div>
              <button
                type="button"
                onClick={closeIssueReportDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
                aria-label="Close profile editor"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <label className="block space-y-2">
                <span className="text-sm text-white/75">
                  Select an issue you'd like to report
                </span>

                <div className="flex flex-col gap-2 mt-2">
                  {[
                    "content-improvement",
                    "video-issues",
                    "audio-issues",
                    "offensive-content",
                    "subtitles-issues",
                    "general-problem",
                  ].map((issue) => (
                    <label key={issue} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="issue"
                        value={issue}
                        checked={issueReportForm.issue === issue}
                        onChange={(e) =>
                          setIssueReportForm((prev) => ({
                            ...prev,
                            issue: e.target.value,
                          }))
                        }
                        className="accent-blue-500"
                      />
                      <span className="text-white/50 hover:text-white/80 text-sm capitalize">
                        {issue.replace("-", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </label>
            </div> 

            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-white/75">Describe the issue</span>
                <Textarea
                  name="issueDescription"
                  value={issueReportForm.issueDescription}
                  onChange={(e) => setIssueReportForm({...issueReportForm, issueDescription: e.target.value})}
                  placeholder='Example: video not loading'
                  className="border-white/15 bg-black/30 text-white focus-visible:border-teal-300"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeIssueReportDialog}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/35 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                // disabled={isProfileSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Check className="h-4 w-4" />
                {/* {isProfileSaving ? "Saving..." : "Save details"} */}
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="mt-16">
        <Comments pageType="course_item" pageId={item.id} moduleId={item.moduleId} />
      </div>
    </div>
  );
};

export default CourseContent;
