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

// Worklight comes with the jQuery framework bundled inside. If you do not want to use it, please comment out the line below.
window.$ = window.jQuery = WLJQ;
var active_timers = {};

function wlCommonInit(){
	require(["dojo/has", "dojo/promise/instrumentation", "dojo/Deferred", "dojo/aspect", "platform/ui/control/BusyIndicator", "platform/logging/Logger","platform/translation/MessageService",], dojoInit);
	WL.Logger.config({level: 'FATAL'});
}

function dojoInit(has, instrumentation, Deferred, aspect, BusyIndicator, Logger, MessageService) {
	//Workaround for LayoutFactory.js as dojo.require() is gone in dojo 1.9.1
	//FIXME: Remove this line once layout factory is fixed
	dojo.require = function(){};
	
	//This will prevent errors thrown within promises callbacks to be silently swallowed
	//and will output the stacktrace to the console
	has.add("config-useDeferredInstrumentation", "report-rejections");
	//For some reason the has() above stopped instrumenting Deferred automatically
	instrumentation(Deferred);
	
	//Mimicing a global try...catch, so whenever a promise
	//is rejected we hide the loading message to prevent
	//app hangs.
	aspect.before(Deferred, "instrumentRejected", function(error, handled, rejection, deferred) {
		try {
			var timeout = 8; //in seconds
			Logger.error('=== Global promise rejection handling ===');
			Logger.error('=== handled: ' + handled);
			if (error){
				if (error.message){
					Logger.error('=== Error: ' + error.message);
					Logger.error(error.stack);
				}
				else{
					// MM Important: Commented out for performance issue.
					//try{
					//	Logger.error('=== Error: ');// + JSON.stringify(error));
					//}catch (e){
					//	if (error.toString){
					//		Logger.error('=== Error: ' + error.toString());
					//	}
					//	else{
					//		Logger.error('=== Error: Error cannot be shown in log.');
					//	}
					//}
				}
			}
			Logger.trace('Hiding the "Loading..." message in ' + timeout + ' seconds');
			// MM Important: this is final catch of error , generating memory utilization and performance issue , not required to hide here as every long running process implemented there own 
			
			//Wait 8 seconds before hiding the loading message
			//to give it a chance to disappear by normal logic.
			
			if (Object.keys(active_timers).length == 0) {
	            var timeout_id = setTimeout(function () {
	                delete active_timers[timeout_id];
	                BusyIndicator.hide();
	            }, timeout * 1000);
	            active_timers[timeout_id] = true;
	        }
			
		}catch (e){};
	});
	
	
	
	require(["dojo",
	         "platform/boot/main/Main",
	         "platform/logging/Logger"],
		function(dojo, Main, Logger) {
		
			function startApplication(){
				var timeTrack = new TrackTime("Boot Main Start", "dojo.ready", "Launching Main " + this.layoutName, "Yes");
			    timeTrack.startTracking();
				new Main().start();
				timeTrack.stopTracking();
			}
		
			dojo.ready(function() {
				// 119922 - moved from initOptions.js to here
				var currentEnv = WL.Client.getEnvironment();
			    if (currentEnv != WL.Environment.PREVIEW){
			    	var optionsMenu = (WL.OptionsMenu || {init: function(){}});
			    	if(currentEnv != WL.Environment.WINDOWS8 && currentEnv != WL.Environment.WINDOWS_PHONE_8){
			    		optionsMenu.init(); //Makes the settings option menu to be available
			    	}
			    }
				WL.Client.connect({
					onFailure: function(err){
						Logger.errorJSON("[STARTUP] Error connecting to mobilefirst: ", err);
						//Only initialize the application if the Custom Challenge Handler didn't already initialize it (in SSO case) 
						if (!window.UI)
							startApplication();
						//Since we're offline, the challenge handler didn't do the SSOLogin, so need to explicitly call it
						if (window.UI && window.UI.application && window.UI.application.isSSOEnabled()) {
							window.UI.application["platform.handlers.SSOHandler"].performSSOLogin();
						}
					},
					onSuccess: function(){
						if (!window.UI) {
							startApplication();
							//The challenge handler didn't fire so need to check to see whether SSO is Enabled
							if (window.UI && window.UI.application && window.UI.application.isSSOEnabled()) {
								window.UI.application["platform.handlers.SSOHandler"].performSSOLogin();
							}
						}
						
					},
					timeout: 10000
				});
			});
			
			
		}
	);
}

// This method is invoked after loading the main HTML and successful initialization of the Worklight runtime.
function wlEnvInit(){
	wlCommonInit();
	// Environment initialization code goes here
}
