import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Heart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  User,
  Filter,
  Activity,
  Pill,
  Thermometer,
  ShieldCheck,
  Calendar,
  X,
  ChevronRight,
  Stethoscope,
  Droplets,
  RotateCcw,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ResPartner, ResUser } from '../types';
import { printElement, printDocumentById } from '../lib/printUtils';

export interface NursingCareItem {
  id: string;
  patient_id?: number;
  patient_name: string;
  patient_ndm?: string;
  room_bed: string;
  care_type: 'injection' | 'oral_med' | 'dressing' | 'vitals' | 'aerosol' | 'infusion' | 'comfort';
  care_type_label: string;
  title: string;
  dosage?: string;
  route?: string;
  scheduled_hour: string; // "08:00", "12:00", "14:00", etc.
  frequency: string; // "Unique", "Toutes les 4h", "2x / jour", "3x / jour"
  prescribing_doctor: string;
  instructions: string;
  status: 'pending' | 'completed' | 'cancelled';
  administered_at?: string;
  administered_by?: string;
  notes?: string;
  vitals?: {
    bp?: string; // Blood pressure
    pulse?: string;
    temperature?: string;
    spo2?: string;
    glycemia?: string;
  };
  priority: 'normal' | 'urgent';
}

interface CarePlansViewProps {
  partners?: ResPartner[];
  currentUser?: ResUser | null;
}

const STORAGE_KEY = 'hospital_nursing_care_plans_v2';

const INITIAL_CARE_PLANS: NursingCareItem[] = [
  {
    id: 'soin-001',
    patient_name: 'Awa Diallo',
    patient_ndm: 'NDM-00270412',
    room_bed: 'Chambre 3 - Lit A',
    care_type: 'injection',
    care_type_label: 'Injection IV',
    title: 'Ceftriaxone 1g IVD',
    dosage: '1g dans 20ml sérum physiologique',
    route: 'Intraveineuse directe lente',
    scheduled_hour: '08:00',
    frequency: '1x / 24h',
    prescribing_doctor: 'Dr. Toure (Médecine Interne)',
    instructions: 'Rinçage au sérum salé avant et après injection. Vérifier point de ponction.',
    status: 'pending',
    priority: 'normal'
  },
  {
    id: 'soin-002',
    patient_name: 'Mamadou Sow',
    patient_ndm: 'NDM-00270415',
    room_bed: 'Chambre 1 - Lit B',
    care_type: 'vitals',
    care_type_label: 'Surveillance Constantes',
    title: 'Prise de constantes complète + Saturométrie',
    dosage: 'Protocole post-opératoire H+24',
    route: 'Monitoring clinique',
    scheduled_hour: '09:30',
    frequency: 'Toutes les 4h',
    prescribing_doctor: 'Dr. Camara (Chirurgie)',
    instructions: 'Surveiller tension artérielle, fréquence cardiaque et saturation O2. Noter la diurèse.',
    status: 'completed',
    administered_at: '2026-09-17 09:35',
    administered_by: 'Inf. Awa Diabaté',
    notes: 'Patient calme. Constantes stables : TA 125/80 mmHg, FC 74 bpm, SaO2 98%.',
    vitals: {
      bp: '125/80',
      pulse: '74',
      temperature: '36.9',
      spo2: '98'
    },
    priority: 'normal'
  },
  {
    id: 'soin-003',
    patient_name: 'Sékou Touré',
    patient_ndm: 'NDM-00270418',
    room_bed: 'Soins Intensifs - Box 2',
    care_type: 'dressing',
    care_type_label: 'Pansement Stérile',
    title: 'Réfection pansement abdominal post-laparotomie',
    dosage: 'Bétadine dermique + compresses stériles',
    route: 'Soin local stérile',
    scheduled_hour: '11:00',
    frequency: '1x / jour',
    prescribing_doctor: 'Dr. Camara (Chirurgie)',
    instructions: 'Asepsie rigoureuse. Vérifier absence d’écoulement ou d’érythème sur berges.',
    status: 'pending',
    priority: 'urgent'
  },
  {
    id: 'soin-004',
    patient_name: 'Fanta Condé',
    patient_ndm: 'NDM-00270420',
    room_bed: 'Chambre 5 - Lit A',
    care_type: 'aerosol',
    care_type_label: 'Aérosolthérapie',
    title: 'Nébulisation Ventoline 5mg + Pulmicort 1mg',
    dosage: 'Ventoline 5mg + Pulmicort 1mg / 4ml',
    route: 'Inhalation sous nébuliseur',
    scheduled_hour: '14:00',
    frequency: '3x / jour',
    prescribing_doctor: 'Dr. Keita (Pneumologie)',
    instructions: 'Durée 15 min sous débit 6L/min O2. Contrôler auscultation et rythme cardiaque après.',
    status: 'pending',
    priority: 'normal'
  },
  {
    id: 'soin-005',
    patient_name: 'Ibrahima Barry',
    patient_ndm: 'NDM-00270425',
    room_bed: 'Chambre 2 - Lit A',
    care_type: 'infusion',
    care_type_label: 'Perfusion Soluté',
    title: 'Remplacement poche Sérum Glucosé 5% + KCl 2g',
    dosage: '500ml / 6h (environ 28 gttes/min)',
    route: 'Voie veineuse périphérique',
    scheduled_hour: '16:00',
    frequency: 'Continue',
    prescribing_doctor: 'Dr. Toure (Médecine Interne)',
    instructions: 'Vérifier perméabilité veineuse, absence d’œdème local.',
    status: 'pending',
    priority: 'normal'
  }
];

export const CarePlansView: React.FC<CarePlansViewProps> = ({
  partners = [],
  currentUser
}) => {
  // Load tasks from localStorage or defaults
  const [tasks, setTasks] = useState<NursingCareItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_CARE_PLANS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [executingTask, setExecutingTask] = useState<NursingCareItem | null>(null);

  // New Care Plan Form State
  const [newPatient, setNewPatient] = useState('');
  const [newPatientNdm, setNewPatientNdm] = useState('');
  const [newRoomBed, setNewRoomBed] = useState('Chambre 1');
  const [newCareType, setNewCareType] = useState<NursingCareItem['care_type']>('injection');
  const [newTitle, setNewTitle] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newRoute, setNewRoute] = useState('Intraveineuse');
  const [newHour, setNewHour] = useState('08:00');
  const [newFrequency, setNewFrequency] = useState('1x / 24h');
  const [newDoctor, setNewDoctor] = useState('Dr. Toure (Médecin Traitant)');
  const [newInstructions, setNewInstructions] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'urgent'>('normal');

  // Execution Form State
  const [execHour, setExecHour] = useState('');
  const [execNurse, setExecNurse] = useState('');
  const [execNotes, setExecNotes] = useState('');
  const [execBp, setExecBp] = useState('');
  const [execPulse, setExecPulse] = useState('');
  const [execTemp, setExecTemp] = useState('');
  const [execSpo2, setExecSpo2] = useState('');
  const [execGlycemia, setExecGlycemia] = useState('');

  // Print ref
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Filter patients list from partners
  const patientPartners = useMemo(() => {
    return partners.filter((p) => p.partner_type === 'patient' || p.customer_rank > 0);
  }, [partners]);

  // Handle opening execution modal
  const handleOpenExecution = (task: NursingCareItem) => {
    const now = new Date();
    const currentHourStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nurseName = currentUser ? (currentUser.name || currentUser.login) : 'Inf. Awa Diabaté';
    
    setExecutingTask(task);
    setExecHour(currentHourStr);
    setExecNurse(nurseName);
    setExecNotes(task.notes || 'Soin administré conformément à la prescription médicale.');
    setExecBp(task.vitals?.bp || '');
    setExecPulse(task.vitals?.pulse || '');
    setExecTemp(task.vitals?.temperature || '');
    setExecSpo2(task.vitals?.spo2 || '');
    setExecGlycemia(task.vitals?.glycemia || '');
  };

  // Submit execution
  const handleConfirmExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingTask) return;

    const updatedTasks = tasks.map((t) => {
      if (t.id === executingTask.id) {
        return {
          ...t,
          status: 'completed' as const,
          administered_at: `${new Date().toISOString().split('T')[0]} ${execHour}`,
          administered_by: execNurse || 'Infirmière en poste',
          notes: execNotes,
          vitals: {
            bp: execBp,
            pulse: execPulse,
            temperature: execTemp,
            spo2: execSpo2,
            glycemia: execGlycemia
          }
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setExecutingTask(null);
  };

  // Quick toggle status directly
  const toggleQuickStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'completed') {
          return { ...t, status: 'pending', administered_at: undefined, administered_by: undefined };
        } else {
          return {
            ...t,
            status: 'completed',
            administered_at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            administered_by: currentUser ? currentUser.name : 'Infirmière en poste'
          };
        }
      }
      return t;
    }));
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    if (confirm('Voulez-vous retirer ce soin du plan journalier ?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // Submit new care plan
  const handleCreateCarePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.trim() || !newTitle.trim()) return;

    const careTypeLabels: Record<NursingCareItem['care_type'], string> = {
      injection: 'Injection IV / IM',
      oral_med: 'Médication Orale',
      dressing: 'Pansement Stérile',
      vitals: 'Constantes Vitales',
      aerosol: 'Aérosolthérapie',
      infusion: 'Perfusion Soluté',
      comfort: 'Soins de Confort & Sondage'
    };

    const newItem: NursingCareItem = {
      id: `soin-${Date.now()}`,
      patient_name: newPatient.trim(),
      patient_ndm: newPatientNdm.trim() || undefined,
      room_bed: newRoomBed,
      care_type: newCareType,
      care_type_label: careTypeLabels[newCareType],
      title: newTitle.trim(),
      dosage: newDosage.trim() || undefined,
      route: newRoute.trim() || undefined,
      scheduled_hour: newHour,
      frequency: newFrequency,
      prescribing_doctor: newDoctor,
      instructions: newInstructions.trim() || 'Administration selon protocole hospitalier.',
      status: 'pending',
      priority: newPriority
    };

    setTasks(prev => [newItem, ...prev]);
    setShowAddModal(false);

    // Reset form
    setNewPatient('');
    setNewPatientNdm('');
    setNewTitle('');
    setNewDosage('');
    setNewInstructions('');
  };

  // Reset to initial demo data
  const handleResetDefaults = () => {
    if (confirm('Réinitialiser la liste des soins avec le modèle hospitalier standard ?')) {
      setTasks(INITIAL_CARE_PLANS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesPatient = t.patient_name.toLowerCase().includes(q);
        const matchesRoom = t.room_bed.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDoc = t.prescribing_doctor.toLowerCase().includes(q);
        if (!matchesPatient && !matchesRoom && !matchesTitle && !matchesDoc) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter === 'pending' && t.status !== 'pending') return false;
      if (statusFilter === 'completed' && t.status !== 'completed') return false;
      if (statusFilter === 'urgent' && t.priority !== 'urgent') return false;

      // 3. Shift filter
      if (shiftFilter !== 'all') {
        const hourNum = parseInt(t.scheduled_hour.split(':')[0] || '0', 10);
        if (shiftFilter === 'morning' && (hourNum < 6 || hourNum >= 14)) return false;
        if (shiftFilter === 'afternoon' && (hourNum < 14 || hourNum >= 22)) return false;
        if (shiftFilter === 'night' && (hourNum >= 6 && hourNum < 22)) return false;
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, shiftFilter]);

  // Statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Main Action Bar (Clean, Sober, Professional) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Plan de Soins & Exécution Infirmière
              </h1>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Hospitalisation & Soins
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Planification horaire, enregistrement des administrations de traitements et traçabilité soignante.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Planifier un Soin</span>
          </button>

          <button
            onClick={() => {
              if (printSheetRef.current) {
                printElement(printSheetRef.current, "Feuille_Soins_Infirmiers");
              } else {
                printDocumentById('nursing-care-printable-sheet', "Feuille_Soins_Infirmiers");
              }
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Imprimer la feuille de relève infirmière"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer Planche</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center space-x-1"
            title="Réinitialiser données d'exemple"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Structured KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500 font-medium">Soins programmés</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{completedCount} <span className="text-xs font-normal text-slate-400">({progressPercent}%)</span></div>
            <div className="text-xs text-slate-500 font-medium">Soins administrés</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs text-slate-500 font-medium">En attente / À faire</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{urgentCount}</div>
            <div className="text-xs text-slate-500 font-medium">Surveillances urgentes</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Tournée / Shift Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par patient, chambre, soin, médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Shift selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setShiftFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                shiftFilter === 'all' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous les quarts
            </button>
            <button
              onClick={() => setShiftFilter('morning')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                shiftFilter === 'morning' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matin (06h-14h)
            </button>
            <button
              onClick={() => setShiftFilter('afternoon')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                shiftFilter === 'afternoon' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Après-midi (14h-22h)
            </button>
            <button
              onClick={() => setShiftFilter('night')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                shiftFilter === 'night' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nuit (22h-06h)
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === 'pending' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              À faire ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === 'completed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Fait ({completedCount})
            </button>
            {urgentCount > 0 && (
              <button
                onClick={() => setStatusFilter('urgent')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  statusFilter === 'urgent' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Urgents ({urgentCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Interactive Care Plan List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
              <Stethoscope className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700">Aucun soin ne correspond à votre filtre</p>
            <p className="text-xs text-slate-400 mt-1">
              Modifiez vos critères de recherche ou planifiez un nouveau soin.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setShiftFilter('all'); }}
              className="mt-3 text-xs font-semibold text-slate-900 underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-4 transition hover:bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDone ? 'bg-slate-50/40' : ''
                  }`}
                >
                  {/* Left: Quick checkbox + Time + Patient + Description */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleQuickStatus(task.id)}
                      className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-300 hover:border-slate-500 text-transparent'
                      }`}
                      title={isDone ? 'Marquer comme non fait' : 'Valider rapidement'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Top line: Time badge, Room, Patient Name, Priority */}
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] border border-slate-200">
                          {task.scheduled_hour}
                        </span>

                        <span className="font-bold text-slate-900">
                          {task.patient_name}
                        </span>

                        <span className="text-slate-500 font-medium">
                          • {task.room_bed}
                        </span>

                        {task.patient_ndm && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({task.patient_ndm})
                          </span>
                        )}

                        {task.priority === 'urgent' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            Urgent
                          </span>
                        )}

                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 text-slate-700">
                          {task.care_type_label}
                        </span>
                      </div>

                      {/* Care Title & Dosage */}
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-slate-900 font-extrabold">{task.title}</span>
                        {task.dosage && (
                          <span className="text-slate-500 font-medium text-[11px]">
                            — Posologie : {task.dosage}
                          </span>
                        )}
                      </div>

                      {/* Instructions & Doctor */}
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        {task.instructions}
                        <span className="text-slate-400 ml-2">
                          (Prescrit par : {task.prescribing_doctor})
                        </span>
                      </p>

                      {/* Administration Traceability Details if completed */}
                      {isDone && (
                        <div className="mt-2 p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-600 font-medium">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Administré à <strong>{task.administered_at}</strong> par <strong>{task.administered_by}</strong></span>
                            </span>
                            {task.vitals && (task.vitals.bp || task.vitals.pulse || task.vitals.temperature || task.vitals.spo2) && (
                              <span className="text-[11px] text-slate-500">
                                Constantes : {task.vitals.bp ? `TA: ${task.vitals.bp} mmHg ` : ''}
                                {task.vitals.pulse ? `| Pouls: ${task.vitals.pulse} bpm ` : ''}
                                {task.vitals.temperature ? `| T°: ${task.vitals.temperature}°C ` : ''}
                                {task.vitals.spo2 ? `| SaO2: ${task.vitals.spo2}%` : ''}
                              </span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="text-slate-600 text-[11px] italic">
                              « {task.notes} »
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
                    {!isDone ? (
                      <button
                        onClick={() => handleOpenExecution(task)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                        <span>Administrer &amp; Tracer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenExecution(task)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Détails &amp; Constantes</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Retirer ce soin"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Printable Nursing Care Sheet (Hidden on screen, utilized for clean printout) */}
      <div className="hidden">
        <div id="nursing-care-printable-sheet" ref={printSheetRef} className="p-8 font-sans text-slate-900 space-y-6">
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Feuille d'Administration des Soins Infirmiers</h1>
              <p className="text-xs text-slate-500">Service d'Hospitalisation Médicale &amp; Chirurgicale — Registre Quotidien</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Date : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-slate-500">Édité à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                <th className="border border-slate-300 p-2">Heure</th>
                <th className="border border-slate-300 p-2">Patient &amp; Chambre</th>
                <th className="border border-slate-300 p-2">Soin &amp; Posologie</th>
                <th className="border border-slate-300 p-2">Voie</th>
                <th className="border border-slate-300 p-2">Prescripteur</th>
                <th className="border border-slate-300 p-2">Statut</th>
                <th className="border border-slate-300 p-2">Visa / Soignant</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-2 font-mono font-bold">{task.scheduled_hour}</td>
                  <td className="border border-slate-300 p-2">
                    <strong>{task.patient_name}</strong>
                    <div className="text-[10px] text-slate-500">{task.room_bed}</div>
                  </td>
                  <td className="border border-slate-300 p-2">
                    <strong>{task.title}</strong>
                    {task.dosage && <div className="text-[10px] text-slate-500">{task.dosage}</div>}
                  </td>
                  <td className="border border-slate-300 p-2">{task.route || '-'}</td>
                  <td className="border border-slate-300 p-2">{task.prescribing_doctor}</td>
                  <td className="border border-slate-300 p-2 font-bold">
                    {task.status === 'completed' ? 'ADMINISTRÉ' : 'À FAIRE'}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {task.administered_by || '____________________'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-6 flex justify-between text-xs text-slate-500">
            <div>Signature de l'Infirmière Major / Responsable de Garde : ______________________</div>
            <div>Feuille certifiée conforme au dossier de soins hospitalier</div>
          </div>
        </div>
      </div>

      {/* 6. Modal: Planifier un Nouveau Soin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">Planifier un Soin Infirmer</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCarePlan} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Patient selection / entry */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Hospitalisé *</label>
                  {patientPartners.length > 0 ? (
                    <select
                      value={newPatient}
                      onChange={(e) => {
                        setNewPatient(e.target.value);
                        const selected = patientPartners.find(p => p.name === e.target.value);
                        if (selected && selected.ndm) setNewPatientNdm(selected.ndm);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      required
                    >
                      <option value="">Sélectionner un patient...</option>
                      {patientPartners.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.ndm ? `(${p.ndm})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ex: Awa Diallo"
                      value={newPatient}
                      onChange={(e) => setNewPatient(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      required
                    />
                  )}
                </div>

                {/* Room / Bed */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chambre &amp; Lit *</label>
                  <select
                    value={newRoomBed}
                    onChange={(e) => setNewRoomBed(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="Chambre 1 - Lit A">Chambre 1 - Lit A</option>
                    <option value="Chambre 1 - Lit B">Chambre 1 - Lit B</option>
                    <option value="Chambre 2 - Lit A">Chambre 2 - Lit A</option>
                    <option value="Chambre 2 - Lit B">Chambre 2 - Lit B</option>
                    <option value="Chambre 3 - Lit A">Chambre 3 - Lit A</option>
                    <option value="Chambre 3 - Lit B">Chambre 3 - Lit B</option>
                    <option value="Chambre 4 (VIP)">Chambre 4 (VIP)</option>
                    <option value="Chambre 5 - Lit A">Chambre 5 - Lit A</option>
                    <option value="Soins Intensifs - Box 1">Soins Intensifs - Box 1</option>
                    <option value="Soins Intensifs - Box 2">Soins Intensifs - Box 2</option>
                    <option value="Urgences - Lit d'attente">Urgences - Lit d'attente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Care type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type de Soin *</label>
                  <select
                    value={newCareType}
                    onChange={(e) => setNewCareType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="injection">Injection IV / IM / SC</option>
                    <option value="oral_med">Médication Orale</option>
                    <option value="dressing">Pansement Stérile</option>
                    <option value="vitals">Constantes Vitales &amp; Monitoring</option>
                    <option value="aerosol">Aérosolthérapie / Oxygène</option>
                    <option value="infusion">Perfusion Soluté</option>
                    <option value="comfort">Soins de Confort / Sondage</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="normal">Standard (Normal)</option>
                    <option value="urgent">Urgent / Vigilance</option>
                  </select>
                </div>
              </div>

              {/* Title / Drug */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Libellé du Soin / Médicament *</label>
                <input
                  type="text"
                  placeholder="Ex : Ceftriaxone 1g, Paracétamol perfusion, Réfection pansement..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Dosage */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Posologie / Dose</label>
                  <input
                    type="text"
                    placeholder="Ex : 1g / 100ml"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>

                {/* Scheduled Hour */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heure Prévue *</label>
                  <input
                    type="time"
                    value={newHour}
                    onChange={(e) => setNewHour(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                    required
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fréquence</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="Dose unique">Dose unique</option>
                    <option value="1x / 24h">1x / 24h (Quotidien)</option>
                    <option value="2x / 24h (Matin/Soir)">2x / 24h (Matin/Soir)</option>
                    <option value="3x / 24h (8h-14h-20h)">3x / 24h (8h-14h-20h)</option>
                    <option value="Toutes les 4h">Toutes les 4 heures</option>
                    <option value="Continue">Perfusion continue</option>
                  </select>
                </div>
              </div>

              {/* Doctor & Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voie d'administration</label>
                  <input
                    type="text"
                    placeholder="Ex : IVL, IM, Per os, Inhalation"
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Médecin Prescripteur</label>
                  <input
                    type="text"
                    placeholder="Ex : Dr. Toure"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions &amp; Précautions Soignantes</label>
                <textarea
                  rows={2}
                  placeholder="Ex : Rinçage au sérum salé après injection. Vérifier l'absence d'allergie."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer"
                >
                  Enregistrer au Plan de Soins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Exécution / Administration & Traçabilité */}
      {executingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Administration &amp; Traçabilité du Soin</h3>
              </div>
              <button
                onClick={() => setExecutingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmExecution} className="p-5 space-y-4 text-xs">
              {/* Patient recap banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{executingTask.patient_name}</span>
                  <span className="text-slate-500 font-semibold">{executingTask.room_bed}</span>
                </div>
                <div className="text-slate-700 font-medium">
                  {executingTask.title} {executingTask.dosage ? `(${executingTask.dosage})` : ''}
                </div>
                <div className="text-[11px] text-slate-500">
                  Prescrit par : {executingTask.prescribing_doctor}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heure d'administration réelle *</label>
                  <input
                    type="text"
                    value={execHour}
                    onChange={(e) => setExecHour(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Soignant(e) exécutant(e) *</label>
                  <input
                    type="text"
                    value={execNurse}
                    onChange={(e) => setExecNurse(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Optional Vital Signs taken during care */}
              <div className="border-t border-slate-100 pt-3">
                <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-600" />
                  <span>Constantes Vitales Associées (Optionnel)</span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">TA (mmHg)</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={execBp}
                      onChange={(e) => setExecBp(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Pouls (bpm)</label>
                    <input
                      type="text"
                      placeholder="72"
                      value={execPulse}
                      onChange={(e) => setExecPulse(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Temp (°C)</label>
                    <input
                      type="text"
                      placeholder="37.0"
                      value={execTemp}
                      onChange={(e) => setExecTemp(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">SaO2 (%)</label>
                    <input
                      type="text"
                      placeholder="98"
                      value={execSpo2}
                      onChange={(e) => setExecSpo2(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Observations / Tolerance */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observations cliniques &amp; Tolérance du patient
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Bien toléré', 'Douleur au point de ponction', 'Patient endormi', 'Perfusion terminée sans incident'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setExecNotes(prev => prev ? `${prev} - ${chip}` : chip)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] transition cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={execNotes}
                  onChange={(e) => setExecNotes(e.target.value)}
                  placeholder="Notes infirmières..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setExecutingTask(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmer l'Administration &amp; Signer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
