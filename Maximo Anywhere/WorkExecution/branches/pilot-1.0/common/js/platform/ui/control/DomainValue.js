/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("platform/ui/control/DomainValue",
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "platform/ui/control/_ControlBase"],
function(declare, lang, ControlBase) {
	return declare( [ ControlBase ], {
		/**@memberOf platform.ui.control.DomainValue */
		constructor : function(options) {
			this._controlType = 'DomainValue';
			lang.mixin(this, options);
		},
		
	});
});