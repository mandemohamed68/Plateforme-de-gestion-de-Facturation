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
  const email = (user.email || '').toLowerCase().trim();
  
  // 0. Universal Administrator / Superviseur
  if (
    role.includes('superviseur') ||
    role.includes('admin') ||
    role.includes('directeur') ||
    role.includes('universel') ||
    login === 'admin' ||
    login === 'superviseur'
  ) {
    return 'superviseur';
  }

  // 1. Explicit Facture / Caisse (Polyvalent)
  if (
    role.includes('facture / caisse') ||
    role.includes('facture/caisse') ||
    role.includes('polyvalent') ||
    login === 'facture_caisse' ||
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

  // 4. Superviseur Caisse / Facture or Admin / Direction
  if (
    role.includes('superviseur') ||
    login === 'admin' ||
    login === 'superviseur' ||
    role.includes('directeur') ||
    role.includes('administrateur')
  ) {
    return 'superviseur';
  }

  // Fallback based on group_ids
  if ((user.group_ids || []).includes(3)) return 'caisse';
  if ((user.group_ids || []).includes(2)) return 'facture';
  if ((user.group_ids || []).includes(4)) return 'facture_caisse';

  return 'superviseur';
}

