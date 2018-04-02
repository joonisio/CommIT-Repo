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

define("application/handlers/AssetFunctionHandler", 
	   [ "dojo/_base/declare",
	     "application/business/AssetFunctionObject",
	     "application/business/CalibrationPointObject",
	     "platform/format/FormatterService",
	     "platform/model/ModelService",
	     "platform/auth/UserManager",
	     "application/handlers/CommonHandler",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/translation/SynonymDomain",
	     "platform/util/PlatformConstants",
	     "dojo/Deferred",
	     "dojo/_base/array"],
function(declare, AssetFunction, CalibrationPoint, formatterService, ModelService, UserManager, CommonHandler, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, SynonymDomain, PlatformConstants, Deferred, arrayUtil) {
	return declare( ApplicationHandlerBase, {
		
/**@memberOf application.handlers.AssetFunctionHandler */
		initCalPoints : function(eventContext) {
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var wo = eventContext.application.getResource('workOrder').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			if(assetfunc) {
				var queryAsString = null;
				if(wo.wonum != null){
					queryAsString = "instrseq == " + assetfunc.instrseq + " && dsplannum == '" + datasheet.dsplannum + "' && revisionnum == " + datasheet.revisionnum;	
				} else {
					//new workorder offline, data has not synced with server yet
					queryAsString = "instrseq == " + assetfunc.instrseq + " && dsplannum == '" + datasheet.dsplannum + "' && revisionnum == " + null;
				}
				
				datasheet.calibrationpointlist.clearFilterAndSort();
				datasheet.calibrationpointlist.filter(queryAsString);
				datasheet.set('calibrationpointlistsize', datasheet.calibrationpointlist.count() + "");
				
				// ensure CalibrationPointObject.onInitialize is properly called for each point
				arrayUtil.forEach(datasheet.calibrationpointlist.data, function(point, index){
					CalibrationPoint.setDisplayAndLocalValues(point, assetfunc); 
				});
			}
		},

		setCalPointAsFoundTransitionFromAverage: function(eventContext) {

			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();

			var transitionTo = "WorkExecution.CalPointsAsFound";

			// append appropriate suffix
			if (assetfunc.calfunction == true){  // function check
				transitionTo += "Function";
			}
			else if (assetfunc.caldynamic == true){  // dynamic check
				transitionTo += "Dynamic";
			}
			else if (assetfunc.calpoint == true){  // calibration points
				if(this._isAnalog(eventContext)){
					transitionTo += "Analog";
				} else {
					transitionTo += "Discrete";
				}
			}

			this.filterOutAverageCalPointsList(eventContext);
			eventContext.ui.show(transitionTo);

		},

		setCalPointAsLeftTransitionFromAverage: function(eventContext) {

			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();

			var transitionTo = "WorkExecution.CalPointsAsLeft";

			// append appropriate suffix
			if (assetfunc.calfunction == true){  // function check
				transitionTo += "Function";
			}
			else if (assetfunc.caldynamic == true){  // dynamic check
				transitionTo += "Dynamic";
			}
			else if (assetfunc.calpoint == true){  // calibration points
				if(this._isAnalog(eventContext)){
					transitionTo += "Analog";
				} else {
					transitionTo += "Discrete";
				}
			}
			
			this.filterOutAverageCalPointsList(eventContext);
			eventContext.ui.show(transitionTo);
		},

		filterOutAverageCalPointsList : function(eventContext){
			var calpoints = this.application.getResource('dataSheetResource.calibrationpointlist');
			var record = calpoints.getCurrentRecord();
			
			if(record == null || record.wonum == null){
				//offline new workorder has not yet synced
				var record = eventContext.getCurrentRecord();
				var dsplannum = record.dsplannum;
				var instrseq = record.instrseq;
				var point = record.point;
				var revisionnum = record.revisionnum;
				calpoints.clearFilterAndSort();
				
				if(revisionnum == null){
					calpoints.filter('dsplannum == $1 && instrseq == $2 && point == $3 && isaverage == false',dsplannum,instrseq,point);
				} else {
					calpoints.filter('dsplannum == $1 && revisionnum == $2 && instrseq == $3 && point == $4 && isaverage == false',dsplannum,revisionnum,instrseq,point);	
				}
				

			} else {
				//connected or wonum exists
				var wonum = record.wonum;
				var siteid = record.siteid;
				var dsplannum = record.dsplannum;
				var revisionnum = record.revisionnum;
				var instrseq = record.instrseq;
				var point = record.point;
				calpoints.clearFilterAndSort();
				calpoints.filter('wonum == $1 && siteid == $2 && dsplannum == $3 && revisionnum == $4 && instrseq == $5 && point == $6 && isaverage == false',wonum,siteid,dsplannum,revisionnum,instrseq,point);
			}
			
			var size = calpoints.data.length;
			arrayUtil.forEach(calpoints.data, function(point,index){
				point.set('localrecordcount', index+1 +' / '+size);
			});
			
		},
		
		setAvgAsFoundPointTransition: function(eventContext) {
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			if(datasheet.assetfunctionlist && datasheet.assetfunctionlist.getCurrentRecord()) {
				assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			}

			if (assetfunc && assetfunc.repeatable) {
				eventContext.transitionTo = "WorkExecution.GroupCalibrationPointAsFound";
				eventContext.transitionTo += assetfunc.plantype == 'ANALOG' ? "Analog" : "Discrete";
			}else {
				eventContext.transitionTo = "WorkExecution.CalPointsAsFound";
				this.setCalPointTransition(eventContext);
			}

		},

		setAvgAsLeftPointTransition: function(eventContext) {
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			if(datasheet.assetfunctionlist && datasheet.assetfunctionlist.getCurrentRecord()) {
				assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			}

			if (assetfunc && assetfunc.repeatable) {
				eventContext.transitionTo = "WorkExecution.GroupCalibrationPointAsLeft";
				eventContext.transitionTo += assetfunc.plantype == 'ANALOG' ? "Analog" : "Discrete";
			}else {
				eventContext.transitionTo = "WorkExecution.CalPointsAsLeft";
				this.setCalPointTransition(eventContext);
			}

		}, 
		
		setCalPointTransition : function(eventContext) {
			// set transition to analog or discrete cal points list, function or dynamic checks
			// append 'Analog', 'Discrete', 'Function', 'Dynamic' to existing transitionTo

			// strip off any Analog/Discrete/Function/Dynamic suffix
			var x = 0;
			if ((x = eventContext.transitionTo.lastIndexOf('Analog')) > 0 || 
				(x = eventContext.transitionTo.lastIndexOf('Discrete')) > 0 ||
				(x = eventContext.transitionTo.lastIndexOf('Function')) > 0 ||
				(x = eventContext.transitionTo.lastIndexOf('Dynamic')) > 0) {
				eventContext.transitionTo = eventContext.transitionTo.substring(0, x);
			}

			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();

			// append appropriate suffix
			if (assetfunc.calfunction == true){  // function check
				eventContext.transitionTo = eventContext.transitionTo + "Function";
			}
			else if (assetfunc.caldynamic == true){  // dynamic check
				eventContext.transitionTo = eventContext.transitionTo + "Dynamic";
			}
			else if (assetfunc.calpoint == true){  // calibration points
				if(this._isAnalog(eventContext)){
					eventContext.transitionTo = eventContext.transitionTo + "Analog";
				} else {
					eventContext.transitionTo = eventContext.transitionTo + "Discrete";
				}
			}

		},
		
		showAnalogNonRepeatable: function(eventContext) {
			eventContext.setDisplay(this._isAnalog(eventContext) && !this._isRepeatable());
		},
		
		showAnalogRepeatable: function(eventContext) {
			eventContext.setDisplay(this._isAnalog(eventContext) && this._isRepeatable());
		},
		
		showDiscreteNonRepeatable: function(eventContext) {
			eventContext.setDisplay(this._isDiscrete(eventContext) && !this._isRepeatable());
		},
		
		showDiscreteRepeatable: function(eventContext) {
			eventContext.setDisplay(this._isDiscrete(eventContext) && this._isRepeatable());
		},
		
		showAnalog : function(eventContext){
			eventContext.setDisplay(this._isAnalog(eventContext));
		},
		
		showDiscrete : function(eventContext){
			eventContext.setDisplay(this._isDiscrete(eventContext));
		},

		_isAnalog : function(eventContext, planType){
			return this._getPlanTypeSynVal(eventContext) == "ANALOG" ? true: false;
		},
		
		_isDiscrete : function(eventContext, planType){
			return this._getPlanTypeSynVal(eventContext) == "DISCRETE" ? true: false;
		},
		
		_isRepeatable : function() {
			var assetfunc = this.application.getResource('dataSheetResource.assetfunctionlist');
			var record = assetfunc.getCurrentRecord();
			return record.get('repeatable');
		},
		
		_getPlanTypeSynVal : function(eventContext) {
			var datasheet = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
			var assetfunc = datasheet.assetfunctionlist.getCurrentRecord();
			var domainPlanType = CommonHandler._getAdditionalResource(eventContext,'domainplantype');
			return SynonymDomain.resolveToInternal(domainPlanType, assetfunc.plantype);
		},
		
		checkMissingOrBroken : function(eventContext) {
			var domaincalstatus = eventContext.application.getResource('domaincalstatus');
			var attrCalStatus = eventContext.metaData.name.search('asfound') >= 0 ? 'asfoundcalstatus' : 'asleftcalstatus';
			var instr = eventContext.getCurrentRecord();
			var maxvalue = SynonymDomain.resolveToInternal(domaincalstatus, instr[attrCalStatus]);
			if(maxvalue == 'MISSING' || maxvalue == 'BROKEN') {
				var ds = eventContext.application.getResource('dataSheetResource').getCurrentRecord();
				ds.set(attrCalStatus, instr[attrCalStatus]);
				ds.__changedAttributes.attrCalStatus = attrCalStatus;
			}
		}

	});
});
