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

define("platform/store/_ServerPreferredDataAccessStrategy",
["dojo/_base/declare",
 "dojo/Deferred", 
 "dojo/_base/array",
 "dojo/_base/lang",
 "dojo/promise/all",
 "platform/store/_LocalDataAccessStrategy",
 "platform/store/_ServerDataDownloadManager",
 "platform/exception/PlatformRuntimeException",
 "platform/store/_ResourceMetadataContext",
 "platform/util/PlatformConstants"], 
function(declare, Deferred, arrayUtil, lang, all, LocalDataAccessStrategy, ServerDataDownloadManager,
		PlatformRuntimeException, ResourceMetadataContext, PlatformConstants) {

	function addNextRemotePageInfoToResultSet(resultSet, nextPageURL, nextPageNum){
		if (nextPageURL){
			resultSet[PlatformConstants.NEXT_PAGE_URL] = nextPageURL;
			resultSet[PlatformConstants.NEXT_PAGE_NUM] = nextPageNum;
		}
	}
	
	return declare("", [LocalDataAccessStrategy, ServerDataDownloadManager], {
			
/**@memberOf platform.store._ServerPreferredDataAccessStrategy */
		getAllResourceData: function(queryBase, pageSize){
			var self = this;
			return this._serverGetAllResourceData(queryBase, pageSize).
			always(function(result){
				var failedToGetFromServer = (result && (result.errorMsg || typeof result === 'string' || result instanceof String));
				return self._localGetAllResourceDataFromStore(queryBase, pageSize).
					then(function(resultSet){
						if(!self._metadata.serverOnlyMode){
							var nextRemotePageNum = 2;
							addNextRemotePageInfoToResultSet(resultSet, (result && result[PlatformConstants.NEXT_PAGE_URL]), nextRemotePageNum);
						}
						if(result && result["isFirstTimeWorkListDownloadedFailure"]){
							result["dataSet"] = resultSet;
							throw result;
						}
						resultSet.fetchedFromServer = !failedToGetFromServer;
						return resultSet;
					});
			});
		},
		
		getAllResourceDataWithComplexAttributes: function(queryBase, complexAttributeList, pageSize){
			var self = this;
			return this._serverGetAllResourceDataWithComplexAttributes(queryBase, complexAttributeList, pageSize).
			always(function(result){
				var failedToGetFromServer = (result && (result.errorMsg || typeof result === 'string' || result instanceof String));
				return self._localGetAllResourceDataFromStore(queryBase, pageSize).
				then(function(resultSet){
					var nextRemotePageNum = 2;
					addNextRemotePageInfoToResultSet(resultSet, (result && result[PlatformConstants.NEXT_PAGE_URL]), nextRemotePageNum);
					resultSet.fetchedFromServer = !failedToGetFromServer;
					return resultSet;
				});
			});
		},
		
		_removeOSLCSearchWildcards: function(queryObject){
			//This function removes the leading and trailing % that can be added for wildcard searches on the server
			arrayUtil.forEach(Object.keys(queryObject), function(key){
				var filterValue = queryObject[key];
				if (lang.isString(filterValue) && filterValue.length > 0){
					filtervalue = filterValue.replace(/%/g,'');
					if(filterValue.length > 0){
						queryObject[key] = filterValue;
					}
					else{
						delete queryObject[key];  //Only % in there so remove it so JSONStore will return records. 
					}
				}
			});
		},

		queryResourceData: function(queryBase, query, pageSize, isExactMatch, oslcQueryParameters, justQuery){
			var self = this;
			return this._serverQueryResourceData(queryBase, query, pageSize, oslcQueryParameters, justQuery).
			always(function(result){
				var localFetchQuery = (result && result.remoteidsQuery || query);
				if(result.recordsCount == 0)
					localFetchQuery = query;
				var failedToGetFromServer = (result && (result.errorMsg || typeof result === 'string' || result instanceof String));
				//jsut query data from server without storing it
				if(justQuery){
					return result;
				}else{
					return self._localQueryResourceDataFromStore(queryBase, localFetchQuery, pageSize, null, isExactMatch).
					then(function(resultSet){
						var nextRemotePageNum = 2;
						addNextRemotePageInfoToResultSet(resultSet, (result && result[PlatformConstants.NEXT_PAGE_URL]), nextRemotePageNum);
						resultSet.fetchedFromServer = !failedToGetFromServer;
						if (queryBase == PlatformConstants.SEARCH_RESULT_QUERYBASE && resultSet.fetchedFromServer){
							//Just use the querybase because wildcards can be used in the search
							//Can do this because search querybase is typically removed from records prior to filtered call
							delete resultSet['_nextLocalPageInfo']['lastQuery'];  
						} else{
							if (localFetchQuery != query){
								if (query && resultSet.fetchedFromServer){
									if (lang.isArray(query)){
										arrayUtil.forEach(query,self._removeOSLCSearchWildcards);
									} 
									else if (lang.isObject(query)){
										self._removeOSLCSearchWildcards(query)	;							
									}
								}
								resultSet['_nextLocalPageInfo']['lastQuery'] = query;
							}
						}
					
					if(result.recordsCount)
						resultSet['recordsCount'] = result.recordsCount;
					
					return resultSet;
				});
			}});			
		},
		
		getResourceNextPageData: function(nextPageInfo){
			var serverResult = null;
			var localAlreadyLoaded = false;
			var promise = null;
			if (nextPageInfo.hasNextRemotePage()){
				promise = this._serverGetNextPageOfData(nextPageInfo);
			} else {
				localAlreadyLoaded = true;
				promise = this._localGetResourceNextPageDataFromStore(nextPageInfo, true);
			}
			var self = this;
			return promise.
			always(function(result){
				if (localAlreadyLoaded){
					return result;
				}
				serverResult = result;
				return self._localGetResourceNextPageDataFromStore(nextPageInfo, true);
			}).
			then(function(resultSet){
				var nextRemotePageNum = nextPageInfo[PlatformConstants.NEXT_PAGE_NUM] + 1;
				addNextRemotePageInfoToResultSet(resultSet, (serverResult && serverResult[PlatformConstants.NEXT_PAGE_URL]), nextRemotePageNum);
				return resultSet;
			});
		},
		
		getResourceById: function(resourceid){
			//TODO: Implement if needed. no use cases yet
		},
		
		justQueryResourceByRef: function(resourceRef){
			var self = this;
			return this._serverGetResourceByRef(resourceRef, true);
		},
		
		getResourceByRef: function(resourceRef){
			var self = this;
			return this._serverGetResourceByRef(resourceRef).
			always(function(){
				return self._localGetResourceByRef(resourceRef);
			});
		},
		
		getChildResourceData: function(parentModelData, complexAttributeName){
			var self = this;
			return this._serverGetChildResourceData(parentModelData, complexAttributeName).
			always(function(result){
				return self._localGetChildResourceData(parentModelData, complexAttributeName);
			});
		},
		getChildrenResourceData: function(parentModelData, complexAttributeNames){
			var self = this;
			return this._serverGetChildrenResourceData(parentModelData, complexAttributeNames).
			always(function(result){
				var failedToGetFromServer = (result && (result.errorMsg || typeof result === 'string' || result instanceof String));
				return self._localGetChildrenResourceData(parentModelData, complexAttributeNames).
				then(function(resultSet){
					resultSet.fetchedFromServer = !failedToGetFromServer;
					return resultSet;
				});
			});
		}	
	});	
});
