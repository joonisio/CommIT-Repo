/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2013 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/business/util/CrewUtil",
[ "dojo/_base/declare", 
  "dojo/Deferred",
  "application/handlers/CommonHandler",
  "platform/auth/UserManager"
  ], 
  function(declare, 
		   Deferred, CommonHandler, UserManager) {
	return {
/**@memberOf application.business.util.CrewUtil */
		getUserCrew: function(eventContext){
			var crewSet =   CommonHandler._getAdditionalResource(eventContext,"laborcrew");
			var currCrew = null;
			for (var i=0;i<crewSet.count();i++){
				var crew = crewSet.getRecordAt(i);
				var crewlaborSet = crew.getLoadedModelDataSetOrNull('crewlabor');
				var mylaborSet = CommonHandler._getAdditionalResource(eventContext, 'mylabor');
				var mylabor = mylaborSet.getCurrentRecord();
				if (mylabor) {
					var laborcode = mylabor.get('laborcode');
					crewlaborSet.filter("laborcode==$1",laborcode);
					for(var j = 0; j < crewlaborSet.count(); j++) {
						var crewlabor = crewlaborSet.getRecordAt(j);
						var enddate = crewlabor.enddate;
						var effectivedate = crewlabor.effectivedate;
						var now = eventContext.application.getCurrentDateTime().toISOString(); 
						if(crewlaborSet.count() > 0 && (effectivedate < now && enddate > now || typeof enddate == "undefined" && effectivedate < now)) {
							currCrew = crew;
							crewSet.setCurrentIndex(i);
							//Can only find one crew
							crewlaborSet.clearFilterAndSort();
							return currCrew;
							//before merge: i = crewSet.count();
						}
					}
					crewlaborSet.clearFilterAndSort();
				}
			}
			return currCrew;
		},
	
	};
});
