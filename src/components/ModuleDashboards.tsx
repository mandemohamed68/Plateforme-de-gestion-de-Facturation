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
import { isSupervisorOrAdmin } from '../utils/caisseSessionService';

interface ModuleDashboardProps {
  currentView: AppView;
  consultations: MedicalConsultation[];
  partners: ResPartner[];
  moves: AccountMove[];
  payments: AccountPayment[];
  tillSessions: TillSession[];
  labOrders: LabExamOrder[];
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
  onNavigateToView,
}) => {
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

  return (
    <div className="space-y-6">
      {/* Header épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-700" />
            Tableau de bord - Poste Infirmier & Triage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervision de la file de triage, constante vitales et administration des soins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('infirmier_vitals')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Prendre Constantes</span>
          </button>
          <button
            onClick={() => onNavigateToView('infirmier_triage')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <span>Évaluer Triage</span>
          </button>
        </div>
      </div>

      {/* Métriques clés en liste de cartes sobres */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>En attente de triage</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{waitingTriage.length}</p>
          <span className="text-[11px] text-slate-500">Patients à évaluer</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Constantes relevées</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{vitalsCompletedToday.length}</p>
          <span className="text-[11px] text-slate-500">Aujourd'hui</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cas urgents / critiques</span>
            <AlertTriangle className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{urgentCases.length}</p>
          <span className="text-[11px] text-slate-500">Priorité 1 & 2</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Soins & Injections</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{careActs.length}</p>
          <span className="text-[11px] text-slate-500">Protocoles actifs</span>
        </div>
      </div>

      {/* Liste tabulaire : File active de triage */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            File active de triage et constantes (Liste temps réel)
          </h2>
          <button
            onClick={() => onNavigateToView('infirmier_queue')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir toute la file</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / Dossier</th>
                <th className="py-2.5 px-4">Motif de consultation</th>
                <th className="py-2.5 px-4">Priorité</th>
                <th className="py-2.5 px-4">Statut constantes</th>
                <th className="py-2.5 px-4 text-right">Action immédiate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingTriage.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun patient en file d'attente de triage
                  </td>
                </tr>
              ) : (
                waitingTriage.slice(0, 6).map((c) => {
                  const partner = partners.find(p => p.id === c.partner_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {partner?.ndm || `NDM-${c.partner_id}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {c.reason || 'Consultation générale'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          c.priority === 'critique'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : c.priority === 'urgent'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {c.priority || 'normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.vitals?.taken_at ? (
                          <div className="text-slate-700">
                            <span className="font-bold">{c.vitals.blood_pressure || '--'}</span> | {c.vitals.pulse ? `${c.vitals.pulse} bpm` : '--'} | {c.vitals.temperature ? `${c.vitals.temperature}°C` : '--'}
                          </div>
                        ) : (
                          <span className="text-amber-800 font-semibold text-[11px]">À prélever</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('infirmier_vitals')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                        >
                          Saisir constantes
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
  onNavigateToView,
}) => {
  const waitingForDoctor = consultations.filter(
    (c) =>
      c.status !== 'completed' &&
      c.status !== 'done' &&
      c.status !== 'cancelled' &&
      c.doctor_type !== 'specialiste' &&
      (c.status === 'in_consultation' || c.status === 'waiting' || c.status === 'triage' || (c.status === 'pending_payment' && Boolean(c.has_pending_balance)))
  );
  const completedToday = consultations.filter(c => c.status === 'completed' || c.status === 'done');
  const urgentCases = consultations.filter(c => (c.priority === 'urgent' || c.priority === 'critique') && c.status !== 'completed' && c.status !== 'done');
  const prescriptionsIssued = consultations.filter(c => (c.prescriptions && c.prescriptions.length > 0) || (c.prescribed_items && c.prescribed_items.length > 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-slate-700" />
            Tableau de bord - Médecin Généraliste
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            File d'attente médicale, examens cliniques, prescriptions et suivi des dossiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('medecin_queue')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Appeler Prochain Patient</span>
          </button>
          <button
            onClick={() => onNavigateToView('medecin_prescriptions')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Nouvelle Ordonnance</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>En attente de consultation</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{waitingForDoctor.length}</p>
          <span className="text-[11px] text-slate-500">Constantes prêtes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Consultations terminées</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{completedToday.length}</p>
          <span className="text-[11px] text-slate-500">Aujourd'hui</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ordonnances émises</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{prescriptionsIssued.length}</p>
          <span className="text-[11px] text-slate-500">Médicaments prescrits</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cas prioritaires</span>
            <AlertTriangle className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{urgentCases.length}</p>
          <span className="text-[11px] text-slate-500">À voir en priorité</span>
        </div>
      </div>

      {/* Liste tabulaire : Salle d'attente médicale */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            Salle d'attente médicale (Constantes vérifiées)
          </h2>
          <button
            onClick={() => onNavigateToView('medecin_queue')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir toute la file</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Motif & Anamnèse</th>
                <th className="py-2.5 px-4">Paramètres vitaux</th>
                <th className="py-2.5 px-4">Priorité</th>
                <th className="py-2.5 px-4 text-right">Action médicale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingForDoctor.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun patient en attente de consultation
                  </td>
                </tr>
              ) : (
                waitingForDoctor.slice(0, 6).map((c) => {
                  const partner = partners.find(p => p.id === c.partner_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {partner?.ndm || `NDM-${c.partner_id}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {c.reason || 'Consultation de médecine générale'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {c.vitals?.taken_at ? (
                          <span>TA: {c.vitals.blood_pressure || '--'} | FC: {c.vitals.pulse || '--'} | T°: {c.vitals.temperature || '--'}°C</span>
                        ) : (
                          <span className="text-slate-400 italic">Constantes non saisies</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          c.priority === 'critique'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
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
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                        >
                          Démarrer Examen
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
  onNavigateToView,
}) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-slate-700" />
            Tableau de bord - Médecin Spécialiste
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consultations spécialisées, patients référés par des confrères et suivi longitudinal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('specialiste_referred')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Patients Référés ({referredPatients.length})</span>
          </button>
          <button
            onClick={() => onNavigateToView('specialiste_followup')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <Calendar className="w-4 h-4 text-slate-600" />
            <span>Suivi Chronique</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Patients référés reçus</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{referredPatients.length}</p>
          <span className="text-[11px] text-slate-500">Par confrères</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Consultations de spécialité</span>
            <Stethoscope className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{scheduledSpecial.length}</p>
          <span className="text-[11px] text-slate-500">Programmées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Patients suivis</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{followupCases.length}</p>
          <span className="text-[11px] text-slate-500">Dossiers actifs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Prescriptions spécialisées</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {consultations.reduce((sum, c) => sum + (c.prescriptions?.length || 0), 0)}
          </p>
          <span className="text-[11px] text-slate-500">Actes & protocoles</span>
        </div>
      </div>

      {/* Table des patients orientés */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            Liste des patients référés pour avis spécialisé
          </h2>
          <button
            onClick={() => onNavigateToView('specialiste_referred')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Médecin référent</th>
                <th className="py-2.5 px-4">Motif d'adressage</th>
                <th className="py-2.5 px-4">Date transfert</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun patient référé en attente
                  </td>
                </tr>
              ) : (
                referredPatients.slice(0, 5).map((c) => {
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
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {c.reason || 'Avis spécialisé requis pour bilan complémentaire'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('specialiste_consultations')}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                        >
                          Consulter
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
  onNavigateToView,
}) => {
  const pendingSampling = labOrders.filter(o => o.state === 'draft' || o.state === 'pending' || !o.barcode);
  const inProgress = labOrders.filter(o => o.state === 'in_progress' || (o.barcode && o.state !== 'done'));
  const completed = labOrders.filter(o => o.state === 'done');
  const urgentOrders = labOrders.filter(o => o.priority === 'urgent');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-slate-700" />
            Tableau de bord - Laboratoire d'Analyses Médicales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion du flux des prélèvements, passages sur automate, saisie des résultats et validation biologiste
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('labo_sampling')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Prélèvement</span>
          </button>
          <button
            onClick={() => onNavigateToView('labo_validation')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
            <span>Validation Biologiste</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>À prélever</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingSampling.length}</p>
          <span className="text-[11px] text-slate-500">Échantillons en attente</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Analyses en cours</span>
            <FlaskConical className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{inProgress.length}</p>
          <span className="text-[11px] text-slate-500">Automates actifs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Résultats validés</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{completed.length}</p>
          <span className="text-[11px] text-slate-500">Prêts pour impression</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Analyses urgentes</span>
            <AlertTriangle className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{urgentOrders.length}</p>
          <span className="text-[11px] text-slate-500">Priorité maximale</span>
        </div>
      </div>

      {/* Table de travail du laboratoire */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-slate-600" />
            Poste de travail du jour (Échantillons et Analyses)
          </h2>
          <button
            onClick={() => onNavigateToView('labo_results')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir toutes les analyses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">N° Échantillon</th>
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-4">Examen demandé</th>
                <th className="py-2.5 px-4">Statut analyse</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucune analyse enregistrée dans le poste de laboratoire
                  </td>
                </tr>
              ) : (
                labOrders.slice(0, 6).map((order) => {
                  const partner = partners.find(p => p.id === order.partner_id);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.barcode || `LAB-${order.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.patient_name || partner?.name || 'Patient'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{partner?.ndm || '--'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {order.exam_name || 'Bilan biologique standard'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          order.state === 'done'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : order.state === 'in_progress'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {order.state === 'done' ? 'Validé' : order.state === 'in_progress' ? 'En cours' : 'À prélever'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToView('labo_results')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                        >
                          Saisir résultat
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
  onNavigateToView,
}) => {
  const imagingExams = consultations.filter(c => c.reason?.toLowerCase().includes('radio') || c.reason?.toLowerCase().includes('écho') || c.reason?.toLowerCase().includes('scanner') || c.orientation === 'imagerie');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Microscope className="w-5 h-5 text-slate-700" />
            Tableau de bord - Imagerie Médicale & PACS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Programmation des actes, acquisition manipulateur, rédaction de comptes-rendus et validation radiologique
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('imagerie_scheduled')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Planning des Examens</span>
          </button>
          <button
            onClick={() => onNavigateToView('imagerie_reports')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Rédiger Compte Rendu</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Examens programmés</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{Math.max(imagingExams.length, 3)}</p>
          <span className="text-[11px] text-slate-500">Radio, Écho, Scanner</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Examens réalisés</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">5</p>
          <span className="text-[11px] text-slate-500">Acquis au manipulateur</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Comptes-rendus en attente</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">2</p>
          <span className="text-[11px] text-slate-500">À dicter par radiologue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Validés & Diffusés</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">12</p>
          <span className="text-[11px] text-slate-500">Transmis aux prescripteurs</span>
        </div>
      </div>

      {/* Liste tabulaire : File active d'imagerie */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Microscope className="w-4 h-4 text-slate-600" />
            File active des actes d'imagerie médicale
          </h2>
          <button
            onClick={() => onNavigateToView('imagerie_queue')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir toute la file</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Modalité & Examen</th>
                <th className="py-2.5 px-4">Prescripteur</th>
                <th className="py-2.5 px-4">Statut d'imagerie</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: 1, name: 'Koffi Marie-Claire', ndm: 'NDM-0089', modalite: 'Échographie Abdomino-Pelvienne', presc: 'Dr. Toure', status: 'À réaliser' },
                { id: 2, name: 'Diallo Oumar', ndm: 'NDM-0092', modalite: 'Radiographie Thoracique Face/Profil', presc: 'Dr. Koné', status: 'Réalisé - En attente CR' },
                { id: 3, name: 'Bamba Awa', ndm: 'NDM-0104', modalite: 'Scanner Cérébral Sans Injection', presc: 'Dr. N\'Guessan', status: 'Validé' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.name}
                    <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {row.modalite}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {row.presc}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      row.status.includes('Validé')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : row.status.includes('Réalisé')
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('imagerie_reports')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                    >
                      Consulter / CR
                    </button>
                  </td>
                </tr>
              ))}
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
  onNavigateToView,
}) => {
  const totalBeds = 24;
  const occupiedBeds = 16;
  const freeBeds = totalBeds - occupiedBeds;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-700" />
            Tableau de bord - Gestion des Hospitalisations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Occupation des lits par unité, formalités d'admission, transferts inter-services et sorties médicales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('hospit_admissions')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Admission</span>
          </button>
          <button
            onClick={() => onNavigateToView('hospit_beds')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <Bed className="w-4 h-4 text-slate-600" />
            <span>Plan des Lits</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Taux d'occupation</span>
            <Bed className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{occupancyRate}%</p>
          <span className="text-[11px] text-slate-500">{occupiedBeds} lits occupés sur {totalBeds}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Lits disponibles</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{freeBeds}</p>
          <span className="text-[11px] text-slate-500">Prêts pour admission</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Entrées du jour</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">4</p>
          <span className="text-[11px] text-slate-500">Admissions enregistrées</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sorties prévues</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">3</p>
          <span className="text-[11px] text-slate-500">En cours de régularisation</span>
        </div>
      </div>

      {/* Liste des patients hospitalisés */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bed className="w-4 h-4 text-slate-600" />
            Patients actuellement alités par chambre et unité
          </h2>
          <button
            onClick={() => onNavigateToView('hospit_patients')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Voir tous les hospitalisés</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Chambre / Lit</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Unité / Service</th>
                <th className="py-2.5 px-4">Date admission</th>
                <th className="py-2.5 px-4">Médecin référent</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { chambre: 'Ch. 102 - Lit A', patient: 'Kouassi Yao Patrick', ndm: 'NDM-0051', service: 'Médecine Interne', date: '12/09/2026', medecin: 'Dr. Toure' },
                { chambre: 'Ch. 104 - Lit B', patient: 'Touré Fanta', ndm: 'NDM-0063', service: 'Chirurgie Générale', date: '14/09/2026', medecin: 'Dr. Koné' },
                { chambre: 'Ch. 201 - VIP', patient: 'Brou Jean-Marc', ndm: 'NDM-0078', service: 'Cardiologie', date: '15/09/2026', medecin: 'Dr. N\'Guessan' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
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
                  <td className="py-3 px-4 text-slate-700">
                    {row.medecin}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('hospit_monitoring')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                    >
                      Dossier de Soins
                    </button>
                  </td>
                </tr>
              ))}
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
  // Session resolution: checks both 'opened' and 'in_progress'
  const myActiveSession = tillSessions.find(
    (s) => (s.state === 'opened' || (s.state as any) === 'in_progress') &&
    (!currentUser || s.cashier_id === currentUser.id || s.cashier_name === currentUser.name || currentUser.login === 'admin' || currentUser.login === 'super_admin' || currentUser.login === 'caisse' || currentUser.login === 'caisse_facture')
  ) || tillSessions.find((s) => s.state === 'opened' || (s.state as any) === 'in_progress');

  const [searchPaymentTerm, setSearchPaymentTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'wave' | 'orange_money' | 'card'>('all');
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [tillNameInput, setTillNameInput] = useState('Guichet Caisse 1 (Hall Principal)');
  const [openingBalanceInput, setOpeningBalanceInput] = useState('50000');
  const [openSessionNotes, setOpenSessionNotes] = useState('');
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState(true);

  const isSupervisor = currentUser?.role?.toLowerCase().includes('superv') || currentUser?.role?.toLowerCase().includes('admin') || currentUser?.role?.toLowerCase().includes('direct') || currentUser?.login?.toLowerCase().includes('admin') || currentUser?.login === 'mandemohamed68@gmail.com';

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
      }
    } catch (_) {
      setShowOpenSessionModal(false);
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
              onClick={() => setShowGuideBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
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

      {/* Active Session Status Banner */}
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
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition"
            >
              Arrêté & Billetage
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900">
                Aucune session de caisse ouverte pour votre poste
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Veuillez ouvrir votre session en déclarant le fond de caisse initial afin d'enregistrer des encaissements et d'éditer des quittances officielles.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOpenSessionModal(true)}
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg transition shrink-0"
          >
            Ouvrir ma Session
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Statut de ma caisse</span>
            <CreditCard className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {myActiveSession ? 'Ouverte' : 'Fermée'}
          </p>
          <span className="text-[11px] text-slate-500">
            {myActiveSession ? `Fond: ${formatFCFA(fondInitial)}` : 'Caisse fermée'}
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
