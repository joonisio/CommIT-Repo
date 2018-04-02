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
    accessDenied : 'アクセス拒否',
    authenticationFailure : '認証障害',
    authFailure : 'アプリケーションからの要求の処理時にエラーが発生しました。',
    applicationDenied : 'アプリケーション使用不可',
    // b
    browserIsNotSupported : '{0} は現在サポートされていません。',
    // c
    challengeProcessorExists : 'レルム "{0}" にインプリメンターが多すぎます。コードを確認してください',
    close : '閉じる',
    cookiesAreDisabled : 'ご使用のブラウザーで現在 Cookie が無効になっています。アプリケーションが適切に機能するには Cookie を有効にする必要があります。',
    copyToClipboard : 'コピー',
    // d
    details : "詳細",
    diagApp : "アプリケーション診断",
    diagTime : "時間",
    diagApplicationName : "アプリケーション名",
    diagApplicationVersion : "アプリケーション・バージョン",
    diagServiceURL : "サービス URL",
    diagDevicePlatform : "デバイス・プラットフォーム",
    diagDeviceVersion : "デバイス・バージョン",
    diagScreenResolution : "画面解像度",
    diagAirplaneMode : "機内モード",
    diagUsingNetwork : "ネットワークの使用",
    diagWifiName : "WiFi 名",
    diagMobileNetworkType : "モバイル・ネットワーク・タイプ",
    diagCarrierName : "キャリア名",
    diagErrorCode : "エラー・コード",
    diagErrorMessage : "エラー・メッセージ",
    diagHttpStatus : "HTTP 状況",
    diagIPAddress : "IP アドレス",
    directUpdateNotificationTitle : '更新が取得可能',
    directUpdateNotificationMessage : 'アプリケーションの更新が取得可能です (ファイル・サイズ: {0} MB)。',
    directUpdateErrorTitle : '更新失敗',
    directUpdateErrorMessageNotEnoughStorage : 'アプリケーションの更新が取得可能ですが、デバイス上に十分な使用可能なスペースがありません (必要なサイズ: {0} MB、使用可能なスペース: {1} MB)。',
    directUpdateErrorMessageFailedDownloadingZipFile : 'アプリケーションの更新ファイルのダウンロードに失敗しました。',
    directUpdateErrorMessageFailedProcessingZipFile : 'アプリケーションの更新ファイルの処理に失敗しました。',
    downloadAppWebResourcesPleaseSpecifyAppID : 'アプリケーション・リソースのダウンロードができません。設定画面にアプリケーション ID を指定します。',
    downloadAppWebResourcesAppIdNotExist : 'アプリケーション "{0}" が見つかりません。最初にそれを Worklight Server にデプロイします。',
    downloadAppWebResourcesPleaseSpecifyAppVersion : 'アプリケーション・リソースのダウンロードができません。設定画面にアプリケーション・バージョンを指定します。',
    downloadAppWebResourcesSkinIsNotValid : 'アプリケーション・リソースのダウンロードができません。スキン: {0} は存在しません。getSkinName() が有効なスキンに解決されることを確認してください。',
    downloadAppWebResourcesAppVersionNotExist : 'アプリケーション "{0}" ({2} の {1}) が見つかりません',
    deviceAuthenticationFail : '接続エラー',
    downloadAppWebResourcesConnectionToServerUnavailable : 'サーバーへの接続が使用可能ではありません。アプリケーション・リソースのダウンロードができません。',
    // e
    expandWindow : 'それを使用するためにアプリケーションを展開',
    exit : '終了',
    exitApplication : 'アプリケーションの終了',
    error : 'エラー',
    // f
    // g
    gadgetUpdateAvailable : 'アプリケーションの更新が使用可能',
    getNewVersion : '新しいバージョンを取得',
    // h
    handleTimeOut : '{0} の要求がタイムアウトになりました。ホスト・アドレスがアプリケーション (特に Android や iPhone のアプリケーション) で使用できることを確認してください。',
    // i
    invalidUsernamePassword : '無効なユーザー名またはパスワード',
    // j
    // k
    // l
    loading : 'ロード中',
    login : 'ログイン',
    // m
    minimize : '最小化',
    // n
    name : '名前:',
    noInternet : 'サービスへの接続が使用可能ではありません。',
    notificationTitle : 'サービス通知',
    notificationUpdateFailure : 'プッシュ通知の登録に失敗しました。アプリケーションでは通知を受け取ることができません。',
    notAvailable : '使用不能',
    // o
    ok : 'OK',
    osxReloadGadget : 'アプリケーションの再ロードが必要です',
    osxReloadGadgetInstructions : 'アプリケーションを再ロードするために CMD+R をクリックしてください。',
    // p
    password : 'パスワード:',
    // q
    // r
    reload : '再ロード',
    restore : 'リストア',
    requestTimeout : 'アプリケーションでサービスへの接続に失敗しました。',
    responseNotRecognized : '予期しない応答。',
    // s
    settings : '設定',
    serverError : 'プロシージャー呼び出しエラー。',
    // t
    tryAgain : '再試行',
    // u
    userInstanceAccessViolationException : 'ユーザーに対して登録されていないアプリケーションへのログインを試行しています。',
    unexpectedError : 'サーバーはアプリケーションからの要求を処理できませんでした。後でやり直してください。',
    unresponsiveHost : 'サービスは現在使用できません。',
    update : '更新',
    upgradeGadget : 'ご使用のアプリケーションのバージョンは {0} です。このアプリケーションのバージョン {1} が使用可能です。ダウンロードしてインストールするには「OK」をクリックしてください。',
    // v
    // w
    wlclientInitFailure : 'エラー',
    wlSettings: 'Worklight の設定',
    // x
    // y
    // z
    zzz : ''
});
