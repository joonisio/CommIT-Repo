
/* JavaScript content from js/platform/handlers/AttachmentHandler.js in folder common */

/* JavaScript content from js/platform/handlers/AttachmentHandler.js in folder common */
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

define("platform/handlers/AttachmentHandler", 
	   [ "dojo/_base/declare",
	     "dojo/number",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/attachment/MediaService",
	     "platform/model/ModelService",
	     "platform/auth/UserAuthenticationManager",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/attachment/AttachmentService",
	     "platform/attachment/FileService",
	     "platform/util/PlatformConstants",
	     "platform/store/SystemProperties", 
	     "platform/comm/HTTPHelper",
		 "platform/logging/Logger",
		 "application/handlers/CommonHandler",
	     "dojo/Deferred",
	     "dojo/dom-construct",
	     "platform/exception/PlatformRuntimeException"],
function(declare, numberUtil, ApplicationHandlerBase, MediaService, ModelService, UserAuthenticationManager, PlatformRuntimeWarning, AttachmentService, FileService, PlatformConstants, SystemProperties,HTTPHelper, Logger, CommonHandler, Deferred, domConstruct, PlatformRuntimeException) {
	
	var popUpExtensions = ["png", "jpg", "jpeg", "mp4", "m4a", "mp3", "wav", "txt", "pdf", "doc", "docx"];
	var attachmentDefaultName = '';
	
	return declare( ApplicationHandlerBase, {
		name: 'AttachmentHandler',
		_recordOwner: null,
		_attachmentLookup: null,
		_attachmentLookupAttribute: null,
/**@memberOf platform.handlers.AttachmentHandler */
		_updateAttachmentResourceWithMediaInfo: function(mediaInfo){
			var self = this;
			var limit = SystemProperties.getProperty('si.attach.filenamelimit');
			var fileName = FileService.parseFileName(mediaInfo.name, false, limit);
			this.attachmentDefaultName = fileName;
			Logger.log("Attach:Size of the attachment when picture is taken dvd by 1024 in kb " + parseInt(mediaInfo.size / 1024));
			Logger.log("Attach:Path the attachment when picture is taken dvd by 1024 in kb " + mediaInfo.fullPath);
			Logger.log("Attach:Name of the attachment when picture is taken dvd by 1024 in kb " + fileName);

			ModelService.all("PlatformAttachmentInfoResource").then(function(attachmentInfoSet){				
				var attachmentInfo = attachmentInfoSet.getCurrentRecord(); 
				attachmentInfo.set("localPath", mediaInfo.fullPath);	
				attachmentInfo.set("name", fileName);	
				attachmentInfo.set("fileSize", parseInt(mediaInfo.size / 1024));
				if (WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD){
					attachmentInfo.set("fileType", AttachmentService.extensionOf(mediaInfo.fullPath));
				}else{
					attachmentInfo.set("fileType", mediaInfo.type);
				}
				attachmentInfo.setDateValue("createDate", mediaInfo.createDate);
				attachmentInfo.setNullValue("description");
				attachmentInfo.setNullValue("category");
				
				ModelService.save(attachmentInfoSet).then(function(){
					self.ui.show("Platform.AttachmentInfoView");
				}).otherwise(function(error){
					self.ui.showMessage(error.message);
				});
			}).otherwise(function(error){
				self.ui.showMessage(error);
			});
		},
		_setRecordOwner: function(record){
			this._recordOwner = record;
		},
		_getRecordOwner: function(){
			return this._recordOwner;
		},

		takePhoto: function(eventContext){
			if (!this.ui.getCurrentViewControl().validate())
				return;
			if(SystemProperties.getProperty('si.attach.doclink.doctypes.defpath') == null){
				throw new PlatformRuntimeException('doctypesDefpathNotDefined');
				return;
			}
			
			var self = this;
			var createDate = eventContext.application.getCurrentDateTime();	
			
			//CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			//CommonHandler._getAdditionalResource(eventContext,"permit").getCurrentRecord();

			var permit = CommonHandler._getAdditionalResource(eventContext,"permit").getCurrentRecord();
			console.log(permit);
			this._setRecordOwner(permit);
			
			MediaService.capturePictureAsPromise().then(function(result){
				if(result.fullPath == null){
					//throw new PlatformRuntimeWarning("cameraCancelled");
				}else{
					result.createDate =createDate;
					self._updateAttachmentResourceWithMediaInfo(result);
				}
			}).otherwise(function(error){
				Logger.log("Camera launch error Attachment Handler [INF181051 ER2000]: " + JSON.stringify(error));
				//self.ui.showMessage(error.message);
			});			
		},
		
		launchCameraForPhoto: function(eventContext){
			if (!this.ui.getCurrentViewControl().validate())
				return;
			if(SystemProperties.getProperty('si.attach.doclink.doctypes.defpath') == null){
	    		  throw new PlatformRuntimeException('doctypesDefpathNotDefined');
	    		  return;
	    	  }
			
			var self = this;
			var createDate = eventContext.application.getCurrentDateTime();
			//mover para o set owner
			if(eventContext.getCurrentRecord()){
				this._setRecordOwner(eventContext.getCurrentRecord());
			} else {
				this._setRecordOwner(self.ui.getCurrentViewControl().lists[0].getResource().getParent());
			}
			MediaService.capturePictureAsPromise().then(function(result){
				if(result.fullPath == null){
					//throw new PlatformRuntimeWarning("cameraCancelled");
				}else{
					result.createDate =createDate;
					self._updateAttachmentResourceWithMediaInfo(result);
				}
			}).otherwise(function(error){
				Logger.log("Camera launch error Attachment Handler [INF181051 ER2000]: " + JSON.stringify(error));
				//self.ui.showMessage(error.message);
			});
		},
		
		launchGallery: function(eventContext){
			if(SystemProperties.getProperty('si.attach.doclink.doctypes.defpath') == null){
	    		  throw new PlatformRuntimeException('doctypesDefpathNotDefined');
	    		  return;
	    	  }
			
			var self = this;
			var createDate = eventContext.application.getCurrentDateTime();
			//mover para o set owner
			if(eventContext.getCurrentRecord()){
				this._setRecordOwner(eventContext.getCurrentRecord());
			} else {
				this._setRecordOwner(self.ui.getCurrentViewControl().lists[0].getResource().getParent());
			}
			MediaService.pickFromGalleryAsPromise().then(function(result){
				if(result.fullPath == null){
					//throw new PlatformRuntimeWarning("selectionCancelled");
				}else{
					result.createDate =createDate;
					self._updateAttachmentResourceWithMediaInfo(result);
				}
			}).otherwise(function(error){
				//self.ui.showMessage(error.message);
			});
		},
		
		handleBackButtonAttachmentDetailsView: function(eventContext){
			this.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		cancelAttachmentDetailsView: function(){
			this._setRecordOwner(null);
		},
		
		commitAttachmentEntry: function(eventContext){
						
			eventContext.setEnabled(false);
			var attachmentInfo = eventContext.getCurrentRecord(); 
			var attachmentOwner = this._getRecordOwner();
			var currentUser = UserAuthenticationManager._getCurrentUser();
			var self = this;
			var name = attachmentInfo.get('name');
			if(name == null || name == undefined || name == '') {
				throw new PlatformRuntimeException('requiredFieldName');
			}
			var attachUploadLimit = SystemProperties.getProperty('si.attach.uploadmaxsize');
			Logger.log("Attach:Validation check on file size ");
			Logger.log("Attach:Prop Congfig for the limit si.attach.uploadmaxsize " +attachUploadLimit);
			Logger.log("Attach:Actual attachment file size  " +numberUtil.parse(attachmentInfo.fileSize) );			
			if (attachUploadLimit != null && attachUploadLimit != undefined )
			{	
				Logger.log("Attach:attachUploadLimit validation is not null ");
				
				if (numberUtil.parse(attachmentInfo.fileSize) > numberUtil.parse(attachUploadLimit)/ 1024)
				{
					
					Logger.log("Attach:attachUploadLimit actual attch file size is bigger then set limit show dialog ");
					throw new PlatformRuntimeException('uploadLimit', []);	
				}	
			}			
			self.ui.application.showBusy();
			AttachmentService.attachToRecordWithPromise(currentUser, attachmentInfo, attachmentOwner).then(function(){
				if(!attachmentOwner.isNew()){
					ModelService.save(attachmentOwner.getOwner()).then(function(){
						self.ui.hideCurrentView();
					}).otherwise(function(error){
						self.ui.application.hideBusy();
						self.ui.showMessage(error);
					});
				} else {
					self.ui.hideCurrentView();
				}
				eventContext.setEnabled(true);
			}).otherwise(function(error){
				self.ui.application.hideBusy();
				self.ui.showMessage(error.message);
				eventContext.setEnabled(true);
			});
		},

		updateProgressDialog: function(percentage){			
//			if (!this.progressRecord){   
//				this.progressRecord = this.userInterface.application.getResource('PlatformProgressResource').getRecordAt(0);
//			}
//			this.progressRecord.set('progressMsg',  MessageService.createResolvedMessage('DownloadAttachmentProgressMsg', 
//					[percentage]));
		},

		downloadSingleAttachment: function(eventContext){
//			this.updateProgressDialog(0);
//			this.ui.show("Platform.DownloadingAttachment");
			var attachmentRecord = eventContext.getCurrentRecord();
			return this._downloadSingleAttachment(attachmentRecord);
		},

		_downloadSingleAttachment: function(attachmentRecord){
			var self = this;			
			var ownerRecord = null;
			var currentUser = UserAuthenticationManager._getCurrentUser();
			var credential = UserAuthenticationManager._getSessionId();
			var attachmentMetadata = attachmentRecord.getMetadata();
			
			if(attachmentMetadata.isAttachment){
				ownerRecord = attachmentRecord.getParent() || attachmentRecord;	
			}else{
				throw new PlatformRuntimeWarning("resourceIsNotAttachment", [attachmentMetadata.getResourceName()]);
			}	
			var downloadDeferred = new Deferred();
			var callDownloadWithCredential = function(aCredential){
				var deferred = new Deferred();
				var metadata = ownerRecord.getMetadata();
				AttachmentService.downloadAttachmentForRecord(attachmentRecord, attachmentMetadata, metadata.getResourceName(), AttachmentService.getOwnerRecordIdentifier(ownerRecord), currentUser, aCredential).
				then(function(filePath){
					attachmentRecord.set(PlatformConstants.ATTACH_LOCATION_ATTR, filePath);
					ModelService.save(ownerRecord.getOwner()).then(function(){
						deferred.resolve();
					}).otherwise(function(error){
						deferred.reject(error);
					});
				}, null, function(progress) {
					deferred.progress(progress);  
//					self.updateProgressDialog(progress);
				}).otherwise(function(error){
					deferred.reject(error);
				});
				return deferred.promise;
			};			
			
			callDownloadWithCredential(credential).
			then(
				function success() {
					downloadDeferred.resolve();
				},
				function fail(error){
					if (error instanceof PlatformRuntimeWarning){
						throw error;
					}
					else if(HTTPHelper.isUnauthorized(error.http_status)){
						UserAuthenticationManager.getFreshActiveCredentialsAsPromise().then(function(credentials){
							callDownloadWithCredential(credential).then(
								function success(){
									downloadDeferred.resolve();
								},
								function fail(error){
									downloadDeferred.reject(error);							
								},
								function progress(update){
									downloadDeferred.progress(update);
//									self.updateProgressDialog(update);  
								} 
							);
						}).otherwise(function(error){
							downloadDeferred.reject(error);
						});
					}
					else{
						downloadDeferred.reject(error);	
					}
				},
				function progress (update) {
					downloadDeferred.progress(update);
				}
			);	
			return downloadDeferred.promise;
		},
		preview: function(eventContext){
			var fullPath = eventContext.getCurrentRecord().get(PlatformConstants.ATTACH_LOCATION_ATTR);
			
			if(!fullPath){
				return
			}
			
			function iabLoadError(event) {
			    alert(event.type + ' - ' + event.message);
			    Logger.log(event.type + ' - ' + event.message + " code: " + event.code + " url: " + event.url);
			    Logger.log(event);
		    }
			
			if(WL.Client.getEnvironment() == WL.Environment.ANDROID || WL.Client.getEnvironment()==WL.Environment.PREVIEW){
					var previewWindow = window.open(fullPath,"_system", "location=no");
					previewWindow.addEventListener('loaderror', iabLoadError);
					function previewClose(){
						previewWindow.close();
					}
					previewWindow.addEventListener('exit', previewClose);
			} else if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
			                if (fullPath.indexOf("http://") >= 0 || fullPath.indexOf("https://") >= 0) {
			                	
			                	if(decodeURI(fullPath) != fullPath){
			                		fullPath = decodeURI(fullPath);
			                	}
			                	
			                    var previewWindow = window.open(encodeURI(fullPath), "_system", "location=no,enableViewportScale=yes");
			                    previewWindow.addEventListener('loaderror', iabLoadError);
			                    function previewClose() {
			                        previewWindow.close();
			                    }
			                    previewWindow.addEventListener('exit', previewClose);
			                } else {
			                	fullPath = fullPath.replace("ms-appdata:///local/", Windows.Storage.ApplicationData.current.localFolder.path + "\\");
			                    fullPath = fullPath.replace(/\//g, '\\');

			                    Windows.Storage.StorageFile.getFileFromPathAsync(fullPath)
                                .then(function (sampleFile) {
                                    Windows.System.Launcher.launchFileAsync(sampleFile).done(
                                             function (success) {
                                                 if (success) {
                                                     WinJS.log && WinJS.log("File " + file.name + " launched.", "sample", "status");
                                                 } else {
                                                     WinJS.log && WinJS.log("File launch failed.", "sample", "error");
                                                 }
                                             });
                                }).done(function (success) {
                                    WinJS.log && WinJS.log("Success launch failed.", "sample", "error");
                                }, function (error) {
                                    WinJS.log && WinJS.log("File launch failed.", "sample", "error");
                                });
			                }
                   
			            } else {
			                //the iOS env does not return the type required by cordova so if it not is par of the path we include in the begin
			                if (fullPath.indexOf("file://") < 0 && fullPath.indexOf("http://") < 0 && fullPath.indexOf("https://") < 0) {
			                    fullPath = "file://" + fullPath;
			                }
			                
			                Logger.trace("Trying to preview file: " + fullPath);
			                var previewWindow = window.open(fullPath, "_blank", "location=no,enableViewportScale=yes");
			                previewWindow.addEventListener('loaderror', iabLoadError);
			                function previewClose() {
			                    previewWindow.close();
			                }
			            previewWindow.addEventListener('exit', previewClose);
			        }
			
		},
		_isPreviewSupport:  function(path){
			return popUpExtensions.indexOf(AttachmentService.extensionOf(path)) > -1;
		},
		
		renderCategory : function(eventContext){
			eventContext.setDisplay(false);	
			if(_attachmentLookup){
				eventContext.set('lookup', _attachmentLookup);
				eventContext.set('lookupAttribute', _attachmentLookupAttribute);
				eventContext.setDisplay(true);
			}; 
		},
		
		setAttachCategoryLookUp : function(lookup, lookupAttribute){
			_attachmentLookup = lookup;
			_attachmentLookupAttribute = lookupAttribute;
		},
		
		_attachmentDefaultFolder: null,
		
		setAttachmentDefaultFolder: function(folderName) {
			_attachmentDefaultFolder = folderName;
		},
		
		init: function(eventContext) {
			eventContext.getCurrentRecord().set('category', _attachmentDefaultFolder);
			eventContext.getCurrentRecord().setNullValue('description');
			eventContext.getCurrentRecord().set('name', this.attachmentDefaultName);
		}
	});
});
