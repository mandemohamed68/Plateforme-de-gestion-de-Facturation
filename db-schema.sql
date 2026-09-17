-- ==============================================================================
-- SCHEMA DE BASE DE DONNEES POSTGRESQL — SIH & FHIR R4
-- REFERENCE : CDC-HOSPITAL-2024-V2.0 — ANNEXE C
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLES DE BASE (ORGANISATIONS, LIEUX, PRATICIENS)
CREATE TABLE organization (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 'provider' | 'insurer' | 'other'
    address TEXT,
    contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 'ward' | 'consultation_room' | 'laboratory' | 'imaging' | 'pharmacy'
    address TEXT
);

CREATE TABLE practitioner (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    identifier VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'physician' | 'nurse' | 'biologist' | 'radiologist' | 'pharmacist' | 'cashier' | 'admin'
    service VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practitioner_role (
    id SERIAL PRIMARY KEY,
    practitioner_id INTEGER NOT NULL REFERENCES practitioner(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    organization_id INTEGER REFERENCES organization(id) ON DELETE SET NULL
);

-- 2. PATIENTS & CONVENTIONS D'ASSURANCE
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(100) UNIQUE NOT NULL, -- N° de dossier unique (e.g. NDM-0048)
    name_family VARCHAR(100) NOT NULL,
    name_given VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(20) NOT NULL, -- 'male' | 'female' | 'other'
    telecom VARCHAR(100), -- Numéro de téléphone
    address TEXT,
    photo_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coverage (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    insurer_id INTEGER NOT NULL REFERENCES organization(id) ON DELETE RESTRICT,
    policy_number VARCHAR(100) NOT NULL,
    coverage_rate DECIMAL(5,2) NOT NULL, -- e.g. 80.00%
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active' | 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consent (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'care' | 'data_sharing' | 'research'
    date DATE NOT NULL,
    signature TEXT, -- Pad de signature électronique en Base64 ou hash
    witness VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' -- 'active' | 'rejected'
);

-- 3. ADMISSIONS (ENCOUNTERS) & CLINIQUE
CREATE TABLE encounter (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'planned' | 'arrived' | 'in-progress' | 'finished' | 'onleave'
    class VARCHAR(50) NOT NULL, -- 'AMB' (Ambulatoire) | 'IMP' (Hospitalisation) | 'EMER' (Urgence)
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP,
    practitioner_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES location(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE observation (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounter(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL, -- LOINC ou code vital (e.g. 'temp', 'bp_systolic', 'bp_diastolic', 'weight')
    value VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    date TIMESTAMP NOT NULL,
    performer_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'final' -- 'registered' | 'final'
);

CREATE TABLE condition (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounter(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    code_cim10 VARCHAR(50) NOT NULL, -- Classification CIM-10
    display VARCHAR(255) NOT NULL,
    onset_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' -- 'active' | 'resolved'
);

-- 4. PRESCRIPTIONS D'ACTES ET MEDICAMENTS
CREATE TABLE service_request (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounter(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL, -- LOINC ou Code Acte (e.g. 'BIOL-NFS', 'IMG-RX-PULM')
    category VARCHAR(100) NOT NULL, -- 'laboratory' | 'imaging' | 'nursing' | 'procedure'
    status VARCHAR(50) NOT NULL, -- 'draft' | 'active' | 'completed' | 'cancelled' | 'postponed'
    requester_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    authored_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    postponed_until TIMESTAMP
);

CREATE TABLE medication_request (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounter(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    medication_code VARCHAR(100) NOT NULL, -- Code ATC ou DCI
    dose VARCHAR(100) NOT NULL, -- e.g. '500 mg'
    route VARCHAR(100) NOT NULL, -- e.g. 'oral' | 'intravenous'
    frequency VARCHAR(100) NOT NULL, -- e.g. '3x/jour'
    duration VARCHAR(50) NOT NULL, -- e.g. '5 jours'
    status VARCHAR(50) NOT NULL, -- 'active' | 'completed' | 'cancelled'
    requester_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PLATEAUX TECHNIQUES & LOGISTIQUE
CREATE TABLE specimen (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES service_request(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    barcode VARCHAR(100) UNIQUE NOT NULL, -- Code-barres unique généré
    collected_at TIMESTAMP,
    collector_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'available' -- 'available' | 'unsatisfactory'
);

CREATE TABLE diagnostic_report (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES service_request(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    result TEXT, -- Résumé structuré au format JSON
    conclusion TEXT,
    issued TIMESTAMP,
    performer_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL -- 'preliminary' | 'final'
);

CREATE TABLE imaging_study (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES service_request(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    modality VARCHAR(50) NOT NULL, -- 'RX' | 'US' | 'CT' | 'MRI'
    body_site VARCHAR(100),
    study_date TIMESTAMP,
    radiologist_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL -- 'available' | 'registered'
);

CREATE TABLE inventory_item (
    id SERIAL PRIMARY KEY,
    medication_code VARCHAR(100) NOT NULL,
    lot VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    expiry_date DATE NOT NULL,
    threshold INTEGER DEFAULT 10,
    location VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medication_dispense (
    id SERIAL PRIMARY KEY,
    medication_request_id INTEGER NOT NULL REFERENCES medication_request(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    lot VARCHAR(100) NOT NULL,
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pharmacist_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'completed' -- 'completed' | 'on-hold' | 'stopped'
);

-- 6. FACTURATION & CAISSE (M3.1 à M3.7)
CREATE TABLE invoice (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounter(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'admission' | 'prestation' | 'pharmacie' | 'globale' | 'externe'
    total_net DECIMAL(12,2) NOT NULL, -- Part patient TTC (Ticket Modérateur)
    total_gross DECIMAL(12,2) NOT NULL, -- Total général TTC de l'acte
    coverage_rate DECIMAL(5,2) DEFAULT 0.00, -- e.g. 80.00%
    patient_part DECIMAL(12,2) NOT NULL, -- Identique à total_net dans la ventilation
    insurer_part DECIMAL(12,2) NOT NULL, -- Part couverte par l'assurance
    status VARCHAR(50) DEFAULT 'draft', -- 'draft' | 'issued' | 'balanced' | 'cancelled'
    issued_at TIMESTAMP,
    balanced_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE TABLE invoice_line (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL, -- Code de l'acte ou du produit
    label VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(5,2) DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    service_request_id INTEGER REFERENCES service_request(id) ON DELETE SET NULL,
    medication_request_id INTEGER REFERENCES medication_request(id) ON DELETE SET NULL
);

CREATE TABLE payment_reconciliation (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    method VARCHAR(50) NOT NULL, -- 'cash' | 'wave' | 'orange_money' | 'moov_money' | 'card' | 'check' | 'transfer'
    reference VARCHAR(100), -- Obligatoire pour transactions électroniques
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cashier_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' -- 'active' | 'reversed' (contre-passé)
);

CREATE TABLE claim (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    insurer_id INTEGER NOT NULL REFERENCES organization(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) DEFAULT 'active', -- 'active' | 'sent' | 'partially-paid' | 'paid' | 'rejected'
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claim_response (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'paid' | 'partially-paid' | 'rejected'
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    rejection_reason TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT, TRAÇABILITÉ & COMMUNICATIONS
CREATE TABLE audit_event (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL, -- Référence simplifiée à l'utilisateur système
    role VARCHAR(100),
    action VARCHAR(10) NOT NULL, -- 'C' (Create) | 'R' (Read) | 'U' (Update) | 'D' (Delete)
    resource_type VARCHAR(100) NOT NULL, -- 'Patient', 'Invoice', 'Observation', etc.
    resource_id VARCHAR(100),
    patient_id INTEGER REFERENCES patient(id) ON DELETE SET NULL,
    ip VARCHAR(50),
    terminal VARCHAR(255),
    result VARCHAR(50) NOT NULL, -- 'success' | 'failure'
    reason TEXT -- Message d'erreur ou motif
);

CREATE TABLE provenance (
    id SERIAL PRIMARY KEY,
    target_resource VARCHAR(100) NOT NULL, -- e.g. 'ServiceRequest'
    target_id INTEGER NOT NULL,
    recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent_id INTEGER NOT NULL REFERENCES practitioner(id),
    activity VARCHAR(100) NOT NULL, -- 'create' | 'modify' | 'validate'
    reason TEXT
);

CREATE TABLE communication (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'alert' | 'invoice_reminder' | 'prescription_notification'
    payload TEXT NOT NULL, -- Contenu du message
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent' -- 'sent' | 'failed' | 'pending'
);

-- 8. DEFINITIONS STATIQUES ET CONFIGURATIONS (CATALOGUES D'ACTES ET PROTOCOLES)
CREATE TABLE activity_definition (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'consultation' | 'laboratory' | 'imaging' | 'nursing' | 'pharmacy'
    price DECIMAL(12,2) NOT NULL,
    vat DECIMAL(5,2) DEFAULT 0.00, -- Taux de TVA (e.g. 18.00 ou 0.00)
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE charge_item_definition (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activity_definition(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XOF',
    effective_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE plan_definition (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    activities TEXT -- JSON array listant les codes d'actes à inclure
);

CREATE TABLE measure_report (
    id SERIAL PRIMARY KEY,
    measure VARCHAR(255) NOT NULL,
    period VARCHAR(100) NOT NULL, -- e.g. '2026-09'
    value DECIMAL(12,2) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g. 'hematology_analyzer'
    location_id INTEGER REFERENCES location(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE device_metric (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES device(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'calibration' | 'maintenance' | 'measurement'
    value VARCHAR(255) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operator_id INTEGER REFERENCES practitioner(id) ON DELETE SET NULL
);

-- ==============================================================================
-- INDEX OBLIGATOIRES POUR LA PERFORMANCE ET L'AUDITABILITÉ
-- ==============================================================================
CREATE INDEX idx_patient_identifier ON patient(identifier);
CREATE INDEX idx_patient_name ON patient(name_family, name_given);
CREATE INDEX idx_encounter_patient_status ON encounter(patient_id, status);
CREATE INDEX idx_invoice_encounter_status ON invoice(encounter_id, status);
CREATE INDEX idx_payment_rec_invoice ON payment_reconciliation(invoice_id);
CREATE INDEX idx_audit_event_date_user ON audit_event(date, user_id);
CREATE INDEX idx_service_request_patient_cat ON service_request(patient_id, category);
CREATE INDEX idx_observation_patient_code ON observation(patient_id, code);

-- ==============================================================================
-- FIN DU SCHEMA CIBLE db-schema.sql
-- ==============================================================================
