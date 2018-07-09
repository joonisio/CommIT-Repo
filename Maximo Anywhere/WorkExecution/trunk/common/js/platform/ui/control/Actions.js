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

define("platform/ui/control/Actions", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ContainerControlBase",
	     "dojo/_base/lang",
	     "dojo/_base/array" ],
function(declare, ContainerControlBase, lang, array) {
	return declare( ContainerControlBase, {
		eventHandlers: new Array(),
		
		constructor : function(options) {
			this._controlType = 'Actions';
			lang.mixin(this, options);
		},
		
/**@memberOf platform.ui.control.Actions */
	    prepareForShow: function(){
	    	this.setParentReference(this.parentControl);
	    	
	    	this.reset();
	    	//emit would not work so we call into this directly before displaying the actions
		    array.forEach(this.eventHandlers, function(eventHandler, i) {
		    	if (eventHandler.event == 'show') { //only event that it allowed.
    		    	var handlerClass = this.application[eventHandler['class']];
    			    if (!handlerClass) {
    			    	return;
    			    }
				    if(!handlerClass[eventHandler.method]){
				    	return;
				    }
				    this.ui.hideCurrentMenu();
				    handlerClass[eventHandler.method](this);
	    		}
		    }, this);

	    },
	    
		reset: function(){
			 array.forEach(this.children, function(action, index) {
				 action.show();
			 });
		},
		
	    addChild : function(child) {
		    if (!child.id) {
		    	var labelId = "";
		    	var label = child.label;
		    	if(label){
		    		labelId = label.textMsg.replace(/ /g,"_"); 
		    	};
			    child.id = child.transitionTo?child.transitionTo:labelId;
		    }
	    	this.children.push(child);
	    	this.childKeys[child.id] = this.children.length - 1;
	    }
	});
});
