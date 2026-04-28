import React, { useEffect, useState } from 'react';
import { Trophy, Star, Award, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const CourseAchievement = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2dd4bf', '#fbbf24', '#f472b6']
      });

      const timer = setTimeout(() => {
        // Auto close after 5 seconds if not closed manually
        // setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`relative w-full max-w-sm bg-gray-950 border border-white/10 rounded-3xl p-8 text-center shadow-2xl transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
        <button 
          onClick={() => { setIsVisible(false); setTimeout(onClose, 500); }}
          className="absolute top-4 right-4 text-white/20 hover:text-white/60"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-400 blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-teal-400/10 border-2 border-teal-400/30 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-teal-400" />
            </div>
          </div>
        </div>

        <p className="text-teal-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Achievement Unlocked</p>
        <h3 className="text-2xl font-bold text-white mb-4">{achievement.title}</h3>
        <p className="text-white/50 mb-8">{achievement.description}</p>

        <button
          onClick={() => { setIsVisible(false); setTimeout(onClose, 500); }}
          className="w-full py-4 bg-teal-300 text-gray-950 font-bold rounded-2xl hover:bg-teal-200 transition-colors"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
};

export default CourseAchievement;
