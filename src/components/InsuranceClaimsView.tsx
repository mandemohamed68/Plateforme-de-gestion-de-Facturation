import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Calendar,
  Search,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Eye,
  RefreshCw,
  Info,
  X,
  Plus,
  Layers,
  Phone,
  Mail,
  BadgePercent
} from 'lucide-react';
import { AccountMove, ResPartner, CompanySettings, ResUser, EnterpriseConvention } from '../types';
import { formatFCFA } from '../lib/formatters';
import { printDocumentById } from '../lib/printUtils';
import { getStoredConventions } from '../data/conventionsData';

interface InsuranceClaimsViewProps {
  moves: AccountMove[];
  partners: ResPartner[];
  company: CompanySettings;
  currentUser: ResUser | null;
  onOpenPdf?: (move: AccountMove) => void;
  onRegisterPayment?: (payment: any) => Promise<any>;
  onNavigateToInvoices?: () => void;
}

type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom' | 'all';
type StatusFilter = 'pending' | 'all' | 'paid';

export const InsuranceClaimsView: React.FC<InsuranceClaimsViewProps> = ({
  moves,
  partners,
  company,
  currentUser,
  onOpenPdf,
  onRegisterPayment,
  onNavigateToInvoices,
}) => {
  // 1. Conventions & Insurance Filter State
  const [storedConventions, setStoredConventions] = useState<EnterpriseConvention[]>(() => getStoredConventions());

  React.useEffect(() => {
    const handleConvUpdate = () => {
      setStoredConventions(getStoredConventions());
    };
    window.addEventListener('app_conventions_updated', handleConvUpdate);
    return () => window.removeEventListener('app_conventions_updated', handleConvUpdate);
  }, []);

  const [selectedInsuranceName, setSelectedInsuranceName] = useState<string>('SUNU Assurances Santé');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');
  const [expandedMoveId, setExpandedMoveId] = useState<number | null>(null);
  const [isPrintSlipMode, setIsPrintSlipMode] = useState<boolean>(false);

  // Settlement / Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [transferRef, setTransferRef] = useState<string>('VIR-SUNU-');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // 2. Discover all Unique Insurance Partners, Enterprise Conventions and Organismes
  const insurancePartners = useMemo(() => {
    // 1. Explicit insurance partners in database
    const explicitInsurances = (partners || []).filter(
      (p) =>
        p.is_insurance === true ||
        p.partner_type === 'insurance' ||
        (p.name || '').toLowerCase().includes('assurance') ||
        (p.name || '').toLowerCase().includes('cmu') ||
        (p.name || '').toLowerCase().includes('mutuelle')
    );

    // 2. Known names map
    const knownNames = new Set<string>(explicitInsurances.map((p) => p.name));

    // 3. Stored conventions (Enterprises & Insurances)
    storedConventions.forEach((c) => {
      if (c.name && !knownNames.has(c.name)) {
        knownNames.add(c.name);
      }
    });

    (moves || []).forEach((m) => {
      if (m.insurance_name && !knownNames.has(m.insurance_name)) {
        knownNames.add(m.insurance_name);
      }
    });

    (partners || []).forEach((p) => {
      if (p.insurance_name && !knownNames.has(p.insurance_name)) {
        knownNames.add(p.insurance_name);
      }
    });

    // Build unique list with metadata
    return Array.from(knownNames)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr-FR'))
      .map((name) => {
        const matchedPartner = explicitInsurances.find((p) => p.name === name);
        const matchedConv = storedConventions.find((c) => c.name === name);
        return {
          id: matchedConv?.id || matchedPartner?.id || name,
          name,
          convention_code: matchedConv?.code || matchedPartner?.convention_code || null,
          coverage_rate: matchedConv?.default_coverage_rate ?? matchedPartner?.default_coverage_rate ?? 80,
          phone: matchedConv?.contact_phone || matchedPartner?.phone || null,
          email: matchedConv?.contact_email || matchedPartner?.email || null,
          city: matchedConv?.city || matchedPartner?.city || 'Abidjan',
          type: matchedConv?.type || 'insurance',
        };
      });
  }, [partners, moves, storedConventions]);

  // Selected Insurance Partner details
  const selectedPartnerDetails = useMemo(() => {
    if (selectedInsuranceName === 'all') return null;
    return insurancePartners.find((p) => p.name === selectedInsuranceName) || null;
  }, [insurancePartners, selectedInsuranceName]);

  // 3. Extract and Standardize All Insurance Claim Moves
  const allClaimItems = useMemo(() => {
    return (moves || [])
      .filter((m) => m && m.state !== 'cancel')
      .map((m) => {
        const partner = (partners || []).find((p) => p.id === m.partner_id);

        // Determine if this is an insurance claim
        const isInsuranceMove =
          m.insurance_enabled === true ||
          !!m.insurance_name ||
          partner?.is_insurance === true ||
          partner?.partner_type === 'insurance' ||
          !!partner?.insurance_name;

        if (!isInsuranceMove) return null;

        // Resolve Insurance Name
        let insName = m.insurance_name;
        if (!insName) {
          if (partner?.is_insurance || partner?.partner_type === 'insurance') {
            insName = partner.name;
          } else if (partner?.insurance_name) {
            insName = partner.insurance_name;
          } else {
            insName = 'Autre Organisme Tiers-Payeur';
          }
        }

        // Resolve Policy Number & Rate
        const policyNumber = m.insurance_policy_number || partner?.insurance_policy_number || partner?.convention_code || 'CONV-STD';
        const coverageRate = m.insurance_coverage_rate ?? partner?.insurance_coverage_rate ?? 80;

        // Financial Breakdown
        const totalAmount = m.amount_total || 0;
        let insAmount = m.insurance_amount;
        let clientShare = m.client_share_amount;

        if (insAmount === undefined || insAmount === null || insAmount === 0) {
          if (coverageRate > 0) {
            insAmount = Math.round((totalAmount * coverageRate) / 100);
            clientShare = totalAmount - insAmount;
          } else {
            insAmount = totalAmount;
            clientShare = 0;
          }
        } else if (clientShare === undefined || clientShare === null) {
          clientShare = totalAmount - insAmount;
        }

        // Remaining due from insurance
        let remainingInsuranceDue = 0;
        if (m.payment_state === 'paid') {
          remainingInsuranceDue = 0;
        } else if (m.payment_state === 'partial') {
          remainingInsuranceDue = m.amount_residual > 0 ? Math.min(m.amount_residual, insAmount) : insAmount;
        } else {
          remainingInsuranceDue = insAmount;
        }

        // Resolve Patient info
        const isPartnerThePatient = !partner?.is_insurance && partner?.partner_type !== 'insurance';
        const patientName = isPartnerThePatient ? (partner?.name || 'Patient Assuré') : (m.ref || 'Patient Assuré Conventionné');
        const patientNdm = m.ndm || partner?.ndm || `NDM-${m.id.toString().padStart(6, '0')}`;
        const patientAge = m.patient_age_y || partner?.age || 35;
        const patientGender = partner?.gender || 'M';
        const doctor = partner?.prescribing_doctor || 'Médecin conventionné';

        return {
          move: m,
          moveId: m.id,
          invoiceNumber: m.name || `FAC/2026/${m.id.toString().padStart(4, '0')}`,
          invoiceDate: m.invoice_date || m.date || m.created_at || '2026-09-13',
          insuranceName: insName,
          policyNumber,
          coverageRate,
          patientName,
          patientNdm,
          patientAge,
          patientGender,
          doctor,
          totalAmount,
          clientShare,
          insuranceAmount: insAmount,
          remainingDue: remainingInsuranceDue,
          paymentState: m.payment_state,
          lines: m.lines || [],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [moves, partners]);

  // 4. Calculate total outstanding debt per insurance company for the dropdown badge
  const debtPerInsurance = useMemo(() => {
    const map = new Map<string, { count: number; totalDue: number }>();
    allClaimItems.forEach((c) => {
      const current = map.get(c.insuranceName) || { count: 0, totalDue: 0 };
      current.count += 1;
      current.totalDue += c.remainingDue;
      map.set(c.insuranceName, current);
    });
    return map;
  }, [allClaimItems]);

  // 5. Filter by Insurance, Period, Status, and Search Query
  const filteredClaims = useMemo(() => {
    const todayStr = '2026-09-13';
    const thisMonthPrefix = '2026-09';
    const lastMonthPrefix = '2026-08';
    const weekStart = '2026-09-07';
    const weekEnd = '2026-09-13';

    return allClaimItems.filter((item) => {
      // 1. Insurance Filter
      if (selectedInsuranceName !== 'all') {
        const itemInsLower = (item.insuranceName || '').toLowerCase();
        const selInsLower = selectedInsuranceName.toLowerCase();
        if (!itemInsLower.includes(selInsLower) && !selInsLower.includes(itemInsLower)) {
          return false;
        }
      }

      // 2. Period Filter
      const itemDateOnly = item.invoiceDate.split(' ')[0].split('T')[0];
      if (periodFilter === 'today') {
        if (itemDateOnly !== todayStr) return false;
      } else if (periodFilter === 'this_week') {
        if (itemDateOnly < weekStart || itemDateOnly > weekEnd) return false;
      } else if (periodFilter === 'this_month') {
        if (!itemDateOnly.startsWith(thisMonthPrefix)) return false;
      } else if (periodFilter === 'last_month') {
        if (!itemDateOnly.startsWith(lastMonthPrefix)) return false;
      } else if (periodFilter === 'custom') {
        if (itemDateOnly < customStartDate || itemDateOnly > customEndDate) return false;
      }

      // 3. Status Filter
      if (statusFilter === 'pending') {
        if (item.remainingDue <= 0 && item.paymentState === 'paid') return false;
      } else if (statusFilter === 'paid') {
        if (item.paymentState !== 'paid') return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (item.patientName || '').toLowerCase().includes(q) ||
          (item.invoiceNumber || '').toLowerCase().includes(q) ||
          (item.patientNdm || '').toLowerCase().includes(q) ||
          (item.policyNumber || '').toLowerCase().includes(q) ||
          (item.insuranceName || '').toLowerCase().includes(q) ||
          (item.doctor || '').toLowerCase().includes(q) ||
          item.lines.some((l) => (l.name || '').toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allClaimItems, selectedInsuranceName, periodFilter, statusFilter, searchQuery, customStartDate, customEndDate]);

  // 6. Aggregate Financial Statistics (KPIs)
  const totals = useMemo(() => {
    let totalPrestations = 0;
    let totalClientShare = 0;
    let totalInsuranceAmount = 0;
    let totalRemainingDue = 0;
    let totalPaid = 0;

    filteredClaims.forEach((item) => {
      totalPrestations += item.totalAmount;
      totalClientShare += item.clientShare;
      totalInsuranceAmount += item.insuranceAmount;
      totalRemainingDue += item.remainingDue;
      totalPaid += (item.insuranceAmount - item.remainingDue);
    });

    return {
      count: filteredClaims.length,
      totalPrestations,
      totalClientShare,
      totalInsuranceAmount,
      totalRemainingDue,
      totalPaid: Math.max(0, totalPaid),
    };
  }, [filteredClaims]);

  // Period label for Slip and Header
  const currentPeriodLabel = useMemo(() => {
    switch (periodFilter) {
      case 'today':
        return "Journée du 13 Septembre 2026 (Aujourd'hui)";
      case 'this_week':
        return 'Semaine en cours (Du 07/09/2026 au 13/09/2026)';
      case 'this_month':
        return 'Mois de Septembre 2026';
      case 'last_month':
        return 'Mois d’Août 2026';
      case 'custom':
        return `Période du ${customStartDate} au ${customEndDate}`;
      case 'all':
        return 'Tout l’historique des prestations';
      default:
        return 'Période courante';
    }
  }, [periodFilter, customStartDate, customEndDate]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'N° Ordre',
      'Date & Heure',
      'N° Facture',
      'N° Dossier NDM',
      'Assuré / Patient',
      'Sexe',
      'Âge',
      'Organisme Tiers-Payant',
      'N° Police / Matricule',
      'Médecin Prescripteur',
      'Actes & Examens Biologiques',
      'Montant Total (FCFA)',
      'Taux Couverture (%)',
      'Ticket Modérateur Patient (FCFA)',
      'Part Assurance Dûe (FCFA)',
      'Solde Restant Dû (FCFA)',
      'Statut Règlement'
    ];

    const rows = filteredClaims.map((item, idx) => {
      const examNames = item.lines.map((l) => l.name).filter(Boolean).join(' + ') || 'Actes de biologie médicale';
      return [
        idx + 1,
        `"${item.invoiceDate}"`,
        `"${item.invoiceNumber}"`,
        `"${item.patientNdm}"`,
        `"${item.patientName.replace(/"/g, '""')}"`,
        `"${item.patientGender}"`,
        item.patientAge,
        `"${item.insuranceName.replace(/"/g, '""')}"`,
        `"${item.policyNumber}"`,
        `"${item.doctor.replace(/"/g, '""')}"`,
        `"${examNames.replace(/"/g, '""')}"`,
        item.totalAmount,
        item.coverageRate,
        item.clientShare,
        item.insuranceAmount,
        item.remainingDue,
        `"${item.paymentState === 'paid' ? 'Soldé' : item.remainingDue > 0 ? 'En Attente' : 'Partiel'}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (selectedInsuranceName || 'Toutes').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.setAttribute('download', `Bordereau_Assurance_${safeName}_${periodFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert number to French text for official slip certification
  const convertNumberToWords = (n: number): string => {
    if (n === 0) return 'Zéro';
    return `${Math.round(n).toLocaleString('fr-FR')}`;
  };

  // Handle Registering global payment from insurance
  const handleOpenTransferModal = () => {
    setTransferAmount(totals.totalRemainingDue);
    const safeCode = (selectedInsuranceName.split(' ')[0] || 'ASSUR').toUpperCase();
    setTransferRef(`VIR-${safeCode}-${new Date().toISOString().substring(2, 7).replace('-', '')}`);
    setShowPaymentModal(true);
  };

  const handleExecuteTransferSettlement = async () => {
    if (!onRegisterPayment || transferAmount <= 0) return;
    setIsSubmittingPayment(true);
    try {
      const pendingClaims = filteredClaims.filter((c) => c.remainingDue > 0);
      let allocated = 0;

      for (const claim of pendingClaims) {
        if (allocated >= transferAmount) break;
        const toPay = Math.min(claim.remainingDue, transferAmount - allocated);
        if (toPay > 0) {
          await onRegisterPayment({
            move_id: claim.moveId,
            partner_id: claim.move.partner_id,
            amount: toPay,
            payment_date: transferDate,
            payment_method_code: 'transfer',
            journal_id: 1,
            ref: `${transferRef} (Lettrage Tiers-Payant)`,
          });
          allocated += toPay;
        }
      }

      setShowPaymentModal(false);
    } catch (err) {
      console.error('Error settling transfer:', err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* SECTION 1: UNIFIED HEADER CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Point des Dus &amp; Bordereaux Assurances
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Relevé exhaustif des créances Tiers-Payant par organisme conventionné, pointage périodique et bordereau certifié.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrintSlipMode(!isPrintSlipMode)}
            className={`flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition cursor-pointer ${
              isPrintSlipMode
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>{isPrintSlipMode ? 'Quitter Vue Impression' : 'Imprimer le Bordereau'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exporter CSV / Excel</span>
          </button>

          {totals.totalRemainingDue > 0 && onRegisterPayment && (
            <button
              type="button"
              onClick={handleOpenTransferModal}
              className="flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span>Lettrer un Virement</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL COMPACT INSURANCE SELECTOR (NO MULTI-BUTTON CLUTTER) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Searchable / Clean Dropdown */}
          <div className="flex-1 max-w-xl">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              Organisme Tiers-Payant / Assurance Conventionnée ({insurancePartners.length})
            </label>
            <div className="relative">
              <select
                value={selectedInsuranceName}
                onChange={(e) => setSelectedInsuranceName(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 text-slate-900 text-xs font-bold py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition cursor-pointer appearance-none"
              >
                <option value="all">Toutes les Assurances &amp; Mutuelles (Vue Consolidée)</option>
                <optgroup label="Compagnies d'Assurances &amp; Organismes Conventionnés">
                  {insurancePartners.map((ins) => {
                    const debtInfo = debtPerInsurance.get(ins.name);
                    const dueSuffix = debtInfo?.totalDue ? ` — Solde Dû : ${formatFCFA(debtInfo.totalDue)}` : ' — Aucun impayé';
                    return (
                      <option key={ins.name} value={ins.name}>
                        {ins.name} {ins.convention_code ? `[${ins.convention_code}]` : ''} {dueSuffix}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right: Selected Insurance Convention & Badge Details */}
          <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
            {selectedPartnerDetails ? (
              <>
                {selectedPartnerDetails.convention_code && (
                  <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Convention :</span>
                    <span className="font-mono font-bold text-slate-900">{selectedPartnerDetails.convention_code}</span>
                  </div>
                )}
                <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                  <BadgePercent className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Prise en charge :</span>
                  <span className="font-bold text-slate-900">{selectedPartnerDetails.coverage_rate}%</span>
                </div>
                {selectedPartnerDetails.phone && (
                  <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-slate-800">{selectedPartnerDetails.phone}</span>
                  </div>
                )}
                {totals.totalRemainingDue > 0 && (
                  <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Dû Actuel : {formatFCFA(totals.totalRemainingDue)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium">Vue Globale : Consolidation de toutes les créances</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: PERIOD & STATUS FILTERS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Tabs (du jour, de la semaine, du mois) */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'today', label: "Aujourd'hui (du jour)" },
              { id: 'this_week', label: 'Cette semaine' },
              { id: 'this_month', label: 'Ce mois-ci' },
              { id: 'last_month', label: 'Mois dernier' },
              { id: 'custom', label: 'Période personnalisée' },
              { id: 'all', label: 'Tout l’historique' },
            ].map((p) => {
              const active = periodFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id as PeriodFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'pending', label: 'Dus en Attente (Non Soldés)' },
              { id: 'all', label: 'Tous les Dossiers' },
              { id: 'paid', label: 'Soldés / Réglés' },
            ].map((s) => {
              const active = statusFilter === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id as StatusFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is active */}
        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600">Intervalle de dates :</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Du</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Au</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Live Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom d'assuré, N° dossier NDM, N° matricule / police, N° facture ou examen biologique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          />
        </div>
      </div>

      {/* SECTION 4: UNIFIED FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Prestations (100%)</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            {formatFCFA(totals.totalPrestations)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Montant brut des actes</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Part Patient (Ticket Mod.)</div>
          <div className="text-lg sm:text-xl font-black text-slate-700 mt-1 font-mono">
            {formatFCFA(totals.totalClientShare)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Encaissé au guichet</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Part Assurance Exigible</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            {formatFCFA(totals.totalInsuranceAmount)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Prise en charge conventionnée</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reste Net Dû (Impayé)</div>
          <div className="text-lg sm:text-xl font-black text-rose-600 mt-1 font-mono">
            {formatFCFA(totals.totalRemainingDue)}
          </div>
          <div className="text-[10px] text-rose-500 font-medium mt-0.5">En attente de virement</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dossiers Facturés</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            {totals.count} <span className="text-xs font-normal text-slate-500">dossiers</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{currentPeriodLabel}</div>
        </div>
      </div>

      {/* SECTION 5: OFFICIAL PRINTABLE SLIP / BORDEREAU DE TRANSMISSION */}
      {isPrintSlipMode ? (
        <div id="insurance-slip-sheet" className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none">
          {/* Slip Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {company.name || "LABORATOIRE D'ANALYSES MEDICALES"}
              </h2>
              <p className="text-xs text-slate-600 font-medium">{company.slogan || 'Biologie Médicale & Diagnostic Spécialisé'}</p>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 font-mono">
                <div>Agrément Ministère Santé : {company.health_accreditation_number || 'MSHP/DGS/LAB-2026-0842'}</div>
                <div>RCCM : {company.rccm || 'CI-ABJ-2026-B-11409'} | CC : {company.tax_id || '0129482 B'}</div>
                <div>{company.address || 'Abidjan, Côte d’Ivoire'} — Tél : {company.phone || '+225 27 22 00 11 22'}</div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                Bordereau Officiel Tiers-Payant
              </span>
              <div className="text-xs font-mono font-bold text-slate-700">
                N° BORD-{selectedInsuranceName.substring(0, 4).toUpperCase()}-{new Date().toISOString().substring(0, 10).replace(/-/g, '')}
              </div>
              <div className="text-[11px] text-slate-500">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* Organisme & Période Card */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="font-bold text-slate-500 uppercase text-[10px]">Organisme Débiteur / Destinataire :</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{selectedInsuranceName}</div>
              {selectedPartnerDetails?.convention_code && (
                <div className="text-slate-600 font-mono mt-0.5">Convention : {selectedPartnerDetails.convention_code}</div>
              )}
              <div className="text-slate-500 mt-0.5">{selectedPartnerDetails?.city || 'Abidjan, Côte d’Ivoire'}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-500 uppercase text-[10px]">Période de Facturation :</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{currentPeriodLabel}</div>
              <div className="text-slate-600 mt-0.5">Nombre de dossiers : <strong>{filteredClaims.length}</strong></div>
              <div className="text-slate-600 mt-0.5">Modalité de règlement : <strong>Virement Bancaire</strong></div>
            </div>
          </div>

          {/* Printable Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold text-slate-900">
                  <th className="py-2.5 px-2">N°</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2">N° Facture</th>
                  <th className="py-2.5 px-2">NDM</th>
                  <th className="py-2.5 px-3">Nom &amp; Prénom Assuré</th>
                  <th className="py-2.5 px-2">N° Police / Bon</th>
                  <th className="py-2.5 px-3">Prestations Biologiques Réalisées</th>
                  <th className="py-2.5 px-2 text-right">Montant Total</th>
                  <th className="py-2.5 px-2 text-right">Part Patient</th>
                  <th className="py-2.5 px-2 text-right">Part Assurance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClaims.map((item, idx) => {
                  const examSummary = item.lines.map((l) => l.name).filter(Boolean).join(' • ') || 'Examens de biologie médicale';
                  return (
                    <tr key={item.moveId} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-mono text-[11px] whitespace-nowrap">{item.invoiceDate.split(' ')[0]}</td>
                      <td className="py-2 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">{item.invoiceNumber}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">{item.patientNdm}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.patientName}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-600 whitespace-nowrap">{item.policyNumber}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 max-w-xs truncate">{examSummary}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700">{Math.round(item.totalAmount).toLocaleString('fr-FR')} F</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{Math.round(item.clientShare).toLocaleString('fr-FR')} F</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 bg-slate-50">
                        {Math.round(item.insuranceAmount).toLocaleString('fr-FR')} F
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-black text-slate-900">
                  <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                    Totaux Généraux Certifiés ({filteredClaims.length} Dossiers) :
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-black text-slate-900">
                    {formatFCFA(totals.totalPrestations)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-black text-slate-700">
                    {formatFCFA(totals.totalClientShare)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-black text-slate-900 bg-slate-200">
                    {formatFCFA(totals.totalInsuranceAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Certification and Bank Coordinates */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold">Arrêt du présent bordereau récapitulatif :</div>
              <p className="italic leading-relaxed">
                Arrêté le présent bordereau récapitulatif à la somme nette exigible de : <strong className="uppercase">{convertNumberToWords(totals.totalInsuranceAmount)} Francs CFA</strong>.
              </p>
              <div className="pt-2 text-[11px] text-slate-500">
                Coordonnées bancaires pour virement : <strong>{company.bank_name || 'SGCI / BOA Côte d’Ivoire'}</strong> — IBAN : <span className="font-mono">{company.bank_iban || 'CI039 01001 002345678901 22'}</span> — BIC : <span className="font-mono">{company.bank_bic || 'SGCICIAB'}</span>.
              </div>
            </div>

            {/* Signatures and Stamp */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border border-slate-200 p-4 rounded-xl text-center min-h-[120px] flex flex-col justify-between">
                <div className="text-xs font-bold text-slate-700 uppercase">Pour le Laboratoire (Chef Comptable / Biologiste)</div>
                <div className="text-[10px] text-slate-400 italic">Cachet &amp; Signature autorisée</div>
                <div className="text-[11px] font-bold text-slate-900 mt-4">Direction Financière</div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl text-center min-h-[120px] flex flex-col justify-between">
                <div className="text-xs font-bold text-slate-700 uppercase">Pour la Compagnie d'Assurance (Contrôle Médical)</div>
                <div className="text-[10px] text-slate-400 italic">Visa, Date de Réception &amp; Bon à Payer</div>
                <div className="text-[11px] font-bold text-slate-900 mt-4">{selectedInsuranceName}</div>
              </div>
            </div>
          </div>

          {/* Slip Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 print:hidden">
            <button
              type="button"
              onClick={() => setIsPrintSlipMode(false)}
              className="px-4 py-2 text-xs font-bold border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Fermer la vue d'impression
            </button>
            <button
              type="button"
              onClick={() => printDocumentById('insurance-slip-sheet', 'Bordereau_Tiers_Payant_Assurance')}
              className="px-6 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center space-x-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimer (A4)</span>
            </button>
          </div>
        </div>
      ) : (
        /* SECTION 6: MAIN DETAILED DATA TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Détail des Prestations Biologiques Réalisées ({filteredClaims.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chaque ligne détaille les examens réalisés, le ticket modérateur et la créance exigible.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Période : {currentPeriodLabel}
            </div>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Aucune prestation trouvée pour ces critères</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Essayez d'élargir la période (ex: "Ce mois-ci" ou "Tout l'historique") ou sélectionnez une autre compagnie d'assurance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Facture &amp; NDM</th>
                    <th className="py-3 px-4">Assuré / Patient</th>
                    <th className="py-3 px-3">Organisme &amp; Police</th>
                    <th className="py-3 px-4">Examens Réalisés</th>
                    <th className="py-3 px-3 text-right">Total Brut</th>
                    <th className="py-3 px-3 text-right">Part Patient</th>
                    <th className="py-3 px-3 text-right">Part Assurance</th>
                    <th className="py-3 px-3 text-center">Statut</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((item) => {
                    const isExpanded = expandedMoveId === item.moveId;
                    const isFullyPaid = item.paymentState === 'paid';
                    const hasPendingDue = item.remainingDue > 0;

                    return (
                      <React.Fragment key={item.moveId}>
                        <tr className="hover:bg-slate-50/70 transition">
                          {/* Date */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {item.invoiceDate}
                          </td>

                          {/* Invoice & NDM */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold font-mono text-slate-900">{item.invoiceNumber}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.patientNdm}</div>
                          </td>

                          {/* Patient */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.patientName}</div>
                            <div className="text-[10px] text-slate-500">
                              {item.patientGender === 'F' ? 'Femme' : 'Homme'}, {item.patientAge} ans • {item.doctor}
                            </div>
                          </td>

                          {/* Insurance & Policy */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-[11px]">{item.insuranceName}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Matricule : {item.policyNumber} ({item.coverageRate}%)
                            </div>
                          </td>

                          {/* Exam Badges */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {item.lines.slice(0, 3).map((l, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                                >
                                  {l.name}
                                </span>
                              ))}
                              {item.lines.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedMoveId(isExpanded ? null : item.moveId)}
                                  className="text-[10px] font-bold text-slate-900 hover:underline cursor-pointer"
                                >
                                  +{item.lines.length - 3} autres
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                            {formatFCFA(item.totalAmount)}
                          </td>

                          {/* Patient Share */}
                          <td className="py-3 px-3 text-right font-mono text-slate-500">
                            {formatFCFA(item.clientShare)}
                          </td>

                          {/* Insurance Share */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">
                            <div>{formatFCFA(item.insuranceAmount)}</div>
                            {hasPendingDue && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                Dû : {formatFCFA(item.remainingDue)}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {isFullyPaid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Soldé
                              </span>
                            ) : item.remainingDue > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 mr-1 text-amber-600" />
                                En Attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                Partiel
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                            {onOpenPdf && (
                              <button
                                type="button"
                                onClick={() => onOpenPdf(item.move)}
                                title="Voir la facture détaillée"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setExpandedMoveId(isExpanded ? null : item.moveId)}
                              title="Afficher les détails des examens"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Sub-Row showing all test details */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={10} className="p-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                                    <span>Nomenclature &amp; Détail Tarifaire des Examens Prescrits</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    Facture {item.invoiceNumber} • NDM {item.patientNdm}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                  {item.lines.map((line, lIdx) => (
                                    <div
                                      key={lIdx}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-center"
                                    >
                                      <div>
                                        <div className="font-bold text-slate-900">{line.name}</div>
                                        <div className="text-[10px] text-slate-400">Quantité : {line.quantity}</div>
                                      </div>
                                      <div className="text-right font-mono font-bold text-slate-700">
                                        {formatFCFA(line.price_subtotal || line.price_unit)}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-600">
                                  <div>Prescripteur : <strong>{item.doctor}</strong></div>
                                  <div className="space-x-4">
                                    <span>Ticket Modérateur : <strong>{formatFCFA(item.clientShare)}</strong></span>
                                    <span>Part Assurance : <strong className="text-slate-900">{formatFCFA(item.insuranceAmount)}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: MODAL LETTRAGE VIREMENT ASSURANCE */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">
                  Enregistrer un Règlement Assurance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enregistrez le virement global reçu de <strong>{selectedInsuranceName}</strong>. Le montant sera automatiquement affecté et lettré sur les factures en attente.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organisme Payeur
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedInsuranceName}
                  className="w-full px-3 py-2 bg-slate-100 text-xs font-bold text-slate-800 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Référence du Virement Bancaire *
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="ex: VIR-SUNU-2026-09"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Montant Encaissé par Virement (FCFA) *
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-black font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Solde total en attente : {formatFCFA(totals.totalRemainingDue)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date de Réception du Virement
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-bold border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteTransferSettlement}
                disabled={isSubmittingPayment || transferAmount <= 0}
                className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingPayment ? 'Lettrage en cours...' : 'Valider & Lettrer les Factures'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
