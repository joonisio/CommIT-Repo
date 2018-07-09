define("platform/handlers/PushNotificationDialogHandler", 
	   [ "dojo/_base/declare",
	     "platform/format/FormatterService",
	     "platform/model/ModelService",
	     "platform/auth/UserManager",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/util/PlatformConstants",
	     "platform/store/SystemProperties",
	     "platform/util/DateTimeUtil"],
function(declare, formatterService, ModelService, UserManager, ApplicationHandlerBase , PlatformRuntimeException, PlatformRuntimeWarning, PlatformConstants, SystemProperties, DateTimeUtil) {
	return declare( ApplicationHandlerBase, {
		
/**@memberOf platform.handlers.PushNotificationDialogHandler */
		openRecord : function(eventContext) {
			var resource = eventContext.application.getResource('PlatformTempPushNotification').getCurrentRecord().get('resource');
			var recordId = eventContext.application.getResource('PlatformTempPushNotification').getCurrentRecord().get('recordId');
			var transitionTo = eventContext.application.getResource('PlatformTempPushNotification').getCurrentRecord().get('transitionTo');
			ModelService.byRef(resource, recordId).then(function(modelDataSet){
				if (WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD) {
					WL.Badge.setNumber(0);
				}
//			ModelService.filtered(resource, null, [{wonum: recordId}], null, true, true).then(function(modelDataSet){
					while(eventContext.ui.viewHistory[eventContext.ui.viewHistory.length-1].id != eventContext.application.ui.defaultView){
						eventContext.ui.viewHistory.pop();
					}
					//eventContext.application.ui.getViewFromId(eventContext.application.ui.defaultView).setQueryBaseIndexByQuery('__search_result__');
					/*var curWoList = eventContext.application.getResource(resource);
					curWoList.setCurrentIndexByRecord(modelDataSet.getCurrentRecord());*/
					eventContext.application.ui.getViewFromId(eventContext.application.ui.defaultView).onlyChangeQueryBaseIndex(PlatformConstants.SEARCH_RESULT_QUERYBASE);
					modelDataSet._queryBases = PlatformConstants.SEARCH_RESULT_QUERYBASE;
					eventContext.application.addResource(modelDataSet);
					eventContext.ui.hideCurrentDialog();
					eventContext.application.ui.show(transitionTo);
						});
			
		},
		
		close: function(eventContext){
			if (WL.Client.getEnvironment() == WL.Environment.IPHONE || WL.Client.getEnvironment() == WL.Environment.IPAD) {
				WL.Badge.setNumber(0);
			}
			eventContext.ui.hideCurrentDialog();
		},
		resolveMessageProps: function(eventContext) {
			var localPushInfo = eventContext.application.getResource('PlatformTempPushNotification').getCurrentRecord();
			
			var msgProp1 = localPushInfo.get('msgProp1');			
			var msgProp2 = localPushInfo.get('msgProp2');
			var msgProp3 = localPushInfo.get('msgProp3');
			
			if (msgProp1 == undefined || msgProp1 == null)
				msgProp1 = "";
			
			if (msgProp2 == undefined || msgProp2 == null)
				msgProp2 = "";
			
			if (msgProp3 == undefined || msgProp3 == null)
				msgProp3 = "";
			
			return [msgProp1, msgProp2, msgProp3];
		},
		renderOpen: function(eventContext){
			var curTempNotf = eventContext.application.getResource('PlatformTempPushNotification').getCurrentRecord();
			var msgType = curTempNotf.get('msgType');
			
			if(msgType =='alert' || 
					//Need to check and do not show Open button if we're not on the main view
					!eventContext.ui.isPrimaryViewShowing()){
				eventContext.setDisplay(false);
			}
			
		},
		
		openFromMsgHistory: function(eventContext) {
			var curRec = eventContext.application.getResource('osusernotification').getCurrentRecord();
			var jss = JSON.parse(curRec.get('notfeventmessage'));
			
			var resourceForEventSource = SystemProperties.getProperty(curRec.get('eventName')+'_resource');
			//var msgTypeForEventSource = SystemProperties.getProperty(curRec.get('eventName')+'_msgType');
			var transitionToForEventSource = SystemProperties.getProperty(curRec.get('eventName')+'_transitionTo');
			
			var resource = resourceForEventSource;
			var recordId = jss['rdf:about'];
			var transitionTo = transitionToForEventSource;
			ModelService.byRef(resource, recordId).then(function(modelDataSet){
//			ModelService.filtered(resource, null, [{wonum: recordId}], null, true, true).then(function(modelDataSet){
					while(eventContext.ui.viewHistory[eventContext.ui.viewHistory.length-1].id != eventContext.application.ui.defaultView){
						eventContext.ui.viewHistory.pop();
					}
					//eventContext.application.ui.getViewFromId(eventContext.application.ui.defaultView).setQueryBaseIndexByQuery('__search_result__');
					/*var curWoList = eventContext.application.getResource(resource);
					curWoList.setCurrentIndexByRecord(modelDataSet.getCurrentRecord());*/
					eventContext.application.ui.getViewFromId(eventContext.application.ui.defaultView).onlyChangeQueryBaseIndex(PlatformConstants.SEARCH_RESULT_QUERYBASE);
					modelDataSet._queryBases = PlatformConstants.SEARCH_RESULT_QUERYBASE;
					eventContext.application.addResource(modelDataSet);
					eventContext.ui.hideCurrentDialog();
					eventContext.application.ui.show(transitionTo);
						});
		},
		
		renderMsgHistoryItem: function(eventContext) {
			//var resourceForEventSource = SystemProperties.getProperty('resourceForEventSource');
			var jss = eventContext.application.getResource('osusernotification').getCurrentRecord();
			var notDate = new Date(jss.get('notifDate'));
			var enventMsg = JSON.parse(jss.get('notfeventmessage'));
			jss.set('itemnum', enventMsg['oslc:shortTitle']);
			jss.set('itemDesc',enventMsg['dcterms:title']);
			jss.setDateValue('uiDate',notDate);
		},
		
		renderMsgHistory: function(eventContext) {
			var osusernotification = eventContext.application.getResource('osusernotification');
			var appName = WL.Client.getAppProperty(WL.AppProperty.APP_DISPLAY_NAME).toUpperCase().replace(/\s+/g, '');
			osusernotification.filter('appid == $1', appName);
			eventContext.application.ui.getViewFromId('Platform.Notifications').lists[0].refresh();
		}
		
	});
});
