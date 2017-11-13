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
 * This is the implementation for MXSPATIAL provider.
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
           "platform/map/spatial/tool/IdentifyTool",
           "platform/translation/MessageService",
           "platform/comm/_ConnectivityChecker",
           "platform/map/MapGeoLocation",
           "platform/map/MapProperties",
           "dojo/_base/array",
           "dijit/Tooltip", "dijit/form/Button", 
           "dojo/Deferred", "dojo/date/locale", "dojo/promise/all",
           "dojo/dom-construct", "dojo/on", "dojo/promise/all"
         ], function(declare, parser, ready, Deferred, lang,
        		 Logger, ModelService, ResourceMetaData, 
        		 esriTileCacheManager, esriFeatureServiceManager, 
        		 TokenAuthentication, ProxyHelper, MaximoSpatialStore, IdentifyTool, MessageService, ConnectivityChecker,
        		 MapGeoLocation, MapProperties, array, Tooltip, Button, Deferred, locale, all, domConstruct, on, all){

	declare( "platform.map.spatial.MobileMaximoSpatial", null, {

		userAuthenticationManager : null,
		map : null,
		onlineControl : null,
		downloadControl : null,
		addReplicaControl: null,
		cacheLayers : null,
		overlayPanel: null,
		layers : null,
		_mapTarget: null,
		mapManager: null,
		mapServices: null,
		tokenAuthentication: null,
		openLayerMap: null,
		proxyHelper: null,
		maximoSpatialStore: null,
		esriTileCacheManager: null,
		esriFeatureServiceManager: null,
		expiredAreasAlreadyChecked: null,
		showingOnlineMap: null,
		identifyTool: null,
		onSingleClickHandler: null,
		moveEndHandler: null,
		
		constructor : function ( options ) {
			this.layers = [];
			this.showingOnlineMap = true;
			this.expiredAreasAlreadyChecked = false;
			this.mapServices = [];
			this.cacheLayers = [];
			this.openLayerMap = options.openLayerMap;
			this.map = options.mapInstance;
			this.tokenAuthentication = new platform.map.spatial.security.TokenAuthentication();
			this.proxyHelper = new platform.map.spatial.proxy.ProxyHelper(); 
			this.maximoSpatialStore = new platform.map.spatial.store.MaximoSpatialStore();
			this.esriTileCacheManager = new platform.map.esriTileCacheManager();
			this.esriFeatureServiceManager = new platform.map.esriFeatureServiceManager();
			this.identifyTool = new platform.map.spatial.tool.IdentifyTool();
			require( [
				"platform/auth/UserAuthenticationManager"
			], dojo.hitch( this, function ( authManager ) {
				this.userAuthenticationManager = authManager;
			} ) );

		},

		/**
		 * Method to load the layers from the Map Manager parameter
		 * @param mapManagerInfo
		 * @param callbackFunction
		 */
		_loadLayers : function ( mapManagerInfo, callbackFunction ) {
			this.layers = [];
			var cacheLayers = [];
			
			var currentUserSite = this.userAuthenticationManager.currentUserSite;

			var mapServiceMeta = ResourceMetaData.getResourceMetadata( "plussmapservice" );
			mapServiceMeta.setWhereClause( "spi_spatial:mapname=\"" + mapManagerInfo.identifier +  "\"" );

			var mapServiceData = ModelService.all( 'plussmapservice', null, null );
			mapServiceData.then( lang.hitch( this, function ( mapserviceset ) {
				
					var urls = [];
					this.mapServices = mapserviceset.data;
					array.forEach( mapserviceset.data, lang.hitch( this, function ( serviceData ) {	
						urls.push(serviceData.url);
					} ) );
					
					if(urls.length>0) {
						console.log("Tokens calling ");
						var promise = this.tokenAuthentication.generateTokens(urls, this.mapManager, false);
						promise.then(lang.hitch(this, function(tokens) {	
							console.log("Tokens returned " + tokens);
							for (var url in tokens) {
								
								var mapService = null;
								array.forEach( mapserviceset.data, lang.hitch( this, function ( serviceData, i ) {		
									if (url == serviceData.url) {
										mapService = serviceData;
									}									
								} ) );
							    var token = tokens[url];
							    var tokenValue = token.tokenValue;
								var params = {};
								if (tokenValue != null) {
									params = {"token": tokenValue};
								}
								
								url = this.proxyHelper.includeProxyURLIfEnabled( url, this.mapManager );									
								console.log("Layer URL to Load" + url);
								var arcgisLayer =  new ol.source.TileArcGISRest( {
									url : url,
									params: params
								} );
								var originalTileLoadFunction = arcgisLayer.tileLoadFunction;
								arcgisLayer.tileLoadFunction = lang.hitch(this, function ( imageTile, src ) {
									var layerToShow = "";
									var layers = this.map.getLayers().getArray();
									array.forEach(layers , lang.hitch( this, function ( layer, i ) {
										if (layer.url == imageTile.key) {
											var internalLayers = JSON.parse(layer.internalLayers);
											array.forEach(internalLayers , lang.hitch( this, function ( layer, i ) {
												layerToShow = layerToShow + layer.id;
												if (i < internalLayers.length-1) {
													layerToShow = layerToShow + ",";
												}
											}));
										}																
									}));
									if (layerToShow == "") {
										layerToShow = "-1";
									}
									
									src = src + "&layers=show:" + layerToShow;
									return originalTileLoadFunction(imageTile, src);
									
								});
								var newLayer = new ol.layer.Tile( {
									source : arcgisLayer,
									opacity: (100-mapService.transparency)/100,
									visible: mapService.visible
								} );			
								newLayer.isBasemap = mapService.istiledlayer;
								newLayer.internalLayers = mapService.jsonlayers;
								newLayer.jsonFeatureServer = mapService.jsonfeatureserver;
								newLayer.jsonMapServer = mapService.jsonmapserver;
								newLayer.url = url;
								newLayer.token = tokenValue;
								newLayer.name = mapService.servicename;
								
								this.layers.push( newLayer );
							}							
							
							if (callbackFunction) {
								callbackFunction();
							}
						}));
					} else {
						if (callbackFunction) {
							callbackFunction();
						}
					}
					ModelService.save(mapserviceset);
			} ) ).otherwise(function(e) {
				if (e.responseJSON.errors.length > 0) {
					var errorMsg = e.responseJSON.errors[0]['oslc:message'];
					console.error(errorMsg);
					WL.application.showMessage(errorMsg);
				}				
            });
		},
		
		/**
		 * Method to create the Overlay component, used by the map.
		 */
		_createOverlay : function () {
			var popupelem = document.createElement('div');
			popupelem.setAttribute("id", "olpopup");
			popupelem.setAttribute("class", "ol-popup");

			var aelem = document.createElement('div');
			aelem.setAttribute("id", "popup-closer");
			aelem.setAttribute("class", "ol-popup-closer");
			aelem.innerHTML = "&#x274C;";

			var contentelem = document.createElement('div');
			contentelem.setAttribute("id", "popup-content");
			contentelem.setAttribute("class", "ol-popup-inner");

			popupelem.appendChild(contentelem);
			popupelem.appendChild(aelem);
			
			this.identifyTool._createFeatureDisplay( this._mapTarget );

			var mapElement = document.getElementById(this._mapTarget);

			mapElement.appendChild(popupelem);

			var container = document.getElementById('olpopup');
			var closer = document.getElementById('popup-closer');
			
			this.overlayPanel = new ol.Overlay( ( {
				element : container,
				autoPan : true,
				autoPanAnimation : {
					duration : 250
				},
				positioning : 'bottom-center'
			} ) );
			
			closer.onclick = lang.hitch(this, function() {
				this.overlayPanel.setPosition(undefined);
				closer.blur();
				return false;
			});
		},
		
		_addOnClickMap: function() {
			if (this.onSingleClickHandler == null) {
				this.onSingleClickHandler = this.map.on('singleclick', lang.hitch(this, function(evt) {
					
					var coordinate = evt.coordinate;

					if (evt.dragging) {
				          return;
				    }
					console.log("Find features");
					
					this.identifyTool.findFeatures( this.map, this.showingOnlineMap, coordinate, evt );
				       
				}));
			} 
			
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
		
		
		_afterCheckingExpirationDate: function(deferred) {
			for ( var iLayer = 0; iLayer < this.layers.length; iLayer++ ) {
				var removeLayer = this.layers[ iLayer ];
				this.map.removeLayer( removeLayer );
			}			
			
			//load offline areas
			console.log("Loading Offline Areas");
			var promiseOfflineAreas = this.maximoSpatialStore.getAllOfflineArea();
			promiseOfflineAreas.then(lang.hitch(this, function(offlineAreas) {
				var viewResolutions = [];
				array.forEach( offlineAreas, lang.hitch( this, function ( offlineArea ) {	
					var offlineAreaJson = offlineArea.json;
					var resolutions = offlineAreaJson.resolutions
					array.forEach( resolutions, lang.hitch( this, function ( resolution ) {	
						if (viewResolutions.indexOf(resolution) == -1) {
							viewResolutions.push(resolution);
						}
					}))
					viewResolutions.sort(function(a,b) {
					    return b - a;
					});					
				}))				
				
				//load tiles
				console.log("Loading basemap");
				var promise = this.maximoSpatialStore.getAllBasemap();
				promise.then(lang.hitch(this, function(basemap) {
					array.forEach( basemap, lang.hitch( this, function ( basemapJson ) {	
						var basemapUrl = basemapJson.json && basemapJson.json.url;
						if (basemapUrl != null) {
							var cacheSource = new ol.source.XYZ( {
								url : basemapUrl + "/tile/{z}/{y}/{x}"
							} );

							cacheSource.tileLoadFunction = lang.hitch(this, function ( imageTile, src ) {
								this.esriTileCacheManager.getTileUrl( src ).then(function(img) {
									if (img) {
										imageTile.getImage().src = img;
									}						
								});
								
							});
							
							var baseCacheLayer = new ol.layer.Tile( {
								source : cacheSource
							} );

							this.cacheLayers.push( baseCacheLayer );

							var layerIndex = this.map.getLayers().getLength();
							this.map.getLayers().insertAt(0, baseCacheLayer);
							
							var extent = JSON.parse(basemapJson.json.extent).extent;					
							var boundingExtend = ol.extent.boundingExtent(extent[0]);						
							this.map.getView().fit(boundingExtend, this.map.getSize());
							var centerPoint = ol.extent.getCenter(boundingExtend);
							var zoomLevel = basemapJson.json.finalZoom;
							this.updateMapView( centerPoint[0], centerPoint[1], zoomLevel, viewResolutions );
							
						}
					} ) );
				}));
				
				//load features
				console.log("Loading Replicas");
				var promiseReplicas = this.maximoSpatialStore.getAllReplicas();
				promiseReplicas.then(lang.hitch(this, function(replicas) {
					if (replicas.length > 0) {
						array.forEach( replicas, lang.hitch( this, function ( replicaJson ) {
							
							var jsonData = replicaJson.json.jsonReplica;
							var jsonSymbols = replicaJson.json.jsonSymbols;
							var jsonScales = replicaJson.json.jsonScales;
							var jsonMapServer = replicaJson.json.jsonMapServer;
							var internalLayers = replicaJson.json.internalLayers;
							var layerUrl = replicaJson.json.layerUrl;
							console.log("Replica to load" + layerUrl);
							
							var layerSelected = null;
							array.forEach( this.layers, lang.hitch( this, function ( layer ) {
								if (layer.url == layerUrl) {
									layerSelected = layer;
								}
							}));
							var esrijsonFormat = new ol.format.EsriJSON();
							var replicaId = replicaJson.json.replicaId;
							var layers = JSON.parse(replicaJson.json.internalLayers);
							var offlineAreaId = replicaJson.json.offlineAreaId;						
							var layerLength = layers.length;
							var promises = [];
							console.log("layerLength" + layerLength);
							for(var i=layerLength-1; i>=0; i--){
								var layer = layers[i];
								var layerId = layer.id;
								var promiseSearchForFeature = this.maximoSpatialStore.getReplicaFeatureByLayer( replicaId, offlineAreaId, layerId );
								promises.push(promiseSearchForFeature);
							}
							
							all(promises).then(lang.hitch(this, function(results) {
								array.forEach( results, lang.hitch( this, function ( result, i ) {
									var esriFeatures = [];
									var jsonScale = null;
									array.forEach( result, lang.hitch( this, function ( featureJson ) {
										var feature = featureJson.json.feature;
										var layerId = featureJson.json.layerId;
										var layerName = featureJson.json.layerName;
										
										if (jsonScale == null) {
											array.forEach( jsonScales, lang.hitch( this, function ( jsonScaleIndex ) {
												if (jsonScaleIndex.layerId == layerId) {
													jsonScale = jsonScaleIndex;
												}											
											}))
										}
										
										var jsonSymbol = null;
										array.forEach( jsonSymbols, lang.hitch( this, function ( jsonSymbolIndex ) {
											if (jsonSymbolIndex.layerId == layerId) {
												jsonSymbol = jsonSymbolIndex;
											}											
										}))
										
										var featureOpenLayer = esrijsonFormat.readFeature( feature );
										featureOpenLayer.attributes = feature.attributes;
										featureOpenLayer.geometry = feature.geometry;
										featureOpenLayer.layerName = layerName;
										featureOpenLayer.layerId = layerId;
										featureOpenLayer.attributes.layerName = layerName;
										featureOpenLayer.attributes.layerId = layerId;
										featureOpenLayer.layer = {
												'jsonMapServer':jsonMapServer,
												'internalLayers': internalLayers};
										
										var featureStyle = null;
										var style = null;
										var symbol = this._getSymbolByFeature( featureOpenLayer, jsonSymbol.drawingInfo );
										if (symbol != null) {
											switch(symbol.type) {
												case "esriPMS":	
													var width = Number(symbol.width)+5;
													var height = Number(symbol.height)+5;
												    var img = new Image();
												    img.src = 'data:image/png;base64,'+symbol.imageData;
												    
													style = new ol.style.Style({
														image: new ol.style.Icon({
															img: img,
															imgSize: [width, height],
															offset: [symbol.xoffset, symbol.yoffset]
											            })
											        });
													
													break;
												case "esriSLS":	
													var arcgisColorArray = symbol.color;
													style = new ol.style.Style({
														stroke: new ol.style.Stroke({
															color: [arcgisColorArray[0],arcgisColorArray[1],arcgisColorArray[2],arcgisColorArray[3]/255],
															width: symbol.width
											            })
											        });
													break;
											}
										}
										
										
										if (style != null) {
											
//											var textSymbol = this._createTextFeature(feature, jsonSymbol.drawingInfo);
//											if (textSymbol != null) {
//												style.text_ = textSymbol;
//											}
											
											featureOpenLayer.setStyle(style);
										}
										
										esriFeatures.push( featureOpenLayer );
									}));
									
									var vectorSource = new ol.source.Vector( {
										features: esriFeatures
										} );
									
									
									var vector = null;
									
									if (jsonScale == null || jsonScale.minScale == 0) {
										vector = new ol.layer.Vector( {
											source : vectorSource
										} );
									} else {
										var minResolution = this.getResolutionFromScale( jsonScale.maxScale );
										var maxResolution = this.getResolutionFromScale( jsonScale.minScale );
										vector = new ol.layer.Vector( {
											source : vectorSource,
											minResolution: minResolution,
											maxResolution: maxResolution
										} );
									}
									
									this.cacheLayers.push( vector );
									
									this.map.addLayer(vector);
								}))
								
								this.showingOnlineMap = false;
								deferred.resolve(true);
								
							}));
							
						}));
						
					} else {
						WL.application.showMessage(MessageService.createStaticMessage('noOfflineDataToShow').getMessage());
						this.showingOnlineMap = true;
						deferred.resolve(false);
					}
				}));
			}));
			
		},
		getResolutionFromScale: function(scale) {
			var units = this.map.getView().getProjection().getUnits();
			var dpi = 25.4 / 0.28;
			var mpu = ol.proj.METERS_PER_UNIT[units];
			var resolution = scale/(mpu * 39.37 * dpi);
			return resolution
		},
		loadOfflineMap: function() {
			var deferred = new Deferred();
			this.identifyTool.hideDialog();
			//Search for any expired area to inform the user, just runs once 
			if (this.expiredAreasAlreadyChecked == false) {
				var promiseOfflineArea = this.maximoSpatialStore.getAllOfflineArea();
				promiseOfflineArea.then(lang.hitch(this, function(offlineAreas) {
					this.expiredAreasAlreadyChecked = true;
					hasOfflineMapsExpired = false;
					array.forEach( offlineAreas, lang.hitch( this, function ( offlineArea ) {	
						var lastSync = new Date(offlineArea.json.lastSync);
						var syncDaysToExpire = Number(MapProperties.getProperty('si.map.esri.syncDaysToExpire'));
						if (syncDaysToExpire > 0) {
							var dateToExpire = new Date(lastSync);
							dateToExpire.setDate(lastSync.getDate() + syncDaysToExpire);
							var today = new Date();
							
							if (dateToExpire < today) {	
								hasOfflineMapsExpired = true;								
							} 
						}
					}))
					console.log("syncDaysToExpire hasOfflineMapsExpired " + hasOfflineMapsExpired);
					if (hasOfflineMapsExpired) {
						this.showingOnlineMap = true;
						deferred.resolve("showExpiredWindow");					
					} else {
						this._afterCheckingExpirationDate(deferred);
					}
				}))
				
			} else {
				this._afterCheckingExpirationDate(deferred);
			}
			
			
			
			return deferred.promise;
			
		},
		
		_createTextFeature: function(feature, jsonDrawingInfo){
			var labelingInfoArray = jsonDrawingInfo.labelingInfo;
			var style = null;
			array.forEach( labelingInfoArray, lang.hitch( this, function ( labelingInfo ) {	
				var labelExpression = labelingInfo.labelExpression;
				labelExpression = labelExpression.substring(1, labelExpression.length-1); 
				var symbol = labelingInfo.symbol;
				switch(symbol.type) {
					case "esriTS":	
						var textValue = feature.attributes[labelExpression];
						if (textValue == null) {
							textValue = " ";
						}
						var fontFamily = symbol.font.family;
						var fontSize = symbol.font.size+1;
						var fontWeight = symbol.font.weight;
						var font = fontWeight + " " + fontSize + "px" + " " + fontFamily;
						style = new ol.style.Text({
							font: font,
							offsetX: symbol.xoffset,
							offsetY: symbol.yoffset,
					        fill: new ol.style.Fill({ color: '#000' }),
							text: textValue
			            });
						
						break;
					case "esriSLS":	
						
						
						break;
					case "esriSMS":	
						
						
						
						break;
					case "esriSFS":											
						break;
					
				}
					
			}));
			
			return style;
		},
		_getFeatureJSONDrawingInfo: function ( feature ) {
			var internalLayers = JSON.parse( feature.layer.internalLayers );
			var drawingInfo = null;
			array.forEach( internalLayers , lang.hitch( this, function ( internalLayer ){
				var internalLayerId = internalLayer.id;
				if ( feature.layerId == internalLayerId ) {					
					var layerDetails = internalLayer.details;
					drawingInfo = layerDetails.drawingInfo;
				}
			}));		
			return drawingInfo;
		},
		_getSymbolByFeature: function(feature, jsonDrawingInfo){
			var renderer = jsonDrawingInfo.renderer;
			var defaultSymbol = renderer.defaultSymbol;
			if (defaultSymbol == null) {
				defaultSymbol = renderer.symbol
			}
			
			var field = null;
			var attributeValue = null;
			
			var field1 = renderer.field1;
			var field2 = renderer.field2;
			var field3 = renderer.field3;
			
			if (field3 != null){
				field = field3; 
			} 
			if (field2 != null){
				field = field2;
			} 
			if (field1 != null){
				field = field1;
			}
			
			var attributesFieldsName = feature.attributesFieldsName;
			if (attributesFieldsName == null) {
				this.identifyTool.buildAttributesUsingFieldsName( feature );
				attributesFieldsName = feature.attributesFieldsName;
			}
			attributeValue = attributesFieldsName[field];		
			
			
			//Search for a specific symbol
			var uniqueValueInfos = renderer.uniqueValueInfos;
			array.forEach( uniqueValueInfos, lang.hitch( this, function ( uniqueValueInfo ) {	
				var value = uniqueValueInfo.value;
				if (value == attributeValue) {
					defaultSymbol = uniqueValueInfo.symbol;
				}				
			} ) );	
			
			return defaultSymbol;
		},
		
		_loadDataFromStore: function(basemapUrl, initialx, initialy, initZoom, initZoom, finalZoom) {
			var cacheSource = new ol.source.XYZ( {
				url : basemapUrl + "/tile/{z}/{y}/{x}"
			} );

			cacheSource.tileLoadFunction = lang.hitch(this, function ( imageTile, src ) {
				// online
				// map
				this.esriTileCacheManager.getTileUrl( src ).then(function(img) {
					if (img) {
						imageTile.getImage().src = img;
					}						
				});
				
			});

			var baseCacheLayer = new ol.layer.Tile( {
				source : cacheSource
			} );

			this.cacheLayers.push( baseCacheLayer );

			var layerIndex = this.map.getLayers().getLength();
			this.map.getLayers().insertAt(0, baseCacheLayer);

			console.log( "Downloaded cache map shown at this time" , this.map.getView());
			this.esriTileCacheManager.hideProgressBar();
			
			this.updateMapView( initialx, initialy, initZoom, null );
		},
		searchForFeatureAndChangeIt: function(jsonReplica, layerId, globalId, deleteIt, featureUpdated, arrayNewFeatures) {
			var layers = jsonReplica.layers;
			var idToDelete = -1;
			array.forEach( layers, lang.hitch( this, function ( layer ) {	
				if (layer.id == layerId) {
					var features = layer.features;
					array.forEach( features, lang.hitch( this, function ( feature, i ) {
						var attributes = feature.attributes;
						if (this.getAttributeValue(attributes, 'GLOBALID') == globalId) {
							if (deleteIt) {
								idToDelete = i;
							} else {
								if (featureUpdated != null) {
									feature = featureUpdated;
								}
							}
						}
					}));
					if (idToDelete >= 0) {
						features.splice(idToDelete, 1);
					}					
					
					if (arrayNewFeatures != null && arrayNewFeatures.length > 0) {
						features.push.apply(features, arrayNewFeatures);
					}
				}
				
			}));
		},
		
		
		_syncReplica: function(serviceUrl, mapServerUrl, offlineAreaSelected, layer) {
			var deferred = new Deferred();
			var offlineAreaId = offlineAreaSelected.offlineAreaId;
			var promise = this.maximoSpatialStore.getReplicaByOfflineAreaIdAndLayerURL( offlineAreaId, mapServerUrl );
			promise.then(lang.hitch(this, function(replicas) {
				if (replicas.length > 0) {
					var replicaSelected = replicas[0];
					var replica = replicaSelected.json;
					var layerName = replica.layerName;
					var jsonReplica = replica.jsonReplica;
					var replicaId = replica.replicaId;
					var replicaUrl = serviceUrl + "/synchronizeReplica";
					if (layer.token != null) {
						replicaUrl = replicaUrl + "?token=" + layer.token;
					}
					var params = {
							replicaID: replicaId,
							transportType:"	esriTransportTypeEmbedded",
							dataFormat:"json",
							f:"pjson"							
					};
					if (replica.syncPerReplica == false) {						
						var layersToSync = [];
						array.forEach( jsonReplica.layerServerGens, lang.hitch( this, function ( layerServerGen ) {
							var layerToSync = {};
							layerToSync.id = layerServerGen.id;
							layerToSync.syncDirection = "download";
							layerToSync.serverGen = layerServerGen.serverGen;
							layersToSync.push(layerToSync);														
						}));
						
						params.syncLayers = JSON.stringify(layersToSync);
					} else {
						params.replicaServerGen = jsonReplica.replicaServerGen;
					}
					$.post( replicaUrl, params).done(lang.hitch(this, function( data ) {
						var dataJson = JSON.parse(data);
						if (dataJson.error != null) {
					    	var errorJson = {};
						  	var msg = dataJson.error.message;
							errorJson.error = {details: msg };
							deferred.resolve(JSON.stringify(errorJson));
					    } else {
					    	console.log("synchronizeReplica ", dataJson);
							Logger.log("synchronizeReplica  " + dataJson);
							
							if (dataJson.replicaServerGen == null) {
								array.forEach( dataJson.layerServerGens, lang.hitch( this, function ( layerServerGen ) {
									array.forEach( jsonReplica.layerServerGens, lang.hitch( this, function ( replicaLayerServerGen ) {
										if (replicaLayerServerGen.id == layerServerGen.id) {
											replicaLayerServerGen = layerServerGen;
										}
									}));											
								}));
							} else {
								jsonReplica.replicaServerGen = dataJson.replicaServerGen;
							}
							
							var edits = dataJson.edits;
							
							array.forEach( edits, lang.hitch( this, function ( edit ) {	
				    			var layerId = edit.id;
				    			var features = edit.features;
				    			//Deleted features
				    			var deleteIds = features.deleteIds
				    			if (deleteIds.length > 0) {
				    				array.forEach( deleteIds, lang.hitch( this, function ( globalId ) {
				    					this.maximoSpatialStore.removeReplicaFeature( replicaId, globalId, offlineAreaId, layerId );
				    				}));			    				
				    			}			    			
				    			//Updated features
				    			var updates = features.updates;
				    			if (updates.length > 0) {
				    				array.forEach( updates, lang.hitch( this, function ( featureUpdated ) {
				    					var globalId = this.getAttributeValue(featureUpdated.attributes, 'GLOBALID')
				    					this.maximoSpatialStore.updateReplicaFeature( replicaId, globalId, offlineAreaId, layerId, featureUpdated );		    					
				    				}));				    				
				    			}
								
				    			//New features
				    			var adds = features.adds;
				    			if (adds.length > 0) {
				    				var internalLayers = JSON.parse(layer.internalLayers);
				    				var internalLayerSelected = null;
									array.forEach( internalLayers, lang.hitch( this, function ( internalLayer ) {
										if (internalLayer.id == layerId) {
											internalLayerSelected = internalLayer;
										}												
									}));
				    				array.forEach( adds, lang.hitch( this, function ( featureAdded ) {
				    					var globalId = this.getAttributeValue(featureAdded.attributes, 'GLOBALID');
				    					this.maximoSpatialStore.addReplicaFeature( replicaId, globalId, offlineAreaId, layerId, internalLayerSelected.name, featureAdded );	    					
				    				}));
				    			}
							} ) );
							
							delete jsonReplica.layers;
							replicaSelected.json.jsonReplica = jsonReplica;
							
							var promise = this.maximoSpatialStore.updateReplica( replicaSelected );
							promise.then(lang.hitch(this, function() {
								deferred.resolve(true);
							}));
					    }
						
					})).fail(function(xhr, status, error) {
					  	var errorJson = {};
					  	var msg = MessageService.createResolvedMessage('errorSyncingReplica', [layerName]);
						errorJson.error = {details: msg };
						deferred.resolve(JSON.stringify(errorJson));
				    });	
				}
			}));
			return deferred.promise;
		},
		
		_deleteReplica: function(serviceUrl, mapServerUrl, offlineAreaSelected, layer) {
			var deferred = new Deferred();
			var promise = this.maximoSpatialStore.getReplicaByOfflineAreaIdAndLayerURL( offlineAreaSelected.offlineAreaId, mapServerUrl );
			promise.then(lang.hitch(this, function(replicas) {
				if (replicas.length > 0) {
					var replica = replicas[0].json;
					var replicaId = replica.replicaId;
					var layerName = replica.layerName;
					var replicaUrl = serviceUrl + "/unregisterReplica";
					if (layer.token != null) {
						replicaUrl = replicaUrl + "?token=" + layer.token;
					}
					Logger.trace("replicaUrl to delete  " + replicaUrl);
					var params = {
							replicaID: replicaId,
							f:"pjson"
					};
					$.post( replicaUrl, params).done(lang.hitch(this, function( data ) {
						 var dataJson = JSON.parse(data);
						    if (dataJson.error != null) {
						    	var errorJson = {};
							  	var msg = dataJson.error.message;
								errorJson.error = {details: msg };
								deferred.resolve(JSON.stringify(errorJson));
						    } else {
						    	console.log("unregisterReplica ", data);
								Logger.log("unregisterReplica  " + data);
								deferred.resolve(true);
						    }
						
					})).fail(function(xhr, status, error) {
					  	var errorJson = {};
					  	var msg = MessageService.createResolvedMessage('errorDeletingReplica', [layerName]);
						errorJson.error = {details: msg };
						deferred.resolve(JSON.stringify(errorJson));
				    });	
				} else {
					deferred.resolve(true);
				}
			}));
			return deferred.promise;
		},
		_loadFeaturesForEachReplicaLayer: function(layer, mapServerUrl, layerId, offlineAreaId, internalLayerSelected, jsonScales, jsonSymbols, features) {
			var deferred = new Deferred();
			var layerToRequest = mapServerUrl + "/" + layerId ;
			if (layer.token != null) {
				layerToRequest = layerToRequest + "?token=" + layer.token + "&f=json";
			} else {
				layerToRequest = layerToRequest + "?f=json";
			}		    			
			console.log( "layerToRequest " + layerToRequest );
			$.get( layerToRequest, null).done(lang.hitch(this, function(layerData) {
				deferred.resolve({'layerId': layerId, 'layerData': layerData});
			})).fail(function(xhr, status, error) {
			  	var errorJson = {};
			  	var msg = MessageService.createResolvedMessage('errorCreatingReplica', [layerName]);
				errorJson.error = {details: msg };
				deferred.resolve(errorJson);
		    });
			
			return deferred.promise;
		},
		
		_createReplicas: function(arrayReplica, i, deferred) {
			if (i == arrayReplica.length) {
				deferred.resolve(true);
			} else {
				var replicaToCreate = arrayReplica[i];
				var promise = this._createReplica( replicaToCreate.featureServerUrl, replicaToCreate.serviceUrl,
						replicaToCreate.boundingExtend, replicaToCreate.layerIds, replicaToCreate.offlineAreaSelected,
						replicaToCreate.layer, replicaToCreate.syncPerReplica );
				promise.then(lang.hitch(this, function(result) {
					if (result == true) {
						this._createReplicas( arrayReplica, i+1, deferred);
					} else {
						deferred.resolve(result);
					}
				}));
			}
			
			
			
			
		},
		
		_createReplica: function(serviceUrl, mapServerUrl, extent, layersIds, offlineAreaSelected, layer, syncPerReplica) {
			var deferred = new Deferred();
			var layerName = layer.name;
			var replicaUrl = serviceUrl + "/createReplica";
			var offlineAreaId = offlineAreaSelected['spi_spatial:oslcofflineareaid'];
			
			if (layer.token != null) {
				replicaUrl = replicaUrl + "?token=" + layer.token;
			}
			var params = {
					replicaName: this.userAuthenticationManager._getCurrentUser() + locale.format(new Date(), {selector: "date", datePattern: "yyMMdd"}),
					layers: JSON.stringify(layersIds),
					geometryType:"esriGeometryEnvelope",
					transportType:"esriTransportTypeEmbedded",
					async:"false",
					dataFormat:"json",
					syncModel: (syncPerReplica == true)?"perReplica":"perLayer",
					f:"pjson",
					geometry:"{'xmin':" + extent[0] + ",'ymin':" + extent[1] + ",'xmax':" + extent[2] + ",'ymax':" + extent[3] + "}"
					
			};
			
			$.post( replicaUrl, params).done(lang.hitch(this, function( data ) {
				
			    var dataJson = JSON.parse(data);
			    if (dataJson.error != null) {
			    	var errorJson = {};
				  	var msg = dataJson.error.message;
					errorJson.error = {details: msg };
					deferred.resolve(JSON.stringify(errorJson));
			    } else {
			    	console.log( "Data Loaded: ", dataJson );	
			    	var jsonSymbols = [];
			    	var jsonScales = [];
		    		var promises = [];
		    		var internalLayers = JSON.parse(layer.internalLayers);
	    			array.forEach( layersIds, lang.hitch( this, function ( layerId, i ) {	    				
	    				var internalLayerSelected = null;
						array.forEach( internalLayers, lang.hitch( this, function ( internalLayer ) {
							if (internalLayer.id == layerId) {
								internalLayerSelected = internalLayer;
							}												
						}));
						
						var details = internalLayerSelected.details;
						var minScale = details.minScale;
						var maxScale = details.maxScale;						
						jsonScales.push({'layerId': layerId, 'minScale': minScale, 'maxScale': maxScale});
						var drawingInfo = details.drawingInfo;
						if (drawingInfo) {
							jsonSymbols.push({'layerId': layerId, 'drawingInfo': drawingInfo});
						}
						
						var layersJson = dataJson.layers;
						array.forEach( layersJson, lang.hitch( this, function ( layerJson ) {
							if (layerJson.id == layerId) {
								var featuresToAdd = [];
								var features = layerJson.features;
								array.forEach( features, lang.hitch( this, function ( feature ) {
									var featureToAdd = {
											'replicaId': dataJson.replicaID,
											"globalId": this.getAttributeValue(feature.attributes, 'GLOBALID'),
											'offlineAreaId': offlineAreaId,
											'layerId': internalLayerSelected.id,
											'layerName': internalLayerSelected.name,
											'feature': feature
										};
									featuresToAdd.push(featureToAdd);
								}));
								var promiseLayer = this.maximoSpatialStore.addManyReplicaFeature( featuresToAdd );
								promises.push(promiseLayer);
							}
							
						}));
						
						
					} ) );	
	    			delete dataJson.layers;
	    			
	    			var promiseReplica = this.maximoSpatialStore.addReplica( dataJson, offlineAreaId, 
		    				mapServerUrl, jsonSymbols, layerName, syncPerReplica, jsonScales, layer.jsonMapServer, JSON.stringify(internalLayers));	
		    		promises.push(promiseReplica);
		    		
	    			all(promises).then(lang.hitch(this, function(results) {
	    				array.forEach(results, lang.hitch( this, function ( result, i ) {	
	    					if (result != true) {
	    						deferred.resolve(result);
	    					}
	    				} ) );
	    				console.log( "Return promises add replica features " + results.length );
	    				deferred.resolve(true);
    				}));
	    			
			    }
			    
			  })).fail(function(xhr, status, error) {
				  	var errorJson = {};
				  	var msg = MessageService.createResolvedMessage('errorCreatingReplica', [layerName]);
					errorJson.error = {details: msg };
					deferred.resolve(JSON.stringify(errorJson));
			    });
			return deferred.promise;
		},
		
		_replicasToSync: function(replicasToSyncArray, i, deferred) {
			if (i == replicasToSyncArray.length) {
				deferred.resolve(true);
			} else {
				var featureServerUrl = replicasToSyncArray[i].featureServerUrl;
				var mapServerUrl = replicasToSyncArray[i].mapServerUrl;
				var offlineAreaSelected = replicasToSyncArray[i].offlineAreaSelected;
				var layer =  replicasToSyncArray[i].layer;
				var promise = this._syncReplica( featureServerUrl, mapServerUrl, offlineAreaSelected, layer, i );	
				promise.then(lang.hitch(this, function(result) {
					if (result == true) {
						this._replicasToSync(replicasToSyncArray, i+1, deferred);
					} else {
						deferred.resolve(result);
					}
					
				}));	
			}
							
		},
		
		syncOfflineMap: function(offlineAreaSelected) {
			var deferred = new Deferred();
			var count = 0;
			var promises = [];
			var replicasToSyncArray = [];
			var layers = this.map.getLayers().getArray();
			array.forEach(layers, lang.hitch( this, function ( layer, i ) {	
				if (layer.isBasemap == false) {
					var mapServerUrl = layer.url;
					var jsonFeatureServer = JSON.parse(layer.jsonFeatureServer);
					var featureServerUrl = jsonFeatureServer.featureServerUrl;
					var syncEnabled = jsonFeatureServer.syncEnabled;
					var capabilities = jsonFeatureServer.capabilities;
					if (capabilities.indexOf("Sync") > -1) {
						var newReplicaToSync = {};
						newReplicaToSync.featureServerUrl = featureServerUrl;
						newReplicaToSync.mapServerUrl = mapServerUrl;
						newReplicaToSync.offlineAreaSelected = offlineAreaSelected;
						newReplicaToSync.layer = layer;
						replicasToSyncArray.push(newReplicaToSync);
					} else {
						deferred.resolve(false)
					}
				}
			} ) );
			
			if (replicasToSyncArray.length > 0) {
				this._replicasToSync(replicasToSyncArray, 0, deferred);
				
			}
			
			return deferred.promise;	
		},
		
		deleteOfflineMapAndDestroyReplica: function(offlineAreaSelected) {
			var deferred = new Deferred();
			Logger.trace( "[MobileMaximoSpatial] deleteOfflineMapAndDestroyReplica start " + offlineAreaSelected.offlineAreaId );
			array.forEach( this.layers, lang.hitch( this, function ( layer ) {	
				if (layer.isBasemap == false) {
					var mapServerUrl = layer.url;
					var jsonFeatureServer = JSON.parse(layer.jsonFeatureServer);
					var featureServerUrl = jsonFeatureServer.featureServerUrl;
					Logger.trace( "[MobileMaximoSpatial] featureServerUrl " + featureServerUrl );
					var syncEnabled = jsonFeatureServer.syncEnabled;
					var capabilities = jsonFeatureServer.capabilities;
					if (capabilities.indexOf("Sync") > -1) {
						var promise = this._deleteReplica( featureServerUrl, mapServerUrl, offlineAreaSelected, layer );		
						promise.then(lang.hitch(this, function(result) {
							if (result == true) {
								var promise = this.maximoSpatialStore.deleteOfflineMap( offlineAreaSelected );
								promise.then(lang.hitch(this, function(response) {
									deferred.resolve(true);
								}))
							} else {
								deferred.resolve(result)
							}
						}))	
					} else {
						deferred.resolve(false)
					}
				}
			} ) );
			
			return deferred.promise;	
		},
		
		
		
		_loadMapData: function(layerBasemap, coordinate, offlineAreaSelected) {
			var deferred = new Deferred();
			var mblExtent = JSON.parse(offlineAreaSelected['spi_spatial:mblextent']);
			var extent = mblExtent.extent;
			var boundingExtend = ol.extent.boundingExtent(extent[0]);
			var initialx = mblExtent.lng;
			var initialy = mblExtent.lat;
			var initZoom = Number(offlineAreaSelected['spi_spatial:mblinitzoom']);
			var finalZoom = Number(offlineAreaSelected['spi_spatial:mblfnlzoom']);
			ConnectivityChecker.checkConnectivityAvailable().then(lang.hitch(this, function(isConnectionAvailable){
				console.log("Device is online? " + isConnectionAvailable);
				if(isConnectionAvailable){
					this.esriTileCacheManager.loadTilesIntoStore(layerBasemap, boundingExtend, initZoom, finalZoom, offlineAreaSelected).then(lang.hitch(this, function() {
						this.maximoSpatialStore.countTiles().then(lang.hitch(this, function(numberOfTiles) {
							if (numberOfTiles > 0) {
								var replicasToCreate = [];
								array.forEach( this.layers, lang.hitch( this, function ( layer ) {	
									var serviceUrl = layer.url;
									if (layer.isBasemap == false) {
										var jsonFeatureServer = JSON.parse(layer.jsonFeatureServer);
										var featureServerUrl = jsonFeatureServer.featureServerUrl;
										var syncEnabled = jsonFeatureServer.syncEnabled;
										var capabilities = jsonFeatureServer.capabilities;
										if (capabilities.indexOf("Sync") > -1) {											
											if (jsonFeatureServer.syncCapabilities != null) {
												var syncPerReplica = false;
											
												if (jsonFeatureServer.syncCapabilities.supportsPerReplicaSync == true) {
													syncPerReplica = true;
												} 
												var internalLayers = JSON.parse(layer.internalLayers);
												var layerIds = [];
												array.forEach( internalLayers, lang.hitch( this, function ( internalLayer ) {
													if (internalLayer.subLayerIds == null) {
														layerIds.push(internalLayer.id);
													}												
												}));
												replicasToCreate.push({
													"featureServerUrl":featureServerUrl, 
													"serviceUrl":serviceUrl, 
													"boundingExtend":boundingExtend, 
													"layerIds":layerIds, 
													"offlineAreaSelected":offlineAreaSelected, 
													"layer":layer, 
													"syncPerReplica":syncPerReplica
												});							
											} else {
												var errorJson = {};
												errorJson.error = {details: "Sync not enabled for layer " + layer.name};
												deferred.resolve(JSON.stringify(errorJson));
											}										
										} else {
											var errorJson = {};
											errorJson.error = {details: "Sync not enabled for layer " + layer.name};
											deferred.resolve(JSON.stringify(errorJson));
										}
									} else {
										this.maximoSpatialStore.addBasemap( serviceUrl, offlineAreaSelected['spi_spatial:oslcofflineareaid'],
												offlineAreaSelected['spi_spatial:mblextent'], offlineAreaSelected['spi_spatial:mblinitzoom'], offlineAreaSelected['spi_spatial:mblfnlzoom'] );
									}
								} ) );
								
								this._createReplicas( replicasToCreate, 0, deferred );
								
							}  else {
								this.openLayerMap._showErrorMsg("No tiles found to load offline map.")
							}
						}));
					}));
				}else{
					this.openLayerMap._showErrorMsg(MessageService.createStaticMessage('deviceIsOffline').getMessage());
				}
			}));
			return deferred.promise;			
			
		},
		
		loadOfflineData : function (offlineAreaSelected, targetId) {
			if (targetId == null) {
				targetId = this.map.getTarget();
			}
			this.esriTileCacheManager.showProgressControl( targetId );
			var resolutions = [];
			var layers = this.map.getLayers();
			var layerBasemap = null;
			layers.forEach(lang.hitch(this, function(layer, index, array) {
				if (layer.isBasemap && layer.isBasemap == true
						&& layer.url) {
					layerBasemap = layer;
				}			
		    }));			
			var centerPoint = this.map.getView().getCenter();
			return this._loadMapData(layerBasemap, centerPoint, offlineAreaSelected);
			

		},
		
		updateMapView: function(initialX, initialY, zoomLevel, resolutions) {
			var view = null;
			if (resolutions == null || resolutions.length == 0) {
				view = new ol.View( {
					center : [
							initialX, initialY
					],
					zoom : zoomLevel
				} )
			} else {
				view = new ol.View( {
					center : [
							initialX, initialY
					],
					zoom : zoomLevel,
					resolutions: resolutions
				} )
			}
			
			this.map.setView(view);
			
			if (this.moveEndHandler == null) {
				
				this.moveEndHandler = this.map.getView().on('propertychange', lang.hitch(this, function (e) {
					
					 switch (e.key) {
					      case 'resolution':
					    	  var maxResolution = this.map.getView().getMaxResolution();
								var minResolution = this.map.getView().getMinResolution();					     
								var currentResolution = this.map.getView().getResolution();
							 	if (currentResolution < minResolution) {	
									var zoom = ol.animation.zoom({
								          resolution: this.map.getView().getResolution()
								        });
								    this.map.beforeRender(zoom);
								    this.map.getView().setResolution(minResolution);
								} else {
									if(currentResolution > maxResolution) {
										var zoom = ol.animation.zoom({
									          resolution: this.map.getView().getResolution()
									        });
									    this.map.beforeRender(zoom);
										this.map.getView().setResolution(maxResolution);
									}
								}
					        break;
					   }
					
					
			    }));
			}
			
		},
		
		_prepateOnlineMap: function(gpsCoordinate, deferred) {
			if (this.map == null) {
				var zoomLevel = null;
				var initialx = null;
				var initialy = null;

				var mapSite = this.mapManager.currentMapSite;
				if ( mapSite ) {
					zoomLevel = mapSite[ 'spi_spatial:zoomlevel' ];
					initialx = mapSite[ 'spi_spatial:initialx' ];
					initialy = mapSite[ 'spi_spatial:initialy' ];
				}
				if ((initialx == null || initialy == null) && gpsCoordinate != null) {
					initialx = gpsCoordinate[0];
					initialy = gpsCoordinate[1];
				}
				
				this.map = this._createOpenLayerMap(null, initialx, initialy, zoomLevel); 
				this.map.addLayer(this.openLayerMap.glayer);
				this._addOnClickMap();									
			}								
			var resolutions = [];
			var maxZoom = null;
			for ( var iLayer = 0; iLayer < this.layers.length; iLayer++ ) {
				var addLayer = this.layers[ iLayer ];
				if (addLayer.isBasemap) {
					var jsonMapServer = JSON.parse(addLayer.jsonMapServer);
					var tileInfo = jsonMapServer.tileInfo;
					if (tileInfo != null) {
						var lods = tileInfo.lods;
						array.forEach( lods, lang.hitch( this, function ( lod, i ) {
							resolutions.push(lod.resolution);
						}))
						
					}
				}
				this.map.getLayers().insertAt(iLayer, addLayer);
			}

			var centerPoint = this.map.getView().getCenter();
			var zoomLevel = this.map.getView().getZoom();
			this.showingOnlineMap = true;
			this.updateMapView( centerPoint[0], centerPoint[1], zoomLevel, resolutions );
			deferred.resolve(true);
		},
		
		loadOnlineMap : function () {
			this.identifyTool.hideDialog();
			var deferred = new Deferred();
			console.log( "Online map shown at this time" );
			
			ConnectivityChecker.checkConnectivityAvailable().then(lang.hitch(this, function(isConnectionAvailable){
				if (isConnectionAvailable ) {
					
					for ( var len = 0; len < this.cacheLayers.length; len++ ) {
						var removeCacheLayer = this.cacheLayers[ len ];
						this.map.removeLayer( removeCacheLayer );				
					}
					this.cacheLayers = [];
					
					if (this.mapManager == null) {
						this.loadMapManager(false, lang.hitch( this, function ( mapManagerInfo ) {
							this._loadLayers( this.mapManager, lang.hitch(this, function() {
								
								var promiseGPS = this.loadGPSPositionIfExtentNotAvailable(this.mapManager);
								promiseGPS.then(lang.hitch(this, function(jsonGeoLocObj) {
									if (jsonGeoLocObj != null) {
										this._prepateOnlineMap( jsonGeoLocObj, deferred );
									} else {
										this._prepateOnlineMap( null, deferred );
									}
									
								})).otherwise(lang.hitch(this, function(error){
									this.showingOnlineMap = false;
									WL.application.showMessage(error);
									deferred.resolve(false);
								}));
								
							}));

						} ),
						lang.hitch(this, function(errorMsg, errorDetails) {
							this.showingOnlineMap = false;
							var error = {errorMsg: errorMsg, errorDetails: errorDetails};
							deferred.resolve(error);
						}));
					} else {
						var promiseGPS = this.loadGPSPositionIfExtentNotAvailable(this.mapManager);
						promiseGPS.then(lang.hitch(this, function(jsonGeoLocObj) {
							if (jsonGeoLocObj != null) {
								this._prepateOnlineMap( jsonGeoLocObj, deferred );
							} else {
								this._prepateOnlineMap( null, deferred );
							}
							
						})).otherwise(lang.hitch(this, function(error){
							this.showingOnlineMap = false;
							WL.application.showMessage(error);
							deferred.resolve(false);
						}));

					}
					
						
				} else { 
					this.showingOnlineMap = false;
					WL.application.showMessage(MessageService.createStaticMessage('deviceIsOffline').getMessage())
					deferred.resolve(false);
				}
			}));
			return deferred.promise;
			

			
		},
		
		/**
		 * Method to reload the layers with a new token if it expires
		 * @param callBackFuntion
		 */
		reloadLayersIfTokenExpired: function(callBackFuntion) {
			//It will check the Tokens only if security is enable on Map Manager
			if (this.mapManager.spatialtokensecurity != null && this.mapManager.spatialtokensecurity == true) {
				var layers = this.map.getLayers();
				var layersIndex = [];
				var urlsToRequest = [];
				//This for search for layers expired and save its index to insert a renew one at the same position
				layers.forEach(lang.hitch(this, function(layer, index, array) {
					if (layer.values_ && layer.values_.source) {
						var url = layer.url;
						if (url) {
							url = this.proxyHelper.removeProxyURL(url);
							if (this.mapManager.spatialtokensecurity != null && this.mapManager.spatialtokensecurity == true) {
								var isTokenValid = this.tokenAuthentication.checkTokenCacheValid( url );
								if (isTokenValid == false) {
									layersIndex.push(index);
									urlsToRequest.push(url);
									console.log("Token expired for URL ", url);
									console.log("Token Value expired ", layer.values_.source.params_.token);
									Logger.log("Token expired for URL " + url);
									Logger.log("Token Value expired " + layer.values_.source.params_.token);
								}
							}
						}						
					}
			    }));
				
				if (urlsToRequest.length > 0 && this.mapManager != null) {
					// Generate the tokens
					var promise = this.tokenAuthentication.generateTokens(urlsToRequest, this.mapManager, true);
					promise.then(lang.hitch(this, function(tokens) {			
						var i=0;
						for (var url in tokens) {
							array.forEach( urlsToRequest, lang.hitch( this, function ( urlToRequest, i ) {						
								if (url == urlToRequest) {
									var mapService = null;
									array.forEach( this.mapServices, lang.hitch( this, function ( service ) {	
										if (service.url == url) {
											mapService = service;									
										}									
									} ) );
									
									var layerIndex = layersIndex[i];
									var layerToRenew = layers.getArray()[layerIndex];
									var jsonLayersArray = JSON.parse(layerToRenew.internalLayers);
									var layerToShow = "";
									array.forEach( jsonLayersArray, lang.hitch( this, function ( jsonLayer, i ) {
										layerToShow = layerToShow + jsonLayer.id;
										if (i < jsonLayersArray.length-1) {
											layerToShow = layerToShow + ",";
										}
									}));
									if (layerToShow == "") {
										layerToShow = "-1";
									}
									this.map.removeLayer( layerToRenew );
									
									var token = tokens[url];
								    var tokenValue = token.tokenValue;
								    
								    var params = {};
									if (tokenValue != null) {
										console.log("Token generated for URL: ", url);
										console.log("New token generated: ", tokenValue);
										Logger.log("Token generated for URL: "+ url);
										Logger.log("New token generated: "+ tokenValue);
										params = {"token": tokenValue};
									}
									url = this.proxyHelper.includeProxyURLIfEnabled( url, this.mapManager );	
									var arcgisLayer =  new ol.source.TileArcGISRest( {
										url : url,
										params: params
									} );
									
									var originalTileLoadFunction = arcgisLayer.tileLoadFunction;
									arcgisLayer.tileLoadFunction = lang.hitch(this, function ( imageTile, src ) {
										var layerToShow = "";
										var layers = this.map.getLayers().getArray();
										array.forEach( layers, lang.hitch( this, function ( layer, i ) {
											if (layer.url == imageTile.key) {
												var internalLayers = JSON.parse(layer.internalLayers);
												array.forEach(internalLayers , lang.hitch( this, function ( layer, i ) {
													layerToShow = layerToShow + layer.id;
													if (i < internalLayers.length-1) {
														layerToShow = layerToShow + ",";
													}
												}));
											}																
										}));
										src = src + "&layers=show:" + layerToShow;
										return originalTileLoadFunction(imageTile, src);
									});
									var newLayer = new ol.layer.Tile( {
										source : arcgisLayer,
										opacity: (100-mapService.transparency)/100,
										visible: mapService.visible
									} );				
									newLayer.isBasemap = mapService.istiledlayer;
									newLayer.internalLayers = mapService.jsonlayers;
									newLayer.jsonFeatureServer = mapService.jsonfeatureserver;
									newLayer.url = url;
									newLayer.token = tokenValue;
									newLayer.name = mapService.servicename;
									
									//Add the layer to the same position (respecting the order)
									this.map.getLayers().insertAt(layerIndex, newLayer);
								}									
							} ) );
							
							if (callBackFuntion) {
								callBackFuntion();
							}
						}							
						
						
					}));
				} else {
					if (callBackFuntion) {
						callBackFuntion();
					}
				}
			} else {
				if (callBackFuntion) {
					callBackFuntion();
				}
			}
		},
		
		getOfflineAreaBasedOnCoordinate: function(coordinate, mapManager) {
			var mapSite = mapManager.currentMapSite;
			var offlineAreaSelected = null;
			if ( mapSite ) {
				var offlineAreas = mapSite['spi_spatial:oslcofflinearea'];
				if (coordinate != null) {
					array.forEach( offlineAreas, lang.hitch( this, function ( offlineArea ) {
						var extent = JSON.parse(offlineArea['spi_spatial:mblextent']).extent;
						
						var boundingExtend = ol.extent.boundingExtent(extent[0]);
						var containsCoordinate = ol.extent.containsCoordinate(boundingExtend, coordinate);
						if (containsCoordinate == true) {
							offlineAreaSelected = offlineArea;
						}
					} ) );
				}	
			} 
			return offlineAreaSelected;
			
			
		},
		
		_afterLoadMapManager: function(coordinate, callbackFunction) {
			
		},
		_createOpenLayerMap: function (layers, initialx, initialy, zoomLevel) {
			if (initialx == null || initialy == null) {
				WL.application.showMessage(MessageService.createStaticMessage('gpsNotAvailable').getMessage())
			}
			if (zoomLevel == null) {
				zoomLevel = 14;
			}
			if (layers == null) {
				layers = [];
			}
			this._createOverlay();
			var mapInstance = new ol.Map( {
				layers : layers,
				target : this._mapTarget,
				view : new ol.View( {
					center : [
							initialx, initialy
					],
					zoom : zoomLevel

				} ),
				overlays : [
					this.overlayPanel
				],
				controls : []

			} );
			return mapInstance;
		},
		
		loadGPSPositionIfExtentNotAvailable: function(mapManager) {
			var deferred = new Deferred();
			setTimeout(lang.hitch(this, function(){ 
				var mapSite = mapManager.currentMapSite;
				if ( mapSite ) {
					zoomLevel = mapSite[ 'spi_spatial:zoomlevel' ];
					initialx = mapSite[ 'spi_spatial:initialx' ];
					initialy = mapSite[ 'spi_spatial:initialy' ];
				}
				
				if (initialx == null || initialy == null) {
					console.log("Getting GPS Location, initial extent is null");
					var promiseGPS = MapGeoLocation.getInstance().getGPSLocation();
					promiseGPS.then( lang.hitch( this, function ( jsonGeoLocObj ) {
						var long = jsonGeoLocObj.geolocation[ 'max:longitudex' ];
						var lat = jsonGeoLocObj.geolocation[ 'max:latitudey' ];
						var XYPoint = ol.proj.fromLonLat( [
								long, lat
						] );
						deferred.resolve(XYPoint);
					} ) ).otherwise( lang.hitch( this, function ( error ) {
						deferred.reject(error);
					} ) );
				} else {
					deferred.resolve(null);
				}
			}), 100);
			
			return deferred.promise;
		},
		
		
		//Method to create the Map
		createMap : function ( target, callbackFunction, callbackErrorFunction ) {
			this._mapTarget = target;
			
			ConnectivityChecker.checkConnectivityAvailable().then(lang.hitch(this, function(isConnectionAvailable){
				console.log("Device is online? " + isConnectionAvailable);
				
				// Check the last configuration saved for the user, when they switch between online/offline this config is saved in plussmapconfig store.
				var promiseSavedShowingOnline = this.maximoSpatialStore.getMapConfig();
				promiseSavedShowingOnline.then(lang.hitch(this, function(mapConfig) {
					var loadOnline = true;
					if (mapConfig != null && mapConfig.json != null) {
						loadOnline = mapConfig.json.showingOnlineMap;
					} 
					
					if (loadOnline == true && isConnectionAvailable ) {
						console.log("Loading online map ");
						
						var promiseLoadOnline = this.loadOnlineMap(null);
						promiseLoadOnline.then(lang.hitch(this, function(result){
								if (result == true) {
									if (callbackFunction) {
										lang.hitch(this, callbackFunction(this.map));
									}
								} else {
									if (callbackErrorFunction) {
										callbackErrorFunction(result.errorMsg, result.errorDetails);
									}
								}
						}));
					} else { // Load offline map
						console.log("Loading offline map ");
						var promiseGetOfflineAreas = this.maximoSpatialStore.getAllOfflineArea();
						promiseGetOfflineAreas.then(lang.hitch(this, function(offlineAreas){
							if (offlineAreas.length > 0) {
								var initialZoom = 0;
								var centerPoint = null;
								array.forEach( offlineAreas, lang.hitch( this, function ( offlineArea ) {
									if (centerPoint == null) {
										var jsonOfflineArea = offlineArea.json;
										var jsonInitialZoom = jsonOfflineArea.initialZoom;
										if (jsonInitialZoom > initialZoom) {
											initialZoom = jsonInitialZoom;
										}
										console.log("Initial Zoom " + initialZoom);
										centerPoint = ol.extent.getCenter(jsonOfflineArea.extent);
									}
								} ) );
								this.map = this._createOpenLayerMap(null, centerPoint[0], centerPoint[1], initialZoom); 
								this._addOnClickMap();
								var promisesOffline = this.loadOfflineMap();
								promisesOffline.then(lang.hitch(this, function() {
									if (callbackFunction) {
										lang.hitch(this, callbackFunction(this.map));
									}
								}));
							} else {
								WL.application.showMessage(MessageService.createStaticMessage('noOfflineDataToShow').getMessage())
							}
						}));
					}
				}));
			}));
			
			
		},

		//Method to load the Offline Map Manager created on Map Manager app (Maximo Side)
		loadMapManager : function (forceServerPreferred, callBackFunction, callBackErrorFunction ) {
			var currentUserSite = this.userAuthenticationManager.currentUserSite;
			var mapManagerMeta = ResourceMetaData.getResourceMetadata( "plussmapmanager" );
			mapManagerMeta.setWhereClause( "spi_spatial:ismobile=1 and spi_spatial:active=1" );

			var mapmanagerdata = ModelService.all( 'plussmapmanager', null, null );
			mapmanagerdata.then( lang.hitch( this, function ( mapmanagerset ) {
				this.mapManager = null;
				array.forEach( mapmanagerset.data, lang.hitch( this, function ( mapmanagerinfo ) {

					var mapsites = mapmanagerinfo.get( 'mapsiteslist' );
					array.forEach( mapsites, lang.hitch( this, function ( mapsite ) {
						var siteId = mapsite[ "spi_spatial:siteid" ];
						if ( currentUserSite == siteId ) {
							this.mapManager = mapmanagerinfo;
							this.mapManager.currentMapSite = mapsite;
						}
					} ) );

				} ) );

				if ( this.mapManager == null ) {
					// show message error - no Map manager found
					var errorMsg = "No Mobile MapManager record found for SITE= " + currentUserSite;
					console.error( errorMsg );
					if (callBackErrorFunction) {
						callBackErrorFunction( "noMapManagerFound", currentUserSite );
					}
				} else {
					console.log( "Map Manager found: " , this.mapManager );
					if (callBackFunction) {
						callBackFunction( this.mapManager );
					}
					
				}
				ModelService.save(mapmanagerset);

			} ) );
		}

	});
});
