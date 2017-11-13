define("generated/application/pushNotification/PushNotificationSelfRegistrationGenerated",
["dojo/_base/declare",
"dojo/Deferred",
"dojo/_base/lang",
"dojo/_base/array",
"platform/pushNotification/PushNotificationService",
"platform/store/SystemProperties"
],
function(declare, Deferred, lang, arrayUtil,PushNotificationService, SystemProperties) {
   return declare(null, {
      register: function(){
         var pushInstForWEEMERGENCYWORK = new PushNotificationService();
         pushInstForWEEMERGENCYWORK.registerEventSourceCallback("WorkExecution_NotificationGenericAdapter","WEEMERGENCYWORK");
         pushInstForWEEMERGENCYWORK.doSubscribe("WEEMERGENCYWORK");
         SystemProperties.setProperty('WEEMERGENCYWORK_resource','workOrder' ,true);
         SystemProperties.setProperty('WEEMERGENCYWORK_transitionTo','WorkExecution.WorkDetailView' ,true);
      },
   });
});
