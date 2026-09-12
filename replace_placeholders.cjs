const fs = require('fs');
const path = require('path');

const replacements = [
  // LoginView
  { file: 'src/components/LoginView.tsx', from: 'placeholder="ex: admin, caisse..."', to: 'placeholder="Identifiant ou email"' },

  // InvoicesView
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: KOUASSI"', to: 'placeholder="Nom de famille"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Jean-Claude"', to: 'placeholder="Prénoms"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: GBAHOU (le cas échéant)"', to: 'placeholder="Nom de jeune fille"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Bouaké"', to: 'placeholder="Ville"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Enseignant"', to: 'placeholder="Profession"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Ivoirienne"', to: 'placeholder="Nationalité"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Chrétien / Musulman"', to: 'placeholder="Religion"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: C01020304..."', to: 'placeholder="Numéro de pièce"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: +225 05..."', to: 'placeholder="Téléphone"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: +225 27..."', to: 'placeholder="Téléphone fixe"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Gbêkê / Lagunes"', to: 'placeholder="Région"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Vallée du Bandama"', to: 'placeholder="Province / État"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Nimbo, Quartier Commerce..."', to: 'placeholder="Quartier"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: KOUASSI Marc"', to: 'placeholder="Nom et prénoms"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Père, Époux, Oncle, Frère..."', to: 'placeholder="Lien de parenté"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: +225 01 02 03..."', to: 'placeholder="Téléphone"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: NDM-2026-0042"', to: 'placeholder="N° de dossier"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: +225 07 08 09 10 11"', to: 'placeholder="Téléphone"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: Dr. Kouamé"', to: 'placeholder="Nom du médecin"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: ORD-2026"', to: 'placeholder="N° ordonnance"' },
  { file: 'src/components/InvoicesView.tsx', from: 'placeholder="ex: POL-882901-CI"', to: 'placeholder="N° police"' },

  // PartnersView
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: CONV-AXA-2026"', to: 'placeholder="N° convention"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: 38"', to: 'placeholder="Âge"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: Dr. Kouamé"', to: 'placeholder="Médecin traitant"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: ASC-884920"', to: 'placeholder="N° assuré"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: +225 07 00 00 00"', to: 'placeholder="Téléphone"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: contact@exemple.ci"', to: 'placeholder="Email"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: Cocody Deux Plateaux"', to: 'placeholder="Quartier"' },
  { file: 'src/components/PartnersView.tsx', from: 'placeholder="ex: Abidjan"', to: 'placeholder="Ville"' },

  // ProductsView
  { file: 'src/components/ProductsView.tsx', from: 'placeholder="ex: NFS - Hémogramme complet ou Consultation Généraliste"', to: 'placeholder="Désignation de la prestation"' },
  { file: 'src/components/ProductsView.tsx', from: 'placeholder="ex: Cotation / NFS-01"', to: 'placeholder="Code ou Référence"' },
  { file: 'src/components/ProductsView.tsx', from: 'placeholder="ex: Homme: 13-17 g/dL, Femme: 12-15 g/dL"', to: 'placeholder="Valeurs de référence"' },
  { file: 'src/components/ProductsView.tsx', from: 'placeholder="ex: 2 heures, 24 heures"', to: 'placeholder="Délai de rendu"' },
  { file: 'src/components/ProductsView.tsx', from: 'placeholder="ex: Utilisé pour le dépistage de l\'anémie, l\'infection et l\'inflammation générale..."', to: 'placeholder="Description"' },
  { file: 'src/components/ProductsView.tsx', from: 'placeholder="ex: NFS / Hémogramme\\nGlycémie à jeun\\nUrée + Créatinine\\nCholestérol Total"', to: 'placeholder="Liste des examens inclus"' },

  // CompanySettingsView
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: LABORATOIRE D\'ANALYSES MÉDICALES TOURE"', to: 'placeholder="Nom de l\'entreprise"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Biologie Médicale &amp; Diagnostics Spécialisés"', to: 'placeholder="Slogan de l\'entreprise"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: DOCUMENT CONFIDENTIEL ET OFFICIEL"', to: 'placeholder="Texte en filigrane"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Plateau Medical Center, Bd Hassan II"', to: 'placeholder="Adresse complète"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Abidjan, Côte d\'Ivoire"', to: 'placeholder="Ville, Pays"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: +225 27 20 22 33 44"', to: 'placeholder="Numéro de téléphone"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: contact@laboratoire-biologie.ci"', to: 'placeholder="Adresse email"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: CI-ABJ-2024-B-12940"', to: 'placeholder="Numéro RCCM"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: CI 01928374 A"', to: 'placeholder="Numéro CC"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: AGR-MSHP-2024-0098 (Agrément d\'Exploitation Laboratoire de Biologie)"', to: 'placeholder="Agrément Ministériel"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Société Générale Côte d\'Ivoire (SGCI)"', to: 'placeholder="Nom de la banque"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: SGCIX01"', to: 'placeholder="Code guichet"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: CI93 0100 2000 3000 4000 50"', to: 'placeholder="RIB / Numéro de compte"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Wave / Orange / Moov : +225 07 08 09 10 11"', to: 'placeholder="Comptes Mobile Money"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Exonération légale de TVA sur les prestations de biologie médicale (Art. 355 du Code Général des Impôts)."', to: 'placeholder="Mentions légales de facturation"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Dr. Aboubacar TOURÉ - Biologiste Médical"', to: 'placeholder="Directeur / Responsable"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: 2 heures à 24 heures selon la spécialité"', to: 'placeholder="Délai de rendu par défaut"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: CHU-, NDM-, DOS-"', to: 'placeholder="Préfixe des dossiers"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Wave Mobile Money, Djamo, KPay, etc."', to: 'placeholder="Nom du moyen de paiement"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: 📱, 💳, 💵, 🏦"', to: 'placeholder="Icône (ex: emoji)"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: WAVE-CI-9018"', to: 'placeholder="Identifiant marchand"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Scannez le QR Code ou entrez votre code secret"', to: 'placeholder="Instructions"' },
  { file: 'src/components/CompanySettingsView.tsx', from: 'placeholder="ex: Ouverture du nouveau pôle de Biologie Moléculaire"', to: 'placeholder="Titre de la notification"' },

  // LabResultsView
  { file: 'src/components/LabResultsView.tsx', from: 'placeholder="ex: 1.05"', to: 'placeholder="Valeur du résultat"' },
  { file: 'src/components/LabResultsView.tsx', from: 'placeholder="ex: Profil glycémique et lipidique satisfaisant. Absence d\'anomalie hématologique significative."', to: 'placeholder="Conclusion médicale et interprétation"' },
  { file: 'src/components/LabResultsView.tsx', from: 'placeholder="ex: Bilan Lipidique Complet, NFS + CRP"', to: 'placeholder="Rechercher une analyse..."' },
  { file: 'src/components/LabResultsView.tsx', from: 'placeholder="ex: Dr. Kouamé (Polyclinique Sainte-Anne)"', to: 'placeholder="Nom du prescripteur"' },

  // UsersView
  { file: 'src/components/UsersView.tsx', from: 'placeholder="ex: Dr. Aminata Touré"', to: 'placeholder="Nom et prénoms"' },
  { file: 'src/components/UsersView.tsx', from: 'placeholder="ex: dr.toure"', to: 'placeholder="Identifiant"' },
  { file: 'src/components/UsersView.tsx', from: 'placeholder="ex: Biologiste Médical / Chef Labo"', to: 'placeholder="Fonction"' },
  { file: 'src/components/UsersView.tsx', from: 'placeholder="ex: Laboratoire Médical / Caisse"', to: 'placeholder="Département"' },
  { file: 'src/components/UsersView.tsx', from: 'placeholder="ex: biologiste@laboratoire.pro"', to: 'placeholder="Adresse email"' },
  { file: 'src/components/UsersView.tsx', from: 'placeholder="ex: Biologiste Responsable"', to: 'placeholder="Nom du groupe"' }
];

replacements.forEach(({ file, from, to }) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
    fs.writeFileSync(file, content, 'utf8');
  }
});
