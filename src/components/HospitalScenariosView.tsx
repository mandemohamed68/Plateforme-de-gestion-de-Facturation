import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  CreditCard,
  FlaskConical,
  BedDouble,
  ShieldCheck,
  Layers,
  Search,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  Lock,
  Stethoscope,
  Pill,
  ChevronRight,
  Filter,
  Check,
  X,
  ExternalLink,
  ClipboardList,
  AlertCircle,
  Database,
  Building2,
  CheckCircle,
  Hash,
  UserCheck,
  Zap,
} from 'lucide-react';
import { HOSPITAL_SCENARIOS, HOSPITAL_RULES, FLUX_COMPLET_STEPS, HospitalScenario, HospitalRule, FluxCompletStep } from '../data/hospitalScenariosData';
import { JournalEntry, ResPartner } from '../types';
import { FhirSandbox } from './FhirSandbox';

const FHIR_PATIENT_RESPONSE_JSON = `{
  "resourceType": "Patient",
  "id": "1",
  "identifier": [
    {
      "use": "official",
      "system": "urn:oid:1.2.3.4.5.6.7.8.9",
      "value": "NDM-0048"
    }
  ],
  "active": true,
  "name": [{ "family": "Diallo", "given": ["Awa"] }],
  "gender": "female",
  "birthDate": "1994-04-12"
}`;

const FHIR_BUNDLE_TRANSACTION_JSON = `{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "new-pat-10",
        "name": [{ "family": "Sow", "given": ["Mamadou"] }]
      },
      "request": { "method": "POST", "url": "Patient" }
    }
  ]
}`;

// =========================================================================
// M3.1: INTERACTIVE BILLING, ARBITRAGE & PAYMENT SIMULATOR
// =========================================================================
const M31InteractiveSimulator: React.FC = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Consultation Médecine Générale (CS1)', price: 10000, action: 'faire', service: 'Clinique' },
    { id: 2, name: 'Bilan Hémogramme NFS (C1)', price: 15000, action: 'faire', service: 'Laboratoire' },
    { id: 3, name: 'Radiographie Pulmonaire (R1)', price: 25000, action: 'différer', service: 'Imagerie' },
    { id: 4, name: 'Paracétamol 500mg (Boîte de 20)', price: 2000, action: 'annuler', service: 'Pharmacie' },
  ]);

  const [insurance, setInsurance] = useState<string>('mugef-ci'); // none, mugef-ci, nsia
  const [coverageRate, setCoverageRate] = useState<number>(80);

  const [paymentMethod, setPaymentMethod] = useState<string>('wave'); // cash, wave, orange, moov
  const [phone, setPhone] = useState<string>('0708091011');
  const [txnRef, setTxnRef] = useState<string>('REF-' + Math.floor(100000 + Math.random() * 900000));
  const [statusMessage, setStatusMessage] = useState<'idle' | 'processing' | 'success'>('idle');

  const baseTotal = useMemo(() => {
    return items
      .filter((it) => it.action === 'faire')
      .reduce((sum, it) => sum + it.price, 0);
  }, [items]);

  const deferredTotal = useMemo(() => {
    return items
      .filter((it) => it.action === 'différer')
      .reduce((sum, it) => sum + it.price, 0);
  }, [items]);

  const cancelledTotal = useMemo(() => {
    return items
      .filter((it) => it.action === 'annuler')
      .reduce((sum, it) => sum + it.price, 0);
  }, [items]);

  const insuranceShare = useMemo(() => {
    if (insurance === 'none') return 0;
    return Math.round((baseTotal * coverageRate) / 100);
  }, [baseTotal, insurance, coverageRate]);

  const patientShare = useMemo(() => {
    return baseTotal - insuranceShare;
  }, [baseTotal, insuranceShare]);

  const electronicFee = useMemo(() => {
    if (paymentMethod === 'cash') return 0;
    return Math.round(patientShare * 0.01); // 1% fee for operator
  }, [paymentMethod, patientShare]);

  const grandTotal = useMemo(() => {
    return patientShare + electronicFee;
  }, [patientShare, electronicFee]);

  const handleActionChange = (id: number, action: 'faire' | 'différer' | 'annuler') => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, action } : it)));
  };

  const handleSimulatePayment = () => {
    setStatusMessage('processing');
    setTimeout(() => {
      setStatusMessage('success');
    }, 1200);
  };

  const handleReset = () => {
    setStatusMessage('idle');
    setTxnRef('REF-' + Math.floor(100000 + Math.random() * 900000));
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
      {statusMessage === 'success' ? (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-emerald-900 text-sm">Paiement Enregistré avec Succès !</h4>
          <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
            La facture a été passée à l'état <strong className="font-black">Payé (posted)</strong>. Le dossier d'audit R02 a été mis à jour et les reçus ont été transmis de manière asynchrone aux plateaux techniques.
          </p>
          <div className="bg-white p-3 rounded-lg border border-emerald-100 text-left font-mono text-[10px] text-slate-600 space-y-1 max-w-sm mx-auto">
            <div>• N° Facture : {txnRef}</div>
            <div>• Part Patient Encaissée : {patientShare.toLocaleString('fr-FR')} FCFA</div>
            <div>• Frais Opérateur (1%) : {electronicFee.toLocaleString('fr-FR')} FCFA</div>
            <div>• Prise en Charge Garant ({insurance.toUpperCase()}) : {insuranceShare.toLocaleString('fr-FR')} FCFA ({coverageRate}%)</div>
            <div>• Opérateur : {paymentMethod.toUpperCase()}</div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all"
          >
            Nouvel Encaissement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Basket List with Action Toggle buttons */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex justify-between">
              <span>Lignes de Prestation (Arbitrage Clinique)</span>
              <span>Arbitrage</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((it) => (
                <div key={it.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{it.name}</div>
                    <div className="text-[10px] text-slate-500">Service : {it.service} &bull; <strong className="text-slate-700">{it.price.toLocaleString('fr-FR')} FCFA</strong></div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleActionChange(it.id, 'faire')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                        it.action === 'faire'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Faire
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActionChange(it.id, 'différer')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                        it.action === 'différer'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Différer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActionChange(it.id, 'annuler')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                        it.action === 'annuler'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insurance Arbitrage (R05) */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Arbitrage Tiers-Payant / Garant (R05)</label>
              <select
                value={insurance}
                onChange={(e) => {
                  setInsurance(e.target.value);
                  if (e.target.value === 'none') setCoverageRate(0);
                  else if (e.target.value === 'mugef-ci') setCoverageRate(80);
                  else if (e.target.value === 'nsia') setCoverageRate(70);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800"
              >
                <option value="none">Aucune Assurance (100% Patient)</option>
                <option value="mugef-ci">MUGEF-CI (Mutuelle Fonctionnaires)</option>
                <option value="nsia">NSIA Assurances (Assurance Privée)</option>
              </select>
            </div>

            {insurance !== 'none' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Taux de Prise en Charge (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coverageRate}
                  onChange={(e) => setCoverageRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 text-xs">
            <label className="block font-bold text-slate-700">Méthode d'Encaissement & Frais (R08)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Espèces', desc: '0% frais' },
                { id: 'wave', label: 'Wave Mobile Money', desc: '+1% frais' },
                { id: 'orange', label: 'Orange Money', desc: '+1% frais' },
                { id: 'moov', label: 'Moov Money', desc: '+1% frais' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    paymentMethod === m.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold">{m.label}</div>
                  <div className="text-[9px] opacity-75">{m.desc}</div>
                </button>
              ))}
            </div>

            {paymentMethod !== 'cash' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">N° de Téléphone Mobile Money</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">N° de Transaction Unique (R08)</label>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing breakdown summary */}
          <div className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-400">
              <span>Montant Arbitré Clinique (Faire) :</span>
              <span>{baseTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {insurance !== 'none' && (
              <div className="flex justify-between text-slate-300">
                <span>Part Prise en Charge Garant ({insurance.toUpperCase()} - {coverageRate}%) :</span>
                <span>-{insuranceShare.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-200">
              <span>Ticket Modérateur Patient :</span>
              <span>{patientShare.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {paymentMethod !== 'cash' && (
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>Frais Réseau Electronique (1% Opérateur R08) :</span>
                <span>+{electronicFee.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-[14px] text-emerald-400 pt-2 border-t border-slate-700">
              <span>Total Final Net Encaissé :</span>
              <span>{grandTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          {/* Simulate Action buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleSimulatePayment}
              disabled={statusMessage === 'processing'}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {statusMessage === 'processing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Traitement de la Transaction...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Valider l'Arbitrage & Encaisser</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// M3.2: INTERACTIVE CASHIER SESSION & BILLETAGE SIMULATOR
// =========================================================================
const M32InteractiveSimulator: React.FC = () => {
  const [openingBalance, setOpeningBalance] = useState<number>(25000);
  const [sessionState, setSessionState] = useState<'open' | 'closed'>('open');
  
  // Physical counted banknotes and coins
  const [billCounts, setBillCounts] = useState<Record<number, number>>({
    10000: 22, // 220,000
    5000: 8,   // 40,000
    2000: 5,   // 10,000
    1000: 5,   // 5,000
    500: 4,    // 2,000
    250: 0,
    100: 10,   // 1,000
    50: 10,    // 500
    25: 0,
    10: 0,
    5: 0,
  });

  const [systemTheoreticalBalance, setSystemTheoreticalBalance] = useState<number>(278500); // Expected from system logs
  const [justification, setJustification] = useState<string>('');

  const physicalTotal = useMemo(() => {
    return Object.entries(billCounts).reduce<number>((sum, [denom, count]) => {
      return sum + Number(denom) * (count as number);
    }, 0);
  }, [billCounts]);

  const discrepancy = useMemo(() => {
    return physicalTotal - systemTheoreticalBalance;
  }, [physicalTotal, systemTheoreticalBalance]);

  const handleCountChange = (denom: number, val: string) => {
    const num = val === '' ? 0 : parseInt(val, 10);
    setBillCounts((prev) => ({ ...prev, [denom]: isNaN(num) ? 0 : num }));
  };

  const handleCloseSession = () => {
    setSessionState('closed');
  };

  const handleResetSession = () => {
    setSessionState('open');
    setJustification('');
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
      {sessionState === 'closed' ? (
        <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg text-center space-y-3">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <h4 className="font-bold text-purple-900 text-sm">Session Caisse Clôturée avec Succès !</h4>
          <p className="text-xs text-purple-700 leading-relaxed max-w-md mx-auto">
            Bordereau de Caisse Z généré de manière sécurisée et irréversible. Toutes les données de ventes ont été figées dans l'audit R02.
          </p>

          <div className="bg-white p-3 rounded-lg border border-purple-100 text-left font-mono text-[10px] text-slate-600 space-y-1 max-w-sm mx-auto">
            <div className="font-bold text-[11px] text-purple-900 border-b border-purple-100 pb-1 mb-1 text-center">BORDEREAU Z JOURNALIER</div>
            <div>• Fond Initial : {openingBalance.toLocaleString('fr-FR')} FCFA</div>
            <div>• Solde Théorique Système : {systemTheoreticalBalance.toLocaleString('fr-FR')} FCFA</div>
            <div>• Total Physiquement Compté : {physicalTotal.toLocaleString('fr-FR')} FCFA</div>
            <div className={`font-bold ${discrepancy === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              • Écart de Clôture : {discrepancy.toLocaleString('fr-FR')} FCFA {discrepancy !== 0 && `(Justifié : ${justification})`}
            </div>
          </div>

          <button
            onClick={handleResetSession}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-all"
          >
            Réouvrir la Session de Test
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {/* Initial Session Parameter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fond de Caisse d'Ouverture Forcé</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Solde Théorique du Système (Transactions)</label>
              <input
                type="number"
                value={systemTheoreticalBalance}
                onChange={(e) => setSystemTheoreticalBalance(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-mono"
              />
            </div>
          </div>

          {/* Interactive Denominations Grid */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="font-bold text-slate-800 border-b border-slate-100 pb-2">
              Feuille de Billetage - Saisie Physique des Coupures (R07)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[10000, 5000, 2000, 1000, 500, 100, 50].map((denom) => (
                <div key={denom} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="font-extrabold text-slate-600 text-[10px]">{denom.toLocaleString('fr-FR')} FCFA</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-slate-400 text-[10px]">Qté :</span>
                    <input
                      type="number"
                      min="0"
                      value={billCounts[denom] || 0}
                      onChange={(e) => handleCountChange(denom, e.target.value)}
                      className="w-full p-1 bg-white border border-slate-200 rounded font-bold font-mono text-center text-xs"
                    />
                  </div>
                  <div className="text-[10px] font-bold text-indigo-700 mt-1 text-right">
                    {((billCounts[denom] || 0) * denom).toLocaleString('fr-FR')} F
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time disparity analyzer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Solde Théorique</span>
              <span className="text-base font-extrabold text-slate-800 font-mono">{systemTheoreticalBalance.toLocaleString('fr-FR')} FCFA</span>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-center">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide block">Total Physique Compté</span>
              <span className="text-base font-extrabold text-indigo-950 font-mono">{physicalTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>

            <div className={`p-3 rounded-xl border text-center ${
              discrepancy === 0 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wide block">Écart de Caisse</span>
              <span className="text-base font-extrabold font-mono">
                {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Red Flag & Justification Box */}
          {discrepancy !== 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 animate-pulse">
              <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Alerte R07 : Écart de Billetage Constaté !
              </div>
              <p className="text-[10px] text-rose-800">
                Vous devez obligatoirement spécifier une note d'explication pour l'audit comptable avant d'être autorisé à clôturer.
              </p>
              <textarea
                placeholder="Explication de l'écart de caisse..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full p-2 bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs text-slate-800 font-medium"
                rows={2}
              />
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleCloseSession}
              disabled={discrepancy !== 0 && !justification.trim()}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Signer le Bordereau Z & Clôturer la Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// M4.2: TECHNICAL RESULTS ENTRY & BIOLOGICAL VALIDATION SIMULATOR
// =========================================================================
const M42InteractiveSimulator: React.FC = () => {
  const [role, setRole] = useState<'technician' | 'biologist'>('technician');
  const [isValidated, setIsValidated] = useState<boolean>(false);
  
  const [results, setResults] = useState([
    { code: 'HGB', name: 'Hémoglobine (HGB)', value: '11.2', unit: 'g/dL', min: 12.0, max: 16.0 },
    { code: 'GLY', name: 'Glycémie à jeun', value: '1.45', unit: 'g/L', min: 0.70, max: 1.10 },
    { code: 'CHOL', name: 'Cholestérol Total', value: '1.95', unit: 'g/L', min: 1.50, max: 2.00 },
  ]);

  const handleValueChange = (code: string, val: string) => {
    if (isValidated || role !== 'technician') return;
    setResults((prev) => prev.map((r) => (r.code === code ? { ...r, value: val } : r)));
  };

  const handleValidate = () => {
    if (role !== 'biologist') return;
    setIsValidated(true);
  };

  const handleReset = () => {
    setIsValidated(false);
    setResults([
      { code: 'HGB', name: 'Hémoglobine (HGB)', value: '11.2', unit: 'g/dL', min: 12.0, max: 16.0 },
      { code: 'GLY', name: 'Glycémie à jeun', value: '1.45', unit: 'g/L', min: 0.70, max: 1.10 },
      { code: 'CHOL', name: 'Cholestérol Total', value: '1.95', unit: 'g/L', min: 1.50, max: 2.00 },
    ]);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
      {/* Role Switcher simulating RBAC (R06) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-slate-700">Simuler le Rôle Actuel (RBAC) :</span>
          <p className="text-[10px] text-slate-500">Seuls les Biologistes certifiés peuvent signer médicalement les résultats.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setRole('technician')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              role === 'technician' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Technicien Labo
          </button>
          <button
            type="button"
            onClick={() => setRole('biologist')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              role === 'biologist' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Médecin Biologiste
          </button>
        </div>
      </div>

      {/* Lab Results Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Paramètre Analysé</th>
              <th className="py-2.5 px-3">Valeur Saisie</th>
              <th className="py-2.5 px-3">Normes Physiologiques</th>
              <th className="py-2.5 px-3 text-center">Alerte R03</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((r) => {
              const valNum = parseFloat(r.value);
              const isAbnormal = isNaN(valNum) || valNum < r.min || valNum > r.max;
              return (
                <tr key={r.code} className="hover:bg-slate-50/50 transition-all">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800">{r.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">CODE: {r.code}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={r.value}
                        onChange={(e) => handleValueChange(r.code, e.target.value)}
                        disabled={isValidated || role !== 'technician'}
                        className={`w-20 p-1.5 border rounded text-center font-bold font-mono ${
                          isValidated 
                            ? 'bg-slate-100 border-slate-200 text-slate-500' 
                            : role !== 'technician' 
                            ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                            : 'bg-white border-slate-300 text-slate-800 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                      <span className="text-slate-500 font-medium text-[11px]">{r.unit}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {r.min.toFixed(2)} - {r.max.toFixed(2)} {r.unit}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {isAbnormal ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-extrabold text-[9px] border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>PATHOLOGIQUE</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-200">
                        NORMAL
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Alert / Status Container */}
      {isValidated ? (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            Résultats Validés & Verrouillés de manière Irréversible !
          </div>
          <p className="text-[10px] leading-relaxed">
            Le compte-rendu d'analyse est maintenant figé et publié au format standardisé FHIR (DiagnosticReport). Les alertes critiques ont été acheminées sur la Vue Patient 360° (R09).
          </p>
          <div className="pt-2 flex justify-start">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-200 font-bold text-[10px]"
            >
              Réinitialiser le Simulateur
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="font-bold text-slate-700">Statut Actuel :</span>
            <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">Saisie en cours (R06)</span>
          </div>

          <div>
            {role === 'biologist' ? (
              <button
                onClick={handleValidate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Signer Médicalement</span>
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 bg-slate-200 text-slate-400 font-bold rounded-lg cursor-not-allowed flex items-center gap-1.5"
                title="Bouton verrouillé : vous devez simuler le rôle Biologiste pour valider"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Signature Biologiste Requise</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


interface HospitalScenariosViewProps {
  onNavigateToView?: (view: string) => void;
  currentUserId?: number;
  currentUserName?: string;
  onSelectPatient?: (patient: ResPartner) => void;
}

export const HospitalScenariosView: React.FC<HospitalScenariosViewProps> = ({
  onNavigateToView,
  currentUserId = 1,
  currentUserName = 'Administrateur SIH',
  onSelectPatient,
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'flux' | 'rules' | 'patient360' | 'journal' | 'fhir' | 'specs'>('specs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<HospitalScenario | null>(null);
  
  // Execution state
  const [isRunningScenario, setIsRunningScenario] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    scenarioId: string;
    success: boolean;
    message: string;
    details?: string;
    targetView?: string;
    createdEntity?: any;
    timestamp: string;
  } | null>(null);

  // Full flux state
  const [fluxCurrentStep, setFluxCurrentStep] = useState<number>(1);
  const [isAutoPlayingFlux, setIsAutoPlayingFlux] = useState(false);
  const [fluxLog, setFluxLog] = useState<Array<{ step: number; title: string; actor: string; timestamp: string }>>([]);

  // Patient 360 State
  const [searchNdm, setSearchNdm] = useState('NDM-0048');
  const [patient360Data, setPatient360Data] = useState<any | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [error360, setError360] = useState<string | null>(null);

  // Journal State
  const [journalLogs, setJournalLogs] = useState<JournalEntry[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [journalFilterScenario, setJournalFilterScenario] = useState('');
  const [journalFilterStatus, setJournalFilterStatus] = useState<'all' | 'succes' | 'alerte' | 'bloque'>('all');

  // Categories for filter
  const categories = [
    { id: 'all', label: 'Tous les Scénarios (50)' },
    { id: 'Accueil & Triage', label: 'Accueil & Triage' },
    { id: 'Consultation & Urgences', label: 'Consultation & Urgences' },
    { id: 'Hospitalisation & Séjour', label: 'Hospitalisation' },
    { id: 'Facturation & Caisse', label: 'Facturation & Caisse' },
    { id: 'Pharmacie & Stock', label: 'Pharmacie' },
    { id: 'Laboratoire & Imagerie', label: 'Laboratoire & Imagerie' },
    { id: 'Administration & Clôture', label: 'Administration' },
  ];

  // Load journal logs
  const fetchJournal = async () => {
    setLoadingJournal(true);
    try {
      let url = '/api/journal?limit=200';
      if (journalFilterScenario) {
        url += `&scenario_id=${encodeURIComponent(journalFilterScenario)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJournalLogs(data.journal || []);
      }
    } catch (err: any) {
      console.warn('Erreur chargement journal (mode autonome):', err?.message || err);
    } finally {
      setLoadingJournal(false);
    }
  };

  // Load patient 360 data
  const fetchPatient360 = async (identifier: string) => {
    if (!identifier.trim()) return;
    setLoading360(true);
    setError360(null);
    try {
      const res = await fetch(`/api/patient-360/${encodeURIComponent(identifier.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setPatient360Data(data);
      } else {
        const err = await res.json();
        setError360(err.error || 'Patient introuvable pour ce numéro de dossier.');
        setPatient360Data(null);
      }
    } catch (err: any) {
      setError360(err.message || 'Erreur de connexion lors de la recherche 360°.');
      setPatient360Data(null);
    } finally {
      setLoading360(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'journal') {
      fetchJournal();
    } else if (activeTab === 'patient360') {
      fetchPatient360(searchNdm);
    }
  }, [activeTab]);

  // Execute scenario live
  const handleRunScenario = async (scenario: HospitalScenario) => {
    setIsRunningScenario(scenario.id);
    setExecutionResult(null);
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          user_name: currentUserName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExecutionResult({
          scenarioId: scenario.id,
          success: true,
          message: `Scénario ${scenario.id} (${scenario.nom}) exécuté avec succès !`,
          details: data.executionDetails || `Règles appliquées : ${scenario.regles.join(', ')}`,
          targetView: data.targetView || scenario.targetView,
          createdEntity: data.createdEntity,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
        });
        if (activeTab === 'journal') {
          fetchJournal();
        }
      } else {
        setExecutionResult({
          scenarioId: scenario.id,
          success: false,
          message: data.error || `Erreur lors de l'exécution du scénario ${scenario.id}`,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
        });
      }
    } catch (err: any) {
      setExecutionResult({
        scenarioId: scenario.id,
        success: false,
        message: err.message || 'Erreur de communication avec le serveur',
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      });
    } finally {
      setIsRunningScenario(null);
    }
  };

  // Run single step in Flux Complet
  const handleRunFluxStep = async (stepNum: number) => {
    const step = FLUX_COMPLET_STEPS.find((s) => s.step === stepNum);
    if (!step) return;

    try {
      const res = await fetch('/api/flux-complet/run-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNum }),
      });
      if (res.ok) {
        setFluxLog((prev) => [
          {
            step: stepNum,
            title: step.titre,
            actor: step.acteur,
            timestamp: new Date().toLocaleTimeString('fr-FR'),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Erreur flux step:', err);
    }
  };

  // Filtered scenarios
  const filteredScenarios = useMemo(() => {
    return HOSPITAL_SCENARIOS.filter((sc) => {
      const matchesSearch =
        searchQuery === '' ||
        sc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sc.description_courte && sc.description_courte.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sc.declencheur.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.acteur.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.regles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || sc.acteur === selectedCategory;
      const matchesRole = selectedRole === 'all' || sc.acteur.toLowerCase().includes(selectedRole.toLowerCase());

      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [searchQuery, selectedCategory, selectedRole]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header / Moteur de Scénarios */}
      <div className="bg-white text-slate-900 rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Moteur des 50 Scénarios & Règles Métier (R01 - R10)
              </h1>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Référentiel SIH
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Moteur d'exécution, traçabilité intégrale (R02), conformité des 10 règles strictes du SIH,
              vue 360° du patient (R09) et orchestration du parcours de soins en 11 étapes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('flux');
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Parcours 11 Étapes</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('patient360');
                fetchPatient360(searchNdm);
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>Vue Patient 360° (R09)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('journal');
                fetchJournal();
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
              <span>Journal Audit (R02)</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Scénarios Testés</div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>50 / 50</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">100% Validé</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Règles Métier Clés</div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>10 / 10</span>
              <span className="text-[10px] text-slate-700 font-semibold bg-slate-200 px-2 py-0.2 rounded">R01 - R10</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Traçabilité (R02)</div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span className="text-emerald-700">Journal Actif</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Flux Hospitalier</div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>11 Étapes</span>
              <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.2 rounded border border-slate-200">End-to-End</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Feedback Notification Card */}
      {executionResult && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all shadow-md ${
            executionResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {executionResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>{executionResult.message}</span>
                <span className="text-xs opacity-75">({executionResult.timestamp})</span>
              </div>
              {executionResult.details && (
                <div className="text-xs mt-1 text-slate-700 bg-white/70 p-2 rounded border border-slate-200 font-mono">
                  {executionResult.details}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {executionResult.targetView && onNavigateToView && (
              <button
                onClick={() => onNavigateToView(executionResult.targetView!)}
                className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Ouvrir l'écran dédié</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setExecutionResult(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('specs')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'specs'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="font-bold text-indigo-700">Refonte Complète A-Z & Modales</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-800 font-extrabold">P1-P6</span>
        </button>

        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'scenarios'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matrice des 50 Scénarios (S01 - S50)</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">50</span>
        </button>

        <button
          onClick={() => setActiveTab('flux')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'flux'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Parcours Complet de Référence (11 Étapes)</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>10 Règles Métier Hospitalières (R01 - R10)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('patient360');
            fetchPatient360(searchNdm);
          }}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'patient360'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>Vue Patient 360° (R09)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('journal');
            fetchJournal();
          }}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'journal'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-purple-600" />
          <span>Journal d'Audit & Traçabilité (R02)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('fhir');
          }}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'fhir'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-indigo-700">Sandbox API HL7 FHIR R4</span>
          <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-emerald-100 text-emerald-800 font-extrabold animate-pulse">LIVE</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: SPECIFICATIONS & LIVE SIMULATIONS (A-Z REDESIGN) */}
      {/* ========================================================================= */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* Main Specifications Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Mission de Refonte Globale A-Z
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Spécifications Fonctionnelles & Modales Actives
                </h2>
                <p className="text-xs text-slate-500 max-w-3xl leading-relaxed mt-1">
                  Ce tableau de bord technique rassemble le modèle relationnel PostgreSQL, les points d'entrée de l'API interopérable HL7 FHIR R4, et les simulateurs interactifs de nos trois modales clinico-financières prioritaires.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Conforme FHIR R4
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  PostgreSQL Prêt
                </span>
              </div>
            </div>

            {/* Implementation Priorities Roadmap */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 text-xs">
              {[
                { id: 'P1', label: 'Caisse & Arbitrage', desc: 'Modale M3.1 & M3.2', color: 'border-indigo-200 bg-indigo-50/30 text-indigo-950' },
                { id: 'P2', label: 'Patients & Accueil', desc: 'Identité unique NDM', color: 'border-blue-200 bg-blue-50/30 text-blue-950' },
                { id: 'P3', label: 'Dossier Clinique', desc: 'Consultations & DME', color: 'border-amber-200 bg-amber-50/30 text-amber-950' },
                { id: 'P4', label: 'Plateau Labo & Radio', desc: 'Modale M4.2 & Normes', color: 'border-emerald-200 bg-emerald-50/30 text-emerald-950' },
                { id: 'P5', label: 'Pharmacie Dispens.', desc: 'Ordonnances & Stock', color: 'border-rose-200 bg-rose-50/30 text-rose-950' },
                { id: 'P6', label: 'Logs Audit & Rapports', desc: 'Bordereau Z & R02', color: 'border-purple-200 bg-purple-50/30 text-purple-950' },
              ].map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex flex-col justify-between gap-1 ${p.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[13px]">{p.id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  </div>
                  <div>
                    <div className="font-bold text-[11px] truncate">{p.label}</div>
                    <div className="text-[9px] opacity-75 truncate">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Block Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Nav Pane - 4 cols */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Structure & Interopérabilité</span>
                
                <button
                  onClick={() => {
                    const el = document.getElementById('specs-db-schema');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    1. Schéma de Base PostgreSQL
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('specs-fhir-endpoints');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    2. Endpoints API HL7 FHIR
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Simulateurs de Modales UI (P1 & P4)</span>

                <button
                  onClick={() => {
                    const el = document.getElementById('specs-modal-m31');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 text-left rounded-lg bg-indigo-50/30 hover:bg-indigo-50/60 border border-indigo-200 text-xs font-bold text-indigo-950 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    M3.1 : Arbitrage & Mobile Money
                  </span>
                  <span className="px-1 py-0.5 text-[9px] rounded bg-indigo-200 text-indigo-950 font-black font-mono">P1</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('specs-modal-m32');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 text-left rounded-lg bg-purple-50/30 hover:bg-purple-50/60 border border-purple-200 text-xs font-bold text-purple-950 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    M3.2 : Sessions & Billetage
                  </span>
                  <span className="px-1 py-0.5 text-[9px] rounded bg-purple-200 text-purple-950 font-black font-mono">P1</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('specs-modal-m42');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 text-left rounded-lg bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    M4.2 : Saisie & Validation Labo
                  </span>
                  <span className="px-1 py-0.5 text-[9px] rounded bg-emerald-200 text-emerald-950 font-black font-mono">P4</span>
                </button>
              </div>

              {/* Offline mode indicator block */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mode Hors-ligne Activé
                </span>
                <p className="text-[10px] text-emerald-900 leading-relaxed">
                  Conformément aux contraintes, un miroir de synchronisation bidirectionnel et un cache d'authentification crypté garantissent la continuité de service en cas d'interruption réseau.
                </p>
              </div>
            </div>

            {/* Right Interactive Canvas - 8 cols */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* SECTION 1: DATABASE SCHEMA DESCRIPTION */}
              <div id="specs-db-schema" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 scroll-mt-6">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Database className="w-4 h-4 text-indigo-600" />
                  1. Modèle Relationnel PostgreSQL / Drizzle Schema
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Voici l'implémentation logique de la structure de base de données. Elle s'inspire du schéma relationnel standard d'Odoo ERP pour le SIH.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      name: 'res_partner',
                      desc: 'Dossier unique patient, identifiants NDM et couverture d\'assurance.',
                      columns: [
                        { name: 'id', type: 'serial PRIMARY KEY' },
                        { name: 'numero_dossier', type: 'varchar(64) UNIQUE NOT NULL (NDM)' },
                        { name: 'name', type: 'varchar(255) NOT NULL' },
                        { name: 'birth_date', type: 'date' },
                        { name: 'gender', type: 'varchar(1) (M / F)' },
                        { name: 'garant_id', type: 'integer REFERENCES res_partner(id) (Tiers-Payeur)' },
                        { name: 'taux_couverture', type: 'integer DEFAULT 0 (ex: 80 pour 80%)' }
                      ]
                    },
                    {
                      name: 'account_move',
                      desc: 'Factures de Caisse d\'hospitalisation, d\'admission ou de pharmacie.',
                      columns: [
                        { name: 'id', type: 'serial PRIMARY KEY' },
                        { name: 'name', type: 'varchar(64) UNIQUE (ex: FA-2026-09-0012)' },
                        { name: 'partner_id', type: 'integer REFERENCES res_partner(id)' },
                        { name: 'state', type: 'varchar(32) DEFAULT \'draft\' (\'draft\', \'posted\', \'paid\', \'cancelled\')' },
                        { name: 'amount_untaxed', type: 'integer NOT NULL' },
                        { name: 'amount_tax', type: 'integer DEFAULT 0' },
                        { name: 'amount_total', type: 'integer NOT NULL' },
                        { name: 'amount_insurance_part', type: 'integer (Calculé automatiquement R05)' },
                        { name: 'amount_patient_part', type: 'integer (Ticket modérateur restant)' },
                        { name: 'payment_state', type: 'varchar(32) (\'not_paid\', \'partial\', \'paid\')' }
                      ]
                    },
                    {
                      name: 'lab_exam_order',
                      desc: 'Demandes d\'examens cliniques, prélèvements et validation.',
                      columns: [
                        { name: 'id', type: 'serial PRIMARY KEY' },
                        { name: 'order_number', type: 'varchar(64) UNIQUE' },
                        { name: 'patient_id', type: 'integer REFERENCES res_partner(id)' },
                        { name: 'state', type: 'varchar(32) (\'draft\', \'sampled\', \'results_entered\', \'validated\')' },
                        { name: 'technician_id', type: 'integer REFERENCES res_users(id)' },
                        { name: 'biologist_id', type: 'integer REFERENCES res_users(id) (Médecin validateur R06)' },
                        { name: 'date_sampling', type: 'timestamp' },
                        { name: 'date_validation', type: 'timestamp' }
                      ]
                    }
                  ].map((table) => (
                    <div key={table.name} className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center font-mono">
                        <span className="font-extrabold text-indigo-950">Table: {table.name}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">PostgreSQL</span>
                      </div>
                      <div className="p-3 bg-white space-y-2">
                        <p className="text-[11px] text-slate-500 italic">{table.desc}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                          {table.columns.map((col) => (
                            <div key={col.name} className="flex justify-between items-center bg-slate-50/50 p-1 px-2 rounded font-mono">
                              <span className="font-bold text-slate-700">{col.name}</span>
                              <span className="text-indigo-600 text-[10px]">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: FHIR REST ENDPOINTS */}
              <div id="specs-fhir-endpoints" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 scroll-mt-6">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  2. Points d'Accès de l'API REST HL7 FHIR R4
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  L'API REST interopérable est structurée selon le format de ressource HL7 FHIR R4. Testez les endpoints directement avec les payloads d'intégration.
                </p>

                <div className="space-y-4 text-xs font-mono">
                  {/* Endpoint 1 */}
                  <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold rounded text-[10px]">GET</span>
                        <span className="font-bold text-xs">/api/fhir/Patient?identifier=NDM-0048</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">R09 (Everything)</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Réponse FHIR Attendue (Extrait JSON)</span>
                      <pre className="text-[11px] text-indigo-200 bg-black/40 p-3 rounded-lg overflow-x-auto leading-relaxed">
{FHIR_PATIENT_RESPONSE_JSON}
                      </pre>
                    </div>
                  </div>

                  {/* Endpoint 2 */}
                  <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-600 text-white font-extrabold rounded text-[10px]">POST</span>
                        <span className="font-bold text-xs">/api/fhir/Bundle</span>
                      </div>
                      <span className="text-[10px] text-amber-400">Transaction atomique</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Payload de Transaction Soumis</span>
                      <pre className="text-[11px] text-indigo-200 bg-black/40 p-3 rounded-lg overflow-x-auto leading-relaxed">
{FHIR_BUNDLE_TRANSACTION_JSON}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: MODAL M3.1 SIMULATOR */}
              <div id="specs-modal-m31" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600 animate-pulse" />
                    M3.1 : Simulateur de Facturation, Arbitrage & Mobile Money
                  </h3>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded uppercase">Priorité P1</span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gère la file d'attente de facturation avec l'arbitrage des lignes (Faire, Différer, Annuler), le Tiers-Payant (R05) et les règlements électroniques forcés par référence unique (R08).
                </p>

                {/* Live interactive form inside the specs dashboard */}
                <M31InteractiveSimulator />
              </div>

              {/* SECTION 4: MODAL M3.2 SIMULATOR */}
              <div id="specs-modal-m32" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    M3.2 : Simulateur d'Ouverture/Clôture de Session & Billetage
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded uppercase">Priorité P1</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Force l'ouverture avec un fond de caisse valide, fournit une feuille de billetage instantanée avec calculatrice de coupures et détecte automatiquement tout écart par rapport au solde attendu.
                </p>

                {/* Live Interactive Simulator */}
                <M32InteractiveSimulator />
              </div>

              {/* SECTION 5: MODAL M4.2 SIMULATOR */}
              <div id="specs-modal-m42" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    M4.2 : Saisie des Résultats & Validation Biologique
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded uppercase">Priorité P4</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Sépare rigoureusement la saisie (Technicien) de la validation finale (Biologiste) conformément à la règle R06. Alerte en temps réel des valeurs anormales (hors limites physiologiques).
                </p>

                {/* Live Interactive Simulator */}
                <M42InteractiveSimulator />
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par ID (S01...), nom, acteur, règle (R01...), pathologie..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                <option value="all">Tous les Acteurs</option>
                <option value="Accueil">Agent d'accueil</option>
                <option value="Infirmier">Infirmier</option>
                <option value="Médecin">Médecin</option>
                <option value="Caissier">Caissier</option>
                <option value="Biologiste">Biologiste / Labo</option>
                <option value="Pharmacien">Pharmacien</option>
                <option value="Admin">Administrateur</option>
              </select>

              <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                {filteredScenarios.length} scénario(s)
              </div>
            </div>
          </div>

          {/* Scenario Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredScenarios.map((sc) => (
              <div
                key={sc.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                        {sc.id}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {sc.categorie}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {sc.acteur}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {sc.nom}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {sc.description}
                    </p>
                  </div>

                  {/* Rules Tags */}
                  <div className="flex flex-wrap items-center gap-1">
                    {sc.regles.map((r) => (
                      <span
                        key={r}
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {r}
                      </span>
                    ))}
                    <span className="text-[11px] text-slate-400 ml-auto font-mono">
                      Étape {sc.etape}
                    </span>
                  </div>

                  {/* Expected Result Box */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Résultat Attendu
                    </div>
                    <div className="text-slate-700 leading-snug">
                      {sc.resultatAttendu}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedScenario(sc)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-200/60 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Détails
                  </button>

                  <div className="flex items-center gap-1.5">
                    {sc.targetView && onNavigateToView && (
                      <button
                        onClick={() => onNavigateToView(sc.targetView!)}
                        title="Aller à l'écran du système"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleRunScenario(sc)}
                      disabled={isRunningScenario === sc.id}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      {isRunningScenario === sc.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Exécution...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Exécuter</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FULL REFERENCE WORKFLOW (11 STEPS) */}
      {/* ========================================================================= */}
      {activeTab === 'flux' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Parcours de Référence Hospitalier en 11 Étapes
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Déroulement complet et ordonné depuis l'accueil du patient jusqu'à la délivrance / sortie finale.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Run all steps sequentially
                    FLUX_COMPLET_STEPS.forEach((step, idx) => {
                      setTimeout(() => {
                        handleRunFluxStep(step.step);
                        setFluxCurrentStep(step.step);
                      }, idx * 600);
                    });
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Lancer Tout le Parcours (1 à 11)
                </button>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4 pt-4">
              {FLUX_COMPLET_STEPS.map((step) => {
                const isExecuted = fluxLog.some((l) => l.step === step.step);
                return (
                  <div
                    key={step.step}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isExecuted
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 font-mono shadow-sm ${
                          isExecuted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {isExecuted ? <Check className="w-5 h-5 stroke-[3]" /> : step.step}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">
                            Étape {step.step} : {step.titre}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {step.acteur}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 text-indigo-800 font-mono">
                            {step.menu}
                          </span>
                          {step.regles && step.regles.map((r) => (
                            <span key={r} className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800 font-mono">
                              {r}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleRunFluxStep(step.step)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Valider Étape {step.step}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 10 HOSPITAL RULES (R01 - R10) */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Les 10 Règles Métier Hospitalières Strictes (R01 à R10)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Chaque transaction médicale, financière ou biologique est strictement contrôlée et régie par ces règles fondamentales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOSPITAL_RULES.map((rule) => (
              <div
                key={rule.code}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      {rule.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {rule.titre}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Actif
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {rule.description}
                </p>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Modules & Services Applicables
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rule.applicable_modules.map((mod) => (
                      <span key={mod} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 text-xs">
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PATIENT 360 VIEW (R09) */}
      {/* ========================================================================= */}
      {activeTab === 'patient360' && (
        <div className="space-y-6">
          {/* Patient 360 Search Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Vue Patient 360° Instantanée (Règle R09)
                </h2>
                <p className="text-sm text-slate-600">
                  Accès instantané à l'ensemble du dossier médical : consultations, examens, hospitalisation en cours et statut financier.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchNdm}
                  onChange={(e) => setSearchNdm(e.target.value)}
                  placeholder="N° Dossier (NDM-0048...)"
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  onClick={() => fetchPatient360(searchNdm)}
                  disabled={loading360}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {loading360 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Charger 360°</span>
                </button>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 overflow-x-auto">
              <span className="font-semibold">Patients tests :</span>
              {['NDM-0048', 'NDM-0049', 'NDM-0050', 'NDM-0051', '1'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSearchNdm(preset);
                    fetchPatient360(preset);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded border border-slate-200 font-mono text-xs transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {error360 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error360}</span>
            </div>
          )}

          {patient360Data && (
            <div className="space-y-6">
              {/* Patient Banner Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                      {patient360Data.patient?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-900">
                          {patient360Data.patient?.name}
                        </h2>
                        <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono">
                          {patient360Data.dossier?.numero_dossier}
                        </span>
                        {patient360Data.alerte_hospitalisation ? (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            Hospitalisé : {patient360Data.hospitalisation_en_cours?.chambre} ({patient360Data.hospitalisation_en_cours?.id_lit})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                            Ambulatoire
                          </span>
                        )}
                        {patient360Data.alerte_impaye ? (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Alerte R04 : Solde impayé ({patient360Data.total_impaye.toLocaleString('fr-FR')} FCFA)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                            R04 Conforme : Aucun impayé
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                        <span>Genre : <strong>{patient360Data.patient?.gender === 'F' ? 'Féminin' : 'Masculin'}</strong></span>
                        <span>Date de naissance : <strong>{patient360Data.patient?.birth_date || 'N/A'}</strong></span>
                        <span>Téléphone : <strong>{patient360Data.patient?.phone || 'N/A'}</strong></span>
                        <span>Email : <strong>{patient360Data.patient?.email || 'N/A'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectPatient && (
                      <button
                        onClick={() => onSelectPatient(patient360Data.patient)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        Sélectionner ce patient
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges: Allergies & Antecedents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Allergies Connues (R03)
                    </div>
                    <div className="text-xs text-amber-800 mt-1">
                      {Array.isArray(patient360Data.allergies) ? patient360Data.allergies.join(', ') : patient360Data.allergies}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      Antécédents Médicaux & Chirurgicaux
                    </div>
                    <div className="text-xs text-slate-700 mt-1">
                      {Array.isArray(patient360Data.antecedents) ? patient360Data.antecedents.join(', ') : patient360Data.antecedents}
                    </div>
                  </div>
                </div>
              </div>

              {/* 360 Sections Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Col 1: Consultations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    Historique Consultations ({patient360Data.consultations?.length || 0})
                  </h3>

                  <div className="space-y-3">
                    {patient360Data.consultations && patient360Data.consultations.length > 0 ? (
                      patient360Data.consultations.map((c: any) => (
                        <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>{c.consultation_number || `CONS-#${c.id}`}</span>
                            <span className="text-[11px] text-slate-500">{new Date(c.consultation_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="text-indigo-700 font-medium">{c.doctor_name}</div>
                          <div className="text-slate-600 font-medium">Motif : {c.chief_complaint}</div>
                          {c.diagnosis && (
                            <div className="text-slate-800 font-bold bg-white p-1.5 rounded border border-slate-200">
                              Diagnostic : {c.diagnosis}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">Aucune consultation enregistrée</div>
                    )}
                  </div>
                </div>

                {/* Col 2: Examens Biologiques & Imagerie */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    Biologie & Imagerie (R06)
                  </h3>

                  <div className="space-y-3">
                    {patient360Data.examens_labo && patient360Data.examens_labo.length > 0 ? (
                      patient360Data.examens_labo.map((l: any) => (
                        <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>{l.order_number || `LAB-#${l.id}`}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              l.status === 'validated' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {l.status === 'validated' ? 'Validé (R06)' : 'En attente'}
                            </span>
                          </div>
                          <div className="text-slate-600">Prescripteur : {l.doctor_name || 'Dr. Prescripteur'}</div>
                          <div className="text-slate-800 font-medium">
                            {l.tests?.map((t: any) => t.name).join(', ') || 'Bilan biologique standard'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">Aucun examen de laboratoire</div>
                    )}

                    {/* Imagerie */}
                    {patient360Data.examens_imagerie && (
                      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1 text-xs">
                        <div className="font-semibold text-indigo-900 flex items-center justify-between">
                          <span>Radiographie Thoracique</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Validé</span>
                        </div>
                        <div className="text-slate-600 text-[11px]">Compte-rendu conforme. Absence de lésion évolutive.</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Facturation & Traçabilité */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    Facturation & Règlements (R04, R08)
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Facturé :</span>
                        <span className="font-bold text-slate-900">{patient360Data.total_facture.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Réglé :</span>
                        <span className="font-bold text-emerald-600">{(patient360Data.total_facture - patient360Data.total_impaye).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                        <span className="text-slate-800">Solde Restant Dû :</span>
                        <span className={patient360Data.total_impaye > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {patient360Data.total_impaye.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="font-semibold text-slate-700 text-xs">Factures du dossier :</div>
                      {patient360Data.factures && patient360Data.factures.length > 0 ? (
                        patient360Data.factures.slice(0, 3).map((f: any) => (
                          <div key={f.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-[11px]">
                            <span>{f.name}</span>
                            <span className="font-semibold">{f.amount_total.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic">Aucune facture émise</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT TRAIL JOURNAL (R02) */}
      {/* ========================================================================= */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Journal d'Audit & Traçabilité Hospitalière (Règle R02)
              </h2>
              <p className="text-sm text-slate-600">
                Chaque action, consultation, encaissement et validation est consigné avec horodatage strict, acteur et dossier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchJournal}
                disabled={loadingJournal}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingJournal ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Table of Journal Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Horodatage</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Scénario</th>
                    <th className="py-3 px-4">Dossier / Patient</th>
                    <th className="py-3 px-4">Acteur</th>
                    <th className="py-3 px-4">Détails de l'opération</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journalLogs.length > 0 ? (
                    journalLogs.map((log) => (
                      <tr key={log.id_log} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.date).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4">
                          {log.scenario_id ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px]">
                              {log.scenario_id}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.numero_dossier ? (
                            <div className="font-semibold text-slate-800">
                              <span className="font-mono text-indigo-700">{log.numero_dossier}</span>
                              {log.patient_nom && <span className="text-slate-500 block text-[10px]">{log.patient_nom}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                          {log.utilisateur_nom || 'Système'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md leading-relaxed">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              log.statut === 'alerte'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : log.statut === 'bloque'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {log.statut || 'succès'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        {loadingJournal ? 'Chargement du journal d\'audit...' : 'Aucun enregistrement dans le journal'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fhir' && (
        <div className="space-y-4">
          <FhirSandbox />
        </div>
      )}

      {/* Detail Modal for Selected Scenario */}
      {selectedScenario && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold font-mono text-xs">
                  {selectedScenario.id}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedScenario.nom}</h3>
                  <div className="text-xs text-slate-500">
                    {selectedScenario.categorie} &bull; Acteur : {selectedScenario.acteur}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedScenario(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-1">
                  Description du Scénario
                </h4>
                <p className="text-slate-700 leading-relaxed">{selectedScenario.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Données d'Entrée
                  </h4>
                  <p className="text-slate-700 text-xs font-mono">{selectedScenario.donneesEntree}</p>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider mb-1">
                    Résultat Attendu
                  </h4>
                  <p className="text-emerald-900 text-xs font-medium">{selectedScenario.resultatAttendu}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Enchaînement des Actions (Workflow)
                </h4>
                <div className="space-y-2">
                  {selectedScenario.actions.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-1">
                  Règles Métier Rattachées
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScenario.regles.map((r) => (
                    <span key={r} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedScenario(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-xs"
              >
                Fermer
              </button>

              <button
                onClick={() => {
                  handleRunScenario(selectedScenario);
                  setSelectedScenario(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Exécuter ce scénario</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
