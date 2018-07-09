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

define("platform/model/ResourceDownloadManager",
["exports",
 "dojo/_base/lang",
 "dojo/_base/array",
 "dojo/promise/all",
 "dojo/Deferred",
 "dojo/Stateful",
 "platform/exception/PlatformRuntimeException",
 "platform/logging/Logger",
 "platform/store/_ResourceMetadataContext",
 "platform/model/ModelService",
 "platform/store/SystemProperties",
 "platform/comm/_ConnectivityChecker",
 "dojo/topic"], 
function(thisModule, lang, arrayUtil, all, Deferred, Stateful, PlatformRuntimeException, Logger, ResourceMetadataContext, 
		 ModelService, SystemProperties, ConnectivityChecker, topic) {

	function forAllAttributes(obj, callback){
		for (var attr in obj){
			if(obj.hasOwnProperty(attr)){
				callback(obj[attr], obj, attr);
			}
		}
	}

	function getResourceMetadataList(validResourceValidator, resourceListSorter){
		var resourcesMetadataMap = ResourceMetadataContext.getAllResourcesMetadata();
		var result = [];
		
		forAllAttributes(resourcesMetadataMap, function(metadata){
			if (validResourceValidator(metadata)){
				result.push(metadata);
			}
		});
		
		if (resourceListSorter){
			result = resourceListSorter(result);
		}
		
		return result;
	}	
	
		
	lang.mixin(thisModule, {
		maxRequests: 1, //this needs to be taken from config
		requestsTriggered: 0,
		pendingRequestsQueue: null,
		resourcesQueryBaseCount: null,
		resourcesDone: 0,
		resourcesCount: 0,
		recordsCount: 0,
		shouldStop: false,
		needRecordLevelProgressInfo: false,
		
		_overallProcessing: null,
		progressInfo: null,
		postDownloaPromise: null,
		
/**@memberOf platform.model.ResourceDownloadManager */
		init: function() {
			this.pendingRequestsQueue = [];
			this.resourcesQueryBaseCount = {};
			var resolvedDeferred = new Deferred();
			resolvedDeferred.resolve();
			this._overallProcessing = resolvedDeferred;
			this.progressInfo = new Stateful({
				resourceDownloading: null,
				queryBaseDownloading: null,
				resourceCompletedName: null, 
				resourcesCompleted: 0, 
				recordsDownloaded: {downloaded: null, total: null},
				total: 0,
				attachmentProgress: null
			});
		},
		
		cancelIndicator: function(){
			var self = this;
			return {
				shouldCancel: function(){
					return self.shouldStop;
				}
			};
		},
		
		cleanUp: function(){
			Logger.trace('Cleaned up');
			this.requestsTriggered = 0;
			this.pendingRequestsQueue = [];
			this.resourcesQueryBaseCount = {};
			this.resourcesDone = 0;
			this.resourcesCount = 0;
			this.shouldStop = false;
			this.progressInfo.set({
				resourceDownloading: null,
				queryBaseDownloading: null,
				resourceCompletedName: null, 
				resourcesCompleted: 0,
				total: 0
			});
		},
		
		canSubmitRequest: function(){
			return this.requestsTriggered < this.maxRequests;
		},
		
		sendProgressInfoToListeners: function(resourceName){
			this.progressInfo.set({
				resourceCompletedName: resourceName, 
				resourcesCompleted: this.resourcesDone, 
				total: this.resourcesCount
			});
			
			Logger.trace("progress: " + JSON.stringify(this.progressInfo));
		},
		
		reportProgressIfResourceIsComplete: function(resourceMetadata){
			var allWorkIsDone = false;
			if (this.resourcesQueryBaseCount[resourceMetadata.name] == 0){
				this.resourcesDone++;
				this.sendProgressInfoToListeners(resourceMetadata.name);
				
				allWorkIsDone = (this.resourcesDone == this.resourcesCount);
				if (allWorkIsDone){
					Logger.trace('All resources completed!');
					
					this.cleanUp();	
					this._overallProcessing.resolve();
				}
			}

			return allWorkIsDone;
		},
		
		consumeQueueIfNeeded: function(){
			if (this.pendingRequestsQueue.length > 0){
				var request = this.pendingRequestsQueue.shift(); //FIFO
				this.sendRequestForAllResourceData(request['metadata'],request['queryBase']);
				
			} else { //if we got here, the work was canceled, so we need to clean up
				this.cleanUp();
			}
		},
		
		shouldStopProcessing: function(){
			return this._overallProcessing.isCanceled() || this._overallProcessing.isRejected();
		},
		
		computeProgress: function(resourceMetadata){
			this.requestsTriggered--;
			this.resourcesQueryBaseCount[resourceMetadata.name]--;
			var allWorkIsDone = this.reportProgressIfResourceIsComplete(resourceMetadata);
			if (allWorkIsDone){
				return;
			}
			
			this.consumeQueueIfNeeded();
		},
		
		computeProgressWhenFail: function(resourceMetadata, queryBase, err){
			/*var metric = resourceMetadata.getResourceMetrics(queryBase);
			metric._metrics.set('errorCode',err.invocationResult.errors[0]['oslc:statusCode']);*/
			this.requestsTriggered--;
			this.resourcesQueryBaseCount[resourceMetadata.name]--;
			var allWorkIsDone = this.reportProgressIfResourceIsComplete(resourceMetadata);
			if (allWorkIsDone){
				return;
			}
			
			this.consumeQueueIfNeeded();
		},
		
		sendRequestForAllResourceData: function(resourceMetadata, queryBase, applyStablePagination){
			var resourceName = resourceMetadata.name;
			var self = this;
			if(this.shouldStopProcessing()){
				Logger.trace('stopped');
				return;
			}
			var queryBaseForMsg = (queryBase || '<none>');
			var msg = 'Sending request for ' + resourceName + ', queryBase: ' + queryBaseForMsg;
			Logger.trace(msg);
			Logger.trace('Can still send ' + (this.maxRequests - this.requestsTriggered) + ' requests');
			
			if (this.canSubmitRequest()){
				var ttSendRequestForAllResourceData = new TrackTime("ResourceDownloadManager", "sendRequestForAllResourceData", msg, false);
				ttSendRequestForAllResourceData.startTracking();
				this.requestsTriggered++;
				Logger.trace('Sent request for ' + resourceName + ', queryBase: ' + queryBaseForMsg + ' to ModelService');
				
				self.progressInfo.set({'resourceDownloading': resourceName, 'total': this.resourcesCount, 'resourcesCompleted': this.resourcesDone});
				if (queryBase){
					self.progressInfo.set('queryBaseDownloading', queryBase);
				}
				
				var recordProgressCallback = null;
				if (this.needRecordLevelProgressInfo){
					recordProgressCallback = (function(){
						var downloaded = 0;
						return function(recordsDownloadedOrAttachmentInfo, recordsCount, resetCounts){
							if (arguments.length === 1 && 
								lang.isObject(recordsDownloadedOrAttachmentInfo)){

								self.progressInfo.set('attachmentProgress', recordsDownloadedOrAttachmentInfo);

							} else {
								if (resetCounts){
									downloaded = 0;
									self.recordsCount = recordsCount;
								}
								downloaded += recordsDownloadedOrAttachmentInfo;
								self.progressInfo.set('recordsDownloaded', {'downloaded': downloaded, 'total': self.recordsCount});
							}
						};
					})();
				}
				
				//var postPreviousDownloadPromise = this.postDownloaPromise;
				//if (!postPreviousDownloadPromise) {
					//postPreviousDownloadPromise = new Deferred().resolve();
				//}
				
				//postPreviousDownloadPromise.then(function() {	
				//var metric = resourceMetadata.getResourceMetrics(queryBase);
				//var lastDownloaDateAndTime = metric.getLastDownloaDateAndTime('lastDownloaDateAndTime');
				//metric.setLastDownloaDateAndTime(new Date());
					ModelService._downloadAllRecordsFromResource(self.cancelIndicator(), resourceMetadata, queryBase, recordProgressCallback, applyStablePagination).
					then(function success(){
						Logger.log('Request for ' + resourceName + ', queryBase: ' + queryBaseForMsg + ' was completed');
						ttSendRequestForAllResourceData.stopTracking();
						self.computeProgress(resourceMetadata);
					}, 
					function failure(err){
						ttSendRequestForAllResourceData.stopTracking();
						var isAlreadyCanceled = self.shouldStop;
						//Only lookup data should continue on
						if (resourceMetadata.isSystem || !resourceMetadata.additionalData){
							self.cleanUp();
							self.shouldStop = true;
						}
						var errMsg = (lang.isObject(err)) ? lang.getObject('messageKey', null, err) : err;
						var syncDownload = SystemProperties.getProperty('si.worklistSyncDownload');
						/*var metric = resourceMetadata.getResourceMetrics(queryBase);
						metric.set('error',500);*/
						//metric.setLastDownloaDateAndTime(lastDownloaDateAndTime);
						if (errMsg == "downloadCanceled" || isAlreadyCanceled){
							Logger.log('[DATA] Download of records for ' + resourceName + ', queryBase: ' + queryBaseForMsg + 'was canceled');
							self._overallProcessing.cancel('canceled');	
							if (syncDownload==="true"){
								topic.publish("afterWorkofflineCancel", null);	
							}
						} else {
							Logger.log('[DATA] Failed to get data from adapter for ' + resourceName + ', queryBase: ' + queryBaseForMsg);
							//Only lookup data should continue on
							if (resourceMetadata.isSystem || !resourceMetadata.additionalData){
								self._overallProcessing.reject(err);
							}
							else{
								self.computeProgressWhenFail(resourceMetadata, queryBaseForMsg, err);
							}
						}

					});
					
				//});
				
			} else {
				//FIFO
				Logger.trace('Queueing request for ' + resourceName + ', queryBase: ' + queryBaseForMsg);
				self.pendingRequestsQueue.push({metadata: resourceMetadata, queryBase: queryBase});			
			}
		},
		
		sendRequestForRemainingResourceData: function(resourceMetadata, queryBase){
			var resourceName = resourceMetadata.name;
			var self = this;
			if(this.shouldStopProcessing()){
				Logger.trace('stopped');
				return;
			}
			var queryBaseForMsg = (queryBase || '<none>');
			var msg = 'Sending request for ' + resourceName + ', queryBase: ' + queryBaseForMsg;
			Logger.trace(msg);
			Logger.trace('Can still send ' + (this.maxRequests - this.requestsTriggered) + ' requests');
			
			if (this.canSubmitRequest()){
				this.shouldStop = false;
				var ttsendRequestForRemainingResourceData = new TrackTime("ResourceDownloadManager", "sendRequestForRemainingResourceData", msg, false);
				ttsendRequestForRemainingResourceData.startTracking();
				this.requestsTriggered++;
				Logger.trace('Sent request for ' + resourceName + ', queryBase: ' + queryBaseForMsg + ' to ModelService');
				
//				self.progressInfo.set({'resourceDownloading': resourceName, 'total': this.resourcesCount, 'resourcesCompleted': this.resourcesDone});
//				if (queryBase){
//					self.progressInfo.set('queryBaseDownloading', queryBase);
//				}
//				
				var recordProgressCallback = null;
				if (this.needRecordLevelProgressInfo){
					recordProgressCallback = (function(){
						var downloaded = self.progressInfo['recordsDownloaded'].downloaded;
						
						return function(recordsDownloadedOrAttachmentInfo, recordsCount, resetCounts){
							if (arguments.length === 1 && 
								lang.isObject(recordsDownloadedOrAttachmentInfo)){

								self.progressInfo.set('attachmentProgress', recordsDownloadedOrAttachmentInfo);

							} else {
								if (resetCounts){
									downloaded = 0;
									self.recordsCount = recordsCount;
								}
								downloaded += recordsDownloadedOrAttachmentInfo;
								self.progressInfo.set('recordsDownloaded', {'downloaded': downloaded, 'total': self.recordsCount});
							}
						};
					})();
				}
				
				var postPreviousDownloadPromise = this.postDownloaPromise;
				if (!postPreviousDownloadPromise) {
					postPreviousDownloadPromise = new Deferred().resolve();
				}
				
				postPreviousDownloadPromise.then(function() {					
					ModelService.downloadRemainingRecordsFromResource(self.cancelIndicator(), resourceMetadata, queryBase, recordProgressCallback).
					then(function success(){
						Logger.log('Request for ' + resourceName + ', queryBase: ' + queryBaseForMsg + ' was completed');
						ttsendRequestForRemainingResourceData.stopTracking();
						self.computeProgress(resourceMetadata);
					}, 
					function failure(err){
						ttsendRequestForRemainingResourceData.stopTracking();
						self.cleanUp();
						var isAlreadyCanceled = self.shouldStop;
						self.shouldStop = true;
						var errMsg = (lang.isObject(err)) ? lang.getObject('messageKey', null, err) : err;
						var syncDownload = SystemProperties.getProperty('si.worklistSyncDownload');
						
						if (errMsg == "downloadCanceled" || isAlreadyCanceled){
							Logger.log('[DATA] Download of records for ' + resourceName + ', queryBase: ' + queryBaseForMsg + 'was canceled');
							self._overallProcessing.cancel('canceled');	
							if (syncDownload==="true"){
								topic.publish("afterWorkofflineCancel", null);	
							}
						} else {
							Logger.log('[DATA] Failed to get data from adapter for ' + resourceName + ', queryBase: ' + queryBaseForMsg);
							self._overallProcessing.reject(err);
						}

					});
					
				});
				
			} else {
				//FIFO
				Logger.trace('Queueing request for ' + resourceName + ', queryBase: ' + queryBaseForMsg);
				self.pendingRequestsQueue.push({metadata: resourceMetadata, queryBase: queryBase});			
			}
		},		
		
		cancelLastResourceDataDownloadRequest: function(){
			this.shouldStop = true;
		},
		
		getMetaDataList: function(validResourceValidator){
			return getResourceMetadataList(validResourceValidator);
		},

		downloadAllDataForAllResourcesAndQueryBases: function(validResourceValidator, resourceListSorter, totalCountValidator){
			var self = this;
			//self._overallProcessing = new Deferred();

			var resourceMetadataList = getResourceMetadataList(validResourceValidator, resourceListSorter);
			
			/*
				if(isDelta){
				arrayUtil.forEach(resourceMetadataList, function(resourceMetadata){
					resourceMetadata.isDelta = isDelta;
					
				});
			}*/

			if (totalCountValidator){
				//The resourceMetadataList could be a partial list if the last attempted download failed 
				//so this validator function will return the overall total so the total to be download in the 
				//progress indicator will be correct.  
				var countMetadataList = getResourceMetadataList(totalCountValidator);
				self.resourcesCount = countMetadataList.length;
				self.resourcesDone = countMetadataList.length - resourceMetadataList.length;
				self.progressInfo.set('resourcesCompleted', self.resourcesDone);
			}
			else{
				self.resourcesCount = resourceMetadataList.length;
			}
			self.progressInfo.set('total', self.resourcesCount);

			if (resourceMetadataList.length == 0){
				self._overallProcessing.resolve();
				return self._overallProcessing.promise;
			}
			
			arrayUtil.forEach(resourceMetadataList, function(resourceMetadata){
				var queryBasesList = Object.keys(resourceMetadata.queryBases);
				var queryBaseCount = queryBasesList.length;
				if (queryBaseCount == 0){ //if no queryBase, send a single request for the resource
					self.resourcesQueryBaseCount[resourceMetadata.name] = 1;
					self.sendRequestForAllResourceData(resourceMetadata);
					
				} else { //send one resource per queryBase
					self.resourcesQueryBaseCount[resourceMetadata.name] = queryBaseCount;
					arrayUtil.forEach(queryBasesList, function(queryBase){
						self.sendRequestForAllResourceData(resourceMetadata, queryBase);
					});
				}
			});
				
			return self._overallProcessing.promise;
		}
		
	});
	
});
