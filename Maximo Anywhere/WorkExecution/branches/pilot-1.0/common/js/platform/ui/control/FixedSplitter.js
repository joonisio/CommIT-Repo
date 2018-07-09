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

define("platform/ui/control/FixedSplitter",
		[ "dojo/_base/declare",
		  "platform/ui/control/_ContainerControlBase",
		  "dojox/mobile/FixedSplitter",
		  "dojox/mobile/Container",
		  "dojox/mobile/ScrollableView",
		  "dojox/mobile/_css3",
		  "dojo/dom-construct",
		  "dojo/_base/array",
		  "dojo/dom-style",
		  "dojo/_base/lang",
		  "dojo/on",
		  "dojo/dom",
		  "dijit/registry",
		  "dojo/_base/window",
		  "dojox/gesture/swipe",
		  "platform/logging/Logger",
		  "dojo/dom-attr",
		  "platform/ui/DeviceEnv",
		  "dojo/dom-class" ], 
function(declare, ContainerControlBase, FixedSplitter, Pane, View, css3, domConstruct, array, domStyle, lang, on, dom, registry, baseWindow, swipe, Logger, domAttr, DeviceEnv, domClass) {
	return declare(ContainerControlBase, {

			constructor : function(options) {
				this._controlType = 'FixedSplitter';
				this.paneChildren = new Array();
				this.paneChildren[0] = new Array();
				this.paneChildren[1] = new Array();
				this.orientation = options.orientation?options.orientation:'H';
				this.widths = new Array();
				if(options.mainWidth && options.mainWidth.indexOf('%')>-1){
					this.widths[0] = options.mainWidth;
					this.widths[1] = 100-parseInt(options.mainWidth) + '%';
				}
				else {
					this.widths[0] = '50%';
					this.widths[1] = '50%';
				}
				this.panes = new Array();
				this.maxPane = null;
				this.swipeAllowed = true;
			},

/**@memberOf platform.ui.control.FixedSplitter */
			build : function() {
				// summary:
				// Build the control
				//
				// description:
				// This is where we setup all internals and create any
				// widgets
				var control = this;
				this.baseWidget = this.createWidget(FixedSplitter, {
					id: this.getId(),
					orientation: this.orientation,
					'class' : 'openSplitter'
				});
				this.baseWidget.startup();
				var combinedView = this.ui.getCombinedView();
				if(combinedView){
					on(combinedView.baseWidget.domNode, swipe.end, function(e){
						control.swipe(e);
					});
				}
				
				this.panes[0] = new Pane({
					style : 'width:'+this.widths[0],
					paneNum : 0,
					open: true
				});
				
//				this.panes[0] = new View({
//					style : 'width:'+this.widths[0],
//	    			onBeforeScroll : function(e){
//	    								return control.viewControl.suppressMinorVertical(e.x,e.y);
//	    							 }
//				});
				domStyle.set(this.panes[0].domNode, {
					'width' : this.mainWidth,
				});
				this.fixScrolling(this.panes[0]);
				this.panes[1] = new Pane({
					style : 'width:'+this.widths[1],
					paneNum : 1,
					open: true
				});
				var detailsPane = this.panes[1]; 
				//control.splitterPane = this.panes[0];
				array.forEach(this.panes, function(pane, index) {
					control.baseWidget.addChild(pane);
					pane.splitter = control;
					pane.onOrientationChanged = function() {
						var paneSize = DeviceEnv.getLayoutSize(this.domNode);
						domAttr.set(this.domNode, {
					    	'data-layoutSize' : paneSize
					    });
						if(control.application){
							var resource = control.application.getResource('DeviceSizeResource');
							if(resource){
								var record = resource.getCurrentRecord();
								if(record){
									record.set('pane'+this.paneNum+'_layoutSize', paneSize);
								}
							}
						}
					};
					pane.setDisabled = function(disabled){
						if(disabled){
							control.ui.addOverlay(this);
							control.swipeAllowed = false;
						}
						else {
							control.ui.removeOverlay(this);
							control.swipeAllowed = true;
						}
					};
					domAttr.set(pane.domNode, {
				    	'pane' : index
				    });
					domClass.add(pane.domNode, 'splitterPane'); 
				});
				
				on.once(this.viewControl.baseWidget, 'AfterTransitionIn', function(moveTo, dir, transition, context, method) {
					control.setPaneSizeAttributes();
				});
				return this.inherited(arguments);
			},
			
			swipe : function(e){
				//Delta distance on X axis, dx < 0 means is moving left, dx > 0 means is moving right
				if(!this.swipeAllowed || Math.abs(e.dx)<100){
					return;
				}
				switch(this.maxPane){
					case 0:
						if(e.dx<0){ //left
							this.resetPaneSizes();
						}
						break;
					case 1:
						if(e.dx>0){ //right
							this.resetPaneSizes();
						}								
						break;
					default:
						this.maximizePane(e.dx<0?1:0);
						break;
				}
			},
			
			resetPaneSizes : function(){
				this.maxPane=null;
				domStyle.set(this.panes[0].domNode, {
					'display': 'inherit',
					'width': this.widths[0]
				});
				domStyle.set(this.panes[1].domNode, {
					'display': 'inherit',
					'width': this.widths[1]
				});
				domClass.add(this.baseWidget.domNode, 'openSplitter');
				domClass.remove(this.baseWidget.domNode, 'closedSplitter');
			    on.emit(baseWindow.global, "resize", {
			    	bubbles : true,
			        cancelable : true
			    });

			    if(this.panes[0].open != true){
				    this.panes[0].open = true;
			    	this.panes[0].onOrientationChanged();
			    }
			    if(this.panes[1].open != true){
			    	this.panes[1].open = true;
				    this.panes[1].onOrientationChanged();
			    }
			},
			
			maximizePane : function(max){
				this.maxPane = max;
				var min = max==0?1:0;
				domStyle.set(this.panes[max].domNode, {
					'width': '100%'
				});
				domStyle.set(this.panes[min].domNode, {
					'width': '0%'
				});
			    on.emit(baseWindow.global, "resize", {
			    	bubbles : true,
			        cancelable : true
			    });
				domClass.remove(this.baseWidget.domNode, 'openSplitter');
				domClass.add(this.baseWidget.domNode, 'closedSplitter');
				this.panes[max].open = true;
				this.panes[max].onOrientationChanged();
				this.panes[max==0?1:0].open = false;
			},
			
			fixScrolling : function(pane){
				var control = this;
				//control.baseWidget.addChild(pane);
				if(WL.Client.getEnvironment() == WL.Environment.PREVIEW){
					pane.slideTo = function(/*Object*/to, /*Number*/duration, /*String*/easing){
						duration = '.3';
						this.removeCover();
					this._runSlideAnimation(this.getPos(), to, duration, easing, this.containerNode, 2);
							this.slideScrollBarTo(to, duration, easing);
						if(this._scrollBarV){
							domStyle.set(this._scrollBarV, 'opacity', '0');
						}
						this._scrollBarV = null;
						this._scrollBarH = null
					};
				}
			},
			
		    addChild : function(pane, child) {
		    	this.children.push(child);
		    	//panes are not built yet
		    	//child['splitterPane'] = this.panes[pane];
		    	this.childKeys[child.id] = this.children.length - 1;
		    	this.paneChildren[pane].push(child.id);
		    },
		    
		    getPaneChildrenIds : function(pane){
		    	return this.paneChildren[pane];
		    },
		    
		    buildChildren : function(rebuild) {
			    if (!this.CanBuildChildren && !rebuild) {
				    return;
			    }
			    for (paneIndex in this.panes) {
			    	for (childIndex in this.paneChildren[paneIndex]){
			    		var child = this.children[this.childKeys[this.paneChildren[paneIndex][childIndex]]];
					    child.setParentReference(this);
					    child.paneIndex = parseInt(paneIndex);
					    if (child.build && !child.baseWidget) {
					    	child['splitterPane'] = this.panes[paneIndex]; 
						    child.createMyResource(child.resource);
						    var builtItem = child.build();
						    if (builtItem) {
						    	this.panes[paneIndex].addChild(builtItem);
						    }
					    }
			    	}
			    }
			    this.postCreate();
		    },
		    
			postCreate : function() {
				// summary:
				// To be implemented by children
				//
				// description:
				// Will be called after all controls are built and placed in
				// the DOM
				this.inherited(arguments);
				this.panes[0].onOrientationChanged();
				this.panes[1].onOrientationChanged();
			}
	});
});
