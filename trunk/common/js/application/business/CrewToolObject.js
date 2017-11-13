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

define("application/business/CrewToolObject", 
		["application/business/FieldUtil",
	     "platform/exception/PlatformRuntimeException", 
	     "platform/warning/PlatformRuntimeWarning",
	 	"platform/util/PlatformConstants"], 
		 function(fieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants) {
	return {
/**@memberOf application.business.CrewToolObject */
		setDefaultValues : function(crewTool) {
			
		},
		createAtualToolForCrew: function(crewtoolLocalSet, actualtoollist){
			if (crewtoolLocalSet) {
				
				for(var i=0;i<crewtoolLocalSet.count();i++){
					
					var newTool = actualtoollist.createNewRecord();	
					var currTool = crewtoolLocalSet.getRecordAt(i);
					
					if(currTool.get('actualstaskid') != ""){
						newTool.set('actualstaskid',currTool.get('actualstaskid'));
						
					}
					newTool.set('tool',currTool.get('itemnum'));
					newTool.set('tooldesc',currTool.get('description'));
					if(currTool.get('toolhrs') == null){
						newTool.set('toolhrs',0);
					} else {
						newTool.set('toolhrs',currTool.get('toolhrs'));
					}
					
					newTool.set('rotassetnum',currTool.get('assetnum'));				
					newTool.set('amcrew',currTool.get('amcrew'));
				
				}
			}
		},
		
		buildToolList: function(toolSet, curr, crewtoolSet, currentTime, ModelService, additionalAssetSet){
			if (crewtoolSet && crewtoolSet.count() > 0 && crewtoolSet != PlatformConstants.EMPTY_COMPLEX_FIELD) {
				
				
				if(additionalAssetSet.count() == 0 ){
					throw new PlatformRuntimeWarning('additionaDataAssetDownload');	
				}
				
				
				for(var i=0;i<crewtoolSet.count();i++){					
					var currTool = crewtoolSet.getRecordAt(i);
					var effectiveDate = currTool.getAsDateOrNull('effectivedate');
					var endDate = currTool.getAsDateOrNull('enddate');
					if ( (effectiveDate && effectiveDate < currentTime) && (!endDate || endDate > currentTime)) {											
						var newTool = toolSet.createNewRecord();	
						
						var assetnum = currTool.get('assetnum');
						if (assetnum) {
							var siteid = currTool.get('siteid');
							var additionalAsset = additionalAssetSet.find('assetnum == $1 && siteid == $2', assetnum, siteid);
							if (additionalAsset.length == 0) {
								throw new PlatformRuntimeException("rotatingAssetNotThere", [assetnum]);
							}
							var itemnum = additionalAsset[0].get('itemnum');
							newTool.set('itemnum',itemnum);
							newTool.set('description',additionalAsset[0].get('description'));
		                	newTool.set('itemsetid',additionalAsset[0].get('itemsetid'));
						}
	                	newTool.set('amcrew',curr.get('crewid'));
	                	newTool.set('toolseq',currTool.get('toolseq'));
	                	newTool.set('siteid',siteid);
	                	newTool.set('assetnum',currTool.get('assetnum'));
	                	if(curr.get('actualstaskid') != ""){
	                		newTool.set('actualstaskid',curr.get('actualstaskid'));
	                	}
	                	newTool.set('toolhrs',curr.get('regularhours'));
					}
									
				}		
			
		    }
			
			return ModelService.save(toolSet);
		},
		
		onInitialize : function(task) {
		},
		onAdd: function(task) {
			
		},
		beforeSave : function(task) {
			
		},
		
		toolHoursChanged: function(crewToolResource, newHoursString){
			// get crew hours... they're on the laborcrew resource
			var laborCrew = window.UI.application.getResource('laborcrew');
			if (laborCrew){
				var crewHours = laborCrew.getCurrentRecord().get('regularhours');
				if (newHoursString > crewHours){
					throw new PlatformRuntimeException('invalidToolHours');
				}
			}
		},
	}
});
