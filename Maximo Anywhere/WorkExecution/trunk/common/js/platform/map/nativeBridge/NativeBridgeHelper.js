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
define("platform/map/nativeBridge/NativeBridgeHelper", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/map/nativeBridge/MapPlugin",
  "platform/map/AbstractMap",
  "platform/logging/Logger",
  "platform/plugins/PermissionsPlugin"], 
function(declare, lang, Deferred, MapPlugin, AbstractMap, Logger, PermissionsPlugin) {
	/**@class platform.map.nativeBridge.NativeBridgeHelper*/
	return declare(null, {
		map: null,
		
		constructor : function(/*AbstractMap*/ abstractMap) {
			this.map = abstractMap;
		},
		/** @memberOf platform.map.nativeBridge.NativeBridgeHelper
		 * @parameters Always a JSONArray, ensure you build your JSONArray before using this method
		 */
		request: function(/*JSONArray*/ parameters, /*Deferred*/ deferred) {
			var action = arguments.callee.caller.nom;
			
			Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] Sending request using");
			Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] 	mapType: " + this.map.getMapType());
			Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] 	action: " + action);
			
			// inject cache into the request
			if(action == "addLayer" || action == "getAllDirections") {
				this.map._getCache().always(lang.hitch(this, function(_this, _action, _parameters, _deferred, cache) {
					if(!_parameters || _parameters == 'undefined' || _parameters == null || _parameters.length <= 0) {
						// create an empty jsonObject
						var _parameters = new Array();
						_parameters[0] = { cache: null };
					}
					else {

						// need to ask to ricardo if it fails what is the result of this
						if(!cache) {
							Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] unable to retrieve cache");
							// inject the cache into the json _parameters
							_parameters[_parameters.length] = { "cache": null };
						}
						else {
							Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] appending cache to request");
							// inject the cache into the json _parameters
							_parameters[_parameters.length] = { "cache": cache };
						}
					}

					if (_action != "sendMapProperties") {
						Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] _parameters: " + JSON.stringify(_parameters));
					}
					
					_this._invokeRequest(_this.map, _action, _parameters, _deferred);
					
				}, this, action, parameters, deferred));
				
			}
			else {
				Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] method do NOT have cache");
				this._invokeRequest(this.map, action, parameters, deferred)
			}
		},
		
		_invokeRequest: function(map, action, parameters, deferred) {
			Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] method do NOT have cache");
			if(typeof deferred == 'undefined') {
				Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] deferred not found");
				PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.READ_EXTERNAL_STORAGE, [PermissionsPlugin.READ_EXTERNAL_STORAGE], MapPlugin, MapPlugin.sendRequest, [map, action, parameters]);
				
			}
			else {
				Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] deferred found!");
				PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.READ_EXTERNAL_STORAGE, [PermissionsPlugin.READ_EXTERNAL_STORAGE], MapPlugin, MapPlugin.sendRequest, [map, action, parameters, deferred]);
			}
		}
	});
});


