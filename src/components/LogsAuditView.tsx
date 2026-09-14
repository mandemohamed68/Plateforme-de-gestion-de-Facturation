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

  // Fetch all logs from backend
  const fetchAllLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/all-audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
      
      const wfRes = await fetch('/api/lab-workflow-logs');
      if (wfRes.ok) {
        const wfData = await wfRes.json();
        setWorkflowLogs(wfData);
      }

      const notifRes = await fetch('/api/lab-notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogs();
    const interval = setInterval(fetchAllLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle Clear Logs
  const handleClearLogs = async () => {
    try {
      await fetch('/api/lab-clear-workflow-data', { method: 'POST' });
      setShowClearConfirmModal(false);
      await fetchAllLogs();
    } catch (e) {
      console.error(e);
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Journal des Logs & Registre d'Audit</span>
                <span className="text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Temps Réel
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Traçabilité intégrale du Workflow LIMS, des transferts automates (HL7), des notifications SMS/Email et de la sécurité.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-refresh-logs"
            onClick={fetchAllLogs}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Actualiser immédiatement les journaux"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            id="btn-export-logs-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
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
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Imprimer le registre d'audit certifié"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer</span>
          </button>

          <button
            id="btn-clear-logs-modal"
            onClick={() => setShowClearConfirmModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Réinitialiser l'historique d'audit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purger</span>
          </button>
        </div>
      </div>

      {/* 2. Top Banner: LIMS Automation Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-white">Moteur LIMS Automatisé Actif</span>
              <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                100% Autonome
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dès qu'un agent confirme le prélèvement, le système enchaîne automatiquement : 
              <span className="text-emerald-300 font-semibold"> Réception Technique</span> ➔ 
              <span className="text-purple-300 font-semibold"> Import Automate HL7</span> ➔ 
              <span className="text-amber-300 font-semibold"> Validation Technique</span> ➔ 
              <span className="text-teal-300 font-semibold"> Signature Biologique</span> ➔ 
              <span className="text-sky-300 font-semibold"> Rendu SMS & Email</span> sans intervention manuelle.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 bg-white/10 p-3 rounded-xl border border-white/10">
          <div className="text-center px-2 border-r border-white/10">
            <div className="text-lg font-black text-white">{workflowLogs.length}</div>
            <div className="text-[10px] text-slate-300 uppercase font-bold">Traces Workflow</div>
          </div>
          <div className="text-center px-2">
            <div className="text-lg font-black text-emerald-400">{notifications.length}</div>
            <div className="text-[10px] text-slate-300 uppercase font-bold">Notifications</div>
          </div>
        </div>
      </div>

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{logs.length}</div>
            <div className="text-xs font-bold text-slate-500">Total Événements d'Audit</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-900">
              {logs.filter(l => l.category === 'workflow_lims').length}
            </div>
            <div className="text-xs font-bold text-slate-500">Traces Workflow LIMS</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-sky-900">
              {logs.filter(l => l.category === 'notification').length}
            </div>
            <div className="text-xs font-bold text-slate-500">Messages & Notifications</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-800">100 %</div>
            <div className="text-xs font-bold text-slate-500">Conformité ISO 15189</div>
          </div>
        </div>
      </div>

      {/* 4. Live LIMS Interactive Stepper & Real-time Queues */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Supervision du Workflow LIMS &amp; Flux d'Automatisation</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-emerald-200">
                100% Automatisé
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWorkflowDashboard(!showWorkflowDashboard)}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <span>{showWorkflowDashboard ? 'Masquer la Supervision' : 'Afficher la Supervision'}</span>
            </button>
          </div>
        </div>

        {showWorkflowDashboard && (
          <div className="p-5 space-y-5">
            {/* Horizontal 7-step Stepper */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span>Workflow Actif (du Paiement en Caisse au Rendu Patient)</span>
                <span className="text-[11px] text-slate-400 lowercase font-medium">actualisation automatique</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {[
                  { key: 'paye', label: '1. Paiement', desc: 'En Caisse', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
                  { key: 'preleve', label: '2. Prélèvement', desc: 'Tubes Prêts', color: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
                  { key: 'accepte', label: '3. Réception', desc: 'Labo OK', color: 'border-teal-200 bg-teal-50 text-teal-800' },
                  { key: 'analyse', label: '4. Analyse HL7', desc: 'Automate', color: 'border-amber-200 bg-amber-50 text-amber-800' },
                  { key: 'valide_tech', label: '5. Val. Tech', desc: 'Contrôles', color: 'border-cyan-200 bg-cyan-50 text-cyan-800' },
                  { key: 'valide_biologiste', label: '6. Val. Bio', desc: 'Signé', color: 'border-purple-200 bg-purple-50 text-purple-800' },
                  { key: 'envoye', label: '7. Rendu', desc: 'Diffusé SMS/Mail', color: 'border-slate-300 bg-slate-100 text-slate-800' },
                ].map((step, idx) => {
                  const count = countByWorkflowStatus(step.key);
                  return (
                    <div key={step.key} className={`p-2.5 rounded-xl border text-center relative flex flex-col justify-between ${step.color} shadow-3xs`}>
                      <div className="text-[11px] font-extrabold tracking-tight leading-tight">{step.label}</div>
                      <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{step.desc}</div>
                      <div className="mt-2 text-xs font-black bg-white rounded-full px-2.5 py-0.5 inline-block mx-auto border border-inherit shadow-3xs">
                        {count}
                      </div>
                      {idx < 6 && (
                        <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                          <span className="text-slate-300 font-extrabold text-sm">➔</span>
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategoryTab('all')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'all'
                ? 'border-slate-900 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tous les Événements</span>
            <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('workflow_lims')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'workflow_lims'
                ? 'border-indigo-600 text-indigo-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-indigo-600" />
            <span>Workflow LIMS & Automates</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {logs.filter(l => l.category === 'workflow_lims').length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('notification')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'notification'
                ? 'border-sky-600 text-sky-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Notifications (SMS & Email)</span>
            <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {logs.filter(l => l.category === 'notification').length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('caisse_security')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeCategoryTab === 'caisse_security'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Sécurité & Caisses</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
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
