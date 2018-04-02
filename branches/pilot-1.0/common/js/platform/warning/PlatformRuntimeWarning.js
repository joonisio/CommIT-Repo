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

define("platform/warning/PlatformRuntimeWarning", 
	[ 	"dojo/_base/declare",
		"platform/exception/PlatformRuntimeException",
		"platform/translation/MessageService" ],
function(declare, PlatformRuntimeException, MessageService) {
	return declare( [PlatformRuntimeException], {
		//extends PlatformRuntimeException
	});
});
