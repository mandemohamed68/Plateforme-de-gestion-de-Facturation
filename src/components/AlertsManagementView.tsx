import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  Pill,
  CreditCard,
  CheckCircle2,
  Sliders,
  Settings,
  Users,
  Radio,
  Play,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Lock,
  Eye,
  Info,
  Check,
  Zap,
  PhoneCall,
  Activity
} from 'lucide-react';
import { ResUser, AppView, AppNotification } from '../types';
import { playChimeNotification, playEmergencyAlarmSound } from '../lib/soundAlerts';

interface AlertsManagementViewProps {
  currentUser: ResUser | null;
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onAddTestNotification?: (notif: Partial<AppNotification>) => void;
}

export interface AlertCategorySetting {
  id: 'urgency' | 'lab' | 'pharmacy' | 'caisse' | 'supervisor' | 'sms_whatsapp';
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  soundEnabled: boolean;
  popupBanner: boolean;
  badgeCounter: boolean;
  color: string;
  badgeStyle: string;
  allowedRoles: string[];
}

export const AlertsManagementView: React.FC<AlertsManagementViewProps> = ({
  currentUser,
  onShowToast,
  onAddTestNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'audio' | 'permissions' | 'simulation'>('categories');
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(8);
  const [allowCrossModulePreview, setAllowCrossModulePreview] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('06:00');

  // List of standard roles
  const allRoles = [
    'Super Admin',
    'Médecin',
    'Infirmier',
    'Biologiste',
    'Pharmacien',
    'Caissier',
    'Réceptionniste',
    'Superviseur'
  ];

  // Default Categories configuration
  const initialCategories: AlertCategorySetting[] = [
    {
      id: 'urgency',
      label: '🚨 Urgences Vitales & CCMU 1-2',
      description: 'Alertes rouges prioritaires pour admissions choc, décompensation respiratoire, arrêts cardio.',
      icon: AlertTriangle,
      enabled: true,
      soundEnabled: true,
      popupBanner: true,
      badgeCounter: true,
      color: 'rose',
      badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
      allowedRoles: ['Super Admin', 'Médecin', 'Infirmier', 'Superviseur'],
    },
    {
      id: 'lab',
      label: '🧪 Laboratoire & Valeurs Paniques (LIMS)',
      description: 'Examens biologiste validés, valeurs critiques (Hémoglobine < 6, Troponine élevée, BKM+).',
      icon: FlaskConical,
      enabled: true,
      soundEnabled: true,
      popupBanner: true,
      badgeCounter: true,
      color: 'sky',
      badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300',
      allowedRoles: ['Super Admin', 'Médecin', 'Infirmier', 'Biologiste', 'Superviseur'],
    },
    {
      id: 'pharmacy',
      label: '💊 Pharmacie, Ordonnances & Stocks',
      description: 'Dispensation d’ordonnance en attente, alertes péremption et ruptures de stock d’urgence.',
      icon: Pill,
      enabled: true,
      soundEnabled: true,
      popupBanner: false,
      badgeCounter: true,
      color: 'amber',
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
      allowedRoles: ['Super Admin', 'Médecin', 'Pharmacien', 'Superviseur'],
    },
    {
      id: 'caisse',
      label: '💳 Caisse, Solvabilité & Avances',
      description: 'Prise en charge assurance refusée, annulation de reçu, écart de fond de caisse.',
      icon: CreditCard,
      enabled: true,
      soundEnabled: true,
      popupBanner: false,
      badgeCounter: true,
      color: 'emerald',
      badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      allowedRoles: ['Super Admin', 'Caissier', 'Superviseur', 'Réceptionniste'],
    },
    {
      id: 'supervisor',
      label: '📑 Supervision & Mouvements Inter-Services',
      description: 'Transferts de patients, réouvertures de session de caisse, audits de sécurité.',
      icon: ShieldCheck,
      enabled: true,
      soundEnabled: false,
      popupBanner: false,
      badgeCounter: true,
      color: 'indigo',
      badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      allowedRoles: ['Super Admin', 'Superviseur'],
    },
    {
      id: 'sms_whatsapp',
      label: '📲 Gateway SMS / WhatsApp Patient',
      description: 'Envois automatiques de confirmations de rdv, rappels CPN/Vaccin, avis de prêt de bilans.',
      icon: MessageSquare,
      enabled: true,
      soundEnabled: false,
      popupBanner: false,
      badgeCounter: false,
      color: 'teal',
      badgeStyle: 'bg-teal-100 text-teal-800 border-teal-300',
      allowedRoles: ['Super Admin', 'Médecin', 'Réceptionniste', 'Superviseur'],
    },
  ];

  const [categories, setCategories] = useState<AlertCategorySetting[]>(() => {
    const saved = localStorage.getItem('app_alert_categories_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse alert config:', e);
      }
    }
    return initialCategories;
  });

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('app_alert_categories_config', JSON.stringify(categories));
    localStorage.setItem('app_alert_global_sound', JSON.stringify(globalSoundEnabled));
    localStorage.setItem('app_alert_cross_module_preview', JSON.stringify(allowCrossModulePreview));
  }, [categories, globalSoundEnabled, allowCrossModulePreview]);

  const toggleCategory = (id: string) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, enabled: !cat.enabled } : cat))
    );
  };

  const toggleCategorySound = (id: string) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, soundEnabled: !cat.soundEnabled } : cat))
    );
  };

  const toggleCategoryBanner = (id: string) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, popupBanner: !cat.popupBanner } : cat))
    );
  };

  const toggleRolePermission = (categoryId: string, roleName: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        const exists = cat.allowedRoles.includes(roleName);
        const updatedRoles = exists
          ? cat.allowedRoles.filter(r => r !== roleName)
          : [...cat.allowedRoles, roleName];
        return { ...cat, allowedRoles: updatedRoles };
      })
    );
  };

  const handleResetDefaults = () => {
    setCategories(initialCategories);
    setGlobalSoundEnabled(true);
    setAllowCrossModulePreview(true);
    localStorage.removeItem('app_alert_categories_config');
    onShowToast('Paramètres d\'alertes réinitialisés aux valeurs d\'usine.', 'info');
  };

  const handleSaveConfig = () => {
    localStorage.setItem('app_alert_categories_config', JSON.stringify(categories));
    onShowToast('✅ Configuration des alertes et notifications enregistrée avec succès !', 'success');
  };

  const handleTestChimeSound = () => {
    playChimeNotification();
    onShowToast('🔊 Test Carillon Doux effectué (Web Audio Synthesizer).', 'info');
  };

  const handleTestEmergencySound = () => {
    playEmergencyAlarmSound();
    onShowToast('🚨 Test Alarme Urgence Vitale effectué (Double Bip Haute Fréquence).', 'warning');
  };

  const triggerTestNotif = (type: 'urgency' | 'lab' | 'pharmacy' | 'caisse') => {
    const testPayloads: Record<string, Partial<AppNotification>> = {
      urgency: {
        title: '🚨 ADMISSION URGENCE VITALE (CCMU 1)',
        message: 'Patient Mme KONAN Amoin amenée par SAMU pour choc hémorragique. Constantes critiques (TA 80/50, SpO2 88%). Avis réanimateur immédiat.',
        category: 'urgency',
        priority: 'critical',
        patientName: 'Mme KONAN Amoin',
        patientNdm: 'NDM-9988',
        actionView: 'infirmier_triage',
      },
      lab: {
        title: '🧪 VALEUR PANIQUE LIMS - BIOCHIMIE',
        message: 'Alerte Biologiste : Troponine I à 14.8 ng/mL (V.N < 0.04) sur prélèvement NDM-4410. Risque SCA ST+.',
        category: 'lab',
        priority: 'high',
        patientName: 'M. KOUASSI Jean',
        patientNdm: 'NDM-4410',
        actionView: 'lab_results',
      },
      pharmacy: {
        title: '💊 ALERTE RUPTURE DE STOCK PHARMACIE',
        message: 'Le stock de sécurité d’Adrénaline 1mg/ml est tombé à 3 ampoules. Réapprovisionnement urgent requis.',
        category: 'pharmacy',
        priority: 'normal',
        patientName: 'Stock Urgence Bloc',
        actionView: 'products',
      },
      caisse: {
        title: '💳 PRISE EN CHARGE ASSURANCE ACCEPTEE (80%)',
        message: 'Accord de prise en charge MUGEF-CI validé pour M. DIALLO Ousmane (Garantie N° 887123).',
        category: 'caisse',
        priority: 'normal',
        patientName: 'M. DIALLO Ousmane',
        patientNdm: 'NDM-2210',
        actionView: 'invoices',
      },
    };

    if (onAddTestNotification) {
      onAddTestNotification(testPayloads[type]);
      onShowToast(`Simulation transmise au Centre de Notifications (${type.toUpperCase()}).`, 'success');
      if (globalSoundEnabled) {
        if (type === 'urgency' || type === 'lab') {
          playEmergencyAlarmSound();
        } else {
          playChimeNotification();
        }
      }
    } else {
      onShowToast('Action de test simulee avec succes.', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner - Clean 100% Human Light Design */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Module de Configuration Avancée SIH</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" />
              Gestion des Alertes & Notifications Inter-Services
            </h1>
            <p className="text-slate-600 text-xs md:text-sm max-w-2xl leading-relaxed font-medium">
              Pilotez l'activation des canaux d'alerte (Urgences, LIMS, Pharmacie, Caisse), réglez les synthétiseurs sonores, définissez la matrice des permissions par profil et prévisualisez les notifications en direct.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Défaut</span>
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs border border-emerald-700"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer la Configuration</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Canaux Actifs</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              {categories.filter(c => c.enabled).length} / {categories.length}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Canal Audio</div>
            <div className="text-lg font-black text-indigo-700 mt-0.5 flex items-center gap-1.5">
              {globalSoundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>Actif ({volumeLevel}%)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600" />
                  <span>Coupé</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Aperçu Inter-Module</div>
            <div className="text-lg font-black text-amber-700 mt-0.5">
              {allowCrossModulePreview ? 'Autorisé 360°' : 'Restreint'}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Profil Connecté</div>
            <div className="text-xs font-black text-slate-900 mt-1 truncate">
              {currentUser?.role || 'Administrateur'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Canaux d'Alertes ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>2. Alarmes & Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Matrice de Permissions (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'simulation'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-500" />
          <span>4. Test & Simulation en Direct</span>
        </button>
      </div>

      {/* Tab 1: Categories & Channels Toggle */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Gestion Individuelle des Canaux de Notification</h4>
                <p className="text-[11px] text-slate-600">
                  Activez ou désactivez chaque type d'alerte selon les besoins opérationnels de l'établissement.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const allActive = categories.every(c => c.enabled);
                setCategories(prev => prev.map(c => ({ ...c, enabled: !allActive })));
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
            >
              {categories.every(c => c.enabled) ? 'Tout Désactiver' : 'Tout Activer'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={`p-5 rounded-2xl border transition shadow-2xs space-y-4 ${
                    cat.enabled
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-2xl border ${cat.badgeStyle}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${cat.badgeStyle}`}>
                          {cat.id.toUpperCase()}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1">{cat.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{cat.description}</p>
                      </div>
                    </div>

                    {/* Main Switch */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cat.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          cat.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sub Controls */}
                  {cat.enabled && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={cat.soundEnabled}
                          onChange={() => toggleCategorySound(cat.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                          Alerte Sonore
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={cat.popupBanner}
                          onChange={() => toggleCategoryBanner(cat.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5 text-slate-500" />
                          Pop-up Banniere
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Audio & Sound settings */}
      {activeTab === 'audio' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-600" />
                Réglages du Synthétiseur Sonore & Alarmes
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ajustez le volume global et effectuez des essais acoustiques en direct pour les cas d'urgence vitale.
              </p>
            </div>

            <button
              onClick={() => setGlobalSoundEnabled(!globalSoundEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                globalSoundEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {globalSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{globalSoundEnabled ? 'Son Général : ACTIF' : 'Son Général : MUTÉ'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Volume Control */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Volume Sonore Global</span>
                <span className="font-mono text-indigo-600 font-extrabold">{volumeLevel}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={volumeLevel}
                onChange={e => setVolumeLevel(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <p className="text-[11px] text-slate-500">
                S'applique aux avertisseurs de laboratoire, de caisse et aux alarmes prioritaires d'urgence.
              </p>
            </div>

            {/* Test Buttons */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="font-bold text-xs text-slate-800 block">
                Essais Acoustiques en Temps Réel
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleTestChimeSound}
                  className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Tester Carillon Soft</span>
                </button>

                <button
                  onClick={handleTestEmergencySound}
                  className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tester Alarme Rouge</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours & Night Mode */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Mode Nuit & Plage de Silence (Quiet Hours)</h4>
                <p className="text-[11px] text-slate-500">
                  Atténue les bips secondaires (Pharmacie, Caisse) la nuit, tout en conservant les alertes urgences vitales.
                </p>
              </div>

              <button
                onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  quietHoursEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    quietHoursEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {quietHoursEnabled && (
              <div className="flex items-center gap-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Début :</span>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={e => setQuietHoursStart(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Fin :</span>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={e => setQuietHoursEnd(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Permission matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Matrice des Droit de Réception des Alertes par Profil (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cochez les rôles autorisés à recevoir chaque catégorie d'alerte dans leur centre de notifications.
            </p>
          </div>

          {/* Cross module preview toggle */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-950">
                  Mode Redirection Intelligent & Aperçu Sécurisé Inter-Services
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Si un utilisateur clique sur une notification hors de ses modules habituels, lui afficher un aperçu sécurisé au lieu de bloquer brutalement avec "Accès non autorisé".
                </p>
              </div>
            </div>

            <button
              onClick={() => setAllowCrossModulePreview(!allowCrossModulePreview)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                allowCrossModulePreview
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allowCrossModulePreview ? 'Aperçu 360° Actif' : 'Aperçu Désactivé'}
            </button>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3.5">Catégorie d'Alerte</th>
                  {allRoles.map(role => (
                    <th key={role} className="p-3.5 text-center text-[11px] font-extrabold truncate max-w-[100px]">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs">{cat.label}</span>
                      </td>

                      {allRoles.map(role => {
                        const isChecked = cat.allowedRoles.includes(role);
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRolePermission(cat.id, role)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Simulation & Live Testing */}
      {activeTab === 'simulation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              Simulateur & Générateur d'Alertes en Direct
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Injectez immédiatement une fausse notification dans la cloche du haut pour tester le comportement en condition réelle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => triggerTestNotif('urgency')}
              className="p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-left transition group cursor-pointer space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-rose-600 text-white rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-200 px-2 py-0.5 rounded-full">
                  Urgence Vitale
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-rose-950 group-hover:underline">
                1. Injection Urgence CCMU 1
              </h4>
              <p className="text-[11px] text-rose-800 leading-snug">
                Simule une admission de réanimation avec alarme stridente.
              </p>
            </button>

            <button
              onClick={() => triggerTestNotif('lab')}
              className="p-4 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl text-left transition group cursor-pointer space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-sky-600 text-white rounded-xl">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-sky-700 bg-sky-200 px-2 py-0.5 rounded-full">
                  LIMS Labo
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-sky-950 group-hover:underline">
                2. Valeur Panique Labo
              </h4>
              <p className="text-[11px] text-sky-800 leading-snug">
                Simule un résultat biologiste critique (Troponine élevée).
              </p>
            </button>

            <button
              onClick={() => triggerTestNotif('pharmacy')}
              className="p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left transition group cursor-pointer space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-amber-600 text-white rounded-xl">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                  Pharmacie
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-amber-950 group-hover:underline">
                3. Rupture de Stock Urgent
              </h4>
              <p className="text-[11px] text-amber-800 leading-snug">
                Simule un seuil critique d'adrénaline atteint.
              </p>
            </button>

            <button
              onClick={() => triggerTestNotif('caisse')}
              className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left transition group cursor-pointer space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full">
                  Caisse
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-emerald-950 group-hover:underline">
                4. Validation Prise en Charge
              </h4>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Simule un accord d'assurance Mugef-ci validé.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
