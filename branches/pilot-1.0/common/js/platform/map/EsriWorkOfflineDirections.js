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

/**
 * createdBy: lcassa@br.ibm.com 
 * 
 * This class represents its peer on the java side EsriWorkOfflineDirections
 */
define("platform/map/EsriWorkOfflineDirections",
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/map/WorkOfflineDirections",
  "platform/map/nativeBridge/WorkOfflineNativeBridgeHelper",
  "platform/logging/Logger"], 
function(declare, lang, Deferred, WorkOfflineDirections, WorkOfflineNativeBridgeHelper, Logger) {
	/** @class platform.map.EsriWorkOfflineDirections */
	return declare(WorkOfflineDirections, 
	{
		_bridge: null,
		_mapType: "esri",

		constructor: function() {
			this._bridge = new WorkOfflineNativeBridgeHelper(this);
		},

		/** @memberOf platform.map.EsriWorkOfflineDirections
		 * Clean up a ModelDataSet and return a JSONArray containing only the
		 * plain values of the resource
		 */
		/*JSONArray*/ cleanResource: function(/*ModelDataSet*/ resource) {
			// specify fields to be excluded if any
			excludeFields = [""];
			var array = [];
			// remove unecessary entries from the resource
			for(index in resource) {
		    	var record = resource[index];
		    	var filteredJson = {};
		    	for (name in record) {
					var value = record[name];
					if(!lang.isFunction(value) && !lang.isObject() && typeof value !== 'object' && excludeFields.indexOf(name) === -1 && (!name.match(/^_/) || name.match("_id"))) {
						filteredJson[name] = value;
					}
		    	}
		    	array.push(filteredJson);
		    }
		    return array;
		},

		/*
		 * jsonArray, usually a resource to be prepared to be cached
		 */
		/*JSONArray (Promise)*/ getDirectionsToCache: function(/*JSONArray*/ jsonArray, /*JSONObject*/ additionalParameters) {
			// cleanup the resource from uninteresting data
			resource = this.cleanResource(jsonArray);
			Logger.trace("[platform.map.EsriWorkOfflineDirections] calling getDirectionsToCache " + JSON.stringify(jsonArray));
			var deferred = new Deferred();

			// build jsonObject to bridge to native
			this._bridge.request([jsonArray, additionalParameters], deferred);
			
			return deferred.promise;
		},

		/*
		 * Return the mapType of this WorkOfflineDirections child class
		 */
		getMapType: function(/*String*/ mapType) {
			return this._mapType;
		},

		
		/*
		 * Need to provide map properties to the java side
		 */
		/*Promise*/ sendMapProperties: function(jsonObject){
			var deferred = new Deferred();
			this._bridge.request(jsonObject, deferred);
			return deferred.promise;
		}

	});
});
