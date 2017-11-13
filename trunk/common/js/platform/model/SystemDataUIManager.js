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

define("platform/model/SystemDataUIManager",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "platform/logging/Logger",
 "platform/translation/MessageService"], 
function(declare, lang, arrayUtil, Logger, MessageService) {
	return declare([], {
		userInterface: null,
		resourcesDownloaded: 0,
		resourcesToDownload: 0,
		recordsDownloaded: 0,
		recordsToDownload: 0,
		progressRecord: null,
		
		constructor: function(userInterface){
			this.userInterface = userInterface;
		},	
		
/**@memberOf platform.model.SystemDataUIManager */
		showDownloadInProgressDialog: function(){
			this.userInterface.show("Platform.LoadingSystemData");
		},		
		
		_buildProgressMsg: function(){
			var recordPercent = 0;
			if (this.recordsToDownload > 0){
				recordPercent = Math.floor((this.recordsDownloaded/this.recordsToDownload)*100);
			}
			var msg = MessageService.createResolvedMessage('systemDataDownloadProgressMsg', 
					[this.resourcesDownloaded,
					 this.resourcesToDownload,
					 recordPercent]);
			return msg;
		},
		
		updateProgressDialog: function(){
			var newMsg = this._buildProgressMsg();
			if (!this.progressRecord){
				this.progressRecord = this.userInterface.application.getResource('PlatformProgressResource').getRecordAt(0);
			}
			this.progressRecord.set('progressMsg', newMsg);
		},
		
		hideDownloadInProgressDialog: function(){
			//Only hide the dialog if it's not the new retry error
			if (!this.userInterface.isDialogShowing('Platform.DownloadError'))
				this.userInterface.hideCurrentDialog();			
		}
	});
});
