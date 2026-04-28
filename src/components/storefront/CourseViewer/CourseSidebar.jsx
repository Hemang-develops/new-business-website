import React from 'react';
import { CheckCircle2, Lock, PlayCircle, FileText, Music, Link2, ChevronRight, X, Menu } from 'lucide-react';

const CourseSidebar = ({ modules, items, selectedItemId, onSelectItem, progress, isOpen, onToggle }) => {
  // Group items by module
  const itemsByModule = items.reduce((acc, item) => {
    const moduleId = item.moduleId || 'un-grouped';
    if (!acc[moduleId]) acc[moduleId] = [];
    acc[moduleId].push(item);
    return acc;
  }, {});

  const renderItem = (item) => {
    const isSelected = selectedItemId === item.id;
    const isLocked = !item.isUnlocked;
    const isCompleted = item.isCompleted;

    const Icon = isLocked ? Lock :
      item.contentType === 'video' || item.contentType === 'youtube' ? PlayCircle :
        item.contentType === 'audio' ? Music :
          item.contentType === 'link' ? Link2 : FileText;

    return (
      <button
        key={item.id}
        disabled={isLocked}
        onClick={() => onSelectItem(item.id)}
        className={`w-full flex items-center transition-all duration-300 group
          ${isOpen ? 'px-4 py-3 gap-3' : 'px-0 py-3 justify-center'}
          ${isSelected ? 'bg-teal-300/10 text-teal-100 border-r-2 border-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}
          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${isSelected ? 'text-teal-300' : 'text-white/40 group-hover:text-white/60'}`} />
        <span className={`text-left truncate transition-all duration-300 origin-left ${isOpen ? 'opacity-100 w-full ml-0' : 'opacity-0 w-0 ml-[-10px] pointer-events-none'}`}>
          {item.title}
        </span>
        {isOpen && isCompleted && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
        {isOpen && isLocked && <span className="text-[10px] uppercase tracking-wider text-white/30">Locked</span>}
      </button>
    );
  };

  return (
    <div className={`h-full flex flex-col bg-gray-950/50 backdrop-blur-xl border-r border-white/10 overflow-hidden transition-all duration-300`}>
      <div className={`border-b border-white/10 transition-all duration-300 ${isOpen ? 'p-4' : 'p-2'}`}>
        <div className={`flex items-center transition-all duration-300 ${isOpen ? 'justify-between' : 'flex-col gap-4'}`}>
          <h2 className={`text-lg font-semibold text-white whitespace-nowrap transition-all duration-300 origin-left ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 h-0 pointer-events-none'}`}>
            Course Content
          </h2>
          <button 
            className={`flex items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-300 ${isOpen ? 'w-8 h-8' : 'w-10 h-10'}`}
            onClick={onToggle}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <div className={`transition-all duration-500 overflow-hidden ${isOpen ? 'mt-4 opacity-100 max-h-20' : 'mt-0 opacity-0 max-h-0'}`}>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/40 font-medium tracking-wide uppercase">
            {Math.round(progress)}% Completed
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {modules.length > 0 ? (
          modules.sort((a, b) => a.sort_order - b.sort_order).map((module) => (
            <div key={module.id} className="border-b border-white/5">
              <div className={`px-6 py-4 bg-white/[0.02] transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest truncate">{module.title}</h3>
                {module.description && <p className="mt-1 text-xs text-white/40 truncate">{module.description}</p>}
              </div>
              <div className="py-1">
                {(itemsByModule[module.id] || []).map(renderItem)}
              </div>
            </div>
          ))
        ) : (
          <div className="py-1">
            {items.map(renderItem)}
          </div>
        )}

        {/* Render items not in any module */}
        {itemsByModule['un-grouped'] && modules.length > 0 && (
          <div className="border-t border-white/5 mt-4">
            <div className={`px-6 py-4 bg-white/[0.02] transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Additional Resources</h3>
            </div>
            <div className="py-1">
              {itemsByModule['un-grouped'].map(renderItem)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSidebar;
