import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Eye,
  Check,
  Settings,
  Sliders,
  ExternalLink,
  Printer
} from 'lucide-react';
import { AppNotification, AppView, ResUser } from '../types';
import { playChimeNotification, playEmergencyAlarmSound } from '../lib/soundAlerts';
import { getAllowedViews } from '../utils/navigation';

interface InAppNotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigateToView: (view: AppView) => void;
  currentUser: ResUser | null;
}

export const InAppNotificationCenter: React.FC<InAppNotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigateToView,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'urgency' | 'lab' | 'pharmacy' | 'caisse' | 'supervisor'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCriticalAlertModal, setShowCriticalAlertModal] = useState(false);
  const [selectedNotifForPreview, setSelectedNotifForPreview] = useState<AppNotification | null>(null);

  // Read actual settings from "Gestion des Alertes"
  const alertSettings = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('app_alert_categories_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  }, [notifications]); // Keep fresh and react to updates

  const globalSoundEnabled = useMemo(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('app_alert_global_sound');
      if (saved !== null) {
        return JSON.parse(saved) !== false;
      }
    } catch (_) {}
    return true;
  }, []);

  const isCategoryEnabled = (category: string) => {
    if (alertSettings.length > 0) {
      const catSetting = alertSettings.find(s => s.id === category);
      if (catSetting && catSetting.enabled === false) {
        return false;
      }
    }
    return true;
  };

  const isPopupBannerEnabledForCategory = (category: string) => {
    if (alertSettings.length > 0) {
      const catSetting = alertSettings.find(s => s.id === category);
      if (catSetting) {
        return catSetting.enabled !== false && catSetting.popupBanner !== false;
      }
    }
    return true;
  };

  const isSoundEnabledForCategory = (category: string) => {
    if (alertSettings.length > 0) {
      const catSetting = alertSettings.find(s => s.id === category);
      if (catSetting) {
        return catSetting.enabled !== false && catSetting.soundEnabled !== false;
      }
    }
    return true;
  };

  // Only count and trigger for categories that are enabled
  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => isCategoryEnabled(n.category));
  }, [notifications, alertSettings]);

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const criticalUnread = useMemo(() => {
    return notifications.filter(n => {
      if (n.read) return false;
      if (n.priority !== 'critical') return false;
      // Do not show popup or list in critical warning modal if popupBanner is disabled or category disabled
      return isPopupBannerEnabledForCategory(n.category);
    });
  }, [notifications, alertSettings]);

  const allowedViews = getAllowedViews(currentUser);

  // Trigger audio alert when new critical notification arrives
  useEffect(() => {
    if (criticalUnread.length > 0) {
      setShowCriticalAlertModal(true);
      if (soundEnabled && globalSoundEnabled) {
        const hasAnySoundEnabled = criticalUnread.some(n => isSoundEnabledForCategory(n.category));
        if (hasAnySoundEnabled) {
          playEmergencyAlarmSound();
        }
      }
    } else {
      setShowCriticalAlertModal(false);
    }
  }, [criticalUnread.length, soundEnabled, globalSoundEnabled, alertSettings]);

  const handleOpenNotificationModule = (notif: AppNotification) => {
    onMarkAsRead(notif.id);
    setIsOpen(false);

    if (notif.actionView) {
      if (allowedViews.includes(notif.actionView)) {
        onNavigateToView(notif.actionView);
      } else {
        // If profile doesn't have direct access to the target view module, open preview modal instead of abrupt error
        setSelectedNotifForPreview(notif);
      }
    } else {
      setSelectedNotifForPreview(notif);
    }
  };

  const filteredNotifs = visibleNotifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const getCategoryBadge = (cat: AppNotification['category']) => {
    switch (cat) {
      case 'urgency':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">🚨 Urgence</span>;
      case 'lab':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">🧪 Labo / Radio</span>;
      case 'pharmacy':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">💊 Ordonnance</span>;
      case 'caisse':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">💳 Caisse</span>;
      case 'supervisor':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">📑 Supervision</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Info</span>;
    }
  };

  return (
    <div className="relative inline-block">
      {/* Cloche Button */}
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition border border-slate-200/80 cursor-pointer flex items-center justify-center bg-slate-50"
        title="Centre de Notifications Transversal Inter-Services"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Critical Alarm Modal */}
      {showCriticalAlertModal && criticalUnread.length > 0 && (
        <div className="fixed inset-0 z-50 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-rose-600 space-y-4">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center shrink-0 animate-bounce">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  ⚠️ ALERTE ROUGE INTER-SERVICES
                </span>
                <h3 className="text-base font-black text-rose-950 mt-1">
                  Urgence Vitale ou Valeur Panique Détectée !
                </h3>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {criticalUnread.map(notif => (
                <div key={notif.id} className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-rose-900">{notif.title}</span>
                    <span className="text-[10px] font-mono text-rose-600">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium leading-snug">{notif.message}</p>
                  {notif.patientName && (
                    <div className="text-[11px] font-bold text-slate-800 pt-1">
                      Patient : {notif.patientName} {notif.patientNdm ? `(NDM: ${notif.patientNdm})` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <span>{soundEnabled ? 'Alerte sonore activée' : 'Son coupé'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    criticalUnread.forEach(n => onMarkAsRead(n.id));
                    setShowCriticalAlertModal(false);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Acquitter l'Alerte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">Centre de Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    onNavigateToView('alert_settings');
                    setIsOpen(false);
                  }}
                  className="p-1 px-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded cursor-pointer transition flex items-center gap-1 text-[10px] font-bold"
                  title="Gestion & Paramétrage des Alertes"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Gérer</span>
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition"
                  title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center overflow-x-auto bg-slate-50 p-1 border-b border-slate-200 gap-1 text-[11px] scrollbar-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('urgency')}
                className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                  activeTab === 'urgency' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                🚨 Urgences
              </button>
              <button
                onClick={() => setActiveTab('lab')}
                className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                  activeTab === 'lab' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-sky-600'
                }`}
              >
                🧪 Labo
              </button>
              <button
                onClick={() => setActiveTab('pharmacy')}
                className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                  activeTab === 'pharmacy' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-600'
                }`}
              >
                💊 Pharma
              </button>
              <button
                onClick={() => setActiveTab('caisse')}
                className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                  activeTab === 'caisse' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                💳 Caisse
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filteredNotifs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-xs">Aucune notification pour le moment</p>
                </div>
              ) : (
                filteredNotifs.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 transition flex items-start justify-between gap-2 ${
                      notif.read ? 'bg-white opacity-80' : 'bg-slate-50/90 font-medium'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(notif.category)}
                        <span className="text-[10px] font-mono text-slate-400">{notif.timestamp}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{notif.title}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{notif.message}</p>
                      {notif.patientName && (
                        <div className="text-[10px] font-bold text-slate-700">
                          Patient : {notif.patientName} {notif.patientNdm ? `(${notif.patientNdm})` : ''}
                        </div>
                      )}

                      {notif.actionView && (
                        <button
                          onClick={() => handleOpenNotificationModule(notif)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ouvrir le module concerné</span>
                        </button>
                      )}
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  onNavigateToView('alert_settings');
                  setIsOpen(false);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Paramètres des Alertes</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Tout marquer comme lu
                </button>
                <button
                  onClick={onClearAll}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Tout effacer
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Selected Notification Preview Modal (for cross-module notifications or restricted roles) */}
      {selectedNotifForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(selectedNotifForPreview.category)}
                    <span className="text-[10px] font-mono text-slate-400">{selectedNotifForPreview.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    {selectedNotifForPreview.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotifForPreview(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {selectedNotifForPreview.message}
              </p>

              {selectedNotifForPreview.patientName && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Patient concerné :</span>
                  <span className="text-indigo-600">
                    {selectedNotifForPreview.patientName} {selectedNotifForPreview.patientNdm ? `(NDM: ${selectedNotifForPreview.patientNdm})` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  onNavigateToView('alert_settings');
                  setSelectedNotifForPreview(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Règles d'Accès & Alertes</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedNotifForPreview.actionView && allowedViews.includes(selectedNotifForPreview.actionView) && (
                  <button
                    onClick={() => {
                      onNavigateToView(selectedNotifForPreview.actionView!);
                      setSelectedNotifForPreview(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Accéder au Module</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedNotifForPreview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
