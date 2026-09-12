@echo off
TITLE Plateforme Medicale & LIMS - Importation MariaDB / MySQL
COLOR 0B
echo =====================================================================
echo    IMPORTATION DU SCHEMA ET DES DONNEES SQL (MARIADB / MYSQL)
echo =====================================================================
echo.

set /p MYSQL_USER="Entrez l'utilisateur MySQL/MariaDB [defaut: root] : "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_HOST="Entrez l'hote MySQL [defaut: 127.0.0.1] : "
if "%MYSQL_HOST%"=="" set MYSQL_HOST=127.0.0.1

set /p MYSQL_PORT="Entrez le port MySQL [defaut: 3306] : "
if "%MYSQL_PORT%"=="" set MYSQL_PORT=3306

echo.
echo Connexion en cours a MySQL/MariaDB sur %MYSQL_HOST%:%MYSQL_PORT%...
echo Veuillez entrer le mot de passe lorsque demande :
echo.

mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p < database\init_mariadb.sql

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUCCES] La base de donnees 'facturation_labo_db' a ete creee
    echo          et initialisee avec succes !
    echo =====================================================================
) else (
    echo.
    echo =====================================================================
    echo [ERREUR] Impossible d'executer le script SQL.
    echo Verifiez que MariaDB/MySQL est bien demarre et que vos identifiants
    echo sont corrects.
    echo =====================================================================
)

echo.
pause
