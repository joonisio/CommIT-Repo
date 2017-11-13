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
 * createdBy: lcassa@br.ibm.com 
 * 
 * This class is responsible for downloading directions/routes
 */
define("platform/map/WorkOfflineMapDataLoader", 
[ "dojo/_base/declare", 
  "dojo/_base/lang",
  "dojo/Deferred",
  "dojo/when",
  "platform/logging/Logger"], 
function(declare, lang, Deferred, when, Logger) {
	var WorkOfflineMapDataLoader = {
		
/**@memberOf platform.map.WorkOfflineMapDataLoader */
		/*Promise*/ loadMapData: function(/*String*/ mapType, /*JSONArray*/ modelDataSet, /*JSONObject*/ additionalParameters) {
			var deferred = new Deferred();
			var dojoClass = "";

			if(mapType.toLowerCase() == "esri") {
				dojoClass = "platform/map/EsriWorkOfflineDirections";
			}
			else {
				deferred.reject("Unable to find a map of type " + mapType);
				return deferred.promise;
			}

			if(!modelDataSet || !modelDataSet.data) {
				deferred.reject("Provided modelDataSet is corrupted or not the of the right type");
				return deferred.promise;
			}

			
			require(
			[ dojoClass, 
			  "dojo/Deferred",
			  "dojo/when",
			  "platform/logging/Logger",
			  "platform/translation/MessageService", 
			  "platform/map/MapCache",
			  "platform/map/MapProperties"], 
			function(WorkOfflineDirections, Deferred, when, Logger, MessageService, MapCache, MapProperties) {
				var workOfflineDirections = new WorkOfflineDirections();

				 //we need to refresh the additionalParameters with last values from maximo
                additionalParameters = MapProperties.mergeWithLastPropertiesValues(additionalParameters);
                    
                //if we are using online maps (that is, providerUrl has value) it does not make sense try to download routes
                if(additionalParameters.providerUrl){
                	deferred.resolve();
                }
                
                var mapProp = MapProperties.getProperties();
                    
                if (!mapProp["si.map.esri.username"] || !mapProp["si.map.esri.username"].json.propertyValue ||
                    !mapProp["si.map.esri.password"] || !mapProp["si.map.esri.password"].json.propertyValue ||
                    !mapProp["si.map.esri.routeService"] || !mapProp["si.map.esri.routeService"].json.propertyValue) {
                    var message = MessageService.createStaticMessage('Unable to save route and directions to your device. If the problem persists, contact your system administrator.').getMessage();
                    deferred.reject(message);
                }
                else{
                    workOfflineDirections.sendMapProperties([mapProp])
                    .then(function() {
                          workOfflineDirections.getDirectionsToCache(modelDataSet.data, additionalParameters)
                          .then(function(toCache) {
                                var mapCache = new MapCache();
                                mapCache.setCache(toCache)
                                .then(function() {
                                      var message = MessageService.createResolvedMessage(
                                                                                         '{0} route and directions were saved to your device.',
                                                                                         // for now we only cache one route/directions
                                                                                         [1]);
                                      deferred.resolve(message);
                                      })
                                .otherwise(function() {
                                           var message = MessageService.createStaticMessage('Unable to save route and directions to your device. If the problem persists, contact your system administrator.').getMessage();
                                           deferred.reject(message);
                                           });
                                
                                })
                          .otherwise(function() {
                                     var message = MessageService.createStaticMessage('Access to the Esri ArcGIS server is not available. Unable to obtain a route or directions.').getMessage();
                                     deferred.reject(message);
                                     });
                          })
                        .otherwise(function(error) {
                               deferred.reject(error);
                               });
                }
				
			});

			
			return deferred.promise;
		}
	};
	
	return lang.setObject("platform.map.WorkOfflineMapDataLoader", WorkOfflineMapDataLoader);
});
