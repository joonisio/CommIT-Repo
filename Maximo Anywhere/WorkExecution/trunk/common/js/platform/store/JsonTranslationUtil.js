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

define("platform/store/JsonTranslationUtil",
["dojo/_base/lang", 
 "dojo/_base/array" ,
 "platform/store/_ResourceMetadataContext",
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "platform/store/_FormulaEvaluator"], 
function(lang, arrayUtil, ResourceMetadataContext, PlatformConstants, Logger, FormulaEvaluator) {
    
	return {
		
/**@memberOf platform.store.JsonTranslationUtil */
		translateJsonWithRules: function(rules, input) {
			var isWindows= WL.Client.getEnvironment()==WL.Environment.WINDOWS8;
			/**
			 * Translates an array of jsons into another given a set of transformation rules.
			 * Refer to unit tests for rules syntax samples
			 */
			if (!lang.isArray(input)){
				input = [input];
			}
						
			var self = this;
			var childrenToFlatten = [];
			arrayUtil.forEach(input, function(item){
				var keys = Object.keys(item);
				arrayUtil.forEach(keys, function(key){

					var newKeysRules = rules[key];
					
					if (!newKeysRules){
						if (key != PlatformConstants.ATTACH_UPLOAD_PATH && key != PlatformConstants.ATTACH_LOCATION_ATTR){
							delete item[key];	
						}
						return;
					}
					
					if (item[key]==null && newKeysRules[0].origKey){
						//set newkey = origkey
						newKeysRules[0].newKey = newKeysRules[0].origKey;
					}

					//Hack for defect 242596 because JSON store is storing GMT offsets on Windows
					//And the GMT offsets are being returned incorrectly for these four fields from the OSLC layer
					var usage = newKeysRules[0].usage;
					
					if (isWindows && usage && (usage =="date" || usage=="time")
		                        && item[key].match(/[\+-][0-1][0-9]:[0-9][0-9]/)) {
					    item[key] = item[key].replace(/[\+-][0-1][0-9]:[0-9][0-9]/, '');
					}

					
					if (newKeysRules === PlatformConstants.TRANSLATE_AS_TOP_RECORDS){
						
						var children = item[key];
						self.translateJsonWithRules(rules, children);
						//Need to check to see if the record is already in the input, then don't add.
						// Add children to an array to be translated after all the parents are translated. 
						childrenToFlatten.push.apply(childrenToFlatten, children);
						delete item[key];
						return;
					}
					arrayUtil.forEach(newKeysRules, function(newKeyRule) {
						var value = item[key];
						if (newKeyRule.attributeFromValue){
							value = lang.getObject(newKeyRule.attributeFromValue, false, value);
							
						} else if (lang.isObject(value)){
							if (newKeyRule.childrenRules){
								if (newKeyRule.dataArrayInAttribute){
									value = value[newKeyRule.dataArrayInAttribute];
								}
								self.translateJsonWithRules(newKeyRule.childrenRules, value);
								
								if (!lang.isArray(value)){
									value = [value];
								}								
							}
						}
						if (newKeyRule.referenceAttributeFromValue && lang.isObject(item[key])){
							var refValue = null;
							if (newKeyRule.referenceAttributeFromValue in item[key]){
								refValue = item[key][newKeyRule.referenceAttributeFromValue];

							} else { //the ref attribute was already translated so pickup the translated name to retrieve the value
								var translatedRefName = rules[newKeyRule.referenceAttributeFromValue][0].newKey;
								refValue = item[key][translatedRefName];

							}
							item[newKeyRule.newKey + '_ref'] = refValue;
						}
						
						lang.setObject(newKeyRule.newKey, value, item);
					});
					
					delete item[key];
				});
				if (rules[PlatformConstants.TRANSLATION_COMPLETION_CALLBACK]){
					rules[PlatformConstants.TRANSLATION_COMPLETION_CALLBACK](item);
				}
			});
			if (childrenToFlatten.length > 0){
				arrayUtil.forEach(childrenToFlatten, function(child){
					var remoteid = child[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE];
					//Check to see if the the child record already exists by comparing remote id
					if (remoteid){
						if(!arrayUtil.some(input,function(item){
							return (remoteid == item[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE]);
						})){
							input.push(child);
						}
					}
				});
			}
		}		
	};

});
