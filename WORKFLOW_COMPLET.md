# 🧭 Cartographie Complète des Parcours Patients & Workflows de la Plateforme

Ce document présente les flux opérationnels de l'établissement, de l'admission d'un patient à sa sortie définitive, en passant par tous les scénarios cliniques, financiers et techniques possibles.

---

## 📊 1. Diagramme de Flux de Processus Global (A à Z)

Le schéma ci-dessous montre comment les différents pôles (Admission, Consultation, Facturation, Plateau Technique, Pharmacie) interagissent en fonction des choix et de la situation financière du patient (Assurance vs Tiers-Payant).

```mermaid
flowchart TD
    %% 1. ENTRÉE & ADMISSION
    Start([Arrivée du Patient]) --> A[1. Admission & Inscription]
    A --> A1{Type de Patient ?}
    
    A1 -- Patient Externe (Soin Seul) --> S_Inf[Cabinet Infirmier / Actes Directs]
    A1 -- Consultation Médicale --> A2[Génération Facture d'Admission]
    
    A2 --> A3{Prise en Charge / Assurance ?}
    A3 -- Oui (ex: Couverture 80%) --> A4[Calcul du Ticket Modérateur - Patient paye 20%]
    A3 -- Non (100% Patient) --> A5[Calcul Plein Tarif - Patient paye 10 000 FCFA]
    
    A4 --> A6[Encaissement de l'Admission & Impression Reçu]
    A5 --> A6
    A6 --> B[Dossier Placé en File d'Attente Médicale]

    %% 2. CONSULTATION CLINIQUE
    B --> C[2. Cabinet Médical & Consultation]
    C --> C1[Prise des Constantes Vitaux (TA, Temp., Glycémie...)]
    C1 --> C2[Examen Clinique & Anamnèse par le Médecin]
    C2 --> C3[Diagnostic Principal & Encodage CIM-10]
    C3 --> C4[Saisie de la Prescription : Examens, Imageries, Médicaments]
    C4 --> C5[Validation du Dossier Médical Électronique (DME)]
    C5 --> D[Dossier Transféré au Bureau d'Arbitrage & Facturation]

    %% 3. ARBITRAGE & FACTURATION GLOBALE
    D --> E[3. Arbitrage du Panier de Soins]
    E --> E1[Le Patient choisit les prestations qu'il souhaite effectuer ce jour]
    E1 --> E2{Arbitrage des Lignes ?}
    E2 -- "Faire (Confirmé)" --> E3[Ligne incluse dans la facture de soins]
    E2 -- "Différer (Postponed)" --> E4[Ligne conservée dans le dossier pour plus tard]
    E2 -- "Annuler (Cancelled)" --> E5[Ligne archivée et retirée]
    
    E3 --> F[Génération de la Facture Globale Cumulée]
    F --> F1{Calcul de la Couverture Assurance}
    F1 --> F2[Génération de la part Tiers-Payant pour l'Assureur]
    F1 --> F3[Calcul du Net à Payer par le Patient]
    F3 --> F4[Paiement en Caisse (Espèces/Mobile) & Édition du Reçu Fiscalisé]
    F4 --> G{Quelles prestations ont été payées ?}

    %% 4. PLATEAUX TECHNIQUES & PHARMACIE
    G -- "Analyses Biologiques" --> H_Lab[4a. Plateau Biologie / Laboratoire]
    G -- "Radiographie / Échographie" --> H_Rad[4b. Plateau Radiologie & Imagerie]
    G -- "Médicaments Réglés" --> H_Phar[4c. Pharmacie / Dispensaire]

    %% LABORATOIRE
    H_Lab --> L1[Prélèvement Sanguin / Échantillonnage]
    L1 --> L2[Génération de Code-Barres Unique pour le Tube]
    L2 --> L3[Analyses sur Automates de Laboratoire]
    L3 --> L4[Validation Biologiste & Saisie des Résultats]
    L4 --> L5[Résultats synchronisés automatiquement sur le DME du patient]
    L5 --> End_Check

    %% RADIOLOGIE
    H_Rad --> R1[Réalisation du Cliché / Examen Technique]
    R1 --> R2[Rdaction du Compte-rendu d'Imagerie]
    R2 --> R3[Rapport et images liés au DME du patient]
    R3 --> End_Check

    %% PHARMACIE
    H_Phar --> P1[Préparation et Contrôle de l'Ordonnance]
    P1 --> P2[Mise à jour en temps réel des Stocks de Médicaments]
    P2 --> P3[Remise en main propre avec conseils de posologie]
    P3 --> End_Check

    %% CABINET INFIRMIER (Bypass)
    S_Inf --> I1[Assistant de Soin Guidé]
    I1 --> I2[Double Contrôle de Sécurité Infirmière : Patient, Produit, Dose, Voie]
    I2 --> I3[Exécution du soin (Pansement, Injection, Perfusion...)]
    I3 --> I4[Enregistrement de l'heure et du soignant sur le Registre des Soins]
    I4 --> End_Check

    %% 5. CLÔTURE DU DOSSIER
    End_Check{Toutes les étapes validées ?}
    End_Check -- Oui --> Exit[Dossier Médical Archivé (Clôturé)]
    End_Check -- Non --> Return_Clinic[Dossier en attente de validation résiduelle]
    Exit --> End([Parcours Terminé])
```

---

## 📋 2. Les 4 Grands Scénarios de Parcours Patients (De A à Z)

### Scénario 1 : Le Parcours Clinique Standard Payant (100% à la charge du patient)
1. **Entrée à l'Accueil / Caisse :**
   * L'agent d'admission recherche ou crée la fiche d'identité du patient.
   * Génération de la facture d'admission pour la consultation générale (Tarif : **10 000 FCFA**).
   * Le patient règle la somme en espèces ou par paiement mobile.
   * L'impression du reçu valide automatiquement son statut et le place en **salle d'attente médicale**.
2. **Consultation Médicale :**
   * L'infirmier ou le médecin prend les constantes vitales (Température, Tension Arterielle, Glycémie, Pouls) qui sont sauvées sur le Dossier Médical Électronique (DME).
   * Le médecin procède à l'examen clinique, saisit le motif et formule un diagnostic encodé selon la nomenclature internationale **CIM-10**.
   * Le médecin prescrit des examens biologiques (NFS, Paludisme TDR), des examens d'imagerie (Radiographie Pulmonaire) et des médicaments (Paracétamol, CTA Coartem).
   * Le médecin valide la consultation, ce qui envoie l'ordonnance et les demandes de bilans au service de facturation.
3. **Arbitrage et Caisse Soins :**
   * Le patient se présente au guichet d'arbitrage. N'ayant pas d'assurance, il consulte les prix de chaque ligne.
   * Il décide de **confirmer** l'ensemble des examens et médicaments.
   * Le système génère une facture globale cumulée pour les actes et les médicaments.
   * Le patient effectue le paiement complet de sa facture de soins.
4. **Exécution Technique & Délivrance :**
   * Le patient se rend au laboratoire : le biologiste effectue les prélèvements et renvoie les résultats normaux ou anormaux sur le DME.
   * Le patient se rend à la pharmacie : le pharmacien prépare les médicaments, décompte le stock et lui remet les boîtes.
   * Le dossier du jour est clos et archivé automatiquement.

---

### Scénario 2 : Le Parcours Tiers-Payant / Assuré (ex: Prise en charge à 80%)
1. **Admission avec Couverture :**
   * L'agent d'admission sélectionne la compagnie d'assurance du patient (ex : MUGEF-CI, GNA, etc.) et saisit le taux de couverture contractuel (ex : **80%**).
   * Le système calcule automatiquement la part de l'assurance (**8 000 FCFA**) et le **Ticket Modérateur** restant à la charge du patient (**2 000 FCFA**).
   * Le patient règle uniquement son ticket modérateur de **2 000 FCFA** en caisse. Son dossier est immédiatement envoyé en salle de consultation.
2. **Consultation & Prescription :**
   * Le médecin effectue la consultation normalement, sans se soucier de l'aspect financier.
   * Il prescrit les examens et traitements nécessaires sur l'interface clinique.
3. **Arbitrage Assuré :**
   * Au niveau du panier de soins, le système applique directement le taux d'assurance de 80% sur toutes les prestations prescrites.
   * Si une prescription de **30 000 FCFA** est validée par le patient, l'assurance prend en charge **24 000 FCFA** et le patient règle seulement **6 000 FCFA** à la caisse.
   * Les écritures comptables séparent la créance de l'assurance (qui sera facturée périodiquement à la compagnie) et l'encaissement direct du patient.
4. **Réalisation des Actes :**
   * Les laboratoires, radiologues et pharmaciens exécutent les prestations après validation automatique du paiement du ticket modérateur en caisse.

---

### Scénario 3 : Le Parcours Rapide / Externe (Cabinet Infirmier)
*Certains patients se présentent à la clinique uniquement pour des actes infirmiers isolés (injections quotidiennes, pansements réguliers, perfusions sur ordonnance externe ou prises de constantes).*
1. **Prise en Charge Directe :**
   * L'infirmier ouvre le **Cahier Numérique de Soins Infirmiers**.
   * Il sélectionne l'option **Patient Externe (Saisie Libre)** ou choisit un patient de la file d'attente.
2. **Saisie Simplifiée & Raccourcis :**
   * L'infirmier utilise la **Palette de Saisie Express** (boutons géants tactiles avec icônes) pour charger instantanément le soin en cours de réalisation (ex: "Injection IM Ceftriaxone", "Pansement Stérile").
3. **Double-Contrôle de Sécurité (Sécurité Patient) :**
   * Avant de valider, l'interface affiche une checklist de sécurité médico-infirmière obligatoire (Bracelet patient validé, Produit contrôlé, Dose exacte vérifiée, Voie d'administration correcte).
   * Dès que les 4 cases sont cochées, l'infirmier sélectionne le statut final :
     * **Administré** : Pour un acte achevé immédiatement (injection, pansement).
     * **En cours** : Pour une perfusion nécessitant une surveillance active (le statut clignote en bleu sur le tableau).
     * **Planifié** : Pour un soin programmé plus tard dans la journée.
4. **Enregistrement Automatique :**
   * L'acte est tracé avec l'heure exacte et l'identité de l'infirmier responsable dans le registre quotidien.

---

### Scénario 4 : Parcours Direct de Laboratoire ou Imagerie (Sans Consultation)
*Un patient se présente avec une ordonnance d'un médecin externe uniquement pour des analyses biologiques ou une radiographie.*
1. **Inscription Administrative :**
   * L'accueil l'inscrit en tant que patient externe "Plateau Technique Direct".
2. **Saisie des Actes et Encaissement :**
   * L'agent saisit directement les codes des examens demandés dans la caisse de soins.
   * Le patient paye les frais de laboratoire ou de radio (avec ou sans assurance).
3. **Exécution Immédiate :**
   * Le paiement validé génère instantanément un ordre d'examen sur la console du biologiste ou du radiologue.
   * Le biologiste procède au prélèvement et à l'analyse ; le radiologue prend le cliché et rédige son compte-rendu.
   * Les résultats sont imprimés ou transmis numériquement au patient pour son médecin traitant externe.

---

## ⚙️ 3. Matrice des Rôles & Responsabilités par Pôle

| Pôle Opérationnel | Rôle Principal | Tâches Majeures de A à Z |
| :--- | :--- | :--- |
| **Accueil & Admission** | Enregistrement & Triage | Saisie d'identité, calcul de la couverture d'assurance, encaissement du droit d'entrée, impression du reçu de caisse. |
| **Cabinet Médical (Médecin)** | Diagnostic & Prescription | Prise de constantes, auscultation, codage CIM-10 des pathologies, rédaction électronique des ordonnances. |
| **Caisse & Facturation** | Arbitrage & Encaissement | Validation conjointe avec le patient des soins à réaliser, encaissement, ventilation comptable (part patient vs part assurance). |
| **Laboratoire & Radiographie** | Examens Techniques | Prélèvements sanguins (échantillonnage codé par code-barres), analyses biologiques automatisées, imagerie médicale et rédaction de rapports. |
| **Pharmacie / Dispensaire** | Distribution de Médicaments | Contrôle des délivrances de l'ordonnance payée, décompte automatique des stocks en temps réel. |
| **Cabinet de Soins (Infirmier)** | Soins Quotidiens & Suivi | Exécution des pansements, injections, perfusions avec double-contrôle de sécurité médico-légal. |

---

## 🔒 4. Sécurité & Conformité Clinique Intégrée

Pour protéger l'établissement et garantir des soins optimaux, deux barrières de sécurité majeures sont actives sur la plateforme :
1. **La traçabilité absolue des médicaments** : Toute délivrance de pharmacie décomptée doit correspondre à une facture payée, elle-même adossée à une ordonnance signée par un médecin enregistré.
2. **Le double-contrôle infirmier des "4 R"** : L'administration de toute substance active (notamment antibiotiques et antalgiques injectables) requiert la validation active des contrôles d'identité, de produit, de dosage, et de voie d'administration par le soignant sur l'application.
