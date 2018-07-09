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

define( "platform/translation/_MessageBundleLoader", 
[ "dojo/has", "dojo/i18n"],
	function(has, i18n) {
		//A dojo plugin must be a function object with a "load" method
		var MessageBundleLoader = function(){};
		/**@memberOf platform.translation._MessageBundleLoader */
		MessageBundleLoader.load = function(id, requireFunction, loadCallback){
			var bundleToLoad = "application/translation/nls/artifact";
			if (has('anywhere-use-mock-bundles')){
				bundleToLoad = "generated/application/translation/nls/artifact";
			}
			
			i18n.load(bundleToLoad, requireFunction, loadCallback);				
		};
		
		return MessageBundleLoader;
	}
);
