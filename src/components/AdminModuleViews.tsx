import React, { useState } from 'react';
import {
  Shield,
  Key,
  Sliders,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Printer,
  Building2
} from 'lucide-react';
import {
  ResUser,
  ResGroup,
  CompanySettings,
  AppView
} from '../types';

interface AdminViewsProps {
  currentView: AppView;
  users: ResUser[];
  groups: ResGroup[];
  company?: CompanySettings;
  onNavigateToView: (view: AppView) => void;
}

export const AdminRolesTableView: React.FC<AdminViewsProps> = ({
  users,
  groups,
  onNavigateToView,
}) => {
  const rolesList = [
    { code: 'admin', name: 'Administrateur Système', description: 'Accès intégral à la configuration, sécurité et gestion des utilisateurs', usersCount: users.filter(u => u.role === 'admin').length },
    { code: 'superviseur', name: 'Superviseur de Caisse', description: 'Contrôle des flux financiers, validation des clôtures et encaissements', usersCount: users.filter(u => u.role === 'superviseur').length },
    { code: 'caisse', name: 'Agent de Caisse', description: 'Perception des règlements patients, émission des quittances et reçus', usersCount: users.filter(u => u.role === 'caisse').length },
    { code: 'factures', name: 'Agent de Facturation', description: 'Création et gestion des factures, tiers-payants et prises en charge', usersCount: users.filter(u => u.role === 'factures').length },
    { code: 'infirmier', name: 'Personnel Infirmier', description: 'Triage, saisie des constantes vitales, administration des soins', usersCount: users.filter(u => u.role === 'infirmier').length },
    { code: 'medecin', name: 'Médecin Généraliste', description: 'Consultations cliniques, prescriptions d\'ordonnances, examens', usersCount: users.filter(u => u.role === 'medecin').length },
    { code: 'specialiste', name: 'Médecin Spécialiste', description: 'Avis spécialisés référés, actes techniques, dossiers complexes', usersCount: users.filter(u => u.role === 'specialiste').length },
    { code: 'labo', name: 'Biologiste / Technicien Labo', description: 'Prélèvements sanguins, exécution d\'analyses, validation biologique', usersCount: users.filter(u => u.role === 'labo').length },
    { code: 'imagerie', name: 'Radiologue / Manipulateur', description: 'Acquisition des clichés radio/scanner, rédaction des comptes-rendus', usersCount: users.filter(u => u.role === 'imagerie').length },
    { code: 'hospitalisation', name: 'Gestionnaire Hospitalisation', description: 'Admissions au lit, gestion des séjours, transferts et sorties', usersCount: users.filter(u => u.role === 'hospitalisation').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-700" />
            Gestion des Rôles & Profils Métiers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Définition des fonctions organisationnelles et des périmètres d'intervention du personnel
          </p>
        </div>
        <button
          onClick={() => onNavigateToView('admin_permissions')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
        >
          Matrice des Droits
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {rolesList.length} Profils métiers configurés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Rôle</th>
                <th className="py-2.5 px-4">Intitulé du Poste</th>
                <th className="py-2.5 px-4">Périmètre & Responsabilités</th>
                <th className="py-2.5 px-4">Effectif affecté</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rolesList.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                  <td className="py-3 px-4 text-slate-600">{r.description}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.usersCount} utilisateur{r.usersCount > 1 ? 's' : ''}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('admin_users')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                    >
                      Voir membres
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AdminPermissionsTableView: React.FC<AdminViewsProps> = () => {
  const modules = [
    'Accueil & File d\'attente',
    'Constantes & Soins infirmiers',
    'Consultations médicales',
    'Avis spécialisés',
    'Laboratoire d\'analyses',
    'Imagerie & Radiologie',
    'Hospitalisation & Lits',
    'Facturation & Tiers-payant',
    'Caisse & Encaissements',
    'Supervision financière',
    'Paramétrage général'
  ];

  const profiles = [
    'Infirmier',
    'Médecin Généraliste',
    'Médecin Spécialiste',
    'Biologiste',
    'Radiologue',
    'Caissier',
    'Facturier',
    'Superviseur',
    'Administrateur'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-700" />
            Matrice des Droits d'Accès & Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contrôle granulaire des accès en lecture, écriture et validation par module fonctionnel
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Matrice de contrôle d'accès RBAC
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4 min-w-[200px]">Module Fonctionnel</th>
                {profiles.map(p => (
                  <th key={p} className="py-2.5 px-2 text-center text-[11px] min-w-[90px]">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((mod, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{mod}</td>
                  {profiles.map(p => {
                    const isAllowed = 
                      p === 'Administrateur' ||
                      (p === 'Infirmier' && (mod.includes('Accueil') || mod.includes('Constantes'))) ||
                      (p === 'Médecin Généraliste' && (mod.includes('Consultations') || mod.includes('Constantes') || mod.includes('Accueil'))) ||
                      (p === 'Médecin Spécialiste' && (mod.includes('Avis') || mod.includes('Consultations'))) ||
                      (p === 'Biologiste' && mod.includes('Laboratoire')) ||
                      (p === 'Radiologue' && mod.includes('Imagerie')) ||
                      (p === 'Caissier' && mod.includes('Caisse')) ||
                      (p === 'Facturier' && mod.includes('Facturation')) ||
                      (p === 'Superviseur' && (mod.includes('Caisse') || mod.includes('Facturation') || mod.includes('Supervision')));

                    return (
                      <td key={p} className="py-3 px-2 text-center">
                        {isAllowed ? (
                          <CheckCircle2 className="w-4 h-4 text-slate-900 mx-auto" />
                        ) : (
                          <span className="text-slate-300 text-xs font-bold">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AdminMedicalSettingsTableView: React.FC<AdminViewsProps> = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-slate-700" />
            Paramètres Cliniques & Unités Médicales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Définition des spécialités, services cliniques et seuils d'alerte des constantes vitales
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Services & Unités de Soins
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Service</th>
                <th className="py-2.5 px-4">Nom de l'Unité</th>
                <th className="py-2.5 px-4">Localisation / Bâtiment</th>
                <th className="py-2.5 px-4">Chef de Service</th>
                <th className="py-2.5 px-4">Capacité Lits</th>
                <th className="py-2.5 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { code: 'URG', name: 'Service des Urgences & Déchocage', bat: 'Bâtiment A - RDC', chef: 'Dr. Toure', lits: '8 lits d\'observation', statut: 'Opérationnel' },
                { code: 'MED', name: 'Médecine Interne & Polyvalente', bat: 'Bâtiment B - 1er étage', chef: 'Dr. Keita', lits: '24 lits', statut: 'Opérationnel' },
                { code: 'CHIR', name: 'Chirurgie Générale & Bloc', bat: 'Bâtiment C - 2e étage', chef: 'Dr. Koné', lits: '16 lits', statut: 'Opérationnel' },
                { code: 'MAT', name: 'Maternité & Néonatologie', bat: 'Bâtiment D - RDC', chef: 'Dr. Barry', lits: '12 lits', statut: 'Opérationnel' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                  <td className="py-3 px-4 text-slate-600">{row.bat}</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">{row.chef}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{row.lits}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {row.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
