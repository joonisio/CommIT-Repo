/**
 * Custom Handler for work sqa status
 */

define("application/business/SqaStatusHandler", 
["dojo/_base/declare",
 "platform/model/state/MultiLabelStateMachineSupport",
 "platform/model/ModelService",
 "platform/logging/Logger"
 ], function(declare, MultiLabelStateMachineSupport, ModelService, Logger) {
	// TODO validate if user is allowed to perform all the status changes between the 'from' and 'to'
	// FIXME site/org support?
	var thisClass = declare([MultiLabelStateMachineSupport], {		
/**@memberOf application.business.SqaStatusHandler */
		init: function(modelDataSet){
			var settings = {};
			settings.resourceName = "sqa";
			settings.stateToAlias = {};
			settings.configuration = {
				"DRAFT": ["DRAFT", "INPRG", "ENTRY", "INACTIVE"],	
				"INPRG": ["INPRG", "COMP", "INACTIVE"],
				"ENTRY": ["ENTRY", "SUBMITTED"],
				"SUBMITTED": ["SUBMITTED", "INPRG"],
				"COMP":  ["COMP", "INACTIVE"],
				"INACTIVE":  ["INACTIVE", "DRAFT"],	
				"CAN":   ["CAN"]
			};
			settings.labelStateConfiguration = MultiLabelStateMachineSupport.fromModelDataSetToLabelStateConfiguration(
					modelDataSet, "value", "maxvalue", "description");
			this.setupMachine(settings);						
		}
	});
	var instance = null;
	var SqaStatusHandler = {};
	SqaStatusHandler.getInstance = function(){		
		if(!instance){
			instance = new thisClass({});
			/* this is cached data */
			ModelService.all("plusgauditstatus").then(function(dataSet){
				instance.init(dataSet);
			});					
		}
		return instance;
	}	
	return SqaStatusHandler;
});