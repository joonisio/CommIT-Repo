/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2017 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/handlers/WOGeolocationHandler", 
		[ "dojo/_base/declare",
		  "platform/handlers/_ApplicationHandlerBase",
		  "dojo/Deferred", 
		  "dojo/_base/lang", 
		  "platform/logging/Logger",
		  "platform/translation/MessageService",
		  "platform/map/MapProperties",
		  "platform/model/ModelService",
		  "platform/geolocation/GeoLocationTrackingService",
		  "platform/comm/CommunicationManager"],
		function(declare, ApplicationHandlerBase, Deferred, lang, Logger, MessageService, 
				MapProperties,ModelService,GeoLocationTrackingService,CommunicationManager) {
	
			return declare (ApplicationHandlerBase, {
				
				name : 'WOGeolocationHandler',
				
				setWOValue : null ,
				laborcode : null ,
				labororg : null,
				lbsinterval : 0,
				refObject : null,
				wonum : null,	
				wositeid : null,	
				wobasedlocationtracking : false,
				messageThreshold : 2000,
				crewid : null,
				offlineLineCounter : 0,

				initialize : function (eventContext) {
					
					this.lbsinterval = this._getLBSInterval(eventContext);
					Logger.log("LBS Interval Value :: " + this.lbsinterval);
					
					var gpsHighAccuracy = MapProperties.getGPSHighAccuracy();		
					var gpsTimeOut = MapProperties.getGPSTimeout();
					var gpsMaximumAge = MapProperties.getGPSMaximumAge();
					
					var that = this;
					
					this._createGPSLocalStore(eventContext);
					
					var isTrackingEnabled = eventContext.application.isFeatureEnabled("gps.tracking.enable");
					
					if (this.lbsinterval > 0 && !isTrackingEnabled) {
						var msg = MessageService.createStaticMessage('GPSAppFeatureNotEnabled').getMessage();
						eventContext.ui.showMessage(msg);
					}
					
					if (this.lbsinterval > 0 && isTrackingEnabled) {
						
						var gpsWatchObject = new GeoLocationTrackingService();

						gpsWatchObject.startGpsTracking(
							this._onSuccessWatchPosition,
							this._errorCallback.bind(eventContext),
							{
								maximumAge: gpsMaximumAge,
							    timeout: gpsTimeOut ,
							    enableHighAccuracy: gpsHighAccuracy
							}
		                );
						
						this._startTimer();
					}

				},
				
				/*
				 *  watch position on success event handler to capture lat/long
				 */
				
				_onSuccessWatchPosition : function (position) {
					
					Logger.log("success :: " +  position.coords.latitude + ", " + position.coords.longitude);
					
					var gpsLocalStoreSet = window.UI.application.getResource('PlatformGeolocationLocalStore');
					var gpsLocalStore = gpsLocalStoreSet.getRecordAt(0) ;

					if (gpsLocalStore) {
						
						gpsLocalStore.set('longitudex', position.coords.longitude);
						gpsLocalStore.set('latitudey', position.coords.latitude);
						
						Logger.log("Got successfully watch position co-ordinates ");
						
						ModelService.save(gpsLocalStoreSet);
					}					
				},
				
				isGPSTrackingActivate : function (eventContext) {
					var isTrackingEnabled = eventContext.application.isFeatureEnabled("gps.tracking.enable");
					return isTrackingEnabled;
				},
				
				/*
				 * function to get labor lbsinterval.
				 */
						
				_getCurrentUserLaborLBSInterval : function(eventContext) {
					
					var currentUserLaborSet = eventContext.application.getResource("mylabor");

					if (currentUserLaborSet.count() > 0 ) {
						var currentUserLabor = currentUserLaborSet.getRecordAt(0);
						var laborinterval =  currentUserLabor.get("lbsinterval");
						
						this.laborcode = currentUserLabor.get("laborcode");
						this.labororg = currentUserLabor.get("orgid");
						
						if (laborinterval > 0) {
							this.refObject = "LABOR" ;
							this.wobasedlocationtracking = currentUserLabor.get("lbsdatafromwo");
							
							return laborinterval;
						} else {
							return 0 ;
						}
					}
				},
				
				/*
				 * function to crew lbsinterval
				 */

				_getCurrentUserLaborCrewLBSInterval : function(eventContext) {
					
					var currentUserLaborCrewSet = eventContext.application.getResource("laborcrew");

					if (currentUserLaborCrewSet.count() > 0 ) {
						var currentUserLaborCrew = currentUserLaborCrewSet.getRecordAt(0);
						var laborcrewinterval =  currentUserLaborCrew.get("lbsinterval");
					
						if (laborcrewinterval && laborcrewinterval > 0) {
							this.refObject = "AMCREW" ;
							this.wobasedlocationtracking = currentUserLaborCrew.get("lbsdatafromwo");
							this.crewid = currentUserLaborCrew.crewid;
							return laborcrewinterval;
						} else {
							return 0 ;
						}
					}
				},
				
				/*
				 *  function to get lbsinterval depending labor and crew setup
				 */
				
				_getLBSInterval : function(eventContext) {
					var laborLBSInterval = this._getCurrentUserLaborLBSInterval(eventContext);
					var laborCrewLBSInterval = this._getCurrentUserLaborCrewLBSInterval(eventContext);
					
					if (laborCrewLBSInterval > 0 ) {
						return laborCrewLBSInterval;
					} else {
						return laborLBSInterval;
					}
				},
				
				/*
				 *  function work number details, to be invoked by startTimer function
				 */
				
				setLBSLocationWorkNumber : function (workOrder) {
					if (workOrder) {
						Logger.log(" Work Order Number :: " + workOrder.get("wonum") + " :: " + workOrder.get("siteid"));
										
						var gpsLocalStoreSet = window.UI.application.getResource('PlatformGeolocationLocalStore');
						var gpsLocalStore = gpsLocalStoreSet.getRecordAt(0) ;

						if (gpsLocalStore) {
							
							gpsLocalStore.set("wonum",workOrder.get("wonum"));
							gpsLocalStore.set("wositeid",workOrder.get("siteid"));
							
							Logger.log("Set Value :: " + gpsLocalStore.get("wonum") + " :: " + gpsLocalStore.get("wositeid"));
							
							ModelService.save(gpsLocalStoreSet);
						
						}	
					}
				},
				
				/*
				 *  clear work number, function to be invoked by stopTimerHandler
				 */
				
				clearLBSLocationWorkNumber : function () {

					var gpsLocalStoreSet = window.UI.application.getResource('PlatformGeolocationLocalStore');
					var gpsLocalStore = gpsLocalStoreSet.getRecordAt(0) ;

					if (gpsLocalStore) {
						
						gpsLocalStore.set("wonum","");
						gpsLocalStore.set("wositeid","");
						
						Logger.log("Cleared Value :: " + gpsLocalStore.get("wonum") + " :: " + gpsLocalStore.get("wositeid"));
						
						ModelService.save(gpsLocalStoreSet);
					}
				},
				
				/*
				 *  function to sent Maximo lbsiocation information
				 */
				
				_sendGPSToLBSLocation : function() {
					
					var gpsLocalStoreSet = window.UI.application.getResource('PlatformGeolocationLocalStore');
					var gpsLocalStore = gpsLocalStoreSet.getRecordAt(0) ;
					
					var that = this ;
					
					this._getWODetails  () ;
					
					if (this.offlineLineCounter < this.messageThreshold && gpsLocalStore) {
						
						if (gpsLocalStore.get("longitudex") && gpsLocalStore.get("latitudey") ) {
					
							ModelService.empty('lbslocation', null,null, true).then(function (lbsLocationSet) {
		
								var lbsLocation = lbsLocationSet.createNewRecord();
								lbsLocation.set('refobject', that.refObject);
								lbsLocation.set('key1', that.labororg);
								if (that.refObject == "AMCREW") {
									lbsLocation.set('key2', that.crewid);
								} else {
									lbsLocation.set('key2', that.laborcode);
								}
								
								lbsLocation.set('longitude', gpsLocalStore.get("longitudex"));
								lbsLocation.set('latitude', gpsLocalStore.get("latitudey"));
								
								if (that.wonum && that.wonum != "" && that.wobasedlocationtracking) {
									lbsLocation.set('wonum', that.wonum);
									lbsLocation.set('key3', that.wositeid);
								}
								
								var timestamp = new Date();
								lbsLocation.setDateValue('lastupdate',timestamp);
								
								ModelService.saveAfterEsig(lbsLocationSet);
								
							});
						
						} else {
							Logger.trace(" No GPS co-ordinate to send to Maximo LBSLOCATION ! Skipping ....");
						}
						
					} else {
						
						Logger.trace("Offline threshold exceeded message not posted to Maximo ");
						this._checkMessageThreshold();
					}
					
				},
				
				/*
				 * Offline connectivity counter 
				 */
				
				_setOfflineCount : function (blnReset) {
					var gpsLocalStoreSet = window.UI.application.getResource('PlatformGeolocationLocalStore');
					var gpsLocalStore = gpsLocalStoreSet.getRecordAt(0) ;

					if (gpsLocalStore) {
						
						if (blnReset) {
							gpsLocalStore.set("offlinecount", 0 );
							Logger.log("GPS Tracker Offline :: Counter reset to zero");
						} else {
							var currentIndex = gpsLocalStore.get("offlinecount") ? gpsLocalStore.get("offlinecount") : 0;
							gpsLocalStore.set("offlinecount", currentIndex++ );
							Logger.log("GPS Tracker Offline :: Counter Index " + currentIndex);
						}

						ModelService.save(gpsLocalStoreSet);
					}	
				},
				
				/*
				 * Connectivity checker for ensure threshold memory is not hit
				 */
				
				_checkMessageThreshold : function () {
					
					CommunicationManager.checkConnectivityAvailable().
					then(function(hasConnectivity){
						if (hasConnectivity){
							this._setOfflineCount(true);
						}
						else{
							this._setOfflineCount(false);
						}
					});	
					
				},
				
				/*
				 * internal function to check wonum needs to be set for lbslocation information
				 */
				
				_getWODetails : function () {
					
					var gpsLocalStore = window.UI.application.getResource('PlatformGeolocationLocalStore').getRecordAt(0);
					if (gpsLocalStore) {
										
						var wonum = gpsLocalStore.get("wonum");
						var offlinecount = gpsLocalStore.get("offlinecount");
						
						this.offlineLineCounter = offlinecount ? offlinecount : 0 ;
						
						if (wonum) {
							this.wonum = wonum;	
							this.wositeid = gpsLocalStore.get("wositeid");	
						} else {
							this.wonum = "";	
							this.wositeid = "";	
						}
						
					}
				},
				
				/*
				 *  internal function to create geolocation local store if doesn't exist
				 */
				
				_createGPSLocalStore : function (eventContext) {
					var gpsLocalStoreSet = eventContext.ui.application.getResource('PlatformGeolocationLocalStore');
					
					if (gpsLocalStoreSet.count() < 1){
						gpsLocalStoreSet.createNewRecord();
					} else {
						var gpsLocalStore = gpsLocalStoreSet.getRecordAt(0);
						gpsLocalStore.set('longitudex', "");
						gpsLocalStore.set('latitudey', "");
					}
					
					ModelService.save(gpsLocalStoreSet);
				},
				
				/*
				 * Error callback for watch position
				 */
				
				_errorCallback : function (error) {
					
					Logger.log("GPS Tracking Error :: " + error.code + " :: " + error.message);
					var msg = ""; 
					
					switch(error.code){
						
						case error.PERMISSION_DENIED:
							msg = MessageService.createStaticMessage('gpsPermission').getMessage();
							break;
						case error.POSITION_UNAVAILABLE:
							msg = MessageService.createStaticMessage('unableAcquireGPS').getMessage();
							break;
						case error.TIMEOUT:
							msg = MessageService.createStaticMessage('gpsTimeout').getMessage();
							break;
						default:
							msg = MessageService.createStaticMessage('unableAcquireGPS').getMessage();
					}
					
					this.ui.showMessage(msg);
				},
				
				/* 
				 * recursive timer function based upon lbsinterval
				 */
				
				_startTimer : function () {
					
					var that = this;
					this._sendGPSToLBSLocation();
					
					setTimeout( 					
						that._startTimer.bind(that),
						that.lbsinterval * 1000 
						) ;
				}
			});
		});
