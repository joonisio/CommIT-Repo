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

define("platform/ui/DeviceEnv",
      [
       "dojo/_base/declare",
       "dojo/_base/lang",
       "platform/ui/layout/LayoutUtil",
       "platform/logging/Logger"
       ],
function(declare, lang, LayoutUtil, Logger) {

   var DeviceEnv = declare("platform.ui.DeviceEnv", [], {
      
/**@memberOf platform.ui.DeviceEnv */
      init : function(args) {
    	 if(args){
    		 this.args = args;
    	 }
    	  
         if(WL.Client.getEnvironment() == WL.Environment.ANDROID) {

            // determine the layout size from native Android, more accurate
            // this is an async call but app still needs to load alot more
            cordova.exec(
                  lang.hitch(this, function(message) {
                     this.setLayoutSize(message);
                     Logger.trace("Using Layout Size: " + message);
                  }),
                  lang.hitch(this, function(message) {
                     Logger.log("Error getting layout size from Android:" + this.getLayoutSize());
                  }),
                  "DeviceEnvPlugin",
                  "SCREENLAYOUT_SIZE",
                  []);

            cordova.exec(
                  lang.hitch(this, function(message) {
                     this.setScreenDensity(message);
                     Logger.trace("Using Screen Density: " + this.getScreenDensity());
                  }),
                  lang.hitch(this, function(message) {
                     Logger.log("Error getting screen denisty from Android:" + message);
                  }),
                  "DeviceEnvPlugin",
                  "SCREEN_DENSITY",
                  []);

         } else if (WL.Client.getEnvironment() == WL.Environment.PREVIEW) {
            // application is on a non-mobile device, not as accurate
            var layoutUtil = new LayoutUtil(this.args);
            this.setLayoutSize(layoutUtil.calculateLayoutScreenSize());
            Logger.trace("Using Layout Size: " + this.getLayoutSize());

            // default to medium for now
            this.setScreenDensity("mdpi");
            Logger.trace("Using Screen Density: " + this.getScreenDensity());

         } else if (WL.Client.getEnvironment() == WL.Environment.IPAD 
        		    || WL.Client.getEnvironment() == WL.Environment.IPHONE) {
             // TODO: fail over to mobile preview, but need to update cordoba plugin to support iPad
             Logger.log("iPhone or iPad detected");
        	 var layoutUtil = new LayoutUtil(this.args);
             this.setLayoutSize(layoutUtil.calculateLayoutScreenSize());
             Logger.trace("Using Layout Size: " + this.getLayoutSize());

             // default to medium for now
             this.setScreenDensity("mdpi");
             Logger.trace("Using Screen Density: " + this.getScreenDensity());
         }else {
            Logger.log("DeviceEnv.js - I don't know how to handle layout size for: " + WL.Client.getEnvironment());
         }
      },
      
      setLayoutSize : function(newSize) {
         window['layoutSize'] = newSize;
      },
      
      setScreenDensity : function(newDensity) {
         window['screenDensity'] = newDensity;
		if(this.args && this.args.application){
			var resource = this.args.application.getResource('DeviceSizeResource');
			if(resource){
				var record = resource.getCurrentRecord();
				if(record){
					record.set('density', newDensity); 
				}
			}
		}
      },
      
      getLayoutSize : function(element) {
    	 if(element){
    		 var layoutUtil = new LayoutUtil(this.args);
    		 return layoutUtil.calculateLayoutScreenSize(element);
    	 }
         if (!window['layoutSize']) {
            this.setLayoutSize("medium");
         }
         return window['layoutSize'];
      },
      
      getScreenDensity : function() {
         if (!window['screenDensity']) {
            this.setScreenDensity("mdpi");
         }
         return window['screenDensity'];
      }
   });
   
   // this is only ever created once, so it's a singleton
   return new DeviceEnv();   
});
