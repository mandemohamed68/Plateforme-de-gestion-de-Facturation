import React, { useState, useMemo, useRef } from 'react';
import { printElement } from '../lib/printUtils';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Clock,
  Plus,
  Send,
  Building2,
  PieChart as PieChartIcon,
  Users,
  Microscope,
  Activity,
  Printer,
  Wallet,
  FileText,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  AnalyticsSummary,
  AccountMove,
  AccountPayment,
  ResPartner,
  ProductProduct,
  LabExamOrder,
  TillSession,
  ResUser,
  CompanySettings,
} from '../types';
import { formatFCFA } from '../lib/formatters';

interface DashboardViewProps {
  analytics: AnalyticsSummary | null;
  moves?: AccountMove[];
  overdueMoves?: AccountMove[];
  payments?: AccountPayment[];
  partners?: ResPartner[];
  products?: ProductProduct[];
  labOrders?: LabExamOrder[];
  tillSessions?: TillSession[];
  users?: ResUser[];
  currentUser?: ResUser | null;
  notifications?: any[];
  company?: CompanySettings;
  onNewInvoice?: () => void;
  onNewPayment?: () => void;
  onNewLabOrder?: () => void;
  onOpenSessions?: () => void;
  onSendReminder?: (moveId: number) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenInvoice?: (move: AccountMove) => void;
  onNavigate?: (view: string) => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type DashboardTab = 'overview' | 'financial' | 'laboratory' | 'cash_tills' | 'aging_balance' | 'tax_summary';

const PIE_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  moves = [],
  overdueMoves,
  payments = [],
  partners = [],
  products = [],
  labOrders = [],
  tillSessions = [],
  company,
  onNewInvoice,
  onNewPayment,
  onOpenSessions,
  onSendReminder = (_id: number) => {},
  onNavigateTab,
  onNavigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('year');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const companyName = company?.name || 'Laboratoire & Polyclinique';

  const handleNavigate = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onNavigate) onNavigate(tab);
  };

  // 1. Filtered Collections by Selected Period
  const filteredMoves = useMemo(() => {
    if (selectedPeriod === 'all') return moves;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return moves.filter((m) => {
      const dStr = m.invoice_date || m.date || m.created_at;
      if (!dStr) return true;
      const dDate = dStr.split('T')[0].split(' ')[0];

      if (selectedPeriod === 'today') return dDate === todayStr;
      if (selectedPeriod === 'week') {
        const past7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        return dDate >= past7 && dDate <= todayStr;
      }
      if (selectedPeriod === 'month') {
        const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return dDate.startsWith(curYearMonth);
      }
      if (selectedPeriod === 'year') {
        return dDate.startsWith(String(now.getFullYear()));
      }
      return true;
    });
  }, [moves, selectedPeriod]);

  const filteredPayments = useMemo(() => {
    if (selectedPeriod === 'all') return payments;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return payments.filter((p) => {
      const dStr = p.payment_date || p.date || p.created_at;
      if (!dStr) return true;
      const dDate = dStr.split('T')[0].split(' ')[0];

      if (selectedPeriod === 'today') return dDate === todayStr;
      if (selectedPeriod === 'week') {
        const past7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        return dDate >= past7 && dDate <= todayStr;
      }
      if (selectedPeriod === 'month') {
        const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return dDate.startsWith(curYearMonth);
      }
      if (selectedPeriod === 'year') {
        return dDate.startsWith(String(now.getFullYear()));
      }
      return true;
    });
  }, [payments, selectedPeriod]);

  const filteredLabOrders = useMemo(() => {
    if (selectedPeriod === 'all') return labOrders;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return labOrders.filter((o) => {
      const dStr = o.sampling_date || o.created_at;
      if (!dStr) return true;
      const dDate = dStr.split('T')[0].split(' ')[0];

      if (selectedPeriod === 'today') return dDate === todayStr;
      if (selectedPeriod === 'week') {
        const past7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        return dDate >= past7 && dDate <= todayStr;
      }
      if (selectedPeriod === 'month') {
        const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return dDate.startsWith(curYearMonth);
      }
      if (selectedPeriod === 'year') {
        return dDate.startsWith(String(now.getFullYear()));
      }
      return true;
    });
  }, [labOrders, selectedPeriod]);

  // 2. Overdue Moves Calculation
  const effectiveOverdueMoves = useMemo(() => {
    const nowStr = new Date().toISOString().split('T')[0];
    return filteredMoves.filter(
      (m) =>
        m &&
        m.state === 'posted' &&
        (m.amount_residual || 0) > 0 &&
        m.invoice_date_due &&
        m.invoice_date_due < nowStr
    );
  }, [filteredMoves]);

  // 3. Financial Metrics Breakdown based on real filtered moves & payments
  const metrics = useMemo(() => {
    const posted = filteredMoves.filter((m) => m.state === 'posted');
    const totalRevenueTTC = posted.reduce((sum, m) => sum + (m.amount_total || 0), 0);

    const totalRevenueHT = posted.reduce(
      (sum, m) => sum + (m.amount_untaxed || (m.amount_total ? m.amount_total / 1.18 : 0)),
      0
    );

    const totalTax = Math.max(0, totalRevenueTTC - totalRevenueHT);

    const validPayments = filteredPayments.filter(
      (p) => p.state === 'posted' || p.state === 'reconciled'
    );
    let totalPaid = validPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    // If payments table has not tracked individual moves, infer from settled amounts
    if (totalPaid === 0 && posted.length > 0) {
      totalPaid = posted.reduce(
        (sum, m) => sum + Math.max(0, (m.amount_total || 0) - (m.amount_residual || 0)),
        0
      );
    }

    const totalResidual = posted.reduce((sum, m) => sum + (m.amount_residual || 0), 0);
    const totalOverdue = effectiveOverdueMoves.reduce((sum, m) => sum + (m.amount_residual || 0), 0);

    // True Patient vs Insurance breakdown based on invoice flags
    const insuranceShare = posted
      .filter((m) => m.insurance_enabled && (m.insurance_amount || 0) > 0)
      .reduce((sum, m) => sum + (m.insurance_amount || 0), 0);

    const patientShare = Math.max(0, totalRevenueTTC - insuranceShare);

    const pendingInsuranceResidual = posted
      .filter((m) => m.insurance_enabled && (m.insurance_amount || 0) > 0 && (m.amount_residual || 0) > 0)
      .reduce((sum, m) => sum + Math.min(m.insurance_amount || 0, m.amount_residual || 0), 0);

    const pendingPatientResidual = Math.max(0, totalResidual - pendingInsuranceResidual);

    const recoveryRate = totalRevenueTTC > 0 ? (totalPaid / totalRevenueTTC) * 100 : 100;

    const uniquePatientsCount = new Set(
      posted.filter((m) => m.partner_id).map((m) => m.partner_id)
    ).size;

    const averageBasket =
      totalRevenueTTC > 0 && uniquePatientsCount > 0
        ? Math.round(totalRevenueTTC / uniquePatientsCount)
        : 0;

    const totalExamsPrescribed = filteredLabOrders.reduce(
      (sum, o) => sum + (o.exam_names?.length || (o.parameters?.length || 1)),
      0
    );
    const validatedExamsCount = filteredLabOrders.filter((o) => o.status === 'validated').length;
    const labValidationRate =
      filteredLabOrders.length > 0
        ? Math.round((validatedExamsCount / filteredLabOrders.length) * 1000) / 10
        : 0;

    return {
      totalRevenueTTC,
      totalRevenueHT,
      totalTax,
      totalPaid,
      totalResidual,
      totalOverdue,
      patientShare,
      insuranceShare,
      pendingInsuranceResidual,
      pendingPatientResidual,
      recoveryRate: Math.min(Math.round(recoveryRate * 10) / 10, 100),
      uniquePatientsCount,
      averageBasket,
      totalExamsPrescribed,
      validatedExamsCount,
      labValidationRate,
      invoiceCount: posted.length,
    };
  }, [filteredMoves, filteredPayments, effectiveOverdueMoves, filteredLabOrders]);

  // 4. Payment Methods Breakdown (Computed from real payments)
  const paymentMethodsData = useMemo(() => {
    const map: Record<string, number> = {};
    const validPayments = filteredPayments.filter(
      (p) => p.state === 'posted' || p.state === 'reconciled'
    );

    if (validPayments.length > 0) {
      validPayments.forEach((p) => {
        const methodStr = (p.journal_name || p.payment_method_code || 'Espèces').toString().toLowerCase();
        const formattedName =
          methodStr.includes('esp') || methodStr.includes('caisse')
            ? 'Espèces (Caisse)'
            : methodStr.includes('wave')
            ? 'Wave Mobile Money'
            : methodStr.includes('orange')
            ? 'Orange Money'
            : methodStr.includes('moov')
            ? 'Moov Money'
            : methodStr.includes('card') || methodStr.includes('carte')
            ? 'Carte Bancaire'
            : methodStr.includes('check') || methodStr.includes('chèque')
            ? 'Chèque'
            : methodStr.includes('trans') || methodStr.includes('banque')
            ? 'Virement Bancaire'
            : (p.journal_name || p.payment_method_code || 'Espèces').toString();
        map[formattedName] = (map[formattedName] || 0) + (p.amount || 0);
      });
    } else if (metrics.totalPaid > 0) {
      map['Espèces (Caisse)'] = metrics.totalPaid;
    }

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredPayments, metrics.totalPaid]);

  // 5. Monthly Trend Data (Dynamically aggregated from real posted moves per month)
  const monthlyRevenueData = useMemo(() => {
    if (analytics?.monthly_revenue && analytics.monthly_revenue.length > 0) {
      return analytics.monthly_revenue.map((m) => ({
        ...m,
        residual: Math.max((m.ttc || 0) - (m.paid || 0), 0),
      }));
    }

    const monthsNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyMap: Record<number, { ht: number; ttc: number; paid: number; residual: number }> = {};
    for (let i = 0; i < 12; i++) {
      monthlyMap[i] = { ht: 0, ttc: 0, paid: 0, residual: 0 };
    }

    moves
      .filter((m) => m.state === 'posted')
      .forEach((m) => {
        const dStr = m.invoice_date || m.date || m.created_at;
        if (dStr) {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            const mIdx = d.getMonth();
            const ht = m.amount_untaxed || (m.amount_total ? m.amount_total / 1.18 : 0);
            const ttc = m.amount_total || 0;
            const res = m.amount_residual || 0;
            const paid = Math.max(0, ttc - res);

            monthlyMap[mIdx].ht += ht;
            monthlyMap[mIdx].ttc += ttc;
            monthlyMap[mIdx].paid += paid;
            monthlyMap[mIdx].residual += res;
          }
        }
      });

    return monthsNames.map((name, idx) => ({
      month: name,
      ht: Math.round(monthlyMap[idx].ht),
      ttc: Math.round(monthlyMap[idx].ttc),
      paid: Math.round(monthlyMap[idx].paid),
      residual: Math.round(monthlyMap[idx].residual),
    }));
  }, [moves, analytics]);

  const peakMonthlyRevenue = useMemo(() => {
    return Math.max(0, ...monthlyRevenueData.map((d) => d.ttc));
  }, [monthlyRevenueData]);

  const averageMonthlyPaid = useMemo(() => {
    const activeMonths = monthlyRevenueData.filter((d) => d.ttc > 0 || d.paid > 0);
    if (activeMonths.length === 0) return 0;
    const sumPaid = activeMonths.reduce((sum, d) => sum + d.paid, 0);
    return Math.round(sumPaid / activeMonths.length);
  }, [monthlyRevenueData]);

  // 6. Top Lab Exams by Volume & Revenue from Real Invoices & Lab Orders
  const topExamsData = useMemo(() => {
    const examCount: Record<string, { count: number; total: number; category: string }> = {};

    filteredMoves
      .filter((m) => m.state === 'posted')
      .forEach((m) => {
        (m.lines || []).forEach((l) => {
          const name = l.name || l.product_name || 'Examen Biologique';
          if (!examCount[name]) {
            examCount[name] = { count: 0, total: 0, category: 'Biologie' };
          }
          examCount[name].count += l.quantity || 1;
          examCount[name].total += l.price_total || l.price_subtotal || 0;
        });
      });

    const result = Object.entries(examCount).map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      category: data.category,
    }));

    if (result.length > 0) {
      return result.sort((a, b) => b.total - a.total).slice(0, 6);
    }

    // Secondary source: correlate with labOrders
    const orderCounts: Record<string, number> = {};
    filteredLabOrders.forEach((o) => {
      (o.exam_names || []).forEach((en) => {
        orderCounts[en] = (orderCounts[en] || 0) + 1;
      });
    });

    if (Object.keys(orderCounts).length > 0) {
      return Object.entries(orderCounts)
        .map(([name, count]) => {
          const prod = products.find((p) => p.name === name);
          const price = prod?.list_price || 8000;
          return {
            name,
            count,
            total: count * price,
            category: prod?.lab_department || 'Biologie',
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
    }

    if (products.length > 0) {
      return products.slice(0, 5).map((p) => ({
        name: p.name,
        count: 0,
        total: 0,
        category: p.lab_department || 'Biologie',
      }));
    }

    return [];
  }, [filteredMoves, filteredLabOrders, products]);

  // 7. Top Partners / Comptes Patients from Real Invoices
  const topPartners = useMemo(() => {
    const map: Record<string, { name: string; invoiced: number; paid: number; residual: number }> = {};

    filteredMoves
      .filter((m) => m.state === 'posted')
      .forEach((m) => {
        const partnerName =
          partners.find((p) => p.id === m.partner_id)?.name || m.partner_name || 'Patient';
        if (!map[partnerName]) {
          map[partnerName] = { name: partnerName, invoiced: 0, paid: 0, residual: 0 };
        }
        const total = m.amount_total || 0;
        const res = m.amount_residual || 0;
        map[partnerName].invoiced += total;
        map[partnerName].residual += res;
        map[partnerName].paid += Math.max(0, total - res);
      });

    return Object.values(map)
      .sort((a, b) => b.invoiced - a.invoiced)
      .slice(0, 5);
  }, [filteredMoves, partners]);

  // 8. Aging Balance (Balance Âgée)
  const agingBalance = useMemo(() => {
    const now = new Date().getTime();
    const b0_30: AccountMove[] = [];
    const b30_60: AccountMove[] = [];
    const b60_plus: AccountMove[] = [];

    filteredMoves
      .filter((m) => m.state === 'posted' && (m.amount_residual || 0) > 0)
      .forEach((m) => {
        const dueDate = m.invoice_date_due ? new Date(m.invoice_date_due).getTime() : now;
        const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) b0_30.push(m);
        else if (diffDays <= 60) b30_60.push(m);
        else b60_plus.push(m);
      });

    const total0_30 = b0_30.reduce((s, m) => s + (m.amount_residual || 0), 0);
    const total30_60 = b30_60.reduce((s, m) => s + (m.amount_residual || 0), 0);
    const total60_plus = b60_plus.reduce((s, m) => s + (m.amount_residual || 0), 0);

    return {
      b0_30,
      b30_60,
      b60_plus,
      total0_30,
      total30_60,
      total60_plus,
      chartData: [
        { period: 'Courant (< 30 jours)', amount: total0_30, count: b0_30.length, color: '#10b981' },
        { period: '30 à 60 jours', amount: total30_60, count: b30_60.length, color: '#f59e0b' },
        { period: 'Plus de 60 jours', amount: total60_plus, count: b60_plus.length, color: '#e11d48' },
      ],
    };
  }, [filteredMoves]);

  // 9. Real Cash Till Sessions Activity
  const cashierPerformance = useMemo(() => {
    return (tillSessions || []).map((s) => ({
      id: s.id,
      name: s.session_code || `SESSION-${s.id}`,
      cashier: s.cashier_name || 'Caissier',
      state: s.state,
      opening_balance: s.opening_balance || 0,
      total_collected: s.total_collected || 0,
      cash_collected: s.total_cash_collected || 0,
      digital_collected: s.total_mobile_money_collected || 0,
      invoices_count: s.transactions?.length || 0,
      start_at: s.opening_date,
    }));
  }, [tillSessions]);

  return (
    <div className="space-y-5 pb-16 max-w-full font-sans text-slate-800 animate-fadeIn">
      {/* 1. TOP STRATEGIC EXECUTIVE HEADER */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 mb-2.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Pilotage Médico-Financier &amp; Direction Générale</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] text-slate-500 font-medium">Flux direct</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Tableau de Bord Stratégique &amp; Analytique</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Supervision unifiée du chiffre d'affaires, des encaissements en caisse, du recouvrement tiers-payeur et du volume d'analyses cliniques.
            </p>
          </div>

          {/* Quick Action Buttons & Period Selector */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Period selector pill */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
              {(
                [
                  { id: 'today', label: "Aujourd'hui" },
                  { id: 'week', label: '7 jours' },
                  { id: 'month', label: 'Ce mois' },
                  { id: 'year', label: 'Année 2026' },
                  { id: 'all', label: 'Tout' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-2.5 py-1 rounded-md text-xs transition font-semibold cursor-pointer ${
                    selectedPeriod === p.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Print Executive Report */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Générer un rapport PDF / Impression"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Rapport</span>
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onNewInvoice || (() => handleNavigate('invoices'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Facture</span>
              </button>
              <button
                onClick={onNewPayment || (() => handleNavigate('payments'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Règlement</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY 6-KPI BENTO GRID (Deep Professional Financial & Medical Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Chiffre d'affaires Global TTC */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Chiffre d'Affaires (TTC)
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {formatFCFA(metrics.totalRevenueTTC)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>HT: {formatFCFA(metrics.totalRevenueHT)}</span>
              <span className="text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                {metrics.invoiceCount} facture{metrics.invoiceCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Encaissé Réel */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Recettes Encaissées
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-800 tracking-tight font-mono">
              {formatFCFA(metrics.totalPaid)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>Taux recouvrement:</span>
              <span className="font-bold text-emerald-800">{metrics.recoveryRate}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Encours Restant Dû */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Créances Restantes
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {formatFCFA(metrics.totalResidual)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>Reste Assurances:</span>
              <span className="font-bold text-teal-700 font-mono text-[10px]">{formatFCFA(metrics.pendingInsuranceResidual)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Créances en Souffrance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Créances Échues
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-amber-900 tracking-tight font-mono">
              {formatFCFA(metrics.totalOverdue)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>{effectiveOverdueMoves.length} facture{effectiveOverdueMoves.length > 1 ? 's' : ''}</span>
              {effectiveOverdueMoves.length > 0 ? (
                <button
                  onClick={() => handleNavigate('notifications')}
                  className="font-bold text-amber-700 hover:text-amber-900 underline text-[10px] cursor-pointer"
                >
                  Relancer
                </button>
              ) : (
                <span className="text-emerald-700 font-bold text-[10px]">À jour</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 5: Patients & Panier Moyen */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Patients Reçus
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {metrics.uniquePatientsCount} dossiers
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>Panier moyen:</span>
              <span className="font-bold text-slate-900 font-mono text-[10px]">
                {formatFCFA(Math.round(metrics.averageBasket))}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 6: Analyses & Labo Plateau Technique */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Analyses Labo
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
              <Microscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-teal-950 tracking-tight font-mono">
              {metrics.totalExamsPrescribed} actes
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>Validation Bio:</span>
              <span className="font-bold text-teal-800">{metrics.labValidationRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OVERDUE ALERT BANNER IF APPLICABLE */}
      {effectiveOverdueMoves.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{effectiveOverdueMoves.length} Facture(s) en dépassement d'échéance</span>
                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[10px] font-mono font-bold">
                  {formatFCFA(metrics.totalOverdue)} à recouvrer
                </span>
              </h3>
              <p className="text-xs text-amber-900/80 mt-0.5">
                Des créances patients et tiers-payeurs ont dépassé leur date limite de règlement. Envoyez des relances directes pour sécuriser la trésorerie.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {effectiveOverdueMoves.slice(0, 2).map((m) => (
              <button
                key={m.id}
                onClick={() => onSendReminder(m.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Relancer {m.name}</span>
              </button>
            ))}
            <button
              onClick={() => handleNavigate('notifications')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-md text-xs font-bold transition cursor-pointer"
            >
              <span>Toutes les relances &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. THEMATIC ANALYTICAL TABS */}
      <div className="flex flex-wrap items-center border-b border-slate-200 gap-1.5 pb-1">
        {(
          [
            { id: 'overview', label: "Vue d'Ensemble & Graphiques", icon: Activity },
            { id: 'financial', label: 'Flux de Trésorerie & Encaissements', icon: CreditCard },
            { id: 'laboratory', label: 'Activité Biologique & Examens', icon: Microscope },
            { id: 'cash_tills', label: 'Guichets & Sessions Caisse', icon: Wallet },
            { id: 'aging_balance', label: 'Balance Âgée & Recouvrement', icon: Scale },
            { id: 'tax_summary', label: 'Fiscalité & Synthèse TVA', icon: FileText },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                isActive
                  ? 'border-slate-900 text-teal-700 bg-teal-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW & SYNTHESIS */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Main 2-Column Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Monthly Financial Trend (2 columns) */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Évolution Temporelle du Chiffre d'Affaires</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Comparatif mensuel du CA Brut (TTC), des encaissements effectifs et des créances résiduelles
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-900"></span> CA TTC
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> Encaissé
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> Encours
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatFCFA(Number(val))}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '11px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                    <Bar dataKey="ttc" name="Total TTC (FCFA)" fill="#0f172a" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="paid" name="Encaissé (FCFA)" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="residual" name="Encours restant" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-medium">Pic Mensuel TTC</div>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">{formatFCFA(peakMonthlyRevenue)}</div>
                </div>
                <div className="p-2 bg-emerald-50/60 rounded-lg">
                  <div className="text-[10px] text-emerald-800 font-medium">Moyenne Encaissée</div>
                  <div className="font-bold text-emerald-900 font-mono mt-0.5">{formatFCFA(averageMonthlyPaid)}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-medium">Taux Recouvrement</div>
                  <div className="font-bold text-emerald-600 font-mono mt-0.5">{metrics.recoveryRate}%</div>
                </div>
              </div>
            </div>

            {/* Chart 2: Payment Methods Breakdown (Donut chart) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Modes de Règlement</h3>
                    <p className="text-[11px] text-slate-500">Répartition des encaissements par canal</p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-slate-400" />
                </div>

                <div className="h-52 w-full flex items-center justify-center my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethodsData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatFCFA(Number(val))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {paymentMethodsData.map((d, i) => {
                  const pct = metrics.totalPaid > 0 ? ((d.value / metrics.totalPaid) * 100).toFixed(1) : '0';
                  return (
                    <div key={d.name} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-slate-700 text-[11px]">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">{pct}%</span>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {formatFCFA(d.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secondary Grid: Top Exams & Key Partner Receivables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Lab Exams Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Microscope className="w-4 h-4 text-teal-600" />
                    <span>Top 6 des Examens les Plus Prescrits</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Volume &amp; Chiffre d'affaires généré par examen</p>
                </div>
                <button
                  onClick={() => handleNavigate('products')}
                  className="text-xs text-teal-700 hover:text-teal-950 font-bold underline cursor-pointer"
                >
                  Catalogue &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {topExamsData.map((exam, idx) => (
                  <div key={exam.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <span className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{exam.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">{exam.category}</span>
                          <span>{exam.count} analyses réalisées</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-900">{formatFCFA(exam.total)}</div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                        Rentable
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Patients / Corporate Insurance Partners */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Top Partenaires &amp; Comptes Patients</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Suivi des volumes facturés et reste à recouvrer</p>
                </div>
                <button
                  onClick={() => handleNavigate('partners')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  Répertoire &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {topPartners.length > 0 ? (
                  topPartners.map((partner, idx) => (
                    <div key={partner.name} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">{partner.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Encaissé: {formatFCFA(partner.paid)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">{formatFCFA(partner.invoiced)}</div>
                        {partner.residual > 0 ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Reste {formatFCFA(partner.residual)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Soldé 100%
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Aucune facture enregistrée sur cette période
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: FINANCIAL & TREASURY */}
      {activeTab === 'financial' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Part Patient (Ticket Modérateur)</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {formatFCFA(metrics.patientShare)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Montant réglé directement par les patients au comptoir de caisse
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Prise en Charge (Assurances / Tiers)</div>
              <div className="text-2xl font-black text-teal-950 font-mono mt-1">
                {formatFCFA(metrics.insuranceShare)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Montant pris en charge par les mutuelles, assurances et conventions
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">TVA &amp; Prélèvements Fiscaux</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {formatFCFA(metrics.totalTax)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Taxe sur la valeur ajoutée collectée sur les actes assujettis
              </p>
            </div>
          </div>

          {/* Recent Payments Journal */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Journal des Derniers Encaissements Reçus
                </h3>
                <p className="text-[11px] text-slate-500">Flux de paiement enregistrés au fil de l'eau</p>
              </div>
              <button
                onClick={() => handleNavigate('payments')}
                className="text-xs font-bold text-slate-900 underline cursor-pointer"
              >
                Voir tout ({payments.length}) &rarr;
              </button>
            </div>

            <div className="w-full">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-2.5 w-[20%]">Réf Paiement</th>
                    <th className="py-2.5 px-2.5 w-[16%] hidden sm:table-cell">Date</th>
                    <th className="py-2.5 px-2.5 w-[28%]">Patient / Société</th>
                    <th className="py-2.5 px-2.5 w-[16%] hidden md:table-cell">Canal</th>
                    <th className="py-2.5 px-2.5 text-right w-[20%]">Montant</th>
                    <th className="py-2.5 px-2 text-center w-[12%] hidden sm:table-cell">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.slice(0, 8).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 truncate" title={p.move_name || `PAY/2026/00${p.id}`}>
                        {p.move_name || `PAY/2026/00${p.id}`}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-500 text-[11px] truncate hidden sm:table-cell">{p.payment_date || 'Aujourd\'hui'}</td>
                      <td className="py-2.5 px-2.5 font-medium text-slate-800 truncate" title={p.partner_name || 'Patient'}>{p.partner_name || 'Patient'}</td>
                      <td className="py-2.5 px-2.5 hidden md:table-cell truncate">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700 truncate">
                          {p.journal_name || p.payment_method_code || 'Espèces'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatFCFA(p.amount)}
                      </td>
                      <td className="py-2.5 px-2 text-center hidden sm:table-cell">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          Validé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: LABORATORY & CLINICAL ACTIVITY */}
      {activeTab === 'laboratory' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Dossiers En Attente</div>
              <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                {filteredLabOrders.filter((o) => o.status === 'pending_sampling').length}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Prélèvement ou attente de saisie paillasse</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">En Cours d'Analyse</div>
              <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                {filteredLabOrders.filter((o) => o.status === 'in_progress').length}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Automates et manipulations en laboratoire</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Résultats Saisis</div>
              <div className="text-2xl font-black text-teal-600 font-mono mt-1">
                {filteredLabOrders.filter((o) => o.status === 'results_entered').length}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">En attente de signature biologique</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Validés par Biologiste</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {filteredLabOrders.filter((o) => o.status === 'validated').length}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Signature médicale apposée &amp; délivrable</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Derniers Dossiers d'Analyses Médicales
                </h3>
                <p className="text-[11px] text-slate-500">Suivi des comptes-rendus et statuts biologiques</p>
              </div>
              <button
                onClick={() => handleNavigate('lab_results')}
                className="text-xs font-bold text-teal-800 underline cursor-pointer"
              >
                Accéder au Laboratoire &rarr;
              </button>
            </div>

            <div className="w-full">
              {filteredLabOrders.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-2.5 w-[20%]">N° Dossier</th>
                      <th className="py-2.5 px-2.5 w-[25%]">Patient</th>
                      <th className="py-2.5 px-2.5 w-[20%] hidden md:table-cell">Prescripteur</th>
                      <th className="py-2.5 px-2.5 w-[15%] hidden sm:table-cell">Date</th>
                      <th className="py-2.5 px-2.5 w-[20%]">Statut</th>
                      <th className="py-2.5 px-2 text-right w-[15%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLabOrders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 truncate" title={order.order_number}>{order.order_number}</td>
                        <td className="py-2.5 px-2.5 font-bold text-slate-800 truncate" title={order.partner_name}>{order.partner_name}</td>
                        <td className="py-2.5 px-2.5 text-slate-500 text-[11px] truncate hidden md:table-cell">{order.prescribing_doctor || 'Non spécifié'}</td>
                        <td className="py-2.5 px-2.5 text-slate-500 text-[11px] truncate hidden sm:table-cell">{order.sampling_date}</td>
                        <td className="py-2.5 px-2.5 truncate">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold truncate max-w-full ${
                              order.status === 'validated'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status === 'validated'
                              ? 'Validé'
                              : order.status === 'results_entered'
                              ? 'Résultats'
                              : order.status === 'in_progress'
                              ? 'En cours'
                              : 'Prélèvement'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => handleNavigate('lab_results')}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-[11px] font-bold cursor-pointer transition"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aucun dossier d'analyse enregistré sur cette période
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: CASH TILLS & SESSIONS */}
      {activeTab === 'cash_tills' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Performance des Vacations &amp; Guichets de Caisse</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Suivi des arrêtés de caisse journaliers, montants en espèces et digital
                </p>
              </div>
              <button
                onClick={onOpenSessions || (() => handleNavigate('caisse_sessions'))}
                className="text-xs font-bold text-emerald-800 underline cursor-pointer"
              >
                Gérer les Vacations &rarr;
              </button>
            </div>

            <div className="w-full">
              {cashierPerformance.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-2.5 w-[20%]">Session</th>
                      <th className="py-2.5 px-2.5 w-[22%]">Caissier</th>
                      <th className="py-2.5 px-2.5 w-[16%] hidden sm:table-cell">Ouverture</th>
                      <th className="py-2.5 px-2.5 text-right w-[18%] hidden md:table-cell">Espèces</th>
                      <th className="py-2.5 px-2.5 text-right w-[24%]">Total Collecté</th>
                      <th className="py-2.5 px-2 text-center w-[16%]">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashierPerformance.map((sess) => (
                      <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 truncate" title={sess.name}>{sess.name}</td>
                        <td className="py-2.5 px-2.5 font-bold text-slate-800 truncate" title={sess.cashier}>{sess.cashier}</td>
                        <td className="py-2.5 px-2.5 text-slate-500 text-[11px] truncate hidden sm:table-cell">{sess.start_at}</td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-slate-800 whitespace-nowrap hidden md:table-cell">
                          {formatFCFA(sess.cash_collected)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                          {formatFCFA(sess.total_collected)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold truncate max-w-full ${
                              sess.state === 'in_progress'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sess.state === 'in_progress' ? 'Active' : 'Clôturée'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aucune session de caisse enregistrée sur cette période
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: AGING BALANCE & RECOVERY */}
      {activeTab === 'aging_balance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agingBalance.chartData.map((item) => (
              <div key={item.period} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase">{item.period}</div>
                <div className="text-xl font-black text-slate-900 font-mono mt-1">
                  {formatFCFA(item.amount)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{item.count} facture(s) concernée(s)</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Détail des Factures en Souffrance
                </h3>
                <p className="text-[11px] text-slate-500">Relances ciblées avec calcul des pénalités ou alertes</p>
              </div>
            </div>

            <div className="w-full">
              {effectiveOverdueMoves.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-2.5 w-[25%]">Facture</th>
                      <th className="py-2.5 px-2.5 w-[20%]">Échéance</th>
                      <th className="py-2.5 px-2.5 text-right w-[20%] hidden sm:table-cell">Total</th>
                      <th className="py-2.5 px-2.5 text-right w-[20%]">Solde Dû</th>
                      <th className="py-2.5 px-2 text-right w-[15%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {effectiveOverdueMoves.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 truncate" title={m.name}>{m.name}</td>
                        <td className="py-2.5 px-2.5 text-amber-700 font-medium text-[11px] truncate">
                          {m.invoice_date_due || 'Non définie'}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-slate-600 whitespace-nowrap hidden sm:table-cell">
                          {formatFCFA(m.amount_total)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono font-bold text-amber-900 whitespace-nowrap">
                          {formatFCFA(m.amount_residual)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => onSendReminder(m.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded text-[10px] font-bold cursor-pointer transition"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Relancer</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-lg">
                  Toutes les créances sont à jour ou recouvrées. Aucun retard d'échéance à signaler.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: TAXES & COMPLIANCE */}
      {activeTab === 'tax_summary' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                Synthèse Fiscale &amp; Régimes de TVA
              </h3>
              <div className="space-y-3">
                {(analytics?.tax_summary || [
                  { tax_name: 'TVA Santé / Analyses (18%)', rate: 18, total_tax_amount: metrics.totalTax },
                  { tax_name: 'Actes Médicaux Exonérés (Art. 355 CGI)', rate: 0, total_tax_amount: 0 },
                ]).map((tax) => (
                  <div
                    key={tax.tax_name}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{tax.tax_name}</div>
                      <div className="text-[10px] text-slate-500">Taux légal appliqué : {tax.rate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {formatFCFA(tax.total_tax_amount)}
                      </div>
                      <span className="text-[10px] text-slate-500">TVA Déductible / Collectée</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                Informations Légales de la Structure
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Nom de l'Établissement:</span>
                  <span className="font-bold text-slate-900">{companyName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">N° Agrément Santé:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {company?.health_accreditation_number || 'MSHP/DGS/2026-B042'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Compte Contribuable / IFU:</span>
                  <span className="font-mono font-bold text-slate-900">{company?.tax_id || 'CI-2026-0048992'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">RCCM:</span>
                  <span className="font-mono font-bold text-slate-900">{company?.rccm || 'CI-ABJ-2026-B-1142'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PRINTABLE EXECUTIVE REPORT MODAL (A4 Format Ready) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Header Modal Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-slate-700" />
                <h2 className="text-base font-black text-slate-900">
                  Rapport de Synthèse Financière &amp; Médicale (A4)
                </h2>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1 rounded cursor-pointer"
              >
                Fermer &times;
              </button>
            </div>

            {/* Printable Content Body */}
            <div ref={printRef} className="space-y-4 text-xs text-slate-800 border p-5 rounded-xl bg-slate-50/50">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">{companyName}</h3>
                  <p className="text-slate-500 text-[11px]">{company?.slogan || 'Laboratoire d\'Analyses Médicales'}</p>
                  <p className="text-[10px] text-slate-400">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-wider">
                    Rapport Officiel
                  </span>
                </div>
              </div>

              {/* Summary table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="p-2.5 bg-white border rounded">
                  <div className="text-[10px] text-slate-500 uppercase">Chiffre d'Affaires TTC</div>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">{formatFCFA(metrics.totalRevenueTTC)}</div>
                </div>
                <div className="p-2.5 bg-white border rounded">
                  <div className="text-[10px] text-slate-500 uppercase">Total Encaissé</div>
                  <div className="font-bold text-emerald-800 font-mono mt-0.5">{formatFCFA(metrics.totalPaid)}</div>
                </div>
                <div className="p-2.5 bg-white border rounded">
                  <div className="text-[10px] text-slate-500 uppercase">Créances Restantes</div>
                  <div className="font-bold text-amber-900 font-mono mt-0.5">{formatFCFA(metrics.totalResidual)}</div>
                </div>
                <div className="p-2.5 bg-white border rounded">
                  <div className="text-[10px] text-slate-500 uppercase">Taux Recouvrement</div>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">{metrics.recoveryRate}%</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                <span>Directeur Médical: {company?.medical_director_name || 'Dr. Aminata Touré'}</span>
                <span>Signature &amp; Cachet de Direction</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (printRef.current) {
                    printElement(printRef.current, 'Rapport_Synthese_Direction');
                  } else {
                    window.print();
                  }
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Lancer l'Impression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
