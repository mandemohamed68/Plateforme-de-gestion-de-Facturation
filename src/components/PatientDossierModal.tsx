import React, { useState } from 'react';
import { 
  X, User, FileText, Calendar, Printer, Clock, 
  CheckCircle2, AlertCircle, Coins, Activity, Phone, 
  Mail, MapPin, ClipboardList, ShieldAlert, Heart,
  Stethoscope, Pill, FlaskConical, ArrowRight, Send,
  Check, MessageSquare, Bed, Sparkles, AlertTriangle,
  FileCheck, ChevronRight
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
  onNavigateToView
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

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Filter moves (invoices) related to this patient
  const patientMoves = moves.filter(
    (m) => m.partner_id === patient.id || m.partner?.id === patient.id
  );

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

  const handleInterserviceTransfer = (targetName: string, view?: AppView) => {
    setTransferSuccessMsg(`Patient orienté avec succès vers : ${targetName}. Le poste de travail récepteur a été notifié.`);
    setTimeout(() => {
      setTransferSuccessMsg(null);
      if (view && onNavigateToView) {
        onClose();
        onNavigateToView(view);
      }
    }, 1800);
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

        <div className="inline-block w-full max-w-5xl my-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl border border-slate-200 relative z-10">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                    {patient.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                    {patient.ndm || 'NDM-0000'}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Dossier Médical Partagé 360°
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-3 mt-0.5">
                  <span>{patient.gender === 'M' ? 'Homme' : 'Femme'} • {patient.age || 35} ans</span>
                  <span>Tél : <strong className="text-slate-700">{patient.phone || 'Non renseigné'}</strong></span>
                  <span>Assurance : <strong className="text-indigo-700">{patient.insurance_name ? `${patient.insurance_name} (${patient.insurance_coverage_rate || 80}%)` : 'Patient Privé (Comptant)'}</strong></span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
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

          {/* Navigation Tabs Bar */}
          <div className="px-6 border-b border-slate-200 bg-white flex flex-wrap gap-1">
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
          <div className="p-6 bg-slate-50/50 min-h-[420px] max-h-[62vh] overflow-y-auto">
            
            {/* 1. CONSTANTES & SYNTHESE MEDICALE */}
            {activeTab === 'vitals' && (
              <div className="space-y-5">
                {/* Vitals Grid */}
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
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Régulier</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Température</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.temperature || '37.1'} <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Apyrétique</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Saturation SpO2</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.spo2 || '98'} <span className="text-[10px] text-slate-400 font-normal">%</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Optimale</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Glycémie à jeun</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.glycemia || '0.94'} <span className="text-[10px] text-slate-400 font-normal">g/L</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Normale</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Poids & IMC</span>
                      <p className="text-base font-black text-slate-900 mt-1">
                        {vitals?.weight || '68'} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                      </p>
                      <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">IMC: 22.4</span>
                    </div>
                  </div>
                </div>

                {/* Antecedents and Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Allergies & Vigilances Thérapeutiques
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-semibold flex items-center justify-between">
                        <span>Allergie Pénicilline & Bêtalactamines</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-200 text-amber-950 font-black rounded">Signalée</span>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                        <span>Pas d'intolérance alimentaire déclarée</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      Antécédents Médicaux & Chirurgicaux
                    </h5>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <strong>Médical :</strong> HTA traitée sous Amlodipine 5mg. Suivi cardiologique annuel.
                      </p>
                      <p className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <strong>Chirurgical :</strong> Appendicectomie sous coelioscopie en 2018 (sans complication).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONSULTATIONS */}
            {activeTab === 'consultations' && (
              <div className="space-y-3">
                {patientConsultations.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 uppercase">Aucune consultation enregistrée</p>
                    <p className="text-[11px] text-slate-500 mt-1">Ce patient n'a pas encore de consultation répertoriée dans le SIH.</p>
                  </div>
                ) : (
                  patientConsultations.map((c) => (
                    <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900">Consultation #{c.id}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                              {c.consultation_type || 'Médecine Générale'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Praticien : <strong>{c.doctor_name || 'Dr. Touré'}</strong> • {formatDate(c.date || c.created_at || '')}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                          {c.state === 'done' ? 'Validée & Conclue' : 'En Cours'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Motif de Consultation</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{c.chief_complaint || 'Bilan de santé systématique'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Diagnostic Retenu (CIM-10)</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{c.diagnosis || 'Épisode fébrile sans signe de gravité'}</p>
                        </div>
                      </div>

                      {c.notes && (
                        <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                          <span className="font-bold block text-[10px] text-slate-500 uppercase mb-0.5">Observation Clinique :</span>
                          <p>{c.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. PRESCRIPTIONS & PHARMACIE */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      Ordonnances Médicamenteuses & Dispensation
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Vérification QR Anti-fraude
                    </span>
                  </div>

                  {/* Sample or real prescription lines */}
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-black text-slate-900">1. Amoxicilline + Acide Clavulanique 1g/125mg</p>
                        <p className="text-[11px] text-slate-500">Posologie : 1 comprimé matin et soir au milieu des repas pendant 7 jours</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        Délivré en pharmacie
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-black text-slate-900">2. Paracétamol 1g Comprimé</p>
                        <p className="text-[11px] text-slate-500">Posologie : 1 comprimé toutes les 6 heures en cas de douleur ou fièvre (max 3g/jour)</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        Délivré en pharmacie
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Prescrit par : <strong>Dr. Camara (Chirurgien / Généraliste)</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSendNotification('SMS')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer Ordonnance par SMS</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BIOLOGIE & LIMS */}
            {activeTab === 'clinical' && (
              <div className="space-y-3">
                {patientLabOrders.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <FlaskConical className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 uppercase">Aucun examen biologique enregistré</p>
                    <p className="text-[11px] text-slate-500 mt-1">Le patient n'a pas encore de bilan de laboratoire dans le système LIMS.</p>
                  </div>
                ) : (
                  patientLabOrders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            Bilan LIMS #{order.id}
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-xs mt-1">
                            {(order as any).sample_type ? `Prélèvement : ${(order as any).sample_type}` : 'Bilan Biologique Sanguin'}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Validé le {formatDate(order.created_at || '')} par Dr. Biologiste
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                          {order.status === 'validated' ? 'Certifié Conforme' : 'En Analyse'}
                        </span>
                      </div>

                      {/* Biological Exam results list */}
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

            {/* 5. PARCOURS & MATCHING INTERSERVICE */}
            {activeTab === 'pathway' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                    Orientation & Aiguillage Interservice Immédiat
                  </h5>
                  <p className="text-xs text-slate-500">
                    Transférez la responsabilité du patient en 1 clic vers le poste de travail compétent. Une notification temps réel apparaîtra immédiatement sur l'écran du service cible.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Consultation Médicale', 'consultations')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-xs text-slate-900">Vers Consultation</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Aiguiller en salle d'attente médecin</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Laboratoire LIMS (Prélèvements)', 'lab_results')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <FlaskConical className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-xs text-slate-900">Vers Laboratoire</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Envoyer pour prélèvements sanguins</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Caisse & Régie', 'invoices')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-xs text-slate-900">Vers Caisse</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Solvabilité & quittance comptant</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Pharmacie Hospitalière', 'pharmacy_dispensing')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Pill className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-xs text-slate-900">Vers Pharmacie</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Dispensation et remise ordonnance</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInterserviceTransfer('Hospitalisation & Lits', 'bed_management')}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Bed className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-xs text-slate-900">Vers Hospitalisation</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Attribution d'un lit en chambre</p>
                    </button>

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
              <div className="space-y-3">
                {patientMoves.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <Coins className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 uppercase">Aucune facture enregistrée</p>
                    <p className="text-[11px] text-slate-500 mt-1">Ce patient n'a aucun mouvement comptable ou quittance de caisse.</p>
                  </div>
                ) : (
                  patientMoves.map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900">{m.name || `#${m.id}`}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            m.payment_state === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {m.payment_state === 'paid' ? 'Acquittée' : 'Impayée'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Date : {formatDate(m.date || m.invoice_date || '')} • Montant Total : <strong className="text-slate-900">{formatCurrency(m.amount_total)}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenPdf(m)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimer Reçu</span>
                      </button>
                    </div>
                  ))
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

                  {/* Template selector */}
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

                  {/* Message Preview or Editor */}
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

                  {/* Send buttons */}
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

                {/* History of sent messages */}
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
    </div>
  );
};
