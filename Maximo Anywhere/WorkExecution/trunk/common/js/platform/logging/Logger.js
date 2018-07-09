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

define(
		"platform/logging/Logger",
		["dojo/_base/declare",
		  "dojo/_base/lang",
		  "dojo/_base/array",
		  "dojo/json",
		  "platform/util/PlatformConstants",
		  "platform/translation/MessageService",
		  "dojo/number"],
		function (declare, lang, array, json, PlatformConstants, MessageService, numberUtil) {
			
			 var messageCache = [];
			 var windowsLogFileName = null;
			/** @class platform.logging.Logger */
			return {
		        name: 'logger',
		        level: 0,
		        timeStamps: {},
		        timers: {},
		        timeTrackers: {},
		        filters: null,
		        reportEnableError: false,
		        reportEnableInfo: false,
		        reportEnableDebug: false,
		        flushingBuffer: false,
		        loggerStore: null,
		        loggerId: 1,
		        //Start the logLimit high so we don't lose logs, then load from SystemProperties
		        logLimit: 0,

		        /** @memberOf platform.logging.Logger */
		        init: function (options) {
		            lang.mixin(this, options);
		            if (options.logLevel) {
		                this.level = options.logLevel;
		                
		                //If the app was built with a non-standard logLevel setting, we need to capture logs
		                if (this.level > 0) {
		                	localStorage.reportEnableError = true;
		                    localStorage.reportEnableInfo = true;
		                }
		                if (this.level > 1) {
		                    localStorage.reportEnableDebug = true;
		                } 
		            }

		            if (this.filters) {
		                this.filters = this.filters.split(',');
		            }

		            if (!localStorage.reportEnableError || localStorage.reportEnableError == "false") {
		                this.reportEnableError = false;
		            } else {
		                this.reportEnableError = true;
		            }

		            if (!localStorage.reportEnableInfo || localStorage.reportEnableInfo == "false") {
		                this.reportEnableInfo = false;
		            } else {
		                this.reportEnableInfo = true;
		                if (this.level < 1) {
		                    this.level = 1;
		                }
		            }

		            if (!localStorage.reportEnableDebug || localStorage.reportEnableDebug == "false") {
		                this.reportEnableDebug = false;
		            } else {
		                this.reportEnableDebug = true;
		                this.level = 2;
		            }
		            //Wait until I've loaded the level
		            this._initWorklightLogger(this.level);
		            if (localStorage.logLimit && localStorage.logLimit != "undefined") {
		                this.logLimit = localStorage.logLimit;
		            }
		            
		         
		        	if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8) {
		        		this._preventWindowsCrash();
		            }
		        	
		        	if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8 && this.level==2) {
			             this._enableWindowsLogFile();
		        	}
		        },
		        
		        /* This handles any error reporting on Windows
		         * If we don't do this, the app will actually crash whenever any javascript exception is thrown
		         */
		        _preventWindowsCrash: function() {
		        	if (WinJS && WinJS.Application) {
			        	//Catch and handle error by default
		                WinJS.Application.onerror = $.proxy(function (eventInfo) {
		                    var error;
		                    if (eventInfo.detail && eventInfo.detail.error) {
		                        error = eventInfo.detail.error;
		                        this.error("fatal error file: "+error.filename + " lineNumber: " + error.lineno + " message: " + error.message);
		                    } else {
		                        error = eventInfo;
		                        this.error("fatal error file: "+error.filename + " lineNumber: " + error.lineno + " message: " + error.message);
		                    }
		                    //Logged the error, keep the app from crashing
		                    if (UI && UI.application && UI.application.debug) {
		                    	var md = Windows.UI.Popups.MessageDialog;
		                    	var msg = new md(MessageService.createStaticMessage("checkAppLog").getMessage(), MessageService.createStaticMessage("JavascriptError").getMessage());
		                    	msg.showAsync();
		                    }
		                    return true;
		                },this);//Need to bind to this so I can log the error
		        	}
		        },
		        
		        _enableWindowsLogFile: function() {
		        	 /**
                    *
                    *This section enables persistent logging on Windows apps if debug is true for the app (instead of the traditional javascript logging)
                    * It writes a log file called log-<timestamp>Z.log to this directory:
                    * C:\Users\<yourusername>\AppData\Local\Packages\<the app UUID>\LocalState
                    * Usually you can just look into the most recently updated UUID directory to find the currently running app
                    */
	                
	               
                    // choose where the file will be stored:
                    var fileDestination = Windows.Storage.ApplicationData.current.localFolder;
                    window.console.log("log file destination: " + fileDestination.path);
                    var logger = new WinJS.Promise(function (complete) {
                    	if (!windowsLogFileName) {
	                        var logfilename = new Date().toISOString().replace(/[:-]/g, "");
	                        logfilename = "log-" + logfilename + ".log";
	                        fileDestination.createFileAsync(logfilename,
	                            Windows.Storage.CreationCollisionOption.generateUniqueName)
	                                .done(function (file) {
	                                	windowsLogFileName = file;
	                                    complete(file);
	                                });
                    	} else {
                    		//Already created log file
                    		complete(windowsLogFileName);
                    	}
                    });

                    var actionFn = function (message, tag, type) {
                        logger.then(function (file) {
                            var m = WinJS.Utilities.formatLog(message, tag, type);
                            try {
                                Windows.Storage.FileIO.appendTextAsync(file, m).done();
                            }
                            catch (error) { };
                        });
                    };

                    WinJS.Utilities.startLog({ action: actionFn });
	                
	                function logToFile(message) {
	                    messageCache.push(message);
	                };

	                setInterval(this._flushLogBuffer, 5000);

	                window.console.log = logToFile;
	                window.console.error = logToFile;
	                window.console.warn = logToFile;
	                window.console.info = logToFile;

		        },
		        
		        _flushLogBuffer: function() {
		        	if (messageCache && messageCache.length > 0 && !this.flushingBuffer) {
		        		this.flushingBuffer = true;
                        var loglines = messageCache.join("\r\n");
                        WinJS.log(loglines);
                        messageCache = [];
                        this.flushingBuffer = false;
                    }
		        },

		        _initWorklightLogger: function (desiredLevel) {
		            //Worklight logger
		            switch (desiredLevel) {
		                case (0):
		                    WL.Logger.config({ level: 'FATAL' });
		                    break;
		                case (1):
		                    WL.Logger.config({ level: 'INFO' });
		                    break;
		                case (2):
		                    WL.Logger.config({ level: 'DEBUG' });
		                    break;
		                default:
		                    WL.Logger.config({ level: 'FATAL' });
		                    break;
		            }

		        },



		        getMessage: function (msg, params, ts, language) {
		            //to be defined if will use translation or not
		            var returnMessage = { string: msg };
		            if (params) {
		                returnMessage.string = this.replaceParams(returnMessage.string, params);
		            }
		            if (ts) {
		                returnMessage.string = ts + ":" + returnMessage.string;
		            }
		            return returnMessage;
		        },

		        replaceParams: function (string, params) {
		            var returnString = string;
		            for (index in params) {
		                returnString = returnString.replace("{" + index + "}", params[index]);
		            }
		            return returnString;
		        },

		        setLevel: function (level) {
		            this.level = level;
		            this._initWorklightLogger(level);
		            if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8 && this.level==2) {
		            	this._enableWindowsLogFile();
		            }
		        },

		        enableDebug: function () {
		            if (this.level < 2)
		                this.setLevel(2);
		        },
		        enableInfo: function () {
		            if (this.level < 1)
		                this.setLevel(1);
		        },
		        disableDebug: function () {
		            if (this.reportEnableInfo)
		                this.setLevel(1);
		            else
		                this.setLevel(0);
		        },
		        disableInfo: function () {
		            this.setLevel(0);
		        },

		        getTSKey: function (params) {
		            var key = "";
		            for (var paramIndex in params) {
		                key += params[paramIndex];
		            }
		            return key;
		        },

		        clear: function () {
		            this.loggerStore = null;
		        },

		        _addLoggerReport: function (logMsg) {
		            if (this.logLimit == 0) {
		                this._reduceLogLimit();
		            }

		            if (this.loggerStore == null) {
		                var perfData = [{ id: this.loggerId, msg: logMsg }];
		                this.loggerStore = new dojo.store.Memory({ data: perfData });
		            } else {
		                this.loggerStore.put({ id: this.loggerId, msg: logMsg });           
		            }

		            this.loggerId += 1;
		            if (this.logLimit != 0 && this.loggerId > this.logLimit) {
		                this.loggerId = 1;
		                this.clear();
		            }
		        },

		        _reduceLogLimit: function () {
		            var self = this;
		            require(["platform/store/SystemProperties"],
							function (SystemProperties) {
							    if (SystemProperties) {
							        var limit = SystemProperties.getLogLineLimit();
							        if (!limit ||
											limit == undefined ||
											limit == NaN ||
											limit == '') {
							            return;
							        }
							        if (limit != self.logLimit) {
							            self.logLimit = numberUtil.parse(limit);
							            localStorage.logLimit = numberUtil.parse(limit);
							        }
							    }
							});
		        },

		        writeToLog: function (msg, level) {
		            if (!msg.string) {
		                msg = { string: msg };
		            }
		            if (this.filters && level > 0) {
		                if (!dojo.some(this.filters, function (filter) {
					    	return msg.string.indexOf(filter) > -1;
		                })) {
		                    return;
		                }
		            }
		            switch (level) {
		                case (0):
		                    console.error(this._formatLogEntry(level, msg.string));
		                    if (this.reportEnableError) {
		                        this._addLoggerReport(this._formatLogEntry(level, msg.string));
		                    }
		                    break;
		                case (1):
		                    console.warn(this._formatLogEntry(level, msg.string));
		                    if (this.reportEnableDebug) {
		                        this._addLoggerReport(this._formatLogEntry(level, msg.string));
		                    }
		                    break;
		                case (2):
		                default:
		                    console.log(this._formatLogEntry(level, msg.string));
		                    if (this.reportEnableInfo) {
		                        this._addLoggerReport(this._formatLogEntry(level, msg.string));
		                    }
		                    break;
		            }
		        },

		        _formatLogEntry: function(logLevel, message) {
		        	var levelString = 'ERROR';
		        	switch (logLevel) {
		        	case (1):
		        		levelString='INFO';
		        	    break;
		        	case (2):
		        		levelString='DEBUG';
		        		break;
		        	}
		        	return '[' + MessageService.createStaticMessage(levelString).getMessage(this) + '] ' + dojo.date.locale.format(new Date(), { datePattern: "yyyy-MM-dd", timePattern: "HH:mm:ss.SSS" }) + ' ' + message;
		        },
		        
		        profileStart: function (string) {
		            if (this.level >= 3) {
		                string = PlatformConstants.LOG_PROFILE + string;
		                if (this.filters && level > 0) {
		                    if (!dojo.some(this.filters, function (filter) {
						    	return string.indexOf(filter) > -1;
		                    })) {
		                        return;
		                    }
		                }
		                console.profile(string);
		            }
		        },

		        profileEnd: function (string) {
		            if (this.level >= 3) {
		                console.profileEnd(PlatformConstants.LOG_PROFILE + string);
		            }
		        },

		        timerStart: function (string, level) {
		        	if (!level) {
		        		level=1;
		        	}
		            if (trackTimeEnabled) {
		                // we always want to record to TimeTrack
		                var trackTimer = new TrackTime("Logger -> TimeTrack", string, string, false);
		                trackTimer.startTracking();
		                this.timeTrackers[string] = trackTimer;
		            }
		            
		            if(this.canLog(level)) {
		            	string = PlatformConstants.LOG_TIMER + string;
			            if (this.filters && level > 0) {
			            	if (!dojo.some(this.filters, function (filter) {
							    return string.indexOf(filter) > -1;
			                })) {
			                    return;
			                }
			            }
			            this.timers[string] = { start: (new Date()).valueOf() };
		            }
		        },

		        timerEnd: function (string, level) {
		        	if (!level) {
		        		level=1;
		        	}
		            if (trackTimeEnabled) {
		                var timeTracker = this.timeTrackers[string];
		                if (timeTracker) {
		                    timeTracker.stopTracking();
		                    delete this.timeTrackers[string];
		                }

		            }
					if (this.canLog(level)) {
						var endDate = new Date();
						string = PlatformConstants.LOG_TIMER + string;
						var timer = this.timers[string];
						if (!timer) {
							// console.log('no timer with id ['+string+'] has been started');
							return;
						}
						console.log(this._formatLogEntry(level, string + ': ' + (endDate.valueOf() - timer.start) + 'ms'));
						delete this.timers[string];
					}
		        },

		        log: function (string, level, params) {
		        	if(this.canLog(level)) {
		        		var ts = this.timeStamps[this.getTSKey(params)];
			            if (ts) {
			            	ts = ((new Date()).getTime() - ts.getTime()) / 1000;
			            }
			            var msg = this.getMessage(string, params, ts);
			            if (level == undefined)
			               level = 2;
			            this.writeToLog(msg, level);
			            
		            }
		        },

		        systemLog: function (string, level, params) { //no localization to avoid redundancy
		        	if(this.canLog(level)) {
		        		var msg = this.getMessage(string, params, null, 'EN');
			            this.writeToLog(msg, 1); //write out English message as a warning
		            }
		        },
		        trace: function (string, params) {
		            this.log(PlatformConstants.LOG_TRACE + string, 2, params);
		        },
		        warn: function (string, params) {
		            this.log(string, 1, params);
		        },
		        error: function (string, params) {
		            this.log(string, 0, params);
		            //Always flush the LogBuffer on error to catch critical exceptions
		            this._flushLogBuffer();
		        },
		        traceJSON: function (string, jsonObject) {
		        	var level = 2;
		        	var jsonString = "";
		        	if(this.canLog(level)){ 
		        		try {
		        			jsonString = JSON.stringify(jsonObject);
		        		} finally {
		        			this.log(PlatformConstants.LOG_TRACE + string + " json: " + jsonString, 2);
		        		}
		        	}
		        },
		        errorJSON: function (string, jsonObject) {
		        	var level = 0;
		        	if (level <= this.level) {
		        		var jsonString = "";
		        		try {
		        			jsonString = JSON.stringify(jsonObject);
		        		} finally {
		        			this.log(string + " json: " + jsonString, 0);
		        		}
		        	}
		        },
		        logEntry: function (params) {
		            this.timeStamps[this.getTSKey(params)] = new Date();
		            this.log("entry", 2, params);
		        },

		        logExit: function (className, funcName, id) {
		            this.log("exit", [className, 2, funcName, id]);
		        },

		        logObject: function (object, level, indent) {
		        	if(this.canLog(level))
			        	this.writeToLog(json.stringify(object), 2);
			           
		        },
		        
		        canLog: function(level){
		        	if(level == null || isNaN(level)){
		        		return false;
		        	}
		        	
		        	return (level <= this.level);
		        }
		        
		    };
		});
