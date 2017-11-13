/**
 * createdBy: lcassa@br.ibm.com
 * This class extracts the position (x/y/lat/lng) from a Anywhere resource object
 */
define("platform/map/ResourceLocationExtractor",
[ "dojo/_base/declare", "platform/map/LocalizedResource", "platform/logging/Logger", "platform/map/RectD" ], 
function(declare, LocalizedResource, Logger, RectD) {
	return declare(null, {
		xPositionAttribute: "longitudex",
		yPositionAttribute: "latitudey",
		transformSrc: 'EPSG:4326',
		transformTrg: 'EPSG:3857',
		mapBounds: null,
		_className: "platform.map.ResourceLocationExtractor",

		constructor: function(/*optional*/ xPositionAttribute, /*optional*/ yPositionAttribute, /*optional RectD*/ mapBounds) {
			this.xPositionAttribute = (xPositionAttribute)? xPositionAttribute : this.xPositionAttribute;
			this.yPositionAttribute = (yPositionAttribute)? yPositionAttribute : this.yPositionAttribute;
			if (!mapBounds) {
				// default webmercator bounds for world map
				this.mapBounds = new RectD(-180.0, -85.06, 180.0, 85.06);
			}
			else {
				this.mapBounds = mapBounds;
			}
		},

/**@memberOf platform.map.ResourceLocationExtractor */
		getLocalizedResources: function(resource, /*int*/ outResourceIndex, offlinemap) {
			var list = [];
			var markerLabel = 1;

			//case was passed an outResourceIndex non-negative, we need to consider only this record to get localized resources.
			var resourceIndex = 0;
			var lenght = resource.length;
			if(outResourceIndex != undefined && outResourceIndex >= 0){
				resourceIndex = outResourceIndex;
				lenght = outResourceIndex+1;
			}
			
			// register each entry from the JSONArray as a marker in the map
			for ( ;resourceIndex < lenght; resourceIndex++) {
			
			//for (var resourceIndex = 0; resourceIndex < resource.length; resourceIndex++) {
				jsonObject = resource[resourceIndex];

				if(jsonObject.hasOwnProperty(this.yPositionAttribute) && jsonObject.hasOwnProperty(this.xPositionAttribute) &&
					jsonObject[this.yPositionAttribute] && jsonObject[this.xPositionAttribute]) {
				    var x, y;
				    
				    if (!offlinemap) {
				        y = jsonObject[this.yPositionAttribute];
				        x = jsonObject[this.xPositionAttribute];
				        
				        // To add support for WO marker display on online for spatially linked location/asset, co-ordinates are sent as WGS 84 in this case. 
				        if (this.mapBounds && !this.mapBounds.contains(x, y)) {
					        var coordinates = [];
					        coordinates[0] = jsonObject[this.xPositionAttribute];
					        coordinates[1] = jsonObject[this.yPositionAttribute];
	
					        var convertedCoordinates = ol.proj.transform(coordinates, this.transformTrg, this.transformSrc);
	
					        y = convertedCoordinates[1];
					        x = convertedCoordinates[0];
				        }

				        if (this.mapBounds && !this.mapBounds.contains(x, y)) {
				        	
				        	Logger.trace(this._className + " Resource: " + jsonObject._id + " (y: " + y + ", x: " + x + ") is out of the map bounds, skipping.");
				            continue;
				            
				        }

				    } else {
                        //Offline map co-ordinates are set in WGS 84 this needs to be converted to web mercator for display markers and directions
				        var coordinates = [];
				        coordinates[0] = jsonObject[this.xPositionAttribute];
				        coordinates[1] = jsonObject[this.yPositionAttribute];

				        var convertedCoordinates = ol.proj.transform(coordinates, this.transformTrg, this.transformSrc);

				        y = convertedCoordinates[1];
				        x = convertedCoordinates[0];

				        if (this.mapBounds && !ol.extent.containsCoordinate(this.mapBounds, [x, y])) {
				            Logger.trace(this._className + " Resource: " + jsonObject._id + " (y: " + y + ", x: " + x + ") is out of the map bounds, skipping.");
				            continue;
				        }

				    }
					
					var markerAttributes = jsonObject;
					
					// add a label to the markerAttributes
					markerAttributes.label = markerLabel;
					markerAttributes.index = resourceIndex;
					
					list.push(new LocalizedResource(x, y, markerAttributes));
					Logger.trace(this._className + " Resource: " + jsonObject._id + " (y: " + y +  ", x: " + x + ") marker created.");
					
					markerLabel++;
				}
				else {
					Logger.trace(this._className + " Resource: " + jsonObject._id + " does not have y/x data to create a marker. Skipping.");
				}
			}
			
			return list;
		}
	});
});
