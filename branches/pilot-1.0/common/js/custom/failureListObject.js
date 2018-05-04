
define("custom/failureListObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			var count =0;
			return {
		onInitialize : function(failureReportResource) {
			console.log('custom.failureListObject');
			console.log(failureReportResource);
			//console.log(failureReport.get('type'));
			if(failureReportResource.get('type') === "REMEDY"){
				failureReportResource.getRuntimeFieldMetadata('tnbcmsticketno').set('readonly', false);
				console.log('yes');
			}else{
				console.log('no');
				console.log(failureReportResource.get('tnbdocketnochkbox'));
				failureReportResource.getRuntimeFieldMetadata('tnbcmsticketno').set('readonly', true);
				failureReportResource.getRuntimeFieldMetadata('tnbdocketno').set('readonly', true);
				failureReportResource.getRuntimeFieldMetadata('tnbsmbreportno').set('readonly', true);
				failureReportResource.getRuntimeFieldMetadata('tnbcircuitno').set('readonly', true);
			}
			
			
		}
	};
});