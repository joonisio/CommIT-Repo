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

define("platform/signature/handler/SignatureHandler", 
[ "dojo/_base/declare",
  "platform/handlers/_ApplicationHandlerBase",
  "platform/attachment/AttachmentService",
  "platform/auth/UserAuthenticationManager",
  "platform/store/SystemProperties",
  "platform/attachment/FileService",
  "platform/model/ModelService",
  "platform/translation/MessageService"
  ],
function(declare, ApplicationHandlerBase,AttachmentService, UserAuthenticationManager, SystemProperties, FileService, ModelService, MessageService) {
	require(["platform/signature/jSignature.min"]);
	var callbackContext = null;
    var callbackFunction = null;
    var callbackParameters = null;
    var _recordOwner = null;
    var _custonDescription = null;
	
	return declare(ApplicationHandlerBase, {
		
		name: 'SignatureHandler',
		id: 'signature',
		_isDialog: false,
		
/**@memberOf platform.signature.handler.SignatureHandler */
		initSignature: function(eventContext, id){
			if(id){
				this.id = id;
			}
			
			
			var viewToAdd = dojo.query("[id="+ eventContext.id + "]")[0];
			
			var previousInputDiv;
			if (document.getElementById('personNameOutDiv'))
			{
			    //replace later
			    previousInputDiv = document.getElementById("personNameOutDiv");
			}
           
			
			//person name warpper
			var personNameOutDiv = document.createElement('div');
			
			personNameOutDiv.id = "personNameOutDiv";
			personNameOutDiv.setAttribute("class", "dijitContentPane WL_ leafControl");
			personNameOutDiv.widgetid = "personNameOutDiv";
			personNameOutDiv.style = "";
			
			//div for person name
			var personNameLabelDiv = document.createElement('div');
			
			personNameLabelDiv.id = "personNameLabelDiv";
			personNameLabelDiv.setAttribute("class", "WL_ editableLabel");
			personNameLabelDiv.setAttribute("for", "personNameOutDiv");
			//personNameLabelDiv.value = "Perso Name:";
			
			
			//label for the person name field
			var dateSpan = document.createElement('span');
			dateSpan.setAttribute("class", 'requiredLabel');
			dateSpan.style = 'display:none';
			dateSpan.innerHTML = MessageService.createStaticMessage('signaturePersonName').getMessage();
			
			
			personNameLabelDiv.appendChild(dateSpan);
			
			personNameOutDiv.appendChild(personNameLabelDiv);
			
			//div for the input of person name
			var personNameInputDiv = document.createElement('div');
			
			personNameInputDiv.id = "personNameInputDiv";
			personNameInputDiv.setAttribute("class", "dijitContentPane textWrapper");
			personNameInputDiv.widgetid = "personNameInputDiv";
			
			//imput to provide person name
			var personName = document.createElement("INPUT");
			personName.id = 'personName';
			personName.setAttribute("type", "text");
			personName.setAttribute("class", "mblTextBox WL_ editableText editableTextNoButton");
			personName.setAttribute("tabindex", "0");
			personName.setAttribute("name", "personNameOutDiv");
			personName.setAttribute("placeholder", MessageService.createStaticMessage('Tap to enter').getMessage());
			personName.setAttribute("size", "100");
			personName.setAttribute("maxlength", "100");
			personName.setAttribute("widgetid", "personName");
			personName.setAttribute("style", "display: inline;");
			
			
			personNameInputDiv.appendChild(personName);
			
			personNameOutDiv.appendChild(personNameInputDiv);
			
			if (!previousInputDiv) {
			    viewToAdd.appendChild(personNameOutDiv);
			} else {
			    viewToAdd.replaceChild(personNameOutDiv, previousInputDiv);
			}

		    //add the signature canvas to the UI
            if (document.getElementById(this.id)) {
		        //Need to reset the signature div
                var jSig = $("#" + this.id).jSignature("reset");                   
                jSig.css('width', '100%');
		    } else {
                var signatureDiv = document.createElement('div');
                signatureDiv.id = this.id;
                viewToAdd.appendChild(signatureDiv);
                signatureDiv.style.backgroundColor = "#FFF8DC";
                signatureDiv.style.width = "100%";

                if (this._isDialog) {
                    viewToAdd.style.color = "#000000";
                    $(signatureDiv).jSignature({height: "100px", color: "#000000", width: "273px"
                    });
			    } else {
				    $(signatureDiv).jSignature();
			    }
		    }			
		},
		
		getSignature: function(format){
			if(!format){
				format = "image";
			}
			
			// get the canvas and set a background color to avoid the opacity issue at android
			var canvas = document.getElementById(this.id);
			var canvas2 = canvas.children[1];
			var w = canvas2.width;
			var h = canvas2.height;
			var backgroundColor  = "#FFF8DC";
			var context=canvas2.getContext("2d");
			var compositeOperation = context.globalCompositeOperation;
			context.globalCompositeOperation = "destination-over";
			context.shadowColor = backgroundColor;
			context.fillRect(0,0,w,h);
			context.globalCompositeOperation = compositeOperation;
			
			
			var imagebase64 = $(document.getElementById(this.id)).jSignature("getData", format);
			imagebase64 = "data:" + imagebase64[0]+ "," + imagebase64[1];
			
			return imagebase64;
			 
		},
		
		saveSignature: function(eventContext){
			this.application.showBusy();
			var transfer = new FileTransfer();
			var self = this;
			
			var imagebase64 = self.getSignature("image");
			var started = false;
			
			var sigPerson = document.getElementById("personName").value;
			
			if(_custonDescription){
				if(sigPerson){
					sigPerson = sigPerson + ", " + _custonDescription;
				} else {
					sigPerson = _custonDescription;
				}
				
				_custonDescription = '';
			}
			
			transfer.onprogress = function(progressEvent) {
				started = true;
			    if (progressEvent.lengthComputable) {			    	
			    	// total is half of the actual value
			    	//deferred.progress((progressEvent.loaded / (progressEvent.total * 2)) * 100);
			    } else {
			    	//deferred.progress(currentProgress += 2);
			    }
			};
			
			//function called after the download of base 64 file finish
			var onSuccess = function(fileEntry) {
				
				var fullPath;
				
				if(fileEntry.toURL()){
					//deferred.resolve({fullPath: fileEntry.toURL()});
					fullPath = fileEntry.toURL();
				}else {
					//deferred.resolve({fullPath: fileEntry.fullPath});
					fullPath = fileEntry.fullPath;
				}
				
				//build the attach info with signature image file
				FileService.infoAsPromise(fullPath).then(function(mediaInfo){
					var limit = SystemProperties.getProperty('si.attach.filenamelimit');
					var fileName = FileService.parseFileName(mediaInfo.name, false, limit);
					var attachmentOwner = self._getRecordOwner();
					var currentUser = UserAuthenticationManager._getCurrentUser();
						
					var attachmentInfo = self.application.getResource("PlatformAttachmentInfoResource").getCurrentRecord(); 
						attachmentInfo.set("localPath", mediaInfo.fullPath);	
						attachmentInfo.set("name", fileName);	
						attachmentInfo.set("fileSize", parseInt(mediaInfo.size / 1024));
						if (WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD){
							attachmentInfo.set("fileType", AttachmentService.extensionOf(mediaInfo.fullPath));
						}else{
							attachmentInfo.set("fileType", mediaInfo.type);
						}
						attachmentInfo.setDateValue("createDate", mediaInfo.createDate);
						attachmentInfo.set("description", MessageService.createStaticMessage('signatureDescription').getMessage() + sigPerson );
						attachmentInfo.setNullValue("category");
						
						//call attachment service to attach the signature to the owner record
						AttachmentService.attachToRecordWithPromise(currentUser, attachmentInfo, attachmentOwner).then(function(){
							if(!attachmentOwner.isNew()){
								ModelService.save(attachmentOwner.getOwner()).then(function(){
									FileService.removeWithPromise(fullPath).then(function(mediaInfo){
										if(self._isDialog){
											self.ui.hideCurrentDialog();
										}else{
											self.ui.hideCurrentView();
											
										}
										if (typeof callbackFunction === "function"){
											callbackFunction.apply(callbackContext, callbackParameters);
											
										}
										self._setRecordOwner(null);
									}).otherwise(function(error){
										self.ui.showMessage(error);
									});
								}).otherwise(function(error){
									self.ui.showMessage(error);
								});
							} else {
								if(self._isDialog){
									self.ui.hideCurrentDialog();
								}else{
									self.ui.hideCurrentView();
								}
							}
						}).otherwise(function(error){
							self.ui.showMessage(error.message);
						});
					
				}).otherwise(function(error){
					self.ui.showMessage(error);
				});	
												
			}; 
			
			//Function called if download of base 64 image fail
			var onError = function(error) {
				if(error.code == FileTransferError.ABORT_ERR){
					var exception = '';//new PlatformRuntimeException("attachmentCouldNotConnect", [serverAddress]);
					
				}
				else{
					var exception = '';//new PlatformRuntimeException("attachmentDownloadError", [error.http_status]);
					
				}
			};
			
			//call file service to download base 64 image as a file entry
			FileService.baseDirectoryForWithPromise('Platform', 'Signature', 'temp').then(function(targetInfo){
				var stringTime = Date.now().toString();
				var sigName = "sig_" + stringTime.substring(4,stringTime.length) + ".jpg";
				var signFullPath = targetInfo.fullPath + "//"+ sigName;
				if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
					self._base64ToJpg(imagebase64, sigName, onSuccess, onError);
				} else {
					transfer.download(encodeURI(imagebase64), signFullPath, onSuccess, onError, true);
				}
				
			}).otherwise(function(error){
				if (!error.message) {
					self.ui.showMessage(MessageService.createStaticMessage('errorCapturingSignature').getMessage());
				} else {
					self.ui.showMessage(MessageService.createResolvedMessage('nestedErrorCapturingSignature', [error.message]));
				}
			});
				
			//abort the request if not start 
			setTimeout(function(){				
				if(!started){
					transfer.abort();
				}
			}, SystemProperties.getConnectivityTimeoutInterval());
		},
		
		cancelSignature: function(eventContext){
			_custonDescription = '';
			this._setRecordOwner(null);
			eventContext.ui.hideCurrentView();
		},
		
		cancelSignatureDialog: function(eventContext){
			_custonDescription = '';
			eventContext.ui.hideCurrentDialog();
		},
		
		_setRecordOwner: function(record){
			_recordOwner = record;
		},
		
		_getRecordOwner: function(){
			return _recordOwner;
		},
		
		_setBusinessContext: function(custonDescription){
			if(_custonDescription){
				_custonDescription = _custonDescription + " " +custonDescription;
			}else{
				_custonDescription = custonDescription;
			}
			
		},
		
		_clearBusinessContext: function(){
			
			_custonDescription = '';
			
		},
		
		_getBusinessContext: function(){
			return _custonDescription;
		},
		
		launchSignatureView: function(eventContext, callback, callbackParam){
			this._isDialog = false;
			this._setRecordOwner(eventContext.getCurrentRecord());
			callbackContext = eventContext;
			callbackFunction = callback;
			callbackParameters = callbackParam;
			
			eventContext.ui.show("Platform.Signature");
		},
		
		launchSignatureDialog: function(eventContext, callback, callbackParam){
			
			this._isDialog = true;
			callbackContext = eventContext;
			callbackFunction = callback;
			callbackParameters = callbackParam;
			this._setRecordOwner(eventContext.getCurrentRecord());
			
			//since dialog does not support required resources we need to load the attach resource for the application if not yet loaded
			if(!this.application.getResource('PlatformAttachmentInfoResource')){
				this.application.createResource(null, null, 'PlatformAttachmentInfoResource', null, null)
				.then(function(){
					eventContext.ui.show("Platform.SignatureDialog");
				})
				.otherwise(function(error){
					console.log("could not load PlatformAttachmentInfoResource");
					console.log(JSON.stringify(error));
				});
			}else{
				eventContext.ui.show("Platform.SignatureDialog");
			}
			
		},
		
		clearSignature: function(eventContext){
			$(document.getElementById(this.id)).jSignature("clear");
		},
		
		_base64ToJpg: function(b64Data, fileName, succesImageCallback, errorImageCallback){
			 
			 b64Data = b64Data.split('data:image/png;base64,').pop()
			 var contentType = "image/png";
             var sliceSize = 512;
             contentType = contentType || '';
             sliceSize = sliceSize || 512;

             var byteCharacters = window.atob(b64Data);
             var byteArrays = [];

             for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                 var slice = byteCharacters.slice(offset, offset + sliceSize);

                 var byteNumbers = new Array(slice.length);
                 for (var i = 0; i < slice.length; i++) {
                     byteNumbers[i] = slice.charCodeAt(i);
                 }

                 var byteArray = new Uint8Array(byteNumbers);

                 byteArrays.push(byteArray);
             }

             var blob = new Blob(byteArrays, { type: contentType });
             //blob;
             window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
             function gotFS(fileSystem) {
                 fileSystem.root.getFile(fileName, { create: true, exclusive: false }, gotFileEntry, fail);
             }

             function gotFileEntry(fileEntry) {
                 fileEntry.createWriter(gotFileWriter, fail);
             }

             function gotFileWriter(writer) {
                 console.log("open and write");
                 writer.seek(0);
                 writer.write(blob);
                 console.log("close and save");

                 var fileEntry = {};
                 fileEntry.fullPath = writer.localURL;
                 fileEntry.toURL = function () { return writer.localURL; };
                 
                 succesImageCallback.apply(this,[fileEntry]);
             }

             function fail(error) {
                 errorImageCallback.apply(this,[error]);
             }
		},
		
	});
});
