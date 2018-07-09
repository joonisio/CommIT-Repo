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
 * createdBy: lcassa@br.ibm.com 
 * 
 * This class is responsible for communicating with the Java side for WorkOfflinePlugin
 */
define("platform/map/nativeBridge/WorkOfflineNativeBridgeHelper", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/map/nativeBridge/WorkOfflinePlugin",
  "platform/logging/Logger" ], 
function(declare, lang, Deferred, WorkOfflinePlugin, Logger) {
	/**@class platform.map.nativeBridge.WorkOfflineNativeBridgeHelper */
	return declare(null, {
		_WorkOfflineDirections: null,
		
		constructor : function(/*WorkOffline*/ WorkOfflineDirections) {
			this._WorkOfflineDirections = WorkOfflineDirections;
		},
		
		/**@memberOf platform.map.nativeBridge.WorkOfflineNativeBridgeHelper
		 * @parameters Always a JSONArray, ensure you build your JSONArray before using this method
		 */
		request: function(/*JSONArray*/ parameters, /*Deferred*/ deferred) {
			var action = arguments.callee.caller.nom;
			if(typeof deferred == 'undefined') {
				Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] deferred not found");
				WorkOfflinePlugin.sendRequest(this._WorkOfflineDirections, action, parameters);
			}
			else {
				Logger.trace("[platform.map.nativeBridge.NativeBridgeHelper] deferred found!");
				WorkOfflinePlugin.sendRequest(this._WorkOfflineDirections, action, parameters, deferred);
			}
		}
	});
});


