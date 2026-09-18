import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Pill,
  ShoppingBag,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ShieldAlert,
  Settings,
  CreditCard,
  User,
  ArrowRight,
  RefreshCw,
  Trash2,
  FileText,
  BadgeAlert,
  Zap,
  TrendingDown,
  Layers,
  Lock,
  Download,
  Eye,
  Check,
  Building,
  DollarSign,
  Send,
  Sliders,
  Bell,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { ResUser, ResPartner, AppView, ProductProduct, AccountMove, AppNotification } from '../types';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY, getCurrentDateDDMMYYYY, getCurrentDateTimeDDMMYYYY } from '../utils/dateUtils';
import { formatFCFA } from '../lib/formatters';
import { printDocumentById } from '../lib/printUtils';

interface PharmacyViewProps {
  currentUser: ResUser | null;
  partners?: ResPartner[];
  products?: ProductProduct[];
  currentSubView?: AppView;
  onNavigateToView?: (view: AppView) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onAddNotification?: (notif: Partial<AppNotification>) => void;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  quantityPrescribed: number;
  quantityDispensed: number;
  unitPrice: number;
  stockAvailable: number;
  instructions: string;
  isAvailable: boolean;
}

export interface ElectronicPrescription {
  id: string;
  prescNumber: string;
  doctorName: string;
  doctorSpecialty: string;
  patientName: string;
  patientNdm: string;
  patientAge: number;
  date: string;
  time: string;
  urgencyLevel: 'ccmu1' | 'ccmu2' | 'standard';
  status: 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled';
  solvencyStatus: 'Prise en Charge Assurance (80%)' | 'Paiement Comptant Requis' | 'Gratuité Urgence Vitale';
  totalAmount: number;
  insuranceShare: number;
  patientShare: number;
  items: PrescriptionItem[];
}

export interface DrugStockItem {
  id: string;
  code: string;
  dci: string; // Dénomination Commune Internationale
  commercialName: string;
  category: 'Antibiotiques' | 'Antalgiques & Anti-inflammatoires' | 'Solutés Injectables' | 'Bronchodilatateurs' | 'Cardiologie' | 'Stupéfiants & Controlled';
  form: 'Comprimé' | 'Gélule' | 'Ampoule Injectable' | 'Flacon Sirop' | 'Sachet' | 'Pommade';
  batchNumber: string;
  expiryDate: string;
  stockCurrent: number;
  thresholdMin: number;
  unitPriceCost: number;
  unitPriceSale: number;
  location: string;
  status: 'normal' | 'low_stock' | 'expired' | 'narcotic';
}

export interface DepartmentRequisition {
  id: string;
  reqNumber: string;
  departmentName: string;
  requestedBy: string;
  date: string;
  priority: 'Haute Urgence' | 'Normale' | 'Stock Mensuel';
  status: 'En attente' | 'Approuvée' | 'Livrée' | 'Rejetée';
  itemsCount: number;
  totalValue: number;
}

export interface NarcoticLedgerEntry {
  id: string;
  date: string;
  time: string;
  drugName: string;
  batchNumber: string;
  prescribingDoctor: string;
  patientName: string;
  patientNdm: string;
  doseAdministered: string;
  quantityOut: number;
  balanceRemaining: number;
  pharmacistName: string;
  witnessNurse: string;
}

export const PharmacyView: React.FC<PharmacyViewProps> = ({
  currentUser,
  partners = [],
  products = [],
  currentSubView = 'pharmacy_dispensing',
  onNavigateToView,
  onShowToast,
  onAddNotification,
}) => {
  // Active Tab / Submenu State
  const [activeTab, setActiveTab] = useState<
    'dispensing' | 'stock' | 'orders' | 'expired' | 'narcotics' | 'sales' | 'settings'
  >('dispensing');
  const [prescDisplayMode, setPrescDisplayMode] = useState<'list' | 'cards'>('list');
  const [expandedPrescId, setExpandedPrescId] = useState<string | null>(null);

  // Sync subview from props if provided
  useEffect(() => {
    if (currentSubView === 'pharmacy_stock') setActiveTab('stock');
    else if (currentSubView === 'pharmacy_orders') setActiveTab('orders');
    else if (currentSubView === 'pharmacy_expired') setActiveTab('expired');
    else if (currentSubView === 'pharmacy_narcotics') setActiveTab('narcotics');
    else if (currentSubView === 'pharmacy_sales') setActiveTab('sales');
    else if (currentSubView === 'pharmacy_settings') setActiveTab('settings');
    else setActiveTab('dispensing');
  }, [currentSubView]);

  // Demo Datasets
  const [prescriptions, setPrescriptions] = useState<ElectronicPrescription[]>([
    {
      id: 'presc-001',
      prescNumber: 'ORD-2026-0891',
      doctorName: 'Dr. KONE Amadou',
      doctorSpecialty: 'Médecine Générale',
      patientName: 'Mme BAMBA Fatou',
      patientNdm: 'NDM-1102',
      patientAge: 34,
      date: '18/09/2026',
      time: '10:15',
      urgencyLevel: 'standard',
      status: 'pending',
      solvencyStatus: 'Prise en Charge Assurance (80%)',
      totalAmount: 25000,
      insuranceShare: 20000,
      patientShare: 5000,
      items: [
        {
          id: 'pi-1',
          drugName: 'Amoxicilline + Ac. Clavulanique 1g',
          dosage: '1 cp matin et soir pendant 7 jours',
          quantityPrescribed: 2,
          quantityDispensed: 0,
          unitPrice: 8500,
          stockAvailable: 142,
          instructions: 'Prendre au milieu des repas',
          isAvailable: true,
        },
        {
          id: 'pi-2',
          drugName: 'Paracétamol 1g Comprimé',
          dosage: '1 cp toutes les 8h si fièvre ou douleur',
          quantityPrescribed: 2,
          quantityDispensed: 0,
          unitPrice: 2000,
          stockAvailable: 310,
          instructions: 'Ne pas dépasser 4g/jour',
          isAvailable: true,
        },
        {
          id: 'pi-3',
          drugName: 'Phloroglucinol (Spasfon) 80mg',
          dosage: '2 cp en cas de spasmes',
          quantityPrescribed: 1,
          quantityDispensed: 0,
          unitPrice: 4000,
          stockAvailable: 85,
          instructions: 'Symptomatique',
          isAvailable: true,
        },
      ],
    },
    {
      id: 'presc-002',
      prescNumber: 'ORD-2026-0892',
      doctorName: 'Dr. TOURE Bourama',
      doctorSpecialty: 'Urgences & Réanimation',
      patientName: 'Mme YAO Amoin',
      patientNdm: 'NDM-1554',
      patientAge: 52,
      date: '18/09/2026',
      time: '10:45',
      urgencyLevel: 'ccmu1',
      status: 'pending',
      solvencyStatus: 'Gratuité Urgence Vitale',
      totalAmount: 98000,
      insuranceShare: 98000,
      patientShare: 0,
      items: [
        {
          id: 'pi-4',
          drugName: 'Ceftriaxone 1g Injectable',
          dosage: '2g IVD en bolus immédiat',
          quantityPrescribed: 4,
          quantityDispensed: 0,
          unitPrice: 15000,
          stockAvailable: 18,
          instructions: 'Pratique infirmière d’urgence',
          isAvailable: true,
        },
        {
          id: 'pi-5',
          drugName: 'Soluté NaCl 0.9% 500ml',
          dosage: '1000ml en garde-veine rapide',
          quantityPrescribed: 5,
          quantityDispensed: 0,
          unitPrice: 3500,
          stockAvailable: 120,
          instructions: 'Remplissage vasculaire',
          isAvailable: true,
        },
        {
          id: 'pi-6',
          drugName: 'Adrénaline 1mg/ml Ampoule',
          dosage: '1mg en IVD immédiat',
          quantityPrescribed: 2,
          quantityDispensed: 0,
          unitPrice: 10000,
          stockAvailable: 5,
          instructions: 'Urgence vitale',
          isAvailable: true,
        },
      ],
    },
    {
      id: 'presc-003',
      prescNumber: 'ORD-2026-0885',
      doctorName: 'Dr. KOUASSI Jean',
      doctorSpecialty: 'Pédiatrie',
      patientName: 'Enfant DIALLO Oumar',
      patientNdm: 'NDM-0912',
      patientAge: 4,
      date: '18/09/2026',
      time: '09:30',
      urgencyLevel: 'standard',
      status: 'dispensed',
      solvencyStatus: 'Paiement Comptant Requis',
      totalAmount: 14500,
      insuranceShare: 0,
      patientShare: 14500,
      items: [
        {
          id: 'pi-7',
          drugName: 'Artemether + Luméfantrine Sirop 60ml',
          dosage: '1 cuillère mesure matin et soir',
          quantityPrescribed: 1,
          quantityDispensed: 1,
          unitPrice: 8500,
          stockAvailable: 64,
          instructions: 'Traitement du paludisme simple',
          isAvailable: true,
        },
        {
          id: 'pi-8',
          drugName: 'Sirop Paracétamol 2.4%',
          dosage: '1 dose/kg toutes les 6h',
          quantityPrescribed: 1,
          quantityDispensed: 1,
          unitPrice: 6000,
          stockAvailable: 90,
          instructions: 'Si T° > 38.5°C',
          isAvailable: true,
        },
      ],
    },
  ]);

  const [stockItems, setStockItems] = useState<DrugStockItem[]>([
    {
      id: 'med-01',
      code: 'AMX-1G',
      dci: 'Amoxicilline + Acide Clavulanique',
      commercialName: 'Augmentin 1g Comprimé',
      category: 'Antibiotiques',
      form: 'Comprimé',
      batchNumber: 'LOT-2026-A12',
      expiryDate: '12/2027',
      stockCurrent: 142,
      thresholdMin: 30,
      unitPriceCost: 6000,
      unitPriceSale: 8500,
      location: 'Rayon A - Étagère 2',
      status: 'normal',
    },
    {
      id: 'med-02',
      code: 'PAR-1G',
      dci: 'Paracétamol',
      commercialName: 'Doliprane 1g Comprimé',
      category: 'Antalgiques & Anti-inflammatoires',
      form: 'Comprimé',
      batchNumber: 'LOT-2026-B88',
      expiryDate: '08/2028',
      stockCurrent: 310,
      thresholdMin: 50,
      unitPriceCost: 1200,
      unitPriceSale: 2000,
      location: 'Rayon B - Étagère 1',
      status: 'normal',
    },
    {
      id: 'med-03',
      code: 'CRO-1G',
      dci: 'Ceftriaxone Sodium',
      commercialName: 'Rocéphine 1g Injectable',
      category: 'Antibiotiques',
      form: 'Ampoule Injectable',
      batchNumber: 'LOT-2025-X09',
      expiryDate: '11/2026',
      stockCurrent: 18,
      thresholdMin: 20,
      unitPriceCost: 11000,
      unitPriceSale: 15000,
      location: 'Chambre Froide 2-8°C',
      status: 'low_stock',
    },
    {
      id: 'med-04',
      code: 'ADR-1MG',
      dci: 'Adrénaline Chlorhydrate',
      commercialName: 'Adrénaline 1mg/ml Ampoule',
      category: 'Solutés Injectables',
      form: 'Ampoule Injectable',
      batchNumber: 'LOT-2026-AD5',
      expiryDate: '10/2026',
      stockCurrent: 5,
      thresholdMin: 15,
      unitPriceCost: 7000,
      unitPriceSale: 10000,
      location: 'Coffre d’Urgence Choc',
      status: 'low_stock',
    },
    {
      id: 'med-05',
      code: 'MOR-10MG',
      dci: 'Morphine Chlorhydrate',
      commercialName: 'Morphine 10mg/ml Injectable',
      category: 'Stupéfiants & Controlled',
      form: 'Ampoule Injectable',
      batchNumber: 'LOT-STUP-2026-01',
      expiryDate: '04/2027',
      stockCurrent: 12,
      thresholdMin: 10,
      unitPriceCost: 12000,
      unitPriceSale: 18000,
      location: 'Coffre Fort Blindé Sécurisé',
      status: 'narcotic',
    },
    {
      id: 'med-06',
      code: 'OXY-PER',
      dci: 'Eau Oxygénée 10 volumes',
      commercialName: 'Flacon Eau Oxygénée 250ml',
      category: 'Antalgiques & Anti-inflammatoires',
      form: 'Flacon Sirop',
      batchNumber: 'LOT-2023-P99',
      expiryDate: '10/2025', // Expired
      stockCurrent: 8,
      thresholdMin: 10,
      unitPriceCost: 1500,
      unitPriceSale: 2500,
      location: 'Zone de Quarantaine B',
      status: 'expired',
    },
  ]);

  const [requisitions, setRequisitions] = useState<DepartmentRequisition[]>([
    {
      id: 'req-1',
      reqNumber: 'REQ-2026-0041',
      departmentName: 'Service des Urgences & Réanimation',
      requestedBy: 'Infirmier Major KOUAME',
      date: '18/09/2026 08:30',
      priority: 'Haute Urgence',
      status: 'En attente',
      itemsCount: 8,
      totalValue: 185000,
    },
    {
      id: 'req-2',
      reqNumber: 'REQ-2026-0038',
      departmentName: 'Bloc Opératoire Central',
      requestedBy: 'Dr. ANESTHESISTE BLAISE',
      date: '17/09/2026 16:20',
      priority: 'Normale',
      status: 'Approuvée',
      itemsCount: 15,
      totalValue: 450000,
    },
  ]);

  const [narcoticsEntries, setNarcoticsEntries] = useState<NarcoticLedgerEntry[]>([
    {
      id: 'narc-1',
      date: '18/09/2026',
      time: '09:15',
      drugName: 'Morphine 10mg Ampoule',
      batchNumber: 'LOT-STUP-2026-01',
      prescribingDoctor: 'Dr. TOURE Bourama',
      patientName: 'M. KOFFI Serge (SCA ST+)',
      patientNdm: 'NDM-0441',
      doseAdministered: '5mg IVD lente',
      quantityOut: 1,
      balanceRemaining: 12,
      pharmacistName: 'Dr. PHARMACIEN LEA',
      witnessNurse: 'Inf. KANON Marc',
    },
  ]);

  // Direct OTC Sale Cart
  const [cartItems, setCartItems] = useState<{ drug: DrugStockItem; qty: number }[]>([]);
  const [selectedPatientForSale, setSelectedPatientForSale] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<ElectronicPrescription | null>(null);

  // Modals & Action States
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [newDrugForm, setNewDrugForm] = useState({
    dci: '',
    commercialName: '',
    category: 'Antibiotiques',
    form: 'Comprimé',
    batchNumber: '',
    expiryDate: '12/2027',
    stockCurrent: 100,
    thresholdMin: 20,
    unitPriceCost: 2000,
    unitPriceSale: 3500,
    location: 'Rayon A1',
  });

  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [selectedRequisitionForPrint, setSelectedRequisitionForPrint] = useState<DepartmentRequisition | null>(null);
  const [reqForm, setReqForm] = useState({
    departmentName: 'Bloc Opératoire & Chirurgie',
    requestedBy: currentUser?.name || 'Infirmier Major KOUAME',
    priority: 'Haute Urgence',
    itemsCount: 5,
    totalValue: 75000,
    notes: 'Réapprovisionnement d\'urgence pour le bloc opératoire',
  });

  const [showPvDestructionModal, setShowPvDestructionModal] = useState(false);
  const [showNarcoticsRegisterModal, setShowNarcoticsRegisterModal] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    receiptNumber: string;
    date: string;
    patientName: string;
    patientNdm?: string;
    doctorName?: string;
    items: { name: string; qty: number; price: number }[];
    totalAmount: number;
    patientShare?: number;
    insuranceShare?: number;
    solvencyStatus?: string;
  } | null>(null);

  const handleOpenReceipt = (data: {
    receiptNumber: string;
    date: string;
    patientName: string;
    patientNdm?: string;
    doctorName?: string;
    items: { name: string; qty: number; price: number }[];
    totalAmount: number;
    patientShare?: number;
    insuranceShare?: number;
    solvencyStatus?: string;
  }) => {
    setSelectedReceipt(data);
    setShowReceiptModal(true);
  };

  const handleAddDrugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugForm.commercialName || !newDrugForm.dci) {
      onShowToast?.('Veuillez spécifier le Nom Commercial et le Nom DCI.', 'warning');
      return;
    }
    const newItem: DrugStockItem = {
      id: `med-${Date.now()}`,
      code: `MED-${Math.floor(Math.random() * 9000 + 1000)}`,
      dci: newDrugForm.dci,
      commercialName: newDrugForm.commercialName,
      category: newDrugForm.category as any || 'Antibiotiques',
      form: newDrugForm.form as any || 'Comprimé',
      batchNumber: newDrugForm.batchNumber || `LOT-2026-${Math.floor(Math.random() * 900 + 100)}`,
      expiryDate: newDrugForm.expiryDate || '12/2027',
      stockCurrent: Number(newDrugForm.stockCurrent) || 100,
      thresholdMin: Number(newDrugForm.thresholdMin) || 20,
      unitPriceCost: Number(newDrugForm.unitPriceCost) || 2000,
      unitPriceSale: Number(newDrugForm.unitPriceSale) || 3500,
      location: newDrugForm.location || 'Rayon A1',
      status: (Number(newDrugForm.stockCurrent) <= Number(newDrugForm.thresholdMin)) ? 'low_stock' : 'normal',
    };
    setStockItems(prev => [newItem, ...prev]);
    setShowAddDrugModal(false);
    setNewDrugForm({
      dci: '',
      commercialName: '',
      category: 'Antibiotiques',
      form: 'Comprimé',
      batchNumber: '',
      expiryDate: '12/2027',
      stockCurrent: 100,
      thresholdMin: 20,
      unitPriceCost: 2000,
      unitPriceSale: 3500,
      location: 'Rayon A1',
    });
    onShowToast?.(`Médicament "${newItem.commercialName}" enregistré avec succès dans le stock !`, 'success');
  };

  const handleCreateRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const createdReq: DepartmentRequisition = {
      id: `req-${Date.now()}`,
      reqNumber: `REQ-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      departmentName: reqForm.departmentName,
      requestedBy: reqForm.requestedBy,
      date: getCurrentDateTimeDDMMYYYY(),
      priority: reqForm.priority as any || 'Haute Urgence',
      status: 'En attente',
      itemsCount: Number(reqForm.itemsCount) || 1,
      totalValue: Number(reqForm.totalValue) || 45000,
    };
    setRequisitions(prev => [createdReq, ...prev]);
    setShowRequisitionModal(false);
    onShowToast?.(`Nouvelle réquisition ${createdReq.reqNumber} transmise au service Pharmacie.`, 'success');
  };

  // OTC Direct Counter Sale State
  const [otcDrugId, setOtcDrugId] = useState<string>('med-01');
  const [otcQuantity, setOtcQuantity] = useState<number>(1);
  const [otcClientName, setOtcClientName] = useState<string>('Client Comptoir');
  const [otcPaymentMethod, setOtcPaymentMethod] = useState<string>('Espèces');
  const [otcSalesHistory, setOtcSalesHistory] = useState([
    {
      id: 'otc-1',
      date: '18/09/2026 11:20',
      clientName: 'Mme TOURE Aminata',
      drugName: 'Paracétamol 1g Comprimé',
      quantity: 2,
      totalAmount: 4000,
      paymentMethod: 'Espèces',
      receiptNumber: 'REC-PHARM-2026-0089',
    },
    {
      id: 'otc-2',
      date: '18/09/2026 10:05',
      clientName: 'M. BAMBA Lacina',
      drugName: 'Amoxicilline 500mg Gélule',
      quantity: 1,
      totalAmount: 4500,
      paymentMethod: 'Wave Mobile Money',
      receiptNumber: 'REC-PHARM-2026-0088',
    },
  ]);

  // Backoffice Module Configuration State
  const [pharmacyConfig, setPharmacyConfig] = useState<{
    enableDispensing: boolean;
    enableStock: boolean;
    enableOrders: boolean;
    enableExpired: boolean;
    enableNarcotics: boolean;
    enableDirectSales: boolean;
    alertExpiryDays: number;
    defaultMarginPercent: number;
    requireDoubleWitnessNarcotics: boolean;
  }>(() => {
    const saved = localStorage.getItem('hospital_pharmacy_config_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      enableDispensing: true,
      enableStock: true,
      enableOrders: true,
      enableExpired: true,
      enableNarcotics: true,
      enableDirectSales: true,
      alertExpiryDays: 60,
      defaultMarginPercent: 25,
      requireDoubleWitnessNarcotics: true,
    };
  });

  const handleSavePharmacyConfig = (updated: typeof pharmacyConfig) => {
    setPharmacyConfig(updated);
    localStorage.setItem('hospital_pharmacy_config_v1', JSON.stringify(updated));
    onShowToast?.('Paramètres backoffice de la pharmacie enregistrés avec succès.', 'success');
  };

  // Calculate Badges for all tabs
  const pendingPrescriptionsCount = prescriptions.filter(p => p.status === 'pending').length;
  const lowStockCount = stockItems.filter(s => s.stockCurrent <= s.thresholdMin && s.status !== 'expired').length;
  const expiredCount = stockItems.filter(s => s.status === 'expired').length;
  const pendingReqsCount = requisitions.filter(r => r.status === 'En attente').length;

  // Dispense action for prescription
  const handleDispensePrescription = (prescId: string) => {
    setPrescriptions(prev =>
      prev.map(p => {
        if (p.id === prescId) {
          // Deduct stock for items
          p.items.forEach(item => {
            setStockItems(stocks =>
              stocks.map(s => {
                if (s.commercialName.toLowerCase().includes(item.drugName.toLowerCase().split(' ')[0])) {
                  const newQty = Math.max(0, s.stockCurrent - item.quantityPrescribed);
                  return {
                    ...s,
                    stockCurrent: newQty,
                    status: newQty <= s.thresholdMin ? 'low_stock' : 'normal',
                  };
                }
                return s;
              })
            );
          });

          return { ...p, status: 'dispensed' };
        }
        return p;
      })
    );

    if (onShowToast) {
      onShowToast('✅ Ordonnance servie avec succès ! Déstockage automatique effectué & Quittance générée.', 'success');
    }

    if (onAddNotification) {
      onAddNotification({
        title: '💊 DISPENSATION PHARMACIE EFFECTUÉE',
        message: `L'ordonnance du patient ${selectedPrescription?.patientName || 'Patient'} a été délivrée. Reçu mis à jour.`,
        category: 'pharmacy',
        priority: 'normal',
        patientName: selectedPrescription?.patientName,
        actionView: 'invoices',
      });
    }

    setSelectedPrescription(null);
  };

  // Run full end-to-end workflow scenario simulation
  const handleRunFullScenario = () => {
    const newPresc: ElectronicPrescription = {
      id: `presc-${Date.now()}`,
      prescNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: 'Dr. KONE Amadou (Médecin Conseil)',
      doctorSpecialty: 'Consultation Externe',
      patientName: 'M. DIALLO Ousmane',
      patientNdm: 'NDM-2026-991',
      patientAge: 41,
      date: new Date().toLocaleDateString('fr-FR'),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      urgencyLevel: 'standard',
      status: 'pending',
      solvencyStatus: 'Prise en Charge Assurance (80%)',
      totalAmount: 32000,
      insuranceShare: 25600,
      patientShare: 6400,
      items: [
        {
          id: `item-${Date.now()}-1`,
          drugName: 'Amoxicilline + Acide Clavulanique 1g',
          dosage: '1 cp matin, midi et soir (8 jours)',
          quantityPrescribed: 3,
          quantityDispensed: 0,
          unitPrice: 8500,
          stockAvailable: 142,
          instructions: 'Antibiothérapie curative',
          isAvailable: true,
        },
        {
          id: `item-${Date.now()}-2`,
          drugName: 'Paracétamol 1g Comprimé',
          dosage: '1 cp toutes les 6h',
          quantityPrescribed: 2,
          quantityDispensed: 0,
          unitPrice: 2000,
          stockAvailable: 310,
          instructions: 'Analgesie',
          isAvailable: true,
        },
      ],
    };

    setPrescriptions(prev => [newPresc, ...prev]);

    if (onAddNotification) {
      onAddNotification({
        title: '💊 NOUVELLE ORDONNANCE ÉLECTRONIQUE (SIMULATION)',
        message: `Ordonnance ${newPresc.prescNumber} émise pour ${newPresc.patientName} (PEC Assurance 80%). Prête pour dispensation.`,
        category: 'pharmacy',
        priority: 'high',
        patientName: newPresc.patientName,
        patientNdm: newPresc.patientNdm,
        actionView: 'pharmacy_dispensing',
      });
    }

    if (onShowToast) {
      onShowToast('⚡ Scénario de test injecté : Prescription créée & transmise en temps réel à la Pharmacie !', 'success');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner - Clean 100% Human Design */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <FlaskConical className="w-3.5 h-3.5 text-slate-600" />
              <span>Plateau Technique Pharmacie &amp; Dispositifs Médicaux</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-slate-800" />
              Pharmacie Hospitalière &amp; Circuit Intégré du Médicament
            </h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-2xl leading-relaxed">
              Gestion centralisée des ordonnances, dispensation sécurisée avec déstockage en temps réel, traçabilité des stupéfiants et facturation intégrée.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRunFullScenario}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              title="Tester le workflow complet"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Lancer Scénario 360°</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards - Clean Human Design */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Ordonnances à Servir</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{pendingPrescriptionsCount}</div>
            </div>
            {pendingPrescriptionsCount > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-md">
                {pendingPrescriptionsCount} attente
              </span>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Stocks Sous Seuil</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{lowStockCount}</div>
            </div>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-md">
                {lowStockCount} alerte
              </span>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Périmés / Quarantaine</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{expiredCount}</div>
            </div>
            {expiredCount > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-md">
                {expiredCount} lot
              </span>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Réquisitions Urgences</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{pendingReqsCount}</div>
            </div>
            {pendingReqsCount > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-md">
                {pendingReqsCount} bon
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submenus Navigation Bar - 100% Human Clean Style */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white p-2 rounded-xl shadow-2xs overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('dispensing');
            onNavigateToView?.('pharmacy_dispensing' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'dispensing'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Ordonnances &amp; Dispensation</span>
          {pendingPrescriptionsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              {pendingPrescriptionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('stock');
            onNavigateToView?.('pharmacy_stock' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2. Stock &amp; Catalogue</span>
          {lowStockCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-600 text-white">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            onNavigateToView?.('pharmacy_orders' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>3. Commandes &amp; Réquisitions</span>
          {pendingReqsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-700 text-white">
              {pendingReqsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('expired');
            onNavigateToView?.('pharmacy_expired' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>4. Périmés &amp; Alertes</span>
          {expiredCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-700 text-white">
              {expiredCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('narcotics');
            onNavigateToView?.('pharmacy_narcotics' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'narcotics'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>5. Registre Stupéfiants</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sales');
            onNavigateToView?.('pharmacy_sales' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>6. Ventes Comptoir</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            onNavigateToView?.('pharmacy_settings' as any);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>7. Config Admin</span>
        </button>
      </div>

      {/* SUBVIEW 1: Prescriptions & Dispensing */}
      {activeTab === 'dispensing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  File d'Attente des Ordonnances Médicales Électroniques
                </h3>
                <p className="text-xs text-slate-500">
                  Délivrance sécurisée des produits prescrits et déstockage automatique.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{pendingPrescriptionsCount} ordonnance(s) en attente</span>
                </span>

                {/* View Mode Toggle: List (Default) vs Detailed Cards */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setPrescDisplayMode('list')}
                    title="Présentation en liste"
                    className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition ${
                      prescDisplayMode === 'list'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Liste</span>
                  </button>
                  <button
                    onClick={() => setPrescDisplayMode('cards')}
                    title="Présentation en cartes"
                    className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition ${
                      prescDisplayMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Cartes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prescriptions Presentation: Structured List (Default) or Cards */}
            {prescDisplayMode === 'list' ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">N° Ordonnance &amp; Statut</th>
                        <th className="py-3 px-3">Date (JJ/MM/AAAA)</th>
                        <th className="py-3 px-3">Patient &amp; Prescripteur</th>
                        <th className="py-3 px-3">Médicaments Prescrits</th>
                        <th className="py-3 px-3 text-right">Montant &amp; Prise en charge</th>
                        <th className="py-3 px-4 text-right">Délivrance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {prescriptions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Aucune ordonnance en attente.
                          </td>
                        </tr>
                      ) : (
                        prescriptions.map((presc) => {
                          const isExpanded = expandedPrescId === presc.id;
                          return (
                            <React.Fragment key={presc.id}>
                              <tr
                                className={`hover:bg-slate-50/70 transition ${
                                  presc.status === 'pending' ? 'bg-white' : 'bg-slate-50/40 opacity-75'
                                }`}
                              >
                                {/* Presc Number and Status */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                      {presc.prescNumber}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        presc.status === 'pending'
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      }`}
                                    >
                                      {presc.status === 'pending' ? 'En attente' : 'Délivrée'}
                                    </span>
                                  </div>
                                </td>

                                {/* Date JJ/MM/AAAA */}
                                <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                                  {presc.date} à {presc.time}
                                </td>

                                {/* Patient & Doctor */}
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-slate-900 text-xs">
                                    {presc.patientName}{' '}
                                    <span className="text-slate-400 font-mono text-[10px] font-normal">
                                      ({presc.patientNdm})
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {presc.doctorName} <span className="text-slate-400">({presc.doctorSpecialty})</span>
                                  </div>
                                </td>

                                {/* Drugs List Summary */}
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {presc.items.slice(0, 2).map((item) => (
                                      <span
                                        key={item.id}
                                        className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200"
                                      >
                                        {item.drugName} (x{item.quantityPrescribed})
                                      </span>
                                    ))}
                                    {presc.items.length > 2 && (
                                      <span className="text-[10px] text-slate-500 font-bold">
                                        +{presc.items.length - 2} autre(s)
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setExpandedPrescId(isExpanded ? null : presc.id)}
                                      className="ml-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 underline inline-flex items-center gap-0.5"
                                    >
                                      {isExpanded ? 'Masquer détail' : 'Voir détail'}
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </td>

                                {/* Amount & Share */}
                                <td className="py-3.5 px-3 text-right">
                                  <div className="font-black text-slate-900 text-xs">
                                    {presc.totalAmount.toLocaleString('fr-FR')} GN
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Assurance: {presc.insuranceShare.toLocaleString('fr-FR')} | Part: {presc.patientShare.toLocaleString('fr-FR')}
                                  </div>
                                </td>

                                {/* Action */}
                                <td className="py-3.5 px-4 text-right">
                                  {presc.status === 'pending' ? (
                                    <button
                                      onClick={() => handleDispensePrescription(presc.id)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Délivrer</span>
                                    </button>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1">
                                      <Printer className="w-3 h-3 text-slate-400" />
                                      <span>Reçu</span>
                                    </span>
                                  )}
                                </td>
                              </tr>

                              {/* Expanded posology details table for this row */}
                              {isExpanded && (
                                <tr className="bg-slate-50/90">
                                  <td colSpan={6} className="p-4 border-b border-slate-200">
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        Détail de la Prescription Médicale ({presc.prescNumber}) :
                                      </div>
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                          <tr>
                                            <th className="p-2">Désignation Médicament / DCI</th>
                                            <th className="p-2">Posologie &amp; Instructions</th>
                                            <th className="p-2 text-center">Quantité</th>
                                            <th className="p-2 text-right">Prix Unitaire</th>
                                            <th className="p-2 text-right">Sous-Total</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {presc.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                              <td className="p-2 font-bold text-slate-900">{item.drugName}</td>
                                              <td className="p-2 text-slate-600">
                                                {item.dosage} — <span className="text-slate-500 italic">{item.instructions}</span>
                                              </td>
                                              <td className="p-2 text-center font-bold text-slate-800">{item.quantityPrescribed}</td>
                                              <td className="p-2 text-right text-slate-600">{item.unitPrice.toLocaleString('fr-FR')} GN</td>
                                              <td className="p-2 text-right font-bold text-slate-900">
                                                {(item.unitPrice * item.quantityPrescribed).toLocaleString('fr-FR')} GN
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Prescriptions Cards Presentation */
              <div className="space-y-3">
                {prescriptions.map(presc => (
                  <div
                    key={presc.id}
                    className={`rounded-xl border transition shadow-2xs overflow-hidden ${
                      presc.status === 'pending'
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    {/* Row Top Header */}
                    <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-900 text-white">
                          {presc.prescNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          presc.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {presc.status === 'pending' ? 'En Attente' : 'Délivrée'}
                        </span>
                        <div className="text-xs text-slate-500">
                          Prescrit le <span className="font-bold text-slate-800">{presc.date}</span> à <span className="font-bold text-slate-800">{presc.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-xs font-medium">
                          {presc.solvencyStatus}
                        </span>
                      </div>
                    </div>

                    {/* Main Body List Section */}
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient &amp; Prescripteur</div>
                          <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                            {presc.patientName} <span className="text-slate-400 font-mono text-xs font-normal">({presc.patientNdm})</span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Médecin : <strong className="text-slate-800">{presc.doctorName}</strong> ({presc.doctorSpecialty})
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Montant Total</div>
                          <div className="text-base font-black text-slate-900">{presc.totalAmount.toLocaleString('fr-FR')} GN</div>
                          <div className="text-[11px] text-slate-500">
                            PEC: {presc.insuranceShare.toLocaleString('fr-FR')} GN | Part: {presc.patientShare.toLocaleString('fr-FR')} GN
                          </div>
                        </div>
                      </div>

                      {/* Prescription Items List Table */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Médicaments Prescrits ({presc.items.length}) :
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                              <tr>
                                <th className="p-2">Désignation Médicament / DCI</th>
                                <th className="p-2">Posologie &amp; Instructions</th>
                                <th className="p-2 text-center">Quantité</th>
                                <th className="p-2 text-right">Prix Unitaire</th>
                                <th className="p-2 text-right">Sous-Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                              {presc.items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="p-2 font-bold text-slate-900">{item.drugName}</td>
                                  <td className="p-2 text-slate-600">
                                    {item.dosage} — <em className="text-slate-500 font-normal">{item.instructions}</em>
                                  </td>
                                  <td className="p-2 text-center font-bold text-slate-900">{item.quantityPrescribed}</td>
                                  <td className="p-2 text-right text-slate-600">{item.unitPrice.toLocaleString('fr-FR')} GN</td>
                                  <td className="p-2 text-right font-bold text-slate-900">
                                    {(item.unitPrice * item.quantityPrescribed).toLocaleString('fr-FR')} GN
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 flex items-center justify-end border-t border-slate-100">
                        {presc.status === 'pending' ? (
                          <button
                            onClick={() => handleDispensePrescription(presc.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Délivrer &amp; Déstocker</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5">
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Imprimer Reçu</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: Stock & Drug Catalogue */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Catalogue & Inventaire du Stock de Pharmacie
              </h3>
              <p className="text-xs text-slate-500">
                Suivi précis des quantités, numéros de lot, dates de péremption et seuils de réapprovisionnement.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddDrugModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Médicament / Entrée</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par DCI, Nom commercial, Code, N° de Lot..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="all">Toutes les Catégories</option>
              <option value="Antibiotiques">Antibiotiques</option>
              <option value="Antalgiques & Anti-inflammatoires">Antalgiques & Anti-inflammatoires</option>
              <option value="Solutés Injectables">Solutés Injectables</option>
              <option value="Stupéfiants & Controlled">Stupéfiants & Substances Contrôlées</option>
            </select>
          </div>

          {/* Stock Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Code / DCI</th>
                  <th className="p-3">Nom Commercial</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3 text-center">N° Lot &amp; Péremption</th>
                  <th className="p-3 text-center">Stock Actuel</th>
                  <th className="p-3 text-right">Prix Unitaire</th>
                  <th className="p-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stockItems
                  .filter(item => {
                    const matchesSearch =
                      item.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.code.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCat = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
                    return matchesSearch && matchesCat;
                  })
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-[11px]">
                        <span className="font-bold text-slate-900">{item.code}</span>
                        <div className="text-slate-500">{item.dci}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{item.commercialName} ({item.form})</td>
                      <td className="p-3 text-slate-600">{item.category}</td>
                      <td className="p-3 text-center font-mono text-[11px]">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">{item.batchNumber}</span>
                        <div className="text-slate-500 mt-0.5">Exp: {formatDateDDMMYYYY(item.expiryDate)}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded font-bold ${
                          item.stockCurrent <= item.thresholdMin
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.stockCurrent}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Seuil min: {item.thresholdMin}</div>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        {formatFCFA(item.unitPriceSale)}
                      </td>
                      <td className="p-3 text-center">
                        {item.status === 'low_stock' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Stock Critique
                          </span>
                        )}
                        {item.status === 'expired' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            Périmé
                          </span>
                        )}
                        {item.status === 'narcotic' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                            Stupéfiant
                          </span>
                        )}
                        {item.status === 'normal' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            En Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: Requisitions & Supplier Orders - LIST PRESENTATION */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-700" />
                Réquisitions Inter-Services &amp; Bons de Commande Fournisseur
              </h3>
              <p className="text-xs text-slate-500">
                Suivi en liste des réapprovisionnements des services internes et commandes à la Pharmacie Centrale.
              </p>
            </div>

            <button
              onClick={() => setShowRequisitionModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Créer Réquisition Service</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Réf. Réquisition</th>
                  <th className="p-3">Service Demandeur</th>
                  <th className="p-3">Émis par</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Nb Références</th>
                  <th className="p-3 text-right">Montant Estimé</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requisitions.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{req.reqNumber}</td>
                    <td className="p-3 font-bold text-slate-900">{req.departmentName}</td>
                    <td className="p-3 text-slate-600">{req.requestedBy}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{formatDateTimeDDMMYYYY(req.date)}</td>
                    <td className="p-3 text-center font-bold text-slate-800">{req.itemsCount}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatFCFA(req.totalValue)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'En attente'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedRequisitionForPrint(req)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 border border-slate-900 transition cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" />
                        <span>Imprimer Bon</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 4: Expired & Quarantine - LIST PRESENTATION */}
      {activeTab === 'expired' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-slate-700" />
                Registre des Médicaments Périmés &amp; Zone de Quarantaine
              </h3>
              <p className="text-xs text-slate-500">
                Isolement réglementaire des lots périmés, suivi PV de destruction et retours fournisseurs.
              </p>
            </div>

            <button
              onClick={() => setShowPvDestructionModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Générer PV de Destruction Officiel</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Code / DCI</th>
                  <th className="p-3">Nom Commercial &amp; Forme</th>
                  <th className="p-3 text-center">N° de Lot</th>
                  <th className="p-3 text-center">Date Péremption</th>
                  <th className="p-3 text-center">Quantité Isolée</th>
                  <th className="p-3">Emplacement Quarantaine</th>
                  <th className="p-3 text-center">Statut Réglementaire</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stockItems.filter(s => s.status === 'expired' || s.stockCurrent <= 0).concat([
                  {
                    id: 'exp-demo-1',
                    code: 'CIP-500',
                    dci: 'Ciprofloxacine 500mg',
                    commercialName: 'Ciprofloxacine 500mg B/10',
                    category: 'Antibiotiques',
                    form: 'Comprimé',
                    batchNumber: 'LOT-2023-B11',
                    expiryDate: '15/01/2026',
                    stockCurrent: 14,
                    thresholdMin: 10,
                    unitPriceCost: 1200,
                    unitPriceSale: 2500,
                    location: 'Armoire Quarantaine B2',
                    status: 'expired',
                  }
                ]).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="p-3 font-bold text-slate-900">{item.commercialName} ({item.form})</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-700">{item.batchNumber}</td>
                    <td className="p-3 text-center font-mono text-rose-700 font-bold">{formatDateDDMMYYYY(item.expiryDate)}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">{item.stockCurrent} unités</td>
                    <td className="p-3 text-slate-600">{item.location || 'Zone de Quarantaine Scellée'}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold border border-rose-300">
                        Isolé en Quarantaine
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onShowToast?.(`Lot ${item.batchNumber} inclus dans le PV de destruction`, 'success')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-bold inline-flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                      >
                        <span>Inclure au PV</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 5: Narcotics Register - CLEAN LIST */}
      {activeTab === 'narcotics' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-700" />
                Registre Officiel des Stupéfiants &amp; Substances Contrôlées
              </h3>
              <p className="text-xs text-slate-500">
                Suivi strict de la Morphine, Fentanyl, Pethidine avec signature double témoin obligatoire.
              </p>
            </div>

            <button
              onClick={() => setShowNarcoticsRegisterModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter Registre Réglementaire</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Date &amp; Heure</th>
                  <th className="p-3">Produit Stupéfiant</th>
                  <th className="p-3">Médecin Prescripteur</th>
                  <th className="p-3">Patient &amp; NDM</th>
                  <th className="p-3 text-center">Dose</th>
                  <th className="p-3 text-center">Solde Restant</th>
                  <th className="p-3">Double Témoin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {narcoticsEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-[11px] text-slate-600">{formatDateDDMMYYYY(entry.date)} {entry.time}</td>
                    <td className="p-3 font-bold text-slate-900">{entry.drugName}</td>
                    <td className="p-3 text-slate-800">{entry.prescribingDoctor}</td>
                    <td className="p-3 text-slate-800 font-bold">{entry.patientName} ({entry.patientNdm})</td>
                    <td className="p-3 text-center font-bold text-rose-700">{entry.doseAdministered}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{entry.balanceRemaining} amp.</td>
                    <td className="p-3 text-xs text-slate-700 font-bold">{entry.pharmacistName} &amp; {entry.witnessNurse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 6: Direct OTC Sales - INTERACTIVE COUNTER */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-700" />
                Ventes Directes Comptoir &amp; Caisse Pharmacie (OTC)
              </h3>
              <p className="text-xs text-slate-500">
                Guichet de vente directe sans ordonnance préalable, calcul immédiat et quittance de caisse.
              </p>
            </div>
          </div>

          {/* Quick Sale Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs uppercase text-slate-600">Nouvelle Vente Directe</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Médicament / Produit</label>
                <select
                  value={otcDrugId}
                  onChange={e => setOtcDrugId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  {stockItems.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.commercialName} ({d.form}) - {formatFCFA(d.unitPriceSale)} [Dispo: {d.stockCurrent}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={otcQuantity}
                  onChange={e => setOtcQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mode de Règlement</label>
                <select
                  value={otcPaymentMethod}
                  onChange={e => setOtcPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="Espèces">Espèces</option>
                  <option value="Wave Mobile Money">Wave Mobile Money</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Carte Bancaire">Carte Bancaire</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Nom du Client :</span>
                <input
                  type="text"
                  value={otcClientName}
                  onChange={e => setOtcClientName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  placeholder="Client Comptoir"
                />
              </div>

              <div className="flex items-center gap-4">
                {(() => {
                  const drug = stockItems.find(d => d.id === otcDrugId) || stockItems[0];
                  const total = (drug ? drug.unitPriceSale : 0) * otcQuantity;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 font-bold block">Total à Payer</span>
                        <span className="font-mono text-base font-black text-slate-900">{formatFCFA(total)}</span>
                      </div>
                      <button
                        onClick={() => {
                          const newSale = {
                            id: `otc-${Date.now()}`,
                            date: getCurrentDateDDMMYYYY() + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            clientName: otcClientName || 'Client Comptoir',
                            drugName: drug?.commercialName || 'Médicament',
                            quantity: otcQuantity,
                            totalAmount: total,
                            paymentMethod: otcPaymentMethod,
                            receiptNumber: `REC-PHARM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                          };
                          setOtcSalesHistory(prev => [newSale, ...prev]);
                          onShowToast?.(`Vente validée ! Reçu ${newSale.receiptNumber} émis. Déstockage de ${otcQuantity} unités.`, 'success');
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Encaisser &amp; Émettre Quittance</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Recent OTC Sales History */}
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-600 mb-3">Historique des Ventes Comptoir Récentes</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">N° Quittance</th>
                    <th className="p-3">Date &amp; Heure</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Médicament</th>
                    <th className="p-3 text-center">Qté</th>
                    <th className="p-3 text-right">Montant Réglé</th>
                    <th className="p-3 text-center">Paiement</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {otcSalesHistory.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{sale.receiptNumber}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{sale.date}</td>
                      <td className="p-3 font-bold text-slate-900">{sale.clientName}</td>
                      <td className="p-3 text-slate-800">{sale.drugName}</td>
                      <td className="p-3 text-center font-bold text-slate-900">{sale.quantity}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{formatFCFA(sale.totalAmount)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() =>
                            handleOpenReceipt({
                              receiptNumber: sale.receiptNumber,
                              date: sale.date,
                              patientName: sale.clientName,
                              items: [{ name: sale.drugName, qty: sale.quantity, price: sale.totalAmount / (sale.quantity || 1) }],
                              totalAmount: sale.totalAmount,
                              patientShare: sale.totalAmount,
                              insuranceShare: 0,
                              solvencyStatus: `Payé Comptant (${sale.paymentMethod})`,
                            })
                          }
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 border border-slate-900 transition cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-white" />
                          <span>Reçu</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 7: Admin Settings - BACKOFFICE MANAGEMENT */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-700" />
                Paramétrage Admin &amp; Backoffice du Module Pharmacie
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Activez ou désactivez les sous-menus, configurez les marges et les seuils d'alertes réglementaires.
              </p>
            </div>

            <button
              onClick={() => handleSavePharmacyConfig(pharmacyConfig)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer la Configuration</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Submenu Access Management */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-700">Gestion de Visibilité des Sous-Menus</h4>
              <div className="space-y-2.5 text-xs">
                {[
                  { key: 'enableDispensing', label: '1. Ordonnances & Dispensation' },
                  { key: 'enableStock', label: '2. Stock & Catalogue Médicaments' },
                  { key: 'enableOrders', label: '3. Commandes & Réquisitions Inter-Services' },
                  { key: 'enableExpired', label: '4. Périmés & Zone de Quarantaine' },
                  { key: 'enableNarcotics', label: '5. Registre des Stupéfiants' },
                  { key: 'enableDirectSales', label: '6. Ventes Directes Comptoir (OTC)' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-800">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(pharmacyConfig as any)[item.key]}
                      onChange={e => setPharmacyConfig(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Thresholds & Operational Rules */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-700">Seuils &amp; Paramètres Opérationnels</h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Seuil d'alerte péremption précoce (en jours avant expiration) :
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={pharmacyConfig.alertExpiryDays}
                    onChange={e => setPharmacyConfig(prev => ({ ...prev, alertExpiryDays: parseInt(e.target.value) || 60 }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Alerte automatique sur le tableau de bord.</p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Marge bénéficiaire moyenne par défaut (%) :
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pharmacyConfig.defaultMarginPercent}
                    onChange={e => setPharmacyConfig(prev => ({ ...prev, defaultMarginPercent: parseInt(e.target.value) || 25 }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block">Double témoin obligatoire pour les stupéfiants</span>
                      <span className="text-[10px] text-slate-500">Exige la signature d'un infirmier et du pharmacien</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={pharmacyConfig.requireDoubleWitnessNarcotics}
                      onChange={e => setPharmacyConfig(prev => ({ ...prev, requireDoubleWitnessNarcotics: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD DRUG --- */}
      {showAddDrugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Ajouter un Médicament au Stock</h3>
              <button
                onClick={() => setShowAddDrugModal(false)}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDrugSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dénomination Commune Internationale (DCI) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Paracétamol 500mg, Amoxicilline 1g"
                    value={newDrugForm.dci}
                    onChange={e => setNewDrugForm(p => ({ ...p, dci: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom Commercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Doliprane 500mg, Clamoxyl 1g"
                    value={newDrugForm.commercialName}
                    onChange={e => setNewDrugForm(p => ({ ...p, commercialName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={newDrugForm.category}
                    onChange={e => setNewDrugForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Antibiotiques">Antibiotiques</option>
                    <option value="Antalgiques">Antalgiques</option>
                    <option value="Anti-inflammatoires">Anti-inflammatoires</option>
                    <option value="Stupéfiants">Stupéfiants</option>
                    <option value="Consommables">Consommables</option>
                    <option value="Solutés">Solutés</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Forme Galénique</label>
                  <select
                    value={newDrugForm.form}
                    onChange={e => setNewDrugForm(p => ({ ...p, form: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Comprimé">Comprimé</option>
                    <option value="Gélule">Gélule</option>
                    <option value="Sirop">Sirop</option>
                    <option value="Injectable">Injectable</option>
                    <option value="Pommade">Pommade</option>
                    <option value="Dispositif">Dispositif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">N° de Lot</label>
                  <input
                    type="text"
                    placeholder="LOT-2026-X"
                    value={newDrugForm.batchNumber}
                    onChange={e => setNewDrugForm(p => ({ ...p, batchNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date d'expiration</label>
                  <input
                    type="text"
                    placeholder="MM/AAAA"
                    value={newDrugForm.expiryDate}
                    onChange={e => setNewDrugForm(p => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Initial</label>
                  <input
                    type="number"
                    value={newDrugForm.stockCurrent}
                    onChange={e => setNewDrugForm(p => ({ ...p, stockCurrent: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seuil Alerte Min</label>
                  <input
                    type="number"
                    value={newDrugForm.thresholdMin}
                    onChange={e => setNewDrugForm(p => ({ ...p, thresholdMin: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">P.U Achat (FCFA)</label>
                  <input
                    type="number"
                    value={newDrugForm.unitPriceCost}
                    onChange={e => setNewDrugForm(p => ({ ...p, unitPriceCost: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">P.U Vente (FCFA)</label>
                  <input
                    type="number"
                    value={newDrugForm.unitPriceSale}
                    onChange={e => setNewDrugForm(p => ({ ...p, unitPriceSale: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emplacement dans la pharmacie</label>
                  <input
                    type="text"
                    placeholder="ex: Rayon B, Armoire A3"
                    value={newDrugForm.location}
                    onChange={e => setNewDrugForm(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDrugModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: NEW REQUISITION --- */}
      {showRequisitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Émettre un Bon de Réquisition Service</h3>
              <button
                onClick={() => setShowRequisitionModal(false)}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRequisitionSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Demandeur</label>
                <select
                  value={reqForm.departmentName}
                  onChange={e => setReqForm(p => ({ ...p, departmentName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value="Bloc Opératoire & Chirurgie">Bloc Opératoire & Chirurgie</option>
                  <option value="Service des Urgences & Réanimation">Service des Urgences & Réanimation</option>
                  <option value="Maternité & Gynécologie">Maternité & Gynécologie</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Médecine Générale">Médecine Générale</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Émis par (Major / Responsable)</label>
                <input
                  type="text"
                  required
                  value={reqForm.requestedBy}
                  onChange={e => setReqForm(p => ({ ...p, requestedBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Niveau d'Urgence / Priorité</label>
                <select
                  value={reqForm.priority}
                  onChange={e => setReqForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value="Haute Urgence">Haute Urgence (Bloc / Réa)</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre d'articles</label>
                  <input
                    type="number"
                    min="1"
                    value={reqForm.itemsCount}
                    onChange={e => setReqForm(p => ({ ...p, itemsCount: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valeur estimée (FCFA)</label>
                  <input
                    type="number"
                    value={reqForm.totalValue}
                    onChange={e => setReqForm(p => ({ ...p, totalValue: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes explicatives</label>
                <textarea
                  value={reqForm.notes}
                  onChange={e => setReqForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs h-16"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  Transmettre Réquisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: PV DESTRUCTION --- */}
      {showPvDestructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Génération de Procès-Verbal Réglementaire</h3>
              <button
                onClick={() => setShowPvDestructionModal(false)}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              {/* Le document imprimable */}
              <div
                id="printable-pv-destruction"
                className="p-8 bg-white border border-slate-300 text-slate-900 font-serif leading-relaxed text-xs shadow-inner space-y-6"
              >
                <div className="text-center font-bold uppercase tracking-wider space-y-1">
                  <p>République de Côte d'Ivoire</p>
                  <p>Union - Discipline - Travail</p>
                  <p className="text-[10px] text-slate-500 font-sans">---</p>
                  <p>Ministère de la Santé et de l'Hygiène Publique</p>
                  <p>Direction Nationale de la Pharmacie et du Médicament</p>
                </div>

                <div className="border-t border-b-2 border-slate-800 py-3 text-center space-y-1">
                  <h4 className="text-sm font-black tracking-wide uppercase">
                    PROCÈS-VERBAL DE DESTRUCTION DE PRODUITS PHARMACEUTIQUES PÉRIMÉS
                  </h4>
                  <p className="text-[10px] font-sans font-bold text-slate-600">Réf: PV-DESTR-{getCurrentDateDDMMYYYY().replace(/\//g, '')}</p>
                </div>

                <div className="space-y-3 font-serif">
                  <p>
                    L'an deux mille vingt-six, le <strong className="font-bold">{getCurrentDateDDMMYYYY()}</strong>, il a été procédé à l'inventaire réglementaire et à la destruction physique des lots de médicaments périmés et altérés isolés au sein de la pharmacie de l'établissement.
                  </p>
                  <p>
                    La commission de destruction, dûment constituée du Pharmacien Chef, du Directeur d'Établissement et de l'Inspecteur Général de la Santé, a validé l'inutilisabilité des lots désignés ci-après :
                  </p>
                </div>

                {/* Table of destroyed goods */}
                <table className="w-full border-collapse border border-slate-800 font-sans text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-800 p-2 text-left">Médicament (DCI)</th>
                      <th className="border border-slate-800 p-2 text-center">N° Lot</th>
                      <th className="border border-slate-800 p-2 text-center">Date Expir.</th>
                      <th className="border border-slate-800 p-2 text-center">Quantité</th>
                      <th className="border border-slate-800 p-2 text-right">Valeur Estimée</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 p-2 font-bold">Ciprofloxacine 500mg (Comprimé)</td>
                      <td className="border border-slate-800 p-2 text-center font-mono">LOT-2023-B11</td>
                      <td className="border border-slate-800 p-2 text-center text-rose-700">15/01/2026</td>
                      <td className="border border-slate-800 p-2 text-center">14 unités</td>
                      <td className="border border-slate-800 p-2 text-right font-mono">35 000 FCFA</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-2 font-bold">Artemether-Lumefantrine 80/480mg</td>
                      <td className="border border-slate-800 p-2 text-center font-mono">LOT-2024-C9</td>
                      <td className="border border-slate-800 p-2 text-center text-rose-700">10/2025</td>
                      <td className="border border-slate-800 p-2 text-center">8 boîtes</td>
                      <td className="border border-slate-800 p-2 text-right font-mono">20 000 FCFA</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="border border-slate-800 p-2 text-right">TOTAL DESTOCKED / PERDU :</td>
                      <td className="border border-slate-800 p-2 text-center">22 articles</td>
                      <td className="border border-slate-800 p-2 text-right font-mono">55 000 FCFA</td>
                    </tr>
                  </tbody>
                </table>

                <div className="space-y-3 font-serif">
                  <p>
                    <strong>Méthode de destruction agréée :</strong> Incinération à haute température selon les normes environnementales et de santé publique en vigueur.
                  </p>
                  <p>
                    En foi de quoi, le présent Procès-Verbal a été dressé pour servir et valoir ce que de droit.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-12 text-center font-serif text-[10px] min-h-[120px]">
                  <div>
                    <p className="underline font-bold">Le Pharmacien Chef</p>
                    <p className="text-[9px] text-slate-500 pt-16">Dr. KOFFI Amédée</p>
                  </div>
                  <div>
                    <p className="underline font-bold">Le Directeur d'Établissement</p>
                    <p className="text-[9px] text-slate-500 pt-16">M. TOURE Seydou</p>
                  </div>
                  <div>
                    <p className="underline font-bold">L'Inspecteur Régional de la Santé</p>
                    <p className="text-[9px] text-slate-500 pt-16">(Cachet et Signature)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-500">
                  Impression officielle sur format A4.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPvDestructionModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => printDocumentById('printable-pv-destruction', 'PV_Destruction_Medicaments')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Imprimer PV PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: NARCOTICS REGISTER --- */}
      {showNarcoticsRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Registre Réglementaire des Stupéfiants</h3>
              <button
                onClick={() => setShowNarcoticsRegisterModal(false)}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div
                id="printable-narcotics-register"
                className="p-6 bg-white border border-slate-300 text-slate-900 text-xs shadow-inner space-y-6"
              >
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h4 className="font-extrabold text-sm uppercase">Registre National des Substances Vénéneuses</h4>
                    <p className="text-[10px] text-slate-500">Sous-section A: Stupéfiants (Tableau B)</p>
                    <p className="text-[10px] text-slate-500">Établissement: CHR Centre Hospitalier Régional</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[10px] font-mono">Année Réglementaire: 2026</p>
                    <p className="text-[9px] text-slate-400">Registre scellé et paraphé par l'Ordre National</p>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-black text-xs uppercase tracking-wide bg-slate-100 py-1.5 border border-slate-300">
                    HISTORIQUE DES ENTRÉES ET DES SORTIES CONTRÔLÉES
                  </h3>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold">
                      <th className="border border-slate-300 p-2 text-left">Date &amp; Heure</th>
                      <th className="border border-slate-300 p-2 text-left">Substance active</th>
                      <th className="border border-slate-300 p-2 text-left">Médecin Prescripteur</th>
                      <th className="border border-slate-300 p-2 text-left">Patient &amp; NDM</th>
                      <th className="border border-slate-300 p-2 text-center">Quantité admin.</th>
                      <th className="border border-slate-300 p-2 text-center">Solde rest.</th>
                      <th className="border border-slate-300 p-2 text-left">Témoins / Signataires</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium divide-y divide-slate-200">
                    {narcoticsEntries.map(entry => (
                      <tr key={entry.id}>
                        <td className="border border-slate-300 p-2 font-mono">{formatDateDDMMYYYY(entry.date)} {entry.time}</td>
                        <td className="border border-slate-300 p-2 font-bold">{entry.drugName}</td>
                        <td className="border border-slate-300 p-2">{entry.prescribingDoctor}</td>
                        <td className="border border-slate-300 p-2 font-bold">{entry.patientName} ({entry.patientNdm})</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-rose-700">{entry.doseAdministered}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{entry.balanceRemaining} amp.</td>
                        <td className="border border-slate-300 p-2 font-sans text-[9px] text-slate-700">
                          <strong>Ph:</strong> {entry.pharmacistName} <br/> <strong>Inf:</strong> {entry.witnessNurse}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-2 border border-slate-200 p-3 bg-slate-50 rounded text-[10px]">
                  <p>
                    <strong>Déclaration réglementaire :</strong> Conformément à la législation sur les stupéfiants, l'administration de chaque dose a fait l'objet d'une prescription médicale sécurisée non-renouvelable et de l'authentification conjointe de deux professionnels de santé.
                  </p>
                </div>

                <div className="flex justify-between pt-6 text-[10px]">
                  <div>
                    <p className="underline font-bold">Visa du Pharmacien Inspecteur</p>
                    <p className="h-12"></p>
                  </div>
                  <div className="text-right">
                    <p className="underline font-bold">Date de contrôle et Visa</p>
                    <p className="font-mono text-[9px] pt-1 text-slate-500">Mis à jour le {getCurrentDateDDMMYYYY()} par le SIH</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-500">
                  Format officiel homologué par les autorités de régulation pharmaceutique.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNarcoticsRegisterModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => printDocumentById('printable-narcotics-register', 'Registre_Reglementaire_Stupefiants')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Imprimer le Registre</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: OTC RECEIPT --- */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Impression Reçu de Caisse</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Receipt Body styled like a high-fidelity thermal receipt */}
              <div
                id="printable-otc-receipt"
                className="bg-white p-6 border border-dashed border-slate-300 text-slate-900 font-mono text-[11px] leading-relaxed shadow-xs"
              >
                <div className="text-center font-bold space-y-1">
                  <p className="text-xs uppercase">PHARMACIE CHR PRINCIPAL</p>
                  <p>BOULEVARD DE LA SANTE</p>
                  <p>TÉL: 27 22 44 88 00</p>
                  <p className="text-[9px] text-slate-500 font-sans">--------------------------------</p>
                </div>

                <div className="space-y-1 my-3 text-[10px]">
                  <p><strong>REÇU DE VENTE COMPTOIR</strong></p>
                  <p>N° Reçu : {selectedReceipt.receiptNumber}</p>
                  <p>Date : {selectedReceipt.date}</p>
                  <p>Client/Patient : {selectedReceipt.patientName}</p>
                  {selectedReceipt.patientNdm && <p>N° Dossier : {selectedReceipt.patientNdm}</p>}
                  <p className="text-[9px] text-slate-500 font-sans">--------------------------------</p>
                </div>

                {/* Items */}
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-1">Désignation</th>
                      <th className="pb-1 text-center">Qté</th>
                      <th className="pb-1 text-right">P.U.</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 max-w-[120px] truncate">{item.name}</td>
                        <td className="py-1 text-center">{item.qty}</td>
                        <td className="py-1 text-right">{formatFCFA(item.price)}</td>
                        <td className="py-1 text-right">{formatFCFA(item.qty * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-[9px] text-slate-500 font-sans mt-3">--------------------------------</div>

                <div className="space-y-1 font-bold text-[11px] text-right">
                  <p>TOTAL À PAYER : {formatFCFA(selectedReceipt.totalAmount)}</p>
                  <p className="text-[10px] text-slate-700">Part Patient : {formatFCFA(selectedReceipt.patientShare ?? selectedReceipt.totalAmount)}</p>
                  <p className="text-[10px] text-slate-500">Part Assur. : {formatFCFA(selectedReceipt.insuranceShare ?? 0)}</p>
                </div>

                <div className="text-[9px] text-slate-500 font-sans my-2">--------------------------------</div>

                <div className="text-center text-[10px] space-y-1 font-sans">
                  <p className="font-bold">{selectedReceipt.solvencyStatus || "SOLVABLE & PAYÉ CASH"}</p>
                  <p>Merci pour votre confiance.</p>
                  <p className="text-[8px] text-slate-400">SIH Pharmacie v1.1 - Ticket de Caisse</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Fermer
                </button>
                <button
                  onClick={() => printDocumentById('printable-otc-receipt', 'Recu_Pharmacie_' + selectedReceipt.receiptNumber)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Imprimer le Reçu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 6: REQUISITION PRINT --- */}
      {selectedRequisitionForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Visualisation du Bon de Réquisition</h3>
              <button
                onClick={() => setSelectedRequisitionForPrint(null)}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div
                id="printable-requisition-bon"
                className="p-8 bg-white border border-slate-300 text-slate-900 font-sans text-xs shadow-inner space-y-6"
              >
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h4 className="font-extrabold text-sm uppercase">Bons de Réquisition Inter-Services</h4>
                    <p className="text-[10px] text-slate-500">Etablissement: Pharmacie du Centre Hospitalier</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-slate-800 font-mono">{selectedRequisitionForPrint.reqNumber}</p>
                    <p className="text-[9px] text-slate-500">Date d'émission: {formatDateTimeDDMMYYYY(selectedRequisitionForPrint.date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Service Demandeur</p>
                    <p className="font-extrabold text-slate-900">{selectedRequisitionForPrint.departmentName}</p>
                    <p className="text-slate-600">Émis par : {selectedRequisitionForPrint.requestedBy}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Spécifications réglementaires</p>
                    <p className="font-extrabold text-slate-900">Priorité : {selectedRequisitionForPrint.priority}</p>
                    <p className="text-slate-600">Statut actuel : {selectedRequisitionForPrint.status}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-[10px] uppercase text-slate-500 mb-2">Articles demandés et références réglementaires</h5>
                  <table className="w-full border-collapse border border-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-200">
                        <th className="p-2 text-left">N°</th>
                        <th className="p-2 text-left">Médicament / Spécialité</th>
                        <th className="p-2 text-center">Quantité demandée</th>
                        <th className="p-2 text-right">Marge ou estimation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border-b">01</td>
                        <td className="p-2 border-b font-bold">Antibiotiques &amp; Consommables d'Urgence</td>
                        <td className="p-2 border-b text-center">{selectedRequisitionForPrint.itemsCount} articles distincts</td>
                        <td className="p-2 border-b text-right font-mono font-bold">{formatFCFA(selectedRequisitionForPrint.totalValue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-slate-200 p-3 rounded bg-slate-50 text-[10px]">
                  <p><strong>Note d'approvisionnement :</strong> Ce bon doit être visé et tamponné par le Major du service émetteur puis validé par le Pharmacien Chef de garde avant toute sortie de stock.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-8 text-center text-[10px] min-h-[100px]">
                  <div>
                    <p className="underline font-bold">Le Service Émetteur (Visa)</p>
                    <p className="text-slate-500 pt-12">{selectedRequisitionForPrint.requestedBy}</p>
                  </div>
                  <div>
                    <p className="underline font-bold">Le Pharmacien Chef (Validation)</p>
                    <p className="text-slate-500 pt-12">(Signature &amp; Cachet)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-500">
                  Impression officielle sur format A4 de service.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRequisitionForPrint(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => printDocumentById('printable-requisition-bon', 'Bon_Requisition_' + selectedRequisitionForPrint.reqNumber)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Imprimer Bon PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
