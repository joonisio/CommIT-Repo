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

define("application/handlers/CopyPlansToActualsHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
		  "dojo/_base/lang",
		  "dojo/dom-class",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/comm/CommunicationManager",
	     "application/business/WorkOrderObject",
	     "platform/translation/SynonymDomain",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "application/handlers/CommonHandler",
	     "application/business/FieldUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/auth/UserManager",
	     "platform/util/PlatformConstants",
	     "application/business/WpEditSettings",
	     "platform/util/AsyncAwareMixin",
	     "dojo/Deferred",
	     "platform/logging/Logger",
	     "platform/util/DateTimeUtil",
	     "platform/store/_ResourceMetadataContext",
	     "dojo/number",
	     "application/business/WorkOrderStatusHandler",
	     "platform/util/AsyncAwareMixin",
	     "dojo/promise/all"
	     ],
function(declare, arrayUtil, lang, domClass, ApplicationHandlerBase, CommunicationManager, Workorder, SynonymDomain, ModelService, MessageService, CommonHandler, FieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, UserManager, PlatformConstants, WpEditSettings, AsyncAwareMixin,Deferred, Logger, DateTimeUtil, ResourceMetaData, NumberUtil, WorkOrderStatusHandler, AsyncAwareMixin, all) {
	var initQuantity = false;
	return declare( [ApplicationHandlerBase,AsyncAwareMixin], {
		/*
		 * Called by UI action to setup in memory resources for Copy Plan to Actual view.
		 */
/**@memberOf application.handlers.CopyPlansToActualsHandler */
		copyPlansToActuals: function(eventContext){
						
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			//var plannedMaterialListSet= currWO.getLoadedModelDataSetOrNull('materiallist');
			//var actualMaterialListSet= currWO.getLoadedModelDataSetOrNull('actualmateriallist');
			var deferred = new Deferred();
			
			var plannedToolListSetPromise = currWO.getModelDataSet('toollist',true);
			var actualToolListSetPromise = currWO.getModelDataSet('actualtoollist',true);					
			var laborAssignmentListSetPromise = currWO.getModelDataSet('assignmentlist',true);
			var actualLaborAssignmentListSetPromise = currWO.getModelDataSet('actuallaborlist',true);
			var invreserveListSetPromise = currWO.getModelDataSet('invreserveList',true);
			
			//initialize complex attributes related to workorder
			var complexPromises = all([plannedToolListSetPromise, actualToolListSetPromise, laborAssignmentListSetPromise, actualLaborAssignmentListSetPromise, invreserveListSetPromise ]);
			var self = this;
			complexPromises.then(function(){
				
				var plannedToolListSet = currWO.toollist;
				var actualToolListSet = currWO.actualtoollist;					
				var laborAssignmentListSet = currWO.assignmentlist;
				var actualLaborAssignmentListSet = currWO.actuallaborlist;
				
				//this.plansSetup(eventContext, plannedMaterialListSet, actualMaterialListSet, 'plannedMaterial');
				self.plansSetup(eventContext, plannedToolListSet, actualToolListSet, 'plannedTool');
				self.plansSetup(eventContext, laborAssignmentListSet, actualLaborAssignmentListSet, 'plannedLabor');
				deferred.resolve();
			});

			return deferred.promise;
		},
		
		isRotating : function(item,itemsetid,eventContext){
			var additionalitem = this.application.getResource("additionalitem");
			var rotatingItem = additionalitem.find('itemnum == $1 && itemsetid == $2 && rotating == $3',item, itemsetid, true);
			if(rotatingItem.length == 0){
				//not rotating
				return false;
			} else {
				return true;
			}
		},
		
		/*
		 * Show/Hide Copy Plans to Actuals Menu
		 */
		enableDisableMenu : function(eventContext){	
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var promise = this.copyPlansToActuals(eventContext);
			var self = this;
			promise.then(function(){
				//filter out rotating items
				var plannedMaterialSet = currWO.invreserveList;
				plannedMaterialSet.filter('rotating == false  && localqty > 0');
				
				//filter out rotating tools
				var plannedToolSet = self.application.getResource("plannedTool");
				plannedToolSet.filter('rotating == false');
				
				var plannedLaborSet = self.application.getResource("plannedLabor");
				initQuantity=false; //reset flag to show count
				
				var currentWOStatus= WorkOrderStatusHandler.getInstance().toInternalState(currWO.get("status"));
				
				//if planned records do not exist or status not in (APPR,INPRG, COMP, WSCH<WMATL) then hide menu
				if((plannedMaterialSet.count()>0 || plannedToolSet.count()>0 || plannedLaborSet.count()>0) &&
				(currentWOStatus== "APPR" || currentWOStatus== "INPRG" || currentWOStatus== "COMP" || currentWOStatus== "WSCH" || currentWOStatus== "WMATL"))	{
					eventContext.setDisplay(true);
				} else {
					eventContext.setDisplay(false);
				}
			});
		},
		
		/*
		 * Displays the PlannedActualList for Items/Tools/Labor
		 */
		executeCopyPlansToActuals : function(eventContext){
			eventContext.application.showBusy();
			var self = this;
			var promise = this.copyPlansToActuals(eventContext);
			
			promise.then(function(){				
				//synchronize record / get updated value from server
				var wo = eventContext.getCurrentRecord();				
				
				//filter out rotating tools
				var plannedMaterialSet = wo.invreserveList;
				plannedMaterialSet.filter('rotating == false && localqty > 0');
				
				//default material item checkbox to true
				arrayUtil.forEach(plannedMaterialSet.data, function(plannedMaterialRec){
					plannedMaterialRec.materialCB = true;
				});
				
				plannedMaterialSet.resourceID = 'invreserveResource';
				eventContext.application.addResource(plannedMaterialSet);
				
				//filter out rotating tools
				var plannedToolSet = self.application.getResource("plannedTool");
				plannedToolSet.filter('rotating == false');
				
				eventContext.application.hideBusy();
				eventContext.ui.show('WorkExecution.PlannedActualList');
				
		/*
				ModelService.childrenOf(wo, 'invreserveList').then(function(plannedMaterialSet){
					plannedMaterialSet.filter('rotating == false');
					arrayUtil.forEach(plannedMaterialSet.data, function(plannedMaterialRec){
						plannedMaterialRec.displayqty = plannedMaterialRec.reservedqty;
					});
					
					plannedMaterialSet.resourceID = 'invreserveResource';
					eventContext.application.addResource(plannedMaterialSet);
					
					//filter out rotating tools
					var plannedToolSet = self.application.getResource("plannedTool");
					plannedToolSet.filter('rotating == false');
					
					eventContext.application.hideBusy();
					//eventContext.ui.getCurrentViewControl().refreshLists();
					eventContext.ui.show('WorkExecution.PlannedActualList');
				});
		*/
			});
		},

		
		/*
		 * Compares what has been consumed in Actuals vs what is remaining in plans.
		 * In-Memory resources are created.
		 */
		plansSetup : function(eventContext, planSet, actualSet, resourceName){
			
			//create Material Maps
			var plannedMap = this.materialMap(eventContext,planSet);
			var actualMap = this.materialMap(eventContext,actualSet);
			var compareMap = {};
			var self = this;
			
			/*if(resourceName=='plannedMaterial'){
				//compare Materials to generate remaining materials to consume
				compareMap = this.compareMaterial(eventContext,plannedMap,actualMap);	
			} else*/ 
				
			if(resourceName=='plannedTool'){
				compareMap = this.compareToolHours(eventContext,plannedMap,actualMap);
			} else if(resourceName=='plannedLabor'){
				compareMap = this.compareLaborHours(eventContext,plannedMap,actualMap);
			}

			
			//create in memory records
			ModelService.empty(resourceName).then(function(set){
				var plan =  null;			
				
				for (var key in compareMap) {
					
					/*
					if (set.name=='plannedMaterial' && compareMap[key].quantity>0){
						plan = set.createNewRecord();
						plan.set('materialCB',true);
						plan.set('item',compareMap[key].item);
						plan.set('itemdesc',compareMap[key].itemdesc);
						plan.set('availableqty',compareMap[key].quantity);
						plan.set('itemsetid',compareMap[key].itemsetid);
						plan.set('siteid',compareMap[key].siteid);
						plan.set('storeroom',compareMap[key].storeroom);
						plan.set('taskid',compareMap[key].taskid);
					} else 
					*/	
						
					if (set.name=='plannedTool' && compareMap[key].hours>0){
						
						if (self.isRotating(compareMap[key].tool,compareMap[key].itemsetid, eventContext)){
							//plan.set('rotating',true);
							return;
						} else {
							plan = set.createNewRecord();
							plan.set('rotating',false);
						}
						
						plan.set('toolCB',true);
						plan.set('tool',compareMap[key].tool);
						plan.set('tooldesc',compareMap[key].tooldesc);
						plan.set('hours',compareMap[key].hours);
						plan.set('itemsetid',compareMap[key].itemsetid);
						plan.set('taskid',compareMap[key].taskid);
						plan.set('toolanddescription',compareMap[key].toolanddescription);
						plan.set('linetype',compareMap[key].linetype);
						
					} else if (set.name=='plannedLabor' && compareMap[key].hours>0){
						plan = set.createNewRecord(); 
						plan.set('laborCB',true);
						plan.set('laborcode',compareMap[key].laborcode);
						plan.set('craft',compareMap[key].craft);
						plan.set('skilllevel',compareMap[key].skilllevel);
						plan.set('hours',compareMap[key].hours);
						plan.set('taskid',compareMap[key].taskid);
					}
				}
										
				set.resourceID = resourceName;
				eventContext.application.addResource(set);
			});
		},
		
		/*
		 * The cancel/back button cleans up and hides current view.
		 */
		discardCreateActuals: function(eventContext){
			initQuantity = false;
			var handler = eventContext.application['application.handlers.CopyPlansToActualsHandler'];	
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
			handler.enableDisableMenu(eventContext);
		},
		
		/*
		 * When Create Record is selected, this function finds all records that are checked 
		 * and creates actual records from the plans.
		 */
		createActuals: function(eventContext){
			
			eventContext.application.showBusy();

			var plannedMaterialSet = this.application.getResource("invreserveResource");
			var plannedToolSet = this.application.getResource("plannedTool");
			var plannedLaborSet = this.application.getResource("plannedLabor");
			var woSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var currWO = woSet.getCurrentRecord();		
			
			//create actuals materials
			if(plannedMaterialSet.count()>0){
				var actualMaterialList =currWO.getLoadedModelDataSetOrNull('actualmateriallist');
				arrayUtil.forEach(plannedMaterialSet.data, function(plannedMaterialRec){
					if(plannedMaterialRec.materialCB){
						var actualMaterialRecord= actualMaterialList.createNewRecord();
						actualMaterialRecord.set('itemnum',plannedMaterialRec.item);
						actualMaterialRecord.set('itemdesc',plannedMaterialRec.itemdesc);
						actualMaterialRecord.set('itemsetid',plannedMaterialRec.itemsetid);
						actualMaterialRecord.set('quantity',plannedMaterialRec.displayqty);
						actualMaterialRecord.set('storeroom',plannedMaterialRec.storeroom);
						actualMaterialRecord.set('siteid',plannedMaterialRec.siteid);
						actualMaterialRecord.set('requestnum',plannedMaterialRec.requestnum);
						actualMaterialRecord.set('rotassetnum',plannedMaterialRec.localrotassetnum);
						actualMaterialRecord.set('actualstaskid',plannedMaterialRec.taskid);
						
						if(plannedMaterialRec.taskid && plannedMaterialRec.taskid!=''){
							actualMaterialRecord.set('enteredastask',true);
						}
						
						plannedMaterialRec.set('localqty',plannedMaterialRec.localqty - plannedMaterialRec.displayqty);
						
//						CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){		
//							if (!hasConnectivity){
//								plannedMaterialRec.set('localqty',plannedMaterialRec.localqty - plannedMaterialRec.displayqty);
//							}
//						});
					}
				});
			}
			
			//create actual tools
			if(plannedToolSet.count()>0){
				var actualToolList =currWO.getLoadedModelDataSetOrNull('actualtoollist');
				arrayUtil.forEach(plannedToolSet.data, function(plannedToolRec){
					if(plannedToolRec.toolCB){
						var actualToolRecord= actualToolList.createNewRecord();
						actualToolRecord.set('tool',plannedToolRec.tool);
						actualToolRecord.set('itemsetid',plannedToolRec.itemsetid);
						actualToolRecord.set('toolhrs',plannedToolRec.hours);
						actualToolRecord.set('tooldesc',plannedToolRec.tooldesc);
						actualToolRecord.set('actualstaskid',plannedToolRec.taskid);
						actualToolRecord.set('rotassetnum',plannedToolRec.localrotassetnum);
					}
				});
			}
			
			//create actual labors
			if(plannedLaborSet.count()>0){
				var actualLaborList =currWO.getLoadedModelDataSetOrNull('actuallaborlist');
				arrayUtil.forEach(plannedLaborSet.data, function(plannedLaborRec){
					if(plannedLaborRec.laborCB){
						var actualLaborRecord= actualLaborList.createNewRecord();
						actualLaborRecord.setDateValue("startdate", DateTimeUtil.fromDateTimeToDate(eventContext.application.getCurrentDateTime()));
						actualLaborRecord.set('laborcode',plannedLaborRec.laborcode);
						actualLaborRecord.set('craft',plannedLaborRec.craft);
						actualLaborRecord.set('skilllevel',plannedLaborRec.skilllevel);
						actualLaborRecord.set('actuallaborhours',plannedLaborRec.hours);
						actualLaborRecord.set('actualstaskid',plannedLaborRec.taskid);
					}
				});
			}
			
			ModelService.save(woSet).then(function(){
				initQuantity = false;
				eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);				
			});	
		},
					
		sumActualMaterials : function(eventContext){
			var currWO = eventContext.getCurrentRecord().getParent();
			var invreserve = eventContext.getCurrentRecord();
			var requestnum = invreserve.get('requestnum');
			var siteid = invreserve.get('siteid');
			var actualMaterialList =currWO.getLoadedModelDataSetOrNull('actualmateriallist');
			var matuseset = actualMaterialList.find('requestnum == $1 && siteid == $2',requestnum, siteid);
			var totalQTY = 0;
			arrayUtil.forEach(matuseset, function(materialRecord){
				totalQTY = 	totalQTY + materialRecord.quantity;			
			});
			
			return totalQTY;
		},
		
		/*
		 * Verify value is greater than zero.
		 */
		validateMaterialQty : function(eventContext){
			var invreserve = eventContext.getCurrentRecord();
			var displayQty = invreserve.getPendingOrOriginalValue('displayqty');
			if ((NumberUtil.parse(displayQty) <= 0)) {
				throw new PlatformRuntimeException('materialQuantityPositive',[displayQty]);
			}
		},
		
		/*
		 * Initialize local material quanities
		 */
		updateLocalQty : function(eventContext){
			//var woSet = eventContext.application.getResource('workOrder');
			if(!initQuantity){
				initQuantity=true;
			}
			//ModelService.save(woSet);
		},
		
		/*
		 * Called once when wodetail is initialized
		 */
		initializeInvreserveMatQty : function (eventContext){
			var self = this;
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			if(eventContext.ui.movingBack || eventContext.ui.getCurrentViewControl().id == 'WorkExecution.WorkDetailView'){
				self.enableDisableMenu(eventContext);
			} else {
				ModelService.childrenOf(currWO, 'invreserveList').then(function(invreserveSet){
					CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
						if (hasConnectivity){
							arrayUtil.forEach(invreserveSet.data, function(invreserve){
								invreserve.localqty = invreserve.availableqty;
							});
						} else {
							arrayUtil.forEach(invreserveSet.data, function(invreserve){
								if (!invreserve.localqty){
									invreserve.localqty = invreserve.availableqty;
								}
							});
						}
						self.enableDisableMenu(eventContext);
					});
				});				
			}
		},
		
		/*
		 * Initialize the material quantities when displaying the Create Actuals view
		 */
		initDisplayQty : function(eventContext){	
			
			var invreserve = eventContext.getCurrentRecord();
			var localQty = invreserve.get('localqty');
			invreserve.set('displayqty', localQty);
			
//			CommunicationManager.checkConnectivityAvailable().then(function(hasConnectivity){
//				var invreserve = eventContext.getCurrentRecord();
//				var availableQty = invreserve.get('availableqty');
//				var localQty = invreserve.get('localqty');
//				
//				invreserve.set('displayqty', localQty);
				
//				if (hasConnectivity){
//					if(!initQuantity){
//						invreserve.set('displayqty', availableQty);
//						invreserve.set('localqty', availableQty);
//					}
//				} else {
//					if(!initQuantity){
//						invreserve.set('displayqty', localQty);
//					}
//				}
//			});
					
		},
		
		
		materialMap : function(eventContext, materialListSet){
			var materialMap = {};
			var self = this;
			
			arrayUtil.forEach(materialListSet.data, function(materialRecord){
				var materialObject = JSON.parse(JSON.stringify(materialRecord));
				var id = '';
				var itemsetid = materialRecord.get('itemsetid');
				var storeroom = materialRecord.get('storeroom');
				var siteid = materialRecord.get('siteid');
				var materialKey='';
				
				//skip if rotating
				if(materialRecord.getOwner().name=='plannedToolResource' || materialRecord.getOwner().name=='actualToolResource'){
					id=materialRecord.get('tool');
					var isRotating = self.isRotating(id,itemsetid,eventContext);
					if (isRotating)
						return;
				} else if(materialRecord.getOwner().name=='plannedMaterialResource' || materialRecord.getOwner().name=='actualMaterialResource'){
					id = materialRecord.get('itemnum');
					var isRotating = self.isRotating(id,itemsetid,eventContext);
					if (isRotating)
						return;
				}
				
				//the item/itemnum variable names are defined differently in the different objects. 
				if(materialRecord.getOwner().name=='actualMaterialResource'){
					var taskid = materialRecord.get('actualstaskid');
					id=materialRecord.get('itemnum');
					materialKey = taskid+"|"+id+"|"+storeroom+"|"+itemsetid+"|"+siteid;
				} else if(materialRecord.getOwner().name=='plannedMaterialResource'){
					id = materialRecord.get('item');
					var taskid = materialRecord.get('taskid');
					materialKey = taskid+"|"+id+"|"+storeroom+"|"+itemsetid+"|"+siteid;
				} else if(materialRecord.getOwner().name=='plannedToolResource'){
					id = materialRecord.get('tool');
					var taskid = materialRecord.get('taskid');
					materialKey = taskid+"|"+id+"|"+itemsetid;
				}  else if(materialRecord.getOwner().name=='actualToolResource'){
					id = materialRecord.get('tool');
					var taskid = materialRecord.get('actualstaskid');
					materialKey = taskid+"|"+id+"|"+itemsetid;
				} else if(materialRecord.getOwner().name=='assignmentResource'|| materialRecord.getOwner().name=='actualLaborResource'){
					var craft = materialRecord.get('craft');
					var laborcode = materialRecord.get('laborcode');
					var skilllevel = materialRecord.get('skilllevel');
					var taskid = '';
					if (materialRecord.getOwner().name=='actualLaborResource'){
						taskid = materialRecord.get('actualstaskid');
					} else {
						taskid = materialRecord.get('taskid');
					}
					materialKey = taskid+"|"+craft+"|"+laborcode+"|"+skilllevel;
				}
				
				if(materialRecord.getOwner().name=='plannedToolResource' || materialRecord.getOwner().name=='actualToolResource'){
					var hrs = 0;
					if (materialRecord.getOwner().name=='actualToolResource'){
						hrs = materialRecord.get('toolhrs');
					} else {
						hrs = materialRecord.get('hours');
					}
					
					if (materialKey in materialMap){
						var gethrs = materialMap[materialKey].hours;
						var addHrs = hrs + gethrs;
						materialObject.hours = addHrs;
						materialMap[materialKey]=materialObject;
					} else {
						materialObject.hours = hrs;
						materialMap[materialKey]=materialObject;
					};
				} else if(materialRecord.getOwner().name=='assignmentResource'|| materialRecord.getOwner().name=='actualLaborResource'){
					
					//only execute if laborcode exists for assignment
					if(materialRecord.get('laborcode') && materialRecord.get('laborcode')!=''){
						var hrs = 0;
						if (materialRecord.getOwner().name=='actualLaborResource'){
							hrs = materialRecord.get('regularhours');
						} else {
							hrs = materialRecord.get('laborhours');
						}

						if (materialKey in materialMap){
							var gethrs = materialMap[materialKey].hours;
							var addHrs = hrs + gethrs;
							materialObject.hours = addHrs;
							materialMap[materialKey]=materialObject;
						} else {
							materialObject.hours = hrs;
							materialMap[materialKey]=materialObject;
						};	
					}
				
				} else {
					var qty = materialRecord.get('quantity');
					if (materialKey in materialMap){
						var getQty = materialMap[materialKey].quantity;
						var addQty = qty + getQty;
						materialObject.quantity = addQty;
						materialMap[materialKey]=materialObject;
					} else {
						materialObject.quantity = qty;
						materialMap[materialKey]=materialObject;
					};
				}

			});
			
			return materialMap;
		},
		
		compareMaterial : function (eventContext,plannedMaterialMap,actualMaterialMap){
			var availableMaterialMap = {};
			for (var key in plannedMaterialMap) {
			    if(key in actualMaterialMap){
			    	var quant = (plannedMaterialMap[key].quantity - actualMaterialMap[key].quantity);
			    	plannedMaterialMap[key].quantity = quant;
			    	availableMaterialMap[key] = plannedMaterialMap[key];
			    } else {
			    	availableMaterialMap[key] = plannedMaterialMap[key];
			    }
			}
			return availableMaterialMap;
		},
		
		compareToolHours : function (eventContext,plannedMap,actualMap){
			var availableMap = {};
			for (var key in plannedMap) {
			    if(key in actualMap){
			    	var qtyHrs = (plannedMap[key].hours - actualMap[key].hours);
			    	plannedMap[key].hours = qtyHrs;
			    	availableMap[key] = plannedMap[key];
			    } else {
			    	availableMap[key] = plannedMap[key];
			    }
			}
			return availableMap;
		},
		
		compareLaborHours : function (eventContext,plannedMap,actualMap){
			var availableMap = {};
			for (var key in plannedMap) {
			    if(key in actualMap){
			    	var qtyHrs = (plannedMap[key].laborhours - actualMap[key].hours);
			    	plannedMap[key].hours = qtyHrs;
			    	availableMap[key] = plannedMap[key];
			    } else {
			    	availableMap[key] = plannedMap[key];
			    }
			}
			return availableMap;
		},
		
		
		//=============================================================================================
		//= Following section contains functions for Tool Rotating Asset Lookup  and Tool Validation  =
		//=============================================================================================
		filterToolRotatingAssetForLookup : function(eventContext){
			var set = this.application.getResource("plannedTool");
			var rec = set.getCurrentRecord();
			var itemnum = rec.get('tool');	
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var filter = this.buildFilterForRotatingAsset(eventContext, itemnum, siteid, null, null);
			var additionalAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			CommonHandler._clearFilterForResource(eventContext, additionalAsset);
			additionalAsset.lookupFilter = filter;
		},
		
		
		buildFilterForRotatingAsset: function(eventContext, itemnum, siteId, storeroom, assetnum){
			var filter = [{"parent": "null"}, {"siteid": siteId}, {"itemnumnotnull": true}];
			
			if(storeroom) { filter.push({"location": storeroom}); } 			
			if(itemnum)   { filter.push({"itemnum": itemnum}); }			
			if(assetnum)  { filter.push({"assetnum": assetnum}); }
		
			var domainitemtype = CommonHandler._getAdditionalResource(eventContext,'domainitemtype');
			domainitemtype.clearFilterAndSort();
			var externalOnes = null;
			//it was introduced to avloid the freeze of UI when synonymDomain was not loaded yet 
			try{
				externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemtype, 'TOOL'));
			} catch (e) {
				// TODO: handle exception
			}
			arrayUtil.forEach(externalOnes, function(aValue){
				filter.push({"itemtype": aValue});
			});
			
			var statuses = this.selectableAssetStatusesAsFilter(eventContext);
			return arrayUtil.map(statuses, function(anStatus){
				var result = lang.mixin({}, anStatus);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});		
		},
		
		selectableAssetStatusesAsFilter: function(eventContext){
			var domainitemstatus = CommonHandler._getAdditionalResource(eventContext,"domainAssetstatus");
			// 115525
			var internalStatuses = ["OPERATING", "NOT READY"];
			var filter = [];
			arrayUtil.forEach(internalStatuses, function(anStatus){
				CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
				var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemstatus, anStatus));
				arrayUtil.forEach(externalOnes, function(aValue){
					filter.push({"status": aValue});
				});
			});
			CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
			return filter;
		},
		
		asyncValidateToolRotatingAsset: function(eventContext) {
			var currentRecord = this.application.getResource("plannedTool").getCurrentRecord();
			var assetnum = currentRecord.getPendingOrOriginalValue('localrotassetnum');
			
			//defect 113779 - avoid double validation calls
			//currentRecord.set('rotassetnum',assetnum);
			
			if(assetnum){
				var itemnum = currentRecord.get('tool');			
				var siteid = CommonHandler._getWorkorderSiteId(eventContext);
				var filter = this.buildFilterForRotatingAsset(eventContext, itemnum, siteid, null, assetnum);

				var assetPromise = this.asyncGetRotatingAssetPromise(filter);
				this.asyncCompleteValidateRotatingAsset(currentRecord, assetPromise);
			}
		},
		
		asyncGetRotatingAssetPromise: function(filter){
			return ModelService.additionalDataFiltered("additionalasset", filter, true);
		},
		
		asyncCompleteValidateRotatingAsset: function(currentRecord, additionalRotatingAsset) {
			if(additionalRotatingAsset.count() == 0){
				throw new PlatformRuntimeWarning('invalidRotatingAsset');
			}else{
				currentRecord.set("tool", additionalRotatingAsset.getRecordAt(0).get('itemnum'));
			}
		},	
		
		asyncValidateTool : function(eventContext) {
			var set = this.application.getResource("plannedTool");
			var currentToolRecord = set.getCurrentRecord();
			var itemnum = currentToolRecord.get('tool');
									
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var rotatingAssetNumMetaData = currentToolRecord.getRuntimeFieldMetadata('localrotassetnum');						
			if (itemnum) {								
				this.asyncCompleteToolValidation( 
						currentToolRecord, 
						rotatingAssetNumMetaData, 
						this.asyncFilteredTools(eventContext, itemnum));										
		    } 
			else{
				currentToolRecord.setNullValue('tool');
				currentToolRecord.setNullValue('tooldesc');
				currentToolRecord.setNullValue('rotassetnum');
				rotatingAssetNumMetaData.set('required',false);
				rotatingAssetNumMetaData.set('readonly',false);
				rotatingAssetNumMetaData.set('isCodeScannable',true);
			}
			
		},
		
		asyncFilteredTools : function(eventContext, itemnum){			
			var set = this.application.getResource("plannedTool");
			var currentToolRecord = set.getCurrentRecord();
			var itemnum = currentToolRecord.get('tool');
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			var filter = this.buildFilterForTools(eventContext, itemnum, orgid, this.getItemSetIt(eventContext, siteid));
			return this.asyncApplyFilterForTools(filter);
		},
		
		asyncApplyFilterForTools: function(filter){
			return ModelService.additionalDataFiltered("additionaltool", filter, true);
		},
		
		buildFilterForTools: function(eventContext, itemnum, orgId, itemsetid){
			var statuses = this.selectableItemStatusesAsFilter(eventContext);			
			var filter = [{"orgid": orgId}];
			if(itemsetid){
				filter.push({"itemsetid": itemsetid}); 
			}
			if(itemnum){
				filter.push({"itemnum": itemnum});
		    }	
			return arrayUtil.map(statuses, function(anStatus){
				var result = lang.mixin({}, anStatus);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});			
		},
		
		getItemSetIt: function(eventContext, siteId){
			var additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			return CommonHandler._getItemSetIdForSiteId(eventContext,siteId, additionalInventory);					
		},	
		
		asyncCompleteToolValidation: function(currentToolRecord, rotatingAssetNumMetaData, filteredToolList){				
			if(filteredToolList.count() == 0) {
					throw new PlatformRuntimeWarning('invalidTool');
			}else{
				currentToolRecord.set('tool',filteredToolList.getRecordAt(0).get("itemnum"));
				currentToolRecord.set('tooldesc',filteredToolList.getRecordAt(0).get("description"));					
				var isRotatingTool = filteredToolList.getRecordAt(0).get('rotating');					
				if (isRotatingTool) {
				    //set rotassetnum field to required
					//rotatingAssetNumMetaData.set('required',true);
					rotatingAssetNumMetaData.set('readonly',false);
					rotatingAssetNumMetaData.set('isCodeScannable',true);
				} else {
				    //set rotassetnum to read only
					currentToolRecord.setNullValue('localrotassetnum');
					rotatingAssetNumMetaData.set('required',false);
					rotatingAssetNumMetaData.set('readonly',true);
					rotatingAssetNumMetaData.set('isCodeScannable',false);					
				}
			}
		},
		
		//  END SECTION FOR ROTATING TOOL

		//====================================================================================
		//= Following section is used to Material Rotating Asset Lookup and Item Validation  =
		//====================================================================================
		filterItemRotatingAssetForLookup : function(eventContext){		
			// set lookup filter on addtionalInventory
			var additionalRotatingAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			var filter = null;
			this.asyncBuildFilterForRotAsset(eventContext, null).then(function(f) {
				filter = f;
			});
			additionalRotatingAsset.lookupFilter = filter;		
		},
				
		asyncBuildFilterForRotAsset : function(eventContext, assetnum) {
			
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var invreserveListSet= currWO.getLoadedModelDataSetOrNull('invreserveList');
			var currentRecord = invreserveListSet.getCurrentRecord();
			var itemnum = currentRecord.get('item');	
			
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			var storeroom = currentRecord.get("storeroom");
			
			//get linetype
			var plannedMaterialSet= currWO.getLoadedModelDataSetOrNull('materiallist');
			var requestnum = currentRecord.get('requestnum');
			var plannedMaterial = plannedMaterialSet.find('requestnum == $1 && siteid == $2',requestnum, siteid);
			var itemtype = plannedMaterial[0].get("linetype");
			
			var additionalRotatingAsset = CommonHandler._getAdditionalResource(eventContext,'additionalasset');
			CommonHandler._clearFilterForResource(eventContext,additionalRotatingAsset);

			// defect 115525
			var domainAssetstatus = CommonHandler._getAdditionalResource(eventContext,'domainAssetstatus');
			domainAssetstatus.clearFilterAndSort();			
			var statuses = SynonymDomain.resolveToExternal(domainAssetstatus, 'OPERATING');
			domainAssetstatus.clearFilterAndSort();			
			lang.mixin(statuses, SynonymDomain.resolveToExternal(domainAssetstatus, 'NOT READY') || {});
			domainAssetstatus.clearFilterAndSort();
			
			// initial filter on item!=null, parent=null, siteid=siteid
			var filterTemplate = { itemnumnotnull: true, parent: 'null', siteid: siteid };
			
			if(assetnum){
				filterTemplate['assetnum'] = assetnum;
			}
			
			if(storeroom){
				filterTemplate['location'] = storeroom;
			}
			
			if(itemnum) {
				filterTemplate['itemnum'] = itemnum;
			}

			var filter = [];
			var fe = {};
			
			var domainitemtype = CommonHandler._getAdditionalResource(eventContext,'domainitemtype');
			domainitemtype.clearFilterAndSort();
			var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemtype, itemtype));			

			arrayUtil.forEach(Object.keys(statuses), function(status) {
				var filterElement = lang.clone(filterTemplate);
				filterElement["status"] = status;
				filter.push(filterElement);
			});

			arrayUtil.forEach(externalOnes, function(aValue){
				fe = lang.clone(filter);
				arrayUtil.forEach(fe, function(element){
					element["itemtype"] = aValue;
				});
			});
						
			return fe;			
		},
		
		asyncValidateRotatingAsset : function(eventContext){
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var invreserveListSet= currWO.getLoadedModelDataSetOrNull('invreserveList');
			var currentRecord = invreserveListSet.getCurrentRecord();
						
			//var creatingMaterialItem = CommonHandler._getAdditionalResource(eventContext,'workOrder.actualmateriallist').getCurrentRecord();
			var assetnum = currentRecord.getPendingOrOriginalValue('localrotassetnum');
			
			var filter = null;
			this.asyncBuildFilterForRotAsset(eventContext, assetnum).
			then(function(f) {
				filter = f;
			});
			
			// run filter, check results
			var rotatingAssetPromise = this.async_getRotatingPromise(filter); 
			this.async_checkRotatingAsset(eventContext, rotatingAssetPromise, currentRecord);
		},

		async_getRotatingPromise : function(filter) {
			return ModelService.filtered("additionalasset", null, filter, null, false, true);
		},
		
		async_checkRotatingAsset : function(eventContext, rotatingAssetSet, currentRecord) {
			if(rotatingAssetSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidRotatingAsset');
			}else{
				currentRecord.set('itemnum', rotatingAssetSet.getRecordAt(0).get('itemnum'));
			}
		},	
		
		//validate item
		asyncValidateItem : function(eventContext) {
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var invreserveListSet= currWO.getLoadedModelDataSetOrNull('invreserveList');
			var currentRecord = invreserveListSet.getCurrentRecord();
			var itemnum = currentRecord.getPendingOrOriginalValue('item');
			var rotassetmetadata = currentRecord.getRuntimeFieldMetadata('localrotassetnum');
			
			// We can only validate if ITEMNUM is specified
			if(!itemnum){
				creatingMaterialItem.set('itemdesc', '');
				creatingMaterialItem.set('binnum', '');
				creatingMaterialItem.set('storeroom', '');
				rotassetmetadata.set('required',false);
				rotassetmetadata.set('readonly',false);
				return;
			}
			
			//defect 113779 - avoid double validation calls
			//creatingMaterialItem.set('itemnum',itemnum);
			
			var filter = this.buildFilterForItem(eventContext, itemnum);
			var inventoryPromise = this.async_getItemPromise(filter);
			this.async_checkForItem(inventoryPromise, rotassetmetadata, currentRecord);
		},
	
		async_getItemPromise : function(filter) {
			return ModelService.filtered('additionalInventory', null, filter, null, false, true);
		},
		
		async_checkForItem : function(itemSet, rotassetmetadata, currentRecord){
			if(itemSet.count() == 0) {
				currentRecord.set('itemdesc', '');
				throw new PlatformRuntimeWarning('invalidItem');
			}else{
				var item = itemSet.getRecordAt(0);

				//Set description on the master record, considering the itemnum is valid
				currentRecord.set('itemdesc', item.get('description'));
				
				// defect 147627 storeroom value entered when item is manually entered
				if (itemSet.count() == 1) {
					currentRecord.set('storeroom', item.get('location'));
				}
				
				//check if it's a rotating item
				if (item.get('rotating')) {
				    //set rotassetnum field to required
					//rotassetmetadata.set('required',true);
					rotassetmetadata.set('readonly',false);
				} else {
				    //set rotassetnum to read only
					rotassetmetadata.set('required',false);
					rotassetmetadata.set('readonly',true);
				}
			}
		},	
		
		buildFilterForItem : function(eventContext, itemnum) {
			/*  builds a filter for showing the item lookup and performing async validation
			 * 
			 * 	build filter on additionalInventory with status of ACTIVE, PENDOBS, siteid, itemtype
			 * 	if there's a storeroom set (location), add storeroom to the filter.
			 * 	if there's a storeroom and a binnum set, add binnum to the filter
			 */
			
			var currWO = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();
			var invreserveListSet= currWO.getLoadedModelDataSetOrNull('invreserveList');
			var currentRecord = invreserveListSet.getCurrentRecord();
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			//get linetype
			var plannedMaterialSet= currWO.getLoadedModelDataSetOrNull('materiallist');
			var requestnum = currentRecord.get('requestnum');
			var plannedMaterial = plannedMaterialSet.find('requestnum == $1 && siteid == $2',requestnum, siteid);
			var linetype = plannedMaterial[0].get("linetype");
			
			var storeroom = currentRecord.get("storeroom");
			var binnum = currentRecord.get("binnum");
			var siteid = CommonHandler._getWorkorderSiteId(eventContext);
			
			additionalInventory = CommonHandler._getAdditionalResource(eventContext,'additionalInventory');
			CommonHandler._clearFilterForResource(eventContext,additionalInventory);

			var statuses = this.selectableItemStatusesAsFilter(eventContext);
			var filter = [];
			// create a filter for each status that has everything you need to filter on
			filter.push({"siteid": siteid});
			filter.push({"itemtype": linetype});
			if (itemnum) {
				// add a filter term for itemnum if it is set - used by validate, not lookup
				filter.push({"itemnum": itemnum});
			}
			if (storeroom) {
				// add a filter term for location if storeroom is set
				filter.push({"location": storeroom});
				if (binnum) {
					filter.push({"binnum" : binnum});
				}
			}
			return arrayUtil.map(statuses, function(anStatus){
				var result = lang.mixin({}, anStatus);
				arrayUtil.forEach(filter, function(condition){
					 lang.mixin(result, condition);		
				});
				return result;
			});			
		},
		selectableItemStatusesAsFilter: function(eventContext){
			var domainitemstatus = CommonHandler._getAdditionalResource(eventContext,'domainitemstatus');			
			var internalStatuses = ['ACTIVE', 'PENDOBS'];
			var filter = [];
			arrayUtil.forEach(internalStatuses, function(anStatus){
				CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
				var externalOnes = Object.keys(SynonymDomain.resolveToExternal(domainitemstatus, anStatus));
				arrayUtil.forEach(externalOnes, function(aValue){
					filter.push({"status": aValue});
				});
			});
			CommonHandler._clearFilterForResource(eventContext, domainitemstatus);
			return filter;
		}
		
	});
});
