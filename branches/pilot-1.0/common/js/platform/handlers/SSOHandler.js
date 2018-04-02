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

define("platform/handlers/SSOHandler", 
	   [ "dojo/_base/declare",     
	     "platform/handlers/LoginHandler",
	     "platform/auth/UserAuthenticationManager",
	     "platform/ui/control/BusyIndicator",
	     "platform/logging/Logger",
	     "dojo/Deferred"
],
function(declare, LoginHandler, UserAuthenticationManager, BusyIndicator, Logger, Deferred) {
	return declare( LoginHandler, {
		name: 'SSOHandler',
		SSO_DIALOG_RESOURCE: 'SSODialogResource',
		
		/*
		 * Retrieves the username from somewhere (like the device) that is not the standard login form
		 * This is necessary in Device Single Sign On environments where you don't want to prompt with a login form.
		 * 
		 * This is needed for signing the local json store.
		 * RETURN a string containing the User Name
		 */
/**@memberOf platform.handlers.SSOHandler */
		retrieveUserNameFromSSO: function() {	
			var deferred = new Deferred();
			Logger.trace('[SSOHandler.retrieveUserNameFromSSO]: null');
			deferred.resolve(null);
			return deferred.promise;
		},
		
		
		performSSOLogin: function(){
				var username = this.retrieveUserNameFromSSO();
				var self=this;
				username.then(function(username) {
					if (username) {
					//Clear on next try
					self.ui.hideCurrentDialog();
					loginDeferred = UserAuthenticationManager.login(username, "wilson", false);
					
					loginDeferred.
						then(function() {
							self.afterLogin(true);
						}).
						otherwise(function(error) {
							BusyIndicator.hide();
							var ssoDialog = self.application.getResource(self.SSO_DIALOG_RESOURCE);
							if (ssoDialog) {
								var ssoError = ssoDialog.getCurrentRecord();
								if (error.errorMsg) {
									ssoError.set('errorMsg', error.errorMsg);
								} else {
									ssoError.set('errorMsg', JSON.stringify(error));
								}
							}
							self.ui.show('Platform.SSOError');
						});
					} else {
						Logger.error("Cannot retrieve username from SSO Challenge Handler");					
						self.ui.show('Platform.SSOUserNameError');
					}
				}).otherwise(function(error) {
					Logger.error("Error returning username from SSO " + error);
					var ssoDialog = self.application.getResource(self.SSO_DIALOG_RESOURCE);
					if (ssoDialog) {
						var ssoError = ssoDialog.getCurrentRecord();
						if (error.errorMsg) {
							ssoError.set('errorMsg', error.errorMsg);
						} else {
							ssoError.set('errorMsg', JSON.stringify(error));
						}
					}
					self.ui.show('Platform.SSOUserNameError');
				});
			},
		
	});
});
