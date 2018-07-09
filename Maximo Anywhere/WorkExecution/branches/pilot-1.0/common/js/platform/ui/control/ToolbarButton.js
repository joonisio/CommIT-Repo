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

define("platform/ui/control/ToolbarButton", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "dojox/mobile/ToolBarButton",
	     "dojo/_base/lang",
	     "dojo/touch",
	     "dojo/on",
	     "dijit/registry" ],
function(declare, ControlBase, ToolBarButton, lang, touch, on, registry) {
	return declare( [ ControlBase ], {
		display: true,
		
		constructor : function(options) {
			this._controlType = 'ToolbarButton';
		},
/**@memberOf platform.ui.control.ToolbarButton */
		build: function() {
		   var floatDir = this.ui.east;
		   if (this.floatDirection) {
		      floatDir = this.floatDirection; 
		   }
		   
		   var oldButton = registry.byId(this.getId());
		   if(oldButton){
			   oldButton.destroyRecursive(false);
		   }
		   this.baseWidget = this.createWidget(ToolBarButton, {
			   id: this.getId(),
			   icon: this.getImagePathFor(this.icon),
			   alt: this.alt,
			   'class' : this.cssClass ? this.cssClass : '',
			   style: (this.overFlow)?'float:'+floatDir+';margin-'+floatDir+':0px !important':'float:'+floatDir
		   });
			
		    if(this.transitionTo){ //do this instead of native moveTo of button to allow # and other navigation add-ons
		    	this.addHandler(on(this.baseWidget, touch.press, lang.hitch(this, function(){
					if(this.disabled){
						return;
					}
		    		this.ui.show(this.transitionTo, this.transition);
		    	})));
		    }
		    this.bindEvents();
    		on.emit(this.baseWidget, "datachange", {
    			bubbles: true,
    		    cancelable: true
    		});
		    return this.baseWidget;
		},

		setDisplay : function(display){
			this.display = display;
			this.inherited(arguments);
		},
		
		setWidgetEnabled : function(widget, enabled) {
			this.inherited(arguments);
			if(widget == this.baseWidget){
				this.disabled = !enabled;
			}
	    }
	});
});
