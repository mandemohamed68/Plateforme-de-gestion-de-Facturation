# 🏥 Guide Officiel : Déploiement Production Windows depuis Git & Sauvegarde

Ce document fournit le protocole complet pour **préparer la sauvegarde Git**, **déployer la plateforme médicale & LIMS sur un poste ou serveur Windows**, et **mettre l'application en mode production robuste**.

---

## 📑 Sommaire
1. [Partie 1 : Préparation & Sauvegarde sur Git](#partie-1--préparation--sauvegarde-sur-git)
2. [Partie 2 : Déploiement sur Windows depuis Git](#partie-2--déploiement-sur-windows-depuis-git)
3. [Partie 3 : Configuration en Mode Production Windows](#partie-3--configuration-en-mode-production-windows)
4. [Partie 4 : Configuration Réseau Local (LAN) pour Caisses & Laboratoire](#partie-4--configuration-réseau-local-lan)
5. [Partie 5 : Mises à Jour & Sauvegardes Quotidiennes](#partie-5--mises-à-jour--sauvegardes-quotidiennes)
6. [Partie 6 : Propositions & Recommandations Stratégiques](#partie-6--propositions--recommandations-stratégiques)

---

## 📦 Partie 1 : Préparation & Sauvegarde sur Git

### 1.1 Vérification de la configuration d'exclusion (`.gitignore`)
Le projet exclut déjà les fichiers lourds, les builds temporaires et les secrets :
- `node_modules/`
- `dist/`
- `build/`
- `.env` (seul `.env.example` est versionné)
- `*.log`

### 1.2 Initialiser le dépôt local et créer le premier commit
Dans le terminal à la racine du projet :
```bash
# 1. Initialiser git si ce n'est pas déjà fait
git init

# 2. Configurer votre identité Git
git config user.name "Votre Nom ou Laboratoire"
git config user.email "votre-email@domaine.com"

# 3. Ajouter tous les fichiers du projet
git add .

# 4. Enregistrer la version de production
git commit -m "feat: version de production harmonisee LIMS & facturation medicale"

# 5. Définir la branche principale
git branch -M main
```

### 1.3 Lier votre dépôt distant (GitHub, GitLab ou serveur Git interne)
Créez un dépôt privé sur **GitHub** ou **GitLab** (ex: `lims-facturation-pro`), puis exécutez :
```bash
# Remplacer avec l'URL de votre dépôt :
git remote add origin https://github.com/VOTRE_COMPTE/lims-facturation-pro.git

# Envoyer votre code sur le serveur distant :
git push -u origin main
```

---

## 🪟 Partie 2 : Déploiement sur Windows depuis Git

### 2.1 Prérequis sur la machine Windows
Installez sur le serveur Windows (Windows 10, 11 ou Windows Server) :
1. **Node.js LTS (v20 ou v22)** :
   - Téléchargement : [https://nodejs.org/](https://nodejs.org/)
   - Cochez la case pour ajouter Node.js au `PATH`.
2. **Git pour Windows** :
   - Téléchargement : [https://git-scm.com/download/win](https://git-scm.com/download/win)

### 2.2 Cloner le projet sur Windows
Ouvrez l'**Invite de commandes (cmd)** ou **PowerShell** en mode Administrateur :
```cmd
:: Se placer dans le répertoire d'installation (ex: C:\apps)
mkdir C:\apps
cd C:\apps

:: Cloner votre projet depuis Git
git clone https://github.com/VOTRE_COMPTE/lims-facturation-pro.git
cd lims-facturation-pro
```

### 2.3 Installer les dépendances & Compiler
```cmd
:: 1. Installation de toutes les bibliothèques
npm install

:: 2. Compilation optimisée pour la production (Vite + esbuild pour server.cjs)
npm run build
```

---

## ⚙️ Partie 3 : Configuration en Mode Production Windows

### Option A : Lancement Express via le script fourni (Le plus simple)
Double-cliquez simplement sur le fichier :
```text
C:\apps\lims-facturation-pro\start-windows.bat
```
Ce script vérifie Node.js, s'assure que la compilation `dist\server.cjs` existe, applique `NODE_ENV=production` et démarre le serveur sur le port `3000`.

---

### Option B : Service Windows Permanent avec PM2 (Recommandé pour un serveur de clinique)
Pour que l'application démarre automatiquement au démarrage du PC sans qu'aucune session utilisateur ne doive rester ouverte :

```cmd
:: 1. Installer PM2 globalement
npm install -g pm2

:: 2. Installer le gestionnaire de service Windows pour PM2
npm install -g pm2-windows-startup
pm2-startup install

:: 3. Démarrer l'application avec le fichier de configuration production
pm2 start ecosystem.config.cjs

:: 4. Enregistrer la liste des processus pour redémarrage automatique
pm2 save
```

#### Commandes de contrôle PM2 utiles sous Windows :
- `pm2 status` : Voir l'état du serveur et sa consommation mémoire.
- `pm2 logs` : Consulter les logs en temps réel (requêtes caisse, imports automates).
- `pm2 restart hopital-facturation` : Redémarrer l'application après une mise à jour.

---

## 🌐 Partie 4 : Configuration Réseau Local (LAN) pour Caisses & Laboratoire

Pour que tous les ordinateurs (Caisse 1, Caisse 2, Accueil, Salle de Prélèvement, Paillasse d'Analyses) accèdent à la plateforme :

### 4.1 Trouver l'adresse IP locale du serveur Windows
Dans l'Invite de commandes du serveur :
```cmd
ipconfig
```
Repérez la ligne `Adresse IPv4` (ex: `192.168.1.50`).

### 4.2 Autoriser le port 3000 dans le Pare-feu Windows
Ouvrez **PowerShell en Administrateur** et exécutez la commande suivante :
```powershell
New-NetFirewallRule -DisplayName "LIMS Facturation Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 4.3 Accès depuis les postes clients
Depuis le navigateur web (Chrome, Edge) de n'importe quel ordinateur ou tablette du réseau :
```text
http://192.168.1.50:3000
```
*(Créez un raccourci sur le bureau de chaque poste pour un accès en un clic).*

---

## 🔄 Partie 5 : Mises à Jour & Sauvegardes Quotidiennes

### 5.1 Sauvegarder des modifications de code sur Git
Dès que vous effectuez des ajustements ou configurations :
```cmd
git status
git add .
git commit -m "Mise a jour des reglages de laboratoire et caisse"
git push origin main
```

### 5.2 Mettre à jour le serveur Windows avec les dernières modifications Git
Sur la machine de production :
```cmd
cd C:\apps\lims-facturation-pro
git pull origin main
npm run build
pm2 restart hopital-facturation
```

---

## 💡 Partie 6 : Propositions & Recommandations Stratégiques

### 1. Sauvegarde Quotidienne Automatique des Données
- **Recommandation** : Mettre en place une tâche planifiée Windows (Planificateur de tâches) qui exporte quotidiennement la base de données SQLite/MariaDB vers un disque externe ou un cloud sécurisé (Google Drive, OneDrive ou NAS local) tous les soirs à 23h00.
- **Règle 3-2-1** : 3 copies des données de santé, sur 2 supports différents, dont 1 hors-site.

### 2. Onduleur (UPS) pour le serveur principal
- Un arrêt brutal dû à une coupure de courant pendant l'écriture d'une facture ou l'importation de résultats d'automates peut corrompre les fichiers. Un onduleur avec câble USB d'arrêt propre est indispensable.

### 3. Matériel recommandé pour l'impression de codes-barres
- **Imprimantes thermiques recommandées** : Zebra ZD220 / ZD420, TSC TE200 ou Xprinter 58mm/80mm.
- **Étiquettes recommandées** : Format 50mm × 30mm ou 40mm × 25mm résistant aux solvants et à la centrifugation.

### 4. Connexion Directe des Automates d'Analyses
- Les automates (Sysmex, Roche Cobas, Mindray, bioMérieux VIDAS) communiquent en protocole **HL7 v2.x** ou **ASTM 1394-97** via câble série RS-232 ou réseau TCP/IP local.
- L'architecture de la plateforme intègre les connecteurs prêts à recevoir les trames SID et résultats sans saisie manuelle.
