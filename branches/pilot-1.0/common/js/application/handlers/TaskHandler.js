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

define("application/handlers/TaskHandler", 
	   [ "dojo/_base/declare",
	     "platform/format/FormatterService",
	     "platform/model/ModelService",
	     "platform/auth/UserManager",
	     "application/handlers/CommonHandler",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "platform/translation/SynonymDomain",
	     "platform/model/state/MultiLabelStateMachineSupport",
	     "application/business/WorkOrderStatusHandler"],
function(declare, formatterService, ModelService, UserManager, CommonHandler, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, SynonymDomain, MultiLabelStateMachineSupport, WorkOrderStatusHandler) {
	return declare( ApplicationHandlerBase, {
	
/**@memberOf application.handlers.TaskHandler */
		validateTask : function(eventContext){ 

			var curr = eventContext.getCurrentRecord();
			var actualTaskId = curr.getPendingOrOriginalValue('actualstaskid');
			
			// We can only validate if TASK ID is specified
			if(!actualTaskId) return;
			var taskSet = CommonHandler._getAdditionalResource(eventContext,'workOrder.tasklist');
	
			var keys = new Array();
	
			//The task lookup should not list task with status: CAN, WAPPR, CLOSE
            var appr = WorkOrderStatusHandler.getInstance().toExternalLabels("APPR");
            for (index = 0; index < appr.length; ++index) {
                keys[index] = appr[index];
            }
            
            var inprg = WorkOrderStatusHandler.getInstance().toExternalLabels("INPRG");
            for (index = 0; index < inprg.length; ++index) {
                keys.push(inprg[index]);
            }
            
            var wmatl = WorkOrderStatusHandler.getInstance().toExternalLabels("WMATL");
            for (index = 0; index < wmatl.length; ++index) {
            	keys.push(wmatl[index]);
            }
 
            var wsch = WorkOrderStatusHandler.getInstance().toExternalLabels("WSCH");            
            for (index = 0; index < wsch.length; ++index) {
            	keys.push(wsch[index]);
            }
            
            var histedit = WorkOrderStatusHandler.getInstance().toExternalLabels("HISTEDIT");            
            for (index = 0; index < histedit.length; ++index) {
            	keys.push(histedit[index]);
            }
            
            var comp = WorkOrderStatusHandler.getInstance().toExternalLabels("COMP");            
            for (index = 0; index < comp.length; ++index) {
            	keys.push(comp[index]);
            }

            var args = {};			
            for (index = 0; index < keys.length; ++index) {
            	args[keys[index]] = true;
            }
            
			var isValid = taskSet.find('taskid == $1 && $2[status]', actualTaskId, args);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidTask');
			}	
		
	    },
	    
	    
	    filterValidTasks: function(eventContext){
			
			var taskSet = CommonHandler._getAdditionalResource(eventContext,'workOrder.tasklist');
			CommonHandler._clearFilterForResource(eventContext,taskSet);

			var keys = new Array();
			var index;
            
            var appr = WorkOrderStatusHandler.getInstance().toExternalLabels("APPR");
            for (index = 0; index < appr.length; ++index) {
                keys[index] = "status == \"" + appr[index] + "\"";
            }
            
            var inprg = WorkOrderStatusHandler.getInstance().toExternalLabels("INPRG");
            for (index = 0; index < inprg.length; ++index) {
                keys.push("status == \"" + inprg[index] + "\"");
            }
            
            var wmatl = WorkOrderStatusHandler.getInstance().toExternalLabels("WMATL");
            for (index = 0; index < wmatl.length; ++index) {
            	keys.push("status == \"" + wmatl[index] + "\"");
            }
 
            var wsch = WorkOrderStatusHandler.getInstance().toExternalLabels("WSCH");            
            for (index = 0; index < wsch.length; ++index) {
            	keys.push("status == \"" + wsch[index] + "\"");
            }
            
            var histedit = WorkOrderStatusHandler.getInstance().toExternalLabels("HISTEDIT");            
            for (index = 0; index < histedit.length; ++index) {
            	keys.push("status == \"" + histedit[index] + "\"");
            }
            
            var comp = WorkOrderStatusHandler.getInstance().toExternalLabels("COMP");            
            for (index = 0; index < comp.length; ++index) {
            	keys.push("status == \"" + comp[index] + "\"");
            }
            
            var args = keys.join(' || ');
            taskSet.filter(args);
            
			return taskSet;
			
		},
		
	});
});
