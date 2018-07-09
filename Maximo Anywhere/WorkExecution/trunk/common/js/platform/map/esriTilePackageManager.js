define("platform/map/esriTilePackageManager",
		[ "dojo/_base/declare",
            "dojo/on",
            "dojo/_base/lang",
		    "dojo/Deferred",
            "dojo/promise/all",
		    "platform/map/anywhere-tpk-src"],
        function(declare,on,lang,Deferred,all,zip) {

	 		var configFile = "";
			//var _inMemTilesIndex = [];
			var _inMemTilesObject = [];
			var _configCDIloaded = false;
			var _configXMLloaded = false;
			var _tpkToBeLoadedRecordCount = 0 ;
			var _tpkLoadedRecordCount = 0 ;
			var TILE_PATH = "" ;
			var _lodMap = [];
			var target_id = "";
			var loadingTPKFile = false;
			var isTPKloadingComplete = false;
			var tempstateFolderName = "";

			/** @class platform.map.esriTilePackageManager */
		return {

			/** @memberOf platform.map.esriTilePackageManager */
		    initMap: function (entries) {

		        var initmapdeferred = new Deferred();

		        this.configFile = entries;

		        //this._inMemTilesIndex = [];
		        this._inMemTilesObject = [];
		        this._configCDIloaded = false;
		        this._configXMLloaded = false;
		        this._tpkToBeLoadedRecordCount = 0 ;
		        this._tpkLoadedRecordCount = 0 ;
		        this.TILE_PATH = "" ;
		        this._lodMap = [];
		        var that = this;
		        this._parseTPKEntries().then(function () {
		            initmapdeferred.resolve();
		        }).otherwise(function (err) {
		            initmapdeferred.reject();
		        });
		        return initmapdeferred; 
		    },


			
		    /**
            * Function for pulling out individual files from the .tpk/zip and storing
            * them in memory.
            * @param files
            * @param callback
            * @private
            */

		    _parseTPKEntries : function() {
		        var parseTPKdeferred = new Deferred();
		        var inMemTilesLength = this.configFile.length;
		        var token = 0;

		        var that = this;

		        var callbackfunc = function (processedtoken,tpkdeferred,cbfunc) {

		            var nexttoken = processedtoken + 1;

		            if (inMemTilesLength === nexttoken || inMemTilesLength < nexttoken) {

		                var metadata = that._parseConfigData();
		                that.loadTPKConfig(metadata);
		                that.isTPKloadingComplete = true;
		                that.hideProgressBar();
		                tpkdeferred.resolve();

		                return;

		            } else {
		                that._parseTPKEntry(nexttoken,tpkdeferred,cbfunc);
		            }
		        };

		        that._parseTPKEntry(token, parseTPKdeferred, callbackfunc);

		        return parseTPKdeferred;

		    },

		    _parseTPKEntry : function (token, parseTPKdeferred, callbackfunc) {

		        var fileentry = this.configFile[token];

		        var name = fileentry.filename.toLocaleUpperCase();

		        var index = name.indexOf("_ALLLAYERS",0);
		        if(index != -1){
		            this.TILE_PATH = name.slice(0,index);
		        }

		        var indexCDI = name.indexOf("CONF.CDI",0);
		        var indexXML = name.indexOf("CONF.XML",0);
		        var indexBUNDLE = name.indexOf("BUNDLE",0);
		        var indexBUNDLX = name.indexOf("BUNDLX",0);
		        var indexItemInfo = name.indexOf("MAPSERVER.JSON", 0);

		        if(indexCDI != -1 || indexXML != -1 || indexItemInfo != -1){
		            this._unzipTempConfFiles(token, parseTPKdeferred, callbackfunc);
		        } 
		        else if(indexBUNDLE != -1 || indexBUNDLX != -1){
		            this._unzipTileTempFiles(token, parseTPKdeferred, callbackfunc);
		        }
		        else {
		            callbackfunc(token, parseTPKdeferred, callbackfunc);
		        }
		    },

		    /**
             * Windows specific function to load TPK basemap tile data from local filesystem 
             */

		    getWinBaseMapTPK: function (target, fileNameWithDir) {

		        this.showProgressBar(target);
		        var WinBaseMapTPKDeferred = new Deferred();
		        var that = this;

		        var basemapFolderName = fileNameWithDir.substr(fileNameWithDir.indexOf("\\") < 0 ? 0 : fileNameWithDir.lastIndexOf("\\") + 1, fileNameWithDir.lastIndexOf('.'));
		        basemapFolderName = basemapFolderName.replace(".tpk", '');

		        if (this.tempstateFolderName && basemapFolderName == this.tempstateFolderName && this.isTPKloadingComplete) {
		            // previous loaded file is same as new one, so no reload required
		            setTimeout(function () {
		                that.hideProgressBar();
		                WinBaseMapTPKDeferred.resolve();
		            }, 500); // Wait for OL to load before resolving
		        } else {

		            this.tempstateFolderName = basemapFolderName;

		            Windows.Storage.ApplicationData.current.temporaryFolder.getFolderAsync(basemapFolderName).then(function (folder) {
		                folder.deleteAsync();
		            }).done(function () {
		                console.log("Found an Offline TPK Basemap folder and deleted for a clean load !!!");

		                setTimeout(function () {
		                    that.createTPKFileStore(target, basemapFolderName, fileNameWithDir).then(function () {
		                        WinBaseMapTPKDeferred.resolve();
		                    }).otherwise(function (err) {
		                        console.log("Error while processing TPK, retry one more time to overlook any file lock issues !!!");
		                        that.hideProgressBar();
		                        WinBaseMapTPKDeferred.reject();
		                    });
		                }, 500); // Wait for unzip file to complete
		            }, function (err) {
		                console.log("Existing Offline TPK Basemap folder not found!!!");
		                setTimeout(function () {
		                    that.createTPKFileStore(target, basemapFolderName, fileNameWithDir).then(function () {
		                        WinBaseMapTPKDeferred.resolve();
		                    }).otherwise( function (err) {
		                        console.log("Error while processing TPK, retry one more time to overlook any file lock issues !!!");
		                        that.hideProgressBar();
		                        WinBaseMapTPKDeferred.reject();
		                    });
		                }, 500); // Wait for unzip file to complete
		            });
		        }
		        return WinBaseMapTPKDeferred.promise;
		    },

		    createTPKFileStore: function (target, basemapFolderName, fileNameWithDir) {

		        var that = this;

		        var createTPKFileStoreDeferred = new Deferred();

		        //Get TPK files from storage 
		        try {
		            Windows.Storage.StorageFile.getFileFromPathAsync(Windows.Storage.ApplicationData.current.localFolder.path + fileNameWithDir).done(function (file) {
		                //Create destination folder
		                console.log("Found the file!!!");
		                Windows.Storage.ApplicationData.current.temporaryFolder.createFolderAsync(basemapFolderName, Windows.Storage.CreationCollisionOption.openIfExists).done(function (folder) {
		                    //Unzip TPK to destination folder
		                    try{
		                        ZipHelperWinRT.ZipHelper.unZipFileAsync(file, folder).done(function () {
		                            console.log("Unzip file '" + file.displayName + "' successfully");
		                            window.resolveLocalFileSystemURL(Windows.Storage.ApplicationData.current.localFolder.path + fileNameWithDir, function (fileEntry) {
		                                fileEntry.file(function (file) {
		                                    that.loadingTPKFile = true;
		                                    console.log("file reader onload function called");
		                                    O.esri.zip.createReader(new O.esri.zip.BlobReader(file), function (zipReader) {
		                                        zipReader.getEntries(function (entries) {
		                                        	zipReader.close(function (evt) {
		                                                console.log("Done reading zip file.");
		                                                that.initMap(entries).then(function () {
		                                                    createTPKFileStoreDeferred.resolve(evt);
		                                                }).otherwise(function (e) {
		                                                    console.log(e);
		                                                    createTPKFileStoreDeferred.reject(e);
		                                                });
		                                            });
		                                        }, function (err) {
		                                            console.log("There is a problem on reading the file!: " + err);
		                                            createTPKFileStoreDeferred.reject(err);
		                                        });
		                                    });
		                                }, function (evt) {
		                                    console.log(evt);
		                                    createTPKFileStoreDeferred.reject(evt);
		                                });
		                            });
		                        }, function (evt) {
		                            console.log(evt);
		                            createTPKFileStoreDeferred.reject(evt);
		                        });
		                    }
		                    catch(err) {
		                        console.log("ZipHelperWinRT not defined! Make sure that it was included on jsproj file of your app. "+err);
		                    }
		                });
		            }, function (err) {
		                createTPKFileStoreDeferred.reject(err);
		            });
		        } catch (err) {
		            createTPKFileStoreDeferred.reject(err);
		        }
		        return createTPKFileStoreDeferred.promise;
		    },

		    showProgressBar : function (target) {

		        var progressbar = document.createElement("progress");
		        var stylewidth = target.style.width;

		        progressbar.setAttribute("id", "proBar");
		        progressbar.setAttribute("max", 100);
		        progressbar.setAttribute("value", 0);
		        progressbar.setAttribute("style", "width:" + stylewidth + ";");

		        target.appendChild(progressbar);
		    },

		    updateProgressBar : function (inProgressValue, maxValue) {
		        var newValue = Math.floor((100 / maxValue) * inProgressValue)
		        var bar = document.getElementById('proBar');
		        bar.value = newValue;
		    },
			
		    hideProgressBar: function () {
		        var progressbar = document.getElementById("proBar");
		        progressbar.parentNode.removeChild(progressbar);
		    },

		    /**
			 * Retrieve XML config files
			 * @param token
			 * @private
			 */

			_unzipTempConfFiles: function (token, deferred, callback) {

			    var that = this;
			    console.log("resolve local file system URL time :: " + new Date().toUTCString() + " Token :: " + token);
				
			    var name = that.configFile[token].filename;
				
			    var filepath = Windows.Storage.ApplicationData.current.temporaryFolder.path + "\\" + this.tempstateFolderName + "\\" + name.replace("/", "\\\\");
				
			    window.resolveLocalFileSystemURL(filepath, function (fileEntry) {
			        console.log("Found file ");
			        fileEntry.file(function (file) {
			            var reader = new FileReader();

			            reader.onloadend = function (event) {
			                var filename = that.configFile[token].filename.toLocaleUpperCase();
			                that._inMemTilesObject[filename] = reader.result;

			                console.log("TPK Config File Loaded :: " + filename);

			                /*if (filename.indexOf("CONF.CDI", 0) > 0) {
			                    that._configCDIloaded = true;
			                }

			                if (filename.indexOf("CONF.XML", 0) > 0) {
			                    that._configXMLloaded = true;
			                }

			                if (that._configXMLloaded && that._configCDIloaded) {
			                    var metadata = that._parseConfigData();
			                    that.loadTPKConfig(metadata);
			                }*/

			                that.updateProgressBar(token, that.configFile.length - 3);
			                //callback(deferred, token, callback);
			                callback(token, deferred, callback);
			            };

			            reader.onerror = function (event) {
			                console.error("File could not be read! Code " + event.target.error.message);
			            };

			            reader.readAsText(file);

			        }, function (err) {
			            console.log("Error in getting file " + that.configFile[token].filename);
			        });
			    }, function (err) {
			        console.log("Error in getting file entry " + that.configFile[token].filename);
			    });
			},

			_parseConfigData: function () {

				var x2js = new O.esri.TPK.X2JS();
				var m_conf = this._inMemTilesObject[this.TILE_PATH + "CONF.XML"];
				var m_conf_i = this._inMemTilesObject[this.TILE_PATH + "CONF.CDI"];

				var jsConfText = x2js.xml_str2json(m_conf);
				var jsConfiText = x2js.xml_str2json(m_conf_i);

				var cacheInfo = jsConfText.CacheInfo;

				var metadata = {};

				this.tileFormat = cacheInfo.TileImageInfo.CacheTileFormat;

				metadata.spatialReference = {
					"wkid" : parseInt(cacheInfo.TileCacheInfo.SpatialReference.WKID) ,
					"latestWkid" : parseInt(cacheInfo.TileCacheInfo.SpatialReference.WKID)
				};

				var lods = cacheInfo.TileCacheInfo.LODInfos.LODInfo;
				var finalLods = [];
				for (var i = 0; i < lods.length; i++) {
					finalLods.push({
						"level": parseFloat(lods[i].LevelID),
						"resolution": parseFloat(lods[i].Resolution),
						"scale": parseFloat(lods[i].Scale)});
				}

				metadata.tileInfo = {
					rows : parseInt(cacheInfo.TileCacheInfo.TileRows),
					cols : parseInt(cacheInfo.TileCacheInfo.TileCols),
					dpi : parseInt(cacheInfo.TileCacheInfo.DPI),
					format : cacheInfo.TileImageInfo.CacheTileFormat,
					compressionQuality : parseInt(cacheInfo.TileImageInfo.CompressionQuality),
					spatialReference : {
						 "wkid" : parseInt(cacheInfo.TileCacheInfo.SpatialReference.WKID) ,
						 "latestWkid" : parseInt(cacheInfo.TileCacheInfo.SpatialReference.WKID)
					},
					lods : finalLods
				};

				var envelopeInfo = jsConfiText.EnvelopeN;
				var xmin = parseFloat(envelopeInfo.XMin);
				var ymin = parseFloat(envelopeInfo.YMin);
				var xmax = parseFloat(envelopeInfo.XMax);
				var ymax = parseFloat(envelopeInfo.YMax);

				metadata.initialExtent = {
					"xmin": xmin,
					"ymin": ymin,
					"xmax": xmax,
					"ymax": ymax,
					spatialReference : {
						"wkid" : parseInt(envelopeInfo.SpatialReference.WKID) ,
						"latestWkid" : parseInt(envelopeInfo.SpatialReference.LatestWKID)
					}
				};

				metadata.fullExtent = {
					"xmin": xmin,
					"ymin": ymin,
					"xmax": xmax,
					"ymax": ymax,
					spatialReference : {
						"wkid" : parseInt(envelopeInfo.SpatialReference.WKID) ,
						"latestWkid" : parseInt(envelopeInfo.SpatialReference.LatestWKID)
					}
				};

				return metadata;
			},

		    /**
			 * Retrieve binary tile files as ArrayBuffers
			 * @param token
			 * @private
			 */
			_unzipTileTempFiles: function (token, deferred, callback) {
				
			    var that = this;
			    console.log("resolve local file system URL time :: " + new Date().toUTCString() + " Token :: " + token);
				
			    var name = that.configFile[token].filename;
				
			    var filepath = Windows.Storage.ApplicationData.current.temporaryFolder.path + "\\" + this.tempstateFolderName + "\\" + name.replace("/", "\\\\");

			    window.resolveLocalFileSystemURL( filepath , function (fileEntry) {
			        console.log("Found file ");
			        fileEntry.file(function(file) {
			            var reader = new FileReader();
						
			            reader.onloadend = function (event) {
			                var filename = that.configFile[token].filename.toLocaleUpperCase();
			                that._inMemTilesObject[filename] = reader.result;
			                that._tpkLoadedRecordCount = that._tpkLoadedRecordCount + 1;
			                console.log("TPK to be loaded count - zip entries decompressed and processed :: " + that._tpkLoadedRecordCount);
			                console.log("TPK to be loaded count - zip entries decompressed :: " + that._tpkToBeLoadedRecordCount);
			                that.updateProgressBar(token, that.configFile.length  - 3);

		/*	                if (that._tpkToBeLoadedRecordCount === that._tpkLoadedRecordCount) {
			                    console.log("Completed decompression");
			                    that.hideProgressBar();
			                    callback(deferred, token);
			                } else {
			                    var nextToken = token + 1;
			                    console.log("Next tile package token " + nextToken);
			                    that._unzipTileTempFiles(nextToken, deferred, callback);
			                } */
			                callback(token, deferred, callback);
			            };
						
			            reader.onerror = function (event) {
			                console.error("File could not be read! Code " + event.target.error.message);
			            };

			            reader.readAsArrayBuffer(file);
						
			        }, function(err) {
			            console.log("Error in getting file " + that.configFile[token].filename );
			        });
			    }, function (err) {

			        

			        console.log("Error in getting file entry " + that.configFile[token].filename);
			        deferred.reject();
			        throw "Error in getting file entry " + that.configFile[token].filename;
			        //that.getWinBaseMapTPK(that.target, that.deferred, that.fileNameWithDir).then(function () {
			        //    that.deferred.resolve();
			        //}, function (err) {
			        //    console.log("Error in getting file entry on second attempt "); 

			        //});
			        // Retry if file load failed
			        
			    });
	   
			},


			isTPKLoaded: function () {

			    if (this.isTPKloadingComplete &&  this.loadingTPKFile) {
			        return true;
			    }

			    /*if (this._tpkToBeLoadedRecordCount && this._tpkLoadedRecordCount) {

			        if (this._tpkToBeLoadedRecordCount === this._tpkLoadedRecordCount && this.loadingTPKFile === true) {
			            return true;
			        }
			    }*/
			    return false;
			},

		    /**
			 * Calculate the size of an Object based on whether or not the item is enumerable.
			 * Native Objects don't have a built in size property.
			 * More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
			 * @param obj
			 * @returns {number}
			 * @constructor
			 */

			ObjectSize: function (obj) {
				var size = 0, key;
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						size++;
					}
				}
				return size;
			},

			loadTPKConfig : function  (metadata) {

				var MercatorZoomLevels = {
							0: 156543.033928,
							1: 78271.5169639999,
							2: 39135.7584820001,
							3: 19567.8792409999,
							4: 9783.93962049996,
							5: 4891.96981024998,
							6: 2445.98490512499,
							7: 1222.99245256249,
							8: 611.49622628138,
							9: 305.748113140558,
							10: 152.874056570411,
							11: 76.4370282850732,
							12: 38.2185141425366,
							13: 19.1092570712683,
							14: 9.55462853563415,
							15: 4.77731426794937,
							16: 2.38865713397468,
							17: 1.19432856685505,
							18: .597164283559817,
							19: .298582141647617,
							20: .14929107082381,
							21: .07464553541191,
							22: .0373227677059525,
							23: .0186613838529763
						};

				var sr = metadata.spatialReference.latestWkid || metadata.spatialReference.wkid;
				if (sr === 102100 || sr === 3857) {
					var arcgisLODs = metadata.tileInfo.lods;
					var correctResolutions = MercatorZoomLevels;
					for (var i = 0; i < arcgisLODs.length; i++) {
						var arcgisLOD = arcgisLODs[i];
						for (var ci in correctResolutions) {
							var correctRes = correctResolutions[ci];
							if (this._withinPercentage(arcgisLOD.resolution, correctRes)) {
								this._lodMap[ci] = arcgisLOD.level;
								break;
							}
						}
					}
					//that.fire("lodmap")
				} else {
					warn("L.esri.TiledMapLayer is using a non-mercator spatial reference. Support may be available through Proj4Leaflet http://esri.github.io/esri-leaflet/examples/non-mercator-projection.html")
				}

			},

			_withinPercentage : function  (a, b) {
				var zoomOffsetAllowance = .1;
				var percentage = zoomOffsetAllowance ;
				var diff = Math.abs(a / b - 1);
				return diff < percentage;
			},
			loadMap : function () {
					var that = this;
					var transformSrc = 'EPSG:4326';
					var transformTrg = 'EPSG:3857';

					var providerUrl = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
					var source = new ol.source.XYZ({
						url: providerUrl
					});

					source.tileLoadFunction = function(imageTile, src) {
						//var testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAACvVJREFUeNrsnXtQVNcdxz/7YJdlFwEBBXlEnga1ShRrgCbB1AqatE5im2kz1bQ1zaB51MQkYxob20xM03QS02kTiTZtx9h0YmxJNWbEJmB8hmp8RXwA62PFgrCwwC677IvtHwsrKyAP2QXd851h5t4995577+9zzu+c8zvnXiQulwuhkZNUmEAAEACEBAABQEgAEACE/C95fwckvn+oa/O7wNPALEAjTNerTMAh4E3gEwDd4lnDUgNeAbYBc4TxrytNp422d9psWFzQ/cCLwraD1oudXuOGATwjbDlkPT0cALKEHYesrOEAECrsOGT1azv5aLrbBI2SrGgN34hUMzlCRUyIAnWQDAnQ5nBSZ7Zz2mDmZJOZIw0mzrW23/rdUH8ob0IYP04fx7yEcABabU6qWiwc07fRbHMAEK6Qk6hRsig5kp/dPh6A0svNbK5s4LOaZgFgKJoWqWb1zATuHB9KY7uD9RW1lF1uoarFQmO7o9dzIpRyUsKCuSc2jB+lRfOXOeF81WDi1SOXOFRvuukASPqbkEl8/5BPZmyemBrL83fEY3Z08OqRS2zV6jE7OgaVh1ImZVFyJC/MiCdMIeftk7X87mjNqDKwbvEsyairAUV3p7Lgtgg+Pt/IS4d0NFsdQ8rH6uzgg6oGtl1oYvXMBB6fGsuUsSE88nklN8s8n99jQZu/nc6C2yJYc0jHU/vODdn4XuN/u5NVX17guYPnyZsQxtb8DCQCQE+ty03i7glhPLXvHH89c2XY8/+wWs/SsipmjdPw7j2pAkB3PZwWzaLkKF7670U+Pt/os+v8p6aZZw+cpyAxgmVTYgUAgDi1gtfunMinFw387Wy9z6+3Ratni1bPCzPiSQ1TCQC/ykoEYOWBc357sF+WX8Ds6OCVbyYGNoBJ4SoWJEbw2tEa2gbZzbwR2ZwuXj6sIydmDDOjNYEL4OG0aFzAJh+4nj/npfHHu1L6dkXVeox2J49MGheYAIJlUh5MjmSrVo/J7hzWvF+dfRsxIUEkhSp5KzcZTZCsxzEOl4utWj35CRG9pt/yAKZGhhCmkLPr0vDGal7Pnsi0SLVnPzJYjkzSe89/p86ASi7ljih14AGY3mmks83mYcvzjZwkJkeEePa1re0s/rySFlvvA7qzzRaszo5R2w74FEBamIrLbTZqTLbrHqeWSxmr7D8qsi43iUnhV7uV1S3t/GLf9XtWTVYHl0xW0sNVgQdgUrgKncmK4zoBP6kE3puTRvH8jOv66Tdzkkjr1qc/b7SyYv/AurV1ZjtRwUGBByBBo8TQ3nesRyWXsunedDRBMow2p2e7N7fTvQSfa23nyb3aAd9Hm8NJsEwaeACMNifB8r4v0eGCypars1oKmYTNc9O93NEfvpXs5XbONlt4at/gBnRyiQTnKH0PwqcAzrZYiFMr+ky3Ojt4+bCOT3UGL2Oty3Ub/dezEkkZE+xJO22wsPLA+UHfR5QqiBabM/AAVLdYSNQoiQy+fgP7zsladlw0eHUr38hJIqtbz+WUwcxzBwdvfJVcSrxayUVje+ABONlkRiWXktytFPel9RXeELrrTLOF5w9eGNI9xKndBeB4Y1vgATiudz90VvTAVrasr6hl+4Umr99OGyw8OwS306WcGPe1v2owBR6AWrONA3Wt/DAtasDnvHuqjm2dEM40W4bkdrrroZQovm5s46LRGngAADZV1pMUGkxOzJgBn7PhVB3vnKy9oZIPMHVsCNMi1XxQ3cBolc8B7LrUzOU2G6tnJgzqvO49o6Fq9cwEjHYn/9Q2Bi4AR4eL3xzWMXVsCA8mR/rtwfITIsiJGcPLh3W0OzsCFwC4I5Kll1t4KzeZeI3S59eLVgWxMS+VrxpMfFitZzTLb+PzJ/dqMdmdbJ+fwRiF72LzSpmUfxdk4HS5eOyLaka7/AbAaHfy/ZIzRAYHUXL/VKJVwx8cCw2SsWPBZOI1Sgo+qaDBYhcAuuuUwcwDO08Tp1Zw8IHp5A6iZ9SfZkRp2P/ANNLDVfxg1xnONltYOHGsX1zeTQOga0A0Z9vXNLTb+cd3JrEmK3FAcwF9KUwh54UZ8Xw8PwMXUPBJBeVXjPx29kR+PjmGv89NJ3EUQxiRGK22pZ27ik/wfmU9SzPGU75oOs9mxg1q0iRlTDArpk3gy0XTWTYllq1aPTn/Os4pgxmZREJurLt2GW1OYrsFBB/NGN/n9OVIaMRWR3cpM0rNsimxzE+McIcvGts4VG/ibLOZGpMNY+dkviZIRpxawaRwFTOjNZ4pxs9qmnn7ZG2PUENOzBiemT6Bz2qaKaqoA+D32UlkRLgniZbv0frFwP2tjh5xAF1KC1MxNz6cufHhpIcHE6bo3S212pxUt1oou9xCic7AmWbLgPLvMr5UIqHD5eKC0coTe7UCQG+KUMqJ1ygZpwoitPMVJaPdSb3FTo3JStMgV1S/dudEpo4NQQJ0gGfl9HmjdVAza74AMKreEeuSwerAMAzL1sMUcl7PnkicWoEEcHU2el0lKilUyZ/uSvFLTRhVjbDfHk4C4zrHG45u9bh7kZwYquSdu1MEAF/VpId2neGKxY5M4i75rmsguIBEjZL1IwThlv9air3DxdKyKuotdncbcE1N6HJNCRolG0bgpY6A+VzN0rIqrljsSCXgdHnXhC4IE9QKv79ZEzAAXMCjZVXUmd0QrnVHXRDi1Ao25qUKAD6DsLuK/7XZPAbvDUJsiIKie1KJCVEIAL7QY19UU2OyeTXE3SE4XC7i1Qp+evs4AcBXKtxT7Vk07LrmTy6RoDNZee/0FQHA1xB0JqvH9XS43DWgxmRj+R4t9X6YTwj4j/Yt36PlotENQSqBSyYrhXv8N5MmvpoIPL5Xi77djsHqYNke/4Yl5ML8bv2ktEqMhANRAoAAIAAICQCBq357QRmbVwsr3YgWl4gaIFyQkABw07YBvlZJSe8+srCwkKKiol7TXC4XWq2WjRs3cuzYMdavX09ycrLXMatWreLo0aMAqFQqtmzZgkLhHd/Pz88XNWAokkgkpKamsnbtWmJiYno9Zs6cOZ7tnJycHsYXLqhTxcXFlJeXe/aPHDlCcXExra2tfabV1ta6q69cTm5uLqWlpezYscMr39zcXORyeQ8YAOXl5RQXFwsXBFBUVEROTg6zZ88GoKysjF27dl03LSYmhthY9xcRpVIpH330ERqNhvvuu8+Tr0ajISsri4qKCmbMmOF1zZ07d3LgwAEBYLCKjo4mJSUFtVrtVSv6Ul5eHpGRkchkslH7TDcVgCVLlrBkyRIAzGYzGzZsQKvtGb/X6/VERUWRnZ1NfHy812+iDfCDjh8/jsFgIDg4mLS0NI/7Eo3wDWrTpk0sX76cEydOEBISwooVK0hJ6bmksKOjg927d3v2tVotOp1OALhRNTQ0oNVqaWu7+uGNaxvYLpWWlnq2R2vpHxVtwLx580hNvboSbcqUKQAcPHiQ7OzsXtOio6O9Snt2dnYP/15ZWUlNTQ1xcXGUlZV5gcrMzESj0Xh6WwENYOXKlV77BQUFFBQUUFhY2GdalxwOB/v372fNmjU9RsJdtSAzMxO93vtl7YULFwLcNACMjLL/pNQ9FFFXV9fncaWlpTQ1NY3krfb7jZx+X1HKz88vxf3v+YQGr7KSkpJ7b7QRXifsOGT1a7uBANgOrBW2HLTWdtpuWLqhq4GFQBnQJmzbp9o6bfS9Tpv1q37bACExEBMAhAQAAUBIABAAhASAW07/HwBU5PErBBUD5gAAAABJRU5ErkJggg==';
						//var testData = "data:image/png;base64,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";
						//imageTile.getImage().src = src;
						var tilePoint = {} ;
						tilePoint.z = imageTile.tileCoord[0];
						tilePoint.x = imageTile.tileCoord[1];
						tilePoint.y = (imageTile.tileCoord[2] + 1) * -1 ;
						imageTile.getImage().src  = that.getTileUrl(tilePoint);
					};

					//this.map = "";

					new ol.Map({
						layers: [
							 new ol.layer.Tile({
								source: source
							})
						],
						target: this.target_id,
						view: new ol.View({
							center: ol.proj.transform([-115.1522,36.0800], 'EPSG:4326', 'EPSG:3857'),
							//center: ol.proj.transform([0,0], 'EPSG:4326', 'EPSG:3857'),
							zoom: 12,
							maxZoom: 19
						})
					});
			},

			/**
			 * Overrides getTileUrl method
			 * @param level
			 * @param row
			 * @param col
			 * @returns {string}
			 */

			getTileUrl: function (tilePoint){

				var level,row,col;
				level = tilePoint.z;
				row = tilePoint.y;
				col = tilePoint.x;

				var layersDir = this.TILE_PATH + "_alllayers";
				var url = this._getCacheFilePath(layersDir,level,row,col);

				if(this._inMemTilesObject != {}) {
					/* temporary URL returned immediately, as we haven't retrieved the image from the indexeddb yet */
					var tileid = "void:/" + level + "/" + row + "/" + col;
					var result = this._getInMemTiles(layersDir, level, row, col);

					var imgURL;

					if (result) {
						console.log("found tile offline", url);
						var png =  "data:image/png;base64,";
						switch(this.tileFormat) {
							case this.tileFormat:
								imgURL = "data:image/jpg;base64," + result;
								break;
							case "PNG":
								imgURL = png + result;
								break;
							case "PNG8":
								imgURL = png + result;
								break;
							case "PNG24":
								imgURL = png + result;
								break;
							case "PNG32":
								imgURL = png + result;
								break;
							default:
								imgURL = "data:image/jpg;base64," + result;
						}
					}
					else {
						console.log("tile is not in the offline store", url);
						imgURL = "data:image/png;base64,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pmk0TROPj48Hn3l4eIimaSJN06O3A4NJwDMxm82ibdtXo4D5fB6r1Sp+//4dz8/Pw5H+6ekpdrtdJEkS8/n8S/9f713ie3vaceo9x557QAB451Sgfyin34HKshweunk5HzAej2MymXz5+f9nbjJyI9L39Wu5XP55+XQZ39uxR4Z3u90wSXjqEV0wAjhjx47oaZq63Me/ZhIQBAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEAAbAJQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAQAAAAQAEABAAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEABAAAABAAQAEAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEABAAQAEAAAAEAvqe/BwCeKjUweoA8pQAAAABJRU5ErkJggg==";
					}

					return imgURL;
				}
			},

			_getInMemTiles: function (layersDir,level,row,col){

				var snappedRow = Math.floor(row / 128) * 128;
				var snappedCol = Math.floor(col / 128) * 128;

				var path = this._getCacheFilePath(layersDir, level, snappedRow, snappedCol).toLocaleUpperCase();


				var offset;
				var bundleIndex = path + ".BUNDLE";
				var bufferI = this._inMemTilesObject[bundleIndex];
				var bufferX = this._inMemTilesObject[path + ".BUNDLX"];

				if(bufferI !== undefined || bufferX !== undefined) {
					offset = this._getOffset(level, row, col, snappedRow, snappedCol);
					var pointer = this._getPointer(bufferX, offset);

					return this._buffer2Base64(bufferI,pointer);
				}
				else{
					console.log("_getInMemTiles Error: Invalid values");
				}
			},


			/**
			 * Returns a pointer for reading a BUNDLE binary file as based on the given offset.
			 * @param buffer
			 * @param offset
			 * @returns {Uint8}
			 * @private
			 */
			_getPointer : function (/* ArrayBuffer */ buffer,offset){
				var snip = buffer.slice(offset);
				var dv =  new DataView(snip,0,5);

				var nume1 = dv.getUint8(0,true);
				var nume2 = dv.getUint8(1,true);
				var nume3 = dv.getUint8(2,true);
				var nume4 = dv.getUint8(3,true);
				var nume5 = dv.getUint8(4,true);

				var value = nume5;
				value = value * 256 + nume4;
				value = value * 256 + nume3;
				value = value * 256 + nume2;
				value = value * 256 + nume1;

				return value;
			},

			/**
			 * Convert an ArrayBuffer to base64. My testing shows this to be
			 * much faster than combining Blobs and btoa().
			 * ALL CREDITS: https://gist.github.com/jonleighton/958841
			 * NO licensing listed at the gist repo.
			 * @param arrayBuffer
			 * @returns {string}
			 * @private
			 */
			_base64ArrayBuffer :function  (arrayBuffer) {
				var base64    = "";
				var encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

				var bytes         = new Uint8Array(arrayBuffer);
				var byteLength    = bytes.byteLength;
				var byteRemainder = byteLength % 3;
				var mainLength    = byteLength - byteRemainder;

				var a, b, c, d;
				var chunk;

				/*jslint bitwise: true */

				// Main loop deals with bytes in chunks of 3
				for (var i = 0; i < mainLength; i = i + 3) {
					// Combine the three bytes into a single integer
					chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

					// Use bitmasks to extract 6-bit segments from the triplet
					a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
					b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
					c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
					d = chunk & 63;               // 63       = 2^6 - 1

					// Convert the raw binary segments to the appropriate ASCII encoding
					base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
				}

				// Deal with the remaining bytes and padding
				if (byteRemainder == 1) {
					chunk = bytes[mainLength];

					a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

					// Set the 4 least significant bits to zero
					b = (chunk & 3)   << 4; // 3   = 2^2 - 1

					base64 += encodings[a] + encodings[b] + "==";
				} else if (byteRemainder == 2) {
					chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

					a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
					b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

					// Set the 2 least significant bits to zero
					c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

					base64 += encodings[a] + encodings[b] + encodings[c] + "=";
				}

				/*jslint bitwise: false */

				return base64;
			},

			/**
			 * Given a ArrayBuffer and a position it will return a Base64 tile image
			 * @param arrayBuffer
			 * @param position
			 * @returns {string}
			 * @private
			 */

			_buffer2Base64 : function (/* ArrayBuffer */arrayBuffer,/* int */ position){
				var view = new DataView(arrayBuffer,position);
				var chunk = view.getInt32(0,true);
				var buffer = view.buffer.slice(position + 4,position + 4 + chunk);
				return this._base64ArrayBuffer(buffer);
			},

			/**
			 * Converts an integer to hex
			 * @param value
			 * @returns {string}
			 * @private
			 */

			_int2HexString : function (/* int */ value){
				var text = value.toString(16).toUpperCase();
				if (text.length === 1)
				{
					return "000" + text;
				}
				if (text.length === 2)
				{
					return "00" + text;
				}
				if (text.length === 3)
				{
					return "0" + text;
				}
				return text.substr(0, text.length);
			},

			/**
			 * Determines where to start reading a BUNDLEX binary file
			 * @param level
			 * @param row
			 * @param col
			 * @param startRow
			 * @param startCol
			 * @returns {number}
			 * @private
			 */

			_getOffset : function (/* int */level, /* number */row,/* number */col, /* number */startRow, /* number */ startCol){
				var recordNumber = 128 * (col - startCol) + (row - startRow);
				return 16 + recordNumber * 5;
			},

			/**
			 * Returns a hexadecimal representation of a cache file path
			 * @param layerDir
			 * @param level
			 * @param row
			 * @param col
			 * @returns {string}
			 * @private
			 */

			_getCacheFilePath : function  (/* String */ layerDir, /* int */level, /* int */row, /* int */ col){
				var arr = [];

				arr.push(layerDir);
				arr.push("/");
				arr.push("L");
				arr.push(level < 10 ? "0" + level : level);
				arr.push("/");
				arr.push("R");
				arr.push(this._int2HexString(row));
				arr.push("C");
				arr.push(this._int2HexString(col));

				return arr.join("");
			},

			/**
			 * Returns database size in MBs.
			 * @returns {string}
			 * @private
			 */

			_bytes2MBs : function (bytes){
				return (bytes >>> 20 ) + '.' + ( bytes & (2*0x3FF ) ); // jshint ignore:line
			}
			
			
			
      };
});
