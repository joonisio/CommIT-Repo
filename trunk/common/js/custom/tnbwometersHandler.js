
		define("custom/tnbwometersHandler", 
			   [ "dojo/_base/declare",
			     "dojo/_base/lang",
			     "platform/model/ModelService",
			     "dojo/_base/array",
			     "platform/handlers/_ApplicationHandlerBase",
			     "application/business/WorkOrderObject",
			     "platform/exception/PlatformRuntimeException",
			     "platform/warning/PlatformRuntimeWarning",
			     "application/handlers/CommonHandler",
			     "platform/util/PlatformConstants",
			     "platform/format/FormatterService",
			     "platform/logging/Logger",
			     "dojo/Deferred",
			     "dojo/promise/all",
			     "platform/store/SystemProperties",
			     "platform/store/_ResourceMetadataContext"],
		function(declare,lang, ModelService, array, ApplicationHandlerBase, WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, FormatterService, Logger, Deferred, all, SystemProperties, ResourceMetadataContext) {
			return declare( ApplicationHandlerBase, {
				
				
				getHistoryQueryBase: function() {
					var queryBase = PlatformConstants.SEARCH_RESULT_QUERYBASE;
					
					var woHistoryResource =ResourceMetadataContext.getResourceMetadata("tnbwometers");
					if(woHistoryResource!=null)
						if(woHistoryResource.queryBasesLabel.length > 0)
							queryBase = woHistoryResource.queryBasesLabel[0].name;
					
					console.log(queryBase);
					return queryBase;
				},
	
				filterMeter: function(eventContext){
					console.log('filter meter');
					var currentRecord = eventContext.getCurrentRecord();
					var meter = currentRecord.get("tnbwometerslist");
					console.log(meter);
					var meterId = null;
					var meter_filter = {};
					meterId = meter;
					if(meterId != ""? meter_filter["tnbwometersid"] = meterId:false) {
						ModelService.filtered('tnbwometers', null, meter_filter, 1000, null, null, null).then(function(locset){
						console.log(locset);
						eventContext.application.addResource(locset);
						eventContext.ui.show('WorkExecution.TnbWOMeterList2');
						});
					}	
					
				},
				
				readingMeter: function(eventContext){
				console.log('meter reading');
				eventContext.ui.show('WorkExecution.AssetWOMeterDetailView');					
				},
						
				
			});
		});
