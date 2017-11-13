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

/*
 * 
 * @euthor: abnair@us.ibm.com
 * This file provides utility fucntions to deal with numeric textbox.  
 * 
 */

define(
		"platform/util/ANumericUtil",
		[  "dojo/_base/declare", 
		   "dojo/on",
		   "platform/exception/PlatformRuntimeException",
		   "dijit/focus",
		   "platform/logging/Logger",
		   "dojo/dom-attr",
		   "platform/warning/PlatformRuntimeWarning",
		   "platform/translation/MessageService",
		   "dojo/number" ],
		function(declare, on, PlatformRuntimeException, focusUtil, Logger,
				domAttr, PlatformRuntimeWarning, MessageService, number) {

			return declare(
					null,
					{

						previuos_value : '',
						new_value : '',
						base_queue : [],
						exp_queue : [],
						base_queue_index : 0, // index is where the digit is
												// to be inserted
						exp_queue_index : -1, // index is where the digit is
												// to be inserted.
						base_queue_size : 2,
						exp_queue_size : 0,
						DIRECTION_RIGHT : 1,
						DIRECTION_LEFT : 0,
						textbox : null,
						autofocus_mode : true,
						mresource : null,
						fieldLength: -1,  //not initialized
						fieldLengthCntr: 0,
						blur_listener: null,
						key_listener: null,
						del_listener: null,

						constructor : function() {

						},

						setDisplayValue : function(resource, decimal) {

							if (decimal)
								this.exp_queue_size = decimal;

							this.textbox = resource.textWidget;
							this.mresource = resource;

						},

						_updateTextboxValue : function(value) {

							this.textbox.domNode.value = value;
							this.textbox.set('value', value);
							
							if (this.mresource.getCurrentRecord()) {

								
								if (this.mresource.getCurrentRecord()) {
									
									//the _local operations below are very specific t o calibration. Need to chnage this if we need for generic one
									if(this.mresource.modelData.point != undefined){
										//We cannot enable this since we set the textbox value 
										//to decimal and let it convert to corresponding locale and display
										//if(this.mresource.resourceAttribute.indexOf('_local') > -1){
										
										//}
										//else{
										//	var orig = this.mresource.resourceAttribute;
										//	this.mresource.getCurrentRecord().set(orig + '_local', value);
										//}
										
										//Due to above we check if orig and local values are same after stripping symbol,
										//if not we copy over
										//Asumming local has . and orig has locale decimal
										var orig_attr = this.mresource.resourceAttribute.replace('_local',"");
										var local_attr = this.mresource.resourceAttribute;
										var orig_vaue = this.mresource.getCurrentRecord().get(orig_attr)
										var local_val = this.mresource.getCurrentRecord().get(this.mresource.resourceAttribute);
										var orig_stripped_val = '';
										var local_stripped_val = '';
										if(orig_vaue)
											orig_stripped_val = this.mresource.getCurrentRecord().get(orig_attr).replace(window.anywhere_locale_seperator, "");
										if(local_val)
											local_stripped_val = this.mresource.getCurrentRecord().get(this.mresource.resourceAttribute).replace('.', '');
										
										if(orig_vaue && (orig_stripped_val !== local_stripped_val)) {
											this.mresource.getCurrentRecord().set(orig_attr, orig_vaue.replace('.', window.anywhere_locale_seperator));
										}
									}
									
									this.mresource.getCurrentRecord().set(this.mresource.resourceAttribute, value);

								}

							}

						},

						// return the decimal symbol for that locale
						_getDecimalSeperatorSymbolForCurrentLocale : function() {

							var places = 2;
							var num = number.format(10, {
								places : places
							});

							return num.toString().charAt(num.toString().length - places - 1);
							
						},

						// return the thousands seperator for the symbol

						_getThousandsSeperatorSymbolForCurrentLocale : function() {

							var num = number.format(1000000);

							return num.toString().match(/\D/)[0];
						},

						// check the validity of input based on current locale

						_isValidInputForCurrentLocale : function(numberString) {

							var num = null;
							var result = true;

							// String numberString of the sign
							// if(numberString.charAt(0) == '-')
							// numberString = numberString.substr(1,
							// numberString.length);

							// Make an exception if the number ends with decimal
							// symbol, since we autocomplete
							// in this case
							// To handle this case, we remove the deimal symbol,
							// validate rest of the input
							// and then attach the decimal again and
							var symbol = this._getDecimalSeperatorSymbolForCurrentLocale();
							if (numberString.charAt(numberString.length - 1) == symbol) {
								numberString = numberString.substr(0, numberString.length - 1);
							}

							try {
								var num = number.parse(numberString);
							} catch (e) {
								result = false;
							}

							if (num == null || isNaN(num))
								result = false;

							return result;
						},

						// Manage Decimal point
						_manageMinFieldResolution : function(numberString, symbol, exp_queue_size) {

							symbol = symbol? symbol: '.'; //this._getDecimalSeperatorSymbolForCurrentLocale();
							//expected decimal places
							exp_queue_size = exp_queue_size?exp_queue_size: this.exp_queue_size;
							var expnt_length = 0;
							var pad_length = 0;
							var result = numberString;

							var decimalFound = numberString.indexOf(symbol) > -1 ? true: false;

							// if exp queue size is greater than 0
							if (exp_queue_size > 0) {
								if (decimalFound) {
									expnt_length = numberString.split(symbol)[1].length;
									pad_length = exp_queue_size - expnt_length;

									// if the input exponent crosses min field
									// resolution, trun cate it to pad lenth; else pad with
									// zeroes
									if (pad_length > 0) {
										var result_q = this._pad_queue(numberString.split(''),this.DIRECTION_RIGHT, '0', pad_length);
										result = result_q.join('');
									} else {//pad_length > 0 means we need to truncate the extra decimals
										result = numberString;

									}
								}
								// if no decimal found, append a decimal symbol
								// and continue to pad with MFR zeroes;
								else {
									numberString = numberString + symbol;
									pad_length = exp_queue_size;
									var result_q = this._pad_queue(numberString.split(''), this.DIRECTION_RIGHT, '0', pad_length);
									result = result_q.join('');
								}
							}else if(decimalFound && numberString.charAt(numberString.length - 1) == symbol){
								result = numberString.replace(symbol, '');
							}

							return result;

						},

						// for number that come in like .98; append 0 in front
						_manageMissingBase : function(numberString, symbol) {

							var sign = '';
							symbol = symbol? symbol: '.'; //this._getDecimalSeperatorSymbolForCurrentLocale();

							var decimalFound = numberString.indexOf(symbol) > -1 ? true: false;
							// Check befor decimal symbol, if the base if empty.
							// If yes then append a 0

							if (decimalFound) {
								// Strip any sign symbol
								if (numberString.charAt(0) == '-') {
									numberString = numberString.substr(1,numberString.length);
									sign = '-';
								}

								var base_length = numberString.split(symbol)[0].length
								if (base_length == 0)
									numberString = '0' + numberString;

								numberString = sign + numberString;
							}

							return numberString;
						},

						/*prepareForLocaleAndPrecision: function(eventContext){
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
							
						}*/
						
						manageSign: function(value){
							var val_arr = value.split('');
							var sign = val_arr.pop();
							if(sign === '-' || sign === '+' ){
								if(sign === '-')
									value = sign + val_arr.join('');
								else
									value = val_arr.join('');
							}
							return value;
						},

						_pad_queue : function(queue, direction, data, times) {
							if (direction == this.DIRECTION_RIGHT) {

								var cnt = 0;
								while (cnt++ < times)
									queue.push(data);

							} else {
								var cnt = 0;
								while (cnt++ < times)
									queue.unshift(data);
							}

							return queue;

						},

						registerNumericTextBox : function() {

							var in_num = '';

							var self = this;
							// Insertion
							// identifies delete key for android
							/*if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
								this.key_listener = on(this.textbox, "keydown",
										function(event) {

											var keycode = event.keyCode;
											Logger.trace("Key Pressed:" + keycode);
											if (event.keyCode != 8)
												self._addDigit(self.textbox.textbox, event);

											// if (in_num)
											// self._updateTextboxValue(in_num);
											// event.preventDefault();
										});
							}

							this.del_listener = on(
									this.textbox,
									"input",
									function(event) {

										if (event.keyCode != 8) // Except for del key press
											self._addDigit(self.textbox.textbox,event);

									});*/

							// Fires when user focous out of the textbox
							this.blur_listener = on(this.textbox.domNode, "blur", function(event) {

										var exp_nmbr = null;
										var base_format_nbr = null;
										var out_nmbr = null;
										var expnt_length = self.exp_queue_size;

										// Get the textboxvalue
										var textboxValue = null;
										textboxValue = self.textbox.textbox.value;

										// Do not process if no value
										if (!textboxValue || textboxValue == null)
										{
											self._updateTextboxValue('');
											return;
										}

										
										if(!self.textbox.textbox.validity){
											self._updateTextboxValue('');
											return;
										}
										
										if(textboxValue.indexOf(window.anywhere_locale_seperator) > -1 )
											textboxValue = textboxValue.replace(window.anywhere_locale_seperator, '.');
										// Process Minimum filed resolution if
										// set
										exp_nmbr = self.manageSign(textboxValue);
										exp_nmbr = self._manageMinFieldResolution(exp_nmbr, '.', this.exp_queue_size);
										// Process base if necessary
										exp_nmbr = self._manageMissingBase(exp_nmbr.toString());

										self._updateTextboxValue(exp_nmbr);

									});
						},

						limitTextLength: function(fieldLength){
							this.fieldLength = fieldLength;
							var self = this;
							if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
								this.key_listener = on(this.textbox, "keydown",
										function(event) {
											self.textLengthManager(event);
											
								});
							}

							this.del_listener = on(
									this.textbox,
									"input",
									function(event) {
										self.textLengthManager(event);

										

							});
						},

						textLengthManager: function(event){
							var keycode = event.keyCode;
											
							if(this.textbox.textbox.value.length >= this.fieldLength)
								if(keycode >= 48 && keycode <= 90)
									event.preventDefault();	

						},

						_addDigit : function(textbox, event) {
							var keycode = event.keyCode;
							var sign_nbr = null;
							var textbox_value = textbox.value;
							
							// if they are signs keys ..handle it 
							if (keycode == 45 || keycode == 43 || keycode == 187 || keycode == 189) { 
								var sign = this._handlesigns(keycode,event.shiftKey);
								var intial_sign = '';
								intial_sign = textbox_value.split('')[0];
								intial_sign = intial_sign == '-'
										|| intial_sign == '+' ? intial_sign
										: '';
								if (sign == '+' && intial_sign == '') {
									event.preventDefault();
								} else if (intial_sign == '-') {
									var hh = textbox_value.split('');
									if (sign == '-') {
										hh.splice(0, 1, sign);
										event.preventDefault();
									} else {
										hh.splice(0, 1);
										event.preventDefault();
									}
									this._updateTextboxValue(hh.join(''));
								} else if (sign == '-' && textbox_value != "") {
									sign_nbr = sign.concat(textbox_value);
									this._updateTextboxValue(sign_nbr);
									event.preventDefault();
								}

							}

						},

						_handlesigns : function(keycode, isShift) {
							var sign = "";
							if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
								sign = this._keycode_dictionary[keycode];
								if (isShift) {
									sign = this._keycode_shifted_keys[sign];
								}
							} else {
								if (keycode == 45)
									sign = '-';
								if (keycode == 43)
									sign = '+';
							}
							return sign;

						},

						_keycode_shifted_keys : {
							"/" : "?",
							"." : ">",
							"," : "<",
							"\'" : "\"",
							";" : ":",
							"[" : "{",
							"]" : "}",
							"\\" : "|",
							"`" : "~",
							"=" : "+",
							"-" : "_",
							"1" : "!",
							"2" : "@",
							"3" : "#",
							"4" : "$",
							"5" : "%",
							"6" : "^",
							"7" : "&",
							"8" : "*",
							"9" : "(",
							"0" : ")"
						},

						_keycode_dictionary : {
							8 : "backspace",
							9 : "tab",
							12 : "num",
							13 : "enter",
							16 : "shift",
							17 : "ctrl",
							18 : "alt",
							19 : "pause",
							20 : "caps",
							27 : "esc",
							32 : "space",
							33 : "pageup",
							34 : "pagedown",
							35 : "end",
							36 : "home",
							37 : "left",
							38 : "up",
							39 : "right",
							40 : "down",
							44 : "print",
							45 : "insert",
							46 : "delete",
							48 : "0",
							49 : "1",
							50 : "2",
							51 : "3",
							52 : "4",
							53 : "5",
							54 : "6",
							55 : "7",
							56 : "8",
							57 : "9",
							65 : "a",
							66 : "b",
							67 : "c",
							68 : "d",
							69 : "e",
							70 : "f",
							71 : "g",
							72 : "h",
							73 : "i",
							74 : "j",
							75 : "k",
							76 : "l",
							77 : "m",
							78 : "n",
							79 : "o",
							80 : "p",
							81 : "q",
							82 : "r",
							83 : "s",
							84 : "t",
							85 : "u",
							86 : "v",
							87 : "w",
							88 : "x",
							89 : "y",
							90 : "z",
							91 : "cmd",
							92 : "cmd",
							93 : "cmd",
							96 : "num_0",
							97 : "num_1",
							98 : "num_2",
							99 : "num_3",
							100 : "num_4",
							101 : "num_5",
							102 : "num_6",
							103 : "num_7",
							104 : "num_8",
							105 : "num_9",
							106 : "num_multiply",
							107 : "num_add",
							108 : "num_enter",
							109 : "num_subtract",
							110 : "num_decimal",
							111 : "num_divide",
							124 : "print",
							144 : "num",
							145 : "scroll",
							186 : ";",
							187 : "=",
							188 : ",",
							189 : "-",
							190 : ".",
							191 : "/",
							192 : "`",
							219 : "[",
							220 : "\\", // Using double slashes to be discussed.for now directly comparing keyCode
							221 : "]",
							222 : "\'",
							223 : "`",
							224 : "cmd",
							225 : "alt",
							57392 : "ctrl",
							63289 : "num",
							59 : ";"
						},

						inverted_keycode_dictionary : {
							"backspace" : 8,
							"tab" : 9,
							"num" : 12,
							"enter" : 13,
							"shift" : 16,
							"ctrl" : 17,
							"alt" : 18,
							"pause" : 19,
							"caps" : 20,
							"esc" : 27,
							"space" : 32,
							"pageup" : 33,
							"pagedown" : 34,
							"end" : 35,
							"home" : 36,
							"left" : 37,
							"up" : 38,
							"right" : 39,
							"down" : 40,
							"print" : 44,
							"insert" : 45,
							"delete" : 46,
							"0" : 48,
							"1" : 49,
							"2" : 50,

							"3" : 51,

							"4" : 52,

							"5" : 53,

							"6" : 54,

							"7" : 55,

							"8" : 56,

							"9" : 57,

							"a" : 65,

							"b" : 66,

							"c" : 67,

							"d" : 68,

							"e" : 69,

							"f" : 70,

							"g" : 71,

							"h" : 72,

							"i" : 73,

							"j" : 74,

							"k" : 75,

							"l" : 76,

							"m" : 77,

							"n" : 78,

							"o" : 79,

							"p" : 80,

							"q" : 81,

							"r" : 82,

							"s" : 83,

							"t" : 84,

							"u" : 85,

							"v" : 86,

							"w" : 87,

							"x" : 88,

							"y" : 89,

							"z" : 90,

							"cmd" : 91,

							"cmd" : 92,

							"cmd" : 93,

							"num_0" : 96,

							"num_1" : 97,

							"num_2" : 98,

							"num_3" : 99,

							"num_4" : 100,

							"num_5" : 101,

							"num_6" : 102,

							"num_7" : 103,

							"num_8" : 104,

							"num_9" : 105,

							"num_multiply" : 106,

							"num_add" : 107,

							"num_enter" : 108,

							"num_subtract" : 109,

							"num_decimal" : 110,

							"num_divide" : 111,

							"print" : 124,

							"num" : 144,

							"scroll" : 145,

							";" : 186,

							"=" : 187,

							"," : 188,

							"-" : 189,

							"." : 190,

							"/" : 191,

							"`" : 192,

							"[" : 219,
							"\\" : 220, // Using double slashes to be discussed.
										// for now directly comparing keyCode.
							"]" : 221,
							"\'" : 22,
							"`" : 22,
							"cmd" : 224,
							"alt" : 225,
							"ctrl" : 57392,
							"num" : 63289,
							";" : 59,
						},

						inverted_keycode_shifted_keys : {
							"?" : "/",
							">" : ".",
							"<" : ",",
							"\"" : "\'",
							":" : ";",
							"{" : "[",
							"}" : "]",
							"|" : "\\",
							"~" : "`",
							"+" : "=",
							"_" : "-",
							"!" : "1",
							"@" : "2",
							"#" : "3",
							"$" : "4",
							"%" : "5",
							"^" : "6",
							"&" : "7",
							"*" : "8",
							"(" : "9",
							")" : "0"
						}

					});

		});
