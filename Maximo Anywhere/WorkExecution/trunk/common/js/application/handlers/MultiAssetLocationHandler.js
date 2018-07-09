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

define("application/handlers/MultiAssetLocationHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "platform/model/ModelService",
	     "application/handlers/CommonHandler"],
function(declare, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, ModelService, CommonHandler) {
	return declare( ApplicationHandlerBase, {
	
		//Initialize Multi Asset Location Entry view
/**@memberOf application.handlers.MultiAssetLocationHandler */
		initMultiAssetLocationEntryView: function(eventContext){
			//TODO: 
			
			//eventContext.setMyResourceObject(eventContext.resourceObject);
		},
		
		//Commit new Multi Asset Location Entry (handle OK button clicked)
		commitMultiAssetLocationEntryView: function(eventContext){
			//TODO: save values entered
			
			//eventContext.setMyResourceObject(eventContext.resourceObject);
		},
		
		//This function hides the add asset or location button for workorders in the errored state
		enableAddAssetButton : function(eventContext) {					
			var workOrder = eventContext.getCurrentRecord();			
			if (workOrder.isErrored()) {			
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		
		//call a save when user clicks back button
		handleBackButton: function(eventContext){
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");		
			ModelService.save(workOrderSet);
		}
		
	});
});
