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

define("application/handlers/WODetailHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
		  "dojo/_base/lang",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/comm/CommunicationManager",
	     "application/business/WorkOrderObject",
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
function(declare, arrayUtil, lang, ApplicationHandlerBase, CommunicationManager, Workorder,permit, SynonymDomain, ModelService, MessageService, CommonHandler, FieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, UserManager, PlatformConstants, WpEditSettings, AsyncAwareMixin, Logger, FailureCodeHandler,PersistenceManager,GeoLocationTrackingService,MapProperties) {
	var listSizeArray = ['tasklistsize', 'assignmentlistsize', 'materiallistsize', 'toollistsize', 'actuallaborlistsize', 'actualmateriallistsize', 'actualtoollistsize', 'workloglistsize', 'multiassetloclistsize', 'attachmentssize','permitlistsize'];
	var attributes =    ["tasklist", "assignmentlist", "materiallist", "toollist", "actuallaborlist", "actualmateriallist", "actualtoollist", "workloglist", "multiassetloclist", "attachments","permitlist"];
	var loadingLists = false;
	return declare( [ApplicationHandlerBase, AsyncAwareMixin],  {
		
		//this attribute was inserted to set the location back when canceling 
		curLocation:null,
		curLocationDesc:null,
		currLocationld:null,
		curAsset:null,
		curAssetDesc:null,
		curAssetld:null,
		originalWorkOrder:null,  //used to mark the orig work order as having followup when the followup is saved
		originalQueryBaseIndex:null,
		resolveLocation:null,
		
/**@memberOf application.handlers.WODetailHandler */
		initAssetField: function(eventContext){
			var actualWorkOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			console.log(actualWorkOrder);
			var oslcwpeditsetting = CommonHandler._getAdditionalResource(eventContext,"oslcwpeditsetting");
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
			
			CommonHandler._clearFilterForResource(eventContext,oslcwpeditsetting);

			if(actualWorkOrder == null){
				return;
			}
			
			actualWorkOrder.getRuntimeFieldMetadata('asset').set('readonly',!WpEditSettings.shouldEditAsset(oslcwpeditsetting, 
					SynonymDomain.resolveToInternal(domainAssetstatus,actualWorkOrder.get('status')), actualWorkOrder.get('orgid')));
			
			//set asset description
			if(!actualWorkOrder.get('assetdesc') && actualWorkOrder.get('asset') != null){
				actualWorkOrder.set('assetdesc',actualWorkOrder.get('maxassetdesc'));				
			}
			
			if(actualWorkOrder.status == 'CLOSE'){
				
				actualWorkOrder.getRuntimeFieldMetadata(eventContext.resourceAttribute).set('readonly', true);
			}
		},
		
		hasPermissionToEditAsset: function(eventContext) {
			var actualWorkOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var oslcwpeditsetting = CommonHandler._getAdditionalResource(eventContext,"oslcwpeditsetting");
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
			var showOption = false;
			if(actualWorkOrder != null){
				showOption = WpEditSettings.shouldEditAsset(oslcwpeditsetting, 
						SynonymDomain.resolveToInternal(domainAssetstatus,actualWorkOrder.get('status')), actualWorkOrder.get('orgid'));
			} 
			
			return showOption;
		},
		
		isReadonly: function(eventContext){
			var wo = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if(wo.status == 'CLOSE')
				wo.getRuntimeFieldMetadata(eventContext.resourceAttribute).set('readonly', true);
		},
		
		isReadonly: function(eventContext){
			var wo = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if(wo.status == 'CLOSE')
				wo.getRuntimeFieldMetadata(eventContext.resourceAttribute).set('readonly', true);
		},
		
		initLocationField: function(eventContext){
			var actualWorkOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var oslcwpeditsetting = CommonHandler._getAdditionalResource(eventContext,"oslcwpeditsetting");
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
			
			CommonHandler._clearFilterForResource(eventContext,oslcwpeditsetting);

			if(actualWorkOrder == null){
				return;
			}
			actualWorkOrder.getRuntimeFieldMetadata('location').set('readonly',!WpEditSettings.shouldEditLocation(oslcwpeditsetting, 
					SynonymDomain.resolveToInternal(domainAssetstatus,actualWorkOrder.get('status')), actualWorkOrder.get('orgid')));	
			
			if(actualWorkOrder.status == 'CLOSE'){
				
				actualWorkOrder.getRuntimeFieldMetadata(eventContext.resourceAttribute).set('readonly', true);
			}
			
		},
		
		initEditLocationView: function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			
			this.curLocation = currWO.get("location");
			this.curLocationDesc = currWO.get("locationdesc");
			this.currLocationld = currWO.get("locationld");			
			
			if (this.currLocationld) {
				currWO.set('localLocationLd',this.currLocationld);	
			}
			
			this.curAsset = currWO.get('asset');
			this.curAssetDesc = currWO.get('assetdesc');
			this.curAssetld = currWO.get('assetld');
			
			var woFollowUpInfo = CommonHandler._getAdditionalResource(eventContext,"woFollowUpInfo").getCurrentRecord();			
			woFollowUpInfo.set('isFollowUpSetLoc', true);
			
			if (this.curAssetld) {
				currWO.set('localAssetLd', this.curAssetld);
			}
		},
		
		test: function(eventContext){
			console.log("this is a test");
		},
		
		initEditAssetView: function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
				
			this.curAsset = currWO.get('asset');
			this.curAssetDesc = currWO.get('assetdesc');
			this.curAssetld = currWO.get('assetld');			
			
			if (this.curAssetld) {
				currWO.set('localAssetLd', this.curAssetld);
			}
			this.curLocation = currWO.get('location');
			this.curLocationDesc = currWO.get('locationdesc');
			this.currLocationld = currWO.get("locationld");			
			
			if (this.currLocationld) {
				currWO.set('localLocationLd',this.currLocationld);	
			}
		},
		
		handleBackButtonClickEditAssetView: function(eventContext){
			//cleanupEditAssetView method is invoked as callback of hideCurrentView
			var woFollowUpInfo = CommonHandler._getAdditionalResource(eventContext,"woFollowUpInfo").getCurrentRecord();						
			woFollowUpInfo.set('isFollowUpSetLoc', false);
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		cleanupEditAssetView: function(eventContext){
			//Invoked by back button or Cancel Edit button
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			
			var readOnlyAsset = workOrder.getRuntimeFieldMetadata('asset').get('readonly');
			if (!readOnlyAsset) {
				workOrder.set("asset",this.curAsset);
				workOrder.set("assetdesc",this.curAssetDesc);
				workOrder.set("localAssetLd",this.curAssetld);
			}
			
			var readOnlyLoc = workOrder.getRuntimeFieldMetadata('location').get('readonly');
			if (!readOnlyLoc) {
				workOrder.set("location",this.curLocation);
				workOrder.set("locationdesc",this.curLocationDesc);
				workOrder.set("localLocationLd",this.currLocationld);
			}
		},

		filterLocationForLookup: function(eventContext){

			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			
			//save the current location  to reset case user cancel
			//this was done to fix the issue when making a look up and cancel the value in WO detail location was different of showed in the look up
			if(workOrderSet.getCurrentRecord() != null){
				this.curLocation = workOrderSet.getCurrentRecord().get("location");
				this.curLocationDesc = workOrderSet.getCurrentRecord().get("locationdesc");
				this.currLocationld = workOrderSet.getCurrentRecord().get("locationld");
			}
			
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainAssetstatus');
			var additionallocations = CommonHandler._getAdditionalResource(eventContext,'additionallocations');
			CommonHandler._clearFilterForResource(eventContext,additionallocations);
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			if(siteid == null){
				siteid = UserManager.getInfo("defsite");
			}
			
			var filter = [];
			
			filter.push({siteid: siteid});
			
			additionallocations.lookupFilter = filter;
		},
		
		//Location edit view
		filterLocation: function(eventContext){
			
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			
			//save the current location  to reset case user cancel
			//this was done to fix the issue when making a look up and cancel the value in WO detail location was different of showed in the look up
			this.curLocation = workOrderSet.getCurrentRecord().get("location");
			this.curLocationDesc = workOrderSet.getCurrentRecord().get("locationdesc");
			this.currLocationld = workOrderSet.getCurrentRecord().get("locationld");
			
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainAssetstatus');
			var additionallocations = CommonHandler._getAdditionalResource(eventContext,'additionallocations');
			CommonHandler._clearFilterForResource(eventContext,additionallocations);
			
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			additionallocations.filter('siteid == $1', siteid);
			
			return additionallocations;
		},
		
		
		// -----------------------------------------------------
		// sync version of validateLocation
		validateLocation: function(eventContext){
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			var location = currWO.getPendingOrOriginalValue('location');
			
			if(!location) {
				currWO.set('locationdesc','');
				//Set only for presentation
				currWO.set('localLocationLd', '');
				return ;
			}
			location = location.toUpperCase();
			var additionallocations = CommonHandler._getAdditionalResource(eventContext,'additionallocations');
			CommonHandler._clearFilterForResource(eventContext,additionallocations);
			
			var isValidLocation = additionallocations.find('location == $1', location);
			
			var woFollowUpInfo = CommonHandler._getAdditionalResource(eventContext,"woFollowUpInfo").getCurrentRecord();
			
			if(woFollowUpInfo.get('isFollowUpSetLoc') && isValidLocation.length == 0){
				throw new PlatformRuntimeWarning('invalidLocation');
				return ;
			}else{
				//If asset exists, set the description for it
				currWO.set('location',location);
				currWO.set('locationdesc',isValidLocation[0].get('description'));
				//Set only for presentation
				currWO.set('localLocationLd', isValidLocation[0].get('locationld'));
			}
			
			woFollowUpInfo.set('isFollowUpSetLoc', true);
			
			var asset = currWO.getPendingOrOriginalValue('asset');
			if(asset){			
				var location = currWO.get('location');
				var siteid = currWO.get('siteid');
	
				var assetLoc = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
	
				//Retrieves asset using location and site.
				var assetSet = assetLoc.find('assetnum == $1 && location == $2 && siteid == $3', asset, location, siteid);
	
				//if location of new asset is different from current location, shows dialog
				if(assetSet.length == 0){
					eventContext.ui.show('WorkExecution.WOLocationToAssetDialog');
					return ;
				}
			}
			return;
		},

		// async version of validateLocation
		asyncvalidateLocation: function(eventContext) {
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			
			var location = currWO.getPendingOrOriginalValue('location').toUpperCase();
			var siteid = currWO.get('siteid');
			
			if(!location) {
				currWO.set('locationdesc','');
				currWO.set('localLocationLd', '');
				return;
			}
			
			//defect 113779 - avoid double validation calls
			currWO.set('location',location);			
			// clear this in case promise throws an error
			currWO.set('locationdesc','');

			var locationSetPromise = this.async_cmn_getLocationPromise(location,siteid);		
			this.async_valLoccheckLocationFound(eventContext, currWO, location, locationSetPromise);							
		},
			
		async_valLoccheckLocationFound: function(eventContext, currWO, location, locationSet) {	
			var woFollowUpInfo = CommonHandler._getAdditionalResource(eventContext,"woFollowUpInfo").getCurrentRecord();
			
			if(woFollowUpInfo.get('isFollowUpSetLoc') && locationSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidLocation');
			}
			woFollowUpInfo.set('isFollowUpSetLoc', true);
			
			var handler = eventContext.application['application.handlers.FailureCodeHandler'];
			var validLocation = locationSet.getRecordAt(0);
			
			//If asset exists, set the description for it
			currWO.set('location',location);
			currWO.set('locationdesc',validLocation.get('description'));
			//Set only for presentation
			currWO.set('localLocationLd', validLocation.get('locationld'));
			//Set calibration loop based on Location
			currWO.set('pluscloop', validLocation.get('pluscloop'));
			
			var asset = currWO.getPendingOrOriginalValue('asset');
			if(asset){			
				var location = currWO.get('location');
				var siteid = currWO.get('siteid');
	
				var assetLoc = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
	
				//Retrieves asset using location and site.
				var assetPromise = this.async_cmn_getAssetLocationPromise(asset, location, siteid);
				this.async_valLoccheckAssetFound(eventContext, assetPromise);	
			} else {
				//failure code
				//no asset exists just populate failureclass from loc if different from WO failureclass
				var wofailurecode = currWO.get('failurecode');
				var locfailurecode = validLocation.get('failurecode');
				if (locfailurecode && locfailurecode!=wofailurecode){
					this.setFailureCode(currWO,locfailurecode,validLocation.get('failurecodedesc'));
					handler.populateCurrentFCLevel(eventContext);
					var currentView = eventContext.ui.getCurrentViewControl();
					if (!currentView.id.includes("Lookup"))
						currentView.refresh();				
				}
				
			}			
		},
		
		async_valLoccheckAssetFound: function(eventContext, assetSet) {
			//if location of new asset is different from current location, shows dialog
			if(assetSet.count() == 0){
				this.application.hideBusy();
				eventContext.ui.show('WorkExecution.WOLocationToAssetDialog', null, null, null, true);
			}
		},
//-------------------------------------------------------				
		discardView: function(eventContext){
			//cleanupEditAssetView method is invoked as callback of hideCurrentView
			var woFollowUpInfo = CommonHandler._getAdditionalResource(eventContext,"woFollowUpInfo").getCurrentRecord();						
			woFollowUpInfo.set('isFollowUpSetLoc', false);
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
						
		},
		cleanupEditLocationView: function(eventContext){
			
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			//set back the location
			var readOnlyLoc = workOrder.getRuntimeFieldMetadata('location').get('readonly');
			if (!readOnlyLoc) {
				if(this.curLocation!=null){
					workOrder.set("location",this.curLocation);
					workOrder.set("locationdesc",this.curLocationDesc);
					workOrder.set("localLocationLd",this.currLocationld);
				}
			}

			//Set asset info back
			var readOnlyAsset = workOrder.getRuntimeFieldMetadata('asset').get('readonly');
			if (!readOnlyAsset) {
				workOrder.set("asset",this.curAsset);
				workOrder.set("assetdesc",this.curAssetDesc);			
				workOrder.set("localAssetLd",this.curAssetld);
			}
		},
		
		commitActualLocationEntryView: function(eventContext){
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			
			this.curLocation = currWO.get("location");
			this.curLocationDesc = currWO.get("locationdesc");
			this.currLocationld = currWO.get("locationld");
			
			//WorkAround for the auto complete field 
			//currWO.set('locationdesc', '');
			
			FieldUtil.initCompositeField("location", "locationdesc", "locationanddescription", currWO);
			
			eventContext.ui.hideCurrentView();
			//ModelService.save(workOrderSet);
			
		},
		//end edit Location view
		
		_hasAttachments: function(workOrder){
			if (workOrder){
				var attachments = workOrder.get('attachments');
				return (attachments && attachments.data && attachments.data.length > 0);
			}
			return false;
		},
		
		initNewWorkOrderView : function(eventContext) {

			this.originalWorkOrder = eventContext.application.getResource('workOrder')
				.getCurrentRecord(); //Do this to set the index to return to in case they cancel out.
			//Change the query base of the view
			this.originalQueryBaseIndex = eventContext.ui.getCurrentViewControl().queryBaseIndex;
			
			eventContext.application.setResourceQueryBase(null, 'workOrder', PlatformConstants.CREATED_QUERYBASE).then(function() {
				var domainwostatus = CommonHandler._getAdditionalResource(eventContext,"domainwostatus");
				CommonHandler._clearFilterForResource(eventContext,domainwostatus);
				var status = SynonymDomain.resolveToDefaultExternal(domainwostatus, 'WAPPR');

				var newWo = eventContext.application.getResource('workOrder').createNewRecord();

				newWo.set('status', status);
				//137933: Using Labor's orgid to create new work order instead of orgid associated with default insert site siteid.
				newWo.set('siteid', UserManager.getInfo("defsite"));
				newWo.set('orgid', UserManager.getInfo("deforg"));
				newWo.setDateValue('changestatusdate', eventContext.application.getCurrentDateTime());
				eventContext.application.getResource('workOrder')._asyncUpdateModified();
				eventContext.ui.show('WorkExecution.NewWorkOrderView');
				
				//Need to setup a handler to put away my own view here.. can't rely on cleanup event because I'm async
				eventContext.ui.getViewFromId('WorkExecution.NewWorkOrderView').back=this.discardNewWorkOrderView;
				eventContext.ui.getViewFromId('WorkExecution.NewWorkOrderView').backContext=this;
				
				//Turn on the buttons in case they were turned off
				eventContext.ui.getViewFromId("WorkExecution.NewWorkOrderView").setFooterDisplay(true);	
				eventContext.application.hideBusy();
				
			}.bind(this));
			
		},
		
		discardNewWorkOrderView : function(eventContext) {
			if(eventContext.setFooterDisplay)
				eventContext.setFooterDisplay(true);
			
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			//First cleanup workorder
			var currWO = workOrderSet.getCurrentRecord();
			if(currWO && currWO.isNew() && currWO.get('wonum') == null) {
				currWO.deleteLocal();
			}
			//Remove status filters
			var statuses = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
			CommonHandler._clearFilterForResource(eventContext,statuses);
			var isFollowUp = currWO.get('origrecordid'); 
			if(isFollowUp) {
				this.handleWOSpecResourceWhenGoingBack(eventContext,this.originalWorkOrder);
			} 
			
			
			if(this.originalWorkOrder && isFollowUp){
				//just reset the meters
				this._resetMeters(eventContext, workOrderSet, this.originalWorkOrder);
				eventContext.ui.hideCurrentView();
			} else {
				var self = this;
				
				//This means that we created the workorder
				if (currWO.get("wonum")) {
					//Need to refresh the querybase from the resource
					eventContext.ui.getViewFromId('WorkExecution.WorkItemsView').setQueryBaseIndexByQuery(PlatformConstants.CREATED_QUERYBASE).then(function() {
						eventContext.ui.hideCurrentView();
					});
					this.originalWorkOrder = null;
				} else {
					//When canceling the workorder go back to My AssignedWork
					eventContext.ui.getCurrentViewControl().changeQueryBase.call(eventContext.ui.getViewFromId("WorkExecution.WorkItemsView"),this.originalQueryBaseIndex).then(function() {
						if (self.originalWorkOrder) {
							self._resetMeters(eventContext, workOrderSet, self.originalWorkOrder);
						}
						eventContext.ui.hideCurrentView();
					});
				}
			}
			
		},
		
		_resetMeters: function(eventContext, workOrderSet, originalWorkOrder) {
			
			workOrderSet.setCurrentIndexByRecord(originalWorkOrder);
			this.originalWorkOrder = null;
			
			//reinitialize meters
			if (WL.StaticAppProps.APP_ID == "Inspection") {
				var inspectionhandler = eventContext.application['application.com.Inspection.handlers.InspectionMetersListHandler'];
				promise = inspectionhandler.initializeMeters(eventContext);
			} else {
				var handler = eventContext.application['application.handlers.MetersListHandler'];
				handler.initializeMeters(eventContext);
			}
		},

		commitNewWorkOrderView : function(eventContext) {
			console.log('function: commitNewWorkOrderView called from WODetailHandler');
			eventContext.application.showBusy();
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			var isFollowUp = currWO.get('origrecordid'); 
			var self = this;
			if(isFollowUp && this.originalWorkOrder) {
				//mark original record as having follow-up work
				this.originalWorkOrder.set('hasfollowupwork', true);
				//reset the originalWorkOrder spec values
				workOrderSet.setCurrentIndexByRecord(this.originalWorkOrder);
				this.handleWOSpecResourceWhenGoingBack(eventContext,this.originalWorkOrder);
			}	
			this.originalWorkOrder = null;
			
			if (eventContext.ui.getCurrentViewControl().validate()) {
				ModelService.save(workOrderSet).then(function() {
					var statuses = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
					CommonHandler._clearFilterForResource(eventContext,statuses);
					if (isFollowUp){
						//For follow up, simply hide the current view
						eventContext.ui.hideCurrentView();
					}
					else{
						//Switch to created for new workorders
						eventContext.ui.getViewFromId('WorkExecution.WorkItemsView').setQueryBaseIndexByQuery(PlatformConstants.CREATED_QUERYBASE).then(function() {
							eventContext.ui.hideCurrentView();
						});
						self.originalWorkOrder = null;
					}
				}).
				otherwise(function(err){
					eventContext.application.hideBusy();
					eventContext.ui.showMessage(err);						
				});
			}
		},
		
		createFollowUpAction : function(eventContext) {
			eventContext.application.showBusy();
			var self = this;
			var woSet = eventContext.application.getResource('workOrder');
			ModelService.save(woSet).then(function(woSetSaved) {
				eventContext.createMyResource('woFollowUpInfo');
				self.initFollowUpWorkOrderView(eventContext);
			});
		},

		initFollowUpWorkOrderView : function(eventContext) {
			Logger.trace("[WODetailHandler] Initializing FollowUpWorkOrderView");
			this.originalWorkOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
						
			var woFollowUpInfo = this.application.getResource('woFollowUpInfo').getCurrentRecord();			
			woFollowUpInfo.set('isFollowUpSetLoc', true);

			var domainwostatus = CommonHandler._getAdditionalResource(eventContext,"domainwostatus");
			CommonHandler._clearFilterForResource(eventContext,domainwostatus);
			var status = SynonymDomain.resolveToDefaultExternal(domainwostatus, 'WAPPR');

			var followUp = eventContext.application.getResource('workOrder').createNewRecord();

			// set values for new work order based on originating workorder
			followUp.set('origrecordid', this.originalWorkOrder.get('wonum')); 
			followUp.set('origrecordclass', this.originalWorkOrder.get('woclass'));
			followUp.set('description', this.originalWorkOrder.get('description'));
			followUp.set('asset', this.originalWorkOrder.get('asset'));
			followUp.set('assetdesc', this.originalWorkOrder.get('maxassetdesc'));
			followUp.set('location', this.originalWorkOrder.get('location'));
			followUp.set('locationdesc', this.originalWorkOrder.get('maxlocationdesc'));
			followUp.set('pluscloop', this.originalWorkOrder.get('pluscloop'));
			followUp.set('pluscphyloc', this.originalWorkOrder.get('pluscphyloc'));
			followUp.set('worktype', this.originalWorkOrder.get('worktype'));
			followUp.set('priority', this.originalWorkOrder.get('priority'));
			followUp.set('status', status);
			followUp.setDateValue('changestatusdate', this.application.getCurrentDateTime());
			followUp.set('failurecode', this.originalWorkOrder.get('failurecode'));
			followUp.set('failureCodeDesc', this.originalWorkOrder.get('failureCodeDesc'));
			this.updateFollwupGPSPosition(followUp);
			
			this.originalWorkOrder.getModelDataSet('multiassetloclist', true).then(function(multiAssetLocSet){
				followUp.getModelDataSet('multiassetloclist', true).then(function(followUpMultiAssetLocSet) {
					for(var i=0; i<multiAssetLocSet.count();i++){
						var newRec = followUpMultiAssetLocSet.createNewRecord();
						var currRec = multiAssetLocSet.getRecordAt(i);
						newRec.set('asset', currRec.get('asset'));
						newRec.set('location',currRec.get('location'));
						newRec.set('assetdesc', currRec.get('assetdesc'));
						newRec.set('locationdesc', currRec.get('locationdesc'));
						newRec.set('progress', currRec.get('progress'));
						newRec.set('sequence', currRec.get('sequence'));
					}
				});
			});
			
			
			followUp.set('siteid', this.originalWorkOrder.get("siteid"));
			followUp.set('orgid', this.originalWorkOrder.get('orgid'));
			
			
			if (WL.StaticAppProps.APP_ID!="Inspection"){
				if (this.originalWorkOrder.get('classstructureid') != null) {
					Logger.trace("[WODetailHandler] Found a classification need to copy it to follow on workorder");
					var classstructureid = this.originalWorkOrder.get('classstructureid');
					if(classstructureid==null){
						classstructureid = 'null';
					}			
					var filter = {'classstructureid':classstructureid};
					var class_desc = "";
					var classpath = "";
					
					followUp.set('classstructureid', this.originalWorkOrder.get('classstructureid'));
					
					//need to fetch the classstructure description if it workorder has not been initialized yet.
					ModelService.filtered("classstructure", null, filter, null, false, true).then(function(classStructure){
						if (classStructure.count()>0){
							classpath = classStructure.getCurrentRecord().get('hierarchypath');
							class_desc = classStructure.getCurrentRecord().get('description');
							followUp.set('classificationpath', classpath);
							followUp.set('classificationdesc', class_desc);
						} else {
							followUp.set('classificationpath', '');
							followUp.set('classificationdesc', '');
						}
					});	
					
//					followUp.set('classstructureid', originalWorkOrder.get('classstructureid'));
//					followUp.set('classificationpath', originalWorkOrder.get('classificationpath'));
//					followUp.set('classificationdesc', originalWorkOrder.get('classificationdesc'));
					var self = this;
					//need to load the specification from the  workorder if it has not been initialized yet.
					this.originalWorkOrder.getModelDataSet("workOrderSpec", true).then(function(workOrderSpecs){
						Logger.trace("[WODetailHandler] Found existing specification attributes copying them to follow up");
						Workorder.updateSpecifications(followUp).then(function() {
							var followUpSpecs = followUp['workOrderSpec'];
							var originalSpecs = self.originalWorkOrder['workOrderSpec'];
							arrayUtil.forEach(followUpSpecs.data, function(followUpSpec){
								var origSpec = originalSpecs.find('assetattrid == $1', followUpSpec.get('assetattrid'));
								if (origSpec.length > 0) {
									followUpSpec.set('numvalue', origSpec[0].get('numvalue'));
									followUpSpec.set('alnvalue', origSpec[0].get('alnvalue'));
								}					
							});
							
							eventContext.ui.show("WorkExecution.FollowUpWorkOrderView");
							eventContext.application.hideBusy();
						}); 
				    });
				} else {
					Logger.trace("[WODetailHandler] No classification on the original workorder");
					eventContext.ui.show("WorkExecution.FollowUpWorkOrderView");
					eventContext.application.hideBusy();
				}				
			} else {
				eventContext.ui.show("WorkExecution.FollowUpWorkOrderView");
				eventContext.application.hideBusy();
			}
		},
		//Location dialog
		asyncYesOnWOLocationToAsset: function(eventContext){
			//ghet current WO to clean asset
			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			
			//Store current asset info, in case rollback (Cancel) is need
			this.curAsset = currWO.get('asset');
			this.curAssetDesc = currWO.get('assetdesc');
			this.curAssetld = currWO.get('assetld');
			
			//clear the asset
			currWO.set('asset', '');
			currWO.set('assetdesc', '');
			
			currWO.set('location', currWO.get('location').toUpperCase());
			currWO.set('locationdesc', currWO.get('locationdesc'));
			var siteid = currWO.get('siteid');
			
			FieldUtil.initCompositeField("asset", "assetdesc", "assetnumanddescription", currWO);
			
			//FAILURE CODE FUNCTIONALITY	
			var location = currWO.get('location');
			var woFailureCode = currWO.get('failurecode');
			var locRec = null;
			var locfailurecode = null;
			var handler = eventContext.application['application.handlers.FailureCodeHandler'];
			
			//get location record
			var locationSetPromise = this.async_cmn_getLocationPromise(location,siteid);
			locationSetPromise.then (function(locationSet){
				locRec = locationSet.getRecordAt(0);	
				locfailurecode = locRec.get('failurecode');
				locationSetPromise.resolve;
			});
			
			if (locfailurecode && woFailureCode!=locfailurecode){
				this.setFailureCode(currWO,locfailurecode,locRec.get('failurecodedesc'));
				handler.populateCurrentFCLevel(eventContext);
			}
			
			//hide dialog and Location view
			eventContext.ui.hideCurrentDialog();
			eventContext.ui.getCurrentViewControl().refresh();
			//eventContext.ui.hideCurrentView();
			//ModelService.save(workOrderSet);
		},
		noOnWOLocationToAsset: function(eventContext){
			//dont do anything just hide dialog and Location UI	
			
			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			var siteid = currWO.get('siteid');
			
			currWO.set('location', currWO.get('location').toUpperCase());
			currWO.set('locationdesc', currWO.get('locationdesc'));
			
			//failure reporting functionality
			var asset = currWO.get('asset');
			var location = currWO.get('location');
			var locRec = null;
			var locfailurecode = null;
			
			var locationSetPromise = this.async_cmn_getLocationPromise(location,siteid);
			locationSetPromise.then (function(locationSet){
				locRec = locationSet.getRecordAt(0);	
				locfailurecode = locRec.get('failurecode');
				locationSetPromise.resolve;
			});
			
			var wofailurecode = currWO.get('failurecode');
			var assetfailurecode = null;
			var handler = eventContext.application['application.handlers.FailureCodeHandler'];
			var assetRec = null;
			
			if (asset){
				var assetSetPromise = this.async_cmn_getAssetPromiseNoLocation(asset,siteid);
				assetSetPromise.then(function(assetSet){
					assetRec = assetSet.getRecordAt(0);	
					assetfailurecode = assetRec.get('failurecode');
					assetSetPromise.resolve;
				});
			}
			
			if (assetfailurecode){
				if (wofailurecode!=assetfailurecode){
					if (locfailurecode){
						this.setFailureCode(currWO,locfailurecode,locRec.get('failurecodedesc'));
						handler.populateCurrentFCLevel(eventContext);
					}	
				}
			} else {
				if (locfailurecode){
					this.setFailureCode(currWO,locfailurecode,locRec.get('failurecodedesc'));
					handler.populateCurrentFCLevel(eventContext);
				}	
			}
					
			eventContext.ui.hideCurrentDialog();
			eventContext.ui.getCurrentViewControl().refresh();
			//eventContext.ui.hideCurrentView();
			
			//var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			//ModelService.save(workOrderSet);
		},
		closeOnWOLocationToAsset: function(eventContext){
			//revert the values 	
			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			currWO.set("location",this.curLocation);
			currWO.set("locationdesc",this.curLocationDesc);
			currWO.set("localLocationLd",this.currLocationld);
			eventContext.ui.hideCurrentDialog();
			//eventContext.ui.hideCurrentDialog();
		},
		//end Location dialog
		
		filterWorktype: function(eventContext){
			var additionalworktype = CommonHandler._getAdditionalResource(eventContext,'additionalworktype');
			var domainwoclass = CommonHandler._getAdditionalResource(eventContext,'domainwoclass');

			//Consider on filtering
			//orgid from Workorder entry
			//woclass from query on synonymdomain with (domainid ='WOCLASS' and maxvalue ='WORKORDER')

			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			var woclass = SynonymDomain.resolveToExternal(domainwoclass, 'WORKORDER');
			
			additionalworktype.filter('$1[woclass] && orgid == $2',woclass,orgid);
			
			return additionalworktype;
		},
		
		filterWorktypeForLookup: function(eventContext){
			var additionalworktype = CommonHandler._getAdditionalResource(eventContext,'additionalworktype');
			var domainwoclass = CommonHandler._getAdditionalResource(eventContext,'domainwoclass');

			//Consider on filtering
			//orgid from Workorder entry
			//woclass from query on synonymdomain with (domainid ='WOCLASS' and maxvalue ='WORKORDER')

			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			var woclassList = SynonymDomain.resolveToExternal(domainwoclass, 'WORKORDER');
						
			var filter = arrayUtil.map(Object.keys(woclassList), function(woclass) {
				return {orgid: orgid, woclass: woclass}
			}, this);
			
			additionalworktype.lookupFilter = filter;
		},
				
		//-------------------------------------------------------
		// sync version of validateWorkType 
		validateWorktype : function(eventContext){ 
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var worktype = curr.getPendingOrOriginalValue('worktype');
			
			// We can only validate if worktype is specified
			if(!worktype) return;
			
			var additionalWorktype = this.filterWorktype(eventContext);
			
			var worktypeSet = additionalWorktype.find('worktype == $1', worktype);
			
			if(worktypeSet.length == 0) {
				throw new PlatformRuntimeWarning('invalidWorktype');
			}
		},
		
		// async version of validateWorkType
		asyncvalidateWorktype : function(eventContext) {
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var worktype = curr.getPendingOrOriginalValue('worktype');
			
			// We can only validate if worktype is specified
			if(!worktype) return;
			
			//Only validate the worktype if not a new follow on workorder
			if (curr.get('origrecordid') && curr.isNew()) {
				return;
			}
			
			//defect 113779 - avoid double validation calls
			curr.set('worktype',worktype);
			
			var additionalWorktype = this.filterWorktype(eventContext);
			
			var worktypepromise = this.async_validateWorkTypeGetFilteredSet(worktype, additionalWorktype);
			this.async_validateWorkTypeCheckTypeFound(worktypepromise);			
		},
		
		async_validateWorkTypeGetFilteredSet : function (worktype, additionalWorktype) {			
			var filter = {worktype: worktype};
			return ModelService.filtered(additionalWorktype.getResourceName(), additionalWorktype.getQueryBase(), filter, null, false, true);		
		},
		
		async_validateWorkTypeCheckTypeFound : function (worktypeset) {
			if (worktypeset.count() == 0) {
				throw new PlatformRuntimeWarning('invalidWorktype'); 
			}
		},		
		//-------------------------------------------------------
		

		//----------------------------------------------------
		// sync version of validateAsset
		validateAsset: function(eventContext){
			
			var provider = MapProperties.getProperty('provider');
			var isSpatial = false;
			if (provider != null && provider == "mxspatial") {
				isSpatial = true;
			}
			
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var location = curr.getPendingOrOriginalValue('location');
			var asset = curr.getPendingOrOriginalValue('asset');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
								
			var assetLoc = this.filterAsset(eventContext);
			//Retrieves asset using location and site.

			var assetSet = assetLoc.find('assetnum == $1 && siteid == $2', asset, siteid);

			//If asset is blank, set description as blank, return
			if(!asset){
				curr.set('asset','');
				curr.set('assetdesc','');
				curr.set('localAssetLd', '');
				curr.set('assetnumanddescription', '');
				return;
			}
			
			//Asset exists on the WO site - if 0 is false
			if(assetSet.length == 0) {
				curr.set('assetdesc','');
				curr.set('localAssetLd', '');
				throw new PlatformRuntimeWarning('invalidAsset');
			}else{
				//If asset exists, set the description for it
				curr.set('assetdesc',assetSet[0].get('description'));
				//Set only for presentation
				curr.set('localAssetLd', assetSet[0].get('assetlongdesc'));
			}				
			
			//If location is set on the WO
			if(location){				
				assetSet = assetLoc.find('assetnum == $1 && location == $2 && siteid == $3', asset, location, siteid);
				
				//asset's location is the same is already set on view - if 0 is false
				if(assetSet.length == 0){
					//Need to check that the asset actually has a location before popping the dialog 
					var additionalasset = CommonHandler._getAdditionalResource(eventContext,"additionalasset");
					var selectedAssetsLocation = CommonHandler._getAssetLocation(eventContext, additionalasset, asset, siteid);
					if (selectedAssetsLocation) {
						//TODO remove this assigment when defect 104985 is fixed
						curr.set('asset', asset);
						this.application.hideBusy();
						eventContext.ui.show('WorkExecution.WOAssetToLocationDialog');
						
						//if Yes, set asset and location from lookup : yesOnWOAssetToLocation
						//if Not, set asset and keep the location as it is : noOnWOAssetToLocation
						//if Close, do nothing : closeOnWOAssetToLocation
					} else {
						if (isSpatial == true) {
							eventContext.ui.show('WorkExecution.WorkDetailView');
						}
					}
					return;
				} else {
					if (isSpatial == true) {
						eventContext.ui.show('WorkExecution.WorkDetailView');
					}
				}
			}else{
				//If there is no location set on the WO, sets the asset's location then
				var additionalasset = CommonHandler._getAdditionalResource(eventContext,"additionalasset");
				var loc = CommonHandler._getAssetLocation(eventContext, additionalasset, asset, siteid);
				curr.set('location', loc);
				
				//Get Location description
				var additionallocations = CommonHandler._getAdditionalResource(eventContext,"additionallocations");
				var locObj = CommonHandler._getLocationByID(eventContext,additionallocations,loc,siteid);
				if (locObj != null) {
					curr.set('locationdesc', locObj.get('description'));
				}
				
				if (isSpatial == true) {
					eventContext.ui.show('WorkExecution.WorkDetailView');
				}
				
			}
		},
		
		// async version of validateAsset
		asyncvalidateAsset: function(eventContext){
			var curWO = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var location = curWO.getPendingOrOriginalValue('location');
			var asset = curWO.getPendingOrOriginalValue('asset');
			//defect 113779 - set uppercase asset value prior to running validation to prevent  
			// duplicate validation calls if a user enters an asset with a lowercase value.
			//curWO.set('asset',asset);
			
			//If asset is blank, set description as blank, return
			if(!asset){
				curWO.set('asset', null);
				curWO.set('assetdesc','');
				curWO.set('localAssetLd', '');
				curWO.set('assetnumanddescription', '');
				return;
			}

			var siteid = CommonHandler._getWorkorderSiteId(eventContext);								
			var assetLoc = this.filterAsset(eventContext);
//			var assetLoc = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			//Retrieves asset using location and site.
			var assetPromise = this.async_cmn_getAssetPromise(assetLoc, asset, siteid);
			this.async_va_CheckAssetFound(curWO, assetPromise, asset, location, siteid, eventContext);								
		},
				
		async_va_CheckAssetFound : function (curWO, assetSet, asset, location, siteid, eventContext) {
			if (assetSet.count() == 0) {
				curWO.set('assetdesc','');
				curWO.set('localAssetLd', '');
				// before we throw, refresh?
				
				//Only validate the asset if not a new follow on workorder
				if (!(curWO.get('origrecordid') && curWO.isNew())) {
					throw new PlatformRuntimeWarning('invalidAsset'); 
				}	
			}
			else{
				//If asset exists, set the description for it
				var newAsset = assetSet.getRecordAt(0);
				curWO.set('assetdesc',newAsset.get('description'));
				//Set only for presentation
				var assetLD = newAsset.get('assetlongdesc');
				curWO.set('localAssetLd', (assetLD == null?'':assetLD));	
			}
			
			//If location is set on the WO
			if(location){				
				var assetLocPromise = this.async_cmn_getAssetLocationPromise(asset, location, siteid);
				this.async_va_CheckAssetLocFound(curWO, eventContext, asset, siteid, assetLocPromise);
			}else{
				
				this.async_va_SetAssetLocation(eventContext, asset, siteid, curWO);
				
				// check if asset has a failurecode
				var assetFailureCode = newAsset.get('failurecode');
				var woFailureCode = curWO.get("failurecode");
				var handler = eventContext.application['application.handlers.FailureCodeHandler'];
				
				if (woFailureCode){
					if (assetFailureCode){
						if (assetFailureCode!=woFailureCode){
							this.setFailureCode(curWO,newAsset.get('failurecode'),newAsset.get('failurecodedesc'));
							handler.populateCurrentFCLevel(eventContext);
							var currentView = eventContext.ui.getCurrentViewControl();
							if (!currentView.id.includes("Lookup"))
								currentView.refresh();							
						}
					}
				} else {
					if (assetFailureCode){
						this.setFailureCode(curWO,newAsset.get('failurecode'),newAsset.get('failurecodedesc'));
						handler.populateCurrentFCLevel(eventContext);
						var currentView = eventContext.ui.getCurrentViewControl();
						if (!currentView.id.includes("Lookup"))
							currentView.refresh();
					}
				}
	
			}
			
			
		},		
		
		async_va_SetAssetLocation : function (eventContext, asset, siteid, curWO) {
			//If there is no location set on the WO, sets the asset's location then
			var additionalasset = CommonHandler._getAdditionalResource(eventContext,"additionalasset");
			assetLocPromise = this.async_cmn_getAssetPromise(additionalasset, asset, siteid);
			this.async_va_getAssetLocation(assetLocPromise, curWO, eventContext, siteid);	
		},
						
		async_va_CheckAssetLocFound : function (curWO, eventContext, asset, siteid, assetSet) {
			//asset's location is the same is already set on view - if 0 is false
			if(assetSet.count() == 0){
				//Need to check that the asset actually has a location before popping the dialog 
				var additionalasset = CommonHandler._getAdditionalResource(eventContext,"additionalasset");
				var addAssetPromise = this.async_cmn_getAssetPromise(additionalasset, asset, siteid);
				this.async_va_getAssetLocation_selAsset(addAssetPromise, curWO, eventContext);
			} else {
				//need to verify failure code is up to date.
				//failure reporting functionality
				var asset = curWO.getPendingOrOriginalValue('asset');
				var location = curWO.get('location');
				var locRec = null;
				var locfailurecode = null;
				
				var locationSetPromise = this.async_cmn_getLocationPromise(location,siteid);
				locationSetPromise.then (function(locationSet){
					locRec = locationSet.getRecordAt(0);	
					locfailurecode = locRec.get('failurecode');
					locationSetPromise.resolve;
				});
				
				var wofailurecode = curWO.get('failurecode');
				var assetfailurecode = null;
				var handler = eventContext.application['application.handlers.FailureCodeHandler'];
				var assetRec = null;
				
				if (asset){
					var assetSetPromise = this.async_cmn_getAssetPromiseNoLocation(asset,siteid);
					assetSetPromise.then(function(assetSet){
						assetRec = assetSet.getRecordAt(0);	
						assetfailurecode = assetRec.get('failurecode');
						assetSetPromise.resolve;
					});
				}
				
				if (assetfailurecode){
					if (wofailurecode!=assetfailurecode){
						this.setFailureCode(currWO,assetfailurecode,assetRec.get('failurecodedesc'));
						handler.populateCurrentFCLevel(eventContext);
					}
				} else {
					if (locfailurecode){
						this.setFailureCode(currWO,locfailurecode,locRec.get('failurecodedesc'));
						handler.populateCurrentFCLevel(eventContext);
					}	
				}
						
				eventContext.ui.getCurrentViewControl().refresh();
			}				
		},

		async_va_getAssetLocation_selAsset : function(assetSet, curWO, eventContext) {
			if (assetSet.count() > 0) {
				//TODO remove this assigment when defect 104985 is fixed
				curWO.set('asset', assetSet.getRecordAt(0).assetnum);
				this.resolveLocation = assetSet.getRecordAt(0).location;
				this.application.hideBusy();
				if (this.resolveLocation) {
					eventContext.ui.show('WorkExecution.WOAssetToLocationDialog', null, null, null, true);
				} else {
					eventContext.ui.show('WorkExecution.WOAssetToNoLocationDialog', null, null, null, true);
				}
				//if Yes, set asset and location from lookup : yesOnWOAssetToLocation
				//if Not, set asset and keep the location as it is : noOnWOAssetToLocation
				//if Close, do nothing : closeOnWOAssetToLocation
			}			
		},
				
		async_va_getAssetLocation : function(assetSet, curWO, eventContext, siteid) {
			if (assetSet.count() > 0) {
				var loc = assetSet.getRecordAt(0).get('location');
				//curWO.set('location', loc);
				
				//initialize in-memory resource
				var woFollowUpInfoRes = this.application.getResource('woFollowUpInfo');
				if ( woFollowUpInfoRes)
				{
					var woFollowUpInfo = woFollowUpInfoRes.getCurrentRecord();
			
					if( woFollowUpInfo != null && curWO.get('origrecordid')!=null && woFollowUpInfo.get('isFollowUpSetLoc')) {
						if (!curWO.get('location'))
							curWO.set('location',loc);
						woFollowUpInfo.set('isFollowUpSetLoc', false);
					} else {
						curWO.set('location', loc);	
					}
				}
				else
				{
					curWO.set('location', loc);	
				}
				
				//Get Location description				
				var additionallocations = CommonHandler._getAdditionalResource(eventContext,"additionallocations");				
				
				if (!additionallocations) {
					eventContext.getModelDataSet('additionallocations').then(function(addlocations){
						additionallocations = addlocations;
					});
				}
				
				if (additionallocations) {
					var locationPromise = this.async_cmn_getLocationByIDPromise(additionallocations, loc, siteid);
					this.async_va_getLocationByID(locationPromise, curWO, assetSet, eventContext);	
				}				
			}
			else {
				curWO.set('location', null);
			}			
		},
		
		//Reusable method: Get Location Object
		async_va_getLocationByID : function(locSet, curWO, assetSet, eventContext) {
			if (locSet.count() > 0) {
				curWO.set('locationdesc', locSet.getRecordAt(0).get('description'));
				
				//Failure Code Functionality
				var woFailureCode = curWO.get('failurecode');
				var assetFailureCode = assetSet.getRecordAt(0).failurecode;
				var locFailureCode = locSet.getRecordAt(0).get('failurecode');
				var handler = eventContext.application['application.handlers.FailureCodeHandler'];
				
				if (locFailureCode){
					if (woFailureCode){
						if(woFailureCode!=assetFailureCode){
							this.setFailureCode(curWO,locFailureCode,locSet.getRecordAt(0).get('failurecodedesc'));
							handler.populateCurrentFCLevel(eventContext);
							var currentView = eventContext.ui.getCurrentViewControl();
							if (!currentView.id.includes("Lookup")) {
							eventContext.ui.getCurrentViewControl().refresh();
						}
						}
					} else {
						this.setFailureCode(curWO,locFailureCode,locSet.getRecordAt(0).get('failurecodedesc'));
						handler.populateCurrentFCLevel(eventContext);
						var currentView = eventContext.ui.getCurrentViewControl();
						if (!currentView.id.includes("Lookup")) {
						eventContext.ui.getCurrentViewControl().refresh();
					}	
				}
				
			}
			}
			else {
				curWO.set('locationdesc', null);
			}
		},
		
		//----------------------------------------------------		
		resolveExistingAsset: function(eventContext){
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");			
			
			var currWO = workOrderSet.getCurrentRecord();
			
			var asset = currWO.get('asset');
						
			return [asset];			
		},
		resolveAssetLocation: function(eventContext){
			if (this.resolveLocation) {
				return [this.resolveLocation,this.resolveLocation];				
			}
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var additionalasset = CommonHandler._getAdditionalResource(eventContext,"additionalasset");
			
			var currWO = workOrderSet.getCurrentRecord();
			var siteid = currWO.get('siteid');
			//var currLoc = currWO.getPendingOrOriginalValue('location');
			//if(!currLoc) {currLoc = '';}
			
			var asset = currWO.getPendingOrOriginalValue('asset');
			
			//Retrieves location from selected asset and set it to WO
			var assetLoc = this.filterAsset(eventContext);
			var loc = CommonHandler._getAssetLocation(eventContext, additionalasset, asset, siteid);
			if (!loc)
				loc='';
			//return [currLoc,loc];	
			return [loc,loc];
		},		
		// ------------------------------------------------------------------------------------
		// sync version of yesOnWOAssetToLocation
		yesOnWOAssetToLocation: function(eventContext){
			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
			var additionalasset = CommonHandler._getAdditionalResource(this,"additionalasset");
			
			var currWO = workOrderSet.getCurrentRecord();
			var siteid = currWO.get('siteid');
			
			//TODO get current asset (new) and retrieve the location
			//TODO remove this assigment when defect 104985 is fixed
			var asset = currWO.get('asset');
			
			//Retrieves location from selected asset and set it to WO
			var assetLoc = this.filterAsset(eventContext);
			var loc = CommonHandler._getAssetLocation(this, additionalasset, asset, siteid);
			if (loc) {
				currWO.set('location', loc);

				//Get Location description			
				var additionallocations = CommonHandler._getAdditionalResource(this,"additionallocations");
				var locObj = CommonHandler._getLocationByID(this,additionallocations,loc,siteid);
				currWO.set('locationdesc', locObj.get('description'));
			} else {
                currWO.set('location', null);
                currWO.set('locationdesc', null);
            }
			
			//Hide dialog and asset edit view
			eventContext.ui.hideCurrentDialog();
		},
		// async version of yesOnWOAssetToLocation
		asyncyesOnWOAssetToLocation: function(eventContext){
			this.resolveLocation = null;
			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
			var additionalasset = CommonHandler._getAdditionalResource(this,"additionalasset");
			
			var curWO = workOrderSet.getCurrentRecord();
			var siteid = curWO.get('siteid');
			
			//TODO get current asset (new) and retrieve the location
			//TODO remove this assigment when defect 104985 is fixed
			var asset = curWO.get('asset');
			
			//Retrieves location from selected asset and set it to WO
			var assetLoc = this.filterAsset(eventContext);
			var assetPromise = this.async_cmn_getAssetPromise(additionalasset, asset, siteid);
			this.async_yonwoa_getAssetLocation(assetPromise, curWO, eventContext, siteid )			
		},				
		async_yonwoa_getAssetLocation : function(assetSet, curWO, eventContext, siteid) {
			var provider = MapProperties.getProperty('provider');
			var isSpatial = false;
			if (provider != null && provider == "mxspatial") {
				isSpatial = true;
			}

			if (assetSet.count() > 0) {
				var loc = assetSet.getRecordAt(0).location;
				curWO.set('location', loc);
				//Get Location description			
				var additionallocations = CommonHandler._getAdditionalResource(this,"additionallocations");
				var locObjPromise = this.async_cmn_getLocationByIDPromise(additionallocations,loc,siteid);
				this.async_yonwoa_getLocationByID(locObjPromise, curWO, eventContext, assetSet);
			} else {
				curWO.set('location', null);
				curWO.set('locationdesc', null);
            }
			eventContext.ui.hideCurrentDialog();
			eventContext.ui.getCurrentViewControl().refresh();
			if (isSpatial == true) {
				eventContext.ui.show('WorkExecution.WorkDetailView');
			}
			
		},		
		
		async_yonwoa_getLocationByID : function(locSet, curWO, eventContext, assetSet) {
			if (locSet.count() > 0 ) {				
				curWO.set('locationdesc', locSet.getRecordAt(0).get('description'));
			}			

			//Failure Code Functionality
			var woFailureCode = curWO.get('failurecode');
			var assetFailureCode = assetSet.getRecordAt(0).failurecode;
			var locFailureCode = null;
			var handler = eventContext.application['application.handlers.FailureCodeHandler'];
			
			if (locSet.getRecordAt(0)){
				locFailureCode = locSet.getRecordAt(0).get('failurecode');
			}
			
			if (woFailureCode){
				if (assetFailureCode){
					if (assetFailureCode!=woFailureCode){
						this.setFailureCode(curWO,assetFailureCode,assetSet.getRecordAt(0).get('failurecodedesc'));
					} 
				} else {
					if (locFailureCode){
						if (locFailureCode!=woFailureCode){
							this.setFailureCode(curWO,locFailureCode,locSet.getRecordAt(0).get('failurecodedesc'));
						}
					}
				}	
			} else {
				if (assetFailureCode){
					this.setFailureCode(curWO,assetFailureCode,assetSet.getRecordAt(0).get('failurecodedesc'));
				} else {
					this.setFailureCode(curWO,locFailureCode,locSet.getRecordAt(0).get('failurecodedesc'));
				}
			}
			
			handler.populateCurrentFCLevel(eventContext);
			
			//Hide dialog and asset edit view
			eventContext.ui.hideCurrentDialog();
			eventContext.ui.getCurrentViewControl().refresh();
		},
		//-------------------------------------------------------
		
		noOnWOAssetToLocation: function(eventContext){
			var provider = MapProperties.getProperty('provider');
			var isSpatial = false;
			if (provider != null && provider == "mxspatial") {
				isSpatial = true;
			}
			this.resolveLocation = null;
			var currWO = CommonHandler._getAdditionalResource(this,'workOrder').getCurrentRecord();
			var siteid = currWO.get('siteid');

			//failure reporting functionality
			var asset = currWO.get('asset');
			var assetfailurecode = null;
			var handler = eventContext.application['application.handlers.FailureCodeHandler'];
			var assetRec = null;
			
			if (asset){
				var assetSetPromise = this.async_cmn_getAssetPromiseNoLocation(asset,siteid);
				assetSetPromise.then(function(assetSet){
					assetRec = assetSet.getRecordAt(0);	
					assetfailurecode = assetRec.get('failurecode');
					assetSetPromise.resolve;
				});
			
			}
			
			if (assetfailurecode){
				this.setFailureCode(currWO,assetfailurecode,assetRec.get('failurecodedesc'));
				handler.populateCurrentFCLevel(eventContext);
			}

			
			//TODO - need check better the behavior			
			eventContext.ui.hideCurrentDialog();
			eventContext.ui.getCurrentViewControl().refresh();

			if (isSpatial == true) {
				eventContext.ui.show('WorkExecution.WorkDetailView');
			}
		},
		closeOnWOAssetToLocation: function(eventContext){
			var provider = MapProperties.getProperty('provider');
			var isSpatial = false;
			if (provider != null && provider == "mxspatial") {
				isSpatial = true;
			}
			this.resolveLocation = null;
			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			currWO.set("asset",this.curAsset);
			currWO.set("assetdesc",this.curAssetDesc);
			currWO.set("localAssetLd",this.currAssetld);
			eventContext.ui.hideCurrentDialog();
			if (isSpatial == true) {
				eventContext.ui.show('WorkExecution.WorkDetailView');
			}
		},
		
		filterAssetForLookup: function(eventContext){
			console.log("filterAssetForLookup")
			var additionalasset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			additionalasset._lookupFilter = null;

			//save the current asset so we can reset it if the user has to revert the value
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			if(workOrderSet.getCurrentRecord() != null){
				this.curAsset = workOrderSet.getCurrentRecord().get("asset");
				this.curAssetDesc = workOrderSet.getCurrentRecord().get("assetdesc");
				this.curAssetld = workOrderSet.getCurrentRecord().get("assetld");
			}

			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			if(siteid == null){
				siteid = UserManager.getInfo("defsite");
			}
			
			var filter = [];
			
			filter.push({siteid: siteid});
			
			additionalasset.lookupFilter = filter;			
		},
		
		filterAsset: function(eventContext){
			
			var additionalasset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			CommonHandler._clearFilterForResource(eventContext,additionalasset);
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
 	
			additionalasset.filter('siteid == $1', siteid);
			
			return additionalasset;
			
		},

		// cleanup event handler
		handleBackButtonClick: function(eventContext){
			var actualAsset=eventContext.getCurrentRecord();
			
			//FIXME: this is a temporary workaround until ModelData._isNew is fixed to reflect if record has been saved or not
			if(!actualAsset.get("dontDiscard")){
				actualAsset.deleteLocal();
			}
		},
		
		commitAssetEntryView: function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			
			//Make sure temporary variables are set to the final values
			//This is necessary because hideCurrentView calls cleanup event
			this.curAsset = currWO.get('asset');
			this.curAssetDesc = currWO.get('assetdesc');
			this.curAssetld = currWO.get('assetld');
	
			this.curLocation = currWO.get('location');
			this.curLocationDesc = currWO.get('locationdesc');
			this.currLocationld = currWO.get('locationld');
			
			eventContext.ui.hideCurrentView();
		},
		
		clearSearchFields: function(eventContext){
			eventContext.application.getResource("searchWorkOrder").createNewRecord();
		},
		
		initSearchData: function(eventContext){
			var searchData = eventContext.application.getResource("searchWorkOrder");
			if(searchData == null || searchData.getCurrentRecord() == null){
				searchData.createNewRecord();
			}
			eventContext.application.ui.savedQueryIndex = eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').queryBaseIndex;
		},
		
		showSearch: function(eventContext){
			eventContext.application.ui.showAllStatus = true;			
		},
		
		hideSearch: function(eventContext){
			if(eventContext.application.ui.transitionInfo.id != "WorkExecution.statusLookup"){
				eventContext.application.ui.showAllStatus = false;			
			}
		},
		
		setSearchQuery: function(eventContext){
			eventContext.application.showBusy();
			var search = eventContext.application.getResource("searchWorkOrder").getCurrentRecord();
			var filteredItems = 0;			
			var filter = {istask:false};
			
			if (search.wonum){
			    filter.wonum = '%'+search.wonum+'%';
			    filteredItems++;
			}
			if (search.description){
			    filter.description = '%'+search.description+'%';
			    filteredItems++;
			}
			if (search.status){
			    filter.status = search.status;
			    filteredItems++;
			}
			if (search.asset){
			    filter.assetancestor = '%'+search.asset+'%';
			    filteredItems++;
			}
			if (search.location){
			    filter.locationancestor = '%'+search.location+'%';
			    filteredItems++;
			}
			if (search.priority){
			    filter.priority = search.priority;
			    filteredItems++;
			}				
			var statusDateRangeFilter = {};
			if (search.startdate){
			    statusDateRangeFilter.from = search.getAsDateOrNull("startdate");
			}
			if (search.enddate){
			    statusDateRangeFilter.to = search.getAsDateOrNull("enddate");
			}
			if (search.startdate || search.enddate){
				filter["starttime"] = statusDateRangeFilter;
			    filteredItems++;
			}
			
			if(filteredItems == 0){
				eventContext.ui.show('WorkExecution.RequiredSearchFieldMissing');
				return;
			}
			var self = this;
			eventContext.application.ui.performSearch = true;
			ModelService.clearSearchResult(eventContext.application.getResource('workOrder')).then(function(){
				 ModelService.empty('workOrder').then(function(){
					 eventContext.ui.getViewFromId('WorkExecution.WorkItemsView').setQueryBaseIndexByQuery(PlatformConstants.SEARCH_RESULT_QUERYBASE).then(function(){
						// eventContext.ui.show('WorkExecution.WorkItemsView');
						 eventContext.application.showBusy();
						 PersistenceManager.removeQuerybase('workOrder', PlatformConstants.SEARCH_RESULT_QUERYBASE);
						 self.populateSearch(eventContext);
					 });
				 });
			});
		},
		
		showBusyList: function(eventContext){
			if(eventContext.application.ui.performSearch){
				this.application.showBusy();
				eventContext.application.ui.performSearch = false;
			}
		},
		
		populateSearch: function(eventContext){
			var view = eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView');
			if(eventContext.application.ui.performSearch){
				if(eventContext.application.getResource("searchWorkOrder") == null){ //TODO:  might be nice to still open to last search
					//must be first login.  If search was last page view just default to 0 index because search resource has been discarded.
					view.changeQueryBase(0);
				    var queryBase = view.queries.children[0].queryBase;
					ModelService.all('workOrder', queryBase).then(function(modelDataSet){
						modelDataSet.resourceID = 'workOrder';
						eventContext.application.addResource(modelDataSet);
						eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].refresh();
					})
					return;
				}
				var indexOfSearch = 0;
				var i = 0;
				if(view.queries && view.queries != null){
					while(i < view.queries.children.length){
						if(view.queries.children[i].queryBase == PlatformConstants.SEARCH_RESULT_QUERYBASE){
							indexOfSearch = i;
							i = view.queries.children.length;
						}
						i++;
					}
					view.changeQueryBase(indexOfSearch);
				}
				var search = eventContext.application.getResource("searchWorkOrder").getCurrentRecord();
				
				var filter = {istask: false};
								
				var filteredItems = 0;
				if (search.wonum){
				    filter.wonum = '%'+search.wonum+'%';
				    filteredItems++;
				}
				if (search.description){
				    filter.description = '%'+search.description+'%';
				    filteredItems++;
				}
				if (search.status){
				    filter.status = search.status;
				    filteredItems++;
				}
				if (search.priority){
				    filter.priority = search.priority;
				    filteredItems++;
				}				
				var statusDateRangeFilter = {};
				if (search.startdate){
				    statusDateRangeFilter.from = search.getAsDateOrNull("startdate");
				}
				if (search.enddate){
				    statusDateRangeFilter.to = search.getAsDateOrNull("enddate");
				}
				if (search.startdate || search.enddate){
					filter["starttime"] = statusDateRangeFilter;
				    filteredItems++;
				}
				
				var oslcQueryParameters = {};
				if (search.asset){
				    oslcQueryParameters['sqp:asset'] =  '%'+search.asset+'%';
				    filteredItems++;
				}
				if (search.location){
				    oslcQueryParameters['sqp:location'] =  '%'+search.location+'%';
				    filteredItems++;
				}
				if(filteredItems == 0){
					eventContext.application.showMessage(MessageService.createStaticMessage('norecords').getMessage());
					eventContext.application.ui.performSearch = false;
					eventContext.application.hideBusy();
					return;
				}
				
				filter = this.buildFilterForWOClass(eventContext,[filter]);
				var self = this;
				CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
					eventContext.application.showBusy();
					if (hasConnectivity){
						var currentWoSet = eventContext.application.getResource('workOrder');
						if (currentWoSet.getPersistentFilter()){
						     ModelService.clearSearchResult(currentWoSet).
						     then(function(){
						    	 
									ModelService.filtered('workOrder', PlatformConstants.SEARCH_RESULT_QUERYBASE, filter, null, null, null, oslcQueryParameters).then(function(resourceSet){
										
										eventContext.ui.show('WorkExecution.WorkItemsView');
										if (!resourceSet.fetchedFromServer){
											self._showSearchFailedMessageNoConnectivity(eventContext);
											return;
										}

										resourceSet.resourceID = 'workOrder';
										eventContext.application.addResource(resourceSet);
										if(resourceSet.count() == 0){
											ModelService.clearSearchResult(resourceSet);
											eventContext.application.showMessage(MessageService.createStaticMessage('norecords').getMessage());
											eventContext.application.ui.performSearch = false;
										}
										else{
											resourceSet.setCurrentIndex(0);
										}
										eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].refresh();
										eventContext.application.hideBusy();
									});
						     });
						} else {
							ModelService.filtered('workOrder', PlatformConstants.SEARCH_RESULT_QUERYBASE, filter, null, null, null, oslcQueryParameters).then(function(resourceSet){
								eventContext.ui.show('WorkExecution.WorkItemsView');
								if (!resourceSet.fetchedFromServer){
									self._showSearchFailedMessageNoConnectivity(eventContext);
									return;
								}

								resourceSet.resourceID = 'workOrder';
								eventContext.application.addResource(resourceSet);
								if(resourceSet.count() == 0){
									ModelService.clearSearchResult(resourceSet);
									eventContext.application.showMessage(MessageService.createStaticMessage('norecords').getMessage());
									eventContext.application.ui.performSearch = false;
								}
								else{
									resourceSet.setCurrentIndex(0);
								}
								eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].refresh();
								eventContext.application.hideBusy();
							});
						}
					}
					else{
						self._showSearchFailedMessageNoConnectivity(eventContext);
					}
				});
			}
		},
		
		_showSearchFailedMessageNoConnectivity: function(eventContext){
			eventContext.application.showMessage(MessageService.createStaticMessage('downloadFailedNoConnectivity').getMessage());
			if(eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].baseWidget){
				eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].refresh();
			}
			eventContext.application.hideBusy();
			eventContext.application.ui.performSearch = false;
		},

		async_cmn_getLocationPromise: function(location,siteid) {
			return ModelService.filtered('additionallocations', null, [{location: location, siteid: siteid}], null, false, true);
		},

		async_cmn_getAssetLocationPromise: function(assetnum, location, siteid) {
			return ModelService.filtered('additionalasset', null, [{assetnum: assetnum, location: location, siteid: siteid}], null, false, true);
		},

		async_cmn_getAssetPromiseNoLocation: function(assetnum, siteid) {
			return ModelService.filtered('additionalasset', null, [{assetnum: assetnum, siteid: siteid}], null, false, true);
		},
		
		async_cmn_getAssetPromise : function(additionalassets, asset, siteid) {	
			if (asset) {
				var filter = {assetnum: asset, siteid:siteid};
				return ModelService.filtered(additionalassets.getResourceName(), additionalassets.getQueryBase(), filter, null, false, true);
			} else {
				return ModelService.empty(additionalassets.getResourceName(), additionalassets.getQueryBase());
			}
		},
		
		async_cmn_getLocationByIDPromise : function(additionallocations, location, siteid) {
			if (location) {
				var filter = {location: location, siteid:siteid};
				return ModelService.filtered(additionallocations.getResourceName(), additionallocations.getQueryBase(), filter, null, false, true);
			} else {
				return ModelService.empty(additionallocations.getResourceName(), additionallocations.getQueryBase());
			}
		},
		
		discardSummaryView: function(eventContext){
			
			var view = eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView');
			view.changeQueryBase(eventContext.application.ui.savedQueryIndex);
		    var queryBase = view.queries.children[eventContext.application.ui.savedQueryIndex].queryBase;
			ModelService.all('workOrder', queryBase).then(function(modelDataSet){
				modelDataSet.resourceID = 'workOrder';
				eventContext.application.addResource(modelDataSet);
				eventContext.application.ui.getViewFromId('WorkExecution.WorkItemsView').lists[0].refresh();
			})
		},

		refreshAllListSizes: function(eventContext){	
			if(!loadingLists){
				var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
				attributes.forEach(function(listAttribute, index){
					var list = workOrder.getLoadedModelDataSetOrNull(listAttribute);
					var cachedList = eventContext.application.getResource('workOrder.' + listAttribute);
					if (cachedList && cachedList.isDirty()){
						//race condition:
						//related resource changes weren't updated to jsonstore
						//before we get here, so rely on what's in memory that's
						//most accurate state until data goes to server
						
						list = cachedList;
					}

					if (list && listAttribute === 'attachments'){
						list.clearFilterAndSort();
						//list.filter("urlType == null || urlType == 'FILE'");
					}
					
					/* if we created some new record in the set, show it regardless if we downloaded data or not */
					if(list && (workOrder.isComplexAttributeLoaded(listAttribute) || list.count() > 0)){
						workOrder.set(listSizeArray[index], list.count() + "");
					}else{
						workOrder.set(listSizeArray[index], "--");
					}
				});

			}			
		},
		
		fetchAllListSizes: function(eventContext){
			var workOrder = eventContext.application.getResource('workOrder').getCurrentRecord();
			var self = this;
			listSizeArray.forEach(function(listSizeAttribute){
				workOrder.set(listSizeAttribute, "--");
			});
			if(workOrder.wasCommittedToServer()){
				loadingLists = true;
				//Check to see if any of the list resources are required resources for the view.  If so, ignore the fetch because it's already
				//been fetched and possibly updated by a handler or user input by the time the fetch returns.
				var fetchList = new Array();
				if (eventContext.viewControl.requiredResources && eventContext.viewControl.requiredResources.workOrder && eventContext.viewControl.requiredResources.workOrder.related){
					var relatedList = eventContext.viewControl.requiredResources.workOrder.related;
					attributes.forEach(function(listAttribute, index){
						if (!relatedList['workOrder.'+listAttribute]){
							fetchList.push(listAttribute);
						}
					});	
				}
				else{
					fetchList = attributes;
				}
				ModelService.multipleChildrenOf(workOrder, fetchList).always(function(){
					loadingLists = false;
					self.refreshAllListSizes(eventContext);
				});
			}
			else{
				self.refreshAllListSizes(eventContext);
			}
		},
		
		hideDialog : function(eventContext){
			eventContext.ui.hideCurrentDialog();
		},
		
		selectableWOClassAsFilter: function(eventContext){
			var domainwoclass = CommonHandler._getAdditionalResource(eventContext,'domainwoclass');	
			var internalClasses = ['WORKORDER','ACTIVITY'];
			var filter = [];
			arrayUtil.forEach(internalClasses, function(anClass){
				CommonHandler._clearFilterForResource(eventContext, domainwoclass);
				var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainwoclass, anClass));
				arrayUtil.forEach(externalOnes, function(aValue){
					filter.push({"woclass": aValue});
				});
			});
			CommonHandler._clearFilterForResource(eventContext, domainwoclass);
			return filter;
		},
		
		buildFilterForWOClass: function(eventContext, filter){
			
			var woClasses = this.selectableWOClassAsFilter(eventContext);
			return arrayUtil.map(woClasses, function(anClass){
				var result = lang.mixin({}, anClass);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});		
		},
		
		populateFailureClass: function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var failurecode = currWO.get("failurecode");

			eventContext.getResource().getRecordAt(0).set("failureClass", failurecode);
		},
		
		hideShowFailureClassLabel : function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var failureList = currWO.failureReportlist;
			var lastFC = "";
			if (failureList){
				lastFC = currWO.failureReportlist.data[currWO.failureReportlist.data.length-1];
			}

			if (lastFC){
				eventContext.setDisplay(false);
				currWO["failureTypeVisibility"]=true;
			} else {
				if (currWO.get("failurecode")==null) {
					eventContext.setDisplay(true);
				} else {
					currWO["failureTypeVisibility"]=false;
				}
			}
		},
		
		hideShowFailureType : function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			eventContext.setDisplay(currWO.get("failureTypeVisibility"));
		},
		
		setFailureCode : function(wo,failurecode,description){
			wo.setNullValue('failurecode');
			
			if(wo.failureReportlist){
				arrayUtil.forEach(wo.failureReportlist.data, function(failureRecord) {
					failureRecord.deleteChildOnServer();
				});	
			}

			if (!wo.isNew()) {
					wo.set('failurecode',failurecode);
					wo.set('failureCodeDesc', description);
					wo.set("currentFCDesc", description);
				ModelService.save(wo.getOwner()).then(function(){
					
				});	
			} else {
				wo.set('failurecode',failurecode);
				wo.set('failureCodeDesc', description);
				wo.set("currentFCDesc", description);
			}
		},
		
		updateFollwupGPSPosition : function (workOrder) {

			var onSuccessCallback = function (position) {

				Logger.trace("Create Followup WO GPS Position :: " + position.coords.longitude + " , " + position.coords.latitude );

				if (workOrder) {
					workOrder.set('longitudex',position.coords.longitude);
					workOrder.set('latitudey',position.coords.latitude);
					workOrder.set('WOSAlongitudex',position.coords.longitude);
					workOrder.set('WOSAlatitudey',position.coords.latitude);
				}

			};
			
			var onErrorCallback = function (error) { 
				Logger.trace("Create Followup WO GPS Position Error :: " + error.code + " :: " + error.message);			
			} ;
			
			var gpsWatchObject = new GeoLocationTrackingService();
			
			var gpsTimeout = MapProperties.getGPSTimeout();
			Logger.trace("gpsTimeout: " + gpsTimeout);				
			var gpsHighAccuracy = MapProperties.getGPSHighAccuracy();
			Logger.trace("gpsHighAccuracy: " + gpsHighAccuracy);				
			var gpsMaximumAge = MapProperties.getGPSMaximumAge();
			Logger.trace("gpsMaximumAge: " + gpsMaximumAge);

			gpsWatchObject.getCurrentGPSPosition(
				onSuccessCallback.bind(this),
				onErrorCallback,
				{
				    maximumAge: gpsMaximumAge ,
				    timeout: gpsTimeout ,
				    enableHighAccuracy: gpsHighAccuracy
				}
            );
			
		},
		
		updateCurrentGPSPosition : function (eventContext) {
			
			var workOrderSet = eventContext.application.getResource('workOrder');
			eventContext.application.showBusy();
			
			var onSuccessCallback = function (position) {

				Logger.trace("Current GPS Position :: " + position.coords.longitude + " , " + position.coords.latitude );
				if (workOrderSet.count() > 0 ) {

					var workOrder = workOrderSet.getCurrentRecord();
					if (workOrder) {
						workOrder.set('longitudex',position.coords.longitude);
						workOrder.set('latitudey',position.coords.latitude);
						workOrder.set('WOSAlongitudex',position.coords.longitude);
						workOrder.set('WOSAlatitudey',position.coords.latitude);
						
						ModelService.save(workOrderSet);
					}
				}
				
				this.application.hideBusy();
			};
			
			var onErrorCallback = function (error) { 
				Logger.trace("Get Current GPS Position Error :: " + error.code + " :: " + error.message);
				var msg = ""; 
				
				switch(error.code){
					
					case error.PERMISSION_DENIED:
						msg = MessageService.createStaticMessage('gpsPermission').getMessage();
						break;
					case error.POSITION_UNAVAILABLE:
						msg = MessageService.createStaticMessage('unableAcquireGPS').getMessage();
						break;
					case error.TIMEOUT:
						msg = MessageService.createStaticMessage('gpsTimeout').getMessage();
						break;
					default:
						msg = MessageService.createStaticMessage('unableAcquireGPS').getMessage();
				}
				
				this.application.hideBusy();
				this.ui.showMessage(msg);
			} ;
			
			var gpsWatchObject = new GeoLocationTrackingService();
			
			var gpsTimeout = MapProperties.getGPSTimeout();
			Logger.trace("gpsTimeout: " + gpsTimeout);				
			var gpsHighAccuracy = MapProperties.getGPSHighAccuracy();
			Logger.trace("gpsHighAccuracy: " + gpsHighAccuracy);				
			var gpsMaximumAge = MapProperties.getGPSMaximumAge();
			Logger.trace("gpsMaximumAge: " + gpsMaximumAge);

			gpsWatchObject.getCurrentGPSPosition(
				onSuccessCallback.bind(this),
				onErrorCallback.bind(eventContext),
				{
				    maximumAge: gpsMaximumAge ,
				    timeout: gpsTimeout ,
				    enableHighAccuracy: gpsHighAccuracy
				}
            );
		},
		
		
		/**
		 * Initialize and set the Classification Path and Description on Detail page
		 * 
		 * @constructor
		 * @param eventContext
		 */
		initClassificationField : function(eventContext){
			
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			
			if(workOrder.status == 'CLOSE'){
				eventContext.getParent().transitionTo = null;
				
			}
			
			var classstructureid = workOrder.get('classstructureid');
			if(classstructureid==null){
				classstructureid = 'null';
			}			
			var filter = {'classstructureid':classstructureid};
			var class_desc = "";
			var classpath = "";
			ModelService.filtered("classstructure", null, filter, null, false, true).then(function(classStructure){
				if (classStructure.count()>0){
					classpath = classStructure.getCurrentRecord().get('hierarchypath');
					class_desc = classStructure.getCurrentRecord().get('description');
					workOrder.set('classificationpath', classpath);
					workOrder.set('classificationdesc', class_desc);
				} else {
					workOrder.set('classificationpath', '');
					workOrder.set('classificationdesc', '');
				}
			});	
		},
		
		handleWOSpecResourceWhenGoingBack : function(eventContext, originalWorkOrder){
			if (originalWorkOrder){
				if (originalWorkOrder.workOrderSpec && originalWorkOrder.workOrderSpec.data){
					//The originalWorkOrder has a resource so set the application to use that resource
					eventContext.application.resources['workOrder.workOrderSpec'] = originalWorkOrder.workOrderSpec;
				}
				else{
					//The originalWorkOrder does not have a resource for the workOrderSpec attribute so remove the one 
					//created by the followup.					
					delete eventContext.application.resourceMap['workOrderSpecResource'];				
					delete eventContext.application.resourceMap['workOrder.workOrderSpec'];
					delete eventContext.application.resources['workOrder.workOrderSpec'];
				}
			}
		}, 
		
	//custom javascript code
		
		filterSqa: function(eventContext){
			console.log("sqa filter");
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var wonum = currentRecord.get("wonum");
			console.log(wonum);
			
			if (wonum != null) {
					ModelService.filtered('sqa', null,[{tnbwonum: wonum}], 1000, null,null,null,null).then(function(locset){
						console.log(locset);
						eventContext.application.addResource(locset);
					}).otherwise(function(error) {
						Logger.error(JSON.stringify(error));
					});
			} else {
				Logger.trace("meter is null");
				eventContext.application.addResource(null);
			}
		},
		
		parentWO:function(eventContext){
			console.log("parentWO");
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var parentWonum = currentRecord.get("parentWonum");
			console.log(parentWonum);
			
			if (parentWonum != null) {
				console.log("parentWonum not null");
				ModelService.filtered('workOrder', null,[{wonum: parentWonum}], 1000, null,null,null,null).then(function(locset){
					console.log(locset);
					eventContext.application.addResource(locset);
					eventContext.ui.show('WorkExecution.WorkDetailView');
				}).otherwise(function(error) {
					Logger.error(JSON.stringify(error));
				});
		} 

		},
		
		filterChild:function(eventContext){
			console.log("parentWO");
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var wonums = currentRecord.get("wonum");
			var siteids = currentRecord.get("siteid");
			console.log(wonums + " "+siteids);
			
			if (wonums != null) {
				console.log("wonums not null");
				ModelService.filtered('workOrder', null,[{parentWonum:wonums,siteid:siteids,istask:false}], 1000, null,null,null,null).then(function(locset){
					console.log(locset);
					eventContext.application.addResource(locset);
					eventContext.ui.show('WorkExecution.ChildrenWO');
				}).otherwise(function(error) {
					Logger.error(JSON.stringify(error));
				});
		} 
			
		},
		
		filterPermit: function(eventContext){
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var wonum = currentRecord.get("wonum");
			console.log(wonum);
			
			if (wonum != null) {
					ModelService.filtered('permit', null,[{tnbwonum: wonum}], 1000, null,null,null,null).then(function(locset){
						console.log(locset);
						eventContext.application.addResource(locset);
					}).otherwise(function(error) {
						Logger.error(JSON.stringify(error));
					});
			} else {
				Logger.trace("permit is null");
				eventContext.application.addResource(null);
			}
			
		},
	
		updateAtrributeInTask : function(eventContext){
			console.log('custom function: updateAtrributeInTask called from WODetailHandler');
			var msg = MessageService.createStaticMessage("save succesful").getMessage();
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var currWO = workOrderSet.getCurrentRecord();
			ModelService.save(workOrderSet).then(function() {
				this.ui.hideCurrentView();
				eventContext.ui.showToastMessage(msg);
				console.log('save completed');
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});
			
		},
		
		NewLinearWO: function(eventContext) {
			console.log("New Work Order Feature");
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			console.log(workOrder);
			var asset = CommonHandler._getAdditionalResource(eventContext,"additionalasset").getCurrentRecord();
			console.log(asset);
			
			if (!asset.islinear)
				eventContext.setDisplay(false);
			else if (!workOrder.asset)
				eventContext.setDisplay(false);
			else
				eventContext.setDisplay(true);
		},
		
		initNewLinearEntry: function(eventContext) {
			console.log("New Work Order Feature Entry");
			var LinearDetailSet = null;
			LinearDetailSet = CommonHandler._getAdditionalResource(this,"workOrder.multiassetloclist");
			console.log(LinearDetailSet);
			var newLinearDetail = LinearDetailSet.createNewRecord();
			//eventContext.setMyResourceObject(LinearDetailSet);
		},
		
		hideForNonLinearWO: function(eventContext) {
			console.log("Hide when non-linear");
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if (!workOrder.islinear)
				eventContext.setDisplay(false);
			else
				eventContext.setDisplay(true);
		},
		
		hideForNonLinearAsset: function(eventContext) {
			console.log("Hide when non-linear Asset");
			var multiasset = CommonHandler._getAdditionalResource(eventContext,"multiAssetLocResource").getCurrentRecord();
			console.log(multiasset);
			if (!multiasset.islinear)
				eventContext.setDisplay(false);
			else
				eventContext.setDisplay(true);			
		},
		
		hideText: function(eventContext) {
			eventContext.setDisplay(false);
		},
		
		readOnlyForNonLinearWO: function(eventContext) {
			console.log("Readonly when non-linear");
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			console.log(workOrder.multiassetloclist);
			if (workOrder.multiassetloclist.data.length > 0){
				var linear = workOrder.multiassetloclist.data[0];
				if(linear){
					/*linear.getRuntimeFieldMetadata('feature').set('readonly', false);
					linear.getRuntimeFieldMetadata('featurelabel').set('readonly', false);	*/			
					console.log("Linear/Editable - Remove .invalidBinding class");
				}
			}
		},
		
		filterFeature: function(eventContext) {
			console.log("filter lookup feature");
			Logger.trace('filter lookup feature processing');
			
			eventContext.application.showBusy();
			//var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var multiasset = CommonHandler._getAdditionalResource(eventContext,"multiAssetLocResource").getCurrentRecord();//workOrder.multiassetloclist
			console.log(multiasset);
			//var asset2=workOrder.get("asset");
			var asset2=multiasset.get("assetnum");
			console.log("asset = "+asset2);
			var assetfeature = CommonHandler._getAdditionalResource(eventContext,'assetfeature');
			assetfeature._lookupFilter = null;
			var filter = [];
			filter.push({assetnumSearch: asset2});
			assetfeature.lookupFilter = filter; 
		},
		
		filterDomain: function(eventContext) {
			console.log("filter domain");
			var tnbwometers = CommonHandler._getAdditionalResource(eventContext,"tnbwometers").getCurrentRecord();
			var domainId = tnbwometers.get('domainid');
			var alnmeters = CommonHandler._getAdditionalResource(eventContext,'alnmeters');
			console.log(alnmeters)
			alnmeters._lookupFilter = null;
			var filter = [];
			filter.push({domainid: domainId});
			alnmeters.lookupFilter = filter; 			
		},
		
		showFooterView: function(eventContext) {
			// we do not show the footer until a newreading is set
			this.displayFooter(eventContext, true);
		},
		
		displayFooter: function(eventContext, display) {
			var LinearDetailView = eventContext.ui.getViewFromId(eventContext.ui.transitionInfo.id);
			LinearDetailView.setFooterDisplay(display);
		},	
		
		cancelEntry: function(eventContext) {
			Logger.trace('Linear Segment Details - Cancel Clicked');
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},		
		
		commitEntry: function(eventContext) {			
			console.log('Linear Segment Details - Save Clicked');
			var msg = MessageService.createStaticMessage("save succesful").getMessage();
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			console.log(workOrderSet);
			ModelService.save(workOrderSet).then(function() {
				eventContext.ui.hideCurrentView();
				eventContext.ui.showToastMessage(msg);
				console.log('save completed');
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});			
		},
		
		showLinearSegmentDetailsMultiAsset: function(evenContext) {
			evenContext.ui.show('WorkExecution.MultiAssetLinearSegmentDetailsView');
		},
		//end custom javascript code
		
		hideForNonCalibrationWO: function(eventContext) {
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if(!workOrder['wtype']) {
				var worktypes = CommonHandler._getAdditionalResource(eventContext,"additionalworktype");
				worktypes.clearFilterAndSort();
				var result = worktypes.find("worktype == '" + workOrder.get('worktype') + "' && orgid == '" + workOrder.get('orgid') + "'");
				worktype = result[0] ? result[0].type : null;
				if(worktype) {
					var domainWorkType = CommonHandler._getAdditionalResource(eventContext,"domainworktype");
					workOrder['wtype'] = SynonymDomain.resolveToInternal(domainWorkType, worktype, workOrder.get('orgid'));
				}
				//workOrder['wtype'] = result[0] ? result[0].type : null;
			}
			if(workOrder.wtype != 'CAL') {
				eventContext.setDisplay(false);
		}
		},
		
		createWO_hideForNonCalibrationWO: function(eventContext) {
//            var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
//            if(!workOrder['wtype']) {
//                var worktypes = CommonHandler._getAdditionalResource(eventContext,"additionalworktype");
//                worktypes.clearFilterAndSort();
//                var result = worktypes.find("worktype == '" + workOrder.get('worktype') + "' && orgid == '" + workOrder.get('orgid') + "'");
//                workOrder['wtype'] = result[0] ? result[0].type : null;
//            }
            CommunicationManager.checkConnectivityAvailable().
			then(function(hasConnectivity){
				if(hasConnectivity){
					 eventContext.setDisplay(true);
//					 if(workOrder.wtype != 'CAL') {
//			                eventContext.setDisplay(false);
//			            }
//			            else{
//			                eventContext.setDisplay(true);
//			            }
				} else {
					eventContext.setDisplay(false);
				}
			});
            
//            workOrder.watch("worktype", function(){
//            	CommunicationManager.checkConnectivityAvailable().
//    			then(function(hasConnectivity){
//    				if(hasConnectivity){
//    					if(workOrder.worktype != 'CAL') {
//        	                eventContext.setDisplay(false);
//        	            }
//        	            else{
//        	                eventContext.setDisplay(true);
//        	            }	
//    				} else {
//    					eventContext.setDisplay(false);
//    				}
//    				
//    			});
//				
//			});	
            
        },
	
	});
});
