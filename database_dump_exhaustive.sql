-- ==========================================================================
-- BASE DE DONNÉES SIH - SYSTÈME HOSPITALIER, CLINIQUE & FINANCIER COMPLET
-- DUMP EXHAUSTIF POUR INJECTION LOCALE (PostgreSQL, MySQL, MariaDB, SQLite)
-- Date d'exportation : 2026-09-23T13:05:19.296Z
-- Version du Schéma : 3.4.0-Production-Ready
-- ==========================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------------
-- 1. TABLE : res_country (6 enregistrements)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS res_country (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL
);

INSERT INTO res_country (id, name, code) VALUES (1, 'France', 'FR');
INSERT INTO res_country (id, name, code) VALUES (2, 'Belgique', 'BE');
INSERT INTO res_country (id, name, code) VALUES (3, 'Suisse', 'CH');
INSERT INTO res_country (id, name, code) VALUES (4, 'Canada', 'CA');
INSERT INTO res_country (id, name, code) VALUES (5, 'Côte d''Ivoire', 'CI');
INSERT INTO res_country (id, name, code) VALUES (6, 'États-Unis', 'US');

-- --------------------------------------------------------------------------
-- 2. TABLE : res_currency (4 enregistrements)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS res_currency (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  active TINYINT(1) DEFAULT 1
);

INSERT INTO res_currency (id, name, symbol, active) VALUES (1, 'EUR', '€', 1);
INSERT INTO res_currency (id, name, symbol, active) VALUES (2, 'USD', '$', 1);
INSERT INTO res_currency (id, name, symbol, active) VALUES (3, 'XOF', 'FCFA', 1);
INSERT INTO res_currency (id, name, symbol, active) VALUES (4, 'CHF', 'CHF', 1);

-- --------------------------------------------------------------------------
-- 3. TABLE : uom_uom (4 enregistrements)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uom_uom (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  factor DECIMAL(10, 4) DEFAULT 1.0000
);

INSERT INTO uom_uom (id, name, factor) VALUES (1, 'Unités', 1);
INSERT INTO uom_uom (id, name, factor) VALUES (2, 'Heures', 1);
INSERT INTO uom_uom (id, name, factor) VALUES (3, 'Jours', 1);
INSERT INTO uom_uom (id, name, factor) VALUES (4, 'Forfait', 1);

-- --------------------------------------------------------------------------
-- 4. TABLE : res_groups (12 profils métier)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS res_groups (
  id INT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  permissions_json TEXT,
  created_at VARCHAR(50)
);

INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (1, 'Superviseur Caisse / Facture', 'Supérieur hiérarchique : seul habilité à valider, modifier, supprimer ou annuler les factures et encaissements de tous les profils.', '["can_manage_invoices","can_validate_invoices","can_delete_invoices","can_register_payments","can_manage_partners","can_manage_lab_catalog","can_validate_medical","can_enter_results","can_view_financials","can_manage_settings","can_manage_users"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (2, 'Facturier (Profil Facture)', 'Établit exclusivement les factures patients (statut Non réglé). Ne peut en aucun cas encaisser de paiement.', '["can_manage_invoices","can_manage_partners"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (3, 'Caissier (Profil Caisse)', 'N établit pas de facture. Encaisse exclusivement les paiements des factures établies par le Facturier, édite les reçus et clôture la caisse.', '["can_register_payments","can_manage_partners"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (4, 'Facture / Caisse (Polyvalent)', 'Profil polyvalent : Établit les factures patients ET encaisse directement les règlements correspondants.', '["can_manage_invoices","can_register_payments","can_manage_partners"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (5, 'Biologiste Médical / Chef Laboratoire', 'Validation biologique officielle, gestion du catalogue des examens & profils, seuils de référence', '["can_manage_invoices","can_manage_lab_catalog","can_validate_medical","can_enter_results","can_view_financials"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (6, 'Technicien Supérieur de Laboratoire', 'Exécution technique des analyses, saisie des résultats paillasse, transmission pour validation', '["can_enter_results"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (7, 'Comptable / Gestionnaire Tiers-Payeur', 'Suivi financier, lettrage, réconciliation bancaire et recouvrement des créances assurances', '["can_validate_invoices","can_register_payments","can_view_financials"]', '2026-01-01T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (8, 'Infirmier (Triage & Constantes)', 'Prend les constantes du patient (Température, Tension, Pouls, Poids) au Triage et suit le Dossier Médical Électronique.', '["can_manage_partners","can_enter_results"]', '2026-09-14T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (9, 'Médecin Généraliste', 'Exécute les consultations médicales courantes, saisit le diagnostic clinique (CIM-10), prescrit les ordonnances et examens.', '["can_validate_medical","can_enter_results","can_manage_partners"]', '2026-09-14T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (10, 'Médecin Spécialiste', 'Exécute les consultations spécialisées (Cardiologie, Pédiatrie, Gynécologie, etc.), gère le dossier médical spécialisé.', '["can_validate_medical","can_enter_results","can_manage_partners"]', '2026-09-14T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (11, 'Imagerie Médicale (Radiologie / ECG)', 'Exécute les examens d''imagerie prescrits (Radiographie, Échographie, ECG) et saisit les comptes-rendus correspondants.', '["can_enter_results"]', '2026-09-14T09:00:00Z');
INSERT INTO res_groups (id, name, description, permissions_json, created_at) VALUES (12, 'Administrateur HIS (Dossier Médical)', 'Administrateur global de la gestion médicale HIS / DME et de la facturation médicale intégrée.', '["can_manage_invoices","can_validate_invoices","can_register_payments","can_manage_partners","can_manage_lab_catalog","can_validate_medical","can_enter_results","can_view_financials","can_manage_settings","can_manage_users"]', '2026-09-14T09:00:00Z');

-- --------------------------------------------------------------------------
-- 5. TABLE : res_users (11 comptes praticiens & personnel)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS res_users (
  id INT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  login VARCHAR(150) NOT NULL UNIQUE,
  email VARCHAR(200),
  role VARCHAR(100),
  department VARCHAR(100),
  phone VARCHAR(50),
  active TINYINT(1) DEFAULT 1,
  group_ids_json TEXT,
  permissions_json TEXT,
  created_at VARCHAR(50)
);

INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (1, 'Mohamed Mandé (Super Admin)', 'mandemohamed68@gmail.com', 'mandemohamed68@gmail.com', 'Super Admin (Administrateur Universel)', 'Direction Générale', NULL, 1, '[1]', '[]', '2026-01-01T09:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (2, 'Superviseur', 'superviseur', 'superviseur@clinic.pro', 'Superviseur Caisse / Facture', 'Supervision', NULL, 1, '[1]', '[]', '2026-01-01T09:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (3, 'Caisse', 'caissier', 'caissier@clinic.pro', 'Caissier', 'Caisse', NULL, 1, '[3]', '[]', '2026-01-02T08:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (4, 'Factures', 'facturier', 'facturier@clinic.pro', 'Facturier', 'Facturation', NULL, 1, '[2]', '[]', '2026-01-02T08:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (5, 'Caisse & Facture', 'caisse_facture', 'polyvalent@clinic.pro', 'Facture / Caisse', 'Facturation & Caisse', NULL, 1, '[4]', '[]', '2026-01-02T10:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (6, 'Infirmier', 'infirmier', 'infirmier@clinic.pro', 'Infirmier (Triage & Constantes)', 'Soins', NULL, 1, '[8]', '[]', '2026-09-14T09:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (7, 'Médecin', 'medecin', 'medecin@clinic.pro', 'Médecin Généraliste', 'Consultations', NULL, 1, '[9]', '[]', '2026-09-14T09:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (8, 'Médecin spécialiste', 'specialiste', 'specialiste@clinic.pro', 'Médecin Spécialiste', 'Spécialités', NULL, 1, '[10]', '[]', '2026-09-14T09:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (9, 'Laboratoire', 'laboratoire', 'labo@clinic.pro', 'Biologiste / Technicien', 'Laboratoire', NULL, 1, '[5]', '[]', '2026-01-02T08:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (10, 'Imagerie', 'imagerie', 'imagerie@clinic.pro', 'Radiologue', 'Imagerie Médicale', NULL, 1, '[11]', '[]', '2026-09-14T09:00:00Z');
INSERT INTO res_users (id, name, login, email, role, department, phone, active, group_ids_json, permissions_json, created_at) VALUES (11, 'Gestionnaire hospitalisation', 'hospitalisation', 'hospit@clinic.pro', 'Gestionnaire Hospitalisation', 'Hospitalisation', NULL, 1, '[6]', '[]', '2026-09-14T09:00:00Z');

-- --------------------------------------------------------------------------
-- 6. TABLE : company_settings (Configuration Établissement & SIH)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  slogan VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(30),
  phone VARCHAR(100),
  email VARCHAR(150),
  address VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  rccm VARCHAR(100),
  tax_id VARCHAR(100),
  health_accreditation_number VARCHAR(100),
  currency_symbol VARCHAR(20),
  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_exemption_default_reason TEXT,
  bank_name VARCHAR(150),
  bank_iban VARCHAR(100),
  bank_bic VARCHAR(50),
  mobile_money_numbers TEXT,
  medical_director_name VARCHAR(200),
  lab_turnaround_default VARCHAR(150),
  invoice_footer TEXT,
  hospital_services_json TEXT
);

INSERT INTO company_settings (id, name, slogan, logo_url, primary_color, phone, email, address, city, country, rccm, tax_id, health_accreditation_number, currency_symbol, default_tax_rate, tax_exemption_default_reason, bank_name, bank_iban, bank_bic, mobile_money_numbers, medical_director_name, lab_turnaround_default, invoice_footer, hospital_services_json) VALUES (1, 'LABORATOIRE D''ANALYSES MÉDICALES & BIOLOGIE CLINIQUE', 'Biologie Médicale, Diagnostics Spécialisés & Examens de Santé', '', '#0f172a', '+225 27 20 22 33 44 / +225 07 08 09 10 11', 'contact@laboratoire-biologie.ci', 'Plateau Medical Center, Bd Hassan II', 'Abidjan', 'Côte d''Ivoire', 'CI-ABJ-2024-B-12940', 'CI 01928374 A', 'AGR-MSHP-2024-0098', 'FCFA', 0.00, 'Exonération légale de TVA sur les prestations de biologie médicale (Art. 355 du CGI).', 'Société Générale Côte d''Ivoire (SGCI)', 'CI93 0100 2000 3000 4000 50', 'SGCIX01', 'Wave / Orange Money / Moov : +225 07 08 09 10 11', 'Dr. Aboubacar TOURÉ - Biologiste Médical Spécialiste', '2 heures à 24 heures selon la spécialité', 'Document délivré à titre de quittance médicale officielle.', '[{"id":"medecine_generale","name":"Médecine Générale & Consultations","code":"MED","category":"clinical","description":"Premier recours médical, consultations polyvalentes, suivi des maladies chroniques et aiguës.","enabled":true,"icon":"Stethoscope","head_doctor":"Dr. Ibrahim Traoré","location":"Bâtiment Principal - RDC","capacity_beds":0},{"id":"pediatrie","name":"Pédiatrie & Néonatologie","code":"PED","category":"clinical","description":"Santé infantile, consultations nouveau-nés et enfants, carnet vaccinal PEV, suivi de croissance OMS et nutrition.","enabled":true,"icon":"Baby","head_doctor":"Dr. Aminata Diallo","location":"Pavillon Mère-Enfant - RDC","capacity_beds":14},{"id":"maternite","name":"Maternité & Gynéco-Obstétrique","code":"MAT","category":"clinical","description":"Suivi prénatal (CPN1-4+), salle de naissance, accouchements, partogramme et surveillance post-partum.","enabled":true,"icon":"Heart","head_doctor":"Dr. Barry Fatoumata","location":"Pavillon Mère-Enfant - 1er étage","capacity_beds":18},{"id":"specialiste","name":"Consultations Spécialisées","code":"SPEC","category":"clinical","description":"Cardiologie, Chirurgie, Pneumologie, Neurologie, Gastro-entérologie et avis spécialisés référés.","enabled":true,"icon":"ShieldCheck","head_doctor":"Dr. Aboubacar Touré","location":"Bâtiment B - 2e étage","capacity_beds":0},{"id":"urgences","name":"Urgences & Triage Infirmier","code":"URG","category":"clinical","description":"Accueil 24/7, triage avec constantes vitales, déchocage et mise en observation d''urgence.","enabled":true,"icon":"Activity","head_doctor":"Dr. Soro Kévin","location":"Bâtiment Urgences - Entrée Ambulances","capacity_beds":8},{"id":"hospitalisation","name":"Hospitalisation & Gestion des Lits","code":"HOSP","category":"inpatient","description":"Séjours en médecine, chirurgie et soins continus, affectation des lits, surveillance et protocoles de sortie.","enabled":true,"icon":"Bed","head_doctor":"Dr. Moussa Keita","location":"Bâtiments B & C (1er au 3e étage)","capacity_beds":45},{"id":"laboratoire","name":"Laboratoire d''Analyses Médicales","code":"LAB","category":"diagnostic","description":"Analyses biochimiques, hématologie, sérologie, microbiologie et validation biologique officielle.","enabled":true,"icon":"FlaskConical","head_doctor":"Dr. Aboubacar Touré (Biologiste)","location":"Plateau Technique - RDC","capacity_beds":0},{"id":"imagerie","name":"Imagerie Médicale & Radiologie","code":"RAD","category":"diagnostic","description":"Radiographie numérique, échographie générale et obstétricale, scanner TDM et télé-radiologie.","enabled":true,"icon":"Microscope","head_doctor":"Dr. Yves Kouamé","location":"Plateau Technique - Sous-sol","capacity_beds":0},{"id":"caisse_facturation","name":"Caisse & Facturation Médicale","code":"FIN","category":"financial","description":"Guichets d''encaissement, facturation tiers-payeur / mutuelles, quittances et clôtures de sessions.","enabled":true,"icon":"CreditCard","head_doctor":"Mme. Yao Christine (Chef Comptable)","location":"Hall d''Accueil Principal","capacity_beds":0},{"id":"pharmacie","name":"Pharmacie Hospitalière & Délivrance","code":"PHAR","category":"pharmacy","description":"Gestion des stocks de médicaments, dispensation sur ordonnance, consommables et trousses d''urgence.","enabled":true,"icon":"Pill","head_doctor":"Dr. Pharm. Adjoua Clarisse","location":"Bâtiment A - Aile Est","capacity_beds":0}]');

-- --------------------------------------------------------------------------
-- 7. TABLE : res_partner (21 patients, mutuelles & tiers-payeurs)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS res_partner (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_company TINYINT(1) DEFAULT 0,
  email VARCHAR(255),
  phone VARCHAR(100),
  street VARCHAR(255),
  city VARCHAR(100),
  vat VARCHAR(100),
  customer_rank INT DEFAULT 0,
  supplier_rank INT DEFAULT 0,
  gender VARCHAR(10),
  age INT,
  birth_date VARCHAR(50),
  blood_group VARCHAR(10),
  emergency_contact VARCHAR(200),
  social_security_number VARCHAR(100),
  insurance_company VARCHAR(150),
  insurance_rate DECIMAL(5,2) DEFAULT 0.00,
  allergies_json TEXT,
  chronic_conditions_json TEXT
);

INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (1, 'ASCOMA Côte d''Ivoire (Tiers-Payeur)', 1, 'tierspayeur@ascoma.ci', '+225 27 20 25 38 00', 'Immeuble Woodin Center, Avenue Noguès, Plateau', 'Abidjan', 'CI00192834A', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (2, 'SUNU Assurances Santé', 1, 'sante.ci@sunu-group.com', '+225 27 20 31 12 12', 'Avenue Botreau Roussel, Plateau', 'Abidjan', 'CI00384910B', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (3, 'AXA Assurances Côte d''Ivoire', 1, 'gestion.tiers@axa.ci', '+225 27 20 30 75 00', 'Boulevard Roume, Immeuble AXA, Plateau', 'Abidjan', 'CI00293810C', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (4, 'NSIA Assurances Tiers-Payeur', 1, 'remboursement@groupensia.com', '+225 27 20 31 98 00', 'Immeuble NSIA, Rue Paris Village', 'Abidjan', 'CI00829104D', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (5, 'CNAM - Couverture Maladie Universelle (CMU)', 1, 'contact@cnam.ci', '+225 27 20 25 60 00', 'Cité Administrative, Tour C', 'Abidjan', 'CI00010020E', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (11, 'Société Ivoirienne de Raffinage (SIR)', 1, 'infirmerie@sir.ci', '+225 27 21 23 40 00', 'Zone Industrielle de Vridi, Port-Bouët', 'Abidjan', 'CI00183920F', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (12, 'Compagnie Ivoirienne d''Électricité (CIE)', 1, 'sante.travail@cie.ci', '+225 27 21 21 21 21', 'Rue des Électriciens, Treichville', 'Abidjan', 'CI00284910G', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (13, 'Orange Côte d''Ivoire', 1, 'social.rh@orange.com', '+225 07 07 00 00 00', 'Boulevard de Marseille, Zone 3', 'Abidjan', 'CI00384912H', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (14, 'Port Autonome d''Abidjan (PAA)', 1, 'medecine@portabidjan.ci', '+225 27 21 23 80 00', 'Direction Générale PAA, Treichville', 'Abidjan', 'CI00482910J', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (15, 'Société des Mines d''Ity (SMI)', 1, 'health.ity@endeavourmining.com', '+225 27 22 40 90 00', 'Cocody Ambassades', 'Abidjan', 'CI00582910K', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (6, 'M. Jean-Luc Koffi', 0, 'jl.koffi@email.ci', '+225 07 08 09 10 11', 'Cocody Riviera 2, Villa 45', 'Abidjan', NULL, 1, 0, 'M', 38, '1988-04-12', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (21, 'TRAORE Fatoumata', 0, 'fatoumata.traore.orange@email.ci', '+225 07 12 34 56', 'Cocody Angré 8e Tranche', 'Abidjan', NULL, 1, 0, 'F', 30, '1996-05-14', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (22, 'TRAORE Fatoumata', 0, 'fatoumata.traore2001@email.ci', '+225 05 98 76 54', 'Yopougon Maroc, Cité CIE', 'Abidjan', NULL, 1, 0, 'F', 25, '2001-11-22', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (23, 'CISSE Mamadou', 0, 'mamadou.cisse.sir@email.ci', '+225 01 23 45 67', 'Port-Bouët Vridi Cité', 'Abidjan', NULL, 1, 0, 'M', 41, '1985-03-10', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (24, 'CISSE Mamadou', 0, 'parents.cisse@email.ci', '+225 07 44 55 66', 'Koumassi Remblais', 'Abidjan', NULL, 1, 0, 'M', 8, '2018-08-15', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (7, 'Mme Aminata Diallo', 0, 'aminata.diallo@email.ci', '+225 05 06 07 08 09', 'Marcory Résidentiel, Rue Mercedes', 'Abidjan', NULL, 1, 0, 'F', 29, '1997-08-23', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (8, 'M. Paul N''Guessan', 0, 'paul.nguessan@email.ci', '+225 01 02 03 04 05', 'Yopougon Selmer, Carrefour Sable', 'Abidjan', NULL, 1, 0, 'M', 52, '1974-11-05', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (9, 'Mme Fatou Bakayoko', 0, 'fatou.bakayoko@email.ci', '+225 07 77 88 99 00', 'Deux Plateaux Vallons, Rue des Jardins', 'Abidjan', NULL, 1, 0, 'F', 44, '1982-01-19', NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (10, 'Sopra Steria Business Abidjan', 1, 'medecine.travail@sopra-ci.com', '+225 27 20 21 22 23', 'Plateau Boulevard Clozel, Immeuble Kharrat', 'Abidjan', 'CI009822104A', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (11, 'Bio-Rad Diagnostics Afrique de l''Ouest', 1, 'commandes@biorad-afrique.com', '+225 27 21 35 40 50', 'Zone Industrielle de Vridi, Rue des Brasseries', 'Abidjan', 'CI007744119B', 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');
INSERT INTO res_partner (id, name, is_company, email, phone, street, city, vat, customer_rank, supplier_rank, gender, age, birth_date, blood_group, emergency_contact, social_security_number, insurance_company, insurance_rate, allergies_json, chronic_conditions_json) VALUES (12, 'Roche Diagnostics & Réactifs Médicaux', 1, 'commandes@roche-diagnostics.ci', '+225 27 22 44 80 00', 'Boulevard de Marseille, Zone 3', 'Abidjan', 'CI005533221C', 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', '[]');

-- --------------------------------------------------------------------------
-- 8. TABLE : account_tax (4 règles fiscales & TVA)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_tax (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(8,4) NOT NULL,
  amount_type VARCHAR(50) DEFAULT 'percent',
  type_tax_use VARCHAR(50) DEFAULT 'sale',
  active TINYINT(1) DEFAULT 1,
  description TEXT
);

INSERT INTO account_tax (id, name, amount, amount_type, type_tax_use, active, description) VALUES (1, 'TVA Vente 18.0%', 18, 'percent', 'sale', 1, 'Taxe sur la valeur ajoutée normale (18%)');
INSERT INTO account_tax (id, name, amount, amount_type, type_tax_use, active, description) VALUES (2, 'TVA Vente 9.0%', 9, 'percent', 'sale', 1, 'Taxe intermédiaire (9%)');
INSERT INTO account_tax (id, name, amount, amount_type, type_tax_use, active, description) VALUES (3, 'TVA Vente 5.0%', 5, 'percent', 'sale', 1, 'Taxe réduite (5%)');
INSERT INTO account_tax (id, name, amount, amount_type, type_tax_use, active, description) VALUES (4, 'TVA Achat 18.0%', 18, 'percent', 'purchase', 1, 'Taxe déductible sur achats (18%)');

-- --------------------------------------------------------------------------
-- 9. TABLE : product_product (68 prestations, analyses, médicaments, actes)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_product (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  default_code VARCHAR(100),
  list_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  standard_price DECIMAL(15,2) DEFAULT 0.00,
  category_name VARCHAR(150),
  turnaround_time VARCHAR(100),
  sample_type VARCHAR(100),
  active TINYINT(1) DEFAULT 1,
  parameters_json TEXT
);

INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (1, NULL, 'LAB-NFS-01', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (2, NULL, 'LAB-GLYC-02', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (410, NULL, 'ACT-PED-01', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (411, NULL, 'ACT-PED-PEV', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (412, NULL, 'LAB-PALU-PED', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (413, NULL, 'ACT-PED-PHOTO', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (414, NULL, 'ACT-PED-NEBUL', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (420, NULL, 'ACT-MAT-CPN', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (421, NULL, 'ACT-MAT-ECHO', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (422, NULL, 'ACT-MAT-CTG', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (423, NULL, 'ACT-MAT-ACCOUCH', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (424, NULL, 'ACT-MAT-CESAR', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (425, NULL, 'ACT-MAT-EPISIO', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (426, NULL, 'ACT-MAT-POST', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (3, NULL, 'LAB-CREAT-03', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (4, NULL, 'LAB-PALU-04', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (5, NULL, 'LAB-LIPID-05', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (6, NULL, 'LAB-GRPRH-06', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (7, NULL, 'LAB-CRP-07', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (8, NULL, 'PROF-SANTE-08', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (9, NULL, 'PROF-PRENATAL-09', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (10, NULL, 'PROF-HEPATOREN-10', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (11, NULL, 'PROF-PREOP-11', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (12, NULL, 'SRV-CONSULT-12', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (101, NULL, 'MED-PARAC-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (102, NULL, 'MED-PARAC-1G', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (103, NULL, 'MED-AMOX-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (104, NULL, 'MED-AUGM-1G', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (105, NULL, 'MED-CEFTR-1G', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (106, NULL, 'MED-COARTEM', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (107, NULL, 'MED-SPASFON', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (108, NULL, 'MED-NACL-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (109, NULL, 'MED-IBUP-400', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (110, NULL, 'MED-DICL-75', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (111, NULL, 'MED-OMEP-20', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (112, NULL, 'MED-METF-850', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (113, NULL, 'MED-AMLO-10', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (114, NULL, 'MED-VENT-100', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (115, NULL, 'MED-GLUC-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (116, NULL, 'MED-RING-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (117, NULL, 'MED-SYROP-150', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (118, NULL, 'MED-AMOX-SYR', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (119, NULL, 'MED-AZIT-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (120, NULL, 'MED-CIPR-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (121, NULL, 'MED-METR-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (122, NULL, 'MED-ARTS-60', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (123, NULL, 'MED-QUIN-300', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (124, NULL, 'MED-PRED-20', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (125, NULL, 'MED-LORA-10', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (126, NULL, 'MED-PARAC-SYR', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (127, NULL, 'MED-SRO-01', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (128, NULL, 'MED-VITC-500', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (129, NULL, 'MED-ZINC-20', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (130, NULL, 'MED-INS-RAP', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (201, NULL, 'RAD-THORAX', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (202, NULL, 'RAD-RACHIS', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (203, NULL, 'RAD-ECHO-ABD', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (204, NULL, 'RAD-ECHO-OBS', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (205, NULL, 'RAD-ECHO-CARD', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (206, NULL, 'RAD-TDM-BRAIN', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (301, NULL, 'HOS-VIP-24H', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (302, NULL, 'HOS-DBL-24H', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (303, NULL, 'HOS-REANIM-24H', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (304, NULL, 'HOS-SSPI', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (305, NULL, 'HOS-MATERNITE', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (401, NULL, 'ACT-MED-GEN', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (402, NULL, 'ACT-PANS-SMP', 0, 0, NULL, NULL, NULL, 1, '[]');
INSERT INTO product_product (id, name, default_code, list_price, standard_price, category_name, turnaround_time, sample_type, active, parameters_json) VALUES (403, NULL, 'ACT-ECG-12D', 0, 0, NULL, NULL, NULL, 1, '[]');

-- --------------------------------------------------------------------------
-- 10. TABLE : account_move (6 factures, quittances & avoirs)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_move (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  move_type VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  partner_id INT,
  partner_name VARCHAR(255),
  date VARCHAR(50),
  invoice_date VARCHAR(50),
  invoice_date_due VARCHAR(50),
  amount_untaxed DECIMAL(15,2) DEFAULT 0.00,
  amount_tax DECIMAL(15,2) DEFAULT 0.00,
  amount_total DECIMAL(15,2) DEFAULT 0.00,
  amount_residual DECIMAL(15,2) DEFAULT 0.00,
  payment_state VARCHAR(50),
  invoice_user_id INT,
  invoice_user_name VARCHAR(150),
  insurance_share DECIMAL(15,2) DEFAULT 0.00,
  patient_share DECIMAL(15,2) DEFAULT 0.00,
  insurance_company VARCHAR(150),
  guarantee_letter_number VARCHAR(100),
  narration TEXT
);

INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (1, 'FAC/2026/0001', 'out_invoice', 'posted', 1, NULL, '2026-01-15 10:00', '2026-01-15 10:00', '2026-02-15', 4500, 900, 5400, 0, 'paid', 1, NULL, 0, 5400, NULL, NULL, NULL);
INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (2, 'FAC/2026/0002', 'out_invoice', 'posted', 2, NULL, '2026-02-01 09:15', '2026-02-01 09:15', '2026-03-01', 8000, 1600, 9600, 5600, 'partial', 2, NULL, 0, 9600, NULL, NULL, NULL);
INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (3, 'FAC/2026/0003', 'out_invoice', 'posted', 3, NULL, '2026-01-05 11:30', '2026-01-05 11:30', '2026-02-05', 2900, 580, 3480, 3480, 'not_paid', 1, NULL, 0, 3480, NULL, NULL, NULL);
INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (4, 'FAC/2026/0004', 'out_invoice', 'draft', 6, NULL, '2026-03-01 14:20', '2026-03-01 14:20', '2026-03-31', 6000, 1200, 7200, 7200, 'not_paid', 2, NULL, 0, 7200, NULL, NULL, NULL);
INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (5, 'FF/2026/0001', 'in_invoice', 'posted', 4, NULL, '2026-01-10 16:00', '2026-01-10 16:00', '2026-02-10', 1300, 260, 1560, 0, 'paid', 1, NULL, 0, 1560, NULL, NULL, NULL);
INSERT INTO account_move (id, name, move_type, state, partner_id, partner_name, date, invoice_date, invoice_date_due, amount_untaxed, amount_tax, amount_total, amount_residual, payment_state, invoice_user_id, invoice_user_name, insurance_share, patient_share, insurance_company, guarantee_letter_number, narration) VALUES (6, 'FF/2026/0002', 'in_invoice', 'posted', 5, NULL, '2026-02-20 10:00', '2026-02-20 10:00', '2026-03-20', 450, 90, 540, 540, 'not_paid', 1, NULL, 0, 540, NULL, NULL, NULL);

-- --------------------------------------------------------------------------
-- 11. TABLE : account_move_line (9 lignes de facturation)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_move_line (
  id INT PRIMARY KEY,
  move_id INT NOT NULL,
  product_id INT,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  price_unit DECIMAL(15,2) DEFAULT 0.00,
  discount DECIMAL(5,2) DEFAULT 0.00,
  price_subtotal DECIMAL(15,2) DEFAULT 0.00,
  price_total DECIMAL(15,2) DEFAULT 0.00
);

INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (1, 1, 1, '3 jours d''expertise architecture logicielle', 3, 1500, 0, 4500, 5400);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (2, 2, 2, 'Développement module de facturation spécifique Python', 5, 1200, 0, 6000, 7200);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (3, 2, 4, 'Support & Maintenance 24/7 (1 trimestre)', 3, 450, 0, 1350, 1620);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (4, 2, 5, 'Serveur dédié Managed Kubernetes (1 mois)', 1, 650, 0, 650, 780);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (5, 3, 1, 'Audit SI & Sécurité Financière', 2, 1450, 0, 2900, 3480);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (6, 4, 3, '2 x Licence SaaS Enterprise Annuelle', 2, 2400, 0, 4800, 5760);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (7, 4, 2, 'Formation équipes utilisatrices Abidjan', 1, 1200, 0, 1200, 1440);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (8, 5, 5, 'Hébergement Cloud Cluster San Francisco - Janvier', 2, 650, 0, 1300, 1560);
INSERT INTO account_move_line (id, move_id, product_id, name, quantity, price_unit, discount, price_subtotal, price_total) VALUES (9, 6, 4, 'Fournitures de bureau & consommables informatiques', 1, 450, 0, 450, 540);

-- --------------------------------------------------------------------------
-- 12. TABLE : account_payment (3 encaissements & règlements)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_payment (
  id INT PRIMARY KEY,
  payment_reference VARCHAR(100),
  partner_id INT,
  partner_name VARCHAR(255),
  move_id INT,
  invoice_name VARCHAR(100),
  amount DECIMAL(15,2) DEFAULT 0.00,
  payment_date VARCHAR(50),
  state VARCHAR(50),
  payment_method_code VARCHAR(50),
  journal_name VARCHAR(100),
  cashier_name VARCHAR(150),
  transaction_reference VARCHAR(150)
);

INSERT INTO account_payment (id, payment_reference, partner_id, partner_name, move_id, invoice_name, amount, payment_date, state, payment_method_code, journal_name, cashier_name, transaction_reference) VALUES (1, NULL, 1, NULL, 1, NULL, 5400, '2026-01-20 14:00', 'reconciled', NULL, NULL, NULL, NULL);
INSERT INTO account_payment (id, payment_reference, partner_id, partner_name, move_id, invoice_name, amount, payment_date, state, payment_method_code, journal_name, cashier_name, transaction_reference) VALUES (2, NULL, 2, NULL, 2, NULL, 4000, '2026-02-10 16:00', 'reconciled', NULL, NULL, NULL, NULL);
INSERT INTO account_payment (id, payment_reference, partner_id, partner_name, move_id, invoice_name, amount, payment_date, state, payment_method_code, journal_name, cashier_name, transaction_reference) VALUES (3, NULL, 4, NULL, 5, NULL, 1560, '2026-01-25 10:00', 'reconciled', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------------------------
-- 13. TABLE : till_session (5 sessions & vacations de caisse)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS till_session (
  id INT PRIMARY KEY,
  session_code VARCHAR(100) NOT NULL,
  user_id INT,
  cashier_name VARCHAR(150),
  state VARCHAR(50),
  opening_balance DECIMAL(15,2) DEFAULT 0.00,
  closing_balance DECIMAL(15,2) DEFAULT 0.00,
  total_collected DECIMAL(15,2) DEFAULT 0.00,
  opening_date VARCHAR(50),
  closing_date VARCHAR(50),
  cash_difference DECIMAL(15,2) DEFAULT 0.00,
  closing_notes TEXT
);

INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (1, 'SESSION00793', NULL, 'Mohamed Mandé (Admin Universel)', 'in_progress', 50000, 0, 155000, '11/09/2026 08:00', NULL, 0, NULL);
INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (2, 'SESSION00792', NULL, 'Marcelle Caissière (Profil Caisse)', 'closed', 50000, 195000, 200000, '10/09/2026 08:00', '10/09/2026 18:30', 0, NULL);
INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (3, 'SESSION00791', NULL, 'Sophie Polyvalente (Facture / Caisse)', 'closed', 30000, 245000, 310000, '09/09/2026 07:30', '09/09/2026 19:00', 0, NULL);
INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (4, 'SESSION00790', NULL, 'Jean Facturier (Profil Facture)', 'closed', 0, 0, 420000, '08/09/2026 08:00', '08/09/2026 17:30', 0, NULL);
INSERT INTO till_session (id, session_code, user_id, cashier_name, state, opening_balance, closing_balance, total_collected, opening_date, closing_date, cash_difference, closing_notes) VALUES (5, 'SESSION00789', NULL, 'Marcelle Caissière (Profil Caisse)', 'closed', 20000, 110000, 145000, '07/09/2026 08:30', '07/09/2026 16:00', 0, NULL);

-- --------------------------------------------------------------------------
-- 14. TABLE : medical_consultation (2 consultations cliniques, triage & constantes)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_consultation (
  id INT PRIMARY KEY,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255),
  doctor_name VARCHAR(200),
  specialty VARCHAR(100),
  date VARCHAR(50),
  status VARCHAR(50),
  chief_complaint TEXT,
  history_of_illness TEXT,
  blood_pressure VARCHAR(30),
  heart_rate INT,
  temperature DECIMAL(4,1),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  spO2 INT,
  blood_glucose DECIMAL(6,2),
  triage_level INT DEFAULT 3,
  diagnosis_primary VARCHAR(255),
  diagnosis_icd10 VARCHAR(50),
  clinical_notes TEXT,
  prescriptions_json TEXT,
  lab_orders_json TEXT,
  imaging_orders_json TEXT
);

INSERT INTO medical_consultation (id, partner_id, patient_name, doctor_name, specialty, date, status, chief_complaint, history_of_illness, blood_pressure, heart_rate, temperature, weight, height, spO2, blood_glucose, triage_level, diagnosis_primary, diagnosis_icd10, clinical_notes, prescriptions_json, lab_orders_json, imaging_orders_json) VALUES (1, 1, 'BB TASSINE KADHISA', 'Dr. Aboubacar TOURÉ', 'Médecine Générale & Infectiologie', NULL, 'completed', 'Fièvre à 38.8°C depuis 48h, céphalées intenses, asthénie et frissons.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, 'B54 (Paludisme)', NULL, '[]', '[]', '[]');
INSERT INTO medical_consultation (id, partner_id, patient_name, doctor_name, specialty, date, status, chief_complaint, history_of_illness, blood_pressure, heart_rate, temperature, weight, height, spO2, blood_glucose, triage_level, diagnosis_primary, diagnosis_icd10, clinical_notes, prescriptions_json, lab_orders_json, imaging_orders_json) VALUES (2, 2, 'Mme Awa DIABATÉ', 'Dr. Cissé Mamadou', 'Cardiologie & Médecine Interne', NULL, 'completed', 'Bilan de suivi HTA, céphalées occipitales le matin au réveil.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, 'I10 (HTA)', NULL, '[]', '[]', '[]');

-- --------------------------------------------------------------------------
-- 15. TABLE : lab_exam_order (3 dossiers d'analyses biologiques)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_exam_order (
  id INT PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL,
  partner_id INT,
  partner_name VARCHAR(255),
  patient_gender VARCHAR(10),
  patient_age INT,
  prescribing_doctor VARCHAR(255),
  sampling_date VARCHAR(50),
  status VARCHAR(50),
  department VARCHAR(100),
  conclusion TEXT,
  technician_name VARCHAR(150),
  parameters_json TEXT
);

INSERT INTO lab_exam_order (id, order_number, partner_id, partner_name, patient_gender, patient_age, prescribing_doctor, sampling_date, status, department, conclusion, technician_name, parameters_json) VALUES (1, 'LAB-2026-0001', 1, 'Global Tech Solutions SAS (Dossier Salarié: M. Konan)', 'M', 38, 'Dr. Yao Kouamé (Clinique Farah)', '2026-02-15T08:30:00Z', 'validated', 'Hématologie & Biochimie', 'Bilan hématologique et rénal normal. Glycémie strictement équilibrée.', 'Kouamé Koffi (Technicien)', '[{"id":"p1","name":"Hémoglobine","value":"14.2","unit":"g/dL","reference_range":"13.0 - 17.5","is_abnormal":false},{"id":"p2","name":"Hématies","value":"4.85","unit":"10^6/mm³","reference_range":"4.5 - 5.9","is_abnormal":false},{"id":"p3","name":"Leucocytes (Globules Blancs)","value":"6400","unit":"/mm³","reference_range":"4000 - 10000","is_abnormal":false},{"id":"p4","name":"Plaquettes","value":"245000","unit":"/mm³","reference_range":"150000 - 450000","is_abnormal":false},{"id":"p5","name":"Glycémie à jeun","value":"0.92","unit":"g/L","reference_range":"0.70 - 1.10","is_abnormal":false},{"id":"p6","name":"Créatinine plasmatique","value":"9.4","unit":"mg/L","reference_range":"7.0 - 13.0","is_abnormal":false},{"id":"p7","name":"DFG estimé (CKD-EPI)","value":"98","unit":"mL/min/1.73m²","reference_range":"> 90","is_abnormal":false}]');
INSERT INTO lab_exam_order (id, order_number, partner_id, partner_name, patient_gender, patient_age, prescribing_doctor, sampling_date, status, department, conclusion, technician_name, parameters_json) VALUES (2, 'LAB-2026-0002', 2, 'Nexus Digital (Mme Fatou Diallo)', 'F', 29, 'Dr. Bamba Lamine', '2026-02-28T09:00:00Z', 'results_entered', 'Biochimie & Parasitologie', 'Résultats paillasse saisis par le technicien. En attente de validation par le biologiste.', 'Kouamé Koffi (Technicien)', '[{"id":"p8","name":"Cholestérol Total","value":"2.45","unit":"g/L","reference_range":"< 2.00","is_abnormal":true,"notes":"Légère hypercholestérolémie"},{"id":"p9","name":"Triglycérides","value":"1.20","unit":"g/L","reference_range":"< 1.50","is_abnormal":false},{"id":"p10","name":"Cholestérol HDL","value":"0.58","unit":"g/L","reference_range":"> 0.40","is_abnormal":false},{"id":"p11","name":"Cholestérol LDL (calculé)","value":"1.63","unit":"g/L","reference_range":"< 1.30","is_abnormal":true},{"id":"p12","name":"Goutte Épaisse (GE/TDR)","value":"Négatif","unit":"-","reference_range":"Négatif","is_abnormal":false},{"id":"p13","name":"CRP Quantitative","value":"3.2","unit":"mg/L","reference_range":"< 6.0","is_abnormal":false}]');
INSERT INTO lab_exam_order (id, order_number, partner_id, partner_name, patient_gender, patient_age, prescribing_doctor, sampling_date, status, department, conclusion, technician_name, parameters_json) VALUES (3, 'LAB-2026-0003', 3, 'Horizon Conseil (M. Jean-Paul Traoré)', 'M', 52, 'Dr. Cissé Mamadou', '2026-03-01T08:15:00Z', 'in_progress', 'Biochimie & Hématologie', 'Analyses en cours de traitement sur automate.', 'Kouamé Koffi (Technicien)', '[{"id":"p14","name":"Glycémie à jeun","value":"1.34","unit":"g/L","reference_range":"0.70 - 1.10","is_abnormal":true},{"id":"p15","name":"Créatinine","value":"11.2","unit":"mg/L","reference_range":"7.0 - 13.0","is_abnormal":false},{"id":"p16","name":"Hémoglobine","value":"15.1","unit":"g/dL","reference_range":"13.0 - 17.5","is_abnormal":false},{"id":"p17","name":"Transaminases ALAT","value":"28","unit":"UI/L","reference_range":"< 45","is_abnormal":false}]');

-- --------------------------------------------------------------------------
-- 16. TABLE : lab_exam_result_item (Lignes de Résultats d'Analyses Biologiques & Paillasse)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_exam_result_item (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  measured_value VARCHAR(100) NOT NULL,
  unit VARCHAR(50),
  reference_range VARCHAR(100),
  is_abnormal TINYINT(1) DEFAULT 0,
  notes TEXT
);

INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (1, 1, 'Hémoglobine', '14.2', 'g/dL', '13.0 - 17.5', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (2, 1, 'Hématies', '4.85', '10^6/mm³', '4.5 - 5.9', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (3, 1, 'Leucocytes (Globules Blancs)', '6400', '/mm³', '4000 - 10000', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (4, 1, 'Plaquettes', '245000', '/mm³', '150000 - 450000', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (5, 1, 'Glycémie à jeun', '0.92', 'g/L', '0.70 - 1.10', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (6, 1, 'Créatinine plasmatique', '9.4', 'mg/L', '7.0 - 13.0', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (7, 1, 'DFG estimé (CKD-EPI)', '98', 'mL/min/1.73m²', '> 90', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (8, 2, 'Cholestérol Total', '2.45', 'g/L', '< 2.00', 1, 'Légère hypercholestérolémie');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (9, 2, 'Triglycérides', '1.20', 'g/L', '< 1.50', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (10, 2, 'Cholestérol HDL', '0.58', 'g/L', '> 0.40', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (11, 2, 'Cholestérol LDL (calculé)', '1.63', 'g/L', '< 1.30', 1, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (12, 2, 'Goutte Épaisse (GE/TDR)', 'Négatif', '-', 'Négatif', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (13, 2, 'CRP Quantitative', '3.2', 'mg/L', '< 6.0', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (14, 3, 'Glycémie à jeun', '1.34', 'g/L', '0.70 - 1.10', 1, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (15, 3, 'Créatinine', '11.2', 'mg/L', '7.0 - 13.0', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (16, 3, 'Hémoglobine', '15.1', 'g/dL', '13.0 - 17.5', 0, '');
INSERT INTO lab_exam_result_item (id, order_id, parameter_name, measured_value, unit, reference_range, is_abnormal, notes) VALUES (17, 3, 'Transaminases ALAT', '28', 'UI/L', '< 45', 0, '');

-- --------------------------------------------------------------------------
-- 17. TABLE : medical_prescription_line (Lignes d'Ordonnances et Médicaments Prescrits)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_prescription_line (
  id INT PRIMARY KEY AUTO_INCREMENT,
  consultation_id INT NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration_days INT DEFAULT 7,
  instructions TEXT
);

INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (1, 1, 'Consultation Spécialisée Infectiologie', '500mg', '1 cp x 3/j', 7, 'Examen clinique approfondi');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (2, 1, 'NFS / Hémogramme Complet', '500mg', '1 cp x 3/j', 7, 'Urgent');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (3, 1, 'Goutte Épaisse + TDR Paludisme', '500mg', '1 cp x 3/j', 7, 'Recherche d''hématozoaires');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (4, 1, 'Artemether + Lumefantrine 80/480mg', '1 cp matin et soir', '1 cp x 3/j', 7, 'À prendre au milieu d''un repas gras.');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (5, 1, 'Paracétamol 1g Comprimés', '1 cp toutes les 6 heures si fièvre > 38.5°C', '1 cp x 3/j', 7, 'Ne pas dépasser 4g par jour.');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (6, 2, 'Consultation Cardiologie & ECG', '500mg', '1 cp x 3/j', 7, 'Électrocardiogramme de repos');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (7, 2, 'Creatinine + Urée sanguine + Ionogramme', '500mg', '1 cp x 3/j', 7, 'À jeun');
INSERT INTO medical_prescription_line (id, consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES (8, 2, 'Amlodipine 10mg', '1 cp le matin', '1 cp x 3/j', 7, 'Prise régulière au petit déjeuner.');

-- --------------------------------------------------------------------------
-- 18. TABLE : imaging_study_order (Examens d'Imagerie Médicale & Radiologie)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imaging_study_order (
  id INT PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL,
  partner_id INT NOT NULL,
  partner_name VARCHAR(255) NOT NULL,
  modality VARCHAR(100) NOT NULL,
  organ_region VARCHAR(150) NOT NULL,
  indication TEXT,
  status VARCHAR(50) NOT NULL,
  conclusion TEXT,
  radiologist_name VARCHAR(150),
  imaging_date VARCHAR(50)
);

INSERT INTO imaging_study_order (id, order_number, partner_id, partner_name, modality, organ_region, indication, status, conclusion, radiologist_name, imaging_date) VALUES (1, 'RAD-2026-0001', 1, 'Global Tech Solutions SAS (M. Konan)', 'Radiographie Numérique', 'Thorax Face & Profil', 'Bilan pré-embauche systématique et suspicion bronchite', 'validated', 'Indice cardio-thoracique normal (ICT 0.46). Pas de foyer de condensation parenchymateuse décelable ni épanchement pleural.', 'Dr. Sery Radiologue', '2026-02-15 09:30');
INSERT INTO imaging_study_order (id, order_number, partner_id, partner_name, modality, organ_region, indication, status, conclusion, radiologist_name, imaging_date) VALUES (2, 'RAD-2026-0002', 2, 'Nexus Digital (Mme Fatou Diallo)', 'Échographie', 'Abdomino-Pelvienne', 'Douleurs fosse iliaque droite fébriles', 'validated', 'Appendice non épaissi, pas d''épanchement du cul-de-sac de Douglas. Foie, vésicule et reins morphologiquement sans particularité.', 'Dr. Sery Radiologue', '2026-02-28 10:15');
INSERT INTO imaging_study_order (id, order_number, partner_id, partner_name, modality, organ_region, indication, status, conclusion, radiologist_name, imaging_date) VALUES (3, 'RAD-2026-0003', 3, 'Horizon Conseil (M. Jean-Paul Traoré)', 'Électrocardiogramme (ECG)', 'Cardiaque 12 dérivations', 'Bilan HTA et palpitations à l''effort', 'completed', 'Rythme sinusal régulier à 72 bpm. Pas de trouble de la conduction ni de la repolarisation. Légère hypertrophie ventriculaire gauche (HVG électrique).', 'Dr. Diallo Cardiologue', '2026-03-01 11:00');
INSERT INTO imaging_study_order (id, order_number, partner_id, partner_name, modality, organ_region, indication, status, conclusion, radiologist_name, imaging_date) VALUES (4, 'RAD-2026-0004', 4, 'Cabinet Alpha Conseil (M. Yao Franck)', 'Échographie Obstétricale', 'Pelvis / Fœtale T2', 'Échographie morphologique du 2ème trimestre (22 SA)', 'validated', 'Grossesse monofœtale intra-utérine évolutive. Morphologie normale, liquide amniotique adapté, placenta postérieur haut inséré.', 'Dr. Sery Radiologue', '2026-03-05 14:00');

-- --------------------------------------------------------------------------
-- 19. TABLES : pediatric_patient_record & pediatric_vaccination_schedule (Pédiatrie & PEV)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pediatric_patient_record (
  id INT PRIMARY KEY,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  birth_weight_kg DECIMAL(4,2),
  head_circumference_cm DECIMAL(4,1),
  apgar_score VARCHAR(20),
  maternal_history TEXT,
  nutrition_status VARCHAR(100),
  updated_at VARCHAR(50)
);

INSERT INTO pediatric_patient_record (id, partner_id, patient_name, birth_weight_kg, head_circumference_cm, apgar_score, maternal_history, nutrition_status, updated_at) VALUES (1, 1, 'Enfant Konan Junior', 3.35, 34.5, '9/10 - 10/10', 'Grossesse menée à terme, sans complication gravidique', 'Allaitement maternel exclusif bien conduit (Normotrophe)', '2026-02-15T10:00:00Z');
INSERT INTO pediatric_patient_record (id, partner_id, patient_name, birth_weight_kg, head_circumference_cm, apgar_score, maternal_history, nutrition_status, updated_at) VALUES (2, 2, 'Bébé Diallo Aïcha', 3.10, 33.8, '8/10 - 10/10', 'Accouchement voie basse spontané', 'Diversification alimentaire débutée (Poids/Âge Médiane OMS)', '2026-02-28T11:00:00Z');

CREATE TABLE IF NOT EXISTS pediatric_vaccination_schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  vaccine_name VARCHAR(150) NOT NULL,
  dose_number INT NOT NULL,
  target_age VARCHAR(50) NOT NULL,
  administration_date VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  batch_number VARCHAR(100),
  vaccinator_name VARCHAR(150)
);

INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (1, 'BCG + Polio 0 (VPO-0)', 1, 'À la naissance', '2025-11-10', 'administered', 'BCG-2025-X89', 'Inf. Kassi');
INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (1, 'Pentavalent 1 (DTC-HepB-Hib) + VPO-1 + Pneumo-1', 1, '6 Semaines', '2025-12-22', 'administered', 'PNT-2025-K44', 'Inf. Kassi');
INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (1, 'Pentavalent 2 + VPO-2 + Pneumo-2 + Rota-2', 2, '10 Semaines', '2026-01-20', 'administered', 'PNT-2026-A12', 'Inf. Kassi');
INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (1, 'Pentavalent 3 + VPO-3 + VPI + Pneumo-3', 3, '14 Semaines', '2026-02-18', 'administered', 'PNT-2026-B88', 'Inf. Kassi');
INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (1, 'Rougeole-Rubéole 1 (RR-1) + Fièvre Jaune (VAA)', 1, '9 Mois', '2026-08-10', 'scheduled', 'EN ATTENTE', 'À planifier');
INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (2, 'BCG + Polio 0', 1, 'À la naissance', '2025-12-05', 'administered', 'BCG-2025-Z90', 'Inf. Kassi');
INSERT INTO pediatric_vaccination_schedule (partner_id, vaccine_name, dose_number, target_age, administration_date, status, batch_number, vaccinator_name) VALUES (2, 'Pentavalent 1 + VPO-1', 1, '6 Semaines', '2026-01-16', 'administered', 'PNT-2026-A10', 'Inf. Kassi');

-- --------------------------------------------------------------------------
-- 20. TABLES : maternity_prenatal_cpn & maternity_delivery_record (Maternité & CPN)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maternity_prenatal_cpn (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  cpn_number INT NOT NULL,
  gestational_age_weeks INT NOT NULL,
  fundal_height_cm DECIMAL(4,1),
  fetal_heart_rate INT,
  blood_pressure VARCHAR(30),
  proteinuria VARCHAR(50),
  glycosuria VARCHAR(50),
  ultrasound_notes TEXT,
  consultation_date VARCHAR(50),
  midwife_name VARCHAR(150)
);

INSERT INTO maternity_prenatal_cpn (partner_id, patient_name, cpn_number, gestational_age_weeks, fundal_height_cm, fetal_heart_rate, blood_pressure, proteinuria, glycosuria, ultrasound_notes, consultation_date, midwife_name) VALUES (2, 'Mme Fatou Diallo', 1, 12, 12, 154, '110/70', 'Négatif', 'Négatif', 'Sac gestationnel unique intra-utérin, clarté nucale normale (1.2mm).', '2025-10-14', 'Sage-Femme Clarisse');
INSERT INTO maternity_prenatal_cpn (partner_id, patient_name, cpn_number, gestational_age_weeks, fundal_height_cm, fetal_heart_rate, blood_pressure, proteinuria, glycosuria, ultrasound_notes, consultation_date, midwife_name) VALUES (2, 'Mme Fatou Diallo', 2, 20, 19.5, 148, '115/75', 'Négatif', 'Négatif', 'Fœtus actif, morphologie satisfaisante, mouvements fœtaux bien perçus.', '2025-12-10', 'Sage-Femme Clarisse');
INSERT INTO maternity_prenatal_cpn (partner_id, patient_name, cpn_number, gestational_age_weeks, fundal_height_cm, fetal_heart_rate, blood_pressure, proteinuria, glycosuria, ultrasound_notes, consultation_date, midwife_name) VALUES (2, 'Mme Fatou Diallo', 3, 28, 27, 142, '120/80', 'Négatif', 'Négatif', 'Présentation céphalique, croissance régulière au 50ème percentile.', '2026-02-04', 'Sage-Femme Clarisse');
INSERT INTO maternity_prenatal_cpn (partner_id, patient_name, cpn_number, gestational_age_weeks, fundal_height_cm, fetal_heart_rate, blood_pressure, proteinuria, glycosuria, ultrasound_notes, consultation_date, midwife_name) VALUES (4, 'Mme Yao Affoué', 1, 14, 14, 150, '110/68', 'Négatif', 'Négatif', 'Grossesse débutante évolutive sans anomalie.', '2026-03-01', 'Sage-Femme Clarisse');

CREATE TABLE IF NOT EXISTS maternity_delivery_record (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  delivery_date VARCHAR(50) NOT NULL,
  delivery_mode VARCHAR(100) NOT NULL,
  newborn_gender VARCHAR(10) NOT NULL,
  birth_weight_g INT NOT NULL,
  apgar_1min INT NOT NULL,
  apgar_5min INT NOT NULL,
  midwife_name VARCHAR(150),
  complications TEXT
);

INSERT INTO maternity_delivery_record (partner_id, patient_name, delivery_date, delivery_mode, newborn_gender, birth_weight_g, apgar_1min, apgar_5min, midwife_name, complications) VALUES (2, 'Mme Fatou Diallo', '2026-02-28 04:15', 'Voie Basse Eutocique', 'F', 3100, 9, 10, 'Sage-Femme Clarisse', 'Aucune complication. Délivrance complète spontanée, périnée intact.');

-- --------------------------------------------------------------------------
-- 21. TABLE : hospital_admission (Hospitalisations & Affectation des Lits)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_admission (
  id INT PRIMARY KEY,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  bed_number VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  admission_date VARCHAR(50) NOT NULL,
  discharge_date VARCHAR(50),
  admission_reason TEXT,
  attending_doctor VARCHAR(150),
  state VARCHAR(50) NOT NULL
);

INSERT INTO hospital_admission (id, partner_id, patient_name, room_number, bed_number, department, admission_date, discharge_date, admission_reason, attending_doctor, state) VALUES (1, 1, 'M. Konan (Global Tech)', 'CH-102', 'LIT-01', 'Médecine Interne', '2026-02-15 10:00', '2026-02-18 14:00', 'Surveillance crise hypertensive & bilan rénal', 'Dr. Yao Kouamé', 'discharged');
INSERT INTO hospital_admission (id, partner_id, patient_name, room_number, bed_number, department, admission_date, discharge_date, admission_reason, attending_doctor, state) VALUES (2, 2, 'Mme Fatou Diallo', 'MAT-01', 'LIT-02', 'Maternité / Suites de Couches', '2026-02-27 22:30', '2026-03-02 11:00', 'Travail d''accouchement et suites de couches', 'Dr. Bamba Lamine', 'discharged');
INSERT INTO hospital_admission (id, partner_id, patient_name, room_number, bed_number, department, admission_date, discharge_date, admission_reason, attending_doctor, state) VALUES (3, 3, 'M. Jean-Paul Traoré', 'CH-204', 'LIT-01', 'Chirurgie / Traumatologie', '2026-03-01 08:30', NULL, 'Observation post-intervention hernie inguinale', 'Dr. Yao Kouamé', 'active');
INSERT INTO hospital_admission (id, partner_id, patient_name, room_number, bed_number, department, admission_date, discharge_date, admission_reason, attending_doctor, state) VALUES (4, 4, 'M. Yao Franck', 'PED-02', 'LIT-01', 'Pédiatrie', '2026-03-05 09:00', NULL, 'Gastro-entérite aiguë fébrile avec déshydratation modérée', 'Dr. Touré Aminata', 'active');

-- --------------------------------------------------------------------------
-- 22. TABLES : pharmacy_stock_item & pharmacy_dispensation_log (Pharmacie & Stocks)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_stock_item (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dci_code VARCHAR(100),
  category VARCHAR(100),
  dosage_form VARCHAR(100),
  standard_price DECIMAL(15,2) DEFAULT 0.00,
  list_price DECIMAL(15,2) DEFAULT 0.00,
  quantity_available INT DEFAULT 0,
  min_alert_threshold INT DEFAULT 10,
  expiry_date VARCHAR(50),
  batch_lot VARCHAR(100)
);

INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (1, 'Paracétamol 1000mg Bte/16', 'PAR-1G-CPR', 'Antalgique / Antipyrétique', 'Comprimé sécable', 650, 1200, 340, 50, '2028-06-30', 'LOT-PAR-2401');
INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (2, 'Amoxicilline + Acide Clavulanique 1g Bte/14', 'AMX-CLAV-1G', 'Antibiotique Bêta-lactamine', 'Comprimé pelliculé', 3200, 5800, 125, 30, '2027-12-31', 'LOT-AMX-2409');
INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (3, 'Artéméther + Luméfantrine 20/120mg Bte/24', 'CTA-ART-LUM', 'Antipaludique CTA', 'Comprimé', 1800, 3500, 210, 40, '2028-03-31', 'LOT-CTA-2503');
INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (4, 'Sérum Salé Isotonique NaCl 0.9% 500ml', 'PERF-NACL-500', 'Soluté de Perfusion', 'Poche pour perfusion', 800, 1600, 180, 60, '2029-01-31', 'LOT-NACL-2404');
INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (5, 'Oméprazole 20mg Gélule Bte/28', 'IPP-OME-20MG', 'Inhibiteur Pompe à Protons', 'Gélule gastro-résistante', 2100, 4200, 95, 25, '2027-08-31', 'LOT-OME-2408');
INSERT INTO pharmacy_stock_item (id, name, dci_code, category, dosage_form, standard_price, list_price, quantity_available, min_alert_threshold, expiry_date, batch_lot) VALUES (6, 'Ceftriaxone 1g Injectable IV/IM', 'CEF-1G-INJ', 'Céphalosporine 3G', 'Flacon injectable + solvant', 2400, 4500, 75, 20, '2027-11-30', 'LOT-CEF-2411');

CREATE TABLE IF NOT EXISTS pharmacy_dispensation_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_id INT,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  quantity_dispensed INT NOT NULL,
  dispensation_date VARCHAR(50) NOT NULL,
  pharmacist_name VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL
);

INSERT INTO pharmacy_dispensation_log (prescription_id, partner_id, patient_name, medication_name, quantity_dispensed, dispensation_date, pharmacist_name, status) VALUES (1, 1, 'M. Konan (Global Tech)', 'Paracétamol 1000mg Bte/16', 2, '2026-02-15 11:30', 'Pharm. Estelle N''Goran', 'delivered');
INSERT INTO pharmacy_dispensation_log (prescription_id, partner_id, patient_name, medication_name, quantity_dispensed, dispensation_date, pharmacist_name, status) VALUES (2, 2, 'Mme Fatou Diallo', 'Amoxicilline + Clavulanique 1g Bte/14', 1, '2026-02-28 12:00', 'Pharm. Estelle N''Goran', 'delivered');

-- --------------------------------------------------------------------------
-- 23. TABLE : nurse_care_act (Actes Infirmiers, Perfusions & Pansements)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nurse_care_act (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  consultation_id INT,
  act_type VARCHAR(150) NOT NULL,
  description TEXT,
  administered_at VARCHAR(50) NOT NULL,
  nurse_name VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT
);

INSERT INTO nurse_care_act (partner_id, patient_name, consultation_id, act_type, description, administered_at, nurse_name, status, notes) VALUES (1, 'M. Konan (Global Tech)', 1, 'Pose Voie Veineuse Périphérique & Perfusion NaCl 0.9%', 'Pose cathéter 20G pli du coude gauche sans complication, débit 30 gttes/min', '2026-02-15 09:15', 'Inf. Kassi Kouamé', 'completed', 'Bonne tolérance clinique, point de ponction propre');
INSERT INTO nurse_care_act (partner_id, patient_name, consultation_id, act_type, description, administered_at, nurse_name, status, notes) VALUES (2, 'Mme Fatou Diallo', 2, 'Pansement stérile & Soin de plaie', 'Réfection pansement chirurgical aseptique avec bétadine dermique', '2026-02-28 10:00', 'Inf. Kassi Kouamé', 'completed', 'Cicatrisation en bonne voie, pas d''inflammation');
INSERT INTO nurse_care_act (partner_id, patient_name, consultation_id, act_type, description, administered_at, nurse_name, status, notes) VALUES (3, 'M. Jean-Paul Traoré', 3, 'Injection Intramusculaire Antalgique', 'Administration IM fesse droite Diclofénac 75mg', '2026-03-01 10:30', 'Inf. Kassi Kouamé', 'completed', 'Soulagement rapide de la douleur évaluée à EVA 2/10 après 30 min');

-- --------------------------------------------------------------------------
-- 24. TABLES : res_audit_log & res_notification (Journal d'Audit & Notifications)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS res_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_name VARCHAR(150) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  timestamp VARCHAR(50) NOT NULL,
  details TEXT
);

INSERT INTO res_audit_log (user_name, action_type, entity_name, entity_id, timestamp, details) VALUES ('Administrateur Système', 'LOGIN', 'res_users', '1', '2026-03-01T08:00:00Z', 'Connexion réussie depuis IP autorisée');
INSERT INTO res_audit_log (user_name, action_type, entity_name, entity_id, timestamp, details) VALUES ('Jean Facturier', 'CREATE_INVOICE', 'account_move', '1', '2026-03-01T09:15:00Z', 'Création et transmission facture FAC/2026/0001');
INSERT INTO res_audit_log (user_name, action_type, entity_name, entity_id, timestamp, details) VALUES ('Marcelle Caissière', 'REGISTER_PAYMENT', 'account_payment', '1', '2026-03-01T09:30:00Z', 'Encaissement 5 400.00 FCFA avec émission reçu');

CREATE TABLE IF NOT EXISTS res_notification (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient VARCHAR(150) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at VARCHAR(50) NOT NULL
);

INSERT INTO res_notification (recipient, title, message, type, is_read, created_at) VALUES ('Tous les Utilisateurs', 'Système Opérationnel', 'Bienvenue sur la plateforme SIH & Clinique. Sauvegarde automatisée active.', 'system', 1, '2026-03-01T08:00:00Z');
INSERT INTO res_notification (recipient, title, message, type, is_read, created_at) VALUES ('Marcelle Caissière', 'Session Ouverte', 'Votre session de caisse SESSION00793 est ouverte et prête pour les règlements.', 'cash', 0, '2026-03-01T08:30:00Z');

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================================
-- FIN DU DUMP EXHAUSTIF - 23/09/2026
-- ==========================================================================
