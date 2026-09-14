import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, Send, ShieldCheck, QrCode, ArrowRight, Printer, ExternalLink } from 'lucide-react';
import { AccountMove, CompanySettings, PaymentMethodItem } from '../types';
import { formatFCFA } from '../lib/formatters';

interface MobileMoneyAggregatorModalProps {
  move: AccountMove | null;
  company: CompanySettings;
  onClose: () => void;
  onConfirmPayment: (paymentData: {
    moveId: number;
    amount: number;
    paymentMethodId: string;
    transactionRef: string;
    note: string;
  }) => Promise<void> | void;
}

const AGGREGATOR_CHANNELS = [
  {
    id: 'wave',
    name: 'Wave Mobile Money',
    icon: '📱',
    badgeBg: 'bg-sky-500 text-white',
    code: 'WAVE-CI',
    feeRate: 0.01,
    placeholder: '+225 07XX XX XX XX',
    instruction: 'Paiement direct via application Wave ou QR Code scanné sans frais cachés.',
    qrCodeMock: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=wave://pay/lab-med-abidjan?amount=',
  },
  {
    id: 'orange_money',
    name: 'Orange Money Côte d\'Ivoire',
    icon: '🟧',
    badgeBg: 'bg-orange-500 text-white',
    code: '#144#4*1#',
    feeRate: 0.01,
    placeholder: '+225 07XX XX XX XX',
    instruction: 'Composez le #144# ou attendez la notification Push sur votre mobile Orange.',
    qrCodeMock: '',
  },
  {
    id: 'moov_money',
    name: 'Moov Money / MTN MoMo',
    icon: '🟦',
    badgeBg: 'bg-blue-600 text-white',
    code: '*133# / *155#',
    feeRate: 0.01,
    placeholder: '+225 05XX XX XX XX',
    instruction: 'Validez le retrait Push envoyé directement sur votre carte SIM Moov / MTN.',
    qrCodeMock: '',
  },
];

export const MobileMoneyAggregatorModal: React.FC<MobileMoneyAggregatorModalProps> = ({
  move,
  company,
  onClose,
  onConfirmPayment,
}) => {
  if (!move) return null;

  const [selectedChannel, setSelectedChannel] = useState(AGGREGATOR_CHANNELS[0]);
  const [phoneNumber, setPhoneNumber] = useState((move as any).partner_phone || (move as any).partner?.phone || '+225 07 08 09 10 11');
  const [amountToPay, setAmountToPay] = useState(move.amount_residual || 0);
  const [step, setStep] = useState<'INIT' | 'PUSHING' | 'WAITING_PIN' | 'SUCCESS' | 'FAILED'>('INIT');
  const [transactionRef, setTransactionRef] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feeAmount = Math.round(amountToPay * selectedChannel.feeRate);
  const totalDebited = amountToPay + feeAmount;
  const primaryColor = company.primary_color || '#0f172a';

  const handleStartPushWorkflow = () => {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      alert('Veuillez saisir un numéro de téléphone mobile valide.');
      return;
    }

    const generatedTxn = `TXN-${selectedChannel.id.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    setTransactionRef(generatedTxn);
    setStep('PUSHING');
    setStatusMessage('Connexion à la passerelle de l\'agrégateur...');

    // Simulation de l'appel d'API de l'agrégateur et du Push USSD
    setTimeout(() => {
      setStep('WAITING_PIN');
      setStatusMessage('Requête Push envoyée sur le mobile. Le client saisit son code PIN secret...');
    }, 2000);
  };

  const handleSimulatePinValidation = async () => {
    setIsSubmitting(true);
    setStatusMessage('Validation du PIN et confirmation de la transaction par l\'agrégateur...');

    setTimeout(async () => {
      setStep('SUCCESS');
      setStatusMessage('Paiement approuvé avec succès par l\'opérateur !');

      try {
        await onConfirmPayment({
          moveId: move.id,
          amount: amountToPay,
          paymentMethodId: selectedChannel.id,
          transactionRef,
          note: `Paiement Mobile Money via Agrégateur (${selectedChannel.name}) - Réf : ${transactionRef} - Tél : ${phoneNumber}`,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }, 2200);
  };

  const handleCopyWhatsappLink = () => {
    const text = `*FACTURE N° ${move.name} - ${company.name}*\n` +
      `Montant dû : ${formatFCFA(amountToPay)}\n` +
      `Lien de paiement Mobile Money (${selectedChannel.name}) : https://pay.labmed.ci/checkout/${move.id}?ref=${transactionRef}\n` +
      `Merci d'effectuer le règlement pour la délivrance des résultats.`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 my-auto">
        {/* Header Modal */}
        <div
          style={{ backgroundColor: primaryColor }}
          className="p-4 text-white flex items-center justify-between border-b border-white/10"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/10 rounded-md border border-white/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">
                Passerelle Mobile Money (Agrégateur)
              </h2>
              <p className="text-[11px] text-slate-200">
                Paiement direct Wave, Orange Money, Moov, MTN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-4">
          {/* Invoice Summary Box */}
          <div className="bg-slate-50 rounded-md p-3.5 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Facture Patient / Titulaire
              </div>
              <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                {move.name || `Facture #${move.id}`}
              </div>
              <div className="text-slate-600 font-medium">{(move as any).partner_name || (move as any).partner?.name || 'Patient Anonyme'}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Reste à Réglera
              </div>
              <div className="font-black text-slate-900 text-base text-emerald-600 font-mono">
                {formatFCFA(amountToPay)}
              </div>
            </div>
          </div>

          {/* STEP 1: INIT / CHOICE */}
          {step === 'INIT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Sélectionner l'Opérateur / Canal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AGGREGATOR_CHANNELS.map((channel) => {
                    const isSelected = selectedChannel.id === channel.id;
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => setSelectedChannel(channel)}
                        className={`p-2.5 rounded-md border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <span className="text-xl">{channel.icon}</span>
                        <span className="text-[11px] leading-tight line-clamp-1">{channel.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Numéro de Téléphone Mobile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={selectedChannel.placeholder}
                    className="w-full pl-3 pr-20 py-2 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-bold"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {selectedChannel.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  {selectedChannel.instruction}
                </p>
              </div>

              {/* Wave QR Code Preview if Wave is selected */}
              {selectedChannel.id === 'wave' && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-center flex flex-col items-center justify-center space-y-2">
                  <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                    Scannez le QR Code Wave ci-dessous
                  </div>
                  <img
                    src={`${selectedChannel.qrCodeMock}${amountToPay}`}
                    alt="Wave QR Code"
                    className="w-28 h-28 border border-sky-300 rounded-md bg-white p-1 shadow-xs"
                  />
                  <p className="text-[10px] text-sky-700 font-medium">
                    Compte Marchand Wave : <span className="font-bold">WAVE-CI-98124</span>
                  </p>
                </div>
              )}

              {/* Fee breakdown */}
              <div className="p-3 bg-slate-100 rounded-md text-xs space-y-1 text-slate-700 border border-slate-200">
                <div className="flex justify-between">
                  <span>Montant de la Facture :</span>
                  <span className="font-bold font-mono">{formatFCFA(amountToPay)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Frais Agrégateur (1%) :</span>
                  <span className="font-mono">{formatFCFA(feeAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-slate-900">
                  <span>Total Débité sur le Mobile :</span>
                  <span className="font-mono text-emerald-700">{formatFCFA(totalDebited)}</span>
                </div>
              </div>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={handleStartPushWorkflow}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-2.5 text-white font-bold text-xs rounded-md shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center space-x-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Lancer le Demande de Paiement Push ({selectedChannel.name})</span>
              </button>
            </div>
          )}

          {/* STEP 2: PUSHING / WAITING PIN */}
          {(step === 'PUSHING' || step === 'WAITING_PIN') && (
            <div className="py-6 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-slate-100 border border-slate-200 relative">
                <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  {step === 'PUSHING' ? 'Envoi de la Requête Push...' : 'Attente de Saisie du Code Secret'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  {statusMessage}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs text-slate-700 font-mono inline-block">
                Référence Transaction : <span className="font-bold">{transactionRef}</span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSimulatePinValidation}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[Simuler Validation Client sur le Mobile]</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('INIT')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Annuler &amp; Revenir en arrière
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="py-4 text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-black text-base text-slate-900 tracking-tight">
                  Paiement Mobile Money Confirmé !
                </h3>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  La facture #{move.name} a été créditée automatiquement de {formatFCFA(amountToPay)}.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs text-left space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opérateur :</span>
                  <span className="font-bold text-slate-900">{selectedChannel.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Réf. Transaction :</span>
                  <span className="font-bold text-slate-900">{transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">N° Mobile :</span>
                  <span className="font-bold text-slate-900">{phoneNumber}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Montant Encaissé :</span>
                  <span className="text-emerald-700">{formatFCFA(amountToPay)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsappLink}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 border border-slate-700"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Reçu Copié !' : 'Copier Reçu WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-1 py-2 px-3 text-white text-xs font-bold rounded-md shadow-xs hover:opacity-95 transition-opacity"
                >
                  Terminer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
