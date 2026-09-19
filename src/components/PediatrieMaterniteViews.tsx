import React, { useState, useRef } from 'react';
import {
  Baby,
  Heart,
  Calendar,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Printer,
  FileText,
  CreditCard,
  ShieldCheck,
  User,
  Scale,
  Thermometer,
  Eye,
  Trash2,
  Save,
  Check,
  ArrowRight,
  Send,
  X,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Building,
  Users,
  Stethoscope
} from 'lucide-react';
import {
  ResPartner,
  CompanySettings,
  ResUser,
  AppView,
  AccountMove,
  MedicalConsultation,
  VaccinationRecord,
  GrowthRecord,
  CpnRecord,
  DeliveryRecord
} from '../types';
import {
  PEV_VACCINES_SCHEDULE,
  INITIAL_VACCINATION_RECORDS,
  INITIAL_GROWTH_RECORDS,
  INITIAL_CPN_RECORDS,
  INITIAL_DELIVERY_RECORDS
} from '../data/defaultHospitalServices';
import { printElement } from '../lib/printUtils';

interface ModuleProps {
  currentView: AppView;
  company: CompanySettings;
  currentUser: ResUser | null;
  partners: ResPartner[];
  consultations: MedicalConsultation[];
  moves?: AccountMove[];
  onNavigateToView: (view: AppView) => void;
  onRefreshData?: () => Promise<void>;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

// -------------------------------------------------------------
// PÉDIATRIE - DASHBOARD
// -------------------------------------------------------------
export const PediatrieDashboardView: React.FC<ModuleProps> = ({
  company,
  partners,
  consultations,
  onNavigateToView,
}) => {
  const pediatricPatients = partners.filter((p) => (p.age !== undefined && p.age !== null && p.age <= 15) || p.patient_class?.includes('Pédiatrie'));
  const infantsCount = pediatricPatients.filter((p) => (p.age || 0) <= 2).length;
  const childrenCount = pediatricPatients.filter((p) => (p.age || 0) > 2 && (p.age || 0) <= 15).length;
  const todayConsults = consultations.filter((c) => c.specialty?.includes('Pédiatrie') || (c.patient_age !== undefined && (c.patient_age || 0) <= 15));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Pôle Pédiatrie &amp; Santé Infantile
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                Service Opérationnel
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Prise en charge intégrée du nouveau-né, nourrisson et enfant (0 à 15 ans) • PEV &amp; Nutrition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('pediatrie_vaccination')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Carnet Vaccinal PEV</span>
          </button>
          <button
            onClick={() => onNavigateToView('pediatrie_consultations')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Consultation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Patientèle Pédiatrique</span>
            <Baby className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{pediatricPatients.length || 28}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span>{infantsCount || 12} nourrissons (0-2 ans)</span>
            <span>•</span>
            <span>{childrenCount || 16} enfants (2-15 ans)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Couverture PEV 2026</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">96.4 %</div>
          <div className="text-[11px] text-slate-500 mt-1">Conforme aux objectifs OMS</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Consultations du Jour</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{todayConsults.length || 8}</div>
          <div className="text-[11px] text-slate-500 mt-1">3 urgences fébriles prises en charge</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Lits Néonat / Pédiatrie</span>
            <Building className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">10 / 14</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">4 lits disponibles immédiatement</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateToView('pediatrie_queue')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 mb-3 group-hover:scale-105 transition">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">File d'Attente Pédiatrique</h3>
          <p className="text-xs text-slate-500 mt-1">Triage des enfants fébriles et nourrissons en attente</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 mt-3">
            Accéder à la file <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToView('pediatrie_consultations')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition">
            <Baby className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Consultations Spécialisées</h3>
          <p className="text-xs text-slate-500 mt-1">Examen pédiatrique, diagnostic et prescription dosée au poids</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 mt-3">
            Consulter <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToView('pediatrie_vaccination')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Programme PEV &amp; Vaccins</h3>
          <p className="text-xs text-slate-500 mt-1">Calendrier vaccinal national, administration et alertes rappels</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-3">
            Gérer vaccins <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToView('pediatrie_croissance')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-3 group-hover:scale-105 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Courbes OMS &amp; Biométrie</h3>
          <p className="text-xs text-slate-500 mt-1">Suivi Poids/Taille/PC et dépistage précoce de la malnutrition</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-3">
            Voir courbes <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      {/* Actes Pédiatriques Facturables Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Nomenclature &amp; Tarification des Actes Pédiatriques
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Synchronisé avec Caisse &amp; Facturation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Acte</th>
                <th className="py-2.5 px-4">Libellé de la Prestation Pédiatrique</th>
                <th className="py-2.5 px-4">Public Cible</th>
                <th className="py-2.5 px-4 text-right">Tarif Public (FCFA)</th>
                <th className="py-2.5 px-4 text-right">Ticket Modérateur (20%)</th>
                <th className="py-2.5 px-4 text-center">Statut PEV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { code: 'PED-CS-01', name: 'Consultation Pédiatrique Générale', target: 'Nourrisson & Enfant', price: 10000, tm: 2000, pev: 'Acte payant' },
                { code: 'PED-CS-02', name: 'Consultation Nouveau-Né / Néonatologie', target: '0 à 28 jours', price: 12000, tm: 2400, pev: 'Acte payant' },
                { code: 'PED-VAC-PEV', name: 'Séance de Vaccination PEV (BCG, Polio, Penta, ROR)', target: 'Programme National', price: 0, tm: 0, pev: 'Gratuit (Prise en charge État)' },
                { code: 'PED-VAC-HP', name: 'Vaccin Hors PEV (Méningite ACWY, Varicelle)', target: 'Sur prescription', price: 15000, tm: 3000, pev: 'Acte payant' },
                { code: 'PED-NUT-01', name: 'Bilan Nutritionnel & Courbe Biométrique OMS', target: 'Enfant < 5 ans', price: 5000, tm: 1000, pev: 'Acte payant' },
                { code: 'PED-AER-01', name: 'Séance d\'Aérosolthérapie / Nébulisation Pédiatrique', target: 'Crise d\'asthme / Bronchiolite', price: 4000, tm: 800, pev: 'Acte payant' },
                { code: 'PED-SEJ-01', name: 'Forfait Journalier Hospitalisation Pédiatrique', target: 'Unité Enfants', price: 15000, tm: 3000, pev: 'Acte payant' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-700">{item.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-slate-600">{item.target}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {item.price === 0 ? <span className="text-emerald-600">0 FCFA</span> : `${item.price.toLocaleString('fr-FR')} FCFA`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {item.tm === 0 ? '0 FCFA' : `${item.tm.toLocaleString('fr-FR')} FCFA`}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.pev.includes('Gratuit')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.pev}
                    </span>
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
// PÉDIATRIE - FILE D'ATTENTE & TRIAGE
// -------------------------------------------------------------
export const PediatrieQueueView: React.FC<ModuleProps> = ({
  partners,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const pediatricPatients = partners.filter((p) =>
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.ndm?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    ((p.age !== undefined && p.age !== null && p.age <= 15) || p.patient_class?.includes('Pédiatrie'))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">File d'Attente des Enfants &amp; Triage Pédiatrique</h1>
            <p className="text-xs text-slate-500">Priorisation par niveau d'urgence (fièvre &gt; 39°C, détresse respiratoire, déshydratation)</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher un enfant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase">Enfants Présents en Salle d'Attente</h2>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            {pediatricPatients.length} en attente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">NDM</th>
                <th className="py-2.5 px-4">Nom de l'Enfant</th>
                <th className="py-2.5 px-4">Âge / Sexe</th>
                <th className="py-2.5 px-4">Motif &amp; Constantes</th>
                <th className="py-2.5 px-4">Niveau Priorité</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pediatricPatients.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.ndm || `NDM-00${270410 + idx}`}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.age || 2} an(s) • {p.gender === 'F' ? 'Fille' : 'Garçon'}</td>
                  <td className="py-3 px-4 text-slate-800">
                    <span className="font-semibold">Fièvre &amp; Toux</span> (T°: 38.8°C, Poids: 11.2 kg)
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      Priorité 2 (Urgence relative)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('pediatrie_consultations')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                      <span>Consulter</span>
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
// PÉDIATRIE - CONSULTATIONS
// -------------------------------------------------------------
export const PediatrieConsultationsView: React.FC<ModuleProps> = ({
  company,
  partners,
  consultations,
  onNavigateToView,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Consultations Médicales Pédiatriques</h1>
            <p className="text-xs text-slate-500">Examen complet de l'enfant, posologie pondérale, ordonnance et bilans</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToView('medecin_consultations')}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Ouvrir l'Espace Consultation Global</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 text-xs">
          <strong>Protocole Pédiatrique Intégré :</strong> Le module consultation dispose d'un calculateur automatique de doses pédiatriques en fonction du poids corporel (mg/kg/jour) et des règles d'exonération PEV.
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// PÉDIATRIE - CARNET VACCINAL PEV
// -------------------------------------------------------------
export const PediatrieVaccinationView: React.FC<ModuleProps> = ({
  company,
  partners,
  currentUser,
  onShowToast,
}) => {
  const [vaccinesList, setVaccinesList] = useState<VaccinationRecord[]>(INITIAL_VACCINATION_RECORDS);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(101);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVaccineCode, setSelectedVaccineCode] = useState<string>('PNEUMO_1');
  const [lotNumber, setLotNumber] = useState<string>('LOT-2026-X88');
  const [vaccineNotes, setVaccineNotes] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  const pediatricPatients = partners.filter((p) => (p.age !== undefined && p.age !== null && p.age <= 15) || p.patient_class?.includes('Pédiatrie'));
  const currentPatient = partners.find((p) => p.id === selectedPatientId) || {
    id: 101,
    name: 'Bébé KOUAME Ange',
    ndm: 'NDM-00270410',
    age: 1,
    gender: 'M',
  };

  const patientVaccines = vaccinesList.filter((v) => v.patient_id === selectedPatientId);

  const handleAdministerVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    const sched = PEV_VACCINES_SCHEDULE.find((s) => s.code === selectedVaccineCode);
    const newRecord: VaccinationRecord = {
      id: `vac-${Date.now()}`,
      patient_id: selectedPatientId,
      patient_name: currentPatient.name,
      vaccine_code: selectedVaccineCode,
      vaccine_name: sched ? sched.name : selectedVaccineCode,
      dose_number: sched ? sched.dose : 1,
      target_age_weeks: sched ? sched.target_weeks : 0,
      status: 'administered',
      date_administered: new Date().toISOString().split('T')[0],
      lot_number: lotNumber,
      administered_by: currentUser?.name || 'Dr. Aminata Diallo',
      is_pev_free: true,
      notes: vaccineNotes || 'Administration bien tolérée',
    };

    setVaccinesList([newRecord, ...vaccinesList]);
    setIsModalOpen(false);
    setVaccineNotes('');
    if (onShowToast) {
      onShowToast(`Vaccin ${newRecord.vaccine_name} enregistré avec succès dans le carnet PEV`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Carnet Vaccinal &amp; Programme Élargi de Vaccination (PEV)
            </h1>
            <p className="text-xs text-slate-500">
              Suivi officiel des vaccinations obligatoires et recommandées de la naissance à 15 ans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (printRef.current) {
                printElement(printRef.current, `Carnet_Vaccinal_${currentPatient.name.replace(/\s+/g, '_')}`);
              }
            }}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimer le Carnet</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer une Dose</span>
          </button>
        </div>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase">Sélectionner l'Enfant :</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
          >
            <option value={101}>Bébé KOUAME Ange (6 mois - NDM-00270410)</option>
            <option value={102}>Enfant DIALLO Ismaël (3 ans - NDM-00270411)</option>
            {pediatricPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.age || 0} ans - {p.ndm || 'Sans NDM'})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-600">
          Statut PEV : <strong className="text-emerald-700 font-bold">À jour des vaccins du 6e mois</strong>
        </div>
      </div>

      {/* Printable Area / Table */}
      <div ref={printRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 space-y-6">
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase">
              {company.name || 'HÔPITAL NATIONAL DE BIOLOGIE & CLINIQUE'}
            </h2>
            <p className="text-xs text-slate-600">Direction de la Santé Infantile • Carnet Vaccinal Officiel PEV</p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-900">Patient : {currentPatient.name}</div>
            <div className="text-slate-500 font-mono">NDM: {(currentPatient as any).ndm || 'NDM-00270410'} • {currentPatient.age} an(s)</div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Calendrier Vaccinal PEV &amp; Doses Reçues
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Âge Recommandé</th>
                  <th className="py-2.5 px-3">Vaccin &amp; Maladie Cible</th>
                  <th className="py-2.5 px-3">Voie</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3">Date Administration</th>
                  <th className="py-2.5 px-3">N° Lot</th>
                  <th className="py-2.5 px-3">Praticien / Soignant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PEV_VACCINES_SCHEDULE.map((sch, idx) => {
                  const done = patientVaccines.find((v) => v.vaccine_code === sch.code && v.status === 'administered');
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-slate-700">{sch.target_age}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {sch.name}
                        <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">PEV Gratuit</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{sch.route}</td>
                      <td className="py-3 px-3">
                        {done ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Administré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> À venir / Programmé
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">
                        {done?.date_administered || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {done?.lot_number || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">
                        {done?.administered_by || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Administer Vaccine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Enregistrer une Dose Vaccinale</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdministerVaccine} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Patient :</span>
                <strong className="text-slate-900 text-sm">{currentPatient.name}</strong>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Sélectionner le Vaccin PEV *</label>
                <select
                  value={selectedVaccineCode}
                  onChange={(e) => setSelectedVaccineCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {PEV_VACCINES_SCHEDULE.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.name} ({v.target_age})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Numéro de Lot du Flacon *</label>
                <input
                  type="text"
                  required
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                  placeholder="ex: LOT-2026-PNT89"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Observations / Réaction Immédiate</label>
                <input
                  type="text"
                  value={vaccineNotes}
                  onChange={(e) => setVaccineNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  placeholder="ex: Aucune réaction locale, bonne tolérance"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                ✓ Cet acte relève du Programme Élargi de Vaccination (Gratuit, prise en charge par l'État).
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmer la Vaccination</span>
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
// PÉDIATRIE - SUIVI DE CROISSANCE & COURBES OMS
// -------------------------------------------------------------
export const PediatrieCroissanceView: React.FC<ModuleProps> = ({
  company,
  partners,
  currentUser,
  onShowToast,
}) => {
  const [growthList, setGrowthList] = useState<GrowthRecord[]>(INITIAL_GROWTH_RECORDS);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(101);
  const [ageMonths, setAgeMonths] = useState<number>(6);
  const [weight, setWeight] = useState<string>('7.6');
  const [height, setHeight] = useState<string>('67.5');
  const [pc, setPc] = useState<string>('43.2');
  const [muac, setMuac] = useState<string>('14.5');

  const currentPatient = partners.find((p) => p.id === selectedPatientId) || {
    id: 101,
    name: 'Bébé KOUAME Ange',
    ndm: 'NDM-00270410',
    age: 1,
    gender: 'M',
  };

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const wNum = parseFloat(weight) || 0;
    const hNum = parseFloat(height) || 0;
    const pcNum = parseFloat(pc) || 0;
    const muacNum = parseFloat(muac) || 0;

    let status: GrowthRecord['nutritional_status'] = 'normal';
    if (muacNum > 0 && muacNum < 11.5) status = 'severe_malnutrition';
    else if (muacNum >= 11.5 && muacNum < 12.5) status = 'moderate_malnutrition';

    const newRec: GrowthRecord = {
      id: `grow-${Date.now()}`,
      patient_id: selectedPatientId,
      patient_name: currentPatient.name,
      date: new Date().toISOString().split('T')[0],
      age_months: ageMonths,
      weight_kg: wNum,
      height_cm: hNum,
      head_circumference_cm: pcNum,
      muac_cm: muacNum,
      nutritional_status: status,
      recorded_by: currentUser?.name || 'Dr. Aminata Diallo',
    };

    setGrowthList([newRec, ...growthList]);
    if (onShowToast) {
      onShowToast(`Mesure de croissance enregistrée pour ${currentPatient.name}`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Biométrie, Courbes de Croissance &amp; Statut Nutritionnel (Normes OMS)
            </h1>
            <p className="text-xs text-slate-500">
              Surveillance du développement pondéro-statural et détection précoce du retard de croissance
            </p>
          </div>
        </div>
      </div>

      {/* Entry Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saisie form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-700" />
            Saisie de la Mensuration
          </h2>

          <form onSubmit={handleAddMeasurement} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Âge en mois *</label>
              <input
                type="number"
                min="0"
                max="60"
                value={ageMonths}
                onChange={(e) => setAgeMonths(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Poids (kg) *</label>
                <input
                  type="number"
                  step="0.05"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Taille (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Périmètre Crânien (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={pc}
                  onChange={(e) => setPc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Périmètre Brachial (MUAC cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={muac}
                  onChange={(e) => setMuac(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Enregistrer la mesure</span>
            </button>
          </form>
        </div>

        {/* Historique des mesures */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Historique des Données Biométriques
            </h3>
            <span className="text-[11px] text-slate-500 font-bold">{growthList.length} mesures enregistrées</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Âge</th>
                  <th className="py-2.5 px-4">Poids (kg)</th>
                  <th className="py-2.5 px-4">Taille (cm)</th>
                  <th className="py-2.5 px-4">PC (cm)</th>
                  <th className="py-2.5 px-4">MUAC (cm)</th>
                  <th className="py-2.5 px-4 text-center">Statut Nutritionnel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {growthList.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-800">{g.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{g.patient_name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{g.age_months} mois</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{g.weight_kg} kg</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{g.height_cm} cm</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{g.head_circumference_cm || '—'} cm</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{g.muac_cm || '—'} cm</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {g.nutritional_status === 'normal' ? 'Normal / Eutrophique' : g.nutritional_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MATERNITÉ - DASHBOARD
// -------------------------------------------------------------
export const MaterniteDashboardView: React.FC<ModuleProps> = ({
  company,
  partners,
  onNavigateToView,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Pôle Maternité, Obstétrique &amp; Salle de Naissance
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                Service Opérationnel
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultations Prénatales (CPN1-4+), Travail &amp; Partogramme, Accouchements et Surveillance Mère-Enfant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('maternite_cpn')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle CPN</span>
          </button>
          <button
            onClick={() => onNavigateToView('maternite_accouchements')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Registre Accouchement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Grossesses Suivies (CPN)</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">42 gestantes</div>
          <div className="text-[11px] text-slate-500 mt-1">12 à terme ce mois-ci</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Accouchements du Mois</span>
            <Baby className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">18 naissances</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% survie mère et nouveau-né</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Taux de Voie Basse</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">83.3 %</div>
          <div className="text-[11px] text-slate-500 mt-1">15 voies basses • 3 césariennes</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Lits Maternité &amp; Suites</span>
            <Building className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">12 / 18</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">6 lits libres pour admissions</div>
        </div>
      </div>

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateToView('maternite_cpn')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-105 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Consultations Prénatales (CPN)</h3>
          <p className="text-xs text-slate-500 mt-1">Calcul DPA/SA, Hauteur Utérine, BCF, sérologies et bilan TPI</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-3">
            Gérer CPN <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToView('maternite_accouchements')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 mb-3 group-hover:scale-105 transition">
            <Baby className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Registre des Accouchements</h3>
          <p className="text-xs text-slate-500 mt-1">Fiches de naissance, Score d'Apgar, délivrance et soins nouveau-né</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 mt-3">
            Voir registre <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToView('maternite_partogramme')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Partogramme &amp; Surveillance</h3>
          <p className="text-xs text-slate-500 mt-1">Courbe de dilatation cervicale, contractions et bruits du cœur fœtal</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 mt-3">
            Suivre travail <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToView('maternite_postpartum')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Suites de Couches &amp; Sorties</h3>
          <p className="text-xs text-slate-500 mt-1">Surveillance mère-enfant, allaitement maternel, sortie et facturation</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-3">
            Suivi accouchées <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      {/* Actes Maternité Facturables Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Grille Tarifaire des Actes Obstétricaux &amp; Maternité
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Synchronisé avec Caisse &amp; Facturation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Acte</th>
                <th className="py-2.5 px-4">Prestation / Acte Médical</th>
                <th className="py-2.5 px-4">Description / Prestations Incluses</th>
                <th className="py-2.5 px-4 text-right">Tarif Public (FCFA)</th>
                <th className="py-2.5 px-4 text-right">Prise en Charge Assur. (80%)</th>
                <th className="py-2.5 px-4 text-right">Part Patient (TM 20%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { code: 'MAT-CPN-01', name: 'Consultation Prénatale (CPN 1 à 4)', desc: 'Examen obstétrical, HU, BCF, bilan tensionnel et carnet', price: 8000, cov: 6400, tm: 1600 },
                { code: 'MAT-ECH-01', name: 'Échographie Obstétricale T1/T2/T3', desc: 'Datation, biométrie fœtale, morphologie et doppler', price: 18000, cov: 14400, tm: 3600 },
                { code: 'MAT-ACC-01', name: 'Forfait Accouchement Eutocique par Voie Basse', desc: 'Salle de naissance, délivrance, soins nouveau-né et 24h séjour', price: 65000, cov: 52000, tm: 13000 },
                { code: 'MAT-ACC-02', name: 'Accouchement Dystocique / Manœuvres', desc: 'Extraction instrumentale (ventouse / spatules) + réanimation', price: 85000, cov: 68000, tm: 17000 },
                { code: 'MAT-CES-01', name: 'Forfait Césarienne Programmée ou d\'Urgence', desc: 'Bloc opératoire, anesthésie, acte chirurgical et 72h séjour', price: 180000, cov: 144000, tm: 36000 },
                { code: 'MAT-SEJ-01', name: 'Nuitée Supplémentaire Maternité', desc: 'Chambre individuelle climatisée + surveillance sage-femme', price: 20000, cov: 16000, tm: 4000 },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-rose-700">{item.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-slate-600">{item.desc}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {item.price.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                    {item.cov.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                    {item.tm.toLocaleString('fr-FR')} FCFA
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
// MATERNITÉ - CONSULTATIONS PRÉNATALES (CPN)
// -------------------------------------------------------------
export const MaterniteCpnView: React.FC<ModuleProps> = ({
  company,
  partners,
  currentUser,
  onShowToast,
}) => {
  const [cpnList, setCpnList] = useState<CpnRecord[]>(INITIAL_CPN_RECORDS);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [patientName, setPatientName] = useState<string>('Mme KONE Aïcha');
  const [ddr, setDdr] = useState<string>('2026-03-01');
  const [dpa, setDpa] = useState<string>('2026-12-08');
  const [sa, setSa] = useState<number>(28);
  const [hu, setHu] = useState<number>(26);
  const [bcf, setBcf] = useState<number>(142);
  const [bpSys, setBpSys] = useState<number>(115);
  const [bpDia, setBpDia] = useState<number>(75);
  const [weight, setWeight] = useState<number>(68.5);
  const [notes, setNotes] = useState<string>('Examen satisfaisant');
  const printRef = useRef<HTMLDivElement>(null);

  const handleAddCpn = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: CpnRecord = {
      id: `cpn-${Date.now()}`,
      patient_id: 201,
      patient_name: patientName,
      cpn_number: cpnList.length + 1,
      date: new Date().toISOString().split('T')[0],
      ddr,
      dpa,
      gestational_age_weeks: sa,
      fundal_height_cm: hu,
      fetal_heart_rate: bcf,
      fetal_movement: true,
      fetal_presentation: 'cephalique',
      blood_pressure_sys: bpSys,
      blood_pressure_dia: bpDia,
      maternal_weight_kg: weight,
      glycosuria: 'negatif',
      proteinuria: 'negatif',
      vat_administered: true,
      iron_folic_acid_prescribed: true,
      malaria_tpi_administered: true,
      doctor_notes: notes,
    };

    setCpnList([newRecord, ...cpnList]);
    setIsModalOpen(false);
    if (onShowToast) {
      onShowToast(`Consultation prénatale enregistrée pour ${patientName}`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Consultations Prénatales (CPN 1 à 4+) &amp; Suivi Grossesse
            </h1>
            <p className="text-xs text-slate-500">
              Surveillance clinique, calcul du terme obstétrical, prévention de l'anémie et du paludisme gestationnel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (printRef.current) {
                printElement(printRef.current, 'Fiche_Suivi_CPN');
              }
            }}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimer la Fiche</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Fiche CPN</span>
          </button>
        </div>
      </div>

      {/* Table list */}
      <div ref={printRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase">
              {company.name || 'HÔPITAL NATIONAL DE BIOLOGIE & CLINIQUE'} • REGISTRE CPN
            </h2>
            <p className="text-xs text-slate-500">Unité de Suivi Obstétrical &amp; Gynécologie</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">{cpnList.length} fiches actives</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Gestante / Patiente</th>
                <th className="py-2.5 px-3">N° CPN</th>
                <th className="py-2.5 px-3">Terme (SA)</th>
                <th className="py-2.5 px-3">DPA Prévue</th>
                <th className="py-2.5 px-3">Tension / Poids</th>
                <th className="py-2.5 px-3">HU / BCF</th>
                <th className="py-2.5 px-3">Risque</th>
                <th className="py-2.5 px-3">Prescriptions TPI/Fer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cpnList.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono text-slate-800">{c.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{c.patient_name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                      CPN {c.cpn_number}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.gestational_age_weeks} SA</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{c.dpa || '—'}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {c.blood_pressure_sys}/{c.blood_pressure_dia} mmHg • {c.maternal_weight_kg} kg
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    HU: {c.fundal_height_cm}cm • BCF: {c.fetal_heart_rate} bpm
                  </td>
                  <td className="py-3 px-3">
                    {c.high_risk_pregnancy ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3" /> Risque Élevé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3" /> Normal
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                      TPI + Fer / Folate administrés
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New CPN Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Nouvelle Consultation Prénatale (CPN)</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCpn} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nom de la Gestante *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">DDR (Dernières Règles)</label>
                  <input
                    type="date"
                    value={ddr}
                    onChange={(e) => setDdr(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">DPA (Terme Prévu)</label>
                  <input
                    type="date"
                    value={dpa}
                    onChange={(e) => setDpa(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Terme (SA) *</label>
                  <input
                    type="number"
                    value={sa}
                    onChange={(e) => setSa(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hauteur Utérine (cm)</label>
                  <input
                    type="number"
                    value={hu}
                    onChange={(e) => setHu(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Bruits Cœur Fœtal (bpm)</label>
                  <input
                    type="number"
                    value={bcf}
                    onChange={(e) => setBcf(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tension Artérielle (mmHg)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Sys"
                      value={bpSys}
                      onChange={(e) => setBpSys(Number(e.target.value))}
                      className="w-1/2 border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-bold"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      placeholder="Dia"
                      value={bpDia}
                      onChange={(e) => setBpDia(Number(e.target.value))}
                      className="w-1/2 border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Poids Maternel (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recommandations &amp; Traitements</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la CPN</span>
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
// MATERNITÉ - REGISTRE DES ACCOUCHEMENTS & APGAR
// -------------------------------------------------------------
export const MaterniteAccouchementView: React.FC<ModuleProps> = ({
  company,
  partners,
  currentUser,
  onShowToast,
}) => {
  const [deliveryList, setDeliveryList] = useState<DeliveryRecord[]>(INITIAL_DELIVERY_RECORDS);
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Registre Officiel des Accouchements &amp; Salle de Naissance
            </h1>
            <p className="text-xs text-slate-500">
              Score d'Apgar (1' / 5' / 10'), biométrie néonatale, voie d'accouchement et surveillance de la délivrance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (printRef.current) {
                printElement(printRef.current, 'Registre_Accouchements');
              }
            }}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimer le Registre</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={printRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase">
              {company.name || 'HÔPITAL NATIONAL DE BIOLOGIE & CLINIQUE'} • REGISTRE DE NAISSANCES
            </h2>
            <p className="text-xs text-slate-500">Service de Gynécologie-Obstétrique &amp; Salle de Travail</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">{deliveryList.length} accouchements enregistrés</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date &amp; Heure</th>
                <th className="py-2.5 px-3">Mère</th>
                <th className="py-2.5 px-3">Mode Délivrance</th>
                <th className="py-2.5 px-3">Sexe Bébé</th>
                <th className="py-2.5 px-3">Poids / Taille / PC</th>
                <th className="py-2.5 px-3 text-center">Score Apgar (1'/5')</th>
                <th className="py-2.5 px-3">État Nouveau-Né</th>
                <th className="py-2.5 px-3">Praticien / Sage-Femme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveryList.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {new Date(d.delivery_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{d.mother_name}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.delivery_type === 'eutocique'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}>
                      {d.delivery_type === 'eutocique' ? 'Voie Basse Eutocique' : 'Césarienne'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {d.newborn_gender === 'M' ? 'Garçon (M)' : 'Fille (F)'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {d.birth_weight_g} g • {d.birth_length_cm} cm • PC: {d.head_circumference_cm} cm
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-mono font-bold border border-sky-200">
                      {d.apgar_1min} / {d.apgar_5min}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <Check className="w-3 h-3" /> Vivant bien portant
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{d.midwife_doctor_name}</td>
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
// MATERNITÉ - PARTOGRAMME & SURVEILLANCE DU TRAVAIL
// -------------------------------------------------------------
export const MaternitePartogrammeView: React.FC<ModuleProps> = ({
  company,
  partners,
  currentUser,
  onShowToast,
}) => {
  const [dilatation, setDilatation] = useState<number>(4);
  const [fetalHeartRate, setFetalHeartRate] = useState<number>(140);
  const [contractionsFreq, setContractionsFreq] = useState<number>(3); // contractions par 10 min
  const [descent, setDescent] = useState<string>('Amorcée (-2)');
  const [bloodPressure, setBloodPressure] = useState<string>('120/75');
  const printRef = useRef<HTMLDivElement>(null);

  const [observations, setObservations] = useState<{ time: string; dil: number; bcf: number; cu: number; ta: string }[]>([
    { time: '08:00', dil: 3, bcf: 138, cu: 2, ta: '115/70' },
    { time: '10:00', dil: 5, bcf: 142, cu: 3, ta: '120/75' },
    { time: '12:00', dil: 7, bcf: 140, cu: 4, ta: '120/80' },
    { time: '13:30', dil: 9, bcf: 136, cu: 4, ta: '125/80' },
  ]);

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    const newObs = {
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dil: dilatation,
      bcf: fetalHeartRate,
      cu: contractionsFreq,
      ta: bloodPressure,
    };
    setObservations([...observations, newObs]);
    if (onShowToast) {
      onShowToast('Point du partogramme enregistré avec succès', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Partogramme OMS &amp; Surveillance Active du Travail d'Accouchement
            </h1>
            <p className="text-xs text-slate-500">
              Lignes d'alerte et d'action, dynamique utérine, progression fœtale et sécurité maternelle
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (printRef.current) {
              printElement(printRef.current, 'Partogramme_Surveillance');
            }
          }}
          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Imprimer le Partogramme</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de relevé */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Nouveau Relevé Horodate
          </h2>

          <form onSubmit={handleAddObservation} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Dilatation Cervicale (cm) [1 - 10]</label>
              <input
                type="number"
                min="1"
                max="10"
                value={dilatation}
                onChange={(e) => setDilatation(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-indigo-700"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Bruits du Cœur Fœtal (BCF bpm)</label>
              <input
                type="number"
                value={fetalHeartRate}
                onChange={(e) => setFetalHeartRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Contractions Utérines (par 10 min)</label>
              <input
                type="number"
                min="0"
                max="6"
                value={contractionsFreq}
                onChange={(e) => setContractionsFreq(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tension Artérielle Mère (mmHg)</label>
              <input
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 mt-3 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer sur le Partogramme</span>
            </button>
          </form>
        </div>

        {/* Visual Partogram & Table */}
        <div ref={printRef} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden p-6 space-y-4">
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase">
                {company.name || 'HÔPITAL NATIONAL DE BIOLOGIE & CLINIQUE'} • PARTOGRAMME CLINIQUE
              </h2>
              <p className="text-xs text-slate-500">Patiente : Mme TRAORE Salimata • Gestité : G2P1 • DDR: 15/12/2025</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded">
              Travail Actif - Progression Normale
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Heure</th>
                  <th className="py-2.5 px-3 text-center">Dilatation (cm)</th>
                  <th className="py-2.5 px-3 text-center">BCF (bpm)</th>
                  <th className="py-2.5 px-3 text-center">Contractions / 10'</th>
                  <th className="py-2.5 px-3 text-center">Tension Mère</th>
                  <th className="py-2.5 px-3 text-center">Ligne d'Alerte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {observations.map((obs, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{obs.time}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {obs.dil} cm
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-800">{obs.bcf} bpm</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-800">{obs.cu} / 10 min</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-800">{obs.ta}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        À gauche de l'alerte (OK)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MATERNITÉ - POST-PARTUM & SUITES DE COUCHES
// -------------------------------------------------------------
export const MaternitePostpartumView: React.FC<ModuleProps> = ({
  company,
  partners,
  currentUser,
  onNavigateToView,
  onShowToast,
}) => {
  const [postpartumCases, setPostpartumCases] = useState([
    {
      id: 'pp-1',
      mother_name: 'Mme TRAORE Salimata',
      baby_name: 'Nouveau-né Fille TRAORE',
      delivery_date: '17/09/2026 à 04:25',
      room: 'Chambre 104 (Pavillon Mère-Enfant)',
      involution: 'Bonne involution utérine (globe de sécurité)',
      lochies: 'Physiologiques sans odeur',
      feeding: 'Allaitement maternel exclusif bien établi',
      cord_care: 'Soins du cordon au chlorexidine réalisés',
      discharge_status: 'ready', // ready, monitoring, discharged
    },
    {
      id: 'pp-2',
      mother_name: 'Mme COULIBALY Mariatou',
      baby_name: 'Nouveau-né Garçon COULIBALY',
      delivery_date: '16/09/2026 à 18:40',
      room: 'Chambre 108 (Post-Césarienne)',
      involution: 'Pansement abdominal propre, cicatrice saine',
      lochies: 'Modérées normales',
      feeding: 'Allaitement débuté, transit repris',
      cord_care: 'Cordon propre et sec',
      discharge_status: 'monitoring',
    },
  ]);

  const handleAuthorizeDischarge = (caseId: string) => {
    setPostpartumCases(
      postpartumCases.map((c) =>
        c.id === caseId ? { ...c, discharge_status: 'discharged' } : c
      )
    );
    if (onShowToast) {
      onShowToast('Sortie de maternité autorisée et transmise pour quittance à la Caisse', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Surveillance Post-Partum, Suites de Couches &amp; Autorisation de Sortie
            </h1>
            <p className="text-xs text-slate-500">
              Surveillance des accouchées, dépistage des hémorragies et infections, accompagnement à l'allaitement
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {postpartumCases.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm">{c.mother_name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{c.baby_name} • Accouchée le {c.delivery_date}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                {c.room}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-600 font-semibold">Utérus &amp; Involution :</span>
                <strong className="text-slate-900">{c.involution}</strong>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-600 font-semibold">Lochies :</span>
                <strong className="text-slate-900">{c.lochies}</strong>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-600 font-semibold">Allaitement :</span>
                <strong className="text-emerald-700 font-bold">{c.feeding}</strong>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-600 font-semibold">Soins Cordon :</span>
                <strong className="text-slate-900">{c.cord_care}</strong>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {c.discharge_status === 'discharged' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <Check className="w-4 h-4" /> Sortie validée &amp; Quittance délivrée
                </span>
              ) : c.discharge_status === 'ready' ? (
                <button
                  onClick={() => handleAuthorizeDischarge(c.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Autoriser la Sortie &amp; Facturer Séjour</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  Surveillance en cours (Séjour post-op 48h)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
