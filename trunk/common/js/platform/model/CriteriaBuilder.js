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

define("platform/model/CriteriaBuilder",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array", 
 "platform/exception/PlatformRuntimeException",
 "platform/util/PlatformConstants",
 "platform/logging/Logger",
 "platform/store/ResourceMetadata"
 ], 
function(declare, lang, arrayUtil, PlatformRuntimeException, PlatformConstants, Logger, ResourceMetadata) {
	return declare([],{
		_metadata: null,
		_andQuery: null,		
		_position: null,
		constructor: function(deps){
			var meta = lang.getObject("metadata", false, deps);
			if(meta){
				if(meta instanceof ResourceMetadata){
					this._metadata = meta;
				}
				else{
					// TODO define new message
					throw new PlatformRuntimeException("invalidModelData");
				}
			}
			else {
				// TODO define new message
				throw new PlatformRuntimeException("invalidModelData");
			}
			this._query = [{}];
			this._position = 0;
		},
/**@memberOf platform.model.CriteriaBuilder */
		or: function(){
			this._position++;
			this._query.push({});
			return this;
		},	
		equal: function(indexedAttribute, value){
			return this.andEqual(indexedAttribute, value);
		},
		andEqual: function(indexedAttribute, value){
			this._ensureFieldIsQueriableOrThrowException(indexedAttribute);
			this._addInAllPositions(indexedAttribute, value, this._query);
			return this;
		},
		andIn: function(indexedAttribute, valueArray){		
			this._ensureFieldIsQueriableOrThrowException(indexedAttribute);
			if(valueArray && valueArray.length > 0){				
				var result = new Array();
				for(var i = 0; i < this._position; i++){
					result.push(this._query[i]);
				}
				for(var i = 0; i < valueArray.length; i++){
					for(var j = this._position; j < this._query.length; j++){
						var obj = {};
						obj[indexedAttribute] = valueArray[i];
						result.push(lang.mixin(obj, this._query[j]));						
					}
				}
				this._query = result;
			}			
			return this;
		},
		asFilterArray: function(){
			var clone = lang.clone(this._query);
			var end = clone.length - 1;
			while(end >= 0){
				var length = Object.keys(clone[end]).length;
				if(length == 0){
					clone.splice(end, clone.length);
				}
				end--;
			}
			return clone;
		},
		reset: function(){
			this._query = [];
			this._position = 0;
		},
		_addInAllPositions: function(indexedAttibute, value, query){
			for(var i = this._position; i < query.length; i++){
				query[i][indexedAttibute] = value || "null";
			}
		},				
		_ensureFieldIsQueriableOrThrowException: function(fieldName){
			var fieldInfo = this._metadata.getField(fieldName);
			var isOk = fieldInfo && fieldInfo.index;
			if(!isOk){
				// TODO define new message
				throw new PlatformRuntimeException("Attribute " + fieldName + " is not indexed.");
			}
		}
	});
});
