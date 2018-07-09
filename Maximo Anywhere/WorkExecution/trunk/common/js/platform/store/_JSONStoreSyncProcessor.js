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

define("platform/store/_JSONStoreSyncProcessor",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "dojo/Deferred",
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "platform/store/SystemProperties",
 "platform/store/_DataCleanupService",
 "platform/attachment/FileService",
 "platform/attachment/AttachmentService",
 "platform/store/PersistenceManager"],
function(declare, lang, arrayUtil, Deferred, PlatformConstants, Logger, SystemProperties, DataCleanupService, FileService, AttachmentService, PersistenceManager){
	
	var REMOTEID_ATTR = PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE;
	var QUERYBASES_ATTR = PlatformConstants.QUERYBASES_LIST_ATTR;

	var UserAuthenticationManager = null;
	require(["platform/auth/UserAuthenticationManager"], function(UAM) {
		UserAuthenticationManager = UAM;
	});

	function mergeExistingWithRemote(existingRecord, remoteRecord, metaData, lastUpdatedDateTime){
		// for quick responses from the server - see 102544
		if(existingRecord.json[PlatformConstants.LOCAL_VERSION_WINS] === true){
			existingRecord.json[PlatformConstants.LOCAL_VERSION_WINS] = false;
			
		} else {
			
			// if remoteRecord has stuff to ignore merge because we are trying to 
			// merge a lowest level child, take that information into account.
			// If such information exists via a flag (PlatformConstants.DONOT_MERGE_THIS_LEVEL), 
			// remove it, so it is not treated as an attribute.
			var ignoreMergingThisLevelOnly = false;
			if (remoteRecord[PlatformConstants.DONOT_MERGE_THIS_LEVEL])
			{
				ignoreMergingThisLevelOnly = remoteRecord[PlatformConstants.DONOT_MERGE_THIS_LEVEL];
				delete remoteRecord[PlatformConstants.DONOT_MERGE_THIS_LEVEL];
			}
			
			var fieldNamesList = Object.keys(remoteRecord);
			var currentRecordData = existingRecord.json;
			var attachmentContainerAttrs = metaData.getAttachmentContainerComplexAttributes('name');
			arrayUtil.forEach(fieldNamesList, function(fieldName){
				var currentFieldValue = currentRecordData[fieldName];
				var newFieldValue = remoteRecord[fieldName];
				
				if (lang.isArray(newFieldValue)){
					arrayUtil.forEach(newFieldValue, function(value){
						value[PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE] = lastUpdatedDateTime;
					});
				}

				if (lang.isArray(newFieldValue) || newFieldValue === PlatformConstants.EMPTY_COMPLEX_FIELD){
					if (!currentRecordData[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE]){
						currentRecordData[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE] = {};
					}
					currentRecordData[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE][fieldName] = true;
				}
				if (newFieldValue || !lang.isArray(currentFieldValue)){
					newFieldValue = (newFieldValue === PlatformConstants.EMPTY_COMPLEX_FIELD && [] || newFieldValue);

					function deepMerge(originalRecordArray, newRecordArray, ignoreMergingThisLevelOnly, childMetaData){
						originalRecordArray = (lang.isArray(originalRecordArray) && originalRecordArray || []);

						var finalOriginalRecordMergedList = new Array();
						if (ignoreMergingThisLevelOnly == true)
						{
							finalOriginalRecordMergedList = originalRecordArray;
						}
						
						arrayUtil.forEach(originalRecordArray, function(originalRecord, originalIndex) {
							
							var originalRecordRemoteId = originalRecord[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE];
							
							// check for a remoteid match and add them to the finalOriginalRecordMergedList
							if (arrayUtil.some(newRecordArray, function(newRecord, index){
								if (originalRecordRemoteId == newRecord[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE]){

									var ignoreMergingThisChildLevelOnly = false;
									if (newRecord[PlatformConstants.DONOT_MERGE_THIS_LEVEL])
									{
										ignoreMergingThisChildLevelOnly = newRecord[PlatformConstants.DONOT_MERGE_THIS_LEVEL];
										delete newRecord[PlatformConstants.DONOT_MERGE_THIS_LEVEL];
									}

									
									arrayUtil.forEach(Object.keys(newRecord), function(newRecordKey){
										
										var originalKeyValue = originalRecord[newRecordKey];
										var newRecordKeyValue = newRecord[newRecordKey];
											
										if (originalKeyValue){
											// If the new record is an array, call deep merge to get the data to merge
											if (lang.isArray(newRecordKeyValue) && childMetaData != null)
											{
												originalRecord[newRecordKey] = deepMerge(originalKeyValue, newRecordKeyValue, ignoreMergingThisChildLevelOnly, (childMetaData?childMetaData.getChildMetaData(newRecordKey):null));
											}
											else 
											{
												originalRecord[newRecordKey] = newRecordKeyValue;
											}
										}
										else
										{
											originalRecord[newRecordKey] = newRecordKeyValue;
										}
									});
									if (childMetaData){
										arrayUtil.forEach(Object.keys(originalRecord), function(originalRecordKey){
											var field = childMetaData.getField(originalRecordKey);
											if (field && !field.local && newRecord[originalRecordKey] != false && !newRecord[originalRecordKey]){
												delete originalRecord[originalRecordKey];
											}
										});
									}
									
									newRecordArray.splice(index,1);
									return true; 
								}
								return false; 
							}))
							{
								if (ignoreMergingThisLevelOnly == false)
								{
									finalOriginalRecordMergedList.push(originalRecord);
								}
							}
							else if(originalRecord._isChanged)
							{
								if (ignoreMergingThisLevelOnly == false)
								{
									finalOriginalRecordMergedList.push(originalRecord);
								}
							}

							
						});
							
						// Add new records that are remaining.
						arrayUtil.forEach(newRecordArray, function(newRecord){
							finalOriginalRecordMergedList.push(newRecord);
						});
						
						return finalOriginalRecordMergedList;
					}

					if (Logger.level >= 2){
						var currentCount = (lang.isArray(currentFieldValue) ? currentFieldValue.length : 0 );
						var newCount = (lang.isArray(newFieldValue) ? newFieldValue.length : 0 );
						if (currentCount != newCount){
							Logger.trace("Merging in a different number of child records for " + metaData.getResourceName()+"." + fieldName +  ". Current: "  
									+ (currentCount == 0? "[]": JSON.stringify(currentFieldValue)) + " New: " + (newCount == 0? "[]": JSON.stringify(newFieldValue)));
						}
					}
					if( attachmentContainerAttrs[fieldName] === true &&
							currentFieldValue && lang.isArray(currentFieldValue) && currentFieldValue.length > 0){
						//This is a list of attachments.  Need to handle these differently to remove downloaded files.
						var removeDirectory = false;
						if (newFieldValue && lang.isArray(newFieldValue) && newFieldValue.length > 0){
							var attachmentList = new Array();
							arrayUtil.forEach(currentFieldValue, function(originalRecord, index){
								var originalData = (originalRecord.json?originalRecord.json:originalRecord);
								var remoteid = originalData[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE];
								if (arrayUtil.some(newFieldValue, function(newRecord, index){
									if (remoteid == newRecord[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE]){
										arrayUtil.forEach(Object.keys(newRecord), function(newRecordKey){
											if (originalData[newRecordKey]){
												originalData[newRecordKey] = newRecord[newRecordKey];
											}
										});
										newFieldValue.splice(index,1);
										return true; 
									}
									return false; 
								})){
									attachmentList.push(originalRecord);
								}
								else{
									if(originalRecord._isChanged){
										attachmentList.push(originalRecord);
									} else {
										var downloadLocation = originalData[PlatformConstants.ATTACH_LOCATION_ATTR];
										if (downloadLocation && downloadLocation.length > 0){
											Logger.log("Going to remove file " + downloadLocation); //TODO using logging
											FileService.removeWithPromise(downloadLocation).then(function(){
												Logger.log("Removed file " + downloadLocation); //TODO using logging
											}).otherwise(function(err){
												Logger.error("Error removing file " + downloadLocation + JSON.stringify(err)); //TODO using logging
											});
										}
										
									}
								}
							});
							arrayUtil.forEach(newFieldValue, function(newRecord){
								attachmentList.push(newRecord); 
							});
							currentRecordData[fieldName] = attachmentList;
							removeDirectory = (attachmentList.length == 0);
						}
						else{
							var attachmentList = new Array();
							arrayUtil.forEach(currentFieldValue, function(originalRecord){
								if (currentRecordData._isChanged){
									attachmentList.push(originalRecord);
								}
								else{
									var originalData = (originalRecord.json?originalRecord.json:originalRecord);
									var downloadLocation = originalData[PlatformConstants.ATTACH_LOCATION_ATTR];
									if (downloadLocation && downloadLocation.length > 0){
										FileService.removeWithPromise(downloadLocation).then(function(){
										}).otherwise(function(err){
											Logger.error("Error removing file " + downloadLocation + JSON.stringify(err)); 
										});
									}
								}
							});
							currentRecordData[fieldName] = attachmentList;
							removeDirectory = (attachmentList.length == 0);
						}
						if (removeDirectory){
							FileService.baseDirectoryForWithPromise(UserAuthenticationManager._getCurrentUser(), metaData.getResourceName(), AttachmentService.getOwnerRecordIdentifier(existingRecord,metaData), false).
							then(function(directoryInfo){
								if (directoryInfo){
									Logger.trace("Attempting to delete directory: " + directoryInfo.fullPath);
								}
								FileService.removeDirectoryWithPromise(directoryInfo.fullPath).then(function(){
									Logger.trace("Directory removed: "  + directoryInfo.fullPath);
								});
							}).otherwise(function(err){
								Logger.error("Attempting to delete directory errored: ");
								Logger.error(err);
							});								
						}
					}
					else if (lang.isArray(newFieldValue)){
						//This will prevent child local attributes from being overriden
						currentRecordData[fieldName] = deepMerge(currentRecordData[fieldName], newFieldValue, ignoreMergingThisLevelOnly, metaData.getChildMetaData(fieldName));

					} else {
						currentRecordData[fieldName] = newFieldValue;
					}												
				}
			});
		}
	}
				
	return declare(null, {
		recordsToInsert: null,
		recordsToUpdate: null,
		existingRecordsByRemoteId: null,
		jsonStoreResultSet: null,
		resourceName: null,
		queryBase: null,
		queryBaseAsExactValue: null,
		lastUpdatedDateTime: null,
		dataArrayFromOSLC: null,
		jsonStore: null,
		metaData: null,
		renewCleanupToken: null,
		
		constructor: function(params) {
			lang.mixin(this, params);
			
			if (this.queryBase){
				this.queryBaseAsExactValue = '<' + this.queryBase + '>';
			}

			this.recordsToInsert = [];				
			this.recordsToUpdate = [];
			this.existingRecordsByRemoteId = {};
		},
		
/**@memberOf platform.store._JSONStoreSyncProcessor */
		updateExistingRecordsInJSONStore: function(callback) {
			this.metaData.checkIfOverTheDataLimit(this.recordsToUpdate,true);
			
			if (this.recordsToUpdate.length > 0){
				var updatingExistingRecsInJsonstore = "_QueryBaseSaveMixin - _handleQueryBaseSave - separate new from existing records and merge existing ones - " + this.resourceName;
				Logger.timerStart(updatingExistingRecsInJsonstore);
				Logger.trace('[DATA] Updating existing records in cache');
				return PersistenceManager._asDojoPromise(this.jsonStore.replace(this.recordsToUpdate, { push: false }));
			}
			return new Deferred().resolve();
		},
		
		insertNewRecordsInJSONStore: function() {
			this.metaData.checkIfOverTheDataLimit(this.recordsToInsert,false);
			
		
			if (this.recordsToInsert.length > 0){
				var insertingNewRecsInJsonstore = "_QueryBaseSaveMixin - _handleQueryBaseSave - inserting new records in jsonstore - " + this.resourceName;
				Logger.timerStart(insertingNewRecsInJsonstore);
				Logger.trace('[DATA] Caching new records');
				return PersistenceManager._asDojoPromise(this.jsonStore.add(this.recordsToInsert, { push: false }));
			}
			return new Deferred().resolve();
		},
		
		_updateCleanupTokenOnRecordsBeforeSave: function() {
			var timerKey = "_JSONStoreSyncProcessor - _updateCleanupTokenOnRecordsBeforeSave";
			Logger.timerStart(timerKey);
			var shouldRenewCleanupToken = !(this.renewCleanupToken === false);  //Just in case it's null or undefined the default is true
			arrayUtil.forEach(this.recordsToInsert, function(record){
				DataCleanupService.updateCleanupTokenOnRecord({
					record: record,
					resourceName: this.resourceName,
					queryBase: this.queryBase, 
					renewToken: shouldRenewCleanupToken
				});
				shouldRenewCleanupToken = false;	
			}, this);
			arrayUtil.forEach(this.recordsToUpdate, function(record){
				DataCleanupService.updateCleanupTokenOnRecord({
					record: record.json,
					resourceName: this.resourceName,
					queryBase: this.queryBase, 
					renewToken: shouldRenewCleanupToken
				});
				shouldRenewCleanupToken = false;	
			}, this);
			Logger.timerEnd(timerKey);
		},
		
		findNonExistingAndMergeExistingRecords: function() {
			var separateNewFromExistingAndMergeLogKey = "_QueryBaseSaveMixin - _handleQueryBaseSave - separate new from existing records and merge existing ones - " + this.resourceName;
			Logger.timerStart(separateNewFromExistingAndMergeLogKey);

			//=== Find non-existing records and merge existing ones
			arrayUtil.forEach(this.dataArrayFromOSLC, function(record) {
				var remoteid = record[REMOTEID_ATTR];
				var existingRecordInfo = this.existingRecordsByRemoteId[remoteid];

				var recordToUpdate = null;
				if (existingRecordInfo){
					recordToUpdate = existingRecordInfo.record.json;
				} else {
					recordToUpdate = record;
				}
				
				if (this.queryBase){
					//Initialize _originalState as null if not existing so
					//we can find unchanged records
					var ORIGINAL_STATE_ATTRIBUTE = PlatformConstants.ORIGINAL_STATE_ATTRIBUTE;
					recordToUpdate[ORIGINAL_STATE_ATTRIBUTE] = (recordToUpdate[ORIGINAL_STATE_ATTRIBUTE] || 'null'); 
				}
				
				if(!existingRecordInfo){
					record[PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE] = this.lastUpdatedDateTime;
					
					if (this.queryBase && (!record[QUERYBASES_ATTR] || record[QUERYBASES_ATTR].indexOf(this.queryBaseAsExactValue) === -1)){
						if (!record[QUERYBASES_ATTR]){
							record[QUERYBASES_ATTR] = '';
						}
						record[QUERYBASES_ATTR] += this.queryBaseAsExactValue;
					}
					this.recordsToInsert.push(record);
					
				} else if (existingRecordInfo.willBeMergedWithServerVersion){
					var existingRecord = existingRecordInfo.record;
					mergeExistingWithRemote(existingRecord, record, this.metaData, this.lastUpdatedDateTime);
					existingRecord.json[PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE] = this.lastUpdatedDateTime;
				}
			}, this);
			Logger.timerEnd(separateNewFromExistingAndMergeLogKey);
		},
		
		updateQueryBaseListInExistingRecords: function() {
			var updateQBInExistingLogKey = "_QueryBaseSaveMixin - _handleQueryBaseSave - update querybase list in existing record - " + this.resourceName;
			Logger.timerStart(updateQBInExistingLogKey);
			//=== Update queryBase list in existing records
			arrayUtil.forEach(this.jsonStoreResultSet, function(record) {
				var remoteid = record.json[REMOTEID_ATTR];
				var existingRecordInfo = {
					record: record,
					willBeMergedWithServerVersion: true
				};
				this.existingRecordsByRemoteId[remoteid] = existingRecordInfo;
				this.recordsToUpdate.push(record);
												
				if (this.queryBase){
					if (!record.json[QUERYBASES_ATTR]){
						record.json[QUERYBASES_ATTR] = this.queryBaseAsExactValue;
						
					} else if (record.json[QUERYBASES_ATTR].indexOf("<"+this.queryBase+">") == -1){
						record.json[QUERYBASES_ATTR] += this.queryBaseAsExactValue;
					}
				}
				
				// 108161 - Do not merge records with server response if they have modifications in remote attributes
				if (record.json[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] && record.json[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE]!='null'){
					existingRecordInfo.willBeMergedWithServerVersion = false;
				}
				
			}, this);
			Logger.timerEnd(updateQBInExistingLogKey);
		},
		
		processUpdatesInJSONStore: function() {
			this._updateCleanupTokenOnRecordsBeforeSave();
			
			var deferred = new Deferred();
			var self = this;
			var insertError = null;
			this.insertNewRecordsInJSONStore().otherwise(function(error){
				insertError = error;
			}).always(function () {
				self.updateExistingRecordsInJSONStore().then(function(){
					if (insertError != null){
						deferred.reject(insertError);
					}
					else{
						deferred.resolve();
					}
				}).otherwise(function (error) {
					deferred.reject(error);
				});
			});
			
			return deferred.promise;
		}
	});
});
