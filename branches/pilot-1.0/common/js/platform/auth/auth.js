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

window.$ = WLJQ;

var myjsessionid;
var myjsessionidobj;

function getSecretData(){
	var invocationData = {
			adapter: "OSLCGenericAdapter",
			procedure: "getSecretData",
			parameters: []
	};
	
	WL.Client.invokeProcedure(invocationData, {
		onSuccess: getSecretData_Callback,
		onFailure: getSecretData_Callback
	});
}

/**
 * On successful login, WLSERVER sends back the response, which we have inserted the JSESSIONID
 * Lets use the JSESSIONID when querying maximo.
 * 
 * TODO: This code looks like it will be deprecated because the adapters already have a WL mechanism
 * to get to the JSESSIONID via the identity object.
 * 
 * @param response
 */
function getSecretData_Callback(response){

	var stringresponse = JSON.stringify(response);
	var parsestring = JSON.parse(stringresponse);
	
	var status = parsestring.status;
	
	$('#queryresults').html( '<p> status =' + status + '</p>');
	$('#queryresults4').html('<p> jsonObject =' + stringresponse + '</p>');
	
	var thePARSESTRING       = JSON.stringify(parsestring);
	var theJSESSIONIDJSON    = parsestring["invocationResult"]["WL-Authentication-Success"]["CustomAuthenticatorRealm"]["attributes"]["JSESSIONID"];
	var theJSESSIONIDSTRING  = JSON.stringify(theJSESSIONIDJSON);
	
	//var cookie = JSON.stringify(data1);
	
	// all this below is not necessary
	// use this Cookie=JSESSIONID=1JsLRW1LcHL8MtvKVyf5HnVB9ptdpM7zJbzH6pRQCk3nFpF316mT!1561480727
	//var sessionpart = data2.split("!")[0];
	//var jsessionid = sessionpart.split("=")[1];
	
	$('#queryresults1').html('<p> parsestring string =' + thePARSESTRING + '</p>');
	$('#queryresults2').html('<p> jessionid string    =' + theJSESSIONIDSTRING + '</p>');
	//$('#queryresults3').html('<p> sessionid   ='  + cookie + '</p>');
	
	myjsessionid = theJSESSIONIDSTRING;
	myjsessionidobj = theJSESSIONIDJSON;
}
	
/**
 * bind the getWorkorderList button to the method to send a query request to the adapter
 */


$('#getWorkorderList').bind('click', function (params) {

	var parameters = [
	                  {   "resource":"workOrder","queryBase":"getMyAssignedWork",
	                	  "searchFields":{"title":"string","assetShortTitle":"string","locationShortTitle":"string"},
	                	  "oslcSelect":"dcterms:title,oslc:shortTitle,oslc_wm:asset{oslc:shortTitle},oslc_wm:scheduledStartTime,oslc_wm:location{oslc:shortTitle},oslc_wm:status"
	                	  ,
	                	  "myjsessionid":myjsessionid
	                	  ,
	                	  "myjsessionidobj":myjsessionidobj
	                  }
	                  ];
	
	//var data2 = JSON.stringify(parameters);
	//$('#queryresults2').html('<p> json object before sending to query2 ='  + data2 + '</p>');
	
	
	var invocationData = {
		adapter:	'OSLCGenericAdapter',
		procedure:	'query2',
		parameters: parameters
	};
	WL.Client.invokeProcedure(invocationData, {
		onSuccess: getWorkorderList_Callback,
		onFailure: getWorkorderList_CallbackFail
	});
});

function getWorkorderList_Callback(response){

	var jsonTEXT = JSON.stringify(response);
	alert("RAW RESPONSE :: " + jsonTEXT);
	
	var jsonObject = JSON.stringify(response);
	var parsed = JSON.parse(jsonObject);
	var status = parsed.status;
	
	$('#queryresults').html('<p>' + status + '</p>');
	
	
}

function getWorkorderList_CallbackFail(response){
	alert("getSecretData_CallbackFail response :: " + JSON.stringify(response));
}
