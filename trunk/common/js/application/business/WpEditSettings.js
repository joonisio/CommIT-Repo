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

define("application/business/WpEditSettings",
[ "dojo/_base/declare"], 
  function(declare) {
	return {
/**@memberOf application.business.WpEditSettings */
		shouldEditAsset : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					return result[0].get("editasset");
					
				}
			}
			return true;
		},
		
		shouldEditLocation : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					return result[0].get("editloc");
					
				}
			}
			return true;
		},
		
		shouldEditLabor : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					return result[0].get("editwplab");
					
				}
			}
			return true;
		},
		
		shouldEditMaterial : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					return result[0].get("editwpmat");
					
				}
			}
			return true;
		},
		
		shouldEditTool : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					return result[0].get("editwptool");
					
				}
			}
			return true;
		},
		
		shouldEditCalPoint : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					if(result[0].get("editafal") != undefined)
						return result[0].get("editafal");
					
				}
			}
			return true;
		},

		shouldAddCalPoint : function(wpSet, status, orgid) {
			if(wpSet){
				var result = wpSet.find("status == $1 && orgid == $2",status, orgid);
				if (result.length > 0) {
					if(result[0].get("plusceditpoint") != undefined)
						return result[0].get("plusceditpoint");
					
				}
			}
			return true;
		}
		
	};
});
