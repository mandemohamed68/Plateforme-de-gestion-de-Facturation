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
        'pediatrie_group',
        'pediatrie_dashboard',
        'pediatrie_queue',
        'pediatrie_consultations',
        'pediatrie_vaccination',
        'pediatrie_croissance',
        'maternite_group',
        'maternite_dashboard',
        'maternite_cpn',
        'maternite_accouchements',
        'maternite_partogramme',
        'maternite_postpartum',
        'admin_services',
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
        'pharmacy_stock',
        'pharmacy_orders',
        'pharmacy_expired',
        'pharmacy_narcotics',
        'pharmacy_sales',
        'pharmacy_settings',
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

    // 6b. Pédiatrie & Santé Infantile
    if (
      login === 'pediatre' ||
      role.includes('pediat') ||
      department.includes('pediat') ||
      role.includes('enfant')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'pediatrie_group',
        'pediatrie_dashboard',
        'pediatrie_queue',
        'pediatrie_consultations',
        'pediatrie_vaccination',
        'pediatrie_croissance',
        'consultations',
        'patient_dossiers',
        'partners'
      ];
    }

    // 6c. Maternité & Obstétrique
    if (
      login === 'sage_femme' ||
      role.includes('sage') ||
      role.includes('mater') ||
      role.includes('gynec') ||
      department.includes('mater')
    ) {
      return [
        'dashboard',
        'patient_journey',
        'maternite_group',
        'maternite_dashboard',
        'maternite_cpn',
        'maternite_accouchements',
        'maternite_partogramme',
        'maternite_postpartum',
        'consultations',
        'patient_dossiers',
        'partners'
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

    // 8. Superviseur Caisse / Facture
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
        'caisse_sessions',
        'invoices',
        'payments'
      ];
    }

    // 9. Caisse & Facture (Polyvalent)
    if (
      login === 'caisse_facture' ||
      (role.includes('caisse') && role.includes('factur')) ||
      role.includes('polyvalent')
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
        'factures_group',
        'factures_dashboard',
        'factures_new_invoice',
        'factures_all',
        'factures_draft',
        'factures_paid',
        'factures_unpaid',
        'factures_cancelled',
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
    if (!result.includes('patient_dossiers')) {
      result.push('patient_dossiers');
    }
    if (result.includes('partners') && !result.includes('patient_dossiers')) {
      result.push('patient_dossiers');
    }
    if ((result.includes('company') || user?.permissions?.includes('can_manage_settings') || user?.permissions?.includes('all')) && !result.includes('flash_announcements')) {
      result.push('flash_announcements');
    }
    if (!result.includes('alert_settings')) {
      result.push('alert_settings');
    }
    if (!result.includes('notifications')) {
      result.push('notifications');
    }
    if (result.includes('pharmacy_dispensing') || result.includes('company') || user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('pharmac')) {
      const pharmViews: AppView[] = ['pharmacy_dispensing', 'pharmacy_stock', 'pharmacy_orders', 'pharmacy_expired', 'pharmacy_narcotics', 'pharmacy_sales', 'pharmacy_settings'];
      pharmViews.forEach(pv => {
        if (!result.includes(pv)) result.push(pv);
      });
    }
    return result;
  }
  return ['caisse_sessions', 'invoices', 'payments', 'partners', 'patient_dossiers', 'flash_announcements'];
}

/**
 * Maps any AppView to its required hospital service code (if modular).
 */
export function getServiceIdForView(view: string): string | null {
  if (view === 'patient_dossiers' || view === 'medecin_dossiers') return null; // Central Dossier Médical is always available across all practitioner disciplines
  if (view.startsWith('pediatrie_')) return 'pediatrie';
  if (view.startsWith('maternite_')) return 'maternite';
  if (view.startsWith('hospit_') || view === 'bed_management') return 'hospitalisation';
  if (view.startsWith('labo_') || view.startsWith('lab_')) return 'laboratoire';
  if (view.startsWith('imagerie_') || view === 'imaging_pacs') return 'imagerie';
  if (view.startsWith('pharmacy_')) return 'pharmacie';
  if (
    view.startsWith('caisse_') ||
    view.startsWith('factures_') ||
    view.startsWith('superviseur_') ||
    view === 'invoices' ||
    view === 'payments' ||
    view === 'caisse_sessions' ||
    view === 'insurance_claims'
  ) {
    return 'caisse_facturation';
  }
  if (view.startsWith('medecin_') || view === 'consultations') return 'medecine_generale';
  if (view.startsWith('specialiste_')) return 'specialiste';
  if (view.startsWith('infirmier_')) return 'urgences';
  return null;
}

/**
 * Checks if a specific hospital service is currently enabled in settings.
 */
export function isServiceActive(serviceId: string, company?: CompanySettings | null): boolean {
  if (company) {
    if (company.enabled_hospital_services && Array.isArray(company.enabled_hospital_services)) {
      return company.enabled_hospital_services.includes(serviceId);
    }
    if (company.hospital_services_config && Array.isArray(company.hospital_services_config) && company.hospital_services_config.length > 0) {
      const s = company.hospital_services_config.find((item) => item.id === serviceId);
      if (s) return Boolean(s.enabled);
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const local = localStorage.getItem('app_enabled_services_ids');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed.includes(serviceId);
      }
      const localConfig = localStorage.getItem('app_hospital_services_config');
      if (localConfig) {
        const parsedConfig = JSON.parse(localConfig);
        if (Array.isArray(parsedConfig)) {
          const s = parsedConfig.find((item: any) => item.id === serviceId);
          if (s) return Boolean(s.enabled);
        }
      }
    } catch (e) {}
  }
  return true;
}

/**
 * Checks if the given view is enabled in the current company configuration.
 */
export function isViewServiceActive(view: string, company?: CompanySettings | null): boolean {
  const srvId = getServiceIdForView(view);
  if (!srvId) return true;
  return isServiceActive(srvId, company);
}

