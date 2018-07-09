/**
 * @file Manages logs report of each application.
 * 
 * @license
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


/**
 * Module returning a class to handle application logger report.
 * @module platform/logging/handler/LoggerReportHandler
 * @requires module:dojo/_base/declare
 * @requires module:dojo/store/Memory
 * @requires module:dojo/cookie
 * @requires module:platform/handlers/_ApplicationHandlerBase
 * @requires module:platform/model/ModelService
 * @requires module:platform/logging/Logger
 * @requires module:platform/store/SystemProperties
 * @requires module:dojo/number
 */
define("platform/logging/handler/LoggerReportHandler",
	   ["dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	      "platform/model/ModelService",
	      "dojo/store/Memory",
	      "dojo/cookie",
	      "platform/logging/Logger",
		  "platform/store/SystemProperties",
		  "dojo/number",
		  "platform/logging/TransactionLogger",
		  "platform/store/PersistenceManager",
		  "platform/translation/MessageService",
		  "dojo/_base/array",
		  "dojo/_base/lang"],
function (declare, ApplicationHandlerBase, ModelService, Memory, cookie, Logger, SystemProperties, numberUtil, TransactionLogger, PersistenceManager, MessageService, arrayUtil, lang) {

    /**
     * Class to to handle application logger report.
     * @class platform.logging.handler.LoggerReportHandler
     * @extends {platform.logging.Logger}
     */
    return declare(ApplicationHandlerBase, {


        /**
         * @memberOf platform.logging.handler.LoggerReportHandler
		 * Sets the size of the Log.
		 * The limits is based on System Properties.
		 * @returns {void}
		 * @private
		 */
        _setLoggerLimit: function () {
            var limit = SystemProperties.getLogLineLimit();

            if (!limit ||
					limit == undefined ||
					limit == NaN ||
					limit == '') {
                return; // 1 minute
            }
            try {
                Logger.logLimit = numberUtil.parse(limit);
                localStorage.logLimit = numberUtil.parse(limit);
            }
            catch (e) {
                Logger.log(e);
                Logger.logLimit = limit;
                localStorage.logLimit = limit;
            }
        },

        /**
		 * Toggles logger of Error type.
		 * If Error type toggles to disable consequently Info Logger is also disabled
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        enableDisableLoggerErro: function (eventContext) {

            if (Logger.reportEnableError) {
                Logger.reportEnableError = false;
                localStorage.reportEnableError = Logger.reportEnableError;

                //Disabling Info log
                Logger.reportEnableInfo = true;
                this.enableDisableLoggerInfo(eventContext);

            } else {
                Logger.reportEnableError = true;
                localStorage.reportEnableError = Logger.reportEnableError;

            }
            this._setLoggerLimit();
        },

        /**
		 * Toggles logger of Info type.
		 * If Info type toggles to disable consequently Debug Logger is also disabled
		 * If Info type toggles to enable consequently Error Logger is also enabled
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        enableDisableLoggerInfo: function (eventContext) {

            if (Logger.reportEnableInfo) {
                Logger.disableInfo();
                Logger.reportEnableInfo = false;
                localStorage.reportEnableInfo = Logger.reportEnableInfo;

                //Disabling Debug log
                Logger.reportEnableDebug = true;
                this.enableDisableLoggerDebug(eventContext);

            } else {
                Logger.enableInfo();
                Logger.reportEnableInfo = true;
                localStorage.reportEnableInfo = Logger.reportEnableInfo;

                //Enabling Error log
                Logger.reportEnableError = false; //Setting false to enable error log
                this.enableDisableLoggerErro(eventContext);


            }
            this._setLoggerLimit();
        },

        /**
		 * Toggles logger of Debug type.
		 * If Debug type toggles to enable consequently Info Logger is also enabled
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        enableDisableLoggerDebug: function (eventContext) {

            if (Logger.reportEnableDebug) {
                Logger.disableDebug();
                Logger.reportEnableDebug = false;
                localStorage.reportEnableDebug = Logger.reportEnableDebug;

            } else {
                Logger.enableDebug();
                Logger.reportEnableDebug = true;
                localStorage.reportEnableDebug = Logger.reportEnableDebug;

                //Enabling Info log
                Logger.reportEnableInfo = false; //Setting false to enable info log
                this.enableDisableLoggerInfo(eventContext);

            }

            this._setLoggerLimit();
        },

        /**
		 * Sets the Error Logger label in menu.
		 * Sets the menu label according to its current state
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        setLabelError: function (eventContext) {

            require(["platform/translation/MessageService"],
					function (MessageService) {
					    if (Logger.reportEnableError) {
					        eventContext.set('label', MessageService.createStaticMessage('Disable Error Logging').getMessage(this));
					    } else {
					        eventContext.set('label', MessageService.createStaticMessage('Enable Error Logging').getMessage(this));
					    }
					});

        },

        /**
		 * Sets the Info Logger label in menu.
		 * Sets the menu label according to its current state
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        setLabelInfo: function (eventContext) {

            require(["platform/translation/MessageService"],
					function (MessageService) {
					    if (Logger.reportEnableInfo) {
					        eventContext.set('label', MessageService.createStaticMessage('Disable Info Logging').getMessage(this));
					    } else {
					        eventContext.set('label', MessageService.createStaticMessage('Enable Info Logging').getMessage(this));
					    }
					});

        },

        /**
		 * Sets the Debug Logger label in menu.
		 * Sets the menu label according to its current state
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        setLabelDebug: function (eventContext) {

            require(["platform/translation/MessageService"],
					function (MessageService) {
					    if (Logger.reportEnableDebug) {
					        eventContext.set('label', MessageService.createStaticMessage('Disable Debug Logging').getMessage(this));
					    } else {
					        eventContext.set('label', MessageService.createStaticMessage('Enable Debug Logging').getMessage(this));
					    }
					});

        },

        /**
		 * Clear the application log.
		 * Clear the list of logs from application
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        clear: function (eventContext) {
            Logger.clear();
            this.renderLoggerReport(eventContext);
        },

        /**
		 * Clear the application log.
		 * Clear the list of logs from application
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        clearTransLog: function (eventContext) {
            TransactionLogger.clear();
            eventContext.ui.getCurrentViewControl().refresh();
        },

        emailCurrentTranslog: function (eventContext) {
            this.emailCurrent(eventContext, true);
        },

        /**
		 * Sends email of the current log.
		 * @param 	{eventContext}	Context
		 * @returns {void}
		 * @public
		 */
        emailCurrent: function (eventContext, sendTransLog) {
            //TODO: Update Labor and Crew fields with any new values
            var cur = this;

            WL.Device.getNetworkInfo(function (networkInfo) {
                cur._creatTextEmail(networkInfo, eventContext, sendTransLog);
            });

        },

        _sendEmail: function (body, eventContext) {
            require(["platform/email/EmailPlugin", "platform/translation/MessageService"],
					function (EmailPlugin, MessageService) {
					    var emailContent = {
					        subject: null,
					        body: null,
					        to: ["email@to.send"],
					        cc: null,
					        bcc: null,
					        attachments: null,
					        isHtml: false
					    };
					    emailContent['body'] = body;
					    emailContent['subject'] = MessageService.createStaticMessage('Logger Report').getMessage(this);

					    var email = new EmailPlugin();
					    email.sendEmail(emailContent, eventContext);
					});
        },

        /**
		 * Prepares log text to email.
		 * Prepares the email content with the current log
		 * @param 	{JSON}		WL.Device.getNetworkInfo
		 * @returns {String}	Email message
		 * @private
		 */
        _creatTextEmail: function (networkInfo, eventContext, sendTransLog) {
            var inner = '';
            var self = this;
            require(["platform/translation/MessageService","platform/auth/UserAuthenticationManager"],
					function (MessageService, UserAuthenticationManager) {
					    inner += MessageService.createStaticMessage('Device Info').getMessage(this) + ' <br />';

					    inner += '============================================================================================================= <br />';

					    inner += MessageService.createStaticMessage('Operating System: ').getMessage(this);

					    inner += WL.Client.getEnvironment() + ", ";

					    var username = UserAuthenticationManager._getCurrentUser();
					    if (username) {
					        inner += MessageService.createStaticMessage('username').getMessage(this);
					        inner += username + ", ";
					    }

					    inner += MessageService.createStaticMessage('Locale/Language: ').getMessage(this);

					    inner += WL.App.getDeviceLocale() + "/" + WL.App.getDeviceLanguage() + ", ";


					    inner += MessageService.createStaticMessage('Connected: ').getMessage(this);
					    if (networkInfo) {
					        if (networkInfo.isNetworkConnected == 'true') {
					            inner += MessageService.createStaticMessage('Yes').getMessage(this);
					        } else {
					            inner += MessageService.createStaticMessage('No').getMessage(this);
					        }
					    }


					    inner += ", " + MessageService.createStaticMessage('carrier Name: ').getMessage(this);

					    if (networkInfo) {
					        inner += networkInfo.carrierName + ", <br />";
					    }


					    inner += MessageService.createStaticMessage('Network Connection Type: ').getMessage(this);

					    if (networkInfo) {
					        inner += networkInfo.networkConnectionType + ", ";
					    }



					    inner += MessageService.createStaticMessage('Telephony Network Type: ').getMessage(this);

					    if (networkInfo) {
					        inner += networkInfo.telephonyNetworkType + ", <br />";
					    }

					    inner += '============================================================================================================= <br />';
					    inner += MessageService.createStaticMessage('Logging Data').getMessage(this) + ' <br />';
					    inner += '============================================================================================================= <br />';


					    inner += MessageService.createStaticMessage('Message').getMessage(this) + '<br />';
					    if (sendTransLog) {
					        var transLog = TransactionLogger.getTransactionLog();
					        if (transLog.length == 0) {
					            inner += MessageService.createStaticMessage('No data to display ').getMessage(this);
					        }
					        else {
					            arrayUtil.forEach(transLog, function (entry) {
					                inner += entry + ", " + "<br />";
					            });
					        }
					        if (WL.Client.getEnvironment() != WL.Environment.WINDOWS8) {
						        inner = inner.replace(/<br\s*[\/]?>/gi, "\n");
						    }
					        self._sendEmail(inner, eventContext);
					    }
					    else if (Logger.loggerStore != null){
	                        Logger.loggerStore.query(function(object) {
	                             inner+=	object.msg + ", "  + "<br />";
	                        });
		                    inner +='============================================================================================================= <br />';
		                    inner += MessageService.createStaticMessage('End').getMessage(this) + ' <br />';
		                    inner +='============================================================================================================= <br />';
		                    //Need to preserve the line breaks for Windows Tablet environments
						    if (WL.Client.getEnvironment() != WL.Environment.WINDOWS8) {
						    	inner = inner.replace(/<br\s*[\/]?>/gi,"\n");
						    }
		                    self._sendEmail(inner, eventContext);
        				}
					    else {
				            //JSON Store was cleared
				            inner += '============================================================================================================= <br />';
				            inner += MessageService.createStaticMessage('End').getMessage(this) + ' <br />';
				            inner += '============================================================================================================= <br />';
				            //Need to preserve the line breaks for Windows Tablet environments
				            if (WL.Client.getEnvironment() != WL.Environment.WINDOWS8) {
				                inner = inner.replace(/<br\s*[\/]?>/gi, "\n");
				            }
				            this._sendEmail(inner, eventContext);
					    } 
					    
					});

        },

        renderTransLoggerReport: function (eventContext) {
		    var self = this;
		    var inner = '';
		    var writeStaging = function(stagedTransactions){
		    	inner += self._writeTransactions(stagedTransactions, 'Staged Transactions');
		    };
		    var writeTransactions = function(transactions){
		    	inner += self._writeTransactions(transactions, 'Transactions');
		    };
		    
		    PersistenceManager.getStageTransactionRecords()
		    .then(writeStaging)
		    .otherwise(function(error){
		    	writeStaging([error]);
		    })
		    .always(function(){
			    PersistenceManager.getTransactionOfAllRecords()
			    .then(writeTransactions)
			    .otherwise(function(error){
			    	writeTransactions([error]);
			    })
			    .always(function(){
			    	self._renderLogEntries(inner, true);						    	
			    });
		    });
        },

        _renderLogEntries: function(inner, sendTransLog){
		    //inner +='<div>';
		    //table with device info
        	var self = this;
		    var tt = null;
		    if (sendTransLog) {
		        tt = dojo.query("[id='Platform.TransLoggerReport']").query("[class='mblScrollableViewContainer']");
		    } else {
		        tt = dojo.query("[id='Platform.LoggerReport']").query("[class='mblScrollableViewContainer']");
		    }
		    inner += '<table style="width: 100%"  bgcolor="white"  border="1" cellspacing="0">';
		    //build header
		    inner += '<tr>';
		    inner += '<th align=left>';
		    inner += MessageService.createStaticMessage('Message').getMessage(this);
		    inner += '</th>';

		    inner += '</tr>';

		    if (sendTransLog) {
		        var transLog = TransactionLogger.getTransactionLog();
		        if (transLog.length == 0) {
				    inner += '<tr>';
				    inner += '<td>';
		            inner += MessageService.createStaticMessage('No data to display ').getMessage(this);
				    inner += '</td>';
				    inner += '</tr>';
		        }
		        else {
		            arrayUtil.forEach(transLog, function (entry) {
		                inner = self._addMessageToTable(MessageService, entry, inner);
		            });
		        }
		        self._closeTheTable(inner, tt);
		    } else {
		        //build data from in-memory store
		        if (Logger.loggerStore == null) {
		            inner += MessageService.createStaticMessage('No data to display ').getMessage(this);
		        } else {
		            Logger.loggerStore.query(function (object) {
		                var message = object.msg;
		                inner = self._addMessageToTable(MessageService, message, inner);
		            });

		        }
		        self._closeTheTable(inner, tt);
		    }
        	
        },
        
        _writeTransactions: function(transactions, label){
		    var inner = '<table style="width: 100%"  bgcolor="white"  border="1" cellspacing="0">';
		    //build header
		    inner += '<tr>';
		    inner += '<th align=left>';
		    inner += MessageService.createStaticMessage(label).getMessage(this);
		    inner += '</th>';
		    inner += '</tr>';
		    if(transactions.length == 0){
			    inner += '<tr>';
			    inner += '<td>';
	            inner += MessageService.createStaticMessage('No data to display ').getMessage(this);
			    inner += '</td>';
			    inner += '</tr>';
		    }
		    else{
		    	arrayUtil.forEach(transactions, function(transaction){
				    inner += '<tr>';
				    inner += '<td>';
				    inner += JSON.stringify(transaction);
				    inner += '</td>';
				    inner += '</tr>';
		    		
		    	});
		    }
		    inner += '</table>';
		    inner += '<br>';
        	return inner;
        },
        
        /**
		 * Renders log report.
		 * Prepares and renders the current log.
		 * @param 	{eventContext}	Context
		 * @public
		 */
        renderLoggerReport: function (eventContext) {
             var self = this;
             WL.Device.getNetworkInfo(function (networkInfo) {
                require(["platform/auth/UserAuthenticationManager"],
						function (UserAuthenticationManager) {
						    //TimeTrack.startTracking();
						    //TimeTrack.stopTracking();
						    //var inner ='<div>';
						    //table with device info
						    var inner = '<table style="width: 100%"  bgcolor="white"  border="1" cellspacing="0">';
						    inner += '<tr>';
						    inner += '<th >';
						    inner += MessageService.createStaticMessage('Operating System').getMessage(this);
						    inner += '</th>';

						    inner += '<td>';
						    inner += WL.Client.getEnvironment();
						    inner += '</td>';

						    inner += '<th>';
						    inner += MessageService.createStaticMessage('username').getMessage(this);
						    inner += '</th>';
						    var username = UserAuthenticationManager._getCurrentUser();
						    if (username) {

						        inner += '<td>';
						        inner += username;
						        inner += '</td>';
						    }

						    inner += '</tr>';
						    inner += '<tr>';

						    inner += '<th >';
						    inner += MessageService.createStaticMessage('Locale/Language').getMessage(this);
						    inner += '</th>';

						    inner += '<td>';
						    inner += WL.App.getDeviceLocale() + "/" + WL.App.getDeviceLanguage();
						    inner += '</td>';


						    inner += '<th >';
						    inner += MessageService.createStaticMessage('Connected').getMessage(this);
						    inner += '</th>';

						    inner += '<td>';
						    if (networkInfo) {
						        if (networkInfo.isNetworkConnected == 'true') {
						            inner += MessageService.createStaticMessage('Yes').getMessage(this);
						        } else {
						            inner += MessageService.createStaticMessage('No').getMessage(this);
						        }
						    }
						    inner += '</td>';

						    inner += '</tr>';
						    //device info
						    inner += '<tr>';

						    inner += '<th >';
						    inner += MessageService.createStaticMessage('Carrier Name').getMessage(this);
						    inner += '</th>';

						    inner += '<td>';
						    if (networkInfo) {
						        inner += networkInfo.carrierName;
						    }

						    inner += '</td>';

						    inner += '<th >';
						    inner += MessageService.createStaticMessage('Network Connection Type').getMessage(this);
						    inner += '</th>';

						    inner += '<td>';

						    if (networkInfo) {
						        inner += networkInfo.networkConnectionType;
						    }

						    inner += '</td>';


						    inner += '</tr>';

						    inner += '<tr>';

						    inner += '<th >';
						    inner += MessageService.createStaticMessage('Telephony Network Type').getMessage(this);
						    inner += '</th>';

						    inner += '<td>';
						    if (networkInfo) {
						        inner += networkInfo.telephonyNetworkType;
						    }

						    inner += '</td>';

						    inner += '</tr>';

						    inner += '</table>';
						    //inner+='</div>';

						    inner += '<br>';
						    inner += '<br>';
						    inner += '<br>';

						    self._renderLogEntries(inner, false);						    	

						});
            });
        },

        _closeTheTable: function (inner, tt) {
            //No matter what close the table.
            inner += '</table>';
            //inner+='</div>';
            if (typeof window.toStaticHTML === 'function') {
                inner = window.toStaticHTML(inner);
            }
            tt.attr('innerHTML', inner);
        },

        _addMessageToTable: function (MessageService, message, inner) {

            if (message.indexOf(MessageService.createStaticMessage('INFO').getMessage(this)) > 0) {
                inner += '<tr>';
                inner += '<td >';
                inner += message;
                inner += '</td>';

                inner += '</tr>';
            } else if (message.indexOf(MessageService.createStaticMessage('DEBUG').getMessage(this)) > 0) {
                inner += '<tr>';
                inner += '<td style="color: green">';
                inner += message;
                inner += '</td>';

                inner += '</tr>';
            } else {
                inner += '<tr>';
                inner += '<td style="color: red">';
                inner += message;
                inner += '</td>';

                inner += '</tr>';
            }
            return inner;
        }


    });
});
