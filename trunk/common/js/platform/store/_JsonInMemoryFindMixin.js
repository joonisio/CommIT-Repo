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

define("platform/store/_JsonInMemoryFindMixin", 
["dojo/_base/lang",
 "dojo/_base/array",
 "dojox/json/query",
 "platform/logging/Logger"], 
function(lang, arrayUtil, jsonQuery, Logger){
	
	var EXACTMATCH = true;
	var FUZZY = false;
	
	
	return {
		
		/*
		 * Converts this:
		 * [{name: 'John', age: 27}, {dept: 'MKT'}]
		 * 
		 * to this (exact match):
		 * (item.json.name == 'John' && item.json.age == 27) || (item.json.dept == 'MKT')
		 * 
		 * or this (fuzzy match):
		 * (/^[\\w\\W]*John[\\w\\W]*$/i.test(item.json.name) && (/^[\\w\\W]*27[\\w\\W]*$/i.test(item.json.age + '') || (/^[\\w\\W]*MKT[\\w\\W]*$/i.test(item.json.dept))
		 * 
		 * The "item.json." prefix in every resulting attribute is because
		 * WL JSONStore returns a json with this structure: {_id:0, json:{name:'John', age:27}}
		 * and we want to search against the fields within json attribute.
		 */
/**@memberOf platform.store._JsonInMemoryFindMixin */
		_convertJsonQueryToDojoArrayFilterQuery: function(queryArray, isExact){
			var needOR = false;
			var queryData = [];
			arrayUtil.forEach(queryArray, function(query){
				if (needOR) queryData.push(' || ');
				needOR = true;
				
				queryData.push('(');
				var needAND = false;
				for (attr in query){
					if (needAND){
						queryData.push(' && ');
					}
					needAND = true;
					
					var valueToCompare = null;
					var needConvertToString = (typeof query[attr] != "string");
					if (isExact){
						valueToCompare = (!needConvertToString && query[attr] !== 'null') ? "'" + query[attr].replace("'","\\'") + "'" : query[attr];
					} else {
						var escapedValue = query[attr];
						if (!needConvertToString){
							//need to escape regex special chars
							escapedValue = query[attr].replace(/\\/g, "\\\\");
							escapedValue = escapedValue.replace(/\[/g, "\\[");
							escapedValue = escapedValue.replace(/\(/g, "\\(");
							escapedValue = escapedValue.replace(/\]/g, "\\]");
							escapedValue = escapedValue.replace(/\)/g, "\\)");
							escapedValue = escapedValue.replace(/\?/g, "\\?");
							escapedValue = escapedValue.replace(/\*/g, "\\*");
							escapedValue = escapedValue.replace(/\+/g, "\\+");
							escapedValue = escapedValue.replace(/\{/g, "\\{");
							escapedValue = escapedValue.replace(/\}/g, "\\}");
							escapedValue = escapedValue.replace(/\./g, "\\.");
							escapedValue = escapedValue.replace(/\^/g, "\\^");
							escapedValue = escapedValue.replace(/\$/g, "\\$");
							escapedValue = escapedValue.replace(/\//g, "\\/");
						}
						
						valueToCompare = "/^[\\w\\W]*" + escapedValue + "[\\w\\W]*$/i.test(";
					}
					
					var isSimpleAttribute = (attr.indexOf('.') == -1);			
					var condition = null;
					if (isSimpleAttribute){
						if (isExact){
							condition = 'item.json.' + attr + ' == ' + valueToCompare;
						} else {
							condition = valueToCompare + 'item.json.' + attr + (needConvertToString ? "+''" : "") + ')';  
						}
					} else {
						var attrNames = attr.split('.');
						condition = "__arrayUtil__.some(item.json." + attrNames[0] + ", function(subItem){return ";
						if (isExact){
							condition += 'subItem.' + attrNames[1] + ' == ' + valueToCompare;
						} else {
							condition += valueToCompare + 'subItem.' + (needConvertToString ? "+''" : "") + attrNames[1] + ')';  
						}
						condition += ";})";
					}
					queryData.push(condition);
				}
				queryData.push(')');
			});
			
			return queryData.join('');
		},
		
		_arrayFilter: function(filter, data) {
			Logger.timerStart("_JsonInMemoryFindMixin - _arrayFilter");
			//need to temporarily set in global scope
			//so filter string can access it
			window.__arrayUtil__ = arrayUtil;
			var filteredData = arrayUtil.filter(data, "return " + filter + ";");
			delete window.__arrayUtil__;
			Logger.timerEnd("_JsonInMemoryFindMixin - _arrayFilter");
			return filteredData;
		},
		
		_find: function(query, data, isExact){
			var queryArray = (lang.isArray(query)) ? query : [query];
			
			var queryInDojoArrayFilterQuery = this._convertJsonQueryToDojoArrayFilterQuery(queryArray, isExact);
			return this._arrayFilter(queryInDojoArrayFilterQuery, data);
		},
				
		_findExactMatch: function(query, data){
			return this._find(query, data, EXACTMATCH);			
		},
				
		_findFuzzy: function(query, data){
			return this._find(query, data, FUZZY);			
		}
		
	};
});
