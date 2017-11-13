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

define("platform/auth/WASLTPAChallengeHandler", [ 
	"dojo/_base/lang",
	"platform/logging/Logger"
], function(lang, Logger) {
	
	var instance = null;
	var ltpaToken = null;
	
	return {
		
		_classBody: {
/**@memberOf platform.auth.WASLTPAChallengeHandler */
			isCustomResponse: function(response) {
	            Logger.trace('isCustomResponse: ' + JSON.stringify(response));
	            if(response &&
	            		response.request &&
	            		response.request.parameters &&
	            		response.request.parameters.realm == 'WASLTPARealm') {
	            	return true;
	            }
	            else {
	            	return false;
	            }
	        },
	        
	        handleChallenge: function(response) {
	            Logger.trace('handleChallenge: ' + JSON.stringify(response));
	            if(response &&
	            		response.responseJSON &&
	            		response.responseJSON.WASLTPARealm &&
	            		response.responseJSON.WASLTPARealm.isUserAuthenticated) {
	            	this.submitSuccess();
	            }

	        },
	        
			isAuthenticated: function(response) {
				Logger.trace('LDAP response: ' + JSON.stringify(response));
				if(response &&
	            		response.responseJSON &&
	            		response.responseJSON.WASLTPARealm &&
	            		response.responseJSON.WASLTPARealm.isUserAuthenticated) {
					ltpaToken = response.responseJSON.WASLTPARealm.attributes.LtpaToken;
					return true;
				}
				else {
					ltpaToken = null;
					return false;
				}
			},
			
			getLTPAToken: function() {
				return ltpaToken;
			},
			
			getAuthURL: function() {
				return 'j_security_check';
			},
			
			getRealmName: function() {
				return 'WASLTPARealm';
			},
			
			getLoginOptions: function(user, pwd) {
				return {
						parameters: {
							'j_username': user,
							'j_password': pwd,
							'realm': 'WASLTPARealm' 
						}
				};
			}
		},
		
		getInstance: function() {
			return (instance = instance || lang.mixin(
					WL.Client.createChallengeHandler('WASLTPARealm'),
					this._classBody
			));
		},
		
		
		
	};
	
});
