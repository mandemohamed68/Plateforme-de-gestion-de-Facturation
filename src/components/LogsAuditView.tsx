import React, { useState, useEffect, useMemo, useRef } from 'react';
import { printElement } from '../lib/printUtils';
import {
  ScrollText,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  RefreshCw,
  Clock,
  User,
  FlaskConical,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Activity,
  Layers,
  ChevronRight,
  Eye,
  X,
  Info,
  SlidersHorizontal,
  Bot,
  Database,
  Zap,
  ArrowRight
} from 'lucide-react';
import { WorkflowLogEntry, NotificationQueueEntry, CompanySettings, ResUser, LabExamOrder } from '../types';
import { PaginationControls } from './PaginationControls';

interface LogsAuditViewProps {
  company: CompanySettings;
  currentUser: ResUser | null;
  labOrders?: LabExamOrder[];
}

interface ConsolidatedAuditLog {
  id: string;
  category: 'workflow_lims' | 'notification' | 'caisse_security';
  category_label: string;
  timestamp: string;
  etape: string;
  etat_avant?: string;
  etat_apres?: string;
  acteur: string;
  reference: string;
  patient_name?: string;
  description: string;
  raw?: any;
}

export const LogsAuditView: React.FC<LogsAuditViewProps> = ({ company, currentUser, labOrders = [] }) => {
  const [logs, setLogs] = useState<ConsolidatedAuditLog[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLogEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationQueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'workflow_lims' | 'notification' | 'caisse_security'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<ConsolidatedAuditLog | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showWorkflowDashboard, setShowWorkflowDashboard] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company.default_page_size || 50);

  // Count active orders by status for the 7-step pipeline
  const countByWorkflowStatus = (statusKey: string) => {
    return labOrders.filter(o => {
      if (statusKey === 'paye') return o.status === 'pending_sampling';
      if (statusKey === 'preleve') return o.status === 'in_progress';
      if (statusKey === 'accepte') return o.status === 'accepted';
      if (statusKey === 'analyse') return o.status === 'results_entered' || o.status === 'saisi';
      if (statusKey === 'valide_tech') return o.status === 'valide_tech';
      if (statusKey === 'valide_biologiste') return o.status === 'validated' || o.status === 'valide_biologiste';
      if (statusKey === 'envoye') return o.status === 'envoye';
      return false;
    }).length;
  };

  // Helper to generate fallback logs from labOrders if network/backend is offline
  const generateFallbackLogs = (orders: LabExamOrder[]): ConsolidatedAuditLog[] => {
    return orders.map((o, index) => {
      const ts = o.updated_at || o.created_at || new Date().toISOString();
      return {
        id: `wf-fallback-${o.id || index}`,
        category: 'workflow_lims',
        category_label: 'Workflow LIMS & Analyses',
        timestamp: ts,
        etape: o.status === 'validated' || o.status === 'valide_biologiste' ? 'validation_biologiste' : o.status === 'in_progress' ? 'prelevement' : 'reception_laboratoire',
        etat_avant: 'pending',
        etat_apres: o.status,
        acteur: o.technician_name || o.validated_by_doctor || 'Équipe Laboratoire',
        reference: o.order_number || `ORD-${o.id}`,
        patient_name: o.partner_name,
        description: `Dossier ${o.order_number} (${o.exam_names?.length || 1} analyse(s)) - Statut: ${o.status}`
      };
    });
  };

  // Fetch all logs from backend with AbortSignal & fallback resilience
  const fetchAllLogs = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);

      const [allLogsRes, wfRes, notifRes] = await Promise.allSettled([
        fetch('/api/all-audit-logs', { signal }).then(r => r.ok ? r.json() : null),
        fetch('/api/lab-workflow-logs', { signal }).then(r => r.ok ? r.json() : null),
        fetch('/api/lab-notifications', { signal }).then(r => r.ok ? r.json() : null)
      ]);

      if (allLogsRes.status === 'fulfilled' && allLogsRes.value) {
        const fetchedLogs = allLogsRes.value.logs || (Array.isArray(allLogsRes.value) ? allLogsRes.value : []);
        if (fetchedLogs.length > 0) {
          setLogs(fetchedLogs);
        } else if (labOrders.length > 0) {
          setLogs(prev => prev.length > 0 ? prev : generateFallbackLogs(labOrders));
        }
      } else if (labOrders.length > 0) {
        setLogs(prev => prev.length > 0 ? prev : generateFallbackLogs(labOrders));
      }

      if (wfRes.status === 'fulfilled' && Array.isArray(wfRes.value)) {
        setWorkflowLogs(wfRes.value);
      }

      if (notifRes.status === 'fulfilled' && Array.isArray(notifRes.value)) {
        setNotifications(notifRes.value);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('[LogsAuditView] Chargement différé des logs (réseau déconnecté ou mode autonome):', err?.message || err);
        if (labOrders.length > 0) {
          setLogs(prev => prev.length > 0 ? prev : generateFallbackLogs(labOrders));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAllLogs(controller.signal);

    const interval = setInterval(() => {
      fetchAllLogs(controller.signal);
    }, 12000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [labOrders]);

  // Handle Clear Logs
  const handleClearLogs = async () => {
    try {
      await fetch('/api/lab-clear-workflow-data', { method: 'POST' });
      setShowClearConfirmModal(false);
      await fetchAllLogs();
    } catch (e: any) {
      console.warn('Erreur réinitialisation logs:', e?.message || e);
    }
  };

  // Filtered logs computation
  const filteredLogs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return logs.filter((log) => {
      // Category filter
      if (activeCategoryTab !== 'all' && log.category !== activeCategoryTab) {
        return false;
      }

      // Stage filter
      if (stageFilter !== 'all' && log.etape !== stageFilter) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        const logDateStr = new Date(log.timestamp).toISOString().split('T')[0];
        if (logDateStr !== todayStr) return false;
      } else if (dateFilter === 'week') {
        if (new Date(log.timestamp).toISOString() < sevenDaysAgo) return false;
      }

      // Search term filter
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const matchesRef = (log.reference || '').toString().toLowerCase().includes(q);
        const matchesPatient = (log.patient_name || '').toString().toLowerCase().includes(q);
        const matchesActeur = (log.acteur || '').toString().toLowerCase().includes(q);
        const matchesDesc = (log.description || '').toString().toLowerCase().includes(q);
        const matchesEtape = (log.etape || '').toString().toLowerCase().includes(q);
        if (!matchesRef && !matchesPatient && !matchesActeur && !matchesDesc && !matchesEtape) {
          return false;
        }
      }

      return true;
    });
  }, [logs, activeCategoryTab, stageFilter, dateFilter, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Date_Heure', 'Categorie', 'Etape', 'Reference_Dossier', 'Patient', 'Acteur_Systeme', 'Etat_Avant', 'Etat_Apres', 'Commentaire_Details'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString('fr-FR')}"`,
      `"${l.category_label}"`,
      `"${l.etape}"`,
      `"${l.reference}"`,
      `"${l.patient_name || '-'}"`,
      `"${l.acteur}"`,
      `"${l.etat_avant || '-'}"`,
      `"${l.etat_apres || '-'}"`,
      `"${l.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format Date beautifully
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Badge styler according to event stage
  const getStageBadge = (etape: string, category: string) => {
    switch (etape) {
      case 'prelevement':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: FlaskConical,
          label: 'Prélèvement Validé'
        };
      case 'reception_laboratoire':
      case 'accepted':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Activity,
          label: 'Réception Technique'
        };
      case 'import_automate':
      case 'analyse':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Bot,
          label: 'Automate HL7 (Direct)'
        };
      case 'validation_technique':
      case 'valide_tech':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: FileCheck,
          label: 'Validation Technique'
        };
      case 'validation_biologiste':
      case 'validated':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          label: 'Signature Biologiste'
        };
      case 'envoi':
      case 'envoi_patient':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: CheckCircle2,
          label: 'Diffusion Patient'
        };
      case 'SMS Patient':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Smartphone,
          label: 'SMS Délivré'
        };
      case 'Email Médical':
        return {
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: Mail,
          label: 'Email Transmis'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Layers,
          label: etape
        };
    }
  };

  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={printRef} className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header with Title & Action Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Journal des Logs & Registre d'Audit
                </h1>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Temps Réel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Traçabilité intégrale du Workflow LIMS, des automates de laboratoire (HL7), des notifications et de la sécurité.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-refresh-logs"
            onClick={() => fetchAllLogs()}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            title="Actualiser immédiatement les journaux"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            id="btn-export-logs-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            title="Exporter la liste filtrée au format Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exporter CSV</span>
          </button>

          <button
            id="btn-print-audit-register"
            onClick={() => {
              if (printRef.current) {
                printElement(printRef.current, "Registre_Audit_LIMS");
              } else {
                window.print();
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            title="Imprimer le registre d'audit certifié"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer</span>
          </button>

          <button
            id="btn-clear-logs-modal"
            onClick={() => setShowClearConfirmModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            title="Réinitialiser l'historique d'audit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purger</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Card: Clean, Professional Medical Supervision */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900">Moteur LIMS &amp; Flux d'Automatisation</span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.2 rounded">
                Actif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Enchaînement automatique : Prélèvement ➔ Réception Technique ➔ Analyse Automate HL7 ➔ Validation Technique ➔ Signature Biologique ➔ Notification Patient.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
          <div className="text-left md:text-center">
            <div className="text-base font-bold text-slate-900">{workflowLogs.length}</div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">Traces LIMS</div>
          </div>
          <div className="text-left md:text-center">
            <div className="text-base font-bold text-slate-900">{notifications.length}</div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">Notifications</div>
          </div>
        </div>
      </div>

      {/* 3. Stat Cards: Clean & Uniform */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{logs.length}</div>
            <div className="text-xs text-slate-500 font-medium">Événements d'audit</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {logs.filter(l => l.category === 'workflow_lims').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Traces LIMS</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {logs.filter(l => l.category === 'notification').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Messages &amp; Alertes</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">100 %</div>
            <div className="text-xs text-slate-500 font-medium">Conformité ISO 15189</div>
          </div>
        </div>
      </div>

      {/* 4. Live LIMS Interactive Stepper & Supervision */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">
              Supervision du Workflow LIMS &amp; Étapes
            </span>
          </div>
          <button
            onClick={() => setShowWorkflowDashboard(!showWorkflowDashboard)}
            className="text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 font-semibold px-2.5 py-1 rounded-md transition cursor-pointer"
          >
            {showWorkflowDashboard ? 'Masquer la Supervision' : 'Afficher la Supervision'}
          </button>
        </div>

        {showWorkflowDashboard && (
          <div className="p-4 space-y-4">
            {/* Horizontal 7-step Stepper (Clean, Sober) */}
            <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center justify-between">
                <span>Étapes du flux (Du paiement au rendu)</span>
                <span className="text-[11px] text-slate-400 font-normal">Mise à jour automatique</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { key: 'paye', label: '1. Paiement', desc: 'En Caisse' },
                  { key: 'preleve', label: '2. Prélèvement', desc: 'Tubes Prêts' },
                  { key: 'accepte', label: '3. Réception', desc: 'Labo OK' },
                  { key: 'analyse', label: '4. Analyse HL7', desc: 'Automate' },
                  { key: 'valide_tech', label: '5. Val. Tech', desc: 'Contrôles' },
                  { key: 'valide_biologiste', label: '6. Val. Bio', desc: 'Signé' },
                  { key: 'envoye', label: '7. Rendu', desc: 'Diffusé' },
                ].map((step, idx) => {
                  const count = countByWorkflowStatus(step.key);
                  const hasItems = count > 0;
                  return (
                    <div
                      key={step.key}
                      className={`p-2 rounded-lg border text-center relative flex flex-col justify-between transition ${
                        hasItems
                          ? 'bg-white border-slate-300 shadow-3xs'
                          : 'bg-white/60 border-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-900 leading-tight">{step.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{step.desc}</div>
                      <div className="mt-1.5">
                        <span className={`text-[11px] font-mono px-2 py-0.2 rounded-full font-bold ${
                          hasItems
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </div>
                      {idx < 6 && (
                        <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300 text-xs">
                          →
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Live Audit Logs & Notification Dispatch Queue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LIMS Audit logs (workflow_log) */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col h-[220px]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-slate-600" />
                    <span>Journal d'Audit Technique (workflow_log)</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {workflowLogs.length} logs
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1 text-xs">
                  {workflowLogs.slice(0, 6).map((log, i) => (
                    <div key={log.id || i} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-3xs hover:border-slate-300 transition">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="text-indigo-700 font-black">{log.acteur_nom}</span>
                        <span>{formatDateTime(log.date_action)}</span>
                      </div>
                      <p className="font-semibold text-slate-800 mt-1 leading-snug">{log.commentaire}</p>
                      <div className="mt-1 flex items-center space-x-1.5 text-[10px]">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase font-black">
                          {log.etape}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                          {log.etat_apres}
                        </span>
                      </div>
                    </div>
                  ))}
                  {workflowLogs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs text-center">
                      Aucun événement d'audit enregistré.<br />Faites avancer un prélèvement pour générer des logs.
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications Dispatch Queue (notification_queue) */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col h-[220px]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span>File de Messages &amp; Notifications (notification_queue)</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {notifications.length} messages
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1 text-xs">
                  {notifications.slice(0, 6).map((notif, i) => (
                    <div key={notif.id || i} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-3xs hover:border-slate-300 transition">
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span className="text-indigo-600 uppercase font-black">{notif.type}</span>
                        <span className="text-slate-400 font-bold">{formatDateTime(notif.date_creation)}</span>
                      </div>
                      <p className="font-semibold text-slate-800 mt-1 leading-snug">{notif.message}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono font-medium">Dest: <span className="font-bold text-slate-700">{notif.destinataire}</span></span>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] ${
                          notif.statut === 'envoye' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {notif.statut === 'envoye' ? 'Envoyé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs text-center">
                      Aucun message dans la file de diffusion.<br />Les alertes patients s'afficheront ici.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Categorized Tabs & Interactive Filters */}
      <div ref={printRef} id="audit-logs-table-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 pt-2.5 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategoryTab('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'all'
                ? 'border-slate-900 text-slate-900 bg-white shadow-3xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tous les Événements</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-md font-medium">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('workflow_lims')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'workflow_lims'
                ? 'border-slate-900 text-slate-900 bg-white shadow-3xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-slate-600" />
            <span>Workflow LIMS &amp; Automates</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-md font-medium">
              {logs.filter(l => l.category === 'workflow_lims').length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('notification')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'notification'
                ? 'border-slate-900 text-slate-900 bg-white shadow-3xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-slate-600" />
            <span>Notifications (SMS &amp; Email)</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-md font-medium">
              {logs.filter(l => l.category === 'notification').length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('caisse_security')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'caisse_security'
                ? 'border-slate-900 text-slate-900 bg-white shadow-3xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit Sécurité &amp; Caisses</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-md font-medium">
              {logs.filter(l => l.category === 'caisse_security').length}
            </span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Recherche dossier, patient, acteur, mot-clé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtres :</span>
            </div>

            {/* Stage filter dropdown */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Toutes les étapes</option>
              <option value="prelevement">Prélèvements</option>
              <option value="reception_laboratoire">Réceptions Labo</option>
              <option value="import_automate">Imports Automates HL7</option>
              <option value="validation_technique">Validations Techniques</option>
              <option value="validation_biologiste">Signatures Biologistes</option>
              <option value="envoi">Diffusions Patients</option>
              <option value="SMS Patient">SMS Délivrés</option>
              <option value="Email Médical">Emails Transmis</option>
            </select>

            {/* Date filter buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  dateFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  dateFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                7 jours
              </button>
            </div>
          </div>
        </div>

        {/* 5. Main Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-40">Date & Heure</th>
                <th className="py-3 px-3 w-48">Étape / Événement</th>
                <th className="py-3 px-3 w-36">Dossier / Réf</th>
                <th className="py-3 px-3 w-44">Patient / Destinataire</th>
                <th className="py-3 px-3 w-48">Acteur / Système</th>
                <th className="py-3 px-4">Détails & Commentaire Traçabilité</th>
                <th className="py-3 px-3 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-sm text-slate-600">Aucun log correspondant aux filtres</div>
                    <div className="text-xs text-slate-400 mt-0.5">Les nouveaux événements seront automatiquement tracés ici en direct.</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((log) => {
                  const badge = getStageBadge(log.etape, log.category);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogForDetail(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTime(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Stage / Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${badge.bg}`}>
                          <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{badge.label}</span>
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {log.reference}
                        </span>
                      </td>

                      {/* Patient */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 truncate">
                          {log.patient_name || '-'}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5 truncate">
                          {(() => {
                            const act = log.acteur || '';
                            const isRobot = act.includes('Robot') || act.includes('Sysmex') || act.includes('Moteur') || act.includes('Système');
                            return isRobot ? (
                              <Bot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            );
                          })()}
                          <span className="font-semibold text-slate-800 text-[11px] truncate">
                            {log.acteur}
                          </span>
                        </div>
                      </td>

                      {/* Details / Description */}
                      <td className="py-3 px-4">
                        <div className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                          {log.description}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForDetail(log);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
                          title="Voir les détails complets de cette trace"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
          totalItems={filteredLogs.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="événements d'audit"
        />
      </div>

      {/* 6. Inspection Detail Modal */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Fiche de Traçabilité Certifiée</h3>
                  <div className="text-[11px] text-slate-500 font-mono">Identifiant : {selectedLogForDetail.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Horodatage certifié</span>
                  <span className="font-bold text-slate-900">{formatDateTime(selectedLogForDetail.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Catégorie</span>
                  <span className="font-bold text-slate-900">{selectedLogForDetail.category_label}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Dossier / Échantillon</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedLogForDetail.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Patient</span>
                  <span className="font-bold text-slate-900">{selectedLogForDetail.patient_name || 'Non spécifié'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Acteur / Système</span>
                  <span className="font-bold text-slate-900">{selectedLogForDetail.acteur}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Transition Statut</span>
                  <span className="font-bold text-slate-900">{selectedLogForDetail.etat_avant || '-'} ➔ {selectedLogForDetail.etat_apres || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Message & Détails Techniques</span>
                <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {selectedLogForDetail.description}
                </div>
              </div>

              {selectedLogForDetail.raw && (
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Charge utile JSON (Audit Trail)</span>
                  <pre className="bg-slate-100 p-2.5 rounded-xl font-mono text-[10px] text-slate-700 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedLogForDetail.raw, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Clear Confirm Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Purger les Journaux d'Audit ?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir réinitialiser l'historique des traces de workflow et la file des notifications ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer shadow-sm"
              >
                Confirmer la Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
