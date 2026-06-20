Unicode true

!include "wails_tools.nsh"
!include "MUI2.nsh"   ; ← MUI2 à la place de MUI.nsh

; ---- Infos version ----
VIProductVersion "${INFO_PRODUCTVERSION}.0"
VIFileVersion    "${INFO_PRODUCTVERSION}.0"
VIAddVersionKey "CompanyName"     "${INFO_COMPANYNAME}"
VIAddVersionKey "FileDescription" "${INFO_PRODUCTNAME} Installer"
VIAddVersionKey "ProductVersion"  "${INFO_PRODUCTVERSION}"
VIAddVersionKey "FileVersion"     "${INFO_PRODUCTVERSION}"
VIAddVersionKey "LegalCopyright"  "${INFO_COPYRIGHT}"
VIAddVersionKey "ProductName"     "${INFO_PRODUCTNAME}"

ManifestDPIAware true

; ---- Icônes ----
!define MUI_ICON   "..\icon.ico"
!define MUI_UNICON "..\icon.ico"

; ---- Options UI ----
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_ABORTWARNING

; ---- Image bannière gauche (optionnel) ----
; Crée un BMP 164x314 px et décommente :
; !define MUI_WELCOMEFINISHPAGE_BITMAP "resources\banner.bmp"

; ---- Image header (optionnel) ----
; Crée un BMP 150x57 px et décommente :
; !define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP "resources\header.bmp"
; !define MUI_HEADERIMAGE_RIGHT

; ---- Textes personnalisés ----
!define MUI_WELCOMEPAGE_TITLE     "Bienvenue dans l'installation de Wail"
!define MUI_WELCOMEPAGE_TEXT      "Cet assistant va installer ${INFO_PRODUCTNAME} ${INFO_PRODUCTVERSION} sur votre ordinateur.$\n$\nCliquez sur Suivant pour continuer."
!define MUI_FINISHPAGE_TITLE      "Installation terminée"
!define MUI_FINISHPAGE_TEXT       "${INFO_PRODUCTNAME} a été installé avec succès.$\nCliquez sur Terminer pour fermer."

; ---- Option "Lancer l'app" sur la page Finish ----
!define MUI_FINISHPAGE_RUN        "$INSTDIR\${PRODUCT_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT   "Lancer ${INFO_PRODUCTNAME}"

; ---- Pages installeur ----
!insertmacro MUI_PAGE_WELCOME
; !insertmacro MUI_PAGE_LICENSE "resources\eula.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; ---- Pages désinstalleur ----
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ---- Langue française ----
!insertmacro MUI_LANGUAGE "French"

; ---- Config générale ----
Name "${INFO_PRODUCTNAME}"
OutFile "..\..\bin\${INFO_PROJECTNAME}-${ARCH}-installer.exe"
InstallDir "$PROGRAMFILES64\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}"
ShowInstDetails show

; ============================================
Function .onInit
  !insertmacro wails.checkArchitecture
FunctionEnd

; ============================================
Section
  !insertmacro wails.setShellContext
  !insertmacro wails.webview2runtime

  SetOutPath $INSTDIR
  !insertmacro wails.files

  CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"
  CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk"    "$INSTDIR\${PRODUCT_EXECUTABLE}"

  !insertmacro wails.associateFiles
  !insertmacro wails.associateCustomProtocols
  !insertmacro wails.writeUninstaller
SectionEnd

; ============================================
Section "uninstall"
  !insertmacro wails.setShellContext

  RMDir /r "$AppData\${PRODUCT_EXECUTABLE}"
  RMDir /r $INSTDIR

  Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
  Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

  !insertmacro wails.unassociateFiles
  !insertmacro wails.unassociateCustomProtocols
  !insertmacro wails.deleteUninstaller
SectionEnd