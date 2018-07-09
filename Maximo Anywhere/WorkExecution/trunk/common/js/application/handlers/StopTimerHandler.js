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

define("application/handlers/StopTimerHandler", 
[ "dojo/_base/declare",
  "platform/model/ModelService",
  "platform/model/ModelData",
  "platform/model/ModelDataSet",
  "platform/handlers/_ApplicationHandlerBase",
  "application/business/WorkOrderObject",
  "application/business/WorkOrderTimer",
  "application/business/MaxVars",  
  "platform/auth/UserRolesManager",
  "platform/auth/UserManager",
  "platform/translation/MessageService",
  "platform/translation/SynonymDomain",
  "platform/exception/PlatformRuntimeException",
  "platform/warning/PlatformRuntimeWarning",
  "platform/util/PlatformConstants",
  "platform/util/DateTimeUtil",
  "application/handlers/ReportByCrewHandler",
  "application/handlers/CommonHandler",
  "application/business/CrewLaborObject",
  "application/business/CrewToolObject",
  "dojo/promise/all",
  "platform/logging/Logger",
  "dojo/Deferred",
  "application/business/util/CrewUtil",
  "dojo/_base/array",
  "application/handlers/WOGeolocationHandler"
  ],
function(declare, ModelService, ModelData, ModelDataSet, ApplicationHandlerBase, WorkOrderObject, WorkOrderTimer, MaxVars, 
		UserRolesManager, UserManager, MessageService, SynonymDomain, PlatformRuntimeException, PlatformRuntimeWarning, 
		PlatformConstants, DateTimeUtil, ReportByCrewHandler, CommonHandler, CrewLaborObject, CrewToolObject, 
		all, Logger, Deferred, CrewUtil, arrayUtil, WOGeolocationHandler) {
	return declare(ApplicationHandlerBase, {
		name: 'StopTimerHandler',
		_originalStartTime: null,
		
		/* this method is called when the stop timer view is loaded */
/**@memberOf application.handlers.StopTimerHandler */
		initStopWorkView: function(eventContext){
			/* we acessing the record that is on the page */
			var woTimer = eventContext.getCurrentRecord();
			this._originalStartTime = woTimer.getAsDateOrNull('startTime');
			/* endTime is watched in the WorkOrderTimer object and does the time diff calculation for the duration */
			var currentTime =  eventContext.application.getCurrentDateTime();
			woTimer.setDateValue('endTime', currentTime);
			
			var myLaborSet = eventContext.application.getResource('mylabor');
			var myLaborCraftSet = eventContext.application.getResource("mylaborcraftrate");
			
			if(myLaborSet.count() > 0) {
				woTimer.set('laborname', myLaborCraftSet.getRecordAt(0).get('laborname'));
				woTimer.set('labor', myLaborSet.getRecordAt(0).get('laborcode'));
			} else {
				this.application.showMessage(MessageService.createStaticMessage("errornolaborfound").getMessage());
			}
			
			var defWonum = woTimer.get("deferredWonum");
			var defStartTime = woTimer.getAsDateOrNull("deferredStartTime");
			if (defWonum && defStartTime) {
			    //Copy from deferredWonum and deferredStartTime to the wonum and startTime fields
			    woTimer.set("wonum",defWonum);
			    woTimer.setDateValue("startTime",defStartTime);
			    woTimer.setNullValue("deferredWonum");
			    woTimer.setNullValue("deferredStartTime");
			}
			
			woTimer.setNullValue('transtype');
			woTimer.set('useCrewToCreateActual', false);
		},
		deleteTimeEntryClickHandler: function(eventContext){
			var self = this;
			var woTimer = eventContext.getCurrentRecord();
			var workOrderSet = eventContext.application.getResource("workOrder");
			var nextWO = workOrderSet.getCurrentRecord();
			//TODO: move this lookup down into the business object layer
			var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");			
			var workOrderList = workOrderSet.find("remoteid == $1", woTimer.get("workOrderId"));
			if(workOrderList.length > 0){
				var startedWorkOrder = workOrderList[0];
				WorkOrderTimer.cancelTimerForWorkOrder(woTimer, startedWorkOrder, oslcmaxvars, null, nextWO);
				ModelService.saveAll([workOrderSet, woTimer.getOwner()]).then(function(){
					self.ui.hideCurrentView(PlatformConstants.CLEANUP);
				}).otherwise(function(error){
					self.application.showMessage(MessageService.createStaticMessage("errorwhilesavingworkorder").getMessage());
				});
				
				if (startedWorkOrder) {
					var WOGeolocation = new WOGeolocationHandler();
					if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
						WOGeolocation.clearLBSLocationWorkNumber();
						Logger.log("LBS Location tracking request cleared for work order :: " + startedWorkOrder.get("wonum"));
					}
				}
				
			}else{
				this.application.showMessage(MessageService.createStaticMessage("noworkorderfound").getMessage());
			}
		},				
		pauseWorkHandler: function(eventContext){
			var self = this;
			Logger.trace("[StopTimerHandler] Pause selected at the stopview");
			eventContext.application.showBusy();

			//Validates page consistency before begin operation			
			this.validatePage(eventContext);
			Logger.trace("[StopTimerHandler] Page validated");

			var woTimer = eventContext.getCurrentRecord();
			Logger.trace("[StopTimerHandler] wo timer " + woTimer);
			var workOrderSet = eventContext.application.getResource("workOrder");
			//TODO: move this lookup down into the business object layer
			var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");
			//TODO: move this lookup down into the business object layer
			var laborTransactionTypeSet = eventContext.application.getResource("domainlabortransactiontype");
			var workOrderList = workOrderSet.find("remoteid == $1", woTimer.get("workOrderId"));
			var timerStatusSet = eventContext.application.getResource("domaintimerstatus");
			var timerStatus = SynonymDomain.resolveToDefaultExternal(timerStatusSet, 'COMPLETE');

			var starttime = woTimer.getAsDateOrNull("startTime");
			var endtime = woTimer.getAsDateOrNull("endTime");
			var duration = woTimer.get("duration");
			if(!this.validateDatesTolerance(starttime, endtime, oslcmaxvars)){
				this.application.showMessage(MessageService.createStaticMessage('invalidlabordatetime').getMessage());
				return;
			}

			var transType = woTimer.getPendingOrOriginalValue('transtype');
			if (!transType) {
				transType = SynonymDomain.resolveToDefaultExternal(laborTransactionTypeSet, 'WORK');
			}
			
			var myLaborSet = eventContext.application.getResource("mylabor");
			var myLaborCraftSet = eventContext.application.getResource("mylaborcraftrate");
			var myLaborCrew = CrewUtil.getUserCrew(eventContext);
			
			if(workOrderList.length > 0 && myLaborSet.count() > 0) {
				var startedWorkOrder = workOrderList[0];

				if(myLaborCraftSet.count() > 0) {
					WorkOrderTimer.appValidate(woTimer);
					
					if(myLaborCrew && myLaborCrew.get('crewid')){
						Logger.trace("[StopTimerHandler] User is member of crew");												
						if(woTimer.get('useCrewToCreateActual')){	//checkbox is marked
							Logger.trace("[StopTimerHandler] User select to pause WO and review crew report");
							Logger.trace("[StopTimerHandler] Building list for review");
							this._buildCrewLists(eventContext, starttime, endtime, timerStatus, duration, transType)
							.then(function() {
								Logger.trace("[StopTimerHandler] Built list for review");
								woTimer.set('paused',true);
								Logger.trace("[StopTimerHandler] Show crew review UI");
								self.ui.show('WorkExecution.CrewReviewListView');
							});
						}
						else {							
							Logger.trace("[StopTimerHandler]User select to pause and dont want to review ");
							Logger.trace("[StopTimerHandler] Build list for no review");
							this._buildCrewLists(eventContext, starttime, endtime, timerStatus, duration, transType)
							.then(function() {
								Logger.trace("[StopTimerHandler] Built list for no review");

								//creating the actual
								var laborSet =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource");
								var toolSet =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource");
								var curr =  CrewUtil.getUserCrew(eventContext);

								var actuallaborlist =  null;
								var actualtoollist =  null;

								var woSet = CommonHandler._getAdditionalResource(eventContext,'workOrder');

								if(woSet.getCurrentRecord().get('wonum') == eventContext.getCurrentRecord().get('wonum') ){
									Logger.trace("[StopTimerHandler] User selects to pause a previous WO we need to get the previous instance to report crew");

									actuallaborlist =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist");
									actualtoollist =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actualtoollist");

									Logger.trace("[StopTimerHandler] Creating labor report for crew on pause with no review");
									CrewLaborObject.createAtualLbaorForCrew(laborSet, actuallaborlist, curr);
									Logger.trace("[StopTimerHandler]  labor report created for crew on pause with no review");

									Logger.trace("[StopTimerHandler] Creating tool report for crew on pause with no review");
									CrewToolObject.createAtualToolForCrew(toolSet, actualtoollist);
									Logger.trace("[StopTimerHandler] Tool report created  for crew on pause with no review");

									try {
										Logger.trace("[StopTimerHandler] pausing timer for user member of crew without review");
										WorkOrderTimer.pauseTimerForWorkOrder(woTimer, startedWorkOrder, null, myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, null);
										Logger.trace("[StopTimerHandler] saving WO and timer");
										ModelService.saveAll([workOrderSet, woTimer.getOwner()]).then(function(){
											Logger.trace("[StopTimerHandler] saved WO and timer");
											self.ui.hideCurrentView(PlatformConstants.CLEANUP);
										}).otherwise(function(error){	
											Logger.trace("[StopTimerHandler] Error saving labor or WO " + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
											self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
										});
										
										if (startedWorkOrder) {
											var WOGeolocation = new WOGeolocationHandler();
											if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
												WOGeolocation.clearLBSLocationWorkNumber();
												Logger.log("LBS Location tracking request cleared for work order :: " + startedWorkOrder.get("wonum"));
											}
										}
										
									}catch(error){
										Logger.trace("[StopTimerHandler] Error when pausing previous " + MessageService.createStaticMessage(error.getMessage()).getMessage());
										switch (true) {
											case (error instanceof PlatformRuntimeException):						
												self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
											break;				
										}									
									}
								} else {
									Logger.trace("[StopTimerHandler] The WO to be paused is the same tha user select ");
									var nextWO = workOrderSet.getCurrentRecord();
									CommonHandler._clearFilterForResource(eventContext,workOrderSet);
									var wo = workOrderSet.find('wonum == $1', eventContext.getCurrentRecord().get('wonum'))[0];
									var actuallaborlistPromise = wo.getModelDataSet('actuallaborlist');
									var actualtoollistPromise = wo.getModelDataSet('actualtoollist');
									all([actuallaborlistPromise, actualtoollistPromise]).then(function(results){
										var actuallaborlist = results[0];
										var actualtoollist = results[1];
										Logger.trace("[StopTimerHandler] Creating labor report for crew on pause with no review");
										CrewLaborObject.createAtualLbaorForCrew(laborSet, actuallaborlist, curr);	
										Logger.trace("[StopTimerHandler]  labor report created for crew on pause with no review");

										Logger.trace("[StopTimerHandler] Creating tool report for crew on pause with no review");
										CrewToolObject.createAtualToolForCrew(toolSet, actualtoollist);
										Logger.trace("[StopTimerHandler] Tool report created  for crew on pause with no review");

										try {
											Logger.trace("[StopTimerHandler] pausing timer for user member of crew without review and WO to be paused is the same that user selects ");
											WorkOrderTimer.pauseTimerForWorkOrder(woTimer, wo, null, myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, null, nextWO);
											Logger.trace("[StopTimerHandler] saving WO and timer");
											ModelService.saveAll([wo.getOwner(), woTimer.getOwner()]).then(function(){
												Logger.trace("[StopTimerHandler] saved WO and timer");
												self.ui.hideCurrentView(PlatformConstants.CLEANUP);
											}).otherwise(function(error){	
												Logger.trace("[StopTimerHandler] Error saving labor or WO " + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
												self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
											});
											
											if (wo) {
												var WOGeolocation = new WOGeolocationHandler();
												if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
													WOGeolocation.clearLBSLocationWorkNumber();
													Logger.log("LBS Location tracking request cleared for work order :: " + wo.get("wonum"));
												}
											}
											
										}catch(error){
											Logger.trace("[StopTimerHandler] Error when pausing same as selected" + MessageService.createStaticMessage(error.getMessage()).getMessage());
											switch (true) {
											case (error instanceof PlatformRuntimeException):						
												self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
												break;				
											}
										}		
									});
								}
							});
						}
					} 
					else {
						try{
							Logger.trace("[StopTimerHandler] Pausing for not member of crew");
							var nextWO = workOrderSet.getCurrentRecord();
							WorkOrderTimer.pauseTimerForWorkOrder(woTimer, startedWorkOrder, myLaborSet.getRecordAt(0), myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, null, nextWO);
							Logger.trace("[StopTimerHandler] saving WO and timer");
							ModelService.saveAll([workOrderSet, woTimer.getOwner()]).then(function(){
								Logger.trace("[StopTimerHandler] saved WO and timer");
								self.ui.hideCurrentView(PlatformConstants.CLEANUP);
							}).otherwise(function(error){	
								Logger.trace("[StopTimerHandler] Error saving labor or WO " + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
								self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
							});
							
							if (startedWorkOrder) {
								var WOGeolocation = new WOGeolocationHandler();
								if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
									WOGeolocation.clearLBSLocationWorkNumber();
									Logger.log("LBS Location tracking request cleared for work order :: " + startedWorkOrder.get("wonum"));
								}
							}
							
						}catch(error){
							Logger.trace("[StopTimerHandler] Error when pausing and user not is member of crew" + MessageService.createStaticMessage(error.getMessage()).getMessage());
							switch (true) {
							case (error instanceof PlatformRuntimeException):						
								self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
								break;				
							}
						}						
					}
				} else {
					this.application.showMessage(MessageService.createStaticMessage("errornocraftfound").getMessage());
				}
			}else{
				this.application.showMessage(MessageService.createStaticMessage("errornolaborfound").getMessage());		
			}
		},
		
		/**
		 * Handle the status change to COMPLETE when stopping timer.
		 */
		completeWorkHandler: function(eventContext,skipDynamicCheck){
			// WorkOrderTimer.stopTimerForWorkOrder passes true for alsoCompleteWO to WorkOrderObject, so we 
			// are always going to change status to COMP when this function is called
			
			//show busy indicator
			eventContext.application.showBusy();			
			
			var self = this;
			var fetchPromise = new Deferred();	
			var workOrder=eventContext.application.getResource('workOrder').getCurrentRecord();
			
			var hasCalibration = WorkOrderObject.isCalibration(workOrder, eventContext);	
			if(!hasCalibration || skipDynamicCheck==true) {
				fetchPromise.resolve();
			}
				
			//CAL: validate dynamic check values			
			var DataSheetHandler = null;
			if(hasCalibration && skipDynamicCheck!=true) {
				DataSheetHandler = this.application["application.handlers.DataSheetHandler"];
				fetchPromise = DataSheetHandler.fetchDataSheetList(eventContext);
			}
			
			fetchPromise.then(function(){
				if(hasCalibration) {
					if(!skipDynamicCheck || skipDynamicCheck==false){
						var doChangeStatus = self.calibrationDynamicCheck(eventContext,'COMP',skipDynamicCheck);
						
						//hide busy indicator
						eventContext.application.hideBusy();
						
						if(doChangeStatus==true){
							return;
						}	
					}
				}

				//hide busy indicator
				eventContext.application.hideBusy();
				
				// check for esig
				var EsigHandler = self.application["platform.handlers.EsigHandler"];
				if (EsigHandler.isEsigRequired(self, eventContext.application.getResource("workOrder"), 'status')){
					// show esig
					EsigHandler.showEsig(self, self.completeWorkHandler_final, [eventContext]);
				}
				else{
					self.completeWorkHandler_final(eventContext);
				}	
			});


		},

		calibrationDynamicCheck : function(eventContext,internalStatus,skipDynamicCheck){
			var handler = eventContext.application['application.handlers.StatusChangeHandler'];
			var workOrder=eventContext.application.getResource('workOrder').getCurrentRecord();
			var hasCalibration = WorkOrderObject.isCalibration(workOrder, eventContext);
			
			if(hasCalibration) {
				if(!skipDynamicCheck){
					return handler.calibrationDynamicCheckForStatusChange(eventContext,internalStatus);	
				} else {
					return false;
				}
			}	
		},
		
		
		completeWorkHandler_final: function(eventContext){
			Logger.trace("[StopTimerHandler] stopping WO");
			eventContext.application.showBusy();
			var self = this;
			
			//Validates page consistency before begin operation
			this.validatePage(eventContext);			
			
			var woTimer = eventContext.application.getResource('workOrderTimer').getCurrentRecord();
			Logger.trace("[StopTimerHandler]Stopping WO timer info = " + woTimer);
			var workOrderSet = eventContext.application.getResource("workOrder");
			//TODO: move this lookup down into the business object layer
			var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");
			//TODO: move this lookup down into the business object layer			
			var laborTransactionTypeSet = eventContext.application.getResource("domainlabortransactiontype");			
			var workOrderList = workOrderSet.find("remoteid == $1", woTimer.get("workOrderId"));	
			var timerStatusSet = eventContext.application.getResource("domaintimerstatus");
			var timerStatus = SynonymDomain.resolveToDefaultExternal(timerStatusSet, 'COMPLETE');
			
			var starttime = woTimer.getAsDateOrNull("startTime");
			var endtime = woTimer.getAsDateOrNull("endTime");
			var duration = woTimer.get("duration");
			
			if(!this.validateDatesTolerance(starttime, endtime, oslcmaxvars)){
				this.application.showMessage(MessageService.createStaticMessage('invalidlabordatetime').getMessage());
				return;
			}
			
			var transType = woTimer.getPendingOrOriginalValue('transtype');
			if (!transType) {
				transType = SynonymDomain.resolveToDefaultExternal(laborTransactionTypeSet, 'WORK');
			}
			
			var myLaborSet = eventContext.application.getResource("mylabor");
			var myLaborCraftSet = eventContext.application.getResource("mylaborcraftrate");
			
			var myLaborCrew = CrewUtil.getUserCrew(eventContext);
			if(workOrderList.length > 0 && myLaborSet.count() > 0) {
				var startedWorkOrder = workOrderList[0];
																	
				if(myLaborCraftSet.count() > 0) {
					WorkOrderTimer.appValidate(woTimer);
					var taskSet = eventContext.application.getResource("workOrder.tasklist");
					
					if(myLaborCrew && myLaborCrew.get('crewid')){
						Logger.trace("[StopTimerHandler] User select to stop WO and is member of crew");
						
						if(woTimer.get('useCrewToCreateActual')){	//checkbox is marked
							Logger.trace("[StopTimerHandler] User select to stop WO and dont want to review");
							
							Logger.trace("[StopTimerHandler] Building crew lists for review");
							this._buildCrewLists(eventContext, starttime, endtime, timerStatus, duration, transType)
							.then(function() {
								Logger.trace("[StopTimerHandler] Crew lists built for review");
								
								woTimer.set('paused',false);
								
								Logger.trace("[StopTimerHandler] complete shoiwing review");
								self.ui.show('WorkExecution.CrewReviewListView');
							});
						}
						else{
							Logger.trace("[StopTimerHandler] User select to stop WO and want to review");
							
							Logger.trace("[StopTimerHandler] Building crew lists for review");
							this._buildCrewLists(eventContext, starttime, endtime, timerStatus, duration, transType)
							.then(function() {
								Logger.trace("[StopTimerHandler] Crew lists built for review");
								
								//creating the actual
								var laborSet =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource");
								var toolSet =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource");
								var curr =  CrewUtil.getUserCrew(eventContext);
								
								var actuallaborlist =  null;
								var actualtoollist =  null;
								
								var woSet = CommonHandler._getAdditionalResource(eventContext,'workOrder');
								
								if(woSet.getCurrentRecord().get('wonum') == eventContext.getCurrentRecord().get('wonum') ){
									Logger.trace("[StopTimerHandler] User select to stop WO previous started WO when starting a new one");
									
									actuallaborlist =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist");
									actualtoollist =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actualtoollist");
									
									Logger.trace("[StopTimerHandler] Creating labor report for crew on stop with no review");
									CrewLaborObject.createAtualLbaorForCrew(laborSet, actuallaborlist, curr);	
									Logger.trace("[StopTimerHandler]  labor report created for crew on stop with no review");
									
									Logger.trace("[StopTimerHandler] Creating tool report for crew on stop with no review");
									CrewToolObject.createAtualToolForCrew(toolSet, actualtoollist);
									Logger.trace("[StopTimerHandler] Tool report created  for crew on stop with no review");
									
									try {
										Logger.trace("[StopTimerHandler]Stopping WO user is member of crew and dont want to review ");
										WorkOrderTimer.stopTimerForWorkOrder(woTimer, startedWorkOrder, null, myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, null);
										ModelService.saveAll([workOrderSet, woTimer.getOwner()]).then(function(){
												self.ui.hideCurrentView(PlatformConstants.CLEANUP);
										}).otherwise(function(error){
											Logger.trace("[StopTimerHandler]  ERROR saving WO and timer for complete" + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
											self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
										});
										
										if (workOrder) {
											var WOGeolocation = new WOGeolocationHandler();
											if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
												WOGeolocation.clearLBSLocationWorkNumber();
												Logger.log("LBS Location tracking request cleared for work order :: " + workOrder.get("wonum"));
											}
										}
										
									}catch(error){
										Logger.trace("[StopTimerHandler] error  when stopping previous started different  of the one user selct the timer= " + error.getMessage());
										switch (true) {
										
										case (error instanceof PlatformRuntimeException):						
											self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
											break;				
										}
									}
								} else {
										Logger.trace("[StopTimerHandler] The WO to be stoped is the same that user select ");
										var nextWO = workOrderSet.getCurrentRecord();
										var wo = workOrderSet.find('wonum == $1', eventContext.getCurrentRecord().get('wonum'))[0];
										var actuallaborlistPromise = wo.getModelDataSet('actuallaborlist');
										var actualtoollistPromise = wo.getModelDataSet('actualtoollist');
										all([actuallaborlistPromise, actualtoollistPromise]).
										then(function(results){
											var actuallaborlist = results[0];
											var actualtoollist = results[1];
											
											Logger.trace("[StopTimerHandler] Creating labor report for crew on stop with no review");
											CrewLaborObject.createAtualLbaorForCrew(laborSet, actuallaborlist, curr);
											Logger.trace("[StopTimerHandler]  labor report created for crew on stop with no review");
											
											Logger.trace("[StopTimerHandler] Creating tool report for crew on stop with no review");
											CrewToolObject.createAtualToolForCrew(toolSet, actualtoollist);
											Logger.trace("[StopTimerHandler] Tool report created  for crew on stop with no review");
											try {
												Logger.trace("[StopTimerHandler] Stopping the same WO that user select the timer");
												WorkOrderTimer.stopTimerForWorkOrder(woTimer, wo, null, myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, null, nextWO);
												ModelService.saveAll([workOrderSet, woTimer.getOwner()]).then(function(){
														self.ui.hideCurrentView(PlatformConstants.CLEANUP);
												}).otherwise(function(error){
													Logger.trace("[StopTimerHandler]  ERROR saving WO and timer for complete" + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
													self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
												});
												
												if (wo) {
													var WOGeolocation = new WOGeolocationHandler();
													if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
														WOGeolocation.clearLBSLocationWorkNumber();
														Logger.log("LBS Location tracking request cleared for work order :: " + wo.get("wonum"));
													}
												}
												
											}catch(error){
												Logger.trace("[StopTimerHandler]  ERROR Stopping the same WO that user select the timer" + error.getMessage());
												switch (true) {
											
												case (error instanceof PlatformRuntimeException):						
													self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
													break;				
												}
											}
										});
								}
							});
						}
					} 
					else {
						try{
							Logger.trace("[StopTimerHandler] User select to stop WO andnot  is member of crew");
							var nextWO = workOrderSet.getCurrentRecord();
							WorkOrderTimer.stopTimerForWorkOrder(woTimer, startedWorkOrder, myLaborSet.getRecordAt(0), myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, taskSet, nextWO);
							
							if (startedWorkOrder) {
								var WOGeolocation = new WOGeolocationHandler();
								if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
									WOGeolocation.clearLBSLocationWorkNumber();
									Logger.log("LBS Location tracking request cleared for work order :: " + startedWorkOrder.get("wonum"));
								}
							}
						}catch(error){
							Logger.trace("[StopTimerHandler]  ERROR Stopping WO for not member of crew " + error.getMessage());
							switch (true) {
							case (error instanceof PlatformRuntimeException):						
								self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
								break;				
							}
							
						}
						
						Logger.trace("[StopTimerHandler] Saving WO and timer");
						ModelService.saveAll([workOrderSet, woTimer.getOwner()]).then(function(){
								self.ui.hideCurrentView(PlatformConstants.CLEANUP);
							
						}).otherwise(function(error){
							Logger.trace("[StopTimerHandler] Error saving WO and timer for not a member of crew " + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
							self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
						});
					}
					
				} else {
					this.application.showMessage(MessageService.createStaticMessage("errornocraftfound").getMessage());
				}
			}else{
				this.application.showMessage(MessageService.createStaticMessage("errornolaborfound").getMessage());	
			}
		},
		
		//build crew list when reporting by tool
		_buildCrewLists: function(eventContext, starttime, endtime, timerStatus, duration, transType){
			var self = this;
			var errored = false;
			var deferred = new Deferred();
			var curCrew =  CrewUtil.getUserCrew(eventContext);
			
			//Initialize crew variables
			curCrew.setNullValue('actualstaskid');
			curCrew.set('startdate','');
			curCrew.set('starttime','');
			curCrew.set('finishdate','');
			curCrew.set('finishtime','');
			curCrew.set('regularhours','');
			curCrew.set('transtype','');
			curCrew.set('contractnum','');

			curCrew.setDateValue('startdate',DateTimeUtil.fromDateTimeToDate(starttime));
			curCrew.setTimestampValue('starttime', DateTimeUtil.fromDateTimeToTime(starttime));
			curCrew.setDateValue('finishdate',DateTimeUtil.fromDateTimeToDate(endtime));
			curCrew.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(endtime));
			curCrew.set('regularhours', duration );			
			curCrew.set('timerStatus',timerStatus);
			curCrew.set('transtype', transType);
			
			//Local resources
			var laborSet =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource");
			var toolSet =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource");
			//var amcrewval = curCrew.get('crewid');
			
			//Clearing the existing resources sets to empty
			laborSet.filter('1=0');
			toolSet.filter('1=0');
			
			var currentTime = eventContext.application.getCurrentDateTime();
			
			var actuallaborlistPromise = curCrew.getModelDataSet('crewlabor');
			var actualtoollistPromise = curCrew.getModelDataSet('crewtool');
			all([actuallaborlistPromise, actualtoollistPromise]).
			then(function(results){
				var assetsToFilter = [];
				var crewtoolSet = results[1];
				for(var i=0;i<crewtoolSet.count();i++){					
					var currTool = crewtoolSet.getRecordAt(i);
					assetsToFilter.push({assetnum: currTool.get('assetnum'),siteid: currTool.get('siteid')});
					
				}
				
				ModelService.filtered('additionalasset',null,assetsToFilter,1000,false,false).then(function(additionalAssetSet){
				try{
					var laborListPromise = CrewLaborObject.buildLaborList(laborSet, curCrew, results[0], currentTime, ModelService);
					var toolListPromise = CrewToolObject.buildToolList(toolSet, curCrew, crewtoolSet, currentTime, ModelService, additionalAssetSet);
					
					
				}catch(error){
					//Logger.trace("[StopTimerHandler] Error when pausing previous " + MessageService.createStaticMessage(error.getMessage()).getMessage());
					switch (true) {
						case (error instanceof PlatformRuntimeException):
							errored = true;
							self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
						break;				
					}									
				}
				all([laborListPromise, toolListPromise])
				.then(function() {
					if(!errored)
						deferred.resolve();
				});
				});
			});

			return deferred.promise;	
		},
		
		returnToWoList: function(eventContext){
			var woTimer = eventContext.getCurrentRecord();
			//if user has a started WO than try to start the secod and choose tostop the first WO
			//and at the stop timer view user diced to do not stop the first WO we need to clean next to start.
			if(woTimer.get("nextWorkOrderId")){
				woTimer.setNullValue("nextWorkOrderId");
			}
			
			//check to see if we need to call reset - if a new workorder timer has not been started
			if (woTimer.get("resetOnCleanup")) {
				WorkOrderTimer.resetTimer(woTimer);
				woTimer.set("resetOnCleanup",false);
			} 
			else {
				//if resetOnCleanup is still false then the user timer was stopped on one WO so it could be 
				//started on another.  For defect 99949 we need to change the wonum and starttime values on  
				//cleanup so end user does not see the values update.
				var defWonum = woTimer.get("deferredWonum");
				var defStartTime = woTimer.getAsDateOrNull("deferredStartTime");
				if (defWonum && defStartTime) {
				    //Copy from deferredWonum and deferredStartTime to the wonum and startTime fields
				    woTimer.set("wonum",defWonum);
				    woTimer.setDateValue("startTime",defStartTime);
				    woTimer.setNullValue("deferredWonum");
				    woTimer.setNullValue("deferredStartTime");
				}
				else {
					// handle back
					woTimer.setDateValue('startTime', this._originalStartTime);
				}
			}				
		},
		
		validateDatesTolerance: function(starttime, endtime, oslcmaxvars) {
			var orgid = this.application.getResource("workOrder").getCurrentRecord().get('orgid');
			var currentdatetime = this.application.getCurrentDateTime();
			
			if (!MaxVars.isActualLaborDateValid(oslcmaxvars, starttime, currentdatetime, orgid) ||
				!MaxVars.isActualLaborDateValid(oslcmaxvars, endtime, currentdatetime, orgid)	) {
				return false;
			}else{
				return true;
			}
		},
		
		validatePage: function(eventContext){
			var woTimer = eventContext.application.getResource('workOrderTimer').getCurrentRecord();
				
			//Validate Start time
			var startTime = woTimer.get('startTime');
			if(!startTime) {
				throw new PlatformRuntimeException('starttimeisrequired');
			}			
			
			//Validate End time
			var endTime = woTimer.get('endTime');
			if(!endTime) {
				throw new PlatformRuntimeException('endtimeisrequired');
			}
			
			//Check if end time is greater than start time
			startTimeml = DateTimeUtil.zeroSecondsAndMilliseconds(startTime);
			endTimeml = DateTimeUtil.zeroSecondsAndMilliseconds(endTime);
			if(endTimeml < startTimeml){																	
				throw new PlatformRuntimeException('endtimebeforestarttime');
			}

		}
		
	});
});
                                                           
