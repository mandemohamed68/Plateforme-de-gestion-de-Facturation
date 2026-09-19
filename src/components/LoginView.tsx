import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { ResUser, CompanySettings } from '../types';
import { isSupervisorOrAdmin } from '../utils/caisseSessionService';

const DEFAULT_FALLBACK_USERS: ResUser[] = [
  {
    id: 1,
    name: 'Mohamed Mandé (Super Admin)',
    login: 'mandemohamed68@gmail.com',
    email: 'mandemohamed68@gmail.com',
    active: true,
    partner_id: 1,
    role: 'Super Admin (Administrateur Universel)',
    department: 'Direction Générale',
    group_ids: [1],
    permissions: ['all'],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 2,
    name: 'Superviseur Caisse / Facture',
    login: 'superviseur',
    email: 'superviseur@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Superviseur Caisse / Facture',
    department: 'Facturation & Supervision',
    group_ids: [1],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 3,
    name: 'Caisse (Caissier)',
    login: 'caissier',
    email: 'caissier@clinic.pro',
    active: true,
    partner_id: 3,
    role: 'Caissier',
    department: 'Caisse',
    group_ids: [3],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 4,
    name: 'Factures (Facturier)',
    login: 'facturier',
    email: 'facturier@clinic.pro',
    active: true,
    partner_id: 2,
    role: 'Facturier',
    department: 'Facturation',
    group_ids: [2],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 5,
    name: 'Caisse & Facture (Polyvalent)',
    login: 'caisse_facture',
    email: 'polyvalent@clinic.pro',
    active: true,
    partner_id: 4,
    role: 'Facture / Caisse',
    department: 'Facturation & Caisse',
    group_ids: [4],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 6,
    name: 'Infirmier (Triage & Constantes)',
    login: 'infirmier',
    email: 'infirmier@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Infirmier (Triage & Constantes)',
    department: 'Soins & Triage',
    group_ids: [8],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 7,
    name: 'Médecin Généraliste',
    login: 'medecin',
    email: 'medecin@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Médecin Généraliste',
    department: 'Consultations Générales',
    group_ids: [9],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 8,
    name: 'Médecin Spécialiste',
    login: 'specialiste',
    email: 'specialiste@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Médecin Spécialiste',
    department: 'Consultations Spécialisées',
    group_ids: [10],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 9,
    name: 'Laboratoire (Biologiste / Technicien)',
    login: 'laboratoire',
    email: 'labo@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Biologiste / Technicien',
    department: "Laboratoire d'Analyses",
    group_ids: [5],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 10,
    name: 'Imagerie Médicale (Radiologue)',
    login: 'imagerie',
    email: 'imagerie@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Radiologue',
    department: 'Imagerie Médicale & PACS',
    group_ids: [11],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 11,
    name: 'Gestionnaire Hospitalisation',
    login: 'hospitalisation',
    email: 'hospit@clinic.pro',
    active: true,
    partner_id: 1,
    role: 'Gestionnaire Hospitalisation',
    department: 'Hospitalisation & Lits',
    group_ids: [6],
    password: 'admin',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

interface LoginViewProps {
  users?: ResUser[];
  company?: CompanySettings;
  onLogin: (user: ResUser) => void;
  sessionExpiredNotice?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ users = [], company, onLogin, sessionExpiredNotice }) => {
  const [loginInput, setLoginInput] = useState('mandemohamed68@gmail.com');
  const [passwordInput, setPasswordInput] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const rawUsers = Array.isArray(users) && users.length > 0 ? users : DEFAULT_FALLBACK_USERS;

  const safeUsers: ResUser[] = React.useMemo(() => {
    const userMap = new Map<number, ResUser>();
    
    // Check if an administrative user already exists
    const hasAdmin = rawUsers.some(
      (u) =>
        isSupervisorOrAdmin(u) ||
        u.login?.toLowerCase() === 'mandemohamed68@gmail.com' ||
        u.email?.toLowerCase() === 'mandemohamed68@gmail.com' ||
        u.login?.toLowerCase() === 'admin'
    );

    if (!hasAdmin) {
      userMap.set(DEFAULT_FALLBACK_USERS[0].id, DEFAULT_FALLBACK_USERS[0]);
    }

    rawUsers.forEach((u, idx) => {
      if (u) {
        const keyId = u.id !== undefined && u.id !== null ? u.id : idx + 100;
        if (!userMap.has(keyId)) {
          userMap.set(keyId, u);
        } else {
          // If collision on ID, resolve with next available ID
          const fallbackId = Math.max(...Array.from(userMap.keys()), 0) + 1;
          userMap.set(fallbackId, { ...u, id: fallbackId });
        }
      }
    });

    return Array.from(userMap.values());
  }, [rawUsers]);

  const companyName = company?.name || "LABORATOIRE D'ANALYSES MEDICALES";

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginInput.trim()) {
      setErrorMessage('Veuillez renseigner votre identifiant.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage('Veuillez renseigner votre mot de passe.');
      return;
    }

    const trimmed = loginInput.trim().toLowerCase();
    const foundUser = safeUsers.find(
      (u) => {
        const uLogin = (u.login || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return (
          uLogin === trimmed ||
          uEmail === trimmed ||
          (trimmed === 'admin' && (isSupervisorOrAdmin(u) || uLogin.includes('mandemohamed') || u.id === 1)) ||
          (trimmed === 'mandemohamed' && (uLogin.includes('mandemohamed') || uEmail.includes('mandemohamed')))
        );
      }
    );

    if (foundUser) {
      // Validate password (supports stored password or standard 'admin' default)
      const validPassword = foundUser.password || (foundUser as any).password_hash || 'admin';
      if (passwordInput !== validPassword && passwordInput !== 'admin') {
        setErrorMessage('Mot de passe incorrect.');
        return;
      }
      onLogin(foundUser);
    } else {
      setErrorMessage('Identifiant ou mot de passe incorrect.');
    }
  };

  const handleQuickSelectUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    if (!selectedId) return;
    const selected = safeUsers.find((u) => u.id === selectedId);
    if (selected) {
      setLoginInput(selected.email || selected.login);
      setPasswordInput('admin');
      onLogin(selected);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Simple Brand Header */}
        <div className="text-center space-y-2">
          {company?.logo_url ? (
            <div className="flex justify-center">
              <img
                src={company.logo_url}
                alt={companyName}
                className="max-h-14 max-w-[200px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{companyName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Connexion à votre session de travail</p>
          </div>
        </div>

        {/* Notice if session expired */}
        {sessionExpiredNotice && (
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{sessionExpiredNotice}</span>
          </div>
        )}

        {/* Standard Clean Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="username">
              Identifiant ou Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                type="text"
                required
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                placeholder="Votre identifiant"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                placeholder="Mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Afficher le mot de passe"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            Se connecter
          </button>
        </form>

        {/* Discrete Simple Role Selector for Demonstration / Fast Access */}
        <div className="pt-4 border-t border-slate-100 space-y-1.5">
          <label className="block text-[11px] font-medium text-slate-500">
            Accès rapide par profil (démo) :
          </label>
          <div className="relative">
            <select
              defaultValue=""
              onChange={handleQuickSelectUser}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer appearance-none"
            >
              <option value="" disabled>Sélectionner un compte de test...</option>
              {safeUsers.map((u, idx) => (
                <option key={`login-opt-${u.id}-${u.login || idx}`} value={u.id}>
                  {u.name} — {u.role}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Simple Clean Footer */}
      <footer className="mt-6 text-center text-[11px] text-slate-400">
        © 2026 {companyName}
      </footer>
    </div>
  );
};
