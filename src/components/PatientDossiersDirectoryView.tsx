import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  User,
  Calendar,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Activity,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  FileText,
  Printer,
  TrendingUp,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { ResPartner, AccountMove, CompanySettings, LabExamOrder } from '../types';
import { decodeScannerInput, getNumericKey } from '../lib/scannerDecoder';
import { formatDateTimeDDMMYYYY, formatDateDDMMYYYY } from '../utils/dateUtils';

interface PatientDossiersDirectoryViewProps {
  partners: ResPartner[];
  moves: AccountMove[];
  labOrders: LabExamOrder[];
  company: CompanySettings;
  onOpenPdf: (move: AccountMove) => void;
}

export const PatientDossiersDirectoryView: React.FC<PatientDossiersDirectoryViewProps> = ({
  partners = [],
  moves = [],
  labOrders = [],
  company,
  onOpenPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'all' | 'clinical' | 'billing'>('all');

  // Filter only patients
  const patients = useMemo(() => {
    return partners.filter((p) => p.partner_type === 'patient' || p.customer_rank > 0);
  }, [partners]);

  // Filter patients based on search (Name, NDM, Phone, Insurance)
  const filteredPatients = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ) return patients;

    // Decode the query in case it is scanned with AZERTY layout issue
    const decodedQ = decodeScannerInput(rawQ).toLowerCase();
    const numericQ = getNumericKey(rawQ);

    return patients.filter((p) => {
      // 1. Direct name match with original or decoded search
      const pName = (p.name || '').toString().toLowerCase();
      const nameMatch = 
        pName.includes(rawQ) || 
        pName.includes(decodedQ);

      // 2. Direct NDM code match
      const ndmMatch = p.ndm ? (
        (p.ndm || '').toString().toLowerCase().includes(rawQ) || 
        (p.ndm || '').toString().toLowerCase().includes(decodedQ)
      ) : false;

      // 3. Phone number match
      const phoneMatch = p.phone ? (
        (p.phone || '').toString().toLowerCase().includes(rawQ) || 
        (p.phone || '').toString().toLowerCase().includes(decodedQ)
      ) : false;

      // 4. Insurance / Tiers-payeur match
      const insuranceMatch = p.insurance_name ? (
        (p.insurance_name || '').toString().toLowerCase().includes(rawQ) || 
        (p.insurance_name || '').toString().toLowerCase().includes(decodedQ)
      ) : false;

      // 5. Robust numeric digits match (handles formatting and partial key input perfectly)
      const pNumericNdm = p.ndm ? (p.ndm || '').toString().replace(/[^0-9]/g, '') : '';
      const numericNdmMatch = pNumericNdm && numericQ ? pNumericNdm.includes(numericQ) : false;

      return nameMatch || ndmMatch || phoneMatch || insuranceMatch || numericNdmMatch;
    });
  }, [patients, searchQuery]);

  // Auto-select first patient if none selected
  const activePatient = useMemo(() => {
    if (selectedPatientId !== null) {
      const found = patients.find((p) => p.id === selectedPatientId);
      if (found) return found;
    }
    return filteredPatients[0] || null;
  }, [filteredPatients, selectedPatientId, patients]);

  // Stats
  const totalPatientsCount = patients.length;
  const totalInvoicesCount = moves.length;
  const totalLabOrdersCount = labOrders.length;

  // Active patient data
  const patientMoves = useMemo(() => {
    if (!activePatient) return [];
    return moves.filter((m) => m.partner_id === activePatient.id || m.partner?.id === activePatient.id);
  }, [activePatient, moves]);

  const patientLabOrders = useMemo(() => {
    if (!activePatient) return [];
    return labOrders.filter(
      (o) => o.partner_id === activePatient.id || o.patient_name === activePatient.name || (o as any).patient_id === activePatient.id
    );
  }, [activePatient, labOrders]);

  // Build chronological synchronized timeline of all prestations (clinical exam orders + billing moves)
  const unifiedTimeline = useMemo(() => {
    if (!activePatient) return [];

    const timelineItems: Array<{
      id: string | number;
      type: 'invoice' | 'lab_order' | 'creation';
      date: string;
      title: string;
      subtitle: string;
      status: string;
      statusLabel: string;
      statusColor: string;
      amount?: number;
      details?: any;
    }> = [];

    // 1. Dossier creation point
    if (activePatient.create_date || activePatient.write_date) {
      timelineItems.push({
        id: 'creation',
        type: 'creation',
        date: activePatient.create_date || activePatient.write_date || new Date().toISOString(),
        title: 'Création du Dossier Patient',
        subtitle: `Enregistrement du dossier NDM : ${activePatient.ndm || 'Généré automatiquement'}`,
        status: 'done',
        statusLabel: 'Enregistré',
        statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      });
    }

    // 2. Add Invoices
    patientMoves.forEach((move) => {
      const isPaid = move.payment_state === 'paid' || move.state === 'posted' && move.amount_residual === 0;
      timelineItems.push({
        id: `invoice-${move.id}`,
        type: 'invoice',
        date: move.invoice_date || move.date || new Date().toISOString(),
        title: `Facture / Prestation ${move.name || `PROV-${move.id}`}`,
        subtitle: move.invoice_line_ids?.map((l) => l.name).join(', ') || 'Actes médicaux et analyses',
        status: move.payment_state || 'draft',
        statusLabel: isPaid ? 'Réglé' : move.state === 'draft' ? 'Brouillon' : 'En Attente',
        statusColor: isPaid
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : move.state === 'draft'
          ? 'bg-slate-50 text-slate-700 border-slate-200'
          : 'bg-amber-50 text-amber-700 border-amber-200',
        amount: move.amount_total,
        details: move,
      });
    });

    // 3. Add Lab Orders
    patientLabOrders.forEach((order) => {
      timelineItems.push({
        id: `lab-${order.id}`,
        type: 'lab_order',
        date: order.created_at || new Date().toISOString(),
        title: `Examen Clinique LIMS / Prélèvement`,
        subtitle: `Département : ${order.department || 'Général'} | SID : ${order.id}`,
        status: order.status,
        statusLabel: order.status === 'validated' ? 'Validé (Résultats dispos)' : order.status === 'in_progress' ? 'Échantillonné / En cours' : 'Brouillon',
        statusColor:
          order.status === 'validated'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : order.status === 'in_progress'
            ? 'bg-sky-50 text-sky-700 border-sky-200'
            : 'bg-slate-50 text-slate-700 border-slate-200',
        details: order,
      });
    });

    // Sort chronologically (newest first)
    return timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activePatient, patientMoves, patientLabOrders]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return formatDateTimeDDMMYYYY(dateStr);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + (company?.currency_symbol || 'FCFA');
  };

  return (
    <div className="space-y-6">
      {/* Upper Stats Overview - 100% Human & Clean Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200 shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dossiers</p>
            <h4 className="text-xl font-black text-slate-900 mt-0.5">{totalPatientsCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Analyses Enregistrées</p>
            <h4 className="text-xl font-black text-slate-900 mt-0.5">{totalLabOrdersCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Facturations Émises</p>
            <h4 className="text-xl font-black text-slate-900 mt-0.5">{totalInvoicesCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contrôle &amp; Traçabilité</p>
            <h4 className="text-xs font-bold text-slate-800 mt-1">Conformité JJ/MM/AAAA</h4>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side Directory, Right Side Unified Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quick Patient List Directory (1/3) */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col h-[650px]">
          {/* Header Search with Scanner Note */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-2.5">
            <div>
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Répertoire des Dossiers</h3>
              <p className="text-[10px] text-slate-400">Sélectionnez un patient pour voir son dossier clinique</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Scanner Code Reçu / Nom / NDM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(decodeScannerInput(e.target.value))}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Scanning Tip */}
            <div className="bg-indigo-50/50 border border-indigo-100/60 p-2 rounded-xl text-[10px] text-indigo-800 font-medium flex items-center space-x-1.5 leading-tight">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
              <span>Prêt pour scanner : Code-barres ou QR de reçu/étiquette</span>
            </div>
          </div>

          {/* Directory List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <User className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aucun dossier trouvé</p>
                <p className="text-[10px] text-slate-400 mt-1">Aucun patient ne correspond à vos critères.</p>
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isActive = activePatient && activePatient.id === p.id;
                const matchesCount = moves.filter((m) => m.partner_id === p.id).length;
                const labCount = labOrders.filter((o) => o.partner_id === p.id).length;

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left p-3.5 flex items-center justify-between transition ${
                      isActive ? 'bg-slate-50 border-l-4 border-slate-900 pl-2.5' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-slate-900 text-xs truncate block max-w-[150px]">
                          {p.name}
                        </span>
                        {p.gender && (
                          <span className={`text-[8px] font-black px-1 py-0.2 rounded shrink-0 uppercase ${
                            p.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}>
                            {p.gender}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-slate-500">
                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-mono text-[9px]">
                          NDM: {p.ndm || 'N/A'}
                        </span>
                        {p.phone && <span className="truncate">{p.phone}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      <div className="flex flex-col items-end space-y-0.5 text-[9px] font-bold text-slate-400">
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md">
                          {labCount} Ana
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-md">
                          {matchesCount} Fac
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition ${isActive ? 'translate-x-0.5 text-slate-800' : ''}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Patient Unified Chronological Timeline (2/3) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col h-[650px]">
          {activePatient ? (
            <>
              {/* Detailed Active Patient Demographics Bar */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {activePatient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-sm tracking-tight">{activePatient.name}</h3>
                      <span className="text-[10px] font-mono font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                        NDM: {activePatient.ndm || 'Non assigné'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 mt-1">
                      {activePatient.gender && (
                        <span className="bg-slate-200/50 px-2 py-0.5 rounded text-slate-700">
                          Sexe : {activePatient.gender === 'M' ? 'Masculin' : activePatient.gender === 'F' ? 'Féminin' : activePatient.gender}
                        </span>
                      )}
                      {activePatient.phone && (
                        <span className="bg-slate-200/50 px-2 py-0.5 rounded text-slate-700">
                          Tél : {activePatient.phone}
                        </span>
                      )}
                      {activePatient.insurance_name && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded">
                          Tiers-payeur : {activePatient.insurance_name} ({activePatient.insurance_coverage_rate || 80}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Print Dossier Button */}
                <div className="flex space-x-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      // Trigger normal print dialog by isolating this container
                      const timelineElement = document.getElementById('unified-dossier-timeline-print-target');
                      if (timelineElement) {
                        import('../lib/printUtils').then(({ printElement }) => {
                          printElement(timelineElement, `Dossier_Patient_${activePatient.ndm || activePatient.id}`);
                        });
                      }
                    }}
                    className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer Dossier</span>
                  </button>
                </div>
              </div>

              {/* Timeline Filters and Content - 100% Human & Clean */}
              <div className="flex border-b border-slate-200 px-5 bg-white py-2.5 gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveHistoryTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    activeHistoryTab === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Tout l'Historique ({unifiedTimeline.length})
                </button>
                <button
                  onClick={() => setActiveHistoryTab('clinical')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    activeHistoryTab === 'clinical'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Analyses Cliniques ({patientLabOrders.length})
                </button>
                <button
                  onClick={() => setActiveHistoryTab('billing')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    activeHistoryTab === 'billing'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Factures &amp; Reçus ({patientMoves.length})
                </button>
              </div>

              {/* Chronological Unified Timeline Wrapper */}
              <div id="unified-dossier-timeline-print-target" className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                  {unifiedTimeline
                    .filter((item) => {
                      if (activeHistoryTab === 'clinical') return item.type === 'lab_order' || item.type === 'creation';
                      if (activeHistoryTab === 'billing') return item.type === 'invoice' || item.type === 'creation';
                      return true;
                    })
                    .map((item, idx) => {
                      return (
                        <div key={item.id} className="relative group">
                          {/* Chronological Circle Indicator */}
                          <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                            item.type === 'creation' 
                              ? 'bg-emerald-500' 
                              : item.type === 'invoice' 
                              ? 'bg-emerald-500' 
                              : 'bg-indigo-600'
                          }`}>
                            {item.type === 'creation' ? (
                              <UserCheck className="w-2.5 h-2.5 text-white" />
                            ) : item.type === 'invoice' ? (
                              <Coins className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <Activity className="w-2.5 h-2.5 text-white animate-pulse" />
                            )}
                          </span>

                          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition hover:bg-slate-50/80 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 font-bold block">
                                  {formatDate(item.date)}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-xs">
                                  {item.title}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                {item.amount !== undefined && (
                                  <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                                    {formatCurrency(item.amount)}
                                  </span>
                                )}
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${item.statusColor}`}>
                                  {item.statusLabel}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              {item.subtitle}
                            </p>

                            {/* Inner Actions Detail / Prestation Specific Render */}
                            {item.type === 'invoice' && item.details && (
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 mt-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Ligne de Facture / ERP
                                </span>
                                <button
                                  onClick={() => onOpenPdf(item.details)}
                                  className="flex items-center space-x-1 text-[10px] font-black text-indigo-600 hover:text-indigo-800 no-print"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Imprimer le reçu</span>
                                </button>
                              </div>
                            )}

                            {item.type === 'lab_order' && item.details && (
                              <div className="border-t border-slate-200/50 pt-2 mt-2 space-y-2">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">
                                  Résultats d'Analyses Biologiques :
                                </span>

                                {item.details.results && item.details.results.length > 0 ? (
                                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                                    <table className="min-w-full divide-y divide-slate-200 text-[10px] bg-white">
                                      <thead className="bg-slate-100 text-slate-500 font-bold">
                                        <tr>
                                          <th className="px-3 py-1 text-left">Analyse</th>
                                          <th className="px-3 py-1 text-center">Valeur</th>
                                          <th className="px-3 py-1 text-left">Norme</th>
                                          <th className="px-3 py-1 text-center">État</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-150">
                                        {item.details.results.map((res: any, idx: number) => {
                                          const isAbnormal = res.status === 'abnormal' || res.status === 'high' || res.status === 'low';
                                          return (
                                            <tr key={idx} className={isAbnormal ? 'bg-rose-50/50' : undefined}>
                                              <td className="px-3 py-1 font-bold text-slate-800">{res.test_name}</td>
                                              <td className="px-3 py-1 text-center font-extrabold text-slate-900">{res.value} {res.unit}</td>
                                              <td className="px-3 py-1 text-slate-500 font-mono font-semibold">{res.reference_range}</td>
                                              <td className="px-3 py-1 text-center">
                                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                                                  isAbnormal 
                                                    ? 'bg-rose-100 text-rose-800' 
                                                    : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                  {isAbnormal ? 'ANORMAL' : 'NORMAL'}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 font-medium italic">
                                    Saisie des résultats en cours ou en attente d'échantillonnage.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <FolderOpen className="w-16 h-16 text-slate-300 mb-3 animate-bounce" />
              <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">Aucun dossier patient actif</h3>
              <p className="text-slate-400 text-xs max-w-sm mt-1">
                Sélectionnez un patient dans la colonne de gauche ou scannez un reçu pour charger instantanément son dossier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
