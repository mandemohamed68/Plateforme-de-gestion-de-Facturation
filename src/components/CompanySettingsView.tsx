import React, { useState, useRef } from 'react';
import {
  Building,
  Palette,
  FileText,
  CreditCard,
  CheckCircle2,
  Save,
  Globe,
  Phone,
  Mail,
  MapPin,
  Shield,
  Eye,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Activity,
  HeartPulse,
  Cross,
  Microscope,
  Stethoscope,
  Layout,
  Check,
  Server,
  Database,
  Download,
  AlertTriangle,
  Receipt,
  Settings,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Award,
  Plus,
  Edit3,
  Megaphone,
  Layers,
  X,
  Play,
  Volume2,
  Clock,
} from 'lucide-react';
import { CompanySettings, PaymentMethodItem, FlashAnnouncement } from '../types';
import { getAppTheme } from '../lib/theme';
import { DEFAULT_FLASH_ANNOUNCEMENTS } from './FlashAnnouncementsView';
import { MobileMoneyAggregatorModal } from './MobileMoneyAggregatorModal';

interface CompanySettingsViewProps {
  company: CompanySettings;
  onSaveCompany: (updated: CompanySettings) => Promise<void>;
}

const PRIMARY_COLOR_PRESETS = [
  { name: 'Bleu Médical / Clinique', hex: '#0284c7' },
  { name: 'Cobalt Pro', hex: '#2563eb' },
  { name: 'Vert Santé / Émeraude', hex: '#059669' },
  { name: 'Cyan Laboratoire', hex: '#0891b2' },
  { name: 'Bordeaux Exécutif', hex: '#881337' },
  { name: 'Indigo / Violet', hex: '#7c3aed' },
  { name: 'Ardoise / Sombre Pro', hex: '#0f172a' },
];

const SECONDARY_COLOR_PRESETS = [
  { name: 'Émeraude Santé', hex: '#10b981' },
  { name: 'Ambre Attention', hex: '#f59e0b' },
  { name: 'Rose Doux', hex: '#f43f5e' },
  { name: 'Violet Exécutif', hex: '#8b5cf6' },
  { name: 'Ciel Calme', hex: '#0ea5e9' },
];

const SIDEBAR_PRESETS = [
  { name: 'Harmonie Marque (Auto)', hex: '' },
  { name: 'Ardoise Nuit', hex: '#0f172a' },
  { name: 'Bleu Nuit Médical', hex: '#082f49' },
  { name: 'Émeraude Sombre', hex: '#064e3b' },
  { name: 'Bordeaux Profond', hex: '#4c0519' },
  { name: 'Anthracite / Carbone', hex: '#18181b' },
];

const PRESET_LOGOS = [
  {
    name: 'Laboratoire Médical (Bleu)',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Clinique & Santé (Vert)',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Biologie & Recherche',
    url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cabinet Médical Pro',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_PAYMENT_METHOD_ITEMS: PaymentMethodItem[] = [
  { id: 'cash', name: 'Espèces Caisse (Comptant)', icon: '💵', category: 'cash', enabled: true, instruction_note: 'Encaissement direct au guichet caisse' },
  { id: 'wave', name: 'Wave Mobile Money', icon: '📱', category: 'mobile_money', enabled: true, merchant_id: 'WAVE-CI-98124', account_number: '+225 07 08 09 10 11', fee_percentage: 1, instruction_note: 'Scannez le QR code ou entrez le code marchand Wave' },
  { id: 'orange_money', name: 'Orange Money Côte d\'Ivoire', icon: '🟧', category: 'mobile_money', enabled: true, merchant_id: 'OM-CI-4412', account_number: '#144#4*1#', fee_percentage: 1, instruction_note: 'Composez le #144# ou validez la notification push' },
  { id: 'moov_money', name: 'Moov Money / MTN MoMo', icon: '🟦', category: 'mobile_money', enabled: true, merchant_id: 'MOMO-CI-1029', account_number: '*133# / *155#', fee_percentage: 1, instruction_note: 'Entrez votre numéro et confirmez par votre code secret' },
  { id: 'card', name: 'Carte Bancaire (TPE)', icon: '💳', category: 'card', enabled: true, instruction_note: 'Paiement par carte Visa / Mastercard au TPE' },
  { id: 'check', name: 'Chèque Bancaire', icon: '📝', category: 'bank', enabled: true, instruction_note: 'Chèque certifié à l\'ordre du laboratoire' },
  { id: 'transfer', name: 'Virement Bancaire (RIB)', icon: '🏦', category: 'bank', enabled: true, account_number: 'CI93 0100 2000 3000 4000 50', instruction_note: 'Fournir le justificatif de virement bancaire' },
  { id: 'insurance', name: 'Prise en Charge Directe (Tiers-Payeur Assurance)', icon: '🛡️', category: 'insurance', enabled: true, instruction_note: 'Validation du bon de prise en charge avec la compagnie' },
];

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  company,
  onSaveCompany,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({
    ...company,
    primary_color: company.primary_color || '#0f172a',
    sidebar_color: company.sidebar_color || '',
    secondary_color: company.secondary_color || '#10b981',
    show_watermark: company.show_watermark !== false,
    watermark_text: company.watermark_text || "DOCUMENT CONFIDENTIEL ET OFFICIEL",
    watermark_type: company.watermark_type || 'both',
    watermark_opacity: company.watermark_opacity || 0.12,
    watermark_position: company.watermark_position || 'diagonal',
    flash_news_enabled: company.flash_news_enabled !== false,
    flash_news_speed: company.flash_news_speed || 10,
    flash_announcements: company.flash_announcements && company.flash_announcements.length > 0 ? company.flash_announcements : DEFAULT_FLASH_ANNOUNCEMENTS,
    payment_method_items: company.payment_method_items || DEFAULT_PAYMENT_METHOD_ITEMS,
    enabled_payment_methods: company.enabled_payment_methods || [
      'cash',
      'wave',
      'orange_money',
      'moov_money',
      'card',
      'check',
      'transfer',
      'insurance',
    ],
    ndm_prefix: company.ndm_prefix !== undefined ? company.ndm_prefix : 'NDM-',
    ndm_digits: company.ndm_digits !== undefined ? company.ndm_digits : 8,
    ndm_next_number: company.ndm_next_number !== undefined ? company.ndm_next_number : 270408,
    session_timeout_minutes: company.session_timeout_minutes !== undefined ? company.session_timeout_minutes : 15,
  });

  const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'payments' | 'flash_news' | 'fiscal' | 'lab' | 'system'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethodItem | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<FlashAnnouncement | null>(null);
  const [isTestAggregatorOpen, setIsTestAggregatorOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const theme = getAppTheme(formData.primary_color, formData.sidebar_color);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleTogglePaymentMethod = (methodId: string) => {
    const current = formData.enabled_payment_methods || [];
    const exists = current.includes(methodId);
    const updated = exists ? current.filter((m) => m !== methodId) : [...current, methodId];
    handleChange('enabled_payment_methods', updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Veuillez sélectionner une image de moins de 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleChange('logo_url', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange('logo_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveCompany(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backoffice_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16 max-w-full">
      {/* Back-Office Platform Header */}
      <div
        style={{ backgroundColor: theme.primary }}
        className="text-white rounded-md p-4 sm:p-6 shadow-md space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 text-white border border-white/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded">
                Back-Office Administrateur Central
              </span>
              <span className="text-white/80 text-xs font-mono">• Port 3000 Node.js Engine</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center space-x-2">
              <Settings className="w-5 h-5 text-white shrink-0" />
              <span>Paramétrage Intégral de la Plateforme &amp; Marque</span>
            </h1>
            <p className="text-xs text-white/90">
              Gérez le moindre détail de votre système : identité de marque, logos officiels, moyens de paiement autorisés, régime fiscal, coordonnées bancaires et mentions d'impression.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold px-3 py-2 rounded-md transition"
              title="Exporter la configuration au format JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter Config</span>
            </button>

            <button
              id="btn-save-backoffice"
              onClick={() => handleSubmit()}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-white text-slate-900 text-xs font-black px-4 py-2 rounded-md shadow-sm hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-900" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la Config'}</span>
            </button>
          </div>
        </div>

        {/* Server & DB Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/20 text-xs text-white/90">
          <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded border border-white/20">
            <Server className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px]">Serveur Express API</div>
              <div className="text-[10px] text-white/70">Actif sur 0.0.0.0:3000</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded border border-white/20">
            <Database className="w-4 h-4 text-sky-300 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px]">Persistance Disque</div>
              <div className="text-[10px] text-white/70">Sauvegarde /data/db_store.json</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded border border-white/20">
            <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px]">Impression Factures &amp; Reçus</div>
              <div className="text-[10px] text-white/70">En-tête officiel avec logo actif</div>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-md flex items-center space-x-3 text-emerald-900 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div>Configuration enregistrée et appliquée avec succès sur l'ensemble de la plateforme !</div>
            <div className="font-normal text-[11px] text-emerald-800 mt-0.5">
              Toutes les modifications (logos, nom, moyens de paiement, couleurs) sont immédiatement répercutées sur les factures et les menus.
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Back-Office Sections */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          style={activeTab === 'branding' ? { backgroundColor: theme.primary, color: '#ffffff' } : undefined}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            activeTab === 'branding'
              ? 'shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>1. Identité, Logo &amp; Couleurs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          style={activeTab === 'contact' ? { backgroundColor: theme.primary, color: '#ffffff' } : undefined}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            activeTab === 'contact'
              ? 'shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>2. Coordonnées &amp; Agrément Legaux</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={activeTab === 'payments' ? { backgroundColor: theme.primary, color: '#ffffff' } : undefined}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            activeTab === 'payments'
              ? 'shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>3. Moyens de Paiement &amp; Banques</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fiscal')}
          style={activeTab === 'fiscal' ? { backgroundColor: theme.primary, color: '#ffffff' } : undefined}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            activeTab === 'fiscal'
              ? 'shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>4. Fiscalité &amp; Mentions Légales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lab')}
          style={activeTab === 'lab' ? { backgroundColor: theme.primary, color: '#ffffff' } : undefined}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            activeTab === 'lab'
              ? 'shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Microscope className="w-3.5 h-3.5" />
          <span>5. Plateau &amp; N° Dossier (NDM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          style={activeTab === 'system' ? { backgroundColor: theme.primary, color: '#ffffff' } : undefined}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-md transition ${
            activeTab === 'system'
              ? 'shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>6. Mode Sandbox / Production</span>
        </button>
      </div>

      {/* Main Grid: Form Left + Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Active Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: Branding, Logos & Colors */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Section 1: Logo & Name */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Palette className="w-4 h-4 text-slate-900" />
                  <h3 className="text-sm font-bold text-slate-900">
                    A. Logo Officiel &amp; Titre de l'Établissement
                  </h3>
                </div>

                {/* Logo Upload Box */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Logo Imprimé sur Factures et Reçus
                  </label>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="w-20 h-20 rounded-md bg-white border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden shrink-0 relative">
                      {formData.logo_url ? (
                        <img
                          src={formData.logo_url}
                          alt="Logo Aperçu"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: theme.primary }}
                          className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                        >
                          {formData.name ? formData.name.charAt(0).toUpperCase() : 'L'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/png, image/jpeg, image/svg+xml, image/webp"
                          className="hidden"
                          id="company-logo-input"
                        />
                        <label
                          htmlFor="company-logo-input"
                          className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-md cursor-pointer shadow-xs transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>Importer un Logo (PNG, JPG, SVG)</span>
                        </label>

                        {formData.logo_url && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-md transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Format recommandé : Image carrée ou rectangulaire sur fond transparent ou blanc (max 2 Mo).
                      </p>
                    </div>
                  </div>

                  {/* Preset Logos */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Ou choisir un modèle de logo médical prédéfini :
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_LOGOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChange('logo_url', preset.url)}
                          className="flex items-center space-x-2 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:border-slate-300 text-xs font-medium text-slate-700 transition"
                        >
                          <img src={preset.url} alt={preset.name} className="w-5 h-5 object-cover rounded" />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & Slogan Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nom Officiel de l'Établissement *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Nom de l'entreprise"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Slogan ou Titre Secondaire
                    </label>
                    <input
                      type="text"
                      value={formData.slogan}
                      onChange={(e) => handleChange('slogan', e.target.value)}
                      placeholder="Slogan de l'entreprise"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Colors & Theme */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Layout className="w-4 h-4 text-slate-900" />
                  <h3 className="text-sm font-bold text-slate-900">
                    B. Couleurs de Marque &amp; Menu Navigation (Sidebar)
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Couleur d'Accent Principale (Boutons, Onglets, Badges)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRIMARY_COLOR_PRESETS.map((preset) => {
                      const isSelected = formData.primary_color === preset.hex;
                      return (
                        <button
                          type="button"
                          key={preset.hex}
                          onClick={() => handleChange('primary_color', preset.hex)}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-bold transition ${
                            isSelected
                              ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-900'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-xs"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="text-slate-800">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <input
                      type="color"
                      value={formData.primary_color || '#0f172a'}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-9 h-9 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      placeholder="#0f172a"
                      className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Couleur Secondaire d'Accentuation (Badges, Éléments de Mise en Valeur)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {SECONDARY_COLOR_PRESETS.map((preset) => {
                      const isSelected = formData.secondary_color === preset.hex;
                      return (
                        <button
                          type="button"
                          key={preset.hex}
                          onClick={() => handleChange('secondary_color', preset.hex)}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-bold transition ${
                            isSelected
                              ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-900'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-xs"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="text-slate-800">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Couleur de Fond de la Navigation Latérale (Sidebar)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {SIDEBAR_PRESETS.map((preset) => {
                      const isSelected = (formData.sidebar_color || '') === preset.hex;
                      return (
                        <button
                          type="button"
                          key={preset.name}
                          onClick={() => handleChange('sidebar_color', preset.hex)}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-bold transition ${
                            isSelected
                              ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-900'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300"
                            style={{
                              backgroundColor:
                                preset.hex || getAppTheme(formData.primary_color).sidebarBg,
                            }}
                          />
                          <span className="text-slate-800">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section C: Logo Filigrane (Watermark) */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-slate-900 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        C. Logo de la Structure en Filigrane (Arrière-Plan de l'Application &amp; Documents)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Affiche le logo de l'établissement en arrière-plan transparent (filigrane) sur l'écran d'accueil et les documents.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer shrink-0 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-200 transition">
                    <input
                      type="checkbox"
                      checked={formData.show_watermark !== false}
                      onChange={(e) => handleChange('show_watermark', e.target.checked)}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      {formData.show_watermark !== false ? 'Filigrane Activé' : 'Filigrane Désactivé'}
                    </span>
                  </label>
                </div>

                {formData.show_watermark !== false && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Type de Filigrane
                        </label>
                        <select
                          value={formData.watermark_type || 'both'}
                          onChange={(e) => handleChange('watermark_type', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                        >
                          <option value="both">Logo d'Établissement &amp; Texte Officiel (Recommandé)</option>
                          <option value="logo">Logo d'Établissement Uniquement</option>
                          <option value="text">Texte Personnalisé Uniquement</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Texte de Filigrane
                        </label>
                        <input
                          type="text"
                          value={formData.watermark_text || ''}
                          onChange={(e) => handleChange('watermark_text', e.target.value)}
                          placeholder="Texte en filigrane"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Opacité du Filigrane ({Math.round((formData.watermark_opacity || 0.12) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0.05"
                          max="0.40"
                          step="0.01"
                          value={formData.watermark_opacity || 0.12}
                          onChange={(e) => handleChange('watermark_opacity', parseFloat(e.target.value))}
                          className="w-full accent-slate-900 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Orientation
                        </label>
                        <select
                          value={formData.watermark_position || 'diagonal'}
                          onChange={(e) => handleChange('watermark_position', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                        >
                          <option value="diagonal">Diagonale (-30°)</option>
                          <option value="center">Centré Horizontal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Coordonnées & Agrément Légaux */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Building className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Coordonnées Officielles &amp; Registre Légal
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Adresse Physiques &amp; Quartier
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Adresse complète"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ville &amp; Pays
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Ville, Pays"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Téléphones Standard / Urgences
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Numéro de téléphone"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email de Contact / Résultats
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Adresse email"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Registre du Commerce (RCCM)
                  </label>
                  <input
                    type="text"
                    value={formData.rccm}
                    onChange={(e) => handleChange('rccm', e.target.value)}
                    placeholder="Numéro RCCM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Compte Contribuable (CC / IFU)
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value)}
                    placeholder="Numéro CC"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Agrément Ministère de la Santé (Agrément Médical)
                  </label>
                  <input
                    type="text"
                    value={formData.health_accreditation_number || ''}
                    onChange={(e) => handleChange('health_accreditation_number', e.target.value)}
                    placeholder="Agrément Ministériel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Moyens de Paiement & Banques */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Enabled Payment Methods Checklist & Custom CRUD */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-slate-900" />
                    <h3 className="text-sm font-bold text-slate-900">
                      A. Gestion des Moyens de Règlement (Ajout, Modification, Suppression)
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsTestAggregatorOpen(true)}
                      className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xs transition"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Tester le Workflow Agrégateur</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPaymentMethod({
                          id: `custom_${Date.now()}`,
                          name: '',
                          icon: '💳',
                          category: 'mobile_money',
                          enabled: true,
                          is_custom: true,
                        });
                        setIsPaymentMethodModalOpen(true);
                      }}
                      style={{ backgroundColor: theme.primary }}
                      className="flex items-center space-x-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xs hover:opacity-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un Moyen</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Cochez ou décochez les moyens de paiement acceptés à la caisse ou modifiez leurs paramètres et frais.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(formData.payment_method_items || DEFAULT_PAYMENT_METHOD_ITEMS).map((method) => {
                    const isChecked = (formData.enabled_payment_methods || []).includes(method.id) && method.enabled !== false;
                    return (
                      <div
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-md border transition ${
                          isChecked
                            ? 'bg-slate-50 border-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 opacity-75'
                        }`}
                      >
                        <label className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePaymentMethod(method.id)}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 shrink-0"
                          />
                          <span className="text-lg shrink-0">{method.icon}</span>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 truncate">{method.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {method.category === 'mobile_money' ? 'Agrégateur Mobile' : method.category === 'card' ? 'TPE Carte' : 'Paiement Direct'}
                              {method.fee_percentage ? ` • Frais: ${method.fee_percentage}%` : ''}
                            </div>
                          </div>
                        </label>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPaymentMethod(method);
                              setIsPaymentMethodModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                            title="Modifier ce moyen de paiement"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {method.is_custom && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer le moyen de paiement "${method.name}" ?`)) {
                                  const updated = (formData.payment_method_items || []).filter((m) => m.id !== method.id);
                                  handleChange('payment_method_items', updated);
                                }
                              }}
                              className="p-1 hover:bg-rose-100 rounded text-rose-600 hover:text-rose-800 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bank & Mobile Money Coordinates */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Building className="w-4 h-4 text-slate-900" />
                  <h3 className="text-sm font-bold text-slate-900">
                    B. Coordonnées Bancaires &amp; Mobile Money
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nom de la Banque
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => handleChange('bank_name', e.target.value)}
                      placeholder="Nom de la banque"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Code SWIFT / BIC
                    </label>
                    <input
                      type="text"
                      value={formData.bank_bic}
                      onChange={(e) => handleChange('bank_bic', e.target.value)}
                      placeholder="Code guichet"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      N° IBAN / Compte Bancaire
                    </label>
                    <input
                      type="text"
                      value={formData.bank_iban}
                      onChange={(e) => handleChange('bank_iban', e.target.value)}
                      placeholder="RIB / Numéro de compte"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Numéros Récepteurs Mobile Money (Wave / Orange / Moov)
                    </label>
                    <input
                      type="text"
                      value={formData.mobile_money_numbers || ''}
                      onChange={(e) => handleChange('mobile_money_numbers', e.target.value)}
                      placeholder="Comptes Mobile Money"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Annonces Globales & Flash Info */}
          {activeTab === 'flash_news' && (
            <div className="space-y-6">
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Megaphone className="w-4 h-4 text-slate-900" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Gestion du Bandeau Ticker Flash Info (Slider Défilant)
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.flash_news_enabled !== false}
                        onChange={(e) => handleChange('flash_news_enabled', e.target.checked)}
                        className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-800 uppercase">Activer le Ticker</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingAnnouncement({
                          id: `flash_${Date.now()}`,
                          title: '',
                          message: '',
                          type: 'info',
                          active: true,
                          priority: (formData.flash_announcements || []).length + 1,
                          target_profiles: ['all'],
                        });
                        setIsAnnouncementModalOpen(true);
                      }}
                      style={{ backgroundColor: theme.primary }}
                      className="flex items-center space-x-1.5 text-white text-xs font-bold px-3.5 py-1.5 rounded-md shadow-xs hover:opacity-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une Annonce Flash</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Vitesse de Défilement Automatique (Secondes par annonce)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="30"
                      value={formData.flash_news_speed || 6}
                      onChange={(e) => handleChange('flash_news_speed', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="text-xs text-slate-500 my-auto pt-2">
                    Les annonces actives défilent automatiquement en haut de l'application avec mise en pause au survol.
                  </div>
                </div>

                {/* Announcement Items List */}
                <div className="space-y-3 pt-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Liste des Annonces Flash Configurées ({ (formData.flash_announcements || []).length })
                  </div>

                  <div className="space-y-2">
                    {(formData.flash_announcements || []).map((ann) => (
                      <div
                        key={ann.id}
                        className={`p-3.5 rounded-md border flex items-center justify-between gap-3 ${
                          ann.active
                            ? 'bg-slate-50 border-slate-300 shadow-2xs'
                            : 'bg-slate-100 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              ann.type === 'urgent'
                                ? 'bg-rose-600 text-white border-rose-700'
                                : ann.type === 'warning'
                                ? 'bg-amber-500 text-slate-950 border-amber-600'
                                : ann.type === 'promo'
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-sky-600 text-white border-sky-700'
                            }`}
                          >
                            {ann.type}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-extrabold text-slate-900 truncate">{ann.title}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded border border-slate-300 shrink-0">
                                🎯 {(!ann.target_profiles || ann.target_profiles.includes('all')) ? 'Tous les profils' : ann.target_profiles.join(', ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 truncate">{ann.message}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.flash_announcements || []).map((a) =>
                                a.id === ann.id ? { ...a, active: !a.active } : a
                              );
                              handleChange('flash_announcements', updated);
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded border ${
                              ann.active
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            {ann.active ? 'Actif' : 'Masqué'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingAnnouncement(ann);
                              setIsAnnouncementModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer l'annonce "${ann.title}" ?`)) {
                                const updated = (formData.flash_announcements || []).filter((a) => a.id !== ann.id);
                                handleChange('flash_announcements', updated);
                              }
                            }}
                            className="p-1 hover:bg-rose-100 rounded text-rose-600 hover:text-rose-800 transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Fiscalité & Mentions Légales */}
          {activeTab === 'fiscal' && (
            <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Receipt className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Régime Fiscal, TVA &amp; Pied de Page des Factures
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Symbole Monétaire
                  </label>
                  <select
                    value={formData.currency_symbol}
                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="XOF">XOF</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Position du Symbole Monétaire
                  </label>
                  <select
                    value={formData.currency_position || 'after'}
                    onChange={(e) => handleChange('currency_position', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value="after">Après le Montant (ex: 15 000 FCFA)</option>
                    <option value="before">Avant le Montant (ex: FCFA 15 000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Séparateur de Milliers (Chiffres &amp; Prix)
                  </label>
                  <select
                    value={formData.thousand_separator || 'space'}
                    onChange={(e) => handleChange('thousand_separator', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value="space">Espace "1 000 000" (Standard Francophone)</option>
                    <option value="dot">Point "1.000.000" (Standard Européen)</option>
                    <option value="comma">Virgule "1,000,000" (Standard Anglosaxon)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-3 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Personnalisation Hyper-Détaillée des Intitulés de Documents (À la virgule près)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Titre Reçu de Caisse (Réglé)
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_title_paid || "REÇU DE CAISSE ET RÈGLEMENT"}
                        onChange={(e) => handleChange('invoice_title_paid', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Titre Facture Validée
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_title_posted || "FACTURE D'ACTES ET ANALYSES MÉDICALES"}
                        onChange={(e) => handleChange('invoice_title_posted', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Titre Devis / Brouillon
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_title_draft || "FACTURE BROUILLON / DEVIS D'EXAMENS"}
                        onChange={(e) => handleChange('invoice_title_draft', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pagination par Défaut (Lignes par Tableau)
                  </label>
                  <select
                    value={formData.default_page_size || 50}
                    onChange={(e) => handleChange('default_page_size', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value={25}>25 lignes par page</option>
                    <option value={50}>50 lignes par page (Recommandé)</option>
                    <option value={100}>100 lignes par page</option>
                    <option value={200}>200 lignes par page</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Configure la taille de page par défaut pour toutes les listes (Factures, Caisse, Échantillonnage, etc.).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Taux de TVA par défaut (%)
                  </label>
                  <input
                    type="number"
                    value={formData.default_tax_rate}
                    onChange={(e) => handleChange('default_tax_rate', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    0% pour l'exonération médicale sur les examens de biologie.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Motif d'Exonération de TVA Légale (Affiché si TVA = 0%)
                  </label>
                  <input
                    type="text"
                    value={formData.tax_exemption_default_reason || ''}
                    onChange={(e) => handleChange('tax_exemption_default_reason', e.target.value)}
                    placeholder="Mentions légales de facturation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pied de Page Officiel Imprimé sur la Facture
                  </label>
                  <textarea
                    rows={3}
                    value={formData.invoice_footer}
                    onChange={(e) => handleChange('invoice_footer', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Plateau Technique Médical */}
          {activeTab === 'lab' && (
            <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Microscope className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Paramètres du Plateau Technique &amp; Biologiste Référent
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Biologiste Médical / Directeur Scientifique
                  </label>
                  <input
                    type="text"
                    value={formData.medical_director_name || ''}
                    onChange={(e) => handleChange('medical_director_name', e.target.value)}
                    placeholder="Directeur / Responsable"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Délai Moyen de Rendu des Résultats
                  </label>
                  <input
                    type="text"
                    value={formData.lab_turnaround_default || ''}
                    onChange={(e) => handleChange('lab_turnaround_default', e.target.value)}
                    placeholder="Délai de rendu par défaut"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Dossier Structuration Configuration */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-slate-900" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Structure &amp; Séquençage du Numéro de Dossier (NDM)
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Définissez comment l'application génère automatiquement les numéros de dossiers des nouveaux patients.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Préfixe du Dossier
                    </label>
                    <input
                      type="text"
                      value={formData.ndm_prefix || ''}
                      onChange={(e) => handleChange('ndm_prefix', e.target.value)}
                      placeholder="Préfixe des dossiers"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre de Chiffres (Padding)
                    </label>
                    <select
                      value={formData.ndm_digits || 8}
                      onChange={(e) => handleChange('ndm_digits', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                    >
                      <option value={4}>4 chiffres (ex: 0001)</option>
                      <option value={6}>6 chiffres (ex: 000001)</option>
                      <option value={8}>8 chiffres (ex: 00000001)</option>
                      <option value={10}>10 chiffres (ex: 0000000001)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Prochain Numéro de Séquence
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.ndm_next_number || 1}
                      onChange={(e) => handleChange('ndm_next_number', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Real-time preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Aperçu du Prochain Numéro Généré :
                    </div>
                    <div className="text-xs text-slate-500">
                      C'est ce format qui sera affecté au prochain patient créé.
                    </div>
                  </div>
                  <div className="bg-slate-900 text-emerald-400 font-mono text-sm font-bold px-4 py-2 rounded-md border border-slate-800 shadow-inner">
                    {(formData.ndm_prefix || '') + String(formData.ndm_next_number || 1).padStart(formData.ndm_digits || 8, '0')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Mode Sandbox vs Production */}
          {activeTab === 'system' && (
            <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Server className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Environnement et Mode de Fonctionnement du Système
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Basculez entre le mode Sandbox (entraînement, démos, simulation) et le mode Production (vrai flux clinique, facturation légale, et synchronisation active).
                </p>

                {/* State Indicator */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3.5 transition ${
                  formData.is_sandbox
                    ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className={`p-2 rounded-lg shrink-0 ${
                    formData.is_sandbox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {formData.is_sandbox ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider">
                      Mode Actuellement Sélectionné : {formData.is_sandbox ? 'Mode Sandbox (Simulé)' : 'Mode Production (Live)'}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {formData.is_sandbox
                        ? "L'application fonctionne en mode hors-ligne simulé. Les actions n'impactent pas vos registres comptables réels et l'impression simule un environnement de démonstration."
                        : "L'ensemble du système ERP et LIMS est en production active. Les factures générées possèdent un statut officiel légal, les caisses de vacation sont enregistrées de façon immuable, et l'impression lance les dialogues réels du système d'exploitation."}
                    </p>
                  </div>
                </div>

                {/* Main Toggle Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleChange('is_sandbox', true)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition ${
                      formData.is_sandbox
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Sandbox
                      </span>
                      {formData.is_sandbox && <Check className="w-4 h-4 text-slate-900" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Simuler l'Environnement</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Données et impressions de démonstration.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('is_sandbox', false)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition ${
                      !formData.is_sandbox
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Production Live
                      </span>
                      {!formData.is_sandbox && <Check className="w-4 h-4 text-slate-900" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Activer le Mode Réel</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Impression directe &amp; comptabilité scellée.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security & Inactivity Session Configuration */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Sécurité des Données Médicales & Déconnexion par Inactivité
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Conformément aux normes de confidentialité des données de santé et de secret médical, la plateforme déconnecte automatiquement l'utilisateur lorsqu'aucune activité (clic, frappe, mouvement de souris) n'est constatée pendant un délai déterminé.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {[
                    { val: 5, label: '5 min', desc: 'Haute Sécurité' },
                    { val: 10, label: '10 min', desc: 'Recommandé' },
                    { val: 15, label: '15 min', desc: 'Standard' },
                    { val: 30, label: '30 min', desc: 'Modéré' },
                    { val: 60, label: '60 min', desc: 'Prolongé' },
                    { val: 0, label: 'Désactivé', desc: 'Sans déconnexion' },
                  ].map((option) => {
                    const isSelected = (formData.session_timeout_minutes ?? 15) === option.val;
                    return (
                      <button
                        key={option.val}
                        type="button"
                        onClick={() => handleChange('session_timeout_minutes', option.val)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-black font-mono">{option.label}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {option.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Database Dump & Export Section */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Sauvegarde Intégrale & Dump de la Base de Données
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Exportez l'intégralité de la base de données médicale et financière (patients, analyses de biologie, factures scellées, règlements, sessions de caisse). Les fichiers exportés garantissent la portabilité et la sauvegarde conforme de vos données.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a
                    href="/api/database/dump"
                    download
                    className="flex items-center justify-between p-3.5 bg-sky-50/80 hover:bg-sky-100 border border-sky-200 rounded-xl transition group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-sky-900">
                          Télécharger Dump JSON
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Format complet avec métadonnées &amp; objets
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-200/70 text-sky-800 rounded font-mono">
                      .JSON
                    </span>
                  </a>

                  <a
                    href="/api/database/dump-sql"
                    download
                    className="flex items-center justify-between p-3.5 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-emerald-900">
                          Télécharger Dump SQL
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Script tables &amp; INSERT (MariaDB / MySQL)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/70 text-emerald-800 rounded font-mono">
                      .SQL
                    </span>
                  </a>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Emplacement local des fichiers de persistance et dump sur le serveur :</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 pl-5">
                    • /data/db_store.json (Stockage actif persistant)<br />
                    • /data/database_dump.json (Archive dump JSON complète)<br />
                    • /database/dump_database.sql (Script SQL de réimportation)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving}
              style={{ backgroundColor: theme.primary !== '#0f172a' ? theme.primary : '#0f172a' }}
              className="flex items-center space-x-2 text-white text-xs font-black px-6 py-2.5 rounded-md shadow-sm hover:opacity-95 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer Toute la Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Live Interactive Preview */}
        <div className="space-y-4">
          <div
            style={{ backgroundColor: theme.primary }}
            className="text-white p-3.5 rounded-md flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Aperçu Direct sur l'Application
              </span>
            </div>
            <span
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: theme.primary }}
            />
          </div>

          {/* Mini Sidebar Preview */}
          <div
            style={{ backgroundColor: theme.sidebarBg, borderColor: theme.sidebarBorder }}
            className="rounded-md p-4 text-white border shadow-xs space-y-4"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2 flex items-center justify-between">
              <span>Menu Latéral (Sidebar)</span>
              <span
                style={{ backgroundColor: `${theme.primary}30`, color: theme.primary }}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              >
                Direct
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-9 h-9 object-contain rounded border border-white/20 p-0.5 bg-white/10 shrink-0"
                />
              ) : (
                <div
                  style={{ backgroundColor: theme.primary }}
                  className="w-9 h-9 rounded flex items-center justify-center font-black text-sm text-white shrink-0"
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'L'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-black truncate max-w-[160px]">
                  {formData.name || 'LABORATOIRE MÉRIDIONAL'}
                </div>
                <div className="text-[10px] text-white/60 truncate max-w-[160px]">
                  {formData.slogan || 'Analyses Médicales'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div
                style={{ backgroundColor: theme.activeNavBg }}
                className="px-3 py-2 rounded text-white font-bold flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center space-x-2">
                  <Microscope className="w-3.5 h-3.5" />
                  <span>Examens &amp; Résultats</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>

              <div className="px-3 py-2 rounded text-white/70 flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Factures &amp; Quittances</span>
              </div>
            </div>
          </div>

          {/* Mini Invoice Header Preview */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3 text-slate-900">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>En-tête de Facture Imprimée</span>
              <span className="text-slate-400 font-mono">FAC-2026-0001</span>
            </div>

            <div className="flex items-start space-x-3">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded border border-slate-200 p-0.5 bg-white shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                  <Microscope className="w-5 h-5 text-slate-200" />
                </div>
              )}
              <div>
                <div className="text-xs font-black text-slate-900 uppercase">
                  {formData.name || "LABORATOIRE D'ANALYSES"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formData.address ? `${formData.address}, ${formData.city}` : 'Abidjan, Côte d\'Ivoire'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Tél: {formData.phone || '+225 27 20 00 00 00'}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
              <div className="flex justify-between font-bold">
                <span>Total Prestations :</span>
                <span className="font-mono">15 000 {formData.currency_symbol || 'FCFA'}</span>
              </div>
              <div className="text-[9px] text-slate-500 italic">
                {formData.invoice_footer || 'Facture délivrée à titre de quittance officielle.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Custom Payment Method Add/Edit */}
      {isPaymentMethodModalOpen && editingPaymentMethod && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div
              style={{ backgroundColor: theme.primary }}
              className="px-4 py-3 text-white flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-sky-300" />
                <span>{editingPaymentMethod.is_custom ? "Ajouter un Moyen de Paiement" : "Modifier le Moyen de Paiement"}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentMethodModalOpen(false);
                  setEditingPaymentMethod(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingPaymentMethod.name.trim()) return;
                
                const existing = formData.payment_method_items || DEFAULT_PAYMENT_METHOD_ITEMS;
                const index = existing.findIndex((m) => m.id === editingPaymentMethod.id);
                let updated: PaymentMethodItem[];
                if (index >= 0) {
                  updated = [...existing];
                  updated[index] = editingPaymentMethod;
                } else {
                  updated = [...existing, editingPaymentMethod];
                }

                const enabledList = formData.enabled_payment_methods || [];
                const updatedEnabled = enabledList.includes(editingPaymentMethod.id)
                  ? enabledList
                  : [...enabledList, editingPaymentMethod.id];

                handleChange('payment_method_items', updated);
                handleChange('enabled_payment_methods', updatedEnabled);
                setIsPaymentMethodModalOpen(false);
                setEditingPaymentMethod(null);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom du Moyen de Paiement *
                </label>
                <input
                  type="text"
                  required
                  value={editingPaymentMethod.name}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, name: e.target.value })}
                  placeholder="Nom du moyen de paiement"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Icône Emoji
                  </label>
                  <input
                    type="text"
                    value={editingPaymentMethod.icon || '💳'}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, icon: e.target.value })}
                    placeholder="Icône (ex: emoji)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold text-slate-900 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catégorie
                  </label>
                  <select
                    value={editingPaymentMethod.category}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value="mobile_money">Agrégateur Mobile Money</option>
                    <option value="card">Carte Bancaire / TPE</option>
                    <option value="bank">Banque / Virement / Chèque</option>
                    <option value="cash">Espèces Caisse</option>
                    <option value="insurance">Tiers-Payeur Assurance</option>
                    <option value="other">Autre / Spécifique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Marchand / Compte
                  </label>
                  <input
                    type="text"
                    value={editingPaymentMethod.merchant_id || ''}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, merchant_id: e.target.value })}
                    placeholder="Identifiant marchand"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Frais Transaction (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={editingPaymentMethod.fee_percentage || 0}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, fee_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note d'Instruction Client / Caissier
                </label>
                <input
                  type="text"
                  value={editingPaymentMethod.instruction_note || ''}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, instruction_note: e.target.value })}
                  placeholder="Instructions"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentMethodModalOpen(false);
                    setEditingPaymentMethod(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: theme.primary }}
                  className="px-5 py-2 text-white text-xs font-bold rounded-md hover:opacity-95 shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Flash Announcement Add/Edit */}
      {isAnnouncementModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div
              style={{ backgroundColor: theme.primary }}
              className="px-4 py-3 text-white flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 font-bold text-xs">
                <Megaphone className="w-4 h-4 text-amber-300" />
                <span>Editer l'Annonce Flash Info</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAnnouncementModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingAnnouncement.title.trim() || !editingAnnouncement.message.trim()) return;

                const existing = formData.flash_announcements || [];
                const index = existing.findIndex((a) => a.id === editingAnnouncement.id);
                let updated: FlashAnnouncement[];
                if (index >= 0) {
                  updated = [...existing];
                  updated[index] = editingAnnouncement;
                } else {
                  updated = [...existing, editingAnnouncement];
                }

                handleChange('flash_announcements', updated);
                setIsAnnouncementModalOpen(false);
                setEditingAnnouncement(null);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titre / Sujet de l'Annonce *
                </label>
                <input
                  type="text"
                  required
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  placeholder="Titre de la notification"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Défilant Complète *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingAnnouncement.message}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                  placeholder="Saisissez le texte d'information destiné aux utilisateurs et patients..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Niveau d'Urgence / Type
                  </label>
                  <select
                    value={editingAnnouncement.type}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value="info">Information Générale (Bleu)</option>
                    <option value="promo">Communication / Nouveauté (Vert)</option>
                    <option value="warning">Vigilance / Rappel (Orange)</option>
                    <option value="urgent">Urgent / Alerte (Rouge)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priorité de Défilage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={editingAnnouncement.priority || 1}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Target Profiles Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  🎯 Profils Cibles Destinataires du Message
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Cochez "Tous les Profils" ou sélectionnez un ou plusieurs profils spécifiques pour restreindre l'affichage de cette notification.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
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
                        className={`flex items-center space-x-2 p-2 rounded border cursor-pointer text-xs font-bold transition ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
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

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAnnouncementModalOpen(false);
                    setEditingAnnouncement(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: theme.primary }}
                  className="px-5 py-2 text-white text-xs font-bold rounded-md hover:opacity-95 shadow-xs"
                >
                  Enregistrer l'Annonce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Mobile Money Aggregator Test Modal */}
      {isTestAggregatorOpen && (
        <MobileMoneyAggregatorModal
          move={{
            id: 9999,
            name: "FAC-2026-TEST-001",
            partner_id: 1,
            partner_name: "KOUASSI Jean-Baptiste",
            partner_phone: "+225 07 00 11 22 33",
            amount_total: 18500,
            amount_residual: 18500,
            amount_untaxed: 18500,
            amount_tax: 0,
            state: 'posted',
            payment_state: 'not_paid',
            move_type: 'out_invoice',
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            invoice_line_ids: [],
          } as any}
          company={formData}
          onClose={() => setIsTestAggregatorOpen(false)}
          onConfirmPayment={async (paymentData) => {
            alert(`Paiement de ${paymentData.amount.toLocaleString()} FCFA validé avec succès via ${paymentData.paymentMethodId.toUpperCase()} ! N° Transaction: ${paymentData.transactionRef}`);
            setIsTestAggregatorOpen(false);
          }}
        />
      )}
    </div>
  );
};
