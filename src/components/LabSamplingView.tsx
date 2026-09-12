import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Printer,
  X,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  Database,
  ArrowRight,
  RefreshCw,
  AlertOctagon,
  UserCheck,
  Sparkles,
  Bot
} from 'lucide-react';
import { LabExamOrder, ResPartner, ResUser, CompanySettings, LabResultStatus } from '../types';
import { formatFCFA } from '../lib/formatters';
import { PaginationControls } from './PaginationControls';
import { Barcode, getBarcodeSvgString } from './Barcode';
import { printElement } from '../lib/printUtils';
import { decodeScannerInput } from '../lib/scannerDecoder';

interface LabSamplingViewProps {
  labOrders: LabExamOrder[];
  partners: ResPartner[];
  currentUser: ResUser | null;
  company: CompanySettings;
  onSaveLabOrder: (order: Partial<LabExamOrder>) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const LabSamplingView: React.FC<LabSamplingViewProps> = ({
  labOrders = [],
  partners = [],
  currentUser,
  company,
  onSaveLabOrder,
  onRefreshData,
}) => {
  // Filters & State
  const [selectedNdm, setSelectedNdm] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mainSearch, setMainSearch] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | LabResultStatus>('all');
  const [groupByField, setGroupByField] = useState<'none' | 'department' | 'partner'>('none');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
  const [printModalOrders, setPrintModalOrders] = useState<LabExamOrder[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company.default_page_size || 50);

  // New Workflow States
  const [workflowLogs, setWorkflowLogs] = useState<any[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [showWorkflowDashboard, setShowWorkflowDashboard] = useState(false);
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);

  const fetchWorkflowData = async () => {
    try {
      const logRes = await fetch('/api/lab-workflow-logs');
      if (logRes.ok) {
        const data = await logRes.json();
        setWorkflowLogs(data);
      }
      const queueRes = await fetch('/api/lab-notifications');
      if (queueRes.ok) {
        const data = await queueRes.json();
        setNotificationQueue(data);
      }
    } catch (e) {
      console.error('Error fetching workflow metadata:', e);
    }
  };

  useEffect(() => {
    fetchWorkflowData();
    const interval = setInterval(fetchWorkflowData, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchWorkflowData();
  }, [labOrders]);

  // LIMS Auto-Pilot Robot Effect
  useEffect(() => {
    if (!isAutoPilotOn) return;
    if (labOrders.length === 0) return;

    // Find first order that can be advanced
    const order = labOrders.find(o => 
      ['pending_sampling', 'in_progress', 'accepted', 'results_entered', 'saisi', 'valide_tech', 'validated', 'valide_biologiste'].includes(o.status)
    );

    if (!order) return;

    const timer = setTimeout(() => {
      if (order.status === 'pending_sampling') {
        handleValidateSingle(order);
      } else if (order.status === 'in_progress') {
        handleAdvanceWorkflow(order.id, 'accepted', 'Robot LIMS', 'Auto-réception des tubes sur le plateau');
      } else if (order.status === 'accepted') {
        handleSimulateAutomateImport(order.id);
      } else if (order.status === 'results_entered' || order.status === 'saisi') {
        handleAdvanceWorkflow(order.id, 'valide_tech', 'Moteur LIMS (Auto-Validation)', 'Validation technique automatique (Absence de Flags Sysmex)');
      } else if (order.status === 'valide_tech') {
        handleSignBiologist(order.id);
      } else if (order.status === 'validated' || order.status === 'valide_biologiste') {
        handleSendPatient(order.id);
      }
    }, 1500); // 1.5 seconds between steps for nice visual pacing

    return () => clearTimeout(timer);
  }, [isAutoPilotOn, labOrders]);

  // New manual sample state
  const [newPartnerId, setNewPartnerId] = useState<number>(partners[0]?.id || 1);
  const [newDepartment, setNewDepartment] = useState('Biochimie');
  const [newExams, setNewExams] = useState<string>('Glycémie, Urée, Créatinine');
  const [newPrescriber, setNewPrescriber] = useState('Dr. Koffi');

  // Format Date beautifully
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Status mapping
  const getStatusLabelAndStyle = (status: LabResultStatus) => {
    switch (status) {
      case 'pending_sampling':
        return { label: 'Initié (Payé)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-200' };
      case 'in_progress':
        return { label: 'Prélevé', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-indigo-200' };
      case 'accepted':
        return { label: 'Réceptionné', bg: 'bg-teal-50 text-teal-700 border-teal-200', border: 'border-teal-200' };
      case 'results_entered':
      case 'saisi':
        return { label: 'Saisi', bg: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-200' };
      case 'valide_tech':
        return { label: 'Valide Tech', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', border: 'border-cyan-200' };
      case 'validated':
      case 'valide_biologiste':
        return { label: 'Validé Bio', bg: 'bg-purple-50 text-purple-700 border-purple-200', border: 'border-purple-200' };
      case 'envoye':
        return { label: 'Rendu', bg: 'bg-slate-100 text-slate-700 border-slate-300', border: 'border-slate-300' };
      case 'rejected':
        return { label: 'Rejeté', bg: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-rose-200' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200', border: 'border-slate-200' };
    }
  };

  // Helper to generate an Odoo-like SID or barcodes
  const getSID = (order: LabExamOrder) => {
    // Generate code from department and order id
    const deptPrefix = (order.department || 'GEN')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')[0]
      .substring(0, 4);
    
    const paddedId = String(order.id).padStart(5, '0');
    return `${deptPrefix}-${paddedId}`;
  };

  // Extract list of all unique NDMs in lab orders with their counts for the left sidebar
  const ndmList = React.useMemo(() => {
    const counts: { [ndm: string]: { name: string; count: number } } = {};
    labOrders.forEach(o => {
      // Find patient NDM
      const partner = partners.find(p => p.id === o.partner_id);
      const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
      if (!counts[ndm]) {
        counts[ndm] = {
          name: o.partner_name,
          count: 0
        };
      }
      counts[ndm].count++;
    });

    return Object.entries(counts)
      .map(([ndm, data]) => ({
        ndm,
        ...data
      }))
      .filter(item => 
        !sidebarSearch || 
        item.ndm.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        item.name.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
      .sort((a, b) => b.count - a.count);
  }, [labOrders, partners, sidebarSearch]);

  // Main list filters
  const filteredOrders = React.useMemo(() => {
    return labOrders
      .filter(o => {
        // 1. Sidebar NDM filter
        if (selectedNdm) {
          const partner = partners.find(p => p.id === o.partner_id);
          const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
          if (ndm !== selectedNdm) return false;
        }

        // 2. Status Pill Filter
        if (activeStatusFilter !== 'all' && o.status !== activeStatusFilter) {
          return false;
        }

        // 3. Search Bar Filter
        if (mainSearch.trim()) {
          const query = mainSearch.toLowerCase();
          const matchesName = o.partner_name.toLowerCase().includes(query);
          const matchesSid = getSID(o).toLowerCase().includes(query);
          const matchesExams = o.exam_names.some(e => e.toLowerCase().includes(query));
          const matchesDept = o.department.toLowerCase().includes(query);
          const partner = partners.find(p => p.id === o.partner_id);
          const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
          const matchesNdm = ndm.toLowerCase().includes(query);
          
          if (!matchesName && !matchesSid && !matchesExams && !matchesDept && !matchesNdm) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.order_date || a.created_at || 0).getTime();
        const dateB = new Date(b.order_date || b.created_at || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [labOrders, partners, selectedNdm, activeStatusFilter, mainSearch]);

  // Mass action handlers
  const handleMassValidateSampling = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsProcessing(true);
    try {
      const ordersToPrint: LabExamOrder[] = [];
      for (const id of selectedOrderIds) {
        const order = labOrders.find(o => o.id === id);
        if (order && order.status === 'pending_sampling') {
          await onSaveLabOrder({
            id: order.id,
            status: 'in_progress',
            sampling_date: new Date().toISOString(),
            technician_name: currentUser?.name || 'Technicien de Laboratoire',
            technician_id: currentUser?.id
          });
          ordersToPrint.push(order);
        }
      }
      setSelectedOrderIds([]);
      if (ordersToPrint.length > 0) {
        setPrintModalOrders(ordersToPrint);
        setShowPrintLabelModal(true);
      }
      if (onRefreshData) await onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateSingle = async (order: LabExamOrder) => {
    try {
      setIsProcessing(true);
      await onSaveLabOrder({
        id: order.id,
        status: 'in_progress',
        sampling_date: new Date().toISOString(),
        technician_name: currentUser?.name || 'Technicien de Laboratoire',
        technician_id: currentUser?.id
      });
      // Automatically open label printing modal
      setPrintModalOrders([order]);
      setShowPrintLabelModal(true);
      if (onRefreshData) await onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMassRejectSampling = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsProcessing(true);
    try {
      for (const id of selectedOrderIds) {
        const order = labOrders.find(o => o.id === id);
        if (order) {
          await onSaveLabOrder({
            id: order.id,
            status: 'rejected'
          });
        }
      }
      setSelectedOrderIds([]);
      if (onRefreshData) await onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- WORKFLOW API CALL HANDLERS ---
  const handleAdvanceWorkflow = async (orderId: number, nextStatus: string, actorName: string, comment: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/lab-orders/${orderId}/advance-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_status: nextStatus, actor_name: actorName, comment })
      });
      if (res.ok && onRefreshData) {
        await onRefreshData();
        await fetchWorkflowData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateAutomateImport = async (orderId: number) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/lab-orders/${orderId}/simulate-automate-import`, {
        method: 'POST'
      });
      if (res.ok && onRefreshData) {
        await onRefreshData();
        await fetchWorkflowData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignBiologist = async (orderId: number) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/lab-orders/${orderId}/sign-biologist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor: currentUser?.name || 'Dr. Mohamed Mandé', doctor_id: currentUser?.id })
      });
      if (res.ok && onRefreshData) {
        await onRefreshData();
        await fetchWorkflowData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendPatient = async (orderId: number) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/lab-orders/${orderId}/send-patient`, {
        method: 'POST'
      });
      if (res.ok && onRefreshData) {
        await onRefreshData();
        await fetchWorkflowData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTubeInfo = (order: LabExamOrder) => {
    const dept = (order.department || '').toLowerCase();
    const exams = (order.exam_names || []).map(e => e.toLowerCase());

    if (dept.includes('coag') || exams.some(e => e.includes('tp') || e.includes('tca') || e.includes('fibrinogène') || e.includes('coag'))) {
      return { name: 'Tube Citrate Bleu (Plasma)', color: '#3b82f6' };
    }
    if (dept.includes('hémat') || dept.includes('hemat') || dept.includes('hemo') || exams.some(e => e.includes('nfs') || e.includes('hémogramme') || e.includes('hemogramme') || e.includes('goutte') || e.includes('groupe'))) {
      return { name: 'Tube EDTA Violet (Sang total)', color: '#a855f7' };
    }
    if (exams.some(e => e.includes('glycémie') || e.includes('glycemie'))) {
      return { name: 'Tube Fluorure Gris (Fluorure)', color: '#6b7280' };
    }
    if (dept.includes('parasit') || dept.includes('bactér') || dept.includes('micro') || dept.includes('copro') || exams.some(e => e.includes('selle') || e.includes('urine') || e.includes('ecbu') || e.includes('parasite'))) {
      return { name: 'Flacon Standard (Urine/Selles)', color: '#eab308' };
    }
    return { name: 'Tube Sec Rouge (Sérum)', color: '#ef4444' };
  };

  const handlePrintLabels = (ordersToPrint: LabExamOrder[]) => {
    // Create a temporary container
    const container = document.createElement('div');
    container.id = 'thermal-labels-print-container';
    
    // Add custom thermal CSS overrides directly in the printed container!
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
      @media print {
        @page {
          size: 50mm 30mm !important;
          margin: 0 !important;
        }
        html, body {
          width: 50mm !important;
          height: 30mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        /* Override default app-global-print-target padding */
        #app-global-print-target {
          padding: 0 !important;
          margin: 0 !important;
          width: 50mm !important;
          height: 30mm !important;
        }
        .label-container {
          width: 50mm !important;
          height: 30mm !important;
          padding: 2mm !important;
          box-sizing: border-box !important;
          border: none !important;
          margin: 0 !important;
          page-break-inside: avoid !important;
          page-break-after: always !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          background: #ffffff !important;
          overflow: hidden !important;
        }
      }
    `;
    container.appendChild(styleBlock);

    // Now append each label
    ordersToPrint.forEach(o => {
      const partner = partners.find(p => p.id === o.partner_id);
      const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
      const sid = getSID(o);
      const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR');
      const tubeInfo = getTubeInfo(o);
      const barcodeSvg = getBarcodeSvgString(sid, 30, 1.1);

      const labelDiv = document.createElement('div');
      labelDiv.className = 'label-container';
      labelDiv.style.width = '50mm';
      labelDiv.style.height = '30mm';
      labelDiv.style.padding = '2mm';
      labelDiv.style.boxSizing = 'border-box';
      labelDiv.style.fontFamily = 'sans-serif';
      labelDiv.style.display = 'flex';
      labelDiv.style.flexDirection = 'column';
      labelDiv.style.justifyContent = 'space-between';
      labelDiv.style.background = 'white';
      labelDiv.style.pageBreakAfter = 'always';

      labelDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding-bottom: 1px; margin-bottom: 2px;">
          <span style="font-size: 8px; font-weight: bold; text-transform: uppercase;">LABORATOIRE</span>
          <span style="font-size: 7px; color: #555;">${dateStr}</span>
        </div>
        <div style="font-size: 9px; font-weight: bold; line-height: 1.1; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${o.partner_name}
        </div>
        <div style="font-size: 7.5px; color: #444; margin-bottom: 2px;">
          NDM: <strong style="font-size: 8.5px;">${ndm}</strong>
        </div>
        <div style="font-size: 7.5px; margin-bottom: 2px; font-weight: 500; display: flex; align-items: center; gap: 4px;">
          <svg width="8" height="8" style="min-width: 8px;">
            <circle cx="4" cy="4" r="3.5" fill="${tubeInfo.color}" stroke="black" stroke-width="0.5" />
          </svg>
          <span style="font-size: 8px; font-weight: bold; font-family: sans-serif;">${tubeInfo.name}</span>
        </div>
        
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: auto;">
          <div style="display: flex; justify-content: center; width: 100%; height: 32px; background: white;">
            ${barcodeSvg}
          </div>
          <div style="font-size: 10px; font-family: monospace; font-weight: bold; margin-top: 1px; letter-spacing: 1px;">
            ${sid}
          </div>
        </div>
      `;
      container.appendChild(labelDiv);
    });

    // Call printElement using our robust in-page print system!
    printElement(container, 'Etiquettes_Thermiques');
  };

  const handleSimulateBarcodes = () => {
    if (selectedOrderIds.length === 0) {
      alert("Veuillez sélectionner au moins un échantillon pour imprimer ses codes-barres.");
      return;
    }
    const ordersToPrint = selectedOrderIds.map(id => {
      return labOrders.find(order => order.id === id);
    }).filter((o): o is LabExamOrder => !!o);

    setPrintModalOrders(ordersToPrint);
    setShowPrintLabelModal(true);
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedOrderIds(prev => [...prev, id]);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find(p => p.id === newPartnerId);
    if (!partner) return;

    const examsList = newExams.split(',').map(ex => ex.trim()).filter(Boolean);

    // Initial parameters
    const paramsList = examsList.map((ex, idx) => ({
      id: `man-${idx}-${Date.now()}`,
      name: ex,
      value: '',
      unit: 'g/L',
      reference_range: 'Normal',
      is_abnormal: false
    }));

    const newOrder: Partial<LabExamOrder> = {
      order_number: `LAB-2026-${String(labOrders.length + 1000).padStart(4, '0')}`,
      partner_id: newPartnerId,
      partner_name: partner.name,
      patient_gender: 'M',
      patient_age: 42,
      prescribing_doctor: newPrescriber,
      status: 'pending_sampling',
      department: newDepartment,
      exam_names: examsList,
      parameters: paramsList,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await onSaveLabOrder(newOrder);
      setShowCreateModal(false);
      setNewExams('Glycémie, Urée, Créatinine');
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const countByWorkflowStatus = (status: string) => {
    return labOrders.filter(o => {
      if (status === 'paye') return o.status === 'pending_sampling';
      if (status === 'preleve') return o.status === 'in_progress';
      if (status === 'accepte') return o.status === 'accepted';
      if (status === 'analyse') return o.status === 'results_entered' || o.status === 'saisi';
      if (status === 'valide_tech') return o.status === 'valide_tech';
      if (status === 'valide_biologiste') return o.status === 'validated' || o.status === 'valide_biologiste';
      if (status === 'envoye') return o.status === 'envoye';
      return false;
    }).length;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* 1. LEFT SIDEBAR: NDM Quick Filters (inspired by Odoo) */}
      <div className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filtre NDM</span>
          </div>
          {selectedNdm && (
            <button
              onClick={() => setSelectedNdm(null)}
              className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded text-slate-700 font-bold transition"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Sidebar Search Input */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Chercher NDM ou nom..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(decodeScannerInput(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none rounded px-2.5 py-1 text-xs pl-7 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Sidebar NDM list */}
        <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none scrollbar-thin">
          <button
            onClick={() => setSelectedNdm(null)}
            className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition border-b border-slate-50 ${
              selectedNdm === null
                ? 'bg-slate-900 text-white font-black border-l-4 border-l-indigo-500'
                : 'hover:bg-slate-50 text-slate-700 font-medium'
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              <div className={`w-1.5 h-1.5 rounded-full ${selectedNdm === null ? 'bg-indigo-400' : 'bg-slate-400'}`} />
              <span className="truncate">Tous les Patients</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              selectedNdm === null ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {labOrders.length}
            </span>
          </button>

          {ndmList.map((item) => (
            <button
              key={item.ndm}
              onClick={() => setSelectedNdm(item.ndm)}
              className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition border-b border-slate-50 ${
                selectedNdm === item.ndm
                  ? 'bg-slate-900 text-white font-black border-l-4 border-l-indigo-500'
                  : 'hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <div className="flex flex-col truncate pr-1">
                <span className={`font-mono font-bold ${selectedNdm === item.ndm ? 'text-white' : 'text-slate-900'}`}>{item.ndm}</span>
                <span className={`text-[10px] truncate font-semibold ${selectedNdm === item.ndm ? 'text-slate-300' : 'text-slate-400'}`}>{item.name}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                selectedNdm === item.ndm ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {item.count}
              </span>
            </button>
          ))}

          {ndmList.length === 0 && (
            <div className="p-4 text-center text-slate-400 text-xs italic">
              Aucun dossier médical trouvé
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN PANEL: Odoo-style List View */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-3">
          {/* Action buttons and Main search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Echantillonnage Technique</span>
              </h1>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black">
                {filteredOrders.length} Enregistrements
              </span>
            </div>

            {/* Main Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Recherche générale (ex: Nom, SID...)"
                value={mainSearch}
                onChange={(e) => setMainSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none rounded-md px-3 py-1.5 text-xs pl-8 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          {/* Action Buttons for Selection */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            {/* Quick Filter States */}
            <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
              <button
                onClick={() => { setActiveStatusFilter('all'); setSelectedOrderIds([]); }}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                  activeStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => { setActiveStatusFilter('pending_sampling'); setSelectedOrderIds([]); }}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                  activeStatusFilter === 'pending_sampling'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Initié
              </button>
              <button
                onClick={() => { setActiveStatusFilter('in_progress'); setSelectedOrderIds([]); }}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                  activeStatusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Prélevé
              </button>
              <button
                onClick={() => { setActiveStatusFilter('results_entered'); setSelectedOrderIds([]); }}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                  activeStatusFilter === 'results_entered'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Saisi
              </button>
              <button
                onClick={() => { setActiveStatusFilter('validated'); setSelectedOrderIds([]); }}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                  activeStatusFilter === 'validated'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Validé
              </button>
            </div>

            {/* Selection actions (Only active if rows checked) */}
            <div className="flex items-center space-x-1.5 ml-auto">
              {selectedOrderIds.length > 0 ? (
                <>
                  <button
                    onClick={handleMassValidateSampling}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest rounded shadow-sm flex items-center space-x-1 transition cursor-pointer"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Valider Prélèvement ({selectedOrderIds.length})</span>
                  </button>

                  <button
                    onClick={handleSimulateBarcodes}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimer Étiquettes ({selectedOrderIds.length})</span>
                  </button>

                  <button
                    onClick={handleMassRejectSampling}
                    disabled={isProcessing}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center space-x-1 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Rejeter ({selectedOrderIds.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs px-1"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-widest rounded shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau Prélèvement</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current filters indicators like in Odoo breadcrumbs */}
        {selectedNdm && (
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Filtres Actifs :</span>
            <div className="flex items-center bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span>Patient NDM : {selectedNdm}</span>
              <button onClick={() => setSelectedNdm(null)} className="ml-1 text-slate-200 hover:text-white font-bold font-mono">×</button>
            </div>
            {activeStatusFilter !== 'all' && (
              <div className="flex items-center bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span>Statut : {activeStatusFilter}</span>
                <button onClick={() => setActiveStatusFilter('all')} className="ml-1 text-slate-200 hover:text-white font-bold font-mono">×</button>
              </div>
            )}
          </div>
        )}

        {/* Main List Table */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-2.5 w-8 text-center">
                  <button onClick={handleToggleToggleAllCustom} className="text-slate-400 hover:text-slate-600 transition">
                    {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" />
                    ) : (
                      <Square className="w-4 h-4 mx-auto" />
                    )}
                  </button>
                </th>
                <th className="p-2.5 w-20 font-bold hidden md:table-cell">Id Caisse</th>
                <th className="p-2.5 w-24 font-bold hidden sm:table-cell">NDM</th>
                <th className="p-2.5 w-24 font-bold hidden lg:table-cell">Date</th>
                <th className="p-2.5 w-28 font-bold text-slate-900">SID / Code</th>
                <th className="p-2.5 w-40 font-bold">Patient</th>
                <th className="p-2.5 w-28 font-bold text-center">État Workflow</th>
                <th className="p-2.5 font-bold hidden xl:table-cell">Lignes échantillon</th>
                <th className="p-2.5 w-36 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 italic text-xs">
                    Aucun échantillon ne correspond à vos critères actuels.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((order) => {
                  const partner = partners.find(p => p.id === order.partner_id);
                  const ndm = partner?.convention_code || `000${15000 + order.partner_id}`;
                  const isChecked = selectedOrderIds.includes(order.id);
                  const statusInfo = getStatusLabelAndStyle(order.status);
                  
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition text-xs ${
                        isChecked ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(order.id)}
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Id Caisse / Invoice ID */}
                      <td className="p-2.5 font-mono font-bold text-slate-500 truncate hidden md:table-cell">
                        {order.invoice_id ? `2026000${order.invoice_id}` : 'MANUEL'}
                      </td>

                      {/* Patient NDM */}
                      <td className="p-2.5 font-mono font-black text-slate-900 truncate hidden sm:table-cell">
                        {ndm}
                      </td>

                      {/* Date Réception */}
                      <td className="p-2.5 text-slate-500 font-semibold text-[11px] truncate hidden lg:table-cell">
                        {formatDateTime(order.created_at)}
                      </td>

                      {/* SID Code */}
                      <td className="p-2.5 font-mono font-extrabold text-indigo-600 truncate" title={getSID(order)}>
                        {getSID(order)}
                      </td>

                      {/* Nom & Prénom */}
                      <td className="p-2.5 text-slate-800 font-bold truncate" title={order.partner_name}>
                        {order.partner_name}
                      </td>

                      {/* Etat Pill */}
                      <td className="p-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full border truncate max-w-full ${statusInfo.bg} ${statusInfo.border}`}>
                          {['in_progress', 'accepted', 'results_entered', 'saisi', 'valide_tech', 'validated', 'valide_biologiste'].includes(order.status) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          )}
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Exam Ligne échantillon Pills */}
                      <td className="p-2.5 hidden xl:table-cell truncate">
                        <div className="flex flex-wrap gap-1 max-w-sm truncate">
                          {order.exam_names.map((exam, i) => (
                            <span
                              key={i}
                              className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-full text-[9px] font-medium text-slate-700 truncate"
                            >
                              {exam}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {order.status === 'pending_sampling' ? (
                            <button
                              onClick={() => handleValidateSingle(order)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded shadow-xs transition flex items-center space-x-1 cursor-pointer"
                              title="Valider le prélèvement : lance l'étiquetage et enchaîne tout le workflow automatique"
                            >
                              <CheckCircle className="w-3 h-3 text-white" />
                              <span>💉 Prélèvement OK</span>
                            </button>
                          ) : order.status === 'envoye' ? (
                            <span className="text-[10px] text-emerald-700 font-black flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span>Résultats Diffusés</span>
                            </span>
                          ) : order.status === 'rejected' ? (
                            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200">
                              Rejeté
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-700 font-bold flex items-center space-x-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200" title="Automate LIMS en cours de traitement automatique">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                              <span>Traitement LIMS auto...</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setPrintModalOrders([order]);
                              setShowPrintLabelModal(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition flex items-center justify-center cursor-pointer shadow-3xs"
                            title="Imprimer l'étiquette de prélèvement"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="dossiers d'échantillons"
        />
      </div>

      {/* 3. NEW SAMPLING ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Nouveau Dossier de Prélèvement</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-black"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
              {/* Partner selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Patient</label>
                <select
                  value={newPartnerId}
                  onChange={(e) => setNewPartnerId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none rounded px-3 py-1.5 font-bold"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - NDM {p.convention_code || `000${15000 + p.id}`}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Plateau Technique (Département)</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none rounded px-3 py-1.5 font-bold"
                >
                  <option value="Biochimie">Biochimie Clinique</option>
                  <option value="Hématologie">Hématologie & Cytologie</option>
                  <option value="Sérologie">Sérologie & Immunologie</option>
                  <option value="Bactériologie">Microbiologie & Bactériologie</option>
                  <option value="Parasitologie">Parasitologie & Coprologie</option>
                </select>
              </div>

              {/* Exams list */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Examens demandés (Séparés par virgule)</label>
                <textarea
                  value={newExams}
                  onChange={(e) => setNewExams(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none rounded px-3 py-1.5 font-semibold"
                  placeholder="Ex: Glycémie, Créatinine, Urée"
                />
              </div>

              {/* Prescriber */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Médecin Prescripteur</label>
                <input
                  type="text"
                  value={newPrescriber}
                  onChange={(e) => setNewPrescriber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none rounded px-3 py-1.5 font-bold"
                  placeholder="Ex: Dr. Yao"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold rounded hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded shadow-sm"
                >
                  Créer & Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. LABEL PRINTING & NOMENCLATURE PREVIEW MODAL */}
      {showPrintLabelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Étiquettes Thermiques
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Format Standard : 50mm × 30mm</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintLabelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col space-y-4">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block text-center">
                Aperçu de l'étiquette ({printModalOrders.length} copie(s))
              </span>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-[320px] overflow-y-auto space-y-4 flex flex-col items-center">
                {printModalOrders.map((o) => {
                  const partner = partners.find(p => p.id === o.partner_id);
                  const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
                  const sid = getSID(o);
                  const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR');
                  const tubeInfo = getTubeInfo(o);

                  return (
                    <div
                      key={o.id}
                      className="bg-white border border-slate-300 rounded shadow-md p-3 flex flex-col justify-between shrink-0"
                      style={{ width: '220px', height: '140px' }}
                    >
                      {/* Label header */}
                      <div className="flex justify-between items-center border-b border-slate-400 pb-1 text-[8px] font-bold text-slate-500">
                        <span>LABORATOIRE</span>
                        <span>{dateStr}</span>
                      </div>

                      {/* Patient info */}
                      <div className="mt-1">
                        <div className="text-[11px] font-black text-slate-900 truncate">
                          {o.partner_name}
                        </div>
                        <div className="text-[9px] text-slate-600 font-medium">
                          NDM: <span className="font-mono font-bold text-slate-950">{ndm}</span>
                        </div>
                      </div>

                      {/* Tube Type */}
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full border border-slate-400"
                          style={{ backgroundColor: tubeInfo.color }}
                        />
                        <span className="text-[9px] font-semibold text-slate-700 truncate">{tubeInfo.name}</span>
                      </div>

                      {/* Barcode visual */}
                      <div className="mt-auto flex flex-col items-center justify-center bg-white p-0.5 rounded border border-slate-100">
                        <Barcode
                          value={sid}
                          width={1.0}
                          height={25}
                          displayValue={false}
                          className="h-7 max-w-full"
                        />
                        {/* SID Below Barcode */}
                        <div className="text-[10px] font-mono font-bold tracking-wider text-slate-900 mt-0.5">
                          {sid}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrintLabelModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 rounded hover:bg-slate-50 border border-slate-200"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintLabels(printModalOrders);
                    setShowPrintLabelModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Lancer l'Impression ({printModalOrders.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleToggleToggleAllCustom() {
    handleToggleSelectAll();
  }
};
