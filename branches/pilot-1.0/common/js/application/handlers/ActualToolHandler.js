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

define("application/handlers/ActualToolHandler", 
	   [ "dojo/_base/lang",
	     "dojo/_base/declare",
	     "dojo/_base/array",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/business/ActualToolObject",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "platform/translation/SynonymDomain",
	     "application/business/MaxVars",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "application/handlers/CommonHandler",
	     "platform/auth/UserManager",
		 "platform/logging/Logger",
	     "platform/util/AsyncAwareMixin",
	     "platform/comm/CommunicationManager",
	      "platform/store/_ResourceMetadataContext"],
function(lang, declare, arrayUtil, ApplicationHandlerBase, ActualToolObject, ModelService, MessageService, SynonymDomain, MaxVars, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, CommonHandler, UserManager, Logger, AsyncAwareMixin,CommunicationManager, ResourceMetaData) {
	return declare( [ApplicationHandlerBase, AsyncAwareMixin], {
		
/**@memberOf application.handlers.ActualToolHandler */
		initAddToolView: function(eventContext){
			var view = eventContext.viewControl;
			var actualToolList = CommonHandler._getAdditionalResource(eventContext,"workOrder.actualtoollist");
			if(!view.isOverrideEditMode()){
				var workOrder = this.application.getResource("workOrder").getCurrentRecord(); 
				workOrder.openPriorityChangeTransaction();
				var actualToolRecord= actualToolList.createNewRecord();
				ActualToolObject.setDefaultValues(actualToolRecord);
			}
			eventContext.setMyResourceObject(actualToolList);
		},
		
		enableAddToolButton: function(eventContext){
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();			
			if (!workOrder || !ActualToolObject.canAddActualTool(workOrder) || workOrder.isErrored()) {			
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		
		discardActualToolEntryView: function(eventContext){
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		handleBackButtonClick: function(eventContext){
		// cleanup event handler
			var view = eventContext.viewControl;
			if(!view.isOverrideEditMode()){
				var actualTool = eventContext.getCurrentRecord();
				actualTool.deleteLocal();
				return;
			}
			this.commitActualToolEntryView(eventContext);
		},		
		
		commitActualToolEntryView: function(eventContext){
			eventContext.application.showBusy();
			try{
				this.validatePage(eventContext);

				//Retrieve and set itemsetid based on site and inventory
				var siteid = CommonHandler._getWorkorderSiteId(eventContext);
				var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
				var itemsetid = CommonHandler._getItemSetIdForSiteId(eventContext,siteid, additionalInventory);
				// when we are dealing with a tool with a rotating asset itemsetid is already set
				// we are going to set it again only if we got an inventory 
				if(itemsetid) {
					eventContext.getCurrentRecord().set('itemsetid', itemsetid); 
				}
				
				if(!eventContext.viewControl.validate()){
					return;
				}
				eventContext.getCurrentRecord().set("dontDiscard", true);
				
				var workOrderSet =  CommonHandler._getAdditionalResource(eventContext,"workOrder");
				var self=eventContext;
				
				var workOrder = workOrderSet.getCurrentRecord();
     			workOrder.closePriorityChangeTransaction();
     			
				ModelService.save(workOrderSet).
					then(function(){
						self.ui.hideCurrentView();}).
						otherwise(function(error){
							switch (true) {				
								case (error.error instanceof PlatformRuntimeException):						
									self.application.showMessage(error.error.getMessage());
								break;				
							}
						});
			}catch(e){
				throw e;
			}
		},
		asyncValidateTool : function(eventContext) {
			var actualToolList = CommonHandler._getAdditionalResource(eventContext,"workOrder.actualtoollist");
			var actualToolRecord = actualToolList.getCurrentRecord();
			var itemnum = actualToolRecord.getPendingOrOriginalValue('tool');
	
			//defect 113779 - avoid double validation calls
			actualToolRecord.set('tool',itemnum);
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var rotatingAssetNumMetaData = actualToolRecord.getRuntimeFieldMetadata('rotassetnum');						
			if (itemnum) {								
				this.asyncCompleteToolValidation( 
						actualToolRecord, 
						rotatingAssetNumMetaData, 
						this.asyncFilteredTools(eventContext, itemnum));										
		    } 
			else{
		    	actualToolRecord.setNullValue('tool');
				actualToolRecord.setNullValue('tooldesc');
				actualToolRecord.setNullValue('rotassetnum');
				rotatingAssetNumMetaData.set('required',false);
				rotatingAssetNumMetaData.set('readonly',false);
				rotatingAssetNumMetaData.set('isCodeScannable',true);
			}
			
		},
		asyncCompleteToolValidation: function(actualToolRecord, rotatingAssetNumMetaData, filteredToolList){				
			if(!filteredToolList || filteredToolList.count() == 0) {
					throw new PlatformRuntimeWarning('invalidTool');
			}else{
				actualToolRecord.set('tool',filteredToolList.getRecordAt(0).get("itemnum"));
				actualToolRecord.set('tooldesc',filteredToolList.getRecordAt(0).get("description"));					
				var isRotatingTool = filteredToolList.getRecordAt(0).get('rotating');					
				if (isRotatingTool) {
				    //set rotassetnum field to required
					rotatingAssetNumMetaData.set('required',true);
					rotatingAssetNumMetaData.set('readonly',false);
					rotatingAssetNumMetaData.set('isCodeScannable',true);
				} else {
				    //set rotassetnum to read only
					actualToolRecord.setNullValue('rotassetnum');
					rotatingAssetNumMetaData.set('required',false);
					rotatingAssetNumMetaData.set('readonly',true);
					rotatingAssetNumMetaData.set('isCodeScannable',false);					
				}
				if(actualToolRecord.get("solution") == true){
					var solutionTypeMetaData = actualToolRecord.getRuntimeFieldMetadata('solutiontype');
					solutionTypeMetaData.set('required',true);
					var manufacturerMetaData = actualToolRecord.getRuntimeFieldMetadata('manufacturer');
					manufacturerMetaData.set('required',true);
					var lotNumMetaData = actualToolRecord.getRuntimeFieldMetadata('lotnum');
					lotNumMetaData.set('required',true);
					var expiryDateMetaData = actualToolRecord.getRuntimeFieldMetadata('expirydate');
					expiryDateMetaData.set('required',true);
				}
			}
		},
		getItemSetIt: function(eventContext, siteId){
			var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			return CommonHandler._getItemSetIdForSiteId(eventContext,siteId, additionalInventory);					
		},		
		selectableItemStatusesAsFilter: function(eventContext){
			var domainitemstatus = CommonHandler._getAdditionalResource(eventContext,'domainitemstatus');			
			var internalStatuses = ['ACTIVE', 'PENDOBS', 'PLANNING'];
			var filter = [];
			arrayUtil.forEach(internalStatuses, function(anStatus){
				CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
				var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemstatus, anStatus));
				arrayUtil.forEach(externalOnes, function(aValue){
					filter.push({"status": aValue});
				});
			});
			CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
			return filter;
		},		
		buildFilterForTools: function(eventContext, itemnum, orgId, itemsetid){
			var statuses = this.selectableItemStatusesAsFilter(eventContext);			
			var filter = [];
			if(itemsetid){
				filter.push({"itemsetid": itemsetid}); 
			}
			if(itemnum){
				filter.push({"itemnum": itemnum});
		    }	
			return arrayUtil.map(statuses, function(anStatus){
				var result = lang.mixin({}, anStatus);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});			
		},
		asyncFilteredTools : function(eventContext, itemnum){			
			var actualToolList = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualtoollist');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			var filter = this.buildFilterForTools(eventContext, itemnum, this.getItemSetIt(eventContext, siteid));
			return this.asyncApplyFilterForTools(filter, orgid);
		},
		asyncApplyFilterForTools: function(filter,orgid){
			return ModelService.additionalDataFiltered("additionaltool", filter, true).then(function(set){
				var foundItemOrgInfo = false;
				arrayUtil.forEach(set.data, function(tool){
					if(tool){
						var itemorg = tool.itemorginfo;
						if(itemorg){
							arrayUtil.forEach(itemorg, function(iod){
								if(iod.orgid == orgid){
									foundItemOrgInfo = true;
								}
							});
						}
					}
				});
				
				if(foundItemOrgInfo==true){
					return set;
				} else {
					return null;
				}
				
			});
		},
		filterToolForLookup : function(eventContext){			
			var additionalTool = CommonHandler._getAdditionalResource(eventContext,'additionaltool');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			additionalTool.lookupFilter = this.buildFilterForTools(eventContext, null, orgid, this.getItemSetIt(eventContext, siteid));			
		},

		asyncValidateRotatingAsset: function(eventContext) {
			var currentRecord = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualtoollist').getCurrentRecord();
			var assetnum = currentRecord.getPendingOrOriginalValue('rotassetnum');
			
			//defect 113779 - avoid double validation calls
			currentRecord.set('rotassetnum',assetnum);
			
			if(assetnum){
				var itemnum = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualtoollist').getCurrentRecord().get('tool');			
				var siteid = CommonHandler._getWorkorderSiteId(eventContext);
				var filter = this.buildFilterForRotatingAsset(eventContext, itemnum, siteid, null, assetnum);

				var assetPromise = this.asyncGetRotatingAssetPromise(filter);
				this.asyncCompleteValidateRotatingAsset(currentRecord, assetPromise);
			}
		},
		
		asyncGetRotatingAssetPromise: function(filter){
			return ModelService.additionalDataFiltered("additionalasset", filter, true);
		},
		
		asyncCompleteValidateRotatingAsset: function(currentRecord, additionalRotatingAsset) {
			
			if(additionalRotatingAsset.count() == 0){
				throw new PlatformRuntimeWarning('invalidRotatingAsset');
			}else{
				var currentRotAsset = additionalRotatingAsset.getCurrentRecord();
				currentRotAssetnum = currentRotAsset.assetnum;
				currentRotAssetSiteid = currentRotAsset.siteid;
				currentRecord.set("tool", currentRotAsset.get('itemnum'));
				CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
					if(hasConnectivity){
						//var filter = [{'assetnum': currentRotAssetnum, 'siteid': currentRotAssetSiteid}];
						
						var assetResourceMeta = ResourceMetaData.getResourceMetadata("asset");
						//var originalAssetWhereClause = assetResourceMeta.whereClause;
						assetResourceMeta.setWhereClause("oslc:shortTitle=%22"+currentRotAssetnum+"%22 and spi:siteid=%22"+currentRotAssetSiteid+"%22");				
						
						//var additionalAssetMeta = ResourceContext.getResourceMetadata('additionalasset');//additionalRotatingAsset.getMetadata();
						//var queryBase = additionalAssetMeta.queryBases[0];
						//ModelService.filtered('additionalasset', queryBase, filter, 200, true, true, null, false).then(function(assetRecord){						
						//ModelService.removeAndFilter("additionalasset", filter,200, true).then(function(assetRecord){							
						ModelService.all('asset', 'assetResourceQB' ,null,true).then(function(assetRecord){
							currentRecord.set("duedate", assetRecord.getCurrentRecord().get('duedate'));
							if(currentRotAsset.get("assetsolution") == true){
								var solutionTypeMetaData = currentRecord.getRuntimeFieldMetadata('solutiontype');
								solutionTypeMetaData.set('required',true);
								var manufacturerMetaData = currentRecord.getRuntimeFieldMetadata('manufacturer');
								manufacturerMetaData.set('required',true);
								var lotNumMetaData = currentRecord.getRuntimeFieldMetadata('lotnum');
								lotNumMetaData.set('required',true);
								var expiryDateMetaData = currentRecord.getRuntimeFieldMetadata('expirydate');
								expiryDateMetaData.set('required',true);
							}
						});
					} else {
						currentRecord.set("duedate", currentRotAsset.get('duedate'));
						if(currentRotAsset.get("assetsolution") == true){
							var solutionTypeMetaData = currentRecord.getRuntimeFieldMetadata('solutiontype');
							solutionTypeMetaData.set('required',true);
							var manufacturerMetaData = currentRecord.getRuntimeFieldMetadata('manufacturer');
							manufacturerMetaData.set('required',true);
							var lotNumMetaData = currentRecord.getRuntimeFieldMetadata('lotnum');
							lotNumMetaData.set('required',true);
							var expiryDateMetaData = currentRecord.getRuntimeFieldMetadata('expirydate');
							expiryDateMetaData.set('required',true);
						}
					}
					
				});
			}
		},
		
		selectableAssetStatusesAsFilter: function(eventContext){
			var domainitemstatus = CommonHandler._getAdditionalResource(eventContext,"domainAssetstatus");
			// 115525
			var internalStatuses = ["OPERATING", "NOT READY"];
			var filter = [];
			arrayUtil.forEach(internalStatuses, function(anStatus){
				CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
				var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemstatus, anStatus));
				arrayUtil.forEach(externalOnes, function(aValue){
					filter.push({"status": aValue});
				});
			});
			CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
			return filter;
		},
		
		buildFilterForRotatingAsset: function(eventContext, itemnum, siteId, storeroom, assetnum){
			var filter = [{"siteid": siteId}, {"itemnumnotnull": true}];
			if (WL.Client.getEnvironment() != WL.Environment.WINDOWS8 ) {
				filter.push({"parent": "null"});
			}
			
			if(storeroom) { filter.push({"location": storeroom}); } 			
			if(itemnum)   { filter.push({"itemnum": itemnum}); }			
			if(assetnum)  { filter.push({"assetnum": assetnum}); }
		
			var domainitemtype = CommonHandler._getAdditionalResource(eventContext,'domainitemtype');
			domainitemtype.clearFilterAndSort();
			var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemtype, 'TOOL'));

			arrayUtil.forEach(externalOnes, function(aValue){
				filter.push({"itemtype": aValue});
			});
			
			var statuses = this.selectableAssetStatusesAsFilter(eventContext);
			return arrayUtil.map(statuses, function(anStatus){
				var result = lang.mixin({}, anStatus);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});		
		},

		filterVendorForLookup: function(eventContext){
			
		},
		
		filterRotatingAssetForLookup : function(eventContext){			
			var itemnum = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualtoollist').getCurrentRecord().get('tool');
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var filter = this.buildFilterForRotatingAsset(eventContext, itemnum, siteid, null, null);
			var additionalAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			CommonHandler._clearFilterForResource(eventContext, additionalAsset);
			additionalAsset.lookupFilter = filter;
		},
		
		validatePage : function(eventContext){
			var actualToolList = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualtoollist');
			var curr = actualToolList.getCurrentRecord();
				
			//Validate Tool Quantity
			var toolqty = curr.get('toolqty');
			if(toolqty <= 0) {
				throw new PlatformRuntimeException('materialQuantityPositive');
			}
			
			
			//Validate Tool Hours
			var toolhrs = curr.get('toolhrs');
			if(toolhrs < 0) {
				throw new PlatformRuntimeException('invalidduration');
			}	
			
			//Validate due date
			var duedate = curr.getAsDateOrNull("duedate");
			var useddate = curr.getAsDateOrNull("useddate");
			var currentDate = new Date();
			
			if(useddate == null){
				useddate = curr.getAsDateOrNull("transdate");
			}
			if(duedate != null){
				var dateUsed = (useddate==null ? currentDate : useddate);
				if(duedate < dateUsed){
					var orgid = UserManager.getInfo("deforg");
					var oslcmaxvars = UI.application.getResource("oslcmaxvars");	
					if(MaxVars.prohibitPastDueTools(oslcmaxvars, orgid)){
						throw new PlatformRuntimeException('overduetoolerror',[curr.get("tool")]);
					}
				}
			}
		},
		
		setReadOnly: function(eventContext){
			eventContext._setReadOnly(true);
		},
	});
});
