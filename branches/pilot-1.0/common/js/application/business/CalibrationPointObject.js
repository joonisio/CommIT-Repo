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

define("application/business/CalibrationPointObject", 
		["dojo/_base/array",
		 "platform/model/ModelService",
		 "application/business/calibration/DataSheetCalculation",
		 "platform/format/FormatterService",
		 "platform/exception/PlatformRuntimeException",
		 "platform/translation/SynonymDomain",], 
function(arrayUtil, ModelService, DataSheetCalculation, FormatterService, PlatformRuntimeException, SynonymDomain) {
	
	var DataSheetObject = null;
	require(["application/business/DataSheetObject"], function(dataSheetObj) {
		DataSheetObject = dataSheetObj;
	});
	
	return {
		
		calibrationpoint: null,
		calStatusDomain: null,
		locale: (WL && WL.App && WL.App.getDeviceLocale() || 'en-US'),
		
/**@memberOf application.business.CalibrationPointObject */
		onInitialize : function(point) {
			
			//fixes issue with datasheet count on wodetail view
			if(point.getOwner() && point.getOwner().name == 'calibrationPointResourceMax'){
				return;
			}
			
			var dataSheet = point.getParent();
			var result = dataSheet.assetfunctionlist.find('instrseq == ' + point.instrseq);
			this.setDisplayAndLocalValues(point, result.length > 0 ? result[0] : null);
		},

		setDisplayAndLocalValues: function(point, assetFunction){
			if(assetFunction){
				point.set('assetfunction', assetFunction['assetfunction']); 
				point.set('assetfunctiondesc', assetFunction['description']);

				// from PlusCWODSPoint: 
				point.set('instroutrangeeu_np', assetFunction['instroutrangeeu']); 
				point.set('instrcalrangeeua_np', assetFunction['instrcalrangeeu']); 
				point.set('instrcalrangeeud_np', assetFunction['instrcalrangeeu']);
				// if plantype=analog, point.instrAsseteu=instroutrangeeu
				if (point.plantype == "ANALOG"){
					point.set('instrasseteu_np', assetFunction['instroutrangeeu']); 
				}
				// if plantype=discrete, point.instrAsseteu=instrcalrangeeu
				else if (point.plantype == "DISCRETE"){
					point.set('instrasseteu_np', assetFunction['instrcalrangeeu']); 
				}				
				// point.processeu=instr.processeu
				point.set('processeu_np', assetFunction['processeu']); 
			}
			// set non-persistent tolerance fields (use PLUSCWODSCONFIG for display params)
			this._setFieldForDisplay(point, 'asfoundtol1lworig', 'asfoundtol1lower_np');
			this._setFieldForDisplay(point, 'asfoundtol1uporig', 'asfoundtol1upper_np');
			this._setFieldForDisplay(point, 'aslefttol1lworig', 'aslefttol1lower_np');
			this._setFieldForDisplay(point, 'aslefttol1uporig', 'aslefttol1upper_np');

			this._setFieldForDisplay(point, 'asfoundtol2lworig', 'asfoundtol2lower_np');
			this._setFieldForDisplay(point, 'asfoundtol2uporig', 'asfoundtol2upper_np');
			this._setFieldForDisplay(point, 'aslefttol2lworig', 'aslefttol2lower_np');
			this._setFieldForDisplay(point, 'aslefttol2uporig', 'aslefttol2upper_np');

			this._setFieldForDisplay(point, 'asfoundtol3lworig', 'asfoundtol3lower_np');
			this._setFieldForDisplay(point, 'asfoundtol3uporig', 'asfoundtol3upper_np');
			this._setFieldForDisplay(point, 'aslefttol3lworig', 'aslefttol3lower_np');
			this._setFieldForDisplay(point, 'aslefttol3uporig', 'aslefttol3upper_np');

			this._setFieldForDisplay(point, 'asfoundtol4lworig', 'asfoundtol4lower_np');
			this._setFieldForDisplay(point, 'asfoundtol4uporig', 'asfoundtol4upper_np');
			this._setFieldForDisplay(point, 'aslefttol4lworig', 'aslefttol4lower_np');
			this._setFieldForDisplay(point, 'aslefttol4uporig', 'aslefttol4upper_np');
			//Copy maximo data to diplay attributes
			point.set("asfoundsetpoint_local", point.asfoundsetpoint); 
			point.set("asfoundinput_local", point.asfoundinput);
			point.set("asfoundoutput_local", point.asfoundoutput); 
			//point.set("inputvalue_local", point.inputvalue); 
			//point.set("outputvalue_local", point.outputvalu); 
			point.set("setpointvalue_local", point.setpointvalue);
			point.set( "asleftinput_local", point.asleftinput); 
			point.set("asleftoutput_local", point.asleftoutput); 
			point.set("asleftsetpoint_local", point.asleftsetpoint); 
			
		},

		// set padding, decimal points, truncation, etc. on field
		_setFieldForDisplay: function(point, sourceField, targetField){
			// get field config data from PLUSCWODSCONFIG
			var config = this._getFieldConfig(point.dsplannum);
			var formattedValue = point[sourceField];
			if (config){
				// TODO format formattedValue
			}
			
			// set non-persistent field
			point.set(targetField, formattedValue);
		},

		_getFieldConfig: function(dsplannum){
			
		},

		onAdd: function(point) {
		},
		
		beforeSave : function(point) {
		},
		
		performCalculation: function(prefix) {
			var instr = this.getAssetFunction();
			if(!instr.repeatable) {
				var calc = new DataSheetCalculation(DataSheetObject.getRelatedDSConfig());
				return calc.calculateTolForAnalogOrDiscrete(prefix, this);
			}
			return null;
		},
		
		performCalculationForRepeatables: function(prefix, points) {
			var avgpoint = this._getCalibrationAverageRecord(points);
			this.setCalibrationPoint(avgpoint);
			var calc = new DataSheetCalculation(DataSheetObject.getRelatedDSConfig());
			calc.calculateAvgAndStdDeviation(prefix, points, avgpoint);
			calc.calculateTolForAnalogOrDiscrete(prefix, this);
			this.filterOutRepeatableCalPointList(points);
			return avgpoint;
		},
		
		_getCalibrationAverageRecord: function(pointSet) {
			var point = pointSet.getCurrentRecord();
			pointSet.clearFilterAndSort();
			
			var result = null;
			
			if (point.wonum==null){
				if(point.revisionnum==null){
					result = pointSet.find('dsplannum == $1 && instrseq == $2 && point == $3 && isaverage == true',
							point.dsplannum, point.instrseq, point.point);
					pointSet.filter('dsplannum == $1 && instrseq == $2 && point == $3 && isaverage == false',
							point.dsplannum, point.instrseq, point.point);
				}else {
					result = pointSet.find('dsplannum == $1 && revisionnum == $2 && instrseq == $3 && point == $4 && isaverage == true',
							point.dsplannum, point.revisionnum, point.instrseq, point.point);
					pointSet.filter('dsplannum == $1 && revisionnum == $2 && instrseq == $3 && point == $4 && isaverage == false',
							point.dsplannum, point.revisionnum, point.instrseq, point.point);					
				}

			} else {
				result = pointSet.find('wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6 && isaverage == true',
						point.wonum, point.siteid, point.dsplannum, point.revisionnum, point.instrseq, point.point);
				pointSet.filter('wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6 && isaverage == false',
						point.wonum, point.siteid, point.dsplannum, point.revisionnum, point.instrseq, point.point);
			}
			
			
			return result[0];
		},
		
		setAverageAsCurrentRecord: function(pointSet, onlyAverage) {
			/* Set Calibration Point Average record as current in the set.
			 * If 'onlyAverage' = true, then the set will be filtered to keep only the Average record.
			 * Otherwise it will include all the calibration points (average and repeatable).
			 */
			var point = pointSet.getCurrentRecord();
			pointSet.clearFilterAndSort();
			var filter = 'wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6';
			//var result = pointSet.find(filter +  ' && isaverage == true', point.wonum, point.siteid, point.dsplannum, point.revisionnum, point.instrseq, point.point);
			if(onlyAverage) {
				filter += ' && isaverage == true';
			}
			pointSet.filter(filter, point.wonum, point.siteid, point.dsplannum, point.revisionnum, point.instrseq, point.point);
			if(!onlyAverage) {
				// we have repeatable records in the set, need look for average record and set as current index
				var point = pointSet.getRecordAt(0);
				while(point != null && !point.isaverage) {
					point = pointSet.next();
				}
			}
			return pointSet;
		},
		
		filterOutRepeatableCalPointList: function(pointSet) {
			var point = pointSet.getCurrentRecord();
			pointSet.clearFilterAndSort();
			
			if(point.wonum==null){
				if(point.revisionnum == null){
					var filter = 'dsplannum == $1 && instrseq == $2 && isaverage == true';
					pointSet.filter(filter, point.dsplannum, point.instrseq);					
				} else {
					var filter = 'dsplannum == $1 && revisionnum == $2 && instrseq == $3 && isaverage == true';
					pointSet.filter(filter, point.dsplannum, point.revisionnum, point.instrseq);
				}

			} else {
				var filter = 'wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && isaverage == true';
				pointSet.filter(filter, point.wonum, point.siteid, point.dsplannum, point.revisionnum, point.instrseq);
			}
			
		},
		
		filterRepeatableRecords: function(pointSet) {
			var point = pointSet.getCurrentRecord();
			pointSet.clearFilterAndSort();
			var filter = 'wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6 && isaverage == false';
			pointSet.filter(filter, point.wonum, point.siteid, point.dsplannum, point.revisionnum, point.instrseq, point.point);
			return pointSet;
		},
		
		calculateInitialStatus: function(prefix, pointSet){
			var calc = new DataSheetCalculation(DataSheetObject.getRelatedDSConfig());
			var p = pointSet.getRecordAt(0);
			var dsheet = p.getParent();
			var instr = dsheet.assetfunctionlist.find('instrseq == ' + p.get('instrseq'))[0];
			var calstatus = this.calStatusDomain;
			for (var i = 0; i < pointSet.count(); i++){
				point = pointSet.getRecordAt(i);
				calc.calculateInitialStatus(prefix, point, instr, calstatus);
			}
				
		},
		
		isInputWithinRange: function(label, inputValue) {
			var result = {'validate': true, 'messageKey': null, 'params':[]};
			
			if(inputValue && inputValue != '') {
				var instr = this.getAssetFunction();
				var point = this.calibrationpoint;
				var dscalc = new DataSheetCalculation(null);
				inputValue = dscalc.fromDisplayableValue(inputValue, 'double');
				var ron1lower = dscalc.fromDisplayableValue(point.get('ron1lower'), 'double');
				var ron1upper = dscalc.fromDisplayableValue(point.get('ron1upper'), 'double');
				var rightRon1Lower = ron1lower;
				var rightRon1Upper = ron1upper;
				if(rightRon1Lower && rightRon1Upper) {
					if ((ron1lower - ron1upper) > 0) {
						rightRon1Lower = ron1upper;
						rightRon1Upper = ron1lower;
					}
					if (inputValue < rightRon1Lower || inputValue > rightRon1Upper) {
						result.validate = false;
						result.messageKey = 'limitClipsInValidation';
						result.params = [label + ' ' + inputValue, ron1lower, ron1upper];
					}
				}
				// clipped limits
				if (inputValue && instr.get("cliplimitsin")) {
					var instrCalRangeFrom = dscalc.fromDisplayableValue(instr.get("instrcalrangefrom"), 'double');
					var instrCalRangeTo = dscalc.fromDisplayableValue(instr.get("instrcalrangeto"), 'double');
					var lowerRangeLimit = (instrCalRangeFrom <= instrCalRangeTo) ? instrCalRangeFrom : instrCalRangeTo;
					var upperRangeLimit = (instrCalRangeFrom > instrCalRangeTo) ? instrCalRangeFrom : instrCalRangeTo;
					if ((inputValue < lowerRangeLimit) || (inputValue > upperRangeLimit)) {
						result.validate = false;
						result.messageKey = 'limitClipsInValidation';
						result.params = [label + ' ' + inputValue, instrCalRangeFrom, instrCalRangeTo];
					}
				}
			}
			return result;
		},
		
		clearAttributes: function(sPrefix) {
			var attributesToClear = ['statusicon', 'statusdesc','status','pass', 'fail',
			                         'error1','error2', 'error3', 'error4', 'outerror', 'proerror',
			                         'tol1lworig', 'tol2lworig', 'tol3lworig','tol4lworig',
			                         'tol1uporig', 'tol2uporig', 'tol3uporig', 'tol4uporig',
			                         'tol1lower', 'tol2lower', 'tol3lower', 'tol4lower',
			                         'tol1upper', 'tol2upper', 'tol3upper', 'tol4upper'];
			
			for(var i = 0; i < attributesToClear.length; i++)
				this.calibrationpoint.setNullValue(sPrefix + attributesToClear[i]);
			
			//Setting this to false since the business logic always expects a boolean
			this.calibrationpoint.set(sPrefix + 'error', false)
			this.calibrationpoint._isChanged = false;
			var changedAttribute = this.calibrationpoint.__changedAttributes;
			for (var attribute in changedAttribute)
				if(attribute.indexOf(sPrefix) > -1 && attributesToClear.indexOf(attribute.replace(sPrefix, '')) > -1)
					delete changedAttribute[attribute];			
			
			return this.calibrationpoint;
			
		},
		
		setCalibrationPoint: function(point) {
			this.calibrationpoint = point;
		},
		
		getCalibrationPoint: function() {
			return this.calibrationpoint;
		},
		
		isAnalog: function() {
			return this.calibrationpoint.plantype == 'ANALOG';
		},
		
		isDiscrete: function() {
			return this.calibrationpoint.plantype == 'DISCRETE';
		},
		
		getAssetFunction: function() {
			var point = this.calibrationpoint;
			var dataSheet = point.getParent();
			var result = dataSheet.assetfunctionlist.find('instrseq == ' + point.get('instrseq'));
			return result[0]; 
		}, 
		
		setCalStatusDomain: function(calStatusDomain) {
			this.calStatusDomain = calStatusDomain;
		},
		
		getCalStatusDomain: function() {
			return this.calStatusDomain;
		},
		
		// loop through points to see if all of the checks are valid - reading is complete
		areFunctionChecksComplete: function(pointSet, prefix){
			var complete = true;
			var point = null;
			if (prefix != null){
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					if(!this.isFuncCheckValid(point, prefix)){	// neither has been clicked
						complete = false;
						break;
					}
				}
			}
			return complete;
		},

		areDynamicChecksComplete: function(pointSet, prefix){
			var complete = true;
			var point = null;
			if (prefix != null){
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					if(!this.isDynCheckValid(point, prefix)){
						complete = false;
						break;
					}
				}
			}
			return complete;
		},
		
		// validate a group of cal points based on asset funcion
		areGroupCalPointsComplete: function(pointSet, prefix, assetFunction){
			var complete = true;
			var point = null;
			var assetfunc = assetFunction.assetfunction;
			if (prefix != null){
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					if(assetfunc === point.assetfunction && !this.isCalPointValid(point, prefix)){
						complete = false;
						break;
					}
				}
			}
			return complete;
		},
		
		areCalPointsComplete: function(pointSet, prefix){
			var complete = true;
			var point = null;
			if (prefix != null){
				for(var i = 0; i < pointSet.count(); i++) {
					point = pointSet.getRecordAt(i);
					if(!this.isCalPointValid(point, prefix)){
						complete = false;
						break;
					}
				}
			}
			return complete;
		},

		// check to see if there are any valid points in a pointSet, i.e.
		// the asfound/asleft input AND output have been entered for analog calpoint,
		// the setpoint is entered for discrete calpoint, the input and unit for 
		// dynamic check, and the pass or fail for a function check
		anyValidCalibrationPoints: function(assetFunction, pointSet, prefix){
			var valid = false;
			if (prefix != null){
				for(var i = 0; i < pointSet.count(); i++) {
					var point = pointSet.getRecordAt(i);
					if(this.isPointValid(assetFunction, point, prefix)){
						valid = true;
						break;
					}
				}
			}
			return valid;
		},

		// check if the point has the correct values set to be considered a valid point
		isPointValid: function(assetFunction, point, prefix){
			var valid = false;
			if (assetFunction.calpoint == true){
				valid = this.isCalPointValid(point, prefix);
			}
			else if (assetFunction.calfunction == true){
				valid = this.isFuncCheckValid(point, prefix);
			}
			else if (assetFunction.caldynamic == true){
				valid = this.isDynCheckValid(point, prefix);
			}
			return valid;
		},

		isCalPointValid: function(point, prefix){
			// calpoint - analog has asfound/asleft input and output, discrete has asfound/asleft setpoint
			if( (!point.isNull(prefix + 'input') && !point.isNull(prefix + 'output')) 
					|| !point.isNull(prefix + 'setpoint')){
				return true;
			}
			return false;
		},
		
		isDynCheckValid: function(point, prefix){
			// caldynamic - has asfound/asleft input and unit
			if(!point.isNull(prefix + 'input') && !point.isNull(prefix + 'unit')){
				return true;
			}
			return false;
		},
		
		isFuncCheckValid: function(point, prefix){
			// calfunction - has asfound/asleft pass or fail
			if(point.get(prefix + 'pass') == true || point.get(prefix + 'fail') == true){	// one has been clicked
				return true;
			}
			return false;
		},
		
		checkMissingOrBroken: function(ds, instr, pointSet, prefix, domainCalStatus) {
			var dsstatus = SynonymDomain.resolveToInternal(domainCalStatus, ds.get(prefix + 'calstatus'));
			var instrstatus = SynonymDomain.resolveToInternal(domainCalStatus, instr.get(prefix + 'calstatus'));
			var dsMissingOrBroken = dsstatus == 'MISSING' || dsstatus == 'BROKEN';
			var instrMissingOrBroken = instrstatus == 'MISSING' || instrstatus == 'BROKEN';
			return (dsMissingOrBroken || instrMissingOrBroken);
		},
		
		noAdjMadeAction: function(point, newAdjust) {
			// checked
			if(newAdjust) {
				if(point.plantype == 'DISCRETE') {
					point.set('asleftsetpoint', point.asfoundsetpoint);
					point.set('asleftsetpoint_local', point['asfoundsetpoint'].replace(window.anywhere_locale_seperator, '.'));
	            }
	            else {
	                point.set('asleftinput', point.asfoundinput);
	                point.set('asleftinput_local', point['asfoundinput'].replace(window.anywhere_locale_seperator, '.'));
                    point.set('asleftoutput_local', point['asfoundoutput'].replace(window.anywhere_locale_seperator, '.'));
	                point.set('asleftoutput', point.asfoundoutput);
				}
			}
			// unchecked
			else {
				if(point.plantype == 'DISCRETE') {
					point.setNullValue("asleftsetpoint");
					point.setNullValue("asleftsetpoint_local");
					point.setNullValue("aslefterror1");
					point.setNullValue("aslefterror2");
					point.setNullValue("aslefterror3");
					point.setNullValue("aslefterror4");
                }
                else {
                    point.setNullValue("asleftinput");
                    point.setNullValue("asleftinput_local");
                    point.setNullValue("asleftoutput");
                    point.setNullValue("asleftoutput_local");
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
			}
			
		}
	};
});
