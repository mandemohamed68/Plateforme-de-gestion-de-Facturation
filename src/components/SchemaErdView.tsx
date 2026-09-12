import React, { useState } from 'react';
import {
  Database,
  Key,
  Link,
  Table,
  Play,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowRight,
  Layers,
  Activity,
  Cpu,
  FileCode,
} from 'lucide-react';
import accountingArchImage from '../assets/images/accounting_architecture.jpg';

interface TableMeta {
  name: string;
  count: number;
  primary_key: string;
  foreign_keys?: string[];
  description: string;
}

interface SchemaErdViewProps {
  rawSql: string;
  tables: TableMeta[];
  onExecuteSql: (sql: string) => Promise<any>;
}

export const SchemaErdView: React.FC<SchemaErdViewProps> = ({
  rawSql,
  tables,
  onExecuteSql,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('account_move');
  const [queryInput, setQueryInput] = useState<string>('SELECT * FROM account_move;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'erd' | 'modules' | 'sql_console'>('erd');

  const handleRunQuery = async () => {
    setIsExecuting(true);
    try {
      const res = await onExecuteSql(queryInput);
      setQueryResult(res);
    } catch (e) {
      setQueryResult({ error: 'Erreur lors de l execution SQL' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(rawSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // ERD Tables Map
  const erdNodes = [
    {
      id: 'res_partner',
      title: 'res_partner',
      type: 'Contacts & Tiers',
      color: 'border-blue-500 bg-blue-50/50 text-blue-900',
      badge: 'Tables de base',
      fields: [
        { name: 'id', type: 'SERIAL (PK)', isPk: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'vat', type: 'VARCHAR (TVA)' },
        { name: 'customer_rank', type: 'INTEGER' },
        { name: 'supplier_rank', type: 'INTEGER' },
        { name: 'country_id', type: 'INTEGER (FK -> res_country)' },
      ],
    },
    {
      id: 'account_move',
      title: 'account_move',
      type: 'Factures (Journal Entry)',
      color: 'border-slate-800 bg-slate-100 text-[#0f172a]',
      badge: 'Cœur Comptable',
      fields: [
        { name: 'id', type: 'SERIAL (PK)', isPk: true },
        { name: 'name', type: 'VARCHAR (N° Facture)' },
        { name: 'move_type', type: 'VARCHAR (out_invoice)' },
        { name: 'state', type: 'VARCHAR (draft/posted)' },
        { name: 'partner_id', type: 'INTEGER (FK -> res_partner)', isFk: true },
        { name: 'amount_total', type: 'DECIMAL(12,2)' },
        { name: 'amount_residual', type: 'DECIMAL(12,2)' },
        { name: 'payment_state', type: 'VARCHAR (not_paid/paid)' },
      ],
    },
    {
      id: 'account_move_line',
      title: 'account_move_line',
      type: 'Lignes & Débit/Crédit',
      color: 'border-slate-1000 bg-slate-100/70 text-purple-900',
      badge: 'Écritures Comptables',
      fields: [
        { name: 'id', type: 'SERIAL (PK)', isPk: true },
        { name: 'move_id', type: 'INTEGER (FK -> account_move)', isFk: true },
        { name: 'product_id', type: 'INTEGER (FK -> product_product)', isFk: true },
        { name: 'quantity', type: 'DECIMAL(12,3)' },
        { name: 'price_unit', type: 'DECIMAL(12,2)' },
        { name: 'tax_ids', type: 'INTEGER[] (FK -> account_tax)' },
        { name: 'debit / credit', type: 'DECIMAL(12,2)' },
      ],
    },
    {
      id: 'account_payment',
      title: 'account_payment',
      type: 'Règlements & Trésorerie',
      color: 'border-emerald-500 bg-emerald-50 text-emerald-900',
      badge: 'Trésorerie',
      fields: [
        { name: 'id', type: 'SERIAL (PK)', isPk: true },
        { name: 'move_id', type: 'INTEGER (FK -> account_move)', isFk: true },
        { name: 'partner_id', type: 'INTEGER (FK -> res_partner)', isFk: true },
        { name: 'journal_id', type: 'INTEGER (Banque/Caisse)' },
        { name: 'amount', type: 'DECIMAL(12,2)' },
        { name: 'payment_date', type: 'DATE' },
      ],
    },
    {
      id: 'product_template',
      title: 'product_template',
      type: 'Catalogue Produits (Modèle)',
      color: 'border-amber-500 bg-amber-50 text-amber-900',
      badge: 'Ventes',
      fields: [
        { name: 'id', type: 'SERIAL (PK)', isPk: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'list_price', type: 'DECIMAL(12,2)' },
        { name: 'uom_id', type: 'INTEGER (FK -> uom_uom)' },
      ],
    },
    {
      id: 'res_users',
      title: 'res_users',
      type: 'Utilisateurs & Droits',
      color: 'border-indigo-500 bg-indigo-50 text-indigo-900',
      badge: 'Sécurité',
      fields: [
        { name: 'id', type: 'SERIAL (PK)', isPk: true },
        { name: 'login', type: 'VARCHAR (UNIQUE)' },
        { name: 'partner_id', type: 'INTEGER (FK -> res_partner)' },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Graphic Illustration Header */}
      <div className="bg-[#1e1520] text-white rounded-2xl overflow-hidden shadow-2xl border border-purple-900/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-6 lg:p-8 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modélisation &amp; Architecture Relationnelle</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Schéma SQL &amp; Modélisation Système
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Visualisation interactive des 12 tables comptables standardisées, relations clés étrangères, flux d'écritures financières en temps réel et console d'exécution des requêtes SQL.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setActiveTab('erd')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'erd'
                    ? 'bg-[#0f172a] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Diagramme Relationnel (ERD)
              </button>
              <button
                onClick={() => setActiveTab('modules')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'modules'
                    ? 'bg-[#0f172a] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Cartographie des Modules ERP
              </button>
              <button
                onClick={() => setActiveTab('sql_console')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'sql_console'
                    ? 'bg-[#0f172a] text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Console SQL &amp; Script DDL
              </button>
            </div>
          </div>

          {/* Generated Banner Image Render */}
          <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-black/40">
            <img
              src={accountingArchImage}
              alt="Architecture Comptable & Relations"
              className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-mono px-2 py-1 rounded-md">
              Visual Architecture Overview
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE ERD MAP */}
      {activeTab === 'erd' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Schéma Entités-Relations (Diagramme ERD)
                </h3>
                <p className="text-xs text-slate-500">
                  Relations clés étrangères (FK) et structures de données financières
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-900" />
                  <span>PK (Primary Key)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0f172a]" />
                  <span>FK (Foreign Key)</span>
                </div>
              </div>
            </div>

            {/* ERD Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {erdNodes.map((node) => (
                <div
                  key={node.id}
                  className={`rounded-2xl border-2 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow ${node.color}`}
                >
                  <div className="flex items-center justify-between border-b border-black/10 pb-2">
                    <div>
                      <div className="font-mono font-extrabold text-sm">{node.title}</div>
                      <div className="text-[10px] opacity-80 font-semibold">{node.type}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10">
                      {node.badge}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    {node.fields.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-black/5"
                      >
                        <span className="font-bold flex items-center space-x-1">
                          {f.isPk && <Key className="w-3 h-3 text-amber-600 inline mr-1" />}
                          {f.isFk && <Link className="w-3 h-3 text-[#0f172a] inline mr-1" />}
                          <span>{f.name}</span>
                        </span>
                        <span className="text-[10px] opacity-70">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODULES TRANSACTIONS FLOW */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Flux Transactionnels : Facturation -&gt; Comptabilité -&gt; Règlement
            </h3>
            <p className="text-xs text-slate-500">
              Intégration en temps réel des modules fonctionnels et analytiques
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-5 bg-slate-100/50 border border-purple-200 rounded-2xl space-y-3">
              <div className="w-8 h-8 rounded-xl bg-[#0f172a] text-white font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Module Facturation Client (`account_move`)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Création de la facture commerciale en état `draft`. Génération automatique des lignes d'articles `account_move_line` avec calcul des remises et taxes `account_tax`.
              </p>
              <div className="font-mono text-[11px] text-[#0f172a] bg-white p-2 rounded-lg border border-slate-200">
                POST /api/moves -&gt; state: 'draft'
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Validation &amp; Grand Livre (`posted`)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comptabilisation officielle. Attribution du numéro de pièce unique (ex: `FAC/2026/0001`). Génération des écritures Débit / Crédit au journal des ventes.
              </p>
              <div className="font-mono text-[11px] text-indigo-700 bg-white p-2 rounded-lg border border-indigo-100">
                POST /api/moves/:id/post -&gt; 'posted'
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Règlement &amp; Reconciliation (`account_payment`)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enregistrement du paiement sur le journal Banque/Caisse. Recalcul instantané du solde restant dû `amount_residual` et mise à jour automatique du statut à `paid`.
              </p>
              <div className="font-mono text-[11px] text-emerald-700 bg-white p-2 rounded-lg border border-emerald-100">
                POST /api/payments -&gt; residual = 0 FCFA
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONSOLE SQL & RAW DDL SCRIPT */}
      {activeTab === 'sql_console' && (
        <div className="space-y-6">
          {/* SQL Query Console Runner */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold">Console de Requêtes SQL (Simulateur Base)</h3>
              </div>
              <span className="text-xs text-slate-400">PostgreSQL / SQLite Compatible</span>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-300 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                placeholder="Entrez votre requete SQL..."
              />

              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Comptabilité :</span>
                  <button
                    onClick={() => setQueryInput('SELECT * FROM account_move;')}
                    className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300 transition-colors"
                  >
                    account_move
                  </button>
                  <button
                    onClick={() => setQueryInput('SELECT * FROM res_partner;')}
                    className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300 transition-colors"
                  >
                    res_partner
                  </button>
                  <button
                    onClick={() => setQueryInput('SELECT * FROM account_payment;')}
                    className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300 transition-colors"
                  >
                    account_payment
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Labo Workflow :</span>
                  <button
                    onClick={() => setQueryInput("SELECT * FROM v_suivi_patient_workflow WHERE ndm = 'NDM0001';")}
                    className="text-[10px] font-mono bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1 rounded-lg text-amber-300 border border-amber-900/40 transition-colors"
                  >
                    v_suivi_patient_workflow
                  </button>
                  <button
                    onClick={() => setQueryInput('SELECT * FROM v_echantillons_a_prelever;')}
                    className="text-[10px] font-mono bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1 rounded-lg text-amber-300 border border-amber-900/40 transition-colors"
                  >
                    v_echantillons_a_prelever
                  </button>
                  <button
                    onClick={() => setQueryInput('SELECT * FROM v_resultats_a_saisir;')}
                    className="text-[10px] font-mono bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1 rounded-lg text-amber-300 border border-amber-900/40 transition-colors"
                  >
                    v_resultats_a_saisir
                  </button>
                  <button
                    onClick={() => setQueryInput('SELECT * FROM v_resultats_a_valider;')}
                    className="text-[10px] font-mono bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1 rounded-lg text-amber-300 border border-amber-900/40 transition-colors"
                  >
                    v_resultats_a_valider
                  </button>
                </div>
              </div>

              <div className="flex justify-end items-center pt-2">

                <button
                  onClick={handleRunQuery}
                  disabled={isExecuting}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isExecuting ? 'Exécution...' : 'Exécuter SQL'}</span>
                </button>
              </div>
            </div>

            {/* Results Table Output */}
            {queryResult && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400">Résultat de la requête :</span>
                <div className="bg-slate-950 p-3 rounded-xl max-h-60 overflow-y-auto font-mono text-[11px] text-slate-200">
                  {queryResult.rows ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-amber-400 border-b border-slate-800">
                          {queryResult.columns.map((c: string) => (
                            <th key={c} className="p-1.5 uppercase">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {queryResult.rows.map((row: any, i: number) => (
                          <tr key={i}>
                            {queryResult.columns.map((col: string) => (
                              <td key={col} className="p-1.5 truncate max-w-[150px]">
                                {String(row[col] ?? 'NULL')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DDL Script Code Area */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Script SQL Complet de la Base de Données Facturation (`schema.sql`)
              </h3>
              <button
                onClick={handleCopySql}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copié !' : 'Copier le SQL'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap">
              {rawSql}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
