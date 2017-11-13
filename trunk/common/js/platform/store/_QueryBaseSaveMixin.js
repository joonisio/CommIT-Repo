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

define("platform/store/_QueryBaseSaveMixin",
["dojo/_base/array",
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "platform/util/runOrRejectWithError",
 "platform/store/_JSONStoreSyncProcessor",
 "platform/store/StoreLock",
 "dojo/Deferred",
 "platform/store/_DataCleanupService"], 
function(arrayUtil, PlatformConstants, Logger, runOrRejectWithError, JSONStoreSyncProcessor, StoreLock, Deferred, DataCleanupService){
	
	var REMOTEID_ATTR = PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE;
	var ORIGINAL_STATE_ATTRIBUTE = PlatformConstants.ORIGINAL_STATE_ATTRIBUTE;
	var QUERYBASES_LIST_ATTR = PlatformConstants.QUERYBASES_LIST_ATTR;
		
	function generateQueryToFindExistingRecords(dataArray) {
		return arrayUtil.map(dataArray, function(data){
			var result = {};
			var remoteid = data[REMOTEID_ATTR];
			result['exact' + REMOTEID_ATTR] = "@--" + remoteid + "--@";
			return result;
		});
	}
	
	return {
		
/**@memberOf platform.store._QueryBaseSaveMixin */
		_updateRecordsForAdd: function(dataArray, metadata, queryBase){
			var queryBaseValue = '<' + queryBase + '>';
			var lastUpdatedDateTime = new Date().toISOString();
			arrayUtil.forEach(dataArray, function(record){
				record[QUERYBASES_LIST_ATTR] = queryBaseValue;
				record[PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE] = lastUpdatedDateTime;
				record[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = 'null';
				DataCleanupService.updateCleanupTokenOnRecord({
					record: record,
					resourceName: metadata.name,
					queryBase: queryBase, 
					renewToken: false
				});
			});
			dataArray = null;
			metadata = null;
		},

		_synchronizeDataInJSONStore: function(dataArray, metadata, queryBase, renewCleanupToken){
			return runOrRejectWithError(this, function() {
				var self = this;
				var resourceName = metadata.getResourceName();
				var lastUpdatedDateTime = new Date().toISOString();

				var _handleQueryBaseSaveLogKey = "_QueryBaseSaveMixin - _handleQueryBaseSave - " + resourceName;
				Logger.timerStart(_handleQueryBaseSaveLogKey);
				
				var findExistingRecordsQuery = generateQueryToFindExistingRecords(dataArray);
				
				var queryForChangedRecordsOfQueryBase = {};
				//Do a like search for "{" as this char is part of a JSON.stringify() of the record
				queryForChangedRecordsOfQueryBase[ORIGINAL_STATE_ATTRIBUTE] = "{";
				if (queryBase) {
					queryForChangedRecordsOfQueryBase[QUERYBASES_LIST_ATTR] = "<" + queryBase + ">";
				}
				
				findExistingRecordsQuery.push(queryForChangedRecordsOfQueryBase);
				
				var findExistingInStoreLogKey = "_QueryBaseSaveMixin - _handleQueryBaseSave - find existing records in jsonstore - " + resourceName;
				Logger.timerStart(findExistingInStoreLogKey);
				return StoreLock.lock(resourceName, function(){
					
					var returnDeferred = new Deferred();
					
					self.find(findExistingRecordsQuery, metadata).
					then(function(resultSet) {
						Logger.timerEnd(findExistingInStoreLogKey);
						
						var jsonStore = self._getStore(resourceName);				
						
						var processor = new JSONStoreSyncProcessor({
							jsonStoreResultSet: resultSet,
							resourceName: resourceName,
							queryBase: queryBase,
							lastUpdatedDateTime: lastUpdatedDateTime,
							dataArrayFromOSLC: dataArray,
							jsonStore: jsonStore,
							metaData: metadata,
							'renewCleanupToken' : !(renewCleanupToken === false)
						});
						
						processor.updateQueryBaseListInExistingRecords();
						processor.findNonExistingAndMergeExistingRecords();
						
						var processorPromise = processor.processUpdatesInJSONStore();
						processorPromise.then(function() {
							if (processor.recordsToUpdate.length > 0){
								self._notifyDataUpdate(resourceName, processor.recordsToUpdate);
							}
							if(processor.recordsToInsert.length > 0){
								self._notifyNewDataReceivedOrDataRemoved(resourceName);
							}
							Logger.timerEnd(_handleQueryBaseSaveLogKey);
							
							returnDeferred.resolve();
						});
						processorPromise.otherwise(function(error) {
							Logger.timerEnd(_handleQueryBaseSaveLogKey);
							
							returnDeferred.reject(error);
						});
						
					});
					
					return returnDeferred.promise;
				});
			});
		}		
		
	};
});
