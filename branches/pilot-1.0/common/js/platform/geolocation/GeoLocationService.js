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

/*
 * @descriptoin: A Location Service the foundation class which use cordova api to get the gps location related parameters 
 * 
 */

define("platform/geolocation/GeoLocationService",
		[ "dojo/_base/declare", "dojo/Deferred", "platform/logging/Logger",
				"platform/exception/PlatformRuntimeException", "dojo/date",
				"dojo/when" ], function(declare, Deferred, Logger,
				PlatformRuntimeException, date, when) {

			(function() {

				// Initializing geo location here. Can be moved to some other
				// place than app startup.
				// If GPS is off on device or location service off on device
				// will generate error
				navigator.geolocation.getCurrentPosition(function(position) {

					Logger.log("GEO Latitude " + position.coords.latitude);

				}, function() {

					// To continue with app startup the error function left
					// blank
					

				}, {
					maximumAge : 0,
					timeout : 99999999,
					enableHighAccuracy : true

				});

				Logger.log("GPS Initialized");

			})();

			// Get altitiude, latitude, longitude behavior
			var position = null;
			var maximum_age = 108000;
			var timeOut = 99999999;
			var enableHigh_Accuracy = true;

			return {

/**@memberOf platform.geolocation.GeoLocationService */
				getGeoLocationAsPromise : function(maximumAge, timeout,
						enableHighAccuracy) {

					var deferred = new Deferred();
					var options = {
						maximumAge : maximumAge || maximum_age,
						timeout : timeout || timeOut,
						enableHighAccuracy : enableHighAccuracy
								|| enableHigh_Accuracy
					};

					var onSuccess = function(position) {
						Logger.log("Geo Position recieved");
						Logger.log(position.coords.latitude
								+ position.coords.longitude);

						self.position = position;
						deferred.resolve(position);
					};

					// onError Callback receives a PositionError object
					//
					var onError = function(position_error) {
						Logger.log("Geo Position error");

						self.position = null;
						var code = '';

						switch (position_error.code) {

						case PositionError.PERMISSION_DENIED:
							code = 'PERMISSION_DENIED';
							break;
						case PositionError.POSITION_UNAVAILABLE:
							code = 'POSITION_UNAVAILABLE';
							break;
						case PositionError.TIMEOUT:
							code = 'TIMEOUT';
							break;
						default:
							code = "Default";

						}

						var exception = new PlatformRuntimeException(code, []);

						deferred.reject(exception.getMessage());

					};

					navigator.geolocation.getCurrentPosition(onSuccess,
							onError, options);

					return deferred.promise;

				},

			/* Required if caching manually */
			/*
			 * positionIsDirtyOrNull : function(allowedAge_inSeconds) { if
			 * (self.position) { if (date.difference(self.position.timestamp,
			 * new Date(), "second") < allowedAge_inSeconds ) { return false } }
			 * 
			 * return true; },
			 * 
			 * getPosition: function() { return this.position; },
			 * 
			 * getPositionAsPromise : function(allowedAge_inSeconds,
			 * successHandler, errorHandler, waitHandler){
			 * 
			 * current_position = null;
			 * 
			 * if (!this.positionIsDirtyOrNull(allowedAge_inSeconds)) {
			 * current_position = self.position; } else { current_position =
			 * this.getGeoLocationAsPromise(); }
			 * 
			 * 
			 * when(current_position, successHandler, errorHandler,
			 * waitHandler); self.position = current_position;
			 *  }
			 */

			};
		});
