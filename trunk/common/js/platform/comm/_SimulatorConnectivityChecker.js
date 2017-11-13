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

define("platform/comm/_SimulatorConnectivityChecker", [
	"dojo/Deferred",
	"dojo/on",
	"dojo/_base/json",
	"platform/logging/Logger", "platform/util/DateTimeUtil", "dojo/topic", "platform/store/SystemProperties"
], function(Deferred, on, jsonUtil, Logger, DateTimeUtil, topic, SystemProperties){

	return {	
		checkConnectivityAvailable: function(skipServer){
			if (this.retryInterval==0) {
         		this.retryInterval = SystemProperties.getConnectivityTimeoutInterval();
         	}
			Logger.timerStart('[COMM] Fetching simulator for connectivity', 1);
			var deferred = new Deferred();
			
			if (this.noOSLCConnectionErrorTime > 0 && DateTimeUtil.absDifferenceInSeconds(this.noOSLCConnectionErrorTime, new Date()) <= this.retryInterval/1000){
				Logger.trace('[ConnectivityChecker] noOCSLServerTimeOut sending false', 2);
				return deferred.resolve(false);
			}
			Logger.trace('[ConnectivityChecker] CLEARING noOCSLServer', 2);
			this.noOSLCConnectionErrorTime = 0;
			if(DateTimeUtil.absDifferenceInSeconds(this.lastTimeConnected, new Date()) <= this.delta){
				deferred.resolve(this.isConnected);
				topic.publish('isConnected',{'connected' : this.isConnected});
				Logger.timerEnd("[COMM] Fetching simulator for connectivity", 1);
			}
			else{
				isConnected = true; //if for some reason we cannot get nwinfo from cordova (e.g. preview as common resource) assume connectivity is there
				if (parent && 
					parent.getService && 
					parent.getService('Network Status')){
					var nwInfo = parent.getService('Network Status').exec('getConnectionInfo');
					isConnected = (nwInfo['message'] !== 'none');
					if(isConnected){
						if (!skipServer)
							this.checkServer(deferred);
						else 
							this._reportConnectionStatus(true, deferred);	
					}else{
						this._reportConnectionStatus(false, deferred);
					}
				} else {
					isConnected = true;
					if (!skipServer)
						this.checkServer(deferred);
					else {
						this._reportConnectionStatus(true, deferred);
					}
    				Logger.timerEnd('[COMM] Fetching simulator for connectivity', 1);
				}
			}						
			return deferred.promise;
		},
		
	};
		
});
