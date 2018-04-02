/**
 * createdBy: lcassa@br.ibm.com
 * Holds a route request data
 */
define("platform/map/directions/RouteRequest", 
[ "dojo/_base/declare"], 
function(declare) {
	/** @class platform.map.directions.RouteRequest */
	return declare(null, {
		// a set of x,y points defining each stop of the route,
		// i.e. [[-46.624919, -23.609519],[-46.626919, -23.609719]]
		/** @memberOf platform.map.directions.RouteRequest */
		points: [], 
		// if this route is for driving, walking, etc
		travelMode: null,
		// km or mi or kilometers or miles
		distanceUnit: null,
		// language to retrieve the step-by-step directions
		// i.e. en-US, pt-BR, etc
		language: null,
		// give a route that is best to visit several stops
		optimize: false,
		// any specific parameters should go here
		additionalParameters: null,
		
		// array of LocalizedResources
		localizedResources: null,

		// points can be a plain 2d array containing 
		// or it can be an array of LocalizedResource
		constructor: function(/*points[] or LocalizedResource[]*/ points, /*String*/ travelMode, /*String*/ distanceUnit, /*String*/ language, /*boolean*/ optimize, /*JsonObject*/ additionalParameters) {
			this.points = this._extractPoints(points);
			this.travelMode = travelMode;
			this.distanceUnit = this._normalizeDistanceUnit(distanceUnit);
			this.language = language;
			this.optimize = optimize;
			this.additionalParameters = additionalParameters;
			
			//maybe i need to be more clear than that to verify if is LocalizedResource
			if (!Array.isArray(points[0])) {
				this.localizedResources = points;
			}			
			
		},

		/** @memberOf platform.map.directions.RouteRequest */
		_extractPoints: function(points) {
			if (Array.isArray(points[0])) {
				return points;
			}
			// LK0 should reinforce the type LocalizedResource?
			else {
				var result = [];
				points.forEach(function(element) {
					result.push([element.x, element.y]);
				});
				return result;
			}
		},

		_normalizeDistanceUnit: function(distanceUnit) {
			if (!distanceUnit) {
				return "km";
			}
			if (distanceUnit.toLowerCase().match(/\bkilometers|km/)) {
				return "km";
			}
			else if (distanceUnit.toLowerCase().match(/\bmiles|mi/)) {
				return "mi";
			}
			else {
				null;
			}
		}
	});
});
