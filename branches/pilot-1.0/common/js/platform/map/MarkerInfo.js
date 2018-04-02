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
 * This object is a mirror of the java side class com.ibm.tivoli.si.map.MarkerInfo
 */
define("platform/map/MarkerInfo",
[ "dojo/_base/declare" ], 
function(declare) {
	return declare(null, {
		/** @memberOf platform.map.MarkerInfo */
		/*int*/ index: 0,
		/** @memberOf platform.map.MarkerInfo */
		/*String*/ encodedPNG: null,
		/*double*/ latitudey: 0,
		/*double*/ longitudex: 0,
		
		constructor: function(/*int*/ index, /*String*/ encodedPNG, /*double*/ latitudey, /*double*/ longitudex) {
			this.index = index;
			this.encodedPNG = encodedPNG;
			this.latitudey = latitudey;
			this.longitudex = longitudex;
		}
	});
});
