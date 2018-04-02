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

define("platform/ui/control/ErrorActions", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/Actions",
	     "dojo/_base/lang" ],
function(declare, Actions, lang) {
	return declare( Actions, {
		/**@memberOf platform.ui.control.ErrorActions */
		constructor : function(options) {
			this._controlType = 'ErrorActions';
			lang.mixin(this, options);
		},
	});
});
