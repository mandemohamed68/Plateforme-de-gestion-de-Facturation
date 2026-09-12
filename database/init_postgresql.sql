-- ==============================================================================
-- BASE DE DONNÉES : GESTION DE FACTURATION MÉDICALE, CAISSE & LABORATOIRE
-- SCRIPT D'INITIALISATION COMPLET POUR POSTGRESQL 14+ / 15+ / 16+
-- ==============================================================================

-- 1. Table : company_settings
DROP TABLE IF EXISTS company_settings CASCADE;
CREATE TABLE company_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slogan VARCHAR(255) DEFAULT '',
  logo_url TEXT DEFAULT NULL,
  primary_color VARCHAR(32) DEFAULT '#0f172a',
  sidebar_color VARCHAR(32) DEFAULT '#0b1329',
  secondary_color VARCHAR(32) DEFAULT '#0284c7',
  phone VARCHAR(128) DEFAULT '',
  email VARCHAR(128) DEFAULT '',
  address TEXT DEFAULT NULL,
  city VARCHAR(128) DEFAULT '',
  country VARCHAR(128) DEFAULT 'Côte d''Ivoire',
  rccm VARCHAR(128) DEFAULT '',
  tax_id VARCHAR(128) DEFAULT '',
  health_accreditation_number VARCHAR(128) DEFAULT '',
  currency_symbol VARCHAR(16) DEFAULT 'FCFA',
  default_tax_rate NUMERIC(5,2) DEFAULT 0.00,
  tax_exemption_default_reason TEXT DEFAULT NULL,
  bank_name VARCHAR(255) DEFAULT '',
  bank_iban VARCHAR(128) DEFAULT '',
  bank_bic VARCHAR(64) DEFAULT '',
  mobile_money_numbers VARCHAR(255) DEFAULT '',
  show_watermark BOOLEAN DEFAULT TRUE,
  watermark_text VARCHAR(255) DEFAULT 'DOCUMENT CONFIDENTIEL ET OFFICIEL',
  watermark_type VARCHAR(32) DEFAULT 'both',
  watermark_opacity NUMERIC(3,2) DEFAULT 0.12,
  flash_news_enabled BOOLEAN DEFAULT TRUE,
  flash_news_speed INT DEFAULT 6,
  invoice_footer TEXT DEFAULT NULL,
  ndm_prefix VARCHAR(32) DEFAULT 'CHU-',
  ndm_digits INT DEFAULT 8,
  ndm_next_number INT DEFAULT 1001,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table : res_groups
DROP TABLE IF EXISTS res_groups CASCADE;
CREATE TABLE res_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT DEFAULT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table : res_partners
DROP TABLE IF EXISTS res_partners CASCADE;
CREATE TABLE res_partners (
  id SERIAL PRIMARY KEY,
  ndm VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) DEFAULT NULL,
  is_company BOOLEAN DEFAULT FALSE,
  partner_type VARCHAR(32) DEFAULT 'patient',
  gender VARCHAR(16) DEFAULT 'M',
  birth_date DATE DEFAULT NULL,
  age INT DEFAULT NULL,
  email VARCHAR(128) DEFAULT NULL,
  phone VARCHAR(64) DEFAULT NULL,
  street TEXT DEFAULT NULL,
  city VARCHAR(128) DEFAULT NULL,
  country VARCHAR(128) DEFAULT 'Côte d''Ivoire',
  is_insurance BOOLEAN DEFAULT FALSE,
  insurance_id INT DEFAULT NULL,
  insurance_name VARCHAR(255) DEFAULT NULL,
  insurance_policy_number VARCHAR(128) DEFAULT NULL,
  insurance_coverage_rate NUMERIC(5,2) DEFAULT 0.00,
  prescribing_doctor VARCHAR(255) DEFAULT NULL,
  civil_status VARCHAR(64) DEFAULT NULL,
  profession VARCHAR(128) DEFAULT NULL,
  nationality VARCHAR(128) DEFAULT 'Ivoirienne',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pg_partner_ndm ON res_partners(ndm);
CREATE INDEX idx_pg_partner_name ON res_partners(name);

-- 4. Table : res_users
DROP TABLE IF EXISTS res_users CASCADE;
CREATE TABLE res_users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(128) DEFAULT NULL,
  role VARCHAR(128) NOT NULL,
  department VARCHAR(128) DEFAULT 'Direction',
  partner_id INT DEFAULT NULL,
  group_ids JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pg_user_login ON res_users(login);

-- 5. Table : account_taxes
DROP TABLE IF EXISTS account_taxes CASCADE;
CREATE TABLE account_taxes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  amount NUMERIC(5,2) NOT NULL,
  description TEXT DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- 6. Table : product_products
DROP TABLE IF EXISTS product_products CASCADE;
CREATE TABLE product_products (
  id SERIAL PRIMARY KEY,
  default_code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  list_price NUMERIC(12,2) NOT NULL,
  standard_price NUMERIC(12,2) DEFAULT 0.00,
  category VARCHAR(128) DEFAULT 'Biologie Médicale',
  sample_type VARCHAR(128) DEFAULT 'Sang Total / Sérum',
  turnaround_time VARCHAR(64) DEFAULT '24 heures',
  reference_values TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table : till_sessions
DROP TABLE IF EXISTS till_sessions CASCADE;
CREATE TABLE till_sessions (
  id SERIAL PRIMARY KEY,
  session_code VARCHAR(64) UNIQUE NOT NULL,
  till_name VARCHAR(128) NOT NULL,
  cashier_id INT NOT NULL,
  cashier_name VARCHAR(255) NOT NULL,
  opening_balance NUMERIC(12,2) DEFAULT 0.00,
  total_collected NUMERIC(12,2) DEFAULT 0.00,
  total_cash_collected NUMERIC(12,2) DEFAULT 0.00,
  total_mobile_money_collected NUMERIC(12,2) DEFAULT 0.00,
  total_card_collected NUMERIC(12,2) DEFAULT 0.00,
  total_check_collected NUMERIC(12,2) DEFAULT 0.00,
  transactions_count INT DEFAULT 0,
  state VARCHAR(32) DEFAULT 'in_progress',
  opening_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  closing_date TIMESTAMPTZ DEFAULT NULL,
  closing_actual_cash NUMERIC(12,2) DEFAULT NULL,
  cash_variance NUMERIC(12,2) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  close_notes TEXT DEFAULT NULL
);

-- 8. Table : account_moves
DROP TABLE IF EXISTS account_moves CASCADE;
CREATE TABLE account_moves (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  move_type VARCHAR(32) NOT NULL DEFAULT 'out_invoice',
  state VARCHAR(32) DEFAULT 'draft',
  payment_state VARCHAR(32) DEFAULT 'not_paid',
  invoice_date DATE NOT NULL,
  invoice_date_due DATE NOT NULL,
  partner_id INT NOT NULL REFERENCES res_partners(id) ON DELETE CASCADE,
  till_session_id INT DEFAULT NULL,
  invoice_user_id INT DEFAULT NULL,
  amount_untaxed NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_residual NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  patient_share_amount NUMERIC(12,2) DEFAULT 0.00,
  insurance_share_amount NUMERIC(12,2) DEFAULT 0.00,
  coverage_rate NUMERIC(5,2) DEFAULT 0.00,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table : account_move_lines
DROP TABLE IF EXISTS account_move_lines CASCADE;
CREATE TABLE account_move_lines (
  id SERIAL PRIMARY KEY,
  move_id INT NOT NULL REFERENCES account_moves(id) ON DELETE CASCADE,
  product_id INT DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  price_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(5,2) DEFAULT 0.00,
  price_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  price_total NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- 10. Table : account_payments
DROP TABLE IF EXISTS account_payments CASCADE;
CREATE TABLE account_payments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  move_id INT DEFAULT NULL,
  partner_id INT NOT NULL REFERENCES res_partners(id) ON DELETE CASCADE,
  till_session_id INT DEFAULT NULL,
  cashier_id INT DEFAULT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  payment_method_id VARCHAR(64) NOT NULL DEFAULT 'cash',
  journal_id INT DEFAULT 1,
  state VARCHAR(32) DEFAULT 'posted',
  communication VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table : partner_reductions
DROP TABLE IF EXISTS partner_reductions CASCADE;
CREATE TABLE partner_reductions (
  id SERIAL PRIMARY KEY,
  partner_type VARCHAR(128) NOT NULL,
  category_name VARCHAR(128) NOT NULL DEFAULT 'All',
  discount_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Table : lab_exam_orders
DROP TABLE IF EXISTS lab_exam_orders CASCADE;
CREATE TABLE lab_exam_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  partner_id INT NOT NULL REFERENCES res_partners(id) ON DELETE CASCADE,
  move_id INT DEFAULT NULL,
  prescribing_doctor VARCHAR(255) DEFAULT NULL,
  clinical_notes TEXT DEFAULT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  sample_type VARCHAR(128) DEFAULT 'Sang Total',
  collected_at TIMESTAMPTZ DEFAULT NULL,
  validated_at TIMESTAMPTZ DEFAULT NULL,
  validated_by VARCHAR(255) DEFAULT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INSERTION DES DONNÉES PAR DÉFAUT (POSTGRESQL)
-- ==============================================================================

INSERT INTO company_settings (id, name, slogan, phone, email, address, city, country, rccm, tax_id, health_accreditation_number, currency_symbol, default_tax_rate, bank_name, bank_iban, bank_bic, mobile_money_numbers, watermark_text, ndm_prefix, ndm_digits, ndm_next_number)
VALUES (1, 'LABORATOIRE D''ANALYSES MÉDICALES & BIOLOGIE CLINIQUE', 'Biologie Médicale, Diagnostics Spécialisés & Examens de Santé', '+225 27 20 22 33 44 / +225 07 08 09 10 11', 'contact@laboratoire-biologie.ci', 'Plateau Medical Center, Bd Hassan II', 'Abidjan', 'Côte d''Ivoire', 'CI-ABJ-2024-B-12940', 'CI 01928374 A', 'AGR-MSHP-2024-0098', 'FCFA', 0.00, 'Société Générale Côte d''Ivoire (SGCI)', 'CI93 0100 2000 3000 4000 50', 'SGCIX01', 'Wave / Orange Money / Moov : +225 07 08 09 10 11', 'LABORATOIRE - DOCUMENT OFFICIEL', 'CHU-', 8, 1005);

INSERT INTO res_groups (id, name, description, permissions) VALUES
(1, 'Direction & Administration Système', 'Accès universel et supervision totale', '["all"]'::jsonb),
(2, 'Facturation Clients Seule', 'Accueil des patients et émission des factures', '["can_manage_invoices", "can_manage_partners"]'::jsonb),
(3, 'Caisse & Encaissement Seul', 'Gestion des encaissements et arrêtés journaliers', '["can_register_payments", "can_manage_partners"]'::jsonb),
(4, 'Facture / Caisse (Polyvalent)', 'Facturation complète et encaissement au guichet', '["can_manage_invoices", "can_register_payments", "can_manage_partners"]'::jsonb),
(5, 'Biologiste Médical', 'Validation biologique et signature médicale', '["can_manage_invoices", "can_validate_medical", "can_enter_results", "can_manage_lab_catalog"]'::jsonb),
(6, 'Technicien de Laboratoire', 'Saisie paillasse des paramètres d''analyses', '["can_enter_results"]'::jsonb),
(7, 'Comptabilité & Finance', 'Suivi du Grand Livre, relances et audit', '["can_validate_invoices", "can_register_payments", "can_view_financials"]'::jsonb);

INSERT INTO res_users (id, login, password_hash, name, email, role, department, group_ids, permissions, active) VALUES
(1, 'mandemohamed68@gmail.com', 'admin123', 'Mande Mohamed (Directeur Général)', 'mandemohamed68@gmail.com', 'Directeur Général & Superviseur Système', 'Direction Générale', '[1]'::jsonb, '["all"]'::jsonb, true),
(2, 'admin', 'admin123', 'Administrateur Principal', 'admin@polyclinique.ci', 'Superviseur Système', 'Direction', '[1]'::jsonb, '["all"]'::jsonb, true),
(3, 'facturier', 'facture123', 'Kouassi Affoué Marie', 'facturation@polyclinique.ci', 'Facturier (Établissement Factures Seul)', 'Facturation', '[2]'::jsonb, '["can_manage_invoices", "can_manage_partners"]'::jsonb, true),
(4, 'caissier', 'caisse123', 'Yao Konan Jean', 'caisse@polyclinique.ci', 'Caissier (Encaissement Caisse Seul)', 'Caisse', '[3]'::jsonb, '["can_register_payments", "can_manage_partners"]'::jsonb, true),
(5, 'facture_caisse', 'polyvalent123', 'Diallo Aminata', 'accueil@polyclinique.ci', 'Facture / Caisse (Polyvalent Facturation & Caisse)', 'Accueil & Caisse', '[4]'::jsonb, '["can_manage_invoices", "can_register_payments", "can_manage_partners"]'::jsonb, true),
(6, 'dr.toure', 'labo123', 'Dr Touré Ibrahim', 'dr.toure@polyclinique.ci', 'Biologiste Médical (Chef de Laboratoire)', 'Laboratoire Médical', '[5]'::jsonb, '["can_manage_invoices", "can_validate_medical", "can_enter_results", "can_manage_lab_catalog"]'::jsonb, true),
(7, 'technicien', 'tech123', 'Soro Bakary', 'technique@polyclinique.ci', 'Technicien Supérieur Analyses Médicales', 'Laboratoire Médical', '[6]'::jsonb, '["can_enter_results"]'::jsonb, true),
(8, 'comptable', 'compta123', 'Bamba Fatoumata', 'comptabilite@polyclinique.ci', 'Comptable & Tiers-Payeur', 'Comptabilité', '[7]'::jsonb, '["can_validate_invoices", "can_register_payments", "can_view_financials"]'::jsonb, true);

INSERT INTO account_taxes (id, name, amount, description, active) VALUES
(1, 'Exonéré TVA (Santé & Biologie Médicale)', 0.00, 'Exonération légale sur les actes médicaux', true),
(2, 'TVA Standard (18%)', 18.00, 'Taux légal UEMOA', true);

INSERT INTO product_products (id, default_code, name, list_price, standard_price, category, sample_type, turnaround_time, reference_values) VALUES
(1, 'BIO-NFS', 'Numération Formule Sanguine (NFS / Hémogramme)', 8500.00, 2000.00, 'Hématologie', 'Sang Total EDTA', '2 heures', 'Leucocytes: 4.0 - 10.0 x10^3/µL | Hématies: 4.5 - 5.9 x10^6/µL | Hémoglobine: 13.0 - 17.5 g/dL'),
(2, 'BIO-GLY', 'Glycémie à Jeun', 4000.00, 800.00, 'Biochimie', 'Plasma Fluoré', '1 heure', '0.70 - 1.10 g/L (Normoglycémie)'),
(3, 'BIO-LIP', 'Bilan Lipidique Complet (Cholestérol Total, HDL, LDL, Triglycérides)', 18000.00, 4500.00, 'Biochimie', 'Sérum', '4 heures', 'Cholestérol Total < 2.00 g/L | Triglycérides < 1.50 g/L | HDL > 0.40 g/L'),
(4, 'BIO-CRP', 'Protéine C-Réactive Ultra-Sensible (CRP)', 12000.00, 3000.00, 'Immunologie', 'Sérum', '2 heures', '< 6.0 mg/L (Absence de syndrome inflammatoire)'),
(5, 'BIO-PCR-PALU', 'Goutte Épaisse & Frottis Sanguin (Paludisme)', 6500.00, 1500.00, 'Parasitologie', 'Sang Total', '1 heure', 'Absence de trophozoïtes de Plasmodium');

INSERT INTO res_partners (id, ndm, name, first_name, partner_type, gender, birth_date, age, phone, email, city, insurance_name, insurance_policy_number, insurance_coverage_rate, prescribing_doctor) VALUES
(1, 'CHU-00001001', 'Koffi Yao Stéphane', 'Stéphane', 'patient', 'M', '1988-05-14', 37, '+225 07 48 29 11 02', 'koffi.stephane@gmail.com', 'Abidjan Cocody', 'AXA Assurances Santé', 'POL-AXA-98124', 80.00, 'Dr Gondo (CHU Treichville)'),
(2, 'CHU-00001002', 'Binate Awa', 'Awa', 'patient', 'F', '1995-11-20', 30, '+225 05 12 88 44 99', 'awa.binate@yahoo.fr', 'Abidjan Plateau', 'NSIA Assurances', 'POL-NSIA-4401', 70.00, 'Dr Touré (Polyclinique)'),
(3, 'CHU-00001003', 'Sanogo Mamadou', 'Mamadou', 'patient', 'M', '1972-03-08', 53, '+225 01 02 03 04 05', 'm.sanogo@ci-transport.com', 'Abidjan Marcory', 'Sanlam Assurance', 'POL-SAN-0019', 80.00, 'Dr Aké (Cardiologue)');

INSERT INTO till_sessions (id, session_code, till_name, cashier_id, cashier_name, opening_balance, total_collected, total_cash_collected, total_mobile_money_collected, transactions_count, state, opening_date) VALUES
(1, 'SESS-2026-0001', 'Caisse Principale 1', 1, 'Mande Mohamed (Directeur Général)', 50000.00, 105000.00, 65000.00, 40000.00, 3, 'in_progress', NOW());
