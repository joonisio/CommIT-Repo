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

var wlInitOptions = {
    connectOnStartup : false,
    timeout: 8000, 
    enableLogger : false
};

if (!Object.keys){
//If browser does not support keys, we use the implementation sample from
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
	Object.keys = (function () {
		var hasOwnProperty = Object.prototype.hasOwnProperty,
		hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
		dontEnums = [
		             'toString',
		             'toLocaleString',
		             'valueOf',
		             'hasOwnProperty',
		             'isPrototypeOf',
		             'propertyIsEnumerable',
		             'constructor'
		             ],
		             dontEnumsLength = dontEnums.length;

		return function (obj) {
			if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

			var result = [];

			for (var prop in obj) {
				if (hasOwnProperty.call(obj, prop)) result.push(prop);
			}

			if (hasDontEnumBug) {
				for (var i=0; i < dontEnumsLength; i++) {
					if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
				}
			}
			return result;
		};
	})();
}

WLJSX.bind(window, "load", function() {
	require(["dojo/has", "dojo/i18n!platform/translation/wl-system-messages/nls/messages"],
		function(has, i18nMessages) {
		
			//The following lines are commented/uncommented by the build process
			//For development environment
			//has.add('anywhere-use-mock-bundles', true);
			
			//For test/production environment
			has.add('anywhere-use-mock-bundles', false);
		
			WL.Client.init(wlInitOptions);	
			WL.ClientMessages = i18nMessages;
		    WL.BusyIndicator.__options = {
	        	text : WL.ClientMessages.loading
	        };									    
		}
	);
});
