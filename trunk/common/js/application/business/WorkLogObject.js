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

define("application/business/WorkLogObject", 
		["platform/model/ModelService",
		 "platform/util/DateTimeUtil",
		 "platform/logging/Logger",
		 "application/business/WorkOrderStatusHandler",
		 "platform/translation/SynonymDomain"], 
function(ModelService, DateTimeUtil, Logger, WorkOrderStatusHandler, SynonymDomain) {
    return {
/**@memberOf application.business.WorkLogObject */
      onInitialize : function(WorkLogObject) {
         Logger.trace("initializing WorkLogObject: " + WorkLogObject);
      },
      onAdd : function(WorkLogObject) {
         Logger.trace("adding WorkLogObject: " + WorkLogObject);
      },
      beforeSave : function(WorkLogObject) {
         Logger.trace("Validating WorkLogObject: " + WorkLogObject);
      },
      /*descriptionChanged : function(modelData, newValue, previousValue) {
        
      },
     approve: function(modelData){
        
      }*/
      
      setDefaultValues : function(workLog, myUser, domainlogtype, currentDateTime) {
			
			workLog.setDateValue("createdate", currentDateTime);
			workLog.set("logtype", SynonymDomain.resolveToDefaultExternal(domainlogtype, 'CLIENTNOTE'));
			if(myUser){
				workLog.set("createby", myUser);
			}
			workLog.set("clientviewable", false);
		},
		
		canAddWorkLog : function(workOrder) {
			var currentWOStatus= WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			return currentWOStatus != "CAN"; 			
		}      
   }
});
