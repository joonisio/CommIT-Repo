
/* JavaScript content from js/platform/ui/ScreenLockManager.js in folder common */
define(
       "platform/ui/ScreenLockManager",
       ["platform/exception/PlatformRuntimeException",
         "platform/logging/Logger"
       ],
       function (PlatformRuntimeException, Logger) {



           return {

               displayOn_request: null,

/**@memberOf platform.ui.ScreenLockManager */
               keepDisplayAwake: function () {
       
            	   var callbackFnOk = function (message) {
            		   Logger.log('Device display sleep turned off')
            	   };
       
            	   var callbackFnError = function (message) {
            		   Logger.error('Could not turn off device display sleep setting');
            	   };
       
                    if(WL.Client.getEnvironment() == WL.Environment.IPHONE || 
                    		WL.Client.getEnvironment() == WL.Environment.IPAD || 
                    		WL.Client.getEnvironment() == WL.Environment.ANDROID){
                    	cordova.exec(callbackFnOk ,
                    				callbackFnError,
                    				"DisplayManagerPlugin", "keepDisplayAlive", []);
                    	
                    }else if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
                       this.activateDisplay_request();
                   }

               },

               releaseDisplay: function () {
       
            	   var callbackFnOk = function (message) {
            		   Logger.log('Device display sleep setting restored')
            	   };
       
            	   var callbackFnError = function (message) {
            		   Logger.error('Could not restore device display sleep setting');
            	   };
                   
            	   if(WL.Client.getEnvironment() == WL.Environment.IPHONE || 
            			   WL.Client.getEnvironment() == WL.Environment.IPAD || 
            			   WL.Client.getEnvironment() == WL.Environment.ANDROID){
                    	cordova.exec(callbackFnOk ,
                    				callbackFnError,
                    				"DisplayManagerPlugin", "restoreSleepConfig", []);
                    
            	   }else if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
                       this.releaseDisplay_request();
                   }
               },

               /**
                * Windows 8 functions
                */
               activateDisplay_request: function () {
                   if (this.displayOn_request === null) {
                       try {
                           // This call creates an instance of the displayRequest object
                           this.displayOn_request = new Windows.System.Display.DisplayRequest;
                       } catch (e) {
                           Logger.errorJSON("Failed: displayRequest object creation, error: ", e);
                       }
                   }

                   if (this.displayOn_request) {
                       try {
                           // This call activates a display-required request. If successful, 
                           // the screen is guaranteed not to turn off automatically due to user inactivity.
                           this.displayOn_request.requestActive();
                           Logger.log("Display request activate");
                       } catch (e) {
                           Logger.errorJSON("Failed: displayRequest.requestActive", e);
                       }
                   }
               },

               releaseDisplay_request: function () {
                   if (this.displayOn_request) {
                       try {
                           // This call de-activates the display-required request. If successful, the screen
                           // might be turned off automatically due to a user inactivity, depending on the
                           // power policy settings of the system.
                           this.displayOn_request.requestRelease();
                           this.displayOn_request = null;
                           Logger.log("Display request released");
                       } catch (e) {
                           Logger.errorJSON("Failed: displayRequest.requestReleas", e);
                       }
                   }

               },

           };

       });
