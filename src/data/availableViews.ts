import { AppView } from '../types';

export interface ViewDefinition {
  id: AppView | string;
  label: string;
  category: string;
}

export const AVAILABLE_VIEWS: ViewDefinition[] = [
  // ACCUEIL
  { id: 'dashboard', label: 'Tableau de bord principal', category: 'ACCUEIL' },
  { id: 'patient_journey', label: 'Parcours patient 360', category: 'ACCUEIL' },
  
  // FACTURATION - Superviseur
  { id: 'superviseur_group', label: 'Module Superviseur', category: 'FACTURATION' },
  { id: 'superviseur_dashboard', label: 'Dashboard Superviseur', category: 'FACTURATION' },
  { id: 'superviseur_sessions', label: 'Suivi des sessions', category: 'FACTURATION' },
  { id: 'superviseur_invoices', label: 'Suivi des factures', category: 'FACTURATION' },
  { id: 'superviseur_caisses', label: 'Suivi des caisses', category: 'FACTURATION' },
  { id: 'superviseur_payments', label: 'Contrôle des encaissements', category: 'FACTURATION' },
  { id: 'superviseur_reports', label: 'Rapports financiers', category: 'FACTURATION' },
  
  // FACTURATION - Caisse
  { id: 'caisse_group', label: 'Module Caisse', category: 'FACTURATION' },
  { id: 'caisse_dashboard', label: 'Dashboard Caisse', category: 'FACTURATION' },
  { id: 'caisse_new_payment', label: 'Nouvel encaissement', category: 'FACTURATION' },
  { id: 'caisse_payments', label: 'Historique encaissements', category: 'FACTURATION' },
  { id: 'caisse_cloture', label: 'Clôture de caisse', category: 'FACTURATION' },
  { id: 'caisse_sessions', label: 'Gestion des vacations', category: 'FACTURATION' },
  
  // FACTURATION - Factures
  { id: 'factures_group', label: 'Module Facturation', category: 'FACTURATION' },
  { id: 'factures_dashboard', label: 'Dashboard Facturation', category: 'FACTURATION' },
  { id: 'factures_new_invoice', label: 'Nouvelle facture', category: 'FACTURATION' },
  { id: 'factures_all', label: 'Toutes les factures', category: 'FACTURATION' },
  { id: 'factures_draft', label: 'Factures brouillons', category: 'FACTURATION' },
  { id: 'factures_paid', label: 'Factures payées', category: 'FACTURATION' },
  { id: 'factures_unpaid', label: 'Factures impayées', category: 'FACTURATION' },
  { id: 'factures_cancelled', label: 'Factures annulées', category: 'FACTURATION' },
  { id: 'insurance_claims', label: 'Bordereaux Assurances', category: 'FACTURATION' },
  { id: 'invoices', label: 'Registre des factures (Admin)', category: 'FACTURATION' },
  { id: 'payments', label: 'Registre des paiements (Admin)', category: 'FACTURATION' },
  { id: 'partners', label: 'Gestion des tiers-payeurs', category: 'FACTURATION' },

  // MÉDICAL - Infirmier
  { id: 'infirmier_group', label: 'Module Infirmier', category: 'MÉDICAL' },
  { id: 'infirmier_dashboard', label: 'Dashboard Infirmier', category: 'MÉDICAL' },
  { id: 'infirmier_queue', label: 'File d\'attente soins', category: 'MÉDICAL' },
  { id: 'infirmier_triage', label: 'Triage Urgences', category: 'MÉDICAL' },
  { id: 'infirmier_vitals', label: 'Prise de constantes', category: 'MÉDICAL' },
  { id: 'infirmier_prescriptions', label: 'Prescriptions infirmières', category: 'MÉDICAL' },
  { id: 'infirmier_referred', label: 'Orientation patients', category: 'MÉDICAL' },
  { id: 'infirmier_care', label: 'Actes & Soins', category: 'MÉDICAL' },
  { id: 'care_plans', label: 'Plans de soins', category: 'MÉDICAL' },

  // MÉDICAL - Médecin
  { id: 'medecin_group', label: 'Module Médecin', category: 'MÉDICAL' },
  { id: 'medecin_dashboard', label: 'Dashboard Médecin', category: 'MÉDICAL' },
  { id: 'medecin_queue', label: 'File d\'attente consultations', category: 'MÉDICAL' },
  { id: 'medecin_consultations', label: 'Historique consultations', category: 'MÉDICAL' },
  { id: 'medecin_dossiers', label: 'Dossiers médicaux', category: 'MÉDICAL' },
  { id: 'medecin_prescriptions', label: 'Ordonnances médicales', category: 'MÉDICAL' },
  { id: 'consultations', label: 'Registre consultations (Admin)', category: 'MÉDICAL' },
  { id: 'patient_dossiers', label: 'Dossier Patient Central (DPI)', category: 'MÉDICAL' },

  // MÉDICAL - Spécialiste
  { id: 'specialiste_group', label: 'Module Spécialiste', category: 'MÉDICAL' },
  { id: 'specialiste_dashboard', label: 'Dashboard Spécialiste', category: 'MÉDICAL' },
  { id: 'specialiste_referred', label: 'Avis spécialisés demandés', category: 'MÉDICAL' },
  { id: 'specialiste_consultations', label: 'Consultations spécialisées', category: 'MÉDICAL' },
  { id: 'specialiste_followup', label: 'Suivi chronique', category: 'MÉDICAL' },
  { id: 'specialiste_patients', label: 'Ma patientèle', category: 'MÉDICAL' },

  // PÉDIATRIE
  { id: 'pediatrie_group', label: 'Module Pédiatrie', category: 'PÉDIATRIE' },
  { id: 'pediatrie_dashboard', label: 'Dashboard Pédiatrie', category: 'PÉDIATRIE' },
  { id: 'pediatrie_queue', label: 'File attente pédiatrique', category: 'PÉDIATRIE' },
  { id: 'pediatrie_consultations', label: 'Consultations enfant', category: 'PÉDIATRIE' },
  { id: 'pediatrie_vaccination', label: 'Vaccination PEV', category: 'PÉDIATRIE' },
  { id: 'pediatrie_croissance', label: 'Courbes de croissance', category: 'PÉDIATRIE' },

  // MATERNITÉ
  { id: 'maternite_group', label: 'Module Maternité', category: 'MATERNITÉ' },
  { id: 'maternite_dashboard', label: 'Dashboard Maternité', category: 'MATERNITÉ' },
  { id: 'maternite_cpn', label: 'Suivi CPN', category: 'MATERNITÉ' },
  { id: 'maternite_accouchements', label: 'Registre Accouchements', category: 'MATERNITÉ' },
  { id: 'maternite_partogramme', label: 'Partogramme en ligne', category: 'MATERNITÉ' },
  { id: 'maternite_postpartum', label: 'Suivi Post-Partum', category: 'MATERNITÉ' },

  // EXAMENS - Laboratoire
  { id: 'labo_group', label: 'Module Laboratoire', category: 'EXAMENS' },
  { id: 'labo_dashboard', label: 'Dashboard LIMS', category: 'EXAMENS' },
  { id: 'labo_queue', label: 'File attente Labo', category: 'EXAMENS' },
  { id: 'labo_sampling', label: 'Poste de prélèvement', category: 'EXAMENS' },
  { id: 'labo_in_progress', label: 'Suivi automates / Séries', category: 'EXAMENS' },
  { id: 'labo_results', label: 'Saisie des résultats', category: 'EXAMENS' },
  { id: 'labo_validation', label: 'Validation biologique', category: 'EXAMENS' },
  { id: 'labo_catalog', label: 'Catalogue d\'examens', category: 'EXAMENS' },
  { id: 'lab_sampling', label: 'Registre prélèvements', category: 'EXAMENS' },
  { id: 'lab_results', label: 'Registre résultats', category: 'EXAMENS' },
  { id: 'lab_grouped_results', label: 'Validations groupées', category: 'EXAMENS' },

  // EXAMENS - Imagerie
  { id: 'imagerie_group', label: 'Module Imagerie', category: 'EXAMENS' },
  { id: 'imagerie_dashboard', label: 'Dashboard RIS', category: 'EXAMENS' },
  { id: 'imagerie_queue', label: 'File attente Radio', category: 'EXAMENS' },
  { id: 'imagerie_scheduled', label: 'Planning examens', category: 'EXAMENS' },
  { id: 'imagerie_completed', label: 'Examens réalisés', category: 'EXAMENS' },
  { id: 'imagerie_reports', label: 'Comptes-rendus radio', category: 'EXAMENS' },
  { id: 'imagerie_validation', label: 'Validation Radiologue', category: 'EXAMENS' },
  { id: 'imaging_pacs', label: 'Visionneuse PACS/DICOM', category: 'EXAMENS' },

  // PHARMACIE
  { id: 'pharmacy_group', label: 'Module Pharmacie', category: 'PHARMACIE' },
  { id: 'pharmacy_dispensing', label: 'Dispensation ordonnances', category: 'PHARMACIE' },
  { id: 'pharmacy_stock', label: 'Gestion des stocks', category: 'PHARMACIE' },
  { id: 'pharmacy_orders', label: 'Commandes & Achats', category: 'PHARMACIE' },
  { id: 'pharmacy_expired', label: 'Gestion des périmés', category: 'PHARMACIE' },
  { id: 'pharmacy_narcotics', label: 'Registre stupéfiants', category: 'PHARMACIE' },
  { id: 'pharmacy_sales', label: 'Vente comptoir', category: 'PHARMACIE' },
  { id: 'pharmacy_settings', label: 'Configuration pharmacie', category: 'PHARMACIE' },

  // HOSPITALISATION
  { id: 'hospit_dashboard', label: 'Dashboard Hospitalisation', category: 'HOSPITALISATION' },
  { id: 'hospit_admissions', label: 'Admissions au lit', category: 'HOSPITALISATION' },
  { id: 'hospit_patients', label: 'Liste des hospitalisés', category: 'HOSPITALISATION' },
  { id: 'hospit_beds', label: 'Gestion des lits', category: 'HOSPITALISATION' },
  { id: 'hospit_transfers', label: 'Mouvements & Transferts', category: 'HOSPITALISATION' },
  { id: 'hospit_monitoring', label: 'Surveillance clinique', category: 'HOSPITALISATION' },
  { id: 'hospit_discharges', label: 'Sorties & Exéat', category: 'HOSPITALISATION' },

  // ADMINISTRATION
  { id: 'admin_dashboard', label: 'Dashboard Administration', category: 'ADMINISTRATION' },
  { id: 'admin_services', label: 'Activation des modules', category: 'ADMINISTRATION' },
  { id: 'admin_users', label: 'Comptes Utilisateurs', category: 'ADMINISTRATION' },
  { id: 'admin_roles', label: 'Rôles & Permissions Menus', category: 'ADMINISTRATION' },
  { id: 'admin_permissions', label: 'Permissions granulaires', category: 'ADMINISTRATION' },
  { id: 'admin_company', label: 'Paramètres Établissement', category: 'ADMINISTRATION' },
  { id: 'admin_pricing', label: 'Gestion des tarifs', category: 'ADMINISTRATION' },
  { id: 'admin_medical_settings', label: 'Configuration clinique', category: 'ADMINISTRATION' },
  { id: 'admin_reports', label: 'Rapports d\'activité', category: 'ADMINISTRATION' },
  { id: 'admin_audit', label: 'Journal d\'audit système', category: 'ADMINISTRATION' },
  { id: 'logs_audit', label: 'Logs techniques', category: 'ADMINISTRATION' },
  { id: 'schema', label: 'Schéma Base de données', category: 'ADMINISTRATION' },
  { id: 'users', label: 'Registre Utilisateurs', category: 'ADMINISTRATION' },
  { id: 'company', label: 'Identité visuelle', category: 'ADMINISTRATION' },
  { id: 'flash_announcements', label: 'Messages Flash', category: 'ADMINISTRATION' },
  { id: 'notifications', label: 'Notifications système', category: 'ADMINISTRATION' },
  { id: 'alert_settings', label: 'Seuils d\'alerte', category: 'ADMINISTRATION' },
  { id: 'scenarios_s01_s50', label: 'Simulateur Scénarios S01-S50', category: 'ADMINISTRATION' },
];
