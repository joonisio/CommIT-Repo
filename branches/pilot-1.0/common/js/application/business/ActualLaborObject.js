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

define("application/business/ActualLaborObject", 
["platform/util/DateTimeUtil",
 "application/business/WorkOrderStatusHandler", 
 "platform/exception/PlatformRuntimeException",
 "dojo/date/stamp",
 "platform/logging/Logger"], 
 function(DateTimeUtil, 
		 WorkOrderStatusHandler, 
		 PlatformRuntimeException,
		 dateISOFormatter,
		 Logger) {
	return {		
/**@memberOf application.business.ActualLaborObject */
		reportWork: function(actualLabor, labor, craftrate, start, end, duration, laborTransactionTypeSet, timerStatus, transType){
			actualLabor.set('laborcode', labor.get('laborcode'));
			actualLabor.set('craft', craftrate.get('craft'));
			actualLabor.set('skilllevel', craftrate.get('skilllevel'));
			actualLabor.set('vendor', craftrate.get('vendor'));
			
			//TODO Need move this to UI Component level - Date Picker
			start = DateTimeUtil.zeroSecondsAndMilliseconds(start);
			end = DateTimeUtil.zeroSecondsAndMilliseconds(end);
			
		    actualLabor.setDateValue('startdate', DateTimeUtil.fromDateTimeToDate(start));
			actualLabor.setDateValue('starttime', start);

			//Very important that we set this in this order because otherwise finish time will be overridden when actual labor hours is set
			actualLabor.set('actuallaborhours', duration);
			
			//Very important that we set this in this order because otherwise finishdate will be overridden when starttime is set
			actualLabor.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(end));
			actualLabor.setDateValue('finishtime', end);
			
			// defect 147685 - if we pass in a transType, then we use it, otherwise we use default 'WORK'
			if (!transType) {
				//TODO: lookup the laborTransactionTypeSet directly rather than passing it in.
				var defaultLaborTransactionType = 'WORK';
				//filter to the external value for work
				laborTransactionTypeSet = laborTransactionTypeSet.find('maxvalue == $1 && defaults == $2' , defaultLaborTransactionType, true);
				if (laborTransactionTypeSet && laborTransactionTypeSet.length > 0) {
					var laborTransactionType = laborTransactionTypeSet[0];
					defaultLaborTransactionType = laborTransactionType.get("value");
				}
				transType = defaultLaborTransactionType;
			}
			actualLabor.set('transtype', transType); 
			
			//If labor is created by timer, set timer status as COMPLETE
			if(timerStatus){
				actualLabor.set('timerstatus', timerStatus);
			}
		},
		
		setDefaultValues : function(actualLabor, myLaborSet, myLaborCraftSet, laborTransactionTypeSet, currentDateTime) {
			var defaultLaborTransactionType = 'WORK';
			laborTransactionTypeSet = laborTransactionTypeSet.find('maxvalue == $1 && defaults == $2', defaultLaborTransactionType, true);
			if(laborTransactionTypeSet.length > 0) {
				defaultLaborTransactionType = laborTransactionTypeSet[0].get('value');
			}
			actualLabor.set('transtype', defaultLaborTransactionType);
			actualLabor.set('actuallaborhours',0);
			
			if(myLaborSet.count() > 0 && myLaborCraftSet.count() > 0) {
				var myLabor =  myLaborSet.getRecordAt(0);
				var myLaborCraft = myLaborCraftSet.getRecordAt(0);
				actualLabor.set('laborcode', myLabor.get('laborcode'));
				actualLabor.set('craft', myLaborCraft.get('craft'));
				actualLabor.set('skilllevel', myLaborCraft.get('skilllevel'));
				actualLabor.set('vendor', myLaborCraft.get('vendor'));
				actualLabor.set('contractnum', myLaborCraft.get('contractnum'));
				actualLabor.set('laborname', myLaborCraft.get('laborname'));
			}
			actualLabor.setDateValue("startdate", DateTimeUtil.fromDateTimeToDate(currentDateTime));
		},

		ensureTimeHasProperDate: function(time, date){
			//Start and end time in entered in maximo come back with the default date of Jan 1, 1970 so if the 
			//start/end Date is in daylight savings it throws the date off by an hour.  This checks to see if the dates
			//are in the same timezone (have same offset) and if not returns an adjusted time.  This appears to be an issue in
			//windows
			if(time && date){
				if (WL.Client.getEnvironment() == WL.Environment.WINDOWS8 ){
					var checkTime = DateTimeUtil.fromDateTimeToDate(time);
					var checkDate = DateTimeUtil.fromDateTimeToDate(date);
					if (checkTime.getTimezoneOffset() > checkDate.getTimezoneOffset()) {
						//This is a hack to get around what maybe a Maximo/Java bug. 
					    if (checkTime.getTimezoneOffset() == 0) {
					        time.setHours(time.getHours() + 1);
					    }
					    else {
					        time.setHours(time.getHours() - 1);
					    }
					}
				}
				return DateTimeUtil.fromDateAndTimeToDateTime(date, time);
			}
			return null;
		},
		
		onInitialize : function(actualLabor) {
			
			var startDate = actualLabor.getAsDateOrNull('startdate');
			var startTime = actualLabor.getAsDateOrNull('starttime');
			var newTime = this.ensureTimeHasProperDate(startTime, startDate);
			if (newTime){
				actualLabor.starttime = dateISOFormatter.toISOString(newTime);
			}
			var finishDate = actualLabor.getAsDateOrNull('finishdate');
			var finishTime = actualLabor.getAsDateOrNull('finishtime');
			newTime = this.ensureTimeHasProperDate(finishTime, finishDate);
			if (newTime){
				actualLabor.finishtime = dateISOFormatter.toISOString(newTime);
			}
			
		},
				
		onAdd: function(actualLabor) {
			actualLabor.set("dontDiscard", false);
		},
		
		beforeSave : function(actualLabor) {
			this.setLaborHours(actualLabor);
			
			var startdate = actualLabor.getAsDateOrNull('startdate');
			if (!startdate)
				throw new PlatformRuntimeException('startdateisrequired');
			var starttime = actualLabor.getAsDateOrNull('starttime');
			var finishdate = actualLabor.getAsDateOrNull('finishdate');
			var finishtime = actualLabor.getAsDateOrNull('finishtime');
			
			// Validate when Start Date and Time; Finish Date and Time all populated
			if (startdate && starttime && finishdate && finishtime){
				// Validate Start and Finish DateTimes
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				var finishdatetime = DateTimeUtil.fromDateAndTimeToDateTime(finishdate, finishtime);
				this.checkDates(startdatetime, finishdatetime);
				
				var duration = actualLabor.getDurationInMillisOrNegative('regularhours');
				//Need to check one or the other for duration
				if (duration < 0) {
					duration = actualLabor.getDurationInMillisOrNegative('premiumpayhours')
				}
				this.checkDuration(startdatetime, finishdatetime, duration);
			}
			else{
				// Validate Start Date and Finish Date only, regardless of Time values
				this.checkDates(startdate, finishdate);
			}
			
		},
		
		canAddActualLabor: function(workOrder){
			var currentWOStatus= WorkOrderStatusHandler.getInstance().toInternalState(workOrder.get("status"))
			
			 return currentWOStatus== "APPR" || currentWOStatus== "INPRG" || currentWOStatus== "COMP" || currentWOStatus== "WSCH" || 
					currentWOStatus== "WMATL";
		},
		
		setLaborHours : function(actualLabor){
			var premiumpaycode = actualLabor.get("premiumpaycode");

			if (premiumpaycode == null || premiumpaycode == ''){
				actualLabor.set("regularhours", actualLabor.get("actuallaborhours"));
				actualLabor.setNullValue("premiumpayhours");
			}
			else{
				actualLabor.set("premiumpayhours", actualLabor.get("actuallaborhours"));
				actualLabor.setNullValue("regularhours");
			}
			
		},
		
		checkDates: function(startTime, endTime) {
			Logger.trace("startTime: " + startTime + " endTime: " + endTime);
			if (endTime) {
				startTime = DateTimeUtil.zeroSecondsAndMilliseconds(startTime);
				endTime = DateTimeUtil.zeroSecondsAndMilliseconds(endTime);
				if(endTime < startTime){																	
					throw new PlatformRuntimeException('endtimebeforestarttime');
				}
			}
		},
		
		checkDuration: function(startTime, endTime, /*millis*/ newDuration) {
			Logger.trace("startTime: " + startTime + " endTime: " + endTime + " newDuration: " + newDuration);
			if (startTime && endTime) {
				startTime = DateTimeUtil.zeroSecondsAndMilliseconds(startTime);
				endTime = DateTimeUtil.zeroSecondsAndMilliseconds(endTime);
				this.checkDates(startTime, endTime);
				if (newDuration < 0) 
					throw new PlatformRuntimeException('invalidduration');
				if(endTime && startTime && (endTime - startTime) < newDuration){
					//If the duration is larger than endTime - startTime, we have a problem houston					
					throw new PlatformRuntimeException('durationlongerthantimes');
				}
			}
		},
		
		actualLaborHoursChanged: function(actualLabor, newHoursString){
			var enddate = actualLabor.getAsDateOrNull('finishdate');
			var endtime = actualLabor.getAsDateOrNull('finishtime');
			var startdate = actualLabor.getAsDateOrNull('startdate');
			var starttime = actualLabor.getAsDateOrNull('starttime');
			var newHours = actualLabor.get('actuallaborhours');
			
			if (startdate && starttime && newHours){
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				//TODO: fix enddatetime to handle timezone correctly
				var enddatetime = new Date(startdatetime.getTime() + DateTimeUtil.fromHoursToMilliseconds(newHours));
				//Note: sometimes due to calculations, the time comes out just shy of the minute
				enddatetime = DateTimeUtil.roundToNearestMinute(enddatetime);
				
				this.checkDates(startdatetime, enddatetime);
				//validate duration
				this.checkDuration(startdatetime, enddatetime, newHours);
				
				
				var newFinishDate = DateTimeUtil.fromDateTimeToDate(enddatetime);
				var newFinishTime = DateTimeUtil.fromDateTimeToTime(enddatetime);
				//Only set them if they've actually changed
				if (!enddate || enddate.getTime() != newFinishDate.getTime()) {
					actualLabor.setDateValue('finishdate', newFinishDate);
				}
				if (!endtime || endtime.getTime() != newFinishTime.getTime()) {
					actualLabor.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(enddatetime));
				}
	           
			}
			
		},
		
		startTimeChanged: function(actualLabor, newStartTimeString){
			var enddate = actualLabor.getAsDateOrNull('finishdate');
			var endtime = actualLabor.getAsDateOrNull('finishtime');
			var startdate = actualLabor.getAsDateOrNull('startdate');
			var newStartTime = actualLabor.getAsDateOrNull('starttime');
			
			if (startdate && newStartTime && enddate && endtime) {
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, newStartTime);
				var enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(enddate, endtime);
				this.checkDates(startdatetime, enddatetime);
			}
			
			var hours = actualLabor.get('actuallaborhours');
			// check if hours is null, if so set value to zero
			if (!hours){
				actualLabor.set('actuallaborhours',0);
			}
			
			if (startdate && newStartTime){
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, newStartTime);
				//TODO: fix enddatetime to handle timezone correctly
				var enddatetime = new Date(startdatetime.getTime() + DateTimeUtil.fromHoursToMilliseconds(hours));
				//Note: sometimes due to calculations, the time comes out just shy of the minute
				enddatetime = DateTimeUtil.roundToNearestMinute(enddatetime);
				actualLabor.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(enddatetime));
	            actualLabor.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(enddatetime));
			}
		},
		
		startDateChanged: function(actualLabor, newStartDateString){
			var enddate = actualLabor.getAsDateOrNull('finishdate');
			var endtime = actualLabor.getAsDateOrNull('finishtime');
			var newStartDate = actualLabor.getAsDateOrNull('startdate');
			var starttime = actualLabor.getAsDateOrNull('starttime');
			
			if (newStartDate && enddate) {
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(newStartDate, starttime);
				var enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(enddate, endtime);
				this.checkDates(startdatetime, enddatetime);
			}
			
			var hours = actualLabor.get('actuallaborhours');
			if (newStartDate && starttime){
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(newStartDate, starttime);
				//TODO: fix enddatetime to handle timezone correctly
				var enddatetime = new Date(startdatetime.getTime() + DateTimeUtil.fromHoursToMilliseconds(hours));
				//Note: sometimes due to calculations, the time comes out just shy of the minute
				enddatetime = DateTimeUtil.roundToNearestMinute(enddatetime);
				actualLabor.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(enddatetime));
	            actualLabor.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(enddatetime));				
			}
				
		},		
		
		finishDateChanged: function(actualLabor, newFinishDateString){
			var newEndDate = actualLabor.getAsDateOrNull('finishdate');
			var endtime = actualLabor.getAsDateOrNull('finishtime');
			var startdate = actualLabor.getAsDateOrNull('startdate');
			var starttime = actualLabor.getAsDateOrNull('starttime');
			
			if (startdate && newEndDate) {
				if (endtime){					
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				var enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(newEndDate, endtime);
				var duration = DateTimeUtil.fromHoursToMilliseconds(actualLabor.get('actuallaborhours'));
				this.checkDuration(startdatetime, enddatetime, duration);
				}
				else{
					this.checkDates(startdate, newEndDate)
				}
			}
		},
		
		finishTimeChanged: function(actualLabor, newFinishTimeString){
			var enddate = actualLabor.getAsDateOrNull('finishdate');
			var newEndTime = actualLabor.getAsDateOrNull('finishtime');
			var startdate = actualLabor.getAsDateOrNull('startdate');
			var starttime = actualLabor.getAsDateOrNull('starttime');
			
			if (startdate && starttime && enddate && newEndTime) {
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				var enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(enddate, newEndTime);
				var duration = DateTimeUtil.fromHoursToMilliseconds(actualLabor.get('actuallaborhours'));
				this.checkDuration(startdatetime, enddatetime, duration);
			}
			
		},
		
		startDateTimeChanged: function(actualLabor, newStartDateTimeString){			
			var end = actualLabor.getAsDateOrNull("finishdatetime");
			var newStartDateTime = dateISOFormatter.fromISOString(newStartDateTimeString);
			if (end) {
				this.checkDates(newStartDateTime, end);			
			}
			newStartDateTime = DateTimeUtil.zeroSecondsAndMilliseconds(newStartDateTime);
            actualLabor.setDateValue('startdate', DateTimeUtil.fromDateTimeToDate(newStartDateTime));
            actualLabor.setTimestampValue('starttime', DateTimeUtil.fromDateTimeToTime(newStartDateTime));
            this.setDuration(actualLabor, newStartDateTime, end);		
		},
		
		finishDateTimeChanged: function(actualLabor, newFinishDateTimeString){			
			var start = actualLabor.getAsDateOrNull("startdatetime");
			var newFinishDateTime = dateISOFormatter.fromISOString(newFinishDateTimeString)
			if (start) {				
				this.checkDates(start, newFinishDateTime);
			}
			newFinishDateTime = DateTimeUtil.zeroSecondsAndMilliseconds(newFinishDateTime);
			actualLabor.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(newFinishDateTime));
			actualLabor.setTimestampValue('finishtime',DateTimeUtil.fromDateTimeToTime(newFinishDateTime));
			this.setDuration(actualLabor, start, newFinishDateTime);			
		},
		
		laborcodeChanged: function(actualLabor, newLaborcode, oldLaborcode){
			if(!newLaborcode){
				actualLabor.setNullValue("laborname");
				actualLabor.setNullValue("craft");
				actualLabor.setNullValue("vendor");
				actualLabor.setNullValue("contractnum");
			}
		},
		craftChanged: function(actualLabor, newCraft, oldCraft){
			if(!newCraft){
				actualLabor.setNullValue("skilllevel");
			}
		},
		contractnumChanged: function(actualLabor, newContract, oldContract){
			if(!newContract){
				actualLabor.setNullValue("revisionnum");
			}
		},
		
		setDuration: function(actualLabor, startTime, endTime) {
			/* avoids the situation where the timer was started as 1:00:50 and stopped ad 1:01:20 to count as 0 minutes */
			startTime = DateTimeUtil.zeroSecondsAndMilliseconds(startTime);
			endTime = DateTimeUtil.zeroSecondsAndMilliseconds(endTime);
			
			/* calculates the difference in integer minutes and add that to the start time */
			actualLabor.setDurationInMillis("actuallaborhours", endTime - startTime);
		}
		
		
	};
	
});
