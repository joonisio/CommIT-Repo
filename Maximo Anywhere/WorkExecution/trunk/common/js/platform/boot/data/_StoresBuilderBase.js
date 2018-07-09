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

define("platform/boot/data/_StoresBuilderBase", 
	   [ "dojo/_base/declare",
	     "dojo/_base/Deferred" ],
function(declare, Deferred) {
	return declare("platform.boot.data._StoresBuilderBase", null, {
		
/**@memberOf platform.boot.data._StoresBuilderBase */
		build: function(){
			var promise = new Deferred();
			this._buildStoresAsync(promise);
			return promise;
		},
		
		_buildStoresAsync: function(promise){
			//To be overriden
		}
	});
});
