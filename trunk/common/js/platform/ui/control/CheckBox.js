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

define("platform/ui/control/CheckBox",
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/ui/control/_StatefulControlMixin",
	     "platform/ui/control/_BoundControlMixin",
	     "dijit/layout/ContentPane",
	     "dojox/mobile/CheckBox",
	     "platform/ui/widget/Label",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dojo/touch",
	     "dojo/_base/event",
	     "dojo/dom-construct",
	     "dojox/mvc/at",
	     "dojox/gesture/tap"
	     ],
function(declare, ControlBase, StatefulControlMixin, BoundControlMixin, ContentPane, CheckBox, Label, lang, array, on, touch, event, domConstruct, at, tap) {
	return declare( [ ControlBase, BoundControlMixin, StatefulControlMixin ], {
    	editable: true,
    	value: '',
    	button: null,
    	label: null,
    	type: 'boolean',
    	focusNode: null,
    	checkBoxWidget: null,
    	labelObject: null,
    	labelElement: null,
    	
		constructor : function(options) {
			this._controlType = 'CheckBox';
			this.style = 'display: inline;';
		},

/**@memberOf platform.ui.control.CheckBox */
		build: function(){
//			summary:
//				build the control
//
//			description:
//				This is where we setup all internals and create any widgets

			this.binding();

			if(this.type!='boolean'){
				this.application.log(this._controlType+' must be bound to a boolean resource attribute.',0);
			}
			
			this.baseWidget = this.createWidget(ContentPane, {
				'class': 'leafControl checkbox'
			});
			
			if (!this.editable) {
				this.labelClassName = 'nonEditableLabel';
			} else {
				this.labelClassName = 'editableLabel';
			}

            if (this['labelCss']) {
                this.labelClassName = this['labelCss'];
            }

			this.checkBoxWidget = this.createWidget(CheckBox, {
				id: this.getId(),
				checked: (this.bound && this.validBinding)? this._attributeAsBindable(this.resourceAttribute) : this.getProperty(this.value).toLowerCase == 'true',
				disabled: !this.editable,
				'class': ' ' + ((this['cssClass'])?this['cssClass']:'')
			});
			
			this.focusNode = this.checkBoxWidget;
			
		    if(this.label) {
		    	this.labelFor = this.checkBoxWidget.id;
		    	this.labelObject = (new Label({control: this}));
		    	this.labelElement = this.labelObject.build();
		    	this.baseWidget.addChild(this.labelElement, 0);
		    	this.addHandler(on(this.labelElement, touch.press, function(e){
		    		event.stop(e);
		    	}));
		    }
		    
			if (this.bound && this.validBinding) {
				if(!this.editable){
					this._setReadOnly(!this.editable); //if this was intentionally set in xml, use it
				}
				else{
					this._setReadOnly(this.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute).readonly);
				}
            }

			if (this.bound && this.validBinding) {
				if(!this.editable){
					this._setReadOnly(!this.editable); //if this was intentionally set in xml, use it
				}
				else{
					this._setReadOnly(this.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute).readonly);
				}
            }

			//Need to suppress this tap event to indicate that our widget can handle this
		    //For instance so that if we're on a groupitem
		    //with a transitionto, that that doesn't trigger the transitionto as well
			this.addHandler(on(this.baseWidget, tap, function(e) {
				if(e.target.type != 'checkbox')
					e.stopImmediatePropagation();
				else
					e.stopPropagation();
			}));
			
			this.baseWidget.addChild(this.checkBoxWidget);
			return this.inherited(arguments);
		},
		
		getValue: function(){
			return this.checkBoxWidget.get('value');
		},
		
		getLabel: function(){
			return this.labelElement.domNode.innerHTML;
		},
		
		postCreate: function() {
//			summary:
//				To be implemented by children
//
//			description:
//				Will be called after all controls are built and placed in the DOM
		    this.inherited(arguments);
		},
		
	    _setReadOnly : function(readOnly){
	    	this.inherited(arguments);  
			this.checkBoxWidget.set('readOnly', readOnly);
			this.checkBoxWidget.set('disabled', readOnly); 

			if(this.labelObject){
				this.labelObject.setReadOnly(readOnly);
			}
	    },
	    
        destroy: function () {
            this.inherited(arguments);
        	this.focusNode = null;
        	this.checkBoxWidget = null;
        	if(this.labelObject){
        		this.labelObject.destroy();
            	this.labelObject = null;
        	}
        	this.labelElement = null;
        },
		
	});
});
