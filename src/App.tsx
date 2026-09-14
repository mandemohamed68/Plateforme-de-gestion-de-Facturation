import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, LogOut, CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AppNavigation, AppView, getAllowedViews } from './components/AppNavigation';
import { LoginView } from './components/LoginView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { DashboardView } from './components/DashboardView';
import { InvoicesView } from './components/InvoicesView';
import { PaymentsView } from './components/PaymentsView';
import { PartnersView } from './components/PartnersView';
import { ProductsView } from './components/ProductsView';
import { LabResultsView } from './components/LabResultsView';
import { LabSamplingView } from './components/LabSamplingView';
import { LabGroupedResultsView } from './components/LabGroupedResultsView';
import { UsersView } from './components/UsersView';
import { NotificationsView } from './components/NotificationsView';
import { LogsAuditView } from './components/LogsAuditView';
import { SchemaErdView } from './components/SchemaErdView';
import { CaisseSessionsView } from './components/CaisseSessionsView';
import { InvoicePdfModal } from './components/InvoicePdfModal';
import { PatientDossierModal } from './components/PatientDossierModal';
import { PatientDossiersDirectoryView } from './components/PatientDossiersDirectoryView';
import { InsuranceClaimsView } from './components/InsuranceClaimsView';
import {
  AccountMove,
  ResPartner,
  ResUser,
  ResGroup,
  ProductProduct,
  AccountTax,
  AccountPayment,
  EmailNotification,
  UomUom,
  ResCountry,
  AnalyticsData,
  MoveType,
  CompanySettings,
  LabExamOrder,
  PartnerReduction,
  TillSession,
} from './types';

const safeFetchJson = async <T,>(url: string, fallback: T): Promise<T> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return fallback;
    }
    const data = await res.json();
    return (data !== null && data !== undefined) ? data : fallback;
  } catch (err) {
    console.warn(`Safe fetch warning for ${url}:`, err);
    return fallback;
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem('app_current_view');
    return (saved as AppView) || 'caisse_sessions';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moveTypeFilter, setMoveTypeFilter] = useState<MoveType>('out_invoice');

  // Session workflow navigation helpers
  const [autoOpenInvoiceCreate, setAutoOpenInvoiceCreate] = useState(false);
  const [autoOpenPaymentModal, setAutoOpenPaymentModal] = useState(false);
  const [returnToSessionMode, setReturnToSessionMode] = useState(false);

  // Datasets
  const [moves, setMoves] = useState<AccountMove[]>([]);
  const [partners, setPartners] = useState<ResPartner[]>([]);
  const [users, setUsers] = useState<ResUser[]>([]);
  const [groups, setGroups] = useState<ResGroup[]>([]);
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [taxes, setTaxes] = useState<AccountTax[]>([]);
  const [payments, setPayments] = useState<AccountPayment[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [partnerReductions, setPartnerReductions] = useState<PartnerReduction[]>([]);
  const [labOrders, setLabOrders] = useState<LabExamOrder[]>([]);
  const [tillSessions, setTillSessions] = useState<TillSession[]>([]);
  const [uoms, setUoms] = useState<UomUom[]>([]);
  const [countries, setCountries] = useState<ResCountry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [schemaTables, setSchemaTables] = useState<any[]>([]);

  // Company Branding & Settings State
  const [company, setCompany] = useState<CompanySettings>({
    name: "LABORATOIRE D'ANALYSES MÉDICALES & BIOLOGIE CLINIQUE",
    slogan: "Biologie Médicale, Diagnostics Spécialisés & Examens de Santé",
    logo_url: "",
    primary_color: "#334155",
    phone: "+225 27 20 22 33 44 / +225 07 08 09 10 11",
    email: "contact@laboratoire-biologie.ci",
    address: "Plateau Medical Center, Bd Hassan II",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    rccm: "CI-ABJ-2024-B-12940",
    tax_id: "CI 01928374 A",
    health_accreditation_number: "AGR-MSHP-2024-0098",
    currency_symbol: "FCFA",
    default_tax_rate: 0,
    tax_exemption_default_reason: "Exonération légale de TVA sur les prestations de biologie médicale (Art. 355 du Code Général des Impôts).",
    bank_name: "Société Générale Côte d'Ivoire (SGCI)",
    bank_iban: "CI93 0100 2000 3000 4000 50",
    bank_bic: "SGCIX01",
    mobile_money_numbers: "Wave / Orange Money / Moov : +225 07 08 09 10 11",
    enabled_payment_methods: ["cash", "wave", "orange_money", "moov_money", "card", "check", "transfer", "insurance"],
    medical_director_name: "Dr. Aboubacar TOURÉ - Biologiste Médical Specialist",
    lab_turnaround_default: "2 heures à 24 heures selon la spécialité",
    invoice_footer: "Document délivré à titre de quittance médicale officielle. Facture exonérée de TVA sur les prestations d'analyses médicales.",
    default_page_size: 50,
  });

  // User & Auth State with localStorage persistence
  const [currentUser, setCurrentUser] = useState<ResUser | null>(() => {
    const saved = localStorage.getItem('app_saved_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
  const [inactivityWarningSeconds, setInactivityWarningSeconds] = useState<number | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());

  const resetActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setInactivityWarningSeconds(null);
  }, []);

  // Automatic logout on inactivity (medical security and patient data privacy)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastActivityTimeRef.current > 1000) {
        lastActivityTimeRef.current = now;
      }
      setInactivityWarningSeconds((prev) => (prev !== null ? null : null));
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    const timeoutMinutes = company?.session_timeout_minutes !== undefined ? company.session_timeout_minutes : 15;
    if (timeoutMinutes <= 0) {
      return () => {
        events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
      };
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningThresholdMs = 60 * 1000;

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityTimeRef.current;
      const remainingMs = timeoutMs - elapsed;

      if (remainingMs <= 0) {
        setIsAuthenticated(false);
        setInactivityWarningSeconds(null);
        setSessionExpiredNotice(
          `Votre session a été verrouillée automatiquement suite à ${timeoutMinutes} minutes d'inactivité. Veuillez vous ré-authentifier pour des raisons de confidentialité médicale et de sécurité financière.`
        );
        showToast("Session verrouillée pour cause d'inactivité", 'error');
      } else if (remainingMs <= warningThresholdMs) {
        const secs = Math.ceil(remainingMs / 1000);
        setInactivityWarningSeconds(secs);
      } else {
        setInactivityWarningSeconds((prev) => (prev !== null ? null : null));
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
    };
  }, [isAuthenticated, company?.session_timeout_minutes]);

  // Modals
  const [pdfMove, setPdfMove] = useState<AccountMove | null>(null);
  const [selectedMoveForPayment, setSelectedMoveForPayment] = useState<AccountMove | null>(null);
  const [lookupPatient, setLookupPatient] = useState<ResPartner | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Loading & Real-time Toast Notifications
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      text: string;
      type: 'success' | 'error' | 'warning' | 'info';
      title?: string;
    }>
  >([]);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const defaultTitle =
        type === 'success'
          ? 'Opération Réussie'
          : type === 'error'
          ? 'Erreur Système'
          : type === 'warning'
          ? 'Attention'
          : 'Notification';

      const newToast = { id, text, type, title: title || defaultTitle };
      setToasts((prev) => [...prev.slice(-3), newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save active user and current view to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_saved_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentView) {
      localStorage.setItem('app_current_view', currentView);
    }
  }, [currentView]);

  // Enforce RBAC: If currentView is not allowed for the user, redirect to their first allowed view
  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedViews(currentUser);
      if (!allowed.includes(currentView)) {
        const nextView = allowed[0] || 'invoices';
        setCurrentView(nextView);
        localStorage.setItem('app_current_view', nextView);
      }
    }
  }, [currentUser, currentView]);

  // Fetch All Initial Data from Backend API
  const fetchAllData = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const [
        movesRes,
        partnersRes,
        usersRes,
        groupsRes,
        productsRes,
        taxesRes,
        paymentsRes,
        notifsRes,
        labOrdersRes,
        analyticsRes,
        uomsRes,
        countriesRes,
        schemaRes,
        companyRes,
        partnerReductionsRes,
        tillSessionsRes,
      ] = await Promise.all([
        safeFetchJson('/api/moves', []),
        safeFetchJson('/api/partners', []),
        safeFetchJson('/api/users', []),
        safeFetchJson('/api/groups', []),
        safeFetchJson('/api/products', []),
        safeFetchJson('/api/taxes', []),
        safeFetchJson('/api/payments', []),
        safeFetchJson('/api/notifications', []),
        safeFetchJson('/api/lab-orders', []),
        safeFetchJson('/api/analytics', null),
        safeFetchJson('/api/uoms', []),
        safeFetchJson('/api/countries', []),
        safeFetchJson<{ rawSql?: string; raw_sql?: string; tables?: any[] }>('/api/schema', {}),
        safeFetchJson('/api/company', null),
        safeFetchJson('/api/partner-reductions', []),
        safeFetchJson('/api/till-sessions', []),
      ]);

      const safeMoves = Array.isArray(movesRes) ? movesRes : [];
      const safePartners = Array.isArray(partnersRes) ? partnersRes : [];
      const safeUsers = Array.isArray(usersRes) ? usersRes : [];
      const safeGroups = Array.isArray(groupsRes) ? groupsRes : [];
      const safeProducts = Array.isArray(productsRes) ? productsRes : [];
      const safeTaxes = Array.isArray(taxesRes) ? taxesRes : [];
      const safePayments = Array.isArray(paymentsRes) ? paymentsRes : [];
      const safeNotifs = Array.isArray(notifsRes) ? notifsRes : [];
      const safeLabOrders = Array.isArray(labOrdersRes) ? labOrdersRes : [];
      const safeUoms = Array.isArray(uomsRes) ? uomsRes : [];
      const safeCountries = Array.isArray(countriesRes) ? countriesRes : [];
      const safeReductions = Array.isArray(partnerReductionsRes) ? partnerReductionsRes : [];
      const safeTillSessions = Array.isArray(tillSessionsRes) ? tillSessionsRes : [];

      setMoves(safeMoves);
      setPartners(safePartners);
      setUsers(safeUsers);
      setGroups(safeGroups);
      setProducts(safeProducts);
      setTaxes(safeTaxes);
      setPayments(safePayments);
      setNotifications(safeNotifs);
      setPartnerReductions(safeReductions);
      setLabOrders(safeLabOrders);
      setTillSessions(safeTillSessions);
      setAnalytics(analyticsRes);
      setUoms(safeUoms);
      setCountries(safeCountries);
      setSchemaSql(schemaRes?.rawSql || schemaRes?.raw_sql || '');
      setSchemaTables(Array.isArray(schemaRes?.tables) ? schemaRes.tables : []);
      if (companyRes && companyRes.name) {
        setCompany(companyRes);
      }

      // Resilient Dual-Store: local mirror & automatic recovery if container restarted
      try {
        const LOCAL_MIRROR_KEY = 'med_lab_permanent_mirror_v1';
        const cachedRaw = localStorage.getItem(LOCAL_MIRROR_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          // Check for any user tests or invoices stored locally that are missing in the server response
          const missingLabOrders = (cached.labOrders || []).filter(
            (co: any) => co?.id && !safeLabOrders.some((so) => so.id === co.id)
          );
          const missingMoves = (cached.moves || []).filter(
            (cm: any) => cm?.id && !safeMoves.some((sm) => sm.id === cm.id)
          );
          const missingPartners = (cached.partners || []).filter(
            (cp: any) => cp?.id && !safePartners.some((sp) => sp.id === cp.id)
          );
          const missingPayments = (cached.payments || []).filter(
            (cpy: any) => cpy?.id && !safePayments.some((spy) => spy.id === cpy.id)
          );

          if (missingLabOrders.length > 0 || missingMoves.length > 0 || missingPartners.length > 0) {
            // Restore missing tests/invoices to the backend immediately
            fetch('/api/sync-restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                labOrders: missingLabOrders,
                moves: missingMoves,
                partners: missingPartners,
                payments: missingPayments,
              }),
            })
              .then((r) => r.json())
              .then((restoreResult) => {
                if (restoreResult?.success) {
                  if (missingLabOrders.length > 0) {
                    setLabOrders((prev) => [...missingLabOrders, ...prev]);
                  }
                  if (missingMoves.length > 0) {
                    setMoves((prev) => [...missingMoves, ...prev]);
                  }
                  if (missingPartners.length > 0) {
                    setPartners((prev) => [...missingPartners, ...prev]);
                  }
                  showToast(
                    `Restauration permanente : ${missingLabOrders.length} test(s) et factures précédents synchronisés !`,
                    'success'
                  );
                }
              })
              .catch((e) => console.error('Auto-restore sync error:', e));
          }
        }

        // Keep local mirror updated with the latest verified data
        localStorage.setItem(
          LOCAL_MIRROR_KEY,
          JSON.stringify({
            moves: safeMoves,
            labOrders: safeLabOrders,
            partners: safePartners,
            payments: safePayments,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (mirrorErr) {
        console.warn('LocalStorage mirror error:', mirrorErr);
      }

      if (safeUsers.length > 0) {
        // If saved user exists in safeUsers, keep it updated with backend groups & permissions
        const existing = currentUser ? safeUsers.find((u) => u.id === currentUser.id) : null;
        if (existing) {
          setCurrentUser(existing);
        } else if (!currentUser) {
          setCurrentUser(safeUsers[0]);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      showToast('Erreur de connexion au serveur backend', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(true);
  }, []);

  useEffect(() => {
    if (company) {
      if (company.name) {
        document.title = `${company.name} | Facturation Médicale & Caisse`;
      }
      const root = document.documentElement;
      if (company.primary_color) {
        root.style.setProperty('--primary-color', company.primary_color);
      }
      if (company.secondary_color) {
        root.style.setProperty('--secondary-color', company.secondary_color);
      }
      if (company.sidebar_color) {
        root.style.setProperty('--sidebar-color', company.sidebar_color);
      }
    }
  }, [company]);

  const handleGlobalSearchNDM = (query: string) => {
    if (!query) return;
    const cleanQuery = query.trim().toLowerCase();
    
    // --- SMART PARSING OF QR CODES ---
    // If it's a structured QR code like: "dossier:ndm-00270410|facture:fc-2026-001|..."
    let parsedDossier = '';
    let parsedInvoice = '';
    
    if (cleanQuery.includes('dossier:')) {
      const matchDossier = query.match(/dossier:\s*([^|\n]+)/i);
      if (matchDossier) {
        parsedDossier = matchDossier[1].trim().toLowerCase();
      }
    }
    if (cleanQuery.includes('facture:')) {
      const matchInvoice = query.match(/facture:\s*([^|\n]+)/i);
      if (matchInvoice) {
        parsedInvoice = matchInvoice[1].trim().toLowerCase();
      }
    }

    // Determine candidate search terms
    const candidates = [cleanQuery];
    if (parsedDossier) candidates.push(parsedDossier);
    if (parsedInvoice) candidates.push(parsedInvoice);
    
    // If the dossier is something like NDM-00270410, extract numeric parts
    candidates.forEach((cand) => {
      const numericPart = cand.replace(/[^0-9]/g, '');
      if (numericPart && numericPart.length >= 4) {
        candidates.push(numericPart);
      }
      const withoutPrefix = cand.replace(/^ndm-/, '');
      if (withoutPrefix !== cand) {
        candidates.push(withoutPrefix);
      }
    });

    // Make candidates unique and non-empty
    const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));

    let foundPatient: any = null;
    let foundMove: any = null;

    // 1. Try to find a patient whose NDM matches any of our candidates
    for (const cand of uniqueCandidates) {
      foundPatient = partners.find((p) => {
        if (p.partner_type && p.partner_type !== 'patient') return false;
        if (!p.ndm) return false;
        const pNdmLower = p.ndm.toLowerCase();
        const pNdmNumeric = pNdmLower.replace(/[^0-9]/g, '');
        
        return (
          pNdmLower === cand ||
          pNdmLower.includes(cand) ||
          cand.includes(pNdmLower) ||
          (pNdmNumeric && cand.includes(pNdmNumeric)) ||
          (pNdmNumeric && pNdmNumeric === cand)
        );
      });
      if (foundPatient) break;
    }

    // 2. If not found, try to find an invoice (AccountMove) matching any of our candidates
    if (!foundPatient) {
      for (const cand of uniqueCandidates) {
        foundMove = moves.find((m) => {
          const moveName = (m.name || '').toLowerCase();
          const moveIdStr = String(m.id).toLowerCase();
          return (
            moveName === cand ||
            moveName.includes(cand) ||
            cand.includes(moveName) ||
            moveIdStr === cand
          );
        });
        if (foundMove) {
          if (foundMove.partner_id) {
            foundPatient = partners.find((p) => p.id === foundMove.partner_id);
          } else if (foundMove.partner) {
            foundPatient = foundMove.partner;
          }
          // Verify it's actually a patient and not an insurance invoice
          if (foundPatient && foundPatient.partner_type && foundPatient.partner_type !== 'patient') {
            foundPatient = null;
          }
          if (foundPatient) break;
        }
      }
    }

    // 3. If still not found, try to find patient by name containing any of our non-numeric candidates
    if (!foundPatient) {
      for (const cand of uniqueCandidates) {
        // Skip purely numeric candidates for name search to avoid false positives
        if (/^\d+$/.test(cand)) continue;
        foundPatient = partners.find((p) => {
          if (p.partner_type && p.partner_type !== 'patient') return false;
          // Also if they don't have an NDM and they are a company, they're probably not a patient
          if (p.is_company) return false;
          return (p.name || '').toLowerCase().includes(cand);
        });
        if (foundPatient) break;
      }
    }

    if (foundPatient) {
      setLookupPatient(foundPatient);
      setIsLookupOpen(true);
      showToast(`Dossier patient #${foundPatient.ndm || foundPatient.id} (${foundPatient.name}) chargé !`);
    } else {
      showToast("Aucun dossier ou reçu correspondant trouvé", "error");
    }
  };

  useEffect(() => {
    if (!isLoading && partners.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search') || params.get('ndm');
      if (searchParam) {
        handleGlobalSearchNDM(searchParam);
        // Clean URL to avoid repeating on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [isLoading, partners, moves]);

  // Invoice Handlers
  const handleSaveMove = async (moveData: any): Promise<AccountMove | null> => {
    try {
      const isEdit = !!moveData.id;
      const url = isEdit ? `/api/moves/${moveData.id}` : '/api/moves';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...moveData,
          invoice_user_id: moveData.invoice_user_id || currentUser?.id,
          till_session_id: moveData.till_session_id || activeUserSession?.id || null,
        }),
      });
      if (res.ok) {
        const savedMove = await res.json();
        showToast(isEdit ? 'Facture mise à jour avec succès !' : 'Facture enregistrée en état Brouillon avec succès !');
        await fetchAllData();
        return savedMove;
      } else {
        showToast('Erreur lors de la sauvegarde de la facture', 'error');
        return null;
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
      return null;
    }
  };

  const handlePostMove = async (moveId: number): Promise<AccountMove | null> => {
    try {
      const res = await fetch(`/api/moves/${moveId}/post`, { method: 'POST' });
      if (res.ok) {
        const postedMove = await res.json();
        showToast('Facture comptabilisée et validée au Grand Livre !');
        await fetchAllData();
        return postedMove;
      }
      return null;
    } catch (e) {
      showToast('Erreur lors de la validation', 'error');
      return null;
    }
  };

  const handleCancelMove = async (moveId: number) => {
    try {
      const res = await fetch(`/api/moves/${moveId}/cancel`, { method: 'POST' });
      if (res.ok) {
        showToast('Facture annulée.');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur lors de l annulement', 'error');
    }
  };

  const handleDeleteMove = async (moveId: number) => {
    try {
      const res = await fetch(`/api/moves/${moveId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Facture supprimée avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur lors de la suppression de la facture', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau lors de la suppression', 'error');
    }
  };

  const handlePayInvoice = (move: AccountMove) => {
    setMoveTypeFilter(move.move_type);
    setSelectedMoveForPayment(move); // We'll use this to pass it to InvoicesView
    setAutoOpenInvoiceCreate(false);
    setReturnToSessionMode(true);
    setCurrentView('invoices');
  };

  // Register Payment Handler
  const handleRegisterPayment = async (paymentData: any) => {
    try {
      const activeUserSession = tillSessions.find(
        (s) => (s.cashier_id === currentUser?.id || s.cashier_name === currentUser?.name) && s.state === 'in_progress'
      );

      const targetMove = paymentData.move_id ? moves.find((m) => m.id === Number(paymentData.move_id)) : null;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          patient_name: paymentData.patient_name || targetMove?.patient_name || targetMove?.partner?.name || null,
          ndm_number: paymentData.ndm_number || targetMove?.ndm || null,
          session_id: paymentData.session_id || activeUserSession?.id || null,
          user_id: paymentData.user_id || currentUser?.id,
          cashier_name: currentUser?.name,
        }),
      });
      if (res.ok) {
        showToast('Paiement enregistré et réconcilié avec succès !');
        await fetchAllData();
      } else {
        showToast('Erreur lors de l enregistrement du paiement', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  // Partner Handler
  const handleSavePartner = async (partnerData: any): Promise<ResPartner | null> => {
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      if (res.ok) {
        const savedPartner: ResPartner = await res.json();
        showToast(
          savedPartner.partner_type === 'patient'
            ? `Dossier patient #${savedPartner.ndm || savedPartner.id} (${savedPartner.name}) enregistré avec succès !`
            : 'Fiche Partenaire enregistrée !',
          'success',
          'Dossier Partenaire'
        );
        
        // Auto-increment next NDM sequential sequence
        const prefix = company.ndm_prefix !== undefined ? company.ndm_prefix : 'NDM-';
        if (partnerData.ndm && partnerData.ndm.startsWith(prefix)) {
          const nextNum = company.ndm_next_number !== undefined ? company.ndm_next_number : 270408;
          const updatedCompany = {
            ...company,
            ndm_next_number: nextNum + 1
          };
          try {
            const companyRes = await fetch('/api/company', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedCompany),
            });
            if (companyRes.ok) {
              const savedComp = await companyRes.json();
              setCompany(savedComp);
            }
          } catch (companyErr) {
            console.error("Error auto-incrementing NDM sequence:", companyErr);
          }
        }

        await fetchAllData();
        return savedPartner;
      } else {
        showToast('Erreur lors de l enregistrement du partenaire', 'error', 'Erreur Partenaire');
        return null;
      }
    } catch (e) {
      showToast('Erreur réseau partenaire', 'error', 'Erreur Partenaire');
      return null;
    }
  };

  const handleDeletePartner = async (id: number) => {
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Partenaire supprimé avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur suppression partenaire', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // Partner Reductions Handlers
  const handleSavePartnerReduction = async (reductionData: any) => {
    try {
      const isEdit = !!reductionData.id;
      const url = isEdit ? `/api/partner-reductions/${reductionData.id}` : '/api/partner-reductions';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reductionData),
      });

      if (res.ok) {
        showToast(isEdit ? 'Grille de réduction mise à jour !' : 'Nouvelle réduction enregistrée !');
        await fetchAllData();
      } else {
        showToast('Erreur lors de la sauvegarde de la réduction', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  const handleDeletePartnerReduction = async (id: number) => {
    try {
      const res = await fetch(`/api/partner-reductions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Réduction supprimée de la grille avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur de suppression de la réduction', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // Product Handler
  const handleSaveProduct = async (productData: any) => {
    try {
      const isEdit = !!productData.id;
      const url = isEdit ? `/api/products/${productData.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        showToast(isEdit ? 'Prestation modifiée avec succès !' : 'Prestation ajoutée au catalogue !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur produit', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Analyse / Produit supprimé avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur suppression produit', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // Lab Exam Orders Handler
  const handleSaveLabOrder = async (orderData: Partial<LabExamOrder>) => {
    try {
      const isEdit = !!orderData.id;
      const url = isEdit ? `/api/lab-orders/${orderData.id}` : '/api/lab-orders';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        showToast(
          orderData.status === 'validated'
            ? 'Résultats validés médicalement et signés avec succès !'
            : isEdit
            ? 'Dossier d\'analyse mis à jour !'
            : 'Nouvel examen de laboratoire créé avec succès !'
        );
        await fetchAllData();
      } else {
        showToast('Erreur lors de l\'enregistrement de l\'examen', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  const handleDeleteLabOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/lab-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Dossier d\'examen supprimé avec succès.');
        await fetchAllData();
      } else {
        showToast('Erreur suppression examen', 'error');
      }
    } catch (e) {
      showToast('Erreur suppression', 'error');
    }
  };

  // User & Group Handlers
  const handleSaveUser = async (userData: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const savedUser = await res.json();
        showToast('Utilisateur et droits d accès mis à jour !');
        if (currentUser && (currentUser.id === savedUser.id || currentUser.login === savedUser.login)) {
          setCurrentUser(savedUser);
          localStorage.setItem('app_saved_user', JSON.stringify(savedUser));
          const allowed = getAllowedViews(savedUser);
          if (!allowed.includes(currentView)) {
            const next = allowed[0] || 'dashboard';
            setCurrentView(next);
            localStorage.setItem('app_current_view', next);
          }
        }
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur utilisateur', 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Compte utilisateur supprimé avec succès !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur suppression utilisateur', 'error');
    }
  };

  const handleSaveGroup = async (groupData: any) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });
      if (res.ok) {
        showToast('Rôle et matrice de permissions mis à jour !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur rôle', 'error');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Rôle supprimé avec succès !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur suppression rôle', 'error');
    }
  };

  // Email Reminder Handler
  const handleSendReminder = async (moveId: number) => {
    try {
      const res = await fetch('/api/notifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move_id: moveId }),
      });
      if (res.ok) {
        showToast('Email de relance automatique transmis avec succès !');
        await fetchAllData();
      }
    } catch (e) {
      showToast('Erreur transmission email', 'error');
    }
  };

  // Execute SQL Handler
  const handleExecuteSql = async (sql: string) => {
    const res = await fetch('/api/schema/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    return res.json();
  };

  const handleReturnToSession = () => {
    setAutoOpenInvoiceCreate(false);
    setAutoOpenPaymentModal(false);
    setReturnToSessionMode(false);
    setCurrentView('caisse_sessions');
  };

  // Bridge to Payment View from Invoices
  const handleOpenPaymentModal = (move: AccountMove) => {
    setSelectedMoveForPayment(move);
    setCurrentView('payments');
  };

  const handleSaveCompany = async (updated: CompanySettings) => {
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const saved = await res.json();
        setCompany(saved);
        showToast('Identité de marque & paramètres enregistrés !');
        await fetchAllData();
      } else {
        showToast('Erreur enregistrement entreprise', 'error');
      }
    } catch (e) {
      showToast('Erreur réseau', 'error');
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser toutes les données aux valeurs d\'origine ?')) return;
    try {
      setIsLoading(true);
      await fetch('/api/reset-db', { method: 'POST' });
      showToast('Base de données réinitialisée avec succès !');
      await fetchAllData();
    } catch (e) {
      showToast('Erreur réinitialisation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    showToast('Déconnexion effectuée');
  };

  const handleLogin = (user: ResUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setSessionExpiredNotice(null);
    setInactivityWarningSeconds(null);
    lastActivityTimeRef.current = Date.now();
    localStorage.setItem('app_saved_user', JSON.stringify(user));
    const roleLower = (user.role || '').toLowerCase();
    const loginLower = (user.login || '').toLowerCase();
    const isSupervisor =
      roleLower.includes('supervis') ||
      loginLower === 'mande' ||
      (user.group_ids || []).includes(1);

    const isBillerOrCashier =
      !isSupervisor &&
      (roleLower.includes('factur') ||
        roleLower.includes('caiss') ||
        user.login === 'facturier' ||
        user.login === 'caissier' ||
        user.login === 'facture_caisse');

    if (isSupervisor) {
      setCurrentView('dashboard');
      localStorage.setItem('app_current_view', 'dashboard');
    } else if (isBillerOrCashier) {
      setCurrentView('caisse_sessions');
      localStorage.setItem('app_current_view', 'caisse_sessions');
    } else {
      const allowed = getAllowedViews(user);
      if (!allowed.includes(currentView)) {
        const next = allowed[0] || 'dashboard';
        setCurrentView(next);
        localStorage.setItem('app_current_view', next);
      }
    }
    showToast(`Bienvenue, ${user.name} !`);
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        users={users}
        company={company}
        onLogin={handleLogin}
        sessionExpiredNotice={sessionExpiredNotice || undefined}
      />
    );
  }

  const activeUserSession = tillSessions.find(
    (s) =>
      (s.cashier_id === currentUser?.id || s.cashier_name === currentUser?.name) &&
      s.state === 'in_progress'
  );
  const hasActiveSession = Boolean(activeUserSession);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-slate-900 selection:text-white relative overflow-x-hidden">
      {/* Background Watermark Logo Layer (Filigrane visible et discret en fond z-0, non bloquant z-10) */}
      {company.show_watermark !== false && (
        <div
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden lg:pl-64 select-none"
          aria-hidden="true"
        >
          {company.logo_url ? (
            <div className="flex flex-col items-center justify-center -rotate-12 transition-transform pointer-events-none">
              <img
                src={company.logo_url}
                alt=""
                style={{ opacity: Math.min(company.watermark_opacity || 0.04, 0.06) }}
                className="w-96 h-96 sm:w-[520px] sm:h-[520px] object-contain select-none pointer-events-none"
              />
              {company.watermark_text && (
                <div
                  style={{ opacity: Math.min((company.watermark_opacity || 0.04) * 1.5, 0.08) }}
                  className="mt-3 text-center font-black uppercase text-slate-900 tracking-widest text-xs sm:text-sm select-none pointer-events-none"
                >
                  {company.watermark_text}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{ opacity: Math.min(company.watermark_opacity || 0.04, 0.06) }}
              className="text-center font-black uppercase text-slate-900 tracking-widest text-3xl sm:text-5xl select-none -rotate-12 max-w-xl px-6 leading-tight pointer-events-none"
            >
              {company.watermark_text || company.name || "POLYCLINIQUE ET LABORATOIRE"}
            </div>
          )}
        </div>
      )}

      {/* Structured Left Sidebar & Top Status Header Navigation */}
      <AppNavigation
        currentView={currentView}
        setCurrentView={(view) => {
          const roleLower = (currentUser?.role || '').toLowerCase();
          const loginLower = (currentUser?.login || '').toLowerCase();
          const emailLower = (currentUser?.email || '').toLowerCase();

          const isSupervisorOrAdmin =
            roleLower.includes('supervis') ||
            roleLower.includes('admin') ||
            roleLower.includes('directeur') ||
            roleLower.includes('biolog') ||
            roleLower.includes('technic') ||
            loginLower === 'admin' ||
            loginLower === 'superviseur' ||
            (currentUser?.group_ids || []).includes(1) ||
            (currentUser?.group_ids || []).includes(5);

          const isSessionReq =
            !isSupervisorOrAdmin &&
            (roleLower.includes('factur') ||
              roleLower.includes('caiss') ||
              loginLower === 'facturier' ||
              loginLower === 'caissier' ||
              loginLower === 'facture_caisse');

          if (isSessionReq && !hasActiveSession && view !== 'caisse_sessions') {
            showToast('Ouverture de session requise pour accéder aux autres fonctionnalités', 'error');
            setCurrentView('caisse_sessions');
            return;
          }

          const allowed = getAllowedViews(currentUser);
          if (allowed.includes(view)) {
            if (view === 'invoices') {
              setSelectedMoveForPayment(null);
              setAutoOpenInvoiceCreate(false);
            }
            setCurrentView(view);
          } else {
            showToast('Accès non autorisé pour votre profil', 'error');
          }
        }}
        currentUser={currentUser}
        users={users}
        groups={groups}
        company={company}
        hasActiveSession={hasActiveSession}
        onSelectUser={(u) => {
          setCurrentUser(u);
          localStorage.setItem('app_saved_user', JSON.stringify(u));
          const allowed = getAllowedViews(u);
          const rLower = (u.role || '').toLowerCase();
          const lLower = (u.login || '').toLowerCase();
          const eLower = (u.email || '').toLowerCase();

          const isUAdminOrSup =
            rLower.includes('supervis') ||
            rLower.includes('admin') ||
            rLower.includes('directeur') ||
            rLower.includes('biolog') ||
            rLower.includes('technic') ||
            lLower === 'admin' ||
            lLower === 'superviseur' ||
            (u.group_ids || []).includes(1) ||
            (u.group_ids || []).includes(5);

          const isURequired =
            !isUAdminOrSup &&
            (rLower.includes('factur') ||
              rLower.includes('caiss') ||
              lLower === 'facturier' ||
              lLower === 'caissier' ||
              lLower === 'facture_caisse');

          if (isURequired) {
            setCurrentView('caisse_sessions');
          } else if (rLower.includes('supervis') || lLower === 'mande' || (u.group_ids || []).includes(1)) {
            setCurrentView('dashboard');
          } else if (!allowed.includes(currentView)) {
            setCurrentView(allowed[0] || 'dashboard');
          }
          showToast(`Profil actif : ${u.name} (${u.role || 'Opérateur'})`);
        }}
        onLogout={handleLogout}
        onNewInvoice={() => {
          setMoveTypeFilter('out_invoice');
          setCurrentView('invoices');
        }}
        onNewPayment={() => setCurrentView('payments')}
        onNewLabOrder={() => setCurrentView('lab_results')}
        onResetDb={handleResetDb}
        notificationCount={notifications.length}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onSearchNDM={handleGlobalSearchNDM}
      />

      {/* Main App Canvas - Full Width View Without Restrictive Width Constraints */}
      <main className="flex-1 lg:pl-64 transition-all p-3 sm:p-5 lg:p-6 w-full relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div
              style={{ borderTopColor: 'transparent', borderColor: company.primary_color || '#0f172a' }}
              className="w-12 h-12 border-4 rounded-full animate-spin"
            />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chargement des données du système...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full"
            >
            {currentView === 'dashboard' && analytics && (
              <DashboardView
                analytics={analytics}
                company={company}
                moves={moves}
                overdueMoves={(moves || []).filter(
                  (m) =>
                    m &&
                    m.state === 'posted' &&
                    m.amount_residual > 0 &&
                    m.invoice_date_due &&
                    m.invoice_date_due < new Date().toISOString().split('T')[0]
                )}
                payments={payments}
                partners={partners}
                products={products}
                labOrders={labOrders}
                tillSessions={tillSessions}
                users={users}
                currentUser={currentUser}
                notifications={notifications}
                onNewInvoice={() => {
                  setMoveTypeFilter('out_invoice');
                  setCurrentView('invoices');
                }}
                onNewPayment={() => setCurrentView('payments')}
                onNewLabOrder={() => setCurrentView('lab_results')}
                onOpenSessions={() => setCurrentView('caisse_sessions')}
                onSendReminder={handleSendReminder}
                onNavigateTab={(v) => setCurrentView(v as any)}
                onOpenInvoice={(m) => setPdfMove(m)}
                onNavigate={(v) => setCurrentView(v as any)}
              />
            )}

            {currentView === 'invoices' && (
              <InvoicesView
                moves={moves}
                partners={partners}
                users={users}
                products={products}
                taxes={taxes}
                currentUser={currentUser}
                onSaveMove={handleSaveMove}
                onPostMove={handlePostMove}
                onCancelMove={handleCancelMove}
                onDeleteMove={handleDeleteMove}
                onOpenPdf={(m) => setPdfMove(m)}
                onOpenPaymentModal={handleOpenPaymentModal}
                onRegisterPayment={handleRegisterPayment}
                onSaveLabOrder={handleSaveLabOrder}
                onSendReminder={handleSendReminder}
                moveTypeFilter={moveTypeFilter}
                setMoveTypeFilter={setMoveTypeFilter}
                autoOpenCreate={autoOpenInvoiceCreate}
                initialMove={selectedMoveForPayment}
                onClearInitialMove={() => setSelectedMoveForPayment(null)}
                onFinishAndReturnToSession={returnToSessionMode ? handleReturnToSession : undefined}
                onSavePartner={handleSavePartner}
                onSaveProduct={handleSaveProduct}
                company={company}
                partnerReductions={partnerReductions}
                hasActiveSession={hasActiveSession}
                onNavigateToSessions={() => setCurrentView('caisse_sessions')}
                tillSessions={tillSessions}
                onShowToast={showToast}
                onNavigateToLab={() => setCurrentView('lab_sampling')}
              />
            )}

            {currentView === 'lab_results' && (
              <LabResultsView
                labOrders={labOrders}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onSaveLabOrder={handleSaveLabOrder}
                onDeleteLabOrder={handleDeleteLabOrder}
              />
            )}

            {currentView === 'lab_sampling' && (
              <LabSamplingView
                labOrders={labOrders}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onSaveLabOrder={handleSaveLabOrder}
                onRefreshData={() => fetchAllData()}
              />
            )}

            {currentView === 'lab_grouped_results' && (
              <LabGroupedResultsView
                labOrders={labOrders}
                partners={partners}
                currentUser={currentUser}
                company={company}
                onSaveLabOrder={handleSaveLabOrder}
                onRefreshData={() => fetchAllData()}
              />
            )}

            {currentView === 'payments' && (
              <PaymentsView
                payments={payments}
                moves={moves}
                partners={partners}
                currentUser={currentUser}
                onRegisterPayment={handleRegisterPayment}
                selectedMoveForPayment={selectedMoveForPayment}
                onClearSelectedMove={() => setSelectedMoveForPayment(null)}
                autoOpenModal={autoOpenPaymentModal}
                onFinishAndReturnToSession={returnToSessionMode ? handleReturnToSession : undefined}
              />
            )}

            {currentView === 'caisse_sessions' && (
              <CaisseSessionsView
                company={company}
                currentUser={currentUser}
                moves={moves}
                tillSessions={tillSessions}
                onSessionChange={fetchAllData}
                onShowToast={showToast}
                onNavigateToLab={() => setCurrentView('lab_sampling')}
                onOpenNewInvoice={async () => {
                  await fetchAllData();
                  setMoveTypeFilter('out_invoice');
                  setAutoOpenInvoiceCreate(true);
                  setReturnToSessionMode(true);
                  setCurrentView('invoices');
                }}
                onOpenNewPayment={async () => {
                  await fetchAllData();
                  setAutoOpenPaymentModal(true);
                  setReturnToSessionMode(true);
                  setCurrentView('payments');
                }}
                onPayInvoice={handlePayInvoice}
              />
            )}

            {currentView === 'insurance_claims' && (
              <InsuranceClaimsView
                moves={moves}
                partners={partners}
                company={company}
                currentUser={currentUser}
                onOpenPdf={(move) => setPdfMove(move)}
                onRegisterPayment={async (p) => {
                  const res = await handleRegisterPayment(p);
                  await fetchAllData();
                  return res;
                }}
                onNavigateToInvoices={() => setCurrentView('invoices')}
              />
            )}

            {currentView === 'partners' && (
              <PartnersView
                partners={partners}
                countries={countries}
                onSavePartner={handleSavePartner}
                onDeletePartner={handleDeletePartner}
                partnerReductions={partnerReductions}
                onSaveReduction={handleSavePartnerReduction}
                onDeleteReduction={handleDeletePartnerReduction}
              />
            )}

            {currentView === 'patient_dossiers' && (
              <PatientDossiersDirectoryView
                partners={partners}
                moves={moves}
                labOrders={labOrders}
                company={company}
                onOpenPdf={(m) => setPdfMove(m)}
              />
            )}

            {currentView === 'products' && (
              <ProductsView
                products={products}
                uoms={uoms}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onRefreshProducts={fetchAllData}
              />
            )}

            {currentView === 'users' && (
              <UsersView
                users={users}
                groups={groups}
                partners={partners}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSaveGroup={handleSaveGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}

            {currentView === 'company' && (
              <CompanySettingsView
                company={company}
                onSaveCompany={handleSaveCompany}
              />
            )}

            {currentView === 'notifications' && (
              <NotificationsView
                notifications={notifications || []}
                company={company}
                overdueMoves={(moves || []).filter(
                  (m) =>
                    m &&
                    m.state === 'posted' &&
                    m.amount_residual > 0 &&
                    m.invoice_date_due &&
                    m.invoice_date_due < new Date().toISOString().split('T')[0]
                )}
                onSendReminder={handleSendReminder}
              />
            )}

            {currentView === 'logs_audit' && (
              <LogsAuditView
                company={company}
                currentUser={currentUser}
                labOrders={labOrders}
              />
            )}

            {currentView === 'schema' && (
              <SchemaErdView
                rawSql={schemaSql}
                tables={schemaTables}
                onExecuteSql={handleExecuteSql}
              />
            )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Printable / Preview PDF Modal */}
      {pdfMove && (
        <InvoicePdfModal
          move={pdfMove}
          company={company}
          onClose={() => setPdfMove(null)}
          onSendEmail={(mId) => {
            handleSendReminder(mId);
            setPdfMove(null);
          }}
          onOpenPaymentModal={(m) => {
            setPdfMove(null);
            handleOpenPaymentModal(m);
          }}
        />
      )}

      {/* Global Patient Dossier Medical and Billing History Lookup */}
      {isLookupOpen && lookupPatient && (
        <PatientDossierModal
          isOpen={isLookupOpen}
          onClose={() => {
            setIsLookupOpen(false);
            setLookupPatient(null);
          }}
          patient={lookupPatient}
          moves={moves}
          labOrders={labOrders}
          company={company}
          onOpenPdf={(move) => setPdfMove(move)}
        />
      )}

      {/* Floating Inactivity Warning Banner */}
      <AnimatePresence>
        {inactivityWarningSeconds !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[110] max-w-md bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-amber-500/50 flex items-start space-x-3.5"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Alerte Inactivité
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black">
                  {inactivityWarningSeconds}s
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Par mesure de confidentialité médicale, votre session sera verrouillée dans{' '}
                <strong className="text-amber-400 font-mono">{inactivityWarningSeconds} secondes</strong>.
              </p>
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={resetActivity}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-md transition shadow-xs cursor-pointer"
                >
                  Prolonger ma session
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Toast Notifications Container with smooth motion transitions */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl border backdrop-blur-sm flex items-start space-x-3 transition ${
                toast.type === 'success'
                  ? 'bg-slate-900/95 text-white border-slate-700/80'
                  : toast.type === 'error'
                  ? 'bg-rose-900/95 text-white border-rose-700/80'
                  : toast.type === 'warning'
                  ? 'bg-amber-900/95 text-white border-amber-700/80'
                  : 'bg-indigo-950/95 text-white border-indigo-700/80'
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {toast.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {toast.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                {toast.type === 'warning' && (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                {toast.type === 'info' && (
                  <Info className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-90 mb-0.5">
                    {toast.title}
                  </div>
                )}
                <div className="text-xs font-semibold leading-snug">
                  {toast.text}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-white/60 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
