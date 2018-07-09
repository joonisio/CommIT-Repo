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
				"dojo/_base/declare", "dojo/_base/lang", "dojo/Deferred", "dojo/promise/all", "platform/store/PersistenceManager",
				"platform/map/spatial/store/MaximoSpatialStore", "dojo/_base/array", "platform/map/MapProperties"
		],
		function ( declare, lang, Deferred, all, PersistenceManager, MaximoSpatialStore, array, MapProperties ) {

			declare(
					"platform.map.esriTileCacheManager",
					null,
					{

						tileInfo : null,
						initialExtent : null,
						minZ : null,
						maxZ : null,
						tileSize : null,
						tileOrigin : null,
						maximoSpatialStore: null,
						offlineAreaId: null,
						numberOfRequests: null,
						
						
						constructor : function ( options ) {
							this.maximoSpatialStore = new platform.map.spatial.store.MaximoSpatialStore();
							this.numberOfRequests = MapProperties.getProperty('si.map.esri.numberOfRequests');
						},

						showProgressControl : function ( target ) {

							var targetelement;
							var stylewidth = 0;

							if ( target.parentElement ) {
								targetelement = target.parentElement;
								stylewidth = target.style.width;
							} else {
								var mapElement = document.getElementById( target );
								targetelement = mapElement.parentElement;
								stylewidth = mapElement.style.width;
							}

							var progressbar = document.createElement( "progress" );

							progressbar.setAttribute( "id", "cacheProgressBar" );
							progressbar.setAttribute( "max", 100 );
							progressbar.setAttribute( "value", 0 );
							progressbar.setAttribute( "style", "width:100% !important;" );

							targetelement.appendChild( progressbar );
							targetelement.insertBefore( progressbar, targetelement.firstChild );

						},

						updateProgressBar : function ( inProgressValue, maxValue ) {
							var newValue = Math.floor( ( 100 / maxValue ) * inProgressValue )
							var bar = document.getElementById( 'cacheProgressBar' );
							bar.value = newValue;
						},

						hideProgressBar : function () {
							var progressbar = document.getElementById( "cacheProgressBar" );
							if (progressbar) {
								progressbar.parentNode.removeChild( progressbar );
							}							
						},

						createTileCache : function ( layerBasemap, extent, minZoom, maxZoom, offlineAreaSelected ) {
							var  offlineAreaName = offlineAreaSelected['spi_spatial:mblareaname'];
							this.offlineAreaId = offlineAreaSelected['spi_spatial:oslcofflineareaid'];
							this.initialExtent = extent;
							this.minZ = minZoom;
							this.maxZ = maxZoom;
							this.url = layerBasemap.url;
							console.log( "Get Tile Info!!!" );
							this.parseTileInfo( layerBasemap.jsonMapServer );
							
							var initZoom = Number(offlineAreaSelected['spi_spatial:mblinitzoom']);
							var finalZoom = Number(offlineAreaSelected['spi_spatial:mblfnlzoom']);
							
							var jsonMapServer = JSON.parse(layerBasemap.jsonMapServer);
							var tileInfo = jsonMapServer.tileInfo;
							var resolutions = [];
							if (tileInfo != null) {
								var lods = tileInfo.lods;
								array.forEach( lods, lang.hitch( this, function ( lod, i ) {
									var level = lod.level;
									var resolution = lod.resolution;
									if (level >= initZoom && level <= finalZoom && resolutions.indexOf(resolution) == -1) {
										resolutions.push(resolution);
									}
								}))	
							}
							
							
							this.maximoSpatialStore.addOfflineArea( offlineAreaName, this.offlineAreaId, this.minZ, this.maxZ, this.initialExtent, resolutions );
						},

						getCellIdFromXy : function ( x, y, level ) {
							var col = Math.floor( ( x - this.tileInfo.origin.x ) / ( this.tileInfo.cols * this.tileInfo.lods[ level ].resolution ) );
							var row = Math.floor( ( this.tileInfo.origin.y - y ) / ( this.tileInfo.rows * this.tileInfo.lods[ level ].resolution ) );
							return [
									col, row
							];
						},

						getCellPolygonFromCellId : function ( cellId, level ) {
							var col1 = cellId[ 0 ];
							var row1 = cellId[ 1 ];
							var col2 = col1 + 1;
							var row2 = row1 + 1;

							var x1 = this.tileInfo.origin.x + ( col1 * this.tileInfo.cols * this.tileInfo.lods[ level ].resolution );
							var y1 = this.tileInfo.origin.y - ( row1 * this.tileInfo.rows * this.tileInfo.lods[ level ].resolution );
							var x2 = this.tileInfo.origin.x + ( col2 * this.tileInfo.cols * this.tileInfo.lods[ level ].resolution );
							var y2 = this.tileInfo.origin.y - ( row2 * this.tileInfo.rows * this.tileInfo.lods[ level ].resolution );

							var polygon;
							var spatialReference = this.tileInfo.spatialReference;

							require( [
								"esri/geometry/Polygon"
							], function ( Polygon ) {
								polygon = new Polygon( spatialReference );
							} );

							polygon.addRing( [
									[
											x1, y1
									], // clockwise
									[
											x2, y1
									], [
											x2, y2
									], [
											x1, y2
									], [
											x1, y1
									]
							] );
							return polygon;
						},

						getAllCellIdsInExtent : function ( extent, gridLevel ) {
							var cellId0 = this.getCellIdFromXy( extent[ 0 ], extent[ 1 ], gridLevel );
							var cellId1 = this.getCellIdFromXy( extent[ 2 ], extent[ 3 ], gridLevel );

							var i, j;
							var i0 = Math.max( Math.min( cellId0[ 0 ], cellId1[ 0 ] ), this.tileInfo.lods[ gridLevel ].startTileCol );
							var i1 = Math.min( Math.max( cellId0[ 0 ], cellId1[ 0 ] ), this.tileInfo.lods[ gridLevel ].endTileCol );
							var j0 = Math.max( Math.min( cellId0[ 1 ], cellId1[ 1 ] ), this.tileInfo.lods[ gridLevel ].startTileRow );
							var j1 = Math.min( Math.max( cellId0[ 1 ], cellId1[ 1 ] ), this.tileInfo.lods[ gridLevel ].endTileRow );

							var cellIds = [];

							for ( i = i0; i <= i1; i++ ) {
								for ( j = j0; j <= j1; j++ ) {
									cellIds.push( [
											i, j
									] );
								}
							}
							return cellIds;
						},

						getAllTiles : function () {

							var deferred = new Deferred();

							var cells = [];

							for ( var level = this.minZ; level <= this.maxZ; level++ ) {
								var level_cell_ids = this.getAllCellIdsInExtent( this.initialExtent, level );

								level_cell_ids.forEach( function ( cell_id ) {
									cells.push( {
										level : level,
										row : cell_id[ 1 ],
										col : cell_id[ 0 ]
									} );
								} );

								// if the number of requested tiles is excessive, we just stop
								if ( cells.length > 5000 ) {
									console.log( "enough is enough!" );
									break;
								}
							}
							
							this.getAllTilesFromServer( cells, 0, deferred, [] );

							return deferred.promise;
						},

						getAllTilesFromServer : function ( cells, i, deferred, urlRequest ) {
							var url = "";
							var self = this;
							
							if ( cells.length > i ) {

								self.updateProgressBar( i, cells.length );

								var cell = cells[ i ];

								var level = cell.level;
								var row = cell.row;
								var col = cell.col;

								url = this.url + "/tile/" + level + "/" + row + "/" + col;
								urlRequest.push(url);
								if (urlRequest.length == this.numberOfRequests || i == cells.length-1) {
									
									this.downloadTiles( urlRequest ).then( function () {	
										self.getAllTilesFromServer( cells, ++i, deferred, [] );
									} );
								} else {
									self.getAllTilesFromServer( cells, ++i, deferred, urlRequest );
								}
								
								
							} else {
								self.hideProgressBar();
								deferred.resolve();
							}

						},

						downloadTiles : function ( urlArray ) {
							/* download the tile */
							var deferred = new Deferred();
							var offlineId = this.offlineAreaId;

							var self = this;
							var count = 0;
							array.forEach( urlArray, lang.hitch( this, function ( url ) {	
								var req = new XMLHttpRequest();
								req.open( "GET", url, true );
								req.overrideMimeType( "text/plain; charset=x-user-defined" ); // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest?redirectlocale=en-US&redirectslug=DOM%2FXMLHttpRequest%2FUsing_XMLHttpRequest#Handling_binary_data

								req.onload = function () {
									if ( req.status === 200 && req.responseText !== "" ) {
										count++;
										var img = self._wordToBase64( self._stringToWord( this.responseText ) );
										
										self.maximoSpatialStore.addTile( url, img, offlineId );
										if (count >= urlArray.length) {
											deferred.resolve();
										}
										
									} else {
										console.log( "xhr failed for", url );
										deferred.reject();
									}
								};
								req.onerror = function ( e ) {
									console.log( "xhr failed for", url );
									deferred.reject();
								};
								req.send( null );
							} ) );
							
							
							

							return deferred.promise;
						},
						
						downloadSingleTile : function ( url ) {
							/* download the tile */
							var deferred = new Deferred();
							var offlineId = this.offlineAreaId;

							var self = this;
							var req = new XMLHttpRequest();
							req.open( "GET", url, true );
							req.overrideMimeType( "text/plain; charset=x-user-defined" ); // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest?redirectlocale=en-US&redirectslug=DOM%2FXMLHttpRequest%2FUsing_XMLHttpRequest#Handling_binary_data

							req.onload = function () {
								if ( req.status === 200 && req.responseText !== "" ) {
									var img = self._wordToBase64( self._stringToWord( this.responseText ) );
									
									self.maximoSpatialStore.addTile( url, img, offlineId );
									deferred.resolve();
								} else {
									console.log( "xhr failed for", url );
									deferred.reject();
								}
							};
							req.onerror = function ( e ) {
								console.log( "xhr failed for", url );
								deferred.reject();
							};
							req.send( null );

							return deferred.promise;
						},

						getContainingTileCoords : function ( point, res ) {
							var x = Math.max( Math.floor( ( point[ 0 ] - this.tileOrigin.x ) / ( this.tileSize.w * res ) ), 0 );
							var y = Math.max( Math.floor( ( this.tileOrigin.y - point[ 1 ] ) / ( this.tileSize.h * res ) ), 0 );
							return {
								x : x,
								y : y
							};
						},

						_wordToBase64 : function ( /* word[] */wa ) {
							// summary:
							// convert an array of words to base64 encoding, should be more efficient
							// than using dojox.encoding.base64
							var p = "=", tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", s = [];
							for ( var i = 0, l = wa.length * 4; i < l; i += 3 ) {
								var t = ( ( ( wa[ i >> 2 ] >> 8 * ( i % 4 ) ) & 0xFF ) << 16 ) | ( ( ( wa[ i + 1 >> 2 ] >> 8 * ( ( i + 1 ) % 4 ) ) & 0xFF ) << 8 ) | ( ( wa[ i + 2 >> 2 ] >> 8 * ( ( i + 2 ) % 4 ) ) & 0xFF );
								for ( var j = 0; j < 4; j++ ) {
									if ( i * 8 + j * 6 > wa.length * 32 ) {
										s.push( p );
									} else {
										s.push( tab.charAt( ( t >> 6 * ( 3 - j ) ) & 0x3F ) );
									}
								}
							}
							return s.join( "" );
						},

						_stringToWord : function ( /* string */s ) {
							// summary:
							// convert a string to a word array

							// word-based conversion method, for efficiency sake;
							// most digests operate on words, and this should be faster
							// than the encoding version (which works on bytes).
							var chrsz = 8; // 16 for Unicode
							var mask = ( 1 << chrsz ) - 1;

							var wa = [];
							for ( var i = 0, l = s.length * chrsz; i < l; i += chrsz ) {
								wa[ i >> 5 ] |= ( s.charCodeAt( i / chrsz ) & mask ) << ( i % 32 );
							}
							return wa; // word[]

						},

						parseTileInfo : function ( jsonMapServer ) {
							var resultObj = JSON.parse( jsonMapServer );

							this.tileInfo = resultObj.tileInfo;

							// set start/end column/row for LODS

							this.tileSize = {
								w : resultObj.tileInfo.cols,
								h : resultObj.tileInfo.rows
							};

							// set tile origin point in xy
							this.tileOrigin = resultObj.tileInfo.origin;
							// set topleft and bottomright points
							var upperLeft = ol.extent.getTopLeft( [
									resultObj.fullExtent.xmin, resultObj.fullExtent.ymin, resultObj.fullExtent.xmax, resultObj.fullExtent.ymax
							] );
							var bottomRight = ol.extent.getBottomRight( [
									resultObj.fullExtent.xmin, resultObj.fullExtent.ymin, resultObj.fullExtent.xmax, resultObj.fullExtent.ymax
							] );

							var lods = [];
							for ( var key in resultObj.tileInfo.lods ) {
								if ( resultObj.tileInfo.lods.hasOwnProperty( key ) ) {
									var lod = resultObj.tileInfo.lods[ key ];

									var start = this.getContainingTileCoords( upperLeft, lod.resolution );
									lod.startTileCol = start.x;
									lod.startTileRow = start.y;

									var end = this.getContainingTileCoords( bottomRight, lod.resolution );
									lod.endTileCol = end.x;
									lod.endTileRow = end.y;
									lods.push( lod );
								}
							}

							this.tileInfo.lods = lods;

						},

						getTileUrl : function ( lookupURL ) {
							var deferred = new Deferred();
							this.maximoSpatialStore.findTileImg( lookupURL ).then(function(tile) {
								var img = null;
								if (tile[0] && tile[0].json && tile[0].json.img) {
									var img = tile[0].json.img;
									img = "data:image/png;base64," + img;	
								} else {
									img = "data:image/png;base64," + "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AwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDDwAwMBPAABGrpAUwAAAABJRU5ErkJggg==";									
								}																
								deferred.resolve(img);
							});

							
							return deferred.promise;
						},
						
						loadTilesIntoStore: function(layerBasemap, boundingExtend, initZoom, finalZoom, offlineAreaSelected) {
							var deferred = new Deferred();
							this.maximoSpatialStore.initTilesCollection();
							this.createTileCache( layerBasemap, boundingExtend, initZoom, finalZoom, offlineAreaSelected );
							this.getAllTiles().then( lang.hitch(this, function () {
								deferred.resolve();
							} ) );
							return deferred.promise;
						}

					} );
		} );
