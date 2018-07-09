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

define("platform/util/CallbackCreator", ["dojo/_base/declare","dojo/_base/lang"],
function(declare, lang) {
	return declare(null, {
/**@memberOf platform.util.CallbackCreator */
		makeCallback: function(){
			var self = this;
			var args = arguments;
			var methodName = [].shift.apply(args);
			var method = (lang.isFunction(methodName)) ? methodName : this[methodName];
			return function(result){
				[].unshift.call(args, result);
				return method.apply(self, args);
			};
		}
	});
});
