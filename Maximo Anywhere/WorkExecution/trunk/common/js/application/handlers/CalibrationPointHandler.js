/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/handlers/CalibrationPointHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "application/business/CalibrationPointObject",
	     "platform/format/FormatterService",
	     "platform/model/ModelService",
	     "platform/auth/UserManager",
	     "application/handlers/CommonHandler",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/translation/SynonymDomain",
	     "platform/util/PlatformConstants",
	     "platform/translation/MessageService",
	     "application/business/MaxVars",
	     "application/business/WpEditSettings",
	     "application/business/DataSheetObject",
	     "application/business/AssetFunctionObject",
	     "platform/logging/Logger",
	     "dojo/_base/array",
	     "dojo/Deferred",
	     "platform/util/ANumericUtil",
	     "application/business/calibration/_NumberFormatterMixin"],
function(declare, lang, CalibrationPointObject, FormatterService, ModelService, UserManager, CommonHandler, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, SynonymDomain, PlatformConstants, MessageService, MaxVars, WpEditSettings, DataSheetObject, AssetFunctionObject, Logger, arrayUtil, Deferred, ANumericUtil, _NumberFormatterMixin) {
	
	var precisionUtil = new ANumericUtil();
	
	return declare( ApplicationHandlerBase, {
		
/**@memberOf application.handlers.CalibrationPointHandler */
		setInputPrecision: function(eventContext){
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord(); 
			var assetfunction = datasheet.assetfunctionlist.getCurrentRecord();
			eventContext.setPrecisionForNumericField(assetfunction.inputprecision);
			
		},
		
		setOutputPrecision: function(eventContext){
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunction = datasheet.assetfunctionlist.getCurrentRecord();
			eventContext.setPrecisionForNumericField(assetfunction.outputprecision);
		},
		
		setNominalPointEditable: function(eventContext){
			this.syncDisplaynActualResource(eventContext);
			
			var point = eventContext.getCurrentRecord();
			if(!point.setpointadj)
			{
				point.getRuntimeFieldMetadata('asfoundinput').set('readonly', true);
				eventContext.editable = false;
				eventContext._setReadOnly(true);
			}
			
		},
		
		syncDisplaynActualResource: function(eventContext){
			var orig_attribute = eventContext.resourceAttribute.replace('_local', '');
			var currRec = eventContext.getCurrentRecord(eventContext.resourceAttribute);
			var tbvalue = currRec.getPendingOrOriginalValue( eventContext.resourceAttribute);
			if(tbvalue)
			{
				//ManageMaxfraction and max field value
				var maxFraction = 10;

				var maxFieldValue = 15;
				var val = _NumberFormatterMixin.limitFieldValue(tbvalue.replace(window.anywhere_locale_seperator, '.'),maxFieldValue, maxFraction);
				tbvalue = val?val: tbvalue;
				
				currRec.set(orig_attribute, tbvalue.replace('.', window.anywhere_locale_seperator));
				//Resetting this since we get locale numbers as we come into the screen
				var resourceAttribute = eventContext.resourceAttribute;
				currRec.set(resourceAttribute, tbvalue.replace(window.anywhere_locale_seperator, '.'));
			}
			else{
				currRec.setNullValue(orig_attribute);
			}
		},
		
		/**
		 * Entry point for Calibration Point input validation
		 */
		validateCalibrationEntry: function(eventContext) {	
			
			if (this.repeatable(eventContext)) {
				this.validateRepeatableEntry(eventContext);
			}else {
				this.performCalculation(eventContext);
			}
			
		},
		
		
		validateRepeatableEntry: function(eventContext) {
			
			this.syncDisplaynActualResource(eventContext);
			
			var prefix = eventContext.metaData.name.search('asfound') >= 0 ? 'asfound' : 'asleft';
			
			var point = eventContext.getCurrentRecord();
			CalibrationPointObject.setCalibrationPoint(point);
			
			if(CalibrationPointObject.isAnalog()) {					
				//If any erros it throws an error on the UI
				//Check if input field and validate input
				var validate_result = null;
				if(eventContext.resourceAttribute.indexOf('input') > 0){
					validate_result = this.validateInput(eventContext);
					if(validate_result && !validate_result.validate){
						eventContext.textWidget.domNode.value = '';
						eventContext.textWidget.value = '';
						eventContext.getCurrentRecord().set(eventContext.resourceAttribute, '');
						eventContext.application.showMessage(MessageService.createResolvedMessage(validate_result.messageKey, validate_result.params));
						return;
					}
				}
			}
			
			if ( prefix ) {
				point = CalibrationPointObject.clearAttributes(prefix);
				
				if( point.get(prefix + 'output') == '')
					point.setNullValue(prefix + 'output');
				if( point.get(prefix + 'input') == '')
					point.setNullValue(prefix + 'input');
			}
			
			if(prefix == 'asfound')
				this.enableCompleteReadingsAsFound(eventContext);
			else
				this.enableCompleteReadingsAsLeft(eventContext);
			
		},
		
		checkPrecisionComplete: function(eventContext, decimal_seperator){
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunction = datasheet.assetfunctionlist.getCurrentRecord();
			
			var prefix = eventContext.metaData.name.search('asfound')
			var precision = prefix>=0? assetfunction.outputprecision : assetfunction.inputprecision;
			var value = eventContext.getValue();
			var exp_nmbr = precisionUtil._manageMinFieldResolution(value, decimal_seperator, precision);
			// Process base if necessary
			exp_nmbr = precisionUtil._manageMissingBase(exp_nmbr.toString(), decimal_seperator);
			
			return exp_nmbr;
			
			
		},
		
		prepareForLocaleAndPrecision: function(eventContext){
			var user_info = eventContext.application.getResource('userInfo');
			var validators = user_info.data[0].memo.split(":::");
			var validation_regexp = validators[0];
			var decimal_seperator =  window.anywhere_locale_seperator;
			
			var pattern = new RegExp(validation_regexp);
			
			var currRec =eventContext.getCurrentRecord();
			if(pattern.test(eventContext.getValue())){
				
				var complete_value = this.checkPrecisionComplete(eventContext, decimal_seperator);
				if(complete_value.toString() !== eventContext.getValue().toString() && eventContext.getValue().toString() !== ""){
					var orig_attribute = eventContext.resourceAttribute.replace('_local', '');
					currRec.set(orig_attribute, complete_value);
					currRec.set(eventContext.resourceAttribute,complete_value.replace(decimal_seperator, '.'));
				}
			}
			else{
				if(eventContext.getValue() || eventContext.getValue() !== "")
					currRec.setNullValue(eventContext.resourceAttribute);
			}
			
		},
				
		performCalculation: function(eventContext) {
			
			this.syncDisplaynActualResource(eventContext);
			
			if(eventContext.resourceAttribute == 'asfoundoutput')
				this.validateOutput(eventContext);
			
			var prefix = eventContext.metaData.name.search('asfound') >= 0 ? 'asfound' : 'asleft';
			var point = eventContext.getCurrentRecord();
			CalibrationPointObject.setCalibrationPoint(point);
			var instr = CalibrationPointObject.getAssetFunction();
			// make domaincalstatus available to CalibrationPointObject
			CalibrationPointObject.setCalStatusDomain(eventContext.application.getResource('domaincalstatus'));
			
			//Clear the calibration attributes
			if(prefix)
				point = CalibrationPointObject.clearAttributes(prefix);
			
			try {
				if(CalibrationPointObject.isAnalog()) {					
					//If any erros it throws an error on the UI
					//Check if input field and validate input
					var validate_result = null;
					if(eventContext.resourceAttribute.indexOf('input') > 0){
						validate_result = this.validateInput(eventContext);
						if(validate_result && !validate_result.validate){
							eventContext.textWidget.domNode.value = '';
							eventContext.textWidget.value = '';
							eventContext.getCurrentRecord().set(eventContext.resourceAttribute, '');
							eventContext.application.showMessage(MessageService.createResolvedMessage(validate_result.messageKey, validate_result.params));
							return;
						}
					}
					
					//Defect 209133
					if(point.get(prefix + 'output') == '')
						point.setNullValue(prefix + 'output');
					if(point.get(prefix + 'input') == '')
						point.setNullValue(prefix + 'input');
					
					//If nonlinear, both fields should be filled
					//before calculating the tolerances
					if(instr.nonlinear){
						if (!point.isNull(prefix + 'output') && !point.isNull(prefix + 'input'))
						{
							CalibrationPointObject.performCalculation(prefix);
						}

					}else{
						//Not checking for output field, since input not filled. Do nothing.
						if (!point.isNull(prefix + 'input'))
						{
							CalibrationPointObject.performCalculation(prefix);
						}
						
					}
				}
				else if(CalibrationPointObject.isDiscrete()) {
					//Defect 209133
					if(point.get(prefix + 'setpoint') == '')
						point.setNullValue(prefix + 'setpoint');
					
					if(!point.isNull(prefix + 'setpoint')) {
						CalibrationPointObject.performCalculation(prefix);
					}
				}
			}
			catch(e) {
				this.handleException(eventContext, e);
			}
			
			if(point['invalidValueFound'] === true && eventContext.ui.dialogStack.length === 0){
				eventContext.application.showMessage(MessageService.createResolvedMessage('tolerancelimit'));
				point['showToleranceLimitMessage'] = false;
				return;
			}
				
			if(prefix == 'asfound')
				this.enableCompleteReadingsAsFound(eventContext);
			else
				this.enableCompleteReadingsAsLeft(eventContext);
				
		},
		
		completeAsFound: function(eventContext){
			var assetfunction = this.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
			if(assetfunction.repeatable) {
				this._completeRepeatableCalPointReadings(eventContext, 'asfound');
			}
			else {
				eventContext.viewControl["_completereadingsclicked"] = true;
				this._completeReadings(eventContext, 'asfound', true);
			}
		},

		completeAsLeft: function(eventContext, noAdjMadeCheck){
			/* noAdjMadeCheck - flag used to know if a call come from 'No Adjustment Made' checkbox or, 
			 * if false (or undefined) Complete Readings (or Complete Calibration Points) button has been pressed.
			 * This flag is only relevant to complete 'As Left', since 'No Adjustment Made' is the process 
			 * to copy values from 'As Found' to 'As Left'.
			 */
			var assetfunction = this.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
			if(assetfunction.repeatable) {
				this._completeRepeatableCalPointReadings(eventContext, 'asleft', noAdjMadeCheck);
			}
			else {
				eventContext.viewControl["_completereadingsclicked"] = !noAdjMadeCheck;
				this._completeReadings(eventContext, 'asleft', !noAdjMadeCheck);
			}
		},
		
		_completeReadings: function(eventContext, statusPrefix, completeReadingsClicked){
			
			if(this.getPointErrorFlag(eventContext)){
				eventContext.application.showMessage(MessageService.createResolvedMessage('tolerancelimit'));
				return;
			}
			
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunction = datasheet.assetfunctionlist.getCurrentRecord();
			if (assetfunction) {
				var showMessage = false;
				var pointSet = this.application.getResource('dataSheetResource.calibrationpointlist');
				var status = this._getAssetFunctionStatus(assetfunction, pointSet, statusPrefix);
				assetfunction.setNullValue(statusPrefix + 'calstatus');	
				// now set status on assetfunction
					if (status != null){
						if(eventContext.direction && eventContext.direction != 1){	
							showMessage = true;
						}
						assetfunction.set(statusPrefix + 'calstatus', status);	
				}
				this._updateDataSheetStatus(eventContext, datasheet, statusPrefix);

				// set error count on asset function for cal points and func checks
				this._setAssetFunctionErrorCount(assetfunction, pointSet, statusPrefix);

				// close current view and show message
				if(eventContext.ui.getCurrentView().id != "WorkExecution.CalibrationPointReadings"){
					eventContext.ui.hideCurrentView();
				}
				// show message only if asset function status has changed or if complete readings was clicked
				if (completeReadingsClicked || showMessage){
					this._showStatusMessage(eventContext, statusPrefix, assetfunction);
				}
			}
		},
		
		_completeRepeatableCalPointReadings: function(eventContext, prefix, noAdjMadeCheck) {
			var pointSet = this.application.getResource('dataSheetResource.calibrationpointlist');
			var avgpoint = CalibrationPointObject.performCalculationForRepeatables(prefix, pointSet);
			if(!noAdjMadeCheck) {
				eventContext.ui.hideCurrentView();
				this._showAvgCalStatusMessage(eventContext, prefix, avgpoint);
			}
		},
		
		completeAsFoundAverageCalPointReadings: function(eventContext) {
			eventContext.viewControl["_completereadingsclicked"] = true;
			this._completeReadings(eventContext, 'asfound', true);
		},
		
		completeAsLeftAverageCalPointReadings: function(eventContext) {
			eventContext.viewControl["_completereadingsclicked"] = true;
			this._completeReadings(eventContext, 'asleft', true);
		},
		
		_showAvgCalStatusMessage: function(eventContext, statusPrefix, calpoint){
			var statusAttribute = statusPrefix + 'status';
			var status = calpoint.get(statusAttribute);
			if (status != null){
				eventContext.application.showMessage(MessageService.createResolvedMessage(statusPrefix+'AvgCalStatus', [calpoint.get('point'), status]));
			}
		},
		
		_showStatusMessage: function(eventContext, statusPrefix, assetfunction){
			var statusAttribute = statusPrefix + 'calstatus';
			var status = assetfunction.get(statusAttribute);
			if (status != null){
				eventContext.application.showMessage(MessageService.createResolvedMessage(statusAttribute, [assetfunction.get('assetfunction'), status]));
			}
		},

		_getAssetFunctionStatus: function(assetfunction, pointSet, statusPrefix){
			var status = null;
			var domaincalstatus = this.application.getResource('domaincalstatus');
			if (assetfunction.calpoint == true){	// calibration points
				status = SynonymDomain.resolveToDefaultExternal(domaincalstatus, 'PASS');
				var maxtolexceeded = null;
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					// skip point if there are no errors set
					if(point.asfounderror == false && point.aslefterror == false) {
						continue;
					}
					var tolindex = this._getMaxToleranceExceeded(point, statusPrefix);
					if (tolindex > maxtolexceeded){	// if a higher tolerance has exceeded
						// get status from assetfuction tolXstatus
						status = assetfunction.get('tol' + tolindex + 'status');
						maxtolexceeded = tolindex;
						assetfunction.widestTol = maxtolexceeded;
						var range = assetfunction.get('tol'+maxtolexceeded+'uppervalue') - assetfunction.get('tol'+maxtolexceeded+'lowervalue');
						assetfunction.widestTolwidth = range;
					}
				}
			} 
			else if (assetfunction.calfunction == true){	// function checks
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					// check has not been completed, there's no status to set.  break out
					if(point.get(statusPrefix + 'pass') == false && point.get(statusPrefix + 'fail') == false) {
						break;
					}
					// if any fail is set, assetfunction calstatus fails
					if (point.getPendingOrOriginalValue(statusPrefix + 'fail') == true){
						status = SynonymDomain.resolveToDefaultExternal(domaincalstatus, 'FAIL');
						break;
					}
					// if pass is set, status is pass but have to check all points
					else if (point.getPendingOrOriginalValue(statusPrefix + 'pass') == true){
						status = SynonymDomain.resolveToDefaultExternal(domaincalstatus, 'PASS');
					}
				}
			}
			return status;
		},
		
		_getMaxToleranceExceeded: function(point, prefix) {
			var maxtolexceeded = null;
			for(var i = 1; i < 5; i++) {
				// is there a tolerance?
				var error = point.get(prefix+'error'+i);
				if(error != null && error != undefined && Math.abs(error) > 0) {
					//var range = point[prefix+'tol'+i+'upper'] - point[prefix+'tol'+i+'lower'];
					maxtolexceeded = i;
				}
			}
			return maxtolexceeded;
		},
		
		_updateDataSheetStatus: function(eventContext, datasheet, prefix){
			// automatically update data sheet status if maxvar is set
			var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");
			var orgid = datasheet.get('orgid');
			if (MaxVars.autoUpdateDataSheetStatus(oslcmaxvars, orgid)){
				var afSet = datasheet.assetfunctionlist;
				// update the data sheet status if all assetfunctions have asfound/asleftstatus
				var missingStatus = this._checkAFStatuses(afSet, prefix);
				if (!missingStatus){ // all asset functions have status set if necessary and auto update is on
					// update datasheet status based on asfound or asleft prefix
					var ds_status = this._getDataSheetStatus(afSet, prefix); 
					datasheet.setNullValue(prefix + 'calstatus');
					datasheet.set(prefix + 'calstatus', ds_status);
					DataSheetObject.setDataSheetStatusNPFields(datasheet, ds_status, prefix);
				}
			}
		},

		_getDataSheetStatus: function(afSet, prefix){
			// get the DataSheet status from the set of asset functions
			var domaincalstatus = this.application.getResource('domaincalstatus');
			var finalStatus = 'PASS';
			var af = null;
			var tol = null;		
			for(var i = 0; i < afSet.count(); i++) {
				af = afSet.getRecordAt(i);
				var status = SynonymDomain.resolveToInternal(domaincalstatus, af.get(prefix + 'calstatus'));

				if (af.caldynamic == false && status == null && status == undefined){
					// if any af status is null, the overall set status (for the data sheet) is null
					return null;
				}

				// if not a dynamic check and status is MISSING or BROKEN, datasheet status is same
				if (af.caldynamic == false && (status == 'MISSING' || status == 'BROKEN')){
					finalStatus = status;
					break;
				}else{
					// for calibration points
					if (af.calpoint == true){
						// for each asset function, if the status is not pass, find the tolerance with that status
						if (status != 'PASS'){
							if(status == 'FAIL') {
								finalStatus = status;
								break;
							}
							else {
								var tmpTol = this._getToleranceForStatus(af, prefix, status);
								if (tmpTol && tmpTol.tol > 0 && (tol == null || tmpTol.tol > tol.tol)){	// if tmpTol > 0, then the tolerance with index of tmpTol.tol was exceeded
									tol = tmpTol;
									finalStatus = tol.status;
								}
							}
						}
					} 
					// for function checks
					else if (af.calfunction == true){  
						// for each asset function, if the status is not pass, set it to fail and return
						if (status != 'PASS'){
							finalStatus = 'FAIL';
							break;
						}
					}
				}
			}
			return SynonymDomain.resolveToDefaultExternal(domaincalstatus, finalStatus);
		}, 
		
		_getToleranceForStatus: function(assetFunction, statusPrefix, statusValue){
			// return tolerance index, width and status
			// return the tolerance index, width and status
			return {"tol": assetFunction.widestTol, "width": assetFunction.widestTolwidth, "status": statusValue};
		},
		
		_checkAFStatuses: function(afSet, prefix){
			var missingStatus = false;
			for(var i = 0; i < afSet.count(); i++) {
				af = afSet.getRecordAt(i);
				// break out if asfound or asleft cal statuses are not set (ignore dynamic checks)
				if(af.get("caldynamic") == false &&
						(af.get( prefix + "calstatus") == null || af.get(prefix + "calstatus") == "") ){
					missingStatus = true;
					break;
				}
			}
			return missingStatus;
		},
		
		//Complete Readings for Dynamic Check
		updateDC: function(eventContext){
			this.validateUnitMeasureDynamicViewCompleteBack(eventContext);
		},

		validateInput: function(eventContext) {
			var result = this._commonValidation(eventContext);
			
			if(!result.validate)
				return result
			else
			{
				result = CalibrationPointObject.isInputWithinRange(eventContext.getLabelString(), eventContext.getValue());
			}
			
			return result;
		},
		
		validateOutput: function(eventContext) {
			return this._commonValidation(eventContext);
		},
		
		validateSetPoint: function(eventContext) {
			return this._commonValidation(eventContext);
		},

		_commonValidation: function(eventContext) {
			var result = {'validate': true, 'messageKey': null, 'params':[]};
			CalibrationPointObject.setCalibrationPoint(eventContext.getCurrentRecord());
			var value = eventContext.getValue();
			if(value == NaN) {
				result.validate = false;
				result.messageKey = 'pluscValueIsNaN';
				result.params = [value];
				
			}
			this._setDataSheetRequired(eventContext);
			return result;
		},
		
		validateAsLeftFunctionPass: function(eventContext) {
			this._validateFunctionCheck(eventContext, "asleftpass", "asleftfail");
		},

		validateAsLeftFunctionFail: function(eventContext) {
			this._validateFunctionCheck(eventContext, "asleftfail", "asleftpass");
		},

		validateAsFoundFunctionPass: function(eventContext) {
			this._validateFunctionCheck(eventContext, "asfoundpass", "asfoundfail");
		},

		validateAsFoundFunctionFail: function(eventContext) {
			this._validateFunctionCheck(eventContext, "asfoundfail", "asfoundpass");
		},

		_validateFunctionCheck: function(eventContext, clickedAttribute, otherAttribute){
			var point = eventContext.getCurrentRecord();
			// if the clicked attribute is set, unset it
			if (point.getPendingOrOriginalValue(clickedAttribute) == true && point.getPendingOrOriginalValue(otherAttribute) == true){
				point.set(otherAttribute, false);
			}
			this._setDataSheetRequired(eventContext);
		},
		
		validateDynamicUnit: function(eventContext){
			var dyn_point = eventContext.getCurrentRecord();
			var dynamic_lookup_unit = dyn_point.getPendingOrOriginalValue(eventContext.resourceAttribute);
			if(!dynamic_lookup_unit){
				 if (dyn_point.invalidUnit){
					delete dyn_point.invalidUnit; 
				}
				return;
			}
			if(dyn_point.invalidUnit && dyn_point.invalidUnit == dynamic_lookup_unit){
				//Store off invalid value so message only show when data entered
				return;
			}			
			var filter = [];
			filter.push({'value':dynamic_lookup_unit});
			ModelService.filtered("domainCalDynamcUnit", null, filter, null, false, true).then(function(domainCalDynamcUnit){				
				if(domainCalDynamcUnit.count() == 0){
					//Store off invalid value so message only show when data entered
					dyn_point.invalidUnit = dynamic_lookup_unit;
					eventContext.application.showMessage(MessageService.createStaticMessage('invalidDynamicUnit').getMessage());
				}
				else if (dyn_point.invalidUnit){
					delete dyn_point.invalidUnit; 
				}
			});
		},

		validateWorkOrderStatus: function(eventContext){
			var oslcwpeditsetting = CommonHandler._getAdditionalResource(eventContext,"oslcwpeditsetting");
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var domainwostatus = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
			
			return WpEditSettings.shouldEditCalPoint(oslcwpeditsetting, 
					SynonymDomain.resolveToInternal(domainwostatus,wo.get('status')), wo.get('orgid'));
		},

		// only checks that as found entries are valid and pass group validation
		enableGroupCompleteReadingsAsFound: function(eventContext) {
			var groupValidation = true;
			this._enableCompleteReadingsButton(eventContext, false, groupValidation);
		},
		
		// checks that both as found and as left entries are valid and pass group validation
		enableGroupCompleteReadingsAsLeft: function(eventContext) {
			var groupValidation = true;
			this._enableCompleteReadingsButton(eventContext, true, groupValidation);
		},
		
		// only checks that as found entries are valid
		enableCompleteReadingsAsFound: function(eventContext) {
			this._enableCompleteReadingsButton(eventContext, false);
		},

		// checks that both as found and as left entries are valid
		enableCompleteReadingsAsLeft: function(eventContext) {
			this._enableCompleteReadingsButton(eventContext, true);
		},
		
		_enableCompleteReadingsButton: function(eventContext, checkAsLeft, groupValidation) {
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			var pointSet = this.application.getResource('dataSheetResource.calibrationpointlist');
			
			//Somehow this get called when we add a new record to calibration pointlist resource
			//Detecting this and not processsing further.
			if(assetfunc.newPoint)
				return
			
			var domainCalStatus = eventContext.application.getResource('domaincalstatus');
			var asfoundBroken = CalibrationPointObject.checkMissingOrBroken(datasheet, assetfunc, pointSet, 'asfound', domainCalStatus);
			var asleftBroken = CalibrationPointObject.checkMissingOrBroken(datasheet, assetfunc, pointSet, 'asleft', domainCalStatus);
			var enable = true;
			if(!pointSet.count() || !this.validateWorkOrderStatus(eventContext)){
				enable = false;
			}
			// if checkAsLeft == false, only check asfound.  if checkAsLeft == true, check asfound AND asleft
			else if (assetfunc.calfunction == true){  // function checks
				if(!checkAsLeft) {
					enable = CalibrationPointObject.areFunctionChecksComplete(pointSet, 'asfound');
				}
				else {
					enable = CalibrationPointObject.areFunctionChecksComplete(pointSet, 'asleft');
				}
				//enable = (asfoundBroken || CalibrationPointObject.areFunctionChecksComplete(pointSet, 'asfound'))
				//	&& (asleftBroken || !checkAsLeft || CalibrationPointObject.areFunctionChecksComplete(pointSet, 'asleft'));
			}
			else if (assetfunc.caldynamic == true){  // dynamic checks
				if(!checkAsLeft) {
					enable = CalibrationPointObject.areDynamicChecksComplete(pointSet, 'asfound');
				}
				else {
					enable = CalibrationPointObject.areDynamicChecksComplete(pointSet, 'asleft');
				}
				//enable = (asfoundBroken || CalibrationPointObject.areDynamicChecksComplete(pointSet, 'asfound'))
				//	&& (asleftBroken || !checkAsLeft || CalibrationPointObject.areDynamicChecksComplete(pointSet, 'asleft'));
			}
			else if (assetfunc.calpoint == true){  // calibration points
				if (groupValidation) {
					if(!checkAsLeft) {
						enable = CalibrationPointObject.areGroupCalPointsComplete(pointSet, 'asfound', assetfunc);
					}
					else {
						enable = CalibrationPointObject.areGroupCalPointsComplete(pointSet, 'asleft', assetfunc);
					}
					//enable = (asfoundBroken || CalibrationPointObject.areGroupCalPointsComplete(pointSet, 'asfound', assetfunc))
					//	&& (asleftBroken || !checkAsLeft || CalibrationPointObject.areGroupCalPointsComplete(pointSet, 'asleft', assetfunc));
				}
				else {
					if(!checkAsLeft) {
						enable = CalibrationPointObject.areCalPointsComplete(pointSet, 'asfound');
					}
					else {
						enable = CalibrationPointObject.areCalPointsComplete(pointSet, 'asleft');
					}
					//enable = (asfoundBroken || CalibrationPointObject.areCalPointsComplete(pointSet, 'asfound'))
					//	&& (asleftBroken || !checkAsLeft || CalibrationPointObject.areCalPointsComplete(pointSet, 'asleft'));
				}
			}

			try {
				DataSheetObject.getRelatedDSConfig();
			}
			catch(e) {
				this.handleException(eventContext, e);
				enable = false;
			}
			
			if (eventContext.viewControl.footerButtons.length > 0){
				eventContext.viewControl.footerButtons[0].setEnabled(enable);
			}
		},
		
		_setDataSheetRequired: function(eventContext){
			var ds = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			// if it was false, set it to true when points are entered
			if (ds.get('required') == false){
				ds.set('required', true);
			}
		},
		
		fromDisplayableValue: function(value, fromType, options) {
			value = value ? value : '';
			options = options ? options : {};
			options['places'] = options['places'] ? options.places : this.decimalPlacesOf(value);
			return FormatterService.fromDisplayableValue(value, fromType, this.locale, options);
		},
		
		/**
		 * Also, called on the Asset Details Function view initialize, for the No adjustment made checkbox.
		 *
		 */
		setCalPointsInputMode: function(eventContext) {
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");
			var orgid = assetfunc.get('orgid');
			var noadjmade = assetfunc.get('noadjmade');

			var asFoundStatus = assetfunc.get('asfoundcalstatus');
			var asLeftStatus = assetfunc.get('asleftcalstatus');
			var readonly = false;
			var input_readonly = false;
			
			// if the af statuses are set, then the readings were completed
			if (asFoundStatus != null && asLeftStatus != null){
				if (!MaxVars.canEditCalPointsAfterAFStatusSet(oslcmaxvars, orgid)){	// if you can't edit the points
					readonly = true;
				}
				else if (noadjmade == true){	// if you can edit the points but noadjmade is set
					readonly = true;
				}
			}
			
			if(assetfunc.nonlinear)
				input_readonly = true;
			
			var pointSet = datasheet.calibrationpointlist;
			if(!this.validateWorkOrderStatus(eventContext))
			{
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);	
					point.getRuntimeFieldMetadata('asfoundinput_local').set('readonly', true);
					point.getRuntimeFieldMetadata('asfoundoutput_local').set('readonly', true);
					point.getRuntimeFieldMetadata('asleftinput_local').set('readonly', true);
					point.getRuntimeFieldMetadata('asleftoutput_local').set('readonly', true);
					point.getRuntimeFieldMetadata('asfoundsetpoint_local').set('readonly', true);
					point.getRuntimeFieldMetadata('asleftsetpoint_local').set('readonly', true);
				// additional function check fields
					point.getRuntimeFieldMetadata('asfoundfail').set('readonly', true);
					point.getRuntimeFieldMetadata('asleftfail').set('readonly', true);
					point.getRuntimeFieldMetadata('asfoundpass').set('readonly', true);
					point.getRuntimeFieldMetadata('asleftpass').set('readonly', true);
				// additional dynamic check fields
					point.getRuntimeFieldMetadata('asfoundunit').set('readonly', true);
					point.getRuntimeFieldMetadata('asleftunit').set('readonly', true);
				}
				
				//only display message on calibration readings view
                if (eventContext.ui.transitionInfo.id.indexOf('.CalibrationPointReadings')<0){
                	eventContext.application.showMessage(MessageService.createStaticMessage('WOSatusCalPoints').getMessage());	
                }

			}
			else{
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					// cal point fields
					point.getRuntimeFieldMetadata('asfoundinput_local').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asfoundoutput_local').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asleftinput_local').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asleftoutput_local').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asfoundsetpoint_local').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asleftsetpoint_local').set('readonly', readonly);
					
					// additional function check fields
					point.getRuntimeFieldMetadata('asfoundfail').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asleftfail').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asfoundpass').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asleftpass').set('readonly', readonly);
					
					// additional dynamic check fields
					point.getRuntimeFieldMetadata('asfoundunit').set('readonly', readonly);
					point.getRuntimeFieldMetadata('asleftunit').set('readonly', readonly);
					
					//We set input to readonly if linear for calibration points and copy the nominalinput over
					//to as found nad as left input
					if(input_readonly)
					{
						point.getRuntimeFieldMetadata('asfoundinput_local').set('readonly', input_readonly)
						point.getRuntimeFieldMetadata('asleftinput_local').set('readonly', input_readonly);
						point.asfoundinput = point.inputvalue;
						point.asleftinput = point.inputvalue;

					}
				}
			}
			Logger.timerStart('Status Calculation', 1);
			var prefix = eventContext.id.toLowerCase().indexOf('asfound') >= 0 ? 'asfound' : 'asleft';
			var domaincalstatus = eventContext.application.getResource('domaincalstatus');
			domaincalstatus.clearFilterAndSort();
			CalibrationPointObject.setCalStatusDomain(domaincalstatus);
			CalibrationPointObject.calculateInitialStatus(prefix, pointSet);
			Logger.timerEnd('Status Calculation', 1);
			
			var idx = pointSet[prefix + '_curr_index']? pointSet[prefix + '_curr_index'] : 0;
			pointSet.setCurrentIndex(idx) ;
			if(eventContext.lists[0])
				eventContext.lists[0].listWidget.refresh();
			
		},
		
		setListIndex: function(eventContext){
			if (eventContext.ui.movingBack){
				var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
				var pointSet = datasheet.calibrationpointlist;
				var prefix = eventContext.id.toLowerCase().indexOf('asfound') >= 0 ? 'asfound' : 'asleft';
				var idx = pointSet._currentIndex;
				
				pointSet[prefix + '_curr_index'] =  idx;
						
			}
		},
		
		clearPointIndexes: function(eventContext){
			if (eventContext.ui.movingBack){
				var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
				var pointSet = datasheet.calibrationpointlist;
				if(pointSet['asfound_curr_index'])
					pointSet['asfound_curr_index'] = null;
				if(pointSet['asleft_curr_index'])
					pointSet['asleft_curr_index'] = null;			
			}
		},
		
		validateAsFoundNoAdjustmentMade : function(eventContext, planType){
            eventContext.application.showBusy();
            var self = this;
            setTimeout(function(){
	            //if assetfunction is not edtable return, do not execute click
				var isAFALEditable = self.validateWorkOrderStatus(eventContext);
	            if(!isAFALEditable){
		            eventContext.application.hideBusy();
	            	return;
	            }
	            
				var curAssetFunction = self.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
	            var curStatus = curAssetFunction.asfoundstatusicon_np;
	            if(!curStatus || (curStatus != 'PASS') || !curAssetFunction['noadjmadechoice1'] ){
		            eventContext.application.hideBusy();
	                return;
	            }
	            var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
	            
	            // we need to reverse the value of checkbox, because the event click preceeds the checkbox fill
	            var noadjmade = eventContext.checkBoxWidget.get('checked');
	            curAssetFunction.set('noadjmade', noadjmade ? true : false); 
	            eventContext.application.showBusy();
	            
	            
	            self._copyPointsAsFoundToAsLeft(eventContext, curAssetFunction,datasheet,noadjmade);
	                //curAssetFunction.set('noadjmade', true);
	            /*} else {
	                var self = this;
	                if(!datasheet._isChanged){
	                    curAssetFunction.set('noadjmade', true);
	                }
	                ModelService.save(datasheet.getOwner()).then(function(){
	                    self._copyPointsAsFoundToAsLeft(eventContext, curAssetFunction, datasheet, true);
	                    // a priority transaction was opened in the ds view, reopen one
	                    datasheet.openPriorityChangeTransaction();
	                });*/
	            
	            eventContext.application.hideBusy();
            },100);
        },
        
        _copyPointsAsFoundToAsLeft: function(eventContext, curAssetFunction, datasheet, noadjmade){
            var newAdjust;
            if(noadjmade){
                newAdjust = true;
            }
            else {
                newAdjust = false;
            }
            
            if(!newAdjust) {
                datasheet.setNullValue('asleftcalstatus');
                datasheet.setNullValue('asleftstatusicon_np');
                datasheet.setNullValue('asleftstatusdesc_np');
                curAssetFunction.setNullValue('asleftcalstatus');
                curAssetFunction.setNullValue('asleftstatusicon_np');
                curAssetFunction.setNullValue('asleftstatusdesc_np');
            }
            var pointSet = datasheet.calibrationpointlist;
            if(curAssetFunction.repeatable) {
            	pointSet.clearFilterAndSort();
            	CalibrationPointObject.filterOutRepeatableCalPointList(pointSet);
            	//pointSet.filter('isaverage == true');
            	pointSet.setCurrentIndex(0);
            	var avgarray = pointSet.data;
            	var point = null;
            	// iterate over avgs setting each one properly as current
            	for(var i = 0; i < avgarray.length; i++) {
                    point = avgarray[i];
                    pointSet.setCurrentIndexByRecord(point);
                    CalibrationPointObject.filterRepeatableRecords(pointSet);
                    var repeatable = pointSet.getRecordAt(0);
    				while(repeatable) {
    					CalibrationPointObject.noAdjMadeAction(repeatable, newAdjust);
    					repeatable = pointSet.next();
    				}
    				if(newAdjust) {
    					// complete asleft repeatable cal point readings
						this.completeAsLeft(eventContext, true);
					}
    				else {
						if(curAssetFunction.plantype == 'ANALOG') {
							point.setNullValue('asleftinput');
							point.setNullValue('asleftoutput');
							point.setNullValue('aslinputstddev');
							point.setNullValue('asloutputstddev');
							point.setNullValue("aslefterror1");
		                    point.setNullValue("aslefterror2");
		                    point.setNullValue("aslefterror3");
		                    point.setNullValue("aslefterror4");
		                    point.setNullValue("asleftouterror");
		                    point.setNullValue("asleftproerror");
		                    point.setNullValue("aslefttol1lworig");
		                    point.setNullValue("aslefttol2lworig");
		                    point.setNullValue("aslefttol3lworig");
		                    point.setNullValue("aslefttol4lworig");
		                    point.setNullValue("aslefttol1uporig");
		                    point.setNullValue("aslefttol2uporig");
		                    point.setNullValue("aslefttol3uporig");
		                    point.setNullValue("aslefttol4uporig");
		                    point.setNullValue("aslefttol1lower");
		                    point.setNullValue("aslefttol2lower");
		                    point.setNullValue("aslefttol3lower");
		                    point.setNullValue("aslefttol4lower");
		                    point.setNullValue("aslefttol1upper");
		                    point.setNullValue("aslefttol2upper");
		                    point.setNullValue("aslefttol3upper");
		                    point.setNullValue("aslefttol4upper");
						}
						else {
							point.setNullValue('asleftsetpoint');
							point.setNullValue('aslsetptstddev');
							point.setNullValue("aslefterror1");
							point.setNullValue("aslefterror2");
							point.setNullValue("aslefterror3");
							point.setNullValue("aslefterror4");
						}
						point.setNullValue('asleftstatusicon');
						point.setNullValue('asleftstatus');
						point.setNullValue('asleftstatusdesc');
						point.setNullValue('asleftouterror');
    				}
                    pointSet.clearFilterAndSort();
            	}
            	if(newAdjust) {
            		// complete as left cal points
            		this._completeReadings(eventContext, 'asleft', false);
            	}
            }
            else {
            	var calstatusdomain = eventContext.application.getResource('domaincalstatus');
            	for(var i = 0; i < pointSet.count(); i++) {
                    point = pointSet.getRecordAt(i);
                    CalibrationPointObject.noAdjMadeAction(point, newAdjust);
                    CalibrationPointObject.setCalibrationPoint(point);
                    CalibrationPointObject.setCalStatusDomain(calstatusdomain);
                    CalibrationPointObject.performCalculation('asleft');
                    //Called once more after perform calculation
                    CalibrationPointObject.noAdjMadeAction(point, newAdjust);
                    
                }
            	if(newAdjust){
                    this.completeAsLeft(eventContext, true);
                }
            }
        },
		
        initEditabilityOnField : function(eventContext){
        	var isAFALEditable = this.validateWorkOrderStatus(eventContext);
			eventContext._setReadOnly(!isAFALEditable);
        },
        
		enableAsFoundNoAdjustmentMade : function(eventContext, planType){
			var curAssetFunction = this.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
			var curStatus = curAssetFunction.asfoundstatusicon_np;
			var enabledFlag = true;
			var isAFALEditable = this.validateWorkOrderStatus(eventContext);
			// No Adjustment Made should only be available to Calibration Points
			if(!curAssetFunction.calpoint) {
				eventContext.setVisibility(false);
				return;
			}
			if(curStatus && curStatus == 'PASS' && curAssetFunction['noadjmadechoice1'] ){
				var pointSet = this.application.getResource('dataSheetResource.calibrationpointlist');
				for(var i = 0; i < pointSet.data.length; i++) {
					var point = pointSet.getRecordAt(i);
					if(point.instrseq == curAssetFunction.instrseq) {
						// check if there is any asleft values
						if( !curAssetFunction.noadjmade && !point['isaverage'] &&
								((curAssetFunction.plantype == 'DISCRETE' && !point.isNull('asleftsetpoint')) || 
								(curAssetFunction.plantype == 'ANALOG' && (!point.isNull('asleftinput') || !point.isNull('asleftoutput')))) ) {
							enabledFlag = false;
							break;
						}
					}
				}
			} 
			else {
				enabledFlag = false;
			}
			
			eventContext.setEnabled(enabledFlag);
			
			if(!isAFALEditable){
				eventContext.editable = false;
				eventContext._setReadOnly(true);
			} else {
				eventContext.editable = enabledFlag;
				eventContext._setReadOnly(!enabledFlag);	
			}
			
		},
		
		noDSConfigException: null,
		
		handleException: function(eventContext, exception) {
			var self = this;
			switch(exception.messageKey) {
				case 'noDSConfig':
					if(!this.noDSConfigException) {
						this.noDSConfigException = exception;
						var msg = MessageService.createStaticMessage(exception.messageKey);
						eventContext.application.showMessage(msg.getMessage(), function() {
							self.ui.getCurrentViewControl().footerButtons[0].setEnabled(false);
							self.noDSConfigException = null;
						});
					}
					eventContext.exception = null;
					break;
				default:
					throw exception;
			}
		},
		
		setAsFoundStatuses: function(eventContext){
			this._setStatuses(eventContext, 'asfound');
		},
		setAsLeftStatuses: function(eventContext){
			this._setStatuses(eventContext, 'asleft');
		},
		_setStatuses: function(eventContext, prefix){
			/* If the asset function has a status set, each time the user leaves the 
			 * calibration points list screen (as found or as left), we will recalculate the asset 
			 * function/data sheet status (and show the message).  if the user makes a calibration 
			 * point incomplete, the asset function/data sheet status will be cleared and no message 
			 * is displayed. */

			// kick out if complete readings was just clicked
			if(eventContext.viewControl['_completereadingsclicked'] == true){
				delete eventContext.viewControl['_completereadingsclicked'];
				return;
			}
			
			// if asset function has a status, complete readings has been hit at least once so we should
			// redo the asset function and data sheet status (in case the points have been changed). 
			// if the points are not complete we need to clear out the statuses
			var afSet = this.application.getResource('dataSheetResource.assetfunctionlist');
			var af = afSet.getCurrentRecord();
			if (af.caldynamic == false){
				var ds = this.application.getResource('dataSheetResource').getCurrentRecord();
				var pointSet = ds.calibrationpointlist;
				// check if readings are complete OR if it is a repeatable we need to be prepared to cleanup 
				// average and standard deviation in the average record case any point has been cleaned up
				if (!af.isNull(prefix+'calstatus') || af.repeatable){
					var complete = false;
					if (af.calpoint == true){ // calibration points
						if(af.repeatable) {
							var point = pointSet.getCurrentRecord();
							pointSet.clearFilterAndSort();
							CalibrationPointObject.filterOutRepeatableCalPointList(pointSet);
			            	complete = CalibrationPointObject.areGroupCalPointsComplete(pointSet, prefix, af);
			            	pointSet.setCurrentIndexByRecord(point);
						}
						else {
							complete = CalibrationPointObject.areCalPointsComplete(pointSet, prefix);
						}
					}else{	// function checks
						complete = CalibrationPointObject.areFunctionChecksComplete(pointSet, prefix);
					}
					if(complete){
						this._completeReadings(eventContext, prefix, false);
					}
					else {
						var domainCalStatus = eventContext.application.getResource('domaincalstatus');
						// clear the af and ds statuses
						if(AssetFunctionObject._isMissingOrBroken(af, prefix, domainCalStatus) || DataSheetObject._isMissingOrBroken(ds, prefix, domainCalStatus)) {
							return;
						}
						else {
							// if repeatable we need to clear the average and std dev fields
							if(af.repeatable) {
								var stdDevPrefix = prefix == 'asfound' ? 'asf' : 'asl';
								var point = pointSet.getCurrentRecord();
								if(af.plantype == 'ANALOG') {
									point.setNullValue(prefix + 'input');
									point.setNullValue(prefix + 'output');
									point.setNullValue(stdDevPrefix + 'inputstddev');
									point.setNullValue(stdDevPrefix + 'outputstddev');
								}
								else {
									point.setNullValue(prefix + 'setpoint');
									point.setNullValue(stdDevPrefix + 'setptstddev');
								}
								point.setNullValue(prefix+'statusicon');
								point.setNullValue(prefix+'status');
								point.setNullValue(prefix+'statusdesc');
								point.setNullValue(prefix+'outerror');
							}
							af.setNullValue(prefix + 'calstatus');// af has a listener to set icon and desc on change
							// clear ds status if the af status is cleared
							ds.setNullValue(prefix + 'calstatus');
							DataSheetObject.setDataSheetStatusNPFields(ds, null, prefix);
						}
					}
				}else{
					// set error count on asset function for cal points and func checks
					this._setAssetFunctionErrorCount(af, pointSet, prefix);
				}
			}
		},
		
		_setAssetFunctionErrorCount: function(af, pointSet, prefix){
			var assetErrors = 0;
			for(var i = 0; i < pointSet.count(); i++) {
				var point = pointSet.getRecordAt(i);
				if(point && (point[prefix + 'error'] == true || point[prefix + 'fail'] == true)){
					assetErrors ++;
				}
			}
			af.set(prefix + 'error', assetErrors);
		},

		checkEmptyCalibrationPointList: function(eventContext) {
			var calpoints = this.application.getResource('dataSheetResource.calibrationpointlist');
			
			if(!calpoints.count()) {
				throw new PlatformRuntimeWarning('emptyCalPointList');
			}
		},
		
		repeatable: function(eventContext){
			var functionlist = this.application.getResource('dataSheetResource.assetfunctionlist');
			var record = functionlist.getCurrentRecord();
			var isRepeatable = record.get('repeatable');
			return isRepeatable;
		},
		
		showRepeatable : function(eventContext){
			eventContext.setDisplay(this.repeatable(eventContext));
		},
		
		showNonRepeatable : function(eventContext){
			eventContext.setDisplay(!this.repeatable(eventContext));
		},
		
		handleBackButtonClickFromRepeatable : function(eventContext){
			
			var handler = eventContext.application['application.handlers.CalibrationPointHandler'];
			
			if(handler.getPointErrorFlag(eventContext) && eventContext.id !== 'WorkExecution.CalibrationPointDetail'){
				eventContext.application.showMessage(MessageService.createResolvedMessage('tolerancelimit'));
				return;
			}
			
			if(handler.repeatable(eventContext)){
				handler.filterAverageCalibrationPointsList(eventContext);
				eventContext.ui.hideCurrentView();
			} else {
				eventContext.ui.hideCurrentView();
			}
		},
		
		filterAverageCalibrationPointsList:  function(eventContext) {
			var calpoints = this.application.getResource('dataSheetResource.calibrationpointlist');
			var assetFuncRecord = this.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord(); 
			
			calpoints.clearFilterAndSort();
			calpoints.filter('isaverage == $1', true);
			if (assetFuncRecord && assetFuncRecord.assetfunction){
				calpoints.filter('instrseq == $1', assetFuncRecord.instrseq);
			}
			return;
		},
		
		ensureRecordFocus: function(eventContext) {
			eventContext.ensureRecordFocus();
		},
		
		clearCalStatusFilter: function(eventContext) {
			var lookupResource = eventContext.application.getResource('domaincalstatus');
			lookupResource.clearFilterAndSort();
		},
		
		
		/**
		 * Validates Unit of Measure for all records on the Dynamic Checks view
		 */
		validateUnitMeasureDynamicView: function(eventContext, currentField){
			var deferred = new Deferred();
			var dyn_point = this.application.getResource('dataSheetResource.calibrationpointlist');
			var units = [];
			
			arrayUtil.forEach(dyn_point.data, function(dyn_point){
				if(!currentField){
					currentField = eventContext.resourceAttribute;
				}
				var dynamic_lookup_unit = dyn_point.getPendingOrOriginalValue(currentField);
				if(!dynamic_lookup_unit){
					return;
				}
				if(arrayUtil.indexOf(units, dynamic_lookup_unit) == -1){
					units.push(dynamic_lookup_unit);
				}
			});
			var unitFilter = [];
			arrayUtil.forEach(units, function(unit){
				unitFilter.push({'value' : unit});
			});
			ModelService.filtered("domainCalDynamcUnit", null, unitFilter, null, false, true, null, true).then(function(domainCalDynamcUnit){				
				if(domainCalDynamcUnit.count() != units.length){
					eventContext.application.showMessage(MessageService.createStaticMessage('invalidDynamicUnit').getMessage());
					deferred.resolve(true);
				}
				else{
					deferred.resolve(false);
				}
			}).otherwise(function(){
					deferred.resolve(true);
			});
			return deferred.promise;
		},
		
		/**
		 * Processed when Back is clicked on View or Complete Button is clicked on Dynamic Check view.
		 */
		validateUnitMeasureDynamicViewCompleteBack : function(eventContext){
			var handler = eventContext.application['application.handlers.CalibrationPointHandler'];
			var viewId = eventContext.ui.getCurrentViewControl().id.toLowerCase();
			var prefix = viewId.indexOf("asleft")>-1 ? 'asleft' : 'asfound';
			
			handler.validateUnitMeasureDynamicView(eventContext, prefix+'unit').then(function(hasError){
				if(hasError==false){
					eventContext.ui.hideCurrentView();
				}
			});
		},
		
		//Called at backButton. CompleteReadings
		//Check all points to see if they calculated without error for digitLimit
		getPointErrorFlag: function(eventContext){
			var pointSet = eventContext.application.getResource('dataSheetResource.calibrationpointlist');
			for(var i = 0; i <pointSet.data.length;i++ )
				if(pointSet.data[i].invalidValueFound === true)
					return true;
			
			return false;
		},
		
		handleBackfromGroupPoints: function(eventContext){
			var handler = eventContext.application['application.handlers.CalibrationPointHandler'];
			
			if(handler.getPointErrorFlag(eventContext) && eventContext.id !== 'WorkExecution.CalibrationPointDetail'){
				eventContext.application.showMessage(MessageService.createResolvedMessage('tolerancelimit'));
				return;
			}else{
				eventContext.ui.hideCurrentView();
			}
		}
		
	});
});
