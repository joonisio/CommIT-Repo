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
 * This is the implementation for MXSPATIAL store.
 */

require( [
           "dojo/_base/declare", "dojo/parser", "dojo/ready",
           "dojo/Deferred",
           "dojo/_base/lang", "dojo/promise/all",
           "platform/logging/Logger",
           "dojo/_base/array",            
           "dojo/Deferred",
           "platform/store/ResourceMetadata",
           "platform/store/PersistenceManager",
           "platform/auth/UserAuthenticationManager"
         ], function(declare, parser, ready, Deferred, lang, all,
        		 Logger, array, Deferred, ResourceMetadata, PersistenceManager, UserAuthenticationManager){

	declare( "platform.map.spatial.store.MaximoSpatialStore", null, {
		
		_tilesMetaData: null,
		_basemapMetaData: null,
		_offlineAreaMetaData: null,
		_replicaMetaData: null,
		_replicaFeatureMetaData: null,
		_mapConfigMetaData: null,

		constructor : function ( options ) {
			
		},
		getMapConfigData: function() {
			if (this._mapConfigMetaData == null) {
				this._mapConfigMetaData = new ResourceMetadata({
					resourceName: 'plussmapconfig'
				}).
				setLocal(true).
				addField({
					name: 'showingOnlineMap',
					dataType: 'boolean',
					local: true,
					index: true
				})
			}
			return this._mapConfigMetaData;
		},
		getBasemapMetaData: function() {
			if (this._basemapMetaData == null) {
				this._basemapMetaData = new ResourceMetadata({
					resourceName: 'plussbasemap'
				}).
				setLocal(true).
				addField({
					name: 'url',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'offlineAreaId',
					dataType: 'integer',
					local: true,
					index: true
				}).
				addField({
					name: 'extent',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'zoomLevel',
					dataType: 'integer',
					local: true,
					index: true
				});
				
			}
			return this._basemapMetaData;
		},
		getOfflineAreaMetaData: function() {
			if (this._offlineAreaMetaData == null) {
				this._offlineAreaMetaData = new ResourceMetadata({
					resourceName: 'plussofflineAreaDownloaded'
				}).
				setLocal(true).
				addField({
					name: 'offlineAreaName',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'offlineAreaId',
					dataType: 'integer',
					local: true,
					index: true
				}).
				addField({
					name: 'initialZoom',
					dataType: 'integer',
					local: true,
					index: false
				}).
				addField({
					name: 'finalZoom',
					dataType: 'integer',
					local: true,
					index: false
				}).
				addField({
					name: 'extent',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'lastSync',
					dataType: 'dateTime',
					local: true,
					index: false
				}).
				addField({
					name: 'resolutions',
					dataType: 'string',
					local: true,
					index: false
				})				
				;
				
			}
			return this._offlineAreaMetaData;
		},
		
		getReplicaFeatureMetaData: function() {
			if (this._replicaFeatureMetaData == null) {
				this._replicaFeatureMetaData = new ResourceMetadata({
					resourceName: 'plussReplicaFeature'
				}).
				setLocal(true).
				addField({
					name: 'replicaId',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'globalId',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'feature',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'offlineAreaId',
					dataType: 'integer',
					local: true,
					index: true
				}).	
				addField({
					name: 'layerId',
					dataType: 'integer',
					local: true,
					index: true
				}).
				addField({
					name: 'layerName',
					dataType: 'string',
					local: true,
					index: false
				})
				;
				
			}
			return this._replicaFeatureMetaData;
		},
		
		getReplicaMetaData: function() {
			if (this._replicaMetaData == null) {
				this._replicaMetaData = new ResourceMetadata({
					resourceName: 'plussReplica'
				}).
				setLocal(true).
				addField({
					name: 'replicaId',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'jsonReplica',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'offlineAreaId',
					dataType: 'integer',
					local: true,
					index: true
				}).				
				addField({
					name: 'layerUrl',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'jsonSymbols',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'layerName',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'syncPerReplica',
					dataType: 'boolean',
					local: true,
					index: false
				}).
				addField({
					name: 'jsonScales',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'jsonMapServer',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'internalLayers',
					dataType: 'string',
					local: true,
					index: false
				})				
				;
				
			}
			return this._replicaMetaData;
		},
		
		getTilesMetaData: function() {
			if (this._tilesMetaData == null) {
				this._tilesMetaData = new ResourceMetadata({
					resourceName: 'plussTiles'
				}).
				setLocal(true).
				addField({
					name: 'url',
					dataType: 'string',
					local: true,
					index: true
				}).
				addField({
					name: 'img',
					dataType: 'string',
					local: true,
					index: false
				}).
				addField({
					name: 'offlineAreaId',
					dataType: 'integer',
					local: true,
					index: true
				});	
			}
			return this._tilesMetaData;
		},
		
		initMapConfigCollection: function() {
			var metaData = this.getMapConfigData();		
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};			
			PersistenceManager.initCollection(metaData, credentials);
		},
		initBasemapCollection: function() {
			var metaData = this.getBasemapMetaData();		
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};			
			PersistenceManager.initCollection(metaData, credentials);
		},
		initTilesCollection: function() {
			var metaData = this.getTilesMetaData();		
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};			
			PersistenceManager.initCollection(metaData, credentials);
		},
		
		initOfflineAreaCollection: function() {
			var metaData = this.getOfflineAreaMetaData();		
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};			
			PersistenceManager.initCollection(metaData, credentials);
		},
		
		initReplicaCollection: function() {
			var metaData = this.getReplicaMetaData()		
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};			
			PersistenceManager.initCollection(metaData, credentials);
		},
		initReplicaFeatureCollection: function() {
			var metaData = this.getReplicaFeatureMetaData();		
			var credentials = {username: UserAuthenticationManager._getCurrentUser()};			
			PersistenceManager.initCollection(metaData, credentials);
		},
		
		resetTilesColletion: function() {
			var metaData = this.getTilesMetaData();
			try {
				PersistenceManager.removeCollection(metaData);
				this.initTilesCollection();
			} catch(error) {
				// Store does not exist yet
				this.initTilesCollection();
			}
			
			
		},
		updateMapConfig: function(showingOnlineMap) {
			this.initMapConfigCollection();
			var metaData = this.getMapConfigData();
			var promise = this.getMapConfig();
			promise.then(lang.hitch(this, function(mapConfig) {
				var jsonToAdd = [{
					'showingOnlineMap': showingOnlineMap
				}];
				if (mapConfig == null) {
					PersistenceManager.add(metaData, jsonToAdd).then(function () {
					   	console.log("Json added to Map Config store ", jsonToAdd);
					});
				} else {
					mapConfig.json.showingOnlineMap = showingOnlineMap;
					PersistenceManager.replace(metaData, mapConfig).then(function () {
					   	console.log("Json REPLACED to Map Config store ", mapConfig);
					});
				}
			}));
		},
		
		addBasemap: function(url, offlineAreaId, extent, initialZoom, finalZoom) {
			var metaData = this.getBasemapMetaData();		
			var jsonToAdd = [{
				'url': url,
				'offlineAreaId': offlineAreaId,
				'extent': extent,
				'initialZoom': initialZoom,
				'finalZoom': finalZoom
			}];			
			PersistenceManager.add(metaData, jsonToAdd).then(function () {
			   	console.log("Json added to Basemap store ", jsonToAdd);
			});
		},
		
		updateReplica: function(replica) {
			var deferred = new Deferred();
			var metaData = this.getReplicaMetaData();
			PersistenceManager.replace(metaData, replica).then(function () {
			   	console.log("Json REPLACED to Replica store ", replica);
			   	deferred.resolve(true);
			});
			return deferred.promise;
			
		},
		
		addReplica: function(replicaJson, offlineAreaId, layerUrl, jsonSymbols, layerName, syncPerReplica, jsonScales, jsonMapServer, internalLayers) {
			var deferred = new Deferred();
			var metaData = this.getReplicaMetaData();		
			var jsonToAdd = [{
				'replicaId': replicaJson.replicaID,
				"jsonReplica": replicaJson,
				'offlineAreaId': offlineAreaId,
				'layerUrl': layerUrl,
				'jsonSymbols': jsonSymbols,
				'layerName': layerName,
				'syncPerReplica': syncPerReplica,
				'jsonScales': jsonScales,
				'jsonMapServer': jsonMapServer,
				'internalLayers': internalLayers
			}];
			
			PersistenceManager.add(metaData, jsonToAdd).then(function () {
			   	console.log("Json added to Replica store " + replicaJson.replicaID);
			   	deferred.resolve(true);
			});
			return deferred.promise;
		},
		getReplicaFeatureByLayer: function(replicaId, offlineAreaId, layerId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();		
			var jsonToSearch = [{
				'replicaId': replicaId,
				'offlineAreaId': offlineAreaId,
				'layerId': layerId
			}];
			PersistenceManager.find(jsonToSearch, metaData).then(function(features) {
				deferred.resolve(features);
			});
			return deferred.promise;
			
		},
		getReplicaFeatureByGlobalId: function(replicaId, offlineAreaId, layerId, globalId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();		
			var jsonToSearch = [{
				'replicaId': replicaId,
				'offlineAreaId': offlineAreaId,
				'layerId': layerId,
				'globalId': globalId
			}];
			PersistenceManager.find(jsonToSearch, metaData).then(function(features) {
				deferred.resolve(features);
			});
			return deferred.promise;
			
		},
		updateReplicaFeature: function(replicaId, globalId, offlineAreaId, layerId, feature) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();	
			var jsonToRemove = [{
				'replicaId': replicaId,
				"globalId": globalId,
				'offlineAreaId': offlineAreaId,
				'layerId': layerId				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (features) {
				if(features.length > 0) {
					features[0].json.feature = feature;
					PersistenceManager.replace(metaData, features).then(function () {
					   	console.log("Json updated in Replica Feature store "+ globalId);
					   	deferred.resolve(true);
					});
				} else {
					console.log("Feature not found for replace" + globalId);
					deferred.resolve(false);
				}
				
			}));
			
			return deferred.promise;
		},
		removeReplicaFeature: function(replicaId, globalId, offlineAreaId, layerId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();	
			var jsonToRemove = [{
				'replicaId': replicaId,
				"globalId": globalId,
				'offlineAreaId': offlineAreaId,
				'layerId': layerId				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (features) {
				
				PersistenceManager.remove(metaData, features).then(function () {
				   	console.log("Json removed from Replica Feature store "+ globalId);
				   	deferred.resolve(true);
				});
			}));
			
			return deferred.promise;
		},
		
		/**
		 * Function to add many replica feature to json store, the parameter must be an array of object with the following attributes:
		 * replicaId: string with replica Id
		 * globalId: string with the global id: used to identify the feature as unique
		 * offlineAreaId: the id of the offline map
		 * layerId: layerId of this feature
		 * layerName: layerName of this feature
		 * feature: the feature itself
		 *
		 */
		addManyReplicaFeature: function(featuresToAdd) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();		
			
			PersistenceManager.add(metaData, featuresToAdd).then(function () {
			   	console.log("Total features added to json store " + featuresToAdd.length);
			   	deferred.resolve(true);
			});
			return deferred.promise;
		},
		addReplicaFeature: function(replicaId, globalId, offlineAreaId, layerId, layerName, feature) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();		
			var jsonToAdd = [{
				'replicaId': replicaId,
				"globalId": globalId,
				'offlineAreaId': offlineAreaId,
				'layerId': layerId,
				'layerName': layerName,
				'feature': feature
			}];
			
			PersistenceManager.add(metaData, jsonToAdd).then(function () {
			   	console.log("Json added to Replica Feature store " + globalId);
			   	deferred.resolve(true);
			});
			return deferred.promise;
		},
		updateOfflineArea: function(offlineArea) {
			var deferred = new Deferred();
			var metaData = this.getOfflineAreaMetaData();	
			PersistenceManager.replace(metaData, offlineArea).then(function (result) {
			   	console.log("Json replaced to offline area store ", offlineArea);
			   	deferred.resolve(result);
			});
			return deferred.promise;
			
		},
		addOfflineArea: function(offlineAreaName, offlineAreaId, initialZoom, finalZoom, extent, resolutions) {
			var metaData = this.getOfflineAreaMetaData();		
			var jsonToAdd = [{
				'offlineAreaName': offlineAreaName,
				'offlineAreaId': offlineAreaId,
				'initialZoom': initialZoom, 
				'finalZoom': finalZoom, 
				'extent': extent,
				'lastSync' : new Date(new Date().setHours(0,0,0,0)),
				'resolutions': resolutions
					
			}];
			
			PersistenceManager.add(metaData, jsonToAdd).then(function () {
			   	console.log("Json added to store ", jsonToAdd);
			});
		},
		addTile: function(url, img, offlineAreaId) {
			var metaData = this.getTilesMetaData();		
			var jsonToAdd = [{
				'url': url,
				'img': img,
				"offlineAreaId": offlineAreaId
			}];
			
			PersistenceManager.add(metaData, jsonToAdd).then(function () {
			   	console.log("TILE Json added to store ", jsonToAdd);
			});
		},
		findTileImg: function(lookupURL) {
			var deferred = new Deferred();
			var metaData = this.getTilesMetaData();	
			PersistenceManager.find({'url': lookupURL}, metaData).then(function(tile) {
				deferred.resolve(tile);
			});
			return deferred.promise;
		},
		deleteTilesByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getTilesMetaData();	
			var jsonToRemove = [{
				'offlineAreaId': offlineAreaId,				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (tiles) {				
				PersistenceManager.remove(metaData, tiles).then(function () {
				   	console.log("Tiles removed from PlussTiles store "+ tiles.length);
				   	deferred.resolve(true);
				});
			}));			
			return deferred.promise;
		},
		deleteOfflineAreaById: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getOfflineAreaMetaData()
			var jsonToRemove = [{
				'offlineAreaId': offlineAreaId,				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (offlineArea) {				
				PersistenceManager.remove(metaData, offlineArea).then(function () {
				   	console.log("Offline Area removed from PlussOfflineAreaDownloaded store "+ offlineArea.length);
				   	deferred.resolve(true);
				});
			}));			
			return deferred.promise;
		},
		deleteReplicaByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaMetaData()
			var jsonToRemove = [{
				'offlineAreaId': offlineAreaId,				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (replicas) {				
				PersistenceManager.remove(metaData, replicas).then(function () {
				   	console.log("Replicas removed from PlussReplicas store "+ replicas.length);
				   	deferred.resolve(true);
				});
			}));			
			return deferred.promise;
		},
		deleteReplicaFeaturesByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData()
			var jsonToRemove = [{
				'offlineAreaId': offlineAreaId,				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (replicasFeatures) {				
				PersistenceManager.remove(metaData, replicasFeatures).then(function () {
				   	console.log("Replicas Features removed from PlussReplicaFeatures store "+ replicasFeatures.length);
				   	deferred.resolve(true);
				});
			}));			
			return deferred.promise;
		},
		deleteBasemapByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData()
			var jsonToRemove = [{
				'offlineAreaId': offlineAreaId,				
			}];			
			PersistenceManager.find(jsonToRemove, metaData).then(lang.hitch(this, function (basemaps) {				
				PersistenceManager.remove(metaData, basemaps).then(function () {
				   	console.log("Basemaps removed from PlussBasemaps store "+ basemaps.length);
				   	deferred.resolve(true);
				});
			}));			
			return deferred.promise;
		},
		
		deleteOfflineMap: function(offlineAreaObj) {
			var deferred = new Deferred();
			var offlineAreaId = offlineAreaObj.offlineAreaId;			
			
			var promises = [];
			
			promises.push( this.deleteOfflineAreaById( offlineAreaId ) );
			promises.push( this.deleteTilesByOfflineAreaId( offlineAreaId ) );
			promises.push( this.deleteReplicaByOfflineAreaId( offlineAreaId ) );
			promises.push( this.deleteReplicaFeaturesByOfflineAreaId( offlineAreaId ) );
			promises.push( this.deleteBasemapByOfflineAreaId( offlineAreaId ) );
			
			all(promises).then(lang.hitch(this, function(results) {
				deferred.resolve(true);
			}));
			
			return deferred.promise;
			
			
			
		},
		getMapConfig: function() {
			var deferred = new Deferred();
			var metaData = this.getMapConfigData();		
			PersistenceManager.findAll(metaData).then(lang.hitch(this, function(mapConfigs) {
				if (mapConfigs.length > 0) {
					deferred.resolve(mapConfigs[0]);
				} else {
					deferred.resolve(null);
				}
				
			}));
			return deferred.promise;
		},
		getAllOfflineArea: function() {
			var deferred = new Deferred();
			var metaData = this.getOfflineAreaMetaData();		
			PersistenceManager.findAll(metaData).then(lang.hitch(this, function(allOfflineAreas) {
				deferred.resolve(allOfflineAreas);
			}));
			return deferred.promise;
		},
		getOfflineAreaByName: function(offlineAreaName) {
			var deferred = new Deferred();
			var metaData = this.getOfflineAreaMetaData();		
			PersistenceManager.findExact({'offlineAreaName': offlineAreaName}, metaData).then(function(offlineArea) {
				deferred.resolve(offlineArea);
			});
			return deferred.promise;
		},
		getBasemapByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getBasemapMetaData();		
			PersistenceManager.find({'offlineAreaId': offlineAreaId}, metaData).then(function(replica) {
				deferred.resolve(replica);
			});
			return deferred.promise;
		},
		getReplicaFeatureByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaFeatureMetaData();		
			console.log("getReplicaByOfflineAreaId  " + offlineAreaId);
			PersistenceManager.find({'offlineAreaId': offlineAreaId}, metaData).then(function(replicaFeatures) {
				deferred.resolve(replicaFeatures);
			});
			return deferred.promise;
		},
		getReplicaByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getReplicaMetaData();		
			Logger.trace("getReplicaByOfflineAreaId  " + offlineAreaId);
			PersistenceManager.find({'offlineAreaId': offlineAreaId}, metaData).then(function(replica) {
				Logger.trace("getReplicaByOfflineAreaId  return " + replica);
				deferred.resolve(replica);
			});
			return deferred.promise;
		},
		getReplicaByOfflineAreaIdAndLayerURL: function(offlineAreaId, layerUrl) {
			var deferred = new Deferred();
			var metaData = this.getReplicaMetaData();		
			Logger.trace("getReplicaByOfflineAreaId  " + offlineAreaId);
			PersistenceManager.find({'offlineAreaId': offlineAreaId, 'layerUrl': layerUrl}, metaData).then(function(replica) {
				Logger.trace("getReplicaByOfflineAreaId  return " + replica);
				deferred.resolve(replica);
			});
			return deferred.promise;
		},
		getOfflineAreaById: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getOfflineAreaMetaData();		
			PersistenceManager.find({'offlineAreaId': offlineAreaId}, metaData).then(function(offlineArea) {
				deferred.resolve(offlineArea);
			});
			return deferred.promise;
		},
		getTilesByOfflineAreaId: function(offlineAreaId) {
			var deferred = new Deferred();
			var metaData = this.getTilesMetaData();		
			PersistenceManager.find({'offlineAreaId': offlineAreaId}, metaData).then(function(tiles) {
				deferred.resolve(tiles);
			});
			return deferred.promise;
		},
		getAllBasemap: function() {
			var deferred = new Deferred();
			var metaData = this.getBasemapMetaData();		
			PersistenceManager.findAll(metaData).then(lang.hitch(this, function(allBasemaps) {
				deferred.resolve(allBasemaps);
			}));
			return deferred.promise;
		},
		getAllReplicas: function() {
			var deferred = new Deferred();
			var metaData = this.getReplicaMetaData();		
			PersistenceManager.findAll(metaData).then(lang.hitch(this, function(allReplicas) {
				deferred.resolve(allReplicas);
			}));
			return deferred.promise;
		},
		getAllTiles: function() {
			var deferred = new Deferred();
			var metaData = this.getTilesMetaData();		
			PersistenceManager.findAll(metaData).then(lang.hitch(this, function(allTiles) {
				deferred.resolve(allTiles);
			}));
			return deferred.promise;
		},
		
		countTiles: function() {
			var deferred = new Deferred();
			var metaData = this.getTilesMetaData();
			PersistenceManager.count(metaData).then(function(count){
				deferred.resolve(count);
			}).otherwise(function(error){
				//Since sort erorred and cannot determined if there are new or errored records, play it safe and return false
				deferred.resolve(0);
			});
			return deferred.promise;
		},

		
	});
});
