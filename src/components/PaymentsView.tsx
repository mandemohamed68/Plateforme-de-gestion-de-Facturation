import React, { useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, Calendar, Building2, Wallet, X, Search, FileText } from 'lucide-react';
import { AccountPayment, AccountMove, ResPartner, ResUser, CompanySettings } from '../types';
import { formatFCFA, getUserBillingProfile } from '../lib/formatters';
import { PaginationControls } from './PaginationControls';

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
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  moves,
  partners,
  currentUser,
  onRegisterPayment,
  selectedMoveForPayment,
  onClearSelectedMove,
  autoOpenModal,
  onFinishAndReturnToSession,
  company,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(!!selectedMoveForPayment || !!autoOpenModal);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company?.default_page_size || 50);

  // Form fields
  const [moveId, setMoveId] = useState<number>(
    selectedMoveForPayment?.id || moves.find((m) => m.state === 'posted' && m.amount_residual > 0)?.id || 1
  );
  const [amount, setAmount] = useState<number>(
    selectedMoveForPayment?.amount_residual || 1000
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().replace('T', ' ').substring(0, 16)
  );
  const [journalId, setJournalId] = useState<number>(1); // 1: Banque, 2: Caisse

  React.useEffect(() => {
    if (selectedMoveForPayment) {
      setMoveId(selectedMoveForPayment.id);
      setAmount(selectedMoveForPayment.amount_residual);
      setIsModalOpen(true);
    } else if (autoOpenModal) {
      handleOpenModal();
    }
  }, [selectedMoveForPayment, autoOpenModal]);

  const handleClose = () => {
    setIsModalOpen(false);
    onClearSelectedMove();
    if (onFinishAndReturnToSession) {
      onFinishAndReturnToSession();
    }
  };

  const handleOpenModal = () => {
    const uncollectedMove = moves.find((m) => m.state === 'posted' && m.amount_residual > 0);
    if (uncollectedMove) {
      setMoveId(uncollectedMove.id);
      setAmount(uncollectedMove.amount_residual);
    }
    setIsModalOpen(true);
  };

  const handleMoveSelectChange = (id: number) => {
    setMoveId(id);
    const m = moves.find((item) => item.id === id);
    if (m) {
      setAmount(m.amount_residual);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegisterPayment({
      move_id: moveId,
      amount: Number(amount),
      payment_date: paymentDate,
      journal_id: journalId,
    });
    handleClose();
  };

  const totalPaymentsAmount = payments.reduce((acc, p) => acc + p.amount, 0);

  const profile = getUserBillingProfile(currentUser);
  const isSupervisor = profile === 'superviseur';
  const isCashier = profile === 'caisse' || profile === 'facture_caisse';

  const filteredPayments = payments
    .filter((p) => {
      // Role-based visibility restriction: see own payments or legacy data
      if (!isSupervisor) {
        if (p.user_id && p.user_id !== currentUser?.id) return false;
      }

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.partner_name && (p.partner_name || '').toString().toLowerCase().includes(q)) ||
        (p.move_name && (p.move_name || '').toString().toLowerCase().includes(q)) ||
        (p.journal_name && (p.journal_name || '').toString().toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.payment_date || a.create_date || 0).getTime();
      const dateB = new Date(b.payment_date || b.create_date || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Règlements Enregistrés
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatFCFA(totalPaymentsAmount)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              {payments.length} transaction(s) Lettrées &amp; Réconciliées
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Journal Banque (Code 512)
            </div>
            <div className="text-2xl font-black text-[#0f172a] mt-1">
              {formatFCFA(
                payments
                  .filter((p) => p.journal_id === 1)
                  .reduce((acc, p) => acc + p.amount, 0)
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {payments.filter((p) => p.journal_id === 1).length} virements reçus
            </div>
          </div>
          <div className="p-3 bg-slate-100 text-[#0f172a] rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Journal Caisse (Code 530)
            </div>
            <div className="text-2xl font-black text-slate-700 mt-1">
              {formatFCFA(
                payments
                  .filter((p) => p.journal_id === 2)
                  .reduce((acc, p) => acc + p.amount, 0)
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">Encaissements physiques</div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par client, facture, journal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onFinishAndReturnToSession && (
            <button
              onClick={onFinishAndReturnToSession}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <span>⬅️ Revenir à ma Session</span>
            </button>
          )}

          {isCashier && (
            <button
              onClick={handleOpenModal}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer un Règlement</span>
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-[20%]">Réf. Paiement</th>
                <th className="py-2.5 px-3 w-[20%] hidden sm:table-cell">Facture Associée</th>
                <th className="py-2.5 px-3 w-[25%]">Client / Tiers</th>
                <th className="py-2.5 px-3 w-[15%] hidden md:table-cell">Journal</th>
                <th className="py-2.5 px-3 text-right w-[20%]">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredPayments.length > 0 ? (
                filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900 truncate" title={`PAY/2026/000${p.id}`}>
                      PAY/2026/000{p.id}
                      <div className="text-[10px] text-slate-400 font-normal">{(p.payment_date || p.created_at || '').replace('T', ' ').substring(0, 16)}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700 font-mono hidden sm:table-cell truncate" title={p.move_name || `#${p.move_id}`}>
                      {p.move_name || `#${p.move_id}`}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 truncate" title={p.partner_name || 'Client'}>
                      {p.partner_name || 'Client'}
                    </td>
                    <td className="py-2.5 px-3 hidden md:table-cell truncate">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold truncate inline-block max-w-full">
                        {p.journal_name || 'Banque'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700 text-xs whitespace-nowrap">
                      + {formatFCFA(p.amount)}
                      <div className="text-[10px] text-emerald-600 font-normal">Lettré</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Aucun paiement enregistré pour l'instant.
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-white border-b border-slate-200 text-slate-900 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-slate-100 rounded-md border border-slate-200 text-slate-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-tight text-slate-800">Enregistrer un Règlement Client</h3>
                  <p className="text-[11px] text-slate-500">Lettrage comptable et réconciliation de caisse</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Select Invoice */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider block">
                  Facture Client à lettrer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={moveId}
                  onChange={(e) => handleMoveSelectChange(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-xs shadow-sm"
                >
                  {moves
                    .filter((m) => m.state === 'posted' && m.amount_residual > 0)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || `#${m.id}`} — {m.partner?.name} (Solde Dû: {formatFCFA(m.amount_residual)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider block">
                  Montant Encaissé (FCFA) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider block">
                  Date du Règlement
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-xs shadow-sm"
                />
              </div>

              {/* Journal */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider block">
                  Journal Comptable de Destination
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setJournalId(1)}
                    className={`p-3 rounded-md border text-center font-bold flex items-center justify-center space-x-2 transition-all ${
                      journalId === 1
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Journal Banque (512)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJournalId(2)}
                    className={`p-3 rounded-md border text-center font-bold flex items-center justify-center space-x-2 transition-all ${
                      journalId === 2
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Journal Caisse (530)</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-300 rounded-md font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md shadow-sm transition-colors text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Valider &amp; Réconcilier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
