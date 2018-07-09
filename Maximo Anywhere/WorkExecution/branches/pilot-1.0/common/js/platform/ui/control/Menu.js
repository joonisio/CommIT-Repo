
/* JavaScript content from js/platform/ui/control/Menu.js in folder common */
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

define("platform/ui/control/Menu", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ContainerControlBase",
	     "dijit/layout/BorderContainer",
	     "dijit/layout/ContentPane",
	     "dojox/layout/ScrollPane",
	     "dojo/dom-geometry",
	     "dijit/Menu", 
	     "platform/ui/control/MenuItem", 	
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dijit/popup",
	     "dojo/touch",
	     "dojo/_base/event",
	     "dojo/dom-style",
	     "dojo/dom-class",
	     "dojo/dom-attr" ],
function(declare, ContainerControlBase, BorderContainer, ContentPane, ScrollPane, domGeometry, DijitMenu, MenuItem, lang, array, on, popup, touch, event, domStyle, domClass, domAttr) {
	return declare( [ ContainerControlBase], {
		outerWidget: null,
		scrollUpWidget: null,
		scrollWidget: null,
		scrollDownWidget: null,

		constructor : function(options) {
			this._controlType = 'Menu';
			if(options && options.items){
				var menu = this;
				array.forEach(options.items, function(item, index){
					if(!item.transitionTo || item.transitionTo != this.viewControl.id){
						item.menuId = menu.id;
						item.id = menu.id + '_' + (item.id?item.id:index);
						this.addChild(new MenuItem(item));
					}
				}, this);
			}
		},
		
/**@memberOf platform.ui.control.Menu */
		build: function(){
			if(this.children && this.children.length>0){
				if(this.scrollWidget){
					this.scrollWidget.destroy();
				}
				
				this.baseWidget = this.createWidget(DijitMenu, {});

				this.inherited(arguments);
			}
		},
		
		show: function(){//itemDef should be a jsonArray of objects. Each object needs at least a label and some action???
			if(!this.items || this.items.length==0 || !this.owner){
				return;
			}
			
			this.build();
			var ownerNode = (this.owner.baseWidget && this.owner.baseWidget.domNode)?this.owner.baseWidget.domNode:this.owner;
			this.addHandler(on(ownerNode, touch.press, function(e){
				event.stop(e);
			}));
			
			if(this.cssClass){
				this.baseWidget.set('class', this.cssClass);
			}

			var ownerNode = (this.owner.baseWidget && this.owner.baseWidget.domNode)?this.owner.baseWidget.domNode:this.owner;
			var viewBox = domGeometry.getContentBox(this.viewControl.baseWidget.domNode);
			var ownerBox = domGeometry.getContentBox(ownerNode);
			var height = ((viewBox.h - (ownerBox.t + ownerBox.h)) - 15);
			
			this.outerWidget = this.createWidget(BorderContainer, {
				style: 'height: '+height+'px; overflow:hidden'
			});
			
			this.scrollUpWidget = this.createWidget(ContentPane, {
				content: '<a></a>',
				region: 'top',
				'class': 'scroller upArrow upArrowDisabled'
			});
			this.addHandler(on(this.scrollUpWidget.domNode, touch.press, lang.hitch(this, function(){
				this.scroll(1);
			})));
			this.scrollWidget = this.createWidget(ContentPane, {
				region: 'center',
				style: 'height: '+(height-96)+'px; overflow:hidden',
			});
			this.scrollDownWidget = this.createWidget(ContentPane, {
				content: '<a></a>',
				region: 'bottom',
				'class': 'scroller downArrow'
			});
			this.addHandler(on(this.scrollDownWidget.domNode, touch.press, lang.hitch(this, function(){
				this.scroll(-1);
			})));
			
			this.outerWidget.addChild(this.scrollUpWidget);
			this.outerWidget.addChild(this.scrollWidget);
			this.outerWidget.addChild(this.scrollDownWidget);
			this.scrollWidget.addChild(this.baseWidget);
			this.baseWidget.startup();

			
 			array.forEach(this.children, function(child){
 			    on.emit(child, 'render', {
 			        bubbles : true,
 			        cancelable : true
 			    });
 			});
 			
			//don't want separator as first item
			if(this.children[0].separator){
				this.children[0].destroy();
			}
			
			//split out of current thread to allow renders to be processed
			var menu = this;
			window.setTimeout(function(){
				popup.open({
					//popup: this.baseWidget,
					popup: menu.outerWidget,
					around: ownerNode,
					orient: [menu.orient]
				});

				/* 185540 - _repositionAll crashes app while list refreshes
					menus do not need to reposition as we hide them on screen rotation and scrolling */
				popup._repositionAll = function () { };

				var menuHeight = domGeometry.getContentBox(menu.baseWidget.domNode).h;
				var menuParentHeight = domGeometry.getContentBox(menu.baseWidget.domNode.parentNode).h;
				if(menuHeight>menuParentHeight){
					domStyle.set(menu.scrollUpWidget.domNode, 'display', 'block');
					domStyle.set(menu.scrollWidget.domNode, 'top', '48px');
					domStyle.set(menu.scrollDownWidget.domNode, 'display', 'block');
					domStyle.set(menu.scrollDownWidget.domNode, 'top', (height-48)+'px');
					//Need to save room at the bottom of the scroll widget for the down arrows
					domStyle.set(menu.scrollWidget.domNode,'height', (height-96)+'px');
				}
				else {
					domStyle.set(menu.outerWidget.domNode, 'height', 'auto');
					domStyle.set(menu.scrollWidget.domNode, 'height', 'auto');
				}
				if(menu.orient=='below-alt'){
					var popupNode = menu.outerWidget.domNode.parentNode;
					var offset = menu.baseWidget.domNode.offsetWidth;
					var oldLeft = domStyle.get(popupNode, 'left');
					if (offset <= viewBox.w && oldLeft + offset > viewBox.w) {
						// IE and latest Chrome don't position correctly
						domStyle.set(popupNode, {'left':(oldLeft-offset)+'px'});
					}
				}
				menu.ui.currentMenu = menu;
			}, 100);
		},
		
		scroll: function(dir){
			var itemBox = domGeometry.getContentBox(this.baseWidget.domNode);
			var move = dir * 3 * itemBox.h / this.items.length;
			domStyle.set(this.baseWidget.domNode, 'position', 'relative');
			var newTop = parseInt(domStyle.get(this.baseWidget.domNode, 'top'),10) + move;

			if(newTop>0){
				domStyle.set(this.baseWidget.domNode, 'top', '0px');
				 // Had to remove disabled classes inside in order to allow :active to work correctly. 
				domClass.remove(this.scrollDownWidget.domNode, 'downArrowDisabled');
				domAttr.remove(this.scrollDownWidget.domNode, 'disabled');
				 // Had to set disabled classes in new thread in order to allow :active to work correctly.
				setTimeout(lang.hitch(this, function(){
					domClass.add(this.scrollUpWidget.domNode, 'upArrowDisabled');
					domAttr.set(this.scrollUpWidget.domNode, 'disabled', true);
				}), 100);
			}
			else{
				domClass.remove(this.scrollUpWidget.domNode, 'upArrowDisabled');
				domAttr.remove(this.scrollUpWidget.domNode, 'disabled');
				var menuHeight = domGeometry.getContentBox(this.baseWidget.domNode).h;
				var menuParentHeight = domGeometry.getContentBox(this.baseWidget.domNode.parentNode).h;
				if((newTop+menuHeight) > menuParentHeight){
					domStyle.set(this.baseWidget.domNode, 'top', newTop+'px');
					 // Had to remove disabled classes inside in order to allow :active to work correctly.
					domClass.remove(this.scrollDownWidget.domNode, 'downArrowDisabled');
					domAttr.remove(this.scrollDownWidget.domNode, 'disabled');
				}
				else {
					domStyle.set(this.baseWidget.domNode, 'top', (menuParentHeight - menuHeight  +1)+'px');
					 // Had to set disabled classes in new thread in order to allow :active to work correctly.
					setTimeout(lang.hitch(this, function(){
						domClass.add(this.scrollDownWidget.domNode, 'downArrowDisabled');
						domAttr.set(this.scrollDownWidget.domNode, 'disabled', true);
					}), 100);	
				}
			}
		},
		
		getParent: function(){
			return this.owner.parentControl;
		},
		
		hide: function(){
			//popup.close(this.baseWidget);
			popup.close(this.outerWidget);
			this.destroy();
		},

		destroy: function(){
			if(this.outerWidget){
				this.outerWidget.destroyRecursive();
				this.outerWidget = null;
			}
			if(this.scrollUpWidget){
				this.scrollUpWidget.destroyRecursive();
				this.scrollUpWidget = null;
			}
			if(this.scrollWidget){
				this.scrollWidget.destroyRecursive();
				this.scrollWidget = null;
			}
			if(this.scrollDownWidget){
				this.scrollDownWidget.destroyRecursive();
				this.scrollDownWidget = null;
			}
		},
		
		bindEvents: function(){
			//override to do nothing
		}
	});
});
