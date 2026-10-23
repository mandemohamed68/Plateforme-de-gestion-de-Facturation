import { ResUser } from '../types';

/**
 * Utility functions for currency and date formatting in FCFA
 */

export const formatFCFA = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 FCFA';
  return Math.round(amount).toLocaleString('fr-FR') + ' FCFA';
};

export const formatCurrency = formatFCFA;

export function getUserBillingProfile(user: ResUser | null): 'facture' | 'caisse' | 'facture_caisse' | 'superviseur' {
  if (!user) return 'superviseur';
  const role = (user.role || '').toLowerCase().trim();
  const login = (user.login || '').toLowerCase().trim();
  
  // 1. Explicit Facture / Caisse (Polyvalent)
  if (
    role.includes('facture / caisse') ||
    role.includes('facture/caisse') ||
    role.includes('polyvalent') ||
    login === 'caisse_facture' ||
    (role.includes('facture') && role.includes('caisse') && !role.includes('superviseur'))
  ) {
    return 'facture_caisse';
  }

  // 2. Explicit Facturier (Établissement factures seul)
  if (
    role.includes('facturier') ||
    role.includes('facturation seule') ||
    role.includes('établissement factures seul') ||
    role === 'facture' ||
    login === 'facturier'
  ) {
    return 'facture';
  }

  // 3. Explicit Caissier (Encaissement seul)
  if (
    role.includes('caissier') ||
    role.includes('caisse seule') ||
    role.includes('encaissement paiements seul') ||
    role === 'caisse' ||
    login === 'caissier'
  ) {
    return 'caisse';
  }

  // Fallback based on group_ids
  if ((user.group_ids || []).includes(3)) return 'caisse';
  if ((user.group_ids || []).includes(2)) return 'facture';
  if ((user.group_ids || []).includes(4)) return 'facture_caisse';

  return 'superviseur';
}

export function getUserMissionDescription(user: ResUser | null): string {
  if (!user) return "Services généraux.";
  const login = (user.login || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();
  const department = (user.department || '').toLowerCase().trim();

  if (login === 'mandemohamed68@gmail.com' || login === 'super_admin' || role.includes('super admin') || role.includes('universel') || role.includes('directeur')) {
    return "Administration.";
  }
  if (login === 'laboratoire' || role.includes('biologiste') || role.includes('technicien') || role.includes('laboratoire') || department.includes('lab')) {
    return "Laboratoire et analyses.";
  }
  if (login === 'imagerie' || role.includes('imagerie') || role.includes('radiologue') || role.includes('radio')) {
    return "Imagerie et radiologie.";
  }
  if (login === 'infirmier' || role.includes('infirmier') || role.includes('infirmière') || role.includes('nurse')) {
    return "Triage et soins infirmiers.";
  }
  if (login === 'specialiste' || role.includes('spécialiste') || role.includes('specialiste')) {
    return "Consultations spécialisées.";
  }
  if (login === 'medecin' || role.includes('médecin') || role.includes('medecin') || role.includes('docteur')) {
    return "Consultations médicales.";
  }
  if (login === 'hospitalisation' || role.includes('hospit')) {
    return "Hospitalisation et lits.";
  }
  if (login === 'superviseur' || role.includes('superviseur')) {
    return "Supervision de caisse.";
  }
  if (login === 'caissier' || (role.includes('caiss') && !role.includes('factur'))) {
    return "Encaissement de caisse.";
  }
  if (login === 'facturier' || (role.includes('factur') && !role.includes('caiss'))) {
    return "Facturation des actes.";
  }
  if (login === 'caisse_facture' || (role.includes('caiss') && role.includes('factur')) || role.includes('polyvalent')) {
    return "Facturation et caisse.";
  }
  return "Opérations autorisées.";
}

