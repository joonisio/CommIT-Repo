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

define("application/handlers/WorkLogHandler", 
	   [ "dojo/_base/declare",
	     "platform/format/FormatterService",
	     "platform/model/ModelService",
	     "platform/auth/UserManager",
	     "application/handlers/CommonHandler",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/business/WorkLogObject",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants" ],
function(declare, formatterService, ModelService, UserManager, CommonHandler, ApplicationHandlerBase, WorkLogObject, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants) {
	return declare( ApplicationHandlerBase, {
	
/**@memberOf application.handlers.WorkLogHandler */
		resolveWorkLogCreateDate : function(control) {
			var rawDate = this.application.getResource('workLogResource').getCurrentRecord().get('createdate');
			var userLocale = this.application.getUserLocale();
		
			return [ formatterService.toDisplayableValue(rawDate, "datetime", userLocale) ];
		},
		
		//Initialize Work Detail view
		initWorkLogDetailView: function(eventContext){
			//Need to initialize in order to use resolvermethod
		},
		
		initNewWorkLogEntry: function(eventContext){
			var view = eventContext.viewControl;
			var workLogSet = null;
			if(!view.isOverrideEditMode()){
				workLogSet = CommonHandler._getAdditionalResource(this,"workOrder.workloglist");
				var newWorkLog = workLogSet.createNewRecord();
				var currentDateTime = this.application.getCurrentDateTime();
				var myUser = UserManager.getCurrentUser();
				var domainlogtype = CommonHandler._getAdditionalResource(this,"domainlogtype");
				WorkLogObject.setDefaultValues(newWorkLog, myUser, domainlogtype, currentDateTime);
			}
			if (workLogSet){
				eventContext.setMyResourceObject(workLogSet);
			}
			
		},
		
		enableAddWorkLogButton : function(eventContext) {
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if(!workOrder || workOrder.isErrored() || !WorkLogObject.canAddWorkLog(workOrder) || workOrder.status == 'CLOSE') {
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		
		commitWorkLogEntryView: function(eventContext){
		
			if(!eventContext.viewControl.validate()){
				return;
			}

			this._saveTransaction();
		},
		
		validateLogType: function(eventContext){
			var workLog = CommonHandler._getAdditionalResource(eventContext,'workOrder.workloglist').getCurrentRecord();
			var type = workLog.getPendingOrOriginalValue('logtype');
			
			if(!type) return;
			var logTypeSet = CommonHandler._getAdditionalResource(eventContext,'domainlogtype');
			this._clearFilterForResource(logTypeSet);
			var isValid = logTypeSet.find('value == $1', type);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidLogType');
			}
		},	
		
		_clearFilterForResource : function(resource) {
			if(resource.isFiltered()) {
				resource.clearFilterAndSort();
			}
		},
		
		_saveTransaction: function(){
			try{
     			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
     			var workOrder = workOrderSet.getCurrentRecord();
				if (!workOrder.isNew()) {
					ModelService.save(workOrderSet);
				}			
				this.ui.hideCurrentView();
			}catch(e){
				throw e;
			}
		},
		
		discardNewWorkLogEntry: function(eventContext){
			 this.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		handleBackButtonClick: function(eventContext){
			var view = eventContext.viewControl;
			if(!view.isOverrideEditMode()){
				var workLog=eventContext.getCurrentRecord();
				workLog.deleteLocal();
				return;
			}
			this.commitWorkLogEntryView(eventContext);
		},
		
	});
});
