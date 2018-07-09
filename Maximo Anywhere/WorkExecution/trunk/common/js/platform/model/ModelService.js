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

define("platform/model/ModelService",
["exports",
 "dojo/_base/declare",
 "dojo/Deferred",
 "dojo/_base/lang",
 "dojo/_base/array", 
 "platform/exception/PlatformRuntimeException",
 "platform/model/ModelDataSet",
 "platform/store/_ResourceMetadataContext",
 "platform/store/_ServerDataDownloadManager",
 "platform/store/_ServerPreferredDataAccessStrategy",
 "platform/store/_LocalDataAccessStrategy",
 "platform/store/PersistenceManager",
 "dojo/promise/all",
 "platform/util/PlatformConstants",
 "platform/model/_SystemResourceCache",
 "platform/util/runOrRejectWithError",
 "platform/logging/Logger",
 "platform/model/CriteriaBuilder",
 "platform/store/_DataAccessStrategyProvider",
 "platform/store/_DataAccessStrategyProviderContext",
 "platform/model/PushingCoordinatorService",
 "platform/comm/CommunicationManager"
 ], 
function(thisModule, declare, Deferred, lang, arrayUtil, PlatformRuntimeException, ModelDataSet, ResourceMetadataContext, ServerDataDownloadManager, 
		ServerPreferredDataAccessStrategy, LocalDataAccessStrategy, PersistenceManager, all, PlatformConstants,
		SystemResourceCache, runOrRejectWithError, Logger, CriteriaBuilder, DataAccessStrategyProvider, DataAccessStrategyProviderContext,
		PushingCoordinatorService, CommunicationManager) {
	function findArgument(argsVar, dataType, defaultValue){
		for (var i = 1; i < argsVar.length; i++){// skip the 1st arg as it's always resourceName and it's required
			if (typeof argsVar[i] == dataType && argsVar[i] != null){
				return argsVar[i];
			}
		}
		return defaultValue;
	}
	
	function convertExactMatchAttributesInFilter(metadata, filter) {
		var filterAsArray = (lang.isArray(filter) && filter || [filter]);
		arrayUtil.forEach(filterAsArray, function(filterItem){
			arrayUtil.forEach(Object.keys(filterItem), function(filterItemAttribute) {
				var attributeMetadata = metadata.getField(filterItemAttribute);
				if (!attributeMetadata || !attributeMetadata.index){
					Logger.log('Attribute "' + filterItemAttribute + '" is not indexed in "' + 
							metadata.getResourceName() + '" JSONStore. The filtered may fail.', 1);
					
				} else if (attributeMetadata.isExactMatchIndex == 'true'){
					filterItem['exact' + filterItemAttribute] = '@--' + filterItem[filterItemAttribute] + '--@';
					delete filterItem[filterItemAttribute];
				}
			});
		});
		return filterAsArray;
	}
	
	
	lang.mixin(thisModule, {
//		Summary:
//			Represents a service to allow the application interact with persistent data.
//			
//		Description:
//			This class is the service that is used to interact with persistent data and abstracts
//			from the application all implementation details about the interaction with the persistence
//			layer. This class also has a consistent way to return information in a consistent way. All methods		
//			here exposed return promises.
//			
/**@memberOf platform.model.ModelService */
		all: function(resourceName, queryBase, pageSize, forceServerPreferred){
			if(typeof(forceServerPreferred) != "undefined" && !forceServerPreferred){
				return this.allCached(resourceName, queryBase, pageSize);
			} else {
				
				//used array.map instead of lang.clone as we just need a shallow copy	
				var args = arrayUtil.map(arguments, 'return item');
				return this.proceedWithSeverOnlyCheck(resourceName, queryBase, function(){
					var metadata = this._getResourceMetadataOrThrowError(resourceName);
					if (metadata.isSystem) {
						var cachedDataSet = SystemResourceCache.getCachedSystemResource(resourceName);
						return new Deferred().resolve(cachedDataSet);
					}
					if ((metadata.isInited == false) && (metadata.inMemory == false)) {
						var self = this;
						return PersistenceManager.initStore(metadata).
						then(function() {
							return self.all(resourceName, queryBase,
								pageSize, forceServerPreferred);
						});
					}
					queryBase = findArgument(args, "string", null);
					pageSize = findArgument(args, "number", metadata.pageSize);
					forceServerPreferred = findArgument(args, "boolean", false);
					if (queryBase == PlatformConstants.ERRORED_QUERYBASE) {
						return this._getErrored(resourceName, pageSize);
					}
					if (queryBase == PlatformConstants.CHANGED_QUERYBASE) {
						return this._getChanged(resourceName, pageSize);
					}
					if (queryBase == PlatformConstants.CREATED_QUERYBASE) {
						return this._getCreated(resourceName, pageSize);
					}
					if (queryBase == PlatformConstants.SEARCH_RESULT_QUERYBASE){
						return this._getSearchResult(resourceName, pageSize);
					}
	
					var dataAccessStrategy = this.getDataAccessStrategy(metadata);
					if (forceServerPreferred && !(dataAccessStrategy instanceof ServerPreferredDataAccessStrategy)) {
						dataAccessStrategy = new ServerPreferredDataAccessStrategy(metadata);
					}
					var promise = dataAccessStrategy.getAllResourceData(queryBase, pageSize);
					return this._getDeferredResultFromPromise(promise, metadata, queryBase);
				});			
			}
		},

		allCached: function(resourceName, queryBase, pageSize) {
			//used array.map instead of lang.clone as we just need a shallow copy	
			var args = arrayUtil.map(arguments, 'return item');
			return runOrRejectWithError(this, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				if (metadata.isSystem) {
					var cachedDataSet = SystemResourceCache.getCachedSystemResource(resourceName);
					return new Deferred().resolve(cachedDataSet);
				}
				if ((metadata.isInited == false) && (metadata.inMemory == false)) {
					var self = this;
					return PersistenceManager.initStore(metadata).
					then(function() {
						return self.allCached(resourceName, queryBase, pageSize);
					});
				}
				queryBase = findArgument(args, "string", null);
				pageSize = findArgument(args, "number", metadata.pageSize);
				forceServerPreferred = findArgument(args, "boolean", false);
				if (queryBase == PlatformConstants.ERRORED_QUERYBASE) {
					return this._getErrored(resourceName, pageSize);
				}
				if (queryBase == PlatformConstants.CHANGED_QUERYBASE) {
					return this._getChanged(resourceName, pageSize);
				}
				if (queryBase == PlatformConstants.CREATED_QUERYBASE) {
					return this._getCreated(resourceName, pageSize);
				}
				var dataAccessStrategy = new LocalDataAccessStrategy(metadata);

				var promise = dataAccessStrategy.getAllLocalResourceData(queryBase, pageSize);
				return this._getDeferredResultFromPromise(promise, metadata, queryBase);
			});						
		},
		
		allLocalOnly: function(resourceName, queryBase, pageSize){
			var metadata = this._getResourceMetadataOrThrowError(resourceName);
			if (metadata.isSystem) {
				var cachedDataSet = SystemResourceCache.getCachedSystemResource(resourceName);
				return new Deferred().resolve(cachedDataSet);
			}

			var dataAccessStrategy = DataAccessStrategyProvider.getDataAccessStrategy(metadata);
			var promise = dataAccessStrategy.getAllLocalResourceData(queryBase, pageSize);
			return this._getDeferredResultFromPromise(promise, metadata, queryBase);
		},

		allWithComplexAttributes: function(resourceName, queryBase, complexAttributeList, pageSize){
			return this.proceedWithSeverOnlyCheck(resourceName, queryBase, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				if (metadata.isSystem) {
					var cachedDataSet = SystemResourceCache.getCachedSystemResource(resourceName);
					return new Deferred().resolve(cachedDataSet);
				}
				if (metadata.local){
					return new Deferred().resolve(null);
				}

				var dataAccessStrategy = this.getDataAccessStrategy(metadata);
				var promise = dataAccessStrategy.getAllResourceDataWithComplexAttributes(queryBase, complexAttributeList, pageSize);
				return this._getDeferredResultFromPromise(promise, metadata, queryBase);

			});
		},

		empty: function(resourceName, queryBase, parentModelData, complexAttributeName){
			return runOrRejectWithError(this, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				var deferred = new Deferred();
				deferred.resolve([]);
				return this._getDeferredResultFromPromise(deferred.promise,	metadata, queryBase, parentModelData, complexAttributeName);
			});
		},
		
		/**
		 * fetchFromServer will decide where exactly operation needs to be perform, if connected and have all data on device perform device base operation else go to server , 
		 * if not connected perform local operation. 
		 * @param {string} resource Name.
		 * @param {string} queryBase.
		 */
		fetchFromServer: function (resourceName, queryBase, limitCheck)
		{
			var self = this;
			return CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
				if (hasConnectivity)
				{	
					if (queryBase != PlatformConstants.SEARCH_RESULT_QUERYBASE){
						var metaData = self._getResourceMetadataOrThrowError(resourceName);
						if (limitCheck){
							return !metaData.dataPastFetchLimit(queryBase);
						}
						var metrics = metaData.getResourceMetrics(queryBase);
						if (metrics && metrics.isAllDataDownloaded()){
							return metrics.waitForRefreshToComplete().always(function(){
								return !metrics.isAllDataDownloaded();
							});
						}
					}
				}
				return hasConnectivity;
			});
		},

		/**
		 * Search operation on server or local based on fetchFromServer return call 
		 * @param {string} resource Name.
		 * @param {string} queryBase.
		 * @param {string} filter 
		 */
		scan: function (resourceName, queryBase, filter, force_server_fetch) 
		{
			var self = this;
			var metadata = this._getResourceMetadataOrThrowError(resourceName);
			var metrics = metadata.getResourceMetrics(queryBase);
			if (metrics){
				metrics.initBeforeScan();
			}

			if (force_server_fetch){
				return this.filtered(resourceName, queryBase, filter, null, true, false);
			}
			else{
				var deferred = new Deferred();
				this.fetchFromServer(resourceName, queryBase).then(function(serverStrategry){
					self.filtered(resourceName, queryBase, filter, null, serverStrategry, false, null, !serverStrategry).then(function(resultSet){
						deferred.resolve(resultSet);
					}).otherwise(function(error){
						deferred.reject(error);
					});
				});
				return deferred.promise;
			}
		},
		/**
		 * Search operation on server or local based on fetchFromServer return call 
		 * @param {string} resource Name.
		 * @param {string} queryBase.
		 * @param {string} orderBy is a string like 'lastname asc, birthdate desc'; 
		 */
		sort: function (modelDataSet, orderBy) {
			var self = this;
			// if this set is a child set we must fetch records from parent's complex attribute
			var parentModelData = modelDataSet.getParent();
			var parentModelDataSet = modelDataSet;
			if(parentModelData) {
				parentModelDataSet = parentModelData.getOwner();
			}
			var resourceName = parentModelDataSet.getResourceName();
			var queryBase = parentModelDataSet._queryBaseName;
			return this.fetchFromServer(resourceName, queryBase).then(function(fromServer){
				var metaData = self._getResourceMetadataOrThrowError(modelDataSet.getResourceName());
				metaData.orderBy = orderBy;
				if(parentModelData) {
					//Do an in-memory sort correctly (support multiple sort parameters)
					var sortParams = orderBy.split(',');
					modelDataSet['sortParams'] = sortParams;
					modelDataSet.clearFilterAndSort();
					return modelDataSet.sort.apply(modelDataSet, sortParams); 
				}
				if (fromServer){
					var orderByPieces = orderBy.split(' ');
					var field = metaData.getField(orderByPieces[0]);
					if (field){
						//Checking to see if the field comes from the server.  If not switch to local fetch.
						//If the field is not found assuming the orderby is using oslc atributes
						fromServer = (field.remoteName != 'undefined' && field.remoteName != null); //If it's a local attribute with out a remotename fetch with orderby locally.
					}
				}
				if (modelDataSet.getPersistentFilter()){
					//The set was filtered, so need to use filter when fetching from the server or JSONStore.
					var fetchLocal = (!fromServer || modelDataSet._filteredFromStore);
					return self.filtered(resourceName, queryBase, modelDataSet.getPersistentFilter(), null, !fetchLocal, false, null, fetchLocal);
				}
				if(fromServer){
					return self.all(resourceName, queryBase);
				}
				return self.allCached(resourceName, queryBase);
			});
		},
		
		/**
			
			If online, this function will first remove the matching records (for the filter) from the JSONStore then query 
			back the records from the server.  If the fetch fails (for whatever reason) the original records are
			restored to the JSONStore and returned.  If offline this function just calls filtered.  This function is 
			not meant to be called on transactional resources.  It will remove changed or errored records.
			The main purpose is the cleanup/removal of records on the device that are no longer returned from the server.
		**/
		removeAndFilter: function(resourceName, filter, pageSize, isExactMatch){
			var self = this;
			return CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
				if(hasConnectivity){
					var overAllDeferred = new Deferred();
					var metadata = self._getResourceMetadataOrThrowError(resourceName);
					var savedLocal = null;
					var fetchFromServer = function(){
						var deferred = new Deferred();
						var restoreData = function(){
							if (savedLocal){
								//Never received records from the server so put the deleted records back so the user has them
								Logger.trace('[removeAndFilter] - unable to fetch data from server restoring original data from JSONStore');
								PersistenceManager.add(metadata, savedLocal).otherwise(function(error){
									Logger.errorJSON('[removeAndFilter] - Failed to restore data to JSONStore.  Error: ', error);
								}); 
								deferred.resolve(savedLocal);
							}
							else{
								deferred.resolve([]);
							}
						};
						var dataAccessStrategy = new ServerPreferredDataAccessStrategy(metadata);
						try{
							dataAccessStrategy.queryResourceData(null, filter, pageSize, isExactMatch).then(function(serverData){
								if (serverData && serverData.fetchedFromServer){
									deferred.resolve(serverData);
									return;
								}
								restoreData();
							}).otherwise(restoreData);
						}
						catch (error){
							restoreData();
						}
						self._getDeferredResultFromPromise(deferred.promise, metadata).then(function(modelDataSet) {
							modelDataSet._setPersistentFilter(filter);
							modelDataSet._filteredFromStore = !modelDataSet.fetchedFromServer;
							overAllDeferred.resolve(modelDataSet);
						});
					};
					
					filter = convertExactMatchAttributesInFilter(metadata, filter);
					if (!pageSize){
						pageSize = metadata.pageSize;
					}
					var findPromise;
					//Fetch records from JSONStore
					if (isExactMatch){
						findPromise = PersistenceManager.findExact(filter, metadata, null, pageSize);
					} else {
						findPromise = PersistenceManager.find(filter, metadata, null, pageSize);
					}
					findPromise.always(function(localRecords){
						if(lang.isArray(localRecords) && localRecords.length > 0 && (localRecords[0]._id || localRecords[0]._id === 0)){
							savedLocal = localRecords;
							//Remove records from JSONStore because the call to queryResourceData will return merged records from JSONStore and because it's a filtered list
							//it keeps records in JSONStore that are not returned from the server query
							PersistenceManager.remove(metadata,localRecords,isExactMatch).then(function(count){
								if (count == 0){
									savedLocal = null;
								}
								fetchFromServer();
							}).otherwise(function(){
								savedLocal = null;
								fetchFromServer();
							});
						}
						else{
							fetchFromServer();
						}
					});
					return overAllDeferred.promise;
				}
				else{
					return self.filtered(resourceName, null, filter, pageSize, false, isExactMatch, null, true);
				}
			});
		},
		
		filtered: function(resourceName, queryBase, filter, pageSize, forceServerPreferred, isExactMatch, oslcQueryParameters, forceLocalPreferred,justQuery){
			
			//used array.map instead of lang.clone as we just need a shallow copy	
			var args = arrayUtil.map(arguments, 'return item');
			return this.proceedWithSeverOnlyCheck(resourceName, queryBase, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				if (metadata){
					var metrics = metadata.getResourceMetrics(queryBase);
					if(!metrics || metrics.getScanFilter() != filter){
						metadata.clearActiveQueryBaseForResource();
					}
				}
				queryBase = findArgument(args, "string", null);
				filter = findArgument(args, "object", null);
				pageSize = findArgument(args, "number", metadata.pageSize);
				forceServerPreferred = findArgument(args, "boolean", false);
				if (!filter) {
					throw new PlatformRuntimeException('invalidFilterParam');
				}
				
				filter = convertExactMatchAttributesInFilter(metadata, filter);
				
				if (queryBase == PlatformConstants.ERRORED_QUERYBASE) {
					return this._getErrored(resourceName, pageSize, filter);
				}
				if (queryBase == PlatformConstants.CHANGED_QUERYBASE) {
					return this._getChanged(resourceName, pageSize, filter);
				}
				if (queryBase == PlatformConstants.CREATED_QUERYBASE) {
					return this._getCreated(resourceName, pageSize, filter);
				}
				
				var dataAccessStrategy;
				if (forceServerPreferred) {
					dataAccessStrategy = new ServerPreferredDataAccessStrategy(metadata);
				}
				else if (forceLocalPreferred){
					dataAccessStrategy = new LocalDataAccessStrategy(metadata);
				}
				else{
					dataAccessStrategy = this.getDataAccessStrategy(metadata);
				}
				var promise = dataAccessStrategy.queryResourceData(queryBase, filter, pageSize, isExactMatch, oslcQueryParameters,justQuery);
				return this._getDeferredResultFromPromise(promise, metadata, queryBase).then(function(modelDataSet) {
					modelDataSet._setPersistentFilter(filter);
					modelDataSet._filteredFromStore = forceLocalPreferred;
					return modelDataSet;
				});
			});
		},
		countCached: function(resourceName, queryBase, filter, isExactMatch){
			return runOrRejectWithError(this, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				if (filter){
					filter = convertExactMatchAttributesInFilter(metadata, filter);
				}				
				return PersistenceManager.count(metadata, queryBase, filter, isExactMatch);
			});
		},

		proceedWithSeverOnlyCheck: function(resourceName, queryBase, serviceFunction){
			var metadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			if (metadata && metadata.serverOnlyMode && queryBase != PlatformConstants.ERRORED_QUERYBASE && queryBase != PlatformConstants.CREATED_QUERYBASE){
				var self = this;
				var deferred = new Deferred();
				PushingCoordinatorService.ensureFlushComplete().then(function(){
					CommunicationManager.checkConnectivityAvailable().then(function(connected) {
						if(connected) {
							self.countErrored(resourceName).then(function(count){
								if(count == 0){
									runOrRejectWithError(self, serviceFunction).then(function(dataSet){
										deferred.resolve(dataSet);
									}).otherwise(function(error){
										deferred.reject(error);
									});
								}
								else{
									deferred.reject();
								}
							}).otherwise(function(error){
								deferred.reject(error);
							});
						}
						else{
							runOrRejectWithError(self, serviceFunction).then(function(dataSet){
								deferred.resolve(dataSet);
							}).otherwise(function(error){
								deferred.reject(error);
							});
						}
					});
				}).otherwise(function(error){
					deferred.reject(error);					
				});
				return deferred.promise;
			}
			else{
				return runOrRejectWithError(this, serviceFunction);
			}
		},
		
		countErrored: function(resourceName) {
			return runOrRejectWithError(this, function(){
				//Memory optimization to return only the id instead of whole record.
				/*return this._getErrored(resourceName,null, null, "_id").then(function(dataSet) {
					return dataSet.count();
				});*/
			
				var deferred = new Deferred();	
				var filter = {};
				var errorFilter = {};
				errorFilter[PlatformConstants.ERRORED_ATTRIBUTE] = 1;
				if (lang.isArray(filter)){
					arrayUtil.forEach(filter, function(filterItem){
						lang.mixin(filterItem, errorFilter);
					});
				} else {
					lang.mixin(filter, errorFilter);
				}
				
	
				var returnAttr = "_id";
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				var dataAccessStrategy = new LocalDataAccessStrategy(metadata);
				var promise = dataAccessStrategy.queryResourceData(null, filter, null, null, returnAttr);
				
				promise.then(function(result){
					var count = 0;
					if(result)
						count = result.length;
					deferred.resolve(count);	
					
				}).otherwise(function(err){
					
					deferred.reject(0);
				});
				
				return deferred.promise;
			
			});
		},
		byRef: function(resourceName, resourceRef, justQuery){	
			return runOrRejectWithError(this, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				var dataAccessStrategy = this.getDataAccessStrategy(metadata);
				if ((!lang.isObject(resourceRef) || !('remoteid' in resourceRef))
						&& !lang.isString(resourceRef)) {
					throw new PlatformRuntimeException('invalidRef',
							[ resourceRef ]);
				}
				var promise = null;
				if(justQuery){
					promise = dataAccessStrategy.justQueryResourceByRef(resourceRef, true);
				}else{
					promise = dataAccessStrategy.getResourceByRef(resourceRef);
				}
				return this._getDeferredResultFromPromise(promise, metadata);
			});
		},		
		childrenOf: function(/*ModelData*/ parentModelData, complexAttributeName){			
			return runOrRejectWithError(this, function(){
				var metadata = parentModelData.getMetadata();
				var childMetadata = this._getChildResourceMetadata(metadata,
						complexAttributeName);
				//Take the parent dataAccessStrategy as children records are "nested" records of the parent
				var topMetadata = this._findTopMetadata(parentModelData.getOwner());
				
				// NOTE: whatever attributes we are fetching using this data access strategy, 
				// those attributes must be part of the second argument passed.
				// For the one level down, where workorder is getting its worklog,
				// the two arguments passsed are going to be the same references.
				// For all the other levels down, they are going to be different.
				var dataAccessStrategy = DataAccessStrategyProvider.getDataAccessStrategyForDependents(topMetadata, metadata);
				
				var promise = dataAccessStrategy.getChildResourceData(
						parentModelData, complexAttributeName);
				return this._getDeferredResultFromPromise(promise,
						childMetadata, null, parentModelData,
						complexAttributeName);
			});
		},
		_findTopMetadata: function(/*ModelDataSet*/ modelDataSet)
		{
			if (modelDataSet.getRelationNameWithParent())
			{
				return this._findTopMetadata(modelDataSet.getParent().getOwner());
			}
			else
			{
				return modelDataSet.getMetadata();
			}
			
		},
		multipleChildrenOf: function(/*ModelData*/ parentModelData, complexAttributeNames){			
			return runOrRejectWithError(this, function(){
				var metadata = parentModelData.getMetadata();				
				//Take the parent dataAccessStrategy as children records are "nested" records of the parent
				var topMetadata = this._findTopMetadata(parentModelData.getOwner());
				var dataAccessStrategy = DataAccessStrategyProvider.getDataAccessStrategyForDependents(topMetadata, metadata);
				
				var promise = dataAccessStrategy.getChildrenResourceData(parentModelData, complexAttributeNames);
				return this._getDeferredMultipleResultFromPromise(promise, metadata, parentModelData, complexAttributeNames);
			});
		},
		
	    save: function(/*ModelDataSet*/ dataSet){
	    	var EsigHandler = this.application["platform.handlers.EsigHandler"];
	    	
	    	if (EsigHandler.isEsigRequired(this, dataSet, null)) {
	    		var deferred = new Deferred();
				// show esig
	    		EsigHandler.showEsig(this.application, this._AfterEsig, [this,deferred,dataSet]);
	    		return deferred.promise;
			}
			else{
				return this.saveAfterEsig(dataSet);
			}
	    },
	    
	    _AfterEsig: function(self, deferred, dataSet){
	    	
	    	var savePromise = self.saveAfterEsig(dataSet);
	    	savePromise.then(
	    			function(sucess){
	    				deferred.resolve(sucess);
	    	}).otherwise(function(error){
	    		deferred.reject(error);
	    	});
	    	
	    },
	    
	    
		saveAfterEsig: function(/*ModelDataSet*/ dataSet){
			return runOrRejectWithError(this, function(){
				if (!dataSet || !(dataSet instanceof ModelDataSet)) {
					throw new PlatformRuntimeException('invalidDataSet',
							[ dataSet ]);
				}			
				var deferred = new Deferred();			
				if(dataSet.getParent() != null || !dataSet.isDirty() || dataSet._getSaveStage() > 0){
					if (dataSet._getSaveStage() > 0){
						dataSet['_savePostponed'] = true;
			    		Logger.trace('[saveAfterEsig] delaying save since a save is in progress for ' + dataSet.getResourceName());
					}
					deferred.resolve(dataSet);
				}
				else{
					var self = this;
					dataSet._incrementSaveStage();
					dataSet._asyncBeforeSave().then(function(validatedDataSet){
						if (validatedDataSet.getMetadata().inMemory){
							dataSet._resetSaveStage();
							deferred.resolve(dataSet);					
						}else{
							validatedDataSet._asyncSave().then(function(savedSet){
								dataSet._resetSaveStage();
								if (dataSet['_savePostponed']){
						    		//Another save was attempted and prevented while this current save was happening.  
									//Now that save has completed, save the ModelDataSet again
									Logger.trace('[saveAfterEsig] calling postponed save for ' + dataSet.getResourceName());
									delete dataSet['_savePostponed'];
									self.save(dataSet).then(function(returnedDataSet){
										deferred.resolve(returnedDataSet);
									}).otherwise(function(error){
										deferred.reject(error);
									});
								}
								else{
									deferred.resolve(savedSet);
								}
							}).otherwise(function(error){
								dataSet._resetSaveStage();
								deferred.reject(error);
							});	
						}
					}).otherwise(function(error){
						dataSet._resetSaveStage();
						deferred.reject(error);
					});	
				}
				return deferred.promise;
			});
		},
		saveAll: function(/*ModelDataSet[]*/ dataSetArray){
			return runOrRejectWithError(this, function(){
				// simulates a transaction - validates first all datasets before actually send to the db.
				var self = this;
				var saveDeferred = new Deferred();
				var promises = arrayUtil.map(dataSetArray, function(dataSet){				
					if(dataSet.getParent() != null || !dataSet.isDirty() || dataSet._getSaveStage() > 0){
						var deferred = new Deferred();
						deferred.resolve(dataSet);
						return deferred.promise;
					}
					dataSet._incrementSaveStage();
					return dataSet._asyncBeforeSave();
				}, self);			
				all(promises).then(function(validatedSets){
					var savedSetPromises = arrayUtil.map(validatedSets, function(aValidSet){
						if(aValidSet.getMetadata().inMemory || 
								!aValidSet.isDirty() || 
								aValidSet.getParent() != null || aValidSet._getSaveStage() > 1){
							var deferred = new Deferred();
							deferred.resolve(aValidSet);
							return deferred.promise;
						}
						aValidSet._incrementSaveStage();
						return aValidSet._asyncSave();
					}, self);					
					all(savedSetPromises).then(function(savedSets){
						arrayUtil.map(dataSetArray, function(dataSet){
							dataSet._resetSaveStage();
						});					
						saveDeferred.resolve(savedSets);
					}).otherwise(function(error){
						arrayUtil.map(dataSetArray, function(dataSet){
							dataSet._resetSaveStage();
						});
						saveDeferred.reject(error);
					});
				}).otherwise(function(error){
					arrayUtil.map(dataSetArray, function(dataSet){
						dataSet._resetSaveStage();
					});
					saveDeferred.reject(error);
				});
				return saveDeferred.promise;
			});
		},		
		
		getDataAccessStrategy: function(metadata)
		{
			return DataAccessStrategyProviderContext.getDataAccessStrategyProvider().getDataAccessStrategy(metadata);
		},

		loadNextPage: function(/*ModelDataSet*/ dataSet, forceLocal){
			return runOrRejectWithError(this, function(){
				var metadata = dataSet.getMetadata();
				var dataAccessStrategy;
				var queryBase = dataSet.getQueryBase();
				var nextPageInfo = dataSet._getNextPageInfo();
				if (queryBase == PlatformConstants.ERRORED_QUERYBASE
						|| queryBase == PlatformConstants.CHANGED_QUERYBASE) {
					//do not query for a queryBase if it's a system queryBase
					nextPageInfo.queryBase = null;
					dataAccessStrategy = new LocalDataAccessStrategy(metadata);
				}
				else 	if (forceLocal){
					dataAccessStrategy = new  LocalDataAccessStrategy(metadata);
				}
				else{
					dataAccessStrategy = this.getDataAccessStrategy(metadata);
				}

				return dataAccessStrategy.getResourceNextPageData(nextPageInfo)
						.then(function(result) {
							if (result && (forceLocal || (nextPageInfo.nextPageURL && result.length > 0 ))) {
								if (forceLocal || !result.nextPageURL){
									//Check to see if the metrics has the next page info if at the last loaded page in the JSONStore
									//If so use that since we are out of local data to fetch.
									var metrics = metadata.getResourceMetrics(queryBase);
									if (metrics && !metrics.isAllDataDownloaded() && metrics.getNextPageUrl()){
										var offset = result._nextLocalPageInfo?  result._nextLocalPageInfo.offset : -1;
										if(offset == -1 || (offset >= (metrics.getPagesLoaded() * metrics.getPageSize()))){
											result['nextPageURL'] = metrics.getNextPageUrl();
											result[PlatformConstants.NEXT_PAGE_NUM] = metrics.getPagesLoaded() + 1;
										}
									}
								}
								dataSet._appendData(result);
								return true;
							} else {
								return false;
							}
						});
			});
		},
		
		additionalDataFiltered: function(resourceName, filter, isExactMatch, pageSize){	
			var args = arrayUtil.map(arguments, 'return item');
			return runOrRejectWithError(this, function(){
				var metadata = this._getResourceMetadataOrThrowError(resourceName);
				filter = findArgument(args, "object", null);
				pageSize = findArgument(args, "number", metadata.pageSize);
				if (!filter) {
					throw new PlatformRuntimeException('invalidFilterParam');
				}				
				
				filter = convertExactMatchAttributesInFilter(metadata, filter);
				
				var dataAccessStrategy = new LocalDataAccessStrategy(metadata);
				var promise = dataAccessStrategy.queryResourceData(null, filter, pageSize, isExactMatch);
				return this._getDeferredResultFromPromise(promise, metadata, null).then(function(modelDataSet) {
					modelDataSet._setPersistentFilter(filter);
					return modelDataSet;
				});
			});
		},
		firstMatchOfAdditionalDataFilteredOrNull: function(resourceName, filter, isExactMatch){
			return runOrRejectWithError(this, function(){
				return this.additionalDataFiltered(resourceName, filter, isExactMatch, 1).then(function(modelDataSet){
					return modelDataSet.count() == 0 ? null : modelDataSet.getRecordAt(0); 
				});
			});
		},
		getSystemProperties: function(){
			return runOrRejectWithError(this, function(){
				return PersistenceManager.getSystemProperties();
			});
		},	
		
		clearSearchResult: function(modelDataSet) {
			//TODO: This 500 is a little bit of a hack, but I don't have code that can page through all the local json store data page by page to clear the search results querybase
			var previousSearchResultsPromise = this._getLocalFilteredRecords(modelDataSet.getResourceName(), 500, null, PlatformConstants.SEARCH_RESULT_QUERYBASE);
			var deferred = new Deferred();
			var self = this;
			previousSearchResultsPromise.then(function(previousSearchResults) {
				previousSearchResults.foreach(function(searchResult) {
					searchResult.removeFromQueryBase(PlatformConstants.SEARCH_RESULT_QUERYBASE);
				});
				self.save(previousSearchResults).then(function() {
					deferred.resolve();
				}).otherwise(function() {
					deferred.reject();
				});
			}).otherwise(function() {
				//If I can't get the local filtered records, just continue
				deferred.resolve();
			});
			return deferred.promise;
		},
		
		reloadAllPages: function(resourceName, queryBase){
	    	var metaData = this._getResourceMetadataOrThrowError(resourceName);
			var metrics = metaData.getResourceMetrics(queryBase);
			if (!metrics){
				return this.ModelService.all(resourceName, queryBase); //Need metrics to download more than one page
			}
			var deferred = new Deferred();
			var self = this;
			CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
				if (hasConnectivity)
				{	
					var dataAccessStrategy = new ServerPreferredDataAccessStrategy(metaData);
					dataAccessStrategy._reloadAllPages(queryBase, metaData.getPageSize()).then(function(){
						var localAccessStrategy = new LocalDataAccessStrategy(metaData);
						var promise = localAccessStrategy.getAllResourceData(queryBase, metaData.getPageSize());
						self._getDeferredResultFromPromise(promise, metaData, queryBase).then(function(resultSet){
			    			deferred.resolve(resultSet);
						});
					}, function(error){
						deferred.reject(error);
					}, function(progress){
						deferred.progress(progress);
					});
				}
				else{
					deferred.resolve();
				}
			});
			return deferred.promise;
		},
		
		_refreshRemaningPagesInStore: function(nextPageInfo, metaData, reloadTracker){
			var self = this;
			if(nextPageInfo && reloadTracker.isActive()){ 
				var dataAccessStrategy = new ServerPreferredDataAccessStrategy(metaData);
				dataAccessStrategy._getNextPageDataFromServerIfPossibleAndStore(nextPageInfo).then(function(json){
					if (json && json.nextPageURL){
						nextNextPageInfo = {
								nextPageURL: json.nextPageURL,
								nextRemotePageNum: json.nextRemotePageNum,
								queryBase: nextPageInfo.queryBase,
								hasNextRemotePage: function(){
									return true;
								}
						};
						self._refreshRemaningPagesInStore(nextNextPageInfo, metaData, reloadTracker);
					}
					else{
						reloadTracker.reloadFinished();
					}
				}).otherwise(function(error){
					reloadTracker.reloadFinished(false);
				});
			}
			else{
				reloadTracker.reloadFinished();
			}
		},
			
		allLoadedWithLimitCheck: function(resourceName, queryBase){
			var self = this;
			var metaData = self._getResourceMetadataOrThrowError(resourceName);
			var metrics = metaData.getResourceMetrics(queryBase);
			if (metrics){
				return this.fetchFromServer(resourceName, queryBase, true).then(function(fromServer){
					if (fromServer){
						var deferred = new Deferred();
						var reloadTracker = metrics.startRefresh(true);
			    		if (metrics.getScanFilter()){
		    				firstPagePromise = self.filtered(resourceName, queryBase, metrics.getScanFilter());
		    			}
			    		else{
			    			firstPagePromise = self.all(resourceName, queryBase);
			    		}
			    		firstPagePromise.then(function(dataSet){
			    			if (dataSet && dataSet.fetchedFromServer){
								deferred.resolve(dataSet);
								
								if (reloadTracker){
									self._refreshRemaningPagesInStore(dataSet._getNextPageInfo(), metaData, reloadTracker);
								}
			    			}
			    			else{
								if (reloadTracker){
									reloadTracker.reloadFinished(false);
								}
		    					deferred.resolve(dataSet);
			    			}
						}).otherwise(function(error){
							deferred.reject(error);
							if (reloadTracker){
								reloadTracker.reloadFinished(false);
							}
						});
						return deferred.promise;
					}
					else{
						return self.allCached(resourceName, queryBase);
					}
				});
			}
			return this.all(resourceName, queryBase);
		},

	    refreshDataForWorkListIfPossible: function(resourceName, queryBase, waitForPage, flushTransactions, allowLocalFetch){
	    	var self = this;
			if (flushTransactions){
				return PushingCoordinatorService.ensureFlushComplete().always(function(){
					return self.refreshDataForWorkListIfPossible(resourceName, queryBase, waitForPage, false, allowLocalFetch);
				});
			}
			return this.fetchFromServer(resourceName, queryBase, true).then(function(fromServer){
	    		var deferred = new Deferred();
				if (fromServer){
					var metaData = self._getResourceMetadataOrThrowError(resourceName);
					var metrics = metaData.getResourceMetrics(queryBase);
					if(!metrics){
						return self.all(resourceName, queryBase);
					}
					var reloadTracker = metrics.startRefresh();
					if (!reloadTracker){
						return null;
					}
		    		var firstPagePromise;
		    		if(!waitForPage || waitForPage < 1){
		    			waitForPage = metrics.getPagesLoaded(); //Default wait for all
		    		}
		    		if (metrics.getScanFilter()){
	    				firstPagePromise = self.filtered(resourceName, queryBase, metrics.getScanFilter());
	    			}
		    		else{
		    			firstPagePromise = self.all(resourceName, queryBase);
		    		}
		    		firstPagePromise.then(function(dataSet){
		    			if (dataSet && dataSet.fetchedFromServer){
			    			var loadRemainingPages = function(){
			    				var nextPageInfo = dataSet._getNextPageInfo();
			    				if(reloadTracker.getPagesLoaded() == waitForPage){
			    					deferred.resolve(dataSet);
			    					self._refreshRemaningPagesInStore(nextPageInfo, metaData, reloadTracker);
			    				}
			    				else if(nextPageInfo && reloadTracker.isActive()){
									self.loadNextPage(dataSet).then(function(dataLoaded){
										if(dataLoaded){
											loadRemainingPages();
										}
										else{
											reloadTracker.reloadFinished(false);
					    					deferred.resolve();
										}
									}).otherwise(function(error){
										reloadTracker.reloadFinished(false);
				    					deferred.reject(error);
									});
			    				}
			    				else{
									if (reloadTracker){
										reloadTracker.reloadFinished(false);
									}
			    					deferred.resolve(dataSet);
			    				}
			    			};

			    			loadRemainingPages();		    		
		    			}
		    			else{
							reloadTracker.reloadFinished(false);
	    					deferred.resolve();
		    			}

    				}).otherwise(function(error){
						reloadTracker.reloadFinished(false);
    					deferred.reject(error);
					});
		    	}
				else if (allowLocalFetch){
					return self.allCached(resourceName, queryBase);
				}
				else{
					deferred.resolve();
				}
				return deferred.promise;
			});
	    },

		_getErrored: function(resourceName, pageSize, filter){
			filter = (filter || {});
			var errorFilter = {};
			errorFilter[PlatformConstants.ERRORED_ATTRIBUTE] = 1;
			if (lang.isArray(filter)){
				arrayUtil.forEach(filter, function(filterItem){
					lang.mixin(filterItem, errorFilter);
				});
			} else {
				lang.mixin(filter, errorFilter);
			}
			
			return this._getLocalFilteredRecords(resourceName, pageSize, filter, PlatformConstants.ERRORED_QUERYBASE);
		},		
		_getCreated: function(resourceName, pageSize, filter){
			var metadata = this._getResourceMetadataOrThrowError(resourceName);
			var serverDataAccessStrategy = new ServerPreferredDataAccessStrategy(metadata);
			var self = this;
			return serverDataAccessStrategy._updateCreatedLocally().always(function(){
				var dataAccessStrategy = new LocalDataAccessStrategy(metadata);
				var promise = null;
				if (filter) {
					promise = dataAccessStrategy.queryResourceData(PlatformConstants.CREATED_QUERYBASE, filter, pageSize);
				} else {
					promise = dataAccessStrategy.getAllResourceData(PlatformConstants.CREATED_QUERYBASE, pageSize);
				}
				return self._getDeferredResultFromPromise(promise, metadata, PlatformConstants.CREATED_QUERYBASE);
			});
		},		

		_getSearchResult: function(resourceName, pageSize){
			var metadata = this._getResourceMetadataOrThrowError(resourceName);
			var dataAccessStrategy = new LocalDataAccessStrategy(metadata);
			var promise = dataAccessStrategy.getAllResourceData(PlatformConstants.SEARCH_RESULT_QUERYBASE, pageSize);
			return this._getDeferredResultFromPromise(promise, metadata, PlatformConstants.SEARCH_RESULT_QUERYBASE);
		},
		
		_getChanged: function(resourceName, pageSize, filter){
			filter = (filter || {});
			var changeFilter = {};
			changeFilter[PlatformConstants.ISCHANGED_ATTRIBUTE] = true;
			if (lang.isArray(filter)){
				arrayUtil.forEach(filter, function(filterItem){
					lang.mixin(filterItem, changeFilter);
				});
			} else {
				lang.mixin(filter, changeFilter);
			}
			
			return this._getLocalFilteredRecords(resourceName, pageSize, filter, PlatformConstants.CHANGED_QUERYBASE);
		},
		
		_getLocalFilteredRecords: function(resourceName, pageSize, filter, queryBase) {
			var metadata = this._getResourceMetadataOrThrowError(resourceName);
			var dataAccessStrategy = new LocalDataAccessStrategy(metadata);
			// Errored or changed records can be in any queryBase so just use filter
			var fetchQueryBase = ((queryBase == PlatformConstants.ERRORED_QUERYBASE || queryBase == PlatformConstants.CHANGED_QUERYBASE) ? null : queryBase); 
			var promise = dataAccessStrategy.queryResourceData(fetchQueryBase, filter, pageSize);
			return this._getDeferredResultFromPromise(promise, metadata, queryBase);
		},
		
		_getChildResourceMetadata: function(metadata, complexAttributeName){
			var complexAttributeMetadata = null;
			arrayUtil.some(metadata.fields, function(field){
				if (field.name == complexAttributeName){
					complexAttributeMetadata = field;
					return true;
				}
				return false;
			});
			return this._getResourceMetadataOrThrowError(complexAttributeMetadata['referenceResource']);
		},
		_getResourceMetadataOrThrowError: function(resourceName){
			if (!resourceName){
				throw new PlatformRuntimeException('invalidModelName', [resourceName]);
			}
			var metadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			if(!metadata){
				throw new PlatformRuntimeException('invalidResourceName', [resourceName]);
			}
			return metadata;
		},
		

		// for teste proposes
		_getNewModelDataSet: function(metadata, queryBase, json, parentModelData, complexAttributeName){
			return new ModelDataSet(metadata, queryBase, json, parentModelData, complexAttributeName);
		},
		
		_getDeferredResultFromPromise: function(promise, metadata, queryBase, parentModelData, complexAttributeName){
			var self = this;
			var deferred = new Deferred();
			promise.then(function(json){
				var result = self._getNewModelDataSet(metadata, queryBase, json, parentModelData, complexAttributeName);
				if (parentModelData && complexAttributeName){
					parentModelData[complexAttributeName] = result;
					if (json && json[PlatformConstants.TOO_LARGE_DATA]){
						parentModelData[PlatformConstants.TOO_LARGE_DATA] = json[PlatformConstants.TOO_LARGE_DATA];
					} 
				}
				var metrics = metadata.getResourceMetrics(queryBase);
				if (metrics){
					metrics.queryBaseDataInMemory();
				}
				
				if(json && json.recordsCount)
					result['recordsCount'] = json.recordsCount;

				deferred.resolve(result);
			}).otherwise(function(err){
				var result = new ModelDataSet(metadata, queryBase, (err.dataSet || []), parentModelData, complexAttributeName);
				if (parentModelData && complexAttributeName){
					parentModelData[complexAttributeName] = result;
				}
				err.dataSet = result;
				deferred.reject(err);
			});
						
			return deferred.promise;
		},
		_getDeferredMultipleResultFromPromise: function(promise, metadata, parentModelData, complexAttributeNames){
			var deferred = new Deferred();
			var self = this;
			promise.then(function(json){
				var fetchedFromServer = json.fetchedFromServer === true;
				arrayUtil.forEach(complexAttributeNames, function(complexAttributeName){
					var childMetadata = self._getChildResourceMetadata(metadata, complexAttributeName); 
					if (parentModelData && complexAttributeName){
						if (fetchedFromServer && json[complexAttributeName]){
							json[complexAttributeName].fetchedFromServer = true;
						}
						parentModelData[complexAttributeName] = new ModelDataSet(childMetadata, null, json[complexAttributeName], parentModelData, complexAttributeName);
					}					
				});
				if (json[PlatformConstants.TOO_LARGE_DATA]){
					parentModelData[PlatformConstants.TOO_LARGE_DATA] = json[PlatformConstants.TOO_LARGE_DATA];
				} 
				deferred.resolve();
			}).otherwise(function(err){
				deferred.reject(err);
			});						
			return deferred.promise;
		},
		_downloadAllRecordsFromResource: function(cancelIndicator, metadata, queryBase, progressCallback, applyStablePagination){
			var downloadManager = new ServerDataDownloadManager(metadata);
			return downloadManager.downloadAllPagesOfResourceData(cancelIndicator, queryBase, progressCallback, applyStablePagination);
		},
		
		downloadRemainingRecordsFromResource: function(cancelIndicator, metadata, queryBase, progressCallback){
			var downloadManager = new ServerDataDownloadManager(metadata);
			return downloadManager.downloadRemainingPagesOfResourceData(cancelIndicator, queryBase, progressCallback);
		},
		
		newCriteriaBuilderFor: function(resourceName){
			return new CriteriaBuilder({
				"metadata" : this._getResourceMetadataOrThrowError(resourceName)
			});
		},
		// needed due to cyclic dependency
		_setModelDataSetClass: function(clazz){
			ModelDataSet = clazz;
		},
	});
});
