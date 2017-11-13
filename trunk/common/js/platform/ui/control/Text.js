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

define("platform/ui/control/Text",
	   ["dojo/_base/declare",
	     "platform/ui/control/_ContainerControlBase",
	     "platform/ui/control/_StatefulControlMixin",
	     "platform/ui/control/_BoundControlMixin",
	     "dijit/layout/ContentPane",
	     "dojox/mobile/TextBox",
	     "dojox/mvc/Output",
	     "platform/ui/widget/Label",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dojo/touch",
	     "dijit/focus",
	     "dojo/_base/event",
	     "dojo/dom-construct",
	     "dojo/dom-attr",
	     "dojo/dom-class",
	     "dojox/mvc/at",
	     "dojox/mobile/Button",
	     "dojox/gesture/tap",
	     "platform/codeScanner/CodeScanner",
	     "platform/logging/Logger",
	     "platform/translation/MessageService",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/codeScanner/BluetoothScanner",
	     "platform/util/ANumericUtil"],
function (declare, ContainerControlBase, StatefulControlMixin, BoundControlMixin, ContentPane, TextBox, Output, Label, lang, array, on, touch,
		dijitFocus, event, domConstruct, domAttr, domClass, at, Button, tap, CodeScanner, Logger, MessageService,
		PlatformRuntimeException, PlatformRuntimeWarning, BluetoothScanner, ANumericUtil) {
    return declare([ContainerControlBase, StatefulControlMixin, BoundControlMixin], {
        editable: true,
        value: '',
        button: null,
        codeScanButton: null,
        label: null,
        hasLookup: false,
        isCodeScannable: false,
        enableNumericKeyboard:false,
        typed: null,
        requiredIndicator: true,
        dynamicBuild: false,
        lookup_init: false,
        num_attr: null,
        modelData: null,
        cnumberutil:null,
        codeScanButton: null,
        errorButton: null,
        textWidget: null,
        labelObject: null,
        labelElement:null,
        button: null,
        

        constructor: function (options) {
            this._controlType = 'Text';
            this.style = 'display: inline; width:inherit;';
            if (options && options.lookup) {
                this.hasLookup = true;
            }
            if (options && options.codeScannable) {
                    this.isCodeScannable = true;
                }
            
            if(options && options.enableNumericKeyboard){
            	this.enableNumericKeyboard = true;
            }
            if (options && options.dynamicBuild) {
                this.num_attr = options['attribute'];
                this.inherited(arguments);
                lang.mixin(this, options);
            }
            
            
        },
        /**@memberOf Text*/
        build: function () {
            //			summary:
            //				build the control
            //
            //			description:
            //				This is where we setup all internals and create any widgets

            if (this.isCodeScannable) {

                var laser_scanner = new BluetoothScanner('body');
                laser_scanner.registerScanListener(true);
                
                this.addHandler(on(this.viewControl.baseWidget, 'BeforeTransitionOut', function (moveTo, dir, transition, context, method) {

                    laser_scanner.removeScanListener();

                }));

            }
            
            
            
            var controlId = this.getId();

            if (!this['cssClass']) {
                this['cssClass'] = '';
            }

            this.binding();

            var baseClass = this.baseClass ? this.baseClass + ' leafControl' : 'leafControl';
            if (this['cssClass'] == 'heading') {
                baseClass += this['cssClass'];
            }

            this.baseWidget = this.createWidget(ContentPane, {
                id: controlId,
                parentControl: this,
                'class': this.classPrefix + baseClass + this.getDataCss(),
                'style': 'width: * !important'
            });

            var tb = Output;
            this.fldLength = '';
            this.tbType = 'text';

            tb = (this.editable && this.bound) ? TextBox : Output;

            var fldLength = this.getFieldInfo('maxSize');

            if (this.bound && this.validBinding) {
                switch (this.type) {
                    case 'date':
                    case 'time':
                    case 'datetime':
                        this.lookupAttribute = 'date';
                    case 'duration':
                        if (this.editable) {
                            this.hasLookup = true;
                            this.lookup = this.type;
                        }
                        if (!this.lookupAttribute) {
                            this.lookupAttribute = 'duration';
                        }
                        tb = Output;
                        break;
                    case 'double':
                        if (this.usage == 'duration') {
                            if (this.editable) {
                                this.hasLookup = true;
                                this.lookup = this.type;
                            }
                            if (!this.lookupAttribute) {
                                this.lookupAttribute = 'duration';
                            }
                            tb = Output;
                        }
                       /* else {
                    		//Not a duration, but a typable field
	                    		this.tbType = 'number';
                    	}
                    	
                    	//Related Info: https://bugs.dojotoolkit.org/ticket/17405
                    	*/
                        break;
                    case 'integer':
                    	//this.tbType = 'number';
                        break;
                    case 'password':
                        this.tbType = 'password';
                        break;
                    default:
                        this.tbType = 'text';
                        break;
                }
                

                this.labelClassName = 'nonEditableLabel';

                if (!this.border) {
                    //setup look/feel
                    if (tb == TextBox) {//editableText with button
                        if (this.hasLookup) {
                            this.createLookupButton();
                        }
                        if (this.isCodeScannable) {
                            this.codeScanButton = this.createWidget(Button, {
                                id: controlId + '_csb',
                                'class': this.classPrefix + 'codeScanIcon'
                            });
                            /*this.addHandler(on(this.codeScanButton.domNode, touch.press, lang.hitch(this, function (e) {
                                e.stopPropagation();
                            })));*/
                            this.codeScanButton.set('ontouchstart', 'return true;');
                        }
                        if (this['cssClass'].indexOf('editableText') < 0)
                            this['cssClass'] += ' editableText';

                        //If there's no lookup and codescan button and no children buttons go wide!
                        if (!this.hasLookup && !this.isCodeScannable && (this.children && this.children.length == 0)) {
                            if (this['cssClass'].indexOf('editableTextNoButton') < 0)
                                this['cssClass'] += ' editableTextNoButton';
                        }
                        this.labelClassName = 'editableLabel';
                    }
                    else {
                        if (this.hasLookup) {//needs lookup affordance css
                            if (this['cssClass'].indexOf('lookupText') < 0)
                                this['cssClass'] += ' lookupText';
                            this.labelClassName = 'editableLabel';
                            if (this.type != "date" &&
       								this.type != "datetime" &&
       								this.type != "time" &&
       								this.type != "duration") {
                                
                                //Adding this condition beause a double field with duration usage 
                                //should not be allowed enter the else below and should not 
                                //create a lookup button too.
                                if (this.usage != 'duration')  {
                                    this.createLookupButton();
                                }
                                
                            }
                        }
                        else {
                            if (this['cssClass'].indexOf('nonEditableText') < 0)
                                this['cssClass'] += ' nonEditableText';
                            this.labelClassName = 'nonEditableLabel';
                        }
                    }
                    this.errorButton = this.createWidget(Button, {
                        id: controlId + '_fieldMarker',
                        'class': this.classPrefix + 'fieldMarker',
                    });
                    this.addHandler(on(this.errorButton.domNode, tap, lang.hitch(this, function () {
                        this.ui.showMessage(this.exception.getMessage());
                    })));
                }
            }
            else {
                if (this['cssClass'].indexOf('nonEditableText') < 0)
                    this['cssClass'] += ' nonEditableText';
            }

            if (this['labelCss']) {
                this.labelClassName = this['labelCss'];
            }

            var runtimeRequired = this.required;
            if (!runtimeRequired && this.bound && this.validBinding) {
                if (this.getCurrentRecord()) {
                    runTimeMataData = this.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute);
                    runtimeRequired = runTimeMataData && runTimeMataData.required;
                    if (runTimeMataData.required) {
                        this.viewControl.requiredFields.push(this); //_ControlBase already adds if required in XML
                    }
                }
            }

            if (this.enableNumericKeyboard) {
                this.tbType='number';
            }
            this.textWidget = this.createWidget(tb, {
                id: controlId + ((this.editable && this.bound) ? "_tb" : "_output"),
                name: this.getId(),
                value: (this.bound && this.validBinding) ? this._attributeAsBindable(this.resourceAttribute) : this.getPropertyString('value'),
                //TODO - decide how we handle special types. Dates, times, etc...
                type: this.tbType,
                placeHolder: this.getPropertyString('placeHolder'),
                style: this.style,
                size: fldLength,
                maxLength: fldLength,
                'class': this.classPrefix + ((this['cssClass']) ? this['cssClass'] : '') + (runtimeRequired ? ' requiredText' : '')
            });
            this.focusNode = this.textWidget;
            var currentEnv = WL.Client.getEnvironment();
            if (tb == TextBox && (currentEnv == WL.Environment.IPHONE || currentEnv == WL.Environment.IPAD)) {
                //Little bit of a hack on iOS to stop capitalizing the username
                if (this.cssClass == 'loginUsername') {
                	this.textWidget.domNode.setAttribute('autocapitalize', 'off');
               	 	this.textWidget.domNode.setAttribute('autocorrect','off');
                }
            }
            if (tb == TextBox &&  this.tbType == 'password' && WL.Client.getEnvironment() == WL.Environment.PREVIEW) {
			//Turning off autofill at the widget level to ensure typing username password works in chrome simulator
               this.textWidget.domNode.setAttribute('autocomplete', 'new-password');
            }
            var control = this;
            var windows = (WL.Client.getEnvironment() == WL.Environment.WINDOWS8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8);
            this.addHandler(on(this.textWidget, 'blur', function () {
                if (windows) {
                	window.scrollTo(0, 0);
                }
            }));
            if (this.bound && this.validBinding) {
                //For some reason (possibly layout doesn't apply) text control with binding doesn't get 
                //started up in dialog so stateful binding doesn't work
                this.textWidget.startup();
            }

            if (tb == Output) {
                domAttr.set(this.textWidget.domNode, 'tabindex', '0');

                if (this.placeHolder && this.placeHolder.textMsg.length > 0) {
                    this._setNonEditablePlaceholder();
                    var resource = this.getResource();
                    this.addResourceWatchHandle(resource.getCurrentRecord().watch(this.resourceAttribute, lang.hitch(this, function (fieldName, oldValue, newValue) {
                        this._setNonEditablePlaceholder();
                    })));

                    this.addResourceWatchHandle(resource.onChange(lang.hitch(this, function (field, oldValue, newValue) {
                        if (this.textWidget && this.textWidget._beingDestroyed != true) {
                            setTimeout(lang.hitch(this, function () { this._setNonEditablePlaceholder(); }), 100);
                        }
                    })));
                }
            }
            domAttr.set(this.textWidget.domNode, {
            	'autocapitalize': 'off',
            	'autocorrect': 'off'
            });
            if (this.label) {
                this.labelFor = this.textWidget.id;
                this.labelObject = this.createWidget(Label, { control: this, required: runtimeRequired, role: this.role });
                this.labelElement = this.labelObject.build();
                
                domAttr.set(this.textWidget.domNode, {
                    'aria-labelledby': this.labelElement.id
                });

                this.addHandler(on(this.labelElement, tap, lang.hitch(this, function (e) {
                    dijitFocus.focus(this.textWidget.domNode);                   
                    //Need to check to see if we need to pop the lookup
                    this._handleTap(e);
                })));
                this.baseWidget.addChild(this.labelElement, 0);
            }
			if (this.bound && this.validBinding) {
				if(!this.editable && !this.lookup){
					this._setReadOnly(!this.editable); //if this was intentionally set in xml, use it
				}
				else{
					this._setReadOnly(this.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute).readonly);
				}
            }

            //Prevent scrolling whne focused on textbox and dragged. Not sure why we want to prevent, hence commentiing
            //We prevent this because otherwise the press event bubble to groupitem and transitions to new view.
			//Dojo bug in ListItem whre they have enable delayedStart
			if (tb != Output || this.hasLookup) {
            	this.addHandler(on(this.textWidget, touch.press, function (e) {
                    e.stopPropagation();
                }));
            }
           	this.baseWidget.addChild(this.textWidget);

            if (this.errorButton) {
                this.baseWidget.addChild(this.errorButton);
            }

            if (this.button) {
                this.lookup_init = this.dynamicBuild;
                this.addLookupButton(this.baseWidget);
                this.lookup_init = false;
            }

            //For non-editable lookups, allow clicks on text to launch the lookup
            if (this.lookup && tb == Output) {
                
            	//Respond to clicks on the placeholder text 
            	this.addHandler(on(this.textWidget, tap, lang.hitch(this, function (e) {
                   this._handleTap(e);
                })));
                
                //Respond to clicks on the main div
            	this.addHandler(on(this.baseWidget, tap, lang.hitch(this, function (e) {
                    this._handleTap(e);
                 })));
            }

            if (this.enableNumericKeyboard){
			//TODO pass in decimal and base size based on the number type cases
            	
            	if(WL.Client.getEnvironment() != WL.Environment.PREVIEW){
	            	try{
	            		// commented to fix defect 204884 we need to document that user with samsung device needs to use 
	            		//alternative keyboards in order to see the decimal simbol
	            		/*if(device.model.indexOf("SM-") == -1)
		            	{*/
		            		this.tbType = 'number';
		            		domAttr.set(this.textWidget.domNode, 'type', 'number');
		            	/*}*/
	            	}catch(err){
	            		Logger.errorJSON('Cannot set type to numeric textbox', err);
	            	}
            	}
            	
            	domAttr.set(this.textWidget.domNode, 'pattern', '[-+]?[0-9]*[\.,]?[0-9]*');
            	if(window.anywhere_validation_regex)
            		domAttr.set(this.textWidget.domNode, 'pattern', window.anywhere_validation_regex);
            	else 
            		domAttr.set(this.textWidget.domNode, 'pattern', '[-+]?[0-9]*[\.,]?[0-9]*');
                domAttr.set(this.textWidget.domNode, 'step', 'any');
            	domAttr.set(this.textWidget.domNode, 'autocomplete', 'off');
				domAttr.set(this.textWidget.domNode, 'autocorrect', 'off');
            	this.initNumericField(-1);
			}

            if (this.codeScanButton) {
                this.addCodeScanButton(this.baseWidget);
            }

            this.addHandler(on(this.textWidget, 'focus', function (e) {
                control.ui.hideCurrentMenu();
            }));

            var parentReturn = this.inherited(arguments);

            //turn off propagation for each of the children
            array.forEach(this.children, function (item, index) {
                if (item.built) {
                    Logger.trace(item);
                    this.addHandler(on(item.baseWidget, tap, lang.hitch(this, function (e) {
                        if (this.ui.currentMenu) {
                            e.stopPropagation();
                            this.ui.hideCurrentMenu();
                            return;
                        }

                        dijitFocus.focus(item.baseWidget.domNode);

                        e.stopPropagation();
                    })));
                }
            }, this);
            return parentReturn;
        },

        _handleTap: function(e) {
        	 if (domClass.contains(this.textWidget.domNode, 'lookupText')) {
                 if (this.ui.currentMenu) {
                     e.stopPropagation();
                     this.ui.hideCurrentMenu();
                     return;
                 }
                 if (!this.textWidget.readOnly) {
                     this.showMyLookup();
                 }
                 e.stopPropagation();
             }
        },
        
        initNumericField: function (precision) {

            this.cnumberutil = new ANumericUtil();
            this.cnumberutil.setDisplayValue(this, precision);
            this.cnumberutil.limitTextLength(15);
            this.cnumberutil.registerNumericTextBox();

        },
        
        setPrecisionForNumericField: function(precision){
        	if(this.cnumberutil)
        		this.cnumberutil.setDisplayValue(this, precision);
        	
        },

        createLookupButton: function () {
            //Adding a lookup button for selectable fields of type text
            this.button = this.createWidget(Button, {
                id: this.getId() + '_lookupIcon',
                'class': this.classPrefix + 'lookupIcon',
                'aria-label': this.label?this.label.textMsg + ' Lookup': 'Lookup'
            });
            
            //This prevents scrolling whien pressed on button and dragged. Commented. Not sure why prevent this
            /*this.addHandler(on(this.button.domNode, touch.press, lang.hitch(this, function (e) {
                e.stopPropagation();
            })));*/
            this.button.set('ontouchstart', 'return true;');
        },

        addLookupButton: function (container) {
            container.addChild(this.button);
            if (this.dynamicBuild &&
				!this.lookup_init &&
				this.num_attr == 'numvalue') {
                return;
            }

            this.addHandler(on(this.button, tap, lang.hitch(this, function (e) {
                if (this.ui.currentMenu) {
                    e.stopPropagation();
                    this.ui.hideCurrentMenu();
                    return;
                }
                if (this.textWidget.readOnly) {
                    dijitFocus.focus(this.button.domNode);
                }
                else{
                    this.showMyLookup();
                }
                e.stopPropagation();
            })));
        },

        // override platform.ui.control._BoundControlMixin.showMyLookup()
        showMyLookup: function () {
        	var self = this;
        	if(self.button){
        		self.blurThenfocusOnNode(self.button.domNode);
        	}
            if (!this.dynamicBuild || !this.modelData) {
                this.inherited(arguments);
            }
            else {
                self.getResource().setCurrentIndexByRecord(self.modelData);
                switch (self.type) {
                    case 'date':
                    case 'time':
                    case 'datetime':
                        self.application.ui.showLookup('Platform.DateTimeLookup', self);
                        break;
                    case 'duration':
                        self.application.ui.showLookup('Platform.DurationLookup', self);
                        break;
                    default:
                        self.application.ui.showLookup(self.lookup, self);
                        break;
                }
            }
        },

        addCodeScanButton: function (container) {
            container.addChild(this.codeScanButton);
            this.addHandler(on(this.codeScanButton, tap, lang.hitch(this, function (e) {
                if (this.ui.currentMenu) {
                    e.stopPropagation();
                    this.ui.hideCurrentMenu();
                    return;
                }
                dijitFocus.focus(this.codeScanButton.domNode);

                if (!this.textWidget.readOnly) {

                    // Code Scanning
                    var that = this;
                    var codeScanner = new CodeScanner("barcode");
                    codeScanner.scan().then(function (codeScannerResult) {
                        if (codeScannerResult != null && codeScannerResult !== "") {
                            if (that.textWidget && that.textWidget._beingDestroyed != true) {
                                that.application.parseScanResult(codeScannerResult, that);
                                that.textWidget.set('value', codeScannerResult.text);
                            }
                            // send focus back to the textfield
                            dijitFocus.focus(this.textWidget.domNode);

                        }
                        else {
                            // likely that the user use the back button, we can ignore this
                            Logger.trace("Looks like the user hit the back button on the barcode Scanning screen (activity)");
                        }

                        //following line needed to refresh UI for ETL devices returning from barcode scan
                        that.viewControl.refresh();

                    }, function (message) {
                        Logger.log(MessageService.createResolvedMessage(message.messageId, message.parameters));
                    });

                }

                e.stopPropagation();
            })));
        },

        getValue: function () {
            return this.textWidget.get('value');
        },

        getLabel: function () {
            return this.labelElement.domNode.innerHTML;
        },

        setLabel: function (newLabel) {
            this.labelElement.domNode.innerHTML = newLabel;
        },

        postCreate: function () {
            //			summary:
            //				To be implemented by children
            //
            //			description:
            //				Will be called after all controls are built and placed in the DOM
        },

        hasValue: function () {
            var value = this.getValue();

            return typeof value != 'undefined' && value != null && value != '';
        },

        setInvalid: function (throwable) {
            switch (true) {
                case (throwable instanceof PlatformRuntimeException && !(throwable instanceof PlatformRuntimeWarning)):
                    if (this.errorButton) {
                        domClass.add(this.errorButton.domNode, 'fieldMarkerError');
                    }
                	if (this.textWidget.domNode) {
                		domClass.add(this.textWidget.domNode, 'errorText');
                	}
                    break;
                default:
                	if (this.textWidget.domNode) {
                		domClass.remove(this.textWidget.domNode, 'errorText');
                		domClass.remove(this.textWidget.domNode, 'warningText');
                	}
                    if (this.errorButton) {
                        domClass.remove(this.errorButton.domNode, 'fieldMarkerError');
                        domClass.remove(this.errorButton.domNode, 'fieldMarkerWarning');
                    }
                    break;
            }
            this.inherited(arguments);
        },

        _setReadOnly: function (readOnly) {
            this.inherited(arguments);
            // set the textwidget's readonly property
            this.textWidget.set('readOnly', readOnly);
            if (readOnly) {
            	if (this.textWidget.domNode) {
            		domClass.add(this.textWidget.domNode, 'readonly');
            	}
                this.textWidget.set('placeHolder', '');
            } else {
            	if (this.textWidget.domNode) {
            		domClass.remove(this.textWidget.domNode, 'readonly');
            	}
                this.textWidget.set('placeHolder', this.getPropertyString('placeHolder'));
            }
            
			if(this.labelObject){
				this.labelObject.setReadOnly(readOnly);
			}

            // set the affordance appropriately on the lookup
            if (this.hasLookup) {
                if (this.button) {
                    // enable/disable the lookup button
                    this.setWidgetEnabled(this.button, !readOnly);
                }
                else {
                    // if there is no button set the affordance (no button and tb=output for datetime, duration)
                    if (readOnly) {
                    	if (this.textWidget.domNode) {
                    		domClass.remove(this.textWidget.domNode, 'lookupText');
                    		domClass.add(this.textWidget.domNode, 'nonEditableText');
                    	}
                    }
                    else {
                    	if (this.textWidget.domNode) {
                    		domClass.remove(this.textWidget.domNode, 'nonEditableText');
                    		domClass.add(this.textWidget.domNode, 'lookupText');
                    	}
                    }
                }
            }
            if (this.isCodeScannable) {
                if (this.codeScanButton) {
                    // enable/disable the codeScan button
                    this.setWidgetEnabled(this.codeScanButton, !readOnly);
                }
            }
        },

        _setRequired: function (required) {
            if (required) {
                if (this.textWidget.domNode) {
                    domClass.add(this.textWidget.domNode, 'requiredText');
                }
                if(this.viewControl){
                	this.viewControl.requiredFields.push(this);
                }
            }
            else {
                if (this.textWidget.domNode) {
                    domClass.remove(this.textWidget.domNode, 'requiredText');
                }
                if(this.viewControl){
                	this.viewControl.removeRequiredField(this);
                }
            }
            if(this.labelObject){
            	this.labelObject.setRequired(required);
            }
        },

        _setNonEditablePlaceholder: function () {
            if (this.textWidget.domNode && (!this.getValue() || this.getValue() == '')) {
                if (this.textWidget.domNode) {
                	this.textWidget.domNode.innerHTML = "<span class='placeholder'>" + this.placeHolder.textMsg + "</span>";
                }
            }
        },
        
        //this function was re-merged
        destroy: function () {
            this.inherited(arguments);
            if (this.codeScanButton){
            	this.codeScanButton.destroyRecursive();
            }
            if (this.errorButton){
            	this.errorButton.destroyRecursive();
            }
            if (this.textWidget){
            	this.textWidget.destroyRecursive();
            }
            if (this.labelObject){
            	this.labelObject.destroy();
            }
            if (this.button){
            	this.button.destroyRecursive();
            }
            if(this.labelElement){
            	domConstruct.destroy(this.labelElement);
            }
            this.codeScanButton = null;
            this.errorButton = null;
            this.textWidget = null;
        	if(this.labelObject){
        		this.labelObject.destroy();
                this.labelObject = null;
                this.labelElement = null;
        	}
            this.button = null;

            if (this.errorWatch) {
                this.errorWatch.remove();
                this.errorWatch = null;
            }

            this.focusNode = null;
            if (this.cnumberutil){
                if (this.cnumberutil.blur_listener){
                	this.cnumberutil.blur_listener.remove();
                	this.cnumberutil.blur_listener = null;
                }
                if (this.cnumberutil.key_listener){
                	this.cnumberutil.key_listener.remove();
                	this.cnumberutil.key_listener = null;
                }
                if (this.cnumberutil.del_listener){
                	this.cnumberutil.del_listener.remove();
                	this.cnumberutil.del_listener = null;
                }
                this.cnumberutil = null;
            }
            
            this.logger = null;
            // 257064: REGRESSION: PURPLE: Windows: Cannot select value from lookup view / fix reverted
            // check if platform is WINSOWS8 and control has a lookup
            if(WL.Client.getEnvironment() == WL.Environment.WINDOWS8 && this.hasLookup) {
            	// do nothing
            }
            else {
            	this.parentControl = null;
            }
            this.metaData = null;
            this.viewControl = null;
            this.modelData = null;    
        },
    });
});