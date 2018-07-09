/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/handlers/CalibrationPointErrorsHandler", 
	   [ "dojo/_base/declare",
	     "application/business/CalibrationPointObject",
	     "application/handlers/CommonHandler",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/util/PlatformConstants" ],
	     
function(declare, CalibrationPoint, CommonHandler, ApplicationHandlerBase, PlatformConstants) {

	var foundErrorAttrs = ['asfoundouterror', 'asfoundproerror', 'asfounderror1', 'asfounderror2', 'asfounderror3', 'asfounderror4'];
	var leftErrorAttrs = ['asleftouterror', 'asleftproerror', 'aslefterror1', 'aslefterror2', 'aslefterror3', 'aslefterror4'];

	return declare( ApplicationHandlerBase, {

		// hide/show the as found or as left 'no errors' text
/**@memberOf application.handlers.CalibrationPointErrorsHandler */
		noAsFoundErrors : function(eventContext){
			eventContext.setDisplay(!this._hasAnyErrors(eventContext.getResource().getCurrentRecord(), foundErrorAttrs));
		},
		noAsLeftErrors : function(eventContext){
			eventContext.setDisplay(!this._hasAnyErrors(eventContext.getResource().getCurrentRecord(), leftErrorAttrs));
		},
		
		// hide/show the as found error items
		asFoundAssetError : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asfoundouterror'));
		},
		asFoundProcessError : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asfoundproerror'));
		},
		asFoundTol1Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asfounderror1'));
		},
		asFoundTol2Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asfounderror2'));
		},
		asFoundTol3Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asfounderror3'));
		},
		asFoundTol4Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asfounderror4'));
		},

		// hide/show the as left error items
		asLeftAssetError : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asleftouterror'));
		},
		asLeftProcessError : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'asleftproerror'));
		},
		asLeftTol1Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'aslefterror1'));
		},
		asLeftTol2Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'aslefterror2'));
		},
		asLeftTol3Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'aslefterror3'));
		},
		asLeftTol4Error : function(eventContext){
			eventContext.setDisplay(this._hasError(eventContext.getResource().getCurrentRecord(), 'aslefterror4'));
		},
		
		_hasError : function(rec, attribute){
			// check all error fields for values
			return true;
			if (rec && rec.get(attribute) != null){
				return true;
			}
			return false;
		},
		
		_hasAnyErrors : function(rec, attrList){
			// check all error fields for values
			for (var i=0; i<attrList.length; i++){
				if (this._hasError(rec, attrList[i])) {
					return true;
				}
			}
			return false;
		}
		
	});
});
