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

define("application/business/TaskObject", 
		["application/business/FieldUtil",
		 "application/business/WorkOrderStatusHandler"], 
		 function(fieldUtil, WorkOrderStatusHandler) {
	return {
/**@memberOf application.business.TaskObject */
		onInitialize : function(task) {
			fieldUtil.initCompositeField("assetnum", "assetdescription", "assetnumanddescription", task);
			fieldUtil.initCompositeField("location", "locationdescription", "locationanddescription", task);
			
			task.set("statusdesc", WorkOrderStatusHandler.getInstance().toDescription(task.get("status")));
		},
		onAdd: function(task) {
			
		},
		beforeSave : function(task) {
			
		},
		statusChanged : function(task, newValue, previousValue) {
	         task.set("statusdesc", WorkOrderStatusHandler.getInstance().toDescription(newValue));
		}
	}
});
