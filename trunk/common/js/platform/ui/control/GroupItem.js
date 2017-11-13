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

define("platform/ui/control/GroupItem",
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ContainerControlBase",
	     "dojo/_base/array",
	     "dojo/_base/lang",
	     "dojo/on",
	     "dojo/_base/event",
	     "dojox/mobile/ListItem",
	     "dojo/touch",
	     "dojox/gesture/tap",
	     "dijit/focus",
	     "platform/translation/MessageService" ],
function(declare, ContainerControlBase, array, lang, on, event, ListItem, touch, tap, dijitFocus, MessageService) {
	return declare( ContainerControlBase, {
	    baseWidget: null,

		constructor : function(options) {
			this._controlType = 'GroupItem';
			if(!options ||!options.transition){
				this.transition = 'slide';
			}
		},
	    
/**@memberOf platform.ui.control.GroupItem */
		build: function(){
//		summary:
//			Build the control
//
//		description:
//			This is where we setup all internals and create any widgets
    		this.baseWidget = this.createWidget(ListItem, {
    			id: this.getId(),
    			variableHeight : true,
    			'class': (this['cssClass'])?this['cssClass']:'',
    		});
    		
    		if(this.transitionTo && this.transitionTo.length>0){
    			this.baseWidget.set('clickable', true);
    		    this.addHandler(on(this.baseWidget.domNode, tap, lang.hitch(this, function(e) {
					if(this.ui.currentMenu){
    		    		this.ui.hideCurrentMenu();
    					e.stopPropagation();
    		    		return;
    		    	}
    		    	dijitFocus.focus(this.baseWidget.domNode);
			    	this.ensureRecordFocus();
				    this.ui.show(this.transitionTo, this.transition);
    			    event.stop(e);
    		    })));
    		}
    		
    		return this.inherited(arguments);
	    },
	    
	    buildChildren: function(){
		    array.forEach(this.children, function(item){
   			item.setParentReference(this);
    			if(item.build && !item.getBaseWidget()){
    			    	item.createMyResource(item.resource);
    				var itemWidget = item.build();
    				if(item.typeOf("Button")){
    					this.addHandler(on(itemWidget, touch.press, function(e) {
    		        		event.stop(e);
    				    }));
    					this.addHandler(on(itemWidget, tap, function(e) {
    		        		event.stop(e);
    				    }));
    				}
    			    //this.baseWidget.addChild(itemWidget);
    				this._addChildToBaseWidget(item, itemWidget);
    			}
		    }, this);
		},
	    
	    addTemplate : function(template) {
			this.template = template;
		},
	    
		postCreate: function() {
		    this.inherited(arguments);
		    
		    this.baseWidget.startup();

		    //Fixing the dojo bug in ListItem
		    //which is -> Sets the role to li element instead of its child button element. Wrong usage of this
		    //Resetting the correct roles
		    if(this.baseWidget.rightIconNode){
		    	this.baseWidget.domNode.childNodes[0].childNodes[0].setAttribute('role', 'button');
		    	this.baseWidget.domNode.childNodes[0].childNodes[0].setAttribute('alt', MessageService.createStaticMessage('details').getMessage());
		    }
		    this.baseWidget.domNode.setAttribute('role', 'listitem');
		}
	});
});
