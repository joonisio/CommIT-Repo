/**
 * createdBy: lcassa@br.ibm.com
 * MarkerAnchor
 */
define("platform/map/directions/MarkerAnchor", 
[ "dojo/_base/declare"], 
function(declare) {
	return declare(null, {
		/** @memberOf platform.map.directions.MarkerAnchor */
		xOffset: 0,
		yOffset: 0,	

		constructor: function(xOffset, yOffset) {
			this.xOffset = xOffset;
			this.yOffset = yOffset;
		}
	});
});