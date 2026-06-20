Unicode true
ManifestDPIAware true

!include "MUI2.nsh"

; ---- Définitions ----
!define APP_NAME    "CARE~X"
!define APP_VERSION "1.0.0"
!define APP_EXE     "CAREX.exe"
!define INSTALL_DIR "$PROGRAMFILES64\medical-app"

; ---- Icônes ----
!define MUI_ICON   "build\appicon.ico"
!define MUI_UNICON "build\appicon.ico"

; ---- Options UI ----
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_NOAUTOCLOSE

; ---- Textes ----
!define MUI_WELCOMEPAGE_TITLE "Bienvenue dans CARE~X"
!define MUI_WELCOMEPAGE_TEXT  "Cet assistant va installer CARE~X ${APP_VERSION} sur votre ordinateur.$\n$\nCliquez sur Suivant pour continuer."
!define MUI_FINISHPAGE_TITLE  "Installation terminée"
!define MUI_FINISHPAGE_TEXT   "CARE~X a été installé avec succès."

; ---- Lancer l'app après installation ----
!define MUI_FINISHPAGE_RUN      "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Lancer CARE~X"

; ---- Pages installeur ----
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; ---- Pages désinstalleur ----
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ---- Langue ----
!insertmacro MUI_LANGUAGE "French"

; ---- Config générale ----
Name            "${APP_NAME}"
OutFile         "CAREXInstaller.exe"
InstallDir      "${INSTALL_DIR}"
RequestExecutionLevel admin
ShowInstDetails show

; ============================================
Section "Install"
  SetOutPath "$INSTDIR"
  File "build\bin\${APP_EXE}"
  File "build\appicon.ico"

  ; Raccourci Bureau
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\appicon.ico"

  ; Raccourci Menu Démarrer
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\appicon.ico"

  ; Désinstalleur
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registre Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName"     "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon"     "$INSTDIR\appicon.ico"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion"  "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher"       "medical-app"
SectionEnd

; ============================================
Section "Uninstall"
  Delete "$INSTDIR\${APP_EXE}"
  Delete "$INSTDIR\appicon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir  "$INSTDIR"

  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd