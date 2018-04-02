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

define("platform/store/_ServerDataDownloadManager",
["dojo/_base/declare",
 "dojo/Deferred", 
 "dojo/_base/array",
 "dojo/_base/lang",
 "dojo/promise/all",
 "platform/comm/CommunicationManager",
 "platform/store/_JsonTranslationMixin",
 "platform/exception/PlatformRuntimeException",
 "platform/store/_ResourceMetadataContext",
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "platform/util/runOrRejectWithError",
 "platform/store/SystemProperties",
 "platform/store/_DataCleanupService",
 "platform/attachment/AttachmentService",
 "platform/attachment/FileService",
 "platform/store/StoreLock"], 
function(declare, Deferred, arrayUtil, lang, all, CommunicationManager, JsonTranslationMixin,
		PlatformRuntimeException, ResourceMetadataContext, PlatformConstants, Logger, runOrRejectWithError, SystemProperties,
		DataCleanupService, AttachmentService, FileService, StoreLock) {
	
	//Need to inject PersistenceManager dependency in "runtime" instead of "loadtime" to avoid circular reference below:
	//PersistenceManager => ResourceMetadata => _ServerPreferredDataAccessStrategy => PersistenceManager
	var PersistenceManager = null;
	var UserAuthenticationManager = null;
	require(["platform/store/PersistenceManager", "platform/auth/UserAuthenticationManager"], function(PM, UAM){
		UserAuthenticationManager = UAM;
		PersistenceManager = PM;
	});
	
	function getValuesFromFields(metadataField, fieldInfo){
		var valuesArray = [];
		if (/inline|reference/.test(metadataField.dataType)){							
			if (metadataField.displayValueRemoteName in fieldInfo){
				valuesArray = fieldInfo[metadataField.displayValueRemoteName];
			} else {
				fieldInfo[metadataField.displayValueRemoteName] = valuesArray;
			}
			
		} else if ('values' in fieldInfo) {
			valuesArray = fieldInfo.values;
		} else {
			fieldInfo.values = valuesArray;
		}
		return valuesArray;
	}
	
	function formatValue(metadataField, query, fieldName){
		var formattedValue = null;
		var valueToFormat = query[fieldName];
		if (metadataField.dataType != 'string' && 
			!/date(time)?/i.test(metadataField.dataType)){
			formattedValue = valueToFormat;
			
		} else if (/date(time)?/i.test(metadataField.dataType)) {
			if (valueToFormat instanceof Date){
				formattedValue = '"' + valueToFormat.toISOString() + '"';
			} else if (typeof query[fieldName] === "object" && ("from" in valueToFormat || "to" in valueToFormat)){
				formattedValue = {};
				arrayUtil.forEach(Object.keys(valueToFormat), function(key) {
					formattedValue[key] = '"' + valueToFormat[key].toISOString() + '"';
				});
			}
			
		} else {
			formattedValue = '"' + query[fieldName] + '"';
		}
		return formattedValue;
	}
	
	function extractWhereClauseInfoFromQuery(queryAsArray, metadata){
		var fieldsValues = {};
		arrayUtil.forEach(queryAsArray, function(query){
			for (fieldName in query){
				if (query.hasOwnProperty(fieldName)){
					var metadataField = metadata.getField(fieldName);
					if (!metadataField.local){
						var fieldInfo = {};
						var remoteFieldName = metadataField.remoteName;
						if (remoteFieldName in fieldsValues){
							fieldInfo = fieldsValues[remoteFieldName];
						} else {
							fieldsValues[remoteFieldName] = fieldInfo;
						}
						
						var valuesArray = getValuesFromFields(metadataField, fieldInfo);
						
						if (metadataField.referenceResource){
							//Replace the current metadataField with the reference one so proper data type format can be applied
							var refMetadata = ResourceMetadataContext.getResourceMetadata(metadataField.referenceResource);
							arrayUtil.some(refMetadata.fields, function(field){
								if (field.remoteName == metadataField.displayValueRemoteName){
									metadataField = field;
									return true;
								}
								return false;
							});
						}
						
						var valueToAdd = formatValue(metadataField, query, fieldName);
						valuesArray.push(valueToAdd);
					}
				}
			}
		});
		return fieldsValues;
	}
	
	function generateWhereClauseForReferenceField(fieldWhereClause, fieldInfo){
		var refFieldsWhereClause = [];
		for (var refFieldName in fieldInfo){
			if (!fieldInfo.hasOwnProperty(refFieldName)){
				continue;
			}
			var fieldValues = fieldInfo[refFieldName];
			if (typeof fieldValues[0] === "object" && ("from" in fieldValues[0] || "to" in fieldValues[0])){
				var refFieldWhereClause = [];
				arrayUtil.forEach(Object.keys(fieldValues[0]), function(key) {
					refFieldWhereClause.push(refFieldName);
					refFieldWhereClause.push((key === 'from') ? '>=' : '<=');
					refFieldWhereClause.push(fieldValues[0][key]);
					refFieldWhereClause.push(" and ");
				});
				refFieldWhereClause.pop(); //remove tail "and"
				refFieldsWhereClause.push(fieldWhereClause.join(''));
				
			//Simple search
			} else {
				var refFieldWhereClause = [refFieldName];
				if (hasOnlyRepeatedValues(fieldValues)){
					refFieldWhereClause.push(fieldValues[0]);
					refFieldsWhereClause.push(refFieldWhereClause.join('='));					
				} else {
					refFieldWhereClause.push('[' + fieldValues.join(',') + ']');
					refFieldsWhereClause.push(refFieldWhereClause.join(' in '));
				}				
			}			
		}
		fieldWhereClause.push('{');
		fieldWhereClause.push(refFieldsWhereClause.join(' and '));
		fieldWhereClause.push('}');
	}
	
	function hasOnlyRepeatedValues(fieldValues) {
		var obj = {};
		arrayUtil.forEach(fieldValues, function(item) {
			obj[item] = true;
		});
		
		return (Object.keys(obj).length === 1);
	}
	
	function generateWhereClauseFromFieldsAndValues(fieldsValues){
		var whereClause = [];
		for (var fieldName in fieldsValues){
			if (!fieldsValues.hasOwnProperty(fieldName)){
				continue;
			}
			var fieldInfo = fieldsValues[fieldName];
			var fieldWhereClause = [];
			fieldWhereClause.push(fieldName);
			if ('values' in fieldInfo){ //simple field
				var fieldValues = fieldInfo['values'];
				//Range search
				if (typeof fieldValues[0] === "object" && ("from" in fieldValues[0] || "to" in fieldValues[0])){
					fieldWhereClause.pop(); //remove field name so it get's added within the loop
					arrayUtil.forEach(Object.keys(fieldValues[0]), function(key) {
						fieldWhereClause.push(fieldName);
						fieldWhereClause.push((key === 'from') ? '>=' : '<=');
						fieldWhereClause.push(fieldValues[0][key]);
						fieldWhereClause.push(" and ");
					});
					fieldWhereClause.pop(); //remove tail "and"
					whereClause.push(fieldWhereClause.join(''));
					
				//Simple search
				} else {
					if (hasOnlyRepeatedValues(fieldValues)){
						fieldWhereClause.push(fieldValues[0]);
						whereClause.push(fieldWhereClause.join('='));
					} else {
						fieldWhereClause.push('[' + fieldValues.join(',') + ']');
						whereClause.push(fieldWhereClause.join(' in '));
					}					
				}				
				
			} else { //reference fields
				generateWhereClauseForReferenceField(fieldWhereClause, fieldInfo);
				whereClause.push(fieldWhereClause.join(''));
			}
			
		}
		return whereClause.join(' and ');
	}
	
	var classBody = declare("", [], {
		_metadata: null, 
		_childMetadata: null,
		_totalAttachmentsDownloaded: 0,
		_totalAttachmentsSkipped: 0,
		_downloadTracker: null,
		
		constructor: function(metatada){
			this._metadata = metatada;
		},

		constructor: function(metatada, childMetadata){
			this._metadata = metatada;
			this._childMetadata = childMetadata;
		},
				
/**@memberOf platform.store._ServerDataDownloadManager */
		_convertUserQueryToOSLCWhereClause: function(query, metadata){
			var queryAsArray = (lang.isArray(query)) ? query : [query];
			
			var fieldsValues = extractWhereClauseInfoFromQuery(queryAsArray, metadata);
			var whereClause = generateWhereClauseFromFieldsAndValues(fieldsValues);
			
			return whereClause;
		},
		
		_serverGetAllResourceDataWithComplexAttributes: function(queryBase, complexAttributeList, pageSize){
			Logger.trace('[COMM] Previous "' + this._metadata.name + '" resource data request resolved.');
			Logger.trace('[COMM] Getting data from adapter if connectivity is available.');
			var whereClause = this._metadata.whereClause;
			return this._getDataWithComplexAttributesFromServerIfPossibleAndStore(queryBase, whereClause, complexAttributeList, pageSize);
		},
		
		_handleServerResults: function(promise, queryBase){
			var self = this;
			return promise.then(function(result){
				if (!self._metadata.isLocal() && !self._metadata.additionalData && !self._metadata.isSystem){
					var metrics = self._metadata.getResourceMetrics(queryBase);
					if (!metrics || metrics.canPerfromDataCleanup())
					{
						return DataCleanupService.performDataCleanup({
							metadata: self._metadata,
							queryBase: queryBase
						}).					
						then(function(){
							return result;
						});
					}
				}
				return result;
			}).otherwise(function(error){
				if (queryBase){
					var metrics = self._metadata.getResourceMetrics(queryBase);
					if (metrics)
					{
						Logger.trace('[_handleServerResults] Received error fetching data from the server.  Canceling ResourceMetrics refresh.');
						metrics.cancelRefresh();
					}
				}
				throw error;
			}); 
		},

		_serverGetAllResourceData: function(queryBase, pageSize, includeAllRelatedRecords, applyStablePagination, truncateStoreBeforeSave, collectAttachmentInfo){
			Logger.trace('[COMM] Previous "' + this._metadata.name + '" resource data request resolved.');
			Logger.trace('[COMM] Getting data from adapter if connectivity is available.');
			var whereClause = this._metadata.whereClause;
			var promise = this._getDataFromServerIfPossibleAndStore(queryBase, whereClause, pageSize, includeAllRelatedRecords, applyStablePagination, truncateStoreBeforeSave, collectAttachmentInfo);
			return this._handleServerResults(promise, queryBase);
		},
		
		_serverGetNextPageOfData: function(nextPageInfo){
			Logger.trace('[COMM] Next page of data "' + this._metadata.name + '" resource data request resolved.');
			Logger.trace('[COMM] Getting data from adapter if connectivity is available.');
			var promise = this._getNextPageDataFromServerIfPossibleAndStore(nextPageInfo);
			return this._handleServerResults(promise, nextPageInfo['queryBase']);
		},
		
		_serverQueryResourceData: function(queryBase, query, pageSize, oslcQueryParameters, justQuery){
			Logger.trace('[COMM] Previous "' + this._metadata.name + '" resource data request resolved.');
			Logger.trace('[COMM] Getting data from adapter if connectivity is available.');
			var whereClause = '';
			if (this._metadata.whereClause){
				whereClause = this._metadata.whereClause + ' and ';
			}
			var userWhereClause = this._convertUserQueryToOSLCWhereClause(query, this._metadata);
			whereClause += encodeURIComponent(userWhereClause);				
			
			return this._getDataFromServerIfPossibleAndStore(queryBase, whereClause, pageSize, null, null, null, null, oslcQueryParameters,justQuery);
		},
		
		_invokeProgressCallback: function(result, progressCallback, resetCounts){
			var recordsDownloaded = (lang.getObject('recordsDownloaded', false, result) || 0);
			var recordsCount = (lang.getObject('recordsCount', false, result) || 0);
			if (recordsDownloaded > 0){
				progressCallback(recordsDownloaded, recordsCount, resetCounts);
			}
		},
		
		_collectInfoOfAttachmentsToDownload: function (oslcResultArray) {
			if (!this._shouldDownloadAttachments()){
				return;
			}
			var tt_collectInfoOfAttachmentsToDownload = new TrackTime("_ServerDataDownloadManager", "_collectInfoOfAttachmentsToDownload", "Looking for attachments in oslc result", false);
			tt_collectInfoOfAttachmentsToDownload.startTracking();
			var metadata = this._metadata;
			var attachmentContainerAttrs = metadata.getAttachmentContainerComplexAttributes('remoteName');

			function hasAttachments(recordArray, complexAttrs){
				return arrayUtil.some(recordArray, function(item){
					return arrayUtil.some(Object.keys(complexAttrs), function(attr){
						if (item[attr] && 
							item[attr]['rdfs:member'] && 
							item[attr]['rdfs:member'].length > 0){
							if (complexAttrs[attr] === true){
								return true;
							} else {
								var childRecords = (lang.isArray(item[attr]) && item[attr] || [item[attr]]);
								return hasAttachments(childRecords, complexAttrs[attr]);
							}
						}
					});
				});
			}

			arrayUtil.forEach(oslcResultArray, function(item){
				arrayUtil.forEach(Object.keys(attachmentContainerAttrs), function(attr){
					if (item[attr] && 
						item[attr]['rdfs:member'] && 
						item[attr]['rdfs:member'].length > 0){
						if (attachmentContainerAttrs[attr] === true){
							this._remoteIdsOfRecordsWithAttachmentsToDownload.push(item[PlatformConstants.REMOTE_UNIQUEID_ATTRIBUTE]);

						} else {
							var childRecords = (lang.isArray(item[attr]) && item[attr] || [item[attr]]);
							if (hasAttachments(childRecords, attachmentContainerAttrs[attr])){
								this._remoteIdsOfRecordsWithAttachmentsToDownload.push(item[PlatformConstants.REMOTE_UNIQUEID_ATTRIBUTE]);
							}

						}

					}
				}, this);
			}, this);
			tt_collectInfoOfAttachmentsToDownload.stopTracking();
		},

		_remoteIdsOfRecordsWithAttachmentsToDownload: null, //Array

		_reloadAllPages: function(queryBase, pageSize){
			var deferred = new Deferred();
			var metrics = this._metadata.getResourceMetrics(queryBase);
			if (!metrics){
				//need metrics to continue
				deferred.resolve(0);
				return deferred.promise;
			}
			var pagesLoaded = 0;
			var self = this;
			this._canClearDataBeforePersist(queryBase, true).then(function(truncateData){
				if (truncateData){
					Logger.trace('reloadPages - ' + queryBase + ' is the only one loaded on the device so download will clear the store.');
				}
				self._downloadTracker = metrics.startWorkListDownload(truncateData, false);
				self._getDataFromServerIfPossibleAndStore(queryBase, self._metadata.whereClause, pageSize, false, true, truncateData).then(function(jsonResult){
					var loadNextPage = function(json){
						pagesLoaded++;
						deferred.progress(Math.round((pagesLoaded/self._downloadTracker.pagesToLoad) * 100));
						if (json && json.nextPageURL && self._downloadTracker.isActive()){
							var nextPageInfo = {
									nextPageURL: json.nextPageURL,
									nextRemotePageNum: json.nextRemotePageNum,
									queryBase: queryBase,
									hasNextRemotePage: function(){
										return true;
									}
							};
							self._getNextPageDataFromServerIfPossibleAndStore(nextPageInfo).then(function(nextPageJson){
								loadNextPage(nextPageJson);
							}).otherwise(function(error){
								if (self._downloadTracker){
									self._downloadTracker.reloadFinished(false);
								}
				    			deferred.reject(error);
							});
						}
						else if (!self._downloadTracker.isCanceled()){
							DataCleanupService.performDataCleanup({
								metadata: self._metadata,
								queryBase: queryBase
							}).					
							always(function(){
								if (self._downloadTracker){
									self._downloadTracker.reloadFinished(true);
								}
				    			deferred.resolve(pagesLoaded);
							});
						}
						else{
			    			deferred.resolve(pagesLoaded);
						}
					};
					loadNextPage(jsonResult);
				}).otherwise(function(error){
					if (self._downloadTracker){
						self._downloadTracker.reloadFinished(false);
					}
	    			deferred.reject(error);
				});
			});
			return deferred.promise;
		},	

		_canClearDataBeforePersist: function(queryBase){
			var deferred = new Deferred();
			
			if (this._metadata.additionalData){
				deferred.resolve(true);
			}
			else{
				var metrics =  this._metadata.getResourceMetrics(queryBase);
				if (!this._metadata.canHaveAttachments() && metrics && metrics.isOnlyQueryBaseLoaded()){
					var query = [];
					var changedPiece = {};
					//Check to see if there are any changed records or new records that has not completed push to server or erorred
					changedPiece[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = "{";
					query.push(changedPiece);
					var newRecordPiece = {};
					newRecordPiece[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE] = queryBase;
					query.push(newRecordPiece);
					PersistenceManager.count(this._metadata, null, query, false).then(function(count){
						var clear = (count == 0);
						deferred.resolve(clear);
					}).otherwise(function(error){
						//Since sort erorred and cannot determined if there are new or errored records, play it safe and return false
						deferred.resolve(false);
					});
				}
				else{
					deferred.resolve(false);
				}
			}
			return deferred.promise;
		},
		
		
		downloadAllPagesOfResourceData: function(cancelIndicator, queryBase, progressCallback, applyStablePagination){
			var metrics = this._metadata.getResourceMetrics(queryBase);
			if (metrics && metrics.allowRetry && !metrics.isAllDataDownloaded() && metrics._nextPageURL && metrics.getPagesLoaded() > 0 ){
				//Resource hasn't finished loading so retry from where it left off
				var deferred = new Deferred();
				var obj = {'queryBase': queryBase};
				obj[PlatformConstants.NEXT_PAGE_URL] = metrics._nextPageURL;
				var self = this;
				self._invokeProgressCallback({'recordsDownloaded': metrics.getPagesLoaded() * metrics.getPageSize(), 'recordsCount': metrics.getServerCount()}, progressCallback, true);
				var pagesDeferred = new Deferred();
				self._getRemainingRemotePagesFromServerAndStore(cancelIndicator, obj, progressCallback).
				then(function(result){
					Logger.trace("Sucessfully loading remaining pages of " + self._metadata.name);
					self._handleServerResults(pagesDeferred.promise, queryBase).then(function(handleResults){
						deferred.resolve(handleResults);
					});
					if (self._shouldDownloadAttachments()){
						self._downloadAttachments(cancelIndicator, progressCallback).then(function(){
							pagesDeferred.resolve(result);
						}).otherwise(function(error){
							pagesDeferred.reject(error);
						});
					}
					else{
						pagesDeferred.resolve(result);
					}
				},function(err){
					//Unable to load remaining pages so retry from begining
					Logger.trace("Error trying to reload remaining pages of " + self._metadata.name +" so reloading from begining");
					CommunicationManager.checkConnectivityAvailable().
					then(function(isConnected){
						if (isConnected){
							metrics.allowRetry = false;
							metrics._nextPageURL = null;
							self._downloadAllPagesOfResourceData(cancelIndicator, queryBase, progressCallback, applyStablePagination).then(function(result){
								deferred.resolve(result);
							},function(restartError){
								Logger.trace("Error calling _downloadAllPagesOfResourceData after failed attempt to load remaining pages of " + self._metadata.name);
								deferred.reject(restartError);
							});
						}else{
							deferred.reject(err);
						}
					});
				});
				deferred.promise.otherwise(function(error){
					throw error;
				});
				return deferred.promise;
				
			}
			else{
				return this._downloadAllPagesOfResourceData(cancelIndicator, queryBase, progressCallback, applyStablePagination);
			}
		},
		
		_downloadAllPagesOfResourceData: function(cancelIndicator, queryBase, progressCallback, applyStablePagination){
			this._remoteIdsOfRecordsWithAttachmentsToDownload = [];

			progressCallback = (progressCallback || function(){});
			if (cancelIndicator.shouldCancel()){
				Logger.trace('Loading pages of ' + this._metadata.name + ' was canceled.');
				var deferred = new Deferred();
				deferred.reject('canceled');
				return deferred.promise;
			}
			var self = this;
			var limitData = (WL.Client.getEnvironment() == WL.Environment.PREVIEW && (this._metadata.isSystem || this._metadata.additionalData) && !WL.application.debug);
			var pageSize = self._metadata.pageSize;
			if (limitData && pageSize > 200){
				pageSize = 200;
			}
			var msg = 'Loading first page of ' + self._metadata.name + ', queryBase: ' + (queryBase || '<none>');
			Logger.trace(msg);
			var ttServerGetAllResourceData = new TrackTime("_ServerDataDownloadManager", "_serverGetAllResourceData", msg, false);
			ttServerGetAllResourceData.startTracking();
			var COLLECT_ATTACH_INFO=true;
			return this._canClearDataBeforePersist(queryBase, true).then(function(truncateData){
				if (truncateData){
					Logger.trace(queryBase + ' is the only one loaded on the device so download will clear the store.');
				}
				var metrics = self._metadata.getResourceMetrics(queryBase);
				if (metrics && !self._metadata.additionalData && !self._metadata.isSystem ){
					self._downloadTracker = metrics.startWorkListDownload(truncateData, true); //Need to do this so cleanup only happens at end
				}
				return self._serverGetAllResourceData(queryBase, pageSize, true, (applyStablePagination !== false), truncateData, COLLECT_ATTACH_INFO).
				then(function(result){
					ttServerGetAllResourceData.stopTracking();

					Logger.trace('Loaded first page of ' + self._metadata.name);
					self._invokeProgressCallback(result, progressCallback, true);
					if (result && result[PlatformConstants.NEXT_PAGE_URL] && !cancelIndicator.shouldCancel()){
						if (limitData){
							Logger.log('ONLY THE FIRST 200 RECORDS FOR ' + self._metadata.name + ' were download because the app is running in the simulator.',1);
							if (metrics){
								metrics.markAsAllDataDownloaded();
							}
						} else{
							//Trigger the request for the next remote page
							var obj = {'queryBase': queryBase};
							obj[PlatformConstants.NEXT_PAGE_URL] = result[PlatformConstants.NEXT_PAGE_URL];
							var promise = self._getRemainingRemotePagesFromServerAndStore(cancelIndicator, obj, progressCallback).
							then(function(){
								if (self._shouldDownloadAttachments()){
									return self._downloadAttachments(cancelIndicator, progressCallback);
								}
							});
							return self._handleServerResults(promise, queryBase);
						}
					} else if (cancelIndicator.shouldCancel()){
						self._metadata.cancelActiveRefresh();
						Logger.log('Loading pages of ' + self._metadata.name + ' was canceled.');
						throw new PlatformRuntimeException('downloadCanceled');
					} else {
						if (self._shouldDownloadAttachments()){
							return self._downloadAttachments(cancelIndicator, progressCallback);
						}
						Logger.trace('All pages of ' + self._metadata.name + ' loaded successfully.');
					}
				}).
				otherwise(function(err){
					//fix for defect 240002 we need n the future enhance it to trate specific error codes
					/*if(metrics && err.invocationResult && err.invocationResult.errors){
						metrics.setError(err.invocationResult.errors[0]['oslc:statusCode']);
					}*/
					
					metrics.setError(err);
					
					if (self._metadata.additionalData && !self._metadata.isSystem){
						SystemProperties.setProperty('additionalDataDownloadState', 'error', true);
					}
					if(self._downloadTracker){
						self._downloadTracker.reloadFinished(false);
					}
					//self._metadata.cancelActiveRefresh();
					ttServerGetAllResourceData.stopTracking();
					var errorMsg = (typeof err == 'number') ? WL.JSONStore.getErrorMessage(err) : JSON.stringify(err);
					Logger.error('Unable to load remote page for ' + self._metadata.name + ', queryBase: ' + (queryBase || '<none>') + ', Error: ' + errorMsg);
					throw err;
				});
				
			});
		},		
		
		downloadRemainingPagesOfResourceData: function(cancelIndicator, queryBase, progressCallback){
			
			var self = this;

			var metrics = self._metadata.getResourceMetrics(queryBase);
			var blnLoadFirst = true;
			if (metrics){
				if (metrics['_' + PlatformConstants.NEXT_PAGE_URL]) {
					blnLoadFirst = false;
				}
			}
			
			if (blnLoadFirst) { //No pages downloaded before so start downloading all pages
				return self.downloadAllPagesOfResourceData(cancelIndicator, queryBase, progressCallback);
			} else { //Nextpage URL is present so continue downloading using next page info
				var obj = {'queryBase': queryBase};
				obj[PlatformConstants.NEXT_PAGE_URL] = metrics['_' + PlatformConstants.NEXT_PAGE_URL];
				var promise = self._getRemainingRemotePagesFromServerAndStore(cancelIndicator, obj, progressCallback).
				then(function(){
					if (self._shouldDownloadAttachments()){
						return self._downloadAttachments(cancelIndicator, progressCallback);
					}
				});
				return self._handleServerResults(promise, queryBase);
			}
		},		

		
		_shouldDownloadAttachments: function(){
			return (WL.Client.getEnvironment() != 'preview') && SystemProperties.getDownloadAttachmentsSetting();
		},

		_downloadAttachments: function(cancelIndicator, progressCallback){
			var deferred = new Deferred();
			if (this._remoteIdsOfRecordsWithAttachmentsToDownload &&
				this._remoteIdsOfRecordsWithAttachmentsToDownload.length > 0 &&
				this._shouldDownloadAttachments()){

				var totalRecordsWithAttachment = this._remoteIdsOfRecordsWithAttachmentsToDownload.length;
				var recordsWithAttachmentDownloaded = 0;
				this._totalAttachmentsDownloaded = 0;
				this._totalAttachmentsSkipped = 0;

				var query = arrayUtil.map(this._remoteIdsOfRecordsWithAttachmentsToDownload, function(remoteId){
					var result = {};
					var REMOTEID_ATTR = PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE;
					result['exact' + REMOTEID_ATTR] = "@--" + remoteId + "--@";
					return result;
				});
				var self = this;
				PersistenceManager.find(query, this._metadata).
				then(function(dataSet){
					if (cancelIndicator.shouldCancel()){
						deferred.reject('canceled');
						return;
					}
					var lastPromise = null;
					arrayUtil.forEach(dataSet, function(data){
						if (lastPromise){
							lastPromise = lastPromise.then(function(){
								recordsWithAttachmentDownloaded++;
								progressCallback({
									recordWithAttachmentCount: totalRecordsWithAttachment,
									recordsDownloaded: recordsWithAttachmentDownloaded
								});
								return self._downloadAllAttachmentsForRecord(data, cancelIndicator, progressCallback);
							});
						} else {
							recordsWithAttachmentDownloaded++;
							progressCallback({
								recordWithAttachmentCount: totalRecordsWithAttachment,
								recordsDownloaded: recordsWithAttachmentDownloaded
							});
							lastPromise = self._downloadAllAttachmentsForRecord(data, cancelIndicator, progressCallback);
						}
					});
					if (lastPromise){
						lastPromise.
						then(function(){
							progressCallback({
								attachmentsDownloadFinished: true,
								totalRecords: totalRecordsWithAttachment,
								totalAttachments: self._totalAttachmentsDownloaded,
								skippedAttachments: self._totalAttachmentsSkipped
							});
							deferred.resolve();
						}).
						otherwise(function(err){
							deferred.reject(err);
						});
					} else {
						progressCallback({
							attachmentsDownloadFinished: true,
							totalRecords: totalRecordsWithAttachment,
							totalAttachments: self._totalAttachmentsDownloaded,
							skippedAttachments: self._totalAttachmentsSkipped
						});
						deferred.resolve();
					}
				});

			} else {
				deferred.resolve();
			}

			return deferred.promise;
		},

		_downloadAllAttachmentsForRecord: function(record, cancelIndicator, progressCallback){
			var deferred = new Deferred();
			if (cancelIndicator.shouldCancel()){
				return deferred.reject('canceled');
			}
			var self = this;
			return StoreLock.lock( this._metadata.getResourceName(), function(){
				
				var recordID = AttachmentService.getOwnerRecordIdentifier(record, self._metadata);
				var attachmentContainerAttrs = self._metadata.getAttachmentContainerComplexAttributes('name');
				var lastPromise = null;
				var checkForBulkDownload = (self._metadata.hasField("bulkDownload")  && SystemProperties.getProperty('si.device.onlyBulkDownloadPrintWithReportAttachments') != 'false');
				arrayUtil.forEach(Object.keys(attachmentContainerAttrs), function(attr){
					if (attachmentContainerAttrs[attr] === true &&
						lang.isArray(record.json[attr]) &&
						record.json[attr].length > 0){
						var attachmentMetaData = ResourceMetadataContext.getResourceMetadata(self._metadata.getField(attr).referenceResource);

						var attachmentList = record.json[attr];
						arrayUtil.forEach(attachmentList, function(attachmentInfo){
							var attachmentData = (attachmentInfo.json?attachmentInfo.json:attachmentInfo);
							if (!checkForBulkDownload || attachmentData["bulkDownload"] === true)
							{
								if (lastPromise){
									lastPromise = lastPromise.then(function(){
										return self._downloadSingleAttachment({
											attachmentInfo: attachmentData, 
											'recordId': recordID, 
											'attachmentMetaData': attachmentMetaData 
										});
									});
								} else {
									lastPromise = self._downloadSingleAttachment({
										attachmentInfo: attachmentData, 
										'recordId': recordID, 
										'attachmentMetaData': attachmentMetaData 
									});
								}

								//Save the record after each file downloaded
								//so if it fail in the middle the download
								//state is properly stored
								lastPromise = lastPromise.
								then(function(){
									return PersistenceManager.replace(self._metadata, [record]);								
								});
							}
							else{
								self._totalAttachmentsSkipped++;
							}
						});

					} else if (lang.isArray(attachmentContainerAttrs[attr])){
						//TODO Go deep recursively into the hierarchy to search for nested attachments
					}
				});

				if (lastPromise){
					lastPromise.
					then(lang.hitch(deferred, deferred.resolve)).
					otherwise(lang.hitch(deferred, deferred.reject));
				} else {
					deferred.resolve();
				}

				return deferred.promise;
			}) ;
		},

		_isValidFileForDownload: function(attachmentInfo){
			//if it does have content locationmean that it is a web link and should not be downloaded so we alswer it not valid for download 
			if (attachmentInfo['contentLocation']){
				return false;
			}
			
			var filePath = attachmentInfo[PlatformConstants.ATTACH_LOCATION_ATTR];
			var isFileDownloaded = !!filePath;

			var fileSize = attachmentInfo['fileSize'];
			var maxFileSize = SystemProperties.getProperty('si.att.proxy.maxfilesize');

			if (fileSize == undefined || fileSize == null ||  fileSize == '')
			{	
				fileSize = 0 ; 
			}

			if (!maxFileSize || maxFileSize == undefined || maxFileSize == NaN || maxFileSize == ''){
				maxFileSize = 5242880;  //Default to 5mb
				SystemProperties.setProperty('si.att.proxy.maxfilesize', maxFileSize, false);
			}

			var fileIsTooBig =  parseInt(fileSize) >  parseInt(maxFileSize);
			return (!isFileDownloaded && !fileIsTooBig);
		},

		_downloadSingleAttachment: function(options){
			var attachmentInfo = options.attachmentInfo;
			if (!this._isValidFileForDownload(attachmentInfo)){
				this._totalAttachmentsSkipped++;
				return new Deferred().resolve();
			}
			var self = this;

			return AttachmentService.downloadAttachmentForRecord(attachmentInfo, options.attachmentMetaData, this._metadata.getResourceName(), 
					options.recordId, UserAuthenticationManager._getCurrentUser(), UserAuthenticationManager._getSessionId()).
			then(function(filePath){
					attachmentInfo[PlatformConstants.ATTACH_LOCATION_ATTR] = filePath;
					self._totalAttachmentsDownloaded++;
			}).
			otherwise(function(err){
				Logger.error(err);
				self._totalAttachmentsSkipped++;
			});
		},

		_getRemainingRemotePagesFromServerAndStore: function(cancelIndicator, nextPageInfo, progressCallback){
			var deferred = new Deferred();
			deferred.promise.otherwise(function(error){
				throw error;
			});
			if (cancelIndicator.shouldCancel()){
				Logger.trace('Loading pages of ' + this._metadata.name + ' was canceled.');
				deferred.resolve({});
				return deferred.promise;
			}
			var self = this;
			var msg = 'Loading next page of records from URL ' + nextPageInfo[PlatformConstants.NEXT_PAGE_URL];
			Logger.trace(msg);
			
			var ttGetNextPageDataFromServerIfPossibleAndStore = new TrackTime("_ServerDataDownloadManager", "_getRemainingRemotePagesFromServerAndStore", msg, false);
			ttGetNextPageDataFromServerIfPossibleAndStore.startTracking();
			var COLLECT_ATTACH_INFO = true;
			this._getNextPageDataFromServerIfPossibleAndStore(nextPageInfo, COLLECT_ATTACH_INFO).
			then(function(result){
				ttGetNextPageDataFromServerIfPossibleAndStore.stopTracking();
				
				self._invokeProgressCallback(result, progressCallback);
				Logger.trace('Loaded next page of records from URL ' + nextPageInfo[PlatformConstants.NEXT_PAGE_URL]);
				if (result && result[PlatformConstants.NEXT_PAGE_URL] && !cancelIndicator.shouldCancel()){
					//Trigger the request for the next remote page
					var obj = {'queryBase': nextPageInfo['queryBase']};
					obj[PlatformConstants.NEXT_PAGE_URL] = result[PlatformConstants.NEXT_PAGE_URL];
					obj[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES] = result[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES];
					self._getRemainingRemotePagesFromServerAndStore(cancelIndicator, obj, progressCallback).then(function(){
						deferred.resolve({});
					},function(error){
						deferred.reject(error);
					});
					
				} else if (cancelIndicator.shouldCancel()){
					Logger.log('Loading pages of ' + self._metadata.name + ' was canceled.');
					deferred.reject(new PlatformRuntimeException('downloadCanceled'));
				} else {
					Logger.trace('All pages of ' + self._metadata.name + ' loaded successfully.');
					deferred.resolve({});
				}
			}).
			otherwise(function(err){
				ttGetNextPageDataFromServerIfPossibleAndStore.stopTracking();
				// MM Memory usage improvements
				//var errorMsg = (typeof err == 'number') ? WL.JSONStore.getErrorMessage(err) : JSON.stringify(err);
				//Logger.error('Unable to load remote page for url ' + nextPageInfo[PlatformConstants.NEXT_PAGE_URL] + 'Error: ' + errorMsg);
				deferred.reject(err);
			});
			return deferred.promise;
		},
		
		_flagAllRecordsAsFullyLoaded: function(dataArray){
			arrayUtil.forEach(dataArray, function(data){
				data[PlatformConstants.IS_FULLY_LOADED_ATTRIBUTE] = true;
			});
			dataArray = null;
		},
		
		_getDataFromServerIfPossibleAndStore: function(queryBase, whereClause, pageSize, includeAllRelatedRecords, applyStablePagination, truncateStoreBeforeSave, collectAttachmentInfo, oslcQueryParameters, justQuery){
			//just to avoid doing hitch(this, callback) for all callback functions
			var self = this;
			Logger.trace('[COMM] A request for data was received for remote resource ' + this._metadata.name);
			Logger.trace('[COMM] Will try to fetch data from adapter first, cache, then return');
			Logger.trace('[COMM] Checking for connectivity');
			
			Logger.timerStart("_ServerDataDownloadManager - _getDataFromServerIfPossibleAndStore - Get data from adapter and store in jsonstore");
			
			return runOrRejectWithError(this, function(){
				var deferred = new Deferred();
				var promise = deferred.promise;
				CommunicationManager.checkConnectivityAvailable().
				then(function(isConnected){
					if (isConnected){
						
						return self._fetchResourceDataFromAdapter(queryBase, whereClause, pageSize, includeAllRelatedRecords, applyStablePagination, oslcQueryParameters).
						then(function(oslcResult){
							if (collectAttachmentInfo){
								self._collectInfoOfAttachmentsToDownload(oslcResult.data);
							}
							var recordsCount = oslcResult['recordsCount'];
							var recordsDownloaded = oslcResult['data'] ? oslcResult['data'].length : 0;
							var nextPageURL = oslcResult[PlatformConstants.NEXT_PAGE_URL];
							var requestedComplexAttributeNames = oslcResult[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES];
							if (!nextPageURL && recordsCount != recordsDownloaded){
								recordsCount = recordsDownloaded;
							}
							//If it's a search, return a query for
							//fetching the records in jsonstore
							var remoteidsQuery = null;
							if (queryBase == PlatformConstants.SEARCH_RESULT_QUERYBASE){
								remoteidsQuery = arrayUtil.map(oslcResult['data'], function(item) {
									return {remoteid: (item['rdf:about'] || item['remoteid'])};
								});
							}
							
							if (includeAllRelatedRecords){
								self._flagAllRecordsAsFullyLoaded(oslcResult.data);
							}
							if(justQuery){
								/*if it is just query the data not will be sotred, so we can check if any attribute
								like anywhereundo has change after last data downalod we need it to check data change 
								at records with error, since today platform return the local version of data for 
								record flag with error*/
								PersistenceManager.translateOSLCDataToStore(oslcResult.data, self._metadata);
								return deferred.resolve(oslcResult.data);
								deferred = null;
							}else{
								return self._persistDataOnLocalStore(oslcResult, queryBase, truncateStoreBeforeSave).
								then(function(){
									if ( !self._metadata.isSystem && !self._metadata.isAdditional){
										if(recordsDownloaded > 0){
											SystemProperties.updateLastTimeWorkListDownloaded(self._metadata.name + "-" + (queryBase || "-<none>"));
										}
									}
									
									var metrics = self._metadata.getResourceMetrics(queryBase);
									if (metrics){
										metrics.setMaxrowstamp(oslcResult["maxrowstamp"]);
										metrics.firstPageLoaded(pageSize, recordsCount, self._metadata.maxFetchDataLimit, nextPageURL);
									}
									var result = {
										'recordsCount': recordsCount,
										'recordsDownloaded': recordsDownloaded
									};
									result[PlatformConstants.NEXT_PAGE_URL] = nextPageURL;
									result[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES] = requestedComplexAttributeNames;
									
									if (remoteidsQuery){
										result.remoteidsQuery = remoteidsQuery;
									}
									
									recordsCount = null;
									recordsDownloaded = null;
									nextPageURL = null;
									requestedComplexAttributeNames = null;
									
									Logger.timerEnd("_ServerDataDownloadManager - _getDataFromServerIfPossibleAndStore - Get data from adapter and store in jsonstore");
									deferred.resolve(result);
									deferred = null;
								}).otherwise(function(error){
									if (error && error.stack){
										Logger.error(error);
									}
								});
							}
							
						}).
						otherwise(function(err){
							recordsCount = null;
							recordsDownloaded = null;
							nextPageURL = null;
							requestedComplexAttributeNames = null;
							if(!self._metadata.isSystem && 
									!self._metadata.isAdditional && 
										!SystemProperties.getLastTimeWorkListDownloaded(self._metadata.name + "-" + (queryBase || "-<none>"))){
								if(err && lang.isObject(err)){
									err["isFirstTimeWorkListDownloadedFailure"] = true;
								}
								else{
									err = {"originalError": err, "isFirstTimeWorkListDownloadedFailure": true};
								}
							}
							Logger.timerEnd("_ServerDataDownloadManager - _getDataFromServerIfPossibleAndStore - Get data from adapter and store in jsonstore");
							deferred.reject(err);
							deferred = null;
						});
					} else {
						Logger.timerEnd("_ServerDataDownloadManager - _getDataFromServerIfPossibleAndStore - Get data from adapter and store in jsonstore");
						deferred.reject('Unable to connect to server');
						deferred = null;
					}
				}).
				otherwise(function(err){
					Logger.timerEnd("_ServerDataDownloadManager - _getDataFromServerIfPossibleAndStore - Get data from adapter and store in jsonstore");
					deferred.reject(err);
					deferred = null;
				});
				
				return promise;
			});
		},
		
		_getNextPageDataFromServerIfPossibleAndStore: function(nextPageInfo, collectAttachmentInfo){
			Logger.timerStart("_ServerDataDownloadManager - _getNextPageDataFromServerIfPossibleAndStore - Get next page of data from adapter and store in jsonstore");
			var self = this;
			
			Logger.trace('[COMM] A request for the next page of data was received for remote resource ' + this._metadata.name);
			Logger.trace('[COMM] Will try to fetch data from adapter first, cache, then return');
			Logger.trace('[COMM] Checking for connectivity');
			
			return CommunicationManager.checkConnectivityAvailable().
			then(function(isConnected){
				if (isConnected){
					var recordsCount = null;
					var recordsDownloaded = null;
					var nextPageURL = null;
					var requestedComplexAttributeNames = null;
					var promise = self._fetchResourceNextPageDataFromAdapter(nextPageInfo).
					then(function(oslcResult){
						if (collectAttachmentInfo){
							self._collectInfoOfAttachmentsToDownload(oslcResult.data);
						}

						promise = null;
						recordsCount = oslcResult['recordsCount'];
						recordsDownloaded = oslcResult['data'].length;
						nextPageURL = oslcResult[PlatformConstants.NEXT_PAGE_URL];
						requestedComplexAttributeNames = oslcResult[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES];
						
						var metrics = self._metadata.getResourceMetrics(nextPageInfo['queryBase']);
						if (metrics){
							metrics.setMaxrowstamp((oslcResult["maxrowstamp"]?oslcResult["maxrowstamp"]:null));
						}
						
						return self._persistDataOnLocalStore(oslcResult, nextPageInfo['queryBase'], false, false);
					}).
					then(function(){
						var result = {
							'recordsCount': recordsCount,
							'recordsDownloaded': recordsDownloaded
						};
						var metrics = self._metadata.getResourceMetrics(nextPageInfo['queryBase']);
						if (metrics){
							metrics.nextPageLoaded(nextPageURL, recordsDownloaded);
						}
						result[PlatformConstants.NEXT_PAGE_URL] = nextPageURL;
						result[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES] = requestedComplexAttributeNames;
						Logger.timerEnd("_ServerDataDownloadManager - _getNextPageDataFromServerIfPossibleAndStore - Get next page of data from adapter and store in jsonstore");
						return result;
					});
					return promise;
				}
				else{
					return new Deferred().reject('Unable to connect to server');
				}
			});
		},
		
		_fetchResourceNextPageDataFromAdapter: function(nextPageInfo){
			Logger.trace('[COMM] Connectivity is available');
			Logger.trace('[COMM] Requesting data for adapter');
			return CommunicationManager.pullResourceNextPageData(this._metadata, nextPageInfo[PlatformConstants.NEXT_PAGE_URL], nextPageInfo[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES]);
		},
		
		_fetchResourceDataFromAdapter: function(queryBase, whereClause, pageSize, includeAllRelatedRecords, applyStablePagination, oslcQueryParameters){
			Logger.trace('[COMM] Connectivity is available');
			Logger.trace('[COMM] Requesting data for adapter');
			return CommunicationManager.pullResourceData(this._metadata, queryBase, whereClause, pageSize, includeAllRelatedRecords, applyStablePagination, oslcQueryParameters);
		},
		
		_fetchResourceDataWithComplexAttributesFromAdapter: function(queryBase, whereClause, complexAttributeList, pageSize){
			Logger.trace('[COMM] Connectivity is available');
			Logger.trace('[COMM] Requesting data for adapter');
			return CommunicationManager.pullResourceDataWithComplexAttributes(this._metadata, queryBase, whereClause, complexAttributeList, pageSize);
		},

		_removeRecordsBeloningOnlyToQueryBase: function(queryBase){
			var query = {};
			query[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = 'null';
			query[PlatformConstants.QUERYBASES_LIST_ATTR] = '<' + queryBase + '>';
			return PersistenceManager.remove(this._metadata, query, true);
		},
		
		_persistDataOnLocalStore: function(oslcResult, queryBase, truncateStoreBeforeSave, renewCleanupToken){
			//See if downloading worklist and if so and this is the first page of data, delete records belonging only to that querybase
			//to speed up the merge process.
			if (this._downloadTracker && this._downloadTracker.shouldRemoveRecords() && !this._metadata.canHaveAttachments()){
				var self = this;
				Logger.timerStart("_ServerDataDownloadManager - _persistDataOnLocalStore - Removing distinct querybase records from jsonstore");
				return this._removeRecordsBeloningOnlyToQueryBase(queryBase).always(function(){
					self._downloadTracker.recordsRemoved = true;
					return self._persistDataOnLocalStore(oslcResult, queryBase, truncateStoreBeforeSave, renewCleanupToken);
				});
			}
			Logger.timerStart("_ServerDataDownloadManager - _persistDataOnLocalStore - Storing data from adapter into jsonstore");
						
			Logger.trace('[COMM] Data returned successfully from adapter');
			Logger.trace('[COMM] Translating remote names to aliases');
			var oslcData = oslcResult.data ? oslcResult.data : oslcResult;
			
			this.translateOSLCDataToStore(oslcData, this._metadata);
			Logger.trace('[COMM] Caching returned data in local store');
			var recordCount = oslcData.length;
			return PersistenceManager.add(this._metadata, oslcResult, queryBase, truncateStoreBeforeSave, renewCleanupToken).
			then(function(){
				Logger.timerEnd("_ServerDataDownloadManager - _persistDataOnLocalStore - Storing data from adapter into jsonstore");
				Logger.trace('[COMM] Data cached successfully');
				oslcResult = null;
				return recordCount;
			});
		},

		getResourceByRef: function(resourceRef){
			return this._serverGetResourceByRef(resourceRef);
		},
		
		_serverGetResourceByRef: function(resourceRef, justQuery){
			if ((!lang.isObject(resourceRef) || !(PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE in resourceRef)) &&
				!lang.isString(resourceRef)){
				throw new PlatformRuntimeException('invalidRef', [resourceRef]);
			}
			Logger.trace('[COMM] Previous "' + this._metadata.name + '" resource data request resolved.');
			Logger.trace('[COMM] Getting data from adapter if connectivity is available.');
			return this._getSingleDataFromServerIfPossibleAndStore(resourceRef, PlatformConstants.SEARCH_RESULT_QUERYBASE, null, justQuery);
		},

		_getDataWithComplexAttributesFromServerIfPossibleAndStore: function(queryBase, whereClause, complexAttributeList, pageSize){
			var self = this;
			return CommunicationManager.checkConnectivityAvailable().
			then(function(isConnected){
				if(isConnected){
					return self._fetchResourceDataWithComplexAttributesFromAdapter(queryBase, whereClause, complexAttributeList, pageSize).
					then(function(oslcResult){
						var recordsDownloaded = oslcResult.data.length;
						return self._persistDataOnLocalStore(oslcResult, queryBase).
						then(function(){
							if(!self._metadata.isSystem && !self._metadata.isAdditional){
								if(recordsDownloaded > 0){
									SystemProperties.updateLastTimeWorkListDownloaded(self._metadata.name + "-" + (queryBase || "-<none>"));
								}
							}
							var metrics = self._metadata.getResourceMetrics(queryBase);
							if (metrics){
								var recordsCount = oslcResult['recordsCount'];
								var nextPageURL = oslcResult[PlatformConstants.NEXT_PAGE_URL];
								if (!nextPageURL && recordsCount != recordsDownloaded){
									recordsCount = recordsDownloaded;
								}
								metrics.firstPageLoaded(pageSize, recordsCount, self._metadata.maxFetchDataLimit, nextPageURL);
							}
						});
					});
				}
			});
		},

		_getSingleDataFromServerIfPossibleAndStore: function(resourceRef, parentModeldata, /*optional*/ arrayOfFieldNames, justQuery){
			//just to avoid doing hitch(this, callback) for all callback functions
			var self = this;
			
			Logger.trace('[COMM] A request for reference data was received for remote resource ' + this._metadata.name);
			Logger.trace('[COMM] Will try to fetch data from adapter first, cache, then return');
			Logger.trace('[COMM] Checking for connectivity');
			
			return CommunicationManager.checkConnectivityAvailable().
			then(function(isConnected){
				if (isConnected){
					var resourceUrl = (resourceRef['remoteid'] || resourceRef);
					return self._fetchSingleResourceDataFromAdapter(resourceUrl, arrayOfFieldNames).
					then(function(oslcResult){
						//Make sure the returned rdf:about is consistent with what was used to request data.
						//Needed because maximo provides a QBE url in association, but an ID url in record body.
						oslcResult['rdf:about'] = resourceUrl;
						if (justQuery){
							var deferred = new Deferred();
							PersistenceManager.translateOSLCDataToStore(oslcResult, self._metadata);
							deferred.resolve([{json:oslcResult}]);
							return deferred.promise; 
							deferred = null;
							
						}else{
							return self._persistSingleDataOnLocalStore(oslcResult, parentModeldata);
						}
						
					}).
					otherwise(function(){
						return false; //SERVER_FETCH_FAILED
					});
				}
				return false; //SERVER_FETCH_FAILED
			});
		},
		
		_fetchSingleResourceDataFromAdapter: function(resourceUrl, /*optional*/ arrayOfFieldNames){
			Logger.trace('[COMM] Connectivity is available');
			Logger.trace('[COMM] Requesting data for adapter');
			if (this._childMetadata)
			{
				return CommunicationManager.pullSingleResourceData(this._childMetadata, resourceUrl, arrayOfFieldNames);
			}
			
			return CommunicationManager.pullSingleResourceData(this._metadata, resourceUrl, arrayOfFieldNames);
		},		
		_persistSingleDataOnLocalStore: function(oslcResult, parentModeldata){	
			Logger.timerStart('PersistenceManager - _persistSingleDataOnLocalStore - Translate and store a single record into jsonstore');
			Logger.trace('[COMM] Data returned successfully from adapter');
			Logger.trace('[COMM] Translating remote names to aliases');
			var oslcResultSet = [oslcResult];

			if (this._childMetadata)
			{
				this.translateOSLCDataToStore(oslcResultSet, this._childMetadata);
			}
			else
			{
				this.translateOSLCDataToStore(oslcResultSet, this._metadata);	
			}
			
			Logger.trace('[COMM] Caching returned data in local store');

			var newOSLCResultSet = this._changeOSLCResult(oslcResultSet, parentModeldata);
			return PersistenceManager.synchronizeData(this._metadata, newOSLCResultSet).
			then(function(){
				//Free up memory as soon as we are finished
				newOSLCResultSet = null;
				oslcResultSet = null;
				oslcResult = null;
				Logger.trace('[COMM] Data cached successfully');
				Logger.timerEnd('PersistenceManager - _persistSingleDataOnLocalStore - Translate and store a single record into jsonstore');
				return true; //SERVER_FETCH_SUCCESSFULL
			});
		},		
		// returns a mixed child data with respect to parent object graph
		// derived from parent model data.
		_changeOSLCResult: function(oslcResultSet, parentModelData)
		{
			if (!parentModelData || parentModelData == PlatformConstants.SEARCH_RESULT_QUERYBASE){
				return oslcResultSet;
			}
			
			if (parentModelData.getOwner().getParent() == null)
			{
				// reached the top
				if (!lang.isArray(oslcResultSet))
				{
					oslcResultSet[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE] = parentModelData[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE];
					var newOSLCResultSetX = [];
					newOSLCResultSetX.push(oslcResultSet);
					
					return newOSLCResultSetX;
				}
				
				return oslcResultSet;
			}
			
			var parentAttribute = parentModelData.getOwner().getRelationNameWithParent();
			// Push the oslcResult under this parent data
			var newOSLCResultSet = {};
			newOSLCResultSet[parentAttribute] = oslcResultSet;
			newOSLCResultSet[PlatformConstants.DONOT_MERGE_THIS_LEVEL] = true;
			
			return this._changeOSLCResult(newOSLCResultSet, parentModelData.getOwner().getParent());
		},
		
		getChildResourceData: function(parentModelData, complexAttributeName){
			return this._serverGetChildResourceData(parentModelData, complexAttributeName);
		},
		getChildrenResourceData: function(parentModelData, complexAttributeNames){
			return this._serverGetChildrenResourceData(parentModelData, complexAttributeNames);
		},		
		_serverGetChildResourceData: function(parentModelData, complexAttributeName){
			return this._serverGetChildrenResourceData(parentModelData, [complexAttributeName]);
		},
		_serverGetChildrenResourceData: function(parentModelData, complexAttributeNames){
			var resourceRef = {remoteid: parentModelData.getRemoteId()};	
			
			return this._getSingleDataFromServerIfPossibleAndStore(resourceRef, parentModelData, complexAttributeNames);
		},
		
		/**  This function refreshes records that were created on the device.  It will also limit the number of records kept in the 
		 *    created querybase.  This limit is determned by the worklight.properties property 'si.device.createdLocallyLimit.  Once past the
		 *    limit, the oldest records that have been successfully sent to the server will either be removed from the device, if the record(s) 
		 *    only belongs to the created querybase, or will be removed from the created querybase. 
		 */
		_updateCreatedLocally: function(){
			var self = this;
			var deferred = new Deferred();
			//Query locally for records created on the device
			Logger.trace('[_updateCreatedLocally] querying locally for records created on device.');

			self._localQueryResourceDataFromStore(PlatformConstants.CREATED_QUERYBASE, null, 100).then(function(createdLocally){
				if (createdLocally && createdLocally.length > 0){
					Logger.trace('[_updateCreatedLocally] found ' + createdLocally.length+ ' created on the device.');
					//Has created records so check if over the limit
					var maxRecordsAllowed = SystemProperties.getProperty('si.device.createdLocallyLimit');
					if (maxRecordsAllowed == null || isNaN(maxRecordsAllowed)){
						maxRecordsAllowed = 10;  
					}
					Logger.trace('[_updateCreatedLocally] createdLocallyLimit is set to ' + maxRecordsAllowed);
					var countToDelete = 0;
					if (maxRecordsAllowed > 0 && createdLocally.length > maxRecordsAllowed){
						countToDelete = createdLocally.length - maxRecordsAllowed;
					}
					//Get the dcterms:identifier or resource identifier field but be used in creating the query to update the records
					var identifier = self._metadata.getFieldForRemoteName("dcterms:identifier");
					if (!identifier){
						identifier = self._metadata.getField("identifier");
					}
					var recsToRemove = [];
					var recsToUpdateQuerybases = [];
					var inWhereClause = '';
					arrayUtil.forEach(createdLocally, function(record){
						var data = record.json;
						var remoteID = data[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE];
						//Only remove or update records that are not changed or errored and have already been sent to the server
						if (remoteID.indexOf('http') == 0 && !data[PlatformConstants.ISCHANGED_ATTRIBUTE] && !data[PlatformConstants.ERRORED_ATTRIBUTE]){
							if (countToDelete > 0){
								//Check to see if this record belongs to more that just the created querybase.
								var currentQueryBases = data[PlatformConstants.QUERYBASES_LIST_ATTR];
								var newQueryBases = currentQueryBases.replace(new RegExp("<" + PlatformConstants.CREATED_QUERYBASE + ">", "g"), "");
								if (newQueryBases.length == 0){
									//Does not belong to any other querybases so remove the record from the device
									recsToRemove.push(record);
								}
								else{
									//Belongs to other querybases so update the querybases attribute and update the record on the device
									data[PlatformConstants.QUERYBASES_LIST_ATTR] = newQueryBases;
									recsToUpdateQuerybases.push(record);
								}
								countToDelete--;
							}
							else if (identifier){
								//Add identifer value to whereclause to be used to refresh the local record with the latest from the server
								var value = data[identifier.name];
								if (value){
									if (inWhereClause){
										inWhereClause += ',';
									}
									if (identifier.dataType === 'string'){
										inWhereClause += '"';
									}
									inWhereClause += value;
									if (identifier.dataType === 'string'){
										inWhereClause += '"';
									}
								}
							}
						}
					});
					var promises = [];
					if (recsToRemove.length > 0 || recsToUpdateQuerybases.length > 0){
						promises.push(StoreLock.lock(self._metadata.getResourceName(), function(){
							var lockDeferred = new Deferred();
							var storePromises = [];
							if (recsToRemove.length > 0){
								Logger.trace('[_updateCreatedLocally] will be removing ' + countToDelete + ' from the device');
								storePromises.push(PersistenceManager.remove(self._metadata, recsToRemove, true));
							}
							if (recsToUpdateQuerybases.length > 0){
								Logger.trace('[_updateCreatedLocally] will be removing ' + countToDelete + ' from the created querybase');
								storePromises.push(PersistenceManager.replace(self._metadata, recsToUpdateQuerybases, true));
							}
							all(storePromises).always(function(){
								lockDeferred.resolve();
							});
							return lockDeferred.promise;
						}));
					}

					if (inWhereClause.length > 0){
						inWhereClause = identifier.remoteName + " in [" + inWhereClause + "]";
						Logger.trace('[_updateCreatedLocally] is querying the server to update records. whereclause=' + inWhereClause);
						promises.push(self._getDataFromServerIfPossibleAndStore(PlatformConstants.CREATED_QUERYBASE, inWhereClause, maxRecordsAllowed));							
					}
					if (promises.length > 0){
						all(promises).always(function(){
							deferred.resolve();
						});
						return;
					}
				}
				deferred.resolve();
			}).otherwise(function(error){
				//Same error should show later
				Logger.log('[_updateCreatedLocally] error occurred querying for records created on the device.');
				deferred.resolve();
			});
			return deferred.promise;
		}

	});	
	return lang.extend(classBody, JsonTranslationMixin);
	
	
});
