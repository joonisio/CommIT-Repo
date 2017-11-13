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
 * This object is a mirror of the java side class com.ibm.tivoli.si.map.directions.DirectionsLeg
 */
define("platform/map/directions/DirectionsLeg",
[ "dojo/_base/declare" ], 
function(declare) {
	/** @class platform.map.directions.DirectionsLeg */
	return declare(null, {
		//define directionsStep with [ ] or new Array() is causing a retain of memory on EsriDirectionService class.
		//TODO: verify why this is occuring only with the variable steps.
		/*DirectionsStep[]*/ 
		/** @memberOf platform.map.directions.DirectionsLeg */
		steps: new Array(),
		/*double*/ length: 0,
		/*double*/ time: 0,
		/*String*/ directions: "",
		/*LengthUnit enum*/ lengthUnit: null,
		/*
			miles
			kilometers
			feets
			yards
			nautical_miles
		*/
		/** @memberOf platform.map.directions.DirectionsLeg */
		/*double*/ ETA: 0,
		/*int*/ index: -1,
		/*int*/ destinationId: -1,
		/*int*/ destinationIndex: -1,
		/*String*/ destinationEncodedPNG: null,
		/*int*/ originId: -1,
		/*int*/ originIndex: -1,
		/*String*/ originEncodedPNG: null
	});
});
