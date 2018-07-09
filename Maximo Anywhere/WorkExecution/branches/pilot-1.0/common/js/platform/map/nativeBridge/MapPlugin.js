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
 * This class is responsible for communicating with the Java side MapPlugin
 */
define("platform/map/nativeBridge/MapPlugin", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "platform/model/ModelService",
  "platform/logging/Logger"], 
function(declare, lang, ModelService, Logger) {
	/** @class platform.map.nativeBridge.MapPlugin */
	var MapPlugin = {
		service: "MapPlugin",
		
		/**@methodOf MapPlugin
		 * send a request via Cordova to the MapPlugin android native side
		 * abstractMap is a reference to an object of type platform.map.AbstractMap
		 * action is the action/method to be called
		 * parameters is a JSONArray with the parameters for the request
		 */
/**@memberOf platform.map.nativeBridge.MapPlugin */
		sendRequest: function(/*AbstractMap*/abstractMap, /*String*/method, /*JSONArray*/parameters, /*Deferred*/ deferred) {
			
			Logger.trace("[platform.map.MapPlugin] entering sendRequest...");
			Logger.trace("[platform.map.MapPlugin] deferred is: " + deferred);
			Logger.trace("[platform.map.MapPlugin] method is: [" + method + "]");
			
			if(typeof cordova === "undefined") {
				Logger.error("[platform.map.MapPlugin] unable to find cordova object");
				return;
			}

			// send a request like, esri:showMap
			var action = abstractMap.getMapType() + ":" + method;
			Logger.trace("[platform.map.MapPlugin] action is: [" + action + "]");
			Logger.trace("[platform.map.MapPlugin] parameters is: " + parameters+ "");
			if(typeof deferred != 'undefined') {
				Logger.trace("[platform.map.MapPlugin] Calling MapPlugin with deferred object");
				// cordova call calls the MapPlugin on the Java side
				cordova.exec(
					// success 
					function(object) { 
						Logger.trace("[platform.map.MapPlugin] resolving with object: " + object);
						// if there is cache, unwrap, update and remove cache entry from result
						// is array and have cache
						if(Object.prototype.toString.call(object) === '[object Array]' &&
							object[object.length-1].hasOwnProperty("cache")) {
							var jsonObject = object[object.length-1]["cache"];
							Logger.trace("[platform.map.MapPlugin] jsonarray with cache");
							// update cache on jsonStore
							abstractMap._setCache(jsonObject.cache).then(function() {
								// remove cache
								delete jsonObject["cache"];
								deferred.resolve(object);
							});
							Logger.trace("[platform.map.MapPlugin] cache was updated!");
							
						}
						// is json object and have cache
						else if(object && object.hasOwnProperty("cache")) {
							Logger.trace("[platform.map.MapPlugin] regular json with cache");
							// update cache on jsonStore
							abstractMap._setCache(object.cache).then(function() {
								// remove cache
								delete object["cache"];
								deferred.resolve(object);
							});
							Logger.trace("[platform.map.MapPlugin] cache was updated!");
						}
						// don't have cache
						else {
							Logger.trace("[platform.map.MapPlugin] no cache, continuing");
							deferred.resolve(object);
						}
						
					}, 
					// failed
					function(errorMsg) {
						Logger.log("[platform.map.MapPlugin] failed to resolve, error message: " + errorMsg);
						
						if(errorMsg && errorMsg.messageId != undefined && errorMsg.messageId != null){
							deferred.reject(errorMsg); 
						}
						//On windows I got 'Missing Command Error'
						else if (errorMsg && (typeof errorMsg == 'string' && (errorMsg.indexOf('Class not found') >=0) || (errorMsg.indexOf('Missing Command Error') >=0))){
							deferred.reject({'messageId' : 'noNativeMap'}); 
						}
						else{
							deferred.reject(errorMsg);							
						}
					}, 
					this.service, 
					action, 
					parameters
				);
			}
			else {
				if (action != "esri:sendMapProperties"){
					Logger.trace("[platform.map.MapPlugin] sending: " + action + " - " + JSON.stringify(parameters));
				} else {
					Logger.trace("[platform.map.MapPlugin] sending: " + action);
				}
				cordova.exec(
					function() { /*Logger.trace('[js] ' + 'success calling cordova.exec');*/}, 
					function(message) { /*Logger.trace('[js] ' + 'failed calling cordova.exec: ' + message);*/ }, 
					this.service, 
					action, 
					parameters
				);
			}
		},
		
		/*
		 * get the service being used by this plugin
		 */
		getService: function() {
			return this.service;
		}
	};
	
	return lang.setObject("platform.map.nativeBridge.MapPlugin", MapPlugin);
});


