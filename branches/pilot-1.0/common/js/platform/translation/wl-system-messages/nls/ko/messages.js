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
    accessDenied : '액세스가 거부됨',
    authenticationFailure : '인증 실패',
    authFailure : '애플리케이션의 요청을 처리하는 동안 오류가 발생했습니다.',
    applicationDenied : '애플리케이션 사용 안함',
    // b
    browserIsNotSupported : '{0}은(는) 현재 지원되지 않습니다.',
    // c
    challengeProcessorExists : '"{0}" 범위에 너무 많은 구현자가 있습니다. 코드를 확인하십시오.',
    close : '닫기',
    cookiesAreDisabled : '현재 브라우저에서 쿠키를 사용하지 않습니다. 애플리케이션이 올바르게 작동하도록 하려면 쿠키를 사용해야 합니다.',
    copyToClipboard : '복사',
    // d
    details : "세부사항",
    diagApp : "애플리케이션 진단",
    diagTime : "시간",
    diagApplicationName : "애플리케이션 이름",
    diagApplicationVersion : "애플리케이션 버전",
    diagServiceURL : "서비스 URL",
    diagDevicePlatform : "디바이스 플랫폼",
    diagDeviceVersion : "디바이스 버전",
    diagScreenResolution : "화면 해상도",
    diagAirplaneMode : "통신제한 모드",
    diagUsingNetwork : "네트워크 사용",
    diagWifiName : "WiFi 이름",
    diagMobileNetworkType : "모바일 네트워크 유형",
    diagCarrierName : "운송업자 이름",
    diagErrorCode : "오류 코드",
    diagErrorMessage : "오류 메시지",
    diagHttpStatus : "HTTP 상태",
    diagIPAddress : "IP 주소",
    directUpdateNotificationTitle : '업데이트 사용 가능',
    directUpdateNotificationMessage : '애플리케이션을 업데이트할 수 있습니다(파일 크기 {0}MB).',
    directUpdateErrorTitle : '업데이트 실패',
    directUpdateErrorMessageNotEnoughStorage : '애플리케이션을 업데이트할 수 있지만 디바이스에 사용 가능한 공간이 부족합니다(필요한 크기: {0}MB, 사용 가능한 공간: {1}MB).',
    directUpdateErrorMessageFailedDownloadingZipFile : '애플리케이션 업데이트 파일 다운로드가 실패했습니다.',
    directUpdateErrorMessageFailedProcessingZipFile : '애플리케이션 업데이트 파일 처리가 실패했습니다.',
    downloadAppWebResourcesPleaseSpecifyAppID : '애플리케이션 자원을 다운로드할 수 없습니다. 설정 화면에서 애플리케이션 ID를 지정하십시오.',
    downloadAppWebResourcesAppIdNotExist : '"{0}" 애플리케이션을 찾을 수 없습니다. 애플리케이션을 Worklight Server에 먼저 배치하십시오.',
    downloadAppWebResourcesPleaseSpecifyAppVersion : '애플리케이션 자원을 다운로드할 수 없습니다. 설정 화면에서 애플리케이션 버전을 지정하십시오.',
    downloadAppWebResourcesSkinIsNotValid : '애플리케이션 자원을 다운로드할 수 없습니다. {0} 스킨이 없습니다. getSkinName()이 유효한 스킨을 해석해 오는지 확인하십시오.',
    downloadAppWebResourcesAppVersionNotExist : '{2}에 대한 앱 "{0}" {1}을(를) 찾을 수 없음',
    deviceAuthenticationFail : '연결 오류',
    downloadAppWebResourcesConnectionToServerUnavailable : '서버에 대한 연결을 사용할 수 없습니다. 애플리케이션 자원을 다운로드할 수 없습니다.',
    // e
    expandWindow : '애플리케이션을 사용하기 위해 확장',
    exit : '종료',
    exitApplication : '애플리케이션 종료',
    error : '오류',
    // f
    // g
    gadgetUpdateAvailable : '애플리케이션 업데이트 사용 가능',
    getNewVersion : '새 버전 가져오기',
    // h
    handleTimeOut : '{0}에 대해 요청 제한시간이 초과되었습니다. 호스트 주소를 애플리케이션에 사용할 수 있는지 확인하십시오(특히 Android 및 iPhone 애플리케이션과 관련하여). ',
    // i
    invalidUsernamePassword : '유효하지 않은 사용자 이름 또는 비밀번호',
    // j
    // k
    // l
    loading : '로드 중',
    login : '로그인',
    // m
    minimize : '최소화',
    // n
    name : '이름:',
    noInternet : '서비스에 대한 연결을 사용할 수 없습니다.',
    notificationTitle : '서비스 알림',
    notificationUpdateFailure : '푸시 알림을 등록하지 못했습니다. 애플리케이션에서 알림을 수신하지 못합니다.',
    notAvailable : '사용 불가능',
    // o
    ok : '확인',
    osxReloadGadget : '애플리케이션을 다시 로드해야 합니다.',
    osxReloadGadgetInstructions : '애플리케이션을 다시 로드하려면 CMD+R을 클릭하십시오.',
    // p
    password : '비밀번호:',
    // q
    // r
    reload : '다시 로드',
    restore : '복원',
    requestTimeout : '애플리케이션이 서비스에 연결하지 못했습니다.',
    responseNotRecognized : '예기치 않은 응답입니다.',
    // s
    settings : '설정',
    serverError : '절차 호출 오류입니다.',
    // t
    tryAgain : '다시 시도',
    // u
    userInstanceAccessViolationException : '등록되지 않은 애플리케이션에 로그인하려고 시도했습니다.',
    unexpectedError : '서버는 애플리케이션의 요청을 처리할 수 없습니다. 나중에 다시 시도하십시오.',
    unresponsiveHost : '서비스를 현재 사용할 수 없습니다.',
    update : '업데이트',
    upgradeGadget : '애플리케이션의 버전이 {0}입니다. 이 애플리케이션의 버전 {1}을(를) 사용할 수 있습니다. 다운로드하여 설치하려면 확인을 클릭하십시오.',
    // v
    // w
    wlclientInitFailure : '오류',
    wlSettings: 'Worklight 설정',
    // x
    // y
    // z
    zzz : ''
});
