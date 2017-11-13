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

define("platform/ui/control/_ControlBase", [
        "dojo/Evented",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/on",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dijit/layout/ContentPane",
        "dojo/touch",
        "dijit/focus",
        "dijit/registry",
        "platform/format/FormatterService",
        "dojox/mvc/at",
        "platform/logging/Logger",
        "platform/ui/DeviceEnv",
        "platform/exception/PlatformRuntimeException",
        "platform/util/PlatformConstants",
        "dojox/gesture/tap",
		 "platform/pushNotification/PushNotificationService" ], 
function(Evented, array, declare, lang, on, domAttr, domClass, domStyle, domConstruct, ContentPane, touch, dijitFocus, registry, formatterService, at, Logger, DeviceEnv, PlatformRuntimeException, PlatformConstants, tap, PushNotificationService) {
	return declare([Evented], {
	    labelClassName : 'controlLabel horizontal',
	    built : false, 
	    required : false,
	    enabled : true,
	    onList : false, 
	    requiredIndicator: false,
	    classPrefix : "WL_ ",
	    splitterPane: null,
	    baseWidget: null,
	    resourceWatchHandles: null,
	    currentRecord: null,
	    resourceObject: null,
	    metadataWatchHandles: null,
	    handlers: null,
	    
	    // summary:
	    // Base object for all controls
	    //
	    // description:
	    // This base object will handle all generic event bindings and state
	    // setup / application
	    constructor : function(options) {
		    this.requiredResources = {};
	    	lang.mixin(this, options);
		    this.logger = Logger;
		    this.actions = null;
		    if (options) {
		    	if(options.resource){
		    		if(options.attribute){
		    			this.resource = this.resource +'.'+ options.attribute; 
		    		}
		    		this.requiredResources[this.resource] = {};
		    	}
		    	if (options.cssClass) {
				    this['class'] = options.cssClass;
			    }
		    }
		    this.resourceWatchHandles = new Array();
		    this.resourceWatchHandleIDs = new Array();
		    this.metadataWatchHandles = new Array();
		    this.handlers = new Array();
		    this.IMAGE_PATH = 'js/platform/ui/control/images/' + DeviceEnv.getScreenDensity() + "/";
		    this.IMAGE_APP_PATH = 'images/' + DeviceEnv.getScreenDensity() + "/";
	    },

/**@memberOf platform.ui.control._ControlBase */
	    getImagePathFor: function(imageFile){
	    	function injectScreenDensityIntoPath(imageFileNoTrailingSlash){
	    		var pathParts = imageFileNoTrailingSlash.split('/');
	    		var fileName = pathParts.pop();
	    		pathParts.push(DeviceEnv.getScreenDensity());
	    		pathParts.push(fileName);
	    		return pathParts.join('/');	    		
	    	}

	    	var path = imageFile;
	    	if (typeof imageFile === 'string' && 
	    		imageFile.charAt(0) === '/'){
	    		path = injectScreenDensityIntoPath(imageFile.substr(1));  //remove the first '/'

	    	} else {
	    		path = this.IMAGE_PATH + imageFile;

	    	}
	    	return path;
	    },

	    addRequiredResources: function(requiredResources){
	    	for(resourceName in requiredResources){
	    		this.requiredResources[resourceName] = requiredResources[resourceName]; 
	    	}
	    	//this.requiredResources.concat(requiredResources);
	    	if(this.resource && !this.requiredResources[this.resource]){ //don't overwrite the other one defined in the required resources as it may have children
			    this.requiredResources[this.resource] = {};
	    	}
		    this.setRelatedResourceNames(this.requiredResources);
	    },
	    
	    addPlatformResource: function(requiredResource){
	    	this.requiredResources[requiredResource] = {};
	    },
	    
	    setRelatedResourceNames: function(resources, path){
	    	if(!resources){
	    		return;
	    	}
	    	var keys = Object.keys(resources); //must do this because of dot notation
    		for(key in keys){
                var resourceName = keys[key];
                if(path){
                	var newKey = path+'.'+resourceName;
                	resources[newKey] = resources[resourceName];
                	resources[newKey]['parentResourceId'] = path;
                	delete resources[resourceName];
                	this.setRelatedResourceNames(resources[newKey]['related'], newKey);
                }
                else {
                	this.setRelatedResourceNames(resources[resourceName]['related'], resourceName);
                }
    		}
	    	
	    },
	    
	    setParent : function(parentControl) {
		    // summary:
		    // Set the parent control
		    //
		    // description:
		    //
		    this.parentControl = parentControl;
		    this.viewControl = (this._controlType == "View") ? this : parentControl.viewControl;
		    this.dialogControl = (this._controlType == "Dialog") ? this : parentControl.dialogControl;
	    	this.splitterPane = parentControl.splitterPane;
	    },

	    typeOf : function(type) {
		    return this._controlType == type;
	    },

	    getParent : function(parentControl) {
		    // summary:
		    // Get the parent control if there is one
		    //
		    // description:
		    //
		    return this.parentControl;
	    },

	    getProperty : function(property) {
		    return this.application.getProperty(property);
	    },

	    getLabelString : function() {
		    return this.getPropertyString('label');
	    },

	    getPropertyString : function(propertyName) {
		    if (!this[propertyName]) {
			    return '';
		    }
		    var propertyValue = this[propertyName];
		    return (propertyValue.getMessage) ? propertyValue.getMessage(this) : propertyValue;
	    },

	    getHandlerObject : function() {
		    // summary:
		    // Get the handler object
		    //
		    // description:
		    // Must be defined locally
		    if (!this.handlerObject) {
			    this.handlerObject = this.application[this.handlerClassName];
		    }
		    if (!this.handlerObject) {
			    this.application.log("noClass", 0, [ this._controlType, this.id, this.handlerClassName ]);
		    }
		    return this.handlerObject;
	    },

	    getLabelResolverObject : function() {
		    // summary:
		    // Get the handler object
		    //
		    // description:
		    // Must be defined locally
		    if (!this.labelResolver && this.label.resolver.className) {
			    this.labelResolver = this.application[this.label.resolver.className];
			    if (!this.labelResolver || !this.labelResolver[this.label.resolver.functionName]) {
				    this.application.log('invalidlabelresolver', 0, [ this.label.resolver.className, this.label.resolver.functionName, this.id ]);
				    return null;
			    }
		    }
		    return this.labelResolver;
	    },

		convertEvent: function(event){
			var newEvent = event.toLowerCase();
			switch(newEvent){
    			case 'click':
    				return tap;
			}
			return newEvent;
		},

	    bindEvents : function() {
	    	this.ui.bindEvents(this);
	    },

	    createMyResources : function() {
		    this.logger.timerStart("Create Resources:" + this.id, 1);
		    for ( var resourceId in this.requiredResources) { //must do this in two steps so that they are all marked as loaded = false before we request any
			    var resource = this.requiredResources[resourceId]; 
			    resource["loaded"] = false;
			    if(!this.ui.movingBack){
			    	delete resource["rowNum"];
			    	var relatedResources = resource['related'];
			    	if(relatedResources) {
			    		var keys = Object.keys(relatedResources); //must do this because of dot notation
			    		for(key in keys){
			    			relatedResources[keys[key]].loaded = false;
			    		}
			    	}
			    }
		    }
		    for ( var resourceId in this.requiredResources) {
			    this.createMyResource(resourceId);
		    }
	    },

	    createMyFilteredResource : function(resourceId, filter, queryBase, isExactMatch) {
	    	this.application.createResource(this, this.setResourceObject, resourceId, queryBase, resourceId, filter, isExactMatch);
	    },

	    createMyResource : function(resourceId) {
		    if (!resourceId || typeof resourceId == 'undefined') {
			    return;
		    }
		    var queryBase = (this.resourceId==this.resource)?this.queryBase:null;
		    var resourceObj = this.application.getResource(resourceId, queryBase, resourceId);
		    if (resourceObj && resourceObj._currentIndex > -1) {
		    	var reqRes = this.getRequiredResource(resourceId);
		    	if (reqRes) {
		    		reqRes.rowNum = resourceObj._currentIndex;
		    	}
		    }

		    if (!resourceObj) {
			    this.application.createResource(this, this.setResourceObject, resourceId, queryBase, resourceId);
		    } else {
			    this.setResourceObject(resourceObj);
		    }
	    },

	    getBaseWidget : function() {
		    return this.baseWidget;
	    },

	    ensureRecordFocus : function(item) {
		    var resource = this.getResource();
		    var itemIndex = 0;
	    	if(item){
	    		itemIndex = parseInt(domAttr.get(item.domNode, 'resourceIndex'))
	    		resource.setCurrentIndex(itemIndex);
	    	}
		    var currentRecord = this.getCurrentRecord();
		    if (resource && currentRecord) {
			    var resourceRecord = resource.getCurrentRecord();
			    if (resourceRecord) {
                    resource.setCurrentIndexByRecord(currentRecord);
                    var appResource = this.application.getResource(resource.name);
                    if(appResource && (appResource != this.getResource())){
                        if(!appResource.setCurrentIndexByRecord(currentRecord)){
                            return false;
                        }
                    }
			    }
		    }
		    return true;
	    },

	    build : function() {
		    if (!this.ui && this.getParent()) {
			    this.ui = this.getParent().ui;
		    }
		    if (this.setupStates) {
			    this.setupStates();
		    }
		    this.bindEvents();
		    this.built = true;
		    if(this.viewControl && this.required){
		    	this.viewControl.requiredFields.push(this);
		    }
			if(this.debugOnly && this.application && !this.application.debug){
				if(this.baseWidget && this.baseWidget.domNode){
					domStyle.set(this.baseWidget.domNode, 'display', 'none');
				}
			}
		    return this.baseWidget;
	    },

	    initializeActions: function(){
	    	if(!this.actions || !this.actions.children){
	    		return;
	    	}
	    	this.actions.initialize(this);
	    },
	    
	    getCurrentRecord : function() {
		    if (this.currentRecord) {
			    return this.currentRecord;
		    }
		    if (this.resourceObject) {
			    return this.resourceObject.getCurrentRecord();
		    }
		    var parentControl = this.getParent();
		    if (parentControl) {
			    return parentControl.getCurrentRecord();
		    }
		    return null;
	    },

	    getRequiredResource: function(id,resources){
	    	if(!resources){
	    		resources = this.requiredResources;//start at top
	    	}
    		if(resources[id]){
    			return resources[id]; 
    		}
	    	var keys = Object.keys(resources); //must do this because of dot notation
    		for(key in keys){
    			resource = resources[keys[key]];
    			if(resource['related']){
    				var target = this.getRequiredResource(id,resource['related']);
    				if(target){
    					return target;
    				}
    			}
    		}

	    },
	    
	    resourcesReady : function(id) { //only supports one level of related data
		    if (this.application.getObjectSize(this.requiredResources) > 0) {
			    var resourceObj = this.application.getResource(id, this.queryBase, id);
			    var thisResource = this.getRequiredResource(id);
			    var rowNum = thisResource.rowNum;
			    if (resourceObj && typeof rowNum != 'undefined') {
			    	if(resourceObj.data.length>0 && rowNum>=0 && resourceObj.data.length>rowNum){
			    		resourceObj.setCurrentIndex(rowNum);
			    	}
			    }
			    if(resourceObj.getCurrentRecord()){
				    var relatedResources = thisResource['related'];
				    //Does this have related resources?
				    if(relatedResources) {
				    	var keys = Object.keys(relatedResources); //must do this because of dot notation
				    	var waitingForSome = false;
			    		for(key in keys){
			    			if(!relatedResources[keys[key]].loaded){
			    				this.createMyResource(keys[key]);
			    				waitingForSome = true;
			    			}
			    		}
			    		if(waitingForSome){
			    			return;
			    		}
		    		}			    	
			    }
		    	
		    	var parentResourceId = thisResource['parentResourceId'];
		    	//Does this one have siblings?
		    	if(parentResourceId) {
		    		var parentResource = this.getRequiredResource(parentResourceId);
		    		var siblingResources = parentResource['related'];
		    		thisResource["loaded"] = true;
		    		for(propname in siblingResources){
		    			var relatedResource = siblingResources[propname];
		    			if(!relatedResource['loaded']){
		    				return;
		    			}
		    		}
		    		//mark parent as loaded because all children are loaded
		    		parentResource['loaded'] = true;
		    		
		    	}
		    	else {
		    		thisResource["loaded"] = true;
		    	}
			    
			    for ( var resourceId in this.requiredResources) {
			    	var eachResource = this.getRequiredResource(resourceId);
			    	var isLoaded = eachResource["loaded"];
				    if ( !isLoaded || isLoaded != true) {
					    return;
				    }
			    }
		    }
		    if (this.show) {
		    	this.logger.timerEnd("Create Resources:" + this.id, 1);
		    	this.logger.timerStart("show view :" + this.id, 1);
			    this.show();
			    if(this.id == WL.application.ui.primaryViewID){
			    	var push = new PushNotificationService();
			    	var latterPush = push.laterDisplayNotification();
			    	latterPush.then(function(result){
						if(result){
							WL.application.ui.show('Platform.PushNotificationDialog');
						}

					});
			    }
		    }
	    },

	    setMyResourceObject : function(resource) {
		    this.resourceObject = resource;
		    var currentRecord = resource.getCurrentRecord();
		    if (currentRecord) {
			    this.updateRecordData();
		    }
	    },

	    setResourceObject : function(resource) {
		    if (resource.resourceID == this.resource) {
			    this.setMyResourceObject(resource);
		    }
		    
		    this.resourcesReady(resource.resourceID);
	    },

	    updateRecordData : function(data) {
		    // used for extensions
	    },

	    getId : function() {
	    	var id = (this.id) ? this.id + '_' + this._controlType : '';
    		var parent = this.getParent();
			if(parent && parent.listControlId!=='undefined' && parent.listControlId != null){
   				this.listControlId = parent.listControlId;
   				this.onList = true;
   				return this.listControlId + (id?'_' + id:'');
	    	}
			return this.listControlId?this.listControlId+(id?'_'+id:''):id;
	    },

	    set : function(prop, value) {
		    // summary:
		    // To be implemented by children
		    //
		    // description:
		    // Will be called after all controls are built and placed in the DOM
		    var baseWidget = this.getBaseWidget();
		    if (baseWidget) {
			    baseWidget.set(prop, value);
		    }
	    },

	    getResource : function() {
		    // summary:
		    // Get the resource object
		    //
		    // description:
		    // Walks up hierarchy if one is not found
		    if (this.resourceObject) {
			    return this.resourceObject;
		    }
		    var parentControl = this.getParent();
		    if (parentControl) {
			    return parentControl.getResource();
		    }
		    return null;
	    },

	    getRecordDataObject : function() { 
		    var resource = this.getResource();
		    return resource[resource.getCurrentIndex];
	    },

	    setParentReference : function(parent) {
		    this.application = parent.application;
		    this.ui = parent.ui;
		    this.setParent(parent);
	    },

	    getLocalizedString : function(key, params) {
		    return this.application.labelManager.getLocalizedString(key, params);
	    },

	    hasValidBaseWidget : function() {
		    return (this.baseWidget && this.baseWidget.domNode && !this.baseWidget._beingDestroyed);
	    },

	    setEnabled : function(enabled) {
		    if (!this.hasValidBaseWidget()) {
			    return;
		    }
		    this.setWidgetEnabled(this.baseWidget, enabled);
		    this.enabled = enabled;
	    },

	    setWidgetEnabled : function(widget, enabled) {
		    if (!widget) {
			    return;
		    }
		    widget.set('disabled', !enabled);
		    //domStyle.set(widget.domNode, 'opacity', ((enabled) ? '1' : '.4'));
		    if(enabled){
		    	domClass.remove(widget.domNode, 'disabled');
		    }else{
		    	domClass.add(widget.domNode, 'disabled');
		    }
	    },

	    canSetDisplay : function() {
		    return true;
	    },

	    setDisplay : function(vis) {
		    if (!this.hasValidBaseWidget()) {
			    return;
		    }
		    if (this.canSetDisplay()) {
			    this.setWidgetDisplay(this.baseWidget, vis);
		    } else {
			    this.application.log('Hiding/showing of {0} is not allowed. Enable/Disable instead.', 2, [ this._controlType ]);
			    this.setWidgetEnabled(this.baseWidget, vis);
		    }
	    },

	    setWidgetDisplay : function(widget, vis) {
		    if (!widget) {
			    return;
		    }
		    domStyle.set(widget.domNode, 'display', ((vis) ? '' : 'none'));
	    },

	    setVisibility : function(vis) {
		    if (!this.hasValidBaseWidget()) {
			    return;
		    }
		    this.setWidgetVisibility(this.baseWidget, vis);
	    },

	    setWidgetVisibility : function(widget, vis) {
		    if (!widget) {
			    return;
		    }
		    widget.set({
		    	'style' : 'visibility:' + ((vis) ? 'visible' : 'hidden') + ';' 
		    });
	    },

	    supportsClick : function() {
		    return true;
	    },

	    hasClickEvent : function() {
		    if (this.clickable == undefined) {
			    this.clickable = false;
			    if (!this.supportsClick()) {
				    return this.clickable;
			    }
			    if (this.transitionTo) {
				    this.clickable = true;
			    } else if (this.eventHandlers && this.eventHandlers.length > 0) {
				    array.forEach(this.eventHandlers, lang.hitch(this, function(eventHandler) {
					    if (eventHandler.event.toLowerCase() == 'click') {
						    this.clickable = true;
					    }
				    }));
			    }
		    }
		    return this.clickable;
	    },

	    render : function() {
		    on.emit(this, 'render', {
		        bubbles : true,
		        cancelable : true
		    });
	    },

	    postCreate : function() {
		    // summary:
		    // To be implemented by children
		    //
		    // description:
		    // Will be called after all controls are built and placed in the DOM
	    },

	    _removeResourceWatches: function(){
		    var resource = this.getResource();
		    if (resource) {
			    array.forEach(this.resourceWatchHandles, function(watchHandle) {
			    	if(watchHandle.unsubscribe){
			    		watchHandle.unsubscribe();
			    	}
			    	else if(watchHandle.remove){
			    		watchHandle.remove();
			    	}
			    });
			    this.resourceWatchHandles = new Array();
			    this.resourceWatchHandleIDs = new Array();

			    array.forEach(this.metadataWatchHandles, function(handler) {
			    	handler.unwatch();
			    });
			    this.metadataWatchHandles = new Array();
		    }

	    },

	    destroy : function() {
		    // summary:
		    // An entry point to allow the control to clean up itself and
		    // possibly free memory
		    //
		    // description:
		    // Should be implemented by control classes that extend this class
		    this._removeResourceWatches();
	    	array.forEach(this.handlers, function(handler){
	    		if(handler.remove){
			    	handler.remove();
	    		}
		    });
	    	this.handlers = new Array();
		    if (this.baseWidget) {
			    if (this.baseWidget.destroyRecursive) {
				    this.baseWidget.destroyRecursive();
			    } 
			    else if (this.baseWidget.domNode && this.baseWidget.domNode.parentNode) {
			    	this.baseWidget.domNode.parentNode.removeChild(this.baseWidget.domNode);				    
			    }
			    if (this.baseWidget.domNode){
					domConstruct.destroy(this.baseWidget.domNode);
			    }
			    this.baseWidget.parentControl = null;
			    this.baseWidget.params = null;
			    this.baseWidget.layoutInsertAt = null;
			    this.baseWidget = null;
		    }
		    this.splitterPane = null;
		    if (this.modelData)
		    	this.modelData = null;
		    if(this.metaData){
			    this.metaData = null;
		    }
		    if (this.focusNode){
		    	this.focusNode = null;
		    }

	    },
	    
	    
	    addMetaDataWatchHandle : function(watch) {
		    this.metadataWatchHandles.push(watch);
	    },
	    
	    /**
	     *  Returns true if a watch handler was added to this control with the given id. 
	     */
	    hasResourceWatch: function(watchID){
	    	return (array.indexOf( this.resourceWatchHandleIDs, watchID) >= 0 );
	    },
	    
	    /**
	     * 
	     * @param watch - the watch handle to add to the control
	     * @param watchId - A unique identifier to allow the hasResourceWatch to determine if the watch has already been added.
	     * 		This maybe used by handler functions that add a watch so it can check to see if the watch exists before adding it.
	     */
	    addResourceWatchHandle : function(watch, watchId) {
		    this.resourceWatchHandles.push(watch);
		    if (watchId){
			    this.resourceWatchHandleIDs.push(watchId);
		    }
	    },

	    addHandler : function(handle){
	    	this.handlers.push(handle);
	    },
	    
	    focus : function(){
	    	if(this.focusNode){
	    		dijitFocus.focus(this.focusNode);
	    	}
	    },
	    
	    blurThenfocusOnNode : function(domNode){
	    	//Ensure that blur is called on current control.  Needed especially for windows environment to 
	    	//ensure validation/ModelData update of a bound text field before handling the tap event on
	    	//the control/component associated with the passed in domNode
            var blurNode = dijitFocus.curNode ? dijitFocus.curNode : document.activeElement;
            if (blurNode) {
                on.emit(blurNode, 'blur', {
                    bubbles: true,
                    cancelable: true
                });
            }
            dijitFocus.focus(domNode);
	    },
	    
	    highlight : function(mark){
	    	if (this.baseWidget.domNode) {
	    		domClass[mark?'add':'remove'](this.baseWidget.domNode, 'hightlightControl');
	    	}
	    },
	    
	    createWidget : function(widget, props){
	    	return this.ui.createWidget(widget, props);
	    },
	    
	    getDataCss : function(){
	    	var css = '';
	    	if(this.cssAttributes){
    			this.cssAttributes = this.cssAttributes.split(',');
	    		if(typeof this.cssAttributes === 'string' ){
	    			this.cssAttributes = [this.cssAttributes];
	    		}
	    		var record = this.getCurrentRecord();
	    		if(record){
	    			array.forEach(this.cssAttributes, function(attribute){
	    				var value = record.get(attribute);
	    				if(!isNaN(value)){ //cannot have numeric css class
	    					value = '_' + value;
	    				}
		    			css += ' ' + value;
	    			});
	    		}
	    	}
	    	return css;
	    }
	    	    
	});
});
