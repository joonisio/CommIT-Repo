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

var perfStore = null;// Store Time Track Information 
var trackTimeEnabled = false;//Control the enablement fo Time Track functions

require(["dojo/cookie"],function(cookie){
	if(!localStorage.trackTimeEnabled  || localStorage.trackTimeEnabled == "false" )	{
		trackTimeEnabled = false;
	}	else{
		trackTimeEnabled = true;
	}
});

//class used to mensure the comsuming time 
function TrackTime(componentName,method, description, isSync)
{   
	
	if(trackTimeEnabled){
		this.componentName=componentName;
		this.start=null;
		this.stop=null;
		this.elapsed=null;
		this.method=method;
		this.description=description;
		this.isSync = isSync;
	}
	
	//start tracking used to strat the time track
	this.startTracking=startTracking;
	function startTracking(){
		if(trackTimeEnabled){
			this.start=new Date().getTime();
		}
	}
	
	//stop tracking, used to stop the time mensure. In async function can be inserted inside of callback function. 
	this.stopTracking=stopTracking;
	function stopTracking(){
		if(trackTimeEnabled){
			this.stop=new Date().getTime();
			this.elapsed =  this.stop - this.start;
			
			if(perfStore ==  null){
				var perfData = [
				                {componentName:this.componentName , method:this.method, description:this.description ,start:this.start,
				                	stop:this.stop, elapsed:this.elapsed, isSync: this.isSync}];
				perfStore= new dojo.store.Memory({data: perfData});
			} else {
				perfStore.put({componentName:this.componentName , method:this.method, description:this.description  ,start:this.start,
					stop:this.stop, elapsed:this.elapsed, isSync: this.isSync});
			}
		}
	}
}
