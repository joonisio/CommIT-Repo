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

define("application/business/PlannedToolObject", 
		["application/business/FieldUtil"], function(fieldUtil) {
	return {
/**@memberOf application.business.PlannedToolObject */
		onInitialize : function(plannedTool) {
			fieldUtil.initCompositeField("tool", "tooldesc", "toolanddescription", plannedTool);
		},
		onAdd: function(plannedTool) {
			
		},
		beforeSave : function(plannedTool) {
			
		}
	}
});
