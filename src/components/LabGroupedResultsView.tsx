import React, { useState, useRef, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Printer,
  Edit2,
  X,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Save,
  Check,
  Microscope,
  RotateCw,
  Plus,
  FlaskConical,
  ShieldCheck,
  Layers,
  User,
} from 'lucide-react';
import { LabExamOrder, ResPartner, ResUser, CompanySettings, LabResultStatus, LabParameterResult } from '../types';
import { printElement } from '../lib/printUtils';
import { decodeScannerInput } from '../lib/scannerDecoder';
import { PaginationControls } from './PaginationControls';

interface LabGroupedResultsViewProps {
  labOrders: LabExamOrder[];
  partners: ResPartner[];
  currentUser: ResUser | null;
  company: CompanySettings;
  onSaveLabOrder: (order: Partial<LabExamOrder>) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const LabGroupedResultsView: React.FC<LabGroupedResultsViewProps> = ({
  labOrders = [],
  partners = [],
  currentUser,
  company,
  onSaveLabOrder,
  onRefreshData,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Department Tabs
  const departmentsTabs = [
    { id: 'all', label: 'Tous les départements' },
    { id: 'BIOCHIMIE', label: 'Biochimie' },
    { id: 'SEROLOGIE', label: 'Sérologie & Immunologie' },
    { id: 'BACTERIOLOGIE', label: 'Bactériologie' },
    { id: 'PARASITOLOGIE', label: 'Parasitologie' },
    { id: 'HEMATOLOGIE', label: 'Hématologie' },
  ];

  // Filters & State
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNdm, setSelectedNdm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mainSearch, setMainSearch] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company.default_page_size || 50);

  // Modals / Edit states
  const [editingOrder, setEditingOrder] = useState<LabExamOrder | null>(null);
  const [parametersState, setParametersState] = useState<LabParameterResult[]>([]);
  const [conclusionText, setConclusionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<LabExamOrder | null>(null);

  const isBiologist =
    currentUser?.login === 'dr.toure' ||
    (currentUser?.role || '').toLowerCase().includes('biologiste') ||
    (currentUser?.role || '').toLowerCase().includes('chef') ||
    (currentUser?.role || '').toLowerCase().includes('médecin') ||
    currentUser?.login === 'admin';

  // Format Date
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Status style mapping matching standard medical branding
  const getStatusLabelAndStyle = (status: LabResultStatus) => {
    switch (status) {
      case 'pending_sampling':
        return {
          label: 'Initié',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        };
      case 'in_progress':
        return {
          label: 'Transféré',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        };
      case 'results_entered':
        return {
          label: 'Saisi (À valider)',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
        };
      case 'validated':
        return {
          label: 'Validé Biologiste',
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
        };
      case 'rejected':
        return {
          label: 'Rejeté',
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  const getSID = (order: LabExamOrder) => {
    const deptPrefix = (order.department || 'GEN')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')[0]
      .substring(0, 4);

    const paddedId = String(order.id).padStart(5, '0');
    return `${deptPrefix}-${paddedId}`;
  };

  // Left sidebar NDM unique lists with counts
  const ndmList = useMemo(() => {
    const counts: { [ndm: string]: { name: string; count: number } } = {};
    labOrders.forEach((o) => {
      const partner = partners.find((p) => p.id === o.partner_id);
      const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
      if (!counts[ndm]) {
        counts[ndm] = {
          name: o.partner_name,
          count: 0,
        };
      }
      counts[ndm].count++;
    });

    return Object.entries(counts)
      .map(([ndm, data]) => ({
        ndm,
        ...data,
      }))
      .filter(
        (item) =>
          !sidebarSearch ||
          (item.ndm || '').toString().toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          (item.name || '').toString().toLowerCase().includes(sidebarSearch.toLowerCase())
      )
      .sort((a, b) => b.count - a.count);
  }, [labOrders, partners, sidebarSearch]);

  // Main list filters
  const filteredOrders = useMemo(() => {
    return labOrders
      .filter((o) => {
        // 1. Department Tabs Filter
        if (activeTab !== 'all') {
          const orderDeptUpper = (o.department || '').toUpperCase();
          if (activeTab === 'BIOCHIMIE' && !orderDeptUpper.includes('BIOCHIMIE') && !orderDeptUpper.includes('CHIM')) return false;
          if (activeTab === 'SEROLOGIE' && !orderDeptUpper.includes('SEROLOGIE') && !orderDeptUpper.includes('IMMUN')) return false;
          if (activeTab === 'BACTERIOLOGIE' && !orderDeptUpper.includes('BACTERIO') && !orderDeptUpper.includes('MICRO')) return false;
          if (activeTab === 'PARASITOLOGIE' && !orderDeptUpper.includes('PARASITO') && !orderDeptUpper.includes('COPRO')) return false;
          if (activeTab === 'HEMATOLOGIE' && !orderDeptUpper.includes('HEMATO') && !orderDeptUpper.includes('CYTO')) return false;
        }

        // 2. Status Filter
        if (filterStatus !== 'all' && o.status !== filterStatus) {
          return false;
        }

        // 3. Sidebar NDM filter
        if (selectedNdm) {
          const partner = partners.find((p) => p.id === o.partner_id);
          const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
          if (ndm !== selectedNdm) return false;
        }

        // 4. Search Bar Filter
        if (mainSearch.trim()) {
          const query = mainSearch.toLowerCase();
          const matchesName = (o.partner_name || '').toString().toLowerCase().includes(query);
          const matchesSid = (getSID(o) || '').toString().toLowerCase().includes(query);
          const matchesExams = (o.exam_names || []).some((e) => (e || '').toString().toLowerCase().includes(query));
          const matchesDept = (o.department || '').toString().toLowerCase().includes(query);
          const partner = partners.find((p) => p.id === o.partner_id);
          const ndm = partner?.convention_code || `000${15000 + o.partner_id}`;
          const matchesNdm = (ndm || '').toString().toLowerCase().includes(query);

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
  }, [labOrders, partners, activeTab, filterStatus, selectedNdm, mainSearch]);

  // Paginated records
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset pagination on filter change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleNdmSelect = (ndm: string | null) => {
    setSelectedNdm(ndm);
    setCurrentPage(1);
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedOrderIds((prev) => [...prev, id]);
    }
  };

  // KPI Calculations
  const totalCount = labOrders.length;
  const inProgressCount = labOrders.filter((o) => o.status === 'in_progress' || o.status === 'pending_sampling').length;
  const resultsEnteredCount = labOrders.filter((o) => o.status === 'results_entered').length;
  const validatedCount = labOrders.filter((o) => o.status === 'validated').length;

  // Edit / Input Results
  const handleOpenEdit = (order: LabExamOrder) => {
    setEditingOrder(order);
    setParametersState(JSON.parse(JSON.stringify(order.parameters || [])));
    setConclusionText(order.conclusion || '');
  };

  const handleParamValueChange = (idx: number, newVal: string) => {
    setParametersState((prev) => {
      const copy = [...prev];
      copy[idx].value = newVal;
      const range = copy[idx].reference_range;
      if (range && newVal) {
        const valNum = parseFloat(newVal.replace(',', '.'));
        const parts = range.split('-').map((s) => parseFloat(s.trim().replace(',', '.')));
        if (!isNaN(valNum) && parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          copy[idx].is_abnormal = valNum < parts[0] || valNum > parts[1];
        }
      }
      return copy;
    });
  };

  const handleToggleParamAbnormal = (idx: number) => {
    setParametersState((prev) => {
      const copy = [...prev];
      copy[idx].is_abnormal = !copy[idx].is_abnormal;
      return copy;
    });
  };

  const handleAddCustomParam = () => {
    const newP: LabParameterResult = {
      id: `p-grp-${Date.now()}`,
      name: 'Nouveau Paramètre',
      value: '',
      unit: 'g/L',
      reference_range: '0.00 - 1.00',
      is_abnormal: false,
    };
    setParametersState((prev) => [...prev, newP]);
  };

  const handleSaveResults = async (validateNow: boolean = false) => {
    if (!editingOrder) return;
    setIsSaving(true);
    try {
      const updatedStatus = validateNow
        ? 'validated'
        : parametersState.some((p) => p.value.trim() !== '')
        ? 'results_entered'
        : editingOrder.status;

      await onSaveLabOrder({
        ...editingOrder,
        parameters: parametersState,
        conclusion: conclusionText,
        status: updatedStatus,
        technician_name: currentUser?.name || editingOrder.technician_name || 'Technicien de Laboratoire',
        technician_id: currentUser?.id || editingOrder.technician_id,
        validated_by_doctor: validateNow ? currentUser?.name || 'Dr. Touré (Biologiste)' : editingOrder.validated_by_doctor,
        validated_by_id: validateNow ? currentUser?.id : editingOrder.validated_by_id,
        validated_at: validateNow ? new Date().toISOString() : editingOrder.validated_at,
      });

      setEditingOrder(null);
      if (onRefreshData) await onRefreshData();
    } finally {
      setIsSaving(false);
    }
  };

  // Batch Validation of Selected Dossiers
  const handleBatchValidate = async () => {
    if (selectedOrderIds.length === 0 || !isBiologist) return;
    const confirmMsg = `Valider et signer les ${selectedOrderIds.length} dossiers sélectionnés en tant que Biologiste ?`;
    if (!window.confirm(confirmMsg)) return;

    for (const orderId of selectedOrderIds) {
      const order = labOrders.find((o) => o.id === orderId);
      if (order && order.status !== 'validated') {
        await onSaveLabOrder({
          ...order,
          status: 'validated',
          validated_by_doctor: currentUser?.name || 'Dr. Touré (Biologiste)',
          validated_by_id: currentUser?.id,
          validated_at: new Date().toISOString(),
        });
      }
    }
    setSelectedOrderIds([]);
    if (onRefreshData) await onRefreshData();
  };

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, `Compte_Rendu_${printingOrder?.order_number}`);
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* 1. Header Banner matching other modules */}
      <div className="bg-white rounded-md p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
              <Microscope className="w-3 h-3 text-slate-400" />
              <span>Plateau Technique Médical</span>
            </span>
            {currentUser && (
              <span className="text-xs text-slate-500 font-medium">
                • Connecté en tant que <strong className="text-slate-800">{currentUser.name}</strong>
              </span>
            )}
          </div>
          <h2 className="text-base font-black text-slate-900 mt-1">
            Résultats Biologiques Groupés
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Saisie des paramètres par département, organisation par NDM patient et validation biologique officielle.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {selectedOrderIds.length > 0 && isBiologist && (
            <button
              onClick={handleBatchValidate}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-md shadow-xs transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Valider la Sélection ({selectedOrderIds.length})</span>
            </button>
          )}

          {onRefreshData && (
            <button
              onClick={() => onRefreshData()}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-md border border-slate-300 shadow-xs transition"
              title="Actualiser les données"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Actualiser</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Dossiers Labo
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>En cours / Transféré</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{inProgressCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>À Valider (Saisis)</span>
          </div>
          <div className="text-xl font-black text-amber-800 mt-1">{resultsEnteredCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Validés Biologiste</span>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{validatedCount}</div>
        </div>
      </div>

      {/* 3. Department Tabs Bar */}
      <div className="bg-white p-2 rounded-md border border-slate-200 shadow-xs flex items-center space-x-1.5 overflow-x-auto">
        {departmentsTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Dual Workspace: Left NDM Filter + Main Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Left Sidebar: Filter by NDM Patient */}
        <div className="lg:col-span-1 bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Filtre NDM Patient
              </span>
            </div>
            {selectedNdm && (
              <button
                onClick={() => handleNdmSelect(null)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold transition"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Chercher NDM ou nom..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(decodeScannerInput(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white focus:outline-none rounded-md px-2.5 py-1.5 text-xs pl-7 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            <button
              onClick={() => handleNdmSelect(null)}
              className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition cursor-pointer ${
                selectedNdm === null
                  ? 'bg-slate-900 text-white font-bold'
                  : 'hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="truncate">Tous les Patients</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  selectedNdm === null
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {labOrders.length}
              </span>
            </button>

            {ndmList.map((item) => {
              const isSelected = selectedNdm === item.ndm;
              return (
                <button
                  key={item.ndm}
                  onClick={() => handleNdmSelect(item.ndm)}
                  className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex flex-col truncate pr-1">
                    <span className={`font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {item.ndm}
                    </span>
                    <span
                      className={`text-[11px] truncate font-medium ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                      isSelected
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Table */}
        <div className="lg:col-span-3 bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Top Filter & Search Bar */}
          <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par patient, SID, NDM, analyse..."
                value={mainSearch}
                onChange={(e) => {
                  setMainSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 transition"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-700 focus:border-slate-800"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending_sampling">Initié</option>
                <option value="in_progress">Transféré / En cours</option>
                <option value="results_entered">Saisi (À valider)</option>
                <option value="validated">Validé Biologiste</option>
                <option value="rejected">Rejeté</option>
              </select>

              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-md font-extrabold border border-slate-200 whitespace-nowrap">
                {filteredOrders.length} Dossier{filteredOrders.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Active Filter Chips */}
          {selectedNdm && (
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Filtre actif :</span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]">
                <span>NDM : {selectedNdm}</span>
                <button
                  onClick={() => handleNdmSelect(null)}
                  className="text-slate-300 hover:text-white font-mono ml-1"
                >
                  ×
                </button>
              </span>
            </div>
          )}

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-text">
              <thead className="bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Sélectionner tous"
                    >
                      {selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-slate-900 mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 mx-auto" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-bold">Id Caisse</th>
                  <th className="p-3 font-bold">NDM</th>
                  <th className="p-3 font-bold">Date Réception</th>
                  <th className="p-3 font-bold">SID</th>
                  <th className="p-3 font-bold">Nom &amp; Prénoms</th>
                  <th className="p-3 font-bold text-center">État</th>
                  <th className="p-3 font-bold">Ligne Échantillon</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 italic text-xs">
                      Aucun dossier ne correspond à vos filtres actuels.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const partner = partners.find((p) => p.id === order.partner_id);
                    const ndm = partner?.convention_code || `000${15000 + order.partner_id}`;
                    const isChecked = selectedOrderIds.includes(order.id);
                    const statusInfo = getStatusLabelAndStyle(order.status);

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-slate-50/70 transition text-xs ${
                          isChecked ? 'bg-slate-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleSelectOne(order.id)}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-slate-900 mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 mx-auto" />
                            )}
                          </button>
                        </td>

                        {/* Id Caisse */}
                        <td className="p-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                          {order.invoice_id ? `2026000${order.invoice_id}` : 'MANUEL'}
                        </td>

                        {/* NDM */}
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {ndm}
                        </td>

                        {/* Date Réception */}
                        <td className="p-3 text-slate-500 font-medium whitespace-nowrap">
                          {formatDateTime(order.created_at)}
                        </td>

                        {/* SID */}
                        <td className="p-3 font-mono font-black text-slate-900 whitespace-nowrap">
                          {getSID(order)}
                        </td>

                        {/* Patient Nom */}
                        <td className="p-3 text-slate-800 font-bold whitespace-nowrap">
                          {order.partner_name}
                        </td>

                        {/* État */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${statusInfo.bg}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Ligne échantillon */}
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {order.exam_names.map((exam, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-700"
                              >
                                {exam}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(order)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-md border border-slate-300 shadow-2xs flex items-center space-x-1 transition cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Saisir / Valider</span>
                            </button>

                            <button
                              onClick={() => setPrintingOrder(order)}
                              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md border border-slate-300 shadow-2xs transition cursor-pointer"
                              title="Aperçu Compte-rendu"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
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
            itemLabel="dossiers"
          />
        </div>
      </div>

      {/* 5. Modal: Edit Lab Results & Biological Validation */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Microscope className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Saisie &amp; Validation Médicale
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dossier {editingOrder.order_number} • Patient : {editingOrder.partner_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Patient info box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient</span>
                  <span className="font-bold text-slate-900">{editingOrder.partner_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Prescripteur</span>
                  <span className="font-semibold text-slate-800">
                    {editingOrder.prescribing_doctor || 'Non spécifié'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date Prélèvement</span>
                  <span className="font-semibold text-slate-800">
                    {editingOrder.sampling_date?.replace('T', ' ').substring(0, 16) || 'Non renseigné'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Département</span>
                  <span className="font-bold text-slate-900">{editingOrder.department}</span>
                </div>
              </div>

              {/* Biological parameters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Paramètres d'Analyse &amp; Valeurs Biologiques
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCustomParam}
                    className="text-xs text-slate-800 font-bold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un paramètre</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Paramètre</th>
                        <th className="py-2 px-3 w-32">Valeur Mesurée</th>
                        <th className="py-2 px-3 w-20">Unité</th>
                        <th className="py-2 px-3">Valeurs de Référence</th>
                        <th className="py-2 px-3 text-center">Norme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parametersState.map((param, idx) => (
                        <tr
                          key={param.id || idx}
                          className={param.is_abnormal ? 'bg-rose-50/50' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-900">{param.name}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleParamValueChange(idx, e.target.value)}
                              placeholder="Valeur"
                              className={`w-full px-2.5 py-1 border rounded-md text-xs font-bold ${
                                param.is_abnormal
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                  : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900'
                              } focus:outline-none focus:ring-1`}
                            />
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{param.unit}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{param.reference_range}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleParamAbnormal(idx)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                                param.is_abnormal
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                              title="Basculer l'alerte"
                            >
                              {param.is_abnormal ? 'Anormal' : 'Normal'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conclusion block */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Conclusion &amp; Avis Médical du Biologiste
                </label>
                <textarea
                  rows={3}
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  placeholder="Conclusion médicale et interprétation biologique..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-bold transition"
              >
                Annuler
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveResults(false)}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enregistrer Brouillon</span>
                </button>

                {isBiologist && (
                  <button
                    type="button"
                    onClick={() => handleSaveResults(true)}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Valider &amp; Signer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Print Preview Compte-Rendu */}
      {printingOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 flex flex-col">
            <div className="p-3.5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-xs uppercase tracking-tight text-slate-800">
                  Compte-Rendu d'Analyses Biologiques • {printingOrder.order_number}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le Bulletin</span>
                </button>
                <button
                  onClick={() => setPrintingOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document body to print */}
            <div ref={printRef} className="p-8 bg-white text-slate-900 space-y-5 max-h-[75vh] overflow-y-auto print:p-0 print:max-h-none text-xs">
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-md bg-slate-900 text-white font-black flex items-center justify-center text-xl shadow-xs">
                    {company.name ? company.name.charAt(0).toUpperCase() : 'L'}
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                      {company.name || 'LABORATOIRE DE BIOLOGIE MÉDICALE'}
                    </h1>
                    <p className="text-[10px] text-slate-500">
                      {company.address}, {company.city} • Tél : {company.phone} • Email : {company.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 border border-slate-300 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                    Bulletin officiel d'analyses
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                    N° {printingOrder.order_number}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Date : {formatDateTime(printingOrder.created_at)}
                  </div>
                </div>
              </div>

              {/* Patient box */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Patient</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{printingOrder.partner_name}</div>
                  <div className="text-slate-600 text-[10px] mt-0.5">
                    Genre : {printingOrder.patient_gender === 'M' ? 'Masculin' : 'Féminin'} • Âge : {printingOrder.patient_age || '42'} ans
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Prescripteur</div>
                  <div className="font-bold text-slate-900 mt-0.5">{printingOrder.prescribing_doctor || 'Consultation Externe'}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Département : {printingOrder.department}</div>
                </div>
              </div>

              {/* Table */}
              <div className="space-y-2">
                <div className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {printingOrder.exam_names.join(' & ')}
                </div>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-bold text-[9px] uppercase">
                      <th className="py-2 px-3">Paramètre Biologique</th>
                      <th className="py-2 px-3 text-right">Résultat</th>
                      <th className="py-2 px-3">Unité</th>
                      <th className="py-2 px-3">Valeurs de Référence</th>
                      <th className="py-2 px-3 text-center">Interprétation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {printingOrder.parameters?.map((p, idx) => (
                      <tr key={idx} className={p.is_abnormal ? 'bg-rose-50/50' : ''}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${p.is_abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.value || '--'}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{p.unit}</td>
                        <td className="py-2 px-3 text-slate-600 text-[10px]">{p.reference_range}</td>
                        <td className="py-2 px-3 text-center text-[9px] font-bold">
                          {p.is_abnormal ? <span className="text-rose-600 font-bold">● ANORMAL</span> : <span className="text-emerald-700">Normal</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {printingOrder.conclusion && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="font-bold text-slate-900 uppercase text-[9px] block">Conclusion Médicale :</span>
                  <p className="text-slate-700 mt-1 italic leading-relaxed">« {printingOrder.conclusion} »</p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Technicien Manipulateur</div>
                  <div className="font-semibold text-slate-800 mt-1">{printingOrder.technician_name || 'Équipe Technique Labo'}</div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Le Médecin Biologiste</div>
                  <div className="font-bold text-slate-900 mt-1">{printingOrder.validated_by_doctor || 'Dr. Aminata Touré'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Signature Électronique Validée</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
