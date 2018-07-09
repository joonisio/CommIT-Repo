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

define("platform/store/_TransactionIdGenerator", 
["dojox/uuid/generateRandomUuid"], function(generateRandomUuid) {
	return {
/**@memberOf platform.store._TransactionIdGenerator */
		newTransactionId: function() {
			/* generate version v4 UUID */
			return generateRandomUuid();
		}
	};
});
