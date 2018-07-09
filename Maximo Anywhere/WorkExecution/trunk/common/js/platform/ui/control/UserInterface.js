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

define("platform/ui/control/UserInterface", [
        "dojo/_base/declare",
        "platform/ui/control/_ContainerControlBase",
        "platform/ui/control/Menu",
        "dijit/layout/ContentPane",
        "dijit/form/Form",
        "dojo/dom-construct",
        "dojo/Stateful",
        "dojox/mvc/getStateful",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/on",
        "platform/logging/Logger",
        "platform/ui/layout/_LabelManager",
        "dijit/registry",
        "dijit/focus",
        "dojox/mobile/SimpleDialog",
        "dojox/mobile/Button",
        "dojo/_base/window",
        "dojo/Deferred",
        "dojo/touch",
        "dojo/_base/event",
        "dojo/dom-attr",
        "dojo/dom-style",
        "dojo/dom-class",
        "platform/model/ModelService",
        "platform/translation/MessageService",
        "platform/exception/PlatformRuntimeException",
        "platform/util/PlatformConstants",
	    "platform/ui/control/BusyIndicator",
	    "platform/ui/control/View",
        "dojo/topic",
        "dojox/gesture/tap",
		"dojox/widget/Toaster",
		"platform/ui/control/FixedSplitter",
		"platform/store/_ResourceMetadataContext",
		"platform/ui/DeviceEnv",
		"platform/ui/layout/LayoutUtil"], 
function(declare, ContainerControlBase, Menu, ContentPane, Form, domConstruct, Stateful, getStateful, lang, array, on, Logger, LabelManager, registry,
        dijitFocus, Dialog, Button, baseWindow, Deferred, touch, dojoEvent, domAttr, domStyle, domClass, ModelService, MessageService, PlatformRuntimeException, 
        PlatformConstants, BusyIndicator, View, topic, tap, Toaster, FixedSplitter, ResourceMetadataContext, DeviceEnv, LayoutUtil) {
	return declare(ContainerControlBase, {
		/**@memberOf platform.ui.control.UserInterface */
		east : 'right',
	    west : 'left',
	    RTL : false,
	    noHandler : 'noHandler',
	    transitioning : false,
	    cleanup : false,
	    suppressBack : false,
	    
	    constructor : function(options) {
		    this._controlType = 'UserInterface';
		    this.combinedViewId = 'combined_view';
		    this.dialogStack   = {
		    		hiddenStack : new Array(),
		    		length : 0,

		    		push : function(dialog){
		    			var index = this.hiddenStack.length;
		    			this.hiddenStack.push(dialog);
		    			this[index] = this.hiddenStack[index];
		    			this.length = this.hiddenStack.length;
		    			topic.publish('dialogpush',{'count' : this.length});
		    		},
		    		pop : function(){
		    			var dialog = this.hiddenStack.pop();
		    			this.length = this.hiddenStack.length;
		    			delete this[this.length];
		    			topic.publish('dialogpop',{'count' : this.length});
		    			return dialog;
		    		},
		    		top : function() {
		    			return this.hiddenStack[this.hiddenStack.length-1];
		    		},
		    		indexOf : function(dialog){
		    			return this.hiddenStack.indexOf(dialog);
		    		}
		    };
		    this.viewHistory = new Array();
		    this.currentObjectStack = new Array();
		    this.ui = this;
		    this.actions = null;
		    this.menus = new Array();
		    UI = this;
		    currentMenu = null;
		    this.primaryViewID = null;
		    this.cleanup = false;    
	    },
	    /**@memberOf platform.ui.control.UserInterface */
	    getCSSFromRule : function(sheetHref, className){
			var rules = $('link[href="'+sheetHref+'"]')[0].sheet.rules;
			if(!rules){
				return '';
			}
		    for(var x=0; x<rules.length; x++) {
		    	if(rules[x].selectorText == className) {
		    		return rules[x].style.cssText;
		    	}
		    }
	    },
	    
	    getStyleFromCSS : function(sheetHref, className, styleName){
	    	var css = this.getCSSFromRule(sheetHref, className);
	    	if(!css || css.trim().length==0){
	    		return '';
	    	}
	    	var styles = css.replace(/\s/g, '').split(';');
	    	for(var i=0;i<styles.length;i++){
	    		var style = styles[i];
	    		if(style.length>0){
	    			var nameValue = style.split(':');
	    			if(nameValue[0]==styleName){
	    				return nameValue[1];
	    			}
	    		}
	    	}
	    	return '';
	    },
	    
	    build : function() { // not deferred
		    // summary:
		    // Build the control
		    //
		    // description:
		    // This is where we setup all internals and create any
		    // widgets
		    // this.baseWidget = new ContentPane();
		    this.baseWidget = new Form({
			    method : 'post'
		    });
		    this.combinedViews = false;
		    if(this.application.combinedViews){ //is it allowed on this app?
	        	DeviceEnv.init({'application':this.application});
			    //var layoutSize = DeviceEnv.getLayoutSize();
			    var layoutUtil = new LayoutUtil({'application' : this.application});
			    var screenSize = layoutUtil.getPhysicalSize();
			    //var layoutWidth = layoutUtil._calculateLayoutScreenSize(screenSize.width);
			    //var layoutHeight = layoutUtil._calculateLayoutScreenSize(screenSize.height);
			    if(screenSize.width>5.1 && screenSize.height > 5.1){
			    //if(layoutWidth=='large' || layoutWidth=='xlarge' || layoutHeight == 'large' || layoutHeight=='xlarge'){
		    		this._configureCombinedView();
		    	}
	    		domAttr.set(baseWindow.body(), {
			    	'data-combinedViews' : this.combinedViews.toString()
			    });	
		    }
		    this.noHandler = MessageService.createStaticMessage('noHandler');
		    
		    domAttr.set(this.baseWidget.domNode, 'autocomplete', 'off');
		    
		    this.application.WL.App.overrideBackButton(lang.hitch(this, function() {
		    	//Need to suppress back events occasionally for example if the back button is pressed from a cordova plugin
		    	if (!this.suppressBack) {
		    		this.back();
		    	} else {
		    		this.restoreBackButton();
		    	}
		    }));

		    var keyEvent = 'keypress';
		    if (WL.Client.getEnvironment() == 'windows8') {
		    	keyEvent = 'keydown';
		    }
		  	
		  	on(this.baseWidget, keyEvent, lang.hitch(this, function(e) {
		    	//Strong user feedback that we should not submit the form when the enter button is pressed
		    	if(e.keyCode==13){			    		
		    		if (WL.Client.getEnvironment() == 'windows8' && dijitFocus && dijitFocus.curNode && dijitFocus.curNode.className != "mblTextArea") {
		    		    //If they want the keyboard to go away after they hit enter on Windows as long as we're not in a text area, we have to blur the currentNode
	    				dijitFocus.curNode.blur();
		    		}
		    	}
		    }));

		  	on(this.baseWidget.domNode, 'submit', lang.hitch(this, function(e) {
		    	dojoEvent.stop(e);
		    	//Blur the current Node to trigger validation
		    	if (dijitFocus.curNode)
		    		dijitFocus.curNode.blur();	  
		    	//Strong user feedback that we should only submit the form automatically on the login page
		    	if (this.getCurrentViewControl() && this.getCurrentViewControl().id=="platform.LoginView") {
		    		var defaultButton = this.getCurrentViewControl().defaultButton;
		    		if (defaultButton) {
		    			on.emit(defaultButton.baseWidget.domNode, 'tap', {
		    				bubbles : true,
		    				cancelable : true
		    			});
		    		}
		    	}
			    return false;
		    }));
		    
		    //Override links to use cordova view
		    $('body').on('click','a',function(){
		        var $a = $(this);
		        var href = $a.attr('href');
		        if (!href || href.indexOf('/') == 0) return;  // ignore relative links
		        window.open(href, '_system','location=no');  // open external links in a new tab
		        return false;
		    });
		    this.reAuthSubscription = topic.subscribe('reAuthError', function(errorInfo){
				var loginHandler = window.UI.application['platform.handlers.LoginHandler'];
				if (loginHandler) {
					self.transitioning = false;
					loginHandler.handleLoginError(errorInfo.error, errorInfo.username, errorInfo.localPassword);
				}
			});

		    return this.inherited(arguments);
	    },

	    _configureCombinedView : function(){

    		var combinedView = new View({
    			'id' : this.combinedViewId,
    			'showBackButton' : false,
    			'scrollable' : false
    		});
	    	var splitter = new FixedSplitter({
	    		id: this.id + '_splitter',
	    		mainWidth : '35%'
	    	});
	    	this.mainSplitter = splitter;
	    	domStyle.set(this.baseWidget.domNode, 'height', '100%');
	    	combinedView.addChild(splitter);
    		var counter = 0;
    		array.forEach(this.children, function(child){
				if(child._controlType=='View' && child.id != 'platform.LoginView'){
					if(child.id == PlatformConstants.EMPTY_VIEW){
						child.cssClass = 'emptyView';
						splitter.addChild(0, child);
						splitter.addChild(1, new View({
				               'id' : 'Platform.emptyview0',
				               'showFooter' : false,
				               'showHeader' : false,
				               'cssClass' : 'emptyView'
				            })
				       );
					}
					else {
						if(!splitter.listView){
							splitter.listView = child;
							//child.splitterPane = splitter.panes[0];
							splitter.addChild(0, child);
							//child.showHeader = false;
						}
						else {
							splitter.addChild(1, child);
							counter++;
						}
					}
				}	
			});
			for(index=this.children.length-1;index>=0;index--){
				var child = this.children[index];
				if(child._controlType=='View' && child.id != 'platform.LoginView'){
					this.children.splice(index, 1);
				}	
			}
    		this.addChild(combinedView);
    		this.combinedViews = true;
		},
	    
	    destroy : function() {
		    // summary:
		    // Destroy this control's baseWidget
		    //
		    // description:
		    // Use to clean up this object
		    this.inherited();
		    this.baseWidget.destroy();
		    this.baseWidget = null;
		    this.application.destroy();
		    this.application = null;
	    },

	    showDialog : function(id) {
		    // summary:
		    // (Deprecated) Show a dialog with the given id
		    //
		    // description:
		    // Deprecated - use show(id) instead.
		    // Show a dialog based on id. If id is invalid no action will be
		    // taken.
		    this.application.log("showDialog(id) is deprecated, use show(id) instead");
		    var dialog = registry.byId(id);
		    if (dialog) {
		    	this.ui.show(dialog.parentControl);
		    } else {
			    this.application.log('Dialog [{0}] not Found', 0, [ id ]);
		    }
	    },
	    
	    back : function() {
	    	if(dijitFocus.curNode) {
	    		this.emitBlur();
	    	}
	    	if(this.currentMenu){
	    		this.hideCurrentMenu();
	    		return;
	    	}
	    	if(this.dialogStack.length>0){
	    		this.hideCurrentDialog();
	    		return;
	    	}
	    	var currentView = this.getCurrentViewControl();
	    	if (currentView.back && !currentView.back.call(currentView.backContext?currentView.backContext:currentView, currentView)){
	    		return;
	    	}
	    	this.hideCurrentView(array.some(currentView.eventHandlers, function(handler){
                return handler.event=='cleanup';
            }));
	    	
	    },
	    
	   _getChangedAttributeAsArrays: function(viewResource){
	    	var changedAttribute = [];
	    	if(viewResource){
		    	var changedRecordsKeys = Object.keys(viewResource._changedRecords);
		    	
		    	for (var i=0; i< changedRecordsKeys.length; i++){
		    		var changedRecord = viewResource._changedRecords[changedRecordsKeys[i]];
		    		
		    		var changedRecordAttributesKeys = Object.keys(changedRecord.__changedAttributes);
			    	
			    	for (var j=0; j< changedRecordAttributesKeys.length; j++){
			    		changedAttribute.push(changedRecord.__changedAttributes[changedRecordAttributesKeys[j]]);
			    	}
		    	}
	    	}
	    	return changedAttribute;
	    },

	    showAndCloseDialogs : function(id, transition, direction) {
    		while(this.dialogStack.length>0){
    			this.hideCurrentDialog();
    		}
    		this.show(id, transition, direction);
	    },
	    	    
	    show : function(id, transition, direction, mode, force) {
		    // summary:
		    // Show a view or dialog with the given id
		    //
		    // description:
		    // Show a view or dialog based on id. If id is invalid no action
		    // will be taken.
		    // View url will always be stored in history automatically.
	    	if(this.transitioning){
	    		if (force) {
	    			//Keep trying to show the dialog/view if the last time it was called during a transition
	    			setTimeout(lang.hitch(this,this.show, id, transition, direction, mode, force), 500);
	    		}
	    		return false;
	    	}
		    this.hideCurrentMenu();
		    var element = registry.byId(id);
		    if (element) {
			    if (element.parentControl && element.parentControl._controlType) {
			    	var showControl = element.parentControl;
			    	if (showControl._controlType == "View") {
			    		if(mode){
			    			showControl.editMode = mode;
			    		}
			    		if(this.dialogStack.length>0 && this.getCurrentViewControl().cleanup == false){
			    			return false;
			    		}
			    		
			    		//verify if we can skip validation of any required field by a drill draw property on view
			    		var skipValidation = false;
			    		if(this.getCurrentViewControl()){
			    			if(this.getCurrentViewControl().allowDrillDown == "true" && !WL.application.ui.movingBack){
				    			skipValidation = true;
				    		}
			    		}

			    		if(!showControl.isLookup() && (this.getCurrentViewControl() && !this.getCurrentViewControl().isViewRefreshing() && this.getCurrentViewControl().cleanup == false && !skipValidation && !this.getCurrentViewControl().validate())){
			    			return false;
			    		}

				    	if(typeof showControl.startView == 'undefined'){
				    		if(showControl.baseWidget.getShowingView() == showControl.baseWidget){
				    			showControl.CanBuildChildren=true;
				    			showControl.render();
				    			showControl._resetDataBindings();
				    			showControl.CanBuildChildren=false;
				    			return false;
				    		}
				    		this.transitioning = true;
				    	}
				    	this.application.showBusy();
				    	this.application.log('Show View {0}', 1, [showControl.id]);
				    	var curentViewWidget = showControl.baseWidget;
				    	var currentView;
				    	if(curentViewWidget){
				    		currentView = showControl.baseWidget.getShowingView().parentControl;
				    	}
//				    	if(!currentView){
//				    		this.application.hideBusy();
//				    		this.application.log('No current view found.');
//				    		return false;
//				    	}
				    	if(currentView){
				    		if(showControl!=currentView){
				    			currentView.transitioningOut = true;
				    		}
					    	if(currentView.keepScrollPosition && !this.movingBack){
					    		var webkitTransform = currentView.baseWidget.domNode.children[0].style.WebkitTransform;
					    		var transform = currentView.baseWidget.domNode.children[0].style.transform;
					    		
					    		if ((typeof webkitTransform == "undefined") || 
					    			(webkitTransform == ""))
					    		{
					    			if ((typeof transform != "undefined") && 
							    			(transform != "") && (transform.indexOf("translate3d") == 0))
				    				{
						    			currentView.scrollTop = transform.split(', ')[1];
				    				}
					    		}
					    		else
					    		{
					    			if ((webkitTransform.indexOf("translate3d") == 0))
				    				{
						    			currentView.scrollTop = webkitTransform.split(', ')[1];
				    				}
					    		}
					    	}
					    	else {
					    		currentView.resetScrollPosition();
					    	}
				    	}
				    	this.transitionInfo = {id: id, transition: (typeof transition!='undefined')?transition: 'slide', direction: (typeof direction!='undefined' && direction!=null)?direction: 1 };
					    var self = this;
			    		var showView = function(){
			    			//self.viewHistory.pop();
			    			self.popHistory(showControl);
			    			showControl.CanBuildChildren=true;
					    	showControl.show();
			    		};
			    		var preventSave = showControl['preventSave'] === true;
			    		if (preventSave){
				    		delete showControl['preventSave'];
			    		}
					    if(!preventSave && showControl.saveonshow == true && self.movingBack){
		    		    	var list = showControl.lists[0];
		    		    	var listResourceName, listResource, listQueryBase;
		    		    	if(list){
		    		    		listResource = list.getResource();
		    		    		listResourceName = listResource.name;
		    		    		listQueryBase = listResource._queryBaseName;
					    		var resourceFromApp = this.application.getResource(listResourceName);
					    		if (!listResource || (listResource != resourceFromApp && resourceFromApp._queryBaseName != listQueryBase)){
		    		    			//querybase was changed so no need to save data has already been reset
					    			showView();
					    			return true;					    			
					    		}
		    		    	}
		    		    	else{
				    			showView();
						    	return true;					    			
		    		    	}
		    		    	this.save({'list':list,'resource':listResource,'resourceName':listResourceName,'queryBase':listQueryBase}, showControl);
                        }
					    else {
					    	if(this.movingBack){
					    		//this.viewHistory.pop();
					    		this.popHistory(showControl);
					    	}
					    	showControl.prepareForShow();
					    }
				    } else if (showControl._controlType == "Dialog") {
					    this.dialogStack.push(element);
					    if(showControl.saveonshow == true){
					    	this.application.showBusy();
					    	ModelService.saveAll(this.application.getResourceArray()).then( function(){
					    		this.dialogStack.pop();
					    		showControl.prepareForShow();	
						    	this.application.hideBusy();
					    	});
					    }
					    else {
					    	showControl.prepareForShow();
					    }
				    }
				    else {
					    this.application.log('Element [{0}] type [{1}] not a View or Dialog', 0, [ id, showControl._controlType ]);
					    return false;
				    }
			    } else {
				    this.application.log('Element [{0}] does not specify a parent control', 0, [ id ]);
				    return false;
			    }
		    } else {
			    this.application.log('Element [{0}] not Found', 0, [ id ]);
			    return false;
		    }
		    return true;
	    },
	    
	    save : function(listInfo, showControl){
    		var showView = function(){};
			var self = this;
			showView = function(){
				if(!self.combinedViews){
					//self.viewHistory.pop();
					self.popHistory(showControl);
				}
				showControl.CanBuildChildren=true;
				showControl.show();
			};
	    	if(listInfo.resource.getMetadata().serverOnlyMode){
	    		ModelService.save(listInfo.resource).
		    	then(function(dataSet){
		    		if(listInfo.resourceName && listInfo.queryBase) {
    		    		ModelService.all(listInfo.resourceName, listInfo.queryBase).then(function(dataSet){
    		    			if(!dataSet.resourceID){
    		    				dataSet.resourceID = dataSet.name;
    		    			}
    		    			self.application.addResource(dataSet);
			    			showView();
    		    		}).otherwise(function(error){
    		    			//Could be not connected, error records, or something else that prevented transactions from going
    		    			//send them back to the view
			    			showView();
    		    		});
		    		}
		    	}).
	    	    otherwise(function(error){
	    	    	self.application.hideBusy();
				    this.transitioning = false;
				    if(error && error.error){
				    	switch (true) {				
				    		case (error.error instanceof PlatformRuntimeException):										
				    			self.showMessage(error.error.getMessage());
				    		break;				
				    	}
				    }
				    else {
				    	self.showMessage('No valid error message was returned!');
				    }
                });					    		
	    	}
	    	else{
		    	var transition = 'AfterTransitionIn';
		    	if(showControl){
	    		    on.once(showControl.baseWidget, transition, lang.hitch(this, function(moveTo, dir, transition, context, method){
	    		    	var lastSavedTime = listInfo.resource.lastSavedTime();
	    		    	ModelService.saveAll(this.application.getResourceArray()).
	    		    	then(function(dataSets){
	    		    		//Only reload the resource isn't a related resource
	    		    		if (listInfo && listInfo.list && listInfo.list.getResource() && listInfo.list.getResource().getParent() == null) {	
				    			ModelService.refreshDataForWorkListIfPossible(listInfo.resourceName, listInfo.queryBase, listInfo.resource.getPageCountInMemory()).then(function(dataSet){
		    		    			if (dataSet && showControl.id == self.viewHistory[self.viewHistory.length - 1].id){
	        		        		    	if(listInfo.list.refreshButton){
						    		    		if(!dataSet.resourceID){
						    		    			dataSet.resourceID = dataSet.name;
						    		    		}
						    		   			if(lastSavedTime != listInfo.resource.lastSavedTime()){
				    		    				self.application.addResource(dataSet);
				    		    				listInfo.list.showRefreshButton();
					    	    			}
			        		    		}
		    		    			}
		    		    		});
	    		    		}
	    		    	}).
			    	    otherwise(function(error){
			    	    	self.application.hideBusy();
						    this.transitioning = false;
						    if(error && error.error){
						    	switch (true) {				
						    		case (error.error instanceof PlatformRuntimeException):										
						    			self.showMessage(error.error.getMessage());
						    		break;				
						    	}
						    }
						    else {
						    	self.showMessage('No valid error message was returned!');
						    }
	                    });
	    		    }));
		    	}
    			showView();
	    	}
	    },
	    
	    showLookup : function(id, object) {
	    	var element = registry.byId(id);
	    	if(!element){
	    		this.application.log('No current view found.');
	    		return;
	    	}
			this.currentObjectStack.push(object);
	    	if(!this.show(id, 'none')){
	    		this.currentObjectStack.pop();
    		}
	    },
	    
	    performTransition : function(viewId){
		    var view = registry.byId(viewId);
		    if (view) {
		    	var direction = this.transitionInfo.direction;
		    	var transition = this.transitionInfo.transition;
		    	var currentView = view.getShowingView()?view.getShowingView():view;
				if(view.parentControl.isLookup() && transition == 'none'){
					transition = 'slide';
					direction = 1;
				}
				else if(view.parentControl.fullScreen && this.combinedViews){
					transition = 'none';
				}
							
	    		currentView.performTransition(viewId, direction, transition, null, null);
		    	if(this.viewHistory.length==0 || this.viewHistory[this.viewHistory.length-1].id!=viewId){
		    		if(this.viewHistory.length>0 && viewId=="platform.LoginView") {
		    			//Don't re-add loginView when they've selected logout from the options menu
		    		}
		    		else if(this.combinedViews==false || !this.isViewOnStack(viewId)){
		    			this.viewHistory.push({id:viewId, direction: -1*direction, transition: transition });
		    		}
		    	}
		    }
	    },
	    
	    hideDialog : function(id) {
		    // summary:
		    // Deprecated
	    	this.application.log("UserInterface.hideDialod(id) is deprecated and should no longer be used. Should not hide a dialog by id. Use back or hideCurrentDialog().");
    		this._hideDialog(id);
	    },
	    
	    _hideDialog : function(id) {
		    // summary:
		    // Private method
		    //
		    // description:
		    // Hide the specified dialog if it exists
		    if (id) {
			    var dialog = registry.byId(id); 
		    	if(!dialog || (dialog != this.dialogStack[this.dialogStack.length-1])){
		    		this.application.log("Can only hide top-most dialog", 1, []);
		    		return;
		    	}
			    if (dialog) {
				    if(dialog.parentControl && dialog.parentControl.saveonhide == true){
				    	var self = this;
				    	ModelService.saveAll(this.application.getResourceArray()).
			    	    then( function(){
			    	    	self.dialogStack.pop();
			    	    	// TODO defect 142436, this is a work around that should be REMOVED
			    	    	// once dojo team fix their problem around gesture/tap
			    	    	// where a racing condition occurs and triggers a second long touch
			    	    	
			    	    	// remove the next stack element if it does have the exact same id
			    	    	// of the current dialog, in theory we shouldn't have two dialogs
			    	    	// of the same id on the same page
			    	    	var dindex = 0;
			    	    	while(self.dialogStack.top() && self.dialogStack.top().id == dialog.id) {
			    	    		self.dialogStack.pop();
			    	    	}
			    	    	dialog.parentControl.hide();	
			    	    }).otherwise(function(error){
			    	       self.application.hideBusy();
						    if(error && error.error){
						    	switch (true) {				
						    		case (error.error instanceof PlatformRuntimeException):										
						    			self.showMessage(error.error.getMessage());
						    		break;				
						    	}
						    }
						    else {
						    	self.showMessage('No valid error message was returned!');
						    }                                   
                        });
				    }
				    else {
				    	this.dialogStack.pop();
				    	// TODO defect 142436, this is a work around that should be REMOVED
		    	    	// once dojo team fix their problem around gesture/tap
		    	    	// where a racing condition occurs and triggers a second long touch
		    	    	
		    	    	// remove the next stack element if it does have the exact same id
		    	    	// of the current dialog, in theory we shouldn't have two dialogs
		    	    	// of the same id on the same page
		    	    	var dindex = 0;
		    	    	while(this.dialogStack.top() && this.dialogStack.top().id == dialog.id) {
		    	    		this.dialogStack.pop();
		    	    	}
		    	    	
		    	    	if (dialog.parentControl)
		    	    		dialog.parentControl.hide();
				    }
				    return;
			    }
		    }
	    },
	    
	    getCurrentDialog : function(){
	    	if (this.dialogStack && this.dialogStack.length > 0 && this.dialogStack[this.dialogStack.length-1]) {
	    		return this.dialogStack[this.dialogStack.length-1].parentControl;
	    	} else {
	    		return null;
	    	}
	    },
	    	    
	    hideCurrentDialog : function() {
		    // summary:
		    // Hide the last displayed dialog
		    //
		    // description:
		    // Hide the last dialog displayed
		    if (this.dialogStack.length > 0) {
			    this._hideDialog(this.dialogStack[this.dialogStack.length-1]);
		    }
	    },

	    hideAllDialogs : function() {
	    	// summary:
		    // (Deprecated) Get the showing view
		    //
		    // description:
		    // Deprecated - use getCurrentView() instead
		    // Get the currently visible view for the app
		    //
		    this.application.log("UserInterface.hideAllDialogs() is deprecated and should no longer be used!");
	    },

	    closeLoginView : function(onLoginVIew){
	    	var currentView = this.viewHistory[this.viewHistory.length-1].id;
	    	this.transitioning = false;
	    	if (onLoginVIew && currentView != 'platform.LoginView'){
	    		this.ui.show(currentView);
	    	}
	    	else if (this.viewHistory.length > 2){
		    	this.movingBack = true;
	    		this.ui.show(this.viewHistory[this.viewHistory.length-2].id);
	    	}
	    	else{
    			this.ui.show(this.getViewFromId(currentView).baseWidget.getNextSibling());
	    	}
	    },
	    
	    showExitMessage : function() {
	    	return this.show('Platform.ExitApplicationPrompt');
	    },
	    
	    hideCurrentViewAfterEsig : function(cleanup) {
	    	this.movingBack = true;
	    	var transitionInfo = this.viewHistory[this.viewHistory.length-1];
		    if(this.viewHistory.length == 1) {
		    	this.movingBack = false;
    			return this.showExitMessage();
		    }
	    	if(this.getCurrentViewControl().id == this.defaultView){
	    		//User went directly to settings by saying YES to download additional data
	    		//And are getting back to default view, so need to show default view
	    		if (transitionInfo.id =='Platform.Settings'){
	    			var defaultViewId = this.getViewFromId(lastViewId).baseWidget.getNextSibling();
	    			return this.ui.show(defaultViewId);
	    		} else if (transitionInfo.id !='platform.LoginView'){
	    			this.movingBack = false;
	    			return this.showExitMessage();
	    		}
	    	}	    	
	    		    	
		    var lastViewId = this.viewHistory[this.viewHistory.length - 2].id;
		    // remove last as it will get added when it is shown again
	    	if(typeof cleanup == 'boolean'){
	    		this.getCurrentViewControl().cleanup = cleanup;
	    	}
		    if (lastViewId) {
			    var lastView = registry.byId(lastViewId);
			    if (lastView) {
			    	lastView.lockScroll = true;
				    if (!this.show(lastViewId, transitionInfo.transition, transitionInfo.direction)){
		    			//Since the showing of the last view didn't happen reset the movingback flag
		    			this.movingBack = false;
				    }
			    }
		    }
	    },
	    
	    hideCurrentView : function(cleanup) {
	    	
	    	var EsigHandler = this.application["platform.handlers.EsigHandler"];
	    	var viewResource = this.getCurrentViewControl().getResource();
	    	var changedAttribute = this._getChangedAttributeAsArrays(viewResource);
	    	
	    	if (!cleanup && changedAttribute.length > 0 && EsigHandler.isEsigRequired(this, viewResource, changedAttribute)){
				// show esig
	    		EsigHandler.showEsig(this, this.hideCurrentViewAfterEsig, [cleanup]);
			}
			else{
				this.hideCurrentViewAfterEsig(cleanup);
			}
			//EsigHandler.showEsig(this, this.backAfterEsig, ["1"]);
	    	
	    },
	    
	    isViewOnStack: function(viewId){
	    	var i;
	    	var viewsToPop = 0;
	    	var found = false;
	    	for (i = this.viewHistory.length - 1; i > 0; i--, viewsToPop++) {
	    		var previousView = this.viewHistory[i];
	    		if (previousView) {
	    			if (viewId == previousView.id) {
	    				found = true;
	    				break;
	    			}
	    		}	    		
	    	}
	    	if(!found){
	    		viewsToPop = 0;
	    	}
	    	return viewsToPop;
	    },
	    
	    //returns to a view higher in your view history than the current View
	    returnToView : function(viewId) {
	    	this.movingBack = true;
	    	
	    	var transitionInfo = this.viewHistory[this.viewHistory.length-1];

	    	var viewsToPop = this.isViewOnStack(viewId);
	    	if (viewsToPop > 0) {
	    		var view = registry.byId(viewId);
			    if (view) { 
		    		for (var j=0; j < viewsToPop; j++) {
		    			//this.viewHistory.pop();
		    			this.popHistory(view.parentControl);
		    		}
			    	view.lockScroll = true;
				    this.show(viewId, transitionInfo.transition, -1);
			    }
			    return true;
		    } else {
		    	this.application.log("Couldn't find view in viewHistory to return to!" + viewId);
		    	return false;
		    }
	    },

	    getShowingView : function() {
		    // summary:
		    // (Deprecated) Get the showing view
		    //
		    // description:
		    // Deprecated - use getCurrentView() instead
		    // Get the currently visible view for the app
		    //
		    this.application.log("getShowingView() is deprecated, use getCurrentView() instead");
		    return this.getCurrentView();
	    },

	    hideCurrentMenu : function() {
		    if (this.currentMenu) {
			    this.currentMenu.hide();
			    this.currentMenu = null;
		    }
	    },

	    showMessage: function(message, callback){
	    	this.application.showMessage(message, callback);
	    },
	    
	    showMenu : function(id, e, owner, items, cssClass, orient, viewContext) {
			this.emitBlur();
	    	if(!orient){
	    		orient= 'below';
	    	}
		    menu = new Menu({
		        id : id,
		        application : this.application,
		        ui : this,
		        owner : owner,
		        items : items,
		        cssClass : cssClass,
		        orient: orient,
		        viewControl : viewContext?viewContext:this.getCurrentViewControl()
		    });
		    menu.show();
		    dojoEvent.stop(e);
		    this.currentMenu = menu;
		    return menu;
	    },

	    openWindow : function(link) {
		    window.open(link);
	    },

	    getCombinedView: function(){
	    	return this.getViewFromId(this.combinedViewId); 
	    },
	    
	    getViewFromId : function(id) {
	    	var view;
	    	var viewWidget = registry.byId(id)
	    	if(viewWidget){
	    		view = viewWidget.parentControl;	
	    	}
		    return view; 
	    },

	    getCurrentViewControl : function() {
		    // summary:
		    // Get the view control that was shown last
		    //
	    	if(this.viewHistory.length==0){
	    		return null;
	    	}
	    	return this.getViewFromId(this.viewHistory[this.viewHistory.length - 1].id);
	    },

	    getMainViewControl : function() {
		    // summary:
		    // Get the view widget that was shown last
		    //
	    	if(this.combinedViews){
	    		if(this.getCurrentViewControl().splitterPane){
	    			return this.getCurrentViewControl().splitterPane.splitter.viewControl;
	    		}
	    	}
	    	return this.getCurrentViewControl();
	    },
	    
	    getCurrentView : function() {
		    // summary:
		    // Get the view widget that was shown last
		    //
	    	if(!this.getCurrentViewControl()){
	    		return null;
	    	}
	    	return this.getCurrentViewControl().baseWidget.getShowingView();
	    },
	    
	    isPrimaryViewShowing: function() {
	    	return this.getCurrentViewControl() && this.getCurrentViewControl().id == this._getPrimaryViewID();
	    },
	    
	    isDialogShowing : function(id) {
		    //Is the id of the current dialog showing
	    	if(this.dialogStack != null && this.dialogStack.length>0){
	    		var currentDialog = this.dialogStack[this.dialogStack.length-1];
	    		if (currentDialog != null) {
	    			return currentDialog.id == id;
	    		}
	    	}
	    	return false;
	    },

	    addOverlay : function(widget){
			if(!widget.overlay){
				domClass.add(widget.domNode, 'song2');
				widget.overlay =  domConstruct.place("<div class='overlay'></div>", widget.domNode, "last");
			}
	    },
	    
	    removeOverlay : function(widget){
			if(widget.overlay){
		    	domClass.remove(widget.domNode, 'song2');
				widget.overlay.parentNode.removeChild(widget.overlay);
				widget.overlay = null;
			}
	    },
	    
	    bindEvents : function(context) {
		    // summary:
		    // Sets up event binding for this object based on pre-defined event
		    // handlers
		    //
		    // description:
		    // Events can be DOM based or custom to be thrown via emit
		    if (!context || !context.eventHandlers) {
			    return;
		    }
		    array.forEach(context.eventHandlers, function(eventHandler, i) {
			    var handlerClass = context.application[eventHandler['class']];
			    var handler = null;
			    if (handlerClass) {
				    handler = handlerClass[eventHandler.method];
			    }
			    if (!handler && !eventHandler.transitionTo) {
			    	context.application.log(context.ui.noHandler.getMessage(), 0, [ eventHandler['class'], eventHandler.method, context._controlType, context.id  ]);
			    } else {
			    	if (eventHandler.event == 'validate') {
			    		this.dataValidate = {
			    				'class' : handlerClass,
			    				'className' : eventHandler['class'],
			    				method  : eventHandler.method
			    		};
			    		return;
			    	}
			    	if (eventHandler.event == 'back') {
			    		context['back'] = handler;
			    		return;
			    	}
				    if (eventHandler.event != 'click' || context.supportsClick()) {
					    var event = eventHandler.event;
					    if(context.convertEvent) {
					    	event = context.convertEvent(eventHandler.event);
					    }
					    if (event == 'datachange' && handler) {
						    var record = context.getCurrentRecord();
						    if (record) {
							    handlerClass[eventHandler.method](context); // do it up front as well
							    context.addResourceWatchHandle(context.getResource().onChange(lang.hitch(context, function(attrName, oldValue, newValue) {
								    this.ui.hideCurrentMenu();
								    handlerClass[eventHandler.method](this);
							    })));							    
							    context.addResourceWatchHandle(record.watch(PlatformConstants.ERRORED_ATTRIBUTE, lang.hitch(context, function(attrName, oldValue, newValue) {
							    	handlerClass[eventHandler.method](this);
							    })));
							    if(context.resourceAttribute){
       							    context.addResourceWatchHandle(record.watch(context.resourceAttribute, lang.hitch(context, function(attrName, oldValue, newValue) {
       							    	handlerClass[eventHandler.method](this);
       							    })));
							    }
						    }
						    context.addHandler(on(context.baseWidget, event, lang.hitch(context, function() {
							    handlerClass[eventHandler.method](this);
						    })));
					    }
					    else if (handler || eventHandler.transitionTo) {
					    	var bindElement = context.baseWidget;
					    	if(array.indexOf(PlatformConstants.SYNTHETIC_EVENTS, event)>=0){
					    		bindElement = context;
					    		eventHandler.synthetic = true;
					    	}
					    	context.addHandler(on(bindElement, event, lang.hitch(context, function(e) {
							    if (this.disabled || (context.ui.dialogStack.length>0 && context.dialogControl && context.dialogControl.id != context.ui.dialogStack[context.ui.dialogStack.length-1].id)) {
								    return;
							    }
							    if(this.baseWidget && this.baseWidget.domNode && !eventHandler.synthetic && 
							    		domStyle.get(this.baseWidget.domNode, 'display')!='none'){
						    		dijitFocus.focus(this.baseWidget.domNode);
							    }

								if(context && context['_controlType']=='MenuItem'){
									this.ui.hideCurrentMenu();
								}
 							    else if(eventHandler.event == 'click' && this.ui.currentMenu){
 							    	e.stopPropagation();
 						    		this.ui.hideCurrentMenu();
 						    		return;
 							    }
							    
						    	this.ensureRecordFocus();
							    
							    if (eventHandler.transitionTo) {
								    e.stopPropagation();
								    this.ui.show(eventHandler.transitionTo);
								    return;
							    }
							    var self = this;
							    if (e.target && e.type === 'tap') {
							        if (this.baseWidget['_tappedEvent_'] == eventHandler.method || this.baseWidget['disabled']) {//Checking if widget is disabled; due to checkbox widget and prevent propgation
							        	Logger.trace("[UserInterface - bindEvents]: Event " + eventHandler.method + " already handled.  Ignoring double tap");
							            e.stopPropagation();
							            dojoEvent.stop(e);
							            return;
							        }
							        this.baseWidget['_tappedEvent_'] = eventHandler.method;
							        var widgetToClear = this.baseWidget;
							        setTimeout(function () {
							        	Logger.trace("[UserInterface - bindEvents]: Event " + eventHandler.method + " clearing called event from widget");
							            delete widgetToClear['_tappedEvent_'];
							        }, 200);//reducing the timeout since successive taps on checkbox doesn't register otherwise
							    }
								this.application.log(PlatformConstants.LOG_HANDLER+'calling '+eventHandler['class']+'.'+eventHandler.method, 1, []);
						    	if (eventHandler.method.indexOf('async') == 0) {	
						    		self.application.showBusy();
			        				var result = handlerClass[eventHandler.method](this);
			        				result.then(function() {
			        				});
			        				result.otherwise(function(platformException) {
										 switch (true) {				
											case (platformException instanceof PlatformRuntimeException):										
												this.ui.showMessage(platformException.getMessage());
												break;
											case ('message' in platformException):
												Logger.error(platformException.message);
												break;
												
											case (platformException.stack) :
												Logger.error(platformException.stack);
												break;
											
											case (platformException.toString):
												Logger.error(platformException.toString());
												break;
												
											default:
												// MM improve memory utilization remove json.stringify object  
												//Logger.error(JSON.stringify(platformException));
												self.showMessage('No valid error message was returned!');
										   }    
			        				});
			        				result.always(function() {
			        					self.application.hideBusy();
			        				});
						    	}
						    	else {
						    		try {
					    			//need to globally handle any exceptions thrown by the handlers
						    			handlerClass[eventHandler.method](this);							    		
						    		} catch(platformException) {
						    			
						    			switch (true) {				
											case (platformException instanceof PlatformRuntimeException):										
												this.ui.showMessage(platformException.getMessage());
												break;
											case ('message' in platformException):
												Logger.error(platformException.message);
												//Should log the stack in addition to the message to help debuggin
												if (platformException.stack) {
								    				Logger.error(platformException.stack);
								    			}
												break;
											case (platformException.stack) :
												Logger.error(platformException.stack);
												break;
											case (platformException.toString):
												Logger.error(platformException.toString());
												break;
											default:
												// MM improve memory utilization remove json.stringify object  
												//Logger.error(JSON.stringify(platformException));
												self.showMessage('No valid error message was returned!');
										   }    
						    		}
						    	}
						    })));
					    }
				    }
			    }
		    }, context);
	    },

	    addChild : function(child){
	    	switch(child._controlType){
    	    	case 'ErrorActions':
    	    		this.errorActions = child;
    	    		child.setParentReference(this);
    	    		return;
    	    		break;
    	    	case 'Actions':
    	    		this.actions = child;
    	    		child.setParentReference(this);
    	    		return;
    	    		break;
    	    	case 'View':
    	    		if(!this.viewIds){
    	    			this.viewIds = new Array();
    	    		}
    	    		this.viewIds.push(child.id);
    	    		this.inherited(arguments);
    	    		break;
    	    	default :
    	    		this.inherited(arguments);
    	    		break;
	    	}
	    },
	    
	    _setPrimaryViewID : function(primaryViewID) {
			if(this.combinedViews){
				this.primaryViewID = this.combinedViewId;
			}
			else {
				this.primaryViewID = primaryViewID;
			}
	    },
	    
	    _getPrimaryViewID : function() {
	    	return this.primaryViewID;
	    },
	    
	    showToastMessage : function(message, type) {
	        var toasterId = new Date().getTime();
	                domConstruct.destroy("toastDiv");
	            var toastDiv = domConstruct.create("div", { id: 'toastDiv' }, this.getCurrentView().getParent().domNode, "first");
	            var info = new Toaster({
	                id: toasterId,
	                positionDirection: 'br-up',
	                duration: 5000
	            });
	            toastDiv.appendChild(info.domNode);

	            if (!type) {
	                type = 'message';
	            }
	            info.setContent(message, type);
	            info.show();
	    },
	    
	    createWidget : function(widget, props, numberedId){
	    	try {
	    		if(props.id){
	    			var oldWidget = registry.byId(props.id);
	    			if(oldWidget){
	    				if(!numberedId){
		    				/* Another widget was found with the same ID.
		    				 * This should only happen if we are re-creating the same widget.
		    				 * Remove it so we can recreate 
		    				 */
		    				this.logger.log('Destroying old widget '+props.id, 1);
		    				oldWidget.destroyRecursive(false);
	    				}
	    				else {
	    					var newId = props.id;
	    					var count = 1;
	    					while(registry.byId(newId)){
	    						count++;
	    						newId = props.id+"_"+count;
	    					}
	    					props.id = newId;
	    					return new widget(props);
	    				}
	    			}
	    		}
	    		return new widget(props);
	    	}
	    	catch(error){
	    		var id = '! ';
	    		if(props){
	    			id = ' with id '+ props['id'] + '! ';
	    		}
	    		Logger.error('Could not create widget' + id + error.stack);
	    	}
	    },
 
	    suppressBackButton : function() {
	    	this.suppressBack=true;
	    }, 
	    
	    restoreBackButton : function() {
	    	this.suppressBack=false;
	    },
	    
	    emitBlur: function() {
			var	blurNode = dijitFocus.curNode? dijitFocus.curNode:document.activeElement;
			if(blurNode){
				on.emit(blurNode, 'blur', {
						bubbles: true,
						cancelable: true
				});
        	}
	    },
	    
	    popHistory : function(view){
//	    	if(view.splitterPane && view.splitterPane.firstViewId === view.id){
//	    		return;
//	    	}
	    	this.viewHistory.pop();
	    },
	    
	    getWidgetById : function(id){
	    	return registry.byId(id);
	    }
	});
});