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

define("application/handlers/FailureCodeHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
		  "dojo/_base/lang",
		  "dojo/dom-class",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/comm/CommunicationManager",
	     "application/business/WorkOrderObject",
	     "platform/translation/SynonymDomain",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "application/handlers/CommonHandler",
	     "application/business/FieldUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/auth/UserManager",
	     "platform/util/PlatformConstants",
	     "application/business/WpEditSettings",
	     "platform/util/AsyncAwareMixin",
	     "dojo/Deferred",
	     "platform/logging/Logger",
	     "dojo/when"],
function(declare, arrayUtil, lang, domClass, ApplicationHandlerBase, CommunicationManager, Workorder, SynonymDomain, ModelService, MessageService, CommonHandler, FieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, UserManager, PlatformConstants, WpEditSettings, AsyncAwareMixin,Deferred, Logger, when) {
	
	return declare( ApplicationHandlerBase,  {
		
		originalLinenum:null,
		currLinenum:null,
		nextLinenum:null,
		previousLinenum:null,
		self:this,
		failureCodeIsMissingFromDownloadedData: false,
		
/**@memberOf application.handlers.FailureCodeHandler */
		populateFailureClass: function(eventContext){
			var wo = this._getCurrentWO(eventContext);
			wo.backtrack = [];
			var failurecode = wo.get("failurecode");
			var failurecodedesc = wo.get("failureCodeDesc");
			
			if (this.failureCodeIsMissingFromDownloadedData) {
				this.ui.showMessage(MessageService.createResolvedMessage("failureClassData", [failurecode]));	
			}

			if (failurecode==null){
				eventContext.setDisplay(false);
				return;
			}
			
			eventContext.getResource().getRecordAt(0).set("failureClass", failurecode);
			eventContext.getResource().getRecordAt(0).set("failureCodeDesc", failurecodedesc);
		},
		
		populateCurrentFCLevel : function(eventContext){ 
			var wo = this._getCurrentWO(eventContext);
			
			if(wo.status == 'CLOSE'){
				eventContext.transitionTo = null;
				
			}
			
			var fcLvlTracker = {"originalLinenum":null,"nextLinenum":null};

			var currentFC = null;

			if (wo.failureReportlist){
				currentFC = wo.failureReportlist.getRecordAt(wo.failureReportlist.count()-1);
			}
	
			var deferred =  new Deferred();

			wo['backtrack']=[];
			
			if (currentFC){
				fcLvlTracker.originalLinenum = currentFC.linenum;
				fcLvlTracker.nextLinenum = currentFC.linenum;
				wo['FCLevelMonitor'] = fcLvlTracker;
				deferred.resolve();
			} else {
				if (wo.get("failurecode")){
					var failurecode = wo.get("failurecode");
					var linenum = null;
					var self=this;
					var firstLevelLineNumPromise = this._getFirstLevelLineNum(eventContext,failurecode);
					firstLevelLineNumPromise.then(function(dataSet){
						if (dataSet.count() > 0){
							linenum = dataSet.data[0].failurelist;
							fcLvlTracker.originalLinenum = linenum;
							fcLvlTracker.nextLinenum = linenum;
							wo['FCLevelMonitor'] = fcLvlTracker;
							self.failureCodeIsMissingFromDownloadedData = false;
							deferred.resolve();
						} else {
							wo['FCLevelMonitor'] = fcLvlTracker;
							self.failureCodeIsMissingFromDownloadedData = true;	
							deferred.reject(new PlatformRuntimeWarning('failureClassData'));
						}
					}).otherwise(function(e){
						self.failureCodeIsMissingFromDownloadedData = true;
						return new Deferred().reject(new PlatformRuntimeWarning('failureClassData'));
					});
				} else {
					fcLvlTracker.originalLinenum=null;
					fcLvlTracker.nextLinenum=null;
					wo['FCLevelMonitor'] = fcLvlTracker;
					deferred.resolve();
				}
			}
			
			if (currentFC){
				wo.set("currentFCType", currentFC.get("type"));
				wo.set("currentFCDesc", currentFC.get("failureDesc"));
			} else if (wo.failurecode) {
				wo.set("currentFCDesc", wo.get("failureCodeDesc"));
			} else {
				wo.set("currentFCType",'');
				wo.set("currentFCDesc", '');
			}
			return deferred.promise;
		},

		failureLookup: function(eventContext){
			this.application.showBusy();
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			var selectedRecord = CommonHandler._getAdditionalResource(eventContext,"failureListResource").getCurrentRecord();
			var fc = selectedRecord.get("failurecode");
			var failurelist = selectedRecord.get("failurelist");
			var self=this;
			Logger.trace("failure lookup fc: " + fc + " failureList: "  + failurelist);
			
			if (wo.get("failurecode")==null){
				wo.set('failurecode',fc);	
				wo.set("failureCodeDesc", selectedRecord.get("description"));
			} else {
				Logger.trace("creating new failure report");
				var newRecord = wo.failureReportlist.createNewRecord();				
				newRecord.set("failurecode", fc);
				newRecord.set("linenum",failurelist );
				newRecord.set("type", selectedRecord.get("type"));				
				newRecord.set("failureDesc", selectedRecord.get("description"));
			}
			
			Logger.trace("setting woFCLevelMonitor.previousLinenum: " + wo.FCLevelMonitor.nextLinenum);
			wo.FCLevelMonitor.previousLinenum = wo.FCLevelMonitor.nextLinenum;
			Logger.trace("setting woFCLevelMonitor.nextLinenum: " + failurelist);
			wo.FCLevelMonitor.nextLinenum = failurelist;
			wo.backtrack.push(failurelist);
			
			if (wo.get("failurecode")==null){
				eventContext.ui.getCurrentViewControl().refresh();
				self.application.hideBusy();
			} else {
				var promise = this.nextLevelExists(eventContext,wo.FCLevelMonitor.nextLinenum);
				promise.then(function(nextleveldoesexist){
					if (nextleveldoesexist.count()>0){
						Logger.trace("Next level does exist");
						self.application.hideBusy();
						eventContext.ui.getCurrentViewControl().refreshLists();
					}else if (!wo.isNew()){
						Logger.trace("Next level doesn't exist");
						eventContext.application.showBusy();
						ModelService.save(woSet).then(function(){
							wo.closePriorityChangeTransaction();
							eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
						}).always(function () {
							self.application.hideBusy();
						});		
					} else {
						wo.closePriorityChangeTransaction();
						self.application.hideBusy();
						Logger.trace("Next level doesn't exist");
						eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
					}
				}).otherwise(function(error){
					self.application.hideBusy();
					Logger.trace("Error received finding next level: " + error);
				});				
				
			}

		},

		hideShowSelectLink : function(eventContext){
			var wo = this._getCurrentWO(eventContext);
			var promise = this.nextLevelExists(eventContext, wo.FCLevelMonitor.nextLinenum);
			var self = this;

			promise.then(function(failureListSet){
				
				Logger.trace("****** Hide Show Link: "+ failureListSet.count());
				Logger.trace("****** Failure Report List: "+ failureListSet.count());

				if (failureListSet.count() > 0){
					var type;
					if (failureListSet.data[0].type){
						type = failureListSet.data[0].type;
					} else {
						type = self._failureClassMessage();
					}	
					
					//TODO make sure it works with message bundle
					eventContext.setLabel( MessageService.createResolvedMessage('selectFailureClassLabel', [type])) ;
					eventContext.setDisplay(true);	
				} else {
					ModelService.all("failureListResource", null, 5, false).then(function(failureList){
						if (failureList.getRecordAt(0)==null){
							domClass.remove(eventContext.baseWidget.domNode,'textlink');
							domClass.add(eventContext.baseWidget.domNode,'failureCodeNoData');
							eventContext.setLabel(MessageService.createStaticMessage('nolookupdata').getMessage()) ;
							eventContext.setDisplay(true);							
						} else {
							domClass.remove(eventContext.baseWidget.domNode,'textlink');
							eventContext.setDisplay(false);
						}
					});			
				}
			}).otherwise(function(e){
				throw e;
			});

		},
		
		
		nextLevelExists: function(eventContext, linenum){
			var filter = {};
			var isExactMatch = true;
			var self=this;
			
			if (linenum == null){
				filter = {'filterparent': 'nullvalue'};
			} else {
				filter = {'filterparent': linenum};
			}

			if (filter.filterparent== 'nullvalue'){
				isExactMatch = false;
			}

			var deferred =  new Deferred();
			
			ModelService.filtered('failureListResource', null, filter, 100000, false, isExactMatch).then(function (dataSet) {
				Logger.trace("Replacing failureListResource dataset with: " + dataSet);
				dataSet.resourceID = 'failureListResource';
				eventContext.application.addResource(dataSet);
				deferred.resolve(dataSet);
			}).otherwise(function(e){
				self.failureCodeIsMissingFromDownloadedData = true;
				deferred.reject(new PlatformRuntimeWarning('failureClassData'));
			});
			
			return deferred.promise;
		}, 
		
		_getCurrentWO :  function(eventContext){
			return currWO = eventContext.application.getResource('workOrder').getCurrentRecord();
		},
		
		_getFirstLevelLineNum :  function(eventContext, fc){
			var filter;
			var self=this;
			filter={'filterparent':'nullvalue','failurecode':fc};

			var deferred =  new Deferred();
			ModelService.filtered('failureListResource', null, filter, 100000, false, true).then(function (dataSet) {
				dataSet.resourceID = 'failureListResource';
				eventContext.application.addResource(dataSet);
				deferred.resolve(dataSet); 
			}).otherwise(function(e){
				self.failureCodeIsMissingFromDownloadedData = true;
				deferred.reject(new PlatformRuntimeWarning('failureClassData'));
			});
			return deferred.promise;
		},
		
		/** Either returns the linenum if it's currently set or a promise **/
		_getCurrentFCLineNum :  function(eventContext, wo){
			var frl = wo.failureReportlist.data;
			var failurecodeobject = null;
			
			if (frl.length>0){
				//get current failurecode
				failurecodeobject = frl[frl.length - 1];
				return failurecodeobject.linenum; 
			} else {
				var deferred =  new Deferred();
				var linenum = null;
				if (wo.failurecode){
					this._getFirstLevelLineNum(eventContext,wo.failurecode).then(function(failurelistrecord){
						
						//Preserve old (suspect broken) code
						if (failurelistrecord.linenum)
							linenum=failurelistrecord.linenum;
						else if (failurelistrecord && failurelistrecord.data && failurelistrecord.data.length > 0)
							linenum = failurelistrecord.data[0].failurelist;
						deferred.resolve(linenum);
					}).otherwise(function(error) {
						//Need to reject if there was an error
						deferred.reject(linenum);
						Logger.errorJSON("error received from lookup", error);
					});
					return deferred;
				} else {
					return null;
				}
			}			
		},
		
		_failureClassMessage : function(){
			return MessageService.createStaticMessage('failureClass').getMessage();
		},
	
		resolveNextFailureType : function(eventContext) {
			var failureListSet = eventContext.application.getResource('failureListResource');
			var type;
			
			if (failureListSet.data[0].type){
				type = failureListSet.data[0].type;
			} else {
				type = this._failureClassMessage();
			}	
			return [type];
		
		},	

		//controls the visibility of the 1st Level Failure Class
		hideShowFailureClass: function(eventContext){
			var wo = this._getCurrentWO(eventContext);
					
			if (wo.get("failurecode")) {
				eventContext.setDisplay(true);
			} else {
				eventContext.setDisplay(false);
			}
		},
		
		//controls the visibility of the nth Level Failure List Hierarchy
		hideShowFailureList: function(eventContext){
			var wo = this._getCurrentWO(eventContext);
			var failureList = wo.get("failureReportlist");
			
			if (failureList) {
				if (failureList.data.length>0){
					eventContext.setDisplay(true);
				} else {
					eventContext.setDisplay(false);
				}
			}
		},
		
		commitFailureCode : function(eventContext){
			eventContext.application.showBusy();			
			var currWOSet = eventContext.application.getResource('workOrder');
			var wo = currWOSet.getCurrentRecord();
			var lineNumResponse = this._getCurrentFCLineNum(eventContext, wo);
			//Need to handle both the async and sync responses
			when (lineNumResponse, function(linenum) {
				wo.FCLevelMonitor.originalLinenum = linenum;
				wo.closePriorityChangeTransaction();
				if (!wo.isNew()) {
					ModelService.save(currWOSet).then(function(){
						eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
					});	
				} else {
					eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
				}
			});
		},
		
		cancelFailureCode : function(eventContext){
			//rollback changes
			var wo = this._getCurrentWO(eventContext);
			var failureListSet = wo.failureReportlist;
			
			for(var i=failureListSet.data.length-1;i>=0;i--){
				var failureRecord = failureListSet.data[i];
				if(wo.isNew() && failureRecord.linenum == wo.FCLevelMonitor.originalLinenum)
					break;

				if (failureRecord._isNew)
					failureRecord.deleteLocal();
			}

			//If I started with no drill in, clear it when canceling, else reset it
			if (!wo.FCLevelMonitor.originalLinenum){
				wo.set("failurecode", null);
				wo.FCLevelMonitor.previousLinenum = null;
				wo.FCLevelMonitor.nextLinenum = null;
			} else {
				wo.FCLevelMonitor.nextLinenum = wo.FCLevelMonitor.originalLinenum;
			}
			
			this.nextLevelExists(eventContext,wo.FCLevelMonitor.nextLinenum);
			wo.closePriorityChangeTransaction();
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		
		handleFailureLookupBackButtonClick : function(eventContext){
			this.application.showBusy();
			var self=this;
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var failureReport = wo.failureReportlist;
			
			if (wo.backtrack.length==0){
				eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
				wo.FCLevelMonitor.nextLinenum = wo.FCLevelMonitor.originalLinenum;	
				this.application.hideBusy();
				return;
			}
			
			wo.backtrack.pop();
			var failurecodeid;
			if (wo.backtrack.length==0){
				failurecodeid = wo.FCLevelMonitor.originalLinenum;
			} else {
				failurecodeid = wo.backtrack[wo.backtrack.length-1]; 
			}
			
			wo.FCLevelMonitor.nextLinenum = failurecodeid;		
			
			if (failureReport.count()==0){
				wo.setNullValue('failurecode');
			} else {
				var recordToBeDeleted = failureReport.data[failureReport.data.length - 1];
				if (recordToBeDeleted && recordToBeDeleted._isNew){
					recordToBeDeleted.deleteLocal();
				}
			}
			
			var handler = eventContext.application['application.handlers.FailureCodeHandler'];
			handler.nextLevelExists(eventContext, failurecodeid).then (function(data){
				eventContext.ui.getCurrentViewControl().refresh();
			}).always(function (data) {
				self.application.hideBusy();
			});
			
		},
				
		deleteFailureCode : function(eventContext){
			eventContext.application.showBusy();
			var self = this;
			var woSet = eventContext.application.getResource('workOrder');
			var failurecode = eventContext.getCurrentRecord();
			var currentID = failurecode.get('_id');
			var wo = woSet.getCurrentRecord();
			
			//check resourcename to see if we are deleting from the failureclass level
			if(currentID && eventContext.getResource().getResourceName()!='failureClassResource'){
				if(wo.wasCommittedToServer() ||!wo.reOpenTransactionWithAttribute('failureReportlist')){
					wo.openPriorityChangeTransaction();
				}
				arrayUtil.forEach(failurecode.getOwner().data, function(failureRecord) {
					if (failureRecord.get('_id')>=currentID){
						failureRecord.deleteChildOnServer();
					}
				});
			} else {
				if(wo.wasCommittedToServer() ||!wo.reOpenTransactionWithAttribute('failurecode')){
					wo.openPriorityChangeTransaction();
				}
				woSet.getCurrentRecord().setNullValue('failurecode');
				arrayUtil.forEach(woSet.getCurrentRecord().failureReportlist.data, function(failureRecord) {
					failureRecord.deleteChildOnServer();
				});
			}

			var promise = self.populateCurrentFCLevel(eventContext);
			promise.then(function() {
				woSet.getCurrentRecord().closePriorityChangeTransaction();
				if (!woSet.getCurrentRecord().isNew()) {
					ModelService.save(woSet).then(function(){
						eventContext.ui.getCurrentViewControl().refresh();
					});	
				} else {
					eventContext.ui.getCurrentViewControl().refresh();
				}
			});
		},
		
		openTransaction : function(eventContext){
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			var failureReport = wo['failureReportlist'];
			var useFailureReport = (failureReport && failureReport.data && failureReport.data.length > 0);
			if(wo.wasCommittedToServer() ||!wo.reOpenTransactionWithAttribute((useFailureReport?'failureReportlist':'failurecode'), true)){
			wo.openPriorityChangeTransaction();
		}
		}
		
	});
});
