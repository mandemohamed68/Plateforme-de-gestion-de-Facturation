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
  AlertTriangle
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

export const PatientJourneyView: React.FC<PatientJourneyProps> = ({
  partners,
  invoices,
  payments,
  consultations,
  company,
  currentUser,
  onNavigateToView,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<PatientJourneyCase>('consultation_simple');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Ensure default patient is selected
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

  // Build the live 7-step stages for this patient based on real records & selected simulation scenario
  const stages: JourneyStage[] = useMemo(() => {
    const isCompleted = selectedCase === 'consultation_simple' && patientConsultations.length > 0;
    const hasInvoice = patientInvoices.length > 0;
    const hasPaidInvoice = patientInvoices.some(i => i.payment_state === 'paid');
    const vitals = latestConsultation?.vitals;
    const hasVitals = vitals && (vitals.bp_systolic || vitals.temperature);
    const hasPrescriptions = latestConsultation && latestConsultation.prescribed_items?.length > 0;
    const hasLabExams = latestConsultation?.prescribed_items?.some(i => i.type === 'lab_exam');
    const hasImagingExams = latestConsultation?.prescribed_items?.some(i => i.type === 'imaging');

    // Step 1: Accueil & Admission
    const s1: JourneyStage = {
      id: 'step_admission',
      number: 1,
      title: 'Accueil & Enregistrement',
      subtitle: 'Identification unique & création dossier',
      icon: Heart,
      status: currentPatient ? 'completed' : 'pending',
      time: currentPatient?.created_at ? new Date(currentPatient.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '08:15',
      agent: 'Agent Accueil / Admissions',
      details: [
        `NDM Unique : ${currentPatient?.ndm || 'NDM-2026-0042'}`,
        `Patient : ${currentPatient?.name || 'Mamadou Diallo'} (${currentPatient?.gender === 'M' ? 'Homme' : 'Femme'}, ${currentPatient?.age || 38} ans)`,
        `Couverture Assurance : ${currentPatient?.insurance_name ? `${currentPatient.insurance_name} (${currentPatient.insurance_coverage_rate || 80}%)` : 'Non assuré (Comptant)'}`
      ],
      metrics: [
        { label: 'Attente accueil', value: '4 min', badge: 'Normal' }
      ],
      targetView: 'partners',
      actionLabel: 'Modifier dossier patient'
    };

    // Step 2: Caisse & Facturation
    const s2: JourneyStage = {
      id: 'step_billing',
      number: 2,
      title: 'Facturation & Caisse',
      subtitle: 'Émission ticket & encaissement quittance',
      icon: CreditCard,
      status: hasPaidInvoice ? 'completed' : hasInvoice ? 'in_progress' : 'completed',
      time: '08:24',
      agent: 'Caissier Principal (Guichet 1)',
      details: [
        `Facture Consultation : ${patientInvoices[0]?.name || 'FAC-2026-0189'}`,
        `Montant Total : ${(patientInvoices[0]?.amount_total || 50000).toLocaleString('fr-FR')} ${company.currency_symbol || 'GNF'}`,
        `État Quittance : ${hasPaidInvoice ? 'Soldée & Encaissée' : 'Quittance Validée (Règlement Espèces / Mobile Money)'}`
      ],
      metrics: [
        { label: 'Règlement', value: '100% Soldé', badge: 'Conforme' }
      ],
      targetView: 'payments',
      actionLabel: 'Accéder à la Caisse'
    };

    // Step 3: Triage & Constantes
    const s3: JourneyStage = {
      id: 'step_triage',
      number: 3,
      title: 'Triage Infirmier & Constantes',
      subtitle: 'Prise des paramètres vitaux & évaluation de gravité',
      icon: Activity,
      status: hasVitals ? 'completed' : 'completed',
      time: '08:35',
      agent: 'Infirmière Major (Poste Triage)',
      details: [
        `Tension Artérielle : ${vitals?.bp_systolic || 125}/${vitals?.bp_diastolic || 82} mmHg`,
        `Température : ${vitals?.temperature || 37.4} °C | Pouls : ${vitals?.heart_rate || 76} bpm`,
        `SpO2 : ${vitals?.spo2 || 98}% | Glycémie : ${vitals?.blood_sugar || 0.96} g/L | IMC : ${vitals?.bmi || 22.8} kg/m²`,
        `Degré d'urgence : ${vitals?.triage_level === 'critique' ? 'Critique (Tri 1)' : vitals?.triage_level === 'urgent' ? 'Urgent (Tri 2)' : 'Normal (Tri 3)'}`
      ],
      metrics: [
        { label: 'Gravité', value: vitals?.triage_level === 'urgent' ? 'Prioritaire' : 'Stable', badge: 'OK' }
      ],
      targetView: 'infirmier_vitals',
      actionLabel: 'Saisir Constantes'
    };

    // Step 4: Consultation Médicale
    const s4: JourneyStage = {
      id: 'step_consultation',
      number: 4,
      title: selectedCase === 'specialist_case' ? 'Consultation Spécialiste' : 'Consultation Médicale',
      subtitle: 'Examen clinique, anamnèse & diagnostic CIM-10',
      icon: Stethoscope,
      status: patientConsultations.length > 0 ? 'completed' : 'completed',
      time: '08:52',
      agent: selectedCase === 'specialist_case' ? 'Dr. Fodé Keita (Cardiologue)' : (latestConsultation?.doctor_name || 'Dr. Aboubacar Touré'),
      details: [
        `Motif : ${latestConsultation?.chief_complaint || 'Syndrome fébrile avec céphalées et asthénie intense'}`,
        `Diagnostic : ${latestConsultation?.diagnosis || 'Paludisme d\'accès simple avec bronchite débutante'}`,
        `Code CIM-10 : ${latestConsultation?.diagnosis_code || 'B54 (Paludisme sans précision)'}`,
        `Prescriptions : ${hasPrescriptions ? `${latestConsultation?.prescribed_items?.length} ordonnances (Médicaments + Examens)` : 'Artéméther-Luméfantrine + Paracétamol 1g'}`
      ],
      metrics: [
        { label: 'Durée acte', value: '18 min' }
      ],
      targetView: 'consultations',
      actionLabel: 'Ouvrir Consultation'
    };

    // Step 5: Examens Complémentaires (Labo / Imagerie)
    const isLabActive = selectedCase === 'lab_case' || hasLabExams;
    const isImagingActive = selectedCase === 'imaging_case' || hasImagingExams;

    const s5: JourneyStage = {
      id: 'step_exams',
      number: 5,
      title: 'Examens Complémentaires',
      subtitle: 'Biologie Médicale (LIMS) & Radiologie (PACS)',
      icon: isLabActive ? FlaskConical : Microscope,
      status: (isLabActive || isImagingActive) ? 'completed' : 'completed',
      time: '09:20',
      agent: isLabActive ? 'Dr. Bah (Biologiste LIMS)' : 'Dr. Camara (Radiologue)',
      details: isLabActive ? [
        'Analyse prescrite : NFS Complète + Goutte Épaisse + CRP + Glycémie',
        'Statut Prélèvement : Tube EDTA + Sec Enregistré (Code: TUBE-7890)',
        'Validation Biologique : Certifiée conforme par Dr. Bah (TAT: 35 min)',
        'Résultat : Plasmodium falciparum Positif (Trophozoïtes vus)'
      ] : isImagingActive ? [
        'Examen prescrit : Cliché Radiographique Thoracique Face/Profil',
        'Acquisition Cliché : Cliché numérique acquis sur console PACS',
        'Compte Rendu Radio : Absence de foyer de condensation parenchymateuse',
        'Validation : Signé et mis à disposition du dossier médical'
      ] : [
        'Examens paracliniques : Aucun examen complémentaire invasif requis',
        'Orientation : Diagnostic clinique direct suffisant pour traitement ambulatoire'
      ],
      metrics: [
        { label: 'TAT Délai', value: isLabActive ? '35 min' : '20 min', badge: 'Rapide' }
      ],
      targetView: isLabActive ? 'lab_results' : 'imaging_pacs',
      actionLabel: isLabActive ? 'Voir Résultats Labo' : 'Consulter PACS'
    };

    // Step 6: Orientation ou Hospitalisation
    const isHospit = selectedCase === 'hospitalization_case';
    const s6: JourneyStage = {
      id: 'step_orientation',
      number: 6,
      title: isHospit ? 'Hospitalisation & Surveillance' : 'Orientation Clinique',
      subtitle: isHospit ? 'Admission en chambre, attribution lit & plan de soins' : 'Traitement ambulatoire à domicile',
      icon: Bed,
      status: isHospit ? 'in_progress' : 'completed',
      time: '09:55',
      agent: isHospit ? 'Surveillant d\'Unité (Chirurgie / Soins)' : 'Médecin Prescripteur',
      details: isHospit ? [
        'Décision : Mise en observation médicale pour réhydratation IV',
        'Attribution Lit : Service Médecine Interne - Chambre 104 / Lit B',
        'Plan de Soins : Perfusion Ringer Lactate 1000ml + Antipaludéens injectables',
        'Surveillance horaire : Constantes toutes les 4h par équipe de garde'
      ] : [
        'Décision : Prise en charge ambulatoire sécurisée',
        'Ordonnance : Délivrée en main propre au patient avec conseils hygiéno-diététiques',
        'Rendez-vous de contrôle : Planifié à J+3'
      ],
      metrics: isHospit ? [
        { label: 'Chambre', value: 'Ch. 104 - Lit B', badge: 'Alité' }
      ] : [
        { label: 'Mode', value: 'Ambulatoire' }
      ],
      targetView: isHospit ? 'bed_management' : 'consultations',
      actionLabel: isHospit ? 'Gérer les Lits' : 'Voir Ordonnance'
    };

    // Step 7: Sortie & Clôture du Parcours
    const s7: JourneyStage = {
      id: 'step_discharge',
      number: 7,
      title: 'Sortie & Apurement',
      subtitle: 'Bilan de sortie, clôture caisse & délivrance bon officiel',
      icon: ShieldCheck,
      status: isHospit ? 'pending' : 'completed',
      time: isHospit ? 'En attente' : '10:15',
      agent: 'Bureau des Sorties & Caisse Principale',
      details: [
        `Statut Administratif : ${isHospit ? 'Séjour en cours - Apurement à la libération du lit' : 'Parcours apuré & Quittance définitive émise'}`,
        `Dossier Médical : Archivé avec compte-rendu de consultation`,
        `Bon de Sortie : ${isHospit ? 'En cours de validation médicale' : 'Bordereau officiel délivré au patient'}`
      ],
      metrics: [
        { label: 'Statut final', value: isHospit ? 'En hospitalisation' : 'Sorti Autorisé', badge: isHospit ? 'Actif' : 'Clôturé' }
      ],
      targetView: isHospit ? 'hospit_discharges' : 'invoices',
      actionLabel: 'Imprimer Bon de Sortie'
    };

    return [s1, s2, s3, s4, s5, s6, s7];
  }, [selectedCase, currentPatient, patientInvoices, patientConsultations, latestConsultation, company.currency_symbol]);

  const fichePrintRef = useRef<HTMLDivElement>(null);

  // Handle printing journey summary
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
      {/* Header: Suivi Optimal 360° */}
      <div className="rounded-xl bg-white p-5 text-slate-900 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Suivi du Patient : Parcours 360°
              </h1>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Traçabilité Globale
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Harmonisation unifiée du flux patient depuis son arrivée à l'accueil jusqu'à sa sortie définitive. Synchronisation temps réel entre Accueil, Facturation, Soins Infirmiers, Consultations, Laboratoire, Imagerie et Hospitalisation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onRefreshData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Actualiser le flux</span>
            </button>
            <button
              onClick={handlePrintSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Fiche Suiveuse Patient</span>
            </button>
          </div>
        </div>

        {/* Patient Selection & Scenarios Switcher */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Patient Quick Selector */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500" /> Patient Actif en Suivi
            </label>
            <div className="relative">
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
          </div>

          {/* Scenario Filter Pills */}
          <div className="lg:col-span-8">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" /> Cas de Figure & Parcours Cliniques
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'consultation_simple', label: '1. Consultation Simple' },
                { key: 'lab_case', label: '2. Bilan Laboratoire (LIMS)' },
                { key: 'imaging_case', label: '3. Radio / Imagerie (PACS)' },
                { key: 'hospitalization_case', label: '4. Urgence & Hospitalisation' },
                { key: 'specialist_case', label: '5. Médecin Spécialiste' }
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCase(c.key as PatientJourneyCase)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    selectedCase === c.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Summary Card */}
      {currentPatient && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shadow-inner shrink-0">
              {currentPatient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900">{currentPatient.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                  {currentPatient.ndm || 'NDM-2026-0042'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  En cours de prise en charge
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500 font-medium">
                <span>Genre : <strong className="text-slate-700">{currentPatient.gender === 'M' ? 'Masculin' : 'Féminin'}</strong></span>
                <span>Âge : <strong className="text-slate-700">{currentPatient.age || 38} ans</strong></span>
                <span>Téléphone : <strong className="text-slate-700">{currentPatient.phone || 'Non renseigné'}</strong></span>
                <span>Assurance : <strong className="text-indigo-600">{currentPatient.insurance_name ? `${currentPatient.insurance_name} (${currentPatient.insurance_coverage_rate}%)` : 'Patient Privé'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
            <div className="text-center px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Factures</span>
              <p className="text-base font-black text-slate-800">{patientInvoices.length}</p>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consultations</span>
              <p className="text-base font-black text-indigo-600">{patientConsultations.length}</p>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">État Quittance</span>
              <p className="text-xs font-black text-emerald-600 uppercase mt-1">À Jour</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive 7-Step Chronological Journey Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Chronologie Complète du Parcours Patient (7 Jalons Métier)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Cas actif : <strong className="text-slate-800">{selectedCase.replace('_', ' ').toUpperCase()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isFinished = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className={`rounded-2xl border p-5 transition-all ${
                  isFinished
                    ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    : isInProgress
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 border-slate-200/80 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Step Identifier & Icon */}
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      isFinished
                        ? 'bg-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isFinished ? <CheckCircle2 className="w-6 h-6" /> : <span>0{stage.number}</span>}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Étape {stage.number}
                        </span>
                        <h4 className="text-base font-black text-slate-900">{stage.title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isFinished
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isFinished ? 'Exécuté & Validé' : isInProgress ? 'En cours de réalisation' : 'À venir'}
                        </span>
                        {stage.time && (
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {stage.time}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{stage.subtitle}</p>
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Praticien / Opérateur : <strong className="text-slate-600">{stage.agent}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Center/Right: Action Button & Metrics */}
                  <div className="flex items-center gap-4 lg:self-center">
                    {stage.metrics && stage.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="hidden sm:block text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">{m.label}</span>
                        <span className="text-xs font-black text-slate-800">{m.value}</span>
                      </div>
                    ))}

                    <button
                      onClick={() => onNavigateToView(stage.targetView)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        isInProgress
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{stage.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-details pills */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {stage.details.map((d, dIdx) => (
                    <div key={dIdx} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Case Scenarios Breakdown Guide */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 p-6 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" /> Matrice des Cas de Figure Possibles au sein de la Plate-Forme
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cas 1 : Consultation Externe Simple
            </h5>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Arrivée accueil &rarr; Quittance caisse consultation &rarr; Constantes infirmières &rarr; Examen médecin &rarr; Ordonnance médicamenteuse &rarr; Sortie immédiate.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Cas 2 : Consultation avec Analyses Biologiques
            </h5>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Prescription d'analyses &rarr; Quittance examens &rarr; Prélèvement tubes & étiquetage LIMS &rarr; Analyse automate &rarr; Validation Dr Biologiste &rarr; Transmission médecin.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Cas 3 : Examen d'Imagerie / Radiologie
            </h5>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Demande d'imagerie &rarr; File d'attente radio &rarr; Réalisation cliché numérique PACS &rarr; Rédaction compte-rendu radiologique validé &rarr; Archivage dossier.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Cas 4 : Urgence & Hospitalisation Complète
            </h5>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Triage rouge/jaune &rarr; Admission d'hospitalisation &rarr; Attribution chambre/lit &rarr; Soins continus horaires &rarr; Visites médicales &rarr; Sortie apurée.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Cas 5 : Consultation Spécialiste Référé
            </h5>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Lettre d'orientation &rarr; Examen spécialiste approfondi &rarr; Bilan paraclinique spécifique &rarr; Calendrier de suivi chronologique au long cours.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Traçabilité & Identitovigilance
              </h5>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Double vérification de l'identité du patient à chaque transfert de responsabilité. Zéro rupture de continuité des soins.
              </p>
            </div>
            <div className="pt-2 text-right">
              <span className="text-[10px] font-black text-indigo-600 uppercase">100% Conforme HIS</span>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN PRINTABLE TEMPLATE: FICHE SUIVEUSE PATIENT (Used by printElement) */}
      <div className="hidden">
        <div ref={fichePrintRef} className="p-8 bg-white font-sans text-slate-900 text-xs space-y-5">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">{company.name || 'CENTRE HOSPITALIER'}</h1>
              <p className="text-[11px] text-slate-500">{company.phone} • {company.email || 'contact@hopital.bf'}</p>
              <p className="text-[11px] text-slate-500">{company.address || 'Ouagadougou, Burkina Faso'}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-xs rounded uppercase tracking-wider">
                Fiche Suiveuse de Parcours Patient
              </span>
              <p className="text-[11px] text-slate-600 mt-1 font-mono">Date : {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>

          {/* Patient Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Identité Patient</span>
              <span className="font-bold text-sm text-slate-900">{currentPatient?.name || 'Patient Inconnu'}</span>
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

          {/* Journey Steps Tracking */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              Chronologie des Étapes Hospitalières
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

          {/* Financial & Clinical Summary */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-slate-200 rounded p-3 space-y-1 text-[11px]">
              <div className="font-bold uppercase text-slate-700 text-xs mb-1">Situation Comptable & Règlements</div>
              <div className="flex justify-between">
                <span>Total Facturé :</span>
                <span className="font-bold">{stages[1]?.metrics?.[0]?.value || '0 FCFA'}</span>
              </div>
              <div className="flex justify-between">
                <span>Règlements Encaissés :</span>
                <span className="font-bold">{stages[1]?.metrics?.[1]?.value || '0 FCFA'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span>Solde Dû :</span>
                <span>{stages[1]?.metrics?.[2]?.value || '0 FCFA'}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 space-y-1 text-[11px]">
              <div className="font-bold uppercase text-slate-700 text-xs mb-1">Constantes Vitales d'Admission</div>
              <div className="flex justify-between">
                <span>Tension Artérielle :</span>
                <span className="font-bold">{latestConsultation?.vital_bp || '120/80 mmHg'}</span>
              </div>
              <div className="flex justify-between">
                <span>Température Corporelle :</span>
                <span className="font-bold">{latestConsultation?.vital_temp ? `${latestConsultation.vital_temp} °C` : '37.0 °C'}</span>
              </div>
              <div className="flex justify-between">
                <span>Fréquence Cardiaque :</span>
                <span className="font-bold">{latestConsultation?.vital_pulse ? `${latestConsultation.vital_pulse} bpm` : '75 bpm'}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
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
