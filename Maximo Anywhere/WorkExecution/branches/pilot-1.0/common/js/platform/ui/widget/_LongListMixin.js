/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("platform/ui/widget/_LongListMixin", [
		"dojo/_base/declare",
        "dojo/_base/array",
        "dojox/mobile/LongListMixin",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojox/mobile/viewRegistry",
        "dojo/aspect"], 
function(declare, array, LongListMixin, lang, domConstruct, viewRegistry, aspect) {
	// module:
	// dojox/mobile/_LongeListMixin

	return declare(LongListMixin, {
/**@memberOf platform.ui.widget._LongListMixin */
		startup : function(){
			if(this._started){ return this._started = true; }
			this.maxPages = 2;
			if(!this.editable){
				aspect.after(this, "_addBefore", function(response){
					this.control.fixTransitionIcons();
				});
				aspect.after(this, "_addAfter", function(response){
					this.control.fixTransitionIcons();
				});
				try {
					this._sv = viewRegistry.getEnclosingScrollable(this.domNode);
					if(!this._sv){
						throw null;
					}
				}
				catch(error){
					if(this.control.viewControl){
						this._sv = this.control.viewControl.baseWidget;
					}
				}

				if(this._sv){

					// Get all children already added (e.g. through markup) and initialize _items
					this._items = this.getChildren();

					// remove all existing items from the old container node
					this._clearItems();

					this.containerNode = domConstruct.create("div", null, this.domNode);

					// listen to scrollTo and slideTo from the parent scrollable object

					this.connect(this._sv, "scrollTo", lang.hitch(this, this._loadItems), true);
					this.connect(this._sv, "slideTo", lang.hitch(this, this._loadItems), true);

					// The _topDiv and _bottomDiv elements are place holders for the items
					// that are not actually in the DOM at the top and bottom of the list.

					this._topDiv = domConstruct.create("div", null, this.domNode, "first");
					this._bottomDiv = domConstruct.create("div", null, this.domNode, "last");

					this._reloadItems();
				}
			}
		},

	});
});
