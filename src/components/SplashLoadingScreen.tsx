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
  companyName = 'LABORATOIRE D\'ANALYSES MÉDICALES',
  watermarkText = "Système d'Information Hospitalier & Financier (SIH)",
  primaryColor = '#0f172a',
  logoUrl,
  isDataReady,
  onFinished,
}) => {
  const [progress, setProgress] = useState(18);
  const [statusMessage, setStatusMessage] = useState('Initialisation des services sécurisés...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(42);
      setStatusMessage('Vérification des autorisations & sessions...');
    }, 280);

    const t2 = setTimeout(() => {
      setProgress(74);
      setStatusMessage('Chargement du catalogue clinique & comptable...');
    }, 680);

    const t3 = setTimeout(() => {
      setProgress(92);
      setStatusMessage('Sychronisation des modules en cours...');
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
          }, 400);
          return () => clearTimeout(doneTimer);
        }, 300);

        return () => clearTimeout(fadeTimer);
      }, 700);

      return () => clearTimeout(readyTimer);
    }
  }, [isDataReady, onFinished]);

  return (
    <div
      id="splash-loading-screen"
      className={`fixed inset-0 z-[999999] bg-[#0b0f19] flex flex-col items-center justify-center font-sans select-none overflow-hidden transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background subtle radial ambient highlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">
        
        {/* Executive Logo Card */}
        <div className="relative group">
          {/* Subtle Outer Glow Ring */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-teal-500/20 blur-md opacity-75" />
          
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="w-full h-full object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col items-center justify-center p-2 text-emerald-400">
                <svg className="w-12 h-12 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Branding & Subtitle */}
        <div className="mt-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px] font-semibold tracking-wider uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SIH Enterprise • SAP PAY</span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase max-w-sm leading-snug">
            {companyName}
          </h1>

          <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase mt-1">
            {watermarkText}
          </p>
        </div>

        {/* Executive Loading Gauge */}
        <div className="mt-8 w-full max-w-xs flex flex-col items-center">
          <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/40 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          <div className="w-full flex items-center justify-between mt-3 text-[11px] font-medium text-slate-400">
            <span className="truncate max-w-[210px] text-left text-slate-300">
              {statusMessage}
            </span>
            <span className="font-mono text-emerald-400 font-semibold ml-2 tabular-nums">
              {progress}%
            </span>
          </div>
        </div>

      </div>

      {/* Footer Credentials */}
      <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center gap-1 text-[10px] font-medium text-slate-500 tracking-widest uppercase">
        <p>Sécurité Bancaire & Médicale • Chiffrement AES 256-Bit</p>
        <p className="text-slate-600 text-[9px]">Garantie de Conformité HDS & Standards ISO 27001</p>
      </div>
    </div>
  );
};
