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

define("platform/handlers/LoginHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/model/AdditionalDataManager",
	     "platform/model/SystemDataManager",
	     "platform/model/SystemDataUIManager",
	     "platform/auth/UserAuthenticationManager",
	     "platform/store/SystemProperties",
	     "platform/translation/MessageService",
	     "dijit/focus",
	     "platform/auth/UserRolesManager",
	     "platform/store/_StoreProvider",
	     "platform/auth/OfflineLogout",
	 	 "dojo/Deferred",
	     "platform/util/PlatformConstants",
	     "platform/comm/_ConnectivityChecker",
	     "generated/application/pushNotification/PushNotificationSelfRegistrationGenerated"
],
function(declare, ApplicationHandlerBase, AdditionalDataManager, SystemDataManager, SystemDataUIManager, UserAuthenticationManager, SystemProperties, MessageService, dijitFocus, UserRolesManager, StoreProvider, OfflineLogout, Deferred, PlatformConstants, ConnectivityChecker, PushNotificationSelfRegistrationGenerated) {
	return declare( ApplicationHandlerBase, {
		name: 'LoginHandler',
		LOGIN_DATA: 'PlatformLoginResource',
		loginForm: null,
		loginInitialized: false,

/**@memberOf platform.handlers.LoginHandler */
		initializeLogin: function(eventContext){
			var loginForm = this.application.getResource(this.LOGIN_DATA).getCurrentRecord();
			if (this._hasUserName()) {
				// Ensure we don't save username/password
				loginForm.set('username', null);
				loginForm.set('password', null);
			}
			var appName = MessageService.createStaticMessage('applicationName').getMessage();
			appName = appName == 'applicationName' ? '' : appName;
			loginForm.set('appName', decodeURIComponent(appName)); // use decodeURIComponent to support multiple line app name
		},
		
		showWLSettingsPage: function(eventContext) {
			WL.App.__showWLSettingActivity();
		},
		
		showHideSettingsLink: function(eventContext) {
			eventContext.setVisibility((WL.Client.getEnvironment() === 'android'));
		},
		
		loginClickHandler: function(eventContext){
			var loginForm = this.application.getResource(this.LOGIN_DATA).getCurrentRecord();
			loginForm.set('errorMsg', '');
			var reLogin = loginForm.get('relogin') == true;
			var username = loginForm.get('username');
			var password = loginForm.get('password');
			eventContext.focus(); //Android 2.3 devices need special handling to set focus when button tapped
			this.application.showBusy();
			var self = this;
			
			var loginDeferred; 
			if (reLogin){
				loginDeferred = UserAuthenticationManager.relogin(username, password);
			}
			else{
				loginDeferred = UserAuthenticationManager.login(username, password, false);
			}
			loginDeferred.
			then(function() {
				self.afterLogin(true);
			}).
			otherwise(function(error) {
				self.handleLoginError(error, username, password, '');
			});
		},
		

		retrySystemDownload : function(context) {
			var self = this;
			//Need to clear the OSLC error so it actually tries to connect	
			ConnectivityChecker.resetNoOSLCConnection();
			ConnectivityChecker.checkConnectivityAvailable().then(function(){								
				self.application.ui.hideCurrentDialog();
				SystemProperties.setProperty(PlatformConstants.SYS_DATA_DOWNLOADED_FLAG, false, true);
				self.afterLogin(true);				
			});			
		},

		/**
		 * This function is triggered after the login is successful and loads system data and prompts for 
		 * whether we should load lookup data
		 */
		afterLogin : function(onLoginVIew){
			SystemProperties.setProperty(PlatformConstants.REFRESH_DATA_ON_LOGIN_FLAG, false, true);
			var requiredRole = this.application.getRequiredRoleOrNull();
			var self = this;
			
			var push = new PushNotificationSelfRegistrationGenerated();
			push.register();
			
			if(!requiredRole || UserRolesManager.isCurrentUserInRole(requiredRole)){
				var loginResource = this.application.getResource(this.LOGIN_DATA);
				//Might not have username/password if we're doing single signon
				if (this._hasUserName()) {
					var loginForm = loginResource.getCurrentRecord();
					var reLogin = loginForm.get('relogin') == true;
					loginForm.set('errorMsg', '');
					if (reLogin){
						loginForm.set('relogin', false);
						loginForm.set('localPassword', null);
						this.application.ui.closeLoginView(onLoginVIew);
						return;
					}	
				}
				var sysUIManager = new SystemDataUIManager(this.application.ui);
				SystemDataManager._setSystemDataUIManager(sysUIManager);
				return SystemDataManager.downloadSystemDataIfNeeded().
				then(function(msg){
					var defaultView = self.ui._getPrimaryViewID();
//					if (self.ui.getCurrentView().id == 'platform.LoginView'){
//						defaultView = self.ui.getCurrentView().getNextSibling().id;
//					}
//					else{
//						self.ui.viewHistory.pop();
//						defaultView = self.ui.getViewFromId('platform.LoginView').baseWidget.getNextSibling().id;
//					}
					
					var doAutoRefresh = SystemProperties.getProperty('Lookup.data.delta.autorefresh');
					var numberOfTry = SystemProperties.getProperty('Lookup.data.delta.autorefresh.numbers.retry');
					
					//Only try and download additional data if system data finished
					if (msg!=SystemDataManager.getErrorLoadingDataMsg()) {
						self.loginInitialized=true;
						AdditionalDataManager.setDefaultView(defaultView, true);
						self.ui.defaultView = defaultView;
						if(SystemProperties.getProperty(PlatformConstants.META_DATA_UPDATED)){
							if (!AdditionalDataManager.isDownloadInProgress){
								SystemProperties.setProperty(PlatformConstants.META_DATA_UPDATED, false, true);
								AdditionalDataManager.refreshAdditionalData();
							}
						}else{
							var downloadState = SystemProperties.getProperty('additionalDataDownloadState');
							if(!downloadState || downloadState == 'error' || downloadState == 'started'){
								SystemProperties.setProperty('additionalDataDownloadState', 'firstLogin', true);
		                        AdditionalDataManager.checkIfAdditionalDataDownloadIsNeeded(true);
		                    }
		                     else if(AdditionalDataManager.getUIManager().checkIfIsSyncTime() && 
		         					( (doAutoRefresh && (doAutoRefresh == true || doAutoRefresh == 'true'))  && !SystemProperties.getProperty('aDSyncTryCount') || SystemProperties.getProperty('aDSyncTryCount') < numberOfTry)){
		         				SystemProperties.setProperty('isADSyncRequest', true, true);
		         				AdditionalDataManager.getUIManager().showStartADConfirmationDialog();
		         				
		         			} else
		                    {
		                    	AdditionalDataManager.checkIfAdditionalDataDownloadIsNeeded(false);
		                    } 
						}	
					}
				}).
				otherwise(function(err) {
					return UserAuthenticationManager.logout().
					always(function() {
						//Had to hide dialog here instead of within SystemDataManager
						//otherwise user would stay with no feedback until logout finishes
						//and may try to login before logout finished
						sysUIManager.hideDownloadInProgressDialog();
						var loginForm = loginResource.getCurrentRecord();
						loginForm.set('errorMsg', err);	
						throw err;
					});					
				});
			}
			else{
				UserAuthenticationManager.logout().always(function(){					
					var loginResource = self.application.getResource(self.LOGIN_DATA);
					var loginForm = loginResource.getCurrentRecord();
					loginForm.set("errorMsg", MessageService.createStaticMessage("The user you specified during login is not authorized to use this application.").getMessage());
							
					OfflineLogout.logoutWithPromise().always(function () {
					    self.application.hideBusy();
						//Might not have a username if we're doing single signon
						if (self._hasUserName()) {
							var loginResource = self.application.getResource(self.LOGIN_DATA);
							var loginForm = loginResource.getCurrentRecord();
							loginForm.set("relogin", false);	
							loginForm.set('localPassword', null);
					    	if (!onLoginVIew){
					    		self.application.show( 'platform.LoginView');
					    	}
						}
					});									
				});
			}
		},

	    handleLoginError: function(error, username, password, oldPassword){
	    	var loginResource = this.application.getResource(this.LOGIN_DATA);
			if (this._hasUserName()) {
	    		//Only do these relogin/password change events if we actually have a username field
	    		//Otherwise we're probably in device-side SSO
				var self = this;
				if (error){
					var loginForm = loginResource.getCurrentRecord();		
					if (error.relogin){
						loginForm.set('relogin', true);
						loginForm.set('localPassword', password);
					}
					else if((error.initStoreError || error.updatePassword) && username && password){
						var localPassword = (loginForm.get('relogin')?loginForm.get('localPassword'):oldPassword);
						
						if (error.initStoreError){
							UserAuthenticationManager.changeStoredPassword(localPassword).
							then(function(){
								self.logout();
							}).
							otherwise(function(err){
								loginForm.set('errorMsg', '');
								self.application.hideBusy();
								self.ui.show('Platform.RetrieveOldPassword');
							});
						}
						else{
							StoreProvider._changePassword(username, localPassword, password).
							then(function(){
								var onLoginView = self.ui.getCurrentView().id != 'Platform.ChangePassword';
								var deferred = new Deferred();
								UserAuthenticationManager._retrieveUserAccessData(error.sessionid, deferred);
								deferred.then(function(){
									self.afterLogin(onLoginView);
								}).
								otherwise(function(error){
									self.handleLoginError(error);
								});
							}).
							otherwise(function(){
								loginForm.set('errorMsg', '');
								self.application.hideBusy();
								self.ui.show('Platform.RetrieveOldPassword');
							});
						}
						return;
					}
	
					if ( error.oslcError == '403'){
						var changePasswordForm = this.application.getResource('PlatformChangePasswordForm').getCurrentRecord();
						changePasswordForm.set('loginFailed', true);
						changePasswordForm.set('errorMsg', error.errorMsg);
						changePasswordForm.set('username', error.username);
						changePasswordForm.set('currentpassword', error.password);
						changePasswordForm.set('oslcMaxUserURL', error.oslcMaxUserURL);
						this.application.hideBusy();
						this.ui.show('Platform.ChangePassword');
						return;
					}
					if (error.errorMsg){
						loginForm.set('errorMsg', error.errorMsg);				
					}
					else if (typeof error == 'string'){
						loginForm.set('errorMsg', error);				
					}
					else if (error.messageId){
						loginForm.set('errorMsg', MessageService.createResolvedMessage(error.messageId, error.parameters));
					}
				}
				if (this.ui.getCurrentView().id == 'platform.LoginView'){
					this.logout(null, true);
				} else {
					this.logout(null, false);
				}
			}
	    },
	    
        logout: function (eventContext, preventReload) {
            UI.application.showBusy();
            var self = this;
            UserAuthenticationManager.logout().
			always(function () {
			    if (!preventReload) {
			        location.reload();
			    }
			    else {
			        UI.application.hideBusy();
			    }
			});
        },
	    
		hideDialog : function(eventContext){
			eventContext.ui.hideCurrentDialog();
			location.reload();
		},
		
		_hasUserName: function() {			
			var loginResource = this.application.getResource(this.LOGIN_DATA);
			return (loginResource && loginResource.getField("username"));
		},
		needsLogin: function() {
			return !this.loginInitialized;
		}
	});
});
