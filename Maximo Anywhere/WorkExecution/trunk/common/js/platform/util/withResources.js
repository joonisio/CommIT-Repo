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

define("platform/util/withResources", [
	"dojo/_base/lang",
	"dojo/Deferred",
	"dojo/promise/all",
	"dojo/_base/array",
	"platform/model/ModelService",
	"platform/exception/PlatformRuntimeException"], 
function(lang, Deferred, all, arrayUtil, ModelService, PlatformRuntimeException){
	
	var promiseStack = [];
	
	function autoSaveModelDataSets(modelDataSetList, resourcesDescArray){
		var dataSetsToSave = [];
		arrayUtil.forEach(resourcesDescArray, function(resourceDesc, index){;
			if (!('autoSave' in resourceDesc) || resourceDesc['autoSave'] == true){
				var dataSetToSave = null;
				if ('parentModelData' in resourceDesc){
					dataSetToSave = resourceDesc['parentModelData'].getOwner();
				} else {
					dataSetToSave = modelDataSetList[index];
				}
				if (dataSetToSave.isDirty()){
					dataSetsToSave.push(dataSetToSave);
				}
			}
		});
		return ModelService.saveAll(dataSetsToSave);
	}
	
	var result = function(context, resourcesDescArray, callback){
		
		if (!callback){
			if (lang.isArray(context) && 
				lang.isFunction(resourcesDescArray)){ //omitted the context
				
				callback = resourcesDescArray;
				resourcesDescArray = context;
				context = this;
			} else {
				throw new PlatformRuntimeException('missingCallback');
			}
		}
		
		if (resourcesDescArray.length == 0){
			throw new PlatformRuntimeException('invalidResourceList');
		}
				
		var promisesList = [];
		
		arrayUtil.forEach(resourcesDescArray, function(resourceDesc){
			var promise = null;
			if ('name' in resourceDesc){
				var resourceName = resourceDesc['name'];
				var queryBase = resourceDesc['queryBase'];
				if ('filter' in resourceDesc){
					var filter = resourceDesc['filter'];
					promise = ModelService.filtered(resourceName, queryBase, filter);
				} else {
					promise = ModelService.all(resourceName, queryBase);
				}
				
			} else if ('parentModelData' in resourceDesc){
				if (!('childrenAttributeName' in resourceDesc)){
					throw new PlatformRuntimeException('invalidEntryWithParentChildren');
				}
				var parent = resourceDesc['parentModelData'];
				var complexAttribute = resourceDesc['childrenAttributeName'];
				promise = parent.getModelDataSet(complexAttribute);
				
			} else {
				throw new PlatformRuntimeException('invalidEntryMissingNameOrParentModelData');
				
			}
			promisesList.push(promise);
		});
		
		var stackPromise = all(promisesList).
		then(function(modelDataSetList){
			var currentStackLevel = promiseStack.length - 1;
			
			callback.apply(context, modelDataSetList);
			
			if ((promiseStack.length - 1) == currentStackLevel){
				promiseStack.pop();
				return autoSaveModelDataSets(modelDataSetList, resourcesDescArray);

			} else { //nested withResources called
				return all(promiseStack.slice(currentStackLevel + 1)).
				then(function(){
					promiseStack.pop();
					return autoSaveModelDataSets(modelDataSetList, resourcesDescArray);
				});				
			}
		});
		
		promiseStack.push(stackPromise);
		return all(promiseStack);
	};
	
	result.hasPendingCalls = function(){
		return promiseStack.length > 0;
	};
	
	result.getOverallPromise = function(){
		var promise = all(promiseStack); 
		promise.then(function(result){
			promiseStack = [];
			return result;
		});
		promise.otherwise(function(err){
			promiseStack = [];
			throw err;
		});
		return promise;
	};
	
	return result;
	
});
