import React, { useState, useRef, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Layers,
  FileCheck,
  Microscope,
  FlaskConical,
  Clock,
  Activity,
  AlertTriangle,
  FolderTree,
  Building,
  HelpCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Pill,
  Film,
  Stethoscope,
  BedDouble,
  Syringe,
  UploadCloud,
  Download,
  FileUp,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ProductProduct, UomUom } from '../types';
import { formatFCFA } from '../lib/formatters';

interface ProductsViewProps {
  products: ProductProduct[];
  uoms: UomUom[];
  onSaveProduct: (productData: any) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  onRefreshProducts?: () => Promise<void>;
}

const DEPARTMENTS_LIST = [
  'Biochimie Clinique',
  'Hématologie & Cytologie',
  'Sérologie & Immunologie',
  'Parasitologie & Mycologie',
  'Microbiologie & Bactériologie',
  'Immuno-Hématologie (Groupage)',
  'Hormonologie & Marqueurs',
  'Radiologie & Échographie',
  'Pharmacie Centrale & Solutés',
  'Consultations & Spécialités',
  'Soins Infirmiers & Pansements',
  'Hospitalisation & Reanimation',
];

const SAMPLE_TYPES = [
  'Sang total (Tube EDTA Violet)',
  'Sérum (Tube Sec Rouge / Jaune)',
  'Plasma Hépariné (Tube Vert)',
  'Plasma Citraté (Tube Bleu)',
  'Plasma Fluoré (Tube Gris - Glycémie)',
  'Urines fraîches du matin (Flacon Stérile)',
  'Selles fraîches (Coprologie)',
  'Prélèvement Vaginal / Écouvillon',
  'Ponction / Liquide Biologique',
  'Cliché / Film Radiologique',
  'Non applicable (Médicament / Soin)',
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products = [],
  uoms = [],
  onSaveProduct,
  onDeleteProduct,
  onRefreshProducts,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-seed comprehensive catalog if products list is empty on mount
  useEffect(() => {
    if (products.length === 0 && onRefreshProducts) {
      handleSeedComprehensiveCatalog();
    }
  }, []);
  
  // Custom CSV / Excel Upload Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto Template Seed Import
  const handleImportSeedTemplate = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/products/import-template', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ text: data.message, type: 'success' });
        if (onRefreshProducts) await onRefreshProducts();
      } else {
        setImportResult({ text: data.error || "Erreur lors de l'importation.", type: 'error' });
      }
    } catch (e: any) {
      setImportResult({ text: "Erreur réseau lors de l'importation.", type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const headers = 'Code;Nom;Type;Département;Prix_Public;Prix_TM;Prix_HP;Description\n';
    const sampleRows = [
      'MED-001;Paracétamol 500mg Comprimé;medication;Pharmacie Centrale & Solutés;500;100;500;Boîte de 20 comprimés',
      'MED-002;Amoxicilline 1g Injectable;medication;Pharmacie Centrale & Solutés;2500;500;2500;Poudre pour suspension injectable',
      'LAB-010;Glycémie à jeun;lab_exam;Biochimie Clinique;2000;400;2000;Dosage du glucose plasmatique',
      'LAB-020;NFS / Hémogramme Complet;lab_profile;Hématologie & Cytologie;6000;1200;6000;Numération Formule Sanguine',
      'RAD-005;Radio Thorax Face;imaging;Radiologie & Échographie;12000;2400;12000;Radiographie pulmonaire de face',
      'RAD-012;Échographie Abdominale;imaging;Radiologie & Échographie;18000;3600;18000;Échographie organes abdominaux',
      'ACT-001;Consultation Médecine Générale;service;Consultations & Spécialités;5000;1000;5000;Consultation médicale standard',
      'HOS-001;Chambre Standard Nuitée;hospitalization;Hospitalisation & Reanimation;15000;3000;15000;Séjour hospitalier par nuitée'
    ].join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + sampleRows);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', 'modele_import_prestations_hopital.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Client-side File Upload Handler for CSV/XLSX
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        // Parse CSV lines
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setImportResult({ text: "Le fichier CSV ne contient pas assez de données.", type: 'error' });
          return;
        }

        // Detect separator (; or , or tab)
        const headerLine = lines[0];
        const separator = headerLine.includes(';') ? ';' : headerLine.includes('\t') ? '\t' : ',';
        const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));

        const parsedData: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cells.length < 2) continue;

          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cells[idx] || '';
          });

          // Standardize fields
          const name = rowObj['Nom'] || rowObj['nom'] || rowObj['Désignation'] || rowObj['designation'] || rowObj['name'] || cells[1] || '';
          const code = rowObj['Code'] || rowObj['code'] || rowObj['Référence'] || rowObj['reference'] || cells[0] || `PRD-${Date.now()}-${i}`;
          const type = rowObj['Type'] || rowObj['type'] || rowObj['Catégorie'] || rowObj['category_type'] || 'service';
          const dept = rowObj['Département'] || rowObj['departement'] || rowObj['Department'] || 'Général';
          const pricePublic = Number(rowObj['Prix_Public'] || rowObj['Prix Public'] || rowObj['Prix'] || rowObj['prix_public'] || rowObj['list_price'] || cells[4] || 0);
          const priceTm = Number(rowObj['Prix_TM'] || rowObj['Prix TM'] || rowObj['prix_tm'] || cells[5] || 0);
          const priceHp = Number(rowObj['Prix_HP'] || rowObj['Prix HP'] || rowObj['prix_hp'] || cells[6] || 0);
          const desc = rowObj['Description'] || rowObj['description'] || cells[7] || '';

          if (name) {
            parsedData.push({
              default_code: code,
              name,
              category_type: type,
              lab_department: dept,
              list_price: pricePublic,
              prix_tm: priceTm,
              prix_hp: priceHp,
              description: desc,
            });
          }
        }

        setImportedRows(parsedData);
      } catch (err) {
        setImportResult({ text: "Erreur lors de la lecture du fichier CSV.", type: 'error' });
      }
    };

    reader.readAsText(file);
  };

  // Submit Batch Upload to API
  const handleConfirmBatchImport = async () => {
    if (importedRows.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/products/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importedRows })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ text: data.message, type: 'success' });
        setShowImportModal(false);
        setImportedRows([]);
        setImportFileName('');
        if (onRefreshProducts) await onRefreshProducts();
      } else {
        setImportResult({ text: data.error || "Erreur lors de l'importation.", type: 'error' });
      }
    } catch (e: any) {
      setImportResult({ text: "Erreur de connexion au serveur.", type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  // Seed comprehensive catalog
  const handleSeedComprehensiveCatalog = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/products/seed-comprehensive', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ text: data.message, type: 'success' });
        if (onRefreshProducts) await onRefreshProducts();
      } else {
        setImportResult({ text: data.error || "Erreur lors du rechargement du catalogue.", type: 'error' });
      }
    } catch (e: any) {
      setImportResult({ text: "Erreur de connexion au serveur.", type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  // Helper for category item count
  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.category_type === catId).length;
  };

  // Full form inline editing/creating mode state
  const [isFormActive, setIsFormActive] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductProduct | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [listPrice, setListPrice] = useState<number | string>(5000);
  const [prixTm, setPrixTm] = useState<number | string>(0);
  const [prixHp, setPrixHp] = useState<number | string>(0);
  const [defaultCode, setDefaultCode] = useState('');
  const [uomId, setUomId] = useState(1);
  const [categoryType, setCategoryType] = useState<any>('lab_exam');
  const [labDepartment, setLabDepartment] = useState('Biochimie Clinique');
  const [labSampleType, setLabSampleType] = useState('Sang total (Tube EDTA Violet)');
  const [labReferenceRange, setLabReferenceRange] = useState('');
  const [labTurnaroundTime, setLabTurnaroundTime] = useState('2 heures');
  const [labProfileExamsText, setLabProfileExamsText] = useState('');
  const [articleCategory, setArticleCategory] = useState('All');
  const [labTests, setLabTests] = useState<{ name: string; unit: string; reference_range: string }[]>([]);
  const [expandedProductIds, setExpandedProductIds] = useState<number[]>([]);

  const toggleProductExpand = (id: number) => {
    setExpandedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddLabTest = () => {
    setLabTests([...labTests, { name: '', unit: '', reference_range: '' }]);
  };

  const handleUpdateLabTest = (index: number, field: 'name' | 'unit' | 'reference_range', value: string) => {
    const updated = [...labTests];
    updated[index][field] = value;
    setLabTests(updated);
  };

  const handleRemoveLabTest = (index: number) => {
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const handleOpenCreateForm = (defaultCategory?: string) => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setListPrice(5000);
    setPrixTm(0);
    setPrixHp(0);
    setDefaultCode(`PREST-${Date.now().toString().slice(-4)}`);
    setUomId(1);
    setCategoryType(defaultCategory || 'lab_exam');
    setLabDepartment('Biochimie Clinique');
    setLabSampleType('Sang total (Tube EDTA Violet)');
    setLabReferenceRange('');
    setLabTurnaroundTime('2 heures');
    setLabProfileExamsText('');
    setArticleCategory('All');
    setLabTests([]);
    setIsFormActive(true);
  };

  const handleOpenEditForm = (p: ProductProduct) => {
    setEditingProduct(p);
    setName(p.name || '');
    setDescription(p.description || '');
    setListPrice(p.list_price || 0);
    setPrixTm(p.prix_tm || 0);
    setPrixHp(p.prix_hp || 0);
    setDefaultCode(p.default_code || '');
    setUomId(p.uom_id || 1);
    setCategoryType(p.category_type || 'lab_exam');
    setLabDepartment(p.lab_department || 'Biochimie Clinique');
    setLabSampleType(p.lab_sample_type || 'Sang total (Tube EDTA Violet)');
    setLabReferenceRange(p.lab_reference_range || '');
    setLabTurnaroundTime(p.lab_turnaround_time || '2 heures');
    setLabProfileExamsText((p.lab_profile_exams || []).join('\n'));
    setArticleCategory('All');
    setLabTests(p.lab_tests || []);
    setIsFormActive(true);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!name.trim()) return;

    const profileExams = labProfileExamsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await onSaveProduct({
      id: editingProduct?.id,
      name: name.trim(),
      description: description.trim(),
      list_price: Number(listPrice) || 0,
      prix_tm: Number(prixTm) || 0,
      prix_hp: Number(prixHp) || 0,
      default_code: defaultCode.trim(),
      uom_id: Number(uomId),
      category_type: categoryType,
      lab_department: labDepartment,
      lab_sample_type: labSampleType,
      lab_reference_range: labReferenceRange.trim() || null,
      lab_turnaround_time: labTurnaroundTime.trim() || null,
      lab_profile_exams: profileExams,
      lab_tests: labTests,
    });
    
    setIsFormActive(false);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    await onDeleteProduct(productToDelete.id);
    setProductToDelete(null);
  };

  // Helper for Category Badges
  const renderCategoryBadge = (type?: string) => {
    switch (type) {
      case 'medication':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Pill className="w-3 h-3" />
            <span>Médicament</span>
          </span>
        );
      case 'imaging':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Film className="w-3 h-3" />
            <span>Imagerie</span>
          </span>
        );
      case 'lab_profile':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FlaskConical className="w-3 h-3" />
            <span>Bilan / Profil</span>
          </span>
        );
      case 'lab_exam':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Microscope className="w-3 h-3" />
            <span>Examen Labo</span>
          </span>
        );
      case 'hospitalization':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <BedDouble className="w-3 h-3" />
            <span>Hospitalisation</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Stethoscope className="w-3 h-3" />
            <span>Acte &amp; Soin</span>
          </span>
        );
    }
  };

  // Filter products
  const filteredProducts = products
    .filter((p) => {
      // Search filter
      const matchesSearch =
        (p.name || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.default_code || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toString().toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || p.category_type === filterType;

      // Department filter
      const matchesDept =
        selectedDepartment === 'all' || p.lab_department === selectedDepartment;

      return matchesSearch && matchesType && matchesDept;
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  return (
    <div className="space-y-6 pb-12">
      
      {/* FORM MODE: Prestations Form View */}
      {isFormActive ? (
        <div className="bg-slate-50 min-h-screen -mx-4 md:-mx-8 p-4 md:p-8 animate-in fade-in duration-200">
          
          {/* Top Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <span>Catalogue des prestations</span>
                <span>/</span>
                <span className="text-slate-700 font-bold">{editingProduct ? 'Modifier' : 'Nouveau'}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {editingProduct ? `Prestations / ${editingProduct.name}` : 'Prestations / Nouveau'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Sauvegarder</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFormActive(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-md transition cursor-pointer border border-slate-300 bg-white"
              >
                Ne pas sauvegarder
              </button>
            </div>
          </div>

          {/* Card Sheet */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            
            {/* Header Field: Act Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Désignation de la prestation / Article</label>
              <input
                type="text"
                required
                placeholder="Ex: Paracétamol 500mg, Radio Thorax, Glycémie..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-lg md:text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-slate-900 focus:outline-none pb-2 transition-all"
              />
            </div>

            {/* Main Form Fields Grid (Left Column / Right Column) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              
              {/* LEFT COLUMN: Identification & Categorization */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wide">Identification &amp; Catégorie</h3>
                
                {/* Référence Interne */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Référence / Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Code interne"
                    value={defaultCode}
                    onChange={(e) => setDefaultCode(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Type de Prestation */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Famille / Nature</label>
                  <select
                    value={categoryType}
                    onChange={(e) => setCategoryType(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  >
                    <option value="medication">Pharmacie &amp; Médicament</option>
                    <option value="lab_exam">Examen de Laboratoire Individuel</option>
                    <option value="lab_profile">Bilan / Profil Complexe Multi-Analyses</option>
                    <option value="imaging">Imagerie Médicale (Radio/Écho/TDM)</option>
                    <option value="service">Consultation &amp; Acte de Soin</option>
                    <option value="hospitalization">Hospitalisation &amp; Séjour</option>
                  </select>
                </div>

                {/* Département Médical */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Département / Pôle</label>
                  <select
                    value={labDepartment}
                    onChange={(e) => setLabDepartment(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {DEPARTMENTS_LIST.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type d'Échantillon / Support */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Échantillon / Prélèvement</label>
                  <select
                    value={labSampleType}
                    onChange={(e) => setLabSampleType(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    {SAMPLE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RIGHT COLUMN: Tariff Structure */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wide">Tarification &amp; Grille de Prix</h3>

                {/* Prix de Vente (Public) */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Prix Public (Base)</label>
                  <div className="col-span-2 relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="5000"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded pl-2.5 pr-14 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none text-right"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400">FCFA</span>
                  </div>
                </div>

                {/* Prix Ticket Modérateur (TM) */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="flex items-center space-x-1">
                    <label className="text-xs font-bold text-slate-600">Prix TM (Assurance)</label>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      <div className="absolute z-50 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold rounded p-2 w-48 -left-20 top-5 leading-normal shadow-lg">
                        Montant restant à la charge du patient dans le cadre d'un partenariat ou d'une convention tiers payant.
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="0"
                      value={prixTm}
                      onChange={(e) => setPrixTm(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded pl-2.5 pr-14 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none text-right"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400">FCFA</span>
                  </div>
                </div>

                {/* Prix Hors Patient / Privé (HP) */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="flex items-center space-x-1">
                    <label className="text-xs font-bold text-slate-600">Prix HP (Privé)</label>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      <div className="absolute z-50 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold rounded p-2 w-48 -left-20 top-5 leading-normal shadow-lg">
                        Tarif appliqué pour les consultations ou examens hors couverture d'assurance / Privé total sans convention.
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="0"
                      value={prixHp}
                      onChange={(e) => setPrixHp(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded pl-2.5 pr-14 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none text-right"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400">FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Specifics & Description */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Clinical Description */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Informatons Complémentaires</h3>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Normes de Référence / Posologie de base</label>
                  <input
                    type="text"
                    placeholder="Ex: 0.70 - 1.10 g/L ou 1 comprimé 3x/jour"
                    value={labReferenceRange}
                    onChange={(e) => setLabReferenceRange(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Délai d'exécution / Disponibilité</label>
                  <input
                    type="text"
                    placeholder="Ex: 2 heures, Immédiat, 24h"
                    value={labTurnaroundTime}
                    onChange={(e) => setLabTurnaroundTime(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Description / Remarques pour les praticiens</label>
                  <textarea
                    rows={3}
                    placeholder="Saisissez ici des précisions de prescription ou d'utilisation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded p-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lab Exam Sub-Tests Parameters (if lab_exam / lab_profile) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Paramètres Spécifiques</h3>
                {categoryType === 'lab_profile' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Examens / Analyses inclus (un par ligne)</label>
                    <textarea
                      rows={6}
                      placeholder="Liste des examens inclus dans ce bilan..."
                      value={labProfileExamsText}
                      onChange={(e) => setLabProfileExamsText(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded p-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                    />
                  </div>
                ) : categoryType === 'lab_exam' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-500">Paramètres de sous-tests</label>
                      <button
                        type="button"
                        onClick={handleAddLabTest}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter un paramètre</span>
                      </button>
                    </div>

                    {labTests.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded p-4 text-center text-xs text-slate-400">
                        Aucun paramètre configuré.
                        <button
                          type="button"
                          onClick={handleAddLabTest}
                          className="block mx-auto mt-2 text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Créer le premier paramètre
                        </button>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-md overflow-hidden max-h-[220px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="p-2">Nom du Test</th>
                              <th className="p-2 w-24">Unité</th>
                              <th className="p-2 w-32">Valeurs Réf.</th>
                              <th className="p-2 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-xs">
                            {labTests.map((test, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="p-1">
                                  <input
                                    type="text"
                                    placeholder="Ex: Hémoglobine"
                                    value={test.name}
                                    onChange={(e) => handleUpdateLabTest(index, 'name', e.target.value)}
                                    className="w-full bg-transparent border-0 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    placeholder="Ex: g/dL"
                                    value={test.unit}
                                    onChange={(e) => handleUpdateLabTest(index, 'unit', e.target.value)}
                                    className="w-full bg-transparent border-0 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    placeholder="Ex: 12 - 16"
                                    value={test.reference_range}
                                    onChange={(e) => handleUpdateLabTest(index, 'reference_range', e.target.value)}
                                    className="w-full bg-transparent border-0 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLabTest(index)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full min-h-[160px]">
                    <Layers className="w-8 h-8 text-slate-300 mb-2" />
                    <span>Cette prestation est une fourniture ou un acte médical standard.</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        
        // LIST CATALOG MODE
        <>
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-xl text-slate-800 font-bold flex items-center space-x-2">
                <Package className="w-6 h-6 text-indigo-600" />
                <span>Paramétrage des Prestations &amp; Nomenclature Médicale</span>
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-1">
                Gérez les médicaments, examens de laboratoire, imageries médicales, consultations et tarifs TM/HP.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0 self-start md:self-auto">
              <button
                type="button"
                onClick={handleSeedComprehensiveCatalog}
                className="px-3 py-2 border border-indigo-200 hover:border-indigo-300 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 text-xs font-bold rounded-md shadow-xs transition duration-200 flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer"
                title="Charger les données de démonstration exhaustives (médicaments, radios, soins, bilans...)"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Générer Catalogue Exhaustif</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-md shadow-xs transition duration-200 flex items-center space-x-1.5 uppercase tracking-wider bg-white hover:bg-slate-50 cursor-pointer"
              >
                <FileUp className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Importer CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateForm()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition duration-200 flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Créer prestation</span>
              </button>
            </div>
          </div>

          {importResult && (
            <div className={`my-3 p-3 text-xs rounded-md border flex items-center justify-between transition-all duration-300 ${
              importResult.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span className="font-bold">{importResult.text}</span>
              </div>
              <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-600 font-black text-sm ml-2">×</button>
            </div>
          )}

          {/* Search & Category Tabs */}
          <div className="bg-white rounded-lg shadow-xs border border-slate-200/80 p-4 space-y-4">
            
            {/* Search Bar & Department Selector */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une prestation (médicament, radio, examen, code...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-md pl-9 pr-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="w-full md:w-64">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="all">Tous les Départements</option>
                  {DEPARTMENTS_LIST.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 border-t border-slate-100 pt-3 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 shrink-0">Famille :</span>
              {[
                { id: 'all', label: 'Toutes prestations' },
                { id: 'medication', label: 'Pharmacie & Médicaments' },
                { id: 'lab_exam', label: 'Examens Laboratoire' },
                { id: 'lab_profile', label: 'Bilans Complets' },
                { id: 'imaging', label: 'Imagerie Médicale' },
                { id: 'service', label: 'Consultations & Soins' },
                { id: 'hospitalization', label: 'Hospitalisation' },
              ].map((t) => {
                const count = getCategoryCount(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilterType(t.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                      filterType === t.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      filterType === t.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prestation Catalog Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-28">Réf. Code</th>
                    <th className="py-2.5 px-3">Désignation Prestation</th>
                    <th className="py-2.5 px-2">Famille</th>
                    <th className="py-2.5 px-2 hidden lg:table-cell">Département</th>
                    <th className="py-2.5 px-2 text-right">Prix Public</th>
                    <th className="py-2.5 px-2 text-right hidden sm:table-cell">Prix TM</th>
                    <th className="py-2.5 px-2 text-right hidden md:table-cell">Prix HP</th>
                    <th className="py-2.5 px-2 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 bg-slate-50/50">
                        Aucune prestation trouvée pour ces critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, idx) => (
                      <tr key={`prod-${p.id}-${p.default_code || idx}`} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] block truncate">
                            {p.default_code || `PREST-${p.id}`}
                          </span>
                        </td>
                        
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.description && (
                            <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate max-w-md">
                              {p.description}
                            </p>
                          )}
                        </td>
                        
                        <td className="py-2.5 px-2">
                          {renderCategoryBadge(p.category_type)}
                        </td>

                        <td className="py-2.5 px-2 text-slate-700 font-medium hidden lg:table-cell">
                          <span className="truncate block text-xs">{p.lab_department || 'Général'}</span>
                        </td>
                        
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                          {formatFCFA(p.list_price || 0)}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-900 bg-amber-50/20 hidden sm:table-cell">
                          {formatFCFA(p.prix_tm || 0)}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono font-bold text-indigo-900 bg-indigo-50/20 hidden md:table-cell">
                          {formatFCFA(p.prix_hp || 0)}
                        </td>
                        
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(p)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CSV / EXCEL IMPORTation MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Importation de Prestations par Fichier CSV / Excel</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs space-y-2 text-slate-600">
                <p className="font-bold text-slate-800">
                  Importez vos listes de médicaments, examens, imageries et tarifs en un clic.
                </p>
                <p>
                  Sélectionnez un fichier CSV ou Excel contenant les colonnes : <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Code</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Nom</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Type</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Prix_Public</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Prix_TM</code>.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCSV}
                    className="text-indigo-600 hover:underline font-bold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger le modèle de fichier CSV exemple</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleImportSeedTemplate}
                    disabled={isImporting}
                    className="text-emerald-700 hover:underline font-bold flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                    <span>Charger le catalogue standard serveur</span>
                  </button>
                </div>
              </div>

              {/* File Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Cliquez pour choisir un fichier CSV / TXT</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Formats acceptés : .csv, .txt, .tsv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {importFileName && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded text-emerald-800 font-bold">
                  <span className="truncate">Fichier sélectionné : {importFileName} ({importedRows.length} prestations détectées)</span>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              )}

              {/* Preview table if parsed */}
              {importedRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aperçu des 5 premiers éléments :</h4>
                  <div className="border border-slate-200 rounded max-h-40 overflow-y-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-1.5">Code</th>
                          <th className="p-1.5">Désignation</th>
                          <th className="p-1.5">Famille</th>
                          <th className="p-1.5 text-right">Prix Public</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-mono">{row.default_code}</td>
                            <td className="p-1.5 font-bold">{row.name}</td>
                            <td className="p-1.5">{row.category_type}</td>
                            <td className="p-1.5 text-right font-mono">{row.list_price} FCFA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-md bg-white hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={importedRows.length === 0 || isImporting}
                onClick={handleConfirmBatchImport}
                className={`px-5 py-2 text-white text-xs font-bold rounded-md flex items-center space-x-2 ${
                  importedRows.length === 0 || isImporting
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm'
                }`}
              >
                <span>{isImporting ? 'Importation...' : `Valider et importer (${importedRows.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md p-5 max-w-md w-full shadow-lg border border-slate-200 animate-in zoom-in-95 space-y-3">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Confirmer la suppression</h4>
            </div>
            <p className="text-xs text-slate-600">
              Êtes-vous sûr de vouloir supprimer la prestation{' '}
              <span className="font-bold text-slate-900">« {productToDelete.name} »</span> du catalogue ?
            </p>
            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md"
              >
                Supprimer la prestation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
