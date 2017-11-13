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

define("platform/store/SystemProperties",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
  "dojo/number",
  "dojo/date/stamp",
 "dojo/promise/all",
 "platform/store/_ResourceMetadataContext",
 "platform/logging/Logger",
 "dojo/Deferred",
 "platform/util/PlatformConstants"], 
function(declare, lang, arrayUtil, numberUtil, dateISOParser, all, ResourceMetadataContext, Logger, Deferred, PlatformConstants) {
	var CommunicationManager = null;	
	var systemPropertiesMap = {};
	var newSystemPropertiesList = [];
	var changedSystemPropertiesList = [];
	var deletedSystemPropertiesList = [];
	
	return {
		
/**@memberOf platform.store.SystemProperties */
		_setProperties: function(jsonRecordSet){
			arrayUtil.forEach(jsonRecordSet, function(jsonRecord){
				propertyName = jsonRecord['json']['propertyName'];
				systemPropertiesMap[propertyName] = jsonRecord;
			});
		},
		
		reset: function(){
			systemPropertiesMap = {};
			this.cleanUp();
		},
		
		getProperty: function(propertyName){
			if (systemPropertiesMap && propertyName in systemPropertiesMap){
				return systemPropertiesMap[propertyName]['json']['propertyValue'];
			}
			return null;
		},
		
		setProperty: function(propertyName, propertyValue, saveNow){
			if (systemPropertiesMap){
				Logger.traceJSON("Set system properties. [INF225445 IN3001]: ", systemPropertiesMap);
				var actualPropertyValue = propertyValue;
				if (propertyValue instanceof Date){
					actualPropertyValue = dateISOParser.toISOString(propertyValue);
				}
				if (!(propertyName in systemPropertiesMap)){
					var newProp = {propertyName: propertyName, propertyValue: actualPropertyValue};
					newSystemPropertiesList.push(newProp);
					systemPropertiesMap[propertyName] = {json: newProp};
				}				
				else{
					changedSystemPropertiesList.push(systemPropertiesMap[propertyName]);
				}
				systemPropertiesMap[propertyName]['json']['propertyValue'] = actualPropertyValue;
				Logger.trace("Saving the property. [INF225445 IN3002]: " + propertyName);
				if (saveNow){
					Logger.trace("Calling save. [INF225445 IN3003]: ");
					return this.save();
				}
			}
		},
		
		deleteProperty: function(propertyName, saveNow){
			deletedSystemPropertiesList.push(systemPropertiesMap[propertyName]);
			delete systemPropertiesMap[propertyName];
			
			if (saveNow){
				return this.save();
			}
		},
		
		save: function(){
			var deferred = new Deferred();
			var self = this;
			this._save(newSystemPropertiesList, 
					changedSystemPropertiesList, 
					deletedSystemPropertiesList).then(function(){
						self.cleanUp();
						deferred.resolve();
			});
			return deferred.promise;
		},
		
		cleanUp: function(){
			Logger.traceJSON("Cleanup - new system properties. [INF225445 IN3007]: ", newSystemPropertiesList);
			Logger.traceJSON("Cleanup - changed system properties. [INF225445 IN3008]: ", changedSystemPropertiesList);
			Logger.traceJSON("Cleanup - deleted system properties. [INF225445 IN3009]: ", deletedSystemPropertiesList);
			delete newSystemPropertiesList;
			delete changedSystemPropertiesList;
			delete deletedSystemPropertiesList;
			newSystemPropertiesList = [];
			changedSystemPropertiesList = [];
			deletedSystemPropertiesList = [];
		},
		
		_save: function(newSystemPropertiesList, changedSystemPropertiesList, deletedSystemPropertiesList){
			//is overriden in PersistenceManager to avoid circular reference
		},
		_ensureCommunicationManagerIsAvailable: function(){
			var deferred = new Deferred();
			if (CommunicationManager){
				deferred.resolve();
				
			} else {
				require(["platform/comm/CommunicationManager"], function(_CommManager){
					CommunicationManager = _CommManager;
					deferred.resolve();
				});
			}
			return deferred.promise;
		},
		
		loadPlatformProperties: function() {
			var self = this;

			var deferred = new Deferred();
			if(!systemPropertiesMap || Object.keys(systemPropertiesMap).length==0){
				this._ensureCommunicationManagerIsAvailable().then(function(){
					CommunicationManager.checkConnectivityAvailable().then(function(connected) {
						if(connected) {
							platformProps = [
							         'si.map.esri.authentication.isEnabled',
							         'si.map.esri.username',
							         'si.map.esri.password',
							         'si.map.esri.routeService',
							         'si.map.esri.token',
									 'si.map.esri.tokenService',
									 'si.map.esri.refererService',
									 'si.map.esri.numberOfRequests',
									 'si.map.esri.isGetMethodEnabled',
							         'si.map.directionsPathWidth',
									 'si.map.directionsPathColor',
									 'si.useGps',
									 'si.GPS.timeout',
									 'si.GPS.highAccuracy',
									 'si.GPS.maximumAge',
									 'si.map.openLayers.maxZoom',
							         'si.device.heartbeat.timeInterval',
						         	 'si.device.connectivity.timeout',
						         	 'si.device.connectivity.timeout.stablepagination',
						         	 'si.device.connectivity.timeout.interval',
						         	 'si.auth.type',
						         	 'si.logLineLimit',
						         	 'si.device.lookupDownloadConfirmation',
						         	 'si.att.proxy.maxfilesize',
						         	 'si.device.downloadAttachmentsWithBulkDownload',
						         	 'si.device.onlyBulkDownloadPrintWithReportAttachments',
						         	 'si.auth.oslcUrl',
						         	 'si.attach.doclink.doctypes.defpath',
						         	 'si.attachment.basedirectory',
						         	 'si.attach.uploadmaxsize',
						         	 'si.attach.filenamelimit',
						         	 'si.worklistSyncDownload',
						         	 'si.worklistSyncDownload.pageSize',
						         	 'si.adminmode',
						         	 'si.device.createdLocallyLimit',
									 'si.wohistory.limitrecords',
									 'checkResoruceEachDataStorageSize',
									 'checkEachDataStorageMaxSize',
									 'Lookup.data.delta.support', 
									 'Lookup.data.delta.autorefresh',  
									 'System.data.delta.support',
									 'Lookup.data.delta.autorefresh.numbers.retry'
						    ];
							// loads in a single request
							CommunicationManager.getSystemProperties(platformProps).then(function(propertiesMap){
								for(var name in propertiesMap){
									self.setProperty(name, propertiesMap[name], false);
								}
								deferred.resolve();
							});
						}
						else {
							deferred.resolve();
						}
					});
				});
			}
			else{
				deferred.resolve();
			} 
			return deferred.promise;
		},
		getLogLineLimit: function() {
			return this.getProperty('si.logLineLimit');
		},
		getHeartBeatInterval: function() {
			var timeInterval = this.getProperty('si.device.heartbeat.timeInterval');
			if(!timeInterval || 
					timeInterval == undefined || 
					timeInterval == NaN || 
					timeInterval == '') {
				timeInterval = 1200; // return 20 minutes
			}
			try {
				return numberUtil.parse(timeInterval);
			}
			catch(e) {
				Logger.log(e);
				return timeInterval;
			}
		},		
		getConnectivityTimeoutInterval: function() {
			var timeout = this.getProperty('si.device.connectivity.timeout.interval');
			if(!timeout || 
					timeout == undefined || 
					timeout == NaN || 
					timeout == '') {
				timeout = 5000; // 5 seconds
			}
			try {
				return numberUtil.parse(timeout);
			}
			catch(e) {
				Logger.log(e);
				return timeout;
			}
		},
		getConnectivityTimeout: function() {
			var timeout = this.getProperty('si.device.connectivity.timeout');
			if(!timeout || 
					timeout == undefined || 
					timeout == NaN || 
					timeout == '') {
				timeout = 3000; // 3 seconds
			}
			try {
				return numberUtil.parse(timeout);
			}
			catch(e) {
				Logger.log(e);
				return timeout;
			}
		},
		
		getConnectivityTimeoutForStablePagination: function() {
			var timeout = this.getProperty('si.device.connectivity.timeout.stablepagination');
			if(!timeout || 
					timeout == undefined || 
					timeout == NaN || 
					timeout == '') {
				timeout = 360000; // 6 minutes
			}
			try {
				return numberUtil.parse(timeout);
			}
			catch(e) {
				Logger.log(e);
				return timeout;
			}
		},
		
		getLastTimeWorkListDownloaded: function(keyName) {
			keyName = keyName || "no-name";
			return this.getProperty("si.device.download.worklist-" + keyName);
		},
		
		updateLastTimeWorkListDownloaded: function(keyName){
			keyName = keyName || "no-name";
			this.setProperty("si.device.download.worklist-" + keyName, new Date(), true);
		},
		getLastTimeoutMoment: function(){
			return this.getProperty("si.device.connectivity.lasttimeout") || 0;
		},
		updateLastTimeoutMomentAsNow: function(){
			this.setProperty("si.device.connectivity.lasttimeout", new Date().getTime(), true);
		},
		
		getAuthType: function() {
			/* auth type must be one of three:
			 * - maximo
			 * - basic (ldap sso)
			 * - form  (ldap)
			 */ 
			var deferred = new Deferred();
			possibleValues = ['maximo','tririga','basic','form'];
			var value = this.getProperty('si.auth.type');
			
			if(!value ||
					value == '' ||
					arrayUtil.indexOf(possibleValues, value) == -1) {
				deferred.resolve('maximo');
			}
			else {
				deferred.resolve(value);
			}
			
			return deferred.promise;
		},
		
		getDownloadAttachmentsSetting: function(){
			if(this.getProperty('si.adminmode') && this.getProperty('si.adminmode') == "false"){
				var downloadAttachmentsSetting = this.getProperty("downloadAttachments");
				if (downloadAttachmentsSetting == null){
					downloadAttachmentsSetting = (this.getProperty(PlatformConstants.BULK_ATTACH_DOWNLOAD) != 'false');
					this.setProperty("downloadAttachments", downloadAttachmentsSetting, true);
				}
				return downloadAttachmentsSetting;
			}else{
				if(typeof this.getProperty(PlatformConstants.BULK_ATTACH_DOWNLOAD) == 'string'){
					return this.getProperty(PlatformConstants.BULK_ATTACH_DOWNLOAD) != 'false';	
				} else {
					return this.getProperty(PlatformConstants.BULK_ATTACH_DOWNLOAD) != false;
				}
				
			}
			
		},
		
		/* Safe initialization/load for SystemProperties
		 * 1. initiates the store
		 * 2. reload the existent properties
		 * 3. load any new property calling this.loadPlatformProperties()
		 */
		initialize: function(credentials) {
			var self = this;
			var deferred = new Deferred();
			require(['platform/store/PersistenceManager'], function(PersistenceManager) {
				PersistenceManager._initSystemPropertiesStore(credentials)
				.then(function() {
					PersistenceManager._reloadSystemProperties()
					.then(function() {
						self.loadPlatformProperties()
						.then(function() { deferred.resolve(); });
					});
				});
			});
			return deferred.promise;
		}
	};
});
