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

define("platform/exception/PlatformRuntimeException", 
		[ "dojo/_base/declare",
		"platform/translation/MessageService" ],
function(declare, MessageService) {
	
	function removeConstructorAndDeclareEntriesFromStack(currentStack){
		if (!currentStack){
			return "";
		}
		
		var stackAsArray = currentStack.split('\n');
		if (stackAsArray.length > 3){
			stackAsArray = stackAsArray.slice(3);
		}
		return stackAsArray.join('\n');
	}
	
	return declare( null , {
		stack: null,
		
		constructor : function(messageKey, params) {
			this.messageKey = this.name = messageKey;
			this.params = params || [];
			
			var cleanStack = removeConstructorAndDeclareEntriesFromStack(new Error().stack);
			this.stack = this.getMessage() + '\n' + cleanStack;
			//windows 8 does not have this method and was throwing exception
			if (WL.Client.getEnvironment() != WL.Environment.WINDOWS8 ){
				console.trace();
			}
		},

/**@memberOf platform.exception.PlatformRuntimeException */
		getMessageKey : function() {
			return this.messageKey;
		},

		getMessage : function() {
			return MessageService.createResolvedMessage(this.messageKey, this.params);
		},
		
		toString : function() {
    		return "messageKey=" + this.messageKey + ", name=" + this.name + ", params="+this.params;
    	}

   	});
});
