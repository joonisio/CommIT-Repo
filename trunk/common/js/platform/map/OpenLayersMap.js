define("platform/map/OpenLayersMap",
[ "dojo/_base/declare", 
  "dojo/on",
  "platform/map/AbstractMap",
  "dojo/Deferred",
  "dojo/_base/lang",
  "platform/logging/Logger",
  "platform/map/directions/RouteRequest",
  "platform/map/directions/OLDirectionsRenderer",
  "platform/map/ResourceLocationExtractor",
  "platform/map/LocalizedResource",
  "platform/map/OLMarkerRenderer",
  "platform/map/MarkerModel",
  "platform/map/MarkerInfo",
  "platform/map/OLEventDispatcher",
  "platform/translation/MessageService",
  "platform/map/JSEvent",
  "dojo/dom-geometry",
  "platform/map/MapProperties",
  "platform/map/esriTilePackageManager",
  "platform/map/esriTileCacheManager",
  "platform/map/esriFeatureServiceManager",
  "platform/comm/_ConnectivityChecker",
  "platform/model/ModelService",
  "platform/store/_ResourceMetadataContext",
  "platform/map/spatial/MobileMaximoSpatial",
  "dojo/_base/array"], 
function(declare, on, AbstractMap, Deferred, lang, Logger, RouteRequest, DirectionsRenderer, 
	ResourceLocationExtractor, LocalizedResource, MarkerRenderer, MarkerModel, MarkerInfo, 
	EventDispatcher, MessageService, JSEvent, domGeom, MapProperties, tpkmanager, cacheManager, featureServiceManager,
	ConnectivityChecker, ModelService, ResourceMetaData, MobileMaximoSpatial, array) {
	return declare(AbstractMap, {
		_className: "[platform.map.OpenLayersMap]",
		_map: null,
		transformSrc: 'EPSG:4326',
		transformTrg: 'EPSG:3857',
		glayer: null,
		relatedLayers: null,
		layers: null,
		gpsLayer: null,
		resourceIndexes: null,
		selectedFeatures: [],
		markerModel: null,
		markerModelImage: null,
		selectedMarkerModel: null,
		selectedMarkerModelImage: null,
		gpsMarkerModelImage: null,
		gpsMarkerModel: null,
		markerRenderer: null,
		eventDispatcher: null,
		hasLoadMapErrors: false,
		mobileMaximoSpatial: null,
		hasGPSPosition: false,
		
		//constant used to adjust all markers and gps on screen (fit all on screen)
		ADJUST_CONSTANT:0.0001,
		
		// zoom statuses
		STATUS_CENTRALIZE: 1,
		STATUS_FIT: 2,
		STATUS_FITALL: 3,
		STATUS_USERMOVE: 4,
		STATUS_EMPTY: 5,
		zoomStatus: 5,
		
		//when we go out of map and returns (on cases that we need to centralize marker on screen) we need to reuse the last zoom value.
		lastZoomUsed: -1,
		
		currentSelectedPoint: null,
		gpsPoint: null,
		fullExtent: null,
		directionsService: null,
		cachedDirections: null,
		gpsCachedDirections: null,
		
		/*promises about offline maps*/
		globalGPSPromiseOfflineMaps: null,
		globalBoundsPromiseOfflineMaps: null,
		
		//contains properties values for set map from worklight.properties
		mapProperties: null,
		
		userAuthenticationManager: null,
		

		/* 
		 * specificParameters can have the following parameters, default is null
		 * provider - esri,osm,google,bing, default is osm
		 * target - the DOM element where the map is going to be placed, default is 'olmap'
		 * zoom - level of zoom set when maps is shown, default is 18
		 * centerx - x position where the map is centered, default is 0
		 * centery - y position where the map is centered, default is 0
		 * transformSrc - the source spatial reference to be transformed, default is'EPSG:4326'
		 * transformTrg - the target spatial reference to be transformed, default is'EPSG:3857'
		 */

		constructor: function(/*String*/ providerUrl, /*JSONObject*/ container, /*JSONObject*/ specificParameters) {
			this.providerUrl = providerUrl;
			this.specificParameters = specificParameters;
			this.mapProperties = MapProperties.getProperties();	
			this.mobileMaximoSpatial = new platform.map.spatial.MobileMaximoSpatial({openLayerMap: this});
			require(["platform/auth/UserAuthenticationManager"], dojo.hitch(this, function(UAM){
				this.userAuthenticationManager = UAM;
			}));
		},

/**@memberOf platform.map.OpenLayersMap */
		init: function() {
			this.globalGPSPromiseOfflineMaps = new Deferred();
			this.globalBoundsPromiseOfflineMaps = new Deferred();
		    var deferred = new Deferred();
			var resolveDeferred = true;
			// try OpenLayers api
			try {
				if(ol && ol.Map) {
					if (this.specificParameters) {
						var provider = this.specificParameters['provider'];

						if (provider) {
							
							//only on first time we use default zoom, other times, we use the last zoom used.
							var zoom = (this.specificParameters['zoom'])? this.specificParameters['zoom'] : 3;
							if(this.lastZoomUsed >= 0){
								zoom = this.lastZoomUsed;
							}
							else {
							    this.lastZoomUsed = zoom;
							}

							var target = this._getTarget(this.container);
							
							var centerx = (this.specificParameters['centerx'])? this.specificParameters['centerx'] : 0;
							var centery = (this.specificParameters['centery'])? this.specificParameters['centery'] : 0;
							this.transformSrc = (this.specificParameters['transformSrc'])? this.specificParameters['transformSrc'] : this.transformSrc;
							this.transformTrg = (this.specificParameters['transformTrg'])? this.specificParameters['transformTrg'] : this.transformTrg;

							// group layer
							this.glayer = new ol.layer.Group();
							// collection of the layers
							this.layers = [];
							this.relatedLayers = [];
	
							var maxZoom = undefined;
							if(this.mapProperties){
								var tempMaxZoom = this.mapProperties["si.map.openLayers.maxZoom"];
								if(tempMaxZoom && tempMaxZoom.json && tempMaxZoom.json.propertyValue){
									tempMaxZoom = tempMaxZoom.json.propertyValue; 
									if(Number(tempMaxZoom) > 0){
										maxZoom = Number(tempMaxZoom);
									}
								}
							}
	
							if (!this._map) {
								switch(provider.toLowerCase()) {
									case "osm":
										this._map = new ol.Map({
											controls: ol.control.defaults().extend([
											    new ol.control.FullScreen()
											]),
											layers: [
												new ol.layer.Tile({
													source: new ol.source.OSM()
												}),
												this.glayer
											],
											target: target,
											view: new ol.View({
												center: ol.proj.transform([centerx, centery], this.transformSrc, this.transformTrg),
												zoom: zoom
											})
										});
										break;
									case "bing":
										var key = (this.specificParameters['key'])? this.specificParameters['key'] : 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3';
										var imagerySet = (this.specificParameters['imagerySet'])? this.specificParameters['imagerySet'] : 'Road';
										this._map = new ol.Map({
											controls: ol.control.defaults().extend([
											    new ol.control.FullScreen()
											]),
											layers: [
												new ol.layer.Tile({
													source: new ol.source.BingMaps({
												    	key: key,
												    	imagerySet: imagerySet
												    })
												}),
												this.glayer
											],
											target: target,
											view: new ol.View({
												center: ol.proj.transform([centerx, centery], this.transformSrc, this.transformTrg),
												zoom: zoom
											})
										});
										break;
									case "google":
										Logger.warn("No support for Google Maps");
										break;
									case "esri":
										var that = this;
										var providerUrl = (this.specificParameters['providerUrl']) ? this.specificParameters['providerUrl'] : '';
									    var localMapUrl = this.specificParameters['localMapUrl'];

										var source = new ol.source.XYZ({
					    					url: providerUrl
					    				});
										
										//openlayers offline now available just for windows
										if(localMapUrl){//need to be sure that there is a file location configured in case of windows environment
											if(!providerUrl && (WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS8)){
											    resolveDeferred = false;
											    tpkmanager.getWinBaseMapTPK(this.container, localMapUrl).then(function (msg) {
											    	//this is special important when map has no markers, so we fit view on the center of the map
											        if (tpkmanager._inMemTilesObject && tpkmanager._inMemTilesObject["SERVICEDESCRIPTIONS/MAPSERVER/MAPSERVER.JSON"]) {
											            var fullExtent = JSON.parse(tpkmanager._inMemTilesObject["SERVICEDESCRIPTIONS/MAPSERVER/MAPSERVER.JSON"]).contents.fullExtent;
											            
											            //var tempExtend = [fullExtent.xmin, fullExtent.ymin, fullExtent.xmax, fullExtent.ymax];
											            
											            var minPoint = [fullExtent.xmin, fullExtent.ymin];
											            var maxPoint = [fullExtent.xmax, fullExtent.ymax];
											            
											            var boundingExtend = ol.extent.boundingExtent([minPoint, maxPoint]);
											            
											            //instead of fit on specific location, fit on entire map (important when there is no markers)
											            var view = that._map.getView();
											            //view.setCenter(ol.extent.getCenter(tempExtend));
											            view.fit(boundingExtend, that._map.getSize());
											            
											            that.lastZoomUsed = that._map.getView().getZoom() + 1;
											            view.setZoom(that.lastZoomUsed);

											            that.globalGPSPromiseOfflineMaps.resolve(fullExtent);
											            that.globalBoundsPromiseOfflineMaps.resolve(fullExtent);
											            deferred.resolve();
											        }
											    }).otherwise(function (err) {
											        var msg = MessageService.createResolvedMessage('localMapUrlDontExist', [localMapUrl]);
											        that._showErrorMsg(msg);
											        return;
											    });
											}
										}
										//if does not have localMapUrl and does not have providerUrl (online map), the customer need to specify something on app.xml
										else if(!providerUrl){
											var msg = MessageService.createResolvedMessage('localMapUrlDontExist', [localMapUrl]);
									        that._showErrorMsg(msg);
									        return;
										}
		                                
										source.tileLoadFunction = function(imageTile, src) {
											//online map
											if(providerUrl){
												imageTile.getImage().src = src;
											}
											//offline map
											else{
												var tilePoint = {};
			                                    tilePoint.z = imageTile.tileCoord[0];
			                                    tilePoint.x = imageTile.tileCoord[1];
			                                    tilePoint.y = (imageTile.tileCoord[2] + 1) * -1;
			                                    if (tpkmanager.isTPKLoaded() === true) { 
			                                        imageTile.getImage().src = tpkmanager.getTileUrl(tilePoint);
			                                    } else {
			                                        imageTile.getImage().src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAABQdJREFUeNrs2yFv6mocwOH/ualYRUVJRrKKCRATCCZqJ/mOfKQJBGaiYkcguoSJigoQTc4VN222Mdhu7l0ysudJjqFAD13669u37a/lcvkngB8piYhYLBa2BPxAf9kEIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAgAIAAAAIACAAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIAPxsiU3wfbRtG1mWnVzedV3kef7q9a7rYrvdxm63i4iILMtiNBpFkiQfftdnZFkWbdtGRAzr7j+fZdnR9Xy0jiRJTv5eBOBHqaoqsiyLm5ubo8ubponFYjG8Vtd1VFV1sKMlSRI3NzdRFMXJ7/qMsixjtVpFRAzr7j9fluVBkD67jjzPoyxLf3gBoLfZbGI8Hh/dqV6q6zoeHh4iSZKYTCYxGo0iImK73Q7Luq6L6+vrg88WRfFqHfv9Puq6jjRN4+rq6tV7Ly4u/tNvKori3e9I09QfXAB4a71ex93d3ckhfNd1UVXVcIR+OZTO8zyKooj7+/uoqiouLy8Pdra3I4OmaaKu67i4uIjpdPq//p63seH7MAn4DXVdF+v1+sOjf390f+88Osuy4ci/2WxsVATgXEwmk2ia5uSOu91uIyJiPB4ffU+/rJ/AA6cAZ2A6ncbz83NUVRV5nr97hO8n104Nrftln53s+ypVVR2czpj8MwLghPl8HkmSDBN556xt22ia5tU/jAA4IU3TmE6nUVVVVFUVs9nsbH/LqUuFGAFwxPX1deR5HnVdD+f8LwPx0fl9f2OQy20IwJm6vb0dTgX2+/3wej8vcCoA/VDb3XYIwLmeoyVJzGaz6LpuOKJHRFxeXkbEP5cDj+mX9e8FAThD4/H44HJfURSRpmk0TROPj48Hn3l4eIimaSJN06O3A4NJwDMxm82ibdtXo4D5fB6r1Sp+//4dz8/Pw5H+6ekpdrtdJEkS8/n8S/9f713ie3vaceo9x557QAB451Sgfyin34HKshweunk5HzAej2MymXz5+f9nbjJyI9L39Wu5XP55+XQZ39uxR4Z3u90wSXjqEV0wAjhjx47oaZq63Me/ZhIQBAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEAAbAJQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEAvqe/BwCeKjUweoA8pQAAAABJRU5ErkJggg==";
			                                    }
											}

											imageTile.getImage().onerror = function(error){
												if(that._checkNetworkConnection()){
													that.hasLoadMapErrors = true;												
													that._checkForLoadImageError();
												}												
											};
											
											imageTile.getImage().onload = function(){
												that.hasLoadMapErrors = false;
											};
										};
										
										this._map = new ol.Map({
											controls: ol.control.defaults({
												attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
											    	collapsible: false
												})
											}),
											layers: [
												 new ol.layer.Tile({
													source: source
												}),
												this.glayer
											],
											target: target,
											view: new ol.View({
												center: ol.proj.transform([centerx, centery], this.transformSrc, this.transformTrg),
												zoom: zoom, 
												maxZoom: maxZoom
											})
										});
					 					break;
									// osm
					 					
									case "mxspatial":
										//ModelService and map logic
										Logger.trace("Spatial Maps Logic Starts Here");

										resolveDeferred = false;

										this.mobileMaximoSpatial.createMap( target, lang.hitch(this, function(mapInstance) {
												//Callback function
												var workOrderSet = WL.application.getResource("workOrder");
												workOrderSet.mobileMaximoSpatial = this.mobileMaximoSpatial;
												console.log(workOrderSet);
												this._map = mapInstance;
												
												this.eventDispatcher = new EventDispatcher(this._map);
												this.markerModel = new MarkerModel({
													xOffset : 0.5,
													yOffset : 46
												}, 'images/mdpi/map_wo_default.png', 15);
												this.selectedMarkerModel = new MarkerModel({
													xOffset : 0.5,
													yOffset : 46
												}, 'images/mdpi/map_wo_default_selected.png', 15);
												this.gpsMarkerModel = new MarkerModel({
													xOffset : 0.5,
													yOffset : 0.5
												}, 'images/mdpi/map_current_location.png', 15);
												this.markerRenderer = new MarkerRenderer();
												this._map.on('moveend', lang.hitch(this, function() {
													this.lastZoomUsed = this._map.getView().getZoom();
												}));
												this._setupLocale();
												this.cachedDirections = new Object();
												
												var extent = null
												if (this.mobileMaximoSpatial.showingOnlineMap == false) {
													var mapSpatial = this.mobileMaximoSpatial.map;			
													this.lastZoomUsed = mapSpatial.getView().getZoom();
											        extent = mapSpatial.getView().calculateExtent(mapSpatial.getSize());
												} 
												
												this.globalGPSPromiseOfflineMaps.resolve(extent);
												this.globalBoundsPromiseOfflineMaps.resolve(extent);
												
												
												deferred.resolve();
														
											}), lang.hitch(this, function(errorKey, errorDetails) {
												WL.application.hideBusy();
												var message = "[OpenLayersMap.js] - error on loading map. " + errorKey + "- " + errorDetails;
												Logger.log(message);
												var msg = MessageService.createResolvedMessage(errorKey, [errorDetails]);
												this._showErrorMsg(msg);
											}) );
													
									break;
									// osm
									default:
										provider = "osm";
								}
							}
							
							if (this._map) { 
								this.eventDispatcher = new EventDispatcher(this._map);
								this.markerModel = new MarkerModel(
									{ xOffset:0.5, yOffset:46 }, 
									'images/mdpi/map_wo_default.png', 
									15
								);
								this.selectedMarkerModel = new MarkerModel(
									{ xOffset:0.5, yOffset:46 }, 
									'images/mdpi/map_wo_default_selected.png', 
									15
								);
								this.gpsMarkerModel = new MarkerModel(
									{ xOffset:0.5, yOffset:0.5 }, 
									'images/mdpi/map_current_location.png', 
									15
								);
								this.markerRenderer = new MarkerRenderer();
								
								var that = this;
							
								this._map.on('moveend', lang.hitch(that, function() {
									//that.zoomStatus = that.STATUS_USERMOVE;//we need other way to control user move
									that.lastZoomUsed = that._map.getView().getZoom();
								}));
							}
							this._setupLocale();
							this.cachedDirections = new Object();
						}
						else {
							Logger.trace(this._className + " bad class for this type of map");
						}
						this._setMapType(provider);
					}
					else {
						Logger.trace(this._className + " no specificParameters set");
					}
				}
				else {
					Logger.trace(this._className + " OpenLayers API doesn't seem to be loaded");
		        }
				if (resolveDeferred) {
					deferred.resolve();
				}
			}
			catch(err) { 
				Logger.trace(this._className + " an error occurred trying to reach out for the OpenLayers API, " + err);
		        deferred.reject();
			}
		    return deferred.promise;
		},
		
		_showErrorMsg: function(msg){
			var mapDetail = document.querySelector(".dijitContentPane[mapDetails]");
	        if (mapDetail) {
	            mapDetail.innerHTML = '<p class="maperror">' + msg + '</p>';
	            mapDetail.setAttribute('style', 'block');
	        }
		},

		_getTarget: function(/*DOMNode*/ container) {
			// tries to resolve target from container attribute
			if (container instanceof HTMLElement || container instanceof Node || container.hasOwnProperty("nodeType")) {
				var target = container.getAttribute("id");
			}
			// tries to resolve the target from specificParameters
			else {
				var target = (this.specificParameters['target'])? this.specificParameters['target'] : "olmap";
			}

			return target;
		},

		setContainer: function(/*DOMNode*/ container) {
			var dimension = domGeom.position(container, true);
			Logger.log("[OpenLayersMap.js] setContainer w:" + dimension.w + ", h:" + dimension.h + ", x: " + dimension.x + ", y:" + dimension.y);
			this.container = container;
			if (this._map) {
				this._map.updateSize();
				//this._map.setTarget(this._getTarget(container));
			}
			else {
				//this.init();
			}
		},

		_checkNetworkConnection: function() {
			var providerUrl = this.specificParameters['providerUrl'];
			//check for connection only makes sense when we are using online maps, that is, providerUrl is not null
			if(providerUrl){
				var msg = MessageService.createStaticMessage("offNetForMapOnline").getMessage();
				var className = this._className;
				var self = this;
				ConnectivityChecker.checkConnectivityAvailable().then(function(isConnectionAvailable){
					Logger.trace(className + " - network is connected: " + isConnectionAvailable);
					if(!isConnectionAvailable){
						Logger.trace(className + " - network disconnected... showing message to user.");
						self._showErrorMsg(msg);
						return false;
					}
					else{
						return true;
					}
				}).otherwise(function(err){
					Logger.trace(className + " - checkConnectivityAvailable function failed. Error message: "+err);
					return false;
				});
			}
		},
		
		/**
		* This function is responsible to inform user about problems on loading images tiles
		*/
		_checkForLoadImageError: function(){
			//verify if occurred some error on loading image tile
			if(this.hasLoadMapErrors){
				Logger.log("[OpenLayersMap.js] - error on loading image. Maybe the value for providerUrl is wrong.");
				var msg = MessageService.createStaticMessage("invalidProviderUrl").getMessage();
				this._showErrorMsg(msg);
			}
		},

		_setupLocale: function() {
			// find out locale and lengthUnit
			this.locale = WL.App.getDeviceLocale();
			this.lengthUnit = "mi";
			if (this.locale) {
				var countryCode = this.locale.substr(3);
				if (countryCode != "US" && countryCode != "LR" && countryCode != "MM") {
					lengthUnit = "km";
				}
			}
			else {
				this.locale = "en-US";
			}
			
			//when we are using ios, there is a combine between location and region, which can
			//result in strange things, like pt-US, en-CV, pt-BG, etc. To consume the esri service for routes,
			//the unique problem that I got was with Portuguese language (other languages need only 
			//the first parameter and ignores the second one (for example, I can write fr-ballon, that
			//the routes came in French in a right way.
			var lang = this.locale.split("-");
			if(lang && lang[0] == "pt"){
				//if was different of pt-PT, we assume pt-BR
				if(lang[1] != "PT" ){
					this.locale = "pt-BR";
				}
			}
			else if(lang && lang[0] == "zh"){
				this.locale = "zh-CN";
			}
			this.specificParameters["locale"] = this.locale;
		},

		/*
		 * load the directions service according to the provider set
		 */
		/*Promise*/ _loadDirectionsService: function() {
			var deferred = new Deferred();
			var provider = this.getMapType();
			switch(provider) {
				case "esri":
					require(["platform/map/directions/EsriDirectionsService"], 
					lang.hitch(this, function(directionsService) {
						//TODO: remove this hardcode
						var restApiUrl = this.mapProperties["si.map.esri.routeService"];
						if (restApiUrl && restApiUrl.json && restApiUrl.json.propertyValue) {
							restApiUrl = restApiUrl.json.propertyValue;
							if (!restApiUrl.match("/solve")) {
								if (restApiUrl[restApiUrl.length-1] == '/') {
									restApiUrl += "solve";
								}
								else {
									restApiUrl += "/solve";	
								}
							}
						}
						var user = this.mapProperties["si.map.esri.username"];
						if(user && user.json){
							user = user.json.propertyValue;
						}
						var pass = this.mapProperties["si.map.esri.password"];
						if(pass && pass.json){
							pass = pass.json.propertyValue;
						}
						
						var jsonObject;
						if(this.specificParameters && this.specificParameters['currentLocationMessage']){
							jsonObject = {username: user, password: pass, currentLocationMessage: this.specificParameters['currentLocationMessage']};
						}
						else{
							jsonObject = {username: user, password: pass};
						}
						
						jsonObject["locale"] = this.specificParameters.locale;
						
						var token = this.mapProperties["si.map.esri.token"];
						if(token && token.json){
							jsonObject["token"] = token.json.propertyValue;
						}
						
						var tokenService = this.mapProperties["si.map.esri.tokenService"];
						if(tokenService && tokenService.json){
							jsonObject["tokenService"] = tokenService.json.propertyValue;
						}
						
						var refererService = this.mapProperties["si.map.esri.refererService"];
						if(refererService && refererService.json){
							jsonObject["refererService"] = refererService.json.propertyValue;
						}
						
						var isGetMethodEnabled = this.mapProperties["si.map.esri.isGetMethodEnabled"];
						if(isGetMethodEnabled && isGetMethodEnabled.json){
							jsonObject["isGetMethodEnabled"] = isGetMethodEnabled.json.propertyValue;
						}
						
						var newDirectionsService = new directionsService(restApiUrl, jsonObject);
						deferred.resolve(newDirectionsService);
					}));
				break;
				default:
					var message = this._className + " Map provider " + provider + " is not currently supported for directions service";
					Logger.trace(message);
					deferred.reject(message);
			}

			return deferred.promise;
		},

		/*Promise*/ _preloadGPSImage: function() {
			var deferred = new Deferred();
			this.gpsMarkerModelImage = new Image();				
			this.gpsMarkerModelImage.onload = lang.hitch(this, function() {
				deferred.resolve();
			});
			this.gpsMarkerModelImage.src = this.gpsMarkerModel.imagePath;				
			return deferred.promise;
		},
		
		/*
		 * preload marker images
		 */
		/*Promise*/ _preloadSelectedMarkerImage: function() {
			var deferred = new Deferred();
			if (!this.selectedMarkerModelImage || !this.markerModelImage || !this.gpsMarkerModelImage) {
				this.selectedMarkerModelImage = new Image();
				this.markerModelImage = new Image();
				this.selectedMarkerModelImage.onload = lang.hitch(this, function() {
					this.markerModelImage.onload = lang.hitch(this, function() {
						deferred.resolve();
					});
					this.markerModelImage.src = this.markerModel.imagePath;
				});
				this.selectedMarkerModelImage.src = this.selectedMarkerModel.imagePath;
			}
			else {
				deferred.resolve();
			}
			return deferred.promise;
		},

		/*
		 * Show map on the container area
		 */
		showMap: function() {
			this.gpsLayer = null;
			this.gpsCachedDirections = null;
			
			Logger.trace(this._className + " showMap");
			
			var provider = this.getMapType();  
			// For MXSPATIAL we are checking if there are Offline map downloaded, it there isn't we show an error there.
    		if (provider != "mxspatial") {
    			if(this._checkNetworkConnection()){
    				// check if there are some error (after load the image for the first time it is keep on 
    				// cache, whatever the value is correct or not, so for this reason we keep a flag)
    				this._checkForLoadImageError();
    			}
    		}
			
			if(!this._map) {
				this._init();
			}
			else {
				this._map.setTarget(this._getTarget(this.container));
			}
		},
		
		/*
		 * Hide map from the container area
		 */
		hideMap: function() {
			Logger.trace(this._className + " hideMap");
			if(this._map) {
				this._map.setTarget(null);
			}
		},
		
		/*
		 * resource: JSON array collection of the desired type to be showed on the map (i.e. workorder)
		 * clean: if true clean the previous added markers, if false previous markers are kept on the map
		 */
		addLayer: function(/*_ModelDataSet*/ resource, /*String*/ layerId, /*int*/ resourceIndex) {
			
			//important clean fullExtent when we create new markers
			this.fullExtent = null;
			
			Logger.trace(this._className + " layerid is: " + layerId);
			// cleanup the resource from uninteresting data 
			resource = this.cleanResource(resource);
			Logger.trace(this._className + " addLayer: " + JSON.stringify(resource));
			var deferred = new Deferred();

			//if (WL.Client.getEnvironment() != WL.Environment.WINDOWS_PHONE_8 && WL.Client.getEnvironment() != WL.Environment.WINDOWS8) {
			if (this.specificParameters['providerUrl']) {
			    this.globalBoundsPromiseOfflineMaps.resolve(null);
			}
			var that = this;
		    this.globalBoundsPromiseOfflineMaps.then(function (boundsForOfflineMaps) {

		        var extractor = null;
		        //if (WL.Client.getEnvironment() != WL.Environment.WINDOWS_PHONE_8 && WL.Client.getEnvironment() != WL.Environment.WINDOWS8) {
		        if (that.specificParameters['providerUrl']) {
		            extractor = new ResourceLocationExtractor();
		        }
		        else {
		           // var extractor = new ResourceLocationExtractor(null,null,boundsForOfflineMaps);
		            //convert the bounds to match web mercator co-ordinates from offline tpk bound
		            var minPoint = [boundsForOfflineMaps.xmin, boundsForOfflineMaps.ymin];
		            var maxPoint = [boundsForOfflineMaps.xmax, boundsForOfflineMaps.ymax];

		            var convertedMinCoordinates = ol.proj.transform(minPoint, that.transformTrg, that.transformSrc);
		            var convertedMaxCoordinates = ol.proj.transform(maxPoint, that.transformTrg, that.transformSrc);

		            var convertedbound = [convertedMinCoordinates[0], convertedMinCoordinates[1], convertedMaxCoordinates[0], convertedMaxCoordinates[1]];

		            extractor = new ResourceLocationExtractor(null, null, convertedbound);
		        	
		        }

		        
		        var localizedResources;
		        if (that.specificParameters['providerUrl']) {
		            localizedResources = extractor.getLocalizedResources(resource, resourceIndex, false);
		        } else {
		            localizedResources = extractor.getLocalizedResources(resource, resourceIndex, true);
		        }

		        if (!localizedResources || localizedResources.length == 0) {
		            var errorMsg = MessageService.createStaticMessage("noCoordinates").getMessage();
		            Logger.trace(that._className + ": " + errorMsg);
		            return deferred.reject({ 'messageId': 'noCoordinates' });
		        }

		        // TODO lk0 must order the markers

		        that._storeResourceIndexes(localizedResources);

		        var thatLayerId = layerId;
		        // add markers to map 
		        that.markerRenderer.createMultipleFeatures(that.markerModel, localizedResources)
                .then(lang.hitch(that, function (features) {
                    var vectorLayer = new ol.layer.Vector({
                        name: "markers",
                        source: new ol.source.Vector({
                            features: features
                        }),
                        rendererOptions: { zIndexing: true }
                    });
                    that._addLayer(thatLayerId, vectorLayer, false);
                    if (that._map == null) {
                        Logger.trace(this._className + " OpenLayers map is null, unable to refresh extent");
                    }
                    else {
                        // add created markers to fullExtent
                        if (that.fullExtent) {
                            that.fullExtent = ol.extent.extend(that.fullExtent, vectorLayer.getSource().getExtent());
                        }
                        else {
                            that.fullExtent = vectorLayer.getSource().getExtent();
                        }
                    }

                    deferred.resolve();
                }))
                .otherwise(function (error) {
                    Logger.trace(that._className + " " + error);
                    deferred.reject(error);
                });


			}).otherwise(function (error) {
			    console.log(error);
			    deferred.reject(error);
			});			
			
			return deferred.promise;
		},

		_addLayer: function(layerId, layer, isRelatedLayer) {
			if (layerId) {
				if (isRelatedLayer) {
					if (this.layers[layerId]) {
						this.relatedLayers[layerId] = layer;	
					}
					else {
						Logger.trace(this._className + " Cannot create relatedLayer with unexisting layer " + layerId);
					}
				}
				else {
					this.layers[layerId] = layer;
				}
			}
			
    		// ol.Collection only supports plain arrays
    		var tempLayers = [];
    		for(var key in this.relatedLayers) {
    			tempLayers.push(this.relatedLayers[key]);
    		}
    		// add the gps layer if exists
    		if (this.gpsLayer) {
    			tempLayers.push(this.gpsLayer);
    		}
    		for(var key in this.layers) {
    			tempLayers.push(this.layers[key]);
    		}
    		this.glayer.setLayers(new ol.Collection(tempLayers));
    		
    		var provider = this.getMapType();
    		
    		if (provider == "mxspatial" && layer) {
    			this._map.addLayer(layer);
    		}
		},

		_storeResourceIndexes: function(localizedResources) {
			this.resourceIndexes = [];
			for(i=0; i < localizedResources.length; i++) {
				this.resourceIndexes.push(localizedResources[i].attributes['index']);	
			}
		},
		
		setGPSLocation: function(/*ModelDataSet*/jsonObject) {
			Logger.trace(this._className + " setGPSLocation: " + JSON.stringify(jsonObject));
			
			this.hasGPSPosition = false;

			if (!jsonObject || !jsonObject[0] || !jsonObject[0].geolocation) {
				// print error message
				Logger.trace(this._className + " unable to find GPS");
				return;
			}

			/*
	            When we are using offline maps, we need to use bounds info to decide which markers we will show on map and 
	            decide to show or not the current location, but the info about map bound is inside .tpk file and could take 
	            some time to read it. Only when finish to read tpk we are able to continue the gps process (draw or not into the map).
	            For online maps, we do not need to wait, so we solve the promise instantaneously.
	        */
			if (this.specificParameters['providerUrl'] || (WL.Client.getEnvironment() != WL.Environment.WINDOWS_PHONE_8 && WL.Client.getEnvironment() != WL.Environment.WINDOWS8)) {
				this.globalGPSPromiseOfflineMaps.resolve(null);
			}
			var that = this;
		    this.globalGPSPromiseOfflineMaps.then(function (boundsForOfflineMaps) {
		        var gps = jsonObject[0].geolocation;
	
		        
		        var x = null, y = null;
		        if (gps.Status == "Success") {
		            // TODO, this is really bad, it was hardcoded somewhere else and this is the only way to access for now
		            x = gps["max:longitudex"];
		            y = gps["max:latitudey"];
		        }
	
	            //we have x, y and bounds values for offline map (we are using offline maps)
		        if (boundsForOfflineMaps && x && y) {
		            var max = ol.proj.transform([boundsForOfflineMaps.xmax, boundsForOfflineMaps.ymax], that.transformTrg, that.transformSrc);
		            var min = ol.proj.transform([boundsForOfflineMaps.xmin, boundsForOfflineMaps.ymin], that.transformTrg, that.transformSrc);
		            if (!ol.extent.containsCoordinate([min[0], min[1], max[0], max[1]], [x, y])) {
		                if (gps.OutOfBoundMessage) {
		                    WL.application.ui.showToastMessage(gps.OutOfBoundMessage);
		                    Logger.trace(that._className + " " + gps.OutOfBoundMessage);
		                    return;
		                }
		            }
		        }
	            //if we have at least x and y so we are using online maps, otherwise we have a problem here
		        else if(!x || !y){
		            Logger.trace(that._className + " unable to find GPS due to unknown reason");
		            return;
		        }
	
		        that._drawGPSMarker(x, y);
		        that._requestGPSToFirstMarkerLeg();
		        that._adjustExtentView();
		        that.hasGPSPosition = true;
			}).otherwise(function (err) {
			    console.log(err);
			});
		},

		_requestGPSToFirstMarkerLeg: function() {
			this._loadDirectionsService().then(lang.hitch(this, function(directionsService) {
				
				//we need guarantee that gps image is available before start to draw anything
				this._preloadGPSImage().then(lang.hitch(this, function() {
					var layerKeys = Object.keys(this.layers);
					// TODO this is no good, but this is how it is on native side
					var layerId = layerKeys[layerKeys.length-1];
					var layer = this.layers[layerId];
					if (!layer) {
						Logger.trace(this._className + " Layer " + layerId + " not found");
						return;// deferred.promise;
					}
					if (!layer.getSource() || !layer.getSource().getFeatures() || !layer.getSource().getFeatures()[0]) {
						Logger.trace(this._className + " Selected Layer " + layerId + " does not contain markers");
						return;// deferred.promise;
					}
	
					if (!this.gpsPoint) {
					    return;// deferred.reject("gps not available.");
					}				
					
					var features = layer.getSource().getFeatures();
					
					//we need to get the first marker, but features do not guarantee it.
					var i=0;
					for(; i<features.length; i++){
						if(features[i].getProperties().index == this.resourceIndexes[0]){
							break;
						}
					}
					
					// convert back to plain webmercator
					var convertedCoordinates = ol.proj.transform(features[i].getGeometry().getCoordinates(), this.transformTrg, this.transformSrc);
					var x = convertedCoordinates[0];
					var y = convertedCoordinates[1];
					var firstMarker = new LocalizedResource(x, y, features[i].getProperties());
					
					var gpsMarker = this.gpsPoint.getCoordinates();
					// convert back to plain webmercator
					gpsMarker = ol.proj.transform(gpsMarker, this.transformTrg, this.transformSrc);
					var gpsMarkerEncodedPNG = this.markerRenderer._labelMarker("", this.gpsMarkerModelImage, this.gpsMarkerModel);
					gpsMarkerEncodedPNG = gpsMarkerEncodedPNG.substr("data:image/png;base64,".length);
					var attributes = {'_id': -1, 'index': -1, 'encodedPNG': gpsMarkerEncodedPNG};
					gpsMarker = new LocalizedResource(gpsMarker[0], gpsMarker[1], attributes);
					
					
					// right now anywhere only supports driving
					var request = new RouteRequest([gpsMarker, firstMarker], "driving", this.lengthUnit, this.locale);
					directionsService.requestRoute(request).then(lang.hitch(this, function(routeResult) {
						var directionsRenderer = new DirectionsRenderer(this.mapProperties);
						directionsRenderer.setRouteResult(routeResult);
						var directionsFeature = directionsRenderer.createDirectionsFeature();
						var features = this.gpsLayer.getSource().getFeatures();
						this.gpsLayer = directionsRenderer.createDirectionsLayer();
						if(features && features.length){
							for(var i=0; i<features.length; i++){
								this.gpsLayer.getSource().addFeature(features[i]);
							}
						}
						
						this._addLayer(null, null, true);
	
						// update route data
						var cachedDirections = this.cachedDirections[layerId];
						//verify if already exists cache directons to reuse with gps, otherwise, create a new one.
						if (!cachedDirections || !cachedDirections.legs || cachedDirections.legs.length <= 0) {
							cachedDirections = new Object();
							cachedDirections = routeResult;
						}
						
						//keep gps directions on cache because if the gps draw route before markers, the gps directions is lost
						this.gpsCachedDirections = routeResult;
	
						// add a new leg from current position to the first marker, this is not cached
						if(routeResult && routeResult.legs.length > 0) {
							var firstLeg = routeResult.legs[0];
							cachedDirections.legs.unshift(firstLeg);
							cachedDirections.directions = routeResult.directions + cachedDirections.directions;
							cachedDirections.ETA += routeResult.ETA;
						}
						this.cachedDirections[layerId] = cachedDirections;
						
						var jsonObject = {'type':"DONE", 'directionsLeg':routeResult.legs[0]};
						this.eventDispatcher.sendEvent(new JSEvent("onGpsRouting", jsonObject));
					})).otherwise(lang.hitch(this,function(error) {
						Logger.log(this._className + " Unable to request GPS to first marker leg due to, " + error);
					}));
				})).otherwise(lang.hitch(this, function(error) {
					Logger.log(this._className + " Unable to request GPS to first marker leg due to, " + error);
				}));
			})).otherwise(lang.hitch(this, function(error) {
				Logger.log(this._className + " Unable to request GPS to first marker leg due to, " + error);
			}));
		},

		_drawGPSMarker: function(x, y) {
			var feature = this.markerRenderer.createFeature(this.gpsMarkerModel, [x,y]);
			this.gpsPoint = new ol.geom.Point(feature.getGeometry().getCoordinates());
			// if a gpsLayer exists it is replaced
			this.gpsLayer = new ol.layer.Vector({
				name: "gps",
    			source: new ol.source.Vector({
					features: [feature]
				})
    		});
    		// refresh layers
	    	this._addLayer(null, null, false);
		},

		removeAllLayers: function(checkTokenMXSpatial) {
			Logger.trace(this._className + " removeAllLayers");
			var deferred = new Deferred();
			this.layers = [];
			this.relatedLayers = [];
			// refresh layers
			this._addLayer(null, null, false);
			
			//If provider is MXSPATIAL it needs to check the tokens generated are expired
			if (this.mapType == "mxspatial" && checkTokenMXSpatial == true) {
				this.mobileMaximoSpatial.reloadLayersIfTokenExpired(function() {
					deferred.resolve();
				});
			} else {
				deferred.resolve();
			}
			return deferred.promise;
		},
		
		removeLayer: function(/*String*/ layerId) {
			Logger.trace(this._className + " removeLayer");
			var deferred = new Deferred();
			delete this.layers[layerId];
			delete this.relatedLayers[layerId];
			// refresh layers
			this._addLayer(null, null, false);
			deferred.resolve();

			return deferred.promise;
		},
		
		/*
		 * Asyncronously request a marker to be selected, this causes such marker to enlarge only
		 * reutrns a MarkerInfo, check platform/map/MarkerInfo for more information
		 * 
		 */
		/*MarkerInfo*/ setMarkerSelected: function(/*String*/ layerId, /*JSONObject*/ query, /*boolean*/ isAutoZoom) {
			Logger.trace(this._className + " setMarkerSelected layerId: " + layerId + " query: " + JSON.stringify(query));
			var deferred = new Deferred();
			var layer = this.layers[layerId];
			if (!layer) {
				deferred.reject("Layer " + layerId + " not found");
				return deferred.promise;
			}
			var marker = this._findMarkerTuple(layerId, query)[0];
			if (!marker) {
				deferred.reject("No marker found for query " + query);
				return deferred.promise;
			}
			if (!marker.getProperties()) {
				deferred.reject("No attributes for marker found on query " + query);
				return deferred.promise;
			}

			this._preloadSelectedMarkerImage().then(lang.hitch(this, function() {
				// unselect any other markers
				var element = this.selectedFeatures.pop();
				while(element) {
					this._switchMarker(element, false);
					element = this.selectedFeatures.pop();
				}
				// switch marker to selected, and add it to the selectedFeatures
				this._switchMarker(marker, true);

				var markerAttributes = marker.getProperties();
				// lk0, missing directions related attributes
				var markerInfo = new MarkerInfo(markerAttributes['index'], markerAttributes['encodedPNG'], markerAttributes['latitudey'], markerAttributes['longitudex']);

				this.currentSelectedPoint = marker.getGeometry().getCoordinates();
				//decides if we need to make zoom in at selected marker
				if(isAutoZoom){
					//Make a zoom at the selected marker								
					this.zoomStatus = this.STATUS_CENTRALIZE;
				}
				//otherwise, fit the all markers at minimal needed zoom.
				else{
					var res = this.getResourceIndexesFromMarkers(layerId);
					if(res && res.length == 1){
						this.zoomStatus = this.STATUS_FIT;
					}
					else{
						this.zoomStatus = this.STATUS_FITALL;
					}
				}
				this._adjustExtentView();

				deferred.resolve(markerInfo);
			})).otherwise(function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},

		_adjustExtentView: function(){
			var view = this._map.getView();
			var map = this._map;
			var animDuration = 500;
			//verify if user change state of map before make any change	
			if(this.zoomStatus == this.STATUS_USERMOVE){
				return;
			}
			
			//Verify if we need to make zoom at specific point (centralize marker)
			if(this.currentSelectedPoint && this.zoomStatus == this.STATUS_CENTRALIZE){
				var pan = ol.animation.pan({
					duration: animDuration,
					source: (view.getCenter())
				});
				map.beforeRender(pan);
				view.setZoom(this.lastZoomUsed);
				view.setCenter(this.currentSelectedPoint);
			}
			//Verify if we need to make zoom fitting individual marker and gps
			else if(this.currentSelectedPoint && this.zoomStatus == this.STATUS_FIT){	

				if(this.gpsPoint && this.gpsPoint.getCoordinates()){					
					var zoom = ol.animation.zoom({
						duration: animDuration,
						sourceResolution: (view.getResolution())
					});
					var pan = ol.animation.pan({
						duration: animDuration,
						source: (view.getCenter()),
					});
					map.beforeRender(zoom, pan);
					var tempGpsPoint = this.gpsPoint.getCoordinates();
					var minX=0, minY=0, maxX=0, maxY=0;
					
					//defining the min and max for x and y (to construct a extent view)
					if(this.currentSelectedPoint[0] < tempGpsPoint[0]){
						minX = this.currentSelectedPoint[0];
						maxX = tempGpsPoint[0];
					}
					else{
						maxX = this.currentSelectedPoint[0];
						minX = tempGpsPoint[0];
					}
					
					if(this.currentSelectedPoint[1] < tempGpsPoint[1]){
						minY = this.currentSelectedPoint[1];
						maxY = tempGpsPoint[1];
					}
					else{
						maxY = this.currentSelectedPoint[1];
						minY = tempGpsPoint[1];
					}
					
					// if we do not put some aditional value to extent view, a part of marker and gps symbol
					// can appear hidden (a part could be out of extend view). 
					if(minX < 0){
						minX = minX*(1+this.ADJUST_CONSTANT);
					}
					else{
						minX = minX*(1-this.ADJUST_CONSTANT);
					}
					
					if(maxX < 0){
						maxX = maxX*(1-this.ADJUST_CONSTANT);
					}
					else{
						maxX = maxX*(1+this.ADJUST_CONSTANT);
					}
					
					if(minY < 0){
						minY = minY*(1+this.ADJUST_CONSTANT);
					}
					else{
						minY = minY*(1-this.ADJUST_CONSTANT);
					}
					
					if(maxY < 0){
						maxY = maxY*(1-this.ADJUST_CONSTANT);
					}
					else{
						maxY = maxY*(1+this.ADJUST_CONSTANT);
					}					
					var tempExtend = [minX, minY, maxX, maxY];
					
					//this piece of code is here to force openlayers to update the resolution of map
					//so, this two lines of code fix this bug on openlayers (https://github.com/openlayers/ol3/issues/3166)
					var res = this.getResolutionForExtent(tempExtend, map.getSize());
					view.setResolution(res);					
						
					view.setCenter(ol.extent.getCenter(tempExtend));
					view.fit(tempExtend, map.getSize());						
				}
				else{
					var pan = ol.animation.pan({
						duration: animDuration,
						source: (view.getCenter())
					});
					map.beforeRender(pan);
					view.setCenter(this.currentSelectedPoint);
					view.setZoom(this.lastZoomUsed);
				}
			}  
			//In this case we have several markers and we will decide automatically if fit or not gps together with markers
			else if(this.zoomStatus == this.STATUS_FITALL){
				//verify if we have gps points to include
				if(this.gpsPoint && this.gpsPoint.getCoordinates() && !ol.extent.containsCoordinate(this.fullExtent, this.gpsPoint.getCoordinates())){
					
					var diffX = Math.abs(this.fullExtent[0] - this.fullExtent[2]);
					var diffY = Math.abs(this.fullExtent[1] - this.fullExtent[3]);
					
					var extentBoundries = [this.fullExtent[0]-diffX,
					                       this.fullExtent[1]-diffY,
					                       this.fullExtent[2]+diffX,
					                       this.fullExtent[3]+diffY];
					 
					//verify if it is too far away from markers	
					if(ol.extent.containsCoordinate(extentBoundries, this.gpsPoint.getCoordinates())){			
						this.fullExtent = ol.extent.extend(this.fullExtent, this.gpsPoint.getExtent());
					}
				}
				var zoom = ol.animation.zoom({
					duration: animDuration,
					sourceResolution: (view.getResolution())
				});
				var pan = ol.animation.pan({
					duration: animDuration,
					source: (view.getCenter()),
				});
				map.beforeRender(zoom, pan);
				view.fit(this.fullExtent, map.getSize());	
				view.setCenter(ol.extent.getCenter(this.fullExtent));
			}
		},

		/*
		 * Switch the current marker image (icon) based on the boolean selected
		 *
		 * ol.Feature feature - the feature representing the marker
		 * boolean selected - true to switch to the selected marker image, false to switch to the unselected marker image
		 */
		_switchMarker: function(/*ol.Feature*/ feature, /*boolean*/ selected) {
			if (feature) {
				var image;
				var markerModel;
				var zIndex = 0;
				if (selected) {
					markerModel = this.selectedMarkerModel;
					image = this.selectedMarkerModelImage;
					zIndex = 100;
				}
				else {
					markerModel = this.markerModel;
					image = this.markerModelImage;
				}

				var iconJson = {
					anchor: [markerModel.anchor.xOffset, markerModel.anchor.yOffset],
					anchorXUnits: 'fraction',
					anchorYUnits: 'pixels',
					opacity: 1,
					src: null
				}
				var encodedPNG = this.markerRenderer._labelMarker(feature.getProperties().label, image, markerModel);
				feature.set('encodedPNG', encodedPNG.substr("data:image/png;base64,".length));
				iconJson.src = encodedPNG;
				
				// update image and render marker at the top (zIndex)
				feature.setStyle(new ol.style.Style({
					image: new ol.style.Icon((iconJson)),
					zIndex: zIndex
				}));

				// add to selected feature list if selected
				if (selected) {
					this.selectedFeatures.push(feature);	
				}
			}
		},

		_findMarkerTuple: function(/*String*/ layerId, /*JSONObject*/ query) {
			var layer = this.layers[layerId];
			if (!layer) {
				Logger.trace(this._className + "Layer " +  layerId + " not found");
				return null;
			}
			var source = layer.getSource();
			if (!source || !source.getFeatures()) {
				Logger.trace(this._className + "No markers for layer " +  layerId);
				return null;
			}
			var features = source.getFeatures();
			var matchingKeyCounter = 0;
			var matchingMarker = null;
			var nextMarker = null;
			for(var i=0; i < features.length; i++) {
				var marker = features[i];

				var markerAttributes = marker.getProperties();
				var queryKeys = Object.keys(query)

				for (var j = queryKeys.length - 1; j >= 0; j--) {
					var queryKey = queryKeys[j];
					var markerValue = markerAttributes[queryKey];
					var queryValue = query[queryKey];

					if(markerAttributes.hasOwnProperty(queryKey) && markerValue == queryValue) {
						// match!
						matchingKeyCounter++;
					}
				};

				if(matchingKeyCounter == queryKeys.length) {
					matchingMarker = marker;
					// gets the next marker if any
					if(i+1 < features.length) {
						nextMarker = features[i+1];
					}
					break;
				}
			}

			return [matchingMarker, nextMarker];
		},

		/*
		 * Get the resource that was added to this layer using addLayer method
		 */
		getResourceByLayerId: function(/*String*/ layerId) {
		},
		
		/*
		 * returns a promise of platform.map.directions.Directions
		 */
		/*Directions*/ getAllDirections: function(/*String*/ layerId) {
			Logger.trace(this._className + " getAllDirections");
			var deferred = new Deferred();
			
			var layer = this.layers[layerId];
			if (!layer) {
				deferred.reject("Layer " + layerId + " not found");
				return deferred.promise;
			}
			if (!layer.getSource() || !layer.getSource().getFeatures()) {
				deferred.reject("Selected Layer " + layerId + " does not contain markers");
				return deferred.promise;
			}

			var features = layer.getSource().getFeatures();
			
			//try to get meta info (record information) if we have
			var points = this._featuresToLocalizedResources(features);
			
			//if we do not have metadata, get only points
			if(!points){
				points = this._featuresToCoordinates(features);
			}
			
			//if we have only one point, we know that there is no route, so we do not need to request route
			if(points && points.length > 1){
				
				//TODO: when we get new points from server we need to recalculate routes, for this reason the best way is try to get routes first and if not possible use cache
				//the localStorage of routes is made based on the current view (this way cache code can be used for multiple views)
				var cacheKey = WL.application.ui.getCurrentView().id+"_CachedRoutes";
				var cachedRoutes = localStorage.getItem(cacheKey);
				var routeResult = JSON.parse(cachedRoutes);
				
				//compare current points with the points used on previous cache
				var equals = false;
				if(routeResult){
					equals=true;
					for(var pos=0; pos<routeResult.points.length; pos++){
						var elem = routeResult.points[pos];
						if(!elem || !points[pos] ||elem.x != points[pos].x || elem.y != points[pos].y){
		                    equals = false;                                                
		                    break;
		                }
					}
				}
				
				//if the points are the same as before, just retrieve the routes from cache
				if(equals){
					this._resolveRoutesResult(this, layerId, routeResult);
					deferred.resolve(this.cachedDirections[layerId]);
				}
				//otherwise, go to esri server to get new routes
				else{
					this._loadDirectionsService().then(lang.hitch(this, function(directionsService) {
						// anywhere only supports driving for now
						var request = new RouteRequest(points, "driving", this.lengthUnit, this.locale);
						directionsService.requestRoute(request).then(lang.hitch(this, function(routeResult) {
							
							//store the routes on cache to be used next time
							localStorage.setItem(cacheKey, JSON.stringify(routeResult));
							
							this._resolveRoutesResult(this, layerId, routeResult);
							deferred.resolve(this.cachedDirections[layerId]);
							
						})).otherwise(function(error) {
							deferred.reject(error);
						});				
					})).otherwise(function(error) {
						deferred.reject(error);	
					});
				}
			}
			else{
				deferred.cancel("With only one point we do not have routes.");
			}
			return deferred.promise;
		},
		
		_resolveRoutesResult: function(context, layerId, routeResult){
			var directionsRenderer = new DirectionsRenderer(context.mapProperties);
			directionsRenderer.setRouteResult(routeResult);
			var directionsLayer = directionsRenderer.createDirectionsLayer();
			context._addLayer(layerId, directionsLayer, true);
			// TODO must verify if the markers are the same
			context.cachedDirections[layerId] = routeResult;
			
			//if there is gps directions, we need to write again
			if(context.gpsCachedDirections && context.gpsCachedDirections.legs.length > 0) {
				var firstLeg = context.gpsCachedDirections.legs[0];
				context.cachedDirections[layerId].legs.unshift(firstLeg);
				
				var jsonObject = {'type':"DONE", 'directionsLeg':context.gpsCachedDirections.legs[0]};
				context.eventDispatcher.sendEvent(new JSEvent("onGpsRouting", jsonObject));
			}				
		},

		/*LocalizedResource[]*/ _featuresToLocalizedResources: function(/*ol.feature[]*/ features){
			var result = [];
			
			//set order that point was drawn. When we get features from map, we lost order that was drawn so i put it explicitly
			var resultWithOrderDrawn = new Array(features.length);
			var hasOrderDrawn = false;
			
			if(this.resourceIndexes && this.resourceIndexes.length > 0){
				hasOrderDrawn = true;
			}
			
			for (var i = 0; i < features.length; i++) {
				
				//try to get meta info (record information) to construct localizedResources
				var metaInfo = features[i].getProperties();				
				if(!metaInfo){					
					return null;
				}
				
				// features are stored already transformed, but directions need untransformed features, therefore transforming back
				var coordinate = ol.proj.transform(features[i].getGeometry().getCoordinates(), this.transformTrg, this.transformSrc);				
				var tempResource = new LocalizedResource(coordinate[0], coordinate[1], metaInfo);
				
				if(hasOrderDrawn){
					var j = 0;
					for(; j<this.resourceIndexes.length; j++){
						if(metaInfo.index == this.resourceIndexes[j]){
							break;
						}
					}
					resultWithOrderDrawn[j] = tempResource;
				}
				else{
					result.push(tempResource);
				}				
			}
			
			return (hasOrderDrawn ? resultWithOrderDrawn : result);
		},
		
		/*int[]*/ _featuresToCoordinates: function(/*ol.feature[]*/ features) {
			var result = [];
			for (var i = 0; i < features.length; i++) {
				// features are stored already transformed, but directions need untransformed features, therefore transforming back
				result.push(ol.proj.transform(features[i].getGeometry().getCoordinates(), this.transformTrg, this.transformSrc));
			}
			return result;
		},
		
		/*
		 * returns a promise of platform.map.directions.DirectionsLeg
		 * to specify such leg provide one or many attributes on your JSONObject that will be used
		 * to filter the right marker / object
		 * 
		 * for example, if you want to get directions for a specific workorder you may create the following JSONObject:
		 * 
		 * { wonum: 1234 }
		 * 
		 * { index: 32 } is far more performatic
		 */
		/*DirectionsLeg*/ getDirections: function(/*String*/ layerId, /*JSONObject*/ query) {
			Logger.trace(this._className + " getDirections");
			var deferred = new Deferred();
			var layer = this.layers[layerId];

			if(!layer) {
				var message = "Unable to find layer " + layerId + " to getDirections from";
				Logger.trace(this._className + message);
				deferred.reject(message);
				return deferred.promise;
			}

			var cachedDirections = this.cachedDirections[layerId];
			if(this.relatedLayers[layerId] && cachedDirections) {
				// try to retrieve a marker from the query				
				// Graphic marker = findMarker((GraphicsLayer)mMapView.getLayerByID(internalLayerId), query);
				var marker = this._findMarkerTuple(layerId, query)[0];
				if (!marker) {
					deferred.reject("No marker found for query " + query);
					return deferred.promise;
				}
				var markerAttributes = marker.getProperties();
				if (!markerAttributes) {
					deferred.reject("No attributes for marker found on query " + query);
					return deferred.promise;
				}

				for(var i=0; i < cachedDirections.legs.length; i++) {
					var leg = cachedDirections.legs[i];
					
					if(markerAttributes.hasOwnProperty("_id") && leg.destinationId == markerAttributes["_id"]) {
						// update the leg destination encodedPNG
						leg.destinationEncodedPNG = markerAttributes["encodedPNG"];

						var jsonObject = {'type':"DONE", 'directionsLeg':leg};
						this.eventDispatcher.sendEvent(new JSEvent("onRouting", jsonObject));
						deferred.resolve(leg);
					}
				}
			}
			else {
				var message = "Unable to retrieve directionsLeg for layer " + layerId + " and query " + JSON.stringify(query);
				Logger.trace(this._className + message);
				deferred.reject(message);
			}
			
			var jsonObject = {'type':"FAILED"};
			this.eventDispatcher.sendEvent(new JSEvent("onRouting", jsonObject));

			return deferred.promise;
		},
		
		/*
		 * returns a promise of an int[] containing the resourceIndexes for all markers on the specified layer
		 */
		/*int[]*/ getResourceIndexesFromMarkers: function(/*String*/ layerId) {
			var deferred = new Deferred();
			if (this.resourceIndexes) {
				deferred.resolve(this.resourceIndexes);
			}
			else {
				deferred.reject("resourceIndexes not available or null");
			}
			return this.resourceIndexes;
		},
		
		
		/*
		 * 
		 */
		sendMapProperties: function(jsonObject){
			this.mapProperties = jsonObject[0];
		},
		
		/*
		 * Opernlayer fix for getResolutionForExtent
		 */
		
		getResolutionForExtent : function (extent, size) {
		    var xResolution = ol.extent.getWidth(extent) / size[0];
		    var yResolution = ol.extent.getHeight(extent) / size[1];
		    return Math.max(xResolution, yResolution);
		}
	});
});