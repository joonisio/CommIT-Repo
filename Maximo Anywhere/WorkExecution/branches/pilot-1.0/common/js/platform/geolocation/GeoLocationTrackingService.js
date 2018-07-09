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
define("platform/geolocation/GeoLocationTrackingService", 
		["dojo/_base/declare", 
		  "dojo/Deferred",
		  "dojo/_base/lang",
		  "platform/logging/Logger"], 
		function(declare, Deferred, lang, Logger) {
	
		var GeoLocationTrackingService = declare(null,{

			_className: "[platform.geolocation.GeoLocationTrackingService]",
			_failureCount: 0,
			_threshold: 5,
			_watchId: null,
			_callbackOnSuccessFunction: null,
			_callbackOnErrorFunction:null,
			_callbackOptions:null,
			
			stopGpsTracking: function(){
				Logger.log(this._className+" - stopping tracking.");
				navigator.geolocation.clearWatch(this._watchId);
				this._callbackOnSuccessFunction = null;
				this._callbackOnErrorFunction = null;
				this._callbackOptions = null;
			},
			
			startGpsTracking : function(onSuccess, onError, options){
				var self = this;
				
				if (typeof onSuccess != "function" || typeof onError != "function"){
					Logger.log(self._className+" - error, callbacks need to be valid functions.");
					return;
				}
				
				self._callbackOnSuccessFunction = onSuccess;
				self._callbackOnErrorFunction = onError;
				self._callbackOptions = options;
				
				Logger.log(self._className+" - starting tracking.");
				this._watchId = navigator.geolocation.watchPosition(
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
						Logger.log(self._className+" - onSuccess:"+msg);
						self._callbackOnSuccessFunction(position);
					},
					// (Optional) Failure
					function onError(positionError) {
						Logger.log(self._className+" - onError: "+positionError.message);
						self._callbackOnErrorFunction(positionError);
						
						//increase our failure counter
						self._failureCount++;
						
						if(self._failureCount >= self._threshold){
							//limit trials exceeded
							self.stopGpsTracking();
						}
					},self._callbackOptions
				);
			},
			
			getCurrentGPSPosition : function(onSuccess, onError, options){
				var self = this;
				
				if (typeof onSuccess != "function" || typeof onError != "function"){
					Logger.log(self._className+" - error, callbacks need to be valid functions.");
					return;
				}
				
				self._callbackOnSuccessFunction = onSuccess;
				self._callbackOnErrorFunction = onError;
				self._callbackOptions = options;
				
				Logger.log(self._className+" - get current GPS position.");
				navigator.geolocation.getCurrentPosition(
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
						Logger.log(self._className+" - onSuccess:"+msg);
						self._failureCount = 0 ; //Reset failure counter on success callback
						self._callbackOnSuccessFunction(position);
					},
					// (Optional) Failure
					function onError(positionError) {
						Logger.log(self._className+" - onError: "+positionError.message);
						self._callbackOnErrorFunction(positionError);
						
						//increase our failure counter
						self._failureCount++;
						
						if(self._failureCount >= self._threshold){
							//limit trials exceeded
							self.stopGpsTracking();
						}
					},self._callbackOptions
				);
			}
		});
		
		return GeoLocationTrackingService;
});
