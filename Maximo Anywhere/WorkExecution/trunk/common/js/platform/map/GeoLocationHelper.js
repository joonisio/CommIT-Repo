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

/* Roger R. Rosado*/
/*
 * 
 * Based off the PhoneGap/Cordova Geolocation
 * 	http://docs.phonegap.com/en/1.2.0/phonegap_geolocation_geolocation.md.html#Geolocation
 *  The geolocation object provides access to the device's GPS sensor. 
 * 
 * Sample for the creation of instance:
 * 		var loc = new geoloc();
 *
 * 
 * The "maximumAge" attribute indicates that the application is willing to accept a 
 * cached position whose age is no greater than the specified time in milliseconds. 
 * If maximumAge is set to 0, the implementation must immediately attempt to acquire a new position object.
 * 
 * The "timeout" attribute denotes the maximum length of time (expressed in milliseconds) that is allowed to 
 * pass from the call to getCurrentPosition() or watchPosition() until the corresponding successCallback is invoked. 
 * 
 * The "enableHighAccuracy" attribute provides a hint that the application would like to receive the best possible results. 
 * This may result in slower response times or increased power consumption.
 * 
 * The geographic coordinate reference system used by the attributes in this interface is the 
 * World Geodetic System (2d) [WGS84]. No other reference system is supported. 
 * 
 * Leveraging Deferred/Promise
 * 		ex: 
 * 			loc.getLocation().then(function(p){ 
 *				Logger.trace("-----------------------------------------");
 *				Logger.trace("DEFERRED-------getLocation-------DEFERRED");
 *			}, function(error) {
 *				Logger.trace(" Unable to Retreive GPS GEO Location");
 *			}); 
 *
 ** 	Deferred: 
 * 			resolved: returns object with coordinate information
 * 			reject: returns object error
 *
 * After instance is created, you can still change values by using the set functions
 * 		Example:
 * 			loc.setMaximumAge(6000);
 * 			loc.setaddSuccessCall(extraPassCall);
 * 
 * You can get information by using the get method
 * 		Example:
 * 			loc.getExecutingStatus()
 * 			loc.getDataStatus()
 * 			loc.getLongitude()
 * 			loc.getLatitude()
 * 
 *  Two methods that will retrieve GPS information.
 *  	the first is loc.getLocation();
 *  		This is an asynchronous function. Will ask the device to retrieve the GPS data once. It either returns successfully or an error.
 *  
 *  	The second is loc.watchLocation();
 *  		This is an asynchronous function. It returns the device's current position when a change in position has been detected.
 *  			/*** STILL WORKING PROGRESSS.... MUST figure out better listener ****?
 *  		A Handler template: watchLocHandler.js is built, add your code there to deliver information 
 *  
 *  Errors:
 *  	PositionError.PERMISSION_DENIED
 *		PositionError.POSITION_UNAVAILABLE
 *		PositionError.TIMEOUT
 *  
 *  Licensed Materials - Property of IBM
 *  
 */
define("platform/map/GeoLocationHelper",["dojo/_base/declare", "dojo/_base/lang", "dojo/Deferred", "dojo/on", "platform/handlers/WatchLocHandler", "platform/logging/Logger"],
  function(declare, lang, Deferred, on, wlh, Logger) {
	
	/** @class platform.map.GeoLocationHelper */
 	return declare("geolocationhelper", null, {
		
 		enableHighAccuracy: false,
		timeout: 180000, 
		maximumAge: 10000, 
        addSuccessCall: null,
        addFailCall: null,

		_TAG: "platform.map.GeoLocationHelper.js",
		_watchLocationId: null,
		_latitude: null,
        _longitude: null,
        _altitude: null,
        _accuracy: null,
        _altitudeAccuracy: null,
        _heading: null,
        _speed: null,
        _timestamp: null,
        _position: null,
        _previousPos: null,
        _dataStatus: null,
        _executingStatus: null,
        _watchLocHandler: null,
        _wlSuccess: null,
    	_dataStatusMessagesEnum: {SUCCESS : "Success", STALE: "Old Data Acquired", ERROR: "Error"},
    	_executeStatusMessagesEnum: {COMPLETED : "Completed", RUNNING: "Running", STARTING: "Starting", ERROR: "Errored", EXECUTE: "Executing"},
    	_PositionError: {PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3},


        constructor: function(/*Object*/ geoLocOptions){
        	Logger.trace(this._TAG + ", **** In Geo Location Helper Constructor");
		    lang.mixin(this, geoLocOptions);
		},

    /**
     * @memberOf platform.map.GeoLocationHelper
     * Get current location (One time shot)
     * ********More descriptive for deferred, expected resolts
     * 
     * more console log description
     * 
     */
		 getLocation: function() {
			 Logger.trace(this._TAG + ", getLocation()");
        	 this._dataStatus = this._dataStatusMessagesEnum.STALE;
        	 this._executingStatus = this._executeStatusMessagesEnum.STARTING;

			 // Stop location if running
			 if (typeof this._watchLocationId != 'undefined') {
				 this.stopLocation();				 
			 }

			 // Success callback
	       	 var deferred = new Deferred();
			 var theinstance = this;			 
 			 var success = function(position){ 				 
/*				 Logger.trace('Latitude: '          + position.coords.latitude          + '\n' +
	        	       'Longitude: '         + position.coords.longitude         + '\n' +
	        	       'Altitude: '          + position.coords.altitude          + '\n' +
	        	       'Accuracy: '          + position.coords.accuracy          + '\n' +
	        	       'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
	        	       'Heading: '           + position.coords.heading           + '\n' +
	        	       'Speed: '             + position.coords.speed             + '\n' +
	        	       'Timestamp: '         + new Date(position.timestamp)      + '\n');
*/				 
				 theinstance._setPosition(position, "getLocation");
				 deferred.resolve(position); // Object with coordinate information returned
			 };

        // Fail callback
			 var fail = function(error){
				 Logger.log(theinstance._TAG + ", getLocation fail callback with error code "+error.code);
				 Logger.log(theinstance._TAG + ", getLocation fail callback with error message "+error.message);
				 theinstance._dataStatus = theinstance._dataStatusMessagesEnum.ERROR;
				 theinstance._executingStatus = theinstance._executeStatusMessagesEnum.ERROR;
				 theinstance._setLocationStatus("Error: "+error.code + "  Message: " + error.message);
				 
				 if (theinstance.addFailCall != null && theinstance.addFailCall != ""){
					 theinstance.addFailCall(error);
				 }
				 deferred.reject(error); // Object with error number and messages returned
			 };
			 
			 var options = this.getOptions();

/*			 for (x in options)
			 {
				 Logger.trace(this._TAG + ", RRR -getLocation- option: " + x + ": " + options[x]);
			 } */

        // Get location
        	 this._executingStatus = this._executeStatusMessagesEnum.EXECUTE;
        	
        	 //in theory navigator.geolocation.getCurrentPosition should work in any plataform, but on windows sometimes we get error about location not available
			 if (WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
			     var locationWinJS = new Windows.Devices.Geolocation.Geolocator();
			     locationWinJS.getGeopositionAsync().done(success, fail);
			 }
			 else {
			     navigator.geolocation.getCurrentPosition(success, fail, options);
			 }
			 
			 this._setLocationStatus("Retrieving location...");

			 return deferred.promise;
		 },
		    

    /**
     * Start watching location (updates as new location values are updated
     *
		
		// TODO More Work is needed to Create Listener for watchLocation
		
		 watchLocation: function(map) {
			 Logger.trace(this._TAG + ", watchLocation()");
        	 this._dataStatus = this._dataStatusMessagesEnum.STALE;
        	 this._executingStatus = this._executeStatusMessagesEnum.STARTING;

			 // Success callback
//			       	 var deferred = new Deferred();
        	 var refInstance = this;
			 this._wlSuccess = function(position){
				 Logger.trace('Latitude: '          + position.coords.latitude          + '\n' +
	        	       'Longitude: '         + position.coords.longitude         + '\n' +
	        	       'Altitude: '          + position.coords.altitude          + '\n' +
	        	       'Accuracy: '          + position.coords.accuracy          + '\n' +
	        	       'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
	        	       'Heading: '           + position.coords.heading           + '\n' +
	        	       'Speed: '             + position.coords.speed             + '\n' +
	        	       'Timestamp: '         + new Date(position.timestamp)      + '\n');

				 refInstance._setPosition(position, "watchLocation");
//						 deferred.resolve(position);
			 };
			 
			 var wlhInst = new wlh(map);
			 watchLocHandler = dojo.connect(this,"_wlSuccess",wlhInst,wlhInst.wlHandler);
	       	 
			 // Fail callback
			 var fail = function(error){
				 Logger.trace(this._TAG + ", watchLocation fail callback with error code "+ error.code);
				 refInstance._setLocationStatus("Error: "+error.code + "  Message: " + error.message);
				 refInstance._dataStatus = refInstance._dataStatusMessagesEnum.ERROR;
				 refInstance._executingStatus = refInstance._executeStatusMessagesEnum.ERROR;
				 
				 if (refInstance.addFailCall != null && refInstance.addFailCall != ""){
					 refInstance.addFailCall(error);
				 }
				 
				 if (error.code == refInstance._PositionError.PERMISSION_DENIED) {
				 	stopLocation();
				 }
//						 deferred.reject(error);
			 };
			 			 
			 var options = this.getOptions();
/ *			 			 
			 for (x in options)
			 {
				 Logger.trace("RRR -watchLocation- option: " + x + ": " + options[x]);
			 }
* /

			 // Get location
			 this._watchLocationId = navigator.geolocation.watchPosition(this._wlSuccess, fail, options);
			 this._setLocationStatus("Running");
        	 this._executingStatus = this._executeStatusMessagesEnum.RUNNING;
		 }, */

		 /**
		  * Stop watching the location
		  */
		stopLocation: function() {
			this._setLocationStatus("Stopped");
			if (this._watchLocationId) {
				watchLocHandler.remove();
				navigator.geolocation.clearWatch(this._watchLocationId);
				this._watchLocationId = null;
			}
		},		 
		 
		 setTimeOut: function(to){
			 this.timeout = to;
		 },
		 
		 setEnableHighAccuracy: function(enable){
			 this.enableHighAccuracy = enable;
		 },
		 
		 setMaximumAge: function(maxAge) {
			 this.maximumAge = maxAge;
		 },

		 setAddSuccessFunction: function(call) {
			 // Add addition Success work
			 this.addSuccessCall = call;
		 },

		 setAddFailFunction: function(call) {
			 // Add addition Fail work
			 this.addFailCall = call;
		 },
		 
		_setLocationStatus: function(status) {
			Logger.trace(this._TAG + ", location_status: " +status);
		},


		_setPosition: function(position, locType) {
			//as always microsft has his own way to get locations
		    if (WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
		        this._latitude = position.coordinate.latitude;
		        this._longitude = position.coordinate.longitude;
		        this._altitude = position.coordinate.altitude;
		        this._accuracy = position.coordinate.accuracy;
		        this._altitudeAccuracy = position.coordinate.altitudeAccuracy;
		        this._heading = position.coordinate.heading;
		        this._speed = position.coordinate.speed;
		    }
		    else {
		        this._latitude = position.coords.latitude;
		        this._longitude = position.coords.longitude;
		        this._altitude = position.coords.altitude;
		        this._accuracy = position.coords.accuracy;
		        this._altitudeAccuracy = position.coords.altitudeAccuracy;
		        this._heading = position.coords.heading;
		        this._speed = position.coords.speed;
		    }
			this._timestamp = new Date(position.timestamp);
		    this._dataStatus = this._dataStatusMessagesEnum.SUCCESS;	 
			this._setLocationStatus("Success");
		    if (this._position != null || this._position != ""){
		    	this._previousPos = this._position;
		    }
		    this._position = position;
			  	 
			if (locType== "getLocation") {
		    	this._executingStatus = this._executeStatusMessagesEnum.COMPLETED;
		    }
			if (locType== "watchLocation") {
		    	this._executingStatus = this._executeStatusMessagesEnum.RUNNING;
		    }
				
		    if (this.addSuccessCall != null && this.addSuccessCall != ""){
		    	this.addSuccessCall(position);
		    }
		},

		getLongitude: function(){			 
			if (typeof this._longitude != 'undefined') {
				 return this._longitude;
			} else {
				return null;				 
			}
		},

		getLatitude: function(){			 
			if (typeof this._latitude != 'undefined') {
				return this._latitude;
			} else {
				return null;				 
			}
		},
		 
		 getTimestamp: function(){			 
			 if (typeof this._timestamp != 'undefined') {
				 return this._timestamp;
			 } else {
				 return null;				 
			 }
		 },
		 
		 getOptions: function(){
			 var options = {
					 enableHighAccuracy: this.enableHighAccuracy, // Boolean
					 timeout: this.timeout, // Long
					 maximumAge: this.maximumAge // Long
			 };
			 
/*			 for (x in options)
			 {
				 Logger.trace(this._TAG + ", RRR -getOptions- option: " + x + ": " + options[x]);
			 }
*/
			 return options;
		 },

		 getDataStatus: function(){			 
			 return this._dataStatus;
		 },

		 getExecutingStatus: function(){			 
			 return this._executingStatus;
		 },

		 getPosition: function(){			 
			 if (typeof this._position != 'undefined') {
				 return this._position;
			 } else {
				 return null;				 
			 }
		 },		

		 getHeading: function(){			 
			 if (typeof this._heading != 'undefined') {
				 return this._heading;
			 } else {
				 return null;				 
			 }
		 },		

		 _getWatchLocationId: function(){
			 if (typeof this._watchLocationId != 'undefined') {
				 return this._watchLocationId;
			 } else {
				 return null;				 
			 }
		 }
	});
});
