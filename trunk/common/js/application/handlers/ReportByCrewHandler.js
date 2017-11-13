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

define("application/handlers/ReportByCrewHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/handlers/CommonHandler",
	     "platform/model/ModelService",
	     "platform/util/DateTimeUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/util/PlatformConstants",
	     "application/business/ActualLaborObject",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/business/CrewLaborObject",
	     "application/business/CrewToolObject",
	     "application/business/MaxVars",
	     "platform/translation/SynonymDomain",
	     "application/business/WorkOrderTimer",
	     "dojo/promise/all",
		  "platform/translation/MessageService",
		  "platform/logging/Logger",
		  "platform/util/AsyncAwareMixin",
		  "dojo/Deferred",
		  "dojo/_base/array",
		  "application/business/util/CrewUtil"
	     ],
function(declare, ApplicationHandlerBase, CommonHandler, ModelService, DateTimeUtil, PlatformRuntimeException, PlatformConstants, ActualLaborObject, PlatformRuntimeWarning, CrewLaborObject, CrewToolObject, MaxVars, SynonymDomain, WorkOrderTimer, all, MessageService, Logger, AsyncAwareMixin, Deferred, arrayUtil, CrewUtil ) {
	return declare( [ApplicationHandlerBase, AsyncAwareMixin], {
		
		//Attributes used when Crew Labor editing is canceled
		currLaborStartDate:null,
		currLaborStartTime:null,
		currLaborFinishDate:null,
		currLaborFinishTime:null,
		currLaborDuration:null,
		currLaborPremiumPayCode:null,
		currLaborPremiumPayHours:null,
		currLaborTransType:null,
		
		//Attributes used when Crew Tool editing is canceled
		currToolDuration:null,
		currActualsTaskId:null,

		
		
		//Initialize Actual Labor Detail view
/**@memberOf application.handlers.ReportByCrewHandler */
		renderReportByCrewButton: function(eventContext){
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();			
			if (!workOrder || !ActualLaborObject.canAddActualLabor(workOrder) || workOrder.isErrored()) {			
				eventContext.setDisplay(false);
				return;
			}			
			var laborCrew = CrewUtil.getUserCrew(eventContext);
		
			if (laborCrew){
				eventContext.setDisplay(true);
			}else{
				eventContext.setDisplay(false);
			}			
		},
		
		initActualCrewEntryView: function(eventContext){
			var crew =  CrewUtil.getUserCrew(eventContext);
			var laborTransactionTypeSet=  CommonHandler._getAdditionalResource(eventContext,"domainlabortransactiontype");
			var currentDateTime = eventContext.application.getCurrentDateTime();
			CrewLaborObject.setDefaultValues(crew, laborTransactionTypeSet, currentDateTime);
		},	
		
		clickReportByCrewButton: function(eventContext){
			var crew =  CrewUtil.getUserCrew(eventContext);
			
			//Initialize crew variables
			crew.setNullValue('actualstaskid');
			crew.set('startdate','');
			crew.set('starttime','');
			crew.set('finishdate','');
			crew.set('finishtime','');
			crew.set('regularhours','');
			crew.set('transtype','');
			crew.set('contractnum','');			
		},
		
		//Initialize Actual Labor Entry view
		initCrewLaborList: function(eventContext){
    			
		},
		
		initCrewLaborDetail: function(eventContext){
			//Store current values to restore in case Cancel is clicked
			var labor =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord();
			
			this.currLaborStartDate = labor.get('startdate');
			this.currLaborStartTime = labor.get('starttime');
			this.currLaborFinishDate = labor.get('finishdate');
			this.currLaborFinishTime = labor.get('finishtime');
			this.currLaborDuration = labor.get('regularhours');
			this.currLaborPremiumPayCode = labor.get('premiumpaycode');
			this.currLaborPremiumPayHours = labor.get('premiumpayhours');
			this.currLaborTransType = labor.get('transtype');
			this.currActualsTaskId = labor.get('actualstaskid');
		},		
		
		initCrewToolView: function(eventContext){
            var crew =  CrewUtil.getUserCrew(eventContext);
			var crewTotalHours = crew.get('regularhours');

			if(crewTotalHours){
				//var toolSet =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource");
				currTool = eventContext.getCurrentRecord();
				
				if (currTool.getDurationInMillisOrNegative('toolhrs')<0) {
					currTool.set('toolhrs',crewTotalHours);
				}
				
				//Store current values to restore in case Cancel is clicked
				var tool =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource").getCurrentRecord();
				this.currToolDuration = tool.get('toolhrs');
				this.currActualsTaskId = tool.get('actualstaskid');
			}			
		},
		
		_buildLocalResources: function(eventContext){
			var self=this;
			var deferred = new Deferred();
			//Local resources
			var laborSet =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource");
			var toolSet =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource");
			var curCrew =  CrewUtil.getUserCrew(eventContext);
			
			//Clearing the existing resources sets to empty
			laborSet.filter('1=0');
			toolSet.filter('1=0');
			
			var currentTime = eventContext.application.getCurrentDateTime();
			
			//Load tools from crew and set on local resource						
			
			//reset asset filter and fetch additionalasset resource		
			var additionalAssetPromise = this.resetAssetFilter(eventContext);
			
			var actuallaborlistPromise = curCrew.getModelDataSet('crewlabor');
			var actualtoollistPromise = curCrew.getModelDataSet('crewtool');
			all([actuallaborlistPromise, actualtoollistPromise, additionalAssetPromise]).
			then(function(results){
				additionalAssetPromise.then(function(additionalAssetSet){
					var laborListPromise = CrewLaborObject.buildLaborList(laborSet, curCrew, results[0], currentTime, ModelService);
					try {
						var toolListPromise = CrewToolObject.buildToolList(toolSet, curCrew, results[1], currentTime, ModelService, additionalAssetSet);
					} catch (runtimeException) {
						if (runtimeException instanceof PlatformRuntimeException) {
							self.application.showMessage(runtimeException.getMessage());
						}
					}
					all([laborListPromise, toolListPromise])
					.then(function() {
						deferred.resolve();
					});
				});
			});
			return deferred.promise;
		},
		
		resetAssetFilter: function(eventContext){
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			if(siteid == null){
				siteid = UserManager.getInfo("defsite");
			}
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainAssetstatus'); 
			var externalStatuses = SynonymDomain.resolveToExternal(domainAssetstatus, 'OPERATING');
			
			var filter = [];
			arrayUtil.forEach(Object.keys(externalStatuses), function(externalStatus) {
				filter.push({siteid: siteid, status: externalStatus});
			}, this);
			
			return ModelService.filtered('additionalasset',null,filter,1000,false,false);
			
		},
		
		//Load labor and tool from Crew and set on local resource
		//Show Labor list
		reviewCrew: function(eventContext){

			var crew =   CrewUtil.getUserCrew(eventContext);
			
			if(!this.validateEndDateAndTime(crew)){
				throw new PlatformRuntimeException('cannotspecifyendtimewithoutenddate');
				return;
			}
			
			if(!this.validateDatesTolerance(crew)){
				throw new PlatformRuntimeException('invalidlabordatetime');
				return;
			}
			var self = this;
			this._buildLocalResources(eventContext)
			.then(function() {
				var woTimer =  CommonHandler._getAdditionalResource(eventContext,"workOrderTimer").getCurrentRecord();
				if(woTimer){
					woTimer.set('useCrewToCreateActual', false);
					woTimer.set('paused', false);
				}
				self.ui.show("WorkExecution.CrewReviewListView");
			});
						
		},
		
		
		//create the tool report without the review flow
		createCrewDirectly: function(eventContext){

			eventContext.application.showBusy();
			var crew =   CrewUtil.getUserCrew(eventContext);

			if(!this.validateEndDateAndTime(crew)){
				throw new PlatformRuntimeException('cannotspecifyendtimewithoutenddate');
				return;
			}
			
			if(!this.validateDatesTolerance(crew)){
				throw new PlatformRuntimeException('invalidlabordatetime');
				return;
			}
			var self = this;
			this._buildLocalResources(eventContext)
			.then(function() {
				self.createActualLabors(eventContext);
				var woTimer =  CommonHandler._getAdditionalResource(eventContext,"workOrderTimer").getCurrentRecord();
				if(woTimer){
					woTimer.set('useCrewToCreateActual', false);
					woTimer.set('paused', false);
				}
			});
			
		},

		handleBackButtonClick: function(eventContext){
			
			//TODO Clear any entry on Crew local resources
			
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		//Invoked on all Labors are completed and can be applied as actuals - Crew 
		handleApproveCrewlaborClick: function(eventContext){
			
			this.ui.show("WorkExecution.CrewlaborView");
		},
		
		initCrewToolList: function(eventContext){
			
		},
		
		createActualLabors: function(eventContext){
			var self = this;
			var crewlaborLocalSet =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource");
			var crewtoolLocalSet =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource");
			var curr =  CrewUtil.getUserCrew(eventContext);
			
			var actuallaborlist =  null;
			var actualtoollist =  null;
			
			var woSet = CommonHandler._getAdditionalResource(eventContext,'workOrder');
			var workOrderTimerSet = CommonHandler._getAdditionalResource(eventContext,'workOrderTimer');
			
			
			//var workOrderSet =  CommonHandler._getAdditionalResource(eventContext,"workOrder");
			//TODO: move this lookup down into the business object layer
			var oslcmaxvars =  CommonHandler._getAdditionalResource(eventContext,"oslcmaxvars");
			//TODO: move this lookup down into the business object layer			
			var laborTransactionTypeSet =  CommonHandler._getAdditionalResource(eventContext,"domainlabortransactiontype");	
			var nextWO = woSet.getCurrentRecord();
			var woTimer =  workOrderTimerSet.getCurrentRecord();
			var workOrderList =  null;
			//if this condition is true the report by crew came from start/stop view 
			if(woTimer.get('useCrewToCreateActual')){
				workOrderList = woSet.find("remoteid == $1", woTimer.get("workOrderId"));
			} else {
				workOrderList = woSet.find("remoteid == $1", nextWO.get("remoteid"));
			}
			
			
			var myLaborSet =  CommonHandler._getAdditionalResource(eventContext,"mylabor");
			
			if(workOrderList && myLaborSet &&  workOrderList.length > 0 && myLaborSet.count() > 0) {
				var startedWorkOrder = workOrderList[0];
					//if user select to review the report  and if user select to review and is starting a second WO
					//this code manipulate the WO to get the first started
					if((workOrderTimerSet && !workOrderTimerSet.getCurrentRecord().get('useCrewToCreateActual'))||
							(workOrderTimerSet &&  workOrderTimerSet.getCurrentRecord().get('useCrewToCreateActual') && woSet.getCurrentRecord().get('wonum') == workOrderTimerSet.getCurrentRecord().get('wonum') )){
						actuallaborlist =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist");
						actualtoollist =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actualtoollist");
						CrewLaborObject.createAtualLbaorForCrew(crewlaborLocalSet, actuallaborlist, curr);	
						CrewToolObject.createAtualToolForCrew(crewtoolLocalSet, actualtoollist);
						// if not pause nor completed an error message might have been shown
						if(self.pauseOrCompleteWork(eventContext, startedWorkOrder, woTimer, nextWO, laborTransactionTypeSet, oslcmaxvars, myLaborSet)){						
							ModelService.saveAll([startedWorkOrder.getOwner(), woTimer.getOwner()]).then(function(){
								Logger.trace("[ReportByCrewHandler] saving WO and timer");
								if (self.ui.viewHistory[self.ui.viewHistory.length-2].id == 'WorkExecution.StopWorkView' || self.ui.getCurrentViewControl().id ==  'WorkExecution.CrewReviewListView'){
									if (!self.ui.returnToView("WorkExecution.WorkDetailView")) {
										self.ui.returnToView("WorkExecution.WorkItemsView");
									} 
								}
								else{
									self.ui.hideCurrentView();
								}
							}).otherwise(function(error){
								Logger.trace("[ReportByCrewHandler] error saving WO and timer " + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
								self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
							});
						}						
					} else {							
						var wo = woSet.find('wonum == $1', workOrderTimerSet.getCurrentRecord().get('wonum'))[0];
						var actuallaborlistPromise = wo.getModelDataSet('actuallaborlist');
						var actualtoollistPromise = wo.getModelDataSet('actualtoollist');
						all([actuallaborlistPromise, actualtoollistPromise]).
						then(function(results){
							var actuallaborlist = results[0];
							var actualtoollist = results[1];
							CrewLaborObject.createAtualLbaorForCrew(crewlaborLocalSet, actuallaborlist, curr);	
							CrewToolObject.createAtualToolForCrew(crewtoolLocalSet, actualtoollist);
							
							// if not pause nor completed an error message might have been shown
							if(self.pauseOrCompleteWork(eventContext, wo, woTimer, nextWO, laborTransactionTypeSet, oslcmaxvars, myLaborSet)){							
								ModelService.saveAll([startedWorkOrder.getOwner(), woTimer.getOwner()]).then(function(){
									Logger.trace("[ReportByCrewHandler] saving WO and timer");
									if (self.ui.viewHistory[self.ui.viewHistory.length-2].id == 'WorkExecution.StopWorkView' || self.ui.getCurrentViewControl().id ==  'WorkExecution.CrewReviewListView'){
										if (!self.ui.returnToView("WorkExecution.WorkDetailView")) {
											self.ui.returnToView("WorkExecution.WorkItemsView");
										} 
									}
									else{
										self.ui.hideCurrentView();
									}
								}).otherwise(function(error){
									Logger.trace("[ReportByCrewHandler] error saving WO and timer " + MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
									self.application.showMessage(MessageService.createStaticMessage("errorwhilesavinglabor").getMessage());
								});															
							}
						});
					}
				}else{
					this.application.showMessage(MessageService.createStaticMessage("errornolaborfound").getMessage());	
				}
									
		},
		
		pauseOrCompleteWork: function(eventContext, startedWorkOrder, woTimer, nextWO, laborTransactionTypeSet, oslcmaxvars, myLaborSet){
			Logger.trace("[ReportByCrewHandler] executing the pause or stop of WO user came from stop view");
			var self = this;
			
			if(woTimer.get('useCrewToCreateActual')){
				var timerStatusSet =  CommonHandler._getAdditionalResource(eventContext,"domaintimerstatus");
				var timerStatus = SynonymDomain.resolveToDefaultExternal(timerStatusSet, 'COMPLETE')
				
				var starttime = woTimer.getAsDateOrNull("startTime");
				var endtime = woTimer.getAsDateOrNull("endTime");
				var duration = woTimer.get("duration");
				var myLaborCraftSet =  CommonHandler._getAdditionalResource(eventContext,"mylaborcraftrate");
				var hasNext = woTimer.get("nextWorkOrderId");
				
				if(myLaborCraftSet.count() > 0) {
						WorkOrderTimer.appValidate(woTimer);
						var taskSet =  CommonHandler._getAdditionalResource(eventContext,"workOrder.tasklist");
						if(woTimer.get('paused')){
							Logger.trace("[ReportByCrewHandler] at the stop UI user select to pause the WO");
							woTimer.set('paused', false);							
							WorkOrderTimer.pauseTimerForWorkOrder(woTimer, startedWorkOrder, null, myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, null, nextWO);
							//if we have next WO we can not clean the timer since it has the info for the second WO started  
							if(!hasNext){
								WorkOrderTimer.resetTimer(woTimer);
							}

							WorkOrderTimer.copyDeferredToWoNum(woTimer);
							woTimer.set('useCrewToCreateActual', false);
							return true;
						}else {
							try{	
								Logger.trace("[ReportByCrewHandler]at the Stop view user select to stop the WO ");
								WorkOrderTimer.stopTimerForWorkOrder(woTimer, startedWorkOrder, null, myLaborCraftSet.getRecordAt(0), oslcmaxvars, laborTransactionTypeSet, timerStatus, taskSet, nextWO);
								//if we have next WO we can not clean the timer since it has the info for the second WO started
								if(!hasNext){
									WorkOrderTimer.resetTimer(woTimer);
								}
								
								WorkOrderTimer.copyDeferredToWoNum(woTimer);
								woTimer.set('useCrewToCreateActual', false);
								return true;
							}catch(error){
								Logger.trace("[ReportByCrewHandler] error compliting WO = " + MessageService.createStaticMessage(error.getMessage()).getMessage());
								switch (true) {
								case (error instanceof PlatformRuntimeException):						
									self.application.showMessage(MessageService.createStaticMessage(error.getMessage()).getMessage());
									break;				
								}
							}
							return false;
						}																		
				} else {
					this.application.showMessage(MessageService.createStaticMessage("errornocraftfound").getMessage());
					return false;
				}				
			}
			return true;
		},
		
		discardCrewToolEntryView: function(eventContext){
			var tool =  CommonHandler._getAdditionalResource(eventContext,"crewToolResource").getCurrentRecord();			
			tool.set('toolhrs',this.currToolDuration);
			tool.set('toolhrs',this.currToolDuration);
			tool.set('actualstaskid',this.currActualsTaskId);
			
			eventContext.ui.hideCurrentView();
		},

		
		commitCrewToolEntryView: function(eventContext){			
			eventContext.ui.hideCurrentView();			
		},
		
		
		discardCrewLaborEntryView: function(eventContext){
			var labor =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord();
			
			labor.set('actualstaskid',this.currActualsTaskId);
			labor.set('startdate',this.currLaborStartDate);
			labor.set('startdate',this.currLaborStartDate);
			labor.set('starttime',this.currLaborStartTime);
			labor.set('finishdate',this.currLaborFinishDate);
			labor.set('finishtime',this.currLaborFinishTime);
			labor.set('transtype',this.currLaborTransType);
			
			labor.set('premiumpaycode',this.currLaborPremiumPayCode);
			if(this.currLaborPremiumPayCode){
				labor.set('premiumpayhours',this.currLaborDuration);
				labor.set('actuallaborhours',this.currLaborDuration);
			} else {
				labor.set('regularhours',this.currLaborDuration);
				labor.set('actuallaborhours',this.currLaborDuration);
			}
						
			eventContext.ui.hideCurrentView();
			//eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},

		
		commitCrewLaborEntryView: function(eventContext){
			var crew =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord();
			

			if(!this.validateEndDateAndTime(crew)){
				throw new PlatformRuntimeException('cannotspecifyendtimewithoutenddate');
				return;
			}
			
			if(!this.validateDatesTolerance(crew)){
				throw new PlatformRuntimeException('invalidlabordatetime');
				return;
			}
			eventContext.ui.hideCurrentView();			
		},
		
		filterPremiumPay : function(eventContext){
			var payCode =  CommonHandler._getAdditionalResource(eventContext,'additionalpremiumpaycode');
			var craftRate =  CommonHandler._getAdditionalResource(eventContext,'additionalpremiumpaycraftrate');

			var orgid =  CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord().get('orgid');
			var craft =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord().get('craft');

			var keys = {};
			if(craft){
				CommonHandler._clearFilterForResource(this,craftRate);
				
				//filter premium craft rate
				craftRate.filter("craft == $1 && orgid == $2", craft, orgid);
								 
				craftRate.foreach(function(record){
					keys[record.get('premiumpaycode') + '::' + orgid ] = true;
				});
			}

			//filter premium pay code				
			if(payCode.isFiltered()){
				payCode.clearFilterAndSort();
			}
			payCode.filter("$1[premiumpaycode + '::' + orgid]", keys);
		},
		validateType: function(eventContext) {
			var actualLabor =  CrewUtil.getUserCrew(eventContext);
			this._validateType(eventContext, actualLabor);
		},
		validateTypeCrewLaborResource: function(eventContext) {
			var actualLabor =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord();
			this._validateType(eventContext, actualLabor);
		},
		_validateType: function(eventContext, actualLabor){
			
			var type = actualLabor.getPendingOrOriginalValue('transtype');
			
			if(!type) return;
			var transTypeSet =  CommonHandler._getAdditionalResource(eventContext,"domainlabortransactiontype");
			CommonHandler._clearFilterForResource(this,transTypeSet);
			var isValid = transTypeSet.find('value == $1', type);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidLaborTransType');
			}
		},
		validateEndDateAndTime : function(crew) {						
			
			var finishtime = crew.getAsDateOrNull('finishtime');	
			if (!finishtime) {
				return true;
			}
			var finishdate = crew.getAsDateOrNull('finishdate');
			
			return (finishtime && finishdate);
		},

		
		validateDatesTolerance : function(crew) {

			//TODO: Refactor so this can be shared between actual labor and crew		

			var startdate = crew.getAsDateOrNull('startdate');
			var finishdate = crew.getAsDateOrNull('finishdate');

			if (!startdate) {
				throw new PlatformRuntimeException('startdateisrequired');
			}
			if(!startdate && !finishdate) return;
			var starttime = crew.getAsDateOrNull('starttime');
			var finishtime = crew.getAsDateOrNull('finishtime');

			var orgid =  CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('orgid');
			var currentdatetime = this.application.getCurrentDateTime();
			var oslcmaxvars =  CommonHandler._getAdditionalResource(this,"oslcmaxvars");

            //Validating Start Date and Time
			var startdatetime;
			if (startdate){
				if(starttime){
				   startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				} else {
					startdatetime = startdate;
				}
			}

			if (startdatetime){
			   // validation: (startdatetime <= currentDate + labtranstolerance);
				if(!MaxVars.isActualLaborDateValid(oslcmaxvars, startdatetime, currentdatetime, orgid)){
					return false;
				}
				if (starttime) {
					crew.setDateValue('starttime', startdatetime);
				} 
			}

			//Validating Finish Date and Time
			var finishdatetime;
			if (finishdate){
				   if(finishtime){
				       finishdatetime = DateTimeUtil.fromDateAndTimeToDateTime(finishdate, finishtime);
				   } else {
					   finishdatetime = finishdate;
				   }
			}

			if (finishdatetime){
			   // validation: (finishdatetime <= currentDate + labtranstolerance);
				if(!MaxVars.isActualLaborDateValid(oslcmaxvars, finishdatetime, currentdatetime, orgid)){
					return false;
				}
				if (finishtime) {
					crew.setDateValue('finishtime', finishdatetime);
				}

			}
            return true;

		},
		// -------------------------------------------------------------------------------------
		// sync version of validatePremiumPaycode
		validatePremiumPayCode: function(eventContext){
			var actualLabor =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord();
			var premiumpaycode = actualLabor.getPendingOrOriginalValue('premiumpaycode');
			
			if(!premiumpaycode) return;
						
			var premiumPaycodeSet = eventContext.application.getResource("additionalpremiumpaycode");
			CommonHandler._clearFilterForResource(this,premiumPaycodeSet);
			
			var isValid = premiumPaycodeSet.find('premiumpaycode == $1', premiumpaycode);
			
			if(isValid.length == 0){
				actualLabor.setNullValue('premiumpaycode');
				throw new PlatformRuntimeWarning('invalidPremiumPayCode');
			}
			else{
				actualLabor.set('premiumpaycode', isValid[0].get('premiumpaycode'));
			}
		},
		
		// async version of validate premium pay code
		asyncvalidatePremiumPayCode: function(eventContext){
			var actualLabor =  CommonHandler._getAdditionalResource(eventContext,"crewLaborResource").getCurrentRecord();
			var premiumpaycode = actualLabor.getPendingOrOriginalValue('premiumpaycode');
			
			if(!premiumpaycode) return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('premiumpaycode',premiumpaycode);
			
			var premiumPaycodeSet = eventContext.application.getResource("additionalpremiumpaycode");
			CommonHandler._clearFilterForResource(this,premiumPaycodeSet);				
			
			var premiumPaycodePromise = this.async_vc_getPremiumPaycodePromise(premiumPaycodeSet, premiumpaycode);
			this.async_vc_validatePremiumPaycode(premiumPaycodePromise);
		},
		async_vc_getPremiumPaycodePromise: function(premiumPaycodeSet, code) {
			return ModelService.filtered(premiumPaycodeSet.getResourceName(), premiumPaycodeSet.getQueryBase(), [{premiumpaycode: code}], null, false, true);
		},

		async_vc_validatePremiumPaycode: function(premiumPaycodeSet) {
			if(premiumPaycodeSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidPremiumPayCode');
			}
		}		
	});
});
