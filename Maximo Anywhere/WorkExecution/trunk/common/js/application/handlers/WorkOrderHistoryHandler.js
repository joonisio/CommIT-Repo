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

define("application/handlers/WorkOrderHistoryHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "platform/model/ModelService",
	     "dojo/_base/array",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/business/WorkOrderObject",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/handlers/CommonHandler",
	     "platform/util/PlatformConstants",
	     "platform/format/FormatterService",
	     "platform/logging/Logger",
	     "dojo/Deferred",
	     "dojo/promise/all",
	     "platform/store/SystemProperties",
	     "platform/store/_ResourceMetadataContext"],
function(declare,lang, ModelService, array, ApplicationHandlerBase, WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, FormatterService, Logger, Deferred, all, SystemProperties, ResourceMetadataContext) {
	return declare( ApplicationHandlerBase, {
		
		init: false,
			
/**@memberOf application.handlers.WorkOrderHistoryHandler */
		_getHistoryQueryBase: function() {
			var queryBase = PlatformConstants.SEARCH_RESULT_QUERYBASE;
			
			var woHistoryResource =ResourceMetadataContext.getResourceMetadata("woHistory");
			if(woHistoryResource!=null)
				if(woHistoryResource.queryBasesLabel.length > 0)
					queryBase = woHistoryResource.queryBasesLabel[0].name;
			
			return queryBase;
		},
			
		getRelaedAssetWorkOrders: function(wo,currentAsset){
			var deferred = new Deferred();
			var asset_filter = {};
			var asset = null;
			if(currentAsset)
				asset = currentAsset;
			else
				asset = wo.asset;	
			
			if(asset != ""?asset_filter["asset"] = asset:false){
				ModelService.filtered('woHistory', this._getHistoryQueryBase(), asset_filter, 1000, null, null, null).then(function(assetset){
					for(var i = 0; i < assetset.data.length; i++){
						if(assetset.data[i].wonum == wo.wonum || assetset.data[i].status == 'CAN') {
							assetset._removeRecordFromAllLists(assetset.data[i]);
							i--;
						}
					}
					
					deferred.resolve(assetset);
				});
				
			} else{
				deferred.resolve(null);
			}
			return deferred.promise;
		},
				
		getRlatedLocationWorkOrders: function(wo,currentLocation){
			var deferred = new Deferred();
			var loc_filter = {};
			var location = null;
			if(currentLocation)
				location = currentLocation;
			else
				location = wo.location;	
			
			if(location != ""? loc_filter["location"] = location:false) {
				ModelService.filtered('woHistory', this._getHistoryQueryBase(), loc_filter, 1000, null, null, null).then(function(locset){
					for(var i = 0; i < locset.data.length; i++){
							if(locset.data[i].wonum == wo.wonum || locset.data[i].status == 'CAN')	{
								locset._removeRecordFromAllLists(locset.data[i]);
								i--;
							}
					}
					
					deferred.resolve(locset);
			});
			}
			else{
				deferred.resolve(null);
			}
			return deferred.promise;
		},
				
		getFilteredWorkOrders: function(wo, limit,type,currentRecord){ 
			var deferred = new Deferred();
			var filterPromise = null;
			if(type=='Asset')
				filterPromise = this.getFilteredWorkOrdersAsset(wo, limit,currentRecord);
			
			if(type=='Location')
				filterPromise =  this.getFilteredWorkOrdersLocation(wo, limit,currentRecord);
			var self = this;
			filterPromise.then(function(dataSet){
				if (dataSet){
					deferred.resolve(dataSet);
				}
				else{
					//No asset or location on the work order so create an empty set.
					ModelService.empty("workOrderHistoryAssetLoc",self._getHistoryQueryBase()).then(function(dataSet){
						wo.set("totalWOHistory",0);
						deferred.resolve(dataSet);
					});
				}
			}).otherwise(function(error){
				Logger.error('Error fetching work order history: ', error);
				wo.set("totalWOHistory",0);
				deferred.resolve(error.dataSet);
			});
			return deferred.promise;
		},
		
		getFilteredWorkOrdersAsset: function(wo, limit,currentAsset){ 
			var deferred = new Deferred();
			var self = this;
			all([this.getRelaedAssetWorkOrders(wo,currentAsset)]).then(function(results){
				var assetWO = results[0];
				var locWO = results[1];
				var filteredWOset = self.mergeDataset(assetWO, locWO);
				if(filteredWOset == null)
					deferred.resolve(null);
				else {
					wo.set("totalWOHistory",filteredWOset.count());
					var filtered_sortedWOset = self.sortDataset(self.compare_function, filteredWOset);
					var filtered_so_limitWOset = self.limitDataSet(filtered_sortedWOset, limit);
					deferred.resolve(filtered_so_limitWOset);
				}
			});
			return deferred.promise;
		},
		
		getFilteredWorkOrdersLocation: function(wo, limit,currentLocation){ 
			var deferred = new Deferred();
			var self = this;
			all([this.getRlatedLocationWorkOrders(wo,currentLocation)]).then(function(results){
				var assetWO = results[0];
				var locWO = results[1];
				var filteredWOset = self.mergeDataset(assetWO, locWO);
				if(filteredWOset == null){
					deferred.resolve(null);
				}
				else {
					wo.set("totalWOHistory",filteredWOset.count());
					var filtered_sortedWOset = self.sortDataset(self.compare_function, filteredWOset);
					var filtered_so_limitWOset = self.limitDataSet(filtered_sortedWOset, limit);
					deferred.resolve(filtered_so_limitWOset);
				}
			});
			return deferred.promise;
		},
		
		
		showWOHistoryListMultiAsset: function(eventContext){
			eventContext.application.showBusy();
			var currentRecord = eventContext.getCurrentRecord();
			var asset = currentRecord.get("assetnum");
			if(asset)
				this.getWOHistoryList(eventContext,'Asset','WorkExecution.WOHistoryViewMultiAsset',asset);
			else{
				var location = currentRecord.get("location");
				this.getWOHistoryList(eventContext,'Location','WorkExecution.WOHistoryViewMultiLocation',location);
			}
		},
		
		showWOHistoryListAsset: function(eventContext){
			eventContext.application.showBusy();
			this.getWOHistoryList(eventContext,'Asset','WorkExecution.WOHistoryViewAsset');
		},
		
		showWOHistoryListLocation: function(eventContext){
			eventContext.application.showBusy();
			this.getWOHistoryList(eventContext,'Location','WorkExecution.WOHistoryViewLocation');
		},
	
		
		getWOHistoryList: function(eventContext,type,redirect,currentRecord){
			//TODO
			//get list of previous workorder
			//var list_control = eventContext;
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var list_limit = SystemProperties.getProperty('si.wohistory.limitrecords');
			if(!list_limit)
				list_limit = 5;
			
			this.getFilteredWorkOrders(wo, list_limit,type,currentRecord).then(function(dataset){

				dataset.setResourceName("workOrderHistoryAssetLoc");
				dataset.resourceID = 'workOrderHistoryAssetLoc';
				dataset._filtered = true;
				var count = dataset.data.length > list_limit?list_limit:dataset.data.length;
				wo.set('wohistorylistsize', count + "");
				eventContext.application.addResource(dataset);
				
				if(redirect){
					//for multi asset
					if(redirect == 'WorkExecution.WOHistoryViewMultiAsset'){
						var asset = eventContext.getCurrentRecord();
						wo.set("wohistorymultiasset",asset.get("assetnum"));
						wo.set("wohistorymultiassetdesc",asset.get("assetdesc"));
					}
					
					if(redirect == 'WorkExecution.WOHistoryViewMultiLocation'){
						var location = eventContext.getCurrentRecord();
						wo.set("wohistorymultilocation",location.get("location"));
						wo.set("wohistorymultilocationdesc",location.get("locationdesc"));
					}
					
					eventContext.ui.show(redirect);
				}	

			});
		},
		
		hasAsset: function(eventContext) {
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			var asset = workOrder.get('asset');
			if(asset)
				eventContext.setDisplay(true);
			else
				eventContext.setDisplay(false);
		},
		
		hasLocation: function(eventContext) {
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			var location = workOrder.get('location');
			if(location)
				eventContext.setDisplay(true);
			else
				eventContext.setDisplay(false);
		},
		
		previousWO: function(eventContext) {
			var wohistory = eventContext.application.getResource('workOrderHistoryAssetLoc');
			wohistory.previous();
			eventContext.application.ui.getViewFromId('WorkExecution.WOHistoryDetailViewAssetLoc').refresh();
		},
		
		nextWO: function(eventContext) {
			var wohistory = eventContext.application.getResource('workOrderHistoryAssetLoc');
			wohistory.next();
			eventContext.application.ui.getViewFromId('WorkExecution.WOHistoryDetailViewAssetLoc').refresh();
		},
		
		hasPreviousWO: function(eventContext) {
			var wohistory = eventContext.application.getResource('workOrderHistoryAssetLoc');
			if(wohistory.hasPrevious())
				eventContext.setVisibility(true);
			else
				eventContext.setVisibility(false);
		},
		
		hasNextWO: function(eventContext) {
			var wohistory = eventContext.application.getResource('workOrderHistoryAssetLoc');
			if(wohistory.hasNext())
				eventContext.setVisibility(true);
			else
				eventContext.setVisibility(false);
		},
		
		compare_function: function(a, b){
			if (a.changestatusdate < b.changestatusdate)
			    return 1;
			if (a.changestatusdate > b.changestatusdate)
			    return -1;
			return 0;
		},
		
		sortDataset: function(comapre_function, dataset){
			var temp_dataset = dojo.clone(dataset);
			temp_dataset._originalData = [];
			temp_dataset.data = [];
			temp_dataset.index = {};
			dataset.data.sort(comapre_function);
			temp_dataset._originalData = temp_dataset.data = dataset.data;
			for(var i = 0; i < dataset.data.length; i++){
				temp_dataset.index[dataset.data[i]._id] = i;
			}
			return temp_dataset;
		},
		
		mergeDataset: function(dataset1, dataset2){
			var dataset1_isNull = false;
			var dataset2_isNull = false;

			if(dataset1 == null)
				dataset1_isNull = true;
			else if(dataset1.data.length == 0)
				dataset1_isNull = true;
			
			if(dataset2 == null)
				dataset2_isNull = true;
			else if(dataset2.data.length == 0)
				dataset2_isNull = true;

			if(dataset1_isNull && dataset2_isNull)
				return null;
			if(dataset1_isNull && !dataset2_isNull)
				return dataset2;
			if(!dataset1_isNull && dataset2_isNull)
				return dataset1;
			
			var dataset3 = dataset1;
			var cnt = dataset3.data.length;
			for (var i in dataset2.data){
				this.addRecordtoDataset(dataset3,dataset2.data[i], dataset3.data[cnt-1]._id);
				cnt++;
			}
			return dataset3;
		},
		
		limitDataSet: function(dataset, list_limit){
			var limitDataset = dojo.clone(dataset);
			var limit = list_limit;
			var cnt = 0;
			var i = 0;
			while( i< dataset.data.length){
				    if(cnt == limit){
				    	limitDataset._removeRecordFromAllLists(dataset.data[i]);
				    	i++;
				    	continue;
				    }
					
				    this.setFailureVars(limitDataset,i);
					if(!dataset.data[i+1])
						break;
					i++;
					cnt++;
			}
			return limitDataset;
		},
		
		setFailureVars: function(limitDataset,i){
			var record = limitDataset.data[i];
			if(record.failureReportlist){
				if(record.failureReportlist[0]){
					var problem = record.failureReportlist[0].json?record.failureReportlist[0].json:record.failureReportlist[0];
					record.fcproblem = problem.failurecode.concat(
								problem.failureDesc==null?"":" - " + problem.failureDesc);
				};
				
				if(record.failureReportlist[1]){
					var cause = record.failureReportlist[1].json?record.failureReportlist[1].json:record.failureReportlist[1];
					record.fccause = cause.failurecode.concat(
							cause.failureDesc==null?"":" - " + cause.failureDesc);
				};
				
				if(record.failureReportlist[2]){
					var remedy = record.failureReportlist[2].json?record.failureReportlist[2].json:record.failureReportlist[2];
					record.fcremedy = remedy.failurecode.concat(
							remedy.failureDesc==null?"":" - " + remedy.failureDesc);
				};
				
				if(record.datasheetlist)
					if(record.datasheetlist[0]){
						record.asfoundstatus = record.datasheetlist[0].asfoundcalstatus;
						record.asleftstatus = record.datasheetlist[0].asleftcalstatus;

				};
			}
		
		},
		
		addRecordtoDataset: function(dataset3, record, lasttempid){
			var cnt = dataset3.data.length;
			dataset3.createNewRecord();
			if(lasttempid)
				dataset3._lastTempId = lasttempid;
			
			if(dataset3.index.hasOwnProperty(dataset3.data[cnt]._id)){
				dataset3.index[record._id] = dataset3.index[dataset3.data[cnt]._id];
				delete dataset3.index[dataset3.data[cnt]._id];
			}
			
			dataset3.data[cnt].__tempId = dataset3.data[cnt]._id =  record._id;
			dataset3.data[cnt] = record;
			dataset3._originalData[cnt] = record;
			dataset3.setCurrentIndexByRecord(dataset3.data[cnt]);
		},
		
	});
});
