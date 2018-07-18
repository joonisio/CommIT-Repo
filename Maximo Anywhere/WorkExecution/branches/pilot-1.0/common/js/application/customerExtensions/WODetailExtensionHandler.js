define("application/customerExtensions/WODetailExtensionHandler", 
		[ "dojo/_base/declare", 
		  "dojo/_base/lang", 
		  "platform/handlers/_ApplicationHandlerBase",
		  "platform/model/ModelService",
		  "application/handlers/CommonHandler"], 
function(declare, lang, ApplicationHandlerBase, ModelService, CommonHandler) {
	
	return declare( [ApplicationHandlerBase], {
		modelservice:null, //used to handle multilevel modelservice
		
		filterChildWO: function(eventContext) {
			console.log("function: filterChildWO");
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var wonum = currentRecord.get("wonum");
			var siteid = currentRecord.get("siteid");
			
			//this.modelservice = new ModelService();
			var self = this;
			
			ModelService.filtered('workOrder',null,
                [{parentWonum:wonum, siteid:siteid, istask:false}],
                1000,
                false,
                true).then(function(childset) {
                	// do something
                	console.log(childset);
                	
                	for (var i=0; i<childset.data.length; i++){
                		console.log(childset.data[i].wonum);
                		var wonum = childset.data[i].wonum;
                		ModelService.filtered('workOrder',null,
                                [{parentWonum:wonum, istask:false}],
                                1000,
                                false,
                                true).then(function (childset) {
                                	//console.log(childset.data[i].wonum);
                                });
                	}
                	
                });			
		}
	});
});
