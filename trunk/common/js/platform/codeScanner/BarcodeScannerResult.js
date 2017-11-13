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
 * JS pair of the Java the com.ibm.tivoli.si.codeScanner.BarcodeScannerResult
 * It only serve as a reference to the result retrieve by the CodeScanner
 */
define("platform/codeScanner/BarcodeScannerResult",
[ "dojo/_base/declare" ], 
function(declare) {
	return declare(null, {
		/*String*/ text: null,
		/*String*/ format: null,
		/*byte[]*/ rawBytes: null,
		/**@memberOf platform.codeScanner.BarcodeScannerResult */
		/*String*/ upcEanExtension: null,
		/*int*/ orientation: 0,
		/*String*/ errorCorrectionLevel: null
	});
});
