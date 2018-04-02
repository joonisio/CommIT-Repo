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

define("platform/ui/control/_BoundControlMixin", 
	[	"dojo/_base/declare",
	    "dojo/_base/lang",
	 	"dojox/mvc/at",
	 	"dojo/on",
	 	"dojo/query",
	 	"dojo/_base/array",
        "platform/util/PlatformConstants", 
	 	"platform/format/FormatterService",
	 	"platform/translation/MessageService",
	 	"platform/exception/PlatformRuntimeException",
	 	"platform/warning/PlatformRuntimeWarning",
	 	"platform/logging/Logger"], 
function(declare, lang, at, on, query, array, PlatformConstants, formatterService, MessageService, PlatformRuntimeException, PlatformRuntimeWarning, Logger){
	return declare( [], {
	    readOnly : false,
	    modelData : null,
	    metaData: null,

/**@memberOf platform.ui.control._BoundControlMixin */
	    build : function(){
	    	var baseWidget = this.inherited(arguments);
	    	//Need to reset the databindings if I'm in split pane mode, because I rebuild the existing widget.
	    	//TODO: THIS BREAKS Specification Attribute Bindings (see defect  215398) for required/readonly, so need to fix this before enabling Split Pane!
			if(this.ui.combinedViews && !this.onList){
				this._resetDataBindings();
			} else {
				//Old databinding callbacks
				var resource = this.getResource(); 
				if (resource){
					this.addResourceWatchHandle(resource.onChange(lang.hitch(this, function(field, oldValue, newValue){
						if(this.textWidget && this.textWidget._beingDestroyed != true && this.getResource().getCurrentRecord()){
							this.textWidget.set('value', (this.bound && this.validBinding)? this._attributeAsBindable(this.resourceAttribute) : this.getPropertyString('value'));
						}
					})));
				}
			}
			this.baseWidget.startup();
			return baseWidget;
	    },
	    
		binding: function(){
			if(this.value){
				return; //don't bind if a value was given.
			}
			this.bound = true;
			if(!this.resourceAttribute){
				this.bound = false;
				return;
			}
			var resource = this.getResource();
			if(resource) {
				this.validBinding = false;
				//this.type = 'text';
				this.bindRuntimeMetaData(resource);
				this.bindMetaData(resource);
				if(this.type=='invalid'){
					var cls = this['class'];
					if(!cls) {
						cls = '';
					}
					cls += 'invalidBinding';
					this['class'] = cls;
				}
				else {
					this.type = this.getDojoDataType();
				}
			}
		},		
		
		bindRuntimeMetaData: function(resource){
			if (resource.getCurrentRecord()){
				var metaData = resource.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute);
				//Only set the watches if it's a valid attribute name
	    		if(metaData) {
					var readonlywatch = metaData.watch("readonly",
							lang.hitch(this, function(id,oldval,newval){
		    					//call something in the UI to update
								Logger.log("!! Setting the readonly value of "+this.resourceAttribute+"."+id+" from "+oldval+" to "+newval);
								if(this._setReadOnlyByMetaData){
									this._setReadOnlyByMetaData(newval);
								}
		    				}));
					this.addMetaDataWatchHandle(readonlywatch);
		    		var requiredwatch = metaData.watch("required",
		    				lang.hitch(this, function(id,oldval,newval){
		    					//call something in the UI to update
		    					Logger.log("!! Setting the required value of "+this.resourceAttribute+"."+id+" from "+oldval+" to "+newval);
		    					if(this._setRequiredByMetaData){
		    						this._setRequiredByMetaData(newval);
		    					}
		    					if (!newval){
			    					//User may have tried to leave the view with the field required and control was highlighted.  Since 
		    						//it's no longer required, make sure it's unhighlighted
		    						if(this.highlight){
		    							this.highlight(false);
		    						}
		    					}
		    				}));
		    		this.addMetaDataWatchHandle(requiredwatch);
	    		}
			}	
		},
		
		_setReadOnlyByMetaData: function (newval) {
			if(this['_setReadOnly']){
				if(this.editable === false && !this.hasLookup){ //if marked as readonly in the xml it should never be changed by the resource.
					newval = true;
				}
				this._setReadOnly(newval);
			}
		},
		
        _setRequiredByMetaData: function (newval) {
        	if(this['_setRequired']){
        		this._setRequired(newval);
        	}
        },

		bindMetaData: function(resource){
	    	try {
	    		this.metaData = resource.getMetadata().fields[resource.getMetadata().keys[this.resourceAttribute]];
	    		if(!this.metaData) {
	    			throw 0;
	    		}
	    		if(this.type!='password'){
	    			this.type = this.metaData.dataType.toLowerCase();
	    			if(this.metaData.usage){
	    				this.usage = this.metaData.usage.toLowerCase();
	    			}
	    		}
	    		
	    		this.validBinding = true;
	    	}
	    	catch (error){
	    		this.application.log('Attribute [{0}] Does not exist within Resource [{1}]', 1, [this.resourceAttribute, resource.resourceID]);
	    		this.type = 'invalid';
	    		
			    this['cssClass'] += ' invalidBinding';
			    this.value = (MessageService.createStaticMessage('InvalidBindingNoRecord').getMessage());
	    	}
	    },
	    
	    _resetDataBindings: function(){
	    	var resource = this.getResource();
	    	if(!resource || !resource.getCurrentRecord() || !this.validBinding){
	    		return;
	    	}
	    	this._removeResourceWatches();
	    	this.binding();
	    	var metaData = resource.getCurrentRecord().getRuntimeFieldMetadata(this.resourceAttribute);
	    	metaData.set('readonly', metaData.readonly);
	    	metaData.set('required', metaData.required);
			var bound = this.bound && this.validBinding;
	    	var attribute = this.resourceAttribute;
			this.addResourceWatchHandle(resource.onChange(lang.hitch(this, function(field, oldValue, newValue){
				if(this.textWidget && this.textWidget._beingDestroyed != true && this.getResource().getCurrentRecord()){
					this.textWidget.set('value', bound? this._attributeAsBindable(this.resourceAttribute) : this.getPropertyString('value'));
					this._resetDataBindings();
					var metaData = resource.getCurrentRecord().getRuntimeFieldMetadata(attribute);
					this._setReadOnlyByMetaData(metaData.readonly?metaData.readonly:false);
					this._setRequiredByMetaData(metaData.required?metaData.required:false);
				}
			})));

	    },
	    
	    //May not be needed. Would use to convert to dojo widgets, but may no do so.
	    getDojoDataType: function() {
	    	var dojoDatatype = this.type;
	    	switch(dojoDatatype) {
	    	//could add conversions here
    		case 'string':
    			dojoDatatype = 'text';
    			break;
    		default:
    			//do nothing
    			break;
	    	}
	    	return dojoDatatype;
    	},
	    
    	getFieldInfo: function(infoId) {
	    	var info = null;
	    	if(this.metaData){
	    		info = this.metaData[infoId];
	    	}
	    	return info;
    	},
    	
		showMyLookup: function() {
			//If I have stored my resource, I need to update the current index to support
			//multiple resources with lookups on the same page
			if (this.modelData) {
				this.getResource().setCurrentIndexByRecord(this.modelData);
			}
	    	switch(this.type) {
		    	case 'date':
		    	case 'time':	
		    	case 'datetime':
		    		this.ui.showLookup('Platform.DateTimeLookup', this);
	    			break;
		    	case 'duration':
		    		this.ui.showLookup('Platform.DurationLookup', this);
	    			break;
		    	case 'double':
		    		if(this.usage=='duration'){
			    		this.ui.showLookup('Platform.DurationLookup', this);
		    		}
		    		else if(this.usage !== 'date' && this.usage !== 'datetime' && this.usage !== 'time'){
		    			this.ui.showLookup(this.lookup, this);  
		    		}
	    			break;	    			
	    		default:
	    			this.ui.showLookup(this.lookup, this);
	    			break;
	    	}
			
		},

	    postCreate : function(){
		    this.inherited(arguments);
		    if (this.validBinding){
				var resource = this.getResource();
				if(resource && resource.getCurrentRecord() && resource.getCurrentRecord().isReadOnly()) {
					this._setReadOnly(true);
				}
		    }
		},
	
	    _attributeAsBindable : function(attributeName) {
		    // summary:
		    // constructs a data binder to be used in an input control such as
		    // text or checkbox
		    // and listen to/update changes in a stateful modelData object
	    	
	    	this.modelData = this.getCurrentRecord();     
	    	//Need to keep track of the current record for launching the lookup
		    if (this.modelData !== null) {
		    	var modelData = this.modelData;
			    var metadata = modelData.getMetadata();
			    if (metadata !== null) {
				    var userLocale = this.application.getUserLocale();
				    var attributeInfo = metadata.getField(attributeName);
				    if (attributeInfo !== null) {
				    	var dataType = metadata.getDataType(attributeInfo);				    	
				    	var self = this;
				    	
					    return at(modelData, attributeName).transform({
					        format : function(value) {	
					        	var theValueToDisplay = modelData.getPendingOrOriginalValue(attributeName);
					        	if (value!=null && theValueToDisplay != value) {
					        		//This mismatch means that the value was set through code, not through the UI, we need to get the latest value
					        		theValueToDisplay = value;
					        	}
					        	theValueToDisplay = formatterService.toDisplayableValue(theValueToDisplay, dataType, userLocale, {usage: attributeInfo["usage"] || null, places: attributeInfo["precision"] || null, attributeName : attributeName, maxSize: attributeInfo["maxSize"] || null});
					        	return self.formatDisplayedValue(theValueToDisplay);
					        },
					        parse : function(value) {
					        	
					        	// Do not trigger validate during undo.
					        	if (modelData.isUndoInProgress())
					        	{
					        		return value;
					        	}
					        	try{
					        		//format before any business logic or field handlers
					        		if(value == modelData._pendingValues[attributeName]){
					        			modelData.clearPendingValue(attributeName);
					        			return value;
					        		}
					        		var newValue = formatterService.fromDisplayableValue(value, attributeInfo.dataType, userLocale, {usage: attributeInfo["usage"] || null, places: attributeInfo["scale"] || null, maxSize: attributeInfo["maxSize"] || null});
					        		if(self.dataValidate){
                                        modelData.setPendingValue(attributeName, newValue);
					        			self.application.log(PlatformConstants.LOG_TRACE+'calling '+self.dataValidate['className']+'.'+self.dataValidate['method'], 1, []);
					        			if (self.dataValidate.method.indexOf('async') == 0) {
					        				self.application.showBusy();
					        				var result = self.dataValidate['class'][self.dataValidate['method']](self);
					        				result.then(function() {
												self.setInvalid();
												modelData.clearPendingValue(attributeName);
												return newValue;					        					
					        				});
					        				result.otherwise(function(error) {
												switch (true) {
												case (error instanceof PlatformRuntimeException):
													self.setInvalid(error);
													self.application.showMessage(error.getMessage());
													break;
												default: 
													Logger.error(error);
													break;
												return newValue;
												}
					        				});
					        				result.always(function() {
						        				self.application.hideBusy();
					        				});
					        			}
					        			else {
					        				self.dataValidate['class'][self.dataValidate['method']](self);
					        			}					        				
					        		}
									self.setInvalid();
									
									// Clear the pending value only if the format is not changed
									// so validation would not trigger
									if (newValue == value)
									{
										modelData.clearPendingValue(attributeName);
									}
									return newValue;
					        	}catch (throwable) {
									switch (true) {
										case (throwable instanceof PlatformRuntimeException):
											self.setInvalid(throwable);
											self.application.showMessage(throwable.getMessage(), function(){
												delete self.getResource()['validateErrorShown'];
											});
											self.getResource()['validateErrorShown']=true;
											break;
										default: 
											Logger.error(throwable);
											break;
									}									
					        	}
					        	return value;
					        }
					    }).direction(this.editable==true?at.both:at.from);
				    }
			    }
		    }
		    var returnValue = null;
		   
		    this['cssClass'] += ' invalidBinding';
		    returnValue = (MessageService.createStaticMessage('InvalidBindingNoRecord').getMessage());
		    
		    return returnValue;
	    },

		formatDisplayedValue : function(value){ //allows additional display formatting for non-editable values
			if(this.editable == false){
				var modelData = this.getCurrentRecord();
			    if (modelData !== null) {
				    var metadata = modelData.getMetadata();
				    if (metadata !== null) {
					    var attributeInfo = metadata.getField(this.resourceAttribute);
					    if(attributeInfo){
					    	if(attributeInfo.dataType == 'datetime'){
					    		return value.replace('    ','&nbsp;&nbsp;&nbsp;&nbsp;');
					    	}
					    }
				    }
			    }
			}
			return value;
		},
		
	    setInvalid : function(error){
	    	if(error){
	    		this.exception = error;
	    	}
	    	else {
	    		this.exception = null;
	    		this.highlight(false);
	    	}
	    	this.ui.getCurrentViewControl().manageException(this, error);
	    }
	});
});
