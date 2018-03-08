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

define("application/handlers/StatusChangeHandler", 
	   [ "dojo/_base/declare",
	     "platform/model/ModelService",
	     "dojo/_base/array",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/business/WorkOrderObject",
	     "application/business/WorkOrderTimer",
	     "application/business/WorkOrderStatusHandler",
	     "application/business/SqaStatusHandler",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/handlers/CommonHandler",
	     "platform/util/PlatformConstants",
	     "platform/format/FormatterService",
	     "platform/translation/SynonymDomain",
	     "platform/logging/Logger",
	     "application/business/MaxVars",
	     "platform/translation/MessageService",
	     "application/business/DataSheetObject",
	     "dojo/_base/lang"
	     ],
function(declare, ModelService, array, ApplicationHandlerBase, WorkOrderObject, WorkOrderTimer, WorkOrderStatusHandler, SqaStatusHandler, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, FormatterService,SynonymDomain, Logger, MaxVars, MessageService, DataSheetObject,lang) {
	return declare( ApplicationHandlerBase, {
		
/**@memberOf application.handlers.StatusChangeHandler */
		initEditStatusView : function(eventContext) {
			var workOrder = eventContext.getCurrentRecord();
			var statusChange = CommonHandler._getAdditionalResource(eventContext,"statusChangeResource").getCurrentRecord();
			statusChange.setDateValue("changedate", this.application.getCurrentDateTime());
			statusChange.setNullValue("status");
			statusChange.setNullValue("statusdesc")
			statusChange.setNullValue("memo");
			eventContext.ui.application.toolWarningShown = false;
				
		},
		
		cleanupEditStatusView : function(eventContext) {
			this._clearWoStatusFilter();
		},
		
		enableCommitButton : function(eventContext) {
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if(!workOrder || workOrder.isErrored()) {
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		
		changeStatusSkipDyanmicCheck : function(eventContext) {
			eventContext.ui.hideCurrentDialog();
			var handler = eventContext.application['application.handlers.StopTimerHandler'];
			
			if(eventContext.ui.getCurrentViewControl().id.indexOf('.StopWorkView')>-1){
				//stop time complete process
				handler.completeWorkHandler(eventContext,true);
			} else {
				//change status dialog
				this.commitWOStatusChange(eventContext,true);	
			}
		},
		
		/**
		 * Commit changes to WO Status (handle OK button clicked)
		 * @function
		 * @param {string} eventContext - javascript variables context.
		 */
		commitWOStatusChange: function(eventContext,skipDynamicCheck){
			
			var workOrder=eventContext.application.getResource('workOrder').getCurrentRecord();
			
			if( WorkOrderObject.isCalibration(workOrder, eventContext) ) {
				var doNotChangeStatus = false;
				if(!skipDynamicCheck){
					doNotChangeStatus = this.calibrationDynamicCheckForStatusChange(eventContext);	
				}
				if(doNotChangeStatus == true){
					return;
				}
			}
			
			eventContext.application.showBusy();
			
			var statusChange = CommonHandler._getAdditionalResource(eventContext,"statusChangeResource").getCurrentRecord();
			var newStatus=statusChange.get("status");
			
			//Validate if status date change is lesser than last WO status change date
			if(workOrder.getAsDateOrNull('changestatusdate') > statusChange.getAsDateOrNull('changedate')){
				throw new PlatformRuntimeException('statusDateinFuture',[this.resolveStatusDate(workOrder.getAsDateOrNull('changestatusdate'))]);								
			}			
			
			if(!eventContext.application.ui.getCurrentViewControl().validate()){return;}

			var newInternalStatus = WorkOrderStatusHandler.getInstance().toInternalState(newStatus);

			//calibration validate
			if( WorkOrderObject.isCalibration(workOrder, eventContext) ) {
				//if new status is closed or comp, check if it has at least one actual tool
				if(newInternalStatus == "COMP"){
					if(workOrder.get("started")){
						this.ui.show("WorkExecution.CompWithTimerStartedDialog");
						return;
					}
					else if(CommonHandler._getAdditionalResource(eventContext,"workOrder.tasklist").data.length>0 && this._getTaskWithRunningTimer()){
						this.ui.show("WorkExecution.CompWOWithTaskTimerStartedDialog");
						return;
					}
					else {
						var dsnum = this._getIncompleteRequiredDatasheet(eventContext);
						if (dsnum != null){
							throw new PlatformRuntimeException('IncompleteDatasheetStatusChange',[dsnum]);
						}
					}
				}
				else if(newInternalStatus == "CAN"){
					if(workOrder.get("started")){
						this.ui.show("WorkExecution.CanWithTimerStartedDialog");
						return;
					}
					else if(CommonHandler._getAdditionalResource(this,"workOrder.tasklist").data.length>0 && this._getTaskWithRunningTimer()){
						this.ui.show("WorkExecution.CanWOWithTaskTimerStartedDialog");
						return;
					}
				}
				else if(newInternalStatus == "CLOSE"){
					var dsnum = this._getIncompleteRequiredDatasheet(eventContext);
					if (dsnum != null){
						throw new PlatformRuntimeException('IncompleteDatasheetStatusChange',[dsnum]);
					}
				}
				if(newInternalStatus == "COMP" || newInternalStatus == "CLOSED"){
					if(workOrder.get('actualtoollistsize')==null || workOrder.get('actualtoollistsize')==0){
						var orgid = workOrder.get('orgid');			
						var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");	
						if(MaxVars.isStatusValidForTool(oslcmaxvars, orgid)==1){
							if(!eventContext.ui.application.toolWarningShown){
								eventContext.ui.application.toolWarningShown = true;
								eventContext.application.showMessage(MessageService.createStaticMessage('invalidtoolstatuswarn').getMessage());
								return;
								//throw new PlatformRuntimeWarning("invalidtoolstatuswarn");
							}
						}else if(MaxVars.isStatusValidForTool(oslcmaxvars, orgid)==2){
							throw new PlatformRuntimeException("invalidtoolstatuserror");
						}
					}
				}
			}

			//When the status change causes a save for a new workorder (no wonum yet)
			//hide the create and cancel buttons on the new work order page because
			//the save is done here.
			if(workOrder.wonum == null){
				var viewID = eventContext.application.ui.viewHistory[eventContext.application.ui.viewHistory.length-2].id;
				var activeView = eventContext.application.ui.getViewFromId(viewID);
				activeView.setFooterDisplay(false);
			}
			this._saveStatusChange(workOrder);
			this._clearWoStatusFilter();
		},
		
		_getIncompleteRequiredDatasheet: function(eventContext){
			// return null if there is no datasheet (this isn't a calibration workorder)
			var dsnum = null;
			var dsSet = eventContext.application.getResource('dataSheetResource');
			if (dsSet){
				var domainCalStatus = eventContext.application.getResource('domaincalstatus');
				dsnum = DataSheetObject.getIncompleteRequiredDatasheet(dsSet, domainCalStatus);
			}
			return dsnum;
		},
		
		/**
		 * Custom Codes
		 * Commit changes to SQA Status (handle OK button clicked)
		 * @function
		 * @param {string} eventContext - javascript variables context.
		 */		
		
		commitSQAStatusChange: function(eventContext){
			console.log("SAVE SQA STATUS HERE");
			
			var sqa = eventContext.application.getResource('sqa');
			
			var statusChangeResource = eventContext.application.getResource('statusChangeResource').getCurrentRecord();
			
			var sqaStatusSet= CommonHandler._getAdditionalResource(eventContext,"sqa.plusgauditchstatusList");
			newSqaStatus = sqaStatusSet.createNewRecord();
			
			newSqaStatus.set("changedate",statusChangeResource.get("changedate"));
			newSqaStatus.set("status",statusChangeResource.get("status"));
			newSqaStatus.set("memo",statusChangeResource.get("memo"));			
		
			var currSQA = sqa.getCurrentRecord();
			console.log(currSQA);
			console.log(statusChangeResource);
			
			var currentStatus = currSQA.get('status');
			var newStatus=statusChangeResource.get("status");
			var newInternalStatus = SqaStatusHandler.getInstance().toInternalState(newStatus);
			currSQA.openPriorityChangeTransaction();		
			
			currSQA.set("status", statusChangeResource.get("status"));
			currSQA.set("statusdesc", statusChangeResource.get("status"));
			currSQA.set("memo",statusChangeResource.get("memo"));
			currSQA.setDateValue("statusdate",statusChangeResource.getAsDateOrNull("changedate"));	
			currSQA.setDateValue("changestatusdate",statusChangeResource.getAsDateOrNull("changedate"));
			
			ModelService.save(sqa).then(function(){
				console.log('save SQA completed');
				console.log(sqa);
				
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});
			
			this.ui.hideCurrentView();			
		},
		
		commitTaskStatusChange: function(eventContext){
			var currentTask = CommonHandler._getAdditionalResource(eventContext,"workOrder.tasklist").getCurrentRecord();
			var statusChange = CommonHandler._getAdditionalResource(eventContext,"statusChangeResource").getCurrentRecord();
			var newStatus=statusChange.get("status");		
			
			//Validate if status date change is lesser than last WO status change date
			if(currentTask.getAsDateOrNull('changestatusdate') > statusChange.getAsDateOrNull('changedate')){
				throw new PlatformRuntimeException('statusDateinFuture',[this.resolveStatusDate(currentTask.getAsDateOrNull('changestatusdate'))]);								
			}	
			
			if(!eventContext.viewControl.validate()){return;}

			var newInternalStatus = WorkOrderStatusHandler.getInstance().toInternalState(newStatus);
			
			if(this._hasRunningTimer(currentTask)){
				if(newInternalStatus == "COMP"){
					this.ui.show("WorkExecution.CompTaskWithTimerStartedDialog");
					return;
				}
				else if(newInternalStatus == "CAN"){
					this.ui.show("WorkExecution.CanTaskWithTimerStartedDialog");
					return;
				}
			}
			
			this._saveStatusChange(currentTask);
			this._clearWoStatusFilter();
		},
			
		
		// Handle Cancel button click on Change Status view
		discardStatusChange: function(eventContext){	
			this._clearWoStatusFilter();
			this.ui.hideCurrentView(PlatformConstants.CLEANUP);		
		},
		
		resolveWonum : function(control) {
			return [ CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('wonum') ];
		},
		
		resolveTaskAndWonum : function(control) {
			return [CommonHandler._getAdditionalResource(this,"workOrder.tasklist").getCurrentRecord().get("taskid"), 
			        CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('wonum') ];
		},
		
		resolveActivityAndWonum : function(control){
			var startedWO = this._getStartedWO();
			
			return [startedWO.get('wonum'), 
			        CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('wonum')];
			
		},

		// Handle Yes click to DynamicCalChangeStatus dialog
		DynamicCalChangeStatusYesClickHandler: function(caller){
			this.ui.hideCurrentDialog();
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			this._saveStatusChangeEsig(workOrder);
		},

		// Handle Yes click to complete WO with a started timer
		compTimerStartedYesClickHandler: function(caller){
			this.ui.hideCurrentDialog();
			
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			this._saveStatusChangeEsig(workOrder);
		},

		// Handle Yes click to complete Task with a started timer
		compTaskTimerStartedYesClickHandler: function(caller){
			this.ui.hideCurrentDialog();
			
			var currentTask = CommonHandler._getAdditionalResource(this,"workOrder.tasklist").getCurrentRecord();
			this._saveStatusChangeEsig(currentTask);
		},
		
		// Handle a No action response from a Yes/No dialog
		noActionDialogHandler: function(caller){
			this.ui.hideCurrentDialog();
		},
		
		// Handle Yes click to cancel WO with a started timer
		canTimerStartedYesClickHandler: function(caller){
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			
			this._handleCancelWOWithTimer(workOrder);
		},
		
		// Handle Yes click to cancel Task with a started timer
		canTaskTimerStartedYesClickHandler: function(caller){	
			var currentTask = CommonHandler._getAdditionalResource(this,"workOrder.tasklist").getCurrentRecord();

			this._handleCancelWOWithTimer(currentTask);
		},		
		
		// cancel timer on a WO
		_handleCancelWOWithTimer: function(workOrder){
			this.ui.hideCurrentDialog();
			
			var startedWO = this._getStartedWO();
			WorkOrderObject.cancelWorkWithTimer(startedWO);
			
			var woTimer = CommonHandler._getAdditionalResource(this,"workOrderTimer").getCurrentRecord();
			WorkOrderTimer.resetTimer(woTimer);
			
			this._saveStatusChangeEsig(workOrder);
		},
		
				
		_saveStatusChangeEsig: function(woOrTask){
			// check for esig
			var EsigHandler = this.application["platform.handlers.EsigHandler"];
			if (EsigHandler.isEsigRequired(this, woOrTask, 'status')){
				// do the esig
				EsigHandler.showEsig(this, this._saveStatusChange, [woOrTask]);
			}
			else{
				// call _saveStatusChangeFinal
				this._saveStatusChange(woOrTask);
				
			}
		},

		_saveStatusChange: function(workOrderOrTask){
			var statusChange = CommonHandler._getAdditionalResource(this,"statusChangeResource").getCurrentRecord();
			var previousValueSet = {
					status: workOrderOrTask.get('status'),
					statusDate: workOrderOrTask.getAsDateOrNull('statusDate'),
					memo: workOrderOrTask.get('memo')
			};
			var newStatus=statusChange.get("status");
			var memo = statusChange.get("memo");
			var statusDate = statusChange.getAsDateOrNull("changedate");
			
			var taskId = workOrderOrTask.get("taskid");
			var taskSet = null;
			if (taskId){ //If the parameter is a Task
				WorkOrderObject.taskChangeStatus(workOrderOrTask, newStatus, statusDate, memo);
			} else {
				taskSet = CommonHandler._getAdditionalResource(this,"workOrder.tasklist");
				WorkOrderObject.changeStatus(workOrderOrTask, newStatus, statusDate, memo, taskSet);
			}

			var recordSet = workOrderOrTask.getParent()? workOrderOrTask.getParent().getOwner() :  workOrderOrTask.getOwner();
			
			var EsigHandler = this.application["platform.handlers.EsigHandler"];
			var woORtask = workOrderOrTask.getOwner();
			if (EsigHandler.isEsigRequired(this, woORtask, 'status')){
				workOrderOrTask.markAsModified('status');
				EsigHandler.plugCancelCallback(this, this._statusChangeRollback, [workOrderOrTask, taskSet, previousValueSet]);
			}
			var self = this;
			ModelService.save(recordSet).then(function(){
				self.ui.hideCurrentView(PlatformConstants.CLEANUP);
			});			
		},
		
		_statusChangeRollback: function(workOrderOrTask, taskSet, previousValueSet) {
			Logger.trace("[StatusChangeHandler] _statusChangeRollback ");
			workOrderOrTask.set('status', previousValueSet.status);
			delete workOrderOrTask.__changedAttributes['status'];
			workOrderOrTask.setDateValue('statusDate', previousValueSet.statusDate);
			delete workOrderOrTask.__changedAttributes['statusDate'];
			workOrderOrTask.setDateValue('changestatusdate', previousValueSet.statusDate);
			delete workOrderOrTask.__changedAttributes['changestatusdate'];
			workOrderOrTask.set('memo', previousValueSet.memo);
			delete workOrderOrTask.__changedAttributes['memo'];
			if(taskSet && taskSet.data.length > 0) {
				if(taskSet && taskSet.isFiltered()) {
					taskSet.clearFilterAndSort();
				}
				var inheritingTasks = taskSet.find("inheritstatuschanges==$1", true);
				var self = this;
				array.forEach(inheritingTasks, function(task){
					self._statusChangeRollback(task, null);
				});
			}
			workOrderOrTask.cancelCurrentTransaction();
			Logger.trace("[StatusChangeHandler] _statusChangeRollback status changed");
		},

		// if the current WO has a task with timer running and inherit status checked, returns that task. Returns null if no such task exists
		_getTaskWithRunningTimer: function(){
			var startedWO = this._getStartedWO();
			
			if(!startedWO){
				return null;
			}
			
			var taskSet = CommonHandler._getAdditionalResource(this,"workOrder.tasklist");	
			CommonHandler._clearFilterForResource(this, taskSet);
			var inheritingTasks = taskSet.find("inheritstatuschanges==$1", true);
			
			var startedTask=null;	
			
			var self=this;
			array.forEach(inheritingTasks, function(record){
				if(self._hasRunningTimer(record)){
					startedTask = record;
					return;
				}
			});
			
			
			return startedTask;
		},
		
		
		// checks if a task record has a running timer on it
		_hasRunningTimer: function(task){
			var startedWO = this._getStartedWO();
			
			if(startedWO && startedWO.get("wonum")==task.get("wonum") && startedWO.get("siteid")==task.get("siteid")){
				return true;
			}
			else{
				return false;
			}
			
		},
		
		// returns the WO with running timer, or null if timer is not started
		_getStartedWO: function(){
			var woTimer = CommonHandler._getAdditionalResource(this,"workOrderTimer").getCurrentRecord();
			var startedWOID = woTimer.get("workOrderId");
			
			if(!startedWOID){
				return null;
			}
			
			var woSet = CommonHandler._getAdditionalResource(this,"workOrder");
			return woSet.find("remoteid==$1", startedWOID)[0];
		},
		
		// Filter WO statuses to those available for selection
		filterWOStatus: function(eventContext){
			if(eventContext.application.ui.showAllStatus != null && 
					eventContext.application.ui.showAllStatus == true){
				var domainwostatus = CommonHandler._getAdditionalResource(eventContext,"domainwostatus");
				CommonHandler._clearFilterForResource(eventContext,domainwostatus);
				// filter unique values
				var filter=[];
				var statusvalues = [];
				for (var i=0; i < domainwostatus.count() ; i++) {
					var wostatus = domainwostatus.data[i];
					var statusvalue = wostatus.value;
					if (statusvalues.indexOf(statusvalue) == -1) {
						statusvalues.push(statusvalue);
						filter.push({remoteid : wostatus.getRemoteId()});
					}
				}
				domainwostatus.lookupFilter=filter;
				return;
			}
			var currentWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var actualLaborSet = CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist");
			
			
			var woStatusDomain = this._filterStatus(currentWO);
			
			if(actualLaborSet.data.length>0){
				woStatusDomain.filter("maxvalue!=$1", "CAN");
			}
		},
		
		filterTaskStatus: function(eventContext){
			var currentTask = CommonHandler._getAdditionalResource(eventContext,"workOrder.tasklist").getCurrentRecord();
			var actualLaborSet = CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist");
			
			var woStatusDomain = this._filterStatus(currentTask);
			
			if(actualLaborSet.find("actualtaskid==$1", currentTask.get("taskid"))>0){
				woStatusDomain.filter("maxvalue!=$1", "CAN");
			}
		},
		
		_filterStatus: function(record){
			var woStatusHandler = WorkOrderStatusHandler.getInstance();
			var currentStatus = record.get("status");
			var workorderOrg = record.get("orgid");
			var workorderSite = record.get("siteid");
			
			var foundOrgStatuses=false;
			var foundSiteStatuses=false;
			
			//Get the org specific statuses
			var woStatusDomain = this._clearWoStatusFilter();	
			woStatusDomain.filter("orgid==$1", workorderOrg);
			if (woStatusDomain.count() > 0) {
				Logger.log("found org specific statuses");
				foundOrgStatuses=true;
			} 
			
			//Get the site specific statuses
			var woStatusDomain = this._clearWoStatusFilter();	
			woStatusDomain.filter("siteid==$1", workorderSite);
			if (woStatusDomain.count() > 0) {
				Logger.log("found site specific statuses");
				foundSiteStatuses=true;
			} 
			
			//Get the valid states
			var woStatusDomain = this._clearWoStatusFilter();	
			var filter = woStatusHandler.statesFromAsDataSetFilter(currentStatus, 'value');
			woStatusDomain.filter(filter.query, filter.params);
			
			if (WorkOrderObject.isStarted(record))
		    {
				woStatusDomain.filter("maxvalue!=$1 && maxvalue!=$2 && maxvalue!=$3", "WAPPR", "CAN", "CLOSE");
		    }
			
			if (foundOrgStatuses && !foundSiteStatuses) {
				woStatusDomain.filter("orgid==$1", workorderOrg);
			} 
			else if (foundOrgStatuses && foundSiteStatuses) {
				woStatusDomain.filter("orgid==$1 && siteid==$2", workorderOrg, workorderSite);
			}else {
				woStatusDomain.filter("orgid==null");
			}
			return woStatusDomain;
		},
		
		enableCompleteTaskButton : function(eventContext) {
			var currentTask = eventContext.getCurrentRecord();
			var domainwostatus = CommonHandler._getAdditionalResource(eventContext,"domainwostatus");
			var externalComplete = SynonymDomain.resolveToDefaultExternal(domainwostatus, 'COMP');
			
			
			if(!WorkOrderStatusHandler.getInstance().canPerformTransition(currentTask.get("status"), externalComplete)) {
				eventContext.setDisplay(false);
				return;
			} else {
				var externalStatuses = SynonymDomain.resolveToExternal(domainwostatus, 'COMP');				
				for (var status in externalStatuses) {
					if (status == currentTask.get("status")) {
						eventContext.setDisplay(false);
						return;
					}
				}
			}
			eventContext.setDisplay(true);
		},
		
		handleCompleteWorkClick : function(eventContext){
			var currentTask = eventContext.getCurrentRecord();
			var domainwostatus = CommonHandler._getAdditionalResource(eventContext,"domainwostatus");
			var externalComplete = SynonymDomain.resolveToDefaultExternal(domainwostatus, 'COMP');
			
			WorkOrderObject.changeStatus(currentTask, externalComplete, this.application.getCurrentDateTime(), null, null);
			
			var recordSet = currentTask.getParent().getOwner();
			
			ModelService.save(recordSet);

			eventContext.setDisplay(false);
		},
		
		_clearWoStatusFilter : function() {
			var woStatusDomain = this.application.getResource('domainwostatus');
			if(woStatusDomain.isFiltered()){
				woStatusDomain.clearFilterAndSort();
			}
			return woStatusDomain;
		},
		
		resolveStatusDate : function(statusdate) {
			var userLocale = this.application.getUserLocale();
			return [ FormatterService.toDisplayableValue(statusdate, "datetime", userLocale) ];
		},
		
		calibrationDynamicCheckForStatusChange : function(eventContext,internalStatus){
			var statusChange = CommonHandler._getAdditionalResource(eventContext,"statusChangeResource").getCurrentRecord();
			
			var newStatus=internalStatus?internalStatus:statusChange.get("status");
			var newInternalStatus = WorkOrderStatusHandler.getInstance().toInternalState(newStatus);
			
			if(newInternalStatus != 'COMP' && newInternalStatus != 'CLOSE'){
				return false;
			}
	
			var wods = eventContext.application.getResource('dataSheetResource');
			var allDynamicChecksEntered = true;
			
			if(!wods || wods==null){
				//if no datasheets exist on the workorder, let it continue and change status
				return false;
			}
			
			//filter datasheetresource to only fetch datasheets on workorder
			var workOrder=eventContext.application.getResource('workOrder').getCurrentRecord();
			wods.clearFilterAndSort();
			wods.filter('wonum == $1 && siteid== $2',workOrder.wonum,workOrder.siteid);
					
					
			wods.data.forEach(function(dataSheet){
				if(allDynamicChecksEntered && allDynamicChecksEntered == true){
					var af = dataSheet.assetfunctionlist;
					var cp = dataSheet.calibrationpointlist;
					
					var afData = lang.isArray(af)? af : af.data;
					
					afData.forEach(function(assetFunction){
						var caldynamic = assetFunction.caldynamic;
						if(caldynamic && caldynamic==true){
							var dsplannum = assetFunction.dsplannum;
							var revisionnum = assetFunction.revisionnum;
							var instrseq = assetFunction.instrseq;
							var wodsnum = assetFunction.wodsnum;
							var wonum = assetFunction.wonum;
							var siteid = assetFunction.siteid;
							
							//stop timer complete
							if(lang.isArray(cp)){
			                    cp.forEach(function(calibrationPoint){
			                    	if(calibrationPoint.dsplannum==dsplannum && calibrationPoint.revisionnum==revisionnum && 
			                    			calibrationPoint.instrseq==instrseq && calibrationPoint.wodsnum==wodsnum && calibrationPoint.wonum==wonum &&
			                    			calibrationPoint.siteid==siteid && calibrationPoint.isaverage==false)
			                    	if(calibrationPoint.asfoundinput==null || calibrationPoint.asleftinput==null) {
				                    	allDynamicChecksEntered = false;
				                    	return;
				                    }
			                    });
							} else {
								//change status dialog complete
								cp.clearFilterAndSort();
			                    cp.filter('dsplannum == $1 && revisionnum == $2 && instrseq == $3 && wodsnum == $4 && wonum== $5 && siteid== $6 && isaverage == false',dsplannum,revisionnum,instrseq,wodsnum,wonum,siteid);

			                    cp.data.forEach(function(calibrationPoint){
			                    	if(calibrationPoint.isNull('asfoundinput') || calibrationPoint.isNull('asleftinput')) {
				                    	allDynamicChecksEntered = false;
				                    	return;
				                    }
			                    });
							}
						}
					});
				}
			});
			
			var internalCurrentStatus = newInternalStatus; // it is pass maxstatus
			var isBrkOrMiss = false;
			if (internalCurrentStatus!= null && (internalCurrentStatus == 'BROKEN' || internalCurrentStatus == 'MISSING')){
				isBrkOrMiss=true;
			}
			
			var dynamicCheckComp = false;
			if (!allDynamicChecksEntered && !isBrkOrMiss && !dynamicCheckComp){
				this.ui.show('WorkExecution.DynamicCheckStatusChangeConfirm');
				return true;
			} else {
				return false;
			}
			
		},
		
		cancelClearChanges: function(eventContext) {
			this.savedEventContext = null;
			this.application.ui.hideCurrentDialog();
		},
	});
});
