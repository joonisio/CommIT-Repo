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

define("platform/store/ResourceMetadata",
		["dojo/_base/declare",
		 "dojo/_base/array",
		 "dojo/_base/lang",
		 "platform/store/_ServerPreferredDataAccessStrategy",
		 "platform/store/_LocalDataAccessStrategy",
		 "platform/store/_InMemoryOnlyDataAccessStrategy",
		 "platform/logging/Logger",
		 "platform/store/SystemProperties",
		 "platform/util/DataValidator",
		 "platform/util/PlatformConstants",
		 "platform/store/_ResourceMetadataContext",
 		 "platform/store/_FormulaEvaluator"],

function(declare, array, lang, ServerPreferredDataAccessStrategy, LocalDataAccessStrategy, InMemoryOnlyDataAccessStrategy, Logger, SystemProperties, DataValidator, PlatformConstants, ResourceMetadataContext, FormulaEvaluator) {
	
	var ResourceMetrics = null;
	require(["platform/store/ResourceMetrics"], function(resourceMetrics) {
		ResourceMetrics = resourceMetrics;
	});

	var oslcDataTypesToJSONStoreDataTypes = {
		'upper': 'string',
		'longaln': 'string',
		'duration': 'number',
		'bigint': 'integer',
		'date': 'string',
		'time': 'string',
		'gl': 'string',
		'decimal': 'number',
		'float' : 'number',
		'double' : 'number',
		'xmllitteral' : 'string'
	};

	return declare("platform.store.ResourceMetadata", null, {		
		adapter: '',		
		name: '',
		local: '',
		inMemory: false,
		fields: null,
		_fieldMap: null,
		_complexFields: null,
		queryBases: null,
		queryBaseForSearch: null,
		singleton: false,		
		_classInstance: null,
		_urlBase: null,
		pageSize: null,
		additionalData: false,
		whereClause: null,
		conditions: null,
		simpleFieldsOSLCSelect: null,
		complexFieldsOSLCSelect: null,
		isSystem: null,
		isInited: false,
		formulaFields: null,
		hierarchyDescribedBy: null,
		hierarchyRequestedBy: null,
		creationFactoryURLs: null,
		isAttachment: null,
		refreshOnLogin: null,
		serverOnlyMode: null,
		orderBy: null,
		queryBasesLabel: null,
		maxFetchDataLimit: null,
		_canHaveAttachments: null,
		
		constructor: function(options) {
			this.formulaFields = [];
			this.queryBases = {};
			this.queryBasesLabel = [];
			if (options){
				this.adapter = (options.adapterName || '');
				this.name = (options.resourceName || '');
				this._classInstance = options.classInstance;
				this._urlBase = options['urlBase'];
				this.inMemory = options['inMemory'];
				this.isSystem = options['isSystem'];
				this.pageSize = options['pageSize'];
				this.refreshOnLogin = Boolean(options['refreshOnLogin']);
				this.serverOnlyMode = Boolean(options['serverOnlyMode']);
				this.orderBy = options['defaultOrderBy'];
				//A system resource is always an additional resource,
				//so to avoid having to declare both, assume additionalData if isSystem is true
				this.additionalData = (options['additionalData'] || options['isSystem']);
				this.hierarchyDescribedBy = options['hierarchyDescribedBy'];
				this.hierarchyRequestedBy = options['hierarchyRequestedBy'];
				this.isAttachment = (options['isAttachment']  === 'true' || options['isAttachment']  === true) || false;
				var maxFetchDataLimit = options['maxFetchDataLimit'];
				this.maxFetchDataLimit = (maxFetchDataLimit && maxFetchDataLimit > 0 ? maxFetchDataLimit : 500 );
			}
			this.fields = [];
			this._fieldMap = {};
			this.conditions = {};
			this._complexFields = [];
			// every resource needs the meta-data of __tempId
			this.addField(PlatformConstants.TEMPID_ATTR_DEF);
			this._setupAttachmentFieldsIfIsAttachment();
		},
		
/**@memberOf platform.store.ResourceMetadata */
		setSimpleFieldsSelectExpression: function(expression){
			this.simpleFieldsOSLCSelect = expression;
			return this;
		},
		
		setSupportiveFieldsSelectExpression: function(expression){
			this.complexFieldsOSLCSelect = expression;
			return this;
		},
		
		setSingleton: function(isSingleton){
			this.singleton = isSingleton;
			return this;
		},
		isSingleton: function(){
			return this.singleton;
		},
 		
		setWhereClause: function(whereClause) {
		    this.whereClause = whereClause;
		    return this;
		},

		getPageSize: function() {
		    return this.pageSize;
		},
		
		setPageSize: function(pageSize) {
		    this.pageSize = pageSize;
		    return this;
		},
		
		setQueryBases: function(queryBases){
			//this.queryBasesLabel = {};
			array.forEach(queryBases, function(queryBase){
				if (lang.isString(queryBase)){
					this.queryBases[queryBase] = 'savedQuery=' + queryBase;
					//store query label to use at list UI
					var tempLabel = {'name': queryBase, 'label': queryBase};
					this.queryBasesLabel.push(tempLabel);
				} else if (lang.isObject(queryBase) && 'name' in queryBase) {
					this.queryBases[queryBase['name']] = queryBase['queryString'];
					if (queryBase.defaultForSearch){
						this.queryBaseForSearch = queryBase['queryString'];
					}
					//store query label to use at list UI
					if(!queryBase.defaultForSearch){
						if(queryBase['queryLabel']){
							var tempLabel = {'name': queryBase['name'], 'label': queryBase['queryLabel']};
							this.queryBasesLabel.push(tempLabel);
							
						}else{
							var tempLabel = {'name': queryBase['name'], 'label': queryBase['name']};
							this.queryBasesLabel.push(tempLabel);
							
						}
					}
				}
			}, this);
			return this;
		},
		
		setResourceName: function(resourceName) {
			this.name = resourceName;
			return this;
		},
		getResourceName: function(){
			return this.name;
		},
		setLocal: function(local) {
			if (!local){
				if(this.inMemory){
					Logger.log("Resource [{0}] in an in memory resource and cannot be remote", 0, [this.name]);	
				}
				else{
					//Add remote unique id as it's always available
					//on the OSLC resource
					this.addField({
						name:  PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE,
						dataType: 'string',
						precision: 0,
						remoteName: PlatformConstants.REMOTE_UNIQUEID_ATTRIBUTE,
						local: false,
						index: true
					});
					this.addField({
	                  index : true,
	                  dataType : 'string',
	                  name : 'exact' + PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE,
	                  local : true,
	                  formula : '\'@--\' + ${' + PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE + '} + \'--@\'',
					});
					//add a field to track last fetched from server ts
					this.addField({
						name:  '_lastUpdatedDateTime',
						dataType: 'dateTime',
						local: true,
						index: false
					});
					//add a field to hold queryBase list
					this.addField({
						name:  PlatformConstants.QUERYBASES_LIST_ATTR,
						dataType: 'string',
						local: true,
						index: true
					});
					if (!this.additionalData){
						//add a field to track last changed ts
						this.addField({
							name:  '_lastChangedTimeStamp',
							dataType: 'dateTime',
							local: true,
							index: false
						});
						//add a field to track changed state
						this.addField({
							name:  PlatformConstants.ISCHANGED_ATTRIBUTE,
							dataType: 'boolean',
							local: true,
							index: true
						});
						//add a field to track error state
						this.addField({
							name:  PlatformConstants.ERRORED_ATTRIBUTE,
							dataType: 'integer',
							local: true,
							index: true
						});
						//add a field to track error state
						this.addField({
							name:  '_errorMessage',
							dataType: 'string',
							local: true,
							index: false
						});
						//add a field to track cleanup tokens
						this.addField({
							name:  '_cleanupTokens',
							dataType: 'string',
							local: true,
							index: true
						});
						//add a field to track record change state
						this.addField({
							name:  '_originalState',
							dataType: 'string',
							local: true,
							index: true
						});
					}
				}
			}							
			this.local = local || this.inMemory;
			return this;
		},
		isLocal: function(){
			return this.local || this.inMemory;
		},
		addFieldToKeys : function(index, field){
			if(!this.keyFields){
				this.keyFields = {};
			}
			this.keyFields[index] = field;
		},
		addFieldToPkIndexes : function(index, field){
			if(!this.pkIndexes){
				this.pkIndexes = {};
			}
			this.pkIndexes[index] = field;
		},
		addField: function(fieldDef) {
			if(fieldDef.local == undefined || fieldDef.local == null || fieldDef.local == "") {
				fieldDef.local = false;
			}
			
			//if it's an exact match index
			//create a separate indexed attribute with a formula
			//that stores the original value with delimiters
			if (fieldDef.index && fieldDef.isExactMatchIndex == 'true'){
				this.addField({
                  'index' : true,
                  'dataType' : fieldDef.dataType,
                  'persistent' : true,
                  'name' : 'exact' + fieldDef.name,
                  'local' : true,
                  'formula' : '\'@--\' + ${' + fieldDef.name + '} + \'--@\'',
				});
			}
			
			var field = lang.mixin({}, fieldDef);
			if (field['dataType']){
				field['dataType'] = field['dataType'].toLowerCase();
			}

			if (this.isAttachment && !field.local && field.remoteName !== 'rdf:about'){
				field.displayValueRemoteName = field.remoteName;
				field.remoteName = 'wdrs:describedBy';
			}
			
			field.isComplex = (field['referenceResource'] !== null && field['referenceResource'] !== undefined);
			field.isRemote = (field['local'] === false); 
			
			this.fields.push(field);
			if(field["name"]){
				if(!this._fieldMap[field["name"]]){
					this._fieldMap[field["name"]] = field;
					if(field['referenceResource']){
						this._complexFields.push(field);
					}
				}
				else{
					var ERROR = 0;
					Logger.log("[DATA] Invalid metadata - field "+field["name"]+" is defined more than once in resource " + this.name, ERROR);
				}
			}
			
			if (field.local){
				if(field.formula){
					var formula = field.formula;	
					//converts some dangerous stuff to an invalid char so it will fail
					//to evaluate
					formula = formula.replace(/function|;|eval|window/g, '%');
					var translatedFormula = formula.replace(/\$\{([^}]*)\}/g, "((this['$1'] === undefined || this['$1'] === null) ? '' : this['$1'])");
					try {
						field.formula = new Function("this['" + field.name + "'] = " + translatedFormula + ";");
					} catch (e) {
						var WARN = 1;
						Logger.log("Invalid formula for attribute " + field.name + 
								" of resource " + this.name + ": " + e.message, WARN);
						
						field.formula = function(){};
					}
					this.formulaFields.push(field);
				}
				if(typeof field.persistent == "undefined" || field.persistent === null){
					field.persistent = true;
				}
			}else{
				field.persistent = true;
			}
			if (field.pkIndex && !isNaN(field.pkIndex)){
				this.addFieldToPkIndexes(parseInt(field.pkIndex), field);
			}
			if (field.key && !isNaN(field.key)){
				this.addFieldToKeys(parseInt(field.key), field);
			}
			return this;
		},
		
		asJSON: function() {
			return {
				adapter: this.adapter,		
				name: this.name,
				local: this.local,
				fields: lang.clone(this.fields),
				queryBases: lang.clone(this.queryBases)
			};
		},
		
		fromJSON: function(json) {
			lang.mixin(this, json);
			return this;
		},
		
		getIndexes: function() {
			var fields = this.fields;
			indexes = {};
			for(var i = 0; i < fields.length; i++) {
				var field = fields[i];
				//If field is indexed but with exact match index
				//we just skip it as it will have a "clone" 
				//with values with delimiters
				if(field.index && field.isExactMatchIndex != 'true') {
					var dataType = field.dataType;
					if (dataType.match(/reference|inline/)){
						if (field.usage){
							dataType = (oslcDataTypesToJSONStoreDataTypes[field.usage] || 'string');
						} else {
							dataType = 'string';
							
						}
						indexes[field.name] = dataType;
					} else if (dataType in oslcDataTypesToJSONStoreDataTypes){
						indexes[field.name] = oslcDataTypesToJSONStoreDataTypes[dataType];
						
					} else {
						indexes[field.name] = dataType;
					}
					
				};
				
			}
			return indexes;
		},		
		hasField: function(fieldName) {
			return this.getField(fieldName) !== null;
		},		
		getField: function(fieldName){			
			return this._fieldMap[fieldName];
		},
		isFieldComplex: function(fieldName){
			var field = this.getField(fieldName);
			return (field && field.isComplex) || false;
		},
		isFieldRemote: function(fieldName){
			var field = this.getField(fieldName);
			return (field && field.isRemote) || false;
		},
		getFieldForRemoteName: function(fieldRemoteName){
			for(var idx in this.fields){
				var field = this.fields[idx];
				if(field.isRemote && field.remoteName == fieldRemoteName){
					return field;
				}
			}
			return null;
		},
		trackChanges: function(fieldName){
			return !this.isLocal() && this.isFieldRemote(fieldName);
		},
		getComplexFieldList: function(){
			return this._complexFields;
		},
		getURLBase: function(){
			if (this._urlBase){
				return this._urlBase;
			}
			return null;			 
		},		
		getClassInstance: function(){
			return this._classInstance;
		},
		addCondition: function(conditionObj){
			var alias = conditionObj["alias"];
			if(alias){ 
				this.conditions[alias] = conditionObj["requiresRole"] || [];
			}
			return this;
		},
		getRequiredRolesFor: function(alias){
			return this.conditions[alias] || [];
		},
		isDataTypeCompatibleWithValue: function(dataType, value){				
			return DataValidator.isDataTypeCompatibleWithValue(dataType, value);
		},
		setCreationFactories: function(factoryURLsArray){
			this.creationFactoryURLs = factoryURLsArray;
			return this;
		},
		_setupAttachmentFieldsIfIsAttachment: function(){
			if(this.isAttachment){
				
				this.addField({
					name:  PlatformConstants.ATTACH_LOCATION_ATTR,
					dataType: 'string',
					precision: 0,
					local: true,
					index: false
				});
				this.addField({
					name:  PlatformConstants.ATTACH_DESCRIPTION_ATTR,
					dataType: 'string',
					precision: 0,
					local: true,
					index: false
				});	
				this.addField({
					name:  PlatformConstants.ATTACH_NAME_ATTR,
					dataType: 'string',
					precision: 0,
					maxSize: 10,
					local: true,
					index: false
				});
				this.addField({
					name:  PlatformConstants.ATTACH_CATEGORY_ATTR,
					dataType: 'string',
					precision: 0,
					local: true,
					index: false
				});
				this.addField({
					name:  PlatformConstants.ATTACH_SIZE_ATTR,
					dataType: 'integer',
					precision: 0,
					local: true,
					index: false
				});
				this.addField({
					name:  PlatformConstants.ATTACH_CREATION_DATE,
					dataType: 'dateTime',
					precision: 0,
					local: true,
					index: false
				});
				this.addField({
					name:  PlatformConstants.ATTACH_UPLOAD_PATH,
					dataType: 'string',
					precision: 0,
					local: true,
					index: false
				});
				this.addField({
					name:  PlatformConstants.ATTACH_IS_DOWNLOADED,
					dataType: 'boolean',
					precision: 0,
					local: true,
					index: false,
					formula: '!!${' + PlatformConstants.ATTACH_LOCATION_ATTR + '}'
				});				
			}
		},
		
		getOSLCTranslationRules: function(isSubRules) {
			var result = {};
			array.forEach(this.fields, function(field) {
				if (!field.local){
					var originalAttributeName = field.remoteName;

					var rule = field.usage?{newKey: field.name, usage: field.usage}:{newKey: field.name};
					if (field.displayValueRemoteName){
						rule.attributeFromValue = field.displayValueRemoteName;
						if (field.remoteName.indexOf('.') > -1){
							var remoteNameParts = field.remoteName.split('.');
							originalAttributeName = remoteNameParts.splice(0,1);
							var remoteNameWithoutParent = remoteNameParts.join('.');
							rule.attributeFromValue = remoteNameWithoutParent + '.' + rule.attributeFromValue;
						}

					} else if (field.referenceResource){
						var refMetadata = ResourceMetadataContext.getResourceMetadata(field.referenceResource);
						rule.childrenRules = refMetadata.getOSLCTranslationRules(true);
						if (refMetadata.isAttachment){
							rule.dataArrayInAttribute = 'rdfs:member';
						}
					}

					if ((field.dataType === 'reference' || field.dataType === 'inline') &&
						(field.multiplicity || '').match(/-one$/)){ //ends with '-one'
						rule.referenceAttributeFromValue = 'rdf:about';
					}


					var rules = (result[originalAttributeName] || []);
					rules.push(rule);
					result[originalAttributeName] = rules;
				}
			});
			if (this.hierarchyDescribedBy){
				result[this.hierarchyDescribedBy] = PlatformConstants.TRANSLATE_AS_TOP_RECORDS;
			}
			var self = this;
			result[PlatformConstants.TRANSLATION_COMPLETION_CALLBACK] = function(record){
 				record[PlatformConstants.ISCHANGED_ATTRIBUTE] = false;				
				FormulaEvaluator.evaluateFormula(self, record);
 			};
			return result;
		},

		getAliasesTranslationRules: function(isSubRules){
			var result = {};
			array.forEach(this.fields, function(field){
				if (!field.local && 
					(field.remoteName !== !isSubRules)){
					var newKey = field.remoteName;
					var origKey = field.remoteName;
					if (field.displayValueRemoteName){
						newKey += '.' + field.displayValueRemoteName;
					}

					var rule = field.usage?[{newKey: newKey, origKey: origKey, usage: field.usage}]:[{newKey: newKey, origKey: origKey}];
					if (field.referenceResource && !field.displayValueRemoteName){
						var refMetadata = ResourceMetadataContext.getResourceMetadata(field.referenceResource);
						rule[0].childrenRules = refMetadata.getAliasesTranslationRules(true);
					}
					result[field.name] = rule;
				}
			});
			return result;
		},

		//Returns true if the attribute is complex and it's related resource is an attachment resource
		isComplexFieldAnAttachment: function(fieldName){
			var field = this.getField(fieldName);
			if (field && field.referenceResource ){
				var refMetadata = ResourceMetadataContext.getResourceMetadata(field.referenceResource);
				return (refMetadata && refMetadata.isAttachment);
			}
			return false;
		},
		
		getAttachmentContainerComplexAttributes: function(attrName){
			var result = {};
			array.forEach(this._complexFields, function(field){
				if (field.referenceResource && field.referenceResource !== this.name){
					var refMetadata = ResourceMetadataContext.getResourceMetadata(field.referenceResource);
					if (refMetadata){
						if (refMetadata.isAttachment){
							result[field[attrName]] = true;

						} else {
							var refAttachments = refMetadata.getAttachmentContainerComplexAttributes(attrName);
							if (Object.keys(refAttachments) > 0){
								result[field[attrName]] = refAttachments;
							}
						}
					}
				}
			}, this);
			return result;
		},

		getOSLCOrderBy: function(){
			if (this.orderBy) {
				var self = this;
				var sort = '';
				var sortOptions = this.orderBy.split(',');
				var count = 0;
				array.forEach(sortOptions, function(sortOption) {
					if(count > 0) {
						sort += ',';
					}
					var sortPieces = sortOption.split(' ');
					var field = self.getField(sortPieces[0]);
					if (field){
						if (field.remoteName){
							field = field.remoteName;
						}
						else{
							return;  //Must be a local field without a remotename for sorting so ignore sending to the server.
						}
					}
					//if field not found assume it is oslc name 
					var direction = '+';
					if (sortPieces[1] && sortPieces[1] == 'desc'){
						direction = '-';
					}
					sort += direction + field;
					count++;
				});
				return sort;
			}
		},

		getJSONStoreOrderBy: function() {
			if(this.orderBy) {
				var sort = new Array();
				var sortOptions = this.orderBy.split(',');
				array.forEach(sortOptions, function(sortOption) {
					var sortPieces = sortOption.split(' ');
					var field = sortPieces[0];
					var direction = WL.constant.ASCENDING;
					if(sortPieces[1] && sortPieces[1] == 'desc') {
						direction = WL.constant.DESCENDING;
					}
					var sortAttr = {};
					sortAttr[field] = direction;
					sort.push(sortAttr);
				});
				return sort;
			}
		},

		getResourceMetrics: function(queryBase){
			if(queryBase && !this.serverOnlyMode && queryBase != PlatformConstants.ERRORED_QUERYBASE && queryBase != PlatformConstants.CREATED_QUERYBASE){
				var metric = ResourceMetrics.getMetricsForResource(this.name, queryBase);
				/*if(this.additionalData){
					metric.set('Tyep','LOOKUP');
				} else if(this.isSystem){
					metric.set('Tyep','SYSTEM');
				} else {
					metric.set('Tyep','DOWNLAODWORKLIST');
				}*/
				return metric;
			}
			return null;
		},

		dataPastFetchLimit: function(queryBase){
			var metrics = this.getResourceMetrics(queryBase);
			return (metrics && metrics.hasPassedFetchLimit(this.maxFetchDataLimit, this.pageSize));
		},
		
		cancelActiveRefresh: function(){
			ResourceMetrics.cancelActiveRefresh(this.name);
		},
		
		clearActiveQueryBaseForResource: function(){
			ResourceMetrics.clearActiveQueryBaseForResource(this.name);
		},
		
		wasWorklistStoreCleared: function(queryBase){
			var metrics = this.getResourceMetrics(queryBase);
			return (metrics && !metrics.wasWorklistStoreCleared());
		},
		
		canHaveAttachments: function(){
			if (this._canHaveAttachments == null)
			{
				this._canHaveAttachments = Object.keys(this.getAttachmentContainerComplexAttributes()).length > 0;
			}
			return this._canHaveAttachments;
		},
		
		getKeyFields: function(){
			if (!this.keyFields && !this.pkIndexes){
				for(var i in this.fields){
					var field = this.fields[i];
					if (field.name == 'identifier' || field.remoteName == 'dcterms:identifier'){
						this.keyFields = {};
						this.addFieldToKeys(0, field);;
						break;
					}
				}
			}
			return this.keyFields?this.keyFields:this.pkIndexes;
		},
		
		getDataType: function (fieldInfo){
			if (fieldInfo && fieldInfo.referenceResource){
				var refMetadata = ResourceMetadataContext.getResourceMetadata(fieldInfo.referenceResource);
				if (refMetadata){
					var referenceResourceField = refMetadata.getFieldForRemoteName(fieldInfo.displayValueRemoteName);
					if (referenceResourceField == undefined || referenceResourceField==null){
						return fieldInfo.dataType;
					} else {
						return referenceResourceField.dataType;
					}
				}
			} else {
				return fieldInfo.dataType;
			}			
		},
		
		getChildMetaData: function (complexAttribute){
			var field = this.getField(complexAttribute);
			if (field && field.isComplex && field.referenceResource){
				return ResourceMetadataContext.getResourceMetadata(field.referenceResource);
			}
			return null;
		},
		
		checkIfOverTheDataLimit: function(data,update){
			if(SystemProperties.getProperty('checkResoruceEachDataStorageSize') && SystemProperties.getProperty('checkResoruceEachDataStorageSize').split(',').indexOf(this.name) > -1){
				array.forEach(data, function(record, index, arrayOut) {
					if(update){
						if(SystemProperties.getProperty('checkEachDataStorageMaxSize') && JSON.stringify(arrayOut[index].json).length > SystemProperties.getProperty('checkEachDataStorageMaxSize')){
							arrayOut[index].json[PlatformConstants.TOO_LARGE_DATA] = true;
							if(arrayOut[index].json.__complexAttributesFetched){
								array.forEach(Object.keys(arrayOut[index].json.__complexAttributesFetched), function(recordInter, indexInter, arrayInter) {
									arrayOut[index].json[recordInter] = [];
								});
							}
							
						}
					} else {
						if(SystemProperties.getProperty('checkEachDataStorageMaxSize') && JSON.stringify(arrayOut[index]).length > SystemProperties.getProperty('checkEachDataStorageMaxSize')){
							arrayOut[index][PlatformConstants.TOO_LARGE_DATA] = true;
							if(arrayOut[index].__complexAttributesFetched){
								array.forEach(Object.keys(arrayOut[index].__complexAttributesFetched), function(recordInter, indexInter, arrayInter) {
									arrayOut[index][recordInter] = [];
								});
							}
							
						}
					}
					
				});
			}
		}
		
	});
});
