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

define("application/handlers/ActualMaterialHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/business/ActualMaterialObject",
	     "platform/translation/SynonymDomain",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "application/handlers/CommonHandler",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "application/business/FieldUtil",
	     "platform/util/AsyncAwareMixin",
	     "dojo/_base/lang",
	     "dojo/_base/array"],
function(declare, ApplicationHandlerBase, ActualMaterialObject, SynonymDomain, ModelService, MessageService, CommonHandler, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, fieldUtil, AsyncAwareMixin, lang ,arrayUtil) {
	return declare( [ApplicationHandlerBase, AsyncAwareMixin], {
		
		// Initialize actual material report UI
/**@memberOf application.handlers.ActualMaterialHandler */
		initAddMaterialView: function(eventContext){
			var view = eventContext.viewControl;
			var actualMaterialSet= CommonHandler._getAdditionalResource(eventContext,"workOrder.actualmateriallist");
			if(!view.isOverrideEditMode()){
				
				var workOrder = this.application.getResource("workOrder").getCurrentRecord(); 
				workOrder.openPriorityChangeTransaction();
				
				var newMaterial= actualMaterialSet.createNewRecord();
				var additionalLineType = CommonHandler._getAdditionalResource(eventContext,'additionalLineType');
				ActualMaterialObject.setDefaultValues(newMaterial, additionalLineType);
			}
			eventContext.setMyResourceObject(actualMaterialSet);
		},
		
		// Hide add material report button
		enableAddMaterialButton: function(eventContext){
			var workOrder =  CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();		
			
			if (!workOrder || !ActualMaterialObject.canAddActualMaterial(workOrder) || workOrder.isErrored()) {			
				eventContext.setDisplay(false);
				return;
			}	
			eventContext.setDisplay(true);
		},
		
		discardActualMaterialEntryView: function(eventContext){			
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);			
		},
		
		// cleanup event handler
		handleBackButtonClick: function(eventContext){
			var view = eventContext.viewControl;
			if(!view.isOverrideEditMode()){
				var actualMaterial=eventContext.getCurrentRecord();
				actualMaterial.deleteLocal();
				return;
			}
			this.commitActualMaterialEntryView(eventContext);
		},	
		
		commitActualMaterialEntryView: function(eventContext){
			eventContext.application.showBusy();
			//If pre-requisites are valid, view can be saved
			try{
				var self = this;
				var actualMaterial = eventContext.getCurrentRecord();
				var validatePromise = this.asyncValidatePage(eventContext);
				validatePromise.then(function(){					 
					actualMaterial.set("dontDiscard", true);
					var workOrderSet =	actualMaterial.getParent().getOwner();// 115835 CommonHandler._getAdditionalResource(eventContext,"workOrder");
					if(workOrderSet.getCurrentRecord().get('wonum') != '') {
						//122432 - Set the the composite field before saving the workorder, otherwise the value is lost
						fieldUtil.initCompositeField("itemnum", "itemdesc", "itemanddescription", actualMaterial);
						var workOrder = workOrderSet.getCurrentRecord();
		     			workOrder.closePriorityChangeTransaction();
						ModelService.save(workOrderSet).always(function(){
							eventContext.ui.hideCurrentView();
						});
					}else{
						eventContext.ui.hideCurrentView();						
					}
				}).otherwise(function(e) {
					if (e instanceof PlatformRuntimeException) {
						self.ui.showMessage(e.getMessage());						
					}
				});
			}catch(e){
				throw e;
			}
		},
				
		validateBin : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get ITEMNUM, STOREROOM, and BINNUM typed on view
			var itemnum = creatingMaterialItem.get('itemnum');
			var storeroom = creatingMaterialItem.get('storeroom');
			var binnum = creatingMaterialItem.getPendingOrOriginalValue('binnum');
			
			// We can only validate BINNUM if ITEMNUM, STOREROOM, and BINNUM are specified
			if(!itemnum || !storeroom || !binnum) return;
			
			var additionalBin = this.filterBin(eventContext);
			
			// Compare BINNUM with filtered data from lookup; BINNUM is invalid if it is not found in the list
			var binSet = additionalBin.find('binnum == $1', binnum);
			
			// BINNUM is invalid according to data loaded on the device, so throw a warning
			if(binSet.length == 0) {
				throw new PlatformRuntimeWarning('invalidBin');
			}
		},
		
		filterBin : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get ITEMNUM, STOREROOM, and LINE TYPE typed on view
			var itemnum = creatingMaterialItem.get('itemnum');
			var storeroom = creatingMaterialItem.get('storeroom');
			var linetype = creatingMaterialItem.get('linetype');
			
			// Get the SITE ID on the work order
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);			

			// Get the ITEMSET ID of ITEMNUM
			var itemsetid;
			if(itemnum) {
				itemsetid = CommonHandler._getItemSetIdForSiteId(eventContext, siteid, additionalInventory);
			}

			// Determine if external value of LINE TYPE translates to internal value of 'ITEM'
			var linetypeIsValid = this._lineTypeIsValid(eventContext, linetype);
			
			// Clear the previous bin filter
			var additionalBin = CommonHandler._getAdditionalResource(eventContext,'additionalbin');
			CommonHandler._clearFilterForResource(eventContext,additionalBin);
			
			// Show all bins that reside in specified STOREROOM and contains specified ITEM; the user can only select bins for LINE TYPE = 'ITEM'
			if(itemnum && storeroom && linetypeIsValid && siteid) {	
				// Additionally filter the bins with negative current balance
				if(itemsetid){
					additionalBin.filter('itemnum == $1 && location == $2 && itemsetid == $3 && currentbalance >= 0 && siteid == $4', itemnum, storeroom, itemsetid, siteid);
				}else{
					additionalBin.filter('itemnum == $1 && location == $2 && currentbalance >= 0 && siteid == $3', itemnum, storeroom, siteid);
				}
				
				// If there are more than one bin for typed values on view, hide the ones with no balance
				if(additionalBin.data.length > 1) {
					additionalBin.filter('currentbalance > 0');
				}
			} else {
				additionalBin.filter('itemnum == $1', null);
			}
				
			// Return filtered data for validation methods
			return additionalBin;
		},		
		
		filterBinForLookup : function(eventContext) {
			// this is not an async method because it makes no async calls
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get ITEMNUM, STOREROOM, and LINE TYPE typed on view
			var itemnum = creatingMaterialItem.get('itemnum');
			var storeroom = creatingMaterialItem.get('storeroom');
			var linetype = creatingMaterialItem.get('linetype');
			
			// Get the SITE ID on the work order
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);			

			// Determine if external value of LINE TYPE translates to internal value of 'ITEM'
			var linetypeIsValid = this._lineTypeIsValid(eventContext, linetype);
			
			// Clear the previous bin filter
			var additionalBin = CommonHandler._getAdditionalResource(eventContext,'additionalbin');
			CommonHandler._clearFilterForResource(eventContext,additionalBin);
			
			// setup filter for all bins that reside in specified STOREROOM and contain specified ITEM; the user can only select bins for LINE TYPE = 'ITEM'
			var filter;
			if(itemnum && storeroom && linetypeIsValid && siteid) {	
				// Additionally filter the bins with negative current balance
				filter = { itemnum: itemnum, location: storeroom, hasbalance: true, siteid: siteid };
			} else {
				filter = { itemnum: 'null' };
			}
			// set the filter
			additionalBin.lookupFilter = filter;
		},
		
		asyncValidateBin : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get ITEMNUM, STOREROOM, and BINNUM typed on view
			var itemnum = creatingMaterialItem.get('itemnum');
			var storeroom = creatingMaterialItem.get('storeroom');
			var binnum = creatingMaterialItem.getPendingOrOriginalValue('binnum');
			
			// We can only validate BINNUM if ITEMNUM, STOREROOM, and BINNUM are specified
			if(!itemnum || !storeroom || !binnum) return;

			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var linetype = creatingMaterialItem.get('linetype');

			// Determine if external value of LINE TYPE translates to internal value of 'ITEM'
			var linetypeIsValid = this._lineTypeIsValid(eventContext, linetype);

			var filter;
			var binPromise;
			if(linetypeIsValid && siteid) {	
				// Show all bins that reside in specified STOREROOM and contains specified ITEM; the user can only select bins for LINE TYPE = 'ITEM'
				filter = { itemnum: itemnum, location: storeroom, binnum: binnum, hasbalance: true, siteid: siteid };
			} else {
				// filter by item and bin... if the bin is not present, it is invalid
				filter = { itemnum: 'null', binnum: binnum };
			}
			binPromise = this.async_getBinPromise(filter);
			this.async_noRecordsWarning(binPromise, 'invalidBin');
		},

		async_getBinPromise : function(filter) {
			return  ModelService.filtered('additionalbin', null, filter, null, false, true);
		},
		
		async_noRecordsWarning : function(set, warning){
			// if count = 0, throw a warning
			if(set.count() == 0) {
				throw new PlatformRuntimeWarning(warning);
			}
		},

		_lineTypeIsValid : function(eventContext, linetype) {
			// Fetch the internal value of LINE TYPE on view
			var additionalLineType = CommonHandler._getAdditionalResource(eventContext, 'additionalLineType');
			CommonHandler._clearFilterForResource(eventContext, additionalLineType);
			var linetypeIsValid = false;
			// Determine if external value of LINE TYPE translates to internal value of 'ITEM'
			if(linetype) {
				linetypeIsValid = SynonymDomain.isValidDomain(additionalLineType, 'ITEM', linetype);
			}
			return linetypeIsValid;
		},
		
		validateStoreroom : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get STOREROOM typed on view
			var storeroom = creatingMaterialItem.getPendingOrOriginalValue('storeroom');
			
			// We can only validate if STOREROOM is specified
			if(!storeroom){
				creatingMaterialItem.set("binnum","");
				return;
			}
			
			var additionalStoreroom = this.filterStoreroom(eventContext);
			
			// Compare STOREROOM with filtered data from lookup; STOREROOM is invalid if it is not found in the list
			var storeroomSet = additionalStoreroom.find('location == $1', storeroom);
			
			// STOREROOM is invalid according to data loaded on the device, so throw a warning
			if(storeroomSet.length == 0) {
				throw new PlatformRuntimeWarning('invalidStoreroom');
			}
		},
		
		filterStoreroom: function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get ITEMNUM typed on view
			var itemnum = creatingMaterialItem.get('itemnum');
			
			// Get SITE ID of work order
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			// If ITEMNUM is informed, apply filters to Inventory and then to Storeroom
			if(itemnum) {
				// Get the valid storerooms given specified ITEMNUM
				var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
				CommonHandler._clearFilterForResource(eventContext,additionalInventory);
				CommonHandler._filterAdditionalInventoryByItemnum(eventContext,additionalInventory, itemnum);
				additionalInventory.filter('siteid == $1',siteid);
				
				var additionalstoreroom = CommonHandler._getAdditionalResource(eventContext,'additionalstoreroom');
				CommonHandler._clearFilterForResource(eventContext,additionalstoreroom);

				// Mount filter key based on records from additionalInventory - refine the storeroom filter
				var keys = {};
				additionalInventory.foreach(function(record){
					keys[record.get('location') + '::' + siteid ] = true;
				});

				additionalstoreroom.filter("$1[location + '::' + siteid]", keys);
				
			} else {
				// If ITEMNUM is not informed, only filter the storeroom by SITE ID
				var additionalstoreroom = CommonHandler._getAdditionalResource(eventContext,'additionalstoreroom');
				CommonHandler._clearFilterForResource(eventContext,additionalstoreroom);
				additionalstoreroom.filter('siteid == $1', siteid);
			}
			
			// Return filtered data for validation methods
			return additionalstoreroom;
		},
		
		asyncFilterStoreroomForLookup: function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var itemnum = creatingMaterialItem.get('itemnum');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			var filter = {siteid: siteid};
			// If ITEMNUM is entered, apply filters to Inventory and then to Storeroom
			if(itemnum) {
				// Get the valid storerooms given specified ITEMNUM
				filter['itemnum'] = itemnum;
			}
			var inventoryPromise = ModelService.additionalDataFiltered("additionalInventory", filter, true);
			//TODO: filtering the Storerooms if the additionalInventory records are not already filtered by ITEM 
			//is going to cause a major scalability issue in shops with large #s of inventory, I recommend that we just open up the storeroom list
			this.asyncBuildLocationsSiteFilter(eventContext, inventoryPromise, siteid);
		},

		asyncBuildLocationsSiteFilter : function(eventContext, inventorySet, siteid) {
			// build filter with location records from additionalInventory
			var locations = {};
			inventorySet.foreach(function(record){
				locations[record.get('location')] = true;
			});

			// create filter terms from keys set
			var filter = [];
			arrayUtil.forEach(Object.keys(locations), function(location) {
				filter.push({siteid: siteid, location: location});
			});
			
			// set lookupFilter on additionalstoreroom
			var additionalstoreroom = CommonHandler._getAdditionalResource(eventContext, 'additionalstoreroom');
			additionalstoreroom.lookupFilter = filter;
		},
		
		asyncValidateStoreroom : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get STOREROOM typed on view
			var storeroom = creatingMaterialItem.getPendingOrOriginalValue('storeroom');
			
			// We can only validate if STOREROOM is specified
			if(!storeroom){
				creatingMaterialItem.set("binnum","");
				return;
			}
			
			//defect 113779 - avoid double validation calls
			creatingMaterialItem.set('storeroom',storeroom);
			
			// Get ITEMNUM, SITE ID typed on view
			var itemnum = creatingMaterialItem.get('itemnum');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);

			// filter by siteid, storeroom and possibly itemnum; STOREROOM is invalid if it is not found in the list
			var filter = { siteid: siteid, location: storeroom };
			// If ITEMNUM is set, add ITEMNUM to filter
			if(itemnum) {
				filter['itemnum'] = itemnum;
			}
			var inventoryPromise = this.async_getStoreRoomPromise(filter);
			this.async_noStoreroomRecordsWarning(inventoryPromise, 'invalidStoreroom', creatingMaterialItem);
		},
		
		async_getStoreRoomPromise : function (filter) {
			return ModelService.filtered('additionalInventory', null, filter, null, false, true);
		},
		
		async_noStoreroomRecordsWarning : function(set, warning, creatingMaterialItem){
			// if count = 0, throw a warning
			if(set.count() == 0) {
				throw new PlatformRuntimeWarning(warning);
			} else if (set.count() == 1) {
					creatingMaterialItem.set('binnum', set.data[0].get('binnum'));
			}	
		},
	
		validateRotatingAsset : function(eventContext){
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var assetnum = curr.getPendingOrOriginalValue('rotassetnum');
			
			var additionalRotatingAsset = this.filterRotatingAsset(eventContext);
			var isValid = additionalRotatingAsset.find('assetnum == $1', assetnum);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidRotatingAsset');
			}else{
				curr.set('itemnum',isValid[0].get('itemnum'));
			}
		},
				
		filterRotatingAsset : function(eventContext){
			var itemnum = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord().get('itemnum');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var itemsetid = null;
			var storeroom = CommonHandler._getAdditionalResource(eventContext,"workOrder.actualmateriallist").getCurrentRecord().get("storeroom");
			
			var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			CommonHandler._clearFilterForResource(eventContext,additionalInventory);
			
			var additionalRotatingAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			CommonHandler._clearFilterForResource(eventContext,additionalRotatingAsset);
			
			additionalRotatingAsset.filter('itemnum != null && parent == null');
			
			// defect 115525 - decomissioned can be used
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainAssetstatus'); 
			additionalRotatingAsset.filter('$1[status]',SynonymDomain.resolveToExternal(domainAssetstatus, 'OPERATING'));
			domainAssetstatus.clearFilterAndSort();
			additionalRotatingAsset.filter('$1[status]',SynonymDomain.resolveToExternal(domainAssetstatus, 'NOT READY'));
			if(storeroom){
				additionalRotatingAsset.filter('location == $1',storeroom);
			}
			
			if(itemnum) {
				var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
				
				CommonHandler._filterAdditionalInventoryByItemnum(eventContext,additionalInventory, itemnum);
				
				itemsetid = CommonHandler._getItemSetIdForSiteId(eventContext,siteid, additionalInventory);
				if(itemsetid){
					additionalRotatingAsset.filter('siteid == $1 && itemsetid == $2 && itemnum == $3', siteid,itemsetid,itemnum);
				}
				else{
					additionalRotatingAsset.filter('siteid == $1 && itemnum == $2', siteid,itemnum);
				}
			}else {
				additionalRotatingAsset.filter('siteid == $1', siteid);
			}
			
			return additionalRotatingAsset;
		},

		filterRotatingAssetForLookup : function(eventContext){
			// set lookup filter on addtionalInventory
			var additionalRotatingAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			var filter = null;
			this.asyncBuildFilterForRotAsset(eventContext, null).then(function(f) {
				filter = f;
			});
			additionalRotatingAsset.lookupFilter = filter;
		},
		
		asyncBuildFilterForRotAsset : function(eventContext, assetnum) {
			var actualMaterialSet = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist');
			var itemnum = actualMaterialSet.getCurrentRecord().get('itemnum');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var storeroom = actualMaterialSet.getCurrentRecord().get("storeroom");
			var itemtype = actualMaterialSet.getCurrentRecord().get("linetype");
			
			var additionalRotatingAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			CommonHandler._clearFilterForResource(eventContext,additionalRotatingAsset);

			// defect 115525
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainAssetstatus');
			domainAssetstatus.clearFilterAndSort();			
			var statuses = SynonymDomain.resolveToExternal(domainAssetstatus, 'OPERATING');
			domainAssetstatus.clearFilterAndSort();			
			lang.mixin(statuses, SynonymDomain.resolveToExternal(domainAssetstatus, 'NOT READY') || {});
			domainAssetstatus.clearFilterAndSort();
			
			// initial filter on item!=null, parent=null, siteid=siteid
			var filterTemplate = { itemnumnotnull: true, parent: 'null', siteid: siteid };
			
			if(assetnum){
				filterTemplate['assetnum'] = assetnum;
			}
			
			if(storeroom){
				filterTemplate['location'] = storeroom;
			}
			
			if(itemnum) {
				filterTemplate['itemnum'] = itemnum;
			}

			var filter = [];
			var fe = {};
			
			var domainitemtype = CommonHandler._getAdditionalResource(eventContext,'domainitemtype');
			domainitemtype.clearFilterAndSort();
			var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemtype, itemtype));			

			arrayUtil.forEach(Object.keys(statuses), function(status) {
				var filterElement = lang.clone(filterTemplate);
				filterElement["status"] = status;
				filter.push(filterElement);
			});

			arrayUtil.forEach(externalOnes, function(aValue){
				fe = lang.clone(filter);
				arrayUtil.forEach(fe, function(element){
					element["itemtype"] = aValue;
				});
			});
						
			return fe;			
		},

		asyncValidateRotatingAsset : function(eventContext){
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var assetnum = creatingMaterialItem.getPendingOrOriginalValue('rotassetnum');

			//defect 113779 - avoid double validation calls
			creatingMaterialItem.set('rotassetnum',assetnum);
			
			var filter = null;
			this.asyncBuildFilterForRotAsset(eventContext, assetnum).
			then(function(f) {
				filter = f;
			});
			
			// run filter, check results
			var rotatingAssetPromise = this.async_getRotatingPromise(filter); 
			this.async_checkRotatingAsset(eventContext, rotatingAssetPromise, creatingMaterialItem);
		},

		async_getRotatingPromise : function(filter) {
			return ModelService.filtered("additionalasset", null, filter, null, false, true);
		},
		
		async_checkRotatingAsset : function(eventContext, rotatingAssetSet, currentRecord) {
			if(rotatingAssetSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidRotatingAsset');
			}else{
				currentRecord.set('itemnum', rotatingAssetSet.getRecordAt(0).get('itemnum'));
			}
		},
				
		validateItem : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			
			// Get ITEMNUM typed on view
			var itemnum = creatingMaterialItem.getPendingOrOriginalValue('itemnum');
			
			//retrivin field metadata
			var rotassetmetadata = creatingMaterialItem.getRuntimeFieldMetadata('rotassetnum');
			
			// We can only validate if ITEMNUM is specified
			if(!itemnum){
				creatingMaterialItem.set('itemdesc', '');
				creatingMaterialItem.set('binnum', '');
				creatingMaterialItem.set('storeroom', '');
				rotassetmetadata.set('required',false);
				rotassetmetadata.set('readonly',false);
				return;
			}
			
			var additionalItem = this.filterItem(eventContext);
			
			var itemSet = additionalItem.find('itemnum == $1', itemnum);
			
			if(itemSet.length == 0) {
				creatingMaterialItem.set('itemdesc', '');
				throw new PlatformRuntimeWarning('invalidItem');
			}else{
				//Set description on the master record, considering the itemnum is valid
				creatingMaterialItem.set('itemdesc', itemSet[0].get('description'));
				
				//check if it's a rotating item
				var isRotatingItem = itemSet[0].get('rotating');
				
				if (isRotatingItem) {
				    //set rotassetnum field to required
					rotassetmetadata.set('required',true);
					rotassetmetadata.set('readonly',false);
				} else {
				    //set rotassetnum to read only
					rotassetmetadata.set('required',false);
					rotassetmetadata.set('readonly',true);
				}
			}
		},
		
		filterItem: function(eventContext){
			
			var storeroom = CommonHandler._getAdditionalResource(eventContext,"workOrder.actualmateriallist").getCurrentRecord().get("storeroom");
			var binnum = CommonHandler._getAdditionalResource(eventContext,"workOrder.actualmateriallist").getCurrentRecord().get("binnum");
			var linetype = CommonHandler._getAdditionalResource(eventContext,"workOrder.actualmateriallist").getCurrentRecord().get("linetype");
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			CommonHandler._clearFilterForResource(eventContext,additionalInventory);
			var itemsetid = CommonHandler._getItemSetIdForSiteId(eventContext,siteid, additionalInventory);

			var keys = {};
			var domainitemstatus = CommonHandler._getAdditionalResource(eventContext,'domainitemstatus'); 			
			keys[SynonymDomain.resolveToDefaultExternal(domainitemstatus, 'ACTIVE')] = true;
			keys[SynonymDomain.resolveToDefaultExternal(domainitemstatus, 'PENDOBS')] = true;
			
			additionalInventory.filter('siteid == $1 && $2[status] ',siteid, keys);
			if(itemsetid){
				additionalInventory.filter('itemtype == $1 && itemsetid == $2 ', linetype, itemsetid);
			}else{
				additionalInventory.filter('itemtype == $1 ', linetype);
			}
			
			//filter inventory by bin 
			if(storeroom){
				additionalInventory.filter('location == $1',storeroom);
				
				var additionalBin = CommonHandler._getAdditionalResource(eventContext,'additionalbin');
				CommonHandler._clearFilterForResource(eventContext,additionalBin);
				additionalBin.filter('location == $1',storeroom);
				if(binnum){
					additionalBin.filter('binnum == $1',binnum);
				}
				keys = {};
				additionalBin.foreach(function(record){
					keys[record.get('itemnum')] = true;
				});
				additionalInventory.filter("$1[itemnum]", keys);
			}
			
			return additionalInventory.sort('itemnum');
			
			//End filter item by inventory
		},
		
		filterItemForLookup : function(eventContext) {
			// set lookup filter on addtionalInventory
			var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			additionalInventory.lookupFilter = this.buildFilterForItem(eventContext, null);
		},
		
		asyncFilterItemForLookup : function(eventContext) {
			// set lookup filter on addtionalInventory
			var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			CommonHandler._clearFilterForResource(eventContext,additionalInventory);
			additionalInventory.lookupFilter = this.buildFilterForItem(eventContext, null);
		},
		selectableItemStatusesAsFilter: function(eventContext){
			var domainitemstatus = CommonHandler._getAdditionalResource(eventContext,'domainitemstatus');			
			var internalStatuses = ['ACTIVE', 'PENDOBS'];
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
		buildFilterForItem : function(eventContext, itemnum) {
			/*  builds a filter for showing the item lookup and performing async validation
			 * 
			 * 	build filter on additionalInventory with status of ACTIVE, PENDOBS, siteid, itemtype
			 * 	if there's a storeroom set (location), add storeroom to the filter.
			 * 	if there's a storeroom and a binnum set, add binnum to the filter
			 */
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var storeroom = creatingMaterialItem.get("storeroom");
			var binnum = creatingMaterialItem.get("binnum");
			var linetype = creatingMaterialItem.get("linetype");
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			CommonHandler._clearFilterForResource(eventContext,additionalInventory);

			var statuses = this.selectableItemStatusesAsFilter(eventContext);
			var filter = [];
			// create a filter for each status that has everything you need to filter on
			filter.push({"siteid": siteid});
			filter.push({"itemtype": linetype});
			if (itemnum) {
				// add a filter term for itemnum if it is set - used by validate, not lookup
				filter.push({"itemnum": itemnum});
			}
			if (storeroom) {
				// add a filter term for location if storeroom is set
				filter.push({"location": storeroom});
				if (binnum) {
					filter.push({"binnum" : binnum});
				}
			}
			return arrayUtil.map(statuses, function(anStatus){
				var result = lang.mixin({}, anStatus);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});			
		},
		
		asyncValidateItem : function(eventContext) {
			var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var itemnum = creatingMaterialItem.getPendingOrOriginalValue('itemnum');
			var rotassetmetadata = creatingMaterialItem.getRuntimeFieldMetadata('rotassetnum');
			
			// We can only validate if ITEMNUM is specified
			if(!itemnum){
				creatingMaterialItem.set('itemdesc', '');
				creatingMaterialItem.set('binnum', '');
				creatingMaterialItem.set('storeroom', '');
				rotassetmetadata.set('required',false);
				rotassetmetadata.set('readonly',false);
				return;
			}
			
			//defect 113779 - avoid double validation calls
			creatingMaterialItem.set('itemnum',itemnum);
			
			var filter = this.buildFilterForItem(eventContext, itemnum);
			var inventoryPromise = this.async_getItemPromise(filter);
			this.async_checkForItem(inventoryPromise, rotassetmetadata, creatingMaterialItem);
		},
	
		async_getItemPromise : function(filter) {
			return ModelService.filtered('additionalInventory', null, filter, null, false, true);
		},
		
		async_checkForItem : function(itemSet, rotassetmetadata, creatingMaterialItem){
			if(itemSet.count() == 0) {
				creatingMaterialItem.set('itemdesc', '');
				throw new PlatformRuntimeWarning('invalidItem');
			}else{
				var item = itemSet.getRecordAt(0);

				//Set description on the master record, considering the itemnum is valid
				creatingMaterialItem.set('itemdesc', item.get('description'));
				
				// defect 147627 storeroom value entered when item is manually entered
				if (itemSet.count() == 1) {
					creatingMaterialItem.set('storeroom', item.get('location'));
					creatingMaterialItem.set('binnum', item.get('binnum'));
				}
				
				//check if it's a rotating item
				if (item.get('rotating')) {
				    //set rotassetnum field to required
					rotassetmetadata.set('required',true);
					rotassetmetadata.set('readonly',false);
				} else {
				    //set rotassetnum to read only
					rotassetmetadata.set('required',false);
					rotassetmetadata.set('readonly',true);
				}
			}
		},
		
		validateLineType : function(eventContext){
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var lineType = curr.getPendingOrOriginalValue('linetype');
			
			// We can only validate if LINE TYPE is specified
			if(!lineType) return;
			
			var lineTypeSet = CommonHandler._getAdditionalResource(eventContext,'additionalLineType');
			var isValid = lineTypeSet.find('itemtype == $1', lineType);
			
			//In case no Linetype is found, warn the user
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidLineType');
			}			
		},		
	
		asyncValidatePage : function(eventContext){
			var curr = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var lineType = curr.get('linetype');
			
			var varLineType = CommonHandler._getAdditionalResource(eventContext,'additionalLineType');
			if(lineType == SynonymDomain.resolveToDefaultExternal(varLineType, 'ITEM')){				
				
				//Validate ItemNum
				var itemNum = curr.get('itemnum');
				if(!itemNum) {
					throw new PlatformRuntimeException('noItemFound');
				}
				
				//Validate Storeroom
				var storeroom = curr.get('storeroom');
				if(!storeroom) {
					throw new PlatformRuntimeException('noStoreroomFound');
				}
				
				//Validate Quantity
				var quantity = curr.get('quantity');
				if(quantity <= 0){
					throw new PlatformRuntimeException('materialQuantityPositive');
				}
				
				var varLineType = CommonHandler._getAdditionalResource(eventContext,'additionalLineType');
				
				var itemSet = CommonHandler._getAdditionalResource(eventContext,'additionalitem');
				CommonHandler._clearFilterForResource(eventContext,itemSet);
				var rotatingAsset = curr.get('rotassetnum');
				if(!rotatingAsset){
					var rrPromise = this.async_getRotatingAssetPromise(itemNum);
					this.async_isItemRotating(rrPromise);
				}
		    } else if(lineType == SynonymDomain.resolveToInternal(varLineType, 'MATERIAL')){		
				
			}
		},
		
		async_getRotatingAssetPromise : function(itemNum) {
			return ModelService.firstMatchOfAdditionalDataFilteredOrNull('additionalitem', { itemnum: itemNum }, true);
		},

		async_isItemRotating : function(item){
			// we only require Rotating Asset if we know for sure the Item is Rotating
			if(item && item.get('rotating')){
				throw new PlatformRuntimeException('rotatingAssetRequired');
			}
		},
	});
});
