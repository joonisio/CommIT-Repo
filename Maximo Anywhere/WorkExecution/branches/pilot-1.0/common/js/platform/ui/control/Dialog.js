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

define("platform/ui/control/Dialog", [
        "dojo/_base/declare",
        "platform/ui/control/_ContainerControlBase",
        "platform/ui/widget/Label",
        "dojo/_base/array",
        "platform/ui/widget/SimpleDialog",
        "dojox/mobile/ScrollablePane",
        "platform/ui/control/Text",
        "dojo/on",
        "dojo/dom-class",
        "dojo/dom-construct",
        "platform/ui/util/OrientationManager",
        "platform/ui/util/OrientationEventListenerMixin" ],
function(declare, ContainerControlBase, Label, array, Dialog, ScrollablePane, Text, on, domClass, domConstruct, OrientationManager, OrientationEventListenerMixin) {
   
	return declare([ ContainerControlBase, OrientationEventListenerMixin ], {
	    baseWidget : null,
	    label : null,
	    labelClassName : 'dialogLabel',
	    CanBuildChildren : false,
	    labelNode: null,
	    
	    constructor : function(options) {
		    this._controlType = 'Dialog';
	    },
	    
/**@memberOf platform.ui.control.Dialog */
		setDefaultButton : function(button) {
			this.defaultButton = button;
		},

	    build : function() {
		    // summary:
		    // Build the control
		    //
		    // description:
		    // This is where we setup all internals and create any widgets
	       
	    	if(this.footer && this.footer.children){
    			array.forEach(this.footer.children, function(child){
    	    		this.addChild(child);
    	    		child.setParentReference(this);
    			}, this);
	    	}
	    	
	       var dialogClass = "mblDialog mblSimpleDialogDecoration ";
	       if(this['cssClass']) {
	          dialogClass += this['cssClass']; 
	       }
	       
		    this.baseWidget = this.createWidget(Dialog, {
		        parentControl : this,
		        id : this.id,
		        "class" : dialogClass
		    });

		    this.scrollPane = this.createWidget(ScrollablePane, {
			    parentControl : this
		    });

		    this.baseWidget.domNode.appendChild(this.scrollPane.domNode);

		    OrientationManager.registerOrientationEventListener(this);
		    
		    return this.inherited(arguments);
	    },

	    hide : function() {
		    this.baseWidget.hide();
		    this.destroyChildren();
		    if(this.opener){
		    	domClass.remove(this.opener.domNode?this.opener.domNode:this.opener, 'mbllistItemHighlight');
		    }
	    },

	    destroyChildren : function() {
	    	
		    this.inherited(arguments);
		    
		    if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
	            if (typeof (CollectGarbage) == "function")
	                CollectGarbage();
	        }
		    
		    //Cannot destroy the basewidget as it will disappear from the registry
		    
		    this.scrollPane.destroyRecursive();
		    
		    if (this.labelNode){
		    	domConstruct.destroy(this.labelNode);
		    	this.labelNode = null;
		    }
		    
		    if (this.footer) {
		    	this.footer.destroy();
		    	this.footer = null;
		    }
	    },

	    show : function() {
		    on.emit(this.baseWidget.domNode, 'show', {
		        bubbles : true,
		        cancelable : true
		    });
		    this.buildChildren();
		    this.postCreate();
		    if (this.label){
		    	// if label node does not exists
				if(!this.baseWidget.domNode.querySelector(".dialogLabel")) {
					this.labelNode = new Label({
						control : this
					}).build().domNode;
					this.baseWidget.domNode.insertBefore(this.labelNode, this.baseWidget.domNode.childNodes[0]);
				}
				else {
					// replace existing label
					this.baseWidget.domNode.querySelector(".dialogLabel").firstChild.nodeValue = this.getLabelString();
				}
		    }
		    this.baseWidget.show();
		    this.render();
		    this.application.hideBusy();
		    this.CanBuildChildren = false;
	    },

	    createMyResource : function(resourceId) {
		    if (!this.CanBuildChildren) {
			    return;
		    }
		    this.application.createResource(this, this.setResourceObject, resourceId, this.queryBase, resourceId);
	    },

	    addTemplate : function(template) {
		    this.template = template;
	    },
	    
	    onOrientationChanged: function(newOrientation) {
	       // if this dialog is not visible no need to re-center it
	       // as the baseWidget.show() will automatically do it for us
	       if(this.baseWidget.domNode.style.display === "none"){ return; }
	       
	       this.baseWidget.refresh();
	    },

	    addChild : function(child){
	    	switch(child._controlType){
    	    	case 'Footer':
       	    		this.footer = child;
       	    		child.setParentReference(this);
    	    		break;
    	    	default:
    	    	    this.inherited(arguments);
    	    		break;
	    	}
	    }

	});
});
