import fs from 'fs';
import path from 'path';
import {
  initialCountries,
  initialCurrencies,
  initialUoms,
  initialGroups,
  initialPartners,
  initialUsers,
  initialTaxes,
  initialProductTemplates,
  initialProductProducts,
  initialMoves,
  initialMoveLines,
  initialPayments,
  initialEmailNotifications,
  initialLabOrders,
  initialTillSessions,
  initialConsultations,
} from '../server/seedData';
import { DEFAULT_HOSPITAL_SERVICES } from '../src/data/defaultHospitalServices';

const escapeSql = (val: any): string => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
};

let sql = `-- ==========================================================================\n`;
sql += `-- BASE DE DONNÉES SIH - SYSTÈME HOSPITALIER, CLINIQUE & FINANCIER COMPLET\n`;
sql += `-- DUMP EXHAUSTIF POUR INJECTION LOCALE (PostgreSQL, MySQL, MariaDB, SQLite)\n`;
sql += `-- Date d'exportation : ${new Date().toISOString()}\n`;
sql += `-- Version du Schéma : 3.4.0-Production-Ready\n`;
sql += `-- ==========================================================================\n\n`;

sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

// 1. Countries
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 1. TABLE : res_country (${initialCountries.length} enregistrements)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS res_country (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(100) NOT NULL,\n`;
sql += `  code VARCHAR(10) NOT NULL\n`;
sql += `);\n\n`;
initialCountries.forEach((c) => {
  sql += `INSERT INTO res_country (id, name, code) VALUES (${c.id}, ${escapeSql(c.name)}, ${escapeSql(c.code)});\n`;
});
sql += `\n`;

// 2. Currencies
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 2. TABLE : res_currency (${initialCurrencies.length} enregistrements)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS res_currency (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(50) NOT NULL,\n`;
sql += `  symbol VARCHAR(10) NOT NULL,\n`;
sql += `  active TINYINT(1) DEFAULT 1\n`;
sql += `);\n\n`;
initialCurrencies.forEach((c) => {
  sql += `INSERT INTO res_currency (id, name, symbol, active) VALUES (${c.id}, ${escapeSql(c.name)}, ${escapeSql(c.symbol)}, ${c.active ? 1 : 0});\n`;
});
sql += `\n`;

// 3. Units of Measure
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 3. TABLE : uom_uom (${initialUoms.length} enregistrements)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS uom_uom (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(100) NOT NULL,\n`;
sql += `  factor DECIMAL(10, 4) DEFAULT 1.0000\n`;
sql += `);\n\n`;
initialUoms.forEach((u) => {
  sql += `INSERT INTO uom_uom (id, name, factor) VALUES (${u.id}, ${escapeSql(u.name)}, ${u.factor || 1.0});\n`;
});
sql += `\n`;

// 4. Security Groups & RBAC
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 4. TABLE : res_groups (${initialGroups.length} profils métier)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS res_groups (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(150) NOT NULL,\n`;
sql += `  description TEXT,\n`;
sql += `  permissions_json TEXT,\n`;
sql += `  created_at VARCHAR(50)\n`;
sql += `);\n\n`;
initialGroups.forEach((g) => {
  sql += `INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (${g.id}, ${escapeSql(g.name)}, ${escapeSql(g.description)}, ${escapeSql(g.permissions || [])}, ${escapeSql(g.created_at)});\n`;
});
sql += `\n`;

// 5. Users
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 5. TABLE : res_users (${initialUsers.length} comptes praticiens & personnel)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS res_users (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(200) NOT NULL,\n`;
sql += `  login VARCHAR(150) NOT NULL UNIQUE,\n`;
sql += `  email VARCHAR(200),\n`;
sql += `  role VARCHAR(100),\n`;
sql += `  department VARCHAR(100),\n`;
sql += `  phone VARCHAR(50),\n`;
sql += `  active TINYINT(1) DEFAULT 1,\n`;
sql += `  group_ids_json TEXT,\n`;
sql += `  permissions_json TEXT,\n`;
sql += `  created_at VARCHAR(50)\n`;
sql += `);\n\n`;
initialUsers.forEach((u: any) => {
  sql += `INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (${u.id}, ${escapeSql(u.name)}, ${escapeSql(u.login)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${escapeSql(u.department)}, ${escapeSql(u.phone)}, ${u.active ? 1 : 0}, ${escapeSql(u.group_ids || [])}, ${escapeSql(u.permissions || [])}, ${escapeSql(u.created_at)});\n`;
});
sql += `\n`;

// 6. Company & Clinic Settings
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 6. TABLE : company_settings (Configuration Établissement & SIH)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS company_settings (\n`;
sql += `  id INT PRIMARY KEY DEFAULT 1,\n`;
sql += `  name VARCHAR(255) NOT NULL,\n`;
sql += `  slogan VARCHAR(255),\n`;
sql += `  logo_url TEXT,\n`;
sql += `  primary_color VARCHAR(30),\n`;
sql += `  phone VARCHAR(100),\n`;
sql += `  email VARCHAR(150),\n`;
sql += `  address VARCHAR(255),\n`;
sql += `  city VARCHAR(100),\n`;
sql += `  country VARCHAR(100),\n`;
sql += `  rccm VARCHAR(100),\n`;
sql += `  tax_id VARCHAR(100),\n`;
sql += `  health_accreditation_number VARCHAR(100),\n`;
sql += `  currency_symbol VARCHAR(20),\n`;
sql += `  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,\n`;
sql += `  tax_exemption_default_reason TEXT,\n`;
sql += `  bank_name VARCHAR(150),\n`;
sql += `  bank_iban VARCHAR(100),\n`;
sql += `  bank_bic VARCHAR(50),\n`;
sql += `  mobile_money_numbers TEXT,\n`;
sql += `  medical_director_name VARCHAR(200),\n`;
sql += `  lab_turnaround_default VARCHAR(150),\n`;
sql += `  invoice_footer TEXT,\n`;
sql += `  hospital_services_json TEXT\n`;
sql += `);\n\n`;
sql += `INSERT INTO company_settings (id, name, slogan, logo_url, primary_color, phone, email, address, city, country, rccm, tax_id, health_accreditation_number, currency_symbol, default_tax_rate, tax_exemption_default_reason, bank_name, bank_iban, bank_bic, mobile_money_numbers, medical_director_name, lab_turnaround_default, invoice_footer, hospital_services_json) VALUES (1, 'LABORATOIRE D''ANALYSES MÉDICALES & BIOLOGIE CLINIQUE', 'Biologie Médicale, Diagnostics Spécialisés & Examens de Santé', '', '#0f172a', '+225 27 20 22 33 44 / +225 07 08 09 10 11', 'contact@laboratoire-biologie.ci', 'Plateau Medical Center, Bd Hassan II', 'Abidjan', 'Côte d''Ivoire', 'CI-ABJ-2024-B-12940', 'CI 01928374 A', 'AGR-MSHP-2024-0098', 'FCFA', 0.00, 'Exonération légale de TVA sur les prestations de biologie médicale (Art. 355 du CGI).', 'Société Générale Côte d''Ivoire (SGCI)', 'CI93 0100 2000 3000 4000 50', 'SGCIX01', 'Wave / Orange Money / Moov : +225 07 08 09 10 11', 'Dr. Aboubacar TOURÉ - Biologiste Médical Spécialiste', '2 heures à 24 heures selon la spécialité', 'Document délivré à titre de quittance médicale officielle.', ${escapeSql(DEFAULT_HOSPITAL_SERVICES)});\n\n`;

// 7. Partners (Patients, Assurances, Mutuelles, Fournisseurs)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 7. TABLE : res_partner (${initialPartners.length} patients, mutuelles & tiers-payeurs)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS res_partner (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(255) NOT NULL,\n`;
sql += `  is_company TINYINT(1) DEFAULT 0,\n`;
sql += `  email VARCHAR(255),\n`;
sql += `  phone VARCHAR(100),\n`;
sql += `  street VARCHAR(255),\n`;
sql += `  city VARCHAR(100),\n`;
sql += `  vat VARCHAR(100),\n`;
sql += `  customer_rank INT DEFAULT 0,\n`;
sql += `  supplier_rank INT DEFAULT 0,\n`;
sql += `  gender VARCHAR(10),\n`;
sql += `  age INT,\n`;
sql += `  birth_date VARCHAR(50),\n`;
sql += `  blood_group VARCHAR(10),\n`;
sql += `  emergency_contact VARCHAR(200),\n`;
sql += `  social_security_number VARCHAR(100),\n`;
sql += `  insurance_company VARCHAR(150),\n`;
sql += `  insurance_rate DECIMAL(5,2) DEFAULT 0.00,\n`;
sql += `  allergies_json TEXT,\n`;
sql += `  chronic_conditions_json TEXT\n`;
sql += `);\n\n`;
initialPartners.forEach((p: any) => {
  sql += `INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (${p.id}, ${escapeSql(p.name)}, ${p.is_company ? 1 : 0}, ${escapeSql(p.email)}, ${escapeSql(p.phone)}, ${escapeSql(p.street)}, ${escapeSql(p.city)}, ${escapeSql(p.vat)}, ${p.customer_rank || 0}, ${p.supplier_rank || 0}, ${escapeSql(p.gender)}, ${p.age || 'NULL'}, ${escapeSql(p.birth_date)}, ${escapeSql(p.blood_group)}, ${escapeSql(p.emergency_contact)}, ${escapeSql(p.social_security_number)}, ${escapeSql(p.insurance_company)}, ${p.insurance_rate || 0}, ${escapeSql(p.allergies || [])}, ${escapeSql(p.chronic_conditions || [])});\n`;
});
sql += `\n`;

// 8. Taxes
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 8. TABLE : account_tax (${initialTaxes.length} règles fiscales & TVA)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS account_tax (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(100) NOT NULL,\n`;
sql += `  amount DECIMAL(8,4) NOT NULL,\n`;
sql += `  amount_type VARCHAR(50) DEFAULT 'percent',\n`;
sql += `  type_tax_use VARCHAR(50) DEFAULT 'sale',\n`;
sql += `  active TINYINT(1) DEFAULT 1,\n`;
sql += `  description TEXT\n`;
sql += `);\n\n`;
initialTaxes.forEach((t: any) => {
  sql += `INSERT INTO account_tax (id, name, amount, amount_type, type_tax_use, active, description) VALUES (${t.id}, ${escapeSql(t.name)}, ${t.amount}, ${escapeSql(t.amount_type || 'percent')}, ${escapeSql(t.type_tax_use || 'sale')}, ${t.active ? 1 : 0}, ${escapeSql(t.description)});\n`;
});
sql += `\n`;

// 9. Products & Medical Acts Catalog
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 9. TABLE : product_product (${initialProductProducts.length} prestations, analyses, médicaments, actes)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS product_product (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(255) NOT NULL,\n`;
sql += `  default_code VARCHAR(100),\n`;
sql += `  list_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,\n`;
sql += `  standard_price DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  category_name VARCHAR(150),\n`;
sql += `  turnaround_time VARCHAR(100),\n`;
sql += `  sample_type VARCHAR(100),\n`;
sql += `  active TINYINT(1) DEFAULT 1,\n`;
sql += `  parameters_json TEXT\n`;
sql += `);\n\n`;
initialProductProducts.forEach((p: any) => {
  sql += `INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (${p.id}, ${escapeSql(p.name)}, ${escapeSql(p.default_code)}, ${p.list_price || 0}, ${p.standard_price || 0}, ${escapeSql(p.category_name || p.categ_id)}, ${escapeSql(p.turnaround_time)}, ${escapeSql(p.sample_type)}, ${p.active ? 1 : 0}, ${escapeSql(p.parameters || [])});\n`;
});
sql += `\n`;

// 10. Moves (Invoices, Receipts, Tickets)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 10. TABLE : account_move (${initialMoves.length} factures, quittances & avoirs)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS account_move (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(100) NOT NULL,\n`;
sql += `  move_type VARCHAR(50) NOT NULL,\n`;
sql += `  state VARCHAR(50) NOT NULL,\n`;
sql += `  partner_id INT,\n`;
sql += `  partner_name VARCHAR(255),\n`;
sql += `  date VARCHAR(50),\n`;
sql += `  invoice_date VARCHAR(50),\n`;
sql += `  invoice_date_due VARCHAR(50),\n`;
sql += `  amount_untaxed DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  amount_tax DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  amount_total DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  amount_residual DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  payment_state VARCHAR(50),\n`;
sql += `  invoice_user_id INT,\n`;
sql += `  invoice_user_name VARCHAR(150),\n`;
sql += `  insurance_share DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  patient_share DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  insurance_company VARCHAR(150),\n`;
sql += `  guarantee_letter_number VARCHAR(100),\n`;
sql += `  narration TEXT\n`;
sql += `);\n\n`;
initialMoves.forEach((m: any) => {
  sql += `INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (${m.id}, ${escapeSql(m.name)}, ${escapeSql(m.move_type)}, ${escapeSql(m.state)}, ${m.partner_id || 'NULL'}, ${escapeSql(m.partner_name)}, ${escapeSql(m.date)}, ${escapeSql(m.invoice_date)}, ${escapeSql(m.invoice_date_due)}, ${m.amount_untaxed || 0}, ${m.amount_tax || 0}, ${m.amount_total || 0}, ${m.amount_residual || 0}, ${escapeSql(m.payment_state)}, ${m.invoice_user_id || 'NULL'}, ${escapeSql(m.invoice_user_name)}, ${m.insurance_share || 0}, ${m.patient_share || m.amount_total || 0}, ${escapeSql(m.insurance_company)}, ${escapeSql(m.guarantee_letter_number)}, ${escapeSql(m.narration)});\n`;
});
sql += `\n`;

// 11. Move Lines (Invoice Items)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 11. TABLE : account_move_line (${initialMoveLines.length} lignes de facturation)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS account_move_line (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  move_id INT NOT NULL,\n`;
sql += `  product_id INT,\n`;
sql += `  name VARCHAR(255) NOT NULL,\n`;
sql += `  quantity DECIMAL(10,2) DEFAULT 1.00,\n`;
sql += `  price_unit DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  discount DECIMAL(5,2) DEFAULT 0.00,\n`;
sql += `  price_subtotal DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  price_total DECIMAL(15,2) DEFAULT 0.00\n`;
sql += `);\n\n`;
initialMoveLines.forEach((l: any) => {
  sql += `INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (${l.id}, ${l.move_id}, ${l.product_id || 'NULL'}, ${escapeSql(l.name)}, ${l.quantity || 1}, ${l.price_unit || 0}, ${l.discount || 0}, ${l.price_subtotal || 0}, ${l.price_total || 0});\n`;
});
sql += `\n`;

// 12. Payments
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 12. TABLE : account_payment (${initialPayments.length} encaissements & règlements)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS account_payment (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  payment_reference VARCHAR(100),\n`;
sql += `  partner_id INT,\n`;
sql += `  partner_name VARCHAR(255),\n`;
sql += `  move_id INT,\n`;
sql += `  invoice_name VARCHAR(100),\n`;
sql += `  amount DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  payment_date VARCHAR(50),\n`;
sql += `  state VARCHAR(50),\n`;
sql += `  payment_method_code VARCHAR(50),\n`;
sql += `  journal_name VARCHAR(100),\n`;
sql += `  cashier_name VARCHAR(150),\n`;
sql += `  transaction_reference VARCHAR(150)\n`;
sql += `);\n\n`;
initialPayments.forEach((p: any) => {
  sql += `INSERT INTO account_payment (id, payment_reference, partner_id, partner_name, move_id, invoice_name, amount, payment_date, state, payment_method_code, journal_name, cashier_name, transaction_reference) VALUES (${p.id}, ${escapeSql(p.payment_reference || p.name)}, ${p.partner_id || 'NULL'}, ${escapeSql(p.partner_name)}, ${p.move_id || 'NULL'}, ${escapeSql(p.invoice_name)}, ${p.amount || 0}, ${escapeSql(p.payment_date)}, ${escapeSql(p.state)}, ${escapeSql(p.payment_method_code)}, ${escapeSql(p.journal_name)}, ${escapeSql(p.cashier_name)}, ${escapeSql(p.transaction_reference)});\n`;
});
sql += `\n`;

// 13. Till Sessions
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 13. TABLE : till_session (${initialTillSessions.length} sessions & vacations de caisse)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS till_session (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  session_code VARCHAR(100) NOT NULL,\n`;
sql += `  user_id INT,\n`;
sql += `  cashier_name VARCHAR(150),\n`;
sql += `  state VARCHAR(50),\n`;
sql += `  opening_balance DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  closing_balance DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  total_collected DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  opening_date VARCHAR(50),\n`;
sql += `  closing_date VARCHAR(50),\n`;
sql += `  cash_difference DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  closing_notes TEXT\n`;
sql += `);\n\n`;
initialTillSessions.forEach((ts: any) => {
  sql += `INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (${ts.id}, ${escapeSql(ts.session_code)}, ${ts.user_id || 'NULL'}, ${escapeSql(ts.cashier_name)}, ${escapeSql(ts.state)}, ${ts.opening_balance || 0}, ${ts.closing_actual_cash || 0}, ${ts.total_collected || 0}, ${escapeSql(ts.opening_date)}, ${escapeSql(ts.closing_date)}, ${ts.cash_difference || 0}, ${escapeSql(ts.closing_notes)});\n`;
});
sql += `\n`;

// 14. Medical Consultations & Care
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 14. TABLE : medical_consultation (${initialConsultations.length} consultations cliniques, triage & constantes)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS medical_consultation (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255),\n`;
sql += `  doctor_name VARCHAR(200),\n`;
sql += `  specialty VARCHAR(100),\n`;
sql += `  date VARCHAR(50),\n`;
sql += `  status VARCHAR(50),\n`;
sql += `  chief_complaint TEXT,\n`;
sql += `  history_of_illness TEXT,\n`;
sql += `  blood_pressure VARCHAR(30),\n`;
sql += `  heart_rate INT,\n`;
sql += `  temperature DECIMAL(4,1),\n`;
sql += `  weight DECIMAL(5,2),\n`;
sql += `  height DECIMAL(5,2),\n`;
sql += `  spO2 INT,\n`;
sql += `  blood_glucose DECIMAL(6,2),\n`;
sql += `  triage_level INT DEFAULT 3,\n`;
sql += `  diagnosis_primary VARCHAR(255),\n`;
sql += `  diagnosis_icd10 VARCHAR(50),\n`;
sql += `  clinical_notes TEXT,\n`;
sql += `  prescriptions_json TEXT,\n`;
sql += `  lab_orders_json TEXT,\n`;
sql += `  imaging_orders_json TEXT\n`;
sql += `);\n\n`;
initialConsultations.forEach((c: any) => {
  sql += `INSERT INTO medical_consultation (id, partner_id, patient_name, doctor_name, specialty, date, status, chief_complaint, history_of_illness, blood_pressure, heart_rate, temperature, weight, height, spO2, blood_glucose, triage_level, diagnosis_primary, diagnosis_icd10, clinical_notes, prescriptions_json, lab_orders_json, imaging_orders_json) VALUES (${c.id}, ${c.partner_id}, ${escapeSql(c.patient_name)}, ${escapeSql(c.doctor_name)}, ${escapeSql(c.specialty)}, ${escapeSql(c.date)}, ${escapeSql(c.status)}, ${escapeSql(c.chief_complaint)}, ${escapeSql(c.history_of_illness)}, ${escapeSql(c.blood_pressure)}, ${c.heart_rate || 'NULL'}, ${c.temperature || 'NULL'}, ${c.weight || 'NULL'}, ${c.height || 'NULL'}, ${c.spO2 || 'NULL'}, ${c.blood_glucose || 'NULL'}, ${c.triage_level || 3}, ${escapeSql(c.diagnosis_primary)}, ${escapeSql(c.diagnosis_icd10 || c.diagnosis_code)}, ${escapeSql(c.clinical_notes)}, ${escapeSql(c.prescriptions || [])}, ${escapeSql(c.lab_orders || c.lab_order_ids || [])}, ${escapeSql(c.imaging_orders || [])});\n`;
});
sql += `\n`;

// 15. Lab Exam Orders (LIMS)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 15. TABLE : lab_exam_order (${initialLabOrders.length} dossiers d'analyses biologiques)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS lab_exam_order (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  order_number VARCHAR(100) NOT NULL,\n`;
sql += `  partner_id INT,\n`;
sql += `  partner_name VARCHAR(255),\n`;
sql += `  patient_gender VARCHAR(10),\n`;
sql += `  patient_age INT,\n`;
sql += `  prescribing_doctor VARCHAR(255),\n`;
sql += `  sampling_date VARCHAR(50),\n`;
sql += `  status VARCHAR(50),\n`;
sql += `  department VARCHAR(100),\n`;
sql += `  conclusion TEXT,\n`;
sql += `  technician_name VARCHAR(150),\n`;
sql += `  parameters_json TEXT\n`;
sql += `);\n\n`;
initialLabOrders.forEach((o) => {
  sql += `INSERT INTO lab_exam_order (id, order_number, partner_id, partner_name, patient_gender, patient_age, prescribing_doctor, sampling_date, status, department, conclusion, technician_name, parameters_json) VALUES (${o.id}, ${escapeSql(o.order_number)}, ${o.partner_id || 'NULL'}, ${escapeSql(o.partner_name)}, ${escapeSql(o.patient_gender)}, ${o.patient_age || 'NULL'}, ${escapeSql(o.prescribing_doctor)}, ${escapeSql(o.sampling_date)}, ${escapeSql(o.status)}, ${escapeSql(o.department)}, ${escapeSql(o.conclusion)}, ${escapeSql(o.technician_name)}, ${escapeSql(o.parameters || [])});\n`;
});
sql += `\n`;

// 16. Lab Exam Result Items (TABLE DES RÉSULTATS D'ANALYSES DÉTAILLÉS)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 16. TABLE : lab_exam_result_item (Lignes de Résultats d'Analyses Biologiques & Paillasse)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS lab_exam_result_item (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  order_id INT NOT NULL,\n`;
sql += `  parameter_name VARCHAR(255) NOT NULL,\n`;
sql += `  measured_value VARCHAR(100) NOT NULL,\n`;
sql += `  unit VARCHAR(50),\n`;
sql += `  reference_range VARCHAR(100),\n`;
sql += `  is_abnormal TINYINT(1) DEFAULT 0,\n`;
sql += `  notes TEXT\n`;
sql += `);\n\n`;

let resultItemCounter = 1;
initialLabOrders.forEach((o) => {
  if (Array.isArray(o.parameters)) {
    o.parameters.forEach((p: any) => {
      sql += `INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (${resultItemCounter++}, ${o.id}, ${escapeSql(p.name)}, ${escapeSql(p.value)}, ${escapeSql(p.unit)}, ${escapeSql(p.reference_range)}, ${p.is_abnormal ? 1 : 0}, ${escapeSql(p.notes || '')});\n`;
    });
  }
});
sql += `\n`;

// 17. Medical Prescription Lines (Lignes d'Ordonnances)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 17. TABLE : medical_prescription_line (Lignes d'Ordonnances et Médicaments Prescrits)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS medical_prescription_line (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  consultation_id INT NOT NULL,\n`;
sql += `  medication_name VARCHAR(255) NOT NULL,\n`;
sql += `  dosage VARCHAR(100),\n`;
sql += `  frequency VARCHAR(100),\n`;
sql += `  duration_days INT DEFAULT 7,\n`;
sql += `  instructions TEXT\n`;
sql += `);\n\n`;

let prescrCounter = 1;
initialConsultations.forEach((c: any) => {
  const list = c.prescriptions || c.prescribed_items || [];
  if (Array.isArray(list) && list.length > 0) {
    list.forEach((item: any) => {
      const medName = typeof item === 'string' ? item : item.name || item.medication || 'Médicament';
      const dosage = item.dosage || '500mg';
      const freq = item.frequency || item.posology || '1 cp x 3/j';
      const dur = item.duration_days || 7;
      const inst = item.instructions || 'À prendre après les repas';
      sql += `INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (${prescrCounter++}, ${c.id}, ${escapeSql(medName)}, ${escapeSql(dosage)}, ${escapeSql(freq)}, ${dur}, ${escapeSql(inst)});\n`;
    });
  } else {
    // Seed at least one standard prescription line for clinical demonstration
    sql += `INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (${prescrCounter++}, ${c.id}, 'Paracétamol DCI', '1000mg', '1 comprimé toutes les 8 heures si fièvre/douleur', 5, 'Ne pas dépasser 3g par jour');\n`;
  }
});
sql += `\n`;

// 18. Imaging Study Orders (Imagerie Médicale & Radiologie)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 18. TABLE : imaging_study_order (Examens d'Imagerie Médicale & Radiologie)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS imaging_study_order (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  order_number VARCHAR(100) NOT NULL,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  partner_name VARCHAR(255) NOT NULL,\n`;
sql += `  modality VARCHAR(100) NOT NULL,\n`;
sql += `  organ_region VARCHAR(150) NOT NULL,\n`;
sql += `  indication TEXT,\n`;
sql += `  status VARCHAR(50) NOT NULL,\n`;
sql += `  conclusion TEXT,\n`;
sql += `  radiologist_name VARCHAR(150),\n`;
sql += `  imaging_date VARCHAR(50)\n`;
sql += `);\n\n`;

const sampleImagingOrders = [
  { id: 1, order_number: 'RAD-2026-0001', partner_id: 1, partner_name: 'Global Tech Solutions SAS (M. Konan)', modality: 'Radiographie Numérique', organ_region: 'Thorax Face & Profil', indication: 'Bilan pré-embauche systématique et suspicion bronchite', status: 'validated', conclusion: 'Indice cardio-thoracique normal (ICT 0.46). Pas de foyer de condensation parenchymateuse décelable ni épanchement pleural.', radiologist_name: 'Dr. Sery Radiologue', imaging_date: '2026-02-15 09:30' },
  { id: 2, order_number: 'RAD-2026-0002', partner_id: 2, partner_name: 'Nexus Digital (Mme Fatou Diallo)', modality: 'Échographie', organ_region: 'Abdomino-Pelvienne', indication: 'Douleurs fosse iliaque droite fébriles', status: 'validated', conclusion: 'Appendice non épaissi, pas d\'épanchement du cul-de-sac de Douglas. Foie, vésicule et reins morphologiquement sans particularité.', radiologist_name: 'Dr. Sery Radiologue', imaging_date: '2026-02-28 10:15' },
  { id: 3, order_number: 'RAD-2026-0003', partner_id: 3, partner_name: 'Horizon Conseil (M. Jean-Paul Traoré)', modality: 'Électrocardiogramme (ECG)', organ_region: 'Cardiaque 12 dérivations', indication: 'Bilan HTA et palpitations à l\'effort', status: 'completed', conclusion: 'Rythme sinusal régulier à 72 bpm. Pas de trouble de la conduction ni de la repolarisation. Légère hypertrophie ventriculaire gauche (HVG électrique).', radiologist_name: 'Dr. Diallo Cardiologue', imaging_date: '2026-03-01 11:00' },
  { id: 4, order_number: 'RAD-2026-0004', partner_id: 4, partner_name: 'Cabinet Alpha Conseil (M. Yao Franck)', modality: 'Échographie Obstétricale', organ_region: 'Pelvis / Fœtale T2', indication: 'Échographie morphologique du 2ème trimestre (22 SA)', status: 'validated', conclusion: 'Grossesse monofœtale intra-utérine évolutive. Morphologie normale, liquide amniotique adapté, placenta postérieur haut inséré.', radiologist_name: 'Dr. Sery Radiologue', imaging_date: '2026-03-05 14:00' }
];

sampleImagingOrders.forEach((im) => {
  sql += `INSERT INTO imaging_study_order (id, order_number, partner_id, partner_name, modality, organ_region, indication, status, conclusion, radiologist_name, imaging_date) VALUES (${im.id}, ${escapeSql(im.order_number)}, ${im.partner_id}, ${escapeSql(im.partner_name)}, ${escapeSql(im.modality)}, ${escapeSql(im.organ_region)}, ${escapeSql(im.indication)}, ${escapeSql(im.status)}, ${escapeSql(im.conclusion)}, ${escapeSql(im.radiologist_name)}, ${escapeSql(im.imaging_date)});\n`;
});
sql += `\n`;

// 19. Pediatric Records & Vaccination (Pédiatrie & PEV)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 19. TABLES : pediatric_patient_record & pediatric_vaccination_schedule (Pédiatrie & PEV)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS pediatric_patient_record (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
sql += `  birth_weight_kg DECIMAL(4,2),\n`;
sql += `  head_circumference_cm DECIMAL(4,1),\n`;
sql += `  apgar_score VARCHAR(20),\n`;
sql += `  maternal_history TEXT,\n`;
sql += `  nutrition_status VARCHAR(100),\n`;
sql += `  updated_at VARCHAR(50)\n`;
sql += `);\n\n`;

sql += `INSERT INTO pediatric_patient_record (id, partner_id, patient_name, birth_weight_kg, head_circumference_cm, apgar_score, maternal_history, nutrition_status, updated_at) VALUES (1, 1, 'Enfant Konan Junior', 3.35, 34.5, '9/10 - 10/10', 'Grossesse menée à terme, sans complication gravidique', 'Allaitement maternel exclusif bien conduit (Normotrophe)', '2026-02-15T10:00:00Z');\n`;
sql += `INSERT INTO pediatric_patient_record (id, partner_id, patient_name, birth_weight_kg, head_circumference_cm, apgar_score, maternal_history, nutrition_status, updated_at) VALUES (2, 2, 'Bébé Diallo Aïcha', 3.10, 33.8, '8/10 - 10/10', 'Accouchement voie basse spontané', 'Diversification alimentaire débutée (Poids/Âge Médiane OMS)', '2026-02-28T11:00:00Z');\n\n`;

sql += `CREATE TABLE IF NOT EXISTS pediatric_vaccination_schedule (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  vaccine_name VARCHAR(150) NOT NULL,\n`;
sql += `  dose_number INT NOT NULL,\n`;
sql += `  target_age VARCHAR(50) NOT NULL,\n`;
sql += `  administration_date VARCHAR(50),\n`;
sql += `  status VARCHAR(50) NOT NULL,\n`;
sql += `  batch_number VARCHAR(100),\n`;
sql += `  vaccinator_name VARCHAR(150)\n`;
sql += `);\n\n`;

const sampleVaccines = [
  { partner_id: 1, vaccine_name: 'BCG + Polio 0 (VPO-0)', dose_number: 1, target_age: 'À la naissance', administration_date: '2025-11-10', status: 'administered', batch_number: 'BCG-2025-X89', vaccinator_name: 'Inf. Kassi' },
  { partner_id: 1, vaccine_name: 'Pentavalent 1 (DTC-HepB-Hib) + VPO-1 + Pneumo-1', dose_number: 1, target_age: '6 Semaines', administration_date: '2025-12-22', status: 'administered', batch_number: 'PNT-2025-K44', vaccinator_name: 'Inf. Kassi' },
  { partner_id: 1, vaccine_name: 'Pentavalent 2 + VPO-2 + Pneumo-2 + Rota-2', dose_number: 2, target_age: '10 Semaines', administration_date: '2026-01-20', status: 'administered', batch_number: 'PNT-2026-A12', vaccinator_name: 'Inf. Kassi' },
  { partner_id: 1, vaccine_name: 'Pentavalent 3 + VPO-3 + VPI + Pneumo-3', dose_number: 3, target_age: '14 Semaines', administration_date: '2026-02-18', status: 'administered', batch_number: 'PNT-2026-B88', vaccinator_name: 'Inf. Kassi' },
  { partner_id: 1, vaccine_name: 'Rougeole-Rubéole 1 (RR-1) + Fièvre Jaune (VAA)', dose_number: 1, target_age: '9 Mois', administration_date: '2026-08-10', status: 'scheduled', batch_number: 'EN ATTENTE', vaccinator_name: 'À planifier' },
  { partner_id: 2, vaccine_name: 'BCG + Polio 0', dose_number: 1, target_age: 'À la naissance', administration_date: '2025-12-05', status: 'administered', batch_number: 'BCG-2025-Z90', vaccinator_name: 'Inf. Kassi' },
  { partner_id: 2, vaccine_name: 'Pentavalent 1 + VPO-1', dose_number: 1, target_age: '6 Semaines', administration_date: '2026-01-16', status: 'administered', batch_number: 'PNT-2026-A10', vaccinator_name: 'Inf. Kassi' }
];

sampleVaccines.forEach((v) => {
  sql += `INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (${v.partner_id}, ${escapeSql(v.vaccine_name)}, ${v.dose_number}, ${escapeSql(v.target_age)}, ${escapeSql(v.administration_date)}, ${escapeSql(v.status)}, ${escapeSql(v.batch_number)}, ${escapeSql(v.vaccinator_name)});\n`;
});
sql += `\n`;

// 20. Maternity & Obstetrics (Maternité, CPN & Accouchements)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 20. TABLES : maternity_prenatal_cpn & maternity_delivery_record (Maternité & CPN)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS maternity_prenatal_cpn (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
sql += `  cpn_number INT NOT NULL,\n`;
sql += `  gestational_age_weeks INT NOT NULL,\n`;
sql += `  fundal_height_cm DECIMAL(4,1),\n`;
sql += `  fetal_heart_rate INT,\n`;
sql += `  blood_pressure VARCHAR(30),\n`;
sql += `  proteinuria VARCHAR(50),\n`;
sql += `  glycosuria VARCHAR(50),\n`;
sql += `  ultrasound_notes TEXT,\n`;
sql += `  consultation_date VARCHAR(50),\n`;
sql += `  midwife_name VARCHAR(150)\n`;
sql += `);\n\n`;

const sampleCPN = [
  { partner_id: 2, patient_name: 'Mme Fatou Diallo', cpn_number: 1, gestational_age_weeks: 12, fundal_height_cm: 12.0, fetal_heart_rate: 154, blood_pressure: '110/70', proteinuria: 'Négatif', glycosuria: 'Négatif', ultrasound_notes: 'Sac gestationnel unique intra-utérin, clarté nucale normale (1.2mm).', consultation_date: '2025-10-14', midwife_name: 'Sage-Femme Clarisse' },
  { partner_id: 2, patient_name: 'Mme Fatou Diallo', cpn_number: 2, gestational_age_weeks: 20, fundal_height_cm: 19.5, fetal_heart_rate: 148, blood_pressure: '115/75', proteinuria: 'Négatif', glycosuria: 'Négatif', ultrasound_notes: 'Fœtus actif, morphologie satisfaisante, mouvements fœtaux bien perçus.', consultation_date: '2025-12-10', midwife_name: 'Sage-Femme Clarisse' },
  { partner_id: 2, patient_name: 'Mme Fatou Diallo', cpn_number: 3, gestational_age_weeks: 28, fundal_height_cm: 27.0, fetal_heart_rate: 142, blood_pressure: '120/80', proteinuria: 'Négatif', glycosuria: 'Négatif', ultrasound_notes: 'Présentation céphalique, croissance régulière au 50ème percentile.', consultation_date: '2026-02-04', midwife_name: 'Sage-Femme Clarisse' },
  { partner_id: 4, patient_name: 'Mme Yao Affoué', cpn_number: 1, gestational_age_weeks: 14, fundal_height_cm: 14.0, fetal_heart_rate: 150, blood_pressure: '110/68', proteinuria: 'Négatif', glycosuria: 'Négatif', ultrasound_notes: 'Grossesse débutante évolutive sans anomalie.', consultation_date: '2026-03-01', midwife_name: 'Sage-Femme Clarisse' }
];

sampleCPN.forEach((cpn) => {
  sql += `INSERT INTO maternity_prenatal_cpn (partner_id, patient_name, cpn_number, gestational_age_weeks, fundal_height_cm, fetal_heart_rate, blood_pressure, proteinuria, glycosuria, ultrasound_notes, consultation_date, midwife_name) VALUES (${cpn.partner_id}, ${escapeSql(cpn.patient_name)}, ${cpn.cpn_number}, ${cpn.gestational_age_weeks}, ${cpn.fundal_height_cm}, ${cpn.fetal_heart_rate}, ${escapeSql(cpn.blood_pressure)}, ${escapeSql(cpn.proteinuria)}, ${escapeSql(cpn.glycosuria)}, ${escapeSql(cpn.ultrasound_notes)}, ${escapeSql(cpn.consultation_date)}, ${escapeSql(cpn.midwife_name)});\n`;
});
sql += `\n`;

sql += `CREATE TABLE IF NOT EXISTS maternity_delivery_record (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
sql += `  delivery_date VARCHAR(50) NOT NULL,\n`;
sql += `  delivery_mode VARCHAR(100) NOT NULL,\n`;
sql += `  newborn_gender VARCHAR(10) NOT NULL,\n`;
sql += `  birth_weight_g INT NOT NULL,\n`;
sql += `  apgar_1min INT NOT NULL,\n`;
sql += `  apgar_5min INT NOT NULL,\n`;
sql += `  midwife_name VARCHAR(150),\n`;
sql += `  complications TEXT\n`;
sql += `);\n\n`;

sql += `INSERT INTO maternity_delivery_record (partner_id, patient_name, delivery_date, delivery_mode, newborn_gender, birth_weight_g, apgar_1min, apgar_5min, midwife_name, complications) VALUES (2, 'Mme Fatou Diallo', '2026-02-28 04:15', 'Voie Basse Eutocique', 'F', 3100, 9, 10, 'Sage-Femme Clarisse', 'Aucune complication. Délivrance complète spontanée, périnée intact.');\n\n`;

// 21. Hospitalization & Beds (Hospitalisation & Gestion des Lits)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 21. TABLE : hospital_admission (Hospitalisations & Affectation des Lits)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS hospital_admission (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
sql += `  room_number VARCHAR(50) NOT NULL,\n`;
sql += `  bed_number VARCHAR(50) NOT NULL,\n`;
sql += `  department VARCHAR(100) NOT NULL,\n`;
sql += `  admission_date VARCHAR(50) NOT NULL,\n`;
sql += `  discharge_date VARCHAR(50),\n`;
sql += `  admission_reason TEXT,\n`;
sql += `  attending_doctor VARCHAR(150),\n`;
sql += `  state VARCHAR(50) NOT NULL\n`;
sql += `);\n\n`;

const sampleAdmissions = [
  { id: 1, partner_id: 1, patient_name: 'M. Konan (Global Tech)', room_number: 'CH-102', bed_number: 'LIT-01', department: 'Médecine Interne', admission_date: '2026-02-15 10:00', discharge_date: '2026-02-18 14:00', admission_reason: 'Surveillance crise hypertensive & bilan rénal', attending_doctor: 'Dr. Yao Kouamé', state: 'discharged' },
  { id: 2, partner_id: 2, patient_name: 'Mme Fatou Diallo', room_number: 'MAT-01', bed_number: 'LIT-02', department: 'Maternité / Suites de Couches', admission_date: '2026-02-27 22:30', discharge_date: '2026-03-02 11:00', admission_reason: 'Travail d\'accouchement et suites de couches', attending_doctor: 'Dr. Bamba Lamine', state: 'discharged' },
  { id: 3, partner_id: 3, patient_name: 'M. Jean-Paul Traoré', room_number: 'CH-204', bed_number: 'LIT-01', department: 'Chirurgie / Traumatologie', admission_date: '2026-03-01 08:30', discharge_date: null, admission_reason: 'Observation post-intervention hernie inguinale', attending_doctor: 'Dr. Yao Kouamé', state: 'active' },
  { id: 4, partner_id: 4, patient_name: 'M. Yao Franck', room_number: 'PED-02', bed_number: 'LIT-01', department: 'Pédiatrie', admission_date: '2026-03-05 09:00', discharge_date: null, admission_reason: 'Gastro-entérite aiguë fébrile avec déshydratation modérée', attending_doctor: 'Dr. Touré Aminata', state: 'active' }
];

sampleAdmissions.forEach((adm) => {
  sql += `INSERT INTO hospital_admission (id, partner_id, patient_name, room_number, bed_number, department, admission_date, discharge_date, admission_reason, attending_doctor, state) VALUES (${adm.id}, ${adm.partner_id}, ${escapeSql(adm.patient_name)}, ${escapeSql(adm.room_number)}, ${escapeSql(adm.bed_number)}, ${escapeSql(adm.department)}, ${escapeSql(adm.admission_date)}, ${escapeSql(adm.discharge_date)}, ${escapeSql(adm.admission_reason)}, ${escapeSql(adm.attending_doctor)}, ${escapeSql(adm.state)});\n`;
});
sql += `\n`;

// 22. Pharmacy & Dispensations (Pharmacie & Stocks)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 22. TABLES : pharmacy_stock_item & pharmacy_dispensation_log (Pharmacie & Stocks)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS pharmacy_stock_item (\n`;
sql += `  id INT PRIMARY KEY,\n`;
sql += `  name VARCHAR(255) NOT NULL,\n`;
sql += `  dci_code VARCHAR(100),\n`;
sql += `  category VARCHAR(100),\n`;
sql += `  dosage_form VARCHAR(100),\n`;
sql += `  standard_price DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  list_price DECIMAL(15,2) DEFAULT 0.00,\n`;
sql += `  quantity_available INT DEFAULT 0,\n`;
sql += `  min_alert_threshold INT DEFAULT 10,\n`;
sql += `  expiry_date VARCHAR(50),\n`;
sql += `  batch_lot VARCHAR(100)\n`;
sql += `);\n\n`;

const samplePharmacyStock = [
  { id: 1, name: 'Paracétamol 1000mg Bte/16', dci_code: 'PAR-1G-CPR', category: 'Antalgique / Antipyrétique', dosage_form: 'Comprimé sécable', standard_price: 650, list_price: 1200, quantity_available: 340, min_alert_threshold: 50, expiry_date: '2028-06-30', batch_lot: 'LOT-PAR-2401' },
  { id: 2, name: 'Amoxicilline + Acide Clavulanique 1g Bte/14', dci_code: 'AMX-CLAV-1G', category: 'Antibiotique Bêta-lactamine', dosage_form: 'Comprimé pelliculé', standard_price: 3200, list_price: 5800, quantity_available: 125, min_alert_threshold: 30, expiry_date: '2027-12-31', batch_lot: 'LOT-AMX-2409' },
  { id: 3, name: 'Artéméther + Luméfantrine 20/120mg Bte/24', dci_code: 'CTA-ART-LUM', category: 'Antipaludique CTA', dosage_form: 'Comprimé', standard_price: 1800, list_price: 3500, quantity_available: 210, min_alert_threshold: 40, expiry_date: '2028-03-31', batch_lot: 'LOT-CTA-2503' },
  { id: 4, name: 'Sérum Salé Isotonique NaCl 0.9% 500ml', dci_code: 'PERF-NACL-500', category: 'Soluté de Perfusion', dosage_form: 'Poche pour perfusion', standard_price: 800, list_price: 1600, quantity_available: 180, min_alert_threshold: 60, expiry_date: '2029-01-31', batch_lot: 'LOT-NACL-2404' },
  { id: 5, name: 'Oméprazole 20mg Gélule Bte/28', dci_code: 'IPP-OME-20MG', category: 'Inhibiteur Pompe à Protons', dosage_form: 'Gélule gastro-résistante', standard_price: 2100, list_price: 4200, quantity_available: 95, min_alert_threshold: 25, expiry_date: '2027-08-31', batch_lot: 'LOT-OME-2408' },
  { id: 6, name: 'Ceftriaxone 1g Injectable IV/IM', dci_code: 'CEF-1G-INJ', category: 'Céphalosporine 3G', dosage_form: 'Flacon injectable + solvant', standard_price: 2400, list_price: 4500, quantity_available: 75, min_alert_threshold: 20, expiry_date: '2027-11-30', batch_lot: 'LOT-CEF-2411' }
];

samplePharmacyStock.forEach((st) => {
  sql += `INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (${st.id}, ${escapeSql(st.name)}, ${escapeSql(st.dci_code)}, ${escapeSql(st.category)}, ${escapeSql(st.dosage_form)}, ${st.standard_price}, ${st.list_price}, ${st.quantity_available}, ${st.min_alert_threshold}, ${escapeSql(st.expiry_date)}, ${escapeSql(st.batch_lot)});\n`;
});
sql += `\n`;

sql += `CREATE TABLE IF NOT EXISTS pharmacy_dispensation_log (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  prescription_id INT,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
sql += `  medication_name VARCHAR(255) NOT NULL,\n`;
sql += `  quantity_dispensed INT NOT NULL,\n`;
sql += `  dispensation_date VARCHAR(50) NOT NULL,\n`;
sql += `  pharmacist_name VARCHAR(150) NOT NULL,\n`;
sql += `  status VARCHAR(50) NOT NULL\n`;
sql += `);\n\n`;

sql += `INSERT INTO pharmacy_dispensation_log (prescription_id, partner_id, patient_name, medication_name, quantity_dispensed, dispensation_date, pharmacist_name, status) VALUES (1, 1, 'M. Konan (Global Tech)', 'Paracétamol 1000mg Bte/16', 2, '2026-02-15 11:30', 'Pharm. Estelle N''Goran', 'delivered');\n`;
sql += `INSERT INTO pharmacy_dispensation_log (prescription_id, partner_id, patient_name, medication_name, quantity_dispensed, dispensation_date, pharmacist_name, status) VALUES (2, 2, 'Mme Fatou Diallo', 'Amoxicilline + Clavulanique 1g Bte/14', 1, '2026-02-28 12:00', 'Pharm. Estelle N''Goran', 'delivered');\n\n`;

// 23. Nursing Care Acts (Soins Infirmiers & Surveillance)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 23. TABLE : nurse_care_act (Actes Infirmiers, Perfusions & Pansements)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS nurse_care_act (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  partner_id INT NOT NULL,\n`;
sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
sql += `  consultation_id INT,\n`;
sql += `  act_type VARCHAR(150) NOT NULL,\n`;
sql += `  description TEXT,\n`;
sql += `  administered_at VARCHAR(50) NOT NULL,\n`;
sql += `  nurse_name VARCHAR(150) NOT NULL,\n`;
sql += `  status VARCHAR(50) NOT NULL,\n`;
sql += `  notes TEXT\n`;
sql += `);\n\n`;

const sampleNurseActs = [
  { partner_id: 1, patient_name: 'M. Konan (Global Tech)', consultation_id: 1, act_type: 'Pose Voie Veineuse Périphérique & Perfusion NaCl 0.9%', description: 'Pose cathéter 20G pli du coude gauche sans complication, débit 30 gttes/min', administered_at: '2026-02-15 09:15', nurse_name: 'Inf. Kassi Kouamé', status: 'completed', notes: 'Bonne tolérance clinique, point de ponction propre' },
  { partner_id: 2, patient_name: 'Mme Fatou Diallo', consultation_id: 2, act_type: 'Pansement stérile & Soin de plaie', description: 'Réfection pansement chirurgical aseptique avec bétadine dermique', administered_at: '2026-02-28 10:00', nurse_name: 'Inf. Kassi Kouamé', status: 'completed', notes: 'Cicatrisation en bonne voie, pas d\'inflammation' },
  { partner_id: 3, patient_name: 'M. Jean-Paul Traoré', consultation_id: 3, act_type: 'Injection Intramusculaire Antalgique', description: 'Administration IM fesse droite Diclofénac 75mg', administered_at: '2026-03-01 10:30', nurse_name: 'Inf. Kassi Kouamé', status: 'completed', notes: 'Soulagement rapide de la douleur évaluée à EVA 2/10 après 30 min' }
];

sampleNurseActs.forEach((act) => {
  sql += `INSERT INTO nurse_care_act (partner_id, patient_name, consultation_id, act_type, description, administered_at, nurse_name, status, notes) VALUES (${act.partner_id}, ${escapeSql(act.patient_name)}, ${act.consultation_id || 'NULL'}, ${escapeSql(act.act_type)}, ${escapeSql(act.description)}, ${escapeSql(act.administered_at)}, ${escapeSql(act.nurse_name)}, ${escapeSql(act.status)}, ${escapeSql(act.notes)});\n`;
});
sql += `\n`;

// 24. Audit Trail & Notifications (Traçabilité & Alertes)
sql += `-- --------------------------------------------------------------------------\n`;
sql += `-- 24. TABLES : res_audit_log & res_notification (Journal d'Audit & Notifications)\n`;
sql += `-- --------------------------------------------------------------------------\n`;
sql += `CREATE TABLE IF NOT EXISTS res_audit_log (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  user_name VARCHAR(150) NOT NULL,\n`;
sql += `  action_type VARCHAR(100) NOT NULL,\n`;
sql += `  entity_name VARCHAR(100) NOT NULL,\n`;
sql += `  entity_id VARCHAR(100),\n`;
sql += `  timestamp VARCHAR(50) NOT NULL,\n`;
sql += `  details TEXT\n`;
sql += `);\n\n`;

sql += `INSERT INTO res_audit_log (user_name, action_type, entity_name, entity_id, timestamp, details) VALUES ('Administrateur Système', 'LOGIN', 'res_users', '1', '2026-03-01T08:00:00Z', 'Connexion réussie depuis IP autorisée');\n`;
sql += `INSERT INTO res_audit_log (user_name, action_type, entity_name, entity_id, timestamp, details) VALUES ('Jean Facturier', 'CREATE_INVOICE', 'account_move', '1', '2026-03-01T09:15:00Z', 'Création et transmission facture FAC/2026/0001');\n`;
sql += `INSERT INTO res_audit_log (user_name, action_type, entity_name, entity_id, timestamp, details) VALUES ('Marcelle Caissière', 'REGISTER_PAYMENT', 'account_payment', '1', '2026-03-01T09:30:00Z', 'Encaissement 5 400.00 FCFA avec émission reçu');\n\n`;

sql += `CREATE TABLE IF NOT EXISTS res_notification (\n`;
sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
sql += `  recipient VARCHAR(150) NOT NULL,\n`;
sql += `  title VARCHAR(200) NOT NULL,\n`;
sql += `  message TEXT NOT NULL,\n`;
sql += `  type VARCHAR(50) NOT NULL,\n`;
sql += `  is_read TINYINT(1) DEFAULT 0,\n`;
sql += `  created_at VARCHAR(50) NOT NULL\n`;
sql += `);\n\n`;

sql += `INSERT INTO res_notification (recipient, title, message, type, is_read, created_at) VALUES ('Tous les Utilisateurs', 'Système Opérationnel', 'Bienvenue sur la plateforme SIH & Clinique. Sauvegarde automatisée active.', 'system', 1, '2026-03-01T08:00:00Z');\n`;
sql += `INSERT INTO res_notification (recipient, title, message, type, is_read, created_at) VALUES ('Marcelle Caissière', 'Session Ouverte', 'Votre session de caisse SESSION00793 est ouverte et prête pour les règlements.', 'cash', 0, '2026-03-01T08:30:00Z');\n\n`;

sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
sql += `-- ==========================================================================\n`;
sql += `-- FIN DU DUMP EXHAUSTIF - ${new Date().toLocaleDateString('fr-FR')}\n`;
sql += `-- ==========================================================================\n`;

const targetPath = path.join(process.cwd(), 'database_dump_exhaustive.sql');
fs.writeFileSync(targetPath, sql, 'utf8');
console.log(`✅ Dump exhaustif généré avec succès dans : ${targetPath} (${Buffer.byteLength(sql)} octets)`);
