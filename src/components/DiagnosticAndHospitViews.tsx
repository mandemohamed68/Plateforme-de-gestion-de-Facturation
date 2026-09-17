import React, { useState } from 'react';
import {
  FlaskConical,
  Microscope,
  Bed,
  Radio,
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertTriangle,
  Plus,
  Users,
  Search,
  Eye,
  ArrowRight,
  X,
  Check,
  Heart,
  Activity,
  Stethoscope,
  Lock,
  LogOut,
  ShieldCheck,
  CreditCard,
  UserPlus,
  Filter,
  SlidersHorizontal,
  User,
  AlertCircle
} from 'lucide-react';
import {
  ResPartner,
  LabExamOrder,
  CompanySettings,
  ResUser,
  AppView,
  MedicalConsultation
} from '../types';
import { formatFCFA } from '../lib/formatters';
import { printDocumentById } from '../lib/printUtils';

interface DiagnosticHospitProps {
  currentView: AppView;
  partners: ResPartner[];
  consultations?: MedicalConsultation[];
  labOrders?: LabExamOrder[];
  company?: CompanySettings;
  currentUser: ResUser | null;
  onNavigateToView: (view: AppView) => void;
  onRefreshData?: () => Promise<void>;
}

// -------------------------------------------------------------
// 1. LABORATOIRE WORKSPACES (Dedicated List Views)
// -------------------------------------------------------------

export const LaboQueueTableView: React.FC<DiagnosticHospitProps> = ({
  partners,
  labOrders = [],
  onNavigateToView,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [samplingOrder, setSamplingOrder] = useState<LabExamOrder | null>(null);
  const [tubeCode, setTubeCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Orders awaiting sampling or in progress
  const queueOrders = labOrders.filter((o) => {
    const isPending = o.status === 'pending_sampling' || o.status === 'in_progress' || o.status === 'draft';
    if (!isPending) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (o.order_number && o.order_number.toLowerCase().includes(s)) ||
      (o.partner_name && o.partner_name.toLowerCase().includes(s)) ||
      (o.exam_names && o.exam_names.some((e) => e.toLowerCase().includes(s)))
    );
  });

  const handleOpenSampling = (order: LabExamOrder) => {
    setSamplingOrder(order);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    setTubeCode(`TB-${dateStr}-${order.id}`);
  };

  const handleConfirmSampling = async () => {
    if (!samplingOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lab-orders/${samplingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          statut_workflow: 'preleve',
          sampling_date: new Date().toISOString(),
          code_tube_primaire: tubeCode,
        }),
      });
      if (res.ok) {
        if (onRefreshData) await onRefreshData();
        setSamplingOrder(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sampling Modal */}
      {samplingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-slate-700" />
                Validation du Prélèvement Biologique
              </h3>
              <button onClick={() => setSamplingOrder(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Patient : </span>
                <span className="font-bold text-slate-900">{samplingOrder.partner_name}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Bon d'Analyse : </span>
                <span className="font-mono font-bold text-slate-900">{samplingOrder.order_number}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Examens : </span>
                <span>{samplingOrder.exam_names?.join(', ') || 'Analyses standard'}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-bold text-slate-700">Code Barres / Identifiant Tube Primaire</label>
              <input
                type="text"
                value={tubeCode}
                onChange={(e) => setTubeCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSamplingOrder(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                disabled={loading}
                onClick={handleConfirmSampling}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Valider le Prélèvement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-slate-700" />
            File d'Attente des Prélèvements - Laboratoire
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accueil des patients munis d'un bon d'analyse validé pour prélèvement biologique et étiquetage des tubes
          </p>
        </div>
        <button
          onClick={() => onNavigateToView('labo_sampling')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Bon de Prélèvement</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {queueOrders.length} Bon{queueOrders.length > 1 ? 's' : ''} en attente de prélèvement
          </span>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher bon, patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Bon Labo</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Analyses Demandées</th>
                <th className="py-2.5 px-4">Prescripteur</th>
                <th className="py-2.5 px-4">Statut Quittance</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queueOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun patient en attente de prélèvement biologique.
                  </td>
                </tr>
              ) : (
                queueOrders.map((row) => {
                  const partner = partners.find((p) => p.id === row.partner_id);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {row.order_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.partner_name}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {partner?.ndm || `NDM-${row.partner_id}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-sm truncate">
                        {row.exam_names?.join(', ') || 'Analyses standard'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.prescribing_doctor || 'Dr. Aboubacar Toure'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {row.invoice_id ? 'Réglé Caisse' : 'Prise en charge OK'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenSampling(row)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                        >
                          Prélever
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const LaboInProgressTableView: React.FC<DiagnosticHospitProps> = ({
  labOrders = [],
  onNavigateToView,
}) => {
  const inProgressList = labOrders.filter(
    (o) => o.status === 'in_progress' || o.status === 'accepted' || o.status === 'pending_validation'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-slate-700" />
            Analyses Biologiques en Cours sur Automates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Worklist technique : séries d'hématologie, biochimie et immunologie en cours d'exécution
          </p>
        </div>
        <button
          onClick={() => onNavigateToView('labo_results')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
        >
          Saisie & Validation des Résultats
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {inProgressList.length} Séries analytiques en cours
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Code Tube / Bon</th>
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-4">Paramètre / Bilan</th>
                <th className="py-2.5 px-4">Département</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inProgressList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucune série en cours sur les automates.
                  </td>
                </tr>
              ) : (
                inProgressList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {(row as any).code_tube_primaire || row.order_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.partner_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">
                      {row.exam_names?.join(', ') || 'Bilan biologique'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {row.department || 'Biochimie & Hématologie'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {row.status === 'in_progress' ? 'En cours' : 'Prêt pour saisie'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateToView('labo_results')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                      >
                        Résultats
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. IMAGERIE WORKSPACES (Dedicated List Views)
// -------------------------------------------------------------

export const ImagerieQueueTableView: React.FC<DiagnosticHospitProps> = ({
  partners,
  consultations = [],
  onNavigateToView,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-slate-700" />
            File d'Attente - Imagerie Médicale & Radiologie
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            File active des patients en attente de réalisation de clichés : Radiographie, Échographie, Scanner
          </p>
        </div>
        <button
          onClick={() => onNavigateToView('imaging_pacs')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
        >
          <span>Visualiseur PACS DICOM</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Patients enregistrés en salle d'imagerie
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Examen Prescrit</th>
                <th className="py-2.5 px-4">Médecin Prescripteur</th>
                <th className="py-2.5 px-4">Salle & Équipement</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { patient: 'Kadiatou Camara', ndm: 'NDM-0078', exam: 'Radiographie Thorax Face', doctor: 'Dr. Toure', salle: 'Salle Radio 1 (Numérique)' },
                { patient: 'Ibrahima Diallo', ndm: 'NDM-0082', exam: 'Échographie Abdomino-pelvienne', doctor: 'Dr. Koné', salle: 'Salle Échographie 2' },
                { patient: 'Mamadou Sow', ndm: 'NDM-0081', exam: 'Scanner Cérébral sans injection', doctor: 'Dr. Toure', salle: 'Salle Scanner 16 coupes' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.patient}
                    <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.exam}</td>
                  <td className="py-3 px-4 text-slate-600">{row.doctor}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{row.salle}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToView('imaging_pacs')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                    >
                      Acquérir Cliché
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

export const ImagerieScheduledTableView: React.FC<DiagnosticHospitProps> = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            Planning des Examens d'Imagerie Programmés
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Créneaux réservés avec préparation spécifique (jeûne, produit de contraste)
          </p>
        </div>
        <button
          onClick={() => printDocumentById('imaging-schedule-container', 'Planning_Examens_Imagerie')}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Imprimer Planning</span>
        </button>
      </div>

      <div id="imaging-schedule-container" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Examens programmés de la journée
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Heure</th>
                <th className="py-2.5 px-4">Patient / Contact</th>
                <th className="py-2.5 px-4">Modalité & Examen</th>
                <th className="py-2.5 px-4">Préparation Spécifique</th>
                <th className="py-2.5 px-4">Opérateur</th>
                <th className="py-2.5 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { heure: '10:30', patient: 'Touré Fanta', contact: '07 08 12 34', exam: 'Scanner Rachis Lombaire', prep: 'Bilan créat OK, à jeun 4h', manip: 'Manip. Kouassi', statut: 'Confirmé' },
                { heure: '11:15', patient: 'Soro Alassane', contact: '05 44 22 11', exam: 'Écho-Doppler des Membres Inférieurs', prep: 'Sans préparation', manip: 'Dr. Radiologue', statut: 'Confirmé' },
                { heure: '14:00', patient: 'Kouadio Germain', contact: '01 02 03 04', exam: 'Urographie Intraveineuse (UIV)', prep: 'Préparation colique', manip: 'Manip. Kouassi', statut: 'En attente' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.heure}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.patient}
                    <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.contact}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.exam}</td>
                  <td className="py-3 px-4 text-slate-700">{row.prep}</td>
                  <td className="py-3 px-4 text-slate-600">{row.manip}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {row.statut}
                    </span>
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

export const ImagerieReportsTableView: React.FC<DiagnosticHospitProps> = ({
  onNavigateToView,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            Comptes-Rendus Radiologiques Structurés
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rédaction, validation médicale et impression des comptes-rendus d'imagerie
          </p>
        </div>
      </div>

      <div id="imaging-results-container" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registre des comptes-rendus
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Examen Réalisé</th>
                <th className="py-2.5 px-4">Conclusion Clinique</th>
                <th className="py-2.5 px-4">Statut Validation</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { date: '15/09/2026', patient: 'Kadiatou Camara', ndm: 'NDM-0078', exam: 'Radiographie Thorax Face', concl: 'Absence de foyer de condensation parenchymateuse. Silhouette cardiaque normale.', statut: 'Validé & Signé' },
                { date: '15/09/2026', patient: 'Mamadou Sow', ndm: 'NDM-0081', exam: 'Scanner Cérébral sans injection', concl: 'Absence d\'hémorragie intracrânienne aiguë ni d\'effet de masse.', statut: 'En attente signature' },
                { date: '14/09/2026', patient: 'Diallo Oumar', ndm: 'NDM-0092', exam: 'Échographie Abdominale', concl: 'Stéatose hépatique diffuse modérée sans anomalie focale.', statut: 'Validé & Signé' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{row.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.patient}
                    <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.exam}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-sm truncate">{row.concl}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      row.statut.includes('Validé')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onNavigateToView('imaging_pacs')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200"
                    >
                      Images DICOM
                    </button>
                    <button
                      onClick={() => printDocumentById('imaging-results-container', 'Compte_Rendu_Imagerie')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3 text-slate-300" />
                      <span>Imprimer CR</span>
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

export const ImageriePrescriptionsTableView: React.FC<DiagnosticHospitProps> = ({
  partners,
  consultations = [],
  company,
  currentUser,
  onNavigateToView,
}) => {
  // Extract initial imaging prescriptions from consultations if available
  const initialPrescriptions = React.useMemo(() => {
    const list: Array<{
      id: string;
      order_number: string;
      date: string;
      patient_id: number;
      patient_name: string;
      patient_ndm: string;
      patient_age?: string;
      patient_gender?: string;
      doctor_name: string;
      department: string;
      modality: 'RX' | 'ECHO' | 'TDM' | 'IRM' | 'MAMMO' | 'DOPPLER';
      exam_name: string;
      clinical_indication: string;
      priority: 'urgent' | 'priority' | 'routine';
      precautions: string;
      status: 'pending' | 'in_progress' | 'completed' | 'validated';
      estimated_price: number;
      consultation_id?: number;
    }> = [];

    // Harvest from real consultations
    consultations.forEach((c, idx) => {
      const imgItems = (c.prescribed_items || []).filter(
        (i) => i.type === 'imaging' || i.name?.toLowerCase().includes('radio') || i.name?.toLowerCase().includes('écho') || i.name?.toLowerCase().includes('scanner')
      );
      imgItems.forEach((item, itemIdx) => {
        let modality: 'RX' | 'ECHO' | 'TDM' | 'IRM' | 'MAMMO' | 'DOPPLER' = 'RX';
        const nameLow = item.name.toLowerCase();
        if (nameLow.includes('écho') || nameLow.includes('echo')) modality = 'ECHO';
        else if (nameLow.includes('scanner') || nameLow.includes('tdm')) modality = 'TDM';
        else if (nameLow.includes('irm')) modality = 'IRM';
        else if (nameLow.includes('mammo')) modality = 'MAMMO';
        else if (nameLow.includes('doppler')) modality = 'DOPPLER';

        list.push({
          id: `IMG-PR-${c.id}-${itemIdx}`,
          order_number: `DEM-RAD-${1000 + c.id * 10 + itemIdx}`,
          date: new Date(c.consultation_date || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          patient_id: c.partner_id,
          patient_name: c.patient_name,
          patient_ndm: c.patient_ndm || `NDM-00${c.partner_id}`,
          patient_age: '38 ans',
          patient_gender: 'M',
          doctor_name: c.doctor_name || 'Dr. Praticien',
          department: 'Consultation Externe',
          modality,
          exam_name: item.name,
          clinical_indication: c.diagnosis || c.chief_complaint || 'Bilan clinique d\'exploration',
          priority: (c as any).urgency_level === 'high' ? 'urgent' : 'routine',
          precautions: item.instructions || 'Sans contre-indication notée',
          status: 'pending',
          estimated_price: item.unit_price || 25000,
          consultation_id: c.id,
        });
      });
    });

    // Default reference records if few consultations exist
    if (list.length < 4) {
      list.push(
        {
          id: 'IMG-PR-001',
          order_number: 'DEM-RAD-2026-089',
          date: '17/09/2026 09:15',
          patient_id: 1,
          patient_name: 'Kadiatou Camara',
          patient_ndm: 'NDM-0078',
          patient_age: '34 ans',
          patient_gender: 'F',
          doctor_name: 'Dr. Toure',
          department: 'Urgences Médico-Chirurgicales',
          modality: 'RX',
          exam_name: 'Radiographie Thorax Face et Profil',
          clinical_indication: 'Toux fébrile persistante depuis 5 jours, suspicion foyer infectieux pulmonaire.',
          priority: 'urgent',
          precautions: 'Test grossesse négatif, patiente ambulatoire.',
          status: 'pending',
          estimated_price: 18000,
        },
        {
          id: 'IMG-PR-002',
          order_number: 'DEM-RAD-2026-090',
          date: '17/09/2026 09:45',
          patient_id: 2,
          patient_name: 'Ibrahima Diallo',
          patient_ndm: 'NDM-0082',
          patient_age: '52 ans',
          patient_gender: 'M',
          doctor_name: 'Dr. Koné',
          department: 'Médecine Générale',
          modality: 'ECHO',
          exam_name: 'Échographie Abdomino-Pelvienne Complète',
          clinical_indication: 'Douleurs épigastriques récurrentes post-prandiales, suspicion lithiase vésiculaire.',
          priority: 'routine',
          precautions: 'À jeun depuis 6 heures.',
          status: 'in_progress',
          estimated_price: 25000,
        },
        {
          id: 'IMG-PR-003',
          order_number: 'DEM-RAD-2026-091',
          date: '17/09/2026 10:20',
          patient_id: 3,
          patient_name: 'Mamadou Sow',
          patient_ndm: 'NDM-0081',
          patient_age: '64 ans',
          patient_gender: 'M',
          doctor_name: 'Dr. Toure',
          department: 'Neurologie / Urgences',
          modality: 'TDM',
          exam_name: 'Scanner Cérébral (TDM) sans et avec injection',
          clinical_indication: 'Céphalées brutales avec déficit sensitivo-moteur hémi-corporel gauche transitoire.',
          priority: 'urgent',
          precautions: 'Clairance créat 85 ml/min (OK). Absence allergie iode.',
          status: 'completed',
          estimated_price: 65000,
        },
        {
          id: 'IMG-PR-004',
          order_number: 'DEM-RAD-2026-092',
          date: '16/09/2026 15:30',
          patient_id: 4,
          patient_name: 'Touré Fanta',
          patient_ndm: 'NDM-0044',
          patient_age: '46 ans',
          patient_gender: 'F',
          doctor_name: 'Dr. Bamba',
          department: 'Gynécologie',
          modality: 'MAMMO',
          exam_name: 'Mammographie Numérique Bilatérale + Écho Mammaire',
          clinical_indication: 'Dépistage individuel, nodule palpé quadrant supéro-externe droit.',
          priority: 'priority',
          precautions: 'Clichés antérieurs disponibles dans le PACS.',
          status: 'validated',
          estimated_price: 35000,
        },
        {
          id: 'IMG-PR-005',
          order_number: 'DEM-RAD-2026-093',
          date: '16/09/2026 11:10',
          patient_id: 5,
          patient_name: 'Soro Alassane',
          patient_ndm: 'NDM-0055',
          patient_age: '58 ans',
          patient_gender: 'M',
          doctor_name: 'Dr. Diop',
          department: 'Cardiologie',
          modality: 'DOPPLER',
          exam_name: 'Écho-Doppler Veineux des Membres Inférieurs',
          clinical_indication: 'Suspicion de thrombose veineuse profonde sur œdème unilatéral jambe gauche.',
          priority: 'urgent',
          precautions: 'Patient alité avec contention élastique.',
          status: 'pending',
          estimated_price: 30000,
        }
      );
    }

    return list;
  }, [consultations]);

  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  
  // Modals state
  const [selectedPrescription, setSelectedPrescription] = useState<typeof initialPrescriptions[0] | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // New Prescription Form State
  const [newPatientId, setNewPatientId] = useState<string>('');
  const [newDoctorName, setNewDoctorName] = useState<string>(currentUser?.name || 'Dr. Praticien');
  const [newDepartment, setNewDepartment] = useState<string>('Consultations Externes');
  const [newModality, setNewModality] = useState<'RX' | 'ECHO' | 'TDM' | 'IRM' | 'MAMMO' | 'DOPPLER'>('RX');
  const [newExamName, setNewExamName] = useState<string>('Radiographie Thorax Face');
  const [newIndication, setNewIndication] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'routine' | 'priority' | 'urgent'>('routine');
  const [newPrecautions, setNewPrecautions] = useState<string>('Sans contre-indication notée');
  const [newPrice, setNewPrice] = useState<number>(20000);

  // Common exam presets per modality
  const examPresets: Record<string, Array<{ name: string; price: number }>> = {
    RX: [
      { name: 'Radiographie Thorax Face', price: 15000 },
      { name: 'Radiographie Thorax Face et Profil', price: 18000 },
      { name: 'Radiographie Abdomen Sans Préparation (ASP)', price: 15000 },
      { name: 'Radiographie Rachis Cervical Face/Profil', price: 20000 },
      { name: 'Radiographie Rachis Lombaire Face/Profil', price: 22000 },
      { name: 'Radiographie Genou Face/Profil', price: 16000 },
      { name: 'Radiographie Bassin Face', price: 16000 },
    ],
    ECHO: [
      { name: 'Échographie Abdomino-Pelvienne', price: 25000 },
      { name: 'Échographie Abdominale Générale', price: 20000 },
      { name: 'Échographie Pelvienne / Obstétricale', price: 22000 },
      { name: 'Échographie Thyroïdienne', price: 25000 },
      { name: 'Échographie Rénale et Vésicale', price: 20000 },
    ],
    TDM: [
      { name: 'Scanner Cérébral sans injection', price: 55000 },
      { name: 'Scanner Cérébral avec injection (PDC)', price: 70000 },
      { name: 'Scanner Thoraco-Abdomino-Pelvien (TAP)', price: 120000 },
      { name: 'Scanner Rachis Lombaire', price: 65000 },
      { name: 'Angioscanner Thoracique (Embolie)', price: 85000 },
    ],
    IRM: [
      { name: 'IRM Cérébrale', price: 150000 },
      { name: 'IRM Médullaire / Rachis', price: 160000 },
      { name: 'IRM Articulaire Genou / Épaule', price: 140000 },
    ],
    MAMMO: [
      { name: 'Mammographie Numérique Bilatérale', price: 30000 },
      { name: 'Mammographie + Échographie Mammaire', price: 40000 },
    ],
    DOPPLER: [
      { name: 'Écho-Doppler Veineux Membres Inférieurs', price: 30000 },
      { name: 'Écho-Doppler Artériel Membres Inférieurs', price: 35000 },
      { name: 'Écho-Doppler des Troncs Supra-Aortiques (TSA)', price: 35000 },
    ],
  };

  // Filter logic
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_ndm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clinical_indication.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModality = selectedModality === 'all' || p.modality === selectedModality;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || p.priority === selectedPriority;

    return matchesSearch && matchesModality && matchesStatus && matchesPriority;
  });

  // Counters
  const totalCount = prescriptions.length;
  const pendingCount = prescriptions.filter((p) => p.status === 'pending').length;
  const inProgressCount = prescriptions.filter((p) => p.status === 'in_progress').length;
  const completedCount = prescriptions.filter((p) => p.status === 'completed' || p.status === 'validated').length;

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPartner = partners.find((p) => String(p.id) === String(newPatientId)) || partners[0];
    const newEntry = {
      id: `IMG-PR-${Date.now()}`,
      order_number: `DEM-RAD-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      patient_id: selectedPartner ? selectedPartner.id : 1,
      patient_name: selectedPartner ? selectedPartner.name : 'Nouveau Patient',
      patient_ndm: selectedPartner ? (selectedPartner.ndm || `NDM-00${selectedPartner.id}`) : 'NDM-0099',
      patient_age: '40 ans',
      patient_gender: 'M',
      doctor_name: newDoctorName || 'Dr. Praticien',
      department: newDepartment,
      modality: newModality,
      exam_name: newExamName,
      clinical_indication: newIndication || 'Exploration diagnostique sur prescription médicale',
      priority: newPriority,
      precautions: newPrecautions || 'Sans contre-indication notée',
      status: 'pending' as const,
      estimated_price: newPrice || 20000,
    };

    setPrescriptions((prev) => [newEntry, ...prev]);
    setShowNewModal(false);
    setStatusNotification({
      message: `Demande d'examen ${newEntry.order_number} pour ${newEntry.patient_name} enregistrée avec succès.`,
      type: 'success',
    });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleUpdateStatus = (id: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'validated') => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    if (selectedPrescription && selectedPrescription.id === id) {
      setSelectedPrescription((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    setStatusNotification({
      message: `Statut de la demande mis à jour : ${newStatus === 'in_progress' ? 'En cours de réalisation' : newStatus === 'completed' ? 'Clichés acquis' : 'Validé'}`,
      type: 'info',
    });
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const getModalityBadge = (modality: string) => {
    switch (modality) {
      case 'RX':
        return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold font-mono">RX • Radio</span>;
      case 'ECHO':
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold font-mono">US • Écho</span>;
      case 'TDM':
        return <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold font-mono">TDM • Scanner</span>;
      case 'IRM':
        return <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold font-mono">IRM • Résonance</span>;
      case 'MAMMO':
        return <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 text-[11px] font-bold font-mono">MAMMO • Sein</span>;
      case 'DOPPLER':
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold font-mono">DOPPLER • Vasculaire</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold font-mono">{modality}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>En attente</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>En cours / Salle</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3" />
            <span>Clichés Acquis</span>
          </span>
        );
      case 'validated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 text-white border border-slate-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>CR Validé & Signé</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Urgent</span>
          </span>
        );
      case 'priority':
        return (
          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max">
            <span>Prioritaire (24h)</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium uppercase tracking-wider w-max">
            Routine
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {statusNotification && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
          statusNotification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className={`w-4 h-4 ${statusNotification.type === 'success' ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span>{statusNotification.message}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Prescriptions & Demandes d'Examens d'Imagerie Médicale
            </h1>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              Pôle Imagerie & PACS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Centralisation des bons de prescription radiologique (Radio, Échographie, Scanner, IRM, Doppler), gestion des priorités et traçabilité de prise en charge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Demande d'Examen</span>
          </button>
          <button
            onClick={() => onNavigateToView('imaging_pacs')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Visualiseur PACS</span>
          </button>
          <button
            onClick={() => printDocumentById('imaging-prescriptions-table', 'Registre_Prescriptions_Imagerie')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer Registre</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Prescriptions</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
            <span>{totalCount} Demandes</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-amber-700 font-medium">En Attente de Réalisation</div>
          <div className="text-lg font-bold text-amber-900 mt-0.5 flex items-center justify-between">
            <span>{pendingCount}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-blue-700 font-medium">En Salle / En Cours</div>
          <div className="text-lg font-bold text-blue-900 mt-0.5 flex items-center justify-between">
            <span>{inProgressCount}</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-emerald-700 font-medium">Clichés Acquis & Validés</div>
          <div className="text-lg font-bold text-emerald-900 mt-0.5 flex items-center justify-between">
            <span>{completedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par patient, NDM, médecin, acte, n° de demande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 transition"
            />
          </div>

          {/* Status select */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente ({pendingCount})</option>
              <option value="in_progress">En cours / Salle ({inProgressCount})</option>
              <option value="completed">Clichés acquis</option>
              <option value="validated">Validé & Signé</option>
            </select>
          </div>

          {/* Priority select */}
          <div className="w-full md:w-40">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgent</option>
              <option value="priority">Prioritaire (24h)</option>
              <option value="routine">Routine</option>
            </select>
          </div>
        </div>

        {/* Modality Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Modalité :</span>
          {[
            { id: 'all', label: 'Toutes les modalités' },
            { id: 'RX', label: 'Radiographie (RX)' },
            { id: 'ECHO', label: 'Échographie (US)' },
            { id: 'TDM', label: 'Scanner (TDM)' },
            { id: 'IRM', label: 'IRM' },
            { id: 'MAMMO', label: 'Mammographie' },
            { id: 'DOPPLER', label: 'Écho-Doppler' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModality(m.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                selectedModality === m.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div id="imaging-prescriptions-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Liste des Prescriptions Médicales d'Imagerie
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {filteredPrescriptions.length} résultat{filteredPrescriptions.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3.5">N° Demande & Date</th>
                <th className="py-2.5 px-3.5">Patient / NDM</th>
                <th className="py-2.5 px-3.5">Modalité & Examen Demandé</th>
                <th className="py-2.5 px-3.5">Prescripteur & Service</th>
                <th className="py-2.5 px-3.5">Indication Clinique</th>
                <th className="py-2.5 px-3.5">Priorité</th>
                <th className="py-2.5 px-3.5">Statut</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Radio className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">Aucune prescription d'imagerie trouvée</p>
                      <p className="text-xs text-slate-500">
                        Modifiez vos critères de recherche ou enregistrez une nouvelle demande d'examen.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedModality('all');
                          setSelectedStatus('all');
                          setSelectedPriority('all');
                        }}
                        className="text-xs font-semibold text-slate-900 underline hover:text-slate-700 cursor-pointer pt-2"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-slate-900 font-mono text-[11px] block">
                        {row.order_number}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {row.date}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{row.patient_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                          {row.patient_ndm}
                        </span>
                        {row.patient_age && (
                          <span className="text-[11px] text-slate-500">
                            {row.patient_age} • {row.patient_gender}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="mb-1">{getModalityBadge(row.modality)}</div>
                      <div className="font-bold text-slate-900">{row.exam_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Tarif : {formatFCFA(row.estimated_price)}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-800">{row.doctor_name}</div>
                      <div className="text-[11px] text-slate-500">{row.department}</div>
                    </td>

                    <td className="py-3 px-3.5 max-w-xs">
                      <p className="text-slate-700 font-medium line-clamp-2 leading-relaxed" title={row.clinical_indication}>
                        {row.clinical_indication}
                      </p>
                      {row.precautions && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5 truncate">
                          Note : {row.precautions}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      {getPriorityBadge(row.priority)}
                    </td>

                    <td className="py-3 px-3.5">
                      {getStatusBadge(row.status)}
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPrescription(row)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-xs transition cursor-pointer shadow-2xs"
                          title="Consulter le bon de demande"
                        >
                          Fiche Demande
                        </button>
                        <button
                          onClick={() => {
                            if (row.status === 'pending') handleUpdateStatus(row.id, 'in_progress');
                            onNavigateToView('imaging_pacs');
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1"
                          title="Lancer l'acquisition sur le PACS"
                        >
                          <span>PACS</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
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

      {/* MODAL 1: Detail & Printing of Medical Prescription / Imaging Order */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Bon de Demande d'Examen d'Imagerie • {selectedPrescription.order_number}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Document officiel de prescription radiologique
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content */}
            <div id="imaging-order-printable" className="p-6 space-y-5 overflow-y-auto text-slate-900">
              {/* Clinic Header */}
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="font-black text-base uppercase text-slate-900">
                    {company?.name || 'CENTRE HOSPITALIER & D\'IMAGERIE MÉDICALE'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Service de Radiologie & Imagerie Diagnostique • Plateau Technique PACS
                  </p>
                  <p className="text-xs text-slate-500">
                    Tél : {company?.phone || '+225 27 22 00 00 00'} • {company?.email || 'imagerie@ch-medical.ci'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-200 rounded text-xs font-mono font-bold">
                    {selectedPrescription.order_number}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Émis le : {selectedPrescription.date}</p>
                </div>
              </div>

              {/* Patient and Doctor Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identité Patient</div>
                  <div className="font-bold text-sm text-slate-900">{selectedPrescription.patient_name}</div>
                  <div className="text-xs text-slate-600 font-mono">NDM : {selectedPrescription.patient_ndm}</div>
                  <div className="text-xs text-slate-500">{selectedPrescription.patient_age} • Sexe {selectedPrescription.patient_gender}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Médecin Prescripteur</div>
                  <div className="font-bold text-sm text-slate-900">{selectedPrescription.doctor_name}</div>
                  <div className="text-xs text-slate-600">Service : {selectedPrescription.department}</div>
                  <div className="text-xs text-slate-500">Degré d'urgence : {selectedPrescription.priority === 'urgent' ? 'URGENCE' : 'Routine'}</div>
                </div>
              </div>

              {/* Exam Requested */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Examen Radiologique Demandé
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getModalityBadge(selectedPrescription.modality)}
                    <span className="font-bold text-sm text-slate-900">{selectedPrescription.exam_name}</span>
                  </div>
                  <span className="font-bold text-xs font-mono text-slate-700">{formatFCFA(selectedPrescription.estimated_price)}</span>
                </div>
              </div>

              {/* Clinical Indication */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Renseignements Cliniques & Justification Médicale :
                </label>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {selectedPrescription.clinical_indication}
                </div>
              </div>

              {/* Precautions & Preparation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Consignes & Précautions Particulières :
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  {selectedPrescription.precautions}
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
                <div className="text-slate-500">
                  Statut : <strong className="text-slate-900">{selectedPrescription.status.toUpperCase()}</strong>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Signature & Cachet du Prescripteur :</div>
                  <div className="font-bold text-slate-900 mt-1">{selectedPrescription.doctor_name}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedPrescription.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPrescription.id, 'in_progress')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Prendre en Salle
                  </button>
                )}
                {selectedPrescription.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPrescription.id, 'completed')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Marquer Clichés Acquis
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printDocumentById('imaging-order-printable', `Bon_Demande_${selectedPrescription.order_number}`)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le Bon</span>
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Imaging Prescription */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Nouvelle Demande d'Examen d'Imagerie
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Prescription médicale d'acte radiologique
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="p-5 space-y-4 overflow-y-auto">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Bénéficiaire *
                </label>
                <select
                  required
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="">Sélectionnez un patient dans le dossier...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.ndm || `NDM-${p.id}`} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modality & Preset Exam Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Modalité d'Imagerie *
                  </label>
                  <select
                    value={newModality}
                    onChange={(e) => {
                      const mod = e.target.value as any;
                      setNewModality(mod);
                      const presets = examPresets[mod] || [];
                      if (presets.length > 0) {
                        setNewExamName(presets[0].name);
                        setNewPrice(presets[0].price);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    <option value="RX">Radiographie Standard (RX)</option>
                    <option value="ECHO">Échographie Générale (US)</option>
                    <option value="TDM">Scanner Tomodensitométrie (TDM)</option>
                    <option value="IRM">Imagerie par Résonance Magnétique (IRM)</option>
                    <option value="MAMMO">Mammographie Numérique</option>
                    <option value="DOPPLER">Écho-Doppler Vasculaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Degré d'Urgence *
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    <option value="routine">Routine (Programmé)</option>
                    <option value="priority">Prioritaire (Dans les 24h)</option>
                    <option value="urgent">Urgence Immédiate (Stat)</option>
                  </select>
                </div>
              </div>

              {/* Exam Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Libellé de l'Examen Demandé *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="Ex: Radiographie Thorax Face et Profil"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(examPresets[newModality] || []).slice(0, 3).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewExamName(preset.name);
                          setNewPrice(preset.price);
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tarif Estimé (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Prescriber & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Médecin Prescripteur
                  </label>
                  <input
                    type="text"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Service Demandeur
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Indication Clinique */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Indication Clinique & Suspicion Diagnostique *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newIndication}
                  onChange={(e) => setNewIndication(e.target.value)}
                  placeholder="Motif d'exploration, anamnèse, symptômes, antécédents pertinents..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Precautions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Précautions & Consignes Particulières
                </label>
                <input
                  type="text"
                  value={newPrecautions}
                  onChange={(e) => setNewPrecautions(e.target.value)}
                  placeholder="Ex: À jeun 6h, fonction rénale normale, sans allergie à l'iode..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la Demande</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 3. HOSPITALISATION WORKSPACES (Dedicated List Views)
// -------------------------------------------------------------

export const HospitAdmissionsTableView: React.FC<DiagnosticHospitProps> = ({
  partners,
  onNavigateToView,
}) => {
  const [admissions, setAdmissions] = useState([
    {
      id: 'ADM-2026-001',
      date: '15/09/2026 09:00',
      patient: 'Ouattara Drissa',
      ndm: 'NDM-0048',
      service: 'Médecine Interne',
      doc: 'Dr. Toure',
      motif: "Poussée d'insuffisance rénale aiguë",
      lit: 'Chambre 204 - Lit B',
      statut: 'En attente d\'entrée',
      priorite: 'Urgente',
    },
    {
      id: 'ADM-2026-002',
      date: '15/09/2026 10:15',
      patient: 'Sery Bernadette',
      ndm: 'NDM-0042',
      service: 'Chirurgie',
      doc: 'Dr. Koné',
      motif: 'Préparation intervention colique J-1',
      lit: 'Chambre 108 - Lit A',
      statut: 'En attente d\'entrée',
      priorite: 'Normale',
    },
    {
      id: 'ADM-2026-003',
      date: '16/09/2026 08:30',
      patient: 'Kouadio Germain',
      ndm: 'NDM-0034',
      service: 'Cardiologie',
      doc: 'Dr. Camara',
      motif: 'Surveillance crise hypertensive sévère',
      lit: 'Chambre 301 - Lit A',
      statut: 'En attente d\'entrée',
      priorite: 'Très Urgente',
    },
  ]);

  const [showNewAdmissionModal, setShowNewAdmissionModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id ? String(partners[0].id) : '');
  const [serviceInput, setServiceInput] = useState('Médecine Interne');
  const [docInput, setDocInput] = useState('Dr. Toure');
  const [motifInput, setMotifInput] = useState('');
  const [litInput, setLitInput] = useState('Chambre 102 - Lit A3');
  const [prioriteInput, setPrioriteInput] = useState('Normale');
  const [modeEntreeInput, setModeEntreeInput] = useState('Consultation externe');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreateAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find((p) => String(p.id) === selectedPartnerId) || partners[0];
    const newAdm = {
      id: `ADM-2026-00${admissions.length + 1}`,
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      patient: partner?.name || 'Nouveau Patient',
      ndm: partner?.code || `NDM-${Math.floor(1000 + Math.random() * 9000)}`,
      service: serviceInput,
      doc: docInput,
      motif: motifInput || 'Admission pour surveillance médicale',
      lit: litInput,
      statut: 'En attente d\'entrée',
      priorite: prioriteInput,
    };
    setAdmissions([newAdm, ...admissions]);
    setShowNewAdmissionModal(false);
    setMotifInput('');
    showToast(`Demande d'admission créée avec succès pour ${newAdm.patient} (${newAdm.lit}) !`);
  };

  const handleValidateAdmission = (id: string, patientName: string, lit: string) => {
    setAdmissions((prev) =>
      prev.map((adm) => (adm.id === id ? { ...adm, statut: 'Entrée Validée (Au lit)' } : adm))
    );
    showToast(`Entrée validée : ${patientName} est officiellement installé(e) au lit (${lit}).`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-700" />
            Formalités &amp; Entrées d&apos;Admission en Hospitalisation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Attribution des chambres et formalités d&apos;admission pour prise en charge alitée
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('hospit_beds')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Bed className="w-3.5 h-3.5 text-slate-600" />
            <span>Consulter Plan des Lits</span>
          </button>
          <button
            onClick={() => setShowNewAdmissionModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Admission</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Demandes d&apos;admission récentes ({admissions.length})
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {admissions.filter((a) => a.statut === 'En attente d\'entrée').length} en attente de lit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Date / Heure</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Service Demandé</th>
                <th className="py-2.5 px-4">Médecin Prescripteur</th>
                <th className="py-2.5 px-4">Motif d&apos;entrée</th>
                <th className="py-2.5 px-4">Lit Attribué</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{row.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.patient}
                    <span className="block text-[11px] text-slate-500 font-mono font-normal">{row.ndm}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.service}</td>
                  <td className="py-3 px-4 text-slate-600">{row.doc}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={row.motif}>
                    {row.motif}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1 text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <Bed className="w-3 h-3 text-slate-500" />
                      {row.lit}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.statut.includes('Validée')
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {row.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.statut.includes('Validée') ? (
                      <button
                        onClick={() => onNavigateToView('hospit_patients')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-200 transition cursor-pointer"
                      >
                        Voir Patient
                      </button>
                    ) : (
                      <button
                        onClick={() => handleValidateAdmission(row.id, row.patient, row.lit)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition cursor-pointer flex items-center gap-1 ml-auto shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Valider Entrée</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nouvelle Admission */}
      {showNewAdmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-slate-700" />
                Enregistrer une Nouvelle Demande d&apos;Admission
              </h3>
              <button
                onClick={() => setShowNewAdmissionModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmission} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sélectionner le Patient</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  {partners.map((p, idx) => (
                    <option key={`partner-opt-${p.id}-${idx}`} value={p.id}>
                      {p.name} ({p.code || 'PAT'}) {p.phone ? `— ${p.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Demandé</label>
                  <select
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                  >
                    <option value="Médecine Interne">Médecine Interne</option>
                    <option value="Chirurgie">Chirurgie</option>
                    <option value="Cardiologie">Cardiologie</option>
                    <option value="Soins Intensifs">Soins Intensifs</option>
                    <option value="Maternité / Obstétrique">Maternité / Obstétrique</option>
                    <option value="Pédiatrie">Pédiatrie</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Médecin Prescripteur</label>
                  <select
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    value={docInput}
                    onChange={(e) => setDocInput(e.target.value)}
                  >
                    <option value="Dr. Toure">Dr. Toure (Médecine)</option>
                    <option value="Dr. Koné">Dr. Koné (Chirurgie)</option>
                    <option value="Dr. Camara">Dr. Camara (Cardiologie)</option>
                    <option value="Dr. Diallo">Dr. Diallo (Chirurgie)</option>
                    <option value="Dr. Keita">Dr. Keita (Soins Intensifs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attribution Lit Disponible</label>
                  <select
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium font-mono"
                    value={litInput}
                    onChange={(e) => setLitInput(e.target.value)}
                  >
                    <option value="Chambre 102 - Lit A3">Chambre 102 - Lit A3 (Médecine)</option>
                    <option value="Chambre 202 - Lit B3">Chambre 202 - Lit B3 (Chirurgie)</option>
                    <option value="Chambre 302 - Lit C2">Chambre 302 - Box SI-2 (Soins Intensifs)</option>
                    <option value="Chambre 105 - Lit M1">Chambre 105 - Lit M1 (Maternité)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Niveau d&apos;Urgence</label>
                  <select
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    value={prioriteInput}
                    onChange={(e) => setPrioriteInput(e.target.value)}
                  >
                    <option value="Normale">Normale</option>
                    <option value="Urgente">Urgente</option>
                    <option value="Très Urgente">Très Urgente / Réanimation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif d&apos;Hospitalisation &amp; Diagnostic d&apos;Entrée</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                  placeholder="Ex : Décompensation cardiaque, mise en route traitement injectable et surveillance..."
                  value={motifInput}
                  onChange={(e) => setMotifInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAdmissionModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Valider la Demande d&apos;Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const HospitPatientsTableView: React.FC<DiagnosticHospitProps> = ({
  onNavigateToView,
}) => {
  const [patients, setPatients] = useState([
    {
      id: 'HOSP-001',
      lit: 'Ch. 204 - Lit B',
      chambre: 'Ch. 204',
      patient: 'Ouattara Drissa',
      ndm: 'NDM-0048',
      age: '54 ans (M)',
      service: 'Médecine Interne',
      doc: 'Dr. Toure',
      entree: '15/09/2026',
      sejour: 'J1',
      motif: "Insuffisance rénale aiguë sur déshydratation",
      constantes: [
        { date: '16/09/2026 07:30', ta: '13/8', fc: '78 bpm', temp: '37.1 °C', spo2: '98%', diurese: '800 ml', eva: '2/10' },
        { date: '15/09/2026 18:00', ta: '14/9', fc: '82 bpm', temp: '37.4 °C', spo2: '97%', diurese: '500 ml', eva: '3/10' },
      ],
      soins: [
        { id: 1, type: 'Perfusion Sérum Physiologique 1L / 12h', heure: '08:00', done: true, nurse: 'Inf. Diabate' },
        { id: 2, type: 'Injection Furosémide 20mg IVD', heure: '10:00', done: true, nurse: 'Inf. Diabate' },
        { id: 3, type: 'Bilan créatinine et ionogramme de contrôle', heure: '14:00', done: false, nurse: 'En attente' },
      ],
      transmissions: [
        { heure: '16/09 08:00', type: 'Surveillance', texte: 'Diurèse reprise satisfaisante après perfusion. Patient calme, a bien pris son petit-déjeuner.', nurse: 'Inf. Diabate' },
      ],
    },
    {
      id: 'HOSP-002',
      lit: 'Ch. 108 - Lit A',
      chambre: 'Ch. 108',
      patient: 'Sery Bernadette',
      ndm: 'NDM-0042',
      age: '62 ans (F)',
      service: 'Chirurgie',
      doc: 'Dr. Koné',
      entree: '12/09/2026',
      sejour: 'J4',
      motif: 'Suivi post-opératoire colectomie J+3',
      constantes: [
        { date: '16/09/2026 07:00', ta: '12/7', fc: '72 bpm', temp: '36.8 °C', spo2: '99%', diurese: '1200 ml', eva: '1/10' },
        { date: '15/09/2026 19:00', ta: '12/8', fc: '75 bpm', temp: '37.0 °C', spo2: '98%', diurese: '1100 ml', eva: '2/10' },
      ],
      soins: [
        { id: 1, type: 'Réfection pansement abdominal stérile', heure: '09:00', done: true, nurse: 'Inf. Konan' },
        { id: 2, type: 'Antalgique Paracétamol 1g IV', heure: '12:00', done: true, nurse: 'Inf. Konan' },
        { id: 3, type: 'Lever et premier pas accompagné', heure: '16:00', done: false, nurse: 'En attente' },
      ],
      transmissions: [
        { heure: '16/09 09:15', type: 'Pansement', texte: 'Cicatrisation propre, absence d\'écoulement ou d\'inflammation. Transit intestinal repris.', nurse: 'Inf. Konan' },
      ],
    },
    {
      id: 'HOSP-003',
      lit: 'Ch. 301 - Lit A',
      chambre: 'Ch. 301',
      patient: 'Kouadio Germain',
      ndm: 'NDM-0034',
      age: '47 ans (M)',
      service: 'Cardiologie',
      doc: 'Dr. Camara',
      entree: '14/09/2026',
      sejour: 'J2',
      motif: 'Poussée hypertensive avec céphalées occipitales',
      constantes: [
        { date: '16/09/2026 08:00', ta: '14/9', fc: '80 bpm', temp: '36.9 °C', spo2: '98%', diurese: '950 ml', eva: '1/10' },
        { date: '15/09/2026 20:00', ta: '16/10', fc: '88 bpm', temp: '37.0 °C', spo2: '97%', diurese: '800 ml', eva: '4/10' },
      ],
      soins: [
        { id: 1, type: 'Administration Amlodipine 10mg PO', heure: '08:30', done: true, nurse: 'Inf. Diabate' },
        { id: 2, type: 'Contrôle ECG de repos 12 dérivations', heure: '11:00', done: true, nurse: 'Inf. Diabate' },
      ],
      transmissions: [
        { heure: '16/09 08:45', type: 'Constantes', texte: 'Chute de la PA amorcée sous traitement. Céphalées atténuées.', nurse: 'Inf. Diabate' },
      ],
    },
  ]);

  // Selected patient for the Care Record (Dossier de Soins) Modal
  const [selectedCarePatient, setSelectedCarePatient] = useState<any | null>(null);
  const [careTab, setCareTab] = useState<'constantes' | 'soins' | 'transmissions' | 'observations'>('constantes');

  // Input states inside Dossier de Soins
  const [newTA, setNewTA] = useState('');
  const [newFC, setNewFC] = useState('');
  const [newTemp, setNewTemp] = useState('');
  const [newSpO2, setNewSpO2] = useState('');
  const [newDiurese, setNewDiurese] = useState('');
  const [newEva, setNewEva] = useState('');

  const [newSoinType, setNewSoinType] = useState('');
  const [newSoinHeure, setNewSoinHeure] = useState('14:00');

  const [newTransText, setNewTransText] = useState('');
  const [newTransType, setNewTransType] = useState('Évolution Clinique');

  const handleAddConstantes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarePatient) return;
    const dateStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const newEntry = {
      date: dateStr,
      ta: newTA || '12/8',
      fc: newFC ? `${newFC} bpm` : '75 bpm',
      temp: newTemp ? `${newTemp} °C` : '37.0 °C',
      spo2: newSpO2 ? `${newSpO2}%` : '98%',
      diurese: newDiurese ? `${newDiurese} ml` : '—',
      eva: newEva ? `${newEva}/10` : '0/10',
    };

    const updatedPatients = patients.map((p) => {
      if (p.id === selectedCarePatient.id) {
        const updated = { ...p, constantes: [newEntry, ...p.constantes] };
        setSelectedCarePatient(updated);
        return updated;
      }
      return p;
    });

    setPatients(updatedPatients);
    setNewTA('');
    setNewFC('');
    setNewTemp('');
    setNewSpO2('');
    setNewDiurese('');
    setNewEva('');
  };

  const handleToggleSoin = (soinId: number) => {
    if (!selectedCarePatient) return;
    const updatedPatients = patients.map((p) => {
      if (p.id === selectedCarePatient.id) {
        const updatedSoins = p.soins.map((s: any) =>
          s.id === soinId
            ? {
                ...s,
                done: !s.done,
                nurse: !s.done ? 'Inf. Infirmier' : 'En attente',
              }
            : s
        );
        const updated = { ...p, soins: updatedSoins };
        setSelectedCarePatient(updated);
        return updated;
      }
      return p;
    });
    setPatients(updatedPatients);
  };

  const handleAddSoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarePatient || !newSoinType) return;
    const newS = {
      id: Date.now(),
      type: newSoinType,
      heure: newSoinHeure,
      done: false,
      nurse: 'En attente',
    };

    const updatedPatients = patients.map((p) => {
      if (p.id === selectedCarePatient.id) {
        const updated = { ...p, soins: [...p.soins, newS] };
        setSelectedCarePatient(updated);
        return updated;
      }
      return p;
    });
    setPatients(updatedPatients);
    setNewSoinType('');
  };

  const handleAddTransmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarePatient || !newTransText) return;
    const newTr = {
      heure: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      type: newTransType,
      texte: newTransText,
      nurse: 'Inf. Infirmier',
    };

    const updatedPatients = patients.map((p) => {
      if (p.id === selectedCarePatient.id) {
        const updated = { ...p, transmissions: [newTr, ...p.transmissions] };
        setSelectedCarePatient(updated);
        return updated;
      }
      return p;
    });
    setPatients(updatedPatients);
    setNewTransText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-700" />
            Recensement des Patients Actuellement Hospitalisés
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Surveillance clinique, durée de séjour et accès complet au dossier de soins infirmiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('hospit_monitoring')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-slate-600" />
            <span>Suivi des Séjours</span>
          </button>
          <button
            onClick={() => onNavigateToView('hospit_discharges')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Gestion des Sorties</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Patients en cours d&apos;hospitalisation ({patients.length})
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Mise à jour temps réel • Lits occupés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Lit / Chambre</th>
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Médecin Référent</th>
                <th className="py-2.5 px-4">Entrée</th>
                <th className="py-2.5 px-4">Durée Séjour</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      <Bed className="w-3.5 h-3.5 text-slate-600" />
                      {row.lit}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.patient}
                    <span className="block text-[11px] text-slate-500 font-mono font-normal">
                      {row.ndm} • {row.age}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.service}</td>
                  <td className="py-3 px-4 text-slate-600">{row.doc}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{row.entree}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                      {row.sejour}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedCarePatient(row);
                        setCareTab('constantes');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dossier de Soins</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DOSSIER DE SOINS D'HOSPITALISATION COMPLET */}
      {selectedCarePatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    Dossier de Soins Actif
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedCarePatient.id}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  {selectedCarePatient.patient} ({selectedCarePatient.age})
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="font-mono font-bold text-slate-900">{selectedCarePatient.ndm}</span>
                  <span>• Lit : <strong>{selectedCarePatient.lit}</strong></span>
                  <span>• Service : <strong>{selectedCarePatient.service}</strong></span>
                  <span>• Médecin : <strong>{selectedCarePatient.doc}</strong></span>
                  <span>• Séjour : <strong>{selectedCarePatient.sejour}</strong></span>
                </div>
                <p className="text-xs text-slate-500 italic mt-0.5">
                  Motif : {selectedCarePatient.motif}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printDocumentById('care-sheet-printable-area', `Fiche_Soins_${selectedCarePatient.ndm}`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                  title="Imprimer la fiche de soins"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimer Fiche</span>
                </button>
                <button
                  onClick={() => setSelectedCarePatient(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="care-sheet-printable-area" className="flex-1 flex flex-col space-y-4 overflow-hidden">

            {/* Nav Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/50 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setCareTab('constantes')}
                className={`px-3.5 py-2 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                  careTab === 'constantes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-slate-600" />
                Constantes Vitales ({selectedCarePatient.constantes?.length || 0})
              </button>

              <button
                onClick={() => setCareTab('soins')}
                className={`px-3.5 py-2 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                  careTab === 'soins'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                Plan de Soins &amp; Administrations ({selectedCarePatient.soins?.length || 0})
              </button>

              <button
                onClick={() => setCareTab('transmissions')}
                className={`px-3.5 py-2 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                  careTab === 'transmissions'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Transmissions Infirmières (DAR)
              </button>
            </div>

            {/* Tab Content Body (Scrollable) */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* TAB 1: CONSTANTES VITALES */}
              {careTab === 'constantes' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Enregistrer une nouvelle prise de constantes
                    </h4>
                    <form onSubmit={handleAddConstantes} className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Tension (TA)</label>
                        <input
                          type="text"
                          placeholder="ex: 12/8"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold"
                          value={newTA}
                          onChange={(e) => setNewTA(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Pouls / FC (bpm)</label>
                        <input
                          type="text"
                          placeholder="ex: 75"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold"
                          value={newFC}
                          onChange={(e) => setNewFC(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Temp (°C)</label>
                        <input
                          type="text"
                          placeholder="ex: 37.0"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold"
                          value={newTemp}
                          onChange={(e) => setNewTemp(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">SaO2 (%)</label>
                        <input
                          type="text"
                          placeholder="ex: 98"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold"
                          value={newSpO2}
                          onChange={(e) => setNewSpO2(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Diurèse (ml)</label>
                        <input
                          type="text"
                          placeholder="ex: 800"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold"
                          value={newDiurese}
                          onChange={(e) => setNewDiurese(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition text-xs shadow-xs cursor-pointer"
                        >
                          Ajouter
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Date / Heure</th>
                          <th className="py-2.5 px-3">Tension Art.</th>
                          <th className="py-2.5 px-3">Fréquence Card.</th>
                          <th className="py-2.5 px-3">Température</th>
                          <th className="py-2.5 px-3">Saturation O2</th>
                          <th className="py-2.5 px-3">Diurèse</th>
                          <th className="py-2.5 px-3">Douleur (EVA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCarePatient.constantes.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{c.date}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{c.ta}</td>
                            <td className="py-2.5 px-3 text-slate-700">{c.fc}</td>
                            <td className="py-2.5 px-3 text-slate-700">{c.temp}</td>
                            <td className="py-2.5 px-3 text-slate-700 font-semibold text-emerald-700">{c.spo2}</td>
                            <td className="py-2.5 px-3 text-slate-700">{c.diurese}</td>
                            <td className="py-2.5 px-3 text-slate-700">{c.eva}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: PLAN DE SOINS & ADMINISTRATIONS */}
              {careTab === 'soins' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter une prescription / soin au plan
                    </h4>
                    <form onSubmit={handleAddSoin} className="flex flex-col sm:flex-row gap-2.5 text-xs">
                      <input
                        type="text"
                        placeholder="Description du soin (ex: Perfusion G5% 500ml + 2g KCl...)"
                        className="flex-1 p-2 border border-slate-200 rounded-lg bg-white font-medium"
                        value={newSoinType}
                        onChange={(e) => setNewSoinType(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Heure (ex: 18:00)"
                        className="w-28 p-2 border border-slate-200 rounded-lg bg-white font-semibold text-center"
                        value={newSoinHeure}
                        onChange={(e) => setNewSoinHeure(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition text-xs shadow-xs cursor-pointer"
                      >
                        Ajouter Soin
                      </button>
                    </form>
                  </div>

                  <div className="space-y-2">
                    {selectedCarePatient.soins.map((s: any) => (
                      <div
                        key={s.id}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between text-xs ${
                          s.done
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSoin(s.id)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                              s.done
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <div>
                            <span className={`font-bold block ${s.done ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {s.type}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Heure programmée : <strong className="font-mono text-slate-700">{s.heure}</strong> • Exécutant : {s.nurse}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.done
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.done ? 'Administré' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: TRANSMISSIONS INFIRMIERES (DAR) */}
              {careTab === 'transmissions' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Rédiger une transmission infirmière ciblée (DAR)
                    </h4>
                    <form onSubmit={handleAddTransmission} className="space-y-2.5 text-xs">
                      <div className="flex gap-2">
                        <select
                          className="p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700"
                          value={newTransType}
                          onChange={(e) => setNewTransType(e.target.value)}
                        >
                          <option value="Évolution Clinique">Évolution Clinique</option>
                          <option value="Alerte Constantes">Alerte Constantes</option>
                          <option value="Pansement &amp; Plaie">Pansement &amp; Plaie</option>
                          <option value="Comportement &amp; Confort">Comportement &amp; Confort</option>
                          <option value="Visite Médicale">Visite Médicale</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Données, Actions entreprises, Résultats observés..."
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-medium"
                        value={newTransText}
                        onChange={(e) => setNewTransText(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition text-xs shadow-xs cursor-pointer"
                      >
                        Consigner la transmission
                      </button>
                    </form>
                  </div>

                  <div className="space-y-2.5">
                    {selectedCarePatient.transmissions.map((t: any, idx: number) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            {t.type}
                          </span>
                          <span className="font-mono text-slate-400">{t.heure}</span>
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed">{t.texte}</p>
                        <div className="text-[10px] text-slate-400 font-semibold text-right">
                          Signé : {t.nurse}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCarePatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-xs cursor-pointer"
              >
                Fermer le Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const HospitDischargesTableView: React.FC<DiagnosticHospitProps> = ({
  onNavigateToView,
}) => {
  const [discharges, setDischarges] = useState([
    {
      id: 'DISC-2026-001',
      dateSortie: '16/09/2026 11:00',
      patient: 'Sery Bernadette',
      ndm: 'NDM-0042',
      age: '62 ans',
      service: 'Chirurgie',
      lit: 'Chambre 108 - Lit A',
      doc: 'Dr. Koné',
      entreeDate: '12/09/2026',
      duree: '4 jours',
      avis: 'Sortie autorisée (Guérison clinique)',
      diagEntree: 'Sténose colique bénigne',
      diagSortie: 'Colectomie segmentaire J+4 - Évolution favorable sans complication',
      ordonnanceSortie: 'Paracétamol 1g 3x/jour si douleur (5j), Pansement tous les 2 jours par IDE à domicile.',
      // Financial check: Solde à 0 FCFA = En règle !
      soldeDu: 0,
      montantTotal: 185000,
      montantPaye: 185000,
      quittanceRef: 'FAC/2026/0018',
    },
    {
      id: 'DISC-2026-002',
      dateSortie: '16/09/2026 12:30',
      patient: 'Kouadio Germain',
      ndm: 'NDM-0034',
      age: '47 ans',
      service: 'Cardiologie',
      lit: 'Chambre 301 - Lit A',
      doc: 'Dr. Toure',
      entreeDate: '14/09/2026',
      duree: '2 jours',
      avis: 'Sortie autorisée sous réserve régularisation',
      diagEntree: 'Crise hypertensive sévère',
      diagSortie: 'Stabilisation tensionnelle sous bithérapie orale',
      ordonnanceSortie: 'Amlodipine 10mg le matin, RHD hyposodé, contrôle dans 15 jours.',
      // Financial check: Solde > 0 = Doit de l'argent -> Billet grisé !
      soldeDu: 25000,
      montantTotal: 65000,
      montantPaye: 40000,
      quittanceRef: 'FAC/2026/0021 (Reliquat)',
    },
    {
      id: 'DISC-2026-003',
      dateSortie: '16/09/2026 14:00',
      patient: 'Diallo Mamadou',
      ndm: 'NDM-0089',
      age: '38 ans',
      service: 'Médecine Interne',
      lit: 'Chambre 104 - Lit B',
      doc: 'Dr. Toure',
      entreeDate: '13/09/2026',
      duree: '3 jours',
      avis: 'Sortie autorisée (Apyrexie)',
      diagEntree: 'Paludisme grave forme algide',
      diagSortie: 'Paludisme traité - Goutte épaisse négative à J3',
      ordonnanceSortie: 'Repos 5 jours, Vitamines, hydratation abondante.',
      soldeDu: 0,
      montantTotal: 52000,
      montantPaye: 52000,
      quittanceRef: 'FAC/2026/0025',
    },
  ]);

  // Selected discharge record for printing the Official Billet de Sortie
  const [selectedBillet, setSelectedBillet] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-700" />
            Procédure &amp; Clôture des Sorties d&apos;Hospitalisation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contrôle médical, vérification obligatoire du solde financier et édition du billet de sortie officiel
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Dossiers de sortie programmés ou clôturés ({discharges.length})
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Contrôle financier automatisé avant délivrance du billet
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Patient / NDM</th>
                <th className="py-2.5 px-4">Service &amp; Lit</th>
                <th className="py-2.5 px-4">Médecin Signataire</th>
                <th className="py-2.5 px-4">Avis Médical</th>
                <th className="py-2.5 px-4">Statut Comptable / Caisse</th>
                <th className="py-2.5 px-4 text-right">Action Billet de Sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discharges.map((row) => {
                const isPaid = row.soldeDu === 0;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.patient}
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">
                        {row.ndm} • Séjour {row.duree}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{row.service}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{row.lit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.doc}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {row.avis}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isPaid ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Facture soldée (Quitus 0 FCFA)
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Réf : {row.quittanceRef}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" />
                            Reliquat dû : {formatFCFA(row.soldeDu)}
                          </span>
                          <span className="block text-[10px] text-amber-700 font-semibold">
                            Règlement en caisse obligatoire
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPaid ? (
                        /* Patient en règle : Bouton Billet de Sortie Actif */
                        <button
                          onClick={() => setSelectedBillet(row)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          title="Générer et imprimer le Billet de Sortie officiel"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Billet de Sortie</span>
                        </button>
                      ) : (
                        /* Patient débiteur : Bouton Billet de Sortie GRISÉ ET DÉSACTIVÉ */
                        <div className="inline-flex flex-col items-end gap-1">
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg font-bold text-xs cursor-not-allowed inline-flex items-center gap-1.5 opacity-60"
                            title={`Billet bloqué : Le patient doit encore ${formatFCFA(row.soldeDu)} à la caisse.`}
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Billet de Sortie (Bloqué)</span>
                          </button>
                          <button
                            onClick={() => onNavigateToView('payments')}
                            className="text-[10px] text-amber-700 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Régulariser à la Caisse &rarr;</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BILLET DE SORTIE OFFICIEL IMPRIMABLE (A4) */}
      {selectedBillet && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[95vh] overflow-y-auto">
            {/* Header controls */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aperçu du Document Officiel d&apos;Hospitalisation
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printDocumentById('billet-sortie-printable-sheet', `Billet_Sortie_${selectedBillet.ndm}`)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Imprimer le Billet de Sortie</span>
                </button>
                <button
                  onClick={() => setSelectedBillet(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet */}
            <div id="billet-sortie-printable-sheet" className="border border-slate-300 rounded-xl p-6 sm:p-8 bg-white space-y-6 text-slate-800 text-xs">
              {/* Entête Clinique */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    Centre Médical Hospitalier &amp; Maternité
                  </h2>
                  <p className="text-[11px] text-slate-500">Service d&apos;Hospitalisation &amp; Soins Continus</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Agrément MS / Réf. N° 2026-HOSP-CI</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded">
                    BILLET DE SORTIE N° {selectedBillet.id}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Émis le {selectedBillet.dateSortie}
                  </div>
                </div>
              </div>

              {/* Titre Document */}
              <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Billet de Sortie d&apos;Hospitalisation &amp; Quitus Médical
                </h3>
              </div>

              {/* Cadres Identité & Séjour */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px] border-b border-slate-200 pb-1">
                    1. Identité du Patient
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nom &amp; Prénoms :</span>
                    <strong className="col-span-2 text-slate-900">{selectedBillet.patient}</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">N° Dossier (NDM) :</span>
                    <strong className="col-span-2 font-mono text-slate-900">{selectedBillet.ndm}</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Âge :</span>
                    <span className="col-span-2 text-slate-800">{selectedBillet.age}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px] border-b border-slate-200 pb-1">
                    2. Détails du Séjour
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Service :</span>
                    <strong className="col-span-2 text-slate-900">{selectedBillet.service}</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Chambre &amp; Lit :</span>
                    <span className="col-span-2 font-mono text-slate-800">{selectedBillet.lit}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Période :</span>
                    <span className="col-span-2 font-medium text-slate-800">
                      Du {selectedBillet.entreeDate} au {selectedBillet.dateSortie.split(' ')[0]} ({selectedBillet.duree})
                    </span>
                  </div>
                </div>
              </div>

              {/* Bilan Médical */}
              <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-[11px] border-b border-slate-200 pb-1">
                  3. Bilan Médical &amp; Évolution Clinique
                </span>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Diagnostic d&apos;Admission :</span>
                  <p className="text-slate-800 font-medium">{selectedBillet.diagEntree}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Diagnostic &amp; Constat de Sortie :</span>
                  <p className="text-slate-900 font-bold">{selectedBillet.diagSortie}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">Ordonnance de Sortie &amp; Consignes :</span>
                  <p className="text-slate-800 font-mono bg-white p-2 rounded border border-slate-200 text-[11px]">
                    {selectedBillet.ordonnanceSortie}
                  </p>
                </div>
              </div>

              {/* Quitus Financier */}
              <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    4. Attestation de Quitus Financier &amp; Caisse
                  </span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Le service comptable certifie que l&apos;ensemble des frais de séjour, pharmacie et actes ont été intégralement acquittés.
                  </p>
                  <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                    Réf. Facture / Quittance : {selectedBillet.quittanceRef} • Total réglé : {formatFCFA(selectedBillet.montantPaye)} • Solde dû : 0 FCFA
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-3 py-1 bg-emerald-700 text-white font-bold text-xs rounded-full uppercase tracking-wider">
                    QUITUS VALIDÉ
                  </span>
                </div>
              </div>

              {/* Signatures & Cachets */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center">
                <div className="space-y-10">
                  <span className="font-bold text-slate-700 text-[11px] block">Le Patient / Accompagnant</span>
                  <div className="text-[10px] text-slate-400 italic">Signature</div>
                </div>
                <div className="space-y-10">
                  <span className="font-bold text-slate-700 text-[11px] block">Le Caissier / Comptable</span>
                  <div className="text-[10px] text-emerald-600 font-bold">Cachet &amp; Quittance OK</div>
                </div>
                <div className="space-y-10">
                  <span className="font-bold text-slate-700 text-[11px] block">
                    Le Médecin Traitant<br />
                    <span className="text-[10px] text-slate-500 font-normal">{selectedBillet.doc}</span>
                  </span>
                  <div className="text-[10px] text-slate-400 italic">Signature &amp; Cachet Médical</div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setSelectedBillet(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => printDocumentById('billet-sortie-printable-sheet', `Billet_Sortie_${selectedBillet.ndm}`)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Imprimer Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
