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

define("application/handlers/CommonHandler",
		["platform/model/ModelService"], function(ModelService) {
		return {
		
		//Reusable method: Clear filter for a specific resource
/**@memberOf application.handlers.CommonHandler */
		_clearFilterForResource : function(self, resource) {
			if(resource && resource.isFiltered()) {
				resource.clearFilterAndSort();
			}
		},
		//Reusable method: Get SiteId of the current Work Order
		_getWorkorderSiteId : function(self) {
			if(this._getAdditionalResource(self, 'workOrder').getCurrentRecord() != null){
				return this._getAdditionalResource(self, 'workOrder').getCurrentRecord().get('siteid');
			}
			else{
				return null;
			}
		},
		//Reusable method: Returns a reference to a specific resource
		_getAdditionalResource : function(self ,resourceName) {
			return self.application.getResource(resourceName);
		},
		//Reusable method: Get ItemSetId related to a Site on the Inventory resource
		_getItemSetIdForSiteId : function(self, siteid, additionalInventory) {
			var inventorySet = additionalInventory.find('siteid == $1', siteid);
			return (inventorySet.length > 0) ? inventorySet[0].get('itemsetid') : null;
		},
		//Reusable method: Apply a filter on Inventory for a specific item 
		_filterAdditionalInventoryByItemnum : function(self ,additionalInventory, itemnum) {
			this._clearFilterForResource(self, additionalInventory);				
			additionalInventory.filter('itemnum == $1', itemnum);
		},
		//Reusable method: Get OrgId of the current Work Order
		_getWorkorderOrgId : function(self) {
			return this._getAdditionalResource(self, 'workOrder').getCurrentRecord().get('orgid');
		},
		//Reusable method: Get Location ID of an asset and site
		_getAssetLocation : function(self, additionalasset, asset, siteid) {
			var assetSet = additionalasset.find('assetnum == $1 && siteid == $2', asset, siteid);
			return (assetSet.length > 0) ? assetSet[0].get('location') : null;
		},
		//Reusable method: Get Location Object
		_getLocationByID : function(self, additionallocations, location, siteid) {
			var locSet = additionallocations.find('location == $1 && siteid == $2', location, siteid);
			return (locSet.length > 0) ? locSet[0] : null;
		},
		//Reusable method: Clear all record of a set
		_clearAll : function(recSet){
			recSet.deleteLocalAll();
			ModelService.save(recSet);
		}
		
	};
});
