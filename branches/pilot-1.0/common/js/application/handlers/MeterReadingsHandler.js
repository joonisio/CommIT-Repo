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

define("application/handlers/MeterReadingsHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
	     "dojo/number",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/model/ModelService",
	     "application/handlers/CommonHandler",
	     "dojo/promise/all",
		 "platform/translation/MessageService",
		 "platform/logging/Logger",
		 "platform/util/PlatformConstants",
		 "dojo/Deferred",
		 "platform/exception/PlatformRuntimeException",
		 "platform/auth/UserRolesManager",
		 "platform/util/DateTimeUtil",
		 "platform/translation/SynonymDomain",
		 "dojo/date/stamp"
	     ],
function(declare, arrayUtil, numberUtil, ApplicationHandlerBase, ModelService, CommonHandler, all, MessageService, Logger, PlatformConstants, Deferred, PlatformRuntimeException, UserRolesManager, DateTimeUtil, SynonymDomain, dateISOFormatter ) {
	// store our meter type for this view, we reference it multiple times
	var meterType = null;
	var readingType = null;
	var domainId = null;
	
	return declare( [ApplicationHandlerBase], {
		
/**@memberOf application.handlers.MeterReadingsHandler */
		showView: function(eventContext) {
			var currentRecord = eventContext.getCurrentRecord();
			readingType = SynonymDomain.resolveToInternal(this.application.getResource("readingtypes"), currentRecord.get('readingtype'));
			
			// set up our meter type for this record, never changes for this meter entry
			meterType = SynonymDomain.resolveToInternal(this.application.getResource("metertypes"), currentRecord.get('metertype'));
			
			domainId = currentRecord.get('domainid');
			currentRecord.set('newreading', null);
			currentRecord.set('newreadinglookup', null);
			currentRecord.set('newreadingdate', null);
			currentRecord.set('remarks', null);
			currentRecord.set('inspector', null);
			
			if (meterType == 'CONTINUOUS') {
				currentRecord.set('isdelta', (readingType == 'DELTA'));
				currentRecord.set('dorollover', false);
			}
			
			// initialize user-editable fields as editable = false
			this._setFieldsEditable(currentRecord, false);
			
			// we do not show the footer until a newreading is set
			this.displayFooter(eventContext, false);
		},

		cancelEntry: function(eventContext) {
			Logger.trace('MeterReadingHandler - Cancel Clicked');
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},

		assetMeterPromise: function(assetnum, metername, siteid) {
			var deferred = new Deferred();
			
			var assetMetersPromise = ModelService.all('assetMeters', null, null, false);
			assetMetersPromise.then(function(assetMeterSet){
				assetMeterSet.filter("assetnum == $1 && metername == $2 && siteid == $3 && active == true", assetnum, metername, siteid);
				deferred.resolve(assetMeterSet);
			});
			
			return deferred.promise;
			//return ModelService.filtered('assetMeters', null, [{'assetnum': assetnum, 'metername': metername, 'siteid': siteid, 'active':true}], 1000, false, true);
		},
		
		locationMeterPromise: function(location, metername, siteid) {
			var deferred = new Deferred();
			
			var locationMetersPromise = ModelService.all('locationMeters', null, null, false);
			locationMetersPromise.then(function(locationMetersSet){
				locationMetersSet.filter("location == $1 && metername == $2 && siteid == $3 && active == true", location, metername, siteid);
				deferred.resolve(locationMetersSet);
			});
			
			return deferred.promise;
			//return ModelService.filtered('locationMeters', null, [{'location': location, 'metername': metername, 'siteid': siteid, 'active':true}], 1000, false, true);
		},
		
		commitEntry: function(eventContext) {	
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();

			var assetnum = eventContext.getCurrentRecord().get('assetnum');
			var myLocalMeter = eventContext.getCurrentRecord();
			var metername = myLocalMeter.get('metername');
			var siteid = wo.get('siteid');
			var self = this;
			
			this.validateNewMeterReadingEntry(eventContext);
			
			eventContext.application.showBusy();
			
			if ((!wo.assetlocmeterlist) || (wo.assetlocmeterlist.length == 0)) {
				wo.getModelDataSet('assetlocmeterlist').then(function(multiAssetLocSet){
					wo.assetlocmeterlist = multiAssetLocSet;
				});
			}			
			var woAssetMeter = wo.assetlocmeterlist.createNewRecord();

			Logger.trace('Setting Assetmeter Data');

			if (meterType == 'CONTINUOUS') {
				woAssetMeter.set('isdelta', (myLocalMeter.getPendingOrOriginalValue('isdelta') == null) ? false : myLocalMeter.getPendingOrOriginalValue('isdelta'));
				woAssetMeter.set('dorollover', (myLocalMeter.getPendingOrOriginalValue('dorollover') == null) ? false : myLocalMeter.getPendingOrOriginalValue('dorollover'));
			}
			
			woAssetMeter.set('assetnum', assetnum);
			woAssetMeter.set('metername', metername);
			woAssetMeter.set('metertype', meterType);
			woAssetMeter.set('newreading', myLocalMeter.getPendingOrOriginalValue('newreading'));
			woAssetMeter.set('newreadingdate', myLocalMeter.getPendingOrOriginalValue('newreadingdate'));
			woAssetMeter.set('inspector', myLocalMeter.getPendingOrOriginalValue('inspector'));
			woAssetMeter.set('remarks', myLocalMeter.getPendingOrOriginalValue('remarks'));

			ModelService.save(woSet).then(function() {
				var assetMeterPromise = self.assetMeterPromise(assetnum, metername, siteid);
				assetMeterPromise.then(function(assetMeterSet){
					if ((assetMeterSet.count()>0)) {	
						Logger.trace('Setting Assetmeter Data');
						var assetmeter = assetMeterSet.getRecordAt(0);
						var lastReadingVal = 0;
						
						if ((meterType == 'CONTINUOUS') && (myLocalMeter.getPendingOrOriginalValue('isdelta') == true)){
							lastReadingVal = numberUtil.parse(myLocalMeter['newreading']) + numberUtil.parse(myLocalMeter['lastreading']);
						} else {
							lastReadingVal = myLocalMeter['newreading'];
						}
						
						assetmeter.set('localLastReading', lastReadingVal);
						assetmeter.set('localLastReadingDate', myLocalMeter['newreadingdate']);
									
						ModelService.save(assetMeterSet).then(function() {
							Logger.trace('Assetmeter Data Saved...Meter Reading Created.');
							//reset filter
	                        CommonHandler._clearFilterForResource(eventContext, assetMeterSet);
	                        
	                        var woAssetLocMeterInfo = eventContext.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
	            			var handler = eventContext.application['application.handlers.MetersListHandler'];
	            			
	            			var promise = null;
	            			if (woAssetLocMeterInfo.originatingAction == "MULTIASSETLOC"){
	            				woAssetLocMeterInfo.set('originatingAction',"");
	            					            				
	            				//need to make sure wo total meters is updated as well.
	            				promise = handler.getAllAssetMeters(eventContext,woAssetLocMeterInfo);

	            				promise.then(function(total){
	            					var promise2 = handler.getMultiAssetLocationMeters(eventContext,null);
									promise2.then(function(total){
										eventContext.ui.hideCurrentView();
									});	
								});	
	            				
	            			} else if (woAssetLocMeterInfo.originatingAction == "TASK"){
	            				woAssetLocMeterInfo.set('originatingAction',"");
	            					            				
	            				//need to make sure wo total meters is updated as well.
	            				promise = handler.getAllAssetMeters(eventContext,woAssetLocMeterInfo);

	            				promise.then(function(total){
	            					var promise2 = handler.hideTaskAssetMeterButton(eventContext);
									promise2.then(function(total){
										eventContext.ui.hideCurrentView();
									});	
								});	
	            				
	            			} else {
	            				if (WL.StaticAppProps.APP_ID == "Inspection") {
	            					var inspectionhandler = eventContext.application['application.com.Inspection.handlers.InspectionMetersListHandler'];
	            					promise = inspectionhandler.initializeAssetMeters(eventContext);
	            				} else {
	            					promise = handler.getAllAssetMeters(eventContext,woAssetLocMeterInfo);
	            				}
		            			
	            				promise.then(function(total){
			            			eventContext.ui.hideCurrentView();	
		            			});		
	            			}			
						}).otherwise(function(error) {
							Logger.log(JSON.stringify(error));
						});
					}
				});	
			});
		},
		
		commitLocationEntry: function(eventContext) {
			var woSet = eventContext.application.getResource('workOrder');
			var wo = woSet.getCurrentRecord();
			var location = eventContext.getCurrentRecord().get('location');
			
			var myLocalMeter = eventContext.getCurrentRecord();
			var metername = myLocalMeter.get('metername');
			var siteid = wo.get('siteid');
			var self = this;

			this.validateNewMeterReadingEntry(eventContext);
			
			eventContext.application.showBusy();
			
			if ((wo.assetlocmeterlist == undefined) || (wo.assetlocmeterlist == null) || (wo.assetlocmeterlist.length == 0)) {
				wo.getModelDataSet('assetlocmeterlist').then(function(multiAssetLocSet){
					wo.assetlocmeterlist = multiAssetLocSet;
				});
			}
			var woLocationMeter = wo.assetlocmeterlist.createNewRecord();
			var locationMeterPromise = self.locationMeterPromise(location, metername, siteid);
			
			Logger.trace('Setting LocationMeter Data');
			
			if (meterType == 'CONTINUOUS') {
				woLocationMeter.set('isdelta', (myLocalMeter.getPendingOrOriginalValue('isdelta') == null) ? false : myLocalMeter.getPendingOrOriginalValue('isdelta'));
				woLocationMeter.set('dorollover', (myLocalMeter.getPendingOrOriginalValue('dorollover') == null) ? false : myLocalMeter.getPendingOrOriginalValue('dorollover'));
			}
			
			woLocationMeter.set('location', location);
			woLocationMeter.set('metername', metername);
			woLocationMeter.set('metertype', meterType);
			woLocationMeter.set('newreading', myLocalMeter.getPendingOrOriginalValue('newreading'));
			woLocationMeter.set('newreadingdate', myLocalMeter.getPendingOrOriginalValue('newreadingdate'));
			woLocationMeter.set('inspector', myLocalMeter.getPendingOrOriginalValue('inspector'));
			woLocationMeter.set('remarks', myLocalMeter.getPendingOrOriginalValue('remarks'));

			ModelService.save(woSet).then(function() {
				locationMeterPromise.then(function(locationMeterSet){
					if ((locationMeterSet.count()>0)) {	
						Logger.trace('Setting locationmeter local Data');
						var locationmeter = locationMeterSet.getRecordAt(0);
						var lastReadingVal = 0;
						
						if ((meterType == 'CONTINUOUS') && (myLocalMeter.getPendingOrOriginalValue('isdelta') == true)){
							lastReadingVal = numberUtil.parse(myLocalMeter['newreading']) + numberUtil.parse(myLocalMeter['lastreading']);
						} else {
							lastReadingVal = myLocalMeter['newreading'];
						}
						
						locationmeter.set('localLastReading', lastReadingVal);
						locationmeter.set('localLastReadingDate', myLocalMeter['newreadingdate']);
									
						ModelService.save(locationMeterSet).then(function() {
							Logger.trace('Locationmeter local Data Saved.');
							//reset filter
	                        CommonHandler._clearFilterForResource(eventContext, locationMeterSet);
	                        
	                        var woAssetLocMeterInfo = eventContext.application.getResource('woAssetLocMeterInfo').getCurrentRecord();
	            			var handler = eventContext.application['application.handlers.MetersListHandler'];
	            			
	            			var promise = null;
	            			var promise2 = null;
	            			if (woAssetLocMeterInfo.originatingAction == "MULTIASSETLOC"){
	            				woAssetLocMeterInfo.set('originatingAction',"");
	            				
	            				//need to make sure wo total meters is updated as well.
	            				promise= handler.getAllLocationMeters(eventContext,woAssetLocMeterInfo);
	            				
	            				promise.then(function(total){
		            				promise2 = handler.getMultiAssetLocationMeters(eventContext,null);
									promise2.then(function(total){
										eventContext.ui.hideCurrentView();
									});	
								});	
	            				
	            			} else if (woAssetLocMeterInfo.originatingAction == "TASK"){
	            				woAssetLocMeterInfo.set('originatingAction',"");
	            				
	            				//need to make sure wo total meters is updated as well.
	            				promise= handler.getAllLocationMeters(eventContext,woAssetLocMeterInfo);
	            				
	            				promise.then(function(total){
		            				promise2 = handler.hideTaskLocationMeterButton(eventContext);
									promise2.then(function(total){
										eventContext.ui.hideCurrentView();
									});	
								});	
	            			} else {
	            				if (WL.StaticAppProps.APP_ID == "Inspection") {
	            					var inspectionhandler = eventContext.application['application.com.Inspection.handlers.InspectionMetersListHandler'];
	            					promise = inspectionhandler.initializeLocationMeters(eventContext);
	            				} 
	            				else {
	            					promise = handler.getAllLocationMeters(eventContext,woAssetLocMeterInfo);
	            				}
	            				promise.then(function(total){
			            			eventContext.ui.hideCurrentView();	
		            			});		            				
	            			}
	            			
						}).otherwise(function(error) {
							Logger.log(JSON.stringify(error));
						});
					}
				});	
			});
		},		
		
		// this is our full validation before committing a record
		validateNewMeterReadingEntry: function(eventContext) {
			var currentMeter = eventContext.getCurrentRecord();
			var newReading = currentMeter.getPendingOrOriginalValue('newreading');		
			var lastReading = currentMeter.getPendingOrOriginalValue('lastreading');			
			var doRollover = currentMeter.getPendingOrOriginalValue('dorollover');
			var isDelta = currentMeter.getPendingOrOriginalValue('isdelta');
			
			if ((newReading == "") || (newReading == null)) {
				throw new PlatformRuntimeException('invalidNewReading');
			}
			
			// we call these again because we may not trigger a validate between entering/changing a
			// value and pressing SAVE.
			this._validateNewReadingValue(eventContext);
			this.validateNewReadingDate(eventContext);
			
			if (meterType == 'CONTINUOUS') {
				if (currentMeter.get('rollover') != null) {
					if((numberUtil.parse(newReading) < numberUtil.parse(lastReading)) && !doRollover && !isDelta) {
						if (readingType == 'DELTA') {
							throw new PlatformRuntimeException('newReadingLowerThanNoRollover');	
						} else {
							throw new PlatformRuntimeException('newReadingLowerThan');	
						}										
					}
				} else {
					if((numberUtil.parse(newReading) < numberUtil.parse(lastReading)) && !isDelta) {
						throw new PlatformRuntimeException('newReadingLowerThanNoRollover');			
					}					
				}
			}
		},
		
		validateNewReadingDate: function(eventContext) {
			var currentMeter = eventContext.getCurrentRecord();
			var newreadingdate = currentMeter.getPendingOrOriginalValue('newreadingdate');
			
			if (this._isDateInFuture(newreadingdate)) {
				throw new PlatformRuntimeException('newReadingInFuture');	
			}
		},
		
		validateNewReading: function(eventContext) {
			// validate newreading value
			this._validateNewReadingValue(eventContext);
			// handle field metadata
			this._afterNewReadingChange(eventContext);
			
		},
		
		_validateNewReadingValue: function(eventContext) {
			var currentMeter = eventContext.getCurrentRecord();
			var newReading = currentMeter.getPendingOrOriginalValue('newreading');

			if (meterType == 'CHARACTERISTIC') {
				return;
			}
			
			if ((newReading != null) && (newReading != "")) {
				if (isNaN(numberUtil.parse(newReading))) {
					throw new PlatformRuntimeException('newReadingNaN', [newReading]);
				}		
			}
				
			if (meterType == 'CONTINUOUS') {
				if ((numberUtil.parse(newReading) < 0)) {
					throw new PlatformRuntimeException('newReadingBelowZero',[newReading]);
				}
				var rollover = currentMeter.get('rollover');
				if (rollover && newReading > rollover) {
					throw new PlatformRuntimeException('readingsCannotExceedRollover', [newReading]);
				}
			}
		},
		
		_isDateInFuture: function(readingdate) {
			if (readingdate != null) {
				var newReadingDateTime = DateTimeUtil.zeroSecondsAndMilliseconds(readingdate);
				var currentDateTime = DateTimeUtil.zeroSecondsAndMilliseconds(this.application.getCurrentDateTime());
				
				if (newReadingDateTime > currentDateTime) {
					return true;
				}	
			}		
			return false;
		},
		
		_setFieldsEditable: function(meter, isEditable) {		
			meter.getRuntimeFieldMetadata('newreadingdate').set('readonly', !isEditable);
			meter.getRuntimeFieldMetadata('inspector').set('readonly', !isEditable);
			meter.getRuntimeFieldMetadata('remarks').set('readonly', !isEditable);
			meter.getRuntimeFieldMetadata('inspector').set('readonly', !isEditable);

			// gauge and characteristic do not have these fields to set
			if (meterType == 'CONTINUOUS') {
				meter.getRuntimeFieldMetadata('isdelta').set('readonly', !isEditable);
				meter.getRuntimeFieldMetadata('dorollover').set('readonly', !isEditable);
								
				if ((readingType == 'ACTUAL') && (meter.get('rollover') != null)) {
					meter.getRuntimeFieldMetadata('dorollover').set('readonly', !isEditable);
				} else {
					meter.getRuntimeFieldMetadata('dorollover').set('readonly', true);
				}				
				
			}
		},
		
		_afterNewReadingChange: function(eventContext) {
			var readingEntry = eventContext.getCurrentRecord();
			var viewId = eventContext.ui.getCurrentViewControl().id;
			if(viewId == 'WorkExecution.AssetMeterDetailView' || viewId == 'WorkExecution.LocationMeterDetailView') {
				var newreading = readingEntry.getPendingOrOriginalValue('newreading');
				var hasNewValue = (( newreading != null ) && (newreading != "")) ? true : false;

				readingEntry.getRuntimeFieldMetadata('newreadingdate').set('required', hasNewValue);
				readingEntry.getRuntimeFieldMetadata('inspector').set('required', hasNewValue);
				
				if(hasNewValue) {
					// we may have a value set already, which may have been entered manually
					if (readingEntry.getAsDateOrNull('newreadingdate') == null) {
						readingEntry.setDateValue('newreadingdate', this.application.getCurrentDateTime());	
					}
					readingEntry.set('inspector', UserRolesManager.getCurrentUser().toUpperCase());
				} else {
					readingEntry.setNullValue('newreadingdate');
					readingEntry.setNullValue('inspector');
					
					// reset isDelta and Rollover back to defaults
					if (meterType == 'CONTINUOUS') {
						readingEntry.set('isdelta', (readingType == 'DELTA'));
					}
				}
				
				this._setFieldsEditable(readingEntry, hasNewValue);
				this.displayFooter(eventContext, hasNewValue);
			}
		},
		
		validateNewReadingFromLookup: function(eventContext) {
			var readingEntry = eventContext.getCurrentRecord();
			var newreading = readingEntry.getPendingOrOriginalValue('newreadinglookup');
			
			readingEntry.set('newreading', newreading);
			
			var hasNewValue = (( newreading != null ) && (newreading != "")) ? true : false;
			
			readingEntry.getRuntimeFieldMetadata('newreadingdate').set('required', hasNewValue);
			readingEntry.getRuntimeFieldMetadata('inspector').set('required', hasNewValue);			
			var viewId = eventContext.ui.getCurrentViewControl().id;
			
			if(hasNewValue) {
				readingEntry.set('newreading', newreading);
				if (readingEntry.getAsDateOrNull('newreadingdate') == null) {
					readingEntry.setDateValue('newreadingdate', this.application.getCurrentDateTime());	
				}
				readingEntry.set('inspector', UserRolesManager.getCurrentUser().toUpperCase());
			}
			else {
				readingEntry.setNullValue('newreading');
				readingEntry.setNullValue('newreadingdate');
				readingEntry.setNullValue('inspector');
			}
			
			this._setFieldsEditable(readingEntry, hasNewValue);
			
			if (viewId == 'WorkExecution.AssetMeterDetailView' || viewId == 'WorkExecution.LocationMeterDetailView') {
				this.displayFooter(eventContext, hasNewValue);
			}
		},

		displayFooter: function(eventContext, display) {
			var meterDetailView = eventContext.ui.getViewFromId(eventContext.ui.transitionInfo.id);
			meterDetailView.setFooterDisplay(display);
		},
		
		showNewReading: function(eventContext) {
			var currentMeter = eventContext.getCurrentRecord();
			var domainid = currentMeter.get('domainid');
			var hasDomain = (domainid && domainid != undefined && domainid != '') ? true : false;
			eventContext.setDisplay(!hasDomain);
		},
		
		showNewReadingWithLookup: function(eventContext) {
			var currentMeter = eventContext.getCurrentRecord();
			var domainid = currentMeter.get('domainid');
			var hasDomain = (domainid && domainid != undefined && domainid != '') ? true : false;
			eventContext.setDisplay(hasDomain);
		},
		
		showIsDelta: function(eventContext) {	
			var currentMeter = eventContext.getCurrentRecord();
			if (meterType == 'CONTINUOUS') {
				if (readingType == 'DELTA') {
					eventContext.setDisplay(true);
				} else if (!currentMeter.get('rollover')) {
					eventContext.setDisplay(true);
				} else {
					eventContext.setDisplay(false);
				}
			} else {
				eventContext.setDisplay(false);
			}
		},
		
		showDoRollover: function(eventContext) {
			var currentMeter = eventContext.getCurrentRecord();
			if (meterType == 'CONTINUOUS') {
				if (readingType == 'DELTA') {
					eventContext.setDisplay(false);
				} else if (!currentMeter.get('rollover')){
					eventContext.setDisplay(false);
				} else {
					eventContext.setDisplay(true);
				}
			} else {
				eventContext.setDisplay(false);
			}
		},
		
		filterDomainIdForLookup: function(eventContext) {	
			Logger.trace("domainid from meter: " + domainId);
			
	        if (domainId) {	
	        	eventContext.getResource().lookupFilter = [{domainid: domainId}];	
	        }
		}

	});		
	

	
	
});
