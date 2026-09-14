import React, { useRef, useState } from 'react';
import { X, Printer, Send, CreditCard, ShieldCheck, Microscope, FileText, Check } from 'lucide-react';
import { AccountMove, CompanySettings } from '../types';
import { formatFCFA } from '../lib/formatters';
import { printElement } from '../lib/printUtils';
import { Barcode } from './Barcode';

interface InvoicePdfModalProps {
  move: AccountMove | null;
  company: CompanySettings;
  onClose: () => void;
  onSendEmail: (moveId: number) => void;
  onOpenPaymentModal?: (move: AccountMove) => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  move,
  company,
  onClose,
  onSendEmail,
  onOpenPaymentModal,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const handlePrint = async () => {
    if (contentRef.current) {
      setIsPrinting(true);
      try {
        await printElement(contentRef.current, move?.name || 'Facture');
      } finally {
        setIsPrinting(false);
      }
    }
  };

  if (!move) return null;

  const isCustomerInvoice = move.move_type.startsWith('out');

  const isPaid = move.payment_state === 'paid';
  const isDraft = move.state === 'draft';
  const isRefund = move.move_type === 'out_refund';

  const documentTitle = isPaid
    ? (company.invoice_title_paid || "REÇU DE CAISSE ET RÈGLEMENT")
    : isRefund
    ? "AVOIR ET REMBOURSEMENT CLIENT"
    : isDraft
    ? (company.invoice_title_draft || "FACTURE BROUILLON / DEVIS D'EXAMENS")
    : (company.invoice_title_posted || "FACTURE D'ACTES ET ANALYSES MÉDICALES");

  const documentNumberLabel = isPaid
    ? "N° de reçu :"
    : isRefund
    ? "N° d'avoir :"
    : isDraft
    ? "N° de brouillon :"
    : "N° de facture :";

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header toolbar - Fixed at the top */}
        <div className="shrink-0 bg-white text-slate-900 px-4 py-3 flex items-center justify-between no-print z-10 border-b border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 truncate pr-2">
            <div className="p-1.5 bg-slate-50 rounded-md border border-slate-200 text-slate-500 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-900 truncate">
                  {documentTitle} ({move.name || `#${move.id}`})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider shrink-0">
                  Document Officiel
                </span>
              </div>
            </div>
            {move.insurance_enabled && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                <ShieldCheck className="w-3 h-3 text-slate-400 mr-1" />
                Assurance {move.insurance_coverage_rate || 0}%
              </span>
            )}
            {move.is_tax_exempt && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 shrink-0">
                Exonéré TVA (0%)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {move.amount_residual > 0 && onOpenPaymentModal && (
              <button
                onClick={() => onOpenPaymentModal(move)}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-md transition-colors font-bold border border-slate-300"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enregistrer Règlement</span>
                <span className="sm:hidden">Règlement</span>
              </button>
            )}
            <button
              onClick={() => handlePrint()}
              disabled={isPrinting}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs px-3.5 py-1.5 rounded-md transition-colors font-bold border border-slate-900 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>{isPrinting ? 'Préparation...' : 'Imprimer'}</span>
            </button>
            <button
              onClick={() => onSendEmail(move.id)}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-md transition-colors font-bold border border-slate-300 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable PDF Canvas Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 text-black font-sans print:overflow-visible print:p-0 relative printable-content">
          
          {/* Main Receipt Container matching Image 2 */}
          <div ref={contentRef} className="max-w-3xl mx-auto bg-white border border-black p-6 space-y-4 print:border-black print:p-6 shadow-md print:shadow-none">
            
            {/* 1. Header Block with Left, Center (QR), and Right (CHU Logo) */}
            <div className="flex justify-between items-start gap-4">
              {/* Left Side: Hospital Info & Barcode */}
              <div className="space-y-1 text-slate-800 flex-1">
                <h1 className="text-xs font-black tracking-tight uppercase leading-snug">
                  {company.name || 'Centre Hospitalier Universitaire de Tingandogo'}
                </h1>
                <div className="text-[9px] text-slate-600 space-y-0.5 leading-none font-medium">
                  {company.phone ? (
                    <p>{company.phone}</p>
                  ) : (
                    <p>Accueil : +226 25 49 49 00 -- Urgences : +226 25 50 96 64</p>
                  )}
                  {company.email && <p>Email : {company.email}</p>}
                  {company.address && (
                    <p>Adresse : {company.address} {company.city ? `, ${company.city}` : ''}</p>
                  )}
                </div>
                
                {/* Custom Vector Scanner-Readable Barcode */}
                <div className="pt-1 flex flex-col items-start bg-white p-1 rounded border border-slate-200">
                  <Barcode
                    value={move.partner?.ndm || move.ndm || '00270408'}
                    width={1.2}
                    height={26}
                    displayValue={true}
                    className="h-10 w-44"
                  />
                </div>
              </div>

              {/* Center: Real Sharp QR Code */}
              <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-400 rounded shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `DOSSIER:${move.partner?.ndm || move.ndm || '00270408'}|FACTURE:${move.name || move.id}|DATE:${move.invoice_date || move.date}`
                  )}`}
                  alt="QR Dossier"
                  className="w-14 h-14 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[7px] font-mono font-bold text-slate-800 mt-0.5 tracking-tighter">
                  SCAN ID
                </span>
              </div>

              {/* Right Side: Dynamic Logo Supporting Company settings */}
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center space-x-2">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt="Logo Clinique"
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="relative flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-800" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="4" />
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                        <path d="M50 20v40M38 45c0 8 12 15 12 15s12-7 12-15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="50" cy="22" r="5" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-xl font-black tracking-tighter text-slate-800">
                      {company.slogan ? company.name.split(' ')[0] : 'CHU-T'}
                    </span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-200 mt-0.5 pt-0.5">
                      {company.slogan || "L'hôpital autrement!"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prominent Document Type Title Banner matching requested position in image.png */}
            <div className="my-2 px-3 py-1.5 bg-slate-900 text-white rounded flex items-center justify-between shadow-xs border border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {documentTitle}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isPaid ? 'bg-emerald-600 text-white' : isDraft ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-100'
                }`}>
                  {isPaid ? 'PAYÉ & ENCAISSÉ' : isDraft ? 'BROUILLON' : 'À ENCAISSER'}
                </span>
                <span className="text-xs font-mono font-extrabold text-slate-100">
                  {move.name || `FAC-${move.id}`}
                </span>
              </div>
            </div>

            {/* Dotted Divider */}
            <div className="border-t border-dashed border-slate-400 my-1" />

            {/* 2. Metadata Grid matching Image 2 */}
            {(() => {
              const formatDateWithSeconds = (dateStr: string | null) => {
                if (!dateStr) return '';
                try {
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime())) return dateStr;
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  const hours = String(d.getHours()).padStart(2, '0');
                  const mins = String(d.getMinutes()).padStart(2, '0');
                  const secs = String(d.getSeconds()).padStart(2, '0');
                  return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
                } catch {
                  return dateStr;
                }
              };

              const getFormattedAge = () => {
                if (move.patient_age_y || move.patient_age_m || move.patient_age_d) {
                  const parts = [];
                  if (move.patient_age_y) parts.push(`${move.patient_age_y} ans`);
                  if (move.patient_age_m) parts.push(`${move.patient_age_m} mois`);
                  if (move.patient_age_d) parts.push(`${move.patient_age_d} jours`);
                  return parts.join(', ');
                }
                if (move.partner?.birth_date) {
                  const birth = new Date(move.partner.birth_date);
                  const today = new Date();
                  let ageY = today.getFullYear() - birth.getFullYear();
                  let ageM = today.getMonth() - birth.getMonth();
                  let ageD = today.getDate() - birth.getDate();
                  if (ageD < 0) {
                    ageM--;
                    ageD += 30; // approx
                  }
                  if (ageM < 0) {
                    ageY--;
                    ageM += 12;
                  }
                  const parts = [];
                  if (ageY > 0) parts.push(`${ageY} ans`);
                  if (ageM > 0) parts.push(`${ageM} mois`);
                  if (ageD > 0) parts.push(`${ageD} jours`);
                  return parts.join(', ') || '38 ans, 8 mois, 9 jours';
                }
                return '38 ans, 8 mois, 9 jours';
              };

              return (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] text-black font-semibold">
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">N° Dossier :</span>
                    <span className="font-mono font-black text-slate-900">{move.partner?.ndm || move.ndm || '00270408'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">Date :</span>
                    <span className="font-mono text-slate-900">{formatDateWithSeconds(move.invoice_date || move.date)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">Nom et prénom :</span>
                    <span className="font-black text-slate-900 text-xs">{move.patient_name || move.partner?.name || 'DIALLO BINTA'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">{documentNumberLabel}</span>
                    <span className="font-mono font-black text-slate-900 text-xs">{move.name || `FAC-${move.id}`}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">Sexe :</span>
                    <span className="font-bold text-slate-900">{move.partner?.gender || 'F'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">Age :</span>
                    <span className="font-bold text-slate-900">{getFormattedAge()}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">Service :</span>
                    <span className="font-bold text-slate-900">{move.medical_service || 'LABORATOIRE'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase">Statut du patient :</span>
                    <span className="font-bold text-slate-900">{move.partner?.patient_class || 'MUFAN20'}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-0.5 col-span-1">
                    <span className="text-slate-500 font-bold uppercase">Medecin :</span>
                    <span className="font-bold text-slate-900">{move.partner?.prescribing_doctor || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5 col-span-1">
                    <span className="text-slate-500 font-bold uppercase">Salle :</span>
                    <span className="font-bold text-slate-900">{move.partner?.commune || 'LABO'}</span>
                  </div>
                </div>
              );
            })()}

            {/* 3. Lines Table matching Image 2 */}
            <div className="pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-t border-b border-black text-slate-800 font-black uppercase text-[10px] tracking-wide">
                    <th className="py-1.5 px-1">Désignation</th>
                    <th className="py-1.5 px-1 text-right w-28">Tarif plein</th>
                    <th className="py-1.5 px-1 text-right w-24">Réduction</th>
                    <th className="py-1.5 px-1 text-right w-28">MT à payer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-900 text-xs">
                  {move.lines && move.lines.length > 0 ? (
                    move.lines.map((line, idx) => {
                      const pu = Number(line.price_unit) || 0;
                      const qty = Number(line.quantity) || 1;
                      const disc = Number(line.discount) || 0;
                      const linePriceTotal = pu * qty;
                      const lineDiscountTotal = linePriceTotal * (disc / 100);
                      const lineNetTotal = Math.max(0, linePriceTotal - lineDiscountTotal);

                      return (
                        <tr key={idx} className="align-middle">
                          <td className="py-2 px-1 font-bold text-slate-900">
                            {line.name || line.product_name || 'Prestation'}
                          </td>
                          <td className="py-2 px-1 text-right font-mono font-bold text-slate-800">
                            {Math.round(linePriceTotal).toLocaleString('fr-FR').replace(/\u00a0/g, ' ')}
                          </td>
                          <td className="py-2 px-1 text-right font-mono text-slate-600 font-semibold">
                            {lineDiscountTotal > 0 
                              ? Math.round(lineDiscountTotal).toLocaleString('fr-FR').replace(/\u00a0/g, ' ') 
                              : '0'}
                          </td>
                          <td className="py-2 px-1 text-right font-mono font-black text-slate-900">
                            {Math.round(lineNetTotal).toLocaleString('fr-FR').replace(/\u00a0/g, ' ')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        Aucune prestation enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. Horizontal Summary Metrics Row with Thin Borders matching Image 2 */}
            {(() => {
              const linesList = move.lines || [];
              const totalTarifPlein = linesList.reduce((sum, line) => {
                const pu = Number(line.price_unit) || 0;
                const qty = Number(line.quantity) || 1;
                return sum + (pu * qty);
              }, 0) || Number(move.amount_untaxed) || Number(move.amount_total) || 0;

              const totalReduction = linesList.reduce((sum, line) => {
                const pu = Number(line.price_unit) || 0;
                const qty = Number(line.quantity) || 1;
                const disc = Number(line.discount) || 0;
                return sum + (pu * qty * (disc / 100));
              }, 0);

              const totalMtAPayer = Math.max(0, totalTarifPlein - totalReduction);
              const moveResidual = Number(move.amount_residual !== undefined && move.amount_residual !== null ? move.amount_residual : 0);

              let totalPaye = 0;
              if (move.payment_state === 'paid') {
                totalPaye = totalMtAPayer;
              } else if (Array.isArray(move.payments) && move.payments.length > 0) {
                totalPaye = move.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
              } else {
                totalPaye = Math.max(0, totalMtAPayer - moveResidual);
              }

              const totalRestant = move.payment_state === 'paid' ? 0 : (moveResidual > 0 ? moveResidual : Math.max(0, totalMtAPayer - totalPaye));

              const formatVal = (val: any) => {
                const num = Number(val);
                if (isNaN(num) || !isFinite(num)) return '0';
                return Math.round(num).toLocaleString('fr-FR').replace(/\u00a0/g, ' ');
              };

              return (
                <div className="space-y-2">
                  <div className="border-t border-b border-black py-2.5 px-2 bg-slate-50/50 flex flex-wrap justify-between items-center text-xs font-black text-slate-900 tracking-wide font-mono leading-none gap-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">Total :</span>
                      <span className="text-slate-900">{formatVal(totalTarifPlein)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">Réduction :</span>
                      <span className="text-slate-900">{formatVal(totalReduction)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">MT à payer :</span>
                      <span className="text-slate-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{formatVal(totalMtAPayer)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">Payé :</span>
                      <span className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">{formatVal(totalPaye)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">Restant :</span>
                      <span className={`px-1 py-0.5 rounded border ${totalRestant > 0 ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-slate-700 bg-slate-100 border-slate-300'}`}>{formatVal(totalRestant)}</span>
                    </div>
                  </div>

                  {move.insurance_enabled && (
                    <div className="text-[10px] font-mono font-bold bg-blue-50/70 border border-blue-200 text-blue-950 px-2.5 py-1 rounded flex flex-wrap justify-between items-center gap-2">
                      <span>🛡️ Prise en charge : <strong className="text-blue-900">{move.insurance_name || 'Assurance'}</strong> ({move.insurance_coverage_rate || 80}%)</span>
                      <span>Part Assurance : <strong className="text-blue-900">{formatVal(move.insurance_amount || (totalMtAPayer * (move.insurance_coverage_rate || 80) / 100))} FCFA</strong></span>
                      <span>Ticket modérateur (Part Patient) : <strong className="text-blue-900">{formatVal(move.client_share_amount || (totalMtAPayer - (move.insurance_amount || (totalMtAPayer * (move.insurance_coverage_rate || 80) / 100))))} FCFA</strong></span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. Footer Metadata Row matching Image 2 */}
            <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold border-b border-slate-100 pb-2">
              <div>
                <span>A la date du : </span>
                <span className="text-slate-900 font-mono">
                  {(() => {
                    const d = new Date(move.invoice_date || move.date);
                    if (isNaN(d.getTime())) return move.invoice_date || move.date;
                    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR');
                  })()}
                </span>
              </div>
              <div>
                <span>Caissier : </span>
                <span className="text-slate-900 uppercase">{move.invoice_user?.name || 'Administrator'}</span>
              </div>
              <div>
                <span>Imprimé le : </span>
                <span className="text-slate-900 font-mono">
                  {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>

            {/* 6. Solid Clinical Double-Line Warning Box matching Image 2 */}
            <div className="border-[3px] border-black p-3.5 text-center space-y-1 bg-slate-50">
              <p className="text-xs font-black text-slate-950 uppercase tracking-wide">
                Valable pour 15 jours pour la même consultation.
              </p>
              <p className="text-[11px] font-extrabold text-slate-900 uppercase tracking-normal">
                Excepté la consultation d'urgence
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

