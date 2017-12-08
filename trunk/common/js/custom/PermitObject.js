 //Licensed Materials - Property of Muhaimin

define("custom/PermitObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			return {
		onInitialize : function(permit) {
			console.log('application.business.PermitObject');
		},
		onAdd: function(permit) {		
		},
		beforeSave : function(permit) {
			
		}
	}
});
