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

define("platform/comm/_ConnectivityChecker", [
	"platform/comm/_SimulatorConnectivityChecker",
	"platform/comm/_DeviceConnectivityChecker",
	"dojo/_base/lang"
], function(SimulatorConnectivityChecker, DeviceConnectivityChecker, lang){
	
	var environment = null;
	//Rhino throws an error that WL global var is not defined
	//so silently skips it to the DeviceConnectivityChecker
	try{
		if (WL && ('Client' in WL) && ('getEnvironment' in WL['Client'])){
			environment = WL.Client.getEnvironment();
		}		
	} catch (e){
		return DeviceConnectivityChecker;
	}
	
	if (environment === 'preview'){
		return lang.mixin(DeviceConnectivityChecker, SimulatorConnectivityChecker);
		
	} else {
		return DeviceConnectivityChecker;
		
	}	
	
});
