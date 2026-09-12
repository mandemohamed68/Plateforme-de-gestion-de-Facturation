import React, { useState, useEffect } from 'react';
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
  BadgeCheck,
  Receipt,
  Wallet,
  CheckCheck,
  UserPlus,
  Lock,
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
} from '../types';
import { formatFCFA, getUserBillingProfile } from '../lib/formatters';
import { PaginationControls } from './PaginationControls';

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
  tillSessions?: any[];
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  moves = [],
  partners = [],
  users = [],
  products = [],
  taxes = [],
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
  onFinishAndReturnToSession,
  onSavePartner,
  onSaveProduct,
  company,
  partnerReductions = [],
  hasActiveSession = true,
  onNavigateToSessions,
  tillSessions = [],
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showRequireSessionModal, setShowRequireSessionModal] = useState(false);

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
  };

  useEffect(() => {
    if (autoOpenCreate) {
      handleOpenCreateModal(true);
    }
  }, [autoOpenCreate]);

  useEffect(() => {
    if (initialMove) {
      handleOpenEditModal(initialMove);
    }
  }, [initialMove]);

  // Safe In-App Delete Modal State
  const [moveToDelete, setMoveToDelete] = useState<AccountMove | null>(null);

  // --- Step 1: Facturation (Interface Unique Complète) ---
  const [partnerId, setPartnerId] = useState<number>(partners[0]?.id || 1);
  const [partnerNameInput, setPartnerNameInput] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [prescribingDoctor, setPrescribingDoctor] = useState<string>('');
  const [ref, setRef] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().replace('T', ' ').substring(0, 16));
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
      alert('Le nom du patient est obligatoire.');
      return;
    }
    const fullName = `${newPatientLastName.trim()} ${newPatientFirstName.trim()}`.trim();

    // Search for existing patient by name to UPDATE instead of creating a duplicate
    const existingPartner = partners.find(
      (p) => p.name.trim().toLowerCase() === fullName.toLowerCase()
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
      if (onSavePartner) {
        await onSavePartner(partnerData);
        setNdm(newPatientNdm);
        setPartnerNameInput(fullName);
        setPatientPhone(newPatientMobilePhone);
        setPatientAgeY(computedAge || 30);
        setPatientAgeM(0);
        setPatientAgeD(0);
        setIsCreatePatientOpen(false);
      } else {
        const res = await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partnerData),
        });
        if (res.ok) {
          setNdm(newPatientNdm);
          setPartnerNameInput(fullName);
          setPatientPhone(newPatientMobilePhone);
          setPatientAgeY(computedAge || 30);
          setPatientAgeM(0);
          setPatientAgeD(0);
          setIsCreatePatientOpen(false);
          alert('Fiche dossier patient enregistrée avec succès !');
        }
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement du dossier patient.");
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
  const computedUntaxed = lines.reduce((acc, l) => {
    if (l.type === 'section' || l.type === 'note') return acc;
    return acc + l.quantity * l.price_unit * (1 - l.discount / 100);
  }, 0);

  const computedTax = isTaxExempt
    ? 0
    : lines.reduce((acc, l) => {
        if (l.type === 'section' || l.type === 'note') return acc;
        const subtotal = l.quantity * l.price_unit * (1 - l.discount / 100);
        const rate =
          l.tax_rate !== undefined
            ? l.tax_rate
            : l.tax_ids && l.tax_ids.length > 0 && !l.tax_ids.includes(0)
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
      alert("Accès restreint : Le profil Caissier n'est pas autorisé à établir des factures. Cette action est réservée au profil Facture ou Facture / Caisse.");
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

    setShowCatalogue(false);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (move: AccountMove) => {
    setEditingMove(move);
    if (move.state === 'posted' && move.payment_state === 'paid') {
      setCurrentStep(3);
    } else if (move.state === 'posted') {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
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
            : l.tax_rate ?? (l.tax_ids && l.tax_ids.length > 0 && !l.tax_ids.includes(0) ? 18 : 0),
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
          alert('Analyse créée avec succès !');
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
      alert("Erreur lors de la création de l'analyse.");
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
      alert("Le nom de l'analyse est obligatoire.");
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
      alert("Erreur lors de l'enregistrement de l'analyse.");
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
      return partners[0]?.id || 1;
    }
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
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedInput,
          phone: patientPhone || null,
          prescribing_doctor: prescribingDoctor || null,
          ndm: ndm || generateNextNdm(),
          is_company: false,
          partner_type: 'patient',
          customer_rank: 1,
          supplier_rank: 0,
        }),
      });
      if (res.ok) {
        const newPartner = await res.json();
        return newPartner.id;
      }
    } catch (e) {
      console.error('Erreur création client :', e);
    }
    return partners[0]?.id || 1;
  };

  // Save Current Form State to Backend (Draft)
  const handleSaveDraftOnly = async () => {
    if (!partnerNameInput.trim()) {
      alert('Veuillez renseigner le nom du patient avant de sauvegarder.');
      return;
    }
    setIsSubmitting(true);
    try {
      const resolvedId = await resolvePartnerId();
      const moveData = {
        id: editingMove?.id,
        move_type: moveTypeFilter,
        partner_id: resolvedId,
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
        lines: lines.map((l, index) => ({
          id: l.id,
          product_id: l.product_id || null,
          name: l.name || (l.product_id ? 'Article' : 'Prestation'),
          quantity: l.quantity,
          price_unit: l.price_unit,
          discount: l.discount,
          tax_ids: l.tax_ids,
          tax_rate: isTaxExempt ? 0 : l.tax_rate ?? 18,
          price_subtotal: l.quantity * l.price_unit * (1 - l.discount / 100),
          price_total:
            l.quantity *
            l.price_unit *
            (1 - l.discount / 100) *
            (1 + (isTaxExempt ? 0 : (l.tax_rate ?? 18)) / 100),
          sequence: index + 1,
        })),
      };

      const saved = await onSaveMove(moveData);
      if (saved) {
        setEditingMove(saved);
      }
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 -> Step 2: VALIDATE INVOICE & AUTOMATICALLY SWITCH TO PAYMENT
  const handleValidateInvoiceAndGoToPayment = async () => {
    if (!partnerNameInput.trim()) {
      alert('Veuillez renseigner le nom du patient.');
      return;
    }
    if (lines.length === 0) {
      alert('Veuillez ajouter au moins une analyse ou prestation médicale.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedId = await resolvePartnerId();
      const moveData = {
        id: editingMove?.id,
        move_type: moveTypeFilter,
        partner_id: resolvedId,
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
        lines: lines.map((l, index) => ({
          id: l.id,
          product_id: l.product_id || null,
          name: l.name || (l.product_id ? 'Article' : 'Prestation'),
          quantity: l.quantity,
          price_unit: l.price_unit,
          discount: l.discount,
          tax_ids: l.tax_ids,
          tax_rate: isTaxExempt ? 0 : l.tax_rate ?? 18,
          price_subtotal: l.quantity * l.price_unit * (1 - l.discount / 100),
          price_total:
            l.quantity *
            l.price_unit *
            (1 - l.discount / 100) *
            (1 + (isTaxExempt ? 0 : (l.tax_rate ?? 18)) / 100),
          sequence: index + 1,
        })),
      };

      // 1. Save move
      const saved = await onSaveMove(moveData);
      const moveIdToPost = saved?.id || editingMove?.id;

      // 2. Post / Validate move
      if (moveIdToPost) {
        const posted = await onPostMove(moveIdToPost);
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

      // 3. AUTOMATICALLY ADVANCE TO STEP 2 (PAYMENT) OR STEP 3 (IF FACTURE PROFILE)
      const profile = getUserBillingProfile(currentUser);
      if (profile === 'facture') {
        setCurrentStep(3); // strictly facturier profile skips payment step
      } else {
        setCurrentStep(2);
      }
    } catch (e) {
      console.error('Validation error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 -> Step 3: VALIDATE PAYMENT & AUTOMATICALLY SWITCH TO RECEIPT & LAB
  const handleExecutePaymentAndFinish = async () => {
    const profile = getUserBillingProfile(currentUser);
    if (profile === 'facture') {
      alert("Accès restreint : Le profil Facturier est autorisé uniquement à établir des factures. L'encaissement est réservé au profil Caisse ou au Superviseur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const moveId = editingMove?.id;
      const amountToPay = Number(paymentAmount) || computedClientShare;

      if (onRegisterPayment) {
        await onRegisterPayment({
          move_id: moveId || null,
          partner_id: partnerId,
          amount: amountToPay,
          journal_id: paymentJournalId,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          notes: `Règlement ticket modérateur par ${paymentMethod.toUpperCase()}`,
        });
      } else {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            move_id: moveId || null,
            partner_id: partnerId,
            amount: amountToPay,
            journal_id: paymentJournalId,
            payment_method: paymentMethod,
            payment_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          }),
        });
      }

      setPaymentSuccess(true);
      if (editingMove) {
        setEditingMove({
          ...editingMove,
          payment_state: 'paid',
          amount_residual: Math.max(0, (editingMove.amount_residual || computedClientShare) - amountToPay),
        });
      }

      // Auto-create lab order in the background for technical laboratory
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
            invoice_id: moveId,
          });
        }
        setLabOrderTransmitted(true);
        setTransmittedLabOrderNumber(newLabOrderNumber);
      } catch (e) {
        console.warn('Auto lab transmission info:', e);
      }

      // AUTOMATICALLY ADVANCE TO STEP 3 (RECEIPT & LAB COMPLETION)
      setCurrentStep(3);
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setIsSubmitting(false);
    }
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

  const profile = getUserBillingProfile(currentUser);
  const isSupervisor = profile === 'superviseur';
  const isCashier = profile === 'caisse' || profile === 'facture_caisse';
  const isCashierOnly = profile === 'caisse';
  const isBiller = profile === 'facture' || profile === 'facture_caisse';

  const myActiveSession = tillSessions.find(
    (s: any) => s.user_id === currentUser?.id && s.state === 'opened'
  );

  const filteredMoves = moves
    .filter((m) => {
      // Role-based strict isolation & visibility:
      // 1. Superviseur : voit toutes les factures de tous les facturiers
      // 2. Facturier : voit STRICTEMENT UNIQUEMENT les factures qu'il a lui-même créées dans sa session active en cours
      // 3. Caissier : voit les factures en attente de paiement (non soldées) à encaisser
      // 4. Facture & Caisse : voit ses propres factures créées et les factures en attente
      if (!isSupervisor) {
        if (profile === 'facture') {
          const isCreator = m.invoice_user_id === currentUser?.id || (!m.invoice_user_id && m.created_by_name === currentUser?.name);
          if (!isCreator) return false;
          
          // Strict current session filter for biller profile
          if (!myActiveSession) return false;
          if (m.till_session_id) {
            if (m.till_session_id !== myActiveSession.id) return false;
          } else {
            const sessionStart = new Date(myActiveSession.created_at || myActiveSession.create_date || 0).getTime();
            const invoiceTime = new Date(m.create_date || m.invoice_date || m.date || 0).getTime();
            if (invoiceTime < sessionStart - 30000) return false;
          }
        } else if (profile === 'caisse') {
          const isUnpaidCustomerInvoice = m.move_type === 'out_invoice' && m.payment_state !== 'paid';
          if (!isUnpaidCustomerInvoice) return false;
        } else if (profile === 'facture_caisse') {
          const isCreator = m.invoice_user_id === currentUser?.id;
          const isUnpaidCustomerInvoice = m.move_type === 'out_invoice' && m.payment_state !== 'paid';
          if (!isCreator && !isUnpaidCustomerInvoice) return false;
          
          // Strict current session filter for invoices created by this user
          if (isCreator) {
            if (!myActiveSession) return false;
            if (m.till_session_id) {
              if (m.till_session_id !== myActiveSession.id) return false;
            } else {
              const sessionStart = new Date(myActiveSession.created_at || myActiveSession.create_date || 0).getTime();
              const invoiceTime = new Date(m.create_date || m.invoice_date || m.date || 0).getTime();
              if (invoiceTime < sessionStart - 30000) return false;
            }
          }
        }
      }

      if (m.move_type !== moveTypeFilter) return false;
      if (stateFilter !== 'all' && m.state !== stateFilter) return false;
      if (paymentFilter !== 'all' && m.payment_state !== paymentFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const pName = (m.partner?.name || '').toLowerCase();
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
    { num: 2, label: '2. Encaissement Caisse', short: '2. Paiement', icon: CreditCard },
    { num: 3, label: '3. Reçu & Plateau Labo', short: '3. Reçu / Labo', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* Session Required Warning Banner for Cashier / Biller */}
      {!hasActiveSession && (profile === 'facture' || profile === 'caisse' || profile === 'facture_caisse') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
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
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-black text-slate-900">
              {moveTypeFilter === 'out_invoice'
                ? 'Factures Patients & Décomptes Assurances'
                : 'Factures Fournisseurs & Achats'}
            </h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
              {filteredMoves.length} factures
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile === 'facture'
              ? 'Affichage strict : Uniquement les factures que vous avez établies.'
              : profile === 'caisse'
              ? 'Affichage caisse : Factures en attente d’encaissement.'
              : 'Flux direct : Saisie facture → Règlement Caisse → Reçu & Plateau Laboratoire.'}
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
              <span>⬅️ Revenir à ma Session</span>
            </button>
          )}

          {isBiller && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nouvelle Facture Patient</span>
            </button>
          )}
        </div>
      </div>

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
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-2 w-[11%]">Numéro</th>
                <th className="py-2.5 px-2 w-[18%]">Patient</th>
                <th className="py-2.5 px-2 w-[11%] hidden md:table-cell">Date</th>
                <th className="py-2.5 px-2 w-[16%] hidden lg:table-cell">Assurance / Tiers</th>
                <th className="py-2.5 px-2 text-right w-[11%]">Total</th>
                <th className="py-2.5 px-2 text-right w-[10%] hidden sm:table-cell">Part Ass.</th>
                <th className="py-2.5 px-2 text-right w-[11%]">Net Patient</th>
                <th className="py-2.5 px-2 text-center w-[7%] hidden sm:table-cell">État</th>
                <th className="py-2.5 px-2 text-center w-[8%]">Paiement</th>
                <th className="py-2.5 px-2 text-center w-[8%]"></th>
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
                filteredMoves.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((m) => {
                  const pName = m.partner?.name || 'Patient';
                  const insName = m.insurance_name;
                  const covRate = m.insurance_coverage_rate;
                  const insAmount = m.insurance_amount || 0;
                  const clientShare = m.client_share_amount !== undefined ? m.client_share_amount : m.amount_total;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-900 truncate" title={m.name || `#${m.id}`}>
                        {m.name || <span className="text-slate-400 italic font-sans text-[11px]">Brouillon (#{m.id})</span>}
                      </td>
                      <td className="py-2.5 px-2 truncate">
                        <div className="font-bold text-slate-900 truncate" title={pName}>{pName}</div>
                        {m.ref && <div className="text-[10px] text-slate-500 font-mono truncate">Réf: {m.ref}</div>}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 font-mono text-[10px] truncate hidden md:table-cell">
                        {(m.invoice_date || m.date || m.created_at).replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="py-2.5 px-2 truncate hidden lg:table-cell">
                        {m.insurance_enabled && insName ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-full" title={`${insName} (${covRate}%)`}>
                            {insName} ({covRate}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Comptant</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-[11px]">
                        {formatFCFA(m.amount_total)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 whitespace-nowrap text-[11px] hidden sm:table-cell">
                        {m.insurance_enabled ? formatFCFA(insAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-[11px]">
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
                      <td className="py-2.5 px-1 text-center">
                        <div className="flex items-center justify-center space-x-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                            title={isCashierOnly ? "Consulter la facture" : "Ouvrir la facture"}
                          >
                            {isCashierOnly ? <Search className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPdf(m)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
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
                              className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs ml-1"
                              title="Encaisser au comptoir"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Encaisser</span>
                            </button>
                          )}
                          {isSupervisor && (
                            <button
                              type="button"
                              onClick={() => setMoveToDelete(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Supprimer / Annuler (Droit exclusif Superviseur)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {m.state === 'draft' && isBiller && !isSupervisor && (
                            <button
                              type="button"
                              onClick={() => setMoveToDelete(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Supprimer brouillon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* GUIDED AUTOMATIC WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-md max-w-5xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[96vh] flex flex-col overflow-hidden">
            
            {/* Modal Header: Title & Close */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>⬅️ Retour</span>
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
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-300">
                        🔒 Validée (Modification réservée au Superviseur)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {currentStep === 1 && 'Étape 1 : Saisie intégrale de la facture sur une interface unique'}
                    {currentStep === 2 && 'Étape 2 : Encaissement & Règlement Caisse'}
                    {currentStep === 3 && 'Étape 3 : Reçu de Caisse & Transmission au Laboratoire'}
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
                            alert("Veuillez d'abord renseigner un patient et au moins une prestation dans la facture (Étape 1).");
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
                          className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-black px-2.5 py-1 rounded flex items-center space-x-1 transition shadow-sm"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Créer un Dossier Patient</span>
                        </button>
                        <span className="text-[11px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Date : {invoiceDate}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/50 p-3.5 rounded border border-slate-200">
                      {/* Real-time Alerts if Patient doesn't exist */}
                      {ndm.trim() !== '' && !partners.some((p) => p.ndm && p.ndm.toLowerCase() === ndm.trim().toLowerCase()) && (
                        <div className="sm:col-span-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800 animate-in fade-in">
                          <span className="flex items-center space-x-2 font-semibold">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Le dossier patient N° <strong>"{ndm}"</strong> n'existe pas dans le système.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openPatientCreationModal('', ndm)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded text-[11px] transition"
                          >
                            Créer le Dossier NDM
                          </button>
                        </div>
                      )}

                      {partnerNameInput.trim() !== '' && !partners.some((p) => p.name.toLowerCase() === partnerNameInput.trim().toLowerCase()) && (
                        <div className="sm:col-span-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800 animate-in fade-in">
                          <span className="flex items-center space-x-2 font-semibold">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Le patient nommé <strong>"{partnerNameInput}"</strong> n'est pas enregistré.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openPatientCreationModal(partnerNameInput, ndm)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded text-[11px] transition"
                          >
                            Créer la Fiche Patient
                          </button>
                        </div>
                      )}


                      {/* NDM */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">N° Dossier Patient (NDM)</label>
                        <input
                          type="text"
                          list="ndm-invoice-datalist"
                          placeholder="N° de dossier"
                          value={ndm}
                          onChange={(e) => handleSelectNdm(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-slate-800 transition"
                        />
                        <datalist id="ndm-invoice-datalist">
                          {partners
                            .filter((p) => p.ndm)
                            .map((p) => (
                              <option key={p.id} value={p.ndm || ''} label={p.name} />
                            ))}
                        </datalist>
                      </div>

                      {/* Nom Patient */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Nom &amp; Prénoms du Patient *</label>
                        <input
                          type="text"
                          list="partners-invoice-datalist"
                          value={partnerNameInput}
                          onChange={(e) => handleSelectPartner(e.target.value)}
                          placeholder="Nom complet du patient..."
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-800 transition"
                        />
                        <datalist id="partners-invoice-datalist">
                          {partners.map((p) => (
                            <option key={p.id} value={p.name} />
                          ))}
                        </datalist>
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

                  {/* Section 2: Prise en Charge Assurance / Mutuelle (Tiers-Payeur) */}
                  <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HeartHandshake className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-900">
                          Prise en Charge Assurance / Tiers-Payeur
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
                              Organisme d'Assurance / Mutuelle
                            </label>
                            <select
                              value={insurancePartnerId || ''}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                handleSelectInsurancePartner(val);
                              }}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-medium"
                            >
                              <option value="">Sélectionner une assurance...</option>
                              {insurancePartners.map((ins) => (
                                <option key={ins.id} value={ins.id}>
                                  {ins.name} ({ins.default_coverage_rate || 80}%)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              N° de Police / Matricule Assuré
                            </label>
                            <input
                              type="text"
                              placeholder="N° police"
                              value={insurancePolicyNumber}
                              onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Taux de Couverture Conventionné
                            </label>
                            <div className="flex items-center space-x-1">
                              {[70, 80, 90, 100].map((rate) => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={() => setInsuranceCoverageRate(rate)}
                                  className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                                    insuranceCoverageRate === rate
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {rate}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Tableau des Analyses & Prestations Médicales */}
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
                          <span>+ Ajouter Ligne</span>
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
                                p.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                                (p.default_code && p.default_code.toLowerCase().includes(catalogueSearch.toLowerCase()));
                              
                              const matchesDept = catalogueDept === 'all' || p.lab_department === catalogueDept;
                              
                              return matchesSearch && matchesDept;
                            });

                            return filtered.length === 0 ? (
                              <div className="col-span-full py-6 text-center text-slate-400 italic text-[11px]">
                                Aucun examen ou service trouvé pour les critères sélectionnés.
                              </div>
                            ) : (
                              filtered.slice(0, 48).map((p) => (
                                <button
                                  key={p.id}
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
                              const lineSubtotal = line.quantity * line.price_unit * (1 - line.discount / 100);

                              return (
                                <tr key={idx} className="hover:bg-slate-50/40 align-middle">
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
                                                matchedList.map((prod) => {
                                                  const codeStr = prod.default_code ? `[${prod.default_code}] ` : '';
                                                  return (
                                                    <button
                                                      key={prod.id}
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

                  {/* BOTTOM ACTION BUTTONS FOR STEP 1 */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCloseFormModal}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      Annuler
                    </button>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSaveDraftOnly}
                        className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
                      >
                        Enregistrer Brouillon
                      </button>

                      {/* MAIN VALIDATION BUTTON: Posts invoice and AUTOMATICALLY switches to payment */}
                      <button
                        type="button"
                        disabled={isSubmitting || !partnerNameInput || !partnerNameInput.trim() || lines.length === 0}
                        onClick={handleValidateInvoiceAndGoToPayment}
                        className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-black text-white rounded shadow-md flex items-center justify-center space-x-2 transition ${
                          !partnerNameInput || !partnerNameInput.trim() || lines.length === 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        <span>Valider la Facture &amp; Passer au Paiement</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
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
                      <button
                        type="button"
                        onClick={handleSkipPayment}
                        className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                      >
                        Payer plus tard (Paiement différé) →
                      </button>

                      {/* VALIDATE PAYMENT: Registers payment and AUTOMATICALLY switches to Step 3 */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleExecutePaymentAndFinish}
                        className="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded shadow-md flex items-center space-x-2 transition cursor-pointer"
                      >
                        <span>Valider le Paiement &amp; Finaliser</span>
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
                    <div className="flex justify-between">
                      <span className="text-slate-500">Montant Encaissé :</span>
                      <span className="font-bold text-slate-900">{formatFCFA(computedClientShare)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mode de Règlement :</span>
                      <span className="font-bold text-slate-900">{paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500">N° Ordre Laboratoire :</span>
                      <span className="font-bold text-slate-900">{transmittedLabOrderNumber || `LAB-${new Date().getFullYear()}-0028`}</span>
                    </div>
                  </div>

                  {/* Main Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingMove) onOpenPdf(editingMove);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>Imprimer le Reçu / Facture PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleCloseFormModal();
                        if (onFinishAndReturnToSession) onFinishAndReturnToSession();
                      }}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Fermer & Terminer</span>
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
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold underline"
                    >
                      Fermer &amp; Voir la Liste des Factures
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* SAFE IN-APP DELETE MODAL */}
      {moveToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
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
                    const profile = getUserBillingProfile(currentUser);
                    if (moveToDelete.state === 'posted' && profile !== 'superviseur') {
                      alert("Action restreinte : Seul le Superviseur Caisse / Facture a le droit d'agir (modifier, supprimer ou annuler) sur les factures et encaissements validés. Veuillez soumettre votre demande au Superviseur.");
                      setMoveToDelete(null);
                      return;
                    }
                    await onDeleteMove(moveToDelete.id);
                    setMoveToDelete(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded transition shadow-xs"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATION DOSSIER PATIENT MODAL (Inspired by Reference UI) */}
      {isCreatePatientOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
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
        </div>
      )}
      {/* Modal: Require Session Before Invoice Creation */}
      {showRequireSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              {onNavigateToSessions && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRequireSessionModal(false);
                    onNavigateToSessions();
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {profile === 'facture' ? 'Ouvrir ma Session de Facturation' : 'Ouvrir ma Session'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
