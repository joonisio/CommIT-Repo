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

define("platform/ui/control/Group", [ 
	"dojo/_base/declare", 
	"platform/ui/control/_ContainerControlBase", 
	"dojox/mobile/EdgeToEdgeList" ], 
function(declare, ContainerControlBase, RoundRectList) {
    return declare(ContainerControlBase, {
	baseWidget : null,

	constructor : function(options) {
	    this._controlType = 'Group';
	},

/**@memberOf platform.ui.control.Group */
	build : function() {
	    // summary:
	    // Build the control
	    //
	    // description:
	    // This is where we setup all internals and create any widgets
	    this.baseWidget = this.createWidget(RoundRectList, {
	    	id: this.getId(),
	    	control : this,
	    	'class': 'group'
	    });

	    return this.inherited(arguments);
	},

	addTemplate : function(template) {
	    this.template = template;
	},

	postCreate : function() {
	    this.inherited(arguments);
	    this.baseWidget.startup();
	}
    });
});
