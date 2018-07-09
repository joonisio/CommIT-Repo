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

define("platform/comm/CommunicationManager", [
	"dojo/Deferred",
	"dojo/_base/lang", 
	"dojo/_base/array",
	"dojo/promise/all",
	"platform/exception/PlatformRuntimeException",
	"platform/comm/_ConnectivityChecker",
	"platform/store/_ResourceMetadataContext",
	"platform/logging/Logger",
	"platform/util/PlatformConstants",
	"platform/auth/UserManager",
	"platform/store/SystemProperties",
    "platform/attachment/AttachmentService"
], function(Deferred, lang, arrayUtil, all, PlatformRuntimeException, ConnectivityChecker, ResourceMetadataContext, 
		Logger, PlatformConstants, UserManager, SystemProperties, AttachmentService){
	
	var UserAuthenticationManager = null;
	var SystemResourceCache = null;
	//Need to load this way to prevent circular reference
	//CommunicationManager -> UserAuthenticationManager -> PersistenceManager -> CommunicationManager
	require(["platform/auth/UserAuthenticationManager",
	     	"platform/model/_SystemResourceCache"], function(uam, sysCache) {
		UserAuthenticationManager = uam;
		SystemResourceCache = sysCache;
	});	
	
	function isValidFieldForOslcSelect(fieldMetadata){
		//remoteid maps to rdf:about, which is a special field from OSLC
		return !fieldMetadata.local && 
		fieldMetadata.name !== ResourceMetadataContext.REMOTE_ID_ATTRIBUTE;
	}
	
	function recordDisplayValueField(field, referenceDisplayValues){
		var remoteFieldName = field.remoteName;
		var displayValueFieldsArray = referenceDisplayValues[remoteFieldName];
		if (!displayValueFieldsArray){
			displayValueFieldsArray = [];
		}
		displayValueFieldsArray.push(field['displayValueRemoteName']);
		referenceDisplayValues[remoteFieldName] = displayValueFieldsArray;
	}
	
	function generateOslcSelectForReferenceResourceField(thisObject, field, isFieldInList){
		var remoteFieldName = field.remoteName;
		if (field['dataType'] == 'inline'){
			if (isFieldInList) { //only take supporting data when explicitly requested
				var depResourceMetadata = ResourceMetadataContext.getResourceMetadata(field.referenceResource);
				var depOslcSelect = null;
				if (depResourceMetadata.isAttachment){
					depOslcSelect = '*';
				} else {
					depOslcSelect = thisObject._getOslcSelectFromMetadataFields(depResourceMetadata.fields);
				}
				remoteFieldName += '{' + depOslcSelect + '}';
			} else {
				remoteFieldName = null; //will make the field to be skipped
			}
		} else {
			remoteFieldName += '{rdf:about}';
		}
		return remoteFieldName;
	}
	
	function generateOslcSelectForDisplayValueFields(oslcSelectParts, referenceDisplayValues){
		for (remoteFieldName in referenceDisplayValues){
			var displayValueFieldsArray = referenceDisplayValues[remoteFieldName];
			
			var remoteNamePath = [];
			var remoteNameClosingBraces = '';
			
			var remoteFieldNamePartsList = remoteFieldName.split('.');
			arrayUtil.forEach(remoteFieldNamePartsList, function(remoteFieldNamePart) {
				remoteNamePath.push(remoteFieldNamePart);
				remoteNameClosingBraces += '}';
			});
			remoteNamePath.push(''); //this will ensure a leading brace
			
			oslcSelectParts.push(remoteNamePath.join('{') + displayValueFieldsArray.join(',') + remoteNameClosingBraces);
		}
	}
	
	function initializeMissingRequestedComplexAttributes(dataArray, requestedComplexAttributes) {
		arrayUtil.forEach(dataArray, function(data){
			arrayUtil.forEach(requestedComplexAttributes, function(complexAttribute){
				if (/-or-many$/.test(complexAttribute.multiplicity)){
					var attributeName = complexAttribute.remoteName;
					if (!(attributeName in data)){
						data[attributeName] = PlatformConstants.EMPTY_COMPLEX_FIELD;
					}	
				}
			});
		});
		dataArray = null;
	}
	
	function invokeAdapterQueryMethod(invocationData, requestedComplexAttributeNames){
		requestedComplexAttributeNames = (requestedComplexAttributeNames || []);
		var adapterDataFetchDeferred = new Deferred();
		var adapterDataFetchPromise = adapterDataFetchDeferred.promise;
		
		var isItDeltaRequest = invocationData.parameters[0].url.indexOf("lastfetchts") >= 0;
		
		var promise = UserAuthenticationManager.invokeAdapterSecurely(invocationData);
		promise.then(function(oslcResult) {			
			promise = null;
			var invocationResult = oslcResult.invocationResult;
			initializeMissingRequestedComplexAttributes(invocationResult['rdfs:member'], requestedComplexAttributeNames);
			var result = {
				isDelta: isItDeltaRequest,	
				maxrowstamp: invocationResult["responseHeaders"] && invocationResult["responseHeaders"]["maxrowstamp"]?invocationResult["responseHeaders"]["maxrowstamp"]:null,	
				data: invocationResult['rdfs:member'],
				recordsCount: (invocationResult['rdfs:member'] && invocationResult['rdfs:member'].length || 0)
			};
			if ('oslc:responseInfo' in invocationResult){
				result.nextPageURL = lang.getObject('oslc:responseInfo.oslc:nextPage.rdf:resource', false, invocationResult);
				result.recordsCount = lang.getObject('oslc:responseInfo.oslc:totalCount', false, invocationResult);
				result[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES] = requestedComplexAttributeNames;
			}
			// Issue 151660
			// Currently, this is a temporary workaround until TRTRIGA OSLC code is fixed.
			// Looks like TRIRIGA Platform release is not scheduled before the mobile app release.
			//
			// tririga returns the data in the following format:
			//
			//  "oslc:ResponseInfo": {
		    //      "oslc:totalCount": 51,
		    //      "oslc:nextPage": "........&pageno=2",
		    //      "rdf:about": "...."
		    //  },
			if ('oslc:ResponseInfo' in invocationResult){

				var nextPageObject = lang.getObject('oslc:ResponseInfo.oslc:nextPage', false, invocationResult);
				if (nextPageObject)
				{
					result.nextPageURL = nextPageObject;
				}
				result.recordsCount = lang.getObject('oslc:ResponseInfo.oslc:totalCount', false, invocationResult);
				result[PlatformConstants.REQUESTED_COMPLEX_ATTR_NAMES] = requestedComplexAttributeNames;
			}			
			delete invocationResult['rdfs:member'];
			invocationResult = null;
			delete oslcResult.invocationResult;
			oslcResult = null;
			
			adapterDataFetchDeferred.resolve(result);
			delete result.data;
			result = null;
			adapterDataFetchDeferred = null;
		}).
		otherwise(function(err) {
			if(!err.status){
				SystemProperties.updateLastTimeoutMomentAsNow();
			}			
			Logger.warn('Error invoking procedure: ' + err);
			adapterDataFetchDeferred.reject(err);
			adapterDataFetchDeferred = null;
			promise = null;
		});
		
		promise = null;
		return adapterDataFetchPromise;
	}
	
	function parseDynamicWhereClause(whereClause){
		var parsedWhereClause = lang.replace(whereClause, function(allMatch, key){
			//Look for key in format: resourceName[attributeToSearch=valueToSearch].attributeToReturn
			var keyParts = /(\w*?)%5B(\w*?)%3D(\w*?)%5D\.(\w*)/.exec(key); 
			if (keyParts){
				var resourceName = keyParts[1];
				var attributeToSearch = keyParts[2];
				var valueToSearch = keyParts[3];
				var attributeToReturn = keyParts[4];
				return getSystemResourceValue(resourceName, attributeToReturn, attributeToSearch, valueToSearch);
				
			} else {
				//Look for key in format: resourceName.attributeToReturn
				keyParts = /(\w*?)\.(\w*)/.exec(key); 
				if (keyParts){
					var resourceName = keyParts[1];
					var attributeToReturn = keyParts[2];
					return getSystemResourceValue(resourceName, attributeToReturn);
				}
				
				return encodeURIComponent('"' + UserManager.getInfo(key) + '"');
			}
		}, /%24%7B(.+?)%7D/g); //Looks for occurrences of ${xxx} in whereClause
		
		return parsedWhereClause;
	}
	
	function getSystemResourceValue(resourceName, attributeToReturn, attributeToSearch, valueToSearch){
		var modelDataSet = SystemResourceCache.getCachedSystemResource(resourceName);
		if (!modelDataSet){
			Logger.log('Resource ' + resourceName + ' is not cached. probably was not marked as system. Unable to calculate dynamic whereClause',1);
			return null;
		}
		var result = null;
		if (attributeToSearch && valueToSearch){
			var modelDataList = modelDataSet.find(attributeToSearch + " === $1", valueToSearch);
			if(modelDataList.length > 0){
				result = arrayUtil.map(modelDataList, function(modelData){
					return '"' + modelData[attributeToReturn] + '"';
				});
			}
			else{
				result = ['""'];
			}
		} else {
			var result = [];
			modelDataSet.foreach(function(modelData){
				result.push('"' + modelData[attributeToReturn] + '"');
			});
			if (result.length === 0){
				result = ['""'];
			}
		}

		return encodeURIComponent(result.join(','));
	}
	
	function replaceFieldFullSelectToStar(oslcSelect, fieldInfo) {
		var newFieldOslcSelect = fieldInfo.remoteName + '{*}';
		return oslcSelect.replace(fieldInfo.selectExpression, newFieldOslcSelect);
	}
	
	function replaceAttachmentFieldsSelectToStar(oslcSelect, resourceMetadata){
		arrayUtil.forEach(resourceMetadata.fields, function(fieldInfo) {
			if (fieldInfo.multiplicity === 'zero-or-many' && fieldInfo.referenceResource){
				var refResourceMetadata = ResourceMetadataContext.getResourceMetadata(fieldInfo.referenceResource);
				if (refResourceMetadata.isAttachment){
					oslcSelect = replaceFieldFullSelectToStar(oslcSelect, fieldInfo);
				}
			}
		});
		return oslcSelect;
	}
	
	return {
		
/**@memberOf platform.comm.CommunicationManager */
		checkConnectivityAvailable: function(){
			return ConnectivityChecker.checkConnectivityAvailable();
		},
		
		_getOslcSelectFromMetadataFields: function(resourceMetadataFields, arrayOfFieldNames){
			var self = this;
			var oslcSelectParts = [];
			var referenceDisplayValues = {};
			arrayUtil.forEach(resourceMetadataFields, function(field){

				if (isValidFieldForOslcSelect(field)){
					var hasFieldList = lang.isArray(arrayOfFieldNames); 
					var isFieldInList = hasFieldList && 
										arrayUtil.some(arrayOfFieldNames, function(item){return item == field.name;});
					if (!hasFieldList || isFieldInList){
						if (field.displayValueRemoteName){
							recordDisplayValueField(field, referenceDisplayValues);
							
						} else {
							var remoteFieldName = field.remoteName;
							if (field.referenceResource){
								remoteFieldName = generateOslcSelectForReferenceResourceField(self, field, isFieldInList);								
							}
							if (remoteFieldName){
								oslcSelectParts.push(remoteFieldName);
							}
						}	
					}
					
				}
			});
			
			generateOslcSelectForDisplayValueFields(oslcSelectParts, referenceDisplayValues);
			
			return oslcSelectParts.join(',');
		},
		
		pullResourceData: function(resourceMetadata, queryBase, whereClause, pageSize, includeAllRelatedRecords, applyStablePagination, oslcQueryParameters){
			/* check for previous timeouts to avoid screen locking*/
			if(this.shouldCancelRoundTrip()){
				var deferred = new Deferred();
				deferred.reject("timeout interval not exceeded");
				return deferred.promise;
			}
			
			if (!resourceMetadata){
				throw new PlatformRuntimeException('invalidMetadata');
			}
			
			pageSize = (!pageSize) ? 300 : pageSize;  //safeguard in case somebody forgot to set a pageSize in resource
			
			var oslcSelect = resourceMetadata.simpleFieldsOSLCSelect; 
			if (!oslcSelect || oslcSelect.length === 0){ //if for some reason the select was not generated, lets build it.
				oslcSelect = this._getOslcSelectFromMetadataFields(resourceMetadata.fields);
			}
						
			if (includeAllRelatedRecords && 
				lang.isString(resourceMetadata.complexFieldsOSLCSelect) && 
				resourceMetadata.complexFieldsOSLCSelect.length > 0){
				
				oslcSelect += ',' + replaceAttachmentFieldsSelectToStar(resourceMetadata.complexFieldsOSLCSelect, resourceMetadata);
			}
			
			var _hierarchyDescribedBy = resourceMetadata.hierarchyDescribedBy;
			var _hierarchyRequestedBy = resourceMetadata.hierarchyRequestedBy;
			if (_hierarchyDescribedBy && _hierarchyRequestedBy){
				oslcSelect += ","+_hierarchyDescribedBy+","+_hierarchyRequestedBy;
			}
			
			var urlBase = resourceMetadata.getURLBase();
			var resourceUrl = urlBase;
			if (queryBase == null || queryBase === PlatformConstants.SEARCH_RESULT_QUERYBASE || queryBase === PlatformConstants.CREATED_QUERYBASE){
				var queryBaseForSearch = '';
				if (resourceMetadata.queryBaseForSearch){
					queryBaseForSearch = resourceMetadata.queryBaseForSearch;

				} else { //if dev forgot to add a defaultForSearch QB, we pick up the 1st one
					var keys = Object.keys(resourceMetadata.queryBases);
					queryBaseForSearch = resourceMetadata.queryBases[keys[0]];
					var WARN = 1;
					Logger.log('No defaultForSearch queryBase defined for resource ' + resourceMetadata.name + '. Using ' + queryBaseForSearch, WARN);
				}
				resourceUrl += queryBaseForSearch;

			} else {
				 resourceUrl += resourceMetadata.queryBases[ queryBase ];
			}
				 		
			var queryStringSep = (resourceUrl.indexOf('?') > -1) ? '&' : '?';			
			
			var queryString = resourceUrl + queryStringSep;
 
			queryString += 'oslc.select=' + encodeURIComponent(oslcSelect);
			queryString += (pageSize) ? '&oslc.pageSize=' + pageSize : '';
			
			var parsedWhereClause = null;
			if (whereClause) {
				parsedWhereClause = parseDynamicWhereClause(whereClause);
				//Look for any remaining quotes or non-english characters within the whereClause and escape them
				parsedWhereClause = lang.replace(parsedWhereClause, function(allMatch, key) {
					return encodeURIComponent(allMatch);
				}, /\"([^\u0000-\u007F]+)\"/g); //looks for occurrences of quoted values left in the whereClause string and encodes them
			}
			queryString += (parsedWhereClause) ? '&oslc.where=' + parsedWhereClause  : '';
			queryString += (applyStablePagination) ? '&stablepaging=true' : '';
			//The following line will ensure a consistent order from the results.
			//This is necessary because worklist doesn't download all pages of data,
			//unless user requests next pages, so maybe a record is in the first page
			//in a query but not in a subsequent one.
			//And we only do this in worklist because additionalData we always download
			//all pages of data upfront so we don't care about pages not loaded yet 
			if (resourceMetadata.orderBy){
				queryString += '&oslc.orderBy=' + encodeURIComponent(resourceMetadata.getOSLCOrderBy());
			}
			else if (!resourceMetadata.additionalData){
				queryString += '&oslc.orderBy=' + encodeURIComponent('+dcterms:identifier');
			}			
			if (oslcQueryParameters){
				arrayUtil.forEach(Object.keys(oslcQueryParameters), function(parameter) {
					var parameterValue = oslcQueryParameters[parameter];
					queryString += '&' + encodeURIComponent(parameter) + '=' + encodeURIComponent(parameterValue);
				});
				
			}
			var doDelta = SystemProperties.getProperty('Lookup.data.delta.support');
			var doDeltaForSystem = SystemProperties.getProperty('System.data.delta.support')
			
			if(((doDelta &&(doDelta == true || doDelta == 'true'))  && resourceMetadata.additionalData) ||
					((doDeltaForSystem &&(doDeltaForSystem == true || doDeltaForSystem == 'true')) && resourceMetadata.isSystem)	){
				queryString = queryString + "&fetchmodedelta=1";
			
				var metrics = resourceMetadata.getResourceMetrics(queryBase);
				
				if(metrics && metrics.getMaxrowstamp()){
					queryString = queryString + "&lastfetchts=" + metrics.getMaxrowstamp();
				}
			}
			
			var finalUrl = queryString;

			Logger.trace('[COMM] queryUrl: ' + finalUrl, 2);
			Logger.timerStart('[COMM] Sending the url to adapter (pullResourceData)');
			
			var invocationData = {
				adapter:	resourceMetadata.adapter,
				procedure:	'query',
				parameters: [{
		 			url: finalUrl,
		 		}]
			};
			
			if (!resourceMetadata.additionalData && 
					!resourceMetadata.isSystem ){
				invocationData.timeout = SystemProperties.getConnectivityTimeout();
			}
			
			//When we need stable pagination or we're doing a search, requests tend to take longer to respond
			//Used mainly for batch download like additional data and full download of worklist, or for worklist search
			if (applyStablePagination || whereClause){
				invocationData.timeout = SystemProperties.getConnectivityTimeoutForStablePagination();
			}
			
			var requestedComplexFields = (includeAllRelatedRecords && resourceMetadata.getComplexFieldList() || 
										  []);
			var adapterDataFetchDeferred = invokeAdapterQueryMethod(invocationData, requestedComplexFields);
			adapterDataFetchDeferred.always(function(){
				Logger.timerEnd('[COMM] Sending the url to adapter (pullResourceData)');
			});			
			return adapterDataFetchDeferred;
		},
		
		pullResourceNextPageData: function(resourceMetadata, nextPageURL){
			/* check for previous timeouts to avoid screen locking*/
			if(this.shouldCancelRoundTrip()){
				var deferred = new Deferred();
				deferred.reject("timeout interval not exceeded");
				return deferred.promise;
			}
			
			if (!nextPageURL){
				throw new PlatformRuntimeException('missingURL');
			}

			Logger.trace('[COMM] nextPageUrl: ' + nextPageURL, 2);
			Logger.timerStart('[COMM] Sending url to adapter (pullResourceNextPageData)');
						
			var invocationData = {
				adapter:	resourceMetadata.adapter,
				procedure:	'query',
				parameters: [{
		 			url: nextPageURL
				}]
			};
			
			if (!resourceMetadata.additionalData && !resourceMetadata.isSystem){
				// if we reach this point means we had data, so we should timeout
				invocationData.timeout = SystemProperties.getConnectivityTimeout();
			}
			
			//When we need stable pagination, requests tend to take longer to respond
			//Used mainly for batch download like additional data and full download of worklist
			if (nextPageURL.indexOf("stablepaging=true") > 0){
				invocationData.timeout = SystemProperties.getConnectivityTimeoutForStablePagination();
			}
			
			var adapterDataFetchDeferred = invokeAdapterQueryMethod(invocationData);
			adapterDataFetchDeferred.always(function(){
				Logger.timerEnd('[COMM] Sending url to adapter (pullResourceNextPageData)');
			});			
			return adapterDataFetchDeferred;
		},
		
		pullResourceDataWithComplexAttributes: function(resourceMetadata, queryBase, whereClause, complexAttributeList, pageSize){
			
			if (!resourceMetadata){
				throw new PlatformRuntimeException('invalidMetadata');
			}

			/* check for previous timeouts to avoid screen locking*/
			if(this.shouldCancelRoundTrip()){
				var deferred = new Deferred();
				deferred.reject("timeout interval not exceeded");
				return deferred.promise;
			}
			
			pageSize = (!pageSize) ? 300 : pageSize;  //safeguard in case somebody forgot to set a pageSize in resource
			
			var oslcSelectParts = arrayUtil.map(complexAttributeList, function(complexAttributeName){
				var fieldInfo = resourceMetadata.getField(complexAttributeName);
				if (fieldInfo.selectExpression){
					return replaceAttachmentFieldsSelectToStar(fieldInfo.selectExpression, resourceMetadata);
				} else {
					return fieldInfo.remoteName;
				}
			});

			//Add the header fields at the beginning of the list
			oslcSelectParts.unshift(resourceMetadata.simpleFieldsOSLCSelect);

			var oslcSelect = oslcSelectParts.join(',');
			
			var urlBase = resourceMetadata.getURLBase();
			var resourceUrl = urlBase + resourceMetadata.queryBases[ queryBase ];
			
	 		
			var queryStringSep = (resourceUrl.indexOf('?') > -1) ? '&' : '?';			
			var queryStringForQueryBase = (queryBase && queryBase !== PlatformConstants.SEARCH_RESULT_QUERYBASE) ? resourceUrl  + queryStringSep : queryStringSep;
			
			var queryString = queryStringForQueryBase;
			queryString += 'oslc.select=' + encodeURIComponent(oslcSelect);
			queryString += (pageSize) ? '&oslc.pageSize=' + pageSize : '';
			queryString += (whereClause) ? '&oslc.where=' + parseDynamicWhereClause(whereClause) : '';
			if (!resourceMetadata.additionalData){
				queryString += '&oslc.orderBy=' + encodeURIComponent('+dcterms:identifier');
			}			
			
			resourceUrl = queryString;

			Logger.trace('[COMM] resourceUrl: ' + resourceUrl, 2);
			Logger.timerStart('[COMM] Sending url to adapter (pullResourceDataWithComplexAttributes)');
			
			var invocationData = {
				adapter:	resourceMetadata.adapter,
				procedure:	'query',
				parameters: [{
		 			url: resourceUrl
				}]
			};
			
			if (!resourceMetadata.additionalData && 
					!resourceMetadata.isSystem && 
					SystemProperties.getLastTimeWorkListDownloaded(resourceMetadata.name + "-" + (queryBase || "-<none>")) != null){
				invocationData.timeout = SystemProperties.getConnectivityTimeout();
			}
			
			//We will apply stablePagination timeout as requesting complex attributes
			//is likely to be slow
			invocationData.timeout = SystemProperties.getConnectivityTimeoutForStablePagination();
			var adapterDataFetchDeferred = invokeAdapterQueryMethod(invocationData);
			adapterDataFetchDeferred.always(function(){
				Logger.timerEnd('[COMM] Sending url to adapter (pullResourceDataWithComplexAttributes)');
			});
			return adapterDataFetchDeferred;

		},

		pullSingleResourceData: function(resourceMetadata, resourceUrl, /*optional*/ arrayOfFieldNames){
			var requestedComplexAttributes = [];
			/* check for previous timeouts to avoid screen locking*/
			if(this.shouldCancelRoundTrip()){
				var deferred = new Deferred();
				deferred.reject("timeout interval not exceeded");
				return deferred.promise;
			}
			if (lang.isArray(arrayOfFieldNames)){
				arrayUtil.forEach(arrayOfFieldNames, function(fieldName){
					if (resourceMetadata.isFieldComplex(fieldName)){
						requestedComplexAttributes.push(resourceMetadata.getField(fieldName));
					}
				});
			}
			if (!resourceMetadata){
				throw new PlatformRuntimeException('invalidMetadata', [resourceMetadata]);
			}
			if (!resourceUrl){
				throw new PlatformRuntimeException('invalidResourceUrl', [resourceUrl]);
			}
						
			var oslcSelect;
			if(!arrayOfFieldNames){
				oslcSelect = resourceMetadata.simpleFieldsOSLCSelect; 
			}
			if (!oslcSelect || oslcSelect.length === 0){ //if for some reason the select was not generated, lets build it.
				var oslcSelect = this._getOslcSelectFromMetadataFields(resourceMetadata.fields, arrayOfFieldNames);
			}
							
			var queryStringSep = (resourceUrl.indexOf('?') > -1) ? '&' : '?';
			resourceUrl += queryStringSep + 'oslc.properties=' + encodeURIComponent(oslcSelect);

			Logger.trace('[COMM] resourceUrl: ' + resourceUrl, 2);
			Logger.timerStart('[COMM] Sending url to adapter (pullSingleResourceData)');
			
			var invocationData = {
				adapter:	resourceMetadata.adapter,
				procedure:	'query', //this is a get operation but we use query for it too
				parameters: [{
		 			url: resourceUrl
				}]
			};
			
			
			if (!resourceMetadata.additionalData && !resourceMetadata.isSystem){
				invocationData.timeout = SystemProperties.getConnectivityTimeout();
			}
			
			
			var adapterDataFetchDeferred = new Deferred();
			var adapterDataFetchPromise = adapterDataFetchDeferred.promise;
			UserAuthenticationManager.invokeAdapterSecurely(invocationData).
			then(function(oslcResult) {
				initializeMissingRequestedComplexAttributes([oslcResult.invocationResult], requestedComplexAttributes);
				adapterDataFetchDeferred.resolve(oslcResult.invocationResult);
				adapterDataFetchDeferred = null;
			}).
			otherwise(function(err) {
				var statusCode = null;
				if (lang.isObject(err) && lang.exists('invocationResult.errors', err)){						
					var errors = lang.getObject('invocationResult.errors', false, err);
					arrayUtil.some(errors, function(errItem){
						statusCode = errItem['oslc:statusCode'];
						return true;
					});						
				}
				// no status code received means we could not reach either the adapter or oslc provider
				if(!statusCode){					
					SystemProperties.updateLastTimeoutMomentAsNow();
				}			
				adapterDataFetchDeferred.reject(err);
				adapterDataFetchDeferred = null;
			}).always(function(){
				Logger.timerEnd('[COMM] Sending url to adapter (pullSingleResourceData)');
			});
			
			return adapterDataFetchPromise;
		},
		
		/**
		 isAttachmentTransaction: function(resourceMetadata, changeRecord){
		 	//Use metadata.getAttachmentContainerComplexAttributes('remoteName')
		 	//to grab attachment container attributes, iterate over them in
		 	//the transaction, if the transaction is for any of these
		 	//attributes it's an attachment transaction
		 },
		 
		 uploadFilesFromTransaction: function(resourceMetadata, changeRecord){
		 	//Use metadata.getAttachmentContainerComplexAttributes('remoteName')
		 	//to grab attachment container attributes, iterate over them in
		 	//the record and call AttachmentService.uploadFileAsPromise
		 },
		 */
		
		pushResourceData: function(resourceMetadata, changeRecord, complexAttributesToAskInResponse) {
			if (!resourceMetadata){
				throw new PlatformRuntimeException('invalidMetadata');
			}

			
			var adapterDataChangeDeferred = new Deferred();
			var adapterDataChangePromise = adapterDataChangeDeferred.promise;
			
			complexAttributesToAskInResponse = complexAttributesToAskInResponse || [];
			
			var oslcSelect = resourceMetadata.simpleFieldsOSLCSelect; 
			if (!oslcSelect || oslcSelect.length == 0){ //if for some reason the select was not generated, lets build it.
				oslcSelect = this._getOslcSelectFromMetadataFields(resourceMetadata.fields);
			}
			arrayUtil.forEach(complexAttributesToAskInResponse, function(complexField){
				var complexFieldInfo = resourceMetadata.getField(complexField);
				if(complexFieldInfo && complexFieldInfo.selectExpression){
					oslcSelect += "," + complexFieldInfo.selectExpression;	
				}else{
					Logger.trace("[COMM] Not found metadata field for " + complexField);
				}				
			});	
			
			if(complexAttributesToAskInResponse[0] && resourceMetadata.isComplexFieldAnAttachment(complexAttributesToAskInResponse[0])){
				var credential = UserAuthenticationManager._getSessionId();
				   
				var attachToUpload = changeRecord.payload[resourceMetadata.getField(complexAttributesToAskInResponse[0]).remoteName];
				var lastPromise = null;
				arrayUtil.forEach(attachToUpload, function(attach){
					   
					var anywhereUploadPath = attach[PlatformConstants.ATTACH_UPLOAD_PATH];
					if (anywhereUploadPath && anywhereUploadPath.indexOf("created") >= 0){
						anywhereUploadPath = changeRecord.identifier + anywhereUploadPath.slice(anywhereUploadPath.indexOf("/"));
					}
					
					var anywhereAttachPath = attach[PlatformConstants.ATTACH_LOCATION_ATTR];
					if (!anywhereUploadPath || !anywhereAttachPath   ){
						return;
					}
	
					
					delete attach[PlatformConstants.ATTACH_UPLOAD_PATH];
					delete attach[PlatformConstants.ATTACH_LOCATION_ATTR];
						   
					var uploadOptions = {};
							   
					uploadOptions.properties = oslcSelect;
					uploadOptions.description = attach['wdrs:describedBy']['dcterms:description'];
					uploadOptions.name = attach['wdrs:describedBy']['dcterms:title'];
					//uploadOptions.transactionid = changeRecord['transactionid'];
					var category = attach['wdrs:describedBy']['spi:docType'];
					if(category){
						uploadOptions.category = category;
					}
					uploadOptions.anywhererefid = attach['wdrs:describedBy']['spi:anywhererefid'];   
						   
					if (lastPromise){
							lastPromise = lastPromise.then(function(){
											   
							return AttachmentService.uploadFileAsPromise(anywhereAttachPath, anywhereUploadPath, credential, uploadOptions);
						});
					} else {
									   
							lastPromise = AttachmentService.uploadFileAsPromise(anywhereAttachPath, anywhereUploadPath, credential, uploadOptions);
					}
				});
				
				if (lastPromise){
					lastPromise.then(function(result){
								var attachReturn = {};
								attachReturn.invocationResult = JSON.parse(result.message);
								attachReturn.invocationContext = null;
								attachReturn.status = result.http_code;
								adapterDataChangeDeferred.resolve(attachReturn); 
						
					}).otherwise(function(error){
							var attachErrorReturn = {};
								
							attachErrorReturn.invocationResult = { "errors": [{"oslc:extendedError": {},
																"oslc:message": error.message,
																"oslc:statusCode": error.http_status,
																"spi:reasonCode": error.http_status}]
															};
							attachErrorReturn.invocationContext = null;
							attachErrorReturn.status = error.http_status;
							attachErrorReturn.errorCode = error.http_status;
							attachErrorReturn.errorMsg = error.message;
							attachErrorReturn.isSuccessful= false;
							adapterDataChangeDeferred.reject(attachErrorReturn);
					});
				} else {
					adapterDataChangeDeferred.resolve({});
				}
				   
				return adapterDataChangePromise;
				
			}
			
			//var adapterDataChangePromise = adapterDataChangeDeferred.promise;
			var resourceUrl = resourceMetadata.getURLBase();
			var procedureName = null;
			
			if (changeRecord["identifier"]){				
				resourceUrl = changeRecord["identifier"];				
				procedureName = 'updateResource';

			} else {
				procedureName = 'insertResource';

				if (resourceMetadata.creationFactoryURLs && 
					resourceMetadata.creationFactoryURLs.length > 0){
					//TODO So far we don't have a way for the app dev to choose among
					//multiple creationFactories so we use just the first one for now
					resourceUrl += resourceMetadata.creationFactoryURLs[0].creationString;
				}
			}
						
			Logger.timerStart('[COMM] Pushing resource data (pushResourceData)');
						
			var invocationData = {
					adapter:	resourceMetadata.adapter,
					procedure:	procedureName,
					parameters: [{
			 			url: resourceUrl,
						payload: changeRecord['payload'],
						properties: oslcSelect,
						transactionid: changeRecord['transactionid'],
						hasDeletion: changeRecord['hasDeletion']
					}]
			};
			
			UserAuthenticationManager.invokeAdapterSecurely(invocationData).
			then(function(response) {
				Logger.trace("[COMM] Push OK: " + resourceUrl);
				adapterDataChangeDeferred.resolve(response);
			}).
			otherwise(function(response) {
				if (typeof response === "string"){
					var msg = response;
					response = {
						errorMsg: msg
					};
				}
				var serverErrors = lang.getObject('invocationResult.errors', true, response); //returned from maximo
				var clientError = lang.getObject('errorMsg', true, response); //usually when adapter times out to reach maximo
				
				clientError = (clientError && {'errorMsg': clientError} || {});
				
				var errors = lang.mixin(serverErrors, clientError);
				// MM improve memory utilization remove json.stringify object 
				//Logger.log('[COMM] Error invoking procedure: \n' + JSON.stringify(errors, null, '    '));
				
				adapterDataChangeDeferred.reject(response);
			}).always(function(){
				Logger.timerEnd('[COMM] Pushing resource data (pushResourceData)');
			});
			
			return adapterDataChangePromise;
		},
		shouldCancelRoundTrip: function(){
			var now = new Date().getTime();
			return (now - SystemProperties.getLastTimeoutMoment()) < SystemProperties.getConnectivityTimeoutInterval(); 
		},		
		getSystemProperties: function(propertyNameArray) {
			var getPropertyDeferred = new Deferred();
			var getPropertyPromise = getPropertyDeferred.promise;
			var invocationData = {
					adapter:	'OSLCGenericAdapter',
					procedure:	'getProperties',
					parameters:	[{
						'propertyNames': propertyNameArray
					}]					
			};			
			WL.Client.invokeProcedure(invocationData, {
				timeout: 3000, // cannot read this property because it comes from server
				onSuccess: function(response) {
					// a clone of the properties to hide the password
					var stringifiedProperties = JSON.stringify(response.invocationResult.properties);
   					var properties = JSON.parse(stringifiedProperties);
					// contains an element called password or passwd or pass
					var keys = Object.keys(properties);
					if(keys.toString().match(/\bpass\b|\bpasswd\b|\bpassword\b/i)) {
						for (var i = keys.length - 1; i >= 0; i--) {
							var key = keys[i];
							if(key.match(/\bpass\b|\bpasswd\b|\bpassword\b/i)) {
								properties[key] = "?";
							}
						};
					}
					// send cloned properties to trace and original properies to resolve the promise
					
					//Memory optimization
					//Logger.trace('[COMM] Successfully returned properties: ' + JSON.stringify(properties));					
					getPropertyDeferred.resolve(response.invocationResult.properties);
				},
				onFailure: function(response) {
					Logger.log('[COMM] Failed to get property, error message from adapter says: ' + response.errorMsg);
					var result = {};
					for(var index in propertyNameArray){
						result[propertyNameArray[index]] = "";						
					}
					getPropertyDeferred.resolve(result);
				},
				onConnectionFailure: function(response){
					Logger.log('[COMM] Failed to get property, error message from adapter says: ' + response.errorMsg);
					var result = {};
					for(var index in propertyNameArray){
						result[propertyNameArray[index]] = "";						
					}
					getPropertyDeferred.resolve(result);
				}
			});
			return getPropertyPromise;
		}
	};
});
