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

define("platform/util/DataValidator",
		["dojo/_base/declare",
		 "dojo/date/stamp"],

function(declare, dateTimeVerifier) {
	
	var _dateTimeValidator = function(value){
		// a regexp could be used here, but this solution is much clear as the
		// correct regexp would take a lot of time
		var result = dateTimeVerifier.fromISOString(value);
		return (result !== null && result !== "Invalid Date");				
	};	
	
	var _decimalValidator = function(value){		
		return typeof value == "number" && !isNaN(value) && isFinite(value);
	};	
	
	var _integerValidator = function(value){
		return _decimalValidator(value) && (value % 1 < 1e-6);
	};
	
	var _booleanValidator = function(value){
		return typeof value == "boolean";		
	};
	
	var _validator = {
		"datetime": _dateTimeValidator,
		"date": _dateTimeValidator,
		"time": _dateTimeValidator,
		"integer" : _integerValidator,
		"boolean" : _booleanValidator,
		"decimal" : _decimalValidator,
		"float" : _decimalValidator,
		"double" : _decimalValidator
	};	
	
	return {		
/**@memberOf platform.util.DataValidator */
		isDataTypeCompatibleWithValue: function(dataType, value){				
			return dataType == null || value == null || !_validator[dataType.toLowerCase()] || _validator[dataType.toLowerCase()](value);
		}
	};
});
