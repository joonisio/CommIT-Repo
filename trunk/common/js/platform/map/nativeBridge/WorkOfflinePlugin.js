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
 * This class is responsible for communicating with the Java side WorkOfflinePlugin
 */
define("platform/map/nativeBridge/WorkOfflinePlugin", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "platform/model/ModelService",
  "platform/logging/Logger"], 
function(declare, lang, ModelService, Logger) {
	/** @class platform.map.nativeBridge.WorkOfflinePlugin */
	var WorkOfflinePlugin = {
		service: "WorkOfflinePlugin",
		
		/** @memberOf platform.map.nativeBridge.WorkOfflinePlugin
		 * send a request via Cordova to the WorkOfflinePlugin android native side
		 * action is the action/method to be called
		 * parameters is a JSONArray with the parameters for the request
		 */
		sendRequest: function(/*WorkOfflineDirections*/ WorkOfflineDirections, /*String*/method, /*JSONArray*/parameters, /*Deferred*/ deferred) {
			
			Logger.trace("[platform.map.WorkOfflinePlugin] entering sendRequest...");
			Logger.trace("[platform.map.WorkOfflinePlugin] deferred is: " + deferred);
			
			if(typeof cordova === "undefined") {
				var errorMsg = "[platform.map.WorkOfflinePlugin] unable to find cordova object";
				Logger.error(errorMsg);
				deferred.reject(errorMsg);
				return;
			}

			// send a request like, esri:showMap
			var action = WorkOfflineDirections.getMapType() + ":" + method;
			if(typeof deferred != 'undefined') {
				Logger.trace("[platform.map.WorkOfflineDirections] Calling WorkOfflineDirections with deferred object");
				// cordova call calls the WorkOfflineDirections on the Java side
				cordova.exec(
					// success 
					function(object) { 
						Logger.trace("[platform.map.WorkOfflineDirections] resolving with object: " + object);
						deferred.resolve(object);
					}, 
					// failed
					function(message) { 
						Logger.log("[platform.map.WorkOfflineDirections] failed to resolve, error message: " + message);
						//On windows I got 'Missing Command Error'
						if(message && (message.indexOf('Class not found') >=0 || message.indexOf('Missing Command Error') >=0)){
							deferred.reject({'messageId' : 'noNativeMap'}); 
						}
						else{
							if(!message){ 
								message = '';
							}
							deferred.reject(message); 
						}
					}, 
					this.service, 
					action, 
					parameters
				);
			}
			else {
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
	
	return lang.setObject("platform.map.nativeBridge.WorkOfflineDirections", WorkOfflinePlugin);
});


