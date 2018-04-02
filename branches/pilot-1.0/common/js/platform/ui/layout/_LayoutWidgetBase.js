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

define("platform/ui/layout/_LayoutWidgetBase",
		[
		 "dojo/_base/declare",
		 "dojo/_base/array",
		 "dijit/_WidgetBase",
		 "dojo/dom-construct",
		 "platform/logging/Logger",
		 "platform/ui/layout/LayoutUtil",
		 ], function(declare, array, WidgetBase, domConstruct, Logger, LayoutUtil) {

	return declare("platform.ui.layout._LayoutWidgetBase", [ WidgetBase ], {
		childWidgets: null,
		
		constructor: function(){
			this.childWidgets = [];
		},
		
/**@memberOf platform.ui.layout._LayoutWidgetBase */
		_storeAttachToDomReference : function(attachTo, domElement) {
			this[attachTo] = domElement;
		},
		
		getChildren: function(){
			return this.childWidgets;
		},
		
		addChild: function(itemWidget) {
			if(this._started && !itemWidget._started){
				itemWidget.startup();
			}
			this.childWidgets.push(itemWidget);
			if(itemWidget.domNode){
				var insertAt = this[itemWidget.layoutInsertAt];
				if(insertAt){
					domConstruct.place(itemWidget.domNode, insertAt);
				}
				else {
					Logger.log('Cannot add an item to layout ['+this.id+']. Position ['+itemWidget.layoutInsertAt+'] does not exist.', 2);
				}
			}
			else {
				Logger.log('Tried to add an item to layout ['+this.id+'], but item has no domNode.', 2);
			}
		},

		addChildren : function(itemWidgets) {
			array.forEach(itemWidgets, function(widget) {
				this.addChild(widget);
			}, this);
		},
		
		destroy: function(){
			array.forEach(this.childWidgets, function(widget) {
				if (widget.destroyRecursive) {
					widget.destroyRecursive();
				}
				if (widget.domNode)
					domConstruct.destroy(widget.domNode);
			}, this);
			this.childWidgets = [];
			this.inherited(arguments);
		}

	});
});
