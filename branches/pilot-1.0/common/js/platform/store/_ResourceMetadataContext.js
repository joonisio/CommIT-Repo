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

define("platform/store/_ResourceMetadataContext",
[ ], 
function(ResourceMetadata){
	var _resourcesMetadata = {};
	
	return {
		REMOTE_ID_ATTRIBUTE: 'remoteid',
		
/**@memberOf platform.store._ResourceMetadataContext */
		_clearCache: function(keepInMemoryResources){
			if (keepInMemoryResources){
				for (var resourceName in _resourcesMetadata){
					if (_resourcesMetadata.hasOwnProperty(resourceName) && 
						!_resourcesMetadata[resourceName].inMemory){
						
						_resourcesMetadata[resourceName].isInited = false;						
					}
				}
				
			} else {
				_resourcesMetadata = {};
			}
			
		},
		
		getResourceMetadata: function(resourceName) {
			return _resourcesMetadata[resourceName];
		},
		
		putResourceMetadata: function(resourceMetadata){
			var resourceName = resourceMetadata.name;
			if (!(resourceName in _resourcesMetadata)){
				_resourcesMetadata[resourceName] = resourceMetadata;
			}
		},
		
		getAllResourcesMetadata: function(){
			return _resourcesMetadata;
		}
	};
});
