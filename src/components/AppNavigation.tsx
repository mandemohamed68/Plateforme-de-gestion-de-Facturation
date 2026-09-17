import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  CreditCard,
  Mail,
  Database,
  BarChart3,
  UserCheck,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  Microscope,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FlaskConical,
  ScrollText,
  FolderOpen,
  Download,
  Megaphone,
  Stethoscope,
  Activity,
  Calendar,
  Bed,
  Heart,
  Clock,
  Pill,
  Shield,
  ArrowLeftRight,
  Search,
} from 'lucide-react';
import { ResUser, CompanySettings, ResGroup, AppView, ResPartner, AccountMove } from '../types';
import { getAppTheme } from '../lib/theme';
import { getUserBillingProfile, getUserMissionDescription } from '../lib/formatters';
import { decodeScannerInput } from '../lib/scannerDecoder';
import { getAllowedViews } from '../utils/navigation';
import { FlashInfoTicker } from './FlashInfoTicker';
import { OmniboxModal } from './OmniboxModal';

export type { AppView };
export { getAllowedViews };

interface NavItemConfig {
  id: AppView | string;
  label: string;
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
  isAction?: boolean;
  onClick?: () => void;
  children?: {
    id: AppView | string;
    label: string;
    badge?: number;
    onClick?: () => void;
  }[];
}

interface NavCategoryConfig {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItemConfig[];
  requiredModule?: AppView;
}

interface AppNavigationProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: ResUser | null;
  users: ResUser[];
  groups: ResGroup[];
  company: CompanySettings;
  hasActiveSession?: boolean;
  onSelectUser: (user: ResUser) => void;
  onLogout: () => void;
  onNewInvoice: () => void;
  onNewPayment: () => void;
  onNewLabOrder?: () => void;
  onResetDb: () => void;
  notificationCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onSearchNDM?: (ndm: string) => void;
  onSetInvoiceFilters?: (state: string, payment: string) => void;
  onSetPaymentFilters?: (state: string) => void;
  pendingPaymentsCount?: number;
  partners?: ResPartner[];
  moves?: AccountMove[];
  onSelectPatient?: (patient: ResPartner) => void;
  onSelectMove?: (move: AccountMove) => void;
  showToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  users = [],
  company,
  hasActiveSession = true,
  onSelectUser,
  onLogout,
  onNewInvoice,
  onNewPayment,
  onNewLabOrder,
  onResetDb,
  notificationCount,
  sidebarOpen,
  setSidebarOpen,
  onSearchNDM,
  onSetInvoiceFilters,
  onSetPaymentFilters,
  pendingPaymentsCount = 0,
  partners = [],
  moves = [],
  onSelectPatient,
  onSelectMove,
  showToast,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener for universal Omnibox search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmniboxOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'ACCUEIL': true,
    'FACTURATION': true,
    'MÉDICAL': true,
    'EXAMENS': true,
    'HOSPITALISATION': true,
    'ADMINISTRATION': true,
    'superviseur_group': true,
    'caisse_group': true,
    'factures_group': true,
    'caisse_facture_group': true,
    'infirmier_group': true,
    'medecin_group': true,
    'specialiste_group': true,
    'labo_group': true,
    'imagerie_group': true,
  });

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const allowedViews = getAllowedViews(currentUser);
  const theme = getAppTheme(company.primary_color, company.sidebar_color);
  const profile = getUserBillingProfile(currentUser);
  const roleLower = (currentUser?.role || '').toLowerCase();
  const loginLower = (currentUser?.login || '').toLowerCase();

  // Seuls les profils caisse et caisse & facture doivent ouvrir et fermer une session
  const isSessionRequiredProfile =
    loginLower === 'caissier' ||
    loginLower === 'caisse_facture' ||
    (roleLower.includes('caiss') && !roleLower.includes('supervis'));

  const isLockedOutWithoutSession = isSessionRequiredProfile && !hasActiveSession;

  const handleGoHome = () => {
    if (isSessionRequiredProfile) {
      setCurrentView('caisse_sessions');
    } else {
      setCurrentView('dashboard');
    }
    setSidebarOpen(false);
  };

  // 1. Categories definition according to the hierarchical structure requested
  const categories: NavCategoryConfig[] = [
    {
      title: 'ACCUEIL',
      icon: Heart,
      requiredModule: 'accueil_module',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord général',
          icon: BarChart3,
          description: 'Vue d’ensemble de l’activité hospitalière'
        },
        {
          id: 'patient_journey',
          label: 'Suivi Optimal - Parcours 360°',
          icon: Heart,
          description: 'Suivi de l\'arrivée à la sortie du patient'
        },
        {
          id: 'scenarios_s01_s50',
          label: 'Simulateur Scénarios (S01-S50)',
          icon: ScrollText,
          description: 'Exécution textuelle & validation des 50 scénarios hospitaliers'
        }
      ]
    },
    {
      title: 'FACTURATION',
      icon: CreditCard,
      items: [
        {
          id: 'superviseur_group',
          label: 'Superviseur',
          icon: UserCheck,
          description: 'Gestion superviseur',
          children: [
            { id: 'superviseur_dashboard', label: 'Tableau de bord' },
            { id: 'superviseur_sessions', label: 'Suivi des sessions' },
            { id: 'superviseur_invoices', label: 'Suivi des factures' },
            { id: 'superviseur_caisses', label: 'Suivi des caisses' },
            { id: 'superviseur_payments', label: 'Contrôle des encaissements' },
            { id: 'superviseur_reports', label: 'Rapports' },
          ]
        },
        {
          id: 'caisse_group',
          label: 'Caisse',
          icon: Lock,
          description: 'Opérations de caisse',
          badge: pendingPaymentsCount,
          children: [
            { id: 'caisse_dashboard', label: 'Tableau de bord' },
            { id: 'caisse_new_payment', label: 'Nouvelle encaissements', badge: pendingPaymentsCount },
            { id: 'caisse_payments', label: 'Encaissements' },
            { id: 'caisse_cloture', label: 'Clôture' },
          ]
        },
        {
          id: 'factures_group',
          label: 'Factures',
          icon: FileText,
          description: 'Gestion des factures',
          children: [
            { id: 'factures_dashboard', label: 'Tableau de bord' },
            { id: 'factures_new_invoice', label: 'Nouvelle facture' },
            { id: 'factures_all', label: 'Toutes les factures' },
            { id: 'factures_draft', label: 'En attente', badge: pendingPaymentsCount },
            { id: 'factures_paid', label: 'Encaissées' },
            { id: 'factures_unpaid', label: 'Impayées' },
            { id: 'factures_cancelled', label: 'Annulées' },
          ]
        },
        {
          id: 'caisse_facture_group',
          label: 'Caisse & Facture',
          icon: CreditCard,
          description: 'Accès polyvalent caisse/facture',
          badge: pendingPaymentsCount,
          children: [
            { id: 'caisse_facture_dashboard', label: 'Tableau de bord' },
            { id: 'caisse_facture_new_payment', label: 'Nouvelle encaissements', badge: pendingPaymentsCount },
            { id: 'caisse_facture_new_invoice', label: 'Nouvelle facture' },
            { id: 'caisse_facture_all_invoices', label: 'Toutes les factures' },
            { id: 'caisse_facture_all_payments', label: 'Toutes les Encaissements' },
            { id: 'caisse_facture_draft', label: 'En attente', badge: pendingPaymentsCount },
            { id: 'caisse_facture_paid', label: 'Encaissées' },
            { id: 'caisse_facture_unpaid', label: 'Impayées' },
            { id: 'caisse_facture_cancelled', label: 'Annulées' },
            { id: 'caisse_facture_cloture', label: 'Clôture' },
          ]
        },
      ]
    },
    {
      title: 'MÉDICAL',
      icon: Stethoscope,
      items: [
        {
          id: 'infirmier_group',
          label: 'Infirmier',
          icon: Activity,
          description: 'Espace infirmier',
          children: [
            { id: 'infirmier_dashboard', label: 'Tableau de bord' },
            { id: 'infirmier_queue', label: 'Patients en attente' },
            { id: 'infirmier_vitals', label: 'Triage & Constantes' },
            { id: 'infirmier_prescriptions', label: 'Prescriptions Infirmières' },
            { id: 'infirmier_referred', label: 'Patients Référés / Orientés' },
            { id: 'infirmier_care', label: 'Actes & Soins Infirmiers' },
          ]
        },
        {
          id: 'medecin_group',
          label: 'Médecin',
          icon: UserCheck,
          description: 'Espace médecin',
          children: [
            { id: 'medecin_dashboard', label: 'Tableau de bord' },
            { id: 'medecin_queue', label: 'Patients en attente' },
            { id: 'medecin_consultations', label: 'Consultations' },
            { id: 'medecin_dossiers', label: 'Dossiers médicaux' },
            { id: 'medecin_prescriptions', label: 'Prescriptions' },
          ]
        },
        {
          id: 'specialiste_group',
          label: 'Médecin spécialiste',
          icon: ShieldCheck,
          description: 'Espace spécialiste',
          children: [
            { id: 'specialiste_dashboard', label: 'Tableau de bord' },
            { id: 'specialiste_referred', label: 'Patients orientés' },
            { id: 'specialiste_consultations', label: 'Consultations' },
            { id: 'specialiste_followup', label: 'Suivi' },
            { id: 'specialiste_patients', label: 'Patients' },
            { id: 'specialiste_prescriptions', label: 'Prescriptions' },
          ]
        },
      ]
    },
    {
      title: 'EXAMENS',
      icon: Microscope,
      items: [
        {
          id: 'labo_group',
          label: 'Laboratoire',
          icon: FlaskConical,
          description: 'Analyses médicales',
          children: [
            { id: 'labo_dashboard', label: 'Tableau de bord' },
            { id: 'labo_queue', label: 'Patients en attente' },
            { id: 'labo_sampling', label: 'Prélèvements' },
            { id: 'labo_in_progress', label: 'Examens en cours' },
            { id: 'labo_results', label: 'Résultats' },
            { id: 'labo_validation', label: 'Validation' },
            { id: 'labo_catalog', label: 'Catalogue des examens' },
          ]
        },
        {
          id: 'imagerie_group',
          label: 'Imagerie',
          icon: Microscope,
          description: 'Radiologie & PACS',
          children: [
            { id: 'imagerie_dashboard', label: 'Tableau de bord' },
            { id: 'imagerie_queue', label: 'Patients en attente' },
            { id: 'imagerie_scheduled', label: 'Examens programmés' },
            { id: 'imagerie_completed', label: 'Examens réalisés' },
            { id: 'imagerie_reports', label: 'Comptes rendus' },
            { id: 'imagerie_validation', label: 'Validation' },
            { id: 'imagerie_prescriptions', label: 'Prescriptions d’examens' },
          ]
        },
      ]
    },
    {
      title: 'HOSPITALISATION',
      icon: Bed,
      requiredModule: 'hospitalisation_module',
      items: [
        { id: 'hospit_dashboard', label: 'Tableau de bord', icon: BarChart3, description: 'Synthèse d\'hospitalisation' },
        { id: 'hospit_admissions', label: 'Admissions', icon: Users, description: 'Entrées d\'hospitalisation' },
        { id: 'hospit_patients', label: 'Patients hospitalisés', icon: Users, description: 'Liste des patients alités' },
        { id: 'hospit_beds', label: 'Gestion des lits', icon: Bed, description: 'Attribution & état des lits' },
        { id: 'hospit_transfers', label: 'Transferts de patients', icon: ArrowLeftRight, description: 'Mouvements & transferts de lits' },
        { id: 'hospit_monitoring', label: 'Suivi des séjours', icon: Activity, description: 'Dossiers & soins d\'hospitalisation' },
        { id: 'hospit_discharges', label: 'Sorties', icon: CheckCircle2, description: 'Sorties d\'hospitalisation' },
      ]
    },
    {
      title: 'ADMINISTRATION',
      icon: Settings,
      requiredModule: 'admin_module',
      items: [
        { id: 'admin_dashboard', label: 'Tableau de bord', icon: BarChart3, description: 'Pilotage administratif' },
        { id: 'admin_users', label: 'Utilisateurs', icon: Users, description: 'Gestion personnel' },
        { id: 'admin_roles', label: 'Rôles & profils', icon: ShieldCheck, description: 'Rôles & profils' },
        { id: 'admin_permissions', label: 'Permissions', icon: Lock, description: 'Matrice des permissions' },
        { id: 'admin_company', label: 'Établissement', icon: Settings, description: 'Infos structure' },
        { id: 'admin_pricing', label: 'Tarifs & prestations', icon: CreditCard, description: 'Catalogue tarifs' },
        { id: 'admin_medical_settings', label: 'Paramètres médicaux', icon: Stethoscope, description: 'Paramètres médicaux' },
        { id: 'admin_reports', label: 'Rapports', icon: FileText, description: 'Rapports d\'activité' },
        { id: 'admin_audit', label: 'Journal & sécurité', icon: ShieldCheck, description: 'Logs audit' },
      ]
    }
  ];

  // Modified: check if view is allowed OR if any child is allowed
  const isViewAllowed = (id: string) => {
    return allowedViews.includes(id as AppView);
  };

  const visibleCategories = categories
    .filter((cat) => !cat.requiredModule || isViewAllowed(cat.requiredModule))
    .map((cat) => ({
      ...cat,
      items: cat.items
        .map((item) => {
          if (item.children) {
            const visibleChildren = item.children.filter((child) => isViewAllowed(child.id as string));
            return {
              ...item,
              children: visibleChildren,
            };
          }
          return item;
        })
        .filter((item) => isViewAllowed(item.id as string) || (item.children && item.children.length > 0)),
    }))
    .filter((cat) => cat.items.length > 0);

  const getActiveItemName = () => {
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.id === currentView) return item.label;
        if (item.children) {
          const childMatch = item.children.find(c => c.id === currentView);
          if (childMatch) return `${item.label} > ${childMatch.label}`;
        }
      }
    }
    return 'Laboratoire Médical';
  };

  const getRoleBadgeStyle = (role?: string) => {
    return 'bg-slate-800 text-slate-100 border border-slate-700';
  };

  const canInvoice = allowedViews.includes('invoices');
  const canManageLab = allowedViews.includes('lab_results');

  return (
    <>
      {/* 1. Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Left Enterprise Sidebar with Dynamic Theming */}
      <aside
        style={{
          backgroundColor: theme.sidebarBg,
          borderColor: theme.sidebarBorder,
          color: theme.sidebarText,
        }}
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col border-r transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header: Logo & Branding */}
        <div 
          style={{ borderColor: theme.sidebarBorder }}
          className={`p-4 border-b flex items-center justify-between ${theme.isDarkSidebar ? 'bg-black/20' : 'bg-slate-50/50'}`}
        >
          <div 
            onClick={handleGoHome}
            className="flex items-center space-x-3 overflow-hidden cursor-pointer group"
            title="Retour à l'accueil"
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-9 h-9 object-contain rounded-xl bg-white p-1 shrink-0 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                style={{ backgroundColor: theme.primary }}
                className="w-9 h-9 rounded-xl text-white font-black flex items-center justify-center text-sm shadow-md shrink-0 group-hover:scale-105 transition-transform"
              >
                {company.name ? company.name.charAt(0).toUpperCase() : 'L'}
              </div>
            )}
            <div className="overflow-hidden">
              <h1 
                style={{ color: theme.sidebarText }}
                className="font-black text-sm tracking-tight truncate group-hover:underline"
              >
                {company.name || 'Laboratoire Médical'}
              </h1>
              <p 
                style={{ color: theme.sidebarTextMuted }}
                className="text-[10px] font-bold uppercase tracking-tight truncate"
              >
                {company.slogan || 'BIOLOGIE MÉDICALE'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg opacity-70 hover:opacity-100 transition"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Notice Box */}
        <div 
          style={{ borderColor: theme.sidebarBorder }}
          className={`px-4 py-2.5 border-b ${theme.isDarkSidebar ? 'bg-black/10' : 'bg-slate-50'}`}
        >
          <div className="flex items-center justify-between">
            <span 
              style={{ color: theme.sidebarTextMuted }}
              className="text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-500 inline" />
              <span>Rôle &amp; Habilitation</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(
                currentUser?.role
              )}`}
            >
              {currentUser?.role || 'Utilisateur'}
            </span>
          </div>
          <div 
            style={{ color: theme.sidebarText }}
            className="mt-0.5 text-xs font-bold truncate"
          >
            {currentUser?.name || 'Session active'}
          </div>
          <div 
            style={{ color: theme.sidebarTextMuted }}
            className="text-[10px] flex items-center space-x-1 mt-0.5 font-medium"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">
              {allowedViews.length} module{allowedViews.length > 1 ? 's' : ''} autorisé{allowedViews.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Session requirement banner for billers / cashiers */}
          {isSessionRequiredProfile && (
            <div className={`mt-2 p-2 rounded-xl border text-[11px] font-medium transition-all ${
              hasActiveSession 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold">
                {hasActiveSession ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Vacation Active Déverrouillée</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Session Non Ouverte</span>
                  </>
                )}
              </div>
              <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                {hasActiveSession 
                  ? "Vous pouvez opérer sur tous vos menus autorisés."
                  : "Ouvrez votre session journalière pour débloquer les autres menus."}
              </p>
            </div>
          )}
          
          <div 
            style={{ 
              backgroundColor: theme.isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
              borderColor: theme.sidebarBorder,
            }}
            className="mt-2 p-2 rounded border shadow-xs"
          >
            <div 
              style={{ color: theme.sidebarTextMuted }}
              className="text-[9px] uppercase font-black tracking-widest mb-1"
            >
              Ma Mission
            </div>
            <div 
              style={{ color: theme.sidebarText }}
              className="text-[10px] font-bold leading-tight italic"
            >
              {getUserMissionDescription(currentUser)}
            </div>
          </div>
        </div>

        {/* Vertical Structured Navigation List (Clean Sidebar) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {visibleCategories.map((cat, idx) => {
            const isCategoryExpanded = expandedMenus[cat.title];
            const CategoryIcon = cat.icon;

            return (
              <div key={`cat-${cat.title}-${idx}`} className="space-y-1">
                <button
                  onClick={() => toggleMenu(cat.title)}
                  style={{ color: theme.sidebarText }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:bg-black/5 group`}
                >
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                    <span>{cat.title}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCategoryExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryExpanded && (
                  <div className="space-y-0.5 mt-1 ml-1 border-l border-slate-200/50 pl-1">
                    {cat.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      const isItemLockedBySession = isLockedOutWithoutSession && item.id !== 'caisse_sessions' && !item.children;
                      const hasChildren = item.children && item.children.length > 0;
                      const isGroupExpanded = expandedMenus[item.id as string];

                      return (
                        <div key={`${cat.title}-${item.id}-${itemIdx}`} className="space-y-0.5">
                          <button
                            id={`nav-${item.id}`}
                            onClick={() => {
                              if (hasChildren) {
                                toggleMenu(item.id as string);
                                return;
                              }
                              if (isItemLockedBySession) {
                                if (showToast) {
                                  showToast("Ouverture de vacation requise pour déverrouiller vos opérations de facturation.", 'warning');
                                }
                                setCurrentView('caisse_sessions');
                                setSidebarOpen(false);
                                return;
                              }
                              if (item.onClick) {
                                item.onClick();
                              } else {
                                setCurrentView(item.id as AppView);
                                setSidebarOpen(false);
                              }
                            }}
                            style={
                              isActive
                                ? { 
                                    backgroundColor: theme.activeNavBg,
                                    color: theme.activeNavText,
                                    borderColor: theme.sidebarBorder,
                                  }
                                : {
                                    color: theme.sidebarText,
                                  }
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                              isActive
                                ? 'font-bold border shadow-xs'
                                : isItemLockedBySession
                                ? 'opacity-40 cursor-not-allowed'
                                : theme.isDarkSidebar
                                ? 'hover:bg-white/10'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`} />}
                              <span className="truncate">{item.label}</span>
                            </div>
                            {hasChildren ? (
                              <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isGroupExpanded ? 'rotate-180' : ''}`} />
                            ) : item.badge !== undefined && item.badge > 0 ? (
                              <span
                                style={{
                                  backgroundColor: isActive ? theme.primary : theme.badgeBg,
                                  color: isActive ? '#ffffff' : theme.sidebarText,
                                }}
                                className="text-[10px] px-1.5 py-0.2 rounded font-extrabold shrink-0 ml-2"
                              >
                                {item.badge}
                              </span>
                            ) : null}
                          </button>

                          {hasChildren && isGroupExpanded && (
                            <div className="ml-6 space-y-0.5 mt-0.5 border-l border-slate-200/30 pl-2">
                              {item.children?.map((child, childIdx) => {
                                // Add a unique identifier based on label to prevent active state overlap
                                // If a child has an onClick, it shouldn't be highlighted as active just because its parent 'id' matches the current view, UNLESS we specifically track sub-views. For now, let's keep it simple: it's active if it doesn't have a special onClick, OR if we want to visually unify, we can just highlight the main one.
                                // Actually, let's use the label to distinguish.
                                // But since we don't have sub-routing, all of them route to `child.id` (e.g. 'invoices').
                                // We'll make only the first one (or the one without specific filters) show as active, or we just let them act as buttons without staying "active".
                                const isChildActive = currentView === child.id;
                                if (!allowedViews.includes(child.id as AppView)) return null;

                                return (
                                  <button
                                    key={`child-${item.id}-${child.id}-${childIdx}-${child.label.replace(/\s+/g, '')}`}
                                    onClick={() => {
                                      setCurrentView(child.id as AppView);
                                      if (child.onClick) {
                                        child.onClick();
                                      }
                                      setSidebarOpen(false);
                                    }}
                                    style={
                                      isChildActive
                                        ? { 
                                            backgroundColor: theme.activeNavBg,
                                            color: theme.activeNavText,
                                            borderColor: theme.sidebarBorder,
                                          }
                                        : { 
                                            color: theme.sidebarText 
                                          }
                                    }
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                                      isChildActive 
                                        ? 'font-bold border shadow-xs' 
                                        : theme.isDarkSidebar
                                        ? 'hover:bg-white/10 opacity-85 hover:opacity-100'
                                        : 'hover:bg-slate-100 opacity-85 hover:opacity-100'
                                    }`}
                                  >
                                    <span>{child.label}</span>
                                    {child.badge !== undefined && child.badge > 0 && (
                                      <span
                                        style={{
                                          backgroundColor: '#f43f5e',
                                          color: '#ffffff',
                                        }}
                                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white ml-2 shrink-0 leading-none"
                                      >
                                        {child.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Role access limit notice */}
          {allowedViews.length < 8 && (
            <div 
              style={{
                backgroundColor: theme.isDarkSidebar ? 'rgba(0, 0, 0, 0.3)' : '#f8fafc',
                borderColor: theme.sidebarBorder,
              }}
              className="mt-4 p-3 rounded-xl border text-[11px] space-y-1"
            >
              <div 
                style={{ color: theme.sidebarText }}
                className="flex items-center space-x-1 font-bold"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Accès spécifique à votre profil</span>
              </div>
              <p 
                style={{ color: theme.sidebarTextMuted }}
                className="text-[10px] leading-relaxed"
              >
                Vous êtes connecté en tant que <strong>{currentUser?.role}</strong>. Les modules hors de votre périmètre d'action sont sécurisés et masqués.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer: User Switcher & Logout */}
        <div 
          style={{ 
            borderColor: theme.sidebarBorder,
            backgroundColor: theme.isDarkSidebar ? 'rgba(0, 0, 0, 0.2)' : '#f8fafc',
          }}
          className="p-3 border-t relative"
        >
          <button
            id="sidebar-user-menu"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition text-left shadow-sm"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div
                className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 border border-slate-700 shadow-sm"
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-slate-900 truncate">
                  {currentUser?.name || 'Utilisateur'}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">
                  {currentUser?.role || 'Opérateur'}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* User switcher popup */}
          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute left-3 right-3 bottom-full mb-2 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-extrabold text-slate-900 text-xs">
                    {currentUser?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {currentUser?.email}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] border ${getRoleBadgeStyle(
                        currentUser?.role
                      )}`}
                    >
                      {currentUser?.role || 'Opérateur'}
                    </span>
                  </div>
                </div>

                <div className="py-1 max-h-56 overflow-y-auto">
                  <div className="px-4 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Changer de profil utilisateur
                  </div>
                  {users.map((u, uIdx) => (
                    <button
                      key={`sidebar-user-${u.id}-${u.login || uIdx}`}
                      onClick={() => {
                        onSelectUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                        currentUser?.id === u.id
                          ? 'bg-slate-100 font-bold text-slate-900'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-semibold">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.role || u.login}
                        </div>
                      </div>
                      {currentUser?.id === u.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 3. Top Status Header for Main Content Area */}
      <header 
        style={{ borderTop: `3px solid ${theme.primary}` }}
        className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs lg:pl-64 transition-all"
      >
        {/* Global Flash Info Ticker rendered at the absolute top of the header ("tout en haut") */}
        <FlashInfoTicker company={company} currentUser={currentUser} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger & Active view title */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-toggle-sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden transition"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-none">
                  {getActiveItemName()}
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {company.currency_symbol || 'FCFA'}
                </span>
              </div>
            </div>
          </div>

          {/* Central Barcode & Dossier Quick Lookup Scanner + Omnibox Trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 items-center space-x-2">
            {onSearchNDM && (
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Scanner N° Dossier (NDM)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        onSearchNDM(decodeScannerInput(val));
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 text-xs font-bold text-slate-900 placeholder:text-slate-400 rounded-lg transition shadow-inner"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-[9px] font-mono font-black uppercase text-slate-400 bg-slate-200/50 border border-slate-300 px-1.5 py-0.5 rounded leading-none">
                    ENTRÉE
                  </span>
                </div>
              </div>
            )}

            {/* Omnibox Global Search Button (Ctrl+K) */}
            <button
              id="btn-open-omnibox"
              onClick={() => setIsOmniboxOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs"
              title="Recherche universelle et raccourcis rapides (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline text-[11px]">Recherche rapide</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white border border-slate-300 rounded shadow-2xs text-slate-600">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Quick actions and user switcher button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Omnibox button */}
            <button
              onClick={() => setIsOmniboxOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Rechercher (Ctrl + K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Profile Pill Button in Top Bar */}
            <div className="relative">
              <button
                id="top-user-pill"
                onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition text-xs font-semibold text-slate-800 border border-slate-200 shrink-0"
              >
                <div
                  style={{ backgroundColor: theme.primary }}
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[10px]"
                >
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline font-bold truncate max-w-[120px]">
                  {currentUser?.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showQuickActionMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowQuickActionMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-extrabold text-slate-900">{currentUser?.name}</div>
                      <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                      <div className="mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(
                            currentUser?.role
                          )}`}
                        >
                          {currentUser?.role || 'Opérateur'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 max-h-52 overflow-y-auto">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Changer de profil
                      </div>
                      {users.map((u, uIdx) => (
                        <button
                          key={`topbar-user-${u.id}-${u.login || uIdx}`}
                          onClick={() => {
                            onSelectUser(u);
                            setShowQuickActionMenu(false);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-slate-50 transition ${
                            currentUser?.id === u.id
                              ? 'bg-slate-100 font-bold text-slate-900 border-l-2 border-slate-900'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate font-semibold text-slate-800">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {u.role || u.login}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <a
                        href="/api/database/dump"
                        download
                        onClick={() => setShowQuickActionMenu(false)}
                        className="w-full text-left px-4 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-bold transition"
                        title="Télécharger une copie intégrale de la base de données au format JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-600" />
                        <span>Dump Base de Données (JSON)</span>
                      </a>
                      <a
                        href="/api/database/dump-sql"
                        download
                        onClick={() => setShowQuickActionMenu(false)}
                        className="w-full text-left px-4 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-bold transition"
                        title="Télécharger le script SQL d'insertion pour MariaDB / MySQL"
                      >
                        <Database className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dump Base de Données (SQL)</span>
                      </a>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setShowQuickActionMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 4. Global Omnibox Search Modal (Ctrl + K) */}
      <OmniboxModal
        isOpen={isOmniboxOpen}
        onClose={() => setIsOmniboxOpen(false)}
        partners={partners}
        moves={moves}
        currentUser={currentUser}
        company={company}
        onNavigateToView={(view) => {
          setCurrentView(view);
          setSidebarOpen(false);
        }}
        onSelectPatient={onSelectPatient}
        onSelectMove={onSelectMove}
        onSearchNDM={onSearchNDM}
      />
    </>
  );
};
