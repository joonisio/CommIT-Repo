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

define( "platform/translation/MessageService", 
		[ "dojo/_base/declare",
		  "dojo/json",
		  "dojo/i18n",
		  "platform/translation/_MessageBundleLoader!", //intentionally added an (!) at the end as it's a dojo plugin
		  "platform/translation/StaticMessage",
		  "platform/translation/DynamicMessage"
		     ],
	function(declare,json,i18n, artifactMessages, StaticMessage, DynamicMessage, Messages) {
		return {
			//need to get label bundle through dojo stuff
						
			name: 'MessageService',
			
			defaultBundle: 'artifact',
			
			bundles: {'artifact': artifactMessages},
			
			//contructor the parameter is the default bundle to be used  
			/**
			 * @deprecated
			 */
			init:function(bundle){
				
				this.defaultBundle = bundle; 
				
				//this.bundles[bundle] = i18n.getLocalization("platform.translation", bundle, WL.App.getDeviceLocale().replace(/_/gi,"-").toLowerCase());
			    	
			 },
			  
		    
		  //create static message check if a bundle was specified if not use the default
		    createStaticMessage:function( messageId, bundle){
		    	
		    	if(typeof bundle == 'undefined'){
		    		
		    		return new StaticMessage(this._getMessageById(this.defaultBundle, messageId));
		    	}else {
		    		return new StaticMessage(this._getMessageById(bundle, messageId));
		    	}
		    	
		    	
		    },
		 // create Dynamic message check if a bundle was specified if not use the default
		    createDynamicMessage:function(messageId, resolverClass, resolverMethod, bundle){
		    	
		    	if(typeof bundle == 'undefined'){
		    		return new DynamicMessage(this._getMessageById(this.defaultBundle, messageId),resolverClass, resolverMethod);
		    	}else {
		    		return new DynamicMessage(this._getMessageById(bundle, messageId),resolverClass, resolverMethod);
		    	}
		    	
		    	
		    	
		    },
/**@memberOf platform.translation.MessageService */
		    createResolvedMessage: function(messageId, params, bundle){
		    	var message = new DynamicMessage(); 
		    	return message.replaceParams(this._getMessageById(
					(typeof bundle != 'undefined') ? bundle : this.defaultBundle, messageId), params);
		    },
		    //retrive the bundle file
		    _getMessages:function(bundle){
				 if (this.bundles[bundle]){
					 return this.bundles[bundle];
				 }else{
					 this.bundles[bundle] = i18n.getLocalization("platform.translation", bundle, WL.App.getDeviceLocale().replace(/_/gi,"-").toLowerCase());
					 return this.bundles[bundle];
				 }
			 },
		    
			 //retrive the message
		    _getMessageById: function(bundle, messageId){
		    	var msg = this._getMessages(bundle)[messageId];
		    	if (typeof msg == 'undefined' ){
		    		msg = messageId;
		    	}
				return msg;
			 }
				
			};
		});
