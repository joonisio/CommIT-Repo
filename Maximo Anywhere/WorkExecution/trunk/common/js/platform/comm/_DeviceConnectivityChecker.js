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

define("platform/comm/_DeviceConnectivityChecker", [
	"dojo/Deferred", "platform/logging/Logger", "platform/util/DateTimeUtil", "dojo/topic", "platform/store/SystemProperties"
], function (Deferred, Logger, DateTimeUtil, topic, SystemProperties) {
    
    return {
    	delta: 10, // seconds
        lastTimeConnected: 0,
        noOSLCConnectionErrorTime: 0,
        isConnected: false,
        runningConnect: false,
        //How long to wait after a fail before retrying
        retryInterval: 0,
        
    	checkServer: function(deferred){
    		var selfE=this;
    		//we can not run connect while it does not return yet
    		if(!this.runningConnect){
    			this.runningConnect = true;
	    		//If device has connection then check for WL server using the default time out that is 10 sec
	        	WL.Client.connect({
	        		onSuccess: function(){
	                	selfE.runningConnect = false;
	                	selfE._reportConnectionStatus(true, deferred);
        			},
        			onFailure: function(failureResponse){
        				//If we get a 401 or connection in progress, this might be because of a proxy
        				if (failureResponse && failureResponse.status=='401' 
        					|| (failureResponse && failureResponse.errorCode == 'CONNECTION_IN_PROGRESS')) {
        					selfE.isConnected = true;
        				} else {
        					selfE.isConnected = false;
        				}		
                		selfE.runningConnect = false;
                    	selfE._reportConnectionStatus(selfE.isConnected, deferred);
        			}
	        	});
    		}else{
    			if(deferred){
                	deferred.resolve(this.isConnected);
                }
    		}
    	},
        checkConnectivityAvailable: function (skipServer) {
            	selfC = this;
                var deferred = new Deferred();
                
             	if (this.retryInterval==0) {
             		this.retryInterval = SystemProperties.getConnectivityTimeoutInterval();
             	}
	            try {
	                Logger.timerStart("[COMM] Fetching device for connectivity", 1);
	                if (this.noOSLCConnectionErrorTime > 0 && DateTimeUtil.absDifferenceInSeconds(this.noOSLCConnectionErrorTime, new Date()) <= this.retryInterval/1000) {
	                	Logger.timerEnd("[COMM] Fetching device for connectivity", 1);
	                    return deferred.resolve(false);
	                }
	                else if (DateTimeUtil.absDifferenceInSeconds(this.lastTimeConnected, new Date()) <= this.delta) {
	                    deferred.resolve(this.isConnected);
	                    Logger.timerEnd("[COMM] Fetching device for connectivity", 1);
	                } else {
	                    environment = WL.Client.getEnvironment();
	                    if (environment === WL.Environment.IPHONE || environment === WL.Environment.ANDROID || environment === WL.Environment.WINDOWS8) {
	                        WL.Device.getNetworkInfo(function (networkInfo) {
	                            
	                            if(networkInfo.isNetworkConnected && networkInfo.isNetworkConnected === 'true'){
                            		if (!skipServer)
                            			selfC.checkServer(deferred);
                            		else {
                	                	selfC._reportConnectionStatus(true, deferred);
                            		}
	                            }// for windows8 tablet
	                            else if (navigator.connection.type.toUpperCase() != 'NONE' && navigator.connection.type.toUpperCase() != 'UNKNOWN') {
                                	if (!skipServer)
                                		selfC.checkServer(deferred);
                                	else {
                	                	selfC._reportConnectionStatus(true, deferred);
                            		}
	                            } else {
	                            	selfC._reportConnectionStatus(false, deferred);
	                            }
	                            
	                        });
	                    }
	                    else {
	                        Logger.timerEnd("[COMM] Environment " + environment + " does not support connectivity check, assuming connection is available", 1);
	                        deferred.resolve(true);
	                    }
	                }
	            } catch (e) {
	                Logger.error('[COMM] Error fetching device connectivity' + e);
	                selfC.noOSLCConnection();
	                deferred.resolve(false);
	            }
	            
	            return deferred.promise;
           
        },
        
        _reportConnectionStatus: function(connectionStatus, deferred) {
        	  this.isConnected = connectionStatus;
              topic.publish('isConnected', { 'connected': this.isConnected });
              Logger.timerEnd("[COMM] Fetching device for connectivity", 1);
              Logger.log('[ConnectivityChecker] Server connectivity: ' + connectionStatus);
              if (!connectionStatus)
            	  this.noOSLCConnection();
              else 
            	  this.lastTimeConnected = new Date();
              if (deferred)
            	  deferred.resolve(this.isConnected);
        }
        ,
        noOSLCConnection: function () {
            this.noOSLCConnectionErrorTime = new Date();
            this.isConnected = false;
        },
        resetNoOSLCConnection: function(){
			this.noOSLCConnectionErrorTime = 0;
			this.isConnected = true;
		},  
		isDeviceConnected: function() {
			return this.isConnected;
		}
    };

});
