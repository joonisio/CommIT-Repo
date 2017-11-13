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

define( "platform/translation/DynamicMessage", 
		[ "dojo/_base/declare",
		  "platform/translation/Message"
		     ],
	function(declare, Message) {
		return declare("platform.translation.DynamicMessage",Message, {
			//need to get label bundle through dojo stuff
			
					
			constructor:function(messageId,resolverClass, resolverMethod){
				this.textMsg = messageId;
				this.resolverClass = resolverClass;
				this.resolverMethod = resolverMethod;
			  },
			  
/**@memberOf platform.translation.DynamicMessage */
			getMessage: function(runtimeContext){
				var messageInfo = runtimeContext;
				if(this.resolverClass && this.resolverMethod){
					messageInfo = this;
				}
				var method = messageInfo.resolverFunction? messageInfo.resolverFunction : messageInfo.resolverMethod;
				if(messageInfo.resolverClass && method){
					var handlerClass = runtimeContext.application[messageInfo.resolverClass];
					if(handlerClass && handlerClass[method]){
						var params = handlerClass[method](runtimeContext);
						return this.replaceParams(this.textMsg, params);
					}
				}
				return this.textMsg;
			},
			
			replaceParams : function(strings, params) {
				var returnString = strings;
				if(typeof params == 'string') {
					params.apply();
				}
			    for (index in params) {
			    	returnString = returnString.replace("{" + index + "}", params[index]);
			    }
			    return returnString;
			}
				
			});
		});
