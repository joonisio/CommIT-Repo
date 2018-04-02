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

define("platform/ui/control/Action", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase"],
function(declare, ControlBase) {
	return declare( [ControlBase], {
		hidden: false, 
		
		constructor : function(options) {
			this._controlType = 'Action';
			this.options = options;
			this.display = true;
			this.enabled = true;
			this.visible = true;
		},
		
/**@memberOf platform.ui.control.Action */
		setVisibility : function(vis) {
			this.visible = vis;
			this.inherited(arguments);
		},
		
		setDisplay : function(vis) {
			this.display = vis;
			this.inherited(arguments);
		},
		
		setEnabled : function(vis) {
			this.enabled = vis;
			this.inherited(arguments);
		},
		
		clickable : function() {
			return this.enabled && this.display && this.visible;
		},
		
		hide: function(){
			this.hidden = true;
			this.display = false;
		},
		
		show: function(){
			this.display = true;
			this.enabled = true;
			this.visible = true;
		},
		
	});
});
