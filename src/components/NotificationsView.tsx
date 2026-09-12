import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Clock, AlertTriangle, FileText, Eye, Building2, ShieldCheck, X } from 'lucide-react';
import { EmailNotification, AccountMove, CompanySettings } from '../types';
import { formatFCFA } from '../lib/formatters';

interface NotificationsViewProps {
  notifications?: EmailNotification[];
  overdueMoves?: AccountMove[];
  onSendReminder: (moveId: number) => Promise<void> | void;
  company?: CompanySettings;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications = [],
  overdueMoves = [],
  onSendReminder,
  company,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<EmailNotification | null>(null);
  const primaryColor = company?.primary_color || '#0f172a';

  return (
    <div className="space-y-5 pb-12 max-w-full">
      {/* Clean Professional Header Card */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="text-white rounded-md p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center space-x-2">
          <span className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
            Service des Relances &amp; Notifications
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center space-x-2">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{overdueMoves.length} Facture(s) à Relancer</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Système d'envoi automatique de rappels de paiement et récapitulatifs pour les dossiers en souffrance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {overdueMoves.map((m) => (
              <button
                key={m.id}
                onClick={() => onSendReminder(m.id)}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5 text-slate-700" />
                <span>Relancer {m.name} ({formatFCFA(m.amount_residual)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Log Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden space-y-2">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-slate-900" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Journal d'Envoi des Notifications Email
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {notifications.length} message(s) enregistré(s)
          </span>
        </div>

        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-[18%] hidden sm:table-cell">Date &amp; Heure</th>
                <th className="py-2.5 px-3 w-[26%]">Destinataire</th>
                <th className="py-2.5 px-3 w-[26%] hidden md:table-cell">Sujet de l'Email</th>
                <th className="py-2.5 px-3 w-[16%]">Type</th>
                <th className="py-2.5 px-2 text-right w-[14%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {[...notifications].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime() || b.id - a.id).map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px] truncate hidden sm:table-cell">
                    {new Date(n.sent_at).toLocaleString('fr-FR')}
                  </td>

                  <td className="py-2.5 px-3 truncate">
                    <div className="font-bold text-slate-900 truncate" title={n.partner_name || 'Patient / Client'}>{n.partner_name || 'Patient / Client'}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{n.recipient_email}</div>
                  </td>

                  <td className="py-2.5 px-3 font-semibold text-slate-800 hidden md:table-cell truncate" title={n.subject}>
                    {n.subject}
                  </td>

                  <td className="py-2.5 px-3 truncate">
                    {n.type === 'reminder_overdue' && (
                      <span className="inline-block bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded truncate max-w-full">
                        Relance
                      </span>
                    )}
                    {n.type === 'payment_receipt' && (
                      <span className="inline-block bg-emerald-50 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded truncate max-w-full">
                        Reçu
                      </span>
                    )}
                    {n.type === 'invoice_send' && (
                      <span className="inline-block bg-slate-100 text-slate-900 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded truncate max-w-full">
                        Facture
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => setSelectedNotif(n)}
                      className="px-2 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-bold transition inline-flex items-center gap-1"
                      title="Voir le contenu de l'email"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Voir</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMAIL PREVIEW MODAL */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Aperçu du Message Transmis
              </span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Body Template Simulated View */}
            <div className="p-5 bg-slate-50 space-y-4">
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-2xs space-y-4 text-xs text-slate-800">
                {/* Header */}
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      L
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">LABORATOIRE D'ANALYSES MÉDICALES</div>
                      <div className="text-[10px] text-slate-500">contact@laboratoire-biologie.ci</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(selectedNotif.sent_at).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* To & Subject */}
                <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-500">À :</span>{' '}
                    <span className="font-semibold text-slate-900">{selectedNotif.recipient_email}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Objet :</span>{' '}
                    <span className="font-bold text-slate-900">{selectedNotif.subject}</span>
                  </div>
                </div>

                {/* Message text */}
                <div className="space-y-2.5 leading-relaxed text-slate-700">
                  <p>Bonjour <strong className="text-slate-900">{selectedNotif.partner_name}</strong>,</p>
                  <p>
                    Sauf erreur ou omission de notre part, le règlement concernant le dossier de facturation{' '}
                    <strong className="text-slate-900 font-mono">{selectedNotif.move_name}</strong> d'un montant de{' '}
                    <strong className="text-slate-900 font-mono">{formatFCFA(selectedNotif.amount || 0)}</strong> n'a pas encore été enregistré.
                  </p>
                  <p>
                    Nous vous prions de bien vouloir régulariser cette situation à la caisse du laboratoire ou par virement / Mobile Money.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 text-center">
                  Ceci est un message automatique officiel généré par le système de gestion du laboratoire.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
