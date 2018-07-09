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

define("platform/auth/CustomChallengeHandler", [ 
	"dojo/_base/lang",
	"dojo/Deferred",
    "dojo/topic",
	"platform/logging/Logger",
	"platform/handlers/SSOHandler",
	"platform/auth/SecureRequestManager"
	
], function(lang, Deferred, topic, Logger, SSOHandler, SecureRequestManager) {
	
	var CUSTOM_AUTH_REALM_NAME = 'CustomAuthenticationRealm';
	WL.Client.login(CUSTOM_AUTH_REALM_NAME);
	var customChallengeHandler = WL.Client.createChallengeHandler(CUSTOM_AUTH_REALM_NAME);
	var _username = null;
	var _password = null;
	var UserAuthenticationManager = null;
	var SystemProperties = null;
	
	require(["platform/auth/UserAuthenticationManager", "platform/auth/ServerAuthenticationProvider", "platform/store/SystemProperties"], 
			function(_UsrAuthManager, _SrvAuthProvider, _SysProps) {
				UserAuthenticationManager = _UsrAuthManager;
				ServerAuthenticationProvider = _SrvAuthProvider;
				SystemProperties = _SysProps;
			}
	);
	
	return lang.mixin(customChallengeHandler, {
			
		/* CUSTOMIZERS
		 * If you plan on writing your own CustomChallengeHandler
		 * override these next methods with a mixin.
		 */
		
		/*
		 * evaluates the response from server, if authStatus is returned, 
		 * then, we determine if this is a response from CustomAuthenticatorRealm.
		 */
/**@memberOf platform.auth.CustomChallengeHandler */
		isCustomResponse: function(response) {
			if(!response || !response.responseJSON) {
				Logger.trace('[CustomChallangeHandler.isCustomResponse] false - no response or no JSON response');
				return false;
			}
			if(response.responseJSON.authStatus || (UserAuthenticationManager._isServerLoginFailure(response) && !UserAuthenticationManager.isCachingUserInfo())){
				Logger.trace('[CustomChallangeHandler.isCustomResponse] true - authStatus');
				return true;
			}
			else {
				Logger.trace('[CustomChallangeHandler.isCustomResponse] false');
				return false;
			}
		},
		
		/*
		 * Send Login credentials to your authentication service, you are passed a user and password from the login form
		 * 
		 * ATTN: You do not return a response to this method, you resolve or reject the passed in deferred thread
		 * based on the asynchronous response from the server.
		 * 
		 * If you override this method, don't forget to indicate that you're in the middle of authentication
		 * by setting and checking the isAuthenticating boolean to handle possible multiple threads.
		 * 
		 */
		login: function(user, pwd, deferred) {
		
			this.isAuthenticating = true;
			var self = this;
			var sysPropDeferred = SystemProperties.loadPlatformProperties();
			sysPropDeferred.always(function(){
				self.getLoginOptions(user, pwd)
				.then(lang.hitch(self, function(loginOptions) {
					Logger.trace('CustomChallengeHandler login calling submitLoginForm');
					var resubmit = true; 
					var afterSubmit = function(response) {
						Logger.trace('CustomChallengeHandler.sendLogin');
						if(self._isAuthenticated(response)) {
							Logger.trace('[CustomChallengeHandler] User successfully authentication against realm "' + self.REALM + '"');								
							deferred.resolve(response);
							self.isAuthenticating = false;
						}
						else if (resubmit && (response['responseJSON'] && response['responseJSON']['challenges'] && response['responseJSON']['challenges']['wl_antiXSRFRealm']) || response.status == '500'){
								//This is the XSRF error.  So call the client login to get the token needed to get past this
								//The submit the login again
								WL.Client.login(CUSTOM_AUTH_REALM_NAME);
								resubmit = false;
								self.submitLoginForm(self.getAuthURL(), loginOptions, lang.hitch(self,afterSubmit)); 
						}
						else if (resubmit && response['responseJSON'] && response['responseJSON']['oslcError'] && response['responseJSON']['oslcError'] == "401" && response.status == '200'){
							//This is the a session timeout error.  So call the client login to get the token needed to get past this
							//The submit the login again to avoid display the login view
							WL.Client.login(CUSTOM_AUTH_REALM_NAME);
							resubmit = false;
							self.submitLoginForm(self.getAuthURL(), loginOptions, lang.hitch(self,afterSubmit)); 
						}
						else{
							var responseError = self._parseAuthenticationError(response);
							deferred.reject(responseError);
							self.isAuthenticating = false;
						}
					};
					self.submitLoginForm(self.getAuthURL(), loginOptions, lang.hitch(self,afterSubmit)); 
			}));
			});
		},
		
		/*
		 * CUSTOMIZERS: End of methods to override with your mixin
		 */
		
		/* invoked by WL authentication framework always when isCustomResponse returns true
		 */
		handleChallenge: function(response) {
			if (response.request)
				Logger.trace("handleChallenge url: " + response.request.url);
			var self = this;	
			require(["platform/boot/main/Main"], 
					function(Main) {
				
			if (!window.UI) {
				//Gotta load up the app for the SSO case where the ChallengeHandler fires before the Startup.js
				new Main().start();
			}
						
			//Go get the username from the potential SSO Handler
			var mySSOHandler = window.UI.application["platform.handlers.SSOHandler"];
			var userName = mySSOHandler.retrieveUserNameFromSSO(); 
			userName.then(function(userName) {
				//To support SSO-type authentication store off the username
				if (userName) {
					_username = userName;
					_password = "wilson";
				}	
				var authStatus = response.responseJSON && response.responseJSON.authStatus;
				if (authStatus){
					Logger.trace('[CustomChallangeHandler.handleChallenge] authStatus: ' + authStatus);
				}
				//Assuming reverse proxy if authStatus is undefined and not a _isServerLoginFailure
				var needToLogin =  _username && ((authStatus == 'required' || UserAuthenticationManager._isServerLoginFailure(response)) || !authStatus);
				if(needToLogin) {
					
					// MM improve memory utilizaiton 
					//Logger.trace('[CustomChallangeHandler.handleChallenge] challenge request: ' + JSON.stringify(response.request.body));
					var prevAuth = UserAuthenticationManager.previouslyAuthenticated();
					if(!self.isAuthenticating) {
						SecureRequestManager.enableAuthLock();
						Logger.trace('[CustomChallangeHandler.handleChallenge] Start realm authentication for user ' + _username);
						var authDeferred = new Deferred();
						UserAuthenticationManager._realmAuthentication(_username, _password, prevAuth, authDeferred, null);
						authDeferred
						.then(lang.hitch(self, function(response) {
							Logger.trace('[CustomChallangeHandler.handleChallenge] User ' + _username + ' successfully authenticated, processing waiting list request');
							//In the SSO Case where the challenge handler fires first, we might need to setup the application
							if (window.UI.application.isSSOEnabled() && mySSOHandler.needsLogin())
							{
								mySSOHandler.afterLogin(true);	
							}
							if(SecureRequestManager.hasPendingRequest()){
								this.submitFailure(); //Seems weird but doing this to prevent WL from resending requests with invalid credentials.
								SecureRequestManager.resendRequestsAfterAuth(UserAuthenticationManager._getSessionId());
							}
							else{
								//Something other than SecureRequestManager made the request so submit success to promise with be resolved.
								this.submitSuccess();
							}
						}))
						.otherwise(lang.hitch(self, function(response) {
							var errorResponse = UserAuthenticationManager._handleAuthenticationError(response, prevAuth);
							if (errorResponse.errorCode != 'reAuthError'){
								Logger.trace('CustomChallangeHandler.handleChallenge: call to _realmAuthentication failed.');
								SecureRequestManager.authorizationFailed(errorResponse);
							}
							else {
							    SecureRequestManager.clearLock();
							}
							this.submitFailure();
						}));
					}
					else if (UserAuthenticationManager.isCachingUserInfo()){
						//Just in case an auth error happens while fetching the user data.  Error everything out so the app isn't hung
						if (response && response.responseJSON){
							response['invocationResult'] = response.responseJSON;
						}
						SecureRequestManager.authorizationFailed(response);
						self.submitFailure();
					}
					else {
						Logger.trace('[CustomChallangeHandler.handleChallenge] waiting for authentication response...');
					}
					
				}
				else if(authStatus == self.COMPLETE) {
					Logger.trace('[CustomChallangeHandler.handleChallenge] submitSuccess()');
					self.submitSuccess();
				} else {
					Logger.trace('[CustomChallangeHandler.handleChallenge] submitFailure()');
					SecureRequestManager.authorizationFailed(response);
					self.submitFailure();
				}
			}).
			otherwise(function(error) {
				Logger.trace('[CustomChallangeHandler.handleChallenge] no username is set yet');					
			});
			});
		},
		
		
		getAuthURL: function() {
			return this.CUSTOM_AUTH_URL;
		},
		
		getLoginOptions: function(user, pwd) {
			// keep credentials up-to-date
			_username = user;
			_password = pwd;
			var langcode = WL.App.getDeviceLocale().replace('_','-');
			var deferred = new Deferred();
			SystemProperties.getAuthType()
			.then(function(authType) {
				 var options = {
						 parameters: {
							 'username': user,
							 'password': pwd,
							 'authType': authType,
							 'langcode': langcode
					}
				 };
				 deferred.resolve(options);
			});
			return deferred.promise;
		},
		
		setCredentials: function(user, pwd) {
			_username = user;
			_password = pwd;
		},
		
		getRealmName: function() {
			return this.REALM;
		},
		
		logout: function(deferred, logoutCallBack) {
			var realm = this.getRealmName();
			WL.Client.logout(realm, {
				onSuccess: function() {					
					Logger.trace('Logout from ' + realm + ' completed');
					logoutCallBack(deferred);
				},
				onFailure: function(error) {
					// MM improve memory utilization remove json.stringify object 
					//Logger.log('Logout from ' + realm + ' failed, error: ' + JSON.stringify(error));
					logoutCallBack(deferred);
				}
			});
		},
		
		isAuthenticating: false,
		REALM: CUSTOM_AUTH_REALM_NAME,
		CUSTOM_AUTH_URL: 'my_custom_auth_request_url',
		COMPLETE: 'complete',
		
		/*
		 *  evaluates the response from server to parse the error
		 *  RETURNS the authentication error as a JSON style object for logging
		 */
		_parseAuthenticationError: function(response) {
			var responseError = null; 
			if(response && response.responseJSON) {
				responseError = {
						responseJSON: {
							oslcError: response.responseJSON.oslcError ? response.responseJSON.oslcError : 'null oslcError',
							oslcMaxUserURL: response.responseJSON.oslcMaxUserURL ? response.responseJSON.oslcMaxUserURL : 'null oslcMaxUserURL'
						},
						status: response.status ? response.status : 'null status'
				};
			}
			else {
				responseError = {
						responseJSON: {
							oslcError: 'null oslcError',
							oslcMaxUserURL: 'null oslcMaxUserURL'
						},
						status: response.status ? response.status : 'null status'
				};
			}
			return responseError;
		},
		
		/*
		 *  evaluates the response from server, determines if we are authenticated already
		 */
		_isAuthenticated: function(response) {
			var isAuthenticated = false;
			
			if(this.isCustomResponse(response)) {
				isAuthenticated=(response.responseJSON['authStatus'] == this.COMPLETE) ? true : false;
			}
			else {
				isAuthenticated=false;
			}
			
			return isAuthenticated;
		},
		
	});
	
});
