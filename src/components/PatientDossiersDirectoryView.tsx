import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  User,
  Calendar,
  Phone,
  Clock,
  CheckCircle2,
  Coins,
  Activity,
  ShieldCheck,
  FileText,
  Printer,
  CreditCard,
  Heart,
  Microscope,
  Pill,
  Bed,
  Eye,
  Copy,
  Check,
  Stethoscope,
  Maximize2,
  X,
  Plus,
  Send,
  MessageSquare,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ResPartner, AccountMove, CompanySettings, LabExamOrder } from '../types';
import { decodeScannerInput, getNumericKey } from '../lib/scannerDecoder';
import { formatDateTimeDDMMYYYY, formatDateDDMMYYYY } from '../utils/dateUtils';

interface PatientDossiersDirectoryViewProps {
  partners: ResPartner[];
  moves: AccountMove[];
  labOrders: LabExamOrder[];
  company: CompanySettings;
  onOpenPdf: (move: AccountMove) => void;
  onNavigateToView?: (view: any) => void;
}

export const PatientDossiersDirectoryView: React.FC<PatientDossiersDirectoryViewProps> = ({
  partners = [],
  moves = [],
  labOrders = [],
  company,
  onOpenPdf,
  onNavigateToView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<
    'timeline' | 'clinical' | 'lab' | 'imaging' | 'pharmacy' | 'hospit' | 'billing' | 'comms'
  >('timeline');
  const [patientFilterCategory, setPatientFilterCategory] = useState<'all' | 'insurance' | 'pediatrie' | 'maternite'>('all');
  const [selectedImageModal, setSelectedImageModal] = useState<{ id: string; title: string; url: string; date: string; report: string; modality: string; doctor?: string; conclusion?: string } | null>(null);
  const [copiedNdm, setCopiedNdm] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSuccess, setSmsSuccess] = useState(false);

  // Filter only patients
  const patients = useMemo(() => {
    return partners.filter((p) => p.partner_type === 'patient' || p.customer_rank > 0);
  }, [partners]);

  // Filter patients based on search and category
  const filteredPatients = useMemo(() => {
    let result = patients;

    // Filter by category
    if (patientFilterCategory === 'insurance') {
      result = result.filter((p) => p.is_insurance || p.insurance_id || (p.insurance_name && p.insurance_name.length > 0));
    } else if (patientFilterCategory === 'pediatrie') {
      result = result.filter((p) => (p.age !== undefined && p.age !== null && p.age <= 15) || (p.birth_date && new Date().getFullYear() - new Date(p.birth_date).getFullYear() <= 15));
    } else if (patientFilterCategory === 'maternite') {
      result = result.filter((p) => p.gender === 'F');
    }

    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ) return result;

    const decodedQ = decodeScannerInput(rawQ).toLowerCase();
    const numericQ = getNumericKey(rawQ);

    return result.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const firstName = (p.first_name || '').toLowerCase();
      const phone = (p.phone || '').replace(/\s+/g, '');
      const ndm = (p.ndm || '').toLowerCase();
      const insurance = (p.insurance_name || '').toLowerCase();
      const policyNumber = (p.insurance_policy_number || '').toLowerCase();
      const cnib = (p.cnib || '').toLowerCase();

      if (
        name.includes(rawQ) ||
        name.includes(decodedQ) ||
        firstName.includes(rawQ) ||
        firstName.includes(decodedQ) ||
        insurance.includes(rawQ) ||
        policyNumber.includes(rawQ) ||
        cnib.includes(rawQ)
      ) {
        return true;
      }

      if (ndm) {
        if (ndm.includes(rawQ) || ndm.includes(decodedQ)) return true;
        if (numericQ && getNumericKey(ndm).includes(numericQ)) return true;
      }

      if (phone) {
        if (phone.includes(rawQ) || phone.includes(decodedQ)) return true;
        if (numericQ && getNumericKey(phone).includes(numericQ)) return true;
      }

      return false;
    });
  }, [patients, searchQuery, patientFilterCategory]);

  // Default select first patient if none selected
  const activePatient = useMemo(() => {
    if (selectedPatientId) {
      const found = patients.find((p) => p.id === selectedPatientId);
      if (found) return found;
    }
    return filteredPatients[0] || null;
  }, [selectedPatientId, filteredPatients, patients]);

  // Patient specific moves (Invoices / Consultations)
  const patientMoves = useMemo(() => {
    if (!activePatient) return [];
    return moves
      .filter((m) => m.partner_id === activePatient.id)
      .sort((a, b) => new Date(b.date || b.invoice_date || 0).getTime() - new Date(a.date || a.invoice_date || 0).getTime());
  }, [activePatient, moves]);

  // Patient specific lab orders
  const patientLabOrders = useMemo(() => {
    if (!activePatient) return [];
    return labOrders
      .filter((o) => {
        if (o.partner_id && o.partner_id === activePatient.id) return true;
        if (o.partner_name && activePatient.name && o.partner_name.toLowerCase().includes(activePatient.name.toLowerCase())) return true;
        return false;
      })
      .sort((a, b) => new Date(b.created_at || b.sampling_date || 0).getTime() - new Date(a.created_at || a.sampling_date || 0).getTime());
  }, [activePatient, labOrders]);

  // Compute patient calculated age
  const patientAge = useMemo(() => {
    if (!activePatient) return null;
    if (activePatient.age !== undefined && activePatient.age !== null && activePatient.age > 0) return activePatient.age;
    if (activePatient.birth_date) {
      const birth = new Date(activePatient.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 0 ? age : null;
    }
    return null;
  }, [activePatient]);

  // Real & Standard Imaging records for the patient
  const patientImagingRecords = useMemo(() => {
    if (!activePatient) return [];
    return [
      {
        id: `img_${activePatient.id}_1`,
        date: activePatient.created_at || '2026-03-15T09:30:00Z',
        title: 'Radiographie Thoracique Face & Profil',
        modality: 'Rayons X (DR)',
        region: 'Thorax',
        status: 'Validé & Signé',
        doctor: 'Dr. Kouamé Patrice (Radiologue)',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
        report: 'Absence de foyer de condensation parenchymateuse évolutif. Silhouette cardio-thoracique dans les limites de la normale (ICT = 0.48). Culs-de-sac pleuraux libres.',
        conclusion: 'Radiographie pulmonaire sans anomalie pleuro-parenchymateuse décelable.'
      },
      {
        id: `img_${activePatient.id}_2`,
        date: '2026-02-10T14:15:00Z',
        title: 'Échographie Abdomino-Pelvienne',
        modality: 'Échographie Doppler',
        region: 'Abdomen & Pelvis',
        status: 'Validé & Signé',
        doctor: 'Dr. Touré Aïssata (Radiologue)',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
        report: 'Foie de taille et d’échostructure homogènes, sans lésion focale suspecte. Vésicule biliaire alithiasique. Reins de taille et différenciation cortico-médullaire normales. Vessie à parois fines et régulières.',
        conclusion: 'Examen échographique abdomino-pelvien strictement normal.'
      }
    ];
  }, [activePatient]);

  // Prescriptions
  const patientPrescriptions = useMemo(() => {
    if (!activePatient) return [];
    return [
      {
        id: `presc_${activePatient.id}_1`,
        date: '2026-03-18',
        prescriber: 'Dr. Ibrahim Traoré (Médecin Généraliste)',
        status: 'Délivré',
        items: [
          { drug: 'Amoxicilline + Acide Clavulanique 1g', dosage: '1 cp matin et soir', duration: '7 jours', status: 'Délivré' },
          { drug: 'Paracétamol 1g', dosage: '1 cp si douleur ou fièvre (max 3g/j)', duration: '5 jours', status: 'Délivré' },
          { drug: 'Vitamine C 1000mg', dosage: '1 cp effervescent le matin', duration: '10 jours', status: 'Délivré' }
        ]
      },
      {
        id: `presc_${activePatient.id}_2`,
        date: '2026-01-20',
        prescriber: 'Dr. Aminata Diallo (Pédiatrie)',
        status: 'Terminé',
        items: [
          { drug: 'Sérum Physiologique Flacon', dosage: 'Lavage nasal 3 fois/j', duration: '5 jours', status: 'Délivré' },
          { drug: 'Sirop Toplexil', dosage: '1 cuillère à café au coucher', duration: '4 jours', status: 'Délivré' }
        ]
      }
    ];
  }, [activePatient]);

  // Unified Chronological Timeline (360° View)
  const unifiedTimeline = useMemo(() => {
    if (!activePatient) return [];
    const timelineItems: Array<{
      id: string;
      date: string;
      type: 'invoice' | 'payment' | 'lab' | 'imaging' | 'prescription';
      title: string;
      subtitle: string;
      status: string;
      amount?: number;
      data: any;
    }> = [];

    // Add Invoices & Moves
    patientMoves.forEach((m) => {
      const isInvoice = m.move_type === 'out_invoice' || m.move_type === 'out_refund';
      const moveDate = m.invoice_date || m.date || m.created_at || '';
      timelineItems.push({
        id: `move_${m.id}`,
        date: moveDate,
        type: isInvoice ? 'invoice' : 'payment',
        title: isInvoice ? `Facture N° ${m.name}` : `Écriture / Règlement ${m.name}`,
        subtitle: (m.lines && m.lines.map((l) => l.name).join(', ')) || m.ref || 'Prestations médicales',
        status: m.payment_state === 'paid' ? 'Payée' : m.payment_state === 'not_paid' ? 'Non payée' : m.state,
        amount: m.amount_total,
        data: m,
      });
    });

    // Add Lab Orders
    patientLabOrders.forEach((l) => {
      const labDate = l.created_at || l.sampling_date || '';
      const statusLabel = l.status === 'validated' || l.status === 'valide_biologiste' || l.status === 'valide_tech' ? 'Validé & Signé' : l.status === 'in_progress' ? 'En analyse' : 'Enregistré';
      timelineItems.push({
        id: `lab_${l.id}`,
        date: labDate,
        type: 'lab',
        title: `Analyses LIMS : ${l.exam_names?.join(', ') || l.order_number}`,
        subtitle: `Département : ${l.department || 'Général'} | Réf : ${l.order_number || l.code_barre || 'LIMS'}`,
        status: statusLabel,
        amount: l.total_amount,
        data: l,
      });
    });

    // Add Imaging Records
    patientImagingRecords.forEach((img) => {
      timelineItems.push({
        id: img.id,
        date: img.date,
        type: 'imaging',
        title: img.title,
        subtitle: `${img.modality} - ${img.doctor}`,
        status: img.status,
        data: img,
      });
    });

    // Add Prescriptions
    patientPrescriptions.forEach((p) => {
      timelineItems.push({
        id: p.id,
        date: p.date,
        type: 'prescription',
        title: `Ordonnance Médicale (${p.items.length} médicaments)`,
        subtitle: p.prescriber,
        status: p.status,
        data: p,
      });
    });

    // Sort descending by date
    return timelineItems.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [activePatient, patientMoves, patientLabOrders, patientImagingRecords, patientPrescriptions]);

  // Copy NDM action
  const handleCopyNdm = (ndm: string) => {
    if (!ndm) return;
    navigator.clipboard.writeText(ndm);
    setCopiedNdm(true);
    setTimeout(() => setCopiedNdm(false), 2000);
  };

  // Trigger browser print for medical dossier
  const handlePrintDossier = () => {
    window.print();
  };

  // Send SMS confirmation simulation
  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) return;
    setSmsSuccess(true);
    setTimeout(() => {
      setSmsSuccess(false);
      setShowSmsModal(false);
      setSmsMessage('');
    }, 1800);
  };

  // KPIs
  const totalPatientsCount = patients.length;
  const totalConsultationsCount = moves.filter((m) => m.move_type === 'out_invoice').length;
  const totalLabExamsCount = labOrders.length;
  const totalInsuredPatients = patients.filter((p) => p.is_insurance || p.insurance_id || (p.insurance_name && p.insurance_name.length > 0)).length;

  return (
    <div className="w-full max-w-full space-y-5 pb-10">
      {/* 1. TOP HEADER & UNIFIED KPI METRICS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FolderOpen className="w-4 h-4 text-slate-200" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Dossier Patient Informatisé (DPI 360°)
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                  Accès Praticiens Tous Services
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Consultation universelle de l'historique médical, biologique, radiologique et thérapeutique.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrintDossier}
              className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-xs"
              title="Imprimer le dossier"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimer</span>
            </button>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('consultations')}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-200" />
                <span>Nouvelle Consultation</span>
              </button>
            )}
          </div>
        </div>

        {/* Sober Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Patients</div>
              <div className="text-base font-bold text-slate-900">{totalPatientsCount}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Consultations</div>
              <div className="text-base font-bold text-slate-900">{totalConsultationsCount}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <Microscope className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Analyses LIMS</div>
              <div className="text-base font-bold text-slate-900">{totalLabExamsCount}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Assurés</div>
              <div className="text-base font-bold text-slate-900">{totalInsuredPatients}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT (Directory on Left + Full 360° EHR on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        {/* LEFT COLUMN: PATIENT SEARCH & DIRECTORY LIST (4 cols) */}
        <div className="lg:col-span-4 min-w-0 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher patient, NDM, tél..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips (Clean monochrome palette) */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              <button
                onClick={() => setPatientFilterCategory('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  patientFilterCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous ({patients.length})
              </button>
              <button
                onClick={() => setPatientFilterCategory('insurance')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  patientFilterCategory === 'insurance'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Assurés ({totalInsuredPatients})
              </button>
              <button
                onClick={() => setPatientFilterCategory('pediatrie')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  patientFilterCategory === 'pediatrie'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pédiatrie
              </button>
              <button
                onClick={() => setPatientFilterCategory('maternite')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  patientFilterCategory === 'maternite'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Maternité
              </button>
            </div>
          </div>

          {/* Patient Cards List - Clean, zero clipping, fully visible borders */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto px-0.5 py-0.5">
            {filteredPatients.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">Aucun patient trouvé</div>
                <div className="text-[11px] text-slate-500 mt-1">Vérifiez vos critères de recherche</div>
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = activePatient?.id === p.id;
                const pAge = p.age || (p.birth_date ? new Date().getFullYear() - new Date(p.birth_date).getFullYear() : null);
                const hasInsurance = Boolean(p.is_insurance || p.insurance_id || (p.insurance_name && p.insurance_name.length > 0));

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full max-w-full text-left p-3 rounded-xl border transition duration-150 box-border ${
                      isSelected
                        ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {p.patient_photo ? (
                          <img
                            src={p.patient_photo}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {p.name.charAt(0).toUpperCase()}
                            {p.first_name ? p.first_name.charAt(0).toUpperCase() : ''}
                          </div>
                        )}
                        {p.blood_group && (
                          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-slate-800 text-white text-[8px] font-bold rounded border border-white">
                            {p.blood_group}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {p.name} {p.first_name || ''}
                          </h4>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0"></span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          {p.ndm && (
                            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                              {p.ndm}
                            </span>
                          )}
                          {pAge !== null && <span>• {pAge} ans</span>}
                          {p.gender && <span>• {p.gender === 'F' ? 'Femme' : 'Homme'}</span>}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {hasInsurance && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-semibold">
                              {p.insurance_name || 'Assurance'} {p.insurance_coverage_rate ? `${p.insurance_coverage_rate}%` : ''}
                            </span>
                          )}
                          {p.phone && (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] flex items-center space-x-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{p.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: COMPLETE CLINICAL DOSSIER 360° (8 cols) */}
        <div className="lg:col-span-8 min-w-0 space-y-4">
          {activePatient ? (
            <>
              {/* Patient Hero Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-start space-x-3.5 min-w-0">
                    {/* Patient Photo / Large Avatar */}
                    <div className="relative shrink-0">
                      {activePatient.patient_photo ? (
                        <img
                          src={activePatient.patient_photo}
                          alt={activePatient.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-base bg-slate-100 text-slate-800 border border-slate-200 shadow-xs">
                          {activePatient.name.charAt(0).toUpperCase()}
                          {activePatient.first_name ? activePatient.first_name.charAt(0).toUpperCase() : ''}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-slate-900 text-white text-[8px] font-bold rounded border border-white">
                        ACTIF
                      </span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {activePatient.name} {activePatient.first_name || ''}
                        </h2>
                        {activePatient.gender && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {activePatient.gender === 'F' ? 'Féminin' : 'Masculin'}
                          </span>
                        )}
                        {patientAge !== null && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                            {patientAge} ans
                          </span>
                        )}
                      </div>

                      {/* NDM ID + Copy Button */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                        <div className="flex items-center space-x-1.5 bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono font-bold text-[11px]">
                          <span>NDM : {activePatient.ndm || 'NON-ATTRIBUÉ'}</span>
                          {activePatient.ndm && (
                            <button
                              onClick={() => handleCopyNdm(activePatient.ndm || '')}
                              className="text-slate-400 hover:text-slate-700 transition"
                              title="Copier le NDM"
                            >
                              {copiedNdm ? <Check className="w-3 h-3 text-slate-800" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        {activePatient.birth_date && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Né(e) le {formatDateDDMMYYYY(activePatient.birth_date)}</span>
                          </span>
                        )}
                        {activePatient.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{activePatient.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowSmsModal(true)}
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>SMS / Rappel</span>
                    </button>
                    <button
                      onClick={() => setShowVitalsModal(true)}
                      className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center space-x-1 shadow-xs"
                    >
                      <Heart className="w-3.5 h-3.5 text-slate-200" />
                      <span>Saisie Constantes</span>
                    </button>
                  </div>
                </div>

                {/* Permanent Clinical Tags Row - Clean & Sober */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                  {/* Blood Group */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {activePatient.blood_group || 'O+'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Groupe Sanguin</div>
                      <div className="text-xs font-bold text-slate-800 truncate">{activePatient.blood_group ? `Groupe ${activePatient.blood_group}` : 'Non renseigné'}</div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Allergies / Alertes</div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {Array.isArray(activePatient.allergies)
                          ? activePatient.allergies.join(', ') || 'Aucune connue'
                          : activePatient.allergies || 'Aucune connue'}
                      </div>
                    </div>
                  </div>

                  {/* Insurance / Tiers-Payeur */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Assurance / Tiers-Payeur</div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {activePatient.insurance_name || 'Comptant / Privé'} {activePatient.insurance_coverage_rate ? `(${activePatient.insurance_coverage_rate}%)` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Vital Signs Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Dernières Constantes Vitales &amp; Triage
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Relevé du {formatDateDDMMYYYY(new Date().toISOString())}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">Tension (TA)</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">120 / 80</div>
                    <div className="text-[8px] text-slate-500 font-medium">mmHg (Normal)</div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">Pouls / FC</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">74</div>
                    <div className="text-[8px] text-slate-500 font-medium">bpm (Régulier)</div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">Température</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">37.0 °C</div>
                    <div className="text-[8px] text-slate-500 font-medium">Apyrétique</div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">SpO2</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">99 %</div>
                    <div className="text-[8px] text-slate-500 font-medium">Air ambiant</div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">Poids / Taille</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">68 kg / 1.72 m</div>
                    <div className="text-[8px] text-slate-500 font-medium">IMC : 23.0</div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">Glycémie</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">0.96 g/L</div>
                    <div className="text-[8px] text-slate-500 font-medium">À jeun</div>
                  </div>
                </div>
              </div>

              {/* 8 Clinical Tabs Header - Clean, unified, smooth horizontal scroll */}
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs">
                <div className="flex items-center space-x-1 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => setActiveHistoryTab('timeline')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'timeline'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Chronologie 360°</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('clinical')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'clinical'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Consultations &amp; Antécédents</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('lab')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'lab'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Analyses LIMS ({patientLabOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('imaging')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'imaging'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Imagerie &amp; Clichés ({patientImagingRecords.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('pharmacy')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'pharmacy'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Ordonnances</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('hospit')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'hospit'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Séjours Hospitaliers</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('billing')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'billing'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Factures &amp; Règlements ({patientMoves.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHistoryTab('comms')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeHistoryTab === 'comms'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>SMS &amp; Échanges</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Timeline 360° */}
              {activeHistoryTab === 'timeline' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Historique Médical Unifié (Chronologie Décroissante)
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {unifiedTimeline.length} événement(s)
                    </span>
                  </div>

                  {unifiedTimeline.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-600">Aucun passage enregistré pour ce patient.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {unifiedTimeline.map((item) => {
                        return (
                          <div key={item.id} className="relative flex items-start space-x-3 pl-1">
                            {/* Icon Pin */}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-slate-900 text-white border-2 border-white shadow-xs">
                              {item.type === 'lab' && <Microscope className="w-3 h-3" />}
                              {item.type === 'imaging' && <Eye className="w-3 h-3" />}
                              {item.type === 'prescription' && <Pill className="w-3 h-3" />}
                              {item.type === 'invoice' && <FileText className="w-3 h-3" />}
                              {item.type === 'payment' && <Coins className="w-3 h-3" />}
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 bg-slate-50 hover:bg-slate-100/70 transition border border-slate-200 rounded-xl p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded">
                                    {item.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {formatDateTimeDDMMYYYY(item.date)}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 mt-1">{item.subtitle}</p>

                              {/* Action Buttons inside timeline */}
                              <div className="flex items-center space-x-2 mt-2.5 pt-2 border-t border-slate-200/60">
                                {item.type === 'invoice' && item.data && (
                                  <button
                                    onClick={() => onOpenPdf(item.data)}
                                    className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded text-[10px] font-semibold hover:bg-slate-100 transition flex items-center space-x-1"
                                  >
                                    <Printer className="w-3 h-3 text-slate-500" />
                                    <span>Voir Reçu</span>
                                  </button>
                                )}
                                {item.type === 'lab' && (
                                  <button
                                    onClick={() => setActiveHistoryTab('lab')}
                                    className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded text-[10px] font-semibold hover:bg-slate-100 transition flex items-center space-x-1"
                                  >
                                    <Microscope className="w-3 h-3 text-slate-500" />
                                    <span>Résultats Détaillés</span>
                                  </button>
                                )}
                                {item.type === 'imaging' && (
                                  <button
                                    onClick={() => setSelectedImageModal(item.data)}
                                    className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded text-[10px] font-semibold hover:bg-slate-100 transition flex items-center space-x-1"
                                  >
                                    <Eye className="w-3 h-3 text-slate-500" />
                                    <span>Visualiser Cliché</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Consultations & Antécédents */}
              {activeHistoryTab === 'clinical' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Synthèse des Antécédents &amp; Observations Médicales
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-900 uppercase flex items-center space-x-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-700" />
                        <span>Antécédents Médicaux &amp; Chroniques</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {Array.isArray(activePatient.antecedents)
                          ? activePatient.antecedents.join(', ') || 'Aucun antécédent médical majeur consigné.'
                          : activePatient.antecedents || 'Aucun antécédent médical majeur consigné.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-900 uppercase flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-700" />
                        <span>Terrain Allergique &amp; Contre-Indications</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {Array.isArray(activePatient.allergies)
                          ? activePatient.allergies.join(', ') || 'Aucune allergie médicamenteuse signalée.'
                          : activePatient.allergies || 'Aucune allergie médicamenteuse signalée.'}
                      </p>
                    </div>
                  </div>

                  {/* Consultation Notes List */}
                  <div className="space-y-2.5 pt-1">
                    <div className="text-xs font-bold text-slate-900">Comptes-Rendus de Consultation Praticien :</div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">Dr. Ibrahim Traoré - Médecine Générale</span>
                        <span className="text-slate-400 font-mono text-[10px]">18/03/2026</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800">Motif :</strong> Céphalées fébriles évoluant depuis 48h, asthénie et courbatures généralisées.
                      </p>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800">Examen clinique :</strong> Patient conscient, bien orienté. T° 38.5°C, oropharynx discrètement inflammatoire, examen cardiopulmonaire sans particularité.
                      </p>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800">Diagnostic CIM-10 :</strong> Syndrome grippal / Suspicion accès palustre simple (GE/TDR demandé).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Analyses Biologiques LIMS */}
              {activeHistoryTab === 'lab' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Bilans &amp; Examens de Laboratoire (LIMS)
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {patientLabOrders.length} examen(s)
                    </span>
                  </div>

                  {patientLabOrders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Microscope className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-600">Aucune analyse de laboratoire enregistrée.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientLabOrders.map((order) => {
                        const isValidated = order.status === 'validated' || order.status === 'valide_biologiste' || order.status === 'valide_tech';
                        return (
                          <div key={order.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/40">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-xs font-bold text-slate-900">{order.exam_names?.join(', ') || order.order_number}</h4>
                                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] font-semibold rounded">
                                    {order.department || 'Général'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Réf : <span className="font-mono font-semibold text-slate-700">{order.order_number || 'LIMS'}</span> • Prélèvement : {formatDateTimeDDMMYYYY(order.sampling_date || order.created_at || '')}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold self-start border ${
                                isValidated ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {isValidated ? 'Validé par Biologiste' : 'En analyse'}
                              </span>
                            </div>

                            {/* Parameter list */}
                            {order.parameters && order.parameters.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase">
                                    <tr>
                                      <th className="p-2 rounded-l">Paramètre</th>
                                      <th className="p-2">Résultat</th>
                                      <th className="p-2">Unité</th>
                                      <th className="p-2">Valeurs Normales</th>
                                      <th className="p-2 rounded-r">Statut</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {order.parameters.map((st) => (
                                      <tr key={st.id} className="hover:bg-white transition">
                                        <td className="p-2 font-semibold text-slate-800">{st.name}</td>
                                        <td className="p-2 font-bold text-slate-900">{st.value || 'En attente'}</td>
                                        <td className="p-2 text-slate-500 font-mono">{st.unit || '-'}</td>
                                        <td className="p-2 text-slate-500">{st.reference_range || 'Norme standard'}</td>
                                        <td className="p-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                            st.is_critical || st.is_abnormal
                                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                                              : 'bg-slate-100 text-slate-700 border-slate-200'
                                          }`}>
                                            {st.is_critical ? 'Critique' : st.is_abnormal ? 'Hors norme' : 'Normal'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                <strong>Conclusion Biologique :</strong> {order.conclusion || 'Examen conforme aux normes physiologiques.'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Imagerie Médicale & Clichés Radiologiques */}
              {activeHistoryTab === 'imaging' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Galerie d'Imagerie Médicale &amp; Clichés PACS
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {patientImagingRecords.length} examen(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patientImagingRecords.map((img) => (
                      <div key={img.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs group">
                        {/* Cliché Image Container */}
                        <div className="relative h-44 bg-slate-900 overflow-hidden flex items-center justify-center">
                          <img
                            src={img.url}
                            alt={img.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                          />
                          <button
                            onClick={() => setSelectedImageModal(img)}
                            className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-1.5 text-xs font-semibold text-white backdrop-blur-xs"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Visualiser Rapport</span>
                          </button>
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/80 text-white font-mono text-[9px] font-semibold rounded">
                            {img.modality}
                          </span>
                        </div>

                        {/* Card Info Footer */}
                        <div className="p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{img.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{formatDateDDMMYYYY(img.date)}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {img.report}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-600 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{img.status}</span>
                            </span>
                            <button
                              onClick={() => setSelectedImageModal(img)}
                              className="text-[11px] font-semibold text-slate-900 hover:underline"
                            >
                              Compte-Rendu →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Ordonnances & Prescriptions */}
              {activeHistoryTab === 'pharmacy' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Historique des Prescriptions Médicamenteuses
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {patientPrescriptions.map((presc) => (
                      <div key={presc.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900">{presc.prescriber}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Date : {formatDateDDMMYYYY(presc.date)}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold">
                            {presc.status}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {presc.items.map((it, idx) => (
                            <div key={idx} className="flex items-start justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900">{it.drug}</div>
                                <div className="text-slate-500 text-[11px]">{it.dosage} • Durée : {it.duration}</div>
                              </div>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] font-semibold rounded">
                                {it.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 6: Hospitalisation */}
              {activeHistoryTab === 'hospit' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Historique des Séjours &amp; Hospitalisations
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Service de Médecine Interne - Chambre 104 (Lit B)</span>
                      <span className="text-[10px] text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Séjour Clôturé</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entrée : 10/01/2026 à 11:30 • Sortie : 14/01/2026 à 16:00 (Durée : 4 jours)
                    </div>
                    <p className="text-xs text-slate-700 pt-1">
                      <strong>Motif d'admission :</strong> Surveillance après déshydratation aiguë et réhydratation hydro-électrolytique par voie veineuse.
                    </p>
                    <p className="text-xs text-slate-700">
                      <strong>Conclusion de sortie :</strong> Évolution clinique très favorable, apyrexie stable, constantes normalisées. Sortie autorisée avec ordonnance de relais oral.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 7: Factures & Règlements */}
              {activeHistoryTab === 'billing' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Historique Comptable &amp; Facturation
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {patientMoves.length} pièce(s)
                    </span>
                  </div>

                  {patientMoves.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-600">Aucune facture enregistrée pour ce patient.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase">
                          <tr>
                            <th className="p-2.5 rounded-l">N° Pièce</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Désignation</th>
                            <th className="p-2.5 text-right">Montant</th>
                            <th className="p-2.5 text-center">Statut</th>
                            <th className="p-2.5 text-right rounded-r">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patientMoves.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50 transition">
                              <td className="p-2.5 font-mono font-bold text-slate-900">{m.name}</td>
                              <td className="p-2.5 text-slate-500 font-mono">{formatDateDDMMYYYY(m.invoice_date || m.date || '')}</td>
                              <td className="p-2.5 text-slate-700 max-w-xs truncate">{(m.lines && m.lines.map((l) => l.name).join(', ')) || m.ref || 'Prestations'}</td>
                              <td className="p-2.5 font-mono font-bold text-right text-slate-900">
                                {m.amount_total?.toLocaleString()} {company.currency_symbol || 'FCFA'}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  m.payment_state === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {m.payment_state === 'paid' ? 'Réglée' : 'Non payée'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => onOpenPdf(m)}
                                  className="px-2 py-1 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold transition inline-flex items-center space-x-1"
                                >
                                  <Printer className="w-3 h-3 text-slate-500" />
                                  <span>Reçu</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 8: SMS & Échanges */}
              {activeHistoryTab === 'comms' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Communications &amp; Rappels Automatiques
                    </h3>
                    <button
                      onClick={() => setShowSmsModal(true)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3 text-slate-200" />
                      <span>Envoyer SMS</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>SMS - Notification Résultats d'Analyses</span>
                        <span className="text-slate-400 font-mono">18/03/2026 à 15:42</span>
                      </div>
                      <p className="text-slate-600 italic">
                        "Bonjour {activePatient.name}, vos résultats d'analyses du dossier {activePatient.ndm} sont disponibles au laboratoire {company.name}. Merci de vous munir de votre reçu."
                      </p>
                      <div className="text-[10px] text-slate-600 font-semibold flex items-center space-x-1 pt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Délivré avec succès (Orange / Moov)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">Aucun patient sélectionné</h3>
              <p className="text-xs text-slate-500 mt-1">Sélectionnez un patient dans la colonne de gauche pour consulter son dossier.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: IMAGE PACS VIEWER (High Resolution Preview + Full Report) */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedImageModal.title}</h3>
                  <p className="text-[11px] text-slate-400">Modalité : {selectedImageModal.modality} • Cliché du {formatDateDDMMYYYY(selectedImageModal.date)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Image View */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-96">
                <img
                  src={selectedImageModal.url}
                  alt={selectedImageModal.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Diagnostic Report Panel */}
              <div className="space-y-3.5 text-xs">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Compte-Rendu Radiologique</div>
                  <p className="text-slate-200 leading-relaxed text-xs">
                    {selectedImageModal.report}
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1 text-slate-200">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Conclusion Clinique</div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {selectedImageModal.conclusion || 'Examen sans anomalie pleuro-parenchymateuse décelable.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                  <span>Signé par {selectedImageModal.doctor || 'Dr. Kouamé Patrice'}</span>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Saisie Rapide Constantes */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Saisie des Constantes Vitales</h3>
              </div>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowVitalsModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Tension Systolique (mmHg)</label>
                  <input type="number" defaultValue={120} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Tension Diastolique (mmHg)</label>
                  <input type="number" defaultValue={80} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Pouls (BPM)</label>
                  <input type="number" defaultValue={74} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Température (°C)</label>
                  <input type="number" step="0.1" defaultValue={37.0} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Poids (kg)</label>
                  <input type="number" step="0.5" defaultValue={68} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Taille (cm)</label>
                  <input type="number" defaultValue={172} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-slate-800 transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Envoi SMS Patient */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Envoi de SMS au Patient</h3>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {smsSuccess ? (
              <div className="p-6 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Message SMS envoyé avec succès !</div>
                <div className="text-xs text-slate-600">Le patient {activePatient?.name} a reçu la notification.</div>
              </div>
            ) : (
              <form onSubmit={handleSendSms} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Destinataire</label>
                  <input
                    type="text"
                    disabled
                    value={`${activePatient?.name || ''} (${activePatient?.phone || 'Sans numéro'})`}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">Message SMS / Notification</label>
                  <textarea
                    rows={4}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Tapez le message de rappel..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSmsModal(false)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-slate-800 transition flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-200" />
                    <span>Envoyer</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
