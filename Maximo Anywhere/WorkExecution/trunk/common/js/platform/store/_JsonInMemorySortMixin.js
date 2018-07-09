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

define("platform/store/_JsonInMemorySortMixin", 
["dojo/_base/lang",
 "dojo/Deferred",
 "dojo/data/ObjectStore",
 "dojo/store/Memory"
], 
function(lang, Deferred, ObjectStore, Memory){
	
	return {
/**@memberOf platform.store._JsonInMemorySortMixin */
		sort: function(wlJsonFindResult, dojoRequest) {
			var objectStore = this._convertWLJsonInJsonRest(wlJsonFindResult);
			var dataStore = new ObjectStore({objectStore: objectStore});
			var deferred = new Deferred();
			dojoRequest.onComplete = function(sortedArray, request) {
				deferred.resolve(sortedArray);
			};
			dataStore.fetch(dojoRequest);
			return deferred.promise;
		},
		
		_convertWLJsonInJsonRest: function(wlJsonArray) {
			data = [];
			for(var i = 0; i < wlJsonArray.length; i++) {
				var wlJson = wlJsonArray[i]['json'];
				// put the '_id' inside the wlJson
				wlJson.id = wlJsonArray[i]['_id'];
				data.push(wlJson);
			}
			var memoryStore = new Memory({data: data});
			return memoryStore;
		},
		
		_convertJsonRestToWLJson: function(jsonRest) {
			var wlJson = {};
			wlJson._id = jsonRest.id;
			wlJson.json = {};
			for(member in jsonRest) {
				if(member != 'id') {
					wlJson.json[member] = jsonRest[member];
				}
			}
			return wlJson;
		}
		
	};
});
