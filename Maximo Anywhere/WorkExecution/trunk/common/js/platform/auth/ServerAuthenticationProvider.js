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

define("platform/auth/ServerAuthenticationProvider", [
	"dojo/_base/lang",
	"dojo/Deferred",
	"platform/logging/Logger",
	"platform/auth/CustomChallengeHandler",
	"platform/auth/WASLTPAChallengeHandler",
	"platform/store/SystemProperties",
	"platform/auth/OfflineLogout",
	"platform/comm/_ConnectivityChecker",
], function(lang, Deferred, Logger, CustomChallengeHandler, WASLTPAChallengeHandler, SystemProperties, OfflineLogout, ConnectivityChecker) {
	
	return {
		
/**@memberOf platform.auth.ServerAuthenticationProvider */
		login: function(user, pwd) {	
			var deferred = new Deferred();
			var challengeHandler = this._getChallengeHandler();
			Logger.trace('ServerAuthenticationProvider.login');
			challengeHandler.login(user, pwd, deferred);
			return deferred.promise;
		},
	
		logout: function() {
			var deferred = new Deferred();
			ConnectivityChecker.checkConnectivityAvailable().
			then(lang.hitch(this, function(isConnectionAvailable){
				if (isConnectionAvailable) {
					var challengeHandler = this._getChallengeHandler();
					challengeHandler.logout(deferred, this._logoutCallBack);
				} else {
					this._logoutCallBack(deferred);
				}
			}));
			return deferred.promise;
		},
		
		_logoutCallBack: function(deferred) {
			deferred.resolve(OfflineLogout.logoutWithPromise());
		},
		
		_getChallengeHandler: function() {
			return CustomChallengeHandler;
		},
		
		setCredentials: function(user, pwd) {
			// keep them in the challenge handler
			this._getChallengeHandler().setCredentials(user, pwd);
		},
		
	};
	
});
