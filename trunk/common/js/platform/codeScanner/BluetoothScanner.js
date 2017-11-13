
/* JavaScript content from js/platform/codeScanner/BluetoothScanner.js in folder common */
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
 * @author: Amith Nair
 * @email: abnair@us.ibm.com
 *
 * This API sets up a keyboard event listener for a particular sequence of keyboard events.
 * Designed for detecting barcode scans from a bluetooth scanner which emulates bluetooth keyboard.
 *
 * @Usage: Put the below code in your client
 *
 *You can set up the listener in two ways. 
 *1. Either globally on a page (e.g. list page), which has no textfileds expecting barcode scans or
 *2. A page which has textfileds that expect barcode scans, in which case global listening is not possible.

	//Initializes the Bluetooth Scanner with a selctor parameter.
	//The selector parameter confirms to css3 selectors.
	//They are used to specify which element the listener is to be attached
 var scanner = new BluetoothScanner('body');

 To register the listener.
 @param bool texfield_mode: if false -> register the lstener globally. 
 if true -> register the textfiled listeners for accepting barcode scans. 
 no global listerner possible in this mode

 scanner.registerScanListener(texfield_mode);

 //Call back on the 'codeScanned' event.
 // This event is fired by the API when it recieves a defines sequence of characters
 scanner.on('codeScanned', function(s){

 alert(s.result);
 });

 The client should not forget to call removeScanListener() function when the scanning function is no more required. 
 Especially after using a global listener
 */

/*Notes: 
 * Iphone: Native code creates a hidden textfiled for global listening 
 * 				and propogates key events from there. 
 * 			Also native code send notifications for keyboard hide and display. 
 * 			Used to detect when focus goes out of textfield and keyboard is not completely 
 * 			hidden because the ios in hardware input mode.
 * 
 * Android: Javascript attches key listener to an html element (genreally the body element) and 
 * 			propogates key events from there.
 * 
 */


define(
		"platform/codeScanner/BluetoothScanner",
		[ "dojo/_base/declare", "dojo/Evented", "dojo/on", "dojo/query",
		  "platform/exception/PlatformRuntimeException",
		  "dijit/focus",
		  "dojo/_base/unload",
		  "dijit/focus",
		  "platform/logging/Logger"
		  ],
		  function(declare, Evented, on, query, PlatformRuntimeException, focusUtil, baseUnload, focusUtil, Logger) {


			var registered_listeners = {};

			if (WL.Client.getEnvironment() == WL.Environment.IPAD || WL.Client.getEnvironment() == WL.Environment.IPHONE)
			{
				//Reinitialize for relogin
				cordova.exec(null, null, "Keyboard", "stopListeningOnViewController", []);

				//Register for keyboard hide notification
				var keyboardHideNotification = function(data) {
					var currentElement = focusUtil.curNode;
					//TODO: Check if the input element is type text
					if (currentElement){

						currentElement.blur();

					};

				};


				cordova.exec(keyboardHideNotification, null, "Keyboard", "keyboardHideNotify", []);       
			} 

			return declare(
					Evented,
					{

						symbol : '',
						select : '',
						prefix : 219,  //Javascript key code '[' Prefix for character sequnce.
						suffix1 : 220, //Javascript key code '\'(backslash) Suffix 1 for character sequence
						suffix2 : 221, // Javascript key code ']' Suffix 2 for character sequence
						_scanlistener: null,
						_charBuffer: [],
						texfield_mode: false,
						keyCode_map: {'shift': 16},
						timeout: null,
						scan_success: false,
						scannedData : [],

						//Finite Sate Automaton data structure
						states : [ {
							'name' : 'start',
							'initial' : true,
							'events' : {
								'prefix_in' : 'prefix',

							}
						},

						{
							'name' : 'prefix',
							'events' : {
								'data_in' : 'data',
								'suffix1_in' : 'suffix1',
							}
						}, {
							'name' : 'data',
							'events' : {
								'data_in' : 'data',
								'suffix1_in' : 'suffix1'
							}
						}, {
							'name' : 'suffix1',
							'events' : {
								'suffix2_in' : 'suffix2',
								'data_in': 'data'
							}
						}, {
							'name' : 'suffix2',
							'events' : {

							}
						},

						],
						/**@memberOf platform.codeScanner.BluetoothScanner */
						//Initialize the states of FSM (Finite State Machine)
						_setStates : function() {

							this.indexes = {}; // just for convinience
							for (var i = 0; i < this.states.length; i++) {
								this.indexes[this.states[i].name] = i;
								if (this.states[i].initial) {
									this.currentState = this.states[i];
								}
							}

						},

						//TODO: Configurable prefix and sufffix
						constructor : function(selector, prefix, suffix1, suffix2) {


							this._setStates();
							this.texfield_mode = false;

							if (selector)
								this.select = selector;
							else
								this.select = 'document';

							//Check for an existing listener in the dictionary to avoid registering a listener on same element twice.
							//Iphone
							if((WL.Client.getEnvironment() == WL.Environment.IPAD || WL.Client.getEnvironment() == WL.Environment.IPHONE)) {

								cordova.exec(null, null, "Keyboard", "stopListeningOnViewController", []);

							}

							//Android
							existing_listener = registered_listeners[this.select];
							if (existing_listener){
								existing_listener._scanlistener.remove();
								delete registered_listeners[this.select];
							}

						},

						//Change the states of FSM based on the keyboard event recieved
						_consumeEvent : function() {

							var evnt = '';
							var shift = false;

							while(this._charBuffer.length != 0)
							{
								e = this._charBuffer.shift();

								if (e == this.prefix) {
									evnt = 'prefix_in';
									this.symbol = '';
								}
								else if (e == this.suffix1)
									evnt = 'suffix1_in';
								else if (e == this.suffix2)
									evnt = 'suffix2_in';
								else
									evnt = 'data_in';

								if (this.currentState.events[evnt]) {

									//When transitioning from prefix_1 to data put the prefix_1 char in symbol
									if (this.currentState.name == 'suffix1' && evnt == 'data_in'){
										this.symbol += String.fromCharCode(this.suffix1);

									};

									this.currentState = this.states[this.indexes[this.currentState.events[evnt]]];

								};

								if(this.currentState.name == 'data'){

									if(e == this.keyCode_map['shift']){
										shift = true;
										continue;
									}

									//On detection of shift key in the buffer convert to upper case for now. Symbols to be looked at.
									if (shift){

										this.symbol += this._calculateSymbol(shift, e);
										shift = false;
									}else{
										this.symbol += this._calculateSymbol(shift, e);
									}
								};

								if (this.suffix2 != '' && this.currentState.name == 'suffix2') {
									//if shift key detected befor suffix, ignore it for now.
									if (shift){
										shift= false;
									};

									Logger.trace("[BluetoothScanner] Scanned in " +  this.symbol);

									this.scannedData.push(this.symbol);
									this.reset();

								};

							};
						},

						_calculateSymbol: function(shift, e){
							var sym = null;
							var key = this._keycode_dictionary[e];
							if(shift){
								sym =this._keycode_shifted_keys[key];
								if(!sym)
									return key.toUpperCase();
								else
									return sym;
							}
							else
								return key;

						},

						//Reset the FSM
						reset: function(){
							this._charBuffer = [];
							this.symbol = '';
							this._setStates();
						},

						//Called when the FSM recahes the end state i.e the suffix 2 is recieved
						_codeScanned : function(success, data) {
							this._charBuffer = [];
							this.symbol = '';

							if (this.texfield_mode){
								var currentElement = focusUtil.curNode;
								if (success && currentElement) {
									if (currentElement.type == "text") {
										setTimeout(function () {
                    		              currentElement.value = '';
                    		              currentElement.value = data;
										}, 50);
									}

								}
							}else{
								if(success) {
									this.scan_success = true;
									var result = {text: data.toString(), format: 'BLUETOOTH'};
									if (data.length > 1){
										//Only include values if more than one so platform or any handling 
										//classes can check for that to determine if multiple scanned in values
										result['values'] = data;
									}
									Logger.trace("[BluetoothScanner._codeScanned] Returning scan results: " +  JSON.stringify(result));
									this.emit("codeScanned", {
										scanned: true,  
										result : result,
										error: null
									});
								}
								else{
									Logger.trace("[BluetoothScanner._codeScanned] no scan results returned. ");
								}
								/*else{
                    			  this.scan_success = false;
                    			  var exception = new PlatformRuntimeException("bluetooth_invalidScannerConfig", []);
                    			  var err_msg = exception.getMessage();
                    			  this.emit("codeScanned", {
                    				  scanned: false,
                    				  error : err_msg,
                    				  result: null
                    			  });
                    		  }*/
							}


						},

						_timerTag: function(){
							var self = this;
							var input_timeup = 250; //time to receive the next consecutive input before timing out.
							if (this.timeout)
								clearTimeout(this.timeout);
							var currentData = this.scannedData;
							this.timeout  = setTimeout(function(){
								if(currentData.length == 0){
									self._codeScanned(false, null);
								}
								else{
									//Weird thing was happening here, even though the here in the code it was setting currentData to []
									//in some context it was retaining the old values.  To get around this, clone the array then 
									//remove the data from it.
									var valuesToSend = currentData.slice(0); //cloning the array
									currentData.splice(0, currentData.length); //removing the values
									self._codeScanned(true, valuesToSend);
								}

							},input_timeup); 

						},


						_signalKeyPress: function(keyCode){

							this._charBuffer.push(keyCode);
							Logger.trace(keyCode);
							if (keyCode == this.suffix2)
							{
								Logger.trace('suffix_2: ' + keyCode);
								this._consumeEvent(keyCode);
							};

							this._timerTag();

						},

						//This method called from the iOS call back takes in a character converts to charcode from the map below and sends it to signal KeyPress
						//Also takes care of shifted keys which send a 16 in front of the char
						_keyPressInChar: function(data){

							if (sym = this.inverted_keycode_shifted_keys[data]){
								this._signalKeyPress(this.keyCode_map['shift']);
								this._signalKeyPress(this.inverted_keycode_dictionary[sym]);

							}
							else {

								//check if uppercase
								if(data.match(/^[A-Z]*$/)){

									this._signalKeyPress(this.keyCode_map['shift']);
									this._signalKeyPress(this.inverted_keycode_dictionary[data.toLowerCase()]);

								}
								else {
									this._signalKeyPress(this.inverted_keycode_dictionary[data.toLowerCase()]);

								}

							};


						},

						//register a listener to the selcted element in DOM
						registerScanListener : function(texfield_mode) {

							var self = this;
							this.texfield_mode = false;

							if (texfield_mode != null){
								this.removeScanListener();
								this.texfield_mode = texfield_mode;
							}

							if(!this.texfield_mode && (WL.Client.getEnvironment() == WL.Environment.IPAD || WL.Client.getEnvironment() == WL.Environment.IPHONE)) {

								var success = function(data){

									self._keyPressInChar(data);

								};

								cordova.exec(success, null, "Keyboard", "startListeningOnViewController", []);

							}
							else {

								var dom_selector = this.select != 'document'? this.select : document;
								this._scanlistener = on(query(dom_selector),
										"keydown",
										function(event) {

									self._signalKeyPress(event.keyCode);

								});


								registered_listeners[this.select] =   this;
							};

							/*Registering unload to destroy the listener on page destroy/ navigation to different page
                      	  baseUnload.addOnUnload(function(){

                      		  Logger.trace('Unloading the listener')
                      		  self.removeScanListener();

                      	  });*/




						},



						removeScanListener: function(){

							if(!this.texfield_mode && (WL.Client.getEnvironment() == WL.Environment.IPAD || WL.Client.getEnvironment() == WL.Environment.IPHONE)) {

								cordova.exec(null, null, "Keyboard", "stopListeningOnViewController", []);

							}
							else{
								if (this.texfield_mode)
									this.texfield_mode = false;

								existing_listener = registered_listeners[this.select];
								if (existing_listener){
									existing_listener._scanlistener.remove();
									delete registered_listeners[this.select];

								}
								if(this._scanlistener)
									this._scanlistener.remove();


							}

						},

						_keycode_shifted_keys: {
							"/": "?",
							".": ">",
							",": "<",
							"\'": "\"",
							";": ":",
							"[": "{",
							"]": "}",
							"\\": "|",
							"`": "~",
							"=": "+",
							"-": "_",
							"1": "!",
							"2": "@",
							"3": "#",
							"4": "$",
							"5": "%",
							"6": "^",
							"7": "&",
							"8": "*",
							"9": "(",
							"0": ")"
						},

						_keycode_dictionary: {
							8: "backspace",
							9: "tab",
							12: "num",
							13: "enter",
							16: "shift",
							17: "ctrl",
							18: "alt",
							19: "pause",
							20: "caps",
							27: "esc",
							32: " ",
							33: "pageup",
							34: "pagedown",
							35: "end",
							36: "home",
							37: "left",
							38: "up",
							39: "right",
							40: "down",
							44: "print",
							45: "insert",
							46: "delete",
							48: "0",
							49: "1",
							50: "2",
							51: "3",
							52: "4",
							53: "5",
							54: "6",
							55: "7",
							56: "8",
							57: "9",
							65: "a",
							66: "b",
							67: "c",
							68: "d",
							69: "e",
							70: "f",
							71: "g",
							72: "h",
							73: "i",
							74: "j",
							75: "k",
							76: "l",
							77: "m",
							78: "n",
							79: "o",
							80: "p",
							81: "q",
							82: "r",
							83: "s",
							84: "t",
							85: "u",
							86: "v",
							87: "w",
							88: "x",
							89: "y",
							90: "z",
							91: "cmd",
							92: "cmd",
							93: "cmd",
							96: "num_0",
							97: "num_1",
							98: "num_2",
							99: "num_3",
							100: "num_4",
							101: "num_5",
							102: "num_6",
							103: "num_7",
							104: "num_8",
							105: "num_9",
							106: "num_multiply",
							107: "num_add",
							108: "num_enter",
							109: "num_subtract",
							110: "num_decimal",
							111: "num_divide",
							124: "print",
							144: "num",
							145: "scroll",
							186: ";",
							187: "=",
							188: ",",
							189: "-",
							190: ".",
							191: "/",
							192: "`",
							219: "[",
							220: "\\",   //Using double slashes to be discussed. for now directly comparing keyCode.
							221: "]",
							222: "\'",
							223: "`",
							224: "cmd",
							225: "alt",
							57392: "ctrl",
							63289: "num",
							59: ";"
						},

						inverted_keycode_dictionary: {
							"backspace": 8,
							"tab":9,
							"num": 12,
							"enter":13,
							"shift":16,
							"ctrl": 17,
							"alt":18,
							"pause":19,
							"caps":20,
							"esc":27,
							"space":32,
							"pageup":33,
							"pagedown":34,
							"end":35,
							"home":36,
							"left":37,
							"up":38,
							"right":39,
							"down":40,
							"print":44,
							"insert":45,
							"delete":46,
							"0":48,
							"1":49,
							"2":50,

							"3":51,

							"4":52,

							"5":53,

							"6":54,

							"7":55,

							"8":56,

							"9":57,

							"a":65,

							"b":66,

							"c":67,

							"d":68,

							"e":69,

							"f":70,

							"g":71,

							"h":72,

							"i":73,

							"j":74,

							"k":75,

							"l":76,

							"m":77,

							"n":78,

							"o":79,

							"p":80,

							"q":81,

							"r":82,

							"s":83,

							"t":84,

							"u":85,

							"v":86,

							"w":87,

							"x":88,

							"y":89,

							"z":90,

							"cmd":91,

							"cmd":92,

							"cmd":93,

							"num_0":96,

							"num_1":97,

							"num_2":98,

							"num_3":99,

							"num_4":100,

							"num_5":101,

							"num_6":102,

							"num_7":103,

							"num_8":104,

							"num_9":105,

							"num_multiply":106,

							"num_add":107,

							"num_enter":108,

							"num_subtract":109,

							"num_decimal":110,

							"num_divide":111,

							"print":124,

							"num":144,

							"scroll":145,

							";":186,

							"=":187,

							",":188,

							"-":189,

							".":190,

							"/":191,

							"`":192,

							"[":219,
							"\\": 220,   //Using double slashes to be discussed. for now directly comparing keyCode.
							"]": 221,
							"\'": 22,
							"`": 22,
							"cmd": 224,
							"alt": 225,
							"ctrl": 57392,
							"num": 63289,
							";": 59,
						},

						inverted_keycode_shifted_keys: {
							"?":"/",
							">":".",
							"<":",",
							"\"":"\'",
							":":";",
							"{":"[",
							"}":"]",
							"|":"\\",
							"~":"`",
							"+":"=",
							"_":"-",
							"!":"1",
							"@":"2",
							"#":"3",
							"$":"4",
							"%":"5",
							"^":"6",
							"&":"7",
							"*":"8",
							"(":"9",
							")":"0"
						}



					});

		});
