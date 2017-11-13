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
 * SuperClass used: platform.map.GeoLocationHelper.js
 * 
 * This class asks for Geo Location and then submits the result to the displayed Map
 * 
 * This class uses Deferred, but it is not need to be captured.
 * 
 * * Sample for the creation of initial instance for singleton:
 * 		var loc = mapGeoLocation.getInstance(); // use default values
 * 		var loc = mapGeoLocation.getInstance({addSuccessCall: extraPassCall, addFailCall: extraFailCall});
 * 		var loc = mapGeoLocation.getInstance({enableHighAccuracy: true, maximumAge: 4000, timeout: 2000});
 * 		var loc = mapGeoLocation.getInstance({timeout: 4000});
 *
 * * sample for normal creation:
 *		var loc = new mapGeoLocation();
 * 
 * * Functions:
 * 		sendGeoLocation(map); Retrieves geo location and submits to map.
 * 		Deferred: 
 * 			resolved: returns object with coordinate information
 * 			reject: returns object error
 * 
 * Additional information is in the super class
 * 
 *  
 */
define("platform/map/MapGeoLocation",
		["dojo/_base/declare", 
		 "dojo/_base/lang", 
		 "dojo/Deferred", 
		 "dojo/_base/json", 
		 "platform/translation/MessageService",
		 "platform/map/GeoLocationHelper",
		 "platform/logging/Logger"],
  function(declare, lang, Deferred, jsonconvert, MessageService, gl, Logger) {
	
	var MapGeoLocation = declare("MapGeoLocation", [gl], {
		
		_TAG: "platform.map.MapGeoLocation.js",
		outOfBoundsMsg: null, 
		unableAcquireGPS: null, 
		
		constructor: function(/*Object*/ geoLocOptions){
        	Logger.trace(this._TAG + ", **** In Map  Geo Location Constructor");
        	this.outOfBoundsMsg = MessageService.createStaticMessage("outOfBoundsMsg").getMessage();
        	this.unableAcquireGPS = MessageService.createStaticMessage("unableAcquireGPS").getMessage();
		//	lang.mixin(this, geoLocOptions);
		},
		
		/**
		 * Function to get the current GPS location
		 */
		getGPSLocation: function(callBackSuccess, callBackError) {
			var loc = this; 
			var deferred = new Deferred();
			var theinstance = this;
			loc.getLocation().then(function(p){ 											
				var jsonGeoLoc = '{"geolocation": { "max:longitudex":' 
					+ loc.getLongitude()
					+ ',"max:latitudey":'
					+ loc.getLatitude()
					+ ',"Status":"'
					+ loc.getDataStatus()
					+ '","OutOfBoundMessage":"'
					+ theinstance.outOfBoundsMsg
					+ '"}}';
				var jsonGeoLocObj = jsonconvert.fromJson(jsonGeoLoc);	
				console.log("[GPS] Position ", jsonGeoLoc);		
				Logger.log("[GPS] Position " + jsonGeoLoc);
				deferred.resolve(jsonGeoLocObj);			
			}, function(error) {
				Logger.log(theinstance._TAG + ", Unable to Retreive GPS GEO Location");
				// send previuos information if applicable
				var jsonGeoLoc = '{"geolocation": { "max:longitudex":' 
					+ loc.getLongitude()
					+ ',"max:latitudey":'
					+ loc.getLatitude()
					+ ',"Status":"'
					+ loc.getDataStatus()
					+ '","ErrorMessage":"'
					+ theinstance.unableAcquireGPS
					+ '"}}';
				
				var jsonGeoLocObj = jsonconvert.fromJson(jsonGeoLoc);							
				deferred.reject(error);
			});
				
				return deferred.promise;
		},
				
		/** @memberOf platform.map.MapGeoLocation */
		sendGeoLocation: function(map) {
			var loc = this;
			var deferred = new Deferred();
			var theinstance = this;
			loc.getLocation().then(function(p){ 											
				var jsonGeoLoc = '{"geolocation": { "max:longitudex":' 
					+ loc.getLongitude()
					+ ',"max:latitudey":'
					+ loc.getLatitude()
					+ ',"Status":"'
					+ loc.getDataStatus()
					+ '","OutOfBoundMessage":"'
					+ theinstance.outOfBoundsMsg
					+ '"}}';
				
				var jsonGeoLocObj = jsonconvert.fromJson(jsonGeoLoc);							
				Logger.trace(theinstance._TAG + ", ------jsonGeoLoc: " + jsonGeoLoc);
				map.setGPSLocation([jsonGeoLocObj]);
				deferred.resolve(p);
			}, function(error) {
				Logger.log(theinstance._TAG + ", Unable to Retreive GPS GEO Location");
				// send previuos information if applicable
				var jsonGeoLoc = '{"geolocation": { "max:longitudex":' 
					+ loc.getLongitude()
					+ ',"max:latitudey":'
					+ loc.getLatitude()
					+ ',"Status":"'
					+ loc.getDataStatus()
					+ '","ErrorMessage":"'
					+ theinstance.unableAcquireGPS
					+ '"}}';
				
				var jsonGeoLocObj = jsonconvert.fromJson(jsonGeoLoc);							
				Logger.trace(theinstance._TAG + ", ------jsonGeoLoc: " + jsonGeoLoc);
				map.setGPSLocation([jsonGeoLocObj]);

				deferred.reject(error);
			});
				
				return deferred.promise;
		 }	 
	});
	
	
	//	MapGeoLocation._properlyinstance = false;
	// create the one and only instance as a class property 
	MapGeoLocation.getInstance = function (gl) {
		Logger.trace("platform.map.MapGeoLocation.js, getting instance of MapGeoLocation");
    	if (MapGeoLocation.instance) {
    		Logger.trace("platform.map.MapGeoLocation.js, returning instance of MapGeoLocation");
    		return MapGeoLocation.instance;
    	} else {
    		// MapGeoLocation._properlyinstance = true;
    		Logger.trace("platform.map.MapGeoLocation.js, No instance of MapGeoLocation is found");
    		Logger.trace("platform.map.MapGeoLocation.js, Creating instance for MapGeoLocation");
    		MapGeoLocation.instance=new MapGeoLocation(gl);
    		return (MapGeoLocation.instance);
    	}
    };
 
    return MapGeoLocation;
});
