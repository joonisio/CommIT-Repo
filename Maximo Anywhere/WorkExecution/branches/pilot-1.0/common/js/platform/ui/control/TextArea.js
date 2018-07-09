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

define("platform/ui/control/TextArea",
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/ui/control/_StatefulControlMixin",
	     "platform/ui/control/_BoundControlMixin",
	     "dijit/layout/ContentPane",
	     "dojox/mobile/TextArea",
	     "platform/ui/widget/Label",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dojo/touch",
	     "dojo/_base/event",
	     "dojo/dom-construct",
	     "dojox/mvc/at",
	     "dojo/dom-class",
	     "dojo/dom-attr"
	     ],
function(declare, ControlBase, StatefulControlMixin, BoundControlMixin, ContentPane, TextArea, Label, lang, array, on, touch, event, domConstruct, at, domClass,domAttr) {
	return declare( [ ControlBase, BoundControlMixin, StatefulControlMixin ], {
    	editable: true,
    	value: '',
    	label: null,
    	textAreaWidget: null,
    	requiredIndicator: true,
    	
		constructor : function(options) {
			this._controlType = 'TextArea';
			this.style = 'display: inline;';
			if (options) {
				lang.mixin(this, options);
			}
		},

/**@memberOf platform.ui.control.TextArea */
		build: function(){
//			summary:
//				build the control
//
//			description:
//				This is where we setup all internals and create any widgets

			//TODO - Needs more work to bind to data and implement events
			var fldLength = this.getFieldInfo('maxSize');
			
			this.binding();
			var controlId = this.getId();
			this.baseWidget = this.createWidget(ContentPane, {
				id: controlId,
				'class': 'leafControl'
			});
			
			if (!this.editable) {
				this.labelClassName = 'nonEditableLabel';
			} else {
				this.labelClassName = 'editableLabel';
			}
			
			//Need to support detecting required from the field metadata
			var runtimeRequired = this.required;
            if (!runtimeRequired && this.bound && this.validBinding) {
                if (this.getCurrentRecord()) {
                    runTimeMataData = this.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute);
                    runtimeRequired = runTimeMataData && runTimeMataData.required;
                    if (runTimeMataData.required && this.viewControl) {
                        this.viewControl.requiredFields.push(this); //_ControlBase already adds if required in XML
                    }
                }
            }
			
			this.textAreaWidget = this.createWidget(TextArea, {
				id: controlId + '_ta' ,
				value: (this.bound && this.validBinding)? this._attributeAsBindable(this.resourceAttribute) : this.getPropertyString('value'),
				disabled: !this.editable,
				placeHolder: this.getPropertyString('placeHolder'),
				maxLength: fldLength, 
				'class': ' ' + ((this['cssClass'])?this['cssClass']:''+ (runtimeRequired ? ' requiredText' : '')),
			});
			
			if (this.bound && this.validBinding) {
				this._setReadOnly(this.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute).readonly);
				var resource = this.getResource(); 
				this.addResourceWatchHandle(resource.onChange(lang.hitch(this, function(field, oldValue, newValue){
					if(this.getResource().getCurrentRecord()){
						this.textAreaWidget.set('value', (this.bound && this.validBinding)? this._attributeAsBindable(this.resourceAttribute) : this.getPropertyString('value'));
					}
				})));				
			}
			
			this.focusNode = this.textAreaWidget;
			
		    if(this.label) {
		    	this.labelFor = this.textAreaWidget.id;
		    	this.labelObject = this.createWidget(Label, {control: this, required: runtimeRequired});
		    	this.labelElement = this.labelObject.build();
		    	domAttr.set(this.textAreaWidget.domNode, {
                    'aria-labelledby': this.labelElement.id
                });

		    	this.baseWidget.addChild(this.labelElement, 0);
		    	this.addHandler(on(this.labelElement, touch.press, function(e){
		    		event.stop(e);
		    	}));
		    }
			
			this.addHandler(on(this.textAreaWidget, touch.press, function(e) {
				e.stopPropagation();
			}));
			this.baseWidget.addChild(this.textAreaWidget);
			return this.inherited(arguments);
		},
		
		getValue: function(){
			return this.textAreaWidget.get('value');
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
			this.textAreaWidget.set('readOnly', readOnly);
	    },

	    destroy: function () {
            this.inherited(arguments);
        	this.focusNode = null;
        	
        	this.textAreaWidget = null;
        	if(this.labelElement){
        		domConstruct.destroy(this.labelElement.domNode);
            	this.labelElement = null;
        	}
        },
	    
	    _setRequired: function (required) {
            if (required) {
                if (this.textAreaWidget.domNode) {
                    domClass.add(this.textAreaWidget.domNode, 'requiredText');
                }
                if(this.viewControl){
                	this.viewControl.requiredFields.push(this);
                }
            }
            else {
                if (this.textAreaWidget.domNode) {
                    domClass.remove(this.textAreaWidget.domNode, 'requiredText');
                }
                if(this.viewControl){
                	this.viewControl.removeRequiredField(this);
                }
            }
            if(this.labelObject){
            	this.labelObject.setRequired(required);
            } 
        },
        
        hasValue: function () {
            var value = this.getValue();

            return typeof value != 'undefined' && value != null && value != '';
        },
        
        setValue: function(value) {
        	this.textAreaWidget.set('value', value);
        },

	});
});
