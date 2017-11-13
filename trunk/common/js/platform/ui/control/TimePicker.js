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

define("platform/ui/control/TimePicker",
		[ "dojo/_base/declare",
		  "platform/ui/control/_ControlBase",
		  "dijit/layout/ContentPane",
		  "dojox/mobile/ValuePickerTimePicker"
		], 
function(declare, ControlBase, ContentPane, TimePicker) {
	/**@class platform.ui.control.TimePicker */
	return declare( ControlBase, {
		    /**@constructor */
			constructor : function(options) {
				this._controlType = 'TimePicker';
			},

			/**@memberOf platform.ui.control.TimePicker**/
			build : function() {
				// summary:
				// Build the control
				//
				// description:
				// This is where we setup all internals and create any
				// widgets
				this.baseWidget = this.createWidget(ContentPane, {
					id: this.getId(),
					style: 'display: inline'
				});
				this.timeWidget = this.createWidget(TimePicker, {
					id: this.getId() + '_tPicker',
					style: 'display: inline'
				});
				this.baseWidget.addChild(this.timeWidget);

				return this.inherited(arguments);
			},

			postCreate : function() {
				// summary:
				// To be implemented by children
				//
				// description:
				// Will be called after all controls are built and placed in
				// the DOM
				
				this.timeWidget.startup();
				this.baseWidget.startup();
				
				this.inherited(arguments);
			},

			destroy : function() {
				// summary:
				// Destroy this control's baseWidget
				//
				// description:
				// Use to clean up this object
				this.inherited();
				this.baseWidget.destroy();
				this.baseWidget = null;
			}
		});
});
