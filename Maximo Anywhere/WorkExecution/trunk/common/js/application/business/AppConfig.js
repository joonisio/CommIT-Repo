define("application/business/AppConfig",
[ "dojo/_base/declare"], 
  function(declare) {
	
	
	//Number of Records to be displayed in Previous Work Order List
	var DisplayRecordLimit = 5;
	
	return {
/**@memberOf application.business.AppConfig */
		getDisplayRecordLimit: function(){
			return DisplayRecordLimit;
		},
			
				
	};
});
