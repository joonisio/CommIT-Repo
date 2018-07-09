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

define("application/handlers/ActualLaborHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "platform/auth/UserManager",
	     "application/business/ActualLaborObject",
	     "platform/model/ModelService",
	     "application/business/MaxVars",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "platform/translation/MessageService",
	     "platform/util/DateTimeUtil",
	     "application/handlers/CommonHandler",
	     "platform/translation/SynonymDomain",
	     "platform/util/AsyncAwareMixin",
	     "dojo/Deferred"],
function(declare, lang, UserManager, ActualLaborObject, ModelService, MaxVars, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, MessageService, DateTimeUtil, CommonHandler, SynonymDomain, AsyncAwareMixin,Deferred) {
	var previousIndex = -1;
	return declare( [ApplicationHandlerBase, AsyncAwareMixin], {
	
		//Initialize Actual Labor Detail view
/**@memberOf application.handlers.ActualLaborHandler */
		initActualLaborDetailView: function(eventContext){
		

		},
			
		//Initialize Actual Labor Entry view
		initActualLaborEntryView: function(eventContext){
			//TODO: Populate Craft, Skill Level with current user's default craft values 
			var view = eventContext.viewControl;
			var actualLaborSet = CommonHandler._getAdditionalResource(this,"workOrder.actuallaborlist");
			if (actualLaborSet.getCurrentIndex() > -1) {
				previousIndex = actualLaborSet.getCurrentIndex();
			}
			eventContext.setMyResourceObject(actualLaborSet);
			if(!view.isOverrideEditMode()){

				var laborTransactionTypeSet=  CommonHandler._getAdditionalResource(eventContext,"domainlabortransactiontype");
			
				var workOrder = this.application.getResource("workOrder").getCurrentRecord(); 
				workOrder.openPriorityChangeTransaction();
				
    			var newActualLabor= actualLaborSet.createNewRecord();
    				
    			var myLaborSet = eventContext.application.getResource("mylabor");
    			var myLaborCraftSet = eventContext.application.getResource("mylaborcraftrate");
    			CommonHandler._clearFilterForResource(this,myLaborCraftSet);
    			
    			//default and org
    			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
    			myLaborCraftSet.filter('orgid == $1',orgid);
    			
    			var currentDateTime = eventContext.application.getCurrentDateTime();
    			
    			ActualLaborObject.setDefaultValues(newActualLabor, myLaborSet, myLaborCraftSet, laborTransactionTypeSet, currentDateTime);
    			
			}
		},
		
		//Initialize Actual Crew Entry view
		initActualCrewEntryView: function(eventContext){

			
	
		},
		
		// -------------------------------------------------------------------------------------
		// sync version of validatelabor
		validateLabor: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var laborcode = actualLabor.getPendingOrOriginalValue('laborcode');
			
			if(!laborcode) return;
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var isValid = laborCraftRateSet.find('laborcode == $1', laborcode);
			
			if(isValid.length == 0){
				actualLabor.setNullValue('laborname');
				throw new PlatformRuntimeWarning('invalidLabor');
			}
			else{
				actualLabor.set('laborname', isValid[0].get('laborname'));
			}
		},
		
		// async version of validatelabor
		asyncvalidateLabor: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var laborcode = actualLabor.getPendingOrOriginalValue('laborcode');
			
			if(!laborcode) return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('laborcode',laborcode);
			
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var laborPromise = this.async_vl_getLaborCraftRatePromise(laborCraftRateSet, laborcode);
			this.async_vl_checkLaborFound(laborPromise, actualLabor);
		},
 		
		async_vl_getLaborCraftRatePromise: function(laborcraftrate, laborcode) {
			return ModelService.filtered(laborcraftrate.getResourceName(), laborcraftrate.getQueryBase(), [{laborcode: laborcode}], null, false, true);
		},

		async_vl_checkLaborFound : function(laborSet, actualLabor) {
			if(laborSet.count() == 0) { 
				actualLabor.setNullValue('laborname');
				throw new PlatformRuntimeWarning('invalidLabor');
			}
			else{
				actualLabor.set('laborname', laborSet.getRecordAt(0).get('laborname'));
			}						
		},
		
		// --------------------------------------------------------------------------
		validateCraft: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var craft = actualLabor.getPendingOrOriginalValue('craft');
			
			if(!craft) return;
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var isValid = laborCraftRateSet.find('craft == $1', craft);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidCraft');
			}
		},
		
		asyncValidateCraft: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var craft = actualLabor.getPendingOrOriginalValue('craft');
			
			//get premiumpaycode field metadata
			var ppcodemetadata = actualLabor.getRuntimeFieldMetadata('premiumpaycode');
			
			if(!craft) {
				actualLabor.set('premiumpaycode', '');
				ppcodemetadata.set('readonly',true);				
				return;
			}
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('craft',craft);
			
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);	
			var craftPromise = this.async_vc_getCraftPromise(laborCraftRateSet, craft);
			this.async_vc_validateCraft(craftPromise,actualLabor,ppcodemetadata);
		},

		async_vc_getCraftPromise: function(laborcraftrate, craft) {
			return ModelService.filtered(laborcraftrate.getResourceName(), laborcraftrate.getQueryBase(), [{craft: craft}], null, false, true);
		},

		async_vc_validateCraft: function(laborCraftRateSet, currRecord, ppmetadata) {
			currRecord.set('premiumpaycode', '');
			if(laborCraftRateSet.count() == 0){				
				ppmetadata.set('readonly',true);
				throw new PlatformRuntimeWarning('invalidCraft');
			} else {
				ppmetadata.set('readonly',false);
			}
		},
		
		validateSkillLevel: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var skilllevel = actualLabor.getPendingOrOriginalValue('skilllevel');
			
			if(!skilllevel)	return;
			
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var isValid = laborCraftRateSet.find('skilllevel == $1', skilllevel);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidSkillLevel');
			}
		},		
		
		asyncvalidateSkillLevel: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var skilllevel = actualLabor.getPendingOrOriginalValue('skilllevel');
			
			if(!skilllevel)	return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('skilllevel',skilllevel);
			
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var skillLevelPromise = this.async_vsl_getSkillLevelPromise(laborCraftRateSet, skilllevel);
			this.async_vsl_validateSkillLevel(skillLevelPromise);
		},		

		async_vsl_getSkillLevelPromise: function(laborcraftrate, skilllevel) {
			return ModelService.filtered(laborcraftrate.getResourceName(), laborcraftrate.getQueryBase(), [{skilllevel: skilllevel}], null, false, true);
		},

		async_vsl_validateSkillLevel: function(laborCraftRateSet) {
			if(laborCraftRateSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidSkillLevel');
			}
		},

		validateType: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var type = actualLabor.getPendingOrOriginalValue('transtype');
			
			if(!type) return;
			var transTypeSet = eventContext.application.getResource("domainlabortransactiontype");
			CommonHandler._clearFilterForResource(this,transTypeSet);
			var isValid = transTypeSet.find('value == $1', type);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidLaborTransType');
			}
		},	
		
		asyncvalidateType: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var type = actualLabor.getPendingOrOriginalValue('transtype');
			
			if(!type) return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('transtype',type);
			
			var transTypeSet = eventContext.application.getResource("domainlabortransactiontype");
			CommonHandler._clearFilterForResource(this,transTypeSet);						
			var transPromise = this.async_vt_getTypePromise(transTypeSet, type);
			this.async_vt_validateType(transPromise);			
		},	
		
		async_vt_getTypePromise: function(transTypeSet, type) {
			return ModelService.filtered(transTypeSet.getResourceName(), transTypeSet.getQueryBase(), [{value: type}], null, false, true);
		},

		async_vt_validateType: function(transTypeSet) {
			if(transTypeSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidLaborTransType');
			}
		},		
		
		validateVendor: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var vendor = actualLabor.getPendingOrOriginalValue('vendor');
			
			if(!vendor) return;
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var isValid = laborCraftRateSet.find('vendor == $1', vendor);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidVendor');
			}
		},

		asyncvalidateVendor: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var vendor = actualLabor.getPendingOrOriginalValue('vendor');
			
			if(!vendor) return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('vendor',vendor);
			
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			
			var vendorPromise = this.async_vv_getVendorPromise(laborCraftRateSet, vendor);
			this.async_vv_validateVendor(vendorPromise);
		},
		
		async_vv_getVendorPromise: function(laborCraftRateSet, vendor) {
			return ModelService.filtered(laborCraftRateSet.getResourceName(), laborCraftRateSet.getQueryBase(), [{vendor: vendor}], null, false, true);
		},

		async_vv_validateVendor: function(laborCraftRateSet) {
			if(laborCraftRateSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidVendor');
			}
		},		
		
		validateContract: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var contract = actualLabor.getPendingOrOriginalValue('contractnum');
			
			if(!contract) return;
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			var isValid = laborCraftRateSet.find('contractnum == $1', contract);
			
			if(isValid.length == 0){
				throw new PlatformRuntimeWarning('invalidContract');
			}
		},
		
		asyncvalidateContract: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var contract = actualLabor.getPendingOrOriginalValue('contractnum');
			
			if(!contract) return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('contractnum',contract);
			
			var laborCraftRateSet = eventContext.application.getResource("additionallaborcraftrate");
			CommonHandler._clearFilterForResource(this,laborCraftRateSet);
			
			var contractPromise = this.async_vc_getContractPromise(laborCraftRateSet, contract);
			this.async_vc_validateContract(contractPromise);
		},

		async_vc_getContractPromise: function(laborCraftRateSet, contract) {
			return ModelService.filtered(laborCraftRateSet.getResourceName(), laborCraftRateSet.getQueryBase(), [{contractnum: contract}], null, false, true);
		},

		async_vc_validateContract: function(laborCraftRateSet) {
			if(laborCraftRateSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidContract');
			}
		},		
		
		// -------------------------------------------------------------------------------------
		// sync version of validatePremiumPaycode
		validatePremiumPayCode: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var premiumpaycode = actualLabor.getPendingOrOriginalValue('premiumpaycode');
			
			if(!premiumpaycode) return;
						
			var premiumPaycodeSet = eventContext.application.getResource("additionalpremiumpaycode");
			CommonHandler._clearFilterForResource(this,premiumPaycodeSet);
			
			var isValid = premiumPaycodeSet.find('premiumpaycode == $1', premiumpaycode);
			
			if(isValid.length == 0){
				actualLabor.setNullValue('premiumpaycode');
				throw new PlatformRuntimeWarning('invalidPremiumPayCode');
			}
			else{
				actualLabor.set('premiumpaycode', isValid[0].get('premiumpaycode'));
			}
		},
		
		// async version of validate premium pay code
		asyncvalidatePremiumPayCode: function(eventContext){
			var actualLabor = eventContext.application.getResource("workOrder.actuallaborlist").getCurrentRecord();
			var paycode = actualLabor.getPendingOrOriginalValue('premiumpaycode');
			
			if(!paycode) return;
			
			//defect 113779 - avoid double validation calls
			actualLabor.set('premiumpaycode',paycode);
			
			var orgid =  CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('orgid');
			var craft =  CommonHandler._getAdditionalResource(this,"workOrder.actuallaborlist").getCurrentRecord().get('craft');

			var filter = [];
			if (craft) {
				filter.push({premiumpaycode: paycode, orgid: orgid, craft: craft});
			} else {
				filter.push({premiumpaycode: paycode, orgid: orgid});
			}
						
			//var premiumPaycodeSet = eventContext.application.getResource("additionalpremiumpaycode");
			var ppCraftRateSet =  CommonHandler._getAdditionalResource(eventContext,'additionalpremiumpaycraftrate');
			CommonHandler._clearFilterForResource(this,ppCraftRateSet);				
			
			var premiumPaycodePromise = this.async_vc_getPremiumPaycodePromise(ppCraftRateSet, filter);
			this.async_vc_validatePremiumPaycode(premiumPaycodePromise);
		},
		async_vc_getPremiumPaycodePromise: function(premiumPaycodeSet, filter) {
			//return ModelService.filtered(premiumPaycodeSet.getResourceName(), premiumPaycodeSet.getQueryBase(), [{premiumpaycode: code, orgid: org}], null, false, true);
			return ModelService.additionalDataFiltered(premiumPaycodeSet.getResourceName(), filter, true, null)
		},

		async_vc_validatePremiumPaycode: function(premiumPaycodeSet) {
			if(premiumPaycodeSet.count() == 0){
				throw new PlatformRuntimeWarning('invalidPremiumPayCode');
			}
		},		
		
		validateLaborCraftRate: function(eventContext){
			var promise = this.filterLaborCraftRate(eventContext);
			var deferred = new Deferred();
			//Client may remove additionallaborcraftrate, if they do assume valid
			promise.then(function(laborCraftRateSet){
				var laborCraftRateFound = (laborCraftRateSet && laborCraftRateSet.data.length==0)? false: true;
				deferred.resolve(laborCraftRateFound);
			});
			return deferred.promise;
		},
		
		
		//Commit new entry of an individual Actual Crew
		commitActualLaborEntryView: function(eventContext){
			var self = this;
			eventContext.application.showBusy();
			if(!eventContext.viewControl.validate()){
				return;
			}

			if (!this.validateEndDateAndTime()) {
				throw new PlatformRuntimeException('cannotspecifyendtimewithoutenddate');
				return;
			}

			if(!this.validateDatesTolerance()){
				throw new PlatformRuntimeException('invalidlabordatetime');
				return;
			}
			
			//don't save transaction when workorder hasn't been created yet
			if(this.application.getResource("workOrder").getCurrentRecord().get('wonum') == '') {
				this.ui.hideCurrentView();
				return;
			}
			
			var promise = this.validateLaborCraftRate(eventContext);
			promise.then(function(laborCraftExists){
				if(laborCraftExists==true){
					self._saveTransaction();
				}
				else{
					self.ui.show("WorkExecution.LaborMismatch");
				}	
			});

		},
		
		_saveTransaction: function(){
		
			try{
     			var workOrderSet = this.application.getResource("workOrder");
     			var workOrder = workOrderSet.getCurrentRecord();
     			workOrder.closePriorityChangeTransaction();
				ModelService.save(workOrderSet);
				this.ui.hideCurrentView();
			}catch(e){
				throw e;
			}
			
		},
		
		discardActualLaborEntryView: function(eventContext){
			this.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		// cleanup event handler
		handleBackButtonClick: function(eventContext){
			var view = eventContext.viewControl;
			if(!view.isOverrideEditMode()){
				var actualLabor=eventContext.getCurrentRecord();
				actualLabor.deleteLocal();
				if (previousIndex > -1 && actualLabor.getOwner()) {
					actualLabor.getOwner().setCurrentIndex(previousIndex);
				}
				return;
			}
			this._saveTransaction();
		},
		
		enableReportLaborButton: function(eventContext){
			var workOrder = CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();			
			if (!workOrder || !ActualLaborObject.canAddActualLabor(workOrder) || workOrder.isErrored()) {			
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		
		enableEnterCrewButton: function(eventContext){
			var workOrder =  CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord();			
			if (!ActualLaborObject.canAddActualLabor(workOrder) || workOrder.isErrored()) {			
				eventContext.setDisplay(false);
				return;
			}
			eventContext.setDisplay(true);
		},
		
		filterPremiumPay : function(eventContext){
			var payCode =  CommonHandler._getAdditionalResource(eventContext,'additionalpremiumpaycode');
			var craftRate =  CommonHandler._getAdditionalResource(eventContext,'additionalpremiumpaycraftrate');

			var orgid =  CommonHandler._getAdditionalResource(eventContext,"workOrder").getCurrentRecord().get('orgid');
			var craft =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist").getCurrentRecord().get('craft');

			var keys = {};
			if(craft){
				CommonHandler._clearFilterForResource(this,craftRate);
				
				//filter premium craft rate
				craftRate.filter("craft == $1 && orgid == $2", craft, orgid);
								 
				craftRate.foreach(function(record){
					keys[record.get('premiumpaycode') + '::' + orgid ] = true;
				});
			}

			//filter premium pay code				
			if(payCode.isFiltered()){
				payCode.clearFilterAndSort();
			}
			payCode.filter("$1[premiumpaycode + '::' + orgid]", keys);
		},
		
		filterPremiumPayForLookup : function(eventContext){
			var payCode =  eventContext.getResource();
			var craftRate =  CommonHandler._getAdditionalResource(this,'additionalpremiumpaycraftrate');
			CommonHandler._clearFilterForResource(this,craftRate);
			var orgid =  CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('orgid');
			var craft =  CommonHandler._getAdditionalResource(this,"workOrder.actuallaborlist").getCurrentRecord().get('craft');

			var keys = {};
			if(craft){
				//filter premium craft rate
				//Do we consider having large amount of records in craftRate?
				//So far assuming this is small and will fit in a single page in cache
				//Thus make THIS filter in memory
				craftRate.filter("craft == $1 && orgid == $2", craft, orgid);

				var filter = [];				 
				craftRate.foreach(function(record){
					filter.push({
						orgid: orgid,
						premiumpaycode: record.get('premiumpaycode')
					});	
				}, this);
				if (filter.length == 0) {
					//if filter is zero length all records are displayed.  need to supply an invalid orgid to display zero records
					filter.push({orgid: '####~NONEXISTING-RECORD~##'});
				}
				payCode.lookupFilter = filter;
			}
		},
		
		_clearFilterForResource : function(resource) {
			if(resource.isFiltered()) {
				resource.clearFilterAndSort();
			}
		},
		
		filterLaborCraftRate: function(eventContext){
			
			var filter = [];
			var currentLabor =  CommonHandler._getAdditionalResource(eventContext,"workOrder.actuallaborlist").getCurrentRecord();
			//var laborcode = currentLabor.get("laborcode");
			var craft = currentLabor.get("craft");
			var skilllevel = currentLabor.get("skilllevel");
			var vendor = currentLabor.get("vendor");
			var contractnum = currentLabor.get("contractnum");
			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			
			//var queryArray = [];
			//var queryParamsArray = [];
			//var index = 1;
			/*if(laborcode){
				queryArray.push(["laborcode==$", (index++)].join(""));
				queryParamsArray.push(laborcode);
			}*/
			
			if(orgid){
				filter.push({'orgid':orgid});
			}
			
			if(craft){
				filter[0].craft = craft;
			}
			if(skilllevel){
				filter[0].skilllevel = skilllevel;
			}
			if(vendor){
				filter[0].vendor = vendor;
			}
			if(contractnum){
				filter[0].contractnum = contractnum;
			}
			
			return ModelService.filtered("additionallaborcraftrate", null, filter, 500, false, true);
			
		},
		
		filterLaborCraftRateForLookup: function(eventContext){
			var laborCraftRateSet =  CommonHandler._getAdditionalResource(eventContext,"additionallaborcraftrate");
			CommonHandler._clearFilterForResource(eventContext, laborCraftRateSet);
			var orgid = CommonHandler._getWorkorderOrgId(eventContext);
			var filter = [];
			filter.push({'orgid':orgid});
			laborCraftRateSet.lookupFilter = filter;
		},
		
		continueLaborCraftMismatch: function(eventContext){
			this.ui.hideCurrentDialog();
			this._saveTransaction();
		},
		
		stopOnLaborCraftMismatch: function(eventContext){
			this.ui.hideCurrentDialog();
		},
		
		validateEndDateAndTime : function() {
			
			var actualLabor =  CommonHandler._getAdditionalResource(this,"workOrder.actuallaborlist").getCurrentRecord();
			
			var finishtime = actualLabor.getAsDateOrNull('finishtime');	
			if (!finishtime) {
				return true;
			}
			var finishdate = actualLabor.getAsDateOrNull('finishdate');
			
			return (finishtime && finishdate);
		},

		validateDatesTolerance : function() {
		
			var actualLabor =  CommonHandler._getAdditionalResource(this,"workOrder.actuallaborlist").getCurrentRecord();
			
			var startdate = actualLabor.getAsDateOrNull('startdate');
			var finishdate = actualLabor.getAsDateOrNull('finishdate');
	
			if(!startdate && !finishdate) return;
			var starttime = actualLabor.getAsDateOrNull('starttime');			
			var finishtime = actualLabor.getAsDateOrNull('finishtime');			
			
			var orgid =  CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord().get('orgid');			
			var currentdatetime = this.application.getCurrentDateTime();
			var oslcmaxvars =  CommonHandler._getAdditionalResource(this,"oslcmaxvars");	

            //Validating Start Date and Time
			var startdatetime;
			if (startdate){			
				if(starttime){
				   startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				} else {
					startdatetime = startdate;
				}
			}	
			
			if (startdatetime){
			   // validation: (startdatetime <= currentDate + labtranstolerance);
				if(!MaxVars.isActualLaborDateValid(oslcmaxvars, startdatetime, currentdatetime, orgid)){
					return false;
				}
				if (starttime) {
				    actualLabor.setDateValue('starttime', startdatetime);
				} 
			}

			//Validating Finish Date and Time
			var finishdatetime;
			if (finishdate){
				   if(finishtime){	
				       finishdatetime = DateTimeUtil.fromDateAndTimeToDateTime(finishdate, finishtime);
				   } else {
					   finishdatetime = finishdate; 
				   }
			}
			
			if (finishdatetime){
			   // validation: (finishdatetime <= currentDate + labtranstolerance);
				if(!MaxVars.isActualLaborDateValid(oslcmaxvars, finishdatetime, currentdatetime, orgid)){
					return false;
				}
				if (finishtime) {
				    actualLabor.setDateValue('finishtime', finishdatetime);
				}
			}
            return true;
			
		},
		
	});
});
