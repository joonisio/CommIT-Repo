define("application/business/calibration/_NumberFormatterMixin", 
		["dojo/_base/lang",
		 "dojo/_base/declare",
		 "platform/util/ANumericUtil"], 
		
function(lang, declare, ANumericUtil){
	var numberutil =  new ANumericUtil()
	
	return {

   decimalPlacesOf: function(num) {
	  
		var match = (''+num).match(/(?:[\.\,\'](\d+))?(?:[eE]([+-]?\d+))?$/);
		  if (!match) { return 0; }
		  return Math.max(0,
		       // Number of digits right of decimal point.
		       (match[1] ? match[1].length : 0)
		       // Adjust for scientific notation.
		       - (match[2] ? +match[2] : 0)
		  );
	},
	
	//Do not send in a value that has mre tha  to truncate. 
	//For safety always use the managemin resolution feld in ANumberUtil
	//Originally designed to truncate whatever the places the place argument gives. 29000.1234 places= 3 result is 29000.1
	truncateDecimal: function(value, places){
		if(!value)
			return value;
		value = value.toString();
		var sp =value.split('.')[1];
		if(sp && sp.length <= places)
			return value;

		var value_arr = value.split('');
		if(sp)
		{
			
			for(var n = 0; n < places;n++){				
				value_arr.pop();
			}
			
		}
		value = value_arr.join('');
		value = parseFloat(value).toFixed(places);
		return value;
		
	},
	
	/*This function takes in a value n the respective locale(e.g1.2, 1,2 1'2)
	 * Converts it to decimal 1.2
	 * pad with 0's if needed
	 * truncate if needed
	 * 
	 * return the number in . decimal format
	 */
	
	fromDisplayableValue: function(value, fromType, options) {
		if(value == undefined)
			return null;
		value = value ? value : '';
		var decimal_sep = window.anywhere_locale_seperator?window.anywhere_locale_seperator:'.';
		value = value.replace(decimal_sep, '.');
		var myOptions = options ? options : {};
		myOptions['type'] = 'decimal';
		myOptions['places'] = myOptions['places'] == 0 || myOptions['places'] ? myOptions.places : this.decimalPlacesOf(value);
		//return FormatterService.fromDisplayableValue(value, fromType, this.locale, myOptions);
		//myOptions['locale'] = 'en-us';
		//return NumberUtil.parse(value, myOptions);
		
		//Complete the decimal points according to precision
		var number_value = numberutil._manageMinFieldResolution(value.toString(), '.', myOptions['places'])
		number_value  =  this.truncateDecimal(number_value, myOptions['places']);
		//Here we convert the string to float. We do not care about truncation 
		//of zeroes since its used in mathematical operations
		var float_number = parseFloat(number_value);
		return float_number;
	},
	
	/*This function takes in the number in . format from the calculations
	 * 
	 * 
	 */
	
	toDisplayableValue: function(value, toType, options) {
		if(value == undefined)
			return null;
		
		if(value == null || value === '')
			return '';
		
		var decimal_sep = window.anywhere_locale_seperator?window.anywhere_locale_seperator:'.';
		var myOptions = options ? options : {};
		myOptions['type'] = 'decimal';
		myOptions['places'] = myOptions['places'] == 0 || myOptions['places'] ? myOptions.places : this.decimalPlacesOf(value);
		//return FormatterService.toDisplayableValue(value, toType, this.locale, myOptions);
		//myOptions['locale'] = 'en-us';
		//myOptions['pattern'] = '###0.#####';
		
		if(options['round'] == -1) { // truncate, don't round
			num = numberutil._manageMinFieldResolution(value.toString(), '.', myOptions['places']);
			num  = this.truncateDecimal(num, myOptions['places']);
		}
		else {
			num = this._internalRound(value, myOptions.places);
			num = numberutil._manageMinFieldResolution(num.toString(), '.', myOptions['places']);
			num =  this.truncateDecimal(num, myOptions['places']);
		}
		
		//Maybe we should not call and let device handle it
		num = num.toString().replace('.', decimal_sep);
		
		return num;
	},
	
	_internalRound: function(value, decimals) {
		decimals = Math.abs(parseInt(decimals)) || 0;
		var factor = Math.pow(10,decimals); 
		var roundValue =  Math.round(value*factor)/factor;
		var roundStringValue = roundValue.toString();
		if( roundStringValue.indexOf('e') > -1) {
			return roundValue.toFixed(decimals);
		}
		else {
			return roundValue;
		}
	},
	
	//This is will limit a max value of 15 digits for number. if exceeds
	//then it will trim the precision down.
	limitFieldValue: function(value, fieldLength, maxfraction){
		
		value = value.toString();
		

		var targetValue = value.substring(0, fieldLength);
		var decimalFoundAt = targetValue.indexOf('.');
		if(decimalFoundAt == fieldLength-1)//No fraction found but decimal found and integer length is one less
		{
				value = targetValue.replace('.', '');
				return value;
		}

		if(decimalFoundAt < 0)//No decimal found
			return targetValue;


		var integer = value.split('.')[0];
		var fraction = value.split('.')[1];
		
		//Initialize the length attribute if object not exists
		integer = integer?integer:{'length':0}
		fraction = fraction?fraction:{'length': 0}; 
		var digitsAllowed = fieldLength - 1;
		if((integer.length + fraction.length) > digitsAllowed){ //Reduce the fraction to accomodate only 15
			var reduceFractionTo = Math.abs(integer.length - digitsAllowed);
			if(reduceFractionTo > maxfraction)
				reduceFractionTo = maxfraction;
			return this.limitToMaxFraction(value, reduceFractionTo);
		}
		
		return this.limitToMaxFraction(value, maxfraction);
	},
	
	limitToMaxFraction: function(value, maxfraction){
		if(value === null || value === '')
			return null;
		value = value.toString();
		value = numberutil._manageMissingBase(value, '.')
		var fraction = value.split('.')[1];			
		var fractionSize = -1;
		if(fraction){
			fractionSize = fraction.length;
			if(fractionSize > maxfraction){
				var round = 1;
				if(fraction[maxfraction] === '5' || parseInt(fraction[maxfraction]) < 5){
					value = value.slice(0, -(fractionSize - maxfraction)); //non rounding case does not manage higer trucate decimal
					round = -1;
				}
				var options = {'places': maxfraction, 'round': round};
				return this.toDisplayableValue(value.toString(), 'decimal', options);
			}
		
		}
		return this.toDisplayableValue(value.toString(), 'decimal', {'round': -1});
	},
 }

  //return _NumberFormatter;
});