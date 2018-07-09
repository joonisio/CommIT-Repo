/**
 * createdBy: lcassa@br.ibm.com
 * This class is a generic interface for directions services
 */
define("platform/map/directions/DirectionsServiceInterface", 
["dojo/_base/declare", 
 "dojo/Deferred"
], 
function(declare, Deferred) {
	/** @class platform.map.directions.DirectionsServiceInterface */
	return declare(null, {
		restApiUrl: null,
		/** @memberOf platform.map.directions.DirectionsServiceInterface */
		additionalParameters: null,
		// holds the latest routeRequest
		/*RouteRequest*/ routeRequest: null,
		constructor: function(/*String*/ restApiUrl, /*JsonObject*/ additionalParameters) {

		},

		// Returns a promise of a platform.map.directionsService.RouteResult
		/*RouteResult*/ requestRoute: function(/*RouteRequest*/ request) {
			
		},
		
		
		//Return RouteResult from a response of a Provider (esri, google, bing, etc..) building the Directions (Steps, DirectionsLeg, etc). 
		//providerRouteResult contains a JsonObject that depends on provider service. We need to overwrite this method for each different provider.  
		/*RouteResult*/ buildRouteResult: function(/*JsonObject*/ providerRouteResult, /*LocalizedResource*/ localizedResources){
			
		}
	});
});
