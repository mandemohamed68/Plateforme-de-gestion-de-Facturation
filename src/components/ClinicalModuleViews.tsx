import React, { useState } from 'react';
import {
  Activity,
  UserCheck,
  Stethoscope,
  Microscope,
  FlaskConical,
  Bed,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Plus,
  Printer,
  Calendar,
  Radio,
  ArrowRight,
  Eye,
  Volume2,
  CreditCard,
  Send,
  Heart,
  Thermometer,
  Gauge,
  Check,
  Pill,
  Trash2,
  Sparkles,
  ChevronRight,
  Info,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  X,
  User,
  Scale,
  Syringe,
  Droplets,
  Edit2
} from 'lucide-react';
import {
  MedicalConsultation,
  ResPartner,
  LabExamOrder,
  CompanySettings,
  ResUser,
  AppView,
  AccountMove
} from '../types';
import {
  VitalsModal,
  TriageModal,
  PrescriptionModal,
  ReferralModal,
  ExternalPrescriptionModal,
  playHospitalChime
} from './ClinicalModals';
import { printDocumentById } from '../lib/printUtils';

export interface ClinicalViewProps {
  currentView: AppView;
  consultations: MedicalConsultation[];
  partners: ResPartner[];
  moves?: AccountMove[];
  labOrders?: LabExamOrder[];
  company?: CompanySettings;
  currentUser: ResUser | null;
  onNavigateToView: (view: AppView) => void;
  onNewConsultation?: () => void;
  onRefreshData?: () => Promise<void>;
  onSelectConsultation?: (consultation: MedicalConsultation) => void;
}

// -------------------------------------------------------------
// 1. INFIRMIER MODULE VIEWS
// -------------------------------------------------------------

// 1.1 PATIENTS EN ATTENTE (ACCUEIL & FILE ACTIVE)
export const InfirmierQueueTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  currentUser,
  company,
  onNavigateToView,
  onRefreshData,
}) => {
  const [calledPatient, setCalledPatient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeVitalsConsult, setActiveVitalsConsult] = useState<MedicalConsultation | null>(null);
  const [activeTriageConsult, setActiveTriageConsult] = useState<MedicalConsultation | null>(null);
  const [activeReferralConsult, setActiveReferralConsult] = useState<MedicalConsultation | null>(null);
  const [activePrescriptionConsult, setActivePrescriptionConsult] = useState<MedicalConsultation | null>(null);

  const activeQueue = consultations.filter((c) => {
    // Exclude if already completed or cancelled
    if (c.status === 'completed' || c.status === 'cancelled') return false;

    // Exclude if referred to doctor or specialist
    const isReferred = Boolean(
      (c as any).referred_to_doctor ||
      c.status === 'referred' ||
      c.referral_reason ||
      (c.referral_history && c.referral_history.length > 0)
    );
    if (isReferred) return false;

    // Exclude if vitals have already been recorded and transferred to doctor
    if (c.vitals?.taken_at || c.status === 'waiting') return false;

    // Only patients who are pending triage / vitals
    const isQueueStatus = c.status === 'triage' || (c.status === 'pending_payment' && !c.has_pending_balance);
    if (!isQueueStatus) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (c.patient_name && c.patient_name.toLowerCase().includes(s)) ||
      (c.patient_ndm && c.patient_ndm.toLowerCase().includes(s)) ||
      (c.consultation_number && c.consultation_number.toLowerCase().includes(s)) ||
      (c.chief_complaint && c.chief_complaint.toLowerCase().includes(s))
    );
  });

  const handleCall = (name: string) => {
    playHospitalChime();
    setCalledPatient(name);
    setTimeout(() => setCalledPatient(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <VitalsModal
        consultation={activeVitalsConsult}
        isOpen={Boolean(activeVitalsConsult)}
        onClose={() => setActiveVitalsConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <TriageModal
        consultation={activeTriageConsult}
        isOpen={Boolean(activeTriageConsult)}
        onClose={() => setActiveTriageConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
      />

      <ReferralModal
        consultation={activeReferralConsult}
        isOpen={Boolean(activeReferralConsult)}
        onClose={() => setActiveReferralConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <PrescriptionModal
        consultation={activePrescriptionConsult}
        isOpen={Boolean(activePrescriptionConsult)}
        onClose={() => setActivePrescriptionConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        company={company}
        currentUser={currentUser}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-700" />
            File d'Attente - Accueil & Triage Infirmier
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Réception des patients, prise des constantes, ordonnances infirmières et orientation vers le médecin
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('infirmier_vitals')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>Triage & Constantes</span>
          </button>
          <button
            onClick={() => onNavigateToView('infirmier_prescriptions')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Prescriptions</span>
          </button>
          <button
            onClick={() => onNavigateToView('infirmier_referred')}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition border border-purple-200 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Patients Référés</span>
          </button>
        </div>
      </div>

      {calledPatient && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl flex items-center justify-between text-xs font-bold transition animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span>Appel sonore émis au guichet : <strong>{calledPatient}</strong></span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">Box Infirmier 1 • Immédiat</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeQueue.length} Patient{activeQueue.length > 1 ? 's' : ''} en attente
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher patient, NDM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Motif d'arrivée</th>
                <th className="py-2.5 px-4">Priorité CCMU</th>
                <th className="py-2.5 px-4">Constantes Vitales</th>
                <th className="py-2.5 px-4">Statut Parcours</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium">Aucun patient en attente dans la file infirmière.</p>
                  </td>
                </tr>
              ) : (
                activeQueue.map((c, idx) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  const hasVitals = Boolean(
                    c.vitals &&
                    (c.vitals.bp_systolic || c.vitals.heart_rate || c.vitals.temperature || c.vitals.taken_at)
                  );
                  const isReferred = Boolean((c as any).referred_to_doctor || (c.notes && c.notes.includes('Référé')));

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 font-bold">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{c.patient_name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span>{c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}</span>
                          {c.patient_gender && (
                            <>
                              <span>•</span>
                              <span>{c.patient_gender}</span>
                            </>
                          )}
                          {c.patient_age && (
                            <>
                              <span>•</span>
                              <span>{c.patient_age} ans</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {c.chief_complaint || c.specialty || 'Consultation générale'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            c.priority === 'critique'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.priority === 'urgent'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.priority === 'critique' ? 'CCMU 1 - Détresse' : c.priority === 'urgent' ? 'CCMU 2 - Urgent' : 'CCMU 3 - Stable'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasVitals ? (
                          <div className="font-mono text-slate-900 space-y-0.5">
                            <div>
                              TA : <strong>{c.vitals?.bp_systolic && c.vitals?.bp_diastolic ? `${c.vitals.bp_systolic}/${c.vitals.bp_diastolic}` : '--'}</strong>
                              <span className="text-slate-500 ml-1">mmHg</span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              FC : {c.vitals?.heart_rate || '--'} bpm | T° : {c.vitals?.temperature || '--'}°C
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            À relever
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isReferred ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                            Référé Médecin
                          </span>
                        ) : hasVitals ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Constantes Validées
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            Au Guichet
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleCall(c.patient_name)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                          title="Faire sonner l'appel au guichet"
                        >
                          Appeler
                        </button>
                        <button
                          onClick={() => setActiveVitalsConsult(c)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition"
                          title="Saisir ou modifier les constantes"
                        >
                          Constantes
                        </button>
                        <button
                          onClick={() => setActiveTriageConsult(c)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                          title="Requalifier niveau d'urgence CCMU et box"
                        >
                          Triage
                        </button>
                        <button
                          onClick={() => setActivePrescriptionConsult(c)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-xs border border-blue-200 transition"
                          title="Ordonnance ou soin infirmier"
                        >
                          Ordonnance
                        </button>
                        <button
                          onClick={() => setActiveReferralConsult(c)}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs transition"
                          title="Cas dépassant les compétences infirmières : Référer au Médecin"
                        >
                          Référer Médecin
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
    </div>
  );
};

// 1.2 TRIAGE & CONSTANTES VITALES
export const InfirmierTriageTableView: React.FC<ClinicalViewProps> = (props) => {
  return <InfirmierVitalsTableView {...props} />;
};

export const InfirmierVitalsTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  currentUser,
  onRefreshData,
}) => {
  const [activeVitalsConsult, setActiveVitalsConsult] = useState<MedicalConsultation | null>(null);
  const [activeTriageConsult, setActiveTriageConsult] = useState<MedicalConsultation | null>(null);
  const [activeReferralConsult, setActiveReferralConsult] = useState<MedicalConsultation | null>(null);

  return (
    <div className="space-y-6">
      <VitalsModal
        consultation={activeVitalsConsult}
        isOpen={Boolean(activeVitalsConsult)}
        onClose={() => setActiveVitalsConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <TriageModal
        consultation={activeTriageConsult}
        isOpen={Boolean(activeTriageConsult)}
        onClose={() => setActiveTriageConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
      />

      <ReferralModal
        consultation={activeReferralConsult}
        isOpen={Boolean(activeReferralConsult)}
        onClose={() => setActiveReferralConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-700" />
            Relevé des Constantes & Evaluation Triage (CCMU)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Surveillance des constantes vitales, indices d'alerte clinique et classification d'urgence CCMU
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {consultations.length} Patients suivis au poste infirmier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">CCMU</th>
                <th className="py-2.5 px-4">Tension (TA)</th>
                <th className="py-2.5 px-4">Pouls (FC)</th>
                <th className="py-2.5 px-4">SpO2</th>
                <th className="py-2.5 px-4">Température</th>
                <th className="py-2.5 px-4">Poids / Taille</th>
                <th className="py-2.5 px-4">Douleur EVA</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucune consultation répertoriée.
                  </td>
                </tr>
              ) : (
                consultations.map((c) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  const v = c.vitals;
                  const isRecorded = Boolean(v && (v.bp_systolic || v.heart_rate || v.temperature || v.taken_at));

                  const highBp = v?.bp_systolic && parseInt(v.bp_systolic) >= 140;
                  const highFever = v?.temperature && parseFloat(v.temperature) >= 38.5;
                  const lowSpo2 = v?.spo2 && parseInt(v.spo2) < 94;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            c.priority === 'critique'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.priority === 'urgent'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.priority === 'critique' ? 'CCMU 1' : c.priority === 'urgent' ? 'CCMU 2' : 'CCMU 3'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-mono font-bold ${highBp ? 'text-rose-700 bg-rose-50/50' : 'text-slate-900'}`}>
                        {v?.bp_systolic && v?.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic} mmHg` : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {v?.heart_rate ? `${v.heart_rate} bpm` : '--'}
                      </td>
                      <td className={`py-3 px-4 font-mono ${lowSpo2 ? 'text-rose-700 font-bold bg-rose-50/50' : 'text-slate-700'}`}>
                        {v?.spo2 ? `${v.spo2}%` : '--'}
                      </td>
                      <td className={`py-3 px-4 font-mono ${highFever ? 'text-rose-700 font-bold bg-rose-50/50' : 'text-slate-700'}`}>
                        {v?.temperature ? `${v.temperature}°C` : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {v?.weight ? `${v.weight} kg` : '--'} {v?.height ? `/ ${v.height} cm` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {v?.pain_level !== undefined && v?.pain_level !== null ? `${v.pain_level}/10` : '--'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setActiveVitalsConsult(c)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition"
                        >
                          {isRecorded ? 'Modifier Constantes' : 'Saisir Constantes'}
                        </button>
                        <button
                          onClick={() => setActiveTriageConsult(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                        >
                          Box & Triage
                        </button>
                        <button
                          onClick={() => setActiveReferralConsult(c)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs transition"
                          title="Cas dépassant compétence infirmière : Référer au médecin"
                        >
                          Référer Médecin
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
    </div>
  );
};

// 1.3 PRESCRIPTIONS & ORDONNANCES INFIRMIÈRES
export const InfirmierPrescriptionsTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  company,
  currentUser,
  onRefreshData,
}) => {
  const [activePrescriptionConsult, setActivePrescriptionConsult] = useState<MedicalConsultation | null>(null);
  const [activeExternalConsult, setActiveExternalConsult] = useState<MedicalConsultation | null>(null);
  const [activeReferralConsult, setActiveReferralConsult] = useState<MedicalConsultation | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'internal' | 'external'>('all');

  const filteredConsultations = consultations.filter((c) => {
    const items = c.prescribed_items || [];
    const isExternal = Boolean((c as any).patient_choice === 'external' || (c as any).is_external);
    if (filterMode === 'internal' && isExternal) return false;
    if (filterMode === 'external' && !isExternal) return false;

    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.patient_name.toLowerCase().includes(s) ||
      (c.patient_ndm && c.patient_ndm.toLowerCase().includes(s)) ||
      (c.consultation_number && c.consultation_number.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <PrescriptionModal
        consultation={activePrescriptionConsult}
        isOpen={Boolean(activePrescriptionConsult)}
        onClose={() => setActivePrescriptionConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        company={company}
        currentUser={currentUser}
      />

      <ExternalPrescriptionModal
        consultation={activeExternalConsult}
        items={activeExternalConsult?.prescribed_items || []}
        notes={activeExternalConsult?.medical_notes}
        isOpen={Boolean(activeExternalConsult)}
        onClose={() => setActiveExternalConsult(null)}
        company={company}
      />

      <ReferralModal
        consultation={activeReferralConsult}
        isOpen={Boolean(activeReferralConsult)}
        onClose={() => setActiveReferralConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            Prescriptions Infirmières & Protocoles de Soins
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Établissement des ordonnances et soins infirmiers autorisés (antalgiques 1, soins locaux, antiseptiques) et choix d'accord du patient
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Toutes les Prescriptions
            </button>
            <button
              onClick={() => setFilterMode('internal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'internal' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Circuit Interne (Accord Caisse)
            </button>
            <button
              onClick={() => setFilterMode('external')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'external' ? 'bg-purple-800 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Ordonnance Externe Imprimée
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher patient, ordonnance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Date & Réf</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Éléments Prescrits / Soins</th>
                <th className="py-2.5 px-4">Praticien Prescripteur</th>
                <th className="py-2.5 px-4">Circuit Accord Patient</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucune prescription enregistrée sous ce filtre.
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((c) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  const items = c.prescribed_items || [];
                  const isExternal = Boolean((c as any).patient_choice === 'external' || (c as any).is_external);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.consultation_number}
                        <span className="block text-[11px] font-normal text-slate-500 font-sans">
                          {new Date(c.consultation_date).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {items.length > 0 ? (
                          <div className="space-y-0.5">
                            {items.slice(0, 2).map((it: any, i: number) => (
                              <div key={i} className="truncate">
                                • <strong className="text-slate-900">{it.name}</strong> {it.dosage ? `(${it.dosage})` : ''}
                              </div>
                            ))}
                            {items.length > 2 && (
                              <span className="text-[10px] text-slate-500 italic">
                                + {items.length - 2} autre(s) élément(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Protocole de soin infirmier</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {c.doctor_name || currentUser?.name || 'Infirmier Soignant'}
                      </td>
                      <td className="py-3 px-4">
                        {isExternal ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                            Ordonnance Externe
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Circuit Interne Caisse
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setActivePrescriptionConsult(c)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition"
                        >
                          Voir Ordonnance
                        </button>
                        <button
                          onClick={() => setActiveExternalConsult(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                        >
                          Bulletin Externe
                        </button>
                        <button
                          onClick={() => setActiveReferralConsult(c)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs transition"
                          title="Référer au Médecin"
                        >
                          Référer Médecin
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
    </div>
  );
};

// 1.4 PATIENTS RÉFÉRÉS / ORIENTÉS VERS UN MÉDECIN
export const InfirmierReferredTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  currentUser,
  onRefreshData,
}) => {
  const [activeReferralConsult, setActiveReferralConsult] = useState<MedicalConsultation | null>(null);
  const [activeVitalsConsult, setActiveVitalsConsult] = useState<MedicalConsultation | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const referredList = consultations.filter((c) => {
    const isRef = Boolean(
      (c as any).referred_to_doctor ||
      c.status === 'referred' ||
      c.referral_reason ||
      (c.notes && c.notes.toLowerCase().includes('référé')) ||
      (c.referral_history && c.referral_history.length > 0)
    );
    if (!isRef) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.patient_name.toLowerCase().includes(s) ||
      (c.patient_ndm && c.patient_ndm.toLowerCase().includes(s)) ||
      (c.referral_reason && c.referral_reason.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <ReferralModal
        consultation={activeReferralConsult}
        isOpen={Boolean(activeReferralConsult)}
        onClose={() => setActiveReferralConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <VitalsModal
        consultation={activeVitalsConsult}
        isOpen={Boolean(activeVitalsConsult)}
        onClose={() => setActiveVitalsConsult(null)}
        onSaved={async () => {
          if (onRefreshData) await onRefreshData();
        }}
        currentUser={currentUser}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-700" />
            Registre des Patients Référés / Orientés au Médecin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dossiers transférés au Médecin Généraliste ou Spécialiste pour dépassement de compétences infirmières ou examen médical complexe
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {referredList.length} Fiches de référence enregistrées
          </span>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher référence, patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Transfert Métier</th>
                <th className="py-2.5 px-4">Motif de la Référence (Compétence / Symptôme)</th>
                <th className="py-2.5 px-4">Urgence</th>
                <th className="py-2.5 px-4">Statut Prise en Charge</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun patient référé pour le moment.
                  </td>
                </tr>
              ) : (
                referredList.map((c) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  const reason = (c as any).referral_reason || 'Dépassement de compétences infirmières / Diagnostic complexe';
                  const isDone = c.status === 'completed';
                  const inProgress = c.status === 'in_consultation';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-900">
                        Infirmier ➔ {c.doctor_name || 'Médecin Généraliste / Spécialiste'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            c.priority === 'critique'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.priority === 'urgent'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.priority === 'critique' ? 'Critique' : c.priority === 'urgent' ? 'Urgent' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isDone ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Consultation Terminée
                          </span>
                        ) : inProgress ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            En Consultation Médecin
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            Attente Prise en Charge
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setActiveReferralConsult(c)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs transition"
                        >
                          Fiche de Référence
                        </button>
                        <button
                          onClick={() => setActiveVitalsConsult(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                        >
                          Constantes
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
    </div>
  );
};

// 1.5 REGISTRE DES ACTES & SOINS INFIRMIERS
export const InfirmierCareTableView: React.FC<ClinicalViewProps> = ({
  currentUser,
  consultations = [],
  partners = [],
}) => {
  const [soinsList, setSoinsList] = useState([
    { id: 1, patient: 'Koffi Marie-Claire', acte: 'Injection intramusculaire Ceftriaxone 1g', heure: '08:30', infirmiere: 'Inf. Touré', statut: 'Administré' },
    { id: 2, patient: 'Diallo Oumar', acte: 'Perfusion Sérum Physiologique 500ml', heure: '09:15', infirmiere: 'Inf. Konan', statut: 'En cours' },
    { id: 3, patient: 'Bamba Awa', acte: 'Pansement stérile plaie chirurgicale', heure: '10:00', infirmiere: 'Inf. Touré', statut: 'Planifié' },
  ]);

  // Assistant guided states
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedPatientNdm, setSelectedPatientNdm] = useState('');
  const [selectedPatientConsultId, setSelectedPatientConsultId] = useState<number | null>(null);
  
  const [selectedCareNames, setSelectedCareNames] = useState<string[]>([]);
  const [customCareName, setCustomCareName] = useState('');
  const [selectedCareCategory, setSelectedCareCategory] = useState<'injection' | 'dressing' | 'perfusion' | 'vitals' | 'oral' | 'other'>('other');

  // Double Check Security criteria
  const [checkPatient, setCheckPatient] = useState(false);
  const [checkDrug, setCheckDrug] = useState(false);
  const [checkDose, setCheckDose] = useState(false);
  const [checkRoute, setCheckRoute] = useState(false);

  // General Filter / Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTabFilter, setStatusTabFilter] = useState<'all' | 'planifie' | 'encours' | 'administre'>('all');
  const [showAssistant, setShowAssistant] = useState(true);

  // Search in clinic queue for selection
  const [patientQueueSearch, setPatientQueueSearch] = useState('');

  // 1-Click Care Presets
  const CARE_PRESETS = [
    { name: 'Injection IM Ceftriaxone 1g', cat: 'injection' as const },
    { name: 'Injection IV Paracétamol 1g', cat: 'injection' as const },
    { name: 'Perfusion Sérum Salé Isotonique 0.9% 500ml', cat: 'perfusion' as const },
    { name: 'Perfusion Sérum Glucose 5% 500ml', cat: 'perfusion' as const },
    { name: 'Pansement stérile (Nettoyage & Bandage)', cat: 'dressing' as const },
    { name: 'Ablation de fils de suture', cat: 'dressing' as const },
    { name: 'Soin des Constantes (TA, Température, Pouls)', cat: 'vitals' as const },
    { name: 'Glycémie Capillaire (Dextro)', cat: 'vitals' as const },
    { name: 'Administration Paracétamol Comprimé Oral', cat: 'oral' as const },
  ];

  // Derive patients list with clinical consultations to select from
  const clinicalPatients = consultations.filter(c => {
    // Show active or recently completed consultations
    return c.status !== 'cancelled';
  });

  const filteredClinicalPatients = clinicalPatients.filter(c => {
    if (!patientQueueSearch) return true;
    const term = patientQueueSearch.toLowerCase();
    return (
      (c.patient_name && c.patient_name.toLowerCase().includes(term)) ||
      (c.patient_ndm && c.patient_ndm.toLowerCase().includes(term))
    );
  });

  const handleSelectPatient = (c: MedicalConsultation) => {
    setSelectedPatientName(c.patient_name);
    setSelectedPatientNdm(c.patient_ndm || 'N/A');
    setSelectedPatientConsultId(c.id);
    
    // Auto-advance to Step 2
    setActiveStep(2);
    // Reset any loaded care
    setSelectedCareNames([]);
    setCustomCareName('');
  };

  const handleSelectPreset = (presetName: string, cat: any) => {
    setSelectedCareCategory(cat);
    setSelectedCareNames(prev =>
      prev.includes(presetName) ? prev.filter(n => n !== presetName) : [...prev, presetName]
    );
  };

  const handleSaveSoin = (customStatus?: 'Administré' | 'En cours' | 'Planifié') => {
    if (!selectedPatientName) return;
    const finalCare = selectedCareNames.length > 0 ? selectedCareNames.join(' + ') : (customCareName || 'Soin Infirmier Standard');
    
    const finalStatus = customStatus || 'Administré';

    const newItem = {
      id: Date.now(),
      patient: selectedPatientName,
      acte: finalCare,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      infirmiere: currentUser?.name || 'Inf. Touré',
      statut: finalStatus
    };

    setSoinsList([newItem, ...soinsList]);
    
    // Reset wizard
    setSelectedPatientName('');
    setSelectedPatientNdm('');
    setSelectedPatientConsultId(null);
    setSelectedCareNames([]);
    setCustomCareName('');
    setCheckPatient(false);
    setCheckDrug(false);
    setCheckDose(false);
    setCheckRoute(false);
    setActiveStep(1);
  };

  const handleDeleteSoin = (id: number) => {
    setSoinsList(soinsList.filter(s => s.id !== id));
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    setSoinsList(soinsList.map(s => s.id === id ? { ...s, statut: newStatus } : s));
  };

  // Find prescriptions for selected patient
  const selectedPatientConsultation = consultations.find(c => c.id === selectedPatientConsultId);
  const patientPrescriptions = selectedPatientConsultation?.prescribed_items || [];
  const nursingPrescriptions = patientPrescriptions.filter(
    item => item.type === 'medication' || item.type === 'act'
  );

  // Stats
  const statTotal = soinsList.length;
  const statAdministre = soinsList.filter(s => s.statut === 'Administré').length;
  const statEnCours = soinsList.filter(s => s.statut === 'En cours').length;
  const statPlanifie = soinsList.filter(s => s.statut === 'Planifié').length;

  // Filter daily registry table
  const filteredRegistry = soinsList.filter(s => {
    // Search
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const patientMatch = s.patient.toLowerCase().includes(term);
      const careMatch = s.acte.toLowerCase().includes(term);
      if (!patientMatch && !careMatch) return false;
    }

    // Tab Filter
    if (statusTabFilter === 'planifie') return s.statut === 'Planifié';
    if (statusTabFilter === 'encours') return s.statut === 'En cours';
    if (statusTabFilter === 'administre') return s.statut === 'Administré';

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header with custom visual overview and simple toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Activity className="w-5.5 h-5.5 text-indigo-600" />
            Cahier Numérique de Soins Infirmiers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrement sécurisé, validation des prescriptions médicales et suivi de l&apos;administration des soins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssistant(!showAssistant)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
              showAssistant
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>{showAssistant ? "Masquer l'Assistant" : "Afficher l'Assistant"}</span>
          </button>
          <button
            onClick={() => printDocumentById('infirmier-soins-registry-table', 'Registre_Soins_Infirmiers')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimer le Registre</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Dashboard Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Soins Aujourd&apos;hui</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{statTotal}</span>
          </div>
          <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Soins Administrés</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{statAdministre}</span>
          </div>
          <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfusions / Actifs</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{statEnCours}</span>
          </div>
          <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planifiés / À venir</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{statPlanifie}</span>
          </div>
          <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Administration Form */}
      {showAssistant && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          
          {/* Progress Tracker bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Administration des Soins Infirmiers</h2>
                <p className="text-[11px] text-slate-500">Prise en charge du patient, validation d&apos;ordonnance et double-contrôle d&apos;administration</p>
              </div>
            </div>

            {/* Steps visual badges */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((stepNum) => (
                <button
                  key={stepNum}
                  disabled={
                    (stepNum === 2 && !selectedPatientName) ||
                    (stepNum === 3 && (!selectedPatientName || (selectedCareNames.length === 0 && !customCareName)))
                  }
                  onClick={() => setActiveStep(stepNum as any)}
                  className={`px-3 py-1.5 rounded-md font-semibold text-[11px] transition flex items-center gap-1.5 ${
                    activeStep === stepNum
                      ? 'bg-slate-900 text-white shadow-xs'
                      : stepNum < activeStep
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                    {stepNum}
                  </span>
                  <span>{stepNum === 1 ? "Patient" : stepNum === 2 ? "Soin" : "Sécurité"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: SELECT PATIENT */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Search & list of active clinical patients */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      1. Sélectionner un Patient Actif (File d&apos;attente)
                    </label>
                    <span className="text-[11px] text-slate-500">Ordonnance médicale active</span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer la file d'attente par nom ou numéro..."
                      value={patientQueueSearch}
                      onChange={(e) => setPatientQueueSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Patients list box */}
                  <div className="border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {filteredClinicalPatients.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 italic text-xs">
                        Aucun patient en attente dans la file médicale.
                      </div>
                    ) : (
                      filteredClinicalPatients.map((c) => {
                        const hasPresc = c.prescribed_items && c.prescribed_items.some(i => i.type === 'medication' || i.type === 'act');
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectPatient(c)}
                            className="p-3 hover:bg-indigo-50/40 cursor-pointer flex justify-between items-center transition"
                          >
                            <div className="space-y-1">
                              <span className="block font-bold text-slate-900 text-xs">{c.patient_name}</span>
                              <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
                                <span>NDM : {c.patient_ndm || 'N/A'}</span>
                                <span>•</span>
                                <span>Dr. {c.doctor_name}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasPresc && (
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Pill className="w-2.5 h-2.5" />
                                  Ordonnance
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPatient(c);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                              >
                                Prendre en charge ➔
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right side: Manual Walk-in addition */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-sm">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    Patient Externe (Saisie Libre)
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Saisissez directement l&apos;identité pour un patient externe venant uniquement pour des soins infirmiers isolés.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500">Nom du Patient</label>
                    <input
                      type="text"
                      placeholder="Ex: Kouamé Koffi Albert"
                      value={selectedPatientName}
                      onChange={(e) => {
                        setSelectedPatientName(e.target.value);
                        setSelectedPatientNdm('EXTERNE');
                        setSelectedPatientConsultId(null);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50/50 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    disabled={!selectedPatientName.trim()}
                    onClick={() => setActiveStep(2)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 rounded-lg transition disabled:opacity-50"
                  >
                    Valider le Patient Externe ➔
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE CARE (ACTE) */}
          {activeStep === 2 && (
            <div className="space-y-4">
              
              {/* Back to Step 1 & Selected Patient Mini Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour (Étape 1)</span>
                  </button>
                  <div>
                    <span>Patient : <strong>{selectedPatientName}</strong></span>
                    <span className="text-slate-400 ml-2 font-mono text-[10px]">({selectedPatientNdm})</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatientName('');
                    setActiveStep(1);
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Changer de patient
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Doctor's Prescription List (If matched) */}
                <div className="lg:col-span-5 space-y-3">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                    <span>Prescriptions du Médecin Traitant</span>
                  </span>
                  
                  {nursingPrescriptions.length === 0 ? (
                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 italic text-xs leading-relaxed">
                      Aucune ordonnance rédigée par le médecin pour ce patient.<br/>
                      Utilisez la palette de soins rapides à droite.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {nursingPrescriptions.map((presc) => {
                        const isLoaded = selectedCareNames.includes(presc.name);
                        return (
                          <div
                            key={presc.id}
                            onClick={() => handleSelectPreset(presc.name, presc.type === 'act' ? 'dressing' : 'injection')}
                            className={`p-3 border rounded-xl cursor-pointer transition flex items-center justify-between ${
                              isLoaded
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <span className="block font-bold text-xs">{presc.name}</span>
                              <span className={`text-[10px] mt-0.5 block ${isLoaded ? 'text-indigo-100' : 'text-slate-400'}`}>
                                Instructions : {presc.instructions || 'Soin standard'}
                              </span>
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isLoaded ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {presc.type === 'act' ? 'Acte' : 'Médic.'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Preset Quick Choices (1-Click Palette) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-600" />
                      <span>Saisie Express (Sélection multiple de soins)</span>
                    </span>
                    {selectedCareNames.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCareNames([])}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        Tout désélectionner ({selectedCareNames.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CARE_PRESETS.map((preset, idx) => {
                      const isSelected = selectedCareNames.includes(preset.name);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreset(preset.name, preset.cat)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 relative ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs ring-2 ring-indigo-500/30'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <Pill className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-bold leading-tight flex-1">{preset.name}</span>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Custom Free Text Input */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Soins Sélectionnés ({selectedCareNames.length}) / Saisie Manuelle</span>
                  {selectedCareNames.length > 0 && (
                    <span className="text-indigo-600 font-bold truncate max-w-md">
                      {selectedCareNames.join(' + ')}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Sélectionnez un ou plusieurs presets ci-dessus ou saisissez ici..."
                    value={selectedCareNames.length > 0 ? selectedCareNames.join(' + ') : customCareName}
                    onChange={(e) => {
                      setCustomCareName(e.target.value);
                      if (e.target.value) setSelectedCareNames([]);
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <button
                    disabled={selectedCareNames.length === 0 && !customCareName.trim()}
                    onClick={() => setActiveStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Suivant : Contrôle de Sécurité</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: SECURITY CHECKLIST & VALIDATION */}
          {activeStep === 3 && (
            <div className="space-y-4">
              
              {/* Back to Step 2 Header */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-xs transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Retour à la sélection des soins</span>
                </button>
                <span className="text-xs font-semibold text-slate-500">Étape 3 / 3</span>
              </div>
              
              {/* Care summary card - Clean, light, professional */}
              <div className="bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                      Soin infirmier ({selectedCareNames.length || 1} acte{selectedCareNames.length > 1 ? 's' : ''})
                    </span>
                    <span className="text-xs text-slate-600">Patient : <strong className="text-slate-900">{selectedPatientName}</strong> ({selectedPatientNdm})</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-0.5">
                    <Syringe className="w-4 h-4 text-slate-700" />
                    <span>{selectedCareNames.length > 0 ? selectedCareNames.join(' + ') : customCareName}</span>
                  </h4>
                </div>
                <button
                  onClick={() => setActiveStep(2)}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
              </div>

              {/* Safety rules checklist */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">Double-contrôle de sécurité médico-infirmier</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Protocole de conformité R02</span>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Veuillez cocher les 4 critères obligatoires pour certifier la sécurité de l&apos;administration :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  
                  <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    checkPatient ? 'bg-slate-50 border-slate-400 text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={checkPatient}
                      onChange={(e) => setCheckPatient(e.target.checked)}
                      className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="block font-bold text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span>Patient correct</span>
                      </span>
                      <span className="text-[11px] text-slate-500">Identité vérifiée par bracelet ou oralement</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    checkDrug ? 'bg-slate-50 border-slate-400 text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={checkDrug}
                      onChange={(e) => setCheckDrug(e.target.checked)}
                      className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="block font-bold text-xs flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-slate-600" />
                        <span>Médicament correct</span>
                      </span>
                      <span className="text-[11px] text-slate-500">Ampoule, flacon ou consommable contrôlé</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    checkDose ? 'bg-slate-50 border-slate-400 text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={checkDose}
                      onChange={(e) => setCheckDose(e.target.checked)}
                      className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="block font-bold text-xs flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-600" />
                        <span>Dose correcte</span>
                      </span>
                      <span className="text-[11px] text-slate-500">Concentration et posologie vérifiées</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    checkRoute ? 'bg-slate-50 border-slate-400 text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={checkRoute}
                      onChange={(e) => setCheckRoute(e.target.checked)}
                      className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="block font-bold text-xs flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                        <span>Voie correcte</span>
                      </span>
                      <span className="text-[11px] text-slate-500">Mode d&apos;administration contrôlé (IM, IV, PO...)</span>
                    </div>
                  </label>

                </div>
              </div>

              {/* Status Choice & Validation Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                
                {/* Save as Administré */}
                <button
                  disabled={!(checkPatient && checkDrug && checkDose && checkRoute)}
                  onClick={() => handleSaveSoin('Administré')}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer le soin administré</span>
                </button>

                {/* Save as En cours */}
                <button
                  disabled={!(checkPatient && checkDrug && checkDose && checkRoute)}
                  onClick={() => handleSaveSoin('En cours')}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>Démarrer perfusion (En cours)</span>
                </button>

                {/* Save as Planifié */}
                <button
                  disabled={!(checkPatient && checkDrug && checkDose && checkRoute)}
                  onClick={() => handleSaveSoin('Planifié')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Planifier pour plus tard</span>
                </button>

              </div>

            </div>
          )}

        </div>
      )}

      {/* 4. DAILY CARE REGISTER LOGS */}
      <div id="infirmier-soins-registry-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Registry header controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          
          {/* Tabs for status */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'all', label: 'Tous les actes' },
              { id: 'planifie', label: 'Planifiés (À faire)' },
              { id: 'encours', label: 'En Cours (Actifs)' },
              { id: 'administre', label: 'Administrés (Terminés)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusTabFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusTabFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick search input */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher patient ou acte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

        </div>

        {/* Registry table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                <th className="py-3 px-4">Heure de Saisie</th>
                <th className="py-3 px-4">Nom du Patient</th>
                <th className="py-3 px-4">Prescription & Soin Exécuté</th>
                <th className="py-3 px-4">Professionnel de Soins</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions Cliniques</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistry.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Aucun acte enregistré dans ce filtre aujourd&apos;hui.
                  </td>
                </tr>
              ) : (
                filteredRegistry.map((s) => {
                  let badgeStyle = "bg-slate-100 text-slate-800 border-slate-200";
                  if (s.statut === 'Administré') badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  if (s.statut === 'En cours') badgeStyle = "bg-blue-100 text-blue-800 border-blue-200 animate-pulse";
                  if (s.statut === 'Planifié') badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {s.heure}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-950">
                        {s.patient}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold text-[13px]">
                        {s.acte}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {s.infirmiere}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${badgeStyle}`}>
                          {s.statut}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          
                          {/* Validate actions depending on status */}
                          {s.statut === 'Planifié' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'En cours')}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[10px] px-2.5 py-1 rounded-md transition"
                              >
                                Démarrer
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'Administré')}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-2.5 py-1 rounded-md transition"
                              >
                                Administrer
                              </button>
                            </>
                          )}

                          {s.statut === 'En cours' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'Administré')}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition"
                            >
                              Finaliser
                            </button>
                          )}

                          {/* Delete action */}
                          <button
                            onClick={() => handleDeleteSoin(s.id)}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-slate-100 rounded transition shrink-0"
                            title="Supprimer l'acte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

// -------------------------------------------------------------
// 2. MÉDECIN GÉNÉRALISTE MODULE VIEWS
// -------------------------------------------------------------

export const MedecinQueueTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  onNavigateToView,
  onRefreshData,
  onSelectConsultation,
}) => {
  // Patients ready for doctor consultation (strictly active, non-completed, non-specialist)
  const doctorQueue = consultations.filter((c) => {
    if (c.status === 'completed' || c.status === 'cancelled') return false;

    // If transferred to a specialist, exclude from general doctor queue
    const isSpecialist =
      (c as any).target_level === 'specialiste' ||
      c.doctor_type === 'specialiste' ||
      (c.specialty && (
        c.specialty.toLowerCase().includes('spécial') ||
        c.specialty.toLowerCase().includes('cardio') ||
        c.specialty.toLowerCase().includes('pédiatrie') ||
        c.specialty.toLowerCase().includes('gynéco') ||
        c.specialty.toLowerCase().includes('ophtalmo')
      ));
    if (isSpecialist) return false;

    // Initial unpaid admission without reliquat: caisse must handle first
    if (c.status === 'pending_payment' && !c.has_pending_balance) return false;

    return (
      c.status === 'waiting' ||
      c.status === 'in_consultation' ||
      c.status === 'triage' ||
      c.status === 'referred' ||
      Boolean((c as any).referred_to_doctor) ||
      (c.status === 'pending_payment' && Boolean(c.has_pending_balance))
    );
  });

  const [payingReliquatId, setPayingReliquatId] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePayReliquat = async (c: MedicalConsultation) => {
    setPayingReliquatId(c.id);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/consultations/${c.id}/pay-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setStatusBanner({
          type: 'success',
          message: `Reliquat de ${(c.reliquat_amount || 5000).toLocaleString('fr-FR')} FCFA réglé avec succès à la Caisse (Reçu ${data.receipt_number || 'REC-REL'}). Le patient est débloqué pour la consultation !`,
        });
        if (onRefreshData) await onRefreshData();
      } else {
        setStatusBanner({
          type: 'error',
          message: "Erreur lors de l'enregistrement du paiement du reliquat.",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusBanner({
        type: 'error',
        message: "Erreur de connexion au serveur.",
      });
    } finally {
      setPayingReliquatId(null);
    }
  };

  const handleStartConsultation = async (c: MedicalConsultation) => {
    try {
      await fetch(`/api/consultations/${c.id}/start`, { method: 'POST' });
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      console.error(err);
    }
    if (onSelectConsultation) {
      onSelectConsultation(c);
    }
    onNavigateToView('medecin_consultations');
  };

  return (
    <div className="space-y-6">
      {statusBanner && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
          statusBanner.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-slate-700" />
            File d'Attente - Consultation Médicale
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Patients enregistrés et triés prêts pour examen clinique médical et prescription
          </p>
        </div>
        <button
          onClick={() => onNavigateToView('medecin_prescriptions')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Registre des Ordonnances</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {doctorQueue.length} Patient{doctorQueue.length > 1 ? 's' : ''} en salle d'attente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Motif d'arrivée</th>
                <th className="py-2.5 px-4">Constantes vérifiées</th>
                <th className="py-2.5 px-4">Gravité</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctorQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun patient en attente de consultation médicale.
                  </td>
                </tr>
              ) : (
                doctorQueue.map((c) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  const v = c.vitals;
                  const hasVitals = Boolean(v && (v.bp_systolic || v.heart_rate || v.temperature));

                  const hasPendingReliquat = Boolean((c.has_pending_balance && !c.reliquat_paid) || (c.status === 'pending_payment' && c.has_pending_balance));

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                        {c.referred_from && (
                          <span className="inline-block mt-0.5 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            Référé : {c.referred_from}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {c.chief_complaint || c.specialty || 'Consultation standard'}
                        {c.referral_reason && (
                          <span className="block text-[10px] text-slate-500 italic">
                            Motif référé: {c.referral_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {hasVitals ? (
                          <span>
                            TA: {v?.bp_systolic}/{v?.bp_diastolic} | FC: {v?.heart_rate} bpm | T°: {v?.temperature}°C
                          </span>
                        ) : (
                          <span className="text-amber-800 font-sans">En attente prise</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            c.priority === 'critique'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.priority === 'urgent'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.priority || 'normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasPendingReliquat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-50 text-amber-900 border border-amber-300">
                            <CreditCard className="w-3 h-3 text-amber-700" />
                            Reliquat: {(c.reliquat_amount || 5000).toLocaleString('fr-FR')} F
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              c.status === 'in_consultation'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {c.status === 'in_consultation' ? 'En cours' : 'Prêt (Consultation)'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasPendingReliquat ? (
                          <button
                            onClick={() => handlePayReliquat(c)}
                            disabled={payingReliquatId === c.id}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition shadow-sm flex items-center gap-1.5 ml-auto"
                            title="Régler le reliquat tarifaire à la caisse pour débloquer la consultation"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{payingReliquatId === c.id ? 'Encaissement...' : 'Payer Reliquat Caisse'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartConsultation(c)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition"
                          >
                            Prendre en charge
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
    </div>
  );
};

export const MedecinPrescriptionsTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  company,
}) => {
  const [selectedConsult, setSelectedConsult] = useState<MedicalConsultation | null>(null);

  // Flatten all prescriptions from consultations
  const prescriptionRows: {
    consultation: MedicalConsultation;
    date: string;
    patient: string;
    ndm: string;
    doctor: string;
    medsSummary: string;
    count: number;
  }[] = [];

  consultations.forEach((c) => {
    const meds = (c.prescribed_items || []).filter((i) => i.type === 'medication' || !i.type);
    if (meds.length > 0) {
      prescriptionRows.push({
        consultation: c,
        date: new Date(c.consultation_date).toLocaleDateString('fr-FR'),
        patient: c.patient_name,
        ndm: c.patient_ndm || `NDM-${c.partner_id}`,
        doctor: c.doctor_name,
        medsSummary: meds.map((m) => `${m.name} ${m.dosage ? `(${m.dosage})` : ''}`).join(', '),
        count: meds.length,
      });
    }
  });

  return (
    <div className="space-y-6">
      <PrescriptionModal
        consultation={selectedConsult}
        isOpen={Boolean(selectedConsult)}
        onClose={() => setSelectedConsult(null)}
        company={company}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            Registre des Prescriptions & Ordonnances Médicales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité des traitements médicamenteux prescrits et impression d'ordonnances sécurisées
          </p>
        </div>
        <button
          onClick={() => printDocumentById('prescriptions-registry-table', 'Registre_Prescriptions_Medicales')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Imprimer Liste</span>
        </button>
      </div>

      <div id="prescriptions-registry-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {prescriptionRows.length} Ordonnances délivrées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Médecin Prescripteur</th>
                <th className="py-2.5 px-4">Médicaments / Posologie</th>
                <th className="py-2.5 px-4 text-center">Nombre</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptionRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucune ordonnance délivrée pour le moment.
                  </td>
                </tr>
              ) : (
                prescriptionRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.patient}
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {row.doctor}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium max-w-sm truncate">
                      {row.medsSummary}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedConsult(row.consultation)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition flex items-center gap-1.5 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimer</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. MÉDECIN SPÉCIALISTE MODULE VIEWS
// -------------------------------------------------------------

export const SpecialisteReferredTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  onNavigateToView,
  onRefreshData,
  onSelectConsultation,
}) => {
  const [payingReliquatId, setPayingReliquatId] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePayReliquat = async (c: MedicalConsultation) => {
    setPayingReliquatId(c.id);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/consultations/${c.id}/pay-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setStatusBanner({
          type: 'success',
          message: `Reliquat de ${(c.reliquat_amount || 10000).toLocaleString('fr-FR')} FCFA réglé avec succès à la Caisse (Reçu ${data.receipt_number || 'REC-REL'}). Le patient est débloqué pour la consultation spécialisée !`,
        });
        if (onRefreshData) await onRefreshData();
      } else {
        setStatusBanner({
          type: 'error',
          message: "Erreur lors de l'enregistrement du paiement du reliquat.",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusBanner({
        type: 'error',
        message: "Erreur de connexion au serveur.",
      });
    } finally {
      setPayingReliquatId(null);
    }
  };

  // Referred consultations or specialty consultations (strictly active, non completed)
  const referredList = consultations.filter((c) => {
    if (c.status === 'completed' || c.status === 'cancelled') return false;
    if (c.status === 'pending_payment' && !c.has_pending_balance) return false;

    return (
      (c as any).target_level === 'specialiste' ||
      c.doctor_type === 'specialiste' ||
      c.status === 'referred' ||
      Boolean(
        c.specialty && (
          c.specialty.toLowerCase().includes('spécial') ||
          c.specialty.toLowerCase().includes('cardio') ||
          c.specialty.toLowerCase().includes('pédiatrie') ||
          c.specialty.toLowerCase().includes('gynéco') ||
          c.specialty.toLowerCase().includes('ophtalmo')
        )
      )
    );
  });

  return (
    <div className="space-y-6">
      {statusBanner && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
          statusBanner.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-slate-700" />
            Patients Référés & Demandes d'Avis Spécialisés
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dossiers adressés par les médecins généralistes ou les urgences pour expertise médicale approfondie
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {referredList.length} Dossiers spécialisés en attente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Spécialité Demandée</th>
                <th className="py-2.5 px-4">Praticien Adresseur</th>
                <th className="py-2.5 px-4">Motif & Anamnèse</th>
                <th className="py-2.5 px-4">Urgence</th>
                <th className="py-2.5 px-4">Statut Reliquat</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucun avis spécialisé en attente.
                  </td>
                </tr>
              ) : (
                referredList.map((c) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  const hasPendingReliquat = Boolean((c.has_pending_balance && !c.reliquat_paid) || (c.status === 'pending_payment' && c.has_pending_balance));

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.specialty || 'Spécialité'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.referred_from || c.doctor_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm truncate">
                        {c.referral_reason || c.chief_complaint || c.diagnosis || 'Évaluation requise'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            c.priority === 'critique'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.priority === 'urgent'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasPendingReliquat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-50 text-amber-900 border border-amber-300">
                            <CreditCard className="w-3 h-3 text-amber-700" />
                            Reliquat: {(c.reliquat_amount || 5000).toLocaleString('fr-FR')} F
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Prêt (Consultation)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasPendingReliquat ? (
                          <button
                            onClick={() => handlePayReliquat(c)}
                            disabled={payingReliquatId === c.id}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition shadow-sm flex items-center gap-1.5 ml-auto"
                            title="Régler le reliquat tarifaire à la caisse pour débloquer la consultation"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{payingReliquatId === c.id ? 'Encaissement...' : 'Payer Reliquat Caisse'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (onSelectConsultation) onSelectConsultation(c);
                              onNavigateToView('specialiste_consultations');
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                          >
                            Prendre en charge
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
    </div>
  );
};

export const SpecialisteFollowupTableView: React.FC<ClinicalViewProps> = ({
  consultations,
  partners,
  onNavigateToView,
  onSelectConsultation,
}) => {
  // Consultations with next appointment date or chronic followups
  const followups = consultations.filter((c) => c.next_appointment_date || c.diagnosis);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            Suivi des Patients Chroniques & Revues Post-Actes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Programmation des consultations de suivi régulier, surveillance biologique et ajustement thérapeutique
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {followups.length} Patients sous protocole de suivi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Pathologie / Diagnostic</th>
                <th className="py-2.5 px-4">Dernière Consultation</th>
                <th className="py-2.5 px-4">Prochain RDV Contrôle</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun suivi programmé.
                  </td>
                </tr>
              ) : (
                followups.map((c) => {
                  const partner = partners.find((p) => p.id === c.partner_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {c.patient_ndm || partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.diagnosis || c.chief_complaint || 'Suivi clinique'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(c.consultation_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.next_appointment_date || 'À planifier'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {c.status === 'completed' ? 'Clôturé' : 'En suivi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectConsultation) onSelectConsultation(c);
                            onNavigateToView('specialiste_consultations');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                        >
                          Fiche Suivi
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
    </div>
  );
};
