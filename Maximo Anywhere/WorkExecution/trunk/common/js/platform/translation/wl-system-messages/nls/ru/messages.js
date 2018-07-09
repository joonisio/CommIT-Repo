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
    accessDenied : 'Отказано в доступе',
    authenticationFailure : 'Ошибка аутентификации',
    authFailure : 'При обработке требования из прикладной программы произошла ошибка.',
    applicationDenied : 'Прикладная программа отключена',
    // b
    browserIsNotSupported : '{0} в настоящее время не поддерживается.',
    // c
    challengeProcessorExists : 'У царства "{0}" слишком много реализующих.  Проверьте свой код.',
    close : 'Закрыть',
    cookiesAreDisabled : 'В настоящий момент в используемом браузере отключены опознавательные файлы (cookie). Их нужно включить для правильной работы прикладной программы.',
    copyToClipboard : 'Копировать',
    // d
    details : "Подробности",
    diagApp : "Диагностика прикладной программы",
    diagTime : "Время",
    diagApplicationName : "Имя программы",
    diagApplicationVersion : "Версия прикладной программы",
    diagServiceURL : "URL службы",
    diagDevicePlatform : "Платформа устройства",
    diagDeviceVersion : "Версия устройства",
    diagScreenResolution : "Разрешение экрана",
    diagAirplaneMode : "Автономный режим",
    diagUsingNetwork : "Использование сети",
    diagWifiName : "Имя сети WiFi",
    diagMobileNetworkType : "Тип сети мобильной связи",
    diagCarrierName : "Имя носителя",
    diagErrorCode : "Код ошибки",
    diagErrorMessage : "Сообщение об ошибке",
    diagHttpStatus : "Состояние HTTP",
    diagIPAddress : "IP-адрес",
    directUpdateNotificationTitle : 'Доступно обновление',
    directUpdateNotificationMessage : 'Для прикладной программы доступно обновление (размер файла - {0} Мбайт).',
    directUpdateErrorTitle : 'Обновление завершилось неудачно',
    directUpdateErrorMessageNotEnoughStorage : 'Для прикладной программы доступно обновление, но на устройстве не хватает доступного пространства (требуемый размер: {0} Мбайт; доступное пространство: {1} Мбайт).',
    directUpdateErrorMessageFailedDownloadingZipFile : 'Не удалось скачать файл обновления прикладной программы.',
    directUpdateErrorMessageFailedProcessingZipFile : 'Ошибка обработки файла обновления прикладной программы.',
    downloadAppWebResourcesPleaseSpecifyAppID : 'Не удалось скачать ресурсы программы. Задайте ID прикладной программы на экране Параметры.',
    downloadAppWebResourcesAppIdNotExist : 'Не удается найти прикладную программу "{0}". Сначала ее следует внедрить на сервер Worklight.',
    downloadAppWebResourcesPleaseSpecifyAppVersion : 'Не удалось скачать ресурсы программы. Задайте версию прикладной программы на экране Параметры.',
    downloadAppWebResourcesSkinIsNotValid : 'Не удалось скачать ресурсы программы. Оформление {0} не существует. Убедитесь, что getSkinName() разрешает допустимую обложку.',
    downloadAppWebResourcesAppVersionNotExist : 'Не удается найти прикладную программу "{0}" {1} для {2}',
    deviceAuthenticationFail : 'Ошибка в межсоединении',
    downloadAppWebResourcesConnectionToServerUnavailable : 'Недоступно соединение с сервером. Не удалось скачать ресурсы программы.',
    // e
    expandWindow : 'Раскройте прикладную программу, чтобы использовать ее.',
    exit : 'Выход',
    exitApplication : 'Выход из прикладной программы',
    error : 'Ошибка',
    // f
    // g
    gadgetUpdateAvailable : 'Доступно обновление прикладной программы',
    getNewVersion : 'Получите новую версию',
    // h
    handleTimeOut : 'Истек срок ожидания требования для {0}. Убедитесь, что адрес хоста доступен для программы (в особенности для программ Android и iPhone).',
    // i
    invalidUsernamePassword : 'Недопустимое имя пользователя или пароль',
    // j
    // k
    // l
    loading : 'Загружается',
    login : 'Регистрация',
    // m
    minimize : 'Минимизировать',
    // n
    name : 'Имя:',
    noInternet : 'Соединение со службой недоступно.',
    notificationTitle : 'Уведомление службы',
    notificationUpdateFailure : 'Регистрация извещающих уведомлений завершилась неудачно. Прикладная программа не сможет получать уведомления.',
    notAvailable : 'Недоступна',
    // o
    ok : 'ОК',
    osxReloadGadget : 'Прикладной программе требуется перезагрузка.',
    osxReloadGadgetInstructions : 'Чтобы перезагрузить прикладную программу, выберите CMD+R.',
    // p
    password : 'Пароль:',
    // q
    // r
    reload : 'Перезагрузить',
    restore : 'Восстановить',
    requestTimeout : 'Прикладной программе не удалось соединиться со службой.',
    responseNotRecognized : 'Неожиданный ответ.',
    // s
    settings : 'Параметры',
    serverError : 'Ошибка вызова процедуры.',
    // t
    tryAgain : 'Повторите попытку',
    // u
    userInstanceAccessViolationException : 'Вы пытаетесь войти в прикладную программу, которая для вас не зарегистрирована.',
    unexpectedError : 'Сервер не смог обработать требование из прикладной программы. Повторите попытку позднее.',
    unresponsiveHost : 'Служба в текущий момент недоступна.',
    update : 'Обновление',
    upgradeGadget : 'Версия вашей прикладной программы: {0}. Для этой прикладной программы доступна версия {1}. Нажмите кнопку OK, чтобы скачать и установить ее.',
    // v
    // w
    wlclientInitFailure : 'Ошибка',
    wlSettings: 'Параметры Worklight',
    // x
    // y
    // z
    zzz : ''
});
