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
 * This class is responsible for communicating with the Java side codeScannerPlugin
 */
define("platform/codeScanner/nativeBridge/NativeBridgeHelper", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/codeScanner/nativeBridge/CodeScannerPlugin",
  "platform/logging/Logger",
  "platform/plugins/PermissionsPlugin"], 
function(declare, lang, Deferred, codeScannerPlugin, Logger, PermissionsPlugin) {
	return declare(null, {
		codeScannerType: null,
		
		constructor : function(/*String*/ codeScannerType) {
			this.codeScannerType = codeScannerType;
		},
		
		/*
		 * @parameters Always a JSONArray, ensure you build your JSONArray before using this method
		 */
/**@memberOf platform.codeScanner.nativeBridge.NativeBridgeHelper */
		request: function(/*JSONArray*/ parameters, /*Deferred*/ deferred) {
			Logger.trace("[platform.codeScanner.nativeBridge.NativeBridgeHelper] Sending request using");
			Logger.trace("[platform.codeScanner.nativeBridge.NativeBridgeHelper] 	codeScannerType: " + this.codeScannerType);
			Logger.trace("[platform.codeScanner.nativeBridge.NativeBridgeHelper] 	action: " + arguments.callee.caller.nom);
			Logger.trace("[platform.codeScanner.nativeBridge.NativeBridgeHelper] 	parameters: " + JSON.stringify(parameters));
			var action = arguments.callee.caller.nom;
			
			PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.CAMERA, [PermissionsPlugin.CAMERA], this, 
				function(action, parameters, deferred) {
					if(typeof deferred == 'undefined') {
						Logger.trace("[platform.codeScanner.nativeBridge.NativeBridgeHelper] deferred not found");
						codeScannerPlugin.sendRequest(this.codeScannerType, action, parameters);
					}
					else {
						Logger.trace("[platform.codeScanner.nativeBridge.NativeBridgeHelper] deferred found!");
						codeScannerPlugin.sendRequest(this.codeScannerType, action, parameters, deferred);
					}
				}, [action, parameters, deferred]);
		},
	});
});


