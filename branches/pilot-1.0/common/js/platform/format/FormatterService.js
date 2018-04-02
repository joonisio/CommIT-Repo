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

define("platform/format/FormatterService",
		["dojo/date/locale", 
		 "dojo/date/stamp",
		 "dojo/number",
		 "platform/exception/PlatformRuntimeException",
		 "platform/util/PlatformConstants"  ], 
function(dateTimeFormatter, dateTimeISOFormatter, numberFormatter, PlatformRuntimeException, PlatformConstants) {
	var _fromStringValue = function(stringValue, userLocale, options){
		//Need to escape URLs so they launch on Windows Tablet systems
	    var windows = (WL.Client.getEnvironment() == WL.Environment.WINDOWS8);
	    if (windows && stringValue && (typeof stringValue == 'string') && stringValue.indexOf("<a href") >= 0) {
	        stringValue = window.toStaticHTML(stringValue);
	    }
		var returnString =  stringValue ? stringValue : "";
        if(options && options.attributeName && options.attributeName==PlatformConstants.ERRORED_ATTRIBUTE_MSG){
            if(returnString.indexOf('BMX') == 0) {
            	returnString = returnString.substring(PlatformConstants.BMX_LENGTH + PlatformConstants.BMX_PADDING) + '<span class=\'errorId\'/>- ' + returnString.substring(0,PlatformConstants.BMX_LENGTH)+'</span>';
         	}
        }
        return returnString;
	};
	var _toStringValue = function(stringValue, userLocale, options){
		if (options) {
			var maxSize = options.maxSize;
			if (maxSize && stringValue.length > maxSize)
				throw new PlatformRuntimeException("maxSizeExceeded", [stringValue, maxSize]);
		}

		return "" !== stringValue ? stringValue : null;
	};
	
	var _fromUpperValue = function(stringValue, userLocale){
		return stringValue ? stringValue.toUpperCase() : "";
	};
	var _toUpperValue = function(stringValue, userLocale){
		return "" !== stringValue ? stringValue.toUpperCase() : null;
	};
	
	var _toDateTime = function(stringValue, userLocale){		
		var nullOrEmpty = !stringValue || stringValue.length == 0;
		var asDate = !nullOrEmpty ? dateTimeFormatter.parse(stringValue.replace("    ", " "), {formatLength: 'short', locale: userLocale}) : null;
		if(!nullOrEmpty && (asDate == null || asDate == 'Invalid Date')){
			throw new PlatformRuntimeException("invaliddatetime", [stringValue]);
		}
		else if(nullOrEmpty){
			return null;
		}
		/* oslc accepts values in ISO 8601 - we keep the values in that format */
		return dateTimeISOFormatter.toISOString(asDate); 
	};
	var _fromDateTime = function(dateValue, userLocale){		
		var theValue = (!dateValue || dateValue instanceof Date) ? dateValue : dateTimeISOFormatter.fromISOString(dateValue);
		return dateValue ? dateTimeFormatter.format(theValue, {formatLength: 'short', locale: userLocale}).replace(" ", "    ") : "";
	};
	var _toDuration = function(stringValue){
		var nullOrEmpty = !stringValue || stringValue.length == 0;
		if(nullOrEmpty){
			return 0;
		}
		var negativeHours = false;
		if(stringValue.match(/^-/)) {
		    negativeHours = true;
		}
		var negativeMinutes = false;
		if(stringValue.match(/:-/)) {
		    negativeMinutes = true;
		}
				
		//Since we trigger this check on every keyup, we need to support partially typed durations with empty minutes fields.
		if(stringValue.match(/^-?\d{1,}:([-0-5]){0,1}\d{0,1}$/) == null){
			throw new PlatformRuntimeException("invalidduration", [stringValue]);
		}
		var separatorPos = stringValue.indexOf(":");
		if(separatorPos >= 0){
			var parsed = stringValue.split(":");
			var hours = parseInt(parsed[0],10);
			var minutes = parseInt(parsed[1],10) * 0.01666666666666667;
			//If the signs match just add them up
			if (negativeHours == negativeMinutes) {
				return (hours + minutes);
			} 
			//If the hours are negative but the minutes aren't assume they intend the minutes to be negative as well.
			else if (negativeHours && !negativeMinutes) {
				return (hours - minutes);
			} else if (negativeMinutes && hours == 0) {
				//They reported negative minutes but no hours
				return minutes;
			}
				
		}	
	};
	var _fromDuration = function(numericValueInHours){
		if(numericValueInHours){
			numericValueInHours = numericValueInHours || 0;
			var allMinutes = Math.round(numericValueInHours * 60);
			var hours = parseInt(allMinutes / 60,10);
			var minutes = parseInt(allMinutes % 60,10);
			var negativeMinutes = false;
			if (minutes < 0) {
				minutes = Math.abs(minutes);
				negativeMinutes = true;
			}
			var minutesFormatted = minutes > 9 ? "" + minutes: "0" + minutes;
			var hoursFormatted = hours==0 && negativeMinutes ? "-" + hours : "" + hours;
			return hoursFormatted + ":" + minutesFormatted;
		}else{
			return "0:00";
		}
	};
	var _toDate = function(stringValue, userLocale){
		var nullOrEmpty = !stringValue || stringValue.length == 0;
		var asDate = !nullOrEmpty ? dateTimeFormatter.parse(stringValue, {selector: 'date', formatLength: 'short', locale: userLocale}) : null;
		if(!nullOrEmpty && (asDate == null || asDate == 'Invalid Date')){
			throw new PlatformRuntimeException("invaliddate", [stringValue]);
		}
		else if(nullOrEmpty){
			return null;
		}
		/* oslc accepts values in ISO 8601 - we keep the values in that format */ 		
		return dateTimeISOFormatter.toISOString(asDate); 
	};
	var _fromDate = function(dateValue, userLocale){
		//If no time given and timezone, it calulates to wrong day. Detecting that and stripping the time.
		if (dateValue && dateValue.indexOf('00:00:00+00:00') > -1){
			dateValue = dateValue.substring(0,19);
		}
		return dateValue ? dateTimeFormatter.format((dateValue instanceof Date) ? dateValue : dateTimeISOFormatter.fromISOString(dateValue), {selector: 'date', formatLength: 'short', locale: userLocale}) :  "";
	};
	var _toTime = function(stringValue, userLocale){
		var nullOrEmpty = !stringValue || stringValue.length == 0;
		var asDate = !nullOrEmpty ? dateTimeFormatter.parse(stringValue, {selector: 'time', formatLength: 'short', locale: userLocale}) : null;
		if(!nullOrEmpty && (asDate == null || asDate == 'Invalid Date')){
			throw new PlatformRuntimeException("invalidtime", [stringValue]);
		}
		else if(nullOrEmpty){
			return null;
		}
		/* oslc accepts values in ISO 8601 - we keep the values in that format */
		return dateTimeISOFormatter.toISOString(asDate);
	};
	var _fromTime = function(dateValue, userLocale){
		return dateValue ? dateTimeFormatter.format((dateValue instanceof Date) ? dateValue : dateTimeISOFormatter.fromISOString(dateValue.substring(0,19)), {selector: 'time', formatLength: 'short', locale: userLocale}) :  "";
	};
	var _toBoolean = function(displayableValue, userLocale){		
		displayableValue = displayableValue || false; 
		return displayableValue === true;
	};
	var _fromBoolean = function(booleanValue, userLocale){
		/* does not consider translation */
		return  (booleanValue || false);
	};
	var _fromInteger = function(integerValue, userLocale){
		/* no round */
		return integerValue!=null ? numberFormatter.format(integerValue, {type: "decimal", places: 0, round: -1, locale: userLocale}) : "";
	};
	var _toInteger = function(stringValue, userLocale){
		var nullOrEmpty = !stringValue || stringValue.length == 0;
		if(nullOrEmpty){
			return null;
		}
		stringValue = stringValue.replace(/\s/g, '');
		var result = numberFormatter.parse(stringValue, {type: "decimal", places: 0, round: -1, locale: userLocale});		
		if(isNaN(result) || !isFinite(result) || result % 1 >= 1e-6){
			throw new PlatformRuntimeException("invalidinteger", [stringValue]);
		}
		return result;
	};
	var _fromDecimal = function(decimalValue, userLocale, options){
		options = options || {};
		var places = options["places"] || 2;
		var round = (options.round == -1 ? -1 : 0); // 0,-1 are the only valid values.  default to 0 (round) unless it's set to -1 (don't round)
		return decimalValue!=null ? numberFormatter.format(decimalValue, {type: "decimal", places: places, round: round, locale: userLocale}) : "";
	};
	var _toDecimal = function(stringValue, userLocale, options){
		var nullOrEmpty = !stringValue || stringValue.length == 0;
		if(nullOrEmpty){
			return null;
		}
		options = options || {};
		var places = '0,'+ (options["places"] || 2);
		var round = (options.round == -1 ? -1 : 0); // 0,-1 are the only valid values.  default to 0 (round) unless it's set to -1 (don't round)
		stringValue = stringValue.replace(/\s/g, '');
		var result = numberFormatter.parse(stringValue, {type: "decimal", places: places, round: round, locale: userLocale}); 
		if(isNaN(result) || !isFinite(result)){
			throw new PlatformRuntimeException("invaliddecimal", [stringValue]);
		}
		return result;
	};
	return  {
//		Summary:
//			Represents a service to format/parse data to/from ui widgets and model.
//			
//		Description:
//			This class is the service that is used to support data formatting and data conversion between the UI components
//			and the platform model.		
// 			All public methods of this service are synchronous				
/**@memberOf platform.format.FormatterService */
		toDisplayableValue: function(originalValue, fromFormat, locale, options){	
			var usage = (options && options["usage"]) || null;
			var formatter = null;
			if(usage && this._fromType[usage]){
				formatter = this._fromType[usage];
			}else{
				formatter = this._fromType[fromFormat];	
			}
			if(formatter){
				return formatter(originalValue, locale, options);				
			}
			/* uses string formatter */
			return _fromStringValue(originalValue, locale, options);
		},
		fromDisplayableValue: function(displayableValue, toFormat, locale, options){
			if(displayableValue.trim){
				displayableValue = displayableValue.trim();
			}
			var usage = (options && options["usage"]) || null;
			var parser = null;
			if(usage && this._toType[usage]){
				parser = this._toType[usage];
			}else{
				parser = this._toType[toFormat];	
			}
			var val;
			if(parser){
				val = parser(displayableValue, locale, options);
			}
			else {
				/* uses string parser */
				val = _toStringValue(displayableValue, locale, options);
			}
			return val;
		},		
		_fromType : {
			"string" : _fromStringValue,
			"dateTime" : _fromDateTime,
			"datetime" : _fromDateTime,
			"duration" : _fromDuration,
			"date" : _fromDate,
			"time" : _fromTime,
			"boolean" : _fromBoolean,
			"integer" : _fromInteger,
			"decimal" : _fromDecimal,
			"double" : _fromDecimal,
			"float" : _fromDecimal,
			"upper" : _fromUpperValue
		},
		_toType : {
			"string" : _toStringValue,
			"upper" : _toUpperValue,
			"dateTime" : _toDateTime,
			"datetime" : _toDateTime,
			"date" : _toDate,
			"time" : _toTime,
			"duration" : _toDuration,
			"boolean" : _toBoolean,
			"integer" : _toInteger,
			"decimal" : _toDecimal,
			"double" : _toDecimal,
			"float" : _toDecimal
		}
	};	
});
