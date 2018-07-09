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

define("platform/store/_LocalDataAccessStrategy",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "dojo/Deferred", 
 "platform/store/_DataAccessStrategyBase",
 "platform/logging/Logger",
 "platform/util/PlatformConstants"], 
function(declare, lang, arrayUtil, Deferred, DataAccessStrategyBase, Logger, PlatformConstants) {
	//Need to defer PersistenceManager dependency loading due to circular reference
	//PersistenceManager => ResourceMetadata => _LocalDataAccessStrategy => PersistenceManager
	var PersistenceManager = null;
	
	function _includePaginationInfo(resultSet, pageSize, offset, query){
		if (typeof pageSize == 'number'){
			if (resultSet.length == pageSize + 1){ //there is a next page 
				offset = (!(typeof offset == 'number')) ? pageSize : (offset != -1) ? offset + pageSize : -1; //move offset to the next page or set to -1 if no more pages available
				//remove the extra record as it will be retrieved as the 1st record of next page
				resultSet.splice(-1,1);
			} else {
				offset = -1;
			}
			var nextLocalPageInfo = {
				pageSize: pageSize,
				offset: offset,
				lastQuery: query
			};
			
			resultSet['_nextLocalPageInfo'] = nextLocalPageInfo;
		}
	}
	
	return declare("", DataAccessStrategyBase, {
	
/**@memberOf platform.store._LocalDataAccessStrategy */
		_ensurePersistenceManagerIsAvailable: function(){
			var callerDeferred = new Deferred();
			if (PersistenceManager){
				callerDeferred.resolve();
			} else {
				require(["platform/store/PersistenceManager"], function(PM){
					PersistenceManager = PM;
					callerDeferred.resolve();
				});
			}
			return callerDeferred.promise;
		},
		
		getAllLocalResourceData: function(queryBase, pageSize){
			return this._localGetAllResourceDataFromStore(queryBase, pageSize).
				then(function(resultSet){
					resultSet.fetchedFromServer = false;
					return resultSet;
			});
		},
		
		getAllResourceData: function(queryBase, pageSize){
			return this._localGetAllResourceDataFromStore(queryBase, pageSize);
		},
		
		_localGetAllResourceDataFromStore: function(queryBase, pageSize, offset){
			var self = this;
			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				Logger.trace('[DATA] A request for data was received for resource ' + self._metadata.name);
				Logger.trace('[DATA] Fetching data from local store');
			
				//Get a pagesize+1 records so if we get pagesize records there is a next page for sure
				return PersistenceManager.findAll(self._metadata, queryBase, pageSize + 1, offset).
				then(function(resultSet){
					Logger.trace('[DATA] Data fetched. Returning to consumer');
					_includePaginationInfo(resultSet, pageSize, offset);
					return resultSet;
				});
			});
		},
		
		queryResourceData: function(queryBase, query, pageSize, isExactMatch, returnAttr){
			return this._localQueryResourceDataFromStore(queryBase, query, pageSize, null, isExactMatch, returnAttr);
		},
		
		_localQueryResourceDataFromStore: function(queryBase, query, pageSize, offset, isExactMatch, returnAttr){
			var self = this;
			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				Logger.trace('[DATA] A request for data was received for resource ' + self._metadata.name);
				Logger.trace('[DATA] Fetching data from local store');
				
				//Get a pagesize+1 records so if we get pagesize records there is a next page for sure
				var promise = null;
				if (isExactMatch){
					promise = PersistenceManager.findExact(query, self._metadata, queryBase, pageSize + 1, offset);
				} else {
					promise = PersistenceManager.find(query, self._metadata, queryBase, pageSize + 1, offset, returnAttr);
				}
				return promise.
				then(function(resultSet){
					Logger.trace('[DATA] Data fetched. Returning to consumer');
					_includePaginationInfo(resultSet, pageSize, offset, query);
					return resultSet;
				});
			});
		},
		
		getResourceNextPageData: function(nextPageInfo){
			return this._localGetResourceNextPageDataFromStore(nextPageInfo);
		},
		
		_localGetResourceNextPageDataFromStore: function(nextPageInfo, serverEnsuredHasNextPage){
			var self = this;
			
			//if there is no more pages to load
			//just resolve the promise as false
			if (!nextPageInfo.hasNextLocalPage() && !serverEnsuredHasNextPage){
				var deferred = new Deferred();
				deferred.resolve(false);
				return deferred.promise;
			}
						
			var queryBase = nextPageInfo['queryBase'];
			var nextLocalPageInfo = nextPageInfo.nextLocalPageInfo;
			var pageSize = nextLocalPageInfo['pageSize'];
			
			var offset = nextLocalPageInfo['offset'];
			if (offset == -1 && serverEnsuredHasNextPage){
				offset = pageSize * (nextPageInfo[PlatformConstants.NEXT_PAGE_NUM] - 1);
			}
			var lastQuery = nextLocalPageInfo['lastQuery'];

			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				Logger.trace('[DATA] A request for the next page of data was received for resource ' + self._metadata.name);
				Logger.trace('[DATA] Fetching data from local store');
				
				//Get a pagesize+1 records so if we get pagesize records there is a next page for sure
				var pageSizePlus1 = pageSize + 1;
				if (lang.isObject(lastQuery)){
					return PersistenceManager.find(lastQuery, self._metadata, queryBase, pageSizePlus1, offset);
				} else {
					return PersistenceManager.findAll(self._metadata, queryBase, pageSizePlus1, offset);
				}
			}).
			then(function(resultSet){
				Logger.trace('[DATA] Data fetched. Returning to consumer');
				offset = (resultSet.length > pageSize) ? offset : -1; //if less than a page was returned, there is no more pages to load
				_includePaginationInfo(resultSet, pageSize, offset, lastQuery);
//				var metrics = self._metadata.getResourceMetrics(queryBase);
//				if (metrics){
//					metrics.markCurrentPageRefreshed();
//				}
				return resultSet;
			});
		},
		
		getResourceById: function(resourceid){
			var self = this;
			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				return PersistenceManager.findById(self._metadata, queryBase);
			});
		},
		
		getResourceByRef: function(resourceRef){
			return this._localGetResourceByRef(resourceRef);
		},
		
		_localGetResourceByRef: function(resourceRef){
			var self = this;
			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				return PersistenceManager.findExact({'remoteid': (resourceRef['remoteid'] || resourceRef)}, self._metadata);
			});
		},
		
		getChildResourceData: function(parentModelData, complexAttributeName){
			return this._localGetChildResourceData(parentModelData, complexAttributeName);
		},
		
		_localGetChildResourceData: function(parentModelData, complexAttributeName){
			var self = this;
			
			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				return PersistenceManager.findExact({'remoteid': self._findTopRemoteId(parentModelData)}, self._findTopMetadata(parentModelData.getOwner()));//KRISHNA self._metadata);
			}).
			then(function(dataArray){
				if (dataArray.length > 0){
					return self._findComplexAttribute(dataArray[0].json, parentModelData, complexAttributeName);
					
					dataArray = null;
				} else {
					return [];
				}
			});
		},
		_findComplexAttribute: function(data, parentModelData, complexAttributeName)
		{
			// First find the relationship path
			// worktask->[procedureList]
			// worktask->[procedureRID]
			//
			var relationPath = [];
			var relationPathRemoteIdMap = {};
			this._findRelationPath(parentModelData, relationPath, relationPathRemoteIdMap);
			
			// Navigate the data with the information.
			var relatedData = data;

			if (relatedData)
			{
				arrayUtil.forEach(relationPath, function(relation){
					var remoteId = relationPathRemoteIdMap[relation];
					var relatedChildData = relatedData[relation];
					// loop through the child data to find the remote id
					arrayUtil.forEach(relatedChildData, function(childRecord){
						if (childRecord["remoteid"] == remoteId)
						{
							relatedData = childRecord;
							return;
						}
					});
				});

				if (relatedData)
				{
					relatedData = relatedData[complexAttributeName];	
				}
			}

			
			return relatedData;
		},
		
		_findRelationPath: function(parentModelData, relationPath, relationPathRemoteIdMap)
		{
			if (!parentModelData.getOwner())
			{
				return;
			}
			if (parentModelData.getOwner().getParent() == null)
			{
				// reached the top
				return ;
			}
						
			var relationWithParent = parentModelData.getOwner().getRelationNameWithParent();
			relationPath.push(relationWithParent);
			relationPathRemoteIdMap[relationWithParent] = parentModelData.getRemoteId();
			
			return this._findRelationPath(parentModelData.getOwner().getParent(), relationPath);
		},
		
		_findTopMetadata: function(modelDataSet)
		{
			if (modelDataSet.getRelationNameWithParent())
			{
				return this._findTopMetadata(modelDataSet.getParent().getOwner());
			}
			else
			{
				return modelDataSet.getCurrentRecord().getMetadata();
			}
		},

		_findTopRemoteId: function(parentModelData)
		{
			if (!parentModelData.getOwner())
			{
				// reached the top
				return parentModelData.getRemoteId();				
			}
			
			if (parentModelData.getOwner().getParent() == null)
			{
				// reached the top
				return parentModelData.getRemoteId();
			}
						
			return this._findTopRemoteId(parentModelData.getOwner().getParent());
		},
		
		_localGetChildrenResourceData: function(parentModelData, complexAttributeNames){
			var self = this;			
			return self._ensurePersistenceManagerIsAvailable().
			then(function(){
				return PersistenceManager.findExact({'remoteid': parentModelData.getRemoteId()}, self._metadata);
			}).
			then(function(dataArray){
				if (dataArray.length > 0){
					var result = {};
					for(var index in complexAttributeNames){
						var attributeName = complexAttributeNames[index];
						result[attributeName] = dataArray[0].json[attributeName]; 
					}
					if(dataArray[0].json[PlatformConstants.TOO_LARGE_DATA]){
						result[PlatformConstants.TOO_LARGE_DATA] = dataArray[0].json[PlatformConstants.TOO_LARGE_DATA];
					}
					// Free up memory as soon as we are finished
					dataArray = null;
					return result;
				} else {
					// Free up memory as soon as we are finished
					dataArray = null;
					return {};
				}
			});
		}
	});
});
