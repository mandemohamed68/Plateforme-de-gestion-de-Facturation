import React, { useEffect, useState } from 'react';
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

  // Modals
  const [pdfMove, setPdfMove] = useState<AccountMove | null>(null);
  const [selectedMoveForPayment, setSelectedMoveForPayment] = useState<AccountMove | null>(null);
  const [lookupPatient, setLookupPatient] = useState<ResPartner | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Loading & Toast Notification
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

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
    
    // 1. Try to find patient by exact/partial NDM
    let foundPatient = partners.find(
      (p) => p.ndm && p.ndm.toLowerCase() === cleanQuery
    );
    
    // 2. If not found, try to find patient by name
    if (!foundPatient) {
      foundPatient = partners.find(
        (p) => p.name.toLowerCase().includes(cleanQuery)
      );
    }
    
    // 3. If not found, try to find by receipt/invoice number (AccountMove)
    if (!foundPatient) {
      const foundMove = moves.find(
        (m) => m.name && m.name.toLowerCase().includes(cleanQuery)
      );
      if (foundMove && foundMove.partner_id) {
        foundPatient = partners.find((p) => p.id === foundMove.partner_id);
      } else if (foundMove && foundMove.partner) {
        foundPatient = foundMove.partner;
      }
    }

    if (foundPatient) {
      setLookupPatient(foundPatient);
      setIsLookupOpen(true);
      showToast(`Dossier patient #${foundPatient.ndm || foundPatient.id} chargé !`);
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

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
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
  const handleSavePartner = async (partnerData: any) => {
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      if (res.ok) {
        showToast('Fiche Partenaire enregistrée !');
        
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
      }
    } catch (e) {
      showToast('Erreur partenaire', 'error');
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
    return <LoginView users={users} company={company} onLogin={handleLogin} />;
  }

  const activeUserSession = tillSessions.find(
    (s) =>
      (s.cashier_id === currentUser?.id || s.cashier_name === currentUser?.name) &&
      s.state === 'in_progress'
  );
  const hasActiveSession = Boolean(activeUserSession);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-slate-900 selection:text-white relative overflow-x-hidden">
      {/* Background Watermark Logo Layer (Filigrane visible et discret au-dessus du fond, non bloquant) */}
      {company.show_watermark !== false && (
        <div
          className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center overflow-hidden lg:pl-64 select-none"
          aria-hidden="true"
        >
          {company.logo_url ? (
            <div className="flex flex-col items-center justify-center -rotate-12 transition-transform">
              <img
                src={company.logo_url}
                alt=""
                style={{ opacity: Math.max(company.watermark_opacity || 0.12, 0.10) }}
                className="w-96 h-96 sm:w-[520px] sm:h-[520px] object-contain select-none pointer-events-none"
              />
              {company.watermark_text && (
                <div
                  style={{ opacity: Math.max((company.watermark_opacity || 0.12) * 1.5, 0.15) }}
                  className="mt-3 text-center font-black uppercase text-slate-900 tracking-widest text-xs sm:text-sm select-none pointer-events-none"
                >
                  {company.watermark_text}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{ opacity: Math.max(company.watermark_opacity || 0.08, 0.08) }}
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
          <>
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
          </>
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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl font-extrabold text-xs text-white border animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 border-slate-700'
              : 'bg-rose-600 border-rose-400'
          }`}
        >
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
