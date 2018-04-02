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

define("application/business/ActualToolObject", 
		["application/business/FieldUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/translation/MessageService",
	     "application/handlers/CommonHandler",
	     "application/business/MaxVars",
	     "platform/auth/UserManager",
		 "application/business/WorkOrderStatusHandler"], 
function(fieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, MessageService, CommonHandler, MaxVars, UserManager, WorkOrderStatusHandler)
		 {
	return {
/**@memberOf application.business.ActualToolObject */
			setDefaultValues : function(actualTool) {
			actualTool.set('toolhrs', 0);
			actualTool.set('toolqty', 1);
		},
		
		onInitialize : function(actualTool) {
			fieldUtil.initCompositeField("tool", "tooldesc", "toolanddescription", actualTool);
		},

		onAdd: function(actualTool) {
			actualTool.set("dontDiscard", false);
		},
		
		beforeSave : function(actualTool) {
			
		},
		
		validateDateUsed: function(actualTool, newValue, oldValue){
			var duedate = actualTool.getAsDateOrNull("duedate");
			var useddate = actualTool.getAsDateOrNull("useddate");
			var currentDate = new Date();
			
			if(duedate != null){
				var dateUsed = (useddate==null ? currentDate : useddate);
				if(duedate < dateUsed){
					var orgid = UserManager.getInfo("deforg");
					var oslcmaxvars = UI.application.getResource("oslcmaxvars");	
					if(MaxVars.prohibitPastDueTools(oslcmaxvars, orgid)){
						eventContext.application.showMessage(MessageService.createStaticMessage('overduetoolwarn').getMessage());
						//throw new PlatformRuntimeWarning('overduetoolwarn');
					}
					else{
						throw new PlatformRuntimeException('overduetoolerror',[actualTool.get("tool")]);
					}
				}
			}
		},
		
		validateExpiryDate: function(actualTool, newValue, oldValue){
			var expiryDate = actualTool.getAsDateOrNull("expirydate");
			var usedDate = actualTool.getAsDateOrNull("useddate");
			if(usedDate != null && expiryDate != null){
				if(expiryDate<usedDate){
					throw new PlatformRuntimeException("invalidexpiryforused");
				}
			}
			if(expiryDate != null && expiryDate<(new Date())){
				throw new PlatformRuntimeException("invalidexpiryforentered");
			}
		},
		
		validateTechForTool: function(actualTool, newValue, oldValue){
			if(newValue==null)
				return;
			if(actualTool.get("tool") != null){
				var oslcmaxvars = UI.application.getResource("oslcmaxvars");	
				var orgid = actualTool.getParent().get('orgid');			
				var toolTechMaxVar = MaxVars.isTechValidForTool(oslcmaxvars, orgid);
				var isQualified = this.isTechQualified(actualTool);
				if(!isQualified){
					if(toolTechMaxVar==1){
						//check if tech is qualified for tool and warn if not
						UI.application.showMessage(MessageService.createStaticMessage('unqualtechwarn').getMessage());
						//throw new PlatformRuntimeWarning("unqualtechwarn");
					}
					else if(toolTechMaxVar==2){
						//check if tech is qualified for tool and error if not
						throw new PlatformRuntimeException("unqualtecherror");
					}
				}		
			}
		},
		
		validateToolForTech: function(actualTool, newValue, oldValue){
			if(newValue==null)
				return;
			if(actualTool.get("technician") != null){
				var oslcmaxvars = UI.application.getResource("oslcmaxvars");	
				var orgid = actualTool.getParent().get('orgid');			
				var toolTechMaxVar = MaxVars.isTechValidForTool(oslcmaxvars, orgid);
				var isQualified = this.isTechQualified(actualTool);
				if(!isQualified){
					if(toolTechMaxVar==1){
						//check if tech is qualified for tool and warn if not
						UI.application.showMessage(MessageService.createStaticMessage('unqualtechwarn').getMessage());
					}
					else if(toolTechMaxVar==2){
						//check if tech is qualified for tool and error if not
						throw new PlatformRuntimeException("unqualtecherror");
					}
				}		
			}
		},
		
		isTechQualified : function(currentTool){
			var isValid = false;
			var selectedTool = UI.application.getResource('additionaltool').getCurrentRecord();
			var currentLaborCraft = this.filterTech(currentTool.getPendingOrOriginalValue('technician'));
			var laborCode = currentLaborCraft.get("laborcode");

			//get labors qualifications
			var addlLabor = UI.application.getResource("additionallabor");
			addlLabor.clearFilterAndSort();	
			addlLabor.filter("laborcode == $1 && orgid == $2", laborCode, currentTool.getParent().orgid);
			if(addlLabor.count()>1){
				//There should only be one.  We're going to use the first, but I'll log a message here.
				Logger.trace("[ActualToolHandler] Too many matching labor records.  Using the first one. ");
			}

			var toolqualrecs = selectedTool.get("toolqual");
			if(typeof toolqualrecs === 'string')
				toolqualrecs = new Array();
			var laborqualrecs = addlLabor.data[0].get("laborqual");
			if(typeof laborqualrecs === 'string')
				laborqualrecs = new Array();
			//compare qualifications
			var t = 0;
			while(t < toolqualrecs.length){
				var toolqualrec = toolqualrecs[t];
				var toolqualid = toolqualrec.qualificationid;
				//for each toolqual, see if there is a laborqual.  as long as one matches, its valid.
				var l = 0;
				while(l < laborqualrecs.length){
					var laborqualrec = laborqualrecs[l];
					var laborqualid = laborqualrec.qualificationid;
					if(toolqualid==laborqualid){
						//qualification match found
						isValid = true;
					}
					l++;
				}
				t++;
			}
			return isValid;
		},
		
		canAddActualTool: function(workOrder){
			var currentWOStatus= WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"));
			
			 return currentWOStatus== "APPR" || currentWOStatus== "INPRG" || currentWOStatus== "COMP" || currentWOStatus== "WSCH" || 
					currentWOStatus== "WMATL";
		},
		
		filterTech: function(tech){
			var additionallaborcraft = UI.application.getResource("additionallaborcraftrate");
			additionallaborcraft.clearFilterAndSort();
			additionallaborcraft.filter('laborcode == $1', tech);
			
			return additionallaborcraft.getCurrentRecord();
			
		},		
	};
});
