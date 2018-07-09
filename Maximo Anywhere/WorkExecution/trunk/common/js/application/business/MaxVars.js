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

define("application/business/MaxVars",
[ "dojo/_base/declare", 
  "dojo/Deferred",
  "platform/util/DateTimeUtil"], 
  function(declare, 
		   Deferred,
		   DateTimeUtil) {
	return {
/**@memberOf application.business.MaxVars */
		shouldInProgressWOWhenTimerStarted : function(maxVarsSet) {
			if(maxVarsSet){
				var result = maxVarsSet.find("varname == $1", 'STARTTIMERINPRG');
				if (result.length > 0) {
					return result[0].get("varvalue") == 1;
				}
			}
			return false;
		},

		isActualLaborDateValid: function(maxVarsSet, datetime, currentdatetime, orgid) {
			
			if(maxVarsSet){
			    var result = maxVarsSet.find("varname == $1 && orgid == $2", 'LABTRANSTOLERANCE', orgid);
				var laborTime = DateTimeUtil.zeroSecondsAndMilliseconds(datetime);
				var currentTime = DateTimeUtil.zeroSecondsAndMilliseconds(currentdatetime);
				
			    if (result.length > 0) {
			    	//Validation: the date value cannot exceed the current date + future tolerance
					var tolerance =  result[0].get("varvalue");
															
					if (tolerance) 
						return(laborTime.getTime() <= (currentTime.getTime() + DateTimeUtil.fromDurationToMilliseconds(tolerance)));
			    	
			    }
		    }
		    return false;
	    },
	    
	    canEditCalPointsAfterAFStatusSet: function(maxVarsSet, orgid) {
			if(maxVarsSet){
				var result = maxVarsSet.find("varname == $1 && orgid == $2", 'PLUSCMOBREADONLY', orgid);
				if (result.length > 0) {
					return result[0].get("varvalue") == 0;
				}
			}
			return false;
	    },
	    
	    autoUpdateDataSheetStatus: function(maxVarsSet, orgid) {
			if(maxVarsSet){
				var result = maxVarsSet.find("varname == $1 && orgid == $2", 'PLUSCAUTOSTATUS', orgid);
				if (result.length > 0) {
					return result[0].get("varvalue") == 1;
				}
			}
			return false;
	    },
	    
	    /*
	     * PLUSCPASTDUEVAL 	0 	Allow past due tools to be entered.
	     * 					1 	Prevent past due tools from being entered.
		 *						(Default).
	     */
	    prohibitPastDueTools: function(maxVarsSet, orgid) {
			if(maxVarsSet){
				var result = maxVarsSet.find("varname == $1 && orgid == $2", 'PLUSCPASTDUEVAL', orgid);
				if (result.length > 0) {
					return result[0].get("varvalue") == 1;
				}
			}
			return false;
	    },
	    
	    /*
	     *	PLUSCQUALTECH 	0 	No validation between the Tool and Technician field. 
	     *						This will be the default setting.
	     * 					1 	Validation but a warning message. Still allow a technician to be entered if not qualified.  
	     *						Warning message The technician is unqualified to use this tool.
	     * 				 	2 	Validation, but enforce the relationship between tool and technician. If the technician is 
	     *						not qualified then they cannot be entered. However, it is not a required field, as some tools 
	     *						do not need qualified technicians. Only enforce this relationship if user enters in a technician. 
	     *						Error message The technician is unqualified to use this tool.
	     */
	    isTechValidForTool: function(maxVarsSet, orgid) {
			var returnVal = 0;
			if(maxVarsSet){
				var result = maxVarsSet.find("varname == $1 && orgid == $2", 'PLUSCQUALTECH', orgid);
				if (result.length > 0) {
					returnVal = result[0].get("varvalue");
				}
				else{
					returnVal = 0;
				}
			}
			return returnVal;
	    },
	    
	    /*
	     * PLUSCVALTOOL 0	No validation between the Tool and the status of the Work Order.
		 *				1 	Validation but a warning message.
		 *					Still allow the status to change but give a message:
		 *					A tool was not entered for the work order. Enter a tool before changing the status of the work order.
		 *				2 	Validate and enforce the relationship between a tool being added and setting the status of the Work Order 
		 *					to CLOSED or COMP. If no tool added message:
		 *					A tool was not entered for the work order. Enter a tool before changing the status of the work order. 
		 *					Cannot set the status to CLOSED or COMP until a tool has been added. 
		 *					This is the default value.
	     */
	    isStatusValidForTool: function(maxVarsSet, orgid) {
			var returnVal = 2;
			if(maxVarsSet){
				var result = maxVarsSet.find("varname == $1 && orgid == $2", 'PLUSCVALTOOL', orgid);
				if (result.length > 0) {
					returnVal = result[0].get("varvalue");
				}
				else{
					returnVal = 2;
				}
			}
			return returnVal;
	    },
	    
	};
});
