/*Copyright (C) 2016 Jason Yang

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

define("platform/plugins/PermissionsPlugin", [
	"platform/logging/Logger",
	"platform/exception/PlatformRuntimeException"
], function (Logger, PlatformRuntimeException) {
    var permissionsName="PermissionsPlugin";
    return {
    	
        ACCESS_FINE_LOCATION : 'android.permission.ACCESS_FINE_LOCATION',
        CAMERA : 'android.permission.CAMERA',
        READ_EXTERNAL_STORAGE : 'android.permission.READ_EXTERNAL_STORAGE',
        WRITE_EXTERNAL_STORAGE : 'android.permission.WRITE_EXTERNAL_STORAGE',
        
    	hasPermission: function(permission, successCallback, errorCallback) {
            Logger.trace("[PermissionsPlugin] hasPermission: " + permission);
            cordova.exec(successCallback, errorCallback, permissionsName, 'hasPermission', [permission]);
        },
        requestPermission: function(permission, successCallback, errorCallback) {
            Logger.trace("[PermissionsPlugin] requestPermission: " + permission);
            cordova.exec(successCallback, errorCallback, permissionsName, 'requestPermission', [permission]);
        },
        requestPermissions: function(permissions, successCallback, errorCallback) {
        	Logger.trace("[PermissionsPlugin] requestPermissions: " + permissions);
            cordova.exec(successCallback, errorCallback, permissionsName, 'requestPermissions', permissions);
        },
        showPermissionsError: function() {
        	Logger.trace("[PermissionsPlugin] showPermissionsError ");
        	throw new PlatformRuntimeException('errorGrantingPermissions');
        },
        checkAndGrantPermissions: function(permissionToCheck, permissionsToGrant, callbackobj, callbackfunctionname, callbackfunctionargs) {
        	//Need to check the permissions on ANDROID
        	var self=this;
			if (WL && WL.Client && WL.Client.getEnvironment()==WL.Environment.ANDROID) {
				this.hasPermission(permissionToCheck, function(status) {
					if(status.hasPermission<0) {
						//Request permissions and only call download on success
						self.requestPermissions(permissionsToGrant
						, function(status) {
							//Callback function
							if (status.hasPermission) {
								callbackfunctionname.apply(callbackobj, callbackfunctionargs);	
							} else {
								self.showPermissionsError();
							}
						}, self.showPermissionsError);
					} else {
						//Has permissions can call callback function
						callbackfunctionname.apply(callbackobj, callbackfunctionargs);		
					}
				}, this.showPermissionsError);
			}  else {
				//Non android can just go ahead with the callback function.
				callbackfunctionname.apply(callbackobj, callbackfunctionargs);	
			}
        }
      
    };

});
