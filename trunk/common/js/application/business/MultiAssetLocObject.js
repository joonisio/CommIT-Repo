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

define("application/business/MultiAssetLocObject", 
		["application/business/FieldUtil"], function(fieldUtil) {
	return {
/**@memberOf application.business.MultiAssetLocObject */
		onInitialize : function(multiassetloc) {
			fieldUtil.initCompositeField("assetnum", "assetdesc", "assetnumanddescription", multiassetloc);
			fieldUtil.initCompositeField("location", "locationdesc", "locationanddescription", multiassetloc);		
		},
		onAdd: function(multiassetloc) {
			
		},
		beforeSave : function(multiassetloc) {
			
		}
	}
});
