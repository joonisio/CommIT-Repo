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

/*
 * This class is only to check if jsonStore is encrypted or not
 * the result of isEncrypted is generated at build time.
 * Check build.properties and build-tasks.xml for more details.
 */
define("platform/store/_StoreProviderSecurity",
[], 
function(){
	var storeProviderSecurity = {
/**@memberOf platform.store._StoreProviderSecurity */
		/*Boolean*/ isEncrypted: function() {
			return true;
		}
	};

	return storeProviderSecurity;
});
