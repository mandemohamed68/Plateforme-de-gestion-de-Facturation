import { HospitalScenario, HospitalGlobalRule } from '../types';

export type { HospitalScenario, HospitalGlobalRule };
export type HospitalRule = HospitalGlobalRule;

// ============================================================
// 4. RÈGLES GLOBALES (R01 à R10)
// ============================================================
export const HOSPITAL_RULES: HospitalGlobalRule[] = [
  {
    code: 'R01',
    titre: 'Numéro de Dossier Unique & Obligatoire',
    description: 'Le numero_dossier est unique et obligatoire pour tout patient pris en charge dans l\'établissement.',
    applicable_modules: ['Administration', 'Dossiers médicaux', 'Accueil', 'Tous les services']
  },
  {
    code: 'R02',
    titre: 'Traçabilité Intégrale au Journal d\'Audit',
    description: 'Toute action (médicale, administrative, financière ou technique) est obligatoirement tracée dans le Journal.',
    applicable_modules: ['Sécurité', 'Journal & Audit', 'Superviseur', 'Tous les services']
  },
  {
    code: 'R03',
    titre: 'Affichage Immédiat des Allergies & Antécédents',
    description: 'Allergies, antécédents et traitements en cours doivent être visibles immédiatement à chaque ouverture du dossier.',
    applicable_modules: ['Infirmier', 'Médecin', 'Médecin spécialiste', 'Hospitalisation', 'Urgences']
  },
  {
    code: 'R04',
    titre: 'Alerte & Blocage sur Factures Impayées',
    description: 'Les factures impayées déclenchent une alerte visuelle ou un blocage selon le paramétrage de l\'établissement.',
    applicable_modules: ['Facturation', 'Caisse', 'Superviseur', 'Accueil']
  },
  {
    code: 'R05',
    titre: 'Signalement d\'Hospitalisation en Cours',
    description: 'Toute hospitalisation en cours est immédiatement signalée avant toute nouvelle tentative d\'admission.',
    applicable_modules: ['Hospitalisation', 'Gestion des lits', 'Urgences', 'Médecin']
  },
  {
    code: 'R06',
    titre: 'Confidentialité des Résultats Non Validés',
    description: 'Les résultats d\'analyses ou d\'imagerie non validés par le biologiste/radiologue sont invisibles au patient.',
    applicable_modules: ['Laboratoire', 'Imagerie', 'Diffusion des résultats', 'Accueil']
  },
  {
    code: 'R07',
    titre: 'Clôture de Caisse Préalable Obligatoire',
    description: 'La clôture de la caisse précédente est obligatoire avant l\'ouverture d\'une nouvelle session par le caissier.',
    applicable_modules: ['Caisse', 'Superviseur', 'Comptabilité']
  },
  {
    code: 'R08',
    titre: 'Contrôle d\'Accès Basé sur les Rôles (RBAC)',
    description: 'Les rôles et permissions déterminent strictement les menus, vues et actions accessibles à chaque utilisateur.',
    applicable_modules: ['Administration', 'Sécurité', 'Profils']
  },
  {
    code: 'R09',
    titre: 'Vue 360° Instantanée par N° de Dossier',
    description: 'Le système affiche automatiquement la vue 360° complète dès la saisie du numéro de dossier.',
    applicable_modules: ['Recherche universelle', 'Dossier patient', 'Tous les postes']
  },
  {
    code: 'R10',
    titre: 'Session Caisse Ouverte Requise pour Encaissement',
    description: 'Aucune facture ne peut être encaissée sans qu\'une session de caisse active ne soit ouverte.',
    applicable_modules: ['Caisse', 'Facturation', 'Comptabilité']
  }
];

// ============================================================
// 6. FLUX COMPLET TYPE (1 à 11)
// ============================================================
export interface FluxCompletStep {
  step: number;
  titre: string;
  acteur: string;
  menu: string;
  description: string;
  regles: string[];
  targetView: string;
}

export const FLUX_COMPLET_STEPS: FluxCompletStep[] = [
  {
    step: 1,
    titre: 'Arrivée du patient',
    acteur: 'Patient / Accueil',
    menu: 'Administration > Accueil',
    description: 'Le patient se présente à l\'accueil ou aux admissions de l\'hôpital.',
    regles: ['R01'],
    targetView: 'partners'
  },
  {
    step: 2,
    titre: 'Saisie N° dossier',
    acteur: 'Agent accueil',
    menu: 'Recherche universelle N° Dossier',
    description: 'L\'agent saisit le numéro de dossier (ou recherche par nom/date de naissance).',
    regles: ['R01', 'R09'],
    targetView: 'patient_journey'
  },
  {
    step: 3,
    titre: 'Affichage Vue 360°',
    acteur: 'Système / Agent',
    menu: 'Dossier Patient 360°',
    description: 'Affichage instantané : identité, antécédents, allergies, dernière consultation, examens, hospitalisations, factures impayées.',
    regles: ['R03', 'R04', 'R05', 'R09'],
    targetView: 'patient_journey'
  },
  {
    step: 4,
    titre: 'Triage & Constantes',
    acteur: 'Infirmier',
    menu: 'Médical > Infirmier > Triage & Constantes',
    description: 'Prise de la tension, pouls, température, SpO2, glycémie, poids, taille et évaluation du degré d\'urgence.',
    regles: ['R02', 'R03'],
    targetView: 'infirmier_vitals'
  },
  {
    step: 5,
    titre: 'Consultation & Prescriptions',
    acteur: 'Médecin',
    menu: 'Médical > Médecin > Consultations',
    description: 'Examen clinique, diagnostic CIM-10, prescriptions médicamenteuses et demandes d\'examens complémentaires.',
    regles: ['R02', 'R03'],
    targetView: 'medecin_consultations'
  },
  {
    step: 6,
    titre: 'Réalisation des Examens',
    acteur: 'Laboratoire / Imagerie',
    menu: 'Examens > Laboratoire / Imagerie',
    description: 'Prélèvement des tubes primaires, réalisation des séries sur automates et acquisition des clichés radiologiques.',
    regles: ['R02'],
    targetView: 'labo_queue'
  },
  {
    step: 7,
    titre: 'Validation des Résultats',
    acteur: 'Biologiste / Radiologue',
    menu: 'Examens > Résultats & Validation',
    description: 'Validation médicale des résultats et signature électronique du compte-rendu.',
    regles: ['R02', 'R06'],
    targetView: 'labo_results'
  },
  {
    step: 8,
    titre: 'Décision d\'Hospitalisation (si nécessaire)',
    acteur: 'Médecin / Hospitalisation',
    menu: 'Hospitalisation > Admissions & Lits',
    description: 'Si l\'état clinique l\'exige : admission, attribution d\'un lit dans le service adapté et surveillance continue.',
    regles: ['R02', 'R05'],
    targetView: 'hospit_admissions'
  },
  {
    step: 9,
    titre: 'Facturation & Encaissement Caisse',
    acteur: 'Facturation / Caisse',
    menu: 'Facturation > Caisse & Facture',
    description: 'Génération de la quittance détaillée (part patient / part assurance) et encaissement avec délivrance du reçu.',
    regles: ['R02', 'R04', 'R10'],
    targetView: 'caisse_new_payment'
  },
  {
    step: 10,
    titre: 'Clôture de Session Caisse',
    acteur: 'Caissier',
    menu: 'Facturation > Caisse > Clôture',
    description: 'Arrêté de caisse journalier, pointage des espèces et encaissements électroniques, et clôture officielle de la session.',
    regles: ['R02', 'R07'],
    targetView: 'caisse_cloture'
  },
  {
    step: 11,
    titre: 'Contrôle & Rapports Superviseur',
    acteur: 'Superviseur',
    menu: 'Facturation > Superviseur > Contrôle & Rapports',
    description: 'Audit croisé des encaissements, vérification des écarts, contrôle des annulations et consolidation des rapports d\'activité.',
    regles: ['R02'],
    targetView: 'superviseur_reports'
  }
];

// ============================================================
// 5. LES 50 SCÉNARIOS (S01 à S50)
// ============================================================
export const HOSPITAL_SCENARIOS: HospitalScenario[] = [
  {
    id: 'S01',
    nom: 'Nouveau patient sans dossier',
    acteur: 'Administration',
    declencheur: 'Patient arrive sans N° dossier',
    preconditions: 'Aucun dossier existant',
    etapes: [
      '1. Rechercher patient par nom / date de naissance',
      '2. Si non trouvé, créer dossier administratif complet',
      '3. Générer automatiquement le N° de dossier unique obligatoire',
      '4. Ouvrir la visite médicale',
      '5. Orienter selon le motif de consultation'
    ],
    menus: ['Administration', 'Dossiers médicaux', 'Caisse & Facture'],
    lectures: ['Aucun'],
    ecritures: ['Patient', 'Dossier', 'Visite'],
    postconditions: 'Dossier créé, visite ouverte',
    regles: ['R01', 'R02', 'R09'],
    targetView: 'partners',
    description_courte: 'Création administrative d\'un nouveau patient avec génération du NDM unique et ouverture de visite.'
  },
  {
    id: 'S02',
    nom: 'Patient connu avec rendez-vous',
    acteur: 'Médecin',
    declencheur: 'Patient arrive avec rendez-vous',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Vérifier identité et dossier',
      '3. Valider la consultation prévue',
      '4. Médecin reçoit le patient en consultation'
    ],
    menus: ['Médical', 'Factures'],
    lectures: ['Consultations passées', 'Prescriptions', 'Examens'],
    ecritures: ['Consultation'],
    postconditions: 'Consultation enregistrée',
    regles: ['R02', 'R03', 'R09'],
    targetView: 'medecin_consultations',
    description_courte: 'Accueil d\'un patient programmé, consultation de son historique et saisie de l\'acte médical.'
  },
  {
    id: 'S03',
    nom: 'Patient connu sans rendez-vous',
    acteur: 'Infirmier',
    declencheur: 'Patient arrive sans rendez-vous',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Création de la visite spontanée (walk-in)',
      '3. Triage et orientation vers le poste de soins'
    ],
    menus: ['Infirmier', 'Médecin', 'Caisse'],
    lectures: ['Dernier passage', 'Antécédents', 'Impayés'],
    ecritures: ['Visite'],
    postconditions: 'Visite créée',
    regles: ['R02', 'R03', 'R04', 'R09'],
    targetView: 'infirmier_queue',
    description_courte: 'Prise en charge d\'un patient sans RDV avec vérification des impayés et création de visite.'
  },
  {
    id: 'S04',
    nom: 'Patient arrive aux urgences',
    acteur: 'Infirmier',
    declencheur: 'Urgence médicale',
    preconditions: 'Dossier existant ou création rapide',
    etapes: [
      '1. Rechercher par N° dossier (ou création d\'urgence)',
      '2. Triage immédiat avec évaluation du score de gravité',
      '3. Prise des constantes vitales (TA, SpO2, FC, T°)',
      '4. Administration des premiers soins d\'urgence',
      '5. Alerte et transfert vers le médecin urgentiste'
    ],
    menus: ['Infirmier', 'Médecin', 'Examens'],
    lectures: ['Allergies', 'Antécédents', 'Hospitalisations'],
    ecritures: ['Visite', 'Constantes', 'Soins'],
    postconditions: 'Patient pris en charge en urgence',
    regles: ['R02', 'R03', 'R09'],
    targetView: 'infirmier_triage',
    description_courte: 'Triage de haute priorité aux urgences avec prise des constantes et transmission au médecin.'
  },
  {
    id: 'S05',
    nom: 'Patient orienté vers infirmier',
    acteur: 'Infirmier',
    declencheur: 'Orientation médicale',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Appel depuis la file des patients en attente',
      '3. Triage infirmier',
      '4. Mesure complète des constantes vitales',
      '5. Réalisation des soins infirmiers prescrits'
    ],
    menus: ['Infirmier'],
    lectures: ['Constantes précédentes', 'Soins antérieurs'],
    ecritures: ['Constantes', 'Soins'],
    postconditions: 'Soins réalisés et tracés',
    regles: ['R02', 'R03'],
    targetView: 'infirmier_vitals',
    description_courte: 'Poste de soins et constantes infirmières avec enregistrement au dossier.'
  },
  {
    id: 'S06',
    nom: 'Patient orienté vers médecin généraliste',
    acteur: 'Médecin',
    declencheur: 'Orientation vers médecine générale',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Sélection dans la file des patients en attente',
      '3. Conduite de la consultation médicale',
      '4. Rédaction des prescriptions médicamenteuses et examens'
    ],
    menus: ['Médecin'],
    lectures: ['Consultations', 'Dossiers médicaux'],
    ecritures: ['Consultation', 'Prescription'],
    postconditions: 'Consultation terminée',
    regles: ['R02', 'R03'],
    targetView: 'medecin_consultations',
    description_courte: 'Consultation complète avec anamnèse, examen clinique, diagnostic et ordonnance.'
  },
  {
    id: 'S07',
    nom: 'Patient orienté vers médecin spécialiste',
    acteur: 'Médecin spécialiste',
    declencheur: 'Orientation spécialiste (Cardio, Pédiatrie, etc.)',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. File des patients orientés vers la spécialité',
      '3. Réalisation de la consultation spécialisée',
      '4. Définition du protocole de suivi spécialisé'
    ],
    menus: ['Médecin spécialiste'],
    lectures: ['Consultations spécialisées', 'Suivi'],
    ecritures: ['Consultation', 'Suivi'],
    postconditions: 'Consultation spécialisée terminée',
    regles: ['R02', 'R03'],
    targetView: 'specialiste_consultations',
    description_courte: 'Avis spécialisé avec protocole d\'exploration ciblée et plan de suivi.'
  },
  {
    id: 'S08',
    nom: 'Patient avec prescription d\'examens laboratoire',
    acteur: 'Laboratoire',
    declencheur: 'Prescription médicale d\'analyses',
    preconditions: 'Dossier existant, prescription active',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Vérification de la prescription biologique',
      '3. Prélèvement biologique et étiquetage code-barres des tubes',
      '4. Lancement des séries d\'analyses sur automates',
      '5. Saisie technique des résultats',
      '6. Validation par le biologiste médical'
    ],
    menus: ['Laboratoire'],
    lectures: ['Examens antérieurs', 'Résultats'],
    ecritures: ['Examen', 'Résultat'],
    postconditions: 'Résultat d\'analyse validé',
    regles: ['R02', 'R06'],
    targetView: 'labo_queue',
    description_courte: 'Cycle complet du prélèvement biologique à la validation médicale.'
  },
  {
    id: 'S09',
    nom: 'Patient avec prescription d\'imagerie',
    acteur: 'Imagerie',
    declencheur: 'Prescription médicale d\'imagerie (Radio, Écho, Scanner)',
    preconditions: 'Dossier existant, prescription active',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Consultation de l\'examen programmé',
      '3. Réalisation de l\'acquisition par le manipulateur radio',
      '4. Rédaction du compte-rendu radiologique structuré',
      '5. Validation et signature médicale'
    ],
    menus: ['Imagerie'],
    lectures: ['Imageries antérieures', 'Comptes rendus'],
    ecritures: ['Examen', 'Compte rendu'],
    postconditions: 'Compte rendu d\'imagerie validé',
    regles: ['R02', 'R06'],
    targetView: 'imagerie_queue',
    description_courte: 'Prise en charge en imagerie avec acquisition PACS et validation du compte-rendu.'
  },
  {
    id: 'S10',
    nom: 'Patient venant pour résultats / validation',
    acteur: 'Laboratoire',
    declencheur: 'Retrait de résultats par le patient',
    preconditions: 'Dossier existant, résultats en attente de remise',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Contrôle de l\'état de validation des résultats',
      '3. Vérification de la signature du biologiste (R06)',
      '4. Impression et remise officielle au patient'
    ],
    menus: ['Laboratoire', 'Imagerie', 'Médecin'],
    lectures: ['Résultats précédents', 'Prescriptions'],
    ecritures: ['Validation'],
    postconditions: 'Résultats remis en toute conformité',
    regles: ['R02', 'R06'],
    targetView: 'labo_results',
    description_courte: 'Vérification du verrou de validation médicale avant toute communication des résultats.'
  },
  {
    id: 'S11',
    nom: 'Patient nécessitant hospitalisation',
    acteur: 'Médecin',
    declencheur: 'Décision médicale d\'hospitalisation',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Poser la décision d\'hospitalisation avec motif',
      '3. Créer la demande d\'admission administrative',
      '4. Consulter la gestion des lits et attribuer un lit'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Antécédents', 'Hospitalisations passées'],
    ecritures: ['Hospitalisation', 'Lit'],
    postconditions: 'Patient admis et lit occupé',
    regles: ['R02', 'R05'],
    targetView: 'hospit_admissions',
    description_courte: 'Décision d\'hospitalisation, contrôle des séjours actifs et affectation du lit.'
  },
  {
    id: 'S12',
    nom: 'Patient hospitalisé — suivi',
    acteur: 'Hospitalisation',
    declencheur: 'Visite et suivi quotidien du séjour',
    preconditions: 'Hospitalisation en cours',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Sélection du patient dans la liste des hospitalisés',
      '3. Saisie du suivi clinique quotidien',
      '4. Administration des soins prescrits',
      '5. Ajustement des prescriptions'
    ],
    menus: ['Hospitalisation', 'Médical'],
    lectures: ['Séjour en cours', 'Traitements'],
    ecritures: ['Suivi', 'Soins', 'Prescriptions'],
    postconditions: 'Feuille de suivi mise à jour',
    regles: ['R02', 'R03'],
    targetView: 'hospit_monitoring',
    description_courte: 'Suivi journalier du malade hospitalisé avec constantes, soins et réévaluation.'
  },
  {
    id: 'S13',
    nom: 'Patient hospitalisé — transfert',
    acteur: 'Hospitalisation',
    declencheur: 'Besoin de transfert de service ou de lit',
    preconditions: 'Hospitalisation en cours',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Ouvrir le module des transferts',
      '3. Libérer l\'ancien lit et affecter le nouveau lit/service'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Motif', 'Service actuel', 'Historique'],
    ecritures: ['Transfert'],
    postconditions: 'Transfert effectué et lits mis à jour',
    regles: ['R02', 'R05'],
    targetView: 'hospit_transfers',
    description_courte: 'Changement de service ou de chambre avec mise à jour immédiate du plan des lits.'
  },
  {
    id: 'S14',
    nom: 'Patient hospitalisé — sortie',
    acteur: 'Hospitalisation',
    declencheur: 'Autorisation médicale de sortie',
    preconditions: 'Hospitalisation en cours',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Enregistrement de l\'avis de sortie',
      '3. Génération du résumé de sortie d\'hospitalisation',
      '4. Transmission à la facturation pour clôture du compte de séjour'
    ],
    menus: ['Hospitalisation', 'Factures'],
    lectures: ['Séjour', 'Actes', 'Examens'],
    ecritures: ['Sortie', 'Facture'],
    postconditions: 'Patient sorti, lit libéré, facture créée',
    regles: ['R02', 'R04'],
    targetView: 'hospit_discharges',
    description_courte: 'Clôture médicale du séjour, libération du lit et génération de la facture finale.'
  },
  {
    id: 'S15',
    nom: 'Patient en suivi chronique / réadmission',
    acteur: 'Médecin',
    declencheur: 'Réadmission pour pathologie chronique',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Consultation de l\'historique médical complet',
      '3. Ouverture d\'une nouvelle consultation de suivi',
      '4. Mise à jour du protocole de prise en charge'
    ],
    menus: ['Médical', 'Hospitalisation'],
    lectures: ['Tous les passages précédents'],
    ecritures: ['Consultation', 'Hospitalisation'],
    postconditions: 'Nouvelle prise en charge enregistrée',
    regles: ['R02', 'R03', 'R09'],
    targetView: 'specialiste_followup',
    description_courte: 'Prise en charge d\'un patient chronique avec exploitation de l\'historique antérieur.'
  },
  {
    id: 'S16',
    nom: 'Patient avec dossier incomplet',
    acteur: 'Administration',
    declencheur: 'Alerte sur données administratives manquantes',
    preconditions: 'Dossier existant',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Identification de l\'alerte sur les champs manquants',
      '3. Complétion administrative (contact, pièce d\'identité, tuteur)',
      '4. Validation et levée de l\'alerte'
    ],
    menus: ['Administration', 'Dossiers médicaux'],
    lectures: ['Données manquantes'],
    ecritures: ['Dossier'],
    postconditions: 'Dossier patient complété et conforme',
    regles: ['R01', 'R02'],
    targetView: 'partners',
    description_courte: 'Mise à niveau des informations administratives manquantes du dossier.'
  },
  {
    id: 'S17',
    nom: 'Patient mineur / accompagné',
    acteur: 'Administration',
    declencheur: 'Arrivée d\'un patient mineur ou vulnérable',
    preconditions: 'Dossier existant ou création',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Vérification et enregistrement du tuteur / représentant légal',
      '3. Orientation vers le service de pédiatrie ou de soins'
    ],
    menus: ['Administration', 'Médical'],
    lectures: ['Autorisations', 'Antécédents'],
    ecritures: ['Dossier'],
    postconditions: 'Prise en charge validée avec tuteur',
    regles: ['R01', 'R02', 'R03'],
    targetView: 'partners',
    description_courte: 'Enregistrement de la personne à prévenir et du tuteur légal d\'un mineur.'
  },
  {
    id: 'S18',
    nom: 'Patient avec hospitalisation en cours',
    acteur: 'Hospitalisation',
    declencheur: 'Tentative de nouvelle visite alors qu\'hospitalisé',
    preconditions: 'Hospitalisation en cours',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Déclenchement automatique de l\'alerte d\'hospitalisation active (R05)',
      '3. Orientation directe vers le service et le lit d\'affectation'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Séjour actuel', 'Service', 'Lit'],
    ecritures: ['Aucune'],
    postconditions: 'Patient orienté vers son service sans doublon',
    regles: ['R05'],
    targetView: 'hospit_patients',
    description_courte: 'Détection immédiate d\'un séjour hospitalier actif interdisant les doublons d\'admission.'
  },
  {
    id: 'S19',
    nom: 'Patient avec examens en attente',
    acteur: 'Laboratoire',
    declencheur: 'Alerte d\'examens non exécutés',
    preconditions: 'Dossier existant avec examens prescrits',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Visualisation des examens en attente de réalisation',
      '3. Relance ou prise en charge immédiate sur le plateau technique'
    ],
    menus: ['Laboratoire', 'Imagerie'],
    lectures: ['Examens non validés'],
    ecritures: ['Examen'],
    postconditions: 'Examens suivis et pris en charge',
    regles: ['R02', 'R06'],
    targetView: 'labo_in_progress',
    description_courte: 'Surveillance des bilans prescrits en attente d\'analyse technique.'
  },
  {
    id: 'S20',
    nom: 'Patient avec résultats non validés',
    acteur: 'Laboratoire',
    declencheur: 'Validation requise par le médecin biologiste',
    preconditions: 'Résultats saisis en attente de validation',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Revue technique et biologique des résultats saisis',
      '3. Signature médicale et validation définitive du compte-rendu'
    ],
    menus: ['Laboratoire', 'Imagerie'],
    lectures: ['Résultats en attente'],
    ecritures: ['Validation', 'Compte rendu'],
    postconditions: 'Résultats validés et déverrouillés',
    regles: ['R02', 'R06'],
    targetView: 'labo_results',
    description_courte: 'Validation formelle des résultats par le biologiste avant diffusion.'
  },
  {
    id: 'S21',
    nom: 'Facturation avant soins',
    acteur: 'Facturation',
    declencheur: 'Acte programmé payable d\'avance',
    preconditions: 'Dossier existant, session caisse active',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Établissement de la facture pré-soins',
      '3. Encaissement immédiat à la caisse avec quittance',
      '4. Orientation vers la salle de soins avec reçu valide'
    ],
    menus: ['Factures', 'Caisse'],
    lectures: ['Tarifs', 'Prestations'],
    ecritures: ['Facture', 'Encaissement'],
    postconditions: 'Facture encaissée, ticket de caisse délivré',
    regles: ['R02', 'R04', 'R10'],
    targetView: 'caisse_facture_new_payment',
    description_courte: 'Paiement préalable de la prestation avec contrôle de session de caisse active.'
  },
  {
    id: 'S22',
    nom: 'Facturation après soins',
    acteur: 'Facturation',
    declencheur: 'Soins médicaux terminés',
    preconditions: 'Dossier existant, prestations médicales réalisées',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Récupération des actes réellement dispensés',
      '3. Génération de la facture définitive détaillée',
      '4. Encaissement du règlement du patient'
    ],
    menus: ['Factures', 'Caisse'],
    lectures: ['Actes réalisés'],
    ecritures: ['Facture', 'Encaissement'],
    postconditions: 'Facture soldée et archivée',
    regles: ['R02', 'R04', 'R10'],
    targetView: 'factures_all',
    description_courte: 'Facturation a posteriori des actes et médicaments administrés.'
  },
  {
    id: 'S23',
    nom: 'Patient avec assurance / prise en charge',
    acteur: 'Facturation',
    declencheur: 'Présentation d\'un bon de prise en charge tiers-payant',
    preconditions: 'Dossier existant, assurance renseignée',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Vérification du taux de couverture et du plafond de garantie',
      '3. Édition de la facture avec ventilation automatique',
      '4. Calcul : part patient (ticket modérateur) vs part assureur'
    ],
    menus: ['Factures', 'Administration'],
    lectures: ['Assurance', 'Conventions'],
    ecritures: ['Facture'],
    postconditions: 'Facture ventilée part patient et tiers-payant',
    regles: ['R02', 'R04'],
    targetView: 'factures_all',
    description_courte: 'Ventilation automatique de la facture selon le taux de couverture conventionné.'
  },
  {
    id: 'S24',
    nom: 'Patient avec facture en attente',
    acteur: 'Caisse',
    declencheur: 'Facture validée en attente de paiement',
    preconditions: 'Facture existante non soldée',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Consultation des factures du patient',
      '3. Sélection de la facture en attente',
      '4. Encaissement du montant restant dû'
    ],
    menus: ['Factures', 'Caisse'],
    lectures: ['Facture'],
    ecritures: ['Encaissement'],
    postconditions: 'Facture basculée à l\'état encaissée',
    regles: ['R02', 'R04', 'R10'],
    targetView: 'factures_draft',
    description_courte: 'Règlement d\'une facture émise en attente de quittance.'
  },
  {
    id: 'S25',
    nom: 'Patient avec facture encaissée',
    acteur: 'Superviseur',
    declencheur: 'Contrôle financier et vérification de la quittance',
    preconditions: 'Facture encaissée',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Visualisation dans les factures encaissées',
      '3. Contrôle de conformité de l\'encaissement et des écritures'
    ],
    menus: ['Factures', 'Superviseur'],
    lectures: ['Facture', 'Reçu'],
    ecritures: ['Aucune'],
    postconditions: 'Contrôle d\'audit certifié',
    regles: ['R02'],
    targetView: 'factures_paid',
    description_courte: 'Audit et vérification d\'une facture encaissée avec reçu conforme.'
  },
  {
    id: 'S26',
    nom: 'Patient avec facture impayée',
    acteur: 'Superviseur',
    declencheur: 'Dépassement d\'échéance ou refus de règlement',
    preconditions: 'Facture impayée',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Consultation de la créance dans les factures impayées',
      '3. Traitement : relance amiable, alerte bloquante ou dispense autorisée'
    ],
    menus: ['Factures', 'Superviseur'],
    lectures: ['Facture', 'Historique des relances'],
    ecritures: ['Facture'],
    postconditions: 'Traitement de l\'impayé consigné',
    regles: ['R02', 'R04'],
    targetView: 'factures_unpaid',
    description_courte: 'Gestion des créances en souffrance et déclenchement de l\'alerte R04.'
  },
  {
    id: 'S27',
    nom: 'Patient avec facture annulée',
    acteur: 'Superviseur',
    declencheur: 'Demande d\'annulation ou d\'avoir',
    preconditions: 'Facture existante',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Sélection de la facture à annuler',
      '3. Saisie obligatoire du motif d\'annulation dans le journal',
      '4. Bascule de la facture en état annulé et traçage'
    ],
    menus: ['Factures', 'Superviseur'],
    lectures: ['Facture'],
    ecritures: ['Facture'],
    postconditions: 'Facture annulée et tracée',
    regles: ['R02'],
    targetView: 'factures_cancelled',
    description_courte: 'Annulation contrôlée d\'une facture avec motif d\'audit obligatoire.'
  },
  {
    id: 'S28',
    nom: 'Nouvelle encaissement caisse',
    acteur: 'Caisse',
    declencheur: 'Paiement direct d\'une prestation au guichet',
    preconditions: 'Session de caisse active ouverte',
    etapes: [
      '1. Rechercher par N° dossier',
      '2. Création d\'un nouvel encaissement',
      '3. Rattachement automatique à la session de caisse du caissier',
      '4. Impression instantanée de la quittance officielle'
    ],
    menus: ['Caisse'],
    lectures: ['Facture'],
    ecritures: ['Encaissement'],
    postconditions: 'Encaissement enregistré dans la session',
    regles: ['R02', 'R10'],
    targetView: 'caisse_new_payment',
    description_courte: 'Enregistrement d\'un règlement sous session caisse active.'
  },
  {
    id: 'S29',
    nom: 'Clôture de caisse',
    acteur: 'Caisse',
    declencheur: 'Fin de vacation ou fin de journée',
    preconditions: 'Session de caisse ouverte',
    etapes: [
      '1. Identifier la session de caisse en cours',
      '2. Comptage contradictoire des encaissements par mode de règlement',
      '3. Clôture définitive et verrouillage de la session'
    ],
    menus: ['Caisse'],
    lectures: ['Encaissements'],
    ecritures: ['SessionCaisse'],
    postconditions: 'Session clôturée (R07 respectée)',
    regles: ['R07'],
    targetView: 'caisse_cloture',
    description_courte: 'Clôture solennelle de session avec arrêté des montants en caisse.'
  },
  {
    id: 'S30',
    nom: 'Contrôle des encaissements',
    acteur: 'Superviseur',
    declencheur: 'Audit financier périodique',
    preconditions: 'Encaissements existants',
    etapes: [
      '1. Accéder au menu Superviseur',
      '2. Examen des encaissements de tous les guichets',
      '3. Génération du rapport de contrôle d\'encaissement'
    ],
    menus: ['Superviseur'],
    lectures: ['Encaissements'],
    ecritures: ['Aucune'],
    postconditions: 'Rapport de contrôle généré',
    regles: ['R02'],
    targetView: 'superviseur_payments',
    description_courte: 'Surveillance croisée des encaissements de l\'ensemble des guichets.'
  },
  {
    id: 'S31',
    nom: 'Suivi des sessions',
    acteur: 'Superviseur',
    declencheur: 'Suivi de l\'activité des guichets',
    preconditions: 'Sessions de caisse enregistrées',
    etapes: [
      '1. Accéder au menu Superviseur',
      '2. Consultation de l\'état des sessions (ouvertes, en cours, fermées)',
      '3. Contrôle des horaires d\'ouverture et des soldes'
    ],
    menus: ['Superviseur'],
    lectures: ['SessionCaisse'],
    ecritures: ['Aucune'],
    postconditions: 'Suivi des sessions effectué',
    regles: ['R02'],
    targetView: 'superviseur_sessions',
    description_courte: 'Inspection globale des vacations et sessions de caisse.'
  },
  {
    id: 'S32',
    nom: 'Suivi des factures',
    acteur: 'Superviseur',
    declencheur: 'Suivi des flux de facturation',
    preconditions: 'Factures émises dans le système',
    etapes: [
      '1. Accéder au menu Superviseur',
      '2. Consultation de l\'ensemble des factures par état',
      '3. Génération des statistiques de facturation'
    ],
    menus: ['Superviseur'],
    lectures: ['Factures'],
    ecritures: ['Aucune'],
    postconditions: 'Rapport de facturation consolidé',
    regles: ['R02'],
    targetView: 'superviseur_invoices',
    description_courte: 'Vue consolidée du pipeline de facturation hospitalière.'
  },
  {
    id: 'S33',
    nom: 'Suivi des caisses',
    acteur: 'Superviseur',
    declencheur: 'Audit de sécurité des postes de caisse',
    preconditions: 'Caisses physiques et logiques paramétrées',
    etapes: [
      '1. Accéder au menu Superviseur',
      '2. Consultation des terminaux et guichets de caisse',
      '3. Vérification des anomalies ou écarts de trésorerie'
    ],
    menus: ['Superviseur'],
    lectures: ['SessionCaisse'],
    ecritures: ['Aucune'],
    postconditions: 'Contrôle des terminaux achevé',
    regles: ['R02'],
    targetView: 'superviseur_caisses',
    description_courte: 'Supervision des postes de perception et détection des écarts.'
  },
  {
    id: 'S34',
    nom: 'Rapports financiers',
    acteur: 'Superviseur',
    declencheur: 'Demande de synthèse financière',
    preconditions: 'Données comptables existantes',
    etapes: [
      '1. Accéder aux Rapports du Superviseur',
      '2. Définir la période d\'analyse',
      '3. Génération du rapport de synthèse financière'
    ],
    menus: ['Superviseur'],
    lectures: ['Factures', 'Encaissements'],
    ecritures: ['Aucune'],
    postconditions: 'Rapport financier produit',
    regles: ['R02'],
    targetView: 'superviseur_reports',
    description_courte: 'Production des bilans financiers et indicateurs de recettes.'
  },
  {
    id: 'S35',
    nom: 'Prélèvement laboratoire',
    acteur: 'Laboratoire',
    declencheur: 'Patient présent en salle de prélèvement',
    preconditions: 'Prescription validée pour analyses',
    etapes: [
      '1. Sélection du patient dans la file d\'attente',
      '2. Réalisation du prélèvement biologique (sang, urine, LCR)',
      '3. Génération du code-barres tube et bascule en examen en cours'
    ],
    menus: ['Laboratoire'],
    lectures: ['Prescription'],
    ecritures: ['Examen'],
    postconditions: 'Prélèvement effectué et tube identifié',
    regles: ['R02'],
    targetView: 'labo_sampling',
    description_courte: 'Prélèvement biologique, étiquetage du tube primaire et traçabilité.'
  },
  {
    id: 'S36',
    nom: 'Résultat laboratoire',
    acteur: 'Laboratoire',
    declencheur: 'Fin d\'analyse sur automate',
    preconditions: 'Examen en cours d\'analyse',
    etapes: [
      '1. Saisie des valeurs des paramètres mesurés',
      '2. Validation biologique par le responsable de laboratoire',
      '3. Déverrouillage pour diffusion médicale (R06)'
    ],
    menus: ['Laboratoire'],
    lectures: ['Examen'],
    ecritures: ['Résultat'],
    postconditions: 'Résultat validé prêt pour le prescripteur',
    regles: ['R02', 'R06'],
    targetView: 'labo_results',
    description_courte: 'Saisie et validation biologique des analyses de laboratoire.'
  },
  {
    id: 'S37',
    nom: 'Examen imagerie programmé',
    acteur: 'Imagerie',
    declencheur: 'Prescription d\'acte d\'imagerie médicale',
    preconditions: 'Prescription médicale active',
    etapes: [
      '1. Accueil du patient dans la file d\'attente d\'imagerie',
      '2. Vérification des conditions préparatoires (jeûne, produit)',
      '3. Réalisation de l\'examen radiologique'
    ],
    menus: ['Imagerie'],
    lectures: ['Prescription'],
    ecritures: ['Examen'],
    postconditions: 'Examen d\'imagerie réalisé',
    regles: ['R02'],
    targetView: 'imagerie_scheduled',
    description_courte: 'Acquisition radiologique (Scanner, Radio, Échographie).'
  },
  {
    id: 'S38',
    nom: 'Compte rendu imagerie',
    acteur: 'Imagerie',
    declencheur: 'Examen radiologique réalisé',
    preconditions: 'Clichés disponibles sur le visualiseur PACS',
    etapes: [
      '1. Visualisation des séries de clichés',
      '2. Rédaction du compte-rendu radiologique',
      '3. Validation et signature par le radiologue'
    ],
    menus: ['Imagerie'],
    lectures: ['Examen'],
    ecritures: ['Compte rendu'],
    postconditions: 'Compte rendu radiologique validé',
    regles: ['R02', 'R06'],
    targetView: 'imagerie_reports',
    description_courte: 'Interprétation radiologique et validation du compte-rendu d\'imagerie.'
  },
  {
    id: 'S39',
    nom: 'Prescription d\'examens',
    acteur: 'Médecin',
    declencheur: 'Nécessité diagnostique en consultation',
    preconditions: 'Consultation médicale en cours',
    etapes: [
      '1. Examen du patient par le médecin',
      '2. Sélection des bilans de biologie ou d\'imagerie',
      '3. Émission et transmission vers les plateaux techniques'
    ],
    menus: ['Médecin', 'Laboratoire', 'Imagerie'],
    lectures: ['Dossier patient'],
    ecritures: ['Prescription'],
    postconditions: 'Demandes d\'examens enregistrées',
    regles: ['R02', 'R03'],
    targetView: 'medecin_prescriptions',
    description_courte: 'Prescription d\'examens complémentaires par le praticien.'
  },
  {
    id: 'S40',
    nom: 'Admission',
    acteur: 'Hospitalisation',
    declencheur: 'Décision médicale d\'hospitalisation',
    preconditions: 'Décision clinique d\'alitement',
    etapes: [
      '1. Contrôle de la décision médicale',
      '2. Validation des formalités d\'admission',
      '3. Attribution du lit et transfert du patient'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Dossier patient'],
    ecritures: ['Hospitalisation', 'Lit'],
    postconditions: 'Patient officiellement admis dans le service',
    regles: ['R02', 'R05'],
    targetView: 'hospit_admissions',
    description_courte: 'Formalités administratives et hôtelières d\'admission en chambre.'
  },
  {
    id: 'S41',
    nom: 'Patient hospitalisé',
    acteur: 'Hospitalisation',
    declencheur: 'Suivi continu du malade alité',
    preconditions: 'Hospitalisation en cours',
    etapes: [
      '1. Surveillance clinique quotidienne',
      '2. Administration des thérapeutiques et soins',
      '3. Exécution des prescriptions médicales'
    ],
    menus: ['Hospitalisation', 'Médical'],
    lectures: ['Séjour'],
    ecritures: ['Suivi', 'Soins'],
    postconditions: 'Dossier de soins d\'hospitalisation à jour',
    regles: ['R02', 'R03'],
    targetView: 'hospit_patients',
    description_courte: 'Tenue du dossier de soins et administration des thérapeutiques.'
  },
  {
    id: 'S42',
    nom: 'Gestion des lits',
    acteur: 'Hospitalisation',
    declencheur: 'Besoin d\'affectation ou d\'optimisation de lit',
    preconditions: 'Lits recensés dans les services',
    etapes: [
      '1. Consultation de la disponibilité des lits',
      '2. Attribution du lit libre au patient',
      '3. Marquage du lit comme occupé'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Lit'],
    ecritures: ['Lit'],
    postconditions: 'Lit attribué et statut actualisé',
    regles: ['R02', 'R05'],
    targetView: 'hospit_beds',
    description_courte: 'Gestion en temps réel de la capacité litière des services.'
  },
  {
    id: 'S43',
    nom: 'Transfert',
    acteur: 'Hospitalisation',
    declencheur: 'Nécessité de transfert de lit ou de spécialité',
    preconditions: 'Hospitalisation active',
    etapes: [
      '1. Pointage du service d\'origine',
      '2. Déclenchement de la procédure de transfert',
      '3. Réception dans le nouveau service et lit cible'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Hospitalisation'],
    ecritures: ['Transfert'],
    postconditions: 'Transfert réalisé sans interruption de soins',
    regles: ['R02', 'R05'],
    targetView: 'hospit_transfers',
    description_courte: 'Mutation interne d\'un patient entre unités de soins.'
  },
  {
    id: 'S44',
    nom: 'Sortie',
    acteur: 'Hospitalisation',
    declencheur: 'Feu vert médical de sortie',
    preconditions: 'Hospitalisation en cours',
    etapes: [
      '1. Enregistrement de l\'autorisation de sortie médicale',
      '2. Formalités de sortie infirmière et hôtelière',
      '3. Remise du résumé de sortie au patient',
      '4. Établissement de la facture de séjour'
    ],
    menus: ['Hospitalisation', 'Factures'],
    lectures: ['Séjour'],
    ecritures: ['Sortie', 'Facture'],
    postconditions: 'Patient sorti, lit libéré, quittance générée',
    regles: ['R02', 'R04'],
    targetView: 'hospit_discharges',
    description_courte: 'Procédure complète de sortie d\'hospitalisation et régularisation.'
  },
  {
    id: 'S45',
    nom: 'Réadmission',
    acteur: 'Hospitalisation',
    declencheur: 'Nouvelle admission d\'un ancien hospitalisé',
    preconditions: 'Dossier existant avec séjours antérieurs',
    etapes: [
      '1. Consultation de l\'historique des séjours passés',
      '2. Création de la nouvelle admission hospitalière',
      '3. Attribution du nouveau lit'
    ],
    menus: ['Hospitalisation'],
    lectures: ['Hospitalisations passées'],
    ecritures: ['Hospitalisation'],
    postconditions: 'Patient réadmis avec historique lié',
    regles: ['R02', 'R05'],
    targetView: 'hospit_admissions',
    description_courte: 'Réadmission hospitalière avec conservation de l\'antériorité.'
  },
  {
    id: 'S46',
    nom: 'Création utilisateur',
    acteur: 'Administration',
    declencheur: 'Arrivée d\'un nouveau collaborateur hospitalier',
    preconditions: 'Droits d\'administration système',
    etapes: [
      '1. Accéder au menu Utilisateurs',
      '2. Attribution du rôle et de la spécialité',
      '3. Affectation des permissions d\'accès (R08)'
    ],
    menus: ['Administration'],
    lectures: ['Rôles'],
    ecritures: ['Utilisateur'],
    postconditions: 'Compte utilisateur créé avec profil conforme',
    regles: ['R02', 'R08'],
    targetView: 'admin_users',
    description_courte: 'Création et habilitation d\'un compte utilisateur du SIH.'
  },
  {
    id: 'S47',
    nom: 'Gestion rôles & profils',
    acteur: 'Administration',
    declencheur: 'Évolution de la politique de sécurité ou des fonctions',
    preconditions: 'Droits d\'administration système',
    etapes: [
      '1. Accéder aux Rôles & Profils',
      '2. Configuration des matrices de permissions par rôle',
      '3. Sauvegarde et application immédiate'
    ],
    menus: ['Administration'],
    lectures: ['Rôles'],
    ecritures: ['Role', 'Permission'],
    postconditions: 'Rôles et privilèges d\'accès actualisés',
    regles: ['R02', 'R08'],
    targetView: 'admin_roles',
    description_courte: 'Paramétrage des droits RBAC et des accès aux menus.'
  },
  {
    id: 'S48',
    nom: 'Paramétrage établissement',
    acteur: 'Administration',
    declencheur: 'Mise à jour des coordonnées, tarifs ou paramètres',
    preconditions: 'Droits d\'administration système',
    etapes: [
      '1. Accéder au paramétrage de l\'établissement',
      '2. Révision de la grille tarifaire des prestations',
      '3. Ajustement des constantes médicales par défaut'
    ],
    menus: ['Administration'],
    lectures: ['Établissement'],
    ecritures: ['Établissement', 'Tarif'],
    postconditions: 'Paramètres institutionnels enregistrés',
    regles: ['R02'],
    targetView: 'admin_company',
    description_courte: 'Configuration générale de l\'hôpital, des devises et des tarifs.'
  },
  {
    id: 'S49',
    nom: 'Journal & sécurité',
    acteur: 'Administration',
    declencheur: 'Audit de sécurité ou enquête de traçabilité',
    preconditions: 'Droits d\'administration système',
    etapes: [
      '1. Ouvrir le Journal d\'audit système',
      '2. Filtrer par acteur, dossier patient ou scénario',
      '3. Vérification de la conformité de traçabilité (R02)'
    ],
    menus: ['Administration'],
    lectures: ['Journal'],
    ecritures: ['Aucune'],
    postconditions: 'Rapport d\'audit et de sécurité certifié',
    regles: ['R02'],
    targetView: 'admin_audit',
    description_courte: 'Consultation du journal d\'audit médico-légal et financier.'
  },
  {
    id: 'S50',
    nom: 'Rapports administratifs',
    acteur: 'Administration',
    declencheur: 'Demande de statistiques d\'activité hospitalière',
    preconditions: 'Données opérationnelles existantes',
    etapes: [
      '1. Accéder aux Rapports administratifs',
      '2. Sélection des indicateurs (fréquentation, lits, actes)',
      '3. Exportation et archivage du rapport officiel'
    ],
    menus: ['Administration'],
    lectures: ['Données'],
    ecritures: ['Aucune'],
    postconditions: 'Rapport d\'activité officiel exporté',
    regles: ['R02'],
    targetView: 'admin_reports',
    description_courte: 'Édition des rapports de performance et indicateurs d\'activité hospitalière.'
  }
];
