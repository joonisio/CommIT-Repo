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

define("platform/attachment/FileService",
["dojo/Deferred",
 "dojo/_base/lang",
 "dojo/_base/array", 
 "dojo/promise/all",
 "platform/store/SystemProperties",
 "platform/translation/MessageService",
 "platform/logging/Logger",
 "platform/plugins/PermissionsPlugin",
 "platform/plugins/FilePath"], 
function(Deferred, lang, arrayUtil, all,SystemProperties, MessageService, Logger, PermissionsPlugin, FilePath) {	
	// This code is needed to load the UTs, otherwise it fails
	(function(){
		if(typeof LocalFileSystem == "undefined"){
			LocalFileSystem = {
					PERSISTENT: 0,
					TEMPORARY: 1,
			};
		}					
	})();
	
	var fetchApplicationId = function(onSuccess){		
		if(typeof WL.App.readUserPref === "undefined" || WL.Client.getAppProperty === "undefined"){			
			onSuccess("TestApp");			
		}
		else{
			onSuccess(WL.Client.getAppProperty(WL.AppProperty.APP_DISPLAY_NAME));
		}
	};
	
	var asFileEntryPromise = function(fullPath){
		Logger.trace("[FILESERVICE]: asFileEntryPromise filePath: " + fullPath);
		var deferred = new Deferred();
		if (WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD){
			if(fullPath.indexOf("file://") < 0){
			       fullPath = "file://"+fullPath;
			  }
		}else if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8 ){
			fullPath = fullPath.replace("ms-appdata:///local/", Windows.Storage.ApplicationData.current.localFolder.path + "\\");
		}
		
		Logger.trace("[FILESERVICE]: asFileEntryPromise updated filePath: " + fullPath);
		window.resolveLocalFileSystemURL(
			fullPath, 
			function(fileEntry){				
				Logger.trace("[FILESERVICE]: asFileEntryPromise fileEntry: " + fileEntry);
				Logger.traceJSON("[FILESERVICE]: asFileEntryPromise fileEntry: ",fileEntry);				
				deferred.resolve(fileEntry);				
			},
			function(error){						
				Logger.error("[FILESERVICE]: asFileEntryPromise error: " + error);
				Logger.errorJSON("[FILESERVICE]: asFileEntryPromise error: ",error);					
				deferred.reject(error);				
			}
		);		
		return deferred.promise;
	};	
	
	var baseDirectoryPath = null; 
	
	var getBaseDirectory = function (){
		if (!baseDirectoryPath){
			baseDirectoryPath = new Array();
			var baseDirectory = SystemProperties.getProperty('si.attachment.basedirectory');
			Logger.trace("[FILESERVICE]: getBaseDirectory SystemProperty " + baseDirectory);
			//Just in case check the structure of the basedirectory property see if it has more than one level
			if (baseDirectory && typeof baseDirectory == "string" && baseDirectory.length > 0){
				if(baseDirectory.indexOf('/') >= 0){
					arrayUtil.forEach(baseDirectory.split('/'), function(pathPart){
						if (pathPart.length > 0){
							baseDirectoryPath.push(pathPart);
						}
					});
				}
				else if(baseDirectory.indexOf("\\") >= 0){
					arrayUtil.forEach(baseDirectory.split("\\"), function(pathPart){
						if (pathPart.length > 0){
							baseDirectoryPath.push(pathPart);
						}
					});
				}
				else{
					baseDirectoryPath.push(baseDirectory);
				}
			}
		}
		Logger.trace("[FILESERVICE]: baseDirectoryPath: " + baseDirectoryPath);
		return baseDirectoryPath;
	};
	
	
	return {
/**@memberOf platform.attachment.FileService */
		persistentRootFolderAsPromise: function(){
			// TODO this is probably going to change as we will get this property from some setting.
			/*=====
			 persistentRootFolderAsPromise: function(){
				 // summary:
				 //		returns the persistent folder on device.  
				 //
				 //
				 // returns: A promise fulfilled with an object indicating the fullPath of the persistent folder. In case of errors, the error message is passed in the error object.
				 //
				 // description:
				 //		Takes the path of a persistent storage 				 
				 // example:
				 //	|	FileService.persistentRootFolderAsPromise().then(function(info){ alert(info.fullPath); }).otherwise(function(error){ alert(error.message);});
			 },
			 =====*/
			var deferred = new Deferred();
			if (WL.Client.getEnvironment()!=WL.Environment.PREVIEW) {
				var onSuccess = function(fileSystem){
					//Needed to support deeper return result on cordova plugin 1.0 or greater
					if (fileSystem.filesystem) {
						fileSystem = fileSystem.filesystem;
					}
					Logger.trace("[FILESERVICE]: persistentRootFolderAsPromise fullPath: " + fileSystem.root.fullPath + " root: " + fileSystem.root);
					deferred.resolve({fullPath: fileSystem.root.fullPath, root: fileSystem.root});
				};
				var onError = function(error){					
					Logger.error("[FILESERVICE]: persistentRootFolderAsPromise error: " + error);
					Logger.errorJSON("[FILESERVICE]: persistentRootFolderAsPromise error: ",error);		
					
					deferred.reject({message: JSON.stringify(error)});					
				};
				
				//Need to support new cordova plugin 1.0 quirks on Android
				if (WL.Client.getEnvironment()==WL.Environment.ANDROID && cordova.file && cordova.file.externalRootDirectory) {
					PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.WRITE_EXTERNAL_STORAGE, [PermissionsPlugin.WRITE_EXTERNAL_STORAGE, PermissionsPlugin.READ_EXTERNAL_STORAGE],
							this, window.resolveLocalFileSystemURL, [cordova.file.externalRootDirectory, onSuccess, onError]);
				} else {
					PermissionsPlugin.checkAndGrantPermissions(PermissionsPlugin.WRITE_EXTERNAL_STORAGE, [PermissionsPlugin.WRITE_EXTERNAL_STORAGE, PermissionsPlugin.READ_EXTERNAL_STORAGE],
							this, window.requestFileSystem, [LocalFileSystem.PERSISTENT, 0, onSuccess, onError]);
				}
				
			} else {
				deferred.reject({message: MessageService.createStaticMessage('cannotTestFilesInSimulator').getMessage()});
			}
			
			return deferred.promise;
		},
		temporaryRootFolderAsPromise: function(){
			/*=====
			 temporaryRootFolderWithPromise: function(){
				 // summary:
				 //		returns the temporary folder on device. Files saved in that folder are not guaranteed to remain there.  
				 //
				 //
				 // returns: A promise fulfilled with an object indicating the fullPath of the temporary folder. In case of errors, the error message is passed in the error object.
				 //
				 // description:
				 //		Takes the path of a temporary storage 				 
				 // example:
				 //	|	FileService.temporaryRootFolderAsPromise().then(function(info){ alert(info.fullPath); }).otherwise(function(error){ alert(error.message);});
			 },
			 =====*/
			var deferred = new Deferred();
			var onSuccess = function(fileSystem){
				Logger.trace("[FILESERVICE]: temporaryRootFolderAsPromise fullPath: " + fileSystem.root.fullPath + " root: " + fileSystem.root);				
				deferred.resolve({fullPath: fileSystem.root.fullPath, root: fileSystem.root});
			};
			var onError = function(error){				
				Logger.error("[FILESERVICE]: temporaryRootFolderAsPromise error: " + error);
				Logger.errorJSON("[FILESERVICE]: temporaryRootFolderAsPromise error: ",error);					
				deferred.reject({message: JSON.stringify(error)});				
			};		
			if (WL.Client.getEnvironment()!=WL.Environment.PREVIEW) {
				window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, onSuccess, onError);
			} else {
				deferred.reject({message: MessageService.createStaticMessage('cannotTestFilesInSimulator').getMessage()});
			}
			return deferred.promise;
		},
		copyWithPromise: function(filePath, toDirectory, withFileName){
			/*=====
			 copyWithPromise: function(filePath, toDirectory, withFileName){
				 // summary:
				 //		Copies the file at filePath to toDirectory. If withFileName is specified, the content of filePath will be copied to a file called withFileName
				 //		inside toDirectory. If withFileName is not informed, the target file will have the same name of source file.  
				 //
				 //
				 // returns: A promise fulfilled with an object indicating the fullPath of the moved file. In case of errors, the error message is passed in the error object.
				 //
				 // description:
				 //		This method copies a file at filePath to toDirectory optionally using a new file name at the target. 
				 //
				 // example:
				 //	|	FileService.copyWithPromise("/file/at/image.png", "/file/copies", "myNiceImage.png").then(function(fileInfo){ alert(fileInfo.fullPath);}).otherwise(function(error){ alert(error.message);});)
			 },
			 =====*/
			var deferred = new Deferred();
			
			if(WL.Client.getEnvironment()==WL.Environment.PREVIEW){
				
				deferred.resolve({fullPath: filePath});
			} else{
				var onSuccess = function(fileEntry){
					if(fileEntry.toURL()){
						Logger.trace("[FILESERVICE]: copyWithPromise fullPath: " + fileEntry.toURL());										
						deferred.resolve({fullPath: fileEntry.toURL()});
					}else {
						Logger.trace("[FILESERVICE]: copyWithPromise fullPath: " + fileEntry.fullPath);	
						deferred.resolve({fullPath: fileEntry.fullPath});	
					}
					
				};
				
				var onError = function(error){					
					Logger.error("[FILESERVICE]: copyWithPromise error " + error);	
					Logger.errorJSON("[FILESERVICE]: copyWithPromise error: ",error);						
					deferred.reject({message: JSON.stringify(error)});					
				};
							
				all([asFileEntryPromise(filePath), asFileEntryPromise(toDirectory)]).
				then(function (fileEntries) {
				    fileEntries[1].getFile(fileEntries[0].name, {create:false}, function (file) {
				    	 file.remove(function () {				    		
				    		Logger.trace("[FILESERVICE]: copyWithPromise removed existing file ");	
				            //file already exists and has been removed
				    		Logger.traceJSON("[FILESERVICE]: copying File: ",fileEntries[0]);
				    		Logger.traceJSON("[FILESERVICE]: to: ",fileEntries[1]);				    				
				    		fileEntries[0].copyTo(fileEntries[1], withFileName, onSuccess, onError);				    		
				        }, function () {
				        	Logger.trace("[FILESERVICE]: copyWithPromise reusing existing file: " + file.fullPath);
				            //file already exists couldn't be removed
				            deferred.resolve({ fullPath: file.fullPath });
				        });		
				    }, function (error) {				    	
				    	//File needs to be copied
				    	Logger.traceJSON("[FILESERVICE]: copying File: ",fileEntries[0]);
				    	Logger.traceJSON("[FILESERVICE]: copying File: to",fileEntries[1]);				    								
				    	fileEntries[0].copyTo(fileEntries[1], withFileName, onSuccess, onError);				    	
				    });
					
				}).otherwise(function(error){
					onError(error);
				}
				);
			}
			return deferred.promise;			
		},		
		moveWithPromise: function(filePath, toDirectory, withFileName){
			/*=====
			 moveWithPromise: function(filePath, toDirectory, withFileName){
				 // summary:
				 //		Moves the file at filePath to toDirectory. If withFileName is specified, the content of filePath will be moved to a file called withFileName
				 //		inside toDirectory. If withFileName is not informed, the target file will have the same name of source file.  
				 //
				 //
				 // returns: A promise fulfilled with an object indicating the fullPath of the moved file. In case of errors, the error message is passed in the error object.
				 //
				 // description:
				 //		This method moves a file at filePath to toDirectory optionally using a new file name at the target. 
				 //
				 // example:
				 //	|	FileService.moveWithPromise("/file/at/image.png", "/file/new", "myNiceImage.png").then(function(fileInfo){ alert(fileInfo.fullPath);}).otherwise(function(error){ alert(error.message);});)
			 },
			 =====*/
			var deferred = new Deferred();
			
			var onSuccess = function(fileEntry){
				if(fileEntry.toURL()){
					Logger.trace("[FILESERVICE]: moveWithPromise fullPath: " + fileEntry.toURL());	
					deferred.resolve({fullPath: fileEntry.toURL()});
				}else {
					Logger.trace("[FILESERVICE]: moveWithPromise fullPath: " + fileEntry.fullPath);	
					deferred.resolve({fullPath: fileEntry.fullPath});	
				}
			};
			
			var onError = function(error){				
				Logger.error("[FILESERVICE]: copyWithPromise error: " + error);	
				Logger.errorJSON("[FILESERVICE]: copyWithPromise error: ",error);					
				deferred.reject({message: JSON.stringify(error)});				
			};
						
			all([asFileEntryPromise(filePath), asFileEntryPromise(toDirectory)]).
				then(function(fileEntries){					
					Logger.traceJSON("[FILESERVICE]: moving File: ",fileEntries[0]);
					Logger.traceJSON("[FILESERVICE]: moving File: to: ",fileEntries[1]);							
					fileEntries[0].moveTo(fileEntries[1], withFileName, onSuccess, onError);				
				}).otherwise(function(error){
					onError(error);
				}
			);  			
			return deferred.promise;
		},
		infoAsPromise: function(filePath){
			/*=====
			 infoAsPromise: function(filePath){
				 // summary:
				 //		Returns a promise to be fulfilled with an object containing the name, fullPath, size, type and lastModifiedDate of the file located at
				 //		filePath. If no file exists, the promise is rejected.  
				 //
				 //
				 // returns: A promise fulfilled with an object whose attributes are name (String), fullPath (String), size (long), type (String) and lastModifiedDate (Date)
				 //	or a rejected promise if filePath is not a valid file.
				 //
				 // description:
				 //		This method is used to get information about a file located at filePath. 
				 //
				 // example:
				 //	|	FileService.infoAsPromise("/file/at/image.png").then(function(fileInfo){ alert(fileInfo.name + " " + fileInfo.size);}).otherwise(function(error){ alert(error.message);});)
			 },
			 =====*/			
			Logger.trace("[FILESERVICE]: infoAsPromise: filePath: " + filePath);
			var deferred = new Deferred();			
			asFileEntryPromise(filePath).then(function(fileEntry){				
				fileEntry.file(
					function(fileInfo){
						 if (WL.Client.getEnvironment()==WL.Environment.ANDROID && fileEntry.toURL() && typeof fileEntry.toURL().startsWith === "function" && fileEntry.toURL().startsWith("content://")) {
							 	
								//We have a native file path (usually returned when a user gets a file from their Android gallery)
								//Let's convert to a fileUri that we can consume properly
								FilePath.resolveNativePath(fileEntry.toURL(), function(localFileUri) {
									var response=this._generateResponse(this.parseFileName(localFileUri), localFileUri, fileInfo.size, fileInfo.type, fileInfo.lastModifiedDate);
									Logger.traceJSON("[FILESERVICE]: infoAsPromise: response: ",response);
									deferred.resolve(response);
								}.bind(this), function(error) {
									Logger.errorJSON("[FILESERVICE]: infoAsPromise: error from FilePath resolveNativePath: ",error);						
									deferred.reject({message: JSON.stringify(error)});		
								});
							} else {
								var localURL = fileEntry.toURL();
								var response=this._generateResponse(fileInfo.name, fileInfo.fullPath || localURL, fileInfo.size, fileInfo.type, fileInfo.lastModifiedDate);
								Logger.traceJSON("[FILESERVICE]: infoAsPromise: response: ",response);						
								deferred.resolve(response);		
							}						
					}.bind(this),
					function(error){						
						Logger.error("[FILESERVICE]: infoAsPromise: error from fileEntry.file: " + error);
						Logger.errorJSON("[FILESERVICE]: infoAsPromise: error from fileEntry.file: ",error);						
						deferred.reject({message: JSON.stringify(error)});						
					}
				);				
			}.bind(this)).otherwise(function(error){				
				Logger.error("[FILESERVICE]: infoAsPromise: error from fileEntry: " + error);
				Logger.errorJSON("[FILESERVICE]: infoAsPromise: error from fileEntry: ",error);				
				deferred.reject({message: JSON.stringify(error)});				
			});
			
			return deferred.promise;
		},
		_generateResponse: function(fileName, fileFullPath, fileSize, fileType, fileLastModifiedDate) {
			return {
				name: fileName,			
				fullPath: fileFullPath,				
				size: fileSize,
				type: fileType,
				lastModifiedDate: fileLastModifiedDate
			};
		},
		extensionOf: function(filePath){
			/*=====
			 extensionOf: function(filePath){
				 // summary:
				 //		Returns the extension of filePath. 
				 //
				 //
				 // returns: The extension of a filePath. E.g.: my/file/at/test.txt will return txt. If no extension exists, an empty string is returned.
				 //
				 // description:
				 //		This function returns the extension of a file. If no extension exists, "" is returned. 
				 //
				 // example:
				 //	|	FileService.extensionOf("/file/at/image.png") returns png;
			 },
			 =====*/			
			var pos = filePath.lastIndexOf(".");
			if(pos >= 0){
				return filePath.substring(pos + 1, filePath.length);
			}
			else return "";
		},
		removeDirectoryWithPromise: function(directoryPath){
			Logger.trace("[FILESERVICE]: removeDirectoryWithPromise: directoryPath: " + directoryPath);
			var deferred = new Deferred();
			
			var onSuccess = function(parent){
				Logger.trace("[FILESERVICE]: removeDirectoryWithPromise: parent: " + parent);
				deferred.resolve();
			};
			
			var onError = function(error){				
				Logger.error("[FILESERVICE]: removeDirectoryWithPromise: error: " + error);
				Logger.errorJSON("[FILESERVICE]: removeDirectoryWithPromise: error: ",error);				
				deferred.reject({message: JSON.stringify(error)});				
			};
						
			asFileEntryPromise(directoryPath).then(function(directoryEntry){
				if (directoryEntry.removeRecursively){
					directoryEntry.removeRecursively(onSuccess, onError);
				}
			}).otherwise(function(error){
				onError(error);
			});			  	
			return deferred.promise;			
		},		
		
		removeWithPromise: function(filePath){
			/*=====
			 removeWithPromise: function(filePath){
				 // summary:
				 //		removes the file at filePath.   
				 //
				 //
				 // returns: An empty promise. If the file does not exist, the promise is rejected.
				 //
				 // description:
				 //		This method removes a file at filePath to toDirectory optionally using a new file name at the target. 
				 //
				 // example:
				 //	|	FileService.removeWithPromise("/file/at/image.png").then(function(){ alert("removed");}).otherwise(function(error){ alert(error.message);});)
			 },
			 =====*/
			Logger.trace("[FILESERVICE]: removeWithPromise: filePath: " + filePath);
			var deferred = new Deferred();
			
			var onSuccess = function(fileEntry){
				Logger.trace("[FILESERVICE]: removeWithPromise: fileEntry: " + fileEntry);
				deferred.resolve();
			};
			
			var onError = function(error){				
				Logger.error("[FILESERVICE]: removeWithPromise: error: " + error);
				Logger.errorJSON("[FILESERVICE]: removeWithPromise: error: ",error);				
				deferred.reject({message: JSON.stringify(error)});				
			};
						
			asFileEntryPromise(filePath).then(function(fileEntry){
				fileEntry.remove(onSuccess, onError);
			}).otherwise(function(error){
				onError(error);
			});			  	
			return deferred.promise;			
		},		
		baseDirectoryForWithPromise: function(userName, resourceOwner, resourceId, createDir){
			/*=====
			 baseDirectoryForWithPromise: function(userName, resourceOwner, resourceId){
				 // summary:
				 //		creates or lookup the directory to be used to store the files of userName, resourceOwner and resourceId.   
				 //
				 //
				 // returns: A promise fulfilled with an object indicating the fullPath of the base directory. In case of errors, the error message is passed in the error object. 
				 //
				 // description:
				 //		This method creates or lookup the directory to be used for the given user, resourceOwner and resourceId. All values are optional, and
				 //		default values will be used for the non-informed parameters. 
				 //
				 // example:
				 //	|	FileService.baseDirectoryForWithPromise("wilson", "workOrder", 1231).then(function(result){ alert(result.fullPath);}).otherwise(function(error){ alert(error.message);});)
			 },
			 =====*/
			Logger.trace("[FILESERVICE]: baseDirectoryForWithPromise: userName: " + userName + " resourceOwner: " + resourceOwner
								+ " resourceId: " + resourceId + " createDir: " + createDir);
			userName = userName || "_no_user_";
			resourceOwner = resourceOwner || "_no_resource_";
			resourceId = resourceId || "_no_id_";
			createDir = createDir === false? false : true;
			var deferred = new Deferred();
			
			var directoryList = getBaseDirectory().slice(0);
			
			//user is the first subdirectory under the base
			directoryList.push(userName);
			
			var onError = function(error){				
				Logger.error("[FILESERVICE]: baseDirectoryForWithPromise error: " + error);
				Logger.errorJSON("[FILESERVICE]: baseDirectoryForWithPromise error: ",error);					
				deferred.reject({message: JSON.stringify(error)});				
			};
			
			var onSuccess = function(dirEntry){
				if(dirEntry.toURL()){
					Logger.trace("[FILESERVICE]: baseDirectoryForWithPromise fullPath: " + dirEntry.toURL());	
					deferred.resolve({fullPath: dirEntry.toURL()});
				}else {
					Logger.trace("[FILESERVICE]: baseDirectoryForWithPromise fullPath: " + dirEntry.fullPath);	
					deferred.resolve({fullPath: dirEntry.fullPath});	
				}
			};
			
			//create or get the subdirectory that's named by the first entry in the directory list
			var buildOrGetDirectory = function(parentDirectory){
				//Check to see if the last directory in the list, if so call onSucess to resolve the deferred
				var onSucessToCall = (directoryList.length > 1? buildOrGetDirectory: onSuccess);
				parentDirectory.getDirectory(directoryList.splice(0,1)[0], {create: createDir, exclusive: false}, onSucessToCall, onError);
			};
			
			this.persistentRootFolderAsPromise().then(function(result){
				fetchApplicationId(function(appId){
					//add appid as the next subdirectory
					directoryList.push(appId);
					//add resource name with id as the final subdirectory
					directoryList.push([resourceOwner, resourceId].join("_"));
					buildOrGetDirectory(result.root);
				});
			}).otherwise(function(error){
				deferred.reject(error);
			});			
			return deferred.promise;
		},
		
		parseFileName: function(filePath, withExtension, limit) {
			/* Parse file name given a file path.
			 * 
			 * filePath (String) - the file path (or the file name)
			 * withExtension (boolean) - if true, the file extension will be part of the name
			 * limit (integer) - truncate returned name with n characters (with extension)
			 */
			Logger.trace("[FILESERVICE]: parseFileName filePath: " + filePath + " withExtension: " + withExtension + " limit: " + limit);	
			var pos = (filePath || "").lastIndexOf("/");
			fileName = filePath.substring(pos + 1, filePath.length);
			var latinFileTitle = fileName.replace(/[^\w||^\w.\w]/gi, '');
			//we need to do it since double-byte characters like chinese does not have space so regex return emapty
			if(latinFileTitle && latinFileTitle != ""){
				fileName = 	latinFileTitle;
			}
			
			if(limit == null || limit == undefined || limit == NaN) {
				limit = fileName.length;
			}
			if(withExtension) {
				if(fileName.length > limit) {
					var extension = this.extensionOf(fileName);
					if (!extension)
						fileName = fileName.slice(0, limit);
					else
						fileName = fileName.slice(0, limit - extension.length - 1) + "." + extension;
				}
			}
			else {
				var extension = this.extensionOf(fileName);
				if(extension.length > 0) {
					fileName = fileName.slice(0, fileName.lastIndexOf('.'));
				}
				if(fileName.length > limit) {
					fileName = fileName.slice(0, limit);
				}
			}
			Logger.trace("[FILESERVICE]: parseFileName fileName: " + fileName);				
			return fileName;
		}
	};
		
});
