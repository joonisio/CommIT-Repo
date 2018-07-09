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

define("application/business/calibration/_SumToleranceTypesMixin", 
		["dojo/_base/array",
		 "dojo/_base/lang",
		 "dojo/_base/declare",
		 "dojo/number",
		 "platform/exception/PlatformRuntimeException",
		 "platform/format/FormatterService"], 
function(arrayUtil,lang, declare, NumberUtil, PlatformRuntimeException, FormatterService) {
	
	SUMEU = 'sumeu';
	SUMREAD = 'sumread';
	SUMSPAN = 'sumspan';
	SUMURV = 'sumurv';
	
	var AssetFunctionObject = null;
	require(["application/business/AssetFunctionObject"], function(assetFuncObj) {
		 AssetFunctionObject = assetFuncObj;
	});
	
	return {
		// Mixin class for application.business.calibration.DataSheetCalculation
		
/**@memberOf application.business.calibration._SumToleranceTypesMixin */
		calculateSummedTolerance: function(prefix, instr, point, tol, isTolOutput, attrs, ISpanByOSpan) {
			var summedToleranceFrom = null;
			var summedToleranceTo = null;
			var sumCalcTypes = AssetFunctionObject._getSummedCalcTypes(instr, tol);
			var sumEU = null, sumRead = null, sumSpan = null, sumURV = null;
			for(n in sumCalcTypes) {
				var sumCalcType = sumCalcTypes[n];
				switch(sumCalcType) {
					case SUMEU:
						sumEU = this.calcSumEU(instr, tol, isTolOutput, ISpanByOSpan);
						break;
					case SUMREAD:
						sumRead = this.calcSumRead(prefix, instr, point, tol, isTolOutput, attrs, ISpanByOSpan);
						break;
					case SUMSPAN:
						sumSpan = this.calcSumSpan(instr, tol, isTolOutput, attrs, ISpanByOSpan);
						break;
					case SUMURV:
						sumURV = this.calcSumURV(instr, tol, isTolOutput, attrs, ISpanByOSpan);
						break;
					default:
						break;
				}
			}
			var gbFrom = this._addGuardBand(instr, 0.00, tol, 'from', true, 0.00);
			var gbTo = this._addGuardBand(instr, 0.00, tol, 'to', true, 0.00);
			var inputAttr = prefix ? prefix + 'input' : 'inputvalue';
			var inputValue = this.fromDisplayableValue(point.get(inputAttr), 'decimal');
			var desiredOutputValue = this._calculateDesiredOutput(inputValue, point, instr);
			var sumdirection = instr.get('tol'+tol+'sumdirection');
			if(sumdirection == '-') {
				summedToleranceFrom = desiredOutputValue - sumEU - sumRead - sumSpan - sumURV + gbFrom;
				summedToleranceTo = desiredOutputValue;
			}
			else if(sumdirection == '+') {
				summedToleranceFrom = desiredOutputValue;
				summedToleranceTo = desiredOutputValue + sumEU + sumRead + sumSpan + sumURV + gbTo;
			}
			else if(sumdirection == '+/-') {
				summedToleranceFrom = desiredOutputValue - sumEU - sumRead - sumSpan - sumURV + gbFrom;
				summedToleranceTo = desiredOutputValue + sumEU + sumRead + sumSpan + sumURV + gbTo;
			}
			return {
				'toleranceLower': summedToleranceFrom,
				'toleranceUpper': summedToleranceTo
			};
		},
		
		calcSumEU: function(instr, tol, isTolOutput, ISpanByOSpan) {
			var tolnsumeu = this.fromDisplayableValue(instr.get('tol'+tol+'sumeu'), 'decimal');
			if(isTolOutput) {
				return tolnsumeu;
			}
			else {
				return tolnsumeu * ISpanByOSpan;
			}
		},
		
		calcSumRead: function(prefix, instr, point, tol, isTolOutput, attrs, ISpanByOSpan) {
			var tolnsumread = this.fromDisplayableValue(instr.get('tol'+tol+'sumread'), 'decimal');
			var inputAttr = prefix ? prefix + 'input' : 'inputvalue';
			var inputValue = this.fromDisplayableValue(point.get(inputAttr), 'decimal');
			var factor = null;
			if(!isTolOutput) {
				factor = inputValue;
				return tolnsumread * ( (Math.abs(factor) / 100) * ISpanByOSpan);
			}
			else {
				if(prefix) {
					factor = this._calculateDesiredOutput(inputValue, point, instr);
				}
				else {
					factor = this.fromDisplayableValue(instr.get('outputvalue'), 'decimal');
				}
				return tolnsumread * (Math.abs(factor) / 100);
			}
		},
		
		calcSumSpan: function(instr, tol, isTolOutput, attrs, ISpanByOSpan) {
			var tolnsumspan = this.fromDisplayableValue(instr.get('tol'+tol+'sumspan'), 'decimal');
			var factor = null;
			if(!isTolOutput) {
				factor = attrs['inputTo'] - attrs['inputFrom'];
				return tolnsumspan * ( (factor / 100) * ISpanByOSpan);
			}
			else {
				factor = attrs['outputTo'] - attrs['outputFrom'];
				return tolnsumspan * (factor / 100);
			}
		},
		
		calcSumURV: function(instr, tol, isTolOutput, attrs, ISpanByOSpan) {
			var tolnsumurv = this.fromDisplayableValue(instr.get('tol'+tol+'sumurv'), 'decimal');
			var factor = null;
			if(!isTolOutput) {
				factor = attrs['inputTo'];
				return tolnsumurv * ( (Math.abs(factor) / 100) * ISpanByOSpan );
			}
			else {
				factor = attrs['outputTo'];
				return tolnsumurv * (Math.abs(factor) / 100);
			}
		},
		
	};
});
