/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("application/business/DataSheetObject", 
		["application/business/AssetFunctionObject",
		 "application/business/CalibrationPointObject",
		 "platform/exception/PlatformRuntimeException",
		 "platform/translation/SynonymDomain",
		 "dojo/_base/array",
		 "dojo/_base/lang",
		 "platform/model/ModelService",
		 "platform/util/PlatformConstants"], 
function(AssetFunctionObject, CalibrationPointObject, PlatformRuntimeException, SynonymDomain, arrayUtil, lang, ModelService,PlatformConstants) {
	return {
		
		dsconfiglist: null,
		datasheet: null,
		
/**@memberOf application.business.DataSheetObject */
		onInitialize : function(dataSheet) {
			this.datasheet = dataSheet;
		},
		
		setFieldDefaults: function(dataSheetSet){
			if (dataSheetSet){
				for (var x = 0; x < dataSheetSet.count(); x++){
					var ds = dataSheetSet.getRecordAt(x);
					// set status desc and icon
					var status = ds.get('asfoundcalstatus');
					if (status){
						this.setDataSheetStatusNPFields(ds, status, 'asfound');
					}
					status = ds.get('asleftcalstatus');
					if (status){
						this.setDataSheetStatusNPFields(ds, status, 'asleft');
					}
				}
			}
		},

		deleteChangedRecords: function(resource){
			var attributeList = Object.keys(resource);
			arrayUtil.forEach(attributeList, function(attribute){
				delete resource.attribute;
			});
		},
		
		setDataSheetStatusNPFields: function(dataSheet, status, prefix){
			if (status != null){
				dataSheet.set(prefix + 'statusdesc_np', AssetFunctionObject.getStatusDescription(status));
				dataSheet.set(prefix + 'statusicon_np', AssetFunctionObject.getStatusIcon(status));
			}else{
				dataSheet.setNullValue(prefix + 'statusdesc_np');
				dataSheet.setNullValue(prefix + 'statusicon_np');
			}
		},
		
		onAdd: function(task) {
		},
		
		beforeSave : function(task) {
		},
		
		getIncompleteRequiredDatasheet: function(dsSet, domainCalStatus) {
			// return null if there is no datasheet (this isn't a calibration workorder)
			var dsnum = null;
			if (dsSet){
				for (var x = 0; x < dsSet.count(); x++){
					var ds = dsSet.getRecordAt(x);
					if (ds.get('required') == true){
						if (ds.isNull('asfoundcalstatus') || ds.isNull('asleftcalstatus')){
							dsnum = ds.get('dsplannum');
							break;
						}
						var isAsFoundBrokenOrMissing = this._isMissingOrBroken(ds, 'asfound', domainCalStatus);
						var isAsLeftBrokenOrMissing = this._isMissingOrBroken(ds, 'asleft', domainCalStatus);
						var afSet = ds.assetfunctionlist; 
						if(isAsFoundBrokenOrMissing && isAsLeftBrokenOrMissing) {
							continue;
						}
						else if(isAsFoundBrokenOrMissing) {
							if(afSet && !AssetFunctionObject.areAsLeftComplete(afSet)) {
								dsnum = ds.get('dsplannum');
								break;
							}
						}
						else if(isAsLeftBrokenOrMissing) {
							if(afSet && !AssetFunctionObject.areAsFoundComplete(afSet)) {
								dsnum = ds.get('dsplannum');
								break;
							}
						}
						else {
							var complete = AssetFunctionObject.areAssetFunctionsComplete(afSet, domainCalStatus, null);
							if (!complete){
								dsnum = ds.get('dsplannum');
								break;
							}
						}
					}
				}
			}
			return dsnum;
		},
		
		_isMissingOrBroken: function(ds, prefix, domainCalStatus) {
			var status = SynonymDomain.resolveToInternal(domainCalStatus, ds.get(prefix + 'calstatus'));
			return status == 'MISSING' || status == 'BROKEN';
		},
		
		setRequiredAndReadonly: function(wo, dataSheet){
			// if there's only one datasheet, required is set and is readonly, otherwise:
			// 	if looped wo: (wo.looped=1)
			//    if looped ds(wo.looped=1, pluscwods.location!=null, pluscwods.asset==null) or if any 
			// 	  	points (cp/func/dyn) are started, set required & readonly
			// 	if non-looped wo: (wo.looped=0), if there's data, set required & readonly - remove readonly
			//    if data is deleted.  error is thrown when uncheckinging required on last required datasheet
			var readonly = false;
			if (dataSheet.getOwner().count() == 1){
				if(!dataSheet.get('required'))
					dataSheet.set('required', true);
				readonly = true;
			}else {
				// looped data sheet on looped wo (location!=null, assetnum==null), required/readonly are always set
				// non-looped data sheet, required/readonly are set only if there's any point data
				if ( (wo.pluscloop && !dataSheet.isNull('location') && dataSheet.isNull('assetnum')) || this._anyPointData(dataSheet)){
					if(!dataSheet.get('required'))
						dataSheet.set('required', true);
					readonly = true;
				}
			}
			dataSheet.getRuntimeFieldMetadata('required').set('readonly', readonly);
		},
		
		_anyPointData: function(dataSheet){
			// check to see if there is any calibration point data on the data sheet, 
			// i.e. the asfound/asleft input/output have been entered for analog calpoint,
			// the setpoint is entered for discrete calpoint, the input/unit for dynamic
			// check, or the pass/fail for a function check
			var isArray = false;
			var pointSet = dataSheet.getOwner().calibrationpointlist_np;
			if (pointSet){
				if (pointSet.length != undefined){
					isArray = true;
				}
				for (var i = 0; i < (isArray ? pointSet.length: pointSet.count()); i++){
					var point = (isArray ? pointSet[i]: pointSet.getRecordAt(i));
					if (point && !this._isDynamic(dataSheet, point)){
						if(this._hasAnyPointData(point, 'asfound') || this._hasAnyPointData(point, 'asleft')){
							return true;
						}
					}
				}
			}
			return false;
		},
		
		_hasAnyPointData: function(point, prefix){
			// point can be just an array so don't use get()
			if (this._hasValue(point[prefix + 'input']) || this._hasValue(point[prefix + 'output'])
				|| this._hasValue(point[prefix + 'setpoint']) || this._hasValue(point[prefix + 'unit'])
				|| point[prefix + 'pass'] || point[prefix + 'fail'] ){
				return true;
			}
			return false;
		}, 

		_hasValue: function(val){
			if (val != null && val != undefined){
				return true;
			}
			return false;
		},
		
		_isDynamic: function(dataSheet, point){
			var afSet = dataSheet.getOwner().assetfunctionlist_np;
			for (var x = 0; x < afSet.count(); x++){
				var af = afSet.getRecordAt(x);
				if (af){
					if (af['caldynamic'] == true && af['instrseq'] == point['instrseq']){
						return true;
					}
				}
			}
			return false;
		},
		
		setDataSheetConfig: function(dsconfiglist) {
			this.dsconfiglist = dsconfiglist;
		},
		
		getRelatedDSConfig: function() {
			var result = null;
			if(this.dsconfiglist) {
				var dsplannum = this.datasheet.get('dsplannum');
				var revisionnum = this.datasheet.get('revisionnum');
				result = this.dsconfiglist.find("dsplannum == '" + dsplannum + "' && revisionnum == " + revisionnum);
			}
			if(result == null || result.length == 0) {
				throw new PlatformRuntimeException('noDSConfig');
			}
			else {
				return result[0];
			}
		},
		
		/*New DS Stuff*/
		getDatasheetResource: function(context, returnCurrentRecord){
			var dsresource = null;
			//if(this.isOfflineNewWO(context))
				dsresource = context.application.getResource('workOrder.pluscwods');
			//else
			//	dsresource = context.application.getResource('dataSheetResource');
				
			if(returnCurrentRecord)	
				return dsresource.getCurrentRecord();
			else
				return dsresource;
			
		},
		
		getAsetFunction: function(context, returnCurrentRecord){
			var afresource = null;
			if(this.isOfflineNewWO(context))
				afresource = context.application.getResource('workOrder.assetfunctionlist_np');
			else
				afresource = context.application.getResource('dataSheetResource.assetfunctionlist');
				
			if(returnCurrentRecord)	
				return afresource.getCurrentRecord();
			else
				return afresource;
			
		},
		
		getCalibrationPoint: function(context, returnCurrentRecord){
			var cpresource = null;
			if(this.isOfflineNewWO(context))
				cpresource = context.application.getResource('workOrder.calibrationpointlist_np');
			else
				cpresource = context.application.getResource('dataSheetResource.calibrationpointlist');
				
			if(returnCurrentRecord)	
				return cpresource.getCurrentRecord();
			else
				return cpresource;
			
		},
		
		isOfflineNewWO: function(context){
			return context.application.getResource('workOrder').isNew();
		},
		
		intersectionFound: function(array1,array2){
			array1.sort();
			array2.sort();
	        var i = j = 0;
	        while (i < array1.length && j < array2.length) {
	            if (array1[i] < array2[j]) 
	            	i++;
	            else if (array2[j] < array1[i]) 
	            	j++;
	            else{
	                return true;
	            }
	            
	        }
	        return false;
		},
		
		shouldMerge: function(isFetch, merge, srcResourceRecord, changedResourceInfo){
			if(isFetch)
				return true;
			var changeIndicators = ['asfoundsetpoint_local', 'asfoundinput_local',
					      			 'asfoundoutput_local', 'inputvalue_local', 'outputvalue_local', 'setpointvalue_local', 'asleftinput_local',
						      			'asleftoutput_local', 'asleftsetpoint_local'];
			
			var replacedLocal_changeIndicators = ['asfoundsetpoint', 'asfoundinput',
					      			 'asfoundoutput', 'inputvalue', 'outputvalue', 'setpointvalue', 'asleftinput',
						      			'asleftoutput', 'asleftsetpoint'];
			var indicatorFunctionDynamic = ['asfoundpass', 'asleftpass', 'afoundfail', 'asleftfail', 'asfoundunit', 'asleftunit'];

			var src_attrs = Object.keys(srcResourceRecord.__changedAttributes);
			
			if(merge === 'CP') {
				var local_attrs = Object.keys(srcResourceRecord.__changedLocalAttributes);	
				var foundLocalAttr = this.intersectionFound(local_attrs, changeIndicators); 
				var foundSrcAttr = this.intersectionFound(src_attrs, replacedLocal_changeIndicators)
				var functionIndicator = this.intersectionFound(src_attrs, indicatorFunctionDynamic);
				//If we find the indicator in local changed attribute, we cross check the actual attribute
				//in the server changed attribute. If not then that means this is first time into the view change which should be ignored
				if((foundLocalAttr && foundSrcAttr) || functionIndicator){
					//This point was changed //Mark AF and DS as change
					changedResourceInfo['AF'].push(srcResourceRecord['instrseq']);
					changedResourceInfo['DS'].push(srcResourceRecord['dsplannum']);
					return true;
				
				}
			}else if(merge === 'AF'){
				if(changedResourceInfo['AF'].indexOf(srcResourceRecord['instrseq']) > -1 || src_attrs.length > 0){
					changedResourceInfo['DS'].push(srcResourceRecord['dsplannum']);
					return true;
				}
			}else if(merge === 'DATASHEET'){
				if(changedResourceInfo['DS'].indexOf(srcResourceRecord['dsplannum']) > -1 || src_attrs.length > 0)
					return true;
			}
				
				return false;
		},
		
		mergeResources: function(srcResource, targetResource, isFetch, merge, changedResourceInfo){
			var self = this;
			var srcArray = lang.isArray(srcResource)? srcResource : srcResource.data;
			if(targetResource.data.length == 0){
				srcArray.forEach(function(srcResourceRecord){
					if(self.shouldMerge(isFetch, merge, srcResourceRecord, changedResourceInfo)){
					var targetResourceRecord = targetResource.createNewRecord();
					
						self.copyRecord(srcResourceRecord, targetResourceRecord, isFetch);
					}
					
						
				});
			}else{				
				if(merge=='DATASHEET'){
					//datasheet merge function
					srcArray.forEach(function(record){
						var targetResourceRecord = targetResource.find('dsplannum == $1', record.dsplannum);
						if(targetResourceRecord.length==0){
							targetResourceRecord = targetResource.createNewRecord();
							if(self.shouldMerge(isFetch, merge, record, changedResourceInfo))
								self.copyRecord(record, targetResourceRecord, isFetch);
						} else {
							//if data exists in datasheetresource do not merge
							//only execute when saving datasheet, not during fetch
							if(!isFetch && self.shouldMerge(isFetch, merge, record, changedResourceInfo)){
								self.copyRecord(record, targetResourceRecord[0], isFetch);
							}
						}
					});
				} else if(merge=='AF'){
					//asset function merge
					srcArray.forEach(function(record){
						var targetResourceRecord = targetResource.find('dsplannum == $1  && instrseq == $2', record.dsplannum, record.instrseq);
						if(targetResourceRecord.length==0){
							if(self.shouldMerge(isFetch, merge, record, changedResourceInfo))
							{
								targetResourceRecord = targetResource.createNewRecord();
								self.copyRecord(record, targetResourceRecord, isFetch);
							}
							
						} else {
							if(self.shouldMerge(isFetch, merge, record, changedResourceInfo))
								self.copyRecord(record, targetResourceRecord[0], isFetch);
						}
					});
				} else if(merge=='CP'){
					//calibration points merge
					srcArray.forEach(function(record){
						//var targetResourceRecord = targetResource.find('dsplannum == $1  && instrseq == $2 && point == $3', record.dsplannum, record.instrseq, record.point);
						var targetResourceRecord = targetResource.find('pluscwodspointid == $1', record.pluscwodspointid);
						
						if(targetResourceRecord.length==0){
							if(self.shouldMerge(isFetch, merge, record, changedResourceInfo))
							{
								targetResourceRecord = targetResource.createNewRecord();
								self.copyRecord(record, targetResourceRecord, isFetch);
							}
						} else {
							if(self.shouldMerge(isFetch, merge, record, changedResourceInfo))
							{
								self.copyRecord(record, targetResourceRecord[0], isFetch);
							}
						}
					});
				}
	
			}
			return changedResourceInfo;
		},
		
		getAttributeNamesToMerge: function(srcResourceRecord, isFetch){
			
			if(isFetch)
				return Object.keys(srcResourceRecord);
			
			var af_list = ["allowpointinserts","asfoundcalstatus","asfounderror","asleftcalstatus","aslefterror",
			"assetfunction","assetnum","caldynamic","calfunction","calpoint","checkpointtype_np",
			"cliplimits","cliplimitsin","description","dsplannum","exactremoteid","inputprecision",
			"instrseq","manual","noadjmade","noadjmadechoice1","noadjmadechoice2","noadjmadechoice3",
			"noadjmadechoice4","orgid","plantype","repeatable","revisionnum","siteid","wodsnum",
			"wonum"];

			var cp_list = ['wodsnum','instrseq','dsplannum','point','pluscwodspointid','siteid','orgid', 
			'asfoundinput', 'asfoundoutput','asleftinput','asleftoutput','setpointvalue','asfoundsetpoint','asleftsetpoint', 'isaverage',
			'isadded', 'inputvalue', 'outputvalue', 'asfounderror', 'asfoundfail', 'asfoundpass','asfoundpterror',
			'aslefterror', 'asleftfail', 'asleftpass', 'asleftpterror','setpointadj', 'anywhereRefId'];

			var cp_payload = ['asfinputstddev','asfoutputstddev','asfounderror','asfounderror1','asfounderror2',
			'asfounderror3','asfounderror4','asfoundfail','asfoundinput','asfoundouterror','asfoundoutput',
			'asfoundpass','asfoundproerror','asfoundpterror','asfoundsetpoint','asfoundtol1lower',
			'asfoundtol1upper','asfoundtol2lower','asfoundtol2upper','asfoundtol3lower','asfoundtol3upper',
			'asfoundtol4lower','asfoundtol4upper','asfoundtol1lworig','asfoundtol1uporig','asfoundtol2lworig',
			'asfoundtol2uporig','asfoundtol3lworig','asfoundtol3uporig','asfoundtol4lworig','asfoundtol4uporig',
			'asfoundunit','asfsetptstddev','aslefterror','aslefterror1','aslefterror2','aslefterror3',
			'aslefterror4','asleftfail','asleftinput','asleftouterror','asleftoutput','asleftpass',
			'asleftproerror','asleftpterror','asleftsetpoint','aslefttol1lower','aslefttol1upper',
			'aslefttol2lower','aslefttol2upper','aslefttol3lower','aslefttol3upper','aslefttol4lower',
			'aslefttol4upper','aslefttol1lworig','aslefttol1uporig','aslefttol2lworig','aslefttol2uporig',
			'aslefttol3lworig','aslefttol3uporig','aslefttol4lworig','aslefttol4uporig','asleftunit',
			'aslinputstddev','asloutputstddev','aslsetptstddev','direction','inputvalue','isaverage',
			'outputvalue','pointdescription','pvasltinput','pvasltoutput','revisionnum','ron1lower',
			'ron1upper','setpointadj','setpointaction','setpointvalue','anywhereRefId', 'plantype'];			
			
			var changedServerAttribute = Object.keys(srcResourceRecord.__changedAttributes);
			var changedLocalAttribute = Object.keys(srcResourceRecord.__changedLocalAttributes);
			
			
			if(srcResourceRecord.getOwner().name === 'calibrationPointResource'){
 				//Empty the list, since we cherry pick stuff to send to server
 				changedServerAttribute = [];
 				
 				//cherry picked cp attributes which are not null to be sent to server
				cp_payload.forEach(function(attribute) {
					if(srcResourceRecord[attribute] !==null && srcResourceRecord[attribute] !== '')
						changedServerAttribute.push(attribute);
				});
 				
 				//enforce the send of cp_list attributes
				cp_list.forEach(function(attribute){
					changedServerAttribute.indexOf(attribute) < 0 &&
					(srcResourceRecord[attribute] !==null && srcResourceRecord[attribute] !== '')? changedServerAttribute.push(attribute):changedServerAttribute;
				});

 				return changedServerAttribute;//Object.keys(srcResourceRecord);//changedServerAttribute.concat(changedLocalAttribute);
 				
			}else if(srcResourceRecord.getOwner().name === 'assetFunctionResource'){
				af_list.forEach(function(attribute){
					changedServerAttribute.indexOf(attribute) < 0? changedServerAttribute.push(attribute):changedServerAttribute;
				});
	
				return changedServerAttribute.concat(changedLocalAttribute);
			}else if(srcResourceRecord.getOwner().name === 'dataSheetResource'){//For datasheet we send all attributes
				return Object.keys(srcResourceRecord);
			}
			
			return null;
		},
		
		//Copies over all atttributes to target Record. 
		copyRecord: function(srcResourceRecord, targetResourceRecord, isFetch, isAf){
			
			var attributeNames = this.getAttributeNamesToMerge(srcResourceRecord, isFetch);
			var s = 1;
			var metadata = targetResourceRecord.getMetadata();
			var ignore_list = ['assetfunctionlist', 'calibrationpointlist', 'asfoundsetpoint_local', 'asfoundinput_local',
			      			 'asfoundoutput_local', 'inputvalue_local', 'outputvalue_local', 'setpointvalue_local', 'asleftinput_local',
			      			'asleftoutput_local', 'asleftsetpoint_local','isSaved','localrecordcount',PlatformConstants.ID,PlatformConstants.TEMPID_ATTR_NAME];
			arrayUtil.forEach(attributeNames, function(attributeName) {
				if(ignore_list.indexOf(attributeName) > -1){
					//skip
				} else {
					var field = metadata.getField(attributeName);
					if(field){
						if((field.multiplicity || field.local) && srcResourceRecord[attributeName] !== undefined){
							//if(srcResourceRecord[attributeName] == null)
							//	targetResourceRecord.setNullValue(attributeName);
							//else
								targetResourceRecord.set(attributeName, srcResourceRecord[attributeName]);

							if(!isFetch){
								targetResourceRecord.__changedAttributes[attributeName]=attributeName;	
							}
							
						}
					}
				}
			});	
			
			if(!isFetch){
				// if uploading we clear the srcRecord to reest the chnages to detect next set of chnages
				srcResourceRecord.__changedLocalAttributes = {};
				srcResourceRecord.__changedAttributes = {};
				targetResourceRecord._isChanged = true;	
			}else{
				//We clear target record changes, if fetching, so that we dont detect a transaction if the user 
				//just visits(no edits) the points and comes back
				targetResourceRecord.__changedLocalAttributes = {};
				targetResourceRecord.__changedAttributes = {};
			}

		}
		
	};
	
	/*value sent as null
	 * pointNPMbo.getMboValueData(attname).isNull()
	 (boolean) true
	 pointNPMbo.getMboValueData(attname).equals("")
	 (boolean) false
	 */
});
