/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2014 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

/**
 * This is a lock object to maintain an order to updates to the local store.  
 */
define("platform/store/StoreLock",
		["dojo/_base/array",
		 "platform/logging/Logger",
		 "dojo/Deferred"], 
		 function(arrayUtil, logger, Deferred){

	var lockQueue = {};

	return {
		/**
		 * This function returns a promise that will be resolved after the lockCallBack function has been executed.  If lockCallBack
		 * return a promise, then the promise returned from this function will be fulfilled when the call back promise is fulfilled. 
		 * It is expected that the caller has the store read and update in the lockCallBack function to insure the proper state
		 * of the data.
		 */
/**@memberOf platform.store.StoreLock */
		lock : function(/*string*/resourceName, /*function*/lockCallBack){
			var lockDeferred = new Deferred();
			if(resourceName && lockCallBack){
			logger.trace("[StoreLock] lock: adding  to lock resource " + resourceName);
			var lockObject = {"lockDeferred" : lockDeferred, "lockCallBack": lockCallBack, "resourceName": resourceName};

			var resourceLock = lockQueue[resourceName];
			if (!resourceLock){
				resourceLock = [];
				lockQueue[resourceName] = resourceLock;
			}
			resourceLock.push(lockObject);
			if (resourceLock.length == 1){
				logger.trace("[StoreLock] lock: no other locks on resource " + resourceName);
				this._callLockCallBack(resourceLock);
			}
			else{
				logger.trace("[StoreLock] lock: resource " + resourceName + " is locked, adding lock to queue. Total locks is " + resourceLock.length);
			}
			}
			else{
				logger.trace("[StoreLock] lock called without resource or call back function passed in, so no lock obtained.");
				lockDeferred.resolve();
			}
			return lockDeferred.promise;
		},

		_unlock: function(resourceLock){
			var lockObject = resourceLock.shift();
			logger.trace("[StoreLock] lock on resource " + lockObject.resourceName + " released. Total locks remaining: " + resourceLock.length);
			if (resourceLock.length > 0){
				this._callLockCallBack(resourceLock);
			}
		},
		
		_callLockCallBack : function(resourceLock){
			var lockObject = resourceLock[0];
			var callBackPromise = null;
			var self = this;
			try{
				logger.trace("[StoreLock] calling call back function for lock on  resource " + lockObject.resourceName);
				callBackPromise = lockObject.lockCallBack();
				if (callBackPromise && callBackPromise.then){
					callBackPromise.then(function(result){
						logger.trace("[StoreLock] resolving promise on lock for resource " + lockObject.resourceName);
						if (result){
							lockObject.lockDeferred.resolve(result);
						}
						else{
							lockObject.lockDeferred.resolve();
						}
						self._unlock(resourceLock);
					}).otherwise(function(error){
						logger.log("[StoreLock] rejecting promise on lock for resource " + lockObject.resourceName + " with error: " + error);
						lockObject.lockDeferred.reject(error);
						self._unlock(resourceLock);
					});
				}
				else{
					logger.trace("[StoreLock] No promise returned from call back.  Resolving promise on lock for resource " + lockObject.resourceName);
					lockObject.lockDeferred.resolve();
					this._unlock(resourceLock);
				}
			}
			catch(error){
				if (!lockObject.lockDeferred.isFulfilled()){
					//Error could have occurred in lockCallBack promise fulfillment
					logger.log("[StoreLock] rejecting promise on lock for resource " + lockObject.resourceName + " with error: " + error);
					lockObject.lockDeferred.reject(error);
				}
				self._unlock(resourceLock);
			}
		}
	};
});
