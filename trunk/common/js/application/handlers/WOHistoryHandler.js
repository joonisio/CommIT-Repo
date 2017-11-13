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

define("application/handlers/WOHistoryHandler", 
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
	     "platform/store/SystemProperties"],
function(declare,lang, ModelService, array, ApplicationHandlerBase, WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, FormatterService, Logger, Deferred, all, SystemProperties) {
	return declare( ApplicationHandlerBase, {
		
		init: false,
		
/**@memberOf application.handlers.WOHistoryHandler */
		getRelaedAssetWorkOrders: function(wo){
			
			var deferred = new Deferred();
			
			var asset_filter = {};
			
			
			if(wo.asset != ""?asset_filter["asset"] = wo.asset:false){
				ModelService.filtered('workOrder', PlatformConstants.SEARCH_RESULT_QUERYBASE, asset_filter, 1000, null, null, null).then(function(assetset){
					
					for(var i = 0; i < assetset.data.length; i++){
						if(wo.location)
						{
							if(assetset.data[i].location == wo.location || assetset.data[i].wonum == wo.wonum
								|| assetset.data[i].status == 'CAN')
							{
								assetset._removeRecordFromAllLists(assetset.data[i]);
								i--;
							}
						}
						else{
							if(assetset.data[i].wonum == wo.wonum
									|| assetset.data[i].status == 'CAN')
							{
								assetset._removeRecordFromAllLists(assetset.data[i]);
								i--;
							}
						}
							
					}
					deferred.resolve(assetset);
				});
				
			}
			else{
				deferred.resolve(null);
			}
		
			return deferred.promise;
			
			
		},
		
		comapre_function: function(a, b){
			
			
				if (a.changestatusdate < b.changestatusdate)
				    return 1;
				if (a.changestatusdate > b.changestatusdate)
				    return -1;
				return 0;

		},
		
		getRlatedLocationWorkOrders: function(wo){
			
			var deferred = new Deferred();
			
			
			var loc_filter = {};
			
			if(wo.location != ""? loc_filter["location"] = wo.location:false)
			{
				ModelService.filtered('workOrder', PlatformConstants.SEARCH_RESULT_QUERYBASE, loc_filter, 1000, null, null, null).then(function(locset){
					
					for(var i = 0; i < locset.data.length; i++){
							if(locset.data[i].wonum == wo.wonum || locset.data[i].status == 'CAN')
							{
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
		
		getFilteredWorkOrders: function(wo, limit){ 
			
			var deferred = new Deferred();
			var self = this;
			all([this.getRelaedAssetWorkOrders(wo), this.getRlatedLocationWorkOrders(wo)]).then(function(results){
				
				var assetWO = results[0];
				var locWO = results[1];
				
				var filteredWOset = self.mergeDataset(assetWO, locWO);
				if(filteredWOset == null)
				{
					deferred.resolve(null);
				}
				else
				{
					var filtered_sortedWOset = self.sortDataset(self.comapre_function, filteredWOset);
					//filteredWOset = filteredWOset.sort("changestatusdate desc");
					var filtered_so_limitWOset = self.limitDataSet(filtered_sortedWOset, limit);
					deferred.resolve(filtered_so_limitWOset);
				}
				
			});
			
			return deferred.promise;
			
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
		
		addRecordtoDataset: function(dataset3, record, lasttempid){
			var cnt = dataset3.data.length;
			
			//Create a new record
			dataset3.createNewRecord();
			
			//set the lasttempid of dataset as of th previous record 
			if(lasttempid)
				dataset3._lastTempId = lasttempid;
			
			//remove the index key given by create new record
			//replace it with the incoming record's id
			if(dataset3.index.hasOwnProperty(dataset3.data[cnt]._id)){
				dataset3.index[record._id] = dataset3.index[dataset3.data[cnt]._id];
				delete dataset3.index[dataset3.data[cnt]._id];
			
			}
			
			//set the incoming records id as the current id of new record created
			dataset3.data[cnt].__tempId = dataset3.data[cnt]._id =  record._id;
			
			//replace the data and original data with incoming record
			dataset3.data[cnt] = record;
			dataset3._originalData[cnt] = record;
			dataset3.setCurrentIndexByRecord(dataset3.data[cnt]);
			
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
			var lasttempid = null;
			for (var i in dataset2.data){
				/*dataset3._originalData.push(dataset2.data[i]);
				dataset3.data.push(dataset2.data[i]);
				dataset3._bindDataSetAsRecordOwner(dataset2.data[i]);
				dataset3._appendData(dataset2.data[i]);*/
				
				/*dataset3.createNewRecord();
				if(lasttempid)
					dataset3._lastTempId = lasttempid;
				if(dataset3.index.hasOwnProperty(dataset3.data[cnt]._id)){
					dataset3.index[dataset2.data[i]._id] = dataset3.index[dataset3.data[cnt]._id];
					delete dataset3.index[dataset3.data[cnt]._id];
				
				}
				dataset3.data[cnt].__tempId = dataset3.data[cnt]._id = lasttempid =  dataset2.data[i]._id;
				
				dataset3.data[cnt] = dataset2.data[i];
				dataset3._originalData[cnt] = dataset2.data[i];
				dataset3.setCurrentIndexByRecord(dataset3.data[cnt]);*/
				
				this.addRecordtoDataset(dataset3,dataset2.data[i], dataset3.data[cnt-1]._id);
				cnt++;
				
			}
			
			//dataset3._originalData = dataset3.data;
			return dataset3;
		},
		
		
		limitDataSet: function(dataset, list_limit){
			
			var limitDataset = dojo.clone(dataset);
			/*limitDataset._originalData = [];
			limitDataset.data = [];
			limitDataset.index = {};*/
			
			
			var limit = list_limit;
			var cnt = 0;
			var l_cnt = 0;
			var i = 0;
			while( i< dataset.data.length){
				    if(cnt == limit)
				    {
				    	limitDataset._removeRecordFromAllLists(dataset.data[i]);
				    	i++;
				    	continue;
				    }
					
				    this.setFailureVars(limitDataset,i);
				    //limitDataset.createNewRecord();
					//limitDataset.data[l_cnt] = dataset.data[cnt];
					//limitDataset._originalData[l_cnt] = dataset.data[cnt];
					
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
				
				var filter = {
						wonum: record.wonum,
						siteid: record.siteid
				};
				
				ModelService.filtered('dataSheetResource', null, filter, 10, true, true).then(function(datasheet){
					if (datasheet && datasheet.data[0]){
						record.asfoundstatus = datasheet.data[0].asfoundcalstatus;
						record.asleftstatus = datasheet.data[0].asleftcalstatus;
					}
				});
				
			}
		
		},
		
		renderWOHistoryList: function(eventContext){
			//TODO
			//get list of previous workorder
			//var list_control = eventContext;
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var list_limit = SystemProperties.getProperty('si.wohistory.limitrecords');
			if(!list_limit)
				list_limit = 5;
			
			this.getFilteredWorkOrders(wo, list_limit).then(function(dataset){

			////set the list resource to this workorder list
			if(dataset != null)
			{
				dataset.setResourceName("workOrderHistory");
				dataset.resourceID = 'workOrderHistory';
				dataset._filtered = true;
				var count = dataset.data.length > list_limit?list_limit:dataset.data.length;
				wo.set('wohistorylistsize', count + "");
				eventContext.application.addResource(dataset);
				//eventContext.ui.show("WorkExecution.WOHistoryView");
			//}
			
			//	eventContext.ui.showMessage("No previous records found");
			}else{
				var wohistory = eventContext.application.getResource('workOrderHistory');
				if (wohistory) {
					wohistory.data = [];
					wohistory._originalData = [];
					wohistory._filtered = true;
					wo.set('wohistorylistsize', wohistory.data.length + "");
				}				
			}

			});
			
			
			
		},
		
		showWOHistoryDetails: function(eventContext){
			
			eventContext.ui.show("WorkExecution.WOHistoryDetailView");
			
		},
		
		checkIfNull: function(eventContext, attribute){
			var wohistory = eventContext.application.getResource('workOrderHistory').getCurrentRecord();
			return wohistory[attribute] == null?false:true;
			
		},
		
		
		hideShowField: function(eventContext){
			var display_field = this.checkIfNull(eventContext, eventContext.resourceAttribute);
			eventContext.getParent().setDisplay(display_field);
			eventContext.setDisplay(display_field);
			
		},

	});
});
