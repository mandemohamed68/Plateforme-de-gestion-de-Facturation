import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Stethoscope,
  Activity,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pill,
  Microscope,
  Printer,
  X,
  FileSpreadsheet,
  FolderOpen,
  Send,
  Check,
  ShieldCheck,
  UserCheck,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Filter,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Thermometer,
  Heart,
  Scale,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  MedicalConsultation,
  ResPartner,
  CompanySettings,
  ProductTemplate,
  MedicalVitals,
  ResUser,
  AccountMove
} from '../types';
import { ReferralModal, ExternalPrescriptionModal } from './ClinicalModals';
import { InvoicePdfModal } from './InvoicePdfModal';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

interface ConsultationsViewProps {
  company: CompanySettings;
  partners: ResPartner[];
  products: any[];
  currentUser: ResUser | null;
  initialConsultation?: MedicalConsultation | null;
  onSelectConsultation?: (consultation: MedicalConsultation | null) => void;
  onClearInitialConsultation?: () => void;
  onNavigateToInvoices?: () => void;
  onNavigateToLab?: () => void;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

export interface SelectedDiagnosis {
  id: string;
  code: string;
  name: string;
  is_primary?: boolean;
}

export interface Icd10CatalogItem {
  code: string;
  name: string;
  category: string;
}

export const ICD10_CATALOG: Icd10CatalogItem[] = [
  // Paludisme & Fièvres tropicales
  { code: 'B54', name: 'Paludisme simple (Accès palustre à P. falciparum)', category: 'Infectieux & Fièvres' },
  { code: 'B50.0', name: 'Paludisme grave avec complications neurologiques', category: 'Infectieux & Fièvres' },
  { code: 'A01.0', name: 'Fièvre typhoïde (Salmonellose)', category: 'Infectieux & Fièvres' },
  { code: 'A90', name: 'Dengue classique', category: 'Infectieux & Fièvres' },
  { code: 'R50.9', name: 'Fièvre d\'origine indéterminée', category: 'Infectieux & Fièvres' },

  // Respiratoire & ORL
  { code: 'J06.9', name: 'Infection Aiguë des Voies Respiratoires Supérieures (Rhinopharyngite)', category: 'Respiratoire & ORL' },
  { code: 'J20.9', name: 'Bronchite Aiguë Infectieuse', category: 'Respiratoire & ORL' },
  { code: 'J18.9', name: 'Pneumopathie Aiguë Communautaire', category: 'Respiratoire & ORL' },
  { code: 'J02.9', name: 'Angine / Pharyngite Aiguë', category: 'Respiratoire & ORL' },
  { code: 'J01.9', name: 'Sinusite Aiguë', category: 'Respiratoire & ORL' },
  { code: 'J45.9', name: 'Asthme bronchique en crise', category: 'Respiratoire & ORL' },

  // Cardio-Vasculaire & Métabolisme
  { code: 'I10', name: 'Hypertension Artérielle Essentielle (HTA)', category: 'Cardio & Métabolisme' },
  { code: 'E11.9', name: 'Diabète Sucré de Type 2 non compliqué', category: 'Cardio & Métabolisme' },
  { code: 'E10.9', name: 'Diabète Sucré de Type 1 (Insulino-dépendant)', category: 'Cardio & Métabolisme' },
  { code: 'I20.9', name: 'Angor / Cardiopathie Ischémique', category: 'Cardio & Métabolisme' },
  { code: 'I50.9', name: 'Insuffisance Cardiaque Globale', category: 'Cardio & Métabolisme' },
  { code: 'E66.9', name: 'Obésité morbide', category: 'Cardio & Métabolisme' },

  // Digestif & Gastro-entérologie
  { code: 'A09', name: 'Gastro-entérite Aiguë & Diarrhée Infectieuse', category: 'Digestif & Abdomen' },
  { code: 'K29.7', name: 'Gastrite / Ulcère Gastroduodénal', category: 'Digestif & Abdomen' },
  { code: 'K35.8', name: 'Appendicite Aiguë (Suspicion chirurgicale)', category: 'Digestif & Abdomen' },
  { code: 'K80.2', name: 'Lithiase biliaire sans cholécystite', category: 'Digestif & Abdomen' },
  { code: 'K52.9', name: 'Colopathie fonctionnelle / Troubles du transit', category: 'Digestif & Abdomen' },

  // Urinaire & Néphrologie
  { code: 'N39.0', name: 'Infection Urinaire Basse (Cystite)', category: 'Néphro & Urinaire' },
  { code: 'N10', name: 'Pyélonéphrite Aiguë', category: 'Néphro & Urinaire' },
  { code: 'N20.1', name: 'Colique Néphrétique (Lithiase urinaire)', category: 'Néphro & Urinaire' },

  // Hématologie, Pédiatrie & Autres
  { code: 'D50.9', name: 'Anémie Ferriprive / Carentielle', category: 'Hématologie & Général' },
  { code: 'D57.1', name: 'Drépanocytose en crise vaso-occlusive', category: 'Hématologie & Général' },
  { code: 'L03.9', name: 'Cellulite bactérienne / Érysipèle', category: 'Dermatologie' },
  { code: 'M54.5', name: 'Lombalgie aiguë commune', category: 'Rhumatologie' },
  { code: 'G43.9', name: 'Migraine / Céphalée de tension', category: 'Neurologie' },
];

export const COMMON_LAB_CATALOG = [
  { id: 'nfs', name: 'Numération Formule Sanguine (NFS)', price: 6000, tube: 'Tube EDTA', default_inst: 'Prélèvement standard sur tube violet' },
  { id: 'tdr_palu', name: 'TDR Paludisme / Goutte Épaisse (GE)', price: 3500, tube: 'Sang capillaire / EDTA', default_inst: 'Recherche immédiate de Plasmodium' },
  { id: 'glycemie', name: 'Glycémie à jeun (G0)', price: 3000, tube: 'Tube Fluorure', default_inst: 'Prélèvement impératif à jeun le matin' },
  { id: 'creat', name: 'Créatininémie + Clairance DFG', price: 4000, tube: 'Tube Sec', default_inst: 'Évaluation de la fonction rénale' },
  { id: 'iono', name: 'Ionogramme Sanguin complet (Na+, K+, Cl-)', price: 7500, tube: 'Tube Héparine', default_inst: 'Bilan électrolytique complet' },
  { id: 'transa', name: 'Transaminases ASAT / ALAT', price: 6000, tube: 'Tube Sec', default_inst: 'Bilan de cytolyse hépatique' },
  { id: 'crp', name: 'Protéine C-Réactive (CRP quantitative)', price: 5000, tube: 'Tube Sec', default_inst: 'Marqueur d\'inflammation aiguë' },
  { id: 'ecbu', name: 'ECBU + Antibiogramme', price: 10000, tube: 'Flacon stérile', default_inst: 'Prélèvement des urines mi-jet au réveil' },
  { id: 'widal', name: 'Sérodiagnostic de Widal & Félix (Typhoïde)', price: 5000, tube: 'Tube Sec', default_inst: 'Suspicion de salmonellose typhique' },
  { id: 'bilan_lip', name: 'Bilan Lipidique complet (EAL)', price: 8000, tube: 'Tube Sec', default_inst: 'À jeun strict depuis 12h' },
  { id: 'tp_tca', name: 'Bilan d\'hémostase : TP / INR + TCA', price: 7000, tube: 'Tube Citrate', default_inst: 'Bilan de coagulation pré-opératoire' },
  { id: 'prot24', name: 'Protéinurie des 24 Heures', price: 4500, tube: 'Urine 24h', default_inst: 'Recueil des urines sur 24 heures entières' },
];

export const COMMON_IMAGING_CATALOG = [
  { id: 'rx_thorax', name: 'Radiographie du Thorax Face', price: 15000, category: 'Radiographie', default_inst: 'Recherche de foyer infectieux pleuro-pulmonaire' },
  { id: 'echo_abdo', name: 'Échographie Abdomino-Pelvienne', price: 20000, category: 'Échographie', default_inst: 'À jeun avec vessie pleine' },
  { id: 'echo_obste', name: 'Échographie Obstétricale T1/T2/T3', price: 18000, category: 'Échographie', default_inst: 'Datation et morphologie fœtale' },
  { id: 'tdm_cerebral', name: 'Scanner Cérébral (TDM sans injection)', price: 65000, category: 'Scanner', default_inst: 'Élimination d\'AVC ou de processus expansif' },
  { id: 'ecg_repos', name: 'Électrocardiogramme ECG 12 dérivations', price: 10000, category: 'Exploration', default_inst: 'Tracé de repos et rythme cardiaque' },
  { id: 'rx_rachis', name: 'Radiographie du Rachis Lombaire Face/Profil', price: 18000, category: 'Radiographie', default_inst: 'Bilan de discopathie ou spondylolisthésis' },
  { id: 'echo_coeur', name: 'Échocardiographie Doppler Cardiaque', price: 35000, category: 'Échographie', default_inst: 'Fonction ventriculaire gauche et valvulopathies' },
  { id: 'doppler_vein', name: 'Écho-Doppler Veineux des Membres Inférieurs', price: 30000, category: 'Échographie', default_inst: 'Suspicion de thrombose veineuse profonde (TVP)' },
  { id: 'irm_cerebrale', name: 'IRM Cérébrale', price: 95000, category: 'IRM', default_inst: 'Exploration parenchymateuse haute résolution' },
  { id: 'mammo', name: 'Mammographie Bilatérale', price: 25000, category: 'Radiographie', default_inst: 'Dépistage sénologique avec clichés agrandis' },
];

export const COMMON_MEDICATIONS_CATALOG = [
  { id: 'paracetamol', name: 'Paracétamol 1g Comprimés', dosage: '1000mg', form: 'Comprimé', default_instructions: '1 comprimé toutes les 6 heures en cas de douleur ou fièvre > 38.5°C (max 4g/j)', price: 1000 },
  { id: 'artemether', name: 'Artéméther + Luméfantrine 20/120mg (CTA)', dosage: '20/120mg', form: 'Comprimé', default_instructions: '4 comprimés à H0, H8, H24, H36, H48 et H60 pendant les repas', price: 4500 },
  { id: 'amoxicilline', name: 'Amoxicilline + Acide Clavulanique 1g', dosage: '1g/125mg', form: 'Comprimé', default_instructions: '1 comprimé matin et soir pendant 7 jours au cours des repas', price: 5500 },
  { id: 'ibuprofene', name: 'Ibuprofène 400mg Comprimés', dosage: '400mg', form: 'Comprimé', default_instructions: '1 comprimé 3 fois par jour au cours des repas pendant 5 jours', price: 1500 },
  { id: 'omeprazole', name: 'Oméprazole 20mg Gélules', dosage: '20mg', form: 'Gélule', default_instructions: '1 gélule le matin à jeun 30 minutes avant le petit-déjeuner', price: 2500 },
  { id: 'metronidazole', name: 'Métronidazole 500mg Comprimés', dosage: '500mg', form: 'Comprimé', default_instructions: '1 comprimé matin, midi et soir pendant 7 jours', price: 2000 },
  { id: 'ciprofloxacine', name: 'Ciprofloxacine 500mg Comprimés', dosage: '500mg', form: 'Comprimé', default_instructions: '1 comprimé matin et soir pendant 5 jours', price: 3000 },
  { id: 'sro', name: 'Sérum de Réhydratation Orale (SRO)', dosage: '1 sachet/1L', form: 'Sachet', default_instructions: 'Diluer 1 sachet dans 1L d\'eau potable, boire par petites gorgées régulières', price: 1000 },
  { id: 'amlodipine', name: 'Amlodipine 5mg Comprimés', dosage: '5mg', form: 'Comprimé', default_instructions: '1 comprimé le matin en prise unique quotidienne', price: 3000 },
  { id: 'metformine', name: 'Metformine 850mg Comprimés', dosage: '850mg', form: 'Comprimé', default_instructions: '1 comprimé au milieu des 2 principaux repas', price: 3500 },
  { id: 'ceftriaxone', name: 'Ceftriaxone 1g Poudre Injectable', dosage: '1g IV/IM', form: 'Injectable', default_instructions: '1 injection IV lente par jour pendant 5 jours', price: 4000 },
  { id: 'salbutamol', name: 'Salbutamol 100µg Aérosol doseur', dosage: '100µg/bouffée', form: 'Spray', default_instructions: '2 bouffées en inhalation en cas de dyspnée ou sifflement', price: 4500 },
];

export const ConsultationsView: React.FC<ConsultationsViewProps> = ({
  company,
  partners: initialPartners,
  products,
  currentUser,
  initialConsultation,
  onSelectConsultation,
  onClearInitialConsultation,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'cabinet' | 'history'>('cabinet');

  // Datasets
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([]);
  const [partners, setPartners] = useState<ResPartner[]>(initialPartners);
  const [loading, setLoading] = useState<boolean>(true);

  // Queue filter & search
  const [queueFilter, setQueueFilter] = useState<'all' | 'ready' | 'in_consultation' | 'pending_payment' | 'referred'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Active Patient in Doctor's workstation
  const [activeConsultation, setActiveConsultation] = useState<MedicalConsultation | null>(null);

  // 3-Step Consultation Workstation Navigation (1: Vitals & Triage, 2: Clinical & CIM-10, 3: Prescriptions & Circuit)
  const [consultationStep, setConsultationStep] = useState<1 | 2 | 3>(1);

  // Ergonomic Full-Width Workspace Toggle
  const [hideQueue, setHideQueue] = useState<boolean>(false);

  // Vitals State
  const [vTemp, setVTemp] = useState<string>('37.0');
  const [vSys, setVSys] = useState<string>('120');
  const [vDia, setVDia] = useState<string>('80');
  const [vHR, setVHR] = useState<string>('75');
  const [vWt, setVWt] = useState<string>('70');
  const [vHt, setVHt] = useState<string>('170');
  const [vSpo2, setVSpo2] = useState<string>('98');
  const [vSugar, setVSugar] = useState<string>('0.95');

  // Clinical Examination & Observations
  const [clinicalComplaint, setClinicalComplaint] = useState<string>('');
  const [clinicalHistory, setClinicalHistory] = useState<string>('');
  const [clinicalExam, setClinicalExam] = useState<string>('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState<string>('');
  const [clinicalDiagnosisCode, setClinicalDiagnosisCode] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');

  // Multi-Selection & Manual Entry of ICD-10 Diagnostics
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [diagCategoryFilter, setDiagCategoryFilter] = useState<string>('all');
  const [diagSearchQuery, setDiagSearchQuery] = useState<string>('');
  const [manualDiagCode, setManualDiagCode] = useState<string>('');
  const [manualDiagName, setManualDiagName] = useState<string>('');
  const [manualDiagIsPrimary, setManualDiagIsPrimary] = useState<boolean>(false);

  // Prescriptions (Sub-tabs, Multi-selection & Manual Entry)
  const [prescSubTab, setPrescSubTab] = useState<'all' | 'lab' | 'imaging' | 'medication'>('all');
  const [activePrescriptions, setActivePrescriptions] = useState<any[]>([]);

  // Manual Lab Exam inputs
  const [manualLabName, setManualLabName] = useState<string>('');
  const [manualLabTube, setManualLabTube] = useState<string>('Tube EDTA');
  const [manualLabInstructions, setManualLabInstructions] = useState<string>('Prélèvement sanguin standard');
  const [manualLabPrice, setManualLabPrice] = useState<number>(5000);

  // Manual Imaging inputs
  const [manualImgName, setManualImgName] = useState<string>('');
  const [manualImgCategory, setManualImgCategory] = useState<string>('Radiographie');
  const [manualImgInstructions, setManualImgInstructions] = useState<string>('Bilan radiologique estándar');
  const [manualImgPrice, setManualImgPrice] = useState<number>(18000);

  // Manual Medication inputs
  const [medInputName, setMedInputName] = useState<string>('');
  const [medInputDosage, setMedInputDosage] = useState<string>('500mg');
  const [medInputForm, setMedInputForm] = useState<string>('Comprimé');
  const [medInputQty, setMedInputQty] = useState<number>(1);
  const [medInputInstructions, setMedInputInstructions] = useState<string>('1 comprimé matin, midi et soir pendant 5 jours');
  const [medInputPrice, setMedInputPrice] = useState<number>(2000);

  // Patient circuit choice: true = Circuit Interne (Hôpital), false = Circuit Externe (Ville)
  const [patientCircuitAgreed, setPatientCircuitAgreed] = useState<boolean>(true);

  // Modals
  const [selectedDmePartner, setSelectedDmePartner] = useState<ResPartner | null>(null);
  const [showDmeModal, setShowDmeModal] = useState<boolean>(false);

  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [referralConsultation, setReferralConsultation] = useState<MedicalConsultation | null>(null);

  const [showExternalModal, setShowExternalModal] = useState<boolean>(false);
  const [externalModalConsultation, setExternalModalConsultation] = useState<MedicalConsultation | null>(null);
  const [externalModalItems, setExternalModalItems] = useState<any[]>([]);

  const [selectedReceiptMove, setSelectedReceiptMove] = useState<AccountMove | null>(null);

  // Notification Banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [resConsultations, resPartners] = await Promise.all([
        fetch('/api/consultations').catch(() => null),
        fetch('/api/partners').catch(() => null)
      ]);

      if (resConsultations && resConsultations.ok) {
        const data = await resConsultations.json().catch(() => null);
        if (Array.isArray(data)) setConsultations(data);
      }
      if (resPartners && resPartners.ok) {
        const data = await resPartners.json().catch(() => null);
        if (Array.isArray(data)) setPartners(data);
      }
    } catch (err: any) {
      console.warn('Erreur chargement données cliniques (mode autonome):', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select initialConsultation passed from queue / parent views
  useEffect(() => {
    if (initialConsultation) {
      handleSelectPatientFromQueue(initialConsultation);
      setActiveTab('cabinet');
    }
  }, [initialConsultation?.id]);

  const calculatedBmi = () => {
    const w = parseFloat(vWt);
    const h = parseFloat(vHt) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  const handleSelectPatientFromQueue = (consult: MedicalConsultation) => {
    if (consult.status === 'pending_payment' || (consult.has_pending_balance && !consult.reliquat_paid)) {
      if (onShowToast) {
        onShowToast("Ce patient n'a pas encore acquitté son droit de consultation ou reliquat. Orientation requise vers la Facturation et la Caisse.", 'warning', 'Paiement Requis');
      } else {
        alert("Ce patient n'a pas encore acquitté son droit de consultation ou reliquat à la Caisse.");
      }
      return;
    }

    if (consult.status === 'waiting' || consult.status === 'triage') {
      fetch(`/api/consultations/${consult.id}/start`, { method: 'POST' }).catch(() => {});
      consult.status = 'in_consultation';
    }

    setActiveConsultation(consult);
    if (onSelectConsultation) {
      onSelectConsultation(consult);
    }
    setConsultationStep(1);
    setSuccessBanner(null);

    setVTemp(consult.vitals?.temperature?.toString() || '37.0');
    setVSys(consult.vitals?.bp_systolic?.toString() || '120');
    setVDia(consult.vitals?.bp_diastolic?.toString() || '80');
    setVHR(consult.vitals?.heart_rate?.toString() || '75');
    setVWt(consult.vitals?.weight?.toString() || '70');
    setVHt(consult.vitals?.height?.toString() || '170');
    setVSpo2(consult.vitals?.spo2?.toString() || '98');
    setVSugar(consult.vitals?.blood_sugar?.toString() || '0.95');

    setClinicalComplaint(consult.chief_complaint || '');
    setClinicalHistory(consult.history_of_present_illness || '');
    setClinicalExam(consult.physical_examination || '');
    setClinicalDiagnosis(consult.diagnosis || '');
    setClinicalDiagnosisCode(consult.diagnosis_code || '');
    setClinicalNotes(consult.medical_notes || '');

    // Parse existing diagnoses into selectedDiagnoses
    const initialDiags: SelectedDiagnosis[] = [];
    if (consult.diagnosis) {
      const parts = consult.diagnosis.split(';');
      const codeParts = (consult.diagnosis_code || '').split(',').map(c => c.trim());
      parts.forEach((p, idx) => {
        const trimmed = p.trim();
        if (trimmed) {
          initialDiags.push({
            id: `diag-init-${idx}-${Date.now()}`,
            code: codeParts[idx] || '',
            name: trimmed,
            is_primary: idx === 0
          });
        }
      });
    }
    setSelectedDiagnoses(initialDiags);

    setActivePrescriptions((consult.prescribed_items || []).filter(i => i.type !== 'act'));
    setPatientCircuitAgreed(true);
  };

  const handleApplyClinicalTemplate = (templateType: 'malaria' | 'bronchitis' | 'diabetes') => {
    const newItems: any[] = [];

    if (templateType === 'malaria') {
      setVTemp('39.2');
      setVSys('115');
      setVDia('75');
      setVHR('98');
      setClinicalComplaint("Fièvre élevée frissonnante, sueurs nocturnes, céphalées intenses et courbatures.");
      setClinicalDiagnosis("Paludisme simple (Accès palustre à P. falciparum)");
      setClinicalDiagnosisCode("B54");
      setSelectedDiagnoses([
        { id: `diag-b54-${Date.now()}`, code: 'B54', name: 'Paludisme simple (Accès palustre à P. falciparum)', is_primary: true }
      ]);
      setClinicalNotes("Hydratation abondante, repos strict. Surveillance biologique.");

      const tdrProd = products.find(p => p.name.toLowerCase().includes("tdr") || p.name.toLowerCase().includes("palu"));
      const nfsProd = products.find(p => p.name.toLowerCase().includes("nfs") || p.name.toLowerCase().includes("hémogramme") || p.name.toLowerCase().includes("sang"));

      newItems.push({
        id: `lab-tdr-${Date.now()}-${Math.random()}`,
        type: 'lab_exam',
        product_id: tdrProd?.id || 12,
        name: tdrProd?.name || "TDR Paludisme / Goutte Épaisse",
        price_unit: tdrProd?.list_price || 3500,
        quantity: 1,
        total_price: tdrProd?.list_price || 3500,
        instructions: "Prélèvement immédiat au laboratoire"
      });

      newItems.push({
        id: `lab-nfs-${Date.now()}-${Math.random()}`,
        type: 'lab_exam',
        product_id: nfsProd?.id || 13,
        name: nfsProd?.name || "Numération Formule Sanguine (NFS)",
        price_unit: nfsProd?.list_price || 6000,
        quantity: 1,
        total_price: nfsProd?.list_price || 6000,
        instructions: "Tube EDTA standard"
      });

      newItems.push({
        id: `med-artem-${Date.now()}-${Math.random()}`,
        type: 'medication',
        name: "Artéméther + Luméfantrine 20/120mg",
        price_unit: 4500,
        quantity: 1,
        total_price: 4500,
        dosage: "20/120mg",
        instructions: "4 comprimés à H0, H8, H24, H36, H48 et H60 pendant les repas"
      });

      newItems.push({
        id: `med-parac-${Date.now()}-${Math.random()}`,
        type: 'medication',
        name: "Paracétamol 1g Comprimés",
        price_unit: 1000,
        quantity: 1,
        total_price: 1000,
        dosage: "1000mg",
        instructions: "1 comprimé toutes les 6 heures en cas de fièvre > 38.5°C"
      });
    } else if (templateType === 'bronchitis') {
      setVTemp('38.1');
      setVSys('120');
      setVDia('80');
      setVHR('84');
      setClinicalComplaint("Toux grasse productive, expectorations mucopurulentes, râles bronchiques.");
      setClinicalDiagnosis("Bronchite Aiguë Infectieuse");
      setClinicalDiagnosisCode("J20.9");
      setSelectedDiagnoses([
        { id: `diag-j20-${Date.now()}`, code: 'J20.9', name: 'Bronchite Aiguë Infectieuse', is_primary: true }
      ]);
      setClinicalNotes("Surveillance température, repos.");

      newItems.push({
        id: `img-rx-${Date.now()}-${Math.random()}`,
        type: 'imaging',
        name: "Radiographie du Thorax Face",
        price_unit: 15000,
        quantity: 1,
        total_price: 15000,
        instructions: "Recherche de foyer alvéolaire"
      });

      newItems.push({
        id: `med-amox-${Date.now()}-${Math.random()}`,
        type: 'medication',
        name: "Amoxicilline + Acide Clavulanique 1g",
        price_unit: 5500,
        quantity: 1,
        total_price: 5500,
        dosage: "1g/125mg",
        instructions: "1 comprimé matin et soir pendant 7 jours au cours des repas"
      });
    } else if (templateType === 'diabetes') {
      setVTemp('37.0');
      setVSys('152');
      setVDia('94');
      setVHR('72');
      setClinicalComplaint("Polyurie, polydipsie, fatigue marquée et céphalées.");
      setClinicalDiagnosis("Diabète type 2 & Hypertension Artérielle");
      setClinicalDiagnosisCode("E11 / I10");
      setSelectedDiagnoses([
        { id: `diag-e11-${Date.now()}`, code: 'E11.9', name: 'Diabète Sucré de Type 2 non compliqué', is_primary: true },
        { id: `diag-i10-${Date.now()}`, code: 'I10', name: 'Hypertension Artérielle Essentielle (HTA)', is_primary: false }
      ]);
      setClinicalNotes("Régime hyposodé, hypocalorique. Contrôle glycémique régulier.");

      const glyProd = products.find(p => p.name.toLowerCase().includes("glyc") || p.name.toLowerCase().includes("gluc"));

      newItems.push({
        id: `lab-gly-${Date.now()}-${Math.random()}`,
        type: 'lab_exam',
        product_id: glyProd?.id || 14,
        name: glyProd?.name || "Glycémie à jeun",
        price_unit: glyProd?.list_price || 3000,
        quantity: 1,
        total_price: glyProd?.list_price || 3000,
        instructions: "Prélèvement à jeun le matin"
      });

      newItems.push({
        id: `med-amlo-${Date.now()}-${Math.random()}`,
        type: 'medication',
        name: "Amlodipine 5mg",
        price_unit: 3000,
        quantity: 1,
        total_price: 3000,
        dosage: "5mg",
        instructions: "1 comprimé le matin"
      });
    }

    setActivePrescriptions(newItems);
  };

  // Diagnostic multi-selection and manual handlers
  const handleToggleIcd10Diagnosis = (item: { code: string; name: string }) => {
    const existing = selectedDiagnoses.find(d => d.code === item.code || d.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      setSelectedDiagnoses(prev => prev.filter(d => d.id !== existing.id));
    } else {
      const isFirst = selectedDiagnoses.length === 0;
      setSelectedDiagnoses(prev => [
        ...prev,
        {
          id: `diag-${item.code || Date.now()}-${Math.random()}`,
          code: item.code,
          name: item.name,
          is_primary: isFirst
        }
      ]);
    }
  };

  const handleAddManualDiagnosis = () => {
    if (!manualDiagName.trim()) return;
    const isFirst = selectedDiagnoses.length === 0 || manualDiagIsPrimary;
    let updated = [...selectedDiagnoses];
    if (isFirst && manualDiagIsPrimary) {
      updated = updated.map(d => ({ ...d, is_primary: false }));
    }
    updated.push({
      id: `diag-manual-${Date.now()}`,
      code: manualDiagCode.trim().toUpperCase(),
      name: manualDiagName.trim(),
      is_primary: isFirst
    });
    setSelectedDiagnoses(updated);
    setManualDiagCode('');
    setManualDiagName('');
    setManualDiagIsPrimary(false);
  };

  const handleSetPrimaryDiagnosis = (id: string) => {
    setSelectedDiagnoses(prev =>
      prev.map(d => ({ ...d, is_primary: d.id === id }))
    );
  };

  const handleRemoveDiagnosis = (id: string) => {
    setSelectedDiagnoses(prev => {
      const remaining = prev.filter(d => d.id !== id);
      if (remaining.length > 0 && !remaining.some(d => d.is_primary)) {
        remaining[0].is_primary = true;
      }
      return remaining;
    });
  };

  // Prescriptions quick and manual handlers
  const handleAddQuickLab = (exam: typeof COMMON_LAB_CATALOG[0]) => {
    const isAlready = activePrescriptions.some(p => p.type === 'lab_exam' && p.name.toLowerCase() === exam.name.toLowerCase());
    if (isAlready) {
      setActivePrescriptions(prev => prev.filter(p => !(p.type === 'lab_exam' && p.name.toLowerCase() === exam.name.toLowerCase())));
      return;
    }
    const matchingProd = products.find(p => p.name.toLowerCase().includes(exam.id) || p.name.toLowerCase().includes(exam.name.toLowerCase()));
    const newItem = {
      id: `lab-${Date.now()}-${Math.random()}`,
      type: 'lab_exam',
      product_id: matchingProd?.id || 10,
      name: exam.name,
      price_unit: matchingProd?.list_price || exam.price,
      quantity: 1,
      total_price: matchingProd?.list_price || exam.price,
      instructions: `${exam.tube} • ${exam.default_inst}`
    };
    setActivePrescriptions(prev => [...prev, newItem]);
  };

  const handleAddManualLab = () => {
    if (!manualLabName.trim()) return;
    const newItem = {
      id: `lab-manual-${Date.now()}`,
      type: 'lab_exam',
      name: manualLabName.trim(),
      price_unit: manualLabPrice,
      quantity: 1,
      total_price: manualLabPrice,
      instructions: `${manualLabTube} • ${manualLabInstructions.trim()}`
    };
    setActivePrescriptions(prev => [...prev, newItem]);
    setManualLabName('');
  };

  const handleAddQuickImaging = (img: typeof COMMON_IMAGING_CATALOG[0]) => {
    const isAlready = activePrescriptions.some(p => p.type === 'imaging' && p.name.toLowerCase() === img.name.toLowerCase());
    if (isAlready) {
      setActivePrescriptions(prev => prev.filter(p => !(p.type === 'imaging' && p.name.toLowerCase() === img.name.toLowerCase())));
      return;
    }
    const newItem = {
      id: `img-${Date.now()}-${Math.random()}`,
      type: 'imaging',
      name: img.name,
      price_unit: img.price,
      quantity: 1,
      total_price: img.price,
      instructions: `${img.category} : ${img.default_inst}`
    };
    setActivePrescriptions(prev => [...prev, newItem]);
  };

  const handleAddManualImaging = () => {
    if (!manualImgName.trim()) return;
    const newItem = {
      id: `img-manual-${Date.now()}`,
      type: 'imaging',
      name: manualImgName.trim(),
      price_unit: manualImgPrice,
      quantity: 1,
      total_price: manualImgPrice,
      instructions: `${manualImgCategory} • ${manualImgInstructions.trim()}`
    };
    setActivePrescriptions(prev => [...prev, newItem]);
    setManualImgName('');
  };

  const handleAddQuickMed = (med: typeof COMMON_MEDICATIONS_CATALOG[0]) => {
    const isAlready = activePrescriptions.some(p => p.type === 'medication' && p.name.toLowerCase() === med.name.toLowerCase());
    if (isAlready) {
      setActivePrescriptions(prev => prev.filter(p => !(p.type === 'medication' && p.name.toLowerCase() === med.name.toLowerCase())));
      return;
    }
    const newItem = {
      id: `med-${Date.now()}-${Math.random()}`,
      type: 'medication',
      name: med.name,
      price_unit: med.price,
      quantity: 1,
      total_price: med.price,
      dosage: med.dosage,
      instructions: med.default_instructions
    };
    setActivePrescriptions(prev => [...prev, newItem]);
  };

  const handleAddManualMed = () => {
    if (!medInputName.trim()) return;
    const newItem = {
      id: `med-manual-${Date.now()}`,
      type: 'medication',
      name: `${medInputName.trim()} (${medInputForm})`,
      price_unit: medInputPrice,
      quantity: medInputQty,
      total_price: medInputPrice * medInputQty,
      dosage: medInputDosage,
      instructions: medInputInstructions.trim()
    };
    setActivePrescriptions(prev => [...prev, newItem]);
    setMedInputName('');
  };

  const handleRemovePrescriptionItem = (itemId: string) => {
    setActivePrescriptions(prev => prev.filter(p => p.id !== itemId));
  };

  const handleSaveClinicalExamination = async () => {
    if (!activeConsultation) return;
    setLoading(true);

    const updatedVitals: MedicalVitals = {
      temperature: parseFloat(vTemp),
      bp_systolic: parseInt(vSys),
      bp_diastolic: parseInt(vDia),
      heart_rate: parseInt(vHR),
      weight: parseFloat(vWt),
      height: parseFloat(vHt),
      bmi: parseFloat(calculatedBmi()) || undefined,
      spo2: parseInt(vSpo2) || undefined,
      blood_sugar: parseFloat(vSugar) || undefined,
    };

    const combinedPrescriptions = [
      ...(activeConsultation.prescribed_items || []).filter(i => i.type === 'act'),
      ...activePrescriptions
    ];

    const formattedDiagnosis = selectedDiagnoses.length > 0
      ? selectedDiagnoses.map(d => d.name).join(' ; ')
      : clinicalDiagnosis;
    const formattedDiagnosisCode = selectedDiagnoses.length > 0
      ? selectedDiagnoses.map(d => d.code).filter(Boolean).join(', ')
      : clinicalDiagnosisCode;

    try {
      const res = await fetch(`/api/consultations/${activeConsultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          vitals: updatedVitals,
          chief_complaint: clinicalComplaint,
          diagnosis: formattedDiagnosis,
          diagnosis_code: formattedDiagnosisCode,
          history_illness: clinicalHistory,
          physical_exam: clinicalExam,
          medical_notes: clinicalNotes,
          prescribed_items: combinedPrescriptions,
          patient_choice: patientCircuitAgreed ? 'internal' : 'external'
        })
      });

      if (res.ok) {
        const confirmRes = await fetch(`/api/consultations/${activeConsultation.id}/confirm-prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_agreed: patientCircuitAgreed,
            confirmedItems: activePrescriptions,
            prescription_notes: clinicalNotes
          })
        });

        const finishedId = activeConsultation.id;
        const finishedPatientName = activeConsultation.patient_name;
        // Retrait immédiat de la file d'attente locale sans latence
        setConsultations(prev => prev.filter(c => c.id !== finishedId));
        setActiveConsultation(null);
        setActivePrescriptions([]);
        setSelectedDiagnoses([]);
        setConsultationStep(1);

        if (confirmRes.ok) {
          if (patientCircuitAgreed) {
            const msg = `Consultation validée et clôturée pour ${finishedPatientName}. Prescriptions transmises à la Facturation.`;
            setSuccessBanner(msg);
            if (onShowToast) onShowToast(msg, 'success', 'Prescriptions Transmises');
          } else {
            setExternalModalConsultation(activeConsultation);
            setExternalModalItems(activePrescriptions);
            setShowExternalModal(true);
            const msg = `Consultation clôturée pour ${finishedPatientName}. Ordonnance externe délivrée.`;
            setSuccessBanner(msg);
            if (onShowToast) onShowToast(msg, 'info', 'Ordonnance Externe');
          }
        }

        await loadData();
      }
    } catch (err) {
      console.error('Erreur validation consultation:', err);
      if (onShowToast) {
        onShowToast("Une erreur est survenue lors de l'enregistrement de la consultation.", 'error', 'Erreur');
      } else {
        alert("Une erreur est survenue lors de l'enregistrement de la consultation.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clinicalQueue = consultations.filter(c => {
    if (c.status === 'completed' || c.status === 'cancelled') return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = c.patient_name?.toLowerCase().includes(term);
      const matchNdm = c.patient_ndm?.toLowerCase().includes(term);
      if (!matchName && !matchNdm) return false;
    }

    const isPendingPayment = c.status === 'pending_payment' || (c.has_pending_balance && !c.reliquat_paid);
    const isReferred = Boolean(c.referred_from || c.referral_reason || (c as any).referred_to_doctor || c.status === 'referred');
    const isInConsultation = c.status === 'in_consultation';

    if (queueFilter === 'ready') return !isPendingPayment && !isInConsultation;
    if (queueFilter === 'in_consultation') return isInConsultation;
    if (queueFilter === 'pending_payment') return isPendingPayment;
    if (queueFilter === 'referred') return isReferred;

    return true;
  });

  const completedConsultations = consultations.filter(c => c.status === 'completed');

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      
      {/* Sober, Professional Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Système Hospitalier • Service Médical
            </span>
            <span className="text-xs font-medium text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-600">
              Dr. {currentUser?.name || 'Médecin Praticien'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Poste de Consultation & Prescriptions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Rôle clinique : Anamnèse, examen physique, diagnostic CIM-10 et prescriptions. La facturation et l&apos;encaissement sont assurés par les services administratifs.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedDmePartner(partners[0] || null);
            setShowDmeModal(true);
          }}
          className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition border border-slate-200 shadow-xs"
        >
          <FolderOpen className="w-4 h-4 text-slate-500" />
          <span>Dossier Médical (DME)</span>
        </button>
      </div>

      {/* Sober Notification Banner */}
      {successBanner && (
        <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-slate-700 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('cabinet')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'cabinet'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Cabinet & File d&apos;Attente</span>
          <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {clinicalQueue.filter(c => c.status !== 'pending_payment' && !c.has_pending_balance).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Historique des Consultations</span>
          <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {completedConsultations.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CABINET MÉDICAL & FILE D'ATTENTE */}
      {activeTab === 'cabinet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Waiting Room & Patient Queue */}
          {!hideQueue && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 flex flex-col h-[75vh]">
              <div className="border-b border-slate-100 pb-3 mb-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Salle d&apos;attente ({clinicalQueue.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setHideQueue(true)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition text-[11px] flex items-center gap-1"
                    title="Masquer la file pour agrandir l'espace de consultation"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Réduire</span>
                  </button>
                </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher patient, NDM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-medium">
                <button
                  onClick={() => setQueueFilter('all')}
                  className={`px-2 py-1 rounded-md border transition whitespace-nowrap ${
                    queueFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tous ({consultations.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length})
                </button>
                <button
                  onClick={() => setQueueFilter('in_consultation')}
                  className={`px-2 py-1 rounded-md border transition whitespace-nowrap ${
                    queueFilter === 'in_consultation'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  En cours ({consultations.filter(c => c.status === 'in_consultation').length})
                </button>
                <button
                  onClick={() => setQueueFilter('ready')}
                  className={`px-2 py-1 rounded-md border transition whitespace-nowrap ${
                    queueFilter === 'ready'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Prêts ({consultations.filter(c => c.status !== 'completed' && c.status !== 'cancelled' && c.status !== 'pending_payment' && !c.has_pending_balance && c.status !== 'in_consultation').length})
                </button>
                <button
                  onClick={() => setQueueFilter('referred')}
                  className={`px-2 py-1 rounded-md border transition whitespace-nowrap ${
                    queueFilter === 'referred'
                      ? 'bg-purple-800 text-white border-purple-800'
                      : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  Référés ({consultations.filter(c => Boolean(c.referred_from || c.referral_reason || (c as any).referred_to_doctor || c.status === 'referred')).length})
                </button>
                <button
                  onClick={() => setQueueFilter('pending_payment')}
                  className={`px-2 py-1 rounded-md border transition whitespace-nowrap ${
                    queueFilter === 'pending_payment'
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Attente Caisse
                </button>
              </div>
            </div>

            {/* Patients List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {clinicalQueue.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Aucun patient en attente dans cette catégorie.
                </div>
              ) : (
                clinicalQueue.map(c => {
                  const isUnpaid = c.status === 'pending_payment' || (c.has_pending_balance && !c.reliquat_paid);
                  const isSelected = activeConsultation?.id === c.id;
                  const isInConsult = c.status === 'in_consultation';
                  const isReferredPatient = Boolean(c.referred_from || c.referral_reason || (c as any).referred_to_doctor);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectPatientFromQueue(c)}
                      className={`p-3 border rounded-lg text-left transition relative ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900 shadow-xs'
                          : isInConsult
                          ? 'border-blue-300 bg-blue-50/40 hover:bg-blue-50 cursor-pointer'
                          : isUnpaid
                          ? 'border-slate-200 bg-slate-50/60 opacity-80 hover:opacity-100 cursor-pointer'
                          : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 text-xs block">{c.patient_name}</span>
                            {isInConsult && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                En charge
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            NDM: {c.patient_ndm || 'NDM-000'} • {c.patient_gender}, {c.patient_age} ans
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {c.specialty || 'Générale'}
                        </span>
                      </div>

                      {isReferredPatient && (
                        <div className="mt-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          Référé: {c.referred_from || c.referral_reason || 'Par l\'équipe de soins'}
                        </div>
                      )}

                      {c.chief_complaint && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                          {c.chief_complaint}
                        </p>
                      )}

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        {isUnpaid ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium">
                            Attente Quittance Caisse
                          </span>
                        ) : isInConsult ? (
                          <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <Activity className="w-2.5 h-2.5 text-blue-700" />
                            Prise en charge active
                          </span>
                        ) : (
                          <span className="text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-slate-700" />
                            Quittancé Caisse
                          </span>
                        )}

                        {c.vitals?.temperature && (
                          <span className="text-slate-500 font-medium font-mono text-[10px]">
                            T° {c.vitals.temperature}°C {c.vitals?.bp_systolic ? `| TA ${c.vitals.bp_systolic}/${c.vitals.bp_diastolic}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Column: Doctor Consultation Workstation (Full-width when queue hidden) */}
        <div className={`${hideQueue ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white border border-slate-200 rounded-lg p-5 flex flex-col h-[75vh] overflow-y-auto`}>
          {activeConsultation ? (
            <div className="space-y-4">
              
              {/* Patient Summary & Ergonomic Workspace Controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-sm">{activeConsultation.patient_name}</h2>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded">
                      Quittance Caisse Acquittée
                    </span>
                    {activeConsultation.referred_from && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-300">
                        Référé : {activeConsultation.referred_from}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                    <span>NDM: <strong className="text-slate-700">{activeConsultation.patient_ndm}</strong></span>
                    <span>Sexe: {activeConsultation.patient_gender}</span>
                    <span>Âge: {activeConsultation.patient_age} ans</span>
                    <span>Prise en charge: <strong className="text-slate-700">{activeConsultation.insurance_name ? `${activeConsultation.insurance_name} (${activeConsultation.insurance_coverage_rate}%)` : 'Patient direct (100%)'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hideQueue && (
                    <button
                      type="button"
                      onClick={() => setHideQueue(false)}
                      className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition"
                      title="Réafficher la liste de la salle d'attente"
                    >
                      <PanelLeftOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Afficher File ({clinicalQueue.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setHideQueue(prev => !prev)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition"
                    title={hideQueue ? "Revenir à la vue standard scindée" : "Passer en mode large / plein écran"}
                  >
                    {hideQueue ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{hideQueue ? "Vue Scindée" : "Plein Écran"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReferralConsultation(activeConsultation);
                      setShowReferralModal(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Référer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const p = partners.find(part => part.id === activeConsultation.partner_id);
                      if (p) {
                        setSelectedDmePartner(p);
                        setShowDmeModal(true);
                      }
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>DME</span>
                  </button>
                </div>
              </div>

              {/* 3-Section Stepper / Modular Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setConsultationStep(1)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      consultationStep === 1
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      consultationStep === 1 ? 'bg-white text-slate-900' : 'bg-slate-300 text-slate-700'
                    }`}>
                      1
                    </span>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Constantes & Triage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationStep(2)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      consultationStep === 2
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      consultationStep === 2 ? 'bg-white text-slate-900' : 'bg-slate-300 text-slate-700'
                    }`}>
                      2
                    </span>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Examen Clinique & Diagnostics CIM-10</span>
                    {selectedDiagnoses.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        consultationStep === 2 ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {selectedDiagnoses.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationStep(3)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      consultationStep === 3
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      consultationStep === 3 ? 'bg-white text-slate-900' : 'bg-slate-300 text-slate-700'
                    }`}>
                      3
                    </span>
                    <Pill className="w-3.5 h-3.5" />
                    <span>Prescriptions Médicales & Clôture</span>
                    {activePrescriptions.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        consultationStep === 3 ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {activePrescriptions.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                  <span>Étape <strong>{consultationStep}</strong> sur <strong>3</strong></span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 1: CONSTANTES VITALES & TRIAGE */}
              {/* ========================================================================= */}
              {consultationStep === 1 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-md p-2.5">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-slate-600" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Section 1 • Constantes Physiologiques & Triage Infirmier
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Relevé initial lors de l&apos;accueil du patient. Ajustez si vous procédez à une nouvelle prise en cabinet.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConsultationStep(2)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Passer à l&apos;Examen (Étape 2)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">Température (°C)</label>
                        {parseFloat(vTemp) >= 38.0 && (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1 rounded">Fièvre</span>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={vTemp}
                        onChange={(e) => setVTemp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Normale : 36.5 - 37.5</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">PA Systolique (mmHg)</label>
                        {parseInt(vSys) >= 140 && (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1 rounded">Élevée</span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={vSys}
                        onChange={(e) => setVSys(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Normale : 110 - 130</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">PA Diastolique (mmHg)</label>
                        {parseInt(vDia) >= 90 && (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1 rounded">Élevée</span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={vDia}
                        onChange={(e) => setVDia(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Normale : 70 - 85</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">Pouls / Fréquence (bpm)</label>
                      </div>
                      <input
                        type="number"
                        value={vHR}
                        onChange={(e) => setVHR(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Normale : 60 - 90</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">Poids (kg)</label>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={vWt}
                        onChange={(e) => setVWt(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">Taille (cm)</label>
                      </div>
                      <input
                        type="number"
                        value={vHt}
                        onChange={(e) => setVHt(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">Saturation SpO2 (%)</label>
                      </div>
                      <input
                        type="number"
                        value={vSpo2}
                        onChange={(e) => setVSpo2(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Normale : 95% - 100%</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-700">Glycémie capillaire (g/L)</label>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={vSugar}
                        onChange={(e) => setVSugar(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">À jeun : 0.70 - 1.10</span>
                    </div>
                  </div>

                  {/* Calculated BMI Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-slate-500" />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">Indice de Masse Corporelle (IMC) Calculé :</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {calculatedBmi() || 'Données taille/poids requises'}
                          </span>
                          {calculatedBmi() && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-200 text-slate-700">
                              {parseFloat(calculatedBmi()) < 18.5 && 'Insuffisance pondérale'}
                              {parseFloat(calculatedBmi()) >= 18.5 && parseFloat(calculatedBmi()) < 25 && 'Corpulence normale'}
                              {parseFloat(calculatedBmi()) >= 25 && parseFloat(calculatedBmi()) < 30 && 'Surpoids'}
                              {parseFloat(calculatedBmi()) >= 30 && 'Obésité'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConsultationStep(2)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <span>Continuer vers l&apos;Examen Clinique & Diagnostics</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION 2: EXAMEN CLINIQUE & DIAGNOSTICS CIM-10 (MULTI-SÉLECTION & MANUEL) */}
              {/* ========================================================================= */}
              {consultationStep === 2 && (
                <div className="space-y-4">
                  
                  {/* Protocol Selector & Step Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-2.5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Section 2 • Anamnèse, Examen Clinique & Diagnostics CIM-10
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Sélectionnez un ou plusieurs diagnostics CIM-10, ou saisissez manuellement si le code n&apos;est pas listé.
                      </p>
                    </div>

                    {/* Quick Clinical Templates */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-500 mr-1">Protocoles rapides :</span>
                      <button
                        type="button"
                        onClick={() => handleApplyClinicalTemplate('malaria')}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] px-2 py-1 rounded transition"
                      >
                        Paludisme
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyClinicalTemplate('bronchitis')}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] px-2 py-1 rounded transition"
                      >
                        Bronchite
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyClinicalTemplate('diabetes')}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] px-2 py-1 rounded transition"
                      >
                        Diabète/HTA
                      </button>
                    </div>
                  </div>

                  {/* Motif & Anamnèse & Examen */}
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                        Motif Principal de Consultation *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex : Céphalées persistantes, syndrome grippal fébrile, lombalgie aiguë..."
                        value={clinicalComplaint}
                        onChange={(e) => setClinicalComplaint(e.target.value)}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-slate-900 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Histoire de la maladie (Anamnèse détaillée)
                        </label>
                        <textarea
                          rows={3}
                          value={clinicalHistory}
                          onChange={(e) => setClinicalHistory(e.target.value)}
                          className="w-full border border-slate-200 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-slate-900"
                          placeholder="Chronologie des symptômes, intensité, facteurs déclenchants, automédication éventuelle..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Examen Physique & Observations Cliniques
                        </label>
                        <textarea
                          rows={3}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          className="w-full border border-slate-200 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-slate-900"
                          placeholder="Auscultation cardio-pulmonaire, palpation abdominale, constantes d'alerte, antécédents..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Diagnoses Management Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-slate-700" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Diagnostics Retenus pour ce Patient ({selectedDiagnoses.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Cliquez sur &quot;Principal&quot; pour désigner le diagnostic majeur
                      </span>
                    </div>

                    {selectedDiagnoses.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedDiagnoses.map((diag) => (
                          <div
                            key={diag.id}
                            className={`flex items-center justify-between p-2.5 rounded-md border text-xs transition ${
                              diag.is_primary
                                ? 'bg-white border-slate-900 shadow-xs'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {diag.code && (
                                <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                                  {diag.code}
                                </span>
                              )}
                              <span className="font-semibold text-slate-900">{diag.name}</span>
                              {diag.is_primary ? (
                                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                                  Diagnostic Principal
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryDiagnosis(diag.id)}
                                  className="text-[10px] text-slate-500 hover:text-slate-800 underline ml-1"
                                >
                                  Définir comme principal
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveDiagnosis(diag.id)}
                              className="text-slate-400 hover:text-slate-800 p-1"
                              title="Retirer ce diagnostic"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-dashed border-slate-200 rounded text-center text-xs text-slate-500">
                        Aucun diagnostic sélectionné pour le moment. Choisissez dans le catalogue CIM-10 ci-dessous ou saisissez manuellement.
                      </div>
                    )}
                  </div>

                  {/* Multi-Selection & Search from ICD-10 Catalog */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        Catalogue & Multi-Sélection CIM-10 OMS
                      </h4>

                      {/* Live search input */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Rechercher code (ex: B54) ou nom..."
                          value={diagSearchQuery}
                          onChange={(e) => setDiagSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      {[
                        { id: 'all', label: 'Tous' },
                        { id: 'infectious', label: 'Infectieux & Paludisme' },
                        { id: 'respiratory', label: 'Respiratoire' },
                        { id: 'cardio', label: 'Cardiovasculaire' },
                        { id: 'metabolic', label: 'Diabète & Métabolisme' },
                        { id: 'digestive', label: 'Digestif' },
                        { id: 'general', label: 'Général & Douleurs' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setDiagCategoryFilter(cat.id)}
                          className={`px-2.5 py-1 rounded-md border transition whitespace-nowrap ${
                            diagCategoryFilter === cat.id
                              ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Selectable ICD10 Cards (Multi-selection) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                      {ICD10_CATALOG
                        .filter(item => {
                          if (diagCategoryFilter !== 'all' && item.category !== diagCategoryFilter) return false;
                          if (diagSearchQuery.trim()) {
                            const q = diagSearchQuery.toLowerCase().trim();
                            return item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .map(item => {
                          const isSelected = selectedDiagnoses.some(d => d.code === item.code || d.name.toLowerCase() === item.name.toLowerCase());
                          return (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => handleToggleIcd10Diagnosis(item)}
                              className={`p-2 rounded-md border text-left flex items-start justify-between gap-2 transition ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                            >
                              <div>
                                <span className={`font-mono text-[11px] font-bold block ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {item.code}
                                </span>
                                <span className="text-xs font-semibold leading-snug">{item.name}</span>
                              </div>
                              <div className="mt-0.5 shrink-0">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-white" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Manual Entry Form for Unlisted Diagnoses */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                    <span className="block font-semibold text-slate-800 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                      Saisie Manuelle d&apos;un Diagnostic Spécifique (si absent du catalogue)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Code CIM-10 (ex: K29.7)"
                          value={manualDiagCode}
                          onChange={(e) => setManualDiagCode(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-mono"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Intitulé médical du diagnostic (ex: Gastrite érosive aiguë)..."
                          value={manualDiagName}
                          onChange={(e) => setManualDiagName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-medium"
                        />
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddManualDiagnosis}
                          disabled={!manualDiagName.trim()}
                          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs py-2 rounded-md transition"
                        >
                          + Ajouter
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section Navigation Buttons */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setConsultationStep(1)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>← Retour Constantes (Étape 1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultationStep(3)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <span>Passer aux Prescriptions Médicales (Étape 3)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION 3: PRESCRIPTIONS MÉDICALES (BIOLOGIE, IMAGERIE, ORDONNANCE) & CLÔTURE */}
              {/* ========================================================================= */}
              {consultationStep === 3 && (
                <div className="space-y-4">
                  
                  {/* Step Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-2.5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Section 3 • Prescriptions Médicales (Biologie, Imagerie & Médicaments)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Sélectionnez plusieurs éléments des catalogues ou saisissez manuellement.
                      </p>
                    </div>

                    {/* Prescriptions Category Tabs */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setPrescSubTab('all')}
                        className={`px-2.5 py-1 rounded font-medium transition ${
                          prescSubTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tout Voir
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrescSubTab('lab')}
                        className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                          prescSubTab === 'lab' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Microscope className="w-3 h-3" />
                        <span>Biologie</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrescSubTab('imaging')}
                        className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                          prescSubTab === 'imaging' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Imagerie</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrescSubTab('medication')}
                        className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                          prescSubTab === 'medication' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Pill className="w-3 h-3" />
                        <span>Médicaments</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. BIOLOGIE MÉDICALE */}
                  {(prescSubTab === 'all' || prescSubTab === 'lab') && (
                    <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <Microscope className="w-4 h-4 text-slate-700" />
                          1. Examens de Laboratoire & Biologie Médicale
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Sélection multiple d&apos;examens
                        </span>
                      </div>

                      {/* Quick selection chips from catalog */}
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_LAB_CATALOG.map(exam => {
                          const isSelected = activePrescriptions.some(p => p.type === 'lab_exam' && p.name.toLowerCase() === exam.name.toLowerCase());
                          return (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => handleAddQuickLab(exam)}
                              className={`px-2.5 py-1 rounded-md text-[11px] border transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                              <span>{exam.name}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                ({exam.price.toLocaleString()} F)
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual Lab Entry Form */}
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-2">
                        <span className="block text-[11px] font-semibold text-slate-700">
                          Saisie manuelle d&apos;une analyse non répertoriée :
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              placeholder="Nom de l'examen (ex: Gazométrie artérielle)..."
                              value={manualLabName}
                              onChange={(e) => setManualLabName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-medium"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Type de tube / prélèvement"
                              value={manualLabTube}
                              onChange={(e) => setManualLabTube(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Instructions / Indications"
                              value={manualLabInstructions}
                              onChange={(e) => setManualLabInstructions(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddManualLab}
                              disabled={!manualLabName.trim()}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs py-1.5 rounded transition"
                            >
                              + Ajouter Labo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. IMAGERIE MÉDICALE */}
                  {(prescSubTab === 'all' || prescSubTab === 'imaging') && (
                    <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                          2. Imagerie Médicale & Radiologie
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Sélection multiple d&apos;actes d&apos;imagerie
                        </span>
                      </div>

                      {/* Quick selection chips from catalog */}
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_IMAGING_CATALOG.map(img => {
                          const isSelected = activePrescriptions.some(p => p.type === 'imaging' && p.name.toLowerCase() === img.name.toLowerCase());
                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => handleAddQuickImaging(img)}
                              className={`px-2.5 py-1 rounded-md text-[11px] border transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                              <span>{img.name}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                ({img.price.toLocaleString()} F)
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual Imaging Entry Form */}
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-2">
                        <span className="block text-[11px] font-semibold text-slate-700">
                          Saisie manuelle d&apos;un acte d&apos;imagerie :
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              placeholder="Nom de l'acte (ex: IRM du Genou gauche)..."
                              value={manualImgName}
                              onChange={(e) => setManualImgName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-medium"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <select
                              value={manualImgCategory}
                              onChange={(e) => setManualImgCategory(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs"
                            >
                              <option value="Radiographie">Radiographie</option>
                              <option value="Échographie">Échographie</option>
                              <option value="Scanner (TDM)">Scanner (TDM)</option>
                              <option value="IRM">IRM</option>
                              <option value="Endoscopie">Endoscopie</option>
                              <option value="Autre Imagerie">Autre Imagerie</option>
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Indication / Précisions cliniques"
                              value={manualImgInstructions}
                              onChange={(e) => setManualImgInstructions(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddManualImaging}
                              disabled={!manualImgName.trim()}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs py-1.5 rounded transition"
                            >
                              + Ajouter Imagerie
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. MÉDICAMENTS & ORDONNANCE */}
                  {(prescSubTab === 'all' || prescSubTab === 'medication') && (
                    <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <Pill className="w-4 h-4 text-slate-700" />
                          3. Médicaments & Lignes d&apos;Ordonnance
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Sélection multiple ou rédaction personnalisée
                        </span>
                      </div>

                      {/* Quick selection chips from catalog */}
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_MEDICATIONS_CATALOG.map(med => {
                          const isSelected = activePrescriptions.some(p => p.type === 'medication' && p.name.toLowerCase() === med.name.toLowerCase());
                          return (
                            <button
                              key={med.id}
                              type="button"
                              onClick={() => handleAddQuickMed(med)}
                              className={`px-2.5 py-1 rounded-md text-[11px] border transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                              <span>{med.name}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                ({med.dosage})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual Medication Entry Form */}
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-2">
                        <span className="block text-[11px] font-semibold text-slate-700">
                          Rédaction manuelle d&apos;une ligne d&apos;ordonnance (DCI / Posologie libre) :
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Médicament (ex: Métronidazole)..."
                              value={medInputName}
                              onChange={(e) => setMedInputName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-medium"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <select
                              value={medInputForm}
                              onChange={(e) => setMedInputForm(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs"
                            >
                              <option value="Comprimé">Comprimé</option>
                              <option value="Gélule">Gélule</option>
                              <option value="Sirop">Sirop</option>
                              <option value="Injectable">Injectable</option>
                              <option value="Gouttes">Gouttes</option>
                              <option value="Pommade">Pommade</option>
                              <option value="Suspension">Suspension</option>
                              <option value="Suppositoire">Suppositoire</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Dosage (ex: 500mg)"
                              value={medInputDosage}
                              onChange={(e) => setMedInputDosage(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Posologie (ex: 1 cp matin et soir 7j)"
                              value={medInputInstructions}
                              onChange={(e) => setMedInputInstructions(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddManualMed}
                              disabled={!medInputName.trim()}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs py-1.5 rounded transition"
                            >
                              + Ajouter Médoc
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unified Active Prescriptions Summary Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-xs space-y-0">
                    <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-slate-700" />
                        Récapitulatif des Prescriptions Retenues ({activePrescriptions.length})
                      </span>
                      {activePrescriptions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActivePrescriptions([])}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Tout effacer
                        </button>
                      )}
                    </div>

                    {activePrescriptions.length > 0 ? (
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                          <tr>
                            <th className="p-2.5">Catégorie</th>
                            <th className="p-2.5">Désignation</th>
                            <th className="p-2.5">Posologie / Instructions</th>
                            <th className="p-2.5 text-center">Qté</th>
                            <th className="p-2.5 text-right">Tarif Indicatif</th>
                            <th className="p-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activePrescriptions.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="p-2.5 text-slate-600 font-medium whitespace-nowrap">
                                {item.type === 'lab_exam' && (
                                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <Microscope className="w-3 h-3 text-slate-600" /> Biologie
                                  </span>
                                )}
                                {item.type === 'imaging' && (
                                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <FileSpreadsheet className="w-3 h-3 text-slate-600" /> Imagerie
                                  </span>
                                )}
                                {item.type === 'medication' && (
                                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <Pill className="w-3 h-3 text-slate-600" /> Médicament
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-semibold text-slate-900">{item.name}</td>
                              <td className="p-2.5 text-slate-600">
                                {item.instructions || item.dosage || 'Conforme protocole'}
                              </td>
                              <td className="p-2.5 text-center font-mono font-medium">{item.quantity || 1}</td>
                              <td className="p-2.5 text-right font-mono font-medium text-slate-700">
                                {item.price_unit ? `${(item.price_unit * (item.quantity || 1)).toLocaleString()} F` : 'Inclus'}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrescriptionItem(item.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                                  title="Retirer cette ligne"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Aucun examen ni médicament n&apos;a été prescrit. Sélectionnez des éléments dans les catalogues ou saisissez manuellement ci-dessus.
                      </div>
                    )}
                  </div>

                  {/* Circuit de délivrance : Interne vs Externe */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <span className="block font-semibold text-slate-800">
                      Mode d&apos;Exécution des Prescriptions (Choix du Patient) :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPatientCircuitAgreed(true)}
                        className={`p-3 rounded-lg border text-left transition flex items-start gap-2.5 ${
                          patientCircuitAgreed
                            ? 'border-slate-900 bg-white ring-1 ring-slate-900'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          patientCircuitAgreed ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'
                        }`}>
                          {patientCircuitAgreed && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-900 text-xs">Circuit Interne (Hôpital)</span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            Transmission vers Facturation & Caisse. Le patient acquitte ses prescriptions à la caisse avant exécution au laboratoire / imagerie / pharmacie interne.
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientCircuitAgreed(false)}
                        className={`p-3 rounded-lg border text-left transition flex items-start gap-2.5 ${
                          !patientCircuitAgreed
                            ? 'border-slate-900 bg-white ring-1 ring-slate-900'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          !patientCircuitAgreed ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'
                        }`}>
                          {!patientCircuitAgreed && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-900 text-xs">Circuit Externe (Ville)</span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            Impression immédiate de l&apos;ordonnance et des bulletins d&apos;examens pour réalisation en officine de ville. Aucune facturation hospitalière interne.
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Validation Action Bar */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultationStep(2)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>← Retour Examen & Diagnostics (Étape 2)</span>
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        Déontologie : le médecin valide uniquement les données cliniques.
                      </span>

                      <button
                        type="button"
                        onClick={handleSaveClinicalExamination}
                        disabled={loading}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-md flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-300" />
                        <span>{loading ? 'Clôture en cours...' : 'Valider la Consultation & Clôturer'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-2 my-auto">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Poste de Consultation Médicale Prêt</h3>
                <p className="text-slate-500 text-xs max-w-sm mt-0.5">
                  Sélectionnez un patient acquitté dans la file d&apos;attente pour démarrer la consultation en 3 étapes : Constantes, Examen & CIM-10, Prescriptions.
                </p>
              </div>
              {hideQueue && (
                <button
                  type="button"
                  onClick={() => setHideQueue(false)}
                  className="mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                  <span>Afficher la salle d&apos;attente ({clinicalQueue.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        </div>
      )}

      {/* TAB 2: HISTORIQUE DES CONSULTATIONS */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Historique des Consultations Clôturées</h3>
              <p className="text-slate-500 text-xs">Consultation des dossiers médicaux examinés et réimpression des ordonnances.</p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {completedConsultations.length} Consultations
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
            {completedConsultations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aucune consultation archivée pour le moment.</div>
            ) : (
              completedConsultations.map(c => (
                <div key={c.id} className="p-3.5 hover:bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs">{c.patient_name}</span>
                      <span className="text-[11px] font-mono text-slate-500">NDM: {c.patient_ndm}</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">Clôturé</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Diagnostic : <strong>{c.diagnosis || 'Non spécifié'}</strong> {c.diagnosis_code ? `(${c.diagnosis_code})` : ''} • Praticien : Dr. {c.doctor_name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Date : {formatDateDDMMYYYY(c.consultation_date)} • Circuit : {c.patient_choice === 'external' ? 'Externe (Ville)' : 'Interne (Hôpital)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setExternalModalConsultation(c);
                        setExternalModalItems((c.prescribed_items || []).filter(i => i.type !== 'act'));
                        setShowExternalModal(true);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Imprimer Ordonnance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const p = partners.find(part => part.id === c.partner_id);
                        if (p) {
                          setSelectedDmePartner(p);
                          setShowDmeModal(true);
                        }
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>DME</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: DME TIMELINE */}
      <AnimatePresence>
        {showDmeModal && selectedDmePartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-5 border border-slate-200 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-700 rounded-md">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Dossier Médical Électronique (DME)</h3>
                    <p className="text-[11px] text-slate-500">{selectedDmePartner.name} (NDM: {selectedDmePartner.ndm})</p>
                  </div>
                </div>
                <button onClick={() => setShowDmeModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 py-3 space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-900 mb-2">Historique des Consultations & Constantes</div>
                  {consultations.filter(c => c.partner_id === selectedDmePartner.id).length === 0 ? (
                    <p className="text-slate-400">Aucun enregistrement clinique trouvé.</p>
                  ) : (
                    consultations
                      .filter(c => c.partner_id === selectedDmePartner.id)
                      .map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-md border border-slate-200 space-y-1.5 mb-2 shadow-2xs">
                          <div className="flex justify-between font-medium border-b border-slate-100 pb-1 text-slate-900">
                            <span>{c.consultation_number}</span>
                            <span className="text-slate-400 text-[11px]">{formatDateDDMMYYYY(c.consultation_date)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div><span className="text-slate-500">Diagnostic :</span> <strong className="text-slate-800">{c.diagnosis || 'Non renseigné'}</strong></div>
                            <div><span className="text-slate-500">Praticien :</span> <span className="font-medium text-slate-700">{c.doctor_name}</span></div>
                          </div>
                          {c.vitals && (
                            <div className="bg-slate-50 p-1.5 rounded text-[11px] text-slate-600 flex flex-wrap gap-2">
                              <span>T°: {c.vitals.temperature}°C</span>
                              <span>PA: {c.vitals.bp_systolic}/{c.vitals.bp_diastolic}</span>
                              <span>Pouls: {c.vitals.heart_rate} bpm</span>
                              <span>Poids: {c.vitals.weight} kg</span>
                              <span>SpO2: {c.vitals.spo2}%</span>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Referral Modal */}
      <ReferralModal
        isOpen={showReferralModal}
        consultation={referralConsultation}
        onClose={() => {
          setShowReferralModal(false);
          setReferralConsultation(null);
        }}
        onSaved={() => {
          if (referralConsultation) {
            const refId = referralConsultation.id;
            setConsultations(prev => prev.filter(c => c.id !== refId));
            if (activeConsultation?.id === refId) {
              setActiveConsultation(null);
              setActivePrescriptions([]);
              setSelectedDiagnoses([]);
              setConsultationStep(1);
            }
            const msg = `Patient ${referralConsultation.patient_name || ''} orienté vers le service de référence avec succès.`;
            setSuccessBanner(msg);
            if (onShowToast) onShowToast(msg, 'success', 'Patient Référé');
          }
          setShowReferralModal(false);
          setReferralConsultation(null);
          loadData();
        }}
        currentUser={currentUser}
      />

      {/* External Prescription Printable Modal */}
      <ExternalPrescriptionModal
        isOpen={showExternalModal}
        consultation={externalModalConsultation}
        items={externalModalItems}
        onClose={() => {
          setShowExternalModal(false);
          setExternalModalConsultation(null);
          setExternalModalItems([]);
        }}
        company={company}
      />

      {/* Payment Receipt / Invoice PDF Modal */}
      {selectedReceiptMove && (
        <InvoicePdfModal
          move={selectedReceiptMove}
          company={company}
          onClose={() => setSelectedReceiptMove(null)}
          onSendEmail={(moveId) => {
            if (onShowToast) {
              onShowToast(`Reçu de paiement #${moveId} transmis avec succès au patient.`, 'success', 'Envoi Réussi');
            }
          }}
        />
      )}

    </div>
  );
};
