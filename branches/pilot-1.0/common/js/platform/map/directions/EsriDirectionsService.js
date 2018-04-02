/**
 * createdBy: lcassa@br.ibm.com
 * This class is responsible for retrieving route & directions from Esri (ArcGIS) services
 */
define("platform/map/directions/EsriDirectionsService", 
["dojo/_base/declare", 
 "dojo/_base/lang",
 "platform/map/directions/DirectionsServiceInterface",
 "dojo/Deferred",
 "platform/map/directions/RouteResult",
 "platform/map/directions/DirectionsLeg",
 "platform/map/directions/DirectionsStep",
 "platform/logging/Logger"
], 
function(declare, lang, DirectionsServiceInterface, Deferred, RouteResult, DirectionsLeg, DirectionsStep, Logger) {
	/** @class platform.map.directions.EsriDirectionsService */
	return declare(DirectionsServiceInterface, {

		_className: "platform.map.directions.EsriDirectionsService",
		
		currentLocationMessage: null,
		//default locale is US.
		locale: "en-US",
		constructor: function(/*String*/ restApiUrl, /*JsonObject*/ additionalParameters) {
			this.restApiUrl = restApiUrl;
			this.additionalParameters = additionalParameters;
			if(additionalParameters && additionalParameters['currentLocationMessage']){
				this.currentLocationMessage = additionalParameters['currentLocationMessage'];			
			}
			if(this.additionalParameters.locale){
				this.locale = this.additionalParameters.locale;
			}
		},
		/** @memberOf platform.map.directions.EsriDirectionsService 
		Returns a promise of a platform.map.directions.RouteResult
		RouteResult
		*/requestRoute: function(/*RouteRequest*/ request) {
			// http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve?token=<yourToken>&stops=-122.4079,37.78356;-122.404,37.782&f=json
			var deferred = new Deferred();
			this.routeRequest = request;

			var servicePoints = "stops=";
			
			//we need to verify if we are calculating route for gps leg or for records. If we are calculating for gps, we need to put explicitly the Current Location text.			
			var currentLocation = undefined;
			var firstLocation = undefined;
			
			if(request && request.localizedResources && request.localizedResources.length == 2){
				currentLocation = request.localizedResources[0];
				firstLocation = request.localizedResources[1];
			}
			
			//verify if currrentLocation has index=-1 and firstLocation has valid index
			if(currentLocation && currentLocation.attributes && currentLocation.attributes.index == -1 && currentLocation.attributes._id == -1 &&
					firstLocation && firstLocation.attributes && firstLocation.attributes.index != -1 && firstLocation.attributes._id != -1){
				
				var myCurrentLocation = "Current Location";
				//verify if current location text is valid. If is not valid, use english.
				if(this.currentLocationMessage && this.currentLocationMessage.trim() != ""){
					myCurrentLocation = this.currentLocationMessage;
				}
				var tempPoints = this.routeRequest.points;
				servicePoints += "{'features':[{'geometry':{'x':"+tempPoints[0][0]+",'y':"+tempPoints[0][1]+"},'attributes':{'Name':'"+myCurrentLocation+"'}}," +
						"{'geometry':{'x':"+tempPoints[1][0]+",'y':"+tempPoints[1][1]+"},'attributes':{'Name':'1'}}]}";
			}
			//otherwise, rotes are calculate to records, without gps leg.
			else{
				request.points.forEach(function(point, index, pointsArray) {
					// esri send x,y | lng,lat
					// builds something like loc=-23.680307,-48.649196&loc=-23.590307,-46.749196
					servicePoints += point[0] + "," + point[1] + ";";
				});	
				servicePoints = servicePoints.substring(0, servicePoints.length-1);
			}
			
			if(!this.restApiUrl) {
				deferred.reject("No rest service url provided");
			}
			var locale = this.locale;
			this._getToken(this.additionalParameters).then(lang.hitch(this, function(token) {
				Logger.trace(this._className + " - token: " + token);
				var serviceRequest = this.restApiUrl + "?token=" + token + "&f=json&" + servicePoints + "&directionsLanguage="+locale;
				var xmlhttp = (window.XMLHttpRequest)? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
				xmlhttp.onreadystatechange = lang.hitch(this, function() {
					if ((xmlhttp.readyState == 4) && xmlhttp.status == 200) {
						var ajaxResponse;

						try {
					    	ajaxResponse = JSON.parse(xmlhttp.response);
						} catch (e) {
							deferred.reject("Unable to parse response from directions service " + e.error);
							return;
						}
						// LK0 does this need a try/catch?
						if (ajaxResponse.hasOwnProperty("error")) {
							// "{"error":{"code":498,"message":"Invalid Token","details":[]}}"
							var message = JSON.stringify(ajaxResponse.error);
							deferred.reject("There is a problem requesting the directions: "+message);
							return;
						};
						
						var result;
						//if we have localizedResources, we need to use the meta data info
						if(this.routeRequest.localizedResources && this.routeRequest.localizedResources[0]){
							result = this.buildRouteResult(ajaxResponse, this.routeRequest.localizedResources);
						}
						else{
							result = this.buildRouteResult(ajaxResponse);
						}						
						
						if(!result) {
							// LK0 explain the error and reject
							deferred.reject("Something went wrong!");
							return;
						}
						// if there is a valid result, save the original results to the routeResult object
						result.setProviderRouteResults(ajaxResponse);
						// resolve the promise
						deferred.resolve(result);
						return;
					}
					else if (xmlhttp.readyState == 4) {
						// LK0 need to explain the problem
						deferred.reject("Directions Service request failed with status: " + xmlhttp.status);
					}
				});
				xmlhttp.open("GET", serviceRequest, true);
				xmlhttp.send();
				return deferred.promise;
			})).otherwise(function() {
				deferred.reject("Unable to retrieve token");
			});

			return deferred.promise;
		},

		/*RouteResult*/ buildRouteResult: function(jsonResult, localizedResources) {
			if (jsonResult.routes && jsonResult.routes.features) {
				var routeResult = jsonResult.routes.features[0];
				var routeAttributes = routeResult.attributes;
				var geometryPath = [];

				if (!routeResult.geometry || !routeResult.geometry.paths || !routeResult.geometry.paths[0]) {
					return null;
				}
				
				for(var i=0; i<routeResult.geometry.paths.length; i++){
					for(var j=0; j<routeResult.geometry.paths[i].length; j++){
						// esri send x,y | lng,lat
						geometryPath.push(routeResult.geometry.paths[i][j]);
					}
				}

				var ETA = routeAttributes.Total_TravelTime;

				var distance = 0;
				if (this.routeRequest) {
					if (this.routeRequest.distanceUnit == "km") {
						distance = routeAttributes.Total_Kilometers;
					}
					else {
						distance = routeAttributes.Total_Miles;
					}
				}

				var directions = "";
				var legs = [];
				var directionsLeg = new DirectionsLeg();
				
				//TODO: This was put here to resolve temporary a memory retain that is occurring with array
				directionsLeg.steps = new Array();
								
				var currentIndex = 0;
				var that = this;
				// create legs and merge directions
				jsonResult.directions[0].features.forEach(lang.hitch(localizedResources,function(step) {
					var directionsStep = new DirectionsStep();
					var stepAttributes = step.attributes;

					directionsStep.length = stepAttributes.length;
					directionsStep.time = stepAttributes.time;
					directionsStep.directions = stepAttributes.text;
					directionsStep.ETA = stepAttributes.ETA;

					var directionsText = stepAttributes.text;
					directions += (directionsText && directionsText.length > 0)? (directionsText + ", ") : "";

					directionsLeg.steps.push(directionsStep);
					directionsLeg.length += stepAttributes.length;
					directionsLeg.directions += (stepAttributes.text && stepAttributes.text.length > 0)? (stepAttributes.text + ", ") : "";
					directionsLeg.lengthUnit = that.routeRequest.distanceUnit;
					// LK0 this is likely to be wrong, leaving like this now
					// it ain't something we use any way
					directionsLeg.ETA += stepAttributes.ETA;

					if (stepAttributes.maneuverType == "esriDMTStop") {
						
						directionsLeg.index = currentIndex;						
						if(localizedResources){			
							
							if(currentIndex <= localizedResources.length && localizedResources[currentIndex] && localizedResources[currentIndex].attributes){
								var currentAttributes = localizedResources[currentIndex].attributes;
								if(currentAttributes._id || currentAttributes._id >= 0){
									directionsLeg.originId = currentAttributes._id;
								}
								if(currentAttributes.index || currentAttributes.index >= 0){
									directionsLeg.originIndex = currentAttributes.index;
								}
								directionsLeg.originEncodedPNG = currentAttributes.encodedPNG;
							}
							else{
								directionsLeg.originId = -1;
							}							
										
							if(currentIndex+1 <= localizedResources.length && localizedResources[currentIndex+1] && localizedResources[currentIndex+1].attributes){
								var nextAttributes = localizedResources[currentIndex+1].attributes;
								if(nextAttributes._id || nextAttributes._id >= 0){
									directionsLeg.destinationId = nextAttributes._id;
								}
								if(nextAttributes.index || nextAttributes.index >= 0){
									directionsLeg.destinationIndex = nextAttributes.index;
								}
								directionsLeg.destinationEncodedPNG = nextAttributes.encodedPNG;
							}
							else{
								directionsLeg.destinationIndex = -1;
							}
						}
						
						// fix extra ', '
						directionsLeg.directions = directionsLeg.directions.substring(0, directionsLeg.directions.length-2);
						// LK0 no destinationIndex, destinationEncodedPNG,originIndex,originEncodedPNG
						legs.push(directionsLeg);
						directionsLeg = new DirectionsLeg();
						
						//TODO: This was put here to resolve temporary a memory retain that is occurring with array
						directionsLeg.steps = new Array();
						
						currentIndex++;						
					}
				}));
				// fix extra ', '
				directions = directions.substring(0, directions.length-2);
			}
			else {
				return null;
			}
			
			var result = new RouteResult(geometryPath, ETA, distance, this.routeRequest.distanceUnit, this.routeRequest.language, this.routeRequest.travelMode, directions, legs, localizedResources);
			return result;
		},

		/*Promise*/ _getToken: function(additionalParameters) {
			var deferred = new Deferred();
			if (additionalParameters.token) {
				deferred.resolve(additionalParameters.token);
				return deferred.promise;
			}

			var xmlhttp = (window.XMLHttpRequest)? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
		
			xmlhttp.onreadystatechange = function() {
				if ((xmlhttp.readyState == 3 || xmlhttp.readyState == 4) && xmlhttp.status == 200) {
					var ajaxResponse;

					try {
				    	ajaxResponse = JSON.parse(xmlhttp.response);
					} catch (e) {
						var message =  "Unable to parse response from token service " + e.error;
						Logger.trace(this._className + " " + message);
						deferred.reject(message);
						return deferred.promise;
					}

					if (ajaxResponse.hasOwnProperty("error")) {
						var details = JSON.stringify(ajaxResponse.error.details);
						var message = "There was a problem requesting the token, " + ajaxResponse.error.message + "[code: " + ajaxResponse.error.code + "], details:"+details;
						Logger.trace(this._className + " " + message);
						deferred.reject(message);
						return deferred.promise;
					}
					Logger.trace(this._className + " - Generated token: " + ajaxResponse.token);
					deferred.resolve(ajaxResponse.token);
				}
				else if (xmlhttp.readyState == 4) {
					Logger.trace(this._className + " - Token generation with problems...readyState=4 and status=" + xmlhttp.status);
					deferred.reject(null);
				}
			};

			var username = additionalParameters.username;
			var password = additionalParameters.password;
			var tokenService = additionalParameters.tokenService;
			var referer = additionalParameters.refererRoute;
			var isGetMethodEnabled = additionalParameters.isGetMethodEnabled;
			
			//If the customer does not have an internal server for routes, use the esri default one.
			if(!tokenService){
				tokenService = "https://www.arcgis.com/sharing/generateToken";
			}
			
			//If the customer does not have an internal server for routes, use the esri default one.
			if(!referer){
				referer = "https://www.arcgis.com";
			}
			
			if(!isGetMethodEnabled || (isGetMethodEnabled && isGetMethodEnabled.trim() == "0")){
				var tokenRequest =
					"username=" + username + 
					"&password=" + password + 
					"&referer=" + referer + 
					"&f=pjson";
							
				xmlhttp.open("POST", tokenService, true);
				xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xmlhttp.send(tokenRequest);
			}
			else{
				var tokenRequest =  tokenService + 
					"?username=" + username + 
					"&password=" + password + 
					"&referer=" + referer + 
					"&f=pjson";
							
				xmlhttp.open("GET", tokenRequest, true);
				xmlhttp.send();
			}

			return deferred.promise;
		}
	});
});

