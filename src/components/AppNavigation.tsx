import React, { useState } from 'react';
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
} from 'lucide-react';
import { ResUser, CompanySettings, ResGroup, AppView } from '../types';
import { getAppTheme } from '../lib/theme';
import { getUserBillingProfile } from '../lib/formatters';
import { decodeScannerInput } from '../lib/scannerDecoder';

export type { AppView };

interface NavItemConfig {
  id: AppView | string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description: string;
  isAction?: boolean;
  onClick?: () => void;
}

interface NavCategoryConfig {
  title: string;
  items: NavItemConfig[];
}

/**
 * Returns allowed views based on strict role-based access control (RBAC).
 * - Biologiste / Technicien: Examens & Résultats, Catalogue des analyses, Patients. (NO Facturation, NO Caisse).
 * - Caisse / Réception: Facturation, Règlements, Patients. (NO Schéma SQL, NO Paramètres).
 * - Comptabilité: Dashboard Financier, Facturation, Règlements, Patients, Relances.
 * - Admin / Direction: Accès global.
 */
export function getAllowedViews(user: ResUser | null): AppView[] {
  const getRawViews = (): AppView[] => {
    if (!user) return ['caisse_sessions', 'invoices', 'payments', 'partners'];

    // 1. If user has custom allowed views configured specifically for them (from UsersView custom menu modal)
    if (user.allowed_views && Array.isArray(user.allowed_views) && user.allowed_views.length > 0) {
      return user.allowed_views as AppView[];
    }

    const billingProfile = getUserBillingProfile(user);
    const login = (user.login || '').toLowerCase().trim();
    const role = (user.role || '').toLowerCase().trim();
    const department = (user.department || '').toLowerCase().trim();
    const groupIds = user.group_ids || [];
    const perms = user.permissions || [];

    // 2. Superviseur Caisse & Facturation (Strictly default to 5 modules: Dashboard, Sessions, Factures, Règlements, Patients)
    if (
      role.includes('superviseur') ||
      login === 'superviseur' ||
      billingProfile === 'superviseur' && !role.includes('admin') && !role.includes('directeur')
    ) {
      return ['dashboard', 'caisse_sessions', 'invoices', 'payments', 'partners'];
    }

    // 3. Admin / Directeur / Administrateur -> Accès complet à TOUS les menus
    const isAdmin =
      (login === 'admin' && !role.includes('superviseur')) ||
      (role.includes('directeur') && !role.includes('superviseur')) ||
      (role.includes('admin') && !role.includes('superviseur')) ||
      role.includes('administrateur') ||
      perms.includes('all');

    if (isAdmin) {
      return [
        'dashboard',
        'caisse_sessions',
        'invoices',
        'payments',
        'partners',
        'patient_dossiers',
        'lab_results',
        'lab_sampling',
        'lab_grouped_results',
        'products',
        'users',
        'company',
        'notifications',
        'logs_audit',
        'schema',
      ];
    }

    // 2. Superviseur Caisse & Facturation (Strictement limité aux 5 menus par défaut)
    if (
      billingProfile === 'superviseur' ||
      login === 'superviseur' ||
      role.includes('superviseur')
    ) {
      return ['dashboard', 'caisse_sessions', 'invoices', 'payments', 'partners', 'logs_audit'];
    }

    // 2. Facturier (Établissement factures avec session journalière obligatoire, répertoire patients)
    if (billingProfile === 'facture') {
      return ['caisse_sessions', 'invoices', 'partners'];
    }

    // 3. Caissier (Encaissement paiements seul, pas de création de facture)
    if (billingProfile === 'caisse') {
      return ['caisse_sessions', 'invoices', 'payments'];
    }

    // 4. Facture / Caisse (Polyvalent : Facturation + Caisse)
    if (billingProfile === 'facture_caisse') {
      return ['caisse_sessions', 'invoices', 'payments', 'partners'];
    }

    // 5. Biologiste Médical / Responsable de Laboratoire
    if (
      login === 'dr.toure' ||
      groupIds.includes(5) ||
      role.includes('biologiste') ||
      role.includes('chef de lab') ||
      role.includes('médecin')
    ) {
      return ['lab_results', 'lab_sampling', 'lab_grouped_results', 'products', 'partners', 'notifications', 'logs_audit'];
    }

    // 6. Technicien de Laboratoire / Manipulateur
    if (
      login === 'technicien' ||
      groupIds.includes(6) ||
      role.includes('technicien') ||
      role.includes('manipulateur') ||
      department.includes('lab')
    ) {
      return ['lab_results', 'lab_sampling', 'lab_grouped_results', 'products', 'partners', 'logs_audit'];
    }

    // 7. Comptable / DAF / Gestionnaire Financier
    if (
      login === 'comptable' ||
      groupIds.includes(7) ||
      groupIds.includes(5) ||
      role.includes('comptab') ||
      role.includes('finance') ||
      role.includes('daf') ||
      department.includes('compta')
    ) {
      return ['dashboard', 'invoices', 'payments', 'partners', 'notifications'];
    }

    // Custom Permissions Fallback
    const views: AppView[] = ['partners'];
    if (perms.includes('can_validate_results') || perms.includes('can_enter_results')) {
      views.push('lab_results', 'lab_sampling', 'lab_grouped_results', 'products');
    }
    if (perms.includes('can_manage_invoices')) {
      views.push('invoices');
    }
    if (perms.includes('can_register_payments')) {
      views.push('payments', 'caisse_sessions');
    }
    if (perms.includes('can_manage_lab_catalog')) {
      if (!views.includes('products')) views.push('products');
    }
    if (perms.includes('can_view_financials')) {
      views.push('dashboard');
    }
    if (perms.includes('can_manage_users')) {
      views.push('users');
    }
    if (perms.includes('can_manage_settings')) {
      views.push('company');
    }
    if (perms.includes('can_send_reminders')) {
      views.push('notifications');
    }
    return views.length > 0 ? views : ['lab_results', 'partners'];
  };

  const allowed = getRawViews();
  if (allowed.includes('partners') && !allowed.includes('patient_dossiers')) {
    return [...allowed, 'patient_dossiers'];
  }
  return allowed;
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
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);

  const allowedViews = getAllowedViews(currentUser);
  const theme = getAppTheme(company.primary_color, company.sidebar_color);
  const profile = getUserBillingProfile(currentUser);
  const roleLower = (currentUser?.role || '').toLowerCase();
  const loginLower = (currentUser?.login || '').toLowerCase();
  const emailLower = (currentUser?.email || '').toLowerCase();

  const isSupervisorOrAdmin =
    profile === 'superviseur' ||
    roleLower.includes('supervis') ||
    roleLower.includes('admin') ||
    roleLower.includes('directeur') ||
    roleLower.includes('biolog') ||
    roleLower.includes('technic') ||
    loginLower === 'admin' ||
    loginLower === 'superviseur' ||
    (currentUser?.group_ids || []).includes(1) ||
    (currentUser?.group_ids || []).includes(5);

  const isSessionRequiredProfile =
    !isSupervisorOrAdmin &&
    (profile === 'facture' || profile === 'caisse' || profile === 'facture_caisse');

  const isLockedOutWithoutSession = isSessionRequiredProfile && !hasActiveSession;

  const handleGoHome = () => {
    const roleLower = (currentUser?.role || '').toLowerCase();
    if (isSessionRequiredProfile) {
      setCurrentView('caisse_sessions');
    } else if (roleLower.includes('biolog') || roleLower.includes('technicien')) {
      setCurrentView('lab_results');
    } else {
      setCurrentView('dashboard');
    }
    setSidebarOpen(false);
  };

  // Categories definition according to exact user menu order:
  // 1. Tableau de bord & Pilotage -> 2. Caisse & Facturation -> 3. Patients & Plateau Technique -> 4. Relances & Comptabilité -> 5. Administration
  const categories: NavCategoryConfig[] = [
    {
      title: 'Pilotage & Stratégie',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de Bord & Analyses',
          shortLabel: 'Tableau de Bord',
          icon: BarChart3,
          description: 'Chiffre d’affaires, encaissements, créances, KPI & statistiques',
        },
      ],
    },
    {
      title: profile === 'caisse' 
        ? 'Gestion de Caisse' 
        : profile === 'facture' 
        ? 'Facturation Clients' 
        : 'Facturation & Caisse',
      items: [
        {
          id: 'caisse_sessions',
          label: profile === 'caisse' 
            ? "Ma Caisse (Vacation)" 
            : profile === 'facture' 
            ? "Ma Session Journalière" 
            : "Sessions Caisse & Guichets",
          shortLabel: profile === 'caisse' ? 'Ma Caisse' : profile === 'facture' ? 'Ma Session' : 'Sessions Caisse',
          icon: Lock,
          description: profile === 'caisse' 
            ? 'Gestion des fonds, arrêté de caisse & clôture' 
            : 'Ouverture de vacation journalière & suivi des factures',
        },
        {
          id: 'invoices',
          label: 'Factures & Actes',
          shortLabel: 'Factures',
          icon: FileText,
          description: 'Historique des factures patients, tiers-payeur & actes',
        },
        {
          id: 'payments',
          label: profile === 'facture' ? 'Suivi des Règlements' : 'Règlements & Encaissements',
          shortLabel: 'Règlements',
          icon: CreditCard,
          description: profile === 'facture' 
            ? 'Consultation des encaissements liés à mes factures' 
            : 'Historique des reçus de paiement enregistrés',
        },
      ],
    },
    {
      title: 'Patients & Plateau Technique',
      items: [
        {
          id: 'partners',
          label: 'Patients & Prescripteurs',
          shortLabel: 'Patients',
          icon: Users,
          description: 'Dossiers patients, coordonnées & médecins',
        },
        {
          id: 'patient_dossiers',
          label: 'Dossiers Patients & Historique',
          shortLabel: 'Dossiers',
          icon: FolderOpen,
          description: 'Historique exhaustif des prestations, factures & analyses par patient',
        },
        {
          id: 'products',
          label: 'Catalogue Analyses & Tarifs',
          shortLabel: 'Catalogue',
          icon: FlaskConical,
          description: 'Fiches examens, valeurs de référence & délais',
        },
        {
          id: 'lab_sampling',
          label: 'Échantillonnage & Tubes',
          shortLabel: 'Échantillonnage',
          icon: Database,
          description: 'Suivi et validation des prélèvements de tubes',
        },
        {
          id: 'lab_results',
          label: 'Examens & Résultats Labo',
          shortLabel: 'Résultats',
          icon: Microscope,
          description: 'Saisie des paramètres, validation biologique & comptes-rendus',
        },
        {
          id: 'lab_grouped_results',
          label: 'Résultats Groupés',
          shortLabel: 'Résultats groupés',
          icon: CheckCircle2,
          description: 'Saisie et validation rapide par discipline (Biochimie, Sérologie...)',
        },
      ],
    },
    {
      title: 'Audit & Traçabilité',
      items: [
        {
          id: 'logs_audit',
          label: 'Logs & Registre d’Audit',
          shortLabel: 'Logs & Audit',
          icon: ScrollText,
          description: 'Traçabilité exhaustive du workflow LIMS, automates & sécurité',
        },
        {
          id: 'notifications',
          label: 'Relances & Alertes',
          shortLabel: 'Relances',
          icon: Mail,
          badge: notificationCount,
          description: 'Suivi des impayés & alertes techniques',
        },
      ],
    },
    {
      title: 'Administration & Système',
      items: [
        {
          id: 'users',
          label: 'Utilisateurs & Habilitations',
          shortLabel: 'Utilisateurs',
          icon: UserCheck,
          description: 'Gestion des comptes, rôles et habilitations',
        },
        {
          id: 'company',
          label: 'Branding & Filigrane',
          shortLabel: 'Branding',
          icon: Settings,
          description: 'Logo, filigrane de fond, couleurs de la charte & coordonnées',
        },
        {
          id: 'schema',
          label: 'Architecture BD (SQL)',
          shortLabel: 'Schéma BD',
          icon: Database,
          description: 'Modélisation relationnelle & tables SQL',
        },
      ],
    },
  ];

  // Filter categories to only keep categories that have at least one allowed item
  const visibleCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => allowedViews.includes(item.id as AppView)),
    }))
    .filter((cat) => cat.items.length > 0);

  const getActiveItemName = () => {
    for (const cat of categories) {
      const match = cat.items.find((i) => i.id === currentView);
      if (match) return match.label;
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
              {profile === 'caisse' 
                ? "Gestion rigoureuse des encaissements, des sessions de caisse et de l'arrêté journalier." 
                : profile === 'facture'
                ? "Accueil des patients, saisie précise des actes médicaux et émission des factures."
                : profile === 'facture_caisse'
                ? "Gestion polyvalente du dossier patient : facturation des actes et encaissement des règlements."
                : "Pilotage stratégique, supervision des flux financiers et administration du système."}
            </div>
          </div>
        </div>

        {/* Vertical Structured Navigation List (Clean Sidebar) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {visibleCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div 
                style={{ color: theme.sidebarTextMuted }}
                className="px-3 text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80"
              >
                {cat.title}
              </div>
              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const isItemLockedBySession = isLockedOutWithoutSession && item.id !== 'caisse_sessions';

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => {
                        if (isItemLockedBySession) {
                          alert("Accès Verrouillé : Votre profil requiert l'ouverture d'une session journalière pour accéder à ce menu. Veuillez d'abord démarrer votre vacation dans l'espace Session.");
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'font-bold border shadow-xs'
                          : isItemLockedBySession
                          ? 'opacity-40 cursor-not-allowed hover:bg-black/10'
                          : theme.isDarkSidebar
                          ? 'hover:bg-white/10'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {isItemLockedBySession ? (
                          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                        ) : (
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? '' : 'opacity-70 group-hover:opacity-100'
                            }`}
                          />
                        )}
                        <span className="text-xs font-medium leading-snug text-left min-w-0 flex-1 break-words">
                          {item.label}
                        </span>
                      </div>

                      {isItemLockedBySession ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0 ml-2">
                          Bloqué
                        </span>
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
                  );
                })}
              </div>
            </div>
          ))}

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
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition text-left shadow-sm"
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
              <div className="absolute left-3 right-3 bottom-full mb-2 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
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
                  {users.map((u) => (
                    <button
                      key={u.id}
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
        className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs lg:pl-64 transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger & Active view title */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-toggle-sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition"
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

          {/* Central Barcode & Dossier Quick Lookup Scanner */}
          {onSearchNDM && (
            <div className="hidden md:flex flex-1 max-w-sm mx-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Scanner ou Saisir N° Dossier (NDM)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      onSearchNDM(decodeScannerInput(val));
                      e.currentTarget.value = '';
                    }
                  }
                }}
                className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 text-xs font-bold text-slate-900 placeholder:text-slate-400 rounded-xl transition shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[9px] font-mono font-black uppercase text-slate-400 bg-slate-200/50 border border-slate-300 px-1.5 py-0.5 rounded leading-none">
                  ENTRÉE
                </span>
              </div>
            </div>
          )}

          {/* Right: Quick actions, persistence indicator, user switcher button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Persistence Status Badge */}
            <div
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold"
              title="Toutes les données sont automatiquement sauvegardées sur disque et persistées"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Système Connecté</span>
            </div>

            {/* Contextual Action CTA */}
            {canManageLab ? (
              <button
                id="top-btn-new-lab-order"
                onClick={() => {
                  setCurrentView('lab_results');
                  if (onNewLabOrder) onNewLabOrder();
                }}
                style={{ backgroundColor: theme.primary }}
                className="flex items-center space-x-1.5 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Nouvel Examen</span>
                <span className="sm:hidden">Examen</span>
              </button>
            ) : null}

            {/* Profile Pill Button in Top Bar */}
            <div className="relative">
              <button
                id="top-user-pill"
                onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition text-xs font-semibold text-slate-800 border border-slate-200 shrink-0"
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
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
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
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSelectUser(u);
                            setShowQuickActionMenu(false);
                          }}
                          className={`w-full text-left px-4 py-1.5 flex items-center justify-between hover:bg-slate-50 transition ${
                            currentUser?.id === u.id
                              ? 'bg-slate-100 font-bold text-slate-900'
                              : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {u.role}
                          </span>
                        </button>
                      ))}
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
    </>
  );
};
