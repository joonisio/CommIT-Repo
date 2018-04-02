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
 * This class allows one to write and read to/from map cache
 */
define("platform/map/MapCache",
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "platform/model/ModelService",
  "dojo/Deferred",
  "platform/logging/Logger"], 
function(declare, lang, ModelService, Deferred, Logger) {
	return declare(null, 
	{

		// cache on JsonStore
		/*ModelDataSet*/ _cache: null,
		
		/*
		 * resource: JSON array collection of the desired type to be showed on the map (i.e. workorder)
		 * providerUrl: url of the map provider (i.e. http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer)
		 * containerGeo: a JSONObject containing the container geometry to size the map
		 * specificParameters: JSONObject holding parameters specific
		 */
		constructor: function() {

		},


		/**@memberOf platform.map.MapCache
		 * Retrieve cache from jsonStore
		 * return a deferred ModelData of type mapDirectionsCache
		 */
		/* Promise of mapCache */ getCache: function() {
			var deferred = new Deferred();
			// retrieve from jsonStore
			ModelService.all("mapCache").then(lang.hitch(this, function(_deferred, mapCache) {
				// there is always only one record singleton=true on app.xml
				var cache = mapCache.getRecordAt(0);
				// convert to a plain jsonObject
				var result = {cacheId : cache.get("cacheId"), data : cache.get("data")};
				_deferred.resolve(result);
			}, deferred)).otherwise(function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},

		/*
		 * Put cache on jsonStore
		 */
		/* Promise */ setCache: function(/*JSONObject*/ jsonObject) {
			Logger.trace("_setCache received cacheId: " + jsonObject.cacheId);
			Logger.trace("_setCache received [cacheId]: " + jsonObject["cacheId"]);
			var deferred = new Deferred();
			// retrieve from jsonStore
			ModelService.all("mapCache").then(lang.hitch(this, function(_jsonObject, _deferred, mapCache) {
				Logger.trace("_setCache received cacheId: " + jsonObject.cacheId);
				Logger.trace("_setCache received [cacheId]: " + jsonObject["cacheId"]);
				var cache = mapCache.getRecordAt(0);
				if(_jsonObject.hasOwnProperty("cacheId")) {
					cache.set("cacheId", _jsonObject.cacheId);
				}
				else {
					cache.set("cacheId", "");
				}
				if(_jsonObject.hasOwnProperty("data")) {
					cache.set("data", _jsonObject.data);
				}
				else {
					cache.set("data", {});
				}

				var thatDeferred = deferred;
				
				ModelService.save(cache.getOwner()).then(function(){
					Logger.trace("cache saved: " + cache.get("cacheId") + " - " + cache.get("data"));
					thatDeferred.resolve();
				}).otherwise(function(error){
					Logger.trace("error saving cache: " + cache.get("cacheId") + " - " + cache.get("data") + " error: " + error);
					thatDeferred.reject(error);
				});
			}, jsonObject, deferred)).otherwise(function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},

	});
});
