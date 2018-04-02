/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 *
 */
define("platform/geolocation/GeoLocationServiceHelper", 
		["dojo/_base/declare", 
		  "dojo/Deferred",
		  "dojo/_base/lang",
		  "platform/logging/Logger",
		  "platform/translation/MessageService",
		  "platform/geolocation/GspVerifier",
		  "platform/map/MapProperties"], 
		function(declare, Deferred, lang, Logger, MessageService, GspVerifier, MapProperties) {
	
		var GeoLocationServiceHelper = declare(null,{

			_className: "[platform.geolocation.GeoLocationServiceHelper]",
			
/**@memberOf platform.geolocation.GeoLocationServiceHelper */
			gpsDoNotAllowClick: function(eventHandler){
				GspVerifier.doNotAllowClick(eventHandler);
			},
			
			gpsAllowClick: function(eventHandler){
				GspVerifier.allowClick(eventHandler);
			},
			sendGPSToResource : function(eventContext, willUseGpsLocation){
				var gpsTimeout = MapProperties.getGPSTimeout();
				Logger.trace("gpsTimeout: " + gpsTimeout);				
				var gpsHighAccuracy = MapProperties.getGPSHighAccuracy();
				Logger.trace("gpsHighAccuracy: " + gpsHighAccuracy);				
				var gpsMaximumAge = MapProperties.getGPSMaximumAge();
				Logger.trace("gpsMaximumAge: " + gpsMaximumAge);
				//verify if current resource is able to receive locations
				var resource = eventContext.getCurrentRecord();
				
				if(!resource){
					return "this resource is not able to get location.";
				}
				
				var mydeferred = new Deferred();
				GspVerifier.verifyGps(eventContext, willUseGpsLocation).then(function(){
					navigator.geolocation.getCurrentPosition(
					// Returns the device's current position as a Position object.
							
					// Success
					function onSuccess(position) {
						var msg = 'Latitude: '          + position.coords.latitude          + '\n' +
						          'Longitude: '         + position.coords.longitude         + '\n' +
						          'Altitude: '          + position.coords.altitude          + '\n' +
						          'Accuracy: '          + position.coords.accuracy          + '\n' +
						          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
						          'Heading: '           + position.coords.heading           + '\n' +
						          'Speed: '             + position.coords.speed             + '\n' +
						          'Timestamp: '         + position.timestamp                + '\n';
						
						resource.latitudey = position.coords.latitude;
						resource.longitudex = position.coords.longitude;
						
						mydeferred.resolve(resource, msg);
					},
					// (Optional) Failure
					function onError(positionError) {
						switch(positionError.code){
							case positionError.PERMISSION_DENIED:
								var msg = MessageService.createStaticMessage('gpsPermission').getMessage();
								eventContext.ui.showMessage(msg);
								break;
							case positionError.POSITION_UNAVAILABLE:
								var msg = MessageService.createStaticMessage('unableAcquireGPS').getMessage();
								eventContext.ui.showMessage(msg);
								break;
							case positionError.TIMEOUT:
								var msg = MessageService.createStaticMessage('gpsTimeout').getMessage();
								eventContext.ui.showMessage(msg);
								break;
							default:
								var msg = MessageService.createStaticMessage('unableAcquireGPS').getMessage();
								eventContext.ui.showMessage(msg);		
						}
						
						// "positionError" is a PositionError object.
						Logger.log("sendGPSToWO error: "+positionError.message);
						mydeferred.reject("sendGPSToWO error: "+positionError.message);
					},
					{timeout: gpsTimeout, 
					 enableHighAccuracy : gpsHighAccuracy,
					 maximumAge: gpsMaximumAge});
					
				}).otherwise(function(error){
					mydeferred.reject(error);
				});
				
				return mydeferred.promise;
			}
		});
		
		return GeoLocationServiceHelper;
});
