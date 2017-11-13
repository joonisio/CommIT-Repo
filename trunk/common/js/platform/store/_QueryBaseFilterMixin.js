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

define("platform/store/_QueryBaseFilterMixin", 
["dojo/_base/lang",
 "dojo/_base/array",
 "dojo/Deferred",
 "platform/store/_JsonInMemoryFindMixin",
 "platform/util/PlatformConstants",
 "platform/logging/Logger"], 
function(lang, arrayUtil, Deferred, JsonInMemoryFindMixin, PlatformConstants, Logger){

	var classBody = {
			
/**@memberOf platform.store._QueryBaseFilterMixin */
		_buildJSONStoreQueryForQueryBaseAndQuery: function(queryBaseName, query) {
			var queryBaseQuery = {};
			if (queryBaseName){
				queryBaseQuery[PlatformConstants.QUERYBASES_LIST_ATTR] = '<' + queryBaseName + '>';
			}
			
			if (lang.isArray(query) && query.length > 0){
				arrayUtil.forEach(query, function(queryItem) {
					lang.mixin(queryItem, queryBaseQuery);
				});
				
			} else if (query && lang.isObject(query)){
				lang.mixin(query, queryBaseQuery);
				
			} else {
				query = queryBaseQuery;
			}
			return query;
		},
		
		_buildJSONStoreQueryPart: function(queryBaseName, query, isExactMatch, reverse) {
			query = this._buildJSONStoreQueryForQueryBaseAndQuery(queryBaseName, query);
			var queryParts = [];
			if (query){
				var queryArray = (lang.isArray(query)?query:[query]);
				arrayUtil.forEach(queryArray, function(queryPiece){
					var queryPart = WL.JSONStore.QueryPart();
					arrayUtil.forEach(Object.keys(queryPiece),function(key){
						if(reverse) {
							if(isExactMatch) {
								queryPart.notEqual(key, queryPiece[key]);
							}
							else {
								queryPart.notLike(key, queryPiece[key]);
							}
						}
						else {
							if(isExactMatch) {
								queryPart.equal(key, queryPiece[key]);
							}
							else {
								queryPart.like(key, queryPiece[key]);
							}
						}
					});
					queryParts.push(queryPart);
				});
			}
			return queryParts;
		},
		
		_filterQueryBase: function(resourceName, queryBaseName, options, query, isExactMatch){
			var self = this;
			var logMsg = "_QueryBaseFilterMixin for resource/queryBase: " + resourceName + " queryBase: " + queryBaseName;
			Logger.timerStart(logMsg);
			var deferred = new Deferred();
			var resourceStore = this._getStore(resourceName);
			var findPromise = null;
			if(options.sort && resourceStore.advancedFind) {
				//Has sort and using JSONStore so need to convert query to QueryParts to be used in advanceFind
				query = this._buildJSONStoreQueryPart(queryBaseName, query, isExactMatch);
				isExactMatch = false;  //advanceFind has exact match
				findPromise = resourceStore.advancedFind(query, options);
			}
			else {
				query = this._buildJSONStoreQueryForQueryBaseAndQuery(queryBaseName, query);
				findPromise = resourceStore.find(query, options);
			}
			findPromise.
			done(function(resultSet) {
				if (isExactMatch){
					var exactMatchResultSet = self._findExactMatch(query, resultSet);
					Logger.timerEnd(logMsg);
					deferred.resolve(exactMatchResultSet);
					
				} else {
					Logger.timerEnd(logMsg);
					deferred.resolve(resultSet);
				}				
			}).
			fail(function(err){
				deferred.reject(err);
			});
			
			return deferred.promise;
		}	
	};
	
	return lang.mixin(classBody, JsonInMemoryFindMixin);
});
