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
 * This object is a mirror of the java side class com.ibm.tivoli.si.map.directions.DirectionsStep
 */
define("platform/map/directions/DirectionsStep",
[ "dojo/_base/declare" ], 
function(declare) {
	/** @class platform.map.directions.DirectionsStep */
	return declare(null, {
		/** @memberOf platform.map.directions.DirectionsStep */
		/*double*/ length: 0,
		/*double*/ time: 0,
		/*String*/ directions: "",
		/*double*/ ETA: 0,
	});
});
