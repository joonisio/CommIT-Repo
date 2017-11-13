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

define("platform/model/state/MultiLabelStateMachineSupport", 
["dojo/_base/declare", 
 "dojo/_base/lang", 
 "platform/auth/UserRolesManager", 
 "platform/model/state/StateMachineSupport"], function(declare, lang, UserRolesManager, StateMachineSupport) {	
	var MultiLabelStateMachineSupport = declare([StateMachineSupport], {
		labelStateConfiguration: {},
		_stateToLabelListConfiguration: {},
		constructor: function(options){
			options = options || {};
			this.labelStateConfiguration = options.labelStateConfiguration || {};
			this.setupMachine(options);
		},		
/**@memberOf platform.model.state.MultiLabelStateMachineSupport */
		canPerformTransition: function(from, to){
			return this.inherited(arguments, [this.toInternalState(from), this.toInternalState(to)]); 
		},
		setupMachine: function(options){
			this.inherited(arguments);
			this._stateToLabelListConfiguration = this._buildStateToLabelListConfiguration();
		},
		statesFrom: function(from){
			var internalResult = this.inherited(arguments, [this.toInternalState(from)]);
			var mapFunction = lang.hitch(this, this.toExternalLabels);
			/* removed the current status from the list. let only its synonyms */
			var computed = this._flatMap(internalResult, mapFunction); 
			return  this._stableRemoveDuplicates(computed).filter(function(value){
				return from != value;
			});
		},
		statesFromAsDataSetFilter: function(from, attributeToFilter){
			var states = this.statesFrom(from);			
			var statesObject = {};
			states.forEach(function(state){
				statesObject[state] = 1;
			});
			return {query: "$1[" + attributeToFilter + "] == 1", params: statesObject};
		},
		labeledStatesFrom: function(from){
			var transitions = this.statesFrom(from);
			return transitions.map(lang.hitch(this, this._toLabelsWithDescription));
		},
		fromStateToAlias: function(state){			
			return this.inherited(arguments, [this.toInternalState(state)]);
		},		
		getConfiguredStatesFrom: function(from){
			var internalResult = this.inherited(arguments, [this.toInternalState(from)]);
			var mapFunction = lang.hitch(this, this.toExternalLabels);
			var result = this._flatMap(internalResult, mapFunction);			
			return result;
		},
		toInternalState: function(externalState){
			var obj = this.labelStateConfiguration[externalState];
			if(obj){
				return obj["value"] || externalState;
			}
			return  externalState;
		},
		toDescription: function(externalState){
			var obj = this.labelStateConfiguration[externalState];
			if(obj){
				return obj["description"] || externalState;
			}
			return  externalState;
		},
		toExternalLabels: function(internalState){
			var pairs = this._stateToLabelListConfiguration[internalState] || [{label: internalState}];			
			return pairs.map(function(pair){				
				return pair["label"];
			});
		},
		toDefaultExternalLabel: function(internalState){
			var pairs = this._stateToLabelListConfiguration[internalState] || [{label: internalState}];	
			var i = 0;
			for (i=0; i < pairs.length; i++) {
				if (pairs[i]["defaults"]) {			
					break;
				}
			};
			if (pairs[i]["defaults"]===true) {
				return (pairs[i]["label"]);
			} else {
				return pairs[0]["label"];
			}
		},
		_toLabelsWithDescription: function(externalState){
			var data = this.labelStateConfiguration[externalState] || {description: ""};
			return {label: externalState, description: (data["description"] || "")};						
		},
		_buildStateToLabelListConfiguration: function(){
			var map = {};
			for(key in this.labelStateConfiguration){
				var newKeyObject = this.labelStateConfiguration[key];
				var newKey = newKeyObject["value"] || newKeyObject || key;
				if(!map[newKey]){
					map[newKey] = [];
				}
				map[newKey].push({label: key, description: (newKeyObject["description"] || ""), defaults: (newKeyObject["defaults"] || "") });
			}
			return map;
		},
		_flatMap: function(list, mapFunction){
			return this._flatten(list.map(mapFunction), []);			
		},
		_flatten: function(list, acc){
			if(!list || list.length == 0) return acc;
			var head = list[0];
			var tail = list.slice(1);
			if(head instanceof Array)  return this._flatten(tail, acc.concat(head));			
			return this._flatten(tail, acc.push(head));
		},
		_stableRemoveDuplicates: function(listOfStrings){
			var map = {};
			var result = [];
			listOfStrings.forEach(function(value) {
				map[value] = value;
			});
			listOfStrings.forEach(function(value) {
				if(map[value]){
					result.push(value);
					delete map[value];
				}
			});
			return result;
		}
	});
	MultiLabelStateMachineSupport.fromModelDataSetToLabelStateConfiguration = function(
			modelDataSet, externalValueFieldName, internalValueFieldName, descriptionFieldName){
		var result = {};
		if(modelDataSet){
			modelDataSet.foreach(function(record){
				var key = record.get(externalValueFieldName);
				var value1 = record.get(internalValueFieldName);
				var value2 = record.get(descriptionFieldName);
				var defaultValue = record.get("defaults");
				if(key && value1 && typeof defaultValue === "undefined"){
					result[key] = {value: value1, description: value2};
				} else if (key && value1 && typeof defaultValue !== "undefined") {
					result[key] = {value: value1, description: value2, defaults: defaultValue};
				}				
			});
		}
		return result;
	};	
	return MultiLabelStateMachineSupport;		
});
