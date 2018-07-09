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

define("application/business/PlannedMaterialObject", 
		["application/business/FieldUtil"], function(fieldUtil) {
	return {
/**@memberOf application.business.PlannedMaterialObject */
		onInitialize : function(plannedMaterial) {
			fieldUtil.initCompositeField("item", "itemdesc", "itemanddescription", plannedMaterial);			
		},
		onAdd: function(plannedMaterial) {
			
		},
		beforeSave : function(plannedMaterial) {
			
		}
	}
});
