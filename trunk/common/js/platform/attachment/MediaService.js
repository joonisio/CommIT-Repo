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

define("platform/attachment/MediaService",
["dojo/Deferred",
 "dojo/_base/lang",
 "dojo/_base/array", 
 "platform/attachment/FileService",
 "platform/logging/Logger",
 "platform/plugins/PermissionsPlugin"], 
function(Deferred, lang, arrayUtil, FileService, Logger, PermissionsPlugin) {
	"use strict";
	// This code is needed to load the UTs, otherwise it fails
	(function(){
		if(WL && WL.Client && WL.Client.getEnvironment()==WL.Environment.PREVIEW){
			//Only initialize specially in PREVIEW mode		
			if(!navigator.camera){
				navigator.camera = {};
			}
			if(!navigator.camera.EncodingType){
				navigator.camera.EncodingType = {};
				navigator.camera.EncodingType.JPEG = 0;
				navigator.camera.EncodingType.PNG = 1;
				navigator.camera.DestinationType = {};
				navigator.camera.DestinationType.FILE_URI = 1;
				navigator.camera.PictureSourceType = {};
				navigator.camera.PictureSourceType.CAMERA = 1;
				navigator.camera.PictureSourceType.SAVEDPHOTOALBUM = 2;
				navigator.camera.MediaType = {};
				navigator.camera.MediaType.PICTURE = 0;
			}	
		}				
	})();
	
	var convertSettings;
	var defaultSettingsForPhoto;
	var defaultSettingsForPhotoiOS;
	var defaultSettingsForGallery;
	var emulatoImgFromGallery;
	
	document.addEventListener("deviceready", function() {
		Logger.traceJSON("Media Service Initialize. [INF181051 IN1999]: ",navigator.camera);
		defaultSettingsForPhoto = {
			quality : 50,
			allowEdit: false,
			encodingType:  navigator.camera.EncodingType.PNG,
			destinationType : navigator.camera.DestinationType.FILE_URI,
			sourceType : navigator.camera.PictureSourceType.CAMERA,
			saveToPhotoAlbum: true
		};
		
		defaultSettingsForPhotoiOS = {
				quality : 50,
				allowEdit: false,
				destinationType : navigator.camera.DestinationType.FILE_URI,
				sourceType : navigator.camera.PictureSourceType.CAMERA,
				saveToPhotoAlbum: true,
				correctOrientation: true,
			};
		
		defaultSettingsForGallery = {
			destinationType : navigator.camera.DestinationType.FILE_URI,
			sourceType : navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
			mediaType: navigator.camera.MediaType.PICTURE
		};
		
		emulatoImgFromGallery ={ name: 'previewfoto', size: 2000, type: 'image/jpg'};
		
		convertSettings = function(settings, defaultSettings){
			if(settings){
				var resultingSettings = lang.clone(defaultSettings);
				if(settings.quality >= 0 || settings.quality <= 100){
					resultingSettings.quality = settings.quality;
				}
				if(settings.jpeg === true){
					resultingSettings.encodingType = navigator.camera.EncodingType.JPEG;
				}
				return resultingSettings;
			}
			else{
				return defaultSettings;
			}
		};
	});
	
	
	
	return {		
/**@memberOf platform.attachment.MediaService */
		capturePictureAsPromise: function(settings){			
			/*=====
			 capturePictureAsPromise: function(settings){
				 // summary:
				 //		Capture a picture from Camera using settings? to configure the picture properties.
				 //
				 // settings: Object?
				 //		A javascript object to define properties for the picture to be taken such as type (jpeg/png) and quality (0 to 100).
				 //		{
				 //			jpeg: true|false (defaults to false),
				 //			quality: 0-100 (defaults to 50),				 
				 //		}
				 //
				 // returns: A promise to be fulfilled with an object containing the name, fullPath, size, type and lastModifiedDate of the file located at
				 //		filePath or null if the photo is canceled. In case of
				 //	an error, the promise will be rejected. The success object has the property filePath set with the photo path. If the photo
				 // has been canceled, filePath is null. If there is an error, the message is returned in the error object of the otherwise callback.
				 //
				 // description:
				 //		This function opens the camera and allows the user to take a picture and returns its file path as the promise result. 
				 // example:
				 //	|	MediaService.capturePictureAsPromise({jpeg: true, quality: 60}).then(function(photo){ alert(photo.filePath); }).otherwise(function(error){ alert(error.message);});
			 },
			 =====*/			
			var deferred = new Deferred();
			Logger.trace("Launch Camera. [INF181051 IN1001]");
			var onSuccess = function(result){
				if(WL.Client.getEnvironment()==WL.Environment.PREVIEW){
					emulatoImgFromGallery.fullPath = result;
					deferred.resolve(emulatoImgFromGallery);
				} else{
					FileService.infoAsPromise(result).then(function(fileInfo){
						Logger.trace("Camera to fileservice. [INF181051 ER1002]");
						deferred.resolve(fileInfo);	
					}).otherwise(function(error){						
						Logger.errorJSON("Camera to fileservice rejected. [INF181051 ER1003]",error);						
						deferred.reject(error);						
					});		
				}
			}; 
			
			var onError = function(error){
				if(error && "Camera cancelled." === error){					
					Logger.traceJSON("Camera launch error. Cancelled. [INF181051 ER1004]: ",error);					
					deferred.resolve({filePath: null});					
				}
				else {					
					Logger.errorJSON("Camera launch error. [INF181051 ER1005]: ",error);					
					deferred.reject({message: error});					
				}
			};
			
			var camera_settings = null;
			if (WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD) {
			    camera_settings = convertSettings(settings, defaultSettingsForPhotoiOS);
			} else {
			    camera_settings = convertSettings(settings, defaultSettingsForPhoto);
			}
			
			Logger.traceJSON("Calling Camera API. [INF181051 IN1014]: Camera default Settings: ",defaultSettingsForPhoto);			
			Logger.traceJSON("Calling Camera API. [INF181051 IN1015]: Camera Settings: ",camera_settings);
			
			camera_settings.sourceType = 1; //Forcing to open up the camera. Seems the camera initialization is wrong
			
			PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.CAMERA, [PermissionsPlugin.WRITE_EXTERNAL_STORAGE, PermissionsPlugin.READ_EXTERNAL_STORAGE, PermissionsPlugin.CAMERA], this, navigator.camera.getPicture, [onSuccess, onError, camera_settings]);
								
			return deferred.promise;
		},
		
		pickFromGalleryAsPromise: function(){
			/*=====
			 pickFromGalleryAsPromise: function(){
				 // summary:
				 //		Capture a picture from photo gallery 
				 //
				 //
				 // returns: A promise to be fulfilled with an object containing the name, fullPath, size, type and lastModifiedDate of the file located at
				 //		filePath or null if the selection is canceled. In case of
				 //	an error, the promise will be rejected. The success object has the property filePath set with the photo path. If the photo
				 // has been canceled, filePath is null. If there is an error, the message is returned in the error object of the otherwise callback.
				 //
				 // description:
				 //		This function opens the device's photo gallery and allows the user to pick a photo and returns its file info as the promise result. 				 
				 // example:
				 //	|	MediaService.pickFromGaleryAsPromise().then(function(photo){ alert(photo.filePath); }).otherwise(function(error){ alert(error.message);});
			 },
			 =====*/
			Logger.trace("Call Gallery. [INF181051 IN1101]" );

			var deferred = new Deferred();
			
			var onSuccess = function(sourcePath){
				if(WL.Client.getEnvironment()==WL.Environment.PREVIEW){
					emulatoImgFromGallery.fullPath = sourcePath;
					deferred.resolve(emulatoImgFromGallery);
				} else{
					Logger.trace("Call Gallery success fileservice. [INF181051 IN1102]: " );
					FileService.infoAsPromise(sourcePath).then(function(fileInfo){
						Logger.trace("Call Gallery success fileinfo success. [INF181051 IN1101]: " );
						deferred.resolve(fileInfo);	
					}).otherwise(function(error){						
						Logger.errorJSON("Call Gallery error. [INF181051 IN1103]: ",error);						
						deferred.reject({message: error});						
					});		
				}
			}; 
			
			var onError = function(error){				
				Logger.traceJSON("Call Gallery error. [INF181051 IN1104]: ",error);				
				if(error && "Selection cancelled." === error){					
					Logger.traceJSON("Call Gallery error resolved on cancel. [INF181051 IN1105]: ",error);					
					deferred.resolve({filePath: null});					
				}
				else {						
					Logger.errorJSON("Call Gallery error reject. [INF181051 IN1106]: ",error);						
					deferred.reject({message: error});						
				}						
			}; 
			
			if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
				defaultSettingsForGallery.destinationType = navigator.camera.DestinationType.NATIVE_URI;
			} else {
				defaultSettingsForGallery.destinationType = navigator.camera.DestinationType.FILE_URI;
			}
						
			Logger.traceJSON("Gallery settings. [INF181051 IN1107]: ",defaultSettingsForGallery);	
			
			PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.CAMERA, [PermissionsPlugin.WRITE_EXTERNAL_STORAGE, PermissionsPlugin.READ_EXTERNAL_STORAGE, PermissionsPlugin.CAMERA], this, navigator.camera.getPicture, [onSuccess, onError, defaultSettingsForGallery]);
			
			return deferred.promise;
		}		
	};
});
