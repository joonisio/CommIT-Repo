/**
 In Development
 */

define("custom/PermitDetailHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
		  "dojo/_base/lang",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/comm/CommunicationManager",
	     "custom/PermitObject",
	     "platform/translation/SynonymDomain",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "application/handlers/CommonHandler",
	     "application/business/FieldUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/auth/UserManager",
	     "platform/util/PlatformConstants",
	     "application/business/WpEditSettings",
	     "platform/util/AsyncAwareMixin",
	     "platform/logging/Logger",
	     "application/handlers/FailureCodeHandler",
	     "platform/store/PersistenceManager",
	     "platform/geolocation/GeoLocationTrackingService",
	     "platform/map/MapProperties"],
function(declare, arrayUtil, lang, ApplicationHandlerBase, CommunicationManager,permit, SynonymDomain, ModelService, MessageService, CommonHandler, FieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, UserManager, PlatformConstants, WpEditSettings, AsyncAwareMixin, Logger, FailureCodeHandler,PersistenceManager,GeoLocationTrackingService,MapProperties) 
{
	return declare( [ApplicationHandlerBase, AsyncAwareMixin],{	
		
		//initiated permit
		initAddPermitView: function(eventContext){
			var view = eventContext.viewControl;z
			var actualPermitSet= CommonHandler._getAdditionalResource(eventContext,"workOrder.permitlist");
			if(!view.isOverrideEditMode()){
				console.log('Im Here');
				var workOrder = this.application.getResource("workOrder").getCurrentRecord(); 
				console.log(workOrder.get('wonum'));
				workOrder.openPriorityChangeTransaction();
				
				//create new record 
				var newPermit= actualPermitSet.createNewRecord();
				newPermit.set('tnbwonum',workOrder.get('wonum'));
				newPermit.set('permitworknum','1100');
				newPermit.set('tnbstatus','ISSUE');
				//var additionalLineType = CommonHandler._getAdditionalResource(eventContext,'additionalLineType');
				//ActualMaterialObject.setDefaultValues(newPermit, additionalLineType);
			}
			eventContext.setMyResourceObject(actualPermitSet);
		},
		
		//save permit
		commitNewPermitEntry: function(eventContext){
			console.log("create permit");
			eventContext.application.showBusy();
			
			try{
				var permitMaterial = eventContext.getCurrentRecord();
				var workOrderSet =	permitMaterial.getParent().getOwner();
				if(workOrderSet.getCurrentRecord().get('wonum') != '') {
					console.log("wonum not null");
					var workOrder = workOrderSet.getCurrentRecord();
	     			workOrder.closePriorityChangeTransaction();
					ModelService.save(workOrderSet).always(function(){
					eventContext.ui.hideCurrentView();
					//workOrder.deleteLocal();
					});
					
				}else{
					eventContext.ui.hideCurrentView();						
				}
				
			}catch(e){
				console.log(e);
				throw e;
			}
		},
		
		handleBackButtonClick: function(eventContext){
			console.log('Clear data when go back');
			var actualPermitSet= CommonHandler._getAdditionalResource(eventContext,"workOrder.permitlist");
			actualPermitSet.data = [];
			actualPermitSet._changedRecords = [];
			actualPermitSet._recordsToCreate = [];			
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
	});
		
});