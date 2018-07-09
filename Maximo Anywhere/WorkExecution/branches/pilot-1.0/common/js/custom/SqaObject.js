
define("custom/SqaObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService",
		 "application/business/SqaStatusHandler"], 
		 function(fieldUtil, ModelService, SqaStatusHandler) {	
			return {
		onInitialize : function(sqa) {
			console.log('custom.SqaObject');
		},
		 setDefaultValues : function(newSQA,wonum) {	
			 	newSQA.set('tnbwonum',wonum);
				newSQA.set('description','SQA for Work order ' + wonum);
				newSQA.set('status',"ENTRY");
			},
		onAdd: function(sqa) {		
		},
		beforeSave : function(sqa) {
			
		},
		statusChanged : function(sqa, newValue, previousValue) {
			sqa.set("statusdesc", SqaStatusHandler.getInstance().toDescription(newValue));
			sqa.set("internalStatus", SqaStatusHandler.getInstance().toInternalState(sqa.get("status")));
		},
	}
});
