/**
 * 
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
		initPermit: function(eventContext){
			console.log('custom/PermitDetailHandler');
			var actualPermit = CommonHandler._getAdditionalResource(eventContext,"permit").getCurrentRecord();
			var msg = MessageService.createStaticMessage(actualPermit.get('permitworknum')).getMessage();
			eventContext.ui.showToastMessage(msg);
		},
		
		savePermit : function(eventContext){
			console.log('custom function: updateAtrributeInTask called from WODetailHandler');
			var msg = MessageService.createStaticMessage("save succesful").getMessage();
			var permitSet = CommonHandler._getAdditionalResource(eventContext,"permit").getCurrentRecord();
			ModelService.save(permitSet).then(function(){
				eventContext.ui.showToastMessage(msg);
				console.log('save completed');
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});
		}
	});
		
});