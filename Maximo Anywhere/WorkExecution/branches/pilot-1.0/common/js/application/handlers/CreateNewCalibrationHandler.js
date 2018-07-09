/**
 * Handles creation of new points for an assetfunction in work order datasheet  
 */

define("application/handlers/CreateNewCalibrationHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "platform/model/ModelService",
	     "dojo/_base/array",
	     "platform/handlers/_ApplicationHandlerBase",
	     "application/business/WorkOrderObject",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/handlers/CommonHandler",
	     "platform/util/PlatformConstants",
	     "platform/format/FormatterService",
	     "platform/logging/Logger",
	     "dojo/Deferred",
	     "dojo/promise/all",
	     "platform/store/SystemProperties",
	     "platform/util/PlatformConstants",
	     "application/business/calibration/DataSheetCalculation",
	     "application/business/CalibrationPointObject",
	     "platform/translation/MessageService",
	     "application/business/WpEditSettings",
	     "platform/translation/SynonymDomain",
	     "application/business/DataSheetObject"],
function(declare,lang, ModelService, array, ApplicationHandlerBase, WorkOrderObject, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, FormatterService, Logger, Deferred, all, SystemProperties, PlatformConstants, DataSheetCalculation, CalibrationPointObject, MessageService, WpEditSettings, SynonymDomain, DataSheetObject) {
	return declare( ApplicationHandlerBase, {
		
		originalPoint:null,
		pointset: null,
		dataSheet: null,
		assetfunction: null,
		currentWorkOrder: null,
		newPoint:null,
		validation_fail_message: {'POINT_MISSING':'pointMissing', 'POINT_DUPLICATE':'pointDuplicate', 'INPUT_MISSING': 'inputMissing'},
		
/**@memberOf application.handlers.CreateNewCalibrationHandler */
		enableCreateNewCalibrationPoint: function(eventContext){
			//Enable the add button based on PLUSCWODSINSTR.ALLOWPOINTINSERTS resource attribute
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			
			//hide create new calibration point menu item if function is repeatable.
			var repeatable = assetfunc.repeatable;
			if(repeatable && repeatable==true){
				eventContext.setDisplay(false);
				return;
			}
			
			var enableAddbutton = false;
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var oslcwpeditsetting = CommonHandler._getAdditionalResource(eventContext,"oslcwpeditsetting");
			var domainwostatus = CommonHandler._getAdditionalResource(eventContext,'domainwostatus');
			
			var canAdd_setting =  WpEditSettings.shouldAddCalPoint(oslcwpeditsetting, 
					SynonymDomain.resolveToInternal(domainwostatus,wo.get('status')), wo.get('orgid'));
			
			
			if(canAdd_setting && assetfunc.allowpointinserts)
				enableAddbutton = true;
			
			eventContext.setDisplay(enableAddbutton);
			
		},
		
		createNewCalibrationPoint: function(eventContext){
			
		},
		
		createNewFunctionCheckPoint: function(eventContext){
			
		},
		
		createNewDynamicCheckPoint: function(eventContext){
		
		},
		
		renderNewCalibrationPointView: function(eventContext){
			
		},
		
		displayOutputUnit: function(eventContext){
			
		},
		
		displayInputUnit: function(eventContext){
			
		},
	
		
		setDependentResourceData: function(eventContext){
			this.datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			this.assetfunction = this.datasheet.assetfunctionlist.getCurrentRecord();
			this.pointset = this.application.getResource('dataSheetResource.calibrationpointlist').getCurrentRecord();
			
		},
		
		cleanDependentResourceData: function(){
			this.currentWorkOrder = null;
			this.assetfunction = null;
			this.pointset = null;
			this.newPoint = null;
			this.datasheet = null;
		
		},
		
		

		initCreatePointView : function(eventContext) {
			this.cleanDependentResourceData();
			this.setDependentResourceData(eventContext);            

			//Defect 209197. Priority transaction for other updates gets lost 
			//if another transaction done when the previous is not commited

			this.assetfunction.newPoint = true;

			var cp_list = CommonHandler._getAdditionalResource(eventContext,"dataSheetResource.calibrationpointlist");
			this.newPoint = cp_list.createNewRecord();
			cp_list.setCurrentIndexByRecord(this.newPoint);
			cp_list.resourceID = 'dataSheetResource.calibrationpointlist';
			eventContext.application.addResource(cp_list);

			this.assetfunction.newPoint = false;

			//Set parent data in the view
			this.newPoint.set('assetfunction', this.assetfunction.assetfunction);
			this.newPoint.set('plantype', this.assetfunction.plantype);
			this.newPoint.set('instrcalrangeeua_np', this.assetfunction.instrcalrangeeu);
			this.newPoint.set('instroutrangeeu_np', this.assetfunction.instroutrangeeu);
			this.newPoint.set('instrseq', this.assetfunction.instrseq);
			this.newPoint.set('dsplannum', this.datasheet.dsplannum);
			this.newPoint.set('wodsnum', this.datasheet.wodsnum);
			this.newPoint.set('revisionnum', this.datasheet.revisionnum);
			this.newPoint.set('setpointadj', false);
			this.newPoint.set('isaverage', false);
			this.newPoint.set('isadded', true);
			this.newPoint.newpoint = true;
			
		 },

		
		discardNewPointView: function(eventContext){
			
			var cal_set = CommonHandler._getAdditionalResource(eventContext,"dataSheetResource.calibrationpointlist");
			if(cal_set.getCurrentRecord().newpoint){
				cal_set.getCurrentRecord().deleteLocal();
				cal_set.setCurrentIndexByRecord(this.pointset);
			}
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		_validateNewPointData: function(poinSet){
			
			var point_length =  poinSet.data.length;
			var new_point = poinSet.data[point_length-1].point;
			if(new_point == '' || new_point == null)
				return {'validate': false, 'message': this.validation_fail_message['POINT_MISSING']};


			for(var i = 0; i < point_length - 1; i++){
				if(new_point == poinSet.data[i].point){
					return {'validate': false, 'message': this.validation_fail_message['POINT_DUPLICATE']};
				}
			}

			return {'validate': true, 'message': ''};	
		},

		commitNewPointView: function(eventContext){
			var pointSet = CommonHandler._getAdditionalResource(eventContext,"dataSheetResource.calibrationpointlist");
			var result = this._validateNewPointData(pointSet);
			if(!result.validate)
			{
				eventContext.application.showMessage(MessageService.createStaticMessage(result.message).getMessage());
				return;
			}
			this.newPoint.newpoint = false;
			var self = this;
			eventContext.application.showBusy();
					
			self.cleanDependentResourceData();
			eventContext.application.hideBusy();
			eventContext.ui.hideCurrentView(PlatformConstants.CLEANUP);				
			
		},
		
		newAnalogCalibrationPointDataChange: function(eventContext){
			
			var input_value_local = this.newPoint.getPendingOrOriginalValue('inputvalue_local');
			var re = new RegExp(window.anywhere_validation_regex);
			if(!re.test(input_value_local))
			{
				this.newPoint.setNullValue('inputvalue_local');
				this.newPoint.setNullValue('outputvalue_local');
				return;
			}
			this.newPoint.set('inputvalue', input_value_local);
			var inputValue = this.newPoint.get('inputvalue');
			
			var dsconfiglist = null;
			try {
				
				dsconfiglist = DataSheetObject.getRelatedDSConfig();
			}
			catch(e) {
				throw new PlatformRuntimeException('noDSConfig');
				
			}
			
			if(dsconfiglist == null) {
				throw new PlatformRuntimeException('noDSConfig');
			}
			 
			var calc = new DataSheetCalculation(dsconfiglist);	
			var inputValue = calc.fromDisplayableValue(this.newPoint.getPendingOrOriginalValue('inputvalue'));
			
			if(inputValue == '' || inputValue == null)
				return
			//else
			//	inputValue = parseFloat(inputValue);

			
			//var point = this.application.getResource('dataSheetResource.calibrationpointlist').getCurrentRecord();
			
			
			if (inputValue && this.assetfunction.get("cliplimitsin")) {
					var instrCalRangeFrom = calc.fromDisplayableValue(this.assetfunction.get("instrcalrangefrom"), 'double');
					var instrCalRangeTo = calc.fromDisplayableValue(this.assetfunction.get("instrcalrangeto"), 'double');
					var lowerRangeLimit = (instrCalRangeFrom <= instrCalRangeTo) ? instrCalRangeFrom : instrCalRangeTo;
					var upperRangeLimit = (instrCalRangeFrom > instrCalRangeTo) ? instrCalRangeFrom : instrCalRangeTo;
					if ((inputValue < lowerRangeLimit) || (inputValue > upperRangeLimit)) {
						eventContext.getCurrentRecord()._pendingValues.inputvalue = '';
						throw new PlatformRuntimeException('limitClipsInValidation', ['Nominal Input' + ' ' + inputValue, instrCalRangeFrom, instrCalRangeTo]);
					}
			}

			
			var resultAttrs = calc.calculateDesiredOutputForNewAnalog(inputValue, this.assetfunction, this.newPoint);
			if(resultAttrs)
			{
				this.newPoint.set('outputvalue', resultAttrs.outputvalue);
				this.newPoint.set('ron1lower', resultAttrs.ron1lower);
				this.newPoint.set('ron1upper', resultAttrs.ron1upper);
				this.newPoint.set('rontype', resultAttrs.rontype);
			}
			
			if(resultAttrs.outputvalue)
				this.newPoint.set('outputvalue_local', resultAttrs.outputvalue.replace(',', '.'));
			else
				this.newPoint.setNullValue('outputvalue_local');
			
			this.newPoint.set('inputvalue', calc.toDisplayableValue(this.newPoint.get('inputvalue'), 'decimal', {'places':this.assetfunction.inputprecision, 'round': -1})) ; 

			
		},
		
		handleBackButton: function(eventContext){
			
		}
		
		
	})
})
