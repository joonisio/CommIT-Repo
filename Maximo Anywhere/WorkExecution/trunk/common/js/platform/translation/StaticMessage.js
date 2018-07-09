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

define( "platform/translation/StaticMessage", 
		[ "dojo/_base/declare",
		  "platform/translation/Message"
		     ],
	function(declare, Message) {
		return declare("platform.translation.StaticMessage",Message, {
			//need to get label bundle through dojo stuff
			
			
			constructor:function(message){
				
				this.textMsg = message;
			    	
			  },
			  
/**@memberOf platform.translation.StaticMessage */
			getMessage: function(){
				return this.textMsg;
			}
				
			});
		});
