import React, { useState } from 'react';
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
  ChevronUp
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

const LAB_DEPARTMENTS = [
  'Biochimie Clinique',
  'Hématologie & Cytologie',
  'Sérologie & Immunologie',
  'Parasitologie & Mycologie',
  'Microbiologie & Bactériologie',
  'Immuno-Hématologie (Groupage)',
  'Hormonologie & Marqueurs',
  'Profils & Bilans de Santé',
  'Prestations & Soins Généraux',
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
  'Autre Échantillon',
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products = [],
  uoms = [],
  onSaveProduct,
  onDeleteProduct,
  onRefreshProducts,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'lab_exam' | 'lab_profile' | 'service'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Excel importation states
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleImportExcel = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/products/import-template', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ text: data.message, type: 'success' });
        if (onRefreshProducts) {
          await onRefreshProducts();
        }
      } else {
        setImportResult({ text: data.error || "Erreur lors de l'importation.", type: 'error' });
      }
    } catch (e: any) {
      setImportResult({ text: "Erreur réseau lors de l'importation.", type: 'error' });
    } finally {
      setIsImporting(false);
    }
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
  const [categoryType, setCategoryType] = useState<'service' | 'lab_exam' | 'lab_profile'>('lab_exam');
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

  const handleOpenCreateForm = (defaultDept?: string) => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setListPrice(5000);
    setPrixTm(0);
    setPrixHp(0);
    setDefaultCode(`PREST-${Date.now().toString().slice(-4)}`);
    setUomId(1);
    setCategoryType('lab_exam');
    setLabDepartment(defaultDept && defaultDept !== 'all' ? defaultDept : 'Biochimie Clinique');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Filter products
  const filteredProducts = products
    .filter((p) => {
      // Search filter
      const matchesSearch =
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.default_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());

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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Désignation de la prestation</label>
              <input
                type="text"
                required
                placeholder="Désignation de la prestation"
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
                  <label className="text-xs font-bold text-slate-600">Référence interne</label>
                  <input
                    type="text"
                    required
                    placeholder="Code ou Référence"
                    value={defaultCode}
                    onChange={(e) => setDefaultCode(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Catégorie d'article */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Catégorie d'article</label>
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  >
                    <option value="All">All</option>
                    <option value="Services">Services / Actes Médicaux</option>
                    <option value="Analyses">Analyses de Laboratoire</option>
                    <option value="Consultations">Consultations &amp; Avis</option>
                  </select>
                </div>

                {/* Département Médical */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Département médical</label>
                  <select
                    value={labDepartment}
                    onChange={(e) => setLabDepartment(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {LAB_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type d'Échantillon / Tube */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Échantillon / Tube</label>
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

              {/* RIGHT COLUMN: Prestation Type & Pricing */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wide">Tarification &amp; Type d'acte</h3>

                {/* Type Prestation */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Type de prestation</label>
                  <select
                    value={categoryType}
                    onChange={(e) => setCategoryType(e.target.value as any)}
                    className="col-span-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  >
                    <option value="lab_exam">Examen de Laboratoire Individuel</option>
                    <option value="lab_profile">Bilan / Profil Complet (Multi-Analyses)</option>
                    <option value="service">Prestation Générale / Acte de Soins</option>
                  </select>
                </div>

                {/* Prix de Vente (Public) */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Prix de vente (Base)</label>
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
                    <label className="text-xs font-bold text-slate-600">Prix TM</label>
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
                    <label className="text-xs font-bold text-slate-600">Prix HP</label>
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

            {/* Bottom section: Clinical description and dynamic inputs */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Clinical reference specifications */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Spécifications Cliniques</h3>
                
                {/* Normes de Référence */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Normes de Référence &amp; Valeurs Usuelles</label>
                  <input
                    type="text"
                    placeholder="Valeurs de référence"
                    value={labReferenceRange}
                    onChange={(e) => setLabReferenceRange(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Délai d'exécution */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Délai moyen d'exécution</label>
                  <input
                    type="text"
                    placeholder="Délai de rendu"
                    value={labTurnaroundTime}
                    onChange={(e) => setLabTurnaroundTime(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Description clinique */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Description / Indications cliniques</label>
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded p-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Profiles Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Composition &amp; Paramètres</h3>
                {categoryType === 'lab_profile' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Examens inclus (un par ligne)</label>
                    <textarea
                      rows={6}
                      placeholder="Liste des examens inclus"
                      value={labProfileExamsText}
                      onChange={(e) => setLabProfileExamsText(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded p-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Ces examens seront automatiquement listés et cochés lors de la prescription de ce bilan complet.
                    </p>
                  </div>
                ) : categoryType === 'lab_exam' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-500">Liste des tests / paramètres (Saisie des résultats)</label>
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
                        Aucun paramètre de sous-test configuré.
                        <button
                          type="button"
                          onClick={handleAddLabTest}
                          className="block mx-auto mt-2 text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Créer le premier paramètre
                        </button>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
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
                                    className="w-full bg-transparent hover:bg-white focus:bg-white border-0 focus:ring-1 focus:ring-indigo-600 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    placeholder="Ex: g/dL"
                                    value={test.unit}
                                    onChange={(e) => handleUpdateLabTest(index, 'unit', e.target.value)}
                                    className="w-full bg-transparent hover:bg-white focus:bg-white border-0 focus:ring-1 focus:ring-indigo-600 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    placeholder="Ex: 12 - 16"
                                    value={test.reference_range}
                                    onChange={(e) => handleUpdateLabTest(index, 'reference_range', e.target.value)}
                                    className="w-full bg-transparent hover:bg-white focus:bg-white border-0 focus:ring-1 focus:ring-indigo-600 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLabTest(index)}
                                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
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
                    <span>Cette prestation est un acte de service simple.</span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Aucune configuration de paramètres de laboratoire n'est requise.
                    </span>
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
              <h1 className="text-xl text-slate-700 font-normal flex items-center space-x-2">
                <FlaskConical className="w-6 h-6 text-emerald-600" />
                <span>Nomenclature des actes &amp; Prestations</span>
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-1">
                Configurez les actes, analyses médicales et consultations cliniques, avec leurs tarifs de base et grilles tarifaires TM / HP.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0 self-start md:self-auto">
              <button
                id="btn-import-excel"
                type="button"
                disabled={isImporting}
                onClick={handleImportExcel}
                className={`px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-md shadow-xs transition duration-200 flex items-center space-x-1.5 uppercase tracking-wider ${isImporting ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{isImporting ? 'Importation en cours...' : 'Importer Excel'}</span>
              </button>

              <button
                id="btn-creer-prestation"
                type="button"
                onClick={() => handleOpenCreateForm()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition duration-200 flex items-center space-x-1.5 uppercase tracking-wider"
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

          {/* Search, Filter Tabs & Layout Grid */}
          <div className="bg-white rounded-lg shadow-xs border border-slate-200/80 p-4 space-y-4">
            
            {/* Filter Tabs & Search Row */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une prestation (code, désignation, indications...)"
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

              {/* Department Selector */}
              <div className="w-full md:w-64">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="all">Tous les Départements</option>
                  {LAB_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Secondary Category Filter Buttons */}
            <div className="flex items-center space-x-2 border-t border-slate-100 pt-3 overflow-x-auto pb-1 ">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Filtrer par type :</span>
              {[
                { id: 'all', label: 'Toutes prestations' },
                { id: 'lab_exam', label: 'Examens Individuels' },
                { id: 'lab_profile', label: 'Bilans Complets' },
                { id: 'service', label: 'Prestations de Soins' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterType(t.id as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                    filterType === t.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prestation Catalog Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="w-full">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-slate-700 font-bold z-10 shadow-sm text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[12%]">Réf.</th>
                    <th className="py-2.5 px-3 w-[30%]">Désignation</th>
                    <th className="py-2.5 px-2 w-[16%] hidden lg:table-cell">Département</th>
                    <th className="py-2.5 px-2 w-[14%] hidden md:table-cell">Échantillon</th>
                    <th className="py-2.5 px-2 text-right w-[14%]">Prix Public</th>
                    <th className="py-2.5 px-2 text-right w-[10%] hidden sm:table-cell">Prix TM</th>
                    <th className="py-2.5 px-2 text-center w-[6%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 bg-slate-50/50">
                        Aucune prestation ou analyse trouvée dans cette sélection.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isProfile = p.category_type === 'lab_profile';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          {/* Code */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] block truncate">
                              {p.default_code || `PREST-${p.id}`}
                            </span>
                          </td>
                          
                          {/* Name / Description */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="font-bold text-slate-900 truncate">{p.name}</span>
                              {isProfile && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-1 py-0.2 rounded font-bold uppercase shrink-0">
                                  Bilan
                                </span>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                                {p.description}
                              </p>
                            )}
                            {p.lab_tests && p.lab_tests.length > 0 && (
                              <div className="mt-1 space-y-1">
                                <button
                                  type="button"
                                  onClick={() => toggleProductExpand(p.id)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer select-none"
                                >
                                  {expandedProductIds.includes(p.id) ? (
                                    <>
                                      <ChevronUp className="w-3 h-3 text-indigo-600" />
                                      <span>Masquer ({p.lab_tests.length} tests)</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3 text-indigo-600" />
                                      <span>Détail ({p.lab_tests.length} sous-tests)</span>
                                    </>
                                  )}
                                </button>
                                
                                {expandedProductIds.includes(p.id) && (
                                  <div className="bg-slate-50 border border-slate-200/60 rounded p-2 max-w-xs space-y-1 mt-1 animate-in slide-in-from-top-1 duration-150">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200/50">
                                      Nomenclature paramètres
                                    </div>
                                    <div className="divide-y divide-slate-100 max-h-[150px] overflow-y-auto pr-1">
                                      {p.lab_tests.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-0.5 text-[10px] font-normal">
                                          <span className="text-slate-700 font-medium truncate">{t.name}</span>
                                          <div className="flex items-center space-x-1 shrink-0">
                                            {t.unit && (
                                              <span className="text-[8px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-100">
                                                {t.unit}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          
                          {/* Department */}
                          <td className="py-2.5 px-2 text-slate-700 font-medium hidden lg:table-cell">
                            <span className="truncate block text-xs">{p.lab_department || 'Général'}</span>
                          </td>
                          
                          {/* Sample tube */}
                          <td className="py-2.5 px-2 text-slate-600 hidden md:table-cell">
                            {p.lab_sample_type ? (
                              <span className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded block truncate">
                                {p.lab_sample_type}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          
                          {/* List Price (Base) */}
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                            {formatFCFA(p.list_price || 0)}
                          </td>

                          {/* Ticket Modérateur Price (TM) */}
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-900 bg-amber-50/20 border-l border-amber-100/50 hidden sm:table-cell">
                            {formatFCFA(p.prix_tm || 0)}
                          </td>
                          
                          {/* Actions */}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
