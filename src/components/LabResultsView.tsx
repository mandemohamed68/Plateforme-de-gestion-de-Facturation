import React, { useState, useRef } from 'react';
import {
  Microscope,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  Edit3,
  ShieldCheck,
  User,
  FlaskConical,
  X,
  Save,
  Check,
  Building2,
  Calendar,
  Share2,
} from 'lucide-react';
import { LabExamOrder, LabParameterResult, ResPartner, ResUser, CompanySettings } from '../types';
import { formatFCFA } from '../lib/formatters';
import { printElement } from '../lib/printUtils';
import { PaginationControls } from './PaginationControls';

interface LabResultsViewProps {
  labOrders: LabExamOrder[];
  partners: ResPartner[];
  currentUser: ResUser | null;
  company: CompanySettings;
  onSaveLabOrder: (order: Partial<LabExamOrder>) => Promise<void>;
  onDeleteLabOrder?: (id: number) => Promise<void>;
}

export const LabResultsView: React.FC<LabResultsViewProps> = ({
  labOrders = [],
  partners = [],
  currentUser,
  company,
  onSaveLabOrder,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, 'Compte_Rendu_Analyses');
    }
  };
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company.default_page_size || 50);
  
  // Modals
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<LabExamOrder | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<LabExamOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Saisie state
  const [parametersState, setParametersState] = useState<LabParameterResult[]>([]);
  const [conclusionText, setConclusionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Order State
  const [newPartnerId, setNewPartnerId] = useState<number>(partners[0]?.id || 1);
  const [newDepartment, setNewDepartment] = useState('Biochimie');
  const [newExamName, setNewExamName] = useState('Glycémie à jeun & Bilan Lipidique');
  const [newPrescriber, setNewPrescriber] = useState('Dr. Koffi (Clinique Centrale)');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newAge, setNewAge] = useState<number>(35);

  const isBiologist =
    currentUser?.login === 'dr.toure' ||
    (currentUser?.role || '').toLowerCase().includes('biologiste') ||
    (currentUser?.role || '').toLowerCase().includes('chef') ||
    (currentUser?.role || '').toLowerCase().includes('médecin') ||
    currentUser?.login === 'admin';

  // Panic / Critical values checker (Alertes biologiques vitales)
  const checkPanicValue = (paramName: string, valueStr: string): { isCritical: boolean; message?: string } => {
    const name = (paramName || '').toLowerCase();
    const val = parseFloat((valueStr || '').replace(',', '.'));
    if (isNaN(val)) return { isCritical: false };

    if (name.includes('glyc') || name.includes('glucose')) {
      if (val < 0.50 && val > 0) return { isCritical: true, message: 'Hypoglycémie critique (< 0.50 g/L)' };
      if (val > 3.00) return { isCritical: true, message: 'Hyperglycémie majeure (> 3.00 g/L)' };
    }
    if (name.includes('kali') || name.includes('potassium')) {
      if (val < 2.8 && val > 0) return { isCritical: true, message: 'Hypokaliémie sévère (< 2.8 mmol/L)' };
      if (val > 6.0) return { isCritical: true, message: 'Hyperkaliémie critique (> 6.0 mmol/L)' };
    }
    if (name.includes('hémoglobine') || name.includes('hemoglobine') || name.includes('hb')) {
      if (val < 7.0 && val > 0) return { isCritical: true, message: 'Anémie sévère décompensée (< 7.0 g/dL)' };
    }
    if (name.includes('plaquette')) {
      if (val < 30000 && val > 0) return { isCritical: true, message: 'Thrombopénie critique (< 30 000 /mm³)' };
    }
    if (name.includes('créat') || name.includes('creat')) {
      if (val > 45 && val < 500) return { isCritical: true, message: 'Insuffisance rénale aiguë (> 45 mg/L)' };
      if (val > 350) return { isCritical: true, message: 'Insuffisance rénale sévère (> 350 µmol/L)' };
    }
    return { isCritical: false };
  };

  // KPIs
  const totalCount = labOrders.length;
  const pendingCount = labOrders.filter((o) => o.status === 'pending_sampling' || o.status === 'in_progress').length;
  const toValidateCount = labOrders.filter((o) => o.status === 'results_entered').length;
  const validatedCount = labOrders.filter((o) => o.status === 'validated').length;

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

  const getPartnerNDM = (order: LabExamOrder) => {
    const partner = partners.find(p => p.id === order.partner_id);
    return partner?.ndm || partner?.convention_code || `000${15000 + order.partner_id}`;
  };

  // Filtered orders
  const filteredOrders = labOrders
    .filter((order) => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && order.department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPatient = (order.partner_name || '').toLowerCase().includes(q);
        const matchOrderNum = (order.order_number || '').toLowerCase().includes(q);
        const matchExams = (order.exam_names || []).some((ex) => (ex || '').toLowerCase().includes(q));
        const matchSid = (getSID(order) || '').toLowerCase().includes(q);
        const matchNdm = (getPartnerNDM(order) || '').toLowerCase().includes(q);
        if (!matchPatient && !matchOrderNum && !matchExams && !matchSid && !matchNdm) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.order_date || a.created_at || 0).getTime();
      const dateB = new Date(b.order_date || b.created_at || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  const handleOpenEdit = (order: LabExamOrder) => {
    setSelectedOrderForEdit(order);
    setParametersState(JSON.parse(JSON.stringify(order.parameters || [])));
    setConclusionText(order.conclusion || '');
  };

  const handleParamValueChange = (idx: number, newVal: string) => {
    setParametersState((prev) => {
      const copy = [...prev];
      copy[idx].value = newVal;
      // Auto check abnormality if reference range is numerical min - max
      const range = copy[idx].reference_range;
      if (range && newVal) {
        const valNum = parseFloat(newVal.replace(',', '.'));
        const parts = range.split('-').map((s) => parseFloat(s.trim().replace(',', '.')));
        if (!isNaN(valNum) && parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          copy[idx].is_abnormal = valNum < parts[0] || valNum > parts[1];
        }
      }
      // Check for panic / critical vital thresholds
      const panic = checkPanicValue(copy[idx].name, newVal);
      copy[idx].is_critical = panic.isCritical;
      copy[idx].critical_alert = panic.message;
      if (panic.isCritical) {
        copy[idx].is_abnormal = true;
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
      id: `p-${Date.now()}`,
      name: 'Paramètre additionnel',
      value: '',
      unit: 'g/L',
      reference_range: '0.00 - 1.00',
      is_abnormal: false,
    };
    setParametersState((prev) => [...prev, newP]);
  };

  const handleSaveResults = async (validateNow: boolean = false) => {
    if (!selectedOrderForEdit) return;
    setIsSaving(true);
    try {
      const updatedStatus = validateNow
        ? 'validated'
        : parametersState.some((p) => p.value.trim() !== '')
        ? 'results_entered'
        : selectedOrderForEdit.status;

      await onSaveLabOrder({
        ...selectedOrderForEdit,
        parameters: parametersState,
        conclusion: conclusionText,
        status: updatedStatus,
        technician_name: currentUser?.name || selectedOrderForEdit.technician_name,
        technician_id: currentUser?.id || selectedOrderForEdit.technician_id,
        validated_by_doctor: validateNow ? currentUser?.name || 'Dr. Touré (Biologiste)' : selectedOrderForEdit.validated_by_doctor,
        validated_by_id: validateNow ? currentUser?.id : selectedOrderForEdit.validated_by_id,
        validated_at: validateNow ? new Date().toISOString() : selectedOrderForEdit.validated_at,
      });

      setSelectedOrderForEdit(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find((p) => p.id === Number(newPartnerId)) || partners[0];
    
    // Sample default parameters based on department
    let defaultParams: LabParameterResult[] = [];
    if (newDepartment.includes('Biochimie')) {
      defaultParams = [
        { id: '1', name: 'Glycémie à jeun', value: '', unit: 'g/L', reference_range: '0.70 - 1.10' },
        { id: '2', name: 'Cholestérol Total', value: '', unit: 'g/L', reference_range: '1.50 - 2.00' },
        { id: '3', name: 'Triglycérides', value: '', unit: 'g/L', reference_range: '0.45 - 1.75' },
        { id: '4', name: 'Créatinine Sérique', value: '', unit: 'mg/L', reference_range: '7.0 - 12.0' },
      ];
    } else if (newDepartment.includes('Hématologie')) {
      defaultParams = [
        { id: '1', name: 'Hémoglobine (Hb)', value: '', unit: 'g/dL', reference_range: '12.0 - 16.5' },
        { id: '2', name: 'Globules Blancs (Leucocytes)', value: '', unit: '/mm³', reference_range: '4000 - 10000' },
        { id: '3', name: 'Plaquettes', value: '', unit: '/mm³', reference_range: '150000 - 450000' },
        { id: '4', name: 'Vitesse de Sédimentation (VS 1ère h)', value: '', unit: 'mm', reference_range: '< 15' },
      ];
    } else {
      defaultParams = [
        { id: '1', name: 'Recherche d’Anticorps', value: 'Négatif', unit: 'Index', reference_range: 'Négatif' },
        { id: '2', name: 'Test Rapide d’Orientation', value: 'Négatif', unit: '', reference_range: 'Négatif' },
      ];
    }

    const orderNum = `LAB-${new Date().getFullYear()}-${String(labOrders.length + 1).padStart(4, '0')}`;

    await onSaveLabOrder({
      order_number: orderNum,
      partner_id: partner.id,
      partner_name: partner.name,
      patient_gender: newGender,
      patient_age: Number(newAge),
      prescribing_doctor: newPrescriber,
      sampling_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending_sampling',
      department: newDepartment,
      exam_names: [newExamName],
      parameters: defaultParams,
      conclusion: '',
      technician_name: currentUser?.name || 'Technicien de garde',
    });

    setIsCreateModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Validé par Biologiste</span>
          </span>
        );
      case 'results_entered':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>Résultats saisis (À valider)</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FlaskConical className="w-3 h-3 text-slate-500" />
            <span>En cours d’analyse</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>En attente de prélèvement</span>
          </span>
        );
    }
  };

  const brandColor = company.primary_color || '#0f172a';

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-md p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
              <Microscope className="w-3 h-3 text-slate-400" />
              <span>Plateau Technique Médical</span>
            </span>
          </div>
          <h2 className="text-base font-black text-slate-900 mt-1">
            Examens Biologiques &amp; Comptes-Rendus Patients
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Saisie des paramètres d'analyses, validation médicale par le biologiste et impression des comptes-rendus officiels.
          </p>
        </div>

        <button
          id="btn-new-lab-order"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-md border border-slate-300 shadow-sm transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Nouvelle Demande d'Examen</span>
        </button>
      </div>

      {/* KPI Cards */}
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
            <span>En attente / En cours</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{pendingCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-slate-500" />
            <span>À Valider Biologiste</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{toValidateCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Validés &amp; Signés</span>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{validatedCount}</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par patient, N° dossier (ex: LAB-2026-0001), analyse..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-700 focus:border-slate-800"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending_sampling">En attente de prélèvement</option>
            <option value="in_progress">En cours d'analyse</option>
            <option value="results_entered">À valider par Biologiste</option>
            <option value="validated">Validés / Signés</option>
          </select>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-700 focus:border-slate-800"
          >
            <option value="all">Tous les départements</option>
            <option value="Biochimie">Biochimie</option>
            <option value="Hématologie">Hématologie</option>
            <option value="Sérologie">Sérologie &amp; Immunologie</option>
            <option value="Microbiologie">Microbiologie</option>
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50/50">
            <Microscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">Aucun examen trouvé</h3>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-[15%]">Dossier / Date</th>
                  <th className="py-2.5 px-3 w-[22%]">Patient &amp; Prescripteur</th>
                  <th className="py-2.5 px-3 w-[25%] hidden sm:table-cell">Examens Demandés</th>
                  <th className="py-2.5 px-3 w-[14%]">Statut</th>
                  <th className="py-2.5 px-3 w-[12%] hidden lg:table-cell">Intervenants</th>
                  <th className="py-2.5 px-3 text-right w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((order) => {
                  const hasCritical = order.parameters?.some((p) => p.is_critical || checkPanicValue(p.name, p.value).isCritical);
                  const hasAbnormal = order.parameters?.some((p) => p.is_abnormal);
                  return (
                    <tr key={order.id} className={`transition ${hasCritical ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/70'}`}>
                      <td className="py-2.5 px-3 font-mono truncate">
                        <div className="font-bold text-slate-900 truncate" title={order.order_number}>{order.order_number}</div>
                        <div className="text-[10px] text-slate-500 truncate">{order.sampling_date?.replace('T', ' ').substring(0, 16)}</div>
                      </td>

                      <td className="py-2.5 px-3 truncate">
                        <div className="font-bold text-slate-900 truncate" title={order.partner_name}>{order.partner_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {order.patient_gender === 'M' ? 'H' : 'F'}, {order.patient_age || '--'} ans • {order.prescribing_doctor || 'Direct'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 hidden sm:table-cell truncate">
                        <div className="font-bold text-slate-800 truncate flex items-center gap-1.5" title={order.exam_names.join(', ')}>
                          <span>{order.exam_names.join(', ')}</span>
                          {hasCritical && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Urgence Vitale
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5 truncate">
                          <span className="font-medium text-slate-700 truncate">{order.department}</span>
                          <span>•</span>
                          <span>{order.parameters?.length || 0} param.</span>
                          {hasAbnormal && !hasCritical && (
                            <span className="text-rose-600 font-bold ml-1 truncate">
                              • Hors normes
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-2.5 px-3 text-[10px] hidden lg:table-cell truncate">
                        <div className="text-slate-700 truncate">
                          <span className="text-slate-400">Tech:</span> {order.technician_name || 'En cours'}
                        </div>
                        {order.validated_by_doctor && (
                          <div className="text-emerald-700 font-semibold truncate">
                            <span className="text-slate-400">Validé:</span> {order.validated_by_doctor}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(order)}
                          className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 font-bold text-[11px] text-slate-800 transition inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3 text-slate-600" />
                          <span>{isBiologist ? 'Valider' : 'Saisir'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderForPrint(order)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition inline-flex items-center border border-slate-200"
                          title="Imprimer le compte-rendu"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="dossiers d'analyses"
        />
      </div>

      {/* Modal: Saisie des résultats / Validation biologique */}
      {selectedOrderForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Microscope className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Saisie &amp; Validation des Résultats Biologiques
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dossier {selectedOrderForEdit.order_number} • Patient : {selectedOrderForEdit.partner_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForEdit(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Patient Info Summary Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient</span>
                  <span className="font-bold text-slate-900">{selectedOrderForEdit.partner_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Prescripteur</span>
                  <span className="font-semibold text-slate-800">{selectedOrderForEdit.prescribing_doctor || 'Non spécifié'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date Prélèvement</span>
                  <span className="font-semibold text-slate-800">{selectedOrderForEdit.sampling_date?.replace('T', ' ').substring(0, 16)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Statut Actuel</span>
                  {getStatusBadge(selectedOrderForEdit.status)}
                </div>
              </div>

              {/* Parameters Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Paramètres d'Analyse &amp; Valeurs Mesurées
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCustomParam}
                    className="text-xs text-slate-700 font-bold hover:underline flex items-center space-x-1"
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
                        <th className="py-2 px-3 text-center">Alerte Norme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parametersState.map((param, idx) => {
                        const panic = checkPanicValue(param.name, param.value);
                        const isCrit = param.is_critical || panic.isCritical;
                        const alertMsg = param.critical_alert || panic.message;

                        return (
                          <tr
                            key={param.id || idx}
                            className={isCrit ? 'bg-rose-100/60' : param.is_abnormal ? 'bg-rose-50/50' : 'hover:bg-slate-50'}
                          >
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              <div>{param.name}</div>
                              {isCrit && (
                                <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>{alertMsg || 'Valeur critique / Urgence vitale'}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={param.value}
                                onChange={(e) => handleParamValueChange(idx, e.target.value)}
                                placeholder="Valeur du résultat"
                                className={`w-full px-2.5 py-1 border rounded text-xs font-bold ${
                                  isCrit
                                    ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500 ring-1 ring-rose-400'
                                    : param.is_abnormal
                                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                    : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900'
                                } focus:outline-none`}
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                              {param.unit}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {param.reference_range}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleParamAbnormal(idx)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 transition ${
                                  isCrit
                                    ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                                    : param.is_abnormal
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                                title="Cliquer pour basculer l'alerte"
                              >
                                {isCrit ? (
                                  <>
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>CRITIQUE</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={`w-1.5 h-1.5 rounded-full ${param.is_abnormal ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                                    <span>{param.is_abnormal ? 'Anormal' : 'Normal'}</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Biologist's Conclusion */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Conclusion &amp; Avis Médical du Biologiste
                </label>
                <textarea
                  rows={3}
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  placeholder="Conclusion médicale et interprétation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrderForEdit(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-bold transition"
              >
                Annuler
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveResults(false)}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-md text-xs font-bold transition"
                >
                  <Save className="w-3.5 h-3.5 inline mr-1" />
                  <span>Enregistrer les mesures</span>
                </button>

                {isBiologist && (
                  <button
                    type="button"
                    onClick={() => handleSaveResults(true)}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5 inline mr-1 stroke-[3]" />
                    <span>Valider &amp; Signer Biologiquement</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Lab Order */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold">Nouvelle Prescription d'Examen de Laboratoire</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient *
                </label>
                <select
                  value={newPartnerId}
                  onChange={(e) => setNewPartnerId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:border-slate-900"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sexe
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:border-slate-900"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Âge (années)
                  </label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    min={0}
                    max={120}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Département d'Analyse
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:border-slate-900"
                >
                  <option value="Biochimie">Biochimie Médicale</option>
                  <option value="Hématologie">Hématologie &amp; Numération (NFS)</option>
                  <option value="Sérologie & Immunologie">Sérologie &amp; Immunologie</option>
                  <option value="Parasitologie">Parasitologie &amp; Urines</option>
                  <option value="Microbiologie">Microbiologie &amp; Antibiogramme</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Intitulé de l'Examen ou du Bilan *
                </label>
                <input
                  type="text"
                  required
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="Rechercher une analyse..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Médecin Prescripteur
                </label>
                <input
                  type="text"
                  value={newPrescriber}
                  onChange={(e) => setNewPrescriber(e.target.value)}
                  placeholder="Nom du prescripteur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-xs shadow-xs"
                >
                  Créer le Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Bulletin d'Analyses Médicales Print Preview */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 flex flex-col">
            {/* Action Bar */}
            <div className="p-3.5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="font-black text-xs uppercase tracking-tight text-slate-800">
                  Compte-Rendu d'Analyses Biologiques • {selectedOrderForPrint.order_number}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-md text-xs font-black transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForPrint(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Bulletin Document */}
            <div ref={printRef} className="p-8 bg-white text-slate-900 space-y-5 max-h-[75vh] overflow-y-auto print:p-0 print:max-h-none">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center space-x-3.5">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-14 h-14 object-contain rounded border border-slate-200 p-1"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-slate-900 text-white font-black flex items-center justify-center text-xl shadow-xs">
                      {company.name ? company.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                  )}

                  <div>
                    <h1 className="text-base font-black text-slate-900 tracking-tight uppercase">
                      {company.name || 'LABORATOIRE DE BIOLOGIE MÉDICALE'}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      {company.slogan || 'Analyses Médicales & Biologie Spécialisée'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {company.address}, {company.city} • Tél : {company.phone} • Email : {company.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 border border-slate-300 rounded text-xs font-bold uppercase tracking-wider bg-slate-50">
                    Bulletin d'Analyses
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                    N° {selectedOrderForPrint.order_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date : {selectedOrderForPrint.sampling_date?.replace('T', ' ').substring(0, 16)}
                  </div>
                </div>
              </div>

              {/* Patient & Prescription Box */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Patient</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedOrderForPrint.partner_name}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    Genre : {selectedOrderForPrint.patient_gender === 'M' ? 'Masculin' : 'Féminin'} • Âge : {selectedOrderForPrint.patient_age || '--'} ans
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Prescripteur</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedOrderForPrint.prescribing_doctor || 'Consultation Externe'}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Département : {selectedOrderForPrint.department}
                  </div>
                </div>
              </div>

              {/* Biological Results Table */}
              <div className="space-y-2">
                <div className="px-3 py-1.5 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {selectedOrderForPrint.exam_names.join(' & ')}
                </div>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                      <th className="py-2 px-3">Paramètre Biologique</th>
                      <th className="py-2 px-3 text-right">Résultat</th>
                      <th className="py-2 px-3">Unité</th>
                      <th className="py-2 px-3">Valeurs de Référence</th>
                      <th className="py-2 px-3 text-center">Interprétation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {selectedOrderForPrint.parameters?.map((p, idx) => {
                      const panic = checkPanicValue(p.name, p.value);
                      const isCrit = p.is_critical || panic.isCritical;
                      const alertMsg = p.critical_alert || panic.message;

                      return (
                        <tr key={idx} className={isCrit ? 'bg-rose-100/60' : p.is_abnormal ? 'bg-rose-50/50' : ''}>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div>{p.name}</div>
                            {isCrit && (
                              <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>{alertMsg || 'Alerte critique vitale'}</span>
                              </div>
                            )}
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-mono font-bold ${
                              isCrit ? 'text-rose-700 text-sm' : p.is_abnormal ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {p.value || '--'}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{p.unit}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{p.reference_range}</td>
                          <td className="py-2 px-3 text-center text-[10px] font-bold">
                            {isCrit ? (
                              <span className="text-white bg-rose-600 px-2 py-0.5 rounded font-black">
                                ● CRITIQUE
                              </span>
                            ) : p.is_abnormal ? (
                              <span className="text-rose-600 font-bold">● ANORMAL</span>
                            ) : (
                              <span className="text-emerald-700">Normal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Biologist's Conclusion */}
              {selectedOrderForPrint.conclusion && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
                  <span className="font-bold text-slate-900 uppercase text-[10px] block">
                    Conclusion Médicale :
                  </span>
                  <p className="text-slate-700 mt-1 italic leading-relaxed">
                    « {selectedOrderForPrint.conclusion} »
                  </p>
                </div>
              )}

              {/* Signatures & Seal */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Technicien Manipulateur</div>
                  <div className="font-semibold text-slate-800 mt-1">
                    {selectedOrderForPrint.technician_name || 'Équipe Technique Labo'}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Le Médecin Biologiste</div>
                  <div className="font-bold text-slate-900 mt-1">
                    {selectedOrderForPrint.validated_by_doctor || 'Dr. Touré (Biologiste Médical)'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Matricule : BIO-CI-2024-94
                  </div>

                  {/* Stamp / Signature Box */}
                  <div className="mt-2 w-32 h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                    Cachet / Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
