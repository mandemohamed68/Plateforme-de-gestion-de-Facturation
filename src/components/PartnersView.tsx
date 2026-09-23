import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Percent,
  FileText,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  HeartHandshake,
  Stethoscope,
  Briefcase,
  Truck,
} from 'lucide-react';
import { ResPartner, ResCountry, PartnerReduction, CompanySettings } from '../types';
import { formatFCFA } from '../lib/formatters';
import { PaginationControls } from './PaginationControls';

interface PartnersViewProps {
  partners: ResPartner[];
  countries: ResCountry[];
  onSavePartner: (partnerData: any) => Promise<void>;
  onDeletePartner: (id: number) => Promise<void>;
  partnerReductions?: PartnerReduction[];
  onSaveReduction?: (reductionData: any) => Promise<void>;
  onDeleteReduction?: (id: number) => Promise<void>;
  company?: CompanySettings;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners = [],
  countries = [],
  onSavePartner,
  onDeletePartner,
  partnerReductions = [],
  onSaveReduction,
  onDeleteReduction,
  company,
}) => {
  const [filterType, setFilterType] = useState<
    'all' | 'patient' | 'insurance' | 'company' | 'prescriber' | 'supplier' | 'reductions'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(company?.default_page_size || 50);
  
  // Partner Reductions management state
  const [isRedModalOpen, setIsRedModalOpen] = useState(false);
  const [editingReduction, setEditingReduction] = useState<PartnerReduction | null>(null);
  const [redPatientType, setRedPatientType] = useState('');
  const [redCategoryName, setRedCategoryName] = useState('All');
  const [redRate, setRedRate] = useState<number | string>(0);
  const [redActive, setRedActive] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ResPartner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<ResPartner | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [partnerType, setPartnerType] = useState<
    'patient' | 'insurance' | 'company' | 'prescriber' | 'supplier'
  >('patient');
  const [isCompany, setIsCompany] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [countryId, setCountryId] = useState(5);
  const [vat, setVat] = useState('');
  const [customerRank, setCustomerRank] = useState(1);
  const [supplierRank, setSupplierRank] = useState(0);

  // Insurance specific fields
  const [conventionCode, setConventionCode] = useState('');
  const [defaultCoverageRate, setDefaultCoverageRate] = useState<number>(80);

  // Patient specific fields
  const [gender, setGender] = useState<'M' | 'F' | 'Autre'>('M');
  const [age, setAge] = useState<number | string>('');
  const [birthDate, setBirthDate] = useState('');
  const [insuranceId, setInsuranceId] = useState<number | null>(null);
  const [insuranceName, setInsuranceName] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceCoverageRate, setInsuranceCoverageRate] = useState<number>(80);
  const [prescribingDoctor, setPrescribingDoctor] = useState('');

  // Registered insurance list for quick assignment
  const insurancePartners = partners.filter(
    (p) => p.partner_type === 'insurance' || p.is_insurance
  );

  const handleOpenCreateModal = (
    defaultType: 'patient' | 'insurance' | 'company' | 'prescriber' | 'supplier' = 'patient'
  ) => {
    setEditingPartner(null);
    setName('');
    setPartnerType(defaultType);
    setIsCompany(defaultType === 'insurance' || defaultType === 'company' || defaultType === 'supplier');
    setEmail('');
    setPhone('');
    setStreet('');
    setCity('Abidjan');
    setZip('');
    setCountryId(5);
    setVat('');
    setCustomerRank(defaultType === 'supplier' ? 0 : 1);
    setSupplierRank(defaultType === 'supplier' ? 1 : 0);

    setConventionCode(defaultType === 'insurance' ? `CONV-${Date.now().toString().slice(-4)}` : '');
    setDefaultCoverageRate(80);

    setGender('M');
    setAge('');
    setBirthDate('');
    setInsuranceId(null);
    setInsuranceName('');
    setInsurancePolicyNumber('');
    setInsuranceCoverageRate(80);
    setPrescribingDoctor('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: ResPartner) => {
    setEditingPartner(p);
    setName(p.name);
    const pType =
      p.partner_type ||
      (p.is_insurance ? 'insurance' : p.supplier_rank > 0 ? 'supplier' : p.is_company ? 'company' : 'patient');
    setPartnerType(pType);
    setIsCompany(p.is_company);
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setStreet(p.street || '');
    setCity(p.city || 'Abidjan');
    setZip(p.zip || '');
    setCountryId(p.country_id || 5);
    setVat(p.vat || '');
    setCustomerRank(p.customer_rank);
    setSupplierRank(p.supplier_rank);

    setConventionCode(p.convention_code || '');
    setDefaultCoverageRate(p.default_coverage_rate ?? 80);

    setGender(p.gender || 'M');
    setAge(p.age !== undefined && p.age !== null ? p.age : '');
    setBirthDate(p.birth_date || '');
    setInsuranceId(p.insurance_id || null);
    setInsuranceName(p.insurance_name || '');
    setInsurancePolicyNumber(p.insurance_policy_number || '');
    setInsuranceCoverageRate(p.insurance_coverage_rate ?? 80);
    setPrescribingDoctor(p.prescribing_doctor || '');
    setIsModalOpen(true);
  };

  const handleSelectPatientInsurance = (insId: number | null) => {
    setInsuranceId(insId);
    if (!insId) {
      setInsuranceName('');
      return;
    }
    const matched = insurancePartners.find((i) => i.id === insId);
    if (matched) {
      setInsuranceName(matched.name);
      if (matched.default_coverage_rate !== undefined) {
        setInsuranceCoverageRate(matched.default_coverage_rate);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isIns = partnerType === 'insurance';
    const isSupp = partnerType === 'supplier';

    await onSavePartner({
      id: editingPartner?.id,
      name: name.trim(),
      is_company: partnerType === 'patient' ? false : isCompany || isIns,
      email: email.trim() || null,
      phone: phone.trim() || null,
      street: street.trim() || null,
      city: city.trim() || null,
      zip: zip.trim() || null,
      country_id: Number(countryId),
      vat: vat.trim() || null,
      customer_rank: isSupp ? 0 : 1,
      supplier_rank: isSupp ? 1 : 0,
      partner_type: partnerType,
      is_insurance: isIns,
      convention_code: isIns ? conventionCode.trim() || null : null,
      default_coverage_rate: isIns ? Number(defaultCoverageRate) : undefined,
      gender: partnerType === 'patient' ? gender : null,
      age: partnerType === 'patient' && age !== '' ? Number(age) : null,
      birth_date: partnerType === 'patient' ? birthDate || null : null,
      insurance_id: partnerType === 'patient' ? insuranceId : null,
      insurance_name: partnerType === 'patient' ? insuranceName.trim() || null : null,
      insurance_policy_number: partnerType === 'patient' ? insurancePolicyNumber.trim() || null : null,
      insurance_coverage_rate: partnerType === 'patient' ? Number(insuranceCoverageRate) : undefined,
      prescribing_doctor: partnerType === 'patient' ? prescribingDoctor.trim() || null : null,
    });
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!partnerToDelete) return;
    await onDeletePartner(partnerToDelete.id);
    setPartnerToDelete(null);
  };

  // Reduction management helpers
  const handleOpenCreateRedModal = () => {
    setEditingReduction(null);
    setRedPatientType('');
    setRedCategoryName('All');
    setRedRate(0);
    setRedActive(true);
    setIsRedModalOpen(true);
  };

  const handleOpenEditRedModal = (red: PartnerReduction) => {
    setEditingReduction(red);
    setRedPatientType(red.patient_type);
    setRedCategoryName(red.category_name || 'All');
    setRedRate(red.reduction_rate);
    setRedActive(red.active !== false);
    setIsRedModalOpen(true);
  };

  const handleSaveRedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redPatientType.trim() || !onSaveReduction) return;

    await onSaveReduction({
      id: editingReduction?.id,
      patient_type: redPatientType.trim(),
      category_name: redCategoryName.trim(),
      reduction_rate: Number(redRate),
      active: redActive,
    });
    setIsRedModalOpen(false);
  };

  const filteredPartners = partners
    .filter((p) => {
      const pType =
        p.partner_type ||
        (p.is_insurance ? 'insurance' : p.supplier_rank > 0 ? 'supplier' : p.is_company ? 'company' : 'patient');

      if (filterType !== 'all' && pType !== filterType) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (p.name || '').toString().toLowerCase().includes(q) ||
          (p.ndm || '').toString().toLowerCase().includes(q) ||
          (p.id && p.id.toString().includes(q)) ||
          (p.email || '').toString().toLowerCase().includes(q) ||
          (p.phone || '').toString().toLowerCase().includes(q) ||
          (p.convention_code || '').toString().toLowerCase().includes(q) ||
          (p.insurance_policy_number || '').toString().toLowerCase().includes(q) ||
          (p.city || '').toString().toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.created_at || (a as any).create_date ? new Date(a.created_at || (a as any).create_date).getTime() : 0;
      const dateB = b.created_at || (b as any).create_date ? new Date(b.created_at || (b as any).create_date).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });

  const totalInvoicedAll = filteredPartners.reduce((acc, p) => acc + (p.total_invoiced || 0), 0);
  const totalDueAll = filteredPartners.reduce((acc, p) => acc + (p.total_residual || 0), 0);

  const getPartnerBadge = (p: ResPartner) => {
    const pType =
      p.partner_type ||
      (p.is_insurance ? 'insurance' : p.supplier_rank > 0 ? 'supplier' : p.is_company ? 'company' : 'patient');

    switch (pType) {
      case 'insurance':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
            <HeartHandshake className="w-3 h-3 text-slate-600" />
            <span>Assurance / Tiers-Payeur</span>
          </span>
        );
      case 'patient':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            <User className="w-3 h-3 text-slate-500" />
            <span>Patient</span>
          </span>
        );
      case 'prescriber':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
            <Stethoscope className="w-3 h-3 text-slate-600" />
            <span>Prescripteur</span>
          </span>
        );
      case 'supplier':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            <Truck className="w-3 h-3 text-slate-500" />
            <span>Fournisseur</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span>Entreprise</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* Header & Controls */}
      <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-black text-slate-900">
              Répertoire des Tiers, Assurances &amp; Patients
            </h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
              {filteredPartners.length} enregistrements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion centralisée des patients, organismes d'assurances &amp; mutuelles (taux de prise en charge), entreprises et fournisseurs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {filterType === 'reductions' ? (
            <button
              type="button"
              onClick={handleOpenCreateRedModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une règle de réduction</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('insurance')}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-md flex items-center space-x-1.5 transition shadow-xs"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-slate-700" />
                <span>Nouvelle Assurance / Mutuelle</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('patient')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Patient / Tiers</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Tiers Enregistrés
          </p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{partners.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Assurances &amp; Mutuelles
          </p>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {partners.filter((p) => p.partner_type === 'insurance' || p.is_insurance).length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Facturé Global
          </p>
          <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {formatFCFA(totalInvoicedAll)}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Solde restant dû (Créances)
          </p>
          <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {formatFCFA(totalDueAll)}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-md p-3 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tous les tiers' },
            { id: 'patient', label: 'Patients & Assurés' },
            { id: 'insurance', label: 'Assurances & Mutuelles (Tiers-Payeurs)' },
            { id: 'company', label: 'Entreprises' },
            { id: 'prescriber', label: 'Prescripteurs' },
            { id: 'supplier', label: 'Fournisseurs' },
            { id: 'reductions', label: 'Grilles de Réduction' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Rechercher patient, assurance, police..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 transition"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Tiers / Reductions Table */}
      {filterType === 'reductions' ? (
        <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-[36%]">Type de Patient / Structure Partenaire</th>
                  <th className="py-2.5 px-3 w-[26%] hidden sm:table-cell">Catégorie Prestations</th>
                  <th className="py-2.5 px-3 text-right w-[18%]">Taux (%)</th>
                  <th className="py-2.5 px-3 text-center w-[10%]">Statut</th>
                  <th className="py-2.5 px-3 text-center w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerReductions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 bg-slate-50/50 font-medium">
                      Aucune règle de réduction partenaire configurée. Cliquez sur "Créer une règle de réduction" ci-dessus.
                    </td>
                  </tr>
                ) : (
                  [...partnerReductions]
                    .filter(r => !searchQuery || (r.patient_type || '').toString().toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => b.id - a.id)
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition font-semibold">
                        <td className="py-3 px-3">
                          <div className="text-slate-900 font-bold text-xs truncate">{r.patient_type}</div>
                          <div className="text-[11px] text-slate-500 sm:hidden truncate">{r.category_name || 'Toutes catégories'}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs hidden sm:table-cell truncate">
                          {r.category_name || 'Toutes catégories'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900 font-mono font-bold text-xs text-emerald-600">
                          -{r.reduction_rate}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          {r.active !== false ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                              Inactif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRedModal(r)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteReduction && r.id && onDeleteReduction(r.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
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
      ) : (
        <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-[12%]">Type</th>
                  <th className="py-2.5 px-3 w-[26%]">Nom / Dénomination</th>
                  <th className="py-2.5 px-3 w-[20%] hidden md:table-cell">Prise en Charge</th>
                  <th className="py-2.5 px-3 w-[18%] hidden sm:table-cell">Contact</th>
                  <th className="py-2.5 px-3 text-right w-[14%]">Solde Dû</th>
                  <th className="py-2.5 px-2 text-center w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 bg-slate-50/50">
                      Aucun tiers correspondant aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => {
                    const isIns = p.partner_type === 'insurance' || p.is_insurance;
                    const isPat = p.partner_type === 'patient';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 truncate">{getPartnerBadge(p)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 truncate">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="truncate" title={p.name}>{p.name}</span>
                            {isPat && p.gender && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                {p.gender} {p.age ? `• ${p.age}a` : ''}
                              </span>
                            )}
                          </div>
                          {p.prescribing_doctor && (
                            <p className="text-[10px] text-slate-500 font-normal truncate">
                              Dr : {p.prescribing_doctor}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 hidden md:table-cell truncate">
                          {isIns ? (
                            <div className="space-y-0.5 truncate">
                              <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                Taux standard : {p.default_coverage_rate ?? 80}%
                              </span>
                              {p.convention_code && (
                                <p className="text-[10px] font-mono text-slate-500 truncate">
                                  {p.convention_code}
                                </p>
                              )}
                            </div>
                          ) : isPat && p.insurance_name ? (
                            <div className="space-y-0.5 truncate">
                              <p className="font-bold text-slate-800 text-[11px] truncate">
                                {p.insurance_name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                {p.insurance_policy_number || 'N/R'} ({p.insurance_coverage_rate ?? 80}%)
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700 hidden sm:table-cell truncate">
                          {p.phone || p.email ? (
                            <div className="space-y-0.5 truncate">
                              {p.phone && <div className="font-mono text-[11px] truncate">{p.phone}</div>}
                              {p.email && <div className="text-slate-500 text-[10px] truncate">{p.email}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {(p.total_residual || 0) > 0 ? (
                            <span className="text-rose-600">{formatFCFA(p.total_residual || 0)}</span>
                          ) : (
                            <span className="text-slate-400">0 FCFA</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                              title="Modifier la fiche"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartnerToDelete(p)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
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

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredPartners.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="tiers / patients"
          />
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-2xl w-full shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-md">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPartner ? 'Modifier la Fiche Tiers' : 'Créer un Nouveau Tiers / Organisme'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Type de Tiers *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'patient', label: 'Patient' },
                    { id: 'insurance', label: 'Assurance / Mutuelle' },
                    { id: 'company', label: 'Entreprise' },
                    { id: 'prescriber', label: 'Prescripteur' },
                    { id: 'supplier', label: 'Fournisseur' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setPartnerType(t.id as any);
                        if (t.id === 'insurance' || t.id === 'company' || t.id === 'supplier') {
                          setIsCompany(true);
                        } else {
                          setIsCompany(false);
                        }
                      }}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-md border transition text-center ${
                        partnerType === t.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {partnerType === 'insurance'
                    ? "Dénomination de l'Assurance / Mutuelle *"
                    : partnerType === 'patient'
                    ? 'Nom & Prénoms du Patient *'
                    : 'Raison Sociale / Nom *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    partnerType === 'insurance'
                      ? 'ex: ASCOMA Côte d\'Ivoire, SUNU Assurances...'
                      : 'ex: M. Jean-Luc Koffi'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:border-slate-800 transition"
                />
              </div>

              {/* SPECIFIC FIELDS: IF INSURANCE */}
              {partnerType === 'insurance' && (
                <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <HeartHandshake className="w-4 h-4 text-slate-700" />
                    <span>Paramètres Convention &amp; Tiers-Payeur</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Code / N° Convention
                      </label>
                      <input
                        type="text"
                        placeholder="N° convention"
                        value={conventionCode}
                        onChange={(e) => setConventionCode(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Taux de Prise en Charge par Défaut (%)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {[70, 80, 90, 100].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setDefaultCoverageRate(rate)}
                            className={`px-2 py-1 text-xs font-bold rounded-md border transition ${
                              defaultCoverageRate === rate
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={defaultCoverageRate}
                          onChange={(e) => setDefaultCoverageRate(Number(e.target.value))}
                          className="w-16 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS: IF PATIENT */}
              {partnerType === 'patient' && (
                <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span>Informations Patient &amp; Couverture Assurance</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Genre</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="M">Masculin (M)</option>
                        <option value="F">Féminin (F)</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Âge (années)</label>
                      <input
                        type="number"
                        placeholder="Âge"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Médecin Prescripteur</label>
                      <input
                        type="text"
                        placeholder="Médecin traitant"
                        value={prescribingDoctor}
                        onChange={(e) => setPrescribingDoctor(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Assurance / Mutuelle
                      </label>
                      <select
                        value={insuranceId || ''}
                        onChange={(e) =>
                          handleSelectPatientInsurance(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium"
                      >
                        <option value="">Aucune (Paiement direct)</option>
                        {insurancePartners.map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.name} ({ins.default_coverage_rate ?? 80}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        N° Carte / Matricule Assuré
                      </label>
                      <input
                        type="text"
                        placeholder="N° assuré"
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Taux Prise en Charge (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={insuranceCoverageRate}
                        onChange={(e) => setInsuranceCoverageRate(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-bold text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Téléphone</label>
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Adresse / Quartier</label>
                  <input
                    type="text"
                    placeholder="Quartier"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ville</label>
                  <input
                    type="text"
                    placeholder="Ville"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-800 transition"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition shadow-xs"
                >
                  {editingPartner ? 'Enregistrer les Modifications' : 'Créer le Tiers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {partnerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md p-5 max-w-md w-full shadow-lg border border-slate-200 animate-in zoom-in-95 space-y-3">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Confirmer la suppression</h4>
            </div>
            <p className="text-xs text-slate-600">
              Êtes-vous sûr de vouloir supprimer la fiche de{' '}
              <span className="font-bold text-slate-900">« {partnerToDelete.name} »</span> ?
            </p>
            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REDUCTION CREATE / EDIT MODAL */}
      {isRedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-md shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                {editingReduction ? 'Modifier la Règle de Réduction' : 'Nouvelle Règle de Réduction Partenaire'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRedModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRedSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Structure / Type de Patient Partenaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Patient assuré 100%, SNIM, etc."
                  value={redPatientType}
                  onChange={(e) => setRedPatientType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 transition"
                />
                <p className="text-[10px] text-slate-500">
                  Ce libellé sera disponible comme option de type de patient dans la facturation pour appliquer automatiquement la réduction.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Catégorie d'Articles / Prestations
                </label>
                <select
                  value={redCategoryName}
                  onChange={(e) => setRedCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 transition"
                >
                  <option value="All">Toutes les prestations (Par défaut)</option>
                  <option value="Analyses">Analyses médicales</option>
                  <option value="Consultations">Consultations</option>
                  <option value="Imagerie">Imagerie</option>
                  <option value="Soins">Autres Prestations &amp; Soins</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Taux de Réduction (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    placeholder="Ex: 80, 100, 25"
                    value={redRate}
                    onChange={(e) => setRedRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-3 pr-8 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 transition font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="redActive"
                  checked={redActive}
                  onChange={(e) => setRedActive(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <label htmlFor="redActive" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Règle de réduction active
                </label>
              </div>

              <div className="pt-4 border-t border-slate-150 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRedModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-md transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
