import React, { useState } from 'react';
import { 
  X, User, FileText, Calendar, Printer, Clock, 
  CheckCircle2, AlertCircle, Coins, Activity, Phone, 
  Mail, MapPin, ClipboardList, ShieldAlert
} from 'lucide-react';
import { ResPartner, AccountMove, CompanySettings, LabExamOrder } from '../types';

interface PatientDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: ResPartner;
  moves: AccountMove[];
  labOrders: LabExamOrder[];
  company: CompanySettings;
  onOpenPdf: (move: AccountMove) => void;
}

export const PatientDossierModal: React.FC<PatientDossierModalProps> = ({
  isOpen,
  onClose,
  patient,
  moves,
  labOrders,
  company,
  onOpenPdf
}) => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'billing' | 'info'>('clinical');

  if (!isOpen) return null;

  // Filter moves (invoices) related to this patient
  const patientMoves = moves.filter(
    (m) => m.partner_id === patient.id || m.partner?.id === patient.id
  );

  // Filter lab orders related to this patient
  const patientLabOrders = labOrders.filter(
    (o) => (o as any).partner_id === patient.id || (o as any).patient_name === patient.name || (o as any).patient_id === patient.id
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + (company.currency_symbol || 'FCFA');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="patient-dossier-modal" className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-xs" 
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-slate-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center space-x-3">
              <div 
                style={{ backgroundColor: company.primary_color || '#0f172a' }}
                className="p-2.5 rounded-2xl text-white shadow-md shadow-slate-200"
              >
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Dossier Patient Identifié
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{patient.name}</span>
                  <span className="text-xs font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-mono">
                    NDM: {patient.ndm || 'N/A'}
                  </span>
                </h3>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Quick Patient Demographics Mini-Card */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{patient.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">ID Int : {patient.id}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {patient.birth_date && (
                      <div className="flex items-center text-slate-600">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        <span>Né(e) le : <strong className="text-slate-800 font-semibold">{patient.birth_date}</strong></span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex items-center text-slate-600">
                        <User className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        <span>Sexe : <strong className="text-slate-800 font-semibold uppercase">{patient.gender?.toUpperCase() === 'M' ? 'Masculin' : patient.gender?.toUpperCase() === 'F' ? 'Féminin' : patient.gender}</strong></span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center text-slate-600">
                        <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        <span>Tél : <strong className="text-slate-800 font-semibold">{patient.phone}</strong></span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center text-slate-600">
                        <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        <span className="truncate">Email : <strong className="text-slate-800 font-semibold">{patient.email}</strong></span>
                      </div>
                    )}
                    {(patient.street || patient.city) && (
                      <div className="flex items-center text-slate-600">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        <span className="truncate">Adresse : <strong className="text-slate-800 font-semibold">{[patient.street, patient.city].filter(Boolean).join(', ')}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Clinical Alerts Section */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 text-amber-900 font-black text-[11px] uppercase tracking-wider mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Dossier & Clinique</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1.5 font-medium leading-relaxed">
                    <p>
                      <span className="text-slate-500">Antécédents / Notes : </span>
                      <span className="text-slate-800 font-bold block mt-0.5">
                        {(patient as any).comment || 'Aucun antécédent médical signalé.'}
                      </span>
                    </p>
                    {patient.insurance_id && (
                      <p className="border-t border-amber-200/50 pt-1.5 mt-1.5">
                        <span className="text-slate-500">Couverture Assuré : </span>
                        <strong className="text-emerald-800 block">Assurance Active - Matricule : {patient.insurance_policy_number || (patient as any).insurance_card_number || 'N/A'}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Tabbed Clinical History File */}
              <div className="lg:col-span-2 flex flex-col min-h-[400px]">
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-4 gap-2">
                  <button
                    onClick={() => setActiveTab('clinical')}
                    className={`pb-2.5 px-3 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
                      activeTab === 'clinical'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Analyses & Examens ({patientLabOrders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`pb-2.5 px-3 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
                      activeTab === 'billing'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Factures & Recus ({patientMoves.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-2.5 px-3 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
                      activeTab === 'info'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Identité Complète
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto max-h-[350px] pr-1">
                  
                  {/* CLINICAL LAB EXAMS HISTORY */}
                  {activeTab === 'clinical' && (
                    <div className="space-y-3">
                      {patientLabOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <ClipboardList className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aucun examen de laboratoire</p>
                          <p className="text-slate-400 text-[11px] mt-1">Ce patient n'a pas encore d'examen de laboratoire enregistré.</p>
                        </div>
                      ) : (
                        patientLabOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition shadow-xs space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                                  Examen #{order.id}
                                </span>
                                <h5 className="font-extrabold text-slate-900 text-xs mt-1">
                                  {(order as any).sample_type ? `Prélèvement : ${(order as any).sample_type}` : 'Examen Clinique'}
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Commandé le {formatDate(order.created_at || '')}
                                </p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                order.status === 'validated' 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : order.status === 'in_progress'
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}>
                                {order.status === 'validated' ? 'Validé' : order.status === 'in_progress' ? 'En Cours' : 'Brouillon'}
                              </span>
                            </div>

                            {/* Biological Exam results list if available */}
                            {(order as any).results && (order as any).results.length > 0 && (
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                                  Paramètres d'analyses biologiques :
                                </span>
                                <div className="overflow-hidden border border-slate-150 rounded-xl">
                                  <table className="min-w-full divide-y divide-slate-150 text-[11px]">
                                    <thead className="bg-slate-50 text-slate-500 font-bold">
                                      <tr>
                                        <th className="px-3 py-1.5 text-left">Analyse</th>
                                        <th className="px-3 py-1.5 text-center">Valeur</th>
                                        <th className="px-3 py-1.5 text-left">Norme</th>
                                        <th className="px-3 py-1.5 text-center">État</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-150 bg-white">
                                      {(order as any).results.map((res: any, idx: number) => {
                                        const isAbnormal = res.status === 'abnormal' || res.status === 'high' || res.status === 'low';
                                        return (
                                          <tr key={idx} className={isAbnormal ? 'bg-rose-50/40' : undefined}>
                                            <td className="px-3 py-1.5 font-bold text-slate-800">{res.test_name}</td>
                                            <td className="px-3 py-1.5 text-center font-extrabold text-slate-900">{res.value} {res.unit}</td>
                                            <td className="px-3 py-1.5 text-slate-500 font-mono font-semibold">{res.reference_range}</td>
                                            <td className="px-3 py-1.5 text-center">
                                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                                isAbnormal 
                                                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                              }`}>
                                                {isAbnormal ? 'ANORMAL' : 'NORMAL'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* BILLING INVOICES & PAYMENTS HISTORY */}
                  {activeTab === 'billing' && (
                    <div className="space-y-3">
                      {patientMoves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <FileText className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aucune facture enregistrée</p>
                          <p className="text-slate-400 text-[11px] mt-1">Ce patient n'a aucune facture ou acte enregistré dans la caisse.</p>
                        </div>
                      ) : (
                        patientMoves.map((move) => (
                          <div 
                            key={move.id} 
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono font-black text-slate-900 uppercase">
                                  {move.name || `PROV-${move.id}`}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                                  move.payment_state === 'paid' 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : move.payment_state === 'partial'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                                }`}>
                                  {move.payment_state === 'paid' ? 'Payé' : move.payment_state === 'partial' ? 'Partiel' : 'Non Payé'}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-800 mt-1">
                                Total Actes : <span className="font-extrabold">{formatCurrency(move.amount_total)}</span>
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Date de facturation : {formatDate(move.date)}
                              </p>
                            </div>

                            <button
                              onClick={() => onOpenPdf(move)}
                              className="flex items-center space-x-1.5 self-start md:self-center bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Voir le Reçu</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* DETAILS IDENTITY FORM */}
                  {activeTab === 'info' && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Nom complet</span>
                          <span className="text-slate-800 font-extrabold text-sm">{patient.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Identifiant dossier unique (NDM)</span>
                          <span className="text-slate-800 font-extrabold text-sm font-mono">{patient.ndm || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Date de naissance</span>
                          <span className="text-slate-800 font-semibold">{patient.birth_date || 'Non renseignée'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Sexe</span>
                          <span className="text-slate-800 font-semibold uppercase">{patient.gender?.toUpperCase() === 'M' ? 'Masculin' : patient.gender?.toUpperCase() === 'F' ? 'Féminin' : 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Téléphone</span>
                          <span className="text-slate-800 font-semibold">{patient.phone || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Email</span>
                          <span className="text-slate-800 font-semibold">{patient.email || 'Non renseigné'}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">Adresse de résidence</span>
                        <p className="text-slate-800 font-medium">
                          {[patient.street, patient.city, patient.zip].filter(Boolean).join(', ') || 'Aucune adresse renseignée.'}
                        </p>
                      </div>

                      {patient.insurance_id && (
                        <div className="border-t border-slate-200 pt-3 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                          <span className="text-emerald-800 font-extrabold block uppercase text-[10px] tracking-wider">Couverture d'assurance santé</span>
                          <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px]">
                            <div>
                              <span className="text-slate-500">ID Organisme : </span>
                              <strong className="text-slate-800">{patient.insurance_id}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">N° d'affilié : </span>
                              <strong className="text-slate-800">{patient.insurance_policy_number || (patient as any).insurance_card_number || 'N/A'}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50 gap-3">
            <button
              onClick={onClose}
              style={{ borderColor: company.primary_color || '#0f172a', color: company.primary_color || '#0f172a' }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border rounded-xl transition hover:bg-slate-100"
            >
              Fermer le dossier
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
