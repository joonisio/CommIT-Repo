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
 * JS pair of the Java the com.ibm.tivoli.si.codeScanner.CodeScannerResult
 * It only serve as a reference to the result retrieve by the CodeScanner
 */
define("platform/codeScanner/CodeScannerResult",
[ "dojo/_base/declare" ], 
function(declare) {
	return declare(null, {
		/*String*/ text: null,
		/**@memberOf platform.codeScanner.CodeScannerResult */
		/*String*/ format: null,
		/*byte[]*/ rawBytes: null
	});
});
