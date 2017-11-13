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

define("platform/ui/control/Queries", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ContainerControlBase",
	     "dojo/_base/lang",
	     "dojo/_base/array" ],
function(declare, ContainerControlBase, lang, array) {
	return declare( ContainerControlBase, {
		/**@memberOf platform.ui.control.Queries */
		eventHandlers: new Array(),
		/**@memberOf platform.ui.control.Queries */
		constructor : function(options) {
			this._controlType = 'Queries';
			lang.mixin(this, options);
		},
		
	});
});
