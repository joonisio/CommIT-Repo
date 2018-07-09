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

define("platform/ui/control/ListText",
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/format/FormatterService",
	     "dojo/dom-class",
	     "dojo/dom-construct",
	     "dojox/mvc/Output",
	     "dojox/mvc/at" ],
function(declare, ControlBase, FormatterService, domClass, domConstruct, Output, at) {
	return declare( [ ControlBase ], {
		resourceAttribute : null,
		value : '',
		bound : false,
		domElement: null,
		
		constructor : function(options) {
			this._controlType = 'ListText';
		},

/**@memberOf platform.ui.control.ListText */
		build: function(){
//			summary:
//				build the control
//
//			description:
//				This is where we setup all internals and create any widgets
//			this.baseWidget = new Output({
//				id: this.getId() + "_output",
//				value: this._attributeAsBindable(),
//				'class': this.classPrefix + 'listText' + (this['cssClass']?' '+this['cssClass']:'')
//			});
			this.baseWidget = this.createWidget(Output, {
				id: this.getId() + "_output",
				value: this._attributeAsBindable(),
				'class': this.classPrefix + 'listText' + (this['cssClass']?' '+this['cssClass']:'') + this.getDataCss()
			});
			
			this.baseWidget.startup();
			
			this._setRequired();
			
			if(this.hideEmpty && !this.baseWidget.value) {
				this.setDisplay(false);
			}
			return this.inherited(arguments);
		},
				
		_attributeAsBindable : function(){
			if(this.resourceAttribute){
    			var modelData = this.getCurrentRecord();
    			if (modelData !== null) {
    				if(!this.metdata){
    					this.metadata = modelData.getMetadata();
    				}
    			    if (this.metadata !== null) {
    				    var userLocale = this.application.getUserLocale();
    				    var attributeInfo = this.metadata.getField(this.resourceAttribute);
    				    if (attributeInfo){
        				    var dataType = this.metadata.getDataType(attributeInfo);	
        				    this.bound = true;
        				    return at(modelData, this.resourceAttribute).transform({
        				    		format : function(value) {
        				    			return FormatterService.toDisplayableValue(value, dataType, userLocale, {usage: attributeInfo["usage"] || null, places: attributeInfo["precision"] || null});
        				    		}
        				    	}).direction(at.from);
    				    }
    			    }
    		    }
			}
			return this.getPropertyString('value');
		},
		
		postCreate: function() {
//			summary:
//				To be implemented by children
//
//			description:
//				Will be called after all controls are built and placed in the DOM
		    this.inherited(arguments);
		},
		
	    _setRequired : function() {			
			if (this.showreqattribute) {				
				var modelData = this.getCurrentRecord();
	    		if (modelData !== null) {
	    			var attrval = modelData.get(this.showreqattribute);
	    			if (attrval && (attrval == true)) {
	    				if (this.baseWidget.domNode){
	    					this.domElement = domConstruct.create("div", {
	    						'style' : 'display:inline;position:relative',	    					
	    	        			'innerHTML': '<span class="requiredLabel" style="display:inline;position:relative">&nbsp;*</span>',	    	        			
	    	        		},
	    	        		this.baseWidget.domNode);
	    				}
	    			}
				}
			}
	    },
	    
        destroy: function () {
            this.inherited(arguments);
            if (this.domElement){
            	domConstruct.destroy(this.domElement);
            	this.domElement = null;
            }
        }

	});
});
