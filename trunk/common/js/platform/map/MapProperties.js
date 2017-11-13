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
define("platform/map/MapProperties",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "platform/store/SystemProperties",
 "platform/logging/Logger"], 
function(declare, lang, arrayUtil, SystemProperties, Logger) {
	
	var _mapProperties = {};
	
	return {
		
/**@memberOf platform.map.MapProperties */
		getProperty: function(propertyName){
			return SystemProperties.getProperty(propertyName);
		},
		
		getProperties: function(){
			//TODO check type map used
			esriMapProps = [
			   'si.map.esri.authentication.isEnabled',
			   'si.map.esri.username',
			   'si.map.esri.password',
			   'si.map.esri.routeService',
			   'si.map.esri.token',
			   'si.map.esri.tokenService',
			   'si.map.esri.refererService',
			   'si.map.esri.numberOfRequests',
			   'si.map.esri.isGetMethodEnabled',
			   'si.map.directionsPathWidth',
			   'si.map.directionsPathColor',
			   'si.map.openLayers.maxZoom',
               'androidLocalMapUrl',
               'windowsLocalMapUrl',
               'iosLocalMapUrl',
               'provider',
               'providerUrl',
               'si.useGps'
			];
			
			for(var i=0; i<esriMapProps.length; i++){
				var mapPropName = esriMapProps[i];
				var mapProp;
				//if you need to validate your property value, put on this switch-case and construct your own validate method.
				switch(mapPropName){
					case "si.map.directionsPathWidth": 
						mapProp = {mapPropName: mapPropName, propertyValue: this.getDirectionsPathWidth()};
						break;
					case "si.map.directionsPathColor": 
						mapProp = {mapPropName: mapPropName, propertyValue: this.getDirectionsPathColor()};
						break;
					case "si.map.openLayers.maxZoom": 
						mapProp = {mapPropName: mapPropName, propertyValue: this.getMaxZoom()};
						break;
					default:
						mapProp = {mapPropName: mapPropName, propertyValue: SystemProperties.getProperty(mapPropName)};
				}
				_mapProperties[mapPropName] = {json: mapProp};
			}
			
			return _mapProperties;
		},
		
		 mergeWithLastPropertiesValues: function(oldPropertiesValues){
               var mapProps = this.getProperties();
               
               if(!mapProps){
            	   return oldPropertiesValues;
               }
               
               //if we do not have value for property iosMapAccessMethod on maximo, first we verify if
               //there same value defined on app.xml. Otherwise, we assume useDocumentsFolder.
               if(mapProps['iosMapAccessMethod'] && mapProps['iosMapAccessMethod'].json.propertyValue){
                   oldPropertiesValues.iosMapAccessMethod = mapProps['iosMapAccessMethod'].json.propertyValue;
               }
               else if(!oldPropertiesValues.iosMapAccessMethod){
            	   oldPropertiesValues.iosMapAccessMethod = 'useDocumentsFolder';
               }
               
               //Internally, we have only one property to know what is the local of tpk. Instead of use
               //androidlocalmapurl, windowslocalmapurl or ioslocalmapurl, we use only localmapurl (see MapHandler.java).
               if(WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD){
            	   if(mapProps['iosLocalMapUrl'] && mapProps['iosLocalMapUrl'].json.propertyValue){
                       oldPropertiesValues.localMapUrl = mapProps['iosLocalMapUrl'].json.propertyValue;
                   }
               }
               else if(WL.Client.getEnvironment() == WL.Environment.ANDROID){
            	   if(mapProps['androidLocalMapUrl'] && mapProps['androidLocalMapUrl'].json.propertyValue){
                       oldPropertiesValues.localMapUrl = mapProps['androidLocalMapUrl'].json.propertyValue;
                   }
               }
               else if(WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS8){
            	   if(mapProps['windowsLocalMapUrl'] && mapProps['windowsLocalMapUrl'].json.propertyValue){
                       oldPropertiesValues.localMapUrl = mapProps['windowsLocalMapUrl'].json.propertyValue;
                   }
               }
               
               if(mapProps['provider'] && mapProps['provider'].json.propertyValue){
                   oldPropertiesValues.provider = mapProps['provider'].json.propertyValue;
                   
                   // Fix for group level security issue
                   // If provider is updated after merge than providerUrl set based on new value or set blank. 
                   // Otherwise, offline map won't work at group level
                   
                   if (mapProps['providerUrl'] && mapProps['providerUrl'].json.propertyValue) {
                	   oldPropertiesValues.providerUrl = mapProps['providerUrl'].json.propertyValue;   
                   } else {
                	   oldPropertiesValues.providerUrl = null;
                   }
               }
               
               /*if(mapProps['providerUrl'] && mapProps['providerUrl'].json.propertyValue){
                   oldPropertiesValues.providerUrl = mapProps['providerUrl'].json.propertyValue;
               }*/
               
	           return oldPropertiesValues;
	       },
		
		/*String*/ getDirectionsPathWidth: function(){
			var pathWidth = this.getProperty('si.map.directionsPathWidth');
			try{
				if(pathWidth && Number(pathWidth)){
					return pathWidth;
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.map.directionsPathWidth')+" is an invalid value for property 'si.map.directionsPathWidth'");	
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.map.directionsPathWidth' : "+error);
			}
			
			return "0";
		},
		
		/*String*/ getDirectionsPathColor: function(){
			var directionsPathColor = this.getProperty('si.map.directionsPathColor');
			try{
				if(directionsPathColor){
					//remove blank spaces and make upper case
					directionsPathColor = directionsPathColor.trim();
					directionsPathColor = directionsPathColor.toUpperCase();
				}			
				
				if(directionsPathColor && directionsPathColor.length == 9 && directionsPathColor.charAt(0) == "#"){
					//remove #
					directionsPathColor = directionsPathColor(0,directionsPathColor.length-1);
				}
				
				//verify if this is a hex number with 8 positions
				var hexColorPattern = /^[0-9A-F]{8}/;
				if(directionsPathColor && directionsPathColor.length == 8 && hexColorPattern.test(directionsPathColor)){
					return directionsPathColor;
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.map.directionsPathColor')+" is an invalid value for property 'si.map.directionsPathColor'");	
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.map.directionsPathColor' : "+error);
			}
			return "";
		},
		
		/*String*/ getMaxZoom: function(){
			var maxZoom = this.getProperty('si.map.openLayers.maxZoom');
			try{
				if(maxZoom && Number(maxZoom)){
					return maxZoom;
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.map.openLayers.maxZoom')+" is an invalid value for property 'si.map.openLayers.maxZoom'");
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.map.openLayers.maxZoom' : "+error);
			}
			
			return "0";
		},
		
		/*boolean*/ getUseGps: function(){
			var useGps = this.getProperty('si.useGps');
			try{
				if(useGps && Boolean(useGps)){
					return useGps;
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.useGps')+" is an invalid value for property 'si.useGps'");
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.useGps' : "+error);
			}
			
			return false; 
		},
		/*boolean*/ getGPSHighAccuracy: function(){
			var GPSHighAccuracy = this.getProperty('si.GPS.highAccuracy');
			try{
				if(GPSHighAccuracy && Boolean(GPSHighAccuracy)){
					return GPSHighAccuracy;
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.GPS.highAccuracy')+" is an invalid value for property 'si.GPS.highAccuracy'");
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.GPS.highAccuracy' : "+error);
			}
			
			return false; 
		},
		/*Int*/ getGPSTimeout: function(){
			var GPSTimeout = this.getProperty('si.GPS.timeout');
			try{
				if(GPSTimeout && Number(GPSTimeout)){
					return parseInt(GPSTimeout);
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.GPS.timeout')+" is an invalid value for property 'si.GPS.timeout'");
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.GPS.timeout' : "+error);
			}
			
			return 10000; 
		},
		/*Int*/ getGPSMaximumAge: function(){
			var GPSMaximumAge = this.getProperty('si.GPS.maximumAge');
			try{
				if(GPSMaximumAge && Number(GPSMaximumAge)){
					return parseInt(GPSMaximumAge);
				}
				Logger.trace(this._className + " - Value: "+this.getProperty('si.GPS.maximumAge')+" is an invalid value for property 'si.GPS.maximumAge'");
			}
			catch(error){
				Logger.trace(this._className + " error on property 'si.GPS.maximumAge' : "+error);
			}
			
			return 60000; 
		}
	};
});
