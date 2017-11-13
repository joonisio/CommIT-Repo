/**
 * createdBy: lcassa@br.ibm.com
 * Holds a route request data
 */
define("platform/map/MarkerModel", 
[ "dojo/_base/declare"], 
function(declare) {
	return declare(null, {
		/*MarkerAnchor*/ anchor: null,
		// path to the image to be used
		/** @memberOf platform.map.MarkerModel */
		/*String*/ imagePath: null,
		fontSize: 0,
		color: "white",
		width: 0,
		height: 0,

		constructor: function(anchor, imagePath, fontSize, width, height, color) {
			this.anchor = anchor;
			this.imagePath = imagePath;
			this.fontSize = fontSize;
			this.color = color;
			this.width = width;
			this.height = height;
		}
	});
});