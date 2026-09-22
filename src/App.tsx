import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, LogOut, CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AppNavigation, AppView } from './components/AppNavigation';
import { getUserBillingProfile } from './lib/formatters';
import { getAllowedViews, isViewServiceActive, getServiceIdForView } from './utils/navigation';
import { DEFAULT_HOSPITAL_SERVICES } from './data/defaultHospitalServices';
import { LoginView } from './components/LoginView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { DashboardView } from './components/DashboardView';
import { InvoicesView } from './components/InvoicesView';
import { PaymentsView } from './components/PaymentsView';
import { PartnersView } from './components/PartnersView';
import { ProductsView } from './components/ProductsView';
import { LabResultsView } from './components/LabResultsView';
import { LabSamplingView } from './components/LabSamplingView';
import { LabGroupedResultsView } from './components/LabGroupedResultsView';
import { UsersView } from './components/UsersView';
import { NotificationsView } from './components/NotificationsView';
import { LogsAuditView } from './components/LogsAuditView';
import { SchemaErdView } from './components/SchemaErdView';
import { CaisseSessionsView } from './components/CaisseSessionsView';
import {
  MandatorySessionOpenModal,
  ActiveSessionBar,
  FinancialAuditTrailViewerModal,
} from './components/CaisseSessionGuard';
import {
  isCashierOnlyProfile,
  isSupervisorOrAdmin,
  getActiveSessionForCashier,
  saveAllSessions,
  closeCashierSession,
  loadAllSessions,
} from './utils/caisseSessionService';
import { InvoicePdfModal } from './components/InvoicePdfModal';
import { PatientDossierModal } from './components/PatientDossierModal';
import { PatientDossiersDirectoryView } from './components/PatientDossiersDirectoryView';
import { InsuranceClaimsView } from './components/InsuranceClaimsView';
import { ConsultationsView } from './components/ConsultationsView';
import { PatientJourneyView } from './components/PatientJourneyView';
import { AlertsManagementView } from './components/AlertsManagementView';
import { PharmacyView } from './components/PharmacyView';
import {
  InfirmierDashboard,
  MedecinDashboard,
  SpecialisteDashboard,
  LaboDashboard,
  ImagerieDashboard,
  HospitDashboard,
  SuperviseurDashboard,
  CaisseDashboard,
  FacturesDashboard,
  CaisseFactureDashboard,
  AdminDashboard,
} from './components/ModuleDashboards';
import {
  SuperviseurSessionsView,
  SuperviseurCaissesView,
  SuperviseurReportsView,
  CaisseClotureView,
} from './components/SuperviseurAndCaisseViews';
import {
  InfirmierQueueTableView,
  InfirmierTriageTableView,
  InfirmierVitalsTableView,
  InfirmierCareTableView,
  InfirmierPrescriptionsTableView,
  InfirmierReferredTableView,
  MedecinQueueTableView,
  MedecinPrescriptionsTableView,
  SpecialisteReferredTableView,
  SpecialisteFollowupTableView,
} from './components/ClinicalModuleViews';
import {
  LaboQueueTableView,
  LaboInProgressTableView,
  ImagerieQueueTableView,
  ImagerieScheduledTableView,
  ImagerieReportsTableView,
  ImageriePrescriptionsTableView,
  HospitAdmissionsTableView,
  HospitPatientsTableView,
  HospitDischargesTableView,
} from './components/DiagnosticAndHospitViews';
import {
  AdminServicesManagementView,
  AdminRolesTableView,
  AdminPermissionsTableView,
  AdminMedicalSettingsTableView,
} from './components/AdminModuleViews';
import {
  PediatrieDashboardView,
  PediatrieQueueView,
  PediatrieConsultationsView,
  PediatrieVaccinationView,
  PediatrieCroissanceView,
  MaterniteDashboardView,
  MaterniteCpnView,
  MaterniteAccouchementView,
  MaternitePartogrammeView,
  MaternitePostpartumView,
} from './components/PediatrieMaterniteViews';
import { FlashInfoTicker } from './components/FlashInfoTicker';
import { FlashAnnouncementsView, DEFAULT_FLASH_ANNOUNCEMENTS } from './components/FlashAnnouncementsView';
import { SplashLoadingScreen } from './components/SplashLoadingScreen';
import {
  AppointmentsView,
  BedManagementView,
  HospitalTransfersView,
  LettersReferralsView,
  CarePlansView,
  TransmissionsView,
  NurseScheduleView,
  SurgeryTheaterView,
  ImagingPacsView,
  PharmacyDispensingView,
  SterilizationLogView,
  QualityVigilanceView,
  HrManagementView
} from './components/SihCustomViews';
import { HospitalScenariosView } from './components/HospitalScenariosView';
import {
  AccountMove,
  ResPartner,
  ResUser,
  ResGroup,
  ProductProduct,
  AccountTax,
  AccountPayment,
  EmailNotification,
  UomUom,
  ResCountry,
  AnalyticsData,
  MoveType,
  CompanySettings,
  LabExamOrder,
  PartnerReduction,
  TillSession,
  MedicalConsultation,
  AppNotification,
} from './types';

const safeFetchJson = async <T,>(url: string, fallback: T): Promise<T> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return fallback;
    }
    const data = await res.json();
    return (data !== null && data !== undefined) ? data : fallback;
  } catch (err) {
    console.warn(`Safe fetch warning for ${url}:`, err);
    return fallback;
  }
};

const VIEW_TO_PATH_MAP: Record<string, string> = {
  dashboard: '/accueil',
  consultations: '/consultations',
  invoices: '/factures',
  payments: '/reglements',
  caisse_sessions: '/sessions-caisses',
  insurance_claims: '/assurances',
  partners: '/partenaires',
  patient_dossiers: '/dossiers-patients',
  lab_results: '/lab-resultats',
  lab_sampling: '/lab-prelevements',
  lab_grouped_results: '/lab-validations',
  products: '/catalogue-prestations',
  users: '/utilisateurs',
  company: '/configuration',
  flash_announcements: '/annonces-flash',
  notifications: '/notifications',
  alert_settings: '/alertes-parametres',
  logs_audit: '/logs-audit',
  schema: '/base-de-donnees',
  scenarios_s01_s50: '/scenarios-cliniques',
  patient_journey: '/parcours-patient-360',
  appointments: '/rendez-vous',
  bed_management: '/gestion-lits',
  letters_referrals: '/courriers-references',
  care_plans: '/plans-de-soins',
  transmissions: '/transmissions-infirmieres',
  nurse_schedule: '/planning-soignants',
  surgery_theater: '/bloc-operatoire',
  imaging_pacs: '/imagerie-pacs',
  pharmacy_dispensing: '/pharmacie-dispensation',
  pharmacy_stock: '/pharmacie-stock',
  pharmacy_orders: '/pharmacie-commandes',
  pharmacy_expired: '/pharmacie-perimes',
  pharmacy_narcotics: '/pharmacie-stupefiants',
  pharmacy_sales: '/pharmacie-ventes',
  pharmacy_settings: '/pharmacie-parametres',
  sterilization_log: '/registre-sterilisation',
  quality_vigilance: '/qualite-vigilance',
  hr_management: '/ressources-humaines',
  superviseur_dashboard: '/superviseur',
  superviseur_sessions: '/superviseur-sessions',
  superviseur_invoices: '/superviseur-factures',
  superviseur_caisses: '/superviseur-caisses',
  superviseur_payments: '/superviseur-reglements',
  superviseur_reports: '/superviseur-rapports',
  caisse_dashboard: '/caisse',
  caisse_new_payment: '/caisse-encaissement',
  caisse_payments: '/caisse-reglements',
  caisse_cloture: '/caisse-cloture',
  factures_dashboard: '/facturation',
  factures_new_invoice: '/facturation-nouvelle',
  factures_all: '/factures-toutes',
  factures_draft: '/factures-brouillons',
  factures_paid: '/factures-payees',
  factures_unpaid: '/factures-impayees',
  factures_cancelled: '/factures-annulees',
  caisse_facture_dashboard: '/caisse-facturation',
  caisse_facture_sessions: '/caisse-facturation-sessions',
  caisse_facture_new_payment: '/caisse-facturation-nouveau-reglement',
  caisse_facture_new_invoice: '/caisse-facturation-nouvelle-facture',
  caisse_facture_all_invoices: '/caisse-facturation-factures',
  caisse_facture_all_payments: '/caisse-facturation-reglements',
  caisse_facture_draft: '/caisse-facturation-brouillons',
  caisse_facture_paid: '/caisse-facturation-payees',
  caisse_facture_unpaid: '/caisse-facturation-impayees',
  caisse_facture_cancelled: '/caisse-facturation-annulees',
  caisse_facture_cloture: '/caisse-facturation-cloture',
  infirmier_dashboard: '/infirmier',
  infirmier_queue: '/infirmier-file-attente',
  infirmier_triage: '/infirmier-triage',
  infirmier_vitals: '/infirmier-constantes',
  infirmier_prescriptions: '/infirmier-prescriptions',
  infirmier_referred: '/infirmier-orientes',
  infirmier_care: '/infirmier-soins',
  medecin_dashboard: '/medecin',
  medecin_queue: '/medecin-consultation',
  medecin_consultations: '/medecin-historique',
  medecin_prescriptions: '/medecin-ordonnances',
  medecin_dossiers: '/medecin-dossiers',
  medecin_referred: '/medecin-orientes',
  labo_dashboard: '/labo',
  labo_queue: '/labo-attente',
  labo_sampling: '/labo-prelevements',
  labo_in_progress: '/labo-analyse',
  labo_results: '/labo-resultats',
  labo_validation: '/labo-validation',
  labo_catalog: '/labo-catalogue',
  imagerie_dashboard: '/imagerie',
  imagerie_queue: '/imagerie-attente',
  imagerie_scheduled: '/imagerie-rendez-vous',
  imagerie_reports: '/imagerie-comptes-rendus',
  imagerie_completed: '/imagerie-realisees',
  imagerie_validation: '/imagerie-validation',
  imagerie_prescriptions: '/imagerie-prescriptions',
  hospit_dashboard: '/hospitalisation',
  hospit_admissions: '/hospitalisation-admissions',
  hospit_beds: '/hospitalisation-lits',
  hospit_patients: '/hospitalisation-patients',
  hospit_transfers: '/hospitalisation-transferts',
  hospit_monitoring: '/hospitalisation-surveillance',
  hospit_discharges: '/hospitalisation-sorties',
  pediatrie_dashboard: '/pediatrie',
  pediatrie_queue: '/pediatrie-attente',
  pediatrie_consultations: '/pediatrie-consultation',
  pediatrie_vaccination: '/pediatrie-vaccination',
  pediatrie_croissance: '/pediatrie-croissance',
  maternite_dashboard: '/maternite',
  maternite_cpn: '/maternite-cpn',
  maternite_accouchements: '/maternite-accouchements',
  maternite_partogramme: '/maternite-partogramme',
  maternite_postpartum: '/maternite-postpartum',
  specialiste_dashboard: '/specialiste-dashboard',
  specialiste_queue: '/specialiste-consultation',
  specialiste_consultations: '/specialiste-historique',
  specialiste_prescriptions: '/specialiste-ordonnances',
  specialiste_patients: '/specialiste-patients',
  specialiste_referred: '/specialiste-orientes',
  specialiste_followup: '/specialiste-suivi',
};

const getInitialView = (): AppView => {
  if (typeof window === 'undefined') return 'caisse_sessions';
  const path = window.location.pathname;
  const foundEntry = Object.entries(VIEW_TO_PATH_MAP).find(([view, p]) => p === path);
  if (foundEntry) {
    return foundEntry[0] as AppView;
  }
  const saved = localStorage.getItem('app_current_view');
  if (saved) return saved as AppView;
  return 'caisse_sessions';
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moveTypeFilter, setMoveTypeFilter] = useState<MoveType>('out_invoice');
  const [invoiceStateFilter, setInvoiceStateFilter] = useState<string>('all');
  const [invoicePaymentFilter, setInvoicePaymentFilter] = useState<string>('all');

  // Session workflow navigation helpers
  const [autoOpenInvoiceCreate, setAutoOpenInvoiceCreate] = useState(false);
  const [autoOpenPaymentModal, setAutoOpenPaymentModal] = useState(false);
  const [returnToSessionMode, setReturnToSessionMode] = useState(false);

  // Datasets
  const [moves, setMoves] = useState<AccountMove[]>([]);
  const [partners, setPartners] = useState<ResPartner[]>([]);
  const [users, setUsers] = useState<ResUser[]>([]);
  const [groups, setGroups] = useState<ResGroup[]>([]);
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [taxes, setTaxes] = useState<AccountTax[]>([]);
  const [payments, setPayments] = useState<AccountPayment[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: '🚨 ADMISSION URGENCE VITALE (NIVEAU 1)',
      message: 'Mme YAO Amoin (NDM-1554) admise au Box Urgences 1 : SpO2 86%, PAS 210/110 mmHg. Avis médical immédiat requis !',
      timestamp: '10:42',
      category: 'urgency',
      priority: 'critical',
      read: false,
      targetRole: 'Médecin',
      patientName: 'Mme YAO Amoin',
      patientNdm: 'NDM-1554',
      actionView: 'infirmier_queue',
    },
    {
      id: 'notif-2',
      title: '⚠️ RÉSULTAT LABORATOIRE CRITIQUE (VALEUR PANIQUE)',
      message: 'Troponine I ultra-sensible Positive à 12.4 ng/mL pour M. COULIBALY Sekou (NDM-1022). ECG & Réanimation informés.',
      timestamp: '10:35',
      category: 'lab',
      priority: 'critical',
      read: false,
      targetRole: 'Médecin',
      patientName: 'M. COULIBALY Sekou',
      patientNdm: 'NDM-1022',
      actionView: 'lab_results',
    },
    {
      id: 'notif-3',
      title: '🧪 NOUVEAU BON DE BIOLOGIE PRESCRIT',
      message: 'Bilan Hépatique & Ionogramme complet prescrit par Dr. Koné pour M. TRAORÉ Dramane (LAB-2026-0089). Prélèvement prêt.',
      timestamp: '10:20',
      category: 'lab',
      priority: 'high',
      read: false,
      targetRole: 'Biologiste',
      patientName: 'M. TRAORÉ Dramane',
      patientNdm: 'NDM-0892',
      actionView: 'lab_sampling',
    },
    {
      id: 'notif-4',
      title: '💊 NOUVELLE ORDONNANCE À SERVIR',
      message: 'Ordonnance enregistrée pour Mme BAMBA Fatou : Amoxicilline 1g, Paracétamol 1g, Spasfon. Attente confirmation caisse.',
      timestamp: '10:15',
      category: 'pharmacy',
      priority: 'normal',
      read: true,
      targetRole: 'Pharmacien',
      patientName: 'Mme BAMBA Fatou',
      patientNdm: 'NDM-1102',
      actionView: 'pharmacy_dispensing',
    },
    {
      id: 'notif-5',
      title: '💳 PAIEMENT CAISSE VALIDÉ (TICKET #204)',
      message: 'Facture FAC/2026/0042 réglée en Espèces (15 000 FCFA). Prestations d\'analyses et délivrance ordonnance autorisées.',
      timestamp: '09:50',
      category: 'caisse',
      priority: 'normal',
      read: true,
      targetRole: 'Pharmacien',
      patientName: 'M. KONAN Koffi',
      patientNdm: 'NDM-0450',
      actionView: 'payments',
    },
    {
      id: 'notif-6',
      title: '📑 CLÔTURE DE SESSION TRANSMISE AU SUPERVISEUR',
      message: 'Session Guichet 1 (SESSION00793) fermée par le caissier Mohamed Mandé. Total encaissé : 485 000 FCFA. Transit coffre initialisé.',
      timestamp: '09:10',
      category: 'supervisor',
      priority: 'high',
      read: false,
      targetRole: 'Superviseur',
      actionView: 'superviseur_sessions',
    },
  ]);

  const handleMarkAppNotificationAsRead = (id: string) => {
    setAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAppNotificationsAsRead = () => {
    setAppNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllAppNotifications = () => {
    setAppNotifications([]);
  };
  const [partnerReductions, setPartnerReductions] = useState<PartnerReduction[]>([]);
  const [labOrders, setLabOrders] = useState<LabExamOrder[]>([]);
  const [tillSessions, setTillSessions] = useState<TillSession[]>([]);
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<MedicalConsultation | null>(null);
  const [uoms, setUoms] = useState<UomUom[]>([]);
  const [countries, setCountries] = useState<ResCountry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [schemaTables, setSchemaTables] = useState<any[]>([]);
  const [showSessionClosedSuccessModal, setShowSessionClosedSuccessModal] = useState(false);
  const [closedSessionCodeForSuccess, setClosedSessionCodeForSuccess] = useState('');
  const [forceOpenSessionModal, setForceOpenSessionModal] = useState(false);

  // Company Branding & Settings State
  const [company, setCompany] = useState<CompanySettings>({
    name: "LABORATOIRE D'ANALYSES MÉDICALES & BIOLOGIE CLINIQUE",
    slogan: "Biologie Médicale, Diagnostics Spécialisés & Examens de Santé",
    logo_url: "",
    primary_color: "#334155",
    phone: "+225 27 20 22 33 44 / +225 07 08 09 10 11",
    email: "contact@laboratoire-biologie.ci",
    address: "Plateau Medical Center, Bd Hassan II",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    rccm: "CI-ABJ-2024-B-12940",
    tax_id: "CI 01928374 A",
    health_accreditation_number: "AGR-MSHP-2024-0098",
    currency_symbol: "FCFA",
    default_tax_rate: 0,
    tax_exemption_default_reason: "Exonération légale de TVA sur les prestations de biologie médicale (Art. 355 du Code Général des Impôts).",
    bank_name: "Société Générale Côte d'Ivoire (SGCI)",
    bank_iban: "CI93 0100 2000 3000 4000 50",
    bank_bic: "SGCIX01",
    mobile_money_numbers: "Wave / Orange Money / Moov : +225 07 08 09 10 11",
    enabled_payment_methods: ["cash", "wave", "orange_money", "moov_money", "card", "check", "transfer", "insurance"],
    medical_director_name: "Dr. Aboubacar TOURÉ - Biologiste Médical Specialist",
    lab_turnaround_default: "2 heures à 24 heures selon la spécialité",
    invoice_footer: "Document délivré à titre de quittance médicale officielle. Facture exonérée de TVA sur les prestations d'analyses médicales.",
    default_page_size: 50,
    flash_news_enabled: true,
    flash_news_speed: 10,
    flash_announcements: DEFAULT_FLASH_ANNOUNCEMENTS,
    hospital_services_config: DEFAULT_HOSPITAL_SERVICES,
    enabled_hospital_services: DEFAULT_HOSPITAL_SERVICES.map((s) => s.id),
  });

  // User & Auth State with localStorage persistence
  const [currentUser, setCurrentUser] = useState<ResUser | null>(() => {
    const saved = localStorage.getItem('app_saved_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
  const [inactivityWarningSeconds, setInactivityWarningSeconds] = useState<number | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());

  const resetActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setInactivityWarningSeconds(null);
  }, []);

  // Synchronize URL with currentView state and persist view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = VIEW_TO_PATH_MAP[currentView];
      if (path && window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
      localStorage.setItem('app_current_view', currentView);
    }
  }, [currentView]);

  // Support Back and Forward browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const foundEntry = Object.entries(VIEW_TO_PATH_MAP).find(([view, p]) => p === path);
      if (foundEntry) {
        setCurrentView(foundEntry[0] as AppView);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatic logout on inactivity (medical security and patient data privacy)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastActivityTimeRef.current > 1000) {
        lastActivityTimeRef.current = now;
      }
      setInactivityWarningSeconds((prev) => (prev !== null ? null : null));
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    const timeoutMinutes = company?.session_timeout_minutes !== undefined ? company.session_timeout_minutes : 15;
    if (timeoutMinutes <= 0) {
      return () => {
        events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
      };
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningThresholdMs = 60 * 1000;

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityTimeRef.current;
      const remainingMs = timeoutMs - elapsed;

      if (remainingMs <= 0) {
        setIsAuthenticated(false);
        setInactivityWarningSeconds(null);
        setSessionExpiredNotice(
          `Votre session a été verrouillée automatiquement suite à ${timeoutMinutes} minutes d'inactivité. Veuillez vous ré-authentifier pour des raisons de confidentialité médicale et de sécurité financière.`
        );
        showToast("Session verrouillée pour cause d'inactivité", 'error');
      } else if (remainingMs <= warningThresholdMs) {
        const secs = Math.ceil(remainingMs / 1000);
        setInactivityWarningSeconds(secs);
      } else {
        setInactivityWarningSeconds((prev) => (prev !== null ? null : null));
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
    };
  }, [isAuthenticated, company?.session_timeout_minutes]);

  // Modals
  const [pdfMove, setPdfMove] = useState<AccountMove | null>(null);
  const [selectedMoveForPayment, setSelectedMoveForPayment] = useState<AccountMove | null>(null);
  const [lookupPatient, setLookupPatient] = useState<ResPartner | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Loading & Real-time Spaced Toast Queue System (1s delay between notifications, max 2 visible, deduplicated)
  const [isLoading, setIsLoading] = useState(true);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      text: string;
      type: 'success' | 'error' | 'warning' | 'info';
      title?: string;
    }>
  >([]);

  const toastQueueRef = useRef<
    Array<{
      text: string;
      type: 'success' | 'error' | 'warning' | 'info';
      title?: string;
    }>
  >([]);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
      const defaultTitle =
        type === 'success'
          ? 'Opération Réussie'
          : type === 'error'
          ? 'Erreur Système'
          : type === 'warning'
          ? 'Attention'
          : 'Notification';

      const finalTitle = title || defaultTitle;

      // Prevent exact duplicate notifications from queueing
      const inQueue = toastQueueRef.current.some((t) => t.text === text);
      if (!inQueue) {
        toastQueueRef.current.push({ text, type, title: finalTitle });
      }
    },
    []
  );

  useEffect(() => {
    const queueTimer = setInterval(() => {
      if (toastQueueRef.current.length > 0) {
        setToasts((prev) => {
          // Limit to maximum 2 visible toasts simultaneously
          if (prev.length >= 2) return prev;

          const nextToast = toastQueueRef.current.shift();
          if (!nextToast) return prev;

          // Prevent duplicate if already visible
          if (prev.some((t) => t.text === nextToast.text)) return prev;

          const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const newToastItem = { id, ...nextToast };

          setTimeout(() => {
            setToasts((current) => current.filter((t) => t.id !== id));
          }, 4500);

          return [...prev, newToastItem];
        });
      }
    }, 1000);

    return () => clearInterval(queueTimer);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save active user and current view to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_saved_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentView) {
      localStorage.setItem('app_current_view', currentView);
    }
  }, [currentView]);

  // Enforce RBAC: If currentView is not allowed for the user, redirect to their first allowed view
  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedViews(currentUser);
      if (!allowed.includes(currentView)) {
        // Find the first view that is NOT a group ID (for rendering)
        const nextView = allowed.find(v => !v.endsWith('_group')) || allowed[0] || 'dashboard';
        setCurrentView(nextView as AppView);
        localStorage.setItem('app_current_view', nextView);
      }
    }
  }, [currentUser, currentView]);

  // Fetch All Initial Data from Backend API
  const fetchAllData = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const [
        movesRes,
        partnersRes,
        usersRes,
        groupsRes,
        productsRes,
        taxesRes,
        paymentsRes,
        notifsRes,
        labOrdersRes,
        analyticsRes,
        uomsRes,
        countriesRes,
        schemaRes,
        companyRes,
        partnerReductionsRes,
        tillSessionsRes,
        consultationsRes,
      ] = await Promise.all([
        safeFetchJson('/api/moves', []),
        safeFetchJson('/api/partners', []),
        safeFetchJson('/api/users', []),
        safeFetchJson('/api/groups', []),
        safeFetchJson('/api/products', []),
        safeFetchJson('/api/taxes', []),
        safeFetchJson('/api/payments', []),
        safeFetchJson('/api/notifications', []),
        safeFetchJson('/api/lab-orders', []),
        safeFetchJson('/api/analytics', null),
        safeFetchJson('/api/uoms', []),
        safeFetchJson('/api/countries', []),
        safeFetchJson<{ rawSql?: string; raw_sql?: string; tables?: any[] }>('/api/schema', {}),
        safeFetchJson('/api/company', null),
        safeFetchJson('/api/partner-reductions', []),
        safeFetchJson('/api/till-sessions', []),
        safeFetchJson('/api/consultations', []),
      ]);

      const safeMoves = Array.isArray(movesRes) ? movesRes : [];
      const safePartners = Array.isArray(partnersRes) ? partnersRes : [];
      const safeUsers = Array.isArray(usersRes) ? usersRes : [];
      const safeGroups = Array.isArray(groupsRes) ? groupsRes : [];
      const safeProducts = Array.isArray(productsRes) ? productsRes : [];
      const safeTaxes = Array.isArray(taxesRes) ? taxesRes : [];
      const safePayments = Array.isArray(paymentsRes) ? paymentsRes : [];
      const safeNotifs = Array.isArray(notifsRes) ? notifsRes : [];
      const safeLabOrders = Array.isArray(labOrdersRes) ? labOrdersRes : [];
      const safeUoms = Array.isArray(uomsRes) ? uomsRes : [];
      const safeCountries = Array.isArray(countriesRes) ? countriesRes : [];
      const safeReductions = Array.isArray(partnerReductionsRes) ? partnerReductionsRes : [];
      const safeTillSessions = Array.isArray(tillSessionsRes) ? tillSessionsRes : [];
      const safeConsultations = Array.isArray(consultationsRes) ? consultationsRes : [];

      setMoves(safeMoves);
      setPartners(safePartners);
      setUsers(safeUsers);
      setGroups(safeGroups);
      setProducts(safeProducts);
      setTaxes(safeTaxes);
      setPayments(safePayments);
      setNotifications(safeNotifs);
      setPartnerReductions(safeReductions);
      setLabOrders(safeLabOrders);
      setTillSessions(safeTillSessions);
      if (safeTillSessions.length > 0) {
        saveAllSessions(safeTillSessions);
      }
      setConsultations(safeConsultations);
      setAnalytics(analyticsRes);
      setUoms(safeUoms);
      setCountries(safeCountries);
      setSchemaSql(schemaRes?.rawSql || schemaRes?.raw_sql || '');
      setSchemaTables(Array.isArray(schemaRes?.tables) ? schemaRes.tables : []);
      if (companyRes && companyRes.name) {
        setCompany((prev) => ({
          ...prev,
          ...companyRes,
          hospital_services_config:
            companyRes.hospital_services_config && companyRes.hospital_services_config.length > 0
              ? companyRes.hospital_services_config
              : prev.hospital_services_config || DEFAULT_HOSPITAL_SERVICES,
          enabled_hospital_services:
            companyRes.enabled_hospital_services && Array.isArray(companyRes.enabled_hospital_services)
              ? companyRes.enabled_hospital_services
              : (companyRes.hospital_services_config && companyRes.hospital_services_config.length > 0
                  ? companyRes.hospital_services_config.filter((s: any) => s.enabled).map((s: any) => s.id)
                  : prev.enabled_hospital_services || DEFAULT_HOSPITAL_SERVICES.map((s) => s.id)),
        }));
      }

      // Resilient Dual-Store: local mirror & automatic recovery if container restarted
      try {
        const LOCAL_MIRROR_KEY = 'med_lab_permanent_mirror_v1';
        const cachedRaw = localStorage.getItem(LOCAL_MIRROR_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          // Check for any user tests or invoices stored locally that are missing in the server response
          const missingLabOrders = (cached.labOrders || []).filter(
            (co: any) => co?.id && !safeLabOrders.some((so) => so.id === co.id)
          );
          const missingMoves = (cached.moves || []).filter(
            (cm: any) => cm?.id && !safeMoves.some((sm) => sm.id === cm.id)
          );
          const missingPartners = (cached.partners || []).filter(
            (cp: any) => cp?.id && !safePartners.some((sp) => sp.id === cp.id)
          );
          const missingPayments = (cached.payments || []).filter(
            (cpy: any) => cpy?.id && !safePayments.some((spy) => spy.id === cpy.id)
          );

          if (missingLabOrders.length > 0 || missingMoves.length > 0 || missingPartners.length > 0) {
            // Restore missing tests/invoices to the backend immediately
            fetch('/api/sync-restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                labOrders: missingLabOrders,
                moves: missingMoves,
                partners: missingPartners,
                payments: missingPayments,
              }),
            })
              .then((r) => r.json())
              .then((restoreResult) => {
                if (restoreResult?.success) {
                  if (missingLabOrders.length > 0) {
                    setLabOrders((prev) => [...missingLabOrders, ...prev]);
                  }
                  if (missingMoves.length > 0) {
                    setMoves((prev) => [...missingMoves, ...prev]);
                  }
                  if (missingPartners.length > 0) {
                    setPartners((prev) => [...missingPartners, ...prev]);
                  }
                  showToast(
                    `Restauration permanente : ${missingLabOrders.length} test(s) et factures précédents synchronisés !`,
                    'success'
                  );
                }
              })
              .catch((e) => console.error('Auto-restore sync error:', e));
          }
        }

        // Keep local mirror updated with the latest verified data
        localStorage.setItem(
          LOCAL_MIRROR_KEY,
          JSON.stringify({
            moves: safeMoves,
            labOrders: safeLabOrders,
            partners: safePartners,
            payments: safePayments,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (mirrorErr) {
        console.warn('LocalStorage mirror error:', mirrorErr);
      }

      if (safeUsers.length > 0) {
        setCurrentUser((prev) => {
          if (!prev) {
            const savedUserJson = localStorage.getItem('lis_current_user');
            if (savedUserJson) {
              try {
                const parsed = JSON.parse(savedUserJson);
                const found = safeUsers.find((u) => u.id === parsed.id || u.login === parsed.login);
                if (found) return found;
              } catch (e) {}
            }
            return safeUsers[0];
          }
          const existing = safeUsers.find((u) => u.id === prev.id);
          if (!existing) return prev;

          // Compare key identity fields to avoid replacing object reference on every background fetch
          if (
            prev.id === existing.id &&
            prev.role === existing.role &&
            prev.name === existing.name &&
            prev.email === existing.email &&
            JSON.stringify(prev.group_ids || []) === JSON.stringify(existing.group_ids || []) &&
            JSON.stringify(prev.permissions || []) === JSON.stringify(existing.permissions || []) &&
            JSON.stringify(prev.allowed_views || []) === JSON.stringify(existing.allowed_views || [])
          ) {
            return prev;
          }
          return existing;
        });
      }
    } catch (err: any) {
      console.warn('Chargement données (mode local / autonome actif):', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(true);
  }, []);

  useEffect(() => {
    if (company) {
      if (company.name) {
        document.title = `${company.name} | Facturation Médicale & Caisse`;
      }
      const root = document.documentElement;
      if (company.primary_color) {
        root.style.setProperty('--primary-color', company.primary_color);
      }
      if (company.secondary_color) {
        root.style.setProperty('--secondary-color', company.secondary_color);
      }
      if (company.sidebar_color) {
        root.style.setProperty('--sidebar-color', company.sidebar_color);
      }
    }
  }, [company]);

  const handleGlobalSearchNDM = (query: string) => {
    if (!query) return;
    const cleanQuery = query.trim().toLowerCase();
    
    // --- SMART PARSING OF QR CODES ---
    // If it's a structured QR code like: "dossier:ndm-00270410|facture:fc-2026-001|..."
    let parsedDossier = '';
    let parsedInvoice = '';
    
    if (cleanQuery.includes('dossier:')) {
      const matchDossier = query.match(/dossier:\s*([^|\n]+)/i);
      if (matchDossier) {
        parsedDossier = matchDossier[1].trim().toLowerCase();
      }
    }
    if (cleanQuery.includes('facture:')) {
      const matchInvoice = query.match(/facture:\s*([^|\n]+)/i);
      if (matchInvoice) {
        parsedInvoice = matchInvoice[1].trim().toLowerCase();
      }
    }

    // Determine candidate search terms
    const candidates = [cleanQuery];
    if (parsedDossier) candidates.push(parsedDossier);
    if (parsedInvoice) candidates.push(parsedInvoice);
    
    // If the dossier is something like NDM-00270410, extract numeric parts
    candidates.forEach((cand) => {
      const numericPart = cand.replace(/[^0-9]/g, '');
      if (numericPart && numericPart.length >= 4) {
        candidates.push(numericPart);
      }
      const withoutPrefix = cand.replace(/^ndm-/, '');
      if (withoutPrefix !== cand) {
        candidates.push(withoutPrefix);
      }
    });

    // Make candidates unique and non-empty
    const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));

    let foundPatient: any = null;
    let foundMove: any = null;

    // 1. Try to find a patient whose NDM matches any of our candidates
    for (const cand of uniqueCandidates) {
      foundPatient = partners.find((p) => {
        if (p.partner_type && p.partner_type !== 'patient') return false;
        if (!p.ndm) return false;
        const pNdmLower = p.ndm.toLowerCase();
        const pNdmNumeric = pNdmLower.replace(/[^0-9]/g, '');
        
        return (
          pNdmLower === cand ||
          pNdmLower.includes(cand) ||
          cand.includes(pNdmLower) ||
          (pNdmNumeric && cand.includes(pNdmNumeric)) ||
          (pNdmNumeric && pNdmNumeric === cand)
        );
      });
      if (foundPatient) break;
    }

    // 2. If not found, try to find an invoice (AccountMove) matching any of our candidates
    if (!foundPatient) {
      for (const cand of uniqueCandidates) {
        foundMove = moves.find((m) => {
          const moveName = (m.name || '').toLowerCase();
          const moveIdStr = String(m.id).toLowerCase();
          return (
            moveName === cand ||
            moveName.includes(cand) ||
            cand.includes(moveName) ||
            moveIdStr === cand
          );
        });
        if (foundMove) {
          if (foundMove.partner_id) {
            foundPatient = partners.find((p) => p.id === foundMove.partner_id);
          } else if (foundMove.partner) {
            foundPatient = foundMove.partner;
          }
          // Verify it's actually a patient and not an insurance invoice
          if (foundPatient && foundPatient.partner_type && foundPatient.partner_type !== 'patient') {
            foundPatient = null;
          }
          if (foundPatient) break;
        }
      }
    }

    // 3. If still not found, try to find patient by name containing any of our non-numeric candidates
    if (!foundPatient) {
      for (const cand of uniqueCandidates) {
        // Skip purely numeric candidates for name search to avoid false positives
        if (/^\d+$/.test(cand)) continue;
        foundPatient = partners.find((p) => {
          if (p.partner_type && p.partner_type !== 'patient') return false;
          // Also if they don't have an NDM and they are a company, they're probably not a patient
          if (p.is_company) return false;
          return (p.name || '').toLowerCase().includes(cand);
        });
        if (foundPatient) break;
      }
    }

    if (foundPatient) {
      setLookupPatient(foundPatient);
      setIsLookupOpen(true);
      showToast(`Dossier patient #${foundPatient.ndm || foundPatient.id} (${foundPatient.name}) chargé !`);
    } else {
      showToast("Aucun dossier ou reçu correspondant trouvé", "error");
    }
  };

  useEffect(() => {
    if (!isLoading && partners.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search') || params.get('ndm');
      if (searchParam) {
        handleGlobalSearchNDM(searchParam);
        // Clean URL to avoid repeating on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [isLoading, partners, moves]);

  // Active user till session
  const activeUserSession = useMemo(() => {
    if (!currentUser) return null;
    const currentName = (currentUser.name || '').toLowerCase().trim();
    const currentLogin = (currentUser.login || '').toLowerCase().trim();

    // 1. First check server-synced tillSessions
    const serverActive = tillSessions.find((s) => {
      if (s.state !== 'in_progress') return false;
      if (s.cashier_id === currentUser.id) return true;
      const sName = (s.cashier_name || '').toLowerCase().trim();
      if (sName === currentName || sName === currentLogin) return true;
      if (currentLogin === 'caissier' && (s.cashier_id === 3 || sName.includes('amadou') || sName.includes('caissier'))) return true;
      if (currentLogin === 'caisse_facture' && (s.cashier_id === 4 || sName.includes('awa') || sName.includes('facture'))) return true;
      return false;
    });

    if (serverActive) {
      // Prioritize explicit local closed status so the UI responds instantly to closure
      const allLocal = loadAllSessions();
      const localState = allLocal.find((s) => s.id === serverActive.id);
      if (localState && localState.state === 'closed') {
        return null;
      }
      return serverActive;
    }

    // 2. Fallback to local session registry
    return getActiveSessionForCashier(currentUser);
  }, [tillSessions, currentUser]);

  // Invoice Handlers
  const handleSaveMove = async (moveData: any): Promise<AccountMove | null> => {
    try {
      const isEdit = !!moveData.id;
      const url = isEdit ? `/api/moves/${moveData.id}` : '/api/moves';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...moveData,
          invoice_user_id: moveData.invoice_user_id || currentUser?.id,
          ...(isEdit ? {} : { till_session_id: moveData.till_session_id || activeUserSession?.id || null }),
        }),
      });
      if (res.ok) {
        const savedMove = await res.json();
        showToast(isEdit ? 'Facture mise à jour avec succès !' : 'Facture enregistrée en état Brouillon avec succès !');
        await fetchAllData();
        return savedMove;
      } else {
        showToast('Erreur lors de la sauvegarde de la facture', 'error');
        return null;
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
      return null;
    }
  };

  const handlePostMove = async (moveId: number): Promise<AccountMove | null> => {
    try {
      const res = await fetch(`/api/moves/${moveId}/post`, { method: 'POST' });
      if (res.ok) {
        const postedMove = await res.json();
        showToast('Facture comptabilisée et validée au Grand Livre !');
        await fetchAllData();
        return postedMove;
      }
      return null;
    } catch (e) {
      showToast('Erreur lors de la validation', 'error');
      return null;
    }
  };

  const handleCancelMove = async (moveId: number) => {
    try {
      const res = await fetch(`/api/moves/${moveId}/cancel`, { method: 'POST' });
      if (res.ok) {
        showToast('Facture annulée.');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur lors de l annulement', 'error');
    }
  };

  const handleDeleteMove = async (moveId: number) => {
    try {
      const res = await fetch(`/api/moves/${moveId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Facture supprimée avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur lors de la suppression de la facture', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau lors de la suppression', 'error');
    }
  };

  const handlePayInvoice = (move: AccountMove) => {
    if (!hasActiveSession) {
      setForceOpenSessionModal(true);
      showToast("Veuillez d'abord ouvrir une session pour encaisser cette facture.", 'warning', 'Session Requise');
      return;
    }
    setSelectedMoveForPayment(move);
    setAutoOpenPaymentModal(true);
    setReturnToSessionMode(true);
    setCurrentView('payments');
  };

  const handleNavigateToNewPayment = async () => {
    if (!hasActiveSession) {
      setForceOpenSessionModal(true);
      showToast("Veuillez d'abord ouvrir une session pour enregistrer un règlement.", 'warning', 'Session Requise');
      return;
    }
    await fetchAllData();
    setAutoOpenPaymentModal(true);
    setReturnToSessionMode(false);
    setCurrentView('payments');
  };

  // Register Payment Handler
  const handleRegisterPayment = async (paymentData: any) => {
    try {
      const activeUserSession = tillSessions.find(
        (s) => (s.cashier_id === currentUser?.id || s.cashier_name === currentUser?.name) && s.state === 'in_progress'
      );

      const targetMove = paymentData.move_id ? moves.find((m) => m.id === Number(paymentData.move_id)) : null;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          patient_name: paymentData.patient_name || targetMove?.patient_name || targetMove?.partner?.name || null,
          ndm_number: paymentData.ndm_number || targetMove?.ndm || null,
          session_id: paymentData.session_id || activeUserSession?.id || null,
          user_id: paymentData.user_id || currentUser?.id,
          cashier_name: currentUser?.name,
        }),
      });
      if (res.ok) {
        showToast('Paiement enregistré et réconcilié avec succès !');
        await fetchAllData();
      } else {
        showToast('Erreur lors de l enregistrement du paiement', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  // Partner Handler
  const handleSavePartner = async (partnerData: any): Promise<ResPartner | null> => {
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      if (res.ok) {
        const savedPartner: ResPartner = await res.json();
        showToast(
          savedPartner.partner_type === 'patient'
            ? `Dossier patient #${savedPartner.ndm || savedPartner.id} (${savedPartner.name}) enregistré avec succès !`
            : 'Fiche Partenaire enregistrée !',
          'success',
          'Dossier Partenaire'
        );
        
        // Auto-increment next NDM sequential sequence
        const prefix = company.ndm_prefix !== undefined ? company.ndm_prefix : 'NDM-';
        if (partnerData.ndm && partnerData.ndm.startsWith(prefix)) {
          const nextNum = company.ndm_next_number !== undefined ? company.ndm_next_number : 270408;
          const updatedCompany = {
            ...company,
            ndm_next_number: nextNum + 1
          };
          try {
            const companyRes = await fetch('/api/company', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedCompany),
            });
            if (companyRes.ok) {
              const savedComp = await companyRes.json();
              setCompany(savedComp);
            }
          } catch (companyErr) {
            console.error("Error auto-incrementing NDM sequence:", companyErr);
          }
        }

        await fetchAllData();
        return savedPartner;
      } else {
        showToast('Erreur lors de l enregistrement du partenaire', 'error', 'Erreur Partenaire');
        return null;
      }
    } catch (e) {
      showToast('Erreur réseau partenaire', 'error', 'Erreur Partenaire');
      return null;
    }
  };

  const handleDeletePartner = async (id: number) => {
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Partenaire supprimé avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur suppression partenaire', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // Partner Reductions Handlers
  const handleSavePartnerReduction = async (reductionData: any) => {
    try {
      const isEdit = !!reductionData.id;
      const url = isEdit ? `/api/partner-reductions/${reductionData.id}` : '/api/partner-reductions';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reductionData),
      });

      if (res.ok) {
        showToast(isEdit ? 'Grille de réduction mise à jour !' : 'Nouvelle réduction enregistrée !');
        await fetchAllData();
      } else {
        showToast('Erreur lors de la sauvegarde de la réduction', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  const handleDeletePartnerReduction = async (id: number) => {
    try {
      const res = await fetch(`/api/partner-reductions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Réduction supprimée de la grille avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur de suppression de la réduction', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // Product Handler
  const handleSaveProduct = async (productData: any) => {
    try {
      const isEdit = !!productData.id;
      const url = isEdit ? `/api/products/${productData.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        showToast(isEdit ? 'Prestation modifiée avec succès !' : 'Prestation ajoutée au catalogue !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur produit', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Analyse / Produit supprimé avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur suppression produit', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // Lab Exam Orders Handler
  const handleSaveLabOrder = async (orderData: Partial<LabExamOrder>) => {
    try {
      const isEdit = !!orderData.id;
      const url = isEdit ? `/api/lab-orders/${orderData.id}` : '/api/lab-orders';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        showToast(
          orderData.status === 'validated'
            ? 'Résultats validés médicalement et signés avec succès !'
            : isEdit
            ? 'Dossier d\'analyse mis à jour !'
            : 'Nouvel examen de laboratoire créé avec succès !'
        );
        await fetchAllData();
      } else {
        showToast('Erreur lors de l\'enregistrement de l\'examen', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  const handleDeleteLabOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/lab-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Dossier d\'examen supprimé avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur suppression examen', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // User & Group Handlers
  const handleSaveUser = async (userData: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const savedUser = await res.json();
        showToast('Utilisateur et droits d accès mis à jour !');
        if (currentUser && (currentUser.id === savedUser.id || currentUser.login === savedUser.login)) {
          setCurrentUser(savedUser);
          localStorage.setItem('app_saved_user', JSON.stringify(savedUser));
          const allowed = getAllowedViews(savedUser);
          if (!allowed.includes(currentView)) {
            const next = allowed[0] || 'dashboard';
            setCurrentView(next);
            localStorage.setItem('app_current_view', next);
          }
        }
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur utilisateur', 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Compte utilisateur supprimé avec succès !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur suppression utilisateur', 'error');
    }
  };

  const handleSaveGroup = async (groupData: any) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });
      if (res.ok) {
        showToast('Rôle et matrice de permissions mis à jour !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur rôle', 'error');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Rôle supprimé avec succès !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur suppression rôle', 'error');
    }
  };

  // Email Reminder Handler
  const handleSendReminder = async (moveId: number) => {
    try {
      const res = await fetch('/api/notifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move_id: moveId }),
      });
      if (res.ok) {
        showToast('Email de relance automatique transmis avec succès !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur transmission email', 'error');
    }
  };

  // Execute SQL Handler
  const handleExecuteSql = async (sql: string) => {
    const res = await fetch('/api/schema/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    return res.json();
  };

  const handleReturnToSession = () => {
    setAutoOpenInvoiceCreate(false);
    setAutoOpenPaymentModal(false);
    setReturnToSessionMode(false);
    setCurrentView('caisse_sessions');
  };

  // Bridge to Payment View from Invoices
  const handleOpenPaymentModal = (move: AccountMove) => {
    setSelectedMoveForPayment(move);
    setCurrentView('payments');
  };

  const handleSaveCompany = async (updated: CompanySettings) => {
    try {
      const payload: CompanySettings = {
        ...company,
        ...updated,
        hospital_services_config: updated.hospital_services_config || company.hospital_services_config || DEFAULT_HOSPITAL_SERVICES,
        enabled_hospital_services:
          updated.enabled_hospital_services ||
          company.enabled_hospital_services ||
          (updated.hospital_services_config ? updated.hospital_services_config.filter((s) => s.enabled).map((s) => s.id) : DEFAULT_HOSPITAL_SERVICES.map((s) => s.id)),
      };

      // Optimistically update local state & localStorage so UI immediately responds without waiting or crashing
      setCompany(payload);
      if (payload.hospital_services_config) {
        try {
          localStorage.setItem('app_hospital_services_config', JSON.stringify(payload.hospital_services_config));
          localStorage.setItem('app_enabled_services_ids', JSON.stringify(payload.enabled_hospital_services || []));
        } catch (e) {}
      }

      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setCompany((prev) => ({
          ...prev,
          ...saved,
          hospital_services_config: saved.hospital_services_config || payload.hospital_services_config,
          enabled_hospital_services: saved.enabled_hospital_services || payload.enabled_hospital_services,
        }));
        showToast('Configuration et modules enregistrés avec succès !', 'success');
      } else {
        showToast('Erreur enregistrement entreprise', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau lors de la sauvegarde', 'error');
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser toutes les données aux valeurs d\'origine ?')) return;
    try {
      setIsLoading(true);
      await fetch('/api/reset-db', { method: 'POST' });
      showToast('Base de données réinitialisée avec succès !');
      await fetchAllData();
    } catch (e) {
      showToast('Erreur réinitialisation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    showToast('Déconnexion effectuée');
  };

  const handleLogin = (user: ResUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setSessionExpiredNotice(null);
    setInactivityWarningSeconds(null);
    lastActivityTimeRef.current = Date.now();
    localStorage.setItem('app_saved_user', JSON.stringify(user));
    const roleLower = (user.role || '').toLowerCase();
    const loginLower = (user.login || '').toLowerCase();
    const isSupervisor =
      roleLower.includes('supervis') ||
      loginLower === 'mande' ||
      (user.group_ids || []).includes(1);

    const isBillerOrCashier =
      !isSupervisor &&
      (roleLower.includes('factur') ||
        roleLower.includes('caiss') ||
        user.login === 'facturier' ||
        user.login === 'caissier' ||
        user.login === 'facture_caisse');

    if (isSupervisor) {
      setCurrentView('dashboard');
      localStorage.setItem('app_current_view', 'dashboard');
    } else if (isBillerOrCashier) {
      setCurrentView('caisse_sessions');
      localStorage.setItem('app_current_view', 'caisse_sessions');
    } else {
      const allowed = getAllowedViews(user);
      if (!allowed.includes(currentView)) {
        const next = allowed[0] || 'dashboard';
        setCurrentView(next);
        localStorage.setItem('app_current_view', next);
      }
    }
    showToast(`Bienvenue, ${user.name} !`);
  };

  if (isSplashVisible) {
    return (
      <SplashLoadingScreen
        companyName={company.name || 'SAP PAY'}
        watermarkText={company.watermark_text || "Système d'Information Hospitalier & Financier"}
        primaryColor={company.primary_color || '#0f172a'}
        logoUrl={company.logo_url}
        isDataReady={!isLoading}
        onFinished={() => setIsSplashVisible(false)}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        users={users}
        company={company}
        onLogin={handleLogin}
        sessionExpiredNotice={sessionExpiredNotice || undefined}
      />
    );
  }

  const hasActiveSession = Boolean(activeUserSession);
  const isCashierProfile = isCashierOnlyProfile(currentUser);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-slate-900 selection:text-white relative overflow-x-hidden">
      {/* Background Watermark Logo Layer (Filigrane visible et discret en fond z-0, non bloquant z-10) */}
      {company.show_watermark !== false && (
        <div
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden lg:pl-64 select-none"
          aria-hidden="true"
        >
          {company.logo_url ? (
            <div className="flex flex-col items-center justify-center -rotate-12 transition-transform pointer-events-none">
              <img
                src={company.logo_url}
                alt=""
                style={{ opacity: Math.min(company.watermark_opacity || 0.04, 0.06) }}
                className="w-96 h-96 sm:w-[520px] sm:h-[520px] object-contain select-none pointer-events-none"
              />
              {company.watermark_text && (
                <div
                  style={{ opacity: Math.min((company.watermark_opacity || 0.04) * 1.5, 0.08) }}
                  className="mt-3 text-center font-black uppercase text-slate-900 tracking-widest text-xs sm:text-sm select-none pointer-events-none"
                >
                  {company.watermark_text}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{ opacity: Math.min(company.watermark_opacity || 0.04, 0.06) }}
              className="text-center font-black uppercase text-slate-900 tracking-widest text-3xl sm:text-5xl select-none -rotate-12 max-w-xl px-6 leading-tight pointer-events-none"
            >
              {company.watermark_text || company.name || "POLYCLINIQUE ET LABORATOIRE"}
            </div>
          )}
        </div>
      )}

      {/* Structured Left Sidebar & Top Status Header Navigation */}
      {(() => {
        const pendingPaymentsCount = moves.filter(
          (m) => m.move_type === 'out_invoice' && m.state === 'posted' && m.payment_state !== 'paid' && m.amount_residual > 0
        ).length;

        return (
          <AppNavigation
            currentView={currentView}
            setCurrentView={(view) => {
              const roleLower = (currentUser?.role || '').toLowerCase();
              const loginLower = (currentUser?.login || '').toLowerCase();
              const emailLower = (currentUser?.email || '').toLowerCase();

              const isSupervisorOrAdminUser =
                isSupervisorOrAdmin(currentUser) ||
                roleLower.includes('supervis') ||
                roleLower.includes('admin') ||
                roleLower.includes('direct') ||
                roleLower.includes('biolog') ||
                roleLower.includes('technic') ||
                roleLower.includes('universel') ||
                loginLower.includes('admin') ||
                loginLower.includes('supervis') ||
                emailLower === 'mandemohamed68@gmail.com' ||
                (currentUser?.group_ids || []).includes(1) ||
                (currentUser?.group_ids || []).includes(5);

              // Seuls les profils opérationnels de caisse, facture et caisse & facture doivent ouvrir et fermer une session
              const profile = getUserBillingProfile(currentUser);
              const isSessionReq =
                !isSupervisorOrAdminUser &&
                (roleLower.includes('caiss') ||
                  roleLower.includes('factur') ||
                  roleLower.includes('polyvalent') ||
                  loginLower === 'caissier' ||
                  loginLower === 'caisse_facture' ||
                  loginLower === 'facturer' ||
                  loginLower === 'facturier' ||
                  profile === 'caisse' ||
                  profile === 'facture' ||
                  profile === 'facture_caisse');

              const isCaisseOrPolyvalentView = view.startsWith('caisse_') && view !== 'caisse_sessions';
              if (!isSupervisorOrAdminUser && (isSessionReq || isCaisseOrPolyvalentView) && !hasActiveSession && view !== 'caisse_sessions') {
                showToast('Ouverture de session requise pour accéder aux fonctionnalités de caisse', 'error');
                setCurrentView('caisse_sessions');
                return;
              }

              const allowed = getAllowedViews(currentUser);
              if (allowed.includes(view)) {
                if (view === 'invoices') {
                  setSelectedMoveForPayment(null);
                  setAutoOpenInvoiceCreate(false);
                }
                setCurrentView(view);
              } else {
                showToast('Accès non autorisé pour votre profil', 'error');
              }
            }}
            currentUser={currentUser}
            users={users}
            groups={groups}
            company={company}
            hasActiveSession={hasActiveSession}
            onSelectUser={(u) => {
              setCurrentUser(u);
              localStorage.setItem('app_saved_user', JSON.stringify(u));
              const allowed = getAllowedViews(u);
              const rLower = (u.role || '').toLowerCase();
              const lLower = (u.login || '').toLowerCase();
              const eLower = (u.email || '').toLowerCase();

              const isUAdminOrSup =
                rLower.includes('supervis') ||
                rLower.includes('admin') ||
                rLower.includes('directeur') ||
                rLower.includes('biolog') ||
                rLower.includes('technic') ||
                lLower === 'admin' ||
                lLower === 'superviseur' ||
                (u.group_ids || []).includes(1) ||
                (u.group_ids || []).includes(5);

              const uProfile = getUserBillingProfile(u);
              const isURequired =
                !isUAdminOrSup &&
                (rLower.includes('caiss') ||
                  rLower.includes('factur') ||
                  rLower.includes('polyvalent') ||
                  lLower === 'caissier' ||
                  lLower === 'caisse_facture' ||
                  lLower === 'facturer' ||
                  lLower === 'facturier' ||
                  uProfile === 'caisse' ||
                  uProfile === 'facture' ||
                  uProfile === 'facture_caisse');

              if (isURequired) {
                setCurrentView('caisse_sessions');
              } else if (rLower.includes('supervis') || lLower === 'mande' || (u.group_ids || []).includes(1)) {
                setCurrentView('dashboard');
              } else if (!allowed.includes(currentView)) {
                setCurrentView(allowed[0] || 'dashboard');
              }
              showToast(`Profil actif : ${u.name} (${u.role || 'Opérateur'})`);
            }}
            onLogout={handleLogout}
            onNewInvoice={() => {
              setMoveTypeFilter('out_invoice');
              setCurrentView('invoices');
            }}
            onNewPayment={() => {
              setAutoOpenPaymentModal(false);
              setCurrentView('payments');
            }}
            onNewLabOrder={() => setCurrentView('lab_results')}
            onResetDb={handleResetDb}
            notificationCount={notifications.length}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onSearchNDM={handleGlobalSearchNDM}
            pendingPaymentsCount={pendingPaymentsCount}
            partners={partners}
            moves={moves}
            onSelectPatient={(p) => {
              if (p.ndm) {
                handleGlobalSearchNDM(p.ndm);
              } else {
                setLookupPatient(p);
                setIsLookupOpen(true);
              }
            }}
            onSelectMove={(m) => {
              setPdfMove(m);
            }}
            showToast={showToast}
            appNotifications={appNotifications}
            onMarkNotificationAsRead={handleMarkAppNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllAppNotificationsAsRead}
            onClearAllNotifications={handleClearAllAppNotifications}
          />
        );
      })()}

      {/* Main App Canvas - Full Width View Without Restrictive Width Constraints */}
      <main className="flex-1 lg:pl-64 transition-all p-3 sm:p-5 lg:p-6 w-full relative">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div
              style={{ borderTopColor: 'transparent', borderColor: company.primary_color || '#0f172a' }}
              className="w-12 h-12 border-4 rounded-full animate-spin"
            />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chargement des données du système...
            </p>
          </div>
        ) : (
          <>
            {/* Active Cashier Session Banner */}
            {activeUserSession && (
              <div className="mb-4">
                <ActiveSessionBar
                  session={activeUserSession}
                  onInitiateClose={() => {
                    setCurrentView('caisse_sessions');
                  }}
                />
              </div>
            )}

            {/* Mandatory Cashier Session Opening Modal */}
            <MandatorySessionOpenModal
              isOpen={Boolean(isCashierProfile && !activeUserSession && !isLoading && isAuthenticated && forceOpenSessionModal)}
              currentUser={currentUser}
              onClose={() => setForceOpenSessionModal(false)}
              onSessionOpened={async (createdSession) => {
                setForceOpenSessionModal(false);
                try {
                  const res = await fetch('/api/till-sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      cashier_id: createdSession.cashier_id,
                      cashier_name: createdSession.cashier_name,
                      till_name: createdSession.till_name,
                      opening_balance: createdSession.opening_balance,
                      notes: createdSession.notes,
                    }),
                  });
                  if (res.ok) {
                    const serverSession = await res.json();
                    if (serverSession && serverSession.id) {
                      setTillSessions((prev) => {
                        const updated = [serverSession, ...prev.filter((s) => s.id !== serverSession.id)];
                        saveAllSessions(updated);
                        return updated;
                      });
                    }
                  }
                } catch (err) {
                  console.warn('Till session save error:', err);
                }
                await fetchAllData();
                showToast(`Session ${createdSession.session_code} ouverte avec succès !`, 'success');
              }}
            />

            <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full"
            >
            {!isViewServiceActive(currentView, company) ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4 ring-8 ring-amber-50/50">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Module Hospitalier Temporairement Désactivé
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                  Ce service a été désactivé dans la configuration de l'établissement. Vous pouvez le réactiver à tout moment depuis le menu d'administration des modules.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    Tableau de bord général
                  </button>
                  <button
                    onClick={() => setCurrentView('admin_services')}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-sm font-semibold transition-all"
                  >
                    Gérer les modules (Admin)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {currentView === 'infirmier_dashboard' && (
              <InfirmierDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'medecin_dashboard' && (
              <MedecinDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'specialiste_dashboard' && (
              <SpecialisteDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'labo_dashboard' && (
              <LaboDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'imagerie_dashboard' && (
              <ImagerieDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'hospit_dashboard' && (
              <HospitDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'superviseur_dashboard' && (
              <SuperviseurDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'caisse_dashboard' && (
              <CaisseDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'factures_dashboard' && (
              <FacturesDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {currentView === 'caisse_facture_dashboard' && (
              <CaisseFactureDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {(currentView === 'admin_dashboard' || currentView === 'dashboard') && (
              <AdminDashboard
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                labOrders={labOrders}
                users={users}
                currentUser={currentUser}
                company={company}
                analytics={analytics}
                onNavigateToView={(v) => setCurrentView(v)}
                onNewInvoice={() => { setMoveTypeFilter('out_invoice'); setCurrentView('invoices'); }}
                onNewPayment={handleNavigateToNewPayment}
              />
            )}

            {(currentView === 'invoices' ||
              currentView === 'factures_all' ||
              currentView === 'factures_new_invoice' ||
              currentView === 'factures_draft' ||
              currentView === 'factures_paid' ||
              currentView === 'factures_unpaid' ||
              currentView === 'factures_cancelled' ||
              currentView === 'caisse_facture_all_invoices' ||
              currentView === 'caisse_facture_new_invoice' ||
              currentView === 'caisse_facture_draft' ||
              currentView === 'caisse_facture_paid' ||
              currentView === 'caisse_facture_unpaid' ||
              currentView === 'caisse_facture_cancelled' ||
              currentView === 'superviseur_invoices') && (
              <InvoicesView
                moves={moves}
                partners={partners}
                users={users}
                products={products}
                taxes={taxes}
                consultations={consultations}
                currentUser={currentUser}
                onSaveMove={handleSaveMove}
                onPostMove={handlePostMove}
                onCancelMove={handleCancelMove}
                onDeleteMove={handleDeleteMove}
                onOpenPdf={(m) => setPdfMove(m)}
                onOpenPaymentModal={handleOpenPaymentModal}
                onRegisterPayment={handleRegisterPayment}
                onSaveLabOrder={handleSaveLabOrder}
                onSendReminder={handleSendReminder}
                moveTypeFilter={moveTypeFilter}
                setMoveTypeFilter={setMoveTypeFilter}
                autoOpenCreate={
                  autoOpenInvoiceCreate ||
                  currentView === 'factures_new_invoice' ||
                  currentView === 'caisse_facture_new_invoice'
                }
                initialMove={selectedMoveForPayment}
                onClearInitialMove={() => setSelectedMoveForPayment(null)}
                onFinishAndReturnToSession={returnToSessionMode ? handleReturnToSession : undefined}
                onSavePartner={handleSavePartner}
                onSaveProduct={handleSaveProduct}
                company={company}
                partnerReductions={partnerReductions}
                hasActiveSession={hasActiveSession}
                onNavigateToSessions={() => setCurrentView('caisse_sessions')}
                onRequestOpenSession={() => setForceOpenSessionModal(true)}
                tillSessions={tillSessions}
                onShowToast={showToast}
                onNavigateToLab={() => setCurrentView('lab_sampling')}
                stateFilter={
                  ['factures_draft', 'caisse_facture_draft'].includes(currentView)
                    ? 'draft'
                    : ['factures_cancelled', 'caisse_facture_cancelled'].includes(currentView)
                    ? 'cancel'
                    : invoiceStateFilter
                }
                setStateFilter={setInvoiceStateFilter}
                paymentFilter={
                  ['factures_paid', 'caisse_facture_paid'].includes(currentView)
                    ? 'paid'
                    : ['factures_unpaid', 'caisse_facture_unpaid'].includes(currentView)
                    ? 'not_paid'
                    : invoicePaymentFilter
                }
                setPaymentFilter={setInvoicePaymentFilter}
              />
            )}

            {(currentView === 'lab_results' || currentView === 'labo_in_progress' || currentView === 'labo_results') && (
              <LabResultsView
                labOrders={labOrders}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onSaveLabOrder={handleSaveLabOrder}
                onDeleteLabOrder={handleDeleteLabOrder}
              />
            )}

            {(currentView === 'lab_sampling' || currentView === 'labo_sampling') && (
              <LabSamplingView
                labOrders={labOrders}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onSaveLabOrder={handleSaveLabOrder}
                onRefreshData={() => fetchAllData()}
              />
            )}

            {(currentView === 'lab_grouped_results' || currentView === 'labo_validation') && (
              <LabGroupedResultsView
                labOrders={labOrders}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onSaveLabOrder={handleSaveLabOrder}
                onRefreshData={() => fetchAllData()}
              />
            )}

            {(currentView === 'payments' ||
              currentView === 'caisse_payments' ||
              currentView === 'caisse_new_payment' ||
              currentView === 'caisse_facture_all_payments' ||
              currentView === 'caisse_facture_new_payment' ||
              currentView === 'superviseur_payments') && (
              <PaymentsView
                payments={payments}
                moves={moves}
                partners={partners}
                currentUser={currentUser}
                onRegisterPayment={handleRegisterPayment}
                selectedMoveForPayment={selectedMoveForPayment}
                onClearSelectedMove={() => {
                  setSelectedMoveForPayment(null);
                  setAutoOpenPaymentModal(false);
                }}
                autoOpenModal={autoOpenPaymentModal}
                onFinishAndReturnToSession={returnToSessionMode ? handleReturnToSession : undefined}
                company={company}
                onNavigateToTriage={() => setCurrentView('infirmier_triage')}
                onNavigateToLab={() => setCurrentView('lab_sampling')}
                onNavigateToSoins={() => setCurrentView('infirmier_care')}
                onShowToast={showToast}
                hasActiveSession={hasActiveSession}
                onNavigateToSessions={() => setCurrentView('caisse_sessions')}
                onBackToInvoices={() => setCurrentView('invoices')}
                onRequestOpenSession={() => setForceOpenSessionModal(true)}
              />
            )}

            {(currentView === 'caisse_sessions' ||
              currentView === 'caisse_facture_sessions') && (
              <CaisseSessionsView
                company={company}
                currentUser={currentUser}
                moves={moves}
                tillSessions={tillSessions}
                onSessionChange={fetchAllData}
                onRefreshData={fetchAllData}
                onShowToast={showToast}
                onNavigateToLab={() => setCurrentView('lab_sampling')}
                onBackToInvoices={() => setCurrentView('invoices')}
                onBackToDashboard={() => setCurrentView('dashboard')}
                onRequestOpenSession={() => setForceOpenSessionModal(true)}
                onOpenNewInvoice={async () => {
                  await fetchAllData();
                  setMoveTypeFilter('out_invoice');
                  setAutoOpenInvoiceCreate(true);
                  setReturnToSessionMode(false);
                  setCurrentView('invoices');
                }}
                onOpenNewPayment={async () => {
                  await fetchAllData();
                  setAutoOpenPaymentModal(true);
                  setReturnToSessionMode(false);
                  setCurrentView('payments');
                }}
                onPayInvoice={handlePayInvoice}
                onSessionClosed={(code) => {
                  setClosedSessionCodeForSuccess(code);
                  setShowSessionClosedSuccessModal(true);
                  setForceOpenSessionModal(false);
                }}
              />
            )}

            {currentView === 'superviseur_sessions' && (
              <SuperviseurSessionsView
                currentView={currentView}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                partners={partners}
                company={company}
                currentUser={currentUser}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {(currentView === 'caisse_cloture' || currentView === 'caisse_facture_cloture') && (
              <CaisseClotureView
                currentView={currentView}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                partners={partners}
                company={company}
                currentUser={currentUser}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
              />
            )}

            {currentView === 'insurance_claims' && (
              <InsuranceClaimsView
                moves={moves}
                partners={partners}
                company={company}
                currentUser={currentUser}
                onOpenPdf={(move) => setPdfMove(move)}
                onRegisterPayment={async (p) => {
                  const res = await handleRegisterPayment(p);
                  await fetchAllData();
                  return res;
                }}
                onNavigateToInvoices={() => setCurrentView('invoices')}
              />
            )}

            {(currentView === 'partners' || currentView === 'specialiste_patients') && (
              <PartnersView
                partners={partners}
                countries={countries}
                onSavePartner={async (partnerData) => {
                  await handleSavePartner(partnerData);
                }}
                onDeletePartner={handleDeletePartner}
                partnerReductions={partnerReductions}
                onSaveReduction={handleSavePartnerReduction}
                onDeleteReduction={handleDeletePartnerReduction}
              />
            )}

            {(currentView === 'consultations' ||
              currentView === 'medecin_consultations' ||
              currentView === 'specialiste_consultations') && (
              <ConsultationsView
                company={company}
                partners={partners}
                products={products}
                currentUser={currentUser}
                initialConsultation={selectedConsultation}
                onSelectConsultation={(c) => setSelectedConsultation(c)}
                onClearInitialConsultation={() => setSelectedConsultation(null)}
                onShowToast={showToast}
                onNavigateToInvoices={() => setCurrentView('invoices')}
                onNavigateToLab={() => setCurrentView('lab_sampling')}
              />
            )}

            {currentView === 'specialiste_followup' && (
              <SpecialisteFollowupTableView
                currentView={currentView}
                consultations={consultations}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {(currentView === 'patient_dossiers' || currentView === 'medecin_dossiers') && (
              <PatientDossiersDirectoryView
                partners={partners}
                moves={moves}
                labOrders={labOrders}
                company={company}
                onOpenPdf={(m) => setPdfMove(m)}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {(currentView === 'products' || currentView === 'admin_pricing' || currentView === 'labo_catalog') && (
              <ProductsView
                products={products}
                uoms={uoms}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onRefreshProducts={fetchAllData}
              />
            )}

            {(currentView === 'users' || currentView === 'admin_users') && (
              <UsersView
                users={users}
                groups={groups}
                partners={partners}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSaveGroup={handleSaveGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}

            {currentView === 'admin_services' && (
              <AdminServicesManagementView
                currentView={currentView}
                users={users}
                groups={groups}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onSaveCompany={handleSaveCompany}
                onShowToast={showToast}
              />
            )}

            {currentView === 'admin_roles' && (
              <AdminRolesTableView
                currentView={currentView}
                users={users}
                groups={groups}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onSaveCompany={handleSaveCompany}
                onShowToast={showToast}
              />
            )}

            {currentView === 'admin_permissions' && (
              <AdminPermissionsTableView
                currentView={currentView}
                users={users}
                groups={groups}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onSaveCompany={handleSaveCompany}
                onShowToast={showToast}
              />
            )}

            {(currentView === 'company' || currentView === 'admin_company') && (
              <CompanySettingsView
                company={company}
                onSaveCompany={handleSaveCompany}
              />
            )}

            {currentView === 'admin_medical_settings' && (
              <AdminMedicalSettingsTableView
                currentView={currentView}
                users={users}
                groups={groups}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onSaveCompany={handleSaveCompany}
                onShowToast={showToast}
              />
            )}

            {currentView === 'flash_announcements' && (
              <FlashAnnouncementsView
                company={company}
                setCompany={setCompany}
                onSaveCompany={handleSaveCompany}
                currentUser={currentUser}
              />
            )}

            {currentView === 'notifications' && (
              <NotificationsView
                notifications={notifications || []}
                company={company}
                overdueMoves={(moves || []).filter(
                  (m) =>
                    m &&
                    m.state === 'posted' &&
                    m.amount_residual > 0 &&
                    m.invoice_date_due &&
                    m.invoice_date_due < new Date().toISOString().split('T')[0]
                )}
                onSendReminder={handleSendReminder}
              />
            )}

            {currentView === 'alert_settings' && (
              <AlertsManagementView
                currentUser={currentUser}
                onShowToast={showToast}
                onAddTestNotification={(notif) => {
                  const newNotif: AppNotification = {
                    id: `notif-test-${Date.now()}`,
                    title: notif.title || 'Alerte Système',
                    message: notif.message || 'Notification de test',
                    category: notif.category || 'urgency',
                    priority: notif.priority || 'normal',
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                    patientName: notif.patientName,
                    patientNdm: notif.patientNdm,
                    actionView: notif.actionView,
                  };
                  setAppNotifications((prev) => [newNotif, ...prev]);
                }}
              />
            )}

            {(currentView === 'logs_audit' || currentView === 'admin_audit') && (
              <LogsAuditView
                company={company}
                currentUser={currentUser}
                labOrders={labOrders}
              />
            )}

            {currentView === 'schema' && (
              <SchemaErdView
                rawSql={schemaSql}
                tables={schemaTables}
                onExecuteSql={handleExecuteSql}
              />
            )}

            {currentView === 'appointments' && (
              <AppointmentsView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {(currentView === 'bed_management' || currentView === 'hospit_beds') && (
              <BedManagementView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'hospit_transfers' && (
              <HospitalTransfersView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'letters_referrals' && (
              <LettersReferralsView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {(currentView === 'care_plans' || currentView === 'hospit_monitoring') && (
              <CarePlansView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'transmissions' && (
              <TransmissionsView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'nurse_schedule' && (
              <NurseScheduleView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'surgery_theater' && (
              <SurgeryTheaterView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {(currentView === 'imaging_pacs' || currentView === 'imagerie_validation') && (
              <ImagingPacsView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {(currentView === 'pharmacy_dispensing' ||
              currentView === 'pharmacy_stock' ||
              currentView === 'pharmacy_orders' ||
              currentView === 'pharmacy_expired' ||
              currentView === 'pharmacy_narcotics' ||
              currentView === 'pharmacy_sales' ||
              currentView === 'pharmacy_settings') && (
              <PharmacyView
                currentUser={currentUser}
                partners={partners}
                products={products}
                currentSubView={currentView}
                onNavigateToView={setCurrentView}
                onShowToast={showToast}
                onAddNotification={(notif) => {
                  const newNotif: AppNotification = {
                    id: `notif-pharm-${Date.now()}`,
                    title: notif.title || 'Notification Pharmacie',
                    message: notif.message || 'Information pharmacie',
                    category: 'pharmacy',
                    priority: notif.priority || 'normal',
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                    patientName: notif.patientName,
                    patientNdm: notif.patientNdm,
                    actionView: notif.actionView || 'pharmacy_dispensing',
                  };
                  setAppNotifications((prev) => [newNotif, ...prev]);
                }}
              />
            )}

            {currentView === 'sterilization_log' && (
              <SterilizationLogView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'quality_vigilance' && (
              <QualityVigilanceView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {currentView === 'hr_management' && (
              <HrManagementView
                partners={partners}
                currentUser={currentUser}
              />
            )}

            {/* Scénarios Hospitaliers S01 à S50 & Règles R01 à R10 */}
            {currentView === 'scenarios_s01_s50' && (
              <HospitalScenariosView
                onNavigateToView={(v) => setCurrentView(v as AppView)}
                currentUserId={currentUser?.id}
                currentUserName={currentUser?.name}
                onSelectPatient={(p) => {
                  setLookupPatient(p);
                  setIsLookupOpen(true);
                }}
              />
            )}

            {/* Parcours Patient 360° Unifié */}
            {currentView === 'patient_journey' && (
              <PatientJourneyView
                partners={partners}
                invoices={moves}
                payments={payments}
                consultations={consultations}
                company={company}
                currentUser={currentUser}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
                onShowToast={showToast}
              />
            )}

            {/* Workspaces Métier Infirmier */}
            {currentView === 'infirmier_queue' && (
              <InfirmierQueueTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'infirmier_triage' && (
              <InfirmierTriageTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'infirmier_vitals' && (
              <InfirmierVitalsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'infirmier_care' && (
              <InfirmierCareTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'infirmier_prescriptions' && (
              <InfirmierPrescriptionsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'infirmier_referred' && (
              <InfirmierReferredTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {/* Workspaces Métier Médecin & Spécialiste */}
            {currentView === 'medecin_queue' && (
              <MedecinQueueTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                moves={moves}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onSelectConsultation={(c) => {
                  setSelectedConsultation(c);
                  setCurrentView('medecin_consultations');
                }}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {(currentView === 'medecin_prescriptions' || currentView === 'specialiste_prescriptions') && (
              <MedecinPrescriptionsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                moves={moves}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'specialiste_referred' && (
              <SpecialisteReferredTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onRefreshData={fetchAllData}
                onSelectConsultation={(c) => {
                  setSelectedConsultation(c);
                  setCurrentView('specialiste_consultations');
                }}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {/* Workspaces Métier Laboratoire */}
            {currentView === 'labo_queue' && (
              <LaboQueueTableView
                currentView={currentView}
                labOrders={labOrders}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
              />
            )}

            {currentView === 'labo_in_progress' && (
              <LaboInProgressTableView
                currentView={currentView}
                labOrders={labOrders}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
              />
            )}

            {/* Workspaces Métier Imagerie */}
            {currentView === 'imagerie_queue' && (
              <ImagerieQueueTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'imagerie_scheduled' && (
              <ImagerieScheduledTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {(currentView === 'imagerie_reports' || currentView === 'imagerie_completed' || currentView === 'imagerie_validation') && (
              <ImagerieReportsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'imagerie_prescriptions' && (
              <ImageriePrescriptionsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {/* Workspaces Métier Hospitalisation */}
            {currentView === 'hospit_admissions' && (
              <HospitAdmissionsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'hospit_patients' && (
              <HospitPatientsTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'hospit_discharges' && (
              <HospitDischargesTableView
                currentView={currentView}
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {/* Workspaces Métier Superviseur */}
            {currentView === 'superviseur_caisses' && (
              <SuperviseurCaissesView
                currentView={currentView}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                partners={partners}
                company={company}
                currentUser={currentUser}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {(currentView === 'superviseur_reports' || currentView === 'admin_reports') && (
              <SuperviseurReportsView
                currentView={currentView}
                moves={moves}
                payments={payments}
                tillSessions={tillSessions}
                partners={partners}
                company={company}
                currentUser={currentUser}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {/* Pôle Pédiatrie & Santé Infantile */}
            {currentView === 'pediatrie_dashboard' && (
              <PediatrieDashboardView
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'pediatrie_queue' && (
              <PediatrieQueueView
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
                onShowToast={showToast}
              />
            )}

            {currentView === 'pediatrie_consultations' && (
              <PediatrieConsultationsView
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
                onShowToast={showToast}
                onCreateInvoice={async (partnerId, items, note) => {
                  setMoveTypeFilter('out_invoice');
                  setCurrentView('invoices');
                }}
              />
            )}

            {currentView === 'pediatrie_vaccination' && (
              <PediatrieVaccinationView
                partners={partners}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onShowToast={showToast}
              />
            )}

            {currentView === 'pediatrie_croissance' && (
              <PediatrieCroissanceView
                partners={partners}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onShowToast={showToast}
              />
            )}

            {/* Pôle Maternité & Obstétrique */}
            {currentView === 'maternite_dashboard' && (
              <MaterniteDashboardView
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'maternite_cpn' && (
              <MaterniteCpnView
                partners={partners}
                consultations={consultations}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onRefreshData={fetchAllData}
                onShowToast={showToast}
              />
            )}

            {currentView === 'maternite_accouchements' && (
              <MaterniteAccouchementView
                partners={partners}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onShowToast={showToast}
              />
            )}

            {currentView === 'maternite_partogramme' && (
              <MaternitePartogrammeView
                partners={partners}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onShowToast={showToast}
              />
            )}

            {currentView === 'maternite_postpartum' && (
              <MaternitePostpartumView
                partners={partners}
                currentUser={currentUser}
                company={company}
                onNavigateToView={(v) => setCurrentView(v)}
                onShowToast={showToast}
              />
            )}
              </>
            )}
            </motion.div>
          </AnimatePresence>
          </>
        )}
      </main>

      {/* Printable / Preview PDF Modal */}
      {pdfMove && (
        <InvoicePdfModal
          move={pdfMove}
          company={company}
          onClose={() => setPdfMove(null)}
          onSendEmail={(mId) => {
            handleSendReminder(mId);
            setPdfMove(null);
          }}
          onOpenPaymentModal={(m) => {
            setPdfMove(null);
            handleOpenPaymentModal(m);
          }}
        />
      )}

      {/* Global Patient Dossier Medical and Billing History Lookup */}
      {isLookupOpen && lookupPatient && (
        <PatientDossierModal
          isOpen={isLookupOpen}
          onClose={() => {
            setIsLookupOpen(false);
            setLookupPatient(null);
          }}
          patient={lookupPatient}
          moves={moves}
          labOrders={labOrders}
          consultations={consultations}
          company={company}
          onOpenPdf={(move) => setPdfMove(move)}
          onNavigateToView={(view) => {
            setIsLookupOpen(false);
            setCurrentView(view);
          }}
        />
      )}

      {/* Floating Inactivity Warning Banner */}
      <AnimatePresence>
        {inactivityWarningSeconds !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[110] max-w-md bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-amber-500/50 flex items-start space-x-3.5"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Alerte Inactivité
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black">
                  {inactivityWarningSeconds}s
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Par mesure de confidentialité médicale, votre session sera verrouillée dans{' '}
                <strong className="text-amber-400 font-mono">{inactivityWarningSeconds} secondes</strong>.
              </p>
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={resetActivity}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-md transition shadow-xs cursor-pointer"
                >
                  Prolonger ma session
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern, friendly and reassuring Session Closed Success Modal */}
      <AnimatePresence>
        {showSessionClosedSuccessModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-slate-150 relative overflow-hidden"
            >
              {/* Decorative background shape */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-rose-500" />
              
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Session Clôturée avec Succès
                </h3>
                {closedSessionCodeForSuccess && (
                  <p className="font-mono text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md inline-block">
                    {closedSessionCodeForSuccess}
                  </p>
                )}
                <p className="text-xs text-slate-500 leading-relaxed pt-2">
                  Votre vacation de caisse est désormais fermée. Les opérations financières de facturation, encaissement, et les accès aux sous-menus ont été verrouillés en toute sécurité pour votre compte.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Le PV de clôture (Bordereau Z) a été généré avec succès. Vous pouvez l'imprimer depuis l'écran de gestion des sessions.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionClosedSuccessModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-98 cursor-pointer"
                >
                  D'accord, fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Toast Notifications Container with smooth motion transitions */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl border backdrop-blur-sm flex items-start space-x-3 transition ${
                toast.type === 'success'
                  ? 'bg-slate-900/95 text-white border-slate-700/80'
                  : toast.type === 'error'
                  ? 'bg-rose-900/95 text-white border-rose-700/80'
                  : toast.type === 'warning'
                  ? 'bg-amber-900/95 text-white border-amber-700/80'
                  : 'bg-indigo-950/95 text-white border-indigo-700/80'
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {toast.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {toast.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                {toast.type === 'warning' && (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                {toast.type === 'info' && (
                  <Info className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-90 mb-0.5">
                    {toast.title}
                  </div>
                )}
                <div className="text-xs font-semibold leading-snug">
                  {toast.text}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-white/60 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
