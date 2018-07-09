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

define("platform/ui/control/DomainValues",
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/store/Memory",
	     "platform/ui/control/_ControlBase"],
function(declare, lang, Memory, ControlBase) {
	return declare( [ ControlBase ], {
		
		IDPROPERTY: 'keyValue',
		SEARCHATTR: 'value',
		
		data: [
		    {IDPROPERTY: '-1', SEARCHATTR: ''},
		],
		
		constructor : function(options) {
			this._controlType = 'DomainValues';
			lang.mixin(this, options);
		},
		
/**@memberOf platform.ui.control.DomainValues */
		addChild: function(child) {
			this.defaultKeyValue = child.defaultValue ? child.keyValue : null;
			this.data.push(child);
		},
		
	});
});
