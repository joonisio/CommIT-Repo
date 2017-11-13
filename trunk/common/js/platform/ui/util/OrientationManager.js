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

define("platform/ui/util/OrientationManager",
      [
       "dojo/_base/array",
       "dojo/_base/lang",
       "dojo/_base/window",
       "dojo/on",
       "platform/logging/Logger",
       "dijit/focus",
       ],
function(array, lang, window, on, Logger, focusUtil) {

   // private to this module
   var hasInitialized = false;

   var allOrientationEventListeners = [];
   var allNativeOrientationEventListeners = [];

   return {
     
/**@memberOf platform.ui.util.OrientationManager */
      init : function() {
         if (!hasInitialized) {
            
            // give the option to delegate the orientation to the native platform for extreme cases like Maps
            if(WL.Client.getEnvironment() == WL.Environment.ANDROID || WL.Client.getEnvironment() == WL.Environment.IPAD || WL.Client.getEnvironment() == WL.Environment.IPHONE) {
               // some devices report wrong orientation using "resize" method
               // safer to delegate to native platform
               cordova.exec(
                     lang.hitch(this, function(message) {
                        Logger.trace("Using orientation: " + message);
                        this._isNativePortrait = (message == "P") ? true : false;
                        Logger.trace("_isNativePortrait: "+this._isNativePortrait);
                        array.forEach(allNativeOrientationEventListeners, function(callback) {
                           callback.onOrientationChanged(message);
                        }, this);
                     }),
                     lang.hitch(this, function(message) {
                        Logger.error("Error getting orientation from Android:" + message);
                        this._isNativePortrait = false;
                     }),
                     "DeviceOrientationPlugin",
                     "SCREEN_ORIENTATION",
                     []);
            }
    		this.resizeTimer;
    		var adapter = this;
            on(window.global, "resize", function() {
            	clearTimeout(adapter.resizeTimer);
            	resizeTimer = setTimeout(adapter.applyResize(), 250);
            });
            hasInitialized = true;
         }
      },

      applyResize : function(){
          var vs = dojo.window.getBox();
          //Need to tolerate small window width changes without firing the orientation manager
          if (!this.lastWindowWidth || Math.abs(this.lastWindowWidth-vs.w)>5) {
             this.lastWindowWidth = vs.w;

             if (focusUtil.curNode && (WL.Client.getEnvironment() == WL.Environment.IPAD || WL.Client.getEnvironment() == WL.Environment.IPHONE)) {
            	 //Need to remove focus from curNode to hide the keyboard on iOS since the screen paints badly
            	 focusUtil.curNode.blur();
            	 //Refocus after timeout
            	 var focusedNode = focusUtil.curNode
                 setTimeout(function() {
                       focusUtil.focus(focusedNode);
                       }, 1000, focusedNode)

             }
             var orientationMode = this.isPortrait() ? "P" : "L";

             array.forEach(allOrientationEventListeners, function(callback) {
                callback.onOrientationChanged(orientationMode);
             }, this);
          }

      },
      
      registerOrientationEventListener : function(orientationEventListener) {
         allOrientationEventListeners.push(orientationEventListener);
      },

      unregisterOrientationEventListener : function(orientationEventListener) {
         var position = array.indexOf(allOrientationEventListeners, orientationEventListener);
         allOrientationEventListeners.splice(position, position + 1);
      },
      
      unregisterAllOrientationEventListeners : function() {
         allOrientationEventListeners.length = 0;
      },
      
      getOrientationEventListenerCount : function() {
         return allOrientationEventListeners.length;
      },
      
      
      registerNativeOrientationEventListener : function(orientationEventListener) {
         allNativeOrientationEventListeners.push(orientationEventListener);
      },

      unregisterNativeOrientationEventListener : function(orientationEventListener) {
         var position = array.indexOf(allNativeOrientationEventListeners, orientationEventListener);
         allNativeOrientationEventListeners.splice(position, position + 1);
      },
      
      unregisterAllNativeOrientationEventListeners : function() {
         allNativeOrientationEventListeners.length = 0;
      },
      
      getNativeOrientationEventListenerCount : function() {
         return allNativeOrientationEventListeners.length;
      },

      isPortrait : function() {
    	  var viewport = dojo.window.getBox();
    	  return  (viewport.h > viewport.w) ? true : false;
     	  
			/* 140942: Remove the following piece of code based on this reason: it canNOT be guaranteed that  native code event will be 
			 * PRIROR to the resize event, and resize event is in turn relying on the native result.
			 * TODO: remove the native code later on.       
         // If the environment is Android then we rely on the platform FIRST to let us know the orientation
         if(WL.Client.getEnvironment() == WL.Environment.ANDROID) {
            return this._isNativePortrait;
         } else {
            var viewport = dojo.window.getBox();
            return (viewport.h > viewport.w) ? true : false;
         }
         */
      },
      
      isNativePortrait : function() {
    	  return this._isNativePortrait;
      }
   };
});
