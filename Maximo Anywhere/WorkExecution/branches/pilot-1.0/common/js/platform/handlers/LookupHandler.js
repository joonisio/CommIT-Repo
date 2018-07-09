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

define("platform/handlers/LookupHandler", 
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/util/PlatformConstants",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/exception/PlatformRuntimeException",
	     "dojo/_base/array",
	     "dojo/_base/lang",
	     "dojo/on",
	     "dijit/registry" ],
function(declare, ApplicationHandlerBase, PlatformConstants, PlatformRuntimeWarning, PlatformRuntimeException, array, lang, on, registry) {
	return declare( ApplicationHandlerBase, {
		name: 'LookupHandler',
		
/**@memberOf platform.handlers.LookupHandler */
		initLookup: function(eventContext){ //used for lookups with selection controls such as dates / durations
    		var currentObject = this.application.ui.currentObjectStack[this.application.ui.currentObjectStack.length-1];
    		var resourceSet = currentObject.getResource();
    		var currentResource = resourceSet.getCurrentRecord();
    		var value = currentResource.get(currentObject['resourceAttribute']);
    		eventContext.getCurrentRecord().set(currentObject['lookupAttribute'], value);
		},
		
		_getReturnAttributes : function(eventContext, returnObject){
			var returnAttributes = null;
			if(eventContext.viewControl && eventContext.viewControl.returnAttributes && eventContext.viewControl.returnAttributes.children ) {
				returnAttributes = eventContext.viewControl.returnAttributes.children;
			}
			else {
	            returnAttributes = [ { 'sourceAttribute': returnObject['lookupAttribute'], 'targetAttribute': returnObject['resourceAttribute'] } ];
			}
            array.forEach(returnAttributes, function(returnAttribute, index) {
            	returnAttribute['oldValue'] = returnObject.getCurrentRecord().get(returnAttribute["targetAttribute"])
            });
            return returnAttributes;
		},
		
		SetSelection: function(eventContext){
			this._applySelection(eventContext);
		},
		
		_resetValues: function(returnAttributes){
			
		},
		
		_applySelection : function(eventContext, clear){
			var currentObject = this.application.ui.currentObjectStack[this.application.ui.currentObjectStack.length-1];
			var returnAttributes = this._getReturnAttributes(eventContext, currentObject);
			try {
				var resourceSet = currentObject.getResource();
				
				if(resourceSet){
    				var target = resourceSet.getCurrentRecord();
    				// process all of the returnAttribute entries in the returnAttributes object  
    				// if there's no returnAttributes object, we're just setting one field so create a map with a single returnAttribute
    				array.forEach(returnAttributes, function(returnAttribute, index) {
                        var valueToSet = (typeof clear != 'undefined' && clear)? null: eventContext.getCurrentRecord().get(returnAttribute["sourceAttribute"]);
                        if(returnAttribute["targetAttribute"] == currentObject.resourceAttribute){
                            currentObject.tempValue = valueToSet;
                        }
   					    target.set(returnAttribute["targetAttribute"], valueToSet);
    			    });
				}
			    //SUCCESSFULLY SET THEM ALL				
				this._leaveLookup(eventContext);
			} catch (platformException) {
				switch (true) {				
    				case (platformException instanceof PlatformRuntimeException):
    					//TODO: should this be at the field level more than the lookup level?
    					array.forEach(returnAttributes, function(returnAttribute, index) {
    						target.set(returnAttribute["targetAttribute"], returnAttribute.oldValue);
    				    });
    					this.application.showMessage(platformException.getMessage());
    					break;
    				default:
    					this._leaveLookup(eventContext);
    					break;
				}
			}					
			
		},

		_leaveLookup : function(eventContext,cancelled){
			var returnObject = this.application.ui.currentObjectStack.pop();
			if(!cancelled && returnObject && returnObject.dataValidate){
				var returnView = registry.byId(this.application.ui.viewHistory[this.application.ui.viewHistory.length-2].id);
				on.once(returnView, 'AfterTransitionIn', lang.hitch(returnObject, function(moveTo, dir, transition, context, method) {
					this.application.log('[TRACE] calling '+this.dataValidate['className']+'.'+this.dataValidate['method'], 1, []);
					if (this.dataValidate.method.indexOf('async') != 0 ) {
						//Fire a validate event to indicate that the field has changed.
						this.dataValidate['class'][this.dataValidate['method']](this);
					}
                    var tempValue = this.tempValue;
                    if(this.tempValue){
                        delete this.tempValue;
                        this.textWidget.set('value', tempValue) ;
                    }
    			}));
			}
			if(eventContext.viewControl){
				eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
			}
			else {
				eventContext.ui.back(); //Some lookups are dialogs
			}
		},
		
		Cancel: function(eventContext){
			this.cleanup = false;
			this._leaveLookup(eventContext,true);
		},
		
		Clear: function(eventContext){
			this._applySelection(eventContext, true);
		}
	});
});
