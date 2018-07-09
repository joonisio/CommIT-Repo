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

define("application/handlers/MetersListHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
	     "dojo/_base/lang",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/util/PlatformConstants",
	     "platform/model/ModelService",
	     "application/handlers/CommonHandler",
	     "dojo/promise/all",
		  "platform/translation/MessageService",
		  "platform/logging/Logger",
		  "dojo/Deferred",
		  "platform/store/_ResourceMetadataContext",
		  "platform/comm/CommunicationManager"
	     ],
function(declare, arrayUtil, lang, ApplicationHandlerBase, PlatformConstants, ModelService, CommonHandler, all, MessageService, Logger, Deferred, ResourceMetaData, CommunicationManager) {	
	return declare( [ApplicationHandlerBase], {	
		
/**@memberOf application.handlers.MetersListHandler */
		initializeMeters : function (eventContext) {
			
			//initialize in-memory resource
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var currentRecord = eventContext.application.getResource('workOrder').getCurrentRecord();
			currentRecord.set('meterslistsize',"--");
			
			woAssetLocMeterInfo.set("woAssetMeterCount", 0);
			woAssetLocMeterInfo.set("woLocationMeterCount", 0);
			woAssetLocMeterInfo.set("totalWOAssetMeterCount", 0);
			woAssetLocMeterInfo.set("totalWOLocationMeterCount", 0);
			woAssetLocMeterInfo.set("taskAssetMeterCount", 0);
			woAssetLocMeterInfo.set("taskLocationMeterCount", 0);
			woAssetLocMeterInfo.set("originatingAction", "");		

			//listening to the workorder asset field for any change
			eventContext.addResourceWatchHandle(currentRecord.watch("asset", lang.hitch(this, function(attrName, oldValue, newValue){	
				this.getAllAssetMeters(eventContext, woAssetLocMeterInfo);
		    })));
			
			//listening to the workorder location field for any change
			eventContext.addResourceWatchHandle(currentRecord.watch("location", lang.hitch(this, function(attrName, oldValue, newValue){	
				this.getAllLocationMeters(eventContext, woAssetLocMeterInfo);
		    })));
			
			//set loading flags to true since we are about to load asset and location meters
			woAssetLocMeterInfo.set("loadingAssetMeterCount", true);
			woAssetLocMeterInfo.set("loadingLocationMeterCount", true);
			
			//fetch all meters on workorder
			this.getAllAssetMeters(eventContext, woAssetLocMeterInfo);
			this.getAllLocationMeters(eventContext, woAssetLocMeterInfo);
		},
		
		hideWOAssetMeterButton: function(eventContext) {
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var count = woAssetLocMeterInfo.get('woAssetMeterCount');
			if (!count || count<1){
				eventContext.setDisplay(false);
			}
			
			eventContext.addResourceWatchHandle(woAssetLocMeterInfo.watch("woAssetMeterCount", lang.hitch(this, function(attrName, oldValue, newValue){
				eventContext.setDisplay(newValue > 0);
		    })));
		},

		hideWOLocationMeterButton: function(eventContext) {
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var count = woAssetLocMeterInfo.get('woLocationMeterCount');
			if (!count || count<1){
				eventContext.setDisplay(false);
			}

			eventContext.addResourceWatchHandle(woAssetLocMeterInfo.watch("woLocationMeterCount", lang.hitch(this, function(attrName, oldValue, newValue){
				eventContext.setDisplay(newValue > 0);
		    })));
		},
	
		hideMultiAssetLocMeterButton: function(eventContext) {
			var promise = this.getMultiAssetLocationMeters(eventContext);
			promise.then(function(countObj){
				if ((countObj.assetMeterCount + countObj.locationMeterCount) > 0) {
					eventContext.setDisplay(true);
				} else {
					eventContext.setDisplay(false);
				}	
			});
		},

		hideTaskAssetMeterButton : function(eventContext) {
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var assetnum = eventContext.getCurrentRecord().get('assetnum');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var self = this;
			var deferred = new Deferred();

			var count = woAssetLocMeterInfo.get('taskAssetMeterCount');
			if (!count || count<1){
				eventContext.setVisibility(false);
			}
			
			//listening to the wo task asset count for any change
			eventContext.addResourceWatchHandle(woAssetLocMeterInfo.watch("taskAssetMeterCount", lang.hitch(this, function(attrName, oldValue, newValue){
				eventContext.setVisibility(newValue > 0);
		    })));
			
			ModelService.allCached('assetMeters',null,null).then(function(assetMeterResource){
				var assetMeterSet = assetMeterResource.find('assetnum == $1  && siteid == $2 && active == true', assetnum, siteid);
				self.setAssetMeterResource(eventContext, assetMeterSet, "tempListViewAssetMeter","TASK").then(function(count){
					var tempListViewAssetMeter = eventContext.application.getResource('tempListViewAssetMeter');
					if(tempListViewAssetMeter.count()>0){
						tempListViewAssetMeter.setCurrentIndex(0);
					}
					woAssetLocMeterInfo.set("taskAssetMeterCount", count);
					deferred.resolve(count);
				});
			});
			
			var woAssetLocMeterInfo = eventContext.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			woAssetLocMeterInfo.set('originatingAction', "TASK");
			
			return deferred.promise;
		},

		hideTaskLocationMeterButton : function(eventContext) {
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var location = eventContext.getCurrentRecord().get('location');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var self = this;
			var deferred = new Deferred();
			var count = woAssetLocMeterInfo.get('taskLocationMeterCount');
			if (!count || count<1){
				eventContext.setVisibility(false);
			}
			
			//listening to the wo task location count for any change			
			eventContext.addResourceWatchHandle(woAssetLocMeterInfo.watch("taskLocationMeterCount", lang.hitch(this, function(attrName, oldValue, newValue){
				eventContext.setVisibility(newValue > 0);
		    })));
			
			ModelService.allCached('locationMeters',null,null).then(function(locationMeterResource){
				var locationMeterSet = locationMeterResource.find('location == $1  && siteid == $2 && active == true', location, siteid);
				self.setLocationMeterResource(eventContext, locationMeterSet, "tempListViewLocationMeter","TASK").then(function(count){
					var tempListViewLocationMeter = eventContext.application.getResource('tempListViewLocationMeter');
					if(tempListViewLocationMeter.count()>0){
						tempListViewLocationMeter.setCurrentIndex(0);
					}
					woAssetLocMeterInfo.set("taskLocationMeterCount", count);
					deferred.resolve(count);
				});
			});
			
			var woAssetLocMeterInfo = eventContext.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			woAssetLocMeterInfo.set('originatingAction', "TASK");
			
			return deferred.promise;
		},
		
		showAssetMeterViewList: function(eventContext) {
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var total = woAssetLocMeterInfo.get('woAssetMeterCount');
			if (total > 1) {			
				eventContext.ui.show('WorkExecution.AssetMeterViewList');	
			} else {
				var tempAssetMeter = eventContext.application.getResource("tempAssetMeter");
			    var woAssetMeters = eventContext.application.getResource("woAssetMeters");
			    tempAssetMeter.data = woAssetMeters.data;				
				eventContext.ui.show('WorkExecution.AssetMeterDetailView');
			}
		},		
		
		showLocationMeterViewList: function(eventContext) {
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var total = woAssetLocMeterInfo.get('woLocationMeterCount');
			if (total > 1) {
				eventContext.ui.show('WorkExecution.LocationMeterViewList');	
			} else {
				var tempLocationMeter = eventContext.application.getResource("tempLocationMeter");
			    var woLocationMeters = eventContext.application.getResource("woLocationMeters");
			    tempLocationMeter.data = woLocationMeters.data;
				eventContext.ui.show('WorkExecution.LocationMeterDetailView');
			}
		},
		
		showMultiAssetLocMeters : function(eventContext) {
			var promise = this.getMultiAssetLocationMeters(eventContext);
			promise.then( function (countObj) {
				if ((countObj.assetMeterCount > 0 && countObj.locationMeterCount > 0)){
					eventContext.ui.show('WorkExecution.MultiAssetLocCIMeterList');	
				} else if (countObj.assetMeterCount > 1 && countObj.locationMeterCount == 0) {
						eventContext.ui.show('WorkExecution.MultiAssetLocAssetMeterViewList');
				} else if (countObj.assetMeterCount == 0 && countObj.locationMeterCount > 1) {
						eventContext.ui.show('WorkExecution.MultiAssetLocLocationMeterViewList');
				} else if (countObj.assetMeterCount == 1 && countObj.locationMeterCount == 0) {
						var tempAssetMeter = eventContext.application.getResource("tempAssetMeter");
					    var tempListViewAssetMeter = eventContext.application.getResource("tempListViewAssetMeter");
					    tempAssetMeter.data = tempListViewAssetMeter.data;
					    eventContext.ui.show('WorkExecution.AssetMeterDetailView');
				} else {
					var tempLocationMeter = eventContext.application.getResource("tempLocationMeter");
				    var tempListViewLocationMeter = eventContext.application.getResource("tempListViewLocationMeter");
				    tempLocationMeter.data = tempListViewLocationMeter.data;
					eventContext.ui.show('WorkExecution.LocationMeterDetailView');
				}
			});
		},		

		showTaskAssetMeterViewList: function(eventContext) {
			var promise = this.hideTaskAssetMeterButton(eventContext);
			promise.then(function(count){
				if (count > 1) {
					eventContext.ui.show('WorkExecution.TaskAssetMeterViewList');	
				} else {
					var tempAssetMeter = eventContext.application.getResource("tempAssetMeter");
				    var tempListViewAssetMeter = eventContext.application.getResource("tempListViewAssetMeter");
				    tempAssetMeter.data = tempListViewAssetMeter.data;				
					eventContext.ui.show('WorkExecution.AssetMeterDetailView');
				}
			});			
		},
		
		showTaskLocationMeterViewList: function(eventContext) {
			var promise = this.hideTaskLocationMeterButton(eventContext);
			promise.then(function(count){
				if (count > 1) {
					eventContext.ui.show('WorkExecution.TaskLocationMeterViewList');	
				} else {
					var tempLocationMeter = eventContext.application.getResource("tempLocationMeter");
				    var tempListViewLocationMeter = eventContext.application.getResource("tempListViewLocationMeter");
				    tempLocationMeter.data = tempListViewLocationMeter.data;					
					eventContext.ui.show('WorkExecution.LocationMeterDetailView');
				}
			});
		},		
		
		getAllAssetMeters : function (eventContext, woAssetLocMeterInfo){
			
			woAssetLocMeterInfo.set("loadingAssetMeterCount", true);
			var self = this;
			var totalAssetDeferred = new Deferred();
			var singleAssetDeferred = new Deferred(); 
			var deferred = new Deferred();
			var assetList = [];
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			
			//initialize complex attributes related to workorder
			var complexlistPromise = all([wo.getModelDataSet('multiassetloclist', true), wo.getModelDataSet('tasklist', true)]);
			
			//get asset from workorder header level
			var assetnum = wo.getPendingOrOriginalValue('asset');
			if (assetnum){
				if (assetList.indexOf(assetnum)<0){
					assetList.push(assetnum);
				}
			}
			
			complexlistPromise.then(function(){
				
				var taskSet = wo.tasklist;
				if (taskSet){
					arrayUtil.forEach(taskSet.data, function(task){
						var taskAsset = task['assetnum'];
						if (taskAsset){
							if (assetList.indexOf(taskAsset)<0){
								assetList.push(taskAsset);
							}
						}
					});
				}

				var multiAssetLocciSet =  wo.multiassetloclist;
				if (multiAssetLocciSet){
					arrayUtil.forEach(multiAssetLocciSet.data, function(multiAssetLocci){
						var multiAsset = multiAssetLocci['assetnum'];
						if (multiAsset){
							if (assetList.indexOf(multiAsset)<0){
								assetList.push(multiAsset);
							}
						}
					});
				}
				
				//build in clause of assets
				var asslist = "";
				var asslistjoin = "";
				var assetFirstTime = true;
				
				assetList.forEach(function(asset){
					if (assetFirstTime){
						asslist='%22'+asset+'%22';	
						assetFirstTime = false;
					} else {
						asslist+=',%22'+asset+'%22';		
					}
				});	
				
				var localFirstTimeFind = true;
				assetList.forEach(function(asset){
					if (localFirstTimeFind){
						asslistjoin='(assetnum = "'+asset+'"';	
						localFirstTimeFind = false;
					} else {
						asslistjoin+=' || assetnum = "'+asset+'" ';		
					}
				});	
				
				if (asslistjoin!=''){
					//close parenthesis
					asslistjoin+=')';
				}
				
				if (assetList.length==0){
					asslist = "\"1=2\"";
				}	
				
				var siteid = CommonHandler._getWorkorderSiteId(eventContext);
				
				var assetMeterMeta = ResourceMetaData.getResourceMetadata("assetMeters");
				//var originalAssetWhereClause = assetMeterMeta.whereClause;
				assetMeterMeta.setWhereClause("spi:asset{oslc:shortTitle in ["+asslist+"]} and spi:siteid=%22"+siteid+"%22");
				
				var assetMetersPromise =  ModelService.all('assetMeters', null,null);
				assetMetersPromise.then(function(assetMeterResource){
					
					/*******Execute local filters on server loaded data ******/
					
					//Search asset on main workorder level
					var assetMeterSet = assetMeterResource.find('assetnum == $1  && siteid == $2 && active == true', wo.getPendingOrOriginalValue('asset'), siteid);
					self.setAssetMeterResource(eventContext, assetMeterSet, "woAssetMeters").then(function(count){
						woAssetLocMeterInfo.set("woAssetMeterCount", count);
						var woAssetMeters = eventContext.application.getResource('woAssetMeters');
						if(woAssetMeters.count()>0){
							woAssetMeters.setCurrentIndex(0);
						}
						singleAssetDeferred.resolve();
					});

					//Search asset on total workorder
					if (asslistjoin!=''){
						asslistjoin += " && active == true";	// only show active meters
					}
					var assetMeterSet = assetMeterResource.find(asslistjoin, siteid);
					self.setAssetMeterResource(eventContext, assetMeterSet, "totalWOAssetMeters").then(function(count){
									
						var totalWOAssetMeters = eventContext.application.getResource('totalWOAssetMeters');
						if(totalWOAssetMeters.count()>0){
							totalWOAssetMeters.setCurrentIndex(0);
						}
						//reset asset meter count flag
						woAssetLocMeterInfo.set("loadingAssetMeterCount", false);
						woAssetLocMeterInfo.set("totalWOAssetMeterCount", count);
						
						if (!woAssetLocMeterInfo.get("loadingLocationMeterCount")) {
							//if loadingLocationMeterCount is false -- then mark it as resolved and update total meter count
							var total = woAssetLocMeterInfo.totalWOAssetMeterCount + woAssetLocMeterInfo.totalWOLocationMeterCount;
							wo.set('meterslistsize','' + total);
							totalAssetDeferred.resolve();
						}
					});
										
				});
			
			});
			
			all([singleAssetDeferred.promise,totalAssetDeferred.promise]).then(function(results){
				deferred.resolve();
			});
			
			return deferred.promise;
		},

		getAllLocationMeters : function (eventContext, woAssetLocMeterInfo){
			
			woAssetLocMeterInfo.set("loadingLocationMeterCount", true);
			var self = this;
			var totalLocationDeferred = new Deferred();
			var singleLocationDeferred = new Deferred(); 
			var deferred = new Deferred(); 
			var locationList = [];
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			
			//initialize complex attributes related to workorder
			var complexlistPromise = all([wo.getModelDataSet('multiassetloclist', true), wo.getModelDataSet('tasklist', true)]);
			
			//get asset from workorder header level
			var location = wo.getPendingOrOriginalValue('location');
			if (location){
				if (locationList.indexOf(location)<0){
					locationList.push(location);
				}
			}
			
			complexlistPromise.then(function(){
				
				var taskSet = wo.tasklist;
				if (taskSet){
					arrayUtil.forEach(taskSet.data, function(task){
						var taskLocation = task['location'];
						if (taskLocation){
							if (locationList.indexOf(taskLocation)<0){
								locationList.push(taskLocation);
							}
						}
					});
				}

				var multiAssetLocciSet =  wo.multiassetloclist;
				if (multiAssetLocciSet){
					arrayUtil.forEach(multiAssetLocciSet.data, function(multiAssetLocci){
						var multiAssetLoc = multiAssetLocci['location'];
						if (multiAssetLoc){
							if (locationList.indexOf(multiAssetLoc)<0){
								locationList.push(multiAssetLoc);
							}
						}
					});
				}
				
				//build in clause of assets
				var loclist = "";
				var loclistjoin = "";
				var locationFirstTime = true;
				
				locationList.forEach(function(location){
					if (locationFirstTime){
						loclist='%22'+location+'%22';	
						locationFirstTime = false;
					} else {
						loclist+=',%22'+location+'%22';		
					}
				});	
				
				var localFirstTimeFind = true;
				locationList.forEach(function(location){
					if (localFirstTimeFind){
						loclistjoin='(location = "'+location+'"';	
						localFirstTimeFind = false;
					} else {
						loclistjoin+=' || location = "'+location+'" ';		
					}
				});	
				
				if (loclistjoin!=''){
					//close parenthesis
					loclistjoin+=')';
				}
				
				if (locationList.length==0){
					loclist = "\"1=2\"";
				}	
				
				var siteid = CommonHandler._getWorkorderSiteId(eventContext);
				
				var locationMeterMeta = ResourceMetaData.getResourceMetadata("locationMeters");
				//var originalLocationWhereClause = locationMeterMeta.whereClause;
				locationMeterMeta.setWhereClause("spi:location{oslc:shortTitle in ["+loclist+"]} and spi:siteid=%22"+siteid+"%22");
				
				var locationMetersPromise =  ModelService.all('locationMeters', null,null);
				locationMetersPromise.then(function(locationMeterResource){
					
					/*******Execute local filters on server loaded data ******/
					
					//Search location on main workorder level
					var locationMeterSet = locationMeterResource.find('location == $1  && siteid == $2 && active == true', wo.getPendingOrOriginalValue('location'), siteid);
					self.setLocationMeterResource(eventContext, locationMeterSet, "woLocationMeters").then(function(count){
						
						var woLocationMeters = eventContext.application.getResource('woLocationMeters');
						if(woLocationMeters.count()>0){
							woLocationMeters.setCurrentIndex(0);
						}
						
						woAssetLocMeterInfo.set("woLocationMeterCount", count);
						singleLocationDeferred.resolve();
					});

					//Search location on total workorder
					if (loclistjoin!=''){
						loclistjoin += " && active == true";	// only show active meters
					}
					var locationMeterSet = locationMeterResource.find(loclistjoin, siteid);
					self.setLocationMeterResource(eventContext, locationMeterSet, "totalWOLocationMeters").then(function(count){
						var totalWOLocationMeters = eventContext.application.getResource('totalWOLocationMeters');
						if(totalWOLocationMeters.count()>0){
							totalWOLocationMeters.setCurrentIndex(0);
						}
						
						//reset location meter count flag
						woAssetLocMeterInfo.set("loadingLocationMeterCount", false);
						woAssetLocMeterInfo.set("totalWOLocationMeterCount", count);
						
						if (!woAssetLocMeterInfo.get("loadingAssetMeterCount")) {
							//if loadingAssetMeterCount is false -- then mark it as resolved and update total meter count
							var total = woAssetLocMeterInfo.totalWOAssetMeterCount + woAssetLocMeterInfo.totalWOLocationMeterCount;
							wo.set('meterslistsize','' + total);
							totalLocationDeferred.resolve();
						}					
					});
										
				});
			
			});
			
			all([singleLocationDeferred.promise,totalLocationDeferred.promise]).then(function(results){
				deferred.resolve();
			});
			
			return deferred.promise;
		},
		
		getMultiAssetLocationMeters : function(eventContext, selectedRecord){
			var self = this;
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			var deferred = new Deferred();
			var assetDeferred = new Deferred();
			var locationDeferred = new Deferred();
			
			var assetMeterCount = 0;
			var locationMeterCount = 0;
				
			//check if selected record exists / used when entering meterreadings from meterreading handler
			var multiAssetLocci = eventContext.getCurrentRecord();
			if (selectedRecord == null){
				multiAssetLocci =  eventContext.getCurrentRecord();
			} else {
				multiAssetLocci =  selectedRecord;
			}
			
			//initialize complex attributes related to workorder
			var complexlistPromise = wo.getModelDataSet('multiassetloclist', true);
			
			complexlistPromise.then(function(){
				if (multiAssetLocci){
					var location = multiAssetLocci.get('location');
					if (location){
						ModelService.allCached('locationMeters',null,null).then(function(locationMeterResource){
							var locationMeterSet = locationMeterResource.find('location == $1  && siteid == $2 && active == true', location, siteid);
							self.setLocationMeterResource(eventContext, locationMeterSet, "tempListViewLocationMeter", multiAssetLocci).then(function(count){
								var tempListViewLocationMeter = eventContext.application.getResource('tempListViewLocationMeter');
								if(tempListViewLocationMeter.count()>0){
									tempListViewLocationMeter.setCurrentIndex(0);
								}
								locationMeterCount = count;
								locationDeferred.resolve(count);
							});
						});
					} else {
						locationDeferred.resolve(0);
					}

					var asset = multiAssetLocci.get('assetnum');
					if (asset){
						ModelService.allCached('assetMeters',null,null).then(function(assetMeterResource){
							var assetMeterSet = assetMeterResource.find('assetnum == $1  && siteid == $2 && active == true', asset, siteid);
							self.setAssetMeterResource(eventContext, assetMeterSet, "tempListViewAssetMeter", multiAssetLocci).then(function(count){
								var tempListViewAssetMeter = eventContext.application.getResource('tempListViewAssetMeter');
								if(tempListViewAssetMeter.count()>0){
									tempListViewAssetMeter.setCurrentIndex(0);
								}
								assetMeterCount = count;
								assetDeferred.resolve(count);
							});
						});
					} else {
						assetDeferred.resolve(0);
					}
				}
				var woAssetLocMeterInfo = eventContext.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
				woAssetLocMeterInfo.set('originatingAction', "MULTIASSETLOC");
	
			});

			all([assetDeferred.promise,locationDeferred.promise]).then(function(results){
				var counts = {"assetMeterCount" : assetMeterCount, "locationMeterCount" : locationMeterCount};
				
				deferred.resolve(counts);
			});
			
			return deferred.promise;
		}, 
		
		setAssetMeterResource : function(eventContext, assetMeterData, resourceName, referenceName) {
			
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var deferred = new Deferred();
			
			ModelService.empty(resourceName).then(function(assetMeterSet){
				var aMeter =  null;			
				arrayUtil.forEach(assetMeterData, function(assetmeter){
					aMeter = assetMeterSet.createNewRecord(); 
					aMeter.set('assetnum',assetmeter['assetnum']);
					aMeter.set('assetnumdesc',assetmeter['assetnumdesc']);
					aMeter.setDateValue('lastreadingdate', assetmeter.getAsDateOrNull('lastreadingdate'));
					aMeter.set('metername', assetmeter['metername']);
					aMeter.set('meterdesc', assetmeter['meterdesc']);
					aMeter.set('lastreading', assetmeter['lastreading']);
					aMeter.set('metertype', assetmeter['metertype']);
					aMeter.set('domainid', assetmeter['domainid']);
					aMeter.set('readingtype', assetmeter['readingtype']);
					aMeter.set('rollover', assetmeter['rollover']);		

					if (assetmeter.get('localLastReading') && assetmeter.get('localLastReadingDate') && ((!assetmeter['lastreadingdate']) ||
							(assetmeter.get('localLastReadingDate') > assetmeter['lastreadingdate']))){
						aMeter.set('lastreading', assetmeter.get('localLastReading'));
						aMeter.setDateValue('lastreadingdate', assetmeter.getAsDateOrNull('localLastReadingDate'));
					} else {
						aMeter.set('lastreading', assetmeter['lastreading']);
						aMeter.setDateValue('lastreadingdate', assetmeter.getAsDateOrNull('lastreadingdate'));
					}
					
				});	
				
				woAssetLocMeterInfo.set('originatingAction',referenceName);
				assetMeterSet.resourceID = resourceName;
				eventContext.application.addResource(assetMeterSet);
				deferred.resolve(assetMeterData.length);
			});
			
			return deferred.promise;
		},
		
		setLocationMeterResource : function(eventContext, locationMeterData, resourceName, referenceName) {
			
			var woAssetLocMeterInfo = this.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
			var deferred = new Deferred();
			
			ModelService.empty(resourceName).then(function(locationMeterSet){
				var lMeter =  null;
				arrayUtil.forEach(locationMeterData, function(locationmeter){
					lMeter = locationMeterSet.createNewRecord(); 
					var wo = eventContext.application.getResource("workOrder").getCurrentRecord();
					lMeter.set('location',locationmeter['location']);
					lMeter.set('locationdesc',locationmeter['locationdesc']);
					lMeter.setDateValue('lastreadingdate', locationmeter.getAsDateOrNull('lastreadingdate'));
					lMeter.set('metername', locationmeter['metername']);
					lMeter.set('meterdesc', locationmeter['meterdesc']);
					lMeter.set('lastreading', locationmeter['lastreading']);
					lMeter.set('metertype', locationmeter['metertype']);
					lMeter.set('domainid', locationmeter['domainid']);
					lMeter.set('readingtype', locationmeter['readingtype']);
					lMeter.set('rollover', locationmeter['rollover']);
					
					if (locationmeter.get('localLastReadingDate') && ((!locationmeter['lastreadingdate']) ||
							(locationmeter.get('localLastReadingDate') > locationmeter['lastreadingdate']))){
						lMeter.set('lastreading', locationmeter.get('localLastReading'));
						lMeter.setDateValue('lastreadingdate', locationmeter.getAsDateOrNull('localLastReadingDate'));
					} else {
						lMeter.set('lastreading', locationmeter['lastreading']);
						lMeter.setDateValue('lastreadingdate', locationmeter.getAsDateOrNull('lastreadingdate'));
					}
				});	
				
				if (referenceName!=null){
					woAssetLocMeterInfo.set('originatingAction',referenceName);
				} else {
					woAssetLocMeterInfo.set('originatingAction',null);
				}
				
				locationMeterSet.resourceID = resourceName;
				eventContext.application.addResource(locationMeterSet);	
				deferred.resolve(locationMeterData.length);
			});

			return deferred.promise;
		},
		
		setAssetResourceFromMulti : function(eventContext) {
			this.setAssetResource(eventContext,"MULTIASSETLOC");
		},
		
		setLocationResourceFromMulti : function(eventContext) {
			this.setLocationResource(eventContext,"MULTIASSETLOC");
		},
		
		setAssetResourceFromTask : function(eventContext) {
			this.setAssetResource(eventContext,"TASK");
		},
		
		setLocationResourceFromTask : function(eventContext) {
			this.setLocationResource(eventContext,"TASK");
		},
		
		setAssetResource : function(eventContext,refobjname) {
			var currentRecord = eventContext.getCurrentRecord();
			var dataArray = [currentRecord];
			this.setAssetMeterResource(eventContext,dataArray,'tempAssetMeter', refobjname);
			eventContext.ui.show('WorkExecution.AssetMeterDetailView');		
		},
		
		setLocationResource : function(eventContext, refobjname) {
			var currentRecord = eventContext.getCurrentRecord();
			var dataArray = [currentRecord];
			this.setLocationMeterResource(eventContext,dataArray,'tempLocationMeter', refobjname);
			eventContext.ui.show('WorkExecution.LocationMeterDetailView');		
		},
		
		hideAssetMeters : function(eventContext){
			var assetMeters = eventContext.getResource();
			
			if ((assetMeters.data) && (assetMeters.data.length > 0)) {
				eventContext.setDisplay(true);
			} else {
				eventContext.setDisplay(false);
			}
		},

		hideLocationMeters : function(eventContext){
			var locationMeters = eventContext.getResource();
			if ((locationMeters.data) && (locationMeters.data.length > 0)) {
				eventContext.setDisplay(true);
			} else {
				eventContext.setDisplay(false);
			}
		},
		
		showHeader : function(eventContext){
			eventContext.doShowHeader();
		}
		
		
	});		
	
});
