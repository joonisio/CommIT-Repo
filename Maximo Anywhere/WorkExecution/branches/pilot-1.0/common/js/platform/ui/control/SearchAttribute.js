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

define("platform/ui/control/SearchAttribute", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase"],
function(declare, ControlBase) {
	return declare( ControlBase, {
		/**@memberOf platform.ui.control.SearchAttribute */
		constructor : function(options) {
			this._controlType = 'SearchAttribute';
		}
	});
});
