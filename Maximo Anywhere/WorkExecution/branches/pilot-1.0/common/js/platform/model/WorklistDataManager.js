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

define("platform/model/WorklistDataManager",
["exports",
 "dojo/_base/lang",
 "dojo/Deferred",
 "platform/logging/Logger",
 "platform/store/SystemProperties",
 "platform/comm/_ConnectivityChecker",
 "platform/model/ResourceDownloadManager",
 "platform/store/_ResourceMetadataContext",
 "dojo/topic"], 
function(thisModule, lang, Deferred, Logger, SystemProperties, ConnectivityChecker, ResourceDownloadManager, ResourceMetadataContext, topic) {
	
	var uiManager = null;

	var ttDownloadAllDataForAllWorklistResourcesAndQueryBases = new TrackTime("WorklistDataManager", "downloadAllDataForAllWorklistResourcesAndQueryBases", "The overall processing", false);
	var ttDownloadAllDataForWorklistResourceAndQueryBase = new TrackTime("WorklistDataManager", "downloadAllDataForWorklistResourceAndQueryBase", "The overall processing", false);
	
	var classBody = lang.mixin(thisModule, {
		
/**@memberOf platform.model.WorklistDataManager */
		_initClassIfNeeded: function() {
			if (!this.init && ResourceDownloadManager.init){
				lang.mixin(this, ResourceDownloadManager);
				this.init();
			}
		},
		
		_setWorklistDataUIManager: function(worklistUIManager){
			uiManager = worklistUIManager;
		},
					
		downloadAllDataForAllWorklistResourcesAndQueryBases: function(){
			this._initClassIfNeeded();
			
			uiManager.showDownloadInProgressDialog();
			
			this._overallProcessing = new Deferred();
			
			var worklistDataResourceTypeCheck = function(metadata){
				return (!metadata.isLocal() && 
						metadata['additionalData'] != true && 
						metadata.getURLBase());
			};
			
			ttDownloadAllDataForAllWorklistResourcesAndQueryBases.startTracking();
			this.downloadAllDataForAllResourcesAndQueryBases(worklistDataResourceTypeCheck).
			then(function success(){
				uiManager.showDownloadCompleteDialog();
			}, 
			function failure(err){
				Logger.log('Processing canceled!');
				if (err != "canceled") {
					uiManager.showDownloadFailedDialog();
				}
			}).
			always(function(){
				uiManager.hideDownloadInProgressDialog();
				ttDownloadAllDataForAllWorklistResourcesAndQueryBases.stopTracking();
			});
			
			return this.progressInfo;
		},
					
		downloadAllDataForSingleWorklistResourceAndQueryBase: function(resourceName, queryBase, applyStablePagination){
			this._initClassIfNeeded();
			this.cleanUp();
			
			var self = this;
			uiManager.showDownloadInProgressDialog();
			
			ttDownloadAllDataForWorklistResourceAndQueryBase.startTracking();
			
			this._overallProcessing = new Deferred();
			
			var resourceMetadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			var metrics = resourceMetadata.getResourceMetrics(queryBase);
			if (metrics && metrics.getNextPageUrl()){
				metrics._nextPageURL = null;
			}
			
			this.needRecordLevelProgressInfo = true;			
			
			this.resourcesCount = 1;
			this.resourcesQueryBaseCount[resourceMetadata.name] = 1;
			this.sendRequestForAllResourceData(resourceMetadata, queryBase, applyStablePagination);
			this._overallProcessing.promise.
			always(function(e){
				ttDownloadAllDataForWorklistResourceAndQueryBase.stopTracking();
				if(e == "canceled"){
					self.cleanUp();	
				}				
			});
			
			return this.progressInfo;
		},
		
		continueDownloadRemaringDataForSingleWorklistResourceAndQueryBase: function(resourceName, queryBase){
			this._initClassIfNeeded();

			var self = this;
			uiManager.showDownloadInProgressDialog();
			
			ttDownloadAllDataForWorklistResourceAndQueryBase.startTracking();
			
			this._overallProcessing = new Deferred();
			
			var resourceMetadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			
			this.needRecordLevelProgressInfo = true;			
			
			this.resourcesCount = 1;
			this.resourcesQueryBaseCount[resourceMetadata.name] = 1;
			this.sendRequestForRemainingResourceData(resourceMetadata, queryBase);
			this._overallProcessing.promise.
			always(function(){
				ttDownloadAllDataForWorklistResourceAndQueryBase.stopTracking();
				self.cleanUp();
			});
			
			return this.progressInfo;
		},		
		
		cancelLastWorklistDataDownloadRequest: function(){
			this.cancelLastResourceDataDownloadRequest();
			topic.publish("afterWorkofflineCancel", null);
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
