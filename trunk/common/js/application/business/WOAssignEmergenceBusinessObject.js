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
 

define("application/business/WOAssignEmergenceBusinessObject",
	   [ "dojo/_base/declare",
	     "dojo/Deferred",
	     "dojo/_base/lang",
	     "dojo/_base/array"
	     ],
function(declare, lang, arrayUtil ) {
	return declare( null, {

		/*
		 */
		//Initialize ReportDowntime view
/**@memberOf application.business.WOAssignEmergenceBusinessObject */
		receiveEmergenceWONotification: function(props, payload) {
			//alert("pushNotificationReceived invoked");
			alert("props :: " + JSON.stringify(props));
			alert("payload :: " + JSON.stringify(payload));
			self = this;
			var alerttext = props.alert;
			//payload.platformInfo.notificationType
			
			//alert("alerttext " + alerttext + "where " + alerttext.indexOf("Rejected"));
			if (payload.platformInfo.notificationType == 'alert' )
			{	

				WL.SimpleDialog.show("Push Notifications", props.alert, 
						[{
							text : 'OK',
							//handler : function() {alert('Open workorder');}
						}]
						/*,
						{
							text: 'Reject',
							handler : function() {sendConfrimNotificaiton('Rejected by Wilson: I am doing critical Job Can not Accpet it at this point ');}
						}]*/
					);

			}
				
			else 
			{
				WL.SimpleDialog.show("Push Notifications", props.alert, 
						[{
							text : 'Accept',
							handler : function() {alert('Open workorder'); 
													//self.sendNotificaiton('','','WorkOrder 1001 Accepted by Wilson');
													var message = 'WorkOrder 1001 Accepted by Wilson';
													var invocationData= {
															adapter:	'PushAdapter',
															procedure:	'submitNotification',									
															parameters: ['supervisor',message]	
													};
									
									
													WL.Client.invokeProcedure(invocationData, {
														onSuccess: function(response) {
															//alert("Success");
														},
														onConnectionFailure: function(response) {
															alert("Connection Fail");
														},
														onFailure: function(response) {
															alert("Fail");
														}
													});
							
							}
						},
						{
							text: 'Reject',
							handler : function() {
													//self.sendNotificaiton('','','Rejected by Wilson: I am doing critical Job Can not work on it at this point ');
													var message = 'Rejected by Wilson: I am doing critical Job Can not work on it at this point ';
													var invocationData= {
															adapter:	'PushAdapter',
															procedure:	'submitNotification',									
															parameters: ['supervisor',message]	
													};
									
									
													WL.Client.invokeProcedure(invocationData, {
														onSuccess: function(response) {
															//alert("Success");
														},
														onConnectionFailure: function(response) {
															alert("Connection Fail");
														},
														onFailure: function(response) {
															alert("Fail");
														}
													});
								}
						}]
					);
				 }	
		}

	});
});
