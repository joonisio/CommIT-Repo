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

define("platform/ui/control/Application", 
	[   "dojo/_base/declare",
        "platform/ui/control/_ContainerControlBase",
        "dijit/layout/ContentPane",
        "dojo/dom-construct",
        "dojo/Stateful",
        "dojox/mvc/getStateful",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/on",
        "platform/logging/Logger",
        "platform/ui/layout/_LabelManager",
        "platform/model/ModelService",
        "dojox/mobile/SimpleDialog",
        "dojox/mobile/Button",
        "dojo/_base/window",
        "dojo/dom-attr",
        "dojo/Deferred",
        "platform/ui/DeviceEnv",
        "platform/ui/util/OrientationManager",
        "platform/ui/util/OrientationEventListenerMixin",
        "dojox/html/styles",
        "platform/translation/MessageService",
        "platform/util/CurrentTimeProvider",
        "platform/util/PlatformConstants",
        "dojo/topic",
        "dojox/gesture/tap",
        "dojo/query",
        "platform/ui/control/BusyIndicator",
        "platform/store/_ResourceMetadataContext"], 
function(declare, ContainerControlBase, ContentPane, domConstruct, Stateful, getStateful, lang, array, on, Logger, LabelManager, ModelService,
        Dialog, Button, baseWindow, domAttr, Deferred, DeviceEnv, OrientationManager, OrientationEventListenerMixin, styles, MessageService, CurrentTimeProvider, 
        PlatformConstants, topic, tap, query, BusyIndicator, ResourceMetadataContext) {
	/**@class platform.ui.control.Application */
	return declare([ OrientationEventListenerMixin ], {
	    constructor : function(options) {	  
		    this._controlType = 'Application';
		    this.application = this;
		    this.horizontalLabels = true;
		    this.resourceMap = {};
		    this.hideBusyWaitTime = 200;
		    this.hideBusyCtr = 0;
		    this.ssoEnabled = false;
		  
		    // this.inherited(arguments);
		    // Setup default services
		    this.setupWL();
		    if (this.WL) {
			    this.addService(this.WL, 'WL');
			    if (!options || !options.langCode) { // allows override for testing
				    this.langCode = this.WL.App.getDeviceLanguage();
			    }
			    if (!options || !options.locale) { // allows override for testing
				    this.locale = this.WL.App.getDeviceLocale();
			    }
			    // defect 92286 - must use - as separator
			    this.langCode = (this.langCode || "").replace("_","-");
			    this.locale = (this.locale || "").replace("_","-");
		    }
		    this.ssoEnabled = (options && options.ssoEnabled) ? options.ssoEnabled : false;
		    this.combinedViews = (options && options.combinedViews) ? options.combinedViews : false;
		    this.requiredRole = (options && options.requiredRole) ? options.requiredRole : null;
		    this.defaultLangCode = (options && options.defaultLangCode) ? options.defaultLangCode : 'en';
		    this.logLevel = (options && options.logLevel) ? options.logLevel : 0;
		    this.debug = (options && options.debug && (options.debug == true || options.debug == 'true')) ? true : false;
		    if (this.debug && this.logLevel < 2) {
			    this.logLevel = 2;
		    }
		    //Need to initialize the logger with our application loglevel.
		    Logger.init({
				logLevel : this.logLevel,
				filters : options?options.logFilters:null
     	   	});
		    this.resources = {};

		    this.addService(ModelService, "modelService");
		    this.addService(
		    	new LabelManager({
		        	langCode : this.langCode,
			        defaultLangCode : this.defaultLangCode
			    }));
		    // Setup default services
		    this.useLongLists = false;
		    if (options) {
			    array.forEach(options.handlers, function(handler) {
				    this.addHandler(handler);
			    }, this);
			    array.forEach(options.services, function(service) {
				    this.addService(service);
			    }, this);
			    if (options && options.useLongLists) {
	            	this.useLongLists = options.useLongLists;
	            }
		    }
		    if (this.WL) {
			    this.busyIndicator = BusyIndicator;
		    }
		    
		    this.disableStyleSheets();

		    OrientationManager.registerOrientationEventListener(this);

		    on.emit(baseWindow.global, "resize", {
		    	bubbles : true,
		        cancelable : true
		    });
		    
		    on.emit(this, 'render', {
		        bubbles : true,
		        cancelable : true
		    });
		    
		    this.requiredFieldLabel = MessageService.createStaticMessage('requiredField');
		    this.invalidFieldLabel = MessageService.createStaticMessage('invalidField');
		    
		    this.resourceRefreshHandles = {};
		    this.showBusyState = false;
		    
	    },
/**@memberOf platform.ui.control.Application */
	    initialize : function() {
	    	if (!this.eventHandlers) {
			    return;
		    }
	    	var self=this;
		    array.forEach(this.eventHandlers, function(eventHandler, i) {
			    var handlerClass = self[eventHandler['class']];
			    if (eventHandler.event == 'initialize') {
			    	 handlerClass[eventHandler.method](self);
			    }
		    });
	    },
	    /**@memberOf platform.ui.control.Application */
	    getRequiredRoleOrNull: function(){
	    	return this.requiredRole || null;
	    },
	    showBusy : function() {	    	
	    	Logger.trace('got show busy call');
		    this.hideBusyCtr = 0;
		    if ((!this.showBusyState) && (!this.busyIndicator.isVisible())) {
			    this.showBusyState = true;
			    Logger.trace('showing busy indicator');
		    	this.busyIndicator.show();
		    	setTimeout(lang.hitch(this, this.manageBusy), this.hideBusyWaitTime);		   
		    } else {
		    	this.showBusyState = true;
		    }		    
	    },

	    hideBusy : function() {
	    	Logger.trace('asked to hide busy indicator');
	    	this.hideBusyCtr = 0;
	    	this.showBusyState = false;		    
	    },

	    manageBusy : function() {
	    	this.hideBusyCtr++;
	    	if (this.hideBusyCtr > 10) {
	    		if ((this.hideBusyCtr % 50) == 0) {
	    			Logger.trace('have not received a call to show or hide the busy indicator in ' + (this.hideBusyCtr / 5) + ' seconds');
				}
	    	} else {
	    		Logger.trace('got managebusy call busystate=' + this.showBusyState + ", busy window visible=" + this.busyIndicator.isVisible());	
	    	}	    	
	    	if (this.showBusyState) {
	    		if (!this.busyIndicator.isVisible()) {
	    			this.busyIndicator.show();
	    		}
		    	setTimeout(lang.hitch(this, this.manageBusy), this.hideBusyWaitTime);		   	    			
	    	}
	    	else {
	    		if (this.busyIndicator.isVisible()) {
	    			Logger.trace('taking down busy window');
	    			this.busyIndicator.hide();
	    		}
	    		this.hideBusyCtr = 0;
	    	}
	    },
	    
	    getObjectSize : function(object) {
		    // summary:
		    // Determine and return member count for this object
		    //
		    // description:
		    if (!object) {
			    return 0;
		    }
		    return Object.keys(object).length;
	    },

	    createResource : function(callback, callbackFunction, resourceName, queryBase, resourceid, filter, isExactMatch) {
		    var self = this;
			var metadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			if (metadata && metadata.serverOnlyMode){
				var platformListSortResource = this.getResource('PlatformListSortResource');
				if(!platformListSortResource){
					var args = arguments;
					var serverOnlyDeferred = new Deferred();
					this.createResource(callback, callbackFunction, 'PlatformListSortResource', null, 'PlatformListSortResource').then(function(){
			    		self.createResource.apply(self,args).then(function(){
			    			serverOnlyDeferred.resolve();
			    		}).otherwise(function(error){
				    		serverOnlyDeferred.reject(error);
			    		});
			    	}).otherwise(function(error){
			    		serverOnlyDeferred.reject(error);
			    	});
			    	return serverOnlyDeferred.promise;
				}
				else{
					var sortResourceSet = platformListSortResource.clearFilterAndSort().filter("resourcename == '"+resourceName+"'");
					var sortRecord = sortResourceSet.getRecordAt(0);
					if (sortRecord){
						metadata.orderBy = sortRecord.get('orderby');
					}
				}
			}

	    	if(!queryBase || typeof queryBase == 'undefined'){ 
	    		var res = this.resources[resourceName];
	    		if(res){
	    			queryBase = res.getQueryBase();
	    		}
	    	}
		    var searchId = null;
		    if (resourceid) {
			    searchId = resourceid;
		    }
		    else {
			    searchId = resourceName + (queryBase ? "_" + queryBase : '');
		    }
		    
		    if(resourceName.indexOf('.')>0){
		    	return this.createRelatedResource(callback, callbackFunction, resourceName, queryBase);
		    }
		    this._subscribeToUpdates(resourceName);
		    this._subscribeToJSONStoreIndexMismatch();
		    // 83500 - temporary fix
		    var deferred = new Deferred();
		    var timerString = 'Application (ModelService.all) fetch resource (includes subcalls) '+resourceName +' : '+queryBase;
		    Logger.timerStart(timerString, 1);
		    var promise = null;
		    

		     if (filter){
		    	promise = this.modelService.filtered(resourceName, queryBase, filter, null, false, isExactMatch);
		    } else {
		    	promise = this.modelService.allLoadedWithLimitCheck(resourceName, queryBase);
		    }

		    promise.then(function(dataSet) {
		    	Logger.timerEnd(timerString, 1);
			    dataSet.resourceID = searchId;
			    self.addResource(dataSet);
			    if (callback && callbackFunction) {
				    callbackFunction.apply(callback, [dataSet]);
			    }			    
			    deferred.resolve();
		    }).otherwise(function(err){
		    	var dataSet = err.dataSet;
		    	if(dataSet){
			    	dataSet.resourceID = searchId;
				    self.addResource(dataSet);
				    if (callback && callbackFunction) {
					    callbackFunction.apply(callback, [dataSet]);
				    }
		    	}
			    deferred.resolve();
		    	if(err["isFirstTimeWorkListDownloadedFailure"]){		    		
		    		self.showMessage(MessageService.createStaticMessage("downloadFailed").getMessage());
		    	}		    	
		    });
		    return deferred.promise;
	    },

	    _subscribeToUpdates: function(resourceName) {
		    if (!this.resourceRefreshHandles[resourceName]){
			    var subscribeHandle = topic.subscribe(PlatformConstants.DATA_REFRESH_TOPIC + '/' + resourceName, 
			    									  lang.hitch(this, this._applyUpdates));
			    
			    this.resourceRefreshHandles[resourceName] = subscribeHandle;
		    }		    
		},
	    
		_subscribeToJSONStoreIndexMismatch: function() {
			var self = this;
			topic.subscribe(PlatformConstants.JSONSTORE_INDEX_MISMATCH_TOPIC, function() {
				if (!self._jsonstoreIndexMismatchShown){
					self._jsonstoreIndexMismatchShown = true;
					self.hideBusy();
					self.showMessage(MessageService.createResolvedMessage('jsonstoreIndexMismatch'), function() {
						self._jsonstoreIndexMismatchShown = false;
					});
				}
			});
		},
		
		_applyUpdates: function(resourceName, patch) {
			var modelDataSet = this.getResource(resourceName);
	    	if (modelDataSet){
	    		if(patch.length == 0){
	    			modelDataSet._lastSavedTime = new Date();
	    		}else{
		    		var start = new Date().getTime();
					Logger.trace('Applying patch for resource ' + resourceName);
		    		modelDataSet._applyPatch(patch);
		    		Logger.trace('Applying patch for resource ' + resourceName + ' - completed. ' + (new Date().getTime() - start) + 'ms');
	    		}
	    	}
		},
		
	    createRelatedResource : function(callback, callbackFunction, resourceName, queryBase){
	    	var resNames = resourceName.split('.');
	    	
	    	var relatedResourceToFetch = resNames.pop();
	    	var parentResourceName = resNames.join('.');
    		var dataSet = this.getResource(parentResourceName);
    		var record = null;
    		if (dataSet){
    			record = dataSet.getCurrentRecord();
    		}
	    	var self = this;
	    	var deferred = new Deferred();
	    	var useExisting;
	    	
	    	var requiredResource = callback.getRequiredResource(resourceName);
	    	if (requiredResource.reload === false) {
	    		useExisting = true;
	    	}
	    	
	    	if (record) {
		    	record.getModelDataSet(relatedResourceToFetch, useExisting).then(function(dataSet){
				    dataSet.resourceID = resourceName;
				    self.addResource(dataSet);
				    if (callback && callbackFunction) {
					    callbackFunction.apply(callback, [dataSet, self.ui.getCurrentView()]);
				    }
				    deferred.resolve();
		    	}).otherwise(function(error){
			    	var dataSet = error.dataSet;
			    	if(dataSet){
				    	dataSet.resourceID = resourceName;
					    self.addResource(dataSet);
					    if (callback && callbackFunction) {
						    callbackFunction.apply(callback, [dataSet, self.ui.getCurrentView()]);
					    }
			    	}
				    deferred.resolve();
		    	});
	    	} else {
	    		//immediately resolve the promise
	    		deferred.resolve();
	    	}
	    	return deferred.promise;
	    },
	    
	    addResource : function(resource) {
	    	if (!resource.resourceID) {
	    		resource.resourceID = resource.resourceName ? resource.resourceName : resource.name;
	    	} 
	    	if (this.resources[resource.resourceID] != resource){
		    	this.resourceMap[resource.resourceID] = resource.resourceID;
		    	this.resourceMap[resource.name] = resource.resourceID;
		    	if(resource && 'function' === typeof resource.getMetadata && !resource.getMetadata().serverOnlyMode){
			    	if(this.resources[resource.resourceID] && this.resources[resource.resourceID].sortParams){
			    		resource['sortParams'] = this.resources[resource.resourceID].sortParams;
			    		resource.clearFilterAndSort();
			    		resource.sort.apply(resource, resource.sortParams);
			    	}
		    	}
			    this.resources[resource.resourceID] = resource;
	    	}
	    },

	    getResource : function(resourceName, queryBase, resourceid) {
	    	resourceName = this.resourceMap[resourceName];
		    var searchId = null;
		    if (resourceid) {
			    searchId = resourceid;
		    }
		    else {
			    searchId = resourceName + (queryBase ? "_" + queryBase : '');
		    }

		    var resource = this.resources[searchId];

		    if (resource) {
			    return resource;
		    }

		    return null;
	    },
	    
	    setResourceQueryBase : function(callbackControl, resourceName, queryBase) {
	    	resourceName = this.resourceMap[resourceName];
		    
		    searchId = resourceName;
			var metadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			if (metadata){
				metadata.clearActiveQueryBaseForResource();
			}
		    		    
	    	var self = this;
	    	var deferred = new Deferred();
	    	self.application.showBusy();
		    this.modelService.allLoadedWithLimitCheck(resourceName, queryBase).then(function(dataSet) {
		    	if (dataSet){
				    dataSet.resourceID = searchId;
				    self.addResource(dataSet);
				    if (callbackControl) {
					    callbackControl.resetQueryBase = false;
					    //We don't want to refresh if callbackControl if it's a view and not shown.
					    if (!callbackControl.isViewShown || callbackControl.isViewShown()){
						    callbackControl.setMyResourceObject(dataSet);			    
						    callbackControl.refresh();
					    }
				    }
		    	}
			    deferred.resolve();
			    self.application.hideBusy();
		    }).otherwise(function(error){
		    	var dataSet = error.dataSet;
		    	if (dataSet){
			    	dataSet.resourceID = searchId;
				    self.addResource(dataSet);
				    if (callbackControl) {
					    callbackControl.setMyResourceObject(dataSet);			    
					    callbackControl.resetQueryBase = false;
					    callbackControl.refresh();
				    }
				    deferred.resolve();
			    	self.application.hideBusy();
			    	var actualErrorsList = lang.getObject('invocationResult.errors', false, error);
			    	if (actualErrorsList && actualErrorsList.length > 0){
			    		var actualError = actualErrorsList[0]['oslc:message'];
			    		var actualReason = actualErrorsList[0]['spi:reasonCode'];
			    		//some instances throw an OSLC error and some other throws a maximo
			    		//error, so handling both.
			    		//For maximo error, as the error message is G11N, so we check for the error code
			    		//corresponding to the error message that's returned for invalid query
			    		if (actualError === "oslc#invalidqueryname" || actualReason === "BMXAA8741E"){
			    			self.showMessage(MessageService.createStaticMessage("invalidQueryBase").getMessage());
			    			return;
			    		}
			    	}
				    if(error["isFirstTimeWorkListDownloadedFailure"]){		    		
			    		self.showMessage(MessageService.createStaticMessage("downloadFailed").getMessage());
			    	}			    
		    	}
		    });
		    return deferred.promise;
		    
	    },

	    getTime : function() {
		    // summary:
		    // Get the current system epoc time
		    //
		    // description:
		    // 
		    return new Date().getTime();
	    },

	    addService : function(service, name) {
		    // summary:
		    // Add a new service
		    //
		    // description:
		    // Services are static across entire application for reuse
		    service['application'] = this;
		    if (!name && service.name) {
			    this[service.name] = service;
		    }
		    else {
			    this[name] = service;
		    }
	    },

	    addHandler : function(object) {
		    // summary:
		    // Add new handler object after this is built
		    //
		    // description:
		    // Handlers are static across entire application for reuse to avoid creating new ones for all
		    object['class']['application'] = this;
		    object['class']['ui'] = this.ui;
		    this[object.name] = object['class'];
	    },
		getCurrentDateTime : function() {
			// summary:
			// Get the current system epoc time as a date object
			return CurrentTimeProvider.getCurrentTime();
		},

	    getViewFromId : function(id) {
		    this.log("getViewFromId  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.getViewFromId(id);
	    },

	    showDialog : function(id) {
		    this.log("showDialog  is deprecated within Application. Call show on UserInterface (ui) instead.");
		    return this.ui.showDialog(id);
	    },

	    show : function(id) {
		    this.log("show  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.show(id);
	    },

	    hideDialog : function(id) {
		    this.log("hideDialog  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.hideDialog(id);
	    },

	    hideCurrentDialog : function() {
		    this.log("hideCurrentDialog  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.hideCurrentDialog();
	    },

	    hideAllDialogs : function() {
		    this.log("hideAllDialogs  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.hideAllDialogs();
	    },

	    hideCurrentView : function() {
		    this.log("hideCurrentView  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.hideCurrentView();
	    },

	    getShowingView : function() {
		    this.log("getShowingView  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.getShowingView();
	    },

	    getCurrentView : function() {
		    this.log("getCurrentView  is deprecated within Application. Call it on UserInterface (ui) instead.");
		    return this.ui.getCurrentView();
	    },

	    log : function(string, level, params) {
		    Logger.log(string, (typeof level == 'undefined') ? 0 : level, (typeof params == 'undefined') ? [] : params);
	    },

	    destroy : function() {
		    OrientationManager.unregisterOrientationEventListener(this);
		    this.inherited(arguments);
	    },

	    showMessage : function(message, callback) {
	    	var dialogId = new Date().getTime();
		    var dlg = new Dialog({
		    	id: dialogId,
		    	onOrientationChanged : function() {
		    		this.refresh();
		    	}
		    });
		    this.ui.dialogStack.push(dlg);
		    dlg.application = this;
		    dlg.ui = this.ui;
		    baseWindow.body().appendChild(dlg.domNode);
		    domConstruct.create( "div", {'class': "mblSimpleDialogText", 'innerHTML': message}, dlg.domNode);
		    
		    var okBtn = this.ui.createWidget(Button, {
		    	id: 'message_ok',
			    'innerHTML' : MessageService.createStaticMessage('okbutton').getMessage()
		    }, true);
		    var buttonFooter = domConstruct.create( "div", {'class': "mblSimpleDialogFooter"}, dlg.domNode);
		    okBtn.placeAt(buttonFooter);
		    dlg.okHandler = on(okBtn.domNode, tap, lang.hitch(dlg, function() {
			    OrientationManager.unregisterOrientationEventListener(this);
		    	var dialog = this.ui.dialogStack.pop();
			    this.hide();
			    var stackSize = this.ui.dialogStack.length;
			    if (stackSize > 0){
			    	this.ui.dialogStack[stackSize-1].addCover();
			    }
			    if(callback){
			    	callback();
			    }
			    dialog.okHandler.remove();
			    dialog.okHandler = null;
			    dialog.destroyRecursive();
			    domConstruct.destroy(dialog.donNode);
			    dialog = null;
		    }));
		    
		    OrientationManager.registerOrientationEventListener(dlg);
		    //Hide loading widget before showing popup
		    if (this.showBusyState){
		    	this.application.hideBusy();
		    }
		    dlg.show();
		    return dlg.domNode;
	    },
	    
	    showMessageWithContinue : function(message, okCallback, continueCallback) {
	    	var dialogId = new Date().getTime();
		    var dlg = new Dialog({
		    	id: dialogId,
		    	onOrientationChanged : function() {
		    		this.refresh();
		    	}
		    });
		    this.ui.dialogStack.push(dlg);
		    dlg.application = this;
		    dlg.ui = this.ui;
		    baseWindow.body().appendChild(dlg.domNode);
		    domConstruct.create( "div", {'class': "mblSimpleDialogText", 'innerHTML': message}, dlg.domNode);
		    
		    var okBtn = this.ui.createWidget(Button, {
		    	id: 'message_ok',
			    'innerHTML' : MessageService.createStaticMessage('okbutton').getMessage()
		    }, true);
		    
		    var continueBtn = this.ui.createWidget(Button, {
		    	id: 'message_continue',
			    'innerHTML' : MessageService.createStaticMessage('continuebutton').getMessage()
		    }, true);
		    
		    on(okBtn.domNode, tap, lang.hitch(dlg, function() {
			    OrientationManager.unregisterOrientationEventListener(this);
		    	this.ui.dialogStack.pop();
			    this.hide();
			    var stackSize = this.ui.dialogStack.length;
			    if (stackSize > 0){
			    	this.ui.dialogStack[stackSize-1].addCover();
			    }
			    if(okCallback){
			    	okCallback();
			    }
		    }));


		    on(continueBtn.domNode, tap, lang.hitch(dlg, function() {
			    OrientationManager.unregisterOrientationEventListener(this);
		    	this.ui.dialogStack.pop();
			    this.hide();
			    var stackSize = this.ui.dialogStack.length;
			    if (stackSize > 0){
			    	this.ui.dialogStack[stackSize-1].addCover();
			    }
			    if(continueCallback){
			    	continueCallback();
			    }
		    }));
		    
		    
		    var buttonFooter = domConstruct.create( "div", {'class': "mblSimpleDialogFooter"}, dlg.domNode);
		    okBtn.placeAt(buttonFooter);
		    continueBtn.placeAt(buttonFooter);
		    OrientationManager.registerOrientationEventListener(dlg);
		    //Hide loading widget before showing popup
		    if (this.showBusyState){
		    	this.application.hideBusy();
		    }
		    dlg.show();
		    return dlg.domNode;
	    },
	    
	    
	    setupWL : function() {
		    try {
			    this.WL = WL;
		    }
		    catch (error) {
			    this.WL = null;
		    }
	    },

	    addChild : function(ui) {// should only ever have 1 UserInterface as a child
		    this.ui = ui;
		    this.ui.application = this;
	    },

	    getProperty : function(property) {
		    return (property && property.getMessage) ? property.getMessage() : property;
	    },

	    getUserLanguageCode : function() {
		    return this.langCode;
	    },

	    getUserLocale : function() {
		    return this.locale;
	    },

	    close: function(){
	    	WL.App.close();
	    },
	    
	    disableStyleSheets : function(){
		    styles.disableStyleSheet("small-portrait-controls.css");
		    styles.disableStyleSheet("small-landscape-controls.css");
		    styles.disableStyleSheet("medium-portrait-controls.css");
		    styles.disableStyleSheet("medium-landscape-controls.css");
		    styles.disableStyleSheet("large-portrait-controls.css");
		    styles.disableStyleSheet("large-landscape-controls.css");
		    styles.disableStyleSheet("xlarge-portrait-controls.css");
		    styles.disableStyleSheet("xlarge-landscape-controls.css");
	    },
	    
	    onOrientationChanged : function(newOrientation) {
	    	var layoutInfo = this.getLayoutInfo(newOrientation);
	    	domAttr.set(baseWindow.body(), {
		    	'data-layoutSize' : layoutInfo.layoutSize,
		    	'data-orientation': layoutInfo.orientationDescription
		    });
	
		    if(WL.Client.getEnvironment() == WL.Environment.PREVIEW){
		    	document.title = WL.StaticAppProps['APP_DISPLAY_NAME'] + ' - ' + layoutInfo.layoutSize + ':' +layoutInfo.orientationDescription;		    	
		    }
	    },
	    
	    getLayoutInfo : function(newOrientation){
	    	//screen size can be changed on the fly so we will support it for better layout debugging
            if (WL.Client.getEnvironment() == WL.Environment.PREVIEW){
            	DeviceEnv.init();
            }
		    var layoutSize = DeviceEnv.getLayoutSize();

		    var portStylesheet = layoutSize + "-portrait-controls.css";
		    var landStylesheet = layoutSize + "-landscape-controls.css";

		    this.disableStyleSheets();
		    
		    var orientationDescription = '';
		    if (newOrientation == "L") {
			    styles.enableStyleSheet(landStylesheet);
			    orientationDescription = 'landscape';
		    }
		    else {
			    styles.enableStyleSheet(portStylesheet);
			    orientationDescription = 'portrait';
		    }
		    return {
		    	'orientationDescription' : orientationDescription,
		    	'layoutSize' : layoutSize
		    };
	    },
	    
	    getResourceArray: function(){
	    	var resourceArray = new Array();
	    	for(key in this.resourceMap){
	    		resourceArray.push(this.getResource(key));
	    	}
	    	return resourceArray;
	    },
	    
	    parseScanResult: function(scanResult, receivingControl){
	    	if (this['eventHandlers']){
	    		var self = this;
	    		array.some(this['eventHandlers'],function(eventHandler){
	    			if(eventHandler['event'] == 'parsescan'){
	    				self[eventHandler['class']][eventHandler.method]({'scanResult' : scanResult, 'receivingControl' : receivingControl});
	    				return true;
	    			}
	    			return false;
	    		});
	    		
	    	}
	    },
	    setFeatures: function(features){
	    	this.features = features;
	    },
	    isFeatureEnabled: function(featureName) {
	    	if (this.features) {
	    		if (!this.features[featureName]) {
	    			return false;
	    		} else {
	    			return true;
	    		}
	    	} 
	    	return false;
	    },
	    isSSOEnabled: function() {
	    	return this.ssoEnabled;
	    },
	    
	});
});
