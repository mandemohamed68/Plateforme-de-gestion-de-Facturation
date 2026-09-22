import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Wallet,
  X,
  Search,
  FileText,
  Printer,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  FlaskConical,
  BedDouble,
  Receipt,
  Smartphone,
  Check,
  AlertCircle,
  AlertTriangle,
  Shield,
  Trash2,
  Lock,
} from 'lucide-react';
import { AccountPayment, AccountMove, ResPartner, ResUser, CompanySettings } from '../types';
import { formatFCFA, getUserBillingProfile } from '../lib/formatters';
import { PaginationControls } from './PaginationControls';
import { printElement } from '../lib/printUtils';
import { SupervisorCorrectionModal } from './CaisseSessionGuard';
import { logFinancialCorrection, isSupervisorOrAdmin } from '../utils/caisseSessionService';
import { formatDateTimeDDMMYYYY, isDateToday } from '../utils/dateUtils';

interface PaymentsViewProps {
  payments: AccountPayment[];
  moves: AccountMove[];
  partners: ResPartner[];
  currentUser: ResUser | null;
  onRegisterPayment: (paymentData: any) => Promise<void>;
  selectedMoveForPayment: AccountMove | null;
  onClearSelectedMove: () => void;
  autoOpenModal?: boolean;
  onFinishAndReturnToSession?: () => void;
  company?: CompanySettings;
  onNavigateToLab?: () => void;
  onNavigateToTriage?: () => void;
  onNavigateToSoins?: () => void;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  selectedPaymentForReceiptPrint?: AccountPayment | null;
  onClearSelectedPaymentForReceiptPrint?: () => void;
  hasActiveSession?: boolean;
  onNavigateToSessions?: () => void;
  onBackToInvoices?: () => void;
  onRequestOpenSession?: () => void;
}

const PAYMENT_METHODS = [
  { code: 'cash', label: 'Espèces (Caisse)', journalId: 2, icon: Wallet },
  { code: 'wave', label: 'Wave Mobile Money', journalId: 2, icon: Smartphone },
  { code: 'orange_money', label: 'Orange Money', journalId: 2, icon: Smartphone },
  { code: 'moov_money', label: 'Moov Money', journalId: 2, icon: Smartphone },
  { code: 'card', label: 'Carte Bancaire / TPE', journalId: 1, icon: CreditCard },
  { code: 'transfer', label: 'Virement Bancaire', journalId: 1, icon: Building2 },
  { code: 'check', label: 'Chèque Bancaire', journalId: 1, icon: FileText },
];

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments = [],
  moves = [],
  partners = [],
  currentUser,
  onRegisterPayment,
  selectedMoveForPayment,
  onClearSelectedMove,
  autoOpenModal,
  onFinishAndReturnToSession,
  company,
  onNavigateToLab,
  onNavigateToTriage,
  onNavigateToSoins,
  onShowToast,
  selectedPaymentForReceiptPrint,
  onClearSelectedPaymentForReceiptPrint,
  hasActiveSession,
  onNavigateToSessions,
  onBackToInvoices,
  onRequestOpenSession,
}) => {
  const profile = getUserBillingProfile(currentUser);
  const isSupervisor = isSupervisorOrAdmin(currentUser) || profile === 'superviseur';
  const canPerformPaymentAction = isSupervisor;
  const isCashier = profile === 'caisse' || profile === 'facture_caisse' || isSupervisor;

  const [isModalOpen, setIsModalOpen] = useState(!!selectedMoveForPayment || !!autoOpenModal);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company?.default_page_size || 50);
  const [removedPaymentIds, setRemovedPaymentIds] = useState<number[]>([]);

  // Form fields
  const [moveId, setMoveId] = useState<number>(
    selectedMoveForPayment?.id || moves.find((m) => m.state === 'posted' && m.amount_residual > 0)?.id || 0
  );
  const [amount, setAmount] = useState<number>(
    selectedMoveForPayment?.amount_residual || 0
  );
  const [tenderedAmount, setTenderedAmount] = useState<number>(
    selectedMoveForPayment?.amount_residual || 0
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().replace('T', ' ').substring(0, 16)
  );
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>('cash');
  const [journalId, setJournalId] = useState<number>(2); // Default 2: Caisse

  // Search invoice filter within modal
  const [invoiceSearchText, setInvoiceSearchText] = useState('');

  // Mixed / Multi-payment state
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [mixedCashPart, setMixedCashPart] = useState<number>(0);
  const [mixedMobilePart, setMixedMobilePart] = useState<number>(0);
  const [mixedMobileOperator, setMixedMobileOperator] = useState<string>('Wave');
  const [mixedMobileRef, setMixedMobileRef] = useState<string>('');

  // Post-payment receipt & orientation modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentForCorrection, setPaymentForCorrection] = useState<AccountPayment | null>(null);
  const [lastReceiptData, setLastReceiptData] = useState<{
    invoice: AccountMove | null;
    amountPaid: number;
    tenderedAmount?: number;
    changeGiven: number;
    paymentMethodLabel: string;
    receiptNumber: string;
    date: string;
    isMixed?: boolean;
    mixedCash?: number;
    mixedMobile?: number;
    mixedOperator?: string;
    mixedRef?: string;
  } | null>(null);

  const receiptPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintExistingPayment = (p: any) => {
    const matchedInvoice = moves.find((m) => m.id === p.move_id || m.name === p.move_name);
    setLastReceiptData({
      invoice: matchedInvoice || ({
        id: p.move_id,
        name: p.move_name,
        patient_name: p.partner_name,
        ndm: p.ndm_number || 'NDM-2026',
      } as any),
      amountPaid: p.amount,
      changeGiven: 0,
      paymentMethodLabel: p.payment_method_name || p.journal_name || 'Espèces',
      receiptNumber: p.name || `PAY/2026/000${p.id}`,
      date: (p.payment_date || p.created_at || '').replace('T', ' ').substring(0, 16),
    });
    setShowReceiptModal(true);
  };

  React.useEffect(() => {
    if (selectedPaymentForReceiptPrint) {
      handlePrintExistingPayment(selectedPaymentForReceiptPrint);
      onClearSelectedPaymentForReceiptPrint?.();
    }
  }, [selectedPaymentForReceiptPrint]);

  React.useEffect(() => {
    if (selectedMoveForPayment) {
      if (!hasActiveSession && !isSupervisor) {
        if (onRequestOpenSession) {
          onRequestOpenSession();
        } else if (onNavigateToSessions) {
          onNavigateToSessions();
        }
        if (onShowToast) {
          onShowToast("Ouverture de session requise pour enregistrer un règlement.", 'warning', 'Session Requise');
        }
        return;
      }
      setMoveId(selectedMoveForPayment.id);
      setAmount(selectedMoveForPayment.amount_residual);
      setTenderedAmount(selectedMoveForPayment.amount_residual);
      setIsModalOpen(true);
    } else if (autoOpenModal) {
      handleOpenModal();
    }
  }, [selectedMoveForPayment, autoOpenModal, hasActiveSession]);

  const handleClose = () => {
    setIsModalOpen(false);
    onClearSelectedMove();
    if (onFinishAndReturnToSession) {
      onFinishAndReturnToSession();
    }
  };

  const handleOpenModal = () => {
    if (!hasActiveSession && !isSupervisor) {
      if (onRequestOpenSession) {
        onRequestOpenSession();
      } else if (onNavigateToSessions) {
        onNavigateToSessions();
      }
      if (onShowToast) {
        onShowToast("Ouverture de session requise pour enregistrer un règlement.", 'warning', 'Session Requise');
      }
      return;
    }
    const uncollectedMove = moves.find((m) => m.state === 'posted' && m.amount_residual > 0);
    if (uncollectedMove) {
      setMoveId(uncollectedMove.id);
      setAmount(uncollectedMove.amount_residual);
      setTenderedAmount(uncollectedMove.amount_residual);
    }
    setIsModalOpen(true);
  };

  const handleMoveSelectChange = (id: number) => {
    setMoveId(id);
    const m = moves.find((item) => item.id === id);
    if (m) {
      const res = m.amount_residual;
      setAmount(res);
      setTenderedAmount(res);
      if (isMixedPayment) {
        const half = Math.floor(res / 2);
        setMixedCashPart(half);
        setMixedMobilePart(res - half);
        setTenderedAmount(half);
      }
    }
  };

  const selectedMethod = PAYMENT_METHODS.find((m) => m.code === paymentMethodCode) || PAYMENT_METHODS[0];
  const effectiveCashAmount = isMixedPayment ? (mixedCashPart || 0) : (amount || 0);
  const changeToReturn = (paymentMethodCode === 'cash' || isMixedPayment) ? Math.max(0, (tenderedAmount || 0) - effectiveCashAmount) : 0;
  const cashShortfall = (paymentMethodCode === 'cash' || isMixedPayment) ? Math.max(0, effectiveCashAmount - (tenderedAmount || 0)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveId || amount <= 0) {
      if (onShowToast) onShowToast('Veuillez sélectionner une facture valide et un montant > 0', 'error');
      return;
    }

    if (isMixedPayment) {
      if ((mixedCashPart || 0) + (mixedMobilePart || 0) !== amount) {
        if (onShowToast) onShowToast(`La somme Espèces (${formatFCFA(mixedCashPart)}) + Mobile (${formatFCFA(mixedMobilePart)}) doit être égale à ${formatFCFA(amount)}`, 'warning');
        return;
      }
      if ((tenderedAmount || 0) < mixedCashPart) {
        if (onShowToast) onShowToast(`Espèces remises (${formatFCFA(tenderedAmount)}) insuffisantes pour la part espèces (${formatFCFA(mixedCashPart)})`, 'warning');
        return;
      }
    } else if (paymentMethodCode === 'cash' && (tenderedAmount || 0) < amount) {
      if (onShowToast) onShowToast(`Montant remis (${formatFCFA(tenderedAmount)}) insuffisant pour régler ${formatFCFA(amount)}`, 'warning');
      return;
    }

    const currentSelectedMove = moves.find((m) => m.id === moveId) || selectedMoveForPayment;

    const methodLabel = isMixedPayment
      ? `Mixte (${formatFCFA(mixedCashPart)} Espèces + ${formatFCFA(mixedMobilePart)} ${mixedMobileOperator})`
      : selectedMethod.label;

    try {
      await onRegisterPayment({
        move_id: moveId,
        amount: Number(amount),
        payment_date: paymentDate,
        journal_id: isMixedPayment ? 2 : selectedMethod.journalId,
        payment_method_code: isMixedPayment ? 'mixed' : paymentMethodCode,
        payment_method_name: methodLabel,
        patient_name: currentSelectedMove?.patient_name || currentSelectedMove?.partner?.name,
        ndm_number: currentSelectedMove?.ndm,
      });

      // Prepare receipt & orientation data
      const receiptNo = `REC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
      setLastReceiptData({
        invoice: currentSelectedMove || null,
        amountPaid: Number(amount),
        tenderedAmount: (paymentMethodCode === 'cash' || isMixedPayment) ? tenderedAmount : undefined,
        changeGiven: changeToReturn,
        paymentMethodLabel: methodLabel,
        receiptNumber: receiptNo,
        date: new Date().toLocaleString('fr-FR'),
        isMixed: isMixedPayment,
        mixedCash: mixedCashPart,
        mixedMobile: mixedMobilePart,
        mixedOperator: mixedMobileOperator,
        mixedRef: mixedMobileRef,
      });

      setIsModalOpen(false);
      setShowReceiptModal(true);
      if (onShowToast) {
        onShowToast(`Encaissement de ${formatFCFA(amount)} validé avec succès ! Reçu émis.`, 'success');
      }
    } catch (err) {
      console.error('Erreur encaissement:', err);
      if (onShowToast) onShowToast("Erreur lors de l'enregistrement du règlement", 'error');
    }
  };

  const handlePrintReceipt = () => {
    if (receiptPrintRef.current) {
      printElement(receiptPrintRef.current, 'Reçu de Caisse - RÈGLEMENT');
    }
  };

  const totalPaymentsAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const filteredPayments = payments
    .filter((p) => {
      if (removedPaymentIds.includes(p.id)) return false;

      // Respect user compartment boundaries
      // 1. Non-supervisors/admins can only see their own collections
      // 2. Non-supervisors/admins can only see TODAY'S collections (info antérieure invisible)
      if (!isSupervisorOrAdmin(currentUser)) {
        const isOwnPayment = Number(p.user_id) === Number(currentUser?.id);
        if (!isOwnPayment) return false;

        // Restriction à la date du jour (heure locale)
        if (!isDateToday(p.payment_date || p.created_at)) return false;
      }

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.partner_name && (p.partner_name || '').toString().toLowerCase().includes(q)) ||
        (p.move_name && (p.move_name || '').toString().toLowerCase().includes(q)) ||
        (p.journal_name && (p.journal_name || '').toString().toLowerCase().includes(q)) ||
        (p.name && (p.name || '').toString().toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.payment_date || a.created_at || 0).getTime();
      const dateB = new Date(b.payment_date || b.created_at || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  const unpaidInvoices = moves.filter((m) => {
    if (m.move_type !== 'out_invoice' || m.state !== 'posted' || m.payment_state === 'paid') return false;
    if (m.amount_residual <= 0) return false;
    if (!invoiceSearchText) return true;
    const q = invoiceSearchText.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.patient_name && m.patient_name.toLowerCase().includes(q)) ||
      (m.partner?.name && m.partner.name.toLowerCase().includes(q)) ||
      (m.ndm && m.ndm.toLowerCase().includes(q))
    );
  });

  const currentMoveDetails = moves.find((m) => m.id === moveId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Back / Return button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onBackToInvoices && (
            <button
              type="button"
              onClick={onBackToInvoices}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200/80 transition cursor-pointer"
              title="Retourner à la Liste des Factures"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour Facturation</span>
            </button>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Encaissements &amp; Règlements de Caisse</span>
              {hasActiveSession ? (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Session Active
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                  Session Fermée (Consultation)
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500">
              Journal des encaissements, quittances et lettrages comptables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToSessions && (
            <button
              type="button"
              onClick={onNavigateToSessions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Gérer les Sessions</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Règlements Enregistrés
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatFCFA(totalPaymentsAmount)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{payments.length} transaction(s) Lettrées &amp; Réconciliées</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Journal Banque &amp; TPE (512)
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatFCFA(
                payments
                  .filter((p) => p.journal_id === 1)
                  .reduce((acc, p) => acc + (p.amount || 0), 0)
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {payments.filter((p) => p.journal_id === 1).length} virement(s) &amp; cartes
            </div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Journal Caisse &amp; Espèces (530)
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {formatFCFA(
                payments
                  .filter((p) => p.journal_id === 2 || !p.journal_id)
                  .reduce((acc, p) => acc + (p.amount || 0), 0)
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {payments.filter((p) => p.journal_id === 2 || !p.journal_id).length} encaissement(s) guichet
            </div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par patient, NDM, facture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onFinishAndReturnToSession && (
            <button
              onClick={onFinishAndReturnToSession}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Revenir à ma Session</span>
            </button>
          )}

          {isCashier && (
            <button
              onClick={handleOpenModal}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer un Règlement</span>
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-[20%]">Réf. Paiement</th>
                <th className="py-2.5 px-3 w-[15%] hidden sm:table-cell">Facture Associée</th>
                <th className="py-2.5 px-3 w-[25%]">Patient / Client</th>
                <th className="py-2.5 px-3 w-[15%] hidden md:table-cell">Mode &amp; Journal</th>
                <th className="py-2.5 px-3 text-right w-[15%]">Montant</th>
                <th className="py-2.5 px-3 text-center w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredPayments.length > 0 ? (
                filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900 truncate" title={p.name || `PAY/2026/000${p.id}`}>
                      {p.name || `PAY/2026/000${p.id}`}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {formatDateTimeDDMMYYYY(p.payment_date || p.created_at)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-mono hidden sm:table-cell truncate" title={p.move_name || `#${p.move_id}`}>
                      {p.move_name || `#${p.move_id}`}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 truncate" title={p.partner_name || 'Patient'}>
                      <div>{p.partner_name || 'Patient'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {p.ndm_number ? `NDM: ${p.ndm_number}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 hidden md:table-cell truncate">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold truncate inline-block max-w-full">
                        {p.payment_method_name || p.journal_name || (p.journal_id === 1 ? 'Banque' : 'Caisse')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700 text-xs whitespace-nowrap">
                      + {formatFCFA(p.amount)}
                      <div className="text-[10px] text-emerald-600 font-normal">Lettré &amp; Encaissé</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintExistingPayment(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 inline-flex items-center justify-center transition cursor-pointer"
                          title="Imprimer le Reçu"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canPerformPaymentAction ? (
                          <button
                            onClick={() => setPaymentForCorrection(p)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 rounded-lg border border-rose-200 inline-flex items-center justify-center transition cursor-pointer"
                            title="Corriger, modifier ou annuler cet encaissement (Superviseur / Administrateur avec motif obligatoire)"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onShowToast?.(
                                "Action restreinte : Seuls les Superviseurs et Administrateurs sont habilités à modifier, supprimer ou annuler un encaissement déjà fait.",
                                'error',
                                'Accès Superviseur Requis'
                              );
                            }}
                            className="p-1.5 bg-slate-50 text-slate-300 hover:text-slate-500 rounded-lg border border-slate-200 inline-flex items-center justify-center transition cursor-pointer"
                            title="Action restreinte : Réservée aux Superviseurs et Administrateurs avec motif obligatoire"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aucun règlement enregistré pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredPayments.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="paiements"
        />
      </div>

      {/* REGISTER PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 max-h-[95vh] flex flex-col">
            <div className="bg-white border-b border-slate-200 text-slate-900 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>
                <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                    Enregistrer un Règlement / Recouvrement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lettrage comptable, décompte de monnaie et émission de quittance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Select Invoice */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                    Facture / Créance à apurer <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {unpaidInvoices.length} facture(s) en attente
                  </span>
                </div>

                <select
                  value={moveId}
                  onChange={(e) => handleMoveSelectChange(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-xs shadow-xs"
                >
                  <option value={0}>-- Choisir la facture à encaisser --</option>
                  {unpaidInvoices.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || `#${m.id}`} — {m.patient_name || m.partner?.name || 'Patient'} ({m.ndm ? `NDM: ${m.ndm}` : ''}) — Dû: {formatFCFA(m.amount_residual)}
                    </option>
                  ))}
                </select>

                {currentMoveDetails && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {currentMoveDetails.patient_name || currentMoveDetails.partner?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentMoveDetails.ndm && <span>NDM: {currentMoveDetails.ndm} • </span>}
                        <span>Total Facture : {formatFCFA(currentMoveDetails.amount_total)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Reste à payer</div>
                      <div className="text-base font-black text-rose-600 font-mono">
                        {formatFCFA(currentMoveDetails.amount_residual)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Mode Selection & Mixed Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                    Mode de Règlement
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMixedPayment;
                      setIsMixedPayment(next);
                      if (next) {
                        const half = Math.floor(amount / 2);
                        setMixedCashPart(half);
                        setMixedMobilePart(amount - half);
                        setTenderedAmount(half);
                      } else {
                        setTenderedAmount(amount);
                      }
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                      isMixedPayment
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isMixedPayment ? 'Règlement Mixte Activé' : 'Activer Règlement Mixte (Espèces + Mobile)'}</span>
                  </button>
                </div>

                {!isMixedPayment ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = paymentMethodCode === method.code;
                      return (
                        <button
                          key={method.code}
                          type="button"
                          onClick={() => {
                            setPaymentMethodCode(method.code);
                            setJournalId(method.journalId);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                          <span className="font-bold text-[11px] leading-tight">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                      <span>Ventilation du Règlement Mixte :</span>
                      <span className={`font-mono text-xs font-black ${
                        (mixedCashPart + mixedMobilePart === amount) ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        Total ventilé : {formatFCFA(mixedCashPart + mixedMobilePart)} / {formatFCFA(amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Part 1: Cash */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                        <span className="font-bold text-[11px] text-slate-700 block">
                          Partie 1 : Espèces (FCFA)
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max={amount}
                          value={mixedCashPart || ''}
                          onChange={(e) => {
                            const cashVal = Math.max(0, Number(e.target.value));
                            setMixedCashPart(cashVal);
                            const rem = Math.max(0, amount - cashVal);
                            setMixedMobilePart(rem);
                            setTenderedAmount(cashVal);
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-sm text-slate-900"
                        />
                      </div>

                      {/* Part 2: Mobile Money */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-700 block">
                            Partie 2 : Mobile Money
                          </span>
                          <select
                            value={mixedMobileOperator}
                            onChange={(e) => setMixedMobileOperator(e.target.value)}
                            className="text-[11px] font-bold bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5"
                          >
                            <option value="Wave">Wave</option>
                            <option value="Orange Money">Orange Money</option>
                            <option value="Moov Money">Moov Money</option>
                            <option value="MTN MoMo">MTN MoMo</option>
                          </select>
                        </div>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={mixedMobilePart || ''}
                          onChange={(e) => {
                            const mobVal = Math.max(0, Number(e.target.value));
                            setMixedMobilePart(mobVal);
                            const rem = Math.max(0, amount - mobVal);
                            setMixedCashPart(rem);
                            setTenderedAmount(rem);
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-sm text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & Change Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                    Montant Total à Encaisser (FCFA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAmount(val);
                      if (isMixedPayment) {
                        const half = Math.floor(val / 2);
                        setMixedCashPart(half);
                        setMixedMobilePart(val - half);
                        setTenderedAmount(half);
                      } else if (paymentMethodCode === 'cash') {
                        setTenderedAmount(val);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-slate-900 shadow-xs"
                  />
                </div>

                {(paymentMethodCode === 'cash' || isMixedPayment) ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                      Espèces Remises par le Patient (FCFA)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={tenderedAmount || ''}
                      onChange={(e) => setTenderedAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-base font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 shadow-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                      Date &amp; Heure d'Encaissement
                    </label>
                    <input
                      type="text"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 text-xs shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* QUICK CASH TENDER BUTTONS */}
              {(paymentMethodCode === 'cash' || isMixedPayment) && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Boutons rapides versement :</span>
                    <span className="text-slate-700 font-bold">Dû en espèces : {formatFCFA(effectiveCashAmount)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTenderedAmount(effectiveCashAmount)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition cursor-pointer border border-slate-200"
                    >
                      Exact ({formatFCFA(effectiveCashAmount)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenderedAmount(effectiveCashAmount + 500)}
                      className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-slate-200"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenderedAmount(effectiveCashAmount + 1000)}
                      className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-slate-200"
                    >
                      +1 000
                    </button>
                    {[2000, 5000, 10000, 20000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => setTenderedAmount(denom)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-slate-200"
                      >
                        {formatFCFA(denom)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* REAL-TIME CHANGE CALCULATION & VALIDATION */}
              {(paymentMethodCode === 'cash' || isMixedPayment) && (
                <div>
                  {cashShortfall > 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-amber-900">Montant versé insuffisant :</span>
                      </div>
                      <span className="font-mono font-black text-amber-800 text-sm">
                        Manque {formatFCFA(cashShortfall)}
                      </span>
                    </div>
                  ) : changeToReturn === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-slate-600" />
                        <span className="font-bold text-slate-800">Compte exact :</span>
                      </div>
                      <span className="font-mono font-bold text-slate-600 text-sm">
                        0 FCFA à rendre
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in-50 duration-150">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-emerald-900">Monnaie à rendre au patient :</span>
                      </div>
                      <span className="font-mono font-black text-emerald-800 text-base">
                        {formatFCFA(changeToReturn)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 flex items-center justify-between space-x-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Fermer / Retour</span>
                </button>
                <button
                  type="submit"
                  disabled={!moveId || amount <= 0}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider l'Encaissement &amp; Émettre le Reçu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST-PAYMENT RECEIPT & PATIENT ORIENTATION MODAL ("LA SUITE") */}
      {showReceiptModal && lastReceiptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowReceiptModal(false);
                handleClose();
              }}
              className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
              {/* PRINTABLE RECEIPT TICKET */}
              <div
                ref={receiptPrintRef}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 space-y-2.5"
              >
                <div className="text-center border-b border-slate-200 pb-2 space-y-0.5">
                  <div className="font-bold text-xs uppercase">{company?.name || 'CENTRE HOSPITALIER'}</div>
                  <div className="text-[10px] text-slate-500">{company?.phone || '+226 25 30 00 00'}</div>
                  <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 pt-1">
                    REÇU DE CAISSE / QUITTANCE OFFICIELLE
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div>N° Reçu : <strong>{lastReceiptData.receiptNumber}</strong></div>
                  <div>Date : <strong>{lastReceiptData.date}</strong></div>
                  <div>Patient : <strong>{lastReceiptData.invoice?.patient_name || lastReceiptData.invoice?.partner?.name || 'Patient'}</strong></div>
                  <div>NDM : <strong>{lastReceiptData.invoice?.ndm || 'NDM-0000'}</strong></div>
                  <div>Facture : <strong>{lastReceiptData.invoice?.name || `#${lastReceiptData.invoice?.id}`}</strong></div>
                  <div>Mode : <strong>{lastReceiptData.paymentMethodLabel}</strong></div>
                </div>

                <div className="border-t border-b border-slate-200 py-2 space-y-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span>MONTANT ENCAISSÉ :</span>
                    <span>{formatFCFA(lastReceiptData.amountPaid)}</span>
                  </div>
                  {lastReceiptData.isMixed && (
                    <div className="text-[10px] text-slate-600 bg-slate-100 p-1 rounded">
                      Ventilation : {formatFCFA(lastReceiptData.mixedCash || 0)} Espèces + {formatFCFA(lastReceiptData.mixedMobile || 0)} {lastReceiptData.mixedOperator || 'Mobile'}
                    </div>
                  )}
                  {lastReceiptData.tenderedAmount && (
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Espèces Remises :</span>
                      <span>{formatFCFA(lastReceiptData.tenderedAmount)}</span>
                    </div>
                  )}
                  {lastReceiptData.changeGiven > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                      <span>Monnaie Rendue :</span>
                      <span>{formatFCFA(lastReceiptData.changeGiven)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Solde restant dû :</span>
                    <span>{formatFCFA(Math.max(0, (lastReceiptData.invoice?.amount_residual || 0) - lastReceiptData.amountPaid))}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  Document certifié conforme • Validé par le Guichet Caisse
                </div>
              </div>

              {/* NEXT WORKFLOW STEPS ("LA SUITE DU PARCOURS PATIENT") */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  <span>Suite du Parcours Patient (Orientation Immédiate) :</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setShowReceiptModal(false);
                      handleClose();
                      if (onNavigateToTriage) {
                        onNavigateToTriage();
                      } else if (onShowToast) {
                        onShowToast('Patient orienté vers la salle de triage et consultation', 'info');
                      }
                    }}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Triage / Consultation</div>
                    <div className="text-[10px] text-slate-500">Prise de constantes &amp; médecin</div>
                  </button>

                  <button
                    onClick={() => {
                      setShowReceiptModal(false);
                      handleClose();
                      if (onNavigateToLab) {
                        onNavigateToLab();
                      } else if (onShowToast) {
                        onShowToast('Patient orienté vers les prélèvements de laboratoire', 'info');
                      }
                    }}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Prélèvements Labo</div>
                    <div className="text-[10px] text-slate-500">Prélèvement de tubes &amp; analyses</div>
                  </button>

                  <button
                    onClick={() => {
                      setShowReceiptModal(false);
                      handleClose();
                      if (onNavigateToSoins) {
                        onNavigateToSoins();
                      } else if (onShowToast) {
                        onShowToast('Patient orienté vers le service de soins et hospitalisation', 'info');
                      }
                    }}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <BedDouble className="w-4 h-4 text-emerald-600" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Soins &amp; Hospit</div>
                    <div className="text-[10px] text-slate-500">Administration des soins / lit</div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Reçu</span>
                </button>

                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    handleClose();
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Terminer / Retour Caisse
                </button>
              </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR AUDIT & CORRECTION MODAL */}
      {paymentForCorrection && (
        <SupervisorCorrectionModal
          isOpen={Boolean(paymentForCorrection)}
          onClose={() => setPaymentForCorrection(null)}
          supervisorUser={currentUser}
          targetItem={{
            type: 'payment',
            ref: paymentForCorrection.name || `PAY/2026/000${paymentForCorrection.id}`,
            amount: paymentForCorrection.amount,
            partnerName: paymentForCorrection.partner_name,
          }}
          onConfirm={async (action, reason) => {
            logFinancialCorrection({
              supervisorId: currentUser?.id || 1,
              supervisorName: currentUser?.name || 'Superviseur Caisse',
              targetType: 'payment',
              targetRef: paymentForCorrection.name || `PAY/2026/000${paymentForCorrection.id}`,
              action: action,
              reason: reason,
              oldAmount: paymentForCorrection.amount,
              details: `Règlement patient: ${paymentForCorrection.partner_name || 'N/A'} (Mode: ${paymentForCorrection.journal_name || paymentForCorrection.payment_method_line_id})`,
            });

            if (action === 'delete' || action === 'cancel') {
              try {
                await fetch(`/api/payments/${paymentForCorrection.id}`, { method: 'DELETE' });
                setRemovedPaymentIds((prev) => [...prev, paymentForCorrection.id]);
              } catch (err) {
                console.error('Erreur lors de la suppression backend du paiement:', err);
              }
            }

            onShowToast?.(
              `Règlement ${paymentForCorrection.name || `#${paymentForCorrection.id}`} ${action === 'delete' ? 'supprimé' : action === 'edit' ? 'rectifié' : 'annulé'} avec succès par le Superviseur ${currentUser?.name || ''}. Motif consigné : "${reason}".`,
              'success',
              'Correction Validée par Superviseur'
            );
            setPaymentForCorrection(null);
            if (onFinishAndReturnToSession) {
              onFinishAndReturnToSession();
            }
          }}
        />
      )}
    </div>
  );
};
