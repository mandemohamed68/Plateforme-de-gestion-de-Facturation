import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Plus, 
  Bed, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck, 
  Eye, 
  Printer, 
  ArrowRight, 
  Trash2, 
  Users, 
  UserCheck,
  Check, 
  Activity, 
  Heart, 
  Lock, 
  Database,
  FlaskConical,
  Microscope,
  Info,
  Sliders,
  Sparkles,
  ArrowLeftRight,
  UserPlus,
  LogOut,
  X,
  LayoutGrid,
  ListFilter,
  Building2,
  Stethoscope,
  BadgeAlert,
  CheckSquare,
  Share2,
  Send,
  Layers,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { ResUser, ResPartner } from '../types';
import { printDocumentById } from '../lib/printUtils';

interface SihViewProps {
  partners: ResPartner[];
  currentUser: ResUser | null;
}

// 1. GESTION DES RENDEZ-VOUS (APPOINTMENTS)
export const AppointmentsView: React.FC<SihViewProps> = ({ partners }) => {
  const [appointments, setAppointments] = useState([
    { id: 1, patientName: "Awa Diallo", time: "09:00", date: "2026-09-15", doctorName: "Dr. Toure (Généraliste)", reason: "Consultation de suivi", status: "Confirmé" },
    { id: 2, patientName: "Mamadou Sow", time: "10:30", date: "2026-09-15", doctorName: "Dr. Camara (Cardiologue)", reason: "ECG de contrôle", status: "En attente" },
    { id: 3, patientName: "Sékou Mara", time: "14:00", date: "2026-09-15", doctorName: "Dr. Toure (Généraliste)", reason: "Fièvre persistante", status: "Confirmé" },
    { id: 4, patientName: "Fanta Condé", time: "15:30", date: "2026-09-16", doctorName: "Dr. Keita (Pédiatre)", reason: "Vaccination 11 mois", status: "Annulé" }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [newPatient, setNewPatient] = useState("");
  const [newDoctor, setNewDoctor] = useState("Dr. Toure (Généraliste)");
  const [newTime, setNewTime] = useState("10:00");
  const [newDate, setNewDate] = useState("2026-09-15");
  const [newReason, setNewReason] = useState("");

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient || !newReason) return;
    const newApp = {
      id: appointments.length + 1,
      patientName: newPatient,
      doctorName: newDoctor,
      time: newTime,
      date: newDate,
      reason: newReason,
      status: "Confirmé"
    };
    setAppointments([newApp, ...appointments]);
    setNewPatient("");
    setNewReason("");
  };

  const filtered = appointments.filter(app => 
    app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            Gestion des Rendez-vous & Planification
          </h2>
          <p className="text-xs text-slate-500">Planifiez les visites et suivez la file d'attente des praticiens</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher patient ou médecin..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de planification */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-slate-700" /> Planifier un RDV
          </h3>
          <form onSubmit={handleAddAppointment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient</label>
              <select 
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                value={newPatient}
                onChange={(e) => setNewPatient(e.target.value)}
              >
                <option value="">-- Choisir un patient --</option>
                {partners.map((p, idx) => (
                  <option key={`partner-app-${p.id}-${idx}`} value={p.name}>{p.name} {p.ref ? `(${p.ref})` : ''}</option>
                ))}
                <option value="Mariama Sylla">Mariama Sylla (Nouveau)</option>
                <option value="Ibrahim Bangoura">Ibrahim Bangoura (Nouveau)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input type="date" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Heure</label>
                <input type="time" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Médecin Praticien</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" value={newDoctor} onChange={e => setNewDoctor(e.target.value)}>
                <option value="Dr. Toure (Généraliste)">Dr. Toure (Généraliste)</option>
                <option value="Dr. Camara (Cardiologue)">Dr. Camara (Cardiologue)</option>
                <option value="Dr. Keita (Pédiatre)">Dr. Keita (Pédiatre)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Motif de consultation</label>
              <input type="text" placeholder="Ex: Hypertension, Fièvre..." className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" value={newReason} onChange={e => setNewReason(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-lg font-bold transition">
              Enregistrer le RDV
            </button>
          </form>
        </div>

        {/* Liste des rendez-vous */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Aucun rendez-vous trouvé correspondant aux filtres.
            </div>
          ) : (
            filtered.map((app) => (
              <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{app.patientName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      app.status === 'Confirmé' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      app.status === 'En attente' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>{app.status}</span>
                  </div>
                  <p className="text-slate-600 font-medium">{app.doctorName} • <span className="text-slate-400 font-normal">{app.reason}</span></p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {app.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {app.time}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setAppointments(appointments.map(a => a.id === app.id ? {...a, status: 'Confirmé'} : a))}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600" 
                    title="Confirmer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button 
                    onClick={() => setAppointments(appointments.filter(a => a.id !== app.id))}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-rose-600" 
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 2. GESTION DES LITS ET SÉJOURS (BED MANAGEMENT) - PLAN VISUEL & TABLEAU ANALYTIQUE
export const BedManagementView: React.FC<SihViewProps> = ({ partners }) => {
  const [lits, setLits] = useState([
    { id: "A1", type: "Standard", service: "Médecine Interne", chambre: "Chambre 101", etage: "1er Étage", patient: "Abdourahmane Diallo", dossier: "NDM-0048", age: "54 ans", dateEntree: "2026-09-10", medecin: "Dr. Toure", diagnostic: "Insuffisance rénale aiguë", status: "Occupé" },
    { id: "A2", type: "Standard", service: "Médecine Interne", chambre: "Chambre 101", etage: "1er Étage", patient: "Fanta Condé", dossier: "NDM-00389", age: "42 ans", dateEntree: "2026-09-12", medecin: "Dr. Camara", diagnostic: "Poussée hypertensive", status: "Occupé" },
    { id: "A3", type: "Standard", service: "Médecine Interne", chambre: "Chambre 102", etage: "1er Étage", patient: "", dossier: "", age: "", dateEntree: "", medecin: "Dr. Toure", diagnostic: "", status: "Libre" },
    { id: "A4", type: "Standard", service: "Médecine Interne", chambre: "Chambre 102", etage: "1er Étage", patient: "", dossier: "", age: "", dateEntree: "", medecin: "Dr. Toure", diagnostic: "", status: "Libre" },
    { id: "B1", type: "Chirurgical", service: "Chirurgie", chambre: "Chambre 201", etage: "2ème Étage", patient: "Mamadou Sylla", dossier: "NDM-00245", age: "38 ans", dateEntree: "2026-09-08", medecin: "Dr. Diallo", diagnostic: "Post-op appendicectomie J+2", status: "Occupé" },
    { id: "B2", type: "Chirurgical", service: "Chirurgie", chambre: "Chambre 201", etage: "2ème Étage", patient: "", dossier: "", age: "", dateEntree: "", medecin: "Dr. Diallo", diagnostic: "", status: "Désinfection" },
    { id: "B3", type: "Chirurgical", service: "Chirurgie", chambre: "Chambre 202", etage: "2ème Étage", patient: "Sery Bernadette", dossier: "NDM-0042", age: "62 ans", dateEntree: "2026-09-12", medecin: "Dr. Koné", diagnostic: "Suivi colectomie", status: "Occupé" },
    { id: "B4", type: "Chirurgical", service: "Chirurgie", chambre: "Chambre 202", etage: "2ème Étage", patient: "", dossier: "", age: "", dateEntree: "", medecin: "Dr. Koné", diagnostic: "", status: "Libre" },
    { id: "C1", type: "Soins Intensifs", service: "Soins Intensifs", chambre: "Box SI-1", etage: "Rez-de-chaussée", patient: "Sékou Touré", dossier: "NDM-00198", age: "67 ans", dateEntree: "2026-09-13", medecin: "Dr. Keita", diagnostic: "Détresse respiratoire aiguë", status: "Occupé" },
    { id: "C2", type: "Soins Intensifs", service: "Soins Intensifs", chambre: "Box SI-2", etage: "Rez-de-chaussée", patient: "", dossier: "", age: "", dateEntree: "", medecin: "Dr. Keita", diagnostic: "", status: "Libre" },
    { id: "M1", type: "Maternité", service: "Maternité / Obstétrique", chambre: "Chambre 105", etage: "1er Étage", patient: "Mariam Traoré", dossier: "NDM-00512", age: "28 ans", dateEntree: "2026-09-15", medecin: "Dr. Bamba", diagnostic: "Accouchement voie basse J0", status: "Occupé" },
    { id: "M2", type: "Maternité", service: "Maternité / Obstétrique", chambre: "Chambre 105", etage: "1er Étage", patient: "", dossier: "", age: "", dateEntree: "", medecin: "Dr. Bamba", diagnostic: "", status: "Libre" }
  ]);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [filterService, setFilterService] = useState<string>("Tous");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBedForAction, setSelectedBedForAction] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showBedDetailModal, setShowBedDetailModal] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [assignPatientName, setAssignPatientName] = useState<string>(partners[0]?.name || "Nouveau Patient");
  const [assignDoctor, setAssignDoctor] = useState<string>("Dr. Toure");
  const [assignDiag, setAssignDiag] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenAssign = (lit: any) => {
    setSelectedBedForAction(lit);
    setAssignPatientName(partners[0]?.name || "Nouveau Patient");
    setAssignDoctor(lit.medecin || "Dr. Toure");
    setAssignDiag("");
    setShowAssignModal(true);
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForAction || !assignPatientName) return;
    const patObj = partners.find(p => p.name === assignPatientName);
    setLits(lits.map(lit => {
      if (lit.id === selectedBedForAction.id) {
        return {
          ...lit,
          status: "Occupé",
          patient: assignPatientName,
          dossier: patObj?.code || `NDM-00${Math.floor(100 + Math.random() * 900)}`,
          age: "45 ans",
          dateEntree: new Date().toISOString().split('T')[0],
          medecin: assignDoctor,
          diagnostic: assignDiag || "Admission hospitalière"
        };
      }
      return lit;
    }));
    setShowAssignModal(false);
    setSelectedBedForAction(null);
    showToast(`Lit ${selectedBedForAction.id} affecté avec succès à ${assignPatientName}`);
  };

  const handleLiberateBed = (id: string, bedLabel: string) => {
    setLits(lits.map(lit => {
      if (lit.id === id) {
        return { ...lit, status: "Désinfection", patient: "", dossier: "", age: "", dateEntree: "", diagnostic: "" };
      }
      return lit;
    }));
    setShowBedDetailModal(null);
    showToast(`Lit ${bedLabel} libéré et placé sous protocole de désinfection`);
  };

  const handleSetReady = (id: string, bedLabel: string) => {
    setLits(lits.map(lit => {
      if (lit.id === id) {
        return { ...lit, status: "Libre", patient: "", dossier: "", age: "", dateEntree: "", diagnostic: "" };
      }
      return lit;
    }));
    setShowBedDetailModal(null);
    showToast(`Lit ${bedLabel} validé propre et prêt à recevoir une admission`);
  };

  const occupies = lits.filter(l => l.status === "Occupé").length;
  const libres = lits.filter(l => l.status === "Libre").length;
  const desinfection = lits.filter(l => l.status === "Désinfection").length;
  const totalLits = lits.length;
  const tauxOccupation = totalLits > 0 ? Math.round((occupies / totalLits) * 100) : 0;

  const servicesList = Array.from(new Set(lits.map(l => l.service)));

  const filteredLits = lits.filter(lit => {
    const matchesStatus = filterStatus === "Tous" || lit.status === filterStatus;
    const matchesService = filterService === "Tous" || lit.service === filterService;
    const matchesSearch = 
      lit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lit.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lit.chambre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lit.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lit.dossier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesService && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-700" />
            Planification &amp; Gestion Optimale des Lits d&apos;Hospitalisation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cartographie temps réel des chambres, taux d&apos;occupation des lits et gestion des désinfections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Plan Visuel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synthesis Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Capacité Totale</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalLits} Lits</p>
            <span className="text-[11px] text-slate-500 font-semibold">{servicesList.length} Services actifs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lits Occupés</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {occupies} <span className="text-xs font-bold text-slate-500">({tauxOccupation}%)</span>
            </p>
            <span className="text-[11px] text-rose-600 font-semibold">Tension modérée</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <Users className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lits Disponibles</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{libres}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">Prêts pour admission</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">En Désinfection</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{desinfection}</p>
            <span className="text-[11px] text-amber-600 font-semibold">Protocole d&apos;hygiène</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center shadow-xs">
        <div className="flex flex-1 w-full md:w-auto items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Rechercher lit, chambre, patient..."
              className="bg-transparent border-none outline-none w-full font-medium text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 outline-none"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
          >
            <option value="Tous">Tous les services</option>
            {servicesList.map((srv) => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold w-full md:w-auto justify-center">
          {["Tous", "Libre", "Occupé", "Désinfection"].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterStatus === st 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === "Libre" ? "Libres" : st === "Occupé" ? "Occupés" : st}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: PLAN VISUEL PAR SERVICES ET CHAMBRES */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {servicesList
            .filter(srv => filterService === 'Tous' || filterService === srv)
            .map((srv) => {
              const bedsInService = filteredLits.filter(l => l.service === srv);
              if (bedsInService.length === 0) return null;

              return (
                <div key={srv} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">{srv}</h3>
                      <span className="text-xs text-slate-400 font-medium">({bedsInService.length} Lits)</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {bedsInService.filter(b => b.status === 'Libre').length} Libres
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {bedsInService.filter(b => b.status === 'Occupé').length} Occupés
                      </span>
                      {bedsInService.some(b => b.status === 'Désinfection') && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {bedsInService.filter(b => b.status === 'Désinfection').length} En désinfection
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {bedsInService.map((lit) => {
                      const isOcc = lit.status === 'Occupé';
                      const isFree = lit.status === 'Libre';
                      const isDisinf = lit.status === 'Désinfection';

                      return (
                        <div
                          key={lit.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 relative shadow-xs"
                        >
                          {/* Bed Top Info */}
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-black text-sm px-2 py-0.5 rounded ${
                                  isOcc ? 'bg-rose-600 text-white' : isFree ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                                }`}>
                                  Lit {lit.id}
                                </span>
                                <span className="text-[11px] font-bold text-slate-700">{lit.chambre}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                                {lit.type} • {lit.etage}
                              </span>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isOcc
                                ? 'bg-rose-100 text-rose-800'
                                : isFree
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {lit.status}
                            </span>
                          </div>

                          {/* Patient details if Occupied */}
                          {isOcc && (
                            <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100 space-y-1 text-xs">
                              <div className="font-bold text-slate-900 flex justify-between">
                                <span className="truncate">{lit.patient}</span>
                                <span className="font-mono text-[10px] text-slate-500 shrink-0">{lit.dossier}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 truncate">
                                Diag : <strong className="font-semibold text-slate-800">{lit.diagnostic || 'Observation'}</strong>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                                <span>Entré : {lit.dateEntree}</span>
                                <span className="font-semibold text-slate-700">{lit.medecin}</span>
                              </div>
                            </div>
                          )}

                          {/* Details if Free */}
                          {isFree && (
                            <div className="bg-white/60 p-2.5 rounded-lg border border-emerald-100 text-xs text-center text-emerald-800 font-semibold py-4">
                              <Check className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                              Lit propre &amp; prêt à être assigné
                            </div>
                          )}

                          {/* Details if Disinfection */}
                          {isDisinf && (
                            <div className="bg-white/60 p-2.5 rounded-lg border border-amber-100 text-xs text-center text-amber-800 font-semibold py-4">
                              <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1 animate-spin" />
                              Bio-nettoyage et désinfection en cours
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {isFree && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssign(lit)}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Affecter Patient</span>
                              </button>
                            )}

                            {isOcc && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setShowBedDetailModal(lit)}
                                  className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Détails</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLiberateBed(lit.id, `Lit ${lit.id}`)}
                                  className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Libérer le lit pour désinfection"
                                >
                                  <LogOut className="w-3 h-3" />
                                  <span>Libérer</span>
                                </button>
                              </>
                            )}

                            {isDisinf && (
                              <button
                                type="button"
                                onClick={() => handleSetReady(lit.id, `Lit ${lit.id}`)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Valider Fin Désinfection (Prêt)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW 2: TABLEAU SYNTHÉTIQUE ANALYTIQUE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lit &amp; Type</th>
                  <th className="py-3 px-4">Service &amp; Chambre</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Patient Hospitalisé</th>
                  <th className="py-3 px-4">Diagnostic / Motif</th>
                  <th className="py-3 px-4">Date d&apos;Entrée</th>
                  <th className="py-3 px-4">Médecin Référent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      Aucun lit ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredLits.map((lit) => (
                    <tr key={lit.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            lit.status === 'Occupé' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            lit.status === 'Libre' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {lit.id}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">Lit {lit.id}</span>
                            <span className="text-[10px] text-slate-500">{lit.type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{lit.service}</span>
                        <span className="text-[10px] text-slate-500">{lit.chambre} • {lit.etage}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          lit.status === 'Occupé' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          lit.status === 'Libre' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            lit.status === 'Occupé' ? 'bg-rose-500' :
                            lit.status === 'Libre' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          {lit.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {lit.patient ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{lit.patient}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{lit.dossier} • {lit.age}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucun patient</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs text-slate-700">
                        {lit.diagnostic ? (
                          <span className="truncate block">{lit.diagnostic}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {lit.dateEntree || '—'}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {lit.medecin}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lit.status === 'Libre' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssign(lit)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              Affecter
                            </button>
                          )}
                          {lit.status === 'Occupé' && (
                            <button
                              type="button"
                              onClick={() => handleLiberateBed(lit.id, `Lit ${lit.id}`)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title="Libérer et désinfecter"
                            >
                              <LogOut className="w-3 h-3" />
                              Libérer
                            </button>
                          )}
                          {lit.status === 'Désinfection' && (
                            <button
                              type="button"
                              onClick={() => handleSetReady(lit.id, `Lit ${lit.id}`)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              Prêt (Libre)
                            </button>
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
      )}

      {/* Modal: Affectation Lit */}
      {showAssignModal && selectedBedForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-slate-700" />
                Affecter le Lit {selectedBedForAction.id} ({selectedBedForAction.service})
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sélectionner le Patient</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  value={assignPatientName}
                  onChange={(e) => setAssignPatientName(e.target.value)}
                >
                  {partners.map((p, idx) => (
                    <option key={`partner-bed-${p.id}-${idx}`} value={p.name}>{p.name} ({p.code || 'PAT'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Médecin Référent</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  value={assignDoctor}
                  onChange={(e) => setAssignDoctor(e.target.value)}
                >
                  <option value="Dr. Toure">Dr. Toure (Médecine)</option>
                  <option value="Dr. Camara">Dr. Camara (Cardiologie)</option>
                  <option value="Dr. Koné">Dr. Koné (Chirurgie)</option>
                  <option value="Dr. Diallo">Dr. Diallo (Chirurgie)</option>
                  <option value="Dr. Keita">Dr. Keita (Soins Intensifs)</option>
                  <option value="Dr. Bamba">Dr. Bamba (Maternité)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif / Diagnostic d&apos;Admission</label>
                <input
                  type="text"
                  placeholder="Ex : Déshydratation aiguë, surveillance post-op..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  value={assignDiag}
                  onChange={(e) => setAssignDiag(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Chambre &amp; Étage :</span>
                  <strong className="text-slate-900">{selectedBedForAction.chambre} • {selectedBedForAction.etage}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Service d&apos;accueil :</span>
                  <strong className="text-slate-900">{selectedBedForAction.service}</strong>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Confirmer l&apos;affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Détail Lit Occupé */}
      {showBedDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Dossier d&apos;Hospitalisation</span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-slate-700" />
                  Lit {showBedDetailModal.id} — {showBedDetailModal.chambre}
                </h3>
              </div>
              <button
                onClick={() => setShowBedDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{showBedDetailModal.patient}</h4>
                    <span className="font-mono text-slate-500">{showBedDetailModal.dossier} • {showBedDetailModal.age}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                    Hospitalisé(e)
                  </span>
                </div>
                <div className="text-slate-700">
                  <strong>Diagnostic :</strong> {showBedDetailModal.diagnostic || 'Non renseigné'}
                </div>
                <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                  <span>Médecin Référent : <strong>{showBedDetailModal.medecin}</strong></span>
                  <span>Entrée le : <strong>{showBedDetailModal.dateEntree}</strong></span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 text-slate-600 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Service :</span>
                  <strong className="text-slate-900">{showBedDetailModal.service}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Localisation :</span>
                  <strong className="text-slate-900">{showBedDetailModal.etage}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Type de lit :</span>
                  <strong className="text-slate-900">{showBedDetailModal.type}</strong>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBedDetailModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-xs"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleLiberateBed(showBedDetailModal.id, `Lit ${showBedDetailModal.id}`)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Libérer le lit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2.5 GESTION DES TRANSFERTS (HOSPITAL TRANSFERS VIEW) - DEDIE AU MENU TRANSFERTS
export const HospitalTransfersView: React.FC<SihViewProps> = ({ partners }) => {
  const [transfers, setTransfers] = useState([
    {
      id: "TRF-2026-001",
      date: "2026-09-15 14:30",
      patient: "Mamadou Sylla",
      dossier: "PAT-00245",
      serviceOrigine: "Urgences Médicales",
      litOrigine: "Box U-02",
      serviceDestination: "Chirurgie Hommes",
      litDestination: "Lit B1",
      motif: "Surveillance post-intervention appendicectomie",
      medecinDemandeur: "Dr. Diallo",
      priorite: "Urgente",
      statut: "Effectué"
    },
    {
      id: "TRF-2026-002",
      date: "2026-09-15 11:15",
      patient: "Fanta Condé",
      dossier: "PAT-00389",
      serviceOrigine: "Maternité / Obstétrique",
      litOrigine: "Lit M-04",
      serviceDestination: "Médecine Interne",
      litDestination: "Lit A2",
      motif: "Bilan complémentaire tensionnel & surveillance",
      medecinDemandeur: "Dr. Camara",
      priorite: "Normale",
      statut: "Effectué"
    },
    {
      id: "TRF-2026-003",
      date: "2026-09-16 09:00",
      patient: "Awa Diallo",
      dossier: "PAT-00102",
      serviceOrigine: "Médecine Interne",
      litOrigine: "Lit A1",
      serviceDestination: "Soins Intensifs",
      litDestination: "Box SI-1",
      motif: "Détresse respiratoire aiguë - Surveillance continue",
      medecinDemandeur: "Dr. Toure",
      priorite: "Très Urgente",
      statut: "En attente"
    }
  ]);

  const [filterStatut, setFilterStatut] = useState<string>("Tous");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showNewTransferModal, setShowNewTransferModal] = useState<boolean>(false);

  const [newPatient, setNewPatient] = useState<string>(partners[0]?.name || "");
  const [newOrigineService, setNewOrigineService] = useState<string>("Urgences");
  const [newOrigineLit, setNewOrigineLit] = useState<string>("Box U-01");
  const [newDestService, setNewDestService] = useState<string>("Médecine Interne");
  const [newDestLit, setNewDestLit] = useState<string>("Lit A3");
  const [newMotif, setNewMotif] = useState<string>("");
  const [newPriorite, setNewPriorite] = useState<string>("Normale");
  const [newMedecin, setNewMedecin] = useState<string>("Dr. Toure");

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient || !newMotif) return;
    const patObj = partners.find(p => p.name === newPatient);
    const newTrf = {
      id: `TRF-2026-00${transfers.length + 1}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      patient: newPatient,
      dossier: patObj?.code || `PAT-00${Math.floor(100 + Math.random() * 900)}`,
      serviceOrigine: newOrigineService,
      litOrigine: newOrigineLit,
      serviceDestination: newDestService,
      litDestination: newDestLit,
      motif: newMotif,
      medecinDemandeur: newMedecin,
      priorite: newPriorite,
      statut: "En attente"
    };
    setTransfers([newTrf, ...transfers]);
    setShowNewTransferModal(false);
    setNewMotif("");
  };

  const handleValidateTransfer = (id: string) => {
    setTransfers(transfers.map(t => t.id === id ? { ...t, statut: "Effectué" } : t));
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesStatut = filterStatut === "Tous" || t.statut === filterStatut;
    const matchesSearch = 
      t.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.motif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.serviceOrigine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.serviceDestination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatut && matchesSearch;
  });

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-slate-700" />
            Gestion des Transferts de Patients
          </h2>
          <p className="text-xs text-slate-500">Mouvements inter-services, changements de chambre et attributions de lits d&apos;accueil</p>
        </div>

        <button
          onClick={() => setShowNewTransferModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Initier un Transfert
        </button>
      </div>

      {/* Synthesis Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Transferts</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{transfers.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-slate-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">En Attente</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">{transfers.filter(t => t.statut === 'En attente').length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Effectués / Validés</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{transfers.filter(t => t.statut === 'Effectué').length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lits Libres Réceptifs</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <Bed className="w-4 h-4 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Rechercher patient, service ou motif..."
            className="bg-transparent border-none outline-none w-full font-medium text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold w-full md:w-auto justify-center">
          {["Tous", "En attente", "Effectué"].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatut(st)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterStatut === st 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === "Effectué" ? "Effectués" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table presentation */}
      <div id="transfers-register-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Réf & Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Origine</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Motif Médical</th>
                <th className="py-3 px-4">Priorité</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    Aucun transfert enregistré dans cette sélection.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{trf.id}</span>
                      <span className="text-[10px] text-slate-500">{trf.date}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{trf.patient}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{trf.dossier}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{trf.serviceOrigine}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{trf.litOrigine}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-800 block">{trf.serviceDestination}</span>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold">{trf.litDestination}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-700 truncate" title={trf.motif}>{trf.motif}</p>
                      <span className="text-[10px] text-slate-400">Demandeur : {trf.medecinDemandeur}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trf.priorite === 'Très Urgente' ? 'bg-rose-100 text-rose-800' :
                        trf.priorite === 'Urgente' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {trf.priorite}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        trf.statut === 'Effectué' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          trf.statut === 'Effectué' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        {trf.statut}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {trf.statut === 'En attente' && (
                          <button
                            onClick={() => handleValidateTransfer(trf.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Valider
                          </button>
                        )}
                        <button
                          onClick={() => printDocumentById('transfers-register-table', `Bon_Transfert_${trf.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                          title="Imprimer le bon de transfert"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* Modal Nouveau Transfert */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-slate-700" />
                Initier une Demande de Transfert de Patient
              </h3>
              <button onClick={() => setShowNewTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient à Transférer</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  value={newPatient}
                  onChange={(e) => setNewPatient(e.target.value)}
                >
                  {partners.map((p, idx) => (
                    <option key={`partner-trf-${p.id}-${idx}`} value={p.name}>{p.name} ({p.code || 'PAT'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block text-[11px]">Unité d&apos;Origine</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Service Source</label>
                    <input 
                      type="text" 
                      className="w-full p-1.5 border border-slate-200 rounded bg-white font-medium text-xs"
                      value={newOrigineService}
                      onChange={(e) => setNewOrigineService(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Lit / Box Actuel</label>
                    <input 
                      type="text" 
                      className="w-full p-1.5 border border-slate-200 rounded bg-white font-medium text-xs"
                      value={newOrigineLit}
                      onChange={(e) => setNewOrigineLit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                  <span className="font-bold text-emerald-900 block text-[11px]">Unité de Destination</span>
                  <div>
                    <label className="block text-[10px] text-emerald-700 mb-0.5">Service Récepteur</label>
                    <select 
                      className="w-full p-1.5 border border-emerald-200 rounded bg-white font-medium text-xs"
                      value={newDestService}
                      onChange={(e) => setNewDestService(e.target.value)}
                    >
                      <option value="Médecine Interne">Médecine Interne</option>
                      <option value="Chirurgie Hommes">Chirurgie Hommes</option>
                      <option value="Soins Intensifs">Soins Intensifs</option>
                      <option value="Maternité">Maternité</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-700 mb-0.5">Lit Libre Attribué</label>
                    <select 
                      className="w-full p-1.5 border border-emerald-200 rounded bg-white font-medium text-xs"
                      value={newDestLit}
                      onChange={(e) => setNewDestLit(e.target.value)}
                    >
                      <option value="Lit A3">Lit A3 (Médecine)</option>
                      <option value="Lit B3">Lit B3 (Chirurgie)</option>
                      <option value="Box SI-2">Box SI-2 (Soins Intensifs)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Niveau d&apos;Urgence</label>
                  <select 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    value={newPriorite}
                    onChange={(e) => setNewPriorite(e.target.value)}
                  >
                    <option value="Normale">Normale</option>
                    <option value="Urgente">Urgente</option>
                    <option value="Très Urgente">Très Urgente / Réa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Médecin Demandeur</label>
                  <select 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    value={newMedecin}
                    onChange={(e) => setNewMedecin(e.target.value)}
                  >
                    <option value="Dr. Toure">Dr. Toure (Médecine)</option>
                    <option value="Dr. Diallo">Dr. Diallo (Chirurgie)</option>
                    <option value="Dr. Camara">Dr. Camara (Cardiologie)</option>
                    <option value="Dr. Keita">Dr. Keita (Soins Intensifs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif Médical / Justification du Transfert</label>
                <textarea 
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                  placeholder="Ex : Fin d'intervention chirurgicale, poursuite de l'hospitalisation en service de chirurgie..."
                  value={newMotif}
                  onChange={(e) => setNewMotif(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Valider le Transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. COURRIERS ET LETTRES DE LIAISON (LETTERS & REFERRALS)
export const LettersReferralsView: React.FC<SihViewProps> = ({ partners }) => {
  const [letters, setLetters] = useState([
    { id: 1, type: "Certificat Médical", patient: "Awa Diallo", date: "2026-09-14", notes: "Arrêt de travail de 3 jours pour syndrome grippal" },
    { id: 2, type: "Lettre d'Orientation", patient: "Mamadou Sow", date: "2026-09-13", notes: "Orientation vers cardiologue pour bilan d'hypertension" }
  ]);

  const [type, setType] = useState("Certificat Médical");
  const [patient, setPatient] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !notes) return;
    const newLetter = {
      id: letters.length + 1,
      type,
      patient,
      date: new Date().toISOString().split('T')[0],
      notes
    };
    setLetters([newLetter, ...letters]);
    setPreview(newLetter);
    setNotes("");
  };

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          Rédaction de Courriers & Bilans de Sortie
        </h2>
        <p className="text-xs text-slate-500">Générez des certificats d'arrêt, lettres de liaison d'orientation ou certificats de bonne santé</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-slate-700" /> Nouveau Courrier Médical
          </h3>
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type de Document</label>
              <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium" value={type} onChange={e => setType(e.target.value)}>
                <option value="Certificat Médical">Certificat Médical d'Aptitude / Arrêt</option>
                <option value="Lettre d'Orientation">Lettre d'Orientation de Liaison</option>
                <option value="Certificat de Bonne Santé">Certificat de Bonne Santé Globale</option>
                <option value="Compte Rendu Opératoire">Compte Rendu d'Intervention</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient Associé</label>
              <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" value={patient} onChange={e => setPatient(e.target.value)}>
                <option value="">-- Choisir un Patient --</option>
                {partners.map((p, idx) => (
                  <option key={`partner-dis-${p.id}-${idx}`} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Observations cliniques & Mentions</label>
              <textarea 
                rows={4}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                placeholder="Ex : Arrêt de travail prescrit de 5 jours à compter du... suite à une angine bactérienne."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg font-bold transition flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Générer & Imprimer
            </button>
          </form>
        </div>

        {/* Aperçu PDF du Courrier */}
        <div id="medical-letter-preview-card" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs min-h-[350px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400">Aperçu du Courrier Hospitalier</span>
                <h4 className="text-sm font-bold text-slate-800">{preview ? preview.type : "Aucun document sélectionné"}</h4>
              </div>
              {preview && (
                <button onClick={() => printDocumentById('medical-letter-preview-card', `Courrier_${preview.type.replace(/\s+/g, '_')}`)} className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Imprimer
                </button>
              )}
            </div>

            {preview ? (
              <div className="space-y-4 text-xs font-serif p-4 bg-slate-50/50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                <div className="text-right text-[10px] text-slate-400">Fait à Conakry, le {preview.date}</div>
                <div className="font-bold border-b pb-1">CENTRE MÉDICAL ET CLINIQUE HIS</div>
                <p><strong>Concerne : </strong> M./Mme {preview.patient}</p>
                <p className="indent-4 whitespace-pre-wrap">{preview.notes}</p>
                <div className="pt-8 text-right font-sans">
                  <p className="font-bold text-[10px] text-slate-400">Le Médecin de Garde</p>
                  <p className="font-extrabold text-slate-800 underline mt-1">Dr. Aboubacar Touré</p>
                </div>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 italic text-xs">
                Remplissez le formulaire de gauche et cliquez sur "Générer" pour visualiser le courrier médical à en-tête.
              </div>
            )}
          </div>
          
          {letters.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Derniers documents émis</span>
              <div className="flex flex-wrap gap-2">
                {letters.map(l => (
                  <button 
                    key={l.id} 
                    onClick={() => setPreview(l)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold rounded-lg text-slate-700"
                  >
                    {l.type} - {l.patient}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. PLAN DE SOINS (CARE PLANS) - Re-exported from dedicated modern component
export { CarePlansView } from './CarePlansView';

// 5. TRANSMISSIONS CIBLÉES (HANDOVER LOGS)
export const TransmissionsView: React.FC<SihViewProps> = () => {
  const [logs, setLogs] = useState([
    { id: 1, nurse: "Awa Diabate", patient: "Abdourahmane Diallo", time: "08:15", type: "Alerte Clinique", content: "Patient agité en fin de nuit, pic hypertensif à 17/10 à 05h00. Évaluation par le médecin recommandée au premier passage." },
    { id: 2, nurse: "Awa Diabate", patient: "Sékou Touré", time: "09:00", type: "Transmission Routinière", content: "Sonde urinaire en place, diurèse à 1200ml sur la vacation. Apyréthique, pansement sec." }
  ]);

  const [patient, setPatient] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("Transmission Routinière");

  const handlePostLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !content) return;
    const newLog = {
      id: logs.length + 1,
      nurse: "Awa Diabate (Moi)",
      patient,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type,
      content
    };
    setLogs([newLog, ...logs]);
    setPatient("");
    setContent("");
  };

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-700" />
          Transmissions Ciblées & Cahier de Liaison (Liaison Soignante)
        </h2>
        <p className="text-xs text-slate-500">Transmettez les informations médicales critiques entre les équipes de jour et de garde</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Ajouter une note */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Insérer une Transmission</h3>
          <form onSubmit={handlePostLog} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient</label>
              <input type="text" placeholder="Ex : M. Diallo (Lit A1)" className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" value={patient} onChange={e => setPatient(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type de transmission</label>
              <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" value={type} onChange={e => setType(e.target.value)}>
                <option value="Transmission Routinière">Transmission Routinière</option>
                <option value="Alerte Clinique">Alerte Clinique / Vigilance</option>
                <option value="Urgence Médicale">Urgence Médicale</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contenu de la transmission</label>
              <textarea rows={3} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="Décrivez l'état clinique du patient..." value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg font-bold transition">
              Enregistrer la note
            </button>
          </form>
        </div>

        {/* Historique des transmissions */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes récentes sur les dossiers</h3>
          {logs.map((log) => (
            <div key={log.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs hover:border-slate-300 transition">
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-slate-900">{log.patient}</h4>
                  <p className="text-[10px] text-slate-400">Écrit par <strong>{log.nurse}</strong> à {log.time}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                  log.type === 'Urgence Médicale' ? 'bg-rose-100 text-rose-800' :
                  log.type === 'Alerte Clinique' ? 'bg-amber-100 text-amber-800' :
                  'bg-indigo-100 text-indigo-800'
                }`}>{log.type}</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-xs">{log.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. PLANNING DES ÉQUIPES (NURSE SCHEDULE)
export const NurseScheduleView: React.FC<SihViewProps> = () => {
  const [schedule] = useState([
    { name: "Awa Diabate (Infirmière)", mon: "Matin", tue: "Matin", wed: "Repos", thu: "Garde Nuit", fri: "Repos", sat: "Matin", sun: "Repos" },
    { name: "Dr. Aboubacar Touré (Médecin)", mon: "Journée", tue: "Journée", wed: "On Call", thu: "Journée", fri: "Journée", sat: "Repos", sun: "Repos" },
    { name: "Sékou Camara (Infirmier)", mon: "Après-midi", tue: "Après-midi", wed: "Matin", thu: "Repos", fri: "Matin", sat: "Repos", sun: "On Call" },
    { name: "Aïcha Diallo (Technicienne Labo)", mon: "Matin", tue: "Matin", wed: "Matin", thu: "Après-midi", fri: "Après-midi", sat: "On Call", sun: "Repos" }
  ]);

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-700" />
          Planning de Roulement des Équipes (Gardes & Astreintes)
        </h2>
        <p className="text-xs text-slate-500">Suivez les affectations des infirmiers et médecins par tranche horaire de rotation</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="p-4 font-extrabold text-slate-600">Intervenant</th>
              <th className="p-4 text-center">Lundi</th>
              <th className="p-4 text-center">Mardi</th>
              <th className="p-4 text-center">Mercredi</th>
              <th className="p-4 text-center">Jeudi</th>
              <th className="p-4 text-center">Vendredi</th>
              <th className="p-4 text-center">Samedi</th>
              <th className="p-4 text-center">Dimanche</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedule.map((staff, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40">
                <td className="p-4 font-extrabold text-slate-900">{staff.name}</td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 font-bold rounded-md">{staff.mon}</span></td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 font-bold rounded-md">{staff.tue}</span></td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-md">{staff.wed}</span></td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 font-bold rounded-md">{staff.thu}</span></td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 font-bold rounded-md">{staff.fri}</span></td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-amber-50 text-amber-700 font-bold rounded-md">{staff.sat}</span></td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-rose-50 text-rose-700 font-bold rounded-md">{staff.sun}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 7. SURGERY THEATER (BLOC OPÉRATOIRE)
export const SurgeryTheaterView: React.FC<SihViewProps> = () => {
  const [ops] = useState([
    { id: 1, patient: "Mamadou Sylla", operation: "Appendicectomie", surgeon: "Dr. Keita (Chirurgien)", room: "Salle d'opération 1", status: "Terminé", schedule: "08:30" },
    { id: 2, patient: "Fatoumata Mara", operation: "Césarienne d'urgence", surgeon: "Dr. Diallo (Obstétricien)", room: "Salle d'opération 2", status: "En cours", schedule: "11:00" },
    { id: 3, patient: "Sékou Touré", operation: "Laparotomie exploratrice", surgeon: "Dr. Keita (Chirurgien)", room: "Salle d'opération 1", status: "Programmé", schedule: "14:30" }
  ]);

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-700" />
          Planning du Bloc Opératoire & Programmation
        </h2>
        <p className="text-xs text-slate-500">Planifiez les chirurgies, affectez les anesthésistes et tracez la check-list OMS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ops.map(op => (
          <div key={op.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wide">{op.room}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                op.status === "Terminé" ? "bg-emerald-100 text-emerald-800" :
                op.status === "En cours" ? "bg-rose-100 text-rose-800 animate-pulse" :
                "bg-blue-100 text-blue-800"
              }`}>{op.status}</span>
            </div>
            <div>
              <p className="text-base font-black text-slate-900">{op.operation}</p>
              <p className="font-semibold text-slate-600 mt-1">Patient: {op.patient}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Chirurgien : {op.surgeon}</p>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-bold text-slate-800">Heure : {op.schedule}</span>
              <span>Bloc Opératoire Central</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 8. IMAGING PACS (IMAGERIE MÉDICALE)
export const ImagingPacsView: React.FC<SihViewProps> = () => {
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [negative, setNegative] = useState(false);
  const [selectedImage, setSelectedImage] = useState("chest_xray");

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Microscope className="w-5 h-5 text-slate-700" />
          Poste PACS / DICOM d'Imagerie Médicale (Radio & Écho)
        </h2>
        <p className="text-xs text-slate-500">Visualisez et traitez numériquement les clichés radiographiques ou échographiques en réseau</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panneau de réglages */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Outils DICOM</h3>
          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1">Sélectionner Cliché</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" value={selectedImage} onChange={e => setSelectedImage(e.target.value)}>
                <option value="chest_xray">Radio Thoracique - M. Sow</option>
                <option value="brain_mri">IRM Cérébrale - Mme Diallo</option>
                <option value="fracture">Radiographie Tibiale - M. Condé</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Contraste</span>
                <span>{contrast}%</span>
              </div>
              <input type="range" min="50" max="200" className="w-full" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Luminosité</span>
                <span>{brightness}%</span>
              </div>
              <input type="range" min="50" max="200" className="w-full" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
            </div>
            <button 
              onClick={() => setNegative(!negative)} 
              className={`w-full py-2 border font-bold rounded-lg transition ${
                negative ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Mode Négatif d'Examen
            </button>
            <button onClick={() => { setContrast(100); setBrightness(100); setNegative(false); }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-[11px]">
              Réinitialiser les Filtres
            </button>
          </div>
        </div>

        {/* Visualiseur radiographique simulé */}
        <div className="lg:col-span-2 bg-black rounded-xl border border-slate-800 p-4 flex flex-col justify-between min-h-[350px]">
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>ID: DICOM_2026_0914_004</span>
            <span>HIS-LIMS PRO CONAKRY</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4">
            {selectedImage === 'chest_xray' ? (
              <div 
                className="w-48 h-48 bg-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{
                  filter: `contrast(${contrast}%) brightness(${brightness}%) ${negative ? 'invert(1)' : 'none'}`,
                  backgroundImage: `radial-gradient(circle, #555 10%, transparent 80%)`
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <div className="w-16 h-24 border-2 border-white/20 rounded-full flex justify-between px-2 py-1 rotate-12">
                    <div className="w-0.5 h-full bg-white/10" />
                    <div className="w-0.5 h-full bg-white/10" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 mt-2">Cliché Thoracique</span>
                </div>
              </div>
            ) : selectedImage === 'brain_mri' ? (
              <div 
                className="w-48 h-48 bg-zinc-900 rounded-full flex items-center justify-center relative"
                style={{
                  filter: `contrast(${contrast}%) brightness(${brightness}%) ${negative ? 'invert(1)' : 'none'}`,
                  boxShadow: '0 0 40px rgba(255,255,255,0.1) inset'
                }}
              >
                <div className="w-32 h-32 border border-dashed border-zinc-600 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-zinc-800/80 rounded-full flex items-center justify-center border-2 border-zinc-700">
                    <span className="text-[9px] font-mono text-zinc-500">Cortex</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="w-48 h-48 bg-zinc-900 rounded-lg flex items-center justify-center relative"
                style={{
                  filter: `contrast(${contrast}%) brightness(${brightness}%) ${negative ? 'invert(1)' : 'none'}`
                }}
              >
                <div className="w-2 h-36 bg-zinc-200 rotate-45 relative rounded-full flex items-center justify-center shadow-md">
                  <div className="absolute w-3 h-0.5 bg-black/40 rotate-12" />
                </div>
                <span className="absolute bottom-2 text-[9px] text-zinc-400 font-mono">Fissure Tibiale</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end border-t border-zinc-900 pt-3 text-[10px] text-zinc-500">
            <span>Patient: MAMADOU SOW • ECG/Radio</span>
            <span>Rapport d'Imagerie Validé par Radiologue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 9. PHARMACY DISPENSING (PHARMACIE & DISPENSATION)
export const PharmacyDispensingView: React.FC<SihViewProps> = () => {
  const [inventory, setInventory] = useState([
    { id: 1, name: "Amoxicilline 500mg Gélule", category: "Antibiotique", stock: 154, price: 12000, threshold: 50 },
    { id: 2, name: "Paracétamol 1g Comprimé", category: "Antalgique", stock: 450, price: 3000, threshold: 100 },
    { id: 3, name: "Ceftriaxone 1g Injectable", category: "Antibiotique injectable", stock: 12, price: 45000, threshold: 20 },
    { id: 4, name: "Ventoline Nébuliseur", category: "Bronchodilatateur", stock: 85, price: 25000, threshold: 15 }
  ]);

  const handleDispense = (id: number) => {
    setInventory(inventory.map(item => {
      if (item.id === id && item.stock > 0) {
        return { ...item, stock: item.stock - 1 };
      }
      return item;
    }));
  };

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-slate-700" />
          Pharmacie Hospitalière & Dispensation des Prescriptions
        </h2>
        <p className="text-xs text-slate-500">Gérez le stock de pharmacie, vérifiez les ordonnances électroniques des médecins et dispensez</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 overflow-x-auto">
          <table className="w-full text-left bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="p-4">Médicament</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4 text-center">Stock Actuel</th>
                <th className="p-4 text-right">Prix Unitaire</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="p-4 font-extrabold text-slate-900">{item.name}</td>
                  <td className="p-4 text-slate-500 font-semibold">{item.category}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md font-extrabold ${
                      item.stock <= item.threshold ? 'bg-rose-50 text-rose-700 font-black border border-rose-200' : 'bg-slate-100 text-slate-700'
                    }`}>{item.stock}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">{item.price.toLocaleString('fr-FR')} GN</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleDispense(item.id)}
                      disabled={item.stock === 0}
                      className="px-2.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 font-bold rounded-lg transition"
                    >
                      Délivrer 1
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alertes pharmacie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-slate-700" /> Alertes Rupture
          </h3>
          <div className="space-y-3">
            {inventory.filter(i => i.stock <= i.threshold).map(item => (
              <div key={item.id} className="p-3 bg-rose-50/40 border border-rose-100 rounded-lg text-xs flex gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-950">{item.name}</p>
                  <p className="text-[10px] text-rose-800 mt-0.5">Seuil critique atteint ! Reste uniquement {item.stock} unités.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 10. STERILIZATION LOG (STÉRILISATION)
export const SterilizationLogView: React.FC<SihViewProps> = () => {
  const [cycles, setCycles] = useState([
    { id: "CYC-098", autoclave: "Autoclave Alpha", temp: "134°C", pressure: "2.1 bar", duration: "18 min", status: "Certifié conforme", operator: "S. Camara", date: "2026-09-14" },
    { id: "CYC-097", autoclave: "Autoclave Beta", temp: "121°C", pressure: "1.2 bar", duration: "30 min", status: "Certifié conforme", operator: "S. Camara", date: "2026-09-14" }
  ]);

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-slate-700" />
          Registre de Stérilisation et Matériovigilance
        </h2>
        <p className="text-xs text-slate-500">Tracez les cycles d'autoclave pour garantir l'hygiène biologique totale du matériel opératoire</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cycles d'Autoclave récents</h3>
          {cycles.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">{c.id}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[9px] tracking-wider uppercase">{c.status}</span>
                </div>
                <p className="font-semibold text-slate-600">{c.autoclave} • {c.operator}</p>
                <div className="flex gap-4 text-[10px] text-slate-400 font-mono mt-1">
                  <span>Temp: {c.temp}</span>
                  <span>Pres: {c.pressure}</span>
                  <span>Durée: {c.duration}</span>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-400">
                {c.date}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Saisir un cycle</h3>
          <form onSubmit={e => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Équipement</label>
              <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50">
                <option>Autoclave Alpha (134°C)</option>
                <option>Autoclave Beta (121°C)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pression (bar)</label>
                <input type="text" defaultValue="2.1" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-center font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Durée (min)</label>
                <input type="text" defaultValue="18" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-center font-mono" />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg font-bold transition">
              Enregistrer & Certifier
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// 11. QUALITY & VIGILANCE (QUALITÉ & VIGILANCE)
export const QualityVigilanceView: React.FC<SihViewProps> = () => {
  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-slate-700" />
          Indicateurs de Qualité, Identitovigilance & Démarche Qualité
        </h2>
        <p className="text-xs text-slate-500">Pilotez les taux de satisfaction, le respect des délais de rendu et la pharmacovigilance hospitalière</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Identitovigilance</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">99.8%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Zéro erreur de dossier patient</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Respect Délai Rendu (TAT)</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">94.5%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Objectif minimum : 90.0%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Infection Nosocomiale</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">0.12%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Taux de prévalence annuel</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Satisfaction Patients</span>
          <p className="text-2xl font-black text-pink-600 mt-1">4.7 / 5</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sur 154 avis recueillis</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Protocole Général de Double Contrôle des Identités</h3>
        <p className="text-slate-600 leading-relaxed">
          Pour assurer une identitovigilance irréprochable au sein de notre établissement, chaque intervenant (Admissions, Infirmiers, Médecins, Techniciens) s'engage à exiger l'expression verbale du Nom, Prénom, et date de naissance du patient avant tout acte ou administration de médicament, et de corroborer ces données avec le bracelet ou l'identifiant électronique unique figurant sur le dossier informatique.
        </p>
      </div>
    </div>
  );
};

// 12. RESOURCES HUMAINES (HR MANAGEMENT)
export const HrManagementView: React.FC<SihViewProps> = () => {
  const [employees] = useState([
    { id: 1, name: "Dr. Aboubacar Touré", role: "Médecin Chef", dept: "Médecine Interne", status: "Actif" },
    { id: 2, name: "Awa Diabate", role: "Infirmière Superviseuse", dept: "Soins & Triage", status: "Actif" },
    { id: 3, name: "Sékou Camara", role: "Infirmier Coordinateur", dept: "Urgence", status: "Actif" },
    { id: 4, name: "Dr. Fodé Keita", role: "Pédiatre de Garde", dept: "Pédiatrie", status: "En congé" }
  ]);

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-slate-700" />
          Ressources Humaines & Gestion des Contrats (RH)
        </h2>
        <p className="text-xs text-slate-500">Suivez le registre du personnel médical, l'état d'activité et la conformité administrative</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 overflow-x-auto">
          <table className="w-full text-left bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="p-4">Collaborateur</th>
                <th className="p-4">Rôle / Poste</th>
                <th className="p-4">Département</th>
                <th className="p-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/30">
                  <td className="p-4 font-extrabold text-slate-900">{emp.name}</td>
                  <td className="p-4 text-slate-600 font-semibold">{emp.role}</td>
                  <td className="p-4 text-slate-500">{emp.dept}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      emp.status === "Actif" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>{emp.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ajouter un Collaborateur</h3>
          <form onSubmit={e => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom Complet</label>
              <input type="text" placeholder="Ex: Dr. Diallo" className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Poste / Rôle</label>
              <input type="text" placeholder="Ex: Cardiologue" className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg font-bold transition">
              Enregistrer le dossier RH
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
