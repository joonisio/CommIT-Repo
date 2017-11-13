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

define("application/business/WorkOrderTimer", 
[ "application/business/WorkOrderObject",
  "platform/model/ModelService",  
  "platform/util/DateTimeUtil",
  "application/business/MaxVars",
  "platform/translation/MessageService",  
  "platform/util/DateTimeUtil",
  "dojo/date/stamp",
  "application/business/ActualLaborObject",
  "platform/logging/Logger"], 
  function(WorkOrderObject,
		  ModelService, 
		  DateTimeUtil, 
		  MaxVars, 
		  MessageService, 		  
		  DateTimeUtil, 
		  dateISOFormatter,
		  ActualLaborObject,
		  Logger) {
	return {
/**@memberOf application.business.WorkOrderTimer */
		onInitialize : function(woTimer) {		
			Logger.trace("initializing workOrderTimer: " + woTimer);
		},
		onAdd: function(woTimer) {
			this.resetTimer(woTimer);
			woTimer.set("resetOnCleanup",false);
		},
		beforeSave : function(woTimer) {
			Logger.trace("Validating workOrderTimer: "+ woTimer);			
		},
		appValidate: function(woTimer) {
			var startTime = woTimer.getAsDateOrNull("startTime");				
			var endTime = woTimer.getAsDateOrNull("endTime");
			var duration = woTimer.getDurationInMillisOrNegative("duration");
			ActualLaborObject.checkDates(startTime, endTime);
			ActualLaborObject.checkDuration(startTime, endTime, duration);
		},
		resetTimer: function(woTimer){	
			Logger.trace("[WorkOrderTimer] reseting timer");
			woTimer.setNullValue("wonum");
			woTimer.setNullValue("startTime");
			woTimer.setNullValue("endTime");
			woTimer.setNullValue("duration");
			woTimer.setNullValue("workOrderId");
		},
		startTimerForNextWorkOrder: function(woTimer, startTime, oslcmaxvars, taskSet, nextWO){	
			Logger.trace("[WorkOrderTimer] startTimerForNextWorkOrder");
			var self = this;
				woTimer.setNullValue("nextWorkOrderId");
				try{
					Logger.trace("[WorkOrderTimer] startTimerForNextWorkOrder next found and been send to start");
					self.startTimerForWorkOrder(woTimer, nextWO, startTime, oslcmaxvars, true, taskSet);
					Logger.trace("[WorkOrderTimer] startTimerForNextWorkOrder next WO started");
				
				}catch(e){
					//throw e;
				}			
		},
		startTimerForWorkOrder: function(woTimer, workOrder, startTime, oslcmaxvars, startForNextWO, taskSet){
			Logger.trace("[WorkOrderTimer] startTimerForWorkOrder");
			// need to passdown the oslcmaxvars to see how we should start the timer
			//TODO: ideally we'd just lookup these olscmaxvars locally
			
			woTimer.set("workOrderId", workOrder.getRemoteId());
			
			//check the resetOnCleanup attribute to see if we're coming from startTimerForNextWorkorder 
			if (!startForNextWO) {
				Logger.trace("[WorkOrderTimer] dont need start next ");
				//go ahead and update the values here, because the user will not see the change				
				woTimer.set("wonum", workOrder.get("wonum"));
				woTimer.setDateValue("startTime", startTime);				
			} else {
				Logger.trace("[WorkOrderTimer] setting parameter to start next WO");
				//If we are starting for next workorder we want to update the values on cleanup so end user won't  
				//see the wonum and start time update when they click pause/complete/remove transaction
				woTimer.set("deferredWonum", workOrder.get("wonum"));
				woTimer.setDateValue("deferredStartTime", startTime);
			}	
			Logger.trace("[WorkOrderTimer] startTimerForWorkOrder calling startWorkWithTimer");
			WorkOrderObject.startWorkWithTimer(workOrder, startTime, MaxVars.shouldInProgressWOWhenTimerStarted(oslcmaxvars), taskSet);
			Logger.trace("[WorkOrderTimer] returning from startWorkWithTimer ");
		},
		
		stopTimerForWorkOrder: function(woTimer, workOrder, currentLabor, currentCraftRate, oslcmaxvars, laborTransactionTypeSet, timerStatus, taskSet, nextWO){
			Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder ");
			try {
				Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder calling  stopWorkWithTimer");
				WorkOrderObject.stopWorkWithTimer(workOrder, woTimer, currentLabor, currentCraftRate, true, laborTransactionTypeSet, timerStatus, taskSet);
				Logger.trace("[WorkOrderTimer] returning from stopWorkWithTimer");
			}catch(e){
				Logger.trace("[WorkOrderTimer] stopWorkWithTimer throw exception" + e);
				throw e;
			} finally {
				Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder executing finally");
				var newStartTime = woTimer.getAsDateOrNull("endTime");
				woTimer.set("resetOnCleanup",true);			
				if (woTimer.get("nextWorkOrderId")) {	
					try {
						Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder executing finally call startTimerForNextWorkOrder");
						this.startTimerForNextWorkOrder(woTimer, newStartTime, oslcmaxvars, taskSet, nextWO);
						Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder executing finally returing  startTimerForNextWorkOrder");
					}catch(e){
						Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder executing finally call startTimerForNextWorkOrder throw exception " + e);
						throw e;
					} finally {
						Logger.trace("[WorkOrderTimer] stopTimerForWorkOrder executing finally call startTimerForNextWorkOrder finally");
						woTimer.set("resetOnCleanup",false);
					}
				}
			}
			

		},
		pauseTimerForWorkOrder: function(woTimer, workOrder, currentLabor, currentCraftRate, oslcmaxvars, laborTransactionTypeSet, timerStatus, taskSet, nextWO){
			Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder");
			try {
				Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder call stopWorkWithTimer");
				WorkOrderObject.stopWorkWithTimer(workOrder, woTimer, currentLabor, currentCraftRate, false, laborTransactionTypeSet, timerStatus, taskSet);
				Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder return from stopWorkWithTimer");
			}catch(e){
				Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder throw " + e);
				throw e;
			} finally {
				Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder finally");
				var newStartTime = woTimer.getAsDateOrNull("endTime");
				woTimer.set("resetOnCleanup",true);
				if (woTimer.get("nextWorkOrderId")) {	
					try {
						Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder finally call startTimerForNextWorkOrder");
						this.startTimerForNextWorkOrder(woTimer, newStartTime, oslcmaxvars, taskSet, nextWO);
						Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder finally return startTimerForNextWorkOrder");
					}catch(e){
						Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder finally return startTimerForNextWorkOrder" + e );
						throw e;
					} finally {
						Logger.trace("[WorkOrderTimer] pauseTimerForWorkOrder finally startTimerForNextWorkOrder");
						woTimer.set("resetOnCleanup",false);
					}
				}
			}
			
		},
		cancelTimerForWorkOrder: function(woTimer, workOrder, oslcmaxvars, taskSet, nextWO){			
			WorkOrderObject.cancelWorkWithTimer(workOrder);
			var newStartTime = woTimer.getAsDateOrNull("endTime");
			woTimer.set("resetOnCleanup",true);
			if (woTimer.get("nextWorkOrderId")) {					
				this.startTimerForNextWorkOrder(woTimer, newStartTime, oslcmaxvars, taskSet, nextWO);
				woTimer.set("resetOnCleanup",false);
			}			
		},		
		startTimeChanged: function(woTimer, newStartTime){		
			var endTime = woTimer.getAsDateOrNull("endTime");
			var newStartTimeDate = dateISOFormatter.fromISOString(newStartTime);
			if(newStartTimeDate && endTime){								
				ActualLaborObject.checkDates(newStartTimeDate, endTime);
				this.setDuration(woTimer, newStartTimeDate, endTime);
			}
		},
		endTimeChanged: function(woTimer, newEndTime){			
			var startTime = woTimer.getAsDateOrNull("startTime");	
			var newEndTimeDate = dateISOFormatter.fromISOString(newEndTime);
			if(newEndTimeDate && startTime){							
				ActualLaborObject.checkDates(startTime, newEndTimeDate);
				this.setDuration(woTimer, startTime, newEndTimeDate);
			}
		},
		durationChanged: function(woTimer, newDuration){
			if(newDuration){
				var startTime = woTimer.getAsDateOrNull("startTime");
				var endTime = woTimer.getAsDateOrNull("endTime");				
				ActualLaborObject.checkDuration(startTime, endTime, DateTimeUtil.fromHoursToMilliseconds(newDuration));
			}
		},
		setDuration: function(woTimer, startTime, endTime) {
			/* avoids the situation where the timer was started as 1:00:50 and stopped ad 1:01:20 to count as 0 minutes */
			startTime = DateTimeUtil.zeroSecondsAndMilliseconds(startTime);
			endTime = DateTimeUtil.zeroSecondsAndMilliseconds(endTime);
			
			/* calculates the difference in integer minutes and add that to the start time */
			woTimer.setDurationInMillis("duration", endTime - startTime);
		},
		/*  
		 * Copies the deferred times to the actual wonum and starttime fields, used to keep the timer view
		 * from showing the new times
		 */
		copyDeferredToWoNum: function(woTimer) {
			var defWonum = woTimer.get("deferredWonum");
				var defStartTime = woTimer.getAsDateOrNull("deferredStartTime");
				if (defWonum && defStartTime) {
				    //Copy from deferredWonum and deferredStartTime to the wonum and startTime fields
				    woTimer.set("wonum",defWonum);
				    woTimer.setDateValue("startTime",defStartTime);
				    woTimer.setNullValue("deferredWonum");
				    woTimer.setNullValue("deferredStartTime");
				}
				else {
					// handle back
					woTimer.setDateValue('startTime', this._originalStartTime);
				}
		}
	};
});
