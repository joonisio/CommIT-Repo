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
 * Just an interface to listen to any MapEvent
 * TODO, this should evolve to specific types of events
 */
define("platform/map/OnMapEventListener",
[ "dojo/_base/declare" ], 
function(declare) {
	return declare(null, {
/**@memberOf platform.map.OnMapEventListener */
		onMapEvent: function(/*JSONObject*/ event) {
			// to be implemented by child class
		}
	});
});
