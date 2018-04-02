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

define("platform/ui/control/Container",
		[ "dojo/_base/declare",
		  "platform/ui/control/_ContainerControlBase",
		  "dijit/layout/ContentPane"
], function(declare, ContainerControlBase, ContentPane) {
	return declare(ContainerControlBase, {

			constructor : function(options) {
				this._controlType = 'Container';
				//TODO - add some layout setting information to allow us to pick up for layout manager?
			},

/**@memberOf platform.ui.control.Container */
			build : function() {
				// summary:
				// Build the control
				//
				// description:
				// This is where we setup all internals and create any
				// widgets
				this.baseWidget = this.createWidget(ContentPane, {
					id: this.getId(),
					'class': (this['cssClass'])?this['cssClass']:''
				});

				return this.inherited(arguments);

			},

			postCreate : function() {
				// summary:
				// To be implemented by children
				//
				// description:
				// Will be called after all controls are built and placed in
				// the DOM
				this.inherited(arguments);
			}

		});
});
