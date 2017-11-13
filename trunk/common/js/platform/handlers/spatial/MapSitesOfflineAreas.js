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

define("platform/handlers/spatial/MapSitesOfflineAreas", 
		[ "dojo/_base/declare",
		  "dojo/promise/all",
		  "platform/model/ModelService", 
		  "platform/model/ModelData",
		  "platform/model/ModelDataSet",
		  "platform/handlers/_ApplicationHandlerBase",
		  "platform/comm/CommunicationManager",
		  "platform/auth/UserManager",
		  "platform/translation/MessageService",
		  "dojo/_base/lang",
		  "platform/exception/PlatformRuntimeException",
		  "platform/warning/PlatformRuntimeWarning",
		  "platform/util/PlatformConstants",
		  "platform/logging/Logger",
		  "platform/map/MapGeoLocation",
		  "platform/map/spatial/MobileMaximoSpatial",
		  "platform/map/spatial/store/MaximoSpatialStore",
		  "platform/map/MapProperties",
		  "dojo/_base/array","dojo/promise/all", "dojo/Deferred",
		  "dojo/date/locale"], 
  function(declare, all, ModelService, ModelData, ModelDataSet, ApplicationHandlerBase, CommunicationManager,
		  UserManager, MessageService, lang, PlatformRuntimeException,
PlatformRuntimeWarning, PlatformConstants, Logger, MapGeoLocation, MobileMaximoSpatial, 
MaximoSpatialStore, MapProperties, array, all, Deferred, locale) {
	return declare(ApplicationHandlerBase, {
		
		mobileMaximoSpatial:null,
		maximoSpatialStore: null,
		userAuthenticationManager : null,
		
		constructor : function ( options ) {
			this.mobileMaximoSpatial = new platform.map.spatial.MobileMaximoSpatial({});
			this.maximoSpatialStore = new platform.map.spatial.store.MaximoSpatialStore();
			require( [
						"platform/auth/UserAuthenticationManager"
					], dojo.hitch( this, function ( authManager ) {
						this.userAuthenticationManager = authManager;
					} ) );
		},
		
		syncCurrentMap: function(eventContext) {
			var currentRecord = eventContext.application.getResource("mapOfflineArea").getCurrentRecord();
			this.application.ui.hideCurrentDialog();
			eventContext.application.showBusy();
			console.log("sync ", currentRecord);
			Logger.trace( "Sync current Map" + currentRecord );
			var promise = this.mobileMaximoSpatial.syncOfflineMap( currentRecord );
			promise.then(lang.hitch(this, function(result) {
				if (result == true) {
					var offlineAreaPromise = this.maximoSpatialStore.getOfflineAreaById( currentRecord.offlineAreaId );
					offlineAreaPromise.then(lang.hitch(this, function(offlineAreas) {
						if (offlineAreas.length > 0) {
							var offlineArea = offlineAreas[0];
							offlineArea.json.lastSync = new Date(new Date().setHours(0,0,0,0));
							var updateAreaPromise = this.maximoSpatialStore.updateOfflineArea( offlineArea );
							updateAreaPromise.then(lang.hitch(this, function() {
								this.initDownLoadOfflineMap( eventContext, true );
								eventContext.application.hideBusy();
							}))	
						}
											
					}));
				} else {
					eventContext.application.hideBusy();
					var resultJson = JSON.parse(result);
	            	var errorjson = resultJson.error;
	            	eventContext.application.showMessage(errorjson.details);
				}
				            	
            }));
		},
		
		deleteCurrentMap: function(eventContext) {
			var currentRecord = eventContext.application.getResource("mapOfflineArea").getCurrentRecord();
			this.application.ui.hideCurrentDialog();
			eventContext.application.showBusy();
			console.log("delete current Map ", currentRecord.offlineAreaId);
			Logger.trace( "Delete current Map " + currentRecord.offlineAreaId );
			var promise = this.mobileMaximoSpatial.deleteOfflineMapAndDestroyReplica( currentRecord );
			promise.then(lang.hitch(this, function(result) {
				Logger.trace( "Delete current Map result " + result );
				console.log("Delete current Map result  ", result);
				if (result == true) {
					var promise = this.initDownLoadOfflineMap( eventContext, true );		
            		promise.then(lang.hitch(this, function() {			            			
		            	eventContext.application.hideBusy();
        			}));
				} else {
					eventContext.application.hideBusy();
					var resultJson = JSON.parse(result);
	            	var errorjson = resultJson.error;
	            	eventContext.application.showMessage(errorjson.details);
				}
				
				            	
            }));
			
			
			
		},
		
		downloadCurrentMap: function(eventContext) {
			var currentRecord = eventContext.application.getResource("mapOfflineArea").getCurrentRecord();
			this.application.ui.hideCurrentDialog();
			console.log("Download current Map ", currentRecord);
			Logger.trace( "Download current Map" + currentRecord );
			var workOrderSet = eventContext.application.getResource("workOrder");
			this.mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			
			CommunicationManager.checkConnectivityAvailable().then(lang.hitch(this, function (isConnectionAvailable) {
			        if (isConnectionAvailable) {
			        	eventContext.application.showBusy();
			        	var offlineAreaId = currentRecord.offlineAreaId;
			            var mapManager = this.mobileMaximoSpatial.mapManager;
			            var offlineAreaSelected = this._getOfflineAreaById( offlineAreaId, mapManager );
			            var promise = this.mobileMaximoSpatial.loadOfflineData( offlineAreaSelected, this.application.ui.baseWidget.domNode );
			            promise.then(lang.hitch(this, function(result) {
			            	if (result == true) {
			            		//Refresh the list after the download
			            		this.mobileMaximoSpatial.esriTileCacheManager.hideProgressBar();
			            		var promise = this.initDownLoadOfflineMap( eventContext, true );		
			            		promise.then(lang.hitch(this, function() {			            			
					            	eventContext.application.hideBusy();
			        			}));				            	
			            	} else {
			            		this.deleteCurrentMap( eventContext );
			            		eventContext.application.hideBusy();
			            		var resultJson = JSON.parse(result);
			            		var errorjson = resultJson.error;
			            		eventContext.application.showMessage(errorjson.details);	
			            		
			            	}
			            }));
			        }
			        else {
			        	eventContext.application.showMessage(MessageService.createStaticMessage('deviceIsOffline').getMessage());						
			        }
			    }));
		},
		
		_getOfflineAreaById: function(offlineAreaId, mapManager) {
			var mapSite = mapManager.currentMapSite;
			var offlineAreaSelected = null;
			if ( mapSite ) {
				var offlineAreas = mapSite['spi_spatial:oslcofflinearea'];
				array.forEach( offlineAreas, lang.hitch( this, function ( offlineArea ) {						
					if (offlineArea['spi_spatial:oslcofflineareaid'] == offlineAreaId) {
						offlineAreaSelected = offlineArea;
					}						
				} ) );					
			} 
			return offlineAreaSelected;
		},
		
		downloadDeleteOrSyncOfflineArea: function(eventContext) {
			var currentRecord = eventContext.getCurrentRecord();
			if (currentRecord.isDownloaded == true) {
				eventContext.ui.show('Platform.DeleteOrSyncCurrentRecord');
			} else {				
				eventContext.ui.show('Platform.DownloadCurrentRecord');
				
			}
			
			
			
			
		},
		
		showDownloadMapMenu: function(eventContext) {
			var provider = MapProperties.getProperty('provider');
			var workOrderSet = eventContext.application.getResource("workOrder");
			this.mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			if (this.mobileMaximoSpatial != null) {
				if (provider == "mxspatial") {
					eventContext.setDisplay(true);
				} else {
					eventContext.setDisplay(false);
				}
			} else {
				//Map didn't load yet
				eventContext.setDisplay(false);
			}
						
		},
		
		switchToOfflineEnable: function(eventContext) {
			var provider = MapProperties.getProperty('provider');
			var workOrderSet = eventContext.application.getResource("workOrder");
			this.mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			if (this.mobileMaximoSpatial != null) {
				if (provider == "mxspatial") {
					eventContext.setDisplay(this.mobileMaximoSpatial.showingOnlineMap);
				} else {
					eventContext.setDisplay(false);
				}	
			} else {
				//Map didn't load yet
				eventContext.setDisplay(false);
			}
			
						
		},
		
		switchToOnlineEnable: function(eventContext) {
			var provider = MapProperties.getProperty('provider');
			var workOrderSet = eventContext.application.getResource("workOrder");
			this.mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			if (this.mobileMaximoSpatial != null) {
				if (provider == "mxspatial") {
					eventContext.setDisplay(!this.mobileMaximoSpatial.showingOnlineMap);
				} else {
					eventContext.setDisplay(false);
				}
			} else {
				//Map didn't load yet
				eventContext.setDisplay(false);
			}
		},
		
		ignoreExpiredDataAndKeepLoading: function(eventContext) {
			this.application.ui.hideCurrentDialog();
			this.switchMap( eventContext );
		},
		
		switchMap: function(eventContext) {
			var workOrderSet = eventContext.application.getResource("workOrder");
			this.application.ui.hideCurrentDialog();
			eventContext.application.showBusy();
			this.mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			if (this.mobileMaximoSpatial.showingOnlineMap) {
				this.mobileMaximoSpatial.loadOfflineMap().then(lang.hitch(this, function(loaded) {
					eventContext.application.hideBusy();
					if (loaded == false) {
						var promises = this.mobileMaximoSpatial.loadOnlineMap();
						promises.then(lang.hitch(this, function() {
							this.maximoSpatialStore.updateMapConfig( this.mobileMaximoSpatial.showingOnlineMap );
						}));
					} else {
						this.maximoSpatialStore.updateMapConfig( this.mobileMaximoSpatial.showingOnlineMap );
						if(loaded == "showExpiredWindow") {
							eventContext.ui.show('Platform.SyncRequired');	
						}
						
					}				
					
				}));
				
			} else {
				var promises = this.mobileMaximoSpatial.loadOnlineMap();
				promises.then(lang.hitch(this, function() {
					eventContext.application.hideBusy();
					this.maximoSpatialStore.updateMapConfig( this.mobileMaximoSpatial.showingOnlineMap );
				}));
			}
			
		},
		_createOfflineAreasList: function(coordinate, eventContext, refreshView, deferred) {
			var workOrderSet = eventContext.application.getResource("workOrder");
			this.mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			if (this.mobileMaximoSpatial != null) {
				var mapManagerInfo = this.mobileMaximoSpatial.mapManager;
				
				Logger.trace( "Mapmanager Data" + mapManagerInfo );
				var mapSite = mapManagerInfo.currentMapSite;
				var offlineAreaSelected = null;
				var promisses = [];
				if ( mapSite ) {
					var offlineAreas = mapSite['spi_spatial:oslcofflinearea'];
					var mapOfflineArea = eventContext.application.getResource("mapOfflineArea");
					if (mapOfflineArea.data.length>0) {
						mapOfflineArea.data = [];
					}
					var currentIndex = 0;
					var offlineAreaItems = [];
					array.forEach( offlineAreas, lang.hitch( this, function ( offlineArea, i ) {
						var extent = JSON.parse(offlineArea['spi_spatial:mblextent']).extent;						
						var boundingExtend = ol.extent.boundingExtent(extent[0]);
						if (coordinate != null) {
							var isDefaultArea = ol.extent.containsCoordinate(boundingExtend, coordinate);
							if (isDefaultArea == true) {
								currentIndex = i;
							}	
						}
						
						console.log(offlineArea, isDefaultArea);
						
						var mapOfflineAreaDisp = mapOfflineArea.createNewRecord();
						var offlineAreaName = offlineArea['spi_spatial:mblareaname'];
						mapOfflineAreaDisp.set('offlineAreaName', offlineAreaName);
						mapOfflineAreaDisp.set('offlineAreaId', offlineArea['spi_spatial:oslcofflineareaid']);
						var downloadSize = offlineArea['spi_spatial:downloadsizemb'];
						if (downloadSize != null) {
							mapOfflineAreaDisp.set('downloadSizeMB', Number(downloadSize).toFixed(2) + " MB");
						}					
						
						var promisse = this.maximoSpatialStore.getOfflineAreaByName( offlineAreaName );
						promisses.push( promisse );
						
						if (isDefaultArea == true) {
							mapOfflineAreaDisp.set('cssShowCurrentLocation', 'showCurrentLocMapOffline');
							mapOfflineAreaDisp.set('locdesc', MessageService.createResolvedMessage("currentLocation", []));
						} else {
							mapOfflineAreaDisp.set('cssShowCurrentLocation', 'hideCurrentLocMapOffline');
						}
						offlineAreaItems.push(mapOfflineAreaDisp);
						
					} ) );
					
					all(promisses).then(function(results) {
						array.forEach( results, lang.hitch( this, function ( result, i ) {
							var offlineAreaItem = offlineAreaItems[i];
							if (result.length > 0) {
								offlineAreaItem.isDownloaded = true;
								offlineAreaItem.set('downloadedImg', 'calibrationpoint_normal_status');
								offlineAreaItem.set('cssShowLastSync', 'showLastSync');
								
								var lastSync = new Date(result[0].json.lastSync);
								var syncDaysToExpire = Number(MapProperties.getProperty('si.map.esri.syncDaysToExpire'));
								var lastSyncDateLabel = locale.format(lastSync,{
								    selector: "date",
								    formatLength: "short"
								  });
								var lastSyncMessage = MessageService.createResolvedMessage('lastSyncLabel', [lastSyncDateLabel]);
								
								if (syncDaysToExpire > 0) {
									var dateToExpire = new Date(lastSync);
									dateToExpire.setDate(lastSync.getDate() + syncDaysToExpire);
									var today = new Date();
									
									if (dateToExpire >= today) {									
										var msPerDay = 1000 * 60 * 60 * 24;
										var utc1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
										var utc2 = Date.UTC(dateToExpire.getFullYear(), dateToExpire.getMonth(), dateToExpire.getDate());
										var daysToExpire = Math.floor((utc2 - utc1) / msPerDay);
										lastSyncMessage = lastSyncMessage + " - " + MessageService.createResolvedMessage('lastSyncExpires', [daysToExpire]);
									} else {
										lastSyncMessage = lastSyncMessage + " - " + MessageService.createResolvedMessage('lastSyncExpired', []);
									}
								}
								offlineAreaItem.set('lastSync', lastSyncMessage);
							} else {
								offlineAreaItem.isDownloaded = false;
								offlineAreaItem.set('downloadedImg', 'icon_download');
								offlineAreaItem.set('cssShowLastSync', 'hideLastSync');
							}
						}));
						deferred.resolve();
					});
					
					if(mapOfflineArea.data.length>0){
						mapOfflineArea.setCurrentIndex(currentIndex);
					}
				} 
				if (refreshView == true) {
					this.ui.getCurrentViewControl().refresh();
				} else {
					eventContext.application.ui.show('MapView.downloadOfflineArea');
				}				
				eventContext.application.hideBusy();
			} else {
				eventContext.application.hideBusy();				
				eventContext.application.showMessage(MessageService.createResolvedMessage('noMapManagerFound', [this.userAuthenticationManager.currentUserSite]));
			}
			
			
		},
		
		initDownLoadOfflineMap : function(eventContext, refreshView) {	
			var deferred = new Deferred();
			
			this.application.ui.hideCurrentDialog();
			CommunicationManager.checkConnectivityAvailable().then(lang.hitch(this, function(hasConnectivity){
				eventContext.application.showBusy();
				if (hasConnectivity){
					
					if (this.mobileMaximoSpatial.showingOnlineMap == true) {
						this._createOfflineAreasList(null, eventContext, refreshView, deferred);
					} else {
						eventContext.application.showMessage(MessageService.createStaticMessage('runningOfflineMode').getMessage());
						eventContext.application.hideBusy();
					}
					
				
				}
				else{
					eventContext.application.showMessage(MessageService.createStaticMessage('deviceIsOffline').getMessage());
					eventContext.application.hideBusy();
				}
			}));
					
			return deferred.promise;
			
			
			
		}
		
					
	});
});
