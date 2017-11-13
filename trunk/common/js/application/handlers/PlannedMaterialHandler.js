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

define("application/handlers/PlannedMaterialHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants" ],
function(declare, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants) {
	return declare( ApplicationHandlerBase, {
	
		//Initialize Planned Material Detail view
/**@memberOf application.handlers.PlannedMaterialHandler */
		initPlannedMaterialDetailView: function(eventContext){
			//TODO: Populate all fields.  All should be read only
			
			//eventContext.setMyResourceObject(eventContext.resourceObject);
		},
		
		
	

		

		
	});
});
