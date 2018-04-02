
/* JavaScript content from js/platform/store/_DataCleanupService.js in folder common */
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

define("platform/store/_DataCleanupService",
["dojo/_base/lang",
 "dojo/_base/array",
 "dojo/promise/all",
 "dojo/Deferred", 
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "platform/store/SystemProperties",
 "platform/attachment/FileService",
 "platform/attachment/AttachmentService",
 "platform/store/StoreLock"], 
function(lang, arrayUtil, all, Deferred, PlatformConstants, Logger, SystemProperties, FileService,AttachmentService, StoreLock){
	"use strict";
	
	//Due to circular reference: PersistenceManager => _DataCleanupService => PersistenceManager
	var PersistenceManager = null;
	var UserAuthenticationManager = null;
	require(["platform/store/PersistenceManager", "platform/auth/UserAuthenticationManager"], function(PM, UAM) {
		PersistenceManager = PM;
		UserAuthenticationManager = UAM;
	});
	
	var CLEANUP_TOKEN_ATTR = PlatformConstants.CLEANUP_TOKEN_ATTR;
	var ORIGINAL_STATE_ATTRIBUTE = PlatformConstants.ORIGINAL_STATE_ATTRIBUTE;
	var QUERYBASES_LIST_ATTR = PlatformConstants.QUERYBASES_LIST_ATTR;
	
	return {
		
/**@memberOf platform.store._DataCleanupService */
		_getSystemPropertyKey: function(params) {
			var resourceName = params.resourceName;
			var queryBase = params.queryBase;
			
			return 'currentCleanupToken::' + resourceName + '::' + queryBase;
		},
		
		renewCleanupToken: function(params) {
			var	currentId = this._getCurrentCleanupTokenId(params);
			var	newId = (currentId == null) ? 0 : currentId + 1;
			var propKey = this._getSystemPropertyKey(params);
			SystemProperties.setProperty(propKey, newId, true);			
		},
		
		_getCurrentCleanupTokenId: function(params) {
			var propKey = this._getSystemPropertyKey(params);
			return SystemProperties.getProperty(propKey);
		},
		
		_getCurrentCleanupToken: function(params) {
			var	currentId = this._getCurrentCleanupTokenId(params);
			return '<' + params.queryBase + '::' + currentId + '>';
		},
		
		_getExpiredCleanupTokens: function(params) {
			var propKey = this._getSystemPropertyKey(params);
			var	currentId = SystemProperties.getProperty(propKey);
			
			var result = [];
			var previousId =  (params.removeQuery ? currentId :(currentId == null && -1 || currentId-1));
			//take the last 20 tokens to clean up
			for (var i = previousId-20; i <= previousId; i++){
				if (i >= 0){
					result.push('<' + params.queryBase + '::' + i + '>');
				}
			}
			return result;
		},
		
		_createQueryForUnchangedRecordsWithExpiredCleanupToken: function(params) {
			var cleanupTokens = this._getExpiredCleanupTokens(params);
			return arrayUtil.map(cleanupTokens, function(cleanupToken){
				var result = {};
				result[CLEANUP_TOKEN_ATTR] = cleanupToken;
				//When an attribute is persisted as null, JSONStore indexes it as a string
				//so need to search null as a string.
				//We're filtering records that has a original state as they're modified
				//and modified records should not be removed from device
				result[ORIGINAL_STATE_ATTRIBUTE] = 'null';
				return result;
			});
		},		
		
		updateCleanupTokenOnRecord: function(params){
			if (!params.queryBase){
				return;
			}
			var record = params.record;
			if (params.renewToken){
				this.renewCleanupToken(params);
			}
			
			var newCleanupToken = this._getCurrentCleanupToken(params);
			var cleanupTokenRegExp = '<' + params.queryBase + '::\\d+>';
			var recordHasCleaupToken = (record[CLEANUP_TOKEN_ATTR] || '').match(cleanupTokenRegExp);
			
			if (recordHasCleaupToken){
				record[CLEANUP_TOKEN_ATTR] = record[CLEANUP_TOKEN_ATTR].replace(new RegExp(cleanupTokenRegExp, 'g'), newCleanupToken);
			} else {
				record[CLEANUP_TOKEN_ATTR] = (record[CLEANUP_TOKEN_ATTR] || '') + newCleanupToken;
			}			
		},
		
		_removeCleanupTokenFromRecord: function(params) {
			var record = params.record;
			
			var currentCleanupTokens = record.json[CLEANUP_TOKEN_ATTR];
			var cleanupTokenRegExp = '<' + params.queryBase + '::\\d+>';
			var newCleanupTokens = currentCleanupTokens.replace(new RegExp(cleanupTokenRegExp, 'g'), '');
			record.json[CLEANUP_TOKEN_ATTR] = newCleanupTokens;
		},
		
		_removeQueryBaseFromRecord: function(params) {
			var record = params.record;
			var queryBase = params.queryBase;
			
			var currentQueryBases = record.json[QUERYBASES_LIST_ATTR];
			var newQueryBases = currentQueryBases.replace(new RegExp("<" + queryBase + ">", "g"), "");
			record.json[QUERYBASES_LIST_ATTR] = newQueryBases;
		},
		
		performDataCleanup: function(params){
			var performDataCleanupLogKey = "[CLEANUP] _DataCleanupService - performDataCleanup - Records cleanup";
			Logger.timerStart(performDataCleanupLogKey);
			var metadata = params.metadata;
			var resourceName = metadata.name;
			var queryBase = params.queryBase;
			var removeQuery = null;
			if (params.removeQuery != undefined)
				removeQuery = params.removeQuery;

			
			var query = this._createQueryForUnchangedRecordsWithExpiredCleanupToken({
				resourceName: resourceName,
				queryBase: queryBase,
				removeQuery: removeQuery
			});
			
			var self = this;
			if (!lang.isArray(query) || query.length == 0){
				var deferred = new Deferred();
				deferred.resolve();
				return deferred.promise; 
			}

			return StoreLock.lock(resourceName, function(){
				
				var lockDeferred = new Deferred();
				
				PersistenceManager.find(query, metadata, queryBase).
				then(function(recordSet){
					var recordsToDelete = [];
					var recordsToUpdate = [];

					arrayUtil.forEach(recordSet, function(record){
						var recParams = {
							record: record,
							resourceName: resourceName,
							queryBase: queryBase
						};
						
						self._removeQueryBaseFromRecord(recParams);
						self._removeCleanupTokenFromRecord(recParams);
						
						var hasOtherQueryBases = record.json[QUERYBASES_LIST_ATTR].indexOf('<') > -1;
						if (hasOtherQueryBases){
							recordsToUpdate.push(record);
						} else {
							recordsToDelete.push(record);
						}
					});

					var promises = [];
					if (recordsToUpdate.length > 0){
						promises.push(PersistenceManager.replace(metadata, recordsToUpdate));
					}
					if (recordsToDelete.length > 0){
//						promises.push(PersistenceManager.remove(metadata, recordsToDelete));
						//if(WL.Client.getEnvironment()!=WL.Environment.PREVIEW){
							 var attachmentsCleanupPromise = self._cleanupAttachmentsFromAllRecords(recordsToDelete, metadata);
							 promises.push(attachmentsCleanupPromise.always(function(){
								Logger.trace("Attachments removed no removing records.  Count: " + recordsToDelete.length);
							 	return PersistenceManager.remove(metadata, recordsToDelete);
							 }));
						//}
						/*else{
							promises.push(PersistenceManager.remove(metadata, recordsToDelete));
						}*/
					}
					return all(promises).always(function() {
						if (recordsToUpdate.length > 0 || recordsToDelete.length > 0){
							Logger.trace("Attachments and records removed.");
							PersistenceManager._notifyNewDataReceivedOrDataRemoved(metadata.getResourceName());
							Logger.timerEnd(performDataCleanupLogKey);
						}
						
						lockDeferred.resolve();
					});
				});
				
				return lockDeferred.promise;
				
			});
		},
		
		
		_cleanupAttachmentsFromAllRecords: function(records, metadata){
			var deferred = new Deferred();
			var cleanupPromises = [];
			arrayUtil.forEach(records, function(record){
				var attachmentContainerAttrs = metadata.getAttachmentContainerComplexAttributes('name');
				arrayUtil.forEach(Object.keys(attachmentContainerAttrs), function(attr){
					var attachments = record.json[attr];
					if (attachmentContainerAttrs[attr] === true &&
							lang.isArray(attachments) &&
							attachments.length > 0){
						//The record has attachments.  Loop thru each attachment record and see if the attachment has been downloaded
						var deleteDeferred = new Deferred();
						cleanupPromises.push(deleteDeferred.promise);
						var deletePromises = new Array();
						//Need to loop thru instead of deleting directory just in case the file
						//may not reside in the record defined directory
						arrayUtil.forEach(attachments, function(attachment){
							var downloadLocation = attachment[PlatformConstants.ATTACH_LOCATION_ATTR];
							//Check to see if attachment was downloaded.  
							if (downloadLocation && downloadLocation.length > 0){
								var deletePromise = FileService.removeWithPromise(downloadLocation);
								deletePromises.push(deletePromise);
								deletePromise.otherwise(function(err){
									Logger.error(err);
								});
							}
						});
						all(deletePromises).always(function(){
							//Since the record no longer is on the device, delete it's attachment directory
							FileService.baseDirectoryForWithPromise(UserAuthenticationManager._getCurrentUser(), metadata.getResourceName(), AttachmentService.getOwnerRecordIdentifier(record,metadata), false).
							then(function(directoryInfo){
								FileService.removeDirectoryWithPromise(directoryInfo.fullPath).then(function(){
									deleteDeferred.resolve();
								});
							}).otherwise(function(err){
								Logger.error(err);
								deleteDeferred.resolve();
							});								
						});
					};
				});
			});
			all(cleanupPromises).always(function(){
				deferred.resolve();
			});

			return deferred.promise;
		}
	};
	
});
