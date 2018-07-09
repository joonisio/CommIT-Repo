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

define("application/handlers/LaborAssignmentHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "application/handlers/CommonHandler",
	     "platform/model/ModelService",
	     "platform/util/AsyncAwareMixin"],
function(declare, lang, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, CommonHandler, ModelService,
		AsyncAwareMixin) {
	"use strict";
	return declare( [ApplicationHandlerBase,AsyncAwareMixin], {
		
		//Initialize Labor Assignment Detail view
/**@memberOf application.handlers.LaborAssignmentHandler */
		initLaborAssignmentDetailView: function(eventContext){
			
			//Retrieve field values
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var crew = curr.getPendingOrOriginalValue('crew');
			var labor = curr.getPendingOrOriginalValue('laborcode');
			
			//Set Crew description
			if(crew){
				var amcrew = CommonHandler._getAdditionalResource(eventContext,'additionalamcrew').find('amcrew == $1', crew);
				curr.set('crewdesc',amcrew[0].get('description'))
			}
			
			
			//Set initial readonly conditions
			if(crew){
				var laborMetadata = curr.getRuntimeFieldMetadata('laborcode');
				laborMetadata.set('readonly',true);
			}
			
			if(labor){
				var crewMetadata = curr.getRuntimeFieldMetadata('crew');
				crewMetadata.set('readonly',true);
			}			
		},
		
		//Initialize Labor Assignment Detail view
		asyncLaborAssignmentDetailView: function(eventContext){
			
			//Retrieve field values
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var crew = currentRecord.getPendingOrOriginalValue('crew');
			var labor = currentRecord.getPendingOrOriginalValue('laborcode');
			
			//Set Crew description
			if(crew){
				var amcrewSetPromise = this.asyncGetAMCrewPromise(crew);
				this.asyncSetInitialValues(amcrewSetPromise, currentRecord, labor);
				var laborAssign = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
				laborAssign.set('craft','');
				laborAssign.set('skilllevel','');
				
			} else if(labor){
				var crewMetadata = currentRecord.getRuntimeFieldMetadata('crew');
				crewMetadata.set('readonly',true);
			}			
		},
		
		asyncGetAMCrewPromise: function(crew){
			return ModelService.filtered('additionalamcrew', null, [{amcrew: crew}], null, false, true);
		},
	
		asyncSetInitialValues: function(amcrewSet, currentRecord, labor) {
			if (amcrewSet.count() > 0){
				currentRecord.set('crewdesc',amcrewSet.getRecordAt(0).get('description'))
				var laborMetadata = currentRecord.getRuntimeFieldMetadata('laborcode');
				laborMetadata.set('readonly',true);
			}
			
			if(labor){
				var crewMetadata = currentRecord.getRuntimeFieldMetadata('crew');
				crewMetadata.set('readonly',true);
			}			
		},
		
		//Ignore changes and back ui view
		handleBackButtonClickAssignmentDetailView: function(eventContext){
			//TODO Ignore changes
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		//Cleanup event
		cleanupAssignmentDetailView : function(eventContext){
			//Do nothing
		},	
		
		//Commit changes to Labor Assignment Detail view
		commitLaborAssignmentDetailView: function(eventContext){
			//TODO: Update Labor and Crew fields with any new	 values
			
			var woAssignSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			
			ModelService.save(woAssignSet).then(function(savedSet){
				eventContext.ui.hideCurrentView();				
			});

		},
	
		asyncValidateCrew : function(eventContext) {
			var laborAssign = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var crew = laborAssign.getPendingOrOriginalValue('crew');
			var laborMetadata = laborAssign.getRuntimeFieldMetadata('laborcode');
			
			//if crew is null, clear crew description and set labor as editable
			if(!crew){
				laborAssign.set('crew','');
				laborAssign.set('crewdesc','');
				laborMetadata.set('readonly',false);
				laborAssign.set('amcrewtype','');
				return;
			}
			
			var crewSetPromise = this.asyncGetAMCrewPromise(crew);
			this.asyncValidateTypedCrew(crewSetPromise, crew, laborAssign, laborMetadata);
		},
		
		asyncValidateTypedCrew: function(crewSet, crew, laborAssign, laborMetadata) {
			if (crewSet.count() === 0){
				throw new PlatformRuntimeWarning('invalidCrew');
			}
			
			//if crew is filled, clean laborcode and set as readonly AND set Crew Description, when typed
			if (crew){
				laborAssign.set('crewdesc',crewSet.getRecordAt(0).get('description'));
				laborAssign.set('laborcode','');
				laborMetadata.set('readonly',true);
			}
		},
		
		validateCrew : function(eventContext) {
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var laborAssign = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var crew = laborAssign.getPendingOrOriginalValue('crew');
			var laborMetadata = laborAssign.getRuntimeFieldMetadata('laborcode');
			
			//if crew is null, clear crew description and set labor as editable
			if(!crew){
				laborAssign.set('crew','');
				laborAssign.set('crewdesc','');
				laborMetadata.set('readonly',false);
				laborAssign.set('amcrewtype','');
				return;
			}
			
			crew.toUpperCase();
			
			//Validate against lookup list
			var additionalamcrew = this.filterCrew(eventContext);			
			var crewSet = additionalamcrew.find('amcrew == $1', crew);
			if(crewSet.length == 0) {throw new PlatformRuntimeWarning('invalidCrew');}
			
			//if crew is filled, clean laborcode and set as readonly AND set Crew Description, when typed
			if(crew){
				curr.set('crewdesc',crewSet[0].get('description'));
				laborMetadata.set('readonly',true);
				laborAssign.set('laborcode','');
			}
		},	
		
		filterCrew : function(eventContext) {
			var additionalamcrew = CommonHandler._getAdditionalResource(eventContext,'additionalamcrew');
			CommonHandler._clearFilterForResource(eventContext,additionalamcrew);
			
			return additionalamcrew;			
		},
		
		asyncValidateLabor: function(eventContext) {
			var laborAssign = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var labor = laborAssign.getPendingOrOriginalValue('laborcode');
			var crewMetadata = laborAssign.getRuntimeFieldMetadata('crew');
			
			//if labor is null, clear labor description and set crew as editable
			if(!labor){
				laborAssign.set('laborcode','');
				laborAssign.set('laborname','');
				crewMetadata.set('readonly',false);
				return;
			}
			
			//Validate against lookup list
			var laborSetPromise = this.asyncFilterLabor(eventContext, labor);
			this.asyncValidateLaborAssignForLabor(laborSetPromise, laborAssign, crewMetadata, labor);
		},
		
		asyncFilterLabor: function(eventContext, labor) {
			var assignmentListResource = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist');
			var additionallaborcraftrate = CommonHandler._getAdditionalResource(eventContext,'additionallaborcraftrate');
			var filter = {};
			
			if (!assignmentListResource && !labor){
				return ModelService.additionalDataFiltered('additionallaborcraftrate', filter, true);
			}
			var currentAssignmentRecord = assignmentListResource.getCurrentRecord();
			if (!currentAssignmentRecord && !labor){
				return ModelService.additionalDataFiltered('additionallaborcraftrate', filter, true);
			}
			
			//If Craft is informed, use it on filter
			var craft = currentAssignmentRecord.get('craft');
			if(craft){
				filter = {craft: craft};
			}
			if (labor){
				lang.mixin(filter, {laborcode: labor});
			}
			
			return ModelService.additionalDataFiltered('additionallaborcraftrate', filter, true);
		},
		
		asyncValidateLaborAssignForLabor: function(laborSet, laborAssign, crewMetadata, labor) {
			if(laborSet.count() === 0) {
				throw new PlatformRuntimeWarning('errornolaborfound');
			}
			
			//if laborcode is filled, clean crew and set as readonly
			if(labor){
				var laborRec = laborSet.getRecordAt(0);
				laborAssign.set('laborname',laborRec.get('laborname'));
				laborAssign.set('craft',laborRec.get('craft'));
				laborAssign.set('skilllevel',laborRec.get('skilllevel'));				
				crewMetadata.set('readonly',true);
				laborAssign.set('crew','');
			}			
		},
		
		validateLabor : function(eventContext) {
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var laborAssign = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist').getCurrentRecord();
			var labor = laborAssign.getPendingOrOriginalValue('laborcode');
			var crewMetadata = laborAssign.getRuntimeFieldMetadata('crew');
			
			//if labor is null, clear labor description and set crew as editable
			if(!labor){
				laborAssign.set('laborcode','');
				laborAssign.set('laborname','');
				crewMetadata.set('readonly',false);
				return;
			}

			//Validate against lookup list
			var additionallaborcraftrate = this.filterLabor(eventContext);			
			var laborSet = additionallaborcraftrate.find('laborcode == $1', labor);
			if(laborSet.length == 0) {throw new PlatformRuntimeWarning('errornolaborfound');}
			
			//if laborcode is filled, clean crew and set as readonly
			if(labor){
				curr.set('laborname',laborSet[0].get('laborname'));
				curr.set('craft',laborSet[0].get('craft'));
				curr.set('skilllevel',laborSet[0].get('skilllevel'));				
				crewMetadata.set('readonly',true);
				laborAssign.set('crew','');
			}			
		},
		
		filterLabor : function(eventContext) {
			CommonHandler._clearFilterForResource(this,additionallaborcraftrate);
			var assignmentListResource = CommonHandler._getAdditionalResource(eventContext,'workOrder.assignmentlist');
			if (!assignmentListResource){
				return;
			}
			var curr = assignmentListResource.getCurrentRecord();
			var additionallaborcraftrate = CommonHandler._getAdditionalResource(eventContext,'additionallaborcraftrate');
			CommonHandler._clearFilterForResource(eventContext,additionallaborcraftrate);
			
			//If Craft is informed, use it on filter
			var craft = curr.get('craft');
			if(craft){
				additionallaborcraftrate.lookupFilter = [{craft: craft}];
			}
			
			return additionallaborcraftrate;
		},
		
		asyncFilterLaborCraftForLookup: function(eventContext){
			var laborCraftRateSet =  CommonHandler._getAdditionalResource(eventContext,"additionallaborcraftrate");
			CommonHandler._clearFilterForResource(eventContext, laborCraftRateSet);

			var assignmentlist = CommonHandler._getAdditionalResource(eventContext,"workOrder.assignmentlist");
			
			var currentLabor =  null;
			var craft = null;
			if(assignmentlist){
				currentLabor = assignmentlist.getCurrentRecord();
				craft = currentLabor.get("craft");
			}
			
			var filter = {};
			if(craft){
				filter = {craft: craft};
			}

			laborCraftRateSet.lookupFilter = filter;				
		}

	});
});
