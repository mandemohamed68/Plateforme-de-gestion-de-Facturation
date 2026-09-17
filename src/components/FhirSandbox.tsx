import React, { useState, useEffect } from 'react';
import {
  Server,
  Play,
  FileJson,
  Search,
  Database,
  ShieldAlert,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Send,
  User,
  Activity,
  Heart,
  Calendar,
  AlertOctagon,
  DollarSign,
  FileText,
  Clock,
  ClipboardList,
  Compass
} from 'lucide-react';

export const FhirSandbox: React.FC = () => {
  const [endpoint, setEndpoint] = useState<string>('/fhir/Patient');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(
      {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: 'new-pat-01',
              name: [{ family: 'Koffi', given: ['Alain'] }],
              gender: 'male',
              birthDate: '1990-08-20'
            },
            request: {
              method: 'POST',
              url: 'Patient'
            }
          },
          {
            resource: {
              resourceType: 'Encounter',
              id: 'new-enc-01',
              status: 'in-progress',
              subject: { reference: 'Patient/new-pat-01' }
            },
            request: {
              method: 'POST',
              url: 'Encounter'
            }
          }
        ]
      },
      null,
      2
    )
  );

  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('patient-list');

  // Interactive patient search helper for the sandbox
  const [patientSearchNdm, setPatientSearchNdm] = useState<string>('NDM-0048');

  // Mapped resource endpoints documentation & metadata
  const fhirResources = [
    { name: 'Patient', desc: 'Dossiers Patients (NDM, Identité, Telecom, Contact)', icon: User, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { name: 'Encounter', desc: 'Épisode de soin / Consultation (status, médecin, motif)', icon: Activity, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { name: 'Observation', desc: 'Constantes vitales (BP, HR, Temp, Glycemia LOINC)', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    { name: 'Condition', desc: 'Diagnostics codés selon le standard international CIM-10 / ICD-10', icon: AlertOctagon, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { name: 'AllergyIntolerance', desc: 'Allergies et intolérances documentées du patient', icon: ShieldAlert, color: 'text-red-500 bg-red-50 border-red-200' },
    { name: 'MedicationRequest', desc: 'Prescriptions d\'ordonnance médicamenteuses associées', icon: FileText, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    { name: 'ServiceRequest', desc: 'Demandes de bilans biologiques ou d\'examens radiologiques', icon: ClipboardList, color: 'text-sky-500 bg-sky-50 border-sky-200' },
    { name: 'DiagnosticReport', desc: 'Résultats validés du laboratoire et conclusions PACS imagerie', icon: Compass, color: 'text-violet-500 bg-violet-50 border-violet-200' },
    { name: 'Invoice', desc: 'Facturation hospitalière, quote-part patient et tiers-payeur', icon: DollarSign, color: 'text-teal-500 bg-teal-50 border-teal-200' },
    { name: 'PaymentReconciliation', desc: 'Encaissements d\'admission, reçus et rapprochements de caisse', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { name: 'AuditEvent', desc: 'Traçabilité intégrale de toutes les opérations REST du SIH (R02)', icon: Clock, color: 'text-purple-500 bg-purple-50 border-purple-200' },
    { name: 'Practitioner', desc: 'Professionnels de santé, médecins, infirmiers du SIH', icon: User, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    { name: 'PractitionerRole', desc: 'Rôles, habilitations et spécialités rattachées (R04)', icon: Layers, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    { name: 'Location', desc: 'Localisations géographiques, lits et services d\'hospitalisation', icon: Server, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    { name: 'Organization', desc: 'Unités fonctionnelles et départements administratifs de l\'hôpital', icon: Database, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    { name: 'Coverage', desc: 'Couverture d\'assurance / Tiers-Payeur (taux de prise en charge R05)', icon: ShieldAlert, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { name: 'Consent', desc: 'Consentements RGPD et règles d\'accès de sécurité par rôle', icon: ShieldAlert, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { name: 'Basic', desc: 'Sessions de caisses et états d\'ouverture/clôture de la journée', icon: Server, color: 'text-purple-500 bg-purple-50 border-purple-200' }
  ];

  // Presets of REST queries
  const presets = [
    { id: 'patient-list', label: 'Tous les Patients', method: 'GET', url: '/fhir/Patient' },
    { id: 'patient-search', label: 'Rechercher Patient (NDM-0048)', method: 'GET', url: `/fhir/Patient?identifier=urn:oid:1.2.3.4.5.6.7.8.9|${patientSearchNdm}` },
    { id: 'patient-everything', label: 'Dossier Complet Patient (R09 $everything)', method: 'GET', url: `/fhir/Patient/1/$everything` },
    { id: 'encounters', label: 'Toutes les Consultations', method: 'GET', url: '/fhir/Encounter' },
    { id: 'vitals', label: 'Signes Vitaux (Observations LOINC)', method: 'GET', url: '/fhir/Observation' },
    { id: 'diagnostics', label: 'Diagnostics CIM-10 (Conditions)', method: 'GET', url: '/fhir/Condition' },
    { id: 'audit-logs', label: 'Journal de Traçabilité FHIR (AuditEvent)', method: 'GET', url: '/fhir/AuditEvent' },
    { id: 'invoices', label: 'Factures de Caisse (Invoices)', method: 'GET', url: '/fhir/Invoice' },
    { id: 'coverage', label: 'Contrats d\'Assurances (Coverage)', method: 'GET', url: '/fhir/Coverage' },
    { id: 'transaction', label: 'Créer Transaction (Bundle POST)', method: 'POST', url: '/fhir' }
  ];

  const handleApplyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = presets.find((pr) => pr.id === presetId);
    if (p) {
      setMethod(p.method as 'GET' | 'POST');
      if (presetId === 'patient-search') {
        setEndpoint(`/fhir/Patient?identifier=urn:oid:1.2.3.4.5.6.7.8.9|${patientSearchNdm}`);
      } else {
        setEndpoint(p.url);
      }
    }
  };

  const handleRunQuery = async () => {
    setLoading(true);
    setApiError(null);
    setResponseBody(null);
    setResponseStatus(null);
    setResponseHeaders({});

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Accept': 'application/fhir+json',
          'Content-Type': method === 'POST' ? 'application/fhir+json' : 'application/json',
          'Authorization': 'Bearer fhir_smart_token_demo_simulated_jwt'
        }
      };

      if (method === 'POST') {
        options.body = requestBody;
      }

      const res = await fetch(endpoint, options);
      setResponseStatus(res.status);
      
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      setResponseHeaders(headersObj);

      const data = await res.json();
      setResponseBody(data);
    } catch (err: any) {
      setApiError(err.message || 'Erreur réseau lors de la communication avec le serveur FHIR.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPreset === 'patient-search') {
      setEndpoint(`/fhir/Patient?identifier=urn:oid:1.2.3.4.5.6.7.8.9|${patientSearchNdm}`);
    }
  }, [patientSearchNdm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Resource List & Presets (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* API Specification Badge */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              Serveur HL7® FHIR® R4 (v4.0.1) & SMART on FHIR
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 uppercase tracking-wider">
              Service Actif
            </span>
          </div>
          
          <p className="text-xs text-slate-600 leading-relaxed">
            Ce serveur expose l'état complet de la clinique en temps réel au format standardisé international de santé HL7 FHIR R4. 
            Toutes les requêtes sont sécurisées via le protocole <strong>SMART on FHIR</strong> (OAuth2 / OpenID Connect) 
            et chaque interaction REST émet automatiquement une ressource <strong>AuditEvent</strong> de traçabilité (R02).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500 font-mono">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
              <span className="text-slate-400 block uppercase font-bold text-[9px]">Base URL</span>
              <span className="text-slate-800 font-semibold">https://api.hopital.example/fhir</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
              <span className="text-slate-400 block uppercase font-bold text-[9px]">Standard</span>
              <span className="text-indigo-700 font-semibold">HL7 FHIR R4 (4.0.1)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block uppercase font-bold text-[9px]">Authentification</span>
              <span className="text-emerald-700 font-semibold">SMART on FHIR (OAuth2)</span>
            </div>
          </div>
        </div>

        {/* REST Query Presets Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Requêtes REST & Scénarios d'Intégration FHIR
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between gap-1.5 ${
                  selectedPreset === p.id
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/10'
                    : 'border-slate-250 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-slate-800">{p.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    p.method === 'POST' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {p.method}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 truncate w-full">{p.url}</span>
              </button>
            ))}
          </div>

          {/* Interactive Search Bar inside Presets */}
          {selectedPreset === 'patient-search' && (
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-2 mt-2">
              <label className="block text-[11px] font-semibold text-indigo-950">
                Numéro de Dossier Médical (NDM) à tester :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={patientSearchNdm}
                  onChange={(e) => setPatientSearchNdm(e.target.value)}
                  placeholder="ex: NDM-0048, NDM-0012..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleRunQuery}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Tester
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Ce paramètre met à jour l'URL de recherche d'identifiant officielle FHIR <code>[base]/Patient?identifier=urn:oid...|NDM</code>.
              </p>
            </div>
          )}
        </div>

        {/* Mapped Resources List (18 resources in grid) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              Ressources HL7 FHIR R4 Disponibles ({fhirResources.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Auto-mappées à la volée</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {fhirResources.map((res) => {
              const Icon = res.icon;
              const isSelected = endpoint === `/fhir/${res.name}`;
              return (
                <button
                  key={res.name}
                  onClick={() => {
                    setSelectedPreset('');
                    setMethod('GET');
                    setEndpoint(`/fhir/${res.name}`);
                  }}
                  className={`p-2.5 text-left rounded-xl border text-xs flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border flex-shrink-0 ${res.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{res.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate leading-snug">{res.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Terminal Request / Response (5 cols) */}
      <div className="lg:col-span-5 flex flex-col h-full space-y-4">
        
        {/* Terminal Header & Request Input */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400">REST API Client Console</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>

          {/* URL Input Bar */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Request Path (Editable)</label>
            <div className="flex items-stretch rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
                className="px-3 py-2 bg-slate-800 text-white font-mono text-xs font-bold border-r border-slate-700 outline-none cursor-pointer hover:bg-slate-750"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs font-mono text-indigo-300 outline-none"
              />
              <button
                onClick={handleRunQuery}
                disabled={loading}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border-l border-indigo-700"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Envoyer</span>
              </button>
            </div>
          </div>

          {/* Headers Preview */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400">
            <span className="block font-bold text-[9px] uppercase text-slate-500 mb-1">SMART on FHIR Client Request Headers</span>
            <div><span className="text-slate-500">Accept:</span> <span className="text-emerald-400">application/fhir+json</span></div>
            <div><span className="text-slate-500">X-FHIR-Version:</span> <span className="text-amber-400">4.0.1</span></div>
            <div className="truncate"><span className="text-slate-500">Authorization:</span> <span className="text-indigo-400">Bearer fhir_smart_token_demo_simulated_jwt_enc_key</span></div>
          </div>

          {/* Request Body Editor for POST */}
          {method === 'POST' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Transaction Bundle Body (JSON)</label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 font-mono text-xs text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Terminal Response Viewer */}
        <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl flex-1 flex flex-col border border-slate-900 shadow-2xl min-h-[300px]">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Live Response Buffer</span>
            </div>
            
            {responseStatus && (
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                responseStatus >= 200 && responseStatus < 300
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/60'
                  : 'bg-rose-950/60 text-rose-400 border-rose-900/60'
              }`}>
                HTTP STATUS: {responseStatus}
              </span>
            )}
          </div>

          {/* Response Payload Block */}
          <div className="flex-1 overflow-auto max-h-[500px] text-xs font-mono text-slate-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs italic">Requête HTTP en cours d'envoi au serveur FHIR...</p>
              </div>
            ) : apiError ? (
              <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-xl text-rose-300 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Erreur lors de la requête</span>
                </div>
                <p className="text-xs">{apiError}</p>
              </div>
            ) : responseBody ? (
              <div className="space-y-4">
                {/* Headers Output */}
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-400">
                  <span className="block font-bold text-slate-500 uppercase text-[9px] mb-1">Server Response Headers</span>
                  {Object.entries(responseHeaders).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-slate-500">{k}:</span> <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Pretty Print JSON */}
                <pre className="bg-slate-900 p-4 rounded-xl border border-slate-850 overflow-x-auto text-[11px] leading-relaxed text-indigo-200">
                  {JSON.stringify(responseBody, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500 text-center px-4">
                <Terminal className="w-8 h-8 text-slate-700" />
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-slate-400">En attente d'une requête REST...</p>
                  <p className="text-[10px] text-slate-600 max-w-[280px]">
                    Sélectionnez un preset de requête ci-contre ou saisissez un endpoint et cliquez sur <strong>Envoyer</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
