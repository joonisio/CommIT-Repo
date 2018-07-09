/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("platform/store/ResourceMetrics",
["dojo/_base/declare",
 "dojo/_base/array",
 "dojo/Deferred",
 "platform/logging/Logger",
 "platform/model/ModelService"
 ], 
function(declare, array, Deferred, Logger, ModelService) {
	var metricResource = null;
	var metricCache = {}; //{resourceName : {querybase1 : <_QuerybaseMetrics>, querybase2: <_QuerybaseMetrics>}}

	function getActiveRefreshForResource (resourceName){
		var resourceMetrics = metricCache[resourceName];
		var activeRefresh = null;
		if (resourceMetrics){
			array.some(Object.keys(resourceMetrics), function(queryBase) {
				var tracker = resourceMetrics[queryBase]._refreshTracker;
				if (tracker){
					if (tracker.isActive()){
						activeRefresh = resourceMetrics[queryBase];
						return true;
					}
					else{
						resourceMetrics[queryBase]._refreshTracker = null;  
					}
				}
				return false;
			});
		}
		return activeRefresh;
	}

	function _getLoadedQueryBases (resourceName){
		var loadedQueryBases = [];
		var resourceMetrics = metricCache[resourceName];
		if (resourceMetrics){
			array.forEach(Object.keys(resourceMetrics), function(queryBase) {
				var metrics = resourceMetrics[queryBase];
				if (metrics.getPagesLoaded() > 0){
					var loadedQueryBase = {};
					loadedQueryBase[queryBase] = metrics;
					loadedQueryBases.push(loadedQueryBase);
				}
			});
		}
		
		return loadedQueryBases;
	}

	function _cancelActiveRefresh (resourceName){
		var activeRefresh = getActiveRefreshForResource(resourceName);
		if (activeRefresh){
			activeRefresh.cancelRefresh();
		}
	}

	var _reloadTracker = declare([], {
		_canceled: false,
		_metrics: null,
		_pagesLoaded: 0,
		pagesToLoad: 0,
		_waitObject: null,
		storeCleared: false,
		_downloadAll: false,
		_finished: false,
		recordsRemoved: false,
		_workListReload: false,
		_countChanged: false,
	
		constructor: function(metrics, downLoadAllPages){
			this._metrics = metrics;
			if (downLoadAllPages){
				var serverCount = metrics.getServerCount();
				this.pagesToLoad = (serverCount == 0 ? 1 : Math.ceil(serverCount / metrics.getPageSize()));
			}
			else{
				this.pagesToLoad = metrics.getPagesLoaded();
			}
			this._downloadAll = downLoadAllPages;
		},
		
/**@memberOf platform.store.ResourceMetrics */
		getPagesLoaded: function(){
			return this._pagesLoaded;
		},
		
		isActive: function(){
			return (!this._canceled && this._pagesLoaded < this.pagesToLoad);
		},
		
		reloadFinished: function(completed){
			if (!this._finished){
				this._finished = true;
				if(this._waitObject){
					var waitDeferred = this._waitObject.waitDeferred;
					this._waitObject = null;
					waitDeferred.resolve(true);
				}
				this._canceled = (completed === false);
				this._metrics._refreshFinished(this);
			}
		},
		
		shouldRemoveRecords: function(){
			return !this.recordsRemoved && this._workListReload && this. _pagesLoaded == 0 && this.isActive();
		},
		
		isCanceled: function(){
			return this._canceled;
		},
		
		_setPagesLoaded: function(pagesLoaded){
			this._pagesLoaded = pagesLoaded;
			if(this._waitObject && this._waitObject.pageWaitingFor == pagesLoaded){
				var waitDeferred = this._waitObject.waitDeferred;
				this._waitObject = null;
				waitDeferred.resolve(true);
			}
		},
		
		_needToWaitForPage: function(page){
			if (this._canceled || page <= this._pagesLoaded){
				return null;
			}
			var pageWaitDeferred = new Deferred();
			this._waitObject = {pageWaitingFor: page, waitDeferred : pageWaitDeferred};
			
			return pageWaitDeferred.promise; 
		},
		
		_cancelReload: function(){
			this.reloadFinished(false);
		}
	});
	
	var _querybaseMetrics = declare([], {
		_metrics: null,
		_refreshTracker: null,
		_refreshPageLimit: -1,
		_nextPageURL: null,
		dataInMemory: false,
		allowRetry: false,
		
		constructor: function(metricsRecord){
			this._metrics = metricsRecord;
		},
		
		getServerCount: function(){
			return this._metrics['serverCount'];
		},
		
		isAllDataDownloaded: function(){
			return this._metrics['allDownloaded'];
		},
		
		hasError: function(){
			if (this._metrics['errorCode']){
				return true;
			}
			return false;
		},
		
		getPagesLoaded: function(){
			var pages = this._metrics['pageCount'];
			return isNaN(pages) ? 0 : pages;
		},
		
		getPageSize: function(){
			return this._metrics['pageSize'];
		},

		getQueryBase: function(){
			return this._metrics['queryBase'];
		},
		
		getWorklistDownloaded: function(){
			return this._metrics['worklistDownloaded'];
		},
		
		setWorklistDownloaded: function(worklistDownloaded){
			this._metrics.set('worklistDownloaded', worklistDownloaded);
		},
		
		_getScanFilterInner: function(){
			return this._metrics['scanFilter'];
		},
		
		getNextPageUrl: function(){
			return this._nextPageURL;
		},
		
		getScanFilter: function(){
			//This is the actual filter used to by the FindByScan control to filter the list.
			//It's stored here so when the user logs back in they can see thier scanned results
			var filterObject = this._getScanFilterInner();
			return (filterObject && filterObject.scanFilter ? filterObject.scanFilter.filter : null);
		},

		getScanValues: function(){
			//This is the string of values to imbed in the findByScan's label
			//It's stored here so when the user logs back in they can see thier scanned results
			var filterObject = this._getScanFilterInner();
			return (filterObject && filterObject.scanFilter ?filterObject.scanFilter.scanValues : '');
		},

		clearScanFilter: function(){
			var filterObject = this._getScanFilterInner();
			if (filterObject){
				var beforeScan = filterObject.beforeScan;
				if (beforeScan){
					this._setServerCount(beforeScan.serverCount);
					this._setPagesLoaded(beforeScan.pagesLoaded);
					this._setAllDataDownloaded(beforeScan.allDataDownloaded);
				}
				delete filterObject['scanFilter'];
				this._metrics.set('scanFilter', filterObject);
				this._save();
			}
		},
		
		initBeforeScan: function(){
			var filterObject = this._getScanFilterInner();
			if (filterObject){
				this.clearScanFilter();
			}
			else{
				filterObject = {beforeScan:{pagesLoaded: this.getPagesLoaded(), 
					serverCount: this.getServerCount(), 
					allDataDownloaded : this.isAllDataDownloaded()}};
				this._metrics.set('scanFilter', filterObject);
				this._save();
			}
			
		},
		
		/**
		 * Expected initBeforeScan to be called before this 
		 **/
		setScanFilter: function(scanFilter){
			var filterObject = this._getScanFilterInner();
			if(scanFilter){
				filterObject['scanFilter'] = scanFilter;
			}
			else{
				delete filterObject['scanFilter'];
			}
			this._metrics.set('scanFilter', filterObject);
			this._save();
		},

		queryBaseDataInMemory: function(){
			this.dataInMemory = true;
		},
		
		firstPageLoaded: function(pageSize, serverCount, maxFetchDataLimit, nextPageURL){
			this.allowRetry = false;
			if (!pageSize){
				pageSize = 40;
			}
			if (isNaN(serverCount) || serverCount == null){
				serverCount = pageSize;
			}
			if (this._refreshTracker && this._refreshTracker.isActive()){
				this._refreshTracker._countChanged = (this._refreshTracker.recordsRemoved || serverCount != this.getServerCount());
				if (this._refreshTracker._downloadAll){
					this._refreshTracker.pagesToLoad = (serverCount == 0 ? 1 : Math.ceil(serverCount / pageSize)); //Worklist download ensure pagesToLoad are correct
				}
				this._refreshTracker._setPagesLoaded(1);
				if (this._refreshTracker.recordsRemoved){
					this._setPagesLoaded(1);
				}
				if (this._refreshTracker._countChanged || !this.isAllDataDownloaded()){
					this._setAllDataDownloaded(!nextPageURL || serverCount <= pageSize);
				}
			}
			else{
				this._setPagesLoaded(1);
				this._setAllDataDownloaded(!nextPageURL || serverCount <= pageSize); //Reset even on refresh
			}
			this.queryBaseDataInMemory();
			if (this._refreshPageLimit < 0){
				this._refreshPageLimit = (maxFetchDataLimit < 1) ? 0 : Math.ceil(maxFetchDataLimit/pageSize);
				this._setPageSize(pageSize);
			}
			this._setServerCount(serverCount); //Needs to be set after call to setPageSize
			this._nextPageURL = nextPageURL;
			this._setErrorCode(null);
			return this._save();
		},
		
		nextPageLoaded: function(nextPageURL, recordsDownloaded){
			if (this._refreshTracker && this._refreshTracker.isActive()){
				var pageNum = this._refreshTracker._pagesLoaded + 1;
				this._refreshTracker._setPagesLoaded(pageNum);
				if(this._refreshTracker.recordsRemoved || this.getPagesLoaded() < pageNum){
					this._setPagesLoaded(pageNum);
				}
				if (this._refreshTracker._countChanged || !this.isAllDataDownloaded()){
					this._setAllDataDownloaded(pageNum * this.getPageSize() >= this.getServerCount());
				}
			}
			else{
				var pageNum = this.getPagesLoaded() + 1;
				this._setPagesLoaded(pageNum);
				if (!nextPageURL){
					var totalCount = recordsDownloaded + ((pageNum - 1) *  this.getPageSize());
					//Work around for oslc bug.  If fetchlimit is set for a business object, oslc returns that as the server count regardless of the actual number of records
					if (this.getServerCount() > totalCount){
						this._setServerCount(totalCount);
					}
					this._setAllDataDownloaded(true);
				}
				else{
					this._setAllDataDownloaded(pageNum * this.getPageSize() >= this.getServerCount());
				}
			}
			this._nextPageURL = nextPageURL;
			return this._save();
		},
		
		hasPassedFetchLimit: function(maxFetchDataLimit, pageSize){
			var pagesLoaded = this.getPagesLoaded();
			if (this._refreshPageLimit >= 0){
				return this._refreshPageLimit > 0 && pagesLoaded > this._refreshPageLimit;
			}
			if (pagesLoaded == 0 || !maxFetchDataLimit || !pageSize){
				return false;
			}
			var currentPageSize = this.getPageSize();
			if (currentPageSize != pageSize){
				this._setPageSize(pageSize);
				this._save();
			}
			this._refreshPageLimit = Math.ceil(maxFetchDataLimit/pageSize);
			return pagesLoaded > this._refreshPageLimit;
		},

		canGetNextPageFromLocal: function(nextPageNumber){
			var deferred = new Deferred();
			var pageWaitDeferred;
			if(this._refreshTracker && (pageWaitDeferred = this._refreshTracker._needToWaitForPage(nextPageNumber))){
				pageWaitDeferred.then(function(pageRefreshed){
					deferred.resolve(pageRefreshed);
				}).otherwise(function(error){
					deferred.resolve(false);
				});
			}
			else{
				deferred.resolve(this.getPagesLoaded() >= nextPageNumber);
			} 
			return deferred.promise;
		},
		
		canPerfromDataCleanup: function(){
			return (this._refreshTracker == null || (!this._refreshTracker.storeCleared && !this._refreshTracker.isActive()));
		},

		startWorkListDownload: function(storeCleared, allPagesFromServer){
			_cancelActiveRefresh(this._metrics['resourceName']);
			this._refreshTracker = new _reloadTracker(this, allPagesFromServer);
			this._refreshTracker.storeCleared = this._refreshTracker.recordsRemoved = (storeCleared === true);
			this._refreshTracker._workListReload = true;
			return this._refreshTracker;
		},
		
		wasWorklistStoreCleared: function(){
			return (this._refreshTracker && this._refreshTracker.isActive() && this._refreshTracker.storeCleared);
		},
		
		startRefresh: function(forceRefresh){
			if(this.getPagesLoaded() > 0){
				var activeRefresh = getActiveRefreshForResource(this._metrics['resourceName']);
				if(activeRefresh){
					if (forceRefresh){
						activeRefresh.cancelRefresh();
					}
					else{
						return null;
					}
				}
				
				this._refreshTracker = new _reloadTracker(this, false);
				return this._refreshTracker;
			}
			else{
				return null;
			}
		},
		
		cancelRefresh: function(){
			if (this._refreshTracker){
				this._refreshTracker._cancelReload();
			}
		},
		
		waitForRefreshToComplete: function(){
			if(this._refreshTracker){
				var pageWaitPromise = this._refreshTracker._needToWaitForPage(this.getPagesLoaded());
				if (pageWaitPromise){
					return pageWaitPromise;
				}
			}
			var deferred = new Deferred();
			deferred.resolve();
			return deferred.promise;
		},

		isOnlyQueryBaseLoaded: function(){
			var loadedQueryBases = _getLoadedQueryBases(this._metrics['resourceName']);
			return (loadedQueryBases.length == 1 && loadedQueryBases[0][this.getQueryBase()] == this);
		},
		
		_refreshFinished: function(callingTracker){
			if (callingTracker == this._refreshTracker){
				var allDown = this._refreshTracker._pagesLoaded * this.getPageSize() >= this.getServerCount();
				this._setAllDataDownloaded(allDown);
				this._refreshTracker = null;
			}
		},
		
		_refactorPagesLoaded: function(currentPageSize, pageSize){
			if (currentPageSize > 0){
				var pagesLoaded = this.getPagesLoaded();
				if (pagesLoaded > 1){
					var serverCount = this.getServerCount();
					var loadedCount = serverCount * pageSize;
					if (loadedCount > serverCount){
						loadedCount = serverCount;
					}
					adjustedLoadedCount = Math.ceil(loadedCount/pageSize);
					this._setPagesLoaded(adjustedLoadedCount);
				}
			}
		},
		
		_setPagesLoaded: function (pageNumber){
			this._metrics.set('pageCount', pageNumber);
		},

		markAsAllDataDownloaded: function(){
			this._metrics.set('allDownloaded', true);
			this._save();
		},

		_setAllDataDownloaded: function(allDownloaded){
			this._metrics.set('allDownloaded', allDownloaded);
		},
		
		_setServerCount: function(serverCount){
			this._metrics.set('serverCount',serverCount);
		},

		_setErrorCode: function(error){
			this._metrics.set('errorCode',error);
		},

		setError: function(error){
			this._setErrorCode(error);
			this._save();
		},

		_setPageSize: function(pageSize){
			var currentPageSize = this._metrics['pageSize'];
			if (currentPageSize != pageSize){
				this._refactorPagesLoaded(currentPageSize, pageSize);
				this._metrics.set('pageSize', pageSize);
			}
		},

		_save: function(){
			var deferred = new Deferred();
			ModelService.save(metricResource).then(function(dataSet){
				deferred.resolve();
			}).otherwise(function(){
				//TODO - log error	
				deferred.resolve();
			});
			return deferred.promise;
		},
		
		setMaxrowstamp: function(date){
			this._metrics.set('maxrowstamp', date);
		},
		
		getMaxrowstamp: function(){
			return this._metrics['maxrowstamp'];
		}

	});

	return {
		_loadMetrics: function(reload){
			var deferred = new Deferred();
			if (metricResource && !reload){
				deferred.resolve();
				return deferred.promise;
			}
			ModelService.allLocalOnly('PlatformResourceMetricsResource').then(function(dataSet){
				metricResource = dataSet;
				if (dataSet.data){
					array.forEach(dataSet.data, function(metricsRecord){
						var resourceName = metricsRecord['resourceName'];
						var resourceMetrics = metricCache[resourceName];
						if (!resourceMetrics){
							resourceMetrics = {};
							metricCache[resourceName] = resourceMetrics;
						}
						var querybaseMetrics = new _querybaseMetrics(metricsRecord);
						resourceMetrics[querybaseMetrics.getQueryBase()] = querybaseMetrics;
					});
				}
				deferred.resolve();
			}).otherwise(function(){
				//TODO - log error
				deferred.resolve();
			});
			return deferred.promise;
		},
		
		getMetricsForResource : function(resourceName, querybase){
			var querybaseMetrics = null;
			
			if (querybase && metricResource){
				var resourceMetrics = metricCache[resourceName];
				if (!resourceMetrics){
					resourceMetrics = {};
					metricCache[resourceName] = resourceMetrics;
				}
				else{
					querybaseMetrics = resourceMetrics[querybase];
				}
				if (!querybaseMetrics){
					var queryBaseRecord = metricResource.createNewRecord();
					queryBaseRecord.set('queryBase', querybase);
					queryBaseRecord.set('resourceName', resourceName);
					queryBaseRecord.set('pageCount', 0);
					queryBaseRecord.set('serverCount', 0);
					queryBaseRecord.set('pageSize', 0);
					querybaseMetrics =  new _querybaseMetrics(queryBaseRecord);
					resourceMetrics[querybase] = querybaseMetrics;
				}
			}
			return querybaseMetrics;
		},

		cancelActiveRefresh: function(resourceName){
			_cancelActiveRefresh(resourceName);
		},
		
		clearActiveQueryBaseForResource: function(resourceName){
			var resourceMetrics = metricCache[resourceName];
			if (resourceMetrics){
				array.forEach(Object.keys(resourceMetrics), function(queryBase) {
					var metrics = resourceMetrics[queryBase];
					metrics.cancelRefresh();
					metrics.dataInMemory = false;
					metrics.clearScanFilter();
				});
			}
		},
		
		getLoadedQueryBases: function(resourceName){
			return _getLoadedQueryBases(resourceName);
		}
		
	};
});
