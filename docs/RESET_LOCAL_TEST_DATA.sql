-- ==============================================================================
-- SCRIPT DE REMISE À ZÉRO / PURGE DES TESTS (MARIADB LOCAL)
-- Base de données : lab_facturation_db
-- ==============================================================================
-- Ce script vide toutes les données opérationnelles de test :
-- 1. Les factures et leurs lignes (account_move, account_move_line)
-- 2. Les encaissements et règlements de caisse (account_payment)
-- 3. Les sessions de caisse (caisse_session, caisse_opcaisse, caisse_opcaisse_ligne)
-- 4. Les échantillons de prélèvement et résultats LIMS (labo_echantillon, resultat_resultat_labo)
-- 5. Les consultations médicales et files d'attente (medical_consultation)
-- 6. Les patients individuels créés pendant les tests (res_partner type 'patient')
--
-- IL CONSERVE INTACTS :
-- - Les utilisateurs et soignants (res_users)
-- - Les rôles et droits RBAC (res_groups)
-- - Le catalogue d'actes, examens de laboratoire et tarifs (product_template, product_product)
-- - Les conventions d'assurances et entreprises partenaires (res_partner is_company=1 ou is_insurance=1)
-- - Les unités de mesure, devises et taxes (uom_uom, res_currency, account_tax)
-- - Les templates de paramètres LIS (labo_exam_parametre_template)
-- ==============================================================================

USE `lab_facturation_db`;

-- Désactiver temporairement la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Purge des encaissements et règlements
TRUNCATE TABLE `account_payment`;

-- 2. Purge des lignes de factures et écritures
TRUNCATE TABLE `account_move_line`;

-- 3. Purge des factures
TRUNCATE TABLE `account_move`;

-- 4. Purge des sessions de caisse et opérations
TRUNCATE TABLE `caisse_session`;
-- Si les tables caisse_opcaisse existent
DELETE FROM `caisse_opcaisse_ligne` WHERE 1=1;
DELETE FROM `caisse_opcaisse` WHERE 1=1;

-- 5. Purge des résultats biologiques et échantillons
TRUNCATE TABLE `resultat_resultat_labo`;
TRUNCATE TABLE `labo_echantillon`;
-- Si la table des lignes d'échantillons existe
DELETE FROM `labo_ligne_echantillon` WHERE 1=1;

-- 6. Purge des consultations médicales si la table existe
DELETE FROM `medical_consultation` WHERE 1=1;

-- 7. Purge des patients de test uniquement (conservation des assurances et entreprises)
DELETE FROM `res_partner` 
WHERE is_company = 0 
  AND is_insurance = 0 
  AND (partner_type = 'patient' OR partner_type IS NULL OR partner_type = 'customer');

-- Réactiver la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Résumé et vérification des tables après purge
SELECT 'account_move' as table_name, COUNT(*) as rows_count FROM `account_move`
UNION ALL
SELECT 'account_move_line', COUNT(*) FROM `account_move_line`
UNION ALL
SELECT 'account_payment', COUNT(*) FROM `account_payment`
UNION ALL
SELECT 'caisse_session', COUNT(*) FROM `caisse_session`
UNION ALL
SELECT 'labo_echantillon', COUNT(*) FROM `labo_echantillon`
UNION ALL
SELECT 'resultat_resultat_labo', COUNT(*) FROM `resultat_resultat_labo`
UNION ALL
SELECT 'res_partner (Assurances & Entreprises conservées)', COUNT(*) FROM `res_partner`
UNION ALL
SELECT 'product_template (Catalogue examens & tarifs conservé)', COUNT(*) FROM `product_template`
UNION ALL
SELECT 'res_users (Utilisateurs conservés)', COUNT(*) FROM `res_users`;
