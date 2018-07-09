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

define("platform/boot/data/PlatformStoresBuilder", 
	   [ "dojo/_base/declare",
	     "dojo/promise/all",
	     "platform/boot/data/_StoresBuilderBase",
	     "platform/store/ResourceMetadata",
	     "platform/store/PersistenceManager"
	     ],
function(declare, all, StoresBuilderBase, ResourceMetadata, PersistenceManager) {
	return declare("platform.boot.data.PlatformStoresBuilder", StoresBuilderBase, {
		
/**@memberOf platform.boot.data.PlatformStoresBuilder */
		_buildStoresAsync: function(promise){
			promise.resolve();			
		}
	
	});
});
