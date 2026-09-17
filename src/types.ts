/**
 * Plateforme de Facturation & Gestion Commerciale
 * Modèle de données relationnel d'entreprise
 */

export interface PaymentMethodItem {
  id: string; // e.g. 'cash', 'wave', 'orange_money', 'moov_money', 'card', 'check', 'transfer', 'insurance', 'custom_1'
  name: string; // e.g. 'Wave Mobile Money'
  icon: string; // emoji or icon name e.g. '📱', '💵', '💳', '🏦', '🛡️'
  category: 'cash' | 'mobile_money' | 'card' | 'bank' | 'insurance' | 'other';
  enabled: boolean;
  account_number?: string; // Merchant number or RIB or Till number
  merchant_id?: string; // Aggregator merchant ID
  instruction_note?: string; // e.g. "Scannez le QR Code Wave ou composez le code marchand"
  fee_percentage?: number; // e.g. 1%
  is_custom?: boolean;
}

export interface FlashAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'promo';
  active: boolean;
  priority?: number;
  start_date?: string;
  end_date?: string;
  link_url?: string;
  target_profiles?: string[]; // ['all'] or ['facture', 'caisse', 'labo', 'comptabilite', 'direction', 'admin']
}

export interface CompanySettings {
  name: string;
  slogan: string;
  logo_url: string;
  primary_color: string;
  sidebar_color?: string; // Custom sidebar background color
  secondary_color?: string; // Optional secondary accent color
  header_style?: 'solid' | 'gradient' | 'minimal';
  theme_mode?: 'brand' | 'dark' | 'custom';
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  country: string;
  rccm: string;
  tax_id: string; // N° Compte Contribuable / IFU
  vat?: string;
  health_accreditation_number?: string; // N° Agrément Ministère de la Santé
  currency_symbol: string;
  default_tax_rate: number;
  tax_exemption_default_reason?: string;
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  bank_account?: string;
  mobile_money_numbers?: string;
  enabled_payment_methods?: string[]; // e.g. ['cash', 'wave', 'orange_money', 'moov_money', 'card', 'check', 'transfer', 'insurance']
  payment_method_items?: PaymentMethodItem[]; // Custom payment methods CRUD list
  
  // Watermark Settings
  show_watermark?: boolean; // Toggling watermark on/off
  watermark_text?: string; // e.g. "LABORATOIRE - DOCUMENT OFFICIEL"
  watermark_type?: 'logo' | 'text' | 'both';
  watermark_opacity?: number; // e.g. 0.05 to 0.50
  watermark_position?: 'center' | 'diagonal' | 'tile';

  // Flash Info / Announcement Ticker
  flash_news_enabled?: boolean;
  flash_news_speed?: number; // duration in seconds
  flash_announcements?: FlashAnnouncement[];

  medical_director_name?: string; // Nom du biologiste médical / directeur
  lab_turnaround_default?: string; // Délai d'analyse par défaut
  invoice_footer: string;
  footer_note?: string;

  // Dossier structuring configuration (Back-Office / Admin)
  ndm_prefix?: string; // Prefix (ex: CHU-, NDM-, DOS-)
  ndm_digits?: number; // Zero-padding length (ex: 6, 8)
  ndm_next_number?: number; // Next sequential dossier number

  // Pagination Configuration (Back-Office / Admin)
  default_page_size?: number; // e.g. 25, 50, 100, 200 (default 50)

  // Security & Session Inactivity Configuration
  session_timeout_minutes?: number; // Inactivity timeout in minutes before auto-logout (default 15, 0 = disabled)

  // Sandbox vs Production Mode Configuration
  is_sandbox?: boolean; // Whether LIMS is in sandbox (simulated/test) or production (live) mode

  // Granular Formatting & Document Customizer (Back-Office / Admin)
  currency_position?: 'after' | 'before';
  thousand_separator?: 'space' | 'dot' | 'comma';
  signature_title_biologist?: string;
  signature_title_cashier?: string;
  invoice_title_paid?: string;
  invoice_title_posted?: string;
  invoice_title_draft?: string;
}

export interface ResGroup {
  id: number;
  name: string; // e.g. "Administrateur", "Biologiste Médical", "Technicien Labo", "Caissier", "Comptable"
  description: string | null;
  permissions?: string[]; // Exhaustive permissions
  created_at: string;
}

export interface ResUser {
  id: number;
  login: string;
  password?: string;
  password_hash?: string;
  name: string;
  email: string | null;
  active: boolean;
  partner_id: number | null;
  role?: string;
  department?: string; // e.g. "Laboratoire", "Caisse & Accueil", "Direction", "Comptabilité"
  permissions?: string[];
  allowed_views?: string[]; // Custom navigation menu permissions override
  created_at: string;
  updated_at: string;
  // Computed / expanded fields
  group_ids?: number[];
  partner_name?: string;
}

export interface ResPartner {
  id: number;
  name: string;
  is_company: boolean;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country_id: number | null;
  vat: string | null;
  customer_rank: number; // >0 if customer
  supplier_rank: number; // >0 if supplier
  active: boolean;
  created_at: string;
  updated_at: string;
  // Medical & Insurance / Tiers-Payeur extensions
  ndm?: string | null;
  partner_type?: 'patient' | 'insurance' | 'prescriber' | 'company' | 'supplier';
  is_insurance?: boolean;
  convention_code?: string | null; // N° convention assurance (ex: CONV-AXA-2026)
  default_coverage_rate?: number; // Taux de prise en charge par défaut (ex: 80%)
  insurance_id?: number | null; // Pour un patient : assurance de rattachement
  insurance_name?: string | null;
  insurance_policy_number?: string | null; // N° carte / matricule assuré
  insurance_coverage_rate?: number; // Taux spécifique pour ce patient
  prescribing_doctor?: string | null;
  gender?: 'M' | 'F' | 'Autre' | null;
  birth_date?: string | null;
  age?: number | null;
  // Fields from the patient creation image
  first_name?: string | null; // Prénoms
  maiden_name?: string | null; // Nom de jeune fille
  profession?: string | null; // Profession
  birth_place?: string | null; // Lieu de naissance
  civil_status?: string | null; // Statut matrimonial
  nationality?: string | null; // Nationalité
  religion?: string | null; // Religion
  region?: string | null; // Région
  province?: string | null; // Province
  department?: string | null; // Département
  commune?: string | null; // Commune/Village
  cnib?: string | null; // CNIB
  home_phone?: string | null; // Tél. domicile
  patient_class?: string | null; // Type patient (ex: Interne, Externe)
  contact_person_name?: string | null; // Personne de contact : Nom et prénom
  contact_person_relationship?: string | null; // Personne de contact : Lien avec le patient
  contact_person_phone?: string | null; // Personne de contact : Tél.
  patient_photo?: string | null; // Base64 or placeholder URL for portrait photo
  allergies?: string | string[] | null;
  antecedents?: string | string[] | null;
  blood_group?: string | null;
  // Computed balance summary
  country_name?: string;
  total_invoiced?: number;
  total_residual?: number;
}

export interface UomUom {
  id: number;
  name: string; // e.g., "Unités", "Heures", "Jours", "Kg"
  factor: number;
}

export interface LabSubTest {
  name: string;
  unit: string;
  reference_range: string;
}

export interface ProductTemplate {
  id: number;
  name: string;
  description: string | null;
  list_price: number;
  prix_tm?: number; // Prix Ticket Modérateur
  prix_hp?: number; // Prix Hors Patient / Privé
  uom_id: number | null;
  currency_id: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Computed/Expanded
  uom_name?: string;
  // Medical Analysis Laboratory & Hospital Prestations fields
  category_type?: 'service' | 'lab_exam' | 'lab_profile' | 'medication' | 'imaging' | 'hospitalization';
  lab_department?: string; // Hématologie, Biochimie, Sérologie, etc.
  lab_sample_type?: string; // Tube EDTA, Tube Sec, Urines, etc.
  lab_reference_range?: string; // ex: "70 - 110 mg/dL"
  lab_turnaround_time?: string; // ex: "2 heures", "24h"
  lab_profile_exams?: string[]; // Liste des examens inclus si Profil/Bilan
  lab_tests?: LabSubTest[]; // List of sub-tests/parameters for this exam
}

export interface ProductProduct {
  id: number;
  product_tmpl_id: number;
  default_code: string | null;
  barcode: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Expanded fields from template
  name?: string;
  description?: string | null;
  list_price?: number;
  prix_tm?: number; // Prix Ticket Modérateur
  prix_hp?: number; // Prix Hors Patient / Privé
  uom_id?: number | null;
  // Medical Analysis Laboratory & Hospital Prestations fields
  category_type?: 'service' | 'lab_exam' | 'lab_profile' | 'medication' | 'imaging' | 'hospitalization';
  lab_department?: string;
  lab_sample_type?: string;
  lab_reference_range?: string;
  lab_turnaround_time?: string;
  lab_profile_exams?: string[];
  lab_tests?: LabSubTest[]; // List of sub-tests/parameters for this exam
}

export interface AccountTax {
  id: number;
  name: string; // e.g., "TVA 20%", "TVA 10%", "TVA 5.5%"
  description: string | null;
  amount: number; // percentage (e.g., 20.00)
  type_tax_use: 'sale' | 'purchase' | 'all';
  active: boolean;
  company_id: number | null;
  created_at: string;
  updated_at: string;
}

export type MoveType = 'out_invoice' | 'in_invoice' | 'out_refund' | 'in_refund';
export type MoveState = 'draft' | 'posted' | 'cancel';
export type PaymentState = 'not_paid' | 'paid' | 'partial';

export interface AccountMove {
  id: number;
  name: string | null; // e.g. "FAC/2026/0001"
  ref: string | null;
  move_type: MoveType;
  state: MoveState;
  partner_id: number;
  invoice_date: string | null;
  date: string;
  invoice_date_due: string | null;
  currency_id: number | null;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  amount_residual: number;
  payment_state: PaymentState;
  invoice_user_id: number | null;
  fiscal_position_id: number | null;
  company_id: number | null;
  created_at: string;
  updated_at: string;
  created_by_name?: string | null;
  invoice_user_name?: string | null;
  // Tax exemption & Insurance / Tiers-Payeur fields
  is_tax_exempt?: boolean;
  tax_exemption_reason?: string | null;
  insurance_enabled?: boolean;
  insurance_name?: string | null;
  insurance_policy_number?: string | null;
  insurance_coverage_rate?: number;
  insurance_amount?: number;
  client_share_amount?: number;
  // Medical billing extension fields from TARIFICATION image
  ndm?: string | null;
  patient_name?: string | null;
  patient_phone?: string | null;
  patient_age_y?: number | null;
  patient_age_m?: number | null;
  patient_age_d?: number | null;
  medical_service?: string | null;
  cancel_reason?: string | null;
  till_session_id?: number | null;
  session_id?: number | null;
  prescribing_doctor?: string | null;
  is_prescription_invoice?: boolean;
  consultation_id?: number | null;
  // Expanded relations
  partner?: ResPartner;
  invoice_user?: ResUser;
  currency?: ResCurrency;
  lines?: AccountMoveLine[];
  payments?: AccountPayment[];
}

export interface AccountMoveLine {
  id: number;
  move_id: number;
  partner_id: number | null;
  product_id: number | null;
  account_id: number | null;
  tax_ids: number[];
  tax_rate?: number;
  name: string | null;
  quantity: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  discount: number;
  debit: number;
  credit: number;
  balance: number;
  sequence: number;
  created_at: string;
  updated_at: string;
  // Expanded relations
  product_name?: string;
  product_code?: string;
}

export interface AccountPayment {
  id: number;
  name?: string;
  user_id?: number | null;
  move_id: number | null;
  partner_id: number | null;
  journal_id: number | null; // 1: Banque, 2: Caisse
  payment_method_id: number | null;
  session_id?: number | null; // Associated Caisse Session
  amount: number;
  payment_date: string;
  state: 'draft' | 'posted' | 'reconciled';
  created_at: string;
  updated_at: string;
  // Expanded
  partner_name?: string;
  move_name?: string;
  journal_name?: string;
  payment_method_code?: string;
  till_session_id?: number | null;
  payment_type?: string;
  partner_type?: string;
  date?: string;
  payment_method_line_id?: number;
}

export interface ResCurrency {
  id: number;
  name: string; // EUR, USD, XOF, etc.
  symbol: string | null; // €, $, FCFA
  active: boolean;
}

export interface ResCountry {
  id: number;
  name: string;
  code: string;
}

export interface EmailNotification {
  id: number;
  move_id: number;
  partner_id: number;
  recipient_email: string;
  subject: string;
  type: 'reminder_overdue' | 'invoice_send' | 'payment_receipt';
  status: 'sent' | 'delivered' | 'failed';
  sent_at: string;
  partner_name?: string;
  move_name?: string;
  amount?: number;
}

export interface AnalyticsSummary {
  total_revenue_ht: number;
  total_revenue_ttc: number;
  total_paid: number;
  total_residual: number;
  total_overdue: number;
  invoice_count: number;
  paid_count: number;
  draft_count: number;
  overdue_count: number;
  monthly_revenue: { month: string; ht: number; ttc: number; paid: number }[];
  top_partners: { name: string; invoiced: number; paid: number; residual: number }[];
  tax_summary: { tax_name: string; rate: number; total_tax_amount: number }[];
  payment_journals: { journal_name: string; total_amount: number; count: number }[];
}

export type AnalyticsData = AnalyticsSummary;

export type LabResultStatus = 'pending_sampling' | 'in_progress' | 'results_entered' | 'validated' | 'rejected' | 'accepted' | 'saisi' | 'valide_tech' | 'valide_biologiste' | 'envoye';

export interface LabParameterResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal?: boolean;
  notes?: string;
  source?: 'manuelle' | 'automate';
  automate_statut?: string;
  date_import?: string;
  raw_data?: any;
}

export interface LabExamOrder {
  id: number;
  order_number: string; // ex: "LAB-2026-0042"
  partner_id: number;
  partner_name: string;
  patient_gender?: string; // 'M' | 'F'
  patient_age?: number;
  prescribing_doctor?: string;
  sampling_date: string;
  status: LabResultStatus;
  department: string; // Hématologie, Biochimie, etc.
  exam_names: string[];
  parameters: LabParameterResult[];
  conclusion?: string;
  technician_name?: string;
  technician_id?: number;
  validated_by_doctor?: string;
  validated_by_id?: number;
  validated_at?: string;
  invoice_id?: number;
  total_amount?: number;
  company_id?: number;
  created_at: string;
  updated_at: string;

  // New Workflow Automation Fields from workflow_automatique.sql
  preleve_par?: string;
  preleve_le?: string;
  accepte_par?: string;
  accepte_le?: string;
  code_barre?: string;
  qr_code?: string;
  automate_envoye?: boolean;
  automate_recu?: boolean;
  priorite?: 'normale' | 'urgente';
  statut_workflow?: 'paye' | 'preleve' | 'accepte' | 'analyse' | 'valide_tech' | 'valide_biologiste' | 'envoye';

  // Results rendering and notification fields
  pdf_path?: string;
  pdf_signe?: boolean;
  hash_signature?: string;
  envoye_email?: boolean;
  envoye_sms?: boolean;
  envoye_portail?: boolean;
  date_envoi?: string;
  destinataires?: string;
}

export type TillSessionState = 'new' | 'in_progress' | 'closed';

export interface TillSessionTransaction {
  id: number;
  session_id: number;
  date: string;
  reference: string; // e.g. "202600008090" / "FAC/2026/0042"
  ndm?: string; // N° dossier médical / patient ID (ex: "00015550")
  patient_name: string;
  amount: number;
  payment_method: string; // "Espèces", "Wave Mobile Money", "Orange Money", "Carte Bancaire", "Chèque", "Prise en Charge"
  payment_method_code?: string; // 'cash', 'wave', 'orange_money', 'card', etc.
  type: 'invoice' | 'prepayment' | 'cash_in' | 'cash_out';
  state: 'posted' | 'reconciled' | 'cancel';
  cashier_name: string;
  id_line?: string; // ID pour affichage (ex: "8 272")
}

export interface TillSessionActivityLog {
  id: string;
  timestamp: string;
  author: string;
  message: string;
  type?: 'status_change' | 'creation' | 'payment' | 'closure' | 'note';
}

export interface TillSession {
  id: number;
  session_code: string; // e.g., "SESSION00793"
  till_name: string; // e.g. "Caisse 1"
  cashier_id: number;
  cashier_name: string;
  state: TillSessionState;
  opening_date: string; // e.g. "10/09/2026 08:30"
  closing_date?: string | null; // e.g. "10/09/2026 18:00"
  opening_balance: number; // Fond de caisse initial (ex: 50000 FCFA)
  closing_actual_cash?: number | null; // Espèces comptées physiquement
  closing_expected_cash?: number; // Fond de caisse + Ventes espèces
  total_cash_collected: number;
  total_mobile_money_collected: number;
  total_card_collected: number;
  total_check_collected: number;
  total_collected: number; // Total général encaissé
  cash_variance?: number; // Écart de caisse (+ excédent, - manquant)
  notes?: string;
  created_at: string;
  updated_at: string;
  transactions: TillSessionTransaction[];
  activity_logs?: TillSessionActivityLog[];
}

export interface WorkflowLogEntry {
  id: number;
  echantillon_id: number;
  resultat_id?: number;
  etape: string;
  etat_avant?: string;
  etat_apres?: string;
  acteur_nom?: string;
  commentaire?: string;
  date_action: string;
}

export interface NotificationQueueEntry {
  id: number;
  type: string; // 'email' | 'sms' | 'portail' | 'automate'
  destinataire: string;
  sujet?: string;
  message?: string;
  piece_jointe?: string;
  echantillon_id?: number;
  resultat_id?: number;
  statut: string; // 'en_attente' | 'envoye' | 'erreur'
  date_creation: string;
  date_envoi?: string;
}

export type AppView =
  | 'dashboard'
  | 'consultations'
  | 'invoices'
  | 'payments'
  | 'caisse_sessions'
  | 'insurance_claims'
  | 'partners'
  | 'patient_dossiers'
  | 'lab_results'
  | 'lab_sampling'
  | 'lab_grouped_results'
  | 'products'
  | 'users'
  | 'company'
  | 'flash_announcements'
  | 'notifications'
  | 'logs_audit'
  | 'schema'
  // Scénarios Hospitaliers (S01 à S50) selon specification_hopital.txt:
  | 'scenarios_s01_s50'
  // Patient 360 & Journey:
  | 'patient_journey'
  // Custom SIH views requested by the user:
  | 'appointments'
  | 'bed_management'
  | 'letters_referrals'
  | 'care_plans'
  | 'transmissions'
  | 'nurse_schedule'
  | 'surgery_theater'
  | 'imaging_pacs'
  | 'pharmacy_dispensing'
  | 'sterilization_log'
  | 'quality_vigilance'
  | 'hr_management'
  // Profile 1: Facturation Superviseur
  | 'superviseur_dashboard'
  | 'superviseur_sessions'
  | 'superviseur_invoices'
  | 'superviseur_caisses'
  | 'superviseur_payments'
  | 'superviseur_reports'
  // Profile 2: Facturation Caisse
  | 'caisse_dashboard'
  | 'caisse_new_payment'
  | 'caisse_payments'
  | 'caisse_cloture'
  // Profile 3: Facturation Factures
  | 'factures_dashboard'
  | 'factures_new_invoice'
  | 'factures_all'
  | 'factures_draft'
  | 'factures_paid'
  | 'factures_unpaid'
  | 'factures_cancelled'
  // Profile 4: Facturation Caisse & Facture
  | 'caisse_facture_dashboard'
  | 'caisse_facture_sessions'
  | 'caisse_facture_new_payment'
  | 'caisse_facture_new_invoice'
  | 'caisse_facture_all_invoices'
  | 'caisse_facture_all_payments'
  | 'caisse_facture_draft'
  | 'caisse_facture_paid'
  | 'caisse_facture_unpaid'
  | 'caisse_facture_cancelled'
  | 'caisse_facture_cloture'
  // Profile 5: Médical Infirmier
  | 'infirmier_dashboard'
  | 'infirmier_queue'
  | 'infirmier_triage'
  | 'infirmier_vitals'
  | 'infirmier_prescriptions'
  | 'infirmier_referred'
  | 'infirmier_care'
  // Profile 6: Médical Médecin (Généraliste)
  | 'medecin_dashboard'
  | 'medecin_queue'
  | 'medecin_consultations'
  | 'medecin_dossiers'
  | 'medecin_prescriptions'
  // Profile 7: Médical Médecin Spécialiste
  | 'specialiste_dashboard'
  | 'specialiste_referred'
  | 'specialiste_consultations'
  | 'specialiste_followup'
  | 'specialiste_patients'
  | 'specialiste_prescriptions'
  // Profile 8: Examens Laboratoire
  | 'labo_dashboard'
  | 'labo_queue'
  | 'labo_sampling'
  | 'labo_in_progress'
  | 'labo_results'
  | 'labo_validation'
  | 'labo_catalog'
  // Profile 9: Examens Imagerie
  | 'imagerie_dashboard'
  | 'imagerie_queue'
  | 'imagerie_scheduled'
  | 'imagerie_completed'
  | 'imagerie_reports'
  | 'imagerie_validation'
  | 'imagerie_prescriptions'
  // Profile 10: Hospitalisation
  | 'hospit_dashboard'
  | 'hospit_admissions'
  | 'hospit_patients'
  | 'hospit_beds'
  | 'hospit_transfers'
  | 'hospit_monitoring'
  | 'hospit_discharges'
  // Profile 11: Administration
  | 'admin_dashboard'
  | 'admin_users'
  | 'admin_roles'
  | 'admin_permissions'
  | 'admin_company'
  | 'admin_pricing'
  | 'admin_medical_settings'
  | 'admin_reports'
  | 'admin_audit'
  // Navigation Groups (Hierarchical)
  | 'superviseur_group'
  | 'caisse_group'
  | 'factures_group'
  | 'caisse_facture_group'
  | 'infirmier_group'
  | 'medecin_group'
  | 'specialiste_group'
  | 'labo_group'
  | 'imagerie_group'
  | 'hospitalisation_module'
  | 'admin_module'
  | 'accueil_module';

export interface PartnerReduction {
  id: number;
  patient_type: string; // e.g. "Patient assuré 100%"
  category_name: string; // e.g. "All"
  reduction_rate: number; // e.g. 100.00, 80.00, 75.00
  active: boolean;
  created_at?: string;
}

export interface MedicalVitals {
  temperature?: number | null; // ex: 37.2 °C
  bp_systolic?: number | null; // ex: 120 mmHg
  bp_diastolic?: number | null; // ex: 80 mmHg
  blood_pressure_systolic?: number | null; // alias
  blood_pressure_diastolic?: number | null; // alias
  heart_rate?: number | null; // ex: 72 bpm
  respiratory_rate?: number | null; // ex: 18 /min
  oxygen_saturation?: number | null; // alias for spo2
  weight?: number | null; // ex: 70 kg
  height?: number | null; // ex: 175 cm
  bmi?: number | null; // IMC calculé
  spo2?: number | null; // ex: 98 %
  blood_sugar?: number | null; // ex: 0.95 g/L
  pain_level?: number | null; // 0 à 10
  triage_level?: 'normal' | 'urgent' | 'critique';
  vitals_notes?: string | null;
  taken_by_name?: string | null;
  nurse_name?: string | null; // alias
  taken_at?: string | null;
  recorded_at?: string | null; // alias
}

export interface PrescribedItem {
  id: string;
  type: 'lab_exam' | 'imaging' | 'medication' | 'act';
  product_id?: number | null;
  name: string;
  category?: string;
  price_unit: number;
  quantity: number;
  total_price: number;
  instructions?: string; // Posologie ou consigne (ex: "1 cp matin et soir pendant 7 jours")
  dosage?: string; // ex: "1g"
  duration?: string; // ex: "7 jours"
  workflow_status?: 'pending' | 'confirmed' | 'cancelled' | 'postponed';
  item_name?: string; // alias for name
  unit_price?: number; // alias for price_unit
}

export interface MedicalConsultation {
  id: number;
  consultation_number: string; // ex: "CONS-2026-0012"
  partner_id: number; // Patient
  patient_name: string;
  patient_ndm?: string | null;
  patient_gender?: string | null;
  patient_age?: number | null;
  patient_phone?: string | null;
  insurance_name?: string | null;
  insurance_coverage_rate?: number | null;
  doctor_id?: number | null;
  doctor_name: string;
  specialty?: string | null; // ex: "Médecine Générale", "Pédiatrie", "Cardiologie"
  consultation_date: string; // ISO String
  status: 'pending_payment' | 'triage' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'referred' | 'transferred';
  chief_complaint: string; // Motif de consultation
  history_of_present_illness?: string | null; // Anamnèse / Histoire de la maladie
  medical_history?: string | null; // Antécédents
  allergies?: string | null; // Allergies connues
  physical_examination?: string | null; // Examen clinique
  diagnosis: string; // Diagnostic clinique
  diagnosis_code?: string | null; // Code CIM-10 / ICD-10 (ex: "J06.9", "E11")
  vitals: MedicalVitals;
  prescribed_items: PrescribedItem[];
  medical_notes?: string | null; // Recommandations / Consignes
  next_appointment_date?: string | null;
  external_prescription?: boolean;
  doctor_type?: 'triage' | 'gueri' | 'generaliste' | 'specialiste';
  referral_reason?: string | null;
  referred_from?: string | null;
  referral_history?: Array<{
    id?: string;
    timestamp?: string;
    date?: string;
    from_role?: string;
    from_name?: string;
    to_role?: string;
    target_level?: string;
    target_specialty?: string;
    reason?: string;
    doctor_name?: string;
    clinical_summary?: string;
    priority?: string;
  }>;
  created_at: string;
  updated_at: string;
  invoice_id?: number | null; // Link to associated invoice if billable
  exam_invoice_id?: number | null; // Link to associated exam invoice
  lab_order_ids?: number[]; // Links to generated lab exam orders
  box_assigned?: string | null;
  priority?: 'normal' | 'urgent' | 'critique' | 'tres_urgent';
  // Referral Reliquat Fee Gate fields
  has_pending_balance?: boolean;
  reliquat_amount?: number;
  reliquat_invoice_id?: number | null;
  reliquat_invoice_name?: string | null;
  reliquat_paid?: boolean;
  reliquat_receipt_number?: string | null;
  reliquat_reason?: string | null;
  patient_choice?: 'internal' | 'external';
  referred_to_doctor?: boolean;
}

// ============================================================
// SPECIFICATION HOPITAL: ACTEURS, REGLES, SCENARIOS (S01-S50)
// ============================================================

export type HospitalActor =
  | 'Superviseur'
  | 'Caisse'
  | 'Facturation'
  | 'Infirmier'
  | 'Médecin'
  | 'Médecin spécialiste'
  | 'Laboratoire'
  | 'Imagerie'
  | 'Hospitalisation'
  | 'Administration'
  | 'Patient';

export interface HospitalGlobalRule {
  code: string; // R01 à R10
  titre: string;
  description: string;
  applicable_modules: string[];
}

export interface HospitalScenario {
  id: string; // "S01" à "S50"
  nom: string;
  acteur: HospitalActor;
  declencheur: string;
  preconditions: string;
  etapes: string[];
  menus: string[];
  lectures: string[];
  ecritures: string[];
  postconditions: string;
  regles: string[]; // ["R01", "R02", "R09"]
  targetView?: AppView;
  description_courte?: string;
  derniere_execution?: {
    date: string;
    acteur: string;
    succes: boolean;
    reference?: string;
    details?: string;
  };
}

export interface JournalEntry {
  id_log: number;
  id_utilisateur?: number;
  utilisateur_nom?: string;
  action: string;
  date: string;
  details: string;
  scenario_id?: string;
  numero_dossier?: string;
  id_patient?: number;
  patient_nom?: string;
  statut?: 'succes' | 'alerte' | 'bloque';
  metadata?: Record<string, any>;
}

export interface Patient360Data {
  patient: ResPartner;
  dossier: {
    id_dossier: number;
    numero_dossier: string;
    date_creation: string;
    statut: string;
  };
  allergies: string[];
  antecedents: string[];
  traitements_en_cours: string[];
  derniere_consultation?: MedicalConsultation | null;
  consultations: MedicalConsultation[];
  examens_labo: LabExamOrder[];
  examens_imagerie: Array<{
    id: number;
    examen_name: string;
    prescripteur: string;
    statut: string;
    date: string;
    compte_rendu?: string;
    valide: boolean;
  }>;
  hospitalisation_en_cours?: {
    id_hospitalisation: number;
    service: string;
    id_lit: string;
    chambre: string;
    date_admission: string;
    statut: string;
    medecin_referent: string;
    motif: string;
  } | null;
  hospitalisations_passees: any[];
  factures: AccountMove[];
  total_impaye: number;
  total_facture: number;
  alerte_impaye: boolean;
  alerte_hospitalisation: boolean;
  journal_activites: JournalEntry[];
}


