import express, { Request, Response, Router } from 'express';
import { DbContext } from './hospitalScenariosEngine';
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

export function registerFhirRoutes(app: express.Application, ctx: DbContext) {
  const fhirRouter = Router();

  // Middleware to enforce application/fhir+json Content-Type if requested
  fhirRouter.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('X-FHIR-Version', '4.0.1');
    next();
  });

  // Helper to wrap list in FHIR Bundle of type "searchset"
  function makeBundle(resources: any[], type: string = 'searchset'): any {
    return {
      resourceType: 'Bundle',
      type,
      total: resources.length,
      entry: resources.map((r) => ({
        fullUrl: `https://api.hopital.example/fhir/${r.resourceType}/${r.id}`,
        resource: r,
      })),
    };
  }

  // ============================================================
  // FHIR MAPPINGS
  // ============================================================

  // 1. Patient Mapping
  function mapPatient(p: ResPartner): any {
    return {
      resourceType: 'Patient',
      id: String(p.id),
      active: p.active !== false,
      identifier: [
        {
          use: 'official',
          system: 'urn:oid:1.2.3.4.5.6.7.8.9',
          value: p.ndm || `NDM-${p.id}`,
        },
      ],
      name: [
        {
          use: 'official',
          family: p.name.split(' ').slice(1).join(' ') || p.name,
          given: [p.name.split(' ')[0] || ''],
        },
      ],
      gender: p.gender === 'M' ? 'male' : p.gender === 'F' ? 'female' : 'unknown',
      birthDate: p.birth_date || '1986-05-15',
      telecom: [
        { system: 'phone', value: p.phone || '+225 01 02 03 04', use: 'mobile' },
        ...(p.email ? [{ system: 'email', value: p.email, use: 'home' }] : []),
      ],
      address: [
        {
          use: 'home',
          line: [p.street || "Abidjan, Côte d'Ivoire"],
          city: p.city || 'Abidjan',
          country: p.commune || 'CIV',
        },
      ],
      contact: p.contact_person_name
        ? [
            {
              relationship: [
                {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                      code: 'C',
                      display: 'Emergency Contact',
                    },
                  ],
                },
              ],
              name: { text: p.contact_person_name },
              telecom: [{ system: 'phone', value: p.contact_person_phone || '+225 07 00 00' }],
            },
          ]
        : [],
    };
  }

  // 2. Encounter Mapping
  function mapEncounter(c: MedicalConsultation): any {
    const startPeriod = c.consultation_date || new Date().toISOString();
    return {
      resourceType: 'Encounter',
      id: String(c.id),
      status: c.status === 'completed' ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: c.doctor_type === 'triage' ? 'EMER' : 'AMB',
        display: c.doctor_type === 'triage' ? 'emergency' : 'ambulatory',
      },
      subject: {
        reference: `Patient/${c.partner_id}`,
        display: c.patient_name,
      },
      participant: [
        {
          type: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'PPRF',
                  display: 'primary performer',
                },
              ],
            },
          ],
          individual: {
            reference: `Practitioner/${c.doctor_id || 1}`,
            display: c.doctor_name || 'Praticien',
          },
        },
      ],
      period: {
        start: startPeriod,
        end: c.status === 'completed' ? startPeriod : undefined,
      },
      reasonCode: [
        {
          text: c.chief_complaint || 'Consultation de routine',
        },
      ],
    };
  }

  // 3. Condition Mapping (ICD-10 Diagnostics)
  function mapCondition(c: MedicalConsultation): any {
    return {
      resourceType: 'Condition',
      id: `cond-${c.id}`,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
          },
        ],
      },
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: c.diagnosis_code || 'A09',
            display: c.diagnosis || "Gastro-entérite d'origine infectieuse",
          },
        ],
        text: c.diagnosis || 'Diagnostic clinique',
      },
      subject: {
        reference: `Patient/${c.partner_id}`,
        display: c.patient_name,
      },
      encounter: {
        reference: `Encounter/${c.id}`,
      },
    };
  }

  // 4. Observation Mapping (Constantes & Signes Vitaux / Résultats Labo)
  function mapObservations(c: MedicalConsultation): any[] {
    const obs: any[] = [];
    const patientRef = { reference: `Patient/${c.partner_id}`, display: c.patient_name };
    const encounterRef = { reference: `Encounter/${c.id}` };
    const date = c.consultation_date || new Date().toISOString();
    const vitals = c.vitals || {};

    // 4.1. Systolic / Diastolic Blood Pressure
    if (vitals.bp_systolic || vitals.bp_diastolic) {
      const sys = vitals.bp_systolic || null;
      const dia = vitals.bp_diastolic || null;

      const components: any[] = [];
      if (sys) {
        components.push({
          code: {
            coding: [
              { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
            ],
          },
          valueQuantity: { value: sys, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
        });
      }
      if (dia) {
        components.push({
          code: {
            coding: [
              { system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' },
            ],
          },
          valueQuantity: { value: dia, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
        });
      }

      obs.push({
        resourceType: 'Observation',
        id: `obs-bp-${c.id}`,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            { system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children' },
          ],
        },
        subject: patientRef,
        encounter: encounterRef,
        effectiveDateTime: date,
        component: components,
      });
    }

    // 4.2. Heart Rate / Pulse
    if (vitals.heart_rate) {
      obs.push({
        resourceType: 'Observation',
        id: `obs-hr-${c.id}`,
        status: 'final',
        category: [
          {
            coding: [
              { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' },
            ],
          },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }],
        },
        subject: patientRef,
        encounter: encounterRef,
        effectiveDateTime: date,
        valueQuantity: {
          value: Number(vitals.heart_rate),
          unit: '/min',
          system: 'http://unitsofmeasure.org',
          code: '/min',
        },
      });
    }

    // 4.3. Temperature
    if (vitals.temperature) {
      obs.push({
        resourceType: 'Observation',
        id: `obs-temp-${c.id}`,
        status: 'final',
        category: [
          {
            coding: [
              { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' },
            ],
          },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }],
        },
        subject: patientRef,
        encounter: encounterRef,
        effectiveDateTime: date,
        valueQuantity: {
          value: Number(vitals.temperature),
          unit: 'C',
          system: 'http://unitsofmeasure.org',
          code: 'Cel',
        },
      });
    }

    // 4.4. Glycemia / Blood Glucose
    if (vitals.blood_sugar) {
      obs.push({
        resourceType: 'Observation',
        id: `obs-glyc-${c.id}`,
        status: 'final',
        category: [
          {
            coding: [
              { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' },
            ],
          },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '2339-0', display: 'Glucose [Mass/volume] in Blood' }],
        },
        subject: patientRef,
        encounter: encounterRef,
        effectiveDateTime: date,
        valueQuantity: {
          value: Number(vitals.blood_sugar),
          unit: 'g/L',
          system: 'http://unitsofmeasure.org',
          code: 'g/L',
        },
      });
    }

    return obs;
  }

  // 5. AllergyIntolerance Mapping
  function mapAllergyIntolerance(p: ResPartner): any[] {
    if (!p.allergies) return [];
    const allergiesStr = typeof p.allergies === 'string' ? p.allergies : JSON.stringify(p.allergies);
    return [
      {
        resourceType: 'AllergyIntolerance',
        id: `allergy-${p.id}`,
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
              code: 'active',
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
              code: 'confirmed',
            },
          ],
        },
        type: 'allergy',
        category: ['food', 'medication'],
        criticality: 'high',
        code: {
          text: allergiesStr,
        },
        patient: {
          reference: `Patient/${p.id}`,
          display: p.name,
        },
      },
    ];
  }

  // 6. MedicationRequest Mapping
  function mapMedicationRequest(c: MedicalConsultation): any[] {
    const meds = c.prescribed_items || [];
    return meds.map((item: any, idx: number) => ({
      resourceType: 'MedicationRequest',
      id: `medrx-${c.id}-${idx}`,
      status: 'active',
      intent: 'order',
      subject: {
        reference: `Patient/${c.partner_id}`,
        display: c.patient_name,
      },
      encounter: {
        reference: `Encounter/${c.id}`,
      },
      authoredOn: c.consultation_date || new Date().toISOString(),
      requester: {
        reference: `Practitioner/${c.doctor_id || 1}`,
        display: c.doctor_name || 'Médecin Référent',
      },
      medicationCodeableConcept: {
        text: item.product_name || item.name || 'Médicament prescrit',
      },
      dosageInstruction: [
        {
          text: item.instructions || 'Selon avis médical',
          timing: {
            repeat: {
              duration: item.duration ? Number(item.duration) : undefined,
              durationUnit: 'd',
            },
          },
        },
      ],
    }));
  }

  // Helper to infer if lab exam is radiology/imaging based on department
  function isImagingExam(l: LabExamOrder): boolean {
    const dept = (l.department || '').toLowerCase();
    return dept.includes('imag') || dept.includes('radio') || dept.includes('pacs');
  }

  // Helper to get printable exam names
  function getExamNamesStr(l: LabExamOrder): string {
    return l.exam_names ? l.exam_names.join(', ') : 'Bilan de santé';
  }

  // 7. ServiceRequest Mapping (Demande de Labo ou Imagerie)
  function mapServiceRequest(l: LabExamOrder): any {
    const isImaging = isImagingExam(l);
    return {
      resourceType: 'ServiceRequest',
      id: String(l.id),
      status: l.status === 'validated' ? 'completed' : 'active',
      intent: 'order',
      category: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: isImaging ? '363679005' : '108252007',
              display: isImaging ? 'Imaging study' : 'Laboratory procedure',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: `LAB-${l.id}`,
            display: getExamNamesStr(l),
          },
        ],
        text: getExamNamesStr(l),
      },
      subject: {
        reference: `Patient/${l.partner_id}`,
        display: l.partner_name,
      },
      authoredOn: l.created_at || new Date().toISOString(),
    };
  }

  // 8. DiagnosticReport Mapping
  function mapDiagnosticReport(l: LabExamOrder): any {
    const isImaging = isImagingExam(l);
    return {
      resourceType: 'DiagnosticReport',
      id: `dr-${l.id}`,
      status: l.status === 'validated' ? 'final' : 'registered',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: isImaging ? 'RAD' : 'LAB',
            },
          ],
        },
      ],
      code: {
        text: getExamNamesStr(l),
      },
      subject: {
        reference: `Patient/${l.partner_id}`,
        display: l.partner_name,
      },
      issued: l.validated_at || l.created_at || new Date().toISOString(),
      performer: [
        {
          actor: {
            display: l.validated_by_doctor || l.technician_name || 'Personnel de santé',
          },
        },
      ],
      conclusion: l.conclusion || 'Bilan complété',
    };
  }

  // 9. Invoice Mapping
  function mapInvoice(m: AccountMove): any {
    return {
      resourceType: 'Invoice',
      id: String(m.id),
      status: m.payment_state === 'paid' ? 'balanced' : 'issued',
      subject: {
        reference: `Patient/${m.partner_id}`,
        display: m.patient_name || 'Patient Anonyme',
      },
      date: m.invoice_date || new Date().toISOString().split('T')[0],
      totalNet: {
        value: m.amount_total,
        currency: 'XOF',
      },
      line: (ctx.dbMoveLines || [])
        .filter((l) => l.move_id === m.id)
        .map((l) => ({
          sequence: l.id,
          chargeItemCodeableConcept: {
            text: l.name,
          },
          priceComponent: [
            {
              type: 'base',
              amount: {
                value: l.price_unit,
                currency: 'XOF',
              },
            },
          ],
        })),
    };
  }

  // 10. PaymentReconciliation Mapping
  function mapPaymentReconciliation(p: any): any {
    return {
      resourceType: 'PaymentReconciliation',
      id: String(p.id),
      status: 'active',
      paymentAmount: {
        value: p.amount,
        currency: 'XOF',
      },
      paymentDate: p.payment_date || new Date().toISOString().split('T')[0],
      paymentMethod: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0570',
            code: p.payment_method_code || 'CASH',
            display: p.payment_method_name || 'Espèces',
          },
        ],
      },
    };
  }

  // 11. AuditEvent Mapping (Traçabilité journal)
  function mapAuditEvent(j: JournalEntry): any {
    return {
      resourceType: 'AuditEvent',
      id: String(j.id_log),
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: 'rest',
        display: 'RESTful Operation',
      },
      action: j.action === 'CREATE' ? 'C' : j.action === 'UPDATE' ? 'U' : 'R',
      recorded: j.date,
      outcome: j.statut === 'bloque' ? '8' : '0', // 0 = Success, 8 = Serious Failure
      agent: [
        {
          altId: String(j.id_utilisateur || 1),
          name: j.utilisateur_nom || 'Utilisateur Système',
          requestor: true,
        },
      ],
      entity: [
        {
          what: {
            reference: j.numero_dossier ? `Patient/${j.numero_dossier}` : `Encounter/${j.scenario_id || 'general'}`,
            display: j.patient_nom || j.details,
          },
        },
      ],
    };
  }

  // 12. Practitioner / PractitionerRole
  function mapPractitioner(u: ResUser): any {
    return {
      resourceType: 'Practitioner',
      id: String(u.id),
      active: u.active !== false,
      name: [
        {
          use: 'official',
          family: u.name,
        },
      ],
      telecom: [
        {
          system: 'email',
          value: u.email || `${u.login}@sih.hopital.example`,
        },
      ],
    };
  }

  // 13. PractitionerRole
  function mapPractitionerRole(u: ResUser): any {
    const roleLower = (u.role || '').toLowerCase();
    const fhirRole = roleLower.includes('superv')
      ? 'supervisor'
      : roleLower.includes('cais')
      ? 'cashier'
      : roleLower.includes('factu')
      ? 'billing'
      : roleLower.includes('infir')
      ? 'nurse'
      : roleLower.includes('spéc')
      ? 'specialist'
      : 'doctor';

    return {
      resourceType: 'PractitionerRole',
      id: `role-${u.id}`,
      active: u.active !== false,
      practitioner: {
        reference: `Practitioner/${u.id}`,
        display: u.name,
      },
      code: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/practitioner-role',
              code: fhirRole,
              display: u.role || 'Professionnel de Santé',
            },
          ],
        },
      ],
    };
  }

  // 14. Location
  function mapLocation(): any[] {
    return [
      {
        resourceType: 'Location',
        id: 'LIT-CH-201',
        status: 'active',
        name: 'Lit CH-201 - Chirurgie Générale',
        physicalType: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'bd', display: 'Bed' }],
        },
      },
      {
        resourceType: 'Location',
        id: 'LIT-CH-202',
        status: 'active',
        name: 'Lit CH-202 - Chirurgie Générale',
        physicalType: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'bd', display: 'Bed' }],
        },
      },
    ];
  }

  // 15. Organization
  function mapOrganization(): any[] {
    return [
      {
        resourceType: 'Organization',
        id: 'lab-biologie',
        active: true,
        type: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'dept', display: 'Hospital Department' }] },
        ],
        name: 'Plateau Biologie (Laboratoire)',
      },
      {
        resourceType: 'Organization',
        id: 'pacs-imagerie',
        active: true,
        type: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'dept', display: 'Hospital Department' }] },
        ],
        name: 'Imagerie Médicale (Radiologie)',
      },
    ];
  }

  // 16. Coverage
  function mapCoverage(p: ResPartner): any[] {
    if (!p.insurance_id && !p.insurance_name) return [];
    return [
      {
        resourceType: 'Coverage',
        id: `cov-${p.id}`,
        status: 'active',
        type: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IP', display: 'individual policy' }],
        },
        subscriber: {
          reference: `Patient/${p.id}`,
          display: p.name,
        },
        payor: [
          {
            display: p.insurance_name || 'Assureur Partenaire',
          },
        ],
        class: [
          {
            type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class', code: 'plan' }] },
            value: p.convention_code || 'CONV-ASSUR',
            name: `Taux de couverture: ${p.insurance_coverage_rate || p.default_coverage_rate || 100}%`,
          },
        ],
      },
    ];
  }

  // 17. Consent (RBAC Roles Permissions)
  function mapConsent(u: ResUser): any {
    return {
      resourceType: 'Consent',
      id: `consent-${u.id}`,
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
      },
      category: [
        { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IDSCL' }] },
      ],
      patient: {
        display: 'Tous les Patients',
      },
      dateTime: new Date().toISOString(),
      performer: [
        { reference: `Practitioner/${u.id}`, display: u.name },
      ],
      provision: {
        type: 'permit',
        action: (u.permissions || []).map((p) => ({ text: p })),
      },
    };
  }

  // 18. Basic (Session de Caisse)
  function mapBasic(s: any): any {
    return {
      resourceType: 'Basic',
      id: `cash-session-${s.id}`,
      code: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/basic-resource-type', code: 'cash-session' }],
      },
      author: {
        reference: `Practitioner/${s.cashier_id || 1}`,
        display: s.cashier_name || 'Caissier',
      },
      extension: [
        { url: 'http://hopital.example/fhir/ouverture', valueDateTime: s.opened_at },
        { url: 'http://hopital.example/fhir/cloture', valueDateTime: s.closed_at || undefined },
        { url: 'http://hopital.example/fhir/statut', valueString: s.state },
      ],
    };
  }

  // ============================================================
  // EXPOSING REST API ENDPOINTS
  // ============================================================

  // GET [base]/Patient?identifier=urn:oid:1.2.3.4.5.6.7.8.9|{numero_dossier}
  fhirRouter.get('/Patient', (req: Request, res: Response) => {
    try {
      const identifierParam = req.query.identifier as string;
      if (identifierParam) {
        // Extract value after system separator "|"
        const val = identifierParam.includes('|') ? identifierParam.split('|')[1] : identifierParam;
        const found = ctx.dbPartners.find(
          (p) =>
            p.partner_type === 'patient' &&
            (p.ndm === val || String(p.id) === val || p.phone === val)
        );

        if (found) {
          return res.json(makeBundle([mapPatient(found)]));
        } else {
          return res.json(makeBundle([]));
        }
      }

      // Default: list all patient partners mapped to FHIR
      const patients = ctx.dbPartners
        .filter((p) => p.partner_type === 'patient')
        .map(mapPatient);
      res.json(makeBundle(patients));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // GET [base]/Patient/{id}
  fhirRouter.get('/Patient/:id', (req: Request, res: Response) => {
    try {
      const found = ctx.dbPartners.find((p) => p.id === Number(req.params.id) && p.partner_type === 'patient');
      if (!found) {
        return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Patient non trouvé' }] });
      }
      res.json(mapPatient(found));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // GET [base]/Patient/{id}/$everything
  fhirRouter.get('/Patient/:id/\\$everything', (req: Request, res: Response) => {
    try {
      const patientId = Number(req.params.id);
      const patient = ctx.dbPartners.find((p) => p.id === patientId && p.partner_type === 'patient');
      if (!patient) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient #${patientId} introuvable` }],
        });
      }

      const bundleResources: any[] = [];
      // 1. Patient itself
      bundleResources.push(mapPatient(patient));

      // 2. Allergies
      bundleResources.push(...mapAllergyIntolerance(patient));

      // 3. Coverages
      bundleResources.push(...mapCoverage(patient));

      // 4. Encounters & conditions & clinical signs
      const patientConsultations = ctx.dbConsultations.filter((c) => c.partner_id === patientId);
      patientConsultations.forEach((c) => {
        bundleResources.push(mapEncounter(c));
        bundleResources.push(mapCondition(c));
        bundleResources.push(...mapObservations(c));
        bundleResources.push(...mapMedicationRequest(c));
      });

      // 5. ServiceRequests & DiagnosticReports (lab orders)
      const patientLabOrders = ctx.dbLabOrders.filter((l) => l.partner_id === patientId);
      patientLabOrders.forEach((l) => {
        bundleResources.push(mapServiceRequest(l));
        bundleResources.push(mapDiagnosticReport(l));
      });

      // 6. Invoices
      const patientInvoices = ctx.dbMoves.filter((m) => m.partner_id === patientId);
      patientInvoices.forEach((m) => {
        bundleResources.push(mapInvoice(m));
      });

      res.json(makeBundle(bundleResources, 'searchset'));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // GET /fhir/Encounter
  fhirRouter.get('/Encounter', (req, res) => {
    const list = ctx.dbConsultations.map(mapEncounter);
    res.json(makeBundle(list));
  });

  // GET /fhir/Encounter/:id
  fhirRouter.get('/Encounter/:id', (req, res) => {
    const found = ctx.dbConsultations.find((c) => c.id === Number(req.params.id));
    if (!found) return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] });
    res.json(mapEncounter(found));
  });

  // GET /fhir/Observation
  fhirRouter.get('/Observation', (req, res) => {
    const list: any[] = [];
    ctx.dbConsultations.forEach((c) => {
      list.push(...mapObservations(c));
    });
    res.json(makeBundle(list));
  });

  // GET /fhir/Condition
  fhirRouter.get('/Condition', (req, res) => {
    const list = ctx.dbConsultations.map(mapCondition);
    res.json(makeBundle(list));
  });

  // GET /fhir/AllergyIntolerance
  fhirRouter.get('/AllergyIntolerance', (req, res) => {
    const list: any[] = [];
    ctx.dbPartners.filter((p) => p.partner_type === 'patient').forEach((p) => {
      list.push(...mapAllergyIntolerance(p));
    });
    res.json(makeBundle(list));
  });

  // GET /fhir/MedicationRequest
  fhirRouter.get('/MedicationRequest', (req, res) => {
    const list: any[] = [];
    ctx.dbConsultations.forEach((c) => {
      list.push(...mapMedicationRequest(c));
    });
    res.json(makeBundle(list));
  });

  // GET /fhir/ServiceRequest
  fhirRouter.get('/ServiceRequest', (req, res) => {
    const list = ctx.dbLabOrders.map(mapServiceRequest);
    res.json(makeBundle(list));
  });

  // GET /fhir/DiagnosticReport
  fhirRouter.get('/DiagnosticReport', (req, res) => {
    const list = ctx.dbLabOrders.map(mapDiagnosticReport);
    res.json(makeBundle(list));
  });

  // GET /fhir/Invoice
  fhirRouter.get('/Invoice', (req, res) => {
    const list = ctx.dbMoves.map(mapInvoice);
    res.json(makeBundle(list));
  });

  // GET /fhir/PaymentReconciliation
  fhirRouter.get('/PaymentReconciliation', (req, res) => {
    const list = ctx.dbPayments.map(mapPaymentReconciliation);
    res.json(makeBundle(list));
  });

  // GET /fhir/AuditEvent (Logs API)
  fhirRouter.get('/AuditEvent', (req, res) => {
    const list = ctx.dbJournal.map(mapAuditEvent);
    res.json(makeBundle(list));
  });

  // GET /fhir/Practitioner
  fhirRouter.get('/Practitioner', (req, res) => {
    const list = ctx.dbUsers.map(mapPractitioner);
    res.json(makeBundle(list));
  });

  // GET /fhir/PractitionerRole
  fhirRouter.get('/PractitionerRole', (req, res) => {
    const list = ctx.dbUsers.map(mapPractitionerRole);
    res.json(makeBundle(list));
  });

  // GET /fhir/Location
  fhirRouter.get('/Location', (req, res) => {
    res.json(makeBundle(mapLocation()));
  });

  // GET /fhir/Organization
  fhirRouter.get('/Organization', (req, res) => {
    res.json(makeBundle(mapOrganization()));
  });

  // GET /fhir/Coverage
  fhirRouter.get('/Coverage', (req, res) => {
    const list: any[] = [];
    ctx.dbPartners.filter((p) => p.partner_type === 'patient').forEach((p) => {
      list.push(...mapCoverage(p));
    });
    res.json(makeBundle(list));
  });

  // GET /fhir/Consent
  fhirRouter.get('/Consent', (req, res) => {
    const list = ctx.dbUsers.map(mapConsent);
    res.json(makeBundle(list));
  });

  // GET /fhir/Basic
  fhirRouter.get('/Basic', (req, res) => {
    const list = ctx.dbTillSessions.map(mapBasic);
    res.json(makeBundle(list));
  });

  // ============================================================
  // POST ENDPOINTS (P1 - Module Facturation/Caisse & Patients)
  // ============================================================

  // 1. POST /fhir/Patient (Créer un Patient)
  fhirRouter.post('/Patient', (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'invalid', diagnostics: 'Corps de requête vide' }]
        });
      }

      // Parse standard FHIR or simple JSON
      let family = '';
      let given = '';
      let gender: 'M' | 'F' | 'Autre' = 'Autre';
      let birthDate = '1990-01-01';
      let phone = '';
      let street = '';

      if (body.resourceType === 'Patient') {
        family = body.name?.[0]?.family || 'Inconnu';
        given = body.name?.[0]?.given?.join(' ') || 'Inconnu';
        const fhirGender = String(body.gender).toLowerCase();
        gender = fhirGender === 'male' ? 'M' : fhirGender === 'female' ? 'F' : 'Autre';
        birthDate = body.birthDate || '1990-01-01';
        phone = body.telecom?.find((t: any) => t.system === 'phone')?.value || '';
        street = body.address?.[0]?.line?.[0] || '';
      } else {
        family = body.name_family || 'Inconnu';
        given = body.name_given || 'Inconnu';
        gender = body.gender === 'female' || body.gender === 'F' ? 'F' : body.gender === 'male' || body.gender === 'M' ? 'M' : 'Autre';
        birthDate = body.birth_date || '1990-01-01';
        phone = body.phone || body.telecom || '';
        street = body.street || body.address || '';
      }

      const nextId = ctx.getNextPartnerId();
      const newPartner: ResPartner = {
        id: nextId,
        name: `${given} ${family}`.trim(),
        is_company: false,
        email: body.email || null,
        phone: phone || null,
        street: street || null,
        city: body.city || 'Abidjan',
        zip: null,
        country_id: 1,
        vat: null,
        customer_rank: 1,
        supplier_rank: 0,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ndm: body.ndm || `NDM-00${nextId}`,
        partner_type: 'patient',
        gender,
        birth_date: birthDate,
        insurance_id: body.insurance_id || null,
        insurance_name: body.insurance_name || null,
        insurance_policy_number: body.insurance_policy_number || null,
        insurance_coverage_rate: body.insurance_coverage_rate || 0,
        contact_person_name: body.contact_person_name || null,
        contact_person_phone: body.contact_person_phone || null
      };

      ctx.dbPartners.push(newPartner);
      ctx.saveDb();

      // Log to journal R02
      ctx.logToJournal('CREATE', `Création du patient ${newPartner.name} via API FHIR`, {
        id_utilisateur: 1,
        utilisateur_nom: 'Système API',
        numero_dossier: newPartner.ndm || undefined,
        id_patient: newPartner.id,
        patient_nom: newPartner.name,
        statut: 'succes'
      });

      res.status(201).json(mapPatient(newPartner));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // 2. POST /fhir/Invoice (Créer une Invoice / Facture)
  fhirRouter.post('/Invoice', (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'invalid', diagnostics: 'Corps de requête vide' }]
        });
      }

      let patientId = 0;
      let totalAmount = 0;
      let lines: any[] = [];
      let insuranceEnabled = false;
      let insuranceName = '';
      let coverageRate = 0;

      if (body.resourceType === 'Invoice') {
        const patientRef = body.subject?.reference || '';
        patientId = Number(patientRef.replace('Patient/', '')) || 0;
        totalAmount = Number(body.totalNet?.value) || 0;
        lines = (body.line || []).map((l: any) => ({
          name: l.chargeItemCodeableConcept?.text || 'Prestation médicale',
          price_unit: Number(l.priceComponent?.[0]?.amount?.value) || 0,
          qty: Number(l.quantity) || 1
        }));
      } else {
        patientId = Number(body.patient_id) || 0;
        totalAmount = Number(body.amount_total) || 0;
        lines = body.lines || [];
        insuranceEnabled = !!body.insurance_enabled;
        insuranceName = body.insurance_name || '';
        coverageRate = Number(body.insurance_coverage_rate) || 0;
      }

      const patient = ctx.dbPartners.find((p) => p.id === patientId);
      if (!patient) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient #${patientId} introuvable` }]
        });
      }

      const nextMoveId = ctx.getNextMoveId();
      const invoiceNumber = `FAC/2026/${String(nextMoveId).padStart(4, '0')}`;

      // Calculate insurer and patient parts
      const insuranceAmount = insuranceEnabled ? (totalAmount * coverageRate) / 100 : 0;
      const clientShare = totalAmount - insuranceAmount;

      const newMove: AccountMove = {
        id: nextMoveId,
        name: invoiceNumber,
        ref: body.ref || null,
        move_type: 'out_invoice',
        state: 'draft',
        partner_id: patientId,
        invoice_date: new Date().toISOString().split('T')[0],
        date: new Date().toISOString(),
        invoice_date_due: new Date().toISOString().split('T')[0],
        currency_id: 1,
        amount_untaxed: totalAmount,
        amount_tax: 0,
        amount_total: totalAmount,
        amount_residual: clientShare,
        payment_state: 'not_paid',
        invoice_user_id: 1,
        fiscal_position_id: null,
        company_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_name: 'Système API',
        patient_name: patient.name,
        ndm: patient.ndm,
        insurance_enabled: insuranceEnabled,
        insurance_name: insuranceName || null,
        insurance_coverage_rate: coverageRate,
        insurance_amount: insuranceAmount,
        client_share_amount: clientShare
      };

      ctx.dbMoves.push(newMove);

      // Create lines
      lines.forEach((l: any) => {
        const nextLineId = ctx.getNextMoveLineId();
        const newLine: AccountMoveLine = {
          id: nextLineId,
          move_id: nextMoveId,
          partner_id: patientId,
          product_id: null,
          account_id: null,
          tax_ids: [],
          name: l.name || 'Prestation',
          quantity: l.qty || 1,
          price_unit: l.price_unit || 0,
          price_subtotal: (l.qty || 1) * (l.price_unit || 0),
          price_total: (l.qty || 1) * (l.price_unit || 0),
          discount: 0,
          debit: (l.qty || 1) * (l.price_unit || 0),
          credit: 0,
          balance: (l.qty || 1) * (l.price_unit || 0),
          sequence: nextLineId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        ctx.dbMoveLines.push(newLine);
      });

      ctx.saveDb();

      // Log to journal R02
      ctx.logToJournal('CREATE', `Génération de la facture quittance ${invoiceNumber} pour ${patient.name}. Montant: ${totalAmount} FCFA`, {
        id_utilisateur: 1,
        utilisateur_nom: 'Système API',
        numero_dossier: patient.ndm || undefined,
        id_patient: patient.id,
        patient_nom: patient.name,
        statut: 'succes'
      });

      res.status(201).json(mapInvoice(newMove));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // 3. POST /fhir/PaymentReconciliation (Créer un paiement / Rapprochement)
  fhirRouter.post('/PaymentReconciliation', (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'invalid', diagnostics: 'Corps de requête vide' }]
        });
      }

      let invoiceId = 0;
      let amount = 0;
      let method = 'cash';

      if (body.resourceType === 'PaymentReconciliation') {
        const invoiceRef = body.request?.reference || '';
        invoiceId = Number(invoiceRef.replace('Invoice/', '')) || 0;
        amount = Number(body.paymentAmount?.value) || 0;
        method = body.paymentMethod?.coding?.[0]?.code || 'cash';
      } else {
        invoiceId = Number(body.invoice_id) || 0;
        amount = Number(body.amount) || 0;
        method = body.method || 'cash';
      }

      const invoice = ctx.dbMoves.find((m) => m.id === invoiceId);
      if (!invoice) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'not-found', diagnostics: `Facture #${invoiceId} introuvable` }]
        });
      }

      const nextPayId = ctx.getNextPaymentId();
      const newPayment: AccountPayment = {
        id: nextPayId,
        move_id: invoiceId,
        payment_type: 'inbound',
        partner_id: invoice.partner_id,
        amount,
        payment_date: new Date().toISOString().split('T')[0],
        state: 'posted',
        journal_id: 1,
        payment_method_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_method_code: method
      };

      ctx.dbPayments.push(newPayment);

      // Transition state to paid
      invoice.payment_state = 'paid';
      invoice.state = 'posted';
      invoice.amount_residual = Math.max(0, invoice.amount_residual - amount);

      ctx.saveDb();

      // Log to journal R02
      ctx.logToJournal('UPDATE', `Encaissement de ${amount} FCFA par ${method.toUpperCase()} pour la facture ${invoice.name}`, {
        id_utilisateur: 1,
        utilisateur_nom: 'Caissier API',
        numero_dossier: invoice.ndm || undefined,
        id_patient: invoice.partner_id,
        patient_nom: invoice.patient_name || undefined,
        statut: 'succes'
      });

      res.status(201).json(mapPaymentReconciliation(newPayment));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // 4. POST /fhir/Claim (Créer une réclamation assurance)
  fhirRouter.post('/Claim', (req: Request, res: Response) => {
    try {
      const body = req.body;
      const invoiceId = Number(body.invoice_id || body.request?.reference?.replace('Invoice/', '')) || 0;
      const invoice = ctx.dbMoves.find((m) => m.id === invoiceId);

      if (!invoice) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'not-found', diagnostics: `Facture #${invoiceId} introuvable` }]
        });
      }

      const claimId = `claim-${Date.now()}`;
      const claimResource = {
        resourceType: 'Claim',
        id: claimId,
        status: 'active',
        use: 'claim',
        patient: {
          reference: `Patient/${invoice.partner_id}`,
          display: invoice.patient_name
        },
        insurer: {
          display: invoice.insurance_name || 'Assureur'
        },
        provider: {
          display: "LABORATOIRE D'ANALYSES MEDICALES"
        },
        total: {
          value: invoice.insurance_amount || 0,
          currency: 'XOF'
        }
      };

      ctx.logToJournal('CREATE', `Création du dossier de réclamation tiers-payant ${claimId} pour l'assureur ${invoice.insurance_name || 'Inconnu'}`, {
        id_utilisateur: 1,
        utilisateur_nom: 'Système API',
        numero_dossier: invoice.ndm || undefined,
        id_patient: invoice.partner_id,
        patient_nom: invoice.patient_name || undefined,
        statut: 'succes'
      });

      res.status(201).json(claimResource);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // 5. POST /fhir/ClaimResponse (Créer la réponse de l'assureur)
  fhirRouter.post('/ClaimResponse', (req: Request, res: Response) => {
    try {
      const body = req.body;
      const claimId = body.claim_id || body.request?.reference?.replace('Claim/', '') || `claim-${Date.now()}`;
      
      const claimResponseResource = {
        resourceType: 'ClaimResponse',
        id: `cr-${Date.now()}`,
        status: 'active',
        use: 'claim',
        outcome: 'complete',
        created: new Date().toISOString(),
        insurer: {
          display: body.insurer_name || 'Assureur Partenaire'
        },
        request: {
          reference: `Claim/${claimId}`
        },
        total: {
          value: body.amount_paid || 0,
          currency: 'XOF'
        }
      };

      ctx.logToJournal('CREATE', `Réception de l'accord de règlement de la créance d'assurance ${claimId}`, {
        id_utilisateur: 1,
        utilisateur_nom: 'Système API',
        statut: 'succes'
      });

      res.status(201).json(claimResponseResource);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // --- SECTION 6: TRANSACTION ---
  // POST [base] (Bundle type=transaction)
  fhirRouter.post('/', (req: Request, res: Response) => {
    try {
      const bundle = req.body;
      if (!bundle || bundle.resourceType !== 'Bundle' || bundle.type !== 'transaction') {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'invalid', diagnostics: "Le Bundle d'entrée doit être de type 'transaction'" }],
        });
      }

      const responseEntries: any[] = [];
      const entries = bundle.entry || [];

      // Process each transaction item
      entries.forEach((ent: any) => {
        const r = ent.resource;
        if (!r) return;

        // Perform mock storage/creation or DB synchronization
        responseEntries.push({
          response: {
            status: '201 Created',
            location: `https://api.hopital.example/fhir/${r.resourceType}/${r.id || Date.now()}`,
            outcome: {
              resourceType: 'OperationOutcome',
              issue: [{ severity: 'information', code: 'informational', diagnostics: `Ressource ${r.resourceType} insérée ou synchronisée avec succès` }],
            },
          },
        });
      });

      res.status(200).json({
        resourceType: 'Bundle',
        type: 'transaction-response',
        entry: responseEntries,
      });
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // Mount fhirRouter under /fhir
  app.use('/fhir', fhirRouter);
  // Also expose under /api/fhir for backward compatibility or direct frontend requests
  app.use('/api/fhir', fhirRouter);
}
