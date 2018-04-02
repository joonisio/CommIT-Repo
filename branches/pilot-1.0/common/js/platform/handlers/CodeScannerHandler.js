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

define("platform/handlers/CodeScannerHandler", 
[ "dojo/_base/declare",
  "platform/handlers/_ApplicationHandlerBase",
  "platform/logging/Logger",
  "platform/codeScanner/CodeScanner",
  "platform/model/ModelDataSet",
  "platform/model/ModelData",
  "platform/util/PlatformConstants",
  "platform/logging/Logger",
  "platform/codeScanner/BluetoothScanner",
  "dojo/on"
  ],
function(declare, ApplicationHandlerBase, Logger, CodeScanner, ModelDataSet, ModelData, PlatformConstants, Logger, BluetoothScanner, on) {
	
	var laser_scanner = null;
	
	return declare( ApplicationHandlerBase, {
		name: 'CodeScannerHandler',
		scanListener: null,
		subHandler: null,
		viewControl: null,
		onListener: null,
		constructor: function(){
		},
		
		
/**@memberOf platform.handlers.CodeScannerHandler */
		findByScan : function(eventContext){
			if (!this.getScanListener()){
				Logger.error('[CodeScanHandler] No listener to receive scan');
				return;
			}
			
			var self = this;
			var scanner = new CodeScanner("barcode");
			
			scanner.scan().then(function (result) {				
				self.afterScan(result);
			}).otherwise(function(error){
				Logger.error('Scan error: ' + error);
			});
		},
		
		/*
		 * If a parseScan event is defined on the application this function will call it and then 
		 * pass the value to the FindByScan control on the list to have it filter down the list. 
		 */
		//
		afterScan: function(result){
			if (result){
				Logger.trace('[CodeScanHandler.afterSan] received scan results: ' + JSON.stringify(result));
				this.application.showBusy();
				this.application.parseScanResult(result, this.scanListener);
				var scanValue = null;
				if (result.values){
					scanValue = result.values;  //RFID can read in multiple values
				}
				else if (result.text) {
					scanValue = result.text;
				}
				if (scanValue){
					var self = this;
					Logger.trace('[CodeScanHandler.afterSan] calling handleScan with a scan value of: ' + JSON.stringify(scanValue));
					if (this.subHandler)
	                {
	                    if(this.subHandler.handleScan){
		                    this.subHandler.handleScan(scanValue, this.scanListener).always(function(){
		                    	self.application.hideBusy();
		                    });
	                    }
	                    else{
							self.application.hideBusy();
	        				Logger.error('[CodeScanHandler.afterSan] Subhandler does not have a handleScan method so scan was not handled');
	                    }
	                }
					else
	                {
						var scanHandler = this.scanListener;
	                    if(scanHandler.handleScan){
							scanHandler.handleScan(scanValue).always(function(){
								//If false there was a transition to another view so no need to hide busy.
								if(scanHandler.viewControl && !scanHandler.viewControl.transitioningOut){
									self.application.hideBusy();
								}
							});
	                    }
	                    else{
							self.application.hideBusy();
	        				Logger.error('[CodeScanHandler.afterSan] scanListener does not have a handleScan method so scan was not handled');
	                    }
	                }
				} else {
				    //Need to hideBusy if the scan was canceled
					this.application.hideBusy();
				}
			}
		},
		
		resolveLabelWithScan : function(control) {
			if (this.scanListener && this.scanListener.scanResult){
				return [this.scanListener.scanResult];
			}
			else{
				return [''];
			}
		},

		/**
			Allows you to register a handler class a a listener to the code scan.  Then the handler,
			which should extend CodeScannerHandler, and needs to contain the function handleScan
			which takes the scanned in value(s) as a string or an array.  Within handleScan you can
			filter down the list as needed.  handleScan must return a deferred promise
		**/
		registerAsScanListener: function(eventContext){
			this.viewControl = eventContext.viewControl;
			this.registerScanListener(this);
		},

		registerScanListener : function (scanListener) {
			if (WL.Client.getEnvironment() != WL.Environment.PREVIEW)
			{ 
				if (this.scanListener){
					this.removeScanListener();
				}
				var self = this;
				
				//We add this check since in IE event does not bubble up after clear scan unless 
			    //listeners are registered to the document. Hence we send in a null instead 
				//of body selector so that the Bluetooth scanner registers to the document.
				if (WL.Client.getEnvironment() == 'windows8')
				    laser_scanner = new BluetoothScanner();
                else
				    laser_scanner = new BluetoothScanner('body');
				
				laser_scanner.registerScanListener();
				laser_scanner.on('codeScanned', function(scanResult){ 
					
					if(scanResult.scanned){
						self.afterScan(scanResult.result);
					} else {
	
						self.application.showMessage(scanResult.error);
					}
				});
				
				this.onListener = on(scanListener.viewControl.baseWidget, 'BeforeTransitionOut', function(moveTo, dir, transition, context, method) {
	                
	                self.removeScanListener();

	            });
			}
			this.scanListener = scanListener;
		},

		getScanListener: function(){
			if (!this.scanListener){
				//This is needed just in case the barcode button on the list is an extended eventhander class.  The
				//FindbyScan control registers itself with the platform CodeScannerHandler
				var systemScanHandler = this.application['platform.handlers.CodeScannerHandler'];
				if (systemScanHandler){
					this.scanListener = systemScanHandler.scanListener;
				}
			}
			return this.scanListener;
		},
		
		removeScanListener : function (scanListener) {
			if(laser_scanner){
				laser_scanner.removeScanListener();
				laser_scanner = null;
			}
			if(this.onListener){
				this.onListener.remove();
				this.onListener = null;
			}
			this.scanListener = null;
			this.viewControl = null;
		},
		
		clearScan : function (eventContext) {
			//Check for build insures that the scanListener is the FindByScan control
			if (this.scanListener && this.scanListener.build){
				this.scanListener.clearScan();
			}
		}
		
	});
});
