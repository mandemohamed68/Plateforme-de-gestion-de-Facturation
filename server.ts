import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { createServer as createViteServer } from 'vite';
import {
  initialCountries,
  initialCurrencies,
  initialUoms,
  initialGroups,
  initialPartners,
  initialUsers,
  initialTaxes,
  initialProductTemplates,
  initialProductProducts,
  initialMoves,
  initialMoveLines,
  initialPayments,
  initialEmailNotifications,
  initialLabOrders,
  initialTillSessions,
  initialConsultations,
} from './server/seedData';
import { registerHospitalScenariosRoutes } from './server/hospitalScenariosEngine';
import { registerFhirRoutes } from './server/fhirRoutes';
import { DEFAULT_HOSPITAL_SERVICES } from './src/data/defaultHospitalServices';
import {
  ResCountry,
  ResCurrency,
  UomUom,
  ResGroup,
  ResPartner,
  ResUser,
  AccountTax,
  ProductTemplate,
  ProductProduct,
  AccountMove,
  AccountMoveLine,
  AccountPayment,
  EmailNotification,
  AnalyticsSummary,
  CompanySettings,
  LabExamOrder,
  TillSession,
  TillSessionTransaction,
  PartnerReduction,
  MedicalConsultation,
} from './src/types';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const defaultCompany: CompanySettings = {
  name: "LABORATOIRE D'ANALYSES MÉDICALES & BIOLOGIE CLINIQUE",
  slogan: "Biologie Médicale, Diagnostics Spécialisés & Examens de Santé",
  logo_url: "",
  primary_color: "#0f172a",
  phone: "+225 27 20 22 33 44 / +225 07 08 09 10 11",
  email: "contact@laboratoire-biologie.ci",
  address: "Plateau Medical Center, Bd Hassan II",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  rccm: "CI-ABJ-2024-B-12940",
  tax_id: "CI 01928374 A",
  health_accreditation_number: "AGR-MSHP-2024-0098",
  currency_symbol: "FCFA",
  default_tax_rate: 0, // Exonéré TVA par défaut
  tax_exemption_default_reason: "Exonération légale de TVA sur les prestations de biologie médicale (Art. 355 du Code Général des Impôts).",
  bank_name: "Société Générale Côte d'Ivoire (SGCI)",
  bank_iban: "CI93 0100 2000 3000 4000 50",
  bank_bic: "SGCIX01",
  mobile_money_numbers: "Wave / Orange Money / Moov : +225 07 08 09 10 11",
  enabled_payment_methods: ["cash", "wave", "orange_money", "moov_money", "card", "check", "transfer", "insurance"],
  payment_method_items: [
    { id: 'cash', name: 'Espèces Caisse (Comptant)', icon: '💵', category: 'cash', enabled: true, instruction_note: 'Encaissement direct au guichet caisse' },
    { id: 'wave', name: 'Wave Mobile Money', icon: '📱', category: 'mobile_money', enabled: true, merchant_id: 'WAVE-CI-98124', account_number: '+225 07 08 09 10 11', fee_percentage: 1, instruction_note: 'Scannez le QR code ou entrez le code marchand Wave' },
    { id: 'orange_money', name: 'Orange Money Côte d\'Ivoire', icon: '🟧', category: 'mobile_money', enabled: true, merchant_id: 'OM-CI-4412', account_number: '#144#4*1#', fee_percentage: 1, instruction_note: 'Composez le #144# ou validez la notification push' },
    { id: 'moov_money', name: 'Moov Money / MTN MoMo', icon: '🟦', category: 'mobile_money', enabled: true, merchant_id: 'MOMO-CI-1029', account_number: '*133# / *155#', fee_percentage: 1, instruction_note: 'Entrez votre numéro et confirmez par votre code secret' },
    { id: 'card', name: 'Carte Bancaire (TPE)', icon: '💳', category: 'card', enabled: true, instruction_note: 'Paiement par carte Visa / Mastercard au TPE' },
    { id: 'check', name: 'Chèque Bancaire', icon: '📝', category: 'bank', enabled: true, instruction_note: 'Chèque certifié à l\'ordre du laboratoire' },
    { id: 'transfer', name: 'Virement Bancaire (RIB)', icon: '🏦', category: 'bank', enabled: true, account_number: 'CI93 0100 2000 3000 4000 50', instruction_note: 'Fournir le justificatif de virement bancaire' },
    { id: 'insurance', name: 'Prise en Charge Directe (Tiers-Payeur Assurance)', icon: '🛡️', category: 'insurance', enabled: true, instruction_note: 'Validation du bon de prise en charge avec la compagnie' },
  ],
  show_watermark: true,
  watermark_text: "DOCUMENT CONFIDENTIEL ET OFFICIEL",
  watermark_type: 'both',
  watermark_opacity: 0.12,
  watermark_position: 'diagonal',
  flash_news_enabled: true,
  flash_news_speed: 6,
  flash_announcements: [
    {
      id: 'flash-1',
      title: 'Disponibilité du Dépistage PCR Direct',
      message: 'Nouveau pôle d\'analyses rapides PCR disponible sans rendez-vous de 07h30 à 18h00 au guichet principal.',
      type: 'info',
      active: true,
      priority: 1,
    },
    {
      id: 'flash-2',
      title: 'Convention Tiers-Payeur Unifiée',
      message: 'Mise à jour des conventions d\'assurance 2026 : Prise en charge automatique jusqu\'à 90% pour les partenaires agréés.',
      type: 'promo',
      active: true,
      priority: 2,
    },
  ],
  medical_director_name: "Dr. Aboubacar TOURÉ - Biologiste Médical Specialist",
  lab_turnaround_default: "2 heures à 24 heures selon la spécialité",
  invoice_footer: "Document délivré à titre de quittance médicale officielle. Facture exonérée de TVA sur les prestations d'analyses médicales.",
  default_page_size: 50,
  hospital_services_config: DEFAULT_HOSPITAL_SERVICES,
  enabled_hospital_services: DEFAULT_HOSPITAL_SERVICES.map((s) => s.id),
};

let dbCompany: CompanySettings = { ...defaultCompany };

// In-Memory Database Store with Disk Persistence
let dbCountries: ResCountry[] = [...initialCountries];
let dbCurrencies: ResCurrency[] = [...initialCurrencies];
let dbUoms: UomUom[] = [...initialUoms];
let dbGroups: ResGroup[] = [...initialGroups];
let dbPartners: ResPartner[] = [...initialPartners];
let dbUsers: ResUser[] = [...initialUsers];
let dbTaxes: AccountTax[] = [...initialTaxes];
let dbProductTemplates: ProductTemplate[] = [...initialProductTemplates];
let dbProductProducts: ProductProduct[] = [...initialProductProducts];
let dbMoves: AccountMove[] = [...initialMoves];
let dbMoveLines: AccountMoveLine[] = [...initialMoveLines];
let dbPayments: AccountPayment[] = [...initialPayments];
let dbEmailNotifications: EmailNotification[] = [...initialEmailNotifications];
let dbLabOrders: LabExamOrder[] = [...initialLabOrders];
let dbTillSessions: TillSession[] = [...initialTillSessions];
let dbConsultations: MedicalConsultation[] = [...initialConsultations];

const defaultPartnerReductions: PartnerReduction[] = [
  { id: 1, patient_type: "Patient assuré 100%", category_name: "All", reduction_rate: 100.00, active: true },
  { id: 2, patient_type: "Employé(e) (personnel de l'HNBC)", category_name: "All", reduction_rate: 80.00, active: true },
  { id: 3, patient_type: "Conjoint(e), ascendants et descendants mineurs directs et de l'employé(e)", category_name: "All", reduction_rate: 75.00, active: true }
];
let dbPartnerReductions: PartnerReduction[] = [...defaultPartnerReductions];

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

let dbWorkflowLogs: WorkflowLogEntry[] = [];
let dbNotificationQueue: NotificationQueueEntry[] = [];
let nextWorkflowLogId = 1;
let nextNotificationQueueId = 1;

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

let dbJournal: JournalEntry[] = [];
let nextJournalLogId = 1;

function logToJournal(
  action: string,
  details: string,
  meta?: {
    id_utilisateur?: number;
    utilisateur_nom?: string;
    scenario_id?: string;
    numero_dossier?: string;
    id_patient?: number;
    patient_nom?: string;
    statut?: 'succes' | 'alerte' | 'bloque';
    metadata?: Record<string, any>;
  }
): JournalEntry {
  const entry: JournalEntry = {
    id_log: nextJournalLogId++,
    id_utilisateur: meta?.id_utilisateur || 1,
    utilisateur_nom: meta?.utilisateur_nom || 'Système Hopital',
    action,
    date: new Date().toISOString(),
    details,
    scenario_id: meta?.scenario_id,
    numero_dossier: meta?.numero_dossier,
    id_patient: meta?.id_patient,
    patient_nom: meta?.patient_nom,
    statut: meta?.statut || 'succes',
    metadata: meta?.metadata,
  };
  dbJournal.unshift(entry);
  if (dbJournal.length > 500) {
    dbJournal = dbJournal.slice(0, 500);
  }
  return entry;
}

// Helper ID counters
let nextPartnerId = 20;
let nextProductId = 30;
let nextMoveId = 20;
let nextMoveLineId = 50;
let nextPaymentId = 20;
let nextUserId = 20;
let nextNotificationId = 20;
let nextLabOrderId = 10;
let nextInvoiceSeq = 10;
let nextVendorSeq = 5;
let nextGroupId = 10;
let nextTillSessionSeq = 794;
let nextPartnerReductionId = 4;
let nextConsultationId = 10;

// Disk persistence manager: guarantees all changes remain permanent across restarts & refreshes
const DB_STORE_DIR = path.join(process.cwd(), 'data');
const DB_STORE_FILE = path.join(DB_STORE_DIR, 'db_store.json');
const DB_BACKUP_FILE = path.join(DB_STORE_DIR, 'db_backup.json');

function saveDb() {
  try {
    if (!fs.existsSync(DB_STORE_DIR)) {
      fs.mkdirSync(DB_STORE_DIR, { recursive: true });
    }
    const store = {
      dbCompany,
      dbCountries,
      dbCurrencies,
      dbUoms,
      dbGroups,
      dbPartners,
      dbUsers,
      dbTaxes,
      dbProductTemplates,
      dbProductProducts,
      dbMoves,
      dbMoveLines,
      dbPayments,
      dbEmailNotifications,
      dbLabOrders,
      dbTillSessions,
      dbConsultations,
      dbPartnerReductions,
      dbWorkflowLogs,
      dbNotificationQueue,
      dbJournal,
      nextJournalLogId,
      nextWorkflowLogId,
      nextNotificationQueueId,
      nextPartnerId,
      nextProductId,
      nextMoveId,
      nextMoveLineId,
      nextPaymentId,
      nextUserId,
      nextNotificationId,
      nextLabOrderId,
      nextInvoiceSeq,
      nextVendorSeq,
      nextGroupId,
      nextTillSessionSeq,
      nextPartnerReductionId,
      nextConsultationId,
      savedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(store, null, 2);
    fs.writeFileSync(DB_STORE_FILE, serialized, 'utf-8');
    // Also save redundant backup file to avoid data loss
    try {
      fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');
    } catch (_) {}
  } catch (err) {
    console.error('[Persistent DB] Error saving to disk:', err);
  }
}

function syncConsultationForMove(move: AccountMove): MedicalConsultation | null {
  if (!move || !move.id) return null;
  const invoiceLines = dbMoveLines.filter(l => l.move_id === move.id);
  const consultLine = invoiceLines.find(l => 
    l.product_id === 12 || 
    l.product_id === 991 || 
    l.product_id === 992 || 
    l.product_id === 993 || 
    (l.name && (
      l.name.toLowerCase().includes('consultation') || 
      l.name.toLowerCase().includes('infirmier') || 
      l.name.toLowerCase().includes('triage') ||
      l.name.toLowerCase().includes('constantes')
    ))
  );

  if (!consultLine) return null;

  let existing = dbConsultations.find(c => c.invoice_id === move.id || (c.consultation_number && move.ref && move.ref.includes(c.consultation_number)));

  let docId = 16;
  let docName = 'Dr. Aboubacar Toure';
  let specialty = 'Médecine Générale';
  let chiefComplaint = 'Consultation médecine générale';

  if (consultLine.product_id === 991 || (consultLine.name && consultLine.name.toLowerCase().includes('infirmier'))) {
    docId = 15;
    docName = 'Awa Diabate (Infirmier)';
    specialty = 'Soins & Triage Infirmier';
    chiefComplaint = 'Consultation Infirmier (Triage & Constantes)';
  } else if (consultLine.product_id === 993 || (consultLine.name && consultLine.name.toLowerCase().includes('spécialiste'))) {
    docId = 17;
    docName = 'Dr. Mamadou Cisse';
    specialty = 'Médecine Spécialisée (Cardiologie)';
    chiefComplaint = 'Consultation Spécialisée';
  }

  const partner = dbPartners.find(p => p.id === move.partner_id);
  const patName = move.patient_name || partner?.name || 'Patient Inconnu';
  const patNdm = move.ndm || partner?.ndm || `NDM-${move.partner_id}`;

  if (existing) {
    if (move.payment_state === 'paid' && existing.status === 'pending_payment') {
      existing.status = 'triage';
      existing.updated_at = new Date().toISOString();
    }
    if (!existing.patient_name || existing.patient_name === 'Patient Inconnu') {
      existing.patient_name = patName;
    }
    if (!existing.patient_ndm) {
      existing.patient_ndm = patNdm;
    }
    return existing;
  }

  const nextSeqNum = nextConsultationId++;
  const consNumber = `CONS-${new Date().getFullYear()}-${String(nextSeqNum).padStart(4, '0')}`;

  const newConsultation: MedicalConsultation = {
    id: nextSeqNum,
    consultation_number: consNumber,
    partner_id: move.partner_id,
    patient_name: patName,
    patient_ndm: patNdm,
    patient_gender: partner?.gender || 'M',
    patient_age: move.patient_age_y || partner?.age || 30,
    patient_phone: move.patient_phone || partner?.phone || null,
    insurance_name: move.insurance_name || partner?.insurance_name || null,
    insurance_coverage_rate: move.insurance_coverage_rate ?? partner?.insurance_coverage_rate ?? null,
    doctor_id: docId,
    doctor_name: docName,
    specialty: specialty,
    consultation_date: move.invoice_date ? new Date(move.invoice_date).toISOString() : new Date().toISOString(),
    status: move.payment_state === 'paid' ? 'triage' : 'pending_payment',
    chief_complaint: chiefComplaint,
    diagnosis: '',
    vitals: {
      triage_level: 'normal',
    },
    prescribed_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    invoice_id: move.id,
  };

  dbConsultations.unshift(newConsultation);
  return newConsultation;
}

function loadDb() {
  try {
    let raw: string | null = null;
    if (fs.existsSync(DB_STORE_FILE)) {
      raw = fs.readFileSync(DB_STORE_FILE, 'utf-8');
    } else if (fs.existsSync(DB_BACKUP_FILE)) {
      raw = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
    }

    if (raw) {
      const store = JSON.parse(raw);
      if (store.dbCompany) {
        dbCompany = {
          ...defaultCompany,
          ...store.dbCompany,
          hospital_services_config:
            store.dbCompany.hospital_services_config && store.dbCompany.hospital_services_config.length > 0
              ? store.dbCompany.hospital_services_config
              : DEFAULT_HOSPITAL_SERVICES,
          enabled_hospital_services:
            store.dbCompany.enabled_hospital_services && Array.isArray(store.dbCompany.enabled_hospital_services)
              ? store.dbCompany.enabled_hospital_services
              : (store.dbCompany.hospital_services_config && store.dbCompany.hospital_services_config.length > 0
                  ? store.dbCompany.hospital_services_config.filter((s: any) => s.enabled).map((s: any) => s.id)
                  : DEFAULT_HOSPITAL_SERVICES.map((s) => s.id)),
        };
      }
      if (store.dbCountries) dbCountries = store.dbCountries;
      if (store.dbCurrencies) dbCurrencies = store.dbCurrencies;
      if (store.dbUoms) dbUoms = store.dbUoms;
      if (store.dbGroups) dbGroups = store.dbGroups;
      if (store.dbPartners) dbPartners = store.dbPartners;
      if (store.dbUsers) dbUsers = store.dbUsers;
      if (store.dbTaxes) dbTaxes = store.dbTaxes;
      if (store.dbProductTemplates) {
        dbProductTemplates = store.dbProductTemplates;
      }
      if (store.dbProductProducts) {
        dbProductProducts = store.dbProductProducts;
      }

      // Ensure every template has at least one product variant
      dbProductTemplates.forEach((tmpl) => {
        const hasVariant = dbProductProducts.some((p) => p.product_tmpl_id === tmpl.id);
        if (!hasVariant) {
          dbProductProducts.push({
            id: tmpl.id,
            product_tmpl_id: tmpl.id,
            default_code: `PRD-${tmpl.id}`,
            barcode: `376000000${tmpl.id}`,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });
      if (store.dbMoves) dbMoves = store.dbMoves;
      if (store.dbMoveLines) dbMoveLines = store.dbMoveLines;
      if (store.dbPayments) dbPayments = store.dbPayments;
      if (store.dbEmailNotifications) dbEmailNotifications = store.dbEmailNotifications;
      if (store.dbLabOrders) dbLabOrders = store.dbLabOrders;
      if (store.dbTillSessions) dbTillSessions = store.dbTillSessions;
      if (store.dbConsultations) dbConsultations = store.dbConsultations;
      if (store.dbPartnerReductions) dbPartnerReductions = store.dbPartnerReductions;
      if (store.dbWorkflowLogs) dbWorkflowLogs = store.dbWorkflowLogs;
      if (store.dbNotificationQueue) dbNotificationQueue = store.dbNotificationQueue;
      if (store.dbJournal && Array.isArray(store.dbJournal)) {
        dbJournal = store.dbJournal;
      }
      if (store.nextJournalLogId) {
        nextJournalLogId = store.nextJournalLogId;
      } else if (dbJournal.length > 0) {
        nextJournalLogId = Math.max(...dbJournal.map(j => j.id_log || 0), 0) + 1;
      }
      if (store.nextWorkflowLogId) nextWorkflowLogId = store.nextWorkflowLogId;
      if (store.nextNotificationQueueId) nextNotificationQueueId = store.nextNotificationQueueId;
      
      // Deduplicate partners by ID if any collision exists
      const partnerIdsSeen = new Set<number>();
      let maxPartnerIdInDb = 0;
      dbPartners.forEach(p => {
        if (!p.id || partnerIdsSeen.has(p.id)) {
          maxPartnerIdInDb++;
          p.id = maxPartnerIdInDb;
        } else {
          partnerIdsSeen.add(p.id);
          if (p.id > maxPartnerIdInDb) maxPartnerIdInDb = p.id;
        }
      });

      // Deduplicate moves by ID
      const moveIdsSeen = new Set<number>();
      let maxMoveIdInDb = 0;
      dbMoves.forEach(m => {
        if (!m.id || moveIdsSeen.has(m.id)) {
          maxMoveIdInDb++;
          m.id = maxMoveIdInDb;
        } else {
          moveIdsSeen.add(m.id);
          if (m.id > maxMoveIdInDb) maxMoveIdInDb = m.id;
        }
      });

      // Deduplicate move lines by ID
      const moveLineIdsSeen = new Set<number>();
      let maxMoveLineIdInDb = 0;
      dbMoveLines.forEach(l => {
        if (!l.id || moveLineIdsSeen.has(l.id)) {
          maxMoveLineIdInDb++;
          l.id = maxMoveLineIdInDb;
        } else {
          moveLineIdsSeen.add(l.id);
          if (l.id > maxMoveLineIdInDb) maxMoveLineIdInDb = l.id;
        }
      });

      nextPartnerId = Math.max(store.nextPartnerId || 0, maxPartnerIdInDb + 1, 30);
      nextProductId = Math.max(store.nextProductId || 0, ...dbProductProducts.map(p => p.id || 0), 500);
      nextMoveId = Math.max(store.nextMoveId || 0, maxMoveIdInDb + 1, 100);
      nextMoveLineId = Math.max(store.nextMoveLineId || 0, maxMoveLineIdInDb + 1, 500);
      nextPaymentId = Math.max(store.nextPaymentId || 0, ...dbPayments.map(p => p.id || 0), 100);
      nextUserId = Math.max(store.nextUserId || 0, ...dbUsers.map(u => u.id || 0), 50);
      nextNotificationId = Math.max(store.nextNotificationId || 0, ...dbEmailNotifications.map(n => n.id || 0), 50);
      nextLabOrderId = Math.max(store.nextLabOrderId || 0, ...dbLabOrders.map(o => o.id || 0), 50);
      if (store.nextInvoiceSeq) nextInvoiceSeq = store.nextInvoiceSeq;
      if (store.nextVendorSeq) nextVendorSeq = store.nextVendorSeq;
      if (store.nextGroupId) nextGroupId = store.nextGroupId;
      if (store.nextTillSessionSeq) nextTillSessionSeq = store.nextTillSessionSeq;
      if (store.nextPartnerReductionId) nextPartnerReductionId = store.nextPartnerReductionId;
      nextConsultationId = Math.max(store.nextConsultationId || 0, ...dbConsultations.map(c => c.id || 0), 50);

      // Ensure the 4 official security groups exist and are synced
      initialGroups.forEach((ig) => {
        const idx = dbGroups.findIndex((g) => g.id === ig.id || g.name === ig.name);
        if (idx !== -1) {
          dbGroups[idx] = { ...dbGroups[idx], name: ig.name, description: ig.description, permissions: ig.permissions };
        } else {
          dbGroups.push(ig);
        }
      });

      // Synchronize core billing users & ensure Universal Administrator exists
      const universalAdmin = {
        id: 1,
        login: 'mandemohamed68@gmail.com',
        name: 'Mohamed Mandé (Admin Universel)',
        email: 'mandemohamed68@gmail.com',
        active: true,
        partner_id: 1,
        role: 'Administrateur Universel',
        department: 'Direction Générale / Administration Globale',
        group_ids: [1],
        permissions: [
          'can_manage_invoices',
          'can_validate_invoices',
          'can_delete_invoices',
          'can_register_payments',
          'can_manage_partners',
          'can_manage_lab_catalog',
          'can_validate_medical',
          'can_enter_results',
          'can_view_financials',
          'can_manage_settings',
          'can_manage_users',
          'can_send_reminders',
        ],
        password: 'admin',
        password_hash: 'admin',
        created_at: '2026-01-01T09:00:00Z',
        updated_at: new Date().toISOString(),
      };

      // Strict cleaning: Keep only the official 11 system profiles
      const validLogins = new Set([
        'mandemohamed68@gmail.com',
        'super_admin',
        'superviseur',
        'caissier',
        'facturier',
        'caisse_facture',
        'infirmier',
        'medecin',
        'specialiste',
        'laboratoire',
        'imagerie',
        'hospitalisation'
      ]);

      // Initialize clean user list based on initialUsers
      const cleanUsers: ResUser[] = initialUsers.map((iu) => {
        const existing = dbUsers.find((u) => u.login === iu.login || (u.email && u.email === iu.email) || u.id === iu.id);
        if (existing) {
          return {
            ...existing,
            id: iu.id,
            login: iu.login,
            name: iu.name,
            email: iu.email,
            role: iu.role,
            department: iu.department,
            group_ids: iu.group_ids,
            active: true,
            permissions: iu.permissions || existing.permissions || (iu.id === 1 ? ['all'] : []),
            allowed_views: undefined,
            password: 'admin',
            password_hash: 'admin',
          };
        }
        return {
          ...iu,
          password: 'admin',
          password_hash: 'admin',
        };
      });

      dbUsers = cleanUsers;

      // Clean up past auto-created consultations that had fake taken_at but no actual vitals measurements:
      dbConsultations.forEach(c => {
        if (c.vitals && c.vitals.taken_by_name === 'Système' && !c.vitals.bp_systolic && !c.vitals.temperature && !c.vitals.heart_rate) {
          delete c.vitals.taken_at;
          delete c.vitals.taken_by_name;
        }
      });

      // Synchronize consultations for all consultation invoices (e.g. Move 30 MANDE mohamed)
      dbMoves.forEach(m => syncConsultationForMove(m));

      // Seed initial audit journal entries if empty (R02)
      if (dbJournal.length === 0) {
        logToJournal('INITIALISATION_SYSTEME', 'Démarrage du Système d\'Information Hospitalier - Application des règles R01 à R10', {
          id_utilisateur: 1,
          utilisateur_nom: 'Super Administrateur',
          statut: 'succes',
        });
        logToJournal('CREATION_DOSSIER', 'Création du dossier médical NDM-0048 avec contrôle d\'unicité (R01)', {
          id_utilisateur: 1,
          utilisateur_nom: 'Accueil Admissions',
          numero_dossier: 'NDM-0048',
          scenario_id: 'S01',
          statut: 'succes',
        });
        logToJournal('VALIDATION_LABO', 'Validation médicale du bilan hématologique NFS par le biologiste (R06)', {
          id_utilisateur: 9,
          utilisateur_nom: 'Dr. Biologiste',
          numero_dossier: 'NDM-0048',
          scenario_id: 'S20',
          statut: 'succes',
        });
        logToJournal('OUVERTURE_CAISSE', 'Ouverture de session caisse principale avec fond de caisse conforme (R07, R10)', {
          id_utilisateur: 3,
          utilisateur_nom: 'Caissier Principal',
          scenario_id: 'S28',
          statut: 'succes',
        });
      }

      saveDb();
      console.log('[Persistent DB] Loaded persistent database state from disk successfully.');
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('[Persistent DB] Error loading from disk, keeping seed data:', err);
  }
}

// Immediately load persisted database on server boot
loadDb();

// Raw SQL Schema Representation for the Schema Modeler tool
const SYSTEM_SQL_SCHEMA = `-- Schéma relationnel pour application de facturation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE res_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE res_users (
    id SERIAL PRIMARY KEY,
    login VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR,
    name VARCHAR NOT NULL,
    email VARCHAR,
    active BOOLEAN DEFAULT TRUE,
    partner_id INTEGER REFERENCES res_partner(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE res_groups_users_rel (
    user_id INTEGER REFERENCES res_users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES res_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE res_partner (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    is_company BOOLEAN DEFAULT TRUE,
    email VARCHAR,
    phone VARCHAR,
    street VARCHAR,
    city VARCHAR,
    zip VARCHAR,
    country_id INTEGER REFERENCES res_country(id),
    vat VARCHAR,
    customer_rank INTEGER DEFAULT 0,
    supplier_rank INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_template (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    list_price DECIMAL(12,2),
    uom_id INTEGER REFERENCES uom_uom(id),
    currency_id INTEGER REFERENCES res_currency(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_product (
    id SERIAL PRIMARY KEY,
    product_tmpl_id INTEGER NOT NULL REFERENCES product_template(id),
    default_code VARCHAR,
    barcode VARCHAR,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE uom_uom (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    factor DECIMAL(12,6) DEFAULT 1.0
);

CREATE TABLE account_tax (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    amount DECIMAL(5,2) NOT NULL,
    type_tax_use VARCHAR NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    company_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account_move (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    ref VARCHAR,
    move_type VARCHAR NOT NULL,
    state VARCHAR NOT NULL DEFAULT 'draft',
    partner_id INTEGER NOT NULL REFERENCES res_partner(id),
    invoice_date DATE,
    date DATE NOT NULL,
    invoice_date_due DATE,
    currency_id INTEGER REFERENCES res_currency(id),
    amount_untaxed DECIMAL(12,2),
    amount_tax DECIMAL(12,2),
    amount_total DECIMAL(12,2),
    amount_residual DECIMAL(12,2),
    payment_state VARCHAR DEFAULT 'not_paid',
    invoice_user_id INTEGER REFERENCES res_users(id),
    fiscal_position_id INTEGER,
    company_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account_move_line (
    id SERIAL PRIMARY KEY,
    move_id INTEGER NOT NULL REFERENCES account_move(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES res_partner(id),
    product_id INTEGER REFERENCES product_product(id),
    account_id INTEGER,
    tax_ids INTEGER[],
    name VARCHAR,
    quantity DECIMAL(12,3),
    price_unit DECIMAL(12,2),
    price_subtotal DECIMAL(12,2),
    price_total DECIMAL(12,2),
    discount DECIMAL(5,2) DEFAULT 0.00,
    debit DECIMAL(12,2),
    credit DECIMAL(12,2),
    balance DECIMAL(12,2),
    sequence INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account_payment (
    id SERIAL PRIMARY KEY,
    move_id INTEGER REFERENCES account_move(id),
    partner_id INTEGER REFERENCES res_partner(id),
    journal_id INTEGER,
    payment_method_id INTEGER,
    amount DECIMAL(12,2),
    payment_date DATE,
    state VARCHAR DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE res_currency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(3) NOT NULL,
    symbol VARCHAR(10),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE res_country (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    code VARCHAR(2) NOT NULL
);

-- ==============================================================================
-- EXTENSION POUR LE WORKFLOW DE LABORATOIRE (CAISSE -> PRÉLÈVEMENT -> ANALYSE -> VALIDATION)
-- ==============================================================================

CREATE TABLE caisse_opcaisse (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    partner_id INTEGER REFERENCES res_partner(id),
    state VARCHAR(32) DEFAULT 'draft',
    date DATE DEFAULT CURRENT_DATE,
    amount_total DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE caisse_opcaisse_ligne (
    id SERIAL PRIMARY KEY,
    opcaisse_id INTEGER NOT NULL REFERENCES caisse_opcaisse(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES product_product(id),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) DEFAULT 1.000,
    price_unit DECIMAL(12,2) DEFAULT 0.00,
    price_total DECIMAL(12,2) DEFAULT 0.00
);

CREATE TABLE labo_echantillon (
    id SERIAL PRIMARY KEY,
    ndm VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255),
    opcaisse_id INTEGER REFERENCES caisse_opcaisse(id) ON DELETE SET NULL,
    sample_type VARCHAR(128) NOT NULL,
    state VARCHAR(32) DEFAULT 'nouveau',
    collected_at TIMESTAMP,
    accepted_at TIMESTAMP,
    transferred_at TIMESTAMP,
    entered_at TIMESTAMP,
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE labo_ligne_echantillon (
    id SERIAL PRIMARY KEY,
    echantillon_id INTEGER NOT NULL REFERENCES labo_echantillon(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES product_product(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE resultat_resultat_labo (
    id SERIAL PRIMARY KEY,
    ligne_echantillon_id INTEGER NOT NULL REFERENCES labo_ligne_echantillon(id) ON DELETE CASCADE,
    parameter_name VARCHAR(255) NOT NULL,
    resultat_final VARCHAR(255),
    resultat_num DECIMAL(12,4),
    reference_range VARCHAR(255),
    unit VARCHAR(64),
    valider_ligne BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMP,
    validated_by VARCHAR(255)
);

-- ==============================================================================
-- DECLENCHEURS & LOGIQUE PL/PGSQL (TRIGGERS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_opcaisse_ligne_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE caisse_opcaisse SET state = 'regle' WHERE id = NEW.opcaisse_id;
    PERFORM sp_creer_echantillon_depuis_recu(NEW.opcaisse_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_opcaisse_ligne_after_insert
AFTER INSERT ON caisse_opcaisse_ligne
FOR EACH ROW EXECUTE FUNCTION fn_opcaisse_ligne_after_insert();

CREATE OR REPLACE FUNCTION fn_echantillon_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.state = 'nouveau' AND OLD.state IS DISTINCT FROM NEW.state THEN
        NEW.collected_at := NOW();
    ELSIF NEW.state = 'accepte' AND OLD.state IS DISTINCT FROM NEW.state THEN
        NEW.accepted_at := NOW();
    ELSIF NEW.state = 'transfere' AND OLD.state IS DISTINCT FROM NEW.state THEN
        NEW.transferred_at := NOW();
    ELSIF NEW.state = 'saisi' AND OLD.state IS DISTINCT FROM NEW.state THEN
        NEW.entered_at := NOW();
    ELSIF NEW.state = 'valide' AND OLD.state IS DISTINCT FROM NEW.state THEN
        NEW.validated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_echantillon_state
BEFORE UPDATE ON labo_echantillon
FOR EACH ROW EXECUTE FUNCTION fn_echantillon_state_timestamp();

CREATE OR REPLACE FUNCTION fn_resultat_after_update()
RETURNS TRIGGER AS $$
DECLARE
    v_echantillon_id INTEGER;
    v_non_valides INTEGER;
BEGIN
    SELECT l.echantillon_id INTO v_echantillon_id
    FROM labo_ligne_echantillon l
    WHERE l.id = NEW.ligne_echantillon_id;
    
    IF NEW.valider_ligne = TRUE THEN
        SELECT COUNT(*) INTO v_non_valides
        FROM resultat_resultat_labo r
        JOIN labo_ligne_echantillon l ON r.ligne_echantillon_id = l.id
        WHERE l.echantillon_id = v_echantillon_id AND (r.valider_ligne IS NOT TRUE OR r.valider_ligne = FALSE);
        
        IF v_non_valides = 0 THEN
            UPDATE labo_echantillon SET state = 'valide' WHERE id = v_echantillon_id;
        ELSE
            UPDATE labo_echantillon SET state = 'saisi' WHERE id = v_echantillon_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resultat_after_update
AFTER UPDATE OF valider_ligne ON resultat_resultat_labo
FOR EACH ROW EXECUTE FUNCTION fn_resultat_after_update();

-- ==============================================================================
-- PROCÉDURES STOCKÉES
-- ==============================================================================

CREATE OR REPLACE FUNCTION sp_creer_echantillon_depuis_recu(p_opcaisse_id INTEGER)
RETURNS VOID AS $$
DECLARE
    r_recu caisse_opcaisse%ROWTYPE;
    r_patient res_partner%ROWTYPE;
    v_echantillon_id INTEGER;
    v_ligne RECORD;
    v_sample_type VARCHAR(128);
BEGIN
    SELECT * INTO r_recu FROM caisse_opcaisse WHERE id = p_opcaisse_id;
    SELECT * INTO r_patient FROM res_partner WHERE id = r_recu.partner_id;
    
    v_sample_type := 'Sang Total (Tube EDTA)';
    
    INSERT INTO labo_echantillon (ndm, patient_name, opcaisse_id, sample_type, state, collected_at, created_at)
    VALUES (r_patient.ndm, r_patient.name, p_opcaisse_id, v_sample_type, 'nouveau', NOW(), NOW())
    RETURNING id INTO v_echantillon_id;
    
    FOR v_ligne IN SELECT * FROM caisse_opcaisse_ligne WHERE opcaisse_id = p_opcaisse_id LOOP
        INSERT INTO labo_ligne_echantillon (echantillon_id, product_id, name)
        VALUES (v_echantillon_id, v_ligne.product_id, v_ligne.name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- VUES DE SUIVI ET WORKFLOW (V_SUIVI_PATIENT_WORKFLOW, ETC.)
-- ==============================================================================

CREATE OR REPLACE VIEW v_suivi_patient_workflow AS
SELECT 
    p.ndm,
    p.name AS patient_name,
    c.id AS opcaisse_id,
    c.name AS opcaisse_name,
    c.state AS paiement_status,
    e.id AS echantillon_id,
    e.sample_type,
    e.state AS echantillon_status,
    e.collected_at,
    e.validated_at,
    l.name AS examen_name,
    r.parameter_name,
    r.resultat_final,
    r.resultat_num,
    r.unit,
    r.valider_ligne AS resultat_valide
FROM res_partner p
LEFT JOIN caisse_opcaisse c ON p.id = c.partner_id
LEFT JOIN labo_echantillon e ON c.id = e.opcaisse_id
LEFT JOIN labo_ligne_echantillon l ON e.id = l.echantillon_id
LEFT JOIN resultat_resultat_labo r ON l.id = r.ligne_echantillon_id
WHERE p.partner_type = 'patient';

CREATE OR REPLACE VIEW v_echantillons_a_prelever AS
SELECT 
    e.id AS echantillon_id,
    e.ndm,
    e.patient_name,
    e.sample_type,
    e.state AS status,
    e.created_at
FROM labo_echantillon e
WHERE e.state IN ('nouveau', 'accepte');

CREATE OR REPLACE VIEW v_resultats_a_saisir AS
SELECT 
    e.id AS echantillon_id,
    e.ndm,
    e.patient_name,
    l.id AS ligne_id,
    l.name AS examen_name,
    e.state AS status
FROM labo_echantillon e
JOIN labo_ligne_echantillon l ON e.id = l.echantillon_id
WHERE e.state IN ('accepte', 'transfere');

CREATE OR REPLACE VIEW v_resultats_a_valider AS
SELECT 
    e.id AS echantillon_id,
    e.ndm,
    e.patient_name,
    l.name AS examen_name,
    r.id AS resultat_id,
    r.parameter_name,
    r.resultat_final,
    r.resultat_num,
    r.unit,
    e.state AS status
FROM labo_echantillon e
JOIN labo_ligne_echantillon l ON e.id = l.echantillon_id
JOIN resultat_resultat_labo r ON l.id = r.ligne_echantillon_id
WHERE e.state = 'saisi' AND (r.valider_ligne IS NOT TRUE OR r.valider_ligne = FALSE);
`;

// Helpers to expand Move relations
function expandMove(m: AccountMove): AccountMove {
  const partner = dbPartners.find((p) => p.id === m.partner_id);
  const resolvedPartner = partner
    ? {
        ...partner,
        name: m.patient_name || partner.name,
        ndm: m.ndm || partner.ndm || null,
        phone: m.patient_phone || partner.phone || null,
      }
    : (m.patient_name
      ? ({
          id: m.partner_id,
          name: m.patient_name,
          phone: m.patient_phone || null,
          ndm: m.ndm || null,
          customer_rank: 1,
          supplier_rank: 0,
          partner_type: 'patient',
          active: true,
        } as any)
      : undefined);

  const invoice_user = dbUsers.find((u) => u.id === m.invoice_user_id);
  const currency = dbCurrencies.find((c) => c.id === m.currency_id);
  const lines = dbMoveLines
    .filter((l) => l.move_id === m.id)
    .map((l) => {
      const prod = dbProductProducts.find((p) => p.id === l.product_id);
      const tmpl = prod ? dbProductTemplates.find((t) => t.id === prod.product_tmpl_id) : null;
      return {
        ...l,
        product_name: tmpl ? tmpl.name : 'Ligne libre',
        product_code: prod ? prod.default_code || '' : '',
      };
    });
  const payments = dbPayments.filter((p) => p.move_id === m.id);

  return {
    ...m,
    patient_name: m.patient_name || partner?.name || null,
    patient_phone: m.patient_phone || partner?.phone || null,
    partner: resolvedPartner,
    invoice_user,
    currency,
    lines,
    payments,
  };
}

// REST API ROUTES

// 1. Health & Database Meta
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Billing & Invoicing API', version: '2026.1' });
});

app.get('/api/schema', (req: Request, res: Response) => {
  res.json({
    raw_sql: SYSTEM_SQL_SCHEMA,
    rawSql: SYSTEM_SQL_SCHEMA,
    tables: [
      { name: 'res_groups', count: dbGroups.length, primary_key: 'id', description: 'Rôles et groupes de sécurité' },
      { name: 'res_users', count: dbUsers.length, primary_key: 'id', foreign_keys: ['partner_id -> res_partner.id'], description: 'Utilisateurs du système' },
      { name: 'res_partner', count: dbPartners.length, primary_key: 'id', foreign_keys: ['country_id -> res_country.id'], description: 'Contacts, Clients et Fournisseurs' },
      { name: 'product_template', count: dbProductTemplates.length, primary_key: 'id', foreign_keys: ['uom_id -> uom_uom.id', 'currency_id -> res_currency.id'], description: 'Modèle maître d article/produit' },
      { name: 'product_product', count: dbProductProducts.length, primary_key: 'id', foreign_keys: ['product_tmpl_id -> product_template.id'], description: 'Variantes et réfs internes de produit' },
      { name: 'uom_uom', count: dbUoms.length, primary_key: 'id', description: 'Unités de mesure (Heures, Jours, Unités)' },
      { name: 'account_tax', count: dbTaxes.length, primary_key: 'id', description: 'Taxes et taux de TVA' },
      { name: 'account_move', count: dbMoves.length, primary_key: 'id', foreign_keys: ['partner_id -> res_partner.id', 'currency_id -> res_currency.id', 'invoice_user_id -> res_users.id'], description: 'Factures client et fournisseur (Entrées de journal)' },
      { name: 'account_move_line', count: dbMoveLines.length, primary_key: 'id', foreign_keys: ['move_id -> account_move.id', 'product_id -> product_product.id', 'partner_id -> res_partner.id'], description: 'Lignes de facturation et écriture comptables (Débit/Crédit)' },
      { name: 'account_payment', count: dbPayments.length, primary_key: 'id', foreign_keys: ['move_id -> account_move.id', 'partner_id -> res_partner.id'], description: 'Règlements & Paiements enregistrés' },
      { name: 'res_currency', count: dbCurrencies.length, primary_key: 'id', description: 'Devises système' },
      { name: 'res_country', count: dbCountries.length, primary_key: 'id', description: 'Pays et codes ISO' },
      { name: 'caisse_opcaisse', count: 2, primary_key: 'id', foreign_keys: ['partner_id -> res_partner.id'], description: 'Reçus et Encaissements Caisse' },
      { name: 'caisse_opcaisse_ligne', count: 2, primary_key: 'id', foreign_keys: ['opcaisse_id -> caisse_opcaisse.id', 'product_id -> product_product.id'], description: 'Lignes de reçus de caisse' },
      { name: 'labo_echantillon', count: 3, primary_key: 'id', foreign_keys: ['opcaisse_id -> caisse_opcaisse.id'], description: 'Échantillons Patient Prélèvement (Workflow labo)' },
      { name: 'labo_ligne_echantillon', count: 2, primary_key: 'id', foreign_keys: ['echantillon_id -> labo_echantillon.id', 'product_id -> product_product.id'], description: 'Lignes d examens par échantillon' },
      { name: 'resultat_resultat_labo', count: 3, primary_key: 'id', foreign_keys: ['ligne_echantillon_id -> labo_ligne_echantillon.id'], description: 'Résultats et paramètres d analyses' },
      { name: 'v_suivi_patient_workflow', count: 3, primary_key: 'ndm', description: 'VUE : Suivi global du workflow patient' },
      { name: 'v_echantillons_a_prelever', count: 2, primary_key: 'echantillon_id', description: 'VUE : Échantillons en attente de prélèvement' },
      { name: 'v_resultats_a_saisir', count: 2, primary_key: 'echantillon_id', description: 'VUE : Paramètres en attente de saisie' },
      { name: 'v_resultats_a_valider', count: 2, primary_key: 'resultat_id', description: 'VUE : Résultats d analyses en attente de validation' },
    ],
  });
});

app.post('/api/db/reset', (req: Request, res: Response) => {
  dbCompany = { ...defaultCompany };
  dbCountries = [...initialCountries];
  dbCurrencies = [...initialCurrencies];
  dbUoms = [...initialUoms];
  dbGroups = [...initialGroups];
  dbPartners = [...initialPartners];
  dbUsers = [...initialUsers];
  dbTaxes = [...initialTaxes];
  dbProductTemplates = [...initialProductTemplates];
  dbProductProducts = [...initialProductProducts];
  dbMoves = [...initialMoves];
  dbMoveLines = [...initialMoveLines];
  dbPayments = [...initialPayments];
  dbEmailNotifications = [...initialEmailNotifications];
  dbLabOrders = [...initialLabOrders];
  saveDb();
  res.json({ message: 'Base de données réinitialisée avec succès !' });
});

// Resilient Client-Server Synchronization & Backup Endpoints
app.get('/api/database/dump', (req: Request, res: Response) => {
  try {
    const dump = {
      metadata: {
        exported_at: new Date().toISOString(),
        institution: dbCompany.name,
        system: "CI-MEDIC-LAB-ERP",
        version: "2026.1",
        description: "Dump complet et intègre de la base de données médicale, laboratoire et comptabilité",
        counts: {
          partners: dbPartners.length,
          labOrders: dbLabOrders.length,
          moves: dbMoves.length,
          moveLines: dbMoveLines.length,
          payments: dbPayments.length,
          tillSessions: dbTillSessions.length,
          productTemplates: dbProductTemplates.length,
          users: dbUsers.length,
          taxes: dbTaxes.length,
          partnerReductions: dbPartnerReductions.length,
        },
      },
      company: dbCompany,
      partners: dbPartners,
      labOrders: dbLabOrders,
      moves: dbMoves,
      moveLines: dbMoveLines,
      payments: dbPayments,
      tillSessions: dbTillSessions,
      productTemplates: dbProductTemplates,
      productProducts: dbProductProducts,
      users: dbUsers,
      groups: dbGroups,
      taxes: dbTaxes,
      partnerReductions: dbPartnerReductions,
      countries: dbCountries,
      currencies: dbCurrencies,
      uoms: dbUoms,
      workflowLogs: dbWorkflowLogs,
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `dump_base_donnees_${dateStr}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(dump, null, 2));
  } catch (err) {
    console.error('Error generating database dump:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du dump' });
  }
});

app.get('/api/database/dump-sql', (req: Request, res: Response) => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const dumpPath = path.join(process.cwd(), 'database_dump_exhaustive.sql');
    if (fs.existsSync(dumpPath)) {
      const sqlContent = fs.readFileSync(dumpPath, 'utf8');
      const filename = `dump_base_donnees_exhaustive_${dateStr}.sql`;
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(sqlContent);
    }

    const escapeSql = (val: any): string => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    let sql = `-- ==========================================================\n`;
    sql += `-- DUMP DE BASE DE DONNÉES EXHAUSTIF - SIH & CLINIQUE\n`;
    sql += `-- Date d'exportation : ${new Date().toISOString()}\n`;
    sql += `-- Établissement : ${dbCompany.name}\n`;
    sql += `-- ==========================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 1. Countries & Currencies & UOMs
    sql += `-- 1. Pays, Devises et Unités\n`;
    sql += `CREATE TABLE IF NOT EXISTS res_country (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL, code VARCHAR(10) NOT NULL);\n`;
    dbCountries.forEach((c) => {
      sql += `INSERT INTO res_country (id, name, code) VALUES (${c.id}, ${escapeSql(c.name)}, ${escapeSql(c.code)});\n`;
    });
    sql += `CREATE TABLE IF NOT EXISTS res_currency (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL, symbol VARCHAR(10) NOT NULL, active TINYINT(1) DEFAULT 1);\n`;
    dbCurrencies.forEach((c) => {
      sql += `INSERT INTO res_currency (id, name, symbol, active) VALUES (${c.id}, ${escapeSql(c.name)}, ${escapeSql(c.symbol)}, ${c.active ? 1 : 0});\n`;
    });
    sql += `CREATE TABLE IF NOT EXISTS uom_uom (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL, factor DECIMAL(10,4) DEFAULT 1.0000);\n`;
    dbUoms.forEach((u) => {
      sql += `INSERT INTO uom_uom (id, name, factor) VALUES (${u.id}, ${escapeSql(u.name)}, ${u.factor || 1.0});\n`;
    });
    sql += `\n`;

    // 2. Users & Groups
    sql += `-- 2. Utilisateurs et Groupes RBAC\n`;
    sql += `CREATE TABLE IF NOT EXISTS res_groups (id INT PRIMARY KEY, name VARCHAR(150) NOT NULL, description TEXT, permissions_json TEXT, created_at VARCHAR(50));\n`;
    dbGroups.forEach((g: any) => {
      sql += `INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (${g.id}, ${escapeSql(g.name)}, ${escapeSql(g.description)}, ${escapeSql(g.permissions || [])}, ${escapeSql(g.created_at)});\n`;
    });
    sql += `CREATE TABLE IF NOT EXISTS res_users (id INT PRIMARY KEY, name VARCHAR(200) NOT NULL, login VARCHAR(150) NOT NULL UNIQUE, email VARCHAR(200), role VARCHAR(100), department VARCHAR(100), phone VARCHAR(50), active TINYINT(1) DEFAULT 1, group_ids_json TEXT, permissions_json TEXT, created_at VARCHAR(50));\n`;
    dbUsers.forEach((u: any) => {
      sql += `INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (${u.id}, ${escapeSql(u.name)}, ${escapeSql(u.login)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${escapeSql(u.department)}, ${escapeSql(u.phone)}, ${u.active ? 1 : 0}, ${escapeSql(u.group_ids || [])}, ${escapeSql(u.permissions || [])}, ${escapeSql(u.created_at)});\n`;
    });
    sql += `\n`;

    // 3. Company Settings
    sql += `-- 3. Configuration Établissement\n`;
    sql += `CREATE TABLE IF NOT EXISTS company_settings (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, slogan VARCHAR(255), logo_url TEXT, primary_color VARCHAR(30), phone VARCHAR(100), email VARCHAR(150), address VARCHAR(255), city VARCHAR(100), country VARCHAR(100), rccm VARCHAR(100), tax_id VARCHAR(100), health_accreditation_number VARCHAR(100), currency_symbol VARCHAR(20), default_tax_rate DECIMAL(5,2) DEFAULT 0.00, tax_exemption_default_reason TEXT, bank_name VARCHAR(150), bank_iban VARCHAR(100), bank_bic VARCHAR(50), mobile_money_numbers TEXT, medical_director_name VARCHAR(200), lab_turnaround_default VARCHAR(150), invoice_footer TEXT, hospital_services_json TEXT);\n`;
    sql += `INSERT INTO company_settings (id, name, slogan, logo_url, primary_color, phone, email, address, city, country, rccm, tax_id, health_accreditation_number, currency_symbol, default_tax_rate, tax_exemption_default_reason, bank_name, bank_iban, bank_bic, mobile_money_numbers, medical_director_name, lab_turnaround_default, invoice_footer, hospital_services_json) VALUES (1, ${escapeSql(dbCompany.name)}, ${escapeSql(dbCompany.slogan)}, ${escapeSql(dbCompany.logo_url)}, ${escapeSql(dbCompany.primary_color)}, ${escapeSql(dbCompany.phone)}, ${escapeSql(dbCompany.email)}, ${escapeSql(dbCompany.address)}, ${escapeSql(dbCompany.city)}, ${escapeSql(dbCompany.country)}, ${escapeSql(dbCompany.rccm)}, ${escapeSql(dbCompany.tax_id)}, ${escapeSql(dbCompany.health_accreditation_number)}, ${escapeSql(dbCompany.currency_symbol)}, ${dbCompany.default_tax_rate || 0}, ${escapeSql(dbCompany.tax_exemption_default_reason)}, ${escapeSql(dbCompany.bank_name)}, ${escapeSql(dbCompany.bank_iban)}, ${escapeSql(dbCompany.bank_bic)}, ${escapeSql(dbCompany.mobile_money_numbers)}, ${escapeSql(dbCompany.medical_director_name)}, ${escapeSql(dbCompany.lab_turnaround_default)}, ${escapeSql(dbCompany.invoice_footer)}, ${escapeSql(dbCompany.hospital_services_config || DEFAULT_HOSPITAL_SERVICES)});\n\n`;

    // 4. Partners
    sql += `-- 4. Table des Patients & Partenaires (${dbPartners.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS res_partner (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, is_company TINYINT(1) DEFAULT 0, email VARCHAR(255), phone VARCHAR(100), street VARCHAR(255), city VARCHAR(100), vat VARCHAR(100), customer_rank INT DEFAULT 0, supplier_rank INT DEFAULT 0, gender VARCHAR(10), age INT, birth_date VARCHAR(50), blood_group VARCHAR(10), emergency_contact VARCHAR(200), social_security_number VARCHAR(100), insurance_company VARCHAR(150), insurance_rate DECIMAL(5,2) DEFAULT 0.00, allergies_json TEXT, chronic_conditions_json TEXT);\n`;
    dbPartners.forEach((p: any) => {
      sql += `INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (${p.id}, ${escapeSql(p.name)}, ${p.is_company ? 1 : 0}, ${escapeSql(p.email)}, ${escapeSql(p.phone)}, ${escapeSql(p.street)}, ${escapeSql(p.city)}, ${escapeSql(p.vat)}, ${p.customer_rank || 0}, ${p.supplier_rank || 0}, ${escapeSql(p.gender)}, ${p.age || 'NULL'}, ${escapeSql(p.birth_date)}, ${escapeSql(p.blood_group)}, ${escapeSql(p.emergency_contact)}, ${escapeSql(p.social_security_number)}, ${escapeSql(p.insurance_company)}, ${p.insurance_rate || 0}, ${escapeSql(p.allergies || [])}, ${escapeSql(p.chronic_conditions || [])});\n`;
    });
    sql += `\n`;

    // 5. Products & Acts
    sql += `-- 5. Table des Prestations, Médicaments & Examens (${dbProductProducts.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS product_product (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, default_code VARCHAR(100), list_price DECIMAL(15,2) NOT NULL DEFAULT 0.00, standard_price DECIMAL(15,2) DEFAULT 0.00, category_name VARCHAR(150), turnaround_time VARCHAR(100), sample_type VARCHAR(100), active TINYINT(1) DEFAULT 1, parameters_json TEXT);\n`;
    dbProductProducts.forEach((p: any) => {
      sql += `INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (${p.id}, ${escapeSql(p.name)}, ${escapeSql(p.default_code)}, ${p.list_price || 0}, ${p.standard_price || 0}, ${escapeSql(p.category_name || p.categ_id)}, ${escapeSql(p.turnaround_time)}, ${escapeSql(p.sample_type)}, ${p.active ? 1 : 0}, ${escapeSql(p.parameters || [])});\n`;
    });
    sql += `\n`;

    // 6. Taxes
    sql += `-- 6. Table des Taxes & TVA\n`;
    sql += `CREATE TABLE IF NOT EXISTS account_tax (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL, amount DECIMAL(8,4) NOT NULL, amount_type VARCHAR(50) DEFAULT 'percent', type_tax_use VARCHAR(50) DEFAULT 'sale', active TINYINT(1) DEFAULT 1, description TEXT);\n`;
    dbTaxes.forEach((t: any) => {
      sql += `INSERT INTO account_tax (id, name, amount, amount_type, type_tax_use, active, description) VALUES (${t.id}, ${escapeSql(t.name)}, ${t.amount}, ${escapeSql(t.amount_type || 'percent')}, ${escapeSql(t.type_tax_use || 'sale')}, ${t.active ? 1 : 0}, ${escapeSql(t.description)});\n`;
    });
    sql += `\n`;

    // 7. Moves / Invoices
    sql += `-- 7. Table des Factures & Pièces Comptables (${dbMoves.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS account_move (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL, move_type VARCHAR(50) NOT NULL, state VARCHAR(50) NOT NULL, partner_id INT, partner_name VARCHAR(255), date VARCHAR(50), invoice_date VARCHAR(50), invoice_date_due VARCHAR(50), amount_untaxed DECIMAL(15,2) DEFAULT 0.00, amount_tax DECIMAL(15,2) DEFAULT 0.00, amount_total DECIMAL(15,2) DEFAULT 0.00, amount_residual DECIMAL(15,2) DEFAULT 0.00, payment_state VARCHAR(50), invoice_user_id INT, invoice_user_name VARCHAR(150), insurance_share DECIMAL(15,2) DEFAULT 0.00, patient_share DECIMAL(15,2) DEFAULT 0.00, insurance_company VARCHAR(150), guarantee_letter_number VARCHAR(100), narration TEXT);\n`;
    dbMoves.forEach((m: any) => {
      sql += `INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (${m.id}, ${escapeSql(m.name)}, ${escapeSql(m.move_type)}, ${escapeSql(m.state)}, ${m.partner_id || 'NULL'}, ${escapeSql(m.partner_name)}, ${escapeSql(m.date)}, ${escapeSql(m.invoice_date)}, ${escapeSql(m.invoice_date_due)}, ${m.amount_untaxed || 0}, ${m.amount_tax || 0}, ${m.amount_total || 0}, ${m.amount_residual || 0}, ${escapeSql(m.payment_state)}, ${m.invoice_user_id || 'NULL'}, ${escapeSql(m.invoice_user_name)}, ${m.insurance_share || 0}, ${m.patient_share || m.amount_total || 0}, ${escapeSql(m.insurance_company)}, ${escapeSql(m.guarantee_letter_number)}, ${escapeSql(m.narration)});\n`;
    });
    sql += `\n`;

    // 8. Move Lines
    sql += `-- 8. Lignes de Factures (${dbMoveLines.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS account_move_line (id INT PRIMARY KEY, move_id INT NOT NULL, product_id INT, name VARCHAR(255) NOT NULL, quantity DECIMAL(10,2) DEFAULT 1.00, price_unit DECIMAL(15,2) DEFAULT 0.00, discount DECIMAL(5,2) DEFAULT 0.00, price_subtotal DECIMAL(15,2) DEFAULT 0.00, price_total DECIMAL(15,2) DEFAULT 0.00);\n`;
    dbMoveLines.forEach((l: any) => {
      sql += `INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (${l.id}, ${l.move_id}, ${l.product_id || 'NULL'}, ${escapeSql(l.name)}, ${l.quantity || 1}, ${l.price_unit || 0}, ${l.discount || 0}, ${l.price_subtotal || 0}, ${l.price_total || 0});\n`;
    });
    sql += `\n`;

    // 9. Payments
    sql += `-- 9. Table des Paiements & Règlements (${dbPayments.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS account_payment (id INT PRIMARY KEY, payment_reference VARCHAR(100), partner_id INT, partner_name VARCHAR(255), move_id INT, invoice_name VARCHAR(100), amount DECIMAL(15,2) DEFAULT 0.00, payment_date VARCHAR(50), state VARCHAR(50), payment_method_code VARCHAR(50), journal_name VARCHAR(100), cashier_name VARCHAR(150), transaction_reference VARCHAR(150));\n`;
    dbPayments.forEach((py: any) => {
      sql += `INSERT INTO account_payment (id, payment_reference, partner_id, partner_name, move_id, invoice_name, amount, payment_date, state, payment_method_code, journal_name, cashier_name, transaction_reference) VALUES (${py.id}, ${escapeSql(py.payment_reference || py.name)}, ${py.partner_id || 'NULL'}, ${escapeSql(py.partner_name)}, ${py.move_id || 'NULL'}, ${escapeSql(py.invoice_name)}, ${py.amount || 0}, ${escapeSql(py.payment_date)}, ${escapeSql(py.state)}, ${escapeSql(py.payment_method_code)}, ${escapeSql(py.journal_name)}, ${escapeSql(py.cashier_name)}, ${escapeSql(py.transaction_reference)});\n`;
    });
    sql += `\n`;

    // 10. Till Sessions
    sql += `-- 10. Table des Sessions de Caisse (${dbTillSessions.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS till_session (id INT PRIMARY KEY, session_code VARCHAR(100) NOT NULL, user_id INT, cashier_name VARCHAR(150), state VARCHAR(50), opening_balance DECIMAL(15,2) DEFAULT 0.00, closing_balance DECIMAL(15,2) DEFAULT 0.00, total_collected DECIMAL(15,2) DEFAULT 0.00, opening_date VARCHAR(50), closing_date VARCHAR(50), cash_difference DECIMAL(15,2) DEFAULT 0.00, closing_notes TEXT);\n`;
    dbTillSessions.forEach((ts: any) => {
      sql += `INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (${ts.id}, ${escapeSql(ts.session_code)}, ${ts.user_id || 'NULL'}, ${escapeSql(ts.cashier_name)}, ${escapeSql(ts.state)}, ${ts.opening_balance || 0}, ${ts.closing_actual_cash || 0}, ${ts.total_collected || 0}, ${escapeSql(ts.opening_date)}, ${escapeSql(ts.closing_date)}, ${ts.cash_difference || 0}, ${escapeSql(ts.closing_notes)});\n`;
    });
    sql += `\n`;

    // 11. Consultations
    sql += `-- 11. Table des Consultations & Constantes (${dbConsultations.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS medical_consultation (id INT PRIMARY KEY, partner_id INT NOT NULL, patient_name VARCHAR(255), doctor_name VARCHAR(200), specialty VARCHAR(100), date VARCHAR(50), status VARCHAR(50), chief_complaint TEXT, history_of_illness TEXT, blood_pressure VARCHAR(30), heart_rate INT, temperature DECIMAL(4,1), weight DECIMAL(5,2), height DECIMAL(5,2), spO2 INT, blood_glucose DECIMAL(6,2), triage_level INT DEFAULT 3, diagnosis_primary VARCHAR(255), diagnosis_icd10 VARCHAR(50), clinical_notes TEXT, prescriptions_json TEXT, lab_orders_json TEXT, imaging_orders_json TEXT);\n`;
    dbConsultations.forEach((c: any) => {
      sql += `INSERT INTO medical_consultation (id, partner_id, patient_name, doctor_name, specialty, date, status, chief_complaint, history_of_illness, blood_pressure, heart_rate, temperature, weight, height, spO2, blood_glucose, triage_level, diagnosis_primary, diagnosis_icd10, clinical_notes, prescriptions_json, lab_orders_json, imaging_orders_json) VALUES (${c.id}, ${c.partner_id}, ${escapeSql(c.patient_name)}, ${escapeSql(c.doctor_name)}, ${escapeSql(c.specialty)}, ${escapeSql(c.date)}, ${escapeSql(c.status)}, ${escapeSql(c.chief_complaint)}, ${escapeSql(c.history_of_illness)}, ${escapeSql(c.blood_pressure)}, ${c.heart_rate || 'NULL'}, ${c.temperature || 'NULL'}, ${c.weight || 'NULL'}, ${c.height || 'NULL'}, ${c.spO2 || 'NULL'}, ${c.blood_glucose || 'NULL'}, ${c.triage_level || 3}, ${escapeSql(c.diagnosis_primary)}, ${escapeSql(c.diagnosis_icd10 || c.diagnosis_code)}, ${escapeSql(c.clinical_notes)}, ${escapeSql(c.prescriptions || [])}, ${escapeSql(c.lab_orders || c.lab_order_ids || [])}, ${escapeSql(c.imaging_orders || [])});\n`;
    });
    sql += `\n`;

    // 12. Lab Orders
    sql += `-- 12. Table des Dossiers et Examens Biologiques (${dbLabOrders.length} enregistrements)\n`;
    sql += `CREATE TABLE IF NOT EXISTS lab_exam_order (id INT PRIMARY KEY, order_number VARCHAR(100) NOT NULL, partner_id INT, partner_name VARCHAR(255), patient_gender VARCHAR(10), patient_age INT, prescribing_doctor VARCHAR(255), sampling_date VARCHAR(50), status VARCHAR(50), department VARCHAR(100), conclusion TEXT, technician_name VARCHAR(150), parameters_json TEXT);\n`;
    dbLabOrders.forEach((o: any) => {
      sql += `INSERT INTO lab_exam_order (id, order_number, partner_id, partner_name, patient_gender, patient_age, prescribing_doctor, sampling_date, status, department, conclusion, technician_name, parameters_json) VALUES (${o.id}, ${escapeSql(o.order_number)}, ${o.partner_id || 'NULL'}, ${escapeSql(o.partner_name)}, ${escapeSql(o.patient_gender)}, ${o.patient_age || 'NULL'}, ${escapeSql(o.prescribing_doctor)}, ${escapeSql(o.sampling_date)}, ${escapeSql(o.status)}, ${escapeSql(o.department)}, ${escapeSql(o.conclusion)}, ${escapeSql(o.technician_name)}, ${escapeSql(o.parameters || [])});\n`;
    });
    sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

    const diskDumpPath = path.join(process.cwd(), 'database_dump_exhaustive.sql');
    if (fs.existsSync(diskDumpPath)) {
      const diskSql = fs.readFileSync(diskDumpPath, 'utf8');
      const filename = `dump_base_donnees_exhaustive_${dateStr}.sql`;
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(diskSql);
    }

    const filename = `dump_base_donnees_exhaustive_${dateStr}.sql`;
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  } catch (err) {
    console.error('Error generating SQL dump:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du dump SQL' });
  }
});

// Resilient Client-Server Synchronization & Backup Endpoints
app.get('/api/sync-status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    counts: {
      labOrders: dbLabOrders.length,
      moves: dbMoves.length,
      partners: dbPartners.length,
      payments: dbPayments.length,
      tillSessions: dbTillSessions.length,
    },
    savedAt: new Date().toISOString(),
  });
});

app.post('/api/sync-restore', (req: Request, res: Response) => {
  try {
    const { labOrders, moves, moveLines, partners, payments, tillSessions, partnerReductions } = req.body;
    let restoredLabOrders = 0;
    let restoredMoves = 0;
    let restoredPartners = 0;
    let restoredPayments = 0;

    if (Array.isArray(labOrders)) {
      labOrders.forEach((clientOrder: LabExamOrder) => {
        if (!clientOrder || !clientOrder.id) return;
        const exists = dbLabOrders.find((o) => o.id === clientOrder.id);
        if (!exists) {
          dbLabOrders.unshift(clientOrder);
          restoredLabOrders++;
          if (clientOrder.id >= nextLabOrderId) {
            nextLabOrderId = clientOrder.id + 1;
          }
        }
      });
    }

    if (Array.isArray(moves)) {
      moves.forEach((clientMove: AccountMove) => {
        if (!clientMove || !clientMove.id) return;
        const exists = dbMoves.find((m) => m.id === clientMove.id);
        if (!exists) {
          dbMoves.unshift(clientMove);
          restoredMoves++;
          if (clientMove.id >= nextMoveId) {
            nextMoveId = clientMove.id + 1;
          }
        }
      });
    }

    if (Array.isArray(moveLines)) {
      moveLines.forEach((line: AccountMoveLine) => {
        if (!line || !line.id) return;
        const exists = dbMoveLines.find((l) => l.id === line.id);
        if (!exists) {
          dbMoveLines.push(line);
          if (line.id >= nextMoveLineId) {
            nextMoveLineId = line.id + 1;
          }
        }
      });
    }

    if (Array.isArray(partners)) {
      partners.forEach((partner: ResPartner) => {
        if (!partner || !partner.id) return;
        const exists = dbPartners.find((p) => p.id === partner.id);
        if (!exists) {
          dbPartners.push(partner);
          restoredPartners++;
          if (partner.id >= nextPartnerId) {
            nextPartnerId = partner.id + 1;
          }
        }
      });
    }

    if (Array.isArray(payments)) {
      payments.forEach((payment: AccountPayment) => {
        if (!payment || !payment.id) return;
        const exists = dbPayments.find((p) => p.id === payment.id);
        if (!exists) {
          dbPayments.push(payment);
          restoredPayments++;
          if (payment.id >= nextPaymentId) {
            nextPaymentId = payment.id + 1;
          }
        }
      });
    }

    if (Array.isArray(partnerReductions)) {
      partnerReductions.forEach((r: PartnerReduction) => {
        if (!r || !r.id) return;
        const exists = dbPartnerReductions.find((pr) => pr.id === r.id);
        if (!exists) {
          dbPartnerReductions.push(r);
          if (r.id >= nextPartnerReductionId) {
            nextPartnerReductionId = r.id + 1;
          }
        }
      });
    }

    saveDb();

    res.json({
      success: true,
      restored: {
        labOrders: restoredLabOrders,
        moves: restoredMoves,
        partners: restoredPartners,
        payments: restoredPayments,
      },
      currentCounts: {
        labOrders: dbLabOrders.length,
        moves: dbMoves.length,
        partners: dbPartners.length,
        payments: dbPayments.length,
      },
    });
  } catch (err: any) {
    console.error('[Sync Restore Error]:', err);
    res.status(500).json({ error: 'Sync restore failed', details: err?.message });
  }
});

// Advanced SQL Simulator for the Schema ERD tool and laboratory workflow
function executeSqlSimulated(sql: string) {
  const queryLower = sql.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. v_suivi_patient_workflow
  if (queryLower.includes('v_suivi_patient_workflow')) {
    const isNdm0001 = queryLower.includes("'ndm0001'") || queryLower.includes('"ndm0001"') || queryLower.includes('ndm0001');
    const rows = [
      {
        ndm: isNdm0001 ? 'NDM0001' : 'CHU-00001001',
        patient_name: isNdm0001 ? 'M. Jean-Marc Koffi' : 'Koffi Yao Stéphane',
        opcaisse_id: 1,
        opcaisse_name: 'REC-2026-0001',
        paiement_status: 'regle',
        echantillon_id: 101,
        sample_type: 'Sang Total (Tube EDTA)',
        echantillon_status: 'valide',
        collected_at: '2026-09-11 08:30:00',
        validated_at: '2026-09-11 11:45:00',
        examen_name: 'NFS / Hémogramme',
        parameter_name: 'Hémoglobine',
        resultat_final: '14.2',
        resultat_num: 14.20,
        unit: 'g/dL',
        resultat_valide: 'TRUE'
      },
      {
        ndm: isNdm0001 ? 'NDM0001' : 'CHU-00001001',
        patient_name: isNdm0001 ? 'M. Jean-Marc Koffi' : 'Koffi Yao Stéphane',
        opcaisse_id: 1,
        opcaisse_name: 'REC-2026-0001',
        paiement_status: 'regle',
        echantillon_id: 101,
        sample_type: 'Sang Total (Tube EDTA)',
        echantillon_status: 'valide',
        collected_at: '2026-09-11 08:30:00',
        validated_at: '2026-09-11 11:45:00',
        examen_name: 'NFS / Hémogramme',
        parameter_name: 'Plaquettes',
        resultat_final: '245000',
        resultat_num: 245000.00,
        unit: '/mm³,',
        resultat_valide: 'TRUE'
      },
      {
        ndm: isNdm0001 ? 'NDM0001' : 'CHU-00001001',
        patient_name: isNdm0001 ? 'M. Jean-Marc Koffi' : 'Koffi Yao Stéphane',
        opcaisse_id: 1,
        opcaisse_name: 'REC-2026-0001',
        paiement_status: 'regle',
        echantillon_id: 101,
        sample_type: 'Sang Total (Tube EDTA)',
        echantillon_status: 'valide',
        collected_at: '2026-09-11 08:30:00',
        validated_at: '2026-09-11 11:45:00',
        examen_name: 'Glycémie à jeun',
        parameter_name: 'Glycémie',
        resultat_final: '0.92',
        resultat_num: 0.92,
        unit: 'g/L',
        resultat_valide: 'TRUE'
      }
    ];
    return {
      columns: ['ndm', 'patient_name', 'opcaisse_id', 'opcaisse_name', 'paiement_status', 'echantillon_id', 'sample_type', 'echantillon_status', 'collected_at', 'validated_at', 'examen_name', 'parameter_name', 'resultat_final', 'resultat_num', 'unit', 'resultat_valide'],
      rows: rows
    };
  }

  // 2. v_echantillons_a_prelever
  if (queryLower.includes('v_echantillons_a_prelever')) {
    return {
      columns: ['echantillon_id', 'ndm', 'patient_name', 'sample_type', 'status', 'created_at'],
      rows: [
        { echantillon_id: 102, ndm: '00015551', patient_name: 'Mme Awa DIABATÉ', sample_type: 'Sang Total (Tube EDTA)', status: 'nouveau', created_at: '2026-09-11 09:00:00' },
        { echantillon_id: 103, ndm: '00015552', patient_name: 'M. Sékou KOUYATÉ', sample_type: 'Urine (Flacon stérile)', status: 'accepte', created_at: '2026-09-11 09:15:00' }
      ]
    };
  }

  // 3. v_resultats_a_saisir
  if (queryLower.includes('v_resultats_a_saisir')) {
    return {
      columns: ['echantillon_id', 'ndm', 'patient_name', 'ligne_id', 'examen_name', 'status'],
      rows: [
        { echantillon_id: 104, ndm: '00015550', patient_name: 'BB TASSINE KADHISA', ligne_id: 201, examen_name: 'Goutte Épaisse Paludisme', status: 'accepte' },
        { echantillon_id: 105, ndm: '00015553', patient_name: 'Mme Fatou Diallo', ligne_id: 202, examen_name: 'Bilan Lipidique', status: 'transfere' }
      ]
    };
  }

  // 4. v_resultats_a_valider
  if (queryLower.includes('v_resultats_a_valider')) {
    return {
      columns: ['echantillon_id', 'ndm', 'patient_name', 'examen_name', 'resultat_id', 'parameter_name', 'resultat_final', 'resultat_num', 'unit', 'status'],
      rows: [
        { echantillon_id: 106, ndm: '00015545', patient_name: "M. Paul N'Guessan", examen_name: 'Créatininémie', resultat_id: 301, parameter_name: 'Créatinine plasmatique', resultat_final: '9.4', resultat_num: 9.4, unit: 'mg/L', status: 'saisi' },
        { echantillon_id: 106, ndm: '00015545', patient_name: "M. Paul N'Guessan", examen_name: 'Créatininémie', resultat_id: 302, parameter_name: 'DFG estimé (CKD-EPI)', resultat_final: '98', resultat_num: 98, unit: 'mL/min/1.73m²', status: 'saisi' }
      ]
    };
  }

  // 5. Direct tables:
  if (queryLower.includes('from caisse_opcaisse_ligne')) {
    return {
      columns: ['id', 'opcaisse_id', 'product_id', 'name', 'quantity', 'price_unit', 'price_total'],
      rows: [
        { id: 1, opcaisse_id: 1, product_id: 10, name: 'NFS / Hémogramme', quantity: 1.0, price_unit: 9500.00, price_total: 9500.00 },
        { id: 2, opcaisse_id: 1, product_id: 11, name: 'Glycémie à jeun', quantity: 1.0, price_unit: 5500.00, price_total: 5500.00 }
      ]
    };
  }
  if (queryLower.includes('from caisse_opcaisse')) {
    return {
      columns: ['id', 'name', 'partner_id', 'state', 'date', 'amount_total'],
      rows: [
        { id: 1, name: 'REC-2026-0001', partner_id: 6, state: 'regle', date: '2026-09-11', amount_total: 15000.00 },
        { id: 2, name: 'REC-2026-0002', partner_id: 7, state: 'draft', date: '2026-09-11', amount_total: 45000.00 }
      ]
    };
  }
  if (queryLower.includes('from labo_echantillon')) {
    return {
      columns: ['id', 'ndm', 'patient_name', 'opcaisse_id', 'sample_type', 'state', 'collected_at', 'accepted_at', 'transferred_at', 'entered_at', 'validated_at'],
      rows: [
        { id: 101, ndm: 'NDM0001', patient_name: 'M. Jean-Marc Koffi', opcaisse_id: 1, sample_type: 'Sang Total (Tube EDTA)', state: 'valide', collected_at: '2026-09-11 08:30:00', accepted_at: '2026-09-11 08:35:00', transferred_at: '2026-09-11 08:45:00', entered_at: '2026-09-11 10:30:00', validated_at: '2026-09-11 11:45:00' },
        { id: 102, ndm: '00015551', patient_name: 'Mme Awa DIABATÉ', opcaisse_id: 2, sample_type: 'Sang Total (Tube EDTA)', state: 'nouveau', collected_at: '2026-09-11 09:00:00', accepted_at: null, transferred_at: null, entered_at: null, validated_at: null },
        { id: 103, ndm: '00015552', patient_name: 'M. Sékou KOUYATÉ', opcaisse_id: 3, sample_type: 'Urine (Flacon stérile)', state: 'accepte', collected_at: '2026-09-11 09:15:00', accepted_at: '2026-09-11 09:30:00', transferred_at: null, entered_at: null, validated_at: null }
      ]
    };
  }
  if (queryLower.includes('from labo_ligne_echantillon')) {
    return {
      columns: ['id', 'echantillon_id', 'product_id', 'name'],
      rows: [
        { id: 201, echantillon_id: 101, product_id: 10, name: 'NFS / Hémogramme' },
        { id: 202, echantillon_id: 101, product_id: 11, name: 'Glycémie à jeun' }
      ]
    };
  }
  if (queryLower.includes('from resultat_resultat_labo')) {
    return {
      columns: ['id', 'ligne_echantillon_id', 'parameter_name', 'resultat_final', 'resultat_num', 'reference_range', 'unit', 'valider_ligne', 'validated_at', 'validated_by'],
      rows: [
        { id: 301, ligne_echantillon_id: 201, parameter_name: 'Hémoglobine', resultat_final: '14.2', resultat_num: 14.20, reference_range: '13.0 - 17.5', unit: 'g/dL', valider_ligne: 'TRUE', validated_at: '2026-09-11 11:45:00', validated_by: 'Dr. Aminata Touré' },
        { id: 302, ligne_echantillon_id: 201, parameter_name: 'Plaquettes', resultat_final: '245000', resultat_num: 245000.00, reference_range: '150000 - 450000', unit: '/mm³', valider_ligne: 'TRUE', validated_at: '2026-09-11 11:45:00', validated_by: 'Dr. Aminata Touré' },
        { id: 303, ligne_echantillon_id: 202, parameter_name: 'Glycémie à jeun', resultat_final: '0.92', resultat_num: 0.92, reference_range: '0.70 - 1.10', unit: 'g/L', valider_ligne: 'TRUE', validated_at: '2026-09-11 11:45:00', validated_by: 'Dr. Aminata Touré' }
      ]
    };
  }

  // 6. Base Tables from original implementation
  if (queryLower.includes('from res_partner')) {
    return { columns: ['id', 'name', 'email', 'phone', 'vat', 'customer_rank', 'supplier_rank'], rows: dbPartners };
  } else if (queryLower.includes('from account_move')) {
    return { columns: ['id', 'name', 'ref', 'move_type', 'state', 'amount_untaxed', 'amount_total', 'amount_residual', 'payment_state'], rows: dbMoves };
  } else if (queryLower.includes('from account_payment')) {
    return { columns: ['id', 'move_id', 'partner_id', 'amount', 'payment_date', 'state'], rows: dbPayments };
  } else if (queryLower.includes('from product_template') || queryLower.includes('from product_product')) {
    return { columns: ['id', 'name', 'list_price', 'uom_id'], rows: dbProductTemplates };
  } else {
    return {
      columns: ['table_name', 'total_rows', 'primary_key'],
      rows: [
        { table_name: 'res_partner', total_rows: dbPartners.length, primary_key: 'id' },
        { table_name: 'account_move', total_rows: dbMoves.length, primary_key: 'id' },
        { table_name: 'account_move_line', total_rows: dbMoveLines.length, primary_key: 'id' },
        { table_name: 'account_payment', total_rows: dbPayments.length, primary_key: 'id' },
        { table_name: 'product_template', total_rows: dbProductTemplates.length, primary_key: 'id' },
        { table_name: 'res_users', total_rows: dbUsers.length, primary_key: 'id' },
        { table_name: 'caisse_opcaisse', total_rows: 2, primary_key: 'id' },
        { table_name: 'labo_echantillon', total_rows: 3, primary_key: 'id' },
      ],
    };
  }
}

app.post('/api/db/query', (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'SQL query missing' });
  const result = executeSqlSimulated(sql);
  res.json(result);
});

app.post('/api/schema/execute', (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'SQL query missing' });
  const result = executeSqlSimulated(sql);
  res.json(result);
});

// 1.5 Company Branding & Settings
app.get('/api/company', (req: Request, res: Response) => {
  res.json(dbCompany);
});

app.put('/api/company', (req: Request, res: Response) => {
  dbCompany = {
    ...dbCompany,
    ...req.body,
  };
  saveDb();
  res.json(dbCompany);
});

app.post('/api/company', (req: Request, res: Response) => {
  dbCompany = {
    ...dbCompany,
    ...req.body,
  };
  saveDb();
  res.json(dbCompany);
});

// 2. Reference Tables
app.get('/api/countries', (req: Request, res: Response) => res.json(dbCountries));
app.get('/api/currencies', (req: Request, res: Response) => res.json(dbCurrencies));
app.get('/api/uom', (req: Request, res: Response) => res.json(dbUoms));
app.get('/api/uoms', (req: Request, res: Response) => res.json(dbUoms));
app.get('/api/taxes', (req: Request, res: Response) => res.json(dbTaxes));

// Groups & Roles Management
app.get('/api/groups', (req: Request, res: Response) => res.json(dbGroups));

app.post('/api/groups', (req: Request, res: Response) => {
  const { id, name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ error: 'Le nom du rôle est requis' });

  if (id) {
    const existingIndex = dbGroups.findIndex((g) => g.id === Number(id));
    if (existingIndex !== -1) {
      dbGroups[existingIndex] = {
        ...dbGroups[existingIndex],
        ...req.body,
      };
      saveDb();
      return res.json(dbGroups[existingIndex]);
    }
  }

  const newGroup: ResGroup = {
    id: nextGroupId++,
    name,
    description: description || null,
    permissions: Array.isArray(permissions) ? permissions : [],
    created_at: new Date().toISOString(),
  };

  dbGroups.push(newGroup);
  saveDb();
  res.status(201).json(newGroup);
});

app.put('/api/groups/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dbGroups.findIndex((g) => g.id === id);
  if (index === -1) return res.status(404).json({ error: 'Rôle introuvable' });

  dbGroups[index] = {
    ...dbGroups[index],
    ...req.body,
  };

  saveDb();
  res.json(dbGroups[index]);
});



app.delete('/api/groups/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbGroups = dbGroups.filter((g) => g.id !== id);
  saveDb();
  res.json({ message: 'Rôle supprimé avec succès' });
});

// 3. Partners (res_partner)
app.get('/api/partners', (req: Request, res: Response) => {
  const { type, q } = req.query;
  let result = [...dbPartners];

  if (type === 'customer') {
    result = result.filter((p) => p.customer_rank > 0);
  } else if (type === 'supplier') {
    result = result.filter((p) => p.supplier_rank > 0);
  }

  if (q) {
    const term = (q as string).toLowerCase();
    result = result.filter(
      (p) =>
        (p.name || '').toString().toLowerCase().includes(term) ||
        (p.email || '').toString().toLowerCase().includes(term) ||
        (p.vat || '').toString().toLowerCase().includes(term)
    );
  }

  // Compute total invoiced & total residual for each partner
  const enriched = result.map((p) => {
    const partnerMoves = dbMoves.filter((m) => m.partner_id === p.id && m.state === 'posted');
    const total_invoiced = partnerMoves.reduce((acc, m) => acc + m.amount_total, 0);
    const total_residual = partnerMoves.reduce((acc, m) => acc + m.amount_residual, 0);
    const country = dbCountries.find((c) => c.id === p.country_id);

    return {
      ...p,
      country_name: country ? country.name : '',
      total_invoiced,
      total_residual,
    };
  });

  // Sort newest first (by created_at or ID descending)
  enriched.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });

  res.json(enriched);
});

app.post('/api/partners', (req: Request, res: Response) => {
  const body = req.body;
  if (body.id) {
    const existingIndex = dbPartners.findIndex((p) => p.id === Number(body.id));
    if (existingIndex !== -1) {
      dbPartners[existingIndex] = {
        ...dbPartners[existingIndex],
        ...body,
        updated_at: new Date().toISOString(),
      };
      saveDb();
      return res.json(dbPartners[existingIndex]);
    }
  }

  // Only update existing partner if matched specifically by ID, NDM, or both exact name and phone
  if (!body.id) {
    let existingIndex = -1;
    if (body.ndm && String(body.ndm).trim() !== '') {
      existingIndex = dbPartners.findIndex(
        (p) => p.ndm && p.ndm.trim().toLowerCase() === String(body.ndm).trim().toLowerCase()
      );
    } else if (body.name && body.phone && String(body.phone).trim() !== '') {
      const trimmedName = String(body.name).trim().toLowerCase();
      const cleanPhone = String(body.phone).trim();
      existingIndex = dbPartners.findIndex(
        (p) => p.name && p.name.trim().toLowerCase() === trimmedName && p.phone === cleanPhone
      );
    }

    if (existingIndex !== -1) {
      const existing = dbPartners[existingIndex];
      dbPartners[existingIndex] = {
        ...existing,
        ...body,
        id: existing.id,
        // Keep existing NDM unless body provides a new one
        ndm: body.ndm || existing.ndm || null,
        phone: body.phone || existing.phone || null,
        updated_at: new Date().toISOString(),
      };
      saveDb();
      return res.json(dbPartners[existingIndex]);
    }
  }

  const newId = Math.max(nextPartnerId, ...dbPartners.map((p) => p.id || 0), 0) + 1;
  nextPartnerId = newId + 1;

  const newPartner: ResPartner = {
    id: newId,
    name: body.name || 'Nouveau Partenaire',
    is_company: body.is_company ?? true,
    email: body.email || null,
    phone: body.phone || null,
    street: body.street || null,
    city: body.city || null,
    zip: body.zip || null,
    country_id: body.country_id ? Number(body.country_id) : 1,
    vat: body.vat || null,
    customer_rank: body.customer_rank ?? 1,
    supplier_rank: body.supplier_rank ?? 0,
    active: true,
    partner_type: body.partner_type || (body.customer_rank ? 'patient' : 'supplier'),
    is_insurance: body.is_insurance ?? (body.partner_type === 'insurance'),
    convention_code: body.convention_code || null,
    default_coverage_rate: body.default_coverage_rate !== undefined ? Number(body.default_coverage_rate) : undefined,
    insurance_id: body.insurance_id ? Number(body.insurance_id) : null,
    insurance_name: body.insurance_name || null,
    insurance_policy_number: body.insurance_policy_number || null,
    insurance_coverage_rate: body.insurance_coverage_rate !== undefined ? Number(body.insurance_coverage_rate) : undefined,
    gender: body.gender || null,
    age: body.age !== undefined ? Number(body.age) : null,
    birth_date: body.birth_date || null,
    prescribing_doctor: body.prescribing_doctor || null,
    ndm: body.ndm || null,
    first_name: body.first_name || null,
    maiden_name: body.maiden_name || null,
    profession: body.profession || null,
    birth_place: body.birth_place || null,
    civil_status: body.civil_status || null,
    nationality: body.nationality || null,
    religion: body.religion || null,
    region: body.region || null,
    province: body.province || null,
    department: body.department || null,
    commune: body.commune || null,
    cnib: body.cnib || null,
    home_phone: body.home_phone || null,
    patient_class: body.patient_class || null,
    contact_person_name: body.contact_person_name || null,
    contact_person_relationship: body.contact_person_relationship || null,
    contact_person_phone: body.contact_person_phone || null,
    patient_photo: body.patient_photo || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbPartners.push(newPartner);
  saveDb();
  res.status(201).json(newPartner);
});

app.put('/api/partners/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dbPartners.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Partner not found' });

  dbPartners[index] = {
    ...dbPartners[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  saveDb();
  res.json(dbPartners[index]);
});

app.delete('/api/partners/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbPartners = dbPartners.filter((p) => p.id !== id);
  saveDb();
  res.json({ message: 'Partner deleted' });
});

// --- Partner Reductions APIs ---
app.get('/api/partner-reductions', (req: Request, res: Response) => {
  const sorted = [...dbPartnerReductions].sort((a, b) => b.id - a.id);
  res.json(sorted);
});

app.post('/api/partner-reductions', (req: Request, res: Response) => {
  const { patient_type, category_name, reduction_rate, active } = req.body;
  const newReduction: PartnerReduction = {
    id: nextPartnerReductionId++,
    patient_type: patient_type || 'Nouveau Type de Patient',
    category_name: category_name || 'All',
    reduction_rate: Number(reduction_rate) || 0,
    active: active !== undefined ? active : true,
    created_at: new Date().toISOString()
  };
  dbPartnerReductions.push(newReduction);
  saveDb();
  res.status(201).json(newReduction);
});

app.put('/api/partner-reductions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = dbPartnerReductions.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Reduction not found' });

  const red = dbPartnerReductions[idx];
  if (req.body.patient_type !== undefined) red.patient_type = req.body.patient_type;
  if (req.body.category_name !== undefined) red.category_name = req.body.category_name;
  if (req.body.reduction_rate !== undefined) red.reduction_rate = Number(req.body.reduction_rate);
  if (req.body.active !== undefined) red.active = req.body.active;

  saveDb();
  res.json(red);
});

app.delete('/api/partner-reductions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbPartnerReductions = dbPartnerReductions.filter((r) => r.id !== id);
  saveDb();
  res.json({ message: 'Reduction deleted' });
});

// Helper functions for excel mapping
function mapSubDomainToDepartment(subDomain: string): string {
  if (!subDomain) return 'Prestations & Soins Généraux';
  const clean = subDomain.trim().toUpperCase();
  switch (clean) {
    case 'CHIMIE':
    case 'ELECTROPHORESE':
    case 'LIQUIDE EPANCHEMENT':
    case 'IMMUNO-CHIMIE-E':
      return 'Biochimie Clinique';
    case 'HEMOGRAMME':
    case 'HEMOSTASE':
      return 'Hématologie & Cytologie';
    case 'SEROLOGIE':
      return 'Sérologie & Immunologie';
    case 'COPROCULTURE':
    case 'ECBU':
    case 'PUS':
    case 'HEMOCULTURE':
      return 'Microbiologie & Bactériologie';
    case 'IMMUNO-HEMATOLOGIE':
      return 'Immuno-Hématologie (Groupage)';
    case 'ANAPATH':
      return 'Biochimie Clinique';
    default:
      return 'Biochimie Clinique';
  }
}

function getSampleTypeFromSubDomain(subDomain: string): string {
  if (!subDomain) return 'Sang total (Tube EDTA Violet)';
  const clean = subDomain.trim().toUpperCase();
  switch (clean) {
    case 'CHIMIE':
    case 'SEROLOGIE':
    case 'ELECTROPHORESE':
    case 'IMMUNO-CHIMIE-E':
      return 'Sérum (Tube Sec Rouge / Jaune)';
    case 'HEMOGRAMME':
    case 'HEMOSTASE':
    case 'IMMUNO-HEMATOLOGIE':
      return 'Sang total (Tube EDTA Violet)';
    case 'ECBU':
      return 'Urines fraîches du matin (Flacon Stérile)';
    case 'COPROCULTURE':
      return 'Selles fraîches (Coprologie)';
    case 'PUS':
      return 'Prélèvement Vaginal / Écouvillon';
    default:
      return 'Sang total (Tube EDTA Violet)';
  }
}

// 4. Products & Medical Lab Analysis Catalog (product_template & product_product)
app.post('/api/products/import-template', (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'product.template.xlsx');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Le fichier product.template.xlsx est introuvable à la racine de l\'application.' });
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(firstSheet);

    let importedCount = 0;
    let duplicateCount = 0;

    interface TempExam {
      name: string;
      code: string;
      subDomain: string;
      tests: string[];
    }

    const tempExams: TempExam[] = [];
    let currentExam: TempExam | null = null;

    rows.forEach((row: any) => {
      const name = row['Nom'] || row['nom'];
      const test = row['Tests'] || row['tests'];

      if (name) {
        let code = row['Référence interne'] || row['référence interne'] || row['Reference'] || row['reference'] || `EXAM-${nextProductId + tempExams.length}`;
        code = String(code).trim();
        const subDomain = row['Sous domaine'] || row['sous domaine'] || '';
        
        currentExam = {
          name: String(name).trim(),
          code,
          subDomain: String(subDomain).trim(),
          tests: []
        };
        if (test) {
          currentExam.tests.push(String(test).trim());
        }
        tempExams.push(currentExam);
      } else if (currentExam && test) {
        const testStr = String(test).trim();
        if (!currentExam.tests.includes(testStr)) {
          currentExam.tests.push(testStr);
        }
      }
    });

    tempExams.forEach((tempExam) => {
      const nameLower = tempExam.name.toLowerCase();
      const codeLower = tempExam.code.toLowerCase();

      const exists = dbProductTemplates.some(t => t.name.trim().toLowerCase() === nameLower) ||
                     dbProductProducts.some(p => p.default_code.trim().toLowerCase() === codeLower);

      if (exists) {
        duplicateCount++;
        return;
      }

      const mappedDept = mapSubDomainToDepartment(tempExam.subDomain);
      const mappedSample = getSampleTypeFromSubDomain(tempExam.subDomain);

      const newTmplId = dbProductTemplates.length + 5000;
      
      const subTests = tempExam.tests.map(tName => ({
        name: tName,
        unit: '',
        reference_range: 'Normal'
      }));

      const newTemplate: ProductTemplate = {
        id: newTmplId,
        name: tempExam.name,
        description: tempExam.tests.length > 0 ? `Analyses incluses : ${tempExam.tests.join(', ')}` : `Analyse médicale de biologie clinique : ${tempExam.name}`,
        list_price: 5000.0,
        prix_tm: 0.0,
        prix_hp: 0.0,
        uom_id: 1,
        currency_id: 3,
        active: true,
        category_type: 'lab_exam',
        lab_department: mappedDept,
        lab_sample_type: mappedSample,
        lab_reference_range: tempExam.tests.length > 0 ? tempExam.tests.join(', ') : null,
        lab_turnaround_time: '2 heures',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lab_tests: subTests
      };

      const newVariant: ProductProduct = {
        id: nextProductId++,
        product_tmpl_id: newTmplId,
        default_code: tempExam.code,
        barcode: null,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dbProductTemplates.push(newTemplate);
      dbProductProducts.push(newVariant);
      importedCount++;
    });

    if (importedCount > 0) {
      saveDb();
    }

    res.json({
      success: true,
      message: `Importation réussie : ${importedCount} analyses importées avec leurs listes de tests, ${duplicateCount} doublons ignorés.`,
      importedCount,
      duplicateCount,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'importation :', error);
    res.status(500).json({ error: `Une erreur est survenue lors de l'importation : ${error.message}` });
  }
});

// Batch import endpoint for CSV / Excel upload from Admin Back-Office
app.post('/api/products/import-batch', (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Aucun élément valide à importer.' });
    }

    let importedCount = 0;
    let updatedCount = 0;

    items.forEach((item: any) => {
      const name = String(item.name || item.Nom || item.nom || '').trim();
      if (!name) return;

      const code = String(item.default_code || item.code || item['Référence interne'] || item['Référence'] || `PRD-${Date.now()}-${Math.floor(Math.random()*1000)}`).trim();
      const list_price = Number(item.list_price || item.prix_public || item.Prix || item['Prix Public'] || item['Prix public'] || 0);
      const prix_tm = Number(item.prix_tm || item.Prix_TM || item['Prix TM'] || item['Prix tm'] || 0);
      const prix_hp = Number(item.prix_hp || item.Prix_HP || item['Prix HP'] || item['Prix hp'] || 0);
      const category_type = item.category_type || item.type || 'service';
      const lab_department = item.lab_department || item.department || item.département || item['Département'] || 'Général';
      const description = item.description || item.Description || '';
      const lab_sample_type = item.lab_sample_type || item.echantillon || item['Échantillon'] || null;

      // Check if product with same code or exact name exists
      const existingProduct = dbProductProducts.find(p => p.default_code && p.default_code.toLowerCase() === code.toLowerCase());
      
      if (existingProduct) {
        const tmpl = dbProductTemplates.find(t => t.id === existingProduct.product_tmpl_id);
        if (tmpl) {
          tmpl.name = name;
          tmpl.list_price = list_price;
          tmpl.prix_tm = prix_tm;
          tmpl.prix_hp = prix_hp;
          tmpl.category_type = category_type;
          tmpl.lab_department = lab_department;
          if (description) tmpl.description = description;
          if (lab_sample_type) tmpl.lab_sample_type = lab_sample_type;
          tmpl.updated_at = new Date().toISOString();
        }
        existingProduct.updated_at = new Date().toISOString();
        updatedCount++;
      } else {
        const newTmplId = dbProductTemplates.length + 5000 + Math.floor(Math.random() * 10000);
        const newTemplate: ProductTemplate = {
          id: newTmplId,
          name,
          description,
          list_price,
          prix_tm,
          prix_hp,
          uom_id: 1,
          currency_id: 3,
          active: true,
          category_type,
          lab_department,
          lab_sample_type,
          lab_turnaround_time: '24h',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newVariant: ProductProduct = {
          id: nextProductId++,
          product_tmpl_id: newTmplId,
          default_code: code,
          barcode: null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        dbProductTemplates.push(newTemplate);
        dbProductProducts.push(newVariant);
        importedCount++;
      }
    });

    saveDb();

    res.json({
      success: true,
      message: `Importation terminée : ${importedCount} nouvelles prestations créées, ${updatedCount} mises à jour.`,
      importedCount,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Erreur lors du traitement du lot d\'importation :', error);
    res.status(500).json({ error: `Erreur serveur lors de l'importation : ${error.message}` });
  }
});

app.post('/api/products/seed-comprehensive', (req: Request, res: Response) => {
  try {
    let addedCount = 0;
    initialProductTemplates.forEach((initT) => {
      const exists = dbProductTemplates.some((t) => t.id === initT.id || t.name.trim().toLowerCase() === initT.name.trim().toLowerCase());
      if (!exists) {
        dbProductTemplates.push(initT);
        addedCount++;
      } else {
        const current = dbProductTemplates.find((t) => t.id === initT.id || t.name.trim().toLowerCase() === initT.name.trim().toLowerCase());
        if (current) {
          if (initT.prix_tm && !current.prix_tm) current.prix_tm = initT.prix_tm;
          if (initT.prix_hp && !current.prix_hp) current.prix_hp = initT.prix_hp;
          if (initT.lab_tests && (!current.lab_tests || current.lab_tests.length === 0)) current.lab_tests = initT.lab_tests;
        }
      }
    });

    initialProductProducts.forEach((initP) => {
      const exists = dbProductProducts.some((p) => p.id === initP.id || p.default_code === initP.default_code);
      if (!exists) {
        dbProductProducts.push(initP);
      }
    });

    saveDb();
    res.json({
      success: true,
      message: `Catalogue exhaustif synchronisé : ${dbProductTemplates.length} prestations au total disponibles dans la base.`,
      totalProducts: dbProductProducts.length,
      addedCount
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors du rechargement du catalogue.' });
  }
});

app.get('/api/products', (req: Request, res: Response) => {
  const products = dbProductProducts.map((p) => {
    const tmpl = dbProductTemplates.find((t) => t.id === p.product_tmpl_id);
    const uom = tmpl ? dbUoms.find((u) => u.id === tmpl.uom_id) : null;
    return {
      id: p.id,
      product_tmpl_id: p.product_tmpl_id,
      default_code: p.default_code,
      barcode: p.barcode,
      active: p.active,
      created_at: p.created_at,
      updated_at: p.updated_at,
      name: tmpl ? tmpl.name : 'Prestation inconnue',
      description: tmpl ? tmpl.description : '',
      list_price: tmpl ? tmpl.list_price : 0,
      prix_tm: tmpl ? (tmpl.prix_tm ?? 0) : 0,
      prix_hp: tmpl ? (tmpl.prix_hp ?? 0) : 0,
      uom_id: tmpl ? tmpl.uom_id : 1,
      uom_name: uom ? uom.name : 'Unités',
      category_type: tmpl?.category_type || 'service',
      lab_department: tmpl?.lab_department,
      lab_sample_type: tmpl?.lab_sample_type,
      lab_reference_range: tmpl?.lab_reference_range,
      lab_turnaround_time: tmpl?.lab_turnaround_time,
      lab_profile_exams: tmpl?.lab_profile_exams,
      lab_tests: tmpl?.lab_tests || [],
    };
  });

  // Sort newest first (by id descending or created_at)
  products.sort((a, b) => (b.id || 0) - (a.id || 0));

  res.json(products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const {
    name,
    description,
    list_price,
    prix_tm,
    prix_hp,
    default_code,
    barcode,
    uom_id,
    category_type,
    lab_department,
    lab_sample_type,
    lab_reference_range,
    lab_turnaround_time,
    lab_profile_exams,
    lab_tests,
  } = req.body;

  const newTmplId = dbProductTemplates.length + 10;
  const newTemplate: ProductTemplate = {
    id: newTmplId,
    name: name || 'Nouvelle Prestation / Analyse',
    description: description || '',
    list_price: Number(list_price) || 0,
    prix_tm: Number(prix_tm) || 0,
    prix_hp: Number(prix_hp) || 0,
    uom_id: Number(uom_id) || 1,
    currency_id: 1,
    active: true,
    category_type: category_type || 'service',
    lab_department: lab_department || null,
    lab_sample_type: lab_sample_type || null,
    lab_reference_range: lab_reference_range || null,
    lab_turnaround_time: lab_turnaround_time || null,
    lab_profile_exams: Array.isArray(lab_profile_exams) ? lab_profile_exams : [],
    lab_tests: Array.isArray(lab_tests) ? lab_tests : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const newVariant: ProductProduct = {
    id: nextProductId++,
    product_tmpl_id: newTmplId,
    default_code: default_code || `PRD-${nextProductId}`,
    barcode: barcode || null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbProductTemplates.push(newTemplate);
  dbProductProducts.push(newVariant);
  saveDb();

  res.status(201).json({
    ...newVariant,
    name: newTemplate.name,
    description: newTemplate.description,
    list_price: newTemplate.list_price,
    prix_tm: newTemplate.prix_tm,
    prix_hp: newTemplate.prix_hp,
    uom_id: newTemplate.uom_id,
    category_type: newTemplate.category_type,
    lab_department: newTemplate.lab_department,
    lab_sample_type: newTemplate.lab_sample_type,
    lab_reference_range: newTemplate.lab_reference_range,
    lab_turnaround_time: newTemplate.lab_turnaround_time,
    lab_profile_exams: newTemplate.lab_profile_exams,
    lab_tests: newTemplate.lab_tests,
  });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const prodIndex = dbProductProducts.findIndex((p) => p.id === id);
  if (prodIndex === -1) return res.status(404).json({ error: 'Product not found' });

  const variant = dbProductProducts[prodIndex];
  const tmplIndex = dbProductTemplates.findIndex((t) => t.id === variant.product_tmpl_id);

  if (req.body.default_code !== undefined) variant.default_code = req.body.default_code;
  if (req.body.barcode !== undefined) variant.barcode = req.body.barcode;
  variant.updated_at = new Date().toISOString();

  if (tmplIndex !== -1) {
    if (req.body.name !== undefined) dbProductTemplates[tmplIndex].name = req.body.name;
    if (req.body.description !== undefined) dbProductTemplates[tmplIndex].description = req.body.description;
    if (req.body.list_price !== undefined) dbProductTemplates[tmplIndex].list_price = Number(req.body.list_price);
    if (req.body.prix_tm !== undefined) dbProductTemplates[tmplIndex].prix_tm = Number(req.body.prix_tm);
    if (req.body.prix_hp !== undefined) dbProductTemplates[tmplIndex].prix_hp = Number(req.body.prix_hp);
    if (req.body.uom_id !== undefined) dbProductTemplates[tmplIndex].uom_id = Number(req.body.uom_id);
    if (req.body.category_type !== undefined) dbProductTemplates[tmplIndex].category_type = req.body.category_type;
    if (req.body.lab_department !== undefined) dbProductTemplates[tmplIndex].lab_department = req.body.lab_department;
    if (req.body.lab_sample_type !== undefined) dbProductTemplates[tmplIndex].lab_sample_type = req.body.lab_sample_type;
    if (req.body.lab_reference_range !== undefined) dbProductTemplates[tmplIndex].lab_reference_range = req.body.lab_reference_range;
    if (req.body.lab_turnaround_time !== undefined) dbProductTemplates[tmplIndex].lab_turnaround_time = req.body.lab_turnaround_time;
    if (req.body.lab_profile_exams !== undefined) dbProductTemplates[tmplIndex].lab_profile_exams = req.body.lab_profile_exams;
    if (req.body.lab_tests !== undefined) dbProductTemplates[tmplIndex].lab_tests = req.body.lab_tests;
    dbProductTemplates[tmplIndex].updated_at = new Date().toISOString();
  }

  saveDb();
  res.json({
    ...variant,
    name: dbProductTemplates[tmplIndex]?.name,
    list_price: dbProductTemplates[tmplIndex]?.list_price,
    prix_tm: dbProductTemplates[tmplIndex]?.prix_tm,
    prix_hp: dbProductTemplates[tmplIndex]?.prix_hp,
    description: dbProductTemplates[tmplIndex]?.description,
    uom_id: dbProductTemplates[tmplIndex]?.uom_id,
    category_type: dbProductTemplates[tmplIndex]?.category_type,
    lab_department: dbProductTemplates[tmplIndex]?.lab_department,
    lab_sample_type: dbProductTemplates[tmplIndex]?.lab_sample_type,
    lab_reference_range: dbProductTemplates[tmplIndex]?.lab_reference_range,
    lab_turnaround_time: dbProductTemplates[tmplIndex]?.lab_turnaround_time,
    lab_profile_exams: dbProductTemplates[tmplIndex]?.lab_profile_exams,
    lab_tests: dbProductTemplates[tmplIndex]?.lab_tests || [],
  });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const variant = dbProductProducts.find((p) => p.id === id);
  if (variant) {
    dbProductTemplates = dbProductTemplates.filter((t) => t.id !== variant.product_tmpl_id);
  }
  dbProductProducts = dbProductProducts.filter((p) => p.id !== id);
  saveDb();
  res.json({ message: 'Product deleted' });
});

// 5. Users & Groups (res_users, res_groups)
app.get('/api/users', (req: Request, res: Response) => {
  const enriched = dbUsers.map((u) => {
    const partner = dbPartners.find((p) => p.id === u.partner_id);
    const groups = dbGroups.filter((g) => (u.group_ids || []).includes(g.id));
    return {
      ...u,
      partner_name: partner ? partner.name : '',
      group_names: groups.map((g) => g.name),
    };
  });

  // Sort newest first (by id descending)
  enriched.sort((a, b) => b.id - a.id);

  res.json(enriched);
});

app.post('/api/users', (req: Request, res: Response) => {
  const { id, login, name, email, partner_id, group_ids, role, department, permissions, password, password_hash } = req.body;
  
  const providedPassword = password || password_hash;

  if (id) {
    const existingIndex = dbUsers.findIndex((u) => u.id === Number(id));
    if (existingIndex !== -1) {
      const current = dbUsers[existingIndex];
      dbUsers[existingIndex] = {
        ...current,
        ...req.body,
        password: providedPassword || current.password || current.password_hash || '123456',
        password_hash: providedPassword || current.password_hash || current.password || '123456',
        updated_at: new Date().toISOString(),
      };
      saveDb();
      return res.json(dbUsers[existingIndex]);
    }
  }

  const finalPass = providedPassword || '123456';
  const newUser: ResUser = {
    id: nextUserId++,
    login: login || `user_${nextUserId}`,
    password: finalPass,
    password_hash: finalPass,
    name: name || 'Nouvel Utilisateur',
    email: email || null,
    active: true,
    role: role || 'Opérateur',
    department: department || 'Laboratoire & Facturation',
    partner_id: partner_id ? Number(partner_id) : null,
    group_ids: Array.isArray(group_ids) ? group_ids : [2],
    permissions: Array.isArray(permissions) ? permissions : [],
    allowed_views: Array.isArray(req.body.allowed_views) ? req.body.allowed_views : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbUsers.push(newUser);
  saveDb();
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dbUsers.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const current = dbUsers[index];
  const providedPassword = req.body.password || req.body.password_hash;

  dbUsers[index] = {
    ...current,
    ...req.body,
    password: providedPassword || current.password || current.password_hash || '123456',
    password_hash: providedPassword || current.password_hash || current.password || '123456',
    updated_at: new Date().toISOString(),
  };

  saveDb();
  res.json(dbUsers[index]);
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbUsers = dbUsers.filter((u) => u.id !== id);
  saveDb();
  res.json({ message: 'User deleted' });
});

// 5.4.5 Medical Consultations & DME (HIS)
app.get('/api/consultations', (req: Request, res: Response) => {
  const { partner_id, status } = req.query;
  let result = [...dbConsultations];
  if (partner_id) {
    result = result.filter(c => c.partner_id === Number(partner_id));
  }
  if (status) {
    result = result.filter(c => c.status === status);
  }
  result.sort((a, b) => new Date(b.consultation_date || b.created_at).getTime() - new Date(a.consultation_date || a.created_at).getTime());
  res.json(result);
});

app.get('/api/consultations/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });
  res.json(consultation);
});

app.post('/api/consultations', (req: Request, res: Response) => {
  const body = req.body;
  const patient = dbPartners.find(p => p.id === Number(body.partner_id));
  
  const nextSeqNum = nextConsultationId++;
  const consNumber = `CONS-${new Date().getFullYear()}-${String(nextSeqNum).padStart(4, '0')}`;
  
  const newConsultation: MedicalConsultation = {
    id: nextSeqNum,
    consultation_number: consNumber,
    partner_id: Number(body.partner_id),
    patient_name: patient ? patient.name : (body.patient_name || 'Patient Inconnu'),
    patient_ndm: patient?.ndm || body.patient_ndm || null,
    patient_gender: patient?.gender || body.patient_gender || null,
    patient_age: patient?.age || body.patient_age || null,
    patient_phone: patient?.phone || body.patient_phone || null,
    insurance_name: patient?.insurance_name || body.insurance_name || null,
    insurance_coverage_rate: patient?.insurance_coverage_rate ?? body.insurance_coverage_rate ?? null,
    doctor_id: body.doctor_id ? Number(body.doctor_id) : null,
    doctor_name: body.doctor_name || 'Dr. Consultant',
    specialty: body.specialty || 'Médecine Générale',
    consultation_date: body.consultation_date || new Date().toISOString(),
    status: body.status || 'completed',
    chief_complaint: body.chief_complaint || '',
    history_of_present_illness: body.history_of_present_illness || '',
    medical_history: body.medical_history || '',
    allergies: body.allergies || '',
    physical_examination: body.physical_examination || '',
    diagnosis: body.diagnosis || '',
    diagnosis_code: body.diagnosis_code || null,
    vitals: body.vitals || {},
    prescribed_items: body.prescribed_items || [],
    medical_notes: body.medical_notes || '',
    next_appointment_date: body.next_appointment_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Workflow integration: "Tout découle de la consultation !"
  // 1. Auto-generate Lab Orders for prescribed lab exams
  const labItems = (newConsultation.prescribed_items || []).filter(i => i.type === 'lab_exam');
  if (labItems.length > 0) {
    const labExamNames = labItems.map(i => i.name);
    const newLabOrderId = nextLabOrderId++;
    const labOrderNo = `LAB-${new Date().getFullYear()}-${String(newLabOrderId).padStart(4, '0')}`;
    
    const { paramsList, expandedExams } = populateParametersForExams(labExamNames, newLabOrderId);
    
    const newLabOrder: LabExamOrder = {
      id: newLabOrderId,
      order_number: labOrderNo,
      partner_id: newConsultation.partner_id,
      partner_name: newConsultation.patient_name,
      patient_gender: newConsultation.patient_gender || 'M',
      patient_age: newConsultation.patient_age || undefined,
      prescribing_doctor: newConsultation.doctor_name,
      sampling_date: new Date().toISOString(),
      status: 'pending_sampling',
      department: 'Biologie & Consultation',
      exam_names: expandedExams,
      parameters: paramsList,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      statut_workflow: 'paye',
    };
    dbLabOrders.unshift(newLabOrder);
    newConsultation.lab_order_ids = [newLabOrderId];
  }

  // 2. Auto-generate Draft/Posted Invoice for Billing / Caisse if billable items exist
  const billableItems = (newConsultation.prescribed_items || []);
  if (billableItems.length > 0 && body.auto_generate_invoice !== false) {
    const moveId = nextMoveId++;
    const invSeq = nextInvoiceSeq++;
    const invName = `FAC/${new Date().getFullYear()}/${String(invSeq).padStart(4, '0')}`;
    
    const moveLines: AccountMoveLine[] = billableItems.map((item, idx) => {
      const lineId = nextMoveLineId++;
      return {
        id: lineId,
        move_id: moveId,
        partner_id: newConsultation.partner_id,
        product_id: item.product_id || null,
        account_id: 1,
        tax_ids: [],
        tax_rate: 0,
        name: `${item.name} ${item.instructions ? '(' + item.instructions + ')' : ''}`,
        quantity: item.quantity || 1,
        price_unit: item.price_unit || 0,
        price_subtotal: (item.price_unit || 0) * (item.quantity || 1),
        price_total: (item.price_unit || 0) * (item.quantity || 1),
        discount: 0,
        debit: (item.price_unit || 0) * (item.quantity || 1),
        credit: 0,
        balance: (item.price_unit || 0) * (item.quantity || 1),
        sequence: idx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product_name: item.name,
      };
    });

    const totalAmount = moveLines.reduce((acc, l) => acc + l.price_total, 0);
    const covRate = newConsultation.insurance_coverage_rate || 0;
    const insuranceAmt = covRate > 0 ? (totalAmount * covRate) / 100 : 0;
    const clientAmt = totalAmount - insuranceAmt;

    const newInvoice: AccountMove = {
      id: moveId,
      name: invName,
      ref: `CONS: ${consNumber}`,
      move_type: 'out_invoice',
      state: 'posted', // Transmitted to caisse
      partner_id: newConsultation.partner_id,
      invoice_date: new Date().toISOString().split('T')[0],
      date: new Date().toISOString(),
      invoice_date_due: new Date().toISOString().split('T')[0],
      currency_id: 3,
      amount_untaxed: totalAmount,
      amount_tax: 0,
      amount_total: totalAmount,
      amount_residual: totalAmount,
      payment_state: 'not_paid',
      fiscal_position_id: null,
      invoice_user_id: 1,
      company_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_name: newConsultation.doctor_name,
      invoice_user_name: newConsultation.doctor_name,
      ndm: newConsultation.patient_ndm,
      patient_name: newConsultation.patient_name,
      patient_phone: newConsultation.patient_phone,
      insurance_enabled: covRate > 0,
      insurance_name: newConsultation.insurance_name || undefined,
      insurance_coverage_rate: covRate,
      insurance_amount: insuranceAmt,
      client_share_amount: clientAmt,
      lines: moveLines,
      partner: patient,
    };
    dbMoves.unshift(newInvoice);
    newConsultation.invoice_id = moveId;
  }

  dbConsultations.unshift(newConsultation);
  saveDb();
  res.status(201).json(newConsultation);
});

app.put('/api/consultations/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dbConsultations.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Consultation non trouvée' });

  dbConsultations[index] = {
    ...dbConsultations[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  saveDb();
  res.json(dbConsultations[index]);
});

app.post('/api/consultations/:id/confirm-prescriptions', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  const {
    confirmedItems = [],
    cancelledItems = [],
    postponedItems = [],
    patient_agreed = true,
    prescription_notes = '',
    circuit_mode = 'internal', // 'internal' or 'external'
  } = req.body;

  // Set individual item statuses
  const updatedPrescriptions = (consultation.prescribed_items || []).map(item => {
    if (confirmedItems.some((ci: any) => ci.id === item.id || ci.name === item.name)) {
      return {
        ...item,
        workflow_status: patient_agreed ? ('confirmed' as const) : ('cancelled' as const),
        circuit: patient_agreed ? 'internal' : 'external',
      };
    }
    if (cancelledItems.some((ci: any) => ci.id === item.id || ci.name === item.name)) {
      return { ...item, workflow_status: 'cancelled' as const };
    }
    if (postponedItems.some((ci: any) => ci.id === item.id || ci.name === item.name)) {
      return { ...item, workflow_status: 'postponed' as const };
    }
    return item;
  });

  consultation.prescribed_items = updatedPrescriptions;
  consultation.status = 'completed'; // Consultation finished, removed from waiting list
  consultation.patient_choice = patient_agreed ? 'internal' : 'external';
  consultation.updated_at = new Date().toISOString();

  // If patient AGREES to do services in-house (Circuit Interne)
  if (patient_agreed && confirmedItems.length > 0) {
    const billableItems = confirmedItems;
    const moveId = nextMoveId++;
    const invSeq = nextInvoiceSeq++;
    const invName = `FAC/${new Date().getFullYear()}/${String(invSeq).padStart(4, '0')}`;
    
    const moveLines: AccountMoveLine[] = billableItems.map((item: any, idx: number) => {
      const lineId = nextMoveLineId++;
      return {
        id: lineId,
        move_id: moveId,
        partner_id: consultation.partner_id,
        product_id: item.product_id || null,
        account_id: 1,
        tax_ids: [],
        tax_rate: 0,
        name: `${item.name} ${item.instructions ? '(' + item.instructions + ')' : ''}`,
        quantity: item.quantity || 1,
        price_unit: item.price_unit || 0,
        price_subtotal: (item.price_unit || 0) * (item.quantity || 1),
        price_total: (item.price_unit || 0) * (item.quantity || 1),
        discount: 0,
        debit: (item.price_unit || 0) * (item.quantity || 1),
        credit: 0,
        balance: (item.price_unit || 0) * (item.quantity || 1),
        sequence: idx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product_name: item.name,
      };
    });

    const totalAmount = moveLines.reduce((acc, l) => acc + l.price_total, 0);
    const covRate = consultation.insurance_coverage_rate || 0;
    const insuranceAmt = covRate > 0 ? (totalAmount * covRate) / 100 : 0;
    const clientAmt = totalAmount - insuranceAmt;

    const patient = dbPartners.find(p => p.id === consultation.partner_id);

    const newInvoice: AccountMove = {
      id: moveId,
      name: invName,
      ref: `PRESCR: ${consultation.consultation_number}`,
      move_type: 'out_invoice',
      state: 'posted', // Transmitted directly to Caisse / Facturation
      partner_id: consultation.partner_id,
      invoice_date: new Date().toISOString().split('T')[0],
      date: new Date().toISOString(),
      invoice_date_due: new Date().toISOString().split('T')[0],
      currency_id: 3,
      amount_untaxed: totalAmount,
      amount_tax: 0,
      amount_total: totalAmount,
      amount_residual: totalAmount,
      payment_state: 'not_paid',
      fiscal_position_id: null,
      invoice_user_id: 1,
      company_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_name: consultation.doctor_name,
      invoice_user_name: consultation.doctor_name,
      ndm: consultation.patient_ndm,
      patient_name: consultation.patient_name,
      patient_phone: consultation.patient_phone,
      insurance_enabled: covRate > 0,
      insurance_name: consultation.insurance_name || undefined,
      insurance_coverage_rate: covRate,
      insurance_amount: insuranceAmt,
      client_share_amount: clientAmt,
      prescribing_doctor: consultation.doctor_name,
      is_prescription_invoice: true,
      consultation_id: consultation.id,
      lines: moveLines,
      partner: patient,
    };
    dbMoves.unshift(newInvoice);
    consultation.exam_invoice_id = moveId;
    (consultation as any).prescriptions_billing_status = 'invoiced';

    // Separate Lab Exams and Imaging Orders to dispatch them to their respective departments
    const labItems = confirmedItems.filter((i: any) => i.item_type === 'lab_exam' || i.item_type === 'lab_test' || i.type === 'lab_exam');
    if (labItems.length > 0) {
      const orderId = nextLabOrderId++;
      const orderNumber = `LAB/${new Date().getFullYear()}/${String(orderId).padStart(4, '0')}`;
      const examNames = labItems.map((i: any) => i.name);
      const generatedParams: any = populateParametersForExams(examNames, orderId);

      const newLabOrder: LabExamOrder = {
        id: orderId,
        order_number: orderNumber,
        invoice_id: moveId,
        partner_id: consultation.partner_id,
        partner_name: consultation.patient_name,
        prescribing_doctor: consultation.doctor_name,
        exam_names: examNames,
        status: 'pending_sampling',
        statut_workflow: 'paye',
        sampling_date: new Date().toISOString(),
        total_amount: labItems.reduce((acc: number, cur: any) => acc + (cur.price_unit || 0) * (cur.quantity || 1), 0),
        department: 'Biologie Médicale',
        parameters: (generatedParams && generatedParams.paramsList) ? generatedParams.paramsList : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: 1,
      };
      dbLabOrders.unshift(newLabOrder);
    }
  } else {
    // Patient refused in-house services: no invoice generated, mark as external prescription
    (consultation as any).external_prescription = {
      issued_at: new Date().toISOString(),
      doctor_name: consultation.doctor_name,
      doctor_title: (consultation as any).doctor_type === 'specialiste' ? `Dr. ${consultation.doctor_name} (Spécialiste)` : `Dr. ${consultation.doctor_name}`,
      items: confirmedItems,
      patient_name: consultation.patient_name,
      patient_ndm: consultation.patient_ndm,
      patient_age: consultation.patient_age,
      patient_gender: consultation.patient_gender,
      notes: prescription_notes || 'Prescription pour réalisation en externe à la demande du patient.',
    };
  }

  saveDb();
  res.json({
    consultation,
    patient_agreed,
    generated_invoice_id: consultation.exam_invoice_id,
  });
});

// 5.4.7 Patient Referral Workflow (Infirmier -> Medecin -> Specialiste)
app.post('/api/consultations/:id/referral', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  const {
    target_level, // 'medecin' | 'specialiste'
    target_specialty, // e.g. 'Cardiologie', 'Pédiatrie', 'Gynécologie', 'Chirurgie', 'Pneumologie', 'Neurologie'
    target_doctor_name,
    target_doctor_id,
    referral_reason, // Reason for transfer
    referral_notes, // Clinical transfer notes
    priority = 'urgent', // 'normal' | 'urgent' | 'critical'
    referred_by_role = 'infirmier', // 'infirmier' | 'medecin'
    referred_by_name = 'Soignant Référent',
  } = req.body;

  const referralEntry = {
    id: `ref-${Date.now()}`,
    timestamp: new Date().toISOString(),
    from_role: referred_by_role,
    from_name: referred_by_name,
    target_level,
    target_specialty: target_specialty || (target_level === 'specialiste' ? 'Médecine Spécialisée' : 'Médecine Générale'),
    target_doctor_name: target_doctor_name || null,
    target_doctor_id: target_doctor_id || null,
    reason: referral_reason || 'Cas dépassant les compétences du soignant initial',
    clinical_summary: referral_notes || '',
    priority,
  };

  if (!consultation.referral_history) {
    consultation.referral_history = [];
  }
  consultation.referral_history.push(referralEntry);

  // Calculate consultation fee differential (Reliquat de consultation)
  const baseFee = referred_by_role === 'infirmier' ? 5000 : 10000;
  const targetFee = target_level === 'specialiste' ? 15000 : 10000;
  const reliquat = Math.max(0, targetFee - baseFee);

  let generatedInvoiceId: number | null = null;
  let generatedInvoiceName: string | null = null;

  if (reliquat > 0) {
    const moveId = nextMoveId++;
    const invSeq = nextInvoiceSeq++;
    const invName = `FAC/${new Date().getFullYear()}/${String(invSeq).padStart(4, '0')}`;
    const lineId = nextMoveLineId++;
    const specialtyLabel = target_specialty || (target_level === 'specialiste' ? 'Médecine Spécialisée' : 'Médecine Générale');

    const moveLine: AccountMoveLine = {
      id: lineId,
      move_id: moveId,
      partner_id: consultation.partner_id,
      product_id: null,
      account_id: 1,
      tax_ids: [],
      tax_rate: 0,
      name: `Reliquat Consultation Référée (${referred_by_role.toUpperCase()} ➔ ${target_level.toUpperCase()} - ${specialtyLabel}) - Motif : ${referral_reason || 'Dépassement de compétences'}`,
      quantity: 1,
      price_unit: reliquat,
      price_subtotal: reliquat,
      price_total: reliquat,
      discount: 0,
      debit: reliquat,
      credit: 0,
      balance: reliquat,
      sequence: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_name: `Reliquat Consultation (${target_level})`,
    };

    const patient = dbPartners.find(p => p.id === consultation.partner_id);

    const reliquatInvoice: AccountMove = {
      id: moveId,
      name: invName,
      ref: `RELIQUAT: ${consultation.consultation_number}`,
      move_type: 'out_invoice',
      state: 'posted', // Directement mis dans la caisse en attente de paiement
      partner_id: consultation.partner_id,
      invoice_date: new Date().toISOString().split('T')[0],
      date: new Date().toISOString(),
      invoice_date_due: new Date().toISOString().split('T')[0],
      currency_id: 3,
      amount_untaxed: reliquat,
      amount_tax: 0,
      amount_total: reliquat,
      amount_residual: reliquat,
      payment_state: 'not_paid',
      fiscal_position_id: null,
      invoice_user_id: 1,
      company_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_name: referred_by_name,
      invoice_user_name: target_doctor_name || (target_level === 'specialiste' ? 'Médecin Spécialiste' : 'Médecin Généraliste'),
      ndm: consultation.patient_ndm,
      patient_name: consultation.patient_name,
      patient_phone: consultation.patient_phone,
      insurance_enabled: false,
      client_share_amount: reliquat,
      lines: [moveLine],
      partner: patient,
    };
    dbMoves.unshift(reliquatInvoice);

    generatedInvoiceId = moveId;
    generatedInvoiceName = invName;

    // Set consultation to pending payment for balance
    consultation.status = 'pending_payment';
    (consultation as any).has_pending_balance = true;
    (consultation as any).reliquat_amount = reliquat;
    (consultation as any).reliquat_invoice_id = moveId;
    (consultation as any).reliquat_invoice_name = invName;
    (consultation as any).reliquat_paid = false;
    (consultation as any).reliquat_reason = referral_reason || 'Orientation vers praticien supérieur';
  } else {
    // No fee difference - immediately transferred to receiving practitioner/specialist waiting queue
    consultation.status = 'waiting';
    (consultation as any).has_pending_balance = false;
    (consultation as any).reliquat_amount = 0;
    (consultation as any).reliquat_paid = true;
  }

  // Mark as referred so nurse/triage queue knows it has been transferred to doctor
  (consultation as any).referred_out = false;
  (consultation as any).referred_out_by = referred_by_name;

  // Update consultation status and metadata
  (consultation as any).referred_to_doctor = true;
  (consultation as any).target_level = target_level;
  (consultation as any).target_specialty = target_specialty;
  if (target_doctor_name) {
    consultation.doctor_name = target_doctor_name;
    (consultation as any).target_doctor_name = target_doctor_name;
  } else {
    consultation.doctor_name = target_level === 'specialiste' ? `Médecin Spécialiste (${target_specialty || 'Spécialité'})` : 'Médecin Généraliste';
  }
  if (target_doctor_id) {
    (consultation as any).target_doctor_id = target_doctor_id;
  }
  consultation.priority = priority;
  consultation.doctor_type = target_level === 'specialiste' ? 'specialiste' : 'generaliste';
  consultation.specialty = target_specialty || (target_level === 'specialiste' ? 'Cardiologie' : 'Médecine Générale');
  consultation.referral_reason = referral_reason;
  consultation.referred_from = `${referred_by_role.toUpperCase()}: ${referred_by_name}`;
  consultation.updated_at = new Date().toISOString();

  saveDb();
  res.json({
    message: reliquat > 0
      ? `Patient référé avec succès. Reliquat de ${reliquat.toLocaleString('fr-FR')} FCFA généré et mis en caisse pour attente de paiement.`
      : 'Patient référé avec succès au praticien cible.',
    consultation,
    referral: referralEntry,
    reliquat_amount: reliquat,
    reliquat_invoice_id: generatedInvoiceId,
    reliquat_invoice_name: generatedInvoiceName,
  });
});

// Pay Reliquat / Balance for Referral at Caisse
app.post('/api/consultations/:id/pay-balance', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  const invoiceId = (consultation as any).reliquat_invoice_id;
  const move = dbMoves.find(m => m.id === invoiceId);
  const receiptNum = `REC-REL-${Date.now().toString().slice(-6)}`;

  if (move) {
    const payAmt = move.amount_residual || (consultation as any).reliquat_amount || 5000;
    const paymentId = nextPaymentId++;
    const newPayment: AccountPayment = {
      id: paymentId,
      user_id: 1,
      move_id: move.id,
      partner_id: move.partner_id,
      journal_id: 2, // Caisse
      payment_method_id: 1, // Espèces
      amount: payAmt,
      payment_date: new Date().toISOString(),
      state: 'posted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      partner_name: move.patient_name || undefined,
      move_name: move.name || undefined,
    };
    dbPayments.push(newPayment);

    move.payment_state = 'paid';
    move.amount_residual = 0;
    move.state = 'posted';
    move.updated_at = new Date().toISOString();
  }

  (consultation as any).has_pending_balance = false;
  (consultation as any).reliquat_paid = true;
  (consultation as any).reliquat_receipt_number = receiptNum;
  consultation.status = 'waiting'; // Patient is now ready for doctor consultation!
  consultation.updated_at = new Date().toISOString();
  saveDb();
  res.json({
    message: 'Reliquat acquitté avec succès à la Caisse. Le patient est désormais prêt pour la consultation médicale.',
    consultation,
    receipt_number: receiptNum,
  });
});

app.delete('/api/consultations/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbConsultations = dbConsultations.filter(c => c.id !== id);
  saveDb();
  res.json({ message: 'Consultation supprimée avec succès' });
});

// 5.4.6 Vitals Recording & Triage Management
app.post('/api/consultations/:id/vitals', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  const {
    bp_systolic,
    bp_diastolic,
    heart_rate,
    spo2,
    temperature,
    weight,
    height,
    blood_sugar,
    pain_level,
    triage_level,
    vitals_notes,
    box_assigned,
    priority,
    taken_by_name,
    orient_to_doctor,
  } = req.body;

  const w = weight !== undefined && weight !== '' ? Number(weight) : consultation.vitals?.weight;
  const h = height !== undefined && height !== '' ? Number(height) : consultation.vitals?.height;
  const bmi = w && h ? Number((w / ((h / 100) * (h / 100))).toFixed(1)) : (consultation.vitals?.bmi || null);

  consultation.vitals = {
    ...consultation.vitals,
    bp_systolic: bp_systolic !== undefined && bp_systolic !== '' ? Number(bp_systolic) : (consultation.vitals?.bp_systolic ?? null),
    bp_diastolic: bp_diastolic !== undefined && bp_diastolic !== '' ? Number(bp_diastolic) : (consultation.vitals?.bp_diastolic ?? null),
    heart_rate: heart_rate !== undefined && heart_rate !== '' ? Number(heart_rate) : (consultation.vitals?.heart_rate ?? null),
    spo2: spo2 !== undefined && spo2 !== '' ? Number(spo2) : (consultation.vitals?.spo2 ?? null),
    temperature: temperature !== undefined && temperature !== '' ? Number(temperature) : (consultation.vitals?.temperature ?? null),
    weight: w ?? null,
    height: h ?? null,
    bmi,
    blood_sugar: blood_sugar !== undefined && blood_sugar !== '' ? Number(blood_sugar) : (consultation.vitals?.blood_sugar ?? null),
    pain_level: pain_level !== undefined && pain_level !== '' ? Number(pain_level) : (consultation.vitals?.pain_level ?? null),
    triage_level: triage_level || consultation.vitals?.triage_level || 'normal',
    vitals_notes: vitals_notes !== undefined ? vitals_notes : (consultation.vitals?.vitals_notes ?? null),
    taken_by_name: taken_by_name || 'Infirmière Major',
    taken_at: new Date().toISOString(),
  };

  if (box_assigned) consultation.box_assigned = box_assigned;
  if (priority) consultation.priority = priority;

  // Advance workflow: once vitals are recorded, orient to doctor waiting room
  if (orient_to_doctor !== false && (consultation.status === 'triage' || consultation.status === 'pending_payment')) {
    consultation.status = 'waiting';
  }

  consultation.updated_at = new Date().toISOString();
  saveDb();
  res.json(consultation);
});

app.post('/api/consultations/:id/triage', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  const { triage_level, priority, box_assigned, chief_complaint, orient_to_doctor, vitals_notes } = req.body;

  if (!consultation.vitals) consultation.vitals = {};
  if (triage_level) consultation.vitals.triage_level = triage_level;
  if (vitals_notes !== undefined) consultation.vitals.vitals_notes = vitals_notes;
  if (box_assigned) consultation.box_assigned = box_assigned;
  if (priority) consultation.priority = priority;
  if (chief_complaint) consultation.chief_complaint = chief_complaint;

  if (orient_to_doctor) {
    consultation.status = 'waiting';
  }

  consultation.updated_at = new Date().toISOString();
  saveDb();
  res.json(consultation);
});

app.post('/api/consultations/:id/start', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  consultation.status = 'in_consultation';
  consultation.updated_at = new Date().toISOString();
  saveDb();
  res.json(consultation);
});

app.post('/api/consultations/:id/complete', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  consultation.status = 'completed';
  consultation.updated_at = new Date().toISOString();
  saveDb();
  res.json(consultation);
});

// Quick Cash Payment for Consultation at queue
app.post('/api/consultations/:id/pay-cash', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const consultation = dbConsultations.find(c => c.id === id);
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

  const move = dbMoves.find(m => m.id === consultation.invoice_id);
  if (move) {
    const payAmt = move.amount_residual || move.client_share_amount || move.amount_total || 5000;
    const paymentId = nextPaymentId++;
    const newPayment: AccountPayment = {
      id: paymentId,
      user_id: 1,
      move_id: move.id,
      partner_id: move.partner_id,
      journal_id: 2, // Caisse
      payment_method_id: 1, // Espèces
      amount: payAmt,
      payment_date: new Date().toISOString(),
      state: 'posted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      partner_name: move.patient_name || undefined,
      move_name: move.name || undefined,
    };
    dbPayments.push(newPayment);

    move.payment_state = 'paid';
    move.amount_residual = 0;
    move.state = 'posted';
    move.updated_at = new Date().toISOString();
  }

  consultation.status = 'triage';
  consultation.updated_at = new Date().toISOString();
  saveDb();
  res.json({ consultation, move });
});

// 5.5 Lab Exam Orders & Results (lab_exam_order)
app.get('/api/lab-orders', (req: Request, res: Response) => {
  const { status, partner_id } = req.query;
  let result = [...dbLabOrders];
  if (status) result = result.filter((o) => o.status === status);
  if (partner_id) result = result.filter((o) => o.partner_id === Number(partner_id));

  // Sort newest first (by created_at / sampling_date / id descending)
  result.sort((a, b) => {
    const dateA = new Date(a.created_at || a.sampling_date || 0).getTime();
    const dateB = new Date(b.created_at || b.sampling_date || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });

  res.json(result);
});

app.get('/api/lab-orders/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = dbLabOrders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });
  res.json(order);
});

function populateParametersForExams(examNames: string[], orderId: number) {
  const paramsList: any[] = [];
  let pIdx = 0;
  
  const expandedExams = new Set<string>();
  
  examNames.forEach(exName => {
    const exNameLower = exName.trim().toLowerCase();
    const tmpl = dbProductTemplates.find(t => t.name.trim().toLowerCase() === exNameLower);
    if (tmpl && tmpl.category_type === 'lab_profile' && tmpl.lab_profile_exams) {
      tmpl.lab_profile_exams.forEach(subEx => expandedExams.add(subEx));
    } else {
      expandedExams.add(exName.trim());
    }
  });

  expandedExams.forEach(itName => {
    const tmpl = dbProductTemplates.find(t => t.name.trim().toLowerCase() === itName.toLowerCase());
    if (tmpl && tmpl.lab_tests && tmpl.lab_tests.length > 0) {
      tmpl.lab_tests.forEach(test => {
        paramsList.push({
          id: `p-${orderId}-${pIdx++}`,
          name: test.name,
          value: '',
          unit: test.unit || '',
          reference_range: test.reference_range || 'Normal',
          is_abnormal: false,
          exam_name: itName
        });
      });
    } else {
      paramsList.push({
        id: `p-${orderId}-${pIdx++}`,
        name: itName,
        value: '',
        unit: '',
        reference_range: tmpl?.lab_reference_range || 'Normal',
        is_abnormal: false,
        exam_name: itName
      });
    }
  });
  
  return { paramsList, expandedExams: Array.from(expandedExams) };
}

app.post('/api/lab-orders', (req: Request, res: Response) => {
  const orderId = nextLabOrderId++;
  const rawExams = Array.isArray(req.body.exam_names) ? req.body.exam_names : ['Analyse standard'];
  const { paramsList, expandedExams } = populateParametersForExams(rawExams, orderId);

  const newOrder: LabExamOrder = {
    id: orderId,
    order_number: req.body.order_number || `LAB-2026-${String(orderId).padStart(4, '0')}`,
    partner_id: Number(req.body.partner_id) || 1,
    partner_name: req.body.partner_name || 'Patient',
    patient_gender: req.body.patient_gender || 'M',
    patient_age: req.body.patient_age ? Number(req.body.patient_age) : undefined,
    prescribing_doctor: req.body.prescribing_doctor || '',
    sampling_date: req.body.sampling_date || new Date().toISOString(),
    status: req.body.status || 'in_progress',
    department: req.body.department || 'Biochimie & Hématologie',
    exam_names: expandedExams,
    parameters: paramsList.length > 0 ? paramsList : (Array.isArray(req.body.parameters) ? req.body.parameters : []),
    conclusion: req.body.conclusion || '',
    technician_name: req.body.technician_name || '',
    technician_id: req.body.technician_id ? Number(req.body.technician_id) : undefined,
    validated_by_doctor: req.body.validated_by_doctor || '',
    validated_by_id: req.body.validated_by_id ? Number(req.body.validated_by_id) : undefined,
    validated_at: req.body.validated_at || undefined,
    invoice_id: req.body.invoice_id ? Number(req.body.invoice_id) : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbLabOrders.unshift(newOrder);
  saveDb();
  res.status(201).json(newOrder);
});

// Automation Pipeline Active Tracker to prevent duplicate concurrent runs
const activeAutoPipelines = new Set<number>();

function triggerAutomatedWorkflowPipeline(orderId: number) {
  if (activeAutoPipelines.has(orderId)) return;
  activeAutoPipelines.add(orderId);

  // Step 1: Reception Technique in Lab (after 1000ms)
  setTimeout(() => {
    const order = dbLabOrders.find(o => o.id === orderId);
    if (!order) {
      activeAutoPipelines.delete(orderId);
      return;
    }

    if (order.status === 'in_progress' || order.statut_workflow === 'preleve') {
      const oldStatus = order.status;
      order.status = 'accepted';
      order.statut_workflow = 'accepte';
      order.accepte_par = 'Robot LIMS (Plateau Technique)';
      order.accepte_le = new Date().toISOString();
      order.updated_at = new Date().toISOString();

      const newLog: WorkflowLogEntry = {
        id: nextWorkflowLogId++,
        echantillon_id: order.id,
        resultat_id: order.id,
        etape: 'reception_laboratoire',
        etat_avant: oldStatus,
        etat_apres: 'accepted',
        acteur_nom: 'Moteur LIMS Automatique',
        commentaire: `Réception et enregistrement automatique des tubes sur le plateau technique (${order.department})`,
        date_action: new Date().toISOString()
      };
      dbWorkflowLogs.unshift(newLog);

      const newNotif: NotificationQueueEntry = {
        id: nextNotificationQueueId++,
        type: 'automate',
        destinataire: 'plateau.technique@hopital.com',
        sujet: `Réception Tube ${order.order_number}`,
        message: `Tubes réceptionnés avec succès pour le patient ${order.partner_name}. Envoi direct vers les automates d'analyses.`,
        echantillon_id: order.id,
        statut: 'envoye',
        date_creation: new Date().toISOString(),
        date_envoi: new Date().toISOString()
      };
      dbNotificationQueue.unshift(newNotif);
      saveDb();
    }

    // Step 2: Automated analyzer import & measurements (after +1200ms)
    setTimeout(() => {
      const ord = dbLabOrders.find(o => o.id === orderId);
      if (!ord || ord.status !== 'accepted') {
        activeAutoPipelines.delete(orderId);
        return;
      }

      // Populate realistic clinical values
      ord.parameters = ord.parameters.map(p => {
        let val = "12.0";
        const name = p.name.toLowerCase();
        
        if (name.includes('hémoglobine') || name.includes('hemoglobine') || name.includes('hb')) {
          val = Math.random() > 0.15 ? (12.5 + Math.random() * 2).toFixed(1) : (9.2 + Math.random() * 2).toFixed(1);
        } else if (name.includes('hématies') || name.includes('globules rouges') || name.includes('rbc')) {
          val = (4.1 + Math.random() * 1.2).toFixed(2);
        } else if (name.includes('leucocytes') || name.includes('globules blancs') || name.includes('wbc')) {
          val = (4.5 + Math.random() * 5).toFixed(1);
        } else if (name.includes('plaquettes') || name.includes('plt')) {
          val = Math.floor(160 + Math.random() * 250).toString();
        } else if (name.includes('hématocrite') || name.includes('ht')) {
          val = Math.floor(38 + Math.random() * 8).toString();
        } else if (name.includes('glycémie') || name.includes('glycemie')) {
          val = Math.random() > 0.15 ? (0.75 + Math.random() * 0.3).toFixed(2) : (1.42 + Math.random() * 0.6).toFixed(2);
        } else if (name.includes('créatinine') || name.includes('creatinine')) {
          val = (6.0 + Math.random() * 5).toFixed(1);
        } else if (name.includes('urée') || name.includes('uree')) {
          val = (0.18 + Math.random() * 0.25).toFixed(2);
        } else if (name.includes('cholestérol') || name.includes('cholesterol')) {
          val = (1.50 + Math.random() * 0.7).toFixed(2);
        } else if (name.includes('vgm')) {
          val = Math.floor(82 + Math.random() * 12).toString();
        } else if (name.includes('tcmh')) {
          val = Math.floor(27 + Math.random() * 5).toString();
        } else if (name.includes('ccmh')) {
          val = Math.floor(31 + Math.random() * 4).toString();
        } else if (name.includes('crp') || name.includes('c-réactive')) {
          val = (1.0 + Math.random() * 4.0).toFixed(1);
        } else if (name.includes('vs') || name.includes('vitesse')) {
          val = Math.floor(5 + Math.random() * 15).toString();
        } else {
          val = (10 + Math.random() * 80).toFixed(1);
        }

        let isAbnormal = false;
        if (p.reference_range) {
          const parts = p.reference_range.split('-').map(x => parseFloat(x.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const numVal = parseFloat(val);
            if (!isNaN(numVal) && (numVal < parts[0] || numVal > parts[1])) {
              isAbnormal = true;
            }
          }
        }

        return {
          ...p,
          value: val,
          is_abnormal: isAbnormal,
          source: 'automate',
          automate_statut: 'importe',
          date_import: new Date().toISOString()
        };
      });

      ord.status = 'results_entered';
      ord.statut_workflow = 'analyse';
      ord.automate_recu = true;
      ord.updated_at = new Date().toISOString();

      dbWorkflowLogs.unshift({
        id: nextWorkflowLogId++,
        echantillon_id: ord.id,
        resultat_id: ord.id,
        etape: 'import_automate',
        etat_avant: 'accepted',
        etat_apres: 'results_entered',
        acteur_nom: 'Automates Sysmex XN-1000 / Mindray (HL7)',
        commentaire: `Importation et acquisition automatique de ${ord.parameters.length} paramètres par liaison HL7 directe`,
        date_action: new Date().toISOString()
      });

      dbNotificationQueue.unshift({
        id: nextNotificationQueueId++,
        type: 'automate',
        destinataire: 'tech.paillasse@hopital.com',
        sujet: `HL7 Transmission Complète - Dossier ${ord.order_number}`,
        message: `Les résultats d'analyses d'automate ont été intégrés avec succès pour ${ord.partner_name}.`,
        echantillon_id: ord.id,
        statut: 'envoye',
        date_creation: new Date().toISOString(),
        date_envoi: new Date().toISOString()
      });
      saveDb();

      // Step 3: Tech Validation (after +1200ms)
      setTimeout(() => {
        const o3 = dbLabOrders.find(o => o.id === orderId);
        if (!o3 || (o3.status !== 'results_entered' && o3.status !== 'saisi')) {
          activeAutoPipelines.delete(orderId);
          return;
        }

        o3.status = 'valide_tech';
        o3.statut_workflow = 'valide_tech';
        o3.updated_at = new Date().toISOString();

        dbWorkflowLogs.unshift({
          id: nextWorkflowLogId++,
          echantillon_id: o3.id,
          resultat_id: o3.id,
          etape: 'validation_technique',
          etat_avant: 'results_entered',
          etat_apres: 'valide_tech',
          acteur_nom: 'Moteur LIMS (Auto-Validation)',
          commentaire: "Validation technique automatique : Concordance Delta-Check vérifiée, absence d'interférences",
          date_action: new Date().toISOString()
        });
        saveDb();

        // Step 4: Biological validation & electronic certified signature (after +1200ms)
        setTimeout(() => {
          const o4 = dbLabOrders.find(o => o.id === orderId);
          if (!o4 || o4.status !== 'valide_tech') {
            activeAutoPipelines.delete(orderId);
            return;
          }

          const pseudoSig = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
          const sigHash = 'SIG-' + pseudoSig.toUpperCase();

          o4.status = 'validated';
          o4.statut_workflow = 'valide_biologiste';
          o4.pdf_signe = true;
          o4.hash_signature = sigHash;
          o4.validated_by_doctor = 'Dr. Mohamed Mandé (Médecin Biologiste)';
          o4.validated_by_id = 5;
          o4.validated_at = new Date().toISOString();
          o4.updated_at = new Date().toISOString();

          dbWorkflowLogs.unshift({
            id: nextWorkflowLogId++,
            echantillon_id: o4.id,
            resultat_id: o4.id,
            etape: 'validation_biologiste',
            etat_avant: 'valide_tech',
            etat_apres: 'validated',
            acteur_nom: 'Dr. Mohamed Mandé (Médecin Biologiste)',
            commentaire: `Validation biologique certifiée & signature numérique apposée (Empreinte certifiée : ${sigHash})`,
            date_action: new Date().toISOString()
          });

          dbNotificationQueue.unshift({
            id: nextNotificationQueueId++,
            type: 'email',
            destinataire: 'patient@email.com',
            sujet: `Compte-rendu médical validé - Dossier ${o4.order_number}`,
            message: `Le compte-rendu d'analyse médicale pour ${o4.partner_name} a été validé biologiquement par le médecin.`,
            echantillon_id: o4.id,
            statut: 'envoye',
            date_creation: new Date().toISOString(),
            date_envoi: new Date().toISOString()
          });
          saveDb();

          // Step 5: Final Delivery (SMS + Email + Patient Portal) (after +1200ms)
          setTimeout(() => {
            const o5 = dbLabOrders.find(o => o.id === orderId);
            if (!o5 || (o5.status !== 'validated' && o5.statut_workflow !== 'valide_biologiste')) {
              activeAutoPipelines.delete(orderId);
              return;
            }

            o5.statut_workflow = 'envoye';
            o5.pdf_path = `/var/labo/resultats/${o5.order_number}.pdf`;
            o5.envoye_email = true;
            o5.envoye_sms = true;
            o5.envoye_portail = true;
            o5.date_envoi = new Date().toISOString();
            o5.destinataires = 'Patient, Médecin prescripteur';
            o5.updated_at = new Date().toISOString();

            dbWorkflowLogs.unshift({
              id: nextWorkflowLogId++,
              echantillon_id: o5.id,
              resultat_id: o5.id,
              etape: 'envoi',
              etat_avant: 'validated',
              etat_apres: 'validated',
              acteur_nom: 'Système de Diffusion LIMS',
              commentaire: `Rendu final complété. Compte-rendu PDF certifié transmis par SMS et Email, et mis à disposition sur l'espace patient.`,
              date_action: new Date().toISOString()
            });

            dbNotificationQueue.unshift({
              id: nextNotificationQueueId++,
              type: 'sms',
              destinataire: '+225 07 00 00 00 00',
              sujet: 'SMS Patient Notification Rendu',
              message: `Bonjour ${o5.partner_name}, vos résultats d'analyses du dossier ${o5.order_number} sont disponibles en ligne sur votre portail sécurisé.`,
              echantillon_id: o5.id,
              statut: 'envoye',
              date_creation: new Date().toISOString(),
              date_envoi: new Date().toISOString()
            });
            saveDb();
            activeAutoPipelines.delete(orderId);
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  }, 1000);
}

app.put('/api/lab-orders/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = dbLabOrders.findIndex((o) => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Lab order not found' });

  const oldStatus = dbLabOrders[index].status;
  const newStatus = req.body.status;

  dbLabOrders[index] = {
    ...dbLabOrders[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  // If status is transitioning to in_progress (Sampling confirmed), automatically trigger the entire pipeline!
  if (newStatus === 'in_progress' || req.body.statut_workflow === 'preleve') {
    if (!dbLabOrders[index].preleve_le) {
      dbLabOrders[index].preleve_le = new Date().toISOString();
      dbLabOrders[index].preleve_par = req.body.technician_name || req.body.preleve_par || 'Agent préleveur';
    }
    
    // Add sampling log
    dbWorkflowLogs.unshift({
      id: nextWorkflowLogId++,
      echantillon_id: id,
      resultat_id: id,
      etape: 'prelevement',
      etat_avant: oldStatus,
      etat_apres: 'in_progress',
      acteur_nom: req.body.technician_name || req.body.preleve_par || 'Agent préleveur',
      commentaire: `Prélèvement enregistré et confirmé. Tube prêt pour l'analyse technique.`,
      date_action: new Date().toISOString()
    });
  }

  saveDb();
  res.json(dbLabOrders[index]);
});

app.delete('/api/lab-orders/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbLabOrders = dbLabOrders.filter((o) => o.id !== id);
  saveDb();
  res.json({ message: 'Lab order deleted' });
});

// --- NEW WORKFLOW AUTOMATION ENDPOINTS ---

// Get all real-time workflow logs
app.get('/api/lab-workflow-logs', (req: Request, res: Response) => {
  const { echantillon_id } = req.query;
  let logs = [...dbWorkflowLogs];
  if (echantillon_id) {
    logs = logs.filter(l => l.echantillon_id === Number(echantillon_id));
  }
  // Sort newest first
  logs.sort((a, b) => new Date(b.date_action).getTime() - new Date(a.date_action).getTime() || b.id - a.id);
  res.json(logs);
});

// Get consolidated audit logs (Workflow, Caisse, Notifications, Relances)
app.get('/api/all-audit-logs', (req: Request, res: Response) => {
  const allLogs: any[] = [];

  // 1. Workflow logs
  dbWorkflowLogs.forEach(l => {
    const order = dbLabOrders.find(o => o.id === l.echantillon_id);
    allLogs.push({
      id: `wf-${l.id}`,
      category: 'workflow_lims',
      category_label: 'Workflow LIMS & Analyses',
      timestamp: l.date_action,
      etape: l.etape,
      etat_avant: l.etat_avant,
      etat_apres: l.etat_apres,
      acteur: l.acteur_nom || 'Système',
      reference: order ? order.order_number : `Ech #${l.echantillon_id}`,
      patient_name: order ? order.partner_name : '',
      description: l.commentaire || `Transition vers ${l.etat_apres}`,
      raw: l
    });
  });

  // 2. Notification logs
  dbNotificationQueue.forEach(n => {
    const order = n.echantillon_id ? dbLabOrders.find(o => o.id === n.echantillon_id) : undefined;
    allLogs.push({
      id: `notif-${n.id}`,
      category: 'notification',
      category_label: 'Notifications & Messages',
      timestamp: n.date_creation,
      etape: n.type === 'sms' ? 'SMS Patient' : n.type === 'email' ? 'Email Médical' : 'Flux HL7 Automate',
      etat_avant: 'queue',
      etat_apres: n.statut,
      acteur: 'Serveur de Notifications',
      reference: order ? order.order_number : `Dest: ${n.destinataire}`,
      patient_name: order ? order.partner_name : '',
      description: `${n.sujet ? `[${n.sujet}] ` : ''}${n.message}`,
      raw: n
    });
  });

  // 3. Till session activity logs
  dbTillSessions.forEach(s => {
    if (s.activity_logs) {
      s.activity_logs.forEach(act => {
        allLogs.push({
          id: `till-${act.id}`,
          category: 'caisse_security',
          category_label: 'Sécurité & Caisse',
          timestamp: act.timestamp,
          etape: act.type === 'creation' ? 'Ouverture Caisse' : act.type === 'closure' ? 'Clôture Caisse' : 'Mouvement Caisse',
          etat_avant: '-',
          etat_apres: s.state,
          acteur: act.author || 'Caissier',
          reference: s.session_code,
          patient_name: s.till_name,
          description: act.message,
          raw: act
        });
      });
    }
  });

  // Sort by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    total: allLogs.length,
    workflow_count: dbWorkflowLogs.length,
    notifications_count: dbNotificationQueue.length,
    logs: allLogs
  });
});

// Get all notifications in queue
app.get('/api/lab-notifications', (req: Request, res: Response) => {
  const sorted = [...dbNotificationQueue].sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime() || b.id - a.id);
  res.json(sorted);
});

// Clear all logs or notifications (helper)
app.post('/api/lab-clear-workflow-data', (req: Request, res: Response) => {
  dbWorkflowLogs = [];
  dbNotificationQueue = [];
  nextWorkflowLogId = 1;
  nextNotificationQueueId = 1;
  saveDb();
  res.json({ status: 'ok' });
});

// Advance workflow manually
app.post('/api/lab-orders/:id/advance-workflow', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = dbLabOrders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });

  const oldStatus = order.status;
  const { next_status, actor_name, comment } = req.body;

  if (next_status) {
    order.status = next_status;
    order.statut_workflow = next_status; // sync new SQL field

    if (next_status === 'in_progress') {
      order.preleve_par = actor_name || 'Infirmier de garde';
      order.preleve_le = new Date().toISOString();
    } else if (next_status === 'accepted') {
      order.accepte_par = actor_name || 'Chef Plateau Technique';
      order.accepte_le = new Date().toISOString();
    }
  }

  order.updated_at = new Date().toISOString();

  // 1. Write to Workflow Audit Log
  const newLog: WorkflowLogEntry = {
    id: nextWorkflowLogId++,
    echantillon_id: order.id,
    resultat_id: order.id,
    etape: next_status || 'transition',
    etat_avant: oldStatus,
    etat_apres: order.status,
    acteur_nom: actor_name || 'Système',
    commentaire: comment || `Mise à jour du statut vers ${order.status}`,
    date_action: new Date().toISOString()
  };
  dbWorkflowLogs.unshift(newLog);

  // 2. Queue simulated Notification
  const newNotif: NotificationQueueEntry = {
    id: nextNotificationQueueId++,
    type: 'email',
    destinataire: 'chef.plateau@hopital.com',
    sujet: `Workflow Echantillon ${order.order_number}`,
    message: `L'échantillon du patient ${order.partner_name} est passé au statut [${order.status}]. Commentaire: ${comment || 'Aucun'}`,
    echantillon_id: order.id,
    resultat_id: order.id,
    statut: 'envoye',
    date_creation: new Date().toISOString(),
    date_envoi: new Date().toISOString()
  };
  dbNotificationQueue.unshift(newNotif);

  saveDb();
  res.json({ order, log: newLog, notification: newNotif });
});

// Simulate Automate Import (HL7 / ASTM protocol)
app.post('/api/lab-orders/:id/simulate-automate-import', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = dbLabOrders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });

  const oldStatus = order.status;
  
  // Fill all parameters with highly realistic simulated results
  order.parameters = order.parameters.map(p => {
    let val = "12.0";
    const name = p.name.toLowerCase();
    
    if (name.includes('hémoglobine') || name.includes('hemoglobine') || name.includes('hb')) {
      // Simulate normal (80%) or slightly abnormal (20%) anemic Hb value
      val = Math.random() > 0.2 ? (12.5 + Math.random() * 2).toFixed(1) : (9.2 + Math.random() * 2).toFixed(1);
    } else if (name.includes('hématies') || name.includes('globules rouges') || name.includes('rbc')) {
      val = (4.1 + Math.random() * 1.2).toFixed(2);
    } else if (name.includes('leucocytes') || name.includes('globules blancs') || name.includes('wbc')) {
      val = (4.5 + Math.random() * 5).toFixed(1);
    } else if (name.includes('plaquettes') || name.includes('plt')) {
      val = Math.floor(160 + Math.random() * 250).toString();
    } else if (name.includes('hématocrite') || name.includes('ht')) {
      val = Math.floor(38 + Math.random() * 8).toString();
    } else if (name.includes('glycémie') || name.includes('glycemie')) {
      val = Math.random() > 0.15 ? (0.75 + Math.random() * 0.3).toFixed(2) : (1.42 + Math.random() * 0.6).toFixed(2);
    } else if (name.includes('créatinine') || name.includes('creatinine')) {
      val = (6.0 + Math.random() * 5).toFixed(1);
    } else if (name.includes('urée') || name.includes('uree')) {
      val = (0.18 + Math.random() * 0.25).toFixed(2);
    } else if (name.includes('cholestérol') || name.includes('cholesterol')) {
      val = (1.50 + Math.random() * 0.7).toFixed(2);
    } else if (name.includes('vgm')) {
      val = Math.floor(82 + Math.random() * 12).toString();
    } else if (name.includes('tcmh')) {
      val = Math.floor(27 + Math.random() * 5).toString();
    } else if (name.includes('ccmh')) {
      val = Math.floor(31 + Math.random() * 4).toString();
    } else {
      // Generic test value
      val = (10 + Math.random() * 90).toFixed(1);
    }

    // Determine abnormal state from reference ranges
    let isAbnormal = false;
    if (p.reference_range) {
      const parts = p.reference_range.split('-').map(x => parseFloat(x.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && (numVal < parts[0] || numVal > parts[1])) {
          isAbnormal = true;
        }
      }
    }

    return {
      ...p,
      value: val,
      is_abnormal: isAbnormal,
      source: 'automate',
      automate_statut: 'importe',
      date_import: new Date().toISOString()
    };
  });

  // Transit states
  order.status = 'results_entered'; // 'Saisi'
  order.statut_workflow = 'analyse';
  order.automate_recu = true;
  order.updated_at = new Date().toISOString();

  // Create audit log for automatic connection
  const newLog: WorkflowLogEntry = {
    id: nextWorkflowLogId++,
    echantillon_id: order.id,
    resultat_id: order.id,
    etape: 'import_automate',
    etat_avant: oldStatus,
    etat_apres: 'results_entered',
    acteur_nom: 'Automate Sysmex XN-1000 (HL7)',
    commentaire: `Importation réussie de ${order.parameters.length} résultats biologiques par connexion HL7 directe (Code-barres SID détecté)`,
    date_action: new Date().toISOString()
  };
  dbWorkflowLogs.unshift(newLog);

  // Queue notification
  const newNotif: NotificationQueueEntry = {
    id: nextNotificationQueueId++,
    type: 'automate',
    destinataire: 'tech.paillasse@hopital.com',
    sujet: `HL7 Import Success - ${order.order_number}`,
    message: `Les résultats d'analyses d'Hémogramme/NFS ont été entièrement importés avec succès depuis l'automate.`,
    echantillon_id: order.id,
    statut: 'envoye',
    date_creation: new Date().toISOString(),
    date_envoi: new Date().toISOString()
  };
  dbNotificationQueue.unshift(newNotif);

  saveDb();
  res.json({ order, log: newLog, notification: newNotif });
});

// Electronic signature / Biologist validation
app.post('/api/lab-orders/:id/sign-biologist', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = dbLabOrders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });

  const oldStatus = order.status;
  const doctorName = req.body.doctor || 'Dr. Mohamed Mandé (Médecin Biologiste)';
  const doctorId = req.body.doctor_id || 5;

  // Sign electronic pdf & generate crypt hash (simulating SQL MD5)
  const pseudoSignature = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const signatureHash = 'SIG-' + pseudoSignature.substring(0, 16).toUpperCase();

  order.status = 'validated'; // Validé
  order.statut_workflow = 'valide_biologiste';
  order.pdf_signe = true;
  order.hash_signature = signatureHash;
  order.validated_by_doctor = doctorName;
  order.validated_by_id = doctorId;
  order.validated_at = new Date().toISOString();
  order.updated_at = new Date().toISOString();

  // Create audit log
  const newLog: WorkflowLogEntry = {
    id: nextWorkflowLogId++,
    echantillon_id: order.id,
    resultat_id: order.id,
    etape: 'validation_biologiste',
    etat_avant: oldStatus,
    etat_apres: 'validated',
    acteur_nom: doctorName,
    commentaire: `Signature électronique sécurisée apposée sur le compte rendu. Certificat hash : ${signatureHash}`,
    date_action: new Date().toISOString()
  };
  dbWorkflowLogs.unshift(newLog);

  // Queue notification
  const newNotif: NotificationQueueEntry = {
    id: nextNotificationQueueId++,
    type: 'email',
    destinataire: 'patient@email.com',
    sujet: `Rapport validé disponible - Dossier ${order.order_number}`,
    message: `Bonjour, votre dossier d'analyse est maintenant validé biologiquement par le ${doctorName}. Il est en cours de rendu final.`,
    echantillon_id: order.id,
    statut: 'en_attente',
    date_creation: new Date().toISOString()
  };
  dbNotificationQueue.unshift(newNotif);

  saveDb();
  res.json({ order, log: newLog, notification: newNotif });
});

// Final send (Email / SMS / Patient Portal)
app.post('/api/lab-orders/:id/send-patient', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = dbLabOrders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });

  order.status = 'validated';
  order.statut_workflow = 'envoye';
  order.pdf_path = `/var/labo/resultats/${order.order_number}.pdf`;
  order.envoye_email = true;
  order.envoye_sms = true;
  order.envoye_portail = true;
  order.date_envoi = new Date().toISOString();
  order.destinataires = 'Patient, Médecin prescripteur';
  order.updated_at = new Date().toISOString();

  // Create audit log
  const newLog: WorkflowLogEntry = {
    id: nextWorkflowLogId++,
    echantillon_id: order.id,
    resultat_id: order.id,
    etape: 'envoi',
    etat_avant: 'validated',
    etat_apres: 'validated',
    acteur_nom: 'Système d\'envoi LIMS',
    commentaire: `Rendu final complété. Rapport PDF envoyé avec succès au patient (par Email et SMS) et téléversé sur son portail d'analyses médicales.`,
    date_action: new Date().toISOString()
  };
  dbWorkflowLogs.unshift(newLog);

  // Trigger dispatch queue
  const newNotif: NotificationQueueEntry = {
    id: nextNotificationQueueId++,
    type: 'sms',
    destinataire: '+225 07 00 00 00 00',
    sujet: 'SMS Patient d\'Alerte Rendu',
    message: `Bonjour Mr/Mme ${order.partner_name}, vos résultats d'analyses du dossier ${order.order_number} sont disponibles sur votre portail sécurisé.`,
    echantillon_id: order.id,
    statut: 'envoye',
    date_creation: new Date().toISOString(),
    date_envoi: new Date().toISOString()
  };
  dbNotificationQueue.unshift(newNotif);

  saveDb();
  res.json({ order, log: newLog, notification: newNotif });
});

// 6. Account Moves & Lines (account_move, account_move_line)
const handleGetMoves = (req: Request, res: Response) => {
  const { move_type, state, partner_id, payment_state } = req.query;
  let result = [...dbMoves];

  if (move_type) result = result.filter((m) => m.move_type === move_type);
  if (state) result = result.filter((m) => m.state === state);
  if (payment_state) result = result.filter((m) => m.payment_state === payment_state);
  if (partner_id) result = result.filter((m) => m.partner_id === Number(partner_id));

  // Sort newest first (by invoice_date / created_at / id descending)
  result.sort((a, b) => {
    const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
    const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });

  const expanded = result.map(expandMove);
  res.json(expanded);
};

app.get('/api/moves', handleGetMoves);
app.get('/api/account-moves', handleGetMoves);

app.get('/api/moves/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const move = dbMoves.find((m) => m.id === id);
  if (!move) return res.status(404).json({ error: 'Invoice not found' });

  res.json(expandMove(move));
});

app.post('/api/moves', (req: Request, res: Response) => {
  const {
    move_type,
    partner_id,
    ref,
    invoice_date,
    invoice_date_due,
    lines,
    currency_id,
    invoice_user_id,
    is_tax_exempt,
    tax_exemption_reason,
    insurance_enabled,
    insurance_name,
    insurance_policy_number,
    insurance_coverage_rate,
    insurance_amount,
    client_share_amount,
    ndm,
    patient_name,
    patient_phone,
    patient_age_y,
    patient_age_m,
    patient_age_d,
    medical_service,
    cancel_reason,
  } = req.body;

  const partnerId = Number(partner_id);
  if (!partnerId) return res.status(400).json({ error: 'partner_id strictly required' });
  const matchedPartner = dbPartners.find((p) => p.id === partnerId);

  let amountUntaxed = 0;
  let amountTax = 0;

  const moveId = Math.max(nextMoveId, ...dbMoves.map((m) => m.id || 0), 0) + 1;
  nextMoveId = moveId + 1;
  const createdLines: AccountMoveLine[] = [];

  if (Array.isArray(lines)) {
    lines.forEach((line: any, index: number) => {
      const qty = Number(line.quantity) || 1;
      const priceUnit = Number(line.price_unit) || 0;
      const discount = Number(line.discount) || 0;
      const taxIds = is_tax_exempt ? [] : (Array.isArray(line.tax_ids) ? line.tax_ids : [1]);

      const subtotal = qty * priceUnit * (1 - discount / 100);

      // calculate tax
      let lineTax = 0;
      if (!is_tax_exempt) {
        taxIds.forEach((tId: number) => {
          const taxObj = dbTaxes.find((t) => t.id === tId);
          if (taxObj) lineTax += subtotal * (taxObj.amount / 100);
        });
      }

      const total = subtotal + lineTax;
      amountUntaxed += subtotal;
      amountTax += lineTax;

      const isOut = (move_type || 'out_invoice').startsWith('out');

      const newLineId = Math.max(nextMoveLineId, ...dbMoveLines.map((l) => l.id || 0), 0) + 1;
      nextMoveLineId = newLineId + 1;

      const newLine: AccountMoveLine = {
        id: newLineId,
        move_id: moveId,
        partner_id: partnerId,
        product_id: line.product_id ? Number(line.product_id) : null,
        account_id: isOut ? 706000 : 604000,
        tax_ids: taxIds,
        tax_rate: is_tax_exempt ? 0 : (taxIds.length > 0 ? 18 : 0),
        name: line.name || 'Produit / Service',
        quantity: qty,
        price_unit: priceUnit,
        price_subtotal: subtotal,
        price_total: total,
        discount: discount,
        debit: isOut ? 0 : subtotal,
        credit: isOut ? subtotal : 0,
        balance: isOut ? -subtotal : subtotal,
        sequence: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      createdLines.push(newLine);
      dbMoveLines.push(newLine);
    });
  }

  const amountTotal = amountUntaxed + amountTax;
  const insAmount = insurance_enabled ? (Number(insurance_amount) || 0) : 0;
  const clientShare = insurance_enabled
    ? (client_share_amount !== undefined ? Number(client_share_amount) : Math.max(0, amountTotal - insAmount))
    : amountTotal;

  const newMove: AccountMove = {
    id: moveId,
    name: null, // Draft invoice has null name until posted
    ref: ref || null,
    move_type: move_type || 'out_invoice',
    state: 'draft',
    partner_id: partnerId,
    invoice_date: invoice_date || new Date().toISOString().split('T')[0],
    date: invoice_date || new Date().toISOString().split('T')[0],
    invoice_date_due: invoice_date_due || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    currency_id: currency_id ? Number(currency_id) : 1,
    amount_untaxed: Number(amountUntaxed.toFixed(2)),
    amount_tax: Number(amountTax.toFixed(2)),
    amount_total: Number(amountTotal.toFixed(2)),
    amount_residual: Number((insurance_enabled ? clientShare : amountTotal).toFixed(2)),
    payment_state: 'not_paid',
    invoice_user_id: invoice_user_id ? Number(invoice_user_id) : 1,
    fiscal_position_id: 1,
    company_id: 1,
    is_tax_exempt: !!is_tax_exempt,
    tax_exemption_reason: tax_exemption_reason || null,
    insurance_enabled: !!insurance_enabled,
    insurance_name: insurance_name || null,
    insurance_policy_number: insurance_policy_number || null,
    insurance_coverage_rate: Number(insurance_coverage_rate) || 0,
    insurance_amount: Number(insAmount.toFixed(2)),
    client_share_amount: Number(clientShare.toFixed(2)),
    ndm: ndm || matchedPartner?.ndm || null,
    patient_name: patient_name || matchedPartner?.name || null,
    patient_phone: patient_phone || matchedPartner?.phone || null,
    patient_age_y: patient_age_y !== undefined ? Number(patient_age_y) : null,
    patient_age_m: patient_age_m !== undefined ? Number(patient_age_m) : null,
    patient_age_d: patient_age_d !== undefined ? Number(patient_age_d) : null,
    medical_service: medical_service || null,
    cancel_reason: cancel_reason || null,
    till_session_id: req.body.till_session_id
      ? Number(req.body.till_session_id)
      : (dbTillSessions.find((s) => s.cashier_id === Number(invoice_user_id || 1) && s.state === 'in_progress')?.id || null),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbMoves.push(newMove);
  saveDb();
  res.status(201).json(expandMove(newMove));
});

app.put('/api/moves/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const moveIndex = dbMoves.findIndex((m) => m.id === id);
  if (moveIndex === -1) return res.status(404).json({ error: 'Invoice not found' });

  const existingMove = dbMoves[moveIndex];
  if (existingMove.payment_state === 'paid') {
    return res.status(400).json({ error: 'Les factures déjà intégralement payées ne peuvent plus être modifiées.' });
  }
  if (existingMove.state === 'cancel') {
    return res.status(400).json({ error: 'Les factures annulées ne peuvent plus être modifiées.' });
  }

  const {
    partner_id,
    ref,
    invoice_date,
    invoice_date_due,
    lines,
    is_tax_exempt,
    tax_exemption_reason,
    insurance_enabled,
    insurance_name,
    insurance_policy_number,
    insurance_coverage_rate,
    insurance_amount,
    client_share_amount,
    ndm,
    patient_name,
    patient_phone,
    patient_age_y,
    patient_age_m,
    patient_age_d,
    medical_service,
    cancel_reason,
    till_session_id,
  } = req.body;

  if (till_session_id !== undefined) existingMove.till_session_id = till_session_id ? Number(till_session_id) : null;
  if (patient_name !== undefined) existingMove.patient_name = patient_name;
  if (patient_phone !== undefined) existingMove.patient_phone = patient_phone;

  if (is_tax_exempt !== undefined) existingMove.is_tax_exempt = !!is_tax_exempt;
  if (tax_exemption_reason !== undefined) existingMove.tax_exemption_reason = tax_exemption_reason;
  if (insurance_enabled !== undefined) existingMove.insurance_enabled = !!insurance_enabled;
  if (insurance_name !== undefined) existingMove.insurance_name = insurance_name;
  if (insurance_policy_number !== undefined) existingMove.insurance_policy_number = insurance_policy_number;
  if (insurance_coverage_rate !== undefined) existingMove.insurance_coverage_rate = Number(insurance_coverage_rate) || 0;
  if (insurance_amount !== undefined) existingMove.insurance_amount = Number(insurance_amount) || 0;
  if (client_share_amount !== undefined) existingMove.client_share_amount = Number(client_share_amount) || 0;
  if (ndm !== undefined) existingMove.ndm = ndm;
  if (patient_age_y !== undefined) existingMove.patient_age_y = patient_age_y !== null ? Number(patient_age_y) : null;
  if (patient_age_m !== undefined) existingMove.patient_age_m = patient_age_m !== null ? Number(patient_age_m) : null;
  if (patient_age_d !== undefined) existingMove.patient_age_d = patient_age_d !== null ? Number(patient_age_d) : null;
  if (medical_service !== undefined) existingMove.medical_service = medical_service;
  if (cancel_reason !== undefined) existingMove.cancel_reason = cancel_reason;

  if (lines && Array.isArray(lines)) {
    // Replace move lines
    dbMoveLines = dbMoveLines.filter((l) => l.move_id !== id);

    let amountUntaxed = 0;
    let amountTax = 0;

    const exempt = existingMove.is_tax_exempt;

    lines.forEach((line: any, index: number) => {
      const qty = Number(line.quantity) || 1;
      const priceUnit = Number(line.price_unit) || 0;
      const discount = Number(line.discount) || 0;
      const taxIds = exempt ? [] : (Array.isArray(line.tax_ids) ? line.tax_ids : [1]);

      const subtotal = qty * priceUnit * (1 - discount / 100);
      let lineTax = 0;
      if (!exempt) {
        taxIds.forEach((tId: number) => {
          const taxObj = dbTaxes.find((t) => t.id === tId);
          if (taxObj) lineTax += subtotal * (taxObj.amount / 100);
        });
      }

      const total = subtotal + lineTax;
      amountUntaxed += subtotal;
      amountTax += lineTax;

      const isOut = existingMove.move_type.startsWith('out');

      const newLine: AccountMoveLine = {
        id: nextMoveLineId++,
        move_id: id,
        partner_id: partner_id ? Number(partner_id) : existingMove.partner_id,
        product_id: line.product_id ? Number(line.product_id) : null,
        account_id: isOut ? 706000 : 604000,
        tax_ids: taxIds,
        tax_rate: exempt ? 0 : (taxIds.length > 0 ? 18 : 0),
        name: line.name || 'Produit',
        quantity: qty,
        price_unit: priceUnit,
        price_subtotal: subtotal,
        price_total: total,
        discount: discount,
        debit: isOut ? 0 : subtotal,
        credit: isOut ? subtotal : 0,
        balance: isOut ? -subtotal : subtotal,
        sequence: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dbMoveLines.push(newLine);
    });

    const amountTotal = amountUntaxed + amountTax;
    existingMove.amount_untaxed = Number(amountUntaxed.toFixed(2));
    existingMove.amount_tax = Number(amountTax.toFixed(2));
    existingMove.amount_total = Number(amountTotal.toFixed(2));

    const insAmount = existingMove.insurance_enabled ? (Number(existingMove.insurance_amount) || 0) : 0;
    const clientShare = existingMove.insurance_enabled
      ? (existingMove.client_share_amount !== undefined ? Number(existingMove.client_share_amount) : Math.max(0, amountTotal - insAmount))
      : amountTotal;

    // Calculate sum of payments already made
    const existingPaidSum = dbPayments
      .filter((p) => p.move_id === id && (p.state as string) !== 'cancel')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const targetClientShare = existingMove.insurance_enabled ? clientShare : amountTotal;
    const residual = Math.max(0, targetClientShare - existingPaidSum);

    existingMove.amount_residual = Number(residual.toFixed(2));
    if (existingMove.amount_residual <= 0 && targetClientShare > 0) {
      existingMove.payment_state = 'paid';
    } else if (existingPaidSum > 0) {
      existingMove.payment_state = 'partial';
    } else {
      existingMove.payment_state = 'not_paid';
    }
  }

  if (partner_id) existingMove.partner_id = Number(partner_id);
  if (ref !== undefined) existingMove.ref = ref;
  if (invoice_date) existingMove.invoice_date = invoice_date;
  if (invoice_date_due) existingMove.invoice_date_due = invoice_date_due;
  existingMove.updated_at = new Date().toISOString();

  saveDb();
  res.json(expandMove(existingMove));
});

// Post / Confirm Invoice (Draft -> Posted)
app.post('/api/moves/:id/post', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const move = dbMoves.find((m) => m.id === id);
  if (!move) return res.status(404).json({ error: 'Invoice not found' });

  if (move.state === 'posted') {
    return res.json(expandMove(move));
  }

  // Assign sequential official move number if null
  if (!move.name) {
    const year = new Date().getFullYear();
    if (move.move_type === 'out_invoice') {
      const seqStr = String(nextInvoiceSeq++).padStart(4, '0');
      move.name = `FAC/${year}/${seqStr}`;
    } else {
      const seqStr = String(nextVendorSeq++).padStart(4, '0');
      move.name = `FF/${year}/${seqStr}`;
    }
  }

  move.state = 'posted';
  move.updated_at = new Date().toISOString();

  saveDb();
  res.json(expandMove(move));
});

// Cancel Invoice
app.post('/api/moves/:id/cancel', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const move = dbMoves.find((m) => m.id === id);
  if (!move) return res.status(404).json({ error: 'Invoice not found' });

  move.state = 'cancel';
  move.updated_at = new Date().toISOString();

  saveDb();
  res.json(expandMove(move));
});

app.delete('/api/moves/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbMoves = dbMoves.filter((m) => m.id !== id);
  dbMoveLines = dbMoveLines.filter((l) => l.move_id !== id);
  saveDb();
  res.json({ message: 'Invoice deleted' });
});

// 7. Payments & Automated Reconciliation (account_payment)
app.get('/api/payments', (req: Request, res: Response) => {
  const enriched = dbPayments.map((p) => {
    const partner = dbPartners.find((pt) => pt.id === p.partner_id);
    const move = dbMoves.find((m) => m.id === p.move_id);
    const expandedMove = move ? expandMove(move) : null;

    // Resolve true patient name from move or partner or payment request
    const resolvedPatientName =
      expandedMove?.patient_name ||
      expandedMove?.partner?.name ||
      (partner && partner.id !== 1 ? partner.name : '') ||
      (p as any).patient_name ||
      (p as any).partner_name ||
      'Client';

    return {
      ...p,
      partner_name: resolvedPatientName,
      move_name: move ? move.name || `Brouillon #${move.id}` : '',
      journal_name: p.journal_id === 1 ? 'Banque' : 'Caisse',
    };
  });

  // Sort newest first (by payment_date / created_at / id descending)
  enriched.sort((a, b) => {
    const dateA = new Date(a.payment_date || (a as any).created_at || 0).getTime();
    const dateB = new Date(b.payment_date || (b as any).created_at || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });

  res.json(enriched);
});

app.post('/api/payments', (req: Request, res: Response) => {
  const { move_id, amount, payment_date, journal_id, session_id, user_id, payment_method_code, payment_method_name, patient_name, ndm_number } = req.body;
  const moveId = Number(move_id);
  const paymentAmount = Number(amount);

  if (!moveId || !paymentAmount) {
    return res.status(400).json({ error: 'move_id et montant du paiement sont requis' });
  }

  const move = dbMoves.find((m) => m.id === moveId);
  if (!move) return res.status(404).json({ error: 'Facture non trouvée' });

  // Find target session or active session for cashier
  let activeSession = session_id ? dbTillSessions.find((s) => s.id === Number(session_id)) : null;

  if (!activeSession && user_id) {
    activeSession = dbTillSessions.find(
      (s) => s.state === 'in_progress' && (s.cashier_id === Number(user_id) || String(s.cashier_id) === String(user_id))
    );
  }

  if (!activeSession && req.body.cashier_name) {
    activeSession = dbTillSessions.find(
      (s) => s.state === 'in_progress' && s.cashier_name === req.body.cashier_name
    );
  }

  if (!activeSession && move.till_session_id) {
    activeSession = dbTillSessions.find((s) => s.id === Number(move.till_session_id) && s.state === 'in_progress');
  }

  if (!activeSession && move.invoice_user_id) {
    activeSession = dbTillSessions.find(
      (s) => s.state === 'in_progress' && (s.cashier_id === Number(move.invoice_user_id) || String(s.cashier_id) === String(move.invoice_user_id))
    );
  }

  if (!activeSession) {
    activeSession = dbTillSessions.find((s) => s.state === 'in_progress');
  }

  // Prevent registration if session specified is closed
  if (activeSession && activeSession.state === 'closed') {
    return res.status(400).json({ error: 'Impossible d\'enregistrer un paiement : la session de caisse est clôturée.' });
  }

  const newPayment: AccountPayment = {
    id: nextPaymentId++,
    user_id: user_id ? Number(user_id) : (activeSession ? activeSession.cashier_id : null),
    move_id: moveId,
    partner_id: move.partner_id,
    journal_id: journal_id ? Number(journal_id) : 2, // Default Caisse
    payment_method_id: 1,
    session_id: activeSession ? activeSession.id : null,
    amount: paymentAmount,
    payment_date: payment_date || new Date().toISOString().split('T')[0],
    state: 'reconciled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbPayments.push(newPayment);

  // Auto-post move if draft
  if (move.state === 'draft') {
    move.state = 'posted';
    if (!move.name) {
      const year = new Date().getFullYear();
      if (move.move_type === 'out_invoice') {
        const seqStr = String(nextInvoiceSeq++).padStart(4, '0');
        move.name = `FAC/${year}/${seqStr}`;
      } else {
        const seqStr = String(nextVendorSeq++).padStart(4, '0');
        move.name = `FF/${year}/${seqStr}`;
      }
    }
  }

  // Recalculate move residual amount & payment_state
  const currentResidual = move.amount_residual - paymentAmount;
  move.amount_residual = Math.max(0, Number(currentResidual.toFixed(2)));

  if (move.amount_residual <= 0.01) {
    move.payment_state = 'paid';
  } else if (move.amount_residual < move.amount_total) {
    move.payment_state = 'partial';
  } else {
    move.payment_state = 'not_paid';
  }

  move.updated_at = new Date().toISOString();

  // If there's an active session, attach transaction line & update session totals
  if (activeSession && activeSession.state === 'in_progress') {
    const partner = dbPartners.find((p) => p.id === move.partner_id);
    const expandedMove = expandMove(move);
    const pName =
      patient_name ||
      expandedMove.patient_name ||
      expandedMove.partner?.name ||
      (partner && partner.id !== 1 ? partner.name : '') ||
      'Patient';
    const pMethodName = payment_method_name || (journal_id === 1 ? 'Virement Bancaire' : 'Espèces Caisse');
    const pMethodCode = payment_method_code || (journal_id === 1 ? 'transfer' : 'cash');

    const txLine: TillSessionTransaction = {
      id: Date.now(),
      session_id: activeSession.id,
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }),
      reference: move.name || `FAC-2026-${String(move.id).padStart(4, '0')}`,
      ndm: ndm_number || (partner?.convention_code || `000${15000 + move.id}`),
      patient_name: pName,
      amount: paymentAmount,
      payment_method: pMethodName,
      payment_method_code: pMethodCode,
      type: 'invoice',
      state: 'reconciled',
      cashier_name: activeSession.cashier_name || 'Caissier',
      id_line: String(8200 + activeSession.transactions.length + 1),
    };

    activeSession.transactions.unshift(txLine);
    activeSession.total_collected += paymentAmount;

    const safePMethodName = (pMethodName || '').toString().toLowerCase();
    if (pMethodCode === 'cash' || safePMethodName.includes('espèce')) {
      activeSession.total_cash_collected += paymentAmount;
    } else if (pMethodCode === 'wave' || pMethodCode === 'orange_money' || pMethodCode === 'moov_money' || safePMethodName.includes('mobile')) {
      activeSession.total_mobile_money_collected += paymentAmount;
    } else if (pMethodCode === 'card' || safePMethodName.includes('carte')) {
      activeSession.total_card_collected += paymentAmount;
    } else if (pMethodCode === 'check' || safePMethodName.includes('chèque')) {
      activeSession.total_check_collected += paymentAmount;
    }

    if (!activeSession.activity_logs) activeSession.activity_logs = [];
    activeSession.activity_logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }),
      author: activeSession.cashier_name || 'Caissier',
      message: `Enregistrement règlement patient ${pName} (${paymentAmount.toLocaleString()} FCFA - ${pMethodName})`,
      type: 'payment',
    });
  }

  // Send automated email payment receipt notification log
  const partner = dbPartners.find((p) => p.id === move.partner_id);
  if (partner && partner.email) {
    const notif: EmailNotification = {
      id: nextNotificationId++,
      move_id: move.id,
      partner_id: partner.id,
      recipient_email: partner.email,
      subject: `Reçu de paiement - Facture ${move.name || '#' + move.id} (${paymentAmount.toFixed(2)} FCFA)`,
      type: 'payment_receipt',
      status: 'sent',
      sent_at: new Date().toISOString(),
      partner_name: partner.name,
      move_name: move.name || `#${move.id}`,
      amount: paymentAmount,
    };
    dbEmailNotifications.unshift(notif);
  }

  // --- TRIGGER: AUTOMATED LAB ORDER CREATION FOR PAID INVOICES ---
  if (move.payment_state === 'paid') {
    // Transition associated consultation from 'pending_payment' to 'triage'
    const relatedConsultation = dbConsultations.find(
      (c) => c.invoice_id === move.id || (c.consultation_number && move.ref && move.ref.includes(c.consultation_number))
    );
    if (relatedConsultation && relatedConsultation.status === 'pending_payment') {
      relatedConsultation.status = 'triage';
      relatedConsultation.updated_at = new Date().toISOString();
    }

    // New: If invoice is a paid consultation invoice and no consultation exists, create a new MedicalConsultation
    const invoiceLinesForCheck = dbMoveLines.filter(l => l.move_id === move.id);
    const hasConsultationLine = invoiceLinesForCheck.some(l => 
      l.product_id === 12 || 
      l.product_id === 991 || 
      l.product_id === 992 || 
      l.product_id === 993 || 
      (l.name && l.name.toLowerCase().includes('consultation'))
    );

    if (hasConsultationLine && !relatedConsultation) {
      const consultLine = invoiceLinesForCheck.find(l => 
        l.product_id === 12 || 
        l.product_id === 991 || 
        l.product_id === 992 || 
        l.product_id === 993 || 
        (l.name && l.name.toLowerCase().includes('consultation'))
      );
      
      let docId = 16;
      let docName = 'Dr. Aboubacar Toure';
      let specialty = 'Médecine Générale';
      
      if (consultLine) {
        if (consultLine.product_id === 991 || (consultLine.name && consultLine.name.toLowerCase().includes('infirmier'))) {
          docId = 15;
          docName = 'Awa Diabate (Infirmier)';
          specialty = 'Triage & Soins';
        } else if (consultLine.product_id === 993 || (consultLine.name && consultLine.name.toLowerCase().includes('spécialiste'))) {
          docId = 17;
          docName = 'Dr. Mamadou Cisse';
          specialty = 'Médecine Spécialisée';
        }
      }
      
      const nextSeqNum = nextConsultationId++;
      const consNumber = `CONS-${new Date().getFullYear()}-${String(nextSeqNum).padStart(4, '0')}`;
      
      const newConsultation: MedicalConsultation = {
        id: nextSeqNum,
        consultation_number: consNumber,
        partner_id: move.partner_id,
        patient_name: move.patient_name || (partner ? partner.name : 'Patient Inconnu'),
        patient_ndm: move.ndm || partner?.ndm || null,
        patient_gender: partner?.gender || 'M',
        patient_age: move.patient_age_y || partner?.age || 30,
        patient_phone: move.patient_phone || partner?.phone || null,
        insurance_name: move.insurance_name || partner?.insurance_name || null,
        insurance_coverage_rate: move.insurance_coverage_rate ?? partner?.insurance_coverage_rate ?? null,
        doctor_id: docId,
        doctor_name: docName,
        specialty: specialty,
        consultation_date: new Date().toISOString(),
        status: 'triage',
        chief_complaint: 'Avis médical direct',
        diagnosis: 'Sujet pour consultation',
        vitals: {
          taken_by_name: 'Système',
          taken_at: new Date().toISOString(),
        },
        prescribed_items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        invoice_id: move.id,
      };
      
      dbConsultations.push(newConsultation);
    }

    // Check if lab orders already exist for this invoice to prevent duplicates
    const alreadyExists = dbLabOrders.some(o => o.invoice_id === move.id);
    if (!alreadyExists) {
      const invoiceLines = dbMoveLines.filter(l => l.move_id === move.id);
      const labItemsByDept: { [dept: string]: string[] } = {};

      invoiceLines.forEach(line => {
        const product = dbProductProducts.find(p => p.id === line.product_id);
        if (product) {
          const tmpl = dbProductTemplates.find(t => t.id === product.product_tmpl_id);
          if (tmpl) {
            if (tmpl.category_type === 'lab_exam') {
              const dept = tmpl.lab_department || 'Biochimie Clinique';
              if (!labItemsByDept[dept]) labItemsByDept[dept] = [];
              labItemsByDept[dept].push(tmpl.name);
            } else if (tmpl.category_type === 'lab_profile' && tmpl.lab_profile_exams) {
              tmpl.lab_profile_exams.forEach(subEx => {
                // Try to find the sub exam to know its department
                const subTmpl = dbProductTemplates.find(t => t.name.trim().toLowerCase() === subEx.trim().toLowerCase());
                const dept = subTmpl?.lab_department || tmpl.lab_department || 'Profils Multidisciplinaires';
                if (!labItemsByDept[dept]) labItemsByDept[dept] = [];
                labItemsByDept[dept].push(subEx);
              });
            }
          }
        }
      });

      // For each department, create an autonomous LabExamOrder
      Object.entries(labItemsByDept).forEach(([dept, rawExams]) => {
        const orderId = nextLabOrderId++;
        
        const { paramsList, expandedExams } = populateParametersForExams(rawExams, orderId);

        const resolvedPatientName = move.patient_name || (partner ? partner.name : 'Patient');
        const resolvedNdm = move.ndm || (partner ? partner.ndm : null);

        const newLabOrder: LabExamOrder = {
          id: orderId,
          order_number: `LAB-2026-${String(orderId).padStart(4, '0')}`,
          partner_id: move.partner_id,
          partner_name: resolvedPatientName,
          patient_gender: (partner && partner.gender) || 'M',
          patient_age: move.patient_age_y || partner?.age || 35,
          prescribing_doctor: partner?.prescribing_doctor || move.ref || 'Dr. Prescripteur Externe',
          sampling_date: new Date().toISOString(),
          status: 'pending_sampling', // "Initié" - Waiting for drawing!
          department: dept,
          exam_names: expandedExams,
          parameters: paramsList,
          invoice_id: move.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        dbLabOrders.unshift(newLabOrder);
      });
    }
  }

  saveDb();

  res.status(201).json({
    payment: newPayment,
    updated_move: expandMove(move),
    session: activeSession,
  });
});

app.delete('/api/payments/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  dbPayments = dbPayments.filter((p) => p.id !== id);
  saveDb();
  res.json({ message: 'Paiement supprimé avec succès' });
});

// 7.5 TILL SESSIONS (Sessions de Caisse & Clôture Journalière)
app.get('/api/till-sessions', (req: Request, res: Response) => {
  const { cashier_id, state } = req.query;
  let result = [...dbTillSessions];

  if (cashier_id) result = result.filter((s) => s.cashier_id === Number(cashier_id));
  if (state) result = result.filter((s) => s.state === state);

  // Sort newest first (by created_at or ID descending)
  result.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id;
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });

  res.json(result);
});

app.get('/api/till-sessions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const session = dbTillSessions.find((s) => s.id === id);
  if (!session) return res.status(404).json({ error: 'Session de caisse non trouvée' });
  res.json(session);
});

// Create new session
app.post('/api/till-sessions', (req: Request, res: Response) => {
  const { cashier_id, cashier_name, till_name, opening_balance, notes } = req.body;

  // Check if cashier or user profile already has an in_progress session
  const targetCashierId = Number(cashier_id);
  const targetCashierName = String(cashier_name || '').trim().toLowerCase();

  const activeExisting = dbTillSessions.find(
    (s) =>
      s.state === 'in_progress' &&
      ((targetCashierId > 0 && s.cashier_id === targetCashierId) ||
        (targetCashierName !== '' && s.cashier_name.trim().toLowerCase() === targetCashierName))
  );
  if (activeExisting) {
    return res.status(200).json(activeExisting);
  }

  const newCode = `SESSION${String(nextTillSessionSeq++).padStart(5, '0')}`;
  const nowFormatted = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' });

  const newSession: TillSession = {
    id: Date.now(),
    session_code: newCode,
    till_name: till_name || 'Caisse 1',
    cashier_id: Number(cashier_id) || 1,
    cashier_name: cashier_name || 'Administrator',
    state: 'in_progress', // Opens immediately upon creation
    opening_date: nowFormatted,
    closing_date: null,
    opening_balance: Number(opening_balance) || 0,
    total_cash_collected: 0,
    total_mobile_money_collected: 0,
    total_card_collected: 0,
    total_check_collected: 0,
    total_collected: 0,
    notes: notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    transactions: [],
    activity_logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: nowFormatted,
        author: cashier_name || 'Administrator',
        message: `Création et ouverture de la session de caisse avec un fond de roulement de ${(Number(opening_balance) || 0).toLocaleString()} FCFA.`,
        type: 'creation',
      },
      {
        id: `log-${Date.now() + 1}`,
        timestamp: nowFormatted,
        author: cashier_name || 'Administrator',
        message: 'Changement d\'état : Nouveau ➔ En cours',
        type: 'status_change',
      },
    ],
  };

  dbTillSessions.unshift(newSession);
  saveDb();
  res.status(201).json(newSession);
});

// Close a session
app.post('/api/till-sessions/:id/close', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const session = dbTillSessions.find((s) => s.id === id);
  if (!session) return res.status(404).json({ error: 'Session de caisse non trouvée' });

  if (session.state === 'closed') {
    return res.status(400).json({ error: 'Cette session de caisse est déjà clôturée.' });
  }

  const { closing_actual_cash, notes } = req.body;
  const nowFormatted = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' });

  const expectedCashInDrawer = session.opening_balance + session.total_cash_collected;
  const actualCash = Number(closing_actual_cash) !== undefined && closing_actual_cash !== null ? Number(closing_actual_cash) : expectedCashInDrawer;
  const variance = actualCash - expectedCashInDrawer;

  session.state = 'closed';
  session.closing_date = nowFormatted;
  session.closing_actual_cash = actualCash;
  session.closing_expected_cash = expectedCashInDrawer;
  session.cash_variance = variance;
  if (notes) session.notes = notes;
  session.updated_at = new Date().toISOString();

  if (!session.activity_logs) session.activity_logs = [];
  session.activity_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: nowFormatted,
    author: session.cashier_name || 'Caissier',
    message: `Clôture définitive de la session. Fond théorique: ${expectedCashInDrawer.toLocaleString()} FCFA, Réel compté: ${actualCash.toLocaleString()} FCFA (Écart: ${variance >= 0 ? '+' : ''}${variance.toLocaleString()} FCFA).`,
    type: 'closure',
  });

  saveDb();
  res.json(session);
});

// 8. Financial Analytics Summary
app.get('/api/analytics', (req: Request, res: Response) => {
  const postedCustomerInvoices = dbMoves.filter((m) => m.move_type === 'out_invoice' && m.state === 'posted');

  const total_revenue_ht = postedCustomerInvoices.reduce((acc, m) => acc + m.amount_untaxed, 0);
  const total_revenue_ttc = postedCustomerInvoices.reduce((acc, m) => acc + m.amount_total, 0);
  const total_residual = postedCustomerInvoices.reduce((acc, m) => acc + m.amount_residual, 0);
  const total_paid = total_revenue_ttc - total_residual;

  const today = new Date().toISOString().split('T')[0];
  const overdueInvoices = postedCustomerInvoices.filter(
    (m) => m.amount_residual > 0 && m.invoice_date_due && m.invoice_date_due < today
  );
  const total_overdue = overdueInvoices.reduce((acc, m) => acc + m.amount_residual, 0);

  // Monthly revenue breakdown computed from real posted invoices
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthlyTotals: { [key: number]: { ht: number; ttc: number; paid: number; residual: number } } = {};
  for (let i = 0; i < 12; i++) {
    monthlyTotals[i] = { ht: 0, ttc: 0, paid: 0, residual: 0 };
  }

  postedCustomerInvoices.forEach((m) => {
    const dStr = m.invoice_date || m.date || m.created_at;
    if (dStr) {
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        const mIdx = d.getMonth();
        const paid = Math.max(0, (m.amount_total || 0) - (m.amount_residual || 0));
        monthlyTotals[mIdx].ht += m.amount_untaxed || (m.amount_total / 1.18);
        monthlyTotals[mIdx].ttc += m.amount_total || 0;
        monthlyTotals[mIdx].paid += paid;
        monthlyTotals[mIdx].residual += m.amount_residual || 0;
      }
    }
  });

  const monthly_revenue = monthNames.map((name, idx) => ({
    month: name,
    ht: Number(monthlyTotals[idx].ht.toFixed(2)),
    ttc: Number(monthlyTotals[idx].ttc.toFixed(2)),
    paid: Number(monthlyTotals[idx].paid.toFixed(2)),
    residual: Number(monthlyTotals[idx].residual.toFixed(2)),
  }));

  // Top partners
  const top_partners = dbPartners
    .filter((p) => p.customer_rank > 0)
    .map((p) => {
      const pMoves = postedCustomerInvoices.filter((m) => m.partner_id === p.id);
      const invoiced = pMoves.reduce((acc, m) => acc + m.amount_total, 0);
      const residual = pMoves.reduce((acc, m) => acc + m.amount_residual, 0);
      return {
        name: p.name,
        invoiced,
        paid: invoiced - residual,
        residual,
      };
    })
    .sort((a, b) => b.invoiced - a.invoiced)
    .slice(0, 5);

  // Tax summary
  const tax_summary = dbTaxes.map((t) => {
    let totalTaxAmt = 0;
    dbMoveLines.forEach((l) => {
      if ((l.tax_ids || []).includes(t.id)) {
        totalTaxAmt += l.price_subtotal * (t.amount / 100);
      }
    });
    return {
      tax_name: t.name,
      rate: t.amount,
      total_tax_amount: Number(totalTaxAmt.toFixed(2)),
    };
  });

  // Real payment journals breakdown
  const journalsMap: Record<string, { total: number; count: number }> = {};
  dbPayments.forEach((p) => {
    const jName = p.journal_name || p.payment_method_code || 'Espèces';
    if (!journalsMap[jName]) {
      journalsMap[jName] = { total: 0, count: 0 };
    }
    journalsMap[jName].total += p.amount || 0;
    journalsMap[jName].count += 1;
  });

  const payment_journals = Object.entries(journalsMap).map(([journal_name, data]) => ({
    journal_name,
    total_amount: Number(data.total.toFixed(2)),
    count: data.count,
  }));

  const summary: AnalyticsSummary = {
    total_revenue_ht: Number(total_revenue_ht.toFixed(2)),
    total_revenue_ttc: Number(total_revenue_ttc.toFixed(2)),
    total_paid: Number(total_paid.toFixed(2)),
    total_residual: Number(total_residual.toFixed(2)),
    total_overdue: Number(total_overdue.toFixed(2)),
    invoice_count: postedCustomerInvoices.length,
    paid_count: postedCustomerInvoices.filter((m) => m.payment_state === 'paid').length,
    draft_count: dbMoves.filter((m) => m.state === 'draft').length,
    overdue_count: overdueInvoices.length,
    monthly_revenue,
    top_partners,
    tax_summary,
    payment_journals: payment_journals.length > 0 ? payment_journals : [
      { journal_name: 'Caisse Principale', total_amount: total_paid, count: dbPayments.length },
    ],
  };

  res.json(summary);
});

// 9. Email Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const sorted = [...dbEmailNotifications].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime() || b.id - a.id);
  res.json(sorted);
});

app.post('/api/notifications/send-reminder', (req: Request, res: Response) => {
  const { move_id, custom_message } = req.body;
  const move = dbMoves.find((m) => m.id === Number(move_id));
  if (!move) return res.status(404).json({ error: 'Facture non trouvée' });

  const partner = dbPartners.find((p) => p.id === move.partner_id);
  const email = partner?.email || 'client@entreprise.com';

  const newNotif: EmailNotification = {
    id: nextNotificationId++,
    move_id: move.id,
    partner_id: move.partner_id,
    recipient_email: email,
    subject: `RELANCE IMPAYÉE : Facture ${move.name || '#' + move.id} (${move.amount_residual.toFixed(2)} € Dû)`,
    type: 'reminder_overdue',
    status: 'sent',
    sent_at: new Date().toISOString(),
    partner_name: partner?.name || 'Client',
    move_name: move.name || `#${move.id}`,
    amount: move.amount_residual,
  };

  dbEmailNotifications.unshift(newNotif);
  saveDb();

  res.status(201).json({
    message: `Relance email envoyée avec succès à ${email}`,
    notification: newNotif,
  });
});

// Register Hospital Scenarios & Full Medical Journey Engine (S01 - S50, R01 - R10, Journal, Patient 360)
const dbContext = {
  dbCompany,
  dbPartners,
  dbMoves,
  dbMoveLines,
  dbPayments,
  dbConsultations,
  dbLabOrders,
  dbTillSessions,
  dbUsers,
  dbJournal,
  logToJournal,
  saveDb,
  getNextPartnerId: () => nextPartnerId++,
  getNextMoveId: () => nextMoveId++,
  getNextMoveLineId: () => nextMoveLineId++,
  getNextPaymentId: () => nextPaymentId++,
  getNextConsultationId: () => nextConsultationId++,
  getNextLabOrderId: () => nextLabOrderId++,
};

registerHospitalScenariosRoutes(app, dbContext);
registerFhirRoutes(app, dbContext);

// Server Initialization
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  // In production (or when dist build exists and not explicitly in development mode), serve static production build
  const isProduction = process.env.NODE_ENV === 'production' || (hasDist && process.env.NODE_ENV !== 'development');

  if (!isProduction) {
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    process.env.NODE_ENV = 'production';
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Facturation Pro] Server running on http://0.0.0.0:${PORT} in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  });
}

startServer();
