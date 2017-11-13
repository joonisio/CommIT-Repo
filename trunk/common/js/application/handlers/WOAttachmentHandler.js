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

define("application/handlers/WOAttachmentHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "platform/model/ModelService",
	     "platform/handlers/AttachmentHandler",
	     "platform/util/PlatformConstants",
	     "dojo/dom-style",
	     "dojo/dom-class",
	     "platform/translation/MessageService",
	     "platform/attachment/AttachmentService",
	     "application/business/AttachmentsObject",
	     "platform/format/FormatterService",
	     "platform/auth/UserManager",
	     "platform/comm/_ConnectivityChecker"],
function(declare, lang, ModelService, AttachmentHandler, PlatformConstants, domStyle, domClass, MessageService, AttachmentService, AttachmentsObject, FormatterService, UserManager, ConnectivityChecker) {
	
	var ATTACH_LOCATION_ATTR = PlatformConstants.ATTACH_LOCATION_ATTR;
	var canceled=false;
		
	return declare( [AttachmentHandler], {
		
		inProgressDownloads: null,
		downloadPromise: null,
		
		
		constructor: function(attribute){
			this.inProgressDownloads = {};
		},

/**@memberOf application.handlers.WOAttachmentHandler */
		"handleThumbnailClick": function(eventContext) {
			var currentRecord = eventContext.getCurrentRecord();
			var hasCurrentRecord = !!currentRecord;
			var downloadCompleted = (hasCurrentRecord && !!currentRecord.get(ATTACH_LOCATION_ATTR));
			var downloadInProgress = (hasCurrentRecord && currentRecord.getRemoteId() in this.inProgressDownloads);

			if (!hasCurrentRecord || downloadInProgress){
				//TODO Check if ATTACH_DOWNLOAD_STATUS == ATTACH_DOWNLOAD_STATUS_COMPLETED and show the preview
				return;
			}						
						
			if (downloadCompleted) {
				this.preview(eventContext);
			}				
			else {
			    var self = this;
			    ConnectivityChecker.checkConnectivityAvailable().
			        then(function (isConnectionAvailable) {
			        if (isConnectionAvailable) {
			            self.percentage = 0;
			            var remoteId = currentRecord.getRemoteId();
			            self.inProgressDownloads[remoteId] = eventContext;
			            self._updatePercentComplete(0);
			            self.ui.show('WorkExecution.DownloadAttachmentLocal');
			            self._updatePercentComplete(0);
			            canceled = false;
			            self.downloadPromise = self.downloadSingleAttachment(eventContext);

			            self.downloadPromise.
                        then(function success() {
                            var currentEventContext = self.inProgressDownloads[remoteId];
                            delete self.inProgressDownloads[remoteId];
                            self.ui.hideCurrentDialog();
                            self.ui.getCurrentViewControl().refresh();
                            self.preview(currentEventContext);
                        },
                        function fail(error) {
                            delete self.inProgressDownloads[remoteId];
                            self.ui.hideCurrentDialog();
                            if (!canceled) {
                            	if (error.message) {
                            		console.log("Download of attachment failed with msg=" + error.message);
                            		self.ui.showMessage(MessageService.createResolvedMessage('downloadGenericNestedError', [error.message]));
                            	} else {
                            		 self.ui.showMessage(MessageService.createStaticMessage('downloadGenericError').getMessage());
                            	}
                            }
                            canceled = false;
                        },
                        function progress(update) {
                            var percentComplete = Math.round(update);
                            console.log(percentComplete + '% downloaded');
                            self._updatePercentComplete(percentComplete);
                        });
			        }
			        else {
			            self.ui.showMessage(MessageService.createStaticMessage('downloadGenericError').getMessage());
			        }
			    });
			
			}
		},
		
		"displayLocal": function(eventContext) {
			
			domClass.remove(eventContext.baseWidget.domNode, "imageButton");
			var currentRecord = eventContext.getCurrentRecord();
			
			//initialize the attach view
			if (currentRecord && !currentRecord.get('displayFileName')){
				currentRecord.set('displayFileName',currentRecord.get('fileName')||currentRecord.get('anywhereAttachName'));
			}
			
			if (currentRecord && !currentRecord.get('displayDescription')){
				currentRecord.set('displayDescription',currentRecord.get('description') || currentRecord.get('anywhereAttachDescription'));
			}
			
			if (currentRecord && !currentRecord.get('displayCategory')){
				currentRecord.set('displayCategory',currentRecord.get('docType') || currentRecord.get('anywhereAttachCategory'));
			}
			
			if (currentRecord && !currentRecord.get('displayCreationDate')){
				currentRecord.setDateValue('displayCreationDate',currentRecord.getAsDateOrNull('creationDate') || currentRecord.getAsDateOrNull('anywhereCreationDate'));
			}
			
			if (currentRecord && !currentRecord.get('createby')){
				currentRecord.set('createby',UserManager.getCurrentUser());
			}
			
			
			var webLink = currentRecord.get('contentLocation');
			if (webLink){
				if(webLink.indexOf("http://") < 0 && webLink.indexOf("https://") < 0){
					webLink = 'http://' + webLink;
				}
				
				currentRecord.set(PlatformConstants.ATTACH_LOCATION_ATTR,webLink);
				currentRecord.set('displayFileType',MessageService.createStaticMessage('WEBLINK').getMessage());
			} else {
				var fullFileName = currentRecord.get('fullFileName');
				if(fullFileName){
					currentRecord.set('displayFileType',AttachmentsObject.extensionOf(fullFileName));
				}else {
					var fullFileName = currentRecord.get('anywhereAttachPath');
					if(fullFileName){
						currentRecord.set('displayFileType',AttachmentsObject.extensionOf(fullFileName));
					}
				}
				
				var userLocale = (WL && WL.App && WL.App.getDeviceLocale() || 'en-US');
				userLocale = userLocale.replace('_','-');
				if(currentRecord.get('fileSize')){
					currentRecord.set('displaySize',FormatterService.toDisplayableValue((currentRecord.get('fileSize')/1024), "double", userLocale) + ' ' + MessageService.createStaticMessage('measure').getMessage());
				}else {
					currentRecord.set('displaySize',FormatterService.toDisplayableValue(currentRecord.get('anywhereAttachSize'), "double", userLocale) + ' ' + MessageService.createStaticMessage('measure').getMessage());
				}
			}
			
			
			var hasCurrentRecord = !!currentRecord;
			var downloadCompleted = (hasCurrentRecord && !!currentRecord.get(ATTACH_LOCATION_ATTR));
			var textColor = null;
			if (downloadCompleted) {
				if (currentRecord.urlType == 'URL') {
					eventContext.setDisplay(false);
				} else {
					eventContext.setDisplay(true);
				}
				textColor = '#0C93C8';
			} else {
				eventContext.setDisplay(false);
				textColor = '#000';
			}
			
			for (var ii = 0; ii < eventContext.parentControl.children.length; ii++)
			{
				var child = eventContext.parentControl.children[ii];
				if (child.resourceAttribute && child.resourceAttribute == 'displayDescription') {
					domStyle.set(child.baseWidget.domNode, 'color', textColor);
					break;
				}
			}
		},
		
		cancelDownload: function(eventContext) {
			console.log('got cancel click');
			if (AttachmentService.fileTransferPromise) {
				canceled = true;
				AttachmentService.fileTransferPromise.cancel();
			}
		},
		
		_updatePercentComplete: function(percentage) {									
			var progressRecord = this.ui.application.getResource('PlatformProgressResource').getRecordAt(0);
			if (progressRecord) {				
				var msg = MessageService.createResolvedMessage('downloadProgress', ['',percentage]);
				progressRecord.set('progressMsg', msg);
			}
		},
		
		initCategory: function(eventContext) {
			var self = this;
			this.setAttachCategoryLookUp('WorkExecution.appDocTypeLookup', 'docType');
			ModelService.allCached('appDocType', 'getWODocTypes', 50)
			.always(function(appDocTypeSet) {
				 if (appDocTypeSet.getRecordAt(0)){
					 self.setAttachmentDefaultFolder(appDocTypeSet.getRecordAt(0).get('doctype'));
				 }					 
			});
		}
	});
});
