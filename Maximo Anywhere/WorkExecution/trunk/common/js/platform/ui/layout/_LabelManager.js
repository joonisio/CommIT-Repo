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

define("platform/ui/layout/_LabelManager", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/_base/json" ],
function(declare, lang, json) {
	return declare([], {
		//need to get label bundle through dojo stuff
		name: 'labelManager',
		
	    labelBundle: { 'en': {
	    	'My Assiged Work'	: 'My Assigned Work',
	    	'Start'			: 'Start',
	    	'Stop'			: 'Stop',
	    	'WO#'			: 'WO#',
	    	'Work Order {0}'		: 'Work Order {0}',
	    	'Status'		: 'Status',
	    	'Asset'			: 'Asset',
	    	'Location'		: 'Location',
	    	//TODO - These messages need to come from some common platform bundle
	    	"noHandler" : {
				string : "Failed attempt to bind handler function to - {0}.{1}. The '{2}' function does not exist in '{3}'."
			},
			"noClass" : {
				string : "Failed attempt to bind handler to - {0}.{1}. The '{2}' object does not exist."
			},
			"entry" : {
				string : "Entered the method {0} in the class {1}. Context : {2}.",
				style : "color: green"
			},
			"exit" : {
				string : "Exited the method {0} in the class {1}. Context : {2}.",
				style : "color: blue"
			},
			"noResource" : {
				string : "Resource for {0} does not exist in the {1} language bundle."
			},
			"built" : {
				string : "Built {0} {1}",
				style : "color: green"
			},
			"builtplaceholder" : {
				string : "Built placeholder {0} {1}",
				style : "color: green"
			},
			"deferredbuild" : {
				string : "Built and placed {0} {1}",
				style : "color: green"
			},
			"buildingchildren" : {
				string : "Building Children {0} {1}",
				style : "color: orange"
			},
			"invalidlabel" : {
				string : "Invalid label on {0}"
			},
			"invalidlabelresolver" : {
				string : "Invalid label resolver {0}.{1} on {2}"
			}
	    },'fr': {
	    	'My Assiged Work'	: 'Mon désignée de travail',
	    	'Start'			: 'Commencer',
	    	'Stop'			: 'Arrêt',
	    	'WO#'			: 'WO#',
	    	'Work Order {0}': 'Ordre de travail {0}',
	    	'Status'		: 'Statut',
	    	'Asset'			: 'Atout',
	    	'Location'		: 'Emplacement'
	    },'de': {
	    	'My Assiged Work'	: 'Meine Zugeordnete Arbeitsaufträge',
	    	'Start'			: 'Starten',
	    	'Stop'			: 'Stoppen',
	    	'WO#'			: 'WO#',
	    	'Work Order {0}'		: 'Arbeitsauftrag {0}',
	    	'Status'		: 'Status',
	    	'Asset'			: 'Vermögenswert',
	    	'Location'		: 'Standort'
	    },'ru': {
	    	'My Assiged Work'	: 'Мой порученной работы',
	    	'Start'			: 'начало',
	    	'Stop'			: 'Стоп',
	    	'WO#'			: 'WO#',
	    	'Work Order {0}'		: 'Работа заказ {0}',
	    	'Status'		: 'статус',
	    	'Asset'			: 'активы',
	    	'Location'		: 'местоположение'
	    },'ja': {
	    	'My Assiged Work'	: '私の割り当てられた作業',
	    	'Start'			: 'スタート',
	    	'Stop'			: '停止',
	    	'WO#'			: 'WO#',
	    	'Work Order {0}': '{0} 作業命令',
	    	'Status'		: 'ステータス',
	    	'Asset'			: '資産',
	    	'Location'		: '場所'
	    } },
	    
		constructor: function(options){
			lang.mixin(this, options);
		},
	    
/**@memberOf platform.ui.layout._LabelManager */
		resolveLabelParams: function(object) { //called at runtime
			if(!object.label) {
				return '';
			}
			var label = object.label;
			if(typeof label =='string') {
				return label;
			}
			if(!label.string || !label.resolver.className || !label.resolver.functionName) {
				this.application.log('invalidlabel', 0, [object.id]);
				return label.string;
			}
			if(!label.localized) {
				var locLabel = this.getLocalized(label.string);
				object.label = lang.mixin(label, locLabel); 
			}
			var labelResolver = object.getLabelResolverObject();
			if(labelResolver) {
				var params = labelResolver[object.label.resolver.functionName](object);
				label = this.replaceParams(object.label.string, params);
			}
			return label;
		},
		
		replaceParams : function(string, params) {
			var returnString = string;
			if(typeof params == 'string') {
				params.apply();
			}
		    for (index in params) {
		    	returnString = returnString.replace("{" + index + "}", params[index]);
		    }
		    return returnString;
		},
		
		getLocalizedString: function(key) {
			return this.getLocalized(key).string;
		},
		
		getLocalized: function(key, langCode) { //called at buildtime to resolve initialization of controls and can also be used at runtime.
	    	var returnValue = key;
	    	
	    	if(!langCode) {
	    		langCode = this.langCode;
	    	}
	    	var langBundle = this.labelBundle[langCode];
	    	if(!langBundle) {
	    		langBundle = this.labelBundle[this.defaultLangCode];
	    	}
	    	returnValue =  langBundle[returnValue];
	    	if(!returnValue) {
//	    		this.application.logger.systemLog("noResource", 1, [key, this.langCode]);
	    		if(this.langCode != this.defaultLangCode) { //check to see if it is in base lang if current is not base
//	    			this.application.logger.systemLog("noResource", 1, [key, this.defaultLangCode]);
	    			returnValue =  this.labelBundle[this.defaultLangCode][returnValue];
	    		}
	    		if(!returnValue) {	
	    			returnValue = key;
	    		}
	    	}
	    	var returnObject = {string: returnValue, localized :true};
	    	if(returnValue.string){
	    		returnObject.string = returnValue.string;
	    		returnObject.style = returnValue.style;
	    	}
    		return returnObject;	
	    }
	});	
});
