import React from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import RichTextContent from '../../ui/RichTextContent';

const CourseContent = ({ item, onComplete }) => {
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

        {/* Complete Lesson Button */}
        {!item.isCompleted && (
          <div className="pt-10 mt-10 border-t border-white/10 flex justify-center">
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-10 py-4 bg-teal-300/10 border border-teal-300/30 text-teal-300 font-bold rounded-full hover:bg-teal-300 hover:text-gray-950 transition-all duration-300"
            >
              <CheckCircle className="w-5 h-5" />
              Mark as Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;
