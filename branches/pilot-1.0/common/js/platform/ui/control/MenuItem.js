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

define("platform/ui/control/MenuItem", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "dijit/MenuItem", 
	     "dijit/MenuSeparator", 
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dojo/query", 
	     "dojo/dom-style",
	     "dojo/touch",
	     "dojo/_base/event",
	     "dojox/gesture/tap"],
function(declare, ControlBase, DijitMenuItem, MenuSeparator, lang, array, on, query, domStyle, touch, event, tap) {
	return declare( [ ControlBase ], {
		separator: false,

		constructor : function(options) {
			this._controlType = 'MenuItem';
			this.menuId = options.menuId;
		},
		
/**@memberOf platform.ui.control.MenuItem */
	    bindEvents : function() {
	    	this.ui.bindEvents(this.menuContextViewId?this.ui.getViewFromId(this.menuContextViewId):this);
	    },
		
		build: function(){
			var itemType = DijitMenuItem;
			if(this.label=="-"){
				itemType = MenuSeparator;
				this.separator = true;
			}
			this.baseWidget = this.createWidget(itemType, {
				id: this.id,
				label: this.getLabelString(),
				iconClass : (this.cssIconClass ? this.cssIconClass : ''),
				'class' : this.cssClass ? this.cssClass : '' 
			});
			if(this.width){
				labelNode = query(".dijitMenuItemLabel", this.baseWidget.domNode);
				domStyle.set(labelNode[0], 'width', this.width);
			}
			this.addHandler(on(this.baseWidget, tap, lang.hitch(this, function(){
				if(this.disabled){
					return;
				}
				if(this.transitionTo){
					this.ui.show(this.transitionTo, this.transtion);
				}
				else if(this.link){
					this.ui.openWindow(this.link);
				}
				if (!this.hasClickEvent()){
					this.ui.hideCurrentMenu();  // We can't call this is there is a click event because the dojo tap need the menu widget to be present for the bound click/tap to be called
				}
			})));
			this.bindEvents();
			return this.baseWidget;
		},
		
		destroy: function() {
			this.baseWidget.destroyRecursive();
		}
	});
});
