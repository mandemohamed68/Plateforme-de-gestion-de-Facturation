import React, { useState, useEffect } from 'react';

interface SplashLoadingScreenProps {
  companyName?: string;
  watermarkText?: string;
  primaryColor?: string;
  logoUrl?: string;
  isDataReady: boolean;
  onFinished: () => void;
}

export const SplashLoadingScreen: React.FC<SplashLoadingScreenProps> = ({
  companyName = "LABORATOIRE D'ANALYSES MÉDICALES",
  watermarkText = "Système d'Information Hospitalier & Financier (SIH)",
  primaryColor = '#0f172a',
  logoUrl,
  isDataReady,
  onFinished,
}) => {
  const [progress, setProgress] = useState(20);
  const [statusMessage, setStatusMessage] = useState('Démarrage des services hospitaliers...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image error if logoUrl changes dynamically
  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage('Vérification des autorisations & sessions...');
    }, 280);

    const t2 = setTimeout(() => {
      setProgress(78);
      setStatusMessage('Chargement du catalogue clinique & comptable...');
    }, 680);

    const t3 = setTimeout(() => {
      setProgress(94);
      setStatusMessage('Synchronisation des modules en cours...');
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (isDataReady) {
      const readyTimer = setTimeout(() => {
        setProgress(100);
        setStatusMessage('Système prêt');

        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
          const doneTimer = setTimeout(() => {
            onFinished();
          }, 450);
          return () => clearTimeout(doneTimer);
        }, 300);

        return () => clearTimeout(fadeTimer);
      }, 600);

      return () => clearTimeout(readyTimer);
    }
  }, [isDataReady, onFinished]);

  const hasValidLogo = Boolean(logoUrl && logoUrl.trim().length > 0 && !imageError);

  return (
    <div
      id="splash-loading-screen"
      className={`fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center font-sans select-none overflow-hidden transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle background ambient warmth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-slate-50/60 rounded-full blur-[140px]" />
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">
        
        {/* Rounded Squircle Card with Multi-Color Ambient Halo Glow */}
        <div className="relative flex items-center justify-center">
          
          {/* Ambient Multi-Color Halo (identical to reference image) */}
          <div className="absolute -inset-6 pointer-events-none transition-all duration-700">
            {/* Cyan / Blue glow top-left */}
            <div className="absolute -top-3 left-2 w-32 h-32 bg-sky-400/40 rounded-full blur-2xl" />
            {/* Green / Lime glow mid-left */}
            <div className="absolute top-8 -left-4 w-32 h-32 bg-emerald-400/45 rounded-full blur-2xl" />
            {/* Red / Orange / Coral glow bottom */}
            <div className="absolute -bottom-4 left-6 right-6 h-28 bg-rose-500/50 rounded-full blur-2xl" />
            {/* Blue / Purple glow right */}
            <div className="absolute top-4 -right-4 w-32 h-32 bg-indigo-400/35 rounded-full blur-2xl" />
            {/* Central diffuse blend */}
            <div className="absolute inset-2 rounded-[48px] bg-gradient-to-tr from-rose-400/25 via-emerald-300/20 to-sky-400/30 blur-xl" />
          </div>

          {/* White Squircle Card */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-slate-100/90 flex items-center justify-center p-6 z-10 overflow-hidden">
            {hasValidLogo ? (
              <img
                src={logoUrl}
                alt={companyName}
                onError={() => setImageError(true)}
                className="w-full h-full object-contain select-none transition-transform duration-300 hover:scale-105"
              />
            ) : (
              /* Default Clean Emblem (matches the silhouette inside circle style) */
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-inner">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 fill-white stroke-none"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Branding & Establishment Name */}
        <div className="mt-8 text-center flex flex-col items-center">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight max-w-sm leading-snug">
            {companyName}
          </h1>

          <p className="text-xs font-medium text-slate-500 tracking-normal mt-1 max-w-xs">
            {watermarkText}
          </p>
        </div>

        {/* Minimalist Loading Gauge */}
        <div className="mt-7 w-full max-w-xs flex flex-col items-center">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-0 relative">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          <div className="w-full flex items-center justify-between mt-2.5 text-[11px] font-medium text-slate-500">
            <span className="truncate max-w-[220px] text-left">
              {statusMessage}
            </span>
            <span className="font-mono text-slate-900 font-bold ml-2 tabular-nums">
              {progress}%
            </span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400">
        <p>Système Sécurisé • HDS &amp; ISO 27001</p>
      </div>
    </div>
  );
};
