/**
 * createdBy: lcassa@br.ibm.com
 * Dispatch events to mapHandler
 */
define("platform/map/OLEventDispatcher", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "platform/map/MapProperties",
  "platform/logging/Logger",
  "platform/map/JSEvent"], 
function(declare, lang, Deferred, MapProperties, Logger, JSEvent) {
	return declare(null, {
		_map: null,
		mapJSHandler: "platform.handlers.MapHandler",
		defaultMapJSListener: "onMapEvent",

		constructor: function(map) {
			this._map = map;
			this._initEventDispatcher();
		},

/**@memberOf platform.map.OLEventDispatcher */
		_initEventDispatcher: function() {
			this._map.on('click', function(evt) {

				var jsonObject = {
		        	"x": evt.coordinate[0],
		        	"y": evt.coordinate[1]
		        };
				this.sendEvent(new JSEvent("onSingleTap", jsonObject));

  				var pixel = this._map.getEventPixel(evt.originalEvent);
  				// lk0 do we need to filter by layer?
  				var feature = this._map.forEachFeatureAtPixel(pixel, function(feature, layer) {
		          return feature;
		        });

  				if (!feature || !feature.getProperties()) {
  					return;
  				}

  				var properties = feature.getProperties();
		        var jsonObject = {
		        	"wonum": properties.wonum,
					"status": properties.status,
					"index": properties.index,
					"encodedPNG": properties.encodedPNG
		        };
		        //For Spatial the user can select Arcgis Features on the map, not only in Work Orders
		        var provider = MapProperties.getProperty('provider');
				if (provider != null && provider == "mxspatial") {
					if (jsonObject.wonum != null) {
						this.sendEvent(new JSEvent("onMarkerInfo", jsonObject));
					}					
				} else {
					this.sendEvent(new JSEvent("onMarkerInfo", jsonObject));
				}
				
  			}, this);
		},

		sendEvent: function(/*JSEvent*/ jsEvent) {
			var jsListener = jsEvent.getJsListener();
			if(!jsListener && jsListener != "") {
				jsListener = this.defaultMapJSListener;
			}
			window.WL.application[this.mapJSHandler][jsListener](jsEvent.getData());
		},

	});
});
