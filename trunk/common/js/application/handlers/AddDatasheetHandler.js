define("application/handlers/AddDatasheetHandler", [ "dojo/_base/declare",
		"platform/format/FormatterService", "platform/model/ModelService",
		"platform/auth/UserManager", "application/handlers/CommonHandler",
		"platform/handlers/_ApplicationHandlerBase",
		"platform/exception/PlatformRuntimeException",
		"platform/warning/PlatformRuntimeWarning",
		"platform/util/PlatformConstants",
		"application/business/CalibrationPointObject",
		"application/business/AssetFunctionObject",
		"dojo/_base/lang",
		 "platform/store/_ResourceMetadataContext",
		 "dojo/promise/all",
		 "platform/comm/CommunicationManager",
		 "platform/translation/SynonymDomain",
		 "dojo/_base/array",
		 "platform/translation/MessageService"], 
		
		
function(declare, formatterService, ModelService, UserManager, CommonHandler, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, CalibrationPointObject, AssetFunctionObject,lang,ResourceMetaData,all,CommunicationManager,SynonymDomain,arrayUtil, MessageService) {
	return declare(ApplicationHandlerBase, {

		current_datasheet : null,
        /**@memberOf application.handlers.AddDatasheetHandler */
		enableAddDatasheetButton : function(eventContext) {

			//Remove this to support offline addition of datasheets
			CommunicationManager.checkConnectivityAvailable().
			then(function(hasConnectivity){
				if(hasConnectivity){
					var workOrder = CommonHandler._getAdditionalResource(eventContext, "workOrder").getCurrentRecord();
					if (!workOrder || workOrder.isErrored()) {
						eventContext.setDisplay(false);
						return;
					}

					eventContext.setDisplay(hasConnectivity);		
				}
			});	
			


			eventContext.setDisplay(true);

			
		},

		canAddDatasheet : function(eventContext) {

			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var wtype = workOrder.getPendingOrOriginalValue('worktype');
			if(wtype) {
				var worktypes = CommonHandler._getAdditionalResource(eventContext,"additionalworktype");
				worktypes.clearFilterAndSort();
				var result = worktypes.find("worktype == '" + wtype + "' && orgid == '" + workOrder.get('orgid') + "'");
				worktype = result[0] ? result[0].type : null;
				if(worktype) {
					var domainWorkType = CommonHandler._getAdditionalResource(eventContext,"domainworktype");
					workOrder['wtype'] = SynonymDomain.resolveToInternal(domainWorkType, worktype, workOrder.get('orgid'));
				}
				
				//An asset or a location needs to exist on the workorder in order to add a datasheet
				if(!workOrder.getPendingOrOriginalValue('asset') && !workOrder.getPendingOrOriginalValue('location')){
					throw new PlatformRuntimeWarning('dsCheckAssetLication');
				}
				
				if(workOrder.wtype != 'CAL') {
					throw new PlatformRuntimeWarning('cannotAddDatasheet');
				} else {
					eventContext.ui.show('WorkExecution.NewWODatasheetDetailsView');
				}
				
			} else {
				throw new PlatformRuntimeWarning('cannotAddDatasheet');
			}
		},
		
		prepareDatasheetView : function(eventContext) {
			var curWO = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			
			if (!eventContext.ui.movingBack){
				//copy asset and location from workorder to new temp datasheet
				var newTempDS = eventContext.application.getResource('newDataSheetTempResource');
				var currentRecord = newTempDS.getCurrentRecord();
				currentRecord.set('asset_number',curWO.getPendingOrOriginalValue('asset'));
				currentRecord.set('location_name',curWO.getPendingOrOriginalValue('location'));
				currentRecord.setNullValue('datasheet_number');
				currentRecord.setNullValue('datasheet_desc');
				currentRecord.setNullValue('datasheet_revision');
			}

		},

		
		// Asset functionalities

		// Make this field readonly until the datasheet is populated

		validateAssetField : function(eventContext) {
			var curWO = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			
			var currentRecord = eventContext.getCurrentRecord(); //newDataSheetTempResource
			var asset = currentRecord.getPendingOrOriginalValue('asset_number');
			
			var additionalasset = CommonHandler._getAdditionalResource(eventContext,"additionalasset");
			
			//Only validate the asset if not a new follow on workorder
			if (curWO.get('origrecordid') && curWO.isNew()) {
				return;
			}
			
			//If asset is blank, set description as blank, return
			if(!asset){
				currentRecord.set('asset_number', null);
				currentRecord.set('asset_desc','');
				return;
			}

			var assetSet = additionalasset.find('assetnum == $1', asset);
			
			if(assetSet.length == 0) {
				throw new PlatformRuntimeWarning('invalidAsset');
			}	

		},
		
		validateLocationField : function(eventContext) {
			var curWO = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var currentRecord = eventContext.getCurrentRecord(); //newDataSheetTempResource
			var location = currentRecord.getPendingOrOriginalValue('location_name');
			var additionallocation = CommonHandler._getAdditionalResource(eventContext,"additionallocations");
			
			//Only validate the asset if not a new follow on workorder
			if (curWO.get('origrecordid') && curWO.isNew()) {
				return;
			}
			
			//If asset is blank, set description as blank, return
			if(!location){
				currentRecord.set('location_name', null);
				currentRecord.set('location_desc','');
				return;
			}

			var locationSet = additionallocation.find('location == $1', location);
			
			if(locationSet.length == 0) {
				throw new PlatformRuntimeWarning('invalidLocation');
			}	

		},

		filterDatasheets : function(eventContext) {

		},
		
		validateDSSelection: function(eventContext){
			
			var curDS = eventContext.application.getResource('newDataSheetTempResource').getCurrentRecord();
			var dsplannum = curDS.getPendingOrOriginalValue('datasheet_number');
			
			curDS.setNullValue('datasheet_desc');
			curDS.setNullValue('datasheet_revision');
			
			if(dsplannum==''){
				return;
			}
			
			var additionalDataSheetTemplateResource = eventContext.application.getResource('additionalDataSheetTemplateResource');
			var additionaldatasheetassetlink = eventContext.application.getResource('additionaldatasheetassetlink');
			
			var wo = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var asset = curDS.getPendingOrOriginalValue('asset_number');
			var location = curDS.getPendingOrOriginalValue('location_name');
		
			var orgsitefilter = this.createOrgSiteFilter(eventContext, wo);		
			
			var self = this;
			self.filterArray = [];
			
			//loop through asset and location separately
			var i = 0;
			while(i < 2){
				
				additionaldatasheetassetlink.clearFilterAndSort();
				
				if (i==0){
					if(asset && asset!=''){
						additionaldatasheetassetlink.filter("assetnum==$1",asset);
						
						//if additionaldatasheetassetlink is empty, set whereclause so it returns an empty datasheeptemplateresource
						if(additionaldatasheetassetlink.data.length==0){	
							self.filterArray.push(lang.clone({'siteid': '~~~~NULL~~~~'}));
						}
						
						additionaldatasheetassetlink.data.forEach(function(assetlink){
							var dsplannum = assetlink.dsplannum;
							var revisionnum = assetlink.revisionnum;
							
							arrayUtil.forEach(orgsitefilter, function(osfilter){
								osfilter.dsplannum=dsplannum;
								osfilter.revisionnum=revisionnum;
								self.filterArray.push(lang.clone(osfilter));
							});
						});
						
					}
				} else {
					if(location && location!=''){
						additionaldatasheetassetlink.filter("location==$1",location);
						
						//if additionaldatasheetassetlink is empty, set whereclause so it returns an empty datasheeptemplateresource
						if(additionaldatasheetassetlink.data.length==0){	
							self.filterArray.push(lang.clone({'siteid': '~~~~NULL~~~~'}));
						}
						
						additionaldatasheetassetlink.data.forEach(function(assetlink){
							var dsplannum = assetlink.dsplannum;
							var revisionnum = assetlink.revisionnum;
							
							arrayUtil.forEach(orgsitefilter, function(osfilter){
								osfilter.dsplannum=dsplannum;
								osfilter.revisionnum=revisionnum;
								self.filterArray.push(lang.clone(osfilter));
							});
						});
					}
				}

				i++;
			}
			
			ModelService.filtered('additionalDataSheetTemplateResource', null, self.filterArray, null, false, true).then(function(additionalDataSheetTemplateResource){
				var dsplannum = curDS.getPendingOrOriginalValue('datasheet_number');
				var datasheet = additionalDataSheetTemplateResource.find("dsplannum == $1", dsplannum);
				if (datasheet && datasheet.length==1){
					curDS.set('datasheet_desc', datasheet[0].description);
					curDS.set('datasheet_revision', datasheet[0].revisionnum);
				} else {
					eventContext.application.showMessage(MessageService.createStaticMessage('invalidDatasheet').getMessage());
					return;
				}
			});			
		},

		createOrgSiteFilter : function(eventContext,wo){
			var filter = [];
			
			filter.push({"siteid": null,"orgid": null});
			filter.push({"orgid": wo.orgid, "siteid": null});
			filter.push({"orgid": wo.orgid, "siteid": wo.siteid});
			
			return filter;
		},
		
		handleDSSelection : function(eventContext) {

		},
		
		initAddDatasheetView: function(eventContext) {
			
			
		},
		
		hideShowField: function(eventContext){
			
		},
		
		_copyDatasheet: function(addDShandler, eventContext, tocopy_ds, newds, wo){
			var wo = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
			var ds_set = CommonHandler._getAdditionalResource(eventContext, "newDataSheetTempResource");
			var currentDsRecord = ds_set.getCurrentRecord();			
			var dsplannum = currentDsRecord.getPendingOrOriginalValue('datasheet_number');
			var revisionnum = currentDsRecord.getPendingOrOriginalValue('datasheet_revision');
			var orgid = currentDsRecord.getPendingOrOriginalValue('datasheet_orgid');
			var siteid = currentDsRecord.getPendingOrOriginalValue('datasheet_siteid');
			
			newds.set('dsplannum',dsplannum);
			newds.set('description', currentDsRecord.getPendingOrOriginalValue('datasheet_desc'));
			newds.set('orgid', orgid);
			newds.set('revisionnum', revisionnum);
			newds.set('siteid', siteid);
			newds.set('addingtowo', true);
			
			var datasheetResource = eventContext.application.getResource('workOrder.pluscwods');
			if(datasheetResource && datasheetResource.data.length==1){
				newds.set('required', true);	
			} else {
				newds.set('required', false);
			}
			
			
			
			newds.set('assetnum', currentDsRecord.getPendingOrOriginalValue('asset_number'));
			newds.set('location', currentDsRecord.getPendingOrOriginalValue('location_name'));
			
			
			
				/*if(newds.assetfunctionlist == null)
					newds.assetfunctionlist = [];
				if (newds.calibrationpointlist == null)
					newds.calibrationpointlist = [];*/
				
				//assetfunctionTemplate = tocopy_ds.dataSheetTemplateInstr;
			
					
			var af_list = null;	
			if(tocopy_ds.dataSheetTemplateInstr){
				var tocopy_instr =lang.isArray(tocopy_ds.dataSheetTemplateInstr)? tocopy_ds.dataSheetTemplateInstr : tocopy_ds.dataSheetTemplateInstr.data;
				af_list = eventContext.application.getResource('workOrder').getCurrentRecord().assetfunctionlist_np;
				if(af_list){
					tocopy_instr.forEach(function(aftemplate){
						var assetfunction = af_list.createNewRecord();
						addDShandler._copyAssetFunction(assetfunction, aftemplate, eventContext);
					});
				}
			}
				

			//loop threw asset functions, check if repeatable 
			var cp_list = eventContext.application.getResource('workOrder').getCurrentRecord().calibrationpointlist_np;
			var aflist_array =lang.isArray(af_list)? af_list : af_list.data;
			
			//get asset function only for the current datasheet
			var dsfunction = lang.clone(aflist_array);
			for (var i=dsfunction.length; i--; ) {
			   if (dsfunction[i].dsplannum != dsplannum){
				   dsfunction.splice(i, 1);
			   }
			}
			
			dsfunction.forEach(function(assetfunction){
				var repeatable = assetfunction.get('repeatable');
				var instrseq = assetfunction.get('instrseq');
				var dsplannum = assetfunction.get('dsplannum');
				var dspoints = tocopy_ds.dataSheetTemplatePoint;
				
				var dspoints =lang.isArray(dspoints)? af_list : dspoints.data;
				//var dspoints = lang.clone(tocopy_ds.dataSheetTemplatePoint);
				//remove points that dont belong to the function
				//needed for offline repeatables, since we need to generate unique ids them locally to differentiate
				var uniqueid = 1; 
				for (var i=dspoints.length; i--; ) {
				   if (dspoints[i].instrseq == instrseq ){
					   //dspoints.splice(i, 1);
				   
				
//				dspoints.clearFilterAndSort();
//				var dspoints_array =lang.isArray(dspoints)? dspoints : dspoints.data;
//				if(dspoints && dspoints.data.length>0){						
//					var queryAsString = 'instrseq == '+instrseq;
//					dspoints.clearFilterAndSort();
//					dspoints.filter(queryAsString);
//				}
				
		
				var dspoints_array =lang.isArray(dspoints)? dspoints : dspoints.data;

				if(repeatable){
					var numrepeat = 0;
					//find number of times to repeat
					var dsconfiglist = eventContext.application.getResource('additionaldatasheetconfig');
					if(dsconfiglist) {
						var queryAsString = "dsplannum == '" + tocopy_ds.dsplannum + "' && revisionnum == '" + tocopy_ds.revisionnum + "'";
						dsconfiglist.clearFilterAndSort();
						dsconfiglist.filter(queryAsString);
						
						if(dsconfiglist && dsconfiglist.data.length>0){
							numrepeat = dsconfiglist.data[0].repeatvalue;
						};
					}
					
					if(cp_list){
						while(numrepeat>0){
							
								var calibrationpoint = cp_list.createNewRecord();
								addDShandler._copyCalibrationPoint(calibrationpoint, dspoints[i], eventContext, false, assetfunction, uniqueid);	
								uniqueid++;
							numrepeat--;
						}
						
						if (numrepeat == 0){
							//loop through datasheet points creating an average point for each.
							
								var calibrationpoint = cp_list.createNewRecord();
								//create average points
								addDShandler._copyCalibrationPoint(calibrationpoint, dspoints[i], eventContext, true, assetfunction, null);	
							
						};
					};

				} else {
					if(cp_list){
						
							var calibrationpoint = cp_list.createNewRecord();
							addDShandler._copyCalibrationPoint(calibrationpoint, dspoints[i], eventContext, false, assetfunction, null);
						
					};
				};
				   }
				}	
			});
			
			
//			if(tocopy_ds.dataSheetTemplatePoint){
//				var cp_list = eventContext.application.getResource('workOrder.calibrationpointlist_np')
//				if(cp_list){
//					tocopy_ds.dataSheetTemplatePoint.forEach(function(pointtemplate){
//						var calibrationpoint = cp_list.createNewRecord();
//						addDShandler._copyCalibrationPoint(calibrationpoint, pointtemplate, eventContext);
//						
//						
//					});
//				}
//			};
			
				
//maximo code that needs to be done on device to handle repeatables?				
//				// Create the points
//				for (int i = 0; i < numRepeats; ++i)
//				{
//					point = createCalPoint(dsInstrNew, dsLoopPoint, pointSet, false);
//				}
//
//				// Create the average point if necessary
//				if (repeat && point != null)
//				{
//					PlusCWODSPointSetRemote averagesSet = (PlusCWODSPointSetRemote)point
//							.getMboSet("PLUSCWODSPOINTAVERAGE");
//					createCalPoint(dsInstrNew, dsLoopPoint, averagesSet, true);
//				}
				
				
		},

		addDatasheet : function(eventContext) {
			
			var addDShandler = eventContext.application['application.handlers.AddDatasheetHandler'];
			
			var dsTemplate = eventContext.application.getResource('dataSheetTemplateResource');
			//datasheet template has not been downloaded, perform db detch
			if(dsTemplate.data.length==0){
				var dataSheetTemplateResourceMeta = ResourceMetaData.getResourceMetadata("dataSheetTemplateResource");
				//var originaldsTemplateWhereClause = dataSheetTemplateResourceMeta.whereClause;
				dataSheetTemplateResourceMeta.setWhereClause("");
				var dataSheetTemplateResourcePromise =  ModelService.all('dataSheetTemplateResource', null,null);
				
				dataSheetTemplateResourcePromise.then(function(dataSet){
					var dsTemplate = dataSet;//eventContext.application.getResource('dataSheetTemplateResource');
					var curDS = eventContext.application.getResource('newDataSheetTempResource').getCurrentRecord();
					var curDSRevision = curDS.datasheet_revision;
					var datasheet = curDS.getPendingOrOriginalValue('datasheet_number');
					
					var queryAsString = "dsplannum =='"+datasheet+"' && revisionnum=='"+curDSRevision+"'";
			
					dsTemplate.clearFilterAndSort();
					dsTemplate.filter(queryAsString);
					var tocopy_ds = dsTemplate.data[0];
					dsTemplate.clearFilterAndSort();
					
					complexlistPromise = all([tocopy_ds.getModelDataSet('dataSheetTemplateInstr', true), tocopy_ds.getModelDataSet('dataSheetTemplatePoint', true)]);
					
					complexlistPromise.then(function(){
						
						//Copy the ds details to send to maximo to add the DS row in PLUSCWODS
						var dsset = eventContext.application.getResource('workOrder.pluscwods');
						var wo = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
						
						var newds = dsset.createNewRecord();
						
						
						addDShandler._copyDatasheet(addDShandler, eventContext, tocopy_ds, newds,wo);
						
						//Copy the DS details to work poffline with datasheets and  af and points
						//When this transaction goes up, it is ignored while processing
						//var local_ds_set = eventContext.application.getResource('dataSheetResource');
						//var local_ds = dsset.createNewRecord();
						
						//addDShandler._copyDatasheet(tocopy_ds, local_ds);
						
						/*var dsSet = eventContext.application.getResource('dataSheetResource');
						//var current_datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
						//current_datasheet.openPriorityChangeTransaction();
						ModelService.save(dsSet).then(function(ds_result){
							var po = ds_result;
						});*/
						eventContext.ui.hideCurrentView();
					});

				});
			} else {
				//datasheettemplate already downloaded
				var dsTemplate = eventContext.application.getResource('dataSheetTemplateResource');
				var curDS = eventContext.application.getResource('newDataSheetTempResource').getCurrentRecord();
				var curDSRevision = curDS.datasheet_revision;
				var datasheet = curDS.getPendingOrOriginalValue('datasheet_number');
				
				var queryAsString = "dsplannum =='"+datasheet+"' && revisionnum=='"+curDSRevision+"'";
				dsTemplate.clearFilterAndSort();
				dsTemplate.filter(queryAsString);
				var tocopy_ds = dsTemplate.data[0];
				dsTemplate.clearFilterAndSort();
				
				complexlistPromise = all([tocopy_ds.getModelDataSet('dataSheetTemplateInstr', true), tocopy_ds.getModelDataSet('dataSheetTemplatePoint', true)]);
				
				complexlistPromise.then(function(){
					
					//Copy the ds details to send to maximo to add the DS row in PLUSCWODS
					var dsset = eventContext.application.getResource('workOrder.pluscwods');
					
					var wo = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
					wo.openPriorityChangeTransaction();
					
					var newds = dsset.createNewRecord();
					
					
					addDShandler._copyDatasheet(addDShandler, eventContext, tocopy_ds, newds,wo);
					
					eventContext.ui.hideCurrentView();
				});				
			}
			
			

		},
		
		_copyCalibrationPoint: function(calibrationpoint, pointtemplate, eventContext, isAverage, assetfunction, uniqueid){
			
			var curDS = eventContext.application.getResource('newDataSheetTempResource').getCurrentRecord();
			var datasheet = curDS.getPendingOrOriginalValue('datasheet_number');
			
			calibrationpoint.set("dsplannum", datasheet);
			calibrationpoint.set("direction", pointtemplate.direction);
			calibrationpoint.set("inputvalue", pointtemplate.inputvalue);
			calibrationpoint.set("instrseq", pointtemplate.instrseq);
			calibrationpoint.set("isaverage", false);
			calibrationpoint.set("orgid", pointtemplate.orgid);
			calibrationpoint.set("outputvalue", pointtemplate.outputvalue);
			calibrationpoint.set("pluscwodspointid", uniqueid!=null?uniqueid:pointtemplate.pluscwodspointid);
			if(!pointtemplate.plantype){
				calibrationpoint.set("plantype", assetfunction.plantype);
			} else {
				calibrationpoint.set("plantype", pointtemplate.plantype);
			}
			
			calibrationpoint.set("point", pointtemplate.point);
			calibrationpoint.set("pointdescription", pointtemplate.pointdescription);
			calibrationpoint.set("revisionnum", pointtemplate.revisionnum);
			calibrationpoint.set("ron1lower", pointtemplate.ron1lower);
			calibrationpoint.set("ron1upper", pointtemplate.ron1upper);
			calibrationpoint.set("setpointadj", pointtemplate.setpointadj);
			calibrationpoint.set("setpointaction", pointtemplate.setpointaction);
			calibrationpoint.set("setpointvalue", pointtemplate.setpointvalue);
			calibrationpoint.set("siteid", pointtemplate.siteid);
			
			if (isAverage && isAverage==true){
				calibrationpoint.set("isaverage", true);
				calibrationpoint.set("assetfunction", assetfunction.get('assetfunction'));
			}
			
		},
		
		_copyAssetFunction: function(assetfunction, aftemplate,eventContext){
			//Copy Asset function Records
			
				var curDS = eventContext.application.getResource('newDataSheetTempResource').getCurrentRecord();
				var datasheet = curDS.getPendingOrOriginalValue('datasheet_number');
			
				assetfunction.set("dsplannum", datasheet);
				assetfunction.set("allowpointinserts", aftemplate.allowpointinserts);
				assetfunction.set("assetfunction", aftemplate.assetfunction);
				assetfunction.set("caldynamic", aftemplate.caldynamic);
				assetfunction.set("calfunction", aftemplate.calfunction);
				assetfunction.set("calpoint", aftemplate.calpoint);
				assetfunction.set("cliplimits", aftemplate.cliplimits);
				assetfunction.set("cliplimitsin", aftemplate.cliplimitsin);
				assetfunction.set("description", aftemplate.description);
				assetfunction.set("inputprecision", aftemplate.inputprecision);
				assetfunction.set("inputrange", aftemplate.inputrange);
				assetfunction.set("instrcalrangeeu", aftemplate.instrcalrangeeu);
				assetfunction.set("instrcalrangefrom", aftemplate.instrcalrangefrom);
				assetfunction.set("instrcalrangeto", aftemplate.instrcalrangeto);
				assetfunction.set("instroutrangeeu", aftemplate.instroutrangeeu);
				assetfunction.set("instroutrangefrom", aftemplate.instroutrangefrom);
				assetfunction.set("instroutrangeto", aftemplate.instroutrangeto);
				assetfunction.set("instrseq", aftemplate.instrseq);
				assetfunction.set("manual", aftemplate.manual);
				assetfunction.set("noadjmadechoice1", aftemplate.noadjmadechoice1);
				assetfunction.set("noadjmadechoice2", aftemplate.noadjmadechoice2);
				assetfunction.set("noadjmadechoice4", aftemplate.noadjmadechoice4);
				assetfunction.set("noadjmadechoice3", aftemplate.noadjmadechoice3);
				assetfunction.set("nonlinear", aftemplate.nonlinear);
				assetfunction.set("orgid", aftemplate.orgid);
				assetfunction.set("outputprecision", aftemplate.outputprecision);
				assetfunction.set("outputrange", aftemplate.outputrange);
				assetfunction.set("plantype", aftemplate.plantype);
				assetfunction.set("processeu", aftemplate.processeu);
				assetfunction.set("processeufactor", aftemplate.processeufactor);
				assetfunction.set("repeatable", aftemplate.repeatable);
				assetfunction.set("revisionnum", aftemplate.revisionnum);
				assetfunction.set("ron1lowervalue", aftemplate.ron1lowervalue);
				assetfunction.set("ron1type", aftemplate.ron1type);
				assetfunction.set("ron1uppervalue", aftemplate.ron1uppervalue);
				assetfunction.set("squared", aftemplate.squared);
				assetfunction.set("squareroot", aftemplate.squareroot);
				assetfunction.set("tol1description", aftemplate.tol1description);
				assetfunction.set("tol1lowervalue", aftemplate.tol1lowervalue);
				assetfunction.set("tol1noadjlimit", aftemplate.tol1noadjlimit);
				assetfunction.set("tol1status", aftemplate.tol1status);
				assetfunction.set("tol1sumdirection", aftemplate.tol1sumdirection);
				assetfunction.set("tol1sumeu", aftemplate.tol1sumeu);
				assetfunction.set("tol1sumread", aftemplate.tol1sumread);
				assetfunction.set("tol1sumurv", aftemplate.tol1sumurv);
				assetfunction.set("tol1sumspan", aftemplate.tol1sumspan);
				assetfunction.set("tol1type", aftemplate.tol1type);
				assetfunction.set("gbfrom1", aftemplate.gbfrom1);
				assetfunction.set("gbto1", aftemplate.gbto1);
				assetfunction.set("gbsumdirection1", aftemplate.gbsumdirection1);
				assetfunction.set("tol1uppervalue", aftemplate.tol1uppervalue);
				assetfunction.set("tol2description", aftemplate.tol2description);
				assetfunction.set("tol2lowervalue", aftemplate.tol2lowervalue);
				assetfunction.set("tol2noadjlimit", aftemplate.tol2noadjlimit);
				assetfunction.set("tol2status", aftemplate.tol2status);
				assetfunction.set("tol2sumdirection", aftemplate.tol2sumdirection);
				assetfunction.set("tol2sumeu", aftemplate.tol2sumeu);
				assetfunction.set("tol2sumread", aftemplate.tol2sumread);
				assetfunction.set("tol2sumurv", aftemplate.tol2sumurv);
				assetfunction.set("tol2sumspan", aftemplate.tol2sumspan);
				assetfunction.set("tol2type", aftemplate.tol2type);
				assetfunction.set("gbfrom2", aftemplate.gbfrom2);
				assetfunction.set("gbto2", aftemplate.gbto2);
				assetfunction.set("gbsumdirection2", aftemplate.gbsumdirection2);
				assetfunction.set("tol2uppervalue", aftemplate.tol2uppervalue);
				assetfunction.set("tol3description", aftemplate.tol3description);
				assetfunction.set("tol3lowervalue", aftemplate.tol3lowervalue);
				assetfunction.set("tol3noadjlimit", aftemplate.tol3noadjlimit);
				assetfunction.set("tol3status", aftemplate.tol3status);
				assetfunction.set("tol3sumdirection", aftemplate.tol3sumdirection);
				assetfunction.set("tol3sumeu", aftemplate.tol3sumeu);
				assetfunction.set("tol3sumread", aftemplate.tol3sumread);
				assetfunction.set("tol3sumurv", aftemplate.tol3sumurv);
				assetfunction.set("tol3sumspan", aftemplate.tol3sumspan);
				assetfunction.set("tol3type", aftemplate.tol3type);
				assetfunction.set("tol3uppervalue", aftemplate.tol3uppervalue);
				assetfunction.set("gbfrom3", aftemplate.gbfrom3);
				assetfunction.set("gbto3", aftemplate.gbto3);
				assetfunction.set("gbsumdirection3", aftemplate.gbsumdirection3);
				assetfunction.set("tol4description", aftemplate.tol4description);
				assetfunction.set("tol4lowervalue", aftemplate.tol4lowervalue);
				assetfunction.set("tol4noadjlimit", aftemplate.tol4noadjlimit);
				assetfunction.set("tol4status", aftemplate.tol4status);
				assetfunction.set("tol4sumdirection", aftemplate.tol4sumdirection);
				assetfunction.set("tol4sumeu", aftemplate.tol4sumeu);
				assetfunction.set("tol4sumread", aftemplate.tol4sumread);
				assetfunction.set("tol4sumurv", aftemplate.tol4sumurv);
				assetfunction.set("tol4sumspan", aftemplate.tol4sumspan);
				assetfunction.set("tol4type", aftemplate.tol4type);
				assetfunction.set("tol4uppervalue", aftemplate.tol4uppervalue);
				assetfunction.set("gbfrom4", aftemplate.gbfrom4);
				assetfunction.set("gbto4", aftemplate.gbto4);
				assetfunction.set("gbsumdirection4", aftemplate.gbsumdirection4);

		},

		cancelAddDatasheet : function(eventContext) {

			var ds_set = CommonHandler._getAdditionalResource(eventContext, "newDataSheetTempResource");

			var currentRecord = ds_set.getCurrentRecord();
			if (currentRecord) {

				currentRecord.set('asset_number','');
				currentRecord.set('location_name','');
				//currentRecord.deleteLocal();

				//ds_set.setCurrentIndexByRecord(this.current_datasheet);

			}
			eventContext.ui.hideCurrentView();

		}

	});

});
