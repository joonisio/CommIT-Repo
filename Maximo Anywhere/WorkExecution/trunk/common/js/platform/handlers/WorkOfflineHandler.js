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

define("platform/handlers/WorkOfflineHandler", [ 
        "dojo/_base/declare",
		"platform/handlers/_ApplicationHandlerBase",
		"platform/model/WorklistDataManager",
		"platform/model/WorklistDataUIManager",
		"dojo/_base/array",
		"dojo/_base/lang",
		"platform/model/ModelService",
		"platform/translation/MessageService",
		"platform/store/PersistenceManager",
		"platform/model/PushingCoordinatorService",
        "platform/util/PlatformConstants",
        "platform/ui/util/WorkOfflineMapManager",
        "platform/comm/CommunicationManager",
        "platform/store/_ResourceMetadataContext",
		 "dojo/Deferred",
		"dojo/promise/all",
		"platform/store/SystemProperties",
		"dojo/topic",
		"platform/warning/PlatformRuntimeWarning",
		"platform/logging/Logger",
		"platform/ui/ScreenLockManager"], 
function(declare, ApplicationHandlerBase, WorklistDataManager, WorklistDataUIManager, arrayUtil, lang, ModelService, MessageService, PersistenceManager, PushingCoordinatorService, PlatformConstants, WorkOfflineMapManager, CommunicationManager, ResourceMetaData, Deferred, all, SystemProperties, topic, PlatformRuntimeWarning, Logger, ScreenLockManager) {
	return declare(ApplicationHandlerBase, {

		name : 'WorkOfflineHandler',
		progressResource: null,
		worklistResource: null,
		cancelTriggered: false,
		workOrdersLabel: null,
		showCancelButton: false,
		savedEventContext: null,
		connectivityAlreadyChecked: false,
		hasConnectivity: null,
		callBackStack:[],
		syncDownload:false,
		worklistProgressResource: null,
		origPageSize: null,
		progressWatches: [],
		_callOutDeferred: null,
		
/**@memberOf platform.handlers.WorkOfflineHandler */
		keepWorkListResource: function(eventContext) {
			this.worklistResource = eventContext.getResource();
		},
		
		enableDisableMenu: function(eventContext) {
			var isDownloadInProgress = (this.progressResource && this.progressResource.get('started') == true);
			var qb = this.ui.getCurrentViewControl().queryBase;
			var isSystemQueryBase = (qb  && (qb == PlatformConstants.ERRORED_QUERYBASE || 
											 qb == PlatformConstants.CHANGED_QUERYBASE || 
											 qb == PlatformConstants.CREATED_QUERYBASE ||
											 qb == PlatformConstants.SEARCH_RESULT_QUERYBASE));
			this._enableMenu(eventContext, isDownloadInProgress, isSystemQueryBase);
		},
		
		_enableMenu: function(eventContext, isDownloadInProgress, isSystemQueryBase) {
			var self = this;
			(function() {
				var thisEventContext = eventContext;
				if (self.connectivityAlreadyChecked){
					self.connectivityAlreadyChecked = false;
					thisEventContext.setDisplay(!isSystemQueryBase && self.hasConnectivity);
					thisEventContext.setEnabled(!isDownloadInProgress && !isSystemQueryBase && self.hasConnectivity);
				} else {
					CommunicationManager.checkConnectivityAvailable().
					then(function(hasConnectivity){
						self.connectivityAlreadyChecked = true;
						self.hasConnectivity = hasConnectivity;
						thisEventContext.setDisplay(!isSystemQueryBase && hasConnectivity);
						thisEventContext.setEnabled(!isDownloadInProgress && !isSystemQueryBase && hasConnectivity);
					}).
					otherwise(function(err){
						self.connectivityAlreadyChecked = false;					
					});							
				}				
			})();
		},
		
		enableDisableSyncMenu: function(eventContext) {
			var isDownloadInProgress = (this.progressResource.get('started') == true);
			var qb = this.ui.getCurrentViewControl().queryBase;
			var isSystemQueryBase = (qb  && (qb == PlatformConstants.ERRORED_QUERYBASE || 
											 qb == PlatformConstants.CHANGED_QUERYBASE || 
											 qb == PlatformConstants.SEARCH_RESULT_QUERYBASE));
			this._enableMenu(eventContext, isDownloadInProgress, isSystemQueryBase);
		},
		
		enableDisableBasedOnConnection: function(eventContext) {
				CommunicationManager.checkConnectivityAvailable().
				then(function(hasConnectivity){
					self.connectivityAlreadyChecked = true;
					self.hasConnectivity = hasConnectivity;
					eventContext.setDisplay(hasConnectivity);
					eventContext.setEnabled(hasConnectivity);				
				});		
		},
		
		showHideWidget: function(eventContext){
			var self = this;
			if (!this.workOrdersLabel){
				this.workOrdersLabel = MessageService.createStaticMessage('primaryResourcePluralLabel').getMessage();
			}
			this.progressResource = eventContext.getResource().getRecordAt(0);
			
			var show = this.progressResource.get('started');
			
			var isCancelButton = (eventContext['_controlType'] == 'Button');
			
			if (isCancelButton && !this.showCancelButton){
				show = false;
			}
			
			eventContext.setDisplay(show);
			this.progressWatches.push(this.progressResource.watch('started', function(fieldName, oldValue, newValue){
				if (oldValue != newValue){
					var show = newValue;
					if (isCancelButton && !self.showCancelButton){
						show = false;
					}
					eventContext.setDisplay(show);
				}
			}));
		},

		workoffline : function(eventContext) {
			this.cancelTriggered = false;
			if (this.progressResource.get('started') == true){
				return;
			}
			
			if (this.worklistResource){
				if(this.worklistResource.serverOnlyMode){
					eventContext.logger.log("Unable to Download Current WorkList for resource, because serveOnlyMode is enabled for the resource.", 0);
					throw new PlatformRuntimeWarning('serverOnlyModeDownload');
					return ;
				} else {
					this.showCancelButton = true;
					var resourceName = this.worklistResource.getResourceName();
					var queryBase = this.worklistResource.getQueryBase();
					var self = this;
					return PushingCoordinatorService.ensureFlushComplete().always(function(){
						return self.startDownload(resourceName, queryBase);
					});
				}				
			} else {
				eventContext.logger.log("Unable to find the worklist list resource", 0);
			}
		},
		
		startDownload: function(resourceName, queryBase) {
			var self = this;
			var shouldDisplayStayAwake = SystemProperties.getProperty('si.device.keepDisplayAlive');
			if(shouldDisplayStayAwake == true || shouldDisplayStayAwake == null)
				ScreenLockManager.keepDisplayAwake();

			var uiManager = new WorklistDataUIManager(this.ui);
			WorklistDataManager._setWorklistDataUIManager(uiManager);
			
			var listMetaData = ResourceMetaData.getResourceMetadata(resourceName);
			origPageSize = listMetaData.getPageSize();
			syncDownload = SystemProperties.getProperty('si.worklistSyncDownload');
			syncDownloadPageSize = SystemProperties.getProperty('si.worklistSyncDownload.pageSize');
			
			var progressMsg = MessageService.createResolvedMessage('downloadStarting', [this.workOrdersLabel]);
			if (syncDownload==='true')
			{
				//set page size
				if (syncDownloadPageSize.length>0){
					if(syncDownloadPageSize>origPageSize){
						syncDownloadPageSize = origPageSize;
					} else if (syncDownloadPageSize==0){
						syncDownloadPageSize = "50";
					}
				} else {
					syncDownloadPageSize = "50";
				}
				
				self.ui.show("Platform.DownloadCurrentWorklist");
				
				if (syncDownloadPageSize.length>0){
					if (parseInt(syncDownloadPageSize)>0){
						listMetaData.setPageSize(syncDownloadPageSize);
					}
				}
				
				self.worklistProgressResource = self.ui.application.getResource('PlatformProgressResource').getRecordAt(0);
				if (self.worklistProgressResource) {				
					self.worklistProgressResource.set('progressMsg', progressMsg);
				}
				
				listMetaData.started=true;
			} else {
				self.progressResource.set('progressMsg', progressMsg);
				self.progressResource.set('started', true);
			}
					
			var progressInfo = WorklistDataManager.downloadAllDataForSingleWorklistResourceAndQueryBase(resourceName, queryBase, !this._allowContinue());
			
			this.progressWatches.push(progressInfo.watch("recordsDownloaded", function(fieldName, oldValue, newValue){
				var downloaded = newValue['downloaded'];
				var total = newValue['total'];
				var percent = null;
				if (total == 0 || total < downloaded){
					self.application.log("Count was not returned from the server", 0);
					percent = '[' + MessageService.createStaticMessage('percentNotAvailable').getMessage() + ']';
				} else {
					percent = Math.round((downloaded/total) * 100);
				}
				
				var progressMsg = MessageService.createResolvedMessage('downloadProgress', [self.workOrdersLabel, percent]);
				if (syncDownload==='true'){
					
					if (self.worklistProgressResource) {				
						self.worklistProgressResource.set('progressMsg', progressMsg);
					}
				} else {
					self.progressResource.set('progressMsg', progressMsg );
				}

			}));
		
			this.progressWatches.push(progressInfo.watch("attachmentProgress", function(fieldName, oldValue, newValue){
				if (newValue.attachmentsDownloadFinished){
					return;
				}
				var recordWithAttachmentCount = newValue.recordWithAttachmentCount;
				var recordsWithAttachmentDownloaded = newValue.recordsDownloaded;
				var progressMsg = MessageService.createResolvedMessage('downloadAttachmentProgress', [self.workOrdersLabel, 
					recordsWithAttachmentDownloaded, recordWithAttachmentCount]);
				
				if (syncDownload==='true'){
					if (self.worklistProgressResource) {				
						self.worklistProgressResource.set('progressMsg', progressMsg);
					}
				} else {
					self.progressResource.set('progressMsg', progressMsg );
				}			
			}));
			
			return this._handleOverallProcessingPromise(progressInfo, resourceName, queryBase);
		},
		
		_processCallOuts: function(resourceName, queryBase, previousDeferreds){
			var deferreds = [];
			var options = {'resourceName': resourceName, 'querybase': queryBase, 'self': this};
			var self = this;
			if(previousDeferreds){
				arrayUtil.forEach(previousDeferreds, function(resolvedPromise, index){
					if(resolvedPromise.isResolved()){
						deferreds.push(resolvedPromise);
					}
					else{
						var callbackPromise = self.callBackStack[index](options);
						deferreds.push(callbackPromise);
					}
				});	
			}
			else{
				arrayUtil.forEach(this.callBackStack, function(callback){
					var callbackPromise = callback(options);
					deferreds.push(callbackPromise);
				});	
			}
			all(deferreds).then(function(){
				self._callOutDeferred.resolve();
			}).otherwise(function(error){
				if (!self.cancelTriggered){
					Logger.error(error);
					if (syncDownload==='true') {
						self.ui.hideCurrentDialog();
					}
					if (self._allowContinue() && (error == "Unable to connect to server")){
						self._showDownloadFailedDialogWithContinue('downloadFailedNoConnectivity', lang.hitch(self,self._afterCancel),
								function(){
									self._processCallOuts(resourceName, queryBase, deferreds); 
								}
						); 
					}
					else{
						self._showDownloadFailedDialog('downloadFailed');
					}
				}
			});
		},
		
		_allowContinue: function(){
			var allowContinue = true;
			var disableContinue = SystemProperties.getProperty('workList.download.disableContinue');
			//If property set in admin app property, override what's in app-features.properties
			if (disableContinue === "false" || disableContinue === 'true'){
				allowContinue = (disableContinue === 'false'); 
			}
			else{
				allowContinue = !this.application.isFeatureEnabled("workList.download.disableContinue");
			}
			return allowContinue;
		},
		
		_handleOverallProcessingPromise: function(progressInfo, resourceName, queryBase){
			var promise = WorklistDataManager._overallProcessing.promise;
			var self = this;
			promise.otherwise(function(err){
				
				if (!self.cancelTriggered){
					
					if (syncDownload==='true') {
						self.ui.hideCurrentDialog();
					}
					
					if (lang.isObject(err) && err.errorCode == "PROCEDURE_ERROR"){
						var message = null;
						if (err.invocationResult && err.invocationResult.errors && err.invocationResult.errors[0]['oslc:statusCode'] == 400){
							var queryBaseLabel = self.ui.getCurrentViewControl().getCurrentQueryBaseLabel();
							message = MessageService.createResolvedMessage('downloadFailedQueryBaseError', [queryBaseLabel]);
						}
						else{
							message = MessageService.createResolvedMessage('downloadFailed');
						}
						self.progressResource.set('started', false);
						self._clearWatches();
						self.application.showMessage(message);
					} else {
						if(self._allowContinue()){
							var message = ((err == "Unable to connect to server") ? 'downloadFailedNoConnectivity' : 'downloadFailed');
							self._showDownloadFailedDialogWithContinue(message, lang.hitch(self,self._afterCancel),
									function(){ return self.continueDownload(resourceName, queryBase); }); 
						}
						else{
							self._showDownloadFailedDialog('downloadFailed');
						}
					}
				}
				
				if (syncDownload==='true')
				{
					var listMetaData = ResourceMetaData.getResourceMetadata(resourceName);
					//reset pagesize back to original size
					listMetaData.setPageSize(origPageSize);
					listMetaData.started = false;
					progressInfo = null; 
				}
			});			
			
			var deferred = new Deferred();
			var thatResourceName = resourceName;
			
			promise.then(function(){
				self._callOutDeferred = new Deferred();
				var callOutPromise = self._callOutDeferred.promise;
				self._processCallOuts(resourceName, queryBase);
				callOutPromise.then(function(){
					if (self.cancelTriggered){
						deferred.resolve();
					}else{
						WorkOfflineMapManager.notifyMapsToLoadData(self.worklistResource, thatResourceName, self.progressResource)
						.then(function(message){
							var recordsDownloaded = progressInfo.recordsDownloaded['downloaded'];
							recordsDownloaded = (recordsDownloaded || 0);
							var attachmentDownloadSummary = (progressInfo.attachmentProgress || 0);
							if (syncDownload==='true')
							{
								var listMetaData = ResourceMetaData.getResourceMetadata(thatResourceName);
	
								//reset pagesize back to original size
								listMetaData.setPageSize(origPageSize);
								progressInfo = null; // null check  
								listMetaData.started= false;
							}
							self.progressResource.set('started', false);	
	
							self._showDownloadCompleteDialog(recordsDownloaded, message, attachmentDownloadSummary);
							deferred.resolve();
						}).otherwise(function(err){
							deferred.reject();
						});
					}
				});
			});
			
			promise.always(function(){
				var shouldDisplayStayAwake = SystemProperties.getProperty('si.device.keepDisplayAlive');
				if(shouldDisplayStayAwake == true || shouldDisplayStayAwake == null)
					ScreenLockManager.releaseDisplay();
			});	
			
			return deferred.promise;
			
		},
		
		showCancelDownloadConfirmation: function(eventContext){
			if (this.cancelTriggered){
				return;
			}
			this.application.ui.show('Platform.CancelDownload');
		},

		continueDownload : function(resourceName, queryBase) {
			var progressInfo = WorklistDataManager.continueDownloadRemaringDataForSingleWorklistResourceAndQueryBase(resourceName, queryBase);
			return this._handleOverallProcessingPromise(progressInfo, resourceName, queryBase);
		},
		
		_clearWatches: function(){
			arrayUtil.forEach(this.progressWatches, function(watch){
				watch.remove();
			});
			this.progressWatches = [];
		},

		_afterCancel: function(){
			this._clearWatches();
			this.progressResource.set('started', false);
			if (this._callOutDeferred){
				this.cancelTriggered = true;
				this._callOutDeferred.resolve();
				this._callOutDeferred = null;
			}
		},
		
		_showDownloadCompleteDialog: function(recordsDownloaded, additionalMessage, attachmentSummary){
			
			if (syncDownload==='true') {
				var self = this;
				self.ui.hideCurrentDialog();			
			}					

			var downloadComplete = MessageService.createStaticMessage('downloadCompleted').getMessage();
			var workOrdersLabel = MessageService.createStaticMessage('primaryResourcePluralLabel').getMessage();
			var recordsDownloadedMsg = MessageService.createResolvedMessage('downloadedRecords', [recordsDownloaded, workOrdersLabel]);
			var attachmentMessage = '';
			if (attachmentSummary){
				var totalAttachments = attachmentSummary.totalAttachments;
				var attachmentsDownloadedMsg = MessageService.createResolvedMessage('downloadedAttachments', [totalAttachments, totalAttachments + attachmentSummary.skippedAttachments]);
				attachmentMessage = '<br/><br/>' + attachmentsDownloadedMsg;

			}
			var message = downloadComplete + attachmentMessage + '<br/><br/>' + recordsDownloadedMsg;
			if(additionalMessage) {
				message += '<br/><br/>' + additionalMessage;
			}
			this._clearWatches();
			var self = this;
			this.application.showMessage(message, function() {
				var viewControl = self.application.ui.getCurrentViewControl();
				if (viewControl.lists && viewControl.lists[0] && viewControl.lists[0].refreshButton){
					var resource = viewControl.lists[0].getResource();
					if (resource){
						var resourceName = resource.getResourceName();
						var queryBase = resource.getQueryBase();
						ModelService.allCached(resourceName, queryBase).
						then(function(dataSet) {
							dataSet.resourceID = resourceName;
							self.application.addResource(dataSet);
							viewControl.setMyResourceObject(dataSet);
							dataSet.setCurrentIndex(0);
							viewControl.lists[0].refresh();
						});
					}
				}
			});
			
		},

		_showDownloadFailedDialog: function(msgKey){
			this._clearWatches();
			this.progressResource.set('started', false);
			var downloadFailed = MessageService.createStaticMessage(msgKey).getMessage();
			var message = downloadFailed;
			this.application.showMessage(message);
		},
		
		_showDownloadFailedDialogWithContinue: function(msgKey, okCallback, continueCallback){
			var downloadFailed = MessageService.createStaticMessage(msgKey).getMessage();
			var message = downloadFailed;
			this.application.showMessageWithContinue(message, okCallback, continueCallback);
		},		 
		
		cancelDownload: function(eventContext) {
			this.cancelTriggered = true;
			var downloadCancelMsg = MessageService.createResolvedMessage('cancelingDownload', [this.workOrdersLabel]);
			if (syncDownload==='true'){
				if (this.worklistProgressResource) {				
					this.worklistProgressResource.set('progressMsg', downloadCancelMsg );				
					
					var self = this;
				    var afterWorkofflineCancel = topic.subscribe('afterWorkofflineCancel', function(cancel){				    	
				    	var viewControl = self.application.ui.getCurrentViewControl();
						var resource = viewControl.lists[0].getResource();
						if (resource){
							var resourceName = resource.getResourceName();
							var queryBase = resource.getQueryBase();
							
							ModelService.allCached(resourceName, queryBase).
							then(function(dataSet) {
								dataSet.resourceID = resourceName;
								self.application.addResource(dataSet);
								dataSet.setCurrentIndex(0);
								viewControl.lists[0].refresh();
								self.application.ui.hideCurrentDialog();
							});
						}
						
				    	afterWorkofflineCancel.remove();
					});
				}
			} else {
				this.application.ui.hideCurrentDialog();
				this.progressResource.set('progressMsg', downloadCancelMsg );
				var self = this;
				var afterWorkofflineCancel = topic.subscribe('afterWorkofflineCancel', function(cancel){				    	
					self.progressResource.set('started', false);
					self = null;
			    	afterWorkofflineCancel.remove();
				});
			}
			
			this._clearWatches();
			WorklistDataManager.cancelLastWorklistDataDownloadRequest();
		},
		
		sync: function(eventContext){
			if (this.progressResource.get('started') == true){
				return;
			}
			
			var self = this;
			self.showCancelButton = false;
			var uploadingMsg = MessageService.createStaticMessage('uploadingChanges').getMessage();
			this.progressResource.set('progressMsg', uploadingMsg );
			this.progressResource.set('started', true);
						
			var uploadPromise = PushingCoordinatorService.flush();
			
			uploadPromise.otherwise(function(err){
				if (err == "no connectivity"){
					//although it's a push, the download error message is generic enough to fit for upload as well 
					self._showDownloadFailedDialog('downloadFailedNoConnectivity');
					
				} else {
					self._showDownloadFailedDialog('uploadFailed');
				}
				// 101512
				self.progressResource.set('started', false);
			});
			
			uploadPromise.then(function(){
				self.showCancelButton = true;
				self.progressResource.set('started', false);
//				self.refreshWorkList(eventContext);
				self.resetWorkList(eventContext);
			});
		},
		
		refreshWorkList: function(eventContext){
			if (this.worklistResource){
				var resourceName = this.worklistResource.getResourceName();
				var queryBase = this.worklistResource.getQueryBase();
				//this.application.setResourceQueryBase(null, resourceName, queryBase);
				eventContext.ui.getCurrentViewControl().refresh();
			} else {
				eventContext.logger.log("Unable to find the worklist list resource", 0);
			}
		},
		
		confirmClearChanges: function(eventContext) {
			this.savedEventContext = eventContext;
			this.application.ui.show('Platform.ConfirmClearChanges');
		},
		
		doClearChanges: function(eventContext) {
			this.application.ui.hideCurrentDialog();
			if (this.savedEventContext._controlType == 'Link') {
				//If I'm on a details panel when I click "Undo"
				this.discardMyChanges(this.savedEventContext).
				then(function(){
					try{
						//Hide the detail panel
						eventContext.ui.hideCurrentView();
						//Refresh the list count so that the error count is correct
						if (eventContext.ui.getCurrentViewControl()) {
							eventContext.ui.getCurrentViewControl().refreshLists();
						}
					} catch (e){
						Logger.error(e);
					}					
				});				
			} else {
				//I'm on the long tap when I click Undo
				this.discardRecordChanges(this.savedEventContext).
				then(function(){
					try{
						eventContext.ui.getCurrentViewControl().refreshLists();
					} catch (e){
						Logger.error(e);
					}
				});
			}

			this.savedEventContext = null;
		},
		
		cancelClearChanges: function(eventContext) {
			this.savedEventContext = null;
			this.application.ui.hideCurrentDialog();
		},
		
		addOffLineCallBackHandler : function (callback) {
			this.callBackStack.push(callback);
		},
		
		reloadConfirmed: function(eventContext){
			this.application.ui.hideCurrentDialog();
			var viewControl = this.application.ui.getCurrentViewControl();
			if (viewControl.lists && viewControl.lists[0]){
				viewControl.lists[0].reload();
			}
		},
		
		cancelReload: function(eventContext){
			var viewControl = this.application.ui.getCurrentViewControl();
			if (viewControl.lists && viewControl.lists[0]){
				var listResource = viewControl.lists[0].getResource();
				listResource.getMetadata().cancelActiveRefresh();
				this.application.ui.hideCurrentDialog();
				this.application.ui.getCurrentViewControl().refresh(true);
			}
		},
		
		resetWorkList: function(eventContext){
			var viewControl = this.application.ui.getCurrentViewControl();
			if (viewControl.lists && viewControl.lists[0]){
				this.application.showBusy();
				var self = this;
				CommunicationManager.checkConnectivityAvailable().
				then(function(hasConnectivity){
					if (hasConnectivity){
						var listResource = viewControl.lists[0].getResource();
						listResource.getMetadata().cancelActiveRefresh();
						ModelService.all(listResource.getResourceName(), listResource.getQueryBase(), null, true).then(function(resultSet){
							resultSet.resourceID = resultSet.getResourceName();
							self.application.addResource(resultSet);
							viewControl.lists[0].refresh();
							self.application.hideBusy();
						});
					}
					else{
						var message = MessageService.createStaticMessage('resetFailedNoConnectivity').getMessage();
						self.application.hideBusy();
						self.application.showMessage(message);
					}
				});		
			}
		},

		enableResetWorkList: function(eventContext){
			var  enable = false;
			var viewControl = this.application.ui.getCurrentViewControl();
			if (viewControl.lists && viewControl.lists[0] && viewControl.lists[0].reloadButton){
				var listResource = viewControl.lists[0].getResource();
				enable = listResource.getMetadata().dataPastFetchLimit(listResource.getQueryBase());
				if (enable){
					if (this.connectivityAlreadyChecked){
						enable = this.hasConnectivity;
					}
					else{
						CommunicationManager.checkConnectivityAvailable().
						then(function(hasConnectivity){
							self.connectivityAlreadyChecked = true;
							self.hasConnectivity = hasConnectivity;
							eventContext.setDisplay(hasConnectivity);
							eventContext.setEnabled(hasConnectivity);				
						});
						return;
					}
				}
			}
			eventContext.setDisplay(enable);
			eventContext.setEnabled(enable);				
		},
		
		enableNotification : function(eventContext){
			var isWindows = WL.Client.getEnvironment() == WL.Environment.WINDOWS8 || WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8;
			
			if(isWindows){
				eventContext.setDisplay(false);
			}
			else{
				eventContext.setDisplay(true);
			}
		},

	});
});
