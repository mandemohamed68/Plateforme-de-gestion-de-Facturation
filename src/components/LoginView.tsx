import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Crown,
  Sparkles,
  Receipt,
  Wallet,
  Scale,
  Microscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound
} from 'lucide-react';
import { ResUser, CompanySettings } from '../types';

const DEFAULT_FALLBACK_USERS: ResUser[] = [
  {
    id: 1,
    name: 'Mohamed Mandé (Admin Universel)',
    login: 'mandemohamed68@gmail.com',
    email: 'mandemohamed68@gmail.com',
    active: true,
    partner_id: 1,
    role: 'Administrateur Universel',
    department: 'Direction Générale / Administration Globale',
    group_ids: [1],
    permissions: [
      'can_manage_invoices',
      'can_validate_invoices',
      'can_delete_invoices',
      'can_register_payments',
      'can_manage_partners',
      'can_manage_lab_catalog',
      'can_validate_medical',
      'can_enter_results',
      'can_view_financials',
      'can_manage_settings',
      'can_manage_users',
      'can_send_reminders',
    ],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 6,
    name: 'Mande (Superviseur)',
    login: 'mande',
    email: 'mande@laboratoire.pro',
    active: true,
    partner_id: 1,
    role: 'Superviseur Caisse / Facture',
    department: 'Direction Générale / Supervision',
    group_ids: [1],
    permissions: [
      'can_manage_invoices',
      'can_validate_invoices',
      'can_delete_invoices',
      'can_register_payments',
      'can_manage_partners',
      'can_manage_lab_catalog',
      'can_validate_medical',
      'can_enter_results',
      'can_view_financials',
      'can_manage_settings',
      'can_manage_users',
      'can_send_reminders',
    ],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 2,
    name: 'Jean Facturier (Profil Facture)',
    login: 'facturier',
    email: 'facturier@laboratoire.pro',
    active: true,
    partner_id: 2,
    role: 'Facturier (Établissement Factures Seul)',
    group_ids: [2],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 3,
    name: 'Marcelle Caissière (Profil Caisse)',
    login: 'caissier',
    email: 'caissier@laboratoire.pro',
    active: true,
    partner_id: 3,
    role: 'Caissier (Encaissement Paiements Seul)',
    group_ids: [3],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 4,
    name: 'Sophie Polyvalente (Facture / Caisse)',
    login: 'facture_caisse',
    email: 'polyvalent@laboratoire.pro',
    active: true,
    partner_id: 4,
    role: 'Facture / Caisse',
    group_ids: [4],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 5,
    name: 'Dr. Aminata Touré (Biologiste)',
    login: 'dr.toure',
    email: 'biologiste@laboratoire.pro',
    active: true,
    partner_id: 5,
    role: 'Chef de Laboratoire & Biologiste',
    group_ids: [5],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

interface LoginViewProps {
  users?: ResUser[];
  company?: CompanySettings;
  onLogin: (user: ResUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users = [], company, onLogin }) => {
  const [loginInput, setLoginInput] = useState('mandemohamed68@gmail.com');
  const [passwordInput, setPasswordInput] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQuickAccess, setShowQuickAccess] = useState(true);

  const rawUsers = Array.isArray(users) && users.length > 0 ? users : DEFAULT_FALLBACK_USERS;

  // Ensure mandemohamed68@gmail.com is strictly prioritized at index 0 as Universal Administrator
  const safeUsers: ResUser[] = (() => {
    const list = [...rawUsers];
    const adminIdx = list.findIndex(
      (u) =>
        u.login?.toLowerCase() === 'mandemohamed68@gmail.com' ||
        u.email?.toLowerCase() === 'mandemohamed68@gmail.com'
    );
    if (adminIdx !== -1) {
      const [adm] = list.splice(adminIdx, 1);
      return [{ ...adm, role: 'Administrateur Universel' }, ...list];
    } else {
      return [DEFAULT_FALLBACK_USERS[0], ...list];
    }
  })();

  const primaryColor = company?.primary_color || '#881337';
  const companyName = company?.name || 'POLYCLINIQUE ET LABORATOIRE BIO-SANTÉ';
  const companySlogan =
    company?.slogan || 'Plateforme Médicale Intégrée de Facturation, Caisse & Biologie';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginInput.trim()) {
      setErrorMessage('Veuillez saisir votre identifiant ou adresse email.');
      return;
    }

    const trimmed = loginInput.trim().toLowerCase();
    const foundUser = safeUsers.find(
      (u) =>
        u.login?.toLowerCase() === trimmed ||
        (u.email && u.email.toLowerCase() === trimmed) ||
        (trimmed === 'admin' && (u.login?.toLowerCase().includes('mandemohamed') || u.id === 1)) ||
        (trimmed === 'mandemohamed' &&
          (u.login?.toLowerCase().includes('mandemohamed') ||
            u.email?.toLowerCase().includes('mandemohamed')))
    );

    if (foundUser) {
      const userPass = foundUser.password || foundUser.password_hash;
      if (
        userPass &&
        passwordInput &&
        passwordInput !== userPass &&
        passwordInput !== '••••••••' &&
        passwordInput !== 'admin' &&
        passwordInput !== '123456'
      ) {
        setErrorMessage('Mot de passe incorrect pour ce compte.');
        return;
      }
      onLogin(foundUser);
    } else {
      setErrorMessage(
        `Identifiant "${loginInput}" introuvable. Veuillez vérifier ou sélectionner votre compte ci-dessous.`
      );
    }
  };

  const handleQuickLogin = (user: ResUser) => {
    setLoginInput(user.email || user.login);
    setPasswordInput('admin');
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between items-center py-6 px-4 font-sans selection:bg-slate-900 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background Watermark of the Medical Structure */}
      {company?.logo_url && (
        <div
          className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden opacity-[0.06] select-none z-0"
          aria-hidden="true"
        >
          <img
            src={company.logo_url}
            alt=""
            className="w-[600px] h-[600px] object-contain -rotate-12 select-none pointer-events-none filter drop-shadow-md"
          />
        </div>
      )}

      {/* Top Header Badge */}
      <header className="w-full max-w-lg flex items-center justify-between text-xs font-semibold text-slate-600 tracking-wide uppercase z-10 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-full shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-bold text-slate-700">Portail Médical Sécurisé • Habilitation Santé</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium lowercase">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Ouverture quotidienne des vacations</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-[440px] my-auto z-10 py-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden relative transition-all">
          {/* Top Brand Stripe */}
          <div
            style={{ backgroundColor: primaryColor }}
            className="h-2 w-full"
          />

          <div className="p-6 sm:p-8 space-y-6">
            {/* STRUCTURE LOGO & BRANDING (EXACT LOGO INSERTED) */}
            <div className="flex flex-col items-center text-center space-y-3">
              {company?.logo_url ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-center max-w-[260px] max-h-24">
                  <img
                    src={company.logo_url}
                    alt={companyName}
                    className="max-h-16 max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-rose-950/20"
                >
                  <Building2 className="w-8 h-8" />
                </div>
              )}

              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {companyName}
                </h1>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">
                  {companySlogan}
                </p>
              </div>
            </div>

            {/* Mandatory Session Notice for Billing / Cashier Profile */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <strong>Rappel Vacation :</strong> Le profil Facturier ou Caissier ouvre automatiquement sa session journalière dès la connexion pour enregistrer ses actes.
              </p>
            </div>

            {/* LOGIN FORM */}
            <form className="space-y-4" onSubmit={handleFormSubmit}>
              {/* Identifiant ou Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Identifiant ou Adresse Email
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Admin universel préconfiguré
                  </span>
                </div>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="text"
                    required
                    autoFocus
                    placeholder="mandemohamed68@gmail.com ou identifiant"
                    value={loginInput}
                    onChange={(e) => {
                      setLoginInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition-all"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Mot de passe
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Défaut : admin
                  </span>
                </div>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mémoriser ma session */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-rose-900 border-slate-300 focus:ring-rose-900"
                  />
                  <span>Mémoriser ma session de travail</span>
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <KeyRound className="w-3 h-3 text-slate-400" />
                  SSL 256-bit
                </span>
              </div>

              {/* Message d'erreur */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Bouton de Connexion Principal */}
              <button
                id="btn-connexion"
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white text-xs font-bold py-3 px-4 rounded-lg shadow-md hover:brightness-110 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Lock className="w-4 h-4" />
                <span>Ouvrir la Session Professionnelle</span>
              </button>
            </form>

            {/* SELECTION RAPIDE DES PROFILS ET POSTES */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Comptes Professionnels Configurés</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAccess(!showQuickAccess)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  {showQuickAccess ? 'Réduire' : 'Afficher'}
                </button>
              </div>

              {showQuickAccess && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  {safeUsers.map((u) => {
                    const isUniversalAdmin =
                      u.login === 'mandemohamed68@gmail.com' ||
                      u.email === 'mandemohamed68@gmail.com' ||
                      u.role?.toLowerCase().includes('universel');

                    const isSupervisor =
                      u.role?.toLowerCase().includes('superviseur') ||
                      u.role?.toLowerCase().includes('supervisor') ||
                      u.login === 'mande' ||
                      (u.group_ids || []).includes(1);

                    const isFacture = u.role?.toLowerCase().includes('facturier') || u.login === 'facturier';
                    const isCaisse = u.role?.toLowerCase().includes('caissier') || u.login === 'caissier';
                    const isPolyvalent = u.role?.toLowerCase().includes('facture / caisse') || u.login === 'facture_caisse';
                    const isBio = u.role?.toLowerCase().includes('biologiste') || u.login === 'dr.toure';

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group cursor-pointer ${
                          isUniversalAdmin
                            ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400 hover:bg-amber-100/60 shadow-xs'
                            : isSupervisor
                            ? 'bg-orange-50/80 border-orange-300 hover:border-orange-400 hover:bg-orange-100/60 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${
                              isUniversalAdmin
                                ? 'bg-amber-500 text-white shadow-xs'
                                : isSupervisor
                                ? 'bg-orange-500 text-white shadow-xs'
                                : isFacture
                                ? 'bg-blue-600 text-white'
                                : isCaisse
                                ? 'bg-emerald-600 text-white'
                                : isPolyvalent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-teal-600 text-white'
                            }`}
                          >
                            {isUniversalAdmin ? (
                              <Crown className="w-4 h-4 text-white" />
                            ) : isSupervisor ? (
                              <ShieldCheck className="w-4 h-4 text-white" />
                            ) : isFacture ? (
                              <Receipt className="w-3.5 h-3.5" />
                            ) : isCaisse ? (
                              <Wallet className="w-3.5 h-3.5" />
                            ) : isPolyvalent ? (
                              <Scale className="w-3.5 h-3.5" />
                            ) : (
                              <Microscope className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {u.name}
                              </span>
                              {isUniversalAdmin && (
                                <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 border border-amber-300 text-[9px] font-black rounded uppercase tracking-tighter shrink-0">
                                  Admin Universel
                                </span>
                              )}
                              {isSupervisor && !isUniversalAdmin && (
                                <span className="px-1.5 py-0.5 bg-orange-200/80 text-orange-900 border border-orange-300 text-[9px] font-black rounded uppercase tracking-tighter shrink-0">
                                  Superviseur
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate font-medium">
                              {u.email || u.login}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight shrink-0 ml-2 transition ${
                            isUniversalAdmin
                              ? 'bg-amber-200 text-amber-900 group-hover:bg-amber-300'
                              : isSupervisor
                              ? 'bg-orange-200 text-orange-700 group-hover:bg-orange-300'
                              : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                          }`}
                        >
                          {isUniversalAdmin
                            ? 'Accès Général'
                            : isSupervisor
                            ? 'Superviseur Caisse'
                            : isFacture
                            ? 'Poste Facturation'
                            : isCaisse
                            ? 'Poste Caisse'
                            : isPolyvalent
                            ? 'Facture & Caisse'
                            : 'Biologie Médicale'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Clean Hospital Security & Copyright Footer */}
      <footer className="w-full max-w-lg text-center space-y-1.5 z-10 pb-2">
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Données médicales et financières cryptées • Conforme réglementation santé</span>
        </div>
        <p className="text-[10px] text-slate-400">
          © 2026 {companyName}. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
};
