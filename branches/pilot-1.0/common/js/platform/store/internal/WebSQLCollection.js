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

define("platform/store/internal/WebSQLCollection", 
["dojo/_base/declare",
 "dojo/_base/array",
 "dojo/_base/lang",
 "dojo/json",
 "platform/store/_JsonInMemoryFindMixin",
 "platform/util/PlatformConstants"], 
function(declare, arrayUtil, lang, json, JsonInMemoryFindMixin, PlatformConstants) {
		
	var classBody = declare([], {
		
		storeName: null,
		database: null,
		tables: null,
		
		constructor: function(username){
			this.storeName = WL.StaticAppProps.APP_ID + "_" + username;
		},

/**@memberOf platform.store.internal.WebSQLCollection */
		initDb: function() {
			this.tables = {};
			
			var DB_CREATED = 1, DB_EXISTING = 0;
			
			var deferred = $.Deferred();
			
			this.database = window.openDatabase(this.storeName, '', this.storeName, 0, function() {
				//If it's not pending db creation took longer than 100ms/
				//The setTimeout ran earlier and considered the DB already exists
				if (deferred.state() === 'pending'){
					deferred.resolve(DB_CREATED);
				}
			});
			
			//wait 100ms for the database to signal it was created.
			//in worst scenario we incorrectly reported that the db already exists
			setTimeout(function() {
				//If it's not pending the database was created and the promise resolved
				if (deferred.state() === 'pending'){
					deferred.resolve(DB_EXISTING);
				}
			}, 100);

			return deferred.promise();
		},
		
		initTable: function(tableName, searchFields) {
			var deferred = $.Deferred();
			if (!(tableName in this.tables)){
				
				this.database.transaction(function(tx) {
					var sql = ['CREATE TABLE IF NOT EXISTS ' + tableName + '(_json TEXT'];
					var indexSqls = [];
					
					if (searchFields && Object.keys(searchFields).length > 0){
						arrayUtil.forEach(Object.keys(searchFields), function(columnName) {
							indexSqls.push('CREATE INDEX IF NOT EXISTS ' + tableName + '_' + columnName + ' ON ' + tableName + '(' + columnName + ')');
							
							var dataType = searchFields[columnName];
							dataType = (dataType === 'string') ? 'TEXT' : dataType;
							sql.push(', ' + columnName + ' ' + dataType);
						});
					}
					sql.push(')');
					
					tx.executeSql(sql.join(''));
					arrayUtil.forEach(indexSql, function(indexSql) {
						tx.executeSql(indexSql);
					});					
				},
				lang.hitch(deferred, deferred.reject),
				lang.hitch(deferred, deferred.resolve));
				
			} else {
				deferred.resolve();
			}
			
			return deferred.promise();
		},
		
		_getCurrentSearchFields: function() {
			return JSON.parse(localStorage[this.storeName + '_searchFields']);
		},
		
		_checkSearchFields: function(searchFields) {
			var currentSearchFields = this._getCurrentSearchFields();
			
			var currentSearchFieldNames = Object.keys(currentSearchFields || {});
			//find missing searchField or datatype mismatch
			var hasMismatchSearchField = arrayUtil.some(currentSearchFieldNames, function(currentSearchFieldName) {
				var currentSearchFieldDataType = currentSearchFields[currentSearchFieldName];
				if (searchFields[currentSearchFieldName] === undefined){
					return true;
				}
				var newSearchFieldDataType = searchFields[currentSearchFieldName];
				if (currentSearchFieldDataType !== newSearchFieldDataType){
					return true;
				}
				return false;
			}, this);
			
			//find extra searchField being added
			hasMismatchSearchField = hasMismatchSearchField || arrayUtil.some(Object.keys(searchFields), function(searchFieldName) {
				return (currentSearchFields[searchFieldName] === undefined);
			});
			
			if (hasMismatchSearchField){
				this._throwSearchFieldMismatch();
			}
			
		},
		
		_throwSearchFieldMismatch: function() {
			var userName = this.storeName.split('_')[0];
			var collectionName = this.storeName.split('_')[1];
			throw {
				col: collectionName,
				usr: userName,
				err: -2,
				msg: "PROVISION_TABLE_SEARCH_FIELDS_MISMATCH"
			};
		},		
		
		_hasKey: function(key){
			var nItems = localStorage.length;
			for (var i = 0; i < nItems; i++){
				if (localStorage.key(i) === key){
					return true;
				}
			}
			return false;
		},
		
		_setData: function(data){
			localStorage[this.storeName] = json.stringify(data);
		},
		
		_getData: function(){
			return json.parse(localStorage[this.storeName]);
		},
		
		_getPage: function(array, limit, offset){
			if (typeof limit == 'number' && typeof offset == 'number'){
				array = array.splice(offset, limit);
			}
			return array;
		},
		
		_resolveResult: function(options, result){
			var resultDeferred = $.Deferred();

			if (options && 'onSuccess' in options){
				options.onSuccess(result);
			}
			resultDeferred.resolve(result);
			
			return resultDeferred.promise();
		},
		
		_rejectResult: function(options, result){
			var resultDeferred = $.Deferred();

			if (options && 'onFailure' in options){
				options.onFailure(result);
			}
			resultDeferred.reject(result);
			
			return resultDeferred.promise();
		},
		
		find: function(query, options) {
			this._validateSearchFields(query);
			
			var limit = (options && options['limit']);
			var offset = (options && options['offset']);
			var data = this._getData();
			var result = this._findFuzzy(query, data); 

			return this._resolveResult(options, this._getPage(result, limit, offset));
		},
		
		_validateSearchFields: function(query) {
			var currentSearchFields = this._getCurrentSearchFields();
			var queryAsArray = (lang.isArray(query) && query || [query]);
			var hasInvaldiSearchFieldInQuery = arrayUtil.some(queryAsArray, function(queryItem) {
				return arrayUtil.some(Object.keys(queryItem || {}), function(queryItemName) {
					return (currentSearchFields[queryItemName] === undefined);
				});				
			});
			
			if (hasInvaldiSearchFieldInQuery){
				throw this._throwInvalidSearchField();
			}
		},
		
		_throwInvalidSearchField: function() {
			var userName = this.storeName.split('_')[0];
			var collectionName = this.storeName.split('_')[1];
			throw {
				col: collectionName,
				usr: userName,
				err: 22,
				msg: "INVALID_SEARCH_FIELD"
			};
		},		
		
		findExact: function(query, options) {
			var limit = (options && options['limit']);
			var offset = (options && options['offset']);
			var data = this._getData();
			var result = this._findExactMatch(query, data); 

			return this._resolveResult(options, this._getPage(result, limit, offset));
		},
		
		count: function(options) {
			var data = this._getData();
			var result = data.length;

			return this._resolveResult(options, result);
		},
		
		findAll: function(options) {
			var limit = (options && options['limit']);
			var offset = (options && options['offset']);
			var result = this._getData();

			return this._resolveResult(options, this._getPage(result, limit, offset));
		},
		
		findById: function(id, options) {
			var data = this._getData();
			var result = arrayUtil.filter(data, function(item){
				return item._id === id;
			});

			return this._resolveResult(options, result);
		},
		
		add: function(newData, options) {
			try{
				this._storeInLocalStorage(newData, false);
				return this._resolveResult(options);
			} catch(e){
				return this._rejectResult(options, e);
			}
		},

		destroy: function(options) {
			delete localStorage[this.storeName];

			return this._resolveResult(options);
		},
		
		replace: function(dataToUpdate, options) {
			dataToUpdate = lang.isArray(dataToUpdate) ? dataToUpdate : [dataToUpdate];
			var data = this._getData();
			var hasUpdates = false;
			
			arrayUtil.forEach(dataToUpdate, function(recToUpdate){
				var dbRec = arrayUtil.filter(data, function(item){
					return item._id === recToUpdate._id;
				});
				if (dbRec.length > 0){

					dbRec[0].json = recToUpdate.json;
					if (recToUpdate[PlatformConstants.TRANSACTION_LOCK_FORUPDATE])
					{
					dbRec[0][PlatformConstants.TRANSACTION_LOCK_FORUPDATE] = recToUpdate[PlatformConstants.TRANSACTION_LOCK_FORUPDATE];	
					}
					else
					{
						delete dbRec[0][PlatformConstants.TRANSACTION_LOCK_FORUPDATE];
					}
					
					hasUpdates = true;
				}
			});
			
			if (hasUpdates){
				try{
					this._storeInLocalStorage(data, true);
					return this._resolveResult(options);
				} catch(e){
					return this._rejectResult(options, e);
				}
			}

			return this._resolveResult(options);
		},
		
		remove: function(dataToRemove, options) {
			var data = this._getData();
			dataToRemove = lang.isArray(dataToRemove) ? dataToRemove : [dataToRemove];
			var newData = [];
			arrayUtil.forEach(data, function(rec){				
				var isToRemove = arrayUtil.some(dataToRemove, function(recToRemove){
					return rec._id === recToRemove || rec._id === recToRemove["_id"];
				});
					
				if (!isToRemove){
					return newData.push(rec);
				}
			});
			if (newData.length < data.length){
				this._storeInLocalStorage(newData, true, true);
			}

			return this._resolveResult(options);
		},
		
		removeCollection: function(options){
			delete localStorage[this.storeName + '_id'];
			delete localStorage[this.storeName];
			
			return this._resolveResult(options);
		},
		
		_getNextId: function(){
			var nextId = parseInt(localStorage[this.storeName + '_id'],10);
			localStorage[this.storeName + '_id'] = nextId + 1;
			return nextId;
		},
		
		_storeInLocalStorage: function(newData, isUpdate, allowEmptyArray){
			var newDataAsArray = (newData instanceof Array) ? newData : [newData];
			if (!allowEmptyArray && newDataAsArray.length == 0){
				var userName = this.storeName.split('_')[0];
				var collectionName = this.storeName.split('_')[1];
				throw {
					col: collectionName,
					usr: userName,
					err: 10,
					msg: "BAD_PARAMETER_EXPECTED_DOCUMENT_OR_ARRAY_OF_DOCUMENTS"
				};
			}
			var data = null;
			if (isUpdate){
				data = newDataAsArray;
				
			} else {
				data = this._getData();
				var newDataWithId = arrayUtil.map(newDataAsArray, lang.hitch(this, function(item){
					var newId = this._getNextId();
					return {_id: newId, json:item};
				}));
				
				data = data.concat(newDataWithId);
			}
			
			this._setData(data);
		}
		
	});
	
	lang.mixin(classBody.prototype, JsonInMemoryFindMixin);
	return classBody;
	
});
