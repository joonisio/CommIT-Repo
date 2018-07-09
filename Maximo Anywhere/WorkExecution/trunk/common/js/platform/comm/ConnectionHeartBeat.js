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

define("platform/comm/ConnectionHeartBeat", [
    "exports",
	"dojo/_base/lang", 
	"dojo/Deferred",
	"platform/logging/Logger",
	"platform/store/SystemProperties",
	"platform/comm/_ConnectivityChecker",
	"platform/model/WorklistDataManager",
	"platform/model/WorklistDataUIManager",
	"platform/model/PushingCoordinatorService",
	"platform/model/SystemDataManager",
	 "platform/store/SystemProperties",
	 "platform/util/PlatformConstants",
     "platform/model/AdditionalDataManager",
     "dojo/topic"
	], 
function(thisModule, lang, Deferred, Logger, SystemProperties, ConnectivityChecker, WorklistDataManager, WorklistDataUIManager, PushingCoordinatorService, SystemDataManager, SystemProperties,PlatformConstants, AdditionalDataManager, topic ) {
	
	lang.mixin(thisModule, {
		
/**@memberOf platform.comm.ConnectionHeartBeat */
		initialize: function() {
			var d = new Deferred();
			var self = this;
			self.resetHeartBeatInterval();
			document.addEventListener(WL.Events.WORKLIGHT_IS_CONNECTED, lang.hitch(self, self.connectDetected), false); 
			document.addEventListener(WL.Events.WORKLIGHT_IS_DISCONNECTED, lang.hitch(self, self.disconnectDetected), false);
			// foreground
			document.addEventListener('foreground', lang.hitch(self, function() {
				this.checkConnection().then(function(isConnected) {
					if(isConnected) {
						self.connectDetected();
					}
				});
			}), false);
			d.resolve();
			return d.promise;
		},

		connectDetected: function(event) {
			Logger.trace('[HEARTBEAT] Connect detected');
			topic.publish('isConnected',{'connected' : true});
			this._synchronizeToTheServer()
			.then(lang.hitch(this, function() {
				this.resetHeartBeatInterval();
				Logger.trace('[HEARTBEAT] Time interval has been reset');
			}));
		},
		
		disconnectDetected: function(event) {
			Logger.trace('[HEARTBEAT] Disconnect detected');
			topic.publish('isConnected',{'connected' : false});
		},
		
		setHeartBeatInterval: function(interval) {
			WL.Client.setHeartBeatInterval(interval);
		},
		
		_synchronizeToTheServer: function() {
			/*if(!SystemProperties.getProperty(PlatformConstants.REFRESH_DATA_ON_LOGIN_FLAG)){
				SystemDataManager._downloadSystemDataRefreshOnLogin().then(function(){
						
							SystemProperties.setProperty(PlatformConstants.REFRESH_DATA_ON_LOGIN_FLAG, true, true);
						});
			}*/
			
			var doAutoRefresh = SystemProperties.getProperty('Lookup.data.delta.autorefresh');
			var numberOfTry = SystemProperties.getProperty('Lookup.data.delta.autorefresh.numbers.retry');
			
			if(!AdditionalDataManager.allAdditionalDataDownloaded() && SystemProperties.getProperty('additionalDataDownloadState') == 'error'){
				AdditionalDataManager.performAdditionalDataDownload(false);
			}else if(AdditionalDataManager.getUIManager().checkIfIsSyncTime() && 
					( (doAutoRefresh && (doAutoRefresh == true || doAutoRefresh == 'true'))  && !SystemProperties.getProperty('aDSyncTryCount') || SystemProperties.getProperty('aDSyncTryCount') < numberOfTry)){
				SystemProperties.setProperty('isADSyncRequest', true, true);
				AdditionalDataManager.getUIManager().showStartADConfirmationDialog();
				
			}
			Logger.trace('[HEARTBEAT] _synchronizeToTheServer');
			return PushingCoordinatorService.flush();
		},
		
		/**
		 * There are a couple of reasons identified to do not synchronize data from server.
		 * They are described in defect: 
		 * 99715: Heartbeat should not download data from server
		 */
		_synchronizeFromTheServer: function() {
			Logger.trace('[HEARTBEAT] _synchronizeFromTheServer');
			var worklistDataUIManager = new WorklistDataUIManager(null);
			WorklistDataManager.cleanUp();
			WorklistDataManager._setWorklistDataUIManager(worklistDataUIManager);
			WorklistDataManager.downloadAllDataForAllWorklistResourcesAndQueryBases();
			return WorklistDataManager._overallProcessing;
		},
		
		checkConnection: function() {
			return ConnectivityChecker.checkConnectivityAvailable();
		},
		
		resetHeartBeatInterval: function() {
			this.setHeartBeatInterval(SystemProperties.getHeartBeatInterval());
		}
	});
});
