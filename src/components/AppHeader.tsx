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
  ScrollText,
} from 'lucide-react';
import { ResUser, CompanySettings } from '../types';

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: ResUser | null;
  users: ResUser[];
  company: CompanySettings;
  onSelectUser: (u: ResUser) => void;
  onLogout: () => void;
  onNewInvoice: () => void;
  onNewPayment: () => void;
  onResetDb: () => void;
  notificationCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users = [],
  company,
  onSelectUser,
  onLogout,
  onNewInvoice,
  notificationCount,
}) => {
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = currentUser?.group_ids?.includes(1);

  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart3 },
    { id: 'invoices', label: 'Facturation & Caisse', icon: FileText },
    { id: 'payments', label: 'Paiements & Suivi', icon: CreditCard },
    { id: 'partners', label: 'Clients & Patients', icon: Users },
    { id: 'products', label: 'Catalogue Analyses & Prestations', icon: Microscope },
    { id: 'users', label: 'Utilisateurs & Habilitations', icon: UserCheck, adminOnly: true },
    { id: 'company', label: 'Paramètres & Branding', icon: Settings, adminOnly: true },
    { id: 'logs_audit', label: 'Logs & Registre d’Audit', icon: ScrollText },
    { id: 'notifications', label: 'Relances & Alertes', icon: Mail, badge: notificationCount },
    { id: 'schema', label: 'Architecture BD', icon: Database },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Sober professional primary header background
  const headerBg = company.primary_color || '#0f172a';

  return (
    <header
      className="bg-white text-slate-900 border-b border-slate-200 shadow-sm sticky top-0 z-40 transition-colors duration-200 w-full"
    >
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        
        {/* Left: Dynamic Company Brand Logo & Apps Switcher */}
        <div className="relative">
          <button
            id="btn-app-switcher"
            onClick={() => {
              setShowAppsMenu(!showAppsMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all text-slate-800 font-bold text-sm border border-slate-200 shrink-0 shadow-sm"
            title="Menu des modules de gestion"
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-6 h-6 object-contain rounded bg-white p-0.5"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                {company.name ? company.name.charAt(0).toUpperCase() : 'L'}
              </div>
            )}
            <div className="text-left hidden sm:block truncate max-w-[220px]">
              <span className="font-bold tracking-tight text-sm block leading-none truncate">
                {company.name || 'Laboratoire Médical'}
              </span>
              <span className="text-[10px] text-white/70 block leading-tight truncate mt-0.5">
                {company.slogan || 'Facturation & Gestion Pro'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />
          </button>

          {/* Module dropdown - perfectly unmasked with backdrop */}
          {showAppsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAppsMenu(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Modules de gestion
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {filteredNavItems.length} actifs
                  </span>
                </div>
                <div className="py-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowAppsMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className="bg-slate-200 text-slate-900 text-[10px] px-2 py-0.5 rounded font-bold">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onNewInvoice}
            className="flex items-center space-x-1.5 bg-white text-slate-900 hover:bg-slate-100 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Nouvelle Facture</span>
            <span className="sm:hidden">Facturer</span>
          </button>

          {/* User selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowAppsMenu(false);
              }}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition text-xs font-bold border border-slate-200 text-slate-700 shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline font-black truncate max-w-[140px]">
                {currentUser?.name || 'Utilisateur'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-extrabold text-slate-900">{currentUser?.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                    <div className="mt-1 flex items-center space-x-1">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {currentUser?.role || 'Opérateur'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Changer de compte
                    </div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-50 ${
                          currentUser?.id === u.id
                            ? 'bg-slate-100 font-bold text-slate-900'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({u.role || u.login})
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
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

      {/* Main Tabs Navigation Bar (Responsive, smooth horizontal scroll without overflow-hidden clipping dropdowns) */}
      <div className="bg-black/15 border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto no-scrollbar py-1.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-slate-950' : 'text-white/70'
                  }`}
                />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="bg-slate-700 text-white text-[10px] px-1.5 py-0.2 rounded font-bold ml-1">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
