import React, { useState } from 'react';
import { 
  X, User, FileText, Calendar, Printer, Clock, 
  CheckCircle2, AlertCircle, Coins, Activity, Phone, 
  Mail, MapPin, ClipboardList, ShieldAlert, Heart,
  Stethoscope, Pill, FlaskConical, ArrowRight, Send,
  Check, MessageSquare, Bed, Sparkles, AlertTriangle,
  FileCheck, ChevronRight, ShieldCheck, CreditCard, Lock, Unlock,
  Plus
} from 'lucide-react';
import { ResPartner, AccountMove, CompanySettings, LabExamOrder, MedicalConsultation, AppView } from '../types';

interface PatientDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: ResPartner;
  moves: AccountMove[];
  labOrders: LabExamOrder[];
  consultations?: MedicalConsultation[];
  company: CompanySettings;
  onOpenPdf: (move: AccountMove) => void;
  onNavigateToView?: (view: AppView) => void;
  onNewInvoice?: (partner: ResPartner, defaultCategory?: 'consultation' | 'exam') => void;
}

export const PatientDossierModal: React.FC<PatientDossierModalProps> = ({
  isOpen,
  onClose,
  patient,
  moves,
  labOrders,
  consultations = [],
  company,
  onOpenPdf,
  onNavigateToView,
  onNewInvoice
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'consultations' | 'prescriptions' | 'clinical' | 'pathway' | 'billing' | 'messaging'>('vitals');
  
  // Messaging state
  const [smsTemplate, setSmsTemplate] = useState<'rdv' | 'results' | 'prescription' | 'custom'>('results');
  const [customSms, setCustomSms] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsSentSuccess, setSmsSentSuccess] = useState(false);
  const [sentHistory, setSentHistory] = useState([
    { id: 1, type: 'SMS', date: 'Hier à 14:30', text: 'Rappel : Votre consultation de cardiologie est confirmée.', status: 'Délivré' }
  ]);

  // Transfer state
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Solvability Gatekeeper State
  const [blockedTransferTarget, setBlockedTransferTarget] = useState<{ targetName: string; view?: AppView } | null>(null);
  const [emergencyReason, setEmergencyReason] = useState<string>('Urgence vitale / Prise en charge immédiate sans délai financier');
  const [emergencyWaivers, setEmergencyWaivers] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (blockedTransferTarget) {
        setBlockedTransferTarget(null);
      } else {
        onClose();
      }
    }
  };

  // Filter moves (invoices) related to this patient
  const patientMoves = moves.filter(
    (m) => m.partner_id === patient.id || m.partner?.id === patient.id
  );

  // Solvability & Billing calculations
  const unpaidInvoices = patientMoves.filter(
    (m) => m.payment_state !== 'paid' && ((m.amount_residual !== undefined && m.amount_residual > 0) || (m.amount_residual === undefined))
  );
  const totalUnpaid = unpaidInvoices.reduce((sum, m) => sum + (m.amount_residual || m.amount_total || 0), 0);
  const paidInvoices = patientMoves.filter((m) => m.payment_state === 'paid');
  const hasPaidInvoices = paidInvoices.length > 0;

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const todayPaidInvoices = paidInvoices.filter((m) => isToday(m.invoice_date || m.create_date));
  const hasPaidToday = todayPaidInvoices.length > 0;

  const isInsured = Boolean(
    patient.insurance_name ||
    patient.is_insurance ||
    (patient.insurance_coverage_rate !== undefined && patient.insurance_coverage_rate > 0)
  );
  const coverageRate = patient.insurance_coverage_rate || (isInsured ? 80 : 0);
  const is100PercentCovered = isInsured && coverageRate >= 100;

  // Has valid solvability status for clinical services:
  // Requires either 100% insurance, active emergency waiver, or an active paid invoice from today with no outstanding unpaid balance!
  const isSolventForServices =
    is100PercentCovered ||
    emergencyWaivers.length > 0 ||
    (hasPaidToday && totalUnpaid === 0);

  // Filter lab orders related to this patient
  const patientLabOrders = labOrders.filter(
    (o) => (o as any).partner_id === patient.id || (o as any).patient_name === patient.name || (o as any).patient_id === patient.id
  );

  // Filter consultations
  const patientConsultations = consultations.filter(
    (c) => c.partner_id === patient.id || c.patient?.id === patient.id
  );

  const latestConsultation = patientConsultations[0] || null;
  const vitals = latestConsultation?.vitals;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + (company.currency_symbol || 'FCFA');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleSendNotification = (channel: 'SMS' | 'WhatsApp') => {
    setSmsSending(true);
    let msg = '';
    if (smsTemplate === 'rdv') {
      msg = `SIH CHU : M/Mme ${patient.name}, votre rendez-vous médical est confirmé pour demain à 09h00.`;
    } else if (smsTemplate === 'results') {
      msg = `SIH CHU : M/Mme ${patient.name}, vos examens de laboratoire (Dossier ${patient.ndm}) sont validés et disponibles.`;
    } else if (smsTemplate === 'prescription') {
      msg = `SIH CHU : M/Mme ${patient.name}, votre ordonnance médicale est prête pour délivrance en pharmacie.`;
    } else {
      msg = customSms || `SIH CHU : Message concernant votre dossier ${patient.ndm}.`;
    }

    setTimeout(() => {
      setSmsSending(false);
      setSmsSentSuccess(true);
      setSentHistory(prev => [
        { id: Date.now(), type: channel, date: "À l'instant", text: msg, status: 'Envoyé & Reçu' },
        ...prev
      ]);
      setTimeout(() => setSmsSentSuccess(false), 3500);
    }, 800);
  };

  // Safe Inter-Service Transfer with Gatekeeper Control
  const handleInterserviceTransfer = (targetName: string, view?: AppView) => {
    // 1. Direct transfer to Caisse is always permitted
    if (targetName.includes('Caisse') || view === 'invoices') {
      proceedWithTransfer(targetName, view);
      return;
    }

    // 2. Check Solvability for clinical/technical services
    if (!isSolventForServices) {
      // Trigger Gatekeeper Dialog
      setBlockedTransferTarget({ targetName, view });
      return;
    }

    // 3. Solvent / Covered / Exempted -> Proceed
    proceedWithTransfer(targetName, view);
  };

  const proceedWithTransfer = (targetName: string, view?: AppView) => {
    setTransferSuccessMsg(`Patient orienté vers : ${targetName}. Le poste récepteur a été notifié.`);
    setTimeout(() => {
      setTransferSuccessMsg(null);
      if (view && onNavigateToView) {
        onClose();
        onNavigateToView(view);
      }
    }, 1800);
  };

  // Grant emergency medical waiver
  const handleGrantEmergencyWaiver = () => {
    if (!blockedTransferTarget) return;
    const waiverNote = `Dérogation urgence médicale accordée pour ${blockedTransferTarget.targetName} : ${emergencyReason} (${new Date().toLocaleTimeString('fr-FR')})`;
    setEmergencyWaivers(prev => [waiverNote, ...prev]);
    const target = blockedTransferTarget;
    setBlockedTransferTarget(null);
    proceedWithTransfer(`${target.targetName} [DÉROGATION URGENCE MÉDICALE]`, target.view);
  };

  // Redirect to Caisse or directly open new invoice creation for this patient
  const handleRedirectToCaisse = (category?: 'consultation' | 'exam') => {
    const defaultCat = category || (
      blockedTransferTarget?.targetName.includes('Laboratoire') || blockedTransferTarget?.targetName.includes('Imagerie')
        ? 'exam'
        : 'consultation'
    );
    setBlockedTransferTarget(null);
    onClose();
    if (onNewInvoice) {
      onNewInvoice(patient, defaultCat);
    } else if (onNavigateToView) {
      onNavigateToView('factures_new_invoice');
    }
  };

  return (
    <div 
      id="patient-dossier-modal" 
      className="fixed inset-0 z-[100] overflow-y-auto" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="flex items-center justify-center min-h-screen px-3 pt-4 pb-16 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-xs" 
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-5xl my-6 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl border border-slate-200 relative z-10 max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                    {patient.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                    {patient.ndm || 'NDM-0000'}
                  </span>
                  
                  {/* Real-time Solvability Badge */}
                  {is100PercentCovered ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-sky-600" />
                      Prise en Charge 100%
                    </span>
                  ) : isSolventForServices ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Quittance Acquittée
                    </span>
                  ) : totalUnpaid > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Impayé : {formatCurrency(totalUnpaid)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Passage Caisse Requis
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-3 mt-0.5">
                  <span>{patient.gender === 'M' ? 'Homme' : 'Femme'} • {patient.age || 35} ans</span>
                  <span>Tél : <strong className="text-slate-700">{patient.phone || 'Non renseigné'}</strong></span>
                  <span>Régime : <strong className={isInsured ? 'text-indigo-700' : 'text-slate-700'}>
                    {patient.insurance_name ? `${patient.insurance_name} (${coverageRate}%)` : 'Patient Privé (Comptant)'}
                  </strong></span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Transfer Toast Banner */}
          {transferSuccessMsg && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-bold animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{transferSuccessMsg}</span>
              </div>
            </div>
          )}

          {/* Emergency Waiver Banner */}
          {emergencyWaivers.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-[11px] text-amber-900 font-bold">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Dérogation d&apos;urgence médicale active sur ce dossier. Régularisation comptable requise après soins.</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs Bar */}
          <div className="px-6 border-b border-slate-200 bg-white flex flex-wrap gap-1 shrink-0">
            {[
              { id: 'vitals', label: 'Constantes & Synthèse', icon: Activity },
              { id: 'consultations', label: `Consultations (${patientConsultations.length})`, icon: Stethoscope },
              { id: 'prescriptions', label: 'Prescriptions & Pharmacie', icon: Pill },
              { id: 'clinical', label: `Biologie & LIMS (${patientLabOrders.length})`, icon: FlaskConical },
              { id: 'pathway', label: 'Filière & Matching Interservice', icon: ArrowRight },
              { id: 'billing', label: `Facturation & Caisse (${patientMoves.length})`, icon: Coins },
              { id: 'messaging', label: 'Notifier Patient (SMS/WhatsApp)', icon: MessageSquare }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 py-3 px-3.5 text-xs font-bold transition border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Tab Content */}
          <div className="p-6 bg-slate-50/50 min-h-[420px] overflow-y-auto flex-1">
            
            {/* 1. CONSTANTES & SYNTHESE MEDICALE */}
            {activeTab === 'vitals' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-slate-700" />
                    Dernières Constantes Vitales du Patient
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tension Artérielle</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.bp_systolic && vitals?.bp_diastolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic}` : '120/80'} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Normotendu</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Pouls / Fréquence</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.pulse || '74'} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">Régulier</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Température</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.temperature || '37.0'} <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Apyrétique</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Saturation SpO2</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.spo2 || '98'} <span className="text-[10px] text-slate-400 font-normal">%</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Excellente</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Poids / Taille</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.weight || '70'} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{vitals?.height || 175} cm</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Glycémie / Dextro</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.blood_sugar || '0.95'} <span className="text-[10px] text-slate-400 font-normal">g/L</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Normal</span>
                    </div>
                  </div>
                </div>

                {/* Antecedents & Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-slate-500" />
                      Terrain Médical &amp; Facteurs de Risque
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Antécédents Médicaux :</span>
                        <span className="font-bold text-slate-800">{(patient as any).medical_history || (patient as any).comment || 'Aucun antécédent majeur signalé'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Allergies Connues :</span>
                        <span className="font-bold text-rose-700">{(patient as any).allergies || 'Aucune allergie documentée'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Groupe Sanguin :</span>
                        <span className="font-black text-slate-900">{patient.blood_group || 'O+'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      Couverture &amp; Prise en Charge
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Organisme / Convention :</span>
                        <span className="font-bold text-slate-900">{patient.insurance_name || 'Comptant (Paiement direct)'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">N° Matricule / Police :</span>
                        <span className="font-mono font-bold text-slate-800">{patient.insurance_policy_number || 'CONV-STD-2026'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Taux de Prise en Charge :</span>
                        <span className="font-black text-indigo-700">{coverageRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONSULTATIONS */}
            {activeTab === 'consultations' && (
              <div className="space-y-4">
                {patientConsultations.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 uppercase">Aucune consultation enregistrée</p>
                    <p className="text-[11px] text-slate-500 mt-1">Le praticien n&apos;a pas encore rédigé d&apos;observation clinique pour ce patient.</p>
                  </div>
                ) : (
                  patientConsultations.map((c, i) => (
                    <div key={c.id || i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Consultation : {c.doctor_name || 'Médecin Référent'}
                          </h5>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          {formatDate(c.consultation_date || c.created_at || '')}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-500 text-[11px] uppercase">Motif de consultation :</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{c.chief_complaint || 'Syndrome fébrile et céphalées'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-[11px] uppercase">Diagnostic &amp; Conclusion :</span>
                          <p className="font-bold text-indigo-900 mt-0.5">{c.diagnosis || 'Épisode infectieux bénin sans signe de gravité'}</p>
                        </div>
                        {((c as any).clinical_notes || c.notes) && (
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-500 text-[10px] uppercase">Notes d&apos;examen :</span>
                            <p className="text-slate-700 mt-0.5 italic">{(c as any).clinical_notes || c.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. PRESCRIPTIONS & PHARMACIE */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Pill className="w-4 h-4 text-rose-600" />
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ordonnance Médicale &amp; Posologie</h5>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">Prescrite par Dr. Praticien</span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {[
                      { name: 'Paracétamol 1g Comprimé', posology: '1 cp toutes les 8 heures si fièvre', duration: '5 jours', qty: '1 boîte' },
                      { name: 'Amoxicilline 1g Gélule', posology: '1 gélule matin et soir au milieu des repas', duration: '7 jours', qty: '2 boîtes' },
                      { name: 'Sérum Physiologique 0.9% 500ml', posology: 'Instillation nasale 3 fois/jour', duration: '3 jours', qty: '1 flacon' }
                    ].map((med, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{med.name}</p>
                          <p className="text-slate-500 text-[11px]">{med.posology} • Durée : <strong className="text-slate-700">{med.duration}</strong></p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {med.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. BIOLOGIE & LIMS */}
            {activeTab === 'clinical' && (
              <div className="space-y-4">
                {patientLabOrders.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <FlaskConical className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 uppercase">Aucune analyse de laboratoire</p>
                    <p className="text-[11px] text-slate-500 mt-1">Aucune prescription biologique n&apos;a été envoyée pour ce dossier.</p>
                  </div>
                ) : (
                  patientLabOrders.map((order, i) => (
                    <div key={order.id || i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-black text-slate-900 font-mono">Bilan N° {order.order_number || `#LIMS-${order.id}`}</span>
                          <p className="text-[11px] text-slate-500">
                            Validé le {formatDate(order.created_at || '')} par Dr. Biologiste
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                          {order.status === 'validated' ? 'Certifié Conforme' : 'En Analyse'}
                        </span>
                      </div>

                      {(order as any).results && (order as any).results.length > 0 && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Paramètre</th>
                                <th className="p-2.5 text-center">Valeur</th>
                                <th className="p-2.5">Normes</th>
                                <th className="p-2.5 text-center">Interprétation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(order as any).results.map((res: any, idx: number) => {
                                const isAbnormal = res.status === 'abnormal' || res.status === 'high' || res.status === 'low';
                                return (
                                  <tr key={idx} className={isAbnormal ? 'bg-rose-50/50' : ''}>
                                    <td className="p-2.5 font-bold text-slate-900">{res.test_name}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-900">{res.value} {res.unit}</td>
                                    <td className="p-2.5 text-slate-500">{res.reference_range}</td>
                                    <td className="p-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                        isAbnormal ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                                      }`}>
                                        {isAbnormal ? 'ALERTE' : 'NORMAL'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. PARCOURS & MATCHING INTERSERVICE (WITH SOLVABILITY GATEKEEPER) */}
            {activeTab === 'pathway' && (
              <div className="space-y-4">
                
                {/* Solvability Status Box */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSolventForServices 
                    ? 'bg-emerald-50/60 border-emerald-200' 
                    : 'bg-rose-50/70 border-rose-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {isSolventForServices ? (
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                          {isSolventForServices ? 'Contrôle de Solvabilité : Validé & Conforme' : 'Contrôle de Solvabilité : Règlement Requis'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {is100PercentCovered
                          ? `Prise en charge intégrale (100%) par ${patient.insurance_name || 'Organisme Partenaire'}. Aiguillage immédiat autorisé.`
                          : hasPaidToday && totalUnpaid === 0
                          ? `Quittance acquittée ce jour (${todayPaidInvoices.length} règlement(s)). Le patient est en règle financière pour sa visite.`
                          : totalUnpaid > 0
                          ? `Solde impayé en attente (${formatCurrency(totalUnpaid)}). Le patient doit passer à la caisse avant accès aux soins.`
                          : hasPaidInvoices
                          ? `Le patient possède un dossier mais aucune quittance émise aujourd'hui pour sa nouvelle prestation. Règlement caisse préalable obligatoire.`
                          : `Aucune quittance préalable enregistrée pour ce patient au comptant.`}
                      </p>
                    </div>
                  </div>

                  {!isSolventForServices && (
                    <button
                      type="button"
                      onClick={() => handleRedirectToCaisse('consultation')}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs shrink-0"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                      <span>Facturer à la Caisse</span>
                    </button>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                      Orientation &amp; Aiguillage Interservice Sécurisé
                    </h5>
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Contrôle automatique actif
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500">
                    Transférez la responsabilité du patient en 1 clic vers le poste de travail compétent. Le système vérifie automatiquement la quittance ou l&apos;accord de prise en charge.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    
                    {/* Vers Consultation */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Consultation Médicale', 'consultations')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-slate-900">Vers Consultation</span>
                        </div>
                        {!isSolventForServices && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Aiguiller en salle d&apos;attente médecin</p>
                    </button>

                    {/* Vers Laboratoire */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Laboratoire LIMS (Prélèvements)', 'lab_results')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FlaskConical className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-slate-900">Vers Laboratoire</span>
                        </div>
                        {!isSolventForServices && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Envoyer pour prélèvements sanguins</p>
                    </button>

                    {/* Vers Imagerie */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Imagerie & Radiologie', 'imaging_pacs')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-sky-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-slate-900">Vers Imagerie</span>
                        </div>
                        {!isSolventForServices && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Scanner, Radiographie, Échographie</p>
                    </button>

                    {/* Vers Caisse (Always Unlocked) */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Caisse & Régie', 'factures_new_invoice')}
                      className="p-3 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200 rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-slate-900">Vers Caisse</span>
                        </div>
                        <Unlock className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Émission facture &amp; quittance comptant</p>
                    </button>

                    {/* Vers Pharmacie */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Pharmacie Hospitalière', 'pharmacy_dispensing')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Pill className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-slate-900">Vers Pharmacie</span>
                        </div>
                        {!isSolventForServices && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Dispensation et remise ordonnance</p>
                    </button>

                    {/* Vers Hospitalisation */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Hospitalisation & Lits', 'bed_management')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bed className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-slate-900">Vers Hospitalisation</span>
                        </div>
                        {!isSolventForServices && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Attribution d&apos;un lit en chambre</p>
                    </button>

                    {/* Parcours 360 */}
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Filière de Soins Générale', 'patient_journey')}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
                        <span className="font-bold text-xs">Ouvrir Parcours 360°</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-1">Vue complète des 7 jalons métier</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. FACTURATION & SOLVABILITE */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                
                {/* Quick Invoicing Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Gestion Financière &amp; Quittances ({patientMoves.length})
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Historique des factures, règlements et tickets modérateurs du dossier {patient.ndm}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRedirectToCaisse('consultation')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nouvelle Facture / Encaisser</span>
                  </button>
                </div>

                {patientMoves.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 p-6 space-y-2">
                    <Coins className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 uppercase">Aucune facture enregistrée pour ce patient</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Pour délivrer une prestation ou orienter ce patient au comptant, veuillez d&apos;abord créer une facture à la caisse.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRedirectToCaisse('consultation')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer mt-2"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ouvrir la Caisse &amp; Émettre une Quittance</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {patientMoves.map((m) => (
                      <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900">{m.name || `#${m.id}`}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              m.payment_state === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {m.payment_state === 'paid' ? 'Acquittée (Payée)' : 'Impayée / En Attente'}
                            </span>
                            {m.insurance_name && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                                {m.insurance_name} ({m.insurance_coverage_rate || 80}%)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Date : {formatDate(m.date || m.invoice_date || '')} • Montant Total : <strong className="text-slate-900">{formatCurrency(m.amount_total)}</strong>
                            {m.amount_residual > 0 && (
                              <span className="text-rose-700 font-bold ml-2">
                                (Reste dû : {formatCurrency(m.amount_residual)})
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => onOpenPdf(m)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer Reçu</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. MESSAGERIE PATIENT (SMS / WHATSAPP) */}
            {activeTab === 'messaging' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        Envoi de Notification Patient (SMS / WhatsApp)
                      </h5>
                      <p className="text-xs text-slate-500">Destinataire : <strong>{patient.name}</strong> ({patient.phone || 'Numéro non renseigné'})</p>
                    </div>
                    {smsSentSuccess && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> Message transmis au réseau !
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">Sélectionner un Modèle de Message</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'results', label: '1. Résultats Prêts' },
                        { id: 'rdv', label: '2. Rappel Rendez-vous' },
                        { id: 'prescription', label: '3. Ordonnance Disponible' },
                        { id: 'custom', label: '4. Message Libre' }
                      ].map(tmpl => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setSmsTemplate(tmpl.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            smsTemplate === tmpl.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Texte du Message</label>
                    {smsTemplate === 'custom' ? (
                      <textarea
                        rows={3}
                        value={customSms}
                        onChange={(e) => setCustomSms(e.target.value)}
                        placeholder="Rédigez votre message au patient..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      />
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        {smsTemplate === 'results' && `SIH CHU : Bonjour M/Mme ${patient.name}, vos examens de laboratoire (Dossier ${patient.ndm || 'NDM-0000'}) sont validés et disponibles pour retrait ou consultation médicale.`}
                        {smsTemplate === 'rdv' && `SIH CHU : Bonjour M/Mme ${patient.name}, nous vous rappelons votre rendez-vous médical programmé pour demain à 09h00. Veuillez vous munir de votre carnet de santé.`}
                        {smsTemplate === 'prescription' && `SIH CHU : Bonjour M/Mme ${patient.name}, votre ordonnance médicale est prête pour délivrance à la pharmacie hospitalière.`}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={smsSending}
                      onClick={() => handleSendNotification('SMS')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{smsSending ? 'Transmission en cours...' : 'Envoyer par SMS Direct'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={smsSending}
                      onClick={() => handleSendNotification('WhatsApp')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{smsSending ? 'Transmission en cours...' : 'Envoyer par WhatsApp'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h6 className="text-[11px] font-bold uppercase text-slate-500">Historique des envois récents</h6>
                  <div className="space-y-1.5">
                    {sentHistory.map((item) => (
                      <div key={item.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-black text-slate-800 mr-2">[{item.type}]</span>
                          <span className="text-slate-600">{item.text}</span>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-[10px] text-slate-400 block">{item.date}</span>
                          <span className="text-[9px] font-black text-emerald-700 uppercase">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/80">
            <span className="text-xs text-slate-500 font-medium">
              Dossier NDM : <strong className="text-slate-800">{patient.ndm || 'NDM-0000'}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Fermer le Dossier
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SOLVABILITY GATEKEEPER & VERIFICATION BEFORE ACCESS                */}
      {/* ========================================================================= */}
      {blockedTransferTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-300" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Contrôle de Solvabilité &amp; Quittance Requis</h3>
                  <p className="text-[11px] text-rose-200">Accès bloqué : règlement préalable obligatoire</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockedTransferTarget(null)}
                className="text-rose-300 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Patient Concerné :</span>
                  <span className="font-bold text-slate-900">{patient.name} ({patient.ndm})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Service Demandé :</span>
                  <span className="font-bold text-indigo-700">{blockedTransferTarget.targetName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Régime Patient :</span>
                  <span className="font-bold text-slate-800">
                    {patient.insurance_name ? `${patient.insurance_name} (${coverageRate}%)` : 'Patient Privé (Comptant 100%)'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-bold text-rose-700">Statut Financier :</span>
                  {totalUnpaid > 0 ? (
                    <span className="font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                      Solde Dû : {formatCurrency(totalUnpaid)}
                    </span>
                  ) : hasPaidInvoices && !hasPaidToday ? (
                    <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Nouvelle Prestation non réglée ce jour
                    </span>
                  ) : (
                    <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Aucune Quittance Comptant Émise
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Règle Hospitalière de Gestion :</span>
                </div>
                <p>
                  Pour garantir la traçabilité des recettes et éviter les créances irrécouvrables, le patient doit régler sa consultation ou son examen à la caisse avant d&apos;être admis au service.
                </p>
              </div>

              {/* Action Choices */}
              <div className="space-y-2.5 pt-1">
                
                {/* 1. Go to Caisse */}
                <button
                  type="button"
                  onClick={() => handleRedirectToCaisse()}
                  className="w-full p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center justify-between cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                    <span>1. Facturer &amp; Encaisser cette prestation (Caisse)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 2. Medical Emergency Override Option */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      2. Dérogation Urgence Vitale (Force Majeure Médicale)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={emergencyReason}
                    onChange={(e) => setEmergencyReason(e.target.value)}
                    placeholder="Motif médical d'urgence justifiant la dispense immédiate..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-[11px] font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleGrantEmergencyWaiver}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Autoriser le Passage Exceptionnel d&apos;Urgence</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockedTransferTarget(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Annuler
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
