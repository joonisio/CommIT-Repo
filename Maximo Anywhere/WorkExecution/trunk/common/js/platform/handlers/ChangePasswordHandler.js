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

define("platform/handlers/ChangePasswordHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/model/AdditionalDataManager",
	     "platform/model/SystemDataManager",
	     "platform/model/SystemDataUIManager",
	     "platform/auth/UserAuthenticationManager",
	     "platform/store/SystemProperties",
	     "platform/translation/MessageService",
	     "dijit/focus",
	     "platform/logging/Logger"
],
function(declare, ApplicationHandlerBase, AdditionalDataManager, SystemDataManager, SystemDataUIManager, UserAuthenticationManager, SystemProperties, MessageService, dijitFocus, Logger) {
	return declare( ApplicationHandlerBase, {
		name: 'ChangePasswordHandler',
		CHANGE_PASSWORD_DATA: 'PlatformChangePasswordForm',
		changePasswordViewData: null,
		currUser: null,
		currPass: null,
		
		constructor: function() {
			// initialization code
		},

/**@memberOf platform.handlers.ChangePasswordHandler */
		initializeChangePasswordView: function(eventContext){
			var changePasswordViewData = this.application.getResource(this.CHANGE_PASSWORD_DATA).getCurrentRecord();
			if(changePasswordViewData.get('username') && changePasswordViewData.get('currentpassword')){
				this.currPass = changePasswordViewData.get('currentpassword');
				this.currUser = changePasswordViewData.get('username');
			}
			if (!changePasswordViewData.get('loginFailed')){
				changePasswordViewData.set('errorMsg', '');
				// Ensure we don't save username/password
				changePasswordViewData.set('currentpassword', null);
			}
			changePasswordViewData.set('newpassword', null);
			changePasswordViewData.set('confirmnewpassword', null);
			var changePasswordInfo = MessageService.createStaticMessage('changePasswordInfo').getMessage();
			changePasswordInfo = changePasswordInfo == 'changePasswordInfo' ? '' : changePasswordInfo;
			changePasswordViewData.set('infoMsg', changePasswordInfo);
		},
		
		initializeRetrieveOldPasswordView: function(eventContext){
			var changePasswordViewData = this.application.getResource(this.CHANGE_PASSWORD_DATA).getCurrentRecord();
			changePasswordViewData.set('errorMsg', '');
			changePasswordViewData.set('currentpassword', null);
		},
		
		hidePasswordField: function(eventContext){
			var changePasswordViewData = this.application.getResource(this.CHANGE_PASSWORD_DATA).getCurrentRecord();
			eventContext.setVisibility(changePasswordViewData.get('loginFailed') != true);
		},
		
		enableChangePasswordFunction: function(eventContext){
			SystemProperties.getAuthType().then(function(authType){
				var showChangePasswordOption = (authType != "basic" && authType != "form");
				if(!showChangePasswordOption){
					eventContext.set('style', 'display:none');
				}
			})
			
		},
		
		changePasswordClickHandler: function(eventContext){
			var changePasswordViewData = this.application.getResource(this.CHANGE_PASSWORD_DATA).getCurrentRecord();
			var loginFailed = changePasswordViewData.get('loginFailed');
			if (!loginFailed){
				changePasswordViewData.set('errorMsg', '');
			}
			var username = changePasswordViewData.get('username');
			var currentPassword = changePasswordViewData.get('currentpassword');
			var newPassword = changePasswordViewData.get('newpassword');
			var confirmNewPassword = changePasswordViewData.get('confirmnewpassword');
			var oslcMaxUserURL = changePasswordViewData.get('oslcMaxUserURL');
			eventContext.focus(); //Android 2.3 devices need special handling to set focus when button tapped
			
			//simple validation
			if(!currentPassword){
				var errorMsg = MessageService.createStaticMessage('Your current password is required.').getMessage();
				eventContext.ui.showMessage(errorMsg);
				return;
			}
			if(!newPassword){
				var errorMsg = MessageService.createStaticMessage('Your new password is required.').getMessage();
				eventContext.ui.showMessage(errorMsg);
				return;
			}
			if(!confirmNewPassword){
				var errorMsg = MessageService.createStaticMessage('Your new password confirmation is required.').getMessage();
				eventContext.ui.showMessage(errorMsg);
				return;
			}
			if(newPassword!==confirmNewPassword){
				var errorMsg = MessageService.createStaticMessage('Passwords do not match').getMessage();
				eventContext.ui.showMessage(errorMsg);
				return;
			}
			if(newPassword==currentPassword){
				var errorMsg = MessageService.createStaticMessage('New password cannot match current password.').getMessage();
				eventContext.ui.showMessage(errorMsg);
				return;
			}
			
			var self = this;

			self.application.showBusy();
			if (loginFailed){
				var loginHandler = self.application['platform.handlers.LoginHandler'];
				changePasswordViewData.set('username', this.currUser);
				changePasswordViewData.set('currentpassword', this.currPass);
				changePasswordViewData.set('loginFailed',false);
				changePasswordViewData.set('errorMsg', '');
				UserAuthenticationManager.noSessionChangePassword(username, currentPassword, newPassword, confirmNewPassword,oslcMaxUserURL).
				then(function() {
					loginHandler.afterLogin(false);
				}).
				otherwise(function(error) {
					if(typeof error == 'string'){
						eventContext.ui.showMessage(error);
                        Logger.error("[ChangePasswordHandler] - noSessionChangePassword method failed: "+error);
                    }
                    else{
                    	Logger.error("[ChangePasswordHandler] - noSessionChangePassword method failed: "+error.errorMsg);
                        eventContext.ui.showMessage(MessageService.createStaticMessage('Password change failed.').getMessage());
                    }
					changePasswordViewData.set('loginFailed', true);
					self.application.hideBusy();
				});
			}
			else{
				UserAuthenticationManager.changePassword(currentPassword, newPassword, confirmNewPassword).
				then(function() {
					self.application.hideBusy();
					eventContext.ui.showToastMessage(MessageService.createStaticMessage('Your password has been changed.').getMessage());
					eventContext.ui.back();
				}).
				otherwise(function(msg) {
					if(typeof msg == 'string'){
						eventContext.ui.showMessage(msg);
                        Logger.error("[ChangePasswordHandler] - changePassword method failed: "+msg);
                    }
                    else{
                    	Logger.error("[ChangePasswordHandler] - changePassword method failed: "+msg.errorMsg);
                        eventContext.ui.showMessage(MessageService.createStaticMessage('Password change failed.').getMessage());
                    }
					self.application.hideBusy();
				});
			}
		},
		
		cancelPasswordClickHandler: function(eventContext){
			var changePasswordViewData = this.application.getResource(this.CHANGE_PASSWORD_DATA).getCurrentRecord();

			changePasswordViewData.set('errorMsg', null);
			changePasswordViewData.set('currentpassword', null);
			changePasswordViewData.set('newpassword', null);
			changePasswordViewData.set('confirmnewpassword', null);
			eventContext.ui.back();
		},
		
		recoverOldPasswordClickHandler: function(eventContext){
			this.application.showBusy();
			var changePasswordViewData = this.application.getResource(this.CHANGE_PASSWORD_DATA).getCurrentRecord();
			var oldPassword = changePasswordViewData.get('currentpassword');
			var self=this;
			UserAuthenticationManager.changeStoredPassword(oldPassword).
			then(function(){
				eventContext.ui.showToastMessage(MessageService.createStaticMessage('Stored data recovered.').getMessage());
				var loginHandler = eventContext.application['platform.handlers.LoginHandler'];
				loginHandler.logout();
			}).
			otherwise(function(err){
				var errorMsg = MessageService.createStaticMessage('Stored data could not be recovered.').getMessage();
				self.application.hideBusy();
				eventContext.ui.showMessage(errorMsg);
			});
		},
		
		resetStorageClickHandler: function(eventContext){
			eventContext.ui.show('Platform.ConfirmResetDataStore');
		},
		
		resetDataStoreClickHandler: function(eventContext){
			UserAuthenticationManager.resetDataStore();
			eventContext.ui.showToastMessage(MessageService.createStaticMessage('Stored data cleared.').getMessage());
			eventContext.ui.hideCurrentDialog();
			var loginHandler = eventContext.application['platform.handlers.LoginHandler'];
			loginHandler.logout(eventContext);	
		},
		
		cancelResetDataStoreClickHandler: function(eventContext){
			eventContext.ui.hideCurrentDialog();
		},
		
		changePasswordBack: function(eventContext){
			//This is called in the context of the view to this would be the view
			var changePasswordViewData = eventContext.application.getResource('PlatformChangePasswordForm').getCurrentRecord();

			return true;
		},
		
		
	});
});
