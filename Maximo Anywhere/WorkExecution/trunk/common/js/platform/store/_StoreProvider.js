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

define("platform/store/_StoreProvider",
["platform/store/internal/LocalStorageCollection",
 "platform/logging/Logger",
 "dojox/encoding/digests/SHA1",
 "dojo/_base/lang",
 "dojo/Deferred",
 "dojo/topic",
 "platform/util/PlatformConstants",
 "platform/translation/MessageService",
 "platform/store/_StoreProviderSecurity"], 
function(LocalStorageCollection, Logger, SHA1, lang, Deferred, topic, PlatformConstants, MessageService, storeProviderSecurity){

	var wlJsonStoreProvider = {
/**@memberOf platform.store._StoreProvider */
		init: function(stores, options){
			//At this point, as we need the status of initialization (new/existing), we only support a single store initialization per init call
			var storeToInit = {};
			var chosenStoreName = null;
			for (storeName in stores){
				storeToInit[storeName] = stores[storeName];
				chosenStoreName = storeName;
				break;
			}
			
			//Enhance JSONStore.init to also include the status (new/existing collection) of each collection in the resolved promise
			var deferred = $.Deferred();
			Logger.timerStart('_StoreProvider - wlJsonStoreProvider - _StoreProvider init store = ' + chosenStoreName );

			var stringifiedClonedOptions = JSON.stringify(options);
   			var clonedOptions = JSON.parse(stringifiedClonedOptions);
			   			
   			if (clonedOptions['username']){
   				var hexOutputFormat = 1;
   				clonedOptions['username'] = SHA1(clonedOptions['username'], hexOutputFormat);
   			}

			WL.JSONStore.init(storeToInit, clonedOptions)
			.done(function(stores){
				//Logger.trace('[DATA] === Collecting initialization status - ' + chosenStoreName);
				if (stores[chosenStoreName] && stores[chosenStoreName].promise){
					stores[chosenStoreName].promise
					.done(function(status){
						Logger.timerEnd('_StoreProvider - wlJsonStoreProvider - _StoreProvider init store = ' + chosenStoreName );
						
						var result = {};
						result[chosenStoreName] = status;
						deferred.resolve(result);
					});	
				} else {
					//windows 8 was crashing because it does not exist
					var result = {};
					result[chosenStoreName] = 0;
					deferred.resolve(result);
				}
			})
			.fail(function(err){
				if (lang.isObject(err) && err['msg'] === "PROVISION_TABLE_SEARCH_FIELDS_MISMATCH"){
					topic.publish(PlatformConstants.JSONSTORE_INDEX_MISMATCH_TOPIC);
					deferred.reject(MessageService.createResolvedMessage('jsonstoreIndexMismatch'));
				}
				deferred.reject(err);
			});
			
			return deferred;
		},

		get: function(storeName){
			return WL.JSONStore.get(storeName);
		},
		
		reset: function(){
			return WL.JSONStore.destroy();
		},

		/* 
		 * This method assumes you already have a store initialized!
 		 * This method only changes the password locally, if you use it and there is no change
 		 * in the remote server password and you are connected the application will have issues
		 */
		_changePassword: function(/*String*/ username, /*String*/ oldPassword, /*String*/ newPassword) {
			var deferred = new Deferred();

			// if you change the build.properties from enableDataEncryption=true to enableDataEncryption=false
			// or the opposite you'll have problems unless you clear you app Data and Cache
			var isEncrypted = storeProviderSecurity.isEncrypted();
			var oriUsername = username;
			var hexOutputFormat = 1;
			var username = SHA1(username || "-no-user-", hexOutputFormat);
			
			if(isEncrypted) {
				Logger.trace("Attempt to change password for user: " + oriUsername + ", store is encrypted");
				var hasJsonStore = (WL !== undefined && WL.Client && WL.Client.getEnvironment) &&  
					(WL.Client.getEnvironment() === 'iphone' ||
					 WL.Client.getEnvironment() === 'ipad' ||
					 WL.Client.getEnvironment() === 'android' ||
					 WL.Client.getEnvironment() == WL.Environment.WINDOWS8 ||
					 WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8
					);
				
				// now that the store is open change the password
				WL.JSONStore.changePassword(oldPassword, newPassword, username)
					.then(function () {
						Logger.trace("Password successfully modified");
						deferred.resolve();
					})
					.fail(function (err) {
						Logger.trace("Unable to change user password due to: " + JSON.stringify(err));
						// not sending the error message to the user since it is a JSONStore error
						// check the logs Logger.trace above to understand why
						deferred.reject("Unable to change the password. The old password passed was wrong.");
					});
			}
			else {
				// password is always changed even if the oldPassword is invalid for a non-encrypted jsonStore
				Logger.trace("Attempt to change password for user: " + oriUsername + ", store is not encrypted");
				// a user have logged in the past
				if(!localStorage.previousLoggedUsers) {
					Logger.trace("No user ever logged in, no need to change password");
					deferred.reject("No user ever logged in, no need to change password");
					return deferred.promise;
				}
				var previousLoggedUsersJson = JSON.parse(localStorage.previousLoggedUsers);
				// user exists
				if(!previousLoggedUsersJson[username]) {
					Logger.trace("Current user have never logged in, no need to change password");
					deferred.reject("Current user have never logged in, no need to change password");
					return deferred.promise;
				}
				// change password
				var hashedNewPassword = SHA1(newPassword || "-no-pass-", hexOutputFormat);
				previousLoggedUsersJson[username] = hashedNewPassword;
				localStorage.previousLoggedUsers = JSON.stringify(previousLoggedUsersJson);
				Logger.trace("Password successfully modified");
				deferred.resolve();
			}
			
			return deferred.promise;
		},

		closeAll: function(){
			Logger.timerStart("_StoreProvider - wlJsonStoreProvider - closeAll");
			return WL.JSONStore.closeAll().
			done(function() {
				Logger.timerEnd("_StoreProvider - wlJsonStoreProvider - closeAll");
			}).
			fail(function() {
				Logger.timerEnd("_StoreProvider - wlJsonStoreProvider - closeAll");
			});
		}
	};
		
	var localStoreProvider = {
		collections: {},
		
		init: function(stores, credentials){
			var self = this;
			var deferred = $.Deferred();
			
			if (!credentials['username']){
				Logger.error("no user name!!!!!!");
			}
			
			//Make it async to behave like jsonStore
			setTimeout(function(){
				
				if ('password' in credentials && 
					!self._validateUser(credentials)){
					
					deferred.reject({msg: 'INVALID_KEY_ON_PROVISION', err: -3});
					return;
				}

	   			if (credentials['username']){
	   				var hexOutputFormat = 1;
	   				credentials = {
	   					username: SHA1(credentials['username'], hexOutputFormat),
	   					password: credentials['password']
	   				};
	   			}else{
					Logger.error(" no user name ");
				}
	   			
				var statuses = {};
				for (storeName in stores){
					var result = null;
					try{
						result = new LocalStorageCollection(storeName, stores[storeName]['searchFields'], credentials['username']);
					} catch (e) {
						deferred.reject(e);
						return;
					}
					
					self.collections[storeName] = result;
					statuses[storeName] = (result.isNewCollection) ? 0 : 1;
				}
				deferred.resolve(statuses);
			}, 30);
			return deferred.promise();
		},
		
		_validateUser: function(credentials){
			var username = credentials['username'];
			var encodedPassword = btoa(credentials['password']);
			
			var loggedUsers = (localStorage['loggedUsers'] && JSON.parse(localStorage['loggedUsers']) || {});
			if (username in loggedUsers){
				return encodedPassword == loggedUsers[username];
			}
			loggedUsers[username] = encodedPassword;
			localStorage['loggedUsers'] = JSON.stringify(loggedUsers);
			return true;
		},
		
		get: function(storeName){
			return this.collections[storeName];
		},

		_changePassword: function(/*String*/ username, /*String*/ oldPassword, /*String*/ newPassword) {
			var deferred = new Deferred();

			Logger.trace("Attempt to change password for user: " + username + ", store is not encrypted");
			
			var oldPassword = btoa(oldPassword);
			var encodedNewPassword = btoa(newPassword);
			var loggedUsers = (localStorage['loggedUsers'] && JSON.parse(localStorage['loggedUsers']) || {});

			// check password
			if(!(username in loggedUsers) || loggedUsers[username] == oldPassword) {
				loggedUsers[username] = encodedNewPassword;
				localStorage['loggedUsers'] = JSON.stringify(loggedUsers);
				
				Logger.trace("Password successfully modified");
				deferred.resolve();
			}
			else {
				deferred.reject("Unable to change the password. The old password passed was wrong.");
			}


			return deferred.promise;
		},

		closeAll: function(){
			var self = this;
			var deferred = $.Deferred();
			//Make it async to behave like jsonStore
			setTimeout(function(){
				self.collections = null;
				self.collections = {};
				deferred.resolve();
			}, 30);
			return deferred.promise();
		},
		
		reset: function(){
			var deferred = $.Deferred();
			
			//Make it async to behave like jsonStore
			setTimeout(function(){
				var loggedUsers = {};
				localStorage['loggedUsers'] = JSON.stringify(loggedUsers);
				deferred.resolve();
			}, 30);
			return deferred.promise();
		}
		
	};
		
	var hasWorklight = false;
	try{
		hasWorklight = (WL !== undefined && WL.Client && WL.Client.getEnvironment);
	} catch (e){
		//WL global var is not defined, so skip it.
	}

	var hasJsonStore = hasWorklight &&  
	(WL.Client.getEnvironment() === 'iphone' ||
	 WL.Client.getEnvironment() === 'ipad' ||
	 WL.Client.getEnvironment() === 'android' ||
	 WL.Client.getEnvironment() == WL.Environment.WINDOWS8 ||
	 WL.Client.getEnvironment() == WL.Environment.WINDOWS_PHONE_8);

	Logger.trace('>>>> Using ' + ((hasJsonStore) ? 'JSONStore' : 'LocalStorage'));
	return (hasJsonStore) ? wlJsonStoreProvider : localStoreProvider;
	
});
