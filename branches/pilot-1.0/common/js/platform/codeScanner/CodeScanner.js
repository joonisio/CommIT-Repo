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
 * Abstraction to scan code like barcode or QRcode
 */
define("platform/codeScanner/CodeScanner",
		[ "dojo/_base/declare", 
		  "dojo/Deferred",
		  "platform/codeScanner/nativeBridge/NativeBridgeHelper",
		  "platform/codeScanner/CodeScannerResult",
		  "platform/logging/Logger"], 
		  function(declare, Deferred, NativeBridgeHelper, CodeScannerResult, Logger) {
	return declare(null, {
		/*
		 * codeScannerType define what is the type of scanning the user wants to do
		 * for now we only support "barcode"
		 */
		constructor: function(/*String*/ codeScannerType) {
			this._bridge = new NativeBridgeHelper(codeScannerType);
		},

		/*
		 * request the scan and return a promise
		 * once the promise is resolved the result is of type CodeScannerResult
		 * each type of codeScannerType can have its own CodeScannerResult i.e. BarcodeScannerResult
		 */
/**@memberOf platform.codeScanner.CodeScanner */
		/*<CodeScannerResult ?>*/ scan: function() {
			var deferred = new Deferred();
			Logger.trace("[platform.codeScanner.CodeScanner] scanning code...");
			if (WL.Client.getEnvironment() == WL.Environment.PREVIEW){
				this._fakeScan(deferred);
			}
			else {
				this._bridge.request([], deferred);
			}

			return deferred.promise;
		},

		_fakeScan : function(defferred) {
			var scanResult = new CodeScannerResult();
			scanResult.text = '11430';
			setTimeout(function() {
				defferred.resolve(scanResult);
			}, 500);			
		}
	});
});
