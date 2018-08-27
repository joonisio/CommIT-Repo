define("application/customerExtensions/WODetailExtensionHandler", 
		[ "dojo/_base/declare", 
		  "dojo/_base/lang", 
		  "platform/handlers/_ApplicationHandlerBase",
		  "platform/model/ModelService",
		  "application/handlers/CommonHandler"], 
function(declare, lang, ApplicationHandlerBase, ModelService, CommonHandler) {
	
	return declare( [ApplicationHandlerBase], {
		
		filterChildWO: function(eventContext) {
			console.log("function: filterChildWO");

			var currentRecord = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var wonum = currentRecord.get("wonum");
			var siteid = currentRecord.get("siteid");
			
			ModelService.filtered('childWorkOrder',null,
                [{parentWonum:wonum, siteid:siteid, istask:false}],
                1000,
                false,
                true).then(function(childset) {
                	// do something
                	var childWO = childset;
                	for (var i=0; i<childset.data.length; i++){
                		var concat;
                		var wonum = childset.data[i].wonum;
                		ModelService.filtered('childWorkOrder',null,
                                [{parentWonum:wonum, istask:false}],
                                1000,
                                false,
                                true).then(function (childset) {
                                	concat = childWO.data.concat(childset.data);
                                	childWO.data = concat;
                                	childWO.recordsCount = childWO.data.length;
                                	childWO.data.sort(function(a, b){return a.wosequence - b.wosequence});
                                });
                	}
                	eventContext.application.addResource(childWO);
                	eventContext.application.showBusy();
                	setTimeout(function afterTwoSeconds() {
                		  console.log('show child list view');
                		  eventContext.ui.show('WorkExecution.ChildrenWO');
                		  console.log(childWO.recordsCount);
                		}, 3000);
                	
                });			
		},
		
		setWorkOrder: function(eventContext){
			var currWO = eventContext.application.getResource("childWorkOrder").getCurrentRecord();
			var wonum = currWO.get('wonum');
			var subvertical = currWO.get('tnbsubvertical');
			
			if (subvertical === "SCADA"){
				console.log(subvertical);
				ModelService.filtered('workOrder',null,
		                [{wonum:wonum}],
		                1,
		                false,
		                true).then(function (woset){
		                	eventContext.application.addResource(woset);
		                });				
			}
		},
		
		setParentWorkOrder: function(eventContext){
			var currWO = eventContext.application.getResource("childWorkOrder").getCurrentRecord();
			var wonum = currWO.get('parentWonum');
			var subvertical = currWO.get('tnbsubvertical');
			
			if (subvertical === "SCADA") {
				console.log(subvertical);
				ModelService.filtered('workOrder',null,
		                [{wonum:wonum}],
		                1,
		                false,
		                true).then(function (woset){
		                	eventContext.application.addResource(woset);
		                });					
			}
		},
		
		myAssignedWork: function(eventContext){
			eventContext.application.showBusy();
			var workOrderSet = eventContext.application.getResource("workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			var subvertical = currWO.get('tnbsubvertical');
			
			if (subvertical === "SCADA") {
				console.log(subvertical);
				ModelService.all('workOrder', "getMyAssignedWork").then(function(modelDataSet){
					eventContext.application.addResource(modelDataSet);
					eventContext.ui.hideCurrentView();
					//eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].refresh();
				});				
			}
			else
				eventContext.ui.hideCurrentView();
			
			ModelService.save(workOrderSet);
		},
		
		showChildFailureView: function(eventContext) {
			var currWO = eventContext.application.getResource("childWorkOrder").getCurrentRecord();
			var subvertical = currWO.get('tnbsubvertical');
			
			if (subvertical === "SCADA")
				eventContext.setDisplay(false);
			else
				eventContext.setDisplay(true);
		},
		
		showChildScadaFailureView: function(eventContext) {
			var currWO = eventContext.application.getResource("childWorkOrder").getCurrentRecord();
			var subvertical = currWO.get('tnbsubvertical');
			
			if (subvertical === "SCADA")
				eventContext.setDisplay(true);
			else
				eventContext.setDisplay(false);			
		},
	
		hideShowFailureClassLabel : function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"childWorkOrder").getCurrentRecord();
			var failureList = currWO.failureReportlist;
			var lastFC = "";
			if (failureList){
				lastFC = currWO.failureReportlist.data[currWO.failureReportlist.data.length-1];
			}

			if (lastFC){
				eventContext.setDisplay(false);
				currWO["failureTypeVisibility"]=true;
			} else {
				if (currWO.get("failurecode")==null) {
					eventContext.setDisplay(true);
				} else {
					currWO["failureTypeVisibility"]=false;
				}
			}
		},
		
		hideShowFailureType : function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"childWorkOrder").getCurrentRecord();
			eventContext.setDisplay(currWO.get("failureTypeVisibility"));
		}		
	});
});
