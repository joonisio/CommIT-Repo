/**
 * 
 */

define("custom/tnbWoMeterGroupObject", 
		["application/business/FieldUtil",
		 "platform/model/ModelService"], 
		 function(fieldUtil, ModelService) {	
			return {
		onInitialize : function(tnbWoMeterGroupObject) {
			console.log('custom.tnbWoMeterGroupObject');
		},
		onAdd: function(tnbWoMeterGroupObject) {		
		},
		beforeSave : function(tnbWoMeterGroupObject) {
			
		}
	}
});
