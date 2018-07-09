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

define("platform/model/ModelData",
["dojo/_base/declare",
 "dojo/_base/lang",
 "dojo/_base/array",
 "dojo/Deferred",
 "dojo/Stateful",
 "platform/exception/PlatformRuntimeException",
 "platform/logging/Logger",
 "dojo/date/stamp",
 "platform/util/DateTimeUtil",
 "platform/store/_ResourceMetadataContext",
 "platform/util/PlatformConstants",
 "platform/util/CompressionHelper",
 "dojo/promise/all",
 "platform/store/_FormulaEvaluator",
 "platform/store/StoreLock",
 "platform/model/helper/ModelDataAdvisor",
 "platform/comm/_ConnectivityChecker"], 
function(declare, lang, arrayUtil, Deferred, Stateful, PlatformRuntimeException, Logger, dateISOFormatter, dateTimeUtil, ResourceMetadataContext, PlatformConstants, CompressionHelper, all, FormulaEvaluator, StoreLock, ModelDataAdvisor, ConnectivityChecker) {
	var ModelService = null;
	var ModelDataSet = null;
	var _lastTempId = null;
	var internalFields = ["_watchCallbacks", "_isNew", "_isReadOnly", "_isInstantiating", "_id", "_attrPairNames", "declaredClass", "_isMarkedToDelete", "__advised",
	                      "_shouldDeferChanges", "_patchToApply", "_runtimeMetadata", "_pendingValues", "_changesWatchHandle", "__changeTransactions", "_ignoreModifications", "__changedAttributes", "__changedLocalAttributes"];
	function nextTempId(){
		if (_lastTempId === null){
			_lastTempId = new Date().getTime();
		}		
		return _lastTempId++;
	}
	var QUERYBASES_LIST_ATTR = PlatformConstants.QUERYBASES_LIST_ATTR;
	var CREATED_QUERYBASE = PlatformConstants.CREATED_QUERYBASE;
	var TXN_ISOPEN_ATTR = PlatformConstants.TRANSACTION_ISOPEN_ATTR;
	var TXN_TYPE_ATTR = PlatformConstants.TRANSACTION_TYPE_ATTR;
	var TXN_TYPE_NORMAL = PlatformConstants.TRANSACTION_TYPE_NORMAL;	
	var TXN_TYPE_PRIORITY = PlatformConstants.TRANSACTION_TYPE_PRIORITY;
	var LOCAL_UNIQUEID_ATTRIBUTE = PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE;
	
	var result = declare(Stateful, {
		_id: null,
		_isNew: false,		
		_isReadOnly: false,
		_isInstantiating: true,
		_isChanged: false,
		_isMarkedToDelete: false,
		_lastChangedTimeStamp: null,
		__complexAttributesFetched: null,
		__changedAttributes: null,
		__changedLocalAttributes: null,
		__changeTransactions: null,
		_shouldDeferChanges: false,
		_patchToApply: null, 
		_runtimeMetadata: null,
		_pendingValues: null,
		_undoInProgress : false,
		
		constructor: function(data){
			this.__complexAttributesFetched = {};
			this.__changedAttributes = {};
			this.__changedLocalAttributes = {};
			this.__changeTransactions = [];
			this._pendingValues = {};
			this._isNew = (!data);
			if (!this._isNew){
				this._setId(data);				
				var objToMixin = data;
				if ('json' in data){
					objToMixin = data.json;
				}
				this._isReadOnly = false;
				lang.mixin(this, objToMixin);
			}else{
				this._id = nextTempId();
				this[this._tempIdName()] = this._id;							
			}			
		},
/**@memberOf platform.model.ModelData */
		removeFromCreatedList: function() {
			this.removeFromQueryBase(CREATED_QUERYBASE);
			if (this.getOwner().getQueryBase() == CREATED_QUERYBASE){
				this.deleteLocal(true);
				this.getOwner()._childModified(this);
			}
		},
		
		removeFromQueryBase: function(queryBase) {
			if (this[QUERYBASES_LIST_ATTR]){
				var currentQueryBases = this[QUERYBASES_LIST_ATTR];
				currentQueryBases = currentQueryBases.replace(new RegExp("<" + queryBase + ">", "g"), '');
				this.set(QUERYBASES_LIST_ATTR, currentQueryBases);
			}
		},

		setQueryBase: function(queryBase) {
			if (this[QUERYBASES_LIST_ATTR]!=null || this[QUERYBASES_LIST_ATTR]!= undefined){
				var currentQueryBases = this[QUERYBASES_LIST_ATTR];
				currentQueryBases = currentQueryBases+ "<" + queryBase + ">";
				this.set(QUERYBASES_LIST_ATTR, currentQueryBases);
			}
		},
		
		isTrackingModificationsDisabled: function(){
			return this._ignoreModifications || false;
		},		
		_turnOffListenChanges: function(){
			this.getOwner()._unlistenForRecordChanges(this);
			this._ignoreModifications = true;
		},
		_turnOnListenChanges: function(){
			this.getOwner()._listenForRecordChanges(this);
			this._ignoreModifications = false;
		},				
		__attributeModified: function(attributeName){

			var isAttachAttr = (this.getMetadata().isAttachment && (attributeName == PlatformConstants.ATTACH_UPLOAD_PATH || attributeName == PlatformConstants.ATTACH_LOCATION_ATTR));

			if(isAttachAttr && this.isNew()){
				this.__changedAttributes[attributeName] = attributeName;
			} 
			else if(attributeName && !this._isInternalField(attributeName))
			{
				// Keep track of Local Attribute changes for applyPatch cases.
				if (!this.getMetadata().isFieldRemote(attributeName)){
					if(!this.__changedLocalAttributes[attributeName]){
						this.__changedLocalAttributes[attributeName] = attributeName;
					}
				}
				else if (this.getMetadata().trackChanges(attributeName))
				{				
					if(!this.getParent()){
						this.__handleChangeTransaction(attributeName);
					}
					if(!this.__changedAttributes[attributeName]){
						this.__changedAttributes[attributeName] = attributeName;
					}			
					var complexAttributeInParent = this.getOwner().getRelationNameWithParent();
					if(complexAttributeInParent){
						var parent = this.getParent();
						if(parent){
							parent.__attributeModified(complexAttributeInParent);
						}
					}
				}
			}
		},
		markAsModified: function(attributeName){			
			this.__attributeModified(attributeName);
			if(!this.isNew()){
				this.getOwner()._childModified(this);
			}
			this[PlatformConstants.ISCHANGED_ATTRIBUTE] = true;
			this[PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE] = dateISOFormatter.toISOString(new Date());		
		},
		openPriorityChangeTransaction: function(){
			var currentTransactionType = this.__getCurrentTransactionType();
			if (!currentTransactionType){
				this.__createTransaction(TXN_TYPE_PRIORITY);

			} else if (currentTransactionType !== TXN_TYPE_PRIORITY){
				this.__createTransaction(TXN_TYPE_PRIORITY);

			} else if (this.__isCurrentTransactionOpen()){
				var WARN = 1;
				Logger.log("There is already an open priority change transaction for record " + 
					this.getId() + " of resource " + this.getMetadata().getResourceName(), WARN);
			}
			else
			{
				this.__createTransaction(TXN_TYPE_PRIORITY);
			}
		},
		closePriorityChangeTransaction: function(){
			var currentTransactionType = this.__getCurrentTransactionType();
			var WARN = 1;
			if (!currentTransactionType){
				Logger.log("No transactions to close  for record " + 
					this.getId() + " of resource " + this.getMetadata().getResourceName(), WARN);

			} else if (currentTransactionType != 'priority'){
				Logger.log("Tried to close a priority change transaction for record " + 
					this.getId() + " of resource " + this.getMetadata().getResourceName() + " but a " + 
					currentTransactionType + " was found", WARN);

			} else if (!this.__isCurrentTransactionOpen()){
				Logger.log("Tried to close a priority change transaction for record " + 
					this.getId() + " of resource " + this.getMetadata().getResourceName() + " but it's already closed", WARN);

			} else {
				this.__closeCurrentTransaction();
			}
		},
		
		cancelCurrentTransaction: function(){
			if (this.__changeTransactions.length > 0){
				var currentTransaction = this.__changeTransactions[this.__changeTransactions.length - 1];
				if (currentTransaction[TXN_ISOPEN_ATTR]){
					this.__changeTransactions.pop();
				}
			}
		},
		
		__handleChangeTransaction: function(attributeName){
			var currentTransactionType = this.__getCurrentTransactionType();
			if (currentTransactionType === null || !this.__isCurrentTransactionOpen()){				
				this.__createTransaction(TXN_TYPE_NORMAL);
			} 
			this.__recordChangeInTransaction(attributeName, this[attributeName]);
		},
		__getCurrentTransactionType: function(){
			if (this.__changeTransactions.length === 0){
				return null;
			}
			return this.__changeTransactions[this.__changeTransactions.length - 1][TXN_TYPE_ATTR];
		},
		__isCurrentTransactionOpen: function() {
			if (this.__changeTransactions.length === 0){
				return false;
			}
			return this.__changeTransactions[this.__changeTransactions.length - 1][TXN_ISOPEN_ATTR];
		},		
		__recordChangeInTransaction: function(attributeName, attributeValue){
			var currentTransaction = this.__changeTransactions[this.__changeTransactions.length - 1];
			if (attributeValue && lang.isObject(attributeValue) && attributeValue.modifiedAttributesAsJSONArray){
				// do a lazy collection of related data to avoid problems when related records are created and canceled. 
				currentTransaction[attributeName] = attributeName;
			} else {
				currentTransaction[attributeName] = attributeValue;
			}			
		},
		__closeCurrentTransaction: function(){
			if (this.__changeTransactions.length > 0){
				var currentTransaction = this.__changeTransactions[this.__changeTransactions.length - 1];
				currentTransaction[TXN_ISOPEN_ATTR] = false;
				//Only __isOpen and __transactionType__ keys, so this is
				//an empty transaction, doesn't work keeping it.
				if (Object.keys(currentTransaction).length === 2){
					this.__changeTransactions.pop();
				}
				else{
					// collect the changes for the complex fields
					var metadata = this.getMetadata();
					for(var attribute in currentTransaction){
						var fieldInfo = metadata.getField(attribute);
						if(fieldInfo && fieldInfo.isComplex && fieldInfo.dataType == 'inline'){
							if(fieldInfo.multiplicity){
								if(fieldInfo.multiplicity.match(/or-many$/)){
									var value = this.getLoadedModelDataSetOrNull(attribute);
									if(value && value.modifiedAttributesAsJSONArray){
										value = value.modifiedAttributesAsJSONArray();
										if(value.length > 0 || value._hasRecordsToDelete){
											currentTransaction[attribute] = value;
										}else{
											delete currentTransaction[attribute];
										}
									}																						
									else{
										delete currentTransaction[attribute];
									}
								}
								else{
									/* this is the [zero|one]-or-one case */
									currentTransaction[attribute] = this[attribute] || null;
									currentTransaction[attribute + "_ref"] = this[attribute + "_ref"];
								}
							}
						}
					}					
				}
			}
		},
		__createTransaction: function(transactionType){
			this.__closeCurrentTransaction();
			var newTransaction = {};
			newTransaction[TXN_TYPE_ATTR] = transactionType;
			newTransaction[TXN_ISOPEN_ATTR] = true;
			if(this.wasCommittedToServer()){
				newTransaction[LOCAL_UNIQUEID_ATTRIBUTE] = this.getRemoteId();
			}
			this.__changeTransactions.push(newTransaction);
		},
		pendingTransactions: function(){
			this.__closeCurrentTransaction();
			return this.__changeTransactions;
		},
		clearPendingTransactions: function() {
			this.__changeTransactions = [];
		},
		reOpenTransactionWithAttribute: function (attribute){
			var numTrans = this.__changeTransactions.length;
			if (numTrans > 0){
				for(var x= numTrans -1;x>=0; x--){
					var transaction = this.__changeTransactions[x];
					if(transaction[attribute]){
						if(!transaction[TXN_ISOPEN_ATTR]){
							this.__closeCurrentTransaction();
							this.__changeTransactions.splice(x,1);
							transaction[TXN_ISOPEN_ATTR] = true;
							this.__changeTransactions.push(transaction);
						}
						return true;
					}
				}
			}
			return false;
		},
		
		isReadOnly: function(){
			var parent = this.getOwner().getParent(); 
			if(parent){
				return parent.isReadOnly();
			}			
			return this._isReadOnly || false;
		},
		setReadOnly: function(state){
			this._isReadOnly = state === true;						
		},
		__getModifiedAttributesList: function(){
			return Object.keys(this.__changedAttributes);
		},
		__getModifiedLocalAttributesList: function(){
			return Object.keys(this.__changedLocalAttributes);
		},
		__clearModifiedAttributeList: function(){
			this.__changedAttributes = {};
			this.__changedLocalAttributes = {};
			this.__changeTransactions = [];
		},
		_isInternalField: function(attributeName){
			var internal = internalFields.some(function(value){ 
				return attributeName == value; 
			});
			return internal || attributeName == PlatformConstants.ERRORED_ATTRIBUTE 
					|| attributeName == PlatformConstants.ERRORED_ATTRIBUTE_MSG || false;
		},				
		isPartial: function(){
			var self = this;
			var isFullRecordLoaded = this['__isFullRecordLoaded']; //FULL_RECORD_LOADED
			return !isFullRecordLoaded && 
				   arrayUtil.some(this.getMetadata().fields, function(metadataField){
					   //TODO What if a given complex field is never loaded
					   //either by user navigation or through handlers??
					   //A good example is woserviceaddress
					   var isComplexField = metadataField.dataType === 'inline';
					   return isComplexField && !(metadataField.name in self.__complexAttributesFetched);
				   });
		},	
		isComplexAttributeLoaded: function(attributeName){
			return this['__isFullRecordLoaded'] || (this.__complexAttributesFetched || {})[attributeName];
		},
		createShallowCopy: function(arrayOfFieldsToCopy){
			var newRec = this.getOwner().createNewRecord();
			var shouldRestrictFields = lang.isArray(arrayOfFieldsToCopy);
			arrayUtil.forEach(this.getMetadata().fields, function(field){
				var fieldName = field.name;
				if (field.dataType != 'inline' && fieldName != "remoteid"){
					if (!shouldRestrictFields || 
						arrayUtil.indexOf(arrayOfFieldsToCopy, fieldName) > -1){
						newRec.set(fieldName, this.get([fieldName]));
						if (field.dataType == 'reference'){
							newRec.set(fieldName + '_ref', this.get([fieldName + '_ref']));
						}
					}
				}
			}, this);
			
			return newRec;
		},
		_fromNewToExisting: function(newId){
			if (!isNaN(newId)){
				this._id = newId;
			}
			delete this[this._tempIdName()];
			this._isNew = false;
			this._isChanged = false;
			this.clearAllPendingValues();
			this.__clearModifiedAttributeList();
		},		
		_setId: function(data){
			if ('_id' in data){
				this._id = data._id;
			} else {
				this._id = nextTempId();				
			}
			if(this.isNew){
				this[this._tempIdName()] = this._id;
			}
		},
		_tempIdName: function(){
			return PlatformConstants.TEMPID_ATTR_NAME;
		},
		isErrored: function(){
			return this.get(PlatformConstants.ERRORED_ATTRIBUTE) === 1;
		},
		getErrorMessageOrNull: function(){
			return this.get(PlatformConstants.ERRORED_ATTRIBUTE_MSG) || null;
		},
		_clearErrors: function(){
			this.set(PlatformConstants.ERRORED_ATTRIBUTE, 0);
			this.set(PlatformConstants.ERRORED_ATTRIBUTE_MSG, null);
		},
		_erroredWithMessage: function(errorMessage){
			if(errorMessage){
				this._erroredRecord();
				this.set(PlatformConstants.ERRORED_ATTRIBUTE_MSG, errorMessage);
			}
		},
		_erroredRecord: function(){
			this.set(PlatformConstants.ERRORED_ATTRIBUTE, 1);
		},
		_getTempId: function(){
			return this[this._tempIdName()];
		},
		getId: function(){
			return this._id;
		},		
		getRemoteId: function(){
			return this['remoteid'];
		},
		setDateValue: function(attributeName, dateValue){
			if(dateValue == null){
				this.setNullValue(attributeName);
			}else{
				var isoString = dateISOFormatter.toISOString(dateValue);
				if(dateValue != null && isoString == null){
					this.set(attributeName, "Invalid Date");
				}
				else{
					this.set(attributeName, isoString);
				}
			}
		},
		setNullValue: function(attributeName){
			this.set(attributeName, null);
		},
		isNull: function(attributeName){
			return this.get(attributeName) == null;
		},
		setTimestampValue: function(attributeName, longValue){
			this.setDateValue(attributeName, new Date(longValue));
		},
		getAsDateOrNull: function(attributeName){
			var info = this.getMetadata().getField(attributeName);
			var result = null;
			if(info){
				//If the field is used for time only, you cannot trust the GMT Offset or dates so just construct a new one
				//We have to parse it ourselves, because the dateISOFormatter will mess it up based on the incorrect GMT Offset
				if ('time' == info['usage']) {
					var value = this.get(attributeName);	
					if (value) {
						var time = value.match(/T(\d+):(\d+):(\d+)/);
						if (time.length==4) {
							var hours = parseInt(time[1]);
							var minutes = parseInt(time[2]);
							var seconds = parseInt(time[3]);
						}
						if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
							return new Date(1970, 0, 1, hours, minutes, seconds, 0);
						}
					}
				} else if ('date' == info['dataType'] || 'datetime' == info['dataType'] || 'dateTime' == info['dataType'] || 'time' == info['dataType']){
					var value = this.get(attributeName);
					if(value){
						return dateISOFormatter.fromISOString(value);
					}
				}
			}
			return result;
		},
		getAsTimestampOrNegative: function(attributeName){
			var result = this.getAsDateOrNull(attributeName);
			if(result){
				return result.getTime();
			}
			return -1;
		},
		setDurationInMillis: function(attributeName, valueInMilliseconds){
			var inHours = dateTimeUtil.fromMillisecondsToHours(valueInMilliseconds);
			/* values less than a minute will cause validation problems */
			if(inHours < dateTimeUtil.oneMinuteInHours()){
				inHours = 0.0;
			}
			this.set(attributeName, inHours);
		},
		getDurationInMillisOrNegative: function(attributeName){
			var inHours = this.get(attributeName);
			if(typeof inHours == "number"){
				return dateTimeUtil.fromHoursToMilliseconds(inHours);
			}
			else{
				return -1;
			}
		},
		_initRuntimeMetadata: function() {
			this._runtimeMetadata = {};
			var metadata = this.getOwner().getMetadata();
			arrayUtil.forEach(metadata.fields, lang.hitch(this, function(field){
				this._runtimeMetadata[field.name] = new Stateful({
					readonly: field.readonly?field.readonly:false,
					required: field.required?field.required:false,
				});
			}));
			
		},
		_initValues: function(){
			if (this._isNew){
				var metadata = this.getOwner().getMetadata();
				var filteredFields = arrayUtil.filter(metadata.fields, function(field) {
					var name = field.name;
					/* (include here attributes that should not be swept)
					 * below are attributes initialized in the constructor
					 * and doesn't make sense to sweep them, since the _initValues()
					 * is just called immediately after constructs the ModelData.
					 */
					return (
						PlatformConstants.ID !== name &&
						PlatformConstants.TEMPID_ATTR_DEF.name !== name &&
						PlatformConstants.CHANGED_ATTRS !== name &&
						PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE !== name
					);
				});
				arrayUtil.forEach(filteredFields, lang.hitch(this, function(field){
					this[field.name] = null;
				}));
			}
		},		
		getRuntimeFieldMetadata: function(fieldName){
			return this._runtimeMetadata[fieldName];
		},		
		
		isUndoInProgress : function() {
			return this._undoInProgress;
		},
		
		_restoreDataFromOriginal: function(){
			var compressed = this[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE];
			var decompressed = CompressionHelper.decompress(compressed);
			var decompressedModelData = JSON.parse(decompressed);

			this._undoInProgress = true;
			this._applyPatch(decompressedModelData, true);
			this._undoInProgress = false;
			
			this.__clearModifiedAttributeList();
			this.clearPendingTransactions();
			this._clearErrors();
			this._initRuntimeMetadata();
			//Set as null instead of delete so JSONStore 
			//can index it with 'null' and we use this info
			//to search for unchanged records in device
			this[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = 'null';
			
		},
		
		undoChangesWithPromise: function() {
			var self = this;
			return StoreLock.lock(this.getMetadata().getResourceName(), function(){
				var deferred = new Deferred();
				if (!self.wasCommittedToServer()){
					return self.deleteLocalAndPendingTransactionsWithPromise();
				}
				if (self[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] && self[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE]!='null'){
					self._restoreDataFromOriginal();
					self.getOwner()._asyncCompleteUndoChangesOfChild(self).then(function(){
						deferred.resolve();		
					}).otherwise(function(){
						deferred.resolve();
					});
					
				}else{
					self[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = 'null';
					deferred.resolve();
				}
				return deferred.promise;
			});
		},	
		
		
		deleteLocalAndPendingTransactionsWithPromise: function() {
			var deferred = new Deferred();
			this.deleteLocal();
			if (!this.getMetadata().isLocal()){				
				deferred.resolve(this.getOwner()._asyncCompleteDeleteLocal(this));		
			}else{
				deferred.resolve();
			}
			return deferred.promise;
		},
		postscript: function(){
			this['_isInstantiating'] = undefined;
		},
		
		__idSetter: function(value){
			if (!this._isInstantiating){
				throw new PlatformRuntimeException('invalidOperation');
			}
		},
		
		__isNewSetter: function(value){
			if (!this._isInstantiating){
				throw new PlatformRuntimeException('invalidOperation');
			}
		},
		
		isNew: function(){
			return this._isNew;
		},
		_clearChangesForAttribute: function(attribute){
			if (this. __changedAttributes && this.__changedAttributes[attribute]){
				delete this.__changedAttributes[attribute];
				if(!this._isNew && !this._isMarkedToDelete && Object.keys(this.__changedAttributes).length == 0){
					this[PlatformConstants.ISCHANGED_ATTRIBUTE] = false;
					this[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = 'null';
					this.clearPendingTransactions();
					delete this.getOwner()._changedRecords[this._id];
				}
			}
		},
		deleteLocal: function(deleteFromDataSetOnly){
			this._isMarkedToDelete = true;
			this.getOwner()._childRemoved(this, deleteFromDataSetOnly);			
		},
		deleteChildOnServer: function(){
			if (!this.getOwner()._relationNameWithParent) {
				throw new PlatformRuntimeException('msg');
			}
			this._isMarkedToDelete = true;
			this.__deleteOnServer = true;
			this.getOwner()._childRemoved(this,false,true);			
		},
		isMarkedToDelete: function(){
			return this._isMarkedToDelete;
		},
		modifiedAttributesAsJSON: function(){
			var returnedJson = {};			
			var attributesToInclude = this.__getModifiedAttributesList();
			if(attributesToInclude.length > 0){
				if(this.wasCommittedToServer()){
					// If the metadata defines an identifier, then use it, otherwise use remoteid/rdf:about
					var oslcTranslationRules = this.getMetadata().getOSLCTranslationRules();
					
					if (oslcTranslationRules["dcterms:identifier"])
					{
						attributesToInclude.push(oslcTranslationRules["dcterms:identifier"][0].newKey);
					}
					else
					{
						attributesToInclude.push(LOCAL_UNIQUEID_ATTRIBUTE);
					}
				}else{
					attributesToInclude.push(PlatformConstants.TEMPID_ATTR_NAME);
					// FIXME temporary - to be removed when oslc returns rdf:about for children resource
					if(this.getMetadata().hasField(PlatformConstants.REF_ID_ATTR)){
						attributesToInclude.push(PlatformConstants.REF_ID_ATTR);
					}					
				}
				arrayUtil.forEach(attributesToInclude, function(attribute){
					var value = this[attribute];								
					if(value && lang.isObject(value) && lang.exists('modifiedAttributesAsJSONArray', value)) {
						returnedJson[attribute] = value.modifiedAttributesAsJSONArray();
					}
					else {
						returnedJson[attribute] = "" === value ? null : value;
					}				
				}, this);
				return returnedJson;
			}
			return null;
		},
		asJSON: function(){
			var returnedJson = {};			
			for (name in this){
				var value = this[name];
				if (!lang.isFunction(value) && internalFields.indexOf(name) === -1){					
					if(value && lang.isObject(value) && lang.exists('asJSONArray', value)) {
					    returnedJson[name] = value.asJSONArray();
					}
					else {
						returnedJson[name] = this[name];
					}
				}
			}
			
			FormulaEvaluator.evaluateFormula(this.getMetadata(), returnedJson);

			if (this._isNew){
				return returnedJson;
				
			} else { 
				return {
					_id: this._id,
					json: returnedJson
				};
			}
		},
		isModified: function(){
			return this._isChanged || this.isNew();
		},
		getOwner: function(){
//			Summary:
//				Returns the ModelDataSet that contains this record.
//				
//			Description:
//				This method is overriden by ModelDataSet so we benefit from closure
//				to prevent holding multiple references to ModelDataSet
		},
		getMetadata: function(){
			return this.getOwner().getMetadata();		
		},
		getLoadedModelDataSetOrNull: function(/*String*/ complexAttributeName){
			var data = this[complexAttributeName] || null;
			if(data && data instanceof Array){
				var childMetadata = this._getChildResourceMetadata(complexAttributeName);
				this[complexAttributeName] = new ModelDataSet(childMetadata, null, data, this, complexAttributeName);
			}
			return this[complexAttributeName] || null;
		},
		
		/**
		 * If the ModelData comes from the server and can be saved, this method will always return a new
		 * ModelDataSet unless useExisting is true.
		 * 
		 */
		getModelDataSet: function(/*String*/ complexAttributeName, /*boolean*/useExisting){			
			var self = this;			
			var metadata = self.getMetadata();
			var isReference = false;
			var isInline = false;
			var resourceName = null;
			arrayUtil.some(metadata.fields, function(field){
				var dataType = field.dataType;
				isReference = (dataType == 'reference');
				isInline = (dataType == 'inline');
				resourceName = field.referenceResource;
				return field.name == complexAttributeName;
			});

			if (!isReference && !isInline){
				throw new PlatformRuntimeException('invalidComplexAttribute', [complexAttributeName, metadata.getResourceName()]);
			}
			
			//If I have not sent to the server, need to load local in-memory cached copy
			//Otherwise for performance reasons, load the local copy if it's system or additional data AND it's not marked refresh on Login
			if (!ConnectivityChecker.isDeviceConnected() || !this.wasCommittedToServer() || ((metadata.isSystem || metadata.additionalData) && (!metadata.refreshOnLogin || useExisting))) {
				//Just load from cached in-memory
				var fieldMetadata = metadata.getField(complexAttributeName);

				return this._ensureModelServiceIsAvailable().
				then(function(){
					if(self[complexAttributeName]){
						if (lang.isArray(self[complexAttributeName])){
							return self.getLoadedModelDataSetOrNull(complexAttributeName);
						}						
						return self[complexAttributeName];
					}
					else{
						/* this is destructive and will set an empty set for the attribute */
						return ModelService.empty(fieldMetadata.referenceResource, null, self, complexAttributeName).then(function(dataSet) {																				
							return dataSet;
						});
					}
				});
			}			
			
			//Else, load from Model Data Set
			return this._ensureModelServiceIsAvailable().
			then(function(){
				if (isReference) {
					return ModelService.byRef(resourceName, self.get(complexAttributeName + '_ref'));
					
				} else {
					var deferred = new Deferred();
					var existingChildSet = self[complexAttributeName];
					//Check to see if the complex attribute already has an existing ModelDataSet  If so use 
					// that if useExisting is true.  Otherwise create a new one.
					if (useExisting && existingChildSet && existingChildSet.getMetadata){
						if (!self[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE]){
							self[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE] = {};
						}
						self[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE][complexAttributeName] = true;
						deferred.resolve(existingChildSet);
					}
					else{
					    //Actually refresh from the json store
						ModelService.childrenOf(self, complexAttributeName).then(function(childModelDataSet){
							self[complexAttributeName] = childModelDataSet;
							if (!self[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE]){
								self[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE] = {};
							}
							self[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE][complexAttributeName] = true;
							deferred.resolve(childModelDataSet);
							
						}).otherwise(function(error){
							deferred.reject(error);
						});
					}
					return deferred.promise;
				}
				
			});
		},
		
		//Need to defer ModelService dependency loading due to circular reference
		//ModelService => ModelDataSet => ModelData => ModelService
		_ensureModelServiceIsAvailable: function(){
			var deferred = new Deferred();
			if (ModelService){
				deferred.resolve();
				
			} else {
				require(["platform/model/ModelService"], function(_ModelService){
					ModelService = _ModelService;
					deferred.resolve();
				});
			}
			return deferred.promise;
		},
		getParent: function(){
			return this.getOwner().getParent();
		},
		_getChildResourceMetadata: function(complexAttributeName){
			var complexAttributeMetadata = null;
			var metadata = this.getMetadata();
			arrayUtil.some(metadata.fields, function(field){
				if (field.name == complexAttributeName){
					complexAttributeMetadata = field;
					return true;
				}
				return false;
			});
			return this._getResourceMetadataOrThrowError(complexAttributeMetadata['referenceResource']);
		},
		_getResourceMetadataOrThrowError: function(resourceName){
			if (!resourceName){
				throw new PlatformRuntimeException('invalidModelName', [resourceName]);
			}			
			var metadata = ResourceMetadataContext.getResourceMetadata(resourceName);
			if(!metadata){
				throw new PlatformRuntimeException('invalidResourceName', [resourceName]);
			}
			return metadata;
		},
		
		_deferPatchApply: function() {
			this._shouldDeferChanges = true;
		},
		
		_reapplyPatch: function() {
			this._shouldDeferChanges = false;
			this._applyPatch(this._patchToApply);
			this._shouldDeferChanges = true;
		},
				
		_applyPatch: function(record, includeAll){
			//Logger.trace("[ModelData - _applyPatch] record = " + JSON.stringify(record) + " includeAll = " + includeAll);
			var count = 0;
			record = record["json"] || record;
			if (this._shouldDeferChanges){
				//Logger.trace("[ModelData - _applyPatch] defer changes " );
				this.set('_patchToApply', record);
				return;
			}
			
			var metadata = this.getMetadata();
			var attributeNames = Object.keys(record);
			this._turnOffListenChanges();						
			this[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = record[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE];
			this[PlatformConstants.CLEANUP_TOKEN_ATTR] = record[PlatformConstants.CLEANUP_TOKEN_ATTR];
			this[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE] = record[PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE];
			arrayUtil.forEach(attributeNames, function(attributeName) {
				var field = metadata.getField(attributeName);
								
				var fieldValue = record[attributeName];
					
				if (field){
					//Logger.trace("[ModelData - _applyPatch] attributeName = " + attributeName + " found");
					if (field.isComplex && 
						field.multiplicity.indexOf('-or-many') > -1 && 
						this[attributeName] && 
						this[attributeName]._applyPatch){ //a ModelDataSet is loaded						
						//Logger.trace("[ModelData - _applyPatch] attributeName = " + attributeName + " is complex attribute");
							this[attributeName]._applyPatch(fieldValue, includeAll);
					} else {
						
						if (this[attributeName] !== fieldValue && field.persistent){
							if(PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE != attributeName && 
									PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE != attributeName){
								count++;
							}
							
							// If this is a local attribute, and if it is already modified, ignore
							// patch changes, as the path can contain a value read from localStorage
							if (!this.__changedLocalAttributes[attributeName] || !field.local)
							{
					//			Logger.trace("[ModelData - _applyPatch] attributeName = " + attributeName + " apply path");
								this.set(attributeName, fieldValue);
							}
						}
					}
				}				
				else if(includeAll){					
					if (this[attributeName] !== fieldValue){
						if(PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE != attributeName && 
								PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE != attributeName){
							count++;
						}
						if(this._isInternalField(attributeName)){
							this[attributeName] = fieldValue;
						}
						else{
							this.set(attributeName, fieldValue);
						}
					}					
				}				
			}, this);
			
			// call the API to let the business object apply some logic
			// for ex: update the description of the asset part of a workorder.
			this._afterPatchRecord();
			
			this._turnOnListenChanges();
			return count > 0;
		},
		_afterPatchRecord: function(){
			var classInstance = this.getOwner()._resourceClassInstance();
			if (classInstance)
			{
				ModelDataAdvisor.advise(this.getOwner(), classInstance || {});										
				if(classInstance && classInstance["afterPatch"]){
					classInstance.afterPatch(this);
				}			
			}
		},

		getPendingOrOriginalValue: function(attributeName){
			var pendingValue = this._pendingValues[attributeName]; 
			if(typeof pendingValue != 'undefined'){
				return pendingValue;
			}
			return this.get(attributeName);
		},
		setPendingValue: function(attributeName, value){
			var metadata = this.getMetadata();						
			if (attributeName) {
				var fieldInfo = metadata.getField(attributeName);
				
				//TODO: Need to also protect float and decimal types
				if (!fieldInfo || (fieldInfo && fieldInfo.dataType!="integer")) {
					if(value == null){
						value = '';
					}
				}
				if (fieldInfo) {
					if(metadata.isDataTypeCompatibleWithValue(fieldInfo.dataType, value)){
						this._pendingValues[attributeName] = value;
					}else{
						throw new PlatformRuntimeException("incompatiblevalueandtype", [newValue, fieldInfo.dataType]);
					}
				}
				else{
					Logger.error("Attribute {0} is not part of resource {1}", 0, [fieldName, metadata.getResourceName()]);				
				}
			}			
		},
		clearPendingValue: function(attributeName){
			delete this._pendingValues[attributeName];
		},
		clearAllPendingValues: function(){
			this._pendingValues = {};
		},
		belongsToQueryBase: function(queryBaseName){
			if(this[QUERYBASES_LIST_ATTR]){
				return this[QUERYBASES_LIST_ATTR].indexOf("<" + queryBaseName + ">") >= 0;			
			}
			return false;
		},
		supportsUndoChanges: function(){
			return !this.getMetadata().isLocal() && this.wasCommittedToServer();
		},
		wasCommittedToServer: function() {
			var metadata = this.getMetadata();
			if (metadata.isLocal()){
				return false;
			}
			return (this.identifier != null) || (this[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE] || "").indexOf("http") == 0;			
		},

		getKeyDataAsString: function(){
			var keyFields = this.getMetadata().getKeyFields();
			if(!keyFields || keyFields.length == 0){
				return this.getId() + "";
			}
			else{
				var keyString = '';
				var self = this;
				var keys = Object.keys(keyFields).sort();
				arrayUtil.forEach(keys, function(keyIndex){
					var keyField = keyFields[keyIndex];
					var value = self.get(keyField.name);
					if(value){
						//replace any spaces with underscores
						if (typeof value === 'string') {
							//quotes are in case value has them
							value = value.replace(/ /g, "_").replace(/'/g, "&apos;").replace(/"/g, "&quot;");
						}
						keyString = keyString.length>0? keyString + '_' + value : value;
					}
				});
				return keyString;
			}			
		},
		
		_stagingCleanUp: function(){
			var mySet = this.getOwner();
			if (mySet.getParent() || this.isMarkedToDelete()){
				return;
			}
			mySet._cleanupRecord(this);
		}
	});
	// needed due to cyclic dependency
	result._setModelDataSetClass = function(clazz){
		ModelDataSet = clazz;
	};
	return result;
});
