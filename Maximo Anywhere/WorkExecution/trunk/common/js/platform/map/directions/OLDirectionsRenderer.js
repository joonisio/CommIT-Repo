/**
 * createdBy: lcassa@br.ibm.com
 * This class is responsible for rendering a platform.map.directions.RouteResult on a OpenLayers
 * Vector layer. It assumes OpenLayers api is already loaded
 */
define("platform/map/directions/OLDirectionsRenderer",
[ "dojo/_base/declare", "platform/logging/Logger" ], 
function(declare, Logger) {
	/** @class platform.map.directions.OLDirectionsRenderer */
	return declare(null, {
		/*RouteResult*/ routeResult: null,
		/*ol.style.Style*/ style: null,
		opacity: 0.5,
		color:"#0000FF",
		width: 5,
		// default values for transformation
		transformSrc: 'EPSG:4326',
		transformTrg: 'EPSG:3857',
		_className: "platform.map.directions.OLDirectionsRenderer",

		/** @constructor platform.map.directions.OLDirectionsRenderer */
		constructor: function(/*JsonObject*/mapProperties) {
			
			if(mapProperties){
				var pathWidth = mapProperties["si.map.directionsPathWidth"];
				if(pathWidth && pathWidth.json && pathWidth.json.propertyValue){
					pathWidth = pathWidth.json.propertyValue; 
					if(Number(pathWidth) > 0){
						this.width = Number(pathWidth);
					}
				}
				
				var pathColor = mapProperties["si.map.directionsPathColor"];
				if(pathColor && pathColor.json && pathColor.json.propertyValue){ 
					pathColor = pathColor.json.propertyValue;
					if(pathColor && pathColor != ""){
						//the value of pathOpacity is the first 2 number but is in hex, so we need transform to decimal
						var pathOpacity = pathColor.substring(0,2);
						if(parseInt(pathOpacity,16)){
							this.opacity = parseInt(pathOpacity,16)/255;
						}
						//the value of pathColor is the last 6 numbers (in hex) and we need to put a # on begin
						this.color = "#"+pathColor.substring(2, pathColor.length);
					}
				}
			}
			
			if (!ol.Map) {
				Logger.trace(this._className + " OpenLayers API not found.");
				return null;
			}

			this.style = new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.color,
					width: this.width
				})
			});
		},
		
		/** @memberOf platform.map.directions.OLDirectionsRenderer 
		* Transform a geometry from one coordinate reference system to another. Modifies the geometry in place
		*/
		setTransform: function(source, target) {
			this.transformSrc = (source) ? source : this.transformSrc;
			this.transformTrg = (target) ? target : this.transformTrg;
		},

		// must be set to call any other method
		setRouteResult: function(/*RouteResult*/ routeResult) {
			this.routeResult = routeResult;
		},

		_isRouteResultSet: function() {
			if (!this.routeResult) {
				Logger.trace(this._className + " You must call setRouteResult prior to call any methods on a " + this._className + " instance");
				return false;
			}
			return true;
		},

		// creates a directions feature ready to be added to a ol.source.*
		// the feature geometry is a LineString containing all the steps
		// of the route result
		/*ol.Feature*/ createDirectionsFeature: function() {
			if (!this._isRouteResultSet()) {
				return null;
			}

			var routeFeature = new ol.Feature({
				geometry: new ol.geom.LineString(this.routeResult.geometryPath)
			});
			routeFeature.getGeometry().transform(this.transformSrc, this.transformTrg);

			return routeFeature;
		},

		/*ol.source.Vector*/ createDirectionsSource: function() {
			if (!this._isRouteResultSet()) {
				return null;
			}

			var routeSource = new ol.source.Vector({
			     //create empty vector
			});
			routeSource.addFeature(this.createDirectionsFeature());

			return routeSource;
		},

		// args are all optional
		/*ol.layer.Vector*/ createDirectionsLayer: function(/*ol.style.Style*/ style, /*float*/ opacity) {
			if (!this._isRouteResultSet()) {
				return null;
			}

			var layerStyle = (style)? style : this.style;
			var layerOpacity = (opacity)? opacity : this.opacity;
			var routeLayer = new ol.layer.Vector({
				name: "route",
				source: this.createDirectionsSource(),
				style: layerStyle,
				opacity: layerOpacity,
				routeResult: this.routeResult
			});

			return routeLayer;
		}
	});
});
