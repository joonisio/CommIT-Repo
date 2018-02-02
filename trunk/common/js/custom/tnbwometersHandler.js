define("custom/tnbwometersHandler", [ "dojo/_base/declare", "dojo/_base/lang",
		"platform/model/ModelService", "dojo/_base/array",
		"custom/TnbWoMeterObject", "platform/handlers/_ApplicationHandlerBase",
		"application/business/WorkOrderObject",
		"platform/exception/PlatformRuntimeException",
		"platform/warning/PlatformRuntimeWarning",
		"application/handlers/CommonHandler",
		"platform/util/PlatformConstants", "platform/format/FormatterService",
		"platform/logging/Logger", "dojo/Deferred", "dojo/promise/all",
		"platform/store/SystemProperties",
		"platform/store/_ResourceMetadataContext" ], function(declare, lang,
		ModelService, array, tnbwometer, ApplicationHandlerBase,
		WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning,
		CommonHandler, PlatformConstants, FormatterService, Logger, Deferred,
		all, SystemProperties, ResourceMetadataContext) {

	return declare(ApplicationHandlerBase, {
		initialize:function(evenContext){
			ModelService.all('tnbwometers',null,null,false).then(function(set){
			eventContext.application.addResource(locset);
		});
		},

		filterMeter : function(eventContext) {
			var currentRecord = eventContext.getCurrentRecord();
			var meter = currentRecord.get("tnbwometerslist");
			console.log("filterMeter "+currentRecord.get("description"));
			var redirect = "WorkExecution.TnbWOMeterList2";
			if (meter != null) {
				Logger.trace("meter has value");
				console.log("meter has value");
					ModelService.filtered('tnbwometers', null,[{tnbwometersid: meter}], 1000, null,null,null,null).then(function(locset){
						if (locset.fetchedFromServer){
							console.log("fetched from server");
						}
						locset.resourceID = 'tnbwometers';
						console.log(locset);
						Logger.trace(locset);
						eventContext.application.addResource(locset);
						eventContext.ui.show(redirect);
					}).otherwise(function(error) {
						Logger.error(JSON.stringify(error));
					});
			} else {
				Logger.trace("meter is null");
				eventContext.application.addResource(null);
				eventContext.ui.show(redirect);
			}

		},

	});
});
