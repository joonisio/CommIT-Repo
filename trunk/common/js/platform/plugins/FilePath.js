/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2016 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */
define("platform/plugins/FilePath", [
	"platform/logging/Logger",
	"platform/exception/PlatformRuntimeException"
], function (Logger, PlatformRuntimeException) {
    /**
     * Resolve native path for given content URL/path.
     * @param {String} path  Content URL/path.
     * @param successCallback  invoked with a native filesystem path string
     * @param errorCallback  invoked if error occurs
     */
	return {
		resolveNativePath: function(path, successCallback, errorCallback) {
			cordova.exec(successCallback, errorCallback, "FilePath", "resolveNativePath", [path]);
    		}
	};
});

