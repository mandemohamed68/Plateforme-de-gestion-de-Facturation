-- ==============================================================================
-- BASE DE DONNÉES : GESTION DE FACTURATION MÉDICALE, CAISSE & LABORATOIRE
-- SCRIPT D'INITIALISATION COMPLET POUR MARIADB / MYSQL 8.0+
-- Encodage : UTF-8 (utf8mb4)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS `facturation_labo_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `facturation_labo_db`;

-- ------------------------------------------------------------------------------
-- 1. TABLE : company_settings (Identité de marque, coordonnées & configuration)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `company_settings`;
CREATE TABLE `company_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slogan` VARCHAR(255) DEFAULT '',
  `logo_url` TEXT DEFAULT NULL,
  `primary_color` VARCHAR(32) DEFAULT '#0f172a',
  `sidebar_color` VARCHAR(32) DEFAULT '#0b1329',
  `secondary_color` VARCHAR(32) DEFAULT '#0284c7',
  `phone` VARCHAR(128) DEFAULT '',
  `email` VARCHAR(128) DEFAULT '',
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(128) DEFAULT '',
  `country` VARCHAR(128) DEFAULT '',
  `rccm` VARCHAR(128) DEFAULT '',
  `tax_id` VARCHAR(128) DEFAULT '',
  `health_accreditation_number` VARCHAR(128) DEFAULT '',
  `currency_symbol` VARCHAR(16) DEFAULT 'FCFA',
  `default_tax_rate` DECIMAL(5,2) DEFAULT 0.00,
  `tax_exemption_default_reason` TEXT DEFAULT NULL,
  `bank_name` VARCHAR(255) DEFAULT '',
  `bank_iban` VARCHAR(128) DEFAULT '',
  `bank_bic` VARCHAR(64) DEFAULT '',
  `mobile_money_numbers` VARCHAR(255) DEFAULT '',
  `show_watermark` BOOLEAN DEFAULT TRUE,
  `watermark_text` VARCHAR(255) DEFAULT 'DOCUMENT CONFIDENTIEL ET OFFICIEL',
  `watermark_type` VARCHAR(32) DEFAULT 'both',
  `watermark_opacity` DECIMAL(3,2) DEFAULT 0.12,
  `flash_news_enabled` BOOLEAN DEFAULT TRUE,
  `flash_news_speed` INT DEFAULT 6,
  `invoice_footer` TEXT DEFAULT NULL,
  `ndm_prefix` VARCHAR(32) DEFAULT 'CHU-',
  `ndm_digits` INT DEFAULT 8,
  `ndm_next_number` INT DEFAULT 1001,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLE : res_groups (Rôles & Groupes de sécurité)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `res_groups`;
CREATE TABLE `res_groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `permissions` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLE : res_partners (Patients, Organismes Tiers-Payeurs, Prescripteurs)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `res_partners`;
CREATE TABLE `res_partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ndm` VARCHAR(64) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(255) DEFAULT NULL,
  `is_company` BOOLEAN DEFAULT FALSE,
  `partner_type` ENUM('patient', 'insurance', 'prescriber', 'company', 'supplier') DEFAULT 'patient',
  `gender` ENUM('M', 'F', 'Autre') DEFAULT 'M',
  `birth_date` DATE DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `street` TEXT DEFAULT NULL,
  `city` VARCHAR(128) DEFAULT NULL,
  `country` VARCHAR(128) DEFAULT 'Côte d\'Ivoire',
  `is_insurance` BOOLEAN DEFAULT FALSE,
  `insurance_id` INT DEFAULT NULL,
  `insurance_name` VARCHAR(255) DEFAULT NULL,
  `insurance_policy_number` VARCHAR(128) DEFAULT NULL,
  `insurance_coverage_rate` DECIMAL(5,2) DEFAULT 0.00,
  `prescribing_doctor` VARCHAR(255) DEFAULT NULL,
  `civil_status` VARCHAR(64) DEFAULT NULL,
  `profession` VARCHAR(128) DEFAULT NULL,
  `nationality` VARCHAR(128) DEFAULT 'Ivoirienne',
  `active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_partner_ndm` (`ndm`),
  INDEX `idx_partner_name` (`name`),
  INDEX `idx_partner_type` (`partner_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLE : res_users (Comptes Utilisateurs & Habilitations)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `res_users`;
CREATE TABLE `res_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `login` VARCHAR(128) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `role` VARCHAR(128) NOT NULL,
  `department` VARCHAR(128) DEFAULT 'Direction',
  `partner_id` INT DEFAULT NULL,
  `group_ids` JSON DEFAULT NULL,
  `permissions` JSON DEFAULT NULL,
  `active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABLE : account_taxes (Régimes Fiscaux & TVA)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `account_taxes`;
CREATE TABLE `account_taxes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(5,2) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABLE : product_products (Catalogue des Examens & Prestations de Santé)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_products`;
CREATE TABLE `product_products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `default_code` VARCHAR(64) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `list_price` DECIMAL(12,2) NOT NULL,
  `standard_price` DECIMAL(12,2) DEFAULT 0.00,
  `category` VARCHAR(128) DEFAULT 'Biologie Médicale',
  `sample_type` VARCHAR(128) DEFAULT 'Sang Total / Sérum',
  `turnaround_time` VARCHAR(64) DEFAULT '24 heures',
  `reference_values` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_product_code` (`default_code`),
  INDEX `idx_product_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABLE : till_sessions (Vacations de Caisse & Facturation Journalières)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `till_sessions`;
CREATE TABLE `till_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_code` VARCHAR(64) UNIQUE NOT NULL,
  `till_name` VARCHAR(128) NOT NULL,
  `cashier_id` INT NOT NULL,
  `cashier_name` VARCHAR(255) NOT NULL,
  `opening_balance` DECIMAL(12,2) DEFAULT 0.00,
  `total_collected` DECIMAL(12,2) DEFAULT 0.00,
  `total_cash_collected` DECIMAL(12,2) DEFAULT 0.00,
  `total_mobile_money_collected` DECIMAL(12,2) DEFAULT 0.00,
  `total_card_collected` DECIMAL(12,2) DEFAULT 0.00,
  `total_check_collected` DECIMAL(12,2) DEFAULT 0.00,
  `transactions_count` INT DEFAULT 0,
  `state` ENUM('new', 'in_progress', 'closed') DEFAULT 'in_progress',
  `opening_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `closing_date` TIMESTAMP NULL DEFAULT NULL,
  `closing_actual_cash` DECIMAL(12,2) DEFAULT NULL,
  `cash_variance` DECIMAL(12,2) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `close_notes` TEXT DEFAULT NULL,
  INDEX `idx_till_cashier` (`cashier_id`),
  INDEX `idx_till_state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABLE : account_moves (Factures Patients, Tiers-Payeurs & Reçus)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `account_moves`;
CREATE TABLE `account_moves` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) UNIQUE NOT NULL,
  `move_type` VARCHAR(32) NOT NULL DEFAULT 'out_invoice',
  `state` ENUM('draft', 'posted', 'cancel') DEFAULT 'draft',
  `payment_state` ENUM('not_paid', 'partial', 'paid', 'in_payment') DEFAULT 'not_paid',
  `invoice_date` DATE NOT NULL,
  `invoice_date_due` DATE NOT NULL,
  `partner_id` INT NOT NULL,
  `till_session_id` INT DEFAULT NULL,
  `invoice_user_id` INT DEFAULT NULL,
  `amount_untaxed` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount_tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount_residual` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `patient_share_amount` DECIMAL(12,2) DEFAULT 0.00,
  `insurance_share_amount` DECIMAL(12,2) DEFAULT 0.00,
  `coverage_rate` DECIMAL(5,2) DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_move_partner` (`partner_id`),
  INDEX `idx_move_state` (`state`),
  INDEX `idx_move_session` (`till_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABLE : account_move_lines (Lignes de Factures / Actes Réalisés)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `account_move_lines`;
CREATE TABLE `account_move_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `move_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `price_unit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(5,2) DEFAULT 0.00,
  `price_subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `price_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`move_id`) REFERENCES `account_moves`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABLE : account_payments (Règlements & Encaissements de Caisse)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `account_payments`;
CREATE TABLE `account_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) UNIQUE NOT NULL,
  `move_id` INT DEFAULT NULL,
  `partner_id` INT NOT NULL,
  `till_session_id` INT DEFAULT NULL,
  `cashier_id` INT DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `date` DATE NOT NULL,
  `payment_method_id` VARCHAR(64) NOT NULL DEFAULT 'cash',
  `journal_id` INT DEFAULT 1,
  `state` ENUM('draft', 'posted', 'cancel') DEFAULT 'posted',
  `communication` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payment_session` (`till_session_id`),
  INDEX `idx_payment_partner` (`partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABLE : partner_reductions (Grille de Réductions Spéciales / Conventions)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `partner_reductions`;
CREATE TABLE `partner_reductions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `partner_type` VARCHAR(128) NOT NULL,
  `category_name` VARCHAR(128) NOT NULL DEFAULT 'All',
  `discount_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. TABLE : lab_exam_orders (Plateau Technique & Résultats Biologiques)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `lab_exam_orders`;
CREATE TABLE `lab_exam_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(64) UNIQUE NOT NULL,
  `partner_id` INT NOT NULL,
  `move_id` INT DEFAULT NULL,
  `prescribing_doctor` VARCHAR(255) DEFAULT NULL,
  `clinical_notes` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'sample_collected', 'in_analysis', 'validated', 'delivered') DEFAULT 'pending',
  `sample_type` VARCHAR(128) DEFAULT 'Sang Total',
  `collected_at` TIMESTAMP NULL DEFAULT NULL,
  `validated_at` TIMESTAMP NULL DEFAULT NULL,
  `validated_by` VARCHAR(255) DEFAULT NULL,
  `items` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_lab_partner` (`partner_id`),
  INDEX `idx_lab_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INSERTION DES DONNÉES INITIALES (SEED DATA)
-- ==============================================================================

-- 1. Configuration Entreprise
INSERT INTO `company_settings` (`id`, `name`, `slogan`, `phone`, `email`, `address`, `city`, `country`, `rccm`, `tax_id`, `health_accreditation_number`, `currency_symbol`, `default_tax_rate`, `bank_name`, `bank_iban`, `bank_bic`, `mobile_money_numbers`, `watermark_text`, `ndm_prefix`, `ndm_digits`, `ndm_next_number`)
VALUES (1, "LABORATOIRE D'ANALYSES MÉDICALES & BIOLOGIE CLINIQUE", "Biologie Médicale, Diagnostics Spécialisés & Examens de Santé", "+225 27 20 22 33 44 / +225 07 08 09 10 11", "contact@laboratoire-biologie.ci", "Plateau Medical Center, Bd Hassan II", "Abidjan", "Côte d'Ivoire", "CI-ABJ-2024-B-12940", "CI 01928374 A", "AGR-MSHP-2024-0098", "FCFA", 0.00, "Société Générale Côte d'Ivoire (SGCI)", "CI93 0100 2000 3000 4000 50", "SGCIX01", "Wave / Orange Money / Moov : +225 07 08 09 10 11", "LABORATOIRE - DOCUMENT OFFICIEL", "CHU-", 8, 1005);

-- 2. Rôles & Groupes
INSERT INTO `res_groups` (`id`, `name`, `description`, `permissions`) VALUES
(1, "Direction & Administration Système", "Accès universel et supervision totale", '["all"]'),
(2, "Facturation Clients Seule", "Accueil des patients et émission des factures", '["can_manage_invoices", "can_manage_partners"]'),
(3, "Caisse & Encaissement Seul", "Gestion des encaissements et arrêtés journaliers", '["can_register_payments", "can_manage_partners"]'),
(4, "Facture / Caisse (Polyvalent)", "Facturation complète et encaissement au guichet", '["can_manage_invoices", "can_register_payments", "can_manage_partners"]'),
(5, "Biologiste Médical", "Validation biologique et signature médicale", '["can_manage_invoices", "can_validate_medical", "can_enter_results", "can_manage_lab_catalog"]'),
(6, "Technicien de Laboratoire", "Saisie paillasse des paramètres d'analyses", '["can_enter_results"]'),
(7, "Comptabilité & Finance", "Suivi du Grand Livre, relances et audit", '["can_validate_invoices", "can_register_payments", "can_view_financials"]');

-- 3. Comptes Utilisateurs Initiaux
INSERT INTO `res_users` (`id`, `login`, `password_hash`, `name`, `email`, `role`, `department`, `group_ids`, `permissions`, `active`) VALUES
(1, 'mandemohamed68@gmail.com', 'admin123', 'Mande Mohamed (Directeur Général)', 'mandemohamed68@gmail.com', 'Directeur Général & Superviseur Système', 'Direction Générale', '[1]', '["all"]', 1),
(2, 'admin', 'admin123', 'Administrateur Principal', 'admin@polyclinique.ci', 'Superviseur Système', 'Direction', '[1]', '["all"]', 1),
(3, 'facturier', 'facture123', 'Kouassi Affoué Marie', 'facturation@polyclinique.ci', 'Facturier (Établissement Factures Seul)', 'Facturation', '[2]', '["can_manage_invoices", "can_manage_partners"]', 1),
(4, 'caissier', 'caisse123', 'Yao Konan Jean', 'caisse@polyclinique.ci', 'Caissier (Encaissement Caisse Seul)', 'Caisse', '[3]', '["can_register_payments", "can_manage_partners"]', 1),
(5, 'facture_caisse', 'polyvalent123', 'Diallo Aminata', 'accueil@polyclinique.ci', 'Facture / Caisse (Polyvalent Facturation & Caisse)', 'Accueil & Caisse', '[4]', '["can_manage_invoices", "can_register_payments", "can_manage_partners"]', 1),
(6, 'dr.toure', 'labo123', 'Dr Touré Ibrahim', 'dr.toure@polyclinique.ci', 'Biologiste Médical (Chef de Laboratoire)', 'Laboratoire Médical', '[5]', '["can_manage_invoices", "can_validate_medical", "can_enter_results", "can_manage_lab_catalog"]', 1),
(7, 'technicien', 'tech123', 'Soro Bakary', 'technique@polyclinique.ci', 'Technicien Supérieur Analyses Médicales', 'Laboratoire Médical', '[6]', '["can_enter_results"]', 1),
(8, 'comptable', 'compta123', 'Bamba Fatoumata', 'comptabilite@polyclinique.ci', 'Comptable & Tiers-Payeur', 'Comptabilité', '[7]', '["can_validate_invoices", "can_register_payments", "can_view_financials"]', 1);

-- 4. Taxes
INSERT INTO `account_taxes` (`id`, `name`, `amount`, `description`, `active`) VALUES
(1, 'Exonéré TVA (Santé & Biologie Médicale)', 0.00, 'Exonération légale sur les actes médicaux', 1),
(2, 'TVA Standard (18%)', 18.00, 'Taux légal UEMOA', 1);

-- 5. Catalogue Examens de Santé
INSERT INTO `product_products` (`id`, `default_code`, `name`, `list_price`, `standard_price`, `category`, `sample_type`, `turnaround_time`, `reference_values`) VALUES
(1, 'BIO-NFS', 'Numération Formule Sanguine (NFS / Hémogramme)', 8500.00, 2000.00, 'Hématologie', 'Sang Total EDTA', '2 heures', 'Leucocytes: 4.0 - 10.0 x10^3/µL | Hématies: 4.5 - 5.9 x10^6/µL | Hémoglobine: 13.0 - 17.5 g/dL'),
(2, 'BIO-GLY', 'Glycémie à Jeun', 4000.00, 800.00, 'Biochimie', 'Plasma Fluoré', '1 heure', '0.70 - 1.10 g/L (Normoglycémie)'),
(3, 'BIO-LIP', 'Bilan Lipidique Complet (Cholestérol Total, HDL, LDL, Triglycérides)', 18000.00, 4500.00, 'Biochimie', 'Sérum', '4 heures', 'Cholestérol Total < 2.00 g/L | Triglycérides < 1.50 g/L | HDL > 0.40 g/L'),
(4, 'BIO-CRP', 'Protéine C-Réactive Ultra-Sensible (CRP)', 12000.00, 3000.00, 'Immunologie', 'Sérum', '2 heures', '< 6.0 mg/L (Absence de syndrome inflammatoire)'),
(5, 'BIO-PCR-PALU', 'Goutte Épaisse & Frottis Sanguin (Paludisme)', 6500.00, 1500.00, 'Parasitologie', 'Sang Total', '1 heure', 'Absence de trophozoïtes de Plasmodium'),
(6, 'BIO-IONO', 'Ionogramme Sanguin (Na+, K+, Cl-)', 14000.00, 3500.00, 'Biochimie', 'Sérum', '3 heures', 'Sodium: 135-145 mmol/L | Potassium: 3.5-5.0 mmol/L | Chlore: 98-106 mmol/L');

-- 6. Répertoire Patients & Tiers-Payeurs
INSERT INTO `res_partners` (`id`, `ndm`, `name`, `first_name`, `partner_type`, `gender`, `birth_date`, `age`, `phone`, `email`, `city`, `insurance_name`, `insurance_policy_number`, `insurance_coverage_rate`, `prescribing_doctor`) VALUES
(1, 'CHU-00001001', 'Koffi Yao Stéphane', 'Stéphane', 'patient', 'M', '1988-05-14', 37, '+225 07 48 29 11 02', 'koffi.stephane@gmail.com', 'Abidjan Cocody', 'AXA Assurances Santé', 'POL-AXA-98124', 80.00, 'Dr Gondo (CHU Treichville)'),
(2, 'CHU-00001002', 'Binate Awa', 'Awa', 'patient', 'F', '1995-11-20', 30, '+225 05 12 88 44 99', 'awa.binate@yahoo.fr', 'Abidjan Plateau', 'NSIA Assurances', 'POL-NSIA-4401', 70.00, 'Dr Touré (Polyclinique)'),
(3, 'CHU-00001003', 'Sanogo Mamadou', 'Mamadou', 'patient', 'M', '1972-03-08', 53, '+225 01 02 03 04 05', 'm.sanogo@ci-transport.com', 'Abidjan Marcory', 'Sanlam Assurance', 'POL-SAN-0019', 80.00, 'Dr Aké (Cardiologue)'),
(4, 'ASSUR-AXA-01', 'AXA Assurances Côte d\'Ivoire', NULL, 'insurance', NULL, NULL, NULL, '+225 27 20 30 40 50', 'tiers-payeur@axa.ci', 'Abidjan Plateau', NULL, NULL, 100.00, NULL);

-- 7. Session de Vacation Initiale
INSERT INTO `till_sessions` (`id`, `session_code`, `till_name`, `cashier_id`, `cashier_name`, `opening_balance`, `total_collected`, `total_cash_collected`, `total_mobile_money_collected`, `transactions_count`, `state`, `opening_date`) VALUES
(1, 'SESS-2026-0001', 'Caisse Principale 1', 1, 'Mande Mohamed (Directeur Général)', 50000.00, 105000.00, 65000.00, 40000.00, 3, 'in_progress', NOW());

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
