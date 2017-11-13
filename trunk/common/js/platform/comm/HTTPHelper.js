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

define("platform/comm/HTTPHelper", [
	"dojo/Deferred",
	"dojo/_base/lang",
], function(Deferred, lang){
	
	return {			
/**@memberOf platform.comm.HTTPHelper */
		isResponseReceived: function(httpCode){		
			/* these are statuses that can tell us if we didnt reach the oslc provider
			*/
			return httpCode && httpCode != 503;
		},
		isConflictingTransaction: function(httpCode){
			return httpCode == 409;
		},
		getResponseInfoUponError: function(response){
			var errorInfo = response.errors[0] || {};
			// adapter might be on but oslc not - use 503 - service unavailable
			// as adapter does not return any http code
			//oslc can return 404 and 400 as valid errors.  404 can be returned as next page not found,
			//or relationship not found, or querybase not found.  400 is general business object errors.
			
			var statusCode = errorInfo["oslc:statusCode"] || 503;
			var errorMessage = errorInfo["oslc:message"] || "";			
			return {"statusCode": statusCode, 
					"message": errorMessage, 
					"headers": lang.getObject("responseHeaders", false, response) || null
			};
		},
		isUnauthorized: function(httpCode){
			return httpCode == 401 || httpCode == 403 || false;
		}
	};
	
});
