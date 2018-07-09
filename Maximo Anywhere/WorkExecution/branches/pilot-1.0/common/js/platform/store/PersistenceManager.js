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

define("platform/store/PersistenceManager",
[ "exports",
 "dojo/Deferred",
 "dojo/promise/all", 
 "dojo/_base/lang", 
 "dojo/_base/array", 
 "dojo/_base/declare", 
 "dojox/json/query",
 "platform/exception/PlatformRuntimeException",
 "platform/store/_StoreProvider",
 "platform/comm/CommunicationManager",
 "platform/store/_ResourceMetadataContext",
 "platform/store/ResourceMetadata",
 "platform/store/_JsonTranslationMixin",
 "platform/store/_JsonInMemoryFindMixin",
 "platform/store/_QueryBaseSaveMixin",
 "platform/store/_QueryBaseFilterMixin",
 "platform/store/_JsonInMemorySortMixin",
 "platform/store/SystemProperties",
 "platform/util/CallbackCreator",
 "platform/translation/MessageService",
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "dojo/topic",
 "platform/util/runOrRejectWithError",
 "platform/store/_DataCleanupService",
 "platform/store/_StoreProviderSecurity",
 "dojox/encoding/digests/SHA1",
 "platform/auth/UserAuthenticationManager"], 
function(thisModule, Deferred, all, lang, arrayUtil, declare, jsonQuery, PlatformRuntimeException, StoreProvider, CommunicationManager, 
		ResourceMetadataContext, ResourceMetadata, JsonTranslationMixin, JsonInMemoryFindMixin, QueryBaseSaveMixin, 
		QueryBaseFilterMixin, JsonInMemorySortMixin, SystemProperties, CallbackCreator, MessageService,
		PlatformConstants, Logger, topic, runOrRejectWithError, DataCleanupService, storeProviderSecurity, SHA1, UserAuthenticationManager) {
	
	//Some shortcuts to make code cleaner
	var mixin = lang.mixin;
	var hitch = lang.hitch;
	
	var CustomDeferred = declare([Deferred], {

		onSuccess: function() {
			this.resolve.apply(this, arguments);
		}, 
		onFailure: function() {
			this.reject.apply(this, arguments);
		}
	});

	var USER_PROFILE_STORE = 'userProfileStore';
	var SYSTEM_PROPERTIES_STORE = 'systemPropertiesStore';
	var collectionsToInitialize = [];
	
	var systemPropertiesDataSet = null;
	var TRANSACTION_QUEUE = "transactionQueue";
	var transactionQueueStructure = {"resourceName": "string", "storeId": "string"};
	var STAGING_TRANSACTION_QUEUE = "stagingTransactionQueue";
	var stagingTransactionStructure = {"resourceName": "string", "storeId": "string"};

	var classBody = {
		//For testing purposes only
		_clearCache: function(){
			ResourceMetadataContext._clearCache();
			collectionsToInitialize = [];
		},
		/**@memberOf platform.store.PersistenceManager */
		closeAllStores: function(){
			var keepInMemoryResources = true;
			ResourceMetadataContext._clearCache(keepInMemoryResources);
			return this._asDojoPromise(StoreProvider.closeAll());
		},
		
		initUserProfileStore: function(credentials){
			var deferred = new Deferred();
			deferred.resolve();
			return deferred.promise;
		},

		_initUserProfileStore: function(credentials, force) {
			var hexOutputFormat = 1;
			var username = SHA1(credentials['username'] || "-no-user-", hexOutputFormat);
			var password = SHA1(credentials['password'] || "-no-pass-", hexOutputFormat);
			// just a value to make previousLoggedUsersJson[username] valid
			var encrypted = "encrypted";
			var deferred = new Deferred();
			var isEncrypted = storeProviderSecurity.isEncrypted();
			// MM memory usage improvement in JSON.stringify , huge spike in memory , this needs to implememt with if condition
			//Logger.trace("list of previousLoggedUsers: " + JSON.stringify(localStorage.previousLoggedUsers));

			if(localStorage.previousLoggedUsers) {
				var previousLoggedUsersJson = JSON.parse(localStorage.previousLoggedUsers);

				// this user have already logged in the past
				if(previousLoggedUsersJson[username]) {
					// try to match user/pass
					if(isEncrypted) {
						Logger.trace("user present on previousLoggedUsers, try to decrypt jsonStore");
						return this._initStore(USER_PROFILE_STORE, {'username': 'string'}, credentials, force);
					}
					else {
						// check locally if password matches
						if(previousLoggedUsersJson[username] == password) {
							Logger.trace("user password matches locally stored or forced");
							return this._initStore(USER_PROFILE_STORE, {'username': 'string'}, {username: credentials['username']}, force);
						}
						else if (credentials['authenticated'] && force){
							var changePswdDeferred = new Deferred();
							this._initStore(USER_PROFILE_STORE, {'username': 'string'}, {username: credentials['username']}, force)
							.then(function(result){
								Logger.trace('user authenticated with server but password does not match locally so changing it.');
								StoreProvider._changePassword(credentials['username'], previousLoggedUsersJson[username], credentials['password']).
								always(function(){
									return changePswdDeferred.resolve(result);
								});
							})
							.otherwise(function(error){
									changePswdDeferred.reject(error);
							});
							return changePswdDeferred.promise;
						}
						else {
							Logger.trace("user password does NOT matches locally stored");
							deferred.reject(MessageService.createStaticMessage("Invalid user credentials."));
						}
					}
				}
				// first time this user is logging in, but other users have already logged
				else {
					// user has just logged to server
					if(credentials['authenticated']) {
						Logger.trace("user was successfully authenticated");
						// add user to localStorage
						previousLoggedUsersJson[username] = isEncrypted ? encrypted : password;
						localStorage.previousLoggedUsers = JSON.stringify(previousLoggedUsersJson);

						var newCredentials = credentials;
						if(!isEncrypted) {
							newCredentials = {username: credentials['username']};
						}
						// init store with credentials
						return this._initStore(USER_PROFILE_STORE, {'username': 'string'}, newCredentials);
					}
					else {
						Logger.trace("user was NOT successfully authenticated");
						// user not authorized
						deferred.reject(MessageService.createStaticMessage("Unable to authenticate on server for first authentication"));
					}
				}
			}
			// first time a user is logging in
			else {
				if(credentials['authenticated']) {
					Logger.trace("user was successfully authenticated");
					// create localStorage and add user
					var key = username;
					var obj = {};
					obj[key] = isEncrypted ? encrypted : password;
					localStorage.previousLoggedUsers = JSON.stringify(obj);
					var newCredentials = credentials;
					if(!isEncrypted) {
						newCredentials = {username: credentials['username']};
					}
					return this._initStore(USER_PROFILE_STORE, {'username': 'string'}, newCredentials);
				}
				else {
					Logger.trace("user was NOT successfully authenticated");
					// user not authorized
					deferred.reject(MessageService.createStaticMessage("Unable to authenticate on server for first authentication"));
				}
			}

			return deferred.promise;
		},

		_getStore: function(resourceName){
			//Logger.trace('PersistenceManager - _getStore - ' + resourceName);
			var jsonStore = StoreProvider.get(resourceName);
			if(jsonStore == null || jsonStore == undefined) {
				throw new PlatformRuntimeException('storeNotFound', [resourceName]);				
			}
			return jsonStore;
		},
		
		_initSystemPropertiesStore: function(credentials){
			var metadata = new ResourceMetadata({resourceName: SYSTEM_PROPERTIES_STORE})
			.setLocal(true)
			.addField({
				name:  'propertyName',
				dataType: 'string',
				local: true,
				index: true
			})
			.addField({
				name:  'propertyValue',
				dataType: 'string',
				local: true,
				index: false
			});
			return this._initCollection(metadata,credentials);			
		},
		
		_createBlankRecord: function(metadata){
			var blankRecord = {};
			arrayUtil.forEach(metadata.fields, function(field){
				blankRecord[field.name] = null;
			});
			return blankRecord;
		},
		
		_initStore: function(storeName, searchFields, credentials, force){
			var deferred = new Deferred();
			var collection = {};
			collection[storeName] = {
				searchFields: searchFields
			};
			
			StoreProvider.init(collection, credentials)
			.done(function(statuses){
				deferred.resolve(statuses);
			})
			.fail(function(err){
				err['initStoreError']=true;
				deferred.reject(err);
			});
			
			return deferred.promise;			
		},
		
		_saveAllQueryBasesDataToStore: function(results, metadata){
			var persistDeferred = null;
			//Need to chain deferreds returned from add method
			//as all calls affect the same resource, so we can properly
			//look for existing records.
			for (queryBase in results){
				var oslcResult = results[queryBase];
				Logger.trace("[DATA] Adapter returned " + oslcResult.length + " records for remote resource '" + metadata.name + "' and queryBase '" + queryBase + "'");
				Logger.trace("[DATA] Saving records into JSON store");
				this.translateOSLCDataToStore(oslcResult, metadata);
				if (persistDeferred === null){
					persistDeferred = this.add(metadata, oslcResult, queryBase);
				} else {
					persistDeferred.then(hitch(this, function(){
						return this.add(metadata, oslcResult, queryBase);
					}));
				}
			}
			
			return persistDeferred;
		},

		initCollection: function(metadata) {
			if(!metadata) {
				throw new PlatformRuntimeException('invalidMetadata');
			};
			if (metadata.inMemory == true){
				ResourceMetadataContext.putResourceMetadata(metadata);
				
			} else {
				ResourceMetadataContext.putResourceMetadata(metadata);
			}
			
			var deferred = new Deferred();
			deferred.resolve();
			return deferred.promise;
		},

		activateOrCreateCollections: function(credentials, force){
			return this._activateCollections(credentials, false, force);
		},
		
		activateCollectionsOrFail: function(credentials){
			return this._activateCollections(credentials, true);
		},

		_activateAppCollectionsIfValidUser: function(statuses, username, failIfNotExist) {
			Logger.trace('[DATA] Initializing user profile store with credentials - DONE');
			var wasCreated = (statuses[USER_PROFILE_STORE] == 0);
			if (failIfNotExist && wasCreated){
				Logger.log('[DATA] User profile store was created but it was expected to be existing. Failing.');
				StoreProvider.get(USER_PROFILE_STORE).removeCollection();
				StoreProvider.closeAll();
				throw new PlatformRuntimeException('unexpectedCollectionCreation');
			}
			//Subsequent stores initialization just require the username
			return this._activateAppCollections({username: username});
		},
		
		_activateCollections: function(credentials, failIfNotExist, force){
			Logger.trace('[DATA] Initializing user profile store with credentials');
			var loginPromise = this._initUserProfileStore(credentials, force).
			then(
				this.makeCallback('_activateAppCollectionsIfValidUser', credentials['username'], failIfNotExist), 
				function(err) {
					Logger.error(err);
					StoreProvider.closeAll();
					var message = err['msg'] || err['textMsg'];
					var exception =  new PlatformRuntimeException(message);
					if(err.initStoreError){
						exception['initStoreError'] = err.initStoreError;
					}
					throw exception;
				}
			);
			return loginPromise;
		},
		
		_activateAppCollections: function(credentials){
			var self = this;
			var promises = [];
			//Initialize system stores
								
			promises.push(self._initTransactionStores(credentials));
			promises.push(self._initSystemPropertiesStore(credentials));									
						
			return all(promises).then(function(result){
				// MM Huge improvement in memory spike disabling JSON.stringify object ,  logger trace needs to be implemented based on if condition 
				//Logger.trace('[DATA] All stores initialized successfully.' + JSON.stringify(result));				
				return self._loadSystemProperties(credentials);
			});
		},
		_initTransactionStores: function(credentials) {			
			return all([this._initStore(TRANSACTION_QUEUE, transactionQueueStructure, credentials),
			            this._initStore(STAGING_TRANSACTION_QUEUE, stagingTransactionStructure, credentials)]);
		},
		_loadSystemProperties: function(credentials){
			var self = this;
			Logger.trace('[DATA] Initializing system properties');
			// initial _save() implementation to load predefined platform properties 
			SystemProperties._save = lang.hitch(self, function(newSystemPropertiesList, changedSystemPropertiesList, deletedSystemPropertiesList) {
				var jsonStore = this._getStore(SYSTEM_PROPERTIES_STORE);
				 Logger.trace("Save system properties to store [INF225445 IN2001] - ", SYSTEM_PROPERTIES_STORE);
				 Logger.traceJSON("JSON store [INF225445 IN2009]", jsonStore);
				var promises = [];
				if (newSystemPropertiesList.length > 0){
					Logger.traceJSON("New System Property List existsw [INF225445 IN2005]  ", newSystemPropertiesList);
					promises.push(this._asDojoPromise(jsonStore.add(newSystemPropertiesList, {push: false})));
				}
				if (changedSystemPropertiesList.length > 0){
					Logger.traceJSON("Changed system properties List [INF225445 IN2006]  ", changedSystemPropertiesList);
					promises.push(this._asDojoPromise(jsonStore.replace(changedSystemPropertiesList, {push: false})));
				}
				if (deletedSystemPropertiesList.length > 0){
					Logger.traceJSON("deleted system properties List [INF225445 IN2007]  ", deletedSystemPropertiesList);
					promises.push(this._asDojoPromise(jsonStore.remove(deletedSystemPropertiesList, {push: false})));
				}
				var deferred = new Deferred();
				all(promises).then(function(){
					Logger.trace("Executing 'All' sequence for loadSystemProperties now [INF225445 IN2003]  ");
					deferred.resolve(self._reloadSystemProperties());
				});
				return deferred.promise;				
			});
			return SystemProperties.initialize(credentials);
		},
		_reloadSystemProperties: function(){
			Logger.timerStart('[DATA] Reloading System properties');
			var jsonStore = this._getStore(SYSTEM_PROPERTIES_STORE);
			Logger.traceJSON("Reload system properties. [INF225445 IN2004]: ", jsonStore);
			var promise = jsonStore.findAll({});
			var deferred = new Deferred();
			promise.done(function(resultSet){
				SystemProperties._setProperties(resultSet);
				Logger.timerEnd('[DATA] Reloading System properties');
				deferred.resolve();
			}).
			fail(function(err){
				Logger.trace('[DATA] Error Reloading System properties ' + err);
				// resolve anyways, the app wont stop
				deferred.resolve();
			});
			return deferred.promise;
		},
		
		getSystemProperties: function(){
			return systemPropertiesDataSet;
		},
		
		initStore: function(metadata) {
			//Logger.log('[DATA] got initStore call for ' + metadata.name);
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};
			if (credentials) {
				return this._initCollection(metadata, credentials);
			}
			else {
				return this._initCollection(metadata);
			}
		},
		
		_initCollection: function(metadata, credentials) {
			//	Summary:
			//		Create/Initialize a collection
			//				
			//	Description:
			//		Returns a promise that is resolved when the collection is created.
			if(!metadata) {
				throw new PlatformRuntimeException('invalidMetadata');
			};
			var resourceName = metadata.name;
			var searchFields = metadata.getIndexes();

			ResourceMetadataContext.putResourceMetadata(metadata);
			Logger.timerStart("[DATA] Initializing JSON store " + resourceName);
			
			var callerPromise = this._initStore(resourceName, searchFields, credentials)
			.then(hitch(this, function(statuses){
				metadata.isInited = true;
				Logger.timerEnd("[DATA] Initializing JSON store " + resourceName);
			}));
			
			return callerPromise;
		},
		
		add: function(metadata, dataObject, queryBaseName, truncateBeforeAdd, renewCleanupToken) {
			var dataArray = dataObject.data ? dataObject.data : dataObject;
			
			return runOrRejectWithError(this, function() {
				var timerMsg = "PersistenceManager - add - Adding data into jsonstore - " + metadata.name;
				Logger.timerStart(timerMsg);
				
				if (!metadata.additionalData && !metadata.isSystem && dataArray && dataArray.length == 0){
					if (queryBaseName){
						DataCleanupService.renewCleanupToken({
							resourceName: metadata.name,
							queryBase: queryBaseName
						});
					}
					return new CustomDeferred().resolve();
				}
				var self = this;
				
				//Early termination if init needed and asynchronous recursion
				if (metadata.isInited == false){
					return this._initCollection(metadata, {username: UserAuthenticationManager._getCurrentUser()}).
					then(function(){
						if(dataObject.isDelta){
							//it was required since the data been removed from dataObject
							dataObject.data = dataArray;
							return self.add(metadata, dataObject, queryBaseName, truncateBeforeAdd, renewCleanupToken);
						}else{
							return self.add(metadata, dataArray, queryBaseName, truncateBeforeAdd, renewCleanupToken);	
						}
						
					});
				}
				metadata.checkIfOverTheDataLimit(dataArray,false);
				
				this._initializeNonExistingFields(dataArray, metadata.fields);
				var resourceName = metadata.name;
				var jsonStore = this._getStore(resourceName);
	
				var consumerDeferred = new CustomDeferred();
				var consumerPromise = consumerDeferred.promise;
				
				onAddSuccess = function(res) { consumerDeferred.resolve(); Logger.timerEnd(timerMsg); dataArray=null;jsonStore=null;}; 
				onAddFailure = function(res) { consumerDeferred.reject(); dataArray=null; jsonStore=null;}; 
				addOptions = { onSuccess : onAddSuccess, onFailure : onAddFailure}; 
				truncateBeforeAdd = (truncateBeforeAdd || (metadata.serverOnlyMode && !dataArray.truncated));
				
				if (metadata.additionalData || metadata.isSystem || truncateBeforeAdd){
					//Only do this the second time through the function
					if (truncateBeforeAdd){
						metadata.isInited = false;
						Logger.timerStart('Truncating lookup data jsonstore before adding - ' + metadata.name);
						var storePromise = null;
						if (dataObject.isDelta){
							var query = arrayUtil.map(dataArray, function(data){
								var result = {};
								var remoteid = data[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE];
								result[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE] = remoteid;
								return result;
							});
							jsonStore.find(query, {exact: true}).then(function (results) {
								if(results.length > 0){
									var replace = [];
									var add = [];
									arrayUtil.forEach(results, function(data){
										var tempObj = {};
										tempObj._id = data._id;
										tempObj.json = dataArray.find(function(e){return e.remoteid == data.json["remoteid"]})
										replace.push(tempObj);
									});
									
									arrayUtil.forEach(dataArray, function(data){
										var tempObj  = results.find(function(e){return data.remoteid == e.json["remoteid"]})
										if(!tempObj){
											add.push(data);
										}
										
									});
									
									jsonStore.replace(replace, {}).then(function(numberOfDocsRemoved) {
										if(add.length > 0){
											return self.add(metadata, add, queryBaseName).
											then(function(){
												consumerDeferred.resolve();
												consumerDeferred = null;
											}).
											otherwise(function() {
												consumerDeferred.reject();
												consumerDeferred = null;
											});
										}else{
											consumerDeferred.resolve();
											consumerDeferred = null;
										}
										
										
									}).
									fail(function(e) {
										consumerDeferred.reject(e);
									});
								} else {
									return self.add(metadata, dataArray, queryBaseName).
									then(function(){
										consumerDeferred.resolve();
										consumerDeferred = null;
									}).
									otherwise(function() {
										consumerDeferred.reject();
										consumerDeferred = null;
									});
								}
								}).fail(function (error) {
									consumerDeferred.reject(error);
								});
    						//storePromise = jsonStore.remove(query, {exact: true});
						}
						else{
							storePromise = jsonStore.removeCollection().then(function(numberOfDocsRemoved) {
							if (metadata.serverOnlyMode){
								dataArray['truncated'] = true;
							}
							Logger.timerEnd('Truncating lookup data jsonstore before adding - ' + metadata.name);
							//Loop one more time through setting truncated bit to add
							return self.add(metadata, dataArray, queryBaseName).
							then(function(){
								consumerDeferred.resolve();
								consumerDeferred = null;
							}).
							otherwise(function() {
								consumerDeferred.reject();
								consumerDeferred = null;
							});
						}).
						fail(function(e) {
							consumerDeferred.reject(e);
						});
					}
					} else {
						//Final loop through where we actually add data to the json store
						if (dataArray && dataArray.length > 0) {
							jsonStore.add(dataArray, addOptions);
							dataArray = null;
							if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
						       
						        if (typeof (CollectGarbage) == "function")
						            CollectGarbage();
						    } 
						}else {
					    	return new CustomDeferred().resolve();
					    }
						
					}
									
				} else if (dataArray && dataArray.length > 0) {	
					if (!metadata.isLocal()) {
						if (metadata.wasWorklistStoreCleared() || (metadata.serverOnlyMode && dataArray.truncated)){
							//No need to synchronize data since the JSONStroe was cleared so only need to add records
							this._updateRecordsForAdd(dataArray, metadata, queryBaseName);
							jsonStore.add(dataArray, addOptions);
							dataArray = null;
							if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
						        if (typeof (CollectGarbage) == "function")
						            CollectGarbage();
						    }
						}
						else{
							this._synchronizeDataInJSONStore(dataArray, metadata, queryBaseName, renewCleanupToken).
							then(function(){
								Logger.timerEnd(timerMsg);
								consumerDeferred.resolve();
							}).
							otherwise(function(e) {
								consumerDeferred.reject(e);
							});
						}
					} else {
						jsonStore.add(dataArray, addOptions);
						dataArray = null;
						if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
					        if (typeof (CollectGarbage) == "function")
					            CollectGarbage();
					    }
					}
				} else {
					//Do nothing if dataArray is empty
					return new CustomDeferred().resolve();
				}
				
				return consumerPromise;
			});
		},
		
		synchronizeData: function(metadata, dataArray){
			return this._synchronizeDataInJSONStore(dataArray, metadata);
		},
		
		_initializeNonExistingFields: function(dataArray, fields){
			// 96017 - ignore local attributes
			arrayUtil.forEach(dataArray, function(data){
				arrayUtil.forEach(fields, function(field){
					if (field.name !== "remoteid" && 
						!(field.name in data) && field.local == false){
						data[field.name] = null;
					}
				});
			});
		},
		
		_asDojoPromise: function(jqueryDeferred){
			var deferred = new Deferred();
			if(jqueryDeferred && jqueryDeferred["done"]){
				jqueryDeferred.done(function(data){
					deferred.resolve(data);
				})
				.fail(function(err){
					deferred.reject(err);
				});
			}else{
				deferred.resolve();
			}
			return deferred.promise;
		},
		
		count: function(metadata, queryBaseName, query, isExactMatch) {
			var logKey = "PersistenceManager - count - Counting records for " + metadata.name + ", queryBase=" + queryBaseName + ", filter=" + (query && "<filter>" || "<none>");
			Logger.timerStart(logKey);
			//Until we don't have filtered count we need to load
			//everything and count the size of the array

			var self = this;
			if (metadata.isInited == false) {
				return self.initStore(metadata).
				then(function(){
					return self.count(metadata, queryBaseName, query, isExactMatch);
				});
			}
			
			//We have a query (and optionally a queryBase) so no easy way: 
			//Need to do a find, load data in memory and count
			//(LOADS DATA INTO MEMORY - SHOULD AVOID IT AS MUCH AS POSSIBLE)
			//To mitigate memory consumption, we do recursive finds in pages
			//of half size of the default page, to have a fair balance
			//between the amount of data loaded in memory and number of 
			//JSONStore roundtrips to get the whole count
			if (query || queryBaseName){				
				query = this._buildJSONStoreQueryForQueryBaseAndQuery(queryBaseName, query);
				var findMethod = null;
				if (isExactMatch){
					findMethod = this.findExact;
				} else {
					findMethod = this.find;
				}
				
				var halfPageSize = (metadata.pageSize || 40) / 2;
				var offset = 0;
				var count = 0;				
				function findAndCount(){
					return findMethod.call(self, query, metadata, queryBaseName, halfPageSize, offset).
					then(function(recordSet) {
						count += recordSet.length;
						//If we got any number of records less then a page size,
						//there is no more pages, so just return the full count
						if (recordSet.length < halfPageSize){
							Logger.timerEnd(logKey);
							return count;
						}
						offset += halfPageSize;
						return findAndCount();						
					});
				}
				
				return findAndCount();				
				
			} else {
				//No querybase, no query, so a simple count on resource jsonstore is enough
				//(NO DATA LOADED INTO MEMORY - PREFERRED METHOD)
				var resourceStore = this._getStore(metadata.name);
				return this._asDojoPromise(resourceStore.count()).
				then(function(c) {
					Logger.timerEnd(logKey);
					return c;
				}).otherwise(function(err) {
					Logger.timerEnd(logKey);
					throw err;
				});
			}
			
		},
		
		destroy: function(metadata) {
			var jsonStore = this._getStore(metadata.name);
			var promise = this._asDojoPromise(jsonStore.destroy());
			return promise;
		},
		
		_filterExactMatchesIfNeeded: function(resultSet, query, isExactMatch, callerDeferred){			
			Logger.timerStart("PersistenceManager - _filterExactMatchesIfNeeded");
			if (query && isExactMatch){
				//JSONStore.find performs a fuzzy search
				//so we need to filter the result list to only the exact match records.
				resultSet = (resultSet.length > 0) ? this._findExactMatch(query, resultSet) : resultSet;
			}
			Logger.timerEnd("PersistenceManager - _filterExactMatchesIfNeeded");
			callerDeferred.resolve(resultSet);
		},
		
		_findRecordsOnStore: function(metadata, queryBaseName, query, isExactMatch, limit, offset, returnAttr) {
			var callerDeferred = new CustomDeferred();
			var logKey = "PersistenceManager _findRecordsOnStore: (ignore if querybase exists)" + metadata.name + " queryBase: " + queryBaseName + " query: " + JSON.stringify(query);
			Logger.timerStart(logKey);
			if (metadata.isInited == false) {
				var self = this;
				return self.initStore(metadata).
				then(function(){
					return self._findRecordsOnStore(metadata, queryBaseName, query, isExactMatch, limit, offset);
				});
			}
							
			
			var resourceName = metadata.name;
			var options = this._getPaginationOptionsFor(limit, offset);
			if(metadata.orderBy) {
				options.sort = metadata.getJSONStoreOrderBy();
			}
			
			//returnAttr currently used for error count. 
			//Can be generally used to count records where we dont need to get the whole record and crowd the memory
			if(returnAttr){
				options.filter = [returnAttr];
				delete options.sort;
				delete options.limit;
				delete options.offset;
			}
			if (queryBaseName){
				Logger.timerEnd(logKey);
				this._filterQueryBase(resourceName, queryBaseName, options, query, isExactMatch).
				then(this.makeCallback('_filterExactMatchesIfNeeded', query, isExactMatch, callerDeferred)).
				otherwise(function(err){
					callerDeferred.reject(err);						
				});
				
			} else {
				var jsonStore = this._getStore(resourceName);
				var promise = null;
				if(options.sort &&  jsonStore.advancedFind) {
					//Has sort and using JSONStore so need to convert query to QueryParts to be used in advanceFind
					if(query){
						query = this._buildJSONStoreQueryPart(queryBaseName, query, isExactMatch);
					}
					else{
						query = [];
					}
					isExactMatch = false;  //advanceFind has exact match
					promise = jsonStore.advancedFind(query, options);
				}
				else {
					if (query){
						promise = jsonStore.find(query, options);
					} else {
						promise = jsonStore.findAll(options);
					}
				}
				var callback = this.makeCallback('_filterExactMatchesIfNeeded', query, isExactMatch, callerDeferred);										
				promise.done(function(resultSet){
					Logger.timerEnd(logKey);
					callback(resultSet);
				}).
				fail(function(err){
					callerDeferred.reject(err);
				});
			}

			return callerDeferred.promise;
		},
		
		find: function(query, metadata, queryBaseName, limit, offset, returnAttr) {
			var LIKE_MATCH = false;
			return this._findRecordsOnStore(metadata, queryBaseName, query, LIKE_MATCH, limit, offset, returnAttr);
		},
		
		findExact: function(query, metadata, queryBaseName, limit, offset) {
			var EXACT_MATCH = true;
			return this._findRecordsOnStore(metadata, queryBaseName, query, EXACT_MATCH, limit, offset);
		},
		
		findAll: function(metadata, queryBaseName, limit, offset) {
			return this._findRecordsOnStore(metadata, queryBaseName, null, null, limit, offset);
		},
		
		_getPaginationOptionsFor: function(limit, offset){
			var options = {};
			if (typeof limit == 'number' && limit > 0){
				offset = (offset || 0);
				options['limit'] = limit;
				options['offset'] = offset;
			}
			return options;
		},
		
		findById: function(metadata, id) {
			if (metadata.isInited == false) {
				var self = this;
				return self.initStore(metadata).
				then(function(){
					return self.findById(metadata, id);
				});
			}
			var jsonStore = this._getStore(metadata.name);
			var promise = this._asDojoPromise(jsonStore.findById(id));
			return promise;
		},
		
		remove: function(metadata, dataOrQuery, isExactMatch) {
			if (metadata.isInited == false) {
				var self = this;
				return self.initStore(metadata).
				then(function(){
					return self.remove(metadata, dataOrQuery, isExactMatch);
				});
			}
			var jsonStore = this._getStore(metadata.name);
			return this._asDojoPromise(jsonStore.remove(dataOrQuery, {exact: isExactMatch, markDirty:false}));
		},		
		
		replace: function(metadata, data, doNotPropagateChanges) {
			var propagateChanges = !doNotPropagateChanges;
			Logger.timerStart("PersistenceManager - replace - Replacing data into jsonstore: " + metadata.getResourceName());
			if (metadata.isInited == false) {
				var self = this;
				return self.initStore(metadata).
				then(function(){
					return self.replace(metadata, data);
				});
			}
			
			metadata.checkIfOverTheDataLimit(data,true);
			
			return runOrRejectWithError(this, function() {
				var resourceName = metadata.name;
				var jsonStore = this._getStore(resourceName);
				var promise = this._asDojoPromise(jsonStore.replace(data));
				var self = this;
				return promise.then(function() {
					Logger.timerEnd("PersistenceManager - replace - Replacing data into jsonstore:" + metadata.getResourceName());
					if(propagateChanges){
						self._notifyDataUpdate(resourceName, data);
					}
				});
			});			
		},
		
		_notifyDataUpdate: function(resourceName, data) {
			if (data.length == 0){
				return;
			}
			var start = new Date().getTime();
			Logger.trace('Replace published for resource ' + resourceName);
			try {
				topic.publish(PlatformConstants.DATA_REFRESH_TOPIC + '/' + resourceName, resourceName, data);
			} catch (e) {
				Logger.log('Error publishing replace for resource ' + resourceName + '.' + e);
			}
			Logger.trace('Replace published for resource ' + resourceName + ' - completed. ' + (new Date().getTime() - start) + 'ms');
		},
		
		_notifyNewDataReceivedOrDataRemoved: function(resourceName){
			var start = new Date().getTime();
			Logger.trace('New data published for resource ' + resourceName);
			try {
				topic.publish(PlatformConstants.DATA_REFRESH_TOPIC + '/' + resourceName, resourceName, []);
			} catch (e) {
				Logger.log('Error publishing new data for resource ' + resourceName + '.' + e);
			}
			Logger.trace('New data published for resource ' + resourceName + ' - completed. ' + (new Date().getTime() - start) + 'ms');
		},
		getTransactionOfAllRecords: function() {
			var store = this._getStore(TRANSACTION_QUEUE);
			// we use the order of first insertion (lower id)
			return this._asDojoPromise(store.findAll());
		},
		getTransactionRecordOf: function(resourceName, resourceId) {
			var store = this._getStore(TRANSACTION_QUEUE);
			
			var resourceIdToCheck = resourceId;
			if ( (typeof resourceId === 'number') || resourceId.indexOf("<") < 0){
				resourceIdToCheck = "<" + resourceId + ">";
			}

			var options = {"resourceName": resourceName, "storeId" : resourceIdToCheck};
			return this._asDojoPromise(store.find(options));
		},
		saveTransactionRecord: function(transactionRecord){
			var store = this._getStore(TRANSACTION_QUEUE);
			if(transactionRecord["_id"] !== undefined){
				return this._asDojoPromise(store.replace([transactionRecord], {push: false}));
			}
			return this._asDojoPromise(store.add(transactionRecord, {push: false}));			
		},
		removeTransactionRecordOf: function(transactionRecordId) {
			var store = this._getStore(TRANSACTION_QUEUE);
			if(transactionRecordId){
				if(!lang.isArray(transactionRecordId) || transactionRecordId.length > 0){
					return this._asDojoPromise(store.remove(transactionRecordId, {push: false}));
				}
			}
			return new Deferred().resolve();
		},
		stageTransactionRecord: function(transactionRecord){
			var store = this._getStore(STAGING_TRANSACTION_QUEUE);
			return this._asDojoPromise(store.add(transactionRecord, {push: false}));			
		},
		removeStagedTransaction: function(transactionRecordId) {
			var store = this._getStore(STAGING_TRANSACTION_QUEUE);
			if(transactionRecordId){
				if(!lang.isArray(transactionRecordId) || transactionRecordId.length > 0){
					return this._asDojoPromise(store.remove(transactionRecordId, {push: false}));
				}
			}
			return new Deferred().resolve();
		},

		removeQuerybase: function(resource, querybase_name)
		{
			
			DataCleanupService.performDataCleanup(
				{'metadata': resource, 'queryBase': querybase_name, 'removeQuery': true}

			);
		},

		getStagedTransactionRecordOf: function(resourceName, resourceId) {
			var deferred = new Deferred();
			var store = this._getStore(STAGING_TRANSACTION_QUEUE);
			
			var resourceIdToCheck = resourceId;
			if ( (typeof resourceId === 'number') || resourceId.indexOf("<") < 0)
			{
				resourceIdToCheck = "<" + resourceId + ">";
			}
			
			var options = {"resourceName": resourceName, "storeId" : resourceIdToCheck};
			this._asDojoPromise(store.find(options)).then(function(dataArray){
				dataArray.sort(function(a,b){
					return a["json"]["creationDate"] - b["json"]["creationDate"]; 
				});
				deferred.resolve(dataArray);
			}).otherwise(function(error){
				deferred.reject(error);
			});
			return deferred.promise;
		},
		// method for getting all stage records
		getStageTransactionRecords: function() {
			var deferred = new Deferred();
			var store = this._getStore(STAGING_TRANSACTION_QUEUE);

			this._asDojoPromise(store.findAll({})).then(function(dataArray){
				dataArray.sort(function(a,b){
					return a["json"]["creationDate"] - b["json"]["creationDate"]; 
				});
				deferred.resolve(dataArray);
			}).otherwise(function(error){
				deferred.reject(error);
			});
			return deferred.promise;
			
		}
	};
	mixin(thisModule, classBody, JsonTranslationMixin, JsonInMemoryFindMixin, QueryBaseSaveMixin, QueryBaseFilterMixin, JsonInMemorySortMixin, CallbackCreator.prototype);
});

