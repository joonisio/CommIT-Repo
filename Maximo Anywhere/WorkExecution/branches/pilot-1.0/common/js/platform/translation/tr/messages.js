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
    accessDenied : 'Erişim Reddedildi',
    authenticationFailure : 'Kimlik doğrulama hatası',
    authFailure : 'Uygulamadan gelen istek işlenirken bir hatayla karşılaşıldı.',
    applicationDenied : 'Uygulama Devre Dışı Bırakıldı',
    // b
    browserIsNotSupported : '{0} şu anda desteklenmiyor.',
    // c
    challengeProcessorExists : '"{0}" bölgesi çok fazla uygulayıcı içeriyor.  Lütfen kodunuzu denetleyin',
    close : 'Kapat',
    cookiesAreDisabled : 'Şu anda tarayıcınızda tanımlama bilgileri devre dışı bırakıldı. Uygulamanın düzgün çalışması için bunları etkinleştirmelisiniz.',
    copyToClipboard : 'Kopyala',
    // d
    details : "Ayrıntılar",
    diagApp : "Uygulama Tanılama",
    diagTime : "Saat",
    diagApplicationName : "Uygulama Adı",
    diagApplicationVersion : "Uygulama Sürümü",
    diagServiceURL : "Hizmet URL Adresi",
    diagDevicePlatform : "Aygıt Platformu",
    diagDeviceVersion : "Aygıt Sürümü",
    diagScreenResolution : "Ekran Çözünürlüğü",
    diagAirplaneMode : "Uçak Kipi",
    diagUsingNetwork : "Ağ Kullanma",
    diagWifiName : "WiFi Adı",
    diagMobileNetworkType : "Mobil Ağ Tipi",
    diagCarrierName : "Operatör Adı",
    diagErrorCode : "Hata Kodu",
    diagErrorMessage : "Hata İletisi",
    diagHttpStatus : "HTTP Durumu",
    diagIPAddress : "IP Adresi",
    directUpdateNotificationTitle : 'Güncelleme Var',
    directUpdateNotificationMessage : 'Uygulama için bir güncelleme var (dosya büyüklüğü {0} MB).',
    directUpdateErrorTitle : 'Güncelleme Başarısız Oldu',
    directUpdateErrorMessageNotEnoughStorage : 'Uygulama için bir güncelleme var, ancak aygıtta yeterli yer yok (gereken büyüklük: {0} MB, kullanılabilecek yer: {1} MB).',
    directUpdateErrorMessageFailedDownloadingZipFile : 'Uygulama güncelleme dosyası karşıdan yüklenemedi.',
    directUpdateErrorMessageFailedProcessingZipFile : 'Uygulama güncelleme dosyası işlenemedi.',
    downloadAppWebResourcesPleaseSpecifyAppID : 'Uygulama kaynakları karşıdan yüklenemiyor. Ayarlar ekranında Uygulama Tanıtıcısını belirtin.',
    downloadAppWebResourcesAppIdNotExist : '"{0}" uygulaması bulunamıyor. Önce bunu Worklight Server\'a yerleştirin.',
    downloadAppWebResourcesPleaseSpecifyAppVersion : 'Uygulama kaynakları karşıdan yüklenemiyor. Ayarlar ekranında Uygulama Sürümünü belirtin.',
    downloadAppWebResourcesSkinIsNotValid : 'Uygulama kaynakları karşıdan yüklenemiyor. {0} dışyüzü yok. Lütfen getSkinName() öğesinin geçerli bir dışyüze çözümlendiğinden emin olun.',
    downloadAppWebResourcesAppVersionNotExist : '{2} için "{0}" {1} uygulaması bulunamıyor',
    deviceAuthenticationFail : 'Bağlantı Hatası',
    downloadAppWebResourcesConnectionToServerUnavailable : 'Sunucuyla bağlantı kurulamıyor. Uygulama kaynakları karşıdan yüklenemiyor.',
    // e
    expandWindow : 'Bunu kullanmak için uygulamayı genişletin',
    exit : 'Çıkış',
    exitApplication : 'Uygulamadan çıkar',
    error : 'Hata',
    // f
    // g
    gadgetUpdateAvailable : 'Uygulama güncellemesi kullanılabilir',
    getNewVersion : 'Yeni sürümü al',
    // h
    handleTimeOut : '{0} için istek zamanaşımına uğradı. Uygulama için (özellikle de Android ve iPhone uygulamaları için geçerlidir) anasistem adresinin kullanılabilir olduğundan emin olun.',
    // i
    invalidUsernamePassword : 'Kullanıcı adı ya da parola geçersiz',
    // j
    // k
    // l
    loading : 'Yükleniyor',
    login : 'Oturum aç',
    // m
    minimize : 'Simge durumuna küçült',
    // n
    name : 'Ad:',
    noInternet : 'Hizmetle bağlantı kurulamıyor.',
    notificationTitle : 'Hizmet Bildirimi',
    notificationUpdateFailure : 'Gönderme bildirimlerine kayıt gerçekleştirilemedi. Uygulama bildirim alamayacak.',
    notAvailable : 'Kullanılamıyor',
    // o
    ok : 'Tamam',
    osxReloadGadget : 'Uygulamanın yeniden yüklenmesi gerekir',
    osxReloadGadgetInstructions : 'Uygulamayı yeniden yüklemek için CMD+R tuşlarına basın.',
    // p
    password : 'Parola:',
    // q
    // r
    reload : 'Yeniden Yükle',
    restore : 'Geri Yükle',
    requestTimeout : 'Uygulama hizmete bağlanamadı.',
    responseNotRecognized : 'Beklenmeyen yanıt.',
    // s
    settings : 'Ayarlar',
    serverError : 'Yordam yürütme hatası.',
    // t
    tryAgain : 'Yeniden Deneyin',
    // u
    userInstanceAccessViolationException : 'Sizin için kayıtlı olmayan bir uygulamada oturum açmaya çalışıyorsunuz.',
    unexpectedError : 'Sunucu, uygulamadan gelen isteği işleyemedi. Lütfen daha sonra tekrar deneyin.',
    unresponsiveHost : 'Hizmet şu anda kullanılamıyor.',
    update : 'Güncelle',
    upgradeGadget : 'Uygulamanızın sürümü: {0}. Bu uygulamanın {1} sürümü kullanılabilir. Karşıdan yükleyip kurmak için Tamam düğmesini tıklatın.',
    // v
    // w
    wlclientInitFailure : 'Hata',
    wlSettings: 'Worklight Ayarları',
    // x
    // y
    // z
    zzz : ''
});

