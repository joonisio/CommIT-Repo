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
		ModelService, arrayUtil,CommunicationManager, tnbwometer, ApplicationHandlerBase,
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
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var currentRecord = eventContext.getCurrentRecord();
			var meter = currentRecord.get("tnbwometerslist");
			workOrder.set('tempMeterName',currentRecord.get("description"));
			var redirect = "WorkExecution.TnbWOMeterList2";
			
				console.log("filter tnbwometers");
				ModelService.filtered('tnbwometers', null,[{tnbwometersid: meter}], 1000, null,null,null,null,null).then(function(locset){	
					arrayUtil.forEach(locset.data,function(tnbwometers){
						var tnbautocalculate=(tnbwometers.tnbautocalculate);
						if(tnbautocalculate==true){
							console.log('read only for reading')
							tnbwometers.getRuntimeFieldMetadata('tnbnewreading').set('readonly', true);
						}
					});
				eventContext.application.addResource(locset);
				eventContext.ui.show(redirect);
				
			}).otherwise(function(error) {
				Logger.error(JSON.stringify(error));
			});
		},
		hideLookupTestForm:function(eventContext){
			var currentRecord = eventContext.getCurrentRecord();
			var meterType = currentRecord.get("metertype");

			var tnbautocalculate = currentRecord.get("tnbautocalculate");
			
			//additional condition for manual or auto calculation
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var autoCalType = workOrder.get('tnbautocaltype');
			
			console.log(meterType +'/'+tnbautocalculate);
			
			if (autoCalType==="MANUAL"){
				eventContext.setDisplay(false);
			}
			else {
				if(meterType==="CHARACTERISTIC"){
					eventContext.setDisplay(false);
				}else{
					eventContext.setDisplay(true);
				}				
			}
			
			if(tnbautocalculate==true){
				console.log('read only for reading');
				currentRecord.getRuntimeFieldMetadata('tnbnewreading').set('readonly', true);
			}
		},
		hideLookupTestForm2:function(eventContext){
			var currentRecord = eventContext.getCurrentRecord();
			var meterType = currentRecord.get("metertype");

			var tnbautocalculate = currentRecord.get("tnbautocalculate");
			//additional condition for manual or auto calculation
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var autoCalType = workOrder.get('tnbautocaltype');
			
			console.log(meterType +'/'+tnbautocalculate);

			console.log(meterType);
			
			if (autoCalType==="MANUAL"){
				eventContext.setDisplay(false);
			}
			else {
				if(meterType==="CHARACTERISTIC"){
					eventContext.setDisplay(true);
				}else{
					eventContext.setDisplay(false);
				}				
			}
			
			if(tnbautocalculate==true){
				console.log('read only for reading')
				currentRecord.getRuntimeFieldMetadata('tnbnewreading').set('readonly', true);
			}
		},
		
		showLookupTestFormManualReading: function(eventContext) {
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var autoCalType = workOrder.get('tnbautocaltype');
			
			var currentRecord = eventContext.getCurrentRecord();
			var meterType = currentRecord.get("metertype");
			
			if (autoCalType!=="MANUAL"){
				eventContext.setDisplay(false);
			}
			else {
				if(meterType==="CHARACTERISTIC"){
					eventContext.setDisplay(true);
				}else{
					eventContext.setDisplay(false);
				}				
			}			
			
		},
		
		showTestFormManualReading: function(eventContext) {
			
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var autoCalType = workOrder.get('tnbautocaltype');
			
			var currentRecord = eventContext.getCurrentRecord();
			var meterType = currentRecord.get("metertype");	
			
			if (autoCalType!=="MANUAL"){
				eventContext.setDisplay(false);
			}
			else {
				if(meterType==="CHARACTERISTIC"){
					eventContext.setDisplay(false);
				}else{
					eventContext.setDisplay(true);
				}				
			}			
		},
		
		meterLabel:function(eventContext){
			console.log('meterLabel');
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			return [workOrder.get('tempMeterName')];
		},
		
		commitMeterValue:function(eventContext){
			eventContext.application.showBusy();
			var wometerSet = eventContext.application.getResource('tnbwometers');
			ModelService.save(wometerSet).then(function(modelDataSet) {
				console.log('saved');
				eventContext.ui.hideCurrentView();

			}).
			otherwise(function(err){
				eventContext.application.hideBusy();
				eventContext.ui.showMessage(err);						
			});			

				
		},				

	});
});
