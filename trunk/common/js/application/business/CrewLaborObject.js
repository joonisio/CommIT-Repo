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

define("application/business/CrewLaborObject", 
		["platform/util/DateTimeUtil",
		 "application/business/WorkOrderStatusHandler", 
		 "platform/exception/PlatformRuntimeException",
		 "dojo/date/stamp",
		 "platform/logging/Logger",
			"platform/util/PlatformConstants"], 
		 function(DateTimeUtil, 
				 WorkOrderStatusHandler, 
				 PlatformRuntimeException,
				 dateISOFormatter,
				 Logger,
				 PlatformConstants)  {
	return {
/**@memberOf application.business.CrewLaborObject */
		onInitialize : function(task) {
		},
		onAdd: function(task) {
			
		},
		beforeSave : function(task) {
			
		},
		
		createAtualLbaorForCrew: function(crewlaborLocalSet, actuallaborlist, curr){
			for(var i=0;i<crewlaborLocalSet.count();i++){
				
				var newLabor = actuallaborlist.createNewRecord();	
				var currLabor = crewlaborLocalSet.getRecordAt(i);
				
				if(currLabor.get('actualstaskid') != ""){					
					newLabor.set('actualstaskid',currLabor.get('actualstaskid'));
				}
				
				newLabor.set('laborcode',currLabor.get('laborcode'));
				newLabor.set('laborname',currLabor.get('laborname'));
				newLabor.set('craft',currLabor.get('craft'));
				newLabor.set('skilllevel',currLabor.get('skilllevel'));	
				newLabor.set('position',currLabor.get('position'));
				newLabor.set('vendor',currLabor.get('vendor'));
				newLabor.set('contractnum',currLabor.get('contractnum'));
				
				if(currLabor.get('premiumpaycode')){
					newLabor.set('premiumpaycode',currLabor.get('premiumpaycode'));
					//Don't think we need to check regularhours unless zero is an invalid value
					//if (currLabor.get('regularhours')) {
					newLabor.set('premiumpayhours',currLabor.get('regularhours'));
					newLabor.set('actuallaborhours',currLabor.get('regularhours'));
					//}
				} else {
					//Don't think we need to check regularhours unless zero is an invalid value
					//if (currLabor.get('regularhours')) {
						newLabor.set('regularhours',currLabor.get('regularhours'));
						newLabor.set('actuallaborhours',currLabor.get('regularhours'));
					//}
				}
				
				newLabor.set('timerStatus',curr.get('timerStatus'));
				
				
				var startdate = DateTimeUtil.zeroSecondsAndMilliseconds(currLabor.getAsDateOrNull('startdate'));				
				newLabor.setDateValue('startdate',startdate);
				
				if (currLabor.getAsDateOrNull('starttime')) {
					var starttime = DateTimeUtil.zeroSecondsAndMilliseconds(currLabor.getAsDateOrNull('starttime'));
					newLabor.setDateValue('starttime',starttime);
				}
				if (currLabor.getAsDateOrNull('finishdate')) {
					var enddate = DateTimeUtil.zeroSecondsAndMilliseconds(currLabor.getAsDateOrNull('finishdate'));
					newLabor.setDateValue('finishdate',enddate);
				}
				if (currLabor.getAsDateOrNull('finishtime')) {
					var endtime = DateTimeUtil.zeroSecondsAndMilliseconds(currLabor.getAsDateOrNull('finishtime'));
					newLabor.setDateValue('finishtime',endtime);
				}
																				
				newLabor.set('amcrew',curr.get('crewid'));
				newLabor.set('transtype',currLabor.get('transtype'));
				
			}
			
		},
		
		buildLaborList: function(laborSet, curr, crewlaborSet, currentTime, ModelService){
			if (crewlaborSet && crewlaborSet != PlatformConstants.EMPTY_COMPLEX_FIELD) {
				for(var i=0;i<crewlaborSet.count();i++){				
					var currLabor = crewlaborSet.getRecordAt(i);
					var effectiveDate = currLabor.getAsDateOrNull('effectivedate');
					var endDate = currLabor.getAsDateOrNull('enddate');
					if ( (effectiveDate && effectiveDate < currentTime) && (!endDate || endDate > currentTime)) {
						var newLabor = laborSet.createNewRecord();
	
						if(curr.get('actualstaskid') != ""){	
							newLabor.set('actualstaskid',curr.get('actualstaskid'));
						}
						
						newLabor.set('laborcode',currLabor.get('laborcode'));
						newLabor.set('laborname',currLabor.get('laborname'));
						newLabor.set('craft',currLabor.get('craft'));
						newLabor.set('skilllevel',currLabor.get('skilllevel'));
						newLabor.set('position',currLabor.get('position'));
						newLabor.set('vendor',currLabor.get('vendor'));
						newLabor.set('contractnum',currLabor.get('contractnum'));
						
						if(currLabor.get('premiumpaycode')){
							newLabor.set('premiumpaycode',currLabor.get('premiumpaycode'));
							newLabor.set('premiumpayhours',curr.get('regularhours'));
						} else {
							newLabor.set('regularhours',curr.get('regularhours'));
						}
						
						
						newLabor.set('timerStatus',curr.get('timerStatus'));
		
						newLabor.set('startdate',curr.get('startdate'));
						if (curr.get('starttime')) {
							newLabor.set('starttime',curr.get('starttime'));
						}
						
						if (curr.get('finishdate')) {
							newLabor.set('finishdate',curr.get('finishdate'));
						}
						
						if (curr.get('finishtime')) {
							newLabor.set('finishtime',curr.get('finishtime'));
						}
						
						newLabor.set('amcrew',curr.get('crewid'));
						newLabor.set('transtype',curr.get('transtype'))
						
						//TODO set other fields from labor and from curr
						//newLabor.set('',currLabor.get(''));
					}
					
				}
			}
			return ModelService.save(laborSet);
		},
		setDefaultValues : function(crew, laborTransactionTypeSet, currentDateTime) {
			var defaultLaborTransactionType = 'WORK';
			laborTransactionTypeSet = laborTransactionTypeSet.find('maxvalue == $1 && defaults == $2', defaultLaborTransactionType, true);
			if(laborTransactionTypeSet.length > 0) {
				defaultLaborTransactionType = laborTransactionTypeSet[0].get('value');
			}
			
			//set the defaultLaborTransactionType
			crew.set('transtype', defaultLaborTransactionType);
			
			//Only default this if it's not been set by the timer panel already
			if (!crew.get('regularhours')) {
				crew.set('regularhours', 0);
			}
			
			//Only default this if it's not been set by the timer panel already
			if (!crew.getAsDateOrNull('startdate')) {
				crew.setDateValue("startdate", DateTimeUtil.fromDateTimeToDate(currentDateTime));
			}
		},
		regularHoursChanged: function(crew, newHoursString){
			var enddate = crew.getAsDateOrNull('finishdate');
			var endtime = crew.getAsDateOrNull('finishtime');
			var startdate = crew.getAsDateOrNull('startdate');
			var starttime = crew.getAsDateOrNull('starttime');
			var newHours = crew.get('regularhours');
			
			if (startdate && starttime && newHours){
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				//TODO: fix enddatetime to handle timezone correctly
				var enddatetime = new Date(startdatetime.getTime() + DateTimeUtil.fromHoursToMilliseconds(newHours));
				//Note: sometimes due to calculations, the time comes out just shy of the minute
				enddatetime = DateTimeUtil.roundToNearestMinute(enddatetime);
				
				this.checkDates(startdatetime, enddatetime);
				//validate duration
				this.checkDuration(startdatetime, enddatetime, newHours);
				
				crew.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(enddatetime));
	            crew.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(enddatetime));
	           
			}			
		},
		startTimeChanged: function(crew, newStartTimeString){
			var enddate = crew.getAsDateOrNull('finishdate');
			var endtime = crew.getAsDateOrNull('finishtime');
			var startdate = crew.getAsDateOrNull('startdate');
			var newStartTime = crew.getAsDateOrNull('starttime');
			
			if (startdate && newStartTime && enddate && endtime) {
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, newStartTime);
				var enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(enddate, endtime);
				this.checkDates(startdatetime, enddatetime);
				this.setDuration(crew, startdatetime, enddatetime);
			}
			
			var hours = crew.get('regularhours');
			// check if hours is null, if so set value to zero
			if (!hours){
				hours = 0;
				crew.set('regularhours',hours);
			}
			
			if (startdate && newStartTime){
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, newStartTime);
				//TODO: fix enddatetime to handle timezone correctly
				var enddatetime = new Date(startdatetime.getTime() + DateTimeUtil.fromHoursToMilliseconds(hours));
				//Note: sometimes due to calculations, the time comes out just shy of the minute
				enddatetime = DateTimeUtil.roundToNearestMinute(enddatetime);
				crew.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(enddatetime));
	            crew.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(enddatetime));
			}
		},
		
		startDateChanged: function(crew, newStartDateString){
			
			var enddate = crew.getAsDateOrNull('finishdate');
			var endtime = crew.getAsDateOrNull('finishtime');
			var newStartDate = crew.getAsDateOrNull('startdate');
			var starttime = crew.getAsDateOrNull('starttime');
			
			if (newStartDate && enddate) {
				var startdatetime = newStartDate;
				if (starttime) {
					startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(newStartDate, starttime);
				} 
				var enddatetime = endtime;
				if (endtime) {
					enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(enddate, endtime);
					this.setDuration(crew, startdatetime, enddatetime);
				}
				this.checkDates(startdatetime, enddatetime);
			}
			
			var hours = crew.get('regularhours');
			if (newStartDate && starttime){
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(newStartDate, starttime);
				//TODO: fix enddatetime to handle timezone correctly
				var enddatetime = new Date(startdatetime.getTime() + DateTimeUtil.fromHoursToMilliseconds(hours));
				//Note: sometimes due to calculations, the time comes out just shy of the minute
				enddatetime = DateTimeUtil.roundToNearestMinute(enddatetime);
				crew.setDateValue('finishdate', DateTimeUtil.fromDateTimeToDate(enddatetime));
	            crew.setTimestampValue('finishtime', DateTimeUtil.fromDateTimeToTime(enddatetime));				
			}
				
		},		
		
		finishDateChanged: function(crew, newFinishDateString){
			var newEndDate = crew.getAsDateOrNull('finishdate');
			var endtime = crew.getAsDateOrNull('finishtime');
			var startdate = crew.getAsDateOrNull('startdate');
			var starttime = crew.getAsDateOrNull('starttime');
			
			if (startdate && newEndDate) {
				if (endtime){
				var startdatetime = startdate;
				if (starttime) {
				    startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				}
				var enddatetime = newEndDate;
				if (endtime) {
					enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(newEndDate, endtime);
				}
				var duration = DateTimeUtil.fromHoursToMilliseconds(crew.get('regularhours'));
				this.checkDuration(startdatetime, enddatetime, duration);
				}
				else{
					this.checkDates(startdate, newEndDate)
				}
			}
		},
		
		finishTimeChanged: function(crew, newFinishTimeString){
			var enddate = crew.getAsDateOrNull('finishdate');
			var newEndTime = crew.getAsDateOrNull('finishtime');
			var startdate = crew.getAsDateOrNull('startdate');
			var starttime = crew.getAsDateOrNull('starttime');
			
			if (startdate && starttime && enddate && newEndTime) {
				var startdatetime = DateTimeUtil.fromDateAndTimeToDateTime(startdate, starttime);
				var enddatetime = DateTimeUtil.fromDateAndTimeToDateTime(enddate, newEndTime);
				var duration = DateTimeUtil.fromHoursToMilliseconds(crew.get('regularhours'));
				this.checkDuration(startdatetime, enddatetime, duration);
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
		
		setDuration: function(actualLabor, startTime, endTime) {
			/* avoids the situation where the timer was started as 1:00:50 and stopped ad 1:01:20 to count as 0 minutes */
//			startTime = DateTimeUtil.zeroSecondsAndMilliseconds(startTime);
//			endTime = DateTimeUtil.zeroSecondsAndMilliseconds(endTime);
			
			/* calculates the difference in integer minutes and add that to the start time */
//			actualLabor.setDurationInMillis("regularhours", endTime - startTime);
		}
	}
});
