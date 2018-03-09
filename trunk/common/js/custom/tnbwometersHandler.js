define("custom/tnbwometersHandler", [ "dojo/_base/declare", "dojo/_base/lang",
		"platform/model/ModelService", "dojo/_base/array","platform/comm/CommunicationManager",
		"custom/TnbWoMeterObject", "platform/handlers/_ApplicationHandlerBase",
		"application/business/WorkOrderObject",
		"platform/exception/PlatformRuntimeException",
		"platform/warning/PlatformRuntimeWarning",
		"application/handlers/CommonHandler",
		"platform/util/PlatformConstants", "platform/format/FormatterService",
		"platform/logging/Logger", "dojo/Deferred", "dojo/promise/all",
		"platform/store/SystemProperties",
		"platform/store/_ResourceMetadataContext" ], function(declare, lang,
		ModelService, array,CommunicationManager, tnbwometer, ApplicationHandlerBase,
		WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning,
		CommonHandler, PlatformConstants, FormatterService, Logger, Deferred,
		all, SystemProperties, ResourceMetadataContext) {

	return declare(ApplicationHandlerBase, {
		initialize:function(evenContext){
			ModelService.all('tnbwometers',null,null,false).then(function(set){
			eventContext.application.addResource(locset);
		});
		},
		
		
//		initializeMetertoLocal:function(eventContext){
//			console.log("init meter to local")
//			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder");
//			console.log(workOrder);
//			for(var i =0;i<workOrder.data.length;i++){
//				if(workOrder.data[i].tnbwometergrouplist !=null){
//					console.log(workOrder.data[i].wonum);
//					var tnbwometer = workOrder.data[i].tnbwometergrouplist;
//					for(var j =0;j< tnbwometer.length;j++){
//						console.log("loop 2");
//						var meter = tnbwometer[j].tnbwometerslist;
//						ModelService.filtered('tnbwometers', null,[{tnbwometersid: meter}], 1000, null,null,null,null).then(function(locset){		
//							if (locset.fetchedFromServer){
//								console.log("fetched from server");
//							}else{
//								console.log("fetched from local");
//							}
//							
//							eventContext.application.addResource(locset);
//			
//						});
//					}
////					
//				}
//			}
//		},
		
		filterMeter1 : function(eventContext) {
        CommunicationManager.checkConnectivityAvailable().
		then(function(hasConnectivity){
			console.log("function : filterMeter1");
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			//console.log(workOrder);	
			//console.log(workOrder.tnbwometergrouplist.data.length);
				
				for(var i =0;i<workOrder.tnbwometergrouplist.data.length;i++){
					console.log("loop");	
					var meter = workOrder.tnbwometergrouplist.data[i].tnbwometerslist;
					console.log(meter);
					if (meter != null) {
							ModelService.filtered('tnbwometers', null,[{tnbwometersid: meter}], 1000, null,null,null,null).then(function(locset){
								//console.log(locset);
								if (locset.fetchedFromServer){
									console.log("fetched from server");
								}else{
									console.log("fetched from local");
								}
								
								eventContext.application.addResource(locset);
							
								
							}).otherwise(function(error) {
								Logger.error(JSON.stringify(error));
							});
					} 
				}
	
			
		});
		},

		filterMeter : function(eventContext) {
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var currentRecord = eventContext.getCurrentRecord();
			var meter = currentRecord.get("tnbwometerslist");
			workOrder.set('tempMeterName',currentRecord.get("description"));
			var redirect = "WorkExecution.TnbWOMeterList2";
			if (meter != null) {
					ModelService.filtered('tnbwometers', null,[{tnbwometersid: meter}], 1000, null,null,null,true,null).then(function(locset){
						
						if (locset.fetchedFromServer){
							console.log("fetched from server");
						}else{
							console.log("fetched from local");
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
				eventContext.application.addResource(null);
				eventContext.ui.show(redirect);
			}
		
		},
		hideLookupTestForm:function(eventContext){
			var currentRecord = eventContext.getCurrentRecord();
			var meterType = currentRecord.get("metertype");
			console.log(meterType);
			if(meterType==="CHARACTERISTIC"){
				eventContext.setDisplay(false);
			}else{
				eventContext.setDisplay(true);
			}
		},
		hideLookupTestForm2:function(eventContext){
			var currentRecord = eventContext.getCurrentRecord();
			var meterType = currentRecord.get("metertype");
			console.log(meterType);
			if(meterType==="CHARACTERISTIC"){
				eventContext.setDisplay(true);
			}else{
				eventContext.setDisplay(false);
			}
		},
		
		meterLabel:function(eventContext){
			console.log('meterLabel');
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			return [workOrder.get('tempMeterName')];
		},
		
		commitMeterValue:function(eventContext){
			var wometerSet = eventContext.application.getResource('tnbwometers');
			ModelService.save(wometerSet).then(function(modelDataSet) {
				console.log("REFRESH VIEW");
				modelDataSet.resourceID = 'tnbwometers';
				eventContext.application.addResource(modelDataSet);
				deferred.resolve(modelDataSet);
				eventContext.ui.getCurrentViewControl().refresh();
				console.log(wometerSet);
				console.log(modelDataSet);
			});			
		},				

	});
});
