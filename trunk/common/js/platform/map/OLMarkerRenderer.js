/**
 * createdBy: lcassa@br.ibm.com
 * Holds a route request data
 */
define("platform/map/OLMarkerRenderer", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "platform/map/LocalizedResource",
  "dojo/Deferred",
  "platform/logging/Logger"], 
function(declare, lang, LocalizedResource, Deferred, Logger) {
	return declare(null, {
		// default values for transformation
		transformSrc: 'EPSG:4326',
		transformTrg: 'EPSG:3857',
		_className: "platform.map.OLMarkerRenderer",

		constructor: function(transformSrc, transformTrg) {
			this.transformSrc = (transformSrc) ? transformSrc : this.transformSrc;
			this.transformTrg = (transformTrg) ? transformTrg : this.transformTrg;
		},

/**@memberOf platform.map.OLMarkerRenderer */
		/*ol.Feature*/ createFeature: function(/*MarkerModel*/ markerModel, /*ol.geom.Point or [x,y]*/ point) {
			if (!point) {
				Logger.trace(this._className + " createFeature received a null point, skipping");
				return null;
			}

			var iconJson = {
				anchor: [markerModel.anchor.xOffset, markerModel.anchor.yOffset],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				opacity: 1,
				src: markerModel.imagePath
			};

			if (point instanceof ol.geom.Point) {
				var feature = new ol.Feature({
					geometry: point
				});
			}
			else if (point.isInstanceOf && point.isInstanceOf(LocalizedResource)) {
				var feature = new ol.Feature({
					geometry: new ol.geom.Point(ol.proj.transform([point.x, point.y], this.transformSrc, this.transformTrg))
				});
				feature.setProperties(point.attributes);
			}
			else {
				var feature = new ol.Feature({
					geometry: new ol.geom.Point(ol.proj.transform(point, this.transformSrc, this.transformTrg))
				});
			}
			feature.setStyle(new ol.style.Style({
				image: new ol.style.Icon((iconJson))
			}));

			return feature;
		},

		// returns a promise
		/*ol.Feature[]*/ createMultipleFeatures: function(/*MarkerModel*/ markerModel, /*ol.geom.Point[] or [[x,y]] or LocalizedResource[]*/ points) {
			var deferred =  new Deferred();

			if (!points || points.length == 0) {
				deferred.reject("No localizedResources found");
				return deferred.promise;
			}

			// pre-load image
			var markerImage = new Image();
			markerImage.onload = lang.hitch(this, function() {
				var result = [];
				var iconJson = {
					anchor: [markerModel.anchor.xOffset, markerModel.anchor.yOffset],
					anchorXUnits: 'fraction',
					anchorYUnits: 'pixels',
					opacity: 1,
					src: null
				};

				for (var i = 0; i < points.length; i++) {
					if (Array.isArray(points[0])) {
						var point = points[i];
						var feature = new ol.Feature({
	    					geometry: new ol.geom.Point(ol.proj.transform(point, this.transformSrc, this.transformTrg))
	    				});
					}
					else if (points[0] instanceof ol.geom.Point) {
						var point = points[i];
	    				var feature = new ol.Feature({
	    					geometry: point
	    				});
	    			}
	    			else if (points[0].isInstanceOf && points[0].isInstanceOf(LocalizedResource)) {
	    				var point = points[i];
	    				var feature = new ol.Feature({
	    					geometry: new ol.geom.Point(ol.proj.transform([point.x, point.y], this.transformSrc, this.transformTrg))
	    				});
	    				feature.setProperties(point.attributes);
	    			}
	    			var encodedPNG = this._labelMarker(i+1, markerImage, markerModel);
	    			feature.set('encodedPNG', encodedPNG.substr("data:image/png;base64,".length));
    				iconJson.src = encodedPNG;
    				feature.setStyle(new ol.style.Style({
						image: new ol.style.Icon((iconJson))
					}));
					result.push(feature);
				}
				deferred.resolve(result);
			});
			markerImage.src = markerModel.imagePath;

			return deferred.promise;
		},

		createOverlay: function() {

		},

		/*encoded PNG image*/ _labelMarker: function(label, image, markerModel) {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");

			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0);

			ctx.font = ((markerModel.fontSize)? markerModel.fontSize : 24) + "pt Arial";
			ctx.fillStyle = (markerModel.color)? markerModel.color : "white";
			var labelWidth = ctx.measureText(label).width;
			ctx.fillText(label, (image.width/2)-(labelWidth/2), image.height*0.55);

			var result = canvas.toDataURL("image/png")
			canvas = null;
			labelWidth = null;

			return result;
		}
	});
});
