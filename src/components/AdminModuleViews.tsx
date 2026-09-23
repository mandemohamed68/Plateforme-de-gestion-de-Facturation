import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Sliders,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Printer,
  Building2,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Save,
  AlertTriangle,
  Info,
  Sparkles,
  Baby,
  Heart,
  Stethoscope,
  Bed,
  FlaskConical,
  Microscope,
  CreditCard,
  Lock,
  Pill,
  Activity,
  ArrowRight,
  Settings,
  ChevronRight,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import {
  ResUser,
  ResGroup,
  CompanySettings,
  AppView,
  HospitalServiceConfig,
  PatientFieldConfig,
  HospitalConsultationType,
  EnterpriseConvention
} from '../types';
import { DEFAULT_HOSPITAL_SERVICES } from '../data/defaultHospitalServices';
import {
  getStoredPatientFieldsConfig,
  saveStoredPatientFieldsConfig,
  getStoredConventions,
  saveStoredConventions,
  getStoredConsultationTypes,
  saveStoredConsultationTypes,
  DEFAULT_PATIENT_FIELDS_CONFIG,
  DEFAULT_CONVENTIONS,
  DEFAULT_CONSULTATION_TYPES
} from '../data/conventionsData';

interface AdminViewsProps {
  currentView: AppView;
  users: ResUser[];
  groups: ResGroup[];
  company: CompanySettings;
  onNavigateToView: (view: AppView) => void;
  onSaveCompany?: (updated: CompanySettings) => Promise<boolean | void>;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

// --------------------------------------------------------------------------------------
// 1. MODULES & SERVICES HOSPITALIERS (ACTIVATION / DÉSACTIVATION DYNAMIQUE)
// --------------------------------------------------------------------------------------
export const AdminServicesManagementView: React.FC<AdminViewsProps> = ({
  company,
  onNavigateToView,
  onSaveCompany,
  onShowToast
}) => {
  const [services, setServices] = useState<HospitalServiceConfig[]>(() => {
    if (company.hospital_services_config && Array.isArray(company.hospital_services_config) && company.hospital_services_config.length > 0) {
      return company.hospital_services_config;
    }
    const saved = localStorage.getItem('app_hospital_services_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_HOSPITAL_SERVICES;
  });

  useEffect(() => {
    if (company?.hospital_services_config && Array.isArray(company.hospital_services_config) && company.hospital_services_config.length > 0) {
      setServices(company.hospital_services_config);
    }
  }, [company?.hospital_services_config]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'clinical' | 'diagnostic' | 'inpatient' | 'financial' | 'pharmacy'>('all');
  const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('list');
  const [selectedService, setSelectedService] = useState<HospitalServiceConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewService, setIsNewService] = useState(false);

  // Sync back to parent/localStorage when modified
  const saveServices = (newServices: HospitalServiceConfig[]) => {
    setServices(newServices);
    const enabledIds = newServices.filter((s) => s.enabled).map((s) => s.id);
    try {
      localStorage.setItem('app_hospital_services_config', JSON.stringify(newServices));
      localStorage.setItem('app_enabled_services_ids', JSON.stringify(enabledIds));
    } catch (e) {
      console.warn('localStorage error:', e);
    }

    if (onSaveCompany) {
      onSaveCompany({
        ...company,
        hospital_services_config: newServices,
        enabled_hospital_services: enabledIds
      });
    }
  };

  const handleToggleService = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = services.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    saveServices(updated);
    const target = updated.find((s) => s.id === id);
    if (onShowToast) {
      onShowToast(
        `Le service "${target?.name}" est maintenant ${target?.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}.`,
        target?.enabled ? 'success' : 'warning',
        'Configuration des modules'
      );
    }
  };

  const handleEnableAll = () => {
    const updated = services.map((s) => ({ ...s, enabled: true }));
    saveServices(updated);
    if (onShowToast) {
      onShowToast('Tous les modules et services hospitaliers ont été activés par défaut.', 'success', 'Activation Globale');
    }
  };

  const handleDisableAll = () => {
    // Keep admin enabled
    const updated = services.map((s) => ({ ...s, enabled: false }));
    saveServices(updated);
    if (onShowToast) {
      onShowToast('Tous les services ont été désactivés.', 'info', 'Désactivation');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous restaurer la liste des modules avec les paramètres standards (tous activés) ?')) {
      saveServices(DEFAULT_HOSPITAL_SERVICES);
      if (onShowToast) {
        onShowToast('Configuration d\'origine des modules restaurée avec succès.', 'success', 'Réinitialisation');
      }
    }
  };

  const handleOpenEditModal = (service: HospitalServiceConfig) => {
    setSelectedService({ ...service });
    setIsNewService(false);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedService({
      id: `service_${Date.now()}`,
      name: '',
      code: 'SRV',
      category: 'clinical',
      description: '',
      enabled: true,
      icon: 'Stethoscope',
      head_doctor: '',
      location: 'Bâtiment Principal',
      capacity_beds: 0
    });
    setIsNewService(true);
    setIsModalOpen(true);
  };

  const handleSaveModalService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedService.name.trim()) {
      if (onShowToast) onShowToast('Veuillez renseigner le nom du service.', 'error');
      return;
    }

    let updated: HospitalServiceConfig[];
    if (isNewService) {
      updated = [...services, selectedService];
    } else {
      updated = services.map((s) => (s.id === selectedService.id ? selectedService : s));
    }

    saveServices(updated);
    setIsModalOpen(false);
    if (onShowToast) {
      onShowToast(`Service "${selectedService.name}" enregistré avec succès.`, 'success');
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    if (window.confirm(`Confirmez-vous la suppression du service "${name}" ?`)) {
      const updated = services.filter((s) => s.id !== id);
      saveServices(updated);
      if (onShowToast) {
        onShowToast(`Service "${name}" supprimé.`, 'info');
      }
    }
  };

  const filteredServices = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.head_doctor || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const enabledCount = services.filter((s) => s.enabled).length;

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Baby':
        return <Baby className="w-5 h-5 text-sky-600" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-600" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      case 'Bed':
        return <Bed className="w-5 h-5 text-indigo-600" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5 text-amber-600" />;
      case 'Microscope':
        return <Microscope className="w-5 h-5 text-violet-600" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-slate-700" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-red-600" />;
      case 'Pill':
        return <Pill className="w-5 h-5 text-teal-600" />;
      default:
        return <Building2 className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTargetViewForService = (id: string): AppView => {
    switch (id) {
      case 'pediatrie':
        return 'pediatrie_dashboard';
      case 'maternite':
        return 'maternite_dashboard';
      case 'hospitalisation':
        return 'hospit_dashboard';
      case 'laboratoire':
        return 'labo_dashboard';
      case 'imagerie':
        return 'imagerie_dashboard';
      case 'medecine_generale':
        return 'medecin_dashboard';
      case 'specialiste':
        return 'specialiste_dashboard';
      case 'urgences':
        return 'infirmier_queue';
      case 'caisse_facturation':
        return 'caisse_dashboard';
      default:
        return 'dashboard';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Activation &amp; Gestion des Modules Hospitaliers
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {enabledCount} / {services.length} Actifs
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Modulabilité dynamique : activez ou désactivez les pôles selon les services dispensés dans votre établissement
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEnableAll}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Tout Activer
          </button>
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nouveau Service
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un module, code, chef de service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Catégorie :</span>
          {(['all', 'clinical', 'diagnostic', 'inpatient', 'financial', 'pharmacy'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' && 'Tous les pôles'}
              {cat === 'clinical' && 'Pôles Cliniques'}
              {cat === 'diagnostic' && 'Plateau Diagnostic'}
              {cat === 'inpatient' && 'Hospitalisation'}
              {cat === 'financial' && 'Caisse & Facturation'}
              {cat === 'pharmacy' && 'Pharmacie'}
            </button>
          ))}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 ml-2">
            <button
              onClick={() => setDisplayMode('list')}
              title="Présentation en liste"
              className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                displayMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Liste</span>
            </button>
            <button
              onClick={() => setDisplayMode('grid')}
              title="Présentation en grille"
              className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                displayMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modules Presentation: List View (Default) or Grid View */}
      {displayMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Code &amp; Module Hospitalier</th>
                  <th className="py-3 px-3">Pôle / Catégorie</th>
                  <th className="py-3 px-3">Responsable &amp; Localisation</th>
                  <th className="py-3 px-3 text-center">Capacité</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucun module ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      className={`hover:bg-slate-50/70 transition ${
                        !service.enabled ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      {/* Name and Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                            {getServiceIcon(service.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {service.code}
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs">
                                {service.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-semibold text-slate-600 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                          {service.category === 'clinical' && 'Clinique'}
                          {service.category === 'diagnostic' && 'Diagnostic'}
                          {service.category === 'inpatient' && 'Hospitalisation'}
                          {service.category === 'financial' && 'Finances'}
                          {service.category === 'pharmacy' && 'Pharmacie'}
                          {!['clinical', 'diagnostic', 'inpatient', 'financial', 'pharmacy'].includes(service.category) && service.category}
                        </span>
                      </td>

                      {/* Head & Location */}
                      <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                        {service.head_doctor && (
                          <div className="font-bold text-slate-800 truncate max-w-[180px]">
                            {service.head_doctor}
                          </div>
                        )}
                        {service.location && (
                          <div className="text-slate-400 text-[10px] truncate max-w-[180px]">
                            {service.location}
                          </div>
                        )}
                        {!service.head_doctor && !service.location && (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Beds */}
                      <td className="py-3.5 px-3 text-center">
                        {service.capacity_beds !== undefined && service.capacity_beds > 0 ? (
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {service.capacity_beds} lits
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Toggle status */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={(e) => handleToggleService(service.id, e)}
                          title={service.enabled ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                            service.enabled
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {service.enabled ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Actif
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-slate-400" />
                              Désactivé
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(service)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                            title="Modifier les détails"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id, service.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {service.enabled ? (
                            <button
                              onClick={() => onNavigateToView(getTargetViewForService(service.id))}
                              className="ml-1 px-2.5 py-1 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 transition"
                            >
                              Ouvrir
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic ml-1">Masqué</span>
                          )}
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
        /* Grid of Modules */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`rounded-xl border transition p-5 flex flex-col justify-between ${
                service.enabled
                  ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {getServiceIcon(service.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {service.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{service.name}</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">{service.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleToggleService(service.id, e)}
                    title={service.enabled ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      service.enabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {service.enabled ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Actif
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        Désactivé
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{service.description}</p>

                <div className="space-y-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {service.head_doctor && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Responsable :</span>
                      <span className="font-semibold text-slate-800">{service.head_doctor}</span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Localisation :</span>
                      <span className="text-slate-700">{service.location}</span>
                    </div>
                  )}
                  {service.capacity_beds !== undefined && service.capacity_beds > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Capacité d'accueil :</span>
                      <span className="font-bold text-slate-800">{service.capacity_beds} lits</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(service)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                    title="Modifier les détails du service"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id, service.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                    title="Supprimer ce service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {service.enabled ? (
                  <button
                    onClick={() => onNavigateToView(getTargetViewForService(service.id))}
                    className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 transition"
                  >
                    Ouvrir l'Espace
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Masqué de la barre latérale</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating or Editing a Service */}
      {isModalOpen && selectedService && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                {isNewService ? 'Créer un nouveau service / module' : `Modifier "${selectedService.name}"`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalService} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Intitulé du service *</label>
                  <input
                    type="text"
                    required
                    value={selectedService.name}
                    onChange={(e) => setSelectedService({ ...selectedService, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="ex: Pédiatrie & Néonatologie"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Code abrégé *</label>
                  <input
                    type="text"
                    required
                    value={selectedService.code}
                    onChange={(e) => setSelectedService({ ...selectedService, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                    placeholder="ex: PED"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Catégorie</label>
                  <select
                    value={selectedService.category}
                    onChange={(e) => setSelectedService({ ...selectedService, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="clinical">Clinique / Consultations</option>
                    <option value="diagnostic">Plateau Diagnostic (Labo/Radio)</option>
                    <option value="inpatient">Hospitalisation & Lits</option>
                    <option value="financial">Caisse & Facturation</option>
                    <option value="pharmacy">Pharmacie</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Icône représentative</label>
                  <select
                    value={selectedService.icon}
                    onChange={(e) => setSelectedService({ ...selectedService, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Stethoscope">Stéthoscope (Médical)</option>
                    <option value="Baby">Bébé (Pédiatrie)</option>
                    <option value="Heart">Cœur (Maternité/Cardio)</option>
                    <option value="Bed">Lit (Hospitalisation)</option>
                    <option value="FlaskConical">Éprouvette (Laboratoire)</option>
                    <option value="Microscope">Microscope (Imagerie)</option>
                    <option value="CreditCard">Carte (Finance/Caisse)</option>
                    <option value="Activity">Activité (Urgences)</option>
                    <option value="Pill">Médicament (Pharmacie)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description fonctionnelle</label>
                <textarea
                  rows={2}
                  value={selectedService.description}
                  onChange={(e) => setSelectedService({ ...selectedService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Détail des actes, missions et protocoles pris en charge..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Chef de service / Responsable</label>
                  <input
                    type="text"
                    value={selectedService.head_doctor || ''}
                    onChange={(e) => setSelectedService({ ...selectedService, head_doctor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="Dr. Nom Prénom"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Capacité en lits</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedService.capacity_beds || 0}
                    onChange={(e) => setSelectedService({ ...selectedService, capacity_beds: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Localisation / Bâtiment</label>
                <input
                  type="text"
                  value={selectedService.location || ''}
                  onChange={(e) => setSelectedService({ ...selectedService, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="ex: Pavillon Mère-Enfant - 1er étage"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">État du module</span>
                  <span className="text-[11px] text-slate-500">Rendre visible dans la navigation latérale et accessible aux équipes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedService({ ...selectedService, enabled: !selectedService.enabled })}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                    selectedService.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {selectedService.enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
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

// --------------------------------------------------------------------------------------
// 2. GESTION DES RÔLES & PROFILS MÉTIERS
// --------------------------------------------------------------------------------------
export const AdminRolesTableView: React.FC<AdminViewsProps> = ({
  users,
  onNavigateToView,
}) => {
  const rolesList = [
    { code: 'admin', name: 'Administrateur Système', description: 'Accès intégral à la configuration, sécurité et gestion des utilisateurs', usersCount: users.filter(u => u.role === 'admin' || (u.login || '').toLowerCase().includes('admin')).length },
    { code: 'superviseur', name: 'Superviseur de Caisse', description: 'Contrôle des flux financiers, validation des clôtures et encaissements', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('supervis')).length },
    { code: 'caisse', name: 'Agent de Caisse', description: 'Perception des règlements patients, émission des quittances et reçus', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('caiss')).length },
    { code: 'factures', name: 'Agent de Facturation', description: 'Création et gestion des factures, tiers-payants et prises en charge', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('factur')).length },
    { code: 'infirmier', name: 'Personnel Infirmier & Triage', description: 'Triage, saisie des constantes vitales, carnet vaccinal, soins infirmiers', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('infirm')).length },
    { code: 'medecin', name: 'Médecin Généraliste', description: 'Consultations cliniques, prescriptions d\'ordonnances, examens et orientation', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('medecin') || (u.role || '').toLowerCase().includes('docteur')).length },
    { code: 'specialiste', name: 'Médecin Spécialiste', description: 'Avis spécialisés référés, actes techniques, dossiers complexes et suivi', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('specialiste')).length },
    { code: 'pediatre', name: 'Pédiatre & Néonatalogiste', description: 'Consultations pédiatriques, vaccination PEV, courbes de croissance OMS', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('pediat') || (u.role || '').toLowerCase().includes('enfant')).length },
    { code: 'sage_femme', name: 'Sage-Femme / Gynécologue', description: 'Consultations Prénatales (CPN), partogramme, accouchements et post-partum', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('sage') || (u.role || '').toLowerCase().includes('mater') || (u.role || '').toLowerCase().includes('gynec')).length },
    { code: 'labo', name: 'Biologiste / Technicien Labo', description: 'Prélèvements sanguins, exécution d\'analyses, validation biologique', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('lab') || (u.role || '').toLowerCase().includes('bio')).length },
    { code: 'imagerie', name: 'Radiologue / Manipulateur', description: 'Acquisition des clichés radio/scanner, rédaction des comptes-rendus', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('imag') || (u.role || '').toLowerCase().includes('radio')).length },
    { code: 'hospitalisation', name: 'Gestionnaire Hospitalisation', description: 'Admissions au lit, gestion des séjours, transferts et sorties', usersCount: users.filter(u => (u.role || '').toLowerCase().includes('hospit')).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-700" />
            Gestion des Rôles &amp; Profils Métiers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Définition des fonctions organisationnelles et des périmètres d'intervention du personnel hospitalier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('admin_permissions')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Key className="w-4 h-4" />
            Matrice des Droits (RBAC)
          </button>
          <button
            onClick={() => onNavigateToView('admin_users')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Comptes Utilisateurs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {rolesList.length} Profils métiers configurés
          </span>
          <span className="text-xs font-semibold text-slate-600">
            Total collaborateurs : <strong className="text-slate-900 font-mono">{users.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Rôle</th>
                <th className="py-2.5 px-4">Intitulé du Poste</th>
                <th className="py-2.5 px-4">Périmètre &amp; Responsabilités</th>
                <th className="py-2.5 px-4">Effectif affecté</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rolesList.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                  <td className="py-3 px-4 text-slate-600">{r.description}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800">
                      {r.usersCount} collaborateur{r.usersCount > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('admin_users')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition"
                    >
                      Voir membres
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------------
// 3. MATRICE DYNAMIQUE DES PERMISSIONS & DROITS D'ACCÈS (RBAC)
// --------------------------------------------------------------------------------------
export const AdminPermissionsTableView: React.FC<AdminViewsProps> = ({
  onNavigateToView,
  onShowToast
}) => {
  const defaultModules = [
    'Accueil & File d\'attente',
    'Constantes & Soins infirmiers',
    'Consultations Généralistes',
    'Consultations Spécialisées',
    'Pédiatrie & Santé Infantile',
    'Maternité & Gynéco-Obstétrique',
    'Laboratoire d\'analyses',
    'Imagerie & Radiologie',
    'Hospitalisation & Lits',
    'Facturation & Tiers-payant',
    'Caisse & Encaissements',
    'Supervision financière',
    'Gestion Pharmacie',
    'Paramétrage & Back-Office'
  ];

  const defaultProfiles = [
    'Administrateur',
    'Infirmier',
    'Médecin Généraliste',
    'Médecin Spécialiste',
    'Pédiatre',
    'Sage-Femme',
    'Biologiste',
    'Radiologue',
    'Caissier',
    'Facturier',
    'Superviseur'
  ];

  const buildInitialMatrix = (): Record<string, Record<string, boolean>> => {
    const matrix: Record<string, Record<string, boolean>> = {};
    defaultProfiles.forEach((p) => {
      matrix[p] = {};
      defaultModules.forEach((m) => {
        const isAllowed =
          p === 'Administrateur' ||
          (p === 'Infirmier' && (m.includes('Accueil') || m.includes('Constantes') || m.includes('Pédiatrie'))) ||
          (p === 'Médecin Généraliste' && (m.includes('Consultations Généralistes') || m.includes('Constantes') || m.includes('Accueil') || m.includes('Laboratoire') || m.includes('Imagerie'))) ||
          (p === 'Médecin Spécialiste' && (m.includes('Spécialisées') || m.includes('Consultations') || m.includes('Laboratoire') || m.includes('Imagerie'))) ||
          (p === 'Pédiatre' && (m.includes('Pédiatrie') || m.includes('Consultations') || m.includes('Constantes') || m.includes('Laboratoire'))) ||
          (p === 'Sage-Femme' && (m.includes('Maternité') || m.includes('Constantes') || m.includes('Hospitalisation') || m.includes('Laboratoire'))) ||
          (p === 'Biologiste' && (m.includes('Laboratoire') || m.includes('Accueil'))) ||
          (p === 'Radiologue' && (m.includes('Imagerie') || m.includes('Accueil'))) ||
          (p === 'Caissier' && (m.includes('Caisse') || m.includes('Accueil'))) ||
          (p === 'Facturier' && (m.includes('Facturation') || m.includes('Accueil'))) ||
          (p === 'Superviseur' && (m.includes('Caisse') || m.includes('Facturation') || m.includes('Supervision')));
        matrix[p][m] = isAllowed;
      });
    });
    return matrix;
  };

  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('app_rbac_permissions_matrix');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return buildInitialMatrix();
  });

  const [searchModule, setSearchModule] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Toggle single cell
  const handleTogglePermission = (profile: string, moduleName: string) => {
    // Admin always retains all permissions for safety
    if (profile === 'Administrateur' && moduleName === 'Paramétrage & Back-Office') {
      if (onShowToast) onShowToast('Le rôle Administrateur doit conserver l\'accès au Paramétrage.', 'warning');
      return;
    }

    setPermissionsMatrix((prev) => {
      const updated = {
        ...prev,
        [profile]: {
          ...(prev[profile] || {}),
          [moduleName]: !prev[profile]?.[moduleName]
        }
      };
      setHasChanges(true);
      return updated;
    });
  };

  // Toggle all for a specific profile (column)
  const handleToggleProfileAll = (profile: string, grant: boolean) => {
    setPermissionsMatrix((prev) => {
      const updatedProfile = { ...(prev[profile] || {}) };
      defaultModules.forEach((m) => {
        updatedProfile[m] = grant;
      });
      setHasChanges(true);
      return {
        ...prev,
        [profile]: updatedProfile
      };
    });
  };

  // Toggle all for a specific module (row)
  const handleToggleModuleAll = (moduleName: string, grant: boolean) => {
    setPermissionsMatrix((prev) => {
      const updated = { ...prev };
      defaultProfiles.forEach((p) => {
        updated[p] = {
          ...(updated[p] || {}),
          [moduleName]: grant
        };
      });
      setHasChanges(true);
      return updated;
    });
  };

  const handleSavePermissions = () => {
    localStorage.setItem('app_rbac_permissions_matrix', JSON.stringify(permissionsMatrix));
    setHasChanges(false);
    if (onShowToast) {
      onShowToast('Matrice des droits d\'accès mise à jour avec succès.', 'success', 'Permissions RBAC');
    }
  };

  const handleResetPermissions = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les permissions aux valeurs d\'origine ?')) {
      const initial = buildInitialMatrix();
      setPermissionsMatrix(initial);
      localStorage.setItem('app_rbac_permissions_matrix', JSON.stringify(initial));
      setHasChanges(false);
      if (onShowToast) {
        onShowToast('Permissions réinitialisées aux valeurs par défaut.', 'info');
      }
    }
  };

  const filteredModules = defaultModules.filter((m) =>
    m.toLowerCase().includes(searchModule.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Gestion Dynamique des Droits &amp; Permissions
                {hasChanges && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 animate-pulse">
                    Modifications non enregistrées
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cochez ou décochez les cases pour autoriser ou restreindre l'accès à chaque module en temps réel
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetPermissions}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-200 flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={handleSavePermissions}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Enregistrer les Droits
          </button>
        </div>
      </div>

      {/* Permissions Matrix Box */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer les modules fonctionnels..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Autorisé
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Refusé
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 min-w-[220px] sticky left-0 bg-slate-100 z-10">
                  Module / Périmètre Fonctionnel
                </th>
                {defaultProfiles.map((p) => (
                  <th key={p} className="py-2.5 px-2 text-center text-[11px] min-w-[95px]">
                    <div className="font-bold text-slate-800 mb-1">{p}</div>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleProfileAll(p, true)}
                        className="text-[9px] px-1 py-0.5 rounded bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200"
                        title="Tout accorder pour ce profil"
                      >
                        +Tout
                      </button>
                      <button
                        onClick={() => handleToggleProfileAll(p, false)}
                        className="text-[9px] px-1 py-0.5 rounded bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200"
                        title="Tout refuser pour ce profil"
                      >
                        -Tout
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModules.map((mod) => (
                <tr key={mod} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 flex items-center justify-between gap-2 border-r border-slate-100">
                    <span>{mod}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <button
                        onClick={() => handleToggleModuleAll(mod, true)}
                        className="text-[9px] px-1 rounded bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                        title="Accorder ce module à tous les profils"
                      >
                        Tous
                      </button>
                      <button
                        onClick={() => handleToggleModuleAll(mod, false)}
                        className="text-[9px] px-1 rounded bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800"
                        title="Refuser ce module à tous les profils"
                      >
                        Aucun
                      </button>
                    </div>
                  </td>
                  {defaultProfiles.map((p) => {
                    const isGranted = !!permissionsMatrix[p]?.[mod];
                    return (
                      <td key={p} className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(p, mod)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                            isGranted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                              : 'bg-slate-50 text-slate-300 border border-slate-200 hover:bg-slate-100 hover:text-slate-400'
                          }`}
                          title={`${isGranted ? 'Droit accordé' : 'Droit refusé'} (Cliquer pour basculer)`}
                        >
                          {isGranted ? (
                            <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                          ) : (
                            <span className="text-slate-300 font-bold text-xs">-</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------------
// 4. PARAMÈTRES CLINIQUES & UNITÉS MÉDICALES (CRUD COMPLET)
// --------------------------------------------------------------------------------------
export interface MedicalUnitItem {
  id: string;
  code: string;
  name: string;
  bat: string;
  chef: string;
  lits: number;
  statut: 'Opérationnel' | 'En rénovation' | 'Fermé temporairement';
  specialties: string[];
}

export interface VitalSignThreshold {
  id: string;
  name: string;
  unit: string;
  minNormal: number;
  maxNormal: number;
  minCritical: number;
  maxCritical: number;
  alertNote: string;
}

export const AdminMedicalSettingsTableView: React.FC<AdminViewsProps> = ({
  onNavigateToView,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'thresholds' | 'specialties'>('units');

  // 1. Medical Units State
  const initialUnits: MedicalUnitItem[] = [
    { id: 'u1', code: 'URG', name: 'Service des Urgences & Déchocage', bat: 'Bâtiment A - RDC', chef: 'Dr. Toure', lits: 8, statut: 'Opérationnel', specialties: ['Urgences', 'Déchocage', 'Triage'] },
    { id: 'u2', code: 'MED', name: 'Médecine Interne & Polyvalente', bat: 'Bâtiment B - 1er étage', chef: 'Dr. Keita', lits: 24, statut: 'Opérationnel', specialties: ['Médecine Générale', 'Cardiologie', 'Diabétologie'] },
    { id: 'u3', code: 'PED', name: 'Pédiatrie & Néonatologie', bat: 'Pavillon Mère-Enfant - RDC', chef: 'Dr. Diallo Aminata', lits: 14, statut: 'Opérationnel', specialties: ['Pédiatrie', 'Vaccination PEV', 'Nutrition OMS'] },
    { id: 'u4', code: 'MAT', name: 'Maternité & Gynéco-Obstétrique', bat: 'Pavillon Mère-Enfant - 1er étage', chef: 'Dr. Barry Fatoumata', lits: 18, statut: 'Opérationnel', specialties: ['Obstétrique', 'CPN', 'Accouchements'] },
    { id: 'u5', code: 'CHIR', name: 'Chirurgie Générale & Bloc Opératoire', bat: 'Bâtiment C - 2e étage', chef: 'Dr. Koné', lits: 16, statut: 'Opérationnel', specialties: ['Chirurgie Viscérale', 'Orthopédie', 'Traumatologie'] },
    { id: 'u6', code: 'LAB', name: 'Plateau Technique Laboratoire', bat: 'Bâtiment Principal - RDC', chef: 'Dr. Toure Aboubacar', lits: 0, statut: 'Opérationnel', specialties: ['Biochimie', 'Hématologie', 'Sérologie'] },
  ];

  const [units, setUnits] = useState<MedicalUnitItem[]>(() => {
    const saved = localStorage.getItem('app_admin_medical_units');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialUnits;
  });

  const [selectedUnit, setSelectedUnit] = useState<MedicalUnitItem | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isNewUnit, setIsNewUnit] = useState(false);

  // 2. Vital Signs Thresholds State
  const initialThresholds: VitalSignThreshold[] = [
    { id: 'bp_sys', name: 'Tension Artérielle Systolique', unit: 'mmHg', minNormal: 100, maxNormal: 139, minCritical: 85, maxCritical: 180, alertNote: 'Seuil d\'alerte HTA sévère ou collapsus cardiovasculaire' },
    { id: 'bp_dia', name: 'Tension Artérielle Diastolique', unit: 'mmHg', minNormal: 60, maxNormal: 89, minCritical: 50, maxCritical: 110, alertNote: 'Seuil d\'alerte crise hypertensive ou hypotension' },
    { id: 'hr', name: 'Fréquence Cardiaque (Pouls)', unit: 'bpm', minNormal: 60, maxNormal: 100, minCritical: 45, maxCritical: 140, alertNote: 'Alerte Bradycardie (<50) ou Tachycardie (>120)' },
    { id: 'temp', name: 'Température Corporelle', unit: '°C', minNormal: 36.5, maxNormal: 37.5, minCritical: 35.0, maxCritical: 39.5, alertNote: 'Alerte Hyperthermie fébrile / Hypothermie néonatale' },
    { id: 'spo2', name: 'Saturation en Oxygène (SpO2)', unit: '%', minNormal: 95, maxNormal: 100, minCritical: 90, maxCritical: 100, alertNote: 'Alerte Détresse Respiratoire / Hypoxémie sévère' },
    { id: 'glyc', name: 'Glycémie Capillaire à jeun', unit: 'g/L', minNormal: 0.70, maxNormal: 1.10, minCritical: 0.50, maxCritical: 2.50, alertNote: 'Alerte Hypoglycémie aiguë ou Coma hyperosmolaire' }
  ];

  const [thresholds, setThresholds] = useState<VitalSignThreshold[]>(() => {
    const saved = localStorage.getItem('app_admin_vital_thresholds');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialThresholds;
  });

  const saveUnits = (newUnits: MedicalUnitItem[]) => {
    setUnits(newUnits);
    localStorage.setItem('app_admin_medical_units', JSON.stringify(newUnits));
  };

  const saveThresholds = (newThresh: VitalSignThreshold[]) => {
    setThresholds(newThresh);
    localStorage.setItem('app_admin_vital_thresholds', JSON.stringify(newThresh));
    if (onShowToast) onShowToast('Seuils d\'alerte des constantes enregistrés.', 'success');
  };

  // Unit Modal Handlers
  const handleOpenCreateUnit = () => {
    setSelectedUnit({
      id: `unit_${Date.now()}`,
      code: 'SRV',
      name: '',
      bat: 'Bâtiment Principal',
      chef: '',
      lits: 10,
      statut: 'Opérationnel',
      specialties: ['Médecine']
    });
    setIsNewUnit(true);
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: MedicalUnitItem) => {
    setSelectedUnit({ ...unit });
    setIsNewUnit(false);
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !selectedUnit.name.trim()) return;

    let updated: MedicalUnitItem[];
    if (isNewUnit) {
      updated = [...units, selectedUnit];
    } else {
      updated = units.map((u) => (u.id === selectedUnit.id ? selectedUnit : u));
    }

    saveUnits(updated);
    setIsUnitModalOpen(false);
    if (onShowToast) {
      onShowToast(`Unité médicale "${selectedUnit.name}" enregistrée avec succès.`, 'success');
    }
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'unité médicale "${name}" ?`)) {
      const updated = units.filter((u) => u.id !== id);
      saveUnits(updated);
      if (onShowToast) onShowToast(`Unité "${name}" supprimée.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Paramètres Cliniques &amp; Unités Médicales
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configuration des services de soins, capacités d'accueil, protocoles et seuils d'alerte vitaux OMS
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'units' && (
            <button
              onClick={handleOpenCreateUnit}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Ajouter une Unité
            </button>
          )}
          <button
            onClick={() => onNavigateToView('admin_services')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200"
          >
            Modules &amp; Services
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'units'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Unités &amp; Services de Soins ({units.length})
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'thresholds'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Seuils d'Alerte Constantes Vitales OMS
        </button>
      </div>

      {/* TAB 1: Unités Médicales */}
      {activeTab === 'units' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {units.length} Unités médicales enregistrées
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Capacité totale : <strong className="text-slate-900 font-mono">{units.reduce((acc, u) => acc + u.lits, 0)} lits</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Nom de l'Unité</th>
                  <th className="py-2.5 px-4">Localisation / Bâtiment</th>
                  <th className="py-2.5 px-4">Chef de Service</th>
                  <th className="py-2.5 px-4">Capacité Lits</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.name}
                      <div className="flex gap-1 mt-0.5">
                        {row.specialties?.map((s) => (
                          <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.bat}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{row.chef}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {row.lits > 0 ? `${row.lits} lits` : 'Ambulatoire'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          row.statut === 'Opérationnel'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {row.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditUnit(row)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(row.id, row.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Seuils d'Alerte Constantes Vitales */}
      {activeTab === 'thresholds' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Normes Cliniques &amp; Seuils d'Alerte Médicale</h3>
              <p className="text-xs text-slate-500">
                Ces valeurs définissent les indicateurs visuels (vert = normal, jaune = limite, rouge = alerte critique)
              </p>
            </div>
            <button
              onClick={() => saveThresholds(initialThresholds)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
            >
              Restaurer Normes OMS
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thresholds.map((t, idx) => (
              <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Unité : {t.unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 block">Normale Recommandée</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={t.minNormal}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[idx].minNormal = parseFloat(e.target.value) || 0;
                          setThresholds(updated);
                        }}
                        className="w-16 px-2 py-1 bg-white border border-emerald-200 rounded text-xs font-bold"
                      />
                      <span className="text-emerald-700">à</span>
                      <input
                        type="number"
                        step="0.1"
                        value={t.maxNormal}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[idx].maxNormal = parseFloat(e.target.value) || 0;
                          setThresholds(updated);
                        }}
                        className="w-16 px-2 py-1 bg-white border border-emerald-200 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 block">Zone Critique (Alerte)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={t.minCritical}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[idx].minCritical = parseFloat(e.target.value) || 0;
                          setThresholds(updated);
                        }}
                        className="w-16 px-2 py-1 bg-white border border-rose-200 rounded text-xs font-bold"
                      />
                      <span className="text-rose-700">et</span>
                      <input
                        type="number"
                        step="0.1"
                        value={t.maxCritical}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[idx].maxCritical = parseFloat(e.target.value) || 0;
                          setThresholds(updated);
                        }}
                        className="w-16 px-2 py-1 bg-white border border-rose-200 rounded text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                  {t.alertNote}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => saveThresholds(thresholds)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              Enregistrer les Seuils d'Alerte
            </button>
          </div>
        </div>
      )}

      {/* Modal CRUD Unité */}
      {isUnitModalOpen && selectedUnit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {isNewUnit ? 'Créer une Unité Médicale' : `Modifier "${selectedUnit.name}"`}
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nom de l'Unité / Service *</label>
                  <input
                    type="text"
                    required
                    value={selectedUnit.name}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="ex: Médecine Interne"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Code *</label>
                  <input
                    type="text"
                    required
                    value={selectedUnit.code}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="MED"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Localisation / Bâtiment</label>
                <input
                  type="text"
                  value={selectedUnit.bat}
                  onChange={(e) => setSelectedUnit({ ...selectedUnit, bat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="ex: Bâtiment B - 1er étage"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Chef de Service / Référent</label>
                  <input
                    type="text"
                    value={selectedUnit.chef}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, chef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Dr. Keita"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Capacité en Lits</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedUnit.lits}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, lits: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Statut de l'Unité</label>
                <select
                  value={selectedUnit.statut}
                  onChange={(e) => setSelectedUnit({ ...selectedUnit, statut: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Opérationnel">Opérationnel</option>
                  <option value="En rénovation">En rénovation</option>
                  <option value="Fermé temporairement">Fermé temporairement</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
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

// --------------------------------------------------------------------------------------
// 5. PARAMÉTRAGE DES CHAMPS OBLIGATOIRES / OPTIONNELS DU DOSSIER PATIENT
// --------------------------------------------------------------------------------------
export const AdminPatientFieldsConfigView: React.FC<AdminViewsProps> = ({
  company,
  onNavigateToView,
  onShowToast
}) => {
  const [fields, setFields] = useState<PatientFieldConfig[]>(() => getStoredPatientFieldsConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleRequirementChange = (fieldId: string, requirement: 'mandatory' | 'optional' | 'hidden') => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, requirement } : f))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    saveStoredPatientFieldsConfig(fields);
    setHasChanges(false);
    if (onShowToast) {
      onShowToast('Configuration des champs du dossier patient enregistrée avec succès.', 'success');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Voulez-vous restaurer la configuration par défaut des champs du dossier patient ?')) {
      setFields(DEFAULT_PATIENT_FIELDS_CONFIG);
      saveStoredPatientFieldsConfig(DEFAULT_PATIENT_FIELDS_CONFIG);
      setHasChanges(false);
      if (onShowToast) {
        onShowToast('Configuration par défaut restaurée.', 'info');
      }
    }
  };

  const filteredFields = fields.filter((f) => {
    const matchesSearch =
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const mandatoryCount = fields.filter((f) => f.requirement === 'mandatory').length;
  const optionalCount = fields.filter((f) => f.requirement === 'optional').length;
  const hiddenCount = fields.filter((f) => f.requirement === 'hidden').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Identitovigilance &amp; Dossier Médical</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Paramètres des Champs du Dossier Patient</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configurez quels champs sont <strong>Obligatoires</strong> (contrôle bloquant à la saisie), <strong>Optionnels</strong> ou <strong>Masqués</strong> lors de la création d'un dossier patient ou à la facturation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurer Défauts
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer ${
              hasChanges
                ? 'bg-teal-600 hover:bg-teal-700 text-white animate-pulse'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Enregistrer ({hasChanges ? 'Modifications' : 'À jour'})
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Champs Gérés</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{fields.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Formulaire patient</div>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Champs Obligatoires</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-black text-rose-800 mt-1 font-mono">{mandatoryCount}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Saisie exigée (Bloquant)</div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Champs Optionnels</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1 font-mono">{optionalCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Facultatifs</div>
        </div>

        <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Champs Masqués</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <div className="text-2xl font-black text-slate-700 mt-1 font-mono">{hiddenCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Non affichés dans l'UI</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un champ (ex: NDM, Téléphone, Groupe Sanguin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'Toutes Catégories' },
            { key: 'identity', label: 'État Civil & Identité' },
            { key: 'contact', label: 'Contacts & Adresse' },
            { key: 'medical', label: 'Médical & Clinique' },
            { key: 'administrative', label: 'Assurance & Tiers-Payeur' }
          ].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategoryFilter(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === c.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">Champ du Dossier</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Description &amp; Rôle</th>
                <th className="py-3 px-4 text-center">Statut d'Exigence (Bascule en 1 Clic)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{field.label}</span>
                      {field.requirement === 'mandatory' && (
                        <span className="text-rose-500 font-black text-sm">*</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{field.id}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {field.category === 'identity'
                        ? 'État Civil'
                        : field.category === 'contact'
                        ? 'Contact'
                        : field.category === 'medical'
                        ? 'Médical'
                        : 'Assurance'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-md">
                    <p className="text-xs">{field.description}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() => handleRequirementChange(field.id, 'mandatory')}
                        className={`flex-1 py-1 px-2.5 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer ${
                          field.requirement === 'mandatory'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Obligatoire *</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequirementChange(field.id, 'optional')}
                        className={`flex-1 py-1 px-2.5 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer ${
                          field.requirement === 'optional'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Optionnel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequirementChange(field.id, 'hidden')}
                        className={`flex-1 py-1 px-2 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer ${
                          field.requirement === 'hidden'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>Masqué</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------------
// 6. GESTION DES CONVENTIONS ENTREPRISES & COMPAGNIES D'ASSURANCE
// --------------------------------------------------------------------------------------
export const AdminConventionsManagementView: React.FC<AdminViewsProps> = ({
  company,
  onNavigateToView,
  onShowToast
}) => {
  const [conventions, setConventions] = useState<EnterpriseConvention[]>(() => getStoredConventions());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'enterprise' | 'insurance' | 'mutual'>('all');
  const [selectedConvention, setSelectedConvention] = useState<EnterpriseConvention | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const saveConventions = (updated: EnterpriseConvention[]) => {
    setConventions(updated);
    saveStoredConventions(updated);
  };

  const handleOpenNew = () => {
    setSelectedConvention({
      id: `conv_${Date.now()}`,
      partner_id: Date.now(),
      partner_name: '',
      type: 'enterprise',
      convention_code: `CONV-${Date.now().toString().slice(-4)}`,
      default_coverage_rate: 80,
      supported_rates: [30, 50, 70, 75, 80, 100],
      requires_matricule: true,
      matricule_label: 'Matricule Employé / N° Prise en Charge',
      active: true,
      email: '',
      phone: '',
      address: 'Abidjan',
      notes: ''
    });
    setIsNew(true);
    setIsModalOpen(true);
  };

  const handleEdit = (conv: EnterpriseConvention) => {
    setSelectedConvention({ ...conv });
    setIsNew(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette convention ?')) {
      const updated = conventions.filter((c) => c.id !== id);
      saveConventions(updated);
      if (onShowToast) onShowToast('Convention supprimée.', 'warning');
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = selectedConvention?.partner_name || selectedConvention?.name || '';
    if (!selectedConvention || !nameVal.trim()) return;

    const normalizedConv = {
      ...selectedConvention,
      partner_name: nameVal.trim(),
      name: nameVal.trim(),
      code: selectedConvention.code || selectedConvention.convention_code,
      convention_code: selectedConvention.convention_code || selectedConvention.code,
    };

    let updated: EnterpriseConvention[];
    if (isNew) {
      updated = [normalizedConv, ...conventions];
    } else {
      updated = conventions.map((c) => (c.id === normalizedConv.id ? normalizedConv : c));
    }
    saveConventions(updated);
    setIsModalOpen(false);
    if (onShowToast) onShowToast('Convention enregistrée avec succès.', 'success');
  };

  const handleToggleActive = (id: string) => {
    const updated = conventions.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
    saveConventions(updated);
  };

  const handleResetDefaults = () => {
    if (confirm('Restaurer la liste des conventions partenaires par défaut ?')) {
      saveConventions(DEFAULT_CONVENTIONS);
      if (onShowToast) onShowToast('Conventions par défaut restaurées.', 'info');
    }
  };

  const filtered = conventions.filter((c) => {
    const name = (c.partner_name || c.name || '').toLowerCase();
    const code = (c.convention_code || c.code || '').toLowerCase();
    const matricule = (c.matricule_label || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.includes(q) || code.includes(q) || matricule.includes(q);
    const matchesType = typeFilter === 'all' || c.type === typeFilter || (typeFilter === 'mutual' && (c.type === 'mutuelle' as any));
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Tiers-Payeurs &amp; Conventions d'Entreprises</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Conventions Hôpital - Entreprises &amp; Assurances</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gérez les conventions de prise en charge directe des employés (SIR, CIE, Orange, etc.) et des assurés (SUNU, ASCOMA, AXA, etc.) avec taux conventionnés (30%, 50%, 75%, 80%, 100%) et édition de bordereaux récapitulatifs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Défauts
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Convention
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Conventions</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{conventions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Partenaires déclarés</div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Entreprises Conventionnées</div>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">
            {conventions.filter((c) => c.type === 'enterprise').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Prise en charge salariés</div>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Compagnies d'Assurance</div>
          <div className="text-2xl font-black text-blue-800 mt-1 font-mono">
            {conventions.filter((c) => c.type === 'insurance').length}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Régime tiers-payant</div>
        </div>

        <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Mutuelles &amp; Fonds</div>
          <div className="text-2xl font-black text-purple-800 mt-1 font-mono">
            {conventions.filter((c) => c.type === 'mutual').length}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">Santé solidaire</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom d'entreprise ou code convention..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'enterprise', label: 'Entreprises' },
            { key: 'insurance', label: 'Assurances' },
            { key: 'mutual', label: 'Mutuelles' }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTypeFilter(t.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                typeFilter === t.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">Convention / Entreprise</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Code Convention</th>
                <th className="py-3 px-3 text-center">Taux Par Défaut</th>
                <th className="py-3 px-3">Taux Autorisés</th>
                <th className="py-3 px-3">Matricule Salarié</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{conv.partner_name}</div>
                    <div className="text-[11px] text-slate-500">{conv.phone || conv.email || conv.address}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      conv.type === 'enterprise'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : conv.type === 'insurance'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {conv.type === 'enterprise' ? 'Entreprise' : conv.type === 'insurance' ? 'Assurance' : 'Mutuelle'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{conv.convention_code}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold rounded-lg text-xs">
                      {conv.default_coverage_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {conv.supported_rates.map((r) => (
                        <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                          {r}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {conv.requires_matricule ? (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Requis
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Optionnel</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(conv.id)}
                      className="cursor-pointer"
                    >
                      {conv.active ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                          Suspendue
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(conv)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(conv.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD Convention */}
      {isModalOpen && selectedConvention && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600" />
                {isNew ? 'Nouvelle Convention Tiers-Payeur' : `Modifier "${selectedConvention.partner_name}"`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nom de l'Entreprise ou Compagnie d'Assurance *</label>
                <input
                  type="text"
                  required
                  value={selectedConvention.partner_name}
                  onChange={(e) => setSelectedConvention({ ...selectedConvention, partner_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  placeholder="ex: SIR (Société Ivoirienne de Raffinage)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Type de Tiers-Payeur</label>
                  <select
                    value={selectedConvention.type}
                    onChange={(e) => setSelectedConvention({ ...selectedConvention, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="enterprise">Entreprise (Salariés / Agents)</option>
                    <option value="insurance">Compagnie d'Assurance</option>
                    <option value="mutual">Mutuelle de Santé</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Code Convention *</label>
                  <input
                    type="text"
                    required
                    value={selectedConvention.convention_code}
                    onChange={(e) => setSelectedConvention({ ...selectedConvention, convention_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                    placeholder="CONV-SIR-2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Taux de Prise en Charge par Défaut (%)</label>
                  <select
                    value={selectedConvention.default_coverage_rate}
                    onChange={(e) => setSelectedConvention({ ...selectedConvention, default_coverage_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="30">30% (Prise en charge partielle)</option>
                    <option value="50">50% (Moitié)</option>
                    <option value="70">70%</option>
                    <option value="75">75%</option>
                    <option value="80">80% (Standard Entreprise)</option>
                    <option value="90">90%</option>
                    <option value="100">100% (Prise en charge totale)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Téléphone / Contact</label>
                  <input
                    type="text"
                    value={selectedConvention.phone || ''}
                    onChange={(e) => setSelectedConvention({ ...selectedConvention, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                    placeholder="+225 27 21 00 00 00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Facturation &amp; Bordereaux</label>
                <input
                  type="email"
                  value={selectedConvention.email || ''}
                  onChange={(e) => setSelectedConvention({ ...selectedConvention, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  placeholder="tierspayant@entreprise.ci"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Intitulé du Matricule / Carte</label>
                <input
                  type="text"
                  value={selectedConvention.matricule_label || ''}
                  onChange={(e) => setSelectedConvention({ ...selectedConvention, matricule_label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  placeholder="ex: N° Matricule Salarié SIR / N° Bon"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConvention.requires_matricule}
                    onChange={(e) => setSelectedConvention({ ...selectedConvention, requires_matricule: e.target.checked })}
                    className="rounded text-slate-900"
                  />
                  <span>Exiger le N° de matricule à la facturation</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConvention.active}
                    onChange={(e) => setSelectedConvention({ ...selectedConvention, active: e.target.checked })}
                    className="rounded text-slate-900"
                  />
                  <span>Convention active</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
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

// --------------------------------------------------------------------------------------
// 7. GESTION DU CATALOGUE DES CONSULTATIONS MÉDICALES PAR PÔLE (PÉDIATRIE, MATERNITÉ, ETC.)
// --------------------------------------------------------------------------------------
export const AdminConsultationTypesManagementView: React.FC<AdminViewsProps> = ({
  company,
  onNavigateToView,
  onShowToast
}) => {
  const [types, setTypes] = useState<HospitalConsultationType[]>(() => getStoredConsultationTypes());
  const [searchQuery, setSearchQuery] = useState('');
  const [poleFilter, setPoleFilter] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<HospitalConsultationType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const saveTypes = (updated: HospitalConsultationType[]) => {
    setTypes(updated);
    saveStoredConsultationTypes(updated);
  };

  const handleOpenNew = () => {
    setSelectedType({
      id: `cons_${Date.now()}`,
      code: `CONS-${Date.now().toString().slice(-4)}`,
      name: '',
      pole: 'generaliste',
      pole_label: 'Médecine Générale',
      price: 10000,
      duration_minutes: 20,
      description: '',
      active: true
    });
    setIsNew(true);
    setIsModalOpen(true);
  };

  const handleEdit = (t: HospitalConsultationType) => {
    setSelectedType({ ...t });
    setIsNew(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous supprimer ce type de consultation ?')) {
      const updated = types.filter((t) => t.id !== id);
      saveTypes(updated);
      if (onShowToast) onShowToast('Consultation supprimée.', 'warning');
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedType.name.trim()) return;

    let updated: HospitalConsultationType[];
    if (isNew) {
      updated = [...types, selectedType];
    } else {
      updated = types.map((t) => (t.id === selectedType.id ? selectedType : t));
    }
    saveTypes(updated);
    setIsModalOpen(false);
    if (onShowToast) onShowToast('Type de consultation enregistré.', 'success');
  };

  const handleToggleActive = (id: string) => {
    const updated = types.map((t) => (t.id === id ? { ...t, active: !t.active } : t));
    saveTypes(updated);
  };

  const handleResetDefaults = () => {
    if (confirm('Restaurer la liste des consultations par défaut ?')) {
      saveTypes(DEFAULT_CONSULTATION_TYPES);
      if (onShowToast) onShowToast('Consultations par défaut restaurées.', 'info');
    }
  };

  const filtered = types.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pole_label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPole = poleFilter === 'all' || t.pole === poleFilter;
    return matchesSearch && matchesPole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>Tarification &amp; Pôles Médicaux</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Catalogue des Consultations par Pôle</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Ajoutez, modifiez ou activez les consultations pour chaque pôle (Pédiatrie, Maternité, Médecine Générale, Spécialiste, etc.). Ces consultations sont immédiatement sélectionnables lors de la facturation directe.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Défauts
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter une Consultation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Consultations</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{types.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tous pôles confondus</div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pédiatrie &amp; Enfance</div>
          <div className="text-2xl font-black text-amber-800 mt-1 font-mono">
            {types.filter((t) => t.pole === 'pediatrie').length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Nourrissons &amp; Enfants</div>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Maternité &amp; Gynéco</div>
          <div className="text-2xl font-black text-rose-800 mt-1 font-mono">
            {types.filter((t) => t.pole === 'maternite').length}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5">CPN, Échos, Accouchement</div>
        </div>

        <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 shadow-xs">
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Générale &amp; Spécialités</div>
          <div className="text-2xl font-black text-teal-800 mt-1 font-mono">
            {types.filter((t) => t.pole === 'generaliste' || t.pole === 'specialiste').length}
          </div>
          <div className="text-[11px] text-teal-600 mt-0.5">Médecins &amp; Praticiens</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une consultation ou un code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'Tous les Pôles' },
            { key: 'generaliste', label: 'Médecine Générale' },
            { key: 'pediatrie', label: 'Pédiatrie' },
            { key: 'maternite', label: 'Maternité' },
            { key: 'specialiste', label: 'Spécialités' },
            { key: 'infirmier', label: 'Soins / Triage' },
            { key: 'urgences', label: 'Urgences' }
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPoleFilter(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                poleFilter === p.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">Consultation / Acte</th>
                <th className="py-3 px-3">Pôle Médical</th>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3 text-right">Tarif Public (FCFA)</th>
                <th className="py-3 px-3 text-center">Durée Est.</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.description}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {item.pole_label}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.code}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-xs">
                    {item.price.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">
                    {item.duration_minutes ? `${item.duration_minutes} min` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id)}
                      className="cursor-pointer"
                    >
                      {item.active ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                          Désactivée
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD Consultation */}
      {isModalOpen && selectedType && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                {isNew ? 'Créer une Consultation' : `Modifier "${selectedType.name}"`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Libellé de la Consultation *</label>
                <input
                  type="text"
                  required
                  value={selectedType.name}
                  onChange={(e) => setSelectedType({ ...selectedType, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="ex: Consultation Pédiatrique Spécialisée"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pôle Médical</label>
                  <select
                    value={selectedType.pole}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const labels: Record<string, string> = {
                        generaliste: 'Médecine Générale',
                        pediatrie: 'Pédiatrie & Santé Infantile',
                        maternite: 'Maternité & Gynéco-Obstétrique',
                        specialiste: 'Médecine Spécialisée',
                        infirmier: 'Soins Infirmiers & Triage',
                        urgences: 'Urgences Médico-Chirurgicales'
                      };
                      setSelectedType({
                        ...selectedType,
                        pole: val,
                        pole_label: labels[val] || val
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="generaliste">Médecine Générale</option>
                    <option value="pediatrie">Pédiatrie &amp; Santé Infantile</option>
                    <option value="maternite">Maternité &amp; Gynéco-Obstétrique</option>
                    <option value="specialiste">Médecine Spécialisée</option>
                    <option value="infirmier">Soins Infirmiers &amp; Triage</option>
                    <option value="urgences">Urgences</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Code Acte *</label>
                  <input
                    type="text"
                    required
                    value={selectedType.code}
                    onChange={(e) => setSelectedType({ ...selectedType, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    placeholder="CONS-PED-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tarif Public (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={selectedType.price}
                    onChange={(e) => setSelectedType({ ...selectedType, price: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Durée Estimée (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={selectedType.duration_minutes || 20}
                    onChange={(e) => setSelectedType({ ...selectedType, duration_minutes: Number(e.target.value) || 20 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description &amp; Consignes</label>
                <textarea
                  rows={2}
                  value={selectedType.description || ''}
                  onChange={(e) => setSelectedType({ ...selectedType, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedType.active}
                    onChange={(e) => setSelectedType({ ...selectedType, active: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>Consultation active (visible à la facturation)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
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
