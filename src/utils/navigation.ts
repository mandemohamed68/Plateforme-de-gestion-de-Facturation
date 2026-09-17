import { AppView, CompanySettings, ResGroup, ResUser } from '../types';
import { getUserBillingProfile } from '../lib/formatters';

/**
 * Returns allowed views based on strict role-based access control (RBAC).
 */
export function getAllowedViews(user: ResUser | null): AppView[] {
  const getRawViews = (): AppView[] => {
    if (!user) return ['dashboard'];

    const login = (user.login || '').toLowerCase().trim();
    const role = (user.role || '').toLowerCase().trim();
    const department = (user.department || '').toLowerCase().trim();
    const groupIds = user.group_ids || [];
    const perms = user.permissions || [];

    // If user has custom allowed views configured explicitly on their record
    if (user.allowed_views && Array.isArray(user.allowed_views) && user.allowed_views.length > 0) {
      return user.allowed_views as AppView[];
    }

    // 1. Super Admin / Direction / Administrateur Universel -> Accès complet sans restriction
    if (
      login === 'mandemohamed68@gmail.com' ||
      login === 'super_admin' ||
      login === 'admin' ||
      role.includes('super admin') ||
      role.includes('directeur') ||
      role.includes('administrateur') ||
      role.includes('universel') ||
      perms.includes('all')
    ) {
      return [
        'accueil_module',
        'hospitalisation_module',
        'admin_module',
        'dashboard',
        'scenarios_s01_s50',
        'patient_journey',
        'superviseur_group',
        'superviseur_dashboard',
        'superviseur_sessions',
        'superviseur_invoices',
        'superviseur_caisses',
        'superviseur_payments',
        'superviseur_reports',
        'caisse_group',
        'caisse_dashboard',
        'caisse_new_payment',
        'caisse_payments',
        'caisse_cloture',
        'factures_group',
        'factures_dashboard',
        'factures_new_invoice',
        'factures_all',
        'factures_draft',
        'factures_paid',
        'factures_unpaid',
        'factures_cancelled',
        'caisse_facture_group',
        'caisse_facture_dashboard',
        'caisse_facture_sessions',
        'caisse_facture_new_payment',
        'caisse_facture_new_invoice',
        'caisse_facture_all_invoices',
        'caisse_facture_all_payments',
        'caisse_facture_draft',
        'caisse_facture_paid',
        'caisse_facture_unpaid',
        'caisse_facture_cancelled',
        'caisse_facture_cloture',
        'infirmier_group',
        'infirmier_dashboard',
        'infirmier_queue',
        'infirmier_triage',
        'infirmier_vitals',
        'infirmier_prescriptions',
        'infirmier_referred',
        'infirmier_care',
        'medecin_group',
        'medecin_dashboard',
        'medecin_queue',
        'medecin_consultations',
        'medecin_dossiers',
        'medecin_prescriptions',
        'specialiste_group',
        'specialiste_dashboard',
        'specialiste_referred',
        'specialiste_consultations',
        'specialiste_followup',
        'specialiste_patients',
        'specialiste_prescriptions',
        'labo_group',
        'labo_dashboard',
        'labo_queue',
        'labo_sampling',
        'labo_in_progress',
        'labo_results',
        'labo_validation',
        'labo_catalog',
        'imagerie_group',
        'imagerie_dashboard',
        'imagerie_queue',
        'imagerie_scheduled',
        'imagerie_completed',
        'imagerie_reports',
        'imagerie_validation',
        'imagerie_prescriptions',
        'hospit_dashboard',
        'hospit_admissions',
        'hospit_patients',
        'hospit_beds',
        'hospit_transfers',
        'hospit_monitoring',
        'hospit_discharges',
        'admin_dashboard',
        'admin_users',
        'admin_roles',
        'admin_permissions',
        'admin_company',
        'admin_pricing',
        'admin_medical_settings',
        'admin_reports',
        'admin_audit',
        'consultations',
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
        'appointments',
        'bed_management',
        'letters_referrals',
        'care_plans',
        'transmissions',
        'nurse_schedule',
        'surgery_theater',
        'imaging_pacs',
        'pharmacy_dispensing',
        'sterilization_log',
        'quality_vigilance',
        'hr_management'
      ];
    }

    // 2. Laboratoire (Biologiste / Technicien) - 7 items
    if (
      login === 'laboratoire' ||
      login === 'dr.toure' ||
      login === 'technicien' ||
      groupIds.includes(5) ||
      role.includes('biologiste') ||
      role.includes('technicien') ||
      role.includes('laboratoire') ||
      department.includes('lab')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'labo_group',
        'labo_dashboard',
        'labo_queue',
        'labo_sampling',
        'labo_in_progress',
        'labo_results',
        'labo_validation',
        'labo_catalog',
        'lab_sampling',
        'lab_results',
        'lab_grouped_results',
        'products'
      ];
    }

    // 3. Imagerie Médicale (Radiologie & PACS) - 7 items
    if (
      login === 'imagerie' ||
      groupIds.includes(11) ||
      role.includes('imagerie') ||
      role.includes('radiologue') ||
      role.includes('radio') ||
      department.includes('imagerie') ||
      department.includes('radio')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'imagerie_group',
        'imagerie_dashboard',
        'imagerie_queue',
        'imagerie_scheduled',
        'imagerie_completed',
        'imagerie_reports',
        'imagerie_validation',
        'imagerie_prescriptions',
        'imaging_pacs'
      ];
    }

    // 4. Infirmier (Triage, Constantes, Soins) - 5 items
    if (
      login === 'infirmier' ||
      groupIds.includes(8) ||
      role.includes('infirmier') ||
      role.includes('infirmière') ||
      role.includes('nurse') ||
      department.includes('infirmier') ||
      department.includes('soins')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'infirmier_group',
        'infirmier_dashboard',
        'infirmier_queue',
        'infirmier_triage',
        'infirmier_vitals',
        'infirmier_prescriptions',
        'infirmier_referred',
        'infirmier_care',
        'consultations',
        'care_plans'
      ];
    }

    // 5. Médecin Spécialiste - 6 items
    if (
      login === 'specialiste' ||
      groupIds.includes(10) ||
      role.includes('spécialiste') ||
      role.includes('specialiste')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'specialiste_group',
        'specialiste_dashboard',
        'specialiste_referred',
        'specialiste_consultations',
        'specialiste_followup',
        'specialiste_patients',
        'specialiste_prescriptions',
        'consultations',
        'patient_dossiers',
        'partners'
      ];
    }

    // 6. Médecin Généraliste - 5 items
    if (
      login === 'medecin' ||
      groupIds.includes(9) ||
      role.includes('médecin') ||
      role.includes('medecin') ||
      role.includes('docteur') ||
      role.includes('dr.')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'medecin_group',
        'medecin_dashboard',
        'medecin_queue',
        'medecin_consultations',
        'medecin_dossiers',
        'medecin_prescriptions',
        'consultations',
        'patient_dossiers'
      ];
    }

    // 7. Gestionnaire Hospitalisation - 7 items
    if (
      login === 'hospitalisation' ||
      groupIds.includes(6) ||
      role.includes('hospit') ||
      department.includes('hospit')
    ) {
      return [
        'hospitalisation_module',
        'dashboard',
        'patient_journey',
        'hospit_dashboard',
        'hospit_admissions',
        'hospit_patients',
        'hospit_beds',
        'hospit_transfers',
        'hospit_monitoring',
        'hospit_discharges',
        'partners',
        'bed_management',
        'transmissions'
      ];
    }

    // 8. Superviseur Caisse / Facture - 6 items
    if (
      login === 'superviseur' ||
      role.includes('superviseur')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'superviseur_group',
        'superviseur_dashboard',
        'superviseur_sessions',
        'superviseur_invoices',
        'superviseur_caisses',
        'superviseur_payments',
        'superviseur_reports',
        'caisse_sessions',
        'invoices',
        'payments'
      ];
    }

    // 9. Caisse & Facture (Polyvalent) - 11 items
    if (
      login === 'caisse_facture' ||
      (role.includes('caisse') && role.includes('factur')) ||
      role.includes('polyvalent')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'caisse_facture_group',
        'caisse_facture_dashboard',
        'caisse_facture_new_payment',
        'caisse_facture_new_invoice',
        'caisse_facture_all_invoices',
        'caisse_facture_all_payments',
        'caisse_facture_draft',
        'caisse_facture_paid',
        'caisse_facture_unpaid',
        'caisse_facture_cancelled',
        'caisse_facture_cloture',
        'caisse_sessions',
        'invoices',
        'payments'
      ];
    }

    // 10. Factures (Facturier seul) - 7 items
    if (
      login === 'facturier' ||
      (role.includes('factur') && !role.includes('caisse'))
    ) {
      return [
        'dashboard',
        'patient_journey',
        'factures_group',
        'factures_dashboard',
        'factures_new_invoice',
        'factures_all',
        'factures_draft',
        'factures_paid',
        'factures_unpaid',
        'factures_cancelled',
        'invoices'
      ];
    }

    // 11. Caisse (Caissier seul) - 4 items
    if (
      login === 'caissier' ||
      (role.includes('caiss') && !role.includes('factur'))
    ) {
      return [
        'dashboard',
        'patient_journey',
        'caisse_group',
        'caisse_dashboard',
        'caisse_new_payment',
        'caisse_payments',
        'caisse_cloture',
        'caisse_sessions',
        'payments'
      ];
    }

    return ['dashboard', 'patient_journey'];
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
