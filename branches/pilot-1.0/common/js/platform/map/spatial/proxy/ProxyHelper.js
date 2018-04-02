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
 * JS file to manage Proxy
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

	declare( "platform.map.spatial.proxy.ProxyHelper", null, {
		
		//Default URL provided by TPAE
		urlProxy: "/webclient/pluss/proxy.jsp?",

		constructor : function ( options ) {

		},
		
		/**
		 * Method to remore the Proxy URL
		 * @param url
		 * @returns New Url without proxy
		 */
		removeProxyURL: function(url) {
			var newUrl = url;
			var stringToRemove = this.getProxyURL();
			if (url.indexOf(stringToRemove)> -1) {
				newUrl = newUrl.replace(stringToRemove, "");
			}
			return newUrl;			
		},
		
		/**
		 * Methid to include the Proxy URL
		 * @param url
		 * @param mapManager
		 * @returns New Url with proxy
		 */
		includeProxyURLIfEnabled: function(url, mapManager) {
			var newUrl = url;
			if (this.isProxyEnabled(mapManager) == true && url.indexOf(this.urlProxy) == -1) {
				newUrl = this.getProxyURL() + url;
			}
			return newUrl;			
		},
		
		/**
		 * Method to return the base proxy URL, usually: <host>:<ip>/webclient/pluss/proxy.jsp?
		 * @returns {String}
		 */
		getProxyURL: function() {
			var mapServiceMeta = ResourceMetaData.getResourceMetadata( "plussmapservice" );			
			return mapServiceMeta.getURLBase() + this.urlProxy;
		},
		
		/**
		 * Method to verify if the Map Manager has the Proxy enabled
		 * @param mapManager
		 * @returns {Boolean}
		 */
		isProxyEnabled: function(mapManager) {
			var isEnabled = false;
			if (mapManager && mapManager.useproxy
					&& mapManager.useproxy == true) {
				isEnabled = true;
			}
			return isEnabled;
		}

	});
});
