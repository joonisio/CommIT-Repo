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

define("platform/ui/widget/_domWidget", 
	[	"dojo/_base/declare",
	 	"dojo/dom-construct",
	 	"dojo/_base/lang" ], 
function(declare, domConstruct, lang){
	return declare( [], {
		domElement : null, 
		idExtension : '',
		
		constructor : function(options) {
			lang.mixin(this, options);
		},
/**@memberOf platform.ui.widget._domWidget */
		build: function() {
			if(this.domElement){
				this.domElement.startup = function(){};
				this.domElement.domNode = this.domElement;
				return this.domElement;
			}
		},
	    getId : function() {
	    	var type = "";
	    	if(this.control._controlType != this._widgetType){
	    		type = '_' + this._widgetType;
	    	}
	    	return this.control.getId() + type + this.idExtension;
	    }
	});
});
