import React, { useState, useEffect } from 'react';
import { Megaphone, ChevronLeft, ChevronRight, Pause, Play, X, AlertTriangle, Info, Sparkles, Target, SlidersHorizontal } from 'lucide-react';
import { CompanySettings, FlashAnnouncement, ResUser } from '../types';
import { getUserBillingProfile } from '../lib/formatters';

interface FlashInfoTickerProps {
  company: CompanySettings;
  currentUser?: ResUser | null;
}

export const FlashInfoTicker: React.FC<FlashInfoTickerProps> = ({ company, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tickerMode, setTickerMode] = useState<'marquee' | 'slide'>('marquee');

  // Filter announcements by active status AND targeted user profiles
  const isTargetedForUser = (announcement: FlashAnnouncement) => {
    const targets = announcement.target_profiles || ['all'];
    if (targets.length === 0 || targets.includes('all')) {
      return true;
    }

    if (!currentUser) return true;

    const roleLower = (currentUser.role || '').toLowerCase();
    const deptLower = (currentUser.department || '').toLowerCase();
    const loginLower = (currentUser.login || '').toLowerCase();
    const billingProfile = getUserBillingProfile(currentUser);

    for (const t of targets) {
      if (t === 'all') return true;
      if (t === 'facture' && (billingProfile === 'facture' || billingProfile === 'facture_caisse' || roleLower.includes('factur'))) return true;
      if (t === 'caisse' && (billingProfile === 'caisse' || billingProfile === 'facture_caisse' || roleLower.includes('caiss'))) return true;
      if (t === 'labo' && (roleLower.includes('biolog') || roleLower.includes('technic') || deptLower.includes('labo') || loginLower.includes('labo'))) return true;
      if (t === 'comptabilite' && (roleLower.includes('compta') || deptLower.includes('compta'))) return true;
      if (t === 'direction' && (roleLower.includes('supervis') || roleLower.includes('directeur') || billingProfile === 'superviseur')) return true;
      if (t === 'admin' && (loginLower === 'admin' || roleLower.includes('admin') || (currentUser.group_ids || []).includes(1))) return true;
    }

    return false;
  };

  const announcements = (company.flash_announcements || []).filter(
    (a) => a.active && isTargetedForUser(a)
  );

  useEffect(() => {
    if (!company.flash_news_enabled || announcements.length === 0 || isPaused || dismissed || tickerMode === 'marquee') {
      return;
    }

    const intervalSeconds = Math.max(5, company.flash_news_speed || 10) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, intervalSeconds);

    return () => clearInterval(timer);
  }, [company.flash_news_enabled, company.flash_news_speed, announcements.length, isPaused, dismissed, tickerMode]);

  if (!company.flash_news_enabled || announcements.length === 0 || dismissed) {
    return null;
  }

  const current = announcements[currentIndex % announcements.length];
  const primaryColor = company.primary_color || '#d97706';

  const getTypeBadge = (type: FlashAnnouncement['type']) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-rose-600 text-white border-rose-700',
          label: 'URGENT',
          icon: <AlertTriangle className="w-3 h-3 text-white mr-1 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-600 text-white border-amber-700',
          label: 'ALERTE',
          icon: <AlertTriangle className="w-3 h-3 text-white mr-1 shrink-0" />,
        };
      case 'promo':
        return {
          bg: 'bg-emerald-600 text-white border-emerald-700',
          label: 'COMMUNICATION',
          icon: <Sparkles className="w-3 h-3 text-white mr-1 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-600 text-white border-indigo-700',
          label: 'FLASH INFO',
          icon: <Info className="w-3 h-3 text-white mr-1 shrink-0" />,
        };
    }
  };

  const badge = getTypeBadge(current.type);

  const getTargetBadgeLabel = (targets?: string[]) => {
    if (!targets || targets.length === 0 || targets.includes('all')) return 'Tous les profils';
    const labels: Record<string, string> = {
      facture: 'Facturation',
      caisse: 'Caisse',
      labo: 'Laboratoire',
      comptabilite: 'Comptabilité',
      direction: 'Direction',
      admin: 'Administrateurs',
    };
    return targets.map((t) => labels[t] || t).join(', ');
  };

  // Calculate readable marquee animation duration based on total character length
  // Standard comfortable reading speed is ~10-15 characters per second.
  const totalChars = announcements.reduce((acc, a) => acc + (a.title ? a.title.length : 0) + (a.message ? a.message.length : 0), 0);
  // Base duration scaled so that text passes comfortably without rushing
  const baseSpeedMultiplier = company.flash_news_speed || 10;
  const speedSec = Math.max(30, Math.ceil(totalChars / 5) + baseSpeedMultiplier * 2);

  return (
    <div
      style={{ borderLeftColor: primaryColor }}
      className="bg-amber-50/90 text-slate-900 border-l-4 border border-amber-200/80 shadow-xs relative z-30 mb-3 rounded-lg overflow-hidden"
    >
      <style>{`
        @keyframes tickerContinuousScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker-marquee {
          display: inline-block;
          white-space: nowrap;
          padding-left: 10px;
          animation: tickerContinuousScroll ${speedSec}s linear infinite;
        }
        .ticker-container-hover:hover .animate-ticker-marquee {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-2 flex items-center justify-between gap-3 text-xs">
        {/* Left Ticker Label & Indicator */}
        <div className="flex items-center space-x-2 shrink-0 z-10 bg-amber-50/95 pr-2">
          <div className="p-1 rounded bg-amber-500/15 border border-amber-400/40 text-amber-800 flex items-center justify-center">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
            {badge.icon}
            {badge.label}
          </span>
          {current.target_profiles && !current.target_profiles.includes('all') && (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-white text-slate-700 border border-amber-200">
              <Target className="w-2.5 h-2.5 mr-1 text-amber-600" />
              Cible : {getTargetBadgeLabel(current.target_profiles)}
            </span>
          )}
        </div>

        {/* Middle Scrolling Announcement Message Area */}
        <div className="flex-1 overflow-hidden min-w-0 relative flex items-center h-7 ticker-container-hover">
          {tickerMode === 'marquee' ? (
            /* Continuous Marquee Scrolling Mode */
            <div
              className="animate-ticker-marquee text-slate-800 font-medium whitespace-nowrap cursor-pointer hover:text-amber-950 transition-colors"
              style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
            >
              {announcements.map((ann, idx) => (
                <span key={ann.id} className="inline-flex items-center mx-8">
                  <span className="font-bold text-amber-900 uppercase tracking-wide mr-2">[{ann.title}]</span>
                  <span className="text-slate-800 font-normal mr-3">{ann.message}</span>
                  {ann.link_url && (
                    <a
                      href={ann.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-700 underline font-semibold hover:text-indigo-900 mr-2"
                    >
                      En savoir plus &rarr;
                    </a>
                  )}
                  {idx < announcements.length - 1 && (
                    <span className="text-amber-400 font-bold ml-6">•</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            /* Step Slide Mode */
            <div className="w-full truncate animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="font-bold text-amber-900 mr-2">{current.title} :</span>
              <span className="text-slate-800 font-normal">{current.message}</span>
              {current.link_url && (
                <a
                  href={current.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-semibold underline text-indigo-700 hover:text-indigo-900"
                >
                  En savoir plus &rarr;
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Controls & Options */}
        <div className="flex items-center space-x-1.5 shrink-0 text-slate-700 z-10 bg-amber-50/95 pl-2">
          {/* Mode Switch Button */}
          <button
            type="button"
            onClick={() => setTickerMode(tickerMode === 'marquee' ? 'slide' : 'marquee')}
            className="p-1 hover:bg-amber-100/80 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center space-x-1 border border-amber-200 bg-white/80"
            title={tickerMode === 'marquee' ? 'Passer en Mode Slide' : 'Passer en Mode Défilement Continu'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[10px] font-semibold uppercase hidden xl:inline">
              {tickerMode === 'marquee' ? 'Défilement' : 'Slide'}
            </span>
          </button>

          {tickerMode === 'slide' && (
            <span className="text-[10px] font-medium font-mono px-2 py-0.5 bg-white rounded border border-amber-200 text-slate-700 hidden sm:inline-block">
              {currentIndex + 1}/{announcements.length}
            </span>
          )}

          {tickerMode === 'slide' && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
              className="p-1 hover:bg-amber-100 rounded text-slate-700 transition-colors cursor-pointer"
              title="Précédent"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-amber-100 rounded text-slate-700 transition-colors cursor-pointer border border-amber-200 bg-white/80"
            title={isPaused ? 'Reprendre le défilement' : 'Mettre en pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {tickerMode === 'slide' && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
              className="p-1 hover:bg-amber-100 rounded text-slate-700 transition-colors cursor-pointer"
              title="Suivant"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-[1px] bg-amber-300 my-auto mx-0.5" />

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-rose-100 hover:text-rose-700 rounded text-slate-500 transition-colors cursor-pointer"
            title="Masquer le flash info"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};




