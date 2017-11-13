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

define(
		"platform/util/CurrentTimeProvider",
		[ "dojo/_base/declare", 
		  "dojo/_base/lang",
		  "platform/store/SystemProperties",
		  "platform/util/DataValidator",
		  "platform/logging/Logger"],
		function(declare, lang, SystemProperties,DataValidator, Logger) {
			return {
				name: 'CurrentTimeProvider',
/**@memberOf platform.util.CurrentTimeProvider */
				getCurrentTime : function(provider) {
					var localMilli = Date.parse(new Date());
					var delta = this.getTimeAdjustmentByProvider(provider);
					var resDate = (localMilli + delta);
					
					return new Date(resDate);
				},
				getCurrentTime : function() {
					var localMilli = Date.parse(new Date());
					var delta = this.getTimeAdjustmentByProvider('');
					var resDate = (localMilli + delta);
					
					return new Date(resDate);				
				},
				getTimeAdjustmentByProvider : function(provider){

	                var delta = 0;
	                
	                try{	
	                	delta = SystemProperties.getProperty(provider+"_serverTimeAdjustment");
	                	
	                	//check if delta is an integer
						if(!DataValidator.isDataTypeCompatibleWithValue("integer", delta))
							throw "Invalid time adjustment value::"+delta;
	                	
	                }catch(err){
	                	Logger.log("Error retrieving date adjustment from DB. Using 0 as default." + err);
	                	delta = 0;
	                }
	                					
					return delta;
				},
				setTimeAdjustment : function(provider, beginTrans, endTrans, operationCost, serverDate ){

					try{
						
						//TODO
						//test if serverDate is null
						
					}catch(err){
						Logger.log("Error receiving server datetime."+ err)
					}		
						
					var delta = 0;  // in milliseconds
					var serverTimeInMillis = Date.parse(serverDate);
	                var diffTimeInMillis = endTrans - beginTrans;
	                delta = (serverTimeInMillis - diffTimeInMillis) - Date.parse(new Date());
				
					SystemProperties.setProperty(provider+"_serverTimeAdjustment", delta, true);
				}
			};
		});
