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

define("platform/ui/control/Link",
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/ui/widget/Label",
	     "platform/ui/widget/Image",
	     "dojo/dom-class",
	     "dojo/dom-construct",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dojo/dom-attr",
	     "dojo/touch",
	     "dojox/gesture/tap"
	    ],
function(declare, ControlBase, Label, Image, domClass, domConstruct, lang, array, on, domAttr, touch, tap){
	return declare( [ ControlBase ], {
    	editable: false,
    	label: null,
 	
		constructor : function(options) {
			this._controlType = 'Link';
		},

/**@memberOf platform.ui.control.Link */
		build: function(){
//			summary:
//				build the control
//
//			description:
//				This is where we setup all internals and create any widgets
			this.baseWidget = (new Label({control: this, style: this.style, role: this.role})).build();
			if(this.image){
				this.imageWidget = this.createWidget(Image, {
					control: this,
					src: this.getImagePathFor(this.image)
				}).build();
				domConstruct.place(this.imageWidget.domNode, this.baseWidget.domNode, 'first');
			}
			if(this.hasClickEvent()){
				domClass.add(this.baseWidget.domNode, 'textlink');
			}
			if(this.transitionTo) {
				this.addHandler(on(this.baseWidget, touch.press, lang.hitch(this, function(e) {
					e.stopPropagation();
					this.ui.show(this.transitionTo, this.transtion);
				})));
			}
			return this.inherited(arguments);
		},

		convertEvent: function(event){
			var newEvent = event.toLowerCase();
			switch(newEvent){
			case 'click':
				return tap;
			}
			return newEvent;
		},
		
	    setVisibility : function(vis) {
	    	domAttr.set(this.baseWidget.domNode, 'style', 'visibility:' + ((vis) ? 'visible' : 'hidden') + ';');
	    	if (this.imageWidget) {
		    	domAttr.set(this.imageWidget.domNode, 'style', 'visibility:' + ((vis) ? 'visible' : 'hidden') + ';');
	    	}
	    },
	    
	    setLabel: function(newLabel) {
	       if (this.baseWidget) {
	          this.baseWidget.domNode.innerText = newLabel;
	          if (this.imageWidget) {
	             domConstruct.place(this.imageWidget.domNode, this.baseWidget.domNode, 'first');
	          }
	       }
	    },

		postCreate: function() {
//			summary:
//				To be implemented by children
//
//			description:
//				Will be called after all controls are built and placed in the DOM
		    this.inherited(arguments);
		}
	});
});
