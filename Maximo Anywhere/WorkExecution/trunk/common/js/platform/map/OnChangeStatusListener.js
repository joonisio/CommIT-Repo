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

/**
 * createdBy: lcassa@br.ibm.com
 * Listen to the status changes on the map, i.e. when the map finishes loading
 */
define("platform/map/OnChangeStatusListener",
[ "dojo/_base/declare" ], 
function(declare) {
	return declare(null, {
/**@memberOf platform.map.OnChangeStatusListener */
		onChangeStatus: function(/*JSONObject*/ event) {
			// to be implemented by child class
		}
	});
});
