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
  companyName = 'SAP PAY',
  watermarkText = "Système d'Information Hospitalier & Financier",
  primaryColor = '#0f172a',
  logoUrl,
  isDataReady,
  onFinished,
}) => {
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState('Démarrage du système...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [useHospitalBadge, setUseHospitalBadge] = useState(false);

  // Progressive realistic loading sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(38);
      setStatusMessage('Vérification des accès & protocoles...');
    }, 250);

    const t2 = setTimeout(() => {
      setProgress(65);
      setStatusMessage('Chargement du référentiel clinique & financier...');
    }, 650);

    const t3 = setTimeout(() => {
      setProgress(88);
      setStatusMessage('Synchronisation des modules en cours...');
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // When data is confirmed ready, finish smoothly to 100% and fade out
  useEffect(() => {
    if (isDataReady) {
      const readyTimer = setTimeout(() => {
        setProgress(100);
        setStatusMessage('Système initialisé');

        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
          const doneTimer = setTimeout(() => {
            onFinished();
          }, 450);
          return () => clearTimeout(doneTimer);
        }, 350);

        return () => clearTimeout(fadeTimer);
      }, 750);

      return () => clearTimeout(readyTimer);
    }
  }, [isDataReady, onFinished]);

  return (
    <div
      id="splash-loading-screen"
      className={`fixed inset-0 z-[999999] bg-[#ffffff] flex flex-col items-center justify-center font-sans select-none overflow-hidden transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.015] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Keyframe animations for aura & progress */}
      <style>{`
        @keyframes aura-float {
          0%, 100% {
            transform: scale(1.02);
            opacity: 0.90;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }
        @keyframes shimmer-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Centerpiece Composition */}
      <div className="relative flex flex-col items-center">
        
        {/* Outer Aura System + White Squircle Container */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          
          {/* =========================================================
              THE EXACT MULTI-COLOR NEON GLOW FROM THE SCREENSHOT:
              - Green/Mint/Cyan on the top-left
              - Intense Coral/Red on the bottom & bottom-left
              - Blue/Violet on the right
             ========================================================= */}

          {/* Glow Component 1: Multi-stop conical & radial blend */}
          <div
            className="absolute -inset-1 rounded-[54px] sm:rounded-[60px] pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 12% 15%, #00f5a0 0%, #00d2ff 25%, transparent 60%),
                radial-gradient(circle at 25% 90%, #ff3b30 0%, #ff6b4a 35%, transparent 65%),
                radial-gradient(circle at 88% 50%, #3b82f6 0%, #8b5cf6 30%, transparent 65%),
                radial-gradient(circle at 80% 88%, #ec4899 0%, transparent 50%),
                conic-gradient(from 215deg at 50% 50%, #10b981 0deg, #00d2ff 45deg, #3b82f6 110deg, #8b5cf6 160deg, #ec4899 220deg, #ff3b30 280deg, #ff7849 330deg, #10b981 360deg)
              `,
              filter: 'blur(30px)',
              animation: 'aura-float 4.2s ease-in-out infinite',
              opacity: 0.95,
            }}
          />

          {/* Glow Component 2: High-saturation accentuation matching the exact edges */}
          {/* Top-Left Green/Cyan Edge */}
          <div
            className="absolute -top-3 -left-3 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #05df72 0%, #00c8ff 50%, transparent 75%)',
              filter: 'blur(20px)',
              opacity: 0.9,
            }}
          />

          {/* Bottom-Left & Bottom Red/Coral Edge */}
          <div
            className="absolute -bottom-4 left-1 w-36 h-36 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #ff334b 0%, #ff6432 55%, transparent 80%)',
              filter: 'blur(24px)',
              opacity: 1,
            }}
          />

          {/* Right Blue/Purple Edge */}
          <div
            className="absolute top-8 -right-3 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #2f7cf6 0%, #804dee 55%, transparent 75%)',
              filter: 'blur(22px)',
              opacity: 0.85,
            }}
          />

          {/* =========================================================
              THE WHITE SQUIRCLE CARD (Front Layer)
              Pristine rounded rectangle with super-smooth curvature
             ========================================================= */}
          <div
            className="relative w-full h-full bg-[#ffffff] rounded-[44px] sm:rounded-[50px] flex items-center justify-center z-10 cursor-pointer select-none"
            title="Cliquez pour alterner le logo"
            onClick={() => setUseHospitalBadge(!useHospitalBadge)}
            style={{
              boxShadow: `
                0 20px 48px -12px rgba(0, 0, 0, 0.08),
                0 4px 14px -2px rgba(0, 0, 0, 0.03),
                inset 0 1.5px 2px rgba(255, 255, 255, 1)
              `,
              border: '1px solid rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* =========================================================
                THE SOLID BLACK CIRCULAR BADGE IN THE CENTER
               ========================================================= */}
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#111216] flex items-center justify-center relative overflow-hidden shadow-inner border border-neutral-900/80 transition-transform duration-300 active:scale-95"
              style={{
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.12)',
              }}
            >
              {/* Subtle top-light sheen */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none opacity-25"
                style={{
                  background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.45) 0%, transparent 65%)',
                }}
              />

              {/* Exact silhouette cutout from the screenshot */}
              {!useHospitalBadge ? (
                <svg
                  viewBox="0 0 24 24"
                  className="w-13 h-13 sm:w-15 sm:h-15 text-white fill-current relative z-10 transition-transform duration-300"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-13 h-13 sm:w-15 sm:h-15 object-contain relative z-10 rounded-full"
                />
              ) : (
                <svg
                  className="w-11 h-11 sm:w-13 sm:h-13 text-white fill-current relative z-10"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4v4z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            TYPOGRAPHY & PROGRESS SYSTEM
           ========================================================= */}
        <div className="mt-12 text-center flex flex-col items-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            {companyName}
          </h1>

          <p className="text-[11px] font-semibold text-slate-400 tracking-[0.22em] uppercase mt-1.5 max-w-xs text-center">
            {watermarkText}
          </p>

          {/* Ultra-Sleek Dynamic Progress Gauge */}
          <div className="mt-7 w-48 sm:w-56 flex flex-col items-center">
            <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
              {/* Active Progress Bar with Rainbow Gradient matching the aura */}
              <div
                className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #00d2ff 35%, #3b82f6 70%, #ff3b30 100%)',
                }}
              >
                {/* Micro-shimmer sweep */}
                <div
                  className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  style={{
                    animation: 'shimmer-move 1.5s infinite linear',
                  }}
                />
              </div>
            </div>

            {/* Bottom Status Text & Tabular Percentage */}
            <div className="w-full flex items-center justify-between mt-2.5 px-0.5">
              <span className="text-[10px] font-medium text-slate-400 tracking-wider truncate max-w-[140px]">
                {statusMessage}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 tabular-nums">
                {progress}%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Discreet Bottom Environmental Footer */}
      <div className="absolute bottom-7 left-0 right-0 text-center flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 tracking-[0.2em] uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Connexion Sécurisée • Système Médical & Caisse</span>
      </div>
    </div>
  );
};
