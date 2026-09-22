import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  DollarSign,
  X,
  History,
  Trash2,
  Edit3,
} from 'lucide-react';
import { ResUser, TillSession, AccountMove } from '../types';
import {
  openNewCashierSession,
  closeCashierSession,
  logFinancialCorrection,
  loadFinancialCorrections,
  FinancialCorrectionLog,
} from '../utils/caisseSessionService';
import { getCurrentDateDDMMYYYY, getCurrentDateTimeDDMMYYYY, formatDateDDMMYYYY } from '../utils/dateUtils';
import { formatFCFA } from '../lib/formatters';

interface MandatorySessionOpenModalProps {
  isOpen: boolean;
  currentUser: ResUser | null;
  onSessionOpened: (session: TillSession) => void;
  onClose?: () => void;
}

export const MandatorySessionOpenModal: React.FC<MandatorySessionOpenModalProps> = ({
  isOpen,
  currentUser,
  onSessionOpened,
  onClose,
}) => {
  const [tillName, setTillName] = useState('Guichet Caisse 1 (Central)');
  const [openingBalance, setOpeningBalance] = useState('50000');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = openNewCashierSession({
        userId: currentUser?.id || 1,
        userName: currentUser?.name || currentUser?.login || 'Caissier',
        tillName,
        openingBalance: Number(openingBalance) || 0,
        notes,
      });
      onSessionOpened(created);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Protocole de Caisse Sécurisée
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Ouverture de Session de Caisse
              </h3>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
              title="Fermer (Consulter sans ouvrir de session)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Session continue &amp; Arrêté officiel obligatoire</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              Conformément à la réglementation hospitalière, vous devez déclarer votre fond de caisse initial pour démarrer vos encaissements. Cette session restera active et sécurisée même en cas de fermeture du navigateur ou de déconnexion, jusqu'à votre clôture définitive.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Opérateur de Caisse</span>
              <strong className="text-slate-900 truncate block mt-0.5">{currentUser?.name || currentUser?.login || 'Caissier'}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date d'Ouverture</span>
              <strong className="text-slate-900 block mt-0.5 font-mono">{getCurrentDateTimeDDMMYYYY()}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sélection du Guichet / Point d'Encaissement
            </label>
            <select
              value={tillName}
              onChange={(e) => setTillName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-slate-900 bg-white"
            >
              <option value="Guichet Caisse 1 (Central)">Guichet Caisse 1 (Accueil &amp; Consultations)</option>
              <option value="Guichet Caisse 2 (Urgences 24/7)">Guichet Caisse 2 (Urgences &amp; Soins de nuit)</option>
              <option value="Guichet Caisse 3 (Laboratoire)">Guichet Caisse 3 (Laboratoire d'Analyses)</option>
              <option value="Guichet Caisse 4 (Maternité)">Guichet Caisse 4 (Maternité &amp; Pédiatrie)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fond de Caisse Initial Remis (FCFA)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="500"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-hidden focus:border-slate-900"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">FCFA</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Montant physique des billets et pièces en caisse remis par le Superviseur.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observations / Notes (facultatif)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Vacation du matin, relève effectuée avec collègue"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Consulter sans ouvrir</span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Unlock className="w-4 h-4" />
              <span>Ouvrir la Session du Jour</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ActiveSessionBarProps {
  session: TillSession;
  onInitiateClose: () => void;
}

export const ActiveSessionBar: React.FC<ActiveSessionBarProps> = ({ session, onInitiateClose }) => {
  const totalEncaisse =
    (session.total_cash_collected || 0) +
    (session.total_wave_collected || 0) +
    (session.total_om_collected || 0) +
    (session.total_card_collected || 0);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
            {session.session_code}
          </span>
          <span className="font-bold text-slate-800">{session.till_name}</span>
          <span className="text-slate-400 font-medium">• Ouverte le {session.opening_date}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-medium block">Fond initial : {formatFCFA(session.opening_balance)}</span>
          <span className="text-xs font-black text-slate-900">
            Total Encaissé : {formatFCFA(totalEncaisse)}
          </span>
        </div>

        <button
          onClick={onInitiateClose}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>Clôturer ma Session</span>
        </button>
      </div>
    </div>
  );
};

interface SupervisorCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: ResUser | null;
  supervisorUser?: ResUser | null;
  targetItem: {
    type: 'invoice' | 'payment';
    ref: string;
    amount: number;
    partnerName?: string;
  } | null;
  onCorrectionConfirmed?: (reason: string, action: 'edit' | 'delete' | 'cancel', newAmount?: number) => void;
  onConfirm?: (action: 'cancel' | 'edit' | 'delete', reason: string) => void;
}

export const SupervisorCorrectionModal: React.FC<SupervisorCorrectionModalProps> = ({
  isOpen,
  onClose,
  currentUser: currentUserProp,
  supervisorUser,
  targetItem,
  onCorrectionConfirmed,
  onConfirm,
}) => {
  const currentUser = currentUserProp || supervisorUser;
  const userName = currentUser?.name || currentUser?.login || 'Superviseur Caisse';
  const userId = currentUser?.id || 1;

  const [actionType, setActionType] = useState<'cancel' | 'edit' | 'delete'>('cancel');
  const [reason, setReason] = useState('');
  const [newAmount, setNewAmount] = useState<string>(targetItem ? String(targetItem.amount) : '0');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetItem) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Le motif d’intervention est obligatoirement requis pour garantir la traçabilité.');
      return;
    }

    logFinancialCorrection({
      supervisorId: userId,
      supervisorName: userName,
      targetType: targetItem.type,
      targetRef: targetItem.ref,
      action: actionType,
      reason: reason.trim(),
      oldAmount: targetItem.amount,
      newAmount: actionType === 'edit' ? Number(newAmount) : 0,
      details: targetItem.partnerName ? `Patient: ${targetItem.partnerName}` : undefined,
    });

    if (onConfirm) {
      onConfirm(actionType, reason.trim());
    }
    if (onCorrectionConfirmed) {
      onCorrectionConfirmed(reason.trim(), actionType, actionType === 'edit' ? Number(newAmount) : undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Privilège Superviseur de Caisse
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Correction / Annulation Financière
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Élément ciblé :</span>
              <span className="font-bold text-slate-900">{targetItem.type === 'invoice' ? 'Facture' : 'Encaissement'} {targetItem.ref}</span>
            </div>
            {targetItem.partnerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Bénéficiaire :</span>
                <span className="font-semibold text-slate-800">{targetItem.partnerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Montant d'origine :</span>
              <span className="font-bold text-slate-900">{formatFCFA(targetItem.amount)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Superviseur :</span>
              <span className="font-bold text-emerald-800">{userName}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Type d'opération Superviseur</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('cancel')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-center transition cursor-pointer ${
                  actionType === 'cancel'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Annulation
              </button>
              <button
                type="button"
                onClick={() => setActionType('edit')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-center transition cursor-pointer ${
                  actionType === 'edit'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Modification
              </button>
              <button
                type="button"
                onClick={() => setActionType('delete')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-center transition cursor-pointer ${
                  actionType === 'delete'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Suppression
              </button>
            </div>
          </div>

          {actionType === 'edit' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nouveau Montant Rectifié (FCFA)</label>
              <input
                type="number"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Motif d'Intervention Obligatoire <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Erreur de saisie de montant par le caissier, vérification du ticket physique, accord médecin-chef"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900"
              required
            />
            {error && <p className="text-[11px] text-rose-600 font-bold mt-1">{error}</p>}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold transition"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider &amp; Archiver Trace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FinancialAuditTrailViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<FinancialCorrectionLog[]>(() => loadFinancialCorrections());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-slate-800" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Traçabilité &amp; Contrôle Financier
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Journal des Corrections &amp; Annulations par les Superviseurs
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aucune correction financière enregistrée pour le moment.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
                      {log.targetRef}
                    </span>
                    <span className="font-bold text-slate-800">
                      {log.targetType === 'invoice' ? 'Facture' : 'Encaissement'}
                    </span>
                    <span className="text-[11px] text-slate-500">• {log.dateTime}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    log.action === 'delete'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : log.action === 'cancel'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {log.action === 'delete' ? 'Suppression' : log.action === 'cancel' ? 'Annulation' : 'Modification'}
                  </span>
                </div>

                <div className="text-slate-700 font-medium">
                  <strong>Motif renseigné :</strong> {log.reason}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Superviseur auteur : <strong className="text-slate-800">{log.supervisorName}</strong></span>
                  {log.oldAmount !== undefined && (
                    <span>
                      Montant d'origine : {formatFCFA(log.oldAmount)}
                      {log.newAmount !== undefined && log.newAmount !== log.oldAmount && (
                        <span> → Nouveau : <strong className="text-slate-900">{formatFCFA(log.newAmount)}</strong></span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Fermer le Journal
          </button>
        </div>
      </div>
    </div>
  );
};
