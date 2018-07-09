/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2016 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/business/util/DecimalCalculator", 
		["dojo/_base/array",
		 "platform/format/FormatterService",
		 "platform/exception/PlatformRuntimeException"], 
function(arrayUtil, FormatterService, PlatformRuntimeException) {
	
	return {
		
/**@memberOf application.business.util.DecimalCalculator */
		plus: function(a, b) {
			return this._calculate(a, b, '+');
		},
		
		minus: function(a, b) {
			return this._calculate(a, b, '-');
		},
		
		multiply: function(a, b) {
			return this._calculate(a, b, '*');
		},
		
		divide: function(a, b) {
			return this._calculate(a, b, '/');
		},
		
		scaleToInt: function(float, places) {
			return float * Math.pow(10, places);
		},
		
		scaleToFloat: function(int, places) {
			var float = int / Math.pow(10, places);
			if( (float+'').indexOf('e') > -1) {
				return new Number(float.toFixed(20));
			}
			else {
				return float;
			}
		},
		
		maxPlaces: function(a, b) {
			return Math.max(this.decimalPlacesOf(a), this.decimalPlacesOf(b));
		},
		
		decimalPlacesOf: function(num) {
			 var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
			  if (!match) { return 0; }
			  return Math.max(0,
			       // Number of digits right of decimal point.
			       (match[1] ? match[1].length : 0)
			       // Adjust for scientific notation.
			       - (match[2] ? +match[2] : 0)
			  );
		},
		
		_calculate: function(a, b, operation) {
			var places = this.maxPlaces(a, b);
			var aInt = this.scaleToInt(a, places);
			var bInt = this.scaleToInt(b, places);
			switch(operation) {
				case '+': return this.scaleToFloat(aInt + bInt, places);
				case '-': return this.scaleToFloat(aInt - bInt, places);
				case '*': return this.scaleToFloat(aInt * bInt, places * 2);
				case '/': return aInt / bInt;
				default: return null;
			}
		},
	};
});
