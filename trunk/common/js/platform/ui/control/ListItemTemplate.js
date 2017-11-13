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

define("platform/ui/control/ListItemTemplate", 
	[ "dojo/_base/declare", 
          "platform/ui/control/Container", 
          "dojo/_base/array", 
          "dojo/on",
          "dojo/dom-style",
          "dojo/touch",
          "dojo/query",
          "dojo/dom-class",
          "dojo/_base/event",
          "dojox/gesture/tap"],
function(declare, Container, array, on, domStyle, touch, query, domClass, event, tap) {
    return declare(Container, {
		LIST_LONGPRESS : 'Platform.ListLongPressDialog',

		constructor : function(options) {
		    this._controlType = 'ListItemTemplate';
		},

/**@memberOf platform.ui.control.ListItemTemplate */
		buildChildren : function() {
		    array.forEach(this.children, function(aControl) {
			aControl.setParentReference(this);
			if (aControl.build && !aControl.getBaseWidget()) {
			    aControl.createMyResource(aControl.resource);
			    aControl.onList = true;
			    aControl.listControlId = this.listControlId;
			    var aWidget = aControl.build(this["listControlId"]);
			    if (aControl.typeOf("Button")) {
			    	aControl.addHandler(on(aWidget, tap, function(e) {
					    event.stop(e);
					}));
			    	aControl.addHandler(on(aWidget, touch.press, function(e) {
					    event.stop(e);
					}));
			    }
			    // this.baseWidget.addChild(aWidget);
			    this._addChildToBaseWidget(aControl, aWidget);
			}
		    }, this);
		},

		addChild : function(child) {
	    	switch(child._controlType){
    	    	case 'Actions':
    	    		this.itemactions = child;
    	    		child.setParentReference(this);
    	    		return;
    	    		break;
    	    	default:
    	    		this.inherited(arguments);
    	    		break;
        	}
		},
		
	    setDisplay : function(vis) {
		    if (!this.hasValidBaseWidget()) {
			    return;
		    }
		    domStyle.set(this.baseWidget.domNode.parentNode, 'display', ((vis) ? '' : 'none'));
	    },

	    setVisibility : function(vis) {
	    	this.setDisplay(vis);
	    },

	    convertEvent: function(event){
			var newEvent = event.toLowerCase();
			switch(newEvent){
			case 'click':
				if(this.primary || this['default']){
					return newEvent;
				}
				return tap;
			}
			return newEvent;
		}
    });
});
