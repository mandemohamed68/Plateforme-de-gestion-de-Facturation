import { AppView, CompanySettings, ResGroup, ResUser } from '../types';
import { getUserBillingProfile } from '../lib/formatters';

/**
 * Returns allowed views based on strict role-based access control (RBAC).
 */
export function getAllowedViews(user: ResUser | null): AppView[] {
  const getRawViews = (): AppView[] => {
    if (!user) return ['caisse_sessions', 'invoices', 'payments', 'partners'];

    // 1. If user has custom allowed views configured specifically for them
    if (user.allowed_views && Array.isArray(user.allowed_views) && user.allowed_views.length > 0) {
      return user.allowed_views as AppView[];
    }

    const billingProfile = getUserBillingProfile(user);
    const login = (user.login || '').toLowerCase().trim();
    const role = (user.role || '').toLowerCase().trim();
    const department = (user.department || '').toLowerCase().trim();
    const groupIds = user.group_ids || [];
    const perms = user.permissions || [];

    const isAdmin =
      (login === 'admin' && !role.includes('superviseur')) ||
      (role.includes('directeur') && !role.includes('superviseur')) ||
      (role.includes('admin') && !role.includes('superviseur')) ||
      role.includes('administrateur') ||
      perms.includes('all') ||
      groupIds.includes(1);

    // Custom allowed views override
    if (user.allowed_views && Array.isArray(user.allowed_views) && user.allowed_views.length > 0) {
      const custom = [...(user.allowed_views as AppView[])];
      if ((isAdmin || custom.includes('company') || perms.includes('can_manage_settings')) && !custom.includes('flash_announcements')) {
        custom.push('flash_announcements');
      }
      return custom;
    }

    // 2. Superviseur Caisse & Facturation
    if (
      role.includes('superviseur') ||
      login === 'superviseur' ||
      (billingProfile === 'superviseur' && !role.includes('admin') && !role.includes('directeur'))
    ) {
      return ['dashboard', 'caisse_sessions', 'invoices', 'payments', 'insurance_claims', 'partners', 'flash_announcements'];
    }

    // 3. Admin / Directeur / Administrateur -> Accès complet à TOUS les menus
    if (isAdmin) {
      return [
        'dashboard',
        'caisse_sessions',
        'invoices',
        'payments',
        'insurance_claims',
        'partners',
        'patient_dossiers',
        'lab_results',
        'lab_sampling',
        'lab_grouped_results',
        'products',
        'users',
        'company',
        'flash_announcements',
        'notifications',
        'logs_audit',
        'schema',
      ];
    }

    // Superviseur Caisse & Facturation
    if (
      billingProfile === 'superviseur' ||
      login === 'superviseur' ||
      role.includes('superviseur')
    ) {
      return ['dashboard', 'caisse_sessions', 'invoices', 'payments', 'insurance_claims', 'partners', 'logs_audit'];
    }

    // Facturier
    if (billingProfile === 'facture') {
      return ['caisse_sessions', 'invoices', 'insurance_claims', 'partners'];
    }

    // Caissier
    if (billingProfile === 'caisse') {
      return ['caisse_sessions', 'invoices', 'payments', 'insurance_claims'];
    }

    // Facture / Caisse
    if (billingProfile === 'facture_caisse') {
      return ['caisse_sessions', 'invoices', 'payments', 'insurance_claims', 'partners'];
    }

    // Biologiste Médical / Responsable de Laboratoire
    if (
      login === 'dr.toure' ||
      groupIds.includes(5) ||
      role.includes('biologiste') ||
      role.includes('chef de lab') ||
      role.includes('médecin')
    ) {
      return ['lab_results', 'lab_sampling', 'lab_grouped_results', 'products', 'partners', 'notifications', 'logs_audit'];
    }

    // Technicien de Laboratoire / Manipulateur
    if (
      login === 'technicien' ||
      groupIds.includes(6) ||
      role.includes('technicien') ||
      role.includes('manipulateur') ||
      department.includes('lab')
    ) {
      return ['lab_results', 'lab_sampling', 'lab_grouped_results', 'products', 'partners', 'logs_audit'];
    }

    // Comptable / DAF / Gestionnaire Financier
    if (
      login === 'comptable' ||
      groupIds.includes(7) ||
      groupIds.includes(5) ||
      role.includes('comptab') ||
      role.includes('finance') ||
      role.includes('daf') ||
      department.includes('compta')
    ) {
      return ['dashboard', 'invoices', 'payments', 'insurance_claims', 'partners', 'notifications'];
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
  if (Array.isArray(allowed)) {
    let result = [...allowed];
    if (result.includes('partners') && !result.includes('patient_dossiers')) {
      result.push('patient_dossiers');
    }
    if ((result.includes('company') || user?.permissions?.includes('can_manage_settings') || user?.permissions?.includes('all')) && !result.includes('flash_announcements')) {
      result.push('flash_announcements');
    }
    return result;
  }
  return ['caisse_sessions', 'invoices', 'payments', 'partners', 'patient_dossiers', 'flash_announcements'];
}
