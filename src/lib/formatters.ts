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
  if (!user) return "Accès aux services de l'établissement.";
  const login = (user.login || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();
  const department = (user.department || '').toLowerCase().trim();

  if (login === 'mandemohamed68@gmail.com' || login === 'super_admin' || role.includes('super admin') || role.includes('universel') || role.includes('directeur')) {
    return "Pilotage stratégique, supervision globale et administration de l'ensemble de l'établissement.";
  }
  if (login === 'laboratoire' || role.includes('biologiste') || role.includes('technicien') || role.includes('laboratoire') || department.includes('lab')) {
    return "Réception des prélèvements biologiques, analyses médicales et validation des résultats.";
  }
  if (login === 'imagerie' || role.includes('imagerie') || role.includes('radiologue') || role.includes('radio')) {
    return "Réalisation des examens radiologiques, imagerie médicale et archivage PACS des clichés.";
  }
  if (login === 'infirmier' || role.includes('infirmier') || role.includes('infirmière') || role.includes('nurse')) {
    return "Accueil et triage des patients, relevé des constantes vitales et administration des soins.";
  }
  if (login === 'specialiste' || role.includes('spécialiste') || role.includes('specialiste')) {
    return "Consultations de spécialité approfondies, prescriptions et suivi clinique spécialisé.";
  }
  if (login === 'medecin' || role.includes('médecin') || role.includes('medecin') || role.includes('docteur')) {
    return "Consultations médicales générales, diagnostics cliniques et suivi des dossiers patients.";
  }
  if (login === 'hospitalisation' || role.includes('hospit')) {
    return "Gestion des admissions, attribution des lits d'hospitalisation et suivi des séjours.";
  }
  if (login === 'superviseur' || role.includes('superviseur')) {
    return "Contrôle des flux d'encaissement, suivi des sessions de caisse et supervision de la facturation.";
  }
  if (login === 'caissier' || (role.includes('caiss') && !role.includes('factur'))) {
    return "Gestion rigoureuse des encaissements, des sessions de caisse et de l'arrêté journalier.";
  }
  if (login === 'facturier' || (role.includes('factur') && !role.includes('caiss'))) {
    return "Accueil des patients, saisie des actes et prestations, et émission des factures.";
  }
  if (login === 'caisse_facture' || (role.includes('caiss') && role.includes('factur')) || role.includes('polyvalent')) {
    return "Gestion polyvalente du dossier patient : facturation des prestations et encaissement des règlements.";
  }
  return "Pilotage opérationnel et réalisation des actes liés à votre habilitation.";
}

