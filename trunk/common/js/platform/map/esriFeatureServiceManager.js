/*
 * Licensed Materials - Property of IBM
 *
 * (C) COPYRIGHT IBM CORP. 2016 
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/**
 * createdBy: Chandrasekar Mohan
 * 
 */
require(
		[
				"dojo/_base/declare", "dojo/_base/lang", "dojo/Deferred", "dojo/promise/all", "platform/store/PersistenceManager", "platform/map/spatial/store/MaximoSpatialStore",
				"dojo/_base/array"
		],
		function ( declare, lang, Deferred, all, PersistenceManager, MaximoSpatialStore, array ) {

			declare("platform.map.esriFeatureServiceManager", null,	{

			_inMemTilesObject : null,

			loadFeaturesIntoStore : function (layers) {
				
				console.log("*************** layers" , layers);
				
				array.forEach( layers, lang.hitch( this, function ( layer ) {	
					if (layer.isBasemap == false) {
						var internalLayers = JSON.parse(layer.internalLayers);
						array.forEach( internalLayers, lang.hitch( this, function ( internalLayer ) {	
							console.log(internalLayer);
							if (layer.values_ && layer.values_.source) {
								var serviceUrl = layer.values_.source.key_;
								var layerId = internalLayer.id;
								var vectorWaterSource = new ol.source.Vector( {
									loader : lang.hitch( this, function ( extent, resolution, projection ) {
										var url = serviceUrl + layerId + '/query/?f=json&' + 'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry='
												+ encodeURIComponent( '{"xmin":' + extent[ 0 ] + ',"ymin":' + extent[ 1 ] + ',"xmax":' + extent[ 2 ] + ',"ymax":' + extent[ 3 ] + ',"spatialReference":{"wkid":102100}}' )
												+ '&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*' + '&outSR=102100';
										$.ajax( {
											url : url,
											dataType : 'jsonp',
											success : lang.hitch( this, function ( response ) {
												if ( response.error ) {
													alert( response.error.message + '\n' + response.error.details.join( '\n' ) );
												} else {
													// dataProjection will be read from document
													var features = esrijsonFormat.readFeatures( response, {
														featureProjection : projection
													} );
													if ( features.length > 0 ) {
														vectorWaterSource.addFeatures( features );
													}
												}
											} )
										} );
									} ),
									strategy : ol.loadingstrategy.tile( ol.tilegrid.createXYZ( {
										tileSize : 256
									} ) )
								} );

								var vectorWater = new ol.layer.Vector( {
									source : vectorWaterSource
								} );
									
							}
							
						}));
					}
				} ) );
				
				
				
				

						},

						createReplica : function ( deferred, handleEsriJSON ) {
							console.log( "Create Replica Service Stub !!!" );

							var xmlHttp = new XMLHttpRequest();
							xmlHttp.responseType = "json";
							xmlHttp.onreadystatechange = function () {

								if ( xmlHttp.readyState === 4 && xmlHttp.status == 200 ) {
									var obj = xmlHttp.response;
									var layers = obj.layers;

									console.log( "No. of layers in JSON object " + layers.length );

									for ( var i = 0; i < layers.length; i++ ) {
										var layer = layers[ i ];
										console.log( "Layer ID :: " + layer.id );

										var features = layer.features
										console.log( "Features in Layer ID " + layer.id + " :: " + features.length );
										handleEsriJSON( layer );
									}

									deferred.resolve();
								}
							}

							xmlHttp.open( "POST", "http://sampleserver5.arcgisonline.com/arcgis/rest/directories/arcgisoutput/Sync/WildfireSync_MapServer/_Ags_Fsf742d5b1ab594a42be3ddea36bc5143d.json", true ); // true for asynchronous 
							xmlHttp.send( null );

						},

						getLayers : function ( handleEsriJSON ) {
							var deferred = new Deferred();

							this.createReplica( deferred, handleEsriJSON );

							return deferred.promise;

						}
					} );
		} );
