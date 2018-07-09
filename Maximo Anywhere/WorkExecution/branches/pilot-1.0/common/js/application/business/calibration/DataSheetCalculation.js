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

define("application/business/calibration/DataSheetCalculation", 
		["exports",
		 "dojo/_base/array",
		 "dojo/_base/lang",
		 "dojo/_base/declare",
		 "dojo/number",
		 "platform/exception/PlatformRuntimeException",
		 "platform/format/FormatterService",
		 "platform/translation/SynonymDomain",
		 "application/business/util/DecimalCalculator",
		 "application/business/calibration/_SumToleranceTypesMixin",
		 "application/business/calibration/_StandardDeviationMixin",
		 "application/business/calibration/_NumberFormatterMixin",
		 "platform/logging/Logger"], 
function(thisModule, arrayUtil, lang, declare, NumberUtil, PlatformRuntimeException, FormatterService, SynonymDomain, DecimalCalculator, SumToleranceTypesMixin, StandardDeviationMixin, _NumberFormatter, Logger) {
	
	var AssetFunctionObject = null;
	require(["application/business/AssetFunctionObject"], function(assetFuncObj) {
		 AssetFunctionObject = assetFuncObj;
	});
	
	var classbody = {
		
		status: {
			PASS: 'PASS',
			WARNING: 'WARNING',
			FAIL: 'FAIL'
		},
		calstatus: null,
		dsconfig: null,
		locale: (WL && WL.App && WL.App.getDeviceLocale() || 'en-US'),
		decimal_seperator: null,
		constructor: function(dsconfig) {
			this.dsconfig = dsconfig;
		},
		
/**@memberOf application.business.calibration.DataSheetCalculation */
		_clearAttributes: function(sPrefix, point) {
			point.setNullValue(sPrefix + 'statusicon');
			point.setNullValue(sPrefix + 'statusdesc');
			point.setNullValue(sPrefix + 'status');
			point.setNullValue(sPrefix + 'pass');
			point.setNullValue(sPrefix + 'fail');
			point.setNullValue(sPrefix + 'error1');
			point.setNullValue(sPrefix + 'error2');
			point.setNullValue(sPrefix + 'error3');
			point.setNullValue(sPrefix + 'error4');
			point.setNullValue(sPrefix + 'outerror');
			point.setNullValue(sPrefix + 'proerror');

			
		},
		
		checkValueLength: function(point, value){
			if((value && value.toString().length>15) || (value && this.decimalPlacesOf(value)>10))
				point['invalidValueFound'] = !!(point['invalidValueFound'] | true);
			else
				point['invalidValueFound'] = !!(point['invalidValueFound'] | false);

		},
		
		reducePlacesforFieldLength: function(value, options){
			var places = options.places;
			try{
				if(value.toString().indexOf('-') >-1 && value.toString().length>15 && places !== null){
					places = (places -1) < 0? places: places -1;
				}
			}catch(e){}
			return places;
		},
		
		calculateInitialStatus: function(sPrefix, point, instr, calstatus){
			
			if(!point[sPrefix + 'output'] || !point[sPrefix + 'input']){
				return
			}
			
			if (point.isNull(sPrefix + 'output') && !point.isNull(sPrefix + 'input') && !instr.nonlinear)
				return;
			
			var toleranceRoundOption = this._getRoundOption('toltruncate');
			
			this.calstatus = calstatus;
			
			var actualPrecision = {
					input: this.decimalPlacesOf(sPrefix == '' ? point.get('inputvalue') : point.get(sPrefix + 'input')),
					output: this.decimalPlacesOf(sPrefix == '' ? point.get('outputvalue') : point.get(sPrefix + 'output'))
			};

			var rightPrecision = this._getPointTolPrecision(point, instr, sPrefix, actualPrecision);


			var outputValue = new Number(0);
			if (point.plantype == 'DISCRETE') {
				outputValue = point.get(sPrefix + 'setpoint');
			} else {
				outputValue = point.get(sPrefix + 'output');
			}

			
			
			// Calculate tolerance errors
			this._calculateToleranceErrors(sPrefix, point, instr, outputValue, {places: rightPrecision, round: toleranceRoundOption});
			


		},
		
		calculateTolForAnalogOrDiscrete: function(sPrefix, pointObject) {
			//this._clearAttributes(sPrefix, pointObject.calibrationpoint);
			
			var isWithinTolerance = true;
			var toleranceRoundOption = this._getRoundOption('toltruncate');
			var assetRoundOption = this._getRoundOption('assettruncate');
			this.calstatus = pointObject.getCalStatusDomain();
			var instr = pointObject.getAssetFunction();
			var point = pointObject.calibrationpoint;
			point['invalidValueFound'] = false;
			//var minInputPrecision = instr.get('inputprecision');
			
//			if((!point[sPrefix + 'output'] && point._pendingValues[sPrefix + 'output'] && !instr.repeatable) || 
//					(point[sPrefix + 'output'] != point._pendingValues[sPrefix + 'output'] && !instr.repeatable)) {
//				point[sPrefix + 'output'] = point._pendingValues[sPrefix + 'output']; 
//			}  
			
			var minOutputPrecision = instr.get('outputprecision');
			if (point.plantype == 'DISCRETE') {
				minOutputPrecision = instr.get('inputprecision');
			} else {
				minOutputPrecision = instr.get('outputprecision');
			}
			var actualPrecision = {
					input: this.decimalPlacesOf(sPrefix == '' ? point.get('inputvalue') : point.get(sPrefix + 'input')),
					output: this.decimalPlacesOf(sPrefix == '' ? point.get('outputvalue') : point.get(sPrefix + 'output'))
			};
			
			var instrRange = {
					instrcalrangefrom: this.fromDisplayableValue(instr.get('instrcalrangefrom'), 'decimal'),
					instrcalrangeto: this.fromDisplayableValue(instr.get('instrcalrangeto'), 'decimal'),
					instroutrangefrom: this.fromDisplayableValue(instr.get('instroutrangefrom'), 'decimal'),
					instroutrangeto: this.fromDisplayableValue(instr.get('instroutrangeto'), 'decimal')
			};
			
			var attrs = this._getDirection(instrRange);
			var isOpposite = attrs.opposite;

			var inputValue = new Number(0);
			if (point.plantype == 'DISCRETE') {
				inputValue = point.get('setpointvalue');
			} else {
				inputValue = point.get(sPrefix + 'input');
			}

			var outputValue = new Number(0);
			if (point.plantype == 'DISCRETE') {
				outputValue = point.get(sPrefix + 'setpoint');
			} else {
				outputValue = point.get(sPrefix + 'output');
			}
			
			var rightPrecision = this._getPointTolPrecision(point, instr, sPrefix, actualPrecision);
			
			if(rightPrecision>10){
				rightPrecision = 10;
			}
			
			// Calculate tolerances
			if (instr.get("squareroot")) {
				this._calculateToleranceRangeSquareRoot(sPrefix, point, instr);
			} else if (instr.get("squared")){
				this._calculateToleranceRangeSquared(sPrefix, point, instr);
			} else{
				this._calculateTolerances(sPrefix, point, instr, instrRange, attrs, actualPrecision, {places: rightPrecision, round: toleranceRoundOption});
			}
			
			
			
			
			
			// Get the right precision for Asset.
			//rightPrecision = this._getAssetPrecision(minOutputPrecision, actualPrecision);
			
			// We can't calculate asset and process error if the input span is zero
			//Discrete asset error should be calculated irrespective.
			if(attrs['instrInputSpan'] == 0  && point.plantype != 'DISCRETE') {
				return false;
			}
			
			// Calculate Asset Error
			var assetError = this._calculateAssetError(sPrefix, point, instr, inputValue, outputValue, attrs, isOpposite, actualPrecision, {places: minOutputPrecision, round: assetRoundOption});
			
			// Process Asset Error
			if(assetError && assetError != '') {
				this._processAssetError(sPrefix, point, instr, inputValue, outputValue, attrs, isOpposite, assetError, actualPrecision, {places: minOutputPrecision, round: assetRoundOption});
			}
			
			//Do not calculate tolerance error and status if  only input was filled and is not nonlinear
			if (point.isNull(sPrefix + 'output') && !point.isNull(sPrefix + 'input') && !instr.nonlinear)
				return;
			
			// Calculate tolerance errors
			isWithinTolerance = this._calculateToleranceErrors(sPrefix, point, instr, outputValue, {places: rightPrecision, round: toleranceRoundOption});
			


			// if record is changed, clear asfound/asleft pass/fail (these are only set by function check validation)
			if (point._isChanged){
				point.set(sPrefix + 'fail', false);
				point.set(sPrefix + 'pass', false);
			}

			return isWithinTolerance;
		},
		
		/*General Workflow method to calculate desired ouput and other things when user enters a nominal intput
		 * Not to be used as desired output calculate api
		 */
		calculateDesiredOutputForNewAnalog: function(nominalInput, instr, point){
			
			var resultAttrs = {'inputvalue':null, 
								'outputvalue':null, 
								'ron1lower':null, 
								'ron1upper': null, 
								'rontype':null};
			
			var instrRange = {
					instrcalrangefrom: this.fromDisplayableValue(instr.get('instrcalrangefrom'), 'decimal'),
					instrcalrangeto: this.fromDisplayableValue(instr.get('instrcalrangeto'), 'decimal'),
					instroutrangefrom: this.fromDisplayableValue(instr.get('instroutrangefrom'), 'decimal'),
					instroutrangeto: this.fromDisplayableValue(instr.get('instroutrangeto'), 'decimal')
			};
			
			var attrs = this._getDirection(instrRange);
			
			var minInputFraction =  instr.get('inputprecision');
			var minOutputFraction = instr.get('outputprecision');
			
			var actualPrecision = {
					input: minInputFraction,
					output: this.decimalPlacesOf(point.get('outputvalue'))
			};
			
			//Calculate desired output
			//Desired output calculated only if its linear
			var desiredOutputValue = null;
			if(!instr.nonlinear)
			{
				desiredOutputValue =  this._calculateDesiredOutput(nominalInput, point, instr);
			
				//Format the desired output value
				var shouldRound = this._getRoundOption('outputtruncate');
				var options = {places: minOutputFraction, round: shouldRound};
				
				desiredOutputValue = this.toDisplayableValue(desiredOutputValue, 'decimal', options);
			}
			
			resultAttrs.outputvalue = desiredOutputValue;	
			point.set('outputvalue', resultAttrs.outputvalue);
			
			
			//Calculate range limit
			var rangeLimit = null;
			if(nominalInput && instr.ron1lowervalue && instr.ron1uppervalue && instr.ron1type)
			{
				rangeLimit = this._calculatePointRangeLimits(nominalInput, point, instr, instrRange);
			}
			
			if(rangeLimit)
			{
				point.set('ron1lower', rangeLimit.calcLimitLower);
				point.set('ron1upper', rangeLimit.calcLimitUpper);
				point.set('rontype', rangeLimit.rontype);
				
				resultAttrs.ron1lower = rangeLimit.calcLimitLower;
				resultAttrs.ron1upper = rangeLimit.calcLimitUpper;
				resultAttrs.rontype = rangeLimit.rontype;
			}
			
			var rightPrecision = this._getAssetPrecision(minOutputFraction, actualPrecision);
			this._calculateTolerances("", point, instr, instrRange, attrs, minOutputFraction, {places: rightPrecision , round: this._getRoundOption('toltruncate')}) 
			
			return resultAttrs;
			
		},
		
		_calculateSquareRootOutputValue: function(sign, asinputvalue, point, instr, instrRange){
			
			//var rightPrecision = instr.get('outputprecision')?
			//		parseInt(instr.get('outputprecision')):0;

			//var options = {places: rightPrecision, round: shouldRound};

			var resultSpan2 = instrRange['instroutrangeto'] - instrRange['instroutrangefrom'];
			if(sign == -1){
				
				return instrRange['instroutrangefrom'] - (Math.sqrt(asinputvalue / instrRange['instroutrangeto']) * resultSpan2);
				
			}else{
				var op_val = Math.sqrt(asinputvalue / instrRange['instrcalrangeto']) * resultSpan2 + instrRange['instroutrangefrom'];
				//We do this only for non negative square root if calculated from new point creation view.
				//Defect 205016
				if(point.newpoint)
					op_val = this.toDisplayableValue(op_val, 'decimal', {places: instr.get('outputprecision'), round: 0});

				return op_val;

			}
			
		},
		
		_calculateSquaredOutputValue: function(sign, asinputvalue, point, instr, instrRange){
			var signvalue = null;
			var exp = 2.0;
			
			var resultSpan1 = instrRange['instrcalrangeto'] - instrRange['instrcalrangefrom'];
			var resultSpan2 = instrRange['instroutrangeto'] - instrRange['instroutrangefrom'];
			
			if(sign == -1){
				signvalue = -1.0;
			}else{
				signvalue = 1.0;
			}
			
			var outputValue = signvalue * (Math.pow(((asinputvalue-instrRange['instrcalrangefrom'])/resultSpan1),exp)*resultSpan2) + instrRange['instroutrangefrom'];
			
			return outputValue;
			
		},
		
		/**
		 * Calculate the calibration points range limits based on the Nominal Input and the Range limits
		 * defined o the Asset Function. If the range limits are blank this function should not be called.
		 * @param asinputtvalue: Nominal input
		 * @param poin: point object
		 * @param instr: asset function object
		 * @param instrRange: dictionary conatainng instrcalrangefrom, instrcalrangeto, instroutrangefrom, instroutrangeto
		 * @return dictionary {ron1lower, ron1upper, rontype};
		 */
		_calculatePointRangeLimits: function(nominalInput, point, instr, instrRange){
			
			var asinputvalue = parseFloat(nominalInput);
			var rangeLimitLower = parseFloat(instr.ron1lowervalue);
			var rangeLimitUpper = parseFloat(instr.ron1uppervalue);
			var inputLower = instrRange['instrcalrangefrom'];
			var inputUpper = instrRange['instrcalrangeto'];
			var inputSpan = inputUpper - inputLower;
			var precision = instr.inputprecision;
			
			var toltype = instr.ron1type;
			
			var calcLimitLower = null;
			var calcLimitUpper = null;
			
			if(toltype == null)
				toltype = "";
			
			if(toltype == "EU"){
				
				calcLimitLower = asinputvalue + rangeLimitLower;
				calcLimitUpper = asinputvalue + rangeLimitUpper;
			
			}else if(toltype == "%SPAN"){
				
				calcLimitLower = asinputvalue + (inputSpan/100) * rangeLimitLower;
				calcLimitUpper = asinputvalue + (inputSpan/100) * rangeLimitUpper;
			
			}else if(toltype == "%URV"){
			
				calcLimitLower = asinputvalue + (Math.abs(inputUpper)/100) * rangeLimitLower;
				calcLimitUpper = asinputvalue + (Math.abs(inputUpper)/100) * rangeLimitUpper;
			
			}else if(toltype == "%READING"){
				
				calcLimitLower = asinputvalue + (Math.abs(asinputvalue)/100) * rangeLimitLower;
				calcLimitUpper = asinputvalue + (Math.abs(asinputvalue)/100) * rangeLimitUpper;
				
			}
			
			if(instr.cliplimits){
				calcLimitLower = Math.min(Math.max(calcLimitLower, inputLower), inputUpper);
				calcLimitUpper = Math.max(Math.min(calcLimitUpper, inputUpper), asinputvalue);
			}
			
			//TODO round and truncate as necessary.
			//DSCOnfig rangetruncate and precision
			var shouldRound = this._getRoundOption('rangetruncate');
			var options = {places: precision, round: shouldRound};
			
			calcLimitLower = this.toDisplayableValue(calcLimitLower, 'decimal', options);
			calcLimitUpper = this.toDisplayableValue(calcLimitUpper, 'decimal', options);
			
			return {'calcLimitLower': calcLimitLower, 'calcLimitUpper': calcLimitUpper, "rontype": toltype};
			
			
		},
		
		
		/**
		 * This method calculates the desired output for analog calibration point
		 * @param nominalInput: the nominalInput or inputValue given in "String datatype"
		 * @param point: pointObject
		 * @param instr: asset function object
		 * @param isLinear: if the asset function is linear
		 * @return  desiredOutputValue
		 * */
		_calculateDesiredOutput: function(nominalInput, point, instr){
			
			var instrRange = {
					instrcalrangefrom: this.fromDisplayableValue(instr.get('instrcalrangefrom'), 'decimal'),
					instrcalrangeto: this.fromDisplayableValue(instr.get('instrcalrangeto'), 'decimal'),
					instroutrangefrom: this.fromDisplayableValue(instr.get('instroutrangefrom'), 'decimal'),
					instroutrangeto: this.fromDisplayableValue(instr.get('instroutrangeto'), 'decimal')
			};
			var dattr = this._getDirection(instrRange);
			
			
            //Calculate vars required in the desired output formula
			var asinputvalue =  parseFloat(nominalInput);
			var resultSpan1 = instrRange['instrcalrangeto'] - instrRange['instrcalrangefrom'];
			var resultSpan2 = instrRange['instroutrangeto'] - instrRange['instroutrangefrom'];
			var desiredOutputValue = new Number(0);
			
			
				if(instr.squared || instr.squareroot){
					var negative_state = 1;
					if(nominalInput.charAt(0) == '-'){
						negative_state = -1;
					} else if(asinputvalue == 0)
						negative_state = 0;

					if(negative_state == 0)
					{
						desiredOutputValue = instrRange['instroutrangefrom'];
						
					}else if(instr.squared)
					{
						desiredOutputValue = this._calculateSquaredOutputValue(negative_state, asinputvalue, point, instr, instrRange)
						
					}else if(instr.squareroot){
						
						desiredOutputValue = this._calculateSquareRootOutputValue(negative_state, asinputvalue, point, instr, instrRange);
					}
				}
				else{
					
					if(dattr.opposite){
						
						desiredOutputValue = (asinputvalue - instrRange['instrcalrangefrom'])* (resultSpan2 / resultSpan1) + instrRange['instroutrangefrom'];
						
					}else{
						
						desiredOutputValue = instrRange['instroutrangefrom'] - ((asinputvalue - instrRange['instrcalrangefrom']) * ((instrRange['instroutrangefrom'] - instrRange['instroutrangeto']) / resultSpan1));
					}
				}
				
				return desiredOutputValue;
			
		},
		
		
		/*General square root formula used for all calculations
		 */
		_sqrtToleranceGeneral: function(iUpper, outputSpan, oLower, linearTol){
		
			var sign = linearTol < 0? -1: 1;
			return oLower + sign * Math.sqrt(Math.abs(linearTol) / iUpper) * outputSpan;
			
		},
		
		//SquarerootCalculation for Summed
		_sqrtToleranceSummed: function(i, iUpper, inputSpan, outputSpan, oLower, 
										sumTolEU, sumTolSpan, sumTolURV, sumTolReading, guardBand){
			
			var linearTol = i + sumTolEU 
							+ sumTolSpan * (inputSpan / 100) 
							+ sumTolURV * (Math.abs(iUpper) / 100) 
							+ sumTolReading * (Math.abs(i) / 100)
							+ guardBand;
			
			return this._sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
			
		},
		
		//Squareroot calculation for %READING
		_sqrtTolerancePercentReading: function(i, iUpper, outputSpan, oLower, tol, guardBand ){
			
			var linearTol = (i + tol * (Math.abs(i) / 100) + guardBand);
			return this._sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
			
		},
		
		//Squareroot calculation for %URV
		_sqrtTolerancePercentURV: function(i, iUpper, outputSpan, oLower, tol, guardBand){
			
			var lineartol = (i + tol * (Math.abs(iUpper) / 100) + guardBand);
			return this._sqrtToleranceGeneral(iUpper, outputSpan, oLower, lineartol);
		},
		
		//Squareroot calculation for %SPAN
		_sqrtTolerancePercentSpan: function(i, iUpper, inputSpan, outputSpan, oLower, tol, guardBand){
			var linearTol = (i + tol * (inputSpan / 100) + guardBand);
			return this._sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
			
		},
		
		//Squareroot calculation for EU
		_sqrtToleranceEU: function(i, iUpper, outputSpan, oLower, tol, guardBand){
			var linearTol = (i + tol + guardBand);
			return this._sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
		
		},
		
		_addGuardBand: function(instr, tolerance, tol, direction, doNotApplySpanRatio, spanRatio){
			
			if (this._hasGuardbandFields(instr, tol)) {
				
				var gb = parseFloat(instr.get("gb" + direction + tol))
						* (doNotApplySpanRatio ? 1 : spanRatio);
				var gbSign = instr.get("gbsumdirection" + tol) == "-" ? -1 : 1;

				return tolerance + (gbSign * gb);
				} 
				else {
					return tolerance;
				}
			
		},
		
		_hasGuardbandFields: function(instr, tol) {

			var isGBFromFilled = instr.get("gbfrom" + tol) == null?false: true;
			var isGBToFilled = instr.get("gbto" + tol) == null?false: true;
			var isSumDirFilled = instr.get("gbsumdirection" + tol) == null?false: true;

			if ((isGBFromFilled && (!isGBToFilled || !isSumDirFilled))
					|| (isGBToFilled && (!isGBFromFilled || !isSumDirFilled))
					|| (isSumDirFilled && (!isGBFromFilled || !isGBToFilled))
					|| (!isGBFromFilled && !isGBToFilled && !isSumDirFilled)

			) {

				return false;

			}
			
			return true;

		},
		
		
		_calculateToleranceRangeSquareRoot: function(sPrefix, point, instr){
			
			var toleranceLower = null;
			var toleranceUpper = null;
			
			var desiredOutputVal = 0.00;
			
			var instrRange = {
					instrcalrangefrom: this.fromDisplayableValue(instr.get('instrcalrangefrom'), 'decimal'),
					instrcalrangeto: this.fromDisplayableValue(instr.get('instrcalrangeto'), 'decimal'),
					instroutrangefrom: this.fromDisplayableValue(instr.get('instroutrangefrom'), 'decimal'),
					instroutrangeto: this.fromDisplayableValue(instr.get('instroutrangeto'), 'decimal')
			};
			
			
			var i = 0.00;
			var iLower = instrRange.instrcalrangefrom;
			var iUpper = instrRange.instrcalrangeto;
			var inputSpan = iUpper - iLower;
			var oLower = instrRange.instroutrangefrom;
			var oUpper = instrRange.instroutrangeto;
			var outputSpan = oUpper - oLower;
			
			
			var shouldRound = this._getRoundOption("TOLTRUNCATE");
			var precision = instr.get('outputprecision');
			
			var actualPrecision = {
					input: this.decimalPlacesOf(sPrefix == '' ? point.get('inputvalue') : point.get(sPrefix + 'input')),
					output: this.decimalPlacesOf(sPrefix == '' ? point.get('outputvalue') : point.get(sPrefix + 'output'))
			};
			var rightPrecision = this._getPointTolPrecision(point, instr, sPrefix, actualPrecision);
			var options = {places: rightPrecision, round: shouldRound};
			
			
			for(var tol = 1; tol < 5; tol++){
				
				var toltype = instr.get('tol' + tol + 'type');
				if(!toltype)
					toltype = null;
				
				var tolLower = 0.00;
				var tolUpper = 0.00;
				tolLower = instr.get('tol' + tol + 'lowervalue')? this.fromDisplayableValue(instr.get('tol' + tol + 'lowervalue'), 'decimal'): tolLower ;
				tolUpper = instr.get('tol' + tol + 'uppervalue')?this.fromDisplayableValue(instr.get('tol' + tol + 'uppervalue'), 'decimal'): tolUpper;
				
				
				//Set the desire output vlue
				if(sPrefix && sPrefix != '') {
					var asinputvalue = point.get(sPrefix + 'input')
					desiredOutputVal = this._calculateDesiredOutput(asinputvalue.toString(), point, instr);
					i =  parseFloat(point.get(sPrefix + 'input'));
				}
				else {
					//Watchout for issue. Possibly using the rounded displayeble version of output value.
					//Instead of full calculated precision which should ideally be the case.
					desiredOutputVal = parseFloat(point.get('outputvalue'));
					i =  parseFloat(point.get('inputvalue'));
				}
				
				var sqrtFrom = 0.00;
				var sqrtTo = 0.00;
				
				var calcSummedRDG = false;
				var calcSummedEU = false;
				var calcSummedSpan = false;
				var calcSummedURV = false;
				
				var toleranceLower = "";
				var toleranceUpper = "";
				
				
				//EU
				var sumEU = instr.get('tol' + tol + 'sumeu');
				if(!sumEU || sumEU == null || sumEU == ""){
					sumEU = "";
				} else {
					calcSummedEU = true;
				}
				
				//%READING
				var sumRead = instr.get('tol' + tol + 'sumread');
				if(!sumRead || sumRead == null || sumRead == ""){
					sumRead = "";
				} else {
					calcSummedRDG = true;
				}
				
				//%SPAN
				var sumSpan = instr.get('tol' + tol + 'sumspan');
				if(!sumSpan || sumSpan == null || sumSpan == ""){
					sumSpan = "";
				} else {
					calcSummedSpan = true;
				}
				
				//%URV
				var sumURV = instr.get('tol' + tol + 'sumurv');
				if(!sumURV || sumSpan == null || sumSpan == ""){
					sumURV = "";
				} else {
					calcSummedURV = true;
				}
				
				var exp = 2.0;
				
				//TODO: add guardband functionality
				var gbFrom = 0;
				var gbTo = 0;
				gbFrom = this._addGuardBand(instr, 0.00, tol, 'from', true, 0.00);
				gbTo = this._addGuardBand(instr, 0.00, tol, 'to', true, 0.00);
				var can_process= true;
				//If not summed tolerance
				if(!calcSummedEU && !calcSummedRDG && !calcSummedSpan && !calcSummedURV){
					var auxTolLower = "";
					var auxTolUpper = "";
					if(toltype != null ){
						if((toltype == "EU" || sumEU != "" )  && instr.plantype == 'ANALOG'){
							sqrtFrom = this._sqrtToleranceEU(i, iUpper, outputSpan, oLower, tolLower, gbFrom);
							sqrtTo = this._sqrtToleranceEU(i, iUpper, outputSpan, oLower, tolUpper, gbTo);
						} else if((toltype == '%SPAN' || sumSpan != "") && instr.plantype == 'ANALOG'){
							sqrtFrom = this._sqrtTolerancePercentSpan(i, iUpper,inputSpan, outputSpan, oLower, tolLower, gbFrom);
							sqrtTo = this._sqrtTolerancePercentSpan(i, iUpper,inputSpan, outputSpan, oLower, tolUpper, gbTo);	
						} else if((toltype == '%URV' || sumURV != "") && instr.plantype == 'ANALOG'){
							sqrtFrom = this._sqrtTolerancePercentURV(i, iUpper, outputSpan, oLower, tolLower, gbFrom);
							sqrtTo = this._sqrtTolerancePercentURV(i, iUpper, outputSpan, oLower, tolUpper, gbTo);	
						} else if((toltype == '%READING' || sumRead != "") &&  instr.plantype == 'ANALOG'){
							sqrtFrom = this._sqrtTolerancePercentReading(i, iUpper, outputSpan, oLower, tolLower, gbFrom);
							sqrtTo = this._sqrtTolerancePercentReading(i, iUpper, outputSpan, oLower, tolUpper, gbTo);	
						}
					}else{
						can_process = false;
					}
					
				}else{
					
					var summedTpDirectionBoth = false;
					var summedToDirectionPlus = false;
					var summedToDirectionMINUS = false;
					
					var sumTolEU = parseFloat(sumEU == ""? 0.00: sumEU);
					var sumTolSpan = parseFloat(sumSpan == ""? 0.00: sumSpan);
					var sumTolRead = parseFloat(sumRead == ""? 0.00: sumRead);
					var sumTolURV = parseFloat(sumURV == ""? 0.00: sumURV);
					
					var sumDirection = instr.get('tol' + tol + 'sumdirection');
					
					if(sumDirection == '+')
						summedToDirectionPlus = true;
					else if (sumDirection == '-')
						summedToDirectionMINUS = true;
					else if(sumDirection == '+/-')
						summedTpDirectionBoth = true;
					
					//Check to see if the input + tolearnce is negative when the tol is summed
					var sumSummedTol = sumTolEU + sumTolSpan + sumTolRead + sumTolURV;
					sumSummedTol = Math.sqrt(sumSummedTol);
					
					if(summedToDirectionMINUS || summedTpDirectionBoth){
						sqrtFrom = this._sqrtToleranceSummed(i, iUpper, inputSpan, outputSpan, oLower, parseFloat(-1 *sumTolEU), parseFloat(-1*sumTolSpan), parseFloat(-1*sumTolURV), parseFloat(-1*sumTolRead), parseFloat(-1*gbFrom))
					}else {
						sqrtFrom = desiredOutputVal;
					}
					
					if(summedToDirectionPlus || summedTpDirectionBoth)
						sqrtTo = this._sqrtToleranceSummed(i, iUpper, inputSpan, outputSpan, oLower, sumTolEU, sumTolSpan, sumTolURV, sumTolRead, gbTo);
					else
						sqrtTo = desiredOutputVal;
					
				}
				if(can_process){
					toleranceLower = this.toDisplayableValue(sqrtFrom, 'decimal', options);
					toleranceUpper = this.toDisplayableValue(sqrtTo, 'decimal', options);
					
					if(instr.cliplimits){
						var dtoleranceLower = Math.min(Math.max(toleranceLower, oLower), oUpper);
						var dtoleranceUpper = Math.max(Math.min(toleranceUpper, oUpper), oLower);
						
						toleranceLower = this.toDisplayableValue(dtoleranceLower, 'decimal', options);
						toleranceUpper = this.toDisplayableValue(dtoleranceUpper, 'decimal', options);
					}
					if( (toleranceLower && toleranceUpper) ||
							(toleranceLower != null && toleranceLower != NaN && toleranceUpper) ||
							(toleranceLower && toleranceUpper != null && toleranceUpper != NaN) ) {
						point.set(sPrefix + 'tol' + tol + 'lower', toleranceLower);
						point.set(sPrefix + 'tol' + tol + 'upper', toleranceUpper);
					}
					else {
						point.setNullValue(sPrefix + 'tol' + tol + 'lower');
						point.setNullValue(sPrefix + 'tol' + tol + 'upper');
					}
				}
			}
		},
		
		 //Squared Calculation for Reverse Flow Calibration
		_calculateToleranceRangeSquared: function(sPrefix, point, instr){
			
			var toleranceLower = null;
			var toleranceUpper = null;
			
			var desiredOutputVal = 0.00;
			
			var instrRange = {
					instrcalrangefrom: this.fromDisplayableValue(instr.get('instrcalrangefrom'), 'decimal'),
					instrcalrangeto: this.fromDisplayableValue(instr.get('instrcalrangeto'), 'decimal'),
					instroutrangefrom: this.fromDisplayableValue(instr.get('instroutrangefrom'), 'decimal'),
					instroutrangeto: this.fromDisplayableValue(instr.get('instroutrangeto'), 'decimal')
			};
			
			var asinputvalue = null;
			var iLower = instrRange.instrcalrangefrom;
			var iUpper = instrRange.instrcalrangeto;
			var inputSpan = iUpper - iLower;
			var oLower = instrRange.instroutrangefrom;
			var oUpper = instrRange.instroutrangeto;
			var outputSpan = oUpper - oLower;
			
			
			var shouldRound = this._getRoundOption("TOLTRUNCATE");
			var precision = instr.get('outputprecision');
			
			var actualPrecision = {
					input: this.decimalPlacesOf(sPrefix == '' ? point.get('inputvalue') : point.get(sPrefix + 'input')),
					output: this.decimalPlacesOf(sPrefix == '' ? point.get('outputvalue') : point.get(sPrefix + 'output'))
			};
			var rightPrecision = this._getPointTolPrecision(point, instr, sPrefix, actualPrecision);
			var options = {places: rightPrecision, round: shouldRound};
			
			for(var tol = 1; tol < 5; tol++){
				
				var toltype = instr.get('tol' + tol + 'type');
				if(!toltype)
					toltype = null;
				
				var tolLower = 0.00;
				var tolUpper = 0.00;
				tolLower = instr.get('tol' + tol + 'lowervalue')? this.fromDisplayableValue(instr.get('tol' + tol + 'lowervalue'), 'decimal'): tolLower ;
				tolUpper = instr.get('tol' + tol + 'uppervalue')?this.fromDisplayableValue(instr.get('tol' + tol + 'uppervalue'), 'decimal'): tolUpper;
				
				
				//Set the desire output vlue
				if(sPrefix && sPrefix != '') {
					asinputvalue = point.get(sPrefix + 'input');
					desiredOutputVal = this._calculateDesiredOutput(asinputvalue.toString(), point, instr);
					i =  parseFloat(point.get(sPrefix + 'input'));
				}
				else {
					//Watchout for issue. Possibly using the rounded displayeble version of output value.
					//Instead of full calculated precision which should ideally be the case.
					desiredOutputVal = parseFloat(point.get('outputvalue'));
					i =  parseFloat(point.get('inputvalue'));
				}
				
				var sqrtFrom = 0.00;
				var sqrtTo = 0.00;
				
				var calcSummedRDG = false;
				var calcSummedEU = false;
				var calcSummedSpan = false;
				var calcSummedURV = false;
				
				var toleranceLower = "";
				var toleranceUpper = "";
				
				
				//EU
				var sumEU = instr.get('tol' + tol + 'sumeu');
				if(!sumEU || sumEU == null || sumEU == ""){
					sumEU = "";
				} else {
					calcSummedEU = true;
				}
				
				//%READING
				var sumRead = instr.get('tol' + tol + 'sumread');
				if(!sumRead || sumRead == null || sumRead == ""){
					sumRead = "";
				} else {
					calcSummedRDG = true;
				}
				
				//%SPAN
				var sumSpan = instr.get('tol' + tol + 'sumspan');
				if(!sumSpan || sumSpan == null || sumSpan == ""){
					sumSpan = "";
				} else {
					calcSummedSpan = true;
				}
				
				//%URV
				var sumURV = instr.get('tol' + tol + 'sumurv');
				if(!sumURV || sumSpan == null || sumSpan == ""){
					sumURV = "";
				} else {
					calcSummedURV = true;
				}
				
				var exp = 2.0;
				
				//TODO: add guardband functionality
				var gbFrom = 0;
				var gbTo = 0;
				gbFrom = this._addGuardBand(instr, 0.00, tol, 'from', true, 0.00);
				gbTo = this._addGuardBand(instr, 0.00, tol, 'to', true, 0.00);
				var can_process = true;
				if(!calcSummedEU && !calcSummedRDG && !calcSummedSpan && !calcSummedURV){
					
					if(toltype != null ){
						if((toltype == "EU" || sumEU != "" )  && instr.plantype == 'ANALOG'){
							sqrtFrom = (Math.pow(((i - iLower + tolLower + gbFrom)/inputSpan),exp) * outputSpan) + oLower;
							sqrtTo = (Math.pow(((i - iLower + tolUpper + gbTo)/inputSpan),exp) * outputSpan) + oLower;
						} else if((toltype == '%SPAN' || sumSpan != "") && instr.plantype == 'ANALOG'){
							sqrtFrom = (Math.pow((((i - iLower) + tolLower * (inputSpan / 100) + gbFrom) / inputSpan),exp) * outputSpan)  + oLower;
							sqrtTo = (Math.pow((((i - iLower) + tolUpper * (inputSpan / 100)+ gbTo) / inputSpan),exp) * outputSpan)  + oLower;
						} else if((toltype == '%URV' || sumURV != "") && instr.plantype == 'ANALOG'){
							sqrtFrom = (Math.pow((((i - iLower) + tolLower * (Math.abs(iUpper) / 100) + gbFrom) / inputSpan),exp) * outputSpan)  + oLower;
							sqrtTo = (Math.pow((((i - iLower) + tolUpper * (Math.abs(iUpper) / 100) + gbTo) / inputSpan),exp) * outputSpan)  + oLower;
						} else if((toltype == '%READING' || sumRead != "") &&  instr.plantype == 'ANALOG'){
							sqrtFrom = (Math.pow((((i - iLower) + tolLower * (Math.abs(i) / 100) + gbFrom) / inputSpan),exp) * outputSpan)  + oLower;
							sqrtTo = (Math.pow((((i - iLower) + tolUpper * (Math.abs(i) / 100) + gbTo) / inputSpan),exp) * outputSpan)  + oLower;
						}
					}
					else{
						can_process = false
					}
				}else{
						
						var summedTpDirectionBoth = false;
						var summedToDirectionPlus = false;
						var summedToDirectionMINUS = false;
						
						var sumTolEU = parseFloat(sumEU == ""? 0.00: sumEU);
						var sumTolSpan = parseFloat(sumSpan == ""? 0.00: sumSpan);
						var sumTolRead = parseFloat(sumRead == ""? 0.00: sumRead);
						var sumTolURV = parseFloat(sumURV == ""? 0.00: sumURV);
						
						var sumDirection = instr.get('tol' + tol + 'sumdirection');
						
						if(sumDirection == '+')
							summedToDirectionPlus = true;
						else if (sumDirection == '-')
							summedToDirectionMINUS = true;
						else if(sumDirection == '+/-')
							summedTpDirectionBoth = true;
						
						if(summedToDirectionMINUS || summedTpDirectionBoth){
							
							sqrtFrom =  (Math.pow(
									   (
								          ((i - iLower)
								            - sumTolEU 
									        - (sumTolSpan * (inputSpan / 100)) 
									        - (sumTolURV * (Math.abs(iUpper) / 100)) 
									        - (sumTolRead * (Math.abs(i) / 100))
									        + gbFrom
									       ) 
									       / inputSpan
									   ), exp)) * outputSpan + oLower;
						} else {
							sqrtFrom = desiredOutputVal;
						}
						
						if(summedToDirectionPlus || summedTpDirectionBoth)
						{
							sqrtTo =  (Math.pow(  
									   (
								          ((i - iLower)
								            + sumTolEU 
									        + (sumTolSpan * (inputSpan / 100)) 
									        + (sumTolURV * (Math.abs(iUpper) / 100)) 
									        + (sumTolRead * (Math.abs(i) / 100))
									        + gbTo
									       ) 
									       / inputSpan
									   ), exp)) * outputSpan + oLower;
						} else {
							
							sqrtTo = desiredOutputVal;
						}
						
						
						
					}
					
					if(can_process){
						toleranceLower = this.toDisplayableValue(sqrtFrom, 'decimal', options);
						toleranceUpper = this.toDisplayableValue(sqrtTo, 'decimal', options);
						
						if(instr.cliplimits){
							var dtoleranceLower = Math.min(Math.max(toleranceLower, oLower), oUpper);
							var dtoleranceUpper = Math.max(Math.min(toleranceUpper, oUpper), oLower);
							
							toleranceLower = this.toDisplayableValue(dtoleranceLower, 'decimal', options);
							toleranceUpper = this.toDisplayableValue(dtoleranceUpper, 'decimal', options);
						}
						if( (toleranceLower && toleranceUpper) ||
								(toleranceLower != null && toleranceLower != NaN && toleranceUpper) ||
								(toleranceLower && toleranceUpper != null && toleranceUpper != NaN) ) {
							point.set(sPrefix + 'tol' + tol + 'lower', toleranceLower);
							point.set(sPrefix + 'tol' + tol + 'upper', toleranceUpper);
						}
						else {
							point.setNullValue(sPrefix + 'tol' + tol + 'lower');
							point.setNullValue(sPrefix + 'tol' + tol + 'upper');
						}
					}
			}
		},
		
		
		_calculateTolerances: function(sPrefix, point, instr, instrRange, attrs, actualPrecision, options) {
			// Check to see if tolerance is on output range
			var isOutputRangeLimit = instr.get('outputrange');
			
			// input span by output span
			var ISpanByOSpan = (attrs['outputTo'] - attrs['outputFrom']) / (attrs['inputTo'] - attrs['inputFrom']); 
			var desiredOutputValue = new Number(0);
			var setPointValue = new Number(0);
			// Loop through tolerance levels
			for (var tol = 1; tol < 5; tol++) {
				var tollowervalue = instr.isNull('tol' + tol + 'lowervalue') ? undefined : this.fromDisplayableValue(instr.get('tol' + tol + 'lowervalue'), 'decimal'); 
				var toluppervalue =	instr.isNull('tol' + tol + 'uppervalue') ? undefined : this.fromDisplayableValue(instr.get('tol' + tol + 'uppervalue'), 'decimal');
				var toleranceLower = null;
				var toleranceUpper = null;
				// TOLTYPE
				var toltype = instr.get('tol' + tol + 'type');
				var tolPrefixes = new Array();
				if (instr.get('nonlinear')) {
					tolPrefixes = ['asfound', 'asleft'];
				} else {
					tolPrefixes = [sPrefix];
				}

				if(AssetFunctionObject.hasSummedCalculations(instr, tol)) {
					var summedTol = this.calculateSummedTolerance(sPrefix, instr, point, tol, isOutputRangeLimit, attrs, ISpanByOSpan);
					toleranceLower = summedTol['toleranceLower'];
					toleranceUpper = summedTol['toleranceUpper'];
					if (toltype == null)
						toltype = "SUM";
				}
				else if (toltype == 'EU') { // Engineering Units
					if(!instr.get('nonlinear') && sPrefix) {
						var asinputvalue =  this.fromDisplayableValue(point.get(sPrefix + 'input'), 'decimal');
						desiredOutputValue = this._calculateDesiredOutput(asinputvalue, point, instr);
					}
					else {
						desiredOutputValue = this.fromDisplayableValue(point.get('outputvalue'), 'decimal');
					}

					if (point.plantype == 'DISCRETE') {
						// discrete eu equation use set point value instead of desired output value
						setPointValue = this.fromDisplayableValue(point.get('setpointvalue'), 'decimal'); 
						toleranceLower = setPointValue + tollowervalue;
						toleranceUpper = setPointValue + toluppervalue;
					} 
					else {
						if(isOutputRangeLimit) {
							// tolerance on output
							toleranceLower = desiredOutputValue + tollowervalue;
							toleranceUpper = desiredOutputValue + toluppervalue;
						}
						else {
							// tolerance on input
							if(tollowervalue != undefined) {							
								// Lower tolerance range value
								toleranceLower = desiredOutputValue + (tollowervalue * ISpanByOSpan);
							}
							if(toluppervalue != undefined) {	
								// Upper tolerance range value
								toleranceUpper = desiredOutputValue + (toluppervalue * ISpanByOSpan);
							}
						}
					}
				}
				else {
					// %SPAN, %URV and %READING
					var inputAttrName = '';
					if(point.plantype == 'ANALOG') {
						inputAttrName = sPrefix ? sPrefix + 'input' : 'inputvalue';
					}
					else if(point.plantype == 'DISCRETE') {
						inputAttrName = sPrefix ? sPrefix + 'setpoint' : 'setpointvalue';
					}
					var inputValue =  this.fromDisplayableValue(point.get(inputAttrName), 'decimal');
					var outputvalue = this.fromDisplayableValue(point.get('outputvalue'), 'decimal');
					desiredOutputValue = sPrefix ? this._calculateDesiredOutput(inputValue, point, instr) : outputvalue;
					desiredOutputValue = instr.get('nonlinear') ? outputvalue : desiredOutputValue;
					var factor = null;
					if(toltype == '%READING') {
						factor = this._calculateREADINGfactor(sPrefix, point, desiredOutputValue, isOutputRangeLimit, point.plantype);
					}
					else if(toltype == '%SPAN') {
						factor = this._calculateSPANfactor(attrs, isOutputRangeLimit);
					}
					else if(toltype == '%URV') {
						factor = this._calculateURVfactor(attrs, isOutputRangeLimit);
					}
					if(toltype && point.plantype == 'ANALOG') {
						if(!isOutputRangeLimit) {
							toleranceLower = desiredOutputValue + tollowervalue * ((factor / 100) * ISpanByOSpan);
							toleranceUpper = desiredOutputValue + toluppervalue * ((factor / 100) * ISpanByOSpan);
						}
						else {
							toleranceLower = desiredOutputValue + tollowervalue	* (factor / 100);
							toleranceUpper = desiredOutputValue + toluppervalue * (factor / 100);
						}
					}
					else if(toltype && point.plantype == 'DISCRETE') {
						var setpoint = this.fromDisplayableValue(point.get('setpointvalue'), 'decimal');
						if(!isOutputRangeLimit) {
							toleranceLower = setpoint + (tollowervalue * factor);
							toleranceUpper = setpoint + (toluppervalue * factor);
						}
						else {
							toleranceLower = (setpoint + tollowervalue) * factor;
							toleranceUpper = (setpoint + toluppervalue) * factor;
						}
					}
				}
				
				if (toltype && instr.get('cliplimits')) {
					toleranceLower = Math.min(Math.max(toleranceLower, attrs['outputFrom']), attrs['outputTo']);
					toleranceUpper = Math.max(Math.min(toleranceUpper, attrs['outputTo']), attrs['outputFrom']);
				}
				
				if(toleranceLower!== null && toleranceUpper !== null && toleranceLower!==NaN && toleranceUpper!==NaN){
					var tolLower = this.toDisplayableValue(toleranceLower, 'decimal', options);
					var tolUpper = this.toDisplayableValue(toleranceUpper, 'decimal', options);
					this.checkValueLength(point, tolLower);
					this.checkValueLength(point, tolUpper);
				}
				
				//Set the tolerance values
				for (var i = 0; i < tolPrefixes.length; ++i) {
					//If the computed value of toleranceLower && toleraceUpper = 0; if evalueates it to false.
					//Catching this unwanted condition and evaluating it to true
					if( (toleranceLower && toleranceUpper ) ||
							(toleranceLower != null && toleranceLower != NaN && toleranceUpper) ||
							(toleranceLower && toleranceUpper != null && toleranceUpper != NaN) || (toleranceLower && toleranceUpper) == 0 ) {
						point.set(tolPrefixes[i] + 'tol' + tol + 'lower', this.toDisplayableValue(toleranceLower, 'decimal', options));
						point.set(tolPrefixes[i] + 'tol' + tol + 'upper', this.toDisplayableValue(toleranceUpper, 'decimal', options));
					}
					else {
						point.setNullValue(tolPrefixes[i] + 'tol' + tol + 'lower');
						point.setNullValue(tolPrefixes[i] + 'tol' + tol + 'upper');
					}
				}
			}			
			
			return true;
		},
		
		_calculateREADINGfactor: function(prefix, point, desiredOutput, isTolOutput, plantype) {
			if(plantype == 'ANALOG') {
				var attrName = prefix ? prefix + 'input' : 'inputvalue';
				if(!isTolOutput) {
					return Math.abs(this.fromDisplayableValue(point.get(attrName), 'decimal'));
				}
				else {
					if(prefix) {
						return desiredOutput;
					}
					else {
						return Math.abs(this.fromDisplayableValue(point.get('outputvalue'), 'decimal'));
					}
				}
			}
			else if(plantype == 'DISCRETE') {
				var attrName = prefix ? prefix + 'setpoint' : 'setpointvalue';
				var factor = this.fromDisplayableValue(point.get(attrName), 'decimal');
				return Math.abs(factor) / 100;
			}
		},
		
		_calculateSPANfactor: function(attrs, isTolOutput) {
			if(!isTolOutput) {
				return attrs['inputTo'] - attrs['inputFrom'];
			}
			else {
				return attrs['outputTo'] - attrs['outputFrom'];
			}
		},
		
		_calculateURVfactor: function(attrs, isTolOutput) {
			if(!isTolOutput) {
				return Math.abs(attrs['inputTo']);
			}
			else {
				return Math.abs(attrs['outputTo']);
			}
		},
		
		_calculateToleranceErrors: function(sPrefix, point, instr, output, options) {
			var tolExceeded = false;
			var status = null;
			var statusIcon = null;
			var outputValue = this.fromDisplayableValue(output, 'decimal');
			for (var tol = 1; tol < 5; tol++) {
				var lowTolerance = this.fromDisplayableValue(point.get(sPrefix + 'tol' + tol + 'lower'), 'decimal');
				var highTolerance = this.fromDisplayableValue(point.get(sPrefix + 'tol' + tol + 'upper'), 'decimal');
				// no tolerance values
				if( (lowTolerance == null || lowTolerance == NaN) && (highTolerance == null || highTolerance == NaN) ) {
					continue;
				}
				var value = '';
				if ((outputValue >= lowTolerance) && (outputValue <= highTolerance)) {
					// just keep the status, if not exceeded we set up at end
					status = SynonymDomain.resolveToDefaultExternal(this.calstatus, this.status.PASS);
					statusIcon = this.status.PASS;
					value = this.toDisplayableValue(new Number(0), 'decimal', options);
					point.set(sPrefix + 'error' + tol, value);
				}
				else {
					tolExceeded = true;
					status = instr.get('tol' + tol + 'status');
					//status = status ? status : this.status.WARNING;
					statusIcon = SynonymDomain.resolveToInternal(this.calstatus, status);
					var synonym = this.resolveToDefaultExternalSynonym(statusIcon);
					switch(statusIcon) {
					case this.status.FAIL:
						statusIcon = this.status.FAIL;
						break;
					case this.status.PASS:
						statusIcon = this.status.PASS;
						break;
					default:
						// anything other than pass or fail is a WARNING icon
						statusIcon = this.status.WARNING;
						break;
					}
					// update status
					try{
					point.set(sPrefix + 'status', status);
					}catch(e){};
					try{
					point.set(sPrefix + 'statusicon', statusIcon);
					}catch(e){};
					try{
					point.set(sPrefix + 'statusdesc', synonym.description);
					}catch(e){};
					
					
					if (outputValue < lowTolerance) {
						value = this.minusZeroMakeUp((outputValue - lowTolerance));
						//options.places = this.reducePlacesforFieldLength(value,options);
						value = this.toDisplayableValue(value, 'decimal', options);
					} 
					else if (outputValue > highTolerance) {
						value = this.minusZeroMakeUp((outputValue - highTolerance));
						//options.places = this.reducePlacesforFieldLength(value,options);
						value = this.toDisplayableValue(value, 'decimal', options);
					}
					point.set(sPrefix + 'error' + tol, value);
					// set general error flag
					point.set(sPrefix + 'error', true);
				}
			
				if(value!== null && value!==NaN){
					this.checkValueLength(point, value);
				}
			}
			
			if(!tolExceeded) {
				// status got updated for exceeded case, otherwise update now
				status = status ? status : SynonymDomain.resolveToDefaultExternal(this.calstatus, this.status.PASS);   
				statusIcon = SynonymDomain.resolveToInternal(this.calstatus, status);   
				point.set(sPrefix + 'status', status);
				point.set(sPrefix + 'statusicon', statusIcon);
				var synonym = this.resolveToDefaultExternalSynonym(statusIcon);
				point.set(sPrefix + 'statusdesc', synonym.description);
				// clear general error flag
				point.set(sPrefix + 'error', false);
			}
			return tolExceeded;
		},
		
		_calculateAssetError: function(sPrefix, point, instr, input, output, attrs, isOpposite, actualPrecision, options) {
			var error = '';
			var inputValue = this.fromDisplayableValue(input, 'decimal');
			var outputValue = this.fromDisplayableValue(output, 'decimal');
			var finalValue = new Number(0);
			if (point.plantype == 'DISCRETE') {
				error = (outputValue - inputValue);
			} 
			else {
				var inputInOutputEU = new Number(0);
				if (instr.get('nonlinear')) {
					// if the instrument is non-linear, use the desired output value for the calculation
					inputInOutputEU = this.fromDisplayableValue(point.get('outputvalue'), 'decimal');
				} 
				else {
					var negative_state = 1;
					//Squared Calculation for Reverse Flow Calibration 
					if (instr.get('squared')) {
						if(inputValue.toString().charAt(0) == '-'){
							negative_state = -1;
						}
						else if(inputValue == 0){
							negative_state = 0;
						}
						
						if(negative_state == 0){
							inputInOutputEU = attrs['outputFrom'];
						} else if(negative_state == -1){
							finalValue = attrs['outputFrom'] - (Math.pow(((inputValue - attrs['inputFrom']) / attrs['instrInputSpan']),2) * attrs['instrOutputSpan']);
							inputInOutputEU = finalValue;
						} else{
							finalValue = attrs['outputFrom'] + (Math.pow(((inputValue - attrs['inputFrom']) / attrs['instrInputSpan']),2) * attrs['instrOutputSpan']);
							inputInOutputEU = finalValue;
						}
						
					} 
					else if(instr.get('squareroot')) {
						if(inputValue.toString().charAt(0) == '-'){
							negative_state = -1;
						}
						else if(inputValue == 0){
							negative_state = 0;
						}
						
						if(negative_state == 0){
							inputInOutputEU = attrs['outputFrom'];
						} else if(negative_state == -1){
							finalValue = attrs['outputFrom'] - ((Math.sqrt(inputValue / attrs['inputTo'])) * attrs['instrOutputSpan']);
							inputInOutputEU = finalValue;
						} else{
							finalValue = attrs['outputFrom'] + ((Math.sqrt(inputValue / attrs['inputTo'])) * attrs['instrOutputSpan']);
							inputInOutputEU = finalValue;
						}
					} 
					else {
						if (isOpposite) {
							finalValue = attrs['outputTo'] - ((inputValue - attrs['inputFrom']) * (attrs['instrOutputSpan'] / attrs['instrInputSpan']));
						} else {
							finalValue = attrs['outputFrom'] + ((inputValue - attrs['inputFrom']) * (attrs['instrOutputSpan'] / attrs['instrInputSpan']));
						}
						inputInOutputEU = finalValue;
					}
				}
				options['places'] = this._getAssetPrecision(options.places, actualPrecision);
				error = DecimalCalculator.minus(outputValue, inputInOutputEU);
				
				
			}
			// e
			if (error === '') {
				point.setNullValue(sPrefix + 'outerror');
			}
			else {
				
				error = this.minusZeroMakeUp(error);
				error = this.toDisplayableValue(error, 'decimal', options);
				point.set(sPrefix + 'outerror', error);
			}
			
			if(error!== null && error!==NaN){
				this.checkValueLength(point, error);
			}
			
			return error;
		},
		
		_processAssetError: function(sPrefix, point, instr, input, output, attrs, isOpposite, error, actualPrecision, options) {
			var inputValue = this.fromDisplayableValue(input, 'decimal');
			var outputValue = this.fromDisplayableValue(output, 'decimal');
			options['places'] = this._getAssetPrecision(options.places, actualPrecision);
			if (!instr.isNull('processeu')) {
				if (instr.get('nonlinear')
						|| instr.get('processeu') == instr.get('instroutrangeeu')
						|| (instr.plantype == 'DISCRETE' && instr.get('processeu') == instr.get('instrcalrangeeu'))) {
					
					// Process EU is equal to output EU
					point.set(sPrefix + 'proerror', this.minusZeroMakeUp(error));
				} 
				else if (instr.get('processeu') == instr.get('instrcalrangeeu')) {
					// Process EU is equal to input EU
					var errorResult1 = new Number(0);
					if (isOpposite) {
						errorResult1 = (attrs['instrInputSpan'] / attrs['instrOutputSpan'])
								* ((outputValue) - (attrs['outputTo'] - ((inputValue - attrs['inputFrom']) * (attrs['instrOutputSpan'] / attrs['instrInputSpan']))));
					} else {
						errorResult1 = ((attrs['instrInputSpan']) / (attrs['instrOutputSpan']))
								* (outputValue - ((inputValue - attrs['inputFrom'])
										* (attrs['instrOutputSpan'] / attrs['instrInputSpan']) + attrs['outputFrom']));
					}
					error = this.minusZeroMakeUp(errorResult1);
					error = this.toDisplayableValue(error, 'decimal', options);
					//error = this.toDisplayableValue(errorResult1, 'decimal', options);
					point.set(sPrefix + 'proerror', error);
				} 
				else if (!instr.isNull('processeufactor')) {
					// A Process EU Factor should have been provided
					var factor = this.fromDisplayableValue(instr.get('processeufactor'), 'decimal');
					if (factor != 0) {
						error = this.minusZeroMakeUp((error * factor));
						error = this.toDisplayableValue(error, 'decimal', options);
						point.set(sPrefix + 'proerror', error);
					}
				}
				
				if(error!== null && error!==NaN){
					this.checkValueLength(point, error);
				}
			}
		}, 
		
		_getPointTolPrecision: function(point, instr, fieldPrefix, actualPrecision) {
			/* Returns the rigth tolerance precision for the field group (denoted by its
			 * prefix) for the given point. 
			 */
			var rightPrecision = new Number(0);
			if(point.plantype == 'ANALOG') {
				var minOutputPrecision = instr.get('outputprecision');
				rightPrecision = this._getTolPrecision(minOutputPrecision, actualPrecision['output'], actualPrecision['input']);										
			} 
			else if(point.plantype == 'DISCRETE') {
				var actualSetPointPrecision = this.decimalPlacesOf(fieldPrefix == '' ? point.get('setpointvalue') : point.get(fieldPrefix + 'setpoint')); 
				rightPrecision = actualSetPointPrecision;
			}
			return rightPrecision;
		},
		
		
		_getTolPrecision: function(minOutputPrecision, actualOutputPrecision, actualInputPrecision) {
			/* Defines the right precision to be used for tolerance limits and errors.
			 * Formula Rounding or Truncation 
			 */
			var rightPrecision = new Number(0);
			switch (this.dsconfig.get('tolerror')) {
				case 1:
					rightPrecision = minOutputPrecision + this.dsconfig.get('tolnplaces');
					break;
				case 2:
					rightPrecision = (actualInputPrecision > actualOutputPrecision) ? (actualInputPrecision) : (actualOutputPrecision + 1);
					break;
				default:
					rightPrecision = minOutputPrecision;
					break;
			}
			return rightPrecision;
		},
		
		
		_getAssetPrecision: function(minOutputPrecision, actualPrecision) {
			/* Defines the right precision to be used for asset and process errors.
			 * Formula Rounding or Truncation 
			 */
			var rightPrecision = new Number(0);
			switch (this.dsconfig.get('asseterror')) {
				case 1:
					rightPrecision = minOutputPrecision + this.dsconfig.get('assetnplaces');
					break;
				case 2:
					rightPrecision = (actualPrecision['input'] > actualPrecision['output']) ? actualPrecision['input'] : actualPrecision['output'];
					break;
				default:
					rightPrecision = minOutputPrecision;
					break;
			}
			return rightPrecision;
		},
		
		_getDirection: function(instrRange) {
			var attrs = {};
			if( instrRange['instrcalrangefrom'] - instrRange['instrcalrangeto'] < 0 && instrRange['instroutrangefrom'] - instrRange['instroutrangeto'] >= 0) {
    			//	1. Opposite Direction Input Increasing and Output Decreasing 
				attrs = {
						inputFrom 	: instrRange['instrcalrangefrom'],
						inputTo		: instrRange['instrcalrangeto'],
						outputFrom	: instrRange['instroutrangeto'],
						outputTo	: instrRange['instroutrangefrom'],
						opposite 	: true
				};
		 	}
			else if(instrRange['instrcalrangefrom'] - instrRange['instrcalrangeto'] > 0 && instrRange['instroutrangefrom'] - instrRange['instroutrangeto'] <= 0) {
 				//	2. Opposite Direction Input Decreasing and Output Increasing
				attrs = {
						inputFrom 	: instrRange['instrcalrangeto'],
		 				inputTo		: instrRange['instrcalrangefrom'],
		 				outputFrom	: instrRange['instroutrangefrom'],
		 				outputTo	: instrRange['instroutrangeto'],
		 				opposite 	: true
				};
 			}
			else if(instrRange['instrcalrangefrom'] - instrRange['instrcalrangeto'] > 0 && instrRange['instroutrangefrom'] - instrRange['instroutrangeto'] >= 0) {
 				//	3. Same Direction Input Decreasing and Output Decreasing
				attrs = {
						inputFrom 	: instrRange['instrcalrangeto'],
		 				inputTo		: instrRange['instrcalrangefrom'],
		 				outputFrom	: instrRange['instroutrangeto'],
		 				outputTo	: instrRange['instroutrangefrom'],
		 				opposite 	: false
				};
 			}
			else {
		 		//  4. Same Direction Input Increasing and Output Increasing
				attrs = {
						inputFrom 	: instrRange['instrcalrangefrom'],
				 		inputTo		: instrRange['instrcalrangeto'],
				 		outputFrom	: instrRange['instroutrangefrom'],
				 		outputTo	: instrRange['instroutrangeto'],
				 		opposite 	: false
				};
		 	}
			attrs['instrInputSpan'] = attrs['inputTo'] - attrs['inputFrom'];
			attrs['instrOutputSpan'] = attrs['outputTo'] - attrs['outputFrom'];
			return attrs;
		},
		
		resolveToDefaultExternalSynonym: function(maxvalue) {
			var synonymSet = this.calstatus.find('maxvalue == $1 && defaults == $2', maxvalue, true);
			var synonym = synonymSet.length > 0 ? synonymSet[0] : null;
			return synonym;
		},
		
		
		
		minusZeroMakeUp: function(value) {
			
			if (value === '')
				return value;
			
			var precision = this.decimalPlacesOf(value);
			if(precision > 20)
				precision = 10;
			if(precision == null || precision < 0)
				precision = 0
			// -0 (minus zero without decimal places
			return parseFloat(value).toFixed(precision);
		},
		
		_getRoundOption: function(attribute) {
			try{
			return this.dsconfig.get(attribute) ? -1: 0;  // dojo.number.format round option:  0=round, -1=don't round (truncate)
			}catch(xception){
				
			}
			
			return -1;
		},
		
		_isRoundUpField: function(fieldName){
			return fieldName != null && !(fieldName == "instrcalrangefrom"
					|| fieldName == "instrcalrangeto"
					|| fieldName == "instroutrangefrom"
					|| fieldName == "instroutrangeto"
					|| fieldName == "ron1uppervalue"
					|| fieldName == "ron1lowervalue"
					|| fieldName == "tol1lowervalue"
					|| fieldName == "tol1uppervalue"
					|| fieldName == "tol2uppervalue"
					|| fieldName == "tol2lowervalue"
					|| fieldName == "tol3uppervalue"
					|| fieldName == "tol3lowervalue"
					|| fieldName == "tol4lowervalue"
					|| fieldName == "tol4uppervalue"
					|| fieldName == "tol1sumeu"
					|| fieldName == "tol1sumread"
					|| fieldName == "tol1sumspan"
					|| fieldName == "tol1sumurv"
					|| fieldName == "tol2sumeu"
					|| fieldName == "tol2sumread"
					|| fieldName == "tol2sumspan"
					|| fieldName == "tol2sumurv"
					|| fieldName == "tol3sumeu"
					|| fieldName == "tol3sumread"
					|| fieldName == "tol3sumspan"
					|| fieldName == "tol3sumurv"
					|| fieldName == "tol4sumeu"
					|| fieldName == "tol4sumread"
					|| fieldName == "tol4sumspan"
					|| fieldName == "tol4sumurv");
			
		}
		
	};
	
	
	return declare(null, lang.mixin(thisModule, classbody, SumToleranceTypesMixin, StandardDeviationMixin, _NumberFormatter));
});
