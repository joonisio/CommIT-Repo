
define("custom/SqaObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			return {
		onInitialize : function(sqa) {
			console.log('custom.SqaObject');
		},
		onAdd: function(sqa) {		
		},
		beforeSave : function(sqa) {
			
		}
	}
});
