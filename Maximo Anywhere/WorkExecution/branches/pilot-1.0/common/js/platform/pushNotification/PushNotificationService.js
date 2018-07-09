define("platform/pushNotification/PushNotificationService",
["dojo/_base/declare",
 "dojo/Deferred",
 "dojo/_base/lang",
 "dojo/_base/array",
 "platform/model/ModelService",
 ], 
function(declare, Deferred, lang, arrayUtil, ModelService) {
	// needed to keep here because of UT
	(function(){
		if(typeof WL === "undefined"){
			WL = {};
			WL.Client.Push={};
			WL.Client.Push.prototype.onReadyToSubscribe = function(){ };
			WL.Client.Push.prototype.registerEventSourceCallback = function(alias, adapter, eventSource, callback){ onSuccess(); };
			
		}
		/*if (WL.Client.Push) {	
			WL.Client.Push.onReadyToSubscribe = function() {
				WL.Client.Push.registerEventSourceCallback(
					"myPush", 
					"PushAdapter", 
					"PushEventSource", 
					function(){alert();});
			};
			
		}*/
	})();
		
	return declare(null, {
		
		_custonDoSubscribeSuccess: null,
		_custonDoSubscribeFailure: null,
		
/**@memberOf platform.pushNotification.PushNotificationService */
		setCustonDoSubscribeSuccess: function(custonDoSubscribeSuccess){
			this._custonDoSubscribeSuccess = custonDoSubscribeSuccess;
		},
		setCustonDoSubscribeFailure: function(custonDoSubscribeFailure){
			this._custonDoSubscribeFailure = custonDoSubscribeFailure;
		},
		
		//-----------------------------register app to a eventSource
		 registerEventSourceCallback: function(adapter, eventSource, notificationReceivedListener){
			 if (WL.Client.Push) {	
//					WL.Client.Push.onReadyToSubscribe = function() {
						WL.Client.Push.registerEventSourceCallback(
							eventSource, 
							adapter, 
							eventSource, 
							notificationReceivedListener ? notificationReceivedListener : this.pushNotificationReceived);
//					};
					
				} 
		 },
		 
		 //-------------------------------Subscribe user to receive push notifications
		 doSubscribe: function(eventSourceAlias) {
			 if (WL.Client.Push) {
				WL.Client.Push.subscribe(eventSourceAlias, {
					onSuccess: this._custonDoSubscribeSuccess ? this._custonDoSubscribeSuccess : this.doSubscribeSuccess,
					onFailure: this._custonDoSubscribeFailure ? this._custonDoSubscribeFailure : this.doSubscribeFailure
				});
			 }
				
			},
			
		laterDisplayNotification: function(){
			var deferred = new Deferred();
			ModelService.all('PlatformTempPushNotification', null).then(
					function(modelDataSet) {
							var tempDowntimeResource = modelDataSet.getCurrentRecord();
							if(tempDowntimeResource && tempDowntimeResource.get('afterLogin')){
								tempDowntimeResource.set('afterLogin',false);
								ModelService.save(modelDataSet).then(
										function(){
											deferred.resolve(true);
										});
									
								} else {
									deferred.resolve(false);
								}
							});
			return deferred.promise;
		},
			
		doSubscribeSuccess: function() {
				//alert("doSubscribeSuccess");
		},

		doSubscribeFailure: function() {
				//alert("doSubscribeFailure");
		},
			
		//------------------------------Subscribe to a tag notification
		doTagSubscribe: function(tagName) {
				WL.Client.Push.subscribeTag( tagName, {
					onFailure : this.tagSubscriptionError,
					onSuccess: this.tagSubscriptionSuccess});
		},

		tagSubscriptionError: function(response) {
			alert("tag Error " + response.errorMsg);
		},

		tagSubscriptionSuccess: function(success) {
				alert("Tag Success " );
		},
		
		//------------------------------- Unsubscribe ---------------------------------------
		doUnsubscribe: function() {
			WL.Client.Push.unsubscribe("myPush", {
				onSuccess: this.doUnsubscribeSuccess,
				onFailure: this.doUnsubscribeFailure
			});
		},

		doUnsubscribeSuccess: function() {
			alert("doUnsubscribeSuccess");
		},

		doUnsubscribeFailure: function() {
			alert("doUnsubscribeFailure");
		},
		//tag Unsubscribe
		doTagUnsubscribe: function(tagName) {
			WL.Client.Push.unsubscribeTag( tagName, {
				onFailure : this.doTagUnsubscribeFailure,
				onSuccess: this.doTagUnsubscribeSuccess});
		},
		
		doTagUnsubscribeSuccess: function() {
			alert("doTagUnsubscribeSuccess");
		},

		doTagUnsubscribeFailure: function() {
			alert("doTagUnsubscribeFailure");
		},
		
		//---------------------default method to receive notification and send to all device os specific User 	
		pushNotificationReceived : function(props, payload) {
			ModelService.all('PlatformTempPushNotification', null).then(
				function(modelDataSet) {
						var tempDowntimeResource = modelDataSet.getCurrentRecord();
						tempDowntimeResource.set('recordId',payload.itemInfo['rdf:about']);
						tempDowntimeResource.set('resource',payload.resource);
						tempDowntimeResource.set('msgType',payload.msgType);
						tempDowntimeResource.set('transitionTo',payload.transitionTo);
						
						var msgSize = 0;
					    for(var field in payload.itemInfo){
					    	   
					    	   if(field != 'notificationmeta' && field != '_rowstamp' && field != 'rdf:about' && msgSize <3){
					    		   msgSize++;
					    		   tempDowntimeResource.set('msgProp' + msgSize,payload.itemInfo[field]);
					    	   }
					    	   
					    }
					      
					    while(msgSize <3){
					    	msgSize++;
				    		tempDowntimeResource.set('msgProp' + msgSize,'');
					    }
						
						// WL.application.addResource(modelDataSet);
						if(WL.application.ui.getCurrentView().id != "platform.LoginView"){
							tempDowntimeResource.set('afterLogin',false);
							ModelService.save(modelDataSet).then(
								function() {
									WL.application.ui.show('Platform.PushNotificationDialog');
								});	
						} else {
							tempDowntimeResource.set('afterLogin',true);
							ModelService.save(modelDataSet);/*.then(
								function() {
									WL.application.ui.show('Platform.PushNotificationDialog');
								});*/
						}

						});
			},
			
			
			//--------------------send notification from Device
			sendNotificaiton: function (adapterName, adapterMethod, notificationEventSource, userId, message)
			{

				var invocationData= {
						adapter:	adapterName,
						procedure:	adapterMethod,									
						parameters: [adapterName,notificationEventSource, userId, message]	
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
	
		
	
	});
});
