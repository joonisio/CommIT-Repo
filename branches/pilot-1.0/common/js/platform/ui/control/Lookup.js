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

define("platform/ui/control/Lookup",
		[ "dojo/_base/declare",
		  "platform/ui/control/Button",
		  "platform/ui/control/View",
		  "platform/translation/MessageService", 
		  "platform/ui/control/Footer"],
function(declare, Button, View, MessageService, Footer) {
	return declare(View,{
		initialized: false,
		
		constructor : function(options) {
		   this.showOverflow = false;
		   this.showCancelButton = true;
		},
		
/**@memberOf platform.ui.control.Lookup */
		shouldDisplayBackButton : function() {
		   return false;
		},
		
		build : function(){
			if(!this.initialized){
    			for(childIndex in this.children){
    				var child = this.children[childIndex];
    				if(child._controlType=='List'){
    					if(!child.listItemTemplate.eventHandlers){
    						child.listItemTemplate.eventHandlers = new Array();
    					}
    					child.listItemTemplate.eventHandlers.push( 
    						{
    							event : 'click',
    					        method : 'SetSelection',
    					        'class' : 'platform.handlers.LookupHandler'
    						});
    				}
    			}
    			
    			this.footer = new Footer({
    				id: this.getId()
    			});
    			
    			this.footer.addChild(new Button({
    				id: this.getId() + '_cancel', 
    			    label :  MessageService.createStaticMessage('cancelbutton').getMessage(),
    			    eventHandlers : [ {
    			        event : 'click',
    			        method : 'Cancel',
    			        'class' : 'platform.handlers.LookupHandler'
    			    } ]
    			}));
    			this.footer.addChild(new Button({
    				id: this.getId() + '_clear', 
    			    label : MessageService.createStaticMessage('clearbutton').getMessage(),
    			    eventHandlers : [ {
    			        event : 'click',
    			        method : 'Clear',
    			        'class' : 'platform.handlers.LookupHandler'
    			    } ]
    			}));
    			this.addChild(this.footer);
    			if(this.filterClass && this.filterMethod){
    				if(!this.eventHandlers){
						this.eventHandlers = new Array();
					}
    				this.eventHandlers.push( 
					{
						event : 'initialize',
				        method : this.filterMethod,
				        'class' : this.filterClass
					});
    			}
    			this.initialized = true;
    			
			}
			return this.inherited(arguments);
		},
	
		addChild : function(child) {
	    	switch(child._controlType){
    	    	case 'ReturnAttributes':
    	    		this.returnAttributes = child;
    	    		child.setParentReference(this);
    	    		return;
    	    		break;
    	    	default:
    	    		this.inherited(arguments);
    	    		break;
        	}
		},
		
		isLookup : function(){
			return true;
		},
		
		show: function(){
			if (this.getResource() && this.getResource().getCurrentIndex() > 0){
				//Reset the index to 0 so users will be at the first page when coming back  
				// into a lookup.  Doing this to insure the search header will be visible.
				this.getResource().setCurrentIndex(0);
			}
			this.inherited(arguments);
		},
		
		createMyResource : function(resourceId){
			if(resourceId){
				this.getRequiredResource(resourceId).loaded = false;
			}
			this.inherited(arguments);
		}
	});
});
