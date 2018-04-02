/* IBM Confidential
 *
 * OCO Source Materials
 *
 * 5724-U18
 *
 * (C) COPYRIGHT IBM CORP. 2016
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has been
 * deposited with the U.S. Copyright Office.
 */
/*
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Mapstraction nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

;

/**
 * This is the implementation for Identify tool.
 */

require( [
           "dojo/_base/declare", "dojo/parser", "dojo/ready",
           "dojo/Deferred",
           "dojo/_base/lang",
           "platform/logging/Logger",
           "platform/model/ModelService",
           "platform/store/_ResourceMetadataContext",
           "platform/map/esriTileCacheManager",
           "platform/map/esriFeatureServiceManager",
           "platform/map/spatial/security/TokenAuthentication",
           "platform/map/spatial/proxy/ProxyHelper",
           "platform/map/spatial/store/MaximoSpatialStore",
           "platform/translation/MessageService",
           "platform/comm/_ConnectivityChecker",
           "platform/map/MapGeoLocation",
           "platform/map/MapProperties",
           "dojo/_base/array",
           "dijit/Tooltip", "dijit/form/Button", 
           "dojo/Deferred", "dojo/date/locale", "dojo/promise/all",
           "dojo/dom-construct", "dojo/on", "dojo/query",
           "dojo/dom-class", "dojo/dom"
         ], function(declare, parser, ready, Deferred, lang,
        		 Logger, ModelService, ResourceMetaData, 
        		 esriTileCacheManager, esriFeatureServiceManager, 
        		 TokenAuthentication, ProxyHelper, MaximoSpatialStore, MessageService, ConnectivityChecker,
        		 MapGeoLocation, MapProperties, array, Tooltip, Button,
        		 Deferred, locale, all, domConstruct, on, query, domClass, dom){

	declare( "platform.map.spatial.tool.IdentifyTool", null, {

		featuresSelected: null,
		currentFeature: null,
		painelId: null,
		attributes: null,
		map: null,
		highlightInterval: null,
		view: null,
		forEachFeatureAtPixelEvent: null,
		currentViewId: null,
		isHidden: true,
		
		constructor : function ( options ) {
			this.featuresSelected = [];
			this.currentFeature = null;
			this.painelId = null;
			this.attributes = null;
			this.map = null;
			this.view = null;
			this.highlightInterval = null;
			this.isHidden = false;
		},
		
		getIdentifyTolerance: function() {
			return Number(MapProperties.getProperty('si.map.esri.identifyToolTolerance'));
		},
		
		_createFeatureDisplay : function (mapTarget) {
			
			this.view = WL.application.ui.getViewFromId("WorkExecution.MapView");
			this.currentViewId = WL.application.ui.getCurrentView().id;
			var displayFeatureDiv = domConstruct.create('div');
			displayFeatureDiv.setAttribute("id","feature-display-container"+this.currentViewId);
			displayFeatureDiv.setAttribute("class","feature-display-container feature-display-container-text");
			
			var attributesDiv = document.createElement('div');
			attributesDiv.setAttribute("id", "features-attributes-container"+this.currentViewId);
			displayFeatureDiv.appendChild(attributesDiv);
			
			var displayTotalFeatureDiv = domConstruct.create('div');
			displayTotalFeatureDiv.setAttribute("id","total-feature-display-container"+this.currentViewId);
			displayTotalFeatureDiv.setAttribute("class","feature-display-container total-feature-display-container");
			
			var hideFeatureDivButton = domConstruct.create('div');
			hideFeatureDivButton.setAttribute("id","hide-feature-display-button-container"+this.currentViewId);
			hideFeatureDivButton.setAttribute("class","hide-feature-display-button-container feature-display-container");
			hideFeatureDivButton.innerHTML = "X";
			
			var featureLegend = domConstruct.create('div');
			featureLegend.setAttribute("id","feature-legend-container"+this.currentViewId);
			featureLegend.setAttribute("class","feature-legend-container");
			
			
			on(displayFeatureDiv, 'click',lang.hitch(this, function() {
				var attributes = this.currentFeature.attributes;
				//When the div containing the Feature is clicked,we shoe featureAttributes View.
				//In order to do that, we get the featureAttributes resource object.
				var featureAttributesResource = WL.application.getResource('featureAttributes');
				if (featureAttributesResource.data.length>0) {
					featureAttributesResource.data = [];
				}
				var value = null;
				var title = null;
				if(featureAttributesResource != null){
				  for (var key in attributes) {
				      if (attributes.hasOwnProperty(key)) {
				    	  //for each feature attribute, we create another Row in the featureAttributes View,
				    	  //setting its label and value.
				        var featureAttributesDisp = featureAttributesResource.createNewRecord();
				        title = key;
				        value = attributes[key];
				        featureAttributesDisp.set('featureAttributeTitle', title);
				        featureAttributesDisp.set('featureAttributeValue', value);
				      }
				  }
				  featureAttributesResource.feature = this.currentFeature;
				}
				clearInterval( this.highlightCurrentFeature );
				//Since our Resource is filled with Attributes rows, we can display the featureAttributes View
				WL.application.ui.show('MapView.featureAttributes');
			}))
			
			on(displayTotalFeatureDiv, "click", lang.hitch(this, function(){
				
				//If more then one feature was found by the Identify Tool, the user can access a list with all of them
				var identifyFeatureList = WL.application.getResource("identifyFeatureList");
				if (identifyFeatureList.data.length>0) {
					identifyFeatureList.data = [];
				}	
				var me = this;
				
				//Features will be included in the identifyFeatureList Resource Object, so then we can display the entire list.
				
				//The identifyFeatureList Resource will contain the updateFeature method, which will be used to update the feature from the Handler File.
				identifyFeatureList.updateFeature = lang.hitch( this, function ( featureToUpdate ){
					  //Updating the me.currentFeature variable, since it is used by highlight method
					  me.currentFeature = featureToUpdate;
					  me.centerAtFeature( featureToUpdate );
					  me.buildAttributesUsingFieldsName( featureToUpdate );
					  
					  //Updating the display Container with Feature DisplayField, its value and Feature Legend Image
					  var diFeatures = dojo.byId("feature-display-container" + this.currentViewId);
					  var legendContainer = dojo.byId("feature-legend-container" + me.currentViewId);
					  me.updateFeatureLegend( legendContainer , featureToUpdate);
					  var attributeName = featureToUpdate.displayFieldAlias;
					  var attributeValue = this.getAttributeValue( featureToUpdate.attributesFieldsName, featureToUpdate.displayField );
					  diFeatures.innerHTML = attributeName + " - " + attributeValue;		  
				});
				
				//Now We want to add each Selected Feature to the identifyFeatureList Resource
				array.forEach( this.featuresSelected, lang.hitch( this, function ( featureSelected, i ) {
					
					this.buildAttributesUsingFieldsName( featureSelected );
				    var attributeName = featureSelected.displayFieldAlias;
					var attributeValue = this.getAttributeValue( featureSelected.attributesFieldsName, featureSelected.displayField );
					  
					//For each feature, we create a new record in the Resource, containing feature attribute name, attribute value, and its layer
					var identifyFeatureListDisp = identifyFeatureList.createNewRecord();
					var layerName = featureSelected.attributes.layerName;
					identifyFeatureListDisp.set('attributeName', attributeName);
					identifyFeatureListDisp.set('attributeValue', attributeValue);
					identifyFeatureListDisp.set('layerName', layerName);

//					var layerGroup = featureSelected.attributes.layerGroup;
//					if (layerGroup != null) {
//						identifyFeatureListDisp.set('layerName', layerGroup + "/" + layerName);
//					} else {
//						identifyFeatureListDisp.set('layerName', layerName);
//					}
					
					identifyFeatureListDisp.feature = featureSelected;
				}));			
				
				WL.application.ui.show('MapView.identifyListFeatures');
			 }));
			
			on(hideFeatureDivButton, 'click',lang.hitch(this, function() {
				//if the user clicks "x" (close button), we hide the Display Feature Container and
				// we also change isHidden to true so it stop highlighting in the map
				this.isHidden = true;
				this.hideDialog();
			}));
			
			var mapDiv = dojo.byId(this.currentViewId);
			domConstruct.place(displayFeatureDiv, mapDiv, "last");
			domConstruct.place(hideFeatureDivButton, displayFeatureDiv, "before");
			domConstruct.place(featureLegend, displayFeatureDiv, "before");
			domConstruct.place(displayTotalFeatureDiv, displayFeatureDiv, "before");
			
			//since we constructed the identify Tool display Panel, we can star highlighting the selected feature
			this.highlightInterval = setInterval( lang.hitch( this , this.highlightCurrentFeature ) , 2000);
		},
		
		showDialog: function(features, featureSelected, showMoreFeatures) {
			console.log("showDialod for features");
			var featuresLength = features.length;
			var divMoreFeatures = dojo.byId("total-feature-display-container"+this.currentViewId);
			divMoreFeatures.innerHTML = "+" + featuresLength;
			
			//if we have more then one feature, we show the More Features Button
			if (showMoreFeatures == true) {
				if (divMoreFeatures!= null && !domClass.contains(divMoreFeatures, "showTotalFeaturesPanel")) {
		        	domClass.add(divMoreFeatures, "showTotalFeaturesPanel");	        	
		        }
			} else {
				if (divMoreFeatures!= null && domClass.contains(divMoreFeatures, "showTotalFeaturesPanel")) {
		        	domClass.remove(divMoreFeatures, "showTotalFeaturesPanel");	        	
		        }
			}
	
			this.buildAttributesUsingFieldsName( featureSelected );
			
			var diFeatures = dojo.byId("feature-display-container"+this.currentViewId);
			var diHideButton = dojo.byId("hide-feature-display-button-container"+this.currentViewId);
			var diFeatureLegendContainer = dojo.byId("feature-legend-container"+this.currentViewId);

			var attributeName = featureSelected.displayFieldAlias;
			var attributeValue = this.getAttributeValue( featureSelected.attributesFieldsName, featureSelected.displayField );
			
			//updating the Display Feature Container
			diFeatures.innerHTML = attributeName + " - " + attributeValue;
			//updating the Feature Legend Image
			this.updateFeatureLegend( diFeatureLegendContainer , featureSelected );
			
			if (diFeatures!= null && !domClass.contains(diFeatures, "showFeaturesPanel")) {
	        	domClass.add(diFeatures, "showFeaturesPanel");	
	        	domClass.add(diHideButton, "showFeaturesPanel");
	        	domClass.add(diFeatureLegendContainer, "showFeaturesPanel");
	        }		
			// We change isHidden to false so the the feature will be highlighted
			this.isHidden = false;
		},
		updateFeatureLegend : function ( featureLegendContainer , feature ){
			//We erase the featureLegendContainer, so we do not overlay the old feature image with the new one
			dojo.empty( featureLegendContainer );
			
			var workOrderSet = WL.application.getResource("workOrder");
			//We will need the mobileMaximoSpatial component in order to get DrawingInfo and Symbol Information.
			var mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			var drawingInfo = mobileMaximoSpatial._getFeatureJSONDrawingInfo( feature );
			var symbol = mobileMaximoSpatial._getSymbolByFeature( feature, drawingInfo );
			var contentType = symbol.contentType;
			var imageData = symbol.imageData;
	
			
			if (imageData != null && imageData != undefined ) {
				//If we do Have imageData, then we can just build the img src url.
				var url = "data:" + contentType + ";base64," + imageData;
				var img = domConstruct.create('img');
				img.src = url;
				featureLegendContainer.appendChild( img );
		
			} else
			{
				//The rectSymbol object will represent the feature legend Image
				var rectSymbol = domConstruct.create('div');
				
				if ( symbol.outline != null) {
					//if we found the outline attribute inside symbol, it means we are not handling with a linear feature
					//In this case, we must use the outline symbol as it symbol.
					symbol = symbol.outline;		
				} 
				
				var color = symbol.color;
				rectSymbol.id = "feature-legend-rectangle-symbol";
				rectSymbol.style.width = symbol.width + "px";
				rectSymbol.style.backgroundColor = "rgba(" + color[0] +","+ color[1] + ","+ color[2] + ", 1)";
				rectSymbol.innerHTML = " ";	
				featureLegendContainer.appendChild( rectSymbol );
			}
		},
		hideDialog : function() {
			
			var divMoreFeatures = dojo.byId("total-feature-display-container"+this.currentViewId);
			var diFeatures = dojo.byId("feature-display-container"+this.currentViewId);
			var diHideButton = dojo.byId("hide-feature-display-button-container"+this.currentViewId);
			var diFeatureLegendContainer = dojo.byId("feature-legend-container"+this.currentViewId);
			
			if (divMoreFeatures != null && domClass.contains(divMoreFeatures, "showTotalFeaturesPanel")) {
	        	domClass.remove(divMoreFeatures, "showTotalFeaturesPanel");			        	
	        }
			if (diFeatures!= null && domClass.contains(diFeatures, "showFeaturesPanel")) {
	        	domClass.remove(diFeatures, "showFeaturesPanel");  	
	        }
			if (diHideButton!= null && domClass.contains(diHideButton, "showFeaturesPanel")) {
	        	domClass.remove(diHideButton, "showFeaturesPanel");
	        }
			if (diFeatureLegendContainer!= null && domClass.contains(diFeatureLegendContainer, "showFeaturesPanel")) {
	        	domClass.remove(diFeatureLegendContainer, "showFeaturesPanel");
	        }
			this.currentFeature = null;
		},
		
		findFeatures: function(map, isOnline, coordinate, evt) {
			console.log("isOnline " + isOnline);
			this.currentViewId = WL.application.ui.getCurrentView().id;
			this.map = map;
			this.featuresSelected = [];
			this.currentFeature = null;
			var tolerance = this.getIdentifyTolerance();
			if (isOnline == true) {
				var extent = map.getView().calculateExtent(map.getSize());
				var promises = [];
				var layers = map.getLayers().getArray();
				var layersToIdentify = [];
				for ( var iLayer = 0; iLayer < layers.length; iLayer++ ) {
					var layer = layers[ iLayer ];
					if (layer.isBasemap == false) {
						layersToIdentify.push(layer);
						//We will execute identifyFeature against each non-BaseMap layer
						var promise = this._identifyFeature(layer, extent, coordinate, tolerance);
						promises.push(promise);
					}
				}
				all(promises).then(lang.hitch(this, function(resultsForEachLayer) {
					array.forEach( resultsForEachLayer, lang.hitch( this, function ( resultForEachLayer, i ) {
						if (resultForEachLayer.error != null) {
							var errorMessage =  resultForEachLayer.error.message;
							WL.application.showMessage(errorMessage );
						} else {
							var layer = layersToIdentify[ i ];
							array.forEach( resultForEachLayer.results, lang.hitch( this, function ( feature, j ) {
								feature.layer = layer;
								feature.attributes.layerId = feature.layerId;
								feature.attributes.layerName = feature.layerName;
								//adding each returned feature to the this.featureSelected Array
								this.featuresSelected.push(feature);
							}))	
						}
												
					}));
					this.displayFeaturesInfo( this.featuresSelected, map );					
				}));
			} else {
				//If we're performing the identify action offline, we find the feature using the pixel, no promises are needed
				var pixel = map.getEventPixel(evt.originalEvent);
				map.forEachFeatureAtPixel(pixel, lang.hitch(this, function(feature) {
					this.featuresSelected.push(feature);
		        }), {hitTolerance: tolerance});
				this.displayFeaturesInfo( this.featuresSelected, map );
			}
		},
		
		displayFeaturesInfo: function(features, map) {
			var featuresLength = features.length;
			console.log("displayFeaturesInfo featuresLength" + featuresLength);
			if (featuresLength > 0) {
				
				this.currentFeature = features[0];
				this.centerAtFeature( this.currentFeature );
				
				var showTotal = false;
		        if (featuresLength > 1) {
		        	//if there's more then one, we will need to show the "+ N" Button
		        	showTotal = true;
		        } 
		        this.showDialog( features, this.currentFeature, showTotal );
		        
		    } else {
		    	//If no feature was returned, basically when user clicks the map again, we hide our dialog.
		    	this.hideDialog();
		    }
		},
		getLayerGroup : function ( layerId, layerInfos ) {
			//Returns the layer Group based on layer's parent layer.
			if ( !layerInfos ) {
				return null;
			}
			var layerGroup = "";
			var layerInfo = undefined;
			for ( var i = 0; i < layerInfos.length; i++ ) {
				if ( layerInfos[ i ].id === layerId ) {
					layerInfo = layerInfos[ i ];
				}
			}
			if (layerInfo == null || layerInfo == undefined) {
				return null;
			}
			var parentLayerId = layerInfo.parentLayerId;
			while ( parentLayerId > -1 ) {
				var parentLayerInfo = undefined;
				for ( var i = 0; i < layerInfos.length; i++ ) {
					if ( layerInfos[ i ].id === parentLayerId ) {
						parentLayerInfo = layerInfos[ i ];
					}
				}
				
				layerGroup = parentLayerInfo.name + layerGroup;
				parentLayerId = parentLayerInfo.parentLayerId;
				if ( parentLayerId > -1 ) {
					layerGroup = "/" + layerGroup;
				}
			}
			if ( layerGroup == "" ) {
				layerGroup = null;
			}
			return layerGroup;
		},
		buildAttributesUsingFieldsName: function(feature) {
			//We run this method to create the variable "attributeFieldsName" inside the feature object.
			//This is necessary because the existent variable "attributes" inside the feature does not 
			//contains the attributeFields in the expected format
			var layer = feature.layer;
			var layerId = feature.attributes.layerId;
			var layerGroup = this.getLayerGroup(layerId, JSON.parse(layer.jsonMapServer).layers);
			if (layerGroup != null) {
				feature.attributes.layerGroup = layerGroup;
			}
			var internalLayers = JSON.parse(layer.internalLayers);			
			var fields = [];
			array.forEach( internalLayers, lang.hitch( this, function ( internalLayer, i ) {
				if (internalLayer.id == layerId) {
					var details = internalLayer.details;
					feature.displayField = details.displayField;
					fields = details.fields;
				}		
			}));
			
			if (fields.length > 0) {
				var attributesFieldsName = {}
				var displayField = feature.displayField;
				array.forEach(fields, function(f, i) {
					if (f.name == displayField) {
						feature.displayFieldAlias = f.alias;
					}
					var aliasAttribute = feature.attributes[f.alias];
					if (aliasAttribute != null && aliasAttribute != undefined) {
						attributesFieldsName[f.name] = aliasAttribute;
					} else {
						aliasAttribute = feature.attributes[f.name];
						feature.attributes[f.alias] = aliasAttribute;
						attributesFieldsName[f.name] = aliasAttribute;
						delete feature.attributes[f.name];
					}
					
				}, this);
				attributesFieldsName['layerName'] = feature.attributes.layerName;
				attributesFieldsName['layerId'] = feature.attributes.layerId;
				if (feature.attributes.layerGroup) {
					attributesFieldsName['layerGroup'] = feature.attributes.layerGroup;
				}
				feature.attributesFieldsName = attributesFieldsName;
			}
		},
		highlightCurrentFeature: function (  ) {
			//If dialog is not Hidden, then we will highlight the current feature
			if ( this.isHidden == false && this.view.isViewShown() ){
				var feature = this.currentFeature;
				if ( feature != undefined && feature != null   )
				{
					var point = null;
					if ( feature.geometry.x != null ) {
						//If geometry.x is not null, we have a point
						var x = feature.geometry.x;
						var y = feature.geometry.y;
						point = [x,y];
					
					}else if ( feature.geometry.paths != null )
					{	
						//If geometry.paths is not null, we have a line  
						var paths = feature.geometry.paths;
						point = paths[0][0];	
									
					}else if ( feature.geometry.rings != null )
					{
						//If geometry.rings is not null, we have a polygon 
						var rings = feature.geometry.rings;
						var point = rings[0][0];
					}
					this.highlightPoint( point );
				}
			}			
		},
		highlightPoint: function ( point ) { 
			var x = point[0];
			var y = point[1];
			var coordinate = [x,y];
			//In order to create the highlight div in the exact position, 
			//we need the pixels, not the coordinates that come from feature Object
			var pixel = this.map.getPixelFromCoordinate(coordinate);
			var view = this.map.getView();

			var pixelX = pixel[0] ; 
			var pixelY = pixel[1] + 55;

			var highlightWidth = 50;
			var highlightHeight = 50;		
			var highlightDiv = domConstruct.create('div');
			highlightDiv.setAttribute("id","highlight-container");
			highlightDiv.setAttribute("class","highlight-container");
			highlightDiv.innerHTML = " ";
			highlightDiv.style.left = pixelX + "px";
			highlightDiv.style.top = pixelY + "px ";
			domConstruct.place(highlightDiv, this.currentViewId, "last");

			//Now we set an Interval which will be responsible for the fade out effect of the highlight div circle
			var count = 0.8;  
			highlightDiv.style.opacity = count;
			var time = setInterval(function () {
				if (count <= 0.005){
					clearInterval(time);
					highlightDiv.style.display = 'none';
					dojo.destroy(highlightDiv);
				}
				highlightDiv.style.opacity = count;
				highlightDiv.style.filter = 'alpha(opacity=' + count * 100 + ")";
				highlightDiv.style.width = highlightWidth + "px";
				highlightDiv.style.height = highlightHeight + "px";
				highlightWidth += 2;
				highlightHeight += 2;
				count -= count * 0.1;
			}, 50);
		},
		centerAtFeature: function ( feature ){
			
			var point = null;
			
			if ( feature.geometry.x != null ) {
				var x = feature.geometry.x;
				var y = feature.geometry.y;
				point = [x,y];	
			
			}else if ( feature.geometry.paths != null )
			{	
				var paths = feature.geometry.paths;
				point = paths[0][0];
			    	
			}else if ( feature.geometry.rings != null ) 
			{
				var rings = feature.geometry.rings;
				point = rings[0][0];
				
			}		
			this.map.getView().setCenter( point );				
		},
		getAttributeValue: function(obj, prop) {
			var value = null;
			prop = (prop + "").toLowerCase();
			for(var p in obj){
			    if(obj.hasOwnProperty(p) && prop == (p+ "").toLowerCase()){
			    		var value = obj[p];
			    		if (value == "Null") {
			    			value = "";
			    		}
			    		else
			    		{
			    			value = obj[p];
			    		}
			      }
			}
			return value;		
		},
		
		_identifyFeature: function(layer, extent, coordinate, tolerance) {
			var deferred = new Deferred();
			
			var urlToRequest =  layer.url + "/identify?geometry="+ coordinate[0] + "%2C" + coordinate[1] + 
			"&geometryType=esriGeometryPoint&tolerance=" + tolerance + 
			"&mapExtent="+extent[0]+"%2C"+extent[1]+"%2C" + extent[2]+"%2C" +extent[3]+
			"&imageDisplay=600%2C550%2C96&returnGeometry=true&f=json";
			
			var internalLayers = JSON.parse(layer.internalLayers);
			if (internalLayers.length > 0) {
				var layersToIdentify = ""
				array.forEach( internalLayers, lang.hitch( this, function ( internalLayer, i ) {
					layersToIdentify = layersToIdentify + internalLayer.id;
					if (i < internalLayers.length-1) {
						layersToIdentify = layersToIdentify + ",";
					}		
				}));
				urlToRequest = urlToRequest + "&layers=visible:" + layersToIdentify;
				if (layer.token != null) {
					urlToRequest = urlToRequest + "&token=" + layer.token;
				}
				
				$.get( urlToRequest ).done(lang.hitch(this, function( data ) {
					deferred.resolve(JSON.parse(data));				
				})).fail(function(xhr, status, error) {
				  	var errorJson = {};
				  	var msg = MessageService.createResolvedMessage('errorIdentifyLayer', [layer.layerName]);
					errorJson.error = {details: msg };
					deferred.resolve(JSON.stringify(errorJson));
			    });;
			} else {
				deferred.resolve([]);
			}
			
			
			return deferred.promise;
		},
		
		

	});
});
