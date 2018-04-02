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

define("platform/ui/control/View", [
        "dojo/_base/declare",
		  "platform/ui/control/Actions", 
		  "platform/ui/control/_ContainerControlBase", 
		  "dojox/mobile/ScrollableView",
		  "dojox/mobile/View",
		  "platform/ui/control/FixedSplitter",
		  "dojox/mobile/Button", 
		  "dojox/mobile/Heading", 
		  "platform/ui/control/ToolbarButton", 
		  "platform/ui/control/Button",
		  "platform/ui/control/Query", 
		  "platform/ui/control/Image", 
		  "dojox/mobile/bookmarkable", 
		  "dojo/dom-construct", 
		  "dojox/mvc/getStateful",
		  "dojo/_base/lang", 
		  "dojo/_base/array", 
		  "dojo/on", 
		  "dijit/registry", 
		  "dijit/focus", 
		  "dojo/touch", 
		  "dojo/dom-attr",
		  "dojo/dom-geometry", 
		  "dojo/dom-style", 
		  "dojo/dom", 
		  "dojo/dom-class", 
		  "dojo/query", 
		  "dojo/_base/window", 
		  "dojo/Deferred",
	      "dojo/_base/event",
		  "platform/ui/util/OrientationManager", 
		  "platform/ui/util/OrientationEventListenerMixin", 
		  "platform/util/PlatformConstants",
		  "platform/model/ModelService", 
		  "platform/translation/MessageService", 
		  "platform/exception/PlatformRuntimeException",
		  "platform/warning/PlatformRuntimeWarning", 
		  "platform/store/SystemProperties", 
		  "platform/store/_ResourceMetadataContext",
		  "dojo/topic", 
		  "platform/ui/control/Queries",
		  "platform/ui/control/Query",
		  "platform/ui/control/Actions", 
		  "platform/ui/control/Action", 
		  "platform/comm/_ConnectivityChecker",
		  "dijit/focus", ],
		function(declare, Actions, ContainerControlBase, ScrollableView, View, FixedSplitter, dojoButton, Heading, ToolbarButton, Button, Query, Image, bookmarkable, domConstruct,
				getStateful, lang, array, on, registry, domFocus, touch, domAttr, domGeometry, domStyle, dom, domClass, query, win, Deferred, dojoEvent,
				OrientationManager, OrientationEventListenerMixin, PlatformConstants, ModelService, MessageService, PlatformRuntimeException,
				PlatformRuntimeWarning, SystemProperties, ResourceMetadataContext, topic, Queries, Query, Actions, Action, ConnectivityChecker, dijitFocus) {


				var acessible = false;
				
				if(WL.Client.getEnvironment() == WL.Environment.IPHONE || 
            			   WL.Client.getEnvironment() == WL.Environment.IPAD){ 
				
					function callbackOk(data){
						acessible = data;
					}

					cordova.exec(callbackOk, null, "AccessibilityPlugin", "isVoiceOverEnabled", []);
				}

				/**@class platform.ui.control.View */
				return declare([ ContainerControlBase, OrientationEventListenerMixin ], {
						id : null,
						label : '',
						baseWidget : null,
						mainView:null,
						header : null,
						footer : null,
						back : '',
						backTo : '',
						showFooter : false,
						showHeader : true,
						showKeyboard : false,
						showOverflow : true,
						overflowImage : 'header_overflow_OFF.png',
						overflowMenu : 'platform.overflow',
						querySelectorMenu : 'platform.querySelector',
						showCancelButton : false,
						cancelButtonImage : 'header_split_cancel_OFF.png',
						transition : 'slide',
						CanBuildChildren : false,
						direction : 1,
						keepScrollPosition : true,
						queryBaseIndex : 0,
						resetQueryBase : false,
						hasErroredRecords : false,
						queryErrorMarkerSet : false,
						editableView : null,
						editMode : PlatformConstants.VIEW_MODE_DEFAULT,
						querySelectorListener : null,
						visibleButtonCount : null,
						_isConnected : null,
						showDisconnected : null,
						scrollable : true,
						queryMenuItems: null,
						hiddenButtons: null,
						toolbarButtons: null,
						potentialToolbarButtons: null,
						lists: null,
						requiredFields: null,
						exceptionFields: null,
				        backButton: null,
				        disconnectImage: null,
				        unique_id:0,
				        scrollWidget:null,
				        y_scroll:0,
				        topLimit:0,
				        bottomLimit:0,
				        accessible_scroll_view_init:false,
				        build_accessible_elements: false,
						
						/**@constructor */
						constructor : function(options) {
							this.footerButtons = [];
							this._controlType = 'View';
							this.toolbarButtons = new Array();
							this.potentialToolbarButtons = new Array();
							this.hiddenButtons = new Array();
							this.uiActionsAdded = false;
							this.requiredFields = new Array();
							this.exceptionFields = {};
							this.cleanup = false;
							this.lists = [];
							this.fullScreen = options.fullScreen;
							this.options = options;
							if(!document.documentElement.getAttribute('lang')){
								document.documentElement.setAttribute('lang', WL.App.getDeviceLanguage());
							}
						},

						/**@memberOf platform.ui.control.View */
						build : function() {
							// summary:
							// Build the control
							//
							// description:
							// This is where we setup all internals and create any widgets
							if (!this.ui._getPrimaryViewID() && this.id.lastIndexOf("latform.", 1) !== 1) {
								this.ui._setPrimaryViewID(this.id);
								// add PlatformListSortResource to required resources
								this.addPlatformResource('PlatformListSortResource');
								// add PlatformListSearchResource to required resources
								this.addPlatformResource('PlatformListSearchResource');
								// add PlatformViewQueryResource to required resources
								this.addPlatformResource('PlatformViewQueryResource');
							}

							if(acessible && this.scrollable)
								this.build_accessible_elements = true;
							
							this.scrollWidget = this.createWidget((this.scrollable?ScrollableView:View), {
								parentControl : this,
								id : this.build_accessible_elements? this.id + String(this.unique_id++): this.id,
								selected : this.selected,
								'class' : 'loadingView' + ((this['cssClass']) ? ' '+this['cssClass'] : ''),
								'scrollDir' : (this['scrollDir']) ? this['scrollDir'] : 'v'
							});

							//We seperate scroll widget and 
							this.mainView = this.scrollWidget;
							
							

							if(this.build_accessible_elements){
								

								this.mainView = this.createWidget(View, {
									parentControl : this,
									id : this.id,
									'class' : '',
									'style': 'height:100%'
									
								}); 

								this.mainView.addChild(this.scrollWidget);
							
								this.mainViewFooter = this.createWidget(Heading, {
									parentControl : this,
									viewControl : this,
									id : this.id + '_mainView_footer',
									fixed : 'bottom',
									style : 'bottom: 0px',

								});
								domAttr.set(this.mainViewFooter.domNode,'aria-level', "2");
								domClass.add(this.mainViewFooter.domNode, 'mblFooting');
								//this.baseWidget.addFixedBar(this.footer);
							
								var scroll_up_button = this.createWidget(dojoButton, {
									'class': 'leafControl mblButtonText',
									'style' : 'width:50%',
									'label': 'UP',
									'onClick': this.accessDownClick.bind(this)

								});

	            				var scroll_down_button = this.createWidget(dojoButton, {
									'class': 'leafControl mblButtonText',
									'style' : 'width:50%',
									'label': 'down',
									'onClick': this.accessUpClick.bind(this)
								});
	            				this.mainViewFooter.addChild(scroll_up_button);
	            				this.mainViewFooter.addChild(scroll_down_button);


								this.mainView.addChild(this.mainViewFooter);

							}



							this.baseWidget = this.scrollWidget;
							
							if(this.ui.combinedViews && this.id == this.ui.combinedViewId){
								this._configureCombinedView();
							}
							
							if(WL.Client.getEnvironment() == WL.Environment.PREVIEW){
								this.baseWidget.slideTo = function(/*Object*/to, /*Number*/duration, /*String*/easing){
									duration = '.3';
									this.removeCover();
									this._runSlideAnimation(this.getPos(), to, duration, easing, this.containerNode, 2);
									this.slideScrollBarTo(to, duration, easing);
									if(this._scrollBarV){
										domStyle.set(this._scrollBarV, 'opacity', '0');
									}
									this._scrollBarV = null;
									this._scrollBarH = null;
								};
							}
							
							// default is to show back button, otherwise use value from artifact
							if (this.hasOwnProperty('showBackButton')) {
								this.showBackButton = (this['showBackButton'] == 'true') ? true : false;
							} else {
								this.showBackButton = true;
							}
							if (this['showKeyBoard']) {
								this.showKeyboard = true;
							}

							this.setupHeader(this.back);

							this.setupFooter();

							
							
							this.baseWidget.resize();
							var returnWidget = this.inherited(arguments);
							this.baseWidget = this.mainView;
							returnWidget = this.baseWidget
							
							
							if (this.queries && this.queries.children) {
								this.buildQueryMenu();
							}

							on(this.baseWidget, 'AfterTransitionOut', lang.hitch(this, function(moveTo, dir, transition, context, method) {
								if (this.ui.getCurrentViewControl().isLookup()) {
									return;
								}
								if (this.ui.movingBack) {
									this._removeResourceWatches();
								}
								
								this.destroyChildren();
								this.transitioningOut = false;
							}));
							//Fix for scrolling resize on Windows Tablet
							if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) { 
							on(window, 'resize', lang.hitch(this, function (e) {
				                setTimeout(lang.hitch(this, function () {
				                    if (window.innerHeight + 100 < window.outerHeight) {	
				                    	//This means that the keyboard has popped
				                        
				                        var curNode = dijitFocus.curNode;
				                        if (curNode) {
				                        	window.scrollTo(0,0);
				                        	this.ui.getCurrentViewControl().scrollDomNodeIntoView(curNode);
				                        }
				                    }
				                }), 500);
							}));
							}

							on(this.baseWidget, 'BeforeTransitionOut', lang.hitch(this, function(moveTo, dir, transition, context, method) {
								if (this.ui.movingBack && this.cleanup == true) {
									on.emit(this, 'cleanup', {
										bubbles : true,
										cancelable : true
									});
								}
								
								//Hide the keyboard before transitioning to prevent repaint problems.
								this.hideSoftKeyBoard();
								
								this.cleanup = false;
							}));

							on(this.baseWidget, 'BeforeTransitionIn', lang.hitch(this, function(moveTo, dir, transition, context, method) {
								domClass.add(this.baseWidget.domNode, 'loadingView');

								this.baseWidget = this.scrollWidget;
								this.createToolbarButtons();
								this._setupDisconnectedButton();
								this.networkStatus(this, this._isConnected);
								if (!this.ui.movingBack) {
									on.emit(this, 'initialize', {
										bubbles : true,
										cancelable : true
									});
								}
								this.buildChildren(true);
								this.render();
								this.postCreate();
								this.buildFooterButtons();
								var resource = this.getResource();
								if (resource && typeof this.labelWatchHandle == 'undefined') {
									this.labelWatchHandle = resource.onChange(lang.hitch(this, function(attrName, oldValue, newValue) {
										if (!this.queries) {
											this.setLabel();
										}
									}));
								}
								this.CanBuildChildren = false;
								if (this.showHeader && !this.queries) {
									this.setLabel();
								}

								if (this.scrollTop && this.keepScrollPosition && this.baseWidget.scrollTo) {
									this.baseWidget.scrollTo({
										x : 0,
										y : parseInt(this.scrollTop, 10)
									});
								}

								this.baseWidget = this.mainView;	
							}));

							on(this.baseWidget, 'AfterTransitionIn', lang.hitch(this, function(moveTo, dir, transition, context, method) {
								this.baseWidget = this.scrollWidget;
								if(this.baseWidget.hideScrollBar){
									this.baseWidget.hideScrollBar();
								}
								if (this.showKeyboard && !this.ui.movingBack) {
									this.showSoftKeyBoard();
								}
								this.ui.movingBack = false;
								this.ui.transitioning = false;
								//We need to wait for the lookup to load before hiding the busy indicator
								if (!this.isLookup()) {
									this.application.hideBusy();
								}
								domClass.remove(this.baseWidget.domNode, 'loadingView');
								this.logger.profileEnd('show view :' + this.id);
								if(acessible)
									this.scrollWidget.slideTo({y:this.mainViewFooter.domNode.clientHeight}, 0.3, 'ease');
								this.baseWidget = this.mainView;		
							}));

							on(this.baseWidget, 'StartView', lang.hitch(this, function(moveTo, dir, transition, context, method) {
								domClass.add(this.baseWidget.domNode, 'loadingView');
								this.startView = true;
								this.ui.show(this.id); // do this to be sure that
								this.application.hideBusy();
								// BeforeTranstionIn is fired
							}));
							OrientationManager.registerOrientationEventListener(this);

							this.submitButton = this.createWidget(dojoButton, {
								type : 'submit',
								'class' : 'formSubmit'
							
							});
							this.baseWidget.addChild(this.submitButton);
							return returnWidget;
						},

						hideSoftKeyBoard : function() {
							if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
								this.logger.trace("closing android keyboard");
								var self = this;
						    	cordova.exec(
									function(object) { self.logger.trace("[DeviceKeyBoardPlugin] resolving with object: " + object);  }, 
									function(message) { self.logger.error("[DeviceKeyBoardPlugin] failed to resolve, error message: " + message); }, 
									"DeviceKeyBoardPlugin", 
									"hide", []
								);
						    	//Need to blur the current node if it's showing on Android
						    	if (dijitFocus.curNode) 
						    		dijitFocus.curNode.blur();
							} else {
								// Hiding the keyboard
								this.logger.trace("closing ios keyboard");
								if (document.activeElement) {
									document.activeElement.blur();
								}
								if ($("input")) {
									$("input").blur();
								}
							}
						},

						showNumericKeyboardAutoFocus : function() {
							var firstEditable = $('form').find('input[type=text],input[type=number],textarea,select').filter(':visible:first');
							if (firstEditable) {
								this.logger.log("putting focus in first field: " + firstEditable);

			    				//Only select on Android, because selecting on iOS has the Cut/Copy/Paste junk
								if (WL.Client.getEnvironment() == WL.Environment.ANDROID && firstEditable.val()) {
									this.logger.log("selecting previous value");
									firstEditable.select();
								}
								if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
									this.logger.log("popping android keyboard");
									var self = this;

									var recieveKeyEvent = function(data) {
										this.logger.log("@@@@@@selecting previous value" + data);

									};

							    	cordova.exec(
							    		recieveKeyEvent, 
										function(message) { self.logger.log("[DeviceKeyBoardPlugin] failed to resolve, error message: " + message); }, 
										"DeviceKeyBoardPlugin", 
										"showNumericKeyboardOnAutoFocus", []
									);
								}
								firstEditable[0].focus();

							}

						},

					    _configureCombinedView : function(){
					    	//TODO - Have to get these another way
					    	var splitter = this.children[0];
					    	this.splitter = splitter;
					    	this.listView = splitter.listView;//should be first child
					    	var detailsView = splitter.children[1]; //should be second child
//					    	var listView = this.ui.getViewFromId(this.listPaneId);
//					    	var detailsView = this.ui.getViewFromId(listView.baseWidget.getNextSibling().id);
					    	var viewControl = this;
					    	this.addRequiredResources(lang.clone(this.listView.requiredResources)); 

					    	this._addActionsAndQueries(this.listView);
					    	
					    	for (var property in this.listView.options) {
					    	    if (property != 'id' ) {
					    	    	this[property] = this.listView[property];
					    	    }
					    	}
//					    	var splitter = new FixedSplitter({
//					    		id: this.id + '_splitter',
//					    		mainWidth : '30%'
//					    	});
					    	domStyle.set(this.baseWidget.domNode, 'height', '100%');
//					    	this.addChild(splitter);
					    	this.getPane = function(index){
					    		return splitter.panes[index];
					    	};
//							array.forEach(listView.children, function(child){
//								//move children under this 
//								splitter.addChild(0, child);
//							});
//							this.splitter = splitter;
						},
						
						_addActionsAndQueries : function(listView){
					    	var actions = new Actions({
					    		id : listView.actions.id,
					    		artifactId : listView.actions.artifactId
					    	});
					    	
					    	array.forEach(listView.actions.children, function(action){
					    		actions.addChild(new Action(action.options));					    		
					    	});
					    	this.addChild(actions);
							
					    	var queries = new Queries({
					    		id : listView.queries.id,
					    		resource : listView.queries.resource,
					    		artifactId : listView.queries.artifactId
					    	});
					    	
					    	array.forEach(listView.queries.children, function(query){
					    		queries.addChild(new Query(query.options));					    		
					    	});
					    	this.addChild(queries);
						},
						
						showSoftKeyBoard : function() {
							var firstEditable = $('form').find('input[type=text],input[type=number],textarea,select').filter(':visible:first');
							if (firstEditable) {
								this.logger.log("putting focus in first field: " + firstEditable);
								firstEditable.focus();

			    				//Only select on Android, because selecting on iOS has the Cut/Copy/Paste junk
								if (WL.Client.getEnvironment() == WL.Environment.ANDROID && firstEditable.val()) {
									this.logger.log("selecting previous value");
									firstEditable.select();
								}
								if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
									this.logger.log("popping android keyboard");
									var self = this;
				    				cordova.exec(
										function(object) { self.logger.log("[DeviceKeyBoardPlugin] resolving with object: " + object);  }, 
										function(message) { self.logger.log("[DeviceKeyBoardPlugin] failed to resolve, error message: " + message); }, 
										"DeviceKeyBoardPlugin", 
										"show", []
									);
								}
							}
						},

						networkStatus : function(view, isConnected) {
							// var disconnectIcon = view.disconnectImage;
							if (view.disconnectImage != null) {

								// view.disconnectImage.baseWidget.style.height='20px';
								// view.disconnectImage.baseWidget.style.width='20px';

								if (isConnected) {
									self._isConnected = true;
									view.disconnectImage.baseWidget.style.visibility = "hidden";
								} else {
									self._isConnected = false;
									view.disconnectImage.baseWidget.style.visibility = "visible";
								}
							}
						},

						setLabel : function() {
							if (this.header) {
								if (this.queries && this.queries.children) {
									this.header.set('label', this.queries.children[this.queryBaseIndex].getLabelString());
							    }
			    				else {
									this.header.set('label', this.getLabelString());
								}
								this.setQueryBaseLabel();

								if(this.shouldDisplayBackButton()){
									var title = query('span.mblHeadingSpanTitle', this.header.domNode)[0];
									if(!this.backButtonBinding1 && title && !domClass.contains(title, 'mblHeadingSelectTitle')){
										this.backButtonBinding1 = on(title, touch.press, lang.hitch(this, this.backButtonFunction));
									}
								}
								this.fixsetQueryBaseLabelWidth();
							}
						},

						buildQueryMenu : function() {
							this.queryMenuItems = new Array();
							if (this.queries && this.queries.children) {
								var maxWidth = (document.body.clientWidth * 0.75) + 'px';
								array.forEach(this.queries.children, lang.hitch(this, function(query, index) {
									var eventHandlers = query.eventHandlers;
									if (typeof eventHandlers == 'undefined') {
										eventHandlers = new Array();
									}
									var myEventHandlers = lang.clone(eventHandlers);
									myEventHandlers.push({
										'event' : 'click',
										'class' : 'platform.handlers._ApplicationHandlerBase',
										'method' : 'changeQueryBase',
									});

									this.queryMenuItems.push({
										id : query.id,
										label : (typeof query.label == 'string' ? query.label : query.label.getMessage()),
										listControl : this,
										width : maxWidth,
										index : index,
										eventHandlers : myEventHandlers,
										cssIconClass : (index != this.queryBaseIndex ? '' : 'menuItemSelected'),
										cssClass : query.cssClass ? query.cssClass : ''
									});

									this.queryMenuItems.push({
										label : '-'
									});
								}));
							}
						},

						resetScrollPosition : function() {
							this.scrollTop = '0px';
						},

					    ensureHeaderFooterSize : function() { // This is needed because Dojo
							// calculates the heading size
							// based on offsetHeight which
							// is 0 until after the view is
							// shown
							var res = false;
							if (this.header && this.baseWidget.fixedHeader) {
								this.baseWidget.fixedHeaderHeight = this.baseWidget.fixedHeader.offsetHeight;
								res = true;
							}
							if (this.footer && this.baseWidget.fixedFooter) {
								this.baseWidget.fixedFooterHeight = this.baseWidget.fixedFooter.offsetHeight;
								res = true;
							}
							if (res) {
								this.baseWidget.resize();
							}
						},

						show : function() {
//			TODO - Should be applied to keep more than omne transition from being called on the same view. Do early in next release.
// var currentView = UI.getCurrentViewControl();
// if(currentView==this &&
// currentView.id!="platform.LoginView" &&
// navigator.userAgent.indexOf("Trident")>-1){
// return;
// }						
							if (!this.lockScroll && this.baseWidget.scrollTo) {
								this.baseWidget.scrollTo({
									x : 0,
									y : 0
								});
							}
							this.lockScroll = false;
							this.setupQueryBaseResource();
							this.buildQueryMenu();
							this.setQueryBaseLabel();
							var transitioned = false;
							if(this.ui.combinedViews){
								var splitterPane = this.splitterPane;
								if(splitterPane){
									if(!splitterPane.firstViewId){
										splitterPane.firstViewId = this.id;
									}
									var splitter = splitterPane.splitter;
									var blockUser = this.isLookup() || this.showOverflow===false;
									var forceBlockedToFull = false;
									if(this.fullScreen || (blockUser && forceBlockedToFull)){
										splitter.maximizePane(1);
										splitter.forceMax = true;
										blockUser = true;
									}
									else if(splitter.forceMax){
										splitter.resetPaneSizes();
									}
									else if(this.paneIndex!==null && splitter.panes[this.paneIndex].open==false){
										splitter.maximizePane(this.paneIndex);
										if(this.baseWidget != this.baseWidget.getShowingView()){
											this.ui.performTransition(this.id);
										}
										this.ui.movingBack=false;
										transitioned = true;
									}
									splitter.panes[0].setDisabled(blockUser);
									var header = this.ui.combinedViews?this.ui.getViewFromId("combined_view").header:this.ui.getCurrentView().header;
									var overlayFunction = blockUser?this.ui.addOverlay:this.ui.removeOverlay; 
									overlayFunction(header);
								}
							}
							if(!transitioned){
								this.ui.performTransition(this.id);
							}
							var hidden = false;
							if(this.baseWidget != this.baseWidget.getShowingView()){
								var busy = dom.byId("WLbusy");
								if(busy) {
									domStyle.set(busy, 'display', 'none');
									hidden = true;
								}
							}
							
							//We need to wait for the lookup to load
							if(!hidden && !this.isLookup()){
								this.ui.application.hideBusy();
							}
							this.ensureHeaderFooterSize();
							if(this.splitterPane){
								this.splitterPane.showingView = this;
							}
							$('form').attr('role','main');
							if(this.viewControl.queries){
								$('form').attr('aria-label',this.viewControl.queries.children[this.viewControl.queryBaseIndex].getLabelString());
							}
						},

						applyServerQueryList : function() {
							if (SystemProperties.getProperty('si.adminmode') && SystemProperties.getProperty('si.adminmode') == "true"
									&& this.queries && this.queries.resource) {
								var previousQueryId = "";
								var previousQueryIndex = "";
								var qbData = null;
								this.queryBaseIndexResource = this.application.getResource('PlatformViewQueryResource');
								if (this.queryBaseIndexResource != null) {
									var queryBaseIndexSet = this.queryBaseIndexResource.clearFilterAndSort().filter("viewid == '" + this.id + "'");
									if(queryBaseIndexSet){
										qbData = queryBaseIndexSet.data[0];
										if(qbData){
											previousQueryIndex = qbData.get('index');
											previousQueryId = qbData.get('queryid');
										}
									}
								}
								var metdaData = ResourceMetadataContext.getResourceMetadata(this.queries.resource);
								if (metdaData && metdaData.queryBasesLabel && metdaData.queryBasesLabel.length > 0) {
									var systemQueries = this.queries.children.filter(function(child, index, array) {
										return child.system == "true";
									});
									this.queries.children = [];
									var that = this;
									var hasPreviousQuery = false;
									array.forEach(metdaData.queryBasesLabel, function(qbLabelObject, index) {
										var label = qbLabelObject.label;
										var name = qbLabelObject.name;
										if(name==previousQueryId){
											hasPreviousQuery = true;
											previousQueryIndex = index;
										}
										var qb = metdaData.queryBases[name];
										var cut = qb.indexOf("savedQuery=");
										if (cut >= 0) {
											qb = qb.substring(cut + 11);
										}
										that.queries.addChild(new Query({
											'id' : name,
											'label' : label,
											'queryBase' : qb
										}));
									});
									array.forEach(systemQueries, function(systemQuery) {
										var props = {};
										array.forEach(Object.keys(systemQuery), function(key) {
											props[key] = systemQuery[key];
										});
										that.queries.addChild(new Query(props));
									});
									if(qbData) {
										qbData.set('index', (hasPreviousQuery?previousQueryIndex:0));
										qbData.set('queryid', (hasPreviousQuery?previousQueryId:metdaData.queryBasesLabel[0].name));
									}
								}
							}
						},

						convertEvent : function(event) {
							var newEvent = event.toLowerCase();
							switch (newEvent) {
							case 'show':
								return 'BeforeTransitionIn';
							case 'hide':
								return 'BeforeTransitionOut';
							}
							return newEvent;
						},

						setupFooter : function() {

							if (this.footer && this.footer.children) {
								array.forEach(this.footer.children, function(child) {
									this.addFooterButton(child);
									child.setParentReference(this.footer);
								}, this);
							}

							if (this.footerButtons.length == 0 && (this.footer || !this.showFooter)) {
								return;
							}

							this.visibleButtonCount = this.footer.visibleButtonCount;

							this.footer = this.createWidget(Heading, {
								parentControl : this,
								viewControl : this,
								id : this.id + '_footer',
								fixed : 'bottom',
								style : 'bottom: 0px'
							});
							domAttr.set(this.footer.domNode,'aria-level', "3");
							domClass.add(this.footer.domNode, 'mblFooting');
							//this.baseWidget.addFixedBar(this.footer);
							this.baseWidget.addFixedBar?this.baseWidget.addFixedBar(this.footer):this.baseWidget.addChild(this.footer);
						},

						setupHeader : function(back) {
							var view = this;
							if (this.header || !this.showHeader) {
								return;
							}
							var classes = '';
							if (this.queries && this.queries.children) {
								classes = 'mblIdxHeadingSpinner';
							}
							var props = {
								parentControl : this,
								viewControl : this,
                                'role': 'heading',
								id : this.id + '_header',
								label : this.label.textMsg,
								'aria-label': this.label.textMsg,
								fixed : 'top',
								'class' : classes
							};
							this.header = this.createWidget(Heading, props);
							domAttr.set(this.header.domNode,'aria-level', "1");
						    // typically you don't place the back button if there is an "X" on the view
							this.backButton = new ToolbarButton({
								id : this.getId() + (this.shouldDisplayBackButton()?'_backButton':''),
								parentControl : this,
								application : this.application,
								ui : this.ui,
								icon : this.shouldDisplayBackButton() ? 'header_back_OFF.png' : 'header_app_noBack.png',
								cssClass : this.shouldDisplayBackButton()?'headerBackButton':'viewIcon',
								floatDirection : this.ui.west
							});
							this.header.addChild(this.backButton.build(), "first");
							if (this.shouldDisplayBackButton()) {
								this.backButtonFunction = function(e) {
									if(this.splitterPane && !this.splitterPane.splitter['maxPane'] && this.baseWidget.domNode == this.baseWidget.domNode.parentNode.firstChild){
										return false;
									}
									view.ui.back();
								};
				    		this.backButtonBinding = on(this.backButton.baseWidget.domNode, touch.press, function(e){
				    			view.backButtonFunction(e);
				    		});
				    		
								domAttr.set(this.backButton.baseWidget.domNode,'aria-label', MessageService.createStaticMessage('back').getMessage());
								domAttr.set(this.backButton.baseWidget.domNode, {"data-backbutton":"true"});
								this.backButton.baseWidget["view"] = this;
							}
							else{
								domAttr.set(this.backButton.baseWidget.domNode,'aria-label', MessageService.createStaticMessage('noaction').getMessage());
							}

							if (this.showOverflow) {
								this.overFlowButton = new ToolbarButton({
									id : this.getId() + '_overflow',
									parentControl : this,
									application : this.application,
									ui : this.ui,
									icon : this.overflowImage,
									overFlow : true
								});
								this.addToolbarButton(this.overFlowButton);
								on(this.overFlowButton.baseWidget.domNode, touch.press, lang.hitch(this, function(e) {
									try {
										if (!this._isOverflowMenuShowing()) {
											this.showOverflowMenu(e);
										} else {
											this.ui.hideCurrentMenu();
										}

								    }
								    catch (err) {
										this.logger.error("Defect 106473 - Error handling show overflow menu: " + err, 0);
									}
									try {
										e.stopPropagation();
								    }
								    catch (err) {
										this.logger.error("Defect 106473 - Error handling e.stopPropagation(): " + err, 0);
									}
								}));
							}

							this.disconnectImage = this.createWidget(Image, {
								'image' : 'header_disconnected.png',
								// id : this.getId() +'_disconnect',
								id : this.id+'_disconnect',
								parentControl : this,
								application : this.application,
								ui : this.ui,
								style : 'visibility: hidden'
							});
							this.disconnectImage.label = MessageService.createStaticMessage('Disconnected').getMessage();
							this.header.addChild(this.disconnectImage.build());
							
							this._setupDisconnectedButton();
							if (this.showCancelButton) {
								this.cancelButton = new ToolbarButton({
									id : this.getId() + '_cancel',
									parentControl : this,
									application : this.application,
									ui : this.ui,
									icon : this.cancelButtonImage,
									overFlow : true,
									eventHandlers : [ {
										event : 'click',
										method : 'Cancel',
										'class' : 'platform.handlers.LookupHandler'
									} ]
								});
								this.addToolbarButton(this.cancelButton);
							}
							
							//this.baseWidget.addFixedBar(this.header);
							this.baseWidget.addFixedBar?this.baseWidget.addFixedBar(this.header):this.baseWidget.addChild(this.header);
						},

						_setupDisconnectedButton: function() {
							var self = this;
							this.showDisconnected = topic.subscribe('isConnected', function(connected) {
								var disconnectIcon = dom.byId(self.id+"_disconnect_Image");
								if (disconnectIcon != null) {
									if (connected.connected) {
										self._isConnected = true;
										domStyle.set(disconnectIcon, 'visibility', 'hidden');
									} else {
										self._isConnected = false;
										domStyle.set(disconnectIcon, 'visibility', 'visible');
										domAttr.set(self.disconnectImage.baseWidget.domNode, 'aria-live', "polite");
										
									}
								}
							});
						},
						shouldDisplayBackButton : function() {
							return this.showBackButton == true;
						},

						createToolbarButtons : function() {
							
							if(this.splitterPane && this.splitterPane.paneNum==0){ //must be the list view
								//this.ui.getCombinedView().createToolbarButtons();
								return;
							}
							
							this.clearToolbarButtons();

							if (!this.actions || !this.actions.children) {
								this.addChild(new Actions());
							}
							
							if (this.ui.actions && this.ui.actions.children && !this.uiActionsAdded) {
								if(!this.splitterPane){
									this.actions.children = this.actions.children.concat(this.ui.actions.children);
									this.uiActionsAdded = true;
									if (this.ui.actions.eventHandlers) {
										array.forEach(this.ui.actions.eventHandlers, lang.hitch(this.actions, function(handler) {
											this.eventHandlers.push(handler);
										}));
				  					  };
								}
							}
							this.actions.prepareForShow();
							
							var allActions = lang.clone(this.actions.children);

							if (this.ui.east == 'right') {
							    allActions.reverse(); // they float right so must be in
								// opposite order
							}

							this.potentialToolbarButtons = new Array();

							var hasOverflow = false;
						    // create potential buttons these were requested by the app.xml but might not fit in the layout
							array.forEach(allActions, lang.hitch(this, function(action, index) {
							    if (!action.overflow && !action.hidden && action.label) {
								    button = new ToolbarButton({
								        id: action.id,
								    	parentControl: this,
								        application: this.application,
								        ui: this.ui,
								        icon: action.image,
								        alt: action.label.textMsg,
								        transitionTo: action.transitionTo,
								        transition: action.transition,
								        eventHandlers: action.eventHandlers,
								        action: action
								    });
								    //Need to build before we can call render on the toolbar button
								    button.build();
								    domAttr.set(button.baseWidget.domNode, {'title' : action.label.textMsg});
							    	//Need to call render in case the handler hides the button
								    on.emit(button, 'render', {
								    	bubbles: true,
									    cancelable: true
						            });

						            //Need to check if the button is actually displaying after render is called
						            if (button.display) {
						                this.potentialToolbarButtons.push(button);
						            }
					            }
							    //Keep track of whether we're showing the overflow button, because that's one less button we can show
								else if (action.overflow) {
									hasOverflow = true;
								}
							}));
							
							// width available to the buttons							
							//if we have a big screen we can increase our space for buttons
							var maxWidthPixels = 32;
							var viewTitle = dojo.query(".mblHeadingSpanTitle", this.baseWidget.domNode)[0];
							if(viewTitle){
								var position = domGeometry.position(viewTitle);
								var viewPosition = domGeometry.position(this.baseWidget.domNode);
								maxWidthPixels = viewPosition.w - (viewPosition.x - position.x) + position.w; 
							}
							
//							if(document.body.clientWidth > 500){
//								maxWidthPixels = (document.body.clientWidth * .5);
//							}
//							else{
								maxWidthPixels = (document.body.clientWidth * .37);
//							}
							
							//another 32px for disconnectImage which is always present plus 8px span each side
							maxWidthPixels = maxWidthPixels - 48;

					    	//Each button is 32x32 with a 8 px span on the left and right for spacing
							var toolbarButtonMax = Math.floor(maxWidthPixels / 48);
							// 1 button is taken up by overflowMenu

							if (hasOverflow) {
								toolbarButtonMax = toolbarButtonMax - 1;
							}

							//Now count the buttons we need to wrap into the overflow menu
							var wrappedButtonCount = this.potentialToolbarButtons.length - toolbarButtonMax;
							if(wrappedButtonCount < 0){
								wrappedButtonCount = 0;
							}
							
							var hiddenButtonCount = 0;
							this.hiddenButtons = new Array();

							//Put into the hiddenButton list for those less than the buttons to	 hide
							array.forEach(this.potentialToolbarButtons, function(button, index) {
							    if (!button.overFlow) { // don't hide the overflow button
						            if (hiddenButtonCount < wrappedButtonCount) {
						                hiddenButtonCount++;
						                if (button.action) {
						                    this.hiddenButtons.push(button.action);
						                }
						            }
					                //If the button shouldn't be hidden, then add it.
						            else {
						                this.addToolbarButton(button);
						            }
								}
							}, this);
							if(this.overFlowButton){
								domAttr.set(this.overFlowButton.baseWidget.domNode,'aria-label', MessageService.createStaticMessage('more').getMessage());
								domStyle.set(this.overFlowButton.baseWidget.domNode, 'display', (!hasOverflow && this.hiddenButtons.length==0?'none':'block'));
							}
						},

						addSubViewActions : function(allActions) {
							var subActions = new Array();
							if(this == this.ui.getCombinedView() && this.splitter.panes.length>1){
//								for(var index = this.splitter.panes.length -1; index>=0; index--){
//								array.forEach(this.splitter.panes, function(pane, index) {
									var pane = this.splitter.panes[1];
									if(pane.showingView){
										subActions = subActions.concat(pane.showingView.viewControl.actions.children.reverse());
									}
//								}
//								});
							}
							if(subActions.length>0){
								var cleanActions = new Array();
								allActions = allActions.reverse();
								allActions = allActions.concat(subActions);
								allActions = allActions.reverse();
								array.forEach(allActions, function(action, index){
									if(action.label){
										var dup = false;
										array.forEach(cleanActions, function(checkAction, index){
											if(checkAction.label == action.label){
												dup = true;
											}
										});
										if(!dup){
											cleanActions.push(action);
										}
									}
								});
								
							}

							return allActions;
						},
						
						showOverflowMenu : function(event) {
							var allItems = new Array();
							this.actions.prepareForShow();

							if (this.hiddenButtons.length > 0) {
							    // convert hiddenbuttons into simple objects (not controls with
								// pre-defined extensions)
							    // This must be done to avoid extenstion definitions such as
			    				// build function which will not allow build on menuitem
								array.forEach(this.hiddenButtons, lang.hitch(allItems, function(hiddenButton) {
									var keys = Object.keys(hiddenButton);
									var newObject = {};
									array.forEach(keys, lang.hitch(newObject, function(key) {
										this[key] = hiddenButton[key];
									}));
									this.push(newObject);
									this.push({
										label : '-'
									});
								}));
							}
							if (this.actions && this.actions.children && this.actions.children.length > 0) {
								if (allItems.length > 0) {
									allItems.push({
										label : '-'
									});
								}
								var allActions = this.addSubViewActions(lang.clone(this.actions.children));

								array.forEach(allActions, lang.hitch(allItems, function(action) {
									if (action.overflow && !action.hidden) {
										var keys = Object.keys(action);
										var newObject = {};
										array.forEach(keys, lang.hitch(newObject, function(key) {
											this[key] = action[key];
										}));
										this.push(newObject);
										this.push({
											label : '-'
										});
									}
								}));

							}
							var menuClass = 'overflowMenu';
							if(this.overFlowButton.parentControl.splitterPane){
								menuClass = menuClass + ' sub';
							}
							this.ui.showMenu(this.overflowMenu, event, this.overFlowButton, allItems, menuClass, 'below-alt', this);
						},

						addToolbarButton : function(button) {
							this.header.addChild(button.build());
							this.toolbarButtons.push(button);
						},

						clearToolbarButtons : function(button) {
							array.forEach(this.toolbarButtons, lang.hitch(this.header, function(button) {
								if (!button.overFlow) {
									this.removeChild(button);
									button.baseWidget.destroyRecursive();
								}
							}));
							this.toolbarButtons = new Array();
						},

						fixsetQueryBaseLabelWidth : function() {
							if (this.header) {
								var view = this;
								array.forEach(query('span', this.header.domNode), function(span, index) {
									if (span.className.indexOf("mblHeading") == 0) {
										span.id = view.getId() + '_header_' + index;
									}
								});
							}
						},

						setDefaultButton : function(button) {
							this.defaultButton = button;
						},

						createMyResource : function(resourceId) {
							if (!this.CanBuildChildren) {
								return;
							}

							var queryBase = null;
							if (!this.queryBaseIndexResource) {
								this.applyServerQueryList();
								// setup the QB index resource only once
								this.setupQueryBaseResource();
							}

							if ((this.queries && resourceId == this.queries.resource) || resourceId == this.resource) {
								if (this.queryBaseIndex != null) {
								    queryBase = (this.queries && this.queries.children) ? this.queries.children[this.queryBaseIndex].queryBase : this.queryBase;
							    }
							    else {
									queryBase = (this.queries && this.queries.children) ? this.queries.children[0].queryBase : this.queryBase;
									this.resetQueryBase = true;
								}
							}

							var resourceObj = this.application.getResource(resourceId, queryBase, resourceId);
							var requiredResource = this.getRequiredResource(resourceId);

							
							if (//load if the resource has never been loaded
								!resourceObj 
								//Only reload if marked and non local resource, or for local resource if we're not moving back	
								|| requiredResource.reload == true && (!resourceObj.isLocal() || resourceObj.isLocal() && !this.ui.movingBack) 
								//Or reload any child resources when not moving back
								|| (resourceId.indexOf('.') > -1) && !this.ui.movingBack) {
								if (resourceObj && resourceObj._currentIndex > -1) {
									this.getRequiredResource(resourceId).rowNum = resourceObj._currentIndex;
								}
								this.logger.trace("Creating resource: " + resourceId);
								this.application.createResource(this, this.setResourceObject, resourceId, queryBase, resourceId);
							}
						    else {
								this.setResourceObject(resourceObj);
							}
						},

						setResourceObject : function(resource) {
							var requiredResource = this.getRequiredResource(resource.resourceID);
							if (typeof requiredResource.rowHandle == 'undefined') {
								requiredResource.rowHandler = resource.onChange(lang.hitch(this, function(attrName, oldValue, newValue) {
									requiredResource.rowNum = resource._currentIndex;
								}));
							}
							this.inherited(arguments);
						},

						onOrientationChanged : function() {
							//this only needs to happen for top level views as fixedSplitter handles internals
							if (this.baseWidget.getShowingView() != this.baseWidget) {
								return;
							}
							this.ui.hideCurrentMenu();
							this.createToolbarButtons();
							array.forEach(this.lists, function(list) {
								list.orientationChange();
							});
							if(this.splitterPane && this.splitterPane.splitter){
								this.splitterPane.onOrientationChanged();
							}
						},

						postCreate : function() {
							// summary:
							// To be implemented by children
							//
							// description:
						    // Will be called after all controls are built and placed in the DOM
							if(this.baseWidget.domNode.parentNode === null)
								return
							this.baseWidget.startup();
				    		if(this.splitter){
				    			var view = this;
				    			this.baseWidget.onBeforeScroll = function(e){
				    				return view.suppressMinorVertical(e.x,e.y);
				    			};
				    		}
							this.inherited(arguments);
						},

						isViewShown: function(){
							var currentView = this.ui.getCurrentView();
							if (currentView && this.viewControl){
								if (currentView.id === this.viewControl.id){
									return true; 
								}
								if (this.application.combinedViews){
									var mainView = this.ui.getMainViewControl();
									if (mainView && mainView.splitter){
										return array.some(mainView.splitter.panes, function(pane){
											return pane.showingView === this;
										},this);
									}
								}
							}	
							return false;
						},
						
						changeQueryBase : function(index) {
							if(this.listView){
								return this.listView.changeQueryBase(index);
							}
							var deferred = new Deferred();
							if (typeof index == 'undefined' || index == null) {
								deferred.resolve();
					    	}
	    					else{
								this.queryBaseIndex = index;
								if (this.queryBaseIndexResource != null) {
									var view = this.listView?this.listView:this;
									this.queryBase = view.queries.children[view.queryBaseIndex].queryBase;
									this.queryBaseIndexRecord.set('index', index);
									this.queryBaseIndexRecord.set('queryid', this.queryBase);
									this.application.modelService.save(view.queryBaseIndexResource);

									var resourceForQuery = this.queries.resource ? this.queries.resource : this.resource;
									return this.application.setResourceQueryBase(this, resourceForQuery,
											this.queries.children[this.queryBaseIndex].queryBase);
								}
								deferred.resolve();
							}
							return deferred.promise;
						},
						
						onlyChangeQueryBaseIndex: function(queryBase){
							//All this function does is change the queryBase index of the view and persist it.
							//It will NOT set the querybase on the View's (or List's) resource.  Nor will it
							//query for that queryBase.  Nor will it refresh/reload the view/list.
							//This function assumes that the caller fetched the resource with the
							//queryBase, stored it in the Application and is transitioning to another view.
							// Use setQueryBaseIndexByQuery if you any of the above.
							if(this.queries){
								var queries = this.queries.children;
								for (var index = 0; index < queries.length; index++) {
									if (queries[index].queryBase == queryBase) {
										this.queryBaseIndex = index;
										if (this.queryBaseIndexResource != null) {
											this.queryBase = queries[index].queryBase;
											this.queryBaseIndexRecord.set('index', index);
											this.queryBaseIndexRecord.set('queryid', this.queryBase);
											this.application.modelService.save(this.queryBaseIndexResource);
										}
									}
								}
							}
						}, 
							
						setQueryBaseIndexByQuery : function(queryBase) {
							var deferred = new Deferred();
							var queries = this.queries.children;
							for (var index = 0; index < queries.length; index++) {
								if (queries[index].queryBase == queryBase) {
									return this.changeQueryBase(index);
								}
							}
							deferred.resolve();
							return deferred.promise;
						},

						setQueryBaseLabel : function() {
							if (this.header && this.queries && this.lists[0]) {
								this.setQueryErrorMarker(this.hasErroredRecords);
							}
					    	//This else is a solution for error founded in defect: 148778 - any questions, see the comments
							else if (!this.hasErroredRecords && this.queryBase == "__errored__" && this.queries.resource) {
								this.setQueryErrorMarker(this.hasErroredRecords);
								var _contErroredPromise = this.application.modelService.countErrored(this.queries.resource);

								_contErroredPromise.then(lang.hitch(this, function(count) {
											if (count == 0) {
												this.changeQueryBase(0);
											}
				    			})).otherwise(lang.hitch(this,function(error){
    								this.logger.log("[platform.ui.control.View] error on trying to count the number of registers with errors to build the query menu: "+error);
								}));
							}
						},

						setupQueryBaseResource : function() {
							this.queryBaseIndexResource = this.application.getResource('PlatformViewQueryResource');
							if (this.queryBaseIndexResource != null) {
								var queryBaseIndexSet = this.queryBaseIndexResource.clearFilterAndSort().filter("viewid == '" + this.id + "'");
								if (queryBaseIndexSet.count() == 0) {
									this.queryBaseIndexResource.clearFilterAndSort();
									this.queryBaseIndexRecord = this.queryBaseIndexResource.createNewRecord();
									this.queryBaseIndexRecord.set('index', 0);
									this.queryBaseIndexRecord.set('viewid', this.id);
									this.queryBaseIndex = 0;
									this.application.modelService.save(this.queryBaseIndexResource);
			    				}
			  				  	else {
									this.queryBaseIndexRecord = queryBaseIndexSet.getRecordAt(0);
									if (this.resetQueryBase) {
										this.queryBaseIndexRecord.set('index', 0);
										this.queryBaseIndex = 0;
										this.application.modelService.save(this.queryBaseIndexResource);
										this.resetQueryBase = false;
				    				}
				    				else {
										this.queryBaseIndex = this.queryBaseIndexRecord.get('index');
									}
								}
								if (this.queries && this.queries.children) {
									this.queryBase = this.queries.children[this.queryBaseIndex].queryBase;
								}
							}
						},

						refresh : function(preventSave) {
							this.isRefreshing=true;
							if (preventSave && this.ui.getCurrentViewControl().saveonshow == true) {
								this.ui.getCurrentViewControl()['preventSave'] = true;
							}
							var emptyViewId = PlatformConstants.EMPTY_VIEW;
							
							if(this.splitterPane){
								if(this.splitterPane.paneNum == 1){
									emptyViewId += '0';
								}
								this.ui.show(emptyViewId, 'none', 0);
								this.ui.viewHistory.pop();
								this.ui.show(this.id, 'none', 0);
							}
							else {
								this.ui.show(emptyViewId, 'none', 0);
								this.ui.hideCurrentView();
							}
							this.ui.application.hideBusy();
							if(this.splitterPane && this.splitterPane.paneNum == 0){
								this.splitterPane.splitter.panes[1].showingView.refresh();
							}
							this.isRefreshing=false;
						},
						
						isViewRefreshing : function() {
							return (this.isRefreshing || this.id == PlatformConstants.EMPTY_VIEW);
						},

						bindQueryMenu : function() {
							if (!this.header) {
								return;
							}

						    // not sure why querybase dropdown has been implemented like this?
							var queryDropdownIndex = 1;
							var title = this.header.domNode.children[queryDropdownIndex];
							if (title && domClass.contains(title, 'mblHeadingSelectTitle') && !this.querySelectorListener) {
								this.querySelectorListener = on(title, touch.press, lang.hitch(this, function(e) {
									if (!this._isQuerySelectorMenuShowing()) {
							    		this.ui.showMenu(this.querySelectorMenu, e, this.header.domNode.children[queryDropdownIndex], this.queryMenuItems, 'overflowMenu', null, this);
									} else {
										this.ui.hideCurrentMenu();
									}
								}));
							}
						},

						addChild : function(child) {
							switch (child._controlType) {
							case 'Queries':
								this.queries = child;
								child.setParentReference(this);
								return;
								break;
							case 'Actions':
								this.actions = child;
								child.setParentReference(this);
								return;
								break;
							case 'Footer':
								this.footer = child;
								child.setParentReference(this);
								break;
							default:
								this.inherited(arguments);
								break;
							}
						},

						validate : function() {
						    if ((!this.requiredFields || this.requiredFields.length == 0) && (!this.exceptionFields || this.application.getObjectSize(this.exceptionFields) == 0)) {
								return true;
							}
							var emptyField = null;
							// break out of look as soon as we hit one
							if (dojo.some(this.requiredFields, function(field) {
								if (field.hasValue && !field.hasValue()) {
									emptyField = field;
									return true;
								}
							})) {
								this.stopForValidation(emptyField, this.application.requiredFieldLabel.getMessage());
								return false;
							}

							if (this.application.getObjectSize(this.exceptionFields) > 0) {
								var errorField = registry.byId(Object.keys(this.exceptionFields)[0]);
								if (errorField) {
									var control = errorField.parentControl;
									if (!control || !control.getResource()['validateErrorShown']) {
									    //this.stopForValidation(errorField.parentControl, this.application.invalidFieldLabel.getMessage()+"<br>"+Object.keys(this.exceptionFields)[0].getMessage());
										this.stopForValidation(errorField.parentControl, this.application.invalidFieldLabel.getMessage() + "<br>"
												+ this.exceptionFields[Object.keys(this.exceptionFields)[0]].getMessage());
									}
								}
								return false;
							}
							return true;
						},

						stopForValidation : function(control, message) {
							this.ui.showMessage(message, function() {
								control.viewControl.scrollIntoView(control);
								control.highlight(true);
								on.once(control.baseWidget.domNode, 'keypress', lang.hitch(control, function() {
									this.highlight(false);
								}));

							});
						},

						scrollIntoView : function(control, top) {
							if (typeof top == 'undefined') {
								top = true;
							}
							var nodeBox = domGeometry.position(control.baseWidget.domNode);
							if (nodeBox.y < 0 || nodeBox.y > domGeometry.getMarginBox(control.viewControl.baseWidget.domNode).h) {
								control.viewControl.baseWidget.scrollIntoView(control.baseWidget.domNode, true);
							}
						},
						
						scrollDomNodeIntoView : function(domNode) {
							var nodeBox = domGeometry.position(domNode);
							var footerNodeBox =null;
							var obstructedByFooter = false;
							
							//Need to check if the footer is obscuring the element
							if (this.baseWidget.fixedFooter)
								footerNodeBox = domGeometry.position(this.baseWidget.fixedFooter);
							if (footerNodeBox)
								obstructedByFooter = (nodeBox.y + nodeBox.h > footerNodeBox.y);
							var offScreen = nodeBox.y < 0 || nodeBox.y > domGeometry.getMarginBox(this.baseWidget.domNode).h;
							if (offScreen || obstructedByFooter) {
								this.baseWidget.scrollIntoView(domNode, true);
							}
						},

						addFooterButton : function(button) {
							if (button && button._controlType == 'Button') {
								this.footerButtons.push(button);
							}
						},

						isLookup : function() {
						    //Should be overridden by lookup control to allow detection
							return false;
						},

						manageException : function(control, error) {
							if (!control || !control.baseWidget) {
								return;
							}
							var errorId = control.baseWidget.id;
							if (error) {
								if (error instanceof PlatformRuntimeException && !(error instanceof PlatformRuntimeWarning)) {
									this.exceptionFields[errorId] = error;
									return;
								}
							}
							delete this.exceptionFields[errorId];
						},

						refreshLists : function() {
							array.forEach(this.lists, function(list) {
								list.refresh();
							});
							this.setLabel();
						},
						
						getCurrentQueryBaseLabel : function() {
							if (this.queries && this.queries.children && this.queries.children[this.queryBaseIndex]) {
								return this.queries.children[this.queryBaseIndex].getLabelString();
							} else {
								return '';
							}
						},

						setQueryErrorMarker : function(hasErrors) {
							if(this.ui.combinedViews && this.splitterPane && this.splitterPane.paneNum==0){ //must call on combined_view
								this.ui.getCombinedView().setQueryErrorMarker(hasErrors);
								return;
							}

							if (this.queries) {
					  	      // not sure why querybase dropdown has been implemented like this?
								var queryDropdownIndex = 1;
								var view = this.listView?this.listView:this;
								this.header.domNode.children[queryDropdownIndex].innerHTML = view.queries.children[view.queryBaseIndex].getLabelString();
    							domClass.add(this.header.domNode.children[queryDropdownIndex], 'mblHeadingSelectTitle');
    							this.header.domNode.children[queryDropdownIndex].setAttribute('role', 'button'); //tpl-domAttr not defined here?
    							this.header.domNode.children[queryDropdownIndex].setAttribute('aria-label',view.queries.children[view.queryBaseIndex].getLabelString());

    							if (hasErrors) {
									domClass.add(this.header.domNode.children[queryDropdownIndex], 'mblHeadingSelectTitleErrors');
									this.queryErrorMarkerSet = true;
		    					}
	    						else {
									domClass.remove(this.header.domNode.children[queryDropdownIndex], 'mblHeadingSelectTitleErrors');
									this.queryErrorMarkerSet = false;
								}
								this.hasErroredRecords = hasErrors;
								this.bindQueryMenu();
								this.fixsetQueryBaseLabelWidth();
							}
						},

						removeRequiredField : function(control) {
							for (var index = 0; index < this.requiredFields.length; index++) {
								if (control == this.requiredFields[index]) {
									this.requiredFields.splice(index, 1);
									break;
								}
							}
						},

						isOverrideEditMode : function() {
							return this.editMode == PlatformConstants.VIEW_MODE_OVERRIDE_EDIT;
						},

						buildFooterButtons : function() {
							if (this.footer && this.footerButtons && this.footerButtons.length > 0) {
								this.destroyFooter();
								var numbuttons = this.visibleButtonCount ? parseInt(this.visibleButtonCount, 10) : this.footerButtons.length;
								var buttonWidth = (90 / numbuttons) - 3;
								array.forEach(this.footerButtons, function(button) {
									button.setParentReference(this);
									button.style += '; width: ' + buttonWidth + '% !important';
									button.css += '';
									button.build();
									this.footer.addChild(button.baseWidget);
									on.emit(button, 'render', {
										bubbles : true,
										cancelable : true
									});
								}, this);
							}
						},
						
						destroyChildren : function() {
							this.inherited(arguments);
							this.requiredFields = [];
							this.exceptionFields = [];
							this.editMode = PlatformConstants.VIEW_MODE_DEFAULT;
							this.clearToolbarButtons();
							this.queryMenuItems = new Array();
							this.destroyFooter();
							if (this.querySelectorListener) {
								this.querySelectorListener.remove();
								this.querySelectorListener = null;
							}
							if (this.showDisconnected) {
								this.showDisconnected.remove();
							}
							if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
					            if (typeof (CollectGarbage) == "function")
					                CollectGarbage();
					        }
					       	this.parentControl = null;
					       	this.toolbarButtons = [];
					       	this.submitButton = null;
					        this.backButton=null;
							this.hiddenButtons=null;
							this.potentialToolbarButtons=null;
						},

						destroyFooter : function() {
							
							if (this.footer ) {
								if (this.footer && this.footerButtons && this.footerButtons.length > 0) {
									array.forEach(this.footerButtons, function(button) {
										button.destroy();
									});
								}
									this.footer.destroyDescendants();
							}
						},

						setFooterDisplay : function(display) {
							if (display == true && (!this.footerButtons || this.footerButtons.length == 0)) {
								return;
							}
							this.setWidgetDisplay(this.footer, display);
							if (display) {
								this.baseWidget.findAppBars();
								this.baseWidget.resize();
							}
						},
						_isOverflowMenuShowing : function() {
							return this.ui.currentMenu && this.ui.currentMenu.id == this.overflowMenu;
						},
						_isQuerySelectorMenuShowing : function() {
							return this.ui.currentMenu && this.ui.currentMenu.id == this.querySelectorMenu;
						},

					    suppressMinorVertical : function(x,y){//movement offsets (could be negative)
					    	x = Math.abs(x);
					    	y = Math.abs(y);
					    	if(y<x){
					    		return false;
					    	}
					    	return true;
					    },


					    /*Accesibility*/
					    initializeAccessbleScrollView: function(){
							this.topLimit = -1*  this.mainViewFooter.domNode.clientHeight;
							var scroll_totalHeight = domGeometry.getMarginBox(this.scrollWidget.domNode.firstChild).h;
							var scrollViewHeight = this.scrollWidget.domNode.clientHeight;
							this.bottomLimit = scroll_totalHeight - scrollViewHeight; //- this.mainViewFooter.domNode.clientHeight; //1349
							this.y_scroll = this.topLimit;
							this.accessible_scroll_view_init = true;
						},


						accessDownClick: function(){
							if(!this.accessible_scroll_view_init){
								this.initializeAccessbleScrollView();
							}
							var scroll_interval  = 10;
							this.y_scroll += scroll_interval;
							if(this.y_scroll < this.bottomLimit){
									
									this.scrollWidget.scrollTo({y:-1 * this.y_scroll});
							}
						},

						accessUpClick: function(){
							
							if(!this.accessible_scroll_view_init){
								this.initializeAccessbleScrollView();
							}

							var scroll_interval  = 10;
							this.y_scroll -= scroll_interval;
							if(this.y_scroll > this.topLimit){
								this.scrollWidget.scrollTo({y:-1*this.y_scroll});
							}
						},

				});
	});
