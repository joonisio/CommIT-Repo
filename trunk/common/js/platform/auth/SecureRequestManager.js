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

/**
 * This is a lock object to maintain an order to updates to the local store.  
 */
define("platform/auth/SecureRequestManager",
		["dojo/_base/array",
		 "dojo/_base/lang",
		 "dojo/Deferred",
		 "platform/logging/Logger"], 
		 function(arrayUtil, lang, Deferred, Logger){

	var adaptorRequests = {};
	var lockedRequests = {};
	var authorizationLock = false;
	var _REQUEST_IDENTIFIER = '_Anywhere_ID_';

	return {
		/**
		 * This function allows the platform to keep track or requests sent to the adaptor so upon any reauthorization the 
		 * platfrom can correctly resend the request.  It will also allow requests to be queued to call the adaptor if a an 
		 * earlier request required reauthorization.
		 */
/**@memberOf platform.auth.SecureRequestManager */
		callAdaptor: function(invocationData, options, deferred){
			var promise = deferred.promise;
			if(!invocationData[_REQUEST_IDENTIFIER]){
				var requestID = new Date().getTime();
				invocationData[_REQUEST_IDENTIFIER] = requestID;
				var requestObject = {requestID: requestID, invocationData: invocationData, options: options, deferred: deferred};
				promise.always(function(result){
					Logger.trace('SecureRequestManager removing request.  ID =  ' +  requestID);
					if (lockedRequests[requestID]){
						delete lockedRequests[requestID];
					}
					else{
						delete adaptorRequests[requestID];
					}
					return result;
				});
				Logger.trace('SecureRequestManager adding request.  ID = ' +  requestID);
				adaptorRequests[requestID] = requestObject; 
				if (authorizationLock){
					Logger.trace('SecureRequestManager locked not sending request to adaptor.  ID = ' +  requestID);
					return promise;
				}
			}
			Logger.trace('SecureRequestManager sending request.  ID = ' +  invocationData[_REQUEST_IDENTIFIER]);
			WL.Client.invokeProcedure(invocationData, options);
			return promise;
		},
		
		hasPendingRequest: function(){
			return (Object.keys(lockedRequests).length > 0);
		},
		
		resendRequestsAfterAuth: function(sessionID){
			arrayUtil.forEach( Object.keys(lockedRequests), function(requestID){
				var requestObject = lockedRequests[requestID];
				var invocationData = requestObject.invocationData;
				if (sessionID){
					invocationData.parameters[0]['sessionid'] = sessionID;
				}
				Logger.trace('SecureRequestManager resending request.  ID = ' +  requestID);
				WL.Client.invokeProcedure(invocationData, requestObject.options);
			});
		},

		_releaseLock : function(){
			if (authorizationLock){
				Logger.trace('SecureRequestManager auth lock relesased');
				authorizationLock = false;
				lockedRequests = adaptorRequests;
				adaptorRequests = {};
			}
			
		},
		
		authorizationSuccessful: function(){
			this._releaseLock();
		},
		
		enableAuthLock: function(){
			Logger.trace('SecureRequestManager LOCKED for authorization');
			authorizationLock = true;
		},
		
		isAuthLocked: function(){
			return authorizationLock;
		},
		
		authorizationFailed: function(errorObject){
			this._releaseLock();
			arrayUtil.forEach( Object.keys(lockedRequests), function(requestID){
				var requestObject = lockedRequests[requestID];
				Logger.trace('SecureRequestManager rejecting request.  ID = ' +  requestID);
				requestObject.deferred.reject(errorObject);
			});
		},
		
	    clearLock: function(){
	        authorizationLock = false;
	        adaptorRequests = {};
	        lockedRequests = {};
	    }
	};
});
