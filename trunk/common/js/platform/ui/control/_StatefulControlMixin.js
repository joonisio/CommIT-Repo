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

define("platform/ui/control/_StatefulControlMixin",
	[ "dojo/_base/declare",
	  "dojo/_base/lang",
	  "dojo/on",
	  "dojo/_base/array",
	  "dojox/mvc/getStateful",
	  "dojo/Stateful"
], function(declare, lang, on, array, getStateful, Stateful) {
	return declare([Stateful], {
		statefulProperties : [],
		constructedOptions: {},

		//TODO make a lot of this private / package where possible
		
	    constructor : function(options) {
		    resourceAttribute : null;
		    resource : null;
		    states : null;
    		if(options){// && options.states) {
				//this.constructedOptions = options;
				this.constructedOptions = {};
        	    array.forEach(this.statefulProperties, function(option){
        	    	if(options[option]){
        	    		this.constructedOptions[option] = options[option];
        	    	}
        	    	else if(this[option]!='undefined'){
        	    		this.constructedOptions[option] = this[option];
        	    	}
        	    }, this);
    		}
	    },

/**@memberOf platform.ui.control._StatefulControlMixin */
	    setupStates : function() {
            // summary:
            // Method called by the parent container to allow the control to build itself
            //
            // description:
            // This method must return a dom node to be appended to the dom tree
	    	if(!this.states){ //no states to setup
	    		return;
	    	}
    	    for (index in this.statefulProperties) {
    	    	 this.watch(this.statefulProperties[index], function(name, oldValue, value){
    	    		 // Do something based on the change
   	    			 this.setProperty(name, value);
    	    	 });
    	    }

    		var currentRecord = this.getCurrentRecord();
    		if(this.resourceAttribute && currentRecord){
    			this.watchObj = {
					resource: currentRecord,
					resourceAttribute: this.resourceAttribute
    			};
    		}
    		if(this.states) {
    			if(this.watchObj && this.watchObj.resource && this.watchObj.resourceAttribute ) {
    				this.applyState(this.watchObj.resource[this.watchObj.resourceAttribute]);
    				this.addResourceWatchHandle(this.watchObj.resource.watch(this.watchObj.resourceAttribute, lang.hitch(this, function(attrName, oldValue, newValue){
        		    	this.applyState(newValue);
        		    })));
    			}
    			var resource = this.getResource();
    		    if(resource && !this.onList) {
    		    	this.addResourceWatchHandle(resource.onChange(lang.hitch(this, function(attrName, oldValue, newValue){
    		    		var currentRecord = this.getCurrentRecord();
    		    		if (!currentRecord){ //it may be removed from the modeldataset and now the modeldataset is empty
    		    			return;
    		    		}
    		    		this.applyState(currentRecord.get(this.watchObj.resourceAttribute));
    		    		this.addResourceWatchHandle(currentRecord.watch(lang.hitch(this, function(attrName, oldValue, newValue){
    		    			this.applyState(resource.getCurrentRecord().get(this.watchObj.resourceAttribute));
    		    		})));
    		    	})));
    		    }
    		}
    		return this.inherited(arguments);
	    },

	    setResource : function(resource) { //SHOULD ONLY BE USED TO CREATE LOCAL resource AT RUNTIME 
            //		summary:
            // 			Set the resource object
            //
            // 		description:
            //
		    if (!resource.declaredClass || resource.declaredClass != 'dojo.Stateful') {
		    	resource = getStateful(resource);
		    }
		    this.resource = resource;
	    },

	    getResourceList : function() {

    		// summary:
    		// Get the resource object
    	    //
    		// description:
    		// Walks up hierarchy if one is not found
	    	return this.resourceList;
	    },

	    getResourceAttribute : function() {
            // summary:
            // Get the resource attribute
            //
            // description:
            // Walks up hierarchy if one is not found
		    if (this.resourceAttribute) {
		    	return this.resourceAttribute;
		    }
		    return null;
	    },

	    setProperty: function(name, value){
	    	value = this.application.getProperty(value);
	    	var setterName = "set"+name.charAt(0).toUpperCase()+name.substring(1);
	    	var setter = this[setterName];
	    	if(setter){
	    		this[setterName](value);
	    	}
	    	else if(this.baseWidget){
	    		this.baseWidget.set(name, value);
	    	}
	    	this[name] = value; // make sure we set it on the control
	    },
	    
	    initialState: function(){
	    	if(this.states){
    	    	array.forEach(this.statefulProperties, function(option){
    	    		if(array.indexOf(Object.keys(this.constructedOptions), option)>-1){ //simply this.constructedOptions[option] returns false with booleans
    	    			this.set(option, this.getProperty(this.constructedOptions[option]));
    	    		}
    	    	}, this);
	    	}
	    },
	    
	    isValidState: function(stateId) {
	    	return (typeof stateId != 'undefined' && this.states && this.states[stateId]);
	    },
	    
	    setState: function(stateId) {
	    	if(!this.isValidState(stateId)){
	    		return; //cannot set an invalid state
	    	}
	    	if(this.watchObj && this.watchObj.resource && this.watchObj.resourceAttribute ){
	    		this.getCurrentRecord().set(this.watchObj.resourceAttribute, stateId);
	    	}
	    },
	    
	    applyState : function(stateId) {
            // summary:
            // Apply all state properties to this object
            //
            // description:
            // State must exist on this element and will be applied as is when this is called
	    	if(!this.isValidState(stateId)){
	    		if(typeof this.defaultState == 'undefined'){
	    			return; //invalid state passed in and no default provided. Do nothing at all.
	    		}
	    		stateId = this.defaultState;
	    	}
	    	this.initialState();
		    if(this.states != null) {
	    		if(!stateId){
	    			stateId = this.defaultState;
	    			if(!stateId){
	    				return; //nothing to apply (no default set)
	    			}
	    		}
	    		var newState = this.states[stateId];
	    		if(newState) {
		    	    for (property in newState) {
		    	    	this.set(property, this.application.getProperty(newState[property]));
		    	    }
		    	    this.stateId = stateId;
		    	}
	    		if(this.baseWidget.domNode){
		    		on.emit(this.baseWidget.domNode, "CHANGESTATE", { //have to emit to the domNode, not the widget
		    		    bubbles: false,
		    		    cancelable: false
		    		});
	    		}
		    }
	    },
	    
	    build: function(){
			this.initialState();
	    	return this.inherited(arguments);
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
