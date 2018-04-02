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

define("application/business/AssetMeterObject", 
		function(assetmeterlist) {
	return {
/**@memberOf application.business.AssetMeterObject */
		onInitialize : function(assetmeterlist) {		
			var currAsset = assetmeterlist.getOwner().getParent();
			if (currAsset) {
				assetmeterlist.set('assetnum', currAsset.get('assetnum'));
				assetmeterlist.set('assetdescription', currAsset.get('description'));				
			}
		},	
	};
});
