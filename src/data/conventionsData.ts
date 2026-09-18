import { EnterpriseConvention, HospitalConsultationType, PatientFieldConfig } from '../types';

// ============================================================================
// 1. CONVENTIONS TIERS-PAYEURS (ENTREPRISES & ASSURANCES)
// ============================================================================

export const defaultEnterpriseConventions: EnterpriseConvention[] = [
  // Assurances & Mutuelles
  {
    id: 'conv_ascoma',
    code: 'CONV-ASCOMA-2026',
    name: 'ASCOMA Côte d\'Ivoire (Tiers-Payeur)',
    type: 'insurance',
    type_label: 'Compagnie d\'Assurance',
    default_coverage_rate: 80,
    allowed_rates: [50, 70, 75, 80, 90, 100],
    contact_person: 'Mme Christine Koffi (Directrice Tiers-Payeur)',
    contact_phone: '+225 27 20 25 38 00',
    contact_email: 'tierspayeur@ascoma.ci',
    address: 'Immeuble Woodin Center, Avenue Noguès, Plateau',
    city: 'Abidjan',
    notes: 'Prise en charge directe avec bon officiel ASCOMA. Facturation mensuelle groupée.',
    active: true,
  },
  {
    id: 'conv_sunu',
    code: 'CONV-SUNU-2026',
    name: 'SUNU Assurances Santé',
    type: 'insurance',
    type_label: 'Compagnie d\'Assurance',
    default_coverage_rate: 80,
    allowed_rates: [50, 70, 80, 85, 100],
    contact_person: 'M. Jean-Marc Kouadio',
    contact_phone: '+225 27 20 31 12 12',
    contact_email: 'sante.ci@sunu-group.com',
    address: 'Avenue Botreau Roussel, Plateau',
    city: 'Abidjan',
    notes: 'Convention réseau de soins agréé. Accord préalable requis pour actes > 50 000 FCFA.',
    active: true,
  },
  {
    id: 'conv_axa',
    code: 'CONV-AXA-2026',
    name: 'AXA Assurances Côte d\'Ivoire',
    type: 'insurance',
    type_label: 'Compagnie d\'Assurance',
    default_coverage_rate: 70,
    allowed_rates: [50, 70, 75, 80, 100],
    contact_person: 'Dr. Roland Brou (Médecin-Conseil AXA)',
    contact_phone: '+225 27 20 30 75 00',
    contact_email: 'gestion.tiers@axa.ci',
    address: 'Boulevard Roume, Immeuble AXA, Plateau',
    city: 'Abidjan',
    notes: 'Prise en charge avec carte dématérialisée ou bon papier.',
    active: true,
  },
  {
    id: 'conv_allianz',
    code: 'CONV-ALLIANZ-2026',
    name: 'Allianz Côte d\'Ivoire Assurances',
    type: 'insurance',
    type_label: 'Compagnie d\'Assurance',
    default_coverage_rate: 80,
    allowed_rates: [60, 70, 80, 90, 100],
    contact_person: 'Mme Fatou Diop',
    contact_phone: '+225 27 20 25 66 00',
    contact_email: 'sante@allianz.ci',
    address: 'Immeuble Allianz, Boulevard de la République, Plateau',
    city: 'Abidjan',
    notes: 'Règlement sous 30 jours après dépôt du bordereau récapitulatif certifié.',
    active: true,
  },
  {
    id: 'conv_mugef',
    code: 'CONV-MUGEF-2026',
    name: 'MUGEF-CI / CMU Tiers-Payeur Mutualiste',
    type: 'mutuelle',
    type_label: 'Mutuelle & Couverture Universelle',
    default_coverage_rate: 70,
    allowed_rates: [30, 50, 70, 100],
    contact_person: 'Guichet Unique Conventionné',
    contact_phone: '+225 27 20 20 40 00',
    contact_email: 'prestations@mugef-ci.org',
    address: 'Siège MUGEF-CI, Abidjan Plateau',
    city: 'Abidjan',
    notes: 'Prise en charge pour fonctionnaires et ayants-droit avec carte valide.',
    active: true,
  },

  // Entreprises Conventionnées (Prise en charge directe employeur)
  {
    id: 'conv_sir',
    code: 'CONV-SIR-2026',
    name: 'Société Ivoirienne de Raffinage (SIR)',
    type: 'enterprise',
    type_label: 'Entreprise Partenaire',
    default_coverage_rate: 80,
    allowed_rates: [50, 75, 80, 100],
    contact_person: 'Service Médical & DRH (M. Bamba Bakary)',
    contact_phone: '+225 27 21 23 40 00',
    contact_email: 'infirmerie@sir.ci',
    address: 'Zone Industrielle de Vridi, Port-Bouët',
    city: 'Abidjan',
    notes: 'Convention de prise en charge à 80% pour salariés et 75% pour ayants-droit avec carte d\'entreprise.',
    active: true,
  },
  {
    id: 'conv_cie',
    code: 'CONV-CIE-2026',
    name: 'Compagnie Ivoirienne d\'Électricité (CIE)',
    type: 'enterprise',
    type_label: 'Entreprise Partenaire',
    default_coverage_rate: 75,
    allowed_rates: [50, 75, 80, 100],
    contact_person: 'Direction de la Santé au Travail (Dr. Gnakpa)',
    contact_phone: '+225 27 21 21 21 21',
    contact_email: 'sante.travail@cie.ci',
    address: 'Rue des Électriciens, Treichville',
    city: 'Abidjan',
    notes: 'Prise en charge sur présentation du badge CIE ou bon d\'examen médical.',
    active: true,
  },
  {
    id: 'conv_orange',
    code: 'CONV-ORANGE-2026',
    name: 'Orange Côte d\'Ivoire (Direction RH & Social)',
    type: 'enterprise',
    type_label: 'Entreprise Partenaire',
    default_coverage_rate: 80,
    allowed_rates: [50, 75, 80, 100],
    contact_person: 'Mme Patricia Amani (Responsable Couverture Sociale)',
    contact_phone: '+225 07 07 00 00 00',
    contact_email: 'social.rh@orange.com',
    address: 'Boulevard de Marseille, Zone 3, Marcory',
    city: 'Abidjan',
    notes: 'Convention d\'établissement hospitalier privilégié pour tout le personnel et familles.',
    active: true,
  },
  {
    id: 'conv_paa',
    code: 'CONV-PAA-2026',
    name: 'Port Autonome d\'Abidjan (PAA)',
    type: 'enterprise',
    type_label: 'Entreprise Partenaire',
    default_coverage_rate: 80,
    allowed_rates: [50, 75, 80, 100],
    contact_person: 'Centre Médico-Social du PAA',
    contact_phone: '+225 27 21 23 80 00',
    contact_email: 'medecine@portabidjan.ci',
    address: 'Direction Générale du PAA, Treichville',
    city: 'Abidjan',
    notes: 'Prise en charge à 80% des consultations, hospitalisations et examens biologiques/radiologiques.',
    active: true,
  },
  {
    id: 'conv_smi',
    code: 'CONV-SMI-2026',
    name: 'Société des Mines d\'Ity (SMI / Endeavour Mining)',
    type: 'enterprise',
    type_label: 'Entreprise Partenaire',
    default_coverage_rate: 100,
    allowed_rates: [75, 80, 100],
    contact_person: 'Dr. Yao (Médecin de Site)',
    contact_phone: '+225 27 22 40 90 00',
    contact_email: 'health.ity@endeavourmining.com',
    address: 'Siège Abidjan Cocody Ambassades & Site Minier Ity',
    city: 'Abidjan',
    notes: 'Prise en charge intégrale à 100% pour les évacuations et bilans spécialisés.',
    active: true,
  },
  {
    id: 'conv_bni',
    code: 'CONV-BNI-2026',
    name: 'Banque Nationale d\'Investissement (BNI)',
    type: 'enterprise',
    type_label: 'Entreprise Partenaire',
    default_coverage_rate: 80,
    allowed_rates: [50, 75, 80, 100],
    contact_person: 'Service des Affaires Sociales BNI',
    contact_phone: '+225 27 20 20 98 00',
    contact_email: 'mutuelle@bni.ci',
    address: 'Avenue Marchand, Immeuble BNI, Plateau',
    city: 'Abidjan',
    notes: 'Bordereau mensuel avec récapitulatif par agent.',
    active: true,
  }
];

export const getStoredConventions = (): EnterpriseConvention[] => {
  if (typeof window === 'undefined') return defaultEnterpriseConventions;
  const saved = localStorage.getItem('app_enterprise_conventions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing stored conventions', e);
    }
  }
  return defaultEnterpriseConventions;
};

export const saveStoredConventions = (conventions: EnterpriseConvention[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_enterprise_conventions', JSON.stringify(conventions));
  window.dispatchEvent(new CustomEvent('app_conventions_updated', { detail: conventions }));
};

// ============================================================================
// 2. TYPES DE CONSULTATIONS HOSPITALIÈRES (DYNAMIQUES PAR PÔLE)
// ============================================================================

export const defaultConsultationTypes: HospitalConsultationType[] = [
  // Médecine Générale
  {
    id: 'c_gen_jour',
    code: 'CS-GEN-01',
    name: 'Consultation Médecine Générale (Jour)',
    pole: 'generaliste',
    pole_name: 'Médecine Générale',
    price: 10000,
    description: 'Consultation standard de médecine générale et bilan clinique aux heures normales (07h30-18h00)',
    duration_minutes: 20,
    active: true,
  },
  {
    id: 'c_gen_garde',
    code: 'CS-GEN-GARDE',
    name: 'Consultation Médecine Générale (Garde / Nuit)',
    pole: 'generaliste',
    pole_name: 'Médecine Générale',
    price: 15000,
    description: 'Consultation médicale nocturne, jours fériés et week-ends',
    duration_minutes: 20,
    active: true,
  },

  // Pédiatrie
  {
    id: 'c_ped_nourrisson',
    code: 'CS-PED-01',
    name: 'Consultation Pédiatrique & Suivi Nourrisson',
    pole: 'pediatrie',
    pole_name: 'Pédiatrie & Santé Infantile',
    price: 12000,
    description: 'Examen systématique du nourrisson, courbe de croissance OMS, conseils de diversification',
    duration_minutes: 25,
    active: true,
  },
  {
    id: 'c_ped_pev',
    code: 'CS-PED-PEV',
    name: 'Consultation de Vaccination PEV & Bilan Nutritionnel',
    pole: 'pediatrie',
    pole_name: 'Pédiatrie & Santé Infantile',
    price: 8000,
    description: 'Vérification du carnet vaccinal, pesée, toise, périmètre brachial et administration vaccins',
    duration_minutes: 15,
    active: true,
  },
  {
    id: 'c_ped_spec',
    code: 'CS-PED-SPEC',
    name: 'Consultation Pédiatre Spécialiste',
    pole: 'pediatrie',
    pole_name: 'Pédiatrie & Santé Infantile',
    price: 15000,
    description: 'Avis pédiatre spécialiste pour pathologies aiguës pédiatriques ou suivi chronique',
    duration_minutes: 30,
    active: true,
  },
  {
    id: 'c_ped_urg',
    code: 'CS-PED-URG',
    name: 'Urgence Pédiatrique & Déchocage Nourrisson',
    pole: 'pediatrie',
    pole_name: 'Pédiatrie & Santé Infantile',
    price: 18000,
    description: 'Prise en charge immédiate pour détresse respiratoire, convulsions fébriles ou déshydratation sévère',
    duration_minutes: 30,
    active: true,
  },

  // Maternité & Obstétrique
  {
    id: 'c_mat_cpn',
    code: 'CS-MAT-CPN',
    name: 'Consultation Prénatale (CPN 1/2/3/4) & Suivi Grossesse',
    pole: 'maternite',
    pole_name: 'Maternité & Gynéco-Obstétrique',
    price: 10000,
    description: 'Suivi obstétrical réglementaire, examen fœtal par doppler, prescription bilan prénatal OMS',
    duration_minutes: 25,
    active: true,
  },
  {
    id: 'c_mat_postpartum',
    code: 'CS-MAT-POST',
    name: 'Consultation Post-Partum & Suivi Accouchée',
    pole: 'maternite',
    pole_name: 'Maternité & Gynéco-Obstétrique',
    price: 8000,
    description: 'Examen de la mère et du nouveau-né au 6e jour / 6e semaine après accouchement',
    duration_minutes: 20,
    active: true,
  },
  {
    id: 'c_mat_gyneco',
    code: 'CS-MAT-GYN',
    name: 'Consultation Gynécologique & Planification Familiale',
    pole: 'maternite',
    pole_name: 'Maternité & Gynéco-Obstétrique',
    price: 12000,
    description: 'Examen gynécologique complet, frottis FCU, contraception et bilan hormonal',
    duration_minutes: 25,
    active: true,
  },
  {
    id: 'c_mat_gar',
    code: 'CS-MAT-GAR',
    name: 'Consultation Grossesse à Haut Risque (GHR)',
    pole: 'maternite',
    pole_name: 'Maternité & Gynéco-Obstétrique',
    price: 18000,
    description: 'Évaluation par gynécologue-obstétricien pour pré-éclampsie, diabète gestationnel, antécédents obstétricaux',
    duration_minutes: 35,
    active: true,
  },

  // Médecine Spécialisée
  {
    id: 'c_spec_cardio',
    code: 'CS-SPEC-CARDIO',
    name: 'Consultation Spécialisée en Cardiologie',
    pole: 'specialiste',
    pole_name: 'Médecine Spécialisée',
    price: 20000,
    description: 'Avis cardiologue avec examen cardiovasculaire, auscultation et interprétation ECG',
    duration_minutes: 30,
    active: true,
  },
  {
    id: 'c_spec_diabete',
    code: 'CS-SPEC-DIAB',
    name: 'Consultation Spécialisée Diabétologie & Endocrinologie',
    pole: 'specialiste',
    pole_name: 'Médecine Spécialisée',
    price: 18000,
    description: 'Prise en charge métabolique, adaptation insulinothérapie et dépistage pied diabétique',
    duration_minutes: 30,
    active: true,
  },
  {
    id: 'c_spec_chir',
    code: 'CS-SPEC-CHIR',
    name: 'Consultation Chirurgicale Pré / Post-Opératoire',
    pole: 'specialiste',
    pole_name: 'Médecine Spécialisée',
    price: 20000,
    description: 'Examen par chirurgien pour indication opératoire ou contrôle de cicatrisation',
    duration_minutes: 25,
    active: true,
  },
  {
    id: 'c_spec_ophta',
    code: 'CS-SPEC-OPHTA',
    name: 'Consultation Spécialisée Ophtalmologie',
    pole: 'specialiste',
    pole_name: 'Médecine Spécialisée',
    price: 15000,
    description: 'Examen de la réfraction, fond d\'œil et mesure de la pression intra-oculaire',
    duration_minutes: 20,
    active: true,
  },

  // Soins Infirmiers & Triage
  {
    id: 'c_inf_triage',
    code: 'CS-INF-TRIAGE',
    name: 'Triage Infirmier & Prise des Constantes Vitales',
    pole: 'infirmier',
    pole_name: 'Soins Infirmiers & Triage',
    price: 2000,
    description: 'Prise de TA, Pouls, Température, Poids, SpO2, Glycémie et orientation de file',
    duration_minutes: 10,
    active: true,
  },
  {
    id: 'c_inf_pansement',
    code: 'CS-INF-PANSE',
    name: 'Soins Infirmiers, Pansement & Injection / Perfusion',
    pole: 'infirmier',
    pole_name: 'Soins Infirmiers & Triage',
    price: 5000,
    description: 'Administration de traitement injectable (IM/IV), pose de voie veineuse, réfection de pansement aseptique',
    duration_minutes: 15,
    active: true,
  },

  // Urgences
  {
    id: 'c_urg_directe',
    code: 'CS-URG-01',
    name: 'Admission Urgences & Triage Déchocage 24/7',
    pole: 'urgences',
    pole_name: 'Urgences Hospitalières',
    price: 15000,
    description: 'Prise en charge immédiate au box des urgences avec monitorage continu',
    duration_minutes: 30,
    active: true,
  }
];

export const getStoredConsultationTypes = (): HospitalConsultationType[] => {
  if (typeof window === 'undefined') return defaultConsultationTypes;
  const saved = localStorage.getItem('app_consultation_types');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing stored consultation types', e);
    }
  }
  return defaultConsultationTypes;
};

export const saveStoredConsultationTypes = (types: HospitalConsultationType[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_consultation_types', JSON.stringify(types));
  window.dispatchEvent(new CustomEvent('app_consultation_types_updated', { detail: types }));
};

// ============================================================================
// 3. CONFIGURATION DYNAMIQUE DES CHAMPS DOSSIER PATIENT (ADMIN / BACKOFFICE)
// ============================================================================

export const defaultPatientFieldsConfig: PatientFieldConfig[] = [
  // 1. Identité & État Civil
  {
    id: 'last_name',
    label: 'Nom de famille du patient',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'mandatory',
    description: 'Obligatoire par défaut pour l\'identitovigilance et la facturation légale.',
    is_core: true,
  },
  {
    id: 'first_name',
    label: 'Prénoms du patient',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'mandatory',
    description: 'Prénoms usuels complets pour la distinction des homonymes.',
    is_core: true,
  },
  {
    id: 'maiden_name',
    label: 'Nom de jeune fille (si mariée)',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'optional',
    description: 'Utile en gynéco-obstétrique et pour la traçabilité des dossiers.',
    is_core: false,
  },
  {
    id: 'gender',
    label: 'Genre / Sexe biologique (M / F)',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'mandatory',
    description: 'Indispensable pour les valeurs de référence biologiques, CPN et pédiatrie.',
    is_core: true,
  },
  {
    id: 'birth_date',
    label: 'Date de naissance (ou Âge)',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'mandatory',
    description: 'Permet le calcul automatique de l\'âge exact pour les posologies et normes OMS.',
    is_core: true,
  },
  {
    id: 'birth_place',
    label: 'Lieu de naissance',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'optional',
    description: 'Complément pour la déclaration d\'état civil et le certificat de naissance.',
    is_core: false,
  },
  {
    id: 'civil_status',
    label: 'Statut matrimonial (Célibataire, Marié, etc.)',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'optional',
    description: 'Situation familiale du patient.',
    is_core: false,
  },
  {
    id: 'nationality',
    label: 'Nationalité',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'optional',
    description: 'Nationalité déclarée du patient.',
    is_core: false,
  },
  {
    id: 'profession',
    label: 'Profession / Activité',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'optional',
    description: 'Utile pour la médecine du travail et l\'anamnèse.',
    is_core: false,
  },
  {
    id: 'religion',
    label: 'Religion / Croyance',
    category: 'identity',
    category_label: '1. Identité & État Civil',
    status: 'optional',
    description: 'Pour le respect des volontés spécifiques en soins palliatifs / diététique.',
    is_core: false,
  },

  // 2. Coordonnées & Résidence
  {
    id: 'phone',
    label: 'N° Téléphone mobile principal',
    category: 'contact',
    category_label: '2. Coordonnées & Résidence',
    status: 'mandatory',
    description: 'Requis pour les notifications de résultats d\'analyses et rappels CPN / RDV.',
    is_core: false,
  },
  {
    id: 'home_phone',
    label: 'Téléphone fixe / secondaire',
    category: 'contact',
    category_label: '2. Coordonnées & Résidence',
    status: 'optional',
    description: 'Numéro de secours supplémentaire.',
    is_core: false,
  },
  {
    id: 'region',
    label: 'Région / District sanitaire',
    category: 'contact',
    category_label: '2. Coordonnées & Résidence',
    status: 'optional',
    description: 'Région administrative de résidence.',
    is_core: false,
  },
  {
    id: 'province',
    label: 'Province / Ville / État',
    category: 'contact',
    category_label: '2. Coordonnées & Résidence',
    status: 'optional',
    description: 'Localité principale.',
    is_core: false,
  },
  {
    id: 'department',
    label: 'Département / Commune',
    category: 'contact',
    category_label: '2. Coordonnées & Résidence',
    status: 'optional',
    description: 'Commune ou sous-préfecture.',
    is_core: false,
  },
  {
    id: 'commune',
    label: 'Quartier / Village / Adresse précise',
    category: 'contact',
    category_label: '2. Coordonnées & Résidence',
    status: 'optional',
    description: 'Adresse physique précise pour les visites ou correspondances.',
    is_core: false,
  },

  // 3. Personne de Contact d'Urgence
  {
    id: 'contact_person_name',
    label: 'Nom & Prénom du Contact d\'Urgence',
    category: 'emergency',
    category_label: '3. Personne à contacter d\'urgence',
    status: 'optional',
    description: 'Personne à prévenir impérativement en cas d\'urgence ou d\'hospitalisation.',
    is_core: false,
  },
  {
    id: 'contact_person_relationship',
    label: 'Lien de parenté / Relation avec le patient',
    category: 'emergency',
    category_label: '3. Personne à contacter d\'urgence',
    status: 'optional',
    description: 'Ex: Conjoint(e), Père, Mère, Frère, Tuteur légal.',
    is_core: false,
  },
  {
    id: 'contact_person_phone',
    label: 'Téléphone du Contact d\'Urgence',
    category: 'emergency',
    category_label: '3. Personne à contacter d\'urgence',
    status: 'optional',
    description: 'Numéro joignable 24/7 du proche référent.',
    is_core: false,
  },

  // 4. Informations Administratives & Identifiants
  {
    id: 'cnib',
    label: 'N° Pièce d\'Identité (CNI / Passeport / Attestation)',
    category: 'administrative',
    category_label: '4. Pièce d\'Identité & Administratif',
    status: 'optional',
    description: 'Numéro officiel de la pièce d\'identité nationale.',
    is_core: false,
  },
  {
    id: 'patient_class',
    label: 'Classe / Catégorie de Patient (Assuré, VIP, Privé)',
    category: 'administrative',
    category_label: '4. Pièce d\'Identité & Administratif',
    status: 'optional',
    description: 'Catégorisation tarifaire ou sociale.',
    is_core: false,
  },
  {
    id: 'patient_photo',
    label: 'Photo d\'Identité du Patient',
    category: 'administrative',
    category_label: '4. Pièce d\'Identité & Administratif',
    status: 'optional',
    description: 'Photo pour le badge patient et la lutte contre la fraude.',
    is_core: false,
  },
];

export const getStoredPatientFieldsConfig = (): PatientFieldConfig[] => {
  if (typeof window === 'undefined') return defaultPatientFieldsConfig;
  const saved = localStorage.getItem('app_patient_fields_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing stored patient fields config', e);
    }
  }
  return defaultPatientFieldsConfig;
};

export const saveStoredPatientFieldsConfig = (fields: PatientFieldConfig[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_patient_fields_config', JSON.stringify(fields));
  window.dispatchEvent(new CustomEvent('app_patient_fields_updated', { detail: fields }));
};

export type { EnterpriseConvention, HospitalConsultationType, PatientFieldConfig } from '../types';

export const DEFAULT_PATIENT_FIELDS_CONFIG = defaultPatientFieldsConfig;
export const DEFAULT_CONVENTIONS = defaultEnterpriseConventions;
export const DEFAULT_CONSULTATION_TYPES = defaultConsultationTypes;
