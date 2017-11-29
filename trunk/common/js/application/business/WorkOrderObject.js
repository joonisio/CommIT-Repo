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

define("application/business/WorkOrderObject", 
["application/business/FieldUtil",
 "platform/model/ModelService",
 "dojo/_base/array",
 "application/business/WorkOrderStatusHandler",
 "application/business/ActualLaborObject",
 "platform/exception/PlatformRuntimeException",
 "platform/util/DateTimeUtil",
 "platform/logging/Logger",
 "platform/auth/UserManager",
 "dojo/Deferred",
 "platform/util/CurrentTimeProvider",
 "platform/store/_ResourceMetadataContext",
 "platform/warning/PlatformRuntimeWarning",
 "platform/translation/SynonymDomain"], 
 function(fieldUtil, ModelService, array, WorkOrderStatusHandler, ActualLaborObject, PlatformRuntimeException, DateTimeUtil, Logger, UserManager, Deferred, CurrentTimeProvider, ResourceMetaData, PlatformRuntimeWarning, SynonymDomain) {	
	return {
/**@memberOf application.business.WorkOrderObject */
		onInitialize : function(workOrder) {
			console.log('application.business.WorkOrderObject');
			workOrder.set("locationdesc", workOrder.get('maxlocationdesc'));
			
			
			
			if(workOrder.get('assetdesc')==null){
				workOrder.set("assetnumanddescription",'');
				
			}
			
			workOrder.set("assetdesc", workOrder.get('maxassetdesc'));
			
			if(workOrder.get('locationdesc')==null){
				workOrder.set("locationanddescription",'');
				
			}
			
			fieldUtil.initCompositeField("wonum", "description", "wonumanddescription", workOrder);
			fieldUtil.initCompositeField("asset", "assetdesc", "assetnumanddescription", workOrder);
			fieldUtil.initCompositeField("location", "locationdesc", "locationanddescription", workOrder);	
			workOrder.set("internalStatus", WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status")));
			workOrder.set("statusdesc", WorkOrderStatusHandler.getInstance().toDescription(workOrder.get("status")));
			
			workOrder.watch("asset", function(){
				fieldUtil.initCompositeField("asset", "assetdesc", "assetnumanddescription", workOrder);
			});
			
			workOrder.watch("maxassetdesc", function(){
				fieldUtil.initCompositeField("asset", "assetdesc", "assetnumanddescription", workOrder);
			});		
			
			workOrder.watch("status", function(){
				this.set("statusdesc", WorkOrderStatusHandler.getInstance().toDescription(this.get("status")));
				this.set("internalStatus", WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status")));
			});		
			
			workOrder.watch("description", function(){
				fieldUtil.initCompositeField("wonum", "description", "wonumanddescription", workOrder);
			});	
						
			var status = WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			workOrder.setReadOnly(status=='CAN');
			
			// I guess just eat the promise here and let fill in asynchronously
			this.refreshClassDescription(workOrder);			
		},
		onAdd : function(workOrder) {
			// Implement default behavior for new work orders - e.g.: predefined values
            // setting siteid using the user's default     
			workOrder.set("siteid", UserManager.getInfo("defsite"));
			
		},
		beforeSave : function(workOrder) {
			// Implement validation for workOrder			
			fieldUtil.initCompositeField("asset", "assetdesc", "assetnumanddescription", workOrder);					
		},
		checkDates: function(startDateTime, endDateTime) {
			Logger.trace("startDateTime: " + startDateTime + " endDateTime: " + endDateTime);
			if (endDateTime) {
				startDateTime = DateTimeUtil.zeroSecondsAndMilliseconds(startDateTime);
				endDateTime = DateTimeUtil.zeroSecondsAndMilliseconds(endDateTime);
				if(endDateTime < startDateTime){																	
					throw new PlatformRuntimeException('endtimebeforestarttime');
				}
			}
		},
		
		schedStartChanged: function(workOrder, newStartDateTimeString, previousStartDateTimeString){
			var startdatetime = workOrder.getAsDateOrNull('starttime');
			var enddatetime = workOrder.getAsDateOrNull('finishtime');
			
			this.checkDates(startdatetime, enddatetime);	
		},
		
		schedFinishChanged: function(workOrder, newEndDateTimeString, previousEndDateTimeString){
			var startdatetime = workOrder.getAsDateOrNull('starttime');
			var enddatetime = workOrder.getAsDateOrNull('finishtime');
			
			//Validate enddate only if start date is populated.
			if (startdatetime) {
				this.checkDates(startdatetime, enddatetime);
			}
		},
		
		statusChanged : function(workOrder, newValue, previousValue) {
	         workOrder.set("statusdesc", WorkOrderStatusHandler.getInstance().toDescription(newValue));
	         workOrder.set("internalStatus", WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status")));
		},
		startWorkWithTimer: function(workOrder, startTime, alsoChangeToInprog, taskSet) {
			Logger.trace("[WorkOrderObject] startWorkWithTimer");
			/* basic logic to start a timer - notice: it is not fully implemented */
			if(!this.isStarted(workOrder)){
				workOrder.set("started", true);							
				if(alsoChangeToInprog && this.isApproved(workOrder)){
					Logger.trace("[WorkOrderObject] startWorkWithTimer call inProgress");
					this.inProgress(workOrder, startTime, null, taskSet);
					Logger.trace("[WorkOrderObject] startWorkWithTimer return  inProgress");
				}
			}						
		},
		cancelWorkWithTimer: function(workOrder){
			workOrder.set("started", false);
		},
		stopWorkWithTimer: function(workOrder, woTimer, currentLabor, currentCraftRate, alsoCompleteWO, laborTransactionTypeSet, timerStatus, taskSet){	
			Logger.trace("[WorkOrderObject] stopWorkWithTimer");
			/* basic logic to stop a timer - notice: it is not fully implemented */
			var start = woTimer.getAsDateOrNull("startTime");
			var end = woTimer.getAsDateOrNull("endTime");
			var duration = woTimer.get("duration");
			var transType = woTimer.get("transtype");

			if(this.isStarted(workOrder)){
				Logger.trace("[WorkOrderObject] stopWorkWithTimer is started");
				workOrder.set("started", false);
				
				//Support passing null labor if we only want to stop the timer, but not create labor
				if(currentLabor){
					// laborSet might have not been loaded - dangerous design!
					Logger.trace("[WorkOrderObject] stopWorkWithTimer user not is member of crew ");
					var laborSet = workOrder.getLoadedModelDataSetOrNull("actuallaborlist");
					if(laborSet){
						ActualLaborObject.reportWork(laborSet.createNewRecord(), currentLabor, currentCraftRate, start, end, duration, laborTransactionTypeSet, timerStatus, transType);
					}
					else{					   
					    workOrder.getModelDataSet("actuallaborlist").
					    then(function(laborSet){
					    	Logger.trace("[WorkOrderObject] stopWorkWithTimer call reportWork ");
					    	ActualLaborObject.reportWork(laborSet.createNewRecord(), currentLabor, currentCraftRate, start, end, duration, laborTransactionTypeSet, timerStatus, transType);
					    	Logger.trace("[WorkOrderObject] stopWorkWithTimer return  reportWork ");
					    }).
					    otherwise(function(error){
					    	Logger.trace("[WorkOrderObject] stopWorkWithTimer return  reportWork erro = " + error.error.getMessage());
					    	switch (true) {				
							case (error.error instanceof PlatformRuntimeException):						
								self.application.showMessage(error.error.getMessage());
								break;				
							}
					    });
					}
			    }
				
				if(alsoCompleteWO && !this.isCompleted(workOrder)){
					Logger.trace("[WorkOrderObject] stopWorkWithTimer call complete ");
					this.complete(workOrder, CurrentTimeProvider.getCurrentTime(), null, taskSet);
					Logger.trace("[WorkOrderObject] stopWorkWithTimer return complete ");
				}
			}							
		},
		inProgress: function(workOrder, statusDate, memo, taskSet){
			var inProg = WorkOrderStatusHandler.getInstance().toDefaultExternalLabel("INPRG");
			this.changeStatus(workOrder, inProg, statusDate, memo, taskSet); 
		},
		cannotBeStarted: function(workOrder){
			var status = WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			return status == "WAPPR" || status == "CLOSE" || status == "CAN" || workOrder.isErrored(); 
		},
		complete: function(workOrder, statusDate, memo, taskSet){				
			var comp = WorkOrderStatusHandler.getInstance().toDefaultExternalLabel("COMP");
			this.changeStatus(workOrder, comp, statusDate, memo, taskSet);
		},
		isStarted: function(workOrder){
			return workOrder.get("started") || false;
		},
		isCompleted: function(workOrder){
			var status = WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			return status == "COMP" || status == "CLOSE";
		},
		isApproved: function(workOrder){
			var status = WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			return status == "APPR";
		},
		isInProgres: function(workOrder){
			var status = WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			return status == "INPRG";
		},
		changeStatus: function(workOrder, newStatus, statusDate, memo, taskSet, esig){
			Logger.trace("[WorkOrderObject] changeStatus ");
			var currentStatus = workOrder.get("status");
			if(WorkOrderStatusHandler.getInstance().canPerformTransition(currentStatus, newStatus)){
				workOrder.openPriorityChangeTransaction();
				workOrder.set("status", newStatus);
				workOrder.setDateValue("statusDate", statusDate);
				workOrder.setDateValue("changestatusdate", statusDate);
				workOrder.set("memo", memo);				
				if(taskSet && taskSet.data.length>0){
					this.changeStatusOfTasks(workOrder, newStatus, statusDate, memo, taskSet);
				}
			}
			else{			
				Logger.trace("[WorkOrderObject] changeStatus status can not be changed");
				 throw new PlatformRuntimeException('invalidstatustransition',[currentStatus, newStatus]);
			}
			Logger.trace("[WorkOrderObject] changeStatus status changed");
		},
		changeStatusOfTasks: function(workOrder, newStatus, statusDate, memo, taskSet){
			if(taskSet && taskSet.isFiltered()) {
				taskSet.clearFilterAndSort();
			}
				
			var inheritingTasks = taskSet.find("inheritstatuschanges==$1", true);
			
			var self=this;
			array.forEach(inheritingTasks, function(record){
				if(WorkOrderStatusHandler.getInstance().canPerformTransition(record.get("status"), newStatus)){
					self.changeStatus(record, newStatus, statusDate, memo, null);
				}
			});
		},
		
		taskChangeStatus: function(task, newStatus, statusDate, memo, esig){
			Logger.trace("[WorkOrderObject] taskChangeStatus");
			var taskId = task.get("taskid");
			var currentStatus = task.get("status");

			if(WorkOrderStatusHandler.getInstance().canPerformTransition(currentStatus, newStatus)){
				if (task.getParent() && !esig) {
					task.getParent().openPriorityChangeTransaction();
				}
				task.set("status", newStatus);
				task.setDateValue("statusDate", statusDate);
				task.setDateValue("changestatusdate", statusDate);
				task.set("memo", memo);				
				if (task.getParent() && !esig) {
					task.getParent().closePriorityChangeTransaction();
				}
			}
			else{		
				Logger.trace("[WorkOrderObject] taskChangeStatus status can not be changed");
				 throw new PlatformRuntimeException('invalidstatustransition',[currentStatus, newStatus]);
			}
			Logger.trace("[WorkOrderObject] taskChangeStatus status changed");
		},

		descriptionChanged: function(workOrder){
			workOrder.set("descriptionModified",true);
			fieldUtil.initCompositeField("wonum", "description", "wonumanddescription", workOrder);
		},
		
		assetChanged: function(workOrder){
			workOrder.markAsModified('location');
			fieldUtil.initCompositeField("asset", "assetdesc", "assetnumanddescription", workOrder);
		},
		
		locationChanged: function(workOrder){
			workOrder.markAsModified('asset');
			fieldUtil.initCompositeField("location", "locationdesc", "locationanddescription", workOrder);
		},
		
		undoAssetLocMeters: function(workOrder){
			if (workOrder.isUndoInProgress()){
				var assetLocMeterReadings = workOrder['assetlocmeterlist'];
				var assetlist = [];
				var locationlist = [];
				
				if (assetLocMeterReadings){
					if (assetLocMeterReadings.data && (ResourceMetaData.getResourceMetadata("locationMeters") || ResourceMetaData.getResourceMetadata("assetMeters"))){
						array.forEach(assetLocMeterReadings.data, function(meterrecord){
							if(ResourceMetaData.getResourceMetadata("locationMeters")){
								var location = meterrecord.location;
								if (location){
									if (locationlist.indexOf(location)<0){
										locationlist.push(location);
									}
								}
							}
							if (ResourceMetaData.getResourceMetadata("assetMeters")){
								var assetnum = meterrecord.assetnum;
								if (assetnum){
									if (assetlist.indexOf(assetnum)<0){
										assetlist.push(assetnum);
									}
								}
							}
						});
						
						var stringAssetList = "";
						var stringLocationList = "";
						var assetFirstTime = true;
						var locationFirstTime = true;
						
						assetlist.forEach(function(asset){
							if (assetFirstTime){
								stringAssetList='%22'+asset+'%22';	
								assetFirstTime = false;
							} else {
								stringAssetList+=',%22'+asset+'%22';		
							}
						});	

						locationlist.forEach(function(location){
							if (locationFirstTime){
								stringLocationList='%22'+location+'%22';	
								locationFirstTime = false;
							} else {
								stringLocationList+=',%22'+location+'%22';		
							}
						});
						
						var siteid = workOrder.get('siteid');
						
						if (stringAssetList.length>0){
							var assetMeterMeta = ResourceMetaData.getResourceMetadata("assetMeters");
							assetMeterMeta.setWhereClause("spi:asset{oslc:shortTitle in ["+stringAssetList+"]} and spi:siteid=%22"+siteid+"%22");
							var assetMetersPromise = ModelService.all('assetMeters', null,null, false);	
							assetMetersPromise.then(function(assetMeterSet){
								array.forEach(assetMeterSet.data, function(assetMeterRecord){
									assetMeterRecord.set('localLastReading', null);
									assetMeterRecord.set('localLastReadingDate', null);
								});
								ModelService.save(assetMeterSet);
							});
						}
						
						if (stringLocationList.length>0){
							var locationMeterMeta = ResourceMetaData.getResourceMetadata("locationMeters");
							locationMeterMeta.setWhereClause("spi:location{oslc:shortTitle in ["+stringLocationList+"]} and spi:siteid=%22"+siteid+"%22");
							var locationMetersPromise = ModelService.all('locationMeters', null,null, false);
							
							locationMetersPromise.then(function(locationMeterSet){
								array.forEach(locationMeterSet.data, function(locationMeterRecord){
									locationMeterRecord.set('localLastReading', null);
									locationMeterRecord.set('localLastReadingDate', null);
								});
								ModelService.save(locationMeterSet);
							});
						}
					}
					workOrder['assetlocmeterlist'].data = [];
				}	
			}		
		},
				
		afterPatch : function(workOrder){
			//execute asset/loc meter undo processing
			this.undoAssetLocMeters(workOrder);
		},
	
		updateSpecifications : function(workOrder) {
			var updateDeferred = new Deferred();
			var classstructureid = workOrder.get('classstructureid');
			if (classstructureid != null) {						
				Logger.trace("[WorkOrderObject] Update workorder specifications for classstructureid: " + classstructureid);
				workOrder.getModelDataSet("workOrderSpec", true).
				    then(function(workOrderSpecs){
				    	Logger.trace("[WorkOrderObject] clearing existing specifications.");
				    	workOrderSpecs.deleteLocalAll();
				    	var siteid = workOrder.get('siteid');
				    	var orgid = workOrder.get('orgid');
				    	//Need to filter where site and org is null, where org matches, and where site matches
						/*filter = [{'classstructureid' : classstructureid, 'siteid':'null', 'orgid':'null'},
						          {'classstructureid' : classstructureid, 'siteid':'null', 'orgid':orgid},
						          {'classstructureid' : classstructureid, 'siteid':siteid}];*/
				    	// Above filter doesn't work on Windows
				    	filter = {'classstructureid' : classstructureid};
						
						
						var classspecPromise = ModelService.filtered('classSpec', null, filter, 1000, false, true);						
						classspecPromise.then(function(classspecSet){						
							if (classspecSet.data)
								Logger.trace("[WorkOrderObject] found " + classspecSet.data.length + " new classifications, creating in memory");
								array.forEach(classspecSet.data, function(classspecSetRecord){
									var classspecsiteid = classspecSetRecord.get('siteid');
									var classspecorgid = classspecSetRecord.get('orgid');
									//Need to filter where site and org is null, where org matches, and where site matches
									if ( ( !classspecsiteid && !classspecorgid ) || 
											(!classspecsiteid && classspecorgid == orgid) ||
											(classspecsiteid == siteid && classspecorgid == orgid)){
										var newspec = workOrderSpecs.createNewRecord();
										newspec.set('classspec', classspecSetRecord.get('classspecid'));
										newspec.set('domainid', classspecSetRecord.get('domainid'));
										newspec.set('assetattrid', classspecSetRecord.get('assetattrid'));
	//									newspec.set('assetattributeid', classspecSetRecord.get('assetattributeid'));
										newspec.set('description', classspecSetRecord.get('assetdescription'));
										var sectionval = (classspecSetRecord.get('section') == null) ? '' : classspecSetRecord.get('section');
										newspec.set('section', sectionval);
										newspec.set('datatype', classspecSetRecord.get('datatype'));
										newspec.set('displaysequence', classspecSetRecord.get('sequence'));
										newspec.set('orgid', classspecSetRecord.get('orgid'));
	//									newspec.set('siteid', classspecSetRecord.get('siteid'));
										newspec.set('classstructureid', classspecSetRecord.classstructureid);
										newspec.set('mandatory', classspecSetRecord.get('mandatory'));
										newspec.set('measureunitid', classspecSetRecord.get('measureunitid'));
										newspec.set('refobjectname', 'WORKORDER');
										
									}
								});
								// set to beginning of list for paging							
								if (workOrderSpecs.count() > 0) {
									workOrderSpecs.setCurrentIndex(0);
							}
							updateDeferred.resolve(false);
						});				    	
				    }).
				    otherwise(function(error){
				    	Logger.errorJSON("[WorkOrderObject] updateSpecifications error: ", error);
				    	switch (true) {				
						case (error.error instanceof PlatformRuntimeException):						
							self.application.showMessage(error.error.getMessage());
							break;				
						}
				    	updateDeferred.reject(error);
			    });			
			} else {
				Logger.trace("[WorkOrderObject] no specifications found");
				updateDeferred.resolve(false);
			}
			return updateDeferred.promise;
		},
	
		refreshClassDescription : function(workOrder) {			
			var refreshDeferred = new Deferred();
			var classstructureid = workOrder.get('classstructureid');
			if (classstructureid != null) {		
				var filter = {'classstructureid': classstructureid};
				ModelService.filtered('classstructure', null, filter, 10, false, true).then(function(dataSet) {
					if (dataSet.count() > 0) {
						var classRec = dataSet.getRecordAt(0);
						workOrder.set('classificationdesc', classRec.get('description'));	
						workOrder.set('classificationpath', classRec.get('hierarchypath'));
					} else {
						workOrder.set('classificationdesc', workOrder.get('classstructureid'));	
						workOrder.set('classificationpath', workOrder.get('classstructureid'));
					}					
					refreshDeferred.resolve(dataSet);
				}).otherwise(function(e){
					refreshDeferred.reject(new PlatformRuntimeWarning('error fetching classstructure info'));
				});
			}
			else {
				workOrder.set('classificationdesc', null);
				workOrder.set('classificationpath', null);
				refreshDeferred.resolve(false);
			}
			return refreshDeferred.promise;
		},
		
		isCalibration: function(workOrder, eventContext) {
			var worktypes = eventContext.application.getResource("additionalworktype");
			var result = worktypes.find("worktype == '" + workOrder.get('worktype') + "' && orgid == '" + workOrder.get('orgid') + "'");
			worktype = result[0] ? result[0].type : null;
			if(worktype) {
				var domainWorkType = eventContext.application.getResource("domainworktype");
				return SynonymDomain.resolveToInternal(domainWorkType, worktype, workOrder.get('orgid')) == 'CAL';
			}
			else {
				return false;
			}
		}
	};
	
});
