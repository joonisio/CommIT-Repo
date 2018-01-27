
define("custom/SqaObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			return {
		onInitialize : function(sqa) {
			console.log('custom.SqaObject');
		},
		 setDefaultValues : function(newSQA,wonum) {	
			 newSQA.set('tnbwonum',wonum);
				//newSQA.set('auditnum','6002');
				newSQA.set('description','SQA for Work order ' + wonum);
				newSQA.set('status',"ENTRY");
				
			},
		onAdd: function(sqa) {		
		},
		beforeSave : function(sqa) {
			
		}
	}
});
