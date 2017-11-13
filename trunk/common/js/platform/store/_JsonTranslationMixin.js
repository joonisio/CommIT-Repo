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

define("platform/store/_JsonTranslationMixin",
["dojo/_base/lang", 
 "platform/store/_ResourceMetadataContext",
 "platform/logging/Logger",
 "platform/store/JsonTranslationUtil"], 
function(lang, ResourceMetadataContext, Logger, JsonTranslationUtil) {
	
	return {
/**@memberOf platform.store._JsonTranslationMixin */
		translateOSLCDataToStore: function(oslcResultSet, metadata) {
			Logger.timerStart("_JsonTranslationMixin - translateOSLCDataToStore - Translation of oslc names to aliases");
			var translationRules = metadata.getOSLCTranslationRules();

			JsonTranslationUtil.translateJsonWithRules(translationRules, oslcResultSet);

			Logger.timerEnd("_JsonTranslationMixin - translateOSLCDataToStore - Translation of oslc names to aliases");
		},
		
		translateTransactionPayloadToOslc: function(resourceName, payloadData){
			Logger.timerStart("_JsonTranslationMixin - translateTransactionPayloadToOslc - Translation of alias names to oslc names");
			var resourceMetadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			var translationRules = resourceMetadata.getAliasesTranslationRules();
			var result = lang.clone(payloadData);

			JsonTranslationUtil.translateJsonWithRules(translationRules, result);
			
			Logger.timerEnd("_JsonTranslationMixin - translateTransactionPayloadToOslc - Translation of alias names to oslc names");
			return result;
		}
		
	};

});
