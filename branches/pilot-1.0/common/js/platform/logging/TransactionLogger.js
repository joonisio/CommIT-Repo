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

define("platform/logging/TransactionLogger",
	   ["exports",
	    "dojo/_base/lang",
	    "platform/logging/Logger"],
function (thisModule, lang, Logger) {
	var logEntries = [];
	var classBody = {
			/** @memberOf platform.logging.TransactionLogger */
			logError: function(logMessage, error){
				if(Logger.level >= 2){
					var errorStr = "NO LOGGABLE ERROR";
					if(error){
						if (error.error){
							error = error.error;
						}
						if (typeof error == 'string'){
							errorStr = error;
						}else if (error.stack){
							errorStr = error.stack;
						}else if (error.message){
							errorStr = error.message;
						}else if (error.invocationResult){
							if(error.invocationResult.errors){
								errorStr = JSON.stringify(error.invocationResult.errors);
							}
							else{
								errorStr = JSON.stringify(error.invocationResult);
							}
						}else if (error.errorMsg){
							errorStr = error.errorMsg;
						}else	{
							try{
								errorStr =  JSON.stringify(error);
							}
							catch(e){
								//Do nothing 
							}
						}
					}
					this.error(logMessage + " Error: " + errorStr);
				}
			},
			
			timerStart: function(string, level) {
				Logger.timerStart(string, level);
			},
				
			timerEnd: function(string, level){
				if (Logger.level >= 2){
					if (logEntries.length >= 250){
						logEntries.shift();
					}
					logEntries.push(string + " END");
				}
				Logger.timerEnd(string, level);
			},
			
			log : function(string, level, params) {
				if (!(level == null || level == undefined ) || level <= Logger.level && string){
					if (logEntries.length >= 250){
						logEntries.shift();
					}
					logEntries.push(string);
				}
				Logger.log(string, level, params);
			},
			
			clear: function(){
				return logEntries = [];
			},

			getTransactionLog: function(){
				return logEntries;
			}
			
	};
	/** @class platform.logging.TransactionLogger */
	return lang.mixin(thisModule, Logger, classBody);
	
});
