
		define("custom/tnbwometersHandler", 
			   [ "dojo/_base/declare",
			     "dojo/_base/lang",
			     "platform/model/ModelService",
			     "dojo/_base/array",
			     "custom/TnbWoMeterObject",
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
		function(declare,lang, ModelService, array, tnbwometer,ApplicationHandlerBase, WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, FormatterService, Logger, Deferred, all, SystemProperties, ResourceMetadataContext) {
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
					var deferred = new Deferred();
					var currentRecord = eventContext.getCurrentRecord();
					var meter = currentRecord.get("tnbwometerslist");
					Logger.trace(meter);
					var redirect = "WorkExecution.TnbWOMeterList2";
					var meter_filter = {};
					if(meter !=null){
						meter_filter["tnbwometersid"] = meter;
						ModelService.filtered('tnbwometers',this.getHistoryQueryBase,meter_filter , 1000, null, null, null).then(function(locset){
							deferred.resolve(locset);
							Logger.trace(locset);
							eventContext.application.addResource(locset);			
							eventContext.ui.show(redirect);
						});
					}else{
						deferred.resolve(null);
						eventContext.application.addResource(null);
						eventContext.ui.show(redirect);
					}
					console.log(deferred.promise);
				},
				
				readingMeter: function(eventContext){
				console.log('meter reading');
				eventContext.ui.show('WorkExecution.AssetWOMeterDetailView');					
				},
						
				
			});
		});
