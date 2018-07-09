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

define("application/business/WoStatusObject", 
		[], function() {
	return {
/**@memberOf application.business.WoStatusObject */
		onInitialize : function(statusChange) {

		},
		onAdd: function(statusChange) {			
			statusChange.set("dontDiscard", false);
			statusChange.setNullValue("status");
			statusChange.setNullValue("statusdesc")
			statusChange.setNullValue("memo");
		},
		beforeSave : function(statusChange) {
			
		},
		setDefaultValues : function(statusChange, currentDateTime) {
			statusChange.setDateValue("changedate", currentDateTime);
		}
	}
});
