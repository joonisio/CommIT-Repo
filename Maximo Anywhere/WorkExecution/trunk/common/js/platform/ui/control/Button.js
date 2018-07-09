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

define("platform/ui/control/Button",
	   ["dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/ui/control/_StatefulControlMixin",
	     "dojox/mobile/Button",
	     "dojox/mvc/getStateful",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dijit/focus",
	     "dojo/on",
	     "dojo/touch",
	     "dojo/dom-class",
	     "dojo/dom-attr",
	     "dojo/dom-style",
	     "dojox/gesture/tap",
	     "dojo/_base/event",
	     "platform/logging/Logger"],
function (declare, ControlBase, StatefulControlMixin, Button, getStateful, lang, array, dijitFocus, on, touch, domClass, domAttr, domStyle, tap, event, Logger) {
    return declare([ControlBase, StatefulControlMixin], {
        label: '',
        transtionTo: null,
        image: null,
        disabled: false,
        primary: false,
        statefulProperties: ['label', 'disabled', 'primary', 'image'],

        constructor: function (options) {
            this._controlType = 'Button';
        },

/**@memberOf platform.ui.control.Button */
        build: function () {
            //			summary:
            //				Build the control
            //		
            //			description:
            //				This is where we setup all internals and create any widgets
            var props = {};
            var control = this;
            var label = this.getLabelString();
            if (!this.style) {
                this.style = '';
            }
            props['id'] = this.getId();
            props['style'] = '';
            props['aria-label'] = label;
            props['role'] = 'button';
            if (this.image) {
                props['class'] = 'leafControl imageButton';
                props['style'] = 'background: url(' + this.getImagePathFor(this.image) + ') no-repeat;';
                props['showLabel'] = false;
            }
            else {
                props['class'] = 'leafControl mblButtonText';
                props['label'] = label;
            }
            if (this.primary || this['default']) {
                props['type'] = 'submit';
            }
            props['parentControl'] = this;

            if (this['cssClass']) {
                props['class'] += ' ' + this['cssClass'];
            }
            props['class'] = this.classPrefix + props['class'];
            props['style'] += ' ' + this.style;
            this.baseWidget = this.createWidget(Button, props);

            this.addHandler(on(this.baseWidget, tap.hold, lang.hitch(this, function (e) {
                e.stopPropagation();
            })));


            this.setLabel(label);
            this.setImage(this.image);
            this.setPrimary(this.primary);
            if (this.primary || this['default']) {
                if (this.viewControl) {
                    this.viewControl.setDefaultButton(this);
                } else if (this.dialogControl) {
                	this.dialogControl.setDefaultButton(this);
                }
            }

            this.addHandler(on(this.baseWidget, 'click', function (e) {
                event.stop(e);
            }));
            this.addHandler(on(this.baseWidget, tap, function (e) {
                e.target.disabled = true;
                Logger.trace("[Button]: Setting the disable attribute to true on dom id: " + e.target.id);
                var clickedNode = e.target;
                setTimeout(function () {
                    Logger.trace("[Button]: Setting the disable attribute to false on dom id: " + clickedNode.id);
                    clickedNode.disabled = false;
                }, 1000);
				var	blurNode = dijitFocus.curNode? dijitFocus.curNode:document.activeElement;
				if(blurNode){
					on.emit(blurNode, 'blur', {
							bubbles: true,
							cancelable: true
					});
            	}
                if (control.onTap) {
                    control.onTap();
                }
                else if (control.transitionTo) {
                    e.stopPropagation();
                    if (control.ui.currentMenu) {
                    	control.ui.hideCurrentMenu();
                        return;
                    }
                    dijitFocus.focus(this);
                    control.ui.show(control.transitionTo, control.transtion);
                }
              
            }));
            return this.inherited(arguments);
        },

        setImage: function (/*String*/image) {
            if (this.image) { //cannot switch from text to image button
            	this.baseWidget.set('style', 'background-color: transparent; background-image: url(' + this.getImagePathFor(image) + '); background-repeat: no-repeat;');
                this.image = image;
                domClass.add(this.baseWidget.domNode, 'imageButton');
                this.baseWidget.set('label', '');
            }
        },

        setLabel: function (/*String*/label) {
            if (this.image) {
                domAttr.set(this.baseWidget.domNode, 'title', label);
                domAttr.set(this.baseWidget.domNode, 'value', label);
                domAttr.set(this.baseWidget.domNode, 'alt', label);

            }
            else {
                this.baseWidget.set('label', label);
            }

            domAttr.set(this.baseWidget.domNode, 'aria-label', label);
        },

        setPrimary: function (/*boolean*/primary) {
            var cName = 'mblSpecialButton';
            if (primary) {
                if (this.baseWidget.domNode) {
                    domClass.add(this.baseWidget.domNode, cName);
                }
            }
            else {
                if (this.baseWidget.domNode) {
                    domClass.remove(this.baseWidget.domNode, cName);
                }
            }
        },
        
        destroy: function () {
        	if (this.baseWidget){
            	this.baseWidget.set('style', 'background-image: ""');
        	}
            this.inherited(arguments);
            this.viewControl = null;
            this.logger = null;
            this.parentControl = null;
        }


    });
});
