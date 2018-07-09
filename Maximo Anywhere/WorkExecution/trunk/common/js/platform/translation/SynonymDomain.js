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

define("platform/translation/SynonymDomain", 
		[/*"dojo/Deferred",
		 "platform/model/ModelService",*/
		 "platform/exception/PlatformRuntimeException"], 
		 function(/*Deferred, ModelService,*/ PlatformRuntimeException) {
	return {
		
/**@memberOf platform.translation.SynonymDomain */
		resolveToInternal : function(resourceName, value) {
			/*var deferred = new Deferred();
			
			ModelService.all(resourceName).then(function(dataSet) {
				var internalValueSet = dataSet.find('value == $1', value);
				
				if(internalValueSet.length > 0) {
					deferred.resolve(internalValueSet[0].get('maxvalue'));
				} else {
					deferred.reject('nomaxvaluefound');
				}
			});
			
			return deferred.promise;*/
			
			var internalValueSet = resourceName.find('value == $1', value);
			
			if(internalValueSet.length > 0) {
				return internalValueSet[0].get('maxvalue');
			}
		},

		resolveToDefaultExternal : function(resourceName, maxvalue) {
			/*var deferred = new Deferred();
			
			ModelService.all(resourceName).then(function(dataSet) {
				var externalValueSet = dataSet.find('maxvalue == $1 && defaults == $2', maxvalue, true);
				
				if(externalValueSet.length > 0) {
					deferred.resolve(externalValueSet[0].get('value'));
				} else {
					throw new PlatformRuntimeException('invalidexternalvalue');
				}
			});
			
			return deferred.promise;*/
			
			var externalValueSet = resourceName.find('maxvalue == $1 && defaults == $2', maxvalue, true);
			
			if(externalValueSet.length > 0) {
				return externalValueSet[0].get('value');
			} else {
				throw new PlatformRuntimeException('invalidexternalvalue');
			}
		},
		
		resolveToExternal : function(resourceName, maxvalue) {
			/*var deferred = new Deferred();
			
			ModelService.all(resourceName).then(function(dataSet) {
				var externalValueSet = dataSet.find('maxvalue == $1 && defaults == $2', maxvalue, true);
				
				if(externalValueSet.length > 0) {
					deferred.resolve(externalValueSet[0].get('value'));
				} else {
					throw new PlatformRuntimeException('invalidexternalvalue');
				}
			});
			
			return deferred.promise;*/
			
			/*var externalValueSet = */resourceName.filter('maxvalue == $1', maxvalue);
			
			if(resourceName.count() > 0) {
				var keys = {};
				resourceName.foreach(function(record){
					keys[record.get('value')] = true;
				});
				return keys;
			} else {
				throw new PlatformRuntimeException('invalidexternalvalue');
			}
		},
		
		isValidDomain : function(resourceName, maxvalue, value) {
			/*var deferred = new Deferred();
			
			ModelService.all(resourceName).then(function(dataSet) {
				var externalValueSet = dataSet.find('maxvalue == $1 && value == $2', maxvalue, value);
				
				if(externalValueSet.length > 0) {
					deferred.resolve(true);
				} else {
					deferred.resolve(false);
				}
			});
			
			return deferred.promise;*/
			
			var externalValueSet = resourceName.find('maxvalue == $1 && value == $2', maxvalue, value);
			
			return externalValueSet.length > 0;
		}
	}
});
