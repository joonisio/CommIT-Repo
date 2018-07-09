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

define("platform/model/SystemDataManager",
["exports",
 "dojo/_base/lang",
 "dojo/_base/array",
 "dojo/Deferred",
 "dojo/promise/all",
 "platform/logging/Logger",
 "platform/store/SystemProperties",
 "platform/store/_ResourceMetadataContext",
 "platform/store/PersistenceManager",
 "platform/comm/_ConnectivityChecker",
 "platform/translation/MessageService",
 "platform/model/ResourceDownloadManager",
 "platform/model/_SystemResourceCache",
 "platform/util/CallbackCreator",
 "platform/util/PlatformConstants",
 "platform/ui/ScreenLockManager",
 "platform/store/ResourceMetrics"],
function(thisModule, lang, arrayUtil, Deferred, all, Logger, SystemProperties, ResourceMetadataContext, PersistenceManager, ConnectivityChecker, MessageService, ResourceDownloadManager, SystemResourceCache, 
		CallbackCreator, PlatformConstants, ScreenLockManager, ResourceMetrics) {
	var uiManager = null;
	
	var systemDataResourceTypeCheck = function(metadata){
		return (metadata['isSystem'] == true);
	};
	
	var systemDataResourceRefreshOnLoginCheck = function(metadata){
		return (metadata['isSystem'] == true && metadata['refreshOnLogin'] == true);
	};
	
	var classBody = lang.mixin(thisModule, {
		isDownloadInProgress: false,
		_errorLoadingDataMsg: null,
		_watchHandle: null,
				
		/* getMetricsForSystemData: function(metadata){
			if (metadata.queryBases){
				var queryBases = Object.keys(metadata.queryBases);
				if (queryBases.length > 0){
					return metadata.getResourceMetrics(queryBases[0]);  //There should be only one querybase for system data
				}
			}
			return null;
		},*/
		
		_systemDataReloadCheck: function(metadata){
			if (metadata['isSystem'] != true){
				return false;
			}
			var metrics = metadata.getResourceMetrics(Object.keys(metadata.queryBases)[0]);
			if(metrics){
				metrics.allowRetry = false;
				if(!SystemProperties.getProperty('wasDeltaLastSystemDataDownload')){
					metrics.setMaxrowstamp(null);
				}
			}
			return true;
		},

		_systemDataNotLoadedCheck: function(metadata){
			if (metadata['isSystem'] != true){
				return false;
			}
			var notLoaded = true;
			var metrics = metadata.getResourceMetrics(Object.keys(metadata.queryBases)[0]);
			if(metrics){
				notLoaded = !(metrics.isAllDataDownloaded());
				if(notLoaded){
					metrics.allowRetry = true;
				}
				if(!SystemProperties.getProperty('wasDeltaLastSystemDataDownload')){
					metrics.setMaxrowstamp(null);
				}
			}
			return notLoaded;
		},
		
/**@memberOf platform.model.SystemDataManager */
		_initClassIfNeeded: function() {
			if (!this.init && ResourceDownloadManager.init){
				lang.mixin(this, ResourceDownloadManager);
				this.init();
			}
		},
		
		_setSystemDataUIManager: function(sysUIManager){
			uiManager = sysUIManager;
		},
		
		getErrorLoadingDataMsg: function() {
			this.failedDownloadSystemData = (
				this.failedDownloadSystemData || 
				MessageService.createStaticMessage('failedDownloadSystemData').getMessage()
			);
			return this.failedDownloadSystemData;
		},
		
		downloadSystemDataIfNeeded: function(reload){
			this._initClassIfNeeded();
			var deferred = new Deferred();
			self = this;
			ResourceMetrics._loadMetrics().always(function(){
				var isSystemDataDownloaded = SystemProperties.getProperty(PlatformConstants.SYS_DATA_DOWNLOADED_FLAG);
				if (!isSystemDataDownloaded){
					//There maybe a partial load of system resources so cache the ones already loaded because they won't
					//be cached otherwise. Also the remaining resources may need them for where clause replacement values
					self._loadSystemResourcesToCache(true).always(function(){
						ConnectivityChecker.checkConnectivityAvailable().
						then(self.makeCallback('_downloadSystemDataIfHasConnectivity', deferred, reload)).
						otherwise(self.makeCallback('_reportSystemDataDownloadFailure', deferred));				
					});
				} 
				else {
					/* we need to perform a initial load resource to the cache in order to make them
					 * available for any further dynamic where clause in the next call 
					 * (self._downloadSystemDataRefreshOnLoginIfHasConnectivity).
					 * see platform.comm.CommunicationManager, parseDynamicWhereClause() function.
					 */
					self._loadSystemResourcesToCache(). 
					then(function(){
						if (!SystemProperties.getProperty(PlatformConstants.REFRESH_DATA_ON_LOGIN_FLAG)){
							ConnectivityChecker.checkConnectivityAvailable().
							then(function(isConnected) {
								self._downloadSystemDataRefreshOnLoginIfHasConnectivity(isConnected)
								.then(function() {
									// refresh the system resources the the cache - make in-memory resource up-to-date.
									self._loadSystemResourcesToCache()
									.then(function() {
										deferred.resolve();
									})
									.otherwise(function(err) {
										deferred.reject(err);
									});
								})
								.otherwise(function(err) {
									deferred.reject(err);
								});
							});
						} 
						else {
							deferred.resolve();
						}
					}).
					otherwise(function(err) {
						deferred.reject(err);
					});
				}

			});

			return deferred.promise;
		},
		
		_downloadSystemDataIfHasConnectivity: function(isConnectionAvailable, deferred, reload){
			if (isConnectionAvailable){
				uiManager.showDownloadInProgressDialog();
				var shouldDisplayStayAwake = SystemProperties.getProperty('si.device.keepDisplayAlive');
				if(shouldDisplayStayAwake == true || shouldDisplayStayAwake == null)
					ScreenLockManager.keepDisplayAwake();
				this._downloadSystemData(reload).
				then(this.makeCallback('_finishSystemDataDownload', deferred)).
				otherwise(this.makeCallback('_reportSystemDataDownloadFailure', deferred)).
				always(function() {
					if(shouldDisplayStayAwake == true || shouldDisplayStayAwake == null)
						ScreenLockManager.releaseDisplay();
				});
				
			} else {
				this._reportSystemDataDownloadFailure(this.getErrorLoadingDataMsg(), deferred);			
			}
		},
		
		_finishSystemDataDownload: function(promiseResult, deferred){
			var self = this;
			uiManager.hideDownloadInProgressDialog();
			SystemProperties.setProperty(PlatformConstants.SYS_DATA_DOWNLOADED_FLAG, true, true);
			SystemProperties.setProperty(PlatformConstants.REFRESH_DATA_ON_LOGIN_FLAG, true, true);
			ResourceMetrics._loadMetrics(true).always(function(){
				self._loadSystemResourcesToCache(). 
				then(function(){deferred.resolve();}).
				otherwise(function(){deferred.reject();});
			});
		},
		
		_reportSystemDataDownloadFailure: function(err, deferred){
			var errorMsg = (err && err['errorMsg'] || err);
			if (typeof errorMsg != 'string'){
				errorMsg = errorMsg + "";
			}
			
			Logger.error(errorMsg);
			UI.showAndCloseDialogs("Platform.DownloadError");
			var msg = this.getErrorLoadingDataMsg();
			//Need to resolve this deferred, or else the SystemProperties stores do not get initialized...
			deferred.resolve(msg);
		},
		
		_downloadSystemData: function(reload){
			this.isDownloadInProgress = true;
			this.shouldStop = false;
			
			this._overallProcessing = new Deferred();
			this.needRecordLevelProgressInfo = true;
			var self = this;
			
			if (this._watchHandle){
				this._watchHandle.remove();
				delete this._watchHandle;
				delete uiManager.progressRecord;
			}
			
			this._watchHandle = this.progressInfo.watch(function(attributeName, oldValue, newValue){
				var refreshMsg = true;
				if (attributeName == "resourceCompletedName" && newValue){
					var metadata = ResourceMetadataContext.getResourceMetadata(newValue);
					//Hold next request until data is cached
					self._loadSystemResource(metadata);
					
				} else if (attributeName == "resourcesCompleted"){
					uiManager.resourcesDownloaded = newValue;
					
				} else if (attributeName == "total") {
					uiManager.resourcesToDownload = newValue;
					
				} else if (attributeName == "recordsDownloaded") {
					uiManager.recordsDownloaded = newValue['downloaded'];
					uiManager.recordsToDownload = newValue['total'];
				} else {
					refreshMsg = false;
				}
				
				if (refreshMsg){
					uiManager.updateProgressDialog();
				}
			});
			
			function sorter(metadataList){
				//STEP1: Separate independent resources from dependent ones
				
				//Looks for occurrences of ${xxx.yyy} or ${xxx[yyy].zzz} in whereClause
				var hasDependency = /%24%7B([^.]+?\..+?)%7D/g;
				var independantList = [];
				var dependentList = [];
				arrayUtil.forEach(metadataList, function(metadata){
					hasDependency.lastIndex = 0;
					if (metadata.whereClause && hasDependency.test(metadata.whereClause)){
						dependentList.push(metadata);
					} else {
						independantList.push(metadata);
					}
				});
								
				//STEP2: Sort dependants putting dependants on independent resources first
				dependentList.sort(function(a, b){
					var resourceNameA = a.getResourceName();
					var resourceNameB = b.getResourceName();
					var whereClauseA = a.whereClause;
					var whereClauseB = b.whereClause;
					
					var aDependsOnB = (whereClauseA.indexOf('%24%7B' + resourceNameB + '.') || //${resourceB. 
									   whereClauseA.indexOf('%24%7B' + resourceNameB + '%5B')); //${resourceB[
					
					var bDependsOnA = (whereClauseB.indexOf('%24%7B' + resourceNameA + '.') || //${resourceA. 
							   whereClauseB.indexOf('%24%7B' + resourceNameA + '%5B')); //${resourceA[
			
					if (aDependsOnB && bDependsOnA){
						Logger.log("[DATA] There is a circular dependency in whereClauses between resources " + resourceNameA + " and " + resourceNameB, 2);
					}

					return (aDependsOnB) ? 1 : -1; //if a depends on b, b comes first
				});
				return independantList.concat(dependentList);
			}
			
			return this.downloadAllDataForAllResourcesAndQueryBases((reload?this._systemDataReloadCheck:this._systemDataNotLoadedCheck), sorter, systemDataResourceTypeCheck);
		},
		
		//********** Download refresh on login system data
		_downloadSystemDataRefreshOnLoginIfHasConnectivity: function(isConnectionAvailable) {
			var deferred = new Deferred();
			if (isConnectionAvailable) {
				this._downloadSystemDataRefreshOnLogin().
				then(this.makeCallback('_finishSystemDataRefreshOnLoginDownload', deferred)).
				otherwise(this.makeCallback('_reportSystemDataRefreshOnLoginDownloadFailure', deferred));
			} else {
				deferred.resolve();
				//deferred.reject(this.getErrorLoadingDataMsg());		
			}
			return deferred.promise;
		},
		
		_finishSystemDataRefreshOnLoginDownload: function(promiseResult, deferred){
			SystemProperties.setProperty(PlatformConstants.REFRESH_DATA_ON_LOGIN_FLAG, true, true);
			deferred.resolve();
		},
		
		_reportSystemDataRefreshOnLoginDownloadFailure: function(err, deferred){
			if (err && err.errorCode == 'UNRESPONSIVE_HOST'){
				deferred.resolve();
			}
			else{
				var errorMsg = (err && err['errorMsg'] || err);
				if (typeof errorMsg != 'string'){
					errorMsg = errorMsg + "";
				}
				
				Logger.error(errorMsg);
				var msg = this.getErrorLoadingDataMsg();
				deferred.reject(msg);
				
			}		
		},
		
		_downloadSystemDataRefreshOnLogin: function(){
			return this.downloadAllDataForAllResourcesAndQueryBases(systemDataResourceRefreshOnLoginCheck);
		},
		//***********
		
		_loadSystemResourcesToCache: function(checkIfDownloaded){
			var resourcesMetadataMap = ResourceMetadataContext.getAllResourcesMetadata();
			var resourceNameList = Object.keys(resourcesMetadataMap);
			var promisesArray = [];
			arrayUtil.forEach(resourceNameList, function(resourceName){
				var metadata = resourcesMetadataMap[resourceName];
				if (metadata.isSystem && !metadata.inMemory){
					if (checkIfDownloaded){
						var metrics = metadata.getResourceMetrics(Object.keys(metadata.queryBases)[0]);
						if(metrics && metrics.isAllDataDownloaded()){
							promisesArray.push(this._loadSystemResource(metadata));
						}
					}
					else{
						promisesArray.push(this._loadSystemResource(metadata));
					}
				}
			}, this);
			
			return all(promisesArray);
		},
		
		_loadSystemResource: function(resourceMetadata){
			var tt = new TrackTime('SystemDataManager', '_loadSystemResource', 'Loading system resource [' + resourceMetadata.getResourceName() + '] into cache', false);
			tt.startTracking();
			return PersistenceManager.findAll(resourceMetadata).
			then(function(jsonArray){
				SystemResourceCache.cacheSystemResource(resourceMetadata, jsonArray);
				tt.stopTracking();
			});
		}		
		
	}, ResourceDownloadManager, CallbackCreator.prototype);
	
	//For some wonky reason sometimes UTs load this class before ResourceDownloadManager.
	//In such cases method init didn't get added so defer the init to call when needed
	if (classBody.init){
		classBody.init();
	}
	
});
