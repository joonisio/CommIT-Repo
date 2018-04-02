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

define("platform/ui/layout/_LayoutAdapter",
	[	 "dojo/_base/declare",
		 "platform/ui/layout/LayoutUtil",
		 "generated/application/ui/layout/LayoutFactory",
		 "dojo/_base/array",
		 "dojo/_base/lang",
		 "dojo/on",
		 "dojo/_base/window",
		 "dojo/dom-construct",
		 "platform/logging/Logger",
		 "platform/ui/DeviceEnv",
		 "dijit/focus",
		 "dojo/dom"], 
function(declare, LayoutUtil, LayoutFactory, array, lang, on, window, domConstruct, Logger, DeviceEnv, focusUtil, dom) {
	return declare("platform.ui.layout._LayoutAdapter", [], {
		layout: null,
		itemWidgets: [],
		layoutUtil: null,
		lastWindowWidth: null,
		lastWindowHeight: null,
		idForControl: null,
		layoutName: null,
		baseWidget: null,
		resizeListener: null,
		resizeTimer: null,
		layoutFactory: null,
		
		constructor: function(options) {
			lang.mixin(this, options);
			this.itemWidgets = [];
			
			this.layoutUtil = new LayoutUtil(options['application']);
			
			this.lastWindowWidth = null,
			this.lastWindowHeight = null;
			
			this.idForControl = "";
			if (options && options.idForControl) {
			   this.idForControl = options.idForControl;
			}
			
			if (options && options.application) {
				this.layoutFactory = new LayoutFactory(options.application);
			} else {
				Logger.error("_LayoutAdapter:constructor(): You must pass in the Application");
			}
			
			if(options && options.baseWidget) {
				this.baseWidget = options.baseWidget;
			} else {
				Logger.error("_LayoutAdapter:constructor(): You must pass in the baseWidget from a Control");
			}
			
			if(options && options.layoutName) {
				this.layoutName = options.layoutName;
				
				try {
					this.setLayoutSize();
					var proposedLayout = this.layoutFactory.getLayout(this.layoutName, this.layoutUtil.getOrientation());
					if (proposedLayout) {
						this.layout = proposedLayout;
						this.layout.startup();
					}
					
				} catch (err) {
					Logger.error("_LayoutAdapter:constructor(): Failed to create layout for: " + this.layoutName);
					Logger.error("_LayoutAdapter:constructor(): Error Message: " + err);
				}

				try {
					this.resizeTimer;
					var adapter = this;
					this.resizeListener = on(window.global, "resize", function() {	
						clearTimeout(adapter.resizeTimer);
						adapter.resizeTimer = setTimeout(adapter.applyResize(), 250);
					});
					//adapter = null;
				} catch (err) {
					Logger.error("**** error: ", err);
				}
			}
			var windowBox = dojo.window.getBox();
			this.lastWindowWidth = windowBox.w;

		},
	    
/**@memberOf platform.ui.layout._LayoutAdapter */
		applyResize : function(){
			var vs = dojo.window.getBox();
			//Need to tolerate small window width changes without firing the orientation manager
	        if (!this.lastWindowWidth || Math.abs(this.lastWindowWidth-vs.w)>5) {
	        	this.lastWindowWidth = vs.w;
	        	this.lastWindowHeight = vs.h;
	        	this._handleOrientationChange();
	        }
		},
		
		setLayoutSize: function(){
			var newLayoutSize;
			if(this.splitterPane){
				newLayoutSize = DeviceEnv.getLayoutSize(this.splitterPane.domNode);
			}
			else {
				newLayoutSize = DeviceEnv.getLayoutSize();
			}
		    
		    var orientation = this.layoutUtil.getOrientation();
		    if (newLayoutSize == this.layoutFactory.layoutSize && orientation == this.layoutFactory.screenOrientation) {
		        return false; //do nothing as size has not changed
		    }
		    this.layoutFactory.layoutSize = newLayoutSize;
		    return true;
		},
		
	    _handleOrientationChange : function() {
	    //  var timeTrack = new TrackTime("_LayoutAdapter", "_handleOrientationChange", "Handle orientation change: " + this.layoutName, "Yes");
	      //timeTrack.startTracking();
			if(this.view && this.view.baseWidget != this.view.baseWidget.getShowingView()){
				return; //do nothing since view is hidden better perf)
	    	}
			if(!this.setLayoutSize()){
				return;
			}
			// if there was a pre-existing layout template used, clear out the place holder for it
		    var focusWidget = {};
			if (this.layout) {
				if(focusUtil.curNode && this.layout.domNode && this.layout.domNode.contains(focusUtil.curNode)){
					focusWidget['id'] = focusUtil.curNode.id;
					if(focusUtil.curNode.tagName=='INPUT' && focusUtil.curNode.type == 'text'){
						focusWidget['selectionStart'] = focusUtil.curNode.selectionStart;
						focusWidget['selectionEnd'] = focusUtil.curNode.selectionEnd;
					}
				}
				//need to remove itemWidgets domNodes so they don't get destroyed by the empty call
				array.forEach(this.itemWidgets, function(widget) {
					if (widget.domNode && widget.domNode.parentNode){
						widget.domNode.parentNode.removeChild(widget.domNode);
					}
				});
				domConstruct.empty(this.placeHolderWidget);
			}

			// get the new layout templated based on name and orientation
			var proposedLayout = this.layoutFactory.getLayout(this.layoutName, this.layoutUtil.getOrientation());

			if (proposedLayout) {

				// we have a layout template, so we must ensure it gets started
				proposedLayout.startup();
				
				// this is the new layout for the adapter
				this.layout = proposedLayout;
				
				// begin moving the itemWidgets into this layout
				this.layout.addChildren(this.itemWidgets);
				
				// time to place the layout inside the placeholder
				domConstruct.place(this.layout.domNode, this.placeHolderWidget, 'only');

			} else {
				// trasfer the itemWidgers back into the baseWidget if there is no layout
				array.forEach(this.itemWidgets, function(widget) {
					this.baseWidget.addChild(widget);
				}, this);
			}
			
			if(focusWidget.id){
				window.global.setTimeout(function() {
					var field = dom.byId(focusWidget.id);
					if (field) {
						field.focus();
						if(focusWidget.hasOwnProperty('selectionStart')){
							field.setSelectionRange(focusWidget.selectionStart, focusWidget.selectionEnd);
						}
						else if(field.select){
                            field.select();
                        }
					}
				}, 200);
			}
			//timeTrack.stopTracking();
	    },
	    
		addChild : function(control, itemWidget) {
			itemWidget.layoutInsertAt = control.layoutInsertAt;
			
			// keep track of the all the various itemWidgets that make a control so that they can be
			// transfered from layout to layout or to baseWidget
			this.itemWidgets.push(itemWidget);
			
			if (this.layout) {
				this.layout.addChild(itemWidget);
			} else {
				this.baseWidget.addChild(itemWidget);
			}
			
		},
		
		getBaseWidget : function() {
			
			// this placeholder is used for storing layouts
			//this.placeHolderWidget = domConstruct.create("div", { id : 'placeHolderWidget' } );
			this.placeHolderWidget = domConstruct.create("div");
			domConstruct.place(this.placeHolderWidget, this.baseWidget.domNode);
			
			if (this.layout) {
				// this would be the first time the page displays, so all children have been added,
				// now is the time to transfer the layout to the baseWidget
				domConstruct.place(this.layout.domNode, this.placeHolderWidget);
			}
			
			return this.baseWidget;
		},
		
		destroy: function() {
			this.inherited(arguments);
			this.itemWidgets = [];

			if (this.layout) {
				this.layout.destroyRecursive();
				if(this.layout.domNode){
					domConstruct.destroy(this.layout.domNode);
				}
			} else {
				if (this.baseWidget && this.baseWidget.destroyRecursive)
					this.baseWidget.destroyRecursive();
				if(this.baseWidget.domNode){
					domConstruct.destroy(this.baseWidget.domNode);
				}
			}
			if(this.resizeListener){
				this.resizeListener.remove();
				this.resizeListener = null;
			}
			if (this.resizeTimer){
				clearTimeout(this.resizeTimer);
		    	this.resizeTimer = null;
			}
	    	this.baseWidget = null;
		}
	});
});
