import React, { useState, useMemo } from 'react';
import {
  Activity,
  UserCheck,
  Stethoscope,
  Microscope,
  FlaskConical,
  Bed,
  FileText,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  ArrowRight,
  Shield,
  BarChart3,
  Calendar,
  Building2,
  DollarSign,
  Plus,
  X,
  Eye,
  Filter,
  RefreshCw,
  Printer
} from 'lucide-react';
import {
  MedicalConsultation,
  ResPartner,
  AccountMove,
  AccountPayment,
  TillSession,
  LabExamOrder,
  CompanySettings,
  ResUser,
  AppView
} from '../types';
import { formatFCFA } from '../lib/formatters';
import { isSupervisorOrAdmin, loadAllSessions, openNewCashierSession } from '../utils/caisseSessionService';

interface ModuleDashboardProps {
  currentView: AppView;
  consultations: MedicalConsultation[];
  partners: ResPartner[];
  moves: AccountMove[];
  payments: AccountPayment[];
  tillSessions: TillSession[];
  labOrders: LabExamOrder[];
  users?: ResUser[];
  analytics?: any;
  company?: CompanySettings;
  currentUser: ResUser | null;
  onNavigateToView: (view: AppView) => void;
  onNewInvoice?: () => void;
  onNewPayment?: () => void;
  onPrintReceipt?: (payment: any) => void;
}

// -------------------------------------------------------------
// 1. INFIRMIER DASHBOARD
// -------------------------------------------------------------
export const InfirmierDashboard: React.FC<ModuleDashboardProps> = ({
  consultations,
  partners,
  currentUser,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'urgent' | 'pending_vitals' | 'vitals_done'>('all');

  const waitingTriage = consultations.filter(
    (c) =>
      c.status !== 'completed' &&
      c.status !== 'cancelled' &&
      !c.referred_to_doctor &&
      c.status !== 'referred' &&
      !c.vitals?.taken_at &&
      (c.status === 'triage' || (c.status === 'pending_payment' && !c.has_pending_balance))
  );
  const vitalsCompletedToday = consultations.filter(c => c.vitals?.taken_at);
  const urgentCases = consultations.filter(c => (c.priority === 'urgent' || c.priority === 'critique') && c.status !== 'completed');
  const careActs = consultations.filter(c => c.care_records && c.care_records.length > 0);

  // Vital signs clinical alerts (High BP > 140/90, Fever > 38.5°C, SaO2 < 95%)
  const clinicalAlertsCount = consultations.filter(c => {
    if (!c.vitals) return false;
    const temp = parseFloat(String(c.vitals.temperature || '0'));
    const spo2 = parseInt(String(c.vitals.oxygen_saturation || '100'), 10);
    return (temp >= 38.5) || (spo2 > 0 && spo2 < 95);
  }).length;

  const filteredConsultations = useMemo(() => {
    return consultations.filter(c => {
      const p = partners.find(pt => pt.id === c.partner_id);
      const matchSearch = !searchTerm || 
        (c.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p?.ndm || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      if (filterMode === 'urgent') return c.priority === 'urgent' || c.priority === 'critique';
      if (filterMode === 'pending_vitals') return !c.vitals?.taken_at && c.status !== 'completed';
      if (filterMode === 'vitals_done') return Boolean(c.vitals?.taken_at);
      return true;
    });
  }, [consultations, partners, searchTerm, filterMode]);

  return (
    <div className="space-y-6">
      {/* Hero Header avec profil actif */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Poste Infirmier &amp; Triage Clinique
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Session Active • {currentUser?.name || 'Infirmier(ère)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Évaluation du niveau de gravité, constantes vitales, administration des soins &amp; orientation médicale
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('infirmier_vitals')}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Prendre Constantes</span>
          </button>
          <button
            onClick={() => onNavigateToView('infirmier_triage')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-slate-300" />
            <span>Évaluer Triage</span>
          </button>
          <button
            onClick={() => onNavigateToView('infirmier_queue')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>File Complète</span>
          </button>
        </div>
      </div>

      {/* Subtle Directive Bar for Nursing Flow */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
          <div>
            <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider mr-1.5">Directive Soignant :</span>
            <span className="text-[11px] text-slate-600">
              Respectez le circuit d'admission : <strong>1. Relevé des constantes</strong> ➔ <strong>2. Classification CCMU</strong> ➔ <strong>3. Transfert vers le cabinet médical</strong>.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
          Contrôle Séquentiel Actif
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>En attente de triage</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{waitingTriage.length}</p>
          <span className="text-[11px] text-amber-700 font-medium">Patients en salle d'accueil</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Constantes Relevées</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-700 mt-2">{vitalsCompletedToday.length}</p>
          <span className="text-[11px] text-slate-500">Transmis aux médecins</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Urgences (P1 &amp; P2)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{urgentCases.length}</p>
          <span className="text-[11px] text-rose-700 font-medium">Prise en charge immédiate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Alertes Cliniques</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{clinicalAlertsCount || careActs.length}</p>
          <span className="text-[11px] text-slate-500">Fièvre &gt;38.5°C / SaO2 &lt;95%</span>
        </div>
      </div>

      {/* Liste interactive avec barre de recherche & filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">
              File Active de Triage et Constantes Vitales
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredConsultations.length} dossiers
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher patient, NDM..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterMode('urgent')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'urgent' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Urgences ({urgentCases.length})
              </button>
              <button
                onClick={() => setFilterMode('pending_vitals')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'pending_vitals' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                À relever ({waitingTriage.length})
              </button>
              <button
                onClick={() => setFilterMode('vitals_done')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'vitals_done' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                Prêts ({vitalsCompletedToday.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Motif de consultation</th>
                <th className="py-2.5 px-4">Priorité Triage</th>
                <th className="py-2.5 px-4">Constantes Relevées</th>
                <th className="py-2.5 px-4 text-right">Action immédiate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun dossier correspondant aux critères de recherche
                  </td>
                </tr>
              ) : (
                filteredConsultations.slice(0, 8).map((c) => {
                  const partner = partners.find(p => p.id === c.partner_id);
                  const isFever = c.vitals?.temperature && parseFloat(String(c.vitals.temperature)) >= 38.5;
                  const isHypox = c.vitals?.oxygen_saturation && parseInt(String(c.vitals.oxygen_saturation), 10) < 95;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>{partner?.ndm || `NDM-${c.partner_id}`}</span>
                          {partner?.age && <span>• {partner.age} ans</span>}
                          {partner?.gender && <span>• ({partner.gender})</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate font-medium">
                        {c.reason || 'Consultation générale'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          c.priority === 'critique'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 ring-2 ring-rose-500/20'
                            : c.priority === 'urgent'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {c.priority || 'normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.vitals?.taken_at ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <div className="text-slate-800">
                              <span className="font-bold">{c.vitals.blood_pressure || '--'}</span> | {c.vitals.pulse ? `${c.vitals.pulse} bpm` : '--'}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={isFever ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                {c.vitals.temperature ? `${c.vitals.temperature}°C` : '--'}
                              </span>
                              {c.vitals.oxygen_saturation && (
                                <span className={isHypox ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                  SpO2: {c.vitals.oxygen_saturation}%
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            À relever
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('infirmier_vitals')}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold text-xs border border-teal-200 transition inline-flex items-center gap-1"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>{c.vitals?.taken_at ? 'Modifier Constantes' : 'Saisir Constantes'}</span>
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

// -------------------------------------------------------------
// 2. MÉDECIN GÉNÉRALISTE DASHBOARD
// -------------------------------------------------------------
export const MedecinDashboard: React.FC<ModuleDashboardProps> = ({
  consultations,
  partners,
  currentUser,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'waiting' | 'urgent' | 'completed'>('waiting');

  const isGeneralConsultation = (c: MedicalConsultation) => {
    const consultType = ((c as any).consultation_type_id || c.consultation_type || '');

    // Exclude pediatric
    const isPediatric =
      (c.patient_age !== undefined && c.patient_age !== null && c.patient_age <= 15) ||
      (c.specialty && c.specialty.toLowerCase().includes('pédiatr')) ||
      (consultType && consultType.startsWith('CS-PED')) ||
      (c.reason && (c.reason.toLowerCase().includes('pédiatr') || c.reason.toLowerCase().includes('nourrisson')));
    if (isPediatric) return false;

    // Exclude maternity
    const isMaternity =
      (c.specialty && (c.specialty.toLowerCase().includes('mater') || c.specialty.toLowerCase().includes('cpn') || c.specialty.toLowerCase().includes('gynéc') || c.specialty.toLowerCase().includes('obstét'))) ||
      (consultType && (consultType.startsWith('CS-MAT') || consultType.startsWith('CS-GYN'))) ||
      (c.reason && (c.reason.toLowerCase().includes('grossesse') || c.reason.toLowerCase().includes('cpn') || c.reason.toLowerCase().includes('accouchement')));
    if (isMaternity) return false;

    // Exclude specialist
    const isSpecialist =
      (c as any).target_level === 'specialiste' ||
      c.doctor_type === 'specialiste' ||
      (consultType && consultType.startsWith('CS-SPEC')) ||
      (c.specialty && (
        c.specialty.toLowerCase().includes('spécial') ||
        c.specialty.toLowerCase().includes('cardio') ||
        c.specialty.toLowerCase().includes('ophtalmo') ||
        c.specialty.toLowerCase().includes('dermato') ||
        c.specialty.toLowerCase().includes('chirurg') ||
        c.specialty.toLowerCase().includes('neurolog')
      ));
    if (isSpecialist) return false;

    return true;
  };

  const waitingForDoctor = consultations.filter(
    (c) =>
      c.status !== 'completed' &&
      c.status !== 'done' &&
      c.status !== 'cancelled' &&
      isGeneralConsultation(c) &&
      (c.status === 'in_consultation' || c.status === 'waiting' || c.status === 'triage' || (c.status === 'pending_payment' && Boolean(c.has_pending_balance)))
  );
  const completedToday = consultations.filter(c => (c.status === 'completed' || c.status === 'done') && isGeneralConsultation(c));
  const urgentCases = consultations.filter(c => (c.priority === 'urgent' || c.priority === 'critique') && c.status !== 'completed' && c.status !== 'done' && isGeneralConsultation(c));
  const prescriptionsIssued = consultations.filter(c => isGeneralConsultation(c) && ((c.prescriptions && c.prescriptions.length > 0) || (c.prescribed_items && c.prescribed_items.length > 0)));

  const filteredList = useMemo(() => {
    return consultations.filter(c => {
      if (!isGeneralConsultation(c)) return false;
      const p = partners.find(pt => pt.id === c.partner_id);
      const matchSearch = !searchTerm ||
        (c.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p?.ndm || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (filterMode === 'waiting') return c.status !== 'completed' && c.status !== 'done' && c.status !== 'cancelled';
      if (filterMode === 'urgent') return (c.priority === 'urgent' || c.priority === 'critique') && c.status !== 'completed';
      if (filterMode === 'completed') return c.status === 'completed' || c.status === 'done';
      return true;
    });
  }, [consultations, partners, searchTerm, filterMode]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Poste Médical • Médecine Générale
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Dr. {currentUser?.name || 'Praticien'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Salle de consultation, anamnèse, diagnostics cliniques, ordonnances électroniques et prescriptions d'examens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('medecin_queue')}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Appeler Prochain Patient</span>
          </button>
          <button
            onClick={() => onNavigateToView('medecin_prescriptions')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>Nouvelle Ordonnance</span>
          </button>
          <button
            onClick={() => onNavigateToView('medecin_consultations')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <span>Consultations</span>
          </button>
        </div>
      </div>

      {/* Subtle Directive Bar for Medical Practice Flow */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
          <div>
            <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider mr-1.5">Directive Médicale :</span>
            <span className="text-[11px] text-slate-600">
              Déroulement de la consultation : <strong>1. Vérification Constantes</strong> ➔ <strong>2. Examen Clinique & CIM-10</strong> ➔ <strong>3. Ordonnances & Choix Circuit (Interne / Externe)</strong>.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
          Workflow Déontologique
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>En attente de consultation</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{waitingForDoctor.length}</p>
          <span className="text-[11px] text-blue-700 font-medium">Constantes déjà relevées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Consultations Terminées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{completedToday.length}</p>
          <span className="text-[11px] text-slate-500">Aujourd'hui</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ordonnances Émises</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{prescriptionsIssued.length}</p>
          <span className="text-[11px] text-slate-500">Prescriptions enregistrées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cas Prioritaires / Urgents</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{urgentCases.length}</p>
          <span className="text-[11px] text-rose-700 font-medium">À recevoir sans délai</span>
        </div>
      </div>

      {/* Liste interactive des consultations */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Salle d'Attente Médicale &amp; Dossiers Actifs
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredList.length} dossiers
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher patient, NDM..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setFilterMode('waiting')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'waiting' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En Attente ({waitingForDoctor.length})
              </button>
              <button
                onClick={() => setFilterMode('urgent')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'urgent' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Urgences ({urgentCases.length})
              </button>
              <button
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Terminés ({completedToday.length})
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  filterMode === 'all' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Motif &amp; Anamnèse</th>
                <th className="py-2.5 px-4">Paramètres Vitaux</th>
                <th className="py-2.5 px-4">Priorité</th>
                <th className="py-2.5 px-4 text-right">Action Médicale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun patient dans cette sélection
                  </td>
                </tr>
              ) : (
                filteredList.slice(0, 8).map((c) => {
                  const partner = partners.find(p => p.id === c.partner_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {partner?.ndm || `NDM-${c.partner_id}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate font-medium">
                        {c.reason || 'Consultation de médecine générale'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {c.vitals?.taken_at ? (
                          <span className="text-slate-800">
                            TA: <strong className="text-slate-900">{c.vitals.blood_pressure || '--'}</strong> | FC: {c.vitals.pulse || '--'} | T°: {c.vitals.temperature || '--'}°C
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold text-[10px] px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                            Constantes en attente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          c.priority === 'critique'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 ring-2 ring-rose-500/20'
                            : c.priority === 'urgent'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {c.priority || 'normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('medecin_consultations')}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Démarrer Consultation</span>
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

// -------------------------------------------------------------
// 3. MÉDECIN SPÉCIALISTE DASHBOARD
// -------------------------------------------------------------
export const SpecialisteDashboard: React.FC<ModuleDashboardProps> = ({
  consultations,
  partners,
  currentUser,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  const referredPatients = consultations.filter(
    (c) =>
      c.orientation === 'specialiste' ||
      c.doctor_type === 'specialiste' ||
      (c as any).target_level === 'specialiste' ||
      c.doctor_name?.toLowerCase().includes('spécialiste') ||
      c.doctor_name?.toLowerCase().includes('specialiste')
  );
  const scheduledSpecial = consultations.filter(
    (c) =>
      c.status !== 'completed' &&
      c.status !== 'done' &&
      c.status !== 'cancelled' &&
      (c.doctor_type === 'specialiste' || (c as any).target_level === 'specialiste' || c.specialty?.toLowerCase().includes('spécial'))
  );
  const followupCases = consultations.filter(c => c.status === 'completed' || c.status === 'done');

  const filteredReferred = useMemo(() => {
    return referredPatients.filter(c => {
      const p = partners.find(pt => pt.id === c.partner_id);
      const matchSearch = !searchTerm ||
        (c.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p?.ndm || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (specialtyFilter !== 'all') {
        return (c.specialty || '').toLowerCase().includes(specialtyFilter.toLowerCase());
      }
      return true;
    });
  }, [referredPatients, partners, searchTerm, specialtyFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Poste Médical • Médecine Spécialisée
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                Dr. {currentUser?.name || 'Spécialiste'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultations spécialisées de 2nd recours, avis d'experts, explorations fonctionnelles et suivi longitudinal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('specialiste_referred')}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>Patients Référés ({referredPatients.length})</span>
          </button>
          <button
            onClick={() => onNavigateToView('specialiste_followup')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <Calendar className="w-4 h-4 text-slate-600" />
            <span>Suivi Chronique</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Patients Référés</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{referredPatients.length}</p>
          <span className="text-[11px] text-purple-700 font-medium">Par confrères / urgences</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Consultations Programmées</span>
            <Stethoscope className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{scheduledSpecial.length}</p>
          <span className="text-[11px] text-slate-500">Créneaux du jour</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dossiers Suivis</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{followupCases.length}</p>
          <span className="text-[11px] text-slate-500">File active chronique</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Prescriptions &amp; Protocoles</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">
            {consultations.reduce((sum, c) => sum + (c.prescriptions?.length || 0), 0)}
          </p>
          <span className="text-[11px] text-slate-500">Lignes d'ordonnances</span>
        </div>
      </div>

      {/* Table des patients orientés avec recherche et filtres de spécialité */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Patients Adressés pour Avis Spécialisé &amp; Deuxième Intention
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredReferred.length} dossiers
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher patient, NDM..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setSpecialtyFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  specialtyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setSpecialtyFilter('cardio')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  specialtyFilter === 'cardio' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                Cardio
              </button>
              <button
                onClick={() => setSpecialtyFilter('gyneco')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  specialtyFilter === 'gyneco' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                Gynéco
              </button>
              <button
                onClick={() => setSpecialtyFilter('pediat')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  specialtyFilter === 'pediat' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                Pédiatrie
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Médecin Référent</th>
                <th className="py-2.5 px-4">Motif d'Adressage</th>
                <th className="py-2.5 px-4">Date Transfert</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferred.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun patient référé correspondant aux filtres
                  </td>
                </tr>
              ) : (
                filteredReferred.slice(0, 6).map((c) => {
                  const partner = partners.find(p => p.id === c.partner_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.patient_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {partner?.ndm || `NDM-${c.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        Dr. {c.doctor_name || 'Généraliste - Service Accueil'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-medium">
                        {c.reason || 'Avis spécialisé requis pour bilan complémentaire'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('specialiste_consultations')}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Consulter</span>
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

// -------------------------------------------------------------
// 4. LABORATOIRE DASHBOARD
// -------------------------------------------------------------
export const LaboDashboard: React.FC<ModuleDashboardProps> = ({
  labOrders,
  partners,
  currentUser,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'done' | 'urgent'>('all');

  const pendingSampling = labOrders.filter(o => o.state === 'draft' || o.state === 'pending' || !o.barcode);
  const inProgress = labOrders.filter(o => o.state === 'in_progress' || (o.barcode && o.state !== 'done'));
  const completed = labOrders.filter(o => o.state === 'done');
  const urgentOrders = labOrders.filter(o => o.priority === 'urgent');

  const filteredOrders = useMemo(() => {
    return labOrders.filter(o => {
      const partner = partners.find(p => p.id === o.partner_id);
      const matchSearch = !searchTerm ||
        (o.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.exam_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'pending') return o.state === 'draft' || o.state === 'pending' || !o.barcode;
      if (statusFilter === 'in_progress') return o.state === 'in_progress' || (o.barcode && o.state !== 'done');
      if (statusFilter === 'done') return o.state === 'done';
      if (statusFilter === 'urgent') return o.priority === 'urgent';
      return true;
    });
  }, [labOrders, partners, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Laboratoire d'Analyses Médicales &amp; Biologie
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Poste Actif • {currentUser?.name || 'Biologiste'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion du flux des prélèvements, passages sur automate, saisie des résultats et validation biologiste
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('labo_sampling')}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Prélèvement</span>
          </button>
          <button
            onClick={() => onNavigateToView('labo_validation')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-300" />
            <span>Validation Biologiste</span>
          </button>
          <button
            onClick={() => onNavigateToView('labo_results')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <FlaskConical className="w-4 h-4 text-slate-600" />
            <span>Toutes les Analyses</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>À Prélever</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingSampling.length}</p>
          <span className="text-[11px] text-amber-700 font-medium">Échantillons en attente</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Analyses en Cours</span>
            <FlaskConical className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{inProgress.length}</p>
          <span className="text-[11px] text-slate-500">Automates actifs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Résultats Validés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{completed.length}</p>
          <span className="text-[11px] text-slate-500">Prêts pour délivrance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Analyses Urgentes</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{urgentOrders.length}</p>
          <span className="text-[11px] text-rose-700 font-medium">Priorité maximale</span>
        </div>
      </div>

      {/* Table de travail du laboratoire */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Paillasse &amp; Poste de Travail Biologique
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredOrders.length} dossiers
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher code barre, patient..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                À Prélever ({pendingSampling.length})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  statusFilter === 'in_progress' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                En Cours ({inProgress.length})
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  statusFilter === 'done' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Validés ({completed.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">N° Échantillon</th>
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-4">Examen Demandé</th>
                <th className="py-2.5 px-4">Statut Analyse</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucune analyse enregistrée dans cette sélection
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 8).map((order) => {
                  const partner = partners.find(p => p.id === order.partner_id);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.barcode || `LAB-${order.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.partner_name || (order as any).patient_name || partner?.name || 'Patient'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{partner?.ndm || '--'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {order.exam_name || 'Bilan biologique standard'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          order.state === 'done'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : order.state === 'in_progress'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {order.state === 'done' ? 'Validé' : order.state === 'in_progress' ? 'En cours' : 'À prélever'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('labo_results')}
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Saisir Résultats</span>
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

// -------------------------------------------------------------
// 5. IMAGERIE MÉDICALE DASHBOARD
// -------------------------------------------------------------
export const ImagerieDashboard: React.FC<ModuleDashboardProps> = ({
  consultations,
  partners,
  currentUser,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState<'all' | 'radio' | 'echo' | 'scanner'>('all');

  const imagingExams = consultations.filter(c => c.reason?.toLowerCase().includes('radio') || c.reason?.toLowerCase().includes('écho') || c.reason?.toLowerCase().includes('scanner') || c.orientation === 'imagerie');

  const demoItems = [
    { id: 1, name: 'Koffi Marie-Claire', ndm: 'NDM-0089', modalite: 'Échographie Abdomino-Pelvienne', type: 'echo', presc: 'Dr. Toure', status: 'À réaliser' },
    { id: 2, name: 'Diallo Oumar', ndm: 'NDM-0092', modalite: 'Radiographie Thoracique Face/Profil', type: 'radio', presc: 'Dr. Koné', status: 'Réalisé - En attente CR' },
    { id: 3, name: 'Bamba Awa', ndm: 'NDM-0104', modalite: 'Scanner Cérébral Sans Injection', type: 'scanner', presc: 'Dr. N\'Guessan', status: 'Validé' },
    { id: 4, name: 'Traoré Seydou', ndm: 'NDM-0112', modalite: 'Échographie Obstétricale T3', type: 'echo', presc: 'Dr. Toure', status: 'À réaliser' },
    { id: 5, name: 'Konaté Fatoumata', ndm: 'NDM-0125', modalite: 'Radiographie Rachis Lombaire', type: 'radio', presc: 'Dr. Kouassi', status: 'Validé' },
  ];

  const filteredItems = demoItems.filter(item => {
    const matchSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ndm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modalite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.presc.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (modalityFilter !== 'all' && item.type !== modalityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Imagerie Médicale, Radiologie &amp; PACS
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Poste Radiologue • {currentUser?.name || 'Radiologue'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Programmation des actes, acquisition manipulateur, rédaction de comptes-rendus et validation radiologique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('imagerie_scheduled')}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            <span>Planning des Examens</span>
          </button>
          <button
            onClick={() => onNavigateToView('imagerie_reports')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>Rédiger Compte Rendu</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Examens Programmés</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{Math.max(imagingExams.length, 5)}</p>
          <span className="text-[11px] text-slate-500">Radio, Écho, Scanner</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Examens Réalisés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">8</p>
          <span className="text-[11px] text-slate-500">Acquis au manipulateur</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>CR en Attente</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">3</p>
          <span className="text-[11px] text-amber-700 font-medium">À dicter par radiologue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Validés &amp; Diffusés</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">14</p>
          <span className="text-[11px] text-slate-500">Transmis aux prescripteurs</span>
        </div>
      </div>

      {/* Liste tabulaire : File active d'imagerie avec filtres et recherche */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">
              File Active des Actes d'Imagerie Médicale &amp; Clichés PACS
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredItems.length} actes
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher patient, NDM, examen..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setModalityFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  modalityFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setModalityFilter('radio')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  modalityFilter === 'radio' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                Radios
              </button>
              <button
                onClick={() => setModalityFilter('echo')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  modalityFilter === 'echo' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                Échographies
              </button>
              <button
                onClick={() => setModalityFilter('scanner')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  modalityFilter === 'scanner' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                Scanner
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Modalité &amp; Examen</th>
                <th className="py-2.5 px-4">Prescripteur</th>
                <th className="py-2.5 px-4">Statut d'Imagerie</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun examen d'imagerie dans cette sélection
                  </td>
                </tr>
              ) : (
                filteredItems.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.name}
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {row.modalite}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {row.presc}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        row.status.includes('Validé')
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : row.status.includes('Réalisé')
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateToView('imagerie_reports')}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Compte Rendu</span>
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
// 6. HOSPITALISATION DASHBOARD
// -------------------------------------------------------------
export const HospitDashboard: React.FC<ModuleDashboardProps> = ({
  consultations,
  partners,
  currentUser,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'medecine' | 'chirurgie' | 'cardio' | 'maternite'>('all');

  const totalBeds = 24;
  const occupiedBeds = 16;
  const freeBeds = totalBeds - occupiedBeds;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const hospitalizedPatients = [
    { id: 1, chambre: 'Ch. 102 - Lit A', patient: 'Kouassi Yao Patrick', ndm: 'NDM-0051', service: 'Médecine Interne', serviceKey: 'medecine', date: '12/09/2026', medecin: 'Dr. Toure', vitals: 'TA: 120/80 | SpO2: 98%' },
    { id: 2, chambre: 'Ch. 104 - Lit B', patient: 'Touré Fanta', ndm: 'NDM-0063', service: 'Chirurgie Générale', serviceKey: 'chirurgie', date: '14/09/2026', medecin: 'Dr. Koné', vitals: 'TA: 110/70 | T°: 37.2°C' },
    { id: 3, chambre: 'Ch. 201 - VIP', patient: 'Brou Jean-Marc', ndm: 'NDM-0078', service: 'Cardiologie', serviceKey: 'cardio', date: '15/09/2026', medecin: 'Dr. N\'Guessan', vitals: 'TA: 145/95 | FC: 88 bpm' },
    { id: 4, chambre: 'Ch. 108 - Lit A', patient: 'Coulibaly Salimata', ndm: 'NDM-0084', service: 'Maternité & Gynéco', serviceKey: 'maternite', date: '16/09/2026', medecin: 'Dr. Toure', vitals: 'TA: 115/75 | T°: 36.8°C' },
  ];

  const filteredPatients = hospitalizedPatients.filter(p => {
    const matchSearch = !searchTerm ||
      p.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ndm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.chambre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.service.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (serviceFilter !== 'all' && p.serviceKey !== serviceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Gestion des Hospitalisations &amp; Lits
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Service Hospitalier • {currentUser?.name || 'Major de Service'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Occupation des lits par unité, formalités d'admission, transferts inter-services et sorties médicales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToView('hospit_admissions')}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Admission</span>
          </button>
          <button
            onClick={() => onNavigateToView('hospit_beds')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Bed className="w-4 h-4 text-slate-300" />
            <span>Plan des Lits</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Taux d'Occupation</span>
            <Bed className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{occupancyRate}%</p>
          <span className="text-[11px] text-blue-700 font-medium">{occupiedBeds} lits occupés sur {totalBeds}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Lits Disponibles</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{freeBeds}</p>
          <span className="text-[11px] text-slate-500">Prêts pour admission</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Entrées du Jour</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">4</p>
          <span className="text-[11px] text-slate-500">Admissions enregistrées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sorties Prévues</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">3</p>
          <span className="text-[11px] text-slate-500">En cours de régularisation</span>
        </div>
      </div>

      {/* Liste des patients hospitalisés avec recherche et filtres de service */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Patients Actuellement Alités par Chambre &amp; Unité de Soins
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredPatients.length} hospitalisés
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher lit, patient, NDM..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setServiceFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  serviceFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setServiceFilter('medecine')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  serviceFilter === 'medecine' ? 'bg-blue-700 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Médecine
              </button>
              <button
                onClick={() => setServiceFilter('chirurgie')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  serviceFilter === 'chirurgie' ? 'bg-blue-700 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Chirurgie
              </button>
              <button
                onClick={() => setServiceFilter('cardio')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  serviceFilter === 'cardio' ? 'bg-blue-700 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Cardio
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Chambre / Lit</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Unité / Service</th>
                <th className="py-2.5 px-4">Date d'Admission</th>
                <th className="py-2.5 px-4">Médecin Référent</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aucun patient alité dans cette sélection
                  </td>
                </tr>
              ) : (
                filteredPatients.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {row.chambre}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.patient}
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {row.service}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {row.medecin}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateToView('hospit_monitoring')}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <Bed className="w-3.5 h-3.5" />
                        <span>Dossier de Soins</span>
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
// 7. SUPERVISEUR DASHBOARD
// -------------------------------------------------------------
export const SuperviseurDashboard: React.FC<ModuleDashboardProps> = ({
  moves,
  payments,
  tillSessions,
  onNavigateToView,
}) => {
  const activeSessions = tillSessions.filter(s => s.state === 'opened');
  const closedSessions = tillSessions.filter(s => s.state === 'closed');
  const totalEncaisseToday = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalFacture = moves.filter(m => m.move_type === 'out_invoice').reduce((sum, m) => sum + (m.amount_total || 0), 0);
  const unpaidMoves = moves.filter(m => m.move_type === 'out_invoice' && m.payment_state !== 'paid');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-slate-700" />
            Tableau de bord - Superviseur de Facturation & Caisses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervision des encaissements, contrôle des écarts de caisse, audit des sessions et validation des clôtures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('superviseur_sessions')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Contrôle Sessions ({activeSessions.length} ouvertes)</span>
          </button>
          <button
            onClick={() => onNavigateToView('superviseur_reports')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Rapports Financiers</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Encaissé</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalEncaisseToday)}</p>
          <span className="text-[11px] text-slate-500">Recettes effectives</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sessions de caisse actives</span>
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeSessions.length}</p>
          <span className="text-[11px] text-slate-500">Caissiers en poste</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sessions à valider</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{closedSessions.length}</p>
          <span className="text-[11px] text-slate-500">Clôturées à vérifier</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Factures impayées</span>
            <AlertTriangle className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{unpaidMoves.length}</p>
          <span className="text-[11px] text-slate-500">Reste à recouvrer</span>
        </div>
      </div>

      {/* Table des sessions de caisse sous supervision */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-600" />
            Sessions de caisse en cours et clôturées (Contrôle Superviseur)
          </h2>
          <button
            onClick={() => onNavigateToView('superviseur_sessions')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Toutes les sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Session N°</th>
                <th className="py-2.5 px-4">Caissier / Agent</th>
                <th className="py-2.5 px-4">Fond Initial</th>
                <th className="py-2.5 px-4">Total Encaissé</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Action Superviseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tillSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aucune session de caisse enregistrée
                  </td>
                </tr>
              ) : (
                tillSessions.slice(0, 5).map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {session.name || `SES-${session.id}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {session.user_id ? `Caissier #${session.user_id}` : 'Agent Caisse'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatFCFA(session.cashbox_start || 0)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatFCFA((session.total_payments || 0) + (session.cashbox_start || 0))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        session.state === 'opened'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : session.state === 'closed'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {session.state === 'opened' ? 'Ouverte' : session.state === 'closed' ? 'Clôturée' : session.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateToView('superviseur_sessions')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                      >
                        Contrôler écart
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
// 8. CAISSE DASHBOARD
// -------------------------------------------------------------
export const CaisseDashboard: React.FC<ModuleDashboardProps> = ({
  partners = [],
  moves = [],
  payments = [],
  tillSessions = [],
  currentUser,
  company,
  onNavigateToView,
  onNewPayment,
  onPrintReceipt,
}) => {
  // Session resolution: accurately checks both server tillSessions and local stored sessions
  const myActiveSession = useMemo(() => {
    if (!currentUser) return null;
    const currentName = (currentUser.name || '').toLowerCase().trim();
    const currentLogin = (currentUser.login || '').toLowerCase().trim();

    const serverActive = tillSessions.find((s) => {
      if (s.state !== 'in_progress' && (s.state as any) !== 'opened') return false;
      if (s.cashier_id === currentUser.id) return true;
      const sName = (s.cashier_name || '').toLowerCase().trim();
      if (sName === currentName || sName === currentLogin) return true;
      if (currentLogin === 'caissier' && (s.cashier_id === 3 || sName.includes('amadou') || sName.includes('caissier'))) return true;
      if (currentLogin === 'caisse_facture' && (s.cashier_id === 4 || sName.includes('awa') || sName.includes('facture'))) return true;
      if (isSupervisorOrAdmin(currentUser) && (s.cashier_id === currentUser.id || sName === currentName)) return true;
      return false;
    });

    if (serverActive) {
      const allLocal = loadAllSessions();
      const localState = allLocal.find((s) => s.id === serverActive.id);
      if (localState && localState.state === 'closed') {
        return null;
      }
      return serverActive;
    }

    const allLocal = loadAllSessions();
    const localActive = allLocal.find(
      (s) => (s.cashier_id === currentUser.id || (s.cashier_name || '').toLowerCase() === currentName) && s.state === 'in_progress'
    );
    return localActive || null;
  }, [tillSessions, currentUser]);

  const lastClosedSessionToday = useMemo(() => {
    const all = [...tillSessions, ...loadAllSessions()];
    return all
      .filter((s) => s.state === 'closed' && (isSupervisorOrAdmin(currentUser) || s.cashier_id === currentUser?.id || (s.cashier_name || '').toLowerCase() === (currentUser?.name || '').toLowerCase()))
      .sort((a, b) => (b.id || 0) - (a.id || 0))[0] || null;
  }, [tillSessions, currentUser]);

  const [searchPaymentTerm, setSearchPaymentTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'wave' | 'orange_money' | 'card'>('all');
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [showRequireSessionModal, setShowRequireSessionModal] = useState(false);
  const [isStatusBannerDismissed, setIsStatusBannerDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('caisse_status_banner_dismissed') === 'true' ||
        sessionStorage.getItem('caisse_status_banner_dismissed') === 'true'
      );
    }
    return false;
  });

  // Respect system alert settings from "Gestion des Alertes" (Paramètres)
  const isCaisseAlertCategoryEnabled = useMemo(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('app_alert_categories_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const found = parsed.find((c: any) => c.id === 'caisse');
          if (found && typeof found.enabled === 'boolean') {
            return found.enabled;
          }
        }
      }
    } catch (_) {}
    return true;
  }, []);

  const [tillNameInput, setTillNameInput] = useState('Guichet Caisse 1 (Hall Principal)');
  const [openingBalanceInput, setOpeningBalanceInput] = useState('50000');
  const [openSessionNotes, setOpenSessionNotes] = useState('');
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caisse_guide_banner_dismissed') !== 'true';
    }
    return true;
  });

  const isSupervisor = isSupervisorOrAdmin(currentUser);

  // Fallback patient names and prestations for demo payments to guarantee rich display
  const fallbackPatientData: Record<number, { name: string; ndm: string; service: string }> = {
    115: { name: 'Mme TRAORE Salimata', ndm: 'NDM-2026-0042', service: 'Accouchement Voie Basse + Séjour Maternité' },
    114: { name: 'M. KOUAME Eric N’Dri', ndm: 'NDM-2026-0081', service: 'Consultation Médecine Générale + Triage' },
    113: { name: 'Mme COULIBALY Mariatou', ndm: 'NDM-2026-0095', service: 'Bilan Biologique Complet (NFS + Glycémie)' },
    112: { name: 'Enfant KONE Yasmine (4 ans)', ndm: 'NDM-2026-0104', service: 'Consultation Pédiatrique & Goutte Épaisse' },
    111: { name: 'M. DIOP Mamadou', ndm: 'NDM-2026-0118', service: 'Pansement & Soins Infirmiers Urgences' },
    110: { name: 'Mme OUATTARA Fatoumata', ndm: 'NDM-2026-0129', service: 'Échographie Obstétricale T2' },
  };

  const enrichedPayments = useMemo(() => {
    const rawEnriched = payments.map((p, index) => {
      const matchedPartner = partners.find((pt) => pt.id === p.partner_id);
      const matchedMove = moves.find((m) => m.id === p.move_id);
      const fallback = fallbackPatientData[p.id] || fallbackPatientData[115 - (index % 6)];

      const patientName =
        p.partner_name ||
        matchedPartner?.name ||
        matchedMove?.patient_name ||
        fallback?.name ||
        'Patient Hospitalisé';

      const patientNdm =
        matchedPartner?.ndm ||
        matchedMove?.patient_ndm ||
        (matchedPartner?.id ? `NDM-${String(matchedPartner.id).padStart(5, '0')}` : fallback?.ndm || 'NDM-2026-0081');

      const serviceName =
        (matchedMove?.invoice_line_ids && matchedMove.invoice_line_ids[0]?.name) ||
        (matchedMove as any)?.consultation_type ||
        fallback?.service ||
        'Prestation de Soins Médicaux';

      const method = (p.payment_method_line_id || (p as any).payment_method || 'cash').toLowerCase();

      return {
        ...p,
        resolvedPatientName: patientName,
        resolvedPatientNdm: patientNdm,
        resolvedService: serviceName,
        normalizedMethod: method,
      };
    });

    if (isSupervisorOrAdmin(currentUser)) return rawEnriched;
    
    // Restriction pour les caissiers : seulement leurs propres encaissements DU JOUR
    const today = new Date().toISOString().split('T')[0];
    return rawEnriched.filter(p => {
      const isOwn = Number(p.user_id) === Number(currentUser?.id);
      const paymentDate = (p.payment_date || p.created_at || '').split(' ')[0].split('T')[0];
      return isOwn && paymentDate === today;
    });
  }, [payments, partners, moves, currentUser]);

  const filteredPayments = useMemo(() => {
    return enrichedPayments.filter((p) => {
      if (methodFilter !== 'all') {
        if (methodFilter === 'cash' && !p.normalizedMethod.includes('cash') && !p.normalizedMethod.includes('espece')) return false;
        if (methodFilter === 'wave' && !p.normalizedMethod.includes('wave')) return false;
        if (methodFilter === 'orange_money' && !p.normalizedMethod.includes('orange')) return false;
        if (methodFilter === 'card' && !p.normalizedMethod.includes('card') && !p.normalizedMethod.includes('carte') && !p.normalizedMethod.includes('tpe')) return false;
      }
      if (!searchPaymentTerm.trim()) return true;
      const q = searchPaymentTerm.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.resolvedPatientName || '').toLowerCase().includes(q) ||
        (p.resolvedPatientNdm || '').toLowerCase().includes(q) ||
        (p.resolvedService || '').toLowerCase().includes(q)
      );
    });
  }, [enrichedPayments, searchPaymentTerm, methodFilter]);

  const myPaymentsToday = enrichedPayments;
  const totalEncaisse = myPaymentsToday.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalEspeces = myPaymentsToday.filter(p => p.normalizedMethod.includes('cash') || p.normalizedMethod.includes('espece')).reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalMobileAndCard = totalEncaisse - totalEspeces;
  const fondInitial = myActiveSession?.opening_balance || myActiveSession?.cashbox_start || 0;
  const especesEnTiroir = fondInitial + totalEspeces;

  const handleOpenSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpeningSession(true);
    try {
      openNewCashierSession({
        userId: currentUser?.id || 1,
        userName: currentUser?.name || 'Caissier Principal',
        tillName: tillNameInput,
        openingBalance: Number(openingBalanceInput) || 0,
        notes: openSessionNotes,
      });
      try {
        localStorage.removeItem('caisse_status_banner_dismissed');
        sessionStorage.removeItem('caisse_status_banner_dismissed');
      } catch (_) {}

      const res = await fetch('/api/till-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: currentUser?.id || 1,
          cashier_name: currentUser?.name || 'Caissier Principal',
          till_name: tillNameInput,
          opening_balance: Number(openingBalanceInput) || 0,
          notes: openSessionNotes,
        }),
      });
      if (res.ok) {
        setShowOpenSessionModal(false);
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        setShowOpenSessionModal(false);
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (_) {
      setShowOpenSessionModal(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      setIsOpeningSession(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pedagogical Guidance Banner */}
      {showGuideBanner && (
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                  🎯 Guide Pratique • Guichet Caisse
                </span>
                <span className="text-xs text-slate-500">Guide de caisse</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Gestion des Encaissements Directs, Fonds de Roulement et Quittances Patients
              </h2>
              <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
                Cette interface permet au caissier d'enregistrer les règlements de soins (tickets modérateurs, consultations, actes de laboratoire, imagerie, hospitalisation), d'éditer instantanément les quittances / reçus officiels avec N° NDM, et de gérer le cycle journalier de sa caisse (ouverture le matin, suivi du tiroir-caisse et billetage de clôture transmis au superviseur).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">1. Ouverture</span>
                  <span className="text-slate-600">Déclarer le fond de caisse initial (ex: 50 000 FCFA) remis par le Superviseur.</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-start gap-2">
                  <span className="font-bold text-sky-700">2. Encaissement</span>
                  <span className="text-slate-600">Rechercher le patient (Nom/NDM) ou la facture et percevoir les espèces/Wave/OM.</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-start gap-2">
                  <span className="font-bold text-amber-700">3. Clôture</span>
                  <span className="text-slate-600">Réaliser le billetage physique le soir et valider l'arrêté avec le Superviseur.</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowGuideBanner(false);
                try {
                  localStorage.setItem('caisse_guide_banner_dismissed', 'true');
                } catch (_) {}
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              title="Masquer le guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-700" />
            Tableau de bord - Guichet Caisse
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Opérations d'encaissement direct, identification des patients et arrêté journalier
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!myActiveSession ? (
            <button
              onClick={() => setShowOpenSessionModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ouvrir une Session de Caisse</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateToView('caisse_cloture')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
              <span>Clôturer ma Caisse</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!myActiveSession) {
                setShowRequireSessionModal(true);
                return;
              }
              if (onNewPayment) onNewPayment();
              else onNavigateToView('caisse_new_payment');
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Encaissement</span>
          </button>
        </div>
      </div>

      {/* Active Session Status Banner / Repos Guichet */}
      {myActiveSession ? (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                <span>SESSION DE CAISSE ACTIVE : {myActiveSession.session_code || myActiveSession.name || `SES-${myActiveSession.id}`}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-200/80 text-emerald-800 font-black uppercase">
                  {myActiveSession.till_name || 'Guichet Principal'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Opérateur : <strong className="text-emerald-950">{currentUser?.name || myActiveSession.cashier_name || 'Caissier'}</strong> • Fond de roulement initial : <strong className="font-mono">{formatFCFA(fondInitial)}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToView('caisse_cloture')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Arrêté & Billetage
            </button>
          </div>
        </div>
      ) : (!isStatusBannerDismissed && isCaisseAlertCategoryEnabled) ? (
        lastClosedSessionToday ? (
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Poste au Repos • Arrêté de Caisse Effectué</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {lastClosedSessionToday.session_code || `SES-${lastClosedSessionToday.id}`} Clôturée
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  La vacation a été clôturée et les fonds sont consignés. Pour enregistrer de nouveaux encaissements, ouvrez une nouvelle session.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOpenSessionModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Ouvrir une Session
              </button>
              <button
                onClick={() => {
                  setIsStatusBannerDismissed(true);
                  try {
                    localStorage.setItem('caisse_status_banner_dismissed', 'true');
                    sessionStorage.setItem('caisse_status_banner_dismissed', 'true');
                  } catch (_) {}
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Masquer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <CreditCard className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Guichet Caisse • En attente d'ouverture
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Le guichet est actuellement au repos. L'ouverture d'une session est requise uniquement lors de l'enregistrement d'un encaissement.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOpenSessionModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Ouvrir ma Session
              </button>
              <button
                onClick={() => {
                  setIsStatusBannerDismissed(true);
                  try {
                    localStorage.setItem('caisse_status_banner_dismissed', 'true');
                    sessionStorage.setItem('caisse_status_banner_dismissed', 'true');
                  } catch (_) {}
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                title="Masquer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Statut de ma caisse</span>
            <CreditCard className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {myActiveSession ? 'Ouverte' : lastClosedSessionToday ? 'Clôturée' : 'Au repos'}
          </p>
          <span className="text-[11px] text-slate-500">
            {myActiveSession ? `Fond: ${formatFCFA(fondInitial)}` : lastClosedSessionToday ? 'Arrêté journalier validé' : 'En attente d\'ouverture'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Encaissé Aujourd'hui</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalEncaisse)}</p>
          <span className="text-[11px] text-slate-500">{myPaymentsToday.length} reçus enregistrés</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Espèces en tiroir</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 mt-2">
            {formatFCFA(especesEnTiroir)}
          </p>
          <span className="text-[11px] text-slate-500">Inclus fond initial ({formatFCFA(fondInitial)})</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Mobile Money & Carte</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-indigo-700 mt-2">
            {formatFCFA(totalMobileAndCard)}
          </p>
          <span className="text-[11px] text-slate-500">Wave, Orange Money, TPE</span>
        </div>
      </div>

      {/* Table des encaissements de la journée avec PATIENTS & MOTIFS (Résolution Img 1) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              Journal des encaissements du guichet • Identification Patients & Actes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique complet des quittances et reçus délivrés avec NDM et détail de la prestation
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchPaymentTerm}
                onChange={(e) => setSearchPaymentTerm(e.target.value)}
                placeholder="Rechercher patient, NDM, reçu..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden w-56 font-medium"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Tous les règlements</option>
              <option value="cash">Espèces (Cash)</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="card">Carte / TPE</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">N° Reçu</th>
                <th className="py-2.5 px-4">Patient & NDM</th>
                <th className="py-2.5 px-4">Prestation / Motif de Soins</th>
                <th className="py-2.5 px-4">Date & Heure</th>
                <th className="py-2.5 px-4">Mode de règlement</th>
                <th className="py-2.5 px-4 text-right">Montant versé</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FileText className="w-6 h-6 text-slate-300" />
                      <span className="font-semibold">Aucun encaissement trouvé</span>
                      <span className="text-[11px] text-slate-400">Effectuez un nouvel encaissement pour délivrer une quittance</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.slice(0, 10).map((payment) => {
                  const isCash = payment.normalizedMethod.includes('cash') || payment.normalizedMethod.includes('espece');
                  const isWave = payment.normalizedMethod.includes('wave');
                  const isOM = payment.normalizedMethod.includes('orange');
                  const isCard = payment.normalizedMethod.includes('card') || payment.normalizedMethod.includes('carte');

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {payment.name || `PAY-${payment.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{payment.resolvedPatientName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-indigo-700 font-semibold mt-0.5">
                          {payment.resolvedPatientNdm}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">
                        {payment.resolvedService}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {payment.date ? new Date(payment.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Aujourd\'hui'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isCash
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isWave
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : isOM
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {isCash && '💵 Espèces'}
                          {isWave && '📱 Wave'}
                          {isOM && '🟠 Orange Money'}
                          {isCard && '💳 Carte / TPE'}
                          {!isCash && !isWave && !isOM && !isCard && (payment.payment_method_line_id || 'Règlement')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                        {formatFCFA(payment.amount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onPrintReceipt) {
                              onPrintReceipt(payment);
                            } else {
                              onNavigateToView('caisse_payments');
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3 h-3 text-slate-600" />
                          <span>Reçu NDM</span>
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

      {/* Modal: Ouverture de session de caisse */}
      {showOpenSessionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ouverture de Session de Caisse</h3>
                  <p className="text-xs text-slate-500">Déclaration du fond de caisse initial et prise de poste</p>
                </div>
              </div>
              <button
                onClick={() => setShowOpenSessionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenSessionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Poste / Emplacement de Caisse</label>
                <input
                  type="text"
                  value={tillNameInput}
                  onChange={(e) => setTillNameInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Caissier / Opérateur Assigné</label>
                <input
                  type="text"
                  value={currentUser?.name || 'Mohamed Mandé (Caissier)'}
                  disabled
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Fond de Caisse Initial (Espèces reçues en FCFA)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={openingBalanceInput}
                    onChange={(e) => setOpeningBalanceInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 text-sm focus:border-slate-900 focus:outline-hidden"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">FCFA</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Montants rapides :</span>
                  {[0, 25000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setOpeningBalanceInput(String(amount))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold font-mono transition"
                    >
                      {formatFCFA(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Observations / Quart de travail</label>
                <input
                  type="text"
                  value={openSessionNotes}
                  onChange={(e) => setOpenSessionNotes(e.target.value)}
                  placeholder="Ex: Quart du matin (07h30 - 15h30), tiroir vérifié"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpenSessionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isOpeningSession}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isOpeningSession ? 'Ouverture...' : 'Valider & Démarrer la Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Alerte Activation Requise pour Encaissement */}
      {showRequireSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Guichet Caisse à l'Arrêt
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le guichet est actuellement désactivé (aucune session de caisse en cours). Conformément aux règles d'audit financier hospitalier, vous devez obligatoirement ouvrir une session et déclarer votre fond de caisse pour enregistrer un encaissement.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRequireSessionModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Rester en consultation
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRequireSessionModal(false);
                  setShowOpenSessionModal(true);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Ouvrir ma Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 9. FACTURATION FACTURES DASHBOARD
// -------------------------------------------------------------
export const FacturesDashboard: React.FC<ModuleDashboardProps> = ({
  moves,
  partners,
  currentUser,
  onNavigateToView,
  onNewInvoice,
}) => {
  const myInvoices = useMemo(() => {
    if (isSupervisorOrAdmin(currentUser)) return moves;

    // Restriction pour les facturiers : seulement leurs propres factures DU JOUR
    const today = new Date().toISOString().split('T')[0];
    return moves.filter(m => {
      const isOwn = Number(m.invoice_user_id) === Number(currentUser?.id);
      const invoiceDate = (m.invoice_date || m.create_date || '').split(' ')[0].split('T')[0];
      return isOwn && invoiceDate === today;
    });
  }, [moves, currentUser]);

  const customerInvoices = myInvoices.filter(m => m.move_type === 'out_invoice');
  const draftInvoices = customerInvoices.filter(m => m.state === 'draft');
  const paidInvoices = customerInvoices.filter(m => m.payment_state === 'paid');
  const unpaidInvoices = customerInvoices.filter(m => m.payment_state !== 'paid' && m.state !== 'cancel');
  const totalFacture = customerInvoices.reduce((sum, m) => sum + (m.amount_total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Guidance Banner */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-900 border border-sky-200">
              🎯 Guide • Gestion des Factures
            </span>
            <span className="text-xs text-slate-500">Facturation hospitalière</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Facturation des Prestations Médicales, Conventions Assurances &amp; Recouvrement
          </h2>
          <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
            Cette interface centralise l'émission des factures d'honoraires, consultations, examens et séjours, l'application automatique des taux de prise en charge conventionnés (entreprises et mutuelles) et le suivi des factures impayées à recouvrer.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            Tableau de bord - Gestion des Factures
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Émission, validation, suivi des prises en charge assurances et recouvrement des créances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onNewInvoice) onNewInvoice();
              else onNavigateToView('factures_new_invoice');
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Facture</span>
          </button>
          <button
            onClick={() => onNavigateToView('factures_unpaid')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <AlertTriangle className="w-4 h-4 text-slate-600" />
            <span>Factures Impayées</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Montant Total Émis</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalFacture)}</p>
          <span className="text-[11px] text-slate-500">{customerInvoices.length} factures générées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>En attente de validation</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{draftInvoices.length}</p>
          <span className="text-[11px] text-slate-500">Statut Brouillon</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Factures Soldées</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{paidInvoices.length}</p>
          <span className="text-[11px] text-slate-500">100% réglées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Impayées / Assurances</span>
            <AlertTriangle className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{unpaidInvoices.length}</p>
          <span className="text-[11px] text-slate-500">À recouvrer</span>
        </div>
      </div>

      {/* Liste des factures récentes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Registre des factures (Liste tabulaire)
          </h2>
          <button
            onClick={() => onNavigateToView('factures_all')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir toutes les factures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">N° Facture</th>
                <th className="py-2.5 px-4">Patient / Débiteur</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Montant Total</th>
                <th className="py-2.5 px-4">État de paiement</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aucune facture enregistrée
                  </td>
                </tr>
              ) : (
                customerInvoices.slice(0, 6).map((move) => {
                  const partner = partners.find(p => p.id === move.partner_id);
                  return (
                    <tr key={move.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {move.name || `FAC-${move.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{partner?.name || move.patient_name || 'Client comptoir'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{partner?.ndm || move.patient_ndm || '--'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {move.invoice_date || move.date || 'Aujourd\'hui'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatFCFA(move.amount_total || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          move.payment_state === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : move.payment_state === 'not_paid'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {move.payment_state === 'paid' ? 'Payée' : move.payment_state === 'not_paid' ? 'Impayée' : 'Partiel'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('factures_all')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                        >
                          Détails
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

// -------------------------------------------------------------
// 10. CAISSE & FACTURE DASHBOARD (POLYVALENT)
// -------------------------------------------------------------
export const CaisseFactureDashboard: React.FC<ModuleDashboardProps> = (props) => {
  const { currentUser, moves, payments } = props;
  
  const myInvoices = useMemo(() => {
    if (isSupervisorOrAdmin(currentUser)) return moves;

    const today = new Date().toISOString().split('T')[0];
    return moves.filter(m => {
      const isOwn = Number(m.invoice_user_id) === Number(currentUser?.id);
      const invoiceDate = (m.invoice_date || m.create_date || '').split(' ')[0].split('T')[0];
      return isOwn && invoiceDate === today;
    });
  }, [moves, currentUser]);

  const myPayments = useMemo(() => {
    if (isSupervisorOrAdmin(currentUser)) return payments;

    const today = new Date().toISOString().split('T')[0];
    return payments.filter(p => {
      const isOwn = Number(p.user_id) === Number(currentUser?.id);
      const paymentDate = (p.payment_date || p.created_at || '').split(' ')[0].split('T')[0];
      return isOwn && paymentDate === today;
    });
  }, [payments, currentUser]);

  const customerInvoices = myInvoices.filter(m => m.move_type === 'out_invoice');

  return (
    <div className="space-y-6">
      {/* Guidance Banner */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-900 border border-indigo-200">
              🎯 Guide • Profil Polyvalent Caisse &amp; Facture
            </span>
            <span className="text-xs text-slate-500">Guichet unique</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Guichet Unique : Saisie Immédiate de Facture et Encaissement Direct
          </h2>
          <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
            Ce profil permet à un agent polyvalent de réaliser en une seule étape la facturation des actes médicaux et la perception du ticket modérateur ou du montant total, sans obliger le patient à faire la navette entre plusieurs guichets.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-700" />
            Tableau de bord - Caisse &amp; Facture Polyvalent
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion combinée de la facturation des actes médicaux et encaissement direct au guichet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => props.onNavigateToView('caisse_facture_new_invoice')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Facture</span>
          </button>
          <button
            onClick={() => props.onNavigateToView('caisse_facture_new_payment')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span>Encaissement</span>
          </button>
          <button
            onClick={() => props.onNavigateToView('caisse_facture_cloture')}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Arrêté de Caisse</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-semibold">Total Facturé</div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {formatFCFA(customerInvoices.reduce((sum, m) => sum + (m.amount_total || 0), 0))}
          </p>
          <span className="text-[11px] text-slate-500">{customerInvoices.length} factures</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-semibold">Total Encaissé</div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {formatFCFA(myPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
          </p>
          <span className="text-[11px] text-slate-500">{myPayments.length} reçus</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-semibold">Factures En Attente</div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {customerInvoices.filter(m => m.state === 'draft').length}
          </p>
          <span className="text-[11px] text-slate-500">À valider</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-semibold">Sessions de Caisse</div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {props.tillSessions.filter(s => s.state === 'opened' || (s.state as any) === 'in_progress').length}
          </p>
          <span className="text-[11px] text-slate-500">Active</span>
        </div>
      </div>

      {/* Raccourcis de flux direct */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Workflow Caisse &amp; Facture rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => props.onNavigateToView('caisse_facture_new_invoice')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">1. Saisir Facture Patient</span>
            <span className="text-[11px] text-slate-500">Ajout des actes médicaux et part assurance</span>
          </button>
          <button
            onClick={() => props.onNavigateToView('caisse_facture_new_payment')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">2. Encaisser Ticket / Part Patient</span>
            <span className="text-[11px] text-slate-500">Paiement espèces, Wave ou Orange Money</span>
          </button>
          <button
            onClick={() => props.onNavigateToView('caisse_facture_cloture')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">3. Clôturer la Session</span>
            <span className="text-[11px] text-slate-500">Billetage et transmission au superviseur</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 11. ADMINISTRATION DASHBOARD
// -------------------------------------------------------------
export const AdminDashboard: React.FC<ModuleDashboardProps> = ({
  company,
  partners,
  moves,
  payments,
  currentUser,
  onNavigateToView,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Tableau de bord - Administration & Gouvernance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pilotage institutionnel, gestion des comptes, paramètres de l'établissement et journal de sécurité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('admin_users')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Gestion Utilisateurs</span>
          </button>
          <button
            onClick={() => onNavigateToView('admin_audit')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <Shield className="w-4 h-4 text-slate-600" />
            <span>Journal d'Audit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Structure</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-2 truncate">{company?.name || 'Polyclinique'}</p>
          <span className="text-[11px] text-slate-500">Agrément: {company?.health_accreditation_number || 'MS-2026'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dossiers Patients</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{partners.length}</p>
          <span className="text-[11px] text-slate-500">Base active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Activité Globale</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{moves.length}</p>
          <span className="text-[11px] text-slate-500">Écritures facturation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sécurité & Rôles</span>
            <Shield className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">11</p>
          <span className="text-[11px] text-slate-500">Profils métiers cloisonnés</span>
        </div>
      </div>

      {/* Modules et paramètres du système */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Raccourcis de configuration administrative</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateToView('admin_users')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">Comptes Utilisateurs</span>
            <span className="text-[11px] text-slate-500">Créer et révoquer des accès soignants</span>
          </button>
          <button
            onClick={() => onNavigateToView('admin_company')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">Coordonnées Établissement</span>
            <span className="text-[11px] text-slate-500">RCCM, Compte contribuable, Logo & entête</span>
          </button>
          <button
            onClick={() => onNavigateToView('admin_pricing')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">Nomenclature & Tarifs</span>
            <span className="text-[11px] text-slate-500">Catalogue des actes, analyses et consultations</span>
          </button>
          <button
            onClick={() => onNavigateToView('admin_audit')}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition"
          >
            <span className="text-xs font-bold text-slate-900 block">Journal & Traçabilité</span>
            <span className="text-[11px] text-slate-500">Audit exhaustif des accès et transactions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
