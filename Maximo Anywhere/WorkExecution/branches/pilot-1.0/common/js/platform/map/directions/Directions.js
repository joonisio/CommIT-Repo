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
 * This object is a mirror of the java side class com.ibm.tivoli.si.map.directions.Directions
 * Holds all information regarding routing/directions
 */
define("platform/map/directions/Directions",
[ "dojo/_base/declare" ], 
function(declare) {
	/** @class platform.map.directions.Directions */
	return declare(null, {
		/** @memberOf platform.map.directions.Directions */
		/*DirectionsLeg[]*/ legs: null,
		/*double*/ length: 0,
		/*double*/ time: 0,
		/*String*/ directions: null,
		/*LengthUnit enum*/ lengthUnit: null,
		/*
			miles
			kilometers
			feets
			yards
			nautical_miles
		*/
		
		/*String*/ language: null,
		/*long*/ layerId: null,
		/*double*/ ETA: 0
	});
});
