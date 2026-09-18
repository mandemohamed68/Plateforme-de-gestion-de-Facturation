import React from 'react';
import { ShieldCheck, Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';

export type SolvencyStatus = 'paid_cash' | 'insurance_validated' | 'pending_caisse' | 'unpaid_blocked';

interface SolvencyBadgeProps {
  status?: SolvencyStatus | string;
  amount?: number;
  insuranceRate?: number;
  compact?: boolean;
}

export const SolvencyBadge: React.FC<SolvencyBadgeProps> = ({
  status = 'paid_cash',
  amount,
  insuranceRate = 80,
  compact = false,
}) => {
  const normalized = (status || '').toLowerCase();

  if (normalized.includes('paid') || normalized.includes('paye') || normalized.includes('comptant') || normalized === 'posted') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
        <span>Payé Comptant</span>
      </span>
    );
  }

  if (normalized.includes('insurance') || normalized.includes('assurance') || normalized.includes('tiers') || normalized.includes('prise_en_charge')) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-sky-100 text-sky-900 border border-sky-300 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}>
        <ShieldCheck className="w-3 h-3 text-sky-700 shrink-0" />
        <span>Validé Assurance ({insuranceRate}%)</span>
      </span>
    );
  }

  if (normalized.includes('pending') || normalized.includes('attente') || normalized.includes('draft') || normalized.includes('caisse')) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}>
        <Clock className="w-3 h-3 text-amber-700 shrink-0" />
        <span>En Attente Caisse</span>
      </span>
    );
  }

  if (normalized.includes('unpaid') || normalized.includes('bloque') || normalized.includes('refuse') || normalized.includes('cancel')) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-rose-100 text-rose-900 border border-rose-300 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}>
        <AlertOctagon className="w-3 h-3 text-rose-700 shrink-0" />
        <span>Non Payé / Bloqué</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 ${
      compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
    }`}>
      <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
      <span>Payé / Autorisée</span>
    </span>
  );
};
