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

define("platform/ui/util/WorkOfflineMapManager",
      [
       "platform/model/ModelService",
       "dojo/promise/all",
       "dojo/Deferred",
       "dojo/_base/array",
       "dojo/topic"
       ],
function(ModelService, all, Deferred, array, topic) {

   var workOfflineMaps  = {};

   return {


/**@memberOf platform.ui.util.WorkOfflineMapManager */
    _getResourceListeners: function (resourceName){
      if (resourceName){
      return workOfflineMaps[resourceName];
      }
    },
      
    registerWorkOfflineMap : function(offLineMap, resourceName) {
       var resourceListeners = this._getResourceListeners(resourceName);
       
        if (resourceListeners){
          resourceListeners.push(offLineMap);
        }
        else{
          var maps = new Array();
          maps.push(offLineMap);
          workOfflineMaps[resourceName] = maps;
        }
      },


      notifyMapsToLoadData : function(resourceData, resourceName, progressResource){
        var deferred = new Deferred();
        var resourceListeners = this._getResourceListeners(resourceName);

        if (resourceListeners && WL.Client.getEnvironment() != WL.Environment.WINDOWS8 ){
          var promises = [];
          
            array.forEach(resourceListeners, function(map) {
              var mapDeferred = new Deferred();
              promises.push(mapDeferred);
              map.loadOfflineData(resourceData, progressResource,mapDeferred);
            });
            all(promises).
            then(function(message){
            	//if we have more than one result and all were resolved well, we need to show only one message
            	if(Array.isArray(message)){
            		deferred.resolve(message[0]);
            	}
            	else{
            		deferred.resolve(message);
            	}
            }).
            otherwise(function(errors){
              deferred.reject(errors.toString());
            });
          
          return deferred.promise;
        }
        else{
          setTimeout(function(){
            deferred.resolve();
          }, 10);     
        }
      return deferred.promise;
      },
   };
});
