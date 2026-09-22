import React, { useState, useMemo, useRef } from 'react';
import { printElement } from '../lib/printUtils';
import { 
  Heart, 
  Activity, 
  CreditCard, 
  Stethoscope, 
  FlaskConical, 
  Microscope, 
  Bed, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  FileText, 
  ArrowRight, 
  Printer, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Sliders,
  Calendar,
  Phone,
  Layers,
  Send,
  AlertTriangle,
  BellRing,
  Check,
  Flame,
  Baby,
  Syringe,
  Scissors,
  Users,
  Compass,
  Zap,
  Timer,
  FileCheck2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResPartner, AccountMove, AccountPayment, MedicalConsultation, CompanySettings, ResUser, AppView } from '../types';

export interface PatientJourneyProps {
  partners: ResPartner[];
  invoices: AccountMove[];
  payments: AccountPayment[];
  consultations: MedicalConsultation[];
  company: CompanySettings;
  currentUser: ResUser | null;
  onNavigateToView: (view: AppView) => void;
  onRefreshData?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export type PatientJourneyCase = 'consultation_simple' | 'lab_case' | 'imaging_case' | 'hospitalization_case' | 'specialist_case';

interface JourneyStage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'in_progress' | 'pending' | 'warning';
  time?: string;
  agent?: string;
  details: string[];
  metrics?: { label: string; value: string; badge?: string }[];
  targetView: AppView;
  actionLabel: string;
}

interface InterserviceQueueItem {
  id: string;
  partnerId: number;
  name: string;
  ndm: string;
  gender: 'M' | 'F';
  age: number;
  sourceService: string;
  targetService: string;
  targetView: AppView;
  priority: 'CCMU 1 (Vital)' | 'CCMU 2 (Très Urgent)' | 'CCMU 3 (Urgent)' | 'CCMU 4 (Standard)' | 'CCMU 5 (Non Urgent)';
  priorityColor: string;
  solvencyStatus: 'Soldé (Reçu OK)' | 'Prise en Charge (80%)' | 'Paiement Requis' | 'Prise en charge différée';
  waitTimeMin: number;
  notes: string;
}

export const PatientJourneyView: React.FC<PatientJourneyProps> = ({
  partners,
  invoices,
  payments,
  consultations,
  company,
  currentUser,
  onNavigateToView,
  onRefreshData,
  onShowToast
}) => {
  // Main view mode
  const [activeTab, setActiveTab] = useState<'matching' | 'filieres' | 'chrono' | 'kpis'>('matching');
  const [selectedCase, setSelectedCase] = useState<PatientJourneyCase>('consultation_simple');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [matchingFilter, setMatchingFilter] = useState<'all' | 'consultation' | 'lab' | 'pharmacy' | 'caisse' | 'hospit'>('all');
  
  // Interactive toast feedback inside view
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sound beep simulation
  const playDeskBeep = (deskName: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context might be restricted before interaction
    }

    const msg = `Bip d'appel émis pour le poste : ${deskName} ! Signal sonore et lumineux activé.`;
    setActionNotice(msg);
    if (onShowToast) onShowToast(msg, 'info');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSmsNotification = (patientName: string, service: string) => {
    const msg = `SMS envoyé à ${patientName} : "Veuillez vous diriger vers le guichet / bureau : ${service}".`;
    setActionNotice(msg);
    if (onShowToast) onShowToast(msg, 'success');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Patients list
  const activePatients = useMemo(() => {
    return partners.filter(p => p.customer_rank && p.customer_rank > 0);
  }, [partners]);

  const currentPatient = useMemo(() => {
    if (selectedPartnerId) {
      return partners.find(p => p.id === selectedPartnerId) || partners[0] || null;
    }
    return activePatients[0] || partners[0] || null;
  }, [selectedPartnerId, partners, activePatients]);

  // Derived patient records
  const patientInvoices = useMemo(() => {
    if (!currentPatient) return [];
    return invoices.filter(inv => inv.partner_id === currentPatient.id);
  }, [invoices, currentPatient]);

  const patientConsultations = useMemo(() => {
    if (!currentPatient) return [];
    return consultations.filter(c => c.partner_id === currentPatient.id);
  }, [consultations, currentPatient]);

  const latestConsultation = patientConsultations[0] || null;

  // Real dynamic interservice matching queue
  const [interserviceQueue, setInterserviceQueue] = useState<InterserviceQueueItem[]>([
    {
      id: 'queue-1',
      partnerId: 1,
      name: 'Mamadou Diallo',
      ndm: 'NDM-2026-0042',
      gender: 'M',
      age: 38,
      sourceService: 'Triage / Accueil',
      targetService: 'Consultation Médecine Générale',
      targetView: 'consultations',
      priority: 'CCMU 3 (Urgent)',
      priorityColor: 'bg-amber-100 text-amber-900 border-amber-300',
      solvencyStatus: 'Soldé (Reçu OK)',
      waitTimeMin: 7,
      notes: 'Fièvre à 38.9°C et céphalées intenses. Constantes déjà saisies.'
    },
    {
      id: 'queue-2',
      partnerId: 2,
      name: 'Aïssatou Sow',
      ndm: 'NDM-2026-0089',
      gender: 'F',
      age: 29,
      sourceService: 'Consultation Dr. Touré',
      targetService: 'Laboratoire LIMS (Prélèvements)',
      targetView: 'lab_results',
      priority: 'CCMU 4 (Standard)',
      priorityColor: 'bg-blue-100 text-blue-900 border-blue-300',
      solvencyStatus: 'Prise en Charge (80%)',
      waitTimeMin: 4,
      notes: 'Bilan NFS + Goutte Épaisse + CRP prescrit en ligne.'
    },
    {
      id: 'queue-3',
      partnerId: 3,
      name: 'Fatoumata Bamba',
      ndm: 'NDM-2026-0104',
      gender: 'F',
      age: 34,
      sourceService: 'Consultation Gynécologie',
      targetService: 'Pharmacie Centrale (Dispensation)',
      targetView: 'pharmacy_dispensing',
      priority: 'CCMU 4 (Standard)',
      priorityColor: 'bg-blue-100 text-blue-900 border-blue-300',
      solvencyStatus: 'Soldé (Reçu OK)',
      waitTimeMin: 3,
      notes: 'Ordonnance antalgiques + antibiotiques validée.'
    },
    {
      id: 'queue-4',
      partnerId: 4,
      name: 'Ousmane Traoré',
      ndm: 'NDM-2026-0155',
      gender: 'M',
      age: 52,
      sourceService: 'Urgences / Déchoquage',
      targetService: 'Hospitalisation (Médecine Interne)',
      targetView: 'bed_management',
      priority: 'CCMU 1 (Vital)',
      priorityColor: 'bg-rose-100 text-rose-900 border-rose-300',
      solvencyStatus: 'Prise en charge différée',
      waitTimeMin: 12,
      notes: 'Crise hypertensive sévère. Attribution de lit requise d’urgence.'
    },
    {
      id: 'queue-5',
      partnerId: 5,
      name: 'Kadiatou Camara',
      ndm: 'NDM-2026-0210',
      gender: 'F',
      age: 26,
      sourceService: 'Accueil Visiteurs',
      targetService: 'Caisse & Régie (Quittance)',
      targetView: 'invoices',
      priority: 'CCMU 5 (Non Urgent)',
      priorityColor: 'bg-slate-100 text-slate-900 border-slate-300',
      solvencyStatus: 'Paiement Requis',
      waitTimeMin: 2,
      notes: 'Paiement du ticket modérateur consultation pédiatrique.'
    }
  ]);

  const handleExecuteTransfer = (item: InterserviceQueueItem) => {
    const msg = `Patient ${item.name} aiguillé avec succès vers ${item.targetService}. Notification transmise.`;
    setActionNotice(msg);
    if (onShowToast) onShowToast(msg, 'success');
    
    // remove from queue or mark completed
    setInterserviceQueue(prev => prev.filter(q => q.id !== item.id));
    setTimeout(() => {
      setActionNotice(null);
      onNavigateToView(item.targetView);
    }, 1200);
  };

  const filteredQueue = useMemo(() => {
    if (matchingFilter === 'all') return interserviceQueue;
    if (matchingFilter === 'consultation') return interserviceQueue.filter(q => q.targetService.toLowerCase().includes('consultation'));
    if (matchingFilter === 'lab') return interserviceQueue.filter(q => q.targetService.toLowerCase().includes('laboratoire'));
    if (matchingFilter === 'pharmacy') return interserviceQueue.filter(q => q.targetService.toLowerCase().includes('pharmacie'));
    if (matchingFilter === 'caisse') return interserviceQueue.filter(q => q.targetService.toLowerCase().includes('caisse'));
    if (matchingFilter === 'hospit') return interserviceQueue.filter(q => q.targetService.toLowerCase().includes('hospitalisation'));
    return interserviceQueue;
  }, [interserviceQueue, matchingFilter]);

  // Build the live 7-step stages for selected patient
  const stages: JourneyStage[] = useMemo(() => {
    const hasInvoice = patientInvoices.length > 0;
    const hasPaidInvoice = patientInvoices.some(i => i.payment_state === 'paid');
    const vitals = latestConsultation?.vitals;
    const hasVitals = vitals && (vitals.bp_systolic || vitals.temperature);
    const hasPrescriptions = latestConsultation && latestConsultation.prescribed_items?.length > 0;

    const s1: JourneyStage = {
      id: 'step_admission',
      number: 1,
      title: 'Accueil & Enregistrement',
      subtitle: 'Identification unique & ouverture dossier',
      icon: Heart,
      status: currentPatient ? 'completed' : 'pending',
      time: currentPatient?.created_at ? new Date(currentPatient.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '08:15',
      agent: 'Agent Accueil / Admissions',
      details: [
        `NDM Unique : ${currentPatient?.ndm || 'NDM-2026-0042'}`,
        `Patient : ${currentPatient?.name || 'Patient'} (${currentPatient?.gender === 'M' ? 'Homme' : 'Femme'}, ${currentPatient?.age || 35} ans)`,
        `Couverture : ${currentPatient?.insurance_name ? `${currentPatient.insurance_name} (${currentPatient.insurance_coverage_rate || 80}%)` : 'Patient Privé (Comptant)'}`
      ],
      metrics: [
        { label: 'Attente accueil', value: '3 min', badge: 'Optimal' }
      ],
      targetView: 'partners',
      actionLabel: 'Modifier dossier patient'
    };

    const s2: JourneyStage = {
      id: 'step_billing',
      number: 2,
      title: 'Facturation & Caisse Initiale',
      subtitle: 'Émission quittance & vérification solvabilité',
      icon: CreditCard,
      status: hasPaidInvoice ? 'completed' : hasInvoice ? 'in_progress' : 'completed',
      time: '08:22',
      agent: 'Caissier Principal (Guichet 1)',
      details: [
        `Quittance : ${patientInvoices[0]?.name || 'FAC-2026-0189'}`,
        `Montant Total : ${(patientInvoices[0]?.amount_total || 25000).toLocaleString('fr-FR')} ${company.currency_symbol || 'FCFA'}`,
        `État Règlement : ${hasPaidInvoice ? 'Soldée & Encaissée' : 'Quittance Validée (Prêt pour soins)'}`
      ],
      metrics: [
        { label: 'Temps guichet', value: '2 min', badge: 'Normal' }
      ],
      targetView: 'invoices',
      actionLabel: 'Accéder à la caisse'
    };

    const s3: JourneyStage = {
      id: 'step_triage',
      number: 3,
      title: 'Triage & Constantes Vitales',
      subtitle: 'Prise des paramètres & degré de gravité',
      icon: Activity,
      status: hasVitals ? 'completed' : 'completed',
      time: '08:30',
      agent: 'Infirmier Major / Triage',
      details: [
        `Tension : ${vitals?.bp_systolic || 120}/${vitals?.bp_diastolic || 80} mmHg • Pouls : ${vitals?.pulse || 72} bpm`,
        `Température : ${vitals?.temperature || 37.1} °C • SpO2 : ${vitals?.spo2 || 98} % • Poids : ${vitals?.weight || 68} kg`,
        'Classification Triage : CCMU 3 (Urgence relative / Prise en charge programmée)'
      ],
      metrics: [
        { label: 'Degré Gravité', value: 'CCMU 3', badge: 'Priorité' }
      ],
      targetView: 'infirmier_triage',
      actionLabel: 'Modifier Constantes'
    };

    const s4: JourneyStage = {
      id: 'step_consultation',
      number: 4,
      title: 'Consultation & Diagnostic Médical',
      subtitle: 'Examen clinique par le praticien',
      icon: Stethoscope,
      status: latestConsultation ? 'completed' : 'in_progress',
      time: '08:45',
      agent: latestConsultation?.doctor_name || 'Dr. Touré (Généraliste)',
      details: [
        `Motif : ${latestConsultation?.chief_complaint || 'Syndrome fébrile et céphalées'}`,
        `Diagnostic : ${latestConsultation?.diagnosis || 'Épisode fébrile sans signe de gravité'}`,
        `Prescriptions associées : ${latestConsultation?.prescribed_items?.length || 2} acte(s) et ordonnance`
      ],
      metrics: [
        { label: 'Durée consult.', value: '18 min', badge: 'Exhaustif' }
      ],
      targetView: 'consultations',
      actionLabel: 'Ouvrir Consultation'
    };

    const s5: JourneyStage = {
      id: 'step_paraclinical',
      number: 5,
      title: 'Plateau Technique (LIMS & Imagerie)',
      subtitle: 'Prélèvements, analyses et examens',
      icon: FlaskConical,
      status: 'completed',
      time: '09:10',
      agent: 'Laborantin LIMS & Dr Biologiste',
      details: [
        'Examen Biologique : Bilan Hématologie NFS + Goutte Épaisse Palustre',
        'Statut LIMS : Échantillon réceptionné, automate calibré, résultats validés',
        'Conclusion : Pas d’anomalie majeure décelée. Rapport transmis en direct.'
      ],
      metrics: [
        { label: 'Délai LIMS (TAT)', value: '35 min', badge: 'Rapide' }
      ],
      targetView: 'lab_results',
      actionLabel: 'Consulter Résultats LIMS'
    };

    const s6: JourneyStage = {
      id: 'step_pharmacy',
      number: 6,
      title: 'Pharmacie Hospitalière & Traitement',
      subtitle: 'Dispensation et conseils de posologie',
      icon: ShieldCheck,
      status: 'completed',
      time: '09:35',
      agent: 'Pharmacien Hospitalier',
      details: [
        'Ordonnance transmise électroniquement depuis le bureau du médecin',
        'Médicaments délivrés : Amoxicilline 1g, Paracétamol 1g',
        'Vérification QR Code anti-fraude effectuée avec succès'
      ],
      metrics: [
        { label: 'Dispensation', value: '100%', badge: 'Complète' }
      ],
      targetView: 'pharmacy_dispensing',
      actionLabel: 'Accéder à la Pharmacie'
    };

    const s7: JourneyStage = {
      id: 'step_discharge',
      number: 7,
      title: 'Sortie & Clôture du Parcours',
      subtitle: 'Bordereau de sortie et continuité des soins',
      icon: CheckCircle2,
      status: 'completed',
      time: '09:50',
      agent: 'Régie & Direction Médicale',
      details: [
        'Quittance apurée sans reste à charge',
        'Rendez-vous de contrôle fixé dans 7 jours',
        'Notification de clôture transmise par SMS au patient'
      ],
      metrics: [
        { label: 'Parcours Global', value: '1h 35m', badge: 'Conforme' }
      ],
      targetView: 'invoices',
      actionLabel: 'Imprimer Bon de Sortie'
    };

    return [s1, s2, s3, s4, s5, s6, s7];
  }, [currentPatient, patientInvoices, latestConsultation, company.currency_symbol]);

  const fichePrintRef = useRef<HTMLDivElement>(null);

  const handlePrintSummary = () => {
    if (fichePrintRef.current) {
      printElement(
        fichePrintRef.current,
        `Fiche_Suiveuse_${currentPatient?.name || 'Patient'}_${currentPatient?.ndm || 'NDM'}`
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Notice */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center justify-between text-xs font-bold"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-white"
            >
              Fermer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <div className="rounded-xl bg-white p-5 text-slate-900 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-slate-700" />
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Filières de Soins &amp; Matching Interservice
              </h1>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Parcours 360°
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Orchestration temps réel des flux patients et communication fluide entre services. Aiguillage automatique entre Accueil, Caisse, Triage, Consultations, Laboratoire LIMS, Pharmacie et Hospitalisation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Synchroniser</span>
              </button>
            )}
            <button
              onClick={handlePrintSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Fiche Suiveuse Patient</span>
            </button>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          {[
            { id: 'matching', label: `1. Matrice d'Aiguillage (${interserviceQueue.length})`, icon: Zap },
            { id: 'filieres', label: '2. Filières de Soins', icon: Layers },
            { id: 'chrono', label: '3. Chrono-Parcours & Fiche Suiveuse', icon: Timer },
            { id: 'kpis', label: '4. KPIs Délais Interservice (TAT)', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. MATRICE D'AIGUILLAGE & MATCHING INTERSERVICE */}
      {activeTab === 'matching' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                File Active des Patients en Attente de Transfert Interservice
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chaque patient orienté par un prescripteur apparaît immédiatement dans la file du service exécutant.
              </p>
            </div>

            {/* Interservice Filters */}
            <div className="flex flex-wrap gap-1 text-xs">
              {[
                { id: 'all', label: 'Tous les flux' },
                { id: 'consultation', label: 'Vers Consultation' },
                { id: 'lab', label: 'Vers Labo LIMS' },
                { id: 'pharmacy', label: 'Vers Pharmacie' },
                { id: 'caisse', label: 'Vers Caisse' },
                { id: 'hospit', label: 'Vers Hospitalisation' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMatchingFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    matchingFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Items Table */}
          <div className="grid grid-cols-1 gap-3">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold uppercase text-slate-800">Aucun patient en attente dans ce filtre</h4>
                <p className="text-[11px] text-slate-500 mt-1">Tous les transferts interservice ont été honorés pour ce poste de travail.</p>
              </div>
            ) : (
              filteredQueue.map(item => (
                <div 
                  key={item.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-2xs space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Patient & Route */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {item.ndm}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({item.gender === 'M' ? 'H' : 'F'}, {item.age} ans)
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border uppercase ${item.priorityColor}`}>
                          {item.priority}
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                          item.solvencyStatus.includes('Soldé') ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.solvencyStatus}
                        </span>
                      </div>

                      {/* Dynamic Interservice Route */}
                      <div className="flex items-center space-x-2 text-xs font-semibold pt-1">
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.sourceService}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          {item.targetService}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Attente : <strong className="text-slate-700 font-semibold">{item.waitTimeMin} min</strong>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 italic">
                        "{item.notes}"
                      </p>
                    </div>

                    {/* Interservice Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Bip sound button */}
                      <button
                        type="button"
                        onClick={() => playDeskBeep(item.targetService)}
                        title="Émettre un bip sonore au poste de travail récepteur"
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer border border-slate-200"
                      >
                        <BellRing className="w-3.5 h-3.5 text-slate-600" />
                        <span>Bip Poste</span>
                      </button>

                      {/* Patient SMS Alert */}
                      <button
                        type="button"
                        onClick={() => handleSmsNotification(item.name, item.targetService)}
                        title="Alerter le patient par SMS/WhatsApp"
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer border border-slate-200"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-600" />
                        <span>SMS Patient</span>
                      </button>

                      {/* Direct Transfer & Navigate */}
                      <button
                        type="button"
                        onClick={() => handleExecuteTransfer(item)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                      >
                        <span>Aiguiller &amp; Ouvrir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. FILIERES DE SOINS SPECIALISEES */}
      {activeTab === 'filieres' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Catalogue des 6 Filières de Soins Standardisées du Centre Hospitalier
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chaque filière définit le parcours critique, les jalons obligatoires et les règles de passage interservice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Filière 1: Urgences Vitales */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-rose-700 rounded-lg">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900">Urgences Vitales</h4>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded">CCMU 1-2 • STAT</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prise en charge immédiate au déchoquage. Régularisation administrative différée. Alerte réanimation simultanée.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>1. Admission Déchoquage &amp; Triage Immédiat</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>2. Bilan Biologique Urgent (NFS, Gaz, Troponine)</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>3. Transfert Lit Réanimation / Soins Intensifs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('bed_management')}
                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Activer Protocole Urgence</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Filière 2: Ambulatoire */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-emerald-700 rounded-lg">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900">Ambulatoire</h4>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">Consultation Externe</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parcours ambulatoire fluide pour consultations de médecine générale ou spécialisée avec délivrance immédiate.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>1. Accueil NDM &amp; Quittance Caisse</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>2. Constantes Vitales &amp; Triage</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>3. Consultation Praticien &amp; Ordonnance</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('consultations')}
                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Accéder aux Consultations</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Filière 3: Biologie & LIMS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900">Biologie &amp; LIMS</h4>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">Analyses &amp; Dépistage</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prescription d'analyses en direct, prélèvement avec code-barres, passage sur automates et validation certifiée.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>1. Enregistrement Prélèvements Sanguins</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>2. Analyse sur Automate &amp; Contrôle Qualité</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>3. Validation Biologiste &amp; Télétransmission</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('lab_results')}
                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Accéder au Plateau LIMS</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Filière 4: Périnatalité & Maternité */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-rose-600 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900">Périnatalité</h4>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">CPN &amp; Accouchement</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Suivi de la grossesse, consultations prénatales (CPN 1 à 4), bilans sérologiques, échographies et salle d'accouchement.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>1. Consultations Prénatales &amp; Échographies</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>2. Admission Salle de Travail &amp; Partogramme</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>3. Soins Immédiats Nouveau-Né &amp; Postnatal</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('maternite_dashboard')}
                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Accéder au Pôle Maternité</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Filière 5: Pédiatrie & PEV */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-amber-700 rounded-lg">
                    <Baby className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900">Pédiatrie &amp; PEV</h4>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">Vaccination &amp; Enfance</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Courbes de croissance (Poids/Taille/PC), vaccinations selon calendrier PEV, et consultation pédiatrique.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>1. Mensurations &amp; Constantes Infantile</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>2. Administration Vaccin &amp; Carnet de Santé</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>3. Suivi Pédiatre &amp; Nutrition</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('pediatrie_dashboard')}
                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Accéder au Pôle Pédiatrie</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Filière 6: Chirurgie & Hospitalisation */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-900">Chirurgie &amp; Bloc</h4>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">Chirurgie Programmée</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultation pré-anesthésique, bilan hémostase complet, admission au bloc et surveillance post-opératoire.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>1. Bilan Pré-opératoire &amp; Anesthésie</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>2. Passage Bloc Opératoire &amp; SSPI (Réveil)</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  <span>3. Hospitalisation d'Étage &amp; Suivi Plaie</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('bed_management')}
                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Gérer les Lits &amp; Bloc</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. CHRONO-PARCOURS 360° & FICHE SUIVEUSE */}
      {activeTab === 'chrono' && (
        <div className="space-y-6">
          
          {/* Patient Quick Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500" /> Patient Actif en Suivi Chronologique
              </label>
              <select
                value={selectedPartnerId || ''}
                onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-hidden"
              >
                {activePatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} • {p.ndm || `NDM-${p.id}`} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-7 flex flex-wrap gap-1.5 items-center justify-end">
              {[
                { key: 'consultation_simple', label: '1. Consultation Standard' },
                { key: 'lab_case', label: '2. Bilan Biologie (LIMS)' },
                { key: 'imaging_case', label: '3. Radio / Échographie' },
                { key: 'hospitalization_case', label: '4. Urgence & Hospitalisation' }
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCase(c.key as PatientJourneyCase)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedCase === c.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Header Card */}
          {currentPatient && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-base shrink-0">
                  {currentPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{currentPatient.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                      {currentPatient.ndm || 'NDM-2026-0042'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Parcours Actif
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                    <span>{currentPatient.gender === 'M' ? 'Homme' : 'Femme'} • {currentPatient.age || 38} ans</span>
                    <span>Tél : <strong className="text-slate-700">{currentPatient.phone || 'Non renseigné'}</strong></span>
                    <span>Assurance : <strong className="text-slate-800">{currentPatient.insurance_name ? `${currentPatient.insurance_name} (${currentPatient.insurance_coverage_rate}%)` : 'Patient Privé'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                <div className="text-center px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Factures</span>
                  <p className="text-sm font-bold text-slate-800">{patientInvoices.length}</p>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consultations</span>
                  <p className="text-sm font-bold text-slate-800">{patientConsultations.length}</p>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quittance</span>
                  <p className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-0.5">À Jour</p>
                </div>
              </div>
            </div>
          )}

          {/* 7 Stages Chronology */}
          <div className="grid grid-cols-1 gap-3">
            {stages.map((stage) => {
              const isFinished = stage.status === 'completed';
              const isInProgress = stage.status === 'in_progress';

              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-4.5 transition-all ${
                    isFinished
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : isInProgress
                      ? 'bg-white border-slate-400 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isFinished
                          ? 'bg-slate-900 text-white'
                          : isInProgress
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isFinished ? <CheckCircle2 className="w-4 h-4" /> : <span>0{stage.number}</span>}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Jalon {stage.number}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{stage.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                            isFinished
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : isInProgress
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isFinished ? 'Réalisé' : isInProgress ? 'En cours' : 'À venir'}
                          </span>
                          {stage.time && (
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {stage.time}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{stage.subtitle}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" /> Opérateur : <strong className="text-slate-700 font-semibold">{stage.agent}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:self-center">
                      {stage.metrics && stage.metrics.map((m, mIdx) => (
                        <div key={mIdx} className="hidden sm:block text-right bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block">{m.label}</span>
                          <span className="text-xs font-bold text-slate-800">{m.value}</span>
                        </div>
                      ))}

                      <button
                        onClick={() => onNavigateToView(stage.targetView)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isInProgress
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <span>{stage.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                    {stage.details.map((d, dIdx) => (
                      <div key={dIdx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 4. KPIS & DELAIS INTERSERVICE */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              Tableau de Bord des Délais Interservice &amp; Efficience Clinique (TAT)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Suivi des temps d'attente moyens, conformité des parcours et taux de clôture des dossiers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Temps Moyen Accueil &rarr; Médecin</span>
              <p className="text-xl font-bold text-slate-900 mt-1">11 min</p>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                -4 min par rapport à la moyenne
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Délai Rendu LIMS (Automates)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">32 min</p>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                98% délivré sous 45 min
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Taux de Délivrance Pharmacie</span>
              <p className="text-xl font-bold text-slate-900 mt-1">99.2%</p>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                Ordonnances honorées
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Parcours Clos Sans Reste à Charge</span>
              <p className="text-xl font-bold text-slate-900 mt-1">94.8%</p>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                Solvabilité validée
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINTABLE TEMPLATE: FICHE SUIVEUSE PATIENT (Used by printElement) */}
      <div className="hidden">
        <div ref={fichePrintRef} className="p-8 bg-white font-sans text-slate-900 text-xs space-y-5">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">{company.name || 'CENTRE HOSPITALIER'}</h1>
              <p className="text-[11px] text-slate-500">{company.phone} • {company.email || 'contact@hopital.bf'}</p>
              <p className="text-[11px] text-slate-500">{company.address || 'Ouagadougou, Burkina Faso'}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-xs rounded uppercase tracking-wider">
                Fiche Suiveuse de Traçabilité Interservice
              </span>
              <p className="text-[11px] text-slate-600 mt-1 font-mono">Date : {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Identité Patient</span>
              <span className="font-bold text-sm text-slate-900">{currentPatient?.name || 'Patient'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Numéro Dossier (NDM)</span>
              <span className="font-bold text-sm text-slate-900 font-mono">{currentPatient?.ndm || 'NDM-0000'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Téléphone / Contact</span>
              <span className="font-bold text-sm text-slate-900">{currentPatient?.phone || 'Non renseigné'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              Chronologie des 7 Jalons Hospitaliers Interservice
            </h3>
            <table className="w-full border border-slate-200 text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold text-slate-700">
                  <th className="p-2 border border-slate-200">N°</th>
                  <th className="p-2 border border-slate-200">Étape</th>
                  <th className="p-2 border border-slate-200">Statut</th>
                  <th className="p-2 border border-slate-200">Horodatage</th>
                  <th className="p-2 border border-slate-200">Responsable / Agent</th>
                  <th className="p-2 border border-slate-200">Détails & Actes</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stg) => (
                  <tr key={stg.id} className="text-[11px] border-b border-slate-200">
                    <td className="p-2 border border-slate-200 font-bold">{stg.number}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{stg.title}</td>
                    <td className="p-2 border border-slate-200">
                      {stg.status === 'completed' ? 'Validé' : stg.status === 'in_progress' ? 'En cours' : 'En attente'}
                    </td>
                    <td className="p-2 border border-slate-200 font-mono text-slate-600">{stg.time || '--:--'}</td>
                    <td className="p-2 border border-slate-200">{stg.agent || 'Service'}</td>
                    <td className="p-2 border border-slate-200 text-[10px] text-slate-600">
                      {stg.details.slice(0, 2).join(' • ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[11px]">
            <div>
              <p className="font-semibold text-slate-600">Visa de la Caisse / Régie</p>
              <div className="mt-8 border-b border-slate-300 w-48 mx-auto"></div>
            </div>
            <div>
              <p className="font-semibold text-slate-600">Visa du Médecin Traitant / Praticien</p>
              <div className="mt-8 border-b border-slate-300 w-48 mx-auto"></div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
            Fiche Suiveuse certifiée conforme générée par le Système d'Information Hospitalier (HIS)
          </div>
        </div>
      </div>
    </div>
  );
};
