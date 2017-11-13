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
define("platform/geolocation/GspVerifier",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/Deferred",
 "dojo/_base/array",
 "platform/store/SystemProperties",
 "platform/logging/Logger",
 "platform/map/MapProperties"], 
function(declare, lang, Deferred, arrayUtil, SystemProperties, Logger, MapProperties) {
	return {
		deferred: new Deferred(),
		
/**@memberOf platform.geolocation.GspVerifier */
		doNotAllowClick: function(eventHandler){
			eventHandler.ui.hideCurrentDialog();
			this.deferred.reject("do not allow gps");
		},
		
		allowClick: function(eventHandler){
			localStorage.setItem('gpsLocationPermission', true);
			eventHandler.ui.hideCurrentDialog();
			this.deferred.resolve();
		},
		
		verifyGps: function(eventContext, willUseGpsLocation){
			var deferred = new Deferred();
			
			if(!willUseGpsLocation){
				deferred.reject("will not use gps");
			}
			else if(!MapProperties.getUseGps()){
				//verify if we already gain permission from user
				if(localStorage.getItem('gpsLocationPermission') == true){
					deferred.resolve();
				}
				else{
					localStorage.setItem('gpsLocationPermission', false);
					eventContext.ui.show('Platform.UseCurrentLocationDialog');		
					this.deferred = deferred;
				}
			}
			else{
				deferred.resolve();
			}
			return deferred.promise;
			
		},
	};
});
