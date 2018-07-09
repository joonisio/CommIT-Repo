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

define("platform/model/AdditionalDataManager",
["exports",
 "dojo/_base/lang",
 "dojo/_base/array",
 "platform/logging/Logger",
 "platform/store/SystemProperties",
 "platform/comm/_ConnectivityChecker",
 "platform/model/ResourceDownloadManager",
 "platform/store/_ResourceMetadataContext",
 "platform/ui/ScreenLockManager",
 "dojo/Deferred",
 "platform/store/ResourceMetrics"],
function (thisModule, lang, arrayUtil, Logger, SystemProperties, ConnectivityChecker, ResourceDownloadManager, ResourceMetadataContext, ScreenLockManager, Deferred, ResourceMetrics) {
	
	var AD_DIALOG_SHOWN_FLAG = "isADDialogAlreadyShown";
	
	var uiManager = null;

	var ttPerformAdditionalDataDownload = new TrackTime("AdditionalDataManager", "performAdditionalDataDownload", "The overall processing", false);
	var ttCheckIfAdditionalDataDownloadIsNeeded = new TrackTime("AdditionalDataManager", "checkIfAdditionalDataDownloadIsNeeded", "Checking the need to download additional data", false);

	var additionalDataTotalCountCheck = function(metadata){
			return ((typeof metadata['_urlBase'] == 'string') && (metadata['additionalData'] == true && metadata['isSystem'] !== true));
	};
	

	var classBody = lang.mixin(thisModule, {
		isDownloadInProgress: false,
		isRefresh: false,

/**@memberOf platform.model.AdditionalDataManager */
		_initClassIfNeeded: function() {
			if (!this.init && ResourceDownloadManager.init){
				lang.mixin(this, ResourceDownloadManager);
				this.init();
			}
		},
		
		_setAdditionalDataUIManager: function(adUIManager){
			uiManager = adUIManager;
		},

		setDefaultView: function(defaultView, shouldShowView){
			uiManager.setDefaultView(defaultView, shouldShowView);
		},
		
		showDefaultViewIfNeeded: function(){
			uiManager.showDefaultViewIfNeeded();
		},
				
		checkIfAdditionalDataDownloadIsNeeded: function(isRefresh){
			var requireConfirmation = SystemProperties.getProperty('si.device.lookupDownloadConfirmation');
			var self = this;
			this.isRefresh = isRefresh;
			ttCheckIfAdditionalDataDownloadIsNeeded.startTracking();
			var isADDialogShown = SystemProperties.getProperty(AD_DIALOG_SHOWN_FLAG);
			if ((!isADDialogShown || isRefresh) && this._hasAdditionalDataToDownload(isRefresh)){
				ConnectivityChecker.checkConnectivityAvailable().
				then(function(isConnectionAvailable){
					if (isConnectionAvailable){
						if (requireConfirmation === 'false'){
							self.performAdditionalDataDownload(isRefresh);
							uiManager.showUIProgress();
							
						} else {
							uiManager.showStartADConfirmationDialog();
						}
					} else {
						uiManager.showNoConnectivityDialog();
					}
					SystemProperties.setProperty(AD_DIALOG_SHOWN_FLAG, true, true);
					ttCheckIfAdditionalDataDownloadIsNeeded.stopTracking();
				});
				
			} else {
				uiManager.showDefaultView();
			}
		},
		
		_hasAdditionalDataToDownload: function(isRefresh) {
			var metadataHash = ResourceMetadataContext.getAllResourcesMetadata();
			var metadataKey = Object.keys(metadataHash);
			return arrayUtil.some(metadataKey, function(metadataName) {
				var metadata = metadataHash[metadataName];
				return (metadata.additionalData ||
						(isRefresh && metadata.isSystem));
			});
		},
		
		refreshAdditionalData: function(){
			//Reset the flag and call the check again
			this.checkIfAdditionalDataDownloadIsNeeded(true);
		},

		allAdditionalDataDownloaded: function(){
			var allAdditionalDataResourceTypeCheck = this._getDataDownloadChecker(true);
		
			
			var additionalDataResourceNotDownloadTypeCheck = this._getDataDownloadChecker(false);
		
			
			var allAdditionalData = this.getMetaDataList(allAdditionalDataResourceTypeCheck);
			var additionalDataDonwlodNotFinished = this.getMetaDataList(additionalDataResourceNotDownloadTypeCheck);
			
			if(additionalDataDonwlodNotFinished.length > 0 && allAdditionalData.length > additionalDataDonwlodNotFinished.length){
				return false;
			} else{
				return true;
			}
		},
		
		_getDataDownloadChecker: function(isRefresh){
			var self = this;
			if(isRefresh){
				return  function(metadata){
					if(metadata['additionalData'] !== true || metadata['isSystem'] == true){
						return false;
					}
					
					var metrics = metadata.getResourceMetrics(Object.keys(metadata.queryBases)[0]);
					if(metrics && metrics.isAllDataDownloaded()){
						metrics.allowRetry = false;
						if(metadata['additionalData'] == true && metadata['isSystem'] !== true && ((!SystemProperties.getProperty('wasDeltaLADDownload') && !SystemProperties.getProperty('lastDownloadDateTime')) || (!SystemProperties.getProperty('wasDeltaLADDownload') && SystemProperties.getProperty('additionalDataDownloadState') == "error" ))) {
							metrics.setMaxrowstamp(null);
						}
					}
					return ((typeof metadata['_urlBase'] == 'string') && (metadata['additionalData'] == true && metadata['isSystem'] !== true));
				};
			} else {
				
				return function(metadata){
					if(metadata['additionalData'] !== true || metadata['isSystem'] == true){
						return false;
					}
					
					var metrics = metadata.getResourceMetrics(Object.keys(metadata.queryBases)[0]);
					
					if(metrics) {
						if(!metrics.isAllDataDownloaded()){
							metrics.allowRetry = true;
						}
						if(metadata['additionalData'] == true && metadata['isSystem'] !== true && ((!SystemProperties.getProperty('wasDeltaLADDownload') && !SystemProperties.getProperty('lastDownloadDateTime')) || (!SystemProperties.getProperty('wasDeltaLADDownload') && SystemProperties.getProperty('additionalDataDownloadState') == "error" ))) {
							metrics.setMaxrowstamp(null);
						}
					}

					var needContinue = false;
					//var notDownloaded = 0;
					
//					This is where we will control the reousrce to download based on the new metrics attributes
					if(metrics && (!metrics.isAllDataDownloaded() || metrics.hasError())){
						needContinue = true;
						//notDownloaded++;
					}
					/*if (WL.Client.getEnvironment()!=WL.Environment.PREVIEW && metrics._metrics['serverCount'] > 200 ) {
						needContinue = true;
					}*/
					return (needContinue && typeof metadata['_urlBase'] == 'string');
				};
			}
		},
		
		performAdditionalDataDownload: function(isRefresh){
			var shouldDisplayStayAwake = SystemProperties.getProperty('si.device.keepDisplayAlive');
			if(shouldDisplayStayAwake == true || shouldDisplayStayAwake == null)
				ScreenLockManager.keepDisplayAwake();
		    this._initClassIfNeeded();
		    this._overallProcessing = new Deferred();
		    
			var overallPromise = this._overallProcessing.promise;
			
			this.shouldStop = false;
			this.isDownloadInProgress = true;
			this.needRecordLevelProgressInfo = true;
			
			// defect 99222 - initial load of lookup data should redirect
			// to the default view. 
			uiManager.showDefaultViewIfNeeded();
			var self = this;
			//make here the filter to remove rowstamp from retry if last try was a refresh and keep it there if it was a delta request.
			var additionalDataResourceTypeCheck = this._getDataDownloadChecker(isRefresh); 
			
			SystemProperties.setProperty('lastDownloadDateTime', null, true);
			SystemProperties.setProperty('additionalDataDownloadState', 'started', true);
			ttPerformAdditionalDataDownload.startTracking();
			this.downloadAllDataForAllResourcesAndQueryBases(additionalDataResourceTypeCheck, null, additionalDataTotalCountCheck).
			then(function success(){
				
				SystemProperties.setProperty('lastDownloadDateTime', new Date(), true);
				ResourceMetrics._loadMetrics(true).always(function(){
					if(!self.allAdditionalDataDownloaded() || SystemProperties.getProperty('additionalDataDownloadState') ==  "error"){
						SystemProperties.setProperty('additionalDataDownloadState', 'error', true);
						uiManager.showDownloadFailedDialog();
					} else {
						SystemProperties.setProperty('additionalDataDownloadState', 'completed', true);
						uiManager.showDownloadCompleteDialog();	
					}
				});
			}, 
			function failure(err){
				Logger.log('Processing canceled!');
				if (err != "canceled") {
					SystemProperties.setProperty('additionDataDownloadState', 'error', true);
					uiManager.showDownloadFailedDialog();
				}
				else{
					SystemProperties.setProperty('additionDataDownloadState', 'canceled', true);
				}
			}).
			always(lang.hitch(this, function(){
				if(shouldDisplayStayAwake == true || shouldDisplayStayAwake == null)
					ScreenLockManager.releaseDisplay();
			    // defect 99222 - do not use this - uiManager.hideDownloadInProgressDialog();
				this.isDownloadInProgress = false;
				ttPerformAdditionalDataDownload.stopTracking();
			}));
			
			this.progressInfo.watch('resourceCompletedName', function(fieldName, oldValue, newValue){
				if (oldValue != newValue && newValue != null){
					SystemProperties.setProperty(newValue + '-downloaded', true, true);
				}
			});
			
			return overallPromise;
		},
		
		cancelLastAdditionalDataDownloadRequest: function(){
			Logger.log('Cancel processing requested');
			this.cancelLastResourceDataDownloadRequest();
		},
		
		getUIManager: function() {
			return uiManager;
		},
		
		/*** FOR UNIT TESTING PURPOSES ONLY ***/
		_____setMaxRequests: function(num){
			this.maxRequests = num;
		}
		
	}, ResourceDownloadManager);
	//For some wonky reason sometimes UTs load this class before ResourceDownloadManager.
	//In such cases method init didn't get added so defer the init to call when needed
	if (classBody.init){
		classBody.init();
	}
});
