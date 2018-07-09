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

define("platform/util/DateTimeUtil", [], 
function(){	
	return {
/**@memberOf platform.util.DateTimeUtil */
		fromDateTimeToDate: function(aDate){
			return new Date(aDate.getFullYear(), aDate.getMonth(), aDate.getDate(), 0, 0, 0, 0);
		},
		fromDateTimeToTime: function(aDate){
			return new Date(1970, 0, 1, aDate.getHours(), aDate.getMinutes(), aDate.getSeconds(), aDate.getMilliseconds());
		},
		fromDateAndTimeToDateTime: function(aDate, aTime){
			return new Date(aDate.getFullYear(), aDate.getMonth(), aDate.getDate(), aTime.getHours(), aTime.getMinutes(), aTime.getSeconds(), aTime.getMilliseconds());
		},
		oneSecondInMilliseconds: function(){
			return 1000; 
		},
		oneMinuteInMilliseconds: function(){
			return this.oneSecondInMilliseconds() * 60;
		},
		oneHourInMilliseconds: function(){
			return this.oneMinuteInMilliseconds() * 60;
		},
		oneDayInMilliseconds: function(){
			return this.oneHourInMilliseconds() * 24;
		},
		oneMinuteInHours: function(){
			return 0.016666666666666666;
		},
		fromMillisecondsToHours: function(valueInMilliseconds){
			return valueInMilliseconds / this.oneHourInMilliseconds();
		},
		fromHoursToMilliseconds: function(valueInHours){
			return parseInt(valueInHours * this.oneHourInMilliseconds(),10);
		},
		fromDurationToMilliseconds: function(/* hh:mm */duration) {
			// converting from the format hh:mm to number
			var hours = 0;
			var minutes = 0;
			var durationArray = duration.split(':');
			if (durationArray.length > 0) {
				hours = durationArray[0];
				if (durationArray.length > 1) {
					minutes = durationArray[1];
				}
			}
			return this.fromHoursToMilliseconds(parseFloat(hours) + parseFloat(minutes/60));
		},
		absDifferenceInMilliseconds: function(dateOne, dateTwo){
			return Math.abs(dateOne - dateTwo);
		},
		absDifferenceInSeconds: function(dateOne, dateTwo){
			return Math.round(this.absDifferenceInMilliseconds(dateOne, dateTwo) / this.oneSecondInMilliseconds());
		},
		absDifferenceInMinutes: function(dateOne, dateTwo){
			return Math.round(this.absDifferenceInMilliseconds(dateOne, dateTwo) / this.oneMinuteInMilliseconds());
		},
		zeroSecondsAndMilliseconds: function(aDate){
			var newDate = new Date(aDate);
			newDate.setSeconds(0);
			newDate.setMilliseconds(0);
			return newDate;
		}, 
		roundToNearestMinute: function(aDate){
			var newDate = new Date(aDate);
			if (aDate.getSeconds() > 30) {
				newDate.setMinutes(aDate.getMinutes() + 1);
			}
			newDate.setSeconds(0);
			newDate.setMilliseconds(0);
			return newDate;
		}
	};
});
