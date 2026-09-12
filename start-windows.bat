@echo off
TITLE Plateforme Medicale & LIMS - Demarrage Production
COLOR 0A
echo =====================================================================
echo    PLATEFORME MEDICALE, FACTURATION ET LABORATOIRE LIMS
echo    Lancement automatique du serveur de production
echo =====================================================================
echo.

:: 1. Verification de Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH.
    echo Veuillez telecharger et installer Node.js LTS depuis https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Verification des dependances...
if not exist "node_modules\" (
    echo Installation des modules npm en cours...
    call npm install --production=false
) else (
    echo Modules npm deja installes.
)

echo.
echo [2/3] Verification de la compilation de production...
if not exist "dist\server.cjs" (
    echo Compilation du code TypeScript et Vite...
    call npm run build
) else (
    echo Compilation de production prete.
)

echo.
echo [3/3] Demarrage du serveur sur http://localhost:3000...
echo.
echo  - Port actif : 3000
echo  - Mode : PRODUCTION
echo  - Pour arreter : Fermez cette fenetre ou faites CTRL + C
echo =====================================================================
echo.

set NODE_ENV=production
node dist\server.cjs

pause
