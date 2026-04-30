!macro customInit
    ; 1. Check if Drive E exists
    IfFileExists "E:\*.*" SetDriveE CheckDriveD

  CheckDriveD:
    ; 2. Check if Drive D exists
    IfFileExists "D:\*.*" SetDriveD FallbackDriveC

  SetDriveE:
    StrCpy $INSTDIR "E:\tms-tools\${PRODUCT_NAME}"
    Goto DoneDriveCheck

  SetDriveD:
    StrCpy $INSTDIR "D:\tms-tools\${PRODUCT_NAME}"
    Goto DoneDriveCheck

  FallbackDriveC:
    ; 3. Fallback if neither E nor D are present
    StrCpy $INSTDIR "C:\tms-tools\${PRODUCT_NAME}"
    Goto DoneDriveCheck

  DoneDriveCheck:
!macroend