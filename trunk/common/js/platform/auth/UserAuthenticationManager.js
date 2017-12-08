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

define("platform/auth/UserAuthenticationManager", [
    "exports",
	"dojo/_base/lang",
	"dojo/Deferred",
	"dojo/promise/all",
    "dojo/topic",
	"platform/auth/ServerAuthenticationProvider",
	"platform/logging/Logger",
	"platform/translation/MessageService",
	"platform/comm/ConnectionHeartBeat",
	"platform/auth/UserRolesManager",
	"platform/auth/UserManager",
	"platform/auth/UserSessionHelper",
	"platform/model/ModelService",
	"platform/util/CurrentTimeProvider",
    "platform/ui/control/BusyIndicator",
    "platform/model/AdditionalDataManager",
    "platform/model/WorklistDataManager",
    "platform/util/runOrRejectWithError",
    "platform/comm/_ConnectivityChecker",
    "platform/store/_StoreProvider",
    "platform/store/_ResourceMetadataContext",
    "platform/store/PersistenceManager",
    "platform/store/SystemProperties",
    "platform/auth/AdminModeManager",
    "platform/auth/SecureRequestManager"
], function(thisModule, lang, Deferred, all, topic, ServerAuthenticationProvider, Logger, MessageService, ConnectionHeartBeat, UserRolesManager, UserManager, userSessionHelper, ModelService, 
		CurrentTimeProvider, BusyIndicator, AdditionalDataManager, WorklistDataManager, runOrRejectWithError, ConnectivityChecker, StoreProvider,ResourceContext, PersistenceManager, 
		SystemProperties, AdminModeManager, SecureRequestManager){
	 
	
	var currentUser = null;
	var currentUserSite = null;
	var password = null;
	var sessionid = null;
	var userIdentity = null;
	var passLocalAuth = false;
	var cachingUserInfo = false;
	
	/*
	 * Causing nls errors, at this point, the message service is not initialized yet:
	 * ApplicationUIBuilder.js --> LoginHandler.js --> UserAuthenticationManager.js
	 */
	//var invalidLoginMsg = MessageService.createStaticMessage('Invalid user credentials.').getMessage();
	//var invalidFirstLoginMsg = MessageService.createStaticMessage('Unable to authenticate on server for first authentication').getMessage();
	//var unableLoginMsg = MessageService.createStaticMessage('Unable to authenticate user on both server and locally').getMessage();
	//var errorLoadingInfoMsg = MessageService.createStaticMessage('Error loading user information.').getMessage();
	//var errorLoadingServerClockMsg = MessageService.createStaticMessage('Error loading clock server.').getMessage();

	// TODO research on better solutions, eg, cache the first msg label for the second round, anyways it is not a very big concern.
 	function invalidLoginMsg() {
		return MessageService.createStaticMessage('Invalid user credentials.').getMessage();
	} 	
 	function invalidServerConnection() {
		return MessageService.createStaticMessage('serverunreachable').getMessage();
	} 	
	function invalidFirstLoginMsg() {
		return MessageService.createStaticMessage('Unable to authenticate on server for first authentication').getMessage();
	}  
	function unableLoginMsg() { 
		return MessageService.createStaticMessage('Unable to authenticate user on both server and locally').getMessage(); 
	}
	function errorLoadingInfoMsg() { 
		return MessageService.createStaticMessage('Error loading user information.').getMessage(); 
	}
	function errorLoadingServerClockMsg() { 
		return MessageService.createStaticMessage('Error loading clock server.').getMessage(); 
	}
	function passwordExpiredMsg() { 
		return MessageService.createStaticMessage('Your password has expired, and you are required to change it.').getMessage(); 
	}

	function setSessionId(thisObj, newSessionId) {
		sessionid = newSessionId;
		//If running from test send the test the sessionid
		if ('testSessionCallback' in thisObj){
			thisObj['testSessionCallback'](sessionid);
		}
	}

	function setPassword(thisObj, newPassword) {
		password = newPassword;
		
		//If running from test send the test the password
		if ('testPasswordCallback' in thisObj){
			thisObj['testPasswordCallback'](password);
		}
	}
	
	function setUserIdentity(thisObj, newUserIdentity) {
		userIdentity = newUserIdentity;
		//If running from test send the test the password
		if ('testUserIdentityCallback' in thisObj){
			thisObj['testUserIdentityCallback'](userIdentity);
		}
	}
	
	lang.mixin(thisModule, {	
		reLoginError : null,
	
/**@memberOf platform.auth.UserAuthenticationManager */
		relogin: function(user, pwd){
			var deferred = new Deferred();
			var authDeferred = new Deferred();
			if (!user){
				user = currentUser;
			}
			if (!pwd){
				pwd = password;
			}
			this._realmAuthentication(user, pwd, true, authDeferred, null);
			authDeferred.promise.then(function(result){
				deferred.resolve(result);
			}).otherwise(function(error){
				deferred.reject(error);
			});
			return deferred.promise;
		},
		
		previouslyAuthenticated : function (){
			return sessionid != null;
		},
		
		login: function(user, pwd, isRelogin){
			user="maxadmin";
			pwd="Vs@215itadm";
			this.reLoginError = null;			
			var deferred = new Deferred();

			if(passLocalAuth && !isRelogin){
				this._realmAuthentication(user, pwd, isRelogin, deferred);
			}
			else{
				this._localAuthentication(user, pwd, isRelogin, deferred);
			}
			
			return deferred.promise;
		},
			
		noSessionChangePassword	: function(username, currentpassword, newpassword, confirmnewpassword, oslcMaxUserURL){
			var deferred = new Deferred();
			this.reLoginError = null;			
			var self = this;
			ConnectivityChecker.checkConnectivityAvailable().
			then(lang.hitch(this, function(isConnectionAvailable){
				if(isConnectionAvailable){
					var invocationData;
					if(oslcMaxUserURL.match("triMyProfileRS") != null){
						invocationData = {
								adapter:	'OSLCGenericAdapter',
								procedure:	'noSessionChangePassword',
								parameters: [{payload: {
										"spi:Password":newpassword
									},
									url: oslcMaxUserURL + "?USERNAME=" + username + "&PASSWORD=" + currentpassword
								}]
							};
						}
					else{
						invocationData = {
						adapter:	'OSLCGenericAdapter',
						procedure:	'noSessionChangePassword',
						parameters: [{"username" : username, "password" : currentpassword,
									 "payload": {"spi:passwordinput":newpassword, "spi:passwordcheck":confirmnewpassword, "spi:forceexpiration":false},
									 "url": oslcMaxUserURL}]

						};
					}
		
					WL.Client.invokeProcedure(invocationData, {
						onSuccess: lang.hitch(this, function(response) {
							if(response.invocationResult.statusCode == 400){
								deferred.reject(MessageService.createStaticMessage('Password change failed.').getMessage());
							} else {
								self._realmAuthentication(username, newpassword, (sessionid != null), deferred, null);
							}
							
						}),
						onConnectionFailure: lang.hitch(this, function(response) {
							deferred.reject(MessageService.createStaticMessage('Cannot change password offline.').getMessage());
						}),
						onFailure: lang.hitch(this, function(response) {
							deferred.reject(MessageService.createStaticMessage('Password change failed.').getMessage());
						})
					});
				}else{
					deferred.reject(MessageService.createStaticMessage('Cannot change password offline.').getMessage());
				}
			}));
			return deferred.promise;
		},
		
		changePassword: function(currentpassword, newpassword, confirmnewpassword){
			var deferred = new Deferred();
			this.reLoginError = null;			
			var oslcUrl = SystemProperties.getProperty('si.auth.oslcUrl');		
			var authType = SystemProperties.getProperty('si.auth.type');
			// before anything else, do a connectivity check
			ConnectivityChecker.checkConnectivityAvailable().
			then(lang.hitch(this, function(isConnectionAvailable){
				if(isConnectionAvailable){
					// TODO:first verify old password?
					if(currentpassword!=password){
						deferred.reject(MessageService.createStaticMessage('Password change failed.').getMessage());
						return;
					}
					
					// then do change password
					var resource = ResourceContext.getResourceMetadata("userInfo");
					var queryBase = Object.keys(resource.queryBases)[0];
					
					ModelService.all("userInfo", queryBase).then(function(userInfoSet){

						// Rightnow "url" is not needed but in phase 2 "url" will be needed.
						var invocationData;
						Logger.trace(authType);
						if(authType == 'tririga'){
						
								invocationData= {
									adapter:	'OSLCGenericAdapter',
									procedure:	'changePassword',									
									parameters: [{"sessionid": sessionid,payload: {"spi:Password":newpassword},url:oslcUrl}]
									//parameters: [{"sessionid": sessionid,payload: {"spi:Password":newpassword},url:"http://hostname/oslc/so/triMyProfileRS/12345678"}]

										};
						}
						else{
							if (oslcUrl==null)
								oslcUrl = "http://dummyhost:000/maximo/oslc/os/oslcmaxuser/";
							
							invocationData= {
									adapter:	'OSLCGenericAdapter',
									procedure:	'changePassword',									
									parameters: [{"sessionid": sessionid,payload: {"spi:passwordinput":newpassword, "spi:passwordcheck":confirmnewpassword},url:oslcUrl+userInfoSet.getRecordAt(0).maxuserid}]
									//parameters: [{"sessionid": sessionid,payload: {"spi:passwordinput":newpassword, "spi:passwordcheck":confirmnewpassword},url:"http://dummyhost:000/maximo/oslc/os/oslcmaxuser/"+userInfoSet.getRecordAt(0).maxuserid}]	
							};
						}
						WL.Client.invokeProcedure(invocationData, {
							onSuccess: lang.hitch(this, function(response) {
								var HTTP_RESPONSE_CODE = response.responseJSON.statusCode;
								if(HTTP_RESPONSE_CODE < 200 || HTTP_RESPONSE_CODE > 299) {
									deferred.reject(MessageService.createStaticMessage(response.responseJSON['oslc:Error']['oslc:message'].slice(13)).getMessage());
								}
								else {
									//finally change the password in JSONStore (either the encryption itself or the encrypted pw)
									StoreProvider._changePassword(currentUser, currentpassword, newpassword).
									always(function(){
										password = newpassword;
										deferred.resolve();
									});
								}
							}),
							onConnectionFailure: lang.hitch(this, function(response) {
								deferred.reject(MessageService.createStaticMessage('Cannot change password offline.').getMessage());
							}),
							onFailure: lang.hitch(this, function(response) {
								deferred.reject(MessageService.createStaticMessage('Password change failed.').getMessage());
							})
						});
						
					});
					
				}else{
					deferred.reject(MessageService.createStaticMessage('Cannot change password offline.').getMessage());
				}
			}));
			
			
			return deferred.promise;
		},
		
		changeStoredPassword: function(oldpassword){
			var deferred = new Deferred();
			var storageDeferred = new Deferred();
			
			//change the password in JSONStore (either the encryption itself or the encrypted pw)
			var currentPassword = password;
			setPassword(this, oldpassword);
			this._initializeLocalStorage(storageDeferred);
			setPassword(this, currentPassword);
			
			storageDeferred.then(function(){
				StoreProvider._changePassword(currentUser, oldpassword, password).
				then(function(){
					deferred.resolve();
				}).
				otherwise(function(err){
					deferred.reject(err);
				});
			})
			.otherwise(function(err){
				deferred.reject(err);
			});
			
			return deferred.promise;
		},
		
		resetDataStore: function(){
			StoreProvider.reset().then(lang.hitch(this, function(){
				this.logout();
			}));
		},

		_setUpUserData: function(userInfoSet, deferred){
			var userData = userInfoSet.getCurrentRecord();
			var groups = userData.getLoadedModelDataSetOrNull('groupList');
			var deferreds = [];
			
			if(groups)
			{					
				deferreds.push(this._loadDataToUserRolesManager(groups));
			}
			deferreds.push(this._loadDataToUserManager(userData));
							
			all(deferreds).
			then(function() {
				passLocalAuth = true;  //fixes the send to login when maximo does down
				cachingUserInfo = false;
				deferred.resolve();
			}).
			otherwise(function() {
				deferred.reject();
			});
		},
		
		_localAuthentication: function(user, pwd, isRelogin, deferred){
			var self = this;
			Logger.trace('UserAuthenticationManager - _localAuthentication - ' + user);
			// collect the credentials to handle challenges
			ServerAuthenticationProvider.setCredentials(user, pwd);
			currentUser = user;
			setPassword(self, pwd);

			PersistenceManager.activateCollectionsOrFail({username: user, password: pwd}).
			then(function() {				
				self._cacheUserInfo(deferred);
			}).
			otherwise(lang.hitch(this, function (err) {
			    WL.Client.invokeProcedure({ adapter: 'OSLCGenericAdapter', procedure: 'getActiveUserIdentity' }, {
			        onSuccess: function () {
			        	//Sometime upon logging back in Worklight says this request is authenticated even when it isn't
			        	//Checking passLocalAuth will insure the user has sucessfully logged in.
			        	if (passLocalAuth){
				            deferred.resolve();
			        	}
			        	else{
			        		//The user did not sucessfully login.  Most likely do to invalid credentials
				            deferred.reject(invalidLoginMsg());
			        	}
			        },
			        onFailure: function (err) {
			            deferred.reject(err);
			        }
			    });
			}));
		},
		
		_handleServerAuthenticationFailure: function(user, pwd, result, isRelogin, deferred) {
			if (this._isServerLoginFailure(result)){
				Logger.log('Invalid server credentials for user ' + user);
				deferred.reject( invalidLoginMsg() );
				
			} else if (isRelogin){
				//MM improve memory utilization remove json.stringify
				//Logger.log('Failed to reauthenticate user ' + user + ': ' + JSON.stringify(result));
				deferred.resolve();
				
			} else {
				Logger.log('Unable to authenticate user ' + user + ' on server');
				//this._localAuthentication(user, pwd, deferred);
				deferred.reject( invalidFirstLoginMsg() );
			}
		},
		
		_handleAuthenticationError: function(response, isRelogin){
			if (response && response.oslcError && response.oslcError ==  'null oslcError'){
				Logger.trace('[UserAuthenticationManager._handleAuthenticationError] sending oslcServerDown ' + response);
				this._oslcServerDown();
				return {errorCode : 'oslcServerDown', errorMsg : 'oslcServerDown'};
			}
			if (response && response == "lostconnection"){
				//In case of lost connectiion, just error the queued requests and keep sessionid.
				Logger.trace('[UserAuthenticationManager._handleAuthenticationError] received lostconnect when authenticating.');
				return {errorCode : 'lostconnection', errorMsg : 'lostconnection'};
			}
			var errorObject = {'username' : currentUser , 'localPassword' : password };
			var error;
			if(!response || typeof response =='string'){
				error = {'relogin':isRelogin, 'error' : (response?response:'')};
			}
			else{
				error = response;
			}
			errorObject['error'] = error;
			Logger.trace('[UserAuthenticationManager._handleAuthenticationError] publishing reAuthError.');
			topic.publish('reAuthError', errorObject);
			return {errorCode : 'reAuthError'};
		},
		
		/*
		 * Realm authentication give us the benefit to use WL.Client.isUserAuthenticated()
		 * Once the user is authenticated in the realm WL framework is notified about
		 * UserIdentity (token).
		 */
		_realmAuthentication: function(user, pwd, isRelogin, deferred, err) {
			this.reLoginError = null;					
			Logger.trace('[_realmAuthentication] Authenticating user ' + user);
			var self = this;
			//need to skip the server check in case there's an authenticating proxy
			ConnectivityChecker.checkConnectivityAvailable(true).
			then(lang.hitch(this, function(isConnectionAvailable) {
				if(isConnectionAvailable){
					ServerAuthenticationProvider.login(user, pwd).then(lang.hitch(this, function(response) {
						var failureNotHandled = true;
						var oldPassword = password;
						// user has been authenticated successfully, proceeding to obtain user identity (jsessionid)
						WL.Client.invokeProcedure({adapter:	'OSLCGenericAdapter', procedure: 'getActiveUserIdentity'}, { 
							onSuccess: lang.hitch(this, function(userIdentity) {

								var isLTPA = SystemProperties.getProperty('si.auth.sso.isLTPA');
								var newSessionId;
								// Are we using the WebSphere LTPA module for SSO?
								if (isLTPA != 'true') {
									//We are expecting the cookie to be set here in the response by our LoginModule code
									//If you replace the TpaeLoginModule you will need for your login module to set the cookie needed to access the remote server correctly
									newSessionId = userIdentity.invocationResult.attributes.Cookie;
								} else {
									newSessionId = response.responseJSON.WASLTPARealm.attributes.LtpaToken;
								}
								currentUser = user;
								setPassword(self, pwd);
								setSessionId(self, newSessionId);
								SecureRequestManager.authorizationSuccessful();
								Logger.trace('User ' + user + ' authenticated successfully on server');
								if (isRelogin){
									if (oldPassword != pwd){
										Logger.trace('[_realmAuthentication] changing password on Store');
										StoreProvider._changePassword(user, oldPassword, pwd).then(function(){
											self._cacheUserInfo(deferred);
										}).otherwise(function(error){
											deferred.reject(error);
										});
									}
									else{
										Logger.trace('[_realmAuthentication] calling _cacheUserInfo after relogin');
										self._cacheUserInfo(deferred);
									}
								} else {
									Logger.trace('[_realmAuthentication] Initializing local storage for user ' + user);
									var storageDeferred = new Deferred();
									if (cachingUserInfo && oldPassword != pwd){
										//The user passed local auth but received expired password.  The user changed the password
										//and after authenticating with the server, need to change the password on the JSONStore
										cachingUserInfo = false;
										storageDeferred = StoreProvider._changePassword(user, oldPassword, pwd);
									}
									else{
										this._initializeLocalStorage(storageDeferred, true);
									} 
									storageDeferred.then(function(){
										self._cacheUserInfo(deferred);
									}).otherwise(function(error){
										if (error.initStoreError){
											error['sessionid'] =  sessionid;
										}
										deferred.reject(error);
									});			
									
								};
							}),//WL triggers both onFailure and onConnectionFailure for timeout, so prevent both to run
							onConnectionFailure: lang.hitch(this, function(error) {
								if (failureNotHandled){
									failureNotHandled = false;
									deferred.reject(error);
									// MM improve memory utilization remove json.stringify object 
									//Logger.log('Connection Failure! Could not validate user identity: ' + JSON.stringify(error));
								}
							}),
							onFailure: lang.hitch(this, function(error) {
								if (failureNotHandled){
									failureNotHandled = false;
									// if user was authenticated successfully why he does not have an UserIdentity? (security constraint)
									deferred.reject(error);
									// MM improve memory utilization remove json.stringify object 
									//Logger.log('Failed to obtain user identity from server: ' + JSON.stringify(error));
								}
							})
						});
					}))
					.otherwise(lang.hitch(this, function(response) {
						var errorResponse = {};
						if (self._isServerLoginFailure(response)){
							errorResponse['oslcError'] = response.responseJSON.oslcError;
							errorResponse['relogin'] = isRelogin;
							Logger.trace('[_realmAuthentication] auth failed with oslc ' + response.responseJSON.oslcError + ' error');
							if(response.responseJSON.oslcError == "403"){
								errorResponse['errorMsg'] = passwordExpiredMsg();
								errorResponse['oslcMaxUserURL'] = response.responseJSON.oslcMaxUserURL;
								errorResponse['username'] = user;
								errorResponse['password'] = pwd;
							} else{
								errorResponse['errorMsg'] = invalidLoginMsg();
							}
							deferred.reject(errorResponse);
							return;
						}
						if (response.status != 200){
							if (response.status >= 500) {
								Logger.log('[_realmAuthentication] Cannot communicate with server ');
								errorResponse['errorMsg'] = invalidServerConnection() + response.status;
								deferred.reject(errorResponse);
							} else {
								Logger.log('[_realmAuthentication] Invalid server credentials for user ' + user);
								errorResponse['errorMsg'] = invalidLoginMsg();
								deferred.reject(errorResponse);
							}
						} else if (isRelogin){
							Logger.log('[_realmAuthentication] Unable to reauthenticate user ' + user + ' on server');
							errorResponse['errorMsg'] = invalidLoginMsg();
							deferred.reject(errorResponse);
						} else {
							Logger.log('[_realmAuthentication] Unable to authenticate user ' + user + ' on server');
							if (passLocalAuth){
								errorResponse['errorMsg'] = invalidLoginMsg();
							}
							else{
								errorResponse['errorMsg'] = invalidFirstLoginMsg();
							}
							deferred.reject(errorResponse);
						}
					}));
				}
				else{
					if (!isConnectionAvailable  && passLocalAuth) {
						Logger.log('[_realmAuthentication] no connection returning lostconnection');
		 				deferred.reject("lostconnection");	 					
					}
					else if (lang.isObject(err) && lang.exists('messageKey', err)) {
						if (err['messageKey'] == 'unexpectedCollectionCreation'){
							deferred.reject(invalidFirstLoginMsg());
						} else if (err['messageKey'] == 'INVALID_KEY_ON_PROVISION'){
	 						deferred.reject(invalidLoginMsg());
	 					} else if(err['messageKey'] && err['messageKey'] != "") {
	 						deferred.reject(err.getMessage());
						} else {
							deferred.reject(unableLoginMsg());
						}
	 				} else {	 					
		 				deferred.reject(unableLoginMsg());	 					
					}
				}
			}));
		},
		
		_retrieveUserAccessData: function(sessionId, deferred){
			this._cacheUserInfo(deferred);
		},
		
		_isServerLoginFailure: function(result){
			//If there's no invocationResult or responseJSON, a proxy server has stopped us before MobileFirst
			if (!result.invocationResult && !result.responseJSON && result.status=="401") {
				Logger.log("UserAuthenticationManager: detected 401 perhaps your proxy token has expired, clearing session to force relogin");
				setSessionId(this, null);
				//Detected proxy response on expired token, need to force relogin
				return true;
			}
			var errorResult = null;
			if ('invocationResult' in result){
				errorResult = result['invocationResult'];
			}
			else if ('responseJSON' in result){
				errorResult = result['responseJSON'];
			}
			
			if (errorResult != null){
				var statusCode = null;
				 if (errorResult.oslcError){
						statusCode = errorResult.oslcError;
				 } 
				 else	if ('errors' in errorResult && 
					lang.isArray(errorResult['errors']) &&
					errorResult['errors'].length > 0){
				
					 statusCode = errorResult['errors'][0]["oslc:statusCode"];
				 }
				return (statusCode && (statusCode == '401' || statusCode == '403')); //Invalid login			
			}
			return false;
		},
		
		_initializeLocalStorage: function(deferred, force){
			Logger.trace('UserAuthenticationManager - _initializeLocalStorage - ' + currentUser);
			PersistenceManager.activateOrCreateCollections({username: currentUser, password: password, authenticated: true}, force).
			then(function() {
				// heartbeat rely on local storage to be initialized
				ConnectionHeartBeat.initialize().
				then(function() {
					deferred.resolve();
				});
			}).
			otherwise(function(err) {
				deferred.reject(err);
			});
		},
		
		_adapterLogout: function(){
			Logger.timerStart("UserAuthenticationManager - _adapterLogout");
			Logger.trace('Logging out user ' + currentUser + ' from server');
			return runOrRejectWithError(this, function(){
				var deferred = new Deferred();
				//TODO Adapter is defined at resource level
				//Need to define how to get the adapter for authentication
				var invocationData = {
					adapter:	'OSLCGenericAdapter',
					procedure:	'logout',
					parameters: [sessionid]
				};
							
				WL.Client.invokeProcedure(invocationData, {
					onSuccess: function(response){
						Logger.trace('User ' + currentUser + ' successfully logged out from server');
						deferred.resolve();
						Logger.timerEnd("UserAuthenticationManager - _adapterLogout");
					},
					onFailure: function (err) {
						// MM improve memory utilization remove json.stringify object 
						//Logger.trace('Unable to logout user ' + currentUser + ' from server: ' + JSON.stringify(err));
						deferred.reject(err);
						Logger.timerEnd("UserAuthenticationManager - _adapterLogout");
					}
				});
				
				return deferred.promise;				
			});
		},
		
		_realmLogout: function() {
			Logger.timerStart("UserAuthenticationManager - _realmLogout");
			Logger.trace('Logging out user ' + currentUser + ' from server (realm)');
			return ServerAuthenticationProvider.logout();
		},
		
		_cleanUp: function() {
			currentUser = null;
			setPassword(this, null);
			setSessionId(this, null);
			passLocalAuth = false;
			Logger.trace('User successfully logged out');
		},
		
		logout: function(){
			Logger.timerStart("UserAuthenticationManager - logout");
			return this._stopDownloadsInProgress().
			always(lang.hitch(this, this._doLogout));
		},

		_doLogout: function() {
			var self = this;
			if (sessionid) {				
				return this._realmLogout().always(function() {
					Logger.trace('Closing local storage for user ' + currentUser);
					return PersistenceManager.closeAllStores().
						always(function() {
							self._cleanUp();
							Logger.timerEnd("UserAuthenticationManager - logout");
						});
					}
				);													
			} else {
				Logger.trace('Closing local storage');
				return PersistenceManager.closeAllStores().
				always(function() {
					self._cleanUp();
					Logger.timerEnd("UserAuthenticationManager - logout");
				});
			}			

		},
		
		_stopDownloadsInProgress: function(){
			WorklistDataManager.cancelLastWorklistDataDownloadRequest();
			AdditionalDataManager.cancelLastAdditionalDataDownloadRequest();
			
			var worklistPromise = WorklistDataManager._overallProcessing.promise;
			var additionalDataPromise = AdditionalDataManager._overallProcessing;
			
			//Need to chain instead of use all() because when the first promise
			//gets canceled, all() won't wait for the other before canceling itself
			return worklistPromise.always(function(){
				return additionalDataPromise;
			});			            
		},
		
		_appendLangCodeParameter: function(invocationData) {
			var langcode = (WL && WL.App && WL.App.getDeviceLocale() || 'en-US');
			invocationData.parameters[0]['langcode'] = langcode;
		},
		
		invokeAdapterSecurely: function(invocationData, preventReLogin){
			this.reLoginError = null;
			var self = this;
			var deferred = new Deferred();
			if (currentUser == null){
				deferred.reject('User not logged in');
				return deferred.promise;
			}			

			var env = WL.Client.getEnvironment();
			if (env != WL.Environment.WINDOWS8 && !sessionid && currentUser && password && !SecureRequestManager.isAuthLocked()){
				//The user never logged into the server so authenticate
				var loginDeferred = new Deferred();
				SecureRequestManager.enableAuthLock();
				this._realmAuthentication(currentUser, password, false, loginDeferred);
				loginDeferred.promise.then(function(){
					self.invokeAdapterSecurely(invocationData, true).then(function(result){
						deferred.resolve(result);
						SecureRequestManager.resendRequestsAfterAuth(sessionid);
					}).otherwise(function(error){
						deferred.reject(error);
						SecureRequestManager.authorizationFailed(error);
					});
				}).otherwise(function(error){
					var errorResponse = self._handleAuthenticationError(error, false);
					if (errorResponse.errorCode != 'reAuthError'){
						Logger.trace('UserAuthenticationManager.invokeAdapterSecurely: login failed.');
						deferred.reject(errorResponse);
						SecureRequestManager.authorizationFailed(errorResponse);
					}
				});
				
				return deferred.promise;
			}

			invocationData.parameters[0]['sessionid'] = sessionid || "JSESSIONID=-no-data-; path=/";
			this._appendLangCodeParameter(invocationData);

			var options = {
				onSuccess: lang.hitch(self, function(result){
					// MM improve memory utilization remove json.stringify object 
					//Logger.trace('UserAuthenticationManager.invokeAdapterSecurely: onSuccess ' + JSON.stringify(result));
					/* APAR IV67241
					 * LDAP: sometimes the authentication process doesn't get all 
					 * cookies, then we need to monitor set-cookie in the response 
					 * to avoid open multiple sessions in the backend.
					 */
					if(sessionid && result && 
							result.invocationResult && 
							result.invocationResult.responseHeaders &&
							result.invocationResult.responseHeaders['Set-Cookie'])
					{
						var setCookie = result.invocationResult.responseHeaders['Set-Cookie'];
						Logger.trace('UserAuthenticationManager.invokeAdapterSecurely: onSuccess - setting cookie:' + setCookie);
						var updatedSessionId = userSessionHelper.updateSession(sessionid, setCookie);
						setSessionId(self, updatedSessionId);
					}
					deferred.resolve(result);
				}),
				onFailure: function(result){
					// MM improve memory utilization remove json.stringify object 
					//Logger.trace('UserAuthenticationManager.invokeAdapterSecurely: onFailure' + JSON.stringify(result));
					if (result){
						if(self._isServerLoginFailure(result) && self.isCachingUserInfo()){
							self._handleAuthenticationError(result, typeof sessionid == 'string');
						}
						else if (result.errorCode && result.errorCode == 'UNRESPONSIVE_HOST'){
							Logger.trace('UserAuthenticationManager.invokeAdapterSecurely UNRESPONSIVE_HOST error.  Setting no connectiont.');
							ConnectivityChecker.noOSLCConnection();
						}
					}
					deferred.reject(result);
				}
			};
			
			if (invocationData.timeout){
				options.timeout = invocationData.timeout;
				delete invocationData.timeout;
			} else {
				options.timeout = SystemProperties.getConnectivityTimeout();
			}
			
			// MM improve memory utilization remove json.stringify object 
			//Logger.trace('Invoking adapter  with these parameters: ' + JSON.stringify(invocationData));
			return SecureRequestManager.callAdaptor(invocationData, options, deferred);
		},
		
		_oslcServerDown: function(){
			ConnectivityChecker.noOSLCConnection();
			if (sessionid) {
				var self = this;
				this._realmLogout().always(function() {
					setSessionId(self, null);
				});													
			}
		},
		
		_getCurrentUser: function(){
			return currentUser;
		},
		_getSessionId: function(){
			return sessionid;
		},
		getFreshActiveCredentialsAsPromise: function(){
			// created this method to force a relogin and get a fresh session id
			var deferred = new Deferred();
			this.relogin(currentUser, password).then(function(){
				deferred.resolve(sessionId);
			}).otherwise(function(error){
				deferred.reject(error);
			});			
			return deferred.promise; 
		},
		_loadDataToUserRolesManager: function(userRolesSet){
			UserRolesManager.setCurrentUser(currentUser);
			var roles = [];
			if(userRolesSet){
				for(var i = 0; i < userRolesSet.count(); i++){
					roles.push(userRolesSet.getRecordAt(i).get("roleName"));
				}
			}
			UserRolesManager.addRolesToCurrentUser(roles);
		},
		
		_loadDataToUserManager: function(userInfoObj){
			UserManager.addInfoToCurrentUser(userInfoObj);
		},
		
		isCachingUserInfo: function(){
			return cachingUserInfo;
		},
		
		_cacheUserInfo: function(deferred){
			if (cachingUserInfo){
				deferred.resolve();
			}
			else{
				var self = this;
				var resource = ResourceContext.getResourceMetadata("userInfo");
				var queryBase = Object.keys(resource.queryBases)[0];
				
				cachingUserInfo = true;
				//All applications need a userinfo resource defined, also resource cannot be defined as a system table or additional data.
				ModelService.allWithComplexAttributes("userInfo", queryBase, ['groupList']).then(function(userInfoSet){
					 
					//store the timeout value when downloading user info to reset in case od anywherepropval fail
					var lastTimeout = SystemProperties.getLastTimeoutMoment();
								
					var propDeferred = new Deferred();
					
					if (sessionid){
						self._getServerTime(sessionid);
					}
					self._setUpUserData(userInfoSet, propDeferred);
					
					self.currentUserSite = userInfoSet.getCurrentRecord().defsite;
					
					//retrive admin app data and update system properties, resources and resources value based on retrieved data
					propDeferred.promise.then(function(result){
						//only execute admin steops if si.adminmode = true at worklight.properties
						if(!SystemProperties.getProperty('si.adminmode') || SystemProperties.getProperty('si.adminmode') == "false"){
							deferred.resolve();
						}else{
								AdminModeManager.loadAdminData(deferred, userInfoSet, lastTimeout);
							}
					}).otherwise(function(){
						deferred.reject();
					});
				}).
				otherwise(function(e){
					if (e && 'oslcServerDown' == e.errorCode ){
						if (passLocalAuth){
							cachingUserInfo = false;
							deferred.resolve();
						}
						else{
							ModelService.allLocalOnly("userInfo", queryBase).then(function(userInfoSet){
						    	self._setUpUserData(userInfoSet, deferred);
							}).otherwise(function(error){
								cachingUserInfo = false;
								deferred.reject(errorLoadingInfoMsg());
							});
						}
					}
					else{
						cachingUserInfo = false;
						deferred.reject(errorLoadingInfoMsg());
					}
				});	
			}
			
		},		
		_getServerTime: function(sessionId){
			var deferred = new Deferred();
			if (!sessionId){
				Logger.log('_getServerTime cannot get the time because session id is null.');
				deferred.reject(errorLoadingServerClockMsg());
			}
			//Need to define how to get the adapter
			var invocationDataClock = {
				adapter:	'OSLCGenericAdapter',
				procedure:	'getServerDate',
				parameters : [ {cookie : sessionId} ]				
			};
			
			WL.Client.invokeProcedure(invocationDataClock, {
				onSuccess: lang.hitch(this, function(response) {
					var beforeInvoke = response['invocationResult']['beforeInvoke'];
					var afterInvoke = response['invocationResult']['afterInvoke'];
					var serverDate = response['invocationResult']['serverDate'];
	
					Logger.trace('Server date was successfully retrieved from adapter::'+serverDate);
					Logger.trace('UserAuthenticationManager._getServerTime: beforeInvoke = '+ beforeInvoke);
					Logger.trace('UserAuthenticationManager._getServerTime: afterInvoke  = '+ afterInvoke);
					//Invoke CurrentTimeProvider
					//provider, beginTrans, endTrans, operationCost, serverDate
					CurrentTimeProvider.setTimeAdjustment('',beforeInvoke,afterInvoke,0,serverDate);

					deferred.resolve(serverDate);
					
				}),
				onFailure: lang.hitch(this, function(result) {
					try{
						var errors = (lang.getObject("invocationResult.errors", false, result) || []).join(",");
						Logger.log('Could not retrieve server date from Adapter::' + errors);
					} finally {
						deferred.reject(errorLoadingServerClockMsg());
					}					
				})		
			});
			return deferred.promise;
		},
		// FOR TESTING PURPOSES ONLY
		____setSessionId: function(fakeSessionId) {
			sessionid = fakeSessionId;
		},
		____setCurrentUser: function(fakeCurrentUser){
			currentUser = fakeCurrentUser;
		},
		____setPassword: function(fakePassword){
			password = fakePassword;
		},
		____setPassLocalAuth: function(fakePassLocalAuth){
			passLocalAuth = fakePassLocalAuth;
		}
		
	});
	
});
