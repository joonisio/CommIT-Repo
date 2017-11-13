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

define("platform/handlers/DialogHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/handlers/LoginHandler"],
function(declare, ApplicationHandlerBase, LoginHandler) {
	return declare( ApplicationHandlerBase, {
		name: 'DialogHandler',
		
/**@memberOf platform.handlers.DialogHandler */
		closeDialog: function(eventContext){
			this.application.ui.hideCurrentDialog();
		},
		
		processDialog: function(eventContext){
			
			// TODO get event/method to handle from event context and call it
			if(eventContext.getParent().getParent().id == "Platform.ExitApplicationPrompt") {
				return WL.App.close();
			}
				
			// close the dialog
			this.application.ui.hideCurrentDialog();
		},
		
		logoutDialog: function(eventContext){

			if(eventContext.getParent().getParent().id == "Platform.LogOutPrompt") {
				var handler = new LoginHandler();
				
				handler.logout(eventContext);			
				
			}
				
			// close the dialog
			this.application.ui.hideCurrentDialog();
		}
	});
});
