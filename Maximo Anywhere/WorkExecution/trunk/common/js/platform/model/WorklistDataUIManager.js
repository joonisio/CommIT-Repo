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

define("platform/model/WorklistDataUIManager",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "platform/logging/Logger",
 "platform/translation/MessageService"], 
function(declare, lang, arrayUtil, Logger, MessageService) {
	return declare([], {
		userInterface: null,
		
		constructor: function(userInterface){
			this.userInterface = userInterface;
		},
		
/**@memberOf platform.model.WorklistDataUIManager */
		showNoConnectivityDialog: function(){
			Logger.trace('showNoConnectivityDialog');
		},
		
		showStartADConfirmationDialog: function(){
			Logger.trace('showStartADConfirmationDialog');
		},
		
		hideDownloadInProgressDialog: function(){
			Logger.trace('hideDownloadInProgressDialog');
		},
		
		showDownloadInProgressDialog: function(){
			Logger.trace('showDownloadInProgressDialog');
		},
		
		showDownloadFailedDialog: function(){
			Logger.trace('showDownloadFailedDialog');
		}
	});
});
