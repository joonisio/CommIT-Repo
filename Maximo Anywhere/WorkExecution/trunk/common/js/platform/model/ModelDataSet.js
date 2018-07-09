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

define("platform/model/ModelDataSet",
["dojo/_base/declare",
 "platform/store/PersistenceManager",
 "dojo/_base/lang",
 "dojo/_base/array",
 "dojo/Deferred",
 "platform/model/ModelData",
 "dojo/promise/all",
 "dojox/json/query",
 "dojo/Stateful",
 "dojo/store/Memory",
 "dojo/aspect",
 "platform/exception/PlatformRuntimeException",
 "platform/model/helper/ModelDataAdvisor",
 "platform/logging/Logger",
 "platform/util/PlatformConstants",
 "dojo/date/stamp",
 "platform/comm/CommunicationManager",
 "platform/model/PushingCoordinatorService",
 "dojo/Deferred",
 "platform/store/_FormulaEvaluator",
 "platform/model/ModelService"],
 function(declare, PersistenceManager, lang, array, Deferred, ModelData, all, jsonQuery, Stateful, Memory, aspect, PlatformRuntimeException, 
		 ModelDataAdvisor, Logger, PlatformConstants, dateISOFormatter, CommunicationManager, PushingCoordinatorService, Deferred, FormulaEvaluator,ModelService) {
	var CONTROL_ATTRIBUTES = ["__tempId", 
	                          PlatformConstants.LAST_UPDATED_DT_ATTRIBUTE, 
	                          PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE, 
	                          PlatformConstants.READONLY, 
	                          PlatformConstants.ERRORED_ATTRIBUTE,
	                          PlatformConstants.ERRORED_ATTRIBUTE_MSG]; 
	
	function prepareForPagination(dataSet, nextPageURL, nextRemotePageNum, nextLocalPageInfo, requestedComplexAttributeNames){
		//Get it as a closure to prevent clients from changing it
		dataSet._getNextPageInfo = (function(){
			return function(){
				return {
					nextPageURL: nextPageURL,
					nextRemotePageNum: nextRemotePageNum, 
					nextLocalPageInfo: nextLocalPageInfo,
					queryBase: dataSet._queryBaseName,
					requestedComplexAttributeNames: requestedComplexAttributeNames,
					hasNextRemotePage: function(){
						return lang.isString(this.nextPageURL) && this.nextPageURL.length > 0;
					},
					hasNextLocalPage: function(){
						return this.hasNextRemotePage() ||
						(this.nextLocalPageInfo && this.nextLocalPageInfo['offset'] != -1);
					}
				};
			};
		})();
	}
	
	function keepDBFilter(dataSet, filter){
		//Get it as a closure to prevent clients from changing it
		dataSet.getPersistentFilter = (function(){
			return function(){
				return filter;
			};
		})();
	}
	
	var instanceid = 0;
	
	var modelSet = declare([Stateful, Memory], {
		idProperty: '_id',
		_metaData: null,
		_originalData: null,
		_changedRecords: null,
		_recordsToCreate: null,		
		_recordsToDelete: null,
		_queryBaseName: null,
		_lastTempId: null,
		_filtered: false,
		_sorted: false,
		_currentIndex: -1,		
		_relationNameWithParent: null,
		//Just to leverage the Stateful watchers handling mechanism
		_nextPageEventInfo: null,
		
		// FIXME Uncomment the following lines in phase2
		// Dojo calls Memory class constructor before this constructor,
		// passing the same arguments.
		// This makes Memory constructor to do a mixin of the metadata object
		// with this class, which is wrong.
		// The following lines allow the control of calling super classes' constructor
		/*
		"-chains-": {
			constructor: "manual"
		},
		*/
		constructor: function(metadata, queryBaseName, data, parentModelData, relationNameWithParent){
			// FIXME Uncomment the following lines in phase2
			//this.inherited(arguments, []);
			//This is to help in debugging to enable comparison of ModelDataSet instances
			//Built as a clousure so we don't need to care about skipping it in JSON serialization
			this._getInstanceId = (function (currentId){
				var myInstanceId = currentId;
				return function() {
					return myInstanceId;
				};
			})(++instanceid);
			
			this._saveStage = 0;
			this._resetStateCollections();
			this._nextPageEventInfo = new Stateful({});
			this.setMetaData(metadata);
			this._queryBaseName = queryBaseName;
			
			//avoid circular reference that breaks JSON.stringify()
			this.getParent = (function(){
				var _parentModelData = parentModelData;
				return function(){
					return _parentModelData;
				};
			})();				
			
			this._relationNameWithParent = relationNameWithParent;
			this.data = new Array();
			this._originalData = this.data;
			this._lastSavedTime = new Date();
			this._appendData(data);
			
			this.fetchedFromServer = !!(data || {}).fetchedFromServer;
			
			var count = this.count();
			if(metadata.isSingleton() && count == 0){
				this.createNewRecord();
				this.setCurrentIndex(0);
			}else{
				this.setCurrentIndex((count == 0)  ? -1 : 0);
			}
		},
		/**@memberOf platform.model.ModelDataSet */
		_resetStateCollections: function() {
			this._recordsToCreate = [];
			this._recordsToDelete = {};
			this._changedRecords = {};
		},
		_incrementSaveStage: function(){
			this._saveStage++;
		},
		_resetSaveStage: function(){
			this._saveStage = 0;			
		},
		_getSaveStage: function(){
			return this._saveStage;
		},		
		_setPersistentFilter: function(filter) {
			keepDBFilter(this, filter);
		},	
		getPersistentFilter: function() {
			//This method is overriden by keepDBFilter() function
			return null;
		},
		_appendData: function(data){
			var nextPageURL = ((data && data['nextPageURL']) || null);
			var nextRemotePageNum = ((data && data[PlatformConstants.NEXT_PAGE_NUM]) || null);
			var nextLocalPageInfo = ((data && data['_nextLocalPageInfo']) || null);
			var requestedComplexAttributeNames = ((data && data[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES]) || null);
			prepareForPagination(this, nextPageURL, nextRemotePageNum, nextLocalPageInfo, requestedComplexAttributeNames);
			
			var numberOfRecordsLoaded = ((data && data['length']) || 0);
			if (numberOfRecordsLoaded == 0){
				return;
			}
			
			var nextPageEventInfo = {
				'indexOfFirstRecordLoaded': this.lastIndex() + 1,
				'numberOfRecordsLoaded': numberOfRecordsLoaded
			};
			
			var self = this;
			if (data != PlatformConstants.EMPTY_COMPLEX_FIELD){
				var dataAsArrayOfStateful = array.map(data, function(item){
					var record = new ModelData(item);
					self._bindDataSetAsRecordOwner(record);
					self._initializeRecord(record, self._resourceClassInstance());				
					self._listenForRecordChanges(record);																			
					return record;
				});
				this._originalData = this._originalData.concat(dataAsArrayOfStateful);
				if (this._originalData != this.data){
					this.setData(this.data.concat(dataAsArrayOfStateful));
				}
			}
			
			//Notify onNextPageLoaded listeners a new page is available
			this.set('_nextPageEventInfo', nextPageEventInfo);
		},
		
		_bindDataSetAsRecordOwner: function (record){
			//Override item.getOwner to benefit from clousure
			//the ModelDataSet reference
			record.getOwner = lang.hitch(this, function(){
				return this;
			});
			record._initRuntimeMetadata();
		},	
		_unlistenForRecordChanges: function(record){
			if (record && record._changesWatchHandle){
				record._changesWatchHandle.remove();
				delete record._changesWatchHandle;
			}
		},
		_listenForRecordChanges: function(record){
			var self = this;
			record._changesWatchHandle = record.watch(function(fieldName, oldValue, newValue){
				var skip = array.some(CONTROL_ATTRIBUTES, function(value){
					return value == fieldName;
				});
				var fieldInfo = this.getMetadata()["getField"] ? this.getMetadata().getField(fieldName) : null;							
				if (fieldInfo && fieldInfo.persistent && !skip && oldValue !== newValue){
					/* temporary solution */
					record[PlatformConstants.ISCHANGED_ATTRIBUTE] = false;
					record[PlatformConstants.ISCHANGED_ATTRIBUTE] = true;
					record[PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE] = dateISOFormatter.toISOString(new Date());					
					if(!record._isNew){
						self._changedRecords[record._id] = record;
					}
					if (self.getParent()){
						//This will flag parent data set as changed
						self.getParent().set(PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE, dateISOFormatter.toISOString(new Date()));
						/* temporary solution */
						self.getParent().set(PlatformConstants.ISCHANGED_ATTRIBUTE, false);
						self.getParent().set(PlatformConstants.ISCHANGED_ATTRIBUTE, true);
					}
				}											
			});
		},
		_childModified: function(record) {
			this._changedRecords[record._id] = record;
		},
		_childRemoved: function(record, deleteFromDataSetOnly, pushToServer){
			if (pushToServer){
				this.getParent().markAsModified(this._relationNameWithParent);
			}
			this._unlistenForRecordChanges(record);
			if(record.isNew()){
				this._recordsToCreate = (this._recordsToCreate || []).filter(function(existingRecord){
					return existingRecord._id != record._id;
				});

			}
			else {
				if (!deleteFromDataSetOnly){
					this._recordsToDelete[record._id] = record;
				}
				delete this._changedRecords[record._id];
			}
			this._removeRecordFromAllLists(record);
			if (!pushToServer && this.getParent() && this._relationNameWithParent && !this.isDirty()){
				this.getParent()._clearChangesForAttribute(this._relationNameWithParent);
			}
			this._lastSavedTime = new Date();
		},		
		_removeRecordFromAllLists: function(record) {
			if (this._originalData === this.data){					
				this.data = this._originalData = array.filter(this._originalData, function(item){
					return item._id != record._id;
				});
			} else {
				this._originalData = array.filter(this._originalData, function(item){
					return item._id != record._id;
				});
				this.data = array.filter(this.data, function(item){
					return item._id != record._id;
				});
			}
			delete this.index[record._id];
			
			// perform reindex after delete
			var i=0 ;
			for (var currentIndex in this.index){
				this.index[currentIndex] = i;
				i++;
			};
    	
			
		},
		
		deleteLocalAll: function(deleteFromDataSetOnly) {
			while(this.count() > 0){
				this.getRecordAt(0).deleteLocal(deleteFromDataSetOnly);
			}
		},
		
		preamble: function(){
			//Hooked up Memory's setData method through AOP as
			//this.inherited() was failing.
			//Need this as original setData sets this.data = value
			//which doesn't notify stateful watchers
			aspect.after(this, 'setData', lang.hitch(this, function(){
				this.set('data', this.data); //Just to notify watchers
			}));
		},
		_initializeRecord: function(record, classInstance){
			ModelDataAdvisor.advise(record, classInstance || {});										
			if(classInstance && classInstance["onInitialize"]){
				classInstance.onInitialize(record);
			}			
		},
		_initializeNewRecord: function(record, classInstance){
			this._initializeRecord(record, classInstance);				
			if(classInstance && classInstance["onAdd"]){
				classInstance.onAdd(record);
			}			
		},				
		_resourceClassInstance: function(){
			return this._metaData["getClassInstance"] ? this._metaData.getClassInstance() : null; 
		},
		
		hasNextPageOfData: function(){			
			var nextPageInfo = this._getNextPageInfo();
			return nextPageInfo.hasNextRemotePage() ||
				   nextPageInfo.hasNextLocalPage();

		},
		getRelationNameWithParent: function(){
			return this._relationNameWithParent
		},		
		filter: function(queryAsString, listOfParameters){
			// NOTICE: needs to be duplicated to preserve 'arguments'
			//Description:
			//	Filters the data set with the query provided.
			//	This method changes the state of the data set.
			//
			//queryAsString:
			//	The query to be applied to all records in the data set.
			//	Can be any expression valid for a javascript "if" statement, considering 
			//	records attributes as variable names.
			//	This also can contain $1-$9 placeholders that refers to subsequent parameters
			//	passed to the function
			//
			//	Examples:
			//		dataSet.filter("woNum == '1002'")
			//		dataSet.filter("woNum == '1002' || status == 'COMP'")
			//		dataSet.filter("priority <= 1 || creationDate > $1", new Date())
			//		
			//listOfParameters:
			//	0-9 parameters to be replaced in the query for the corresponding $1-$9 placeholders
			//
			var jsonQueryString = "[?" + queryAsString + "]";
			var args = [jsonQueryString, this.data];
			if ( listOfParameters !== undefined){
				args = args.concat(Array.prototype.slice.call(arguments, 1)); //append all parameters
			}			
			this.setData(jsonQuery.apply(null, args));
			this._filtered = true;
			this.setCurrentIndex((this.count() == 0) ? -1 : 0);
			return this;
		},		
		find: function(queryAsString, listOfParameters){
			// NOTICE: needs to be duplicated to preserve 'arguments'
			//Description:
			//	finds the data set with the query provided.
			//	This method does not change the state of the data set.
			//
			//queryAsString:
			//	The query to be applied to all records in the data set.
			//	Can be any expression valid for a javascript "if" statement, considering 
			//	records attributes as variable names.
			//	This also can contain $1-$9 placeholders that refers to subsequent parameters
			//	passed to the function
			//
			//	Examples:
			//		dataSet.filter("woNum == '1002'")
			//		dataSet.filter("woNum == '1002' || status == 'COMP'")
			//		dataSet.filter("priority <= 1 || creationDate > $1", new Date())
			//		
			//listOfParameters:
			//	0-9 parameters to be replaced in the query for the corresponding $1-$9 placeholders
			//
			var jsonQueryString = "[?" + queryAsString + "]";
			var args = [jsonQueryString, this.data];
			if (listOfParameters){
				args = args.concat(Array.prototype.slice.call(arguments, 1)); //append all parameters
			}
			return jsonQuery.apply(null, args);
		},
		/**
		 * Search operation on server or local based on fetchFromServer return call 
		 * @param {string} resource Name.
		 * @param {string} queryBase.
		 * @param {string} filter 
		 */
		getListCount: function()  {
			var self = this;
			var deferred = new Deferred();
			
			if(self.recordsCount)
				deferred.resolve(self.recordsCount);
			else {
				CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
					if (!hasConnectivity)
					{	
						// Check if device data is equal to server data then , return false 
						//TOMR: we do not do the above for counts
						deferred.resolve(' ');
					}
					else 
					{				
						if(self.isFiltered() || self.getParent() != null || self._metaData.local || self._queryBaseName=='__created__'){
							deferred.resolve(self.count());
						} else {
							var metrics = self._metaData.getResourceMetrics(self._queryBaseName);
							var count  = null;
							if(metrics){
								count = metrics.getServerCount();
								if (count < self.count()){
									count = self.count();
								}
							} else {
								//lookup data comes here
								count = self.count();
							}
	 
							deferred.resolve(count);
						}
					}
				});
			}
			
			return deferred.promise;
		},
		sort : function(listOfFields) {
			this._sort.apply(this, arguments);
			if(this.count() > 0){
				this.setCurrentIndex(0);
			}
			else{
				this.setCurrentIndex(-1);
			}
			return this;
		},

		sortKeepIndex : function(listOfFields) {
			var currentRecord = this.getCurrentIndex() >= 0 ? this.getCurrentRecord() : null;
			
			this._sort.apply(this, arguments);
			if(currentRecord){
				this.setCurrentIndexByRecord(currentRecord);
			}else if(this.count() > 0){
				this.setCurrentIndex(0);
			}else{
				this.setCurrentIndex(-1);
			}
			return this;
		},
		
		_sort: function(/*listOfFields*/){
			var sortFunctions = [];
			
			/**
			 * Build a list of comparator functions for all sorted attributes
			 */
			array.forEach(arguments, function(item){
				item.replace(/^(\w*)(?: (asc|desc))?$/i, function(fullText, attributeName, direction){
					var sortFunction = (function(){
						var attrName = attributeName;
						var comparator = (direction === 'desc') ? function(a, b) { if (!a) {return false;} else if (!b) {return true;} else {return a < b;}} : function(a, b){if (!a) {return true;} else if (!b) {return false;} else {return a > b;}}; 
						return function(a, b) {
							var va = a[attrName], vb = b[attrName];
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
			var sortedData = this.data.concat().sort(function(a, b) {
				for (var x = 0; x < sortFunctions.length; x++){
					var result = sortFunctions[x](a, b);
					if (result != 0){
						return result;
					}
				}
				return 0;
			});
			
			this.setData(sortedData);
			this._sorted = true;
			return this;
		},
		
		isFiltered: function(){
			return this._filtered;
		},
		
		isSorted: function(){
			return this._sorted;
		},
		
		clearFilterAndSort: function(){
			var currentRecord = this.getCurrentIndex() >= 0 ? this.getCurrentRecord() : null;
			this._filtered = false;
			this._sorted = false;
			this.setData(this._originalData);
			if(currentRecord){
				this.setCurrentIndexByRecord(currentRecord);
			}else if(this.count() > 0){
				this.setCurrentIndex(0);
			}else{
				this.setCurrentIndex(-1);
			}

			return this;
		},
		
		getCurrentRecord: function(){
			return this.getRecordAt(this._currentIndex);
		},
			
		getCurrentIndex: function(){
			return this._currentIndex;
		},
		getRecordAt: function(index){
			if(index >= 0 && index < this.data.length){
				return this.data[index];
			}
			return null;
		},		
		lastIndex: function(){			
			return this.count() - 1;
		},
		setCurrentIndex: function(index) {
			if ((this.count() == 0 && index != -1) || 
				(this.count() > 0 && (index < 0 || index > this.lastIndex()))){
				throw new PlatformRuntimeException('indexOutOfRange', [index]);
			}
			this.set('_currentIndex', index);
		},
		

		setCurrentIndexByRecord : function(record){
			var newIndex = this.index[record.get(this.idProperty)];
         if (newIndex !== undefined){
            this.setCurrentIndex(newIndex);
         }
         return (newIndex !== undefined);
	    },  
	    
	    // TODO make me private
	    setMetaData: function(metaData) {
	    	this._metaData = metaData;
	    	this._metaData['keys'] = {};
	    	array.forEach(this._metaData.fields, function(field, index){
	    		this.keys[field.name] = index;
	    	}, this._metaData);	    	
	    },
	    
		createNewRecord: function(){
			var record = null;
			if(this._metaData.isSingleton() && this.count() > 0){
				record = this.getRecordAt(0);
				this._currentIndex = 0;
			}
			else {
				var parent = this.getParent();
				if(parent){					
					if(parent.isReadOnly()){
						throw new PlatformRuntimeException("cannotAddParentReadOnly", 
								[this.getMetadata().getResourceName(), 
						         parent.getMetadata().getResourceName()
						]);
					}
				}
				var newRecord = new ModelData();
				this._bindDataSetAsRecordOwner(newRecord);
				
				newRecord._initValues();				
				var tempRemoteId = this._getNextTempId();
				if (!this._metaData.local){
					newRecord[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE] = tempRemoteId;
					// FIXME temporary - to be removed when oslc returns rdf:about for children resource
					if(this._metaData.hasField(PlatformConstants.REF_ID_ATTR)){				
						newRecord[PlatformConstants.REF_ID_ATTR] = newRecord[PlatformConstants.TEMPID_ATTR_NAME];
					}
				}
				this._initializeNewRecord(newRecord, this._resourceClassInstance());
				this._listenForRecordChanges(newRecord);
				this._recordsToCreate.push(newRecord);
				this.add(newRecord);
				if (this.data !== this._originalData){
					this._originalData.push(newRecord);
				}
				this.setCurrentIndex(this.lastIndex());
				record = newRecord;
				if (parent){					
					//This will flag parent data set as changed
					parent.set(PlatformConstants.LAST_CHANGED_TS_ATTRIBUTE, dateISOFormatter.toISOString(new Date()));
					parent.set(PlatformConstants.ISCHANGED_ATTRIBUTE, true); 
					var complexAttributeInParent = this.getRelationNameWithParent();
					if(complexAttributeInParent){						
						parent.__attributeModified(complexAttributeInParent);
					}
					
				} else if (!this.getMetadata().isLocal()){
					//we only track parent created records
					newRecord[PlatformConstants.QUERYBASES_LIST_ATTR] = "<" + PlatformConstants.CREATED_QUERYBASE + ">";  
				}
			}
			return record;
		},	    
	    hasPrevious: function() {
	    	var newIndex = this._currentIndex-1;
	    	if(newIndex >=0 ) {
	    		return true;
	    	}
	    	return false;
	    },
	    
	    hasNext: function() {
	    	var newIndex = this._currentIndex+1;
	    	if(newIndex < this.data.length ) {
	    		return true;
	    	}
	    	return false;
	    },
	    
	    previous: function(){
	    	if(this.hasPrevious()) {
	    		this.setCurrentIndex(this._currentIndex-1);
		    	return this.getCurrentRecord();
	    	}
	    	return null;

	    },
	    
	    next: function(){
	    	if(this.hasNext()) {
	    		this.setCurrentIndex(this._currentIndex+1);
		    	return this.getCurrentRecord();
	    	}
	    	return null;
	    },
	
		_hasChangedRecords: function(){
			return this._changedRecords && Object.keys(this._changedRecords).length > 0;			
		},
		_hasRecordsToDelete: function(){
			return this._recordsToDelete && Object.keys(this._recordsToDelete).length > 0;			
		},
		_hasRecordsToCreate: function(){
			return (this._recordsToCreate && this._recordsToCreate.length > 0) || false;
		},
		isDirty: function(){
			return this._hasChangedRecords() || this._hasRecordsToDelete() || this._hasRecordsToCreate() || false;
		},
		
		_getNextTempId: function(){
			if (this._lastTempId === null){
				this._lastTempId = new Date().getTime();
			}
			var prefix = (this._queryBaseName) ? this._queryBaseName + '_' : ''; 
			return prefix + (this._lastTempId++);
		},
		
		onChange: function(callback){
			var handles = new Array();
			handles.push(this.watch('data', callback));
			handles.push(this.watch('_currentIndex', function(attr, oldValue, newValue){
				if (oldValue !== newValue){
					callback(attr, oldValue, newValue);
				}
			}));
			return {
				unsubscribe: function(){
					array.forEach(handles, function(handle){
						handle.remove();
					});
				}
			};
		},
		
		onNextPageLoaded: function(callback){
			var handle = this.watch('_nextPageEventInfo', function(attr, oldValue, newValue){
				if (oldValue !== newValue){
					callback(newValue);
				}
			});
			return {
				unsubscribe: function(){
					handle.remove();
				}
			};
		},		
		
		getResourceName: function(){
			return this._metaData.name;
		},
		
		getQueryBase: function(){
			return this._queryBaseName;
		},	
		
		getMetadata: function(){
			return this._metaData;
		},
		count: function(){
			return this.data ? this.data.length : 0;
		},
		
		hasCachedRecords: function() {
			var COMPLEX_ATTRS_FETCHED_ATTRIBUTE = PlatformConstants.COMPLEX_ATTRS_FETCHED_ATTRIBUTE;
			var parent = this.getParent();
			var complexAttrName = this._relationNameWithParent;
			return this.count() > 0 ||
				(parent && 
				parent[COMPLEX_ATTRS_FETCHED_ATTRIBUTE][complexAttrName]);
		},
		
		asJSONArray: function() {
			//Check to see if this is a child resource and if it's filtered.  Need to use original data
			//so child records aren't lost when saved
			var data = (this.getParent() && this.isFiltered() ? this._originalData : this.data);
		    return array.map(data, function(record){
		    	return record.asJSON();
		    });
		},
		
		modifiedAttributesAsJSONArray: function() {
			var result = [];
		    array.forEach(this.data, function(record){
		    	var modified = record.modifiedAttributesAsJSON();
		    	if(modified){
		    		result.push(modified);
		    	}
		    });
			if (this._hasRecordsToDelete() && 
			    array.some(Object.keys(this._recordsToDelete), function(recordId){
				    return this._recordsToDelete[recordId].__deleteOnServer;
			    }, this)){
				result = [];
				array.forEach(this.data, function(record){
					var recordToDelete = this._recordsToDelete[record._id + ''];					
					if (!recordToDelete || !recordToDelete.__deleteOnServer){
						var modified = record.modifiedAttributesAsJSON();
						if(modified){
							result.push(modified);
						} else {
							//If record is not modified we need to send the full record
							result.push(record.asJSON().json);
						}
					}
				}, this);
				result._hasRecordsToDelete = true;
			}
		    return result;
		},
		
		getPageCountInMemory: function(){
			return Math.ceil(this.count()/this.getMetadata().getPageSize());
		},
		
		_asyncRemoveDeleted: function(){
			// NOTE: it is only working for local data so we never return true
			// to not trigger a sync with backend.
			var removeDeferred = new Deferred();
			if (this._hasRecordsToDelete()){
				var recordsToDelete = new Array();
				for(recordId in this._recordsToDelete){
					var record = this._recordsToDelete[recordId];
					recordsToDelete.push(record.asJSON());
				}
				PersistenceManager.remove(this._metaData, recordsToDelete).then(function(){
					removeDeferred.resolve(false);					
				}).otherwise(function(err){
					removeDeferred.reject(err);
				});
			} else {
				removeDeferred.resolve(false);
			}			
			return removeDeferred.promise;
		},
		_triggersPush: function(){
			return !this.getMetadata().isLocal();
		},
		_asyncUpdateModified: function(){
			var updateDeferred = new Deferred();
			if (this._hasChangedRecords()){
				var recordsToUpdate = new Array();
				for(recordId in this._changedRecords){
					var record = this._changedRecords[recordId];
					// MM improve memory utilization remove json.stringify object  
					//Logger.log("[MODELDATA] updating record: " + JSON.stringify(record));
					
					recordsToUpdate.push(record);					
				}
				var recordsAsJSON = array.map(recordsToUpdate, function(record){
					var result = record.asJSON();
					// MM improve memory utilization remove json.stringify object  
					//Logger.log("[MODELDATA] Json to update: " + JSON.stringify(result));
					
					FormulaEvaluator.evaluateFormula(this.getMetadata(), result.json);
					return result;
				}, this);
				var needsPush = this._triggersPush();
				// MM improve memory utilization remove json.stringify object  
				//Logger.log("[MODELDATA] recordsAsJSON: " + JSON.stringify(recordsAsJSON));
				
				var self = this;
				PersistenceManager.replace(this._metaData, recordsAsJSON).then(function(){
					if(needsPush){
						//// MM improve memory utilization remove json.stringify object  
						//Logger.log("[MODELDATA] recordsToUpdate: " + JSON.stringify(recordsToUpdate));
						
						PushingCoordinatorService.stageTransactionsOfRecords(recordsToUpdate)
						.then(function(){
							updateDeferred.resolve(true);
						}).otherwise(function(err){
							updateDeferred.reject(err);
						});
					}else{
		            	array.forEach(recordsToUpdate, function(updatedRecord){
		            		self._cleanupRecord(updatedRecord);
		            	});
						updateDeferred.resolve(false);
					}
				}).otherwise(function(err){
		            if (err && err.doc && err.doc.length > 0) {
		            	var recoverDeferred = new Deferred();
						var afterRecover = {};
		            	var ids = array.map(err.doc, function(recordData){
		            		return recordData._id;
		            	});
		                //Lets see if the record has been removed by list update
		                PersistenceManager.findById(self._metaData, ids).then(function (recs) {
		                    if(recs && recs.length > 0){
		                    	//Records exist so cleanup records (so error doesn't continue to repeat) and set to notify user.
		                    	array.forEach(function(foundRec){
		                    		var id = foundRec._id;
			                    	var missingRec = self.get(id);
				            		missingRec._restoreDataFromOriginal();
		                        	ids.splice(ids.indexOf(id),1);
		                    	});
								afterRecover['recoverFailed'] = true;
			            		// MM improve memory utilization remove json.stringify object  
			            		//Logger.error('[_asyncUpdateModified] error trying to replace record in JSONStore.  Record does exist. Error: ' + JSON.stringify(err));
			            		if (ids.length == 0){
			            			//All records found so error out.
			            			recoverDeferred.resolve(afterRecover);
			            			return;
			            		}
		                    }
		                    //For remaining ids, they were not found in JSONStore so get JSON data for the records to add back in
	            			var recordsToAdd = [];
                        	var recsToFind = [];
	        				array.forEach(ids, function(id){
	        					var record = self.get(id);
	        					if(record){
	        						record[PlatformConstants.TEMPID_ATTR_NAME] = id;
	        						var result = record.asJSON();
		        					recordsToAdd.push(result.json?result.json:result);
		            				var query = {};
		            				query[PlatformConstants.TEMPID_ATTR_NAME] =  id;
		            				recsToFind.push(query);
	        					}
	        				});

	            			Logger.trace("[_asyncUpdateModified] Replacing record(s) in JSONStore failed because record(s) no longer exists. Attempting to add record(s) back.");
	                        PersistenceManager.add(self._metaData, recordsToAdd).otherwise(function(error){
	                            Logger.error("[_asyncUpdateModified] Failed to add record back to JSONStore.");
	                        }).always(function(){
		                        //Need to query record back to get new JSONStore _id 
	            				PersistenceManager.findExact(recsToFind, self._metaData, null).then(function(foundData){
	            					if(foundData && foundData.length > 0){
			                        	array.forEach(foundData, function(foundRecord){
			                        		//Update the _id for each record to it's new JSONStore id
			                        		var oldID = foundRecord.json[PlatformConstants.TEMPID_ATTR_NAME];
					                    	var addedRec = self.get(oldID);
					                    	if (addedRec){
												self.remove(oldID); //Need to remove record from set because it's indexed within the set by old id
					                    		addedRec._id = foundRecord._id;
					                    		delete addedRec[PlatformConstants.TEMPID_ATTR_NAME];
					                    		//Need to update original state with new id to support undo
					                    		var originalState = JSON.parse(addedRec[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE]);
					                    		originalState['_id'] = foundRecord._id;
					                    		if(originalState[PlatformConstants.TEMPID_ATTR_NAME]){
					                    			originalState[PlatformConstants.TEMPID_ATTR_NAME] = foundRecord._id;
					                    		}
					                    		addedRec[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] = JSON.stringify(originalState);
						                    	var index = ids.indexOf(oldID);
						                    	if (index > -1){
						                        	ids.splice(index,1);
						                    	}
						                    	self.put(addedRec);
					                        	afterRecover['retry'] = true;
					                    	}
			                        	});
		                                Logger.trace("[_asyncUpdateModified] Removed record added back sucessfully, will attempt retry pushing changes.");
	            					}
	            				}).always(function(){
	            					if(ids.length > 0){
		                                Logger.error("[_asyncUpdateModified] Unable find one or more record added back into JSONStore to retrieve ids.");
			                        	//For some reason some of the records were not found after adding them so clear them so they won't keep erroring and set to notify user
	            						array.forEach(ids, function(id){
	            							var record = self.get(id);
	            							self._unlistenForRecordChanges(record);
	            							delete self._changedRecords[record._id];
	            							self._removeRecordFromAllLists(record);
	            							afterRecover['addFailed'] = true;
			                        	});
	            					}
	            					recoverDeferred.resolve(afterRecover);
	            				});
	                        });
		                }).otherwise(function(error){
		                	//This should never occur but in case cleanup record and reject 
		            		//Memory Optimization. Use stringifies carefully
		            		//Logger.error('[_asyncUpdateModified] error trying to replace record in JSONStore.  Error: ' + JSON.stringify(err));
	        				array.forEach(ids, function(id){
	        					var record = self.get(id);
	        					if(record){
	        						record._restoreDataFromOriginal();
	    							delete self._changedRecords[record._id];
	        					}
	        				});
                        	afterRecover['recoverFailed'] = true;
	            			recoverDeferred.resolve(afterRecover);
		                });
		            	var okToResolve = function(recoveryStatus){
			            	if (recoveryStatus.addFailed){
								var exception = new PlatformRuntimeException("saveFailedRecordRemoved");
							    updateDeferred.reject({error: exception });
							    return false;
			            	}
			            	if (recoveryStatus.recoverFailed){
								var exception = new PlatformRuntimeException("saveFailed");
							    updateDeferred.reject({error: exception });
							    return false;
			            	}
		            		return true;
		            	};
		                recoverDeferred.promise.then(function(recoveryStatus){
		                	if(recoveryStatus.retry){
			            		//Need to call _asyncUpdateModified again so new id's are saved in originalstate and transactions pushed
			            		self._asyncUpdateModified().then(function () {
			            			if(okToResolve(recoveryStatus)){
									    updateDeferred.resolve(true);
			            			}
								}).otherwise(function (e) {
			            			if(okToResolve(recoveryStatus)){
									    updateDeferred.reject(e);
			            			}
								});
		                	}else{
		            			if(okToResolve(recoveryStatus)){
								    updateDeferred.resolve(false);
		            			}
		                	}
		                });
		            } else {
		            	//Memory Optimization. Use stringifies carefully
	            		//Logger.error('[_asyncUpdateModified] error trying to replace record in JSONStore.  Error: ' + JSON.stringify(err));
						var exception = new PlatformRuntimeException("saveFailed");
					    updateDeferred.reject({error: exception });
		            }
		        });
			} else {
				updateDeferred.resolve(false);
			}			
			return updateDeferred.promise;
		},
		
		_asyncInsertNew: function(isConnected){
			var self = this;			
			var storeDeferred = new Deferred();
			if (this._recordsToCreate && this._recordsToCreate.length > 0){
				var recordsToCreateCopy = new Array();
				var recordsToInsert = array.map(this._recordsToCreate, function(record){					
					var result = record.asJSON();
					recordsToCreateCopy.push(record);
					FormulaEvaluator.evaluateFormula(this.getMetadata(), result);
					return result;
				}, this);	
				var needsPush = this._triggersPush();
				PersistenceManager.add(this._metaData, recordsToInsert, this._queryBaseName).then(function(){
					if(isConnected === true){
				    	self._lastSavedTime = new Date();
				    }
					var deferred = new Deferred();
					//Need a shallow copy of recordsToCreate as __asyncFetchIds is destructive
					var newRecords = array.map(self._recordsToCreate, "return item");
					self.__asyncFetchIdsOnly(newRecords, 50, deferred);
					deferred.promise.then(function() {
						if(needsPush){
							PushingCoordinatorService.stageTransactionsOfRecords(recordsToCreateCopy).then(function(){
								storeDeferred.resolve(true);
							}).otherwise(function(error){
								storeDeferred.reject(error);
							});
						}else{
							while(self._recordsToCreate.length > 0){
			            		self._cleanupRecord(self._recordsToCreate[0]);
			            	};
							storeDeferred.resolve(false);
						}
					}).
					otherwise(function(err) {
						storeDeferred.reject(err);
					});
				}).otherwise(function(err){
					storeDeferred.reject(err);
				});
			} else {
				storeDeferred.resolve(false);
			}			
			return storeDeferred.promise;
		},
		_atLeastOneTrue: function(array){
			if(array){
				for(idx in array){
					if(array[idx] === true){
						return true;
					}
				}
			}
			return false; 
		},
		_asyncSave: function(){
			var saveDeferred = new Deferred();
			var self = this;
			CommunicationManager.checkConnectivityAvailable().always(function(result){
				var isConnected = true === result;
				all([self._asyncRemoveDeleted(), 
				     self._asyncUpdateModified(), 
				     self._asyncInsertNew(isConnected)
				]).
				then(function(flags){				    
					self._asyncAfterSave(saveDeferred, self._atLeastOneTrue(flags));							
				}).otherwise(function(error){
					saveDeferred.reject(error);
				});
			});			
			return saveDeferred.promise;
		},
		_asyncBeforeSave: function(){
			var deferred = new Deferred();
			var classInstance = this._resourceClassInstance();
			var self = this;
			
			/* uses a mock function to avoid problems when parent has no validation
			 * class but child has. With a mock function, the tree navigation becomes
			 * very simple 
			 * */
			var beforeSaveMethod = function(){};
			
			if(classInstance && classInstance["beforeSave"]){			
				beforeSaveMethod = lang.hitch(classInstance, "beforeSave");
			}
			
			all(
			     this._asyncBeforeSaveOnDeleted(beforeSaveMethod)
			     	.concat(this._asyncBeforeSaveOnCreated(beforeSaveMethod))
			     	.concat(this._asyncBeforeSaveOnModified(beforeSaveMethod))
			).then(function(){
				deferred.resolve(self);
			}).otherwise(function(error){
				deferred.reject(error);
			});
			
			return deferred.promise;
		},
		__asPromise: function(aValue){
			if(aValue && (aValue.toString() == '[object Promise]')){
				return aValue;				
			}
			var resolvedPromise = new Deferred();
			resolvedPromise.resolve(aValue);			
			return resolvedPromise.promise;
		},
		_asyncBeforeSaveOnCreated: function(validateMethod){			
			return this._asyncValidate(this._recordsToCreate, this._recordsToCreate ? this._recordsToCreate.length : 0, validateMethod);			
		},
		_asyncBeforeSaveOnModified: function(validateMethod){
			var recordsChangedCount = (this["_changedRecords"] && lang.isObject(this._changedRecords) && Object.keys(this._changedRecords).length) || 0;
			return this._asyncValidate(this._changedRecords, recordsChangedCount, validateMethod);
		},
		_asyncBeforeSaveOnDeleted: function(validateMethod){
			var recordsToDeleteCount = (this["_recordsToDelete"] && lang.isObject(this._recordsToDelete) && Object.keys(this._recordsToDelete).length) || 0;
			return this._asyncValidate(this._recordsToDelete, recordsToDeleteCount, validateMethod);
		},
		_asyncValidate: function(records, length, validateMethod){
			var self = this;
			var overallPromise = new Deferred();
			if(records && length > 0){
				var result = [];
				for(recordId in records){
					var record = records[recordId];
					// MM improve memory utilization remove json.stringify object  
					//Logger.log("[MODELDATA] asyncValidate record: " + JSON.stringify(record));
					var childrenResult = self._asyncValidateChildren(record);
					var myPromise = new Deferred();
					all(childrenResult).then(function(){
						try{								
							myPromise.resolve(self.__asPromise(validateMethod(record)));
						}catch(e){								
							myPromise.reject({'record': record, error: e});
						}
					}).otherwise(function(error){
						myPromise.reject({'record': error['record'], error: error['error']});
					});
					result.push(myPromise.promise);					
				}
				all(result).then(function(){
					overallPromise.resolve(result);
				}).otherwise(function(error){
					overallPromise.reject({'record': error['record'], error: error['error']});
				});
			}else{
				overallPromise.resolve([]);
			}
			return [overallPromise.promise];
		},
		_asyncValidateChildren: function(parentRecord){			
			var attributes = parentRecord.__getModifiedAttributesList();
			var result = [];
			attributes.forEach(function(attribute){
				if(parentRecord.getMetadata().isFieldComplex(attribute)){
					var attributeSet = parentRecord.getLoadedModelDataSetOrNull(attribute);
					if(attributeSet && attributeSet["_asyncBeforeSave"]){
						// MM improve memory utilization remove json.stringify object  
						//Logger.log("[MODELDATA] asyncValidateChildren: " + attribute);
						result.push(attributeSet._asyncBeforeSave());
					}
				}
			});
			return result;
		},
		_cleanupChildrenState: function(parentRecord) {
			var attributes = parentRecord.__getModifiedAttributesList();
			attributes.forEach(function(attribute){
				if(parentRecord.getMetadata().isFieldComplex(attribute)){
					var attributeSet = parentRecord.getLoadedModelDataSetOrNull(attribute);
					if(attributeSet && attributeSet["_asyncCleanUpRemoved"]){
						attributeSet._asyncCleanUpRemoved();
						attributeSet._asyncCleanUpModified();
						attributeSet._asyncCleanUpCreated();
						attributeSet._resetStateCollections();
					}
				}
			});			
		},
		_asyncAfterSave: function(saveDeferred, shouldFlush){
			var self = this;
			var currentRecord = this.getCurrentRecord();		    	 
			this._asyncCleanUpRemoved().always(function(){			    	 
			    	 if(self.count() > 0){
			    		 if(currentRecord && self.get(currentRecord.getId())){
				    		 self.setCurrentIndexByRecord(currentRecord);
				    	 }else{
				    		 self.setCurrentIndex(0);
				    	 }	 
			    	 }else{
			    		 self.setCurrentIndex(-1);
			    	 }
			    	 if (shouldFlush){
			    		 // If the flush is not coordinated, then a race condition arises
			    		 // that causes the cleanup token to get incremented by the JSONStoreSyncProcessor logic
			    		 // and updates the store with latest cleanup token, but around the same time, 
			    		 // the flush logic tries to update the store with an error update with an older
			    		 // cleanup token...and thus causes the record to be removed on a subsequent cleanup.
			    		 PushingCoordinatorService.flush().always(function() {
			    			 saveDeferred.resolve(self);
			    		 });
			    	 }
			    	 else
			    	 {
			    		 saveDeferred.resolve(self);
			    	 }
			     }
			);					
		},
		_asyncCleanUpRemoved: function(){
			var deferred = new Deferred();
			if (this._hasRecordsToDelete()){				
				for(recordId in this._recordsToDelete){
					var id = this._recordsToDelete[recordId].getId();
					this.remove(id);					
					delete this._recordsToDelete[recordId];
				}				
			}
			deferred.resolve();
			return deferred.promise;
		},
		
		_cleanupRecord: function(record){
			this._cleanupChildrenState(record);
			record._isChanged = false;
			record._isNew = false;
			record.clearAllPendingValues();
			record.__clearModifiedAttributeList();
			var newRec = this._recordsToCreate.indexOf(record);
			if (newRec >= 0){
				
				this._recordsToCreate.splice(newRec,1);
			}
			else{
				delete this._changedRecords[record.getId()];
			}
		},
		
		_asyncCleanUpModified: function(){
			var deferred = new Deferred();
			if (this._hasChangedRecords()){				
				for(recordId in this._changedRecords){
					var id = this._changedRecords[recordId].getId();
					var record = this.get(id);
					if(record){
						this._cleanupChildrenState(record);
						record._isChanged = false;
						record.clearAllPendingValues();
						record.__clearModifiedAttributeList();
					}
					delete this._changedRecords[recordId];
				}				
			}
			deferred.resolve();
			return deferred.promise;
		},
		_asyncCleanUpCreated: function(){
			var deferred = new Deferred();			
			if(this._recordsToCreate && this._recordsToCreate.length > 0){
				var self = this;
				array.forEach(this._recordsToCreate, function(record) {
					self._cleanupChildrenState(record);
					if (self.getParent()){
						record._fromNewToExisting(); //Don't need to call on top most because __asyncFetchIds does.
					}
				}, this);
				if (this.getParent()){
					deferred.resolve();
				}else{
					this.__asyncFetchIds(this._recordsToCreate, 50, deferred);
				}
			}
			else{
				deferred.resolve();
			}
			return deferred.promise;
		},
		
		_cleanUpNewAndChangedFlags: function(){
			this.foreach(function(modelData){
				modelData._fromNewToExisting();
			});
		},
		
		foreach: function(f){
			for(var i = 0; i < this.count(); i++){
				f(this.getRecordAt(i));
			}
		},
		__asyncFetchIdsOnly: function(recordsToCreate, chunkSize, deferredToResolve){
			this.__asyncFetchIds(recordsToCreate, chunkSize, deferredToResolve, true);
		},
		__asyncFetchIds: function(recordsToCreate, chunkSize, deferredToResolve, onlyRefreshIds){
			if(recordsToCreate.length == 0){
				deferredToResolve.resolve();
			}else{
				var currentSet = recordsToCreate.splice(0, chunkSize);
				var tempIdFieldName = currentSet[0]._tempIdName();
				var query = this.__buildQueryToRetrieveIds(currentSet, tempIdFieldName);
				var self = this;
				PersistenceManager.findExact(query, currentSet[0].getMetadata(), null).then(function(foundData){					
					for(data in foundData){
						var filter = foundData[data]["json"][tempIdFieldName];
						var modelData = self.get(filter);
						if(modelData){
							self.remove(filter); //Need to remove record from set because it's indexed within the set by tempid
							if (onlyRefreshIds){
								modelData._id = foundData[data]._id;
								modelData._isNew = false;
							} else {
								modelData._fromNewToExisting(foundData[data]._id);						
							}
							self.put(modelData); //Add record back so it's indexed within the set by new _id
						}else{
							Logger.error("Could not find record with id {0} in dataset to update.", [filter]);							
						}
					}
					self.__asyncFetchIds(recordsToCreate, chunkSize, deferredToResolve, onlyRefreshIds);
				}).otherwise(function(error){
					deferredToResolve.reject(error);
				});
			}
		},
		__buildQueryToRetrieveIds: function(values, attributeName){
			var queue = [];			
			for(value in values){
				var object = {};
				object[attributeName] = values[value][attributeName];
				queue.push(object);
			}
			return queue;
		},
		lastSavedTime: function(){
			return this._lastSavedTime;
		},
		_applyPatch: function(jsonRecordArray) {
			var logKey = 'ModelDataSet - _applyPatch - Updating cached datasets for ' + this.getResourceName();
			Logger.timerStart(logKey);			
			//Probably good to make async to not block UI
			array.forEach(jsonRecordArray, function(jsonRecord){
				var recid = ('_id' in jsonRecord) ?  jsonRecord._id : jsonRecord.__tempId;
				var modelData = this.get(recid);				
				if (modelData){
					if(modelData.__getModifiedAttributesList().length === 0){
						try{
							modelData._applyPatch(jsonRecord);
						} catch (e){
							Logger.trace("Unable to apply patch: " + e);
						}					
					} else if (this.getParent()){
						if(PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE in jsonRecord){
							result = this.find(PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE + " == $1", jsonRecord[PlatformConstants.LOCAL_UNIQUEID_ATTRIBUTE]);
							if(result && result.length > 0 && result[0]){
								var modelData = result[0];
								if (!modelData.isModified()){
									try{
										modelData._applyPatch(jsonRecord);
									} catch (e){
										Logger.trace("Unable to apply patch: " + e);
									}
								}
							}else{
								this._appendData([jsonRecord]);
								this._lastSavedTime = new Date();
							}
						}else{
							this._appendData([jsonRecord]);
							this._lastSavedTime = new Date();
						}
					}
				} else {
					//Memory Optimization. Use stringifies carefully
					//Logger.warn('In memory data for patch not found: ' + JSON.stringify(jsonRecord, null, '   '));
				}
			}, this);			
			Logger.timerEnd(logKey);
		},
		_asyncCompleteUndoChangesOfChild: function(modelData){
			this._childModified(modelData);
			var resourceName = this.getMetadata().getResourceName();
			var id = modelData.getId();
			var allPromise = new Deferred();
			var stagedPromise = PersistenceManager.getStagedTransactionRecordOf(resourceName, id);
			var transactionPromise = PersistenceManager.getTransactionRecordOf(resourceName, id);
			var self = this;
			all([stagedPromise, transactionPromise]).then(function(result){
				allPromise.resolve(
					all([PersistenceManager.removeStagedTransaction(result[0] || []), 
					     PersistenceManager.removeTransactionRecordOf(result[1] || []),
					     self._asyncSave()])
				);
			}).otherwise(function(err){
				allPromise.reject(err);
			});												
			return allPromise.promise;
		},
		_asyncCompleteDeleteLocal: function(modelData){
			var resourceName = this.getMetadata().getResourceName();
			var id = modelData.getId();
			var allPromise = new Deferred();
			var stagedPromise = PersistenceManager.getStagedTransactionRecordOf(resourceName, id);
			var transactionPromise = PersistenceManager.getTransactionRecordOf(resourceName, id);
			var self = this;
			all([stagedPromise, transactionPromise]).then(function(result){
				allPromise.resolve(
					all([PersistenceManager.removeStagedTransaction(result[0] || []), 
					     PersistenceManager.removeTransactionRecordOf(result[1] || []),
					     self._asyncSave()])
				);
			}).otherwise(function(err){
				allPromise.reject(err);
			});												
			return allPromise.promise;
		}
	});
	ModelData._setModelDataSetClass(modelSet);
	//Need this to handle the case where ModelService loads before ModelDataSet, and ModelDataSet
	//has to override the temporary object that was returned as ModelDataSet.
	if (ModelService._setModelDataSetClass !== undefined) {
		ModelService._setModelDataSetClass(modelSet);
	}
	return modelSet;
});
