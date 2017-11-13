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

define("platform/handlers/_ApplicationHandlerBase", 
		[ "dojo/_base/declare",
		  "dojo/_base/array",
		  "dojo/Deferred",
		  "platform/model/ModelService",
		  "platform/util/PlatformConstants",
		  "platform/logging/Logger",
		  "platform/model/PushingCoordinatorService",
		  "platform/comm/_ConnectivityChecker",
		  "platform/translation/MessageService",
		  "platform/exception/PlatformRuntimeException" ],	     
		  function(declare, array, Deferred, ModelService, PlatformConstants, Logger, PushingCoordinatorService, ConnectivityChecker, MessageService, PlatformRuntimeException) {
	return declare(null, {

/**@memberOf platform.handlers._ApplicationHandlerBase */
		nextRecord: function(eventContext){
			if(!eventContext){
				return;
			}
			var resourceObject =  eventContext.getResource();
			if(!resourceObject){
				return;
			}
			resourceObject.next();
		},

		previousRecord: function(eventContext){
			if(!eventContext){
				return;
			}
			var resourceObject =  eventContext.getResource();
			if(!resourceObject){
				return;
			}
			resourceObject.previous();
		},

		hideOnFirstRecord: function(eventContext) {
			var resource = eventContext.getResource();
			if(!resource){
				return;
			}
			eventContext.setDisplay(resource.hasPrevious());
		},

		hideOnLastRecord: function(eventContext) {
			var resource = eventContext.getResource();
			if(!resource){
				return;
			}
			eventContext.setDisplay(resource.hasNext());
		},

		disableOnFirstRecord: function(eventContext) {
			var resource = eventContext.getResource();
			if(!resource){
				return;
			}
			eventContext.setEnabled(resource.hasPrevious());
		},

		disableOnLastRecord: function(eventContext) {
			var resource = eventContext.getResource();
			if(!resource){
				return;
			}
			eventContext.setEnabled(resource.hasNext());
		},

		closeLookup: function(){
			this.ui.hideCurrentDialog();
		},

		resolveSortLabel: function(eventContext){
			return [eventContext.getCurrentSortLabel()];	
		},

		changeSort: function(eventContext){   		
			this.application.showBusy();  
			if ( eventContext.listControl.getResource().count() == 0 ) {
				// Give the showing feel
				setTimeout( function() {
					eventContext.application.hideBusy();
				}, 39);
			}
			else {
				setTimeout( function() {  		    	
					eventContext.listControl.changeSort( eventContext.index );				
				}, 30);
			}
		},

		changeQueryBase: function(eventContext){
			eventContext.viewControl.changeQueryBase(eventContext.index);
		},

		discardRecordChanges: function(eventContext){
			return this.discardChanges(eventContext, eventContext.getResource().parentRecord);
		},

		discardMyChanges: function(eventContext){
			return this.discardChanges(eventContext, eventContext.getResource().getCurrentRecord());
		},

		discardChanges: function(eventContext, record){
			try{
				var self = this;
				this._unloadCachedRelatedResources(eventContext, record);
				var checkServerUndo = eventContext.application.isFeatureEnabled("custom.undo.process.enabled");
				var metaData = record.getMetadata();
				var undoField = metaData.getField('anywhereundo');
				//only will check server if enabled at app future and the resource does have the field
				if(checkServerUndo && undoField && record.wasCommittedToServer()){
					var deferred = new Deferred();
					ConnectivityChecker.checkConnectivityAvailable().
					then(function(isConnected){
						if (isConnected){
							ModelService.byRef(metaData.name, record.get('remoteid'), true).then(function(modelDataSet){
								var recordServer = modelDataSet.getCurrentRecord();
								
								//call maximo and retrieve the value set by admin
								if(recordServer.get(undoField.name)){
									var fetchedChildren = Object.keys(record[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE]);
									var undoDeferred = self._undoChanges(eventContext, record);
									undoDeferred.then(function(){
										ModelService.byRef(metaData.name, record.get('remoteid')).then(function(modelDataSetUp){
											var recordServerUp = modelDataSetUp.getCurrentRecord();
											ModelService.multipleChildrenOf(recordServerUp, fetchedChildren).then(function(){
												recordServerUp.set(undoField.name,false);
												ModelService.save(modelDataSetUp).then(function(){
													record.getOwner()._cleanupRecord(record);
													deferred.resolve(true);
												});
											});
										});
									});
								}else{
									eventContext.ui.showMessage(MessageService.createStaticMessage('undoNotAuthorized').getMessage());
									deferred.resolve(false);
								}
							});
						}else{
							eventContext.ui.showMessage(MessageService.createStaticMessage('offilineActionNotAuthorized').getMessage());
							deferred.resolve(false);
						}
					});
					
					
					return deferred.promise;
					
				}else{
					return this._undoChanges(eventContext, record);
				}
				
			}catch(error){
				var message = null;
				if(error instanceof PlatformRuntimeException){
					message = error.getMessage();
				}
				else{
					message = error;
					Logger.error("Error discarding changes: " + error);
				}
				eventContext.ui.showMessage(message);
				return new Deferred().reject(message);
			}							
		},

		_undoChanges:function(eventContext, record){
			return record.undoChangesWithPromise().otherwise(function(error){
				var message = null;
				if(error instanceof PlatformRuntimeException){
					message = error.getMessage();
				}
				else{
					message = error;
					Logger.error("Error discarding changes: " + error);
				}
				eventContext.ui.showMessage(message);
			});
		},
		_unloadCachedRelatedResources: function(context, record) {
			var parentResourceName = record.getMetadata().getResourceName();
			var resourceNames = Object.keys(context.application.resources || {});
			array.forEach(resourceNames, function(resourceName) {
				var startsWithParentResourceName =(resourceName.indexOf(parentResourceName + '.') === 0); 
				if (startsWithParentResourceName){					
					var resource = context.application.resources[resourceName];
					if (resource){
						//This will force resource.isDirty() false and
						//will make ui to reload the related resource.
						//Check View.createMyResource() condition that calls
						//resource.isDirty()
						resource._resetStateCollections();
					}
				}
			});
		},

		retryMyChanges : function(eventContext){
			this.retryChanges(eventContext, eventContext.getResource().getCurrentRecord());
		},

		retryRecordChanges : function(eventContext){
			this.retryChanges(eventContext, eventContext.getResource().parentRecord);
		},

		retryChanges: function(eventContext, retryRecord){			
			this.application.showBusy();
			var self = this;
			var promise = null;
			retryRecord._clearErrors();
			retryRecord.markAsModified();
			promise = ModelService.save(retryRecord.getOwner());

			promise.then(function(){				
				if(eventContext._controlType == 'Link'){
					//if we're in details page, move back to worklist
					//Intentionally not hideBusy() as back()
					//will do it once the view completes transitioning back
					eventContext.ui.back();
				} else { //Long press menu option
					self.application.hideBusy();						
				}					
			}).otherwise(function(error){
				self.application.hideBusy();
				var message = null;
				if(error instanceof PlatformRuntimeException){
					message = error.getMessage();
				}
				else{
					message = error;
					Logger.error("Error retrying changes: " + error);
				}
				eventContext.ui.showMessage(message);
			});				
		},

		hideShowErrorMenu : function(eventContext){
			var view = eventContext.viewControl;
			// if the query error marker is set, we know we have to show the error menu
			if (view.queryErrorMarkerSet == true) {
				eventContext.setDisplay(true);
				return;
			}
			var resourceForQuery = view.queries.resource ? view.queries.resource : view.resource;
			ModelService.all(resourceForQuery, PlatformConstants.ERRORED_QUERYBASE).then( function(dataSet){
				eventContext.setDisplay(dataSet.count()>0);
			}).otherwise(function(dataSet){
				eventContext.setDisplay(false);
			});
		},

		showFooter : function(eventContext){
			var view = eventContext.viewControl;
			if(view.isOverrideEditMode()){
				eventContext.setFooterDisplay(false);
				return;
			}
			eventContext.setFooterDisplay(true);
		},

		_valueForExactMatch: function(value) {
			return '@--' + value + '--@';
		}
	});
});
