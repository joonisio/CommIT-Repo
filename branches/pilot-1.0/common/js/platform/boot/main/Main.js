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

define("platform/boot/main/Main", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/has",
	     "dojo/when",
	     "platform/ui/DeviceEnv",
	     "platform/ui/util/OrientationManager",
	     "platform/boot/data/PlatformStoresBuilder",
	     "generated/application/data/ApplicationStoresBuilder",
	     "generated/application/ui/ApplicationUIBuilder",
	     "platform/logging/Logger"],
function(declare, lang, has, when, DeviceEnv, OrientationManager,
      PlatformStoresBuilder, ApplicationStoresBuilder, ApplicationUIBuilder, Logger) {
	
	return declare("platform.boot.main.Main", null, {
		
/**@memberOf platform.boot.main.Main */
		start: function(){
			
			Logger.trace('Main started');
			OrientationManager.init();
			
			DeviceEnv.init();

			when(this._buildPlatformStores()).
			then(lang.hitch(this, this._buildApplicationStores)).
			then(lang.hitch(this, this._buildApplicationUI));
		},
		
		_buildPlatformStores: function(){
			var builder = new PlatformStoresBuilder();
			return builder.build();
		},
		
		_buildApplicationStores: function(){
			var builder = new ApplicationStoresBuilder();
			return builder.build();
		},
		
		_buildApplicationUI: function(){
			var builder = new ApplicationUIBuilder();
			return builder.build();
		},
		
		getApplicationUIBuilder: function(){
			return new ApplicationUIBuilder();
		}
		
	});
});
