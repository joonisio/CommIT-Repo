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

define("application/handlers/WOListHandler", 
		[ "dojo/_base/declare",
		  "dojo/promise/all",
		  "platform/model/ModelService", 
		  "platform/model/ModelData",
		  "platform/model/ModelDataSet",
		  "platform/handlers/_ApplicationHandlerBase",
		  "platform/comm/CommunicationManager",
		  "application/business/WorkOrderTimer",
		  "application/business/WorkOrderObject",
		  "platform/auth/UserManager",
		  "platform/translation/MessageService",
		  "dojo/_base/lang",
		  "platform/exception/PlatformRuntimeException",
		  "platform/warning/PlatformRuntimeWarning",
		  "platform/util/PlatformConstants",
		  "platform/logging/Logger",
		  "application/business/MaxVars",
		  "application/handlers/CommonHandler",
		  "application/handlers/WOGeolocationHandler"], 
  function(declare, all, ModelService, ModelData, ModelDataSet, ApplicationHandlerBase, CommunicationManager, WorkOrderTimer, WorkOrderObject, UserManager, MessageService, lang, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, Logger, MaxVars, CommonHandler,WOGeolocationHandler) {
	return declare(ApplicationHandlerBase, {
		
		lastListChangedTime:null,

/**@memberOf application.handlers.WOListHandler */
		startStopTimerClickHandler : function(eventContext) {
			Logger.trace("[WOListHandler] executing startStopTimerClickHandler");
			var self = this;
			var workOrderTimerSet = eventContext.application.getResource('workOrderTimer');
			var workOrder = eventContext.getCurrentRecord();
			var workOrderId = workOrder.getRemoteId();
			var woTimer = workOrderTimerSet.getCurrentRecord();
			var startedId = woTimer.get("workOrderId");
			
			//TODO: move this lookup down into the business object layer
			var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");
			
			if (startedId) { 
				Logger.trace("[WOListHandler] Started WO was found");
				// Need to check that the workorder id currently started is still in the list
				var workOrderSet = eventContext.application.getResource('workOrder');
				var previouslyStartedWorkOrder = workOrderSet.find("remoteid == $1", startedId);
				if (previouslyStartedWorkOrder.length == 0) {
					//at this point the WorOrder set is queried without query base
					//to check if the WO was removed from the use list
					Logger.trace("[WOListHandler] Verifying if WO was transfered to another user or is in a different List ");
					ModelService.byRef(workOrderSet.getResourceName(), {remoteid: startedId}).then(function(resourceSet){
						if(resourceSet.count() == 0){
							//if the WO not is associated for the user we just start the new one
							Logger.trace("[WOListHandler] WO was transfered just start the new WO");
							WorkOrderTimer.resetTimer(woTimer);
							self._startWOTimer(woTimer, workOrder, eventContext, oslcmaxvars, false);
						}else{
							//if WO continue associated with the user but is in a different query base then the on been displayed
							var previousWorkOrder = resourceSet.getRecordAt(0);
							//Fix for PMR 01423 019 866
							if (!previousWorkOrder) {
								Logger.trace("[WOListHandler] Somehow the previousWorkOrder wonum is null so just resetting the timer ");
								WorkOrderTimer.resetTimer(woTimer);
								self._startWOTimer(woTimer, workOrder, eventContext, oslcmaxvars, false);
							}
							else if (previousWorkOrder && previousWorkOrder.wonum === undefined) {
								Logger.trace("[WOListHandler] Somehow the previousWorkOrder wonum is undefined so just resetting the timer ");
								try {
									//Try and Stringify the previousWorkorder to understand what's happening
									Logger.trace("[WOListHandler] previousWorkorder JSON: "+ JSON.stringify());
								} catch (error) {
									
								}
								WorkOrderTimer.resetTimer(woTimer);
								self._startWOTimer(woTimer, workOrder, eventContext, oslcmaxvars, false);
							} else {
								//the previous workorder is in a different querybase, need to show a message to the user
								Logger.trace("[WOListHandler] WO is in a different query base");
								woTimer.set("nextWorkOrderId", workOrderId);
								woTimer.set("wonum", previousWorkOrder.wonum);
								self.ui.show('WorkExecution.WOStartedDialog');
							}
						}
					});
					
					return;
				}
				if (startedId == workOrderId) {
					Logger.trace("[WOListHandler]The WO started is the same of the one that user select to stop ");
					self.ui.show('WorkExecution.StopWorkView');
				} else {
					Logger.trace("[WOListHandler] user select to start WO but he already has one started, The dialog to stop the previous is displayed");
					//Need to save off the work order id for the message dialog
					Logger.trace("[WOListHandler] Next WO to be started workOrderId = " +  workOrderId + " WONum" + previouslyStartedWorkOrder[0].wonum);
					woTimer.set("nextWorkOrderId", workOrderId);
					woTimer.set("wonum", previouslyStartedWorkOrder[0].wonum);
					self.ui.show('WorkExecution.WOStartedDialog');
				}
			} else {
				Logger.trace("[WOListHandler] No Wo started start the requested");
				//when we dont have timer started we need to set the WOID that will be started  at the timer
				// and save the timer to avoid two green timer at lazy devices 
				//woTimer.set("workOrderId", workOrder.getRemoteId());
				//ModelService.save(woTimer.getOwner());
				this._startWOTimer(woTimer, workOrder, eventContext, oslcmaxvars, false);
								
			}
		},
		
		_startWOTimer: function(woTimer, workOrder, eventContext, oslcmaxvars, startNext){
			// WorkOrderTimer.startTimerForWorkOrder checks MaxVars.shouldInProgressWOWhenTimerStarted(oslcmaxvars)
			// to see if the status should be changed to INPRG, so we should only show the esig popup if that
			// returns true (if it returns false we're not doing a status change so no esig is necessary)
			
			if (MaxVars.shouldInProgressWOWhenTimerStarted(oslcmaxvars)){
				// check for esig
				var EsigHandler = this.application["platform.handlers.EsigHandler"];
				if (EsigHandler.isEsigRequired(this, workOrder, 'status')){
					// show esig
					EsigHandler.showEsig(this, this._startWOTimer_final, [woTimer, workOrder, eventContext, oslcmaxvars, startNext]);
				} else {
					this._startWOTimer_final(woTimer, workOrder, eventContext, oslcmaxvars, startNext);
				}
			}
			else{
				this._startWOTimer_final(woTimer, workOrder, eventContext, oslcmaxvars, startNext);
			}
		},

		_startWOTimer_final: function(woTimer, workOrder, eventContext, oslcmaxvars, startNext){
			var myLaborSet = eventContext.application.getResource('mylabor');
			var myLaborCraftRateSet = eventContext.application.getResource('mylaborcraftrate');	
			myLaborCraftRateSet.clearFilterAndSort();
			//filter by org
			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			myLaborCraftRateSet.filter('orgid == $1',orgid);
			
			if(myLaborSet.count() > 0) {					
				if(myLaborCraftRateSet.count() > 0) {
					var taskSet = workOrder.getLoadedModelDataSetOrNull("tasklist");
					try{
						WorkOrderTimer.startTimerForWorkOrder(woTimer, workOrder, eventContext.application.getCurrentDateTime(), oslcmaxvars, startNext, taskSet);
						
						if (workOrder) {
							var WOGeolocation = new WOGeolocationHandler();
							if (WOGeolocation.isGPSTrackingActivate(eventContext)) {
								WOGeolocation.setLBSLocationWorkNumber(workOrder);
								Logger.log("LBS Location tracking request set for work order :: " + workOrder.get("wonum"));
							}
						}
					}catch(e){
						Logger.trace("Error starting WO timer: " + JSON.stringify(e));
						console.error(JSON.stringify(e), e);
						//we do not need to show message when user is in WOlist and the status change not is allowed
						//self.application.showMessage(MessageService.createStaticMessage(e.getMessage()).getMessage());
					}									
					ModelService.saveAll([workOrder.getOwner(), woTimer.getOwner()]).otherwise(function(e){
						console.error("Failed to save wo and timer " + JSON.stringify(e), e);
					});							
				} else {
					eventContext.application.showMessage(MessageService.createStaticMessage('errornocraftfound').getMessage());
				}
			}else {
				eventContext.application.showMessage(MessageService.createStaticMessage('errornolaborfound').getMessage());
			}
		},
		
		//This function hides the start timer button for workorders in the wrong state
		enableTimerButton : function(eventContext) {	
			
			var workOrder = eventContext.getCurrentRecord();	
			
			
			// 141275: Right after changing the status of a WO from WAPPR to APPR in server, 
			// the status is updated on the device, but the timer isn't available until user leaves the worklist and get back to it.
			if (!eventContext.hasResourceWatch("timerButton"))
			{
				var self = this;
				var watchStatus = workOrder.watch("status", function(){
					self.enableTimerButton(eventContext);
				});

				eventContext.addResourceWatchHandle(watchStatus, "timerButton");
			}
			
			// MXSPATIAL - When it switches to offline map the workOrder is null.
			if (workOrder == null || WorkOrderObject.cannotBeStarted(workOrder)) {			
				eventContext.setDisplay(false);
				return;
			}	
			var workOrderTimerSet = eventContext.application.getResource('workOrderTimer');
			if(workOrderTimerSet){
				var woTimer = workOrderTimerSet.getCurrentRecord();				
				
				if(workOrder.get("wonum") && workOrder.get("started") && (woTimer.get("wonum") != workOrder.get("wonum"))){
					Logger.trace("[StopTimerHandler] set the timer enabled when changing the query ");
					workOrder.set("started", false);
					eventContext.setState(false);	
				} 
				
			}
			eventContext.setDisplay(true);
		},	
		
		renderCreateFollowUpAction : function(eventContext) {
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			if(workOrder.isErrored() || !workOrder.wasCommittedToServer()) {
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		

		resolveWonumLabel : function(eventContext) {
			var record = eventContext.application.getResource('workOrder').getCurrentRecord(); 
			var wonum = '';
			if(record)
				wonum = record.get('wonum');
			return [ wonum ? wonum : ''  ];
		},
		//straight resource lookup
		resolveTimerWonum : function(eventContext) {
			var wonum = '';
			var wonum2 = '';
			var workOrderTimerSet = eventContext.application.getResource('workOrderTimer');			
			if (workOrderTimerSet != null) {
				var woTimer = workOrderTimerSet.getCurrentRecord();				
				wonum = woTimer.get("wonum"); 
				
				//Need to get the wonum of the next workorder as well
				var workOrderSet = eventContext.application.getResource('workOrder');
				var workOrderList = workOrderSet.find("remoteid == $1", woTimer.get("nextWorkOrderId"));
				if(workOrderList.length > 0){
					var nextWorkOrder = workOrderList[0];
					wonum2 = nextWorkOrder.get('wonum');
				}
			}
			return [wonum, wonum, wonum2];
		}, 				
		
		WOStartedDialogNoClickHandler : function(eventContext) {
			var workOrderTimerSet = this.application.getResource('workOrderTimer');			
			if (workOrderTimerSet != null) {
				var woTimer = workOrderTimerSet.getCurrentRecord();		
				//Clear the workorder id since we decided not to start the next one
				woTimer.set("nextWorkOrderId", null);	
			}
			eventContext.ui.hideDialog('WorkExecution.WOStartedDialog');
		},

		WOStartedDialogYesClickHandler : function(eventContext) {
			//This returns the latest workorder whose timer was clicked						
			var workOrderTimerSet = this.application.getResource('workOrderTimer');	
			var woTimer = workOrderTimerSet.getCurrentRecord();
			
			
			ModelService.save(woTimer.getOwner());
			eventContext.ui.hideDialog('WorkExecution.WOStartedDialog');
			var workOrderSet = eventContext.application.getResource("workOrder");
			var workOrderList = workOrderSet.find("remoteid == $1", woTimer.get("workOrderId"));
			if (workOrderList.length > 0) {
				//Found the workorder and can stop it.  Otherwise the workorder is in a different querybase
				eventContext.ui.show('WorkExecution.StopWorkView');
			}
		},
		
		initMaterialsToolsSummary : function(eventContext) {

			var toolSet = null;
			var materialSet = null;
			var self = this;			
			var materialSums = {};
			var toolSums = {};

			CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
				eventContext.application.showBusy();
				if (hasConnectivity){

					var promise1 = ModelService.empty("toolSummary").then(function(_toolSet){
						toolSet = _toolSet;
						toolSet.resourceID = "toolSummary";
						self.application.addResource(toolSet);
					});

					var promise2 = ModelService.empty("materialSummary").then(function(_materialSet){
						materialSet = _materialSet;
						materialSet.resourceID = "materialSummary";
						self.application.addResource(materialSet);
					});

					var queryBase = eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').queryBase;			
					ModelService.allWithComplexAttributes('workOrder', queryBase, ['toollist','materiallist']).then(function(modelDataSet){				
						all([promise1, promise2]).then(function(){
							if(modelDataSet.count() > 0){
								modelDataSet.foreach(function(workOrder){
									//process materials
									var materialList = workOrder.getLoadedModelDataSetOrNull('materiallist');
									if(materialList && materialList.count()>0){
										materialList.foreach(function(material){
											if(material.directrequest == false){
												var storeAndItem = material.storeroom+'::'+material.item;
												var materialObj={"item":material.get('item'),"desc":material.get('itemdesc'),"qty":material.get('quantity'),"storeroom":material.get('storeroom')};	
												if(!materialSums || materialSums[storeAndItem] == null){
													materialSums[storeAndItem] = materialObj;
												}
												else{ //accumulate
													var oldqty = materialSums[storeAndItem].qty;
													newqty = oldqty+material.get('quantity');
													materialSums[storeAndItem].qty = newqty;
												}
											}
										});
									}
									
									//process tools
									var toolList = workOrder.getLoadedModelDataSetOrNull('toollist');
									if(toolList && toolList.count()>0){
										var taskStoreToolMap ={};
										toolList.foreach(function(tool){
											var toolStore = tool.storeroom == null ? ' ' : tool.storeroom;
											var toolName = tool.taskid+'::'+toolStore+'::'+tool.tool;
											var toolObj={"tool":tool.get('tool'),"desc":tool.get('tooldesc'),"qty":tool.get('quantity'),"storeroom":tool.get('storeroom')};	
											if(!taskStoreToolMap || taskStoreToolMap [toolName] == null){
												taskStoreToolMap[toolName] = toolObj;
											}
											else{//accumulate
												var oldqty = taskStoreToolMap[toolName].qty;
												newqty = oldqty+tool.get('quantity');
												taskStoreToolMap[toolName].qty = newqty;
											}
										});
										
										var toolKeys = Object.keys(taskStoreToolMap);
										for(key in toolKeys){
											var tool = taskStoreToolMap[toolKeys[key]];
											var toolStore = tool.storeroom == null ? ' ' : tool.storeroom;
											var toolName = toolStore+'::'+tool.tool;
											if(!toolSums || toolSums[toolName] == null){
												toolSums[toolName] = tool;
											}
											else{//use greatest quantity
												var oldqty = toolSums[toolName].qty;
												newqty = tool.qty > oldqty ? tool.qty : oldqty;
												toolSums[toolName].qty = newqty;
											}
										}
									}
								});
								
								// load materials
								var materialKeys = Object.keys(materialSums); 
								var materialSummary = eventContext.application.getResource("materialSummary");
								for(key in materialKeys) {
									var materialDisp = materialSummary.createNewRecord();
									var material = materialSums[materialKeys[key]];
									materialDisp.set('storeroomdisplay', material.storeroom);
									materialDisp.set('itemdisplay', material.item);
									materialDisp.set('descdisplay', material.desc);
									materialDisp.set('quantitydisplay', material.qty);
								};
								// load tools
								var toolKeys = Object.keys(toolSums);
								var toolSummary = eventContext.application.getResource("toolSummary");
								for(key in toolKeys) {
									var toolDisp = toolSummary.createNewRecord();
									var tool = toolSums[toolKeys[key]];
									toolDisp.set('storeroomdisplay', tool.storeroom);
									toolDisp.set('tooldisplay', tool.tool);
									toolDisp.set('descdisplay', tool.desc);
									toolDisp.set('quantitydisplay', tool.qty);
								};
								if(materialSummary.data.length>0){
									materialSummary.setCurrentIndex(0);
								}
								if(toolSummary.data.length>0){
									toolSummary.setCurrentIndex(0);
								}
								// show view
								eventContext.application.ui.show('WorkExecution.MaterialsTools');
								eventContext.application.hideBusy();

							}
							else{
								eventContext.application.hideBusy();
								eventContext.application.showMessage(MessageService.createStaticMessage('norecords').getMessage());
							}
						});				
					});
				}
				else{
					eventContext.application.showMessage(MessageService.createStaticMessage('downloadFailedNoConnectivity').getMessage());
					eventContext.application.hideBusy();
				}
			});
		},
		
		hideShowSearchedMenu : function(eventContext){
			var searchResource = eventContext.application.getResource("searchWorkOrder");
			if(searchResource != null){
				eventContext.setDisplay(true);
			}
			else{
				eventContext.setDisplay(false);
			}
		},
		
		enableDisableMaterialToolsAction : function(eventContext) {
			//hide the Materials and Tools action for filtered (Bar Code Scan) WO Lists
			var filtered = eventContext.application.getResource('workOrder').isFiltered();	
			//also hide the Materials and Tools action if the query base is WOs created locally, search result, or errored
			var qb = eventContext.ui.getCurrentViewControl().queryBase;
			//console.log("Current query base = "+qb);
			var isLocalCreatedQB = (qb  && (filtered || qb == PlatformConstants.CREATED_QUERYBASE || qb == PlatformConstants.SEARCH_RESULT_QUERYBASE || qb == PlatformConstants.ERRORED_QUERYBASE));
			eventContext.setDisplay(!isLocalCreatedQB);			
		},
		
		renderWorkOrderActionIfNotLocked : function(eventContext) {
			eventContext.setDisplay(true);
		}				
	});
});
