import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export interface DatabaseStatus {
  driver: 'mariadb' | 'json_disk';
  isConnected: boolean;
  host: string;
  port: number;
  user: string;
  database: string;
  tableCounts: Record<string, number>;
  errorMessage?: string;
  lastChecked: string;
  storageFilePath: string;
}

const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306;
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'lab_facturation_db';

let pool: mysql.Pool | null = null;
let isConnectedToMariaDb = false;
let lastConnectionError: string | null = null;

export function getMariaDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000,
      multipleStatements: true,
    });
  }
  return pool;
}

/**
 * Teste la connexion à MariaDB locale
 */
export async function testMariaDbConnection(customConfig?: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}): Promise<{ success: boolean; message: string; tableCounts?: Record<string, number> }> {
  try {
    const testPool = customConfig
      ? mysql.createPool({
          host: customConfig.host || DB_HOST,
          port: customConfig.port || DB_PORT,
          user: customConfig.user || DB_USER,
          password: customConfig.password ?? DB_PASSWORD,
          database: customConfig.database || DB_NAME,
          connectTimeout: 3000,
        })
      : getMariaDbPool();

    const conn = await testPool.getConnection();
    await conn.ping();

    // Compter les lignes dans les tables principales si elles existent
    const counts: Record<string, number> = {};
    const [tables]: any = await conn.query('SHOW TABLES');
    const tableNames = (tables || []).map((t: any) => Object.values(t)[0] as string);

    for (const tbl of tableNames) {
      try {
        const [rows]: any = await conn.query(`SELECT COUNT(*) as count FROM \`${tbl}\``);
        counts[tbl] = rows[0]?.count || 0;
      } catch (_) {}
    }

    conn.release();
    isConnectedToMariaDb = true;
    lastConnectionError = null;

    return {
      success: true,
      message: `Connexion MariaDB établie avec succès sur ${customConfig?.host || DB_HOST}:${customConfig?.port || DB_PORT} (Base: ${customConfig?.database || DB_NAME})`,
      tableCounts: counts,
    };
  } catch (err: any) {
    isConnectedToMariaDb = false;
    lastConnectionError = err?.message || 'Impossible de se connecter au serveur MariaDB';
    return {
      success: false,
      message: `Échec de connexion MariaDB : ${err?.message || 'Vérifiez que votre serveur MariaDB/MySQL (ex: XAMPP, WAMP, service local) est démarré sur le port ' + DB_PORT}`,
    };
  }
}

/**
 * Initialise le schéma complet de lab_facturation_db dans MariaDB
 */
export async function initializeMariaDbSchema(): Promise<boolean> {
  try {
    const p = getMariaDbPool();
    const conn = await p.getConnection();

    const schemaPath = path.join(process.cwd(), 'database_dump_exhaustive.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      await conn.query(sqlContent);
      console.log('[MariaDB] Schéma et tables initialisés avec succès dans lab_facturation_db.');
    }
    conn.release();
    return true;
  } catch (err: any) {
    console.warn('[MariaDB] Initialisation schéma différée ou erreur:', err?.message);
    return false;
  }
}

/**
 * Synchronise un échantillon de laboratoire vers labo_echantillon
 */
export async function persistLabSampleToMariaDb(sample: {
  id?: number;
  code_barre: string;
  numero_dossier: string;
  patient_id?: number;
  patient_name: string;
  patient_gender?: string;
  patient_age?: number;
  prescripteur_nom?: string;
  exam_code: string;
  exam_name: string;
  departement?: string;
  type_prelevement?: string;
  date_prelevement?: string;
  preleve_par?: string;
  statut?: string;
}) {
  if (!isConnectedToMariaDb) return;
  try {
    const p = getMariaDbPool();
    const sql = `
      INSERT INTO labo_echantillon (
        code_barre, numero_dossier, patient_id, patient_name, patient_gender,
        patient_age, prescripteur_nom, exam_code, exam_name, departement,
        type_prelevement, preleve_par, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        patient_name = VALUES(patient_name),
        statut = VALUES(statut),
        updated_at = CURRENT_TIMESTAMP
    `;
    await p.query(sql, [
      sample.code_barre,
      sample.numero_dossier,
      sample.patient_id || null,
      sample.patient_name,
      sample.patient_gender || 'M',
      sample.patient_age || null,
      sample.prescripteur_nom || 'Dr. Prescripteur Externe',
      sample.exam_code,
      sample.exam_name,
      sample.departement || 'Biologie Médicale',
      sample.type_prelevement || 'Sang Total (EDTA)',
      sample.preleve_par || 'Infirmier Préleveur',
      sample.statut || 'en_attente_paillasse',
    ]);
  } catch (err: any) {
    console.error('[MariaDB] Erreur persistLabSampleToMariaDb:', err?.message);
  }
}

/**
 * Synchronise les résultats d'analyses vers resultat_resultat_labo
 */
export async function persistLabResultToMariaDb(result: {
  echantillon_id: number;
  exam_name: string;
  parameter_name: string;
  valeur_mesuree?: string;
  unite?: string;
  valeurs_reference?: string;
  is_abnormal?: boolean;
  valide_par_technicien?: string;
  valide_par_biologiste?: string;
  status?: string;
}) {
  if (!isConnectedToMariaDb) return;
  try {
    const p = getMariaDbPool();
    const sql = `
      INSERT INTO resultat_resultat_labo (
        echantillon_id, exam_name, parameter_name, valeur_mesuree, unite,
        valeurs_reference, is_abnormal, valide_par_technicien, valide_par_biologiste, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        valeur_mesuree = VALUES(valeur_mesuree),
        is_abnormal = VALUES(is_abnormal),
        valide_par_technicien = VALUES(valide_par_technicien),
        valide_par_biologiste = VALUES(valide_par_biologiste),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;
    await p.query(sql, [
      result.echantillon_id,
      result.exam_name,
      result.parameter_name,
      result.valeur_mesuree || null,
      result.unite || '',
      result.valeurs_reference || '',
      result.is_abnormal ? 1 : 0,
      result.valide_par_technicien || null,
      result.valide_par_biologiste || null,
      result.status || 'pending_entry',
    ]);
  } catch (err: any) {
    console.error('[MariaDB] Erreur persistLabResultToMariaDb:', err?.message);
  }
}

/**
 * Synchronise une facture vers account_move et account_move_line
 */
export async function persistInvoiceToMariaDb(move: any, lines: any[] = []) {
  if (!isConnectedToMariaDb) return;
  try {
    const p = getMariaDbPool();
    const sqlMove = `
      INSERT INTO account_move (
        id, name, move_type, state, partner_id, partner_name, date,
        invoice_date, invoice_date_due, amount_untaxed, amount_tax,
        amount_total, amount_residual, payment_state, invoice_user_id,
        invoice_user_name, insurance_share, patient_share, insurance_company,
        guarantee_letter_number, narration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        state = VALUES(state),
        amount_residual = VALUES(amount_residual),
        payment_state = VALUES(payment_state),
        insurance_share = VALUES(insurance_share),
        patient_share = VALUES(patient_share)
    `;
    await p.query(sqlMove, [
      move.id,
      move.name,
      move.move_type || 'out_invoice',
      move.state || 'posted',
      move.partner_id || null,
      move.partner_name || 'Patient',
      move.date || null,
      move.invoice_date || null,
      move.invoice_date_due || null,
      move.amount_untaxed || 0,
      move.amount_tax || 0,
      move.amount_total || 0,
      move.amount_residual || 0,
      move.payment_state || 'not_paid',
      move.invoice_user_id || null,
      move.invoice_user_name || null,
      move.insurance_share || 0,
      move.patient_share || move.amount_total || 0,
      move.insurance_company || null,
      move.guarantee_letter_number || null,
      move.narration || null,
    ]);

    // Insert lines
    if (lines && lines.length > 0) {
      for (const line of lines) {
        const sqlLine = `
          INSERT INTO account_move_line (
            id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            quantity = VALUES(quantity),
            price_subtotal = VALUES(price_subtotal),
            price_total = VALUES(price_total)
        `;
        await p.query(sqlLine, [
          line.id,
          move.id,
          line.product_id || null,
          line.name || 'Prestation Médicale',
          line.quantity || 1,
          line.price_unit || 0,
          line.discount || 0,
          line.price_subtotal || 0,
          line.price_total || 0,
        ]);
      }
    }
  } catch (err: any) {
    console.error('[MariaDB] Erreur persistInvoiceToMariaDb:', err?.message);
  }
}

/**
 * Synchronise un règlement vers account_payment
 */
export async function persistPaymentToMariaDb(payment: any) {
  if (!isConnectedToMariaDb) return;
  try {
    const p = getMariaDbPool();
    const sql = `
      INSERT INTO account_payment (
        id, payment_reference, partner_id, partner_name, move_id,
        invoice_name, amount, payment_date, state, payment_method_code,
        journal_name, cashier_name, transaction_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        state = VALUES(state),
        amount = VALUES(amount)
    `;
    await p.query(sql, [
      payment.id,
      payment.payment_reference || payment.name || `PAY-${payment.id}`,
      payment.partner_id || null,
      payment.partner_name || 'Patient',
      payment.move_id || null,
      payment.invoice_name || null,
      payment.amount || 0,
      payment.payment_date || null,
      payment.state || 'posted',
      payment.payment_method_code || 'cash',
      payment.journal_name || 'Caisse Principale',
      payment.cashier_name || 'Caissier',
      payment.transaction_reference || null,
    ]);
  } catch (err: any) {
    console.error('[MariaDB] Erreur persistPaymentToMariaDb:', err?.message);
  }
}

/**
 * Synchronise une session de caisse vers caisse_session
 */
export async function persistTillSessionToMariaDb(session: any) {
  if (!isConnectedToMariaDb) return;
  try {
    const p = getMariaDbPool();
    const sql = `
      INSERT INTO caisse_session (
        id, session_code, user_id, cashier_name, state, opening_balance,
        closing_balance, total_collected, opening_date, closing_date,
        cash_difference, closing_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        state = VALUES(state),
        closing_balance = VALUES(closing_balance),
        total_collected = VALUES(total_collected),
        closing_date = VALUES(closing_date),
        cash_difference = VALUES(cash_difference),
        closing_notes = VALUES(closing_notes)
    `;
    await p.query(sql, [
      session.id,
      session.session_code,
      session.user_id || null,
      session.cashier_name || 'Caissier',
      session.state || 'in_progress',
      session.opening_balance || 0,
      session.closing_actual_cash || 0,
      session.total_collected || 0,
      session.opening_date || null,
      session.closing_date || null,
      session.cash_difference || 0,
      session.closing_notes || null,
    ]);
  } catch (err: any) {
    console.error('[MariaDB] Erreur persistTillSessionToMariaDb:', err?.message);
  }
}

/**
 * Synchronise un patient/partenaire vers res_partner
 */
export async function persistPartnerToMariaDb(partner: any) {
  if (!isConnectedToMariaDb) return;
  try {
    const p = getMariaDbPool();
    const sql = `
      INSERT INTO res_partner (
        id, name, is_company, partner_type, email, phone, street, city, vat,
        gender, age, birth_date, ndm, social_security_number, insurance_company, insurance_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        phone = VALUES(phone),
        email = VALUES(email),
        street = VALUES(street),
        insurance_company = VALUES(insurance_company),
        insurance_rate = VALUES(insurance_rate)
    `;
    await p.query(sql, [
      partner.id,
      partner.name,
      partner.is_company ? 1 : 0,
      partner.partner_type || 'patient',
      partner.email || null,
      partner.phone || null,
      partner.street || null,
      partner.city || 'Abidjan',
      partner.vat || null,
      partner.gender || null,
      partner.age || null,
      partner.birth_date || null,
      partner.ndm || null,
      partner.social_security_number || null,
      partner.insurance_company || partner.insurance_name || null,
      partner.insurance_rate || partner.insurance_coverage_rate || 0,
    ]);
  } catch (err: any) {
    console.error('[MariaDB] Erreur persistPartnerToMariaDb:', err?.message);
  }
}

/**
 * Synchronise toutes les données mémoire vers MariaDB d'un seul coup
 */
export async function syncAllMemoryToMariaDb(data: {
  partners: any[];
  moves: any[];
  moveLines: any[];
  payments: any[];
  labOrders: any[];
  tillSessions: any[];
}): Promise<{ success: boolean; insertedCount: number; message: string }> {
  const connTest = await testMariaDbConnection();
  if (!connTest.success) {
    return {
      success: false,
      insertedCount: 0,
      message: connTest.message,
    };
  }

  try {
    await initializeMariaDbSchema();

    let count = 0;
    // 1. Partners
    for (const p of data.partners || []) {
      await persistPartnerToMariaDb(p);
      count++;
    }

    // 2. Invoices & Lines
    for (const m of data.moves || []) {
      const lines = (data.moveLines || []).filter((l) => l.move_id === m.id);
      await persistInvoiceToMariaDb(m, lines);
      count++;
    }

    // 3. Payments
    for (const py of data.payments || []) {
      await persistPaymentToMariaDb(py);
      count++;
    }

    // 4. Till Sessions
    for (const ts of data.tillSessions || []) {
      await persistTillSessionToMariaDb(ts);
      count++;
    }

    // 5. Lab Orders
    for (const o of data.labOrders || []) {
      await persistLabSampleToMariaDb({
        code_barre: o.order_number,
        numero_dossier: o.order_number,
        patient_id: o.partner_id,
        patient_name: o.partner_name,
        patient_gender: o.patient_gender,
        patient_age: o.patient_age,
        prescripteur_nom: o.prescribing_doctor,
        exam_code: (o.exam_names && o.exam_names[0]) || 'NFS',
        exam_name: (o.exam_names && o.exam_names[0]) || 'Hémogramme Complet (NFS)',
        statut: o.status,
      });
      count++;
    }

    return {
      success: true,
      insertedCount: count,
      message: `${count} enregistrements synchronisés avec succès dans la base MariaDB lab_facturation_db.`,
    };
  } catch (err: any) {
    return {
      success: false,
      insertedCount: 0,
      message: `Erreur lors de la synchronisation vers MariaDB : ${err?.message}`,
    };
  }
}

/**
 * Vide/Tronque les données opérationnelles en local (MariaDB lab_facturation_db) :
 * - Factures (account_move, account_move_line)
 * - Encaissements / Paiements (account_payment)
 * - Sessions de caisse (caisse_session, caisse_opcaisse)
 * - Échantillons et Résultats de laboratoire (resultat_resultat_labo, labo_echantillon)
 * - Consultations (medical_consultation)
 * - Patients individuels de test (conserve les sociétés, assurances et utilisateurs)
 */
export async function truncateMariaDbOperationalData(): Promise<{ success: boolean; message: string }> {
  try {
    const p = getMariaDbPool();
    const conn = await p.getConnection();

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const truncateTables = [
      'account_payment',
      'account_move_line',
      'account_move',
      'caisse_session',
      'resultat_resultat_labo',
      'labo_echantillon',
      'labo_ligne_echantillon',
      'caisse_opcaisse_ligne',
      'caisse_opcaisse',
      'medical_consultation',
    ];

    for (const table of truncateTables) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
      } catch (err: any) {
        // Table may not exist yet or have different engine
        try {
          await conn.query(`DELETE FROM \`${table}\``);
        } catch (_) {}
      }
    }

    // Supprimer les patients de test dans res_partner en conservant les assurances et entreprises partenaires
    try {
      await conn.query(`DELETE FROM res_partner WHERE is_company = 0 AND is_insurance = 0 AND (partner_type = 'patient' OR partner_type IS NULL)`);
    } catch (_) {}

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    conn.release();

    return {
      success: true,
      message: 'Base MariaDB réinitialisée à zéro pour les tests : factures, encaissements, sessions, examens et patients purgés.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Impossible de vider MariaDB : ${err?.message}`,
    };
  }
}

/**
 * Retourne l'état complet du stockage
 */
export async function getFullStorageStatus(): Promise<DatabaseStatus> {
  const connResult = await testMariaDbConnection();
  const filePath = path.join(process.cwd(), 'data', 'db_store.json');

  return {
    driver: connResult.success ? 'mariadb' : 'json_disk',
    isConnected: connResult.success,
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    tableCounts: connResult.tableCounts || {},
    errorMessage: lastConnectionError || undefined,
    lastChecked: new Date().toISOString(),
    storageFilePath: filePath,
  };
}

