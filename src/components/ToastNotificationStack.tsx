import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Layers
} from 'lucide-react';

export interface ToastItem {
  id: string;
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
  createdAt: number;
}

interface ToastNotificationStackProps {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
  onClearAll: () => void;
}

interface SingleToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

const SingleToastCard: React.FC<SingleToastProps> = ({ toast, onRemove }) => {
  const duration = toast.duration || (toast.type === 'error' ? 6500 : toast.type === 'warning' ? 5000 : 4000);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(duration);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, remainingTime);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, remainingTime, onRemove, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    setRemainingTime((prev) => Math.max(500, prev - elapsed));
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Color mappings adhering to clean UI standards (not radioactive blobs)
  const styles = {
    success: {
      border: 'border-emerald-200/90 dark:border-emerald-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      accentLine: 'bg-emerald-500',
      titleColor: 'text-emerald-900 dark:text-emerald-300',
      progressBar: 'bg-emerald-500',
      shadow: 'shadow-lg shadow-emerald-950/5',
      icon: CheckCircle2,
    },
    error: {
      border: 'border-rose-200/90 dark:border-rose-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      accentLine: 'bg-rose-500',
      titleColor: 'text-rose-900 dark:text-rose-300',
      progressBar: 'bg-rose-500',
      shadow: 'shadow-lg shadow-rose-950/5',
      icon: AlertCircle,
    },
    warning: {
      border: 'border-amber-200/90 dark:border-amber-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      accentLine: 'bg-amber-500',
      titleColor: 'text-amber-900 dark:text-amber-300',
      progressBar: 'bg-amber-500',
      shadow: 'shadow-lg shadow-amber-950/5',
      icon: AlertTriangle,
    },
    info: {
      border: 'border-sky-200/90 dark:border-sky-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
      accentLine: 'bg-sky-500',
      titleColor: 'text-sky-900 dark:text-sky-300',
      progressBar: 'bg-sky-500',
      shadow: 'shadow-lg shadow-sky-950/5',
      icon: Info,
    },
  }[toast.type];

  const Icon = styles.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, x: 25, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.92, transition: { duration: 0.18, ease: 'easeOut' } }}
      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-md transition-all ${styles.bg} ${styles.border} ${styles.shadow} max-w-sm sm:max-w-md w-full p-3.5`}
    >
      {/* Accent left highlight bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accentLine}`} />

      <div className="flex items-start gap-3 pl-1.5">
        {/* Category Icon Badge */}
        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <div className={`text-[11px] font-bold tracking-tight uppercase ${styles.titleColor} mb-0.5 flex items-center gap-1.5`}>
              <span>{toast.title}</span>
            </div>
          )}
          <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug break-words">
            {toast.text}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onRemove(toast.id)}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Fermer cette notification"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: isPaused ? undefined : '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-full ${styles.progressBar}`}
        />
      </div>
    </motion.div>
  );
};

export const ToastNotificationStack: React.FC<ToastNotificationStackProps> = ({
  toasts,
  onRemoveToast,
  onClearAll,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="app-toast-stack-container"
      className="fixed bottom-5 right-5 z-[9999] pointer-events-none flex flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-full px-4 sm:px-0"
    >
      {/* If multiple toasts are stacked, display a coordinated dismiss-all control */}
      {toasts.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs border border-slate-700/60"
        >
          <span className="flex items-center gap-1 text-slate-300">
            <Layers className="w-3 h-3 text-sky-400" />
            <span>{toasts.length} notifications actives</span>
          </span>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer transition text-[10px]"
          >
            Tout fermer
          </button>
        </motion.div>
      )}

      {/* Coordinated animated toast cards stack */}
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <SingleToastCard
            key={toast.id}
            toast={toast}
            onRemove={onRemoveToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
