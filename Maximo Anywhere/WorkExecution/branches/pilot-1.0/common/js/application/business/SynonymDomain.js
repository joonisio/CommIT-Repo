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

define("application/business/SynonymDomain", 
		["dojo/_base/lang",
		 "platform/translation/SynonymDomain",
		 "platform/logging/Logger",], 
		 function(lang, SynonymDomain, Logger) {
	Logger.error("Deprecated: This class application/business/SynonymDomain has been replaced by platform/translation/SynonymDomain");
	return lang.mixin(SynonymDomain, {
		
	});
});
