import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  X,
  Search,
  Filter,
  Eye,
  Check,
  Save
} from 'lucide-react';
import { CompanySettings, FlashAnnouncement, ResUser } from '../types';
import { FlashInfoTicker } from './FlashInfoTicker';
import { getAppTheme } from '../lib/theme';

interface FlashAnnouncementsViewProps {
  company: CompanySettings;
  setCompany: React.Dispatch<React.SetStateAction<CompanySettings>>;
  onSaveCompany?: (updated: CompanySettings) => Promise<void>;
  currentUser: ResUser | null;
}

export const DEFAULT_FLASH_ANNOUNCEMENTS: FlashAnnouncement[] = [
  {
    id: 'flash-1',
    title: 'Disponibilité du Dépistage PCR Direct',
    message: 'Nouveau pôle d\'analyses rapides PCR disponible sans rendez-vous de 07h30 à 18h00 au guichet principal.',
    type: 'info',
    active: true,
    priority: 1,
    target_profiles: ['all'],
  },
  {
    id: 'flash-2',
    title: 'Maintenance Serveur LIMS Planifiée',
    message: 'Une maintenance préventive du réseau et du serveur d\'analyse aura lieu ce samedi de 22h00 à 02h00. Veuillez enregistrer vos saisies.',
    type: 'warning',
    active: true,
    priority: 2,
    target_profiles: ['all'],
  },
  {
    id: 'flash-3',
    title: 'Nouveaux Baremos & Tiers-Payant Mutuelles 2026',
    message: 'Les nouvelles grilles tarifaires de prise en charge AXA, SAHAM et MUGEF-CI sont en vigueur. Merci de vérifier l\'éligibilité aux guichets.',
    type: 'promo',
    active: true,
    priority: 3,
    target_profiles: ['facture', 'caisse', 'comptabilite'],
  },
  {
    id: 'flash-4',
    title: 'Procédure Obligatoire Échantillons Sang Total',
    message: 'Rappel impératif : merci de scanner systématiquement le code-barres des tubes EDTA Violet immédiatement après le prélèvement au box.',
    type: 'urgent',
    active: true,
    priority: 4,
    target_profiles: ['labo'],
  },
  {
    id: 'flash-5',
    title: 'Clôture de Caisse & Bilan Journalier',
    message: 'La fermeture officielle des sessions de caisse s\'effectue à 18h30. Pensez à éditer votre journal de recettes avant la passation de garde.',
    type: 'info',
    active: true,
    priority: 5,
    target_profiles: ['caisse', 'comptabilite', 'direction'],
  },
];

export const FlashAnnouncementsView: React.FC<FlashAnnouncementsViewProps> = ({
  company,
  setCompany,
  onSaveCompany,
  currentUser,
}) => {
  const theme = getAppTheme(company.primary_color);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfile, setFilterProfile] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<FlashAnnouncement | null>(null);

  // Save feedback toast
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Settings State
  const [isEnabled, setIsEnabled] = useState<boolean>(company.flash_news_enabled !== false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(company.flash_news_speed || 10);
  const [announcements, setAnnouncements] = useState<FlashAnnouncement[]>(() => {
    if (company.flash_announcements && company.flash_announcements.length >= 1) {
      return company.flash_announcements;
    }
    return DEFAULT_FLASH_ANNOUNCEMENTS;
  });

  const saveSettingsToCompany = async (updatedList?: FlashAnnouncement[]) => {
    const listToSave = updatedList || announcements;
    const updatedCompany: CompanySettings = {
      ...company,
      flash_news_enabled: isEnabled,
      flash_news_speed: scrollSpeed,
      flash_announcements: listToSave,
    };

    setCompany(updatedCompany);

    if (onSaveCompany) {
      try {
        setIsSaving(true);
        await onSaveCompany(updatedCompany);
        setSaveSuccessMsg('Modifications enregistrées avec succès ! 💾');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } catch (err) {
        console.error('Erreur sauvegarde flash info:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      setSaveSuccessMsg('Modifications appliquées en direct ! ⚡');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleManualSave = () => {
    saveSettingsToCompany();
  };

  const handleToggleGlobalEnable = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    const updatedCompany: CompanySettings = {
      ...company,
      flash_news_enabled: nextState,
      flash_news_speed: scrollSpeed,
      flash_announcements: announcements,
    };
    setCompany(updatedCompany);
    if (onSaveCompany) {
      onSaveCompany(updatedCompany);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setScrollSpeed(newSpeed);
    const updatedCompany: CompanySettings = {
      ...company,
      flash_news_enabled: isEnabled,
      flash_news_speed: newSpeed,
      flash_announcements: announcements,
    };
    setCompany(updatedCompany);
    if (onSaveCompany) {
      onSaveCompany(updatedCompany);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = announcements.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    setAnnouncements(updated);
    saveSettingsToCompany(updated);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Voulez-vous supprimer l'annonce "${title}" ?`)) {
      const updated = announcements.filter((a) => a.id !== id);
      setAnnouncements(updated);
      saveSettingsToCompany(updated);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous réinitialiser les 5 annonces par défaut du système ?')) {
      setAnnouncements(DEFAULT_FLASH_ANNOUNCEMENTS);
      saveSettingsToCompany(DEFAULT_FLASH_ANNOUNCEMENTS);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !editingAnnouncement.title.trim() || !editingAnnouncement.message.trim()) return;

    const index = announcements.findIndex((a) => a.id === editingAnnouncement.id);
    let updated: FlashAnnouncement[];
    if (index >= 0) {
      updated = [...announcements];
      updated[index] = editingAnnouncement;
    } else {
      updated = [editingAnnouncement, ...announcements];
    }

    setAnnouncements(updated);
    saveSettingsToCompany(updated);
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  // Filtered List
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch =
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProfile =
      filterProfile === 'all' ||
      !ann.target_profiles ||
      ann.target_profiles.includes('all') ||
      ann.target_profiles.includes(filterProfile);

    const matchesType = filterType === 'all' || ann.type === filterType;

    return matchesSearch && matchesProfile && matchesType;
  });

  const getTypeBadge = (type: FlashAnnouncement['type']) => {
    switch (type) {
      case 'urgent':
        return { label: 'URGENT', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> };
      case 'warning':
        return { label: 'ALERTE', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: <AlertTriangle className="w-3 h-3 mr-1 text-amber-700" /> };
      case 'promo':
        return { label: 'COMMUNICATION', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <Sparkles className="w-3 h-3 mr-1 text-emerald-600" /> };
      case 'info':
      default:
        return { label: 'INFORMATION', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: <Info className="w-3 h-3 mr-1 text-sky-600" /> };
    }
  };

  const targetLabels: Record<string, string> = {
    all: 'Tous les Profils',
    facture: 'Facturation / Accueil',
    caisse: 'Caisse / Caissier',
    labo: 'Laboratoire / Biologie',
    comptabilite: 'Comptabilité',
    direction: 'Direction',
    admin: 'Administrateurs',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Confirmation Message */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl shadow-xs flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Title & Controls */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 text-indigo-900">
            <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestion des Annonces Globale & Flash Info
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Diffusez des messages défilants en temps réel sur toute l'application ciblés par profil utilisateur.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Main Enregistrer Button */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition cursor-pointer border border-emerald-600"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la Configuration'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition cursor-pointer"
            title="Charger les 5 messages exemples"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Réinitialiser</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingAnnouncement({
                id: `flash_${Date.now()}`,
                title: '',
                message: '',
                type: 'info',
                active: true,
                priority: announcements.length + 1,
                target_profiles: ['all'],
              });
              setIsModalOpen(true);
            }}
            style={{ backgroundColor: theme.primary }}
            className="flex items-center space-x-1.5 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Annonce</span>
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/70 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <span>Aperçu en Direct sur l'Application</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-0.5 rounded border border-amber-200">
            {isEnabled ? 'Actif en temps réel' : 'Masqué (Flash Info Désactivé)'}
          </span>
        </div>

        {/* Render Live Ticker */}
        <FlashInfoTicker company={company} currentUser={currentUser} />
      </div>

      {/* Global Controls Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span>Paramètres Généraux de Défilement</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Enable Switch */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Activation Globale du Bandeau Flash Info</div>
              <div className="text-[11px] text-slate-500 font-medium">
                Affiche ou masque instantanément le bandeau défilant pour tous les utilisateurs.
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleGlobalEnable}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Scrolling Speed Selector */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Vitesse de Défilement ({scrollSpeed}s)</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Délai de passage entre messages ou vitesse globale de lecture.
              </div>
            </div>

            <select
              value={scrollSpeed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="text-xs font-semibold p-2 bg-white border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={5}>Rapide (5s)</option>
              <option value={8}>Modéré (8s)</option>
              <option value={10}>Standard (10s)</option>
              <option value={15}>Confortable (15s)</option>
              <option value={20}>Lent (20s)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List Section */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Liste des Annonces Configurées ({announcements.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Activez, modifiez ou ciblez des messages spécifiques selon le rôle de l'utilisateur.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une annonce..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Profile Filter */}
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">Tous les profils</option>
              <option value="facture">Facturation</option>
              <option value="caisse">Caisse</option>
              <option value="labo">Laboratoire</option>
              <option value="comptabilite">Comptabilité</option>
              <option value="direction">Direction</option>
              <option value="admin">Admin</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">Tous les types</option>
              <option value="info">Info</option>
              <option value="promo">Communication</option>
              <option value="warning">Alerte</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="space-y-3 pt-1">
          {filteredAnnouncements.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-600">Aucune annonce flash ne correspond à vos critères.</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ajustez votre recherche ou réinitialisez les annonces modèles.
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((ann) => {
              const badge = getTypeBadge(ann.type);
              const isAll = !ann.target_profiles || ann.target_profiles.includes('all');

              return (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    ann.active
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase border shrink-0 ${badge.bg}`}>
                      {badge.icon}
                      {badge.label}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-bold text-slate-900">{ann.title}</span>

                        {/* Targeted profiles tags */}
                        <div className="flex items-center space-x-1 flex-wrap">
                          {isAll ? (
                            <span className="text-[9px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded border border-indigo-200">
                              Tous les Profils
                            </span>
                          ) : (
                            (ann.target_profiles || []).map((t) => (
                              <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200">
                                {targetLabels[t] || t}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 mt-1 font-normal">{ann.message}</div>

                      {ann.link_url && (
                        <div className="text-[10px] text-indigo-700 font-semibold mt-1 truncate">
                          Lien : {ann.link_url}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 justify-end">
                    {/* Active / Inactive Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ann.id)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
                        ann.active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {ann.active ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Actif</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Masqué</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAnnouncement(ann);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(ann.id, ann.title)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Floating Save Action Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200 flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <Save className="w-4 h-4 text-emerald-600" />
          <span>Pensez à enregistrer vos réglages et annonces</span>
        </div>

        <button
          type="button"
          onClick={handleManualSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition cursor-pointer border border-emerald-600"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la Configuration'}</span>
        </button>
      </div>

      {/* Modal for Adding / Editing Announcement */}
      {isModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {announcements.some((a) => a.id === editingAnnouncement.id)
                    ? 'Modifier l\'Annonce Flash'
                    : 'Créer une Nouvelle Annonce Flash'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titre / Sujet *
                </label>
                <input
                  type="text"
                  required
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  placeholder="Ex: Dispo PCR, Maintenance LIMS, Nouvelles Tarifications..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Défilant Complet *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingAnnouncement.message}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                  placeholder="Saisissez le texte d'information qui défilera en haut de l'écran..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Niveau / Type d'Urgence
                  </label>
                  <select
                    value={editingAnnouncement.type}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        type: e.target.value as FlashAnnouncement['type'],
                      })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-semibold cursor-pointer"
                  >
                    <option value="info">Information</option>
                    <option value="promo">Communication / Nouveauté</option>
                    <option value="warning">Vigilance / Alerte</option>
                    <option value="urgent">Urgent / Impératif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lien Externe Optionnel
                  </label>
                  <input
                    type="url"
                    value={editingAnnouncement.link_url || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, link_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Target Profiles Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Profils Cibles Destinataires
                </label>
                <p className="text-[11px] text-slate-500 font-medium mb-2">
                  Sélectionnez les profils d'utilisateurs autorisés à voir cette annonce.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {[
                    { id: 'all', label: 'Tous les Profils' },
                    { id: 'facture', label: 'Facturation / Accueil' },
                    { id: 'caisse', label: 'Caisse / Caissier' },
                    { id: 'labo', label: 'Laboratoire / Biologie' },
                    { id: 'comptabilite', label: 'Comptabilité' },
                    { id: 'direction', label: 'Direction & Superviseur' },
                    { id: 'admin', label: 'Administrateurs' },
                  ].map((prof) => {
                    const currentTargets = editingAnnouncement.target_profiles || ['all'];
                    const isSelected = currentTargets.includes(prof.id);
                    return (
                      <label
                        key={prof.id}
                        className={`flex items-center space-x-2 p-2 rounded border cursor-pointer text-xs font-medium transition ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            let updatedTargets = [...currentTargets];
                            if (prof.id === 'all') {
                              updatedTargets = ['all'];
                            } else {
                              updatedTargets = updatedTargets.filter((t) => t !== 'all');
                              if (e.target.checked) {
                                updatedTargets.push(prof.id);
                              } else {
                                updatedTargets = updatedTargets.filter((t) => t !== prof.id);
                              }
                              if (updatedTargets.length === 0) updatedTargets = ['all'];
                            }
                            setEditingAnnouncement({ ...editingAnnouncement, target_profiles: updatedTargets });
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{prof.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: theme.primary }}
                  className="px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Enregistrer l'Annonce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

