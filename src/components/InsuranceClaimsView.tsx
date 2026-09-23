import React, { useState, useMemo, useEffect } from 'react';
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
  BadgePercent,
  Edit2,
  Trash2,
  HeartHandshake,
  Check,
  SlidersHorizontal,
  MapPin,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Landmark,
  LayoutList,
  LayoutGrid,
  ExternalLink
} from 'lucide-react';
import { AccountMove, ResPartner, CompanySettings, ResUser, EnterpriseConvention } from '../types';
import { formatFCFA } from '../lib/formatters';
import { printDocumentById } from '../lib/printUtils';
import { getStoredConventions, saveStoredConventions, defaultEnterpriseConventions } from '../data/conventionsData';

interface InsuranceClaimsViewProps {
  moves: AccountMove[];
  partners: ResPartner[];
  company: CompanySettings;
  currentUser: ResUser | null;
  onOpenPdf?: (move: AccountMove) => void;
  onRegisterPayment?: (payment: any) => Promise<any>;
  onNavigateToInvoices?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type MainViewTab = 'conventions' | 'claims';
type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom' | 'all';
type StatusFilter = 'pending' | 'all' | 'paid';
type ConventionTypeFilter = 'all' | 'enterprise' | 'insurance' | 'mutuelle';
type DisplayMode = 'list' | 'grid';

export const InsuranceClaimsView: React.FC<InsuranceClaimsViewProps> = ({
  moves,
  partners,
  company,
  currentUser,
  onOpenPdf,
  onRegisterPayment,
  onNavigateToInvoices,
  onShowToast,
}) => {
  // 0. Active Tab: 'conventions' (Répertoire & Gestion) vs 'claims' (Point des Dûs & Bordereaux)
  const [activeMainTab, setActiveMainTab] = useState<MainViewTab>('conventions');

  // Display mode for conventions: list (default) vs grid
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');

  // 1. Conventions & Insurance Filter State
  const [storedConventions, setStoredConventions] = useState<EnterpriseConvention[]>(() => getStoredConventions());

  useEffect(() => {
    const handleConvUpdate = () => {
      setStoredConventions(getStoredConventions());
    };
    window.addEventListener('app_conventions_updated', handleConvUpdate);
    return () => window.removeEventListener('app_conventions_updated', handleConvUpdate);
  }, []);

  // 2. Conventions Management States
  const [convTypeFilter, setConvTypeFilter] = useState<ConventionTypeFilter>('all');
  const [convSearchQuery, setConvSearchQuery] = useState<string>('');
  const [isConvModalOpen, setIsConvModalOpen] = useState<boolean>(false);
  const [editingConv, setEditingConv] = useState<EnterpriseConvention | null>(null);
  const [isNewConv, setIsNewConv] = useState<boolean>(true);
  const [convToDelete, setConvToDelete] = useState<EnterpriseConvention | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showInternalToast = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (onShowToast) {
      onShowToast(text, type);
    }
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Form state for Modal
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'enterprise' as 'enterprise' | 'insurance' | 'mutuelle',
    default_coverage_rate: 80,
    allowed_rates: [50, 70, 75, 80, 100],
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    city: 'Abidjan',
    notes: '',
    active: true,
  });

  // Open Create Modal
  const handleOpenCreateModal = (presetType: 'enterprise' | 'insurance' | 'mutuelle' = 'enterprise') => {
    const defaultCodePrefix = presetType === 'enterprise' ? 'CONV-ENT' : presetType === 'insurance' ? 'CONV-ASSUR' : 'CONV-MUT';
    const randNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: '',
      code: `${defaultCodePrefix}-${new Date().getFullYear()}-${randNum}`,
      type: presetType,
      default_coverage_rate: 80,
      allowed_rates: [50, 70, 75, 80, 100],
      contact_person: '',
      contact_phone: '+225 ',
      contact_email: '',
      address: '',
      city: 'Abidjan',
      notes: '',
      active: true,
    });
    setEditingConv(null);
    setIsNewConv(true);
    setIsConvModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (conv: EnterpriseConvention) => {
    setEditingConv(conv);
    setIsNewConv(false);
    setFormData({
      name: conv.name || conv.partner_name || '',
      code: conv.code || conv.convention_code || '',
      type: (conv.type === 'mutual' || conv.type === 'mutuelle' ? 'mutuelle' : conv.type === 'insurance' ? 'insurance' : 'enterprise') as any,
      default_coverage_rate: conv.default_coverage_rate || 80,
      allowed_rates: conv.allowed_rates || conv.supported_rates || [50, 70, 75, 80, 100],
      contact_person: conv.contact_person || '',
      contact_phone: conv.contact_phone || conv.phone || '',
      contact_email: conv.contact_email || conv.email || '',
      address: conv.address || '',
      city: conv.city || 'Abidjan',
      notes: conv.notes || '',
      active: conv.active !== false,
    });
    setIsConvModalOpen(true);
  };

  // Toggle rate in allowed rates array
  const handleToggleRate = (rate: number) => {
    setFormData((prev) => {
      const exists = prev.allowed_rates.includes(rate);
      const nextRates = exists ? prev.allowed_rates.filter((r) => r !== rate) : [...prev.allowed_rates, rate].sort((a, b) => a - b);
      return {
        ...prev,
        allowed_rates: nextRates.length > 0 ? nextRates : [prev.default_coverage_rate],
      };
    });
  };

  // Save Convention Modal
  const handleSaveConvention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showInternalToast('Veuillez renseigner le nom de la structure / organisme.', 'error');
      return;
    }

    const typeLabel =
      formData.type === 'enterprise'
        ? 'Société & Entreprise'
        : formData.type === 'insurance'
        ? "Compagnie d'Assurance"
        : 'Mutuelle & Couverture Santé';

    let updatedList: EnterpriseConvention[];

    if (isNewConv) {
      const newId = `conv_${Date.now()}`;
      const newConv: EnterpriseConvention = {
        id: newId,
        name: formData.name.trim(),
        code: formData.code.trim() || `CONV-${Date.now().toString().slice(-4)}`,
        type: formData.type,
        type_label: typeLabel,
        default_coverage_rate: Number(formData.default_coverage_rate) || 80,
        allowed_rates: formData.allowed_rates.length > 0 ? formData.allowed_rates : [Number(formData.default_coverage_rate) || 80],
        contact_person: formData.contact_person.trim(),
        contact_phone: formData.contact_phone.trim(),
        contact_email: formData.contact_email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim() || 'Abidjan',
        notes: formData.notes.trim(),
        active: formData.active,
        partner_name: formData.name.trim(),
        convention_code: formData.code.trim(),
      };
      updatedList = [newConv, ...storedConventions];
      showInternalToast(`La convention « ${newConv.name} » a été créée avec succès.`, 'success');
    } else if (editingConv) {
      updatedList = storedConventions.map((c) => {
        if (c.id === editingConv.id) {
          return {
            ...c,
            name: formData.name.trim(),
            code: formData.code.trim(),
            type: formData.type,
            type_label: typeLabel,
            default_coverage_rate: Number(formData.default_coverage_rate) || 80,
            allowed_rates: formData.allowed_rates.length > 0 ? formData.allowed_rates : [Number(formData.default_coverage_rate) || 80],
            contact_person: formData.contact_person.trim(),
            contact_phone: formData.contact_phone.trim(),
            contact_email: formData.contact_email.trim(),
            address: formData.address.trim(),
            city: formData.city.trim() || 'Abidjan',
            notes: formData.notes.trim(),
            active: formData.active,
            partner_name: formData.name.trim(),
            convention_code: formData.code.trim(),
          };
        }
        return c;
      });
      showInternalToast(`La convention « ${formData.name} » a été mise à jour.`, 'success');
    } else {
      return;
    }

    setStoredConventions(updatedList);
    saveStoredConventions(updatedList);
    setIsConvModalOpen(false);
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    const updatedList = storedConventions.map((c) => {
      if (c.id === id) {
        const nextState = !c.active;
        showInternalToast(`Convention ${c.name} ${nextState ? 'activée' : 'désactivée'}.`, 'info');
        return { ...c, active: nextState };
      }
      return c;
    });
    setStoredConventions(updatedList);
    saveStoredConventions(updatedList);
  };

  // Delete confirmation
  const handleConfirmDelete = () => {
    if (!convToDelete) return;
    const updatedList = storedConventions.filter((c) => c.id !== convToDelete.id);
    setStoredConventions(updatedList);
    saveStoredConventions(updatedList);
    showInternalToast(`La convention « ${convToDelete.name} » a été supprimée.`, 'warning');
    setConvToDelete(null);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous restaurer la liste des conventions et assurances par défaut ?')) {
      setStoredConventions(defaultEnterpriseConventions);
      saveStoredConventions(defaultEnterpriseConventions);
      showInternalToast('Les conventions partenaires par défaut ont été restaurées.', 'info');
    }
  };

  // 3. Claims & Settlement States
  const [selectedInsuranceName, setSelectedInsuranceName] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [claimsSearchQuery, setClaimsSearchQuery] = useState<string>('');
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

  // Filtered Conventions List
  const filteredConventions = useMemo(() => {
    return storedConventions.filter((c) => {
      const name = (c.name || c.partner_name || '').toLowerCase();
      const code = (c.code || c.convention_code || '').toLowerCase();
      const contact = (c.contact_person || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      const query = convSearchQuery.toLowerCase().trim();

      const matchSearch = !query || name.includes(query) || code.includes(query) || contact.includes(query) || city.includes(query);

      const normalizedType = c.type === 'mutual' || c.type === 'mutuelle' ? 'mutuelle' : c.type === 'insurance' ? 'insurance' : 'enterprise';
      const matchType = convTypeFilter === 'all' || normalizedType === convTypeFilter;

      return matchSearch && matchType;
    });
  }, [storedConventions, convSearchQuery, convTypeFilter]);

  // Discover all Unique Insurance Partners, Enterprise Conventions and Organismes
  const insurancePartners = useMemo(() => {
    const explicitInsurances = (partners || []).filter(
      (p) =>
        p.is_insurance === true ||
        p.partner_type === 'insurance' ||
        (p.name || '').toLowerCase().includes('assurance') ||
        (p.name || '').toLowerCase().includes('cmu') ||
        (p.name || '').toLowerCase().includes('mutuelle')
    );

    const knownNames = new Set<string>(explicitInsurances.map((p) => p.name));

    storedConventions.forEach((c) => {
      const n = c.name || c.partner_name;
      if (n && !knownNames.has(n)) {
        knownNames.add(n);
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

    return Array.from(knownNames)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr-FR'))
      .map((name) => {
        const matchedPartner = explicitInsurances.find((p) => p.name === name);
        const matchedConv = storedConventions.find((c) => c.name === name || c.partner_name === name);
        return {
          id: matchedConv?.id || matchedPartner?.id || name,
          name,
          convention_code: matchedConv?.code || matchedConv?.convention_code || matchedPartner?.convention_code || null,
          coverage_rate: matchedConv?.default_coverage_rate ?? matchedPartner?.default_coverage_rate ?? 80,
          phone: matchedConv?.contact_phone || matchedConv?.phone || matchedPartner?.phone || null,
          email: matchedConv?.contact_email || matchedConv?.email || matchedPartner?.email || null,
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

  // Extract and Standardize All Insurance Claim Moves
  const allClaimItems = useMemo(() => {
    return (moves || [])
      .filter((m) => m && m.state !== 'cancel')
      .map((m) => {
        const partner = (partners || []).find((p) => p.id === m.partner_id);

        const isInsuranceMove =
          m.insurance_enabled === true ||
          !!m.insurance_name ||
          partner?.is_insurance === true ||
          partner?.partner_type === 'insurance' ||
          !!partner?.insurance_name;

        if (!isInsuranceMove) return null;

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

        const policyNumber = m.insurance_policy_number || partner?.insurance_policy_number || partner?.convention_code || 'CONV-STD';
        const coverageRate = m.insurance_coverage_rate ?? partner?.insurance_coverage_rate ?? 80;

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

        let remainingInsuranceDue = 0;
        if (m.payment_state === 'paid') {
          remainingInsuranceDue = 0;
        } else if (m.payment_state === 'partial') {
          remainingInsuranceDue = m.amount_residual > 0 ? Math.min(m.amount_residual, insAmount) : insAmount;
        } else {
          remainingInsuranceDue = insAmount;
        }

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

  // Calculate total outstanding debt per insurance company for the dropdown badge
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

  // Filter by Insurance, Period, Status, and Search Query
  const filteredClaims = useMemo(() => {
    const todayStr = '2026-09-13';
    const thisMonthPrefix = '2026-09';
    const lastMonthPrefix = '2026-08';
    const weekStart = '2026-09-07';
    const weekEnd = '2026-09-13';

    return allClaimItems.filter((item) => {
      if (selectedInsuranceName !== 'all') {
        const itemInsLower = (item.insuranceName || '').toLowerCase();
        const selInsLower = selectedInsuranceName.toLowerCase();
        if (!itemInsLower.includes(selInsLower) && !selInsLower.includes(itemInsLower)) {
          return false;
        }
      }

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

      if (statusFilter === 'pending') {
        if (item.remainingDue <= 0 && item.paymentState === 'paid') return false;
      } else if (statusFilter === 'paid') {
        if (item.paymentState !== 'paid') return false;
      }

      if (claimsSearchQuery.trim()) {
        const q = claimsSearchQuery.toLowerCase().trim();
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
  }, [allClaimItems, selectedInsuranceName, periodFilter, statusFilter, claimsSearchQuery, customStartDate, customEndDate]);

  // Financial Totals
  const totals = useMemo(() => {
    let totalInvoiced = 0;
    let totalInsuranceAmount = 0;
    let totalClientShare = 0;
    let totalRemainingDue = 0;
    let totalPaidInsurance = 0;

    filteredClaims.forEach((c) => {
      totalInvoiced += c.totalAmount;
      totalInsuranceAmount += c.insuranceAmount;
      totalClientShare += c.clientShare;
      totalRemainingDue += c.remainingDue;
      totalPaidInsurance += c.insuranceAmount - c.remainingDue;
    });

    return {
      totalInvoiced,
      totalInsuranceAmount,
      totalClientShare,
      totalRemainingDue,
      totalPaidInsurance,
      count: filteredClaims.length,
    };
  }, [filteredClaims]);

  // Statistics for Conventions tab
  const convStats = useMemo(() => {
    const total = storedConventions.length;
    const enterprises = storedConventions.filter((c) => c.type === 'enterprise').length;
    const insurances = storedConventions.filter((c) => c.type === 'insurance').length;
    const mutuelles = storedConventions.filter((c) => c.type === 'mutuelle' || c.type === 'mutual').length;
    const activeCount = storedConventions.filter((c) => c.active !== false).length;
    const avgRate = total > 0 ? Math.round(storedConventions.reduce((sum, c) => sum + (c.default_coverage_rate || 80), 0) / total) : 80;

    return { total, enterprises, insurances, mutuelles, activeCount, avgRate };
  }, [storedConventions]);

  // Switch to claims tab and filter for this convention
  const handleViewClaimsForConvention = (convName: string) => {
    setSelectedInsuranceName(convName);
    setActiveMainTab('claims');
  };

  // Export CSV
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
      'Actes & Examens',
      'Montant Total (FCFA)',
      'Taux Couverture (%)',
      'Ticket Modérateur Patient (FCFA)',
      'Part Assurance Dûe (FCFA)',
      'Solde Restant Dû (FCFA)',
      'Statut Règlement',
    ];

    const rows = filteredClaims.map((item, idx) => {
      const examNames = item.lines.map((l) => l.name).filter(Boolean).join(' + ') || 'Actes médicaux / examens';
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
        `"${item.paymentState === 'paid' ? 'Soldé' : item.remainingDue > 0 ? 'En Attente' : 'Partiel'}"`,
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

  // Open Transfer Modal
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
      showInternalToast(`Virement de ${formatFCFA(allocated)} lettré avec succès.`, 'success');
    } catch (err) {
      console.error('Error settling transfer:', err);
      showInternalToast('Erreur lors du lettrage du virement.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Helper for type rendering
  const renderTypeBadge = (type: string) => {
    const isEnt = type === 'enterprise';
    const isMut = type === 'mutuelle' || type === 'mutual';

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
          isEnt
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : isMut
            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            : 'bg-sky-50 text-sky-800 border border-sky-200'
        }`}
      >
        {isEnt ? (
          <Building2 className="w-3 h-3 text-amber-700" />
        ) : isMut ? (
          <Landmark className="w-3 h-3 text-indigo-700" />
        ) : (
          <ShieldCheck className="w-3 h-3 text-sky-700" />
        )}
        <span>{isEnt ? 'Entreprise' : isMut ? 'Mutuelle / CMU' : 'Assurance'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast feedback */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-md shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-sky-50 text-sky-900 border-sky-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <Info className="w-4 h-4 text-sky-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-white rounded-md p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Assurances &amp; Conventions Partenaires
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Gestion des tiers-payeurs, entreprises conventionnées, taux de couverture et bordereaux de facturation certifiés.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeMainTab === 'conventions' ? (
            <>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5"
                title="Restaurer la liste par défaut"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaurer Défauts</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('enterprise')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle Convention / Assurance</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsPrintSlipMode(!isPrintSlipMode)}
                className={`flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-md border transition cursor-pointer ${
                  isPrintSlipMode
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-4 h-4 text-amber-600" />
                <span>{isPrintSlipMode ? 'Quitter Vue Impression' : 'Imprimer Bordereau'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exporter CSV</span>
              </button>

              {totals.totalRemainingDue > 0 && onRegisterPayment && (
                <button
                  type="button"
                  onClick={handleOpenTransferModal}
                  className="flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>Lettrer un Virement</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-bold bg-white p-2 rounded-md border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveMainTab('conventions')}
          className={`py-2 px-3.5 rounded-md transition flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'conventions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Répertoire &amp; Conventions Partenaires</span>
          <span
            className={`text-[11px] font-black px-1.5 py-0.5 rounded ${
              activeMainTab === 'conventions' ? 'bg-slate-800 text-sky-300' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {storedConventions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('claims')}
          className={`py-2 px-3.5 rounded-md transition flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'claims'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Point des Dûs &amp; Bordereaux Tiers-Payant</span>
          {totals.totalRemainingDue > 0 && (
            <span
              className={`text-[11px] font-black px-1.5 py-0.5 rounded ${
                activeMainTab === 'claims' ? 'bg-rose-900 text-rose-200' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {formatFCFA(totals.totalRemainingDue)}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REPERTOIRE & GESTION DES CONVENTIONS & ASSURANCES                 */}
      {/* ========================================================================= */}
      {activeMainTab === 'conventions' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Overview Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Conventions</p>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{convStats.total}</p>
              <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">{convStats.activeCount} actives</span>
            </div>

            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entreprises</p>
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{convStats.enterprises}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Prise en charge directe</span>
            </div>

            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assurances</p>
                <ShieldCheck className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{convStats.insurances}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Tiers-payeur agréé</span>
            </div>

            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mutuelles &amp; CMU</p>
                <Landmark className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{convStats.mutuelles}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Couverture solidaire</span>
            </div>

            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taux Moyen</p>
                <BadgePercent className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-sky-700 mt-1">{convStats.avgRate}%</p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Prise en charge standard</span>
            </div>
          </div>

          {/* Filter Bar & View Toggle */}
          <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setConvTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border ${
                    convTypeFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Toutes ({storedConventions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConvTypeFilter('enterprise')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    convTypeFilter === 'enterprise'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${convTypeFilter === 'enterprise' ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span>Sociétés &amp; Entreprises</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${convTypeFilter === 'enterprise' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                    {convStats.enterprises}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setConvTypeFilter('insurance')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    convTypeFilter === 'insurance'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${convTypeFilter === 'insurance' ? 'text-sky-400' : 'text-sky-600'}`} />
                  <span>Compagnies d&apos;Assurance</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${convTypeFilter === 'insurance' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                    {convStats.insurances}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setConvTypeFilter('mutuelle')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    convTypeFilter === 'mutuelle'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Landmark className={`w-3.5 h-3.5 ${convTypeFilter === 'mutuelle' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span>Mutuelles &amp; CMU</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${convTypeFilter === 'mutuelle' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                    {convStats.mutuelles}
                  </span>
                </button>
              </div>

              {/* Search Bar & View Mode */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher (Nom, Code, Contact, Ville)..."
                    value={convSearchQuery}
                    onChange={(e) => setConvSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md pl-9 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                  {convSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setConvSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Switcher: List vs Grid */}
                <div className="flex items-center border border-slate-300 rounded-md p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('list')}
                    className={`p-1.5 rounded text-xs font-bold transition cursor-pointer ${
                      displayMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Présentation sous forme de liste (Tableau)"
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('grid')}
                    className={`p-1.5 rounded text-xs font-bold transition cursor-pointer ${
                      displayMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Présentation sous forme de cartes"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRESENTATION EN LISTE (TABLEAU) - DEFAULT                                 */}
          {/* ========================================================================= */}
          {filteredConventions.length === 0 ? (
            <div className="bg-white rounded-md p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Aucune structure conventionnée trouvée</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Aucun résultat ne correspond à vos critères de recherche. Vous pouvez créer une nouvelle convention ou réinitialiser vos filtres.
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('enterprise')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer une Structure Partenaire</span>
              </button>
            </div>
          ) : displayMode === 'list' ? (
            <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3.5">Structure / Organisme</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3 font-mono">Code Convention</th>
                      <th className="py-3 px-3 text-center">Taux Standard</th>
                      <th className="py-3 px-3">Taux Autorisés</th>
                      <th className="py-3 px-3">Contact &amp; Coordonnées</th>
                      <th className="py-3 px-3">Ville</th>
                      <th className="py-3 px-3 text-right">Créance en Attente</th>
                      <th className="py-3 px-3 text-center">Statut</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredConventions.map((conv) => {
                      const debtInfo = debtPerInsurance.get(conv.name || conv.partner_name || '');
                      const hasDebt = (debtInfo?.totalDue || 0) > 0;
                      const allowedRates = conv.allowed_rates || conv.supported_rates || [conv.default_coverage_rate || 80];

                      return (
                        <tr
                          key={conv.id}
                          className={`hover:bg-slate-50/80 transition ${
                            conv.active === false ? 'opacity-60 bg-slate-50/40' : ''
                          }`}
                        >
                          {/* Name */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900">{conv.name || conv.partner_name}</div>
                            {conv.notes && (
                              <div className="text-[10px] text-slate-500 line-clamp-1 italic max-w-xs" title={conv.notes}>
                                {conv.notes}
                              </div>
                            )}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-3">{renderTypeBadge(conv.type || 'enterprise')}</td>

                          {/* Code */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              {conv.code || conv.convention_code || 'CONV-STD'}
                            </span>
                          </td>

                          {/* Primary Rate */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                              <BadgePercent className="w-3 h-3 text-sky-600" />
                              {conv.default_coverage_rate || 80}%
                            </span>
                          </td>

                          {/* Allowed Rates */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[140px]">
                              {allowedRates.map((r) => (
                                <span
                                  key={r}
                                  className="text-[10px] font-bold bg-slate-50 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                                >
                                  {r}%
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5 text-[11px]">
                              {conv.contact_person && (
                                <div className="font-semibold text-slate-900 truncate max-w-[160px]">
                                  {conv.contact_person}
                                </div>
                              )}
                              {(conv.contact_phone || conv.phone) && (
                                <div className="flex items-center gap-1 text-slate-600 font-mono">
                                  <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{conv.contact_phone || conv.phone}</span>
                                </div>
                              )}
                              {(conv.contact_email || conv.email) && (
                                <div className="flex items-center gap-1 text-slate-500 truncate max-w-[160px]">
                                  <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{conv.contact_email || conv.email}</span>
                                </div>
                              )}
                              {!conv.contact_person && !conv.contact_phone && !conv.phone && (
                                <span className="text-slate-400 italic">Non renseigné</span>
                              )}
                            </div>
                          </td>

                          {/* City */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 text-slate-600 text-xs">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{conv.city || 'Abidjan'}</span>
                            </div>
                          </td>

                          {/* Pending Debt */}
                          <td className="py-3 px-3 text-right">
                            {hasDebt ? (
                              <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                                {formatFCFA(debtInfo!.totalDue)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-[11px]">0 FCFA (À jour)</span>
                            )}
                          </td>

                          {/* Active Toggle Status */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(conv.id)}
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition border ${
                                conv.active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                              }`}
                              title="Cliquer pour basculer le statut Actif/Inactif"
                            >
                              {conv.active !== false ? 'Actif' : 'Inactif'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleViewClaimsForConvention(conv.name || conv.partner_name || '')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Voir les dossiers et factures associés"
                              >
                                <FileSpreadsheet className="w-3 h-3 text-slate-600" />
                                <span>Voir Dûs</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(conv)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Modifier la convention"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setConvToDelete(conv)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Supprimer la convention"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards presentation (alternative view) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConventions.map((conv) => {
                const debtInfo = debtPerInsurance.get(conv.name || conv.partner_name || '');
                const hasDebt = (debtInfo?.totalDue || 0) > 0;

                return (
                  <div
                    key={conv.id}
                    className={`bg-white rounded-md border p-4 shadow-xs flex flex-col justify-between space-y-3 transition hover:shadow-sm ${
                      conv.active === false ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {renderTypeBadge(conv.type || 'enterprise')}
                          <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1" title={conv.name || conv.partner_name}>
                            {conv.name || conv.partner_name}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(conv.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition border ${
                            conv.active !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          {conv.active !== false ? 'Actif' : 'Inactif'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Code</span>
                          <span className="font-mono font-bold text-slate-800 truncate block">
                            {conv.code || conv.convention_code || 'CONV-STD'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Taux Couverture</span>
                          <span className="font-black text-slate-900 flex items-center gap-1">
                            <BadgePercent className="w-3.5 h-3.5 text-sky-600" />
                            {conv.default_coverage_rate || 80}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                        {conv.contact_person && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{conv.contact_person}</span>
                          </div>
                        )}
                        {(conv.contact_phone || conv.phone) && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{conv.contact_phone || conv.phone}</span>
                          </div>
                        )}
                      </div>

                      {hasDebt && (
                        <div className="bg-rose-50 border border-rose-200 p-2 rounded flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-rose-800">Créance en attente :</span>
                          <span className="font-black text-rose-900">{formatFCFA(debtInfo!.totalDue)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleViewClaimsForConvention(conv.name || conv.partner_name || '')}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-2.5 rounded transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                        <span>Voir Dûs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(conv)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConvToDelete(conv)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: POINT DES DUS & BORDEREAUX DE FACTURATION TIERS-PAYANT             */}
      {/* ========================================================================= */}
      {activeMainTab === 'claims' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Organisme Selector Dropdown */}
          <div className="bg-white rounded-md p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-xl">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-700" />
                  Organisme Tiers-Payant / Assurance Conventionnée ({insurancePartners.length})
                </label>
                <div className="relative">
                  <select
                    value={selectedInsuranceName}
                    onChange={(e) => setSelectedInsuranceName(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 text-xs font-bold py-2 pl-3 pr-10 rounded-md border border-slate-300 focus:outline-none focus:border-slate-800 transition cursor-pointer appearance-none"
                  >
                    <option value="all">Toutes les Assurances &amp; Entreprises Conventionnées (Vue Globale)</option>
                    <optgroup label="Structures Partenaires &amp; Assurances">
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

              {/* Selected Structure Info */}
              <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
                {selectedPartnerDetails ? (
                  <>
                    {selectedPartnerDetails.convention_code && (
                      <div className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Code :</span>
                        <span className="font-mono font-bold text-slate-900">{selectedPartnerDetails.convention_code}</span>
                      </div>
                    )}
                    <div className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                      <BadgePercent className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Taux :</span>
                      <span className="font-bold text-slate-900">{selectedPartnerDetails.coverage_rate}%</span>
                    </div>
                    {totals.totalRemainingDue > 0 && (
                      <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Dû : {formatFCFA(totals.totalRemainingDue)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium">Vue Consolidée de toutes les créances</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PERIOD & STATUS FILTERS */}
          <div className="bg-white rounded-md p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md">
                {[
                  { id: 'today', label: "Aujourd'hui" },
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
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                        active ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-md">
                {[
                  { id: 'pending', label: 'En Attente de Règlement' },
                  { id: 'paid', label: 'Soldées Uniquement' },
                  { id: 'all', label: 'Toutes les Factures' },
                ].map((s) => {
                  const active = statusFilter === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatusFilter(s.id as StatusFilter)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                        active ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Range & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              {periodFilter === 'custom' && (
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Du</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-bold"
                  />
                  <span className="text-slate-500">Au</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-bold"
                  />
                </div>
              )}

              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer par patient, NDM, N° facture, police..."
                  value={claimsSearchQuery}
                  onChange={(e) => setClaimsSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Facturé</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatFCFA(totals.totalInvoiced)}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">{totals.count} dossiers</span>
            </div>
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Part Assurance Dûe</p>
              <p className="text-xl font-black text-sky-700 mt-1">{formatFCFA(totals.totalInsuranceAmount)}</p>
              <span className="text-[10px] text-sky-600 font-medium mt-0.5 block">Prise en charge</span>
            </div>
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket Modérateur</p>
              <p className="text-xl font-black text-slate-700 mt-1">{formatFCFA(totals.totalClientShare)}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Payé par patients</span>
            </div>
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Règlements Encaissés</p>
              <p className="text-xl font-black text-emerald-700 mt-1">{formatFCFA(totals.totalPaidInsurance)}</p>
              <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Virements reçus</span>
            </div>
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Solde Restant Dû</p>
              <p className="text-xl font-black text-rose-700 mt-1">{formatFCFA(totals.totalRemainingDue)}</p>
              <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">À recouvrer</span>
            </div>
          </div>

          {/* CLAIMS TABLE */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Relevé Détaillé des Créances ({filteredClaims.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600">
                Solde Dû Total : <strong className="text-rose-700">{formatFCFA(totals.totalRemainingDue)}</strong>
              </span>
            </div>

            {filteredClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">Aucune facture trouvée pour les critères sélectionnés.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 font-mono">N° Facture</th>
                      <th className="py-3 px-3">Patient / NDM</th>
                      <th className="py-3 px-3">Organisme &amp; Police</th>
                      <th className="py-3 px-3 text-right">Montant Total</th>
                      <th className="py-3 px-3 text-center">Taux</th>
                      <th className="py-3 px-3 text-right">Part Assurance</th>
                      <th className="py-3 px-3 text-right text-rose-700">Reste Dû</th>
                      <th className="py-3 px-3 text-center">Statut</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredClaims.map((item) => {
                      const isExpanded = expandedMoveId === item.moveId;
                      return (
                        <React.Fragment key={item.moveId}>
                          <tr className={`hover:bg-slate-50/80 transition ${isExpanded ? 'bg-slate-50' : ''}`}>
                            <td className="py-3 px-3 font-mono text-slate-600">{item.invoiceDate.split(' ')[0]}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.invoiceNumber}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.patientName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.patientNdm}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.insuranceName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.policyNumber}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-bold">{formatFCFA(item.totalAmount)}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[10px]">
                                {item.coverageRate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-sky-700">{formatFCFA(item.insuranceAmount)}</td>
                            <td className="py-3 px-3 text-right font-black text-rose-700">
                              {item.remainingDue > 0 ? formatFCFA(item.remainingDue) : <span className="text-emerald-600">Soldé</span>}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.paymentState === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : item.remainingDue > 0
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {item.paymentState === 'paid' ? 'Soldé' : item.remainingDue > 0 ? 'En Attente' : 'Partiel'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {onOpenPdf && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPdf(item.move)}
                                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                                    title="Voir PDF"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedMoveId(isExpanded ? null : item.moveId)}
                                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
                                  title="Détails des actes"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90">
                              <td colSpan={10} className="p-4">
                                <div className="bg-white p-3.5 rounded-md border border-slate-200 space-y-2">
                                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                    Détail des Actes &amp; Prestations Facturées :
                                  </p>
                                  <div className="divide-y divide-slate-100">
                                    {item.lines.map((l, i) => (
                                      <div key={i} className="py-1.5 flex justify-between text-xs">
                                        <span className="font-medium text-slate-800">
                                          {l.quantity || 1}x {l.name}
                                        </span>
                                        <span className="font-mono font-bold text-slate-900">{formatFCFA(l.price_total || l.price_unit || 0)}</span>
                                      </div>
                                    ))}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CONVENTION (ALIGNED WITH EXISTING FORMS & SIMPLE)   */}
      {/* ========================================================================= */}
      {isConvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Simple Clean Header matching standard app forms */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isNewConv ? 'Nouvelle Structure Partenaire / Convention' : 'Modifier la Convention Partenaire'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConvModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConvention} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Type selector (clean buttons with Lucide icons, no emojis) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Type d&apos;Organisme *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'enterprise', label: 'Entreprise Conventionnée', icon: Building2, sub: 'Employeur / Société' },
                    { id: 'insurance', label: "Compagnie d'Assurance", icon: ShieldCheck, sub: 'Tiers-Payeur Agréé' },
                    { id: 'mutuelle', label: 'Mutuelle & CMU', icon: Landmark, sub: 'Couverture Santé Solidaire' },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSelected = formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: t.id as any,
                          }))
                        }
                        className={`p-3 rounded-md border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-600'}`} />
                          <span>{t.label}</span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {t.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nom de la Structure / Compagnie *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Société Ivoirienne de Raffinage (SIR), SUNU Assurances..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Code Convention
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CONV-SIR-2026, CONV-AXA-2026..."
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              {/* Default coverage rate & Allowed rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Taux Prise en Charge par Défaut (%) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      required
                      value={formData.default_coverage_rate}
                      onChange={(e) => setFormData({ ...formData, default_coverage_rate: Number(e.target.value) })}
                      className="w-24 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                    <span className="text-xs font-medium text-slate-600">% (ex: 80% employeur / assurance)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Taux Autorisés pour cette Convention
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[30, 50, 70, 75, 80, 85, 90, 100].map((rate) => {
                      const isSelected = formData.allowed_rates.includes(rate);
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleToggleRate(rate)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition border cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {rate}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Contact Référent / DRH
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: M. Jean Kouassi (Directeur RH)"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="+225 27 20 00 00"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Professionnel
                  </label>
                  <input
                    type="email"
                    placeholder="tierspayeur@entreprise.ci"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              {/* Address & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Adresse Géographique
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Immeuble Woodin Center, Avenue Noguès, Plateau"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Abidjan"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              {/* Notes / Rules */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Modalités de Prise en Charge / Notes Internes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Bon de prise en charge original obligatoire. Accord préalable requis pour actes > 50 000 FCFA. Règlement mensuel groupé..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 transition"
                />
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="active_conv"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="active_conv" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Convention Active (Disponible dans la facturation et les admissions)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConvModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-md transition cursor-pointer text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isNewConv ? 'Créer la Convention' : 'Enregistrer les Modifications'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {convToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-900">Supprimer la Convention ?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Êtes-vous sûr de vouloir supprimer la structure{' '}
                <strong className="text-slate-900">« {convToDelete.name || convToDelete.partner_name} »</strong> ?
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-md text-xs transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-xs transition shadow-xs cursor-pointer"
              >
                Confirmer la Suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SETTLEMENT / VIREMENT PAYMENT                                      */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Lettrer un Virement Bancaire Tiers-Payant</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Organisme Destinataire</span>
                <p className="font-bold text-slate-900">{selectedInsuranceName}</p>
                <p className="text-slate-500 font-medium">
                  Créances sélectionnées : {filteredClaims.filter((c) => c.remainingDue > 0).length} factures
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Montant Reçu du Virement (FCFA)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm font-black focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Référence du Virement / Bordereau
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono font-bold focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Date de Réception
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-bold focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-md transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSubmittingPayment || transferAmount <= 0}
                  onClick={handleExecuteTransferSettlement}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Valider le Lettrage</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
