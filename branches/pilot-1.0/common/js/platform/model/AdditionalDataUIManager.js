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

define("platform/model/AdditionalDataUIManager",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "platform/logging/Logger",
 "platform/format/FormatterService",
 "dojo/date/stamp",
 "platform/store/SystemProperties",
 "platform/translation/MessageService",
 "platform/model/AdditionalDataManager",
 "platform/store/ResourceMetrics",
 "platform/comm/_ConnectivityChecker"], 
function(declare, lang, arrayUtil, Logger, FormatterService, dateTimeISOFormatter, SystemProperties, MessageService, AdditionalDataManager, ResourceMetrics, ConnectivityChecker) {
	return declare([], {
		userInterface: null,
		defaultView: null,
		shouldShowDefaultView: false,
		
		constructor: function(userInterface){
			this.userInterface = userInterface;
		},
		
/**@memberOf platform.model.AdditionalDataUIManager */
		setDefaultView: function(defaultView, shouldShowView){
			this.defaultView = defaultView;
			this.shouldShowDefaultView = shouldShowView;
		},
		
		showDefaultViewIfNeeded: function(){
			if (this.shouldShowDefaultView){
				this.showDefaultView();
				this.shouldShowDefaultView = false;
			}
		},
		
		showDefaultView: function(){
			ConnectivityChecker.resetNoOSLCConnection();
			// Load the pre-resources needed for default view
			var self = this;
			this.userInterface.application.createResource(null, null, 'PlatformViewQueryResource', null, null).then(function() {
				//ResourceMetrics._loadMetrics().always(function(){
					//If the defaultView didn't show the first time, I still need to show it after failure
					if (!self.userInterface.show(self.defaultView, 'none')) {
						self.shouldShowDefaultView = true;
					}
					self.shouldShowDefaultView = false;
				//});
			});
		},
		
		showNoConnectivityDialog: function(){
			this.userInterface.show("Platform.AdditionalDataNoConn");
		},
		
		showStartADConfirmationDialog: function(){
			this.userInterface.application.hideBusy();
			var doDelta = SystemProperties.getProperty('Lookup.data.delta.support');
			
			if((doDelta && (doDelta == true || doDelta == 'true')) && SystemProperties.getProperty('additionalDataDownloadState') == 'completed'){
				this.userInterface.show("Platform.LoadAdditionalDataDeltaDownload");
			} else {
				this.userInterface.show("Platform.LoadAdditionalDataYesNo");
			}
			
		},
		
		hideDownloadInProgressDialog: function(){
			this.userInterface.hideDialog("Platform.LoadingAdditionalData");
		},
		
		showDownloadInProgressDialog: function(){
			this.userInterface.show("Platform.Settings");
			
		},
		
		showDownloadCompleteDialog: function(){
			var lastDownloadDateTime = SystemProperties.getProperty('lastDownloadDateTime');
			if (!lastDownloadDateTime){
				return;
			}
			var lastDownloadTimeAsString = FormatterService.toDisplayableValue(dateTimeISOFormatter.fromISOString(lastDownloadDateTime), "dateTime", this.userInterface.application.getUserLocale());
			var newMsg = MessageService.createResolvedMessage("Last updated {0}", [lastDownloadTimeAsString]);
			var dataSet = this.userInterface.application.getResource('LastADDownload');
			if(dataSet){
				var data = dataSet.getCurrentRecord();
				data.set('downloadStatus', newMsg);
			}
			this.userInterface.showToastMessage(MessageService.createStaticMessage('lookupDataComplete').getMessage());

		},
		
		showDownloadFailedDialog: function(){
			this.userInterface.hideCurrentDialog();
			
			var downloadState = SystemProperties.getProperty('additionalDataDownloadState');
			
			if(downloadState == 'error' || downloadState == 'started'){
				var lastDownloadDateTime = SystemProperties.getProperty('lastDownloadDateTime');
				var lastDownloadTimeAsString = FormatterService.toDisplayableValue(dateTimeISOFormatter.fromISOString(lastDownloadDateTime), "dateTime", this.userInterface.application.getUserLocale());
				
				var newMsg = MessageService.createResolvedMessage("Partially updated at {0}", [lastDownloadTimeAsString]);
				var dataSet = this.userInterface.application.getResource('LastADDownload');
				
				if(dataSet){
					var data = dataSet.getCurrentRecord();
					data.set('downloadStatus', newMsg);
				}
			}
			
			this.userInterface.show("Platform.AdditionalDataFailed");
		},
		
		getCurrentView: function(){
			return this.userInterface.getCurrentView();
		},
		
		showUIProgress: function(completionCallback) {
			completionCallback = (completionCallback || function(){});
			var app = this.userInterface.application;
			var dataSet = app.getResource('LastADDownload');
			if(dataSet){
				var data = dataSet.getCurrentRecord();
				data.set('downloadStatus', '-/- (0%)');
			}
			
			AdditionalDataManager.progressInfo.watch(function(fieldName, oldValue, newValue){			
				var resourcesDone = AdditionalDataManager.resourcesDone;
				var resourcesCount = AdditionalDataManager.resourcesCount;								
				var dataSet = app.getResource('LastADDownload');
				if(dataSet){
					var data = dataSet.getCurrentRecord();
					var total = 0;
					if(resourcesCount > 0){
						if(resourcesDone > 0){
							total = (resourcesDone*100)/resourcesCount;
						}
					}else{
						total = 100;
					}
					var promise = AdditionalDataManager._overallProcessing;
					var isDownloadInProgress = (promise && !promise.isFulfilled());
							
					if(isDownloadInProgress){
						var intermediate = "";
						if (fieldName == "recordsDownloaded") {
							intermediate = ": " + newValue['downloaded'] + " / " + newValue['total'];
						}

						var n = (total + '').split(".");
						if (n[0] == '100'){
							completionCallback();
							return;
						}
						data.set('totalDownloaded', intermediate + " (" + n[0] + '%)');
						data.set('downloadStatus', AdditionalDataManager.progressInfo['resourceDownloading'] + intermediate + " (" + n[0] + '%)');
					}else{
						completionCallback();
					}
				}
			});

		},
		
		checkIfIsSyncTime: function(){
			
			var downloadState = SystemProperties.getProperty('additionalDataDownloadState');
			//Only want to sync if lookup data is completed
			if(downloadState == 'completed'){
				
				
				
				var daysToSync = SystemProperties.getProperty('numberOfDaysToSync');
				if(!daysToSync){
					daysToSync = 30;
				}
				var syncDate = new Date(SystemProperties.getProperty('lastDownloadDateTime')); 
				syncDate.setDate(syncDate.getDate() + daysToSync );
				if(syncDate < new Date() ){
					return true;
				}
				
			}
			return false;
		},
	});
});
