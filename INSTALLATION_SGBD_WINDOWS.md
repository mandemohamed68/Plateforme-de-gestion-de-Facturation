# 🗄️ Guide Complet : Installation & Configuration d'un Vrai SGBD (MariaDB / MySQL) sous Windows de A à Z

Ce guide détaille **l'intégralité de la procédure** pour installer, configurer, sécuriser et exploiter un **vrai Système de Gestion de Base de Données Relationnelle (MariaDB ou MySQL)** sous Windows pour votre clinique et laboratoire.

---

## 📑 Sommaire
1. [Étape 1 : Choisir la méthode d'installation](#étape-1--choisir-la-méthode-dinstallation)
2. [Étape 2 : Méthode Recommandée - Installation Native MariaDB sous Windows](#étape-2--méthode-recommandée---installation-native-mariadb-sous-windows)
3. [Étape 3 : Création de la Base & Importation des Données](#étape-3--création-de-la-base--importation-des-données)
4. [Étape 4 : Alternative Légère - WampServer ou XAMPP (avec Interface Graphique phpMyAdmin)](#étape-4--alternative-légère---wampserver-ou-xampp)
5. [Étape 5 : Lier la Plateforme Web au SGBD](#étape-5--lier-la-plateforme-web-au-sgbd)
6. [Étape 6 : Automatisation des Sauvegardes Quotidiennes](#étape-6--automatisation-des-sauvegardes-quotidiennes)
7. [Étape 7 : Ouverture Réseau pour Caisses et Laboratoire](#étape-7--ouverture-réseau-pour-caisses-et-laboratoire)

---

## 🎯 Étape 1 : Choisir la méthode d'installation

Vous avez **2 excellentes options** sous Windows :
- **Option A (Recommandée pour un serveur pro)** : Installer le service natif **MariaDB Community Server**. C'est léger, robuste et s'exécute en tâche de fond Windows permanente.
- **Option B (Le plus convivial avec interface web)** : Installer **XAMPP** ou **WampServer**, qui intègre MariaDB/MySQL avec l'interface graphique **phpMyAdmin** pour administrer facilement vos tables et vos requêtes depuis un navigateur.

---

## 🛠️ Étape 2 : Méthode Recommandée - Installation Native MariaDB sous Windows

### 2.1 Télécharger MariaDB
1. Rendez-vous sur le site officiel : [https://mariadb.org/download/](https://mariadb.org/download/)
2. Choisissez la version **10.11 LTS** ou **11.4 LTS** pour Windows (fichier `.msi` 64-bit).
3. Lancez l'installateur téléchargé (ex: `mariadb-10.11.x-winx64.msi`).

### 2.2 Déroulement de l'installation pas-à-pas
1. Cliquez sur **Next**, puis acceptez la licence.
2. Laissez les composants par défaut cochés (Server, Client programs).
3. **Définition du mot de passe Administrateur (`root`)** :
   - Cochez **Modify password for database user 'root'**.
   - Entrez un mot de passe sécurisé (ex: `SecretPassword2026!`).
   - Cochez **Enable access from remote machines for 'root' user** si vous voulez administrer la base depuis un autre PC du réseau local.
   - Cochez **Use UTF8 as default server's character set** (impératif pour les accents médicaux).
4. **Paramètres du service Windows** :
   - Service Name : `MariaDB` (ou `MySQL`).
   - Cochez **Install as service** et **Enable auto-start** (ainsi la base démarre automatiquement chaque fois que le PC Windows s'allume).
   - Port TCP : `3306`.
5. Cliquez sur **Install** puis **Finish**.

### 2.3 Ajouter MariaDB dans les variables d'environnement Windows (PATH)
Pour pouvoir lancer les commandes `mysql` et `mysqldump` depuis n'importe où :
1. Dans le menu Démarrer de Windows, tapez `Variables d'environnement` et appuyez sur Entrée.
2. Cliquez sur **Variables d'environnement...**.
3. Dans la section *Variables système*, sélectionnez `Path` et cliquez sur **Modifier**.
4. Cliquez sur **Nouveau** et collez le chemin du dossier `bin` de MariaDB (généralement `C:\Program Files\MariaDB 10.11\bin`).
5. Validez par **OK** sur toutes les fenêtres.

---

## 📥 Étape 3 : Création de la Base & Importation des Données

Le projet contient déjà le script SQL complet avec toutes les tables (patients, tarifs, caisses, automates, analyses, utilisateurs) :
`database/init_mariadb.sql`.

### Méthode A : Avec le script automatique fourni (1 clic)
Dans le dossier du projet sur Windows, double-cliquez sur :
```text
setup-mariadb-windows.bat
```
Entrez l'utilisateur (`root`) et votre mot de passe lorsque la console vous le demande. Le script crée la base `facturation_labo_db` et injecte toutes les tables et données de démonstration.

### Méthode B : En ligne de commande manuelle
Ouvrez l'Invite de commandes (`cmd`) :
```cmd
cd C:\apps\lims-facturation-pro
mysql -u root -p < database\init_mariadb.sql
```
Tapez le mot de passe défini à l'étape 2.2.

### 2.4 Vérifier que tout est en place
Connectez-vous à la console MariaDB :
```cmd
mysql -u root -p
```
Exécutez :
```sql
SHOW DATABASES;
USE facturation_labo_db;
SHOW TABLES;
SELECT COUNT(*) FROM res_partner;
SELECT COUNT(*) FROM product_template;
EXIT;
```
Vous devriez voir toutes vos tables créées avec succès (`account_move`, `lab_exam_order`, `till_session`, etc.).

---

## 🌐 Étape 4 : Alternative Légère - WampServer ou XAMPP

Si vous préférez une interface visuelle :
1. Téléchargez et installez **XAMPP** : [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Lancez le **XAMPP Control Panel**.
3. Cliquez sur le bouton **Start** en face de **MySQL** (le voyant devient vert).
4. Ouvrez votre navigateur sur : [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
5. Cliquez sur l'onglet **Importer**, sélectionnez le fichier `database/init_mariadb.sql` du projet, puis cliquez sur **Exécuter**.

---

## 🔗 Étape 5 : Lier la Plateforme Web au SGBD

Créez ou modifiez le fichier `.env` à la racine de votre application (`C:\apps\lims-facturation-pro\.env`) :

```env
NODE_ENV=production
PORT=3000

# Paramètres de connexion au SGBD
DB_TYPE=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=facturation_labo_db
DB_USER=root
DB_PASSWORD=SecretPassword2026!
```

---

## 💾 Étape 6 : Automatisation des Sauvegardes Quotidiennes

Une base de données médicale doit être sauvegardée chaque jour sans dépendre d'une action manuelle.

### 6.1 Script de sauvegarde inclus
Le script `backup-mariadb-windows.bat` fourni dans le projet génère un export SQL complet horodaté dans `C:\Sauvegardes_LIMS\`.

### 6.2 Planifier la sauvegarde automatique tous les soirs à 23h00 :
1. Ouvrez le menu Démarrer, tapez **Planificateur de tâches** et ouvrez-le.
2. Dans le menu de droite, cliquez sur **Créer une tâche de base...**.
3. Nom : `Sauvegarde Quotidienne LIMS`.
4. Déclencheur : **Tous les jours** à `23:00:00`.
5. Action : **Démarrer un programme**.
6. Programme/script : Parcourir et sélectionner `C:\apps\lims-facturation-pro\backup-mariadb-windows.bat`.
7. Terminer.
Vos données seront désormais sauvegardées chaque soir dans `C:\Sauvegardes_LIMS\backup_facturation_labo_AAAA-MM-JJ.sql`.

---

## 🛡️ Étape 7 : Emplacement physique des fichiers de la base sur Windows

Pour information, voici où Windows stocke physiquement les fichiers de données sur le disque dur :
- **MariaDB natif** : `C:\Program Files\MariaDB 10.11\data\facturation_labo_db\`
- **MySQL Server officiel** : `C:\ProgramData\MySQL\MySQL Server 8.0\Data\facturation_labo_db\`
- **XAMPP** : `C:\xampp\mysql\data\facturation_labo_db\`
- **Docker** : Dans le volume managé `mariadb_data`.
