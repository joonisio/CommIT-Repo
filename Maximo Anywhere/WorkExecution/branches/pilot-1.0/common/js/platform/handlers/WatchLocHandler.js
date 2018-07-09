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
 * 
 */
define("platform/handlers/WatchLocHandler", 
	   [ "dojo/_base/declare", 
		 "dojo/_base/json",
		 "platform/map/MapFactoryHelper",
		 "platform/logging/Logger"],
function(declare, jsonconvert, mapFactoryHelper, Logger) {
	return declare(null, {
		name: 'WatchLocHandler',
		map: null,
		
        constructor: function(/*Object*/ m){
        	this.map =m;
		},

/**@memberOf platform.handlers.WatchLocHandler */
		wlHandler: function(position){	
			Logger.trace('In the watchLocation Handler: ' + new Date(position.timestamp));

			var jsonGeoLoc = '{"geolocation": { "max:longitudex":' 
				+ position.coords.longitude
				+ ',"max:latitudey":'
				+ position.coords.latitude
				+ ',"Status":"'
				+ 'Success","OutOfBoundMessage":"Your GPS location is out of bounds of Map'
				+ '"}}';
			
			var jsonGeoLocObj = jsonconvert.fromJson(jsonGeoLoc);							
			Logger.trace("------jsonGeoLoc: " + jsonGeoLoc);

			this.map.setGPSLocation([jsonGeoLocObj]);
		}
	});
});
