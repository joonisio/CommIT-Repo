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

define("platform/handlers/AdditionalDataDialogHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/date/stamp",
	     "dojo/Deferred",
	     "platform/model/AdditionalDataManager",
	     "platform/handlers/DialogHandler",
	     "platform/store/SystemProperties",
	     "platform/translation/MessageService",
	     "platform/format/FormatterService"],
function(declare, lang, dateTimeISOFormatter, Deferred, AdditionalDataManager, DialogHandler, SystemProperties, MessageService, FormatterService) {
	
	return declare( DialogHandler, {
		name: 'AdditionalDataDialogHandler',
		
		progressData: null,
		
		cancelButton: null,
		
/**@memberOf platform.handlers.AdditionalDataDialogHandler */
		renderAdditionalDataDownloadingButton : function(eventContext) {					
						
			cancelButton = eventContext;
			cancelButton.setVisibility(false);
				
		},
		
		cancelAdditionalDataDownload: function(eventContext) {					
						
			AdditionalDataManager.cancelLastAdditionalDataDownloadRequest();
				
		},
				
		closeDialogAndShowDefaultViewIfNeeded: function(control){
			if(SystemProperties.getProperty('isADSyncRequest')){
				SystemProperties.setProperty('isADSyncRequest', false, true);
				var count = SystemProperties.getProperty('aDSyncTryCount');
				if(!count){
					count = 1;
				}else{
					count = count + 1;
				}
				SystemProperties.setProperty('aDSyncTryCount', count, true);
			}
			this.closeDialog();
			AdditionalDataManager.showDefaultViewIfNeeded();
		},		
		
		renderLastDownload: function(control, forceDisplay) {
			var lastDownloadDateTime = SystemProperties.getProperty('lastDownloadDateTime');
			var lastDownloadTimeAsString = null;
			if (lastDownloadDateTime){
				lastDownloadTimeAsString = FormatterService.toDisplayableValue(lastDownloadDateTime, "dateTime", this.application.getUserLocale());
				lastDownloadDateTime = dateTimeISOFormatter.fromISOString(lastDownloadDateTime);
			}
			var dataSet = this.application.getResource('LastADDownload');
			var data = dataSet.getCurrentRecord();
			
			
			var newMsg = null;
			if(lastDownloadDateTime || SystemProperties.getProperty('additionalDataDownloadState') ==  "error"){
				if(!AdditionalDataManager.allAdditionalDataDownloaded()){
					newMsg = MessageService.createResolvedMessage("Partially updated at {0}", [lastDownloadTimeAsString]);
				}else{
					newMsg = MessageService.createResolvedMessage("Last updated {0}", [lastDownloadTimeAsString]);
				}
				
				data.set('lastDownloadDateMsg', newMsg);
			}else{
				newMsg = MessageService.createStaticMessage("Lookup data not stored locally").getMessage();
			}
			
			if (!AdditionalDataManager.isDownloadInProgress || forceDisplay){
				data.set('downloadStatus', newMsg);
			}
		},
		
		refreshAdditionalData: function(){
			if (!AdditionalDataManager.isDownloadInProgress){
				AdditionalDataManager.refreshAdditionalData();
			}
		},
		
		confirmADDownload: function(eventContext){
			this.application.ui.hideCurrentDialog();
			var self = this;
			//if user does cancel the aut sync for more than 3 time, we need to reset in order to get it running again
			SystemProperties.setProperty('aDSyncTryCount', 0, true);
			SystemProperties.setProperty('wasDeltaLADDownload', false, true);
			AdditionalDataManager.performAdditionalDataDownload(true);
			AdditionalDataManager.getUIManager().showUIProgress(function() {
				self.renderLastDownload(null, true);
			});
		},
		
		confirmADDeltaDownload: function(eventContext){
			this.application.ui.hideCurrentDialog();
			var self = this;
			//if user does cancel the aut sync for more than 3 time, we need to reset in order to get it running again
			SystemProperties.setProperty('aDSyncTryCount', 0, true);
			SystemProperties.setProperty('wasDeltaLADDownload', true, true);
			AdditionalDataManager.performAdditionalDataDownload(true);
			AdditionalDataManager.getUIManager().showUIProgress(function() {
				self.renderLastDownload(null, true);
			});
		},
		
		retryADDownload: function(eventContext){
			this.application.ui.hideCurrentDialog();
			var self = this;
			
			AdditionalDataManager.performAdditionalDataDownload(false);
			AdditionalDataManager.getUIManager().showUIProgress(function() {
				self.renderLastDownload(null, true);
			});
		},
		
		renderRetryButton: function(eventContext){
			eventContext.setDisplay(!AdditionalDataManager.allAdditionalDataDownloaded());
		},
		
		setBtLabelNowOrRefresh: function(eventContext){
			if(AdditionalDataManager.allAdditionalDataDownloaded()){
				eventContext.setLabel(MessageService.createStaticMessage("Now").getMessage());
			}else{
				eventContext.setLabel(MessageService.createStaticMessage("Reset").getMessage());
			}
		},
		
		setBtLabelLaterOrCancel: function(eventContext){
			if(AdditionalDataManager.allAdditionalDataDownloaded()){
				eventContext.setLabel(MessageService.createStaticMessage("Later").getMessage());
			}else{
				eventContext.setLabel(MessageService.createStaticMessage("Close").getMessage());
			}
			
		},
		retrylookupdataText: function(eventContext){
			eventContext.setDisplay(!AdditionalDataManager.allAdditionalDataDownloaded());
			
		},
		
		theLookupdataText: function(eventContext){
			eventContext.setDisplay(AdditionalDataManager.allAdditionalDataDownloaded());
			
		},
		
		cancelADDownload: function(){
			this.application.ui.hideCurrentDialog();
			AdditionalDataManager.cancelLastAdditionalDataDownloadRequest();
			data.set('downloadStatus', data.get('lastDownloadDateMsg'));
		},
		
		showInPreview: function(eventContext){
			eventContext.setDisplay((WL.Client.getEnvironment() == WL.Environment.PREVIEW && !eventContext.application.debug));
		}
	});
});
