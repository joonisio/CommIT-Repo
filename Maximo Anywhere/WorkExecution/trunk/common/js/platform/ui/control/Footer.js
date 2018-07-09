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

define("platform/ui/control/Footer", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ContainerControlBase",
	     "dojo/_base/lang" ],
function(declare, ContainerControlBase, lang) {
	return declare( ContainerControlBase, {
		/**@memberOf platform.ui.control.Footer */
		constructor : function(options) {
			this._controlType = 'Footer';
			lang.mixin(this, options);
		},
		
	});
});
