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

define("platform/model/helper/ModelDataAdvisor", 
["dojo/_base/declare",
 "dojo/aspect", 
 "dojo/_base/array", 
 "platform/exception/PlatformRuntimeException",
 "platform/logging/Logger",
 "platform/util/CompressionHelper",
 "platform/util/PlatformConstants",
 "dojo/_base/lang",
 "platform/translation/MessageService"

], 
function(declare, aspect, array, PlatformRuntimeException, Logger, CompressionHelper, PlatformConstants, lang, MessageService) {
	return {
/**@memberOf platform.model.helper.ModelDataAdvisor */
		advise : function(modelData, resourceClassInstance) {			
			if(modelData["__advised"] !== true){
				modelData.__advised = true;
				var self = this;
				aspect.around(modelData, "set", function(originalSetMethod) {
					return function(){
						self._advisingFunction(modelData, resourceClassInstance, originalSetMethod, arguments);
					};
				});
			}
		},
		_advisingFunction : function(modelData, resourceClassInstance, originalSetMethod, originalMethodArguments) {
			originalMethodArguments = originalMethodArguments || [];
			var metadata = modelData.getMetadata();
			if(metadata && metadata["getField"] && metadata["trackChanges"]){
				var fieldName = originalMethodArguments[0];			
				if (fieldName) {					
					var fieldInfo = metadata.getField(fieldName);
					if (fieldInfo) {		
						var newValue = originalMethodArguments.length > 1 ? originalMethodArguments[1] : null;
						if(modelData.isReadOnly() && metadata.trackChanges(fieldName)){
							Logger.error(MessageService.createResolvedMessage("recordisreadonly", [newValue, fieldName, metadata.getResourceName()]));
						} else if(metadata.isDataTypeCompatibleWithValue(fieldInfo.dataType, newValue)){
							var usage = fieldInfo["usage"] || "";
							/* defect 102608 - removes timezone */
							if(newValue != null && (usage == "date" || usage == "time" && newValue && newValue["length"])){								
								newValue = originalMethodArguments[1] = ((newValue.length > 16) && (newValue.indexOf('T') > -1)) ? newValue.slice(0, newValue.indexOf('T') + 9): newValue;   	
							}
							var oldValue = modelData.get(fieldName);
							if (oldValue !== newValue) {
								if(!modelData.isTrackingModificationsDisabled() && fieldInfo.persistent === true){
									var instanceToBackup = modelData;
									while(instanceToBackup.getParent() != null){
										instanceToBackup = instanceToBackup.getParent();
									}
									/* backups on top level records that are not new (if we are here means have a remote record) */
									if(instanceToBackup.supportsUndoChanges() && 
											(!instanceToBackup[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] || instanceToBackup[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE]=='null')
												&& metadata.trackChanges(fieldName)){
										
										// Make a copy of the ModelData, so we can cleanup non-attribute data
										// and store only what is necessary in the original state .
										var instanceToBackupClone = lang.clone(instanceToBackup);
										
										this._cleanupNonAttributeModelData(instanceToBackupClone);
										
										var modelDataAsString = JSON.stringify(instanceToBackupClone); 
										instanceToBackup[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = CompressionHelper.compress(modelDataAsString);
									}
								}
								originalSetMethod.apply(modelData, originalMethodArguments);
								if(!modelData.isTrackingModificationsDisabled()){
									if (fieldInfo["method"] && resourceClassInstance[fieldInfo.method]) {
										resourceClassInstance[fieldInfo.method](modelData, newValue, oldValue);
									}								
									modelData.__attributeModified(fieldName);		
								}
							}
							else{
			        			modelData.clearPendingValue(fieldName);
							}
						}
						else{
							Logger.error(MessageService.createResolvedMessage("incompatiblevalueandtype", [newValue, fieldInfo.dataType]));
						}
					}
					else{
						if(fieldName == PlatformConstants.ATTACH_UPLOAD_PATH || fieldName == PlatformConstants.ATTACH_LOCATION_ATTR){
							modelData.__attributeModified(fieldName);
						}
						else{
							if(fieldName != "_currentIndex"){
								Logger.warn("Attribute {0} is not part of resource {1}", [fieldName, metadata.getResourceName()]);
							}
							originalSetMethod.apply(modelData, originalMethodArguments);
						}
					}
				}else{					
					originalSetMethod.apply(modelData, originalMethodArguments);
				}				
			}else{
				originalSetMethod.apply(modelData, originalMethodArguments);
			}
		},
		
		// Cleanup any non-attribute data that is stored in the ModelData
		// and associated ModelDataSet objects (inline dependent objects)
		// so that the original state that we maintain in the local store 
		// would only have the basic necessary data that is good enough
		// for the undo operation, in case of errors that a user cannot resolve.
		_cleanupNonAttributeModelData : function(modelData)
		{
			var arrayOfKeys = Object.keys(modelData);
			array.forEach(arrayOfKeys, function(keyName){
				if ((keyName == "_runtimeMetadata") || (!modelData.getMetadata().hasField(keyName)) || (keyName == "_pendingValues"))
				{
					delete modelData[keyName];
				}
			});
			
			var complexFieldList = modelData.getMetadata().getComplexFieldList();
			array.forEach(complexFieldList, function(complexField){
				
				if (complexField.dataType == "inline")
				{
					this._cleanupNonAttributeModelSetData(modelData.get(complexField.name));
				}
				
			}, this);
		},

		_cleanupNonAttributeModelSetData : function(modelDataSet)
		{
			if ((typeof modelDataSet != 'object') || (modelDataSet == null) || (modelDataSet instanceof Array)) 
			{
				return;
			}
			
			try{
				var arrayOfKeys = Object.keys(modelDataSet);
				array.forEach(arrayOfKeys, function(keyName){
					if (keyName != "data")
					{
						delete modelDataSet[keyName];
					}
				});
			}
			catch(error){
				// Most likely not an object so just leave it alone
				return;
			}
			if (modelDataSet.data)
			{
				array.forEach(modelDataSet.data, function(modelData) {
					this._cleanupNonAttributeModelData(modelData);
				}, this);
			}
		}
	};
});
