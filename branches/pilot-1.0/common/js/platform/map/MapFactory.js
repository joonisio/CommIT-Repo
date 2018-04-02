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
 * This class is responsible for creating new maps
 */
define("platform/map/MapFactory", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "dojo/when",
  "platform/map/AbstractMap",
  "platform/logging/Logger"], 
function(declare, lang, Deferred, when, AbstractMap, Logger) {
	var MapFactory = {
		deferred: null,
		map: null,
		/** @memberOf platform.map.MapFactory */
		createMap: function(/*String*/ dojoClass, /*String*/ providerUrl, /*JSONObject*/ containerGeo, /*JSONArray*/ specificParameters) {
			this.deferred = new Deferred();
			if(dojoClass == null || dojoClass == 'undefined' || dojoClass == "") {
				this.deferred.reject("Could not determine which map provider to instantiate");
				return this.deferred.promise;
			}
			Logger.trace("[platform.map.MapFactory] creating new map " + dojoClass);
			
			// replace . with /
			dojoClass = dojoClass.match(/\./).length > 0 ? dojoClass.replace(/\./g, "/") : dojoClass;
			
			var that = this;
			
			require(
			[ dojoClass, 
			  "platform/map/GenericOnChangeStatusListener", 
			  "dojo/Deferred",
			  "dojo/when",
			  "platform/map/ScriptLoader"], 
			function(CreatedMap, GenericOnChangeStatusListener, Deferred, when, ScriptLoader) {
				that.map = new CreatedMap(providerUrl, containerGeo, specificParameters);

				// native map will be used only for android and ios for now... windows will use offline maps with openlayers
				if (that.map.bridgeConstructor && (WL.Client.getEnvironment() != WL.Environment.WINDOWS_PHONE_8 && WL.Client.getEnvironment() != WL.Environment.WINDOWS8)) {
					Logger.log("[platform.map.MapFactory] Found bridgeConstructor");
					that.map.bridgeConstructor().then(function() {
						if(that.map.isInstanceOf(AbstractMap)) {
							var listener = new GenericOnChangeStatusListener(that.deferred, that.map);
							Logger.trace("[platform.map.MapFactory] registering listener");
							// TODO, when the platform is more mature we must change this piece, it should use the 
							// application context instead of the mapHandler
							window.WL.application["platform.handlers.MapHandler"].addStatusChangedListener(listener);
							// release the map to start sending events and be show
							that.map.init();
						}
						else {
							var errorMsg = "[platform.map.MapFactory] MapFactory.createNewMap failed, " +
								"the current class provided: " + dojoClass + " do not extend/mixin with platform.map.AbstractMap";
							Logger.trace("[platform.map.MapFactory] " + errorMsg);
							that.deferred.reject(errorMsg);
						}
					}, function(error) {
						Logger.trace("[platform.map.MapFactory] " + error);
						that.deferred.reject(error);
					});
				}
				else {
					Logger.trace("[platform.map.MapFactory] Attempt to load OpenLayers API");
					try {
						if (ol && ol.Map) {
							Logger.trace("[platform.map.MapFactory] OpenLayers API already loaded");
							WL.application.showBusy();
							that.map.init().then(function () {
								WL.application.hideBusy();
							    that.deferred.resolve(that.map);
							}).otherwise(function (error) {
							    Logger.trace("[platform.map.MapFactory] Unable to initialize online map/windows offline TPK OpenLayers with existing OL instance, " + error);
							    WL.application.hideBusy();
							    that.deferred.reject(error);
							});
						}
						else {
							Logger.trace("[platform.map.MapFactory] Error accessing OpenLayers API that should be already loaded");
						}
					}
					catch(err) { 
						Logger.trace("[platform.map.MapFactory] Failed to load Map");
						that.deferred.reject(err);
					}
				}
			});
			
			return that.deferred.promise;
		}
	};
	
	return lang.setObject("platform.map.MapFactory", MapFactory);
});
