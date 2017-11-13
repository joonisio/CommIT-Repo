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

define("platform/auth/UserManager",
[ "platform/store/_ResourceMetadataContext",
  "dojo/_base/lang"], function(ResourceContext, lang) {
	var _infoCache;
	return {
/**@memberOf platform.auth.UserManager */
		addInfoToCurrentUser: function(info /*object*/){
			_infoCache = info;
		},
		getInfo : function(attrName){
			return _infoCache[attrName];
		},
		getCurrentUser: function(){
			return _infoCache['userid'];
		}
	};
});
