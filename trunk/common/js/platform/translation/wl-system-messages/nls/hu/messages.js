/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2013 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

/* Copyright (C) Worklight Ltd. 2006-2012.  All rights reserved. */
// The following tag is required by the Check PII tool.
// NLS_CHARSET=UTF-8
define({
    // a
    accessDenied : 'Hozzáférés megtagadva',
    authenticationFailure : 'Hitelesítési hiba',
    authFailure : 'Az alkalmazástól származó kérés feldolgozása során hiba történt.',
    applicationDenied : 'Alkalmazás letiltva',
    // b
    browserIsNotSupported : 'A(z) {0} jelenleg nem támogatott.',
    // c
    challengeProcessorExists : 'A(z) "{0}" tartomány túl sok megvalósítóval rendelkezik.  Ellenőrizze a kódot',
    close : 'Bezárás',
    cookiesAreDisabled : 'A böngészőben a cookie-k jelenleg le vannak tiltva. Az alkalmazás megfelelő működéséhez engedélyeznie kell a cookie-kat.',
    copyToClipboard : 'Másolás',
    // d
    details : "Részletek",
    diagApp : "Alkalmazásdiagnosztika",
    diagTime : "Időpont",
    diagApplicationName : "Alkalmazás neve",
    diagApplicationVersion : "Alkalmazás változata",
    diagServiceURL : "Szolgáltatás URL címe",
    diagDevicePlatform : "Készülékplatform",
    diagDeviceVersion : "Készülékváltozat",
    diagScreenResolution : "Képernyőfelbontás",
    diagAirplaneMode : "Repülési üzemmód",
    diagUsingNetwork : "Hálózat használata",
    diagWifiName : "WiFi neve",
    diagMobileNetworkType : "Mobilhálózat típusa",
    diagCarrierName : "Szállítást végző neve",
    diagErrorCode : "Hibakód",
    diagErrorMessage : "Hibaüzenet",
    diagHttpStatus : "HTTP állapot",
    diagIPAddress : "IP cím",
    directUpdateNotificationTitle : 'Frissítés érhető el',
    directUpdateNotificationMessage : 'Frissítés érhető el az alkalmazás számára (fájlméret: {0} MB).',
    directUpdateErrorTitle : 'A frissítés meghiúsult',
    directUpdateErrorMessageNotEnoughStorage : 'Frissítés érhető el az alkalmazás számára, azonban a készüléken nem áll rendelkezésre elegendő szabad terület (szükséges terület mérete: {0} MB, elérhető terület: {1} MB).',
    directUpdateErrorMessageFailedDownloadingZipFile : 'Az alkalmazáshoz tartozó frissítési fájl letöltése meghiúsult.',
    directUpdateErrorMessageFailedProcessingZipFile : 'Az alkalmazáshoz tartozó frissítési fájl feldolgozása meghiúsult.',
    downloadAppWebResourcesPleaseSpecifyAppID : 'Az alkalmazás-erőforrások nem tölthetők le. A Beállítások képernyőn adja meg az alkalmazás azonosítóját.',
    downloadAppWebResourcesAppIdNotExist : 'A(z) "{0}" alkalmazás nem található. Először telepítse azt a Worklight Server rendszerben.',
    downloadAppWebResourcesPleaseSpecifyAppVersion : 'Az alkalmazás-erőforrások nem tölthetők le. A Beállítások képernyőn adja meg az alkalmazás változatát.',
    downloadAppWebResourcesSkinIsNotValid : 'Az alkalmazás-erőforrások nem tölthetők le. A felszín: {0} nem létezik. Győződjön meg róla, hogy a getSkinName() hívás érvényes felszínre kerül feloldásra.',
    downloadAppWebResourcesAppVersionNotExist : 'A(z) {2} "{0}" {1} alkalmazása nem található',
    deviceAuthenticationFail : 'Csatlakozási hiba',
    downloadAppWebResourcesConnectionToServerUnavailable : 'A kiszolgálóval létesített kapcsolat nem érhető el. Az alkalmazás-erőforrások nem tölthetők le.',
    // e
    expandWindow : 'Használatához bontsa ki az alkalmazást',
    exit : 'Kilépés',
    exitApplication : 'Kilépés az alkalmazásból',
    error : 'Hiba',
    // f
    // g
    gadgetUpdateAvailable : 'Alkalmazásfrissítés érhető el',
    getNewVersion : 'Új változat beszerzése',
    // h
    handleTimeOut : 'A(z) {0} esetében a kérés túllépte az időkorlátot. Győződjön meg róla, hogy a hosztcím elérhető az alkalmazás számára (ez különösen Android és iPhone alkalmazások esetén fontos).',
    // i
    invalidUsernamePassword : 'Érvénytelen felhasználónév vagy jelszó',
    // j
    // k
    // l
    loading : 'Betöltés folyamatban',
    login : 'Bejelentkezés',
    // m
    minimize : 'Kis méret',
    // n
    name : 'Név:',
    noInternet : 'A szolgáltatással létesített kapcsolat nem érhető el.',
    notificationTitle : 'Szolgáltatási értesítés',
    notificationUpdateFailure : 'A leküldéses értesítések bejegyzése sikertelen. Az alkalmazás nem tud majd értesítéseket fogadni.',
    notAvailable : 'Nem érhető el',
    // o
    ok : 'OK',
    osxReloadGadget : 'Az alkalmazást újra be kell tölteni',
    osxReloadGadgetInstructions : 'Az alkalmazás ismételt betöltéséhez kattintson a CMD+R kombinációra.',
    // p
    password : 'Jelszó:',
    // q
    // r
    reload : 'Újratöltés',
    restore : 'Visszaállítás',
    requestTimeout : 'Az alkalmazásnak nem sikerült csatlakoznia a szolgáltatáshoz.',
    responseNotRecognized : 'Váratlan válasz.',
    // s
    settings : 'Beállítások',
    serverError : 'Eljáráshívási hiba.',
    // t
    tryAgain : 'Próbálkozzon újra',
    // u
    userInstanceAccessViolationException : 'Olyan alkalmazásba próbál bejelentkezni, amely az Ön számára nincs regisztrálva.',
    unexpectedError : 'A kiszolgáló nem tudta feldolgozni az alkalmazásból származó kérést. Próbálkozzon újra később.',
    unresponsiveHost : 'A szolgáltatás jelenleg nem érhető el.',
    update : 'Frissítés',
    upgradeGadget : 'Az Ön alkalmazásváltozata: {0}. Elérhető az alkalmazás {1} változata. A változat letöltéséhez és telepítéséhez kattintson az OK gombra.',
    // v
    // w
    wlclientInitFailure : 'Hiba',
    wlSettings: 'Worklight beállítások',
    // x
    // y
    // z
    zzz : ''
});

