import React, { useState, useEffect } from 'react';
import { Megaphone, ChevronLeft, ChevronRight, Pause, Play, X, AlertTriangle, Info, Sparkles, Bell } from 'lucide-react';
import { CompanySettings, FlashAnnouncement } from '../types';

interface FlashInfoTickerProps {
  company: CompanySettings;
}

export const FlashInfoTicker: React.FC<FlashInfoTickerProps> = ({ company }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const announcements = (company.flash_announcements || []).filter((a) => a.active);

  useEffect(() => {
    if (!company.flash_news_enabled || announcements.length === 0 || isPaused || dismissed) {
      return;
    }

    const intervalSeconds = (company.flash_news_speed || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, intervalSeconds);

    return () => clearInterval(timer);
  }, [company.flash_news_enabled, company.flash_news_speed, announcements.length, isPaused, dismissed]);

  if (!company.flash_news_enabled || announcements.length === 0 || dismissed) {
    return null;
  }

  const current = announcements[currentIndex % announcements.length];
  const primaryColor = company.primary_color || '#0f172a';

  const getTypeBadge = (type: FlashAnnouncement['type']) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-rose-500 text-white border-rose-600',
          label: '⚡ URGENT',
          icon: <AlertTriangle className="w-3 h-3 text-white mr-1 animate-bounce" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500 text-slate-950 border-amber-600',
          label: '⚠️ ALERTE',
          icon: <AlertTriangle className="w-3 h-3 text-slate-950 mr-1" />,
        };
      case 'promo':
        return {
          bg: 'bg-emerald-600 text-white border-emerald-700',
          label: '✨ INFO MARQUE',
          icon: <Sparkles className="w-3 h-3 text-white mr-1" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-600 text-white border-sky-700',
          label: '📢 FLASH INFO',
          icon: <Info className="w-3 h-3 text-white mr-1" />,
        };
    }
  };

  const badge = getTypeBadge(current.type);

  return (
    <div
      style={{ borderLeftColor: primaryColor }}
      className="bg-slate-900 text-white border-l-4 shadow-md transition-all duration-300 relative z-30"
    >
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left Ticker Label & Indicator */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="p-1 rounded bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center animate-pulse">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shadow-xs ${badge.bg}`}>
            {badge.icon}
            {badge.label}
          </span>
        </div>

        {/* Middle Sliding Announcement Message */}
        <div className="flex-1 overflow-hidden min-w-0 flex items-center">
          <div className="truncate animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="font-extrabold text-white mr-2">{current.title} :</span>
            <span className="text-slate-200 font-medium">{current.message}</span>
            {current.link_url && (
              <a
                href={current.link_url}
                target="_blank"
                rel="noreferrer"
                className="ml-2 font-bold underline text-amber-300 hover:text-amber-200"
              >
                En savoir plus &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Right Controls & Counter */}
        <div className="flex items-center space-x-1.5 shrink-0 text-slate-300">
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 hidden sm:inline-block">
            {currentIndex + 1}/{announcements.length}
          </span>

          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Précédent"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title={isPaused ? 'Reprendre la défilement' : 'Mettre en pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Suivant"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-[1px] bg-slate-700 my-auto mx-0.5" />

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-slate-800 hover:text-rose-400 rounded text-slate-400 transition-colors"
            title="Fermer le flash info"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
