/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2013 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

/**
 * 
 */
define("platform/ui/control/Map",
		[ "dojo/_base/declare",
		  "platform/ui/control/_ControlBase",
		  "dijit/layout/ContentPane",
		  "platform/map/MapFactoryHelper",
          "platform/translation/MessageService", 
		  "dojo/when",
	      "dojo/dom-class",
	      "dojo/dom-geometry",
	      "dojo/dom-style",
	      "dojo/dom-attr",
	      "dojo/on",
	      "dojo/_base/lang",
	      "dojo/_base/unload",
	      "dojo/query",
	      "platform/map/OnMapEventListener",
		  "platform/map/MapGeoLocation",
		  "platform/map/MapProperties",
		  "platform/ui/util/OrientationManager",
		  "platform/ui/util/OrientationEventListenerMixin",
	       "dojo/topic",
		  "platform/ui/util/WorkOfflineMapManager",
		  "platform/map/WorkOfflineMapDataLoader",
		  "platform/logging/Logger",
		  "platform/ui/layout/_LayoutWidgetBase",
		  "dojo/dom-construct", 
	      "dojo/dom-class"
], function(declare, ControlBase, ContentPane, MapFactoryHelper, MessageService, when, domClass, domGeometry, domStyle, domAttr, on, lang, unload, query, 
		OnMapEventListener, MapGeoLocation, MapProperties, OrientationManager, OrientationEventListenerMixin, topic, WorkOfflineMapManager, 
		WorkOfflineMapDataLoader, Logger, LayoutWidgetBase, domConstruct, domClass) {
	return declare([ControlBase, OnMapEventListener, OrientationEventListenerMixin],{
			
			markerIndexes : [],
			mapShown : false,
			platformMapMarkerInfo: null,
			isPortrait: null,
			hiddenAsPortrait: false,
			portraitContainerSize: null,
			landscapeContainerSize: null,
			firstBuild: true,
			showListener: null,
			hideListener: null,
	
			//These two variables define if we need to make zoom at selected point in the map
			lastAction: null, 
			isAutoZoom: false,
			showedScaleWarning: false,
			
            //The method setCurrentMarker is frequently called 2 times for each action, this is a 
            //no good behavior and for we mark the old index to use when we open a map and navigate
            //we need to know if the action was completed.
            timesSetCurrentIsCalled: 0,
            
            multipleRecords: true,

			constructor : function(options) {
				this._controlType = 'Map';				
				this.mapOptions = options;
				
				//including current location message on parameters of map (it is used on offline and online maps)
				var myLocationMsg = MessageService.createStaticMessage("currentLocation").getMessage();				
				this.mapOptions['currentLocationMessage'] = myLocationMsg;
				
				if (options){
					this.mapHandlerClass = options['mapHandlerClass'];
				}
				// layerIds must begin with a char
				this.mainLayerId = "_1";
				if (!this.mapHandlerClass){
					this.mapHandlerClass = 'platform.handlers.MapHandler';
				}
				this.eventHandlers = [ {
					event : 'datachange',
					method : 'setCurrentMarker',
					'class' : this.mapHandlerClass
				} ];
				this.pngEncodeStr = 'data:image/png;base64,';
				var mapControl = this;
				unload.addOnUnload(function(){
					mapControl.hideMap();
				});
				var workOfflineResource = options['workOfflineResource'];
				if (workOfflineResource){
					WorkOfflineMapManager.registerWorkOfflineMap(this, workOfflineResource);
				}
				
				//on build time we define all possible environments for map, but
				//on execution time we need choose only one to use
				if(WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD){
					this.localMapUrl = this.iosLocalMapUrl;
					this.mapOptions.localMapUrl = this.iosLocalMapUrl;
	            }
	            else if(WL.Client.getEnvironment() == WL.Environment.ANDROID){
	            	this.localMapUrl = this.androidLocalMapUrl;
	            	this.mapOptions.localMapUrl = this.androidLocalMapUrl;
                }
	            else if(WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS8){
	            	this.localMapUrl = this.windowsLocalMapUrl;	 
	            	this.mapOptions.localMapUrl = this.windowsLocalMapUrl;
                }
				//now we can delete others and just keep this.localMapUrl
				delete this.androidLocalMapUrl;
				delete this.iosLocalMapUrl;
				delete this.windowsLocalMapUrl;
				delete this.mapOptions.androidLocalMapUrl;
				delete this.mapOptions.windowsLocalMapUrl;
				delete this.mapOptions.iosLocalMapUrl;
				
				/*var multiple = this.mapOptions['multipleRecords'];
				if(multiple == false || multiple == "false"){
					this.multipleRecords = false;
				}
				else{
					this.multipleRecords = true;
				}*/
			},

/**@memberOf platform.ui.control.Map */
			build : function() {
				this.mapOptionsHeight = this.mapOptions['height'];
				if (!this.mapOptionsHeight){
					this.mapOptionsHeight = '.75';
				}
				else {
					this.mapOptionsHeight = '.' + this.mapOptionsHeight;
				}
				
				this.platformMapMarkerInfo = this.application.getResource('PlatformMapMarkerInfo').getCurrentRecord();
				this.platformMapMarkerInfo.set('currentMarker', null);
				var viewNode = this.viewControl.baseWidget.domNode;
				domClass.add(viewNode, 'mapview');

				OrientationManager.registerNativeOrientationEventListener(this);
					
				this.baseWidget = this.createWidget(ContentPane, {
					id: this.getId(),
				    content:"<p></p>",
				    style:"width:100%;"
			    });
			    
			    // removing scroll capabilities
			    this.viewControl.baseWidget.onTouchStart = function() { return false; };

				var mapHandler = this.application[this.mapHandlerClass];
				mapHandler.addMapEventListener(this);
				this.showListener = on(this.viewControl.baseWidget, 'AfterTransitionIn', lang.hitch(this,  
						function(moveTo, dir, transition, context, method){
							// calculate the containerSize for both portrait and landscape
							if(this.firstBuild) {
								this._calculateContainerSize();
								this.firstBuild = false;
							}
							mapHandler.showmap(this);
						}
				));

				this.hideListener = on(this.viewControl.baseWidget, 'BeforeTransitionOut', lang.hitch(this,  
						function(moveTo, dir, transition, context, method){
							this.hideMap();
							mapHandler.useCurrentIndex = !this.ui.movingBack;
							//when return back, the next time that map is open all markers needs to 
							//fit on screen, so we need to "clean" our states machine.
							if(this.ui.movingBack){
								this.lastAction = null;
								this.isAutoZoom = false;
							}
						}
				));
				var mapControl = this;
				this.pushSubscription = topic.subscribe('dialogpush', function(published){
					if (mapControl.mapShown){
						mapControl.mapShown = false;
						if (mapControl.abstractMap) {
							mapControl.abstractMap.hideMap();
						}
						mapControl.hiddenAsPortrait = mapControl.isPortrait;
					}
				});
				this.popSubscription = topic.subscribe('dialogpop', function(published){
					if (!mapControl.mapShown && published['count'] == 0){
						if (mapControl.hiddenAsPortrait == mapControl.isPortrait){
							mapControl.mapShown = true;
							if (mapControl.abstractMap) {
								mapControl.abstractMap.showMap();
							}
						}
						else {
							mapControl.showMap(true);
						}
					}
				});
				
				//mapview needs to respond real time when it is on browser
				if(WL.Client.getEnvironment() == WL.Environment.PREVIEW){
					window.onresize = lang.hitch(this, function(){
						this.isPortrait = OrientationManager.isPortrait();
						var myMap = document.querySelector(".MapView_map_column .dijitContentPane");
						if(myMap && myMap.style){
							var mapStyle = myMap.style;
							this._calculateContainerSize();
							if(this.isPortrait){
								mapStyle.width = this.portraitContainerSize.w +"px";
								mapStyle.height =  this.portraitContainerSize.h +"px";
							}
							else{
								mapStyle.width = this.landscapeContainerSize.w +"px";
								mapStyle.height = this.landscapeContainerSize.h +"px";
							}
						}
					});
				}
				return this.inherited(arguments);
			},
			
			setMap : function(map) {
				this.abstractMap = map;
			},
			
			_calculatePortraitContainerSize :  function(headerHeight, mapOptionsHeight, mapViewHeight, screenHeight, screenWidth) {
				var mapWidth = screenWidth;
				var mapHeight = mapViewHeight - headerHeight;
				mapHeight = (mapHeight * parseFloat(mapOptionsHeight)) | 0;
				var containerSize = {'h': mapHeight, 'w' : mapWidth, 't' : headerHeight, 'l' : 0};
				
				// check if map is too big for the screen size
				var mapDetail = query(".dijitContentPane[mapDetails]", this.viewControl.header.domNode.parentElement)[0];
                if(mapDetail) {
                   if(mapDetail.style.display == '') {
                       var mapDetailHeight = domGeometry.position(mapDetail, false).h;
                   }
                   else {
                       // unhide the mapDetails to calculate size
                       mapDetail.style.setProperty('display', '');
                       var mapDetailHeight = domGeometry.position(mapDetail, false).h;
                       
                       // hide mapDetails back
                       mapDetail.style.setProperty('display', 'none');
                   }
                   
                   // size of the mapView and mapDetail and header is bigger then the screenSize
               	   var totalSize = mapDetailHeight + mapViewHeight + headerHeight;
                   if (totalSize > screenHeight) {
                        // resize the map size to fit both the mapView and mapDetails
                        var diff = totalSize - screenHeight;
                        mapHeight = mapViewHeight - diff;
                   
                        containerSize = {'h': mapHeight, 'w' : mapWidth, 't' : headerHeight, 'l' : 0};
                   }
                }
                return containerSize;
			},
			
			_calculateContainerSize : function() {
				var headerHeight = 0;
				var screenHeight = dojo.window.getBox().h;
				var screenWidth = dojo.window.getBox().w;
				var mapViewGeometry = domGeometry.getMarginBox(this.viewControl.baseWidget.domNode, false);
				
				if (this.viewControl.header) {
					var headerGeometry = domGeometry.getMarginBox(this.viewControl.header.domNode, false);
                    var ios7bar = dojo.byId('wl_ios7bar');
                    if (ios7bar) {
                        var ios7barSize = domStyle.get(ios7bar, "height");
                        headerHeight = headerGeometry.h + ios7barSize;
                    }
                    else {
                    	headerHeight = headerGeometry.h;
                    }
				}
				
				// portrait
				if(screenHeight > screenWidth) {
					this.portraitContainerSize = this._calculatePortraitContainerSize(headerHeight, this.mapOptionsHeight, mapViewGeometry.h, screenHeight, screenWidth);
					this.landscapeContainerSize = {'h': (screenWidth - headerHeight), 'w' : (screenHeight / 2), 't' : headerHeight, 'l' : 0};
                }
                else {
                	this.portraitContainerSize = this._calculatePortraitContainerSize(headerHeight, this.mapOptionsHeight, mapViewGeometry.h, screenWidth, screenHeight);
                	this.landscapeContainerSize = {'h': (screenHeight - headerHeight), 'w' : (screenWidth / 2), 't' : headerHeight, 'l' : 0};
                }
			},
			
			adjustHeightInc: 0,  // adjust the size to provide stronger disturbing upon the view
			
			showMap : function(useCurrentIndex) {				
				
				//important to mark the last method to decided on future if we need make zoom at selected point
				this.lastAction = "showMap";
				
				//update the mapOptions from maximo
				this.mapOptions = MapProperties.mergeWithLastPropertiesValues(this.mapOptions);
				
				var provider = this.mapOptions.provider.toLowerCase();
			    if (provider != "mxspatial") {
			    	this.viewControl.overFlowButton.setDisplay(false);
			    }
				
				var providerUrl = this.mapOptions['providerUrl'];

				this.isPortrait = OrientationManager.isPortrait();
				var containerSize = this.isPortrait ? this.portraitContainerSize : this.landscapeContainerSize;
				domStyle.set(this.baseWidget.domNode, 'height',  containerSize.h + "px");
				//force map to get new container width
				domStyle.set(this.baseWidget.domNode, 'width',  containerSize.w + "px");
				var containerGeo = this.baseWidget.domNode;				

				//if (this.mapFactoryHelper && this.abstractMap && !(this.mapOptions.provider.toLowerCase() == "mxspatial")) {
				if (this.mapFactoryHelper && this.abstractMap) {					
					this.abstractMap.setContainer(containerGeo);
					this._setupMap(useCurrentIndex, true);
				}
				else {
					var mapControl = this;
					this.mapFactoryHelper = new MapFactoryHelper(providerUrl, containerGeo, this.mapOptions);
				    when(this.mapFactoryHelper.getMap(), function(map) {
						mapControl.setMap(map);
						mapControl._setupMap(useCurrentIndex, false);
					}, function(message){
						mapControl.platformMapMarkerInfo.set('currentMarker', '');
						if (message){
							domAttr.set(mapControl.baseWidget.domNode, "innerHTML", '<p class="maperror">'+ MessageService.createResolvedMessage(message.messageId, message.parameters) +'</p>');						
						}
					});				
				}
			},
			
			_setupMarkers : function(useCurrentIndex) {
				// at this point we know that all previous layers already been removed and new ones created
				// so we can call gps without any sync problem (layer does not exist, etc). 
				MapGeoLocation.getInstance().sendGeoLocation(this.abstractMap);
				
				var mapControl = this;
				var resource = this.getResource();
				when (this.abstractMap.getResourceIndexesFromMarkers(this.mainLayerId), function(indexArray) {
					var markerIndexArray = new Array();
                    // defect 133700: Cordova result of empty array is "OK" string
                    // this problem only happens if you have no markers on the map
                    if (indexArray && indexArray != "OK") {
						var i = 0;
						while (indexArray[i+""] != null) {
							markerIndexArray.push(indexArray[i+""]);
							i++;
						}
					}
					if (markerIndexArray.length > 0) {
						mapControl.markerIndexes = markerIndexArray;
						var currentIndex = resource.getCurrentIndex();
						var checkIndex = markerIndexArray.indexOf(currentIndex);
						if ((currentIndex != checkIndex && !useCurrentIndex) ||  checkIndex< 0) {
							mapControl.gpsDirections = true;
                      
                            // being the same index force to call watch listener to actually set the current marker
                            if (currentIndex == markerIndexArray[0]) {
                                resource._changeAttrValue('_currentIndex', markerIndexArray[0]);
                            }
                            else {
                                resource.setCurrentIndex(markerIndexArray[0]);
                            }
						}
						//Defect: 159675. When the first record had index 0 we was getting problems and this code fixed it.
						else if(checkIndex >= 0 && (markerIndexArray[0] == currentIndex || markerIndexArray[0] == 0)){
							resource._changeAttrValue('_currentIndex', markerIndexArray[0]);
						}
						else {
							mapControl.gpsDirections = (checkIndex == 0);
							mapControl.setCurrentMarker();
						}
					}
					else {
						mapControl.platformMapMarkerInfo.set('currentMarker', '');
					}
					
					//run the map checker to guarantee that map was built correctly
					setTimeout(function(){
						mapControl._fixMap(mapControl);
					}, 1000);
				});
				//force mapdetail to be shown on screen
				var mapDetail = document.querySelector(".dijitContentPane[mapDetails]");
				if (mapDetail)
					mapDetail.setAttribute('style','block');
			},
                   
           _isGrandPaMapView: function(){
        	   //The story 141180 is about open a map by different location. We need to know now, what
        	   //is the oldIndex used on first map open for reuse when we return to this first map. For ex.: if
        	   //we open a map and select wo 123, we may continuing navigation on links forward, but when we return
        	   //to this view open previouly, we need to know what wo number was used. To validate the use of oldIndex
        	   //we use a flag called canUseOldIndex that was activate when we are on grandpamapview.
               var isGrandPaViewMapView = false;
               
               if(WL.application.ui.viewHistory && WL.application.ui.viewHistory.length && WL.application.ui.viewHistory.length-3 >= 0 &&
            		   WL.application.ui.viewHistory[WL.application.ui.viewHistory.length-3].id){
            	   
            	   var grandpaView = WL.application.ui.getViewFromId(WL.application.ui.viewHistory[WL.application.ui.viewHistory.length-3].id);
                   grandpaView.children.forEach(function(elem, pos, array){
                        if(elem._controlType == "MapDetails"){
                            isGrandPaViewMapView = true;                                                
                            return;
                        }
                    });
               }
               return isGrandPaViewMapView;
           },
            
           _isFromMultipleRecords : function(context){
				var result = false;
               //retrieve previous view to decide if we came from a view with a single record or a view with multiple records.
               //Important: using the actual framework we do not know the context of view, that is, if the actual view comes from a view if a
               //single record or comes from a view if multiples records. The solution here is find a list of resources equals to actual resources.
				if(WL.application.ui.viewHistory.length && WL.application.ui.viewHistory.length - 2 >= 0 && 
						WL.application.ui.viewHistory[WL.application.ui.viewHistory.length-2] &&
							WL.application.ui.viewHistory[WL.application.ui.viewHistory.length-2].id){
					
					var previousView = WL.application.ui.getViewFromId(WL.application.ui.viewHistory[WL.application.ui.viewHistory.length-2].id);
	                
	                previousView.children.forEach(function(elem, pos, array){
	                                              
					  //verify if the view has a list and if this list have the same resource that current view
					  if(elem._controlType == "List" && elem.resource == context.getResource().name){
						  result = true;
						  return;
					  }
	   			    });
				}
               return result;
           },
           
			_setupMap : function(useCurrentIndex, checkTokenMXSpatial) {
				this.abstractMap.showMap();
				this.mapShown = true;
				this.abstractMap.sendMapProperties([MapProperties.getProperties()]);
				var mapControl = this;
				var resource = this.getResource();
				
				//on windows env (online and offline), we get null on screen when formattedaddress value is undefined
				resource.data.forEach(function (currentValue, index, arr) {
					if (!currentValue.formattedaddress) {
						currentValue.formattedaddress = "";
					}
				});
				
				if (resource.count() > 0){
					var that = this;
					var thatResource = resource;
					// clean up the map prior to add a new layer
					this.abstractMap.removeAllLayers(checkTokenMXSpatial)
						.always(function() {							
							if(!that._isFromMultipleRecords(that)){
								that.abstractMap.addLayer(thatResource.data, that.mainLayerId, that.getResource().getCurrentIndex()).then(function() {
                                    mapControl.abstractMap.getAllDirections(mapControl.mainLayerId).then(function(){
                                         mapControl._setupMarkers(useCurrentIndex);
                                     }).otherwise(function(error) {
                                          mapControl._setupMarkers(useCurrentIndex);
                                     });
                              	}).otherwise(function(error) {
                              		that._showMapDetailError(error);
                              	});	       
								
                              	//If we open a map and the grandchild view is a map too, we need to keep
                              	//the old index that was used to came to current view and to indicate
                              	//that this oldIndex can be used, I put this flag on resource.
                                if(that._isGrandPaMapView()){
                                    that.getResource()["canUseOldIndex"] = true;
                                }
	                          }
	                          else{
								that.abstractMap.addLayer(thatResource.data, that.mainLayerId).then(function() {
									// show Toast informing that maybe some markers are missing due to way that data is managed by platform, that is, 
									//only when user navigate to other items (paging) the new data are download causing new locations and new markers put on map. 
									//This toast was put here because it is only necessary on case we have multiple records to show markers.
									if (thatResource.getPageSize() <= thatResource.data.length 
											&& !that.showedScaleWarning) {
										var msg = MessageService.createResolvedMessage('The current map shows the markers for the first {0} records.',[thatResource.data.length]);		
										that.ui.showToastMessage(msg);
										that.showedScaleWarning=true;
									}
									mapControl.abstractMap.getAllDirections(mapControl.mainLayerId).then(function(){
										mapControl._setupMarkers(useCurrentIndex);
									}).otherwise(function(error) {
										mapControl._setupMarkers(useCurrentIndex);
									});
								}).otherwise(function(error) {
									that._showMapDetailError(error);
									//show gps point even when we do not have any markers on screen
									MapGeoLocation.getInstance().sendGeoLocation(that.abstractMap);
                              	});
	                          }
							});						
				}
				else{
					this.platformMapMarkerInfo.set('currentMarker', "");
					this.abstractMap.removeAllLayers();
				}
			},
			
			_showMapDetailError: function(errorMessage){				
				if(errorMessage && errorMessage.messageId && this.viewControl && this.viewControl.header && this.viewControl.header.domNode){
					var mapDetail = query(".dijitContentPane[mapDetails]", this.viewControl.header.domNode.parentElement)[0];
					if (mapDetail) {
						var msg = MessageService.createStaticMessage(errorMessage.messageId).getMessage();
						if(errorMessage.messageId === "noCoordinates"){
							mapDetail.innerHTML = '<p class="mapDetailsNoMarkers">'+ msg+'</p>';
						}
						else{
							mapDetail.innerHTML = '<p class="maperror">'+ msg+'</p>';
						}          		
		          		mapDetail.setAttribute('style','block');
					}
				}
				else{
					Logger.trace("[platform/ui/control/Map]: "+errorMessage);
				}
				
			},
			
			setCurrentMarker : function() {
               var index = this.getResource().getCurrentIndex();
                   
				//We need to identify if the last action interferes at the decision of making zoom at selected point
                //if is the first time that map is showed or we only change the orientation screen, we do not make zoom at selected point
               if(!this._isFromMultipleRecords(this)){
                	this.lastAction = null;
                	this.isAutoZoom = false;
                }
                else if((this.lastAction == null) ||
						(this.lastAction == "onOrientationChanged" && this.isAutoZoom == false)){
					this.isAutoZoom = false;
				}
				else if(this.lastAction != null && this.lastAction != "showMap"){
					if(this.lastAction == "hideMap" && this.isAutoZoom && this.getResource()["oldIndex"] && this.getResource()["oldIndex"] > 0){
						index = this.getResource()["oldIndex"];
						this.getResource()._currentIndex = index;
						this.getResource()["canUseOldIndex"] = true;
					}
					this.isAutoZoom = true;
					this.lastAction = "setCurrentMarker";
				}
				else if(this.lastAction == "showMap"){
					this.lastAction = "setCurrentMarker";
				}	
				else{
					this.isAutoZoom = true;
				}

				//if we open a map with one or more markers, we need to know if we are open this map by first time or just returning to it 
                if(this._isFromMultipleRecords(this)){
                   
                	//if the property canUseOldIndex is true, we know that we are returning to this map and the old map opened was grandpa of it.
                    if(this.getResource()["canUseOldIndex"] && this.getResource()["canUseOldIndex"] == true){
                       this.timesSetCurrentIsCalled++;
                       
                       //the method setCurrentMarker is called to times and just on second time we use the old index.
                       if(this.timesSetCurrentIsCalled == 2){
                           index = this.getResource()["oldIndex"];
                           this.getResource()._currentIndex = index;
                           this.getResource()["canUseOldIndex"] = false;
                           this.timesSetCurrentIsCalled = 0;
                       }                   
                   }
                   else{
                       if(this.lastAction == "setCurrentMarker" && this.isAutoZoom){
                       
							//keep a copy of index to use later (specific to know what is the number of WO open in a "grandchild map view")
                           	this.getResource()["oldIndex"] = index;
                       }
                   }
               }
               
 
               if (this.mapShown && this.abstractMap && this.getResource().getCurrentIndex() >= 0) {
					var mapControl = this;
					this.abstractMap.setMarkerSelected(this.mainLayerId, {'index' : index}, this.isAutoZoom).then( function (markerInfo) {
						var platformMapMarkerInfo = mapControl.platformMapMarkerInfo;
						if (markerInfo && markerInfo.encodedPNG && markerInfo.encodedPNG != '') {
							platformMapMarkerInfo.set('currentMarker', mapControl.pngEncodeStr + markerInfo.encodedPNG);
							platformMapMarkerInfo.set('endMarker', null);
							mapControl._loadDirections();
						}
						else {
							platformMapMarkerInfo.set('currentMarker', "");
							platformMapMarkerInfo.set('endMarker', null);
						}
					});
                }
			},
			
			hideMap : function() {
				//we need to identify last action made. In the case of "view directions" action, the map is hidden (method hideMap) before it be destroyed
				//and when "back button" action is made, destroy method is called before hideMap method.
				if(this.lastAction != null){
					this.lastAction = "hideMap";
				}
				
				if(!this.application || !this.application[this.mapHandlerClass]){
					return;
				}
				
				var mapHandler = this.application[this.mapHandlerClass];
				mapHandler.removeMapEventListener(this);
				if (this.mapShown && this.abstractMap) {
					this.mapShown = false;
    				this.abstractMap.hideMap();
                }
			},
			
			onMapEvent: function(/*JSONObject*/ event) {
				if(event.type == "onMarkerInfo") {
					var resource = this.getResource();
					resource.setCurrentIndex(event.index);
				}
				// only update if the event contains a single directionsLeg
				if(event.type == "onRouting" && event.hasOwnProperty("directionsLeg")) {
					// if it is not the gps to first marker and there is no data on this.platformMapMarkerInfo
					if(event.directionsLeg.originIndex != -1 || !this.platformMapMarkerInfo.get("startMarker")) {
						this._updateDirectionResources(event.directionsLeg);
					}	
				}
				// solving Defect: 163909 (gps directions link is overwritting other directions link)
				else if(event.type == "onGpsRouting" && event.hasOwnProperty("directionsLeg")) {
					if(this.markerIndexes && this.markerIndexes[0] == this.getResource().getCurrentIndex()){
						this._updateDirectionResources(event.directionsLeg);
					}
				}
			},

			_loadDirections : function() {
				var mapControl = this;
				if (this.getResource().getCurrentIndex() < 0){
					return; 
				}
				this.abstractMap.getDirections(this.mainLayerId,{'index' : this.getResource().getCurrentIndex()}).then( function (directionsLeg) {
					mapControl._updateDirectionResources(directionsLeg);
				}).otherwise(function(error){
					Logger.trace("Map.js - error: "+error);
				});
			},

			_updateDirectionResources : function(/*DirectionsLeg*/ directionsLeg) {
				var platformMapMarkerInfo = this.platformMapMarkerInfo;
				var originPNG = directionsLeg.originEncodedPNG;
				if (originPNG && originPNG.length > 0) {
					originPNG = this.pngEncodeStr + originPNG;
				}
				else {
					originPNG = null;
				}
				platformMapMarkerInfo.set('startMarker', originPNG);
				var destPNG = directionsLeg.destinationEncodedPNG;
				if (destPNG && destPNG.length > 0) {
					destPNG = this.pngEncodeStr + destPNG;
				}
				else {
					destPNG = null;
				}
				platformMapMarkerInfo.set('endMarker', destPNG);

				if (directionsLeg.steps) {
					var platformDirectionSteps = this.application.getResource('PlatformDirectionSteps');
					platformDirectionSteps.data = new Array();
			    	for(var i=0; i < directionsLeg.steps.length; i++){
			    		var directionStep = directionsLeg.steps[i];
			    		var rec = platformDirectionSteps.createNewRecord(false);
					    rec.set('step', directionStep.directions);
					}
					platformDirectionSteps.setCurrentIndex(0);
				}
				if (directionsLeg.originIndex < 0) {
					platformMapMarkerInfo.set('startAddress',  MessageService.createStaticMessage('myLocation').getMessage());
				}
				else {
					var startRecord = this.getResource().getRecordAt(directionsLeg.originIndex);
					if (startRecord) {
						platformMapMarkerInfo.set('startAddress', startRecord.get('formattedaddress'));
					}
					else {
						platformMapMarkerInfo.set('startAddress', null);
					}
				}
				platformMapMarkerInfo.set('endAddress', this.getCurrentRecord().get('formattedaddress'));

			},
			
			onOrientationChanged : function(newOrientation) {
				//we need to identify that the last action is an orientation changed because this not 
				//modify the actual zoom of the map
				this.lastAction = "onOrientationChanged";
				
				var prevIsPortrait = this.isPortrait;
				
				this.isPortrait = OrientationManager.isNativePortrait();
	   			if ( prevIsPortrait === this.isPortrait ) {
	 				return;
				}
 				
				if (this.abstractMap && this.mapShown) {
					this.mapShown = false;
					this.abstractMap.hideMap();
					var mapControl = this;
					setTimeout(function(){
						mapControl.showMap(true, true);
				      }, 200);
				}
			},

			destroy : function() {
				//The action of destroy must reset the last action of map only in the case of "hideMap" is not called before.
				//This occurs because in the case of "view directions" action, the map is hidden (method hideMap) before it be destroyed
				//and when "back button" action is made, destroy method is called before hideMap method.
				if(this.lastAction != "hideMap"){
					this.lastAction = null;
				}
				
				if (this.hideListener){
					this.hideListener.remove();
				}
				if (this.showListener){
					this.showListener.remove();
				}
				OrientationManager.unregisterNativeOrientationEventListener(this);
		    	this.hideMap();
		    	if (this.pushSubscription){
		    		this.pushSubscription.remove();
		    	}
		    	if (this.popSubscription){
		    		this.popSubscription.remove();
		    	}
		    	this.inherited(arguments);
		    },
			
			loadOfflineData : function(dataSet, progressResource, deferred){
				var _deferred = deferred;

				progressResource.set('progressMsg', MessageService.createStaticMessage('Downloading map information').getMessage());

				// forcing maptype = esri
				WorkOfflineMapDataLoader.loadMapData("esri", dataSet, this.mapOptions)
					.then(function(msg) {
						if(!msg){
							_deferred.resolve();
						}
						var message = MessageService.createResolvedMessage(
							'{0} route and directions were saved to your device.', 
							// for now we only cache one route/directions
							[1]);
						_deferred.resolve(message);
						progressResource.set('progressMsg', MessageService.createStaticMessage('Downloading map information complete').getMessage());
					})
					.otherwise(function(error) {
						var message = MessageService.createStaticMessage('Unable to save route and directions to your device. If the problem persists, contact your system administrator.').getMessage();
						if (error.messageId){
							message += '  ' + MessageService.createResolvedMessage(error.messageId, error.parameters);
						}
					    _deferred.reject(message);
						progressResource.set('progressMsg', MessageService.createStaticMessage('Downloading map information failed').getMessage());
					});
			},
			
			/*
			 * based on MapView.js, we reconstruct the map when it was built wrong
			 */
			_fixPortraitMap: function(mapControl, currentTable){
				var table = domConstruct.create('table');
	            table.style.width = '100%';
	            domClass.add(table, 'layout MapView ');

	            var row = table.insertRow(-1);
	            row.className  = 'MapView_row_0';

	            var col_map = currentTable.querySelector(".MapView_map_column");
	            row.appendChild(col_map);
	            
	            //fix size problem
	            col_map.getElementsByClassName("dijitContentPane")[0].setAttribute("style","width:"+mapControl.portraitContainerSize.w+"px; height:"+mapControl.portraitContainerSize.h+"px");
	            
	            var row = table.insertRow(-1);
	            row.className  = 'MapView_row_1';

	            var col_mapdetail = currentTable.querySelector(".MapView_mapdetail_column");
	            row.appendChild(col_mapdetail);
	            
	            return table;
			},
			
			/*
			 * based on MapView.js, we reconstruct the map when it was built wrong
			 */
			_fixLandscapeMap: function(mapControl, currentTable){
				var table = domConstruct.create('table');
	            table.style.width = '100%';
	            domClass.add(table, 'layout MapView ');

	            var row = table.insertRow(-1);
	            row.className  = 'MapView_row_0';

	            var col_map = currentTable.querySelector(".MapView_map_column");
	            row.appendChild(col_map);
	            
	            //fix size problem
	            col_map.getElementsByClassName("dijitContentPane")[0].setAttribute("style","width:"+mapControl.landscapeContainerSize.w+"px; height:"+mapControl.landscapeContainerSize.h+"px");
	            
	            var col_mapdetail = currentTable.querySelector(".MapView_mapdetail_column");
	            row.appendChild(col_mapdetail);
	            
	            return table;
			},
			
			/*
			 * There are scenarios where map can be displayed in a wrong way (ex: because race condition on cordova. Defect: 209265)
			 * so, when we identify that map is wrong, we rebuild and resize it.
			 */
			_fixMap : function(mapControl){ 
				mapControl._calculateContainerSize();
				mapControl.isPortrait = OrientationManager.isPortrait();
				var currDiv = document.getElementById(WL.application.ui.getCurrentView().id);
				var allDivs = document.getElementsByClassName('mblView mblScrollableView mapview');
				Array.prototype.forEach.call(allDivs, function( currentDiv ){
					var myBox = dojo.window.getBox();
					if(currDiv == currentDiv){
						currentDiv.setAttribute("style","height:"+myBox.h+"px; display:block");
					}
					else{
						currentDiv.setAttribute("style","display:none");
					}
				});
				
				var divTable = document.getElementById(WL.application.ui.getCurrentView().id);
				if(divTable){
					var mytable = divTable.getElementsByClassName("MapView")[0];
					if(mytable){
						var myRow = mytable.getElementsByClassName("MapView_row_0")[0]
						var needFixSize = false;
						if(myRow){
							if(mapControl.isPortrait){
								needFixSize = 	(myRow.getElementsByClassName("dijitContentPane")[0].style.width != mapControl.portraitContainerSize.w) || 
												(myRow.getElementsByClassName("dijitContentPane")[0].style.height != mapControl.portraitContainerSize.h) 
							}
							else{
								needFixSize = 	(myRow.getElementsByClassName("dijitContentPane")[0].style.width != mapControl.landscapeContainerSize.w) || 
												(myRow.getElementsByClassName("dijitContentPane")[0].style.height != mapControl.landscapeContainerSize.h)
							}	
						}
						
						var myTBody = mytable.firstChild;
						var newTable = null;
						if((needFixSize && mapControl.isPortrait) || 
								(mapControl.isPortrait && mytable.id && mytable.id.indexOf("landscape") >= 0) || 
								(mapControl.isPortrait && myTBody.children.length < 2)){
							newTable = mapControl._fixPortraitMap(mapControl, mytable);
						}
						else if((needFixSize && !mapControl.isPortrait) || 
								(!mapControl.isPortrait && mytable.id && mytable.id.indexOf("portrait") >= 0) || 
								(!mapControl.isPortrait && myTBody.children.length > 1)){
							newTable = mapControl._fixLandscapeMap(mapControl, mytable);
						}
						if(newTable){
							var parent = mytable.parentElement;
							parent.appendChild(newTable);
							//mytable.remove();//does not work on windows env
							parent.removeChild(mytable);
							//update map size
							if(mapControl.abstractMap._map && mapControl.abstractMap._map.updateSize){
								mapControl.abstractMap._map.updateSize();
                            }
						}
					}
				}
			}
	});
});
