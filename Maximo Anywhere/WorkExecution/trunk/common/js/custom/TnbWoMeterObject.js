define("custom/TnbWoMeterObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			return {
		onInitialize : function(permit) {
			console.log('custom.TnbWoMeterObject');
		},
		onAdd: function(permit) {		
		},
		beforeSave : function(permit) {
			
		}
	}
});
