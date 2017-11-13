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
    accessDenied : 'Käyttö kielletty',
    authenticationFailure : 'Todennusvirhe',
    authFailure : 'Pyynnön käsittelyssä sovelluksesta on ilmennyt virhe.',
    applicationDenied : 'Sovellus on poistettu käytöstä',
    // b
    browserIsNotSupported : '{0} ei ole nyt tuettu.',
    // c
    challengeProcessorExists : 'Alueella {0} on liian monta toteuttajaa.  Tarkista koodi',
    close : 'Sulje',
    cookiesAreDisabled : 'Evästeet ovat nyt poissa käytöstä selaimessasi. Ota ne käyttöön, jotta sovellus toimii oikein.',
    copyToClipboard : 'Kopioi',
    // d
    details : "Tiedot",
    diagApp : "Sovelluksen vianmääritys",
    diagTime : "Kellonaika",
    diagApplicationName : "Sovelluksen nimi",
    diagApplicationVersion : "Sovelluksen versio",
    diagServiceURL : "Palvelun URL-osoite",
    diagDevicePlatform : "Laitteen käyttöympäristö",
    diagDeviceVersion : "Laitteen versio",
    diagScreenResolution : "Näytön erotuskyky",
    diagAirplaneMode : "Lentotila",
    diagUsingNetwork : "Verkon käyttö",
    diagWifiName : "WiFi-nimi",
    diagMobileNetworkType : "Mobiiliverkon laji",
    diagCarrierName : "Operaattorin nimi",
    diagErrorCode : "Virhekoodi",
    diagErrorMessage : "Virhesanoma",
    diagHttpStatus : "HTTP-tila",
    diagIPAddress : "IP-osoite",
    directUpdateNotificationTitle : 'Päivitys on saatavilla',
    directUpdateNotificationMessage : 'Sovelluksen päivitys on saatavilla (tiedoston koko on {0} megatavua.',
    directUpdateErrorTitle : 'Päivitys ei onnistunut',
    directUpdateErrorMessageNotEnoughStorage : 'Sovelluksen päivitys on käytettävissä, mutta laitteen tallennustila ei riitä (tarvittava tila: {0} megatavua, käytettävissä oleva tila: {1} megatavua).',
    directUpdateErrorMessageFailedDownloadingZipFile : 'Sovelluksen päivitystiedoston lataus ei onnistunut.',
    directUpdateErrorMessageFailedProcessingZipFile : 'Sovelluksen päivitystiedoston käsittely ei onnistunut.',
    downloadAppWebResourcesPleaseSpecifyAppID : 'Sovellusresurssien lataus ei onnistu. Määritä sovelluksen tunnus Asetukset-näytössä.',
    downloadAppWebResourcesAppIdNotExist : 'Sovellusta {0} ei löydy. Ota se ensin käyttöön Worklight Server -palvelimessa.',
    downloadAppWebResourcesPleaseSpecifyAppVersion : 'Sovellusresurssien lataus ei onnistu. Määritä sovelluksen versio Asetukset-näytössä.',
    downloadAppWebResourcesSkinIsNotValid : 'Sovellusresurssien lataus ei onnistu. Ulkoasua: {0} ei ole. Varmista, että metodin getSkinName() tuloksena on kelvollinen ulkoasu.',
    downloadAppWebResourcesAppVersionNotExist : 'Sovellusta {0} {1} ei löydy kohteelle {2}',
    deviceAuthenticationFail : 'Verkkoyhteyksien virhe',
    downloadAppWebResourcesConnectionToServerUnavailable : 'Yhteys palvelimeen ei ole käytettävissä. Sovellusresurssien lataus ei onnistu.',
    // e
    expandWindow : 'Laajenna sovellus, jotta voit käyttää sitä',
    exit : 'Lopeta',
    exitApplication : 'Lopeta sovellus',
    error : 'Virhe',
    // f
    // g
    gadgetUpdateAvailable : 'Sovelluksen päivitys on käytettävissä',
    getNewVersion : 'Nouda uusi versio',
    // h
    handleTimeOut : 'Pyyntö päättyi aikakatkaisuun kohteessa {0}. Varmista, että pääkoneen osoite on käytettävissä sovellukselle (erityisen tärkeää Android- ja iPhone-sovelluksille).',
    // i
    invalidUsernamePassword : 'Käyttäjätunnus tai salasana ei kelpaa',
    // j
    // k
    // l
    loading : 'Lataus on meneillään',
    login : 'Kirjaudu sisään',
    // m
    minimize : 'Pienennä',
    // n
    name : 'Nimi:',
    noInternet : 'Yhteys palvelimeen ei ole käytettävissä.',
    notificationTitle : 'Palvelun ilmoitus',
    notificationUpdateFailure : 'Siirtoilmoitusten rekisteröinti ei onnistunut. Sovellus ei voi vastaanottaa ilmoituksia.',
    notAvailable : 'Ei käytettävissä',
    // o
    ok : 'OK',
    osxReloadGadget : 'Sovellus on ladattava uudelleen',
    osxReloadGadgetInstructions : 'Lataa sovellus uudelleen napsauttamalla näppäinyhdistelmää CMD+R.',
    // p
    password : 'Salasana:',
    // q
    // r
    reload : 'Lataa uudelleen',
    restore : 'Palauta',
    requestTimeout : 'Sovelluksen ei onnistunut muodostaa yhteyttä palvelimeen.',
    responseNotRecognized : 'Odottamaton vastaus.',
    // s
    settings : 'Asetukset',
    serverError : 'Toimintosarjan kutsuvirhe.',
    // t
    tryAgain : 'Yritä uudelleen',
    // u
    userInstanceAccessViolationException : 'Yrität kirjautua sovellukseen, jota ei ole rekisteröity sinulle.',
    unexpectedError : 'Palvelun ei onnistunut käsitellä sovelluksesta tullutta pyyntöä. Yritä myöhemmin uudelleen.',
    unresponsiveHost : 'Palvelu ei ole nyt käytettävissä.',
    update : 'Päivitä',
    upgradeGadget : 'Sovelluksesi versio on {0}. Tämän sovelluksen versio {1} on käytettävissä. Lataa ja asenna se napsauttamalla OK-painiketta.',
    // v
    // w
    wlclientInitFailure : 'Virhe',
    wlSettings: 'Worklight-asetukset',
    // x
    // y
    // z
    zzz : ''
});

