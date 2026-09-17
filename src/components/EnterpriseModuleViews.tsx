import React, { useState } from 'react';
import { 
  Activity, 
  UserCheck, 
  Stethoscope, 
  Microscope, 
  FlaskConical, 
  Bed, 
  ShieldCheck, 
  Lock, 
  FileText, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  Plus, 
  Printer, 
  Eye, 
  ArrowRight, 
  ArrowLeftRight, 
  Download, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Shield, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Users, 
  Send,
  Heart,
  Pill,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResPartner, AccountMove, AccountPayment, MedicalConsultation, CompanySettings, ResUser, AppView } from '../types';
import { printDocumentById } from '../lib/printUtils';

interface ModuleViewProps {
  currentView: AppView;
  partners: ResPartner[];
  invoices: AccountMove[];
  payments: AccountPayment[];
  consultations: MedicalConsultation[];
  company: CompanySettings;
  currentUser: ResUser | null;
  onNavigateToView: (view: AppView) => void;
  onNewInvoice?: () => void;
  onNewPayment?: () => void;
}

// -------------------------------------------------------------
// 1. INFIRMIER WORKSPACES
// -------------------------------------------------------------

export const InfirmierQueueView: React.FC<ModuleViewProps> = ({ consultations, partners, onNavigateToView }) => {
  const [filterPriority, setFilterPriority] = useState<'all' | 'critique' | 'urgent' | 'normal'>('all');
  const [calledPatient, setCalledPatient] = useState<string | null>(null);

  const waitingPatients = consultations.filter(c => 
    c.status !== 'completed' &&
    c.status !== 'cancelled' &&
    !c.referred_to_doctor &&
    c.status !== 'referred' &&
    !c.vitals?.taken_at &&
    (c.status === 'triage' || (c.status === 'pending_payment' && !c.has_pending_balance))
  );

  const handleCall = (name: string) => {
    setCalledPatient(name);
    setTimeout(() => setCalledPatient(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-600" />
            File d'Attente - Poste Infirmier & Triage
          </h2>
          <p className="text-xs text-slate-500 mt-1">Patients enregistrés à l'accueil en attente de prise des paramètres vitaux</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('infirmier_vitals')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Saisie Rapide Constantes</span>
          </button>
        </div>
      </div>

      {calledPatient && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between font-bold text-sm shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span>Appel en cours au guichet : <strong>{calledPatient}</strong></span>
          </div>
          <span className="text-xs font-mono bg-emerald-100 px-3 py-1 rounded-full text-emerald-800">Box Infirmier 1</span>
        </motion.div>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {waitingPatients.length} Patient{waitingPatients.length > 1 ? 's' : ''} en attente
          </span>
          <div className="flex gap-2">
            {(['all', 'critique', 'urgent', 'normal'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  filterPriority === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'all' ? 'Tous' : p}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="p-4">Ordre</th>
                <th className="p-4">Patient & NDM</th>
                <th className="p-4">Heure d'arrivée</th>
                <th className="p-4">Motif d'admission</th>
                <th className="p-4 text-center">Niveau Triage</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    Aucun patient en attente au poste infirmier.
                  </td>
                </tr>
              ) : (
                waitingPatients.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-black text-slate-400">#{idx + 1}</td>
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900">{c.patient_name}</p>
                      <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{c.patient_ndm || `NDM-${c.partner_id}`}</p>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(c.consultation_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-slate-700 font-semibold max-w-xs truncate">
                      {c.chief_complaint || 'Consultation générale'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        c.vitals?.triage_level === 'critique'
                          ? 'bg-rose-100 text-rose-800'
                          : c.vitals?.triage_level === 'urgent'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.vitals?.triage_level || 'Normal'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleCall(c.patient_name)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition"
                      >
                        Appeler
                      </button>
                      <button
                        onClick={() => onNavigateToView('infirmier_vitals')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition"
                      >
                        Prendre Constantes
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

export const InfirmierTriageView: React.FC<ModuleViewProps> = ({ onNavigateToView }) => {
  const [selectedTriage, setSelectedTriage] = useState<'1' | '2' | '3'>('2');
  const [painLevel, setPainLevel] = useState(4);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-indigo-600" />
          Grille d'Évaluation Clinique & Triage Infirmier
        </h2>
        <p className="text-xs text-slate-500 mt-1">Classification selon l'échelle standardisée de gravité hospitalière</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => setSelectedTriage('1')}
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
            selectedTriage === '1' ? 'border-rose-500 bg-rose-50/50 shadow-md ring-2 ring-rose-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white">Tri 1 - Rouge</span>
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="font-black text-slate-900 text-base">Détresse Vitale / Urgence Absolue</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Prise en charge immédiate sans délai (SpO2 &lt; 90%, arrêt cardio-respiratoire, état de choc, coma, polytraumatisme sévère).
          </p>
          <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center justify-between text-[11px] font-bold text-rose-700">
            <span>Délai d'attente :</span>
            <span>0 minute</span>
          </div>
        </div>

        <div 
          onClick={() => setSelectedTriage('2')}
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
            selectedTriage === '2' ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-600 text-white">Tri 2 - Jaune</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-black text-slate-900 text-base">Urgence Relative / Prioritaire</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Patient instable ou douleur aiguë sévère (Fièvre très élevée &gt; 39.5°C, douleur thoracique modérée, crise d'asthme).
          </p>
          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold text-amber-700">
            <span>Délai cible :</span>
            <span>&le; 15 minutes</span>
          </div>
        </div>

        <div 
          onClick={() => setSelectedTriage('3')}
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
            selectedTriage === '3' ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">Tri 3 - Vert</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-black text-slate-900 text-base">État Stable / Consultation Simple</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Paramètres vitaux préservés, examen non urgent (syndrome grippal bénin, renouvellement traitement, petite plaie superficielle).
          </p>
          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Délai cible :</span>
            <span>&le; 60 minutes</span>
          </div>
        </div>
      </div>

      {/* Pain & Orientation Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Évaluation de la Douleur (Échelle Visuelle Analogique - EVA)
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Score Douleur : <strong className="text-base text-indigo-600">{painLevel} / 10</strong></span>
            <span className="text-slate-500">
              {painLevel === 0 ? 'Aucune douleur' : painLevel <= 3 ? 'Douleur légère' : painLevel <= 6 ? 'Douleur modérée' : 'Douleur intense'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={painLevel}
            onChange={e => setPainLevel(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={() => onNavigateToView('infirmier_vitals')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <span>Confirmer & Saisir les Constantes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const InfirmierVitalsView: React.FC<ModuleViewProps> = ({ consultations, onNavigateToView }) => {
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [temp, setTemp] = useState('37.2');
  const [hr, setHr] = useState('74');
  const [spo2, setSpo2] = useState('98');
  const [sugar, setSugar] = useState('0.95');
  const [wt, setWt] = useState('70');
  const [ht, setHt] = useState('175');
  const [saved, setSaved] = useState(false);

  const bmi = (Number(wt) > 0 && Number(ht) > 0)
    ? (Number(wt) / Math.pow(Number(ht) / 100, 2)).toFixed(1)
    : '--';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onNavigateToView('medecin_queue');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-600" />
            Saisie & Monitoring des Constantes Vitales
          </h2>
          <p className="text-xs text-slate-500 mt-1">Transmission automatique au poste de consultation du médecin traitant</p>
        </div>
        <button
          onClick={() => onNavigateToView('consultations')}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          Retour aux Consultations
        </button>
      </div>

      {saved && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Constantes enregistrées et transmises avec succès au médecin !</span>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Tension Systolique (mmHg)</label>
            <input
              type="number"
              value={systolic}
              onChange={e => setSystolic(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="120"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Tension Diastolique (mmHg)</label>
            <input
              type="number"
              value={diastolic}
              onChange={e => setDiastolic(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="80"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Température (°C)</label>
            <input
              type="number"
              step="0.1"
              value={temp}
              onChange={e => setTemp(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="37.2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Fréquence Cardiaque (bpm)</label>
            <input
              type="number"
              value={hr}
              onChange={e => setHr(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="72"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Saturation SpO2 (%)</label>
            <input
              type="number"
              value={spo2}
              onChange={e => setSpo2(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="98"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Glycémie Capillaire (g/L)</label>
            <input
              type="number"
              step="0.01"
              value={sugar}
              onChange={e => setSugar(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="0.95"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Poids (kg)</label>
            <input
              type="number"
              step="0.5"
              value={wt}
              onChange={e => setWt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="70"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Taille (cm)</label>
            <input
              type="number"
              value={ht}
              onChange={e => setHt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
              placeholder="175"
            />
          </div>
        </div>

        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="font-bold text-slate-900">Indice de Masse Corporelle (IMC) Calculé : </span>
              <strong className="text-base text-indigo-600 ml-1">{bmi} kg/m²</strong>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {Number(bmi) < 18.5 ? 'Insuffisance pondérale' : Number(bmi) < 25 ? 'Corpulence normale' : 'Surpoids'}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Enregistrer & Transmettre au Médecin</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// -------------------------------------------------------------
// 2. MÉDECIN & SPÉCIALISTE WORKSPACES
// -------------------------------------------------------------

export const MedecinQueueView: React.FC<ModuleViewProps> = ({ consultations, onNavigateToView }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-indigo-600" />
            Salle d'Attente Médicale (Patients Prêts avec Constantes)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Patients ayant déjà effectué le triage et la prise des constantes par l'infirmier</p>
        </div>
        <button
          onClick={() => onNavigateToView('consultations')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Consultation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {consultations.map(c => {
          const v = c.vitals;
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base">{c.patient_name}</h3>
                  <p className="text-[11px] font-mono text-indigo-600">{c.patient_ndm || `NDM-${c.partner_id}`}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  v?.triage_level === 'critique' ? 'bg-rose-100 text-rose-800' : v?.triage_level === 'urgent' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {v?.triage_level || 'Normal'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">TA</span>
                  <strong className="text-slate-800 font-mono">{v?.bp_systolic || 120}/{v?.bp_diastolic || 80}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Temp</span>
                  <strong className="text-slate-800 font-mono">{v?.temperature || 37.2} °C</strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">SpO2</span>
                  <strong className="text-slate-800 font-mono">{v?.spo2 || 98} %</strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                <strong>Motif :</strong> {c.chief_complaint || 'Examen de contrôle général'}
              </p>

              <button
                onClick={() => onNavigateToView('consultations')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <span>Démarrer Examen Clinique</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MedecinPrescriptionsView: React.FC<ModuleViewProps> = ({ consultations, onNavigateToView }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Pill className="w-5 h-5 text-indigo-600" />
            Registre des Prescriptions & Ordonnances Médicales
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ordonnances de médicaments, bons d'analyses de laboratoire et demandes d'imagerie</p>
        </div>
      </div>

      <div id="prescriptions-table-enterprise" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="p-4">N° Consultation</th>
              <th className="p-4">Patient</th>
              <th className="p-4">Médecin Prescripteur</th>
              <th className="p-4">Type & Contenu</th>
              <th className="p-4 text-center">Statut</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {consultations.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-slate-700">{c.consultation_number}</td>
                <td className="p-4 font-extrabold text-slate-900">{c.patient_name}</td>
                <td className="p-4 text-slate-600">{c.doctor_name}</td>
                <td className="p-4 text-slate-700">
                  {c.prescribed_items?.length > 0 ? (
                    <span className="font-semibold text-indigo-600">{c.prescribed_items.length} produit(s) / examen(s)</span>
                  ) : (
                    <span className="text-slate-400">Ordonnance standard</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Délivrée
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => printDocumentById('prescriptions-table-enterprise', `Ordonnance_${c.consultation_number}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Imprimer</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SpecialisteReferredView: React.FC<ModuleViewProps> = ({ consultations, onNavigateToView }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          Patients Orientés & Avis Spécialisés Référés
        </h2>
        <p className="text-xs text-slate-500 mt-1">Dossiers transmis par les médecins généralistes ou le service des urgences pour avis d'expert</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 1, name: "Mamadou Sow", age: 52, specialty: "Cardiologie", referrer: "Dr. Touré", reason: "Hypertension résistante sous bithérapie avec dyspnée d'effort", date: "Aujourd'hui, 08:30", urgency: "Prioritaire" },
          { id: 2, name: "Fatoumata Barry", age: 29, specialty: "Endocrinologie", referrer: "Dr. Keita", reason: "Diabète gestationnel déséquilibré à 28 SA", date: "Hier, 14:15", urgency: "Standard" }
        ].map(ref => (
          <div key={ref.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-slate-900 text-base">{ref.name} ({ref.age} ans)</h3>
                <p className="text-xs text-indigo-600 font-semibold">Spécialité : {ref.specialty}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                ref.urgency === 'Prioritaire' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>{ref.urgency}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="text-slate-500"><strong>Médecin adresseur :</strong> {ref.referrer}</p>
              <p className="text-slate-700"><strong>Motif :</strong> {ref.reason}</p>
            </div>
            <button
              onClick={() => onNavigateToView('consultations')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition"
            >
              Prendre en Charge la Consultation Spécialisée
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. IMAGERIE & RADIOLOGIE WORKSPACES
// -------------------------------------------------------------

export const ImagerieWorkspacesView: React.FC<ModuleViewProps> = ({ currentView, onNavigateToView }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'scheduled' | 'completed' | 'reports'>('queue');

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Microscope className="w-5 h-5 text-indigo-600" />
            Pôle d'Imagerie Médicale & Radiologie Digitale
          </h2>
          <p className="text-xs text-slate-500 mt-1">Gestion complète des actes radiologiques, échographiques et scanners</p>
        </div>
        <button
          onClick={() => onNavigateToView('imaging_pacs')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <Radio className="w-4 h-4" />
          <span>Console Visualiseur PACS</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'queue', label: '1. Patients en attente' },
              { id: 'scheduled', label: '2. Examens programmés' },
              { id: 'completed', label: '3. Examens réalisés' },
              { id: 'reports', label: '4. Comptes rendus' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'queue' && (
            <div className="space-y-3 text-xs">
              {[
                { id: "IMG-01", patient: "Kadiatou Camara", exam: "Radiographie Thorax Face", prescriber: "Dr. Touré", wait: "12 min", status: "Quittance Caisse Validée" },
                { id: "IMG-02", patient: "Ibrahima Diallo", exam: "Échographie Abdomino-pelvienne", prescriber: "Dr. Keita", wait: "25 min", status: "Prise en charge Assurance OK" }
              ].map(item => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{item.patient}</h4>
                    <p className="text-indigo-600 font-semibold mt-0.5">{item.exam} • Prescrit par {item.prescriber}</p>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-xs">Attente : {item.wait}</span>
                    <button
                      onClick={() => onNavigateToView('imaging_pacs')}
                      className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold"
                    >
                      Acquérir Cliché
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">Mamadou Sow</p>
                  <p className="text-slate-600">Scanner Cérébral sans injection • Cliché acquis sur PACS Alpha</p>
                </div>
                <button 
                  onClick={() => onNavigateToView('imaging_pacs')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Visualiser Cliché DICOM
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div id="radiology-report-detail-card" className="space-y-4 text-xs">
              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h4 className="font-black text-slate-900">Compte-rendu : Radiographie Pulmonaire</h4>
                    <p className="text-slate-500">Patient : Kadiatou Camara • Date : 15/09/2026</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                    Validé par Radiologue
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Indication :</strong> Bilan de toux chronique persistante.<br />
                  <strong>Résultats :</strong> Absence de foyer alvéolaire ou interstitiel décelable. Index cardio-thoracique dans les limites normales. Cul-de-sacs pleuraux libres.<br />
                  <strong>Conclusion :</strong> Cliché thoracique sans anomalie pleuro-parenchymateuse évolutive.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => printDocumentById('radiology-report-detail-card', 'Compte_Rendu_Radiographie')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer">
                    <Printer className="w-3.5 h-3.5 text-slate-600" /> Imprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. HOSPITALISATION WORKSPACES
// -------------------------------------------------------------

export const HospitalisationWorkspacesView: React.FC<ModuleViewProps> = ({ currentView, onNavigateToView }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Bed className="w-5 h-5 text-indigo-600" />
            Gestion des Séjours & Lits d'Hospitalisation
          </h2>
          <p className="text-xs text-slate-500 mt-1">Admissions, attribution des chambres, transferts et autorisations de sortie</p>
        </div>
        <button
          onClick={() => onNavigateToView('bed_management')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <Bed className="w-4 h-4" />
          <span>Plan Interactif des Lits</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Patients Actuellement Alités</h3>
          {[
            { name: "Boubacar Bah", room: "Chambre 102", bed: "Lit A", service: "Médecine Interne", days: 3, doctor: "Dr. Touré" },
            { name: "Aissatou Diallo", room: "Chambre 204", bed: "Lit B", service: "Chirurgie Générale", days: 1, doctor: "Dr. Keita" }
          ].map((p, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{p.name}</h4>
                <p className="text-indigo-600 font-semibold mt-0.5">{p.service} • {p.room} ({p.bed})</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Durée de séjour : {p.days} jour(s) • Suivi par {p.doctor}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigateToView('care_plans')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Plan de Soins
                </button>
                <button
                  onClick={() => onNavigateToView('hospit_discharges')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Préparer Sortie
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 h-fit">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Occupation Actuelle</h3>
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
            <span className="text-3xl font-black text-indigo-700">78%</span>
            <p className="text-xs font-bold text-indigo-950 mt-1">Taux d'occupation global</p>
            <p className="text-[10px] text-indigo-600 mt-0.5">14 lits disponibles sur 64 lits totaux</p>
          </div>
          <button
            onClick={() => onNavigateToView('bed_management')}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs"
          >
            Attribuer un Lit
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. FACTURATION & SUPERVISEUR WORKSPACES
// -------------------------------------------------------------

export const SuperviseurWorkspacesView: React.FC<ModuleViewProps> = ({ payments, invoices, company, onNavigateToView }) => {
  const totalEncaisse = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalFacture = invoices.reduce((acc, i) => acc + (i.amount_total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Contrôle Superviseur & Pilotage des Caisses
          </h2>
          <p className="text-xs text-slate-500 mt-1">Audit des vacations, contrôle des écarts de caisse et consolidation financière</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Encaissé</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {totalEncaisse.toLocaleString('fr-FR')} {company.currency_symbol || 'GNF'}
          </p>
          <span className="text-[10px] text-slate-400">En direct sur la journée</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Facturé</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {totalFacture.toLocaleString('fr-FR')} {company.currency_symbol || 'GNF'}
          </p>
          <span className="text-[10px] text-slate-400">Toutes prestations confondues</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Sessions Actives</span>
          <p className="text-2xl font-black text-slate-900 mt-1">2 Guichets</p>
          <span className="text-[10px] text-emerald-600 font-bold">100% sans anomalie</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Écart Déclaré</span>
          <p className="text-2xl font-black text-slate-700 mt-1">0 GNF</p>
          <span className="text-[10px] text-slate-400">Parfaite concordance</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Derniers Encaissements Contrôlés</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="p-3">Réf Quittance</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Mode</th>
              <th className="p-3 text-right">Montant</th>
              <th className="p-3 text-center">Contrôle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.slice(0, 5).map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-mono font-bold text-slate-700">{p.name}</td>
                <td className="p-3 font-semibold text-slate-900">{p.partner_name || 'Patient comptant'}</td>
                <td className="p-3 uppercase text-slate-600 font-medium">{p.payment_method_line_id ? 'Espèces' : 'Mobile Money'}</td>
                <td className="p-3 text-right font-black text-slate-900">
                  {(p.amount || 0).toLocaleString('fr-FR')} {company.currency_symbol || 'GNF'}
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Certifié
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
