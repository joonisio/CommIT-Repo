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

define("platform/handlers/spatial/IdentifyToolHandler", 
		[ "dojo/_base/declare",
		  "dojo/promise/all",
		  "platform/model/ModelService", 
          "platform/store/_ResourceMetadataContext",
		  "platform/model/ModelData",
		  "platform/model/ModelDataSet",
		  "platform/handlers/_ApplicationHandlerBase",
          "platform/translation/SynonymDomain",
 	      "platform/comm/CommunicationManager",
		  "platform/auth/UserManager",
		  "platform/translation/MessageService",
		  "dojo/_base/lang",
		  "platform/exception/PlatformRuntimeException",
		  "platform/warning/PlatformRuntimeWarning",
		  "platform/util/PlatformConstants",
		  "platform/logging/Logger",
		  "platform/map/MapGeoLocation",
		  "platform/map/spatial/MobileMaximoSpatial",
		  "platform/map/spatial/store/MaximoSpatialStore",
		  "platform/map/MapProperties",
		  "dojo/_base/array","dojo/promise/all", "dojo/Deferred",
		  "dojo/date/locale"], 
  function(declare, all, ModelService, ResourceMetaData, ModelData, ModelDataSet, ApplicationHandlerBase, SynonymDomain, CommunicationManager,
		  UserManager, MessageService, lang, PlatformRuntimeException,
PlatformRuntimeWarning, PlatformConstants, Logger, MapGeoLocation, MobileMaximoSpatial, 
MaximoSpatialStore, MapProperties, array, all, Deferred, locale) {
	return declare(ApplicationHandlerBase, {
		
		userAuthenticationManager: null,
		
		constructor : function ( options ) {
			require( [
						"platform/auth/UserAuthenticationManager"
					], dojo.hitch( this, function ( authManager ) {
						this.userAuthenticationManager = authManager;
					} ) );
		},
		
		/**
		 * Handler to show/hide the menu to Update the WO asset from the identify dialog.
		 * It uses the same logic used in the WO detail view - WODetailHandler -initAssetField
		 * @param eventContext
		 */
		showUpdateWOAssetOption: function(eventContext) {
			var showOption = WL.application["application.handlers.WODetailHandler"].hasPermissionToEditAsset(eventContext);
			eventContext.setDisplay(showOption);
		},
		
		/**
		 * Handler to update the WO asset
		 * @param eventContext
		 */
		updateWOAsset: function(eventContext) {
			eventContext.application.showBusy();
			var workOrderSet = WL.application.getResource("workOrder");
			var mobileMaximoSpatial = workOrderSet.mobileMaximoSpatial;
			var featureResource = eventContext.application.getResource("featureAttributes");
			var actualWorkOrder = workOrderSet.getCurrentRecord();
			var feature = featureResource.feature;
			var attributes = feature.attributesFieldsName;
			
			//Online map
			if (mobileMaximoSpatial.showingOnlineMap) {
				var currentUserSite = this.userAuthenticationManager.currentUserSite;
				var securityMeta = ResourceMetaData.getResourceMetadata( "PLUSSLINKEDMBO" );
				securityMeta._fieldMap['attname'] = {};
				securityMeta._fieldMap['attname'].local = true;
				filter = {'identifier' : ''};
				var attributesStr = JSON.stringify(attributes);
				var mapName = mobileMaximoSpatial.mapManager.identifier;
				
				var params = { "attributes": attributesStr, "mapName": mapName };
				console.log("parameter  attributes" + attributesStr);
				console.log("parameter  mapName" + mapName);
				
				var promise = ModelService.filtered('PLUSSLINKEDMBO', null, filter, 1000, false, false, params, false);
				promise.then(lang.hitch(this, function(result){
					var data = result.data;
					if (data != null) {
						var linkedMbo = data[0];
						var identifier = linkedMbo.identifier;
						if (identifier == null) {
							eventContext.application.hideBusy();
							WL.application.showMessage(MessageService.createStaticMessage("featureIsNotLinked").getMessage());
						} else {
							var jsonMbo = JSON.parse(linkedMbo.jsonmbo);
							
							// If the asset and its location are not in the device, it is necessary to add.
							this.addMboToLocationStore( eventContext, jsonMbo );
							this.addMboToAssetStore( eventContext, jsonMbo, identifier );
							
							var attrValue = jsonMbo[identifier];
							
							actualWorkOrder.set("asset", attrValue);
							try{
								WL.application["application.handlers.WODetailHandler"].validateAsset(eventContext);
								ModelService.save(workOrderSet).then(lang.hitch(this, function() {
									eventContext.application.hideBusy();
								}));
								
							} catch(e) {
								eventContext.application.hideBusy();
								WL.application.showMessage(e.message);
							}
						}
					}
					
				}));
			} else {
				//Map is offline
				var fieldName = this.getLinkFieldName();
				if (fieldName in attributes) {
					var attrValue = attributes[fieldName];
					if (attrValue != null && attrValue != "") {
						actualWorkOrder.set("asset", attrValue);
						ModelService.save(workOrderSet).then(lang.hitch(this, function() {
							eventContext.ui.show('WorkExecution.WorkDetailView');
						}));						
					} else {
						//Feature is not linked
						WL.application.showMessage(MessageService.createStaticMessage("featureIsNotLinked").getMessage());
					}
				} else {
					//Link field does not exist in the feature
					var errorMessage = MessageService.createResolvedMessage("featureDoesNotHaveLinkAttr", [fieldName]);
					WL.application.showMessage(errorMessage);
				}
				
				
			}
			
			
			
			
		},
		
		getLinkFieldName: function() {
			return MapProperties.getProperty('si.map.esri.linkFieldName');
		},
		
		/**
		 * Method to add the Mbo JSON to the Asset resource, if it does not exist
		 * @param eventContext
		 * @param jsonMbo
		 * @param identifier
		 */
		addMboToAssetStore: function(eventContext, jsonMbo, identifier) {			
			var additionalasset = WL.application.getResource("additionalasset");
			//Retrieves asset using location and site.
			var assetSet = additionalasset.find('assetnum == $1 && siteid == $3', jsonMbo[identifier], jsonMbo['siteid']);
			if(assetSet.length == 0){
				var newRecord = additionalasset.createNewRecord();
				
				for (var key in jsonMbo) {
				    if (!jsonMbo.hasOwnProperty(key)) continue;

				    var obj = jsonMbo[key];
				    newRecord.set(key, obj);
				}
			}
			
		},
		
		/**
		 * Method to add the Mbo JSON to the Location resource, if it does not exist
		 * @param eventContext
		 * @param jsonMbo
		 */
		addMboToLocationStore: function(eventContext, jsonMbo) {
			var jsonLocation = jsonMbo.jsonLocation;
			if (jsonLocation) {
				var additionallocations = WL.application.getResource("additionallocations");
				var locationSet = additionallocations.find('location == $1', jsonLocation.location);
				if(locationSet.length == 0){
					var newRecord = additionallocations.createNewRecord();

					for (var key in jsonLocation) {
					    if (!jsonMbo.hasOwnProperty(key)) continue;

					    var obj = jsonLocation[key];
					    newRecord.set(key, obj);
					}

					delete jsonMbo.jsonLocation;
				}
			}			
		},
		
		changeFeatureSelected: function(eventContext) {
			var featureList = eventContext.application.getResource("identifyFeatureList");
			var listItem = featureList.getCurrentRecord();
			eventContext.application.ui.returnToView(this.searchForMapViewId(eventContext));
			featureList.updateFeature(listItem.feature);
		},
		
		searchForMapViewId: function(eventContext) {
			var viewIdReturn = "WorkExecution.MapView";
			var viewHistory = eventContext.application.ui.viewHistory;
			for ( var iView = Number(viewHistory.length)-1; iView >= 0; iView-- ) {
				var view = viewHistory[ iView ];
				var viewId = view.id;
				if (viewId.indexOf("MapView") > -1) {
					viewIdReturn = viewId;
				}
			}
			return viewIdReturn;
			
		}
					
	});
});
