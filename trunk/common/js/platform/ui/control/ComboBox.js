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

define("platform/ui/control/ComboBox",
	   [ 
	    /*  1 */ "dojo/_base/declare",
	    /*  2 */ "dojo/_base/lang",
	    /*  3 */ "dojo/on",
	    /*  4 */ "dojo/touch",
	    /*  5 */ "dijit/focus",
	    /*  6 */ "dojo/dom-class",
	    /*  7 */ "dojo/dom-attr",
	    /*  8 */ "dojo/store/Memory",
	    /*  9 */ "dojox/gesture/tap",
	    /* 10 */ "dojox/mobile/Button",
	    /* 11 */ "dojox/mobile/ComboBox",
	    /* 12 */ "dojox/mvc/at",
	    /* 13 */ "dijit/layout/ContentPane",
	    /* 14 */ "platform/ui/control/_ContainerControlBase",
	    /* 15 */ "platform/ui/control/_StatefulControlMixin",
	    /* 16 */ "platform/ui/control/_BoundControlMixin",
	    /* 17 */ "platform/ui/widget/Label",
	    /* 18 */ "platform/logging/Logger",
	    /* 19 */ "platform/translation/MessageService",
	 	/* 20 */ "platform/exception/PlatformRuntimeException",
	 	/* 21 */ "platform/warning/PlatformRuntimeWarning",
	 	/* 22 */ "platform/ui/control/DomainValue",
	 	/* 23 */ "platform/ui/control/DomainValues",
	 	/* 24 */ "platform/ui/control/Text",
	     ],
function(
		/*  1 */ declare, 
		/*  2 */ lang, 
		/*  3 */ on, 
		/*  4 */ touch, 
		/*  5 */ dijitFocus, 
		/*  6 */ domClass, 
		/*  7 */ domAttr,
		/*  8 */ Memory, 
		/*  9 */ tap, 
		/* 10  */ Button, 
		/* 11 */ ComboBox, 
		/* 12 */ at,
		/* 13 */ ContentPane, 
		/* 14 */ ContainerControlBase, 
		/* 15 */ StatefulControlMixin, 
		/* 16 */ BoundControlMixin, 
		/* 17 */ Label, 
		/* 18 */ Logger,
		/* 10 */ MessageService, 
		/* 20 */ PlatformRuntimeException, 
		/* 21 */ PlatformRuntimeWarning,
		/* 22 */ DomainValue,
		/* 23 */ DomainValues,
		/* 24 */ Text) {
	
	return declare([ContainerControlBase, StatefulControlMixin, BoundControlMixin], {
		
		requiredIndicator: true,
		labelClassName : 'editableLabel',
		labelObect: null,
		labelElement: null,
		comboWidget: null,
		
		constructor: function(options) {
			this._controlType = 'ComboBox';
			var domainResourceObj = null;
			if(options.domainResource) {
				//domainResourceObj = this.application.getResource(options.domainResource);
				//this.domain = domainResourceObj;
			}
			else if(options.domain) {
				this.hasLookup = false;
				this.isCodeScannable = false;		
				lang.mixin(this, options);
			}
			if(domainResourceObj && 
					domainResourceObj.count() > options.maxOptions) {
				lang.mixin(this, Text);
				this.inherited(arguments);
			}
		},
	
/**@memberOf platform.ui.control.ComboBox */
		build: function() {
			var self = this;
			self.fieldId = self.id?self.id:null;
			self.binding();
			var baseClass = self.baseClass ? self.baseClass + ' leafControl' : 'leafControl';
			if(self['cssClass']=='heading'){
				baseClass += self['cssClass'];
			}
			self.baseWidget = new ContentPane({
				parentControl : self,
				'class': baseClass,
				'style' : 'width: * !important'
			});
			
			self.fldLength = '';
            self['cssClass'] = 'editableText editableTextNoButton lookupText ' + (self['cssClass'] ? self['cssClass'] : '');

			if (self.required){
				self.viewControl.requiredFields.push(self); 
			}       
            
            self.errorButton = new Button({
				'class': 'fieldMarker',
			});
			self.addHandler(on(self.errorButton.domNode, tap, lang.hitch(self, function(){
				self.ui.showMessage(self.exception.getMessage());
			})));
			
			self.domainMemoryStore = self.getDomainStore();
			
			self.comboWidget = new ComboBox({
				name : self.fieldId,
				searchAttr: self.domainSearchAttr,
				store: self.domainMemoryStore,
				style: self.style,
				value: (self.bound && self.validBinding) ? self._attributeAsBindable(self.resourceAttribute) : self.getPropertyString('value'),
				type: 'text',
				placeHolder: self.placeHolder,
				maxLength: self.getFieldInfo('maxSize'),
				'class': self['cssClass']
			});
			self.focusNode = self.comboWidget;
			//Turning off autocapitalize at the widget level to stop iOS dumbness
			self.comboWidget.domNode.setAttribute('autocapitalize','off');
			self.comboWidget.startup();
			domAttr.set(self.comboWidget.textbox, 'readOnly', true);
			if(self.label) {
				self.labelFor = self.comboWidget.id;
				self.labelObject = new Label({control: self, required: self.required});
		    	self.labelElement = self.labelObject.build();
		    	self.addHandler(on(self.labelElement, touch.press, lang.hitch(self, function(e){
		    		dijitFocus.focus(self.comboWidget.domNode);
		    	})));
		    	self.baseWidget.addChild(self.labelElement, 0);
		    }
			self.baseWidget.addChild(self.comboWidget);
			self.baseWidget.addChild(self.errorButton);

			// callbacks for events
			self.addHandler(on(self.comboWidget, touch.press, function(e) {
				e.stopPropagation();
			}));
			self.addHandler(on(self.comboWidget, 'focus', lang.hitch(self, function(e) {
				self.ui.hideCurrentMenu();
		    })));
			self.addHandler(on(self.comboWidget, 'blur', lang.hitch(self, function(e) {
				self.comboWidget.closeDropDown();
		    })));
			self.addHandler(on(self.baseWidget, 'blur', lang.hitch(self, function(e) {
				self.comboWidget.closeDropDown();
			})));
			
			self.baseWidget.startup();
			
			var parentReturn = self.inherited(arguments);
			
			return parentReturn;
		},
		
		addLookupButton: function(container) {
			container.addChild(this.button);
			this.addHandler(on(this.button, tap, lang.hitch(this, function(e) {
			    if(this.ui.currentMenu){
			    	e.stopPropagation();
		    		this.ui.hideCurrentMenu();
			    }
				dijitFocus.focus(this.comboWidget.domNode);
				e.stopPropagation();
		    })));
		},
		
		_attributeAsBindable: function(attributeName) {
			/* Overrides platform.ui.control._BoundControlMixin._attributeAsBindable(attributeName)
			 * summary:
		     * constructs a specific data binder to be used in the ComboBox input control 
		     * and listen to/update changes in a stateful modelData object
		     */
		    var modelData = this.getCurrentRecord();
		    if (modelData !== null) {
			    var metadata = modelData.getMetadata();
			    if (metadata !== null) {
				    //var userLocale = this.application.getUserLocale();
				    var attributeInfo = metadata.getField(attributeName);
				    if (attributeInfo !== null) {
				    	var self = this;
					    return at(modelData, attributeName).transform({
					        format : function(value) {	
					        	var internalValue = modelData.getPendingOrOriginalValue(attributeName);
					        	var theValueToDisplay = self.toDisplayValue(internalValue);
					        	//theValueToDisplay = formatterService.toDisplayableValue(theValueToDisplay, attributeInfo.dataType, userLocale, {usage: attributeInfo["usage"] || null, places: attributeInfo["precision"] || null, attributeName : attributeName, maxSize: attributeInfo["maxSize"] || null});
						        return self.formatDisplayedValue(theValueToDisplay);
					        },
					        parse : function(value) {
					        	
					        	// Do not trigger validate during undo.
					        	if (modelData.isUndoInProgress())
					        	{
					        		return value;
					        	}
					        	try{
					        		//format before any business logic or field handlers
					        		if(value == modelData._pendingValues[attributeName]){
					        			modelData.clearPendingValue(attributeName);
					        			return value;
					        		}
					        		var newValue = self.toInternalValue(value);
					        		//var newValue = formatterService.fromDisplayableValue(internalValue, attributeInfo.dataType, userLocale, {usage: attributeInfo["usage"] || null, places: attributeInfo["scale"] || null, maxSize: attributeInfo["maxSize"] || null});
					        		if(self.dataValidate){
                                        modelData.setPendingValue(attributeName, newValue);
					        			self.application.log(PlatformConstants.LOG_TRACE+'calling '+self.dataValidate['className']+'.'+self.dataValidate['method'], 1, []);
					        			if (self.dataValidate.method.indexOf('async') == 0) {
					        				self.application.showBusy();
					        				var result = self.dataValidate['class'][self.dataValidate['method']](self);
					        				result.then(function() {
												self.setInvalid();
												modelData.clearPendingValue(attributeName);
												return newValue;					        					
					        				});
					        				result.otherwise(function(error) {
												switch (true) {
												case (error instanceof PlatformRuntimeException):
													self.setInvalid(error);
													self.application.showMessage(error.getMessage());
													break;
												default: 
													Logger.error(error);
													break;
												return newValue;
												}
					        				});
					        				result.always(function() {
						        				self.application.hideBusy();
					        				});
					        			}
					        			else {
					        				self.dataValidate['class'][self.dataValidate['method']](self);
					        			}					        				
					        		}
									self.setInvalid();
									
									// Clear the pending value only if the format is not changed
									// so validation would not trigger
									if (newValue == value)
									{
										modelData.clearPendingValue(attributeName);
									}
									return newValue;
					        	}catch (throwable) {
									switch (true) {
										case (throwable instanceof PlatformRuntimeException):
											self.setInvalid(throwable);
											self.application.showMessage(throwable.getMessage());
											break;
										default: 
											Logger.error(throwable);
											break;
									}									
					        	}
					        	return value;
					        }
					    }).direction(at.both);
				    }
			    }
		    }
		    var returnValue = null;
		    if(this.application.debug==true){
		    	this['cssClass'] += ' invalidBinding';
		    	returnValue = (MessageService.createStaticMessage('InvalidBindingNoRecord').getMessage());
		    }
		    return returnValue;
		},
		
		toInternalValue: function(displayValue) {
			var result = this.domainMemoryStore.query({description: displayValue});
			if (result[0]) {
				return result[0].value;
			} else {
				return displayValue;
			}
		},
		
		toDisplayValue: function(internalValue) {
			var result = this.domainMemoryStore.query({value: internalValue});
			if (result[0]) {
				return result[0].description;
			} else {
				return internalValue;
			}
		},
		
		getValue: function(){
			return this.comboWidget.get('value');
		},
		
		getLabel: function(){
			return this.labelElement.domNode.innerHTML;
		},
		
		setLabel: function(newLabel) {
		   this.labelElement.domNode.innerHTML = newLabel;
		},
		
		postCreate: function() {
			Logger.trace('platform.ui.control.ComboBox.postCreate()');
		},
		
		hasValue: function(){
			var value = this.getValue();
			return typeof value!='undefined' && value!=null && value!='';
		},
		
		setInvalid : function(throwable){
			switch (true) {
				case (throwable instanceof PlatformRuntimeException && !(throwable instanceof PlatformRuntimeWarning)):
    				if(this.errorButton){
        				domClass.add(this.errorButton.domNode, 'fieldMarkerError');
    				}
    				domClass.add(this.comboWidget.domNode, 'errorText');
    				break;
    			default: 
    				domClass.remove(this.comboWidget.domNode, 'errorText');
    				domClass.remove(this.comboWidget.domNode, 'warningText');
    				if(this.errorButton){
    					domClass.remove(this.errorButton.domNode, 'fieldMarkerError');
    					domClass.remove(this.errorButton.domNode, 'fieldMarkerWarning');
    				}
    				break;
    			}		
			this.inherited(arguments);
		},
		_resolveDomainType: function(domaintype) {			
			var domainType = domaintype;
			var domainTypes = this.application.getResource("domaintypes");
			domainTypes.filter("maxvalue=='$1' && defaults == $2", domaintype, true);
			if (domainTypes.count()==1) {
				domainType=domainTypes.get(0).get("value");
			}
			return domainType;			
		},
		
		getDomainStore: function() {
			var self = this;
			if(self.domainValues) {
				self.domainIdAttr = self.domainValues.IDPROPERTY;
				self.domainSearchAttr = self.domainValues.SEARCHATTR;
			}
			var emptyOption = {};
			emptyOption[self.domainIdAttr] = "-1";
			emptyOption[self.domainSearchAttr] = '';
			emptyOption['value'] = null;
			var updData = null;
			if(self.domain) {
				updData = self.domain.slice();
				updData.unshift(emptyOption);
			}
			else if(self.domainValues){
				updData = self.domainValues.data;
			}
			else {
				updData = new Array();
				updData.push(emptyOption);
			}
			
			return new Memory({
				idProperty: self.domainIdAttr,
				data: updData
			});
		},
		
		addChild: function(child) {
			this.domainValues = child;
		},
		
        destroy: function () {
            this.inherited(arguments);
        	this.focusNode = null;
        	this.comboWidget = null;
        	if(this.labelObject){
        		this.labelObject.destroy();
            	this.labelObject = null;
        	}
        	this.labelElement = null;
        },
		
	});
});
