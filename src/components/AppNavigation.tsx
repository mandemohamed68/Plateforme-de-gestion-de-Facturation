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
  Baby,
  Sliders,
  Compass,
  Zap,
  Bell,
} from 'lucide-react';
import { ResUser, CompanySettings, ResGroup, AppView, ResPartner, AccountMove, AppNotification } from '../types';
import { getAppTheme } from '../lib/theme';
import { getUserBillingProfile, getUserMissionDescription } from '../lib/formatters';
import { decodeScannerInput } from '../lib/scannerDecoder';
import { getAllowedViews, isServiceActive as checkServiceActive, isViewServiceActive, getServiceIdForView } from '../utils/navigation';
import { isSupervisorOrAdmin as isSupervisorOrAdminCheck } from '../utils/caisseSessionService';
import { FlashInfoTicker } from './FlashInfoTicker';
import { OmniboxModal } from './OmniboxModal';
import { InAppNotificationCenter } from './InAppNotificationCenter';

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
  appNotifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
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
  appNotifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onClearAllNotifications = () => {},
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
    'PÉDIATRIE': true,
    'MATERNITÉ': true,
    'EXAMENS': true,
    'PHARMACIE & STOCK': true,
    'HOSPITALISATION': true,
    'ADMINISTRATION': true,
    'superviseur_group': true,
    'caisse_group': true,
    'factures_group': true,
    'caisse_facture_group': true,
    'infirmier_group': true,
    'medecin_group': true,
    'specialiste_group': true,
    'pediatrie_group': true,
    'maternite_group': true,
    'labo_group': true,
    'imagerie_group': true,
    'pharmacy_group': true,
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

  // Helper to verify if a modular service is activated in hospital settings (default = true for all)
  const isServiceActive = (serviceId: string): boolean => {
    return checkServiceActive(serviceId, company);
  };

  const isSupervisorOrAdmin =
    isSupervisorOrAdminCheck(currentUser) ||
    loginLower === 'mandemohamed68@gmail.com' ||
    loginLower.includes('admin') ||
    loginLower.includes('supervis') ||
    roleLower.includes('admin') ||
    roleLower.includes('supervis') ||
    roleLower.includes('direct') ||
    roleLower.includes('universel') ||
    (currentUser?.group_ids || []).includes(1) ||
    (currentUser?.group_ids || []).includes(5);

  // Seuls les profils caisse et caisse-facture (polyvalents) doivent ouvrir/fermer une session de caisse
  const isSessionRequiredProfile =
    !isSupervisorOrAdmin && (
      loginLower === 'caissier' ||
      loginLower === 'caisse_facture' ||
      roleLower.includes('caiss') ||
      roleLower.includes('polyvalent') ||
      profile === 'caisse' ||
      profile === 'facture_caisse'
    );

  const isLockedOutWithoutSession = isSessionRequiredProfile && !hasActiveSession;

  const handleGoHome = () => {
    if (isSessionRequiredProfile) {
      setCurrentView('caisse_sessions');
    } else {
      setCurrentView('dashboard');
    }
    setSidebarOpen(false);
  };

  const unreadNotifBadge = appNotifications.filter(n => !n.read).length;
  const pendingPharmNotifsCount = appNotifications.filter(n => n.category === 'pharmacy' && !n.read).length || 2;
  const pendingLabNotifsCount = appNotifications.filter(n => n.category === 'lab' && !n.read).length || 3;
  const pendingUrgencyNotifsCount = appNotifications.filter(n => n.category === 'urgency' && !n.read).length || 2;
  const pharmacyBadgeTotal = pendingPharmNotifsCount + 3;

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
          description: 'Suivi de l\'arrivée à la sortie du patient',
          badge: 3
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
            { id: 'caisse_new_payment', label: 'Nouvel encaissement', badge: pendingPaymentsCount },
            { id: 'caisse_payments', label: 'Historique des encaissements' },
            { id: 'caisse_cloture', label: 'Clôture de caisse' },
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
            { id: 'factures_draft', label: 'En attente de paiement', badge: pendingPaymentsCount },
            { id: 'factures_paid', label: 'Factures encaissées' },
            { id: 'factures_unpaid', label: 'Factures impayées' },
            { id: 'factures_cancelled', label: 'Factures annulées' },
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
          badge: pendingUrgencyNotifsCount,
          children: [
            { id: 'infirmier_dashboard', label: 'Tableau de bord' },
            { id: 'infirmier_queue', label: 'Patients en attente', badge: pendingUrgencyNotifsCount },
            { id: 'patient_dossiers', label: 'Dossiers & Antécédents' },
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
          badge: 3,
          children: [
            { id: 'medecin_dashboard', label: 'Tableau de bord' },
            { id: 'medecin_queue', label: 'Patients en attente', badge: 3 },
            { id: 'medecin_consultations', label: 'Consultations' },
            { id: 'patient_dossiers', label: 'Dossiers médicaux (DPI)' },
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
            { id: 'patient_dossiers', label: 'Dossiers médicaux (DPI)' },
            { id: 'specialiste_followup', label: 'Suivi' },
            { id: 'specialiste_patients', label: 'Patients' },
            { id: 'specialiste_prescriptions', label: 'Prescriptions' },
          ]
        },
      ]
    },
    {
      title: 'PÉDIATRIE',
      icon: Baby,
      items: [
        {
          id: 'pediatrie_group',
          label: 'Pôle Pédiatrique',
          icon: Baby,
          description: 'Santé infantile et néonatalogie',
          children: [
            { id: 'pediatrie_dashboard', label: 'Tableau de bord' },
            { id: 'pediatrie_queue', label: 'File d\'attente pédiatrique' },
            { id: 'pediatrie_consultations', label: 'Consultations Pédiatriques' },
            { id: 'patient_dossiers', label: 'Dossiers Pédiatriques' },
            { id: 'pediatrie_vaccination', label: 'Vaccination & PEV' },
            { id: 'pediatrie_croissance', label: 'Courbes de Croissance OMS' },
          ]
        }
      ]
    },
    {
      title: 'MATERNITÉ',
      icon: Heart,
      items: [
        {
          id: 'maternite_group',
          label: 'Pôle Maternité',
          icon: Heart,
          description: 'Obstétrique et santé de la femme',
          children: [
            { id: 'maternite_dashboard', label: 'Tableau de bord' },
            { id: 'maternite_cpn', label: 'Consultations Prénatales (CPN)' },
            { id: 'patient_dossiers', label: 'Dossiers Obstétriques' },
            { id: 'maternite_accouchements', label: 'Registre des Accouchements' },
            { id: 'maternite_partogramme', label: 'Partogramme & Travail' },
            { id: 'maternite_postpartum', label: 'Suivi Post-Partum' },
          ]
        }
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
          badge: pendingLabNotifsCount,
          children: [
            { id: 'labo_dashboard', label: 'Tableau de bord' },
            { id: 'labo_queue', label: 'Patients en attente', badge: pendingLabNotifsCount },
            { id: 'labo_sampling', label: 'Prélèvements', badge: 2 },
            { id: 'labo_in_progress', label: 'Examens en cours' },
            { id: 'labo_results', label: 'Résultats' },
            { id: 'labo_validation', label: 'Validation', badge: 1 },
            { id: 'patient_dossiers', label: 'Dossiers & Antécédents LIMS' },
          ]
        },
        {
          id: 'imagerie_group',
          label: 'Imagerie',
          icon: Microscope,
          description: 'Radiologie & PACS',
          badge: 2,
          children: [
            { id: 'imagerie_dashboard', label: 'Tableau de bord' },
            { id: 'imagerie_queue', label: 'Patients en attente', badge: 2 },
            { id: 'imagerie_scheduled', label: 'Examens programmés' },
            { id: 'imagerie_completed', label: 'Examens réalisés' },
            { id: 'imagerie_reports', label: 'Comptes rendus' },
            { id: 'imagerie_validation', label: 'Validation' },
            { id: 'patient_dossiers', label: 'Dossiers & Clichés' },
            { id: 'imagerie_prescriptions', label: 'Prescriptions d’examens' },
          ]
        },
      ]
    },
    {
      title: 'PHARMACIE & STOCK',
      icon: Pill,
      items: [
        {
          id: 'pharmacy_group',
          label: 'Pharmacie Hospitalière',
          icon: FlaskConical,
          description: 'Dispensation, ordonnances & stock',
          badge: pharmacyBadgeTotal,
          children: [
            { id: 'pharmacy_dispensing', label: '1. Ordonnances & Dispensation', badge: pendingPharmNotifsCount },
            { id: 'patient_dossiers', label: '2. Dossiers & Historique Médicaments' },
            { id: 'pharmacy_stock', label: '3. Stock & Catalogue Médicaments', badge: 2 },
            { id: 'pharmacy_orders', label: '4. Commandes & Réquisitions', badge: 1 },
            { id: 'pharmacy_expired', label: '5. Périmés & Alertes', badge: 1 },
            { id: 'pharmacy_narcotics', label: '6. Registre des Stupéfiants' },
            { id: 'pharmacy_sales', label: '7. Ventes Directes Comptoir' },
            { id: 'pharmacy_settings', label: '8. Configuration Admin' },
          ]
        }
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
        { id: 'patient_dossiers', label: 'Dossiers Médicaux Hospitalisés', icon: FolderOpen, description: 'Dossiers cliniques des patients' },
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
        { id: 'alert_settings', label: 'Gestion des Alertes', icon: Bell, description: 'Paramètres & canaux de notification' },
        { id: 'flash_announcements', label: 'Annonces & Flash Info', icon: Megaphone, description: 'Bandeaux défilants & messages d\'urgence' },
        { id: 'admin_services', label: 'Modules & Services', icon: Sliders, description: 'Activation / désactivation des modules' },
        { id: 'admin_users', label: 'Utilisateurs', icon: Users, description: 'Gestion personnel' },
        { id: 'admin_roles', label: 'Rôles & profils', icon: ShieldCheck, description: 'Rôles & profils' },
        { id: 'admin_permissions', label: 'Permissions (RBAC)', icon: Lock, description: 'Matrice dynamique des droits' },
        { id: 'admin_company', label: 'Établissement', icon: Settings, description: 'Infos structure' },
        { id: 'admin_pricing', label: 'Tarifs & prestations', icon: CreditCard, description: 'Catalogue tarifs' },
        { id: 'labo_catalog', label: 'Catalogue des examens', icon: FlaskConical, description: 'Nomenclature, cotations & analyses LIMS' },
        { id: 'scenarios_s01_s50', label: 'Simulateur Scénarios (S01-S50)', icon: ScrollText, description: 'Validation des flux & scénarios hospitaliers' },
        { id: 'admin_medical_settings', label: 'Paramètres cliniques', icon: Stethoscope, description: 'Unités de soins & seuils vitaux' },
        { id: 'admin_reports', label: 'Rapports', icon: FileText, description: 'Rapports d\'activité' },
        { id: 'admin_audit', label: 'Journal & sécurité', icon: ShieldCheck, description: 'Logs audit' },
      ]
    }
  ];

  // Check if view is allowed OR if any child is allowed
  const isViewAllowed = (id: string) => {
    return allowedViews.includes(id as AppView);
  };

  const isCategoryModuleActive = (title: string): boolean => {
    if (title === 'PÉDIATRIE') return isServiceActive('pediatrie');
    if (title === 'MATERNITÉ') return isServiceActive('maternite');
    if (title === 'HOSPITALISATION') return isServiceActive('hospitalisation');
    if (title === 'EXAMENS') return isServiceActive('laboratoire') || isServiceActive('imagerie');
    if (title === 'PHARMACIE & STOCK') return isServiceActive('pharmacie');
    if (title === 'FACTURATION') return isServiceActive('caisse_facturation');
    if (title === 'MÉDICAL') return isServiceActive('medecine_generale') || isServiceActive('specialiste') || isServiceActive('urgences');
    return true;
  };

  const visibleCategories = categories
    .filter((cat) => isCategoryModuleActive(cat.title))
    .filter((cat) => !cat.requiredModule || isViewAllowed(cat.requiredModule))
    .map((cat) => ({
      ...cat,
      items: cat.items
        .filter((item) => isViewServiceActive(item.id as string, company))
        .map((item) => {
          if (item.children) {
            const visibleChildren = item.children
              .filter((child) => isViewAllowed(child.id as string))
              .filter((child) => isViewServiceActive(child.id as string, company));
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

        {/* Current User Profile & Role Card (Clean 100% Human Design) */}
        <div 
          style={{ borderColor: theme.sidebarBorder }}
          className={`p-3 border-b space-y-2.5 ${theme.isDarkSidebar ? 'bg-white/5' : 'bg-slate-50/70'}`}
        >
          {/* User Info Row */}
          <div className="flex items-center space-x-2.5">
            <div 
              style={{ backgroundColor: theme.primary }}
              className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 tracking-wider"
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div 
                  style={{ color: theme.sidebarText }}
                  className="text-xs font-bold truncate leading-tight"
                >
                  {currentUser?.name || 'Session active'}
                </div>
                <span
                  style={{
                    backgroundColor: theme.isDarkSidebar ? 'rgba(255, 255, 255, 0.12)' : '#f1f5f9',
                    color: theme.isDarkSidebar ? '#f8fafc' : '#334155',
                    borderColor: theme.sidebarBorder
                  }}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0"
                >
                  {currentUser?.role?.toLowerCase().includes('super') ? 'Super Admin' : (currentUser?.role || 'Utilisateur')}
                </span>
              </div>
              <div 
                style={{ color: theme.sidebarTextMuted }}
                className="text-[10px] flex items-center space-x-1 mt-0.5"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate font-medium">
                  {allowedViews.length} module{allowedViews.length > 1 ? 's' : ''} autorisé{allowedViews.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Session requirement banner for billers / cashiers */}
          {isSessionRequiredProfile && (
            <div className={`p-2 rounded-lg border text-[11px] font-medium transition-all ${
              hasActiveSession 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold">
                {hasActiveSession ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Vacation Active Déverrouillée</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Session Non Ouverte</span>
                  </>
                )}
              </div>
              <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                {hasActiveSession 
                  ? "Opérations autorisées sur vos menus."
                  : "Ouvrez votre session journalière pour débloquer les menus."}
              </p>
            </div>
          )}
          
          {/* Mission Card */}
          <div 
            style={{ 
              backgroundColor: theme.isDarkSidebar ? 'rgba(0, 0, 0, 0.2)' : '#ffffff',
              borderColor: theme.sidebarBorder,
            }}
            className="p-2.5 rounded-lg border shadow-xs"
          >
            <div 
              style={{ color: theme.sidebarTextMuted }}
              className="text-[9px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1"
            >
              <Compass className="w-2.5 h-2.5 text-slate-400" />
              <span>Mission Active</span>
            </div>
            <div 
              style={{ color: theme.sidebarText }}
              className="text-[10.5px] font-normal leading-relaxed"
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

            const renderSafeIcon = (IconInput: any, iconClasses: string) => {
              if (!IconInput) return null;
              if (React.isValidElement(IconInput)) return IconInput;
              if (typeof IconInput === 'function') {
                const Comp = IconInput;
                return <Comp className={iconClasses} />;
              }
              return null;
            };

            return (
              <div key={`cat-${cat.title}-${idx}`} className="space-y-1">
                <button
                  onClick={() => toggleMenu(cat.title)}
                  style={{ color: theme.sidebarText }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:bg-black/5 group`}
                >
                  <div className="flex items-center space-x-2">
                    {renderSafeIcon(CategoryIcon, "w-3.5 h-3.5 opacity-70 group-hover:opacity-100")}
                    <span>{cat.title}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCategoryExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryExpanded && (
                  <div className="space-y-0.5 mt-1 ml-1 border-l border-slate-200/50 pl-1">
                    {cat.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      const hasChildren = Boolean(item.children && item.children.length > 0);
                      const isItemLockedBySession =
                        !hasChildren &&
                        ((isLockedOutWithoutSession && item.id !== 'caisse_sessions' && item.id !== 'caisse_facture_sessions') ||
                        (!isSupervisorOrAdmin && !hasActiveSession && (item.id === 'caisse_group' || item.id === 'caisse_facture_group')));
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
                                  showToast("Ouverture de vacation requise pour déverrouiller vos opérations.", 'warning');
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
                              {renderSafeIcon(Icon, `w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`)}
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
                                const isChildActive = currentView === child.id;
                                if (!allowedViews.includes(child.id as AppView)) return null;

                                const isSessionOp = child.id === 'caisse_sessions' || child.id === 'caisse_facture_sessions';
                                const isChildLockedBySession =
                                  !isSessionOp &&
                                  (isLockedOutWithoutSession ||
                                  (!isSupervisorOrAdmin && !hasActiveSession && (item.id === 'caisse_group' || item.id === 'caisse_facture_group')));

                                return (
                                  <button
                                    key={`child-${item.id}-${child.id}-${childIdx}-${child.label.replace(/\s+/g, '')}`}
                                    onClick={() => {
                                      if (isChildLockedBySession) {
                                        if (showToast) {
                                          showToast("Ouverture de vacation requise pour déverrouiller vos opérations.", 'warning');
                                        }
                                        setCurrentView('caisse_sessions');
                                        setSidebarOpen(false);
                                        return;
                                      }
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
                                        : isChildLockedBySession
                                        ? 'opacity-30 cursor-not-allowed'
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
        <FlashInfoTicker
          company={company}
          currentUser={currentUser}
          onNavigateToView={(v) => setCurrentView(v)}
        />

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

            {/* Interservice Matching & Care Pathway Shortcut */}
            <button
              id="btn-header-patient-journey"
              onClick={() => setCurrentView('patient_journey')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs border ${
                currentView === 'patient_journey'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title="Filière de Soins & Parcours Patient 360°"
            >
              <Compass className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden xl:inline text-[11px]">Parcours 360°</span>
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

            {/* In-App Inter-Service Notification Center */}
            <InAppNotificationCenter
              notifications={appNotifications}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onClearAll={onClearAllNotifications}
              onNavigateToView={(view) => {
                setCurrentView(view);
                setSidebarOpen(false);
              }}
              currentUser={currentUser}
            />

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
