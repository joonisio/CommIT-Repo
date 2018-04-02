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
 * @descriptoin: GPS Handler that provides an interface to consume GPS services.
 * 
 * 
 */

define(
		"platform/handlers/GeoLocationHandler",
		[ "dojo/_base/declare", "dojo/Deferred",
				"platform/handlers/_ApplicationHandlerBase",
				"platform/geolocation/GeoLocationService",
				"platform/logging/Logger" ],
		function(declare, Deferred, ApplicationHandlerBase, GeoLocationService,
				Logger) {

			postion = null;
			allowedAge_inSeconds = 900;

			return {
				name : 'GeoLocationHandler',

/**@memberOf platform.handlers.GeoLocationHandler */
				returnVar : function(value) {
					return value;
				},

				showLocationServiceConfirmDialog : function() 
				{
					// TODO : LocationService - some organization do not allow
					// to capture location of the users and that case we might
					// have to show dialog to make sure they confirm
					// TODO : LocationService - based on conformation it will
					// update local storage for using location service or not
					// TODO : LocationService - customer can completely disable
					// location service , so required property to check , if
					// there is a location service allow or not , if it is allow
					// then this confermation dialog will provide choice to
					// users about they are ok to capture x and y coordinate of
					// the location
					
					
				},
				showGPSLocationOFFDialog : function() 
				{
					// if GPS is not on and location service is on to caputure , show the dialog to ask them to enable gps  
					//TODO : LocationService - some organization do not allow
					// to capture location of the users and that case we might
					// have to show dialog to make sure they confirm , 
					
					
				},				
				enableLocationService : function () 
				{
					// TODO : LocationService - some organization do not allow
					// to capture location of the users and that case we have to enable location service
				},
				disableLocationService : function () 
				{
					// TODO : LocationService - some organization do not allow
					// to capture location of the users and that case we might disable lcoation service 				
				},
				
				// Always us this and get positio as a whole object.
				getPositionAsPromise : function() {
					var deferred = new Deferred();

					var onSuccess = function(position) {

						deferred.resolve(position);

					};

					// onError Callback receives a PositionError object
					//
					var onError = function(message) {

						deferred.reject(message);

					};

					GeoLocationService.getGeoLocationAsPromise().then(
							onSuccess, onError);
					// GeoLocationService.getPositionAsPromise(allowedAge_inSeconds,
					// onSuccess, onError);

					return deferred.promise;
				},
				// Provides the Latitude
				getLatitudeAsPromise : function() {
					var deferred = new Deferred();

					var onSuccess = function(position) {

						deferred.resolve(position.coords.latitude);

					};

					// onError Callback receives a PositionError object
					//
					var onError = function(position_error) {

						deferred.reject(position_error);

					};

					GeoLocationService.getPositionAsPromise(
							allowedAge_inSeconds, onSuccess, onError)

					return deferred.promise;
				},
				// Provides the Longitude
				getLongitude : function(successHandler, errorHandler,
						waitHandler) {

					GeoLocationService.getPositionAsPromise(
							allowedAge_inSeconds, successHandler
									|| function(position) {
										return position.coords.longitude;
									});

				},
				// Provides the XCorrdinate
				getXCoordinateAsPromise : function() {

				},
				// Provides the YCorrdinate
				getYCoordiateAsPromise : function() {

				},
				// Provides the ZCorrdinate
				getZCoordinateAsPromise : function() {

				},
				// Provides the Altitude
				getAltitude : function() {

					getGeoLocationAsPromise.then(function(position) {

						return position.coords.altitude;

					}).otherwise(function(error) {

						return error.message;

					});

				},
				// Provides the Accuracy
				getAccuracy : function() {

					getGeoLocationAsPromise.then(function(position) {

						return position.coords.accuracy;

					}).otherwise(function(error) {

						return error.message;

					});

				},
				// Provides the AltitudeAccuracy
				getAltitudeAccuracy : function() {

					getGeoLocationAsPromise
							.then(
									function(position) {

										return position.coords.position.coords.altitudeAccuracy;

									}).otherwise(function(error) {

								return error.message;

							});

				},
				// Provides the Heading
				getHeading : function() {

					getGeoLocationAsPromise.then(function(position) {

						return position.coords.heading;

					}).otherwise(function(error) {

						return error.message;

					});

				},
				// Provides the Speed
				getSpeed : function() {

					getGeoLocationAsPromise.then(function(position) {

						return position.coords.speed;

					}).otherwise(function(error) {

						return error.message;

					});

				},
				// Provides the TimeStemp
				getTimeStemp : function() {

					getGeoLocationAsPromise.then(function(position) {

						return position.timestamp;

					}).otherwise(function(error) {

						return error.message;

					});

				},
				

			};

		});
