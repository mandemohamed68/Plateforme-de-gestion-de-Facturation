@echo off
TITLE Plateforme Medicale & LIMS - Sauvegarde SQL Quotidienne
COLOR 0E
echo =====================================================================
echo    SAUVEGARDE AUTOMATIQUE DE LA BASE DE DONNEES (MARIADB / MYSQL)
echo =====================================================================
echo.

set BACKUP_DIR=C:\Sauvegardes_LIMS
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

set DATE_STR=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%
set DATE_STR=%DATE_STR: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup_facturation_labo_%DATE_STR%.sql

echo Sauvegarde de la base 'facturation_labo_db' vers :
echo %BACKUP_FILE%
echo.

mysqldump -h 127.0.0.1 -P 3306 -u root -pSecretPassword2026! --routines --triggers facturation_labo_db > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo [SUCCES] Sauvegarde terminee avec succes !
    echo Fichier cree : %BACKUP_FILE%
) else (
    echo [ERREUR] La sauvegarde a echoue. Verifiez le mot de passe dans ce script.
)

echo.
timeout /t 5
