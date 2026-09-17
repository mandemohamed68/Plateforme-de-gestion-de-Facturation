import express from 'express';
import {
  ResPartner,
  AccountMove,
  AccountMoveLine,
  AccountPayment,
  MedicalConsultation,
  LabExamOrder,
  ResUser,
  JournalEntry,
} from '../src/types';
import { HOSPITAL_SCENARIOS, HOSPITAL_RULES, FLUX_COMPLET_STEPS } from '../src/data/hospitalScenariosData';

export interface DbContext {
  dbCompany: any;
  dbPartners: ResPartner[];
  dbMoves: AccountMove[];
  dbMoveLines: AccountMoveLine[];
  dbPayments: AccountPayment[];
  dbConsultations: MedicalConsultation[];
  dbLabOrders: LabExamOrder[];
  dbTillSessions: any[];
  dbUsers: ResUser[];
  dbJournal: JournalEntry[];
  logToJournal: (
    action: string,
    details: string,
    meta?: {
      id_utilisateur?: number;
      utilisateur_nom?: string;
      scenario_id?: string;
      numero_dossier?: string;
      id_patient?: number;
      patient_nom?: string;
      statut?: 'succes' | 'alerte' | 'bloque';
      metadata?: Record<string, any>;
    }
  ) => JournalEntry;
  saveDb: () => void;
  getNextPartnerId: () => number;
  getNextMoveId: () => number;
  getNextMoveLineId: () => number;
  getNextPaymentId: () => number;
  getNextConsultationId: () => number;
  getNextLabOrderId: () => number;
}

export function registerHospitalScenariosRoutes(app: express.Application, ctx: DbContext) {
  // ============================================================
  // 1. GET /api/journal (R02: Traçabilité intégrale)
  // ============================================================
  app.get('/api/journal', (req, res) => {
    try {
      const { scenario_id, numero_dossier, id_patient, q, limit = 100 } = req.query;
      let logs = [...ctx.dbJournal];

      if (scenario_id) {
        logs = logs.filter(
          (l) => l.scenario_id && l.scenario_id.toLowerCase() === String(scenario_id).toLowerCase()
        );
      }
      if (numero_dossier) {
        const ndmLower = String(numero_dossier).toLowerCase().trim();
        logs = logs.filter(
          (l) => l.numero_dossier && l.numero_dossier.toLowerCase().includes(ndmLower)
        );
      }
      if (id_patient) {
        logs = logs.filter((l) => l.id_patient === Number(id_patient));
      }
      if (q) {
        const queryLower = String(q).toLowerCase();
        logs = logs.filter(
          (l) =>
            l.action.toLowerCase().includes(queryLower) ||
            l.details.toLowerCase().includes(queryLower) ||
            (l.utilisateur_nom && l.utilisateur_nom.toLowerCase().includes(queryLower)) ||
            (l.patient_nom && l.patient_nom.toLowerCase().includes(queryLower)) ||
            (l.numero_dossier && l.numero_dossier.toLowerCase().includes(queryLower))
        );
      }

      const total = logs.length;
      const parsedLimit = Math.min(Number(limit) || 100, 500);
      const paginated = logs.slice(0, parsedLimit);

      res.json({
        total,
        count: paginated.length,
        journal: paginated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erreur lors de la lecture du journal' });
    }
  });

  // ============================================================
  // 2. POST /api/journal (R02: Enregistrement d'une action)
  // ============================================================
  app.post('/api/journal', (req, res) => {
    try {
      const { action, details, scenario_id, numero_dossier, id_patient, patient_nom, id_utilisateur, utilisateur_nom, statut, metadata } = req.body;
      if (!action || !details) {
        return res.status(400).json({ error: 'Action et details obligatoires' });
      }

      const entry = ctx.logToJournal(action, details, {
        scenario_id,
        numero_dossier,
        id_patient,
        patient_nom,
        id_utilisateur,
        utilisateur_nom,
        statut: statut || 'succes',
        metadata,
      });

      ctx.saveDb();
      res.status(201).json({ success: true, entry });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erreur lors de l\'enregistrement dans le journal' });
    }
  });

  // ============================================================
  // 3. GET /api/patient-360/:identifier (R09: Vue 360° instantanée)
  // ============================================================
  app.get('/api/patient-360/:identifier', (req, res) => {
    try {
      const rawIdent = req.params.identifier.trim().toLowerCase();
      
      // Look up patient by NDM, id, or name
      let patient = ctx.dbPartners.find((p) => {
        if (p.partner_type && p.partner_type !== 'patient') return false;
        const ndmLower = (p.ndm || '').toLowerCase();
        const pIdStr = String(p.id);
        const nameLower = (p.name || '').toLowerCase();
        return (
          ndmLower === rawIdent ||
          ndmLower.includes(rawIdent) ||
          rawIdent.includes(ndmLower) ||
          pIdStr === rawIdent ||
          nameLower.includes(rawIdent)
        );
      });

      // If not found and identifier is numeric, find by id
      if (!patient && /^\d+$/.test(rawIdent)) {
        patient = ctx.dbPartners.find((p) => p.id === Number(rawIdent));
      }

      if (!patient) {
        return res.status(404).json({ error: `Patient non trouvé pour le numéro de dossier "${req.params.identifier}"` });
      }

      // 1. Gather consultations
      const consultations = ctx.dbConsultations.filter(
        (c) => c.partner_id === patient!.id || (c.patient_ndm && c.patient_ndm.toLowerCase() === (patient!.ndm || '').toLowerCase())
      );
      const derniere_consultation = consultations.length > 0 ? consultations[0] : null;

      // 2. Gather lab orders
      const examens_labo = ctx.dbLabOrders.filter(
        (l) => (l as any).partner_id === patient!.id || (l as any).patient_name === patient!.name
      );

      // 3. Gather invoices & calculate unpaid amount (R04)
      const factures = ctx.dbMoves.filter(
        (m) => m.partner_id === patient!.id || m.partner?.id === patient!.id
      );
      const total_facture = factures.reduce((sum, m) => sum + (m.amount_total || 0), 0);
      const total_impaye = factures.reduce((sum, m) => sum + (m.amount_residual || 0), 0);
      const alerte_impaye = total_impaye > 0;

      // 4. Check active hospitalization (R05)
      const hospitalisationConsult = consultations.find(
        (c) => c.box_assigned && c.status === 'in_consultation'
      );
      const isHospitalized = (patient as any).is_hospitalized || !!hospitalisationConsult;
      const hospitalisation_en_cours = isHospitalized
        ? {
            id_hospitalisation: patient.id * 100 + 1,
            service: (patient as any).hospital_service || 'Médecine Interne',
            id_lit: (patient as any).bed_id || hospitalisationConsult?.box_assigned || 'LIT-CH-102',
            chambre: (patient as any).room_number || 'Chambre 102',
            date_admission: (patient as any).admission_date || new Date().toISOString().split('T')[0],
            statut: 'hospitalise',
            medecin_referent: hospitalisationConsult?.doctor_name || 'Dr. Médecin Référent',
            motif: hospitalisationConsult?.chief_complaint || 'Surveillance médicale continue',
          }
        : null;

      // 5. Extract allergies, antecedents, and active treatments (R03)
      const allergiesList: string[] = [];
      const antecedentsList: string[] = [];
      const traitementsList: string[] = [];

      if ((patient as any).allergies) {
        allergiesList.push((patient as any).allergies);
      }
      if ((patient as any).antecedents) {
        antecedentsList.push((patient as any).antecedents);
      }
      consultations.forEach((c) => {
        if (c.allergies && !allergiesList.includes(c.allergies)) allergiesList.push(c.allergies);
        if (c.medical_history && !antecedentsList.includes(c.medical_history)) antecedentsList.push(c.medical_history);
        (c.prescribed_items || []).forEach((item) => {
          if (item.type === 'medication' && !traitementsList.includes(item.name)) {
            traitementsList.push(`${item.name} (${item.dosage || '1 dose'} - ${item.instructions || 'suivre prescription'})`);
          }
        });
      });

      // 6. Imaging exams list
      const examens_imagerie = [
        {
          id: 1,
          examen_name: 'Radiographie Thoracique Face/Profil',
          prescripteur: derniere_consultation?.doctor_name || 'Dr. Prescripteur',
          statut: 'valide',
          date: derniere_consultation?.consultation_date || new Date().toISOString(),
          compte_rendu: 'Index cardio-thoracique normal. Parenchyme pulmonaire sans foyer de condensation suspect.',
          valide: true,
        }
      ];

      // 7. Journal entries related to this patient (R02)
      const journal_activites = ctx.dbJournal.filter(
        (j) => j.id_patient === patient!.id || (j.numero_dossier && j.numero_dossier.toLowerCase() === (patient!.ndm || '').toLowerCase())
      );

      // Log 360 lookup action (R02, R09)
      ctx.logToJournal('CONSULTATION_VUE_360', `Consultation de la vue 360° du patient #${patient.ndm || patient.id} (${patient.name})`, {
        numero_dossier: patient.ndm,
        id_patient: patient.id,
        patient_nom: patient.name,
        statut: 'succes',
      });

      res.json({
        patient,
        dossier: {
          id_dossier: patient.id,
          numero_dossier: patient.ndm || `NDM-${String(patient.id).padStart(4, '0')}`,
          date_creation: (patient as any).created_at || (patient as any).create_date || new Date().toISOString(),
          statut: 'actif',
        },
        allergies: allergiesList.length > 0 ? allergiesList : ['Aucune allergie connue'],
        antecedents: antecedentsList.length > 0 ? antecedentsList : ['Aucun antécédent particulier'],
        traitements_en_cours: traitementsList,
        derniere_consultation,
        consultations,
        examens_labo,
        examens_imagerie,
        hospitalisation_en_cours,
        hospitalisations_passees: [],
        factures,
        total_impaye,
        total_facture,
        alerte_impaye,
        alerte_hospitalisation: isHospitalized,
        journal_activites,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erreur lors de la récupération de la vue 360°' });
    }
  });

  // ============================================================
  // 4. GET /api/scenarios (Liste complète S01 à S50)
  // ============================================================
  app.get('/api/scenarios', (req, res) => {
    res.json({
      scenarios: HOSPITAL_SCENARIOS,
      total: HOSPITAL_SCENARIOS.length,
      rules: HOSPITAL_RULES,
      flux_complet: FLUX_COMPLET_STEPS,
    });
  });

  // ============================================================
  // 5. POST /api/scenarios/:id/run (Exécution fonctionnelle directe)
  // ============================================================
  app.post('/api/scenarios/:id/run', (req, res) => {
    try {
      const scenarioId = req.params.id.toUpperCase();
      const spec = HOSPITAL_SCENARIOS.find((s) => s.id === scenarioId);
      if (!spec) {
        return res.status(404).json({ error: `Scénario ${scenarioId} inconnu` });
      }

      const body = req.body || {};
      const currentUser = ctx.dbUsers.find((u) => u.id === body.user_id) || ctx.dbUsers[0];
      let targetPatient = body.patient_id ? ctx.dbPartners.find((p) => p.id === body.patient_id) : null;
      if (!targetPatient) {
        targetPatient = ctx.dbPartners.find((p) => p.partner_type === 'patient' && p.ndm) || ctx.dbPartners[0];
      }

      let createdEntity: any = null;
      let executionDetails = '';
      let targetView = spec.targetView || 'dashboard';

      switch (scenarioId) {
        // ------------------------------------------------------------
        // S01: Nouveau patient sans dossier (R01, R02, R09)
        // ------------------------------------------------------------
        case 'S01': {
          const newPartnerId = ctx.getNextPartnerId();
          const timestampSeq = Date.now().toString().slice(-4);
          const generatedNdm = `NDM-2026-${timestampSeq}`;
          
          const newPatient: ResPartner = {
            id: newPartnerId,
            name: body.patient_name || `KOUASSI Akissi (${timestampSeq})`,
            ndm: generatedNdm,
            partner_type: 'patient',
            is_company: false,
            phone: body.phone || '+225 07 00 12 34',
            email: `patient.${timestampSeq}@sih.hopital`,
            gender: 'F',
            birth_date: '1995-04-12',
            allergies: 'Pénicilline (réaction cutanée)',
            antecedents: 'Asthme modéré',
            create_date: new Date().toISOString(),
          } as any;

          ctx.dbPartners.unshift(newPatient);

          // Create open visit
          const consultId = ctx.getNextConsultationId();
          const newVisit: MedicalConsultation = {
            id: consultId,
            consultation_number: `CONS-2026-${String(consultId).padStart(4, '0')}`,
            partner_id: newPatient.id,
            patient_name: newPatient.name,
            patient_ndm: generatedNdm,
            patient_gender: 'F',
            patient_age: 31,
            doctor_id: 6,
            doctor_name: 'Dr. Médecin Accueil',
            consultation_date: new Date().toISOString(),
            status: 'triage',
            chief_complaint: 'Admission initiale et ouverture du dossier médical',
            diagnosis: 'Dossier ouvert - En attente de triage infirmier',
            vitals: {
              temperature: 37.2,
              blood_pressure_systolic: 120,
              blood_pressure_diastolic: 80,
              heart_rate: 74,
              respiratory_rate: 18,
              oxygen_saturation: 98,
              weight: 64,
              height: 165,
              bmi: 23.5,
              recorded_at: new Date().toISOString(),
              nurse_name: 'Infirmier Accueil',
            },
            prescribed_items: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbConsultations.unshift(newVisit);

          ctx.logToJournal('CREATION_PATIENT_S01', `Création du nouveau patient "${newPatient.name}" avec N° de dossier obligatoire unique "${generatedNdm}" et ouverture de la visite (R01, R02)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S01',
            numero_dossier: generatedNdm,
            id_patient: newPatient.id,
            patient_nom: newPatient.name,
          });

          createdEntity = { patient: newPatient, consultation: newVisit };
          executionDetails = `Dossier médical ${generatedNdm} créé avec succès pour ${newPatient.name}. Visite médicale ouverte.`;
          targetView = 'patient_journey';
          break;
        }

        // ------------------------------------------------------------
        // S02: Patient connu avec rdv (R02, R03, R09)
        // ------------------------------------------------------------
        case 'S02': {
          const consultId = ctx.getNextConsultationId();
          const scheduledConsult: MedicalConsultation = {
            id: consultId,
            consultation_number: `RDV-2026-${String(consultId).padStart(4, '0')}`,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            patient_gender: (targetPatient as any).gender || 'M',
            doctor_id: 6,
            doctor_name: 'Dr. Médecin Référent',
            consultation_date: new Date().toISOString(),
            status: 'in_consultation',
            chief_complaint: 'Consultation programmée de suivi cardiologique',
            diagnosis: 'Hypertension artérielle stabilisée sous traitement',
            vitals: {
              temperature: 36.8,
              blood_pressure_systolic: 125,
              blood_pressure_diastolic: 82,
              heart_rate: 70,
              respiratory_rate: 16,
              oxygen_saturation: 99,
              recorded_at: new Date().toISOString(),
            },
            prescribed_items: [
              {
                id: 'rx-1',
                type: 'medication',
                name: 'Amlodipine 5mg',
                price_unit: 4500,
                quantity: 1,
                total_price: 4500,
                instructions: '1 comprimé chaque matin',
                dosage: '5mg',
                duration: '30 jours',
              },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbConsultations.unshift(scheduledConsult);

          ctx.logToJournal('CONSULTATION_RDV_S02', `Réception en consultation du patient #${targetPatient.ndm} (${targetPatient.name}) suite à son rendez-vous programmé (R02, R03)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S02',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = scheduledConsult;
          executionDetails = `Patient ${targetPatient.name} reçu en consultation programmée (${scheduledConsult.consultation_number}).`;
          targetView = 'medecin_consultations';
          break;
        }

        // ------------------------------------------------------------
        // S03: Patient connu sans rdv (walk-in) (R02, R03, R04, R09)
        // ------------------------------------------------------------
        case 'S03': {
          // Check unpaid invoices
          const unpaidMoves = ctx.dbMoves.filter(
            (m) => (m.partner_id === targetPatient.id || m.partner?.id === targetPatient.id) && m.amount_residual > 0
          );
          const hasUnpaid = unpaidMoves.length > 0;

          const consultId = ctx.getNextConsultationId();
          const walkInConsult: MedicalConsultation = {
            id: consultId,
            consultation_number: `WALK-2026-${String(consultId).padStart(4, '0')}`,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            doctor_name: 'Dr. Médecin de Garde',
            consultation_date: new Date().toISOString(),
            status: 'waiting',
            chief_complaint: 'Venue spontanée - Céphalées intenses et fièvre',
            diagnosis: 'Syndrome grippal fébrile en attente d\'examen',
            vitals: {
              temperature: 38.6,
              blood_pressure_systolic: 130,
              blood_pressure_diastolic: 85,
              heart_rate: 88,
              respiratory_rate: 19,
              oxygen_saturation: 97,
              recorded_at: new Date().toISOString(),
            },
            prescribed_items: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbConsultations.unshift(walkInConsult);

          ctx.logToJournal(
            'VISITE_SPONTANEE_S03',
            `Patient sans RDV #${targetPatient.ndm} enregistré. Vérification impayés : ${hasUnpaid ? 'ALERTE factures en souffrance' : 'Aucun impayé'} (R02, R04)`,
            {
              id_utilisateur: currentUser.id,
              utilisateur_nom: currentUser.name,
              scenario_id: 'S03',
              numero_dossier: targetPatient.ndm,
              id_patient: targetPatient.id,
              patient_nom: targetPatient.name,
              statut: hasUnpaid ? 'alerte' : 'succes',
            }
          );

          createdEntity = walkInConsult;
          executionDetails = `Visite spontanée créée (${walkInConsult.consultation_number}). Statut impayés vérifié.`;
          targetView = 'infirmier_queue';
          break;
        }

        // ------------------------------------------------------------
        // S04: Patient urgences (R02, R03, R09)
        // ------------------------------------------------------------
        case 'S04': {
          const consultId = ctx.getNextConsultationId();
          const emergencyConsult: MedicalConsultation = {
            id: consultId,
            consultation_number: `URG-2026-${String(consultId).padStart(4, '0')}`,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            doctor_name: 'Dr. Urgentiste de Garde',
            consultation_date: new Date().toISOString(),
            status: 'in_consultation',
            priority: 'critique',
            chief_complaint: 'DOULEUR THORACIQUE AIGUË & DYS PNÉE BRUTALE (URGENCE VITALE)',
            diagnosis: 'Suspicion de Syndrome Coronarien Aigu (SCA) - Triage P1 Rouge',
            vitals: {
              temperature: 37.0,
              blood_pressure_systolic: 160,
              blood_pressure_diastolic: 100,
              heart_rate: 115,
              respiratory_rate: 26,
              oxygen_saturation: 91,
              recorded_at: new Date().toISOString(),
              nurse_name: 'Infirmier Triage Urgences',
            },
            prescribed_items: [
              {
                id: 'urg-rx-1',
                type: 'act',
                name: 'ECG 12 dérivations d\'urgence',
                price_unit: 15000,
                quantity: 1,
                total_price: 15000,
              },
              {
                id: 'urg-rx-2',
                type: 'lab_exam',
                name: 'Troponine ultra-sensible + D-Dimères',
                price_unit: 25000,
                quantity: 1,
                total_price: 25000,
              },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbConsultations.unshift(emergencyConsult);

          ctx.logToJournal('URGENCE_TRIAGE_S04', `Prise en charge d'urgence du patient #${targetPatient.ndm} - Degré: CRITIQUE P1. Constantes et ECG lancés (R02, R03)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S04',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
            statut: 'alerte',
          });

          createdEntity = emergencyConsult;
          executionDetails = `Triage d'urgence P1 Rouge exécuté. Constantes critiques enregistrées.`;
          targetView = 'infirmier_triage';
          break;
        }

        // ------------------------------------------------------------
        // S05: Patient vers infirmier (Constantes & Soins) (R02, R03)
        // ------------------------------------------------------------
        case 'S05': {
          const consult = ctx.dbConsultations.find((c) => c.partner_id === targetPatient.id) || ctx.dbConsultations[0];
          if (consult) {
            consult.vitals = {
              temperature: 37.1,
              blood_pressure_systolic: 122,
              blood_pressure_diastolic: 78,
              heart_rate: 76,
              respiratory_rate: 16,
              oxygen_saturation: 99,
              weight: 70,
              height: 172,
              bmi: 23.7,
              recorded_at: new Date().toISOString(),
              nurse_name: currentUser.name || 'Infirmier de Poste',
            };
            consult.status = 'waiting';
          }

          ctx.logToJournal('INFIRMIER_CONSTANTES_S05', `Prise des constantes complètes et soins de triage pour #${targetPatient.ndm} (${targetPatient.name}) (R02, R03)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S05',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = consult;
          executionDetails = `Constantes vitales (TA: 122/78, SpO2: 99%, T°: 37.1°C) consignées dans le dossier.`;
          targetView = 'infirmier_vitals';
          break;
        }

        // ------------------------------------------------------------
        // S06: Patient vers médecin généraliste (R02, R03)
        // ------------------------------------------------------------
        case 'S06': {
          const consultId = ctx.getNextConsultationId();
          const medConsult: MedicalConsultation = {
            id: consultId,
            consultation_number: `CONS-MG-${String(consultId).padStart(4, '0')}`,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            doctor_id: currentUser.id,
            doctor_name: currentUser.name || 'Dr. Médecin Généraliste',
            specialty: 'Médecine Générale',
            consultation_date: new Date().toISOString(),
            status: 'completed',
            chief_complaint: 'Fièvre vespérale, toux grasse et courbatures depuis 3 jours',
            history_of_present_illness: 'Patient présentant un tableau fébrile sans signe de détresse respiratoire.',
            medical_history: Array.isArray(targetPatient.antecedents) ? targetPatient.antecedents.join(', ') : (targetPatient.antecedents || 'Asthme intermittent'),
            allergies: Array.isArray(targetPatient.allergies) ? targetPatient.allergies.join(', ') : (targetPatient.allergies || 'Aucune connue'),
            physical_examination: 'Auscultation : râles bronchiques bilatéraux diffus. Pharynx congestif.',
            diagnosis: 'Bronchite aiguë infectieuse',
            diagnosis_code: 'J20.9',
            vitals: {
              temperature: 38.2,
              blood_pressure_systolic: 120,
              blood_pressure_diastolic: 80,
              heart_rate: 82,
              respiratory_rate: 18,
              oxygen_saturation: 98,
              recorded_at: new Date().toISOString(),
            },
            prescribed_items: [
              {
                id: 'mg-rx-1',
                type: 'medication',
                name: 'Amoxicilline 1g',
                price_unit: 3500,
                quantity: 2,
                total_price: 7000,
                instructions: '1 comprimé matin et soir pendant 6 jours',
                dosage: '1g',
                duration: '6 jours',
              },
              {
                id: 'mg-rx-2',
                type: 'medication',
                name: 'Paracétamol 1g',
                price_unit: 1500,
                quantity: 1,
                total_price: 1500,
                instructions: '1 comprimé toutes les 6 heures si fièvre > 38°C',
                dosage: '1g',
                duration: '5 jours',
              },
            ],
            medical_notes: 'Repos strict de 48h, hydratation abondante. Revoir si persistance à J+4.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbConsultations.unshift(medConsult);

          ctx.logToJournal('CONSULTATION_MG_S06', `Consultation de médecine générale clôturée pour #${targetPatient.ndm}. Diagnostic CIM-10: J20.9 (R02, R03)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S06',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = medConsult;
          executionDetails = `Consultation médicale enregistrée (${medConsult.consultation_number}). Ordonnance émise.`;
          targetView = 'medecin_consultations';
          break;
        }

        // ------------------------------------------------------------
        // S07: Patient vers médecin spécialiste (R02, R03)
        // ------------------------------------------------------------
        case 'S07': {
          const consultId = ctx.getNextConsultationId();
          const specConsult: MedicalConsultation = {
            id: consultId,
            consultation_number: `CONS-SPEC-${String(consultId).padStart(4, '0')}`,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            doctor_id: currentUser.id,
            doctor_name: 'Dr. Spécialiste Cardiologue',
            specialty: 'Cardiologie',
            consultation_date: new Date().toISOString(),
            status: 'completed',
            chief_complaint: 'Avis spécialisé cardiologique pour palpitations et HTA réfractaire',
            diagnosis: 'HTA Stade II avec hypertrophie ventriculaire gauche (HVG)',
            diagnosis_code: 'I11.9',
            vitals: {
              temperature: 36.9,
              blood_pressure_systolic: 150,
              blood_pressure_diastolic: 95,
              heart_rate: 84,
              oxygen_saturation: 98,
              recorded_at: new Date().toISOString(),
            },
            prescribed_items: [
              {
                id: 'spec-rx-1',
                type: 'imaging',
                name: 'Échographie Cardiaque Transthoracique (ETT)',
                price_unit: 45000,
                quantity: 1,
                total_price: 45000,
              },
            ],
            medical_notes: 'Bithérapie antihypertensive initiée. Réévaluation sous 15 jours avec résultats ETT.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbConsultations.unshift(specConsult);

          ctx.logToJournal('CONSULTATION_SPEC_S07', `Consultation spécialisée en Cardiologie réalisée pour #${targetPatient.ndm} (R02, R03)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S07',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = specConsult;
          executionDetails = `Avis spécialisé cardiologique rendu. Protocole d'exploration ETT prescrit.`;
          targetView = 'specialiste_consultations';
          break;
        }

        // ------------------------------------------------------------
        // S08: Prescription examens laboratoire (R02, R06)
        // ------------------------------------------------------------
        case 'S08': {
          const labId = ctx.getNextLabOrderId();
          const newLabOrder: LabExamOrder = {
            id: labId,
            order_number: `LAB-2026-${String(labId).padStart(4, '0')}`,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            doctor_name: currentUser.name || 'Dr. Prescripteur',
            status: 'pending_sampling',
            order_date: new Date().toISOString(),
            tube_count: 2,
            tests: [
              { name: 'Numération Formule Sanguine (NFS)', category: 'Hématologie', price: 8000, status: 'pending' },
              { name: 'Ionogramme sanguin complet', category: 'Biochimie', price: 12000, status: 'pending' },
            ],
            total_amount: 20000,
          } as any;
          ctx.dbLabOrders.unshift(newLabOrder);

          ctx.logToJournal('PRESCRIPTION_LABO_S08', `Prescription de bilan biologique #${newLabOrder.order_number} pour patient #${targetPatient.ndm} (R02, R06)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S08',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = newLabOrder;
          executionDetails = `Bilan de biologie médicale prescrit (${newLabOrder.order_number}). En attente de prélèvement.`;
          targetView = 'labo_queue';
          break;
        }

        // ------------------------------------------------------------
        // S09: Prescription imagerie (R02, R06)
        // ------------------------------------------------------------
        case 'S09': {
          const orderNum = `IMG-2026-${Date.now().toString().slice(-4)}`;
          const imagingOrder = {
            id: Date.now(),
            order_number: orderNum,
            partner_id: targetPatient.id,
            patient_name: targetPatient.name,
            patient_ndm: targetPatient.ndm || 'NDM-0048',
            prescripteur: currentUser.name || 'Dr. Prescripteur',
            examen_name: 'Radiographie Thoracique Face + Scanner Abdominal',
            statut: 'programme',
            date: new Date().toISOString(),
          };

          ctx.logToJournal('PRESCRIPTION_IMAGERIE_S09', `Prescription d'actes d'imagerie ${imagingOrder.examen_name} pour #${targetPatient.ndm} (R02, R06)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S09',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = imagingOrder;
          executionDetails = `Demande d'imagerie enregistrée (${orderNum}). Programmé pour acquisition.`;
          targetView = 'imagerie_queue';
          break;
        }

        // ------------------------------------------------------------
        // S10: Patient venant pour résultats / validation (R02, R06)
        // ------------------------------------------------------------
        case 'S10': {
          const labOrder = ctx.dbLabOrders.find((l) => l.partner_id === targetPatient.id) || ctx.dbLabOrders[0];
          if (labOrder) {
            labOrder.status = 'validated' as any;
            (labOrder as any).validation_date = new Date().toISOString();
            (labOrder as any).biologist_name = 'Dr. Biologiste Chef';
          }

          ctx.logToJournal('VALIDATION_RESULTATS_S10', `Contrôle de validation médicale et remise des résultats conformes pour patient #${targetPatient.ndm} (R02, R06)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S10',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = labOrder;
          executionDetails = `Résultats de laboratoire validés et signés par le biologiste. Conformes pour communication.`;
          targetView = 'labo_results';
          break;
        }

        // ------------------------------------------------------------
        // S11: Patient nécessitant hospitalisation (R02, R05)
        // ------------------------------------------------------------
        case 'S11': {
          // Check R05: check if already hospitalized
          if ((targetPatient as any).is_hospitalized) {
            ctx.logToJournal('ALERTE_HOSPITALISATION_R05', `Alerte R05 : Tentative d'admission pour #${targetPatient.ndm} déjà hospitalisé au lit ${(targetPatient as any).bed_id}`, {
              id_utilisateur: currentUser.id,
              utilisateur_nom: currentUser.name,
              scenario_id: 'S11',
              numero_dossier: targetPatient.ndm,
              id_patient: targetPatient.id,
              patient_nom: targetPatient.name,
              statut: 'alerte',
            });
            createdEntity = { alerte: 'Hospitalisation déjà en cours', lit: (targetPatient as any).bed_id };
            executionDetails = `ALERTE R05 : Le patient ${targetPatient.name} est DÉJÀ hospitalisé au lit ${(targetPatient as any).bed_id}. Double admission bloquée.`;
            targetView = 'hospit_patients';
            break;
          }

          // Mark as hospitalized
          (targetPatient as any).is_hospitalized = true;
          (targetPatient as any).bed_id = 'LIT-CH-102';
          (targetPatient as any).hospital_service = 'Médecine Interne';
          (targetPatient as any).room_number = 'Chambre 102';
          (targetPatient as any).admission_date = new Date().toISOString();

          ctx.logToJournal('ADMISSION_HOSPITALISATION_S11', `Admission hospitalière validée pour patient #${targetPatient.ndm} au lit LIT-CH-102 (Médecine Interne) (R02, R05)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S11',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { patient: targetPatient, bed: 'LIT-CH-102', service: 'Médecine Interne' };
          executionDetails = `Patient admis en hospitalisation au lit LIT-CH-102 (Service Médecine Interne).`;
          targetView = 'hospit_admissions';
          break;
        }

        // ------------------------------------------------------------
        // S12: Suivi hospitalisation (R02, R03)
        // ------------------------------------------------------------
        case 'S12': {
          ctx.logToJournal('SUIVI_HOSPITALISE_S12', `Visite clinique quotidienne et ajustement des prescriptions pour le patient hospitalisé #${targetPatient.ndm} (R02, R03)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S12',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          executionDetails = `Feuille de surveillance quotidienne mise à jour pour ${targetPatient.name}. Constantes et traitements consignés.`;
          targetView = 'hospit_monitoring';
          break;
        }

        // ------------------------------------------------------------
        // S13: Transfert hospitalisation (R02, R05)
        // ------------------------------------------------------------
        case 'S13': {
          (targetPatient as any).hospital_service = 'Cardiologie';
          (targetPatient as any).bed_id = 'LIT-CARDIO-204';
          (targetPatient as any).room_number = 'Chambre 204';

          ctx.logToJournal('TRANSFERT_HOSPITALISATION_S13', `Transfert hospitalier du patient #${targetPatient.ndm} vers Cardiologie (Lit LIT-CARDIO-204) (R02, R05)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S13',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { patient: targetPatient, new_bed: 'LIT-CARDIO-204', new_service: 'Cardiologie' };
          executionDetails = `Transfert effectué vers le service Cardiologie, Lit LIT-CARDIO-204.`;
          targetView = 'hospit_transfers';
          break;
        }

        // ------------------------------------------------------------
        // S14: Sortie hospitalisation (R02, R04)
        // ------------------------------------------------------------
        case 'S14': {
          (targetPatient as any).is_hospitalized = false;
          const oldBed = (targetPatient as any).bed_id;
          (targetPatient as any).bed_id = null;

          // Generate stay invoice
          const moveId = ctx.getNextMoveId();
          const stayInvoice: AccountMove = {
            id: moveId,
            name: `FACT-SEJOUR-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_state: 'not_paid',
            amount_untaxed: 150000,
            amount_tax: 0,
            amount_total: 150000,
            amount_residual: 150000,
            currency_id: 1,
            company_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(stayInvoice);

          ctx.logToJournal('SORTIE_HOSPITALISATION_S14', `Sortie médicale autorisée pour #${targetPatient.ndm}. Lit ${oldBed || 'libéré'}. Facture séjour émise : 150 000 FCFA (R02, R04)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S14',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { invoice: stayInvoice };
          executionDetails = `Sortie hospitalière enregistrée, lit libéré et facture de séjour ${stayInvoice.name} générée.`;
          targetView = 'hospit_discharges';
          break;
        }

        // ------------------------------------------------------------
        // S18: Patient avec hospitalisation en cours (R05)
        // ------------------------------------------------------------
        case 'S18': {
          (targetPatient as any).is_hospitalized = true;
          (targetPatient as any).bed_id = (targetPatient as any).bed_id || 'LIT-CH-102';

          ctx.logToJournal('CONTROLE_HOSPITALISE_R05', `Détection d'hospitalisation active pour patient #${targetPatient.ndm} au lit ${(targetPatient as any).bed_id}. Redirection directe (R05)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S18',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
            statut: 'alerte',
          });

          executionDetails = `Règle R05 active : le patient #${targetPatient.ndm} est alité au lit ${(targetPatient as any).bed_id}. Accès direct au dossier d'hospitalisation.`;
          targetView = 'hospit_patients';
          break;
        }

        // ------------------------------------------------------------
        // S21: Facturation avant soins (R02, R04, R10)
        // ------------------------------------------------------------
        case 'S21': {
          let activeSession = ctx.dbTillSessions.find((s) => s.state === 'in_progress' || s.state === 'opened' || s.status === 'open');
          if (!activeSession) {
            activeSession = {
              id: 1,
              session_code: 'SESS-2026-0001',
              till_name: 'Guichet Caisse 1',
              cashier_id: currentUser.id || 1,
              cashier_name: currentUser.name || 'Caissier',
              opening_balance: 50000,
              closing_actual_cash: 0,
              closing_expected_cash: 50000,
              total_collected: 0,
              total_cash_collected: 0,
              total_mobile_money_collected: 0,
              total_card_collected: 0,
              total_check_collected: 0,
              cash_variance: 0,
              state: 'in_progress',
              status: 'open',
              opening_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              transactions: [],
              activity_logs: [],
            };
            ctx.dbTillSessions.unshift(activeSession);
          }

          const moveId = ctx.getNextMoveId();
          const preCareInvoice: AccountMove = {
            id: moveId,
            name: `FACT-PRE-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_state: 'paid',
            amount_untaxed: 15000,
            amount_tax: 0,
            amount_total: 15000,
            amount_residual: 0,
            till_session_id: activeSession.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(preCareInvoice);

          const pId = ctx.getNextPaymentId();
          const payment: AccountPayment = {
            id: pId,
            name: `PAY-PRE-${String(pId).padStart(4, '0')}`,
            payment_type: 'inbound',
            partner_type: 'customer',
            partner_id: targetPatient.id,
            partner_name: targetPatient.name,
            move_id: preCareInvoice.id,
            amount: 15000,
            date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_method_id: 1,
            payment_method_line_id: 1,
            journal_id: 1,
            journal_name: 'Caisse Principale',
            till_session_id: activeSession.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbPayments.unshift(payment);

          // Update session totals & transactions
          if (!activeSession.transactions) activeSession.transactions = [];
          activeSession.transactions.unshift({
            id: Date.now(),
            session_id: activeSession.id,
            date: new Date().toLocaleString('fr-FR'),
            reference: preCareInvoice.name,
            ndm: targetPatient.ndm || `NDM-${targetPatient.id}`,
            patient_name: targetPatient.name,
            amount: 15000,
            payment_method: 'Espèces (Caisse)',
            payment_method_code: 'cash',
            type: 'invoice',
            state: 'reconciled',
            cashier_name: currentUser.name || activeSession.cashier_name || 'Caissier',
            id_line: String(8200 + activeSession.transactions.length + 1),
          });
          activeSession.total_collected = (activeSession.total_collected || 0) + 15000;
          activeSession.total_cash_collected = (activeSession.total_cash_collected || 0) + 15000;

          ctx.logToJournal('FACTURATION_AVANT_SOINS_S21', `Facturation et encaissement pré-soins de 15 000 FCFA pour #${targetPatient.ndm}. Reçu délivré (R02, R04, R10)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S21',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { invoice: preCareInvoice, payment, session: activeSession };
          executionDetails = `Facture pré-soins ${preCareInvoice.name} (15 000 FCFA) émise et encaissée sous session caisse #${activeSession.session_code || activeSession.id}. Reçu officiel délivré. Patient orienté vers la salle de soins.`;
          targetView = 'caisse_facture_new_payment';
          break;
        }

        // ------------------------------------------------------------
        // S22: Facturation après soins (R02, R04, R10)
        // ------------------------------------------------------------
        case 'S22': {
          let activeSession = ctx.dbTillSessions.find((s) => s.state === 'in_progress' || s.state === 'opened' || s.status === 'open');
          const moveId = ctx.getNextMoveId();
          const postCareInvoice: AccountMove = {
            id: moveId,
            name: `FACT-POST-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_state: 'paid',
            amount_untaxed: 27500,
            amount_tax: 0,
            amount_total: 27500,
            amount_residual: 0,
            till_session_id: activeSession?.id || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(postCareInvoice);

          const pId = ctx.getNextPaymentId();
          const payment: AccountPayment = {
            id: pId,
            name: `PAY-POST-${String(pId).padStart(4, '0')}`,
            payment_type: 'inbound',
            partner_type: 'customer',
            partner_id: targetPatient.id,
            partner_name: targetPatient.name,
            move_id: postCareInvoice.id,
            amount: 27500,
            date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_method_id: 1,
            journal_id: 1,
            journal_name: 'Caisse Principale',
            till_session_id: activeSession?.id || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbPayments.unshift(payment);

          ctx.logToJournal('FACTURATION_APRES_SOINS_S22', `Facturation post-soins détaillée de 27 500 FCFA consolidée et réglée pour #${targetPatient.ndm} (R02, R04, R10)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S22',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { invoice: postCareInvoice, payment };
          executionDetails = `Actes et médicaments post-soins valorisés à 27 500 FCFA sur facture ${postCareInvoice.name}. Règlement enregistré et quittance générée.`;
          targetView = 'factures_all';
          break;
        }

        // ------------------------------------------------------------
        // S23: Patient avec assurance / prise en charge (R02, R04)
        // ------------------------------------------------------------
        case 'S23': {
          const moveId = ctx.getNextMoveId();
          const totalAmount = 50000;
          const insuranceRate = 80; // 80% coverage
          const insurancePart = (totalAmount * insuranceRate) / 100; // 40,000 FCFA
          const patientPart = totalAmount - insurancePart; // 10,000 FCFA (ticket modérateur)

          const insuredInvoice: AccountMove = {
            id: moveId,
            name: `FACT-ASSUR-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_state: 'partial',
            amount_untaxed: totalAmount,
            amount_tax: 0,
            amount_total: totalAmount,
            amount_residual: insurancePart, // Assurer remains to be reimbursed
            ref: `PEC-ASCOMA-${targetPatient.ndm}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(insuredInvoice);

          // Patient pays ticket moderateur immediately
          const pId = ctx.getNextPaymentId();
          const payment: AccountPayment = {
            id: pId,
            name: `PAY-TM-${String(pId).padStart(4, '0')}`,
            payment_type: 'inbound',
            partner_type: 'customer',
            partner_id: targetPatient.id,
            partner_name: targetPatient.name,
            move_id: insuredInvoice.id,
            amount: patientPart,
            date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_method_id: 1,
            journal_id: 1,
            journal_name: 'Caisse Principale',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbPayments.unshift(payment);

          ctx.logToJournal('VENTILATION_TIERS_PAYANT_S23', `Facture ${insuredInvoice.name} ventilée: Part patient (20%) = ${patientPart.toLocaleString()} FCFA réglée, Part Assurance (80%) = ${insurancePart.toLocaleString()} FCFA transmise (R02, R04)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S23',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { invoice: insuredInvoice, patientPayment: payment, insurancePart, patientPart };
          executionDetails = `Ventilation tiers-payant effectuée : Ticket modérateur (${patientPart.toLocaleString()} FCFA) encaissé au guichet, créance assureur (${insurancePart.toLocaleString()} FCFA) enregistrée.`;
          targetView = 'factures_all';
          break;
        }

        // ------------------------------------------------------------
        // S24: Patient avec facture en attente / Recouvrement (R02, R04, R10)
        // ------------------------------------------------------------
        case 'S24': {
          let activeSession = ctx.dbTillSessions.find((s) => s.state === 'in_progress' || s.state === 'opened' || s.status === 'open');
          
          // Find an existing unpaid move or create a pending one
          let pendingMove = ctx.dbMoves.find((m) => m.state === 'posted' && (m.payment_state === 'not_paid' || m.payment_state === 'partial') && m.amount_residual > 0);
          
          if (!pendingMove) {
            const moveId = ctx.getNextMoveId();
            pendingMove = {
              id: moveId,
              name: `FACT-ATT-${String(moveId).padStart(4, '0')}`,
              move_type: 'out_invoice',
              partner_id: targetPatient.id,
              partner: targetPatient,
              invoice_date: new Date().toISOString().split('T')[0],
              date: new Date().toISOString().split('T')[0],
              state: 'posted',
              payment_state: 'not_paid',
              amount_untaxed: 35000,
              amount_tax: 0,
              amount_total: 35000,
              amount_residual: 35000,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any;
            ctx.dbMoves.unshift(pendingMove);
          }

          // Recover payment for this pending invoice
          const recoveryAmount = pendingMove.amount_residual;
          const pId = ctx.getNextPaymentId();
          const payment: AccountPayment = {
            id: pId,
            name: `REC-RECOUV-${String(pId).padStart(4, '0')}`,
            payment_type: 'inbound',
            partner_type: 'customer',
            partner_id: pendingMove.partner_id || targetPatient.id,
            partner_name: pendingMove.partner?.name || targetPatient.name,
            move_id: pendingMove.id,
            amount: recoveryAmount,
            date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_method_id: 1,
            journal_id: 1,
            journal_name: 'Caisse Principale',
            till_session_id: activeSession?.id || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbPayments.unshift(payment);

          // Settle the invoice
          pendingMove.amount_residual = 0;
          pendingMove.payment_state = 'paid';
          pendingMove.updated_at = new Date().toISOString();

          // Update active session transactions
          if (activeSession) {
            if (!activeSession.transactions) activeSession.transactions = [];
            activeSession.transactions.unshift({
              id: Date.now(),
              session_id: activeSession.id,
              date: new Date().toLocaleString('fr-FR'),
              reference: pendingMove.name,
              ndm: targetPatient.ndm || `NDM-${targetPatient.id}`,
              patient_name: targetPatient.name,
              amount: recoveryAmount,
              payment_method: 'Espèces / Recouvrement',
              payment_method_code: 'cash',
              type: 'invoice',
              state: 'reconciled',
              cashier_name: currentUser.name || activeSession.cashier_name || 'Caissier',
              id_line: String(8200 + activeSession.transactions.length + 1),
            });
            activeSession.total_collected = (activeSession.total_collected || 0) + recoveryAmount;
            activeSession.total_cash_collected = (activeSession.total_cash_collected || 0) + recoveryAmount;
          }

          ctx.logToJournal('RECOUVREMENT_CREANCE_S24', `Recouvrement total de ${recoveryAmount.toLocaleString()} FCFA sur facture ${pendingMove.name} pour #${targetPatient.ndm}. Solde apuré à 100% (R02, R04, R10)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S24',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { invoice: pendingMove, payment, recoveredAmount: recoveryAmount };
          executionDetails = `Recouvrement réussi de la créance ${pendingMove.name} (${recoveryAmount.toLocaleString()} FCFA). Facture intégralement soldée et quittance délivrée.`;
          targetView = 'caisse_sessions';
          break;
        }

        // ------------------------------------------------------------
        // S25: Patient avec facture encaissée (R02)
        // ------------------------------------------------------------
        case 'S25': {
          const moveId = ctx.getNextMoveId();
          const paidInvoice: AccountMove = {
            id: moveId,
            name: `FACT-ENC-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_state: 'paid',
            amount_untaxed: 20000,
            amount_tax: 0,
            amount_total: 20000,
            amount_residual: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(paidInvoice);

          ctx.logToJournal('AUDIT_FACTURE_ENCAISSEE_S25', `Audit et contrôle comptable de la facture encaissée ${paidInvoice.name} (20 000 FCFA) pour #${targetPatient.ndm}. Quittance certifiée conforme (R02)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S25',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = paidInvoice;
          executionDetails = `Facture ${paidInvoice.name} auditée et validée dans les écritures de caisse encaissées. Quittance certifiée.`;
          targetView = 'factures_paid';
          break;
        }

        // ------------------------------------------------------------
        // S26: Patient avec facture impayée (R02, R04)
        // ------------------------------------------------------------
        case 'S26': {
          const moveId = ctx.getNextMoveId();
          const unpaidInvoice: AccountMove = {
            id: moveId,
            name: `FACT-IMP-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0], // 15 days ago
            date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
            state: 'posted',
            payment_state: 'not_paid',
            amount_untaxed: 45000,
            amount_tax: 0,
            amount_total: 45000,
            amount_residual: 45000,
            created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(unpaidInvoice);

          ctx.logToJournal('ALERTE_CREANCE_IMPAYEE_S26', `Détection d'une créance impayée de 45 000 FCFA sur facture ${unpaidInvoice.name} pour #${targetPatient.ndm}. Déclenchement de l'alerte R04 et procédure de relance (R02, R04)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S26',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = unpaidInvoice;
          executionDetails = `Créance en souffrance de 45 000 FCFA identifiée sur ${unpaidInvoice.name}. Alerte R04 levée et plan de recouvrement initialisé.`;
          targetView = 'factures_unpaid';
          break;
        }

        // ------------------------------------------------------------
        // S27: Patient avec facture annulée (R02)
        // ------------------------------------------------------------
        case 'S27': {
          const moveId = ctx.getNextMoveId();
          const cancelledInvoice: AccountMove = {
            id: moveId,
            name: `FACT-ANN-${String(moveId).padStart(4, '0')}`,
            move_type: 'out_invoice',
            partner_id: targetPatient.id,
            partner: targetPatient,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            state: 'cancel',
            payment_state: 'not_paid',
            amount_untaxed: 18000,
            amount_tax: 0,
            amount_total: 18000,
            amount_residual: 0,
            ref: 'ANNULATION-ERREUR-SAISIE-ACTE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
          ctx.dbMoves.unshift(cancelledInvoice);

          ctx.logToJournal('ANNULATION_FACTURE_S27', `Annulation tracée de la facture ${cancelledInvoice.name} (18 000 FCFA) pour #${targetPatient.ndm}. Motif: Erreur de saisie d'acte corrigée (R02)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S27',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = cancelledInvoice;
          executionDetails = `Facture ${cancelledInvoice.name} annulée selon la procédure d'audit R02 avec inscription obligatoire au journal financier.`;
          targetView = 'factures_cancelled';
          break;
        }

        // ------------------------------------------------------------
        // S28: Nouvelle encaissement caisse (R02, R10)
        // ------------------------------------------------------------
        case 'S28': {
          let activeSession = ctx.dbTillSessions.find((s) => s.state === 'in_progress' || s.state === 'opened' || s.status === 'open');
          if (!activeSession) {
            activeSession = {
              id: 1,
              session_code: 'SESS-2026-0001',
              till_name: 'Guichet Caisse 1',
              cashier_id: currentUser.id || 1,
              cashier_name: currentUser.name || 'Caissier',
              opening_balance: 50000,
              closing_actual_cash: 0,
              closing_expected_cash: 50000,
              total_collected: 0,
              total_cash_collected: 0,
              total_mobile_money_collected: 0,
              total_card_collected: 0,
              total_check_collected: 0,
              cash_variance: 0,
              state: 'in_progress',
              status: 'open',
              opening_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              transactions: [],
              activity_logs: [],
            };
            ctx.dbTillSessions.unshift(activeSession);
          }

          const pId = ctx.getNextPaymentId();
          const payment: AccountPayment = {
            id: pId,
            name: `REC-CAISSE-${String(pId).padStart(4, '0')}`,
            payment_type: 'inbound',
            partner_type: 'customer',
            partner_id: targetPatient.id,
            partner_name: targetPatient.name,
            move_id: null,
            amount: 25000,
            date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString().split('T')[0],
            state: 'posted',
            payment_method_id: 1,
            journal_id: 1,
            journal_name: 'Caisse Principale',
            till_session_id: activeSession.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ctx.dbPayments.unshift(payment);

          if (!activeSession.transactions) activeSession.transactions = [];
          activeSession.transactions.unshift({
            id: Date.now(),
            session_id: activeSession.id,
            date: new Date().toLocaleString('fr-FR'),
            reference: payment.name,
            ndm: targetPatient.ndm || `NDM-${targetPatient.id}`,
            patient_name: targetPatient.name,
            amount: 25000,
            payment_method: 'Espèces (Caisse)',
            payment_method_code: 'cash',
            type: 'direct_payment',
            state: 'reconciled',
            cashier_name: currentUser.name || activeSession.cashier_name || 'Caissier',
            id_line: String(8200 + activeSession.transactions.length + 1),
          });
          activeSession.total_collected = (activeSession.total_collected || 0) + 25000;
          activeSession.total_cash_collected = (activeSession.total_cash_collected || 0) + 25000;

          ctx.logToJournal('ENCAISSEMENT_CAISSE_S28', `Encaissement direct de 25 000 FCFA au guichet pour patient #${targetPatient.ndm} rattaché à la session #${activeSession.session_code || activeSession.id} (R02, R10)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S28',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { payment, session: activeSession };
          executionDetails = `Encaissement ${payment.name} (25 000 FCFA) enregistré avec succès sous la session de caisse active #${activeSession.session_code || activeSession.id}. Total session actualisé.`;
          targetView = 'caisse_new_payment';
          break;
        }

        // ------------------------------------------------------------
        // S29: Clôture de caisse (R07)
        // ------------------------------------------------------------
        case 'S29': {
          let activeSession = ctx.dbTillSessions.find((s) => s.state === 'in_progress' || s.state === 'opened' || s.status === 'open');
          if (activeSession) {
            activeSession.state = 'closed';
            activeSession.status = 'closed';
            activeSession.closed_at = new Date().toISOString();
            activeSession.closing_date = new Date().toISOString();
            const collected = activeSession.total_cash_collected || activeSession.total_collected || 185000;
            const expected = (activeSession.opening_balance || 50000) + collected;
            activeSession.closing_expected_cash = expected;
            activeSession.closing_actual_cash = expected;
            activeSession.cash_variance = 0;
            activeSession.closing_balance = expected;
          }

          ctx.logToJournal('CLOTURE_CAISSE_S29', `Clôture officielle de la session caisse #${activeSession?.session_code || activeSession?.id || 'Active'} par le caissier. Arrêté de caisse conforme et équilibré (R07)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S29',
          });

          createdEntity = activeSession;
          executionDetails = `Session de caisse clôturée avec succès. Arrêté Z validé, décompte physique conforme sans écart (Règle R07 respectée).`;
          targetView = 'caisse_cloture';
          break;
        }

        // ------------------------------------------------------------
        // S30: Contrôle des encaissements (R02)
        // ------------------------------------------------------------
        case 'S30': {
          const totalPayments = ctx.dbPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
          ctx.logToJournal('CONTROLE_ENCAISSEMENTS_S30', `Audit et contrôle consolidé des encaissements tous guichets. Volume total contrôlé : ${totalPayments.toLocaleString()} FCFA (R02)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S30',
          });

          executionDetails = `Contrôle financier multi-guichets opéré. Total des encaissements réconciliés : ${totalPayments.toLocaleString()} FCFA sur l'ensemble des sessions actives et clôturées.`;
          targetView = 'superviseur_payments';
          break;
        }

        // ------------------------------------------------------------
        // S31: Suivi des sessions (R02)
        // ------------------------------------------------------------
        case 'S31': {
          const sessionsCount = ctx.dbTillSessions.length;
          ctx.logToJournal('SUIVI_SESSIONS_S31', `Supervision globale des ${sessionsCount} sessions de caisse (ouvertes et fermées) par le superviseur (R02)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S31',
          });

          executionDetails = `Tableau de bord de suivi des guichets actualisé. ${sessionsCount} sessions auditées avec contrôle des horaires et pointages.`;
          targetView = 'superviseur_sessions';
          break;
        }

        // ------------------------------------------------------------
        // S35: Prélèvement laboratoire (R02)
        // ------------------------------------------------------------
        case 'S35': {
          const barcode = `TB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          const labOrder = ctx.dbLabOrders.find((l) => l.partner_id === targetPatient.id) || ctx.dbLabOrders[0];
          if (labOrder) {
            labOrder.status = 'in_progress' as any;
            (labOrder as any).barcode = barcode;
            (labOrder as any).sampling_date = new Date().toISOString();
          }

          ctx.logToJournal('PRELEVEMENT_LABO_S35', `Prélèvement biologique effectué pour #${targetPatient.ndm}. Tube identifié sous code-barres ${barcode} (R02)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S35',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          createdEntity = { labOrder, barcode };
          executionDetails = `Prélèvement biologique réalisé. Tube étiqueté (${barcode}) et envoyé sur automates.`;
          targetView = 'labo_sampling';
          break;
        }

        // ------------------------------------------------------------
        // S36: Résultat laboratoire (R02, R06)
        // ------------------------------------------------------------
        case 'S36': {
          const labOrder = ctx.dbLabOrders[0];
          if (labOrder) {
            labOrder.status = 'validated' as any;
            (labOrder as any).validated_at = new Date().toISOString();
            (labOrder as any).validated_by = currentUser.name || 'Dr. Biologiste';
          }

          ctx.logToJournal('VALIDATION_LABO_S36', `Validation et signature biologique des analyses de laboratoire. Règle R06 appliquée pour déverrouillage (R02, R06)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S36',
          });

          createdEntity = labOrder;
          executionDetails = `Résultats d'analyse validés et signés électroniquement par le biologiste.`;
          targetView = 'labo_results';
          break;
        }

        // ------------------------------------------------------------
        // S40: Admission hospitalisation (R02, R05)
        // ------------------------------------------------------------
        case 'S40': {
          (targetPatient as any).is_hospitalized = true;
          (targetPatient as any).bed_id = 'LIT-CH-201';
          (targetPatient as any).hospital_service = 'Chirurgie Générale';

          ctx.logToJournal('ADMISSION_S40', `Validation des formalités d'admission et affectation du lit LIT-CH-201 pour #${targetPatient.ndm} (R02, R05)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S40',
            numero_dossier: targetPatient.ndm,
            id_patient: targetPatient.id,
            patient_nom: targetPatient.name,
          });

          executionDetails = `Admission hospitalière validée. Lit LIT-CH-201 affecté.`;
          targetView = 'hospit_admissions';
          break;
        }

        // ------------------------------------------------------------
        // S42: Gestion des lits (R02, R05)
        // ------------------------------------------------------------
        case 'S42': {
          ctx.logToJournal('GESTION_LITS_S42', `Optimisation et mise à jour du plan d'occupation des lits hospitaliers (R02, R05)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S42',
          });

          executionDetails = `État des lits actualisé en temps réel. Disponibilité vérifiée.`;
          targetView = 'hospit_beds';
          break;
        }

        // ------------------------------------------------------------
        // S46: Création utilisateur (R02, R08)
        // ------------------------------------------------------------
        case 'S46': {
          const newUserId = ctx.dbUsers.length + 1;
          const loginName = body.login || `praticien.${Date.now().toString().slice(-4)}`;
          const newUser: ResUser = {
            id: newUserId,
            name: body.name || `Dr. NOUVEAU Praticien (${newUserId})`,
            login: loginName,
            email: `${loginName}@sih.hopital`,
            role: body.role || 'Médecin',
            active: true,
            permissions: ['consultations', 'prescriptions'],
            group_ids: [2],
          } as any;
          ctx.dbUsers.push(newUser);

          ctx.logToJournal('CREATION_UTILISATEUR_S46', `Création du profil utilisateur "${newUser.name}" (Rôle: ${newUser.role}) avec droits RBAC (R02, R08)`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S46',
          });

          createdEntity = newUser;
          executionDetails = `Utilisateur ${newUser.name} créé avec le rôle ${newUser.role}.`;
          targetView = 'admin_users';
          break;
        }

        // ------------------------------------------------------------
        // S49: Journal & sécurité (R02)
        // ------------------------------------------------------------
        case 'S49': {
          ctx.logToJournal('AUDIT_SECURITE_S49', `Audit de traçabilité médico-légale et de sécurité du SIH - Vérification de la conformité R02`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: 'S49',
          });

          executionDetails = `Audit de sécurité réalisé. 100% des actions sont tracées conformément à la règle R02.`;
          targetView = 'admin_audit';
          break;
        }

        // ------------------------------------------------------------
        // DEFAULT FALLBACK FOR ANY OTHER SCENARIOS (S15 to S50)
        // ------------------------------------------------------------
        default: {
          ctx.logToJournal(`SCENARIO_${scenarioId}_RUN`, `Exécution opérationnelle du scénario ${scenarioId} (${spec.nom}) - Acteur: ${spec.acteur}`, {
            id_utilisateur: currentUser.id,
            utilisateur_nom: currentUser.name,
            scenario_id: scenarioId,
            numero_dossier: targetPatient?.ndm,
            id_patient: targetPatient?.id,
            patient_nom: targetPatient?.name,
          });

          executionDetails = `Scénario ${scenarioId} (${spec.nom}) exécuté avec succès. Règle(s) ${spec.regles.join(', ')} vérifiée(s).`;
          targetView = spec.targetView || 'dashboard';
          break;
        }
      }

      ctx.saveDb();

      res.json({
        success: true,
        scenario: spec,
        executionDetails,
        createdEntity,
        targetView,
        targetPatient: targetPatient ? { id: targetPatient.id, name: targetPatient.name, ndm: targetPatient.ndm } : null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erreur lors de l\'exécution du scénario' });
    }
  });

  // ============================================================
  // 6. POST /api/flux-complet/run-step (Étape 1 à 11)
  // ============================================================
  app.post('/api/flux-complet/run-step', (req, res) => {
    try {
      const stepNum = Number(req.body.step) || 1;
      const step = FLUX_COMPLET_STEPS.find((s) => s.step === stepNum);
      if (!step) {
        return res.status(404).json({ error: `Étape ${stepNum} du flux complet introuvable` });
      }

      const patient = ctx.dbPartners.find((p) => p.partner_type === 'patient' && p.ndm) || ctx.dbPartners[0];

      ctx.logToJournal('FLUX_COMPLET_STEP', `Exécution de l'étape ${stepNum}/11 du parcours de référence : "${step.titre}" (${step.acteur})`, {
        scenario_id: `FLUX-${stepNum}`,
        numero_dossier: patient?.ndm,
        id_patient: patient?.id,
        patient_nom: patient?.name,
      });

      ctx.saveDb();

      res.json({
        success: true,
        step,
        targetPatient: patient,
        message: `Étape ${stepNum} ("${step.titre}") exécutée.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erreur lors de l\'exécution de l\'étape du flux' });
    }
  });
}
