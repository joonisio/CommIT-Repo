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

define("platform/model/_SystemResourceCache",
["platform/model/ModelDataSet"], 
function(ModelDataSet) {
	
	var cache = {};
	
	return {
/**@memberOf platform.model._SystemResourceCache */
		cacheSystemResource: function(resourceMetadata, jsonArray) {
			var dataSet = new ModelDataSet(resourceMetadata, null, jsonArray);
			cache[resourceMetadata.getResourceName()] = dataSet;
		},
		
		getCachedSystemResource: function(resourceName) {
			return cache[resourceName];
		},
		
		clearCache: function(){
			cache = {};
		}
	};
	
});
