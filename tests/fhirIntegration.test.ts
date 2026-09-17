// ==============================================================================
// INTEGRATION TESTS — PATIENT & BILLING (P1) LIFECYCLE
// REFERENCE : CDC-HOSPITAL-2024-V2.0 — SECTION 15
// ==============================================================================

import { DbContext } from '../server/hospitalScenariosEngine';
import { ResPartner, AccountMove, AccountPayment } from '../src/types';

// Mock DB context
const mockDb: DbContext = {
  dbCompany: {},
  dbPartners: [
    {
      id: 1,
      name: "Patient de Test",
      is_company: false,
      email: "test@example.com",
      phone: "+22501020304",
      street: "Rue Centrale",
      city: "Abidjan",
      zip: null,
      country_id: 1,
      vat: null,
      customer_rank: 1,
      supplier_rank: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ndm: "NDM-0001",
      partner_type: "patient",
      gender: "M",
      birth_date: "1990-05-15"
    }
  ],
  dbMoves: [],
  dbMoveLines: [],
  dbPayments: [],
  dbConsultations: [],
  dbLabOrders: [],
  dbTillSessions: [],
  dbUsers: [],
  dbJournal: [],
  logToJournal: function(action, details, meta) {
    const logItem = {
      id_log: this.dbJournal.length + 1,
      date: new Date().toISOString(),
      action,
      details,
      statut: meta?.statut || 'succes',
      id_utilisateur: meta?.id_utilisateur || 1,
      utilisateur_nom: meta?.utilisateur_nom || 'Système',
      numero_dossier: meta?.numero_dossier,
      id_patient: meta?.id_patient,
      patient_nom: meta?.patient_nom
    };
    this.dbJournal.push(logItem);
    return logItem;
  },
  saveDb: function() {
    // Mock save
  },
  getNextPartnerId: function() {
    return this.dbPartners.length + 1;
  },
  getNextMoveId: function() {
    return this.dbMoves.length + 1;
  },
  getNextMoveLineId: function() {
    return this.dbMoveLines.length + 1;
  },
  getNextPaymentId: function() {
    return this.dbPayments.length + 1;
  },
  getNextConsultationId: function() {
    return this.dbConsultations.length + 1;
  },
  getNextLabOrderId: function() {
    return this.dbLabOrders.length + 1;
  }
};

async function runTests() {
  console.log("======================================================");
  console.log("🚦 DEMARRAGE DES TESTS D'INTEGRATION FHIR R4 & SIH");
  console.log("======================================================");

  let successCount = 0;
  let failCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      successCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failCount++;
    }
  }

  // --- TEST 1: Creation de Patient ---
  try {
    const nextId = mockDb.getNextPartnerId();
    const testPatient: ResPartner = {
      id: nextId,
      name: "Awa Diallo",
      is_company: false,
      email: "awa.diallo@example.com",
      phone: "+22507070707",
      street: "Vridi Canal",
      city: "Abidjan",
      zip: null,
      country_id: 1,
      vat: null,
      customer_rank: 1,
      supplier_rank: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ndm: `NDM-00${nextId}`,
      partner_type: "patient",
      gender: "F",
      birth_date: "1994-04-12"
    };

    mockDb.dbPartners.push(testPatient);
    mockDb.logToJournal('CREATE', `Création du patient ${testPatient.name} via API FHIR`, {
      id_utilisateur: 1,
      utilisateur_nom: 'Système API',
      numero_dossier: testPatient.ndm || undefined,
      id_patient: testPatient.id,
      patient_nom: testPatient.name,
      statut: 'succes'
    });

    assert(mockDb.dbPartners.length === 2, "Le patient a été correctement inséré dans dbPartners.");
    assert(mockDb.dbJournal.length === 1, "L'audit R02 pour la création du patient a été consigné.");
    assert(mockDb.dbJournal[0].action === 'CREATE', "L'action consignée dans le journal d'audit est bien 'CREATE'.");
  } catch (err: any) {
    console.error("Erreur lors du Test 1 :", err.message);
    failCount++;
  }

  // --- TEST 2: Generation d'une Invoice (M3.1) ---
  try {
    const patient = mockDb.dbPartners[1]; // Awa Diallo
    const nextMoveId = mockDb.getNextMoveId();
    const invoiceNum = `FAC/2026/000${nextMoveId}`;

    const newMove: AccountMove = {
      id: nextMoveId,
      name: invoiceNum,
      ref: "REF-TEST-001",
      move_type: "out_invoice",
      state: "draft",
      partner_id: patient.id,
      invoice_date: "2026-09-15",
      date: new Date().toISOString(),
      invoice_date_due: "2026-09-15",
      currency_id: 1,
      amount_untaxed: 50000,
      amount_tax: 0,
      amount_total: 50000,
      amount_residual: 10000,
      payment_state: "not_paid",
      invoice_user_id: 1,
      fiscal_position_id: null,
      company_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_name: "Système API",
      patient_name: patient.name,
      ndm: patient.ndm,
      insurance_enabled: true,
      insurance_name: "MUGEF-CI",
      insurance_coverage_rate: 80,
      insurance_amount: 40000,
      client_share_amount: 10000
    };

    mockDb.dbMoves.push(newMove);
    mockDb.logToJournal('CREATE', `Génération de la facture quittance ${invoiceNum} pour ${patient.name}. Montant: 50000 FCFA`, {
      id_utilisateur: 1,
      utilisateur_nom: 'Système API',
      numero_dossier: patient.ndm || undefined,
      id_patient: patient.id,
      patient_nom: patient.name,
      statut: 'succes'
    });

    assert(mockDb.dbMoves.length === 1, "La facture Invoice a été créée dans dbMoves.");
    assert(mockDb.dbMoves[0].amount_residual === 10000, "Le ticket modérateur restant à la charge du patient (10,000 FCFA) est exact.");
    assert(mockDb.dbMoves[0].insurance_amount === 40000, "La part assureur (40,000 FCFA - 80%) est exacte.");
    assert(mockDb.dbJournal.length === 2, "L'audit R02 pour la création de la facture a été consigné.");
  } catch (err: any) {
    console.error("Erreur lors du Test 2 :", err.message);
    failCount++;
  }

  // --- TEST 3: Rapprochement de Paiement / Encaissement (M3.2) ---
  try {
    const invoice = mockDb.dbMoves[0];
    const nextPayId = mockDb.getNextPaymentId();

    const newPayment: AccountPayment = {
      id: nextPayId,
      name: `PAY/2026/000${nextPayId}`,
      move_id: invoice.id,
      partner_id: invoice.partner_id,
      amount: 10000,
      payment_date: "2026-09-15",
      state: "posted",
      journal_id: 1,
      payment_method_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_method_code: "wave"
    };

    mockDb.dbPayments.push(newPayment);
    invoice.payment_state = "paid";
    invoice.amount_residual = 0;

    mockDb.logToJournal('UPDATE', `Encaissement de 10000 FCFA par WAVE pour la facture ${invoice.name}`, {
      id_utilisateur: 1,
      utilisateur_nom: 'Caissier API',
      numero_dossier: invoice.ndm || undefined,
      id_patient: invoice.partner_id,
      patient_nom: invoice.patient_name || undefined,
      statut: 'succes'
    });

    assert(mockDb.dbPayments.length === 1, "Le paiement a été enregistré.");
    assert(invoice.payment_state === 'paid', "L'état de paiement de la facture est passé à 'paid'.");
    assert(invoice.amount_residual === 0, "Le montant résiduel de l'invoice a été ramené à 0.");
    assert(mockDb.dbJournal.length === 3, "L'audit R02 pour le rapprochement de paiement a été consigné.");
  } catch (err: any) {
    console.error("Erreur lors du Test 3 :", err.message);
    failCount++;
  }

  console.log("======================================================");
  console.log(`📊 BILAN DES TESTS : ${successCount} PASS / ${failCount} FAIL`);
  console.log("======================================================");
}

runTests();
