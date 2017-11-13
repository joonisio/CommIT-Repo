/* IBM Confidential
 *
 * OCO Source Materials
 *
 * 5724-U18
 *
 * (C) COPYRIGHT IBM CORP. 2016
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has been
 * deposited with the U.S. Copyright Office.
 */
/*
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Mapstraction nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

;

/**
 * JS file to manage token Authentication
 */

require( [
           "dojo/_base/declare", "dojo/parser", "dojo/ready",
           "dojo/Deferred",
           "dojo/_base/lang",
           "platform/logging/Logger",
           "platform/model/ModelService",
           "platform/store/_ResourceMetadataContext",
           "platform/map/esriTileCacheManager",
           "platform/map/esriFeatureServiceManager",
           "dojo/_base/array",
           "dijit/Tooltip", "dijit/form/Button",
           "dojo/promise/all"
         ], function(declare, parser, ready, Deferred, lang,
        		 Logger, ModelService, ResourceMetaData, 
        		 esriTileCacheManager, esriFeatureServiceManager, 
        		 array, Tooltip, Button, all){

	declare( "platform.map.spatial.security.TokenAuthentication", null, {

		userAuthenticationManager : null,
		_tokenCache: null,
		
		constructor : function ( options ) {
			this._tokenCache = {};
			require( [
				"platform/auth/UserAuthenticationManager"
			], dojo.hitch( this, function ( authManager ) {
				this.userAuthenticationManager = authManager;
			} ) );

		},
		
		/**
		 * Method to check if the Token is still valid for the URL
		 * @param url
		 * @returns {Boolean}
		 */
		checkTokenCacheValid: function(url) {
			var tokenCache = this._tokenCache[url];
			var tokenValid = true;
			if (tokenCache) {
				var date = new Date();
        		var currentClientTimeMSec = date.getTime();
        		var expireTime = tokenCache.expireTime;	
        		if (expireTime != null && expireTime!="") {
        			var expireResetLimit = tokenCache.expireResetLimit;
            		if ((currentClientTimeMSec + expireResetLimit) > expireTime) {
            			tokenValid = false;
            		}
        		}        		
			} else {
				tokenValid = false;
			}
			return tokenValid;
			
		},		
		/**
		 * It generates tokens objects for each URL passed. This method keeps a cache so it does not request a new token,
		 *  unless the isRenew parameter is true, than the method will force a new token generation 
		 * @param urls - Array of URL
		 * @param mapManager
		 * @param isRenew - True/False
		 */
		generateTokens: function (urls, mapManager, isRenew) {
			var deferred = new Deferred();
			console.log("mapManager.spatialtokensecurity " + mapManager.spatialtokensecurity);
			setTimeout(lang.hitch(this, function(){
				if (mapManager.spatialtokensecurity != null && mapManager.spatialtokensecurity == true) {
					var promises = [];
					var urlsRequest = [];
					array.forEach(urls, lang.hitch( this, function ( url, i ) {			
						
						var tokenValid = this.checkTokenCacheValid( url );
						if (tokenValid == false || isRenew == true) {
							urlsRequest.push( url );
							var currentUserSite = this.userAuthenticationManager.currentUserSite;
							var securityMeta = ResourceMetaData.getResourceMetadata( "PLUSSSECURITYTOKEN" );
							securityMeta._fieldMap['token'] = {};
							securityMeta._fieldMap['token'].local = true;
							filter = {'identifier' : ''};
							var params = { "tokenUrl": url, "siteId": currentUserSite, "mapName": mapManager.identifier };
							console.log("parameter  tokenUrl" + url);
							console.log("parameter  currentUserSite" + currentUserSite);
							console.log("parameter  mapName" + mapManager.identifier);
							promises.push(ModelService.filtered('PLUSSSECURITYTOKEN', null, filter, 1000, false, false, params, false));
						}
					} ) );
					
					all(promises).always(lang.hitch(this, function(returnSecurity){	
						console.log("Promises returned security token " + returnSecurity, returnSecurity);
						array.forEach( returnSecurity, lang.hitch( this, function ( result, i ) {
							var url = urlsRequest[i];
							if (result.data && result.data.length > 0) {
								var tokenValue = result.data[0].identifier;
								var expireTime = result.data[0].expiretime;
								var expireResetLimit = result.data[0].expireresetlimit;
								this._tokenCache[url] = {};
								this._tokenCache[url].tokenValue = tokenValue;
								if (expireTime) {
									var date = new Date();
					        		var currentClientTimeMSec = date.getTime();
									this._tokenCache[url].expireTime = expireTime + currentClientTimeMSec - (60 * 1000 * 1);
								} else {
									this._tokenCache[url].expireTime = null;
								}
								
								this._tokenCache[url].expireResetLimit = expireResetLimit;
							} else {
								this._tokenCache[url] = {};
								this._tokenCache[url].tokenValue = null;
								this._tokenCache[url].expireTime = null;
								this._tokenCache[url].expireResetLimit = null;
							}						
						}));
						deferred.resolve(this._tokenCache);
						
		            }));
				} else {
					
					array.forEach(urls, lang.hitch( this, function ( url, i ) {
						this._tokenCache[url] = {};
						this._tokenCache[url].tokenValue = null;
						this._tokenCache[url].expireTime = null;
						this._tokenCache[url].expireResetLimit = null;
					} ) );
					
					deferred.resolve(this._tokenCache);
				} 
				
			
			}), 10);
			
			
			return deferred.promise;
		}

	});
});
