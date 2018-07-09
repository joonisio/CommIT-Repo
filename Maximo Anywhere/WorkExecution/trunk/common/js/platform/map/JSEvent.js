/**
 * createdBy: lcassa@br.ibm.com
 * Holds a route request data
 */
define("platform/map/JSEvent", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/logging/Logger"], 
function(declare, lang, Deferred, Logger) {
	/** @class platform.map.JSEvent */
	return declare(null, {
		_map: null,
		/*JSONObject*/data: null,
		/*String*/type: null,
		/*String*/jsListener: null,
	
		constructor: function(/*String*/ eventType, /*JSONObject*/ data) {
			this.data = data;
			this.type = eventType;

			data['type'] = eventType;
		},
		
		/** @memberOf platform.map.JSEvent */
		/*JSONObject*/getData: function() {
			return this.data;
		},
		
		/*String*/getType: function() {
			return this.type;
		},
		
		setData: function(/*JSONObject*/ data) {
			this.data = data;
		},
		setEventType: function(/*String*/ eventType) {
			this.type = eventType;
		},
		
		/*String*/getJsListener: function() {
			return this.jsListener;
		},
	});
});
