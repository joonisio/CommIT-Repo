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

/*
 * Handle status change
 */
define("platform/map/GenericOnChangeStatusListener", 
[ "dojo/_base/declare",
  "platform/map/OnChangeStatusListener",
  "platform/logging/Logger"],
function(declare, OnChangeStatusListener, Logger) {
	/** @class platform.map.GenericOnChangeStatusListener */
	return declare(OnChangeStatusListener, {
		deferred: null,
		map: null,
		
		/*
		 * Receives a deferred object to resolve
		 */
		constructor: function(/*Deferred*/ deferred, /*AbstractMap*/ map) {
			this.deferred = deferred;
			this.map = map;
		},
		
		// TODO, the event is supposed to have a type like ChangeStatusEvent or something like that
		/** @memberOf platform.map.GenericOnChangeStatusListener */
		onChangeStatus: function(/*JSONObject*/ event) {
			Logger.trace("[platform.map.GenericOnChangeStatusListener] received a onChangeStatus event.status:" + event.status);

			if(event.status == "INITIALIZATION_FAILED" || event.status == "LAYER_LOADING_FAILED") {
				Logger.log("[platform.map.GenericOnChangeStatusListener] " + event.error);
				this.deferred.reject(event.error);
			}
			else {
				Logger.trace("[platform.map.GenericOnChangeStatusListener] layer initialized, resolving promise");
				this.deferred.resolve(this.map);
			}
		}
	});
});
