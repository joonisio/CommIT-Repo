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
define("application/handlers/ClassifyWorkOrderHandler", 
	   [ "dojo/_base/array",
	     "dojo/_base/declare",
	     "dojo/Deferred",
	     "dojo/promise/all",
	     "platform/logging/Logger",
	     "platform/model/ModelService",
	     "application/handlers/CommonHandler",
	     "platform/store/_ResourceMetadataContext",
	     "platform/util/PlatformConstants",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/business/WorkOrderObject",
	     "platform/handlers/_ApplicationHandlerBase"
	     ],
function(arrayUtil, declare, Deferred, all, Logger, ModelService, CommonHandler, ResourceMetadata, PlatformConstants, PlatformRuntimeException,
		PlatformRuntimeWarning, WorkOrderObject, ApplicationHandlerBase) {
	
	return declare( [ApplicationHandlerBase], {		

		pageStack : [],
		currentClass : null,
		topPage: false,

/**@memberOf application.handlers.ClassifyWorkOrderHandler */
		openTop : function (eventContext) {
			this.topPage = true;
			eventContext.application.showBusy();
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			wo.set('classificationdesc', null);
			wo.set('classificationpath', null);
			this.hideIfNull(eventContext);
			this.pageStack = [];
			this.currentClass = null;
			var csList = CommonHandler._getAdditionalResource(eventContext,"classstructure");
			csList.filter("1==0");
		},			
		
		renderTop : function (eventContext) {
			if (this.topPage) {
				var filter = {'filterparent': 'nullvalue'};		
				this._refreshLevel(eventContext, filter);
			}
		},			
		
		getMyViewControl : function (eventContext) {
			
			if (eventContext._controlType=='View') {				
				return eventContext;
			}
			else {
				return eventContext.ui.getCurrentViewControl(); 
			}
		},
		
		openChildren : function(eventContext) {
			eventContext.application.showBusy();
			this.topPage = false;
			var filter="";
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			var selectedRecord = CommonHandler._getAdditionalResource(eventContext,"classstructure").getCurrentRecord();
			if (selectedRecord) {
				this.currentClass = selectedRecord.get('classstructureid');
				wo.set('classificationdesc', selectedRecord.get('description'));
				wo.set('classificationpath', selectedRecord.get('hierarchypath'));				
				if (selectedRecord.haschildren) {
					filter = {'filterparent' : selectedRecord.classstructureid};
					this._refreshLevel(eventContext, filter);
				}
				else {
					this.saveClassify(eventContext);
					return;					
				}
			}
		},
		
		hideIfNull : function(eventContext){
			
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if ((this.topPage) || (workOrder.get('classificationpath') == null || workOrder.get('classificationpath') == ""))
			{
				eventContext.setDisplay(false);
			}
			else {
				eventContext.setDisplay(true);
			}
			
		},
				
		_refreshLevel: function(eventContext, filter){
			var self = this;
			this._pushPage(eventContext, filter);
			var promise = this._fetchLevel(eventContext,filter);
			promise.then(function(newrecords){
				if (newrecords.count()>0){
					self.getMyViewControl(eventContext).refreshLists();
					self.getMyViewControl(eventContext).refresh();
					self.getMyViewControl(eventContext).baseWidget.scrollTo(0,0);
				}else {
					// the haschildren flag was set but no recs, just stop here and save
					self.saveClassify(eventContext);	
				}
			}).otherwise(function(error){
					eventContext.application.hideBusy();
					Logger.trace("Error received finding next level: " + error);
			});				
										
		},
			
		_fetchLevel: function(eventContext, filter){

			Logger.trace("Fetching classstructure level using filter : " + filter);
			var deferred =  new Deferred();			
			
			ModelService.filtered('classstructure', null, filter, 1000, false, true).then(function (dataSet) {
				dataSet.resourceID = 'classstructure';
				dataSet.sort('classificationid');
				eventContext.application.addResource(dataSet);
				deferred.resolve(dataSet);
			}).otherwise(function(e){
				deferred.reject(new PlatformRuntimeWarning('error fetching classstructure info'));
			});
			
			return deferred.promise;
		}, 
		
		_pushPage : function (eventContext, filter) {
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var page = { filter : filter,
						 classstructureid : this.currentClass, 
						 classificationdesc : workOrder.get('classificationdesc'),
						 classificationpath : workOrder.get('classificationpath')
						};
			this.pageStack.push(page);
		},		
		
		handleClassifyBack : function(eventContext) {
			//note, for this event 'this' is the view, not this handler
			var thisHandler = this.application['application.handlers.ClassifyWorkOrderHandler'];
			if (thisHandler.pageStack.length > 1) {
				// drop the current one, and grab the parent and refresh
				thisHandler.pageStack.pop();
				var curPage = thisHandler.pageStack.pop();
				var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
				thisHandler.currentClass = curPage.classstructureid;
				wo.set('classificationdesc', curPage.classificationdesc);
				wo.set('classificationpath', curPage.classificationpath);
				eventContext.application.showBusy();
				thisHandler._refreshLevel(eventContext, curPage.filter);				
			}
			else {
				thisHandler.cancelClassify(eventContext);				
			}
		},
				
		cancelClassify: function(eventContext) {
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			WorkOrderObject.refreshClassDescription(wo).then(function(){
				eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);	
			}); 			
		},
		
		saveClassify: function(eventContext) {
			Logger.trace("Saving off the current classification");
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			wo.set('classstructureid', this.currentClass);
			WorkOrderObject.updateSpecifications(wo).then(function(){
				eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
			}).otherwise(function(e){
				eventContext.application.hideBusy();
			}); 			
		},
		
		clearClassify: function(eventContext) {
			var self = this;
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			workOrder.set('classstructureid',null);
			workOrder.set('classificationpath', null);
			workOrder.set('classificationdesc', null);			
			workOrder.getModelDataSet("workOrderSpec", true).
		    then(function(workOrderSpecs){
		    	workOrderSpecs.deleteLocalAll();
		    	self.handleClassifyBack(eventContext.parentControl);
		    });
		},
		
		hideClassify: function(eventContext){
			if (!(this.pageStack.length > 1)) 
			{
				eventContext.setDisplay(false);
				eventContext.setVisibility(false);
			}			
		},
		
		hideClear: function(eventContext){
			if (this.pageStack.length > 1) 
			{
				eventContext.setDisplay(false);
				eventContext.setVisibility(false);			
			}
		},
		
		clearClassification : function(eventContext){
			Logger.trace("Clear classification header");
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			workOrder.set('classificationpath', '');
			workOrder.set('classificationdesc', '');
		}
				
	});
});
