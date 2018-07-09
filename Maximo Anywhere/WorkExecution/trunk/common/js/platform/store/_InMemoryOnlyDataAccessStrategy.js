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

define("platform/store/_InMemoryOnlyDataAccessStrategy",
["dojo/_base/declare",
 "dojo/_base/array",
 "dojo/Deferred"], 
function(declare, arrayUtil, Deferred) {
	var promisedValue = null;
		
	function createBlankRecord(metadata){
		var blankRecord = {_id:0, json:{}};
		arrayUtil.forEach(metadata.fields, function(field){
			blankRecord['json'][field.name] = null;
		});
		return blankRecord;
	}	
	/**@class platform.store._InMemoryOnlyDataAccessStrategy */
	return declare("", null, {
		_metadata: null,
		
		constructor: function(metadata){
			var deferred = new Deferred();
			var jsonArray = [createBlankRecord(metadata)];
			deferred.resolve(jsonArray);
			promisedValue = deferred.promise;
		},
		
        /**@memberOf platform.store._InMemoryOnlyDataAccessStrategy */
		getAllResourceData: function(queryBases){
			return promisedValue;
		},
		
		queryResourceData: function(queryBase, query){
			return promisedValue;
		},
		
		getResourceById: function(resourceid){
			return promisedValue;
		},
		
		getResourceByRef: function(resourceRef){
			return promisedValue;
		},
		
		getChildResourceData: function(modelData, complexAttributeName){
			var deferred = new Deferred();
			deferred.resolve([]);
			return deferred.promise;
		},
	});
});
