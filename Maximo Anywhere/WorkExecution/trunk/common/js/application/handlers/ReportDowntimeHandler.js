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

define("application/handlers/ReportDowntimeHandler",
	   [ "dojo/_base/declare",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/handlers/CommonHandler",
	     "platform/model/ModelService",
	     "platform/util/DateTimeUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/util/PlatformConstants",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/business/SynonymDomain",
	     "application/business/WorkOrderTimer",
	     "dojo/promise/all",
		  "platform/translation/MessageService",
		  "platform/logging/Logger",
		  "platform/util/AsyncAwareMixin",
		  "dojo/Deferred",
		  "dojo/_base/array"
	     ],
function(declare, ApplicationHandlerBase, CommonHandler, ModelService, DateTimeUtil, PlatformRuntimeException, PlatformConstants, PlatformRuntimeWarning, SynonymDomain, WorkOrderTimer, all, MessageService, Logger, AsyncAwareMixin, Deferred, arrayUtil ) {
	return declare( [ApplicationHandlerBase, AsyncAwareMixin], {

		/*
		 */
		//Initialize ReportDowntime view
/**@memberOf application.handlers.ReportDowntimeHandler */
		initReportDowntimeView: function(eventContext){
			this._defaultValues(true);
		},

		_getStartDateSourceFromMaxVar: function(workOrder){
			var oslcmaxvars = CommonHandler._getAdditionalResource(this,"oslcmaxvars");
			if(oslcmaxvars){
			    var result = oslcmaxvars.find("varname == $1 && orgid == $2", 'DOWNTIMEDFLTS', workOrder.get('orgid'));
			    if (result){
			    	var source = result[0].get("varvalue");
			    	if (source == 'START'){
			    		return 'ACTSTART';
			    	}
			    	if (source = 'REPORTED'){
			    		return 'REPORTDATE';
			    	}
			    }
			}
			return 'NONE';
		},
		
		_defaultValues: function(isStatusChange){
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			var downtimeReport =  CommonHandler._getAdditionalResource(this,"workOrder.downtimereport").getRecordAt(0);
			var tempDowntimeResource = CommonHandler._getAdditionalResource(this,"tempReportDowntimeResource").getCurrentRecord();
			var assetUp ;

			tempDowntimeResource.set('wonum',  workOrder.get('wonum'));
			
			var tempDowntimeResource = CommonHandler._getAdditionalResource(this,"tempReportDowntimeResource").getCurrentRecord();
			
			var curMultiAsset;
				
			if(this.ui.getCurrentView().id == "WorkExecution.MultipleAssetsLocationsView" || this.ui.viewHistory[this.ui.viewHistory.length -2].id == "WorkExecution.MultipleAssetsLocationsView"){
				tempDowntimeResource.set('asset', CommonHandler._getAdditionalResource(this,"workOrder.multiassetloclist").getCurrentRecord().assetnum);
				curMultiAsset = CommonHandler._getAdditionalResource(this,"workOrder.multiassetloclist").getCurrentRecord();
				assetUp = curMultiAsset.assetup;
				tempDowntimeResource.set('assetup', assetUp);
			}else{
				tempDowntimeResource.set('asset',workOrder.get('asset'));
				assetUp = workOrder.get('assetup');
				tempDowntimeResource.set('assetup', assetUp);
			}
			
			tempDowntimeResource.set('ischangestatus', isStatusChange);
			if (isStatusChange){
				if (assetUp){
					tempDowntimeResource.setDateValue("startdate", this.application.getCurrentDateTime());
				}
				else{
					if(curMultiAsset){
						tempDowntimeResource.set('startdate',  curMultiAsset.get('updownstatusdate')); //Set this to multiasset updownstatusdate
					}else{
						tempDowntimeResource.set('startdate',  workOrder.get('updownstatusdate')); //Set this to workorder updownstatusdate
					}
					
				}
			}
			else{
					var startDateDefaultSource = (downtimeReport?downtimeReport.get('startdatesource')?downtimeReport.get('startdatesource') : this._getStartDateSourceFromMaxVar(workOrder) : this._getStartDateSourceFromMaxVar(workOrder)); //"ACTSTART","REPORTDATE","NONE";
					if (startDateDefaultSource == 'ACTSTART'){
						tempDowntimeResource.set("startdate",workOrder.get('actstart'));
					}
					else if (startDateDefaultSource == 'REPORTDATE'){
						tempDowntimeResource.set("startdate",workOrder.get('creationDate'));
					}
					else{
						tempDowntimeResource.setDateValue("startdate",this.application.getCurrentDateTime());
					}
			}
			if (isStatusChange && assetUp){
				tempDowntimeResource.setNullValue('enddate');
			}
			else{
				tempDowntimeResource.setDateValue("enddate", this.application.getCurrentDateTime());
			}
			if (isStatusChange && !assetUp && downtimeReport){
				tempDowntimeResource.set('downtimecode', downtimeReport.get('statuschangecode'));
			}
			else{
				tempDowntimeResource.setNullValue('downtimecode');
			}
			var enddatemetadata = tempDowntimeResource.getRuntimeFieldMetadata('enddate');
			var startdatemetadata = tempDowntimeResource.getRuntimeFieldMetadata('startdate');
			startdatemetadata.set('readonly', isStatusChange && !assetUp); //if doing a status change and the asset is not up then start date is readonly
			startdatemetadata.set('required', !isStatusChange || assetUp);
			enddatemetadata.set('readonly', isStatusChange && assetUp); //if doing a status change and the asset is up then end date is readonly
			enddatemetadata.set('required', !isStatusChange || !assetUp);
		},

		updateDefaults: function(eventContext){
			var newValue = !!eventContext.checkBoxWidget.get('value');
			this._defaultValues(newValue);

		},

		handleBackButtonClick: function(eventContext){
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},

		cancelDowntime: function(eventContext){
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},

		saveDowntime: function(eventContext){
			if(!eventContext.viewControl.validate()){
				return;
			}
			var workOrderSet = CommonHandler._getAdditionalResource(eventContext,"workOrder");
			var workOrder = workOrderSet.getCurrentRecord();
			var downtimeReportSet =  workOrder.getLoadedModelDataSetOrNull('downtimereport');
			var tempDowntimeResource = CommonHandler._getAdditionalResource(eventContext,"tempReportDowntimeResource").getCurrentRecord();
			var assetUp = tempDowntimeResource.assetup;;

			var isChangeStatus = tempDowntimeResource.get('ischangestatus');

			var downtimeReport = downtimeReportSet.createNewRecord();
			if (isChangeStatus){
				if(this.statusChangeValidateDates(assetUp,tempDowntimeResource.get('startdate'),tempDowntimeResource.get('enddate'),workOrder.get('updownstatusdate'))){
					workOrder.openPriorityChangeTransaction();
					/*downtimeReportSet.data.splice(0, 1); //Need to remove the current record that was in place only for download.
					downtimeReportSet.setCurrentIndex[0];*/
					downtimeReport.set('assetnum', tempDowntimeResource.get('asset'));
					downtimeReport.set('isdowntimereport', (isChangeStatus?'0':'1'));
					downtimeReport.set('statuschangecode', tempDowntimeResource.get('downtimecode'));
					downtimeReport.set('statuschangedate', tempDowntimeResource.get((assetUp?'startdate':'enddate')));
				}
			}
			else{
				workOrder.openPriorityChangeTransaction();
				downtimeReport.set('reportdowntimecode', tempDowntimeResource.get('downtimecode'));
				if(this.downtimeValidateDates(tempDowntimeResource.get('startdate'),tempDowntimeResource.get('enddate'))){
					/*downtimeReportSet.data.splice(0, 1); //Need to remove the current record that was in place only for download.
					downtimeReportSet.setCurrentIndex[0];*/
					downtimeReport.set('assetnum', tempDowntimeResource.get('asset'));
					downtimeReport.set('isdowntimereport', (isChangeStatus?'0':'1'));
					downtimeReport.set('startdate', tempDowntimeResource.get('startdate'));
					downtimeReport.set('enddate', tempDowntimeResource.get('enddate'));
				}
			}
			workOrder.closePriorityChangeTransaction();
			ModelService.save(workOrderSet).then(function(){
				eventContext.ui.hideCurrentView();
			});
		},

		/*
		 * If the asset is up the start date cannot be before the last status date.  
		 * If the asset is down the end date cannot be before the last status date (which really is the start date)
		 */
		statusChangeValidateDates: function(assetUp, startdate, enddate, statusdate){
			
			if(assetUp){
				if(DateTimeUtil.zeroSecondsAndMilliseconds(startdate)<DateTimeUtil.zeroSecondsAndMilliseconds(statusdate)){
					throw new PlatformRuntimeException('startdatelessthanlaststatusdate');
					return false;
				}
			}
			else{
				if(DateTimeUtil.zeroSecondsAndMilliseconds(enddate)<DateTimeUtil.zeroSecondsAndMilliseconds(statusdate)){
					throw new PlatformRuntimeException('enddatelessthanlaststatusdate');
					return false;
				}
			}
            return true;
		},
		
		downtimeValidateDates : function(startdate, enddate) {

			if (enddate){
				if(DateTimeUtil.zeroSecondsAndMilliseconds(enddate)<DateTimeUtil.zeroSecondsAndMilliseconds(startdate)){
					throw new PlatformRuntimeException('endtimebeforestarttime');
					return false;
				}
			}
            return true;
		},
		
		hideAssetDowntimeButton: function(eventContext) {
			var workOrder = CommonHandler._getAdditionalResource(this,"workOrder").getCurrentRecord();
			var asset = workOrder.get('asset');
			if(asset)
				eventContext.setVisibility(true);
			else
				eventContext.setVisibility(false);
		},
		clickReportDowntime: function(eventContext){
			var tempDowntimeResource = CommonHandler._getAdditionalResource(this,"tempReportDowntimeResource").getCurrentRecord();
			if(this.ui.getCurrentView().id == "WorkExecution.MultipleAssetsLocationsView"){
				this._defaultValues(true);
			}
		},

	});
});
