import React, { useState, useEffect, useMemo } from 'react';
import CourseSidebar from './CourseSidebar';
import CourseContent from './CourseContent';
import CourseAchievement from './CourseAchievement';
import { Menu } from 'lucide-react';
import { supabase } from '../../../supabase-client';
import { useToast } from '../../../context/ToastContext';

const CourseViewer = ({ course, modules, items, access }) => {
  const toast = useToast();
  const [selectedItemId, setSelectedItemId] = useState(() => {
    // Select first unlocked item by default
    const firstUnlocked = items.find(item => item.isUnlocked);
    return firstUnlocked ? firstUnlocked.id : (items[0]?.id || null);
  });
  const [localItems, setLocalItems] = useState(items);
  const [achievement, setAchievement] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const selectedItem = useMemo(() => 
    localItems.find(item => item.id === selectedItemId),
  [localItems, selectedItemId]);

  const progress = useMemo(() => {
    if (localItems.length === 0) return 0;
    const completedCount = localItems.filter(item => item.isCompleted).length;
    return (completedCount / localItems.length) * 100;
  }, [localItems]);

  const handleCompleteLesson = async () => {
    if (!selectedItem || selectedItem.isCompleted) return;

    try {
      // 1. Update progress in DB
      const { error } = await supabase
        .from('storefront_user_course_progress')
        .upsert({
          course_id: course.id,
          item_id: selectedItem.id,
          completed_at: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }, { onConflict: 'user_id,item_id' });

      if (error) throw error;

      // 2. Update local state
      const updatedItems = localItems.map(item => 
        item.id === selectedItem.id ? { ...item, isCompleted: true } : item
      );

      // 3. Check for achievements (e.g. module completion)
      if (selectedItem.moduleId) {
        const moduleItems = updatedItems.filter(i => i.moduleId === selectedItem.moduleId);
        const allModuleCompleted = moduleItems.every(i => i.isCompleted);
        
        if (allModuleCompleted) {
          const module = modules.find(m => m.id === selectedItem.moduleId);
          setAchievement({
            title: `${module.title} Mastered!`,
            description: `You've successfully completed all lessons in ${module.title}. Keep up the great momentum!`
          });
        }
      }

      // Check for unlock of next item (if it depended on this one)
      const finalItems = updatedItems.map(item => {
        if (item.unlockOnCompletionId === selectedItem.id) {
          return { ...item, isUnlocked: true };
        }
        return item;
      });

      setLocalItems(finalItems);
      toast.success("Lesson marked as completed!");

    } catch (error) {
      console.error("Error completing lesson:", error);
      toast.error("Failed to save progress.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transition-all duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'}
      `}>
        <CourseSidebar 
          modules={modules}
          items={localItems}
          selectedItemId={selectedItemId}
          onSelectItem={(id) => {
            setSelectedItemId(id);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          progress={progress}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-950 relative">
        {/* Mobile Header/Trigger */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center p-4 bg-gray-950/80 backdrop-blur border-b border-white/5">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 text-sm font-semibold text-white/80 truncate">
            {selectedItem?.title || 'Course Content'}
          </span>
        </div>

        <CourseContent 
          item={selectedItem} 
          onComplete={handleCompleteLesson}
        />
      </div>

      <CourseAchievement 
        achievement={achievement} 
        onClose={() => setAchievement(null)} 
      />
    </div>
  );
};

export default CourseViewer;
