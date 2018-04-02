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

define("platform/util/runOrRejectWithError", 
		["dojo/Deferred"], 
function(Deferred){
	
	return function(context, func){
		context = (func) ? context : null;
		try {
			return func.apply(context, arguments);
		} catch (e){
			return new Deferred().reject(e);
		}
	};	
});
