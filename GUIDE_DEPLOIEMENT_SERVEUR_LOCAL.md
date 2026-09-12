# 🚀 GUIDE COMPLET DE DÉPLOIEMENT SUR SERVEUR LOCAL

Ce guide vous accompagne pas à pas pour déployer la plateforme de **Facturation Médicale, Gestion de Caisse & Laboratoire d'Analyses** sur votre propre serveur local (Linux Ubuntu/Debian/CentOS, Windows Server ou macOS) avec **MariaDB** ou **PostgreSQL**.

---

## 📋 SOMMAIRE
1. [Méthode 1 : Déploiement Express avec Docker Compose (Recommandé)](#méthode-1--déploiement-express-avec-docker-compose-recommandé)
2. [Méthode 2 : Installation Native sur Linux (Ubuntu / Debian)](#méthode-2--installation-native-sur-linux-ubuntu--debian)
3. [Méthode 3 : Installation sur Windows Server](#méthode-3--installation-sur-windows-server)
4. [Configuration des Bases de Données (MariaDB & PostgreSQL)](#configuration-des-bases-de-données)
5. [Sauvegarde & Restauration Automatisée des Données](#sauvegarde--restauration)
6. [Accès Réseau Local (LAN) pour les Postes Clients & Caisses](#accès-réseau-local-lan)

---

## 🐳 MÉTHODE 1 : DÉPLOIEMENT EXPRESS AVEC DOCKER COMPOSE (RECOMMANDÉ)

C'est la méthode la plus rapide, stable et isolée. Elle installe l'application, la base de données MariaDB ou PostgreSQL, et phpMyAdmin en une seule commande.

### Prérequis
- [Docker Engine & Docker Compose](https://docs.docker.com/get-docker/) installés sur votre serveur.

### Étapes :
1. **Copiez le projet** sur votre serveur dans `/opt/facturation-labo` :
   ```bash
   mkdir -p /opt/facturation-labo
   cd /opt/facturation-labo
   ```
2. **Lancez les conteneurs en arrière-plan** :
   ```bash
   docker compose up -d --build
   ```
3. **Accédez aux services** :
   - 🌐 **Application Web** : `http://localhost:3000` (ou `http://IP_DE_VOTRE_SERVEUR:3000`)
   - 🗄️ **Gestionnaire phpMyAdmin** : `http://localhost:8080` (Identifiant: `root`, Mot de passe: `SecretPassword2026!`)

---

## 🐧 MÉTHODE 2 : INSTALLATION NATIVE SUR LINUX (UBUNTU / DEBIAN)

Si vous préférez exécuter l'application directement avec Node.js, MariaDB/PostgreSQL, Nginx et PM2 :

### Étape 1 : Mettre à jour le système et installer Node.js 20+
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx

# Installation de Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier les versions
node -v
npm -v
```

### Étape 2 : Installer et configurer MariaDB (ou PostgreSQL)

#### Option A : MariaDB (Recommandé)
```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation

# Importer le schéma et les données initiales :
sudo mysql -u root -p < database/init_mariadb.sql
```

#### Option B : PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Créer la base et importer le schéma :
sudo -u postgres psql -c "CREATE DATABASE facturation_labo_db;"
sudo -u postgres psql -d facturation_labo_db -f database/init_postgresql.sql
```

### Étape 3 : Installer les dépendances & Compiler l'application
```bash
cd /opt/facturation-labo
npm install
npm run build
```

### Étape 4 : Gestionnaire de processus PM2 (Démarrage automatique)
```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Lancer l'application
pm2 start dist/server.cjs --name "facturation-labo"

# Configurer le démarrage automatique au boot du serveur
pm2 startup
pm2 save
```

### Étape 5 : Configuration du Reverse Proxy Nginx (Port 80 -> 3000)
Créez le fichier `/etc/nginx/sites-available/facturation` :
```nginx
server {
    listen 80;
    server_name facturation.local 192.168.1.100; # Remplacez par l'IP de votre serveur

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Activez le site et redémarrez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/facturation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🪟 MÉTHODE 3 : INSTALLATION SUR WINDOWS SERVER

1. **Installer Node.js** : Téléchargez et installez Node.js LTS (v20+) depuis [nodejs.org](https://nodejs.org).
2. **Installer MariaDB** : Téléchargez [MariaDB Server Windows](https://mariadb.org/download/) et configurez le mot de passe root.
3. **Importer la base** : Ouvrez HeidiSQL (fourni avec MariaDB) ou MySQL Workbench et exécutez le script `database/init_mariadb.sql`.
4. **Compiler et lancer** :
   ```cmd
   cd C:\facturation-labo
   npm install
   npm run build
   npm start
   ```
5. *(Optionnel)* Pour lancer en service Windows permanent, utilisez **NSSM** (Non-Sucking Service Manager) ou **PM2 Windows**.

---

## 🔒 COMPTES UTILISATEURS PAR DÉFAUT APRÈS INSTALLATION

| Identifiant (Login / Email) | Mot de passe | Rôle & Permissions |
| :--- | :--- | :--- |
| `mandemohamed68@gmail.com` | `admin123` | **Directeur Général & Superviseur Système** (Accès total) |
| `admin` | `admin123` | **Administrateur Principal** |
| `facturier` | `facture123` | **Facturier** (Facturation sans encaissement espèces) |
| `caissier` | `caisse123` | **Caissier** (Encaissement et clôtures de caisse) |
| `facture_caisse` | `polyvalent123` | **Facture / Caisse** (Polyvalent guichet unique) |
| `dr.toure` | `labo123` | **Biologiste Médical** (Chef de laboratoire) |
| `technicien` | `tech123` | **Technicien de Laboratoire** (Saisie des analyses) |

---

## 💾 SAUVEGARDE & RESTAURATION

### Sauvegarde automatique MariaDB (Script Bash cron quotidien) :
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/facturation"
mkdir -p $BACKUP_DIR
DATE=$(date +"%Y-%m-%d_%H-%M")
mysqldump -u root -pSecretPassword2026! facturation_labo_db | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
# Conserver les 30 derniers jours
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

### Restauration d'une sauvegarde :
```bash
gunzip < /var/backups/facturation/backup_2026-03-15.sql.gz | mysql -u root -p facturation_labo_db
```

---

## 🌐 ACCÈS RÉSEAU LOCAL (LAN) POUR LES POSTES CLIENTS

Pour que tous les ordinateurs du laboratoire ou de la clinique (accueil, caisses, secrétariat, salle d'analyses) accèdent à la plateforme :
1. Fixez l'adresse IP statique du serveur (ex: `192.168.1.100`).
2. Ouvrez le port `3000` (ou `80`) sur le pare-feu du serveur :
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 80/tcp
   ```
3. Depuis n'importe quel PC client ou tablette connecté au réseau local / Wi-Fi, ouvrez le navigateur sur :
   `http://192.168.1.100:3000`
