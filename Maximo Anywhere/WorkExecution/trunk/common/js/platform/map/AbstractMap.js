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
 * This class is a generic type for all types of maps we are going to support (i.e. EsriMap, GoogleMap..)
 */
define("platform/map/AbstractMap",
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/dom", 
  "dojo/dom-geometry",
  "platform/model/ModelService",
  "dojo/Deferred",
  "platform/map/MapCache",
  "platform/logging/Logger"], 
function(declare, lang, dom, domGeom, ModelService, Deferred, MapCache, Logger) {
	/** @class platform.map.AbstractMap */
	return declare(null, 
	{
		providerUrl: null,
		mapType: null,
		container: null,
		specificParameters: null,
		
		// size of the map
		containerWidth: 0,
		containerHeight: 0,
		containerX: 0,
		containerY: 0,
		mapCache: null,
		
		/*
		 * resource: JSON array collection of the desired type to be showed on the map (i.e. workorder)
		 * providerUrl: url of the map provider (i.e. http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer)
		 * container: a JSONObject containing the container geometry to size the map
		 * specificParameters: JSONObject holding parameters specific
		 */
		constructor: function(/*String*/ providerUrl, /*DOMNode or JSONObject with w,h,l,t properties*/ container, /*JSONObject*/ specificParameters) {
			this.providerUrl = providerUrl;
			this.container = container;
			this.specificParameters = specificParameters;
			this.mapCache = new MapCache();
			
			this.setContainer(container);
		},

		/**
		 * @memberOf platform.map.AbstractMap
		 * Initializes the map in such a way that from this point on all the
		 * events are being handled and map is ready to be shown
		 */
		init: function() {

		},

		
		/*
		 * Set container to be used as a reference to where your map will be drawn, expected to be a DOMNode
		 */
		// TODO, this guy needs to be smarter then that, on a native context we also need the margin top to be applied
		setContainer: function(/*DOMNode*/ container) {
			if(container != null) {
				if (container.hasOwnProperty("w") && container.hasOwnProperty("h")) {
					this.container = container;
					this.containerWidth = container.w;
					this.containerHeight = container.h;
					this.containerX = container.l;
					this.containerY = container.t;
				}
				// try to check if it is a Node
				else if (container instanceof HTMLElement || container instanceof Node || container.hasOwnProperty("nodeType")) {
					var dimension = domGeom.position(container, true);
					this.container = container;
					this.containerWidth = dimension.w;
					this.containerHeight = dimension.h;
					this.containerX = dimension.x;
					this.containerY = dimension.y;
				}
			}
			else {
				Logger.log("[platform.map.AbstractMap] Container is not set, unable to draw map with no given area");
			}
		},
		
		/*
		 * define this map type, should always be set at constructor for the implementing class other classes might rely on it
		 * i.e. esri, google, bing
		 */
		_setMapType: function(mapType) {
			this.mapType = mapType;
		},

		/*
		 * Retrieve cache from jsonStore
		 * return a deferred jsonObject
		 */
		/* Promise */ _getCache: function() {
			return this.mapCache.getCache();
		},

		/*
		 * Put cache on jsonStore
		 */
		/* Promise */ _setCache: function(/*JSONObject*/ jsonObject) {
			return this.mapCache.setCache(jsonObject);
		},
		
		getX: function() {
			return this.containerX;
		},
		
		getY: function() {
			return this.containerY;
		},
		
		getWidth: function() {
			return this.containerWidth;
		},
		
		getHeight: function() {
			return this.containerHeight;
		},
		
		getMapType: function() {
			return this.mapType;
		},
		
		/*
		 * Show map on the container area
		 */
		showMap: function() {
			// call the map via CordovaPlugin based on attributes of the class
		},
		
		/*
		 * Hide map from the container area
		 */
		hideMap: function() {
			// request the map to go away via CordovaPlugin
		},
		
		/*
		 * returns an empty promise just to allow the use of then/when
		 * 
		 * resource: JSON array collection of the desired type to be showed on the map (i.e. workorder)
		 */
		addLayer: function(/*ModelDataSet*/ resource, /*String*/ layerId, /*int*/ resourceIndex) {
		},

		/*
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
		
		setGPSLocation: function(/*ModelDataSet*/ jsonObject) {
			Logger.trace("[platform.map.AbstractMap] setGPSLocation");
		},
		
		/*
		 * remove all layers from the map
		 */
		removeAllLayers: function() {
		},
		
		/*
		 * remove a layer from the map
		 */
		removeLayer: function(/*String*/ layerId) {
		},
		
		/*
		 * Get the resource that was added to this layer using addLayer method
		 */
		getResourceByLayerId: function(/*String*/ layerId) {
		},
		
		/*
		 * Asyncronously request a marker to be selected, this causes such marker to enlarge only
		 * 
		 * for example, if you want to get directions for a specific workorder you may create the following JSONObject:
		 * 
		 * { wonum: 1234 }
		 */
		/*MarkerInfo*/ setMarkerSelected: function(/*String*/ layerId, /*JSONObject*/ query, /*boolean*/ isAutoZoom) {
			
		},
		
		/*
		 * returns a promise of platform.map.directions.Directions
		 */
		/*Directions*/ getAllDirections: function(/*String*/ layerId) {
			
		},
		
		/*
		 * returns a promise of platform.map.directions.DirectionsLeg
		 * to specify such leg provide one or many attributes on your JSONObject that will be used
		 * to filter the right marker / object
		 * 
		 * for example, if you want to get directions for a specific workorder you may create the following JSONObject:
		 * 
		 * { wonum: 1234 }
		 * 
		 * { index: 32 } is far more performatic
		 */
		/*DirectionsLeg*/ getDirections: function(/*String*/ layerId, /*JSONObject*/ query) {
			
		},
		
		/*
		 * returns a promise of an int[] containing the resouceIndexes for all markers on the specified layer
		 */
		/*int[]*/ getResourceIndexesFromMarkers: function(/*String*/ layerId) {
			
		},
		
		
		/*
		 * 
		 */
		sendMapProperties: function(jsonObject){}

	});
});
