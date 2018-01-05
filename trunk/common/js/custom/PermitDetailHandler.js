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
		initAddPermitView: function(eventContext){
				
		},
		
		initSearchData: function(eventContext){
			console.log('setSearchQuery');
			var searchData = eventContext.application.getResource("searchPermit");
			if(searchData == null || searchData.getCurrentRecord() == null){
				searchData.createNewRecord();
			}
			eventContext.application.ui.savedQueryIndex = eventContext.application.ui.getViewFromId('WorkExecution.Permit').queryBaseIndex;
		},
		
		setSearchQuery: function(eventContext){
			console.log('setSearchQuery');
			eventContext.application.showBusy();
			var search = eventContext.application.getResource("searchPermit").getCurrentRecord();
			var filteredItems = 0;			
			var filter = {};
			
			if (search.permitworknum){
			    filter.permitworknum = '%'+search.permitworknum+'%';
			    filteredItems++;
			}
			
			if(filteredItems == 0){
				eventContext.ui.show('WorkExecution.RequiredSearchFieldMissing');
				return;
			}
			var self = this;
			eventContext.application.ui.performSearch = true;
			ModelService.clearSearchResult(eventContext.application.getResource('permit')).then(function(){
				 ModelService.empty('permit').then(function(){
					 eventContext.ui.getViewFromId('WorkExecution.Permit').setQueryBaseIndexByQuery(PlatformConstants.SEARCH_RESULT_QUERYBASE).then(function(){
						// eventContext.ui.show('WorkExecution.Permit');
						 eventContext.application.showBusy();
						 PersistenceManager.removeQuerybase('permit', PlatformConstants.SEARCH_RESULT_QUERYBASE);
						 //self.populateSearch(eventContext);
					 });
				 });
			});
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
		},
		
		clearSearchFields: function(eventContext){
			console.log('clear Search Field');
			eventContext.application.getResource("searchPermit").createNewRecord();
		}
		
	});
		
});