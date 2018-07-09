/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/handlers/ClassificationFormHandler", 
	   [ "dojo/_base/array",
	     "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/Deferred",
	     "dojo/promise/all",
	     "dojo/on",
	     "dojo/touch",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "platform/ui/control/Text",
		 "platform/logging/Logger",
	     "platform/ui/control/ComboBox",
	     "application/business/FieldUtil",
	     "application/handlers/CommonHandler",
	     "platform/translation/SynonymDomain"
	     ],
function(arrayUtil, declare, lang, Deferred, all, on, touch, ApplicationHandlerBase, ModelService, MessageService, Text, Logger, ComboBox, fieldUtil, CommonHandler, SynonymDomain) {
	
	COMBOBOX_MAX_LENGTH = 4;
	var count = 0;
	
	return declare([ApplicationHandlerBase], {
		
		/**@memberOf application.handlers.ClassificationFormHandler */
		filterMaxDomain: function(eventContext) {
			var domainSet = this.application.getResource('maxdomain');
			var currentWO = this.application.getResource('workOrder').getCurrentRecord(); 
			var woSpec = currentWO['workOrderSpec'].getCurrentRecord(); 
			var domainId = woSpec.domainid;
			domainSet.clearFilterAndSort();
			domainSet.filter("domainid == $1", domainId);
			Logger.trace(domainSet.name + " filtered by: " + domainId);
			var maxdomain = domainSet.getCurrentRecord();
			var domainTypes = CommonHandler._getAdditionalResource(eventContext, "domaintypes");
			domainTypes.clearFilterAndSort();
			if(maxdomain.domaintype == SynonymDomain.resolveToDefaultExternal(domainTypes, 'ALN')) {
				maxdomain.alndomain.resourceID = 'maxdomain.alndomain';
				this.application.addResource(maxdomain.alndomain);
			}
			else if(maxdomain.domaintype == SynonymDomain.resolveToDefaultExternal(domainTypes, 'NUMERIC')) {
				maxdomain.numericdomain.resourceID = 'maxdomain.numericdomain';
				this.application.addResource(maxdomain.numericdomain);
			}
		},
		
		resolveClassificationDescription: function(eventContext) {
			return [eventContext.getCurrentRecord().getParent().classificationdesc];
		},
		
		// fixes problem with new workorders not having the right wospec
		initializeWOSpec : function(eventContext) {
			eventContext.createMyResource('workOrder.workOrderSpec');
			var resourceObj = eventContext.application.getResource('workOrder.workOrderSpec');
			if (resourceObj != null) {
				if (resourceObj.count() > 0) {
					resourceObj.setCurrentIndex(0);
				}
			}
		},
		
		showWOSpec : function(eventContext) {
			var assetAttrTypes = CommonHandler._getAdditionalResource(eventContext, "assetattrtypes");
			var alnType = SynonymDomain.resolveToDefaultExternal(assetAttrTypes, "ALN");
			var numericType = SynonymDomain.resolveToDefaultExternal(assetAttrTypes, "NUMERIC");
			var resourceObj = eventContext.application.getResource('workOrder.workOrderSpec');
			if (resourceObj != null) {
				resourceObj.clearFilterAndSort();		
				resourceObj.filter("datatype == $1 || datatype == $2", alnType, numericType);
			}		
		},
		
		showWOSpecSorted : function(eventContext) {
			var assetAttrTypes = CommonHandler._getAdditionalResource(eventContext, "assetattrtypes");
			var alnType = SynonymDomain.resolveToDefaultExternal(assetAttrTypes, "ALN");
			var numericType = SynonymDomain.resolveToDefaultExternal(assetAttrTypes, "NUMERIC");
			var resourceObj = eventContext.application.getResource('workOrder.workOrderSpec');
			if (resourceObj != null) {
				resourceObj.clearFilterAndSort();		
				resourceObj.filter("datatype == $1 || datatype == $2", alnType, numericType);
				resourceObj.sort('displaysequence asc');
			}		
		}

	});
});
