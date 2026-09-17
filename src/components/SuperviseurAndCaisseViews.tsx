import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Search,
  Filter,
  ArrowRight,
  Plus,
  Building2,
  Shield,
  Eye,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import {
  AccountMove,
  AccountPayment,
  TillSession,
  ResPartner,
  CompanySettings,
  ResUser,
  AppView
} from '../types';
import { formatFCFA } from '../lib/formatters';
import { printDocumentById } from '../lib/printUtils';

interface BillingViewProps {
  currentView: AppView;
  moves: AccountMove[];
  payments: AccountPayment[];
  tillSessions: TillSession[];
  partners: ResPartner[];
  company?: CompanySettings;
  currentUser: ResUser | null;
  onNavigateToView: (view: AppView) => void;
  onNewInvoice?: () => void;
  onNewPayment?: () => void;
  onOpenPdf?: (move: AccountMove) => void;
}

// -------------------------------------------------------------
// 1. SUPERVISEUR: SESSIONS DE CAISSE
// -------------------------------------------------------------
export const SuperviseurSessionsView: React.FC<BillingViewProps> = ({
  tillSessions,
  onNavigateToView,
}) => {
  const [filterState, setFilterState] = useState<'all' | 'opened' | 'closed'>('all');
  const [validatedSessions, setValidatedSessions] = useState<number[]>([]);

  const filtered = tillSessions.filter(s => {
    if (filterState === 'all') return true;
    return s.state === filterState;
  });

  const handleValidate = (id: number) => {
    if (!validatedSessions.includes(id)) {
      setValidatedSessions(prev => [...prev, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-700" />
            Supervision des Sessions de Caisse
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contrôle des fonds initiaux, rapprochement des encaissements et validation des arrêtés de caisse
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'opened', 'closed'] as const).map(state => (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                filterState === state
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {state === 'all' ? 'Toutes' : state === 'opened' ? 'Ouvertes' : 'Clôturées'}
            </button>
          ))}
        </div>
      </div>

      <div id="superviseur-sessions-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filtered.length} Session{filtered.length > 1 ? 's' : ''} répertoriée{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Session N°</th>
                <th className="py-2.5 px-4">Caissier / Agent</th>
                <th className="py-2.5 px-4">Ouverture</th>
                <th className="py-2.5 px-4">Fond Initial</th>
                <th className="py-2.5 px-4">Total Encaissé</th>
                <th className="py-2.5 px-4">Solde Déclaré</th>
                <th className="py-2.5 px-4">Écart Constaté</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Aucune session correspondant au filtre
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isValidated = validatedSessions.includes(s.id);
                  const start = s.cashbox_start || 0;
                  const collected = s.total_payments || 0;
                  const theoretical = start + collected;
                  const end = s.cashbox_end !== undefined && s.cashbox_end !== null ? s.cashbox_end : theoretical;
                  const difference = end - theoretical;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.name || `SES-${s.id}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {s.user_id ? `Caissier #${s.user_id}` : 'Agent Caisse Principal'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {s.start_at ? new Date(s.start_at).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatFCFA(start)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                        {formatFCFA(collected)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {s.state === 'closed' ? formatFCFA(end) : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {s.state === 'closed' ? (
                          <span className={`font-bold ${difference === 0 ? 'text-slate-600' : difference > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {difference > 0 ? `+${formatFCFA(difference)}` : formatFCFA(difference)}
                          </span>
                        ) : (
                          <span className="text-slate-400">En cours</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isValidated
                            ? 'bg-slate-900 text-white border-slate-900'
                            : s.state === 'opened'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isValidated ? 'Validée Superviseur' : s.state === 'opened' ? 'Ouverte' : 'Clôturée'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.state === 'closed' && !isValidated ? (
                          <button
                            onClick={() => handleValidate(s.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                          >
                            Valider clôture
                          </button>
                        ) : (
                          <button
                            onClick={() => printDocumentById('superviseur-sessions-table', `Bordereau_Session_${s.id}`)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            Imprimer bordereau
                          </button>
                        )}
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
// 2. SUPERVISEUR: CONTRÔLE DES CAISSES PHYSIQUES
// -------------------------------------------------------------
export const SuperviseurCaissesView: React.FC<BillingViewProps> = ({
  tillSessions,
  payments,
  onNavigateToView,
}) => {
  const pointsDeCaisse = [
    { id: 'CAISSE-01', name: 'Caisse Principale - Hall Accueil', caissier: 'Kouamé Eric', ip: '192.168.1.101', status: 'Active' },
    { id: 'CAISSE-02', name: 'Caisse Urgences & Triage', caissier: 'Konan Félicité', ip: '192.168.1.102', status: 'Active' },
    { id: 'CAISSE-03', name: 'Caisse Laboratoire & Imagerie', caissier: 'Soro Alassane', ip: '192.168.1.103', status: 'Fermée' },
    { id: 'CAISSE-04', name: 'Caisse Sorties Hospitalisation', caissier: 'Bamba Mariam', ip: '192.168.1.104', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Supervision des Points de Caisse Physiques
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring en temps réel des postes de perception, terminaux et agents connectés
          </p>
        </div>
        <button
          onClick={() => onNavigateToView('superviseur_sessions')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
        >
          Voir Sessions en Cours
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {pointsDeCaisse.length} Points de perception configurés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Guichet</th>
                <th className="py-2.5 px-4">Emplacement / Affectation</th>
                <th className="py-2.5 px-4">Agent Caissier</th>
                <th className="py-2.5 px-4">Adresse Réseau IP</th>
                <th className="py-2.5 px-4">Statut Guichet</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pointsDeCaisse.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {c.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {c.caissier}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {c.ip}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      c.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('superviseur_sessions')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                    >
                      Audit session
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
// 3. SUPERVISEUR: RAPPORTS FINANCIERS CONSOLIDÉS
// -------------------------------------------------------------
export const SuperviseurReportsView: React.FC<BillingViewProps> = ({
  moves,
  payments,
  company,
}) => {
  const totalInvoiced = moves.filter(m => m.move_type === 'out_invoice').reduce((sum, m) => sum + (m.amount_total || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const unpaidTotal = totalInvoiced - totalCollected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            Rapports & États de Synthèse Financière
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ventilation des recettes, rapprochement bancaire, parts assurances et indicateurs d'activité
          </p>
        </div>
        <button
          onClick={() => printDocumentById('superviseur-synthese-report', 'Synthese_Financiere')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Imprimer Synthèse</span>
        </button>
      </div>

      <div id="superviseur-synthese-report" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Chiffre d'Affaires Facturé</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatFCFA(totalInvoiced)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Recouvrement Effectué</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatFCFA(totalCollected)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Créances à Recouvrer</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatFCFA(Math.max(0, unpaidTotal))}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Ventilation des encaissements par mode de règlement
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Mode de Règlement</th>
                <th className="py-2.5 px-4">Nombre d'opérations</th>
                <th className="py-2.5 px-4">Montant Total Encaissé</th>
                <th className="py-2.5 px-4">Part du Chiffre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { mode: 'Espèces (Cash)', count: payments.filter(p => !p.payment_method_line_id || p.payment_method_line_id === 'cash').length, amount: payments.filter(p => !p.payment_method_line_id || p.payment_method_line_id === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0) },
                { mode: 'Wave Mobile Money', count: payments.filter(p => p.payment_method_line_id === 'wave').length, amount: payments.filter(p => p.payment_method_line_id === 'wave').reduce((sum, p) => sum + (p.amount || 0), 0) },
                { mode: 'Orange Money', count: payments.filter(p => p.payment_method_line_id === 'orange_money').length, amount: payments.filter(p => p.payment_method_line_id === 'orange_money').reduce((sum, p) => sum + (p.amount || 0), 0) },
                { mode: 'Carte Bancaire / TPE', count: payments.filter(p => p.payment_method_line_id === 'card').length, amount: payments.filter(p => p.payment_method_line_id === 'card').reduce((sum, p) => sum + (p.amount || 0), 0) },
              ].map((row, idx) => {
                const percentage = totalCollected > 0 ? Math.round((row.amount / totalCollected) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.mode}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{row.count}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatFCFA(row.amount)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. CAISSIER: CLÔTURE DE CAISSE (BILLETAGE PHYSIQUE)
// -------------------------------------------------------------
export const CaisseClotureView: React.FC<BillingViewProps> = ({
  tillSessions,
  payments,
  currentUser,
  onNavigateToView,
}) => {
  const activeSession = tillSessions.find(s => s.state === 'opened');
  const [billets, setBillets] = useState<{ [denom: number]: number }>({
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    100: 0,
  });

  const countedTotal = Object.entries(billets).reduce((sum, [denom, count]) => {
    return sum + Number(denom) * (Number(count) || 0);
  }, 0);

  const theoreticalTotal = (activeSession?.cashbox_start || 0) + (activeSession?.total_payments || 0);
  const variance = countedTotal - theoreticalTotal;

  const handleDenomChange = (denom: number, count: number) => {
    setBillets(prev => ({ ...prev, [denom]: Math.max(0, count) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-700" />
            Arrêté & Clôture de Caisse Journalière
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comptage physique des espèces, calcul automatique de l'écart et transmission au superviseur
          </p>
        </div>
        <button
          onClick={() => onNavigateToView(currentUser?.login === 'caisse_facture' ? 'caisse_facture_dashboard' : 'caisse_dashboard')}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
        >
          Retour au Guichet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grille de billetage */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-600" />
            Feuille de billetage (Comptage des coupures)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Coupure</th>
                  <th className="py-2.5 px-4">Quantité comptée</th>
                  <th className="py-2.5 px-4 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[10000, 5000, 2000, 1000, 500, 100].map((denom) => (
                  <tr key={denom} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      Billet / Pièce de {formatFCFA(denom)}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        value={billets[denom] || ''}
                        onChange={(e) => handleDenomChange(denom, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-center font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-right">
                      {formatFCFA(denom * (billets[denom] || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Récapitulatif et validation */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Synthèse de la Session</h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Fond de caisse initial :</span>
                <span className="font-mono font-bold text-slate-900">{formatFCFA(activeSession?.cashbox_start || 0)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Total encaissé session :</span>
                <span className="font-mono font-bold text-slate-900">{formatFCFA(activeSession?.total_payments || 0)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-900 font-bold">
                <span>Solde théorique attendu :</span>
                <span className="font-mono">{formatFCFA(theoreticalTotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-900 font-bold bg-slate-50 p-2 rounded">
                <span>Total physique compté :</span>
                <span className="font-mono">{formatFCFA(countedTotal)}</span>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="font-bold text-xs">Écart constaté :</span>
                <span className={`font-mono font-bold text-sm ${variance === 0 ? 'text-slate-700' : variance > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {variance > 0 ? `+${formatFCFA(variance)}` : formatFCFA(variance)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onNavigateToView(currentUser?.login === 'caisse_facture' ? 'caisse_facture_dashboard' : 'caisse_dashboard');
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Signer et Transmettre Clôture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
