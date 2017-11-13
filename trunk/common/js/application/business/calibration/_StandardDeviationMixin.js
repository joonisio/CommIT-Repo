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

define("application/business/calibration/_StandardDeviationMixin", 
		["dojo/_base/array",
		 "dojo/_base/lang",
		 "dojo/_base/declare"], 
function(arrayUtil, lang, declare) {
	
	DEVIATION_N = '1';
	DEVIATION_N_MINUS_1 = '2';
	
	return {
		// Mixin class for application.business.calibration.DataSheetCalculation
		
/**@memberOf application.business.calibration._StandardDeviationMixin */
		calculateAvgAndStdDeviation: function(prefix, points, avgpoint) {
			/* prefix 		- 'asfound' or 'asleft'
			 * points 		- ModelDataSet filtered by 'isaverage = false' calibration points (repeatables)
			 * avgpoint 	- ModelData average calibration point record, 'isaverage = true'
			 */
			var self = this;
			var stdPrefix = prefix == 'asfound' ? 'asf' : 'asl';
			var toltruncate = this._getRoundOption('toltruncate');
			if(avgpoint.plantype == 'ANALOG') {
				var avginput = this._getAverageForAttr(prefix, points, 'input', true);
				var options = {places: self.precisionSet.avginputprecision, round: toltruncate};
				avgpoint.set(prefix + 'input', this.toDisplayableValue(avginput, 'decimal', options));
				var avgoutput = this._getAverageForAttr(prefix, points, 'output', false);
				options.places = self.precisionSet.avgoutputprecision;
				avgpoint.set(prefix + 'output', this.toDisplayableValue(avgoutput, 'decimal', options));
				var stddevinput = this._getStandardDeviationForAttr(prefix, points, avginput, 'input');
				var stddevoutput = this._getStandardDeviationForAttr(prefix, points, avgoutput, 'output');
				options.places = self.precisionSet.avginputprecision;
				avgpoint.set(stdPrefix + 'inputstddev', this.toDisplayableValue(stddevinput, 'decimal', options));
				options.places = self.precisionSet.avgoutputprecision;
				avgpoint.set(stdPrefix + 'outputstddev', this.toDisplayableValue(stddevoutput, 'decimal', options));
			}
			else {
				// discrete setpoint
				var avgsetpoint = this._getAverageForAttr(prefix, points, 'setpoint', true);
				var stddevsetpoint = this._getStandardDeviationForAttr(prefix, points, avgsetpoint, 'setpoint');
				var options = {places: self.precisionSet.avgsetpointprecision, round: toltruncate};
				avgpoint.set(prefix + 'setpoint', this.toDisplayableValue(avgsetpoint, 'decimal', options));
				avgpoint.set(stdPrefix + 'setptstddev', this.toDisplayableValue(stddevsetpoint, 'decimal', options));
			}
			return avgpoint;
		},
		
		_getAverageForAttr: function(prefix, points, attr, resetPrecision) {
			if(resetPrecision) {
				this.resetPrecisionSet();
			}
			var sum = 0;
			for(var i = 0; i < points.count(); i++) {
				var point = points.getRecordAt(i);
				var value = point.get(prefix + attr);
				this._setPrecisionForAttr(attr, this.decimalPlacesOf(value.replace(window.anywhere_locale_seperator, '.')));
				sum += this.fromDisplayableValue(value);
				
			}
			return sum / points.count();
		},

		_getStandardDeviationForAttr: function(prefix, points, avg, attr) {
			var n = 1;
			var length = points.count();
			switch (this.dsconfig.get('stddev')) {
			case DEVIATION_N:
				n = length;
				break;
			case DEVIATION_N_MINUS_1:
				n = length - 1;
				break;
			default:
				n = length;
			}
			
			var sumOfSquaredDiffs = 0;
			for(var i = 0; i < length; i++) {
				var point = points.getRecordAt(i);
				
				var value = this.fromDisplayableValue(point.get(prefix + attr));
				sumOfSquaredDiffs += Math.pow(value - avg, 2);
			}
			return Math.sqrt(sumOfSquaredDiffs / n);
		},
		
		precisionSet: {
			'avginputprecision': 0,
			'avgoutputprecision': 0,
			'avgsetpointprecision': 0
		},
		
		resetPrecisionSet: function(){
			this.precisionSet['avginputprecision'] = 0;
			this.precisionSet['avgoutputprecision'] = 0;
			this.precisionSet['avgsetpointprecision'] = 0;
		},
		
		_setPrecisionForAttr: function(attr, value) {
			var self = this;
			switch(attr) {
			case 'input':
				self.precisionSet.avginputprecision = value > self.precisionSet.avginputprecision ? value : self.precisionSet.avginputprecision;
				break;
			case 'output':
				self.precisionSet.avgoutputprecision = value > self.precisionSet.avgoutputprecision ? value : self.precisionSet.avgoutputprecision;
				break;
			case 'setpoint':
				self.precisionSet.avgsetpointprecision = value > self.precisionSet.avgsetpointprecision ? value : self.precisionSet.avgsetpointprecision;
				break;
			}
		},

	};
});
