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
  UserCheck,
  Truck
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
import { closeCashierSession } from '../utils/caisseSessionService';

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
  onRefreshData?: () => Promise<void> | void;
}

// -------------------------------------------------------------
// 1. SUPERVISEUR: SESSIONS DE CAISSE
// -------------------------------------------------------------
export const SuperviseurSessionsView: React.FC<BillingViewProps> = ({
  tillSessions = [],
  payments = [],
  partners = [],
  moves = [],
  onNavigateToView,
}) => {
  const [filterState, setFilterState] = useState<'all' | 'opened' | 'closed'>('all');
  const [validatedSessions, setValidatedSessions] = useState<number[]>([]);
  const [selectedSessionForAudit, setSelectedSessionForAudit] = useState<TillSession | null>(null);
  const [showGuideBanner, setShowGuideBanner] = useState(true);

  const filtered = tillSessions.filter(s => {
    if (filterState === 'all') return true;
    return s.state === filterState || (filterState === 'opened' && (s.state as any) === 'in_progress');
  });

  const handleValidate = (id: number) => {
    if (!validatedSessions.includes(id)) {
      setValidatedSessions(prev => [...prev, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pedagogical Guidance Banner */}
      {showGuideBanner && (
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                  🛡️ Rôle &amp; Missions • Superviseur de Caisse
                </span>
                <span className="text-xs text-slate-500">Guide de supervision</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Contrôle Financier, Audit des Encaissements et Validation des Arrêtés de Caisse
              </h2>
              <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
                Le Superviseur de Caisse est le garant de l'intégrité financière de l'hôpital. Il surveille l'activité des guichets en temps réel, audite les écarts de caisse (surplus ou manquant) lors des clôtures journalières, valide le billetage physique et autorise le transfert des fonds perçus vers le coffre-fort central ou la banque.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">1. Audit Temps Réel</span>
                  <span className="text-slate-600">Surveiller les flux encaissés par chaque caissier et repérer les anomalies.</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-start gap-2">
                  <span className="font-bold text-amber-700">2. Contrôle Billetage</span>
                  <span className="text-slate-600">Vérifier le comptage des coupures physiques vs le solde théorique calculé.</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-start gap-2">
                  <span className="font-bold text-sky-700">3. Quittance &amp; Coffre</span>
                  <span className="text-slate-600">Valider l'arrêté journalier et générer le procès-verbal officiel de versement.</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowGuideBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              title="Masquer le guide"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-700" />
            Supervision &amp; Audit des Sessions de Caisse
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                filterState === state
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {state === 'all' ? 'Toutes' : state === 'opened' ? 'En cours / Ouvertes' : 'Clôturées'}
            </button>
          ))}
        </div>
      </div>

      <div id="superviseur-sessions-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            {filtered.length} Session{filtered.length > 1 ? 's' : ''} de caisse répertoriée{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Session N°</th>
                <th className="py-2.5 px-4">Guichet &amp; Caissier</th>
                <th className="py-2.5 px-4">Date &amp; Heure</th>
                <th className="py-2.5 px-4">Fond Initial</th>
                <th className="py-2.5 px-4">Total Encaissé</th>
                <th className="py-2.5 px-4">Solde Déclaré</th>
                <th className="py-2.5 px-4">Écart Constaté</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Actions Superviseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Aucune session de caisse correspondant au filtre
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isValidated = validatedSessions.includes(s.id) || (s as any).state === 'validated';
                  const isClosed = s.state === 'closed';
                  const start = s.cashbox_start || s.opening_balance || 0;
                  const collected = s.total_payments || s.total_cash_collected || 0;
                  const theoretical = start + collected;
                  const end = s.cashbox_end !== undefined && s.cashbox_end !== null ? s.cashbox_end : (s.closing_actual_cash !== undefined ? s.closing_actual_cash : theoretical);
                  const difference = end - theoretical;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.name || s.session_code || `SES-${s.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {s.cashier_name || (s.user_id ? `Caissier #${s.user_id}` : 'Mohamed Mandé')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold">
                          {s.till_name || 'Guichet Principal 1'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {s.start_at || s.opened_at ? new Date(s.start_at || s.opened_at || '').toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Aujourd\'hui'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatFCFA(start)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                        {formatFCFA(collected)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {isClosed ? formatFCFA(end) : <span className="text-slate-400">En cours...</span>}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {isClosed ? (
                          <span className={`font-bold ${difference === 0 ? 'text-slate-600' : difference > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {difference === 0 ? '0 FCFA (Équilibré)' : difference > 0 ? `+${formatFCFA(difference)}` : formatFCFA(difference)}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                          isValidated
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isClosed
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          {isValidated ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Reçu au coffre</span>
                            </>
                          ) : isClosed ? (
                            <>
                              <Truck className="w-3 h-3 text-slate-600 shrink-0" />
                              <span>Fonds en transit</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                              <span>Session en cours</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSessionForAudit(s)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer"
                            title="Inspecter le détail de la session"
                          >
                            <Eye className="w-3 h-3 text-slate-600" />
                            <span>Inspecter</span>
                          </button>

                          {isClosed && !isValidated && (
                            <button
                              onClick={() => handleValidate(s.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Signer l'accusé de réception du Trésorier et transférer les fonds au coffre"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Accusé Réception Coffre</span>
                            </button>
                          )}

                          <button
                            onClick={() => printDocumentById('superviseur-sessions-table', `Bordereau_Session_${s.id}`)}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded font-semibold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Drawer d'Audit de Session */}
      {selectedSessionForAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Audit de Session : {selectedSessionForAudit.session_code || selectedSessionForAudit.name || `SES-${selectedSessionForAudit.id}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Opérateur : {selectedSessionForAudit.cashier_name || 'Caissier'} • Guichet : {selectedSessionForAudit.till_name || 'Principal'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSessionForAudit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Détails financiers */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Fond de caisse initial</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">
                  {formatFCFA(selectedSessionForAudit.cashbox_start || selectedSessionForAudit.opening_balance || 0)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Total perçu session</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">
                  {formatFCFA(selectedSessionForAudit.total_payments || selectedSessionForAudit.total_cash_collected || 0)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Statut de la session</span>
                <span className="text-xs font-bold uppercase mt-1 block text-indigo-700">
                  {selectedSessionForAudit.state === 'closed' ? 'Clôturée' : 'En cours'}
                </span>
              </div>
            </div>

            {/* Quittances rattachées */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Quittances &amp; Règlements de la session
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2">N° Reçu</th>
                      <th className="p-2">Patient</th>
                      <th className="p-2">Mode</th>
                      <th className="p-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.slice(0, 5).map((p, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono font-bold text-slate-900">{p.name || `PAY-${p.id}`}</td>
                        <td className="p-2 text-slate-800">{p.partner_name || 'Patient Hôpital'}</td>
                        <td className="p-2 capitalize text-slate-600">{p.payment_method_line_id || 'Espèces'}</td>
                        <td className="p-2 font-mono font-bold text-right text-slate-900">{formatFCFA(p.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Audit certifié conforme par le Superviseur</span>
              <button
                onClick={() => setSelectedSessionForAudit(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 2. SUPERVISEUR: CONTRÔLE DES CAISSES PHYSIQUES
// -------------------------------------------------------------
export const SuperviseurCaissesView: React.FC<BillingViewProps> = ({
  tillSessions = [],
  payments = [],
  onNavigateToView,
}) => {
  const [showGuideBanner, setShowGuideBanner] = useState(true);

  const pointsDeCaisse = [
    { id: 'CAISSE-01', name: 'Caisse Principale - Hall Accueil', caissier: 'Mohamed Mandé', ip: '192.168.1.101', status: 'Active', terminal: 'TPE Pax A920 #1' },
    { id: 'CAISSE-02', name: 'Caisse Urgences & Triage', caissier: 'Konan Félicité', ip: '192.168.1.102', status: 'Active', terminal: 'TPE Pax A920 #2' },
    { id: 'CAISSE-03', name: 'Caisse Laboratoire & Imagerie', caissier: 'Soro Alassane', ip: '192.168.1.103', status: 'En pause', terminal: 'TPE Ingenico DX8000' },
    { id: 'CAISSE-04', name: 'Caisse Maternité & Pédiatrie', caissier: 'Bamba Mariam', ip: '192.168.1.104', status: 'Active', terminal: 'TPE Pax A920 #3' },
  ];

  return (
    <div className="space-y-6">
      {/* Pedagogical Guidance Banner */}
      {showGuideBanner && (
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                  🏢 Parc des Guichets • Supervision Technique
                </span>
                <span className="text-xs text-slate-500">Guide technique</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Gestion des Points de Caisse Physiques, Terminaux TPE et Réseau
              </h2>
              <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
                Cette vue permet de superviser l'ensemble des points d'encaissement physiques de l'hôpital (Accueil, Urgences, Maternité, Labo), de s'assurer de l'état de connectivité réseau des tiroirs-caisses et des terminaux TPE de paiement par carte ou Mobile Money.
              </p>
            </div>
            <button
              onClick={() => setShowGuideBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              title="Masquer le guide"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Voir Sessions en Cours</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                <th className="py-2.5 px-4">Terminal &amp; Adresse Réseau IP</th>
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
                  <td className="py-3 px-4 font-mono text-slate-600">
                    <div>{c.terminal}</div>
                    <div className="text-[11px] text-slate-400">{c.ip}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      c.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      ● {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('superviseur_sessions')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 cursor-pointer"
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
  currentView,
  moves = [],
  payments = [],
  company,
}) => {
  const [showGuideBanner, setShowGuideBanner] = useState(true);
  const isAdminView = currentView === 'admin_reports';
  const totalInvoiced = moves.filter(m => m.move_type === 'out_invoice').reduce((sum, m) => sum + (m.amount_total || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const unpaidTotal = totalInvoiced - totalCollected;

  return (
    <div className="space-y-6">
      {/* Pedagogical Guidance Banner */}
      {showGuideBanner && (
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isAdminView
                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                    : 'bg-sky-50 text-sky-900 border-sky-200'
                }`}>
                  {isAdminView ? '🏛️ Direction & Administration Générale' : '📊 Rapprochement Financier & Statistiques'}
                </span>
                <span className="text-xs text-slate-500">
                  {isAdminView ? 'Pilotage stratégique' : 'Synthèse financière caisse'}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isAdminView
                  ? 'États Décisionnels, Performance Économique & Trésorerie Consolidée'
                  : 'Synthèse Financière Globale, Ventilation des Encaissements & Recouvrement'}
              </h2>
              <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
                {isAdminView
                  ? 'Ce tableau de bord d’administration offre à la direction de l’établissement une vue consolidée sur l’équilibre médico-financier : volume de facturation global, taux d’encaissement réel, niveau d’endettement tiers-payant et charges opérationnelles.'
                  : 'Ce tableau de bord financier consolide l’ensemble des revenus hospitaliers. Il permet de ventiler le chiffre d’affaires entre le ticket modérateur payé au comptant par les patients (Cash, Mobile Money, Cartes) et les créances à recouvrer auprès des sociétés d’assurance et mutuelles conventionnées.'}
              </p>
            </div>
            <button
              onClick={() => setShowGuideBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              title="Masquer le guide"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            {isAdminView
              ? 'Rapports d’Activité & États Décisionnels de l’Établissement'
              : 'Rapports & États de Synthèse Financière'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdminView
              ? 'Pilotage stratégique, performance médico-économique globale et comptabilité de gestion'
              : 'Ventilation des recettes, rapprochement bancaire, parts assurances et indicateurs d’activité'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
            isAdminView ? 'bg-purple-50 text-purple-900 border-purple-200' : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            {isAdminView ? 'Rapports Direction' : 'Contrôle Caisse'}
          </span>
          <button
            onClick={() => printDocumentById('superviseur-synthese-report', isAdminView ? 'Rapport_Direction_Generale' : 'Synthese_Financiere')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimer Synthèse</span>
          </button>
        </div>
      </div>

      <div id="superviseur-synthese-report" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500">Chiffre d'Affaires Facturé</span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatFCFA(totalInvoiced)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500">Recouvrement Effectué (Encaissé)</span>
            <p className="text-xl font-black text-emerald-700 mt-1">{formatFCFA(totalCollected)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500">Créances à Recouvrer (Assurances / Tiers)</span>
            <p className="text-xl font-black text-amber-700 mt-1">{formatFCFA(Math.max(0, unpaidTotal))}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
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
                  { mode: 'Espèces (Cash)', count: payments.filter(p => !p.payment_method_line_id || String(p.payment_method_line_id) === 'cash' || p.payment_method_code === 'cash').length, amount: payments.filter(p => !p.payment_method_line_id || String(p.payment_method_line_id) === 'cash' || p.payment_method_code === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0) },
                  { mode: 'Wave Mobile Money', count: payments.filter(p => String(p.payment_method_line_id) === 'wave' || p.payment_method_code === 'wave').length, amount: payments.filter(p => String(p.payment_method_line_id) === 'wave' || p.payment_method_code === 'wave').reduce((sum, p) => sum + (p.amount || 0), 0) },
                  { mode: 'Orange Money', count: payments.filter(p => String(p.payment_method_line_id) === 'orange_money' || p.payment_method_code === 'orange_money').length, amount: payments.filter(p => String(p.payment_method_line_id) === 'orange_money' || p.payment_method_code === 'orange_money').reduce((sum, p) => sum + (p.amount || 0), 0) },
                  { mode: 'Carte Bancaire / TPE', count: payments.filter(p => String(p.payment_method_line_id) === 'card' || p.payment_method_code === 'card').length, amount: payments.filter(p => String(p.payment_method_line_id) === 'card' || p.payment_method_code === 'card').reduce((sum, p) => sum + (p.amount || 0), 0) },
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
  tillSessions = [],
  payments = [],
  currentUser,
  onNavigateToView,
  onRefreshData,
}) => {
  const [showGuideBanner, setShowGuideBanner] = useState(true);
  const activeSession = React.useMemo(() => {
    if (!currentUser) return tillSessions.find(s => s.state === 'in_progress' || (s as any).state === 'opened');
    const currentName = (currentUser.name || '').toLowerCase().trim();
    const currentLogin = (currentUser.login || '').toLowerCase().trim();

    return tillSessions.find((s) => {
      if (s.state !== 'in_progress' && (s as any).state !== 'opened') return false;
      if (s.cashier_id === currentUser.id) return true;
      const sName = (s.cashier_name || '').toLowerCase().trim();
      if (sName === currentName || sName === currentLogin) return true;
      if (currentLogin === 'caissier' && (s.cashier_id === 3 || sName.includes('amadou') || sName.includes('caissier'))) return true;
      if (currentLogin === 'caisse_facture' && (s.cashier_id === 4 || sName.includes('awa') || sName.includes('facture'))) return true;
      return false;
    }) || tillSessions.find(s => s.state === 'in_progress' || (s as any).state === 'opened');
  }, [tillSessions, currentUser]);

  const [billets, setBillets] = useState<{ [denom: number]: number }>({
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    100: 0,
  });
  const [closureNotes, setClosureNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countedTotal = Object.entries(billets).reduce((sum, [denom, count]) => {
    return sum + Number(denom) * (Number(count) || 0);
  }, 0);

  const startBalance = activeSession?.cashbox_start || activeSession?.opening_balance || 0;
  const cashCollected = activeSession?.total_payments || activeSession?.total_cash_collected || 0;
  const theoreticalTotal = startBalance + cashCollected;
  const variance = countedTotal - theoreticalTotal;

  const handleDenomChange = (denom: number, count: number) => {
    setBillets(prev => ({ ...prev, [denom]: Math.max(0, count) }));
  };

  const handleConfirmClosure = async () => {
    setIsSubmitting(true);
    try {
      if (activeSession) {
        // 1. Close in local storage
        closeCashierSession({
          sessionId: activeSession.id,
          actualCash: countedTotal,
          notes: closureNotes ? `Billetage: ${closureNotes}` : 'Clôture avec billetage physique',
          billetage: billets,
        });

        // 2. Close on backend API
        try {
          await fetch(`/api/till-sessions/${activeSession.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              closing_actual_cash: countedTotal,
              notes: closureNotes || 'Clôture avec billetage',
              billetage: billets,
            }),
          });
        } catch (err) {
          console.warn('API close error:', err);
        }

        // 3. Refresh app state
        if (onRefreshData) {
          await onRefreshData();
        }
      }
    } catch (err) {
      console.error('Error closing cashier session:', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pedagogical Guidance Banner */}
      {showGuideBanner && (
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Procédure de Clôture &amp; Arrêté Journalier</span>
                </span>
                <span className="text-xs text-slate-500">Procédure clôture</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Comptage Physique des Billets, Arrêté des Comptes &amp; Signature de Session
              </h2>
              <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
                En fin de vacation ou de journée, le caissier procède au comptage physique exact des espèces (billets de 10 000, 5 000, 2 000, 1 000 et pièces). Le système confronte automatiquement la somme physique au solde théorique calculé d'après les reçus émis afin de détecter tout éventuel écart de caisse.
              </p>
            </div>
            <button
              onClick={() => setShowGuideBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              title="Masquer le guide"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-700" />
            Arrêté &amp; Clôture de Caisse Journalière
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

      {isSubmitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>STATUT : FONDS EN TRANSIT VERS LE COFFRE</span>
          </div>
          <h3 className="text-lg font-black text-emerald-900">
            Session de Caisse Clôturée &amp; Billetage Verrouillé !
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
            Votre bordereau de clôture a été signé numériquement. Les fonds sont en cours de transfert physique au coffre-fort central sous le contrôle du Trésorier de l'établissement.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => printDocumentById('feuille-billetage-container', 'Bordereau_Cloture')}
              className="px-4 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimer Bordereau de Caisse</span>
            </button>
            <button
              onClick={() => onNavigateToView(currentUser?.login === 'caisse_facture' ? 'caisse_facture_dashboard' : 'caisse_dashboard')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Retourner au tableau de bord
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grille de billetage */}
          <div id="feuille-billetage-container" className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-600" />
              Feuille de billetage (Comptage physique des coupures)
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

            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observations &amp; Justificatifs éventuels d'écart :
              </label>
              <textarea
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                placeholder="Ex: Rendu de monnaie manquant de 100 FCFA sur reçu n° 14, billet déchiré..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden resize-none h-16"
              />
            </div>
          </div>

          {/* Récapitulatif et validation */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Synthèse de la Session</h3>
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Fond de caisse initial :</span>
                  <span className="font-mono font-bold text-slate-900">{formatFCFA(startBalance)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Total encaissé session :</span>
                  <span className="font-mono font-bold text-slate-900">{formatFCFA(cashCollected)}</span>
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
                    {variance === 0 ? '0 FCFA (Équilibré)' : variance > 0 ? `+${formatFCFA(variance)}` : formatFCFA(variance)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmClosure}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Traitement de la Clôture...' : 'Signer et Transmettre Clôture'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
