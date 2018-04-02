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

define("application/business/AssetFunctionObject", 
		["platform/translation/MessageService",
		 "application/business/CalibrationPointObject",
		 "platform/translation/SynonymDomain"], 
function(MessageService, CalibrationPointObject, SynonymDomain) {
	return {
		
/**@memberOf application.business.AssetFunctionObject */
		onInitialize : function(assetFunction) {
			// check point type is either Calibration Points, Function Check or Dynamic Check
			if (assetFunction.calpoint == true){
				assetFunction.set('checkpointtype_np', MessageService.createStaticMessage('calpoint').getMessage());
			}
			else if (assetFunction.calfunction == true){
				assetFunction.set('checkpointtype_np', MessageService.createStaticMessage('calfunction').getMessage());
			}
			else if (assetFunction.caldynamic == true){
				assetFunction.set('checkpointtype_np', MessageService.createStaticMessage('caldynamic').getMessage());
			}

			// set watches for status
			var afo = this;
			assetFunction.watch('asfoundcalstatus', function(arg){
				this.set('asfoundstatusdesc_np', afo.getStatusDescription(this.get('asfoundcalstatus')));
				this.set('asfoundstatusicon_np', afo.getStatusIcon(this.get('asfoundcalstatus')));
			});

			assetFunction.watch('asfoundstatus', function(arg){
				this.set('asfoundstatusdesc_np', afo.getStatusDescription(this.get('asfoundstatus')));
				this.set('asfoundstatusicon_np', afo.getStatusIcon(this.get('asfoundstatus')));
			});
/* uncomment this in case of problems with asleftstatus
			assetFunction.watch('asleftstatus', function(arg){
				this.set('asleftstatusdesc_np', afo.getStatusDescription(this.get('asleftstatus')));
				this.set('asleftstatusicon_np', afo.getStatusIcon(this.get('asleftstatus')));
			});
*/						
			assetFunction.watch('asleftcalstatus', function(arg){
				this.set('asleftstatusdesc_np', afo.getStatusDescription(this.get('asleftcalstatus')));
				this.set('asleftstatusicon_np', afo.getStatusIcon(this.get('asleftcalstatus')));
			});

			// set status desc and icon
			var asFoundCalStatus = assetFunction.get('asfoundcalstatus');
			var asLeftCalStatus = assetFunction.get('asleftcalstatus');
			if (asFoundCalStatus) {
				assetFunction.set('asfoundstatusdesc_np', this.getStatusDescription(asFoundCalStatus));
				assetFunction.set('asfoundstatusicon_np', this.getStatusIcon(asFoundCalStatus));
			}
			if (asLeftCalStatus) {
				assetFunction.set('asleftstatusdesc_np', this.getStatusDescription(asLeftCalStatus));
				assetFunction.set('asleftstatusicon_np', this.getStatusIcon(asLeftCalStatus));
			}

		},
		
		onAdd: function(task) {
		},
		
		beforeSave: function(task) {
		},
		
		areAssetFunctionsComplete: function(afSet, domainCalStatus, prefix){
			var complete = false;
			for (var x = 0; x < afSet.count(); x++){
				var af = afSet.getRecordAt(x);
				if (af){
					if (af.get('caldynamic') == true){
						// dynamic check completion only matters if the asset function is dynamic and 
						// there are no other non-dynamic asset functions
						
						//Defect 254337: Since this is a function called only to check if the
						//Wo can be completed, a dynamic only af shouldnt be considered for af complete
						//_hasNonDynamicAssetFunctions also need not be checked since 
						//the outer loop takes care of that.
						complete = true;
					}
					else {
						// if asset function is not dynamic, the asset function data must be complete
						if (!this._isComplete(af, domainCalStatus, prefix)){
							return false;
						}
					}
					complete = true;
				}
			}
			return complete;
		},

		_isComplete: function(assetFunction, domainCalStatus, prefix){
			var complete = true;
			// if it's not a dynamic asset function, check to see if the asfound/asleft status is set... the asset function
			// isn't complete unless it's got a status
			if (assetFunction.get('caldynamic') == false){
				complete = !(assetFunction.isNull('asfoundcalstatus') || assetFunction.isNull('asleftcalstatus'));
			}
			if (complete){
				// now check to see if all calibration points are valid/complete (have input/output/setpoint/unit/pass/fail values)
				var ds = assetFunction.getOwner().getParent();
				if(ds){
					var pointSet = ds.calibrationpointlist;
					if (pointSet){
						var queryAsString = "instrseq == " + assetFunction.instrseq;
						pointSet.clearFilterAndSort();
						pointSet.filter(queryAsString);
						if (assetFunction.get('calpoint') == true) {
							if(prefix) {
								complete = this._areCalPointsComplete(ds, pointSet, prefix, domainCalStatus);
							}
							else {
								complete = this._areCalPointsComplete(ds, pointSet, 'asfound', domainCalStatus)	&& this._areCalPointsComplete(ds, pointSet, 'asleft', domainCalStatus);
							}
						}
						else if (assetFunction.get('calfunction') == true) {
							if(prefix) {
								complete = this._areFunctionChecksComplete(ds, pointSet, prefix, domainCalStatus);
							}
							else {
								complete = this._areFunctionChecksComplete(ds, pointSet, 'asfound', domainCalStatus) && this._areFunctionChecksComplete(ds, pointSet, 'asleft', domainCalStatus);
							}
						}
						else if (assetFunction.get('caldynamic') == true) {
							if(prefix) {
								complete = this._areDynamicChecksComplete(ds, pointSet, prefix, domainCalStatus);
							}
							else {
								complete = this._areDynamicChecksComplete(ds, pointSet, 'asfound', domainCalStatus) && this._areDynamicChecksComplete(ds, pointSet, 'asleft', domainCalStatus);
							}
						}
						pointSet.clearFilterAndSort();
					}
				}
			}
			return complete;
		},
		
		areAsFoundComplete: function(afset) {
			return this.arePartialCompleted(afset, 'asfound');
		}, 
		
		areAsLeftComplete: function(afset) {
			return this.arePartialCompleted(afset, 'asleft');
		},
		
		arePartialCompleted: function(afset, prefix) {
			for (var x = 0; x < afset.count(); x++){
				var af = afset.getRecordAt(x);
				if (af && !af.get('caldynamic') && af.isNull(prefix + 'calstatus')) {
					return false;
				}
			}
			return true;
		},
		
		_hasNonDynamicAssetFunctions: function(afSet){
			for (var x = 0; x < afSet.count(); x++){
				var af = afSet.getRecordAt(x);
				if (af && af.get('caldynamic') == false){
					return true;
				}
			}
			return false;
		},
		
		_areCalPointsComplete: function(ds, pointSet, prefix, domainCalStatus) {
			if(this._isMissingOrBroken(ds, prefix, domainCalStatus)) {
				return true;
			}
			else {
				return CalibrationPointObject.areCalPointsComplete(pointSet, prefix);
			}
		},
		
		_areFunctionChecksComplete: function(ds, pointSet, prefix, domainCalStatus) {
			if(this._isMissingOrBroken(ds, prefix, domainCalStatus)) {
				return true;
			}
			else {
				return CalibrationPointObject.areFunctionChecksComplete(pointSet, prefix);
			}
		},
		
		_areDynamicChecksComplete: function(ds, pointSet, prefix, domainCalStatus) {
			if(this._isMissingOrBroken(ds, prefix, domainCalStatus)) {
				return true;
			}
			else {
				return CalibrationPointObject.areDynamicChecksComplete(pointSet, prefix);
			}
		},
		
		_isMissingOrBroken: function(af, prefix, domainCalStatus) {
			var status = SynonymDomain.resolveToInternal(domainCalStatus, af.get(prefix + 'calstatus'));
			return status == 'MISSING' || status == 'BROKEN';
		},
		
		getStatusIcon: function(status){
			var internalStatus = null;
			try{
				internalStatus = SynonymDomain.resolveToInternal(this._getCalStatusDomain(), status);
				if (internalStatus != null && 
						internalStatus.length > 0 && 
						internalStatus != 'PASS' && 
						internalStatus != 'FAIL')
					return 'WARNING';
			}
			catch(e){
				console.log("getStatusIcon error\n" + e);
			}
			return internalStatus;
		},
		
		getStatusDescription: function(status){
			try{
				var lookupResource = this._getCalStatusDomain();
				if (status && lookupResource){
					lookupResource.clearFilterAndSort();
					var maxvalue = SynonymDomain.resolveToInternal(lookupResource, status);
					var synonymSet = lookupResource.find('maxvalue == $1 && defaults == $2', maxvalue, true);
					var synonym = synonymSet.length > 0 ? synonymSet[0] : null;
					if (synonym){
						return synonym.description;
					}
				}
			}
			catch(e){
				console.log("getStatusDescription error\n" + e);
			}
			return null;
		},
		
		hasSummedCalculations: function(instr, tol) {
			return this._getSummedCalcTypes(instr, tol).length > 0;
		},
		
		_getSummedCalcTypes: function(instr, tol) {
			var calcTypes = [SUMEU, SUMREAD, SUMSPAN, SUMURV];
			var summedCalcTypes = [];
			for(n in calcTypes) {
				var calcType = calcTypes[n];
				var sumvalue = instr.get("tol" + tol + calcType);
				if(sumvalue && sumvalue != '') {
					summedCalcTypes.push(calcType);
				}
			}
			return summedCalcTypes;
		},
		
		summed: null,
		
		getRuledToleranceLower: function(instr, tol, record) {
			return this.getRuledTolerance(instr, tol, false, record);
		},
		
		getRuledToleranceUpper: function(instr, tol, record) {
			return this.getRuledTolerance(instr, tol, true, record);
		},
		
		getRuledTolerance: function(instr, tol, upper, record) {
			if(!this.summed) {
				this.summed = this.hasSummedCalculations(instr, tol);
			}
			if(this.summed) {
				var sumEU = instr.get('tol'+tol+'sumeu') || '0';
				var sumRead = instr.get('tol'+tol+'sumread') || '0';
				var sumSpan = instr.get('tol'+tol+'sumspan') || '0';
				var sumURV = instr.get('tol'+tol+'sumurv') || '0';
				sumEU = new Number(sumEU);
				sumRead = new Number(sumRead);
				sumSpan = new Number(sumSpan);
				sumURV = new Number(sumURV);
				var sumdirection = instr.get('tol'+tol+'sumdirection');
				if(sumdirection == '-') {
					if(!upper) {
						return -sumEU -sumRead -sumSpan -sumURV;
					}
					else {
						return record.get('outputvalue');
					}
				}
				else if(sumdirection == '+') {
					if(!upper) {
						return record.get('outputvalue');
					}
					else {
						return +sumEU +sumRead +sumSpan +sumURV;
					}
				}
				else if(sumdirection == '+/-') {
					if(!upper) {
						return -sumEU -sumRead -sumSpan -sumURV;
					}
					else {
						return 0+sumEU +sumRead +sumSpan +sumURV;
					}
				}
			}
			else {
				var sufix = upper ? 'uppervalue' : 'lowervalue';
				return instr.get('tol' + tol + sufix);
			}
		},
		
		_getCalStatusDomain: function() {
			return window.UI.application.getResource('domaincalstatus');
		}, 
		
		isAnalog: function(af) {
			return af.plantype == 'ANALOG';
		},
		
		isDiscrete: function(af) {
			return af.plantype == 'DISCRETE';
		}
	};
});
