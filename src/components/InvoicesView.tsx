import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Send,
  CreditCard,
  Printer,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  X,
  Building2,
  Calendar,
  MessageSquare,
  User,
  ShoppingBag,
  ShieldCheck,
  Percent,
  HeartHandshake,
  Coins,
  ArrowRight,
  ArrowLeft,
  Activity,
  Check,
  RotateCcw,
  Sparkles,
  Stethoscope,
  FlaskConical,
  BadgeCheck,
  Receipt,
  Wallet,
  CheckCheck,
  UserPlus,
  Lock,
  Shield,
} from 'lucide-react';
import {
  AccountMove,
  ResPartner,
  ResUser,
  ProductProduct,
  AccountTax,
  MoveType,
  LabExamOrder,
  CompanySettings,
  PartnerReduction,
  MedicalConsultation,
} from '../types';
import {
  getStoredConventions,
  getStoredConsultationTypes,
  getStoredPatientFieldsConfig,
  EnterpriseConvention,
  HospitalConsultationType,
  PatientFieldConfig,
} from '../data/conventionsData';
import { formatFCFA, getUserBillingProfile } from '../lib/formatters';
import { PaginationControls } from './PaginationControls';
import { SupervisorCorrectionModal } from './CaisseSessionGuard';
import { logFinancialCorrection, isSupervisorOrAdmin } from '../utils/caisseSessionService';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY, isDateToday } from '../utils/dateUtils';

export type InvoiceStep = 1 | 2 | 3;

interface InvoicesViewProps {
  moves: AccountMove[];
  partners: ResPartner[];
  users: ResUser[];
  products: ProductProduct[];
  taxes: AccountTax[];
  currentUser?: ResUser | null;
  onSaveMove: (moveData: any) => Promise<any>;
  onPostMove: (moveId: number) => Promise<any>;
  onCancelMove: (moveId: number) => Promise<void>;
  onDeleteMove: (moveId: number) => Promise<void>;
  onOpenPdf: (move: AccountMove) => void;
  onOpenPaymentModal: (move: AccountMove) => void;
  onRegisterPayment?: (paymentData: any) => Promise<void>;
  onSaveLabOrder?: (orderData: Partial<LabExamOrder>) => Promise<void>;
  onSendReminder: (moveId: number) => void;
  moveTypeFilter: MoveType;
  setMoveTypeFilter: (type: MoveType) => void;
  autoOpenCreate?: boolean;
  initialMove?: AccountMove | null;
  onClearInitialMove?: () => void;
  onFinishAndReturnToSession?: () => void;
  onSavePartner?: (partnerData: any) => Promise<any>;
  onSaveProduct?: (productData: any) => Promise<any>;
  company: CompanySettings;
  partnerReductions?: PartnerReduction[];
  hasActiveSession?: boolean;
  onNavigateToSessions?: () => void;
  onRequestOpenSession?: () => void;
  tillSessions?: any[];
  onShowToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  onNavigateToLab?: () => void;
  consultations?: MedicalConsultation[];
  stateFilter?: string;
  setStateFilter?: (s: string) => void;
  paymentFilter?: string;
  setPaymentFilter?: (s: string) => void;
  currentView?: string;
  onNavigateToView?: (view: any) => void;
  initialPartner?: ResPartner | null;
  onClearInitialPartner?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  moves = [],
  partners = [],
  users = [],
  products = [],
  taxes = [],
  consultations = [],
  currentUser = null,
  onSaveMove,
  onPostMove,
  onCancelMove,
  onDeleteMove,
  onOpenPdf,
  onOpenPaymentModal,
  onRegisterPayment,
  onSaveLabOrder,
  moveTypeFilter,
  setMoveTypeFilter,
  autoOpenCreate,
  initialMove,
  onClearInitialMove,
  initialPartner,
  onClearInitialPartner,
  onFinishAndReturnToSession,
  onSavePartner,
  onSaveProduct,
  company,
  partnerReductions = [],
  hasActiveSession = true,
  onNavigateToSessions,
  onRequestOpenSession,
  tillSessions = [],
  onShowToast,
  onNavigateToLab,
  stateFilter: externalStateFilter,
  setStateFilter: setExternalStateFilter,
  paymentFilter: externalPaymentFilter,
  setPaymentFilter: setExternalPaymentFilter,
  currentView,
  onNavigateToView,
}) => {
  const notify = (
    text: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'warning',
    title?: string
  ) => {
    if (onShowToast) {
      onShowToast(text, type, title);
    } else {
      console.log(`[Notification ${type}]: ${text}`);
    }
  };
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalStateFilter, setInternalStateFilter] = useState<string>('all');
  const [internalPaymentFilter, setInternalPaymentFilter] = useState<string>('all');

  const stateFilter = externalStateFilter || internalStateFilter;
  const setStateFilter = setExternalStateFilter || setInternalStateFilter;
  const paymentFilter = externalPaymentFilter || internalPaymentFilter;
  const setPaymentFilter = setExternalPaymentFilter || setInternalPaymentFilter;
  const [showRequireSessionModal, setShowRequireSessionModal] = useState(false);
  const [isSessionWarningDismissed, setIsSessionWarningDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('invoice_session_warning_dismissed') === 'true';
    }
    return false;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company.default_page_size || 50);

  // Form Modal & Step State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<InvoiceStep>(1);
  const [editingMove, setEditingMove] = useState<AccountMove | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
    setEditingMove(null);
    if (onClearInitialMove) {
      onClearInitialMove();
    }
    if ((currentView === 'factures_new_invoice' || currentView === 'caisse_facture_new_invoice') && onNavigateToView) {
      onNavigateToView('factures_all');
    }
  };

  useEffect(() => {
    if (autoOpenCreate || currentView === 'factures_new_invoice' || currentView === 'caisse_facture_new_invoice') {
      handleOpenCreateModal(true);
    }
  }, [autoOpenCreate, currentView]);

  // Synchronize internal and external filter state based on current submenu
  useEffect(() => {
    if (currentView === 'factures_draft' || currentView === 'caisse_facture_draft') {
      setInternalStateFilter('draft');
      setInternalPaymentFilter('all');
      if (setExternalStateFilter) setExternalStateFilter('draft');
      if (setExternalPaymentFilter) setExternalPaymentFilter('all');
    } else if (currentView === 'factures_paid' || currentView === 'caisse_facture_paid') {
      setInternalStateFilter('all');
      setInternalPaymentFilter('paid');
      if (setExternalStateFilter) setExternalStateFilter('all');
      if (setExternalPaymentFilter) setExternalPaymentFilter('paid');
    } else if (currentView === 'factures_unpaid' || currentView === 'caisse_facture_unpaid') {
      setInternalStateFilter('all');
      setInternalPaymentFilter('not_paid');
      if (setExternalStateFilter) setExternalStateFilter('all');
      if (setExternalPaymentFilter) setExternalPaymentFilter('not_paid');
    } else if (currentView === 'factures_cancelled' || currentView === 'caisse_facture_cancelled') {
      setInternalStateFilter('cancel');
      setInternalPaymentFilter('all');
      if (setExternalStateFilter) setExternalStateFilter('cancel');
      if (setExternalPaymentFilter) setExternalPaymentFilter('all');
    } else if (currentView === 'factures_all' || currentView === 'invoices' || currentView === 'caisse_facture_all_invoices') {
      setInternalStateFilter('all');
      setInternalPaymentFilter('all');
      if (setExternalStateFilter) setExternalStateFilter('all');
      if (setExternalPaymentFilter) setExternalPaymentFilter('all');
    }
  }, [currentView]);

  useEffect(() => {
    if (initialMove) {
      handleOpenEditModal(initialMove);
    }
  }, [initialMove]);

  useEffect(() => {
    if (initialPartner) {
      handleOpenCreateModal(true);
      setPartnerId(initialPartner.id);
      setPartnerNameInput(initialPartner.name);
      if (initialPartner.phone) setPatientPhone(initialPartner.phone);
      if (initialPartner.ndm) setNdm(initialPartner.ndm);
      if (initialPartner.age) setPatientAgeY(initialPartner.age);
      if (initialPartner.gender) setNewPatientGender(initialPartner.gender as any);
      if (onClearInitialPartner) {
        onClearInitialPartner();
      }
    }
  }, [initialPartner]);

  // Safe In-App Delete Modal State
  const [moveToDelete, setMoveToDelete] = useState<AccountMove | null>(null);
  const [supervisorCorrectionTarget, setSupervisorCorrectionTarget] = useState<AccountMove | null>(null);

  const profile = getUserBillingProfile(currentUser);
  const isSupervisor = isSupervisorOrAdmin(currentUser) || profile === 'superviseur';
  const isCashier = profile === 'caisse' || profile === 'facture_caisse' || isSupervisor;
  const isCashierOnly = profile === 'caisse' && !isSupervisor;
  const isBiller = profile === 'facture' || profile === 'facture_caisse' || isSupervisor;
  const isReadOnlyForm = Boolean(editingMove?.state === 'posted' && !isSupervisor);

  // Billing view tabs: Invoices Register vs Pending Medical Prescriptions
  const [billingViewTab, setBillingViewTab] = useState<'invoices' | 'prescriptions'>('invoices');
  const [selectedConsultationForInvoice, setSelectedConsultationForInvoice] = useState<MedicalConsultation | null>(null);
  const [prescriptionsSearch, setPrescriptionsSearch] = useState('');

  // --- Step 1: Facturation (Interface Unique Complète) ---
  const [invoiceCategory, setInvoiceCategory] = useState<'exam' | 'consultation'>('consultation');
  
  // Dynamic Consultation State
  const [storedConsultationTypes, setStoredConsultationTypes] = useState<HospitalConsultationType[]>(getStoredConsultationTypes());
  const [selectedConsultationPole, setSelectedConsultationPole] = useState<string>('all');
  const [selectedConsultationTypeId, setSelectedConsultationTypeId] = useState<string>('c_gen_jour');
  const [consultationSearchQuery, setConsultationSearchQuery] = useState<string>('');
  const [consultationType, setConsultationType] = useState<string>('c_gen_jour');
  const [consultationDoctorId, setConsultationDoctorId] = useState<number | null>(null);

  // Dynamic Conventions & Third-Party Payers
  const [storedConventions, setStoredConventions] = useState<EnterpriseConvention[]>(getStoredConventions());
  const [selectedConventionId, setSelectedConventionId] = useState<string>('');

  // Dynamic Patient Form Configuration
  const [storedPatientFieldsConfig, setStoredPatientFieldsConfig] = useState<PatientFieldConfig[]>(getStoredPatientFieldsConfig());

  // Patient Autocomplete & Disambiguation Popovers
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isNdmDropdownOpen, setIsNdmDropdownOpen] = useState(false);

  // Synchronize state when admin backoffice updates settings
  useEffect(() => {
    const handleConventionsUpdated = (e: any) => {
      if (e.detail) setStoredConventions(e.detail);
      else setStoredConventions(getStoredConventions());
    };
    const handleConsultationsUpdated = (e: any) => {
      if (e.detail) setStoredConsultationTypes(e.detail);
      else setStoredConsultationTypes(getStoredConsultationTypes());
    };
    const handleFieldsUpdated = (e: any) => {
      if (e.detail) setStoredPatientFieldsConfig(e.detail);
      else setStoredPatientFieldsConfig(getStoredPatientFieldsConfig());
    };

    window.addEventListener('app_conventions_updated', handleConventionsUpdated);
    window.addEventListener('app_consultation_types_updated', handleConsultationsUpdated);
    window.addEventListener('app_patient_fields_updated', handleFieldsUpdated);

    return () => {
      window.removeEventListener('app_conventions_updated', handleConventionsUpdated);
      window.removeEventListener('app_consultation_types_updated', handleConsultationsUpdated);
      window.removeEventListener('app_patient_fields_updated', handleFieldsUpdated);
    };
  }, []);

  const [partnerId, setPartnerId] = useState<number>(partners[0]?.id || 1);
  const [partnerNameInput, setPartnerNameInput] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [prescribingDoctor, setPrescribingDoctor] = useState<string>('');
  const [ref, setRef] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDateDue, setInvoiceDateDue] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [invoiceUserId, setInvoiceUserId] = useState<number>(users[0]?.id || 1);

  // Medical Billing Extension fields matching reference image
  const [ndm, setNdm] = useState<string>('');
  const [patientAgeY, setPatientAgeY] = useState<number>(30);
  const [patientAgeM, setPatientAgeM] = useState<number>(0);
  const [patientAgeD, setPatientAgeD] = useState<number>(0);
  const [medicalService, setMedicalService] = useState<string>('Externe');
  const [cancelReason, setCancelReason] = useState<string>('');

  // Create Patient Modal States (as shown in user image)
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [newPatientNdm, setNewPatientNdm] = useState('');
  const [newPatientLastName, setNewPatientLastName] = useState('');
  const [newPatientFirstName, setNewPatientFirstName] = useState('');
  const [newPatientMaidenName, setNewPatientMaidenName] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'M' | 'F' | 'Autre'>('M');
  const [newPatientBirthDate, setNewPatientBirthDate] = useState('');
  const [newPatientProfession, setNewPatientProfession] = useState('');
  const [newPatientBirthPlace, setNewPatientBirthPlace] = useState('');
  const [newPatientCivilStatus, setNewPatientCivilStatus] = useState('Célibataire');
  const [newPatientNationality, setNewPatientNationality] = useState('');
  const [newPatientReligion, setNewPatientReligion] = useState('');
  const [newPatientRegion, setNewPatientRegion] = useState('');
  const [newPatientProvince, setNewPatientProvince] = useState('');
  const [newPatientDepartment, setNewPatientDepartment] = useState('');
  const [newPatientCommune, setNewPatientCommune] = useState('');
  const [newPatientMobilePhone, setNewPatientMobilePhone] = useState('');
  const [newPatientHomePhone, setNewPatientHomePhone] = useState('');
  const [newPatientCnib, setNewPatientCnib] = useState('');
  const [newPatientClass, setNewPatientClass] = useState('');
  const [newPatientPhoto, setNewPatientPhoto] = useState<string | null>(null);

  // Personne de contact
  const [newPatientContactName, setNewPatientContactName] = useState('');
  const [newPatientContactRelationship, setNewPatientContactRelationship] = useState('');
  const [newPatientContactPhone, setNewPatientContactPhone] = useState('');

  const generateNextNdm = (): string => {
    const prefix = company.ndm_prefix !== undefined ? company.ndm_prefix : 'NDM-';
    const digits = company.ndm_digits !== undefined ? company.ndm_digits : 8;
    const nextNum = company.ndm_next_number !== undefined ? company.ndm_next_number : 270408;
    return prefix + String(nextNum).padStart(digits, '0');
  };

  const openPatientCreationModal = (initialName: string = '', initialNdm: string = '') => {
    const parts = initialName.trim().split(/\s+/);
    const lastName = parts[0] || '';
    const firstName = parts.slice(1).join(' ') || '';

    // Check if patient already exists in database
    const existing = partners.find(
      (p) => p.name.trim().toLowerCase() === initialName.trim().toLowerCase()
    );

    let generatedNdm = initialNdm || existing?.ndm || '';
    if (!generatedNdm) {
      generatedNdm = generateNextNdm();
    }

    setNewPatientNdm(generatedNdm);
    setNewPatientLastName(existing?.first_name ? (lastName || existing.name) : (lastName || existing?.name || ''));
    setNewPatientFirstName(existing?.first_name || firstName);
    setNewPatientMaidenName(existing?.maiden_name || '');
    setNewPatientGender(existing?.gender as any || 'M');
    setNewPatientBirthDate(existing?.birth_date || '');
    setNewPatientProfession(existing?.profession || '');
    setNewPatientBirthPlace(existing?.birth_place || '');
    setNewPatientCivilStatus(existing?.civil_status || 'Célibataire');
    setNewPatientNationality(existing?.nationality || '');
    setNewPatientReligion(existing?.religion || '');
    setNewPatientRegion(existing?.region || '');
    setNewPatientProvince(existing?.province || '');
    setNewPatientDepartment(existing?.department || '');
    setNewPatientCommune(existing?.commune || '');
    setNewPatientMobilePhone(existing?.phone || patientPhone || '');
    setNewPatientHomePhone(existing?.home_phone || '');
    setNewPatientCnib(existing?.cnib || '');
    setNewPatientClass(existing?.patient_class || '');
    setNewPatientContactName(existing?.contact_person_name || '');
    setNewPatientContactRelationship(existing?.contact_person_relationship || '');
    setNewPatientContactPhone(existing?.contact_person_phone || '');
    setNewPatientPhoto(existing?.patient_photo || null);
    setIsCreatePatientOpen(true);
  };

  const handleSaveNewPatient = async () => {
    if (!newPatientLastName.trim()) {
      notify('Le nom de famille du patient est obligatoire.', 'warning', 'Dossier Patient');
      return;
    }
    const fullName = `${newPatientLastName.trim()} ${newPatientFirstName.trim()}`.trim();

    // Match existing patient strictly by NDM or by exact Name + Phone combo to prevent inadvertent name substitution
    const existingPartner = partners.find(
      (p) =>
        (newPatientNdm && p.ndm && p.ndm.trim().toLowerCase() === newPatientNdm.trim().toLowerCase()) ||
        (newPatientMobilePhone && p.name.trim().toLowerCase() === fullName.toLowerCase() && p.phone === newPatientMobilePhone)
    );

    let computedAge = 0;
    if (newPatientBirthDate) {
      const birth = new Date(newPatientBirthDate);
      const today = new Date();
      let ageDiff = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageDiff--;
      }
      computedAge = Math.max(0, ageDiff);
    }

    const partnerData = {
      ...(existingPartner ? { id: existingPartner.id } : {}),
      name: fullName,
      first_name: newPatientFirstName,
      maiden_name: newPatientMaidenName,
      customer_rank: 1,
      supplier_rank: 0,
      partner_type: 'patient',
      phone: newPatientMobilePhone,
      home_phone: newPatientHomePhone,
      gender: newPatientGender,
      birth_date: newPatientBirthDate,
      age: computedAge || undefined,
      ndm: newPatientNdm,
      profession: newPatientProfession,
      birth_place: newPatientBirthPlace,
      civil_status: newPatientCivilStatus,
      nationality: newPatientNationality,
      religion: newPatientReligion,
      region: newPatientRegion,
      province: newPatientProvince,
      department: newPatientDepartment,
      commune: newPatientCommune,
      cnib: newPatientCnib,
      patient_class: newPatientClass,
      contact_person_name: newPatientContactName,
      contact_person_relationship: newPatientContactRelationship,
      contact_person_phone: newPatientContactPhone,
      patient_photo: newPatientPhoto,
    };

    try {
      let savedPartner: any = null;
      if (onSavePartner) {
        savedPartner = await onSavePartner(partnerData);
      } else {
        const res = await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partnerData),
        });
        if (res.ok) {
          savedPartner = await res.json();
        }
      }

      const assignedPartnerId = savedPartner?.id || existingPartner?.id;
      if (assignedPartnerId) {
        setPartnerId(assignedPartnerId);
      }
      setNdm(savedPartner?.ndm || newPatientNdm);
      setPartnerNameInput(savedPartner?.name || fullName);
      setPatientPhone(savedPartner?.phone || newPatientMobilePhone);
      setPatientAgeY(computedAge || 30);
      setPatientAgeM(0);
      setPatientAgeD(0);
      setIsCreatePatientOpen(false);
      notify(
        `Dossier patient #${savedPartner?.ndm || newPatientNdm} (${fullName}) enregistré avec succès !`,
        'success',
        'Dossier Enregistré'
      );
    } catch (e) {
      console.error(e);
      notify("Erreur lors de l'enregistrement du dossier patient.", 'error', 'Erreur Dossier');
    }
  };

  // Insurance & Tiers-Payeur
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insurancePartnerId, setInsurancePartnerId] = useState<number | null>(null);
  const [insuranceName, setInsuranceName] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceCoverageRate, setInsuranceCoverageRate] = useState<number>(80);

  // Analyses / Lignes
  const [lines, setLines] = useState<
    {
      id?: number;
      product_id: number;
      name: string;
      quantity: number;
      price_unit: number;
      discount: number;
      tax_ids: number[];
      tax_rate?: number;
      type?: 'product' | 'section' | 'note';
    }[]
  >([]);

  const [showCatalogue, setShowCatalogue] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [catalogueDept, setCatalogueDept] = useState('all');

  // Autocomplete state for lines
  const [activeLineSearchIndex, setActiveLineSearchIndex] = useState<number | null>(null);
  const [lineSearchQueries, setLineSearchQueries] = useState<{ [key: number]: string }>({});

  // Product Creation Modal
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCode, setNewProductCode] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductDept, setNewProductDept] = useState('Biochimie');
  const [targetLineIndexForProductCreation, setTargetLineIndexForProductCreation] = useState<number | null>(null);

  // Tax Exemption & Fiscal Status (Exonéré 0% médical par défaut)
  const [isTaxExempt, setIsTaxExempt] = useState(true);
  const [taxExemptionReason, setTaxExemptionReason] = useState(
    'Exonération médicale / Actes de biologie médicale'
  );
  const [patientNotes, setPatientNotes] = useState(
    'Présentation à jeun recommandée. Résultats disponibles sous 4 heures.'
  );

  // --- Step 2: Encaissement Caisse State ---
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'wave' | 'orange' | 'moov' | 'card' | 'check' | 'insurance_direct'
  >('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentJournalId, setPaymentJournalId] = useState<number>(2); // 2: Caisse, 1: Banque

  // --- Step 3: Reçu & Plateau Labo State ---
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [labOrderTransmitted, setLabOrderTransmitted] = useState(false);
  const [transmittedLabOrderNumber, setTransmittedLabOrderNumber] = useState('');

  const insurancePartners = partners.filter(
    (p) => p.partner_type === 'insurance' || p.is_insurance
  );

  const getFilteredProducts = (q: string) => {
    // Sort all products alphabetically by name to make navigation standard & structured
    const sorted = [...products].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    if (!q) {
      // Show up to 40 sorted products when focused with no search text (increase from 5 to avoid empty view)
      return sorted.slice(0, 40);
    }
    const searchVal = q.toLowerCase();
    return sorted.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(searchVal)) ||
        (p.default_code && p.default_code.toLowerCase().includes(searchVal)) ||
        (p.lab_department && p.lab_department.toLowerCase().includes(searchVal))
    ).slice(0, 60); // Increase display limit to 60 for better catalog browsing
  };

  // Financial Computations
  const activeConsultationTypeObj = storedConsultationTypes.find(
    (c) => c.id === selectedConsultationTypeId || c.code === consultationType
  ) || storedConsultationTypes[0];

  const computedConsultationPrice = invoiceCategory === 'consultation'
    ? (activeConsultationTypeObj?.price || 10000)
    : 0;

  const computedUntaxed = invoiceCategory === 'consultation'
    ? computedConsultationPrice
    : lines.reduce((acc, l) => {
        if (l.type === 'section' || l.type === 'note') return acc;
        const qty = Number(l.quantity) || 0;
        const pu = Number(l.price_unit) || 0;
        const disc = Number(l.discount) || 0;
        return acc + qty * pu * (1 - disc / 100);
      }, 0);

  const computedTax = isTaxExempt || invoiceCategory === 'consultation'
    ? 0
    : lines.reduce((acc, l) => {
        if (l.type === 'section' || l.type === 'note') return acc;
        const qty = Number(l.quantity) || 0;
        const pu = Number(l.price_unit) || 0;
        const disc = Number(l.discount) || 0;
        const subtotal = qty * pu * (1 - disc / 100);
        const rate =
          l.tax_rate !== undefined
            ? Number(l.tax_rate)
            : l.tax_ids && l.tax_ids.length > 0 && !(l.tax_ids || []).includes(0)
            ? 18
            : 0;
        return acc + (subtotal * rate) / 100;
      }, 0);

  const computedTotal = computedUntaxed + computedTax;

  const computedInsuranceAmount = insuranceEnabled
    ? Math.round((computedTotal * (insuranceCoverageRate || 0)) / 100)
    : 0;

  const computedClientShare = insuranceEnabled
    ? Math.max(0, computedTotal - computedInsuranceAmount)
    : computedTotal;

  // Change Return Calculation for Cash
  const computedChangeReturn = Math.max(0, (cashReceived || 0) - (paymentAmount || 0));

  // Keep payment amount synced with client share
  useEffect(() => {
    if (editingMove?.state === 'posted' && editingMove.amount_residual > 0) {
      setPaymentAmount(editingMove.amount_residual);
      setCashReceived(editingMove.amount_residual);
    } else {
      const net = insuranceEnabled ? computedClientShare : computedTotal;
      setPaymentAmount(net);
      setCashReceived(net);
    }
  }, [lines, isTaxExempt, insuranceEnabled, insuranceCoverageRate, editingMove]);

  const handleSelectPartner = (name: string) => {
    setPartnerNameInput(name);
    const found = partners.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (found) {
      setPartnerId(found.id);
      if (found.phone) setPatientPhone(found.phone);
      if (found.prescribing_doctor) setPrescribingDoctor(found.prescribing_doctor);
      if (found.ndm && found.ndm.trim() !== '') {
        setNdm(found.ndm);
      } else {
        // Patient exists in DB BUT HAS NO NDM DOSSIER NUMBER!
        // Auto-generate next sequential NDM
        const autoNdm = generateNextNdm();
        setNdm(autoNdm);

        // Update existing patient record in database immediately
        if (onSavePartner) {
          onSavePartner({
            ...found,
            ndm: autoNdm,
            phone: patientPhone || found.phone || null,
          });
        }
      }
      if (found.age !== undefined && found.age !== null) {
        setPatientAgeY(found.age);
      } else {
        setPatientAgeY(30);
      }
      setPatientAgeM(0);
      setPatientAgeD(0);
      if (found.insurance_name) {
        setInsuranceEnabled(true);
        setInsuranceName(found.insurance_name);
        setInsurancePolicyNumber(found.insurance_policy_number || '');
        setInsuranceCoverageRate(found.insurance_coverage_rate ?? 80);
        const matchedIns = insurancePartners.find((i) => i.name === found.insurance_name);
        setInsurancePartnerId(matchedIns?.id || null);
      } else {
        setInsuranceEnabled(false);
        setInsurancePartnerId(null);
        setInsuranceName('');
        setInsurancePolicyNumber('');
        setInsuranceCoverageRate(80);
      }
    }
  };

  const handleSelectNdm = (ndmValue: string) => {
    let cleanVal = ndmValue.trim();
    
    // Support parsing structured QR scans directly inside the NDM text field
    if (cleanVal.toLowerCase().includes('dossier:')) {
      const match = cleanVal.match(/dossier:\s*([^|\n]+)/i);
      if (match) {
        cleanVal = match[1].trim();
      }
    }
    
    setNdm(cleanVal);
    
    const targetLower = cleanVal.toLowerCase();
    const targetNumeric = targetLower.replace(/[^0-9]/g, '');

    const found = partners.find((p) => {
      if (!p.ndm) return false;
      const pNdmLower = p.ndm.toLowerCase();
      const pNdmNumeric = pNdmLower.replace(/[^0-9]/g, '');
      
      return (
        pNdmLower === targetLower ||
        pNdmLower.includes(targetLower) ||
        targetLower.includes(pNdmLower) ||
        (pNdmNumeric && targetNumeric && pNdmNumeric === targetNumeric) ||
        (pNdmNumeric && targetNumeric && pNdmNumeric.includes(targetNumeric))
      );
    });

    if (found) {
      // If we matched the patient through a smarter NDM string (e.g. stripping prefix),
      // update the input value to the patient's canonical NDM for consistency.
      if (found.ndm && found.ndm !== cleanVal) {
        setNdm(found.ndm);
      }
      setPartnerId(found.id);
      setPartnerNameInput(found.name);
      if (found.phone) setPatientPhone(found.phone);
      if (found.prescribing_doctor) setPrescribingDoctor(found.prescribing_doctor);
      if (found.age !== undefined && found.age !== null) {
        setPatientAgeY(found.age);
      } else {
        setPatientAgeY(30);
      }
      setPatientAgeM(0);
      setPatientAgeD(0);
      if (found.insurance_name) {
        setInsuranceEnabled(true);
        setInsuranceName(found.insurance_name);
        setInsurancePolicyNumber(found.insurance_policy_number || '');
        setInsuranceCoverageRate(found.insurance_coverage_rate ?? 80);
        const matchedIns = insurancePartners.find((i) => i.name === found.insurance_name);
        setInsurancePartnerId(matchedIns?.id || null);
      } else {
        setInsuranceEnabled(false);
        setInsurancePartnerId(null);
        setInsuranceName('');
        setInsurancePolicyNumber('');
        setInsuranceCoverageRate(80);
      }
    }
  };

  const handleSelectInsurancePartner = (insId: number | null) => {
    setInsurancePartnerId(insId);
    if (!insId) {
      setInsuranceName('');
      return;
    }
    const found = insurancePartners.find((i) => i.id === insId);
    if (found) {
      setInsuranceName(found.name);
      if (found.default_coverage_rate !== undefined) {
        setInsuranceCoverageRate(found.default_coverage_rate);
      }
    }
  };

  const handleOpenCreateModal = (bypass?: boolean | React.MouseEvent) => {
    const bypassSessionCheck = typeof bypass === 'boolean' ? bypass : false;
    const profile = getUserBillingProfile(currentUser);
    if (profile === 'caisse') {
      notify(
        "Accès restreint : Le profil Caissier n'est pas autorisé à établir des factures. Cette action est réservée au profil Facture ou Facture / Caisse.",
        'warning',
        'Accès Restreint'
      );
      return;
    }

    if (!hasActiveSession && !bypassSessionCheck && (profile === 'facture' || profile === 'facture_caisse')) {
      setShowRequireSessionModal(true);
      return;
    }

    setEditingMove(null);
    setCurrentStep(1);
    setPartnerId(null);
    setPartnerNameInput('');
    setPatientPhone('');
    setPrescribingDoctor('');
    setNdm('');
    setPatientAgeY(0);
    setPatientAgeM(0);
    setPatientAgeD(0);
    setMedicalService('Externe');
    setCancelReason('');
    setRef('');
    setInvoiceDate(new Date().toISOString().replace('T', ' ').substring(0, 16));
    setInvoiceDateDue(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setInvoiceUserId(currentUser?.id || 1);
    setIsTaxExempt(true);
    setTaxExemptionReason('Exonération médicale / Actes de biologie médicale');
    setPatientNotes('Présentation à jeun recommandée. Résultats disponibles sous 4 heures.');
    setPaymentSuccess(false);
    setLabOrderTransmitted(false);
    setTransmittedLabOrderNumber('');

    setInsuranceEnabled(false);
    setInsurancePartnerId(null);
    setInsuranceName('');
    setInsurancePolicyNumber('');
    setInsuranceCoverageRate(80);

    // Empty lines by default on new invoice
    setLines([]);
    setInvoiceCategory('consultation');
    setConsultationType('');
    setConsultationDoctorId(null);

    setShowCatalogue(false);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (move: AccountMove) => {
    // Enforce active session for draft creation/editing, but allow consultation of existing validated invoices
    if (!hasActiveSession && (profile === 'caisse' || profile === 'facture_caisse' || profile === 'facture') && !isSupervisor && move.state === 'draft') {
      setShowRequireSessionModal(true);
      return;
    }

    setEditingMove(move);
    if (move.state === 'posted' && move.payment_state === 'paid') {
      setCurrentStep(3);
    } else if (move.state === 'posted' && !isSupervisor && isCashier) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }

    if (move.state === 'posted' && !isSupervisor) {
      notify(
        "Facture déjà éditée et validée (Mode Consultation Seule). Seuls les Superviseurs et Administrateurs sont autorisés à modifier une facture validée.",
        'info',
        'Consultation Facture'
      );
    }

    const currentPartner = partners.find((p) => p.id === move.partner_id);
    setPartnerId(move.partner_id);
    setPartnerNameInput(currentPartner?.name || '');
    setPatientPhone(currentPartner?.phone || '');
    setPrescribingDoctor(currentPartner?.prescribing_doctor || 'Dr. Référent');
    setNdm(move.ndm || currentPartner?.ndm || `NDM-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setPatientAgeY(move.patient_age_y ?? currentPartner?.age ?? 35);
    setPatientAgeM(move.patient_age_m ?? 0);
    setPatientAgeD(move.patient_age_d ?? 0);
    setMedicalService(move.medical_service || 'Externe');
    setCancelReason(move.cancel_reason || '');
    setRef(move.ref || '');
    setInvoiceDate(move.invoice_date || new Date().toISOString().replace('T', ' ').substring(0, 16));
    setInvoiceDateDue(move.invoice_date_due || new Date().toISOString().replace('T', ' ').substring(0, 16));
    setInvoiceUserId(move.invoice_user_id || 1);
    setIsTaxExempt(move.is_tax_exempt ?? true);
    setTaxExemptionReason(move.tax_exemption_reason || 'Exonération médicale / Actes de biologie médicale');
    setInsuranceEnabled(!!move.insurance_enabled);
    setInsuranceName(move.insurance_name || '');
    setInsurancePolicyNumber(move.insurance_policy_number || '');
    setInsuranceCoverageRate(move.insurance_coverage_rate || 80);

    const matchedIns = insurancePartners.find((i) => i.name === move.insurance_name);
    setInsurancePartnerId(matchedIns?.id || null);

    // Detect consultation vs exam category
    const hasConsultLine = move.lines?.some(l => 
      l.product_id === 12 || 
      l.product_id === 991 || 
      l.product_id === 992 || 
      l.product_id === 993 || 
      (l.name && l.name.toLowerCase().includes('consultation'))
    );

    if (hasConsultLine) {
      setInvoiceCategory('consultation');
      const consultLine = move.lines?.find(l => 
        l.product_id === 12 || 
        l.product_id === 991 || 
        l.product_id === 992 || 
        l.product_id === 993 || 
        (l.name && l.name.toLowerCase().includes('consultation'))
      );
      if (consultLine) {
        const lineName = (consultLine.name || '').toLowerCase();
        if (consultLine.product_id === 991 || lineName.includes('infirmier')) {
          setConsultationType('infirmier');
          setConsultationDoctorId(15);
        } else if (consultLine.product_id === 993 || lineName.includes('spécialiste') || lineName.includes('specialiste')) {
          setConsultationType('specialiste');
          setConsultationDoctorId(17);
        } else {
          setConsultationType('generaliste');
          setConsultationDoctorId(16);
        }
      }
    } else {
      setInvoiceCategory('exam');
    }

    if (move.lines && move.lines.length > 0) {
      setLines(
        move.lines.map((l) => ({
          id: l.id,
          product_id: l.product_id || 0,
          name: l.name || '',
          quantity: l.quantity,
          price_unit: l.price_unit,
          discount: l.discount,
          tax_ids: l.tax_ids || (move.is_tax_exempt ? [] : [1]),
          tax_rate: move.is_tax_exempt
            ? 0
            : l.tax_rate ?? (l.tax_ids && l.tax_ids.length > 0 && !(l.tax_ids || []).includes(0) ? 18 : 0),
          type: 'product',
        }))
      );
    } else {
      setLines([]);
    }

    setPaymentSuccess(move.payment_state === 'paid');
    setLabOrderTransmitted(false);
    setTransmittedLabOrderNumber('');
    setShowCatalogue(false);
    setIsFormOpen(true);
  };

  const pendingPrescriptionConsultations = React.useMemo(() => {
    return (consultations || []).filter((c) => {
      const hasItems = c.prescribed_items && c.prescribed_items.length > 0;
      const isInternal = c.patient_choice === 'internal';
      return hasItems || isInternal;
    }).sort((a, b) => {
      const tA = new Date(a.updated_at || a.consultation_date || a.created_at).getTime();
      const tB = new Date(b.updated_at || b.consultation_date || b.created_at).getTime();
      return tB - tA;
    });
  }, [consultations]);

  const filteredPrescriptions = React.useMemo(() => {
    if (!prescriptionsSearch.trim()) return pendingPrescriptionConsultations;
    const q = prescriptionsSearch.toLowerCase();
    return pendingPrescriptionConsultations.filter((c) =>
      (c.patient_name && c.patient_name.toLowerCase().includes(q)) ||
      (c.patient_ndm && c.patient_ndm.toLowerCase().includes(q)) ||
      (c.doctor_name && c.doctor_name.toLowerCase().includes(q)) ||
      (c.consultation_number && c.consultation_number.toLowerCase().includes(q))
    );
  }, [pendingPrescriptionConsultations, prescriptionsSearch]);

  const handleLoadFromConsultation = (c: MedicalConsultation) => {
    setSelectedConsultationForInvoice(c);
    setEditingMove(null);
    setCurrentStep(1);

    const matchedPartner = partners.find(
      (p) =>
        p.id === c.partner_id ||
        (c.patient_ndm && p.ndm === c.patient_ndm) ||
        p.name.toLowerCase() === (c.patient_name || '').toLowerCase()
    );

    setPartnerId(matchedPartner?.id || c.partner_id || null);
    setPartnerNameInput(c.patient_name || matchedPartner?.name || '');
    setPatientPhone(c.patient_phone || matchedPartner?.phone || '');
    setPrescribingDoctor(c.doctor_name || 'Dr. ' + (currentUser?.name || 'Médecin'));
    setNdm(c.patient_ndm || matchedPartner?.ndm || generateNextNdm());
    setPatientAgeY(c.patient_age ?? matchedPartner?.age ?? 30);
    setPatientAgeM(0);
    setPatientAgeD(0);
    setMedicalService(c.specialty || 'Médecine Générale');
    setCancelReason('');
    setRef(`PRESCR:${c.consultation_number || c.id}`);
    setInvoiceDate(new Date().toISOString().replace('T', ' ').substring(0, 16));
    setInvoiceDateDue(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setInvoiceUserId(currentUser?.id || 1);
    setIsTaxExempt(true);
    setTaxExemptionReason('Exonération médicale / Actes et ordonnances internes');
    setPatientNotes(`Prescriptions émises par Dr. ${c.doctor_name} lors de la consultation ${c.consultation_number || ''}`);
    setPaymentSuccess(false);
    setLabOrderTransmitted(false);
    setTransmittedLabOrderNumber('');

    if (c.insurance_name) {
      setInsuranceEnabled(true);
      setInsuranceName(c.insurance_name);
      setInsuranceCoverageRate(c.insurance_coverage_rate ?? 80);
      const matchedIns = insurancePartners.find((i) => i.name.toLowerCase() === c.insurance_name?.toLowerCase());
      setInsurancePartnerId(matchedIns?.id || null);
    } else {
      setInsuranceEnabled(false);
      setInsurancePartnerId(null);
      setInsuranceName('');
      setInsuranceCoverageRate(80);
    }

    setInvoiceCategory('exam');

    if (c.prescribed_items && c.prescribed_items.length > 0) {
      const generatedLines = c.prescribed_items.map((item, idx) => {
        const itemName = (item as any).item_name || item.name || 'Prestation';
        const matched = products.find(
          (p) => p.name.trim().toLowerCase() === itemName.trim().toLowerCase()
        );
        const pu = (item as any).unit_price || item.price_unit || (matched ? matched.list_price : 0) || 5000;
        return {
          id: -(idx + 1),
          product_id: matched ? matched.id : 0,
          name: itemName + (item.dosage ? ` (${item.dosage})` : ''),
          quantity: item.quantity || 1,
          price_unit: pu,
          discount: 0,
          tax_ids: [],
          tax_rate: 0,
          type: 'product' as const,
        };
      });
      setLines(generatedLines);
    } else {
      setLines([]);
    }

    setShowCatalogue(false);
    setIsFormOpen(true);
    notify(
      `Prescriptions du patient ${c.patient_name} importées (${c.prescribed_items?.length || 0} prestations).`,
      'info',
      'Prescriptions Importées'
    );
  };

  const handleCreateProductOnTheFly = async (searchText: string, lineIndex: number) => {
    if (!searchText.trim()) return;
    const cleanSearchText = searchText.trim();
    const generatedCode = cleanSearchText.slice(0, 4).toUpperCase();
    const productData = {
      name: cleanSearchText,
      list_price: 0,
      default_code: generatedCode || `PRD-${Math.floor(100 + Math.random() * 900)}`,
      category_type: 'lab_exam',
    };

    try {
      if (onSaveProduct) {
        await onSaveProduct(productData);
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (res.ok) {
          notify(`Analyse ${cleanSearchText} créée avec succès !`, 'success', 'Nouvelle Prestation');
        }
      }
      
      setTimeout(async () => {
        try {
          const freshRes = await fetch('/api/products');
          if (freshRes.ok) {
            const freshProds = await freshRes.json();
            const created = freshProds.find(
              (p: any) => p.name.toLowerCase() === cleanSearchText.toLowerCase()
            );
            if (created) {
              const updated = [...lines];
              if (updated[lineIndex]) {
                updated[lineIndex].product_id = created.id;
                updated[lineIndex].name = created.name;
                updated[lineIndex].price_unit = created.list_price;
                setLines(updated);
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 500);

      setActiveLineSearchIndex(null);
    } catch (e) {
      console.error(e);
      notify("Erreur lors de la création de l'analyse.", 'error', 'Erreur');
    }
  };

  const handleOpenFullProductModal = (searchText: string, lineIndex: number) => {
    setNewProductName(searchText);
    setNewProductCode(searchText.slice(0, 4).toUpperCase());
    setNewProductPrice(0);
    setNewProductDept('Biochimie');
    setTargetLineIndexForProductCreation(lineIndex);
    setIsCreateProductOpen(true);
    setActiveLineSearchIndex(null);
  };

  const handleSaveFullProduct = async () => {
    if (!newProductName.trim()) {
      notify("Le nom de l'analyse est obligatoire.", 'warning', 'Saisie Incomplète');
      return;
    }
    const productData = {
      name: newProductName.trim(),
      list_price: Number(newProductPrice) || 0,
      default_code: newProductCode.trim() || `PRD-${Math.floor(100 + Math.random() * 900)}`,
      category_type: 'lab_exam',
      lab_department: newProductDept,
    };

    try {
      if (onSaveProduct) {
        await onSaveProduct(productData);
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }

      setIsCreateProductOpen(false);
      notify(`Analyse ${productData.name} enregistrée avec succès !`, 'success', 'Prestation Enregistrée');

      setTimeout(async () => {
        try {
          const freshRes = await fetch('/api/products');
          if (freshRes.ok) {
            const freshProds = await freshRes.json();
            const created = freshProds.find(
              (p: any) => p.name.toLowerCase() === newProductName.trim().toLowerCase()
            );
            if (created && targetLineIndexForProductCreation !== null) {
              const updated = [...lines];
              if (updated[targetLineIndexForProductCreation]) {
                updated[targetLineIndexForProductCreation].product_id = created.id;
                updated[targetLineIndexForProductCreation].name = created.name;
                updated[targetLineIndexForProductCreation].price_unit = created.list_price;
                setLines(updated);
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 500);
    } catch (e) {
      console.error(e);
      notify("Erreur lors de l'enregistrement de l'analyse.", 'error', 'Erreur');
    }
  };

  const handleAddLine = () => {
    const newIdx = lines.length;
    setLines([
      ...lines,
      {
        product_id: 0,
        name: '',
        quantity: 1,
        price_unit: 0,
        discount: 0,
        tax_ids: isTaxExempt ? [] : [1],
        tax_rate: isTaxExempt ? 0 : 18,
        type: 'product',
      },
    ]);
    setActiveLineSearchIndex(newIdx);
  };

  const handleAddProductFromCatalog = (p: ProductProduct) => {
    setLines([
      ...lines,
      {
        product_id: p.id,
        name: p.name || 'Analyse',
        quantity: 1,
        price_unit: p.list_price || 0,
        discount: 0,
        tax_ids: isTaxExempt ? [] : [1],
        tax_rate: isTaxExempt ? 0 : 18,
        type: 'product',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    if (field === 'product_id') {
      const prodId = Number(value);
      updated[index].product_id = prodId;
      if (prodId === 0) {
        if (!updated[index].name) {
          updated[index].name = '';
        }
      } else {
        const prod = products.find((p) => p.id === prodId);
        if (prod) {
          updated[index].name = prod.name || updated[index].name;
          updated[index].price_unit = prod.list_price || updated[index].price_unit;
        }
      }
    } else if (field === 'tax_rate') {
      const rate = Number(value);
      updated[index].tax_rate = rate;
      updated[index].tax_ids = rate > 0 ? [1] : [];
    } else {
      (updated[index] as any)[field] = value;
    }
    setLines(updated);
  };

  const handleToggleTaxExempt = (exempt: boolean) => {
    setIsTaxExempt(exempt);
    setLines(
      lines.map((l) => ({
        ...l,
        tax_rate: exempt ? 0 : 18,
        tax_ids: exempt ? [] : [1],
      }))
    );
  };

  const resolvePartnerId = async (): Promise<number> => {
    const trimmedInput = partnerNameInput.trim();
    if (!trimmedInput) {
      return partnerId || partners[0]?.id || 1;
    }

    // 1. If a partnerId is already chosen in form and its name matches, keep that exact ID
    if (partnerId) {
      const explicit = partners.find((p) => p.id === partnerId);
      if (explicit && explicit.name.trim().toLowerCase() === trimmedInput.toLowerCase()) {
        return explicit.id;
      }
    }

    // 2. Search by NDM first (most stable unique medical identifier)
    if (ndm && ndm.trim()) {
      const matchedByNdm = partners.find(
        (p) => p.ndm && p.ndm.trim().toLowerCase() === ndm.trim().toLowerCase()
      );
      if (matchedByNdm) {
        return matchedByNdm.id;
      }
    }

    // 3. Search by exact name
    const matched = partners.find(
      (p) => p.name.trim().toLowerCase() === trimmedInput.toLowerCase()
    );
    if (matched) {
      // If matched patient exists in DB but has no NDM, update them with form NDM
      if ((!matched.ndm || matched.ndm.trim() === '') && ndm && ndm.trim() !== '') {
        try {
          if (onSavePartner) {
            await onSavePartner({
              ...matched,
              ndm: ndm.trim(),
              phone: patientPhone || matched.phone || null,
            });
          } else {
            await fetch('/api/partners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...matched,
                ndm: ndm.trim(),
                phone: patientPhone || matched.phone || null,
              }),
            });
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour du dossier NDM patient :", err);
        }
      }
      return matched.id;
    }

    // 4. Create new patient partner
    try {
      const partnerPayload = {
        name: trimmedInput,
        phone: patientPhone || null,
        prescribing_doctor: prescribingDoctor || null,
        ndm: ndm || generateNextNdm(),
        is_company: false,
        partner_type: 'patient',
        customer_rank: 1,
        supplier_rank: 0,
      };

      let newPartner: any = null;
      if (onSavePartner) {
        newPartner = await onSavePartner(partnerPayload);
      } else {
        const res = await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partnerPayload),
        });
        if (res.ok) {
          newPartner = await res.json();
        }
      }

      if (newPartner?.id) {
        setPartnerId(newPartner.id);
        return newPartner.id;
      }
    } catch (e) {
      console.error('Erreur création client :', e);
    }
    return partnerId || partners[0]?.id || 1;
  };

  // Save Current Form State to Backend (Draft)
  const handleSaveDraftOnly = async () => {
    if (editingMove?.id && editingMove.state === 'posted') {
      notify(
        "Action impossible : Une facture déjà validée ne peut pas être réenregistrée en brouillon.",
        'error',
        'Opération Interdite'
      );
      return;
    }

    if (!partnerNameInput.trim()) {
      notify('Veuillez renseigner le nom du patient avant de sauvegarder.', 'warning', 'Saisie Incomplète');
      return;
    }
    setIsSubmitting(true);
    try {
      const resolvedId = await resolvePartnerId();
      const activeConsult = storedConsultationTypes.find(
        (c) => c.id === selectedConsultationTypeId || c.code === consultationType
      ) || storedConsultationTypes[0];
      const docObj = users.find((u) => u.id === consultationDoctorId);
      const doctorSuffix = docObj ? ` - ${docObj.name}` : '';

      const moveData = {
        id: editingMove?.id,
        move_type: moveTypeFilter,
        partner_id: resolvedId,
        patient_name: partnerNameInput.trim(),
        patient_phone: patientPhone || null,
        prescribing_doctor: prescribingDoctor || null,
        is_prescription_invoice: selectedConsultationForInvoice ? true : (editingMove as any)?.is_prescription_invoice,
        ref,
        invoice_date: invoiceDate,
        invoice_date_due: invoiceDateDue,
        invoice_user_id: invoiceUserId,
        is_tax_exempt: isTaxExempt,
        tax_exemption_reason: isTaxExempt ? taxExemptionReason : null,
        insurance_enabled: insuranceEnabled,
        insurance_name: insuranceEnabled ? insuranceName : null,
        insurance_policy_number: insuranceEnabled ? insurancePolicyNumber : null,
        insurance_coverage_rate: insuranceEnabled ? insuranceCoverageRate : 0,
        insurance_amount: computedInsuranceAmount,
        client_share_amount: computedClientShare,
        ndm,
        patient_age_y: patientAgeY,
        patient_age_m: patientAgeM,
        patient_age_d: patientAgeD,
        medical_service: medicalService,
        cancel_reason: cancelReason,
        lines: invoiceCategory === 'consultation'
          ? [
              {
                id: editingMove?.lines?.[0]?.id || undefined,
                product_id: 990,
                name: `Consultation : ${activeConsult?.name || 'Consultation Médicale'}${doctorSuffix}`,
                quantity: 1,
                price_unit: activeConsult?.price || computedConsultationPrice || 10000,
                discount: 0,
                tax_ids: [],
                tax_rate: 0,
                price_subtotal: activeConsult?.price || computedConsultationPrice || 10000,
                price_total: activeConsult?.price || computedConsultationPrice || 10000,
                sequence: 1,
              }
            ]
          : lines.map((l, index) => {
              const qty = Number(l.quantity) || 1;
              const pu = Number(l.price_unit) || 0;
              const disc = Number(l.discount) || 0;
              const taxR = isTaxExempt ? 0 : Number(l.tax_rate ?? 18);
              const subtotal = qty * pu * (1 - disc / 100);
              return {
                id: l.id,
                product_id: l.product_id || null,
                name: l.name || (l.product_id ? 'Article' : 'Prestation'),
                quantity: qty,
                price_unit: pu,
                discount: disc,
                tax_ids: l.tax_ids,
                tax_rate: taxR,
                price_subtotal: subtotal,
                price_total: subtotal * (1 + taxR / 100),
                sequence: index + 1,
              };
            }),
      };

      const saved = await onSaveMove(moveData);
      if (saved) {
        setEditingMove(saved);
        notify('Brouillon de facture sauvegardé.', 'info', 'Brouillon Enregistré');
      }
    } catch (e) {
      console.error('Save error:', e);
      notify('Erreur lors de la sauvegarde du brouillon.', 'error', 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 -> Step 2: VALIDATE INVOICE & AUTOMATICALLY SWITCH TO PAYMENT
  const handleValidateInvoiceAndGoToPayment = async () => {
    const isAlreadyPosted = Boolean(editingMove?.id && editingMove.state === 'posted');

    if (isAlreadyPosted) {
      if (!isSupervisor) {
        notify(
          "Action restreinte : Seuls les Superviseurs et Administrateurs sont autorisés à modifier une facture déjà éditée.",
          'error',
          'Accès Superviseur Requis'
        );
        return;
      }
      if (!cancelReason.trim()) {
        notify(
          "Un motif d'intervention est obligatoirement requis pour enregistrer une modification sur une facture déjà validée.",
          'error',
          'Motif Superviseur Requis'
        );
        return;
      }
    }

    if (!partnerNameInput.trim()) {
      notify('Veuillez renseigner le nom du patient.', 'warning', 'Saisie Incomplète');
      return;
    }
    if (invoiceCategory !== 'consultation' && lines.length === 0) {
      notify('Veuillez ajouter au moins une analyse ou prestation médicale.', 'warning', 'Aucune Prestation');
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedId = await resolvePartnerId();
      const activeConsult = storedConsultationTypes.find(
        (c) => c.id === selectedConsultationTypeId || c.code === consultationType
      ) || storedConsultationTypes[0];
      const docObj = users.find((u) => u.id === consultationDoctorId);
      const doctorSuffix = docObj ? ` - ${docObj.name}` : '';

      const moveData = {
        id: editingMove?.id,
        move_type: moveTypeFilter,
        partner_id: resolvedId,
        patient_name: partnerNameInput.trim(),
        patient_phone: patientPhone || null,
        prescribing_doctor: prescribingDoctor || null,
        is_prescription_invoice: selectedConsultationForInvoice ? true : (editingMove as any)?.is_prescription_invoice,
        ref,
        invoice_date: invoiceDate,
        invoice_date_due: invoiceDateDue,
        invoice_user_id: invoiceUserId,
        is_tax_exempt: isTaxExempt,
        tax_exemption_reason: isTaxExempt ? taxExemptionReason : null,
        insurance_enabled: insuranceEnabled,
        insurance_name: insuranceEnabled ? insuranceName : null,
        insurance_policy_number: insuranceEnabled ? insurancePolicyNumber : null,
        insurance_coverage_rate: insuranceEnabled ? insuranceCoverageRate : 0,
        insurance_amount: computedInsuranceAmount,
        client_share_amount: computedClientShare,
        ndm,
        patient_age_y: patientAgeY,
        patient_age_m: patientAgeM,
        patient_age_d: patientAgeD,
        medical_service: medicalService,
        cancel_reason: cancelReason,
        lines: invoiceCategory === 'consultation'
          ? [
              {
                id: editingMove?.lines?.[0]?.id || undefined,
                product_id: 990,
                name: `Consultation : ${activeConsult?.name || 'Consultation Médicale'}${doctorSuffix}`,
                quantity: 1,
                price_unit: activeConsult?.price || computedConsultationPrice || 10000,
                discount: 0,
                tax_ids: [],
                tax_rate: 0,
                price_subtotal: activeConsult?.price || computedConsultationPrice || 10000,
                price_total: activeConsult?.price || computedConsultationPrice || 10000,
                sequence: 1,
              }
            ]
          : lines.map((l, index) => {
              const qty = Number(l.quantity) || 1;
              const pu = Number(l.price_unit) || 0;
              const disc = Number(l.discount) || 0;
              const taxR = isTaxExempt ? 0 : Number(l.tax_rate ?? 18);
              const subtotal = qty * pu * (1 - disc / 100);
              return {
                id: l.id,
                product_id: l.product_id || null,
                name: l.name || (l.product_id ? 'Article' : 'Prestation'),
                quantity: qty,
                price_unit: pu,
                discount: disc,
                tax_ids: l.tax_ids,
                tax_rate: taxR,
                price_subtotal: subtotal,
                price_total: subtotal * (1 + taxR / 100),
                sequence: index + 1,
              };
            }),
      };

      // 1. Save move
      const saved = await onSaveMove(moveData);
      const moveIdToPost = saved?.id || editingMove?.id;

      // 2. Post / Validate move
      let posted: AccountMove | null = null;
      if (moveIdToPost) {
        posted = await onPostMove(moveIdToPost);
        if (posted) {
          setEditingMove(posted);
        } else if (saved) {
          setEditingMove({
            ...saved,
            state: 'posted',
            name: saved.name || `FAC/${new Date().getFullYear()}/00${saved.id}`,
          });
        }
      }

      const invCode = posted?.name || saved?.name || `#${moveIdToPost}`;

      if (selectedConsultationForInvoice?.id && moveIdToPost) {
        try {
          await fetch(`/api/medical-consultations/${selectedConsultationForInvoice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exam_invoice_id: moveIdToPost,
            }),
          });
        } catch (linkErr) {
          console.warn('Erreur liaison consultation - facture:', linkErr);
        }
      }

      const isAlreadyPosted = editingMove?.id && editingMove.state === 'posted';

      if (isAlreadyPosted && editingMove) {
        logFinancialCorrection({
          supervisorId: currentUser?.id || 1,
          supervisorName: currentUser?.name || 'Superviseur Caisse',
          targetType: 'invoice',
          targetRef: invCode,
          action: 'edit',
          reason: cancelReason.trim(),
          oldAmount: editingMove.amount_total,
          newAmount: computedTotal,
          details: `Rectification de facture validée par Superviseur pour ${partnerNameInput.trim()}`,
        });
      }

      notify(
        isAlreadyPosted 
          ? `La facture ${invCode} a été mise à jour avec succès !`
          : `La facture ${invCode} a été enregistrée avec succès et soumise à l'encaissement à la Caisse pour le patient ${partnerNameInput.trim()} !`,
        'success',
        isAlreadyPosted ? 'Mise à jour réussie' : 'Facture Soumise à L\'Encaissement'
      );

      // 3. ALWAYS ADVANCE TO STEP 2 (ENCAISSEMENT CAISSE)
      // Any validated or edited invoice must always go through the cash desk step.
      setCurrentStep(2);
    } catch (e) {
      console.error('Validation error:', e);
      notify('Erreur lors de la validation de la facture.', 'error', 'Erreur Facturation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 -> Step 3: TRANSMIT TO CASH DESK & FINALIZE
  const handleExecutePaymentAndFinish = async () => {
    setCurrentStep(3);
    notify("Facture enregistrée et transmise au guichet de caisse avec succès.", 'success', 'Transmis à la Caisse');
    return;
  };

  // Skip payment (differed payment) and advance to Step 3
  const handleSkipPayment = () => {
    setCurrentStep(3);
  };

  // Step 3: Transmit manual order to technical lab if needed
  const handleTransmitToLab = async () => {
    if (labOrderTransmitted) return;
    setIsSubmitting(true);
    try {
      const examNames = lines
        .filter((l) => l.type === 'product' && l.name)
        .map((l) => l.name);

      const newLabOrderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (onSaveLabOrder) {
        await onSaveLabOrder({
          order_number: newLabOrderNumber,
          partner_id: partnerId,
          partner_name: partnerNameInput,
          prescribing_doctor: prescribingDoctor,
          sampling_date: new Date().toISOString(),
          status: 'pending_sampling',
          department: 'Biochimie & Hématologie',
          exam_names: examNames.length > 0 ? examNames : ['Analyses Générales'],
          parameters: [],
          invoice_id: editingMove?.id,
        });
      }

      setLabOrderTransmitted(true);
      setTransmittedLabOrderNumber(newLabOrderNumber);
    } catch (e) {
      console.error('Lab order error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myActiveSession = tillSessions.find(
    (s: any) => s.user_id === currentUser?.id && s.state === 'opened'
  );

  const filteredMoves = moves
    .filter((m) => {
      if (m.move_type !== moveTypeFilter) return false;

      // Respect user compartment boundaries
      // 1. Non-supervisors/admins can only see their own accounts/creations
      // 2. Non-supervisors/admins can only see TODAY'S accounts (info antérieure invisible)
      if (!isSupervisorOrAdmin(currentUser)) {
        // Restriction à la date du jour (heure locale)
        const dateToCheck = m.invoice_date || m.date || m.create_date || (m as any).created_at;
        if (!isDateToday(dateToCheck)) return false;

        if (profile === 'facture' || profile === 'facture_caisse' || currentUser?.login === 'caisse_facture') {
          // Un facturier ou polyvalent ne voit que ses propres factures créées
          if (Number(m.invoice_user_id) !== Number(currentUser?.id)) {
            return false;
          }
        } else if (profile === 'caisse') {
          // Un caissier simple peut voir toutes les factures impayées (pour encaissement),
          // mais pour les factures payées/annulées, il ne voit que celles de sa propre session ou créées par lui
          if (m.payment_state === 'paid' || m.state === 'cancel') {
            const isOwnInvoice = Number(m.invoice_user_id) === Number(currentUser?.id) || m.till_session_id === myActiveSession?.id;
            if (!isOwnInvoice) return false;
          }
        }
      }

      if (stateFilter !== 'all' && m.state !== stateFilter) return false;
      if (paymentFilter !== 'all' && m.payment_state !== paymentFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const pName = (m.partner?.name || m.patient_name || '').toLowerCase();
        const pNdm = (m.partner?.ndm || m.ndm || '').toLowerCase();
        const pConv = (m.partner?.convention_code || '').toLowerCase();
        const pPolicy = (m.partner?.insurance_policy_number || '').toLowerCase();
        const mName = (m.name || '').toLowerCase();
        const mRef = (m.ref || '').toLowerCase();
        const insName = (m.insurance_name || '').toLowerCase();
        return (
          pName.includes(q) ||
          pNdm.includes(q) ||
          pConv.includes(q) ||
          pPolicy.includes(q) ||
          mName.includes(q) ||
          mRef.includes(q) ||
          insName.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.invoice_date || a.create_date || 0).getTime();
      const dateB = new Date(b.invoice_date || b.create_date || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  const getBadgeStyle = (state: string, paymentState?: string) => {
    if (state === 'draft') {
      return 'bg-slate-100 text-slate-700 border-slate-300';
    }
    if (state === 'cancel') {
      return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
    }
    if (paymentState === 'paid') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    if (paymentState === 'partial') {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    return 'bg-slate-900 text-white border-slate-900';
  };

  const stepsList = [
    { num: 1, label: '1. Facturation (Saisie Intégrale)', short: '1. Facture', icon: FileText },
    { num: 2, label: '2. Envoi à la Caisse', short: '2. Envoi Caisse', icon: CreditCard },
    { num: 3, label: '3. Transmission Réussie', short: '3. Terminé', icon: CheckCircle2 },
  ];

  const isCreationView = currentView === 'factures_new_invoice' || currentView === 'caisse_facture_new_invoice';
  const isDraftView = currentView === 'factures_draft' || currentView === 'caisse_facture_draft';
  const isPaidView = currentView === 'factures_paid' || currentView === 'caisse_facture_paid';
  const isUnpaidView = currentView === 'factures_unpaid' || currentView === 'caisse_facture_unpaid';
  const isCancelledView = currentView === 'factures_cancelled' || currentView === 'caisse_facture_cancelled';

  const getViewInfo = () => {
    if (isCreationView) {
      return {
        title: 'Nouvelle Facture Patient & Émission de Quittance',
        badge: 'Mode Saisie Directe',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        desc: 'Saisie des actes médicaux, calcul automatique de la prise en charge tiers-payant et encaissement direct au guichet.',
      };
    }
    if (isDraftView) {
      return {
        title: 'Factures en Attente de Paiement / Brouillons',
        badge: `${filteredMoves.length} en attente`,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        desc: 'Factures établies nécessitant un règlement préalable à la caisse ou une validation comptable.',
      };
    }
    if (isPaidView) {
      return {
        title: 'Factures Encaissées & Quittances Soldées',
        badge: `${filteredMoves.length} soldées`,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        desc: 'Registre des factures et quittances entièrement réglées à la caisse avec quittance disponible.',
      };
    }
    if (isUnpaidView) {
      return {
        title: 'Factures Impayées & Restes à Recouvrer',
        badge: `${filteredMoves.length} impayées`,
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        desc: 'Factures présentant un solde restant dû par le patient ou par l’organisme assureur.',
      };
    }
    if (isCancelledView) {
      return {
        title: 'Factures Annulées & Rejets',
        badge: `${filteredMoves.length} annulées`,
        badgeColor: 'bg-slate-200 text-slate-700 border-slate-300',
        desc: 'Historique des factures invalidées avec archivage du motif obligatoire d’annulation.',
      };
    }
    return {
      title: moveTypeFilter === 'out_invoice' ? 'Toutes les Factures Patients & Décomptes Assurances' : 'Factures Fournisseurs & Achats',
      badge: `${filteredMoves.length} factures`,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      desc: profile === 'facture'
        ? 'Affichage strict : Uniquement les factures que vous avez établies.'
        : profile === 'caisse'
        ? 'Affichage caisse : Factures en attente d’encaissement.'
        : 'Flux direct : Saisie facture → Règlement Caisse → Reçu & Plateau Laboratoire.',
    };
  };

  const viewInfo = getViewInfo();

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* Session Required Warning Banner for Cashier / Biller */}
      {!hasActiveSession && !isSessionWarningDismissed && (profile === 'facture' || profile === 'caisse' || profile === 'facture_caisse') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-950 text-xs">
                {profile === 'facture' ? 'Session de vacation journalière non ouverte' : 'Session de caisse non ouverte'}
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                {profile === 'facture'
                  ? "Vous devez ouvrir votre session de vacation pour commencer votre journée de travail et établir des factures patients officielles."
                  : "Vous devez ouvrir votre session de caisse pour commencer votre journée."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToSessions && (
              <button
                type="button"
                onClick={onNavigateToSessions}
                className="px-3.5 py-2 bg-amber-900 text-white font-bold rounded-lg hover:bg-amber-800 transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>{profile === 'facture' ? 'Ouvrir ma Session de Facturation' : 'Ouvrir ma Session'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsSessionWarningDismissed(true);
                try {
                  localStorage.setItem('invoice_session_warning_dismissed', 'true');
                } catch (_) {}
              }}
              className="p-1.5 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition cursor-pointer"
              title="Masquer l'avertissement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-black text-slate-900">
              {viewInfo.title}
            </h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${viewInfo.badgeColor}`}>
              {viewInfo.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewInfo.desc}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToSessions && (
            <button
              type="button"
              onClick={onNavigateToSessions}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Revenir à ma Session</span>
            </button>
          )}

          {isCreationView && onNavigateToView && (
            <button
              type="button"
              onClick={() => onNavigateToView('factures_all')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Toutes les Factures</span>
            </button>
          )}

          {isBiller && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreationView ? 'Démarrer la Saisie' : 'Nouvelle Facture Patient'}</span>
            </button>
          )}
        </div>
      </div>

      {/* DEDICATED STUDIO VIEW FOR NOUVELLE FACTURE WHEN FORM MODAL IS CLOSED */}
      {isCreationView && !isFormOpen && (
        <div className="space-y-4">
          {/* Main Action Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-md text-xs font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Formulaire de Facturation & Émission de Quittance Prêt</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Établir une Nouvelle Facture Patient
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Saisissez les actes médicaux, appliquez les barèmes conventionnés tiers-payant (assurances/mutuelles) et générez la quittance de paiement pour libérer les accès aux prestations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenCreateModal(true)}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-lg shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ouvrir le Formulaire de Saisie</span>
              </button>
              {onNavigateToView && (
                <button
                  type="button"
                  onClick={() => onNavigateToView('factures_all')}
                  className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg border border-white/20 transition cursor-pointer"
                >
                  Voir Toutes les Factures
                </button>
              )}
            </div>
          </div>

          {/* Quick Launchers by Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => {
                setInvoiceCategory('consultation');
                setSelectedConsultationTypeId('c_gen_jour');
                handleOpenCreateModal(true);
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition cursor-pointer flex items-center space-x-3.5 group"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Consultation Générale</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Visite médecin de jour ou garde</p>
              </div>
            </div>

            <div
              onClick={() => {
                setInvoiceCategory('consultation');
                setSelectedConsultationTypeId('c_pediatrie');
                handleOpenCreateModal(true);
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition cursor-pointer flex items-center space-x-3.5 group"
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Pédiatrie & Maternité</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Consultation pédiatrique ou CPN</p>
              </div>
            </div>

            <div
              onClick={() => {
                setInvoiceCategory('exam');
                handleOpenCreateModal(true);
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition cursor-pointer flex items-center space-x-3.5 group"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Laboratoire & Biologie</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">NFS, paludisme, biochimie</p>
              </div>
            </div>

            <div
              onClick={() => {
                setBillingViewTab('prescriptions');
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition cursor-pointer flex items-center space-x-3.5 group"
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-slate-900">Prescriptions en Attente</h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                    {pendingPrescriptionConsultations.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Ordonnances médicales prêtes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Banner for Filtered Views */}
      {!isCreationView && (isDraftView || isPaidView || isUnpaidView || isCancelledView) && (
        <div
          className={`p-3 rounded-md border flex items-center justify-between text-xs shadow-xs ${
            isDraftView
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : isPaidView
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isUnpaidView
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {isDraftView && <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
            {isPaidView && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {isUnpaidView && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {isCancelledView && <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />}
            <div>
              <span className="font-black">
                {isDraftView && `File d'attente caisse : ${filteredMoves.length} facture(s) en attente d'encaissement.`}
                {isPaidView && `Quittances soldées : ${filteredMoves.length} facture(s) entièrement encaissée(s).`}
                {isUnpaidView && `Créances à recouvrer : ${filteredMoves.length} facture(s) avec solde impayé.`}
                {isCancelledView && `Factures invalidées : ${filteredMoves.length} facture(s) annulée(s) ou rejetée(s).`}
              </span>
              <span className="ml-1 opacity-80">
                {isDraftView && 'Enregistrez le règlement au comptoir pour libérer les accès aux soins.'}
                {isPaidView && 'Vous pouvez réimprimer les quittances ou exporter le récapitulatif comptable.'}
                {isUnpaidView && 'Effectuez les relances patient ou émettez les bordereaux de recouvrement assurance.'}
                {isCancelledView && 'Consultez le motif obligatoire et la traçabilité superviseur.'}
              </span>
            </div>
          </div>
          {onNavigateToView && (
            <button
              type="button"
              onClick={() => onNavigateToView('factures_all')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border rounded font-bold text-xs transition cursor-pointer whitespace-nowrap ml-2 shadow-2xs"
            >
              Afficher Tout
            </button>
          )}
        </div>
      )}

      {/* Module Tabs (Registre des Factures vs Prescriptions Médicales à Facturer) */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold px-1">
        <button
          type="button"
          onClick={() => setBillingViewTab('invoices')}
          className={`pb-2.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            billingViewTab === 'invoices'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Registre des Factures</span>
          <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {filteredMoves.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBillingViewTab('prescriptions')}
          className={`pb-2.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            billingViewTab === 'prescriptions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Prescriptions Médicales à Facturer</span>
          <span
            className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
              pendingPrescriptionConsultations.length > 0
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {pendingPrescriptionConsultations.length}
          </span>
        </button>
      </div>

      {billingViewTab === 'invoices' ? (
        <>
          {/* Filter Toolbar */}
      <div className="bg-white rounded-md p-3 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Statut :</span>
          {['all', 'draft', 'posted', 'cancel'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStateFilter(st)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition border ${
                stateFilter === st
                  ? 'bg-slate-100 text-slate-900 border-slate-400'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              {st === 'all'
                ? 'Tous'
                : st === 'draft'
                ? 'Brouillons'
                : st === 'posted'
                ? 'Comptabilisées'
                : 'Annulées'}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-500 ml-2 mr-1">Paiement :</span>
          {['all', 'not_paid', 'partial', 'paid'].map((pst) => (
            <button
              key={pst}
              type="button"
              onClick={() => setPaymentFilter(pst)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition border ${
                paymentFilter === pst
                  ? 'bg-slate-100 text-slate-900 border-slate-400'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              {pst === 'all'
                ? 'Tous'
                : pst === 'not_paid'
                ? 'Non Payées'
                : pst === 'partial'
                ? 'Partiel'
                : 'Soldées'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Rechercher patient, N° facture, assurance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 pl-8 text-xs font-medium focus:border-slate-800"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-x-auto">
        <div className="w-full min-w-[980px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 min-w-[120px]">Numéro</th>
                <th className="py-2.5 px-3 min-w-[170px]">Patient</th>
                <th className="py-2.5 px-3 min-w-[120px] hidden md:table-cell">Date</th>
                <th className="py-2.5 px-3 min-w-[140px] hidden lg:table-cell">Assurance / Tiers</th>
                <th className="py-2.5 px-3 text-right min-w-[100px]">Total</th>
                <th className="py-2.5 px-3 text-right min-w-[90px] hidden sm:table-cell">Part Ass.</th>
                <th className="py-2.5 px-3 text-right min-w-[100px]">Net Patient</th>
                <th className="py-2.5 px-2 text-center min-w-[70px] hidden sm:table-cell">État</th>
                <th className="py-2.5 px-2 text-center min-w-[80px]">Paiement</th>
                <th className="py-2.5 px-3 text-right min-w-[150px] pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMoves.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 bg-slate-50/50">
                    Aucune facture trouvée pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredMoves.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((m, idx) => {
                  const pName = m.patient_name || m.partner?.name || 'Patient';
                  const insName = m.insurance_name;
                  const covRate = m.insurance_coverage_rate;
                  const insAmount = m.insurance_amount || 0;
                  const clientShare = m.client_share_amount !== undefined ? m.client_share_amount : m.amount_total;

                  return (
                    <tr key={`move-row-${m.id || ''}-${m.name || ''}-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 truncate" title={m.name || `#${m.id}`}>
                        {m.name || <span className="text-slate-400 italic font-sans text-[11px]">Brouillon (#{m.id})</span>}
                      </td>
                      <td className="py-2.5 px-3 truncate">
                        <div className="font-bold text-slate-900 truncate" title={pName}>{pName}</div>
                        {m.ref && <div className="text-[10px] text-slate-500 font-mono truncate">Réf: {m.ref}</div>}
                        {(m.is_prescription_invoice || (m.ref && m.ref.startsWith('PRESCR:'))) && (
                          <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded mt-0.5">
                            <Stethoscope className="w-2.5 h-2.5 text-slate-500" />
                            <span>Prescription {m.prescribing_doctor ? `Dr. ${m.prescribing_doctor}` : 'Interne'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[10px] truncate hidden md:table-cell">
                        {formatDateTimeDDMMYYYY(m.invoice_date || m.date || m.created_at)}
                      </td>
                      <td className="py-2.5 px-3 truncate hidden lg:table-cell">
                        {m.insurance_enabled && insName ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-full" title={`${insName} (${covRate}%)`}>
                            {insName} ({covRate}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Comptant</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-[11px]">
                        {formatFCFA(m.amount_total)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap text-[11px] hidden sm:table-cell">
                        {m.insurance_enabled ? formatFCFA(insAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-[11px]">
                        {formatFCFA(clientShare)}
                      </td>
                      <td className="py-2.5 px-2 text-center hidden sm:table-cell">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border truncate ${getBadgeStyle(
                            m.state
                          )}`}
                        >
                          {m.state === 'posted'
                            ? 'Compta.'
                            : m.state === 'draft'
                            ? 'Brouillon'
                            : 'Annulée'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border ${getBadgeStyle(
                            m.state,
                            m.payment_state
                          )}`}
                        >
                          {m.payment_state === 'paid'
                            ? (profile === 'caisse' ? 'Payé' : 'Réglé')
                            : m.payment_state === 'partial'
                            ? 'Partiel'
                            : 'Non réglé'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right pr-4">
                        <div className="flex items-center justify-end space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                            title={isCashierOnly || m.state !== 'draft' ? "Consulter la facture" : "Ouvrir / Éditer la facture"}
                          >
                            {isCashierOnly || m.state !== 'draft' ? <Search className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPdf(m)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Imprimer Reçu PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {m.state === 'posted' && m.payment_state !== 'paid' && isCashier && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEditModal(m);
                                setCurrentStep(2);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                              title="Encaisser au comptoir"
                            >
                              <CreditCard className="w-3.5 h-3.5 shrink-0" />
                              <span>Encaisser</span>
                            </button>
                          )}
                          {isSupervisor ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (m.state === 'posted') {
                                  setSupervisorCorrectionTarget(m);
                                } else {
                                  setMoveToDelete(m);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Supprimer / Annuler (Superviseur / Administrateur avec motif obligatoire)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : m.state === 'draft' && isBiller ? (
                            <button
                              type="button"
                              onClick={() => setMoveToDelete(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Supprimer brouillon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                notify(
                                  "Action restreinte : Seuls les Superviseurs et Administrateurs sont habilités à modifier, supprimer ou annuler une facture déjà validée.",
                                  'error',
                                  'Accès Superviseur Requis'
                                );
                              }}
                              className="p-1.5 text-slate-300 hover:text-slate-500 rounded transition cursor-pointer"
                              title="Action restreinte : Réservée aux Superviseurs et Administrateurs avec motif obligatoire"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredMoves.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="factures"
        />
      </div>
        </>
      ) : (
        <div className="space-y-3">
          {/* Subheader / Search */}
          <div className="bg-white rounded-md p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900">
                {pendingPrescriptionConsultations.length} dossier(s) de consultation avec prescriptions
              </span>
              <span className="hidden md:inline text-slate-400">— Prise en charge interne des actes de biologie, imagerie et ordonnances</span>
            </div>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Rechercher par patient, NDM, médecin..."
                value={prescriptionsSearch}
                onChange={(e) => setPrescriptionsSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 pl-8 text-xs font-medium focus:border-slate-800"
              />
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Prescriptions Table */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 min-w-[120px]">Consultation</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Patient</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Médecin Prescripteur</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Prestations & Médicaments Prescrits</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Assurance</th>
                  <th className="py-2.5 px-3 text-right min-w-[110px]">Total Estimé</th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Statut</th>
                  <th className="py-2.5 px-3 text-right min-w-[140px] pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 bg-slate-50/50">
                      Aucune prescription médicale en attente de facturation.
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((c) => {
                    const existingInvoice = moves.find(
                      (m) =>
                        m.id === c.exam_invoice_id ||
                        (m.ref && (m.ref === `PRESCR:${c.consultation_number}` || m.ref === `PRESCR:${c.id}`))
                    );
                    const totalEst = (c.prescribed_items || []).reduce(
                      (sum, it) => sum + (it.unit_price || 5000) * (it.quantity || 1),
                      0
                    );

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-900">
                            {c.consultation_number || `CONS-#${c.id}`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {(c.consultation_date || c.created_at || '').substring(0, 10)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{c.patient_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                            {c.patient_ndm && <span>NDM: {c.patient_ndm}</span>}
                            {c.patient_phone && <span>• {c.patient_phone}</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">Dr. {c.doctor_name}</div>
                          <div className="text-[10px] text-slate-500">{c.specialty || 'Médecine Générale'}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(c.prescribed_items || []).map((it, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                              >
                                {(it as any).item_name || it.name} {it.quantity > 1 ? `(x${it.quantity})` : ''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {c.insurance_name ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {c.insurance_name} ({c.insurance_coverage_rate || 80}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Comptant</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatFCFA(totalEst)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {existingInvoice ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Facturé ({existingInvoice.name || `#${existingInvoice.id}`})
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200">
                              À Facturer
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right pr-4">
                          {existingInvoice ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(existingInvoice)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-xs transition cursor-pointer"
                            >
                              Voir Facture
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLoadFromConsultation(c)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Établir Facture</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GUIDED AUTOMATIC WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-5xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[96vh] flex flex-col overflow-hidden my-auto">
            
            {/* Modal Header: Title & Close */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>
                <div className="p-2 bg-slate-900 text-white rounded">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-slate-900 font-mono">
                      {editingMove?.name || (editingMove ? `Brouillon #${editingMove.id}` : 'Nouvelle Facture Patient')}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getBadgeStyle(
                        editingMove?.state || 'draft',
                        editingMove?.payment_state || 'not_paid'
                      )}`}
                    >
                      {editingMove?.state === 'posted'
                        ? editingMove?.payment_state === 'paid'
                          ? 'Comptabilisée & Réglée'
                          : 'Comptabilisée'
                        : 'Brouillon'}
                    </span>
                    {editingMove?.state === 'posted' && !isSupervisor && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300 inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700 inline" />
                        <span>Validée (Modification réservée au Superviseur)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {currentStep === 1 && 'Étape 1 : Saisie intégrale de la facture sur une interface unique'}
                    {currentStep === 2 && 'Étape 2 : Transmission de la facture au guichet de caisse'}
                    {currentStep === 3 && 'Étape 3 : Transmission Réussie & Confirmation'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFormModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP PROGRESSION BAR (Clickable anytime to navigate back/forward) */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
                {stepsList.map((st, idx) => {
                  const StepIcon = st.icon;
                  const isCurrent = currentStep === st.num;
                  const isPast = currentStep > st.num;

                  return (
                    <React.Fragment key={st.num}>
                      <button
                        type="button"
                        onClick={() => {
                          const hasPatientAndItems = Boolean(partnerNameInput && partnerNameInput.trim()) && lines.length > 0;
                          if (st.num > 1 && !hasPatientAndItems) {
                            notify("Veuillez d'abord renseigner un patient et au moins une prestation dans la facture (Étape 1).", 'warning', 'Étape Incomplète');
                            return;
                          }
                          setCurrentStep(st.num as InvoiceStep);
                        }}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-900 text-white shadow-xs'
                            : isPast
                            ? 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-white text-slate-900'
                              : isPast
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isPast ? <Check className="w-2.5 h-2.5" /> : st.num}
                        </span>
                        <span>{st.label}</span>
                      </button>
                      {idx < stepsList.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-white space-y-5">
              
              {/* ========================================================================= */}
              {/* ÉTAPE 1 : INTERFACE UNIQUE DE FACTURATION (TOUT SUR LA MÊME PAGE) */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Banner when invoice is already posted */}
                  {editingMove?.state === 'posted' && (
                    <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isSupervisor 
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}>
                      <div className="flex items-start gap-2.5">
                        {isSupervisor ? (
                          <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">
                            {isSupervisor 
                              ? 'Modification Supervisée d\'une Facture Déjà Éditée' 
                              : 'Facture Déjà Éditée & Validée (Mode Consultation Seule)'}
                          </div>
                          <p className="text-[11px] opacity-90">
                            {isSupervisor
                              ? 'En tant que Superviseur / Administrateur, tout ajustement apporté à cette facture sera enregistré avec votre motif obligatoire au registre d\'audit financier.'
                              : 'Seuls les Superviseurs et Administrateurs sont autorisés à modifier, supprimer ou annuler une facture déjà éditée. Les champs sont verrouillés en lecture seule.'}
                          </p>
                        </div>
                      </div>
                      {editingMove?.payment_state !== 'paid' && isCashier && (
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs cursor-pointer shrink-0 whitespace-nowrap self-start sm:self-center"
                        >
                          Passer au Règlement Caisse
                        </button>
                      )}
                    </div>
                  )}

                  {/* Motif input for supervisor modifying posted invoice */}
                  {editingMove?.state === 'posted' && isSupervisor && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-300 space-y-1.5">
                      <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>Motif d'Intervention Obligatoire de Rectification</span>
                        <span className="text-rose-600 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Précisez obligatoirement le motif (ex: Rectification du montant suite accord médical, correction de prestation...)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full bg-white border border-amber-400 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  <fieldset disabled={isReadOnlyForm} className="contents space-y-5">
                  
                  {/* Quick Importer from Pending Medical Prescriptions */}
                  {pendingPrescriptionConsultations.length > 0 && !editingMove && (
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-slate-700 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Charger depuis une prescription médicale en attente
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Pré-remplit automatiquement le patient, l'assurance et la liste des prestations
                          </span>
                        </div>
                      </div>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const selected = pendingPrescriptionConsultations.find((c) => c.id === val);
                          if (selected) handleLoadFromConsultation(selected);
                        }}
                        className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-slate-800 cursor-pointer max-w-xs truncate"
                      >
                        <option value="" disabled>
                          -- Sélectionner un patient prescrit ({pendingPrescriptionConsultations.length}) --
                        </option>
                        {pendingPrescriptionConsultations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.patient_name} {c.patient_ndm ? `(${c.patient_ndm})` : ''} — Dr. {c.doctor_name} ({c.prescribed_items?.length || 0} actes)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Type de Facture Segment Selector */}
                  <div className="bg-slate-100 p-1.5 rounded-lg flex items-center max-w-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceCategory('consultation');
                        // Reset lines so that consultation is the single exclusive line
                        setLines([]);
                      }}
                      className={`flex-1 py-2 text-xs font-black rounded-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        invoiceCategory === 'consultation'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Facture de Consultation Directe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceCategory('exam')}
                      className={`flex-1 py-2 text-xs font-black rounded-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        invoiceCategory === 'exam'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Facture d'Examens &amp; Prestations</span>
                    </button>
                  </div>

                  {invoiceCategory === 'consultation' && (
                    <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-lg space-y-3.5 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-black text-teal-950 uppercase tracking-wider">
                            Pôle Médical &amp; Type de Consultation Directe
                          </h4>
                        </div>
                        <div className="text-[11px] text-teal-800 font-medium bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {storedConsultationTypes.length} Actes &amp; Consultations configurés
                        </div>
                      </div>

                      {/* Filter by Pole */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {[
                          { key: 'all', label: 'Tous les Pôles' },
                          { key: 'generaliste', label: 'Médecine Générale' },
                          { key: 'pediatrie', label: 'Pédiatrie & Enfants' },
                          { key: 'maternite', label: 'Maternité & Gynéco' },
                          { key: 'specialiste', label: 'Spécialistes' },
                          { key: 'infirmier', label: 'Soins & Triage' },
                          { key: 'urgences', label: 'Urgences 24/7' },
                        ].map((pole) => {
                          const count = pole.key === 'all'
                            ? storedConsultationTypes.length
                            : storedConsultationTypes.filter((c) => c.pole === pole.key).length;
                          return (
                            <button
                              key={pole.key}
                              type="button"
                              onClick={() => setSelectedConsultationPole(pole.key)}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition shrink-0 cursor-pointer ${
                                selectedConsultationPole === pole.key
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {pole.label} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* Search & Grid of Consultations */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Rechercher un acte de consultation (ex: Pédiatrie, CPN, Cardiologie, Triage...)"
                            value={consultationSearchQuery}
                            onChange={(e) => setConsultationSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                          {storedConsultationTypes
                            .filter((c) => {
                              const matchesPole = selectedConsultationPole === 'all' || c.pole === selectedConsultationPole;
                              const matchesQuery =
                                !consultationSearchQuery.trim() ||
                                c.name.toLowerCase().includes(consultationSearchQuery.toLowerCase()) ||
                                c.code.toLowerCase().includes(consultationSearchQuery.toLowerCase()) ||
                                (c.description && c.description.toLowerCase().includes(consultationSearchQuery.toLowerCase()));
                              return matchesPole && matchesQuery;
                            })
                            .map((consult) => {
                              const isSelected =
                                selectedConsultationTypeId === consult.id ||
                                (consultationType === consult.code && !selectedConsultationTypeId);
                              return (
                                <button
                                  key={consult.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedConsultationTypeId(consult.id);
                                    setConsultationType(consult.code);
                                  }}
                                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer group shadow-2xs ${
                                    isSelected
                                      ? 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-500/30'
                                      : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/20'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1 w-full mb-1">
                                    <span
                                      className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                                        isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800'
                                      }`}
                                    >
                                      {consult.code}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold ${
                                        isSelected ? 'text-teal-100' : 'text-slate-400'
                                      }`}
                                    >
                                      {consult.duration_minutes ? `${consult.duration_minutes} min` : '30 min'}
                                    </span>
                                  </div>
                                  <div className="text-xs font-black line-clamp-1 mb-0.5">{consult.name}</div>
                                  {consult.description && (
                                    <div
                                      className={`text-[10px] line-clamp-1 mb-1.5 ${
                                        isSelected ? 'text-teal-100' : 'text-slate-500'
                                      }`}
                                    >
                                      {consult.description}
                                    </div>
                                  )}
                                  <div className="mt-auto pt-1 border-t border-dashed border-slate-200/50 flex items-center justify-between">
                                    <span
                                      className={`text-[9px] font-bold uppercase ${
                                        isSelected ? 'text-teal-200' : 'text-teal-700'
                                      }`}
                                    >
                                      {consult.pole}
                                    </span>
                                    <span className="text-xs font-black">{formatFCFA(consult.price)}</span>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Doctor / Practicien Selection (Optional) */}
                      <div className="pt-2 border-t border-teal-100/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-teal-950 block">
                            Médecin / Praticien d'astreinte ou affecté (Optionnel)
                          </label>
                          <select
                            value={consultationDoctorId || ''}
                            onChange={(e) => setConsultationDoctorId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 transition"
                          >
                            <option value="">-- Praticien de Garde / Équipe de Consultation --</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.role || 'Praticien'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center text-[11px] text-teal-800 bg-white/70 p-2 rounded border border-teal-100">
                          <span>
                            L'affectation du médecin est flexible et s'adapte à la rotation des équipes et gardes du jour.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 1: Informations Patient & Prescripteur */}
                  <div className="space-y-3">
                    <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-700" />
                        <span>1. Patient &amp; Prescripteur</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => openPatientCreationModal()}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-black px-2.5 py-1 rounded flex items-center space-x-1 transition shadow-sm cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Créer un Dossier Patient</span>
                        </button>
                        <span className="text-[11px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Date : {invoiceDate}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/50 p-3.5 rounded border border-slate-200">
                      {/* Unified Real-time Alert if Patient or NDM doesn't exist */}
                      {((ndm.trim() !== '' && !partners.some((p) => p.ndm && p.ndm.toLowerCase() === ndm.trim().toLowerCase())) ||
                        (partnerNameInput.trim() !== '' && !partners.some((p) => p.name.toLowerCase() === partnerNameInput.trim().toLowerCase()))) && (
                        <div className="sm:col-span-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 gap-3 animate-in fade-in">
                          <span className="flex items-center space-x-2 font-semibold">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>
                              {ndm.trim() !== '' && !partners.some((p) => p.ndm && p.ndm.toLowerCase() === ndm.trim().toLowerCase()) && partnerNameInput.trim() !== '' && !partners.some((p) => p.name.toLowerCase() === partnerNameInput.trim().toLowerCase()) ? (
                                <>Le patient <strong>"{partnerNameInput}"</strong> avec le dossier N° <strong>"{ndm}"</strong> n'est pas enregistré dans le système.</>
                              ) : ndm.trim() !== '' && !partners.some((p) => p.ndm && p.ndm.toLowerCase() === ndm.trim().toLowerCase()) ? (
                                <>Le N° de dossier patient <strong>"{ndm}"</strong> n'existe pas encore dans le système.</>
                              ) : (
                                <>Le patient nommé <strong>"{partnerNameInput}"</strong> n'est pas encore enregistré dans le système.</>
                              )}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openPatientCreationModal(partnerNameInput, ndm)}
                            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded text-[11px] transition shadow-xs cursor-pointer shrink-0"
                          >
                            Créer la Fiche & son Dossier Patient
                          </button>
                        </div>
                      )}

                      {/* NDM with Smart Autocomplete */}
                      <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-700 block">N° Dossier Patient (NDM)</label>
                        <input
                          type="text"
                          placeholder="Ex: NDM-2026-..."
                          value={ndm}
                          onFocus={() => setIsNdmDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsNdmDropdownOpen(false), 250)}
                          onChange={(e) => handleSelectNdm(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-slate-800 transition"
                        />
                        {isNdmDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-slate-300 rounded shadow-xl z-50 max-h-52 overflow-y-auto">
                            {partners
                              .filter((p) => p.ndm && (!ndm || p.ndm.toLowerCase().includes(ndm.toLowerCase()) || p.name.toLowerCase().includes(ndm.toLowerCase())))
                              .slice(0, 10)
                              .map((p) => (
                                <button
                                  key={`ndm-pop-${p.id}`}
                                  type="button"
                                  onMouseDown={() => {
                                    handleSelectNdm(p.ndm || '');
                                    handleSelectPartner(p.name);
                                    setIsNdmDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-2 hover:bg-teal-50 border-b border-slate-100 transition text-xs flex flex-col"
                                >
                                  <span className="font-mono font-bold text-teal-800">{p.ndm}</span>
                                  <span className="text-[11px] text-slate-700 font-medium truncate">{p.name} {p.phone ? `(${p.phone})` : ''}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Nom Patient with Disambiguation Popover */}
                      <div className="sm:col-span-2 space-y-1 relative">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 block">Nom &amp; Prénoms du Patient *</label>
                          <span className="text-[10px] text-slate-400">Recherche avec levée d'homonymie</span>
                        </div>
                        <input
                          type="text"
                          value={partnerNameInput}
                          onFocus={() => setIsPatientDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsPatientDropdownOpen(false), 250)}
                          onChange={(e) => {
                            setPartnerNameInput(e.target.value);
                            setIsPatientDropdownOpen(true);
                          }}
                          placeholder="Tapez le nom complet ou recherchez..."
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-800 transition"
                        />

                        {/* Smart Disambiguation Dropdown */}
                        {isPatientDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                            <div className="p-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                              <span>Patients enregistrés ({partners.length})</span>
                              <span>NDM • Téléphone • Âge • Commune</span>
                            </div>
                            {(() => {
                              const matches = partners.filter((p) => {
                                if (!partnerNameInput.trim()) return true;
                                const q = partnerNameInput.toLowerCase();
                                return (
                                  p.name.toLowerCase().includes(q) ||
                                  (p.ndm && p.ndm.toLowerCase().includes(q)) ||
                                  (p.phone && p.phone.includes(q))
                                );
                              });

                              if (matches.length === 0) {
                                return (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    Aucun patient trouvé pour "{partnerNameInput}".
                                    <button
                                      type="button"
                                      onMouseDown={() => openPatientCreationModal(partnerNameInput, ndm)}
                                      className="block mx-auto mt-1 text-teal-600 font-bold hover:underline"
                                    >
                                      + Créer une nouvelle fiche
                                    </button>
                                  </div>
                                );
                              }

                              return matches.slice(0, 20).map((p) => (
                                <button
                                  key={`pat-disambig-${p.id}`}
                                  type="button"
                                  onMouseDown={() => {
                                    handleSelectPartner(p.name);
                                    if (p.ndm) setNdm(p.ndm);
                                    setIsPatientDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-teal-50/70 border-b border-slate-100 transition flex items-center justify-between text-xs group"
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-900 group-hover:text-teal-900 flex items-center space-x-2">
                                      <span>{p.name}</span>
                                      {p.gender && (
                                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded">
                                          {p.gender}
                                        </span>
                                      )}
                                      {p.insurance_name && (
                                        <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 rounded border border-indigo-200">
                                          {p.insurance_name} ({p.insurance_coverage_rate || 80}%)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                                      {p.phone && <span>📞 {p.phone}</span>}
                                      {p.age !== undefined && <span>• {p.age} ans</span>}
                                      {p.commune && <span>• 📍 {p.commune}</span>}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0 ml-2">
                                    {p.ndm || 'SANS NDM'}
                                  </span>
                                </button>
                              ));
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Téléphone */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Téléphone / Contact</label>
                        <input
                          type="text"
                          placeholder="Téléphone"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                        />
                      </div>

                      {/* Âge du Patient (Ans, Mois, Jours) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Âge Patient (Ans / Mois / Jours)</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="125"
                              value={patientAgeY}
                              onChange={(e) => setPatientAgeY(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-white border border-slate-300 rounded pl-2 pr-7 py-1.5 text-xs font-bold text-slate-900 text-center focus:border-slate-800 transition"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black uppercase pointer-events-none">ans</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="11"
                              value={patientAgeM}
                              onChange={(e) => setPatientAgeM(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                              className="w-full bg-white border border-slate-300 rounded pl-2 pr-8 py-1.5 text-xs font-bold text-slate-900 text-center focus:border-slate-800 transition"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black uppercase pointer-events-none">mois</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={patientAgeD}
                              onChange={(e) => setPatientAgeD(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))}
                              className="w-full bg-white border border-slate-300 rounded pl-2 pr-6 py-1.5 text-xs font-bold text-slate-900 text-center focus:border-slate-800 transition"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black uppercase pointer-events-none">jrs</span>
                          </div>
                        </div>
                      </div>

                      {/* Service Prescripteur */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Service Prescripteur</label>
                        <select
                          value={medicalService}
                          onChange={(e) => setMedicalService(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                        >
                          <option value="Externe">Externe</option>
                          <option value="Urgences">Urgences</option>
                          <option value="Pédiatrie">Pédiatrie</option>
                          <option value="Gynécologie">Gynécologie</option>
                          <option value="Maternité">Maternité</option>
                          <option value="Médecine Interne">Médecine Interne</option>
                          <option value="Cardiologie">Cardiologie</option>
                          <option value="Chirurgie">Chirurgie</option>
                        </select>
                      </div>

                      {/* Médecin Prescripteur */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Médecin Prescripteur</label>
                        <input
                          type="text"
                          placeholder="Nom du médecin"
                          value={prescribingDoctor}
                          onChange={(e) => setPrescribingDoctor(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                        />
                      </div>

                      {/* N° Ordonnance */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">N° Ordonnance / Bon</label>
                        <input
                          type="text"
                          placeholder="N° ordonnance"
                          value={ref}
                          onChange={(e) => setRef(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:border-slate-800 transition"
                        />
                      </div>

                      {/* Date d'Émission */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Date d'Émission</label>
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                        />
                      </div>

                      {/* Agent Caissier */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Agent Caissier</label>
                        <select
                          value={invoiceUserId}
                          onChange={(e) => setInvoiceUserId(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Motif d'annulation */}
                      {editingMove?.state === 'cancel' && (
                        <div className="sm:col-span-4 space-y-1 bg-red-50 p-2 rounded border border-red-200 mt-1">
                          <label className="text-xs font-bold text-red-700 block">Motif d'Annulation du Reçu / Facture</label>
                          <input
                            type="text"
                            placeholder="Veuillez spécifier la raison de l'annulation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full bg-white border border-red-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-red-500 focus:ring-red-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Prise en Charge Assurance / Convention Entreprise (Tiers-Payeur) */}
                  <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HeartHandshake className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-900">
                          Prise en Charge Assurance &amp; Convention Entreprise (Tiers-Payeur)
                        </span>
                      </div>
                      <label className="flex items-center space-x-1.5 text-xs cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={insuranceEnabled}
                          onChange={(e) => setInsuranceEnabled(e.target.checked)}
                          className="rounded text-slate-900 focus:ring-0"
                        />
                        <span className="text-slate-700">Activer Couverture Tiers-Payeur</span>
                      </label>
                    </div>

                    {insuranceEnabled && (
                      <div className="space-y-2 pt-1 border-t border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Convention Tiers-Payeur / Assureur / Entreprise
                            </label>
                            <select
                              value={selectedConventionId || insuranceName || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedConventionId(val);
                                const foundConv = storedConventions.find((c) => c.id === val || c.name === val);
                                if (foundConv) {
                                  setInsuranceName(foundConv.name);
                                  setInsuranceCoverageRate(foundConv.default_coverage_rate);
                                } else {
                                  const foundIns = insurancePartners.find((i) => String(i.id) === val || i.name === val);
                                  if (foundIns) {
                                    setInsurancePartnerId(foundIns.id);
                                    setInsuranceName(foundIns.name);
                                    setInsuranceCoverageRate(foundIns.default_coverage_rate || 80);
                                  } else {
                                    setInsuranceName(val);
                                  }
                                }
                              }}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-semibold text-slate-800"
                            >
                              <option value="">Sélectionner une convention...</option>
                              <optgroup label="🏢 Sociétés &amp; Entreprises Conventionnées">
                                {storedConventions
                                  .filter((c) => c.type === 'enterprise')
                                  .map((conv) => (
                                    <option key={conv.id} value={conv.id}>
                                      {conv.name} ({conv.default_coverage_rate}%) - {conv.sector || 'Entreprise'}
                                    </option>
                                  ))}
                              </optgroup>
                              <optgroup label="🛡️ Compagnies d'Assurance &amp; Mutuelles">
                                {storedConventions
                                  .filter((c) => c.type === 'insurance')
                                  .map((conv) => (
                                    <option key={conv.id} value={conv.id}>
                                      {conv.name} ({conv.default_coverage_rate}%)
                                    </option>
                                  ))}
                                {insurancePartners
                                  .filter((ip) => !storedConventions.some((c) => c.name === ip.name))
                                  .map((ins) => (
                                    <option key={`ins-p-${ins.id}`} value={ins.name}>
                                      {ins.name} ({ins.default_coverage_rate || 80}%)
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              N° Carte Assuré / Matricule Salarié
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: MATR-48920 / POL-8472"
                              value={insurancePolicyNumber}
                              onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Taux de Couverture Conventionné
                            </label>
                            <div className="flex items-center space-x-1">
                              {(() => {
                                const currentConv = storedConventions.find(
                                  (c) => c.id === selectedConventionId || c.name === insuranceName
                                );
                                const rates = currentConv?.allowed_rates || [30, 50, 70, 75, 80, 100];
                                return rates.map((rate) => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setInsuranceCoverageRate(rate)}
                                    className={`flex-1 py-1 text-xs font-bold rounded border transition cursor-pointer ${
                                      insuranceCoverageRate === rate
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {rate}%
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Tableau des Analyses & Prestations Médicales */}
                  {invoiceCategory === 'exam' && (
                    <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-700" />
                        <span>2. Prestations &amp; Analyses Biologiques ({lines.length})</span>
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCatalogue(!showCatalogue)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>{showCatalogue ? 'Masquer Catalogue' : 'Catalogue Rapide'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLine}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Ajouter Ligne</span>
                        </button>
                      </div>
                    </div>

                    {/* Catalogue Popup Box if opened */}
                    {showCatalogue && (
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2.5 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder="Filtrer dans le catalogue (ex: NFS, Glycémie, Sérologie...)"
                            value={catalogueSearch}
                            onChange={(e) => setCatalogueSearch(e.target.value)}
                            className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-medium focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                          />
                        </div>

                        {/* Department/Domain filter tabs for quick categorization */}
                        {(() => {
                          const depts = Array.from(new Set(products.map(p => p.lab_department).filter(Boolean))).sort();
                          return (
                            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin border-b border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => setCatalogueDept('all')}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                                  catalogueDept === 'all'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                                }`}
                              >
                                Tous ({products.length})
                              </button>
                              {depts.map((dept) => {
                                const count = products.filter(p => p.lab_department === dept).length;
                                return (
                                  <button
                                    key={dept}
                                    type="button"
                                    onClick={() => setCatalogueDept(dept)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                                      catalogueDept === dept
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                                    }`}
                                  >
                                    {dept} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pt-1">
                          {(() => {
                            const sorted = [...products].sort((a, b) => {
                              const nameA = a.name || '';
                              const nameB = b.name || '';
                              return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
                            });

                            const filtered = sorted.filter((p) => {
                              const matchesSearch = !catalogueSearch || 
                                (p.name || '').toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                                (p.default_code && p.default_code.toLowerCase().includes(catalogueSearch.toLowerCase()));
                              
                              const matchesDept = catalogueDept === 'all' || p.lab_department === catalogueDept;
                              
                              return matchesSearch && matchesDept;
                            });

                            return filtered.length === 0 ? (
                              <div className="col-span-full py-6 text-center text-slate-400 italic text-[11px]">
                                Aucun examen ou service trouvé pour les critères sélectionnés.
                              </div>
                            ) : (
                              filtered.slice(0, 48).map((p, pIdx) => (
                                <button
                                  key={`cat-prod-${p.id}-${pIdx}`}
                                  type="button"
                                  onClick={() => handleAddProductFromCatalog(p)}
                                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-800 rounded-lg text-left transition flex flex-col justify-between min-h-[82px] h-auto group shadow-2xs gap-1"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[9px] text-slate-400 font-mono font-bold block truncate group-hover:text-indigo-600">
                                      {p.default_code || 'EXAM'}
                                    </span>
                                    {p.lab_department && catalogueDept === 'all' && (
                                      <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded truncate group-hover:bg-indigo-50 group-hover:text-indigo-700">
                                        {p.lab_department.split(' ')[0]}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-800 line-clamp-2 group-hover:text-slate-900 leading-tight flex-1">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-900 block mt-auto pt-0.5">
                                    {formatFCFA(p.list_price)}
                                  </span>
                                </button>
                              ))
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Lines Table */}
                    <div className="border border-slate-200 rounded overflow-visible bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <th className="py-2 px-2.5">Article</th>
                            <th className="py-2 px-2.5 w-16 text-center">Qté</th>
                            <th className="py-2 px-2.5 w-28 text-right">Montant</th>
                            <th className="py-2 px-2.5 w-24 text-center">Réduction %</th>
                            <th className="py-2 px-2.5 w-28 text-right">Montant à payer</th>
                            <th className="py-2 px-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {lines.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400 bg-slate-50/50">
                                Aucune analyse sélectionnée. Saisissez un article pour commencer ou cliquez sur "+ Ajouter Ligne".
                              </td>
                            </tr>
                          ) : (
                            lines.map((line, idx) => {
                              const pu = Number(line.price_unit) || 0;
                              const qty = Number(line.quantity) || 1;
                              const disc = Number(line.discount) || 0;
                              const lineSubtotal = qty * pu * (1 - disc / 100);

                              return (
                                <tr key={`inv-line-${idx}-${line.product_id || 'new'}`} className="hover:bg-slate-50/40 align-middle">
                                  <td className="py-2 px-2.5 relative">
                                    {(() => {
                                      const query = lineSearchQueries[idx] !== undefined 
                                        ? lineSearchQueries[idx] 
                                        : (line.product_id > 0 
                                          ? (products.find((p) => p.id === line.product_id)?.name || '') 
                                          : line.name);
                                      const matchedList = getFilteredProducts(query);
                                      return (
                                        <div className="relative w-full">
                                          <input
                                            type="text"
                                            placeholder="Saisissez ou recherchez un article (ex: ASAT, ASLO, Amylase...)"
                                            value={query}
                                            onFocus={() => setActiveLineSearchIndex(idx)}
                                            onBlur={() => {
                                              // Leave a tiny delay to allow onMouseDown to capture clicks
                                              setTimeout(() => {
                                                setActiveLineSearchIndex((prev) => (prev === idx ? null : prev));
                                              }, 200);
                                            }}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setLineSearchQueries({ ...lineSearchQueries, [idx]: val });
                                              if (!val) {
                                                handleLineChange(idx, 'product_id', 0);
                                                handleLineChange(idx, 'name', '');
                                              }
                                            }}
                                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition"
                                          />

                                          {activeLineSearchIndex === idx && (
                                            <div className="absolute left-0 mt-1 w-full bg-white border border-slate-300 rounded shadow-2xl z-[99] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                                              {/* Matched Products */}
                                              {matchedList.length === 0 ? (
                                                <div className="p-5 text-center border-b border-slate-100">
                                                  <div className="text-slate-400 italic text-[11px] mb-3">
                                                    Aucune prestation trouvée pour "{query}"
                                                  </div>
                                                  {query && query.trim() && (
                                                    <button
                                                      type="button"
                                                      onMouseDown={() => handleCreateProductOnTheFly(query, idx)}
                                                      className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-slate-800 transition shadow-md"
                                                    >
                                                      <Plus className="w-3.5 h-3.5" />
                                                      <span>Créer cette prestation</span>
                                                    </button>
                                                  )}
                                                </div>
                                              ) : (
                                                matchedList.map((prod, prodIdx) => {
                                                  const codeStr = prod.default_code ? `[${prod.default_code}] ` : '';
                                                  return (
                                                    <button
                                                      key={`match-prod-${prod.id}-${prodIdx}`}
                                                      type="button"
                                                      onMouseDown={() => {
                                                        const updated = [...lines];
                                                        updated[idx].product_id = prod.id;
                                                        updated[idx].name = prod.name || '';
                                                        updated[idx].price_unit = prod.list_price || 0;
                                                        setLines(updated);

                                                        const newQueries = { ...lineSearchQueries };
                                                        delete newQueries[idx];
                                                        setLineSearchQueries(newQueries);
                                                        setActiveLineSearchIndex(null);
                                                      }}
                                                      className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-900 hover:text-white transition flex justify-between items-center border-b border-slate-50 font-semibold group"
                                                    >
                                                      <span className="truncate">
                                                        <span className="text-indigo-600 font-black font-mono mr-1.5 group-hover:text-indigo-300 inline-block">
                                                          {codeStr}
                                                        </span>
                                                        <span>{prod.name}</span>
                                                        {prod.lab_department && (
                                                          <span className="text-[8px] bg-slate-100 group-hover:bg-white/20 text-slate-600 group-hover:text-white px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ml-1.5">
                                                            {prod.lab_department.split(' ')[0]}
                                                          </span>
                                                        )}
                                                      </span>
                                                      <span className="text-[10px] font-mono font-bold bg-slate-100 group-hover:bg-white/20 text-slate-600 group-hover:text-white px-1.5 py-0.5 rounded ml-2">
                                                        {formatFCFA(prod.list_price)}
                                                      </span>
                                                    </button>
                                                  );
                                                })
                                              )}

                                              {/* Dropdown Actions matching Image 1 */}
                                              <div className="bg-slate-50 p-1 flex flex-col gap-0.5 border-t border-slate-100">
                                                <button
                                                  type="button"
                                                  onMouseDown={() => {
                                                    setShowCatalogue(true);
                                                    setActiveLineSearchIndex(null);
                                                  }}
                                                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-indigo-600 hover:bg-slate-100 rounded flex items-center space-x-1.5 font-bold transition"
                                                >
                                                  <Search className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>Recherche avancée...</span>
                                                </button>

                                                {query && query.trim() && (
                                                  <button
                                                    type="button"
                                                    onMouseDown={() => handleCreateProductOnTheFly(query, idx)}
                                                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1.5 font-semibold transition"
                                                  >
                                                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>
                                                      Créer <strong className="text-slate-900">"{query}"</strong>
                                                    </span>
                                                  </button>
                                                )}

                                                <button
                                                  type="button"
                                                  onMouseDown={() => handleOpenFullProductModal(query, idx)}
                                                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1.5 font-semibold transition"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>Créer et modifier...</span>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-2 px-2.5 text-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={line.quantity}
                                      onChange={(e) =>
                                        handleLineChange(idx, 'quantity', Math.max(1, Number(e.target.value)))
                                      }
                                      className="w-12 text-center bg-white border border-slate-300 rounded py-1 text-xs font-bold focus:border-slate-800 focus:outline-none transition"
                                    />
                                  </td>
                                  <td className="py-2 px-2.5 text-right">
                                    <input
                                      type="number"
                                      step="500"
                                      value={line.price_unit}
                                      onChange={(e) =>
                                        handleLineChange(idx, 'price_unit', Math.max(0, Number(e.target.value)))
                                      }
                                      className="w-24 text-right bg-white border border-slate-300 rounded py-1 px-2 text-xs font-mono font-bold focus:border-slate-800 focus:outline-none transition"
                                    />
                                  </td>
                                  <td className="py-2 px-2.5 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={line.discount}
                                      onChange={(e) =>
                                        handleLineChange(idx, 'discount', Math.min(100, Math.max(0, Number(e.target.value))))
                                      }
                                      className="w-16 text-center bg-white border border-slate-300 rounded py-1 text-xs font-bold focus:border-slate-800 focus:outline-none transition"
                                    />
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                                    {formatFCFA(lineSubtotal)}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLine(idx)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                      title="Supprimer la ligne"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}

                  {/* Section 4: TVA & Récapitulatif Financier Complet */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-200">
                    {/* TVA & Mentions */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isTaxExempt}
                            onChange={(e) => handleToggleTaxExempt(e.target.checked)}
                            className="rounded text-slate-900 focus:ring-0"
                          />
                          <span>Exonération Médicale de TVA (TVA 0% Légale)</span>
                        </label>
                      </div>

                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                        {isTaxExempt ? (
                          <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Régime exonéré : Actes et analyses de biologie médicale (CGI Art. 355).</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-amber-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>TVA standard de 18% appliquée sur l'ensemble des prestations.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Totaux & Décompte Assurance */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Brut des Analyses :</span>
                        <span className="font-bold text-slate-900">{formatFCFA(computedUntaxed)}</span>
                      </div>
                      {!isTaxExempt && (
                        <div className="flex justify-between text-slate-600">
                          <span>TVA Collectée (18%) :</span>
                          <span className="font-bold">{formatFCFA(computedTax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                        <span>Montant Total Facturé :</span>
                        <span className="text-sm font-black">{formatFCFA(computedTotal)}</span>
                      </div>

                      {insuranceEnabled && (
                        <>
                          <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-200 pt-1">
                            <span>Part Assurance ({insuranceCoverageRate}%) :</span>
                            <span className="font-bold text-slate-700">-{formatFCFA(computedInsuranceAmount)}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-bold bg-white p-1.5 rounded border border-slate-300">
                            <span>Reste à Payer Patient (Ticket Modérateur) :</span>
                            <span className="text-sm font-black text-slate-900">{formatFCFA(computedClientShare)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  </fieldset>

                  {/* BOTTOM ACTION BUTTONS FOR STEP 1 */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCloseFormModal}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      Fermer
                    </button>

                    {isReadOnlyForm ? (
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-500 italic flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lecture seule (Modifications réservées au Superviseur / Admin)</span>
                        </span>
                        {editingMove?.payment_state !== 'paid' && isCashier && (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm cursor-pointer"
                          >
                            Passer au Règlement Guichet
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        {(!editingMove?.id || editingMove.state !== 'posted') && (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSaveDraftOnly}
                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
                          >
                            Enregistrer Brouillon
                          </button>
                        )}

                        {/* MAIN VALIDATION BUTTON: Posts invoice and AUTOMATICALLY switches to payment */}
                        <button
                          type="button"
                          disabled={isSubmitting || !partnerNameInput || !partnerNameInput.trim() || (invoiceCategory !== 'consultation' && lines.length === 0)}
                          onClick={handleValidateInvoiceAndGoToPayment}
                          className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-black text-white rounded shadow-md flex items-center justify-center space-x-2 transition ${
                            !partnerNameInput || !partnerNameInput.trim() || (invoiceCategory !== 'consultation' && lines.length === 0)
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                              : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <span>
                            {editingMove?.id && editingMove.state === 'posted'
                              ? 'Enregistrer les Modifications (Superviseur avec motif)'
                              : getUserBillingProfile(currentUser) === 'facture'
                              ? 'Valider & Transmettre à la Caisse'
                              : 'Valider la Facture & Passer au Paiement'}
                          </span>
                          {!(editingMove?.id && editingMove.state === 'posted') && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* ÉTAPE 2 : ENCAISSEMENT & RÈGLEMENT CAISSE */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150 max-w-2xl mx-auto py-2">
                  
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black text-slate-900">
                          Facture validée avec succès : {editingMove?.name || 'FAC/2026/001'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 font-mono">Patient : {partnerNameInput}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center font-mono text-xs">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Total Facture</span>
                        <span className="font-black text-slate-900">{formatFCFA(computedTotal)}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Part Assurance ({insuranceCoverageRate}%)</span>
                        <span className="font-bold text-slate-600">
                          {insuranceEnabled ? formatFCFA(computedInsuranceAmount) : '0 FCFA'}
                        </span>
                      </div>
                      <div className="bg-slate-900 text-white p-2 rounded">
                        <span className="text-[10px] text-slate-300 block">Net Patient à Encaisser</span>
                        <span className="font-black text-sm">{formatFCFA(computedClientShare)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                      Sélectionner le Mode de Paiement :
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'cash', label: 'Espèces / Guichet', icon: Coins },
                        { id: 'wave', label: 'Wave Mobile Money', icon: Wallet },
                        { id: 'orange', label: 'Orange Money CI', icon: Wallet },
                        { id: 'card', label: 'Carte Bancaire (TPE)', icon: CreditCard },
                        { id: 'check', label: 'Chèque Bancaire', icon: FileText },
                        { id: 'insurance_direct', label: 'Tiers-Payeur 100%', icon: HeartHandshake },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id as any)}
                            className={`p-3 rounded border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                            <span className="text-xs font-bold">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash Calculator if Cash selected */}
                  {paymentMethod === 'cash' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-300 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Calculatrice Espèces :</span>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          À payer : {formatFCFA(computedClientShare)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Montant Reçu du Patient (FCFA)
                          </label>
                          <input
                            type="number"
                            step="500"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Monnaie à Rendre
                          </label>
                          <div className="w-full bg-slate-200/80 border border-slate-300 rounded px-3 py-2 text-sm font-mono font-black text-slate-900">
                            {formatFCFA(computedChangeReturn)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM ACTION BUTTONS FOR STEP 2 */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                    {/* BACK BUTTON TO STEP 1 */}
                    {!isCashierOnly ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>← Précédent (Modifier la Facture)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Modification restreinte au Facturier</span>
                      </div>
                    )}

                     <div className="flex items-center space-x-2">
                      {/* TRANSMIT TO CASH DESK & FINALIZE: Moves invoice to the queue for Cashier payment registration */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleExecutePaymentAndFinish}
                        className="px-6 py-3 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md flex items-center space-x-2 transition cursor-pointer"
                      >
                        <span>Envoyer à la Caisse pour Paiement &amp; Finaliser</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* ÉTAPE 3 : REÇU DE CAISSE & TRANSMISSION AU LABORATOIRE */}
              {/* ========================================================================= */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-150 max-w-xl mx-auto py-3 text-center">
                  
                  {(() => {
                    const profile = getUserBillingProfile(currentUser);
                    const isPaid = editingMove?.payment_state === 'paid' || (paymentSuccess && currentStep === 3 && profile !== 'facture');
                    return (
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Check className="w-6 h-6 stroke-[3]" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <h3 className="text-base font-black text-slate-900">
                            {isPaid
                              ? 'Paiement Enregistré avec Succès !'
                              : 'Facture Enregistrée avec Succès et Transmise à la Caisse !'}
                          </h3>
                          {isPaid ? (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded uppercase">
                              Réglée / Payée
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded uppercase">
                              En Attente de Règlement
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md">
                          {isPaid ? (
                            <>
                              La facture <span className="font-mono font-bold text-slate-800">{editingMove?.name || 'FAC/2026/001'}</span> est désormais soldée. Le règlement est enregistré dans votre session de caisse.
                            </>
                          ) : (
                            <>
                              La facture <span className="font-mono font-bold text-slate-800">{editingMove?.name || 'FAC/2026/001'}</span> a été créée avec succès et transmise au guichet de caisse pour encaissement.
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Summary Card */}
                  <div className="bg-slate-50 rounded border border-slate-200 p-4 text-left space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Patient :</span>
                      <span className="font-bold text-slate-900">{partnerNameInput}</span>
                    </div>
                    {(() => {
                      const profile = getUserBillingProfile(currentUser);
                      const isPaid = editingMove?.payment_state === 'paid' || (paymentSuccess && currentStep === 3 && profile !== 'facture');
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{isPaid ? 'Montant Encaissé :' : 'Montant à Encaisser :'}</span>
                            <span className="font-bold text-slate-900">{formatFCFA(computedClientShare)}</span>
                          </div>
                          {isPaid && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Mode de Règlement :</span>
                              <span className="font-bold text-slate-900">{(editingMove?.payment_method || paymentMethod || 'cash').toUpperCase()}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500">N° Ordre Laboratoire :</span>
                      <span className="font-bold text-slate-900">{transmittedLabOrderNumber || `LAB-${new Date().getFullYear()}-0028`}</span>
                    </div>
                  </div>

                  {/* Main Actions: Respect du Process Métier */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingMove) onOpenPdf(editingMove);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>Imprimer Reçu / Facture PDF</span>
                    </button>

                    {/* "Nouveau Patient / Facture" : Autorisé pour Facturier & Superviseur (masqué pour Caisse pure) */}
                    {profile !== 'caisse' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenCreateModal(true);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nouveau Patient / Facture</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        handleCloseFormModal();
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Fermer &amp; Terminer</span>
                    </button>
                  </div>

                  {/* Navigation Back / Close */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Revenir au Paiement (Précédent)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseFormModal}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                    >
                      Fermer &amp; Consulter la Liste
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>,
        document.body
      )}

      {/* SAFE IN-APP DELETE MODAL */}
      {moveToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer la facture brouillon{' '}
              <strong className="text-slate-900 font-mono">
                {moveToDelete.name || `#${moveToDelete.id}`}
              </strong>{' '}
              ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMoveToDelete(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (moveToDelete) {
                    if (moveToDelete.state === 'posted') {
                      if (!isSupervisor) {
                        notify(
                          "Action restreinte : Seuls les Superviseurs et Administrateurs sont habilités à supprimer ou annuler une facture validée.",
                          'error',
                          'Action Restreinte'
                        );
                        setMoveToDelete(null);
                        return;
                      }
                      // Supervisor must provide motif via modal
                      const target = moveToDelete;
                      setMoveToDelete(null);
                      setSupervisorCorrectionTarget(target);
                      return;
                    }
                    await onDeleteMove(moveToDelete.id);
                    setMoveToDelete(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded transition shadow-xs cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SUPERVISOR CORRECTION & AUDIT MODAL */}
      {supervisorCorrectionTarget && (
        <SupervisorCorrectionModal
          isOpen={Boolean(supervisorCorrectionTarget)}
          onClose={() => setSupervisorCorrectionTarget(null)}
          supervisorUser={currentUser}
          targetItem={{
            type: 'invoice',
            ref: supervisorCorrectionTarget.name || `#${supervisorCorrectionTarget.id}`,
            amount: supervisorCorrectionTarget.amount_total,
            partnerName: supervisorCorrectionTarget.patient_name || supervisorCorrectionTarget.partner?.name,
          }}
          onConfirm={async (action, reason) => {
            logFinancialCorrection({
              supervisorId: currentUser?.id || 1,
              supervisorName: currentUser?.name || 'Superviseur Caisse',
              targetType: 'invoice',
              targetRef: supervisorCorrectionTarget.name || `#${supervisorCorrectionTarget.id}`,
              action: action,
              reason: reason,
              oldAmount: supervisorCorrectionTarget.amount_total,
              details: `Facture patient: ${supervisorCorrectionTarget.patient_name || supervisorCorrectionTarget.partner?.name || 'N/A'}`,
            });

            await onDeleteMove(supervisorCorrectionTarget.id);
            notify(
              `Facture ${supervisorCorrectionTarget.name || `#${supervisorCorrectionTarget.id}`} ${action === 'delete' ? 'supprimée' : 'annulée'} avec succès. Motif consigné au registre d'audit.`,
              'success',
              'Action Superviseur Validée'
            );
            setSupervisorCorrectionTarget(null);
          }}
        />
      )}

      {/* CREATION DOSSIER PATIENT MODAL (Inspired by Reference UI) */}
      {isCreatePatientOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 rounded-lg max-w-5xl w-full shadow-2xl border border-slate-300 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-white border-b border-slate-200 text-slate-900 px-5 py-3.5 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-slate-100 rounded-md border border-slate-200 text-slate-500">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-tight text-slate-800">Créer : NDM (Dossier Médical)</h3>
                  <p className="text-[11px] text-slate-500">Enregistrement et état civil du patient</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePatientOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
              
              {/* Row 1: Photo and Large display of NDM */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-white p-4 rounded-lg border border-slate-200">
                <div className="relative group">
                  <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-teal-500 transition">
                    {newPatientPhoto ? (
                      <img src={newPatientPhoto} alt="Portrait patient" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <User className="w-8 h-8 text-slate-400 group-hover:text-teal-500 transition" />
                        <span className="text-[10px] text-slate-500 mt-1 font-bold">Photo Patient</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewPatientPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Téléverser une photo du patient"
                  />
                  {newPatientPhoto && (
                    <button
                      type="button"
                      onClick={() => setNewPatientPhoto(null)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">N° DOSSIER GÉNÉRÉ (NDM)</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newPatientNdm}
                      onChange={(e) => setNewPatientNdm(e.target.value)}
                      className="text-lg font-mono font-black text-teal-800 bg-teal-50/50 border border-teal-200 rounded px-3 py-1 text-center sm:text-left focus:border-teal-500 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPatientNdm(`NDM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-800 underline"
                      title="Regénérer un nouvel identifiant"
                    >
                      Regénérer
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 block">Vous pouvez personnaliser ou saisir l'identifiant du dossier patient existant.</span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                  <span className="w-1.5 h-3 bg-teal-600 rounded-xs"></span>
                  <span>Informations de l'état civil</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nom */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nom de famille *</label>
                    <input
                      type="text"
                      placeholder="Nom de famille"
                      value={newPatientLastName}
                      onChange={(e) => setNewPatientLastName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Prénoms */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Prénoms *</label>
                    <input
                      type="text"
                      placeholder="Prénoms"
                      value={newPatientFirstName}
                      onChange={(e) => setNewPatientFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Nom de jeune fille */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nom de jeune fille</label>
                    <input
                      type="text"
                      placeholder="Nom de jeune fille"
                      value={newPatientMaidenName}
                      onChange={(e) => setNewPatientMaidenName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Sexe */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Sexe</label>
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    >
                      <option value="M">Masculin (M)</option>
                      <option value="F">Féminin (F)</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Date de Naissance */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Date de naissance</label>
                    <input
                      type="date"
                      value={newPatientBirthDate}
                      onChange={(e) => setNewPatientBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Lieu de Naissance */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Lieu de naissance</label>
                    <input
                      type="text"
                      placeholder="Ville"
                      value={newPatientBirthPlace}
                      onChange={(e) => setNewPatientBirthPlace(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Profession */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Profession</label>
                    <input
                      type="text"
                      placeholder="Profession"
                      value={newPatientProfession}
                      onChange={(e) => setNewPatientProfession(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Statut Matrimonial */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Statut matrimonial</label>
                    <select
                      value={newPatientCivilStatus}
                      onChange={(e) => setNewPatientCivilStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    >
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                      <option value="Veuf/Veuve">Veuf/Veuve</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Nationalité */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nationalité</label>
                    <input
                      type="text"
                      placeholder="Nationalité"
                      value={newPatientNationality}
                      onChange={(e) => setNewPatientNationality(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Religion */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Religion</label>
                    <input
                      type="text"
                      placeholder="Religion"
                      value={newPatientReligion}
                      onChange={(e) => setNewPatientReligion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* CNIB / N° d'identité */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">CNIB / Passeport / ID Card</label>
                    <input
                      type="text"
                      placeholder="Numéro de pièce"
                      value={newPatientCnib}
                      onChange={(e) => setNewPatientCnib(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Type Patient */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Type de Patient (Classe)</label>
                    <select
                      value={newPatientClass}
                      onChange={(e) => setNewPatientClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    >
                      <option value="" disabled>Sélectionner le type</option>
                      <option value="Externe">Patient Externe</option>
                      <option value="Interne">Patient Hospitalisé (Interne)</option>
                      <option value="Urgences">Urgences</option>
                      <option value="Pédiatrie">Pédiatrie</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid 2: Coordonnées & Géolocalisation */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                  <span className="w-1.5 h-3 bg-teal-600 rounded-xs"></span>
                  <span>Coordonnées &amp; Origine géographique</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Tél. portable */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Téléphone portable *</label>
                    <input
                      type="text"
                      placeholder="Téléphone"
                      value={newPatientMobilePhone}
                      onChange={(e) => setNewPatientMobilePhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Tél. domicile */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Téléphone domicile</label>
                    <input
                      type="text"
                      placeholder="Téléphone fixe"
                      value={newPatientHomePhone}
                      onChange={(e) => setNewPatientHomePhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Région */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Région d'origine</label>
                    <input
                      type="text"
                      placeholder="Région"
                      value={newPatientRegion}
                      onChange={(e) => setNewPatientRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Province */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Province / État</label>
                    <input
                      type="text"
                      placeholder="Province / État"
                      value={newPatientProvince}
                      onChange={(e) => setNewPatientProvince(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Département */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Département</label>
                    <input
                      type="text"
                      placeholder="Ville"
                      value={newPatientDepartment}
                      onChange={(e) => setNewPatientDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Commune / Village */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Commune / Village de résidence</label>
                    <input
                      type="text"
                      placeholder="Quartier"
                      value={newPatientCommune}
                      onChange={(e) => setNewPatientCommune(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 3: Personne de contact d'urgence */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center space-x-1.5 text-teal-800">
                  <span className="w-1.5 h-3 bg-teal-600 rounded-xs"></span>
                  <span>Personne à contacter en cas d'urgence</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nom et prénom */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nom &amp; Prénom du Contact</label>
                    <input
                      type="text"
                      placeholder="Nom et prénoms"
                      value={newPatientContactName}
                      onChange={(e) => setNewPatientContactName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Lien de parenté */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Lien avec le patient (Relation)</label>
                    <input
                      type="text"
                      placeholder="Lien de parenté"
                      value={newPatientContactRelationship}
                      onChange={(e) => setNewPatientContactRelationship(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Tél. Personne de contact */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">N° Téléphone du Contact</label>
                    <input
                      type="text"
                      placeholder="Téléphone"
                      value={newPatientContactPhone}
                      onChange={(e) => setNewPatientContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-5 py-4 flex items-center justify-end space-x-3 rounded-b-lg border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreatePatientOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-md transition cursor-pointer"
              >
                Ne pas sauvegarder (Annuler)
              </button>
              <button
                type="button"
                onClick={handleSaveNewPatient}
                className="px-6 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-slate-300" />
                <span>Sauvegarder le Dossier</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
      {/* Modal: Require Session Before Invoice Creation */}
      {showRequireSessionModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ouverture de Session Requise
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Conformément aux règles de gestion hospitalière et à la traçabilité des actes, vous devez impérativement ouvrir votre session journalière avant de créer des dossiers patients ou d'établir des factures.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRequireSessionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Fermer / Rester en consultation</span>
              </button>
              {(onRequestOpenSession || onNavigateToSessions) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRequireSessionModal(false);
                    if (onRequestOpenSession) {
                      onRequestOpenSession();
                    } else if (onNavigateToSessions) {
                      onNavigateToSessions();
                    }
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {profile === 'facture' ? 'Ouvrir ma Session de Facturation' : 'Ouvrir ma Session'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
