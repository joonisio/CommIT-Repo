define("platform/auth/AdminModeManager", ["platform/store/_ResourceMetadataContext",
        "dojo/_base/lang",
        "dojo/Deferred",
        "dojo/promise/all",
        "platform/logging/Logger",
        "platform/translation/MessageService",
        "platform/model/ModelService",
        "platform/store/SystemProperties",
        "dojo/_base/declare",
        "platform/store/PersistenceManager",
        "platform/util/PlatformConstants",
    ],
    function(ResourceContext, lang, Deferred, all, Logger, MessageService, ModelService, SystemProperties, declare, PersistenceManager, PlatformConstants) {

        return {

/**@memberOf platform.auth.AdminModeManager */
            loadAdminData: function(deferred, userInfoSet, lastTimeout) {

                var self = this;
                var anywherePropValMeta = ResourceContext.getResourceMetadata("anywherePropVal");
                var anywherePropValQueryBase = '';
                if (anywherePropValMeta) {
                    anywherePropValQueryBase = Object.keys(anywherePropValMeta.queryBases)[0];
                }
                
                //Strip spaces from within the appName
                var appName = WL.Client.getAppProperty(WL.AppProperty.APP_DISPLAY_NAME).toUpperCase().replace(/\s+/g, '');

                Logger.log('Loading System Properties from application ' + appName);
                //check if we have data to send to the server or with error before apply admin settings
                var transacDeferred = PersistenceManager.getTransactionOfAllRecords();
                transacDeferred.then(function(transacData) {
                	var accessStartegy = true;
                    if (transacData.length > 0) {
                        Logger.log(transacData.length + ' pending transaction was found, the resource model will be updated to reflect maxmo admin app only after transaction been sent to maximo ');
                        accessStartegy = false;
                    } 
                        ModelService.all("anywherePropVal", anywherePropValQueryBase, 1000, accessStartegy).then(function(propertiesSet) {
                            

                            var appKeys = {};
                            appKeys['null'] = true;
                            appKeys[appName] = true;

                            var groupKeys = {};
                            groupKeys['null'] = true;

                            var userData = userInfoSet.getCurrentRecord();
                            var groups = userData.getLoadedModelDataSetOrNull('groupList');

                            if (groups) {
                                for (var i = 0; i < groups.count(); i++) {
                                    groupKeys[groups.getRecordAt(i).get("roleName")] = true;
                                }
                            }


                            if (propertiesSet.count() > 0) {
                                Logger.log('System Data retrieved from application ' + appName + " with " + propertiesSet.count() + " properties");


                                var propertiesSetFiltered = propertiesSet.filter("$1[appName] && $2[groupName]", appKeys, groupKeys);

                                Logger.log('Refresh of System data for application ' + appName);
                                
                                //To clear providerUrl at group level
                                self._setMapProviderProperties(propertiesSetFiltered.data);

                                //apply business rules for properties 
                                var propertiesSetData = self._cleanProperties(propertiesSetFiltered.data);
                                for (var prop in propertiesSetData) {
                                    Logger.trace('Properties : ' + propertiesSetData[prop].propid + ' set with Value =' + propertiesSetData[prop].value);
                                    // 'download attachments w/ work list' property shouldn't be overridden by server value just in case its value was changed locally
                                    if( (PlatformConstants.BULK_ATTACH_DOWNLOAD == propertiesSetData[prop].propid || 'downloadAttachments' == propertiesSetData[prop].propid) &&
                                    		propertiesSetData[prop].value != SystemProperties.getProperty(propertiesSetData[prop].propid)) {
                                    	continue;
                                    }
                                    
                                    if (('providerUrl' == propertiesSetData[prop].propid)  || ('provider' == propertiesSetData[prop].propid) ) {
                                    	continue;
                                    }
                                    
                                    SystemProperties.setProperty(propertiesSetData[prop].propid, propertiesSetData[prop].value, true);
                                }

                                Logger.log('End Refresh of System data for application ' + appName);
                            }
                            //Since we have dependences of anywhereproperties value weneed to recovery it before load resource configurations 
                            var anywhereResValMeta = ResourceContext.getResourceMetadata("anywhereResVal");
                            var anywhereResValQueryBase = '';

                            if (anywhereResValMeta) {
                                anywhereResValQueryBase = Object.keys(anywhereResValMeta.queryBases)[0];
                            }

                            var querybase_local = null;
                            ModelService.allCached("anywhereResVal", anywhereResValQueryBase, 1000).then(function(anywhereResValSet_local) {
                                var anywhereResValsetFilter_local = anywhereResValSet_local.filter("$1[appName] && $2[groupName]", appKeys, groupKeys)
                                querybase_local = self._getQuerybases(anywhereResValsetFilter_local.data);
                                

                                //only query fro resource configuration if load resources value.
                                
                            }).always(function(){
                            	var resMeta = ResourceContext.getResourceMetadata("anywhereResVal");
                            	resMeta.setWhereClause(resMeta.getField('appName').remoteName + "=%22"+ appName +"%22%20and%20spi:queryid=%22*%22");
                            	ResourceContext.putResourceMetadata(resMeta);
                            	
                                ModelService.all("anywhereResVal", anywhereResValQueryBase, 1000, accessStartegy).then(function(anywhereResValSet) {
                                    if (anywhereResValSet.count() > 0) {
                                        var anywhereResValSetFiltered = anywhereResValSet.filter("$1[appName] && $2[groupName]", appKeys, groupKeys);

                                        Logger.log('Refresh of System data for application ' + appName);
                                        var propertiesSetData = self._getAssociatedQuerybases(anywhereResValSetFiltered.data, groupKeys);
                                        
                                        if(Object.keys(querybase_local).length > 0)
                                        {
                                        	var querybase_server = self._getQuerybases(propertiesSetData);
                                        	var resourceStack = self._getResourceStack(querybase_local, querybase_server);
                                            var resource_based_queries_diff = self._getQueryChangesBasedOnResource(querybase_local, querybase_server, resourceStack);

                                            //var querybase_diff = self._subtract(querybase_local, querybase_server);
                                            //var resource_names = [];
                                        
                                           for (var res in resource_based_queries_diff)
                                           {
                                            	if(resource_based_queries_diff[res].type == 'LOOKUP' && resource_based_queries_diff[res].queries.length > 0)
                                            	{
                                            		SystemProperties.setProperty(PlatformConstants.META_DATA_UPDATED, true, true);
                                            		
                                            	}

                                            	var querybase_diff = resource_based_queries_diff[res].queries;
                                            	 var updatesRec = ResourceContext.getResourceMetadata(resource_based_queries_diff[res]['resource'].resourceId);
                                            	for (query in querybase_diff)
                                            	{
                                            		
                                                	PersistenceManager.removeQuerybase(updatesRec, querybase_diff[query]);

                                            	}
                                            }
                                        }

                                        for (var prop = 0, resLen = propertiesSetData.length; prop < resLen; prop++) {
                                            var toPop = [0];
                                            var curResource = propertiesSetData[0].resourceId;

                                            //get all entries for the same resource
                                            for (var i = 1, resLenAux = propertiesSetData.length; i < resLenAux; i++) {
                                                if (propertiesSetData[i].resourceId == curResource) {
                                                    toPop.push(i);
                                                }

                                            }

                                            Logger.trace('Resource : ' + propertiesSetData[prop].resourceId + " Query " + propertiesSetData[prop].query);
                                            //get the resource metadata to be updated
                                            var updatesRec = ResourceContext.getResourceMetadata(propertiesSetData[prop].resourceId);

                                            //Check for null in case the admin app has a resource defined that no longer exists in the app.xml
                                            if (updatesRec) {
	                                            //recovery existing URI to built new queries
	                                            var queryKey = Object.keys(updatesRec.queryBases);
	                                            var existingQueryUri = updatesRec.queryBases[queryKey[0]];
	
	                                            if (existingQueryUri.indexOf('?') > 0) {
	                                                existingQueryUri = existingQueryUri.substring(0, existingQueryUri.indexOf('?'));
	                                            }
	
	
	                                            //build  queries for resource
	                                            var newQueries = [];
	                                            for (var i in toPop) {
	                                                var finalQuery = existingQueryUri + "?savedQuery=" + propertiesSetData[toPop[i]].query;
	                                                var tempQueries = "";
	                                                if (!propertiesSetData[toPop[i]].queryDescription) {
														tempQueries = { name: propertiesSetData[toPop[i]].query, queryString: finalQuery};
													}else{
														tempQueries = { name: propertiesSetData[toPop[i]].query, queryString: finalQuery,queryLabel: propertiesSetData[toPop[i]].queryDescription};
													}
													if(i == 0 && propertiesSetData[toPop[i]].type != 'TRANSEC'){
														tempQueries['defaultForSearch'] = true;
													}
	
	                                                newQueries.push(tempQueries);
	                                            }
	                                            
	                                            if(propertiesSetData[toPop[0]].type == 'TRANSEC' ){
	                                            	var currentDefaultQuery = updatesRec.queryBaseForSearch;
	                                            	//var currentDefaultQueryVal = updatesRec.queryBases[currentDefaultQuery];
	                                            	for(i in updatesRec.queryBases){
	                                            		if(updatesRec.queryBases[i] == currentDefaultQuery){
	                                            			tempQueries = { name: i, queryString: currentDefaultQuery, defaultForSearch: true};
	        												newQueries.push(tempQueries);
	                                            		}
	                                            	}
													
												}
	
	                                            /*Check if was defined query base in admin app before apply it to resource
											      if no query was defined for resource at admin app we use the one that incoming from app.xml*/
	                                            if (propertiesSetData[prop].query) {
	
	                                                //clean and set new queries
	                                                updatesRec.queryBases = {};
	                                                //clean query label
	                                                updatesRec.queryBasesLabel = [];
	                                                //set the admin defined query base
	                                                updatesRec.setQueryBases(newQueries);
	                                                /*based on definition if we are setting querie base defined at admin app.
													we remove the existing oslc where clause defined for resource att app.xml*/
	                                                updatesRec.setWhereClause(null);
	                                                //put the updated resource at resources context
	                                                ResourceContext.putResourceMetadata(updatesRec);
	
	                                            }
	
	                                            //remove resources that query as set
	                                            for (var i = toPop.length - 1; i >= 0; i--) {
	
	                                                propertiesSetData.splice(toPop[i], 1);
	                                            }
	                                            
	                                            prop = -1;
	                                            resLen = propertiesSetData.length;
	                                            /*}*/
	                                        }
	
	                                    }
                                    }
                                    deferred.resolve();
                                }).otherwise(function(e) {
                                    //The download fail because resource does not exist at server side, 
                                    //so we just set the time out for the last time that we got when downloading user info
                                    Logger.log('No anywhereResValSet found ');
                                    SystemProperties.setProperty("si.device.connectivity.lasttimeout", lastTimeout, true);
                                    deferred.resolve();

                                });
                            });
                        }).otherwise(function(e) {
                            //The download fail because resource does not exist at server side, 
                            //so we just set the time out for the last time that we got when downloading user info
                            Logger.log('No adim properties found ');
                            SystemProperties.setProperty("si.device.connectivity.lasttimeout", lastTimeout, true);
                            deferred.resolve();

                        });
                }).otherwise(function(e) {
                    Logger.log('Error loading pending transactions ' + e);
                });
            },


            _getAssociatedQuerybases: function(dataset, user_group) {

                var sequencing_enabled = false;
                var out_filtered_dataset = {}; //{sequence: dataobject}
                var return_filtered_set = [];
                
                //loop through dataset
                for (var cntr in dataset) {

                    var data = dataset[cntr];

                    //Skip if user does not belong to the same group.
                    if (user_group[data.groupName]) {
                        if (data.sequence == null) {

                            return_filtered_set.push(data);

                        } else {
                           sequencing_enabled = true;
                            if(out_filtered_dataset[data.sequence]){
                            	
                            	out_filtered_dataset[data.sequence].push(data);
                            	
                            }else{
                            	
                            	out_filtered_dataset[data.sequence] = [data];
                            	
                            }
                        }
                    }
                }

                if (sequencing_enabled) {
                    var sortedKeys = Object.keys(out_filtered_dataset).sort();
                    for (key in sortedKeys) {
                    	var item_list = out_filtered_dataset[sortedKeys[key]]
                    	if(item_list.length > 1)
                    	{
                    		for (var item in item_list)
                    			return_filtered_set.push(item_list[item]);
                    			
                    	}
                    	else
                    		return_filtered_set.push(item_list[0]);
                    }
                }
                
                return return_filtered_set;

            },

            isBlindCountQuery : function(querybase,appname,resourceid) {
            	var blindcount = false;
            	var deferred = new Deferred();
            	            	
             	ModelService.allCached("anywhereResVal").then(function(set) {
                    var anywhereResValSet = set.find("query==$1 && appName==$2 && resourceId==$3", querybase, appname, resourceid);
                    if(anywhereResValSet && anywhereResValSet.length>0){
            			blindcount = anywhereResValSet[0].get('blindCount');
            		}
                    deferred.resolve(blindcount);
            	});
            	
            	return deferred.promise;
            },
            
            _getResourceStack: function(local_data, server_data){

				var resourceDict = {};
				var resourceStack = []
            	for (var i in local_data){
            		var resource_id = local_data[i]['resource'].resourceId;
            		if (resourceDict[resource_id] == undefined)
            		{
            			resourceDict[resource_id] = true;
            			resourceStack.push(local_data[i]);

            		}
            	}

            	for (var i in server_data){
            		var resource_id = server_data[i]['resource'].resourceId;
            		if (resourceDict[resource_id] == undefined)
            		{
            			resourceDict[resource_id] = true;
            			resourceStack.push(server_data[i]);

            		}
            	}

            	return resourceStack;
            },
            
            //packages querybases based on transaction type
            _getQuerybases: function(dataset) {

                var resource_based_query_names = {};
				
                for (var i in dataset){
					if (resource_based_query_names[dataset[i].resourceId] == undefined)
                        resource_based_query_names[dataset[i].resourceId] = {'queries' : [dataset[i].query], 'tran_type': dataset[i].type, 'resource': dataset[i]};
                    else
                        resource_based_query_names[dataset[i].resourceId]['queries'].push(dataset[i].query)
   
				}
                //Return DS has format {workOrder: [{queries:[q1,q2,q3], tran_type:transec}]
                //                      additionalasset: [{queries:[q1,q2,q3], tran_type:additionaldata}]}
				return resource_based_query_names;
            },

            _getQueryChangesBasedOnResource: function(local_data, server_data, resourceStack){
                
        		var resource_based_query_diff =[];
                for (var resource in resourceStack){
                    var local_queries = [];
                    var server_queries = []; 
                	var resource_id = resourceStack[resource]['resource'].resourceId;
                	if(local_data[resource_id])
                		local_queries =  local_data[resource_id]['queries'];//format: [{queries:[q1,q2,q3], tran_type:transec}]
                    
                	if(server_data[resource_id])
                		server_queries =  server_data[resource_id]['queries'];
                    
                	var query_diff = [];
                    query_diff = this._subtract(local_queries, server_queries);

                    resource_based_query_diff.push({'queries': query_diff, type: resourceStack[resource]['resource'].type, 'resource': resourceStack[resource]['resource']});
                }

                return resource_based_query_diff;
            },

            _subtract: function(dataset_x, dataset_y) {

            	var temp = [];
            	var out_querybase = [];
            	var last_query_processed= '';

            	for (data in dataset_x)
            		temp.push({'queryname':dataset_x[data], 'sink': 'x'});
            	for (data in dataset_y) 
            		temp.push({'queryname':dataset_y[data], 'sink': 'y'});

            	Logger.trace("The temp built 1: " + JSON.stringify(temp));

            	temp.sort(function(a,b) {
            		return (a.queryname > b.queryname) ? 1 : ((b.queryname > a.queryname) ? -1 : 0)
            	});

            	for (var  i = 0; i < temp.length -1 ; i++){
            		//discard if same sink
            		if (temp[i].sink == temp[i+1].sink && temp[i].queryname == temp[i+1].queryname)
            		{
            			last_query_processed = temp[i].queryname;
            			continue;
            		}
					else if(temp[i].queryname == temp[i+1].queryname)//discard if quernames equal regardless of sink
					{
						last_query_processed = temp[i].queryname;
						continue;
					}
					else if(temp[i].queryname != last_query_processed) //difference found-> sink different, queyname different and query belongs to any sink 
					{
						last_query_processed = temp[i].queryname;
						out_querybase.push(temp[i].queryname);
					}

            	};

            	if(temp[temp.length-1] && temp[temp.length-1].queryname != last_query_processed)
            		out_querybase.push(temp[temp.length-1].queryname);

            	Logger.trace('The return querybase is' + out_querybase);
            	return out_querybase;

            },

            _cleanProperties: function(in_property_set) {
                var out_property_set = [];

                var tracker_obj = {};

                for (var prop in in_property_set) {
                    if (typeof tracker_obj[in_property_set[prop].propid] == 'undefined') {
                        tracker_obj[in_property_set[prop].propid] = [in_property_set[prop].value, in_property_set[prop]];

                    } else //Property already exist and second property of same name was found
                    {

                        //Null value found. Overwrite with new value
                        if (tracker_obj[in_property_set[prop].propid][0] == null)
                            tracker_obj[in_property_set[prop].propid] = [in_property_set[prop].value, in_property_set[prop]];

                        else { //More than one value found excluding null
                            //Ignore if the incoming property value is null
                            if (in_property_set[prop].value == null)
                                continue;

                            Logger.log('Two or more property value found for the property: ' + in_property_set[prop].propid + ' with value ' + in_property_set[prop].value);
                            tracker_obj[in_property_set[prop].propid] = [in_property_set[prop].value, in_property_set[prop]];
                        }


                    };
                }

                for (var obj in tracker_obj)
                    out_property_set.push(tracker_obj[obj][1]);

                return out_property_set;

            },
            
            _setMapProviderProperties : function (in_property_set) {
            	
                var mapProviderGroupEntries = {};
                
                //group by groupNmae
                
                var lastGroupNmae = "no_group_default" ;

                for (var prop in in_property_set) {
                	
                	if (in_property_set[prop].propid == "provider" || in_property_set[prop].propid == "providerUrl") {

                		var groupMapPropertry ; 
                		var groupName = "" ;
                     	
                     	if (in_property_set[prop].groupName && in_property_set[prop].groupName != "") {
                     		groupName = in_property_set[prop].groupName ;
                     		lastGroupNmae = groupName ;
                     	} else {
                     		groupName = "no_group_default" ;
                     	}
                     		
                 		if (mapProviderGroupEntries[groupName]) {
                 			groupMapPropertry = mapProviderGroupEntries[groupName];
                 		} else {
                 			groupMapPropertry = {};
                 		}
                     		
                 		groupMapPropertry[in_property_set[prop].propid] = in_property_set[prop].value;	
                     	
                     	mapProviderGroupEntries[groupName] = groupMapPropertry;
                    } 	
                }
                
                if (mapProviderGroupEntries[lastGroupNmae]) {
                	var mapProviderSet = mapProviderGroupEntries[lastGroupNmae] ;
                	
                	if (mapProviderSet["provider"]) {
                		SystemProperties.setProperty("provider", mapProviderSet["provider"], true);
                	} 
                	
                	if (mapProviderSet["providerUrl"]) {
                		SystemProperties.setProperty("providerUrl", mapProviderSet["providerUrl"], true);
                	} else {
                		SystemProperties.setProperty("providerUrl", null, true);
                	}
                }
                
            },

        };
    });
