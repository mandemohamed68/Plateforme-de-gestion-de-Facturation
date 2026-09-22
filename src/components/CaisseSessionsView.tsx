import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Search,
  Printer,
  User,
  DollarSign,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Info,
  X,
  Building,
  Coins,
  Receipt,
  Eye,
  Check,
  Calendar,
  ShieldCheck,
  History,
  Stethoscope,
} from 'lucide-react';
import { TillSession, TillSessionTransaction, CompanySettings, ResUser, AccountMove } from '../types';
import { getAppTheme } from '../lib/theme';
import { printElement, printDocumentById } from '../lib/printUtils';
import { formatFCFA, getUserBillingProfile } from '../lib/formatters';
import { formatDateDDMMYYYY } from '../utils/dateUtils';
import { openNewCashierSession, closeCashierSession, saveAllSessions, isSupervisorOrAdmin } from '../utils/caisseSessionService';

interface CaisseSessionsViewProps {
  company: CompanySettings;
  currentUser: ResUser | null;
  moves: AccountMove[];
  tillSessions?: TillSession[];
  onSessionChange?: () => void;
  onRefreshData?: () => void;
  onOpenNewInvoice?: () => void;
  onOpenNewPayment?: (sessionId?: number) => void;
  onPayInvoice?: (move: AccountMove) => void;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  onNavigateToLab?: () => void;
  onSessionClosed?: (sessionCode: string) => void;
}

// Billets et Pièces simples pour le décompte physique
const CASH_DENOMINATIONS = [
  { value: 10000, label: '10 000 FCFA', type: 'note' },
  { value: 5000, label: '5 000 FCFA', type: 'note' },
  { value: 2000, label: '2 000 FCFA', type: 'note' },
  { value: 1000, label: '1 000 FCFA', type: 'note' },
  { value: 500, label: '500 FCFA', type: 'note' },
  { value: 200, label: '200 FCFA', type: 'coin' },
  { value: 100, label: '100 FCFA', type: 'coin' },
  { value: 50, label: '50 FCFA', type: 'coin' },
  { value: 25, label: '25 FCFA', type: 'coin' },
];

export const CaisseSessionsView: React.FC<CaisseSessionsViewProps> = ({
  company,
  currentUser,
  moves = [],
  tillSessions,
  onSessionChange,
  onRefreshData,
  onOpenNewInvoice,
  onOpenNewPayment,
  onPayInvoice,
  onShowToast,
  onNavigateToLab,
  onSessionClosed,
}) => {
  const notify = (
    text: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'warning',
    title?: string
  ) => {
    if (onShowToast) {
      onShowToast(text, type, title);
    } else {
      console.log(`[Caisse ${type}]: ${text}`);
    }
  };

  const profile = getUserBillingProfile(currentUser);
  const isSupervisor = profile === 'superviseur';
  const isCashier = profile === 'caisse' || profile === 'facture_caisse';
  const isBiller = profile === 'facture' || profile === 'facture_caisse';

  const printRef = useRef<HTMLDivElement>(null);

  // Core Data State
  const [sessions, setSessions] = useState<TillSession[]>(tillSessions || []);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (tillSessions) {
      setSessions(tillSessions);
    }
  }, [tillSessions]);

  // Sub-view mode for supervisor: 'my_session' vs 'all_sessions'
  const [supervisorView, setSupervisorView] = useState<'my_session' | 'all_sessions'>(
    isSupervisor ? 'all_sessions' : 'my_session'
  );

  // Selected session to inspect (history / detail view)
  const [inspectSession, setInspectSession] = useState<TillSession | null>(null);

  // Search & Filter for All Sessions list (Supervisor)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'closed'>('all');
  const [tillStateFilter, setTillStateFilter] = useState<'in_progress' | 'closed' | 'all'>('in_progress');
  const [tillSearchTerm, setTillSearchTerm] = useState('');

  // Active sub-tab inside an active session: pending (session courante), reliquats (autres sessions/antérieures), my_operations, billetage
  const [activeTab, setActiveTab] = useState<'pending' | 'reliquats' | 'my_operations' | 'billetage'>('pending');

  // Modal State: Open Session
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [tillNameInput, setTillNameInput] = useState(
    isSupervisor
      ? 'Poste Supervision & Audit'
      : profile === 'facture'
      ? 'Poste Facturation 1'
      : 'Guichet Caisse 1'
  );
  const [openingBalanceInput, setOpeningBalanceInput] = useState(
    profile === 'facture' || isSupervisor ? '0' : '50000'
  );
  const [openNotesInput, setOpenNotesInput] = useState('');

  // Synchronize default till inputs when user or profile changes
  useEffect(() => {
    if (currentUser) {
      if (isSupervisor) {
        setTillNameInput('Poste Supervision & Audit');
        setOpeningBalanceInput('0');
      } else if (profile === 'facture') {
        setTillNameInput('Poste Facturation 1');
        setOpeningBalanceInput('0');
      } else {
        setTillNameInput('Guichet Caisse 1');
        setOpeningBalanceInput('50000');
      }
    }
  }, [currentUser, isSupervisor, profile]);

  // Modal State: Close Session
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<TillSession | null>(null);
  const [actualCashInput, setActualCashInput] = useState('');
  const [closeNotesInput, setCloseNotesInput] = useState('');
  const [showBilletageInClose, setShowBilletageInClose] = useState(false);
  const [billetageCounts, setBilletageCounts] = useState<Record<number, number>>({});

  // Modal State: Print Bordereau Z
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [sessionToPrint, setSessionToPrint] = useState<TillSession | null>(null);

  // Fetch Sessions from Backend
  const fetchSessions = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch('/api/till-sessions', { signal });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setSessions(list);
          if (list.length > 0) {
            saveAllSessions(list);
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Chargement sessions mode autonome / local:', err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSessions(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  // Identify current user's active session
  const myActiveSession = useMemo(() => {
    if (!currentUser) return undefined;
    const currentName = (currentUser.name || '').toLowerCase().trim();
    const currentLogin = (currentUser.login || '').toLowerCase().trim();

    return sessions.find((s) => {
      if (s.state !== 'in_progress') return false;
      if (s.cashier_id === currentUser.id) return true;
      const sName = (s.cashier_name || '').toLowerCase().trim();
      if (sName === currentName || sName === currentLogin) return true;
      if (currentLogin === 'caissier' && (s.cashier_id === 3 || sName.includes('amadou') || sName.includes('caissier'))) return true;
      if (currentLogin === 'caisse_facture' && (s.cashier_id === 4 || sName.includes('awa') || sName.includes('facture'))) return true;
      return false;
    });
  }, [sessions, currentUser]);

  // Identify current user's last closed session
  const myLastSession = sessions.find(
    (s) => s.cashier_id === currentUser?.id || s.cashier_name === currentUser?.name
  );

  // Calculate billetage total
  const computedBilletageTotal = Object.entries(billetageCounts).reduce((acc, [val, count]) => {
    return acc + Number(val) * (Number(count) || 0);
  }, 0);

  // When billetage changes in close modal, update actual cash input
  useEffect(() => {
    if (showBilletageInClose && computedBilletageTotal > 0) {
      setActualCashInput(String(computedBilletageTotal));
    }
  }, [billetageCounts, showBilletageInClose, computedBilletageTotal]);

  // Open a new session
  const handleConfirmOpenSession = async () => {
    setActionError(null);
    if (myActiveSession) {
      setActionError(
        `Impossible d'ouvrir une nouvelle session : Le profil "${currentUser?.name}" possède déjà une session active (${myActiveSession.session_code} - ${myActiveSession.till_name}). Vous devez la clôturer avant d'en ouvrir une autre.`
      );
      return;
    }

    // Always create local session first
    const createdLocal = openNewCashierSession({
      userId: currentUser?.id || 1,
      userName: currentUser?.name || 'Opérateur',
      tillName: tillNameInput || (profile === 'facture' ? 'Poste Facturation 1' : 'Guichet Caisse 1'),
      openingBalance: Number(openingBalanceInput) || 0,
      notes: openNotesInput,
    });

    try {
      const res = await fetch('/api/till-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: currentUser?.id || 1,
          cashier_name: currentUser?.name || 'Opérateur',
          till_name: tillNameInput || (profile === 'facture' ? 'Poste Facturation 1' : 'Guichet Caisse 1'),
          opening_balance: Number(openingBalanceInput) || 0,
          notes: openNotesInput,
        }),
      });

      if (res.ok) {
        let createdSession: TillSession | null = null;
        try {
          createdSession = await res.json();
        } catch (_) {}
        if (createdSession) {
          setSessions((prev) => {
            const updated = [createdSession!, ...prev.filter((s) => s.id !== createdSession!.id && s.id !== createdLocal.id)];
            saveAllSessions(updated);
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn('Backend till session API error:', e);
    }

    setShowOpenModal(false);
    setOpenNotesInput('');
    notify(
      `Session de caisse ${createdLocal.session_code} ouverte avec succès !`,
      'success',
      'Ouverture de Caisse'
    );
    await fetchSessions();
    if (onSessionChange) onSessionChange();
  };

  // Open Close Modal
  const handleInitiateClose = (session: TillSession) => {
    setSessionToClose(session);
    const expected = (session.opening_balance || 0) + (session.total_cash_collected || 0);
    setActualCashInput(String(expected));
    setCloseNotesInput('');
    setBilletageCounts({});
    setShowBilletageInClose(false);
    setActionError(null);
    setShowCloseModal(true);
  };

  // Confirm Close Session
  const handleConfirmCloseSession = async () => {
    if (!sessionToClose) return;
    setActionError(null);

    // Always close locally first
    const closedLocal = closeCashierSession({
      sessionId: sessionToClose.id,
      actualCash: Number(actualCashInput) || 0,
      notes: closeNotesInput,
      billetage: billetageCounts,
    });

    try {
      const res = await fetch(`/api/till-sessions/${sessionToClose.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_actual_cash: Number(actualCashInput) || 0,
          notes: closeNotesInput,
          billetage: billetageCounts,
        }),
      });

      if (res.ok) {
        let updated: TillSession | null = null;
        try {
          updated = await res.json();
        } catch (_) {}

        if (updated) {
          setSessions((prev) => {
            const list = prev.map((s) => (s.id === updated!.id ? updated! : s));
            saveAllSessions(list);
            return list;
          });
        }
      }
    } catch (err) {
      console.warn('Backend close till session API error:', err);
    }

    setShowCloseModal(false);
    notify(
      `Session ${sessionToClose.session_code} clôturée avec succès. PV de clôture généré.`,
      'info',
      'Clôture de Caisse'
    );
    setSessionToPrint(closedLocal || sessionToClose);
    setShowPrintModal(true);
    await fetchSessions();
    if (onSessionChange) onSessionChange();
    if (onSessionClosed) onSessionClosed(sessionToClose.session_code);
  };

  // Invoices ready for collection: All unpaid client invoices (Facturation & Prescriptions, draft or posted)
  const activeSessionPendingInvoices = useMemo(() => {
    return moves.filter((m) => {
      if (m.move_type !== 'out_invoice' || m.state === 'cancel' || m.payment_state === 'paid') return false;
      return true;
    });
  }, [moves]);

  // Dedicated Reliquats: Invoices from past/closed sessions or anterior dates that remain unpaid
  const priorResidualInvoices = useMemo(() => {
    return moves.filter((m) => {
      if (m.move_type !== 'out_invoice' || m.state === 'cancel' || m.payment_state === 'paid') return false;
      const invDate = m.invoice_date || m.date;
      const todayStr = new Date().toISOString().split('T')[0];
      return invDate && invDate < todayStr;
    });
  }, [moves]);

  // Backward compatibility alias for views expecting pendingInvoices
  const pendingInvoices = activeSessionPendingInvoices;

  // Filter invoices created by current user strictly in the CURRENT active session (for Facturier)
  const myCreatedInvoices = useMemo(() => {
    if (isSupervisor) return moves;

    return moves.filter((m) => {
      const isUser = m.invoice_user_id === currentUser?.id || (!m.invoice_user_id && isBiller);
      if (!isUser) return false;

      if (!myActiveSession) {
        // If no active session, show invoices created by them today
        const invDate = m.invoice_date || m.date;
        const todayStr = new Date().toISOString().split('T')[0];
        return invDate && invDate.startsWith(todayStr);
      }

      // 1. Strict match by till_session_id
      if (m.till_session_id) {
        return m.till_session_id === myActiveSession.id;
      }

      // 2. Fallback matching: created within this active session time
      const sessionStartStr = myActiveSession.created_at || myActiveSession.create_date;
      const invoiceDateStr = m.created_at || m.create_date || m.invoice_date;
      if (sessionStartStr && invoiceDateStr) {
        const sessionStart = new Date(sessionStartStr).getTime();
        const invoiceTime = new Date(invoiceDateStr).getTime();
        return invoiceTime >= sessionStart - 60000;
      }
      return false;
    });
  }, [moves, myActiveSession, isSupervisor, currentUser, isBiller]);

  // Filter sessions for Supervisor list
  const filteredSessionsList = sessions
    .filter((s) => {
      // Restriction pour les profils non-superviseurs/admins
      if (!isSupervisorOrAdmin(currentUser)) {
        // Un caissier ne voit que ses propres sessions
        if (Number(s.cashier_id) !== Number(currentUser?.id)) return false;

        // Restriction à la date du jour
        const today = formatDateDDMMYYYY(new Date()); 
        const sessionDate = (s.opening_date || s.created_at || '').split(' ')[0];
        if (sessionDate !== today) return false;
      }

      if (statusFilter !== 'all' && s.state !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (s.session_code || '').toString().toLowerCase().includes(q) ||
          (s.till_name || '').toString().toLowerCase().includes(q) ||
          (s.cashier_name || '').toString().toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id;
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  // Print function
  const handlePrintZ = () => {
    if (printRef.current) {
      printElement(printRef.current, `Arrete_Caisse_${sessionToPrint?.session_code || 'Z'}`);
    } else {
      printDocumentById('caisse-session-rapport-z-sheet', `Arrete_Caisse_${sessionToPrint?.session_code || 'Z'}`);
    }
  };

  return (
    <div className="space-y-4 max-w-full pb-16 font-sans">
      {/* ERROR BANNER */}
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center justify-between text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="font-medium">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-rose-100 rounded text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUPERVISOR TITLE BAR */}
      {isSupervisor && (
        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Console de Supervision &amp; Contrôle</h2>
                <p className="text-[10px] text-slate-500 font-medium">Vue d&apos;ensemble et traçabilité en direct de toutes les sessions</p>
              </div>
            </div>

            <button
              onClick={() => { fetchSessions(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 cursor-pointer transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {/* Tab selector for Supervisor to toggle between Global View and Personal Session */}
          <div className="flex border-b border-slate-200 gap-1.5 pb-px">
            <button
              onClick={() => setSupervisorView('all_sessions')}
              className={`px-4 py-2 text-xs font-bold transition-all relative border-b-2 -mb-px cursor-pointer flex items-center gap-2 ${
                supervisorView === 'all_sessions'
                  ? 'border-slate-900 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Toutes les Caisses &amp; Sessions</span>
              <span className="bg-slate-100 text-slate-700 rounded-full px-1.5 py-0.5 text-[10px] font-mono">
                {sessions.length}
              </span>
            </button>
            <button
              onClick={() => setSupervisorView('my_session')}
              className={`px-4 py-2 text-xs font-bold transition-all relative border-b-2 -mb-px cursor-pointer flex items-center gap-2 ${
                supervisorView === 'my_session'
                  ? 'border-slate-900 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Ma Caisse / Session Personnelle</span>
              {myActiveSession ? (
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW FOR OPERATIONAL USERS (OR SUPERVISOR IN 'MY_SESSION' MODE)        */}
      {/* ========================================================================= */}
      {(supervisorView === 'my_session' || !isSupervisor) && (
        <>
          {/* CASE A: NO ACTIVE SESSION -> CLEAN, PROFESSIONAL OPENING CARD */}
          {!myActiveSession ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto text-center space-y-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                <Lock className="w-6 h-6 text-slate-600" />
              </div>

              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Bonjour, {currentUser?.name || 'Agent'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {profile === 'superviseur'
                    ? "Votre session de supervision et contrôle n'est pas encore ouverte. Ouvrez votre vacation de supervision pour gérer les caisses, valider les annulations et régulariser les opérations."
                    : profile === 'facture'
                    ? "Votre session de facturation n'est pas encore ouverte. Ouvrez votre vacation pour commencer à établir vos factures."
                    : profile === 'caisse'
                    ? "Votre caisse n'est pas encore ouverte. Ouvrez votre session avec votre fond de caisse initial pour commencer à encaisser."
                    : "Votre session de travail n'est pas encore ouverte. Veuillez démarrer votre vacation pour accéder aux opérations."}
                </p>
              </div>

              {/* 3-STEP SLEEK TIMELINE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span className="text-xs font-bold text-slate-900">Ouverture</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {profile === 'superviseur' ? 'Prise de poste Supervision' : profile === 'facture' ? 'Prise de poste directe' : 'Saisie du fond de caisse'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span className="text-xs font-bold text-slate-900">Opérations</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {profile === 'superviseur' ? 'Supervision, annulations & audits' : profile === 'facture' ? 'Établissement des factures' : 'Encaissements & Règlements'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <span className="text-xs font-bold text-slate-900">Clôture</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {profile === 'superviseur' ? 'Rapport général & Clôture' : 'Arrêté de caisse & Ticket Z'}
                  </div>
                </div>
              </div>

              {/* ACTION: OPEN SESSION FORM DIRECTLY */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-left space-y-3.5 max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Poste / Guichet
                  </label>
                  <input
                    type="text"
                    value={tillNameInput}
                    onChange={(e) => setTillNameInput(e.target.value)}
                    placeholder="Ex: Guichet Caisse 1, Poste Facturation 2"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-hidden"
                  />
                </div>

                {profile !== 'facture' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fond de caisse initial (FCFA)
                    </label>
                    <input
                      type="number"
                      value={openingBalanceInput}
                      onChange={(e) => setOpeningBalanceInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Monnaie liquide disponible dans le tiroir au démarrage.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleConfirmOpenSession}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Ouvrir la session &amp; Démarrer</span>
                </button>
              </div>

              {/* PREVIOUS SESSIONS AND PRINT ARRÊTÉ DE CAISSE TICKET Z */}
              {(() => {
                const myClosedSessions = sessions.filter(
                  (s) =>
                    (s.cashier_id === currentUser?.id || s.cashier_name === currentUser?.name) &&
                    s.state === 'closed'
                );
                if (myClosedSessions.length === 0) return null;
                return (
                  <div className="pt-4 border-t border-slate-200 max-w-md mx-auto space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left">
                      Historique des vacations clôturées (Bordereau Z)
                    </h4>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {myClosedSessions.slice(0, 5).map((s) => (
                        <div
                          key={s.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 text-left"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-extrabold text-xs text-slate-900">
                              {s.session_code} • {s.till_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Clôturé le {s.closing_date || s.opening_date}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSessionToPrint(s);
                              setShowPrintModal(true);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Imprimer</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* CASE B: SESSION ACTIVE -> OPERATIONAL WORKFLOW DASHBOARD */
            <div className="space-y-4">
              {/* TOP ACTIVE SESSION BANNER */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>
                        Session Active
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {myActiveSession.session_code}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {myActiveSession.till_name} • {currentUser?.name}
                    </h2>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Ouverte le {myActiveSession.opening_date}
                    </p>
                  </div>
                </div>

                {/* ESSENTIAL STATS CARDS */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  {profile !== 'facture' && (
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 min-w-[110px]">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Fond Initial
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {formatFCFA(myActiveSession.opening_balance)}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 min-w-[130px]">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      {profile === 'facture' ? 'Total Facturé' : 'Total Encaissé'}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {formatFCFA(
                        profile === 'facture'
                          ? myCreatedInvoices.reduce((acc, m) => acc + m.amount_total, 0)
                          : myActiveSession.total_collected
                      )}
                    </div>
                  </div>

                  {/* CLOSE SESSION BUTTON */}
                  <button
                    onClick={() => handleInitiateClose(myActiveSession)}
                    className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer ml-auto lg:ml-0"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Clôturer la session (Fin de journée)</span>
                  </button>
                </div>
              </div>

              {/* PRIMARY ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isBiller && (
                  <button
                    onClick={onOpenNewInvoice}
                    className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          Action Facturation
                        </div>
                        <div>Établir une Nouvelle Facture</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {isCashier && (
                  <button
                    onClick={() => onOpenNewPayment && onOpenNewPayment(myActiveSession.id)}
                    className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          Action Caisse
                        </div>
                        <div>Encaisser un Règlement Direct</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* WORKFLOW TABS: PENDING INVOICES vs MY OPERATIONS / SUPERVISOR CONTROL */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-3 pt-2 gap-1 overflow-x-auto">
                  {isSupervisor && (
                    <>
                      <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          activeTab === 'pending'
                            ? 'border-slate-900 text-slate-900 bg-white rounded-t-md'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Surveillance Caisses ({sessions.length})
                      </button>

                      <button
                        onClick={() => setActiveTab('billetage')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          activeTab === 'billetage'
                            ? 'border-slate-900 text-slate-900 bg-white rounded-t-md'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Centre d&apos;Approbations &amp; Annulations
                      </button>
                    </>
                  )}

                  {(!isSupervisor || activeTab === 'pending' || activeTab === 'reliquats') && (
                    <>
                      <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          activeTab === 'pending'
                            ? 'border-slate-900 text-slate-900 bg-white rounded-t-md'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>File d&apos;Attente Session ({activeSessionPendingInvoices.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('reliquats')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          activeTab === 'reliquats'
                            ? 'border-amber-600 text-amber-900 bg-amber-50/70 rounded-t-md'
                            : 'border-transparent text-slate-500 hover:text-amber-800'
                        }`}
                      >
                        <History className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reliquats &amp; Antérieures ({priorResidualInvoices.length})</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setActiveTab('my_operations')}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeTab === 'my_operations'
                        ? 'border-slate-900 text-slate-900 bg-white rounded-t-md'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {profile === 'superviseur'
                      ? `Journal & Traçabilité (${myActiveSession?.transactions?.length || 0})`
                      : profile === 'facture'
                      ? `Mes Factures Établies (${myCreatedInvoices.length})`
                      : `Mes Encaissements (${myActiveSession?.transactions?.length || 0})`}
                  </button>

                  {isCashier && (
                    <button
                      onClick={() => setActiveTab('billetage')}
                      className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        activeTab === 'billetage'
                          ? 'border-slate-900 text-slate-900 bg-white rounded-t-md'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Décompte Monnaie / Billetage
                    </button>
                  )}
                </div>

                {/* TAB CONTENT 1 FOR SUPERVISOR: LIVE TILLS MONITORING */}
                {isSupervisor && activeTab === 'pending' && (() => {
                  const activeTillsCount = sessions.filter((s) => s.state === 'in_progress').length;
                  const closedTillsCount = sessions.filter((s) => s.state === 'closed').length;

                  const filteredLiveSessions = sessions
                    .filter((s) => {
                      const matchesState =
                        tillStateFilter === 'all'
                          ? true
                          : tillStateFilter === 'in_progress'
                          ? s.state === 'in_progress'
                          : s.state === 'closed';

                      const matchesSearch =
                        tillSearchTerm.trim() === '' ||
                        (s.session_code || '').toString().toLowerCase().includes(tillSearchTerm.toLowerCase()) ||
                        (s.till_name || '').toString().toLowerCase().includes(tillSearchTerm.toLowerCase()) ||
                        (s.cashier_name || '').toString().toLowerCase().includes(tillSearchTerm.toLowerCase());

                      return matchesState && matchesSearch;
                    })
                    .sort((a, b) => {
                      const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id;
                      const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id;
                      if (dateB !== dateA) return dateB - dateA;
                      return (b.id || 0) - (a.id || 0);
                    });

                  return (
                    <div className="p-4 space-y-4">
                      {/* HEADER & FILTER BAR */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-slate-700 shrink-0" />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">Guichets &amp; Caisses en Activité</h3>
                            <p className="text-[11px] text-slate-500">Supervision en direct des caissiers en ligne et vacations actives</p>
                          </div>
                        </div>

                        {/* SUB-TAB FILTERS & SEARCH */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative flex-1 sm:w-56">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={tillSearchTerm}
                              onChange={(e) => setTillSearchTerm(e.target.value)}
                              placeholder="Rechercher caissier ou guichet..."
                              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-hidden focus:border-slate-400"
                            />
                          </div>

                          <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setTillStateFilter('in_progress')}
                              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
                                tillStateFilter === 'in_progress'
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>En Cours ({activeTillsCount})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTillStateFilter('closed')}
                              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                                tillStateFilter === 'closed'
                                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Clôturées ({closedTillsCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setTillStateFilter('all')}
                              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                                tillStateFilter === 'all'
                                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Toutes ({sessions.length})
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CARDS GRID */}
                      {filteredLiveSessions.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <Building className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-600">Aucune session de caisse ne correspond au filtre sélectionné.</p>
                          <p className="text-[11px] text-slate-400">Essayez de modifier votre recherche ou filtre d'état ci-dessus.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredLiveSessions.map((s) => (
                            <div
                              key={s.id}
                              className={`p-4 rounded-lg border space-y-3 relative hover:shadow-sm transition ${
                                s.state === 'in_progress'
                                  ? 'bg-white border-slate-200 hover:border-emerald-300'
                                  : 'bg-slate-50 border-slate-200 opacity-80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {s.session_code}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase flex items-center gap-1.5 ${
                                    s.state === 'in_progress'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {s.state === 'in_progress' ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>En Cours</span>
                                    </>
                                  ) : (
                                    'Clôturée'
                                  )}
                                </span>
                              </div>

                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                                  <span>{s.till_name}</span>
                                </div>
                                <div className="text-xs text-slate-600 font-semibold flex items-center gap-1.5 mt-1">
                                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{s.cashier_name}</span>
                                </div>
                              </div>

                              <div className="border-t border-slate-200 pt-2 text-xs space-y-1 bg-slate-50/80 -mx-4 -mb-1 px-4 py-2">
                                <div className="flex justify-between text-slate-600">
                                  <span>Fond Initial :</span>
                                  <span className="font-semibold text-slate-800">{formatFCFA(s.opening_balance)}</span>
                                </div>
                                <div className="flex justify-between text-slate-900 font-bold">
                                  <span>Total Encaissé :</span>
                                  <span className="text-emerald-700 font-mono text-sm">{formatFCFA(s.total_collected)}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setInspectSession(s)}
                                className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded font-bold text-[11px] shadow-xs flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>Inspecter la Vacation</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB CONTENT 2 FOR SUPERVISOR: APPROVALS & CANCELLATIONS */}
                {isSupervisor && activeTab === 'billetage' && (
                  <div className="p-4 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Espace de Régularisation &amp; Annulations (Droit Superviseur)</div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          Toute annulation ou modification de facture enregistrée est tracée au nom de votre vacation de supervision.
                        </div>
                      </div>
                    </div>

                    <div className="w-full">
                      <table className="w-full text-left text-xs table-fixed border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3 w-[25%]">N° Facture</th>
                            <th className="py-2.5 px-3 w-[25%]">Patient</th>
                            <th className="py-2.5 px-3 w-[20%] text-right">Montant</th>
                            <th className="py-2.5 px-3 w-[15%] text-center">État</th>
                            <th className="py-2.5 px-2 text-right w-[15%]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {moves.slice(0, 15).map((m, idx) => (
                            <tr key={`move-caisse-${m.id}-${idx}`} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 truncate" title={m.name || `FAC #${m.id}`}>
                                {m.name || `FAC #${m.id}`}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 truncate" title={m.partner?.name || 'Patient'}>
                                {m.partner?.name || 'Patient'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 text-right whitespace-nowrap">
                                {formatFCFA(m.amount_total)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase truncate max-w-full ${
                                  m.state === 'posted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {m.state === 'posted' ? 'Comptabilisée' : 'Annulée'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                {m.state === 'posted' ? (
                                  <button
                                    onClick={async () => {
                                      const reason = prompt("Motif de l'annulation de la facture :");
                                      if (!reason) return;
                                      try {
                                        const res = await fetch(`/api/moves/${m.id}/cancel`, { method: 'POST' });
                                        if (res.ok) {
                                          alert(`Facture ${m.name || m.id} annulée avec succès par le superviseur.`);
                                          fetchSessions();
                                          if (onSessionChange) onSessionChange();
                                        }
                                      } catch (err) {
                                        alert("Erreur lors de l'annulation de la facture");
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
                                  >
                                    Annuler Facture
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">Déjà annulée</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 1: PENDING INVOICES QUEUE FOR CURRENT ACTIVE SESSION */}
                {activeTab === 'pending' && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-semibold text-slate-800">
                          Flux de la session active ({myActiveSession?.session_code || 'En cours'})
                        </span>
                        <span>— Factures générées dans le périmètre de cette session</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">
                          {activeSessionPendingInvoices.length} à encaisser
                        </span>
                        {onRefreshData && (
                          <button
                            onClick={onRefreshData}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded transition cursor-pointer"
                            title="Actualiser la liste"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Actualiser
                          </button>
                        )}
                      </div>
                    </div>

                    {activeSessionPendingInvoices.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 space-y-1.5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-xs text-slate-700">Aucune facture en attente pour cette session</p>
                        <p className="text-[11px] text-slate-400">
                          Toutes les factures émises lors de cette session ont été encaissées.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full">
                        <table className="w-full text-left text-xs table-fixed border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 px-3 w-[25%]">N° Facture</th>
                              <th className="py-2.5 px-3 w-[25%]">Patient</th>
                              <th className="py-2.5 px-3 w-[20%] hidden sm:table-cell">Total</th>
                              <th className="py-2.5 px-3 w-[20%]">Reste</th>
                              <th className="py-2.5 px-2 text-right w-[15%]">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeSessionPendingInvoices.map((inv, idx) => (
                              <tr key={`pending-inv-${inv.id}-${idx}`} className="hover:bg-slate-50/70 transition">
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-bold text-slate-900 truncate" title={inv.name || `Brouillon #${inv.id}`}>
                                    {inv.name || `Brouillon #${inv.id}`}
                                  </div>
                                  {(inv.is_prescription_invoice || inv.ref?.startsWith('PRESCR:')) && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mt-0.5">
                                      <Stethoscope className="w-2.5 h-2.5 text-slate-500" />
                                      Prescription {inv.prescribing_doctor ? `Dr. ${inv.prescribing_doctor}` : 'Interne'}
                                    </span>
                                  )}
                                  {inv.ref?.startsWith('RELIQUAT:') && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5">
                                      Reliquat Référence
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 truncate">
                                  <div className="font-semibold text-slate-900 truncate" title={inv.patient_name || inv.partner?.name || 'Patient'}>
                                    {inv.patient_name || inv.partner?.name || 'Patient'}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1.5">
                                    {inv.ndm && <span>NDM: {inv.ndm}</span>}
                                    {(inv.patient_phone || inv.partner?.phone) && (
                                      <span>• {inv.patient_phone || inv.partner?.phone}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">
                                  {formatFCFA(inv.amount_total)}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  {formatFCFA(inv.amount_residual)}
                                </td>
                                <td className="py-2.5 px-2 text-right">
                                  <button
                                    onClick={() => onPayInvoice && onPayInvoice(inv)}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Encaisser</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT 1.B: DEDICATED RELIQUATS & ANTERIOR INVOICES TAB */}
                {isCashier && activeTab === 'reliquats' && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-amber-700" />
                        <span className="font-semibold text-amber-900">
                          Reliquats &amp; Créances Antérieures
                        </span>
                        <span>— Factures non soldées issues de sessions passées ou antérieures</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-900">
                          {priorResidualInvoices.length} reliquat{priorResidualInvoices.length > 1 ? 's' : ''}
                        </span>
                        {onRefreshData && (
                          <button
                            onClick={onRefreshData}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-amber-700 bg-white hover:bg-amber-100 hover:text-amber-900 border border-amber-200 rounded transition cursor-pointer"
                            title="Actualiser la liste"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Actualiser
                          </button>
                        )}
                      </div>
                    </div>

                    {priorResidualInvoices.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 space-y-1.5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-xs text-slate-700">Aucun reliquat en souffrance</p>
                        <p className="text-[11px] text-slate-400">
                          Toutes les factures et créances des sessions précédentes ont été soldées.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full">
                        <table className="w-full text-left text-xs table-fixed border-collapse">
                          <thead>
                            <tr className="bg-amber-50/60 border-b border-amber-200 text-amber-900 font-bold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 px-3 w-[22%]">N° Facture</th>
                              <th className="py-2.5 px-3 w-[25%]">Patient</th>
                              <th className="py-2.5 px-3 w-[18%] hidden sm:table-cell">Origine</th>
                              <th className="py-2.5 px-3 w-[18%]">Reste à payer</th>
                              <th className="py-2.5 px-2 text-right w-[17%]">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {priorResidualInvoices.map((inv, idx) => (
                              <tr key={`prior-inv-${inv.id}-${idx}`} className="hover:bg-amber-50/30 transition">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 truncate" title={inv.name || `FAC #${inv.id}`}>
                                  <div>{inv.name || `FAC #${inv.id}`}</div>
                                  <div className="text-[10px] font-normal text-slate-400 font-sans">{inv.invoice_date || inv.date}</div>
                                </td>
                                <td className="py-2.5 px-3 truncate">
                                  <div className="font-semibold text-slate-900 truncate" title={inv.patient_name || inv.partner?.name || 'Patient'}>
                                    {inv.patient_name || inv.partner?.name || 'Patient'}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1.5">
                                    {inv.ndm && <span>NDM: {inv.ndm}</span>}
                                    {(inv.patient_phone || inv.partner?.phone) && (
                                      <span>• {inv.patient_phone || inv.partner?.phone}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 hidden sm:table-cell truncate">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold border border-amber-200 inline-block truncate max-w-full">
                                    {inv.till_session_id ? `Session #${inv.till_session_id}` : 'Antérieure'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-amber-700 whitespace-nowrap">
                                  {formatFCFA(inv.amount_residual)}
                                </td>
                                <td className="py-2.5 px-2 text-right">
                                  <button
                                    onClick={() => onPayInvoice && onPayInvoice(inv)}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-md shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Recouvrer</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT 2: MY OPERATIONS (BILLER OR CASHIER) */}
                {(activeTab === 'my_operations' || (!isCashier && activeTab === 'pending')) && (
                  <div className="p-4">
                    {onRefreshData && (
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={onRefreshData}
                          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded transition cursor-pointer"
                          title="Actualiser la liste"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Actualiser
                        </button>
                      </div>
                    )}
                    {profile === 'facture' ? (
                      /* Biller View: list of invoices he created */
                      myCreatedInvoices.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 space-y-2">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-xs text-slate-700">
                            Aucune facture établie pour le moment.
                          </p>
                          <button
                            onClick={onOpenNewInvoice}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Créer une facture
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <table className="w-full text-left text-xs table-fixed border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                <th className="py-2.5 px-3 w-[25%]">N° Facture</th>
                                <th className="py-2.5 px-3 w-[25%]">Patient</th>
                                <th className="py-2.5 px-3 w-[15%] hidden sm:table-cell">Date</th>
                                <th className="py-2.5 px-3 w-[20%] text-right">Total</th>
                                <th className="py-2.5 px-3 w-[15%] text-center">État</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {myCreatedInvoices.map((inv, idx) => (
                                <tr key={`my-inv-${inv.id}-${idx}`} className="hover:bg-slate-50/70 transition">
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 truncate" title={inv.name || `FAC #${inv.id}`}>
                                    {inv.name || `FAC #${inv.id}`}
                                  </td>
                                  <td className="py-2.5 px-3 truncate">
                                    <div className="font-semibold text-slate-900 truncate" title={inv.patient_name || inv.partner?.name || 'Patient'}>
                                      {inv.patient_name || inv.partner?.name || 'Patient'}
                                    </div>
                                    {inv.ndm && (
                                      <div className="text-[10px] font-mono text-slate-400 truncate">
                                        NDM: {inv.ndm}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-slate-500 hidden sm:table-cell truncate">
                                    {inv.invoice_date || inv.date}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900 text-right whitespace-nowrap">
                                    {formatFCFA(inv.amount_total)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase border max-w-full truncate ${
                                        inv.payment_state === 'paid'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : inv.payment_state === 'partial'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {inv.payment_state === 'paid' ? 'Réglé' : 'Non réglé'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      /* Cashier View: list of payments collected in session */
                      (!myActiveSession || !myActiveSession.transactions || myActiveSession.transactions.length === 0) ? (
                        <div className="text-center py-10 text-slate-400 space-y-1.5">
                          <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-xs text-slate-700">
                            Aucun encaissement pour cette session.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Encaissez une facture en attente pour alimenter votre journal.
                          </p>
                        </div>
                      ) : (
                        <div className="w-full">
                          <table className="w-full text-left text-xs table-fixed border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                <th className="py-2.5 px-3 w-[15%] hidden sm:table-cell">Heure</th>
                                <th className="py-2.5 px-3 w-[25%]">Facture Réf.</th>
                                <th className="py-2.5 px-3 w-[25%]">Patient</th>
                                <th className="py-2.5 px-3 w-[15%] hidden md:table-cell">Mode</th>
                                <th className="py-2.5 px-3 text-right w-[20%]">Montant</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[...(myActiveSession?.transactions || [])].sort((a, b) => b.id - a.id).map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-2.5 px-3 text-[11px] text-slate-500 hidden sm:table-cell truncate">{tx.date}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 truncate" title={tx.reference}>
                                    {tx.reference}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900 truncate" title={tx.patient_name}>
                                    {tx.patient_name}
                                  </td>
                                  <td className="py-2.5 px-3 hidden md:table-cell truncate">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded border border-slate-200 truncate inline-block max-w-full">
                                      {tx.payment_method}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                    +{formatFCFA(tx.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* TAB CONTENT 3: BILLETAGE COMPTOIR (CASHIER) */}
                {isCashier && activeTab === 'billetage' && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">
                          Matrice de Décompte Monnaie / Billetage
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Saisissez le nombre de billets et pièces présents dans votre tiroir.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-500">
                          Total Compté
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {formatFCFA(computedBilletageTotal)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {CASH_DENOMINATIONS.map((denom) => {
                        const count = billetageCounts[denom.value] || 0;
                        const subtotal = count * denom.value;
                        return (
                          <div
                            key={denom.value + denom.label}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div>
                              <div className="font-semibold text-xs text-slate-900">{denom.label}</div>
                              <div className="text-[11px] font-mono text-slate-500">
                                = {formatFCFA(subtotal)}
                              </div>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={count || ''}
                              onChange={(e) =>
                                setBilletageCounts({
                                  ...billetageCounts,
                                  [denom.value]: Math.max(0, parseInt(e.target.value) || 0),
                                })
                              }
                              placeholder="0"
                              className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW FOR SUPERVISOR: ALL SESSIONS MONITORING & CONTROL TABLE           */}
      {/* ========================================================================= */}
      {isSupervisor && supervisorView === 'all_sessions' && (
        <div className="space-y-4">
          {/* INDICATEUR D'ACTIVITÉ RÉCENTE (OUVERTURE & CLÔTURE) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Suivi d&apos;activité des caisses (Ouvertures &amp; Clôtures)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.slice(0, 3).map((s) => {
                const isOpen = s.state === 'in_progress';
                return (
                  <div
                    key={`activity-${s.id}`}
                    className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                      isOpen
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md shrink-0 border ${
                      isOpen
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      {isOpen ? <Unlock className="w-4 h-4 animate-pulse text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {s.cashier_name}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          isOpen
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-slate-800 text-white'
                        }`}>
                          {isOpen ? 'OUVERT' : 'CLÔTURÉ'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 truncate">
                        {s.till_name} ({s.session_code})
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {isOpen ? `Ouvert le ${s.opening_date}` : `Clôturé le ${s.closing_date || s.opening_date}`}
                      </p>
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 col-span-full">
                  Aucune session enregistrée.
                </div>
              )}
            </div>
          </div>

          {/* TOP ACTIONS & SEARCH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par code session, guichet ou caissier..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700"
              >
                <option value="all">Tous les états</option>
                <option value="in_progress">En cours</option>
                <option value="closed">Clôturées</option>
              </select>

              <button
                onClick={() => {
                  setShowOpenModal(true);
                  if (myActiveSession) {
                    setActionError(
                      `Une session (${myActiveSession.session_code}) est déjà en cours d'utilisation pour votre profil (${currentUser?.name}). Veuillez la clôturer avant d'en démarrer une nouvelle.`
                    );
                  } else {
                    if ((profile as string) === 'facture') {
                      setTillNameInput('Poste Facturation 1');
                      setOpeningBalanceInput('0');
                    } else if (isSupervisor) {
                      setTillNameInput('Poste Supervision & Audit');
                      setOpeningBalanceInput('0');
                    } else {
                      setTillNameInput('Guichet Caisse 1');
                      setOpeningBalanceInput('50000');
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ${
                  myActiveSession
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {myActiveSession ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Session Active ({myActiveSession.session_code})</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ouvrir une Session</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* INSPECT DETAIL MODAL OR INLINE VIEW IF SELECTED */}
          {inspectSession ? (
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectSession(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour à la liste</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Fiche Session {inspectSession.session_code} ({inspectSession.till_name})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSessionToPrint(inspectSession);
                      setShowPrintModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimer Bordereau Z
                  </button>

                  {inspectSession.state === 'in_progress' && (
                    <button
                      onClick={() => handleInitiateClose(inspectSession)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Clôturer
                    </button>
                  )}
                </div>
              </div>

              {/* SUMMARY STATS OF INSPECTED SESSION */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Caissier</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    {inspectSession.cashier_name}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Fond Initial
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    {formatFCFA(inspectSession.opening_balance)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Total Encaissé
                  </div>
                  <div className="font-bold text-xs text-emerald-700 mt-0.5">
                    {formatFCFA(inspectSession.total_collected)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Statut</div>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase border ${
                        inspectSession.state === 'in_progress'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {inspectSession.state === 'in_progress' ? 'En cours' : 'Clôturée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TRANSACTIONS IN THIS SESSION */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700">
                  Transactions ({inspectSession.transactions.length})
                </h4>
                {inspectSession.transactions.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                    Aucune transaction enregistrée dans cette session.
                  </div>
                ) : (
                  <div className="w-full rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs table-fixed border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 w-[22%]">Date</th>
                          <th className="py-2 px-3 w-[20%]">Référence</th>
                          <th className="py-2 px-3 w-[26%]">Patient</th>
                          <th className="py-2 px-3 w-[16%] hidden sm:table-cell">Mode</th>
                          <th className="py-2 px-3 text-right w-[16%]">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...inspectSession.transactions].sort((a, b) => b.id - a.id).map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 text-[11px] text-slate-500 truncate">{tx.date}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 truncate">
                              {tx.reference}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 truncate" title={tx.patient_name}>
                              {tx.patient_name}
                            </td>
                            <td className="py-2 px-3 text-slate-600 hidden sm:table-cell truncate">{tx.payment_method}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                              +{formatFCFA(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ALL SESSIONS DATA TABLE */
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
              <div className="w-full">
                <table className="w-full text-left text-xs table-fixed border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 w-[16%]">Code</th>
                      <th className="py-2.5 px-3 w-[16%] hidden md:table-cell">Guichet</th>
                      <th className="py-2.5 px-3 w-[18%]">Caissier</th>
                      <th className="py-2.5 px-2 w-[14%] hidden lg:table-cell">Ouverture</th>
                      <th className="py-2.5 px-2 w-[12%] text-right hidden sm:table-cell">Fond Initial</th>
                      <th className="py-2.5 px-3 w-[14%] text-right">Encaissé</th>
                      <th className="py-2.5 px-2 w-[10%] text-center">Statut</th>
                      <th className="py-2.5 px-2 text-right w-[14%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessionsList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 truncate" title={s.session_code}>
                          {s.session_code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 hidden md:table-cell truncate" title={s.till_name}>{s.till_name}</td>
                        <td className="py-2.5 px-3 text-slate-700 truncate" title={s.cashier_name}>{s.cashier_name}</td>
                        <td className="py-2.5 px-2 text-[11px] text-slate-500 hidden lg:table-cell truncate">{s.opening_date}</td>
                        <td className="py-2.5 px-2 text-slate-700 font-medium text-right hidden sm:table-cell whitespace-nowrap">
                          {formatFCFA(s.opening_balance)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 text-right whitespace-nowrap">
                          {formatFCFA(s.total_collected)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase border truncate max-w-full ${
                              s.state === 'in_progress'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {s.state === 'in_progress' ? 'En cours' : 'Clôturée'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectSession(s)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Détail
                            </button>
                            {s.state === 'in_progress' && (
                              <button
                                onClick={() => handleInitiateClose(s)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Clôturer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: OPEN SESSION                                                    */}
      {/* ========================================================================= */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 text-slate-700 rounded-md">
                  <Unlock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Ouverture de Session</h3>
              </div>
              <button
                onClick={() => setShowOpenModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {myActiveSession ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Session de caisse déjà en cours !</span>
                </div>
                <p>
                  Le profil <strong>{currentUser?.name}</strong> possède actuellement la session active <span className="font-mono font-bold text-amber-950">{myActiveSession.session_code}</span> ({myActiveSession.till_name}).
                </p>
                <p className="text-[11px] text-amber-800 font-semibold bg-amber-100/70 p-2 rounded border border-amber-200">
                  Règle de Sécurité : Vous ne pouvez pas ouvrir une nouvelle session tant que la session en cours n'a pas été clôturée.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Agent Responsable
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.name || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guichet / Poste
                  </label>
                  <input
                    type="text"
                    value={tillNameInput}
                    onChange={(e) => setTillNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fond de Roulement Initial (FCFA)
                  </label>
                  <input
                    type="number"
                    value={openingBalanceInput}
                    onChange={(e) => setOpeningBalanceInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                  {isSupervisor && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      En mode Supervision, la vacation sert au suivi, au contrôle et aux annulations. Aucun fond de caisse n'est requis (0 FCFA).
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowOpenModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs cursor-pointer"
              >
                Fermer
              </button>
              {!myActiveSession && (
                <button
                  onClick={handleConfirmOpenSession}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Valider et Ouvrir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CLOSE SESSION                                                   */}
      {/* ========================================================================= */}
      {showCloseModal && sessionToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Clôture de Session • Arrêté Z
                  </h3>
                  <p className="text-[11px] text-slate-400">{sessionToClose.session_code}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Fond initial :</span>
                <span className="font-semibold text-slate-800">
                  {formatFCFA(sessionToClose.opening_balance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total espèces encaissées :</span>
                <span className="font-semibold text-slate-800">
                  {formatFCFA(sessionToClose.total_cash_collected || sessionToClose.total_collected)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-slate-900 font-bold">
                <span>Fond Théorique Attendu :</span>
                <span className="font-mono">
                  {formatFCFA(
                    (sessionToClose.opening_balance || 0) +
                      (sessionToClose.total_cash_collected || sessionToClose.total_collected || 0)
                  )}
                </span>
              </div>
            </div>

            {/* ACTUAL CASH INPUT */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-xs text-slate-700">
                    Montant Réel en Caisse (Compté physiquement)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBilletageInClose(!showBilletageInClose)}
                    className="text-[11px] text-slate-600 font-semibold hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    {showBilletageInClose ? 'Masquer le décompte' : 'Décompte détaillé'}
                  </button>
                </div>

                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-base text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              {/* BILLETAGE ACCORDION IN CLOSE MODAL */}
              {showBilletageInClose && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-slate-600" />
                      Grille de Billetage Physique :
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                      Total Billetage : {formatFCFA(computedBilletageTotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {CASH_DENOMINATIONS.map((d) => {
                      const qty = billetageCounts[d.value] || 0;
                      const subtotal = d.value * qty;
                      return (
                        <div
                          key={d.value}
                          className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[11px]">{d.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              = {formatFCFA(subtotal)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Qté :</span>
                            <input
                              type="number"
                              min="0"
                              value={billetageCounts[d.value] || ''}
                              onChange={(e) => {
                                const newQty = Math.max(0, parseInt(e.target.value, 10) || 0);
                                const nextCounts = { ...billetageCounts, [d.value]: newQty };
                                setBilletageCounts(nextCounts);
                                const newSum = Object.entries(nextCounts).reduce(
                                  (s, [val, q]) => s + Number(val) * (Number(q) || 0),
                                  0
                                );
                                setActualCashInput(String(newSum));
                              }}
                              placeholder="0"
                              className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-center font-bold text-xs focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setBilletageCounts({});
                        setActualCashInput('0');
                      }}
                      className="text-[11px] text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      Effacer la grille
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActualCashInput(String(computedBilletageTotal));
                        notify(`Montant physique appliqué : ${formatFCFA(computedBilletageTotal)}`, 'info');
                      }}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Appliquer au montant ({formatFCFA(computedBilletageTotal)})
                    </button>
                  </div>
                </div>
              )}

              {/* VARIANCE DISPLAY */}
              {actualCashInput && (
                <div className="text-xs flex items-center justify-between font-semibold px-1">
                  <span className="text-slate-500">Écart calculé :</span>
                  {(() => {
                    const expected =
                      (sessionToClose.opening_balance || 0) +
                      (sessionToClose.total_cash_collected || sessionToClose.total_collected || 0);
                    const actual = Number(actualCashInput) || 0;
                    const diff = actual - expected;
                    if (diff === 0) {
                      return <span className="text-emerald-700">Aucun écart (Équilibré)</span>;
                    } else if (diff > 0) {
                      return <span className="text-emerald-700">+{formatFCFA(diff)} (Excédent)</span>;
                    } else {
                      return <span className="text-rose-600">{formatFCFA(diff)} (Déficit)</span>;
                    }
                  })()}
                </div>
              )}

              <div>
                <label className="block font-semibold text-xs text-slate-700 mb-1">
                  Observations / Notes de Clôture
                </label>
                <textarea
                  rows={2}
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  placeholder="Ex: Caisse vérifiée, remise en coffre effectuée."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-normal"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmCloseSession}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Confirmer la Clôture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: PRINTABLE BORDEREAU Z                                           */}
      {/* ========================================================================= */}
      {showPrintModal && sessionToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Bordereau d&apos;Arrêté de Caisse (Ticket Z)
                </h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PRINTABLE CONTAINER */}
            <div
              id="caisse-session-rapport-z-sheet"
              ref={printRef}
              className="p-5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-900 space-y-3"
            >
              <div className="text-center border-b border-slate-200 pb-2.5 space-y-0.5">
                <div className="font-bold text-xs uppercase">{company.name}</div>
                <div className="text-[10px] text-slate-500">{company.phone}</div>
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 pt-1">
                  ARRÊTÉ DE CAISSE JOURNALIER (RAPPORT Z)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div>Session : <strong>{sessionToPrint.session_code}</strong></div>
                <div>Guichet : <strong>{sessionToPrint.till_name}</strong></div>
                <div>Caissier : <strong>{sessionToPrint.cashier_name}</strong></div>
                <div>Date ouverture : <strong>{sessionToPrint.opening_date}</strong></div>
                <div>Date clôture : <strong>{sessionToPrint.closing_date}</strong></div>
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Fond de caisse initial :</span>
                  <strong>{formatFCFA(sessionToPrint.opening_balance)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total espèces encaissées :</span>
                  <strong>{formatFCFA(sessionToPrint.total_cash_collected || sessionToPrint.total_collected)}</strong>
                </div>
                {sessionToPrint.total_mobile_money_collected ? (
                  <div className="flex justify-between">
                    <span>Total Mobile Money :</span>
                    <strong>{formatFCFA(sessionToPrint.total_mobile_money_collected)}</strong>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-[11px]">
                  <span>TOTAL GÉNÉRAL ENCAISSÉ :</span>
                  <span>{formatFCFA(sessionToPrint.total_collected)}</span>
                </div>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Espèces attendues :</span>
                  <strong>{formatFCFA(sessionToPrint.closing_expected_cash)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Espèces physiques comptées :</span>
                  <strong>{formatFCFA(sessionToPrint.closing_actual_cash)}</strong>
                </div>
                <div className="flex justify-between font-bold text-[11px]">
                  <span>Écart de caisse :</span>
                  <span className={sessionToPrint.cash_variance === 0 ? 'text-slate-900' : 'text-rose-700'}>
                    {sessionToPrint.cash_variance ? `${sessionToPrint.cash_variance > 0 ? '+' : ''}${formatFCFA(sessionToPrint.cash_variance)}` : '0 FCFA'}
                  </span>
                </div>
              </div>

              {sessionToPrint.billetage && Object.values(sessionToPrint.billetage).some((v) => Number(v) > 0) && (
                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[9px]">
                  <div className="font-bold uppercase tracking-wider text-slate-700">Détail du Billetage Physique :</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {CASH_DENOMINATIONS.filter((d) => (sessionToPrint.billetage?.[d.value] || 0) > 0).map((d) => {
                      const qty = sessionToPrint.billetage![d.value];
                      return (
                        <div key={d.value} className="flex justify-between">
                          <span>{d.label} × {qty} :</span>
                          <span className="font-mono">{formatFCFA(d.value * qty)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px] border-t border-slate-200">
                <div className="border-t border-slate-300 pt-1">Signature du Caissier</div>
                <div className="border-t border-slate-300 pt-1">Visa Superviseur</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={handlePrintZ}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer le Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
