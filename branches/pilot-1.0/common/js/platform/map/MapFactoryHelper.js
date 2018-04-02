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
 * This class is a helper for MapFactory
 * so just you don't have to pass the dojoClassType, this should help the code generation
 */
define("platform/map/MapFactoryHelper",
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/map/MapFactory",
  "platform/map/AbstractMap",
  "platform/logging/Logger"], 
function(declare, lang, Deferred, MapFactory, AbstractMap, Logger) {
	
	return declare(null, {
		providerUrl: null,
		containerGeo: null,
		specificParameters: null,
		dojoClassMapType: null,
		error: null,
		
		constructor: function(/*String*/ providerUrl, /*JSONObject*/ containerGeo, /*JSONObject*/ specificParameters) {
			this.providerUrl = providerUrl;
			this.containerGeo = containerGeo;
			this.specificParameters = specificParameters;
			this.dojoClassMapType = this._parseProvider(providerUrl, specificParameters);
		},
	
		/** @memberOf platform.map.MapFactoryHelper
		 * Returns a promise of the map being created
		 */
		getMap: function() {
			if(this.dojoClassMapType == null) {
				var deferred = new Deferred();
				if(this.error) {
					deferred.reject(error);
				}
				else {
					var message = "Unable to determine a map provider type based on the parameters received: " + this.providerUrl + ", " + JSON.stringify(this.specificParameters);
					deferred.reject(message);
				}
				return deferred.promise;
			}
			return MapFactory.createMap(this.dojoClassMapType, this.providerUrl, this.containerGeo, this.specificParameters);
		},
		
		/*
		 * Find out what is your map type based on the providerUrl
		 */
		_parseProvider: function(/*String*/ providerUrl, /*JSONObject*/ specificParameters) {
			var mapType = null;

			//on windows environment we use openlayers for online and offline maps
			if(WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS8){
				Logger.trace("[platform.map.MapFactoryHelper] The map type is esri running on windows environment.");
				mapType = "platform.map.OpenLayersMap";
				return mapType;
			}
			
			if(specificParameters == null) {
				Logger.warn("[platform.map.MapFactoryHelper] No specificParameters provided, unable to determine type of Map to instantiate");
				return mapType;
			}

			var provider = specificParameters['provider'];

			if(provider) {
				switch(provider.toLowerCase()) {
					case "osm": case "bing": case "google": case "mxspatial":
						mapType = "platform.map.OpenLayersMap";
						break;

					case "esri":
						// no providerUrl received
						if(providerUrl == null) {
							Logger.trace("[platform.map.MapFactoryHelper] providerUrl is blank, trying to find a localMapUrl...");

							if(specificParameters == null) {
								Logger.warn("[platform.map.MapFactoryHelper] No specificParameters provided, unable to determine type of Map to instantiate");
								return mapType;
							}

							var localMapUrl = specificParameters['localMapUrl'];
							// try to use other data to find the map type
							if(localMapUrl != null) {
								if(localMapUrl.match(/\.tpk$/)) {
									Logger.trace("[platform.map.MapFactoryHelper] localMapUrl found: " + localMapUrl);
									mapType = "platform.map.EsriMap";
								}
								else {
									Logger.warn("[platform.map.MapFactoryHelper] specificParameters > localMapUrl is not providing a .tpk file");
									this.error = "Specified localMapUrl (" + localMapUrl + ") file type is not valid"; 
								}
							}
							else {
								Logger.warn("[platform.map.MapFactoryHelper] Neither providerUrl or localMapUrl found, double check the app.xml. Unable to instantiate map");
							}
						}
						// providerUrl received
						else {
							// this is how the providerUrl look
							// http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer
							
							if(providerUrl.length > 0) {
								mapType = "platform.map.OpenLayersMap";
							}
							else {
								Logger.warn("[platform.map.MapFactoryHelper] providerUrl is empty");
							}
						}
					break;

					default:
						Logger.warn("[platform.map.MapFactoryHelper] Map 'provider' property not specified, trying to fetch provider based on other properties...");
				}
			}
			else {
				if (providerUrl && specificParameters['localMapUrl']) {
					// this is likely to be esri
					Logger.trace("[platform.map.MapFactoryHelper] The map type seems to be esri");
					mapType = "platform.map.OpenLayersMap";
				}
				else {
					// no providerUrl but localMapUrl, should be esri native
					if (specificParameters['localMapUrl']) {
						Logger.trace("[platform.map.MapFactoryHelper] The map type seems to be esri");
						mapType = "platform.map.EsriMap";
					}
				}
				// last fall back uses OpenStreetMaps
				mapType = "platform.map.OpenLayersMap";
				Logger.warn("[platform.map.MapFactoryHelper] Can't tell mapType assuming OSM (OpenStreetMaps)");
			}
			
			return mapType;
		}
	});
});

