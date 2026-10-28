-- ==============================================================================
-- BASE DE DONNÉES EXHAUSTIVE MARIADB / MYSQL - SIH LABORATOIRE & FACTURATION
-- Nom de la Base de Données : lab_facturation_db
-- ==============================================================================
-- Ce script résout deux problèmes majeurs :
-- 1. Absence des paramètres pré-positionnés (Hémogramme, Bilan Lipidique, etc.)
-- 2. Tables incomplètes dans MariaDB local
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `lab_facturation_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lab_facturation_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABLE DES PARAMÈTRES D'ANALYSES (RÉFÉRENTIEL / TEMPLATES PRÉ-POSITIONNÉS)
-- ------------------------------------------------------------------------------
-- Cette table stocke les paramètres pré-positionnés (nom, unité, normes de réf)
-- pour chaque examen biologique (NFS, Bilan Lipidique, Glycémie, etc.).
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `labo_exam_parametre_template`;
CREATE TABLE `labo_exam_parametre_template` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_code` VARCHAR(50) NOT NULL,
  `exam_name` VARCHAR(150) NOT NULL,
  `parameter_name` VARCHAR(150) NOT NULL,
  `unite` VARCHAR(50) DEFAULT '',
  `valeurs_reference` VARCHAR(100) DEFAULT '',
  `norme_min` DECIMAL(10,3) DEFAULT NULL,
  `norme_max` DECIMAL(10,3) DEFAULT NULL,
  `ordre` INT DEFAULT 1,
  `active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLE DES ÉCHANTILLONS & TUBES (LABORATOIRE LIMS)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `labo_echantillon`;
CREATE TABLE `labo_echantillon` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code_barre` VARCHAR(100) NOT NULL UNIQUE,
  `numero_dossier` VARCHAR(100) NOT NULL,
  `patient_id` INT DEFAULT NULL,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_gender` VARCHAR(10) DEFAULT 'M',
  `patient_age` INT DEFAULT NULL,
  `prescripteur_nom` VARCHAR(200) DEFAULT 'Dr. Prescripteur Externe',
  `exam_code` VARCHAR(50) NOT NULL,
  `exam_name` VARCHAR(150) NOT NULL,
  `departement` VARCHAR(100) DEFAULT 'Biologie Médicale',
  `type_prelevement` VARCHAR(100) DEFAULT 'Sang Total (EDTA)',
  `date_prelevement` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `preleve_par` VARCHAR(150) DEFAULT 'Infirmier Préleveur',
  `statut` VARCHAR(50) DEFAULT 'en_attente_paillasse', -- 'preleve', 'en_attente_paillasse', 'en_cours', 'resultat_saisi', 'valide_tech', 'valide_bio'
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLE DES RÉSULTATS D'ANALYSES (RESULTAT_RESULTAT_LABO)
-- ------------------------------------------------------------------------------
-- Stocke les mesures saisies ou transmises par automate pour chaque échantillon.
-- Les lignes de paramètres y sont pré-positionnées avec valeur_mesuree = NULL.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `resultat_resultat_labo`;
CREATE TABLE `resultat_resultat_labo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `echantillon_id` INT NOT NULL,
  `exam_name` VARCHAR(150) NOT NULL,
  `parameter_name` VARCHAR(150) NOT NULL,
  `valeur_mesuree` VARCHAR(100) DEFAULT NULL,
  `unite` VARCHAR(50) DEFAULT '',
  `valeurs_reference` VARCHAR(100) DEFAULT '',
  `is_abnormal` TINYINT(1) DEFAULT 0,
  `valide_par_technicien` VARCHAR(150) DEFAULT NULL,
  `valide_par_biologiste` VARCHAR(150) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending_entry', -- 'pending_entry', 'draft', 'validated'
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_echantillon` (`echantillon_id`),
  FOREIGN KEY (`echantillon_id`) REFERENCES `labo_echantillon` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLE CONFIGURATION ÉTABLISSEMENT & LOGO
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `company_settings`;
CREATE TABLE `company_settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slogan` VARCHAR(255) DEFAULT '',
  `logo_url` TEXT,
  `primary_color` VARCHAR(30) DEFAULT '#0f172a',
  `phone` VARCHAR(100) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `address` VARCHAR(255) DEFAULT '',
  `city` VARCHAR(100) DEFAULT 'Abidjan',
  `country` VARCHAR(100) DEFAULT 'Côte d\'Ivoire',
  `rccm` VARCHAR(100) DEFAULT '',
  `tax_id` VARCHAR(100) DEFAULT '',
  `health_accreditation_number` VARCHAR(100) DEFAULT '',
  `currency_symbol` VARCHAR(20) DEFAULT 'FCFA',
  `default_tax_rate` DECIMAL(5,2) DEFAULT 0.00,
  `tax_exemption_default_reason` TEXT,
  `bank_name` VARCHAR(150) DEFAULT '',
  `bank_iban` VARCHAR(100) DEFAULT '',
  `bank_bic` VARCHAR(50) DEFAULT '',
  `mobile_money_numbers` TEXT,
  `medical_director_name` VARCHAR(200) DEFAULT '',
  `lab_turnaround_default` VARCHAR(150) DEFAULT '2 heures à 24 heures',
  `invoice_footer` TEXT,
  `hospital_services_json` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABLES UTILISATEURS & GROUPES RBAC
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `res_groups`;
CREATE TABLE `res_groups` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `permissions_json` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `res_users`;
CREATE TABLE `res_users` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `login` VARCHAR(150) NOT NULL UNIQUE,
  `email` VARCHAR(200),
  `role` VARCHAR(100) DEFAULT 'user',
  `department` VARCHAR(100) DEFAULT 'General',
  `phone` VARCHAR(50),
  `active` TINYINT(1) DEFAULT 1,
  `group_ids_json` TEXT,
  `permissions_json` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABLES PATIENTS, TIERS-PAYEURS & RÉDUCTIONS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `res_partner`;
CREATE TABLE `res_partner` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `is_company` TINYINT(1) DEFAULT 0,
  `partner_type` VARCHAR(50) DEFAULT 'patient', -- 'patient', 'insurance', 'company', 'supplier'
  `email` VARCHAR(255),
  `phone` VARCHAR(100),
  `street` VARCHAR(255),
  `city` VARCHAR(100),
  `vat` VARCHAR(100),
  `gender` VARCHAR(10),
  `age` INT,
  `birth_date` DATE,
  `ndm` VARCHAR(100),
  `social_security_number` VARCHAR(100),
  `insurance_company` VARCHAR(150),
  `insurance_rate` DECIMAL(5,2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `partner_reduction`;
CREATE TABLE `partner_reduction` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_type` VARCHAR(150) NOT NULL,
  `category_name` VARCHAR(100) DEFAULT 'All',
  `reduction_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABLES CATALOGUE PRESTATIONS & EXAMENS BIOLOGIQUES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_template`;
CREATE TABLE `product_template` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `default_code` VARCHAR(100),
  `list_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `standard_price` DECIMAL(15,2) DEFAULT 0.00,
  `category_name` VARCHAR(150) DEFAULT 'Biologie',
  `sample_type` VARCHAR(100),
  `active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_product`;
CREATE TABLE `product_product` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `default_code` VARCHAR(100),
  `list_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `standard_price` DECIMAL(15,2) DEFAULT 0.00,
  `category_name` VARCHAR(150) DEFAULT 'Biologie',
  `turnaround_time` VARCHAR(100) DEFAULT '2 heures',
  `sample_type` VARCHAR(100) DEFAULT 'Sang Total',
  `active` TINYINT(1) DEFAULT 1,
  `parameters_json` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABLES DOSSIERS DE CONSULTATIONS & DOSSIERS BIOLOGIQUES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `medical_consultation`;
CREATE TABLE `medical_consultation` (
  `id` INT PRIMARY KEY,
  `partner_id` INT NOT NULL,
  `patient_name` VARCHAR(255),
  `doctor_name` VARCHAR(200),
  `specialty` VARCHAR(100),
  `date` VARCHAR(50),
  `status` VARCHAR(50),
  `chief_complaint` TEXT,
  `blood_pressure` VARCHAR(30),
  `heart_rate` INT,
  `temperature` DECIMAL(4,1),
  `weight` DECIMAL(5,2),
  `height` DECIMAL(5,2),
  `spO2` INT,
  `triage_level` INT DEFAULT 3,
  `diagnosis_primary` VARCHAR(255),
  `clinical_notes` TEXT,
  `prescriptions_json` TEXT,
  `lab_orders_json` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lab_exam_order`;
CREATE TABLE `lab_exam_order` (
  `id` INT PRIMARY KEY,
  `order_number` VARCHAR(100) NOT NULL UNIQUE,
  `partner_id` INT,
  `partner_name` VARCHAR(255),
  `patient_gender` VARCHAR(10),
  `patient_age` INT,
  `prescribing_doctor` VARCHAR(255),
  `sampling_date` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT 'pending_sampling',
  `department` VARCHAR(100) DEFAULT 'Biologie Médicale',
  `conclusion` TEXT,
  `technician_name` VARCHAR(150),
  `parameters_json` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABLES COMPTABILITÉ, FACTURATION & CAISSE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `account_tax`;
CREATE TABLE `account_tax` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(8,4) NOT NULL,
  `amount_type` VARCHAR(50) DEFAULT 'percent',
  `type_tax_use` VARCHAR(50) DEFAULT 'sale',
  `active` TINYINT(1) DEFAULT 1,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_move`;
CREATE TABLE `account_move` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `move_type` VARCHAR(50) NOT NULL DEFAULT 'out_invoice',
  `state` VARCHAR(50) NOT NULL DEFAULT 'posted',
  `partner_id` INT,
  `partner_name` VARCHAR(255),
  `date` VARCHAR(50),
  `invoice_date` VARCHAR(50),
  `invoice_date_due` VARCHAR(50),
  `amount_untaxed` DECIMAL(15,2) DEFAULT 0.00,
  `amount_tax` DECIMAL(15,2) DEFAULT 0.00,
  `amount_total` DECIMAL(15,2) DEFAULT 0.00,
  `amount_residual` DECIMAL(15,2) DEFAULT 0.00,
  `payment_state` VARCHAR(50) DEFAULT 'not_paid',
  `invoice_user_id` INT,
  `invoice_user_name` VARCHAR(150),
  `insurance_share` DECIMAL(15,2) DEFAULT 0.00,
  `patient_share` DECIMAL(15,2) DEFAULT 0.00,
  `insurance_company` VARCHAR(150),
  `guarantee_letter_number` VARCHAR(100),
  `narration` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_move_line`;
CREATE TABLE `account_move_line` (
  `id` INT PRIMARY KEY,
  `move_id` INT NOT NULL,
  `product_id` INT,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1.00,
  `price_unit` DECIMAL(15,2) DEFAULT 0.00,
  `discount` DECIMAL(5,2) DEFAULT 0.00,
  `price_subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `price_total` DECIMAL(15,2) DEFAULT 0.00,
  FOREIGN KEY (`move_id`) REFERENCES `account_move` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_payment`;
CREATE TABLE `account_payment` (
  `id` INT PRIMARY KEY,
  `payment_reference` VARCHAR(100),
  `partner_id` INT,
  `partner_name` VARCHAR(255),
  `move_id` INT,
  `invoice_name` VARCHAR(100),
  `amount` DECIMAL(15,2) DEFAULT 0.00,
  `payment_date` VARCHAR(50),
  `state` VARCHAR(50) DEFAULT 'posted',
  `payment_method_code` VARCHAR(50) DEFAULT 'cash',
  `journal_name` VARCHAR(100) DEFAULT 'Caisse Principale',
  `cashier_name` VARCHAR(150),
  `transaction_reference` VARCHAR(150)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `caisse_session`;
CREATE TABLE `caisse_session` (
  `id` INT PRIMARY KEY,
  `session_code` VARCHAR(100) NOT NULL,
  `user_id` INT,
  `cashier_name` VARCHAR(150),
  `state` VARCHAR(50) DEFAULT 'in_progress',
  `opening_balance` DECIMAL(15,2) DEFAULT 0.00,
  `closing_balance` DECIMAL(15,2) DEFAULT 0.00,
  `total_collected` DECIMAL(15,2) DEFAULT 0.00,
  `opening_date` VARCHAR(50),
  `closing_date` VARCHAR(50),
  `cash_difference` DECIMAL(15,2) DEFAULT 0.00,
  `closing_notes` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABLES WORKFLOW, AUDIT & NOTIFICATIONS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `workflow_log`;
CREATE TABLE `workflow_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `echantillon_id` INT NOT NULL,
  `resultat_id` INT DEFAULT NULL,
  `etape` VARCHAR(100) NOT NULL,
  `etat_avant` VARCHAR(100),
  `etat_apres` VARCHAR(100),
  `acteur_nom` VARCHAR(150),
  `commentaire` TEXT,
  `date_action` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification_queue`;
CREATE TABLE `notification_queue` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) DEFAULT 'sms',
  `destinataire` VARCHAR(255) NOT NULL,
  `sujet` VARCHAR(255),
  `message` TEXT,
  `statut` VARCHAR(50) DEFAULT 'en_attente',
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INJECTION DU RÉFÉRENTIEL DES PARAMÈTRES PRÉ-POSITIONNÉS POUR LES EXAMENS
-- ==============================================================================

INSERT INTO `labo_exam_parametre_template` (`exam_code`, `exam_name`, `parameter_name`, `unite`, `valeurs_reference`, `norme_min`, `norme_max`, `ordre`) VALUES
-- 1. NFS / Hémogramme Complet
('NFS', 'Hémogramme Complet (NFS)', 'Erythrocytes (numération)', 'T/L', '4.0 - 5.5', 4.00, 5.50, 1),
('NFS', 'Hémogramme Complet (NFS)', 'Taux d\'Hémoglobine', 'g/dL', '12.0 - 16.0', 12.00, 16.00, 2),
('NFS', 'Hémogramme Complet (NFS)', 'Hématocrite', '%', '37 - 48', 37.00, 48.00, 3),
('NFS', 'Hémogramme Complet (NFS)', 'VGM (Volume Globulaire Moyen)', 'fL', '80 - 100', 80.00, 100.00, 4),
('NFS', 'Hémogramme Complet (NFS)', 'TCMH', 'pg', '27 - 32', 27.00, 32.00, 5),
('NFS', 'Hémogramme Complet (NFS)', 'CCMH', 'g/dL', '32 - 36', 32.00, 36.00, 6),
('NFS', 'Hémogramme Complet (NFS)', 'Leucocytes (numération)', 'G/L', '4.0 - 10.0', 4.00, 10.00, 7),
('NFS', 'Hémogramme Complet (NFS)', 'Neutrophiles', '%', '40 - 75', 40.00, 75.00, 8),
('NFS', 'Hémogramme Complet (NFS)', 'Eosinophiles', '%', '1 - 5', 1.00, 5.00, 9),
('NFS', 'Hémogramme Complet (NFS)', 'Basophiles', '%', '0 - 1', 0.00, 1.00, 10),
('NFS', 'Hémogramme Complet (NFS)', 'Lymphocytes', '%', '20 - 45', 20.00, 45.00, 11),
('NFS', 'Hémogramme Complet (NFS)', 'Monocytes', '%', '2 - 10', 2.00, 10.00, 12),
('NFS', 'Hémogramme Complet (NFS)', 'Plaquettes (numération)', 'G/L', '150 - 400', 150.00, 400.00, 13),

-- 2. Bilan Lipidique
('LIP', 'Bilan Lipidique', 'Cholestérol Total', 'g/L', '< 2.00', 0.00, 2.00, 1),
('LIP', 'Bilan Lipidique', 'Triglycérides', 'g/L', '< 1.50', 0.00, 1.50, 2),
('LIP', 'Bilan Lipidique', 'Cholestérol HDL', 'g/L', '> 0.40', 0.40, 2.00, 3),
('LIP', 'Bilan Lipidique', 'Cholestérol LDL', 'g/L', '< 1.30', 0.00, 1.30, 4),
('LIP', 'Bilan Lipidique', 'Aspect du Sérum', 'Qualitatif', 'Limpide', NULL, NULL, 5),

-- 3. Glycémie à Jeun
('GLY', 'Glycémie à Jeun', 'Glycémie à Jeun', 'g/L', '0.70 - 1.10', 0.70, 1.10, 1),

-- 4. Bilan Rénal
('REN', 'Bilan Rénal', 'Urée Sanguine', 'g/L', '0.15 - 0.45', 0.15, 0.45, 1),
('REN', 'Bilan Rénal', 'Créatininémie', 'mg/L', '6.0 - 12.0', 6.00, 12.00, 2),
('REN', 'Bilan Rénal', 'Acide Urique', 'mg/L', '25 - 60', 25.00, 60.00, 3),

-- 5. Bilan Hépatique
('HEP', 'Bilan Hépatique', 'Transaminases ASAT (TGO)', 'UI/L', '< 35', 0.00, 35.00, 1),
('HEP', 'Bilan Hépatique', 'Transaminases ALAT (TGP)', 'UI/L', '< 45', 0.00, 45.00, 2),
('HEP', 'Bilan Hépatique', 'Bilirubine Totale', 'mg/L', '< 12', 0.00, 12.00, 3),
('HEP', 'Bilan Hépatique', 'Phosphatases Alcalines (PAL)', 'UI/L', '40 - 130', 40.00, 130.00, 4),
('HEP', 'Bilan Hépatique', 'Gamma-GT', 'UI/L', '< 55', 0.00, 55.00, 5),

-- 6. Ionogramme Sanguin
('IONO', 'Ionogramme Sanguin', 'Sodium (Na+)', 'mEq/L', '135 - 145', 135.00, 145.00, 1),
('IONO', 'Ionogramme Sanguin', 'Potassium (K+)', 'mEq/L', '3.5 - 5.0', 3.50, 5.00, 2),
('IONO', 'Ionogramme Sanguin', 'Chlore (Cl-)', 'mEq/L', '98 - 106', 98.00, 106.00, 3),
('IONO', 'Ionogramme Sanguin', 'Calcium Sanguin', 'mg/L', '88 - 102', 88.00, 102.00, 4),

-- 7. CRP & Bilan Inflammatoire
('CRP', 'Protéine C-Réactive (CRP)', 'Protéine C-Réactive', 'mg/L', '< 6.0', 0.00, 6.00, 1),
('VS', 'Vitesse de Sédimentation (VS)', 'VS (1ère heure)', 'mm', '< 15', 0.00, 15.00, 1),

-- 8. Paludisme (Goutte Épaisse & TDR)
('PALU', 'Goutte Épaisse & TDR Paludisme', 'Goutte Épaisse (Plasmodium)', 'Trophozoïtes/µL', 'Négatif', NULL, NULL, 1),
('PALU', 'Goutte Épaisse & TDR Paludisme', 'TDR Paludisme (Ag Pf/Pan)', 'Qualitatif', 'Négatif', NULL, NULL, 2);

-- ==============================================================================
-- TRIGGER AUTOMATIQUE : PRÉ-POSITIONNE LES PARAMÈTRES LORS DU PRÉLÈVEMENT TUBE
-- ==============================================================================
DELIMITER $$
CREATE TRIGGER `trg_prepopulate_labo_resultats` 
AFTER INSERT ON `labo_echantillon`
FOR EACH ROW
BEGIN
  INSERT INTO `resultat_resultat_labo` (`echantillon_id`, `exam_name`, `parameter_name`, `valeur_mesuree`, `unite`, `valeurs_reference`, `status`)
  SELECT 
    NEW.id,
    NEW.exam_name,
    t.parameter_name,
    NULL, -- Valeur vide en attente de la mesure du technicien / automate
    t.unite,
    t.valeurs_reference,
    'pending_entry'
  FROM `labo_exam_parametre_template` t
  WHERE t.exam_code = NEW.exam_code OR t.exam_name = NEW.exam_name;
END$$
DELIMITER ;

-- ==============================================================================
-- INJECTION DES EXEMPLES D'ÉCHANTILLONS & RÉSULTATS DÉJÀ PRÉ-POPULÉS
-- ==============================================================================

INSERT INTO `labo_echantillon` (`id`, `code_barre`, `numero_dossier`, `patient_id`, `patient_name`, `patient_gender`, `patient_age`, `prescripteur_nom`, `exam_code`, `exam_name`, `statut`) VALUES
(1, 'LAB-2026-0070', 'NDM-2026-0042', 1, 'FANKANY SS', 'M', 38, 'Dr. Prescripteur Externe', 'NFS', 'Hémogramme Complet (NFS)', 'en_cours'),
(2, 'LAB-2026-0089', 'NDM-2026-0089', 2, 'Aïssatou Sow', 'F', 29, 'Dr. Konan Kouassi', 'LIP', 'Bilan Lipidique', 'en_attente_paillasse');

-- Remplissage direct des résultats pré-positionnés pour le dossier LAB-2026-0070
INSERT INTO `resultat_resultat_labo` (`echantillon_id`, `exam_name`, `parameter_name`, `valeur_mesuree`, `unite`, `valeurs_reference`, `is_abnormal`, `valide_par_technicien`, `valide_par_biologiste`, `status`) VALUES
(1, 'Hémogramme Complet (NFS)', 'Erythrocytes (numération)', '4.85', 'T/L', '4.0 - 5.5', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'Taux d\'Hémoglobine', '14.2', 'g/dL', '12.0 - 16.0', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'Hématocrite', '42.5', '%', '37 - 48', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'VGM (Volume Globulaire Moyen)', '88.0', 'fL', '80 - 100', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'TCMH', '29.3', 'pg', '27 - 32', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'CCMH', '33.4', 'g/dL', '32 - 36', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'Leucocytes (numération)', '6.80', 'G/L', '4.0 - 10.0', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'Neutrophiles', '62.0', '%', '40 - 75', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated'),
(1, 'Hémogramme Complet (NFS)', 'Lymphocytes', '30.0', '%', '20 - 45', 0, 'Sékou Traoré', 'Dr. Aminata Touré', 'validated');

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- FIN DU SCRIPT MARIADB / MYSQL
-- ==============================================================================
