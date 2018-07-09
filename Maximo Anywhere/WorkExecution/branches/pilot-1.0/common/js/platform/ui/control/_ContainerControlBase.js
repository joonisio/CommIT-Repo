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

define("platform/ui/control/_ContainerControlBase", [
        "dojo/_base/declare",
        "platform/ui/control/_ControlBase",
        "platform/ui/layout/_LayoutAdapter",
        "dojo/_base/lang",
        "dojo/_base/array",
        "platform/logging/Logger",
        "dojo/dom-construct"], 
function(declare, ControlBase, LayoutAdapter, lang, array, Logger, domConstruct) {
	return declare([ ControlBase ], {
	    CanBuildChildren : true,
	    layoutAdapter: null,
	    nodeRef: null,
	    
	    constructor : function(options) {
		    this.children = [];
		    this.childKeys = [];
		    if (options && options.childControls) {
			    array.forEach(options.childControls, function(child) {
				    this.addChild(child);
			    }, this);
		    }
	    },

/**@memberOf platform.ui.control._ContainerControlBase */
	    build : function() {
		    this.inherited(arguments);
		    var viewControl = this._controlType == 'View'?this:null;
		    this.layoutAdapter = new LayoutAdapter({
		        application : this.application,
		        baseWidget : this.baseWidget,
		        view : viewControl, 
		        splitterPane : this.splitterPane,
		        layoutName : this.layout
		    });
		    this.buildChildren();
		    return this.layoutAdapter.getBaseWidget();
	    },

	    _addChildToBaseWidget : function(control, itemWidget) {
		    // summary:
		    // The entry point to add a Dojo widget to the "baseWidget" of this
		    // class
		    //
		    // description:
		    // The "baseWidget" is actually a LayoutAdapter and we need a
		    // consistent way of
		    // adding children Dojo widgets into it in all subclasses.
		    this.layoutAdapter.addChild(control, itemWidget);
	    },

	    buildChildren : function(rebuild) {
		    if (typeof rebuild == 'undefined') {
			    rebuild = false;
		    }
		    if (!this.CanBuildChildren && !rebuild) {
			    return;
		    }
		    for (index in this.children) {
			    var child = this.children[index];
			    child.setParentReference(this);
			    if (child.build && !child.baseWidget) {
				    child.createMyResource(child.resource);
				    var builtItem = child.build();
				    if (builtItem) {
					    if (this.baseWidget.addChild) {
					       this._addChildToBaseWidget(child, builtItem);
					    } else if (builtItem.domNode && this.baseWidget.domNode && this.baseWidget.domNode.appendChild) {
						    this.baseWidget.domNode.appendChild(builtItem.domNode);
					    }
				    }
			    }
		    }

		    this.postCreate();
	    },

	    getContainerNode : function() {
		    return this.nodeRef;
	    },

	    addChild : function(child) {
		    if (!child.id) {
			    child.id = (this.id?this.id:'') + "_child_" + this.children.length;
			    Logger.trace("had to create id["+child.id+"] for "+child._controlType);
		    }
	    	this.children.push(child);
	    	this.childKeys[child.id] = this.children.length - 1;
	    },

	    getChild : function(id) {
		    return this.children[this.childKeys[id]];
	    },

	    render : function() {
		    this.inherited(arguments);
		    
		    //Only build the children for a view if can build children is true
		    if (this._controlType != 'View' || this.CanBuildChildren === true)
		    array.forEach(this.children, function(child) {
			    child.render();
		    }, this);
	    },

	    postCreate : function() {
		    // summary:
		    // To be implemented by children
		    //
		    // description:
		    // Will be called after all controls are built and placed in the DOM
		    this.inherited(arguments);
		    array.forEach(this.children, function(item, index) {
			    if (item.built) {
				    item.postCreate(arguments);
			    }
		    }, this);
	    },

	    prepareForShow : function() {
		    this.CanBuildChildren = true;
		    if ((!this.resource || this.resourceObject) && (this.application.getObjectSize(this.requiredResources) == 0)) {
			    return this.show();
		    }
		    this.createMyResources();
	    },

	    destroyChildren : function() {
		    array.forEach(this.children, function(item, index) {
			    item.destroy();
		    }, this);
	    },

	    destroy : function() {
		    this.destroyChildren();
		    if (this.layoutAdapter) {
		    	this.layoutAdapter.destroy();
		    	this.layoutAdapter = null;
		    }
		    this.nodeRef = null;
		    if (this.baseWidget) {
			    if (this.baseWidget.domNode){
					domConstruct.destroy(this.baseWidget.domNode);
			    }
		    }
		    
		    this.inherited(arguments);
	    }
	});
});
