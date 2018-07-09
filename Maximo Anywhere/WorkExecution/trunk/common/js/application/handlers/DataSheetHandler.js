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

define("application/handlers/DataSheetHandler", 
           [ "dojo/_base/declare",
             "dojo/_base/lang",
             "platform/format/FormatterService",
             "platform/model/ModelService",
             "platform/auth/UserManager",
             "application/handlers/CommonHandler",
             "platform/handlers/_ApplicationHandlerBase",
             "platform/exception/PlatformRuntimeException",
             "platform/warning/PlatformRuntimeWarning",
             "platform/util/PlatformConstants",
             "application/business/MaxVars",
             "platform/translation/SynonymDomain",
             "application/business/DataSheetObject",
             "application/business/AssetFunctionObject",
             "dojo/_base/array",
             "dojo/Deferred",
             "dojo/promise/all",
             "platform/store/_ResourceMetadataContext",
             "application/business/CalibrationPointObject",
             "platform/comm/CommunicationManager",
             "dojo/topic",
             "platform/logging/Logger",
             "platform/model/ModelDataSet",
             "platform/model/ModelData",
             "platform/translation/MessageService",
             "platform/store/SystemProperties",
             "platform/store/PersistenceManager"],
function(declare, lang, formatterService, ModelService, UserManager, CommonHandler, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, MaxVars, SynonymDomain, DataSheetObject, AssetFunctionObject, arrayUtil, Deferred, all, ResourceMetaData,CalibrationPointObject, CommunicationManager, topic, Logger,ModelDataSet,ModelData, MessageService, SystemProperties, PersistenceManager) {
        return declare( ApplicationHandlerBase, {
        
/**@memberOf application.handlers.DataSheetHandler */
                setAssetFunctionTransition: function(eventContext) {
                        var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                        if(datasheet.assetfunctionlist && datasheet.assetfunctionlist.count() == 1) {
                                eventContext.transitionTo = "WorkExecution.CalibrationPointReadings";
                        }
                        else {
                                eventContext.transitionTo = "WorkExecution.AssetFunctions";
                        }
                },
                
                handleBackButtonClickFromWODetail : function(eventContext){
                        var workDsSet = eventContext.application.getResource('dataSheetResource');

                        workDsSet.data = [];
                        workDsSet._changedRecords = [];
                        workDsSet._recordsToCreate = [];
                        eventContext.ui.hideCurrentView();
                },
                
                getDatasheet_DownloadResourceCopy: function(eventContext){
                    var deferred = new Deferred();

                    var wo = eventContext.application.getResource('workOrder').getCurrentRecord();

                    var filter = {siteid: wo.siteid};
                    //if(hasConnectivity && wo.wonum!=null){
                    if(wo.wonum!=null){
                        
                        //Commenting out for partial offline fix
                        //wo.calibrationpointlist_np = {};
                        //wo.assetfunctionlist_np = {};
                        filter = {wonum: wo.wonum, siteid: wo.siteid};
                    } 
                    //ResourceMetaData.getResourceMetadata("dataSheetResourceMax").setWhereClause(null);

//                    ModelService.filtered('dataSheetResourceMax', null, filter, 200, true, false, null, false).then(function(dataSheetMax){
                    ModelService.removeAndFilter('dataSheetResourceMax', filter, 200, false).then(function(dataSheetMax){
                        deferred.resolve(dataSheetMax);
                    }, function(){
                        deferred.resolve(null);
                    });
                    return deferred.promise;
                },

                getDatasheet_WorkingResourceCopy: function(eventContext){
                    var deferred = new Deferred();
                    var workorder = eventContext.application.getResource('workOrder').getCurrentRecord();
                    workorder.getModelDataSet('pluscwods').then(function(pluscwods){
                        deferred.resolve(pluscwods);
                    }, function(){
                        deferred.resolve(null);
                    });
                    return deferred.promise;
                },
                
                /**
                 * Manage datasheetresource records on local storage.
                 * If records exist and are not to be deleted, use those records when processing points.
                 */
                getDataSheetResource: function(eventContext){
                	//resource metadata is set as local, so not to send to server, but to leverage complex attributes saving on local storage
                	var dataSheet_metadata = ResourceMetaData.getResourceMetadata('dataSheetResource');
                    dataSheet_metadata.setLocal(true);
                     
                	var wo = eventContext.application.getResource('workOrder').getCurrentRecord();

                    var filter = {siteid: wo.siteid};
                    if(wo.wonum!=null){                        
                        filter = {wonum: wo.wonum, siteid: wo.siteid};
                    }                 	
                	
                    return ModelService.filtered('dataSheetResource', null, filter, 200, false, false, null, true);
                 },
                
                
                fetchDataSheetList: function(eventContext) {
                    var deferred = new Deferred();
                    var self = this;
                    
                    ModelService.allLocalOnly("userInfo").then(function(userinfo){
                        userinfo.resourceID = 'userInfo';
                        eventContext.application.addResource(userinfo);
                        var sep ='';
                        try{
                        	sep = userinfo.data[0].memo.split(":::")[1].replace("\\","");
                        	
                        	if(sep || sep !== '')
                        		window.anywhere_locale_seperator = sep;
                        	else
                        		window.anywhere_locale_seperator = '.';
                        }catch(e){
                        	window.anywhere_locale_seperator = '.';
                        }
                        window.anywhere_validation_regex = "(^[-+]?\\d+"+ window.anywhere_locale_seperator +"?\\d*?[-+]?$)|(^[-+]?"+ window.anywhere_locale_seperator +"\\d+$)";
                    });

                    //check connectivity and download the  server copy or take the local copy of datasheet accordingly
                    CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
                        var wo = eventContext.application.getResource('workOrder').getCurrentRecord();   
                        wo.set('alldatasheetchilddataloaded', false);
                        wo.set('datasheetlistsize', 'Loading...');
                        wo.getModelDataSet('pluscwods',false).always(function(pluscwods){
                            //If there isn't a pluscwods or no datasheets in pluscwods, then just send set the count to 0 and return.
                        	if (!pluscwods || !pluscwods.count || pluscwods.count() == 0){
                                var dataSheetResource_Metadata = ResourceMetaData.getResourceMetadata('dataSheetResource');
                                var dataSheetResource = new ModelDataSet(dataSheetResource_Metadata, null, []);
                                //Need to store empty resource 
                                eventContext.application.addResource(dataSheetResource);
                                wo.set('datasheetlistsize', '0');
                                return;
                        	}
                            //register change status watch
                            //Bug to fix: create a new wo n add ds offline. come to list go online and the go into the details
                            //Change satus and enter ds. Messes up everything since the syncronised point during status change are not available in anywhere.
                            /*wo.watch("wonum", function(){
                                    var wo = eventContext.application.getResource('workOrder').getCurrentRecord();   
                                    a_self.dataResourceWatch.remove();
                                    var filter = {wonum: wo.wonum, siteid: wo.siteid};
                                    ModelService.filtered('dataSheetResourceMax', null, filter, 1000, true, false, null, false).then(function(dataSheetMax){
                                         a_self.fetchDataSheetList(a_self.eventContext);
                                        deferred.resolve(dataSheetMax);
                                    });
                            });*/
                            var woClean = (wo.wonum!=null && !wo.isErrored() && (!wo[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] || wo[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] == 'null'));
                            all([self.getDatasheet_DownloadResourceCopy(eventContext),  self.getDataSheetResource(eventContext)]).then(function(results){
                            	//If there are records in the working copy (dataSheetResource) use them, otherwise merge in the records from DataSheetResourceMax.
                            	//No longer using pluscwods from work order because the working copy is now saved and kept around until the work order has been 
                            	//successfully sent to the server.
                                var dsMaxSet = results[0];
                                var workDsSet = results[1];
                            	var hasWorkingData = (workDsSet.count() > 0);
                            	var childPromises = [];
                            	var dsToMerge = [];
                            	if (!hasWorkingData || hasConnectivity){
                                    dsMaxSet.data.forEach(function(ds){
                                    	var workRecord = null;
                                    	if (hasWorkingData){
                                    		workRecord = workDsSet.find('dsplannum == $1 && revisionnum == $2 && wonum == $3 && siteid == $4 && orgid == $5', ds.dsplannum, ds.revisionnum, ds.wonum, ds.siteid, ds.orgid);
                                            if (workRecord[0]){
                                            	//dsrmax and working have the same data sheet  Make sure Max children were fetched from the server
                                        		workRecord = workRecord[0];
                                        	}
                                            else{
                                            	workRecord = null;
                                            }
                                    	}
                                    	if (workRecord){
    	                                	if (woClean && workRecord.isSaved){
    	                                    	childPromises.push(ModelService.multipleChildrenOf(ds, ['assetfunctionlist','calibrationpointlist']).always(function(){
                                                    if (ds['assetfunctionlist'] && ds['assetfunctionlist'].fetchedFromServer && ds['calibrationpointlist'] && ds['calibrationpointlist'].fetchedFromServer){
                                                    	//child resources fetched from the server and workRecord was saved and the work order doesn't have any changes
                                                    	//remove the working copy to be replaced by
                                                    	workRecord.deleteLocal(false);
                                                    	dsToMerge.push(ds);
                                                    }
                                                    else{
                                                    	workRecord.preserve = true;
                                                    }
    	                                    	}));
    	                                	}
                                    	}
                                        else{
                                        	childPromises.push(ModelService.multipleChildrenOf(ds, ['assetfunctionlist','calibrationpointlist']));
                                        	dsToMerge.push(ds);
                                        }
                                    });
                            	}
                            	all(childPromises).then(function(){
                            		//Check to see if the working copy has datasheets datasheetresourcemax doed not have
                            		if(hasConnectivity && workDsSet.count() > 0){
                                        workDsSet.data.forEach(function(ds){
                                        	//Remove all remainging working datasheets that have not be marked as preserve and have been saved
                                        	//Use the ones from dsmax (if any)
                                        	if (woClean && ds.isSaved){
                                        		if (ds.preserve){
                                        			ds.preserve = false;
                                        		}
                                        		else{
                                        			ds.deleteLocal(false);  
                                        		}
                                        	}
                                        });
                            		}
                                    ModelService.save(workDsSet).always(function(){
                                    	if (dsToMerge.length > 0){
                                        	dsToMerge = self.checkSizeOfDataSheets(dsToMerge, dsMaxSet.getResourceName());
                                    	}
                                    	DataSheetObject.mergeResources(dsToMerge, workDsSet, true, 'DATASHEET');
                                        var assetfunction_metadata = ResourceMetaData.getResourceMetadata('assetFunctionResource');
                                        var calibrationpoint_metadata = ResourceMetaData.getResourceMetadata('calibrationPointResource');
                                        dsToMerge.forEach(function(dsMaxRec){
                                        	var workRecord = workDsSet.find('dsplannum == $1 && revisionnum == $2 && wonum == $3 && siteid == $4 && orgid == $5', dsMaxRec.dsplannum, dsMaxRec.revisionnum, dsMaxRec.wonum, dsMaxRec.siteid, dsMaxRec.orgid);
                                            workRecord = workRecord[0];

                                            var assetfunctionlist_workingCopy = new ModelDataSet(assetfunction_metadata, null, [], workRecord, 'assetfunctionlist');
                                            workRecord['assetfunctionlist'] = assetfunctionlist_workingCopy;
                                            assetfunctionlist_workingCopy.resourceID = 'dataSheetResource.assetfunctionlist';

                                            var calibrationpointlist_workingCopy = new ModelDataSet(calibrationpoint_metadata, null, [], workRecord, 'calibrationpointlist');
                                            workRecord['calibrationpointlist'] = calibrationpointlist_workingCopy;
                                            calibrationpointlist_workingCopy.resourceID='dataSheetResource.calibrationpointlist';
                                            
                                            DataSheetObject.mergeResources(dsMaxRec.assetfunctionlist, workRecord.assetfunctionlist, true,'AF');	
                                            DataSheetObject.mergeResources(dsMaxRec.calibrationpointlist, workRecord.calibrationpointlist, true, 'CP');	
                                        });
                                        
                                        eventContext.application.addResource(workDsSet);
                                        
                                        var dsconfigFilter = [];
                                        workDsSet.data.forEach(function(ds){
                                        	//Load ensure child modeldatasets are loaded.
                                        	ds.getLoadedModelDataSetOrNull('assetfunctionlist');
                                        	ds.getLoadedModelDataSetOrNull('calibrationpointlist');
                                        	dsconfigFilter.push({dsplannum: ds.dsplannum, revisionnum: ds.revisionnum});
                        					if(ds.isNew()){
                        						ds.set('isSaved', true);
                        					}
                                        });
                                        // put datasheet resource (with all the children) in the app
                                        //var dsr = self.application.getResource("dataSheetResource");
                                        wo.set('alldatasheetchilddataloaded', true);
                                        wo.set('datasheetlistsize', workDsSet.count() + "");
                                        Logger.traceJSON('[DataSheetHandler.fetchDataSheetList()] Filtering local data sheet storage', dsconfigFilter);
                                        ModelService.filtered('transactiondatasheetconfig', null, dsconfigFilter, 200, hasConnectivity, true, null, !hasConnectivity)
                                        .then(function(dsconfigset) {
                                            Logger.trace('[DataSheetHandler.fetchDataSheetList()] Found ' + dsconfigset.length + ' data sheet configuration records');
                                            DataSheetObject.setDataSheetConfig(dsconfigset);
                                            deferred.resolve();
                                        })
                                        .otherwise(function(error){
                                            Logger.warn('[DataSheetHandler.fetchDataSheetList()] Unable to retrieve data sheet configuration records from storage!');
                                            Logger.traceJSON('[DataSheetHandler.fetchDataSheetList()] Error:', error);
                                            DataSheetObject.setDataSheetConfig(eventContext.application.getResource('additionaldatasheetconfig'));
                                            deferred.resolve();
                                        });
                                        
                                    });
                            	});
                            });             
                        });
                    }); 
                    return deferred.promise;
                },         
                
                setDataSheetTransition: function(eventContext) {
                        // set a watch on workOrder.datasheetlistsize (it's set in fetchDataSheetList)
                        // watch function will do the set transition
                        if (!eventContext.ui.movingBack){
                                var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
                        eventContext.addResourceWatchHandle(wo.watch('datasheetlistsize', lang.hitch(eventContext, function(){
                                // 'this' is the eventContext
                                        var dsSet = eventContext.application.getResource('dataSheetResource');
                                        if(dsSet && dsSet.count() == 1) {
                                                this.transitionTo = "WorkExecution.DataSheetDetailView";
                                        }
                                        else {
                                                this.transitionTo = "WorkExecution.DataSheetListView";
                                        }
                                })));
                        }
                },

                setRequiredForAll: function(eventContext){
                        var dsSet = eventContext.application.getResource('dataSheetResource');
                        var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
                        if (dsSet && dsSet.data != null && dsSet.data.length > 0){
                                for (var x = 0; x < dsSet.count(); x++){
                                        DataSheetObject.setRequiredAndReadonly(wo, dsSet.getRecordAt(x));
                                }
                        }
                },
                
                setRequiredForOne: function(eventContext){
                        var dataSheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                        var wo = window.UI.application.getResource('workOrder').getCurrentRecord();
                        DataSheetObject.setRequiredAndReadonly(wo, dataSheet);
                        
                        //We do this to set DataSheetResource as non local so that changes can be detected
                        //Once the fields are modeified it is reset back to local=true so that this resource is not
                        //sent to the server
                        //var dataSheet_metadata = ResourceMetaData.getResourceMetadata('dataSheetResource');
                        //dataSheet_metadata.local = false;
                },
                
                fetchAssetFunctions: function(eventContext) {
                        var ds = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                        var afSet = ds.assetfunctionlist;
                        if (afSet != null){
                                ds.set('assetfunctionlistsize', afSet.count()+'');
                        }
                },

                filterCalStatus: function(eventContext) {
                        var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                        var oslcmaxvars = eventContext.application.getResource("oslcmaxvars");
                        var orgid = datasheet.get('orgid');
                        var lookupResource = eventContext.application.getResource('domaincalstatus');
                        // filter lookup to MISSING, BROKEN if auto update status is on and on a datasheet or analog 
                        // asset function.  don't filter lookup under some conditions (see below)
                        if (MaxVars.autoUpdateDataSheetStatus(oslcmaxvars, orgid)){
                                var queryAsString = "maxvalue == 'MISSING' || maxvalue == 'BROKEN'";
                                var currentView = eventContext.ui.getCurrentViewControl();
                                var assetfunction = datasheet.assetfunctionlist.getCurrentRecord();
                                if (currentView.getId().indexOf('.DataSheet') < 0 || datasheet.assetfunctionlist.count() == 1){
                                        // if on the datasheet and the only assetfunction is dynamic, or if on then asset function 
                                        // and that asset function is dynamic, show all statuses.  otherwise show broken/missing
                                        if (assetfunction && assetfunction.caldynamic)
                                                queryAsString = null;
                                }
                                lookupResource.clearFilterAndSort();
                                if (queryAsString != null){
                                        lookupResource.filter(queryAsString);
                                }
                        }
                },
                
                validateRequiredCheckbox: function(eventContext){
                        var wo = this.application.getResource("workOrder").getCurrentRecord();
                        var ds = eventContext.getCurrentRecord();
                        // if it's not a loop workorder, make sure at least 1 datasheet is required
                        if (!wo.pluscloop && !ds.getPendingOrOriginalValue('required')){
                                var hasRequired = false;
                                var dsSet = ds.getOwner();
                                if (dsSet){
                                        for (var x = 0; x < dsSet.count(); x++){
                                                var d = dsSet.getRecordAt(x);
                                                if (d.getPendingOrOriginalValue('required') == true){
                                                        hasRequired = true;
                                                        break;
                                                }
                                        }
                                        if(!hasRequired){
                                                throw new PlatformRuntimeException('oneDataSheetRequired');
                                        }
                                }
                        }
                        ds.set('required', ds.getPendingOrOriginalValue('required'));
                        return true;
                },
                
                checkDataSheetPushErrors: function(eventContext) {
                        var wo = this.application.getResource("workOrder").getCurrentRecord();
                        var domainWorkType = this.application.getResource('domainworktype');
                        if(wo && domainWorkType) {
                                if(!wo.isErrored()) {
                                        var worktype = SynonymDomain.resolveToInternal(domainWorkType, wo.get('worktype'));
                                        if(worktype == 'CAL') {
                                                var dslist = this.application.getResource("dataSheetResource");
                                                var filteredData = dslist.isFiltered() ? dslist.data : null;
                                                var currentDataSheet = dslist.getCurrentRecord();
                                                var queryAsString = "wonum == '" + wo.wonum + "' && siteid == '" + wo.siteid + "'";
                                                dslist.clearFilterAndSort();
                                                dslist.filter(queryAsString);
                                                var ds = dslist.getCurrentRecord();
                                                while(ds) {
                                                        ds.watch(PlatformConstants.ERRORED_ATTRIBUTE, lang.hitch(wo, function(attrName, oldValue, newValue){
                                                                if(newValue == 1) {
                                                                        this._erroredRecord();
                                                                        wo._erroredInDataSheet = true;
                                                                }
                                                        }));
                                                        ds.watch(PlatformConstants.ERRORED_ATTRIBUTE_MSG, lang.hitch(wo, function(attrName, oldValue, newValue){
                                                                if(newValue) {
                                                                        this.set(PlatformConstants.ERRORED_ATTRIBUTE_MSG, newValue);
                                                                }
                                                        }));
                                                        ds = dslist.next();
                                                }
                                                if(filteredData) {
                                                        dslist.clearFilterAndSort();
                                                        dslist.setData(filteredData);
                                                        if(currentDataSheet) {
                                                                dslist.setCurrentIndexByRecord(currentDataSheet);
                                                        }
                                                }
                                        }
                                }
                        }
                },
                
                clearPointsFilter: function(eventContext) {
                        var ds = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                        if (ds){
                                if (ds.calibrationpointlist != null){
                                        try{
                                                ds.calibrationpointlist.clearFilterAndSort();
                                        }catch(e){
                                                // ignore error (list might be an array)
                                        }
                                }
                        }
                },
                
                openTransaction : function(eventContext){
                        // open a transaction when going into the view, close it when leaving (below)
//                      if (!eventContext.ui.movingBack){
//                              var dsSet = eventContext.application.getResource('dataSheetResource');
//                              if (dsSet){
//                                      var ds = dsSet.getCurrentRecord();
//                                      if (ds){
//                                              ds.openPriorityChangeTransaction();
//                                      }
//                              }
//                      }
                },

                saveDataSheets: function(eventContext){

                                
                    if (eventContext.ui.movingBack){
                        eventContext.application.showBusy();
                        
                        //Reset it back to local so that its not sent to server
                        //var dataSheet_metadata = ResourceMetaData.getResourceMetadata('dataSheetResource');
                        //dataSheet_metadata.setLocal(true);
                        
                        var dsSet = eventContext.application.getResource('dataSheetResource');
                        var uploadDsSet = eventContext.application.getResource('workOrder.pluscwods');
                        
                        var uploadCPSet = eventContext.application.getResource('workOrder.calibrationpointlist_np');
                        
                        
                        var uploadAFSet = eventContext.application.getResource('workOrder.assetfunctionlist_np');
                       
                        CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
                           
                        	var wo = eventContext.application.getResource('workOrder').getCurrentRecord(); 
                            wo.openPriorityChangeTransaction();
                            /*We only delete the upload copy while online and wo synced, since offline will refer to upload copy
                              when offline and all the local stuff(cp and af) will be needed in case they were changed
                              during the course it was offline.
                            */
                            if(hasConnectivity && wo.wonum!=null){
                                uploadCPSet.deleteLocalAll();
                                uploadAFSet.deleteLocalAll();   
                            } 
                                                        

                            if(dsSet){
                            	var afId_set = [];
                            	var dsId_set = [];
                            	var changedResourceInfo = {'AF':afId_set, 'DS': dsId_set};
                                //arrayUtil.forEach(dsSet.data, function(dataSheet) {
                                for(var i = 0; i < dsSet.count(); i++) {
                                        var dataSheet = dsSet.getRecordAt(i);
                                        
                                        var cp = dataSheet.calibrationpointlist;

                                        cp._changedRecords={};
                                        cp._recordsToCreate=[];
                                        
                                        
                                        changedResourceInfo = DataSheetObject.mergeResources(cp, uploadCPSet, false, 'CP', changedResourceInfo);

                                        
                                        var af = dataSheet.assetfunctionlist;
                                        af._changedRecords={};
                                        af._recordsToCreate=[];
                                        
                                        changedResourceInfo = DataSheetObject.mergeResources(af, uploadAFSet, false, 'AF', changedResourceInfo);
        
                                        var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
                                        
                                        if(uploadDsSet){
                                                
                                            if(wo.wonum==null){
                                                    var queryAsString = "dsplannum == '" +dataSheet.dsplannum + "'";
                                            } else {
                                                    var queryAsString = "wonum == '" + dataSheet.wonum  + "'";
                                            }


                                            uploadDsSet.clearFilterAndSort();
                                            uploadDsSet.filter(queryAsString);
                                        }
                                        

                                        if(cp){
                                                cp.__changedAttributes = {};
                                        }
                                                        
                                };   
                             
                                DataSheetObject.mergeResources(dsSet, uploadDsSet, false, 'DATASHEET', changedResourceInfo);
                              
                                if(dsSet){
                                        dsSet.__changedAttributes = {};
                                }
                                
                            }
                            
                            ModelService.save(wo.getOwner()).then(function(woSetSaved) {
                                wo.closePriorityChangeTransaction();
                                
                                for(var i = 0; i <  dsSet.count(); i++) {
                                	var dataSheet =  dsSet.getRecordAt(i);
                                	dataSheet.set('isSaved',true);
                                }
                                ModelService.save(dsSet).then(function(dsSetSaved){
                                	dsSet._changedRecords={};
                                    dsSet._recordsToCreate=[];
                                	eventContext.application.hideBusy();                
                                });                            
                            }).otherwise(function(error){
                            	for(var i = 0; i <  dsSet.count(); i++) {
                                	var dataSheet =  dsSet.getRecordAt(i);
                                	dataSheet.set('isSaved',!wo.isModified());  //If no longer marked as modified then the wo was staged and there was some other error.
                                }
                                ModelService.save(dsSet).then(function(dsSetSaved){
                                	dsSet._changedRecords={};
                                    dsSet._recordsToCreate=[];
                                	eventContext.application.hideBusy();                
                                }); 
                            });   
                        });

                    }
                },

                setStatusNPFields: function(eventContext){
                	var ds = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                    if (ds){
                            var status = ds.get('asfoundcalstatus');
                            ds.__changedAttributes['asfoundcalstatus'] = 'asfoundcalstatus';
                            DataSheetObject.setDataSheetStatusNPFields(ds, status, 'asfound');
                            status = ds.get('asleftcalstatus');
                            ds.__changedAttributes['asleftcalstatus'] = 'asleftcalstatus';
                            DataSheetObject.setDataSheetStatusNPFields(ds, status, 'asleft');
                    }
                },
                
                registerChange: function(eventContext){
                	var ds = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
                	ds.__changedAttributes[eventContext.resourceAttribute] = eventContext.resourceAttribute;
                	ds.getOwner()._changedRecords[ds._id] = ds;
                },
                
                initCalStatusNPFields: function(eventContext) {
                        var currentRecord = eventContext.getCurrentRecord();
                        var asfoundcalstatus = currentRecord.get('asfoundcalstatus');
                        var asleftcalstatus = currentRecord.get('asleftcalstatus');
                        currentRecord.set('asfoundstatusdesc_np', AssetFunctionObject.getStatusDescription(asfoundcalstatus));
                        currentRecord.set('asleftstatusdesc_np', AssetFunctionObject.getStatusDescription(asleftcalstatus));
                        currentRecord.set('asfoundstatusicon_np', AssetFunctionObject.getStatusIcon(asfoundcalstatus));
                        currentRecord.set('asleftstatusicon_np', AssetFunctionObject.getStatusIcon(asleftcalstatus));
                },
                
                
                /**
                 * Perform Calculations for AsLeft
                 */
                renderStatusAsLeftIfComplete : function(eventContext){
                        this.renderStatusIfComplete(eventContext,'asleft');
                },
                
                /**
                 * Perform Calculations for AsFound
                 */
                renderStatusAsFoundIfComplete : function(eventContext){
                        this.renderStatusIfComplete(eventContext,'asfound');
                },
                
                /**
                 * Perform Calculation for repeatables if all points are complete.
                 */
                renderStatusIfComplete:  function(eventContext,prefix) {
                        var calpoints = this.application.getResource('dataSheetResource.calibrationpointlist');
                        var avgPoint = eventContext.getCurrentRecord();
                        var wonum = avgPoint.wonum;
                        
                        var revisionnum = avgPoint.revisionnum;
                        var instrseq = avgPoint.instrseq;
                        var point = avgPoint.point;
                        
                        if (wonum == null){
                                calpoints.clearFilterAndSort();
                                calpoints.filter('dsplannum == $1 && revisionnum == $2 && instrseq == $3 && point == $4 && isaverage == false',dsplannum,revisionnum,instrseq,point);
                                var complete = CalibrationPointObject.areCalPointsComplete(calpoints, prefix);
                                calpoints.clearFilterAndSort();
                                calpoints.filter('dsplannum == $1 && revisionnum == $2 && instrseq == $3 && point == $4',dsplannum,revisionnum,instrseq,point); 
                        } else {
                                var siteid = avgPoint.siteid;
                                var dsplannum = avgPoint.dsplannum;

                                calpoints.clearFilterAndSort();
                                calpoints.filter('wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6 && isaverage == false',wonum,siteid,dsplannum,revisionnum,instrseq,point);
                                var complete = CalibrationPointObject.areCalPointsComplete(calpoints, prefix);
                                calpoints.clearFilterAndSort();
                                calpoints.filter('wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6',wonum,siteid,dsplannum,revisionnum,instrseq,point);

                        }



                        CalibrationPointObject.setCalStatusDomain(eventContext.application.getResource('domaincalstatus'));
                        
                        //check if all repeatable points for the avgpoint are complete
                        if (complete){
                                CalibrationPointObject.performCalculationForRepeatables(prefix, calpoints);
                        }
                
                        calpoints.clearFilterAndSort();
                },      
                
                filterDataSheet : function(eventContext){
                        
                        var curDS = eventContext.application.getResource('newDataSheetTempResource').getCurrentRecord();
                        var additionalDataSheetTemplateResource = eventContext.application.getResource('additionalDataSheetTemplateResource');
                        var additionaldatasheetassetlink = eventContext.application.getResource('additionaldatasheetassetlink');
                        
                        var wo = CommonHandler._getAdditionalResource(eventContext,'workOrder').getCurrentRecord();
                        var asset = curDS.getPendingOrOriginalValue('asset_number');
                        var location = curDS.getPendingOrOriginalValue('location_name');
                
                        var orgsitefilter = this.createOrgSiteFilter(eventContext, wo);
        
                        //additionaldatasheetassetlink.clearFilterAndSort();
                        
                        
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
                        
                        
                        additionalDataSheetTemplateResource.lookupFilter = self.filterArray;            
                        
                },
                
                createOrgSiteFilter : function(eventContext,wo){
                        var filter = [];
                        
                        filter.push({"siteid": null,"orgid": null});
                        filter.push({"orgid": wo.orgid, "siteid": null});
                        filter.push({"orgid": wo.orgid, "siteid": wo.siteid});
                        
                        return filter;
                },
                
                /**
                 * Apply and save calibration points to working copy at various points throughout the process
                 */
                saveDataSheetResource : function(eventContext){
                	
                	if (eventContext.ui.movingBack){
            			var dataSheetResource = this.application.getResource('dataSheetResource');
            			var dsChangesLookup = {};
            			if(dataSheetResource._hasChangedRecords()){
                           for(i in dataSheetResource._changedRecords)
                        	   dsChangesLookup[i] = dataSheetResource._changedRecords[i].__changedAttributes;     
            			}
            			var datasheetCurrentRecord = dataSheetResource.getCurrentRecord();
            			datasheetCurrentRecord.set('isSaved',false);
        				ModelService.save(dataSheetResource).then(function(ds){
        				    for(var i = 0; i < ds.data.length; i++){
        				        if(ds.data[i]._id in dsChangesLookup){
        				            ds.data[i].__changedAttributes = dsChangesLookup[ds.data[i]._id];           
        				            ds.data[i]._isChanged = true;
        				        }
        				    }            
        				}).otherwise(function(error){
                            Logger.traceJSON('[DataSheetHandler.saveDataSheetResource] Failed to save dataSheetResource: ', error);
        				});
                	}
        		},
        		
        		getDataSizeLimit: function(resourceName){
     				if (SystemProperties.getProperty('checkResoruceEachDataStorageSize') && SystemProperties.getProperty('checkResoruceEachDataStorageSize').split(',').indexOf(resourceName) > -1){
    					var sizeLimit = SystemProperties.getProperty('checkEachDataStorageMaxSize');
    					if (sizeLimit && !isNaN(sizeLimit)){
    						return sizeLimit ;
    					}
    				}
     				return 0;
        		},
        		
               checkSizeOfDataSheets: function(dataSheetsToCheck, resourceName){
                	var dataLimit = this.getDataSizeLimit(resourceName);
                	if (dataLimit > 0){
                    	var totalSize = 0;
                    	var self = this;
                    	if (dataSheetsToCheck.some(function(dsMaxRec, index){
                    		if (dsMaxRec[PlatformConstants.TOO_LARGE_DATA]){
                    			self.application.showMessage(MessageService.createStaticMessage("dataSheetTooBig").getMessage());
                            	return true;
                    		}
                    		else{
                        		var cpSize = dsMaxRec.calibrationpointlist.count() * 4000;
                        		var afSize = dsMaxRec.assetfunctionlist.count() * 3000;
                        		
                        		if ((cpSize + afSize + 1) > dataLimit){
                        			self.application.showMessage(MessageService.createStaticMessage("dataSheetTooBig").getMessage());
                                	return true;
                        		}
                    			totalSize += (cpSize + afSize + 1000);
                            	if (totalSize > dataLimit){
                            		self.application.showMessage(MessageService.createStaticMessage("dataSheetsforWOTooBig").getMessage());
                            		return true;
                            	}
                    		}
                    	})){
                        	return [];
                    	};
                	}
                	return dataSheetsToCheck;
                },
                
                undoDataSheetChanges: function(eventContext){
                	var deferred = new Deferred();
                	var self = this;
                    var wo = eventContext.application.getResource('workOrder').getCurrentRecord();   
                    wo.getModelDataSet('pluscwods', false).then(function(pluscwods){
	                	self.getDatasheet_DownloadResourceCopy(eventContext).then(function(dataSheets){
	                		var childPromises = [];
	                		if(dataSheets && dataSheets.data.length > 0){
                                var dsconfigFilter = [];
	                			dataSheets.data.forEach(function(ds){
                                	dsconfigFilter.push({dsplannum: ds.dsplannum, revisionnum: ds.revisionnum});
	                				childPromises.push(ModelService.multipleChildrenOf(ds, ['assetfunctionlist','calibrationpointlist']));
	                			});
	                			childPromises.push(ModelService.filtered('transactiondatasheetconfig', null, dsconfigFilter, 200, true, true));
	                			all(childPromises).always(function(){
	                				deferred.resolve();
	                			});
	                		}
	                		else{
                				deferred.resolve();
	                		}
	                	}).always(function(){
	                		self.getDataSheetResource(eventContext).then(function(workingCopy){
	    						if (workingCopy && workingCopy.data.length > 0){
		    						var deleteList = [];
		    						arrayUtil.forEach(workingCopy.data, function(workingDs){
	    								deleteList.push({_id: workingDs._id});
		    						});
	    							PersistenceManager.remove(workingCopy.getMetadata(), deleteList, true);
	    						}
	                		});
	                	});
                	}).otherwise(function(){
        				deferred.resolve();
                	});
                    return deferred.promise;
                },
                        
//              initStatusIconButton: function(eventContext) {
//                      var currentRecord = eventContext.getCurrentRecord();
//                      var asfoundcalstatus = currentRecord.get('asfoundcalstatus');
//                      var asleftcalstatus = currentRecord.get('asleftcalstatus');
//                      currentRecord.set('asfoundstatusdesc_np', AssetFunctionObject.getStatusIcon(asfoundcalstatus));
//                      currentRecord.set('asleftstatusdesc_np', AssetFunctionObject.getStatusIcon(asleftcalstatus));
//              }

        });
});