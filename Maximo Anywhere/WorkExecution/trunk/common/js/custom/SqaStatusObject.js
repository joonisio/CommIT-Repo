 //Licensed Materials - Property of Muhaimin

define("custom/SqaStatusObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			return {
		onInitialize : function(sqastatus) {
			console.log('custom.SqaStatusObject');
		},
		onAdd: function(sqastatus) {		
		},
		beforeSave : function(sqastatus) {
			
		},
		
	}
});
