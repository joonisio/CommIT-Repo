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

define("application/business/ActualMaterialObject", 
		["application/business/FieldUtil",
		 "application/business/WorkOrderStatusHandler",
		 "platform/translation/SynonymDomain"], 
		 function(fieldUtil, WorkOrderStatusHandler, SynonymDomain) {
	return {
/**@memberOf application.business.ActualMaterialObject */
		onInitialize : function(actualMaterial) {
			//Composed field to present itemnum and description in one place
			fieldUtil.initCompositeField("itemnum", "itemdesc", "itemanddescription", actualMaterial);
		},
		onAdd: function(actualMaterial) {
			actualMaterial.set("dontDiscard", false);
		},
		beforeSave : function(actualMaterial) {
			
		},
		
		setDefaultValues : function(actualMaterial, additionalLineType) {
			actualMaterial.set('quantity', 1.0);			
			actualMaterial.set('linetype', SynonymDomain.resolveToDefaultExternal(additionalLineType, 'ITEM'));
		},
		
		canAddActualMaterial: function(workOrder){
			//Condition used to allow user to create a new Actual Material transaction
			//Get internal value from the synonym domain
			var currentWOStatus= WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"))
			
			return currentWOStatus== "APPR" || currentWOStatus== "INPRG" || currentWOStatus== "COMP" || currentWOStatus== "WSCH" || 
					currentWOStatus== "WMATL";
		}
	}
});
