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

define("platform/store/internal/LocalStorageCollection", 
["dojo/_base/declare",
 "dojo/_base/array",
 "dojo/_base/lang",
 "dojo/json",
 "platform/store/_JsonInMemoryFindMixin",
 "platform/util/PlatformConstants"], 
function(declare, arrayUtil, lang, json, JsonInMemoryFindMixin, PlatformConstants) {
	/**@class platform.store.internal.LocalStorageCollection */
	var classBody = declare([], {
		 
		storeName: null,
		isNewCollection: false,
		/**@constructor */
		constructor: function(name, searchFields, username){
			this.storeName = username + "_" + name;
			
			this.isNewCollection = !this._hasKey(this.storeName);
			if (this.isNewCollection){
				localStorage[this.storeName] = '[]';
				localStorage[this.storeName + '_id'] = 0;
				localStorage[this.storeName + '_searchFields'] = JSON.stringify(searchFields);
			} else {
				this._checkSearchFields(searchFields);
			}
		},
		
        /**@memberOf platform.store.internal.LocalStorageCollection */
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
		
		find: function(query, options, checkSort) {
			var limit = (options && options['limit']);
			var offset = (options && options['offset']);
			var data = this._getData();
			var result = this._findFuzzy(query, data); 
			if (options && options.sort){
				result = this._sort(result, options.sort);
			}
			return this._resolveResult(options, this._getPage(result, limit, offset));
		},
		
		_sort: function(data, sortOptions) {
			var sortFunctions = [];
			arrayUtil.forEach(sortOptions, function(item){ // TODO: NEED TO TREAT THIS ITEM AND MAKE IT A SIMPLE STRING TO USE THE FOLLOWING REGEX IN LINE BELOW
				var sortItem = '';
				for(var itemKey in item) {
					if(sortItem.length > 0) {
						sortItem += ',';
					}
					sortItem += itemKey + ' ' + item[itemKey];
				}
				sortItem.replace(/^(\w*)(?: (asc|desc))?$/i, function(fullText, attributeName, direction){
					var sortFunction = (function(){
						var attrName = attributeName;
						var comparator = (direction === 'desc') ? function(a, b) { if (!a) {return false;} else if (!b) {return true;} else {return a < b;}} : function(a, b){if (!a) {return true;} else if (!b) {return false;} else {return a > b;}}; 
						return function(a, b) {
							var va = a.json?a.json[attrName]:a[attrName], vb = b.json?b.json[attrName]:b[attrName];
							if (va == vb){
								return 0;
							}
							if (comparator(va, vb)){
								return 1;
							}
							return -1;
						};
					})();
					sortFunctions.push(sortFunction);
					return fullText;
				});
			});

			/**
			 * Apply each function in the list sequentially until one returns non-zero,
			 * meaning the items were sorted.
			 */
			var sortedData = data.concat().sort(function(a, b) {
				for (var x = 0; x < sortFunctions.length; x++){
					var result = sortFunctions[x](a, b);
					if (result != 0){
						return result;
					}
				}
				return 0;
			});
			return sortedData;
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
			if (options && options.sort){
				result = this._sort(result, options.sort);
			}

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
			if (options && options.sort){
				result = this._sort(result, options.sort);
			}

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
			var removeCount = 0;
			arrayUtil.forEach(data, function(rec){				
				var isToRemove = arrayUtil.some(dataToRemove, function(recToRemove){
					return rec._id === recToRemove || rec._id === recToRemove["_id"];
				});
					
				if (isToRemove){
					removeCount ++;
				}else{
					return newData.push(rec);
				}
				
			});
			if (newData.length < data.length){
				this._storeInLocalStorage(newData, true, true);
			}

			return this._resolveResult(options, removeCount);
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
