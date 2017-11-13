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

define("platform/store/_DataAccessStrategyBase",
["dojo/_base/declare"], 
function(declare) {
	/**@class platform.store._DataAccessStrategyBase */
	return declare("", null, {
		_metadata: null,
		/**@constructor platform.store._DataAccessStrategyBase */
		constructor: function(metadata){
			this._metadata = metadata;
		},
		
/**@memberOf platform.store._DataAccessStrategyBase */
		getAllResourceData: function(queryBase, pageSize){},
		queryResourceData: function(queryBase, query, pageSize){},
		getResourceById: function(resourceid){},
		getResourceByRef: function(resourceRef){},
		getChildResourceData: function(modelData, complexAttributeName){},
		getResourceNextPageData: function(nextPageInfo){}
	});
});
