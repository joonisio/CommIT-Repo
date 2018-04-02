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

/**
 * createdBy: lcassa@br.ibm.com 
 * 
 * This is an abstract class that represents its peer on the java side WorkOfflineDirections
 */
define("platform/map/WorkOfflineDirections",
[ "dojo/_base/declare", 
  "platform/logging/Logger"], 
function(declare, Logger) {
	return declare(null, 
	{
		
		/*
		 * 
		 */
		constructor: function() {
			
		},

		/*
		 * Just a place holder 
		 */
/**@memberOf platform.map.WorkOfflineDirections */
		getDirectionsToCache: function(/*JSONArray*/ jsonArray, /*JSONObject*/ additionalParameters) {

		},

		/*
		 * Just a place holder to be overritten
		 */
		getMapType: function(/*String*/ mapType) {

		},

		
		/*
		 * Just a place holder to call the native side
		 */
		sendMapProperties: function(jsonObject){

		}

	});
});
