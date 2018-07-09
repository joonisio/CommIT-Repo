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
 * Specific implementation of AbstractMap for ArcGIS Esri
 */
define("platform/map/EsriMap",
[ "dojo/_base/declare", 
  "platform/map/AbstractMap",
  "dojo/Deferred",
  "platform/map/nativeBridge/NativeBridgeHelper",
  "platform/logging/Logger"], 
function(declare, AbstractMap, Deferred, NativeBridgeHelper, Logger) {
	/** @class platform.map.EsriMap */
	return declare(AbstractMap, {
		
		_bridge: null,
		_parameters: null,
		
		constructor: function(/*String*/ providerUrl, /*DOMNode*/ container, /*JSONObject*/ specificParameters) {
			// this reference might be used by other classes
			// check the android side MapUIManager.MapType
			// the values set here should be the same as there
			this._setMapType("esri");
			this._bridge = new NativeBridgeHelper(this);
			
			this._parameters = {
				providerUrl: providerUrl, 
				specificParameters: specificParameters
			};
			// whoever is instantiating this class must call bridgeConstructor
		},

		/** @memberOf platform.map.EsriMap
		 * Creates a deffered object for the constructor
		 * and instantiate the java side. If this method is not called
		 * the java side won't be called.
		 * returns a deferred object that once resolved means the class
		 * on the java side have been instantiated
		 */
		bridgeConstructor: function() {
			Logger.trace("[platform.map.EsriMap] bridgeConstructor: " + JSON.stringify(this._parameters));
			var deferred = new Deferred();
			this._bridge.request([this._parameters], deferred);
			
			return deferred.promise;
		},

		/**
		 * Initializes the map in such a way that from this point on all the
		 * events are being handled and map is ready to be shown
		 */
		init: function() {
			Logger.trace("[platform.map.EsriMap] initializing map...");
			this._bridge.request([]);
		},
		
		/*
		 * Show map on the container area
		 */
		showMap: function() {
			// call the map via CordovaPlugin based on attributes of the class
			Logger.trace("[platform.map.EsriMap] showMap");
			this._bridge.request([this.containerX, this.containerY, this.containerWidth, this.containerHeight]);
		},
		
		/*
		 * Hide map from the container area
		 */
		hideMap: function() {
			// request the map to go away via CordovaPlugin
			Logger.trace("[platform.map.EsriMap] hideMap");
			this._bridge.request([]);
		},
		
		/*
		 * resource: JSON array collection of the desired type to be showed on the map (i.e. workorder)
		 * clean: if true clean the previous added markers, if false previous markers are kept on the map
		 */
		addLayer: function(/*_ModelDataSet*/resource, /*String*/ layerId, /*int*/ resourceIndex) {
            Logger.trace("[platform.map.EsriMap] layerid is: " + layerId);
            // cleanup the resource from uninteresting data
            resource = this.cleanResource(resource);
            Logger.trace("[platform.map.EsriMap] addLayer: " + JSON.stringify(resource));
            var deferred = new Deferred();
            
            if(typeof resourceIndex !== "undefined") {            
            	this._bridge.request([resource, layerId, resourceIndex], deferred);
            }
            else{
            	this._bridge.request([resource, layerId, -1], deferred);
            }
            
            return deferred.promise;
        },
		
		setGPSLocation: function(/*ModelDataSet*/jsonObject) {
			Logger.trace("[platform.map.EsriMap] setGPSLocation: " + JSON.stringify(jsonObject));
			this._bridge.request(jsonObject);
		},

		removeAllLayers: function() {
			Logger.trace("[platform.map.EsriMap] removeAllLayers");
			var deferred = new Deferred();
			this._bridge.request([], deferred);

			return deferred.promise;
		},
		
		removeLayer: function(/*String*/ layerId) {
			Logger.trace("[platform.map.EsriMap] removeLayer");
			// build jsonArray to bridge to native
			this._bridge.request([layerId]);
		},
		
		/*
		 * Asyncronously request a marker to be selected, this causes such marker to enlarge only
		 * reutrns a MarkerInfo, check platform/map/MarkerInfo for more information
		 * 
		 */
		/*MarkerInfo*/ setMarkerSelected: function(/*String*/ layerId, /*JSONObject*/ query, /*boolean*/ isAutoZoom) {
            Logger.trace("[platform.map.EsriMap] setMarkerSelected layerId: " + layerId + " query: " + JSON.stringify(query));
            var deferred = new Deferred();
            
            // verify if the optional isAutoZoom variable was specified and
            // build jsonArray to bridge to native
            if(typeof isAutoZoom !== "undefined") {
            	this._bridge.request([layerId, query, isAutoZoom], deferred);
            }
            else{				
            	this._bridge.request([layerId, query, false], deferred);
            }
            
            return deferred.promise;
        },
		
		/*
		 * returns a promise of platform.map.directions.Directions
		 */
		/*Directions*/ getAllDirections: function(/*String*/ layerId) {
			Logger.trace("[platform.map.EsriMap] getAllDirections");
			var deferred = new Deferred();
			// the generic handler (for now MapHandler, must change once context is introduced)
			// must resolve this deferred, check NativeBridgeHelper.js and MapPlugin.java
			this._bridge.request([layerId], deferred);
			
			return deferred.promise;
		},
		
		/*
		 /*
		 * returns a promise of platform.map.directions.DirectionsLeg
		 * to specify such leg provide one or many attributes on your JSONObject that will be used
		 * to filter the right marker / object
		 * 
		 * for example, if you want to get directions for a specific workorder you may create the following JSONObject
		 * to pass in as the query parameter:
		 * 
		 * { wonum: 1234 }
		 */
		/*DirectionsLeg*/ getDirections: function(/*String*/ layerId, /*JSONObject*/ query) {
			Logger.trace("[platform.map.EsriMap] getDirections");
			var deferred = new Deferred();
			// the generic handler (for now MapHandler, must change once context is introduced)
			// must resolve this deferred, check NativeBridgeHelper.js and MapPlugin.java
			this._bridge.request([layerId, query], deferred);
			
			return deferred.promise;
		},

		/*
		 * returns a promise of an int[] containing the resouceIndexes for all markers on the specified layer
		 */
		/*int[]*/ getResourceIndexesFromMarkers: function(/*String*/ layerId) {
			Logger.trace("[platform.map.EsriMap] getResourceIndexesFromMarkers");
			var deferred = new Deferred();
			// the generic handler (for now MapHandler, must change once context is introduced)
			// must resolve this deferred, check NativeBridgeHelper.js and MapPlugin.java
			this._bridge.request([layerId], deferred);
			
			return deferred.promise;
		},
		
		/*
		 * 
		 */
		sendMapProperties: function(jsonObject){
			// Logger.trace("[platform.map.EsriMap] sendMapProperties: " + JSON.stringify(jsonObject));
			this._bridge.request(jsonObject);
		}
	});
});
