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

define("platform/auth/OfflineLogout",
      ["dojo/_base/lang",
       "platform/logging/Logger",
       "dojo/Deferred"
       ],
function(lang, Logger, Deferred) {
	function expireSessionId(){
		var sessionId = WL.CookieManager.getJSessionID();
		var expires = new Date(1970,0,1,12,12,12).toGMTString();
		document.cookie = "JSESSIONID=" + sessionId +"; expires=" + expires + "; path=/"; 
		WL.CookieManager.clearCookies();
	};
	return {		
/**@memberOf platform.auth.OfflineLogout */
		logoutWithPromise: function(){
			var deferred = new Deferred();
			Logger.trace("Offline logout");
			if(typeof cordova === "undefined") {
				/* browser behavior */
				expireSessionId();
				deferred.resolve();
			}
			else{
				if(WL.Client.getEnvironment() != WL.Environment.PREVIEW) {
					WL.CookieManager.clearCookies();
				    if (WL.Client.getEnvironment() == 'windows8') {
				        WL.App.getServerUrl(
                            // success
                            function (serverUrl) {
                                Logger.trace("server url = " + serverUrl);
                                var cm = new Windows.Web.Http.Filters.HttpBaseProtocolFilter().cookieManager;
                                var cookieJar = cm.getCookies(new Windows.Foundation.Uri(serverUrl));
                                for(var i=0; i<cookieJar.length; i++){
                                    var cookie = cookieJar[i];
                                    //Logger.trace('Removing Cookie: {' + cookie.name + ': ' + cookie.value + '}');
                                    cm.deleteCookie(cookie);
                                }
                                Logger.trace('Offline Logout cookie removal succeeded.');
                                deferred.resolve();
                            },
                            // failure
							function () {
							    Logger.trace("Offline Logout failed.  could not get server url");
							    deferred.reject("Offline Logout - failed");
							}
					    );

				    }
				    else {
						cordova.exec(
								function() { 
									Logger.trace("Offline Logout - completed");
									deferred.resolve(); 
								}, 
								function() { 
									Logger.trace("Offline Logout - failed"); 
									deferred.reject("Offline Logout - failed"); 
								}, 
								"OfflineLogoutPlugin", 
								"logout", []
						);
				    }
				}
				else{
					/* browser behavior */
					expireSessionId();
					deferred.resolve();
				}				
			}
			return deferred.promise;
		}
	};
});
